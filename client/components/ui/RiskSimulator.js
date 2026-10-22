"use client";
import { useState, useCallback, useRef, useMemo } from "react";

/**
 * Policy-aware risk simulator — sliders match the actual risk factors
 * for each policy type, not a generic one-size-fits-all set.
 */

const SLIDER_CONFIGS = {
  health: [
    { key: "age", label: "Age", min: 18, max: 80, step: 1, default: 35, unit: "yrs", field: "applicant.age" },
    { key: "income", label: "Annual Income", min: 0, max: 5000000, step: 50000, default: 800000, format: (v) => `₹${(v / 100000).toFixed(1)}L`, field: "trad.income" },
    { key: "creditScore", label: "Credit Score (CIBIL)", min: 300, max: 900, step: 10, default: 700, field: "trad.creditScore" },
    { key: "bmi", label: "BMI", min: 15, max: 45, step: 0.5, default: 24, field: "psd.bmi" },
    { key: "smokingStatus", label: "Smoking", min: 0, max: 2, step: 1, default: 0, format: (v) => ["Never", "Former", "Current"][v], field: "psd.smokingStatus" },
    { key: "exerciseFrequency", label: "Exercise (days/wk)", min: 0, max: 7, step: 1, default: 3, unit: "days", field: "psd.exerciseFrequency" },
  ],
  auto: [
    { key: "age", label: "Age", min: 17, max: 75, step: 1, default: 30, unit: "yrs", field: "applicant.age" },
    { key: "accidentsLast5", label: "Accidents (last 5y)", min: 0, max: 6, step: 1, default: 0, field: "psd.accidentsLast5" },
    { key: "trafficViolations", label: "Traffic Violations", min: 0, max: 8, step: 1, default: 0, field: "psd.trafficViolations" },
    { key: "drivingYears", label: "Driving Experience", min: 0, max: 40, step: 1, default: 5, unit: "yrs", field: "psd.drivingYears" },
    { key: "dailyCommute", label: "Daily Commute", min: 0, max: 120, step: 5, default: 20, unit: "km", field: "psd.dailyCommute" },
    { key: "income", label: "Annual Income", min: 0, max: 5000000, step: 50000, default: 800000, format: (v) => `₹${(v / 100000).toFixed(1)}L`, field: "trad.income" },
    { key: "creditScore", label: "Credit Score (CIBIL)", min: 300, max: 900, step: 10, default: 700, field: "trad.creditScore" },
    { key: "telematicsScore", label: "Telematics Score", min: 0, max: 100, step: 1, default: 60, unit: "/100", field: "alt.telematicsScore" },
  ],
  life: [
    { key: "age", label: "Age", min: 18, max: 80, step: 1, default: 35, unit: "yrs", field: "applicant.age" },
    { key: "smokingStatus", label: "Smoking", min: 0, max: 2, step: 1, default: 0, format: (v) => ["Never", "Former", "Current"][v], field: "psd.smokingStatus" },
    { key: "bmi", label: "BMI", min: 15, max: 45, step: 0.5, default: 24, field: "psd.bmi" },
    { key: "income", label: "Annual Income", min: 0, max: 5000000, step: 50000, default: 800000, format: (v) => `₹${(v / 100000).toFixed(1)}L`, field: "trad.income" },
    { key: "exerciseFrequency", label: "Exercise (days/wk)", min: 0, max: 7, step: 1, default: 3, unit: "days", field: "psd.exerciseFrequency" },
    { key: "dependents", label: "Dependents", min: 0, max: 6, step: 1, default: 1, field: "psd.dependents" },
  ],
  property: [
    { key: "propertyAge", label: "Property Age", min: 0, max: 80, step: 1, default: 10, unit: "yrs", field: "psd.propertyAge" },
    { key: "propertyValue", label: "Property Value", min: 1000000, max: 50000000, step: 500000, default: 5000000, format: (v) => `₹${(v / 100000).toFixed(0)}L`, field: "psd.propertyValue" },
    { key: "floodZone", label: "Flood Zone", min: 0, max: 3, step: 1, default: 0, format: (v) => ["None", "Low", "Moderate", "High"][v], field: "psd.floodZone" },
    { key: "constructionType", label: "Construction", min: 0, max: 2, step: 1, default: 0, format: (v) => ["Concrete/RCC", "Brick", "Wood"][v], field: "psd.constructionType" },
    { key: "securitySystem", label: "Security", min: 0, max: 2, step: 1, default: 1, format: (v) => ["None", "Basic", "Comprehensive"][v], field: "psd.securitySystem" },
    { key: "income", label: "Annual Income", min: 0, max: 5000000, step: 50000, default: 800000, format: (v) => `₹${(v / 100000).toFixed(1)}L`, field: "trad.income" },
  ],
};

const SMOKING_MAP = ["never", "former", "current"];
const FLOOD_MAP = ["none", "low", "moderate", "high"];
const CONSTRUCTION_MAP = ["concrete", "brick", "wood"];
const SECURITY_MAP = ["none", "basic", "comprehensive"];

function riskColor(s) {
  return s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";
}

export default function RiskSimulator({ policyType = "health", assessment }) {
  const sliders = SLIDER_CONFIGS[policyType] || SLIDER_CONFIGS.health;

  // Initialize values from assessment data
  const initialValues = useMemo(() => {
    const vals = {};
    const app = assessment?.applicant || {};
    const trad = assessment?.traditionalData || {};
    const alt = assessment?.alternativeData || {};
    const psd = assessment?.policySpecificData || {};

    for (const s of sliders) {
      if (s.key === "age") vals[s.key] = app.age || s.default;
      else if (s.key === "income") vals[s.key] = trad.income || s.default;
      else if (s.key === "creditScore") vals[s.key] = trad.creditScore || s.default;
      else if (s.key === "telematicsScore") vals[s.key] = alt.telematicsScore || s.default;
      else if (s.key === "smokingStatus") {
        const v = psd.smokingStatus;
        vals[s.key] = v === "current" ? 2 : v === "former" ? 1 : 0;
      }
      else if (s.key === "floodZone") {
        const v = (psd.floodZone || "").toLowerCase();
        vals[s.key] = v === "high" ? 3 : v === "moderate" ? 2 : v === "low" ? 1 : 0;
      }
      else if (s.key === "constructionType") {
        const v = (psd.constructionType || "").toLowerCase();
        vals[s.key] = v.includes("wood") ? 2 : v.includes("brick") ? 1 : 0;
      }
      else if (s.key === "securitySystem") {
        const v = (psd.securitySystem || "").toLowerCase();
        vals[s.key] = v.includes("comprehensive") || v.includes("full") ? 2 : v.includes("basic") ? 1 : 0;
      }
      else vals[s.key] = psd[s.key] ?? trad[s.key] ?? s.default;
    }
    return vals;
  }, [assessment, sliders]);

  const [values, setValues] = useState(initialValues);
  const [score, setScore] = useState(assessment?.result?.riskScore || 50);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const simulate = useCallback((newValues) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const pyUrl = process.env.NEXT_PUBLIC_PYTHON_URL || "http://127.0.0.1:8000";

        // Build policy-specific body from slider values
        const psd = { ...(assessment?.policySpecificData || {}) };
        const trad = { ...(assessment?.traditionalData || {}) };
        const alt = { ...(assessment?.alternativeData || {}) };

        // Map slider values back to the correct fields
        if (newValues.income !== undefined) trad.income = newValues.income;
        if (newValues.creditScore !== undefined) trad.creditScore = newValues.creditScore;
        if (newValues.telematicsScore !== undefined) alt.telematicsScore = newValues.telematicsScore;
        if (newValues.smokingStatus !== undefined) psd.smokingStatus = SMOKING_MAP[newValues.smokingStatus];
        if (newValues.bmi !== undefined) psd.bmi = newValues.bmi;
        if (newValues.exerciseFrequency !== undefined) psd.exerciseFrequency = newValues.exerciseFrequency;
        if (newValues.accidentsLast5 !== undefined) psd.accidentsLast5 = newValues.accidentsLast5;
        if (newValues.trafficViolations !== undefined) psd.trafficViolations = newValues.trafficViolations;
        if (newValues.drivingYears !== undefined) psd.drivingYears = newValues.drivingYears;
        if (newValues.dailyCommute !== undefined) psd.dailyCommute = newValues.dailyCommute;
        if (newValues.dependents !== undefined) psd.dependents = newValues.dependents;
        if (newValues.propertyAge !== undefined) psd.propertyAge = newValues.propertyAge;
        if (newValues.propertyValue !== undefined) psd.propertyValue = newValues.propertyValue;
        if (newValues.floodZone !== undefined) psd.floodZone = FLOOD_MAP[newValues.floodZone];
        if (newValues.constructionType !== undefined) psd.constructionType = CONSTRUCTION_MAP[newValues.constructionType];
        if (newValues.securitySystem !== undefined) psd.securitySystem = SECURITY_MAP[newValues.securitySystem];

        const body = {
          assessment: {
            applicant: { ...(assessment?.applicant || {}), age: newValues.age ?? assessment?.applicant?.age },
            traditionalData: trad,
            alternativeData: alt,
            policySpecificData: psd,
          },
          policyType,
        };

        const res = await fetch(`${pyUrl}/api/ml/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          const data = await res.json();
          setScore(data.riskScore ?? score);
        }
      } catch { /* keep last score */ }
      setLoading(false);
    }, 400);
  }, [policyType, assessment, score]);

  const handleChange = (key, val) => {
    const newValues = { ...values, [key]: Number(val) };
    setValues(newValues);
    simulate(newValues);
  };

  const color = riskColor(score);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold" style={{ color: "#fafafa" }}>Risk Simulator</h3>
          <p className="text-[10px] mt-0.5" style={{ color: "#52525b" }}>
            Adjust {policyType} risk factors to see score impact in real-time
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && <span className="w-3 h-3 rounded-full border-2 border-t-2" style={{ borderColor: `${color}30`, borderTopColor: color, animation: "spin-anim 1s linear infinite" }} />}
          <div className="px-3 py-1.5 rounded-xl" style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
            <span className="font-mono text-lg font-bold" style={{ color }}>{score}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {sliders.map(s => {
          const val = values[s.key] ?? s.default;
          const pct = ((val - s.min) / (s.max - s.min)) * 100;
          const displayVal = s.format ? s.format(val) : `${val}${s.unit ? ` ${s.unit}` : ""}`;
          return (
            <div key={s.key}>
              <div className="flex justify-between mb-1.5">
                <span className="text-[11px] font-medium" style={{ color: "#a1a1aa" }}>{s.label}</span>
                <span className="text-[11px] font-mono font-semibold" style={{ color: "#fafafa" }}>{displayVal}</span>
              </div>
              <div className="relative">
                <input type="range" min={s.min} max={s.max} step={s.step} value={val}
                  onChange={(e) => handleChange(s.key, e.target.value)}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${color} 0%, ${color} ${pct}%, rgba(255,255,255,0.06) ${pct}%, rgba(255,255,255,0.06) 100%)`,
                    WebkitAppearance: "none",
                  }} />
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px; height: 16px; border-radius: 50%;
          background: ${color}; border: 2px solid #09090b;
          box-shadow: 0 0 8px ${color}40;
          cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px; height: 16px; border-radius: 50%;
          background: ${color}; border: 2px solid #09090b;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
