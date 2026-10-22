"""
Actuarial Premium Engine — GLM-style premium calculation.

Replaces the tier-based lookup with an industry-standard approach:
  Premium = Base Rate × Age Factor × Sum Assured Factor × Risk Loading
            × Geographic Factor × Policy Term Factor × Discount/Loading
            + Rider Costs + Expense Margin

Uses Indian mortality tables (IALM 2012-14) and IRDAI-published benchmarks.
"""

import math
from ml.features import safe_float

# ═══════════════════════════════════════════════════════════════
# INDIAN ACTUARIAL MORTALITY TABLE (IALM 2012-14, simplified)
# Deaths per 1,000 lives per year — used for life & health pricing
# ═══════════════════════════════════════════════════════════════
MORTALITY_RATE = {
    # age: (male_per_1000, female_per_1000)
    18: (0.73, 0.42), 20: (0.79, 0.45), 22: (0.84, 0.48),
    25: (0.88, 0.51), 28: (0.95, 0.56), 30: (1.02, 0.61),
    32: (1.13, 0.68), 35: (1.35, 0.82), 38: (1.68, 1.02),
    40: (2.02, 1.21), 42: (2.45, 1.45), 45: (3.18, 1.85),
    48: (4.12, 2.38), 50: (5.10, 2.92), 52: (6.25, 3.55),
    55: (8.15, 4.65), 58: (10.8, 6.12), 60: (13.5, 7.80),
    62: (16.8, 9.72), 65: (22.5, 13.2), 68: (30.0, 17.8),
    70: (38.5, 23.0), 75: (62.0, 38.5),
}

# ═══════════════════════════════════════════════════════════════
# MORBIDITY LOADING FACTORS (health insurance)
# ═══════════════════════════════════════════════════════════════
HEALTH_MORBIDITY = {
    # age_band: expected_claims_ratio (claims/premium)
    "18-25": 0.35, "26-35": 0.45, "36-45": 0.62,
    "46-55": 0.85, "56-65": 1.15, "66+": 1.55,
}

# ═══════════════════════════════════════════════════════════════
# MOTOR OD RATES (Own Damage — IRDAI published tariff bands)
# ═══════════════════════════════════════════════════════════════
MOTOR_OD_RATES = {
    # vehicle_age_band: rate_% of IDV
    "0-1": 3.20, "1-3": 3.40, "3-5": 3.60,
    "5-7": 3.80, "7-10": 4.10, "10+": 4.50,
}

# Third-party liability (IRDAI fixed annual rates, FY 2024-25)
MOTOR_TP_RATES = {
    "motorcycle": 1850, "sedan": 2094, "suv": 2094,
    "truck": 15746, "van": 7897, "sports": 2094,
}


def _interpolate_mortality(age: int, gender: str = "male") -> float:
    """Interpolate mortality rate from the IALM table."""
    idx = 0 if gender == "male" else 1
    ages = sorted(MORTALITY_RATE.keys())

    if age <= ages[0]:
        return MORTALITY_RATE[ages[0]][idx]
    if age >= ages[-1]:
        return MORTALITY_RATE[ages[-1]][idx]

    # Find bracketing ages
    for i in range(len(ages) - 1):
        if ages[i] <= age <= ages[i + 1]:
            a1, a2 = ages[i], ages[i + 1]
            r1, r2 = MORTALITY_RATE[a1][idx], MORTALITY_RATE[a2][idx]
            # Linear interpolation
            ratio = (age - a1) / (a2 - a1)
            return r1 + ratio * (r2 - r1)

    return 3.0  # fallback


def _health_age_band(age: int) -> str:
    if age <= 25: return "18-25"
    if age <= 35: return "26-35"
    if age <= 45: return "36-45"
    if age <= 55: return "46-55"
    if age <= 65: return "56-65"
    return "66+"


def _motor_age_band(vehicle_age: int) -> str:
    if vehicle_age <= 1: return "0-1"
    if vehicle_age <= 3: return "1-3"
    if vehicle_age <= 5: return "3-5"
    if vehicle_age <= 7: return "5-7"
    if vehicle_age <= 10: return "7-10"
    return "10+"


# ═══════════════════════════════════════════════════════════════
# PREMIUM CALCULATORS (GLM-style per policy type)
# ═══════════════════════════════════════════════════════════════

def calculate_premium(risk_score: int, policy_type: str, assessment: dict) -> dict:
    """
    Actuarial premium calculation using GLM-style formula.

    Returns: {min, max, breakdown}
    breakdown includes: base_rate, age_factor, risk_loading, discounts, etc.
    """
    calculators = {
        "health": _premium_health,
        "auto": _premium_auto,
        "life": _premium_life,
        "property": _premium_property,
    }
    calc = calculators.get(policy_type, _premium_health)
    return calc(risk_score, assessment)


def _premium_health(risk_score: int, assessment: dict) -> dict:
    """
    Health Insurance Premium (GLM approach):
    Premium = Base Rate × Age Factor × Sum Insured Factor
              × Risk Loading × Family Size × Zone × Discount
    """
    applicant = assessment.get("applicant", {})
    trad = assessment.get("traditionalData", {})
    psd = assessment.get("policySpecificData", {})
    alt = assessment.get("alternativeData", {})

    age = int(safe_float(applicant.get("age"), 35))
    gender = applicant.get("gender", "male")

    # 1. Base rate from morbidity table (expected claims cost)
    band = _health_age_band(age)
    claims_ratio = HEALTH_MORBIDITY[band]
    base_rate = 8000  # ₹8,000 base for ₹5L sum insured, age 25-35

    # 2. Age factor (from mortality + morbidity)
    mortality = _interpolate_mortality(age, gender)
    age_factor = max(0.6, mortality / 1.02)  # normalized to age-30 baseline

    # 3. Sum insured factor (default ₹5L)
    sum_insured = safe_float(psd.get("sumInsured"), 500000)
    si_factor = sum_insured / 500000  # linear scale from ₹5L base

    # 4. Risk loading from ML model (0.7x for low risk, up to 2.5x for critical)
    if risk_score <= 30:
        risk_loading = 0.7 + (risk_score / 30) * 0.3  # 0.7 - 1.0
    elif risk_score <= 55:
        risk_loading = 1.0 + ((risk_score - 30) / 25) * 0.5  # 1.0 - 1.5
    elif risk_score <= 75:
        risk_loading = 1.5 + ((risk_score - 55) / 20) * 0.8  # 1.5 - 2.3
    else:
        risk_loading = 2.3 + ((risk_score - 75) / 25) * 0.7  # 2.3 - 3.0

    # 5. Lifestyle factors
    smoking_load = 1.0
    smoking = psd.get("smokingStatus", "").lower()
    if smoking == "current":
        smoking_load = 1.40  # 40% surcharge — IRDAI allows up to 50%
    elif smoking == "former":
        smoking_load = 1.15

    bmi = safe_float(psd.get("bmi"), 24)
    bmi_load = 1.0
    if bmi > 35:
        bmi_load = 1.30
    elif bmi > 30:
        bmi_load = 1.15
    elif bmi < 18.5:
        bmi_load = 1.10

    # 6. No-claim bonus (NCB) — discount for existing policyholders
    existing = int(safe_float(trad.get("existingPolicies"), 0))
    ncb_discount = max(0.85, 1.0 - existing * 0.05)  # up to 15% discount

    # 7. Wellness / telematics discount
    wellness_discount = 1.0
    lifestyle = safe_float(alt.get("lifestyleScore"), 0)
    if lifestyle > 80:
        wellness_discount = 0.92  # 8% wellness discount
    elif lifestyle > 60:
        wellness_discount = 0.96

    # 8. Expense margin (IRDAI mandates: max 30% of premium for admin + commission)
    expense_ratio = 1.28  # 28% loading for expenses, admin, commission

    # Calculate
    net_premium = (
        base_rate
        * age_factor
        * si_factor
        * risk_loading
        * smoking_load
        * bmi_load
        * claims_ratio
        * ncb_discount
        * wellness_discount
        * expense_ratio
    )

    # GST @ 18% on health insurance
    gst_rate = 0.18
    gross_premium = net_premium * (1 + gst_rate)

    min_p = int(gross_premium * 0.85)
    max_p = int(gross_premium * 1.15)

    return {
        "min": max(min_p, 3000),
        "max": max(max_p, min_p + 1000),
        "breakdown": {
            "base_rate": base_rate,
            "age_factor": round(age_factor, 3),
            "sum_insured_factor": round(si_factor, 2),
            "risk_loading": round(risk_loading, 3),
            "smoking_loading": round(smoking_load, 2),
            "bmi_loading": round(bmi_load, 2),
            "ncb_discount": round(ncb_discount, 2),
            "wellness_discount": round(wellness_discount, 2),
            "expense_ratio": round(expense_ratio, 2),
            "gst_percent": 18,
            "net_premium": round(net_premium),
            "gross_premium": round(gross_premium),
            "method": "GLM_actuarial",
            "mortality_rate_per_1000": round(_interpolate_mortality(age, gender), 2),
            "morbidity_band": band,
        },
    }


def _premium_auto(risk_score: int, assessment: dict) -> dict:
    """
    Motor Insurance Premium (IRDAI tariff + risk-based OD):
    Premium = OD Premium (IDV × rate × NCB × risk) + TP Premium (fixed)
              + PA Cover + Rider costs
    """
    applicant = assessment.get("applicant", {})
    psd = assessment.get("policySpecificData", {})
    trad = assessment.get("traditionalData", {})
    alt = assessment.get("alternativeData", {})

    age = int(safe_float(applicant.get("age"), 35))

    # Vehicle details
    vehicle_year = int(safe_float(psd.get("vehicleYear"), 2020))
    vehicle_age = max(0, 2026 - vehicle_year)
    vehicle_type = (psd.get("vehicleType") or "sedan").lower()

    # IDV (Insured Declared Value) — depreciation table
    vehicle_value = safe_float(psd.get("vehicleValue"), 800000)  # default ₹8L
    depreciation = {0: 0.0, 1: 0.15, 2: 0.20, 3: 0.30, 4: 0.40, 5: 0.50}
    dep_rate = depreciation.get(min(vehicle_age, 5), 0.50)
    idv = vehicle_value * (1 - dep_rate)

    # 1. Own Damage premium
    od_band = _motor_age_band(vehicle_age)
    od_rate = MOTOR_OD_RATES[od_band] / 100
    od_premium = idv * od_rate

    # 2. Risk loading on OD
    if risk_score <= 30:
        risk_factor = 0.85
    elif risk_score <= 55:
        risk_factor = 1.0 + (risk_score - 30) / 50
    else:
        risk_factor = 1.5 + (risk_score - 55) / 30

    od_premium *= risk_factor

    # 3. NCB discount on OD (IRDAI mandated: 20%→25%→35%→45%→50%)
    accidents = int(safe_float(psd.get("accidentsLast5"), 0))
    if accidents == 0:
        existing = int(safe_float(trad.get("existingPolicies"), 0))
        ncb_slabs = [0, 0.20, 0.25, 0.35, 0.45, 0.50]
        ncb_rate = ncb_slabs[min(existing, 5)]
        od_premium *= (1 - ncb_rate)

    # 4. Telematics discount
    telematics = safe_float(alt.get("telematicsScore"), 0)
    if telematics > 80:
        od_premium *= 0.88  # 12% telematics discount
    elif telematics > 60:
        od_premium *= 0.94

    # 5. Third-party premium (IRDAI fixed rates)
    tp_premium = MOTOR_TP_RATES.get(vehicle_type, 2094)

    # 6. Personal accident cover (mandatory ₹15L @ ₹750/yr for owner-driver)
    pa_cover = 750

    # 7. Expense + commission
    total = od_premium + tp_premium + pa_cover
    total *= 1.12  # 12% expense loading

    # GST @ 18%
    gross = total * 1.18

    min_p = int(gross * 0.9)
    max_p = int(gross * 1.1)

    return {
        "min": max(min_p, 3000),
        "max": max(max_p, min_p + 1000),
        "breakdown": {
            "idv": round(idv),
            "od_rate_percent": round(MOTOR_OD_RATES[od_band], 2),
            "od_premium": round(od_premium),
            "risk_factor": round(risk_factor, 3),
            "ncb_applied": accidents == 0,
            "telematics_discount": "yes" if telematics > 60 else "no",
            "tp_premium": tp_premium,
            "pa_cover": pa_cover,
            "gst_percent": 18,
            "net_premium": round(total),
            "gross_premium": round(gross),
            "method": "IRDAI_tariff_plus_risk",
            "vehicle_idv": round(idv),
            "vehicle_depreciation_pct": round(dep_rate * 100),
        },
    }


def _premium_life(risk_score: int, assessment: dict) -> dict:
    """
    Life Insurance Premium (Mortality-based):
    Premium = (Mortality Rate × Sum Assured / 1000) × Policy Term Factor
              × Risk Loading × Expense Margin
    This is a pure term insurance pricing model.
    """
    applicant = assessment.get("applicant", {})
    psd = assessment.get("policySpecificData", {})
    trad = assessment.get("traditionalData", {})

    age = int(safe_float(applicant.get("age"), 35))
    gender = applicant.get("gender", "male")

    # Sum assured (default ₹50L for term plan)
    sum_assured = safe_float(psd.get("sumAssured") or psd.get("coverageAmount"), 5000000)

    # Policy term (default 20 years)
    policy_term = int(safe_float(psd.get("policyTerm"), 20))
    maturity_age = age + policy_term

    # 1. Mortality cost — average over policy term
    total_mortality_cost = 0
    for yr in range(policy_term):
        current_age = min(age + yr, 75)
        qx = _interpolate_mortality(current_age, gender) / 1000  # probability of death
        # Discount future mortality at 6.5% (Indian G-Sec rate)
        discount = 1 / ((1 + 0.065) ** yr)
        total_mortality_cost += qx * sum_assured * discount

    # Annualize the mortality cost
    annual_mortality = total_mortality_cost / policy_term

    # 2. Risk loading from ML
    if risk_score <= 30:
        risk_loading = 0.80
    elif risk_score <= 55:
        risk_loading = 1.0 + (risk_score - 30) / 50
    elif risk_score <= 75:
        risk_loading = 1.5 + (risk_score - 55) / 25
    else:
        risk_loading = 2.3 + (risk_score - 75) / 30

    # 3. Smoking surcharge (actuarial: smoker mortality 2-3x higher)
    smoking = (psd.get("smokingStatus") or "").lower()
    smoking_load = 1.0
    if smoking == "current":
        smoking_load = 2.0  # smoker rates are 2x for life insurance
    elif smoking == "former":
        smoking_load = 1.35

    # 4. Income-based sum assured check (standard: 10-15x annual income)
    income = safe_float(trad.get("income"), 500000)
    sa_income_ratio = sum_assured / max(income, 100000)
    over_insurance_load = 1.0
    if sa_income_ratio > 20:
        over_insurance_load = 1.15  # mild loading for over-insurance

    # 5. Expense ratio (IRDAI: max 35% in first year, 10% renewal)
    expense_ratio = 1.22  # blended 22% over policy term

    # Calculate
    net_premium = (
        annual_mortality
        * risk_loading
        * smoking_load
        * over_insurance_load
        * expense_ratio
    )

    # GST @ 18% (first year; 4.5% on renewal — we use blended 12%)
    gross = net_premium * 1.12

    min_p = int(gross * 0.85)
    max_p = int(gross * 1.15)

    return {
        "min": max(min_p, 2500),
        "max": max(max_p, min_p + 1000),
        "breakdown": {
            "sum_assured": round(sum_assured),
            "policy_term_years": policy_term,
            "maturity_age": maturity_age,
            "annual_mortality_cost": round(annual_mortality),
            "mortality_rate_per_1000": round(_interpolate_mortality(age, gender), 2),
            "risk_loading": round(risk_loading, 3),
            "smoking_loading": round(smoking_load, 2),
            "expense_ratio": round(expense_ratio, 2),
            "gst_blended_percent": 12,
            "net_premium": round(net_premium),
            "gross_premium": round(gross),
            "method": "mortality_table_discounted",
            "discount_rate_percent": 6.5,
            "sa_income_ratio": round(sa_income_ratio, 1),
        },
    }


def _premium_property(risk_score: int, assessment: dict) -> dict:
    """
    Property Insurance Premium (Burning Cost + Loading):
    Premium = (Property Value × Base Rate × Peril Loading)
              × Risk Factor × Deductible Credit × Discount
    """
    psd = assessment.get("policySpecificData", {})
    trad = assessment.get("traditionalData", {})
    alt = assessment.get("alternativeData", {})

    prop_value = safe_float(psd.get("propertyValue"), 5000000)
    prop_age = int(safe_float(psd.get("propertyAge"), 10))
    sqft = safe_float(psd.get("squareFootage"), 1200)

    # 1. Base rate (burning cost from Indian property loss data)
    base_rate = 0.0015  # 0.15% of property value — Indian average

    # 2. Construction type loading
    construction = (psd.get("constructionType") or "concrete").lower()
    construction_factors = {
        "concrete": 0.85, "rcc": 0.85,   # fire-resistant
        "brick": 1.0,                      # standard
        "wood": 1.60, "timber": 1.60,     # high fire risk
        "steel": 0.90,
    }
    construction_load = construction_factors.get(construction, 1.0)

    # 3. Flood zone loading (IRDAI geographic hazard zones)
    flood = (psd.get("floodZone") or "none").lower()
    flood_factors = {"none": 0.9, "low": 1.0, "moderate": 1.35, "high": 1.80}
    flood_load = flood_factors.get(flood, 1.0)

    # 4. Property age loading (older = higher maintenance risk)
    age_load = 1.0
    if prop_age > 30:
        age_load = 1.35
    elif prop_age > 20:
        age_load = 1.20
    elif prop_age > 10:
        age_load = 1.08

    # 5. Security discount
    security = (psd.get("securitySystem") or "none").lower()
    security_factors = {"comprehensive": 0.82, "basic": 0.92, "none": 1.0}
    security_discount = security_factors.get(security, 1.0)

    # 6. Risk loading from ML
    if risk_score <= 30:
        risk_factor = 0.75
    elif risk_score <= 55:
        risk_factor = 1.0 + (risk_score - 30) / 50
    else:
        risk_factor = 1.5 + (risk_score - 55) / 30

    # 7. IoT/behavioral discount
    behavioral = safe_float(alt.get("behavioralScore"), 0)
    iot_discount = 1.0
    if behavioral > 80:
        iot_discount = 0.90
    elif behavioral > 60:
        iot_discount = 0.95

    # Calculate
    net_premium = (
        prop_value
        * base_rate
        * construction_load
        * flood_load
        * age_load
        * security_discount
        * risk_factor
        * iot_discount
    )

    # Expense margin
    net_premium *= 1.25  # 25% for admin + commission

    # GST @ 18%
    gross = net_premium * 1.18

    min_p = int(gross * 0.85)
    max_p = int(gross * 1.15)

    return {
        "min": max(min_p, 2000),
        "max": max(max_p, min_p + 1000),
        "breakdown": {
            "property_value": round(prop_value),
            "base_rate_percent": round(base_rate * 100, 3),
            "construction_factor": round(construction_load, 2),
            "flood_zone_factor": round(flood_load, 2),
            "property_age_factor": round(age_load, 2),
            "security_discount": round(security_discount, 2),
            "risk_factor": round(risk_factor, 3),
            "iot_discount": round(iot_discount, 2),
            "gst_percent": 18,
            "net_premium": round(net_premium),
            "gross_premium": round(gross),
            "method": "burning_cost_plus_loading",
        },
    }
