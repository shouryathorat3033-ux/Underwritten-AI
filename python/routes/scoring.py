"""
ML scoring API — enterprise-grade with validation, monitoring, fairness, versioning.
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, field_validator
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from ml.predictor import predict_risk, is_model_available, get_model_info, invalidate_cache
from ml.logger import metrics as ml_metrics
from ml.fairness import audit_model, run_full_audit
from ml.versioning import get_full_registry, get_deployment_log
from rag.retriever import retrieve_for_adverse_action

limiter = Limiter(key_func=get_remote_address)

router = APIRouter()

VALID_POLICY_TYPES = {"health", "auto", "life", "property"}


class ScoringRequest(BaseModel):
    assessment: dict
    policyType: str = "health"

    @field_validator("policyType")
    @classmethod
    def validate_policy_type(cls, v):
        if v not in VALID_POLICY_TYPES:
            raise ValueError(f"policyType must be one of: {VALID_POLICY_TYPES}")
        return v

    @field_validator("assessment")
    @classmethod
    def validate_assessment(cls, v):
        if not isinstance(v, dict):
            raise ValueError("assessment must be a valid object")
        if "applicant" not in v:
            raise ValueError("assessment must contain 'applicant' field")
        applicant = v.get("applicant", {})
        if not applicant.get("name"):
            raise ValueError("assessment.applicant.name is required")
        return v


@router.post("")
@limiter.limit("30/minute")
async def score(request: Request, req: ScoringRequest):
    """Score an assessment using the trained ML model."""
    if not is_model_available(req.policyType):
        return JSONResponse(
            content={
                "error": f"No ML model trained for '{req.policyType}'",
                "resolution": "Run: python -m ml.train",
                "available_types": list(VALID_POLICY_TYPES),
            },
            status_code=404,
        )

    result = predict_risk(req.assessment, req.policyType)
    if result is None:
        return JSONResponse(
            content={"error": "Prediction failed. Check server logs for details."},
            status_code=500,
        )

    # ── RAG: enrich adverse action reasons with regulation citations ──
    if result.get("adverseActionReasons"):
        factor_names = [r.get("factor", "") for r in result["adverseActionReasons"]]
        rag_docs = retrieve_for_adverse_action(factor_names, req.policyType)
        if rag_docs:
            result["regulatoryCitations"] = [
                {"source": d["source"], "text": d["text"][:200], "relevance": d["score"]}
                for d in rag_docs[:3]
            ]

    return JSONResponse(content=result)


@router.get("/models")
async def list_models():
    """List available ML models, their metrics, and versions."""
    models = {}
    for pt in VALID_POLICY_TYPES:
        if is_model_available(pt):
            info = get_model_info(pt) or {}
            info["status"] = "active"
            models[pt] = info
        else:
            models[pt] = {"status": "not_trained"}
    return JSONResponse(content=models)


@router.get("/metrics")
async def get_metrics():
    """Get live prediction metrics (latency, error rate, score distributions)."""
    return JSONResponse(content=ml_metrics.get_metrics())


@router.get("/fairness")
async def fairness_audit():
    """Run fairness audit on all trained models."""
    results = run_full_audit()
    return JSONResponse(content=results)


@router.get("/fairness/{policy_type}")
async def fairness_audit_single(policy_type: str):
    """Run fairness audit on a single model."""
    if policy_type not in VALID_POLICY_TYPES:
        return JSONResponse(content={"error": "Invalid policy type"}, status_code=400)
    result = audit_model(policy_type)
    return JSONResponse(content=result)


@router.get("/registry")
async def model_registry():
    """Get full model registry with version history."""
    return JSONResponse(content=get_full_registry())


@router.get("/deployments")
async def deployment_log():
    """Get model deployment history."""
    return JSONResponse(content=get_deployment_log())


@router.post("/cache/invalidate")
async def clear_cache():
    """Invalidate model cache (force reload on next prediction)."""
    invalidate_cache()
    return JSONResponse(content={"status": "cache_cleared"})
