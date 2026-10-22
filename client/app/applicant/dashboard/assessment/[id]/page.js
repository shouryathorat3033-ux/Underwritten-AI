"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import ErrorState from "@/components/ui/ErrorState";
import ProductRecommendations from "@/components/ui/ProductRecommendations";
import TraditionalVsAI from "@/components/ui/TraditionalVsAI";
import PolicyRecommendation from "@/components/ui/PolicyRecommendation";
import ImprovementTracker from "@/components/ui/ImprovementTracker";
import GemmaReasoningCard from "@/components/ui/GemmaReasoningCard";

/* ─────────────────────────── helpers ─────────────────────────── */
const DECISION_CONFIG = {
  approve: { label: "Actuarially Approved", color: "#3b82f6", bg: "rgba(37,99,235,0.08)", border: "rgba(59,130,246,0.25)", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>, message: "Your application parameters meet underwriting thresholds! You can proceed to activate the policy under the calculated risk tier." },
  refer: { label: "Under Underwriter Audit", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>, message: "Your application is currently in technical review with our underwriting team. Additional telemetry calibration may be requested." },
  decline: { label: "Parameters Exceeded", color: "#f43f5e", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", icon: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>, message: "Your profile exceeds automated risk tolerances for this coverage tier. Please review the detailed adverse factor breakdown below." },
};

const POLICY_LABELS = { health: "Health Insurance", auto: "Motor Insurance", life: "Life Insurance", property: "Property Insurance" };
const POLICY_COLORS = {
  health: "#3b82f6", auto: "#f59e0b", life: "#f43f5e", property: "#8b5cf6",
};

const STATUS_MAP = {
  draft: { label: "Draft", color: "#64748b" },
  processing: { label: "Processing", color: "#38bdf8" },
  completed: { label: "Calibrated", color: "#3b82f6" },
  accepted: { label: "Approved", color: "#3b82f6" },
  rejected: { label: "Declined", color: "#f43f5e" },
  referred: { label: "Under Review", color: "#f59e0b" },
  info_requested: { label: "Telemetry Required", color: "#06b6d4" },
  error: { label: "Telemetry Error", color: "#f43f5e" },
};

/* ─────────────────────────── animated counter ─────────────────────────── */
function useCountUp(end, duration = 1200) {
  const [value, setValue] = useState(0);
  const raf = useRef(null);
  useEffect(() => {
    if (end == null) return;
    const startTime = performance.now();
    function step(now) {
      const t = Math.min((now - startTime) / duration, 1);
      setValue(Math.round((1 - Math.pow(1 - t, 3)) * end));
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => raf.current && cancelAnimationFrame(raf.current);
  }, [end, duration]);
  return value;
}

/* ═══════════════════════════════════════════════════════════════════════════
   APPLICANT ASSESSMENT VIEW — Ordivalabs Blueprint Aesthetic
   ═══════════════════════════════════════════════════════════════════════════ */
export default function ApplicantAssessmentPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [assessment, setAssessment] = useState(null);
  const [allAssessments, setAllAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAssessment = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/assessments/${id}`).then(r => r.json()),
      fetch("/api/assessments").then(r => r.json()).catch(() => ({ assessments: [] })),
    ]).then(([d, all]) => {
      setAssessment(d.assessment);
      setAllAssessments(all.assessments || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchAssessment(); }, [fetchAssessment]);

  const r = assessment?.result;
  const uwAction = assessment?.underwriterAction?.action;

  const effectiveDecision = uwAction === "accepted" ? "approve"
    : uwAction === "rejected" ? "decline"
    : uwAction === "modified" ? "approve"
    : uwAction === "info_requested" ? "refer"
    : "refer";

  const decision = DECISION_CONFIG[effectiveDecision] || DECISION_CONFIG.refer;

  const decisionMessage = uwAction === "accepted"
    ? "Your application parameters have been audited and approved by the actuarial underwriting team. You can proceed with policy activation."
    : uwAction === "rejected"
    ? "Following actuarial evaluation, your application parameters exceeded risk tolerances for this coverage tier. Review the specific factors below."
    : uwAction === "modified"
    ? "Your application has been approved under an adjusted risk-calibrated premium. Please review the updated structure below."
    : uwAction === "info_requested"
    ? "Underwriters require additional documentary telemetry to complete the verification pipeline."
    : "Your application parameters have been registered and are queued in the underwriter review pipeline.";

  const showResults = uwAction === "accepted" || uwAction === "modified";
  const policyColor = POLICY_COLORS[assessment?.policyType] || "#3b82f6";
  const premiumDisplay = useCountUp(r?.recommendedPremium?.min || 0);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs font-mono text-slate-400">[INITIALIZING_DOCKET_TELEMETRY...]</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }}>
        <Breadcrumbs items={[{ label: "Dashboard", href: "/applicant/dashboard" }, { label: "Not Found", href: "#" }]} />
        <ErrorState message="Assessment docket could not be retrieved from encrypted storage." onRetry={fetchAssessment} />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[assessment.status] || STATUS_MAP.draft;

  return (
    <div style={{ maxWidth: 840, margin: "0 auto", width: "100%" }} className="space-y-6">
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/applicant/dashboard" },
        { label: "My Applications", href: "/applicant/dashboard/history" },
        { label: POLICY_LABELS[assessment.policyType] || "Assessment", href: "#" },
      ]} />

      {/* ══════════ BACK LINK ══════════ */}
      <div className="flex items-center justify-between">
        <Link href="/applicant/dashboard/history" className="no-underline inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-blue-400 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          RETURN_TO_DOCKET_INDEX
        </Link>
        <Link href={`/applicant/dashboard/assessment/${id}/analysis`} className="no-underline inline-flex items-center gap-1.5 text-xs font-mono text-blue-400 hover:text-blue-300 transition-colors">
          VIEW_DEEP_NEURAL_ANALYSIS <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
        </Link>
      </div>

      {/* ══════════ APPLICATION HEADER ══════════ */}
      <div className="blueprint-card p-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[DOCKET_HEADER]</span>
              <span className="text-[10px] font-mono text-slate-400">UUID: {id.slice(-8).toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{POLICY_LABELS[assessment.policyType] || "Insurance Application"}</h1>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              TIMESTAMP: {new Date(assessment.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-lg border self-start sm:self-auto" style={{ background: `${statusInfo.color}15`, color: statusInfo.color, borderColor: `${statusInfo.color}35` }}>
            [{statusInfo.label.toUpperCase()}]
          </span>
        </div>

        {/* Applicant summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40">
            <span className="text-slate-400 block text-[10px] uppercase">Applicant Name</span>
            <span className="text-slate-200 font-bold">{assessment.applicant?.name || "N/A"}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40">
            <span className="text-slate-400 block text-[10px] uppercase">Age / Class</span>
            <span className="text-slate-200 font-bold">{assessment.applicant?.age ? `${assessment.applicant.age} YRS` : "N/A"}</span>
          </div>
          <div className="p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40">
            <span className="text-slate-400 block text-[10px] uppercase">Occupation Vector</span>
            <span className="text-slate-200 font-bold truncate block">{assessment.applicant?.occupation || "N/A"}</span>
          </div>
        </div>
      </div>

      {/* ══════════ DECISION CARD (main focus) ══════════ */}
      {r && (
        <div className="blueprint-card p-6 relative overflow-hidden" style={{ background: decision.bg, borderColor: decision.border }}>
          <div className="flex items-center gap-3.5 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: `${decision.color}15`, borderColor: `${decision.color}35` }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={decision.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {decision.icon}
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold font-mono tracking-tight" style={{ color: decision.color }}>[{decision.label.toUpperCase()}]</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/10">[ACTUARIAL_AUDIT]</span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {uwAction
                  ? `AUDITED BY UNDERWRITER · ${new Date(assessment.underwriterAction.actionAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : `NEURAL ENSEMBLE EVALUATION · ${assessment.policyType.toUpperCase()}`}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-slate-300">{decisionMessage}</p>
          {!uwAction && (
            <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                Awaiting manual sign-off by credentialed underwriter docket
              </span>
            </div>
          )}
        </div>
      )}

      {/* ══════════ KEY INFO (always visible) ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="blueprint-card p-5 text-center relative overflow-hidden">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">[POLICY_CATEGORY]</p>
          <p className="text-xl font-bold capitalize text-white font-mono">{assessment.policyType}</p>
          <p className="text-xs text-slate-400 font-mono mt-1">Actuarial Protection Tier</p>
        </div>

        <div className="blueprint-card p-5 text-center relative overflow-hidden">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider mb-2 text-slate-400">[APPLICATION_STATUS]</p>
          <p className="text-xl font-bold font-mono" style={{ color: statusInfo.color }}>{statusInfo.label}</p>
          <p className="text-xs text-slate-400 font-mono mt-1">
            {uwAction === "accepted" ? "Ready for policy binding" :
             uwAction === "rejected" ? "Review parameters below" :
             uwAction === "modified" ? "Calibrated with premium adjustment" :
             uwAction === "info_requested" ? "Applicant response needed" :
             "In underwriting validation queue"}
          </p>
        </div>
      </div>

      {/* ══════════ PREMIUM ══════════ */}
      {showResults && r?.recommendedPremium && (
        <div className="blueprint-card p-6 text-center relative overflow-hidden">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 block mb-2">[CALCULATED_ANNUAL_PREMIUM]</span>
          <p className="text-4xl font-extrabold font-mono text-blue-400 tracking-tight">
            ₹{(assessment.underwriterAction?.modifiedPremium?.min || r.recommendedPremium.min)?.toLocaleString("en-IN")}
            <span className="text-lg text-slate-400 font-normal"> – </span>
            ₹{(assessment.underwriterAction?.modifiedPremium?.max || r.recommendedPremium.max)?.toLocaleString("en-IN")}
          </p>
          <p className="text-xs font-mono text-slate-400 mt-2">PER ANNUM // ACTUARIALLY UNDERWRITTEN</p>
        </div>
      )}

      {/* ══════════ LOCAL GEMMA 4 E4B REASONING (EVIDENCE-BASED) ══════════ */}
      {showResults && r && (
        <GemmaReasoningCard
          assessmentId={assessment._id}
          initialReasoning={r.gemmaReasoning}
          policyType={assessment.policyType}
        />
      )}

      {/* ══════════ EXPLANATION ══════════ */}
      {showResults && r?.explanation && (
        <div className="blueprint-card p-6 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
            </svg>
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">[ACTUARIAL_SYNTHESIS_NARRATIVE]</h3>
          </div>
          <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-wrap font-sans">
            {r.explanation}
          </p>
        </div>
      )}

      {/* ══════════ ADVERSE ACTION REASONS ══════════ */}
      {r?.adverseActionReasons?.length > 0 && (
        <div className="blueprint-card p-6 border-rose-500/30 bg-rose-500/5 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-sm font-bold text-rose-400 font-mono">[IRDAI_DISCLOSURE // ADVERSE_FACTORS]</h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mb-4 leading-relaxed">
            Statutory disclosure regarding specific parameters exceeding automated tolerance bounds.
          </p>
          <div className="space-y-3">
            {r.adverseActionReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl p-3.5 border border-rose-500/20 bg-slate-950/60">
                <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 text-xs font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-mono font-bold text-rose-300 uppercase">{reason.factor}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{reason.reason}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ WHAT YOU CAN DO ══════════ */}
      <div className="blueprint-card p-6 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">[NEXT_OPERATIONAL_STEPS]</h3>
          <span className="text-[10px] font-mono text-blue-400">ACTION_MATRIX</span>
        </div>
        <div className="space-y-3">
          {uwAction === "accepted" && (
            <>
              <NextStep icon="check" color="#3b82f6" title="Proceed to Policy Binding" desc="Your parameters have passed verification. Proceed with premium settlement to activate coverage." />
              <NextStep icon="doc" color="#38bdf8" title="Download Encrypted Assessment Dossier" desc="Retrieve the complete actuarial certificate for your records." link={`/api/assessments/${id}/document`} />
            </>
          )}
          {uwAction === "rejected" && (
            <>
              <NextStep icon="retry" color="#f59e0b" title="Recalibrate Parameters & Reapply" desc="Remediate the adverse factors listed above and submit an updated telemetry docket." link="/applicant/dashboard/assess" />
              <NextStep icon="chat" color="#3b82f6" title="Consult Actuarial AI Assistant" desc="Consult with our assistant on specific adjustments to lower risk metrics." />
            </>
          )}
          {uwAction === "info_requested" && (
            <>
              <NextStep icon="upload" color="#06b6d4" title="Transmit Requested Telemetry Documents" desc="Submit the requested supplementary documents to unlock the adjudication process." link="/applicant/dashboard/profile" />
              <NextStep icon="chat" color="#3b82f6" title="Request Telemetry Clarification" desc="Inquire with our assistant regarding the exact verification format required." />
            </>
          )}
          {uwAction === "modified" && (
            <>
              <NextStep icon="check" color="#3b82f6" title="Acknowledge Adjusted Rate" desc="Your application is approved with custom actuarial terms. Confirm acceptance to bind." />
              <NextStep icon="doc" color="#38bdf8" title="Download Modified Assessment Report" desc="View full schedule of adjusted underwriting stipulations." link={`/api/assessments/${id}/document`} />
            </>
          )}
          {!uwAction && (
            <>
              <NextStep icon="clock" color="#f59e0b" title="Pipeline Calibration in Progress" desc="Underwriting queues are evaluating your risk score against standard tables." />
              <NextStep icon="upload" color="#3b82f6" title="Attach Supplementary Telemetry" desc="Providing additional documentation (Form 16, wearables, medical records) expedites processing." link="/applicant/dashboard/profile" />
            </>
          )}
        </div>
      </div>

      {/* ══════════ PRODUCT RECOMMENDATIONS ══════════ */}
      {showResults && r?.recommendations?.length > 0 && (
        <div>
          <ProductRecommendations recommendations={r.recommendations} policyType={assessment.policyType} />
        </div>
      )}

      {/* ══════════ DOCUMENTS ══════════ */}
      {assessment.documents?.length > 0 && (
        <div className="blueprint-card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">[ATTACHED_EVIDENCE_PAYLOADS]</h3>
            <span className="text-[10px] font-mono text-slate-400">PAYLOAD_COUNT: {assessment.documents.length}</span>
          </div>
          <div className="space-y-2">
            {assessment.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-800/80 bg-slate-950/40">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-mono font-medium truncate text-white">{doc.name}</p>
                  {doc.docType && <p className="text-[10px] font-mono uppercase text-slate-400">{doc.docType}</p>}
                </div>
                {doc.verification?.verdict && (
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded border" style={{
                    background: doc.verification.verdict === "authentic" ? "rgba(37,99,235,0.1)" : "rgba(244,63,94,0.1)",
                    color: doc.verification.verdict === "authentic" ? "#3b82f6" : "#f43f5e",
                    borderColor: doc.verification.verdict === "authentic" ? "rgba(59,130,246,0.3)" : "rgba(244,63,94,0.3)",
                  }}>
                    {doc.verification.verdict === "authentic" ? "CRYPTOGRAPHIC_PASS" : "FLAGGED_FOR_AUDIT"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ IMPROVEMENT TRACKER ══════════ */}
      {allAssessments.length > 1 && (
        <div>
          <ImprovementTracker assessments={allAssessments} />
        </div>
      )}

      {/* ══════════ ACTION ACTIONS ══════════ */}
      <div className="flex flex-wrap gap-3 pb-8">
        <Link href="/applicant/dashboard/assess" className="no-underline btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs font-mono uppercase tracking-wider">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          INITIATE_NEW_ASSESSMENT
        </Link>
      </div>
    </div>
  );
}

/* ── Next Step Card ── */
function NextStep({ icon, color, title, desc, link }) {
  const icons = {
    check: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>,
    doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></>,
    clock: <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>,
    upload: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></>,
    retry: <><path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 102.13-9.36L1 10" /></>,
    chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></>,
  };

  const content = (
    <div className="flex items-start gap-3.5 p-3.5 rounded-xl transition-all duration-200 border" style={{ background: `${color}08`, borderColor: `${color}25` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border" style={{ background: `${color}15`, borderColor: `${color}35` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
      </div>
      <div>
        <p className="text-xs font-mono font-bold text-white uppercase">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link} className="no-underline block" target={link.startsWith("/api") ? "_blank" : undefined}>{content}</Link>;
  }
  return content;
}
