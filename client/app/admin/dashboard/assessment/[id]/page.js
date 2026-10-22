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
import GemmaReasoningCard from "@/components/ui/GemmaReasoningCard";

/* ─────────────────────────── helpers & tokens ─────────────────────────── */
const RISK_COLOR = (s) =>
  s <= 35 ? "#3B82F6" : s <= 55 ? "#06B6D4" : s <= 75 ? "#F59E0B" : "#F43F5E";
const RISK_LABEL = (s) =>
  s <= 35 ? "Low Risk" : s <= 55 ? "Moderate Risk" : s <= 75 ? "Elevated Risk" : "High Alert";

const POLICY_PALETTE = {
  health: { bg: "rgba(59,130,246,0.1)", text: "#3B82F6", border: "rgba(59,130,246,0.25)", code: "HLTH" },
  auto: { bg: "rgba(6,182,212,0.1)", text: "#06B6D4", border: "rgba(6,182,212,0.25)", code: "AUTO" },
  life: { bg: "rgba(129,140,248,0.1)", text: "#818CF8", border: "rgba(129,140,248,0.25)", code: "LIFE" },
  property: { bg: "rgba(56,189,248,0.1)", text: "#38BDF8", border: "rgba(56,189,248,0.25)", code: "PROP" },
};

const STATUS_CONFIGS = {
  draft: { label: "Draft Intake", color: "#94A3B8", bg: "rgba(148,163,184,0.1)" },
  processing: { label: "Neural Processing", color: "#38BDF8", bg: "rgba(56,189,248,0.1)" },
  completed: { label: "Adjudication Ready", color: "#3B82F6", bg: "rgba(59,130,246,0.1)" },
  error: { label: "Telemetry Error", color: "#F43F5E", bg: "rgba(244,63,94,0.1)" },
  referred: { label: "Referred for Audit", color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
  accepted: { label: "Policy Accepted", color: "#10B981", bg: "rgba(16,185,129,0.1)" },
  rejected: { label: "Policy Declined", color: "#F43F5E", bg: "rgba(244,63,94,0.1)" },
  info_requested: { label: "Evidence Requested", color: "#38BDF8", bg: "rgba(56,189,248,0.1)" },
};

const ACTION_CONFIGS = {
  accepted: { label: "Accepted by Underwriter", color: "#10B981" },
  rejected: { label: "Declined by Underwriter", color: "#F43F5E" },
  modified: { label: "Premium Calibrated", color: "#F59E0B" },
  info_requested: { label: "Additional Evidence Requested", color: "#38BDF8" },
};

const DOC_ICONS = {
  pdf: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  default: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#71717A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        toast.success("Neural re-evaluation complete!");
        fetchAssessment();
      } else {
        toast.error(data.error || "Re-evaluation failed");
      }
    } catch {
      toast.error("Telemetry link failure. Please retry.");
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

  const userRole = session?.user?.role;
  const isUnderwriter = userRole === "underwriter" || userRole === "admin";
  const existingAction = assessment?.underwriterAction;
  const hasExistingAction = !!(existingAction?.action);

  async function handleSubmitAction() {
    if (!selectedAction) {
      toast.error("Select an underwriting action vector");
      return;
    }
    if (!justification || justification.trim().length < 5) {
      toast.error("Actuarial justification required (min 5 chars)");
      return;
    }
    if (selectedAction === "modified") {
      if (!modifiedMin || !modifiedMax) {
        toast.error("Enter calibrated minimum and maximum premium bounds");
        return;
      }
      if (Number(modifiedMin) >= Number(modifiedMax)) {
        toast.error("Minimum premium bound must be strictly less than maximum");
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
        toast.error(data.error || "Adjudication dispatch failed");
      } else {
        toast.success("Underwriter determination archived to audit ledger");
        setSelectedAction(null);
        setJustification("");
        setModifiedMin("");
        setModifiedMax("");
        fetchAssessment();
      }
    } catch {
      toast.error("Telemetry network failure. Please retry.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "History", href: "/admin/dashboard/history" },
          { label: "Ingesting Docket...", href: "#" },
        ]} />
        <div className="blueprint-card p-16 text-center">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="font-mono text-xs text-zinc-400">SYNCHRONIZING UNDERWRITING DOSSIER #{id?.slice(-8).toUpperCase()}...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="space-y-6">
        <Breadcrumbs items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "History", href: "/admin/dashboard/history" },
          { label: "Not Found", href: "#" },
        ]} />
        <div className="blueprint-card p-12 text-center">
          <ErrorState
            message="This risk assessment vector does not exist or access has been restricted."
            onRetry={fetchAssessment}
          />
          <Link href="/admin/dashboard/history" className="inline-block mt-4 text-xs font-mono text-blue-400 hover:underline">
            &larr; Return to Audit History
          </Link>
        </div>
      </div>
    );
  }

  const theme = POLICY_PALETTE[assessment.policyType] || POLICY_PALETTE.health;
  const statusInfo = STATUS_CONFIGS[assessment.status] || STATUS_CONFIGS.draft;

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/admin/dashboard" },
        { label: "History", href: "/admin/dashboard/history" },
        { label: assessment.applicant?.name || "Dossier Detail", href: "#" },
      ]} />

      {/* Header Docket Card */}
      <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
              [DOCKET.REF_#{id?.slice(-8).toUpperCase()}]
            </span>
            <span
              className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
              style={{ background: theme.bg, color: theme.text, borderColor: theme.border }}
            >
              {theme.code}
            </span>
            <span
              className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded border"
              style={{ background: statusInfo.bg, color: statusInfo.color, borderColor: `${statusInfo.color}30` }}
            >
              {statusInfo.label}
            </span>
            {hasExistingAction && (
              <span
                className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                style={{
                  background: `${ACTION_CONFIGS[existingAction.action]?.color || "#71717A"}15`,
                  color: ACTION_CONFIGS[existingAction.action]?.color || "#71717A",
                  borderColor: `${ACTION_CONFIGS[existingAction.action]?.color || "#71717A"}30`,
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {ACTION_CONFIGS[existingAction.action]?.label}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {assessment.applicant?.name || "Anonymous Applicant"}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-2 font-mono text-[11px] text-zinc-500">
            {assessment.createdAt && (
              <span>Created: {new Date(assessment.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
            )}
            {r?.processingTime && (
              <span>Pipeline: {r.processingTime}ms</span>
            )}
            {r?.confidence && (
              <span>Confidence: {r.confidence}%</span>
            )}
          </div>
        </div>

        {/* Action controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-3">
          {r && (
            <Link
              href={`/admin/dashboard/assessment/${id}/analysis`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/>
              </svg>
              Neural Deep Analysis
            </Link>
          )}

          <button
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-300 hover:text-white text-xs font-mono transition"
          >
            {reanalyzing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Re-evaluating...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
                </svg>
                <span>Re-evaluate AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Cockpit */}
      {r ? (
        <div className="space-y-6">
          {/* Top Row: Gauge + Factor Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Risk Gauge */}
            <div className="blueprint-card p-6 flex flex-col items-center justify-between">
              <div className="flex items-center justify-between w-full mb-2">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[GAUGE.SCORE]</span>
                <a
                  href={`/api/assessments/${id}/document`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[10px] text-blue-400 hover:underline flex items-center gap-1"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  PDF Dossier
                </a>
              </div>

              <div className="py-2">
                <RiskGauge score={riskScore} size={210} />
              </div>

              <div className="w-full space-y-3 pt-3 border-t border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] text-zinc-500 uppercase">Decision Class</span>
                  <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded border ${
                    r.decision === "approve"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                      : r.decision === "decline"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/25"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                  }`}>
                    {r.decision?.toUpperCase()}
                  </span>
                </div>

                {r.recommendedPremium && (
                  <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800 text-center">
                    <span className="font-mono text-[9px] text-zinc-500 uppercase block">Calibrated Annual Premium</span>
                    <span className="font-mono text-sm font-bold text-white mt-0.5 block">
                      ₹{r.recommendedPremium.min?.toLocaleString("en-IN")} &ndash; ₹{r.recommendedPremium.max?.toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Factor Breakdown */}
            <div className="blueprint-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[FACTORS.SHAP_DECOMPOSITION]</span>
                <span className="font-mono text-[10px] text-blue-400">{r.factors?.length || 0} VECTORS</span>
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Risk Contribution Weights</h3>

              <div className="space-y-3">
                {(r.factors || []).map((f, i) => {
                  const isPositive = f.impact === "positive";
                  const color = isPositive ? "#3B82F6" : "#F43F5E";
                  const pct = Math.min(Math.abs(f.score), 100);
                  const weightPct = Math.round((f.weight || 0) * 100);

                  return (
                    <div key={i} className="bg-[#070A13] border border-zinc-800 p-2.5 rounded-lg flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded flex items-center justify-center font-mono text-xs font-bold border"
                        style={{ background: `${color}15`, color, borderColor: `${color}30` }}
                      >
                        {isPositive ? "↓" : "↑"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-zinc-200 truncate">{f.source}</span>
                          <span className="font-mono text-xs font-bold" style={{ color }}>{f.score}/100</span>
                        </div>
                        <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                        </div>
                      </div>
                      <span className="font-mono text-[9px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                        {weightPct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Waterfall Chart */}
            <div className="blueprint-card p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-zinc-500 uppercase">[DEVIATION.WATERFALL]</span>
                <span className="font-mono text-[10px] text-zinc-400">DELTA EXPLANATION</span>
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-4">Score Derivation Track</h3>
              <RiskWaterfall
                factors={r.factors || []}
                riskScore={r.riskScore}
                baseScore={r.baseScore ?? { health: 35, auto: 30, life: 25, property: 30 }[assessment.policyType] ?? 35}
              />
            </div>
          </div>

          {/* AI Synthesis Narrative */}
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  [NEURAL.EXPLANATION]
                </span>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Actuarial Risk Narrative</h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">AUTOMATED SYNTHESIS</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans whitespace-pre-wrap">
              {r.explanation || "No automated actuarial explanation logged for this assessment."}
            </p>
          </div>

          {/* Local Gemma 4 E4B Reasoning Card */}
          <GemmaReasoningCard
            assessmentId={assessment._id}
            initialReasoning={r.gemmaReasoning}
            policyType={assessment.policyType}
          />

          {/* Traditional vs AI Comparison */}
          <TraditionalVsAI
            traditionalScore={r.traditionalScore}
            aiScore={r.riskScore}
            factors={r.factors || []}
            policyType={assessment.policyType}
            premium={r.recommendedPremium}
          />

          {/* Policy Recommendation */}
          <PolicyRecommendation
            riskScore={r.riskScore}
            policyType={assessment.policyType}
            decision={r.decision}
            premium={r.recommendedPremium}
            applicant={assessment.applicant}
            factors={r.factors || []}
          />

          {/* RAG Citations */}
          <RAGCitations
            regulatoryCitations={r.regulatoryCitations || []}
            adverseActionReasons={r.adverseActionReasons || []}
            policyType={assessment.policyType}
            assessmentId={id}
          />

          {/* Product Recommendations */}
          {r.recommendations?.length > 0 && (
            <ProductRecommendations
              recommendations={r.recommendations}
              policyType={assessment.policyType}
            />
          )}

          {/* Pricing Comparison */}
          {r.recommendedPremium && (
            <PricingComparison
              riskScore={r.riskScore}
              decision={r.decision}
              premium={r.recommendedPremium}
              policyType={assessment.policyType}
            />
          )}

          {/* Simulator & Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RiskSimulator policyType={assessment.policyType} assessment={assessment} />
            <ComparisonView traditionalScore={r.traditionalScore} aiScore={r.riskScore} />
          </div>

          {/* Ingested Evidence & Data Vectors */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Applicant Profile */}
            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-blue-400 block mb-1">[DEMOGRAPHICS]</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Applicant Coordinates</h3>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { l: "Full Name", v: assessment.applicant?.name },
                  { l: "Age", v: assessment.applicant?.age },
                  { l: "Gender", v: assessment.applicant?.gender },
                  { l: "Occupation", v: assessment.applicant?.occupation },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">{l}</span>
                    <span className="text-white capitalize font-semibold">{v || "--"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingested Telemetry Sources */}
            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-blue-400 block mb-1">[INGESTION]</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Alternative Data Signals</h3>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { l: "Annual Income", v: assessment.traditionalData?.income ? `₹${assessment.traditionalData.income.toLocaleString("en-IN")}` : "--" },
                  { l: "Credit Score", v: assessment.traditionalData?.creditScore || "--" },
                  { l: "Telematics Index", v: assessment.alternativeData?.telematicsScore || "--" },
                  { l: "Behavioral Vector", v: assessment.alternativeData?.behavioralScore || "--" },
                  { l: "Social Media Signal", v: assessment.alternativeData?.socialMediaRisk || "--" },
                ].map(({ l, v }) => (
                  <div key={l} className="flex justify-between items-center py-1 border-b border-zinc-800/60">
                    <span className="text-zinc-500">{l}</span>
                    <span className="text-white font-semibold">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Attached Verification Documents */}
            <div className="blueprint-card p-6">
              <span className="font-mono text-[10px] text-blue-400 block mb-1">[EVIDENCE.DOCUMENTS]</span>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-4">Attached Documents ({assessment.documents?.length || 0})</h3>
              {assessment.documents?.length > 0 ? (
                <div className="space-y-2">
                  {assessment.documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-[#070A13] border border-zinc-800">
                      <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                        {docIcon(doc.type)}
                      </div>
                      <div className="min-w-0 flex-1 font-mono">
                        <p className="text-xs text-white truncate">{doc.name || "Document"}</p>
                        <p className="text-[10px] text-zinc-500">{doc.type || "unknown"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs font-mono text-zinc-500 text-center py-6">NO VERIFIED EVIDENCE ATTACHED</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="blueprint-card p-12 text-center">
          <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-sm font-bold text-white mb-1">Assessment Ingestion in Progress</h3>
          <p className="text-xs text-zinc-500">Telemetry inputs are being processed by the actuarial model pipeline.</p>
        </div>
      )}

      {/* Underwriter Adjudication Action Panel */}
      {isUnderwriter && (
        <div className="blueprint-card p-6 border-blue-500/30">
          <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [ACT.DISPATCH_DECISION]
              </span>
              <h3 className="text-sm font-bold text-white tracking-wide">Underwriter Determination Console</h3>
            </div>
            <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
              ROLE: {userRole?.toUpperCase()}
            </span>
          </div>

          {hasExistingAction ? (
            <div className="bg-[#070A13] border border-blue-500/30 p-5 rounded-xl">
              <div className="flex items-center gap-2 mb-2 font-mono text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span className="font-bold text-white">
                  ARCHIVED ACTION: {ACTION_CONFIGS[existingAction.action]?.label || existingAction.action}
                </span>
                {existingAction.actionAt && (
                  <span className="text-zinc-500 ml-auto">{new Date(existingAction.actionAt).toLocaleString()}</span>
                )}
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-mono bg-[#0A0F1D] p-3 rounded border border-zinc-800">
                {existingAction.justification}
              </p>
              {existingAction.action === "modified" && existingAction.modifiedPremium && (
                <div className="mt-3 font-mono text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded">
                  Calibrated Premium Bound: ₹{existingAction.modifiedPremium.min?.toLocaleString("en-IN")} &ndash; ₹{existingAction.modifiedPremium.max?.toLocaleString("en-IN")} /yr
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { key: "accepted", label: "Approve Dossier", color: "#10B981" },
                  { key: "rejected", label: "Decline Policy", color: "#F43F5E" },
                  { key: "modified", label: "Recalibrate Premium", color: "#F59E0B" },
                  { key: "info_requested", label: "Request Evidence", color: "#38BDF8" },
                ].map((btn) => {
                  const isSelected = selectedAction === btn.key;
                  return (
                    <button
                      key={btn.key}
                      onClick={() => setSelectedAction(isSelected ? null : btn.key)}
                      className={`p-3.5 rounded-xl border text-xs font-mono font-bold transition flex flex-col items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                          : "bg-[#070A13] hover:bg-[#0A0F1D] border-zinc-800 text-zinc-400"
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ background: btn.color }} />
                      <span>{btn.label}</span>
                    </button>
                  );
                })}
              </div>

              {selectedAction === "modified" && (
                <div className="p-4 rounded-xl bg-[#070A13] border border-amber-500/30 grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1">Minimum Premium (₹/yr)</label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={modifiedMin}
                      onChange={(e) => setModifiedMin(e.target.value)}
                      className="w-full bg-[#0A0F1D] border border-zinc-800 text-white text-xs font-mono p-2.5 rounded outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1">Maximum Premium (₹/yr)</label>
                    <input
                      type="number"
                      placeholder="e.g. 25000"
                      value={modifiedMax}
                      onChange={(e) => setModifiedMax(e.target.value)}
                      className="w-full bg-[#0A0F1D] border border-zinc-800 text-white text-xs font-mono p-2.5 rounded outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Actuarial Justification & Rationale *
                </label>
                <textarea
                  rows={4}
                  placeholder="State the regulatory and risk-based rationale for this determination..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-3 outline-none leading-relaxed font-mono"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSubmitAction}
                  disabled={submitting || !selectedAction}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider transition shadow-lg shadow-blue-500/20 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {submitting ? "Archiving Determination..." : "Commit Adjudication Decision"}
                </button>
                {selectedAction && (
                  <button
                    onClick={() => { setSelectedAction(null); setJustification(""); setModifiedMin(""); setModifiedMax(""); }}
                    className="font-mono text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
