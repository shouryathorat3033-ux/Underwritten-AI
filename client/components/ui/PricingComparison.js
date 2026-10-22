"use client";

export default function PricingComparison({ riskScore, decision, premium, policyType }) {
  if (!premium || !riskScore) return null;

  // Traditional flat-rate pricing (Indian market averages, no personalization)
  // Source: IRDA annual report averages for individual non-linked policies
  const flatRates = {
    health: { low: 12000, high: 25000 },     // ₹12k–₹25k avg Indian health premium
    auto: { low: 15000, high: 35000 },       // ₹15k–₹35k avg comprehensive motor
    life: { low: 10000, high: 22000 },       // ₹10k–₹22k avg term life (₹50L cover)
    property: { low: 8000, high: 20000 },    // ₹8k–₹20k avg Indian property/fire
  };
  const flat = flatRates[policyType] || flatRates.health;
  const flatMid = Math.round((flat.low + flat.high) / 2);
  const aiMid = Math.round((premium.min + premium.max) / 2);
  const savings = flatMid - aiMid;
  const savingsPct = Math.round((savings / flatMid) * 100);
  const isOverpriced = savings > 0;

  return (
    <div className="glass-card p-6" style={{ borderColor: isOverpriced ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)" }}>
      <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#fafafa" }}>
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
          </svg>
          Premium: Traditional vs AI Pricing
        </span>
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Traditional */}
        <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.04)", border: "1px solid rgba(239,68,68,0.1)" }}>
          <p className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: "#71717a" }}>Traditional Flat Rate</p>
          <p className="font-mono text-lg font-bold" style={{ color: "#f87171" }}>
            ₹{flat.low.toLocaleString("en-IN")} - ₹{flat.high.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#52525b" }}>Same price for all applicants</p>
          <p className="text-[10px]" style={{ color: "#52525b" }}>No risk differentiation</p>
        </div>

        {/* AI Personalized */}
        <div className="rounded-xl p-4" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}>
          <p className="text-[10px] uppercase font-bold tracking-wider mb-2" style={{ color: "#71717a" }}>AI Personalized</p>
          <p className="font-mono text-lg font-bold" style={{ color: "#10b981" }}>
            ₹{premium.min.toLocaleString("en-IN")} - ₹{premium.max.toLocaleString("en-IN")}
          </p>
          <p className="text-[10px] mt-1" style={{ color: "#52525b" }}>Based on risk score: {riskScore}/100</p>
          <p className="text-[10px]" style={{ color: "#52525b" }}>15 features analyzed</p>
        </div>
      </div>

      {/* Savings/Difference */}
      <div className="rounded-xl p-4 text-center" style={{
        background: isOverpriced ? "rgba(16,185,129,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${isOverpriced ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)"}`,
      }}>
        {isOverpriced ? (
          <>
            <p className="text-xs mb-1" style={{ color: "#71717a" }}>
              Low-risk applicants <strong style={{ color: "#10b981" }}>save money</strong> with AI pricing
            </p>
            <p className="font-mono text-xl font-bold" style={{ color: "#10b981" }}>
              ₹{Math.abs(savings).toLocaleString("en-IN")} saved ({Math.abs(savingsPct)}% less)
            </p>
            <p className="text-[10px] mt-1" style={{ color: "#52525b" }}>Traditional pricing would have overcharged this applicant</p>
          </>
        ) : (
          <>
            <p className="text-xs mb-1" style={{ color: "#71717a" }}>
              High-risk applicants pay <strong style={{ color: "#ef4444" }}>accurate premiums</strong>
            </p>
            <p className="font-mono text-xl font-bold" style={{ color: "#ef4444" }}>
              ₹{Math.abs(savings).toLocaleString("en-IN")} more ({Math.abs(savingsPct)}% higher)
            </p>
            <p className="text-[10px] mt-1" style={{ color: "#52525b" }}>Traditional pricing would have underpriced this risk</p>
          </>
        )}
      </div>
    </div>
  );
}
