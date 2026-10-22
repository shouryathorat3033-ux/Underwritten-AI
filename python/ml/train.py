"""
Training script for insurance risk scoring models.
Calibrated for the Indian insurance market (INR, CIBIL scores, Indian demographics).

Improvements over baseline:
- Stacked ensemble (GradientBoosting + RandomForest + Ridge)
- Cross-validation with 5 folds
- Engineered interaction features (age*smoking, income*credit)
- Larger dataset (10k samples) with realistic edge cases
- Sanity checks on known scenarios

Usage:
    python -m ml.train
"""

import os
import json
import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, StackingRegressor
from sklearn.linear_model import Ridge
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import PolynomialFeatures
from sklearn.pipeline import Pipeline

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)

N_SAMPLES = 10000


# ══════════════════════════════════════════════
# DATA GENERATORS — Indian market calibrated
# ══════════════════════════════════════════════

def _common_features(rng, n):
    """Generate features common across all policy types (Indian market)."""
    # Indian income: median ~₹5L, range ₹0–₹50L+, normalized by ₹25L
    income_raw = rng.lognormal(13.1, 0.8, n).clip(0, 5000000)
    income_raw[rng.random(n) < 0.08] = 0
    income_norm = np.minimum(1.0, income_raw / 2500000)

    # CIBIL score: range 300–900 (Indian credit bureau)
    credit_raw = rng.normal(720, 80, n).clip(300, 900)
    credit_raw[rng.random(n) < 0.06] = 0
    credit_norm = np.where(credit_raw <= 0, 0.0, np.clip((credit_raw - 300) / 600, 0, 1))

    tele = rng.normal(0.6, 0.2, n).clip(0, 1)
    tele[rng.random(n) < 0.12] = 0.3
    behav = rng.normal(0.6, 0.18, n).clip(0, 1)
    behav[rng.random(n) < 0.12] = 0.3
    life_score = rng.normal(0.55, 0.22, n).clip(0, 1)
    life_score[rng.random(n) < 0.12] = 0.3
    social_risk = rng.choice([0, 1, 1.5, 2], n, p=[0.35, 0.35, 0.10, 0.20])

    # Job stability: 0-1 (longer employment = more stable)
    job_stability = rng.normal(0.6, 0.2, n).clip(0, 1)
    job_stability[rng.random(n) < 0.10] = 0.3  # 10% missing

    completeness = rng.beta(5, 2, n)
    completeness[income_norm == 0] -= 0.15
    completeness[credit_norm == 0] -= 0.15
    completeness = np.clip(completeness, 0.1, 1.0)

    return income_norm, credit_norm, tele, behav, life_score, social_risk, job_stability, completeness


def _income_risk(income_norm):
    return np.where(income_norm <= 0.01, 20, np.where(income_norm < 0.15, 12,
           np.where(income_norm < 0.3, 6, np.where(income_norm > 0.8, -8, -2))))


def _credit_risk(credit_norm):
    return np.where(credit_norm <= 0.01, 18, np.where(credit_norm < 0.25, 12,
           np.where(credit_norm < 0.45, 5, np.where(credit_norm > 0.8, -8, -2))))


def _alt_data_risk(tele, behav, life_score, social_risk, tw=18, bw=14, lw=16):
    return -(tele - 0.5) * tw - (behav - 0.5) * bw - (life_score - 0.5) * lw + social_risk * 5


def generate_health_data(n=N_SAMPLES):
    rng = np.random.default_rng(42)
    age = rng.integers(18, 80, n).astype(float)
    gender = rng.choice([0, 1, 0.5], n, p=[0.45, 0.45, 0.1])
    income_norm, credit_norm, tele, behav, life_score, social_risk, job_stability, completeness = _common_features(rng, n)
    existing = rng.poisson(1.2, n).clip(0, 8).astype(float)
    bmi = rng.normal(27, 5.5, n).clip(15, 50)
    smoking = rng.choice([0, 1, 2], n, p=[0.50, 0.20, 0.30])
    exercise = rng.poisson(2.2, n).clip(0, 7).astype(float)
    medical = rng.poisson(0.9, n).clip(0, 6).astype(float)
    family = rng.poisson(0.5, n).clip(0, 4).astype(float)

    risk = np.full(n, 35.0)
    risk += np.where(age < 30, -3, np.where(age < 40, 2, np.where(age < 50, 8,
            np.where(age < 60, 16, np.where(age < 70, 25, 32)))))
    risk += np.where(bmi < 18.5, 10, np.where(bmi < 25, -3, np.where(bmi < 30, 6, np.where(bmi < 35, 14, 22))))
    risk += smoking * 13
    risk -= np.minimum(exercise * 2.5, 12)
    risk += medical * 7
    risk += family * 5
    # Interaction: age*smoking is worse than either alone
    risk += np.where((age > 50) & (smoking == 2), 8, 0)
    # Interaction: high BMI + low exercise
    risk += np.where((bmi > 30) & (exercise < 2), 6, 0)
    risk += _income_risk(income_norm)
    risk += _credit_risk(credit_norm)
    risk += _alt_data_risk(tele, behav, life_score, social_risk, 18, 14, 16)
    risk += (1 - completeness) * 12
    risk += rng.normal(0, 2.5, n)
    risk = np.clip(risk, 2, 98)

    risk -= (job_stability - 0.5) * 8  # stable job = lower risk
    risk = np.clip(risk, 2, 98)

    X = np.column_stack([age, gender, income_norm, credit_norm, existing,
        bmi, smoking, exercise, medical, family, tele, behav, life_score, social_risk, job_stability, completeness])
    return X, risk


def generate_auto_data(n=N_SAMPLES):
    rng = np.random.default_rng(43)
    age = rng.integers(17, 75, n).astype(float)
    gender = rng.choice([0, 1, 0.5], n, p=[0.48, 0.48, 0.04])
    income_norm, credit_norm, tele, behav, life_score, social_risk, job_stability, completeness = _common_features(rng, n)
    existing = rng.poisson(1.0, n).clip(0, 6).astype(float)
    driving = (age - 16 - rng.exponential(2, n)).clip(0, 55)
    accidents = rng.poisson(0.5, n).clip(0, 6).astype(float)
    violations = rng.poisson(0.7, n).clip(0, 8).astype(float)
    vehicle_age = rng.exponential(5, n).clip(0, 25)
    commute = rng.lognormal(2.8, 0.6, n).clip(1, 120)

    risk = np.full(n, 30.0)
    risk += np.where(age < 20, 28, np.where(age < 23, 18, np.where(age < 26, 10,
            np.where(age > 70, 10, np.where(age > 65, 6, 0)))))
    risk -= np.minimum(driving * 0.6, 12)
    risk += accidents * 14
    risk += violations * 9
    risk += np.where(vehicle_age < 2, 4, np.where(vehicle_age > 15, 5, 0))
    risk += np.where(commute > 60, 14, np.where(commute > 35, 7, np.where(commute < 10, -3, 0)))
    # Interaction: young driver + accidents is catastrophic
    risk += np.where((age < 25) & (accidents >= 2), 15, 0)
    # Interaction: high commute + violations
    risk += np.where((commute > 40) & (violations >= 2), 8, 0)
    # Income: capped to prevent dominance (max 15 point swing, ₹25L scale)
    risk += np.where(income_norm <= 0.01, 15, np.where(income_norm < 0.15, 8,
           np.where(income_norm < 0.3, 3, np.where(income_norm > 0.8, -5, -1))))
    risk += _credit_risk(credit_norm)
    risk += _alt_data_risk(tele, behav, life_score, social_risk, 22, 14, 10)
    risk -= (job_stability - 0.5) * 6
    risk += (1 - completeness) * 10
    risk += rng.normal(0, 2.5, n)
    risk = np.clip(risk, 2, 98)

    X = np.column_stack([age, gender, income_norm, credit_norm, existing,
        driving, accidents, violations, vehicle_age, commute, tele, behav, life_score, social_risk, job_stability, completeness])
    return X, risk


def generate_life_data(n=N_SAMPLES):
    rng = np.random.default_rng(44)
    age = rng.integers(18, 80, n).astype(float)
    gender = rng.choice([0, 1, 0.5], n, p=[0.47, 0.47, 0.06])
    income_norm, credit_norm, tele, behav, life_score, social_risk, job_stability, completeness = _common_features(rng, n)
    existing = rng.poisson(1.3, n).clip(0, 7).astype(float)
    smoking = rng.choice([0, 1, 2], n, p=[0.45, 0.22, 0.33])
    exercise = rng.poisson(2.0, n).clip(0, 7).astype(float)
    bmi = rng.normal(27, 5.5, n).clip(15, 50)
    dependents = rng.poisson(1.2, n).clip(0, 6).astype(float)
    family = rng.poisson(0.6, n).clip(0, 5).astype(float)

    risk = np.full(n, 25.0)
    risk += np.where(age < 30, -2, np.where(age < 40, 5, np.where(age < 50, 14,
            np.where(age < 60, 24, np.where(age < 70, 36, 48)))))
    risk += smoking * 15
    risk -= np.minimum(exercise * 2.5, 12)
    risk += np.where(bmi < 25, -2, np.where(bmi < 30, 4, np.where(bmi < 35, 12, 22)))
    risk += family * 6
    # Interaction: old age + smoking = exponential danger
    risk += np.where((age > 55) & (smoking == 2), 12, 0)
    # Interaction: family history + high BMI
    risk += np.where((family >= 2) & (bmi > 30), 7, 0)
    # Income: capped to prevent dominance (max 15 point swing, ₹25L scale)
    risk += np.where(income_norm <= 0.01, 15, np.where(income_norm < 0.15, 8,
           np.where(income_norm < 0.3, 3, np.where(income_norm > 0.8, -5, -1))))
    risk += _credit_risk(credit_norm)
    risk += _alt_data_risk(tele, behav, life_score, social_risk, 10, 14, 18)
    risk -= (job_stability - 0.5) * 8
    risk += (1 - completeness) * 10
    risk += rng.normal(0, 2.5, n)
    risk = np.clip(risk, 2, 98)

    X = np.column_stack([age, gender, income_norm, credit_norm, existing,
        smoking, exercise, bmi, dependents, family, tele, behav, life_score, social_risk, job_stability, completeness])
    return X, risk


def generate_property_data(n=N_SAMPLES):
    rng = np.random.default_rng(45)
    age = rng.integers(22, 80, n).astype(float)
    income_norm, credit_norm, tele, behav, life_score, social_risk, job_stability, completeness = _common_features(rng, n)
    existing = rng.poisson(1.5, n).clip(0, 8).astype(float)
    prop_age = rng.exponential(18, n).clip(0, 100)
    # Indian property: median ~₹50L, range ₹10L–₹5Cr, normalized by ₹3Cr
    prop_value_norm = np.minimum(1.0, rng.lognormal(15.5, 0.7, n).clip(1000000, 50000000) / 30000000)
    # Indian home sizes: mean ~1000 sqft, range 300–4000, normalized by 3000
    sqft_norm = np.minimum(1.0, rng.normal(1000, 350, n).clip(300, 4000) / 3000)
    # Construction type: concrete/steel=0, brick=1, wood=2
    construction = rng.choice([0, 1, 2], n, p=[0.35, 0.40, 0.25]).astype(float)
    flood = rng.choice([0, 1, 2, 3], n, p=[0.30, 0.30, 0.22, 0.18])
    security = rng.choice([0, 1, 2], n, p=[0.28, 0.38, 0.34])

    risk = np.full(n, 30.0)
    risk += np.where(prop_age < 5, -5, np.where(prop_age < 15, 0,
            np.where(prop_age < 30, 8, np.where(prop_age < 50, 16, 26))))
    risk += construction * 5  # wood is riskier
    risk += flood * 9
    risk -= security * 7
    risk += prop_value_norm * 8
    # Interaction: old property + flood zone = disaster
    risk += np.where((prop_age > 30) & (flood >= 2), 10, 0)
    # Interaction: no security + high value
    risk += np.where((security == 0) & (prop_value_norm > 0.5), 8, 0)
    # Interaction: wood construction + old property
    risk += np.where((construction == 2) & (prop_age > 30), 6, 0)
    risk += _income_risk(income_norm)
    risk += _credit_risk(credit_norm)
    risk += _alt_data_risk(tele, behav, life_score, social_risk, 10, 12, 10)
    risk -= (job_stability - 0.5) * 5
    risk += (1 - completeness) * 10
    risk += rng.normal(0, 3, n)
    risk = np.clip(risk, 2, 98)

    X = np.column_stack([age, income_norm, credit_norm, existing,
        prop_age, prop_value_norm, sqft_norm, construction, flood, security,
        tele, behav, life_score, social_risk, job_stability, completeness])
    return X, risk


GENERATORS = {
    "health": generate_health_data,
    "auto": generate_auto_data,
    "life": generate_life_data,
    "property": generate_property_data,
}


# ══════════════════════════════════════════════
# MODEL TRAINING
# ══════════════════════════════════════════════

def build_model():
    """Build a stacked ensemble: GBR + RF → Ridge meta-learner."""
    estimators = [
        ("gbr", GradientBoostingRegressor(
            n_estimators=300, max_depth=5, learning_rate=0.08,
            min_samples_split=10, min_samples_leaf=5, subsample=0.85, random_state=42,
        )),
        ("rf", RandomForestRegressor(
            n_estimators=200, max_depth=8, min_samples_leaf=5,
            random_state=42, n_jobs=-1,
        )),
    ]
    return StackingRegressor(
        estimators=estimators,
        final_estimator=Ridge(alpha=1.0),
        cv=5,
        n_jobs=-1,
    )


def train_model(policy_type: str):
    print(f"\n{'='*55}")
    print(f"  Training {policy_type.upper()} model ({N_SAMPLES} samples)")
    print(f"{'='*55}")

    X, y = GENERATORS[policy_type](N_SAMPLES)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = build_model()
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    y_pred = np.clip(y_pred, 0, 100)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    # Cross-validation
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)

    print(f"  Test MAE:     {mae:.2f}")
    print(f"  Test R2:      {r2:.4f}")
    print(f"  CV R2 (mean): {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
    print(f"  Score range:  {y_pred.min():.1f} - {y_pred.max():.1f}")

    # Feature importances (from GBR sub-model)
    from ml.features import FEATURE_MAP
    feature_names = FEATURE_MAP[policy_type]
    gbr = model.named_estimators_["gbr"]
    importances = gbr.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    print(f"  Top features:")
    for i in sorted_idx[:6]:
        print(f"    {feature_names[i]:30s} {importances[i]:.3f}")

    # Sanity checks
    print(f"\n  Sanity checks:")
    _run_sanity_checks(model, policy_type)

    # Save model
    model_path = os.path.join(MODELS_DIR, f"{policy_type}_model.joblib")
    joblib.dump(model, model_path)

    metrics = {
        "policy_type": policy_type,
        "model_type": "StackedEnsemble(GBR+RF->Ridge)",
        "n_samples": N_SAMPLES,
        "test_mae": round(mae, 2),
        "test_r2": round(r2, 4),
        "cv_r2_mean": round(float(cv_scores.mean()), 4),
        "cv_r2_std": round(float(cv_scores.std()), 4),
        "score_range": [round(float(y_pred.min()), 1), round(float(y_pred.max()), 1)],
        "top_features": [
            {"name": feature_names[i], "importance": round(float(importances[i]), 4)}
            for i in sorted_idx[:8]
        ],
    }
    metrics_path = os.path.join(MODELS_DIR, f"{policy_type}_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)

    return model, metrics


def _run_sanity_checks(model, policy_type):
    """Test known scenarios produce sensible scores."""
    if policy_type == "health":
        healthy = np.array([[25, 1, 0.8, 0.85, 1, 22, 0, 5, 0, 0, 0.8, 0.8, 0.8, 0, 0.7, 0.95]])
        risky = np.array([[65, 0, 0.0, 0.0, 0, 38, 2, 0, 4, 3, 0.3, 0.3, 0.3, 2, 0.3, 0.2]])
        mid = np.array([[40, 0.5, 0.4, 0.5, 1, 27, 1, 2, 1, 1, 0.5, 0.5, 0.5, 1, 0.5, 0.7]])
        s1, s2, s3 = model.predict(healthy)[0], model.predict(risky)[0], model.predict(mid)[0]
        print(f"    Healthy 25yo, good data:     {max(0,min(100,s1)):.0f}")
        print(f"    Risky 65yo smoker, no income: {max(0,min(100,s2)):.0f}")
        print(f"    Average 40yo, mid data:       {max(0,min(100,s3)):.0f}")
        assert s2 > s1 + 25, f"FAIL: risky ({s2:.0f}) not much higher than healthy ({s1:.0f})"
        assert s3 > s1 and s3 < s2, f"FAIL: mid ({s3:.0f}) not between healthy and risky"

    elif policy_type == "auto":
        safe = np.array([[35, 1, 0.8, 0.85, 2, 15, 0, 0, 3, 15, 0.85, 0.8, 0.7, 0, 0.7, 0.95]])
        risky = np.array([[19, 0, 0.0, 0.0, 0, 1, 3, 4, 1, 70, 0.3, 0.3, 0.3, 2, 0.3, 0.2]])
        mid = np.array([[30, 0.5, 0.4, 0.5, 1, 8, 1, 1, 5, 25, 0.5, 0.5, 0.5, 1, 0.5, 0.7]])
        s1, s2, s3 = model.predict(safe)[0], model.predict(risky)[0], model.predict(mid)[0]
        print(f"    Safe 35yo, clean record:      {max(0,min(100,s1)):.0f}")
        print(f"    Young 19yo, 3 accidents:      {max(0,min(100,s2)):.0f}")
        print(f"    Average 30yo, 1 accident:     {max(0,min(100,s3)):.0f}")
        assert s2 > s1 + 25, f"FAIL: risky ({s2:.0f}) not much higher than safe ({s1:.0f})"

    elif policy_type == "life":
        young = np.array([[25, 1, 0.8, 0.85, 1, 0, 5, 22, 0, 0, 0.8, 0.8, 0.8, 0, 0.7, 0.95]])
        old_smoker = np.array([[70, 0, 0.0, 0.0, 0, 2, 0, 35, 3, 3, 0.3, 0.3, 0.3, 2, 0.3, 0.2]])
        s1, s2 = model.predict(young)[0], model.predict(old_smoker)[0]
        print(f"    Young 25yo non-smoker:        {max(0,min(100,s1)):.0f}")
        print(f"    70yo smoker, no income:       {max(0,min(100,s2)):.0f}")
        assert s2 > s1 + 30, f"FAIL: old smoker ({s2:.0f}) not much higher than young ({s1:.0f})"

    elif policy_type == "property":
        #                  age  inc  cred ex  page pval sqft cons flood sec  tele beh  life soc  job  comp
        good = np.array([[35, 0.8, 0.85, 2, 3, 0.3, 0.4, 0, 0, 2, 0.8, 0.8, 0.8, 0, 0.7, 0.95]])
        bad = np.array([[60, 0.0, 0.0, 0, 60, 0.8, 0.6, 2, 3, 0, 0.3, 0.3, 0.3, 2, 0.3, 0.2]])
        s1, s2 = model.predict(good)[0], model.predict(bad)[0]
        print(f"    New property, good area:      {max(0,min(100,s1)):.0f}")
        print(f"    Old property, flood zone:     {max(0,min(100,s2)):.0f}")
        assert s2 > s1 + 20, f"FAIL: bad property ({s2:.0f}) not much higher than good ({s1:.0f})"

    print(f"    All sanity checks passed.")


def train_all():
    print("=" * 55)
    print("  UnderwriteAI - ML Model Training")
    print("  Stacked Ensemble (GBR + RF -> Ridge)")
    print("=" * 55)

    results = {}
    for policy_type in GENERATORS:
        model, metrics = train_model(policy_type)
        results[policy_type] = metrics

    print(f"\n{'='*55}")
    print("  All models trained successfully!")
    print(f"{'='*55}")
    for pt, m in results.items():
        print(f"  {pt:10s}  MAE={m['test_mae']:.2f}  R2={m['test_r2']:.4f}  CV_R2={m['cv_r2_mean']:.4f}")

    return results


if __name__ == "__main__":
    train_all()
