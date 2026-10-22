from fastapi import APIRouter
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional
from services.context import build_context

router = APIRouter()


class SuggestionRequest(BaseModel):
    page: Optional[str] = "/"
    user: Optional[dict] = {}
    mode: Optional[str] = "suggestions"


@router.post("/suggestions")
async def suggestions(req: SuggestionRequest):
    context = await build_context(req.user, req.page)
    result = generate_suggestions(req.page, req.user, context)
    return JSONResponse(content={"suggestions": result})


def generate_suggestions(page: str, user: dict, context: dict) -> list[str]:
    """Return context-aware suggestions based on page, role, and live data."""
    stats = context.get("stats", {})
    assessments = context.get("recent_assessments", [])
    current = context.get("current_assessment", {})
    total = stats.get("total_assessments", 0)
    role = user.get("role", "user")

    # Assessment detail page — most useful suggestions
    if page and "/assessment/" in page and current:
        name = current.get("applicant", {}).get("name", "this applicant")
        score = current.get("risk_score")
        decision = current.get("decision")
        suggestions = []

        if score is not None:
            suggestions.append(f"Why did {name} get a score of {score}?")
            if decision == "decline":
                suggestions.append(f"What can {name} do to get approved?")
            elif decision == "refer":
                suggestions.append(f"Should I approve or decline {name}?")
            else:
                suggestions.append(f"What are the risk factors for {name}?")

            if current.get("alternative_data"):
                suggestions.append("How did alternative data affect this score?")
            suggestions.append("Explain the premium calculation")
        else:
            suggestions.append("This assessment hasn't been analyzed yet")
            suggestions.append("How does the AI analysis work?")

        return suggestions[:4]

    # Dashboard
    if page == "/dashboard":
        if total > 0:
            declined = stats.get("declined", 0)
            referred = stats.get("referred", 0)
            suggestions = [f"Summarize my {total} assessments"]
            if declined > 0:
                suggestions.append(f"Why were {declined} assessments declined?")
            if referred > 0:
                suggestions.append(f"Review {referred} referred cases")
            suggestions.append("What's my approval rate?")
            return suggestions[:4]
        else:
            return [
                "How do I create my first assessment?",
                "What data do I need?",
                "How does the AI scoring work?",
            ]

    # Assess page
    if page and "assess" in page:
        return [
            "What data gives the best risk score?",
            "How does missing data affect my score?",
            "Explain telematics and behavioral scores",
            "What policy types are available?",
        ]

    # History
    if page and "history" in page:
        if assessments:
            high_risk = [a for a in assessments if (a.get("risk_score") or 0) > 70]
            suggestions = ["Summarize my assessment history"]
            if high_risk:
                suggestions.append(f"Explain the {len(high_risk)} high-risk assessments")
            suggestions.append("Compare approved vs declined cases")
            suggestions.append("Which policy type has the highest risk?")
            return suggestions[:4]
        return ["No assessments yet — how do I create one?"]

    # Analytics
    if page and "analytics" in page:
        return [
            "Explain my risk distribution",
            f"What's driving the {stats.get('approval_rate', 'N/A')} approval rate?",
            "How do my scores trend over time?",
            "Compare policy type performance",
        ]

    # Fairness
    if page and "fairness" in page:
        return [
            "How does the fairness audit work?",
            "What is disparate impact ratio?",
            "How do you prevent gender bias?",
            "Is the model fair for low-income applicants?",
        ]

    # Default
    if role == "underwriter":
        return [
            "Show cases that need my review",
            "What's the overall risk distribution?",
            "How does the ML model make decisions?",
        ]

    return [
        "How do I get a risk assessment?",
        "What data improves my score?",
        "How does the AI scoring work?",
    ]
