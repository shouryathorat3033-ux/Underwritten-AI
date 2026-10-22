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
  approve: { label: "Approved", color: "#10b981", bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></>, message: "Your application has been approved! You can proceed to purchase the policy at the recommended premium." },
  refer: { label: "Under Review", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", icon: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>, message: "Your application is being reviewed by our underwriting team. We may contact you for additional information." },
  decline: { label: "Not Approved", color: "#ef4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", icon: <><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></>, message: "Your application could not be approved at this time. Please review the reasons below." },
};

const POLICY_LABELS = { health: "Health Insurance", auto: "Motor Insurance", life: "Life Insurance", property: "Property Insurance" };
const POLICY_COLORS = {
  health: "#10b981", auto: "#60a5fa", life: "#c084fc", property: "#fbbf24",
};

const STATUS_MAP = {
  draft: { label: "Draft", color: "#71717a" },
  processing: { label: "Processing", color: "#60a5fa" },
  completed: { label: "Completed", color: "#34d399" },
  accepted: { label: "Accepted", color: "#34d399" },
  rejected: { label: "Rejected", color: "#f87171" },
  referred: { label: "Under Review", color: "#fbbf24" },
  info_requested: { label: "Info Requested", color: "#60a5fa" },
  error: { label: "Error", color: "#f87171" },
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
   APPLICANT ASSESSMENT VIEW — Consumer-friendly, no internal analytics
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

  // Applicant ONLY sees the underwriter's final decision.
  // If no underwriter has acted yet → "Under Review" (never show AI decision).
  const effectiveDecision = uwAction === "accepted" ? "approve"
    : uwAction === "rejected" ? "decline"
    : uwAction === "modified" ? "approve"
    : uwAction === "info_requested" ? "refer"
    : "refer"; // ← no underwriter action = always "Under Review"

  const decision = DECISION_CONFIG[effectiveDecision] || DECISION_CONFIG.refer;

  const decisionMessage = uwAction === "accepted"
    ? "Your application has been reviewed and approved by our underwriting team. You can proceed to purchase the policy."
    : uwAction === "rejected"
    ? "After review by our underwriting team, your application could not be approved at this time. Please see the reasons below."
    : uwAction === "modified"
    ? "Your application has been approved with a modified premium. Please review the updated premium below."
    : uwAction === "info_requested"
    ? "Our underwriting team needs additional information to process your application. Please provide the requested documents."
    : "Your application has been received and is currently being reviewed by our underwriting team. This typically takes 1-2 business days.";

  // Only show premium/explanation/recommendations after underwriter approves
  const showResults = uwAction === "accepted" || uwAction === "modified";

  const policyColor = POLICY_COLORS[assessment?.policyType] || "#10b981";
  const premiumDisplay = useCountUp(r?.recommendedPremium?.min || 0);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
        <div className="flex items-center justify-center" style={{ minHeight: "50vh" }}>
          <div className="flex flex-col items-center gap-4">
            <div style={{ width: 40, height: 40, border: "3px solid rgba(16,185,129,0.15)", borderTopColor: "#10b981", borderRadius: "50%", animation: "spin-anim 0.8s linear infinite" }} />
            <p className="text-sm" style={{ color: "#71717a" }}>Loading your assessment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
        <Breadcrumbs items={[{ label: "Dashboard", href: "/applicant/dashboard" }, { label: "Not Found", href: "#" }]} />
        <ErrorState message="Assessment not found." onRetry={fetchAssessment} />
      </div>
    );
  }

  const statusInfo = STATUS_MAP[assessment.status] || STATUS_MAP.draft;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", width: "100%" }}>
      <Breadcrumbs items={[
        { label: "Dashboard", href: "/applicant/dashboard" },
        { label: "My Applications", href: "/applicant/dashboard/history" },
        { label: POLICY_LABELS[assessment.policyType] || "Assessment", href: "#" },
      ]} />

      {/* ══════════ BACK LINK ══════════ */}
      <Link href="/applicant/dashboard/history" className="no-underline inline-flex items-center gap-1.5 text-sm mb-6" style={{ color: "#71717a" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
        Back to My Applications
      </Link>

      {/* ══════════ APPLICATION HEADER ══════════ */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold mb-1" style={{ color: "#fafafa" }}>{POLICY_LABELS[assessment.policyType] || "Insurance Application"}</h1>
            <p className="text-xs" style={{ color: "#52525b" }}>
              Application #{id.slice(-8).toUpperCase()} &middot; {new Date(assessment.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full" style={{ background: `${statusInfo.color}15`, color: statusInfo.color, border: `1px solid ${statusInfo.color}25` }}>
            {statusInfo.label}
          </span>
        </div>

        {/* Applicant summary */}
        <div className="flex flex-wrap gap-6 text-sm" style={{ color: "#a1a1aa" }}>
          {assessment.applicant?.name && <span><span style={{ color: "#52525b" }}>Name:</span> {assessment.applicant.name}</span>}
          {assessment.applicant?.age && <span><span style={{ color: "#52525b" }}>Age:</span> {assessment.applicant.age}</span>}
          {assessment.applicant?.occupation && <span><span style={{ color: "#52525b" }}>Occupation:</span> {assessment.applicant.occupation}</span>}
        </div>
      </div>

      {/* ══════════ DECISION CARD (main focus) ══════════ */}
      {r && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: decision.bg, border: `1px solid ${decision.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${decision.color}15` }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={decision.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {decision.icon}
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: decision.color }}>{decision.label}</h2>
              <p className="text-xs" style={{ color: "#71717a" }}>
                {uwAction
                  ? `Reviewed by underwriter · ${new Date(assessment.underwriterAction.actionAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
                  : `AI assessment on your ${assessment.policyType} insurance application`}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>{decisionMessage}</p>
          {!uwAction && (
            <p className="text-[10px] mt-3 px-3 py-1.5 rounded-lg inline-block" style={{ background: "rgba(245,158,11,0.08)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.15)" }}>
              Pending review by underwriter
            </p>
          )}
        </div>
      )}

      {/* ══════════ KEY INFO (always visible) ══════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Policy Type */}
        <div className="glass-card p-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>Policy Type</p>
          <p className="text-lg font-bold capitalize" style={{ color: "#fafafa" }}>{assessment.policyType}</p>
          <p className="text-xs mt-1" style={{ color: "#52525b" }}>Insurance</p>
        </div>

        {/* Status */}
        <div className="glass-card p-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>Application Status</p>
          <p className="text-lg font-bold" style={{ color: statusInfo.color }}>{statusInfo.label}</p>
          <p className="text-xs mt-1" style={{ color: "#52525b" }}>
            {uwAction === "accepted" ? "Policy ready to activate" :
             uwAction === "rejected" ? "See reasons below" :
             uwAction === "modified" ? "Approved with modified premium" :
             uwAction === "info_requested" ? "Action needed from you" :
             "Being reviewed by our underwriting team"}
          </p>
        </div>
      </div>

      {/* ══════════ PREMIUM (only after underwriter approves) ══════════ */}
      {showResults && r?.recommendedPremium && (
        <div className="glass-card p-6 mb-6 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>Your Premium</p>
          <p className="text-3xl font-bold font-mono" style={{ color: policyColor }}>
            ₹{(assessment.underwriterAction?.modifiedPremium?.min || r.recommendedPremium.min)?.toLocaleString("en-IN")}
            <span className="text-lg" style={{ color: "#52525b" }}> – </span>
            ₹{(assessment.underwriterAction?.modifiedPremium?.max || r.recommendedPremium.max)?.toLocaleString("en-IN")}
          </p>
          <p className="text-xs mt-1" style={{ color: "#52525b" }}>per year</p>
        </div>
      )}

      {/* ══════════ EXPLANATION (only after underwriter acts) ══════════ */}
      {showResults && r?.explanation && (
        <div className="glass-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
            </svg>
            <h3 className="text-sm font-bold" style={{ color: "#fafafa" }}>About Your Assessment</h3>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa", whiteSpace: "pre-wrap" }}>
            {r.explanation}
          </p>
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

      {/* ══════════ ADVERSE ACTION REASONS (legally required if declined/referred) ══════════ */}
      {r?.adverseActionReasons?.length > 0 && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.12)" }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: "#f87171" }}>Factors Affecting Your Application</h3>
          <p className="text-xs mb-4" style={{ color: "#71717a" }}>
            As per IRDAI regulations, we are required to inform you of the key factors that influenced this decision.
          </p>
          <div className="space-y-3">
            {r.adverseActionReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold" style={{ background: "rgba(239,68,68,0.1)", color: "#f87171" }}>{i + 1}</div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>{reason.factor}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>{reason.reason}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[10px] mt-4" style={{ color: "#52525b" }}>
            You have the right to request a reconsideration by providing additional information. Contact our support team for assistance.
          </p>
        </div>
      )}

      {/* ══════════ WHAT YOU CAN DO (based on underwriter decision, not AI) ══════════ */}
      <div className="glass-card p-6 mb-6">
        <h3 className="text-sm font-bold mb-4" style={{ color: "#fafafa" }}>What You Can Do</h3>
        <div className="space-y-3">
          {uwAction === "accepted" && (
            <>
              <NextStep icon="check" color="#10b981" title="Proceed to Purchase" desc="Your application is approved. Complete payment to activate your policy." />
              <NextStep icon="doc" color="#60a5fa" title="Download Report" desc="Get a detailed assessment report for your records." link={`/api/assessments/${id}/document`} />
            </>
          )}
          {uwAction === "rejected" && (
            <>
              <NextStep icon="retry" color="#f59e0b" title="Improve & Reapply" desc="Address the factors listed above and submit a new application." link="/applicant/dashboard/assess" />
              <NextStep icon="chat" color="#10b981" title="Talk to Our Assistant" desc="Our assistant can explain what changes would help your next application." />
            </>
          )}
          {uwAction === "info_requested" && (
            <>
              <NextStep icon="upload" color="#60a5fa" title="Upload Requested Documents" desc="Provide the additional documents requested by the underwriting team." link="/applicant/dashboard/profile" />
              <NextStep icon="chat" color="#10b981" title="Ask for Help" desc="Not sure what's needed? Our assistant can clarify." />
            </>
          )}
          {uwAction === "modified" && (
            <>
              <NextStep icon="check" color="#10b981" title="Review Modified Premium" desc="Your application is approved at an adjusted premium. Review the details above." />
              <NextStep icon="doc" color="#60a5fa" title="Download Report" desc="Get your assessment report with the updated premium." link={`/api/assessments/${id}/document`} />
            </>
          )}
          {!uwAction && (
            <>
              <NextStep icon="clock" color="#f59e0b" title="Wait for Review" desc="Your application is being reviewed by our underwriting team. This typically takes 1-2 business days." />
              <NextStep icon="upload" color="#60a5fa" title="Upload Additional Documents" desc="Providing more documents (medical reports, income proof) may speed up the review." link="/applicant/dashboard/profile" />
            </>
          )}
        </div>
      </div>

      {/* ══════════ PRODUCT RECOMMENDATIONS (only after approval) ══════════ */}
      {showResults && r?.recommendations?.length > 0 && (
        <div className="mb-6">
          <ProductRecommendations recommendations={r.recommendations} policyType={assessment.policyType} />
        </div>
      )}

      {/* ══════════ DOCUMENTS ══════════ */}
      {assessment.documents?.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-sm font-bold mb-4" style={{ color: "#fafafa" }}>Your Documents</h3>
          <div className="space-y-2">
            {assessment.documents.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "#fafafa" }}>{doc.name}</p>
                  {doc.docType && <p className="text-[10px] uppercase" style={{ color: "#52525b" }}>{doc.docType}</p>}
                </div>
                {doc.verification?.verdict && (
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{
                    background: doc.verification.verdict === "authentic" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: doc.verification.verdict === "authentic" ? "#10b981" : "#ef4444",
                  }}>
                    {doc.verification.verdict === "authentic" ? "Verified" : "Flagged"}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════ IMPROVEMENT TRACKER (always visible — shows their history) ══════════ */}
      {allAssessments.length > 1 && (
        <div className="mb-6">
          <ImprovementTracker assessments={allAssessments} />
        </div>
      )}

      {/* ══════════ DOWNLOAD REPORT ══════════ */}
      <div className="flex flex-wrap gap-3 mb-8">
        <Link href="/applicant/dashboard/assess" className="no-underline btn-primary inline-flex items-center gap-2 px-5 py-3 text-sm">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Assessment
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
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[icon]}</svg>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: "#71717a" }}>{desc}</p>
      </div>
    </div>
  );

  if (link) {
    return <Link href={link} className="no-underline block" target={link.startsWith("/api") ? "_blank" : undefined}>{content}</Link>;
  }
  return content;
}
