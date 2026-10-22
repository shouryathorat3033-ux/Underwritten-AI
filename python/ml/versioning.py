"""
Model versioning, registry, and rollback support.
Tracks model metadata, training history, and deployment state.
"""

import os
import json
import hashlib
import shutil
from datetime import datetime

MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
REGISTRY_PATH = os.path.join(MODELS_DIR, "registry.json")


def _load_registry() -> dict:
    if os.path.exists(REGISTRY_PATH):
        with open(REGISTRY_PATH) as f:
            return json.load(f)
    return {"models": {}, "deployment_log": []}


def _save_registry(registry: dict):
    with open(REGISTRY_PATH, "w") as f:
        json.dump(registry, f, indent=2)


def _file_hash(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(8192), b""):
            h.update(chunk)
    return h.hexdigest()[:12]


def register_model(policy_type: str, metrics: dict) -> str:
    """Register a newly trained model with version tracking."""
    registry = _load_registry()
    model_path = os.path.join(MODELS_DIR, f"{policy_type}_model.joblib")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")

    model_hash = _file_hash(model_path)
    version = f"v{len(registry['models'].get(policy_type, {}).get('versions', [])) + 1}"
    timestamp = datetime.utcnow().isoformat()

    # Archive previous version
    versions = registry["models"].get(policy_type, {}).get("versions", [])
    if versions:
        prev = versions[-1]
        archive_name = f"{policy_type}_model_{prev['version']}.joblib"
        archive_path = os.path.join(MODELS_DIR, "archive", archive_name)
        os.makedirs(os.path.join(MODELS_DIR, "archive"), exist_ok=True)
        if os.path.exists(model_path) and not os.path.exists(archive_path):
            shutil.copy2(model_path, archive_path)

    entry = {
        "version": version,
        "hash": model_hash,
        "trained_at": timestamp,
        "metrics": {
            "test_mae": metrics.get("test_mae"),
            "test_r2": metrics.get("test_r2"),
            "cv_r2_mean": metrics.get("cv_r2_mean"),
            "n_samples": metrics.get("n_samples"),
        },
        "model_type": metrics.get("model_type", "StackedEnsemble"),
        "status": "active",
    }

    if policy_type not in registry["models"]:
        registry["models"][policy_type] = {"versions": [], "active_version": None}

    # Deactivate previous
    for v in registry["models"][policy_type]["versions"]:
        v["status"] = "archived"

    registry["models"][policy_type]["versions"].append(entry)
    registry["models"][policy_type]["active_version"] = version

    registry["deployment_log"].append({
        "action": "deploy",
        "policy_type": policy_type,
        "version": version,
        "hash": model_hash,
        "timestamp": timestamp,
    })

    _save_registry(registry)
    return version


def rollback_model(policy_type: str, target_version: str) -> bool:
    """Rollback to a previous model version."""
    registry = _load_registry()
    model_info = registry["models"].get(policy_type)
    if not model_info:
        return False

    target = None
    for v in model_info["versions"]:
        if v["version"] == target_version:
            target = v
            break

    if not target:
        return False

    archive_path = os.path.join(MODELS_DIR, "archive", f"{policy_type}_model_{target_version}.joblib")
    active_path = os.path.join(MODELS_DIR, f"{policy_type}_model.joblib")

    if not os.path.exists(archive_path):
        return False

    shutil.copy2(archive_path, active_path)

    for v in model_info["versions"]:
        v["status"] = "archived"
    target["status"] = "active"
    model_info["active_version"] = target_version

    registry["deployment_log"].append({
        "action": "rollback",
        "policy_type": policy_type,
        "version": target_version,
        "timestamp": datetime.utcnow().isoformat(),
    })

    _save_registry(registry)
    return True


def get_active_version(policy_type: str) -> dict | None:
    registry = _load_registry()
    model_info = registry["models"].get(policy_type)
    if not model_info:
        return None
    for v in model_info["versions"]:
        if v["status"] == "active":
            return v
    return None


def get_deployment_log() -> list:
    registry = _load_registry()
    return registry.get("deployment_log", [])


def get_full_registry() -> dict:
    return _load_registry()
