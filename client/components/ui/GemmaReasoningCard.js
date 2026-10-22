"use client";
import { useState, useEffect, useCallback } from "react";

export default function GemmaReasoningCard({ assessmentId, initialReasoning, policyType = "health" }) {
  const [reasoning, setReasoning] = useState(initialReasoning || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview | factors | interactions | checklist
  const [modelStatus, setModelStatus] = useState({ available: true, checked: false });

  // Check model connectivity on mount
  useEffect(() => {
    fetch("/api/reasoning/status")
      .then((r) => r.json())
      .then((d) => setModelStatus({ available: Boolean(d.available), checked: true, details: d }))
      .catch(() => setModelStatus({ available: false, checked: true, details: null }));
  }, []);

  // Fetch or trigger reasoning if missing
  const fetchReasoning = useCallback(async (refresh = false) => {
    if (!assessmentId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}/reasoning`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate reasoning");
      }
      setReasoning(data.reasoning);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [assessmentId]);

  useEffect(() => {
    if (!reasoning && assessmentId) {
      fetchReasoning(false);
    }
  }, [reasoning, assessmentId, fetchReasoning]);

  const isFallback = reasoning?.fallback || !reasoning?.success;

  return (
    <div className="blueprint-card p-6 mt-6 relative overflow-hidden">
      {/* Background ambient blueprint glow */}
      <div
        className="absolute top-0 right-0 w-80 h-80 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, #2563EB, transparent)" }} />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center font-mono font-bold text-xs"
            style={{
              background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(29,78,216,0.1))",
              border: "1px solid rgba(96,165,250,0.4)",
              boxShadow: "0 0 16px rgba(37,99,235,0.3)"
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
              <path d="M8 6a4 4 0 018 0" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
              <rect x="5" y="10" width="14" height="8" rx="2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold tracking-tight text-white">
                Evidence-Based Risk Reasoning
              </h3>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold"
                style={{
                  background: isFallback ? "rgba(245,158,11,0.12)" : "rgba(37,99,235,0.15)",
                  color: isFallback ? "#FBBF24" : "#93C5FD",
                  border: isFallback ? "1px solid rgba(245,158,11,0.3)" : "1px solid rgba(96,165,250,0.3)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isFallback ? "#F59E0B" : "#3B82F6",
                    boxShadow: isFallback ? "none" : "0 0 8px #60A5FA",
                  }}
                />
                {isFallback ? "[FALLBACK: DETERMINISTIC_ENGINE]" : "[LOCAL_LLM: GEMMA 4 E4B]"}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              Explainable actuarial reasoning calibrated against verified applicant telemetry & ensemble outputs.
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => fetchReasoning(true)}
          disabled={loading}
          className="btn-secondary inline-flex items-center gap-2 px-3 py-1.5 text-xs font-mono disabled:opacity-50"
          title="Re-run local Gemma 4 reasoning"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={loading ? "animate-spin text-blue-400" : ""}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {loading ? "SYNTHESIZING..." : "RE-EVALUATE"}
        </button>
      </div>

      {/* Offline/Warning notification if model is unavailable */}
      {modelStatus.checked && !modelStatus.available && (
        <div
          className="mb-4 p-3 rounded-lg flex items-start gap-3 text-xs font-mono"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.25)",
            color: "#FBBF24",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <span className="font-semibold">[WARN.OFFLINE] Local Ollama runtime offline or gemma4:e4b model not responding.</span>
            <p className="text-amber-200/70 mt-0.5 leading-snug">
              To activate full local evidence-based reasoning, start Ollama (<code className="bg-black/40 px-1 py-0.5 rounded text-[11px] text-amber-300">ollama run gemma4:e4b</code>). Safe deterministic fallback engine engaged.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && !reasoning && (
        <div className="py-12 flex flex-col items-center justify-center gap-3">
          <div
            style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(37,99,235,0.2)",
              borderTopColor: "#60A5FA",
              borderRadius: "50%",
              animation: "spin-anim 0.8s linear infinite",
            }}
          />
          <p className="text-xs font-mono text-slate-400">Synthesizing evidence & factor weights with Gemma 4 E4B...</p>
        </div>
      )}

      {/* Error state */}
      {error && !reasoning && (
        <div className="py-6 text-center font-mono">
          <p className="text-xs text-rose-400 mb-3">{error}</p>
          <button
            onClick={() => fetchReasoning(true)}
            className="px-3 py-1.5 rounded-lg text-xs bg-rose-500/10 text-rose-400 border border-rose-500/30"
          >
            Retry Reasoning Engine
          </button>
        </div>
      )}

      {/* Content tabs */}
      {reasoning && (
        <div>
          {/* Navigation tabs */}
          <div className="flex flex-wrap gap-2 mb-4 pb-2" style={{ borderBottom: "1px solid rgba(37,99,235,0.15)" }}>
            {[
              { id: "overview", label: "[01. OVERVIEW]" },
              { id: "factors", label: "[02. FACTOR_WEIGHTS]" },
              { id: "interactions", label: "[03. EVIDENCE_SYNTHESIS]" },
              { id: "checklist", label: "[04. ACTUARIAL_CHECKLIST]" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1.5 rounded text-xs font-mono transition-all duration-150 cursor-pointer"
                style={{
                  background: activeTab === tab.id ? "rgba(37,99,235,0.2)" : "rgba(14,21,38,0.4)",
                  color: activeTab === tab.id ? "#93C5FD" : "#94A3B8",
                  border: activeTab === tab.id ? "1px solid rgba(96,165,250,0.5)" : "1px solid rgba(37,99,235,0.15)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.2)", color: "#E2E8F0" }}
              >
                <p className="whitespace-pre-line text-xs font-mono leading-relaxed">
                  {reasoning.executive_summary || reasoning.concise_dashboard_summary || "No executive summary available."}
                </p>
              </div>

              {/* Verified Facts vs Calculations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                {/* Verified Facts */}
                <div className="p-3.5 rounded-lg" style={{ background: "rgba(14,21,38,0.6)", border: "1px solid rgba(37,99,235,0.18)" }}>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-blue-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                    VERIFIED_FACTS (GROUND_TRUTH)
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                    {(reasoning.verified_facts || []).map((fact, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5">›</span>
                        <span>{typeof fact === "string" ? fact : JSON.stringify(fact)}</span>
                      </li>
                    ))}
                    {(!reasoning.verified_facts || reasoning.verified_facts.length === 0) && (
                      <li className="text-slate-500 italic">No direct verified fact records extracted.</li>
                    )}
                  </ul>
                </div>

                {/* Calculated Results */}
                <div className="p-3.5 rounded-lg" style={{ background: "rgba(14,21,38,0.6)", border: "1px solid rgba(37,99,235,0.18)" }}>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-cyan-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    CALCULATED_METRICS (ACTUARIAL_ML)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div className="p-2 rounded bg-black/40 border border-blue-500/20">
                      <span className="text-[10px] text-slate-400 uppercase block">Risk Score</span>
                      <span className="text-sm font-bold text-white">
                        {reasoning.calculated_results?.riskScore ?? "—"}/100
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-blue-500/20">
                      <span className="text-[10px] text-slate-400 uppercase block">Decision</span>
                      <span className="text-sm font-bold uppercase text-emerald-400">
                        {reasoning.calculated_results?.decision ?? "—"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-blue-500/20">
                      <span className="text-[10px] text-slate-400 uppercase block">Premium Min</span>
                      <span className="text-sm font-bold text-white">
                        ₹{Number(reasoning.calculated_results?.premiumMin || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/40 border border-blue-500/20">
                      <span className="text-[10px] text-slate-400 uppercase block">Confidence</span>
                      <span className="text-sm font-bold text-blue-300">
                        {reasoning.calculated_results?.confidence ?? "—"}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FACTORS & CONTRIBUTIONS */}
          {activeTab === "factors" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-mono text-slate-400 mb-2">
                  Factor contributions derived from tree-ensemble decomposition. Positive contribution raises risk; negative points reduce risk.
                </p>
                {(reasoning.factor_contributions || []).map((fc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-2"
                    style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.18)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white font-mono">{fc.factor}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 font-mono border border-blue-500/20">
                          Val: {fc.value}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded font-mono ${
                            fc.impact === "positive"
                              ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                              : fc.impact === "negative"
                              ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                              : "bg-slate-500/10 text-slate-400 border border-slate-500/30"
                          }`}
                        >
                          {fc.impact}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed font-mono">{fc.reasoning}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Impact</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          Number(fc.contribution_points) <= 0 ? "text-blue-400" : "text-rose-400"
                        }`}
                      >
                        {Number(fc.contribution_points) > 0 ? "+" : ""}
                        {fc.contribution_points} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Influential factors highlights */}
              {reasoning.influential_factors?.length > 0 && (
                <div className="p-3.5 rounded-lg" style={{ background: "rgba(14,21,38,0.6)", border: "1px solid rgba(37,99,235,0.18)" }}>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 font-mono">
                    KEY DRIVERS IDENTIFIED BY GEMMA
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-1 font-mono">
                    {reasoning.influential_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-blue-400">›</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: INTERACTIONS & EVIDENCE */}
          {activeTab === "interactions" && (
            <div className="space-y-4">
              {/* Factor Interactions */}
              <div className="p-4 rounded-lg" style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 mb-2 font-mono">
                  FACTOR INTERACTIONS
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  {reasoning.factor_interactions || "No significant multi-factor interaction anomalies detected."}
                </p>
              </div>

              {/* Supporting Evidence */}
              <div className="p-4 rounded-lg" style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.2)" }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-2 font-mono">
                  SUPPORTING EVIDENCE
                </h4>
                <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
                  {(reasoning.supporting_evidence || []).map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38BDF8" strokeWidth="2" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Information & Uncertainty */}
              <div className="p-4 rounded-lg" style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.25)" }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-rose-400 mb-2 font-mono">
                  TELEMETRY GAPS & UNCERTAINTY
                </h4>
                <ul className="text-xs text-rose-200/90 space-y-1.5 font-mono">
                  {(reasoning.missing_info_and_uncertainty || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-rose-400 font-bold">!</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: UNDERWRITER CHECKLIST */}
          {activeTab === "checklist" && (
            <div className="space-y-3">
              <p className="text-xs font-mono text-slate-400 mb-2">
                Verification checkpoints for actuarial teams prior to issuing or declining coverage:
              </p>
              {(reasoning.underwriter_checks || []).map((check, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-lg flex items-start gap-3"
                  style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.18)" }}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs flex items-center justify-center font-mono font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed font-mono">{check}</p>
                </div>
              ))}
              {(!reasoning.underwriter_checks || reasoning.underwriter_checks.length === 0) && (
                <p className="text-xs font-mono text-slate-500 italic">No specific checks flagged.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
