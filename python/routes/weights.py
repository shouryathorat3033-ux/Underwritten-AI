"""Weight configuration API — allows insurers to customize risk factor importance."""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from ml.weights import (
    DEFAULT_WEIGHTS, WEIGHT_LABELS, WEIGHT_TO_FEATURES,
    load_weights, save_weights, validate_weights, simulate_with_weights,
)

router = APIRouter()

VALID_POLICY_TYPES = {"health", "auto", "life", "property"}


class WeightConfig(BaseModel):
    policyType: str
    weights: dict
    name: Optional[str] = "custom"


class SimulateRequest(BaseModel):
    policyType: str
    weights: dict
    assessment: dict


@router.get("/{policy_type}")
async def get_weights(policy_type: str):
    """Get current weight config for a policy type."""
    if policy_type not in VALID_POLICY_TYPES:
        return JSONResponse(content={"error": "Invalid policy type"}, status_code=400)

    weights = load_weights(policy_type)
    defaults = DEFAULT_WEIGHTS.get(policy_type, {})
    feature_map = WEIGHT_TO_FEATURES.get(policy_type, {})

    categories = []
    for key in defaults:
        categories.append({
            "key": key,
            "label": WEIGHT_LABELS.get(key, key),
            "weight": weights.get(key, defaults[key]),
            "default": defaults[key],
            "feature": feature_map.get(key, key),
        })

    return JSONResponse(content={
        "policy_type": policy_type,
        "total": sum(weights.values()),
        "categories": categories,
        "weights": weights,
    })


@router.post("")
async def set_weights(req: WeightConfig):
    """Save custom weight config. Weights must sum to 100."""
    if req.policyType not in VALID_POLICY_TYPES:
        return JSONResponse(content={"error": "Invalid policy type"}, status_code=400)

    valid, msg = validate_weights(req.weights, req.policyType)
    if not valid:
        return JSONResponse(content={"error": msg}, status_code=400)

    try:
        config = save_weights(req.policyType, req.weights, req.name)
        return JSONResponse(content={"status": "saved", **config})
    except Exception as e:
        return JSONResponse(content={"error": f"Save failed: {str(e)}"}, status_code=500)


@router.post("/reset/{policy_type}")
async def reset_weights(policy_type: str):
    """Reset weights to defaults."""
    if policy_type not in VALID_POLICY_TYPES:
        return JSONResponse(content={"error": "Invalid policy type"}, status_code=400)

    defaults = DEFAULT_WEIGHTS.get(policy_type, {})
    config = save_weights(policy_type, defaults, "default")
    return JSONResponse(content={"status": "reset", **config})


@router.post("/simulate")
async def simulate(req: SimulateRequest):
    """Compare default vs custom-weighted scoring on an assessment."""
    if req.policyType not in VALID_POLICY_TYPES:
        return JSONResponse(content={"error": "Invalid policy type"}, status_code=400)

    valid, msg = validate_weights(req.weights, req.policyType)
    if not valid:
        return JSONResponse(content={"error": msg}, status_code=400)

    try:
        result = simulate_with_weights(req.assessment, req.policyType, req.weights)
        if not result:
            return JSONResponse(content={"error": "Simulation failed — model may not be loaded"}, status_code=500)
        return JSONResponse(content=result)
    except Exception as e:
        return JSONResponse(content={"error": f"Simulation error: {str(e)}"}, status_code=500)


@router.get("")
async def list_all_weights():
    """Get weight configs for all policy types."""
    result = {}
    for pt in VALID_POLICY_TYPES:
        weights = load_weights(pt)
        result[pt] = {
            "weights": weights,
            "total": sum(weights.values()),
        }
    return JSONResponse(content=result)
