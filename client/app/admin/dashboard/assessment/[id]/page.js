"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import RiskWaterfall from "@/components/ui/RiskWaterfall";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ErrorState from "@/components/ui/ErrorState";
import PricingComparison from "@/components/ui/PricingComparison";
import TraditionalVsAI from "@/components/ui/TraditionalVsAI";
import PolicyRecommendation from "@/components/ui/PolicyRecommendation";
import RiskGauge from "@/components/ui/RiskGauge";
import RiskSimulator from "@/components/ui/RiskSimulator";
import ComparisonView from "@/components/ui/ComparisonView";
import RAGCitations from "@/components/ui/RAGCitations";
import ProductRecommendations from "@/components/ui/ProductRecommendations";

/* ─────────────────────────── helpers ─────────────────────────── */
const RISK_COLOR = (s) =>
  s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";
const RISK_LABEL = (s) =>
  s <= 35 ? "Low" : s <= 55 ? "Moderate" : s <= 75 ? "High" : "Critical";
const RISK_CLASS = (s) =>
  s <= 35 ? "risk-low" : s <= 55 ? "risk-medium" : s <= 75 ? "risk-high" : "risk-critical";

const POLICY_COLORS = {
  health: { bg: "rgba(16,185,129,0.12)", text: "#34d399", border: "rgba(16,185,129,0.25)" },
  auto: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa", border: "rgba(59,130,246,0.25)" },
  life: { bg: "rgba(168,85,247,0.12)", text: "#c084fc", border: "rgba(168,85,247,0.25)" },
  property: { bg: "rgba(245,158,11,0.12)", text: "#fbbf24", border: "rgba(245,158,11,0.25)" },
};

const POLICY_ICONS = {
  health: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  auto: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M7 17a2 2 0 104 0M13 17a2 2 0 104 0" />
    </svg>
  ),
  life: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
    </svg>
  ),
  property: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
};

const STATUS_MAP = {
  draft: { label: "Draft", color: "#71717a", bg: "rgba(113,113,122,0.12)" },
  processing: { label: "Processing", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  completed: { label: "Completed", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
  error: { label: "Error", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  referred: { label: "Referred", color: "#fbbf24", bg: "rgba(245,158,11,0.12)" },
  accepted: { label: "Accepted", color: "#34d399", bg: "rgba(16,185,129,0.12)" },
  rejected: { label: "Rejected", color: "#f87171", bg: "rgba(239,68,68,0.12)" },
  info_requested: { label: "Info Requested", color: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
};

const ACTION_MAP = {
  accepted: { label: "Accepted", color: "#10b981", icon: "check-circle" },
  rejected: { label: "Rejected", color: "#ef4444", icon: "x-circle" },
  modified: { label: "Premium Modified", color: "#f59e0b", icon: "edit" },
  info_requested: { label: "Info Requested", color: "#3b82f6", icon: "help-circle" },
};

const DOC_ICONS = {
  pdf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  default: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
};

function docIcon(type) {
  if (!type) return DOC_ICONS.default;
  if (type.includes("pdf")) return DOC_ICONS.pdf;
  if (type.includes("image") || type.includes("png") || type.includes("jpg") || type.includes("jpeg")) return DOC_ICONS.image;
  return DOC_ICONS.default;
}

/* ──────────── animated counter hook ──────────── */
function useCountUp(end, duration = 1400) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (end == null) return;
    const start = 0;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      setValue(Math.round(start + (end - start) * eased));
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [end, duration]);
  return value;
}

/* ─────────────────────────── MAIN COMPONENT ─────────────────────────── */
export default function AssessmentDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  /* underwriter action state */
  const [selectedAction, setSelectedAction] = useState(null);
  const [justification, setJustification] = useState("");
  const [modifiedMin, setModifiedMin] = useState("");
  const [modifiedMax, setModifiedMax] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/assessments/${id}/analyze`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success("Re-evaluation complete!");
        fetchAssessment();
      } else {
        toast.error(data.error || "Re-evaluation failed");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
    setReanalyzing(false);
  };

  const fetchAssessment = useCallback(() => {
    setLoading(true);
    fetch(`/api/assessments/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setAssessment(d.assessment);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    fetchAssessment();
  }, [fetchAssessment]);

  const r = assessment?.result;
  const riskScore = r?.riskScore ?? 0;
  const displayScore = useCountUp(r ? riskScore : 0, 1400);
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (displayScore / 100) * circumference;

  const userRole = session?.user?.role;
  const isUnderwriter = userRole === "underwriter" || userRole === "admin";
  const existingAction = assessment?.underwriterAction;
  const hasExistingAction = !!(existingAction?.action);

  /* ──────── submit underwriter action ──────── */
  async function handleSubmitAction() {
    if (!selectedAction) {
      toast.error("Please select an action first");
      return;
    }
    if (!justification || justification.trim().length < 5) {
      toast.error("Justification is required (min 5 characters)");
      return;
    }
    if (selectedAction === "modified") {
      if (!modifiedMin || !modifiedMax) {
        toast.error("Please enter both min and max premium values");
        return;
      }
      if (Number(modifiedMin) >= Number(modifiedMax)) {
        toast.error("Min premium must be less than max premium");
        return;
      }
    }

    setSubmitting(true);
    try {
      const body = {
        action: selectedAction,
        justification: justification.trim(),
      };
      if (selectedAction === "modified") {
        body.modifiedPremium = {
          min: Number(modifiedMin),
          max: Number(modifiedMax),
        };
      }
      const res = await fetch(`/api/assessments/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Action failed");
      } else {
        toast.success("Underwriter action recorded successfully");
        setSelectedAction(null);
        setJustification("");
        setModifiedMin("");
        setModifiedMax("");
        fetchAssessment();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  /* ─────────── loading / error states ─────────── */
  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "History", href: "/admin/dashboard/history" },
          { label: "Loading...", href: "#" },
        ]} />
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div style={{
              width: 40, height: 40,
              border: "3px solid rgba(16,185,129,0.15)",
              borderTopColor: "#10b981", borderRadius: "50%",
              animation: "spin-anim 0.8s linear infinite",
            }} />
            <p className="text-sm" style={{ color: "#71717a" }}>Loading assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "History", href: "/admin/dashboard/history" },
          { label: "Not Found", href: "#" },
        ]} />
        <ErrorState
          message="This assessment may have been deleted or you don't have access."
          onRetry={fetchAssessment}
        />
        <div className="text-center mt-4">
          <Link href="/admin/dashboard/history" className="btn-primary inline-block no-underline text-sm">
            Back to History
          </Link>
        </div>
      </div>
    );
  }

  const policyColor = POLICY_COLORS[assessment.policyType] || POLICY_COLORS.health;
  const statusInfo = STATUS_MAP[assessment.status] || STATUS_MAP.draft;

  /* ─────────────────────────── RENDER ─────────────────────────── */
  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", width: "100%" }}>
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "History", href: "/admin/dashboard/history" },
        { label: assessment.applicant?.name || "Assessment", href: "#" },
      ]} />

      {/* ══════════ HEADER ══════════ */}
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/admin/dashboard/history"
          className="no-underline inline-flex items-center gap-1.5 text-sm mb-4"
          style={{ color: "#71717a", transition: "color 0.2s" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#a1a1aa")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#71717a")}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to History
        </Link>

        <div className="flex flex-wrap items-center gap-3">
          <h1
            className="text-2xl font-extrabold"
            style={{ color: "#fafafa", margin: 0 }}
          >
            {assessment.applicant?.name || "Unknown Applicant"}
          </h1>

          {/* policy type badge */}
          {assessment.policyType && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full"
              style={{
                background: policyColor.bg,
                color: policyColor.text,
                border: `1px solid ${policyColor.border}`,
              }}
            >
              {POLICY_ICONS[assessment.policyType]}
              {assessment.policyType}
            </span>
          )}

          {/* status badge */}
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full capitalize"
            style={{
              background: statusInfo.bg,
              color: statusInfo.color,
              border: `1px solid ${statusInfo.color}22`,
            }}
          >
            {statusInfo.label}
          </span>

          {/* underwriter action badge */}
          {hasExistingAction && (
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
              style={{
                background: `${ACTION_MAP[existingAction.action]?.color || "#71717a"}18`,
                color: ACTION_MAP[existingAction.action]?.color || "#71717a",
                border: `1px solid ${ACTION_MAP[existingAction.action]?.color || "#71717a"}30`,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                {existingAction.action === "accepted" && <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>}
                {existingAction.action === "rejected" && <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>}
                {existingAction.action === "modified" && <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></>}
                {existingAction.action === "info_requested" && <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>}
              </svg>
              {ACTION_MAP[existingAction.action]?.label}
            </span>
          )}
        </div>

        {/* meta row */}
        <div className="flex flex-wrap items-center gap-4 mt-3">
          {assessment.createdAt && (
            <span className="text-xs" style={{ color: "#52525b" }}>
              Created {new Date(assessment.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {assessment.completedAt && (
            <span className="text-xs" style={{ color: "#52525b" }}>
              Completed {new Date(assessment.completedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          {r?.processingTime && (
            <span className="text-xs font-mono" style={{ color: "#52525b" }}>
              {r.processingTime}ms processing
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-4">
          {r && (
            <Link
              href={`/admin/dashboard/assessment/${id}/analysis`}
              className="no-underline inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(245,158,11,0.08))",
                border: "1px solid rgba(16,185,129,0.2)",
                color: "#34d399",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(245,158,11,0.12))"; e.currentTarget.style.boxShadow = "0 0 30px rgba(16,185,129,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(245,158,11,0.08))"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/>
              </svg>
              AI Deep Analysis
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </Link>
          )}
          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
            style={{
              background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.2)",
              color: "#fbbf24",
              cursor: reanalyzing ? "wait" : "pointer",
              opacity: reanalyzing ? 0.6 : 1,
              fontFamily: "inherit",
            }}
            onMouseEnter={(e) => { if (!reanalyzing) { e.currentTarget.style.background = "rgba(245,158,11,0.15)"; e.currentTarget.style.boxShadow = "0 0 30px rgba(245,158,11,0.1)"; } }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(245,158,11,0.08)"; e.currentTarget.style.boxShadow = "none"; }}
          >
            {reanalyzing ? (
              <>
                <span style={{ width: 16, height: 16, border: "2px solid rgba(251,191,36,0.3)", borderTopColor: "#fbbf24", borderRadius: "50%", animation: "spin-anim 0.8s linear infinite", display: "inline-block" }} />
                Re-evaluating...
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                Re-evaluate with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* ══════════ RESULTS SECTION ══════════ */}
      {r ? (
        <>
          {/* ── TOP ROW: Gauge + Factor Breakdown + AI ── */}
          <div
            className="grid gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {/* ──── RISK GAUGE (Speedometer) ──── */}
            <div className="glass-card p-6 flex flex-col items-center justify-center">
              <div className="flex items-center justify-between w-full mb-4">
                <h3 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#71717a" }}>Risk Score</h3>
                <a href={`/api/assessments/${id}/document`} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[10px] font-medium px-2.5 py-1 rounded-lg no-underline transition-all duration-200"
                  style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.15)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(16,185,129,0.08)"; }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  PDF Report
                </a>
              </div>
              <RiskGauge score={riskScore} size={220} />
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${RISK_CLASS(riskScore)}`}>{RISK_LABEL(riskScore)} Risk</span>
                <span className={`text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full ${RISK_CLASS(riskScore)}`}>{r.decision}</span>
                <span className="text-xs font-mono px-3 py-1.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#34d399", border: "1px solid rgba(16,185,129,0.15)" }}>{r.confidence}% conf</span>
              </div>
              {r.recommendedPremium && (
                <div className="w-full mt-5 p-3 rounded-xl text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="text-xs block" style={{ color: "#71717a" }}>Recommended Premium</span>
                  <span className="text-base font-mono font-semibold mt-1 block" style={{ color: "#fafafa" }}>
                    ₹{r.recommendedPremium.min?.toLocaleString("en-IN")} &ndash; ₹{r.recommendedPremium.max?.toLocaleString("en-IN")}
                    <span className="text-xs font-normal" style={{ color: "#71717a" }}> /yr</span>
                  </span>
                </div>
              )}
            </div>

            {/* ──── FACTOR BREAKDOWN (SHAP-style) ──── */}
            <div className="glass-card p-6">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#71717a" }}
              >
                Factor Breakdown
              </h3>
              <div className="space-y-3">
                {(r.factors || []).map((f, i) => {
                  const color = f.impact === "positive" ? "#10b981" : f.impact === "negative" ? "#ef4444" : "#f59e0b";
                  const icon = f.impact === "positive" ? "↑" : f.impact === "negative" ? "↓" : "–";
                  const pct = Math.min(Math.abs(f.score), 100);
                  const weightPct = Math.round((f.weight || 0) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl transition-all duration-200" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.03)" }}
                      onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
                      onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.015)"}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm font-bold" style={{ background: `${color}12`, color }}>{icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium truncate" style={{ color: "#e4e4e7" }}>{f.source}</span>
                          <span className="text-xs font-mono font-semibold shrink-0 ml-2" style={{ color }}>{f.score}/100</span>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 0.8s cubic-bezier(0.23,1,0.32,1)", boxShadow: `0 0 6px ${color}30` }} />
                        </div>
                      </div>
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(255,255,255,0.04)", color: "#52525b" }}>{weightPct}%</span>
                    </div>
                  );
                })}
              </div>
              {r.factors?.length === 0 && (
                <p className="text-sm" style={{ color: "#52525b" }}>No factor data available.</p>
              )}
            </div>

            {/* ──── WATERFALL CHART ──── */}
            {r.factors?.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-xs font-semibold uppercase tracking-widest mb-5" style={{ color: "#71717a" }}>
                  Why This Score?
                </h3>
                <RiskWaterfall factors={r.factors} riskScore={r.riskScore} baseScore={r.baseScore ?? { health: 35, auto: 30, life: 25, property: 30 }[assessment.policyType] ?? 35} />
              </div>
            )}

          </div>

          {/* ──── AI EXPLANATION (full width) ──── */}
          <div className="glass-card p-6 mt-6">
            <h3
              className="text-xs font-semibold uppercase tracking-widest mb-5"
              style={{ color: "#71717a" }}
            >
              <span className="inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
                  <path d="M8 6a4 4 0 018 0" />
                  <path d="M12 18v4" />
                  <path d="M8 22h8" />
                  <rect x="5" y="10" width="14" height="8" rx="2" />
                </svg>
                AI Analysis
              </span>
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "#a1a1aa", whiteSpace: "pre-wrap" }}
            >
              {r.explanation || "No AI explanation available for this assessment."}
            </p>
            <div
              className="mt-5 pt-4 flex flex-wrap gap-3"
              style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
            >
                {r.processingTime && (
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded-md"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      color: "#52525b",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    {r.processingTime}ms latency
                  </span>
                )}
                {r.confidence && (
                  <span
                    className="text-[10px] font-mono px-2 py-1 rounded-md"
                    style={{
                      background: "rgba(16,185,129,0.06)",
                      color: "#10b981",
                      border: "1px solid rgba(16,185,129,0.1)",
                    }}
                  >
                    {r.confidence}% model confidence
                  </span>
                )}
              </div>
          </div>

          {/* ══════════ TRADITIONAL vs AI COMPARISON ══════════ */}
          {r && (
            <div className="mt-6">
              <TraditionalVsAI
                traditionalScore={r.traditionalScore}
                aiScore={r.riskScore}
                factors={r.factors || []}
                policyType={assessment.policyType}
                premium={r.recommendedPremium}
              />
            </div>
          )}

          {/* ══════════ AI POLICY RECOMMENDATION ══════════ */}
          {r && (
            <div className="mt-6">
              <PolicyRecommendation
                riskScore={r.riskScore}
                policyType={assessment.policyType}
                decision={r.decision}
                premium={r.recommendedPremium}
                applicant={assessment.applicant}
                factors={r.factors || []}
              />
            </div>
          )}

          {/* ══════════ RAG CITATIONS & SIMILAR CASES ══════════ */}
          <div className="mt-6">
            <RAGCitations
              regulatoryCitations={r.regulatoryCitations || []}
              adverseActionReasons={r.adverseActionReasons || []}
              policyType={assessment.policyType}
              assessmentId={id}
            />
          </div>

          {/* ══════════ PRODUCT RECOMMENDATIONS ══════════ */}
          {r.recommendations?.length > 0 && (
            <div className="mt-6">
              <ProductRecommendations
                recommendations={r.recommendations}
                policyType={assessment.policyType}
              />
            </div>
          )}

          {/* ══════════ PRICING COMPARISON ══════════ */}
          {r.recommendedPremium && (
            <div className="mt-6">
              <PricingComparison
                riskScore={r.riskScore}
                decision={r.decision}
                premium={r.recommendedPremium}
                policyType={assessment.policyType}
              />
            </div>
          )}

          {/* ══════════ SIMULATOR + COMPARISON ══════════ */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <RiskSimulator policyType={assessment.policyType} assessment={assessment} />
            <ComparisonView traditionalScore={r.traditionalScore} aiScore={r.riskScore} />
          </div>

          {/* ══════════ DATA ROWS ══════════ */}
          <div
            className="grid gap-6 mt-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            }}
          >
            {/* ──── Applicant Details ──── */}
            <div className="glass-card p-6">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#71717a" }}
              >
                Applicant Details
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { l: "Name", v: assessment.applicant?.name },
                  { l: "Age", v: assessment.applicant?.age },
                  { l: "Gender", v: assessment.applicant?.gender },
                  { l: "Occupation", v: assessment.applicant?.occupation },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#71717a" }}>
                      {l}
                    </span>
                    <span
                      className="text-sm font-medium capitalize"
                      style={{ color: "#fafafa" }}
                    >
                      {v || "\u2014"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ──── Data Sources ──── */}
            <div className="glass-card p-6">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#71717a" }}
              >
                Data Sources
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  {
                    l: "Income",
                    v: assessment.traditionalData?.income
                      ? `₹${assessment.traditionalData.income.toLocaleString("en-IN")}`
                      : "\u2014",
                  },
                  {
                    l: "Credit Score",
                    v: assessment.traditionalData?.creditScore || "\u2014",
                    color:
                      assessment.traditionalData?.creditScore > 700
                        ? "#34d399"
                        : assessment.traditionalData?.creditScore > 600
                        ? "#fbbf24"
                        : assessment.traditionalData?.creditScore
                        ? "#f87171"
                        : undefined,
                  },
                  {
                    l: "Telematics",
                    v: assessment.alternativeData?.telematicsScore || "\u2014",
                  },
                  {
                    l: "Behavioral",
                    v: assessment.alternativeData?.behavioralScore || "\u2014",
                  },
                  {
                    l: "Lifestyle",
                    v: assessment.alternativeData?.lifestyleScore || "\u2014",
                  },
                  {
                    l: "Social Media Risk",
                    v: assessment.alternativeData?.socialMediaRisk || "\u2014",
                    color:
                      assessment.alternativeData?.socialMediaRisk === "low"
                        ? "#34d399"
                        : assessment.alternativeData?.socialMediaRisk === "medium"
                        ? "#fbbf24"
                        : assessment.alternativeData?.socialMediaRisk === "high"
                        ? "#f87171"
                        : undefined,
                  },
                  {
                    l: "Job Stability",
                    v: assessment.alternativeData?.jobStabilityScore != null
                      ? `${assessment.alternativeData.jobStabilityScore}/100`
                      : "\u2014",
                    color: assessment.alternativeData?.jobStabilityScore >= 70
                      ? "#34d399"
                      : assessment.alternativeData?.jobStabilityScore >= 45
                      ? "#fbbf24"
                      : assessment.alternativeData?.jobStabilityScore != null
                      ? "#f87171"
                      : undefined,
                  },
                ].map(({ l, v, color }) => (
                  <div key={l} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: "#71717a" }}>
                      {l}
                    </span>
                    <span
                      className="text-sm font-mono font-medium capitalize"
                      style={{ color: color || "#fafafa" }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ──── Documents ──── */}
            <div className="glass-card p-6">
              <h3
                className="text-xs font-semibold uppercase tracking-widest mb-5"
                style={{ color: "#71717a" }}
              >
                Documents
              </h3>
              {assessment.documents && assessment.documents.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {assessment.documents.map((doc, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div
                        className="flex items-center justify-center rounded-lg"
                        style={{
                          width: 36,
                          height: 36,
                          background: "rgba(255,255,255,0.03)",
                          flexShrink: 0,
                        }}
                      >
                        {docIcon(doc.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-sm font-medium truncate"
                          style={{ color: "#fafafa", margin: 0 }}
                        >
                          {doc.name || "Untitled Document"}
                        </p>
                        <p
                          className="text-[10px] font-mono"
                          style={{ color: "#52525b", margin: 0 }}
                        >
                          {doc.type || "Unknown type"}
                          {doc.uploadedAt &&
                            ` \u00b7 ${new Date(doc.uploadedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-8"
                  style={{ color: "#52525b" }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
                    <polyline points="13 2 13 9 20 9" />
                  </svg>
                  <p className="text-xs mt-2">No documents attached</p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="glass-card p-10 text-center">
          <div
            style={{
              width: 48,
              height: 48,
              border: "3px solid rgba(245,158,11,0.2)",
              borderTopColor: "#f59e0b",
              borderRadius: "50%",
              animation: "spin-anim 1s linear infinite",
              margin: "0 auto 16px",
            }}
          />
          <p className="text-base font-medium" style={{ color: "#fafafa" }}>
            Assessment in Progress
          </p>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            No analysis results yet. This assessment may still be processing.
          </p>
        </div>
      )}

      {/* ══════════ UNDERWRITER ACTION PANEL ══════════ */}
      {isUnderwriter && (
        <div className="mt-6">
          <div
            className="glass-card overflow-hidden"
            style={{
              border: hasExistingAction
                ? `1px solid ${ACTION_MAP[existingAction.action]?.color || "rgba(255,255,255,0.1)"}30`
                : "1px solid rgba(255,255,255,0.10)",
            }}
          >
            {/* header */}
            <div
              className="px-6 py-4 flex items-center gap-3"
              style={{
                background: "rgba(255,255,255,0.02)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12l2 2 4-4" />
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3
                className="text-sm font-semibold uppercase tracking-widest"
                style={{ color: "#fafafa", margin: 0 }}
              >
                Underwriter Action Panel
              </h3>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-md ml-auto"
                style={{
                  background: "rgba(16,185,129,0.08)",
                  color: "#10b981",
                  border: "1px solid rgba(16,185,129,0.15)",
                }}
              >
                {userRole}
              </span>
            </div>

            <div className="p-6">
              {/* ── Existing action (read-only) ── */}
              {hasExistingAction ? (
                <div>
                  <div
                    className="p-5 rounded-xl mb-4"
                    style={{
                      background: `${ACTION_MAP[existingAction.action]?.color || "#71717a"}08`,
                      border: `1px solid ${ACTION_MAP[existingAction.action]?.color || "#71717a"}20`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{
                          background: ACTION_MAP[existingAction.action]?.color || "#71717a",
                          boxShadow: `0 0 8px ${ACTION_MAP[existingAction.action]?.color || "#71717a"}66`,
                        }}
                      />
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: ACTION_MAP[existingAction.action]?.color || "#fafafa",
                        }}
                      >
                        {ACTION_MAP[existingAction.action]?.label || existingAction.action}
                      </span>
                      {existingAction.actionAt && (
                        <span
                          className="text-[10px] font-mono ml-auto"
                          style={{ color: "#52525b" }}
                        >
                          {new Date(existingAction.actionAt).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm leading-relaxed"
                      style={{
                        color: "#a1a1aa",
                        margin: 0,
                        padding: "8px 12px",
                        background: "rgba(0,0,0,0.2)",
                        borderRadius: 8,
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {existingAction.justification}
                    </p>
                    {existingAction.action === "modified" &&
                      existingAction.modifiedPremium && (
                        <div
                          className="mt-3 p-3 rounded-lg"
                          style={{
                            background: "rgba(245,158,11,0.06)",
                            border: "1px solid rgba(245,158,11,0.15)",
                          }}
                        >
                          <span className="text-xs" style={{ color: "#71717a" }}>
                            Modified Premium:
                          </span>
                          <span
                            className="text-sm font-mono font-semibold ml-2"
                            style={{ color: "#fbbf24" }}
                          >
                            ₹{existingAction.modifiedPremium.min?.toLocaleString("en-IN")} &ndash; ₹
                            {existingAction.modifiedPremium.max?.toLocaleString("en-IN")} /yr
                          </span>
                        </div>
                      )}
                  </div>
                  <p className="text-xs" style={{ color: "#52525b" }}>
                    An action has already been recorded for this assessment. To change it, a new review must be initiated.
                  </p>
                </div>
              ) : (
                /* ── Action form ── */
                <div>
                  {/* action buttons */}
                  <label
                    className="text-xs font-medium block mb-3"
                    style={{ color: "#71717a" }}
                  >
                    Select Action
                  </label>
                  <div
                    className="grid gap-3"
                    style={{
                      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                    }}
                  >
                    {[
                      {
                        key: "accepted",
                        label: "Accept",
                        color: "#10b981",
                        bg: "rgba(16,185,129,0.08)",
                        hoverBg: "rgba(16,185,129,0.18)",
                        borderColor: "rgba(16,185,129,0.2)",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ),
                      },
                      {
                        key: "rejected",
                        label: "Reject",
                        color: "#ef4444",
                        bg: "rgba(239,68,68,0.08)",
                        hoverBg: "rgba(239,68,68,0.18)",
                        borderColor: "rgba(239,68,68,0.2)",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        ),
                      },
                      {
                        key: "modified",
                        label: "Modify Premium",
                        color: "#f59e0b",
                        bg: "rgba(245,158,11,0.08)",
                        hoverBg: "rgba(245,158,11,0.18)",
                        borderColor: "rgba(245,158,11,0.2)",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        ),
                      },
                      {
                        key: "info_requested",
                        label: "Request Info",
                        color: "#3b82f6",
                        bg: "rgba(59,130,246,0.08)",
                        hoverBg: "rgba(59,130,246,0.18)",
                        borderColor: "rgba(59,130,246,0.2)",
                        icon: (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                            <line x1="12" y1="17" x2="12.01" y2="17" />
                          </svg>
                        ),
                      },
                    ].map((btn) => {
                      const isSelected = selectedAction === btn.key;
                      return (
                        <button
                          key={btn.key}
                          type="button"
                          onClick={() =>
                            setSelectedAction(isSelected ? null : btn.key)
                          }
                          className="flex flex-col items-center gap-2 py-4 px-3 rounded-xl cursor-pointer text-center"
                          style={{
                            background: isSelected ? btn.hoverBg : btn.bg,
                            border: `1.5px solid ${isSelected ? btn.color : btn.borderColor}`,
                            color: btn.color,
                            fontFamily: "inherit",
                            transition: "all 0.2s ease",
                            transform: isSelected ? "scale(1.02)" : "scale(1)",
                            boxShadow: isSelected
                              ? `0 0 20px ${btn.color}22, inset 0 0 20px ${btn.color}08`
                              : "none",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = btn.hoverBg;
                              e.currentTarget.style.transform = "scale(1.02)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = btn.bg;
                              e.currentTarget.style.transform = "scale(1)";
                            }
                          }}
                        >
                          {btn.icon}
                          <span className="text-xs font-semibold">
                            {btn.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* modified premium inputs */}
                  {selectedAction === "modified" && (
                    <div
                      className="mt-4 p-4 rounded-xl"
                      style={{
                        background: "rgba(245,158,11,0.04)",
                        border: "1px solid rgba(245,158,11,0.12)",
                        animation: "fade-up 0.3s ease both",
                      }}
                    >
                      <label
                        className="text-xs font-medium block mb-3"
                        style={{ color: "#f59e0b" }}
                      >
                        Modified Premium Range (₹/yr)
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label
                            className="text-[10px] block mb-1"
                            style={{ color: "#71717a" }}
                          >
                            Min Premium
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="e.g. 1200"
                            value={modifiedMin}
                            onChange={(e) => setModifiedMin(e.target.value)}
                            min={0}
                          />
                        </div>
                        <div>
                          <label
                            className="text-[10px] block mb-1"
                            style={{ color: "#71717a" }}
                          >
                            Max Premium
                          </label>
                          <input
                            type="number"
                            className="input-field"
                            placeholder="e.g. 2400"
                            value={modifiedMax}
                            onChange={(e) => setModifiedMax(e.target.value)}
                            min={0}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* justification */}
                  <div className="mt-4">
                    <label
                      className="text-xs font-medium block mb-2"
                      style={{ color: "#71717a" }}
                    >
                      Justification{" "}
                      <span style={{ color: "#ef4444" }}>*</span>
                    </label>
                    <textarea
                      className="input-field"
                      rows={4}
                      placeholder="Provide your rationale for this decision (min 5 characters)..."
                      value={justification}
                      onChange={(e) => setJustification(e.target.value)}
                      style={{ resize: "vertical", minHeight: 80 }}
                    />
                    <div className="flex justify-between mt-1">
                      <span
                        className="text-[10px]"
                        style={{
                          color:
                            justification.length > 0 && justification.length < 5
                              ? "#ef4444"
                              : "#52525b",
                        }}
                      >
                        {justification.length > 0 && justification.length < 5
                          ? "Min 5 characters required"
                          : " "}
                      </span>
                      <span
                        className="text-[10px] font-mono"
                        style={{ color: "#52525b" }}
                      >
                        {justification.length} chars
                      </span>
                    </div>
                  </div>

                  {/* submit */}
                  <div className="flex items-center gap-3 mt-4">
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={submitting || !selectedAction}
                      onClick={handleSubmitAction}
                      style={{
                        opacity:
                          submitting || !selectedAction ? 0.5 : 1,
                        cursor:
                          submitting || !selectedAction
                            ? "not-allowed"
                            : "pointer",
                      }}
                    >
                      {submitting ? (
                        <span className="inline-flex items-center gap-2">
                          <span
                            style={{
                              width: 14,
                              height: 14,
                              border: "2px solid rgba(255,255,255,0.3)",
                              borderTopColor: "#fff",
                              borderRadius: "50%",
                              display: "inline-block",
                              animation: "spin-anim 0.6s linear infinite",
                            }}
                          />
                          Submitting...
                        </span>
                      ) : (
                        "Submit Action"
                      )}
                    </button>
                    {selectedAction && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => {
                          setSelectedAction(null);
                          setJustification("");
                          setModifiedMin("");
                          setModifiedMax("");
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
