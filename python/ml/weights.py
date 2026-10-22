"""
Custom weight configuration for risk scoring.
Allows insurers to distribute 100 points across risk factors,
then applies those weights to adjust ML predictions.
"""

import os
import json
import numpy as np
from threading import Lock
from ml.features import get_feature_names, extract_features
from ml.logger import logger

WEIGHTS_DIR = os.path.join(os.path.dirname(__file__), "models")
_configs_lock = Lock()

# Default weight distributions per policy type (balanced)
DEFAULT_WEIGHTS = {
    "health": {
        "age": 20, "smoking": 20, "bmi": 12, "income": 10,
        "credit": 8, "medical_history": 10, "family_history": 5,
        "telematics": 3, "behavioral": 4, "lifestyle": 5, "completeness": 3,
    },
    "auto": {
        "age": 15, "accidents": 20, "violations": 15, "driving_experience": 10,
        "income": 8, "credit": 8, "commute": 5,
        "telematics": 10, "behavioral": 4, "lifestyle": 2, "completeness": 3,
    },
    "life": {
        "age": 30, "smoking": 22, "bmi": 8, "income": 8,
        "credit": 5, "family_history": 7, "exercise": 5,
        "telematics": 2, "behavioral": 5, "lifestyle": 5, "completeness": 3,
    },
    "property": {
        "flood_zone": 22, "property_age": 20, "security": 10, "income": 12,
        "credit": 10, "property_value": 8,
        "telematics": 3, "behavioral": 5, "lifestyle": 5, "completeness": 5,
    },
}

# Maps weight category names to actual feature names
WEIGHT_TO_FEATURES = {
    "health": {
        "age": "age",
        "smoking": "smoking_encoded",
        "bmi": "bmi",
        "income": "income_normalized",
        "credit": "credit_score_normalized",
        "medical_history": "medical_conditions_count",
        "family_history": "family_history_count",
        "telematics": "telematics_score_norm",
        "behavioral": "behavioral_score_norm",
        "lifestyle": "lifestyle_score_norm",
        "completeness": "data_completeness",
    },
    "auto": {
        "age": "age",
        "accidents": "accidents_last_5",
        "violations": "traffic_violations",
        "driving_experience": "driving_years",
        "income": "income_normalized",
        "credit": "credit_score_normalized",
        "commute": "daily_commute",
        "telematics": "telematics_score_norm",
        "behavioral": "behavioral_score_norm",
        "lifestyle": "lifestyle_score_norm",
        "completeness": "data_completeness",
    },
    "life": {
        "age": "age",
        "smoking": "smoking_encoded",
        "bmi": "bmi",
        "income": "income_normalized",
        "credit": "credit_score_normalized",
        "family_history": "family_history_count",
        "exercise": "exercise_freq",
        "telematics": "telematics_score_norm",
        "behavioral": "behavioral_score_norm",
        "lifestyle": "lifestyle_score_norm",
        "completeness": "data_completeness",
    },
    "property": {
        "flood_zone": "flood_zone_encoded",
        "property_age": "property_age",
        "security": "security_encoded",
        "income": "income_normalized",
        "credit": "credit_score_normalized",
        "property_value": "property_value_normalized",
        "telematics": "telematics_score_norm",
        "behavioral": "behavioral_score_norm",
        "lifestyle": "lifestyle_score_norm",
        "completeness": "data_completeness",
    },
}

# Human-readable labels for UI
WEIGHT_LABELS = {
    "age": "Age",
    "smoking": "Smoking Status",
    "bmi": "BMI / Body Health",
    "income": "Annual Income",
    "credit": "Credit Score",
    "medical_history": "Medical History",
    "family_history": "Family History",
    "exercise": "Exercise & Fitness",
    "telematics": "Telematics (IoT/Driving)",
    "behavioral": "Behavioral Score",
    "lifestyle": "Lifestyle Score",
    "completeness": "Data Completeness",
    "accidents": "Accident History",
    "violations": "Traffic Violations",
    "driving_experience": "Driving Experience",
    "commute": "Daily Commute",
    "flood_zone": "Flood Zone Risk",
    "property_age": "Property Age",
    "security": "Security System",
    "property_value": "Property Value",
}


def validate_weights(weights: dict, policy_type: str) -> tuple[bool, str]:
    """Validate that weights sum to 100 and all categories are present."""
    expected = set(DEFAULT_WEIGHTS.get(policy_type, {}).keys())
    provided = set(weights.keys())

    if provided != expected:
        missing = expected - provided
        extra = provided - expected
        msg = ""
        if missing:
            msg += f"Missing categories: {missing}. "
        if extra:
            msg += f"Unknown categories: {extra}."
        return False, msg.strip()

    total = sum(weights.values())
    if abs(total - 100) > 0.5:
        return False, f"Weights must sum to 100. Current sum: {total}"

    for k, v in weights.items():
        if not isinstance(v, (int, float)) or v < 0:
            return False, f"Weight '{k}' must be a non-negative number, got {v}"

    return True, "Valid"


def save_weights(policy_type: str, weights: dict, name: str = "default"):
    """Save custom weight config to disk."""
    valid, msg = validate_weights(weights, policy_type)
    if not valid:
        raise ValueError(msg)

    config_path = os.path.join(WEIGHTS_DIR, f"{policy_type}_weights.json")
    config = {
        "policy_type": policy_type,
        "name": name,
        "weights": weights,
        "total": sum(weights.values()),
    }

    with _configs_lock:
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)

    logger.info(f"Saved custom weights for {policy_type}: {weights}")
    return config


def load_weights(policy_type: str) -> dict:
    """Load custom weights, or return defaults."""
    config_path = os.path.join(WEIGHTS_DIR, f"{policy_type}_weights.json")
    if os.path.exists(config_path):
        with open(config_path) as f:
            config = json.load(f)
            return config.get("weights", DEFAULT_WEIGHTS.get(policy_type, {}))
    return DEFAULT_WEIGHTS.get(policy_type, {})


def apply_custom_weights(base_score: float, features: np.ndarray,
                         feature_names: list, policy_type: str,
                         custom_weights: dict = None) -> float:
    """
    Adjust ML base score using custom weight configuration.

    Process:
    1. Get ML model's feature importances (how much each feature ACTUALLY matters)
    2. Get custom weights (how much the insurer WANTS each feature to matter)
    3. Compute adjustment = difference between desired and actual importance
    4. Shift score based on where the insurer puts more/less emphasis
    """
    weights = custom_weights or load_weights(policy_type)
    weight_map = WEIGHT_TO_FEATURES.get(policy_type, {})

    # Normalize custom weights to 0-1
    total = sum(weights.values())
    if total <= 0:
        return base_score
    norm_weights = {k: v / total for k, v in weights.items()}

    # Compare custom weights vs default weights.
    # Only the DEVIATION from default matters — if you increase age weight
    # by 10pts and decrease smoking by 10pts, the score shifts by the difference
    # in those factors' contributions, not by their absolute values.
    defaults = DEFAULT_WEIGHTS.get(policy_type, {})
    default_total = sum(defaults.values()) or 100
    norm_defaults = {k: v / default_total for k, v in defaults.items()}

    positive_features = {
        "income_normalized", "credit_score_normalized",
        "telematics_score_norm", "behavioral_score_norm",
        "lifestyle_score_norm", "exercise_freq", "driving_years",
        "security_encoded", "data_completeness",
    }

    adjustment = 0.0
    for category, custom_pct in norm_weights.items():
        default_pct = norm_defaults.get(category, 0)
        deviation = custom_pct - default_pct  # positive = user wants MORE weight here

        if abs(deviation) < 0.005:
            continue  # No meaningful change

        feat_name = weight_map.get(category)
        if not feat_name or feat_name not in feature_names:
            continue

        idx = feature_names.index(feat_name)
        raw_val = float(features[idx])

        # Normalize value to 0-1 range
        if feat_name == "age":
            norm_val = raw_val / 80
        elif feat_name in ("accidents_last_5", "traffic_violations"):
            norm_val = min(raw_val / 5, 1.0)
        elif feat_name == "smoking_encoded":
            norm_val = raw_val / 2
        elif feat_name == "bmi":
            norm_val = max(0, (raw_val - 18) / 30)
        elif feat_name in ("property_age", "daily_commute"):
            norm_val = min(raw_val / 50, 1.0)
        elif feat_name == "flood_zone_encoded":
            norm_val = raw_val / 3
        else:
            norm_val = raw_val  # Already 0-1 for normalized features

        # For positive features: good value (>0.5) with MORE weight → lower score
        # For negative features: bad value (>0.5) with MORE weight → higher score
        if feat_name in positive_features:
            contribution = (0.5 - norm_val) * deviation * 40
        else:
            contribution = (norm_val - 0.5) * deviation * 40

        adjustment += contribution

    # Clamp adjustment: weights can only shift score by ±15 from ML base
    adjusted = base_score + np.clip(adjustment, -15, 15)
    return round(max(2, min(98, adjusted)))


def simulate_with_weights(assessment: dict, policy_type: str,
                          custom_weights: dict) -> dict:
    """
    Run a full prediction with custom weights and return comparison.
    Returns both default-weighted and custom-weighted scores.
    """
    from ml.predictor import predict_risk

    # Get default prediction
    default_result = predict_risk(assessment, policy_type)
    if not default_result:
        return None

    # Get custom-weighted prediction
    features = extract_features(assessment, policy_type)
    feature_names = get_feature_names(policy_type)
    custom_score = apply_custom_weights(
        default_result["riskScore"], features, feature_names,
        policy_type, custom_weights
    )

    from ml.predictor import _score_to_decision
    from ml.premium import calculate_premium
    custom_decision = _score_to_decision(custom_score, policy_type)
    custom_premium = calculate_premium(custom_score, policy_type, assessment)

    # Analyze weight distribution for insights
    insights = generate_weight_insights(custom_weights, policy_type,
                                         default_result["riskScore"], custom_score)

    return {
        "default": {
            "riskScore": default_result["riskScore"],
            "decision": default_result["decision"],
            "premium": default_result["recommendedPremium"],
        },
        "custom": {
            "riskScore": custom_score,
            "decision": custom_decision,
            "premium": custom_premium,
            "weights_applied": custom_weights,
        },
        "difference": custom_score - default_result["riskScore"],
        "factors": default_result.get("factors", []),
        "insights": insights,
    }


def generate_weight_insights(weights: dict, policy_type: str,
                              default_score: int, custom_score: int) -> dict:
    """
    Generate AI-driven insights about the weight configuration.
    Analyzes the distribution pattern, identifies risks, and provides recommendations.
    """
    defaults = DEFAULT_WEIGHTS.get(policy_type, {})
    total = sum(weights.values())
    diff = custom_score - default_score

    # Classify the weight distribution strategy
    traditional_keys = {"age", "smoking", "bmi", "income", "credit",
                        "medical_history", "family_history", "accidents",
                        "violations", "driving_experience", "commute",
                        "flood_zone", "property_age", "security", "property_value", "exercise"}
    alt_keys = {"telematics", "behavioral", "lifestyle"}

    trad_total = sum(weights.get(k, 0) for k in traditional_keys if k in weights)
    alt_total = sum(weights.get(k, 0) for k in alt_keys if k in weights)
    completeness_w = weights.get("completeness", 0)

    # Find biggest deviations from default
    deviations = []
    for k in weights:
        default_val = defaults.get(k, 0)
        custom_val = weights[k]
        change = custom_val - default_val
        if abs(change) >= 3:
            direction = "increased" if change > 0 else "decreased"
            deviations.append({
                "category": WEIGHT_LABELS.get(k, k),
                "key": k,
                "from": default_val,
                "to": custom_val,
                "change": change,
                "direction": direction,
            })
    deviations.sort(key=lambda x: abs(x["change"]), reverse=True)

    # Determine strategy type
    if alt_total >= 30:
        strategy = "Tech-Forward / Data-Driven"
        strategy_desc = "Heavy reliance on alternative data (telematics, behavioral, lifestyle). This rewards applicants with good digital footprints and IoT data."
    elif alt_total <= 5:
        strategy = "Traditional / Conservative"
        strategy_desc = "Minimal use of alternative data. Scoring is dominated by conventional factors. This may miss low-risk applicants who lack traditional credit history."
    else:
        strategy = "Balanced / Hybrid"
        strategy_desc = "Mix of traditional and alternative data sources. This provides a well-rounded risk assessment."

    # Risk warnings
    warnings = []
    top_weight = max(weights.values())
    top_key = [k for k, v in weights.items() if v == top_weight][0]

    if top_weight >= 35:
        warnings.append(f"**High concentration risk:** {WEIGHT_LABELS.get(top_key, top_key)} alone accounts for {top_weight}% of the score. A single factor dominating can lead to unfair outcomes.")

    if weights.get("income", 0) >= 20 or weights.get("credit", 0) >= 20:
        warnings.append("**Economic bias risk:** High weight on income/credit may discriminate against younger applicants or those without credit history.")

    zero_weights = [WEIGHT_LABELS.get(k, k) for k, v in weights.items() if v == 0]
    if zero_weights:
        warnings.append(f"**Blind spots:** {', '.join(zero_weights)} have zero weight. These factors will be completely ignored in scoring, even if they indicate significant risk.")

    if alt_total == 0:
        warnings.append("**No alternative data usage:** You're ignoring telematics, behavioral, and lifestyle signals entirely. This defeats the purpose of multi-source underwriting.")

    if completeness_w == 0:
        warnings.append("**No completeness penalty:** Applicants who submit incomplete data won't be penalized. This could attract adverse selection.")

    if abs(diff) > 15:
        direction = "stricter" if diff > 0 else "more lenient"
        warnings.append(f"**Large score deviation:** Custom weights shift the score by {abs(diff)} points ({direction}). This significantly changes your risk appetite and approval rates.")

    # Recommendations
    recommendations = []
    if alt_total < 10:
        recommendations.append("Consider allocating at least 10-15 points to alternative data to capture modern risk signals from IoT devices and behavioral analytics.")
    if alt_total > 40:
        recommendations.append("Alternative data weight is very high. Ensure your data collection pipeline is reliable — if telematics/behavioral data is unavailable, scores will default to risky assumptions.")
    if completeness_w == 0:
        recommendations.append("Add at least 3-5 points for data completeness to penalize incomplete applications, which are statistically riskier.")
    if len(zero_weights) > 3:
        recommendations.append(f"You have {len(zero_weights)} factors with zero weight. Consider distributing points more evenly to avoid scoring blind spots.")
    if not deviations:
        recommendations.append("Your configuration is close to the defaults. Consider adjusting based on your company's specific risk appetite and claims history.")

    return {
        "strategy": strategy,
        "strategy_description": strategy_desc,
        "traditional_weight": trad_total,
        "alternative_weight": alt_total,
        "completeness_weight": completeness_w,
        "top_deviations": deviations[:5],
        "warnings": warnings,
        "recommendations": recommendations,
        "score_impact": {
            "default": default_score,
            "custom": custom_score,
            "difference": diff,
            "direction": "stricter" if diff > 0 else "more lenient" if diff < 0 else "no change",
        },
    }
