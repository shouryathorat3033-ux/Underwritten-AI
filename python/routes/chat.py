from fastapi import APIRouter
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional
from utils.helpers import detect_intent
from services.prompts import build_system_prompt
from services.context import build_context
from services.llm import stream_chat
from actions.handler import handle_action
from config.settings import MAX_HISTORY, MAX_MSG_LENGTH
from rag.retriever import retrieve_for_chat, format_rag_context
from rag.similar_cases import find_similar_cases, format_similar_cases

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    page: Optional[str] = "/"
    history: Optional[list] = []
    user: Optional[dict] = {}


@router.post("")
async def chat(req: ChatRequest):
    # 1. Classify intent
    intent = await detect_intent(req.message, req.page, req.user)

    # 2. If action intent -> handle and return JSON
    if intent["type"] in ("navigate", "create", "delete", "autofill"):
        result = await handle_action(intent, req)
        return JSONResponse(content=result)

    # 3. Question -> build context + RAG retrieval + stream response
    context = await build_context(req.user, req.page)
    system_prompt = build_system_prompt(req.user, context, req.page)

    # ── RAG: retrieve relevant knowledge base documents ──
    rag_docs = retrieve_for_chat(req.message, req.page, req.user.get("role", ""))
    rag_context = format_rag_context(rag_docs)

    # ── RAG: retrieve similar cases if on assessment page ──
    similar_context = ""
    if req.page and "/assessment/" in req.page and context.get("current_assessment"):
        current = context["current_assessment"]
        cases = await find_similar_cases(
            {"applicant": current.get("applicant", {}), "traditionalData": current.get("traditional_data", {})},
            current.get("policy_type", "health"),
            limit=3,
        )
        similar_context = format_similar_cases(cases)

    # Inject RAG context into system prompt
    if rag_context or similar_context:
        system_prompt += "\n\n" + rag_context + "\n" + similar_context

    messages = [{"role": "system", "content": system_prompt}]

    for msg in req.history[-MAX_HISTORY:]:
        messages.append({
            "role": msg.get("role", "user"),
            "content": msg.get("content", "")[:MAX_MSG_LENGTH],
        })

    messages.append({"role": "user", "content": req.message})

    return StreamingResponse(
        stream_chat(messages),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "X-Content-Type-Options": "nosniff"},
    )
