"use client";
import { motion } from "framer-motion";

/**
 * PolicyRecommendation — recommends specific insurance plans based on
 * the applicant's risk profile, policy type, and alternative data factors.
 *
 * Props:
 *   riskScore  — number (0-100)
 *   policyType — "health" | "auto" | "life" | "property"
 *   decision   — "approve" | "refer" | "decline"
 *   premium    — { min: number, max: number }
 *   applicant  — { age: number, income: number, occupation: string }
 *   factors    — [{ factor, impact, value, source, ... }]
 */

const PLAN_TIERS = {
  health: [
    {
      name: "Health Basic",
      coverage: "5L cover",
      tier: "basic",
      desc: "Essential hospitalization coverage with basic room rent and ICU charges.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
    {
      name: "Health Plus",
      coverage: "10L cover",
      tier: "mid",
      desc: "Comprehensive coverage including daycare procedures, pre/post hospitalization, and ambulance.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      name: "Health Premium",
      coverage: "25L cover",
      tier: "premium",
      desc: "Top-tier coverage with no room rent limits, global coverage, annual health checkups, and maternity.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
  ],
  auto: [
    {
      name: "Third Party Only",
      coverage: "TP liability",
      tier: "basic",
      desc: "Mandatory third-party liability coverage as required by law. No own-damage protection.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      name: "Comprehensive Standard",
      coverage: "OD + TP",
      tier: "mid",
      desc: "Full own-damage and third-party coverage including fire, theft, and natural calamity.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2" />
        </svg>
      ),
    },
    {
      name: "Comprehensive Premium + Zero Dep",
      coverage: "OD + TP + add-ons",
      tier: "premium",
      desc: "Maximum coverage with zero depreciation, engine protection, roadside assistance, and consumables.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      ),
    },
  ],
  life: [
    {
      name: "Term Life 50L",
      coverage: "50L sum assured",
      tier: "basic",
      desc: "Affordable pure term plan with death benefit of 50 lakhs for essential family protection.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
        </svg>
      ),
    },
    {
      name: "Term Life 1Cr",
      coverage: "1Cr sum assured",
      tier: "mid",
      desc: "Higher coverage term plan with return of premium option and critical illness add-on available.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      name: "Term Life 2Cr + Riders",
      coverage: "2Cr + riders",
      tier: "premium",
      desc: "Maximum protection with 2Cr cover, accidental death benefit, critical illness rider, and waiver of premium.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
  ],
  property: [
    {
      name: "Basic Fire + Theft",
      coverage: "Fire & theft",
      tier: "basic",
      desc: "Standard fire and special perils policy covering fire, lightning, explosion, and burglary.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        </svg>
      ),
    },
    {
      name: "Standard All-Risk",
      coverage: "All-risk",
      tier: "mid",
      desc: "Comprehensive all-risk coverage including water damage, storm, riot, and contents protection.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      name: "Premium All-Risk + Earthquake",
      coverage: "All-risk + earthquake",
      tier: "premium",
      desc: "Maximum coverage including earthquake, landslide, terrorism, and full replacement cost without depreciation.",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
        </svg>
      ),
    },
  ],
};

function getRecommendedTier(riskScore) {
  if (riskScore <= 30) return "premium";
  if (riskScore <= 55) return "mid";
  return "basic";
}

function getTierLabel(tier) {
  if (tier === "premium") return "You qualify for our best plan";
  if (tier === "mid") return "Standard coverage recommended";
  return "Start with essential coverage";
}

function getPremiumMultiplier(tier) {
  if (tier === "premium") return { min: 1.6, max: 2.2 };
  if (tier === "mid") return { min: 1.0, max: 1.4 };
  return { min: 0.5, max: 0.8 };
}

function fmt(n) {
  if (n == null) return "0";
  return Number(Math.round(n)).toLocaleString("en-IN");
}

function buildWhyText(factors, policyType, riskScore) {
  const positiveFactors = factors
    .filter((f) => {
      const impact = typeof f.impact === "number" ? f.impact : parseFloat(f.impact);
      return !isNaN(impact) && impact < 0; // negative impact = reduces risk
    })
    .slice(0, 3);

  if (positiveFactors.length === 0) {
    if (riskScore <= 30) return "Your overall risk profile is excellent, qualifying you for premium rates.";
    if (riskScore <= 55) return "Your risk profile is within standard range for this coverage tier.";
    return "Based on your current risk assessment, we recommend starting with essential coverage.";
  }

  const factorNames = positiveFactors.map((f) => {
    const name = f.factor || f.name || f.label || "";
    return name.toLowerCase().replace(/_/g, " ");
  });

  const policyPhrases = {
    health: "qualify you for better health coverage rates",
    auto: "qualify you for premium auto rates",
    life: "make you eligible for higher life coverage",
    property: "enable better property coverage options",
  };

  const phrase = policyPhrases[policyType] || "qualify you for better rates";

  if (factorNames.length === 1) {
    return `Your ${factorNames[0]} ${phrase}.`;
  }
  if (factorNames.length === 2) {
    return `Your ${factorNames[0]} and ${factorNames[1]} ${phrase}.`;
  }
  return `Your ${factorNames[0]}, ${factorNames[1]}, and ${factorNames[2]} ${phrase}.`;
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring", damping: 22, stiffness: 120, mass: 0.6 },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", damping: 22, stiffness: 120, delay: 0.4 },
  },
};

export default function PolicyRecommendation({
  riskScore,
  policyType = "health",
  decision = "approve",
  premium = { min: 0, max: 0 },
  applicant = {},
  factors = [],
}) {
  const plans = PLAN_TIERS[policyType] || PLAN_TIERS.health;
  const recommendedTier = getRecommendedTier(riskScore);
  const tierLabel = getTierLabel(recommendedTier);

  // Find recommended plan and alternatives
  const recommendedPlan = plans.find((p) => p.tier === recommendedTier);
  const alternativePlans = plans.filter((p) => p.tier !== recommendedTier);

  // Compute estimated premiums for each plan
  const planWithPremium = (plan) => {
    const mult = getPremiumMultiplier(plan.tier);
    return {
      ...plan,
      estMin: Math.round(premium.min * mult.min) || 0,
      estMax: Math.round(premium.max * mult.max) || 0,
    };
  };

  const recPlan = planWithPremium(recommendedPlan);
  const altPlans = alternativePlans.map(planWithPremium);

  const whyText = buildWhyText(factors, policyType, riskScore);
  const needsImprovement = decision === "refer" || decision === "decline";

  return (
    <motion.div
      className="glass-card p-0 overflow-hidden relative"
      style={{ borderColor: "rgba(16,185,129,0.12)" }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Background glow */}
      <div
        className="absolute -top-24 -right-24 w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "rgba(16,185,129,0.06)", filter: "blur(70px)" }}
      />

      {/* Header */}
      <div className="relative px-6 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(16,185,129,0.1)" }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <path d="M22 4L12 14.01l-3-3" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "#fafafa" }}>
              Plan Recommendations
            </h3>
            <p className="text-[10px]" style={{ color: "#52525b" }}>
              {policyType.charAt(0).toUpperCase() + policyType.slice(1)} insurance
              {applicant.age ? ` \u00b7 Age ${applicant.age}` : ""}
              {applicant.occupation ? ` \u00b7 ${applicant.occupation}` : ""}
            </p>
          </div>
        </div>
        <p className="text-[11px] mt-2" style={{ color: "#71717a" }}>
          {tierLabel}
        </p>
      </div>

      {/* Recommended plan — large card */}
      <motion.div className="px-6 pb-3" variants={cardVariants}>
        <div
          className="rounded-2xl p-5 relative overflow-hidden group transition-all duration-300"
          style={{
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.2)",
          }}
        >
          {/* Subtle glow behind the card */}
          <div
            className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none"
            style={{ background: "rgba(16,185,129,0.1)", filter: "blur(40px)" }}
          />

          {/* AI Recommended badge */}
          <div className="flex items-center justify-between mb-3 relative">
            <span
              className="text-[8px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full inline-flex items-center gap-1.5"
              style={{
                background: "rgba(16,185,129,0.15)",
                color: "#10b981",
                border: "1px solid rgba(16,185,129,0.3)",
                boxShadow: "0 0 12px rgba(16,185,129,0.15)",
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
              AI Recommended
            </span>
            <span className="font-mono text-xs font-bold" style={{ color: "#52525b" }}>
              Risk: {riskScore}/100
            </span>
          </div>

          {/* Plan info */}
          <div className="flex items-start gap-3 mb-3 relative">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
            >
              {recPlan.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-base font-bold leading-tight" style={{ color: "#fafafa" }}>
                {recPlan.name}
              </h4>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5" style={{ color: "#10b981" }}>
                {recPlan.coverage}
              </p>
            </div>
          </div>

          <p className="text-[11px] leading-relaxed mb-3 relative" style={{ color: "#a1a1aa" }}>
            {recPlan.desc}
          </p>

          {/* Premium estimate */}
          {(recPlan.estMin > 0 || recPlan.estMax > 0) && (
            <div
              className="rounded-xl px-4 py-2.5 mb-3 relative"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5" style={{ color: "#52525b" }}>
                Estimated Premium
              </p>
              <p className="font-mono text-lg font-extrabold tabular-nums" style={{ color: "#fafafa" }}>
                {"\u20B9"}{fmt(recPlan.estMin)} - {"\u20B9"}{fmt(recPlan.estMax)}
                <span className="text-[10px] font-normal ml-1" style={{ color: "#71717a" }}>
                  /year
                </span>
              </p>
            </div>
          )}

          {/* Why this recommendation */}
          <div
            className="rounded-xl px-4 py-3 relative"
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: "#10b981" }}>
              Why this recommendation?
            </p>
            <p className="text-[11px] leading-relaxed" style={{ color: "#a1a1aa" }}>
              {whyText}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Alternative plans — smaller cards */}
      <motion.div className="px-6 pb-4" variants={cardVariants}>
        <p className="text-[9px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#52525b" }}>
          Other Available Plans
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {altPlans.map((plan) => {
            const isHigher = plan.tier === "premium";
            const accentColor = isHigher ? "#f59e0b" : "#71717a";

            return (
              <div
                key={plan.name}
                className="rounded-xl p-4 transition-all duration-300 group"
                style={{
                  background: isHigher ? "rgba(245,158,11,0.04)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${isHigher ? "rgba(245,158,11,0.12)" : "rgba(255,255,255,0.06)"}`,
                }}
              >
                <div className="flex items-start gap-2.5 mb-2">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
                    style={{ background: `${accentColor}15`, color: accentColor }}
                  >
                    {plan.icon}
                  </div>
                  <div>
                    <p className="text-[12px] font-bold leading-tight" style={{ color: "#fafafa" }}>
                      {plan.name}
                    </p>
                    <p
                      className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: accentColor }}
                    >
                      {plan.coverage}
                    </p>
                  </div>
                </div>

                <p className="text-[10px] leading-relaxed mb-2" style={{ color: "#71717a" }}>
                  {plan.desc}
                </p>

                {(plan.estMin > 0 || plan.estMax > 0) && (
                  <p className="font-mono text-xs font-bold tabular-nums" style={{ color: "#a1a1aa" }}>
                    {"\u20B9"}{fmt(plan.estMin)} - {"\u20B9"}{fmt(plan.estMax)}
                    <span className="text-[9px] font-normal ml-1" style={{ color: "#52525b" }}>
                      /year
                    </span>
                  </p>
                )}

                {isHigher && (
                  <span
                    className="inline-block text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-2"
                    style={{
                      background: "rgba(245,158,11,0.1)",
                      color: "#f59e0b",
                      border: "1px solid rgba(245,158,11,0.2)",
                    }}
                  >
                    Upgrade available
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Improvement nudge for refer/decline */}
      {needsImprovement && (
        <motion.div
          className="px-6 py-4 border-t"
          style={{
            borderColor: "rgba(255,255,255,0.06)",
            background: "rgba(245,158,11,0.04)",
          }}
          variants={fadeUp}
        >
          <div className="flex items-start gap-2.5">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: "rgba(245,158,11,0.15)" }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-bold mb-0.5" style={{ color: "#f59e0b" }}>
                Unlock better plans
              </p>
              <p className="text-[10px] leading-relaxed" style={{ color: "#a1a1aa" }}>
                Improve your score by providing more alternative data sources (telematics, wearable data, digital footprint) to qualify for higher coverage tiers with lower premiums.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer */}
      <motion.div
        className="px-6 py-3 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
        variants={fadeUp}
      >
        <div className="flex items-center gap-2">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#10b981", animation: "soft-pulse 2s ease-in-out infinite" }}
          />
          <span className="text-[9px]" style={{ color: "#3f3f46" }}>
            Recommendations generated by AI based on risk score, {factors.length} factors,
            {applicant.age ? ` age ${applicant.age},` : ""} and{" "}
            {policyType} profile
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
