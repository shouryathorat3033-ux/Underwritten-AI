"""
FastAPI Routes for Gemma 4 E4B Evidence-Based Reasoning.
Mounted at /api/reasoning
"""

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from slowapi import Limiter
from slowapi.util import get_remote_address

from services.reasoning import (
    check_ollama_health,
    generate_risk_reasoning,
    explain_document,
    answer_assessment_query,
    explain_fairness_audit,
)

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class RiskReasoningRequest(BaseModel):
    assessment: Dict[str, Any]
    ml_result: Dict[str, Any]
    policyType: str = "health"


class DocumentExplainRequest(BaseModel):
    doc_data: Dict[str, Any]
    doc_type: str = "general"


class AskAssessmentRequest(BaseModel):
    assessment: Dict[str, Any]
    ml_result: Optional[Dict[str, Any]] = None
    question: str


class FairnessExplainRequest(BaseModel):
    fairness_data: Dict[str, Any]
    policy_type: str = "health"


@router.get("/status")
async def get_status():
    """Check connectivity to Ollama and Gemma 4 E4B model availability."""
    health = await check_ollama_health()
    return JSONResponse(content=health)


@router.post("/risk-assessment")
@limiter.limit("20/minute")
async def risk_reasoning_endpoint(request: Request, req: RiskReasoningRequest):
    """
    Generate structured, evidence-based reasoning for completed insurance risk assessments
    using local Gemma 4 E4B model.
    """
    result = await generate_risk_reasoning(
        assessment=req.assessment,
        ml_result=req.ml_result,
        policy_type=req.policyType,
    )
    return JSONResponse(content=result)


@router.post("/document")
@limiter.limit("30/minute")
async def document_explain_endpoint(request: Request, req: DocumentExplainRequest):
    """Explain extracted document fields and flag missing or inconsistent values."""
    result = await explain_document(doc_data=req.doc_data, doc_type=req.doc_type)
    return JSONResponse(content=result)


@router.post("/ask")
@limiter.limit("30/minute")
async def ask_assessment_endpoint(request: Request, req: AskAssessmentRequest):
    """Answer questions about an assessment grounded solely in verified stored facts."""
    result = await answer_assessment_query(
        assessment=req.assessment,
        ml_result=req.ml_result or {},
        question=req.question,
    )
    return JSONResponse(content=result)


@router.post("/fairness")
@limiter.limit("15/minute")
async def fairness_explain_endpoint(request: Request, req: FairnessExplainRequest):
    """Explain ML model fairness audit metrics and compliance status."""
    result = await explain_fairness_audit(
        fairness_data=req.fairness_data,
        policy_type=req.policy_type,
    )
    return JSONResponse(content=result)
