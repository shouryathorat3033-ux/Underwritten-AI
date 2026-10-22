"use client";
import { useState } from "react";

/**
 * RAG Citations — Shows regulatory sources and similar past cases
 * that grounded the AI's decision. Displays as an accordion.
 */
export default function RAGCitations({ regulatoryCitations = [], adverseActionReasons = [], policyType, assessmentId }) {
  const [expandedReg, setExpandedReg] = useState(false);
  const [similarCases, setSimilarCases] = useState(null);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  const hasCitations = regulatoryCitations.length > 0;
  const hasAdverse = adverseActionReasons.length > 0;
  const showSection = hasCitations || hasAdverse;

  const fetchSimilarCases = async () => {
    if (similarCases || loadingSimilar) return;
    setLoadingSimilar(true);
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`);
      if (!res.ok) return;
      const { assessment } = await res.json();
      const pyUrl = process.env.NEXT_PUBLIC_PYTHON_URL || "http://127.0.0.1:8000";
      const ragRes = await fetch(`${pyUrl}/api/rag/similar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: { applicant: assessment.applicant, traditionalData: assessment.traditionalData },
          policyType: assessment.policyType || policyType,
          limit: 4,
          excludeId: assessmentId,
        }),
      });
      if (ragRes.ok) {
        const data = await ragRes.json();
        setSimilarCases(data.cases || []);
      }
    } catch { /* silent */ }
    setLoadingSimilar(false);
  };

  const decisionColor = (d) => d === "approve" ? "#10b981" : d === "refer" ? "#f59e0b" : d === "decline" ? "#ef4444" : "#71717a";
  const scoreColor = (s) => s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";

  return (
    <div className="space-y-4">
      {/* ══════ Regulatory Citations Accordion ══════ */}
      {showSection && (
        <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(167,139,250,0.12)", background: "rgba(167,139,250,0.03)" }}>
          <button
            onClick={() => setExpandedReg(!expandedReg)}
            className="w-full flex items-center justify-between px-5 py-3.5 text-left"
            style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
          >
            <span className="flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#a78bfa" }}>
                Regulatory Sources & Compliance
              </span>
              {hasCitations && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(167,139,250,0.1)", color: "#a78bfa" }}>
                  {regulatoryCitations.length} citation{regulatoryCitations.length > 1 ? "s" : ""}
                </span>
              )}
            </span>
            <svg
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"
              style={{ transform: expandedReg ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>

          {expandedReg && (
            <div className="px-5 pb-5 space-y-3" style={{ borderTop: "1px solid rgba(167,139,250,0.08)" }}>
              {/* Regulatory citations */}
              {hasCitations && (
                <div className="pt-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#71717a" }}>
                    IRDAI Regulations Applied
                  </p>
                  {regulatoryCitations.map((c, i) => (
                    <div key={i} className="mb-3 rounded-xl px-4 py-3" style={{ background: "rgba(167,139,250,0.04)", border: "1px solid rgba(167,139,250,0.08)" }}>
                      <div className="flex items-start gap-2 mb-1">
                        <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded shrink-0" style={{ background: "rgba(167,139,250,0.12)", color: "#a78bfa" }}>
                          [{i + 1}]
                        </span>
                        <p className="text-[11px] font-semibold" style={{ color: "#c4b5fd" }}>{c.source}</p>
                      </div>
                      <p className="text-[11px] leading-relaxed ml-7" style={{ color: "#71717a" }}>{c.text}</p>
                      {c.relevance && (
                        <div className="ml-7 mt-1.5">
                          <div className="inline-flex items-center gap-1.5">
                            <div className="h-1 rounded-full" style={{ width: `${Math.round(c.relevance * 100)}%`, maxWidth: 60, background: "#a78bfa" }} />
                            <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>{Math.round(c.relevance * 100)}% match</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Adverse action reasons with compliance context */}
              {hasAdverse && (
                <div className="pt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style={{ color: "#71717a" }}>
                    Adverse Action Factors
                  </p>
                  <div className="space-y-2">
                    {adverseActionReasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.08)" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" className="shrink-0 mt-0.5">
                          <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
                        </svg>
                        <div>
                          <p className="text-[11px] font-semibold" style={{ color: "#f87171" }}>{reason.factor}</p>
                          <p className="text-[10px]" style={{ color: "#71717a" }}>{reason.reason}</p>
                          {reason.weight && (
                            <span className="text-[9px] font-mono" style={{ color: "#52525b" }}>Weight: {(reason.weight * 100).toFixed(0)}%</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RAG badge */}
              <div className="flex items-center gap-2 pt-2" style={{ borderTop: "1px solid rgba(167,139,250,0.06)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#a78bfa", animation: "soft-pulse 2s ease-in-out infinite" }} />
                <span className="text-[9px] font-medium" style={{ color: "#52525b" }}>Retrieved via RAG — IRDAI knowledge base with TF-IDF semantic search</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════ Similar Past Cases ══════ */}
      <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(16,185,129,0.10)", background: "rgba(16,185,129,0.02)" }}>
        <button
          onClick={fetchSimilarCases}
          className="w-full flex items-center justify-between px-5 py-3.5 text-left"
          style={{ background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
        >
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#10b981" }}>
              Similar Past Assessments
            </span>
            {similarCases && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981" }}>
                {similarCases.length} found
              </span>
            )}
          </span>
          {!similarCases && (
            <span className="text-[10px] font-medium px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>
              {loadingSimilar ? "Searching..." : "Find Similar"}
            </span>
          )}
        </button>

        {similarCases && similarCases.length > 0 && (
          <div className="px-5 pb-5" style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}>
            <div className="pt-3 space-y-2">
              {similarCases.map((c, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                  {/* Score badge */}
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-mono text-sm font-bold" style={{ background: `${scoreColor(c.risk_score)}10`, color: scoreColor(c.risk_score), border: `1px solid ${scoreColor(c.risk_score)}20` }}>
                    {c.risk_score}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold truncate" style={{ color: "#fafafa" }}>
                        {c.age ? `${c.gender === "female" ? "F" : c.gender === "male" ? "M" : ""}${c.age}` : ""} {c.occupation || ""}
                      </span>
                      <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0" style={{ background: `${decisionColor(c.underwriter_action || c.decision)}12`, color: decisionColor(c.underwriter_action || c.decision) }}>
                        {c.underwriter_action || c.decision}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px]" style={{ color: "#52525b" }}>
                      {c.income && <span>₹{(c.income / 100000).toFixed(1)}L</span>}
                      {c.credit_score && <span>CIBIL {c.credit_score}</span>}
                      {c.premium_min && c.premium_max && <span>₹{c.premium_min.toLocaleString()}-₹{c.premium_max.toLocaleString()}</span>}
                    </div>
                  </div>

                  {/* Top factors */}
                  <div className="hidden sm:flex flex-col gap-0.5 shrink-0">
                    {(c.top_factors || []).slice(0, 2).map((f, j) => (
                      <span key={j} className="text-[8px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.03)", color: "#52525b" }}>{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-3 mt-2" style={{ borderTop: "1px solid rgba(16,185,129,0.06)" }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }} />
              <span className="text-[9px] font-medium" style={{ color: "#52525b" }}>RAG — matched by policy type, age ±10y, income ±50%, gender</span>
            </div>
          </div>
        )}

        {similarCases && similarCases.length === 0 && (
          <div className="px-5 pb-4" style={{ borderTop: "1px solid rgba(16,185,129,0.08)" }}>
            <p className="text-[11px] pt-3" style={{ color: "#52525b" }}>No similar past assessments found for this profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
