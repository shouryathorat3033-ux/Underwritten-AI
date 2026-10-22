import json
from datetime import datetime
from bson import ObjectId
from services.llm import call_sync
from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGODB_URI, MONGODB_DB

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]


async def execute_create(intent: dict, req) -> dict:
    """Extract structured fields from user message via LLM, then create assessment."""
    extraction_prompt = f"""Extract insurance assessment applicant fields from this message.
Return ONLY valid JSON matching this schema:
{{
  "name": "string (required — applicant's full name)",
  "age": number or null,
  "gender": "string or null (male/female/other)",
  "occupation": "string or null"
}}

User message: "{req.message}"
JSON:"""

    raw = await call_sync([
        {"role": "system", "content": "Extract structured data from user messages. Return JSON only. No markdown."},
        {"role": "user", "content": extraction_prompt},
    ])

    try:
        clean = raw.strip().strip("`").strip()
        if clean.startswith("json"):
            clean = clean[4:].strip()
        fields = json.loads(clean)
    except json.JSONDecodeError:
        return {"action": "error", "message": "Could not understand the request. Please provide at least the applicant's name."}

    if not fields.get("name"):
        return {"action": "error", "message": "Please provide at least the applicant's name to create an assessment."}

    doc = {
        "userId": ObjectId(req.user.get("id")),
        "applicant": {
            "name": fields["name"],
            "age": fields.get("age"),
            "gender": fields.get("gender"),
            "occupation": fields.get("occupation"),
        },
        "traditionalData": {},
        "alternativeData": {},
        "result": {},
        "status": "draft",
        "createdAt": datetime.utcnow(),
    }

    result = await db.assessments.insert_one(doc)

    return {
        "action": "created",
        "entity": "assessment",
        "id": str(result.inserted_id),
        "data": {
            "Applicant": fields["name"],
            "Age": fields.get("age", "—"),
            "Gender": fields.get("gender", "—"),
            "Occupation": fields.get("occupation", "—"),
            "Status": "Draft",
        },
        "message": f"Assessment created for {fields['name']}!",
    }
