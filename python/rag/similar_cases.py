"""
Similar Case Retrieval — finds past assessments with similar risk profiles.

Uses MongoDB queries to find assessments matching key demographic and risk
factors, then ranks by similarity to the current case.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config.settings import MONGODB_URI, MONGODB_DB

client = AsyncIOMotorClient(MONGODB_URI)
db = client[MONGODB_DB]


async def find_similar_cases(
    assessment: dict,
    policy_type: str,
    limit: int = 5,
    exclude_id: str = None,
) -> list[dict]:
    """
    Find past assessments similar to the given one.

    Similarity is based on: policy type, age bracket, income bracket,
    and risk score proximity.

    Args:
        assessment: Current assessment data (applicant, traditionalData, etc.)
        policy_type: health, auto, life, property
        limit: Max similar cases to return
        exclude_id: Assessment ID to exclude (the current one)

    Returns:
        List of similar past cases with their outcomes
    """
    applicant = assessment.get("applicant", {})
    traditional = assessment.get("traditionalData", {})

    age = applicant.get("age")
    income = traditional.get("income")
    gender = applicant.get("gender")

    # Build query: same policy type + completed with results
    query = {
        "policyType": policy_type,
        "status": {"$in": ["completed", "accepted", "rejected", "referred"]},
        "result.riskScore": {"$exists": True},
    }

    # Age bracket: ±10 years
    if age and isinstance(age, (int, float)) and age > 0:
        query["applicant.age"] = {"$gte": max(18, age - 10), "$lte": age + 10}

    # Income bracket: ±50%
    if income and isinstance(income, (int, float)) and income > 0:
        query["traditionalData.income"] = {
            "$gte": income * 0.5,
            "$lte": income * 1.5,
        }

    # Same gender if available
    if gender and gender in ("male", "female"):
        query["applicant.gender"] = gender

    # Exclude current assessment
    if exclude_id:
        from bson import ObjectId
        try:
            query["_id"] = {"$ne": ObjectId(exclude_id)}
        except Exception:
            pass

    try:
        cursor = db.assessments.find(query).sort("createdAt", -1).limit(limit * 2)
        cases = await cursor.to_list(length=limit * 2)
    except Exception:
        return []

    # Format and rank by completeness of result
    results = []
    for case in cases:
        result = case.get("result", {})
        if not result.get("riskScore"):
            continue

        results.append({
            "id": str(case["_id"]),
            "applicant_name": case.get("applicant", {}).get("name", "Anonymous"),
            "age": case.get("applicant", {}).get("age"),
            "gender": case.get("applicant", {}).get("gender"),
            "occupation": case.get("applicant", {}).get("occupation"),
            "policy_type": case.get("policyType"),
            "income": case.get("traditionalData", {}).get("income"),
            "credit_score": case.get("traditionalData", {}).get("creditScore"),
            "risk_score": result.get("riskScore"),
            "decision": result.get("decision"),
            "confidence": result.get("confidence"),
            "premium_min": result.get("recommendedPremium", {}).get("min"),
            "premium_max": result.get("recommendedPremium", {}).get("max"),
            "top_factors": [
                f.get("source") for f in (result.get("factors") or [])[:3]
            ],
            "underwriter_action": case.get("underwriterAction", {}).get("action"),
        })

    return results[:limit]


def format_similar_cases(cases: list[dict]) -> str:
    """Format similar cases into context for LLM injection."""
    if not cases:
        return ""

    lines = ["## Similar Past Assessments (RAG Retrieved)"]
    lines.append("Reference these when explaining the decision or comparing outcomes.\n")

    for i, c in enumerate(cases, 1):
        age_str = f", age {c['age']}" if c.get("age") else ""
        income_str = f", ₹{c['income']:,.0f}" if c.get("income") else ""
        premium_str = ""
        if c.get("premium_min") and c.get("premium_max"):
            premium_str = f", premium ₹{c['premium_min']:,.0f}-₹{c['premium_max']:,.0f}"

        outcome = c.get("underwriter_action") or c.get("decision", "pending")
        factors = ", ".join(c.get("top_factors", [])) or "N/A"

        lines.append(
            f"**[Case {i}]** {c['policy_type'].title()} — "
            f"Score: {c['risk_score']}, Decision: {outcome}{age_str}{income_str}{premium_str}"
        )
        lines.append(f"  Top factors: {factors}\n")

    return "\n".join(lines)
