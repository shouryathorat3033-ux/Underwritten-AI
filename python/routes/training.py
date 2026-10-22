"""
Model retraining endpoint — combines synthetic data with real MongoDB assessments.

Training runs in a thread pool to avoid blocking the FastAPI async event loop.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
import asyncio
import numpy as np
import time
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGODB_URI, MONGODB_DB
from ml.features import extract_features, get_feature_names, FEATURE_MAP
from ml.train import GENERATORS, build_model, N_SAMPLES, MODELS_DIR
from ml.predictor import invalidate_cache, _baselines_cache
from ml.features import _training_means_cache

router = APIRouter()

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]


async def _fetch_mongodb_training_data(policy_type: str) -> tuple:
    """Extract (X, y) from completed MongoDB assessments."""
    query = {
        "policyType": policy_type,
        "status": {"$in": ["completed", "accepted", "rejected", "referred"]},
        "result.riskScore": {"$exists": True, "$ne": None},
    }
    cursor = db.assessments.find(query).sort("createdAt", -1).limit(5000)
    cases = await cursor.to_list(length=5000)

    if not cases:
        return None, None

    X_list, y_list = [], []
    for case in cases:
        try:
            features = extract_features(case, policy_type)
            score = float(case["result"]["riskScore"])
            if 0 <= score <= 100 and not np.any(np.isnan(features)) and not np.any(np.isinf(features)):
                X_list.append(features)
                y_list.append(score)
        except Exception:
            continue

    if len(X_list) < 5:
        return None, None
    return np.array(X_list), np.array(y_list)


def _train_single_model(pt, X_combined, y_combined, feature_names):
    """Synchronous training — runs in thread pool to not block async loop."""
    from sklearn.model_selection import train_test_split, cross_val_score
    from sklearn.metrics import mean_absolute_error, r2_score
    import joblib, json, os, csv

    X_train, X_test, y_train, y_test = train_test_split(
        X_combined, y_combined, test_size=0.2, random_state=42
    )

    model = build_model()
    model.fit(X_train, y_train)

    y_pred = np.clip(model.predict(X_test), 0, 100)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring="r2", n_jobs=-1)

    # Feature importances
    gbr = model.named_estimators_["gbr"]
    importances = gbr.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]

    # Save model
    joblib.dump(model, os.path.join(MODELS_DIR, f"{pt}_model.joblib"))

    # Save training data CSV (for baseline computation)
    csv_path = os.path.join(MODELS_DIR, f"{pt}_data.csv")
    with open(csv_path, "w", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(list(feature_names) + ["risk_score"])
        for xi, yi in zip(X_combined, y_combined):
            writer.writerow([round(float(v), 6) for v in xi] + [round(float(yi), 2)])

    # Save metrics
    metrics = {
        "policy_type": pt,
        "model_type": "StackedEnsemble(GBR+RF->Ridge)",
        "n_samples": len(X_combined),
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
    with open(os.path.join(MODELS_DIR, f"{pt}_metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    return mae, r2, float(cv_scores.mean()), metrics["top_features"][:5]


@router.post("/retrain")
async def retrain_models(body: dict = {}):
    """Retrain models using synthetic + MongoDB data. Runs in thread pool."""
    start = time.time()

    policy_types = body.get("policyTypes", ["health", "auto", "life", "property"])
    synthetic_ratio = max(0.1, min(1.0, body.get("syntheticRatio", 0.7)))

    results = {}

    for pt in policy_types:
        if pt not in GENERATORS:
            results[pt] = {"status": "error", "message": f"Unknown policy type: {pt}"}
            continue

        try:
            pt_start = time.time()

            # 1. Generate synthetic data
            n_synthetic = int(N_SAMPLES * synthetic_ratio)
            X_syn, y_syn = GENERATORS[pt](n_synthetic)

            # 2. Fetch real MongoDB data
            X_db, y_db = await _fetch_mongodb_training_data(pt)
            db_count = len(X_db) if X_db is not None else 0

            # 3. Combine
            if X_db is not None and len(X_db) > 0:
                max_db = int(N_SAMPLES * (1 - synthetic_ratio))
                if len(X_db) > max_db:
                    indices = np.random.choice(len(X_db), max_db, replace=False)
                    X_db, y_db = X_db[indices], y_db[indices]
                X_combined = np.vstack([X_syn, X_db])
                y_combined = np.concatenate([y_syn, y_db])
                data_source = "synthetic + mongodb"
            else:
                X_combined = X_syn
                y_combined = y_syn
                data_source = "synthetic only"

            # 4. Train in thread pool (non-blocking)
            feature_names = FEATURE_MAP[pt]
            mae, r2, cv_r2, top_feats = await asyncio.to_thread(
                _train_single_model, pt, X_combined, y_combined, feature_names
            )

            pt_time = round((time.time() - pt_start) * 1000)

            results[pt] = {
                "status": "success",
                "samples": len(X_combined),
                "synthetic": len(X_syn),
                "mongodb": db_count,
                "dataSource": data_source,
                "mae": round(mae, 2),
                "r2": round(r2, 4),
                "cvR2": round(cv_r2, 4),
                "trainingTimeMs": pt_time,
                "topFeatures": top_feats,
            }

        except Exception as e:
            import traceback
            traceback.print_exc()
            results[pt] = {"status": "error", "message": str(e)}

    # 5. Clear all caches
    invalidate_cache()
    _baselines_cache.clear()
    _training_means_cache.clear()

    total_time = round((time.time() - start) * 1000)

    return JSONResponse({
        "status": "complete",
        "results": results,
        "totalTimeMs": total_time,
        "syntheticRatio": synthetic_ratio,
    })


@router.get("/status")
async def training_status():
    """Check current model status and data availability."""
    import os, json

    model_status = {}
    for pt in ["health", "auto", "life", "property"]:
        model_path = os.path.join(MODELS_DIR, f"{pt}_model.joblib")
        metrics_path = os.path.join(MODELS_DIR, f"{pt}_metrics.json")

        info = {"modelExists": os.path.exists(model_path)}

        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                metrics = json.load(f)
            info["metrics"] = {
                "mae": metrics.get("test_mae"),
                "r2": metrics.get("test_r2"),
                "samples": metrics.get("n_samples"),
                "dataSource": metrics.get("data_source", "synthetic only"),
            }

        count = await db.assessments.count_documents({
            "policyType": pt,
            "status": {"$in": ["completed", "accepted", "rejected", "referred"]},
            "result.riskScore": {"$exists": True, "$ne": None},
        })
        info["mongodbAssessments"] = count

        model_status[pt] = info

    return JSONResponse({"models": model_status})
