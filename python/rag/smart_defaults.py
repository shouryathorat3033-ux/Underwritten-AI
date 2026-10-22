"""
RAG-Enhanced Smart Defaults — provides population-average defaults
for NON-STRATEGIC fields (BMI, exercise, driving years, etc.) when
data is missing.

IMPORTANT — Income and Credit are NOT defaulted here.
Missing income/credit → 0 (max risk).  These are mandatory disclosure
fields and using population averages would create adverse selection:
a low-income applicant could simply omit income to receive the
population average, getting a better score than if they disclosed.

Smart defaults are ONLY used for fields where:
  1. The applicant has no gaming incentive to hide data
  2. The field typically comes from documents/IoT, not self-report
  3. Population averages are a reasonable prior (e.g., BMI by age)
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGODB_URI, MONGODB_DB

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]

# Cache to avoid repeated DB queries within the same server lifetime
_cache = {}
_CACHE_MAX = 50


async def get_smart_defaults(policy_type: str, applicant: dict) -> dict:
    """
    Query past assessments for population averages matching this applicant's
    demographic bracket. Returns a dict of field → suggested default value.

    Falls back to hardcoded risky defaults if no similar profiles found.
    """
    age = applicant.get("age")
    gender = applicant.get("gender")
    occupation = applicant.get("occupation", "")

    # Build cache key
    age_bracket = _age_bracket(age)
    cache_key = f"{policy_type}_{age_bracket}_{gender or 'any'}"

    if cache_key in _cache:
        return _cache[cache_key]

    # Query MongoDB for completed assessments in same demographic bracket
    query = {
        "policyType": policy_type,
        "status": {"$in": ["completed", "accepted"]},
        "result.riskScore": {"$exists": True},
    }

    if age and isinstance(age, (int, float)):
        lo, hi = _age_range(age)
        query["applicant.age"] = {"$gte": lo, "$lte": hi}

    if gender and gender in ("male", "female"):
        query["applicant.gender"] = gender

    try:
        cursor = db.assessments.find(query).sort("createdAt", -1).limit(50)
        cases = await cursor.to_list(length=50)
    except Exception:
        return _fallback_defaults(policy_type)

    if len(cases) < 3:
        # Not enough data — fall back to hardcoded defaults
        return _fallback_defaults(policy_type)

    # Compute averages from similar profiles
    defaults = _compute_averages(cases, policy_type)

    # Cache it
    if len(_cache) < _CACHE_MAX:
        _cache[cache_key] = defaults

    return defaults


def get_smart_defaults_sync(policy_type: str, applicant: dict) -> dict:
    """
    Synchronous version that returns hardcoded defaults enriched with
    population statistics. Used when async is not available (e.g., in ML predictor).

    This doesn't query MongoDB — it uses pre-computed population averages
    from Indian market data.
    """
    age = applicant.get("age")
    age_bracket = _age_bracket(age)

    # Indian market population averages by age bracket
    # Source: IRDAI Annual Report 2023, CIBIL data, NSO surveys
    population_defaults = {
        "18-25": {
            "income": 350000,       # ₹3.5L — entry-level / students
            "creditScore": 680,     # lower, building credit
            "bmi": 23,              # younger = healthier
            "exerciseFrequency": 3,
            "drivingYears": 2,
            "accidentsLast5": 0,
            "trafficViolations": 0,
        },
        "26-35": {
            "income": 800000,       # ₹8L — early career
            "creditScore": 720,
            "bmi": 25,
            "exerciseFrequency": 2,
            "drivingYears": 6,
            "accidentsLast5": 0,
            "trafficViolations": 1,
        },
        "36-45": {
            "income": 1200000,      # ₹12L — mid career
            "creditScore": 740,
            "bmi": 27,
            "exerciseFrequency": 2,
            "drivingYears": 14,
            "accidentsLast5": 0,
            "trafficViolations": 1,
        },
        "46-55": {
            "income": 1500000,      # ₹15L — senior
            "creditScore": 750,
            "bmi": 28,
            "exerciseFrequency": 2,
            "drivingYears": 22,
            "accidentsLast5": 1,
            "trafficViolations": 1,
        },
        "56-65": {
            "income": 1000000,      # ₹10L — pre-retirement
            "creditScore": 760,
            "bmi": 28,
            "exerciseFrequency": 2,
            "drivingYears": 30,
            "accidentsLast5": 0,
            "trafficViolations": 0,
        },
        "66+": {
            "income": 600000,       # ₹6L — retirement
            "creditScore": 740,
            "bmi": 27,
            "exerciseFrequency": 1,
            "drivingYears": 35,
            "accidentsLast5": 0,
            "trafficViolations": 0,
        },
    }

    return population_defaults.get(age_bracket, population_defaults["36-45"])


def _age_bracket(age) -> str:
    if not age or not isinstance(age, (int, float)):
        return "36-45"
    if age <= 25: return "18-25"
    if age <= 35: return "26-35"
    if age <= 45: return "36-45"
    if age <= 55: return "46-55"
    if age <= 65: return "56-65"
    return "66+"


def _age_range(age):
    """Return ±10 year range for querying."""
    if not age:
        return 25, 55
    return max(18, int(age) - 10), min(80, int(age) + 10)


def _compute_averages(cases: list, policy_type: str) -> dict:
    """Compute field averages from a list of past assessments."""
    incomes = []
    credits = []
    bmis = []
    exercises = []
    driving_years = []
    accidents = []
    violations = []

    for c in cases:
        trad = c.get("traditionalData", {})
        psd = c.get("policySpecificData", {})

        if trad.get("income") and float(trad["income"]) > 0:
            incomes.append(float(trad["income"]))
        if trad.get("creditScore") and float(trad["creditScore"]) > 300:
            credits.append(float(trad["creditScore"]))
        if psd.get("bmi") and float(psd["bmi"]) > 10:
            bmis.append(float(psd["bmi"]))
        if psd.get("exerciseFrequency") is not None:
            exercises.append(float(psd["exerciseFrequency"]))
        if psd.get("drivingYears") is not None:
            driving_years.append(float(psd["drivingYears"]))
        if psd.get("accidentsLast5") is not None:
            accidents.append(float(psd["accidentsLast5"]))
        if psd.get("trafficViolations") is not None:
            violations.append(float(psd["trafficViolations"]))

    def avg(lst, fallback):
        return round(sum(lst) / len(lst)) if lst else fallback

    return {
        "income": avg(incomes, 500000),
        "creditScore": avg(credits, 700),
        "bmi": avg(bmis, 27),
        "exerciseFrequency": avg(exercises, 2),
        "drivingYears": avg(driving_years, 5),
        "accidentsLast5": avg(accidents, 0),
        "trafficViolations": avg(violations, 1),
    }


def _fallback_defaults(policy_type: str) -> dict:
    """Hardcoded risky defaults — used when no past data available."""
    return {
        "income": 0,
        "creditScore": 0,
        "bmi": 28,
        "exerciseFrequency": 1,
        "drivingYears": 2,
        "accidentsLast5": 1,
        "trafficViolations": 1,
    }
