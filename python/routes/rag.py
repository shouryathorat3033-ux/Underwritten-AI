"""
RAG API Routes — knowledge base search, similar case retrieval, and stats.
"""

from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from rag.retriever import retrieve, retrieve_for_explanation, format_rag_context
from rag.knowledge_base import get_all_documents, get_documents_by_category
from rag.similar_cases import find_similar_cases, format_similar_cases

router = APIRouter()


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    category: Optional[str] = None
    threshold: float = 0.06


class SimilarCaseRequest(BaseModel):
    assessment: dict
    policyType: str = "health"
    limit: int = 5
    excludeId: Optional[str] = None


@router.post("/search")
async def search_knowledge_base(req: SearchRequest):
    """Search the RAG knowledge base with a natural language query."""
    results = retrieve(
        query=req.query,
        top_k=req.top_k,
        category=req.category,
        threshold=req.threshold,
    )
    return JSONResponse(content={
        "query": req.query,
        "results": results,
        "count": len(results),
    })


@router.post("/similar")
async def get_similar_cases(req: SimilarCaseRequest):
    """Find similar past assessments for a given risk profile."""
    cases = await find_similar_cases(
        assessment=req.assessment,
        policy_type=req.policyType,
        limit=req.limit,
        exclude_id=req.excludeId,
    )
    return JSONResponse(content={
        "cases": cases,
        "count": len(cases),
        "formatted": format_similar_cases(cases),
    })


@router.get("/documents")
async def list_documents(category: str = None):
    """List all knowledge base documents, optionally filtered by category."""
    if category:
        docs = get_documents_by_category(category)
    else:
        docs = get_all_documents()
    return JSONResponse(content={
        "documents": [{"id": d["id"], "category": d["category"], "source": d["source"], "preview": d["text"][:120]} for d in docs],
        "count": len(docs),
    })


@router.get("/stats")
async def rag_stats():
    """Get knowledge base statistics."""
    docs = get_all_documents()
    categories = {}
    for d in docs:
        categories[d["category"]] = categories.get(d["category"], 0) + 1
    return JSONResponse(content={
        "total_documents": len(docs),
        "categories": categories,
        "retrieval_method": "TF-IDF with cosine similarity",
        "features": ["Knowledge search", "Similar case retrieval", "Adverse action citations", "Chat grounding"],
    })
