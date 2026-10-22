"""
Feature engineering for insurance risk scoring.
Transforms raw assessment data into ML-ready feature vectors.

MISSING DATA STRATEGY:
  - Income / Credit → 0.0 (worst case). Mandatory fields — hiding = risk signal.
  - BMI, exercise, driving years, etc → training data mean (neutral).
    The feature contributes ~0 to the score; the data_completeness penalty
    (+12 pts max) handles the punishment for not providing data.
  - Alternative data (telematics, behavioral, lifestyle) → 0.3 (below avg).
    Haven't opted in yet — slight penalty, not full.

This avoids both fabricating data (smart defaults) and double-penalizing
(worst-case + completeness penalty together).
"""

import os
import csv
import numpy as np

# ── Training data means (loaded once per policy type) ───────────
_training_means_cache: dict[str, dict[str, float]] = {}
_MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

def _get_training_means(policy_type: str) -> dict[str, float]:
    """
    Load the mean of each feature column from the training CSV.
    These are the model's own "average person" — no demographic guessing.
    Cached after first load.
    """
    if policy_type in _training_means_cache:
        return _training_means_cache[policy_type]

    csv_path = os.path.join(_MODELS_DIR, f"{policy_type}_data.csv")
    try:
        with open(csv_path, "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            raise FileNotFoundError
        means = {}
        for col in rows[0].keys():
            vals = []
            for r in rows:
                try:
                    vals.append(float(r[col]))
                except (ValueError, TypeError):
                    pass
            if vals:
                means[col] = sum(vals) / len(vals)
        _training_means_cache[policy_type] = means
        return means
    except Exception:
        _training_means_cache[policy_type] = {}
        return {}


# ── Feature definitions per policy type ──
HEALTH_FEATURES = [
    "age", "gender_encoded", "income_normalized", "credit_score_normalized",
    "existing_policies", "bmi", "smoking_encoded", "exercise_freq",
    "medical_conditions_count", "family_history_count",
    "telematics_score_norm", "behavioral_score_norm",
    "lifestyle_score_norm", "social_media_risk_encoded",
    "job_stability_norm", "data_completeness",
]

AUTO_FEATURES = [
    "age", "gender_encoded", "income_normalized", "credit_score_normalized",
    "existing_policies", "driving_years", "accidents_last_5",
    "traffic_violations", "vehicle_age", "daily_commute",
    "telematics_score_norm", "behavioral_score_norm",
    "lifestyle_score_norm", "social_media_risk_encoded",
    "job_stability_norm", "data_completeness",
]

LIFE_FEATURES = [
    "age", "gender_encoded", "income_normalized", "credit_score_normalized",
    "existing_policies", "smoking_encoded", "exercise_freq", "bmi",
    "dependents", "family_history_count",
    "telematics_score_norm", "behavioral_score_norm",
    "lifestyle_score_norm", "social_media_risk_encoded",
    "job_stability_norm", "data_completeness",
]

PROPERTY_FEATURES = [
    "age", "income_normalized", "credit_score_normalized",
    "existing_policies", "property_age", "property_value_normalized",
    "square_footage_normalized", "construction_type_encoded",
    "flood_zone_encoded", "security_encoded",
    "telematics_score_norm", "behavioral_score_norm",
    "lifestyle_score_norm", "social_media_risk_encoded",
    "job_stability_norm", "data_completeness",
]

FEATURE_MAP = {
    "health": HEALTH_FEATURES,
    "auto": AUTO_FEATURES,
    "life": LIFE_FEATURES,
    "property": PROPERTY_FEATURES,
}


def encode_smoking(val):
    mapping = {"never": 0, "former": 1, "current": 2}
    if isinstance(val, str):
        return mapping.get(val.lower(), 1)
    return 1  # unknown = moderate risk


def encode_gender(val):
    if isinstance(val, str):
        v = val.lower()
        if v in ("male", "m"):
            return 0
        if v in ("female", "f"):
            return 1
    return 0.5


def encode_social_media_risk(val):
    mapping = {"low": 0, "medium": 1, "high": 2}
    if isinstance(val, str):
        return mapping.get(val.lower(), 1)
    return 1.5  # unknown = slightly high risk


def encode_flood_zone(val):
    """Encode flood zone: none/no=0, low=1, moderate/yes=2, high=3."""
    if isinstance(val, str):
        v = val.lower().strip()
        if v in ("none", "no"):
            return 0
        if "low" in v:
            return 1
        if "moderate" in v or "mod" in v or v == "yes":
            return 2
        if "high" in v:
            return 3
    return 2  # unknown = moderate risk


def encode_construction(val):
    """Encode construction type: concrete/steel=0 (safest), brick=1, wood=2 (riskiest)."""
    if isinstance(val, str):
        v = val.lower().strip()
        if "concrete" in v or "rcc" in v or "steel" in v:
            return 0
        if "brick" in v:
            return 1
        if "wood" in v:
            return 2
    return 1  # unknown = moderate risk


def encode_security(val):
    """Encode security: none/no=0, basic=1, comprehensive/advanced/full=2."""
    if isinstance(val, str):
        v = val.lower().strip()
        if v in ("none", "no"):
            return 0
        if "basic" in v:
            return 1
        if "comprehensive" in v or "full" in v or "advanced" in v:
            return 2
    return 0  # unknown = no security


def safe_float(val, default=0.0):
    try:
        if val is None or val == "" or val == "Not provided":
            return default
        v = float(val)
        return v if not np.isnan(v) else default
    except (TypeError, ValueError):
        return default


def normalize_income(income_val):
    """Normalize income (INR): 0 or missing = 0.0 (high risk), ₹25L+ = 1.0 (low risk)."""
    v = safe_float(income_val, 0)
    if v <= 0:
        return 0.0  # No income = maximum risk
    return min(1.0, v / 2500000)


def normalize_credit(credit_val):
    """Normalize CIBIL score: 0 or missing = 0.0 (high risk), 900 = 1.0 (low risk)."""
    v = safe_float(credit_val, 0)
    if v <= 0:
        return 0.0  # No CIBIL score = maximum risk
    return max(0.0, min(1.0, (v - 300) / 600))


def normalize_alt_score(val):
    """Normalize alternative data score: missing = 0.3 (risky), provided = actual/100."""
    v = safe_float(val, -1)
    if v < 0:
        return 0.3  # Missing alt data = below average
    return v / 100.0


def calculate_completeness(assessment: dict, policy_type: str) -> float:
    """Score how complete the data is. Incomplete data = higher risk."""
    app = assessment.get("applicant", {})
    trad = assessment.get("traditionalData", {})
    alt = assessment.get("alternativeData", {})
    psd = assessment.get("policySpecificData", {})

    fields_present = 0
    total_fields = 0

    # Core fields
    for field in ["age", "gender", "occupation"]:
        total_fields += 1
        if app.get(field):
            fields_present += 1

    # Traditional
    for field in ["income", "creditScore"]:
        total_fields += 1
        val = trad.get(field)
        if val and safe_float(val, 0) > 0:
            fields_present += 1

    # Alternative
    for field in ["telematicsScore", "behavioralScore", "lifestyleScore", "jobStabilityScore"]:
        total_fields += 1
        if alt.get(field) is not None:
            fields_present += 1

    # Policy-specific (check at least 3 fields)
    psd_count = sum(1 for v in psd.values() if v is not None and v != "" and v != 0)
    total_fields += 3
    fields_present += min(3, psd_count)

    return fields_present / max(total_fields, 1)


def extract_features(assessment: dict, policy_type: str) -> np.ndarray:
    """
    Extract feature vector from an assessment document.
    Uses RAG-enhanced smart defaults: when data is missing, population
    averages for the applicant's demographic bracket are used instead
    of always assuming worst-case values.
    """
    app = assessment.get("applicant", {})
    trad = assessment.get("traditionalData", {})
    alt = assessment.get("alternativeData", {})
    psd = assessment.get("policySpecificData", {})

    completeness = calculate_completeness(assessment, policy_type)

    # ── Missing data strategy ──────────────────────────────────────
    # We use TRAINING DATA MEANS as neutral fill values for missing fields.
    # This ensures the missing feature contributes ~0 to the score (neutral),
    # while the data_completeness penalty (+12 pts max) handles punishment.
    #
    # Why NOT smart defaults (population avg by age bracket)?
    #   - Age alone can't predict BMI, exercise, or driving behaviour
    #   - A 25yo could have BMI 18 or 40 — using 23 is fabricated data
    #   - Training data mean is model-native: it's what the model considers
    #     "average" based on what it was trained on
    #
    # Why NOT worst-case for everything?
    #   - Income/Credit: YES worst-case (0.0) — mandatory disclosure fields,
    #     hiding = risk signal (adverse selection)
    #   - BMI/Exercise/etc: NO — these come from documents/IoT, not self-report.
    #     Punishing with worst-case AND completeness penalty is double-penalizing.
    #
    # Result: missing field → training mean (neutral) + completeness penalty
    # ────────────────────────────────────────────────────────────────
    td = _get_training_means(policy_type)

    has_income = trad.get("income") and safe_float(trad.get("income"), 0) > 0
    has_credit = trad.get("creditScore") and safe_float(trad.get("creditScore"), 0) > 300

    base = {
        "age": safe_float(app.get("age"), td.get("age", 40)),
        "gender_encoded": encode_gender(app.get("gender")),
        "income_normalized": normalize_income(trad.get("income")) if has_income else 0.0,
        "credit_score_normalized": normalize_credit(trad.get("creditScore")) if has_credit else 0.0,
        "existing_policies": safe_float(trad.get("existingPolicies"), 0),
        "telematics_score_norm": normalize_alt_score(alt.get("telematicsScore")),
        "behavioral_score_norm": normalize_alt_score(alt.get("behavioralScore")),
        "lifestyle_score_norm": normalize_alt_score(alt.get("lifestyleScore")),
        "social_media_risk_encoded": encode_social_media_risk(alt.get("socialMediaRisk")),
        "job_stability_norm": normalize_alt_score(alt.get("jobStabilityScore")),
        "data_completeness": completeness,
    }

    # Policy-specific features — training data means for missing values
    if policy_type == "health":
        med_hist = trad.get("medicalHistory", [])
        base.update({
            "bmi": safe_float(psd.get("bmi"), td.get("bmi", 27)),
            "smoking_encoded": encode_smoking(psd.get("smokingStatus")),
            "exercise_freq": safe_float(psd.get("exerciseFrequency"), td.get("exercise_freq", 2)),
            "medical_conditions_count": len(med_hist) if isinstance(med_hist, list) else 0,
            "family_history_count": len(psd.get("familyHealthHistory", "").split(",")) if psd.get("familyHealthHistory") else 0,
        })

    elif policy_type == "auto":
        base.update({
            "driving_years": safe_float(psd.get("drivingYears"), td.get("driving_years", 8)),
            "accidents_last_5": safe_float(psd.get("accidentsLast5"), td.get("accidents_last_5", 0)),
            "traffic_violations": safe_float(psd.get("trafficViolations"), td.get("traffic_violations", 1)),
            "vehicle_age": 2026 - safe_float(psd.get("vehicleYear"), 2020),
            "daily_commute": safe_float(psd.get("dailyCommute"), td.get("daily_commute", 25)),
        })

    elif policy_type == "life":
        base.update({
            "smoking_encoded": encode_smoking(psd.get("smokingStatus")),
            "exercise_freq": safe_float(psd.get("exerciseFrequency"), td.get("exercise_freq", 2)),
            "bmi": safe_float(psd.get("bmi"), td.get("bmi", 27)),
            "dependents": safe_float(psd.get("dependents"), 1),
            "family_history_count": len(psd.get("familyHistory", "").split(",")) if psd.get("familyHistory") else 0,
        })

    elif policy_type == "property":
        base.update({
            "property_age": safe_float(psd.get("propertyAge"), 15),
            "property_value_normalized": min(1.0, safe_float(psd.get("propertyValue"), 5000000) / 30000000),
            "square_footage_normalized": min(1.0, safe_float(psd.get("squareFootage"), 1000) / 3000),
            "construction_type_encoded": encode_construction(psd.get("constructionType")),
            "flood_zone_encoded": encode_flood_zone(psd.get("floodZone")),
            "security_encoded": encode_security(psd.get("securitySystem")),
        })

    features = FEATURE_MAP.get(policy_type, HEALTH_FEATURES)
    vector = [base.get(f, 0.0) for f in features]
    return np.array(vector, dtype=np.float64)


def get_feature_names(policy_type: str) -> list[str]:
    return FEATURE_MAP.get(policy_type, HEALTH_FEATURES)
