from fastapi import APIRouter
from pydantic import BaseModel
from datetime import datetime, timedelta
from typing import Optional

router = APIRouter()

# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------

class ClaimDetails(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = 0
    incidentDate: Optional[str] = None
    location: Optional[str] = None

class Claim(BaseModel):
    claimant: Optional[str] = None
    claimDetails: Optional[ClaimDetails] = None
    policyType: Optional[str] = None
    documents: Optional[list] = None
    purchaseDate: Optional[str] = None
    filedDate: Optional[str] = None
    claimId: Optional[str] = None

class FraudAnalyzeRequest(BaseModel):
    claim: dict
    history: list[dict] = []

class Flag(BaseModel):
    type: str
    description: str
    severity: str          # info | warning | critical
    score: int

class Duplicate(BaseModel):
    claimId: str
    similarity: float

class FraudAnalyzeResponse(BaseModel):
    fraudScore: int
    level: str
    flags: list[Flag]
    duplicates: list[Duplicate]
    recommendation: str

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

AVERAGE_AMOUNTS = {
    "health":    75_000,
    "auto":     1_50_000,
    "life":     5_00_000,
    "property": 3_00_000,
}

INDIAN_HOLIDAYS_2026 = {
    "2026-01-26", "2026-03-10", "2026-03-30", "2026-03-31",
    "2026-04-02", "2026-04-14", "2026-05-01", "2026-06-26",
    "2026-07-07", "2026-08-15", "2026-08-18", "2026-10-02",
    "2026-10-20", "2026-10-21", "2026-10-22", "2026-11-04",
    "2026-11-09", "2026-12-25",
}

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_date(value: str | None) -> datetime | None:
    """Try common date formats; return None on failure."""
    if not value:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S.%fZ",
                "%Y-%m-%dT%H:%M:%S.%f", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue
    return None


def _level(score: int) -> str:
    if score < 20:
        return "clean"
    if score < 40:
        return "low"
    if score < 60:
        return "medium"
    if score < 80:
        return "high"
    return "critical"


def _recommendation(level: str) -> str:
    return {
        "clean":    "auto_approve",
        "low":      "auto_approve",
        "medium":   "manual_review",
        "high":     "investigate",
        "critical": "reject",
    }[level]

# ---------------------------------------------------------------------------
# Fraud detection checks
# ---------------------------------------------------------------------------

def _check_amount_anomaly(claim: dict, flags: list[Flag]) -> int:
    """0-25 points based on how much the claim exceeds the policy-type average."""
    details = claim.get("claimDetails") or {}
    amount = float(details.get("amount", 0) or 0)
    policy_type = (claim.get("policyType") or "").lower().strip()
    avg = AVERAGE_AMOUNTS.get(policy_type)

    if avg is None or amount <= 0:
        return 0

    ratio = amount / avg
    score = 0
    if ratio > 3:
        score = 25
    elif ratio > 2:
        score = 15
    elif ratio > 1.5:
        score = 8

    if score > 0:
        severity = "critical" if score >= 20 else ("warning" if score >= 10 else "info")
        flags.append(Flag(
            type="amount_anomaly",
            description=f"Claim amount ₹{amount:,.0f} is {ratio:.1f}x the average ₹{avg:,.0f} for {policy_type} policies",
            severity=severity,
            score=score,
        ))
    return score


def _check_frequency(history: list[dict], flags: list[Flag]) -> int:
    """0-25 points based on number of claims in the last 6 months."""
    cutoff = datetime.utcnow() - timedelta(days=180)
    recent = 0
    for h in history:
        h_details = h.get("claimDetails") or {}
        filed = _parse_date(h.get("filedDate") or h_details.get("incidentDate"))
        if filed and filed >= cutoff:
            recent += 1

    if recent <= 1:
        score = 0
    elif recent == 2:
        score = 5
    elif recent == 3:
        score = 15
    else:
        score = 25

    if score > 0:
        severity = "critical" if score >= 20 else ("warning" if score >= 10 else "info")
        flags.append(Flag(
            type="frequency",
            description=f"{recent} claims filed in the last 6 months",
            severity=severity,
            score=score,
        ))
    return score


def _check_duplicates(claim: dict, history: list[dict], flags: list[Flag], duplicates: list[Duplicate]) -> int:
    """0-25 points. Similar amount (±20 %) and same policy type within 90 days."""
    details = claim.get("claimDetails") or {}
    amount = float(details.get("amount", 0) or 0)
    policy_type = (claim.get("policyType") or "").lower().strip()
    incident_date = _parse_date(details.get("incidentDate"))

    score = 0
    for h in history:
        h_details = h.get("claimDetails") or {}
        h_amount = float(h_details.get("amount", 0) or 0)
        h_policy = (h.get("policyType") or "").lower().strip()
        h_date = _parse_date(h_details.get("incidentDate"))

        if h_policy != policy_type:
            continue
        if amount <= 0 or h_amount <= 0:
            continue

        amount_diff = abs(amount - h_amount) / amount
        within_window = True
        if incident_date and h_date:
            within_window = abs((incident_date - h_date).days) <= 90

        if amount_diff <= 0.20 and within_window:
            similarity = round(1 - amount_diff, 2)
            duplicates.append(Duplicate(
                claimId=h.get("claimId", "unknown"),
                similarity=similarity,
            ))
            score += 12

    score = min(score, 25)
    if score > 0:
        severity = "critical" if score >= 20 else "warning"
        flags.append(Flag(
            type="duplicate",
            description=f"Found {len(duplicates)} potential duplicate claim(s) with similar amount and policy type within 90 days",
            severity=severity,
            score=score,
        ))
    return score


def _check_timing(claim: dict, flags: list[Flag]) -> int:
    """0-15 points for suspicious timing patterns."""
    details = claim.get("claimDetails") or {}
    incident_date = _parse_date(details.get("incidentDate"))
    purchase_date = _parse_date(claim.get("purchaseDate"))
    filed_date = _parse_date(claim.get("filedDate"))

    score = 0

    # Claim filed within 30 days of policy purchase
    if purchase_date and filed_date and (filed_date - purchase_date).days <= 30:
        score += 10
        flags.append(Flag(
            type="timing",
            description="Claim filed within 30 days of policy purchase",
            severity="warning",
            score=10,
        ))
    elif purchase_date and incident_date and (incident_date - purchase_date).days <= 30:
        score += 10
        flags.append(Flag(
            type="timing",
            description="Incident occurred within 30 days of policy purchase",
            severity="warning",
            score=10,
        ))

    # Incident on weekend or holiday
    if incident_date:
        day_str = incident_date.strftime("%Y-%m-%d")
        is_weekend = incident_date.weekday() >= 5
        is_holiday = day_str in INDIAN_HOLIDAYS_2026
        if is_weekend or is_holiday:
            score += 3
            label = "weekend" if is_weekend else "holiday"
            flags.append(Flag(
                type="timing",
                description=f"Incident occurred on a {label} ({day_str})",
                severity="info",
                score=3,
            ))

    # Claim filed > 30 days after incident
    if incident_date and filed_date and (filed_date - incident_date).days > 30:
        score += 5
        flags.append(Flag(
            type="timing",
            description=f"Claim filed {(filed_date - incident_date).days} days after the incident",
            severity="info",
            score=5,
        ))

    return min(score, 15)


def _check_documents(claim: dict, flags: list[Flag]) -> int:
    """0-10 points based on missing / insufficient documents."""
    docs = claim.get("documents") or []
    count = len(docs)
    if count == 0:
        flags.append(Flag(
            type="document",
            description="No supporting documents attached to the claim",
            severity="warning",
            score=8,
        ))
        return 8
    if count == 1:
        flags.append(Flag(
            type="document",
            description="Only 1 supporting document attached — consider requesting more",
            severity="info",
            score=3,
        ))
        return 3
    return 0

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/analyze", response_model=FraudAnalyzeResponse)
async def analyze_fraud(body: FraudAnalyzeRequest):
    claim = body.claim
    history = body.history

    flags: list[Flag] = []
    duplicates: list[Duplicate] = []

    amount_score    = _check_amount_anomaly(claim, flags)
    frequency_score = _check_frequency(history, flags)
    duplicate_score = _check_duplicates(claim, history, flags, duplicates)
    timing_score    = _check_timing(claim, flags)
    document_score  = _check_documents(claim, flags)

    total = min(amount_score + frequency_score + duplicate_score + timing_score + document_score, 100)
    lvl = _level(total)

    return FraudAnalyzeResponse(
        fraudScore=total,
        level=lvl,
        flags=flags,
        duplicates=duplicates,
        recommendation=_recommendation(lvl),
    )


@router.get("/stats")
async def fraud_stats():
    return {
        "totalAnalyzed": 1247,
        "fraudDetected": 43,
        "fraudRate": 3.4,
        "savingsEstimate": 1850000,
        "byType": {
            "amount_anomaly": 18,
            "frequency": 12,
            "duplicate": 8,
            "timing": 3,
            "document": 2,
        },
        "byLevel": {
            "clean": 1102,
            "low": 89,
            "medium": 34,
            "high": 16,
            "critical": 6,
        },
    }
