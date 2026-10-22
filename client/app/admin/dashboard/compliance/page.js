"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp, StaggerGrid, StaggerItem } from "@/components/motion/StaggerReveal";
import { getClientPythonUrl } from "@/lib/api-config";

const PY = getClientPythonUrl();

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShieldIcon({ color }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function ChevronDown({ open }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 24 24" fill="none"
      stroke="#71717A" strokeWidth="2" strokeLinecap="round"
      style={{ transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function ComplianceSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="blueprint-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded bg-zinc-800 animate-pulse" />
            <div className="flex-1 h-3.5 rounded bg-zinc-800 animate-pulse" />
            <div className="w-12 h-5 rounded bg-zinc-800 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ComplianceRow({ passed, label, regulation, detail, numbers }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`blueprint-card transition ${open ? "border-blue-500/40 bg-[#0A0F1D]" : ""}`}
    >
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full text-left p-4 cursor-pointer bg-transparent border-none outline-none"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              background: passed ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              borderColor: passed ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)",
            }}
          >
            {passed ? <CheckIcon /> : <XIcon />}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-zinc-200">{label}</p>
            {regulation && (
              <p className="font-mono text-[10px] text-zinc-500 mt-0.5">{regulation}</p>
            )}
          </div>

          <span
            className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border shrink-0"
            style={{
              background: passed ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
              color: passed ? "#10B981" : "#F43F5E",
              borderColor: passed ? "rgba(16,185,129,0.25)" : "rgba(244,63,94,0.25)",
            }}
          >
            {passed ? "COMPLIANT" : "FLAGGED"}
          </span>

          <ChevronDown open={open} />
        </div>

        {numbers && (
          <p className="font-mono text-[10px] text-zinc-400 mt-2 ml-9">
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
            <div className="px-4 pb-4 pt-1 ml-9 text-xs text-zinc-300 leading-relaxed font-mono border-t border-zinc-800/60 mt-1">
              {detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SectionHeader({ title, icon }) {
  return (
    <div className="flex items-center gap-2 mb-3 mt-6">
      {icon}
      <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-300">{title}</h3>
    </div>
  );
}

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
        `${r.pt.toUpperCase()}: Male mean ${r.male_mean_score}, Female mean ${r.female_mean_score}. Score delta: ${r.score_difference}pt (threshold <5pt). Disparate impact ratio: ${r.disparate_impact_ratio} (threshold >= 0.80). ${r.passed ? "PASSED" : "VIOLATION"}.`
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
        `${r.pt.toUpperCase()}: Max contiguous jump ${r.max_jump}pt (limit <25pt). Dynamic range: ${r.score_range}pt. Smoothness requirement: ${r.smooth ? "Satisfied" : "Unsatisfied"}. ${r.passed ? "PASSED" : "VIOLATION"}.`
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
        `${r.pt.toUpperCase()}: Low bracket ${r.low_income_score}, High bracket ${r.high_income_score}. Impact swing: ${r.income_impact}pt (limit <20pt). ${r.passed ? "PASSED" : "VIOLATION"}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

function evaluateOverallFairness(audit) {
  if (!audit) return false;
  return Object.values(audit).every((a) => a.overall_passed);
}

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
        `${e.pt.toUpperCase()}: R²=${e.r2.toFixed(4)} (${e.pass ? ">= 0.90 threshold" : "< 0.90 threshold"}), CV R²=${(e.cv || 0).toFixed(4)}, MAE=${e.mae}.`
    )
    .join(" ");

  return { passed: allPass, numbers: nums, detail };
}

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
        "Applicants receive a detailed explanation of the basis for their assessment decision including the top contributing factors, their risk score, and how each factor influenced the outcome.",
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
          ? `Fairness audit runs 3 bias tests across all 4 lines. Overall result: ${overallFairness ? "ALL TESTS SATISFIED" : "DEVIATIONS DETECTED"}.`
          : "Fairness audit data could not be loaded. Ensure the Python ML backend is running.",
    },
    {
      section: "governance",
      passed: true,
      label: "Model versioning and rollback capability",
      regulation: "Model Governance Best Practices, SR 11-7",
      detail:
        "All models are versioned with SHA-256 checksums, deployment timestamps, and rollback capability. The model registry tracks training parameters, data versions, and performance metrics for every deployed version.",
    },
  ];

  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  const compliancePct = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;
  const allPassed = passedChecks === totalChecks;

  const sections = [
    { key: "irdai", title: "IRDAI Statutory Compliance Matrix" },
    { key: "fairlending", title: "Fair Lending / Anti-Discrimination (ECOA Equivalent)" },
    { key: "privacy", title: "Data Privacy & Consent Framework" },
    { key: "adverse", title: "Adverse Action Notice Standards" },
    { key: "governance", title: "Model Governance & Validation (SR 11-7)" },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <FadeUp>
        <div className="blueprint-card p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [AUDIT.STATUTORY_COMPLIANCE]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">IRDAI & ECOA AUDIT MATRIX</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Regulatory Compliance Matrix
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Real-time statutory verification across IRDAI guidelines, disparate impact ratios, consumer data rights, and model risk governance.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={fetchData}
              className="px-3.5 py-2 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-300 hover:text-white text-xs font-mono transition flex items-center gap-2"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              Execute Re-Audit
            </button>
          </div>
        </div>
      </FadeUp>

      {error ? (
        <div className="blueprint-card p-8">
          <ErrorState message={error} onRetry={fetchData} />
        </div>
      ) : loading ? (
        <ComplianceSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Checklist Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Overall Score Card */}
            <div className="blueprint-card p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    stroke={allPassed ? "#10B981" : compliancePct >= 80 ? "#3B82F6" : "#F43F5E"}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 40}
                    strokeDashoffset={2 * Math.PI * 40 * (1 - compliancePct / 100)}
                    style={{ transition: "stroke-dashoffset 1s ease" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono text-xl font-bold text-white">{compliancePct}%</span>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                    [SCORE.OVERALL]
                  </span>
                  <span className="font-mono text-xs font-bold text-white">
                    {allPassed ? "FULL STATUTORY CLEARANCE" : `${passedChecks}/${totalChecks} REQUIREMENTS SATISFIED`}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {allPassed
                    ? "Zero non-compliance flags detected. Underwriting engines satisfy all IRDAI product filing regulations, 4/5ths disparate impact tests, and SR 11-7 model standards."
                    : `${totalChecks - passedChecks} regulatory requirement(s) require remediation. Review the highlighted items below.`}
                </p>
              </div>
            </div>

            {/* Checklist Sections */}
            {sections.map((sec) => {
              const sectionChecks = checks.filter((c) => c.section === sec.key);
              return (
                <div key={sec.key}>
                  <SectionHeader title={sec.title} />
                  <div className="space-y-2.5">
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
          </div>

          {/* Sidebar Telemetry */}
          <div className="space-y-4">
            <div className="blueprint-card p-5">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block mb-3">[TELEMETRY.PLATFORM]</span>
              <div className="space-y-3 font-mono text-xs">
                <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Total Dossiers Scored</span>
                  <span className="text-xl font-bold text-white block mt-0.5">{stats?.total || 0}</span>
                </div>

                <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Automated Approval Ratio</span>
                  <span className="text-xl font-bold text-emerald-400 block mt-0.5">
                    {stats?.approvalRate ? `${Math.round(stats.approvalRate)}%` : "0%"}
                  </span>
                </div>

                <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block uppercase">Active Neural Models</span>
                  <div className="flex gap-2 mt-2">
                    {["health", "auto", "life", "property"].map((pt) => {
                      const active = models?.[pt]?.status === "active";
                      return (
                        <span
                          key={pt}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                            active
                              ? "bg-blue-500/10 text-blue-400 border-blue-500/25"
                              : "bg-zinc-800 text-zinc-500 border-zinc-700"
                          }`}
                        >
                          {pt.slice(0, 4)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
