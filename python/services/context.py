from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from config.settings import MONGODB_URI, MONGODB_DB

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]


async def build_context(user: dict, page: str) -> dict:
    """Fetch relevant data from MongoDB based on user role and current page."""
    context = {}
    user_id = user.get("id")
    if not user_id:
        return context

    try:
        role = user.get("role", "user")

        # Fetch assessments based on role
        if role in ("underwriter", "admin"):
            query = {}  # underwriters see all
        else:
            query = {"userId": ObjectId(user_id)}

        assessments = await db.assessments.find(query).sort("createdAt", -1).limit(5).to_list(length=5)

        context["recent_assessments"] = [
            {
                "id": str(a["_id"]),
                "applicant_name": "Applicant",  # PII redacted — name not sent to LLM
                "age": a.get("applicant", {}).get("age"),
                "occupation": a.get("applicant", {}).get("occupation"),
                "policy_type": a.get("policyType", "unknown"),
                "status": a.get("status", "draft"),
                "risk_score": a.get("result", {}).get("riskScore"),
                "decision": a.get("result", {}).get("decision"),
                "confidence": a.get("result", {}).get("confidence"),
                "premium_min": a.get("result", {}).get("recommendedPremium", {}).get("min"),
                "premium_max": a.get("result", {}).get("recommendedPremium", {}).get("max"),
                "explanation": (a.get("result", {}).get("explanation") or "")[:200],
                "factors": [
                    f"{f.get('source')} ({f.get('impact')}, wt {f.get('weight', 0):.2f})"
                    for f in (a.get("result", {}).get("factors") or [])[:5]
                ],
                "adverse_reasons": [
                    r.get("factor") for r in (a.get("result", {}).get("adverseActionReasons") or [])
                ],
                "ml_model_used": a.get("result", {}).get("mlModelUsed"),
                "income": a.get("traditionalData", {}).get("income"),
                "credit_score": a.get("traditionalData", {}).get("creditScore"),
                "created": str(a.get("createdAt", "")),
            }
            for a in assessments
        ]

        # Stats
        total = await db.assessments.count_documents(query)
        completed = await db.assessments.count_documents({**query, "status": "completed"})

        # Decision distribution
        approved = await db.assessments.count_documents({**query, "result.decision": "approve"})
        referred = await db.assessments.count_documents({**query, "result.decision": "refer"})
        declined = await db.assessments.count_documents({**query, "result.decision": "decline"})

        context["stats"] = {
            "total_assessments": total,
            "completed": completed,
            "pending": total - completed,
            "approved": approved,
            "referred": referred,
            "declined": declined,
            "approval_rate": f"{round(approved / max(completed, 1) * 100)}%" if completed else "N/A",
        }

        # If on an assessment detail page, fetch that specific assessment
        if page and "/assessment/" in page:
            parts = page.rstrip("/").split("/")
            assess_id = parts[-1] if len(parts) > 0 and len(parts[-1]) == 24 else None
            if not assess_id and len(parts) >= 2 and len(parts[-2]) == 24:
                assess_id = parts[-2]
            if assess_id:
                try:
                    detail = await db.assessments.find_one({"_id": ObjectId(assess_id)})
                    if detail:
                        r = detail.get("result", {})
                        context["current_assessment"] = {
                            "applicant": detail.get("applicant", {}),
                            "policy_type": detail.get("policyType"),
                            "traditional_data": detail.get("traditionalData", {}),
                            "alternative_data": detail.get("alternativeData", {}),
                            "policy_specific_data": detail.get("policySpecificData", {}),
                            "risk_score": r.get("riskScore"),
                            "decision": r.get("decision"),
                            "confidence": r.get("confidence"),
                            "premium": r.get("recommendedPremium"),
                            "explanation": r.get("explanation"),
                            "factors": r.get("factors", []),
                            "adverse_reasons": r.get("adverseActionReasons", []),
                            "status": detail.get("status"),
                        }
                except Exception:
                    pass

    except Exception:
        context["recent_assessments"] = []
        context["stats"] = {}

    return context
