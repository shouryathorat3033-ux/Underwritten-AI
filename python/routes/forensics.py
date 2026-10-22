"""
Document forensic verification endpoint.
Performs pixel-level analysis — no LLM needed.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from services.document_forensics import verify_document

router = APIRouter()


class VerifyRequest(BaseModel):
    documentUrl: str
    expectedType: str = "document"


@router.post("")
async def verify(req: VerifyRequest):
    """Run forensic analysis on a document image."""
    result = await verify_document(req.documentUrl, req.expectedType)
    return result
