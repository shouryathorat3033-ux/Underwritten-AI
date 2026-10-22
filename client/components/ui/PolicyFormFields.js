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

  const riskColor = { high: "#ef4444", moderate: "#f59e0b", low: "#10b981", minimal: "#10b981" };

  return (
    <div className="sm:col-span-2 rounded-xl p-4" style={{ background: `${color}06`, border: `1px solid ${color}15` }}>
      <div className="flex items-center gap-2 mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></svg>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Live Location Risk Enrichment</span>
      </div>
      <div className="flex gap-2 mb-2">
        <input className="flex-1 px-3 py-2 rounded-lg text-sm outline-none" placeholder="Enter 6-digit pincode" value={pincode} onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fafafa", fontFamily: "inherit" }} />
        <button onClick={lookup} disabled={loading || pincode.length !== 6}
          className="px-4 py-2 rounded-lg text-xs font-semibold transition-all"
          style={{ background: pincode.length === 6 ? color : "#27272a", color: "#fff", border: "none", cursor: pincode.length === 6 ? "pointer" : "not-allowed", opacity: loading ? 0.6 : 1 }}>
          {loading ? "..." : "Analyze"}
        </button>
      </div>
      {result && (
        <div className="grid grid-cols-3 gap-2 mt-3">
          {[
            { label: "Flood Risk", value: result.riskAssessment?.floodRisk?.level, score: result.riskAssessment?.floodRisk?.score },
            { label: "Wind Risk", value: result.riskAssessment?.windRisk?.level, score: result.riskAssessment?.windRisk?.score },
            { label: "Overall Risk", value: result.riskAssessment?.overallRisk?.level, score: result.riskAssessment?.overallRisk?.score },
          ].map(r => (
            <div key={r.label} className="rounded-lg p-2.5 text-center" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[9px] font-medium uppercase tracking-wider mb-1" style={{ color: "#71717a" }}>{r.label}</p>
              <p className="text-sm font-bold uppercase" style={{ color: riskColor[r.value] || "#71717a" }}>{r.value || "—"}</p>
              {r.score != null && <p className="text-[10px] font-mono mt-0.5" style={{ color: "#52525b" }}>{r.score}/100</p>}
            </div>
          ))}
          {result.location?.name && (
            <div className="col-span-3 flex items-center gap-2 mt-1 px-1">
              <span className="text-[10px]" style={{ color: "#52525b" }}>📍 {result.location.name}{result.location.region ? `, ${result.location.region}` : ""}</span>
              {result.forecast?.totalRainfall7d != null && <span className="text-[10px] font-mono" style={{ color: "#52525b" }}>• 7d rain: {result.forecast.totalRainfall7d}mm</span>}
              {result.source && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(16,185,129,0.08)", color: "#10b981" }}>{result.source === "open-meteo" ? "LIVE" : "SIMULATED"}</span>}
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
      { value: "", label: "Select" },
      { value: "house", label: "House" },
      { value: "apartment", label: "Apartment" },
      { value: "condo", label: "Flat" },
      { value: "commercial", label: "Commercial" },
    ])}
    {F("Property Age (years)", "propertyAge", "number", "e.g. 10")}
    {F("Property Value (₹)", "propertyValue", "number", "e.g. 5000000")}
    {F("Area (sq. ft.)", "squareFootage", "number", "e.g. 1200")}
    {S("Construction Type", "constructionType", [
      { value: "", label: "Select" },
      { value: "brick", label: "Brick" },
      { value: "wood", label: "Wood Frame" },
      { value: "concrete", label: "RCC / Concrete" },
      { value: "steel", label: "Steel Frame" },
    ])}
    {S("Flood Zone", "floodZone", [
      { value: "none", label: "None" },
      { value: "low", label: "Low Risk" },
      { value: "moderate", label: "Moderate Risk" },
      { value: "high", label: "High Risk" },
    ])}
    {S("Security System", "securitySystem", [
      { value: "none", label: "None" },
      { value: "basic", label: "Basic" },
      { value: "comprehensive", label: "Comprehensive + CCTV" },
    ])}
  </>
);

const fieldRenderers = { health: healthFields, auto: autoFields, life: lifeFields, property: propertyFields };

export default function PolicyFormFields({ policyType, color, F, S, onGeoResult }) {
  const meta = policyMeta[policyType];
  const renderFields = fieldRenderers[policyType];
  if (!meta || !renderFields) return null;

  return (
    <div>
      {/* Section header with icon and description */}
      <div className="flex items-start gap-4 mb-6 p-4 rounded-xl" style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{meta.icon}</svg>
        </div>
        <div>
          <h3 className="text-sm font-bold mb-1" style={{ color: "#fafafa" }}>{meta.title}</h3>
          <p className="text-xs leading-relaxed" style={{ color: "#71717a" }}>{meta.desc}</p>
        </div>
      </div>

      {/* Form fields grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
        {policyType === "property" ? renderFields(F, S, color, onGeoResult) : renderFields(F, S)}
      </div>

      {/* Tips section */}
      <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.04)" }}>
        <p className="text-[10px] font-bold uppercase tracking-wider mb-2.5" style={{ color: "#3f3f46" }}>Tips for better rates</p>
        <div className="space-y-2">
          {meta.tips.map((tip, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
              <span className="text-[11px] leading-relaxed" style={{ color: "#52525b" }}>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
