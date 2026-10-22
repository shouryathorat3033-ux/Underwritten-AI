"use client";
import { useState } from "react";

/**
 * Renders insurance-type-specific form fields.
 * Each policy type gets its own visual section with a themed header,
 * relevant fields, and helpful context.
 *
 * Usage: <PolicyFormFields policyType="health" form={form} update={update} color="#10b981" F={F} S={S} />
 */

const policyMeta = {
  health: {
    title: "Health Profile",
    desc: "Your medical details help us accurately assess health risks and find you the best premium.",
    icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
    tips: [
      "BMI between 18.5-24.9 is considered healthy range",
      "Non-smokers typically receive significantly lower premiums",
      "Regular exercise can reduce your risk score by up to 15%",
    ],
  },
  auto: {
    title: "Vehicle & Driving Profile",
    desc: "Your vehicle info and driving history help determine your auto insurance risk level.",
    icon: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 21v-4M16 21v-4M3 16h18" /></>,
    tips: [
      "Clean driving records with 0 accidents get the best rates",
      "Newer vehicles with safety features reduce risk scores",
      "Short daily commutes correlate with fewer claims",
    ],
  },
  life: {
    title: "Lifestyle & Family Profile",
    desc: "Your lifestyle, family history, and habits help us build a comprehensive life risk assessment.",
    icon: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />,
    tips: [
      "Non-smokers and moderate drinkers receive the best rates",
      "Having dependents helps demonstrate financial responsibility",
      "Active lifestyles with regular exercise lower premiums",
    ],
  },
  property: {
    title: "Property Details",
    desc: "Property characteristics, location risks, and security features determine your coverage rate.",
    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    tips: [
      "RCC/concrete construction is considered safest",
      "Security systems with CCTV can reduce premiums by 10-20%",
      "Properties outside flood zones get significantly lower rates",
    ],
  },
};

const healthFields = (F, S) => (
  <>
    {F("BMI", "bmi", "number", "e.g. 24.5")}
    {F("Blood Pressure", "bloodPressure", "text", "e.g. 120/80")}
    {S("Smoking Status", "smokingStatus", [
      { value: "never", label: "Never" },
      { value: "former", label: "Former" },
      { value: "current", label: "Current Smoker" },
    ])}
    {F("Exercise (days/week)", "exerciseFrequency", "number", "0-7")}
    {F("Medical History", "medicalHistory", "text", "e.g. diabetes, hypertension")}
    {F("Current Medications", "currentMedications", "text", "e.g. Metformin")}
    {F("Family Health History", "familyHealthHistory", "text", "e.g. heart disease")}
  </>
);

const autoFields = (F, S) => (
  <>
    {F("Vehicle Make & Model", "vehicleMake", "text", "e.g. Maruti Swift")}
    {F("Vehicle Year", "vehicleYear", "number", "e.g. 2022")}
    {S("Vehicle Type", "vehicleType", [
      { value: "", label: "Select" },
      { value: "sedan", label: "Sedan" },
      { value: "suv", label: "SUV" },
      { value: "truck", label: "Truck" },
      { value: "motorcycle", label: "Two Wheeler" },
      { value: "van", label: "Van" },
    ])}
    {F("Years of Driving", "drivingYears", "number", "e.g. 5")}
    {F("Accidents (Last 5 Yrs)", "accidentsLast5", "number", "e.g. 0")}
    {F("Traffic Violations", "trafficViolations", "number", "e.g. 0")}
    {F("Daily Commute (km)", "dailyCommute", "number", "e.g. 15")}
  </>
);

const lifeFields = (F, S) => (
  <>
    {S("Marital Status", "maritalStatus", [
      { value: "", label: "Select" },
      { value: "single", label: "Single" },
      { value: "married", label: "Married" },
      { value: "divorced", label: "Divorced" },
      { value: "widowed", label: "Widowed" },
    ])}
    {F("Dependents", "dependents", "number", "e.g. 2")}
    {S("Smoking Status", "smokingStatus", [
      { value: "never", label: "Never" },
      { value: "former", label: "Former" },
      { value: "current", label: "Current Smoker" },
    ])}
    {S("Alcohol Frequency", "alcoholFrequency", [
      { value: "", label: "Select" },
      { value: "never", label: "Never" },
      { value: "occasional", label: "Occasional" },
      { value: "moderate", label: "Moderate" },
      { value: "heavy", label: "Heavy" },
    ])}
    {F("Exercise (days/week)", "exerciseFrequency", "number", "0-7")}
    {F("Family Medical History", "familyHistory", "text", "e.g. heart disease, cancer")}
    {F("Existing Life Policies", "existingLifePolicies", "number", "e.g. 1")}
  </>
);

function PincodeRiskLookup({ color, onResult }) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const lookup = async () => {
    if (!/^\d{6}$/.test(pincode)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/georisk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pincode }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        if (onResult) onResult(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const riskColor = { high: "#f43f5e", moderate: "#f59e0b", low: "#3b82f6", minimal: "#3b82f6" };

  return (
    <div className="sm:col-span-2 blueprint-card p-5 relative overflow-hidden" style={{ borderColor: `${color}30` }}>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider block" style={{ color: "#f8fafc" }}>Live Geo-Risk Calibration</span>
            <span className="text-[10px] font-mono text-slate-400">SAT-TELEMETRY // PWD-RADAR</span>
          </div>
        </div>
        <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[GEO.04]</span>
      </div>

      <div className="flex gap-2 mb-3">
        <input className="flex-1 px-3.5 py-2.5 rounded-xl text-sm outline-none font-mono" placeholder="Enter 6-digit postal code" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{ background: "rgba(10,15,29,0.8)", border: "1px solid rgba(59,130,246,0.2)", color: "#f8fafc" }} />
        <button onClick={lookup} disabled={loading || pincode.length !== 6}
          className="px-5 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all"
          style={{ background: pincode.length === 6 ? "linear-gradient(135deg, #2563eb, #1d4ed8)" : "rgba(148,163,184,0.1)", color: pincode.length === 6 ? "#fff" : "#64748b", border: "1px solid rgba(59,130,246,0.3)", cursor: pincode.length === 6 ? "pointer" : "not-allowed", opacity: loading ? 0.7 : 1 }}>
          {loading ? "CALIBRATING..." : "RUN_ANALYSIS"}
        </button>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          {[
            { label: "Flood Risk", value: result.riskAssessment?.floodRisk?.level, score: result.riskAssessment?.floodRisk?.score },
            { label: "Wind Risk", value: result.riskAssessment?.windRisk?.level, score: result.riskAssessment?.windRisk?.score },
            { label: "Composite Index", value: result.riskAssessment?.overallRisk?.level, score: result.riskAssessment?.overallRisk?.score },
          ].map(r => (
            <div key={r.label} className="rounded-xl p-3 text-center border border-slate-800/80 bg-slate-900/40">
              <p className="text-[9px] font-mono uppercase tracking-wider mb-1 text-slate-400">{r.label}</p>
              <p className="text-sm font-bold uppercase font-mono" style={{ color: riskColor[r.value] || "#94a3b8" }}>{r.value || "—"}</p>
              {r.score != null && <p className="text-[10px] font-mono mt-0.5 text-slate-500">{r.score} / 100</p>}
            </div>
          ))}
          {result.location?.name && (
            <div className="col-span-3 flex items-center justify-between mt-1 px-1 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                {result.location.name}{result.location.region ? `, ${result.location.region}` : ""}
              </span>
              {result.forecast?.totalRainfall7d != null && <span>7D PRECIP: {result.forecast.totalRainfall7d}mm</span>}
              {result.source && <span className="text-[9px] px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10 uppercase tracking-widest">{result.source === "open-meteo" ? "LIVE_RADAR" : "SYNTH_ENV"}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const propertyFields = (F, S, color, onGeoResult) => (
  <>
    <PincodeRiskLookup color={color || "#8b5cf6"} onResult={onGeoResult} />
    {S("Property Type", "propertyType", [
      { value: "", label: "Select Type" },
      { value: "house", label: "Single-Family House" },
      { value: "apartment", label: "Apartment / Condo" },
      { value: "condo", label: "Multi-Unit Flat" },
      { value: "commercial", label: "Commercial Facility" },
    ])}
    {F("Structure Age (years)", "propertyAge", "number", "e.g. 10")}
    {F("Asset Valuation (₹)", "propertyValue", "number", "e.g. 5000000")}
    {F("Calculated Area (sq. ft.)", "squareFootage", "number", "e.g. 1200")}
    {S("Construction Spec", "constructionType", [
      { value: "", label: "Select Spec" },
      { value: "brick", label: "Reinforced Masonry / Brick" },
      { value: "wood", label: "Engineered Timber Frame" },
      { value: "concrete", label: "Cast RCC / High-Grade Concrete" },
      { value: "steel", label: "Industrial Structural Steel" },
    ])}
    {S("Hydrological Risk Zone", "floodZone", [
      { value: "none", label: "Zone 0: None / Elevated" },
      { value: "low", label: "Zone 1: Low Hydraulic Impact" },
      { value: "moderate", label: "Zone 2: Moderate Floodplain" },
      { value: "high", label: "Zone 3: High Risk Basin" },
    ])}
    {S("Telemetry & Security System", "securitySystem", [
      { value: "none", label: "Unmonitored" },
      { value: "basic", label: "Standard Perimeter Alarms" },
      { value: "comprehensive", label: "Comprehensive Smart Mesh + 24/7 CCTV" },
    ])}
  </>
);

const fieldRenderers = { health: healthFields, auto: autoFields, life: lifeFields, property: propertyFields };

export default function PolicyFormFields({ policyType, color, F, S, onGeoResult }) {
  const meta = policyMeta[policyType];
  const renderFields = fieldRenderers[policyType];
  if (!meta || !renderFields) return null;

  return (
    <div className="space-y-6">
      {/* Section header with icon and description */}
      <div className="blueprint-card p-5 relative overflow-hidden flex items-start gap-4" style={{ borderColor: `${color}35` }}>
        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-white tracking-tight">{meta.title}</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[TELEMETRY_SPEC]</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-400">{meta.desc}</p>
        </div>
      </div>

      {/* Form fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {policyType === "property" ? renderFields(F, S, color, onGeoResult) : renderFields(F, S)}
      </div>

      {/* Tips section */}
      <div className="blueprint-card p-4 border border-slate-800/80 bg-slate-900/30">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">[ACTUARIAL_OPTIMIZATION_VECTORS]</p>
          <span className="text-[10px] font-mono text-emerald-400">+PREMIUM_DISCOUNT</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {meta.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2 p-2.5 rounded-lg border border-slate-800/60 bg-slate-950/40">
              <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
              <span className="text-[11px] leading-relaxed text-slate-300">{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
