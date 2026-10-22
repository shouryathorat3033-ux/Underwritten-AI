"""
Comprehensive test suite for ML pipeline.
Covers: features, prediction, edge cases, fairness, adversarial inputs.

Usage:
    python -m pytest ml/tests.py -v
    python -m ml.tests  (standalone)
"""

import numpy as np
import sys

from ml.features import (
    extract_features, get_feature_names, normalize_income, normalize_credit,
    normalize_alt_score, encode_smoking, encode_gender, encode_social_media_risk,
    calculate_completeness, safe_float,
)
from ml.predictor import predict_risk, is_model_available


# ══════════════════════════════════════════
# FEATURE ENGINEERING TESTS
# ══════════════════════════════════════════

def test_normalize_income():
    assert normalize_income(0) == 0.0, "Zero income should be max risk (0.0)"
    assert normalize_income(None) == 0.0, "Missing income should be max risk"
    assert normalize_income("") == 0.0, "Empty income should be max risk"
    assert normalize_income(2500000) == 1.0, "₹25L income should be 1.0"
    assert normalize_income(1250000) == 0.5, "₹12.5L income should be 0.5"
    assert normalize_income(5000000) == 1.0, "₹50L should clamp to 1.0"
    print("  PASS: test_normalize_income")


def test_normalize_credit():
    assert normalize_credit(0) == 0.0, "Zero CIBIL should be max risk"
    assert normalize_credit(None) == 0.0, "Missing CIBIL should be max risk"
    assert normalize_credit(300) == 0.0, "CIBIL 300 = min (0.0)"
    assert normalize_credit(900) == 1.0, "CIBIL 900 = max (1.0)"
    assert 0.6 < normalize_credit(700) < 0.7, "CIBIL 700 should be ~0.67"
    print("  PASS: test_normalize_credit")


def test_normalize_alt_score():
    assert normalize_alt_score(None) == 0.3, "Missing alt score = 0.3 (risky)"
    assert normalize_alt_score(-1) == 0.3, "Negative = 0.3"
    assert normalize_alt_score(100) == 1.0, "Score 100 = 1.0"
    assert normalize_alt_score(0) == 0.0, "Score 0 = 0.0"
    assert normalize_alt_score(50) == 0.5, "Score 50 = 0.5"
    print("  PASS: test_normalize_alt_score")


def test_encode_smoking():
    assert encode_smoking("never") == 0
    assert encode_smoking("former") == 1
    assert encode_smoking("current") == 2
    assert encode_smoking(None) == 1, "Unknown smoking = moderate risk"
    assert encode_smoking("NEVER") == 0, "Case insensitive"
    print("  PASS: test_encode_smoking")


def test_encode_gender():
    assert encode_gender("male") == 0
    assert encode_gender("female") == 1
    assert encode_gender("M") == 0
    assert encode_gender(None) == 0.5, "Unknown gender = neutral"
    print("  PASS: test_encode_gender")


def test_safe_float():
    assert safe_float(None, 5.0) == 5.0
    assert safe_float("", 5.0) == 5.0
    assert safe_float("abc", 5.0) == 5.0
    assert safe_float(42, 0) == 42.0
    assert safe_float("3.14", 0) == 3.14
    assert safe_float("Not provided", 5.0) == 5.0
    print("  PASS: test_safe_float")


def test_data_completeness():
    full = {
        "applicant": {"age": 30, "gender": "male", "occupation": "Engineer"},
        "traditionalData": {"income": 1000000, "creditScore": 750},
        "alternativeData": {"telematicsScore": 80, "behavioralScore": 70, "lifestyleScore": 60},
        "policySpecificData": {"bmi": 24, "smokingStatus": "never", "exerciseFrequency": 4},
    }
    empty = {"applicant": {}, "traditionalData": {}, "alternativeData": {}, "policySpecificData": {}}

    c_full = calculate_completeness(full, "health")
    c_empty = calculate_completeness(empty, "health")
    assert c_full > 0.8, f"Full data should have high completeness, got {c_full}"
    assert c_empty < 0.3, f"Empty data should have low completeness, got {c_empty}"
    print("  PASS: test_data_completeness")


def test_feature_extraction_shape():
    assessment = {"applicant": {"age": 30}, "traditionalData": {}, "alternativeData": {}, "policySpecificData": {}}
    for pt in ["health", "auto", "life", "property"]:
        features = extract_features(assessment, pt)
        expected_len = len(get_feature_names(pt))
        assert len(features) == expected_len, f"{pt}: expected {expected_len} features, got {len(features)}"
        assert not np.any(np.isnan(features)), f"{pt}: NaN in features"
        assert not np.any(np.isinf(features)), f"{pt}: Inf in features"
    print("  PASS: test_feature_extraction_shape")


def test_missing_data_produces_high_risk_features():
    empty = {"applicant": {}, "traditionalData": {}, "alternativeData": {}, "policySpecificData": {}}
    features = extract_features(empty, "health")
    names = get_feature_names("health")

    income_idx = names.index("income_normalized")
    credit_idx = names.index("credit_score_normalized")
    assert features[income_idx] == 0.0, "Missing income should be 0.0"
    assert features[credit_idx] == 0.0, "Missing credit should be 0.0"
    print("  PASS: test_missing_data_produces_high_risk_features")


# ══════════════════════════════════════════
# PREDICTION TESTS
# ══════════════════════════════════════════

def test_prediction_returns_valid_structure():
    assessment = {
        "applicant": {"name": "Test", "age": 35, "gender": "male"},
        "traditionalData": {"income": 1000000, "creditScore": 720},
        "alternativeData": {"telematicsScore": 65, "behavioralScore": 60, "lifestyleScore": 55},
        "policySpecificData": {"bmi": 25, "smokingStatus": "never", "exerciseFrequency": 3},
    }
    for pt in ["health", "auto", "life", "property"]:
        if not is_model_available(pt):
            print(f"  SKIP: {pt} model not trained")
            continue
        result = predict_risk(assessment, pt)
        assert result is not None, f"{pt}: prediction returned None"
        assert "riskScore" in result, f"{pt}: missing riskScore"
        assert "decision" in result, f"{pt}: missing decision"
        assert "confidence" in result, f"{pt}: missing confidence"
        assert "recommendedPremium" in result, f"{pt}: missing premium"
        assert "factors" in result, f"{pt}: missing factors"
        assert 0 <= result["riskScore"] <= 100, f"{pt}: score out of range: {result['riskScore']}"
        assert result["decision"] in ("approve", "refer", "decline"), f"{pt}: invalid decision"
        assert 0 <= result["confidence"] <= 100, f"{pt}: confidence out of range"
        assert len(result["factors"]) > 0, f"{pt}: no factors returned"
    print("  PASS: test_prediction_returns_valid_structure")


def test_zero_income_produces_high_risk():
    poor = {
        "applicant": {"name": "Test", "age": 40},
        "traditionalData": {"income": 0, "creditScore": 0},
        "alternativeData": {},
        "policySpecificData": {},
    }
    rich = {
        "applicant": {"name": "Test", "age": 40},
        "traditionalData": {"income": 2500000, "creditScore": 850},
        "alternativeData": {"telematicsScore": 90, "behavioralScore": 85, "lifestyleScore": 80},
        "policySpecificData": {"bmi": 22, "smokingStatus": "never", "exerciseFrequency": 5},
    }
    for pt in ["health", "life"]:
        if not is_model_available(pt):
            continue
        r_poor = predict_risk(poor, pt)
        r_rich = predict_risk(rich, pt)
        assert r_poor and r_rich, f"{pt}: prediction failed"
        assert r_poor["riskScore"] > r_rich["riskScore"] + 15, \
            f"{pt}: zero income ({r_poor['riskScore']}) should be much higher than rich ({r_rich['riskScore']})"
    print("  PASS: test_zero_income_produces_high_risk")


def test_adverse_action_for_declined():
    risky = {
        "applicant": {"name": "Test", "age": 70},
        "traditionalData": {"income": 0, "creditScore": 0},
        "alternativeData": {},
        "policySpecificData": {"smokingStatus": "current", "bmi": 40},
    }
    for pt in ["health", "life"]:
        if not is_model_available(pt):
            continue
        result = predict_risk(risky, pt)
        if result and result["decision"] in ("refer", "decline"):
            assert "adverseActionReasons" in result, f"{pt}: declined but no adverse action reasons"
            assert len(result["adverseActionReasons"]) > 0, f"{pt}: empty adverse action reasons"
    print("  PASS: test_adverse_action_for_declined")


def test_invalid_policy_type_returns_none():
    assessment = {"applicant": {"name": "Test"}, "traditionalData": {}, "alternativeData": {}, "policySpecificData": {}}
    result = predict_risk(assessment, "invalid_type")
    assert result is None, "Invalid policy type should return None"
    print("  PASS: test_invalid_policy_type_returns_none")


# ══════════════════════════════════════════
# EDGE CASE TESTS
# ══════════════════════════════════════════

def test_extreme_values():
    extreme = {
        "applicant": {"name": "Test", "age": 150, "gender": "unknown"},
        "traditionalData": {"income": 999999999, "creditScore": 9999},
        "alternativeData": {"telematicsScore": 999, "behavioralScore": -50},
        "policySpecificData": {"bmi": 100, "smokingStatus": "something_weird"},
    }
    for pt in ["health", "auto", "life", "property"]:
        if not is_model_available(pt):
            continue
        result = predict_risk(extreme, pt)
        assert result is not None, f"{pt}: crashed on extreme values"
        assert 0 <= result["riskScore"] <= 100, f"{pt}: score not clamped"
    print("  PASS: test_extreme_values")


def test_empty_assessment():
    empty = {"applicant": {"name": "Test"}, "traditionalData": {}, "alternativeData": {}, "policySpecificData": {}}
    for pt in ["health", "auto", "life", "property"]:
        if not is_model_available(pt):
            continue
        result = predict_risk(empty, pt)
        assert result is not None, f"{pt}: crashed on empty assessment"
        assert result["riskScore"] > 40, f"{pt}: empty data should be risky, got {result['riskScore']}"
    print("  PASS: test_empty_assessment")


# ══════════════════════════════════════════
# FAIRNESS TESTS
# ══════════════════════════════════════════

def test_gender_does_not_dominate():
    """Changing only gender should not change score by more than 5 points."""
    base = {
        "applicant": {"name": "Test", "age": 40},
        "traditionalData": {"income": 1000000, "creditScore": 720},
        "alternativeData": {"telematicsScore": 60, "behavioralScore": 60, "lifestyleScore": 60},
        "policySpecificData": {"bmi": 26, "smokingStatus": "never", "exerciseFrequency": 3},
    }
    for pt in ["health", "life"]:
        if not is_model_available(pt):
            continue
        base["applicant"]["gender"] = "male"
        r_male = predict_risk(base, pt)
        base["applicant"]["gender"] = "female"
        r_female = predict_risk(base, pt)
        if r_male and r_female:
            diff = abs(r_male["riskScore"] - r_female["riskScore"])
            assert diff < 5, f"{pt}: gender alone changed score by {diff} points (should be <5)"
    print("  PASS: test_gender_does_not_dominate")


# ══════════════════════════════════════════
# RUNNER
# ══════════════════════════════════════════

ALL_TESTS = [
    # Feature tests
    test_normalize_income,
    test_normalize_credit,
    test_normalize_alt_score,
    test_encode_smoking,
    test_encode_gender,
    test_safe_float,
    test_data_completeness,
    test_feature_extraction_shape,
    test_missing_data_produces_high_risk_features,
    # Prediction tests
    test_prediction_returns_valid_structure,
    test_zero_income_produces_high_risk,
    test_adverse_action_for_declined,
    test_invalid_policy_type_returns_none,
    # Edge cases
    test_extreme_values,
    test_empty_assessment,
    # Fairness
    test_gender_does_not_dominate,
]


def run_all_tests():
    print("=" * 55)
    print("  UnderwriteAI ML Pipeline - Test Suite")
    print("=" * 55)

    passed = 0
    failed = 0
    for test_fn in ALL_TESTS:
        try:
            test_fn()
            passed += 1
        except AssertionError as e:
            print(f"  FAIL: {test_fn.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR: {test_fn.__name__}: {e}")
            failed += 1

    print(f"\n{'='*55}")
    print(f"  Results: {passed} passed, {failed} failed, {passed + failed} total")
    print(f"{'='*55}")

    return failed == 0


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)
