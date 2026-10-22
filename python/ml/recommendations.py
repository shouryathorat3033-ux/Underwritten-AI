"""
Product Recommendation Engine — suggests specific insurance sub-products
based on the applicant's risk profile, age, income, and ML scoring results.

Maps the 4 policy types to specific Indian market product recommendations
(similar to PolicyBazaar/Digit/Acko product catalogs).
"""


def recommend_products(risk_score: int, policy_type: str, assessment: dict) -> list[dict]:
    """
    Generate 2-4 product recommendations based on the applicant's profile.

    Returns list of: {product, type, description, suitability, reason}
    """
    applicant = assessment.get("applicant", {})
    trad = assessment.get("traditionalData", {})
    psd = assessment.get("policySpecificData", {})

    age = int(applicant.get("age") or 35)
    income = float(trad.get("income") or 500000)
    smoking = (psd.get("smokingStatus") or "").lower()

    recommenders = {
        "health": _health_recs,
        "auto": _auto_recs,
        "life": _life_recs,
        "property": _property_recs,
    }
    fn = recommenders.get(policy_type, _health_recs)
    return fn(risk_score, age, income, smoking, assessment)


def _health_recs(risk_score, age, income, smoking, assessment):
    recs = []

    # Base health plan
    if risk_score <= 40:
        recs.append({
            "product": "Standard Health Plan",
            "type": "Individual Health",
            "suitability": "high",
            "description": "Comprehensive cover with low premium due to good health profile",
            "reason": f"Risk score {risk_score} qualifies for standard rates with full benefits",
        })
    else:
        recs.append({
            "product": "Health Plan with Co-pay",
            "type": "Individual Health",
            "suitability": "medium",
            "description": "Comprehensive cover with 10-20% co-pay to manage premium costs",
            "reason": f"Risk score {risk_score} — co-pay option reduces premium by 15-25%",
        })

    # Critical illness add-on
    if age > 35 or smoking == "current":
        recs.append({
            "product": "Critical Illness Cover",
            "type": "Rider / Standalone",
            "suitability": "high" if age > 45 else "medium",
            "description": "Lump sum payout on diagnosis of heart attack, cancer, stroke, etc.",
            "reason": f"Age {age}{' + smoking history' if smoking == 'current' else ''} — CI cover provides financial buffer for major illnesses",
        })

    # Family floater
    psd = assessment.get("policySpecificData", {})
    dependents = int(psd.get("dependents") or 0)
    if dependents > 0:
        recs.append({
            "product": "Family Floater Plan",
            "type": "Family Health",
            "suitability": "high",
            "description": f"Single policy covering all {dependents + 1} family members with shared sum insured",
            "reason": "20-30% cheaper than individual plans for each family member",
        })

    # Super top-up
    if income > 1000000:
        recs.append({
            "product": "Super Top-Up",
            "type": "Top-Up Health",
            "suitability": "medium",
            "description": "High cover (₹25L-₹1Cr) at low cost by setting a deductible equal to base plan",
            "reason": "Income level supports higher coverage — top-up fills the gap affordably",
        })

    return recs[:4]


def _auto_recs(risk_score, age, income, smoking, assessment):
    recs = []
    psd = assessment.get("policySpecificData", {})
    alt = assessment.get("alternativeData", {})
    vehicle_type = (psd.get("vehicleType") or "sedan").lower()
    vehicle_year = int(psd.get("vehicleYear") or 2020)
    vehicle_age = max(0, 2026 - vehicle_year)
    telematics = float(alt.get("telematicsScore") or 0)

    # Comprehensive vs TP-only
    if vehicle_age <= 5:
        recs.append({
            "product": "Comprehensive Motor Insurance",
            "type": "OD + TP",
            "suitability": "high",
            "description": "Full protection: own damage + third-party liability + personal accident",
            "reason": f"Vehicle is {vehicle_age} years old — IDV is still significant, OD cover is essential",
        })
    else:
        recs.append({
            "product": "Third-Party Only",
            "type": "TP Liability",
            "suitability": "medium",
            "description": "Mandatory third-party cover at IRDAI-fixed rates",
            "reason": f"Vehicle is {vehicle_age} years old — IDV has depreciated significantly, OD may not be cost-effective",
        })

    # Zero depreciation
    if vehicle_age <= 3:
        recs.append({
            "product": "Zero Depreciation Add-On",
            "type": "Rider",
            "suitability": "high",
            "description": "Full claim settlement without depreciation deduction on parts",
            "reason": "New vehicle — zero dep covers the full repair cost without out-of-pocket",
        })

    # Pay-as-you-drive
    if telematics > 70:
        recs.append({
            "product": "Pay-As-You-Drive (UBI)",
            "type": "Usage-Based Insurance",
            "suitability": "high",
            "description": "Premium based on actual driving behavior via telematics — safe drivers save up to 25%",
            "reason": f"Telematics score {int(telematics)} qualifies for usage-based discount",
        })

    # Roadside assistance
    accidents = int(psd.get("accidentsLast5") or 0)
    if accidents > 0 or age < 25:
        recs.append({
            "product": "Roadside Assistance Add-On",
            "type": "Rider",
            "suitability": "medium",
            "description": "24/7 towing, flat tire, battery jump-start, fuel delivery",
            "reason": "Driving profile suggests higher roadside incident probability",
        })

    return recs[:4]


def _life_recs(risk_score, age, income, smoking, assessment):
    recs = []
    psd = assessment.get("policySpecificData", {})
    dependents = int(psd.get("dependents") or 0)

    # Term plan
    cover_multiple = 15 if age < 40 else 10
    suggested_cover = int(income * cover_multiple)
    recs.append({
        "product": "Pure Term Life Insurance",
        "type": "Term Plan",
        "suitability": "high",
        "description": f"Recommended cover: ₹{suggested_cover / 100000:.0f}L ({cover_multiple}x annual income) for {max(60 - age, 10)} years",
        "reason": f"Most cost-effective life cover — {'non-smoker discount applies' if smoking != 'current' else 'smoker rates apply, but term is still cheapest option'}",
    })

    # Return of premium variant
    if risk_score <= 45:
        recs.append({
            "product": "Term Plan with Return of Premium",
            "type": "TROP",
            "suitability": "medium",
            "description": "All premiums refunded if you survive the policy term — costs 40-60% more than pure term",
            "reason": "Low risk profile makes TROP viable — the 'nothing lost' peace of mind",
        })

    # Whole life / ULIP
    if income > 1500000:
        recs.append({
            "product": "ULIP (Unit Linked Insurance Plan)",
            "type": "Insurance + Investment",
            "suitability": "medium",
            "description": "Combines ₹25L+ life cover with market-linked equity/debt fund investment",
            "reason": "Income supports dual benefit — insurance + wealth creation with tax benefits u/s 10(10D)",
        })

    # Rider: critical illness
    if age > 30:
        recs.append({
            "product": "Critical Illness Rider",
            "type": "Rider on Term Plan",
            "suitability": "high" if age > 45 else "medium",
            "description": "Lump sum payout on diagnosis of 35+ critical conditions — add to your term plan",
            "reason": f"Age {age} — adding CI rider costs only 10-15% extra but covers the biggest financial risks",
        })

    return recs[:4]


def _property_recs(risk_score, age, income, smoking, assessment):
    recs = []
    psd = assessment.get("policySpecificData", {})
    flood = (psd.get("floodZone") or "none").lower()
    prop_value = float(psd.get("propertyValue") or 5000000)

    # Standard fire & special perils
    recs.append({
        "product": "Standard Fire & Special Perils (SFSP)",
        "type": "Basic Property",
        "suitability": "high",
        "description": "Covers fire, lightning, explosion, storm, flood, earthquake, riot, terrorism",
        "reason": "Mandatory base cover — IRDAI tariff rates apply",
    })

    # Comprehensive householder
    if prop_value > 3000000:
        recs.append({
            "product": "Comprehensive Householder Policy",
            "type": "Structure + Contents",
            "suitability": "high",
            "description": "All-in-one: structure + contents + personal belongings + temporary accommodation",
            "reason": f"Property value ₹{prop_value / 100000:.0f}L justifies comprehensive coverage",
        })

    # Earthquake cover
    if flood in ("moderate", "high"):
        recs.append({
            "product": "Earthquake & Flood Extension",
            "type": "Add-On",
            "suitability": "high",
            "description": "Extended cover for earthquake, flood, and landslide damage",
            "reason": f"Property in {flood} flood zone — standard SFSP has limited natural calamity cover",
        })

    # Rent loss cover
    recs.append({
        "product": "Loss of Rent / Alt Accommodation",
        "type": "Rider",
        "suitability": "medium",
        "description": "Covers rental income loss or alternative accommodation costs during repairs",
        "reason": "Protects cash flow if property becomes uninhabitable after an insured event",
    })

    return recs[:4]
