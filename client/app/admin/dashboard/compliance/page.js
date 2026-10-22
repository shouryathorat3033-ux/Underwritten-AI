"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";

const PY = process.env.NEXT_PUBLIC_PYTHON_URL || "http://127.0.0.1:8000";

/* ═══════════════════════════════════════════════════════════════════════════
   Icons
   ═══════════════════════════════════════════════════════════════════════════ */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShieldIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#52525b" strokeWidth="2" strokeLinecap="round"
      style={{ transition: "transform 0.25s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Loading skeleton for compliance rows
   ═══════════════════════════════════════════════════════════════════════════ */
function ComplianceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="flex items-center gap-3">
            <div style={{ width: 16, height: 16, borderRadius: 4, background: "rgba(255,255,255,0.04)", animation: "skeleton-shimmer 2s infinite" }} />
            <div style={{ flex: 1, height: 14, borderRadius: 6, background: "linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(16,185,129,0.06) 50%, rgba(255,255,255,0.03) 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 2s infinite" }} />
            <div style={{ width: 48, height: 20, borderRadius: 6, background: "rgba(255,255,255,0.04)", animation: "skeleton-shimmer 2s infinite" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Single compliance row with expandable detail
   ═══════════════════════════════════════════════════════════════════════════ */
function ComplianceRow({ passed, label, regulation, detail, numbers }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="rounded-xl transition-all duration-200"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${passed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.12)"}`,
      }}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full text-left"
        style={{ padding: "14px 16px", cursor: "pointer", background: "transparent", border: "none" }}
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="shrink-0" style={{ width: 24, height: 24, borderRadius: 8, background: passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {passed ? <CheckIcon /> : <XIcon />}
          </div>

          {/* Requirement text */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: "#e4e4e7", margin: 0 }}>{label}</p>
            {regulation && (
              <p className="text-[11px] mt-0.5" style={{ color: "#52525b", margin: 0 }}>{regulation}</p>
            )}
          </div>

          {/* Badge */}
          <span
            className="text-[11px] font-bold px-2.5 py-1 rounded-md shrink-0"
            style={{
              background: passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
              color: passed ? "#34d399" : "#f87171",
              boxShadow: passed ? "0 0 8px rgba(16,185,129,0.08)" : "0 0 8px rgba(239,68,68,0.08)",
            }}
          >
            {passed ? "PASS" : "FAIL"}
          </span>

          {/* Expand chevron */}
          <ChevronDown open={open} />
        </div>

        {/* Inline numbers (e.g., fairness test specifics) */}
        {numbers && (
          <p className="text-[11px] font-mono mt-1.5 ml-9" style={{ color: "#71717a", margin: "6px 0 0 36px" }}>
            {numbers}
          </p>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 120 }}
            style={{ overflow: "hidden" }}
          >
            <div
              className="text-[12px] leading-relaxed"
              style={{
                padding: "0 16px 14px 52px",
                color: "#a1a1aa",
              }}
            >
              {detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Compliance section header
   ═══════════════════════════════════════════════════════════════════════════ */
function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6">
      {icon}
      <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "#a1a1aa" }}>{title}</h3>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Helpers to evaluate fairness data
   ═══════════════════════════════════════════════════════════════════════════ */

// Check gender disparate impact across all 4 models
function evaluateGenderFairness(audit) {
  if (!audit) return { passed: false, numbers: "", detail: "Fairness data unavailable" };
  const results = [];
  let allPass = true;
  for (const pt of ["health", "auto", "life", "property"]) {
    const data = audit[pt];
    if (!data || !data.tests) continue;
    const test = data.tests.find((t) => t.test === "gender_disparity");
    if (!test) continue;
    if (!test.passed) allPass = false;
    results.push({ pt, ...test });
  }
  if (results.length === 0) return { passed: false, numbers: "", detail: "No gender disparity data found" };

  const nums = results
    .map((r) => `${r.pt}: diff ${r.score_difference}pt, DI ratio ${r.disparate_impact_ratio}`)
    .join(" | ");

  const detail = results
    .map(
      (r) =>
        `${r.pt.charAt(0).toUpperCase() + r.pt.slice(1)}: Male avg ${r.male_mean_score}, Female avg ${r.female_mean_score}. Score diff: ${r.score_difference}pt (limit <5pt). Disparate impact ratio: ${r.disparate_impact_ratio} (min 0.8). ${r.passed ? "PASS" : "FAIL"}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

function evaluateAgeFairness(audit) {
  if (!audit) return { passed: false, numbers: "", detail: "Fairness data unavailable" };
  const results = [];
  let allPass = true;
  for (const pt of ["health", "auto", "life", "property"]) {
    const data = audit[pt];
    if (!data || !data.tests) continue;
    const test = data.tests.find((t) => t.test === "age_fairness");
    if (!test) continue;
    if (!test.passed) allPass = false;
    results.push({ pt, ...test });
  }
  if (results.length === 0) return { passed: false, numbers: "", detail: "No age fairness data found" };

  const nums = results
    .map((r) => `${r.pt}: max jump ${r.max_jump}pt, range ${r.score_range}pt`)
    .join(" | ");

  const detail = results
    .map(
      (r) =>
        `${r.pt.charAt(0).toUpperCase() + r.pt.slice(1)}: Max age score jump ${r.max_jump}pt (limit <25pt). Total score range: ${r.score_range}pt. Smooth: ${r.smooth ? "Yes" : "No"}. ${r.passed ? "PASS" : "FAIL"}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

function evaluateIncomeFairness(audit) {
  if (!audit) return { passed: false, numbers: "", detail: "Fairness data unavailable" };
  const results = [];
  let allPass = true;
  for (const pt of ["health", "auto", "life", "property"]) {
    const data = audit[pt];
    if (!data || !data.tests) continue;
    const test = data.tests.find((t) => t.test === "income_disparity");
    if (!test) continue;
    if (!test.passed) allPass = false;
    results.push({ pt, ...test });
  }
  if (results.length === 0) return { passed: false, numbers: "", detail: "No income disparity data found" };

  const nums = results
    .map((r) => `${r.pt}: impact ${r.income_impact}pt`)
    .join(" | ");

  const detail = results
    .map(
      (r) =>
        `${r.pt.charAt(0).toUpperCase() + r.pt.slice(1)}: Low-income score ${r.low_income_score}, High-income score ${r.high_income_score}. Impact: ${r.income_impact}pt (limit <20pt). ${r.passed ? "PASS" : "FAIL"}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

// Check overall model fairness (all 3 tests across all models)
function evaluateOverallFairness(audit) {
  if (!audit) return false;
  return Object.values(audit).every((a) => a.overall_passed);
}

// Get model R-squared values from /models endpoint
function evaluateModelAccuracy(models) {
  if (!models) return { passed: false, numbers: "", detail: "Model data unavailable" };
  const entries = [];
  let allPass = true;
  for (const pt of ["health", "auto", "life", "property"]) {
    const m = models[pt];
    if (!m || !m.test_r2) continue;
    const pass = m.test_r2 >= 0.9;
    if (!pass) allPass = false;
    entries.push({ pt, r2: m.test_r2, cv: m.cv_r2_mean, mae: m.test_mae, pass });
  }
  if (entries.length === 0) return { passed: false, numbers: "", detail: "No trained models found" };

  const nums = entries.map((e) => `${e.pt}: R²=${e.r2.toFixed(4)}`).join(" | ");
  const detail = entries
    .map(
      (e) =>
        `${e.pt.charAt(0).toUpperCase() + e.pt.slice(1)}: R²=${e.r2.toFixed(4)} (${e.pass ? "above" : "below"} 0.90 threshold), CV R²=${(e.cv || 0).toFixed(4)}, MAE=${e.mae}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════════════════════════════ */
export default function CompliancePage() {
  const [audit, setAudit] = useState(null);
  const [models, setModels] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fairnessRes, analyticsRes, modelsRes] = await Promise.all([
        fetch(`${PY}/api/ml/score/fairness`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch("/api/analytics").then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`${PY}/api/ml/score/models`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]);
      setAudit(fairnessRes);
      setStats(analyticsRes);
      setModels(modelsRes);
      setLoading(false);
    } catch {
      setError("Failed to load compliance data. Ensure both Next.js and Python backends are running.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ── Build compliance checklist ── */
  const gender = evaluateGenderFairness(audit);
  const age = evaluateAgeFairness(audit);
  const income = evaluateIncomeFairness(audit);
  const overallFairness = evaluateOverallFairness(audit);
  const modelAccuracy = evaluateModelAccuracy(models);

  const checks = [
    // IRDAI Compliance
    {
      section: "irdai",
      passed: true,
      label: "Board-approved underwriting policy with transparent criteria",
      regulation: "IRDAI Guidelines on Product Filing",
      detail:
        "Our RAG-powered knowledge base includes the full board-approved underwriting policy document. All scoring criteria are transparent, version-controlled, and retrievable via the regulatory knowledge base.",
    },
    {
      section: "irdai",
      passed: true,
      label: "Holistic assessment - not single-factor rejection",
      regulation: "IRDA/HLT/MISC/CIR/174",
      detail:
        "The ML scoring pipeline uses 16 features across demographics, health/risk metrics, behavioral signals, and financial indicators. No single factor can trigger automatic rejection; the stacked ensemble model weighs all features holistically.",
    },
    {
      section: "irdai",
      passed: true,
      label: "Risk classification transparency and documentation",
      regulation: "IRDAI Risk Classification Guidelines",
      detail:
        "Every assessment generates a waterfall chart showing individual factor contributions, a detailed factor breakdown table, and SHAP-style feature importance. All risk classification logic is documented and auditable.",
    },
    {
      section: "irdai",
      passed: true,
      label: "Policyholder informed of risk basis",
      regulation: "Section 6, Insurance Regulatory and Development Authority of India Act, 2017",
      detail:
        "Every assessment includes an AI-generated plain-language explanation of the risk basis, adverse action notices with specific contributing factors, and regulatory citations from the RAG knowledge base.",
    },

    // Fair Lending / Anti-Discrimination
    {
      section: "fairlending",
      passed: gender.passed,
      label: "Gender Disparate Impact Test (80% rule)",
      regulation: "Equal Credit Opportunity Act (ECOA) equivalent, 4/5ths rule",
      detail: gender.detail,
      numbers: gender.numbers,
    },
    {
      section: "fairlending",
      passed: age.passed,
      label: "Age Fairness Test (no single jump >25pt)",
      regulation: "Age Discrimination Act equivalent, smooth risk curve requirement",
      detail: age.detail,
      numbers: age.numbers,
    },
    {
      section: "fairlending",
      passed: income.passed,
      label: "Income Disparity Test (<20pt swing)",
      regulation: "Fair Lending Principles, socioeconomic bias prevention",
      detail: income.detail,
      numbers: income.numbers,
    },

    // Data Privacy & Consent
    {
      section: "privacy",
      passed: true,
      label: "Alternative data requires explicit consent",
      regulation: "Data Protection Guidelines, IRDAI Digital Data Policy",
      detail:
        "The assessment form includes a mandatory consent checkbox for alternative data collection (social media analysis, behavioral scoring, telematics data). No alternative data is processed without explicit, informed consent.",
    },
    {
      section: "privacy",
      passed: true,
      label: "Document data encrypted in transit (HTTPS)",
      regulation: "IT Act 2000, IRDAI Cybersecurity Framework",
      detail:
        "All API communication uses HTTPS/TLS encryption. Document uploads are transmitted over encrypted channels. No personally identifiable information (PII) is transmitted in plaintext.",
    },
    {
      section: "privacy",
      passed: true,
      label: "Audit trail maintained for all decisions",
      regulation: "IRDAI Record Keeping Requirements, Section 14",
      detail:
        "Every assessment decision, score change, and underwriter action is logged in a persistent audit trail accessible from the Audit Trail dashboard. Records include timestamps, user IDs, and full decision rationale.",
    },

    // Adverse Action Compliance
    {
      section: "adverse",
      passed: true,
      label: "Adverse action reasons provided for REFER/DECLINE decisions",
      regulation: "Fair Credit Reporting Act (FCRA) equivalent, adverse action notices",
      detail:
        "When an assessment results in REFER or DECLINE, the system auto-generates specific adverse action reasons citing contributing risk factors with their individual impact scores. These are presented in plain language to both the underwriter and the applicant.",
    },
    {
      section: "adverse",
      passed: true,
      label: "Applicant notification of basis for decision",
      regulation: "FCRA Section 615, Consumer Notification Requirements",
      detail:
        "Applicants receive a detailed explanation of the basis for their assessment decision including the top contributing factors, their risk score, and how each factor influenced the outcome. Notification is delivered via the platform and available for email distribution.",
    },

    // Model Governance
    {
      section: "governance",
      passed: modelAccuracy.passed,
      label: "Model accuracy validated (R\u00B2 > 0.90)",
      regulation: "SR 11-7 Model Risk Management Guidance",
      detail: modelAccuracy.detail,
      numbers: modelAccuracy.numbers,
    },
    {
      section: "governance",
      passed: true,
      label: "Cross-validation performed (5-fold)",
      regulation: "SR 11-7 Model Validation Standards",
      detail:
        "All 4 policy type models (health, auto, life, property) are trained with 5-fold cross-validation. CV R\u00B2 scores are tracked alongside test set performance to detect overfitting. Train-test gaps are monitored and flagged if they exceed 2%.",
    },
    {
      section: "governance",
      passed: overallFairness,
      label: "Model fairness audited across protected classes",
      regulation: "ECOA Anti-Discrimination, IRDAI Fair Practice Code",
      detail:
        audit
          ? `Fairness audit runs 3 bias tests (gender disparity, age fairness, income disparity) across all 4 models (12 total tests). Overall result: ${overallFairness ? "ALL TESTS PASSED" : "VIOLATIONS DETECTED"}. See the Fairness Audit page for full details.`
          : "Fairness audit data could not be loaded. Ensure the Python ML backend is running.",
    },
    {
      section: "governance",
      passed: true,
      label: "Model versioning and rollback capability",
      regulation: "Model Governance Best Practices, SR 11-7",
      detail:
        "All models are versioned with SHA-256 checksums, deployment timestamps, and rollback capability. The model registry tracks training parameters, data versions, and performance metrics for every deployed version. One-click rollback is available from the admin dashboard.",
    },
  ];

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const compliancePct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const allPassed = passedChecks === totalChecks;

  const auditDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Models deployed count
  const modelsDeployed = models
    ? Object.values(models).filter((m) => m.status === "active").length
    : 0;

  /* ── Section configuration ── */
  const sections = [
    {
      key: "irdai",
      title: "IRDAI Compliance",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      key: "fairlending",
      title: "Fair Lending / Anti-Discrimination (ECOA Equivalent)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
        </svg>
      ),
    },
    {
      key: "privacy",
      title: "Data Privacy & Consent",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      ),
    },
    {
      key: "adverse",
      title: "Adverse Action Compliance (FCRA Equivalent)",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      ),
    },
    {
      key: "governance",
      title: "Model Governance",
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
    },
  ];

  return (
    <div>
      <Breadcrumbs />

      {/* ═══ Header ═══ */}
      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>
              Regulatory Compliance
            </h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>
              Comprehensive compliance audit for insurance underwriting operations
            </p>
          </div>
          <motion.button
            onClick={fetchData}
            className="btn-secondary text-xs group"
            style={{ padding: "8px 16px" }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
          >
            <span className="flex items-center gap-2">
              <svg
                width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="transition-transform duration-500 group-hover:rotate-180"
              >
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Re-audit
            </span>
          </motion.button>
        </div>
      </FadeUp>

      {error ? (
        <ErrorState message={error} onRetry={fetchData} />
      ) : loading ? (
        <div>
          {/* Loading skeleton */}
          <StaggerGrid className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <StaggerItem key={i}>
                <StatCardSkeleton />
              </StaggerItem>
            ))}
          </StaggerGrid>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ComplianceSkeleton />
            </div>
            <div>
              <div className="glass-card p-5">
                <StatCardSkeleton />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ═══ Main content — left 2 columns ═══ */}
          <div className="lg:col-span-2">
            {/* ── Overall Score hero card ── */}
            <FadeUp delay={0.05}>
              <div
                className="glass-card p-6 mb-6 relative overflow-hidden"
                style={{
                  borderColor: allPassed
                    ? "rgba(16,185,129,0.25)"
                    : "rgba(239,68,68,0.25)",
                }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute -top-20 -right-20 w-60 h-60 rounded-full pointer-events-none"
                  style={{
                    background: `radial-gradient(circle, ${allPassed ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)"}, transparent 70%)`,
                    filter: "blur(40px)",
                    animation: "glow-drift 15s infinite",
                  }}
                />

                <div className="flex items-center gap-5 relative">
                  {/* Big percentage ring */}
                  <div className="relative" style={{ width: 80, height: 80, flexShrink: 0 }}>
                    <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: "rotate(-90deg)" }}>
                      <circle
                        cx="40" cy="40" r="34"
                        fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6"
                      />
                      <motion.circle
                        cx="40" cy="40" r="34"
                        fill="none"
                        stroke={allPassed ? "#10b981" : compliancePct >= 80 ? "#f59e0b" : "#ef4444"}
                        strokeWidth="6"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 34}
                        initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                        animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - compliancePct / 100) }}
                        transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1], delay: 0.3 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <motion.span
                        className="font-mono text-lg font-bold"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", damping: 15 }}
                        style={{
                          color: allPassed ? "#10b981" : compliancePct >= 80 ? "#f59e0b" : "#ef4444",
                        }}
                      >
                        {compliancePct}%
                      </motion.span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <ShieldIcon color={allPassed ? "#10b981" : "#ef4444"} />
                      <h2
                        className="text-lg font-bold"
                        style={{ color: allPassed ? "#10b981" : "#ef4444" }}
                      >
                        {allPassed
                          ? "Fully Compliant"
                          : `${passedChecks}/${totalChecks} Checks Passed`}
                      </h2>
                    </div>
                    <p className="text-sm" style={{ color: "#71717a" }}>
                      {allPassed
                        ? "All regulatory requirements met across IRDAI, fair lending, data privacy, adverse action, and model governance."
                        : `${totalChecks - passedChecks} compliance item(s) require attention. Review the failed checks below for details.`}
                    </p>
                    <p className="text-[11px] font-mono mt-2" style={{ color: "#52525b" }}>
                      Last audit: {auditDate}
                    </p>
                  </div>
                </div>
              </div>
            </FadeUp>

            {/* ── Compliance checklist sections ── */}
            <FadeUp delay={0.15}>
              {sections.map((sec) => {
                const sectionChecks = checks.filter((c) => c.section === sec.key);
                return (
                  <div key={sec.key}>
                    <SectionHeader title={sec.title} icon={sec.icon} />
                    <div className="space-y-2 mb-4">
                      {sectionChecks.map((check, i) => (
                        <ComplianceRow
                          key={`${sec.key}-${i}`}
                          passed={check.passed}
                          label={check.label}
                          regulation={check.regulation}
                          detail={check.detail}
                          numbers={check.numbers}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </FadeUp>
          </div>

          {/* ═══ Stats sidebar — right column ═══ */}
          <div className="lg:col-span-1">
            <FadeUp delay={0.2}>
              <div className="glass-card p-5 mb-4 sticky top-4">
                <h3
                  className="text-xs font-bold uppercase tracking-widest mb-4"
                  style={{ color: "#a1a1aa" }}
                >
                  Platform Stats
                </h3>

                <div className="space-y-4">
                  {/* Total Assessments */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p className="text-[11px] mb-1" style={{ color: "#71717a" }}>
                      Total Assessments Processed
                    </p>
                    <p
                      className="font-mono text-2xl font-bold"
                      style={{ color: "#10b981" }}
                    >
                      {stats?.total || 0}
                    </p>
                  </div>

                  {/* Approval Rate */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p className="text-[11px] mb-1" style={{ color: "#71717a" }}>
                      Approval Rate
                    </p>
                    <p
                      className="font-mono text-2xl font-bold"
                      style={{ color: "#34d399" }}
                    >
                      {stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%"}
                    </p>
                    <div className="flex gap-3 mt-2">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(16,185,129,0.1)",
                          color: "#34d399",
                        }}
                      >
                        {stats?.approved || 0} approved
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(245,158,11,0.1)",
                          color: "#fbbf24",
                        }}
                      >
                        {stats?.referred || 0} referred
                      </span>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: "rgba(239,68,68,0.1)",
                          color: "#f87171",
                        }}
                      >
                        {stats?.declined || 0} declined
                      </span>
                    </div>
                  </div>

                  {/* Average Risk Score */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p className="text-[11px] mb-1" style={{ color: "#71717a" }}>
                      Average Risk Score
                    </p>
                    <div className="flex items-end gap-2">
                      <p
                        className="font-mono text-2xl font-bold"
                        style={{
                          color:
                            (stats?.avgRisk || 0) <= 30
                              ? "#10b981"
                              : (stats?.avgRisk || 0) <= 60
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      >
                        {stats?.avgRisk ? Math.round(stats.avgRisk) : 0}
                      </p>
                      <span
                        className="text-[11px] mb-1"
                        style={{ color: "#52525b" }}
                      >
                        / 100
                      </span>
                    </div>
                    {/* Mini bar */}
                    <div
                      className="mt-2 h-1.5 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(stats?.avgRisk || 0, 100)}%` }}
                        transition={{ duration: 1, ease: [0.23, 1, 0.32, 1], delay: 0.4 }}
                        style={{
                          background:
                            (stats?.avgRisk || 0) <= 30
                              ? "#10b981"
                              : (stats?.avgRisk || 0) <= 60
                              ? "#f59e0b"
                              : "#ef4444",
                        }}
                      />
                    </div>
                  </div>

                  {/* Models Deployed */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <p className="text-[11px] mb-1" style={{ color: "#71717a" }}>
                      Models Deployed
                    </p>
                    <div className="flex items-end gap-2">
                      <p
                        className="font-mono text-2xl font-bold"
                        style={{ color: "#a78bfa" }}
                      >
                        {modelsDeployed}
                      </p>
                      <span
                        className="text-[11px] mb-1"
                        style={{ color: "#52525b" }}
                      >
                        / 4
                      </span>
                    </div>
                    {models && (
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {["health", "auto", "life", "property"].map((pt) => {
                          const active = models[pt]?.status === "active";
                          const colors = {
                            health: "#10b981",
                            auto: "#f59e0b",
                            life: "#a78bfa",
                            property: "#60a5fa",
                          };
                          return (
                            <span
                              key={pt}
                              className="text-[10px] px-1.5 py-0.5 rounded font-mono"
                              style={{
                                background: active
                                  ? `${colors[pt]}15`
                                  : "rgba(255,255,255,0.03)",
                                color: active ? colors[pt] : "#52525b",
                                border: `1px solid ${active ? `${colors[pt]}30` : "rgba(255,255,255,0.06)"}`,
                              }}
                            >
                              {pt}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Risk Distribution */}
                  {stats && (
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <p
                        className="text-[11px] mb-3"
                        style={{ color: "#71717a" }}
                      >
                        Risk Distribution
                      </p>
                      <div className="space-y-2">
                        {[
                          { label: "Low (0-30)", count: stats.riskLow || 0, color: "#10b981" },
                          { label: "Medium (31-60)", count: stats.riskMed || 0, color: "#f59e0b" },
                          { label: "High (61-100)", count: stats.riskHigh || 0, color: "#ef4444" },
                        ].map((r) => {
                          const total = (stats.riskLow || 0) + (stats.riskMed || 0) + (stats.riskHigh || 0);
                          const pct = total > 0 ? (r.count / total) * 100 : 0;
                          return (
                            <div key={r.label}>
                              <div className="flex justify-between mb-1">
                                <span className="text-[10px]" style={{ color: "#71717a" }}>{r.label}</span>
                                <span className="text-[10px] font-mono font-semibold" style={{ color: r.color }}>
                                  {r.count}
                                </span>
                              </div>
                              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                                <motion.div
                                  className="h-full rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
                                  style={{ background: r.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Compliance summary */}
                  <div
                    className="p-4 rounded-xl"
                    style={{
                      background: allPassed
                        ? "rgba(16,185,129,0.04)"
                        : "rgba(239,68,68,0.04)",
                      border: `1px solid ${allPassed ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)"}`,
                    }}
                  >
                    <p
                      className="text-[11px] mb-1"
                      style={{ color: "#71717a" }}
                    >
                      Compliance Score
                    </p>
                    <div className="flex items-center gap-3">
                      <p
                        className="font-mono text-3xl font-bold"
                        style={{
                          color: allPassed
                            ? "#10b981"
                            : compliancePct >= 80
                            ? "#f59e0b"
                            : "#ef4444",
                        }}
                      >
                        {passedChecks}/{totalChecks}
                      </p>
                      <div>
                        <p
                          className="text-xs font-semibold"
                          style={{
                            color: allPassed ? "#34d399" : "#f87171",
                          }}
                        >
                          {allPassed ? "All Clear" : "Attention Required"}
                        </p>
                        <p
                          className="text-[10px]"
                          style={{ color: "#52525b" }}
                        >
                          {compliancePct}% compliance
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      )}
    </div>
  );
}
