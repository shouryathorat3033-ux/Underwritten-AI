"""
ML prediction service for insurance risk scoring.
Enterprise-grade: thread-safe, logged, validated, with adverse action support.
"""

import os
import time
import json
import joblib
import numpy as np
from threading import Lock
from ml.features import extract_features, get_feature_names, safe_float
from ml.logger import logger, metrics as ml_metrics
from ml.premium import calculate_premium
from ml.recommendations import recommend_products

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")

_models = {}
_models_lock = Lock()

# ── Training-data baselines (computed once, cached) ─────────────
# Instead of hardcoded "neutral" values, we use the mean of each
# feature from the actual training data.  This is the same approach
# SHAP uses for its "background dataset" — mathematically principled
# and free of human judgment.
_baselines_cache: dict[str, dict[str, float]] = {}

def _get_training_baselines(policy_type: str, feature_names: list[str]) -> dict[str, float]:
    """Load training CSV and return per-feature means (cached)."""
    if policy_type in _baselines_cache:
        return _baselines_cache[policy_type]

    csv_path = os.path.join(MODELS_DIR, f"{policy_type}_data.csv")
    try:
        import csv
        with open(csv_path, "r") as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        if not rows:
            raise FileNotFoundError
        baselines = {}
        for col in feature_names:
            vals = []
            for r in rows:
                if col in r:
                    try:
                        vals.append(float(r[col]))
                    except (ValueError, TypeError):
                        pass
            baselines[col] = sum(vals) / len(vals) if vals else 0.5
        _baselines_cache[policy_type] = baselines
        logger.info(f"Loaded training-data baselines for {policy_type} ({len(rows)} samples)")
        return baselines
    except Exception as e:
        # Fallback: use 0.5 for normalized features, sensible defaults for raw
        logger.warning(f"Could not load training baselines for {policy_type}: {e}, using fallback")
        fallback = {name: 0.5 for name in feature_names}
        fallback.update({"age": 35, "bmi": 25, "existing_policies": 1,
                         "driving_years": 5, "vehicle_age": 3, "daily_commute": 20,
                         "property_age": 10, "dependents": 1, "exercise_freq": 3})
        _baselines_cache[policy_type] = fallback
        return fallback


def _load_model(policy_type: str):
    """Thread-safe lazy model loading with validation."""
    with _models_lock:
        if policy_type in _models:
            return _models[policy_type]

        model_path = os.path.join(MODELS_DIR, f"{policy_type}_model.joblib")
        if not os.path.exists(model_path):
            logger.warning(f"Model file not found: {model_path}")
            return None

        try:
            model = joblib.load(model_path)
            _models[policy_type] = model
            logger.info(f"Model loaded: {policy_type} from {model_path}")
            return model
        except Exception as e:
            logger.error(f"Failed to load model {policy_type}: {e}")
            return None


def invalidate_cache(policy_type: str = None):
    """Clear model cache (e.g., after retraining)."""
    with _models_lock:
        if policy_type:
            _models.pop(policy_type, None)
        else:
            _models.clear()
    logger.info(f"Model cache invalidated: {policy_type or 'all'}")


def predict_risk(assessment: dict, policy_type: str) -> dict | None:
    """
    Run ML prediction on an assessment.
    Returns structured result with risk score, decision, confidence, factors,
    premium, and adverse action reasons (for declined/referred applicants).
    """
    start_time = time.time()

    model = _load_model(policy_type)
    if model is None:
        ml_metrics.record_error(policy_type, "model_not_found")
        return None

    try:
        # Validate policy type
        if policy_type not in ("health", "auto", "life", "property"):
            ml_metrics.record_error(policy_type, "invalid_policy_type")
            return None

        # Extract features
        features = extract_features(assessment, policy_type)
        feature_names = get_feature_names(policy_type)

        # Validate feature vector
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            logger.warning(f"Invalid features detected for {policy_type}, replacing NaN/Inf")
            features = np.nan_to_num(features, nan=0.5, posinf=1.0, neginf=0.0)

        # Predict
        raw_score = float(model.predict(features.reshape(1, -1))[0])
        risk_score = round(max(0, min(100, raw_score)))

        # Apply custom weights if configured
        try:
            from ml.weights import apply_custom_weights, load_weights
            custom_weights = load_weights(policy_type)
            risk_score = apply_custom_weights(risk_score, features, feature_names, policy_type, custom_weights)
        except Exception:
            pass  # Fall back to default ML score

        # Feature importances
        gbr = model.named_estimators_["gbr"]
        importances = gbr.feature_importances_

        # ── Per-prediction feature contributions (tree-based) ──
        # Each decision tree in the GBR ensemble splits on features.
        # We compute each feature's actual contribution to THIS prediction
        # by comparing prediction-with-feature vs prediction-with-feature-at-baseline.
        feature_contribs = _compute_feature_contributions(gbr, features, feature_names, policy_type)

        sorted_idx = np.argsort(importances)[::-1]

        # Build risk factors
        count_features = {
            "medical_conditions_count", "family_history_count",
            "accidents_last_5", "traffic_violations", "existing_policies",
            "dependents", "exercise_freq",
        }
        factors = []
        for i in sorted_idx[:8]:
            fname = feature_names[i]
            imp = float(importances[i])
            raw_val = float(features[i])
            impact = _determine_impact(fname, raw_val, policy_type)

            # Normalize score for display (0-100 range)
            if fname in count_features:
                display_score = round(max(0, min(100, raw_val * 10)))
            elif raw_val <= 1.0:
                display_score = round(max(0, min(100, raw_val * 100)))
            else:
                display_score = round(max(0, min(100, raw_val)))

            # Actual contribution to this prediction (from tree decomposition)
            contrib = feature_contribs.get(fname, 0.0)

            factors.append({
                "source": _format_feature_name(fname),
                "score": display_score,
                "weight": round(imp, 3),
                "impact": impact,
                "contribution": round(contrib, 2),
            })

        decision = _score_to_decision(risk_score, policy_type)
        confidence = _calculate_confidence(model, features, risk_score)
        premium = calculate_premium(risk_score, policy_type, assessment)

        # Adverse action reasons (required for declined/referred decisions)
        adverse_reasons = []
        if decision in ("refer", "decline"):
            adverse_reasons = _generate_adverse_reasons(factors, features, feature_names, policy_type)

        # Traditional-only score (without alternative data)
        traditional_score = predict_traditional_score(assessment, policy_type)

        latency_ms = (time.time() - start_time) * 1000
        ml_metrics.record_prediction(policy_type, risk_score, decision, latency_ms)

        # Product recommendations based on profile
        recommendations = recommend_products(risk_score, policy_type, assessment)

        # Base score = what the model predicts for the training-data average person.
        # This is the "starting point" in the waterfall chart — computed from data,
        # not hardcoded.  It answers: "what score would an average person get?"
        baselines = _get_training_baselines(policy_type, feature_names)
        baseline_vector = np.array([baselines.get(fn, 0.5) for fn in feature_names])
        base_score = float(np.clip(model.predict(baseline_vector.reshape(1, -1))[0], 2, 98))

        result = {
            "riskScore": risk_score,
            "decision": decision,
            "confidence": confidence,
            "recommendedPremium": premium,
            "factors": factors,
            "baseScore": round(base_score, 1),
            "mlModel": True,
            "modelVersion": _get_version(policy_type),
            "latencyMs": round(latency_ms, 1),
            "traditionalScore": traditional_score,
            "recommendations": recommendations,
        }

        if adverse_reasons:
            result["adverseActionReasons"] = adverse_reasons

        return result

    except Exception as e:
        latency_ms = (time.time() - start_time) * 1000
        ml_metrics.record_error(policy_type, str(e))
        logger.error(f"Prediction failed for {policy_type}: {e}", exc_info=True)
        return None


def _compute_feature_contributions(gbr, features, feature_names, policy_type: str = "health") -> dict:
    """
    Compute per-feature contributions using incremental addition.

    Instead of perturbing one feature at a time FROM the prediction (which
    loses interaction effects to the residual), we BUILD UP from the baseline
    by adding one feature at a time and measuring each step's gain.

    Process:
      1. Start with all features = baseline (training mean) → base_score
      2. Add feature_1 (most important first) → new_score
         contribution_1 = new_score - base_score
      3. Add feature_2 → newer_score
         contribution_2 = newer_score - new_score
      4. Continue until all features added → final_score

    This captures interactions because later features are added IN CONTEXT
    of earlier ones. The order is by feature importance (most important first).

    Result: sum of all contributions = final_score - base_score (exact, no residual waste)
    """
    actual_score = float(gbr.predict(features.reshape(1, -1))[0])
    baselines = _get_training_baselines(policy_type, feature_names)

    # Start with baseline (all features = training mean)
    baseline_vec = np.array([baselines.get(fn, 0.5) for fn in feature_names], dtype=np.float64)
    base_score = float(gbr.predict(baseline_vec.reshape(1, -1))[0])

    # Sort features by importance (most important first — they get credit for interactions)
    importances = gbr.feature_importances_
    sorted_indices = np.argsort(importances)[::-1]

    # Incrementally add each feature and measure the gain
    current_vec = baseline_vec.copy()
    current_score = base_score
    contribs = {}

    for idx in sorted_indices:
        fname = feature_names[idx]
        # Set this feature to its actual value
        current_vec[idx] = features[idx]
        new_score = float(gbr.predict(current_vec.reshape(1, -1))[0])
        contribs[fname] = new_score - current_score
        current_score = new_score

    return contribs


def _score_to_decision(score: int, policy_type: str) -> str:
    """Map risk score to underwriting decision.
    Thresholds: ≤55 approve, 56-75 refer, >75 decline.
    These MUST match the frontend risk badge thresholds:
      ≤35 Low (green), 36-55 Moderate (amber), 56-75 High (red), >75 Critical.
    """
    if score <= 55:
        return "approve"
    if score <= 75:
        return "refer"
    return "decline"


def _calculate_confidence(model, features, predicted_score) -> int:
    """Estimate confidence from tree ensemble variance."""
    try:
        gbr = model.named_estimators_["gbr"]
        tree_predictions = []
        for tree in gbr.estimators_.flatten():
            tree_predictions.append(tree.predict(features.reshape(1, -1))[0])
        std = float(np.std(tree_predictions))
        confidence = max(50, min(98, int(100 - std * 3)))
    except Exception:
        confidence = 75
    return confidence


    # _calculate_premium moved to ml/premium.py (actuarial GLM engine)


def _generate_adverse_reasons(factors, features, feature_names, policy_type) -> list:
    """
    Generate specific reasons for adverse action (required by Fair Lending).
    Returns top 4 negative factors that contributed to the decision.
    """
    reasons = []
    negative_factors = [f for f in factors if f["impact"] == "negative"]
    negative_factors.sort(key=lambda x: x["weight"], reverse=True)

    reason_templates = {
        "Age": "Applicant age falls in a higher-risk category",
        "BMI": "Body mass index indicates elevated health risk",
        "Smoking Status": "Tobacco use significantly increases risk profile",
        "Accident History": "Prior accident history indicates elevated driving risk",
        "Traffic Violations": "Traffic violation record contributes to risk assessment",
        "Annual Income": "Income level affects ability to maintain coverage",
        "Credit Score": "Credit profile contributes to risk evaluation",
        "Medical Conditions": "Pre-existing medical conditions affect health risk",
        "Family History": "Family medical history indicates potential hereditary risks",
        "Property Age": "Older property structures have higher maintenance and claim risk",
        "Construction Type": "Building construction material increases structural risk",
        "Flood Zone Risk": "Property location in flood-prone area increases exposure",
        "Social Media Risk": "Digital footprint analysis indicates elevated risk signals",
        "Daily Commute": "Longer commute distance increases accident exposure",
        "Telematics Score": "Driving behavior data indicates above-average risk",
        "Behavioral Score": "Behavioral pattern analysis shows elevated risk indicators",
        "Lifestyle Score": "Lifestyle factors contribute to overall risk assessment",
        "Job Stability": "Professional profile analysis indicates employment instability risk",
    }

    for f in negative_factors[:4]:
        reason = reason_templates.get(f["source"], f"Factor '{f['source']}' negatively impacts risk score")
        reasons.append({
            "factor": f["source"],
            "reason": reason,
            "weight": f["weight"],
        })

    if not reasons:
        reasons.append({
            "factor": "Overall Risk",
            "reason": "Combined risk factors exceed acceptable threshold for standard coverage",
            "weight": 1.0,
        })

    return reasons


def _determine_impact(feature_name: str, value: float, policy_type: str) -> str:
    """Determine if a feature value is positive, negative, or neutral."""
    positive_when_high = {
        "telematics_score_norm", "behavioral_score_norm", "lifestyle_score_norm",
        "credit_score_normalized", "income_normalized", "exercise_freq",
        "driving_years", "security_encoded", "data_completeness",
        "job_stability_norm",
    }
    negative_when_high = {
        "age", "bmi", "smoking_encoded", "medical_conditions_count",
        "family_history_count", "accidents_last_5", "traffic_violations",
        "social_media_risk_encoded", "flood_zone_encoded", "construction_type_encoded",
        "property_age", "daily_commute", "vehicle_age", "property_value_normalized",
    }

    if feature_name in positive_when_high:
        if value > 0.65:
            return "positive"
        if value < 0.35:
            return "negative"
        return "neutral"
    if feature_name in negative_when_high:
        if feature_name == "age":
            return "negative" if value > 50 else "positive" if value < 30 else "neutral"
        if feature_name in ("accidents_last_5", "traffic_violations", "medical_conditions_count", "family_history_count"):
            return "positive" if value == 0 else "negative"
        return "negative" if value > 0.5 else "neutral"
    return "neutral"


def _format_feature_name(name: str) -> str:
    replacements = {
        "age": "Age", "gender_encoded": "Gender",
        "income_normalized": "Annual Income",
        "credit_score_normalized": "Credit Score",
        "existing_policies": "Existing Policies",
        "bmi": "BMI", "smoking_encoded": "Smoking Status",
        "exercise_freq": "Exercise Frequency",
        "medical_conditions_count": "Medical Conditions",
        "family_history_count": "Family History",
        "telematics_score_norm": "Telematics Score",
        "behavioral_score_norm": "Behavioral Score",
        "lifestyle_score_norm": "Lifestyle Score",
        "social_media_risk_encoded": "Social Media Risk",
        "job_stability_norm": "Job Stability",
        "construction_type_encoded": "Construction Type",
        "driving_years": "Driving Experience",
        "accidents_last_5": "Accident History",
        "traffic_violations": "Traffic Violations",
        "vehicle_age": "Vehicle Age",
        "daily_commute": "Daily Commute",
        "dependents": "Dependents",
        "property_age": "Property Age",
        "property_value_normalized": "Property Value",
        "square_footage_normalized": "Square Footage",
        "flood_zone_encoded": "Flood Zone Risk",
        "security_encoded": "Security System",
        "data_completeness": "Data Completeness",
    }
    return replacements.get(name, name.replace("_", " ").title())


def _get_version(policy_type: str) -> str:
    try:
        from ml.versioning import get_active_version
        v = get_active_version(policy_type)
        return v["version"] if v else "unversioned"
    except Exception:
        return "unversioned"


def predict_traditional_score(assessment: dict, policy_type: str) -> int | None:
    """
    Predict risk using only traditional data (no alternative data sources).
    Zeros out telematics, behavioral, lifestyle, and social media features
    to show what the score would be without alternative data.
    """
    model = _load_model(policy_type)
    if model is None:
        return None

    try:
        features = extract_features(assessment, policy_type)
        feature_names = get_feature_names(policy_type)

        # Zero out alternative data features (set to risky defaults)
        alt_features = {
            "telematics_score_norm": 0.3,
            "behavioral_score_norm": 0.3,
            "lifestyle_score_norm": 0.3,
            "social_media_risk_encoded": 1.5,
            "job_stability_norm": 0.3,
        }
        for fname, default_val in alt_features.items():
            if fname in feature_names:
                idx = feature_names.index(fname)
                features[idx] = default_val

        raw_score = float(model.predict(features.reshape(1, -1))[0])
        return round(max(0, min(100, raw_score)))
    except Exception as e:
        logger.error(f"Traditional score prediction failed: {e}")
        return None


def get_model_info(policy_type: str) -> dict | None:
    metrics_path = os.path.join(MODELS_DIR, f"{policy_type}_metrics.json")
    if not os.path.exists(metrics_path):
        return None
    with open(metrics_path) as f:
        return json.load(f)


def is_model_available(policy_type: str) -> bool:
    model_path = os.path.join(MODELS_DIR, f"{policy_type}_model.joblib")
    return os.path.exists(model_path)
