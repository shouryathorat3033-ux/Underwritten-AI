import json
import re
from services.llm import call_sync

# Navigation keywords — only trigger on CLEAR navigation intent
NAVIGATE_PATTERNS = [
    (r"\b(take me to|go to|open|navigate to|show me the)\b.*(dashboard|history|analytics|fairness|assess)", None),
    (r"\b(take me to|go to|open|navigate to)\b.*(dashboard)", "/dashboard"),
    (r"\b(take me to|go to|open|navigate to)\b.*(history|past assessment|review queue)", "/dashboard/history"),
    (r"\b(take me to|go to|open|navigate to)\b.*(analytics|charts|metrics)", "/dashboard/analytics"),
    (r"\b(take me to|go to|open|navigate to)\b.*(fairness|bias|audit)", "/dashboard/fairness"),
    (r"\b(take me to|go to|open|navigate to)\b.*(new assessment|create|assess)", "/assess"),
]

NAVIGATE_LABELS = {
    "/dashboard": "Dashboard",
    "/dashboard/history": "Assessment History",
    "/dashboard/analytics": "Analytics",
    "/dashboard/fairness": "ML Fairness Audit",
    "/assess": "New Assessment",
}

# Create keywords — only trigger on CLEAR creation intent
CREATE_PATTERNS = [
    r"\b(create|start|begin|new)\b.*(assessment|application|policy)",
]

# Everything else = question (default)


async def detect_intent(message: str, page: str, user: dict) -> dict:
    """
    Fast rule-based intent classification. Falls back to "question" by default.
    Only classifies as navigate/create for CLEAR explicit requests.
    """
    msg = message.lower().strip()

    # Short messages or questions are always questions
    if len(msg) < 5 or msg.endswith("?"):
        return {"type": "question"}

    # Words that strongly indicate a question, NOT navigation
    question_signals = [
        "what", "why", "how", "explain", "tell me", "summarize", "summary",
        "show me a summary", "describe", "analyze", "compare", "which",
        "rate", "score", "risk", "approval", "decline", "refer",
        "help", "can you", "could you", "would you", "is my", "are my",
        "what's", "whats", "how's", "hows", "give me",
    ]
    if any(msg.startswith(q) or f" {q} " in f" {msg} " for q in question_signals):
        return {"type": "question"}

    # Check navigate patterns
    for pattern, path in NAVIGATE_PATTERNS:
        match = re.search(pattern, msg, re.IGNORECASE)
        if match:
            if path is None:
                # Extract the destination from the match
                dest = match.group(2).strip().lower()
                if "history" in dest or "past" in dest or "review" in dest:
                    path = "/dashboard/history"
                elif "analytics" in dest or "chart" in dest:
                    path = "/dashboard/analytics"
                elif "fairness" in dest or "bias" in dest:
                    path = "/dashboard/fairness"
                elif "assess" in dest or "new" in dest or "create" in dest:
                    path = "/assess"
                else:
                    path = "/dashboard"
            return {
                "type": "navigate",
                "path": path,
                "label": NAVIGATE_LABELS.get(path, "Dashboard"),
            }

    # Check create patterns
    for pattern in CREATE_PATTERNS:
        if re.search(pattern, msg, re.IGNORECASE):
            return {
                "type": "navigate",
                "path": "/assess",
                "label": "New Assessment",
            }

    # Default: treat as question (most messages are questions)
    return {"type": "question"}
