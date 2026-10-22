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
    <div className="glass-card p-6 mt-6 relative overflow-hidden" style={{ border: "1px solid rgba(16, 185, 129, 0.2)" }}>
      {/* Background ambient glow */}
      <div
        className="absolute top-0 right-0 w-72 h-72 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.08))",
              border: "1px solid rgba(16,185,129,0.3)",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a4 4 0 014 4c0 1.95-1.4 3.58-3.25 3.93" />
              <path d="M8 6a4 4 0 018 0" />
              <path d="M12 18v4" />
              <path d="M8 22h8" />
              <rect x="5" y="10" width="14" height="8" rx="2" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">
                Evidence-Based Risk Reasoning
              </h3>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{
                  background: isFallback ? "rgba(245,158,11,0.12)" : "rgba(16,185,129,0.12)",
                  color: isFallback ? "#fbbf24" : "#34d399",
                  border: isFallback ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(16,185,129,0.25)",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isFallback ? "#f59e0b" : "#10b981",
                    boxShadow: isFallback ? "none" : "0 0 6px #10b981",
                  }}
                />
                {isFallback ? "Deterministic Fallback" : "Gemma 4 E4B Local"}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Explainable AI reasoning grounded in verified applicant facts and ensemble ML outputs
            </p>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={() => fetchReasoning(true)}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer disabled:opacity-50"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "#d4d4d8",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
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
            className={loading ? "animate-spin text-emerald-400" : ""}
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
          </svg>
          {loading ? "Reasoning..." : "Re-evaluate"}
        </button>
      </div>

      {/* Offline/Warning notification if model is unavailable */}
      {modelStatus.checked && !modelStatus.available && (
        <div
          className="mb-4 p-3 rounded-xl flex items-start gap-3 text-xs"
          style={{
            background: "rgba(245, 158, 11, 0.08)",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            color: "#fbbf24",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <span className="font-semibold">Local Ollama runtime is not active or gemma4:e4b is offline.</span>
            <p className="text-amber-200/80 mt-0.5">
              To activate full local evidence-based reasoning, start Ollama on your machine (<code className="bg-black/30 px-1 py-0.5 rounded text-[11px]">ollama run gemma4:e4b</code>). The system is safely using deterministic compliance reasoning.
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
              border: "3px solid rgba(16,185,129,0.15)",
              borderTopColor: "#10b981",
              borderRadius: "50%",
              animation: "spin-anim 0.8s linear infinite",
            }}
          />
          <p className="text-xs text-zinc-400">Synthesizing evidence and computing factor weights with Gemma 4 E4B...</p>
        </div>
      )}

      {/* Error state */}
      {error && !reasoning && (
        <div className="py-6 text-center">
          <p className="text-xs text-red-400 mb-3">{error}</p>
          <button
            onClick={() => fetchReasoning(true)}
            className="px-3 py-1.5 rounded-lg text-xs bg-red-500/10 text-red-400 border border-red-500/20"
          >
            Retry Reasoning
          </button>
        </div>
      )}

      {/* Content tabs */}
      {reasoning && (
        <div>
          {/* Navigation tabs */}
          <div className="flex flex-wrap gap-2 mb-4 border-b border-white/5 pb-2">
            {[
              { id: "overview", label: "Executive Summary" },
              { id: "factors", label: "Factor Contributions" },
              { id: "interactions", label: "Interactions & Evidence" },
              { id: "checklist", label: "Underwriter Checklist" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all duration-150 cursor-pointer"
                style={{
                  background: activeTab === tab.id ? "rgba(16,185,129,0.15)" : "transparent",
                  color: activeTab === tab.id ? "#34d399" : "#71717a",
                  border: activeTab === tab.id ? "1px solid rgba(16,185,129,0.3)" : "1px solid transparent",
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
                className="p-4 rounded-xl text-sm leading-relaxed"
                style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", color: "#d4d4d8" }}
              >
                <p className="whitespace-pre-line">
                  {reasoning.executive_summary || reasoning.concise_dashboard_summary || "No executive summary available."}
                </p>
              </div>

              {/* Verified Facts vs Calculations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                {/* Verified Facts */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Verified Facts (Ground Truth)
                  </div>
                  <ul className="text-xs text-zinc-300 space-y-1.5">
                    {(reasoning.verified_facts || []).map((fact, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-zinc-600 mt-0.5">•</span>
                        <span>{typeof fact === "string" ? fact : JSON.stringify(fact)}</span>
                      </li>
                    ))}
                    {(!reasoning.verified_facts || reasoning.verified_facts.length === 0) && (
                      <li className="text-zinc-500 italic">No direct verified fact records extracted.</li>
                    )}
                  </ul>
                </div>

                {/* Calculated Results */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    Calculated Results (ML & Actuarial)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Risk Score</span>
                      <span className="text-sm font-bold text-white">
                        {reasoning.calculated_results?.riskScore ?? "—"}/100
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Decision</span>
                      <span className="text-sm font-bold uppercase text-emerald-400">
                        {reasoning.calculated_results?.decision ?? "—"}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Premium Min</span>
                      <span className="text-sm font-bold text-white">
                        ₹{Number(reasoning.calculated_results?.premiumMin || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                    <div className="p-2 rounded bg-black/20 border border-white/5">
                      <span className="text-[10px] text-zinc-500 uppercase block">Model Confidence</span>
                      <span className="text-sm font-bold text-white">
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
                <p className="text-xs text-zinc-400 mb-2">
                  Factor contributions derived from tree-ensemble decomposition. Positive contribution points raise risk; negative points reduce risk.
                </p>
                {(reasoning.factor_contributions || []).map((fc, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-2"
                    style={{ background: "rgba(255,255,255,0.015)" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-200">{fc.factor}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-white/5 text-zinc-400 font-mono">
                          Value: {fc.value}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            fc.impact === "positive"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : fc.impact === "negative"
                              ? "bg-red-500/10 text-red-400 border border-red-500/20"
                              : "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20"
                          }`}
                        >
                          {fc.impact}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{fc.reasoning}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-zinc-500 uppercase block">Contribution</span>
                      <span
                        className={`text-sm font-mono font-bold ${
                          Number(fc.contribution_points) <= 0 ? "text-emerald-400" : "text-red-400"
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
                <div className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01]">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
                    Key Drivers Identified by Gemma
                  </h4>
                  <ul className="text-xs text-zinc-300 space-y-1">
                    {reasoning.influential_factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-500">›</span>
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
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-2">
                  Factor Interactions
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {reasoning.factor_interactions || "No significant multi-factor interaction anomalies detected."}
                </p>
              </div>

              {/* Supporting Evidence */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-2">
                  Supporting Evidence
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1.5">
                  {(reasoning.supporting_evidence || []).map((ev, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" className="shrink-0 mt-0.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>{ev}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Missing Information & Uncertainty */}
              <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02]">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
                  Missing Information, Uncertainty & Limitations
                </h4>
                <ul className="text-xs text-zinc-300 space-y-1.5">
                  {(reasoning.missing_info_and_uncertainty || []).map((item, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">!</span>
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
              <p className="text-xs text-zinc-400 mb-2">
                Recommended verification checkpoints for human underwriters prior to issuing or declining coverage:
              </p>
              {(reasoning.underwriter_checks || []).map((check, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-white/5 bg-white/[0.015] flex items-start gap-3"
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-xs text-zinc-200 leading-relaxed">{check}</p>
                </div>
              ))}
              {(!reasoning.underwriter_checks || reasoning.underwriter_checks.length === 0) && (
                <p className="text-xs text-zinc-500 italic">No specific checks flagged.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
