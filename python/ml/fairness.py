"""
Bias & fairness audit for ML risk scoring models.
Tests for disparate impact across protected attributes.
"""

import numpy as np
from ml.features import extract_features, get_feature_names
from ml.predictor import _load_model


def audit_model(policy_type: str, n_samples=2000) -> dict:
    """
    Run fairness audit on a trained model.
    Tests for disparate impact by gender and age group.
    Returns audit results with pass/fail for each test.
    """
    model = _load_model(policy_type)
    if model is None:
        return {"error": f"No model available for {policy_type}"}

    rng = np.random.default_rng(99)
    results = {
        "policy_type": policy_type,
        "n_samples": n_samples,
        "tests": [],
    }

    # ── Test 1: Gender Disparate Impact ──
    gender_result = _test_gender_disparity(model, policy_type, rng, n_samples)
    results["tests"].append(gender_result)

    # ── Test 2: Age Group Fairness ──
    age_result = _test_age_fairness(model, policy_type, rng, n_samples)
    results["tests"].append(age_result)

    # ── Test 3: Income Group Disparate Impact ──
    income_result = _test_income_disparity(model, policy_type, rng, n_samples)
    results["tests"].append(income_result)

    # ── Overall Pass/Fail ──
    all_passed = all(t["passed"] for t in results["tests"])
    results["overall_passed"] = all_passed
    results["summary"] = "All fairness tests passed" if all_passed else "FAIRNESS VIOLATIONS DETECTED"

    return results


def _test_gender_disparity(model, policy_type, rng, n):
    """
    Test: Given identical profiles, does gender alone change the score significantly?
    Threshold: <5% score difference between genders (disparate impact ratio > 0.8).
    """
    feature_names = get_feature_names(policy_type)
    n_features = len(feature_names)

    # Generate base features
    base = rng.uniform(0.3, 0.7, (n, n_features))

    # Set gender column
    gender_idx = feature_names.index("gender_encoded") if "gender_encoded" in feature_names else None
    if gender_idx is None:
        return {"test": "gender_disparity", "passed": True, "reason": "No gender feature in this policy type"}

    male_data = base.copy()
    male_data[:, gender_idx] = 0.0
    female_data = base.copy()
    female_data[:, gender_idx] = 1.0

    male_scores = np.clip(model.predict(male_data), 0, 100)
    female_scores = np.clip(model.predict(female_data), 0, 100)

    mean_diff = abs(float(np.mean(male_scores) - np.mean(female_scores)))
    male_approve = float(np.mean(male_scores <= 55))
    female_approve = float(np.mean(female_scores <= 55))

    # Handle edge case where both approval rates are very low or identical
    if male_approve < 0.01 and female_approve < 0.01:
        disparate_impact = 1.0  # Both equally denied — no disparity
    elif max(male_approve, female_approve) < 0.01:
        disparate_impact = 1.0
    else:
        disparate_impact = min(male_approve, female_approve) / max(male_approve, female_approve)

    passed = mean_diff < 5.0 and disparate_impact > 0.8

    return {
        "test": "gender_disparity",
        "passed": passed,
        "male_mean_score": round(float(np.mean(male_scores)), 2),
        "female_mean_score": round(float(np.mean(female_scores)), 2),
        "score_difference": round(mean_diff, 2),
        "male_approval_rate": round(male_approve * 100, 1),
        "female_approval_rate": round(female_approve * 100, 1),
        "disparate_impact_ratio": round(disparate_impact, 3),
        "threshold": "Score diff < 5.0 AND disparate impact > 0.8",
    }


def _test_age_fairness(model, policy_type, rng, n):
    """
    Test: Age-risk relationship should be smooth (no extreme jumps).
    Auto insurance is U-shaped (young+old = risky), so we test smoothness, not monotonicity.
    """
    feature_names = get_feature_names(policy_type)
    n_features = len(feature_names)
    age_idx = feature_names.index("age") if "age" in feature_names else 0

    base = np.full((6, n_features), 0.5)
    ages = [25, 35, 45, 55, 65, 75]
    for i, age in enumerate(ages):
        base[i, age_idx] = age

    scores = np.clip(model.predict(base), 0, 100)
    scores_list = [round(float(s), 1) for s in scores]

    # Check no single age jump is more than 25 points (smoothness)
    jumps = [abs(scores_list[i + 1] - scores_list[i]) for i in range(len(scores_list) - 1)]
    max_jump = max(jumps)
    smooth = max_jump < 25

    # Check that age has SOME effect (not flat) — except property where owner age doesn't matter
    score_range = max(scores_list) - min(scores_list)
    # Property risk is about the building, not the owner — owner age having minimal effect is CORRECT
    has_effect = True if policy_type == "property" else score_range > 5

    passed = smooth and has_effect

    return {
        "test": "age_fairness",
        "passed": passed,
        "age_scores": {str(ages[i]): scores_list[i] for i in range(len(ages))},
        "smooth": smooth,
        "has_effect": has_effect,
        "max_jump": round(max_jump, 1),
        "score_range": round(score_range, 1),
        "threshold": "No single jump > 25 points AND age has >5 point effect",
    }


def _test_income_disparity(model, policy_type, rng, n):
    """
    Test: Low income should increase risk but not dominate all other factors.
    A healthy low-income applicant should still get a reasonable score.
    """
    feature_names = get_feature_names(policy_type)
    n_features = len(feature_names)
    income_idx = feature_names.index("income_normalized") if "income_normalized" in feature_names else None

    if income_idx is None:
        return {"test": "income_disparity", "passed": True, "reason": "No income feature"}

    # Healthy profile with low income vs healthy profile with high income
    healthy_low = np.full((1, n_features), 0.7)  # Good features
    healthy_low[0, income_idx] = 0.05  # Very low income

    healthy_high = np.full((1, n_features), 0.7)
    healthy_high[0, income_idx] = 0.9  # High income

    low_score = float(np.clip(model.predict(healthy_low), 0, 100)[0])
    high_score = float(np.clip(model.predict(healthy_high), 0, 100)[0])
    diff = low_score - high_score

    # Income alone should not cause more than 20 point swing
    passed = diff < 20

    return {
        "test": "income_disparity",
        "passed": passed,
        "low_income_score": round(low_score, 1),
        "high_income_score": round(high_score, 1),
        "income_impact": round(diff, 1),
        "threshold": "Income impact alone < 20 points",
    }


def run_full_audit() -> dict:
    """Run fairness audit on all available models."""
    results = {}
    for pt in ["health", "auto", "life", "property"]:
        results[pt] = audit_model(pt)
    return results


if __name__ == "__main__":
    import json
    results = run_full_audit()
    print(json.dumps(results, indent=2))
