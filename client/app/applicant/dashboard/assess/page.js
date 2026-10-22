"use client";
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import Link from "next/link";
import PolicyFormFields from "@/components/ui/PolicyFormFields";
import PolicySelector from "@/components/assess/PolicySelector";
import StepSidebar from "@/components/assess/StepSidebar";
import DocumentUploader from "@/components/assess/DocumentUploader";
import AssessmentSummary from "@/components/assess/AssessmentSummary";

/* ═══════ POLICY CONFIG ═══════ */
const policyTypes = [
  { id: "health", label: "Health", full: "Health Insurance", desc: "Medical history, BMI, pre-existing conditions, wearable health telemetry", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />, color: "#3b82f6", gradient: "linear-gradient(135deg, #2563eb, #1d4ed8)" },
  { id: "auto", label: "Auto", full: "Auto Insurance", desc: "Vehicle kinematics, driving history, telematics, GPS & acceleration profiles", icon: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 21v-4M16 21v-4M3 16h18" /></>, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "life", label: "Life", full: "Life Insurance", desc: "Actuarial mortality tables, lifestyle biomarker metrics, wearable vitals", icon: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />, color: "#f43f5e", gradient: "linear-gradient(135deg, #f43f5e, #e11d48)" },
  { id: "property", label: "Property", full: "Property Insurance", desc: "Hydrological satellite models, building age, IoT sensors, climate risk", icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
];

const commonFields = { applicantName: "", applicantEmail: "", applicantPhone: "", age: "", gender: "", occupation: "", income: "", creditScore: "", existingPolicies: "", telematicsScore: "", behavioralScore: "", lifestyleScore: "", socialMediaRisk: "low", jobStabilityScore: "", consentAlternativeData: false };
const policyFields = {
  health: { bmi: "", bloodPressure: "", smokingStatus: "never", exerciseFrequency: "", medicalHistory: "", currentMedications: "", familyHealthHistory: "" },
  auto: { vehicleMake: "", vehicleYear: "", vehicleType: "", drivingYears: "", accidentsLast5: "", trafficViolations: "", dailyCommute: "" },
  life: { maritalStatus: "", dependents: "", smokingStatus: "never", alcoholFrequency: "", exerciseFrequency: "", familyHistory: "", existingLifePolicies: "" },
  property: { propertyType: "", propertyAge: "", propertyValue: "", squareFootage: "", constructionType: "", floodZone: "no", securitySystem: "no" },
};

const steps = [
  { label: "Documents", title: "Document Telemetry Intake", sub: "Upload Aadhaar, PAN, salary slips — OCR will auto-fill your parameters", icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></> },
  { label: "Personal", title: "Applicant Coordinates", sub: "Verify auto-filled demographic profile or enter manual coordinates", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
  { label: "Policy", title: "Policy Parameter Specifications", sub: "Calibration factors configured for your active underwriting docket", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
  { label: "Financial", title: "Actuarial Financial Inputs", sub: "Solvency baseline and credit metrics for premium calculations", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></> },
  { label: "Review", title: "Synthesis & AI Model Dispatch", sub: "Final verification before triggering local Gemma 4 E4B risk analysis", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
];

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card", icon: "ID" },
  { value: "pan", label: "PAN Card", icon: "PAN" },
  { value: "salary_slip", label: "Salary Slip / Form 16", icon: "₹" },
  { value: "medical_report", label: "Medical Report", icon: "+" },
  { value: "driving_license", label: "Driving License", icon: "DL" },
  { value: "property_document", label: "Property Document", icon: "P" },
  { value: "vehicle_rc", label: "Vehicle RC", icon: "RC" },
  { value: "insurance_document", label: "Existing Policy", icon: "IP" },
];

/* ═══════ COMPONENT ═══════ */
export default function AssessPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...commonFields });
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extraction, setExtraction] = useState(null); // { extracted, formFields, documentType }
  const [docType, setDocType] = useState("aadhaar");

  // Auto-fill from session + most recent assessment
  useEffect(() => {
    if (profileLoaded) return;
    const prefill = {};

    // 1) From session (name, email)
    if (session?.user) {
      if (session.user.name) prefill.applicantName = session.user.name;
      if (session.user.email) prefill.applicantEmail = session.user.email;
    }

    // 2) From most recent assessment
    fetch("/api/assessments")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const prev = data?.assessments?.[0];
        if (prev) {
          const app = prev.applicant || {};
          const trad = prev.traditionalData || {};
          const alt = prev.alternativeData || {};
          if (app.phone && !prefill.applicantPhone) prefill.applicantPhone = app.phone;
          if (app.age) prefill.age = String(app.age);
          if (app.gender) prefill.gender = app.gender;
          if (app.occupation) prefill.occupation = app.occupation;
          if (trad.income) prefill.income = String(trad.income);
          if (trad.creditScore) prefill.creditScore = String(trad.creditScore);
          if (trad.existingPolicies) prefill.existingPolicies = String(trad.existingPolicies);
          if (alt.telematicsScore) prefill.telematicsScore = String(alt.telematicsScore);
          if (alt.behavioralScore) prefill.behavioralScore = String(alt.behavioralScore);
          if (alt.lifestyleScore) prefill.lifestyleScore = String(alt.lifestyleScore);
          if (alt.socialMediaRisk) prefill.socialMediaRisk = alt.socialMediaRisk;
          if (alt.jobStabilityScore) prefill.jobStabilityScore = String(alt.jobStabilityScore);
        }
        if (Object.keys(prefill).length > 0) {
          setForm(prev => ({ ...prev, ...prefill }));
        }
        setProfileLoaded(true);
      })
      .catch(() => {
        if (Object.keys(prefill).length > 0) {
          setForm(prev => ({ ...prev, ...prefill }));
        }
        setProfileLoaded(true);
      });
  }, [session, profileLoaded]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const handleSelectPolicy = (id) => {
    setSelectedPolicy(id);
    setForm(prev => {
      const base = { ...commonFields, ...policyFields[id] };
      for (const key of Object.keys(commonFields)) {
        if (prev[key] && prev[key] !== commonFields[key]) {
          base[key] = prev[key];
        }
      }
      return base;
    });
    setStep(0);
  };

  const handleDemoScenario = (policy, data) => {
    handleSelectPolicy(policy);
    setTimeout(() => setForm(prev => ({ ...prev, ...data })), 50);
  };

  const uploadAndExtract = useCallback(async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds limit (max 10MB)"); return; }

    setUploading(true);
    setExtraction(null);
    let uploadData;
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      uploadData = await res.json();
      if (!res.ok) { toast.error(uploadData.error || "Upload failed"); setUploading(false); return; }
      toast.success(`Encrypted payload stored: ${uploadData.name}`);
    } catch { toast.error("Upload failed"); setUploading(false); return; }
    setUploading(false);

    let verification = null;
    try {
      toast.loading("Verifying document authenticity...", { id: "verify" });
      const verifyRes = await fetch("/api/verify-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl: uploadData.url, fileName: uploadData.name, expectedType: docType }),
      });
      if (verifyRes.ok) {
        verification = await verifyRes.json();
        if (verification.verdict === "likely_fake") {
          toast.error("Document flagged: Synthetic / Counterfeit artifact detected", { id: "verify" });
        } else if (verification.verdict === "suspicious") {
          toast.error("Telemetry anomaly: Document flagged for underwriter audit", { id: "verify", icon: "⚠️" });
        } else {
          toast.success("Cryptographic authenticity verified", { id: "verify" });
        }
      } else {
        toast.dismiss("verify");
      }
    } catch { toast.dismiss("verify"); }

    setDocs(prev => [...prev, { name: uploadData.name, type: uploadData.type, url: uploadData.url, size: uploadData.size, docType, uploadedAt: new Date().toISOString(), verification }]);

    if (verification?.verdict === "likely_fake") {
      toast.error("Data extraction aborted: Failed authenticity parameters");
      return;
    }

    setExtracting(true);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentType: docType, documentUrl: uploadData.url, fileName: uploadData.name }),
      });
      const data = await res.json();
      if (res.ok && data.formFields && Object.keys(data.formFields).length > 0) {
        setExtraction({ extracted: data.extracted, formFields: data.formFields, documentType: docType });
        toast.success(`OCR calibrated ${data.fieldsCount} parameters from ${uploadData.name}`);
      } else {
        toast.error("Could not extract data from this document");
      }
    } catch { toast.error("AI extraction failed"); }
    setExtracting(false);
  }, [docType]);

  const applyExtraction = () => {
    if (!extraction) return;
    setForm(prev => ({ ...prev, ...extraction.formFields }));
    toast.success("Parameters mapped to underwriting schema!");
    setExtraction(null);
  };

  const handleSubmit = async () => {
    if (!form.applicantName) { toast.error("Applicant name is required"); return; }
    if (!form.applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicantEmail)) { toast.error("Valid contact email is required"); return; }
    setLoading(true);
    try {
      const ps = {}; Object.keys(policyFields[selectedPolicy] || {}).forEach(k => { ps[k] = form[k]; });

      let profileDocs = [];
      try {
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          profileDocs = (profileData.profile?.documents || []).map(d => ({
            name: d.name, url: d.url, type: d.type, docType: d.docType, size: d.size,
          }));
        }
      } catch { /* profile fetch failure is non-blocking */ }

      const allDocs = [...docs, ...profileDocs];
      const body = {
        policyType: selectedPolicy,
        applicant: { name: form.applicantName, email: form.applicantEmail, phone: form.applicantPhone, age: Number(form.age) || 0, gender: form.gender, occupation: form.occupation },
        traditionalData: { income: Number(form.income) || 0, creditScore: Number(form.creditScore) || 0, medicalHistory: form.medicalHistory ? form.medicalHistory.split(",").map(s => s.trim()) : [], existingPolicies: Number(form.existingPolicies) || 0 },
        alternativeData: { telematicsScore: Number(form.telematicsScore) || 50, behavioralScore: Number(form.behavioralScore) || 50, lifestyleScore: Number(form.lifestyleScore) || 50, socialMediaRisk: form.socialMediaRisk, jobStabilityScore: Number(form.jobStabilityScore) || null, digitalFootprint: form.digitalFootprint || null },
        policySpecificData: ps, documents: allDocs,
      };
      const res = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Submission failed"); setLoading(false); return; }
      
      toast.success("Docket registered! Initializing Gemma 4 E4B reasoning pipeline...");
      try {
        await fetch(`/api/assessments/${data.assessment._id}/analyze`, { method: "POST" });
      } catch { /* analysis failure is non-blocking */ }
      fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: form.applicantEmail, name: form.applicantName, assessmentId: data.assessment._id, policyType: selectedPolicy }) }).catch(() => {});
      router.push(`/applicant/dashboard/assessment/${data.assessment._id}`);
    } catch { toast.error("System exception during submission"); }
    setLoading(false);
  };

  /* ── Field helpers ── */
  const cp = selectedPolicy ? policyTypes.find(p => p.id === selectedPolicy) : null;
  const F = (label, key, type = "text", placeholder = "", required = false) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
          {label}{required && <span className="text-rose-500"> *</span>}
        </label>
        <span className="text-[9px] font-mono text-slate-400">[PAR.{key.slice(0,3).toUpperCase()}]</span>
      </div>
      <input
        className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none font-mono"
        type={type}
        placeholder={placeholder}
        value={form[key] || ""}
        onChange={(e) => update(key, e.target.value)}
        style={{
          background: "rgba(10,15,29,0.7)",
          border: "1px solid rgba(59,130,246,0.2)",
          color: "#f8fafc",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = cp?.color || "#3b82f6";
          e.target.style.boxShadow = `0 0 0 3px ${cp?.color || "#3b82f6"}20`;
          e.target.style.background = "rgba(14,21,38,0.9)";
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(59,130,246,0.2)";
          e.target.style.boxShadow = "none";
          e.target.style.background = "rgba(10,15,29,0.7)";
        }}
      />
    </div>
  );

  const S = (label, key, options) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">{label}</label>
        <span className="text-[9px] font-mono text-slate-400">[VEC.{key.slice(0,3).toUpperCase()}]</span>
      </div>
      <select
        className="w-full px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 outline-none appearance-none cursor-pointer font-mono"
        value={form[key] || ""}
        onChange={(e) => update(key, e.target.value)}
        style={{
          background: "rgba(10,15,29,0.7)",
          border: "1px solid rgba(59,130,246,0.2)",
          color: "#f8fafc",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 14px center",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = cp?.color || "#3b82f6";
          e.target.style.boxShadow = `0 0 0 3px ${cp?.color || "#3b82f6"}20`;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "rgba(59,130,246,0.2)";
          e.target.style.boxShadow = "none";
        }}
      >
        {options.map(o => <option key={o.value} value={o.value} style={{ background: "#070a13", color: "#f8fafc" }}>{o.label}</option>)}
      </select>
    </div>
  );

  /* ═══════ POLICY SELECTION ═══════ */
  if (!selectedPolicy) {
    return (
      <PolicySelector
        policyTypes={policyTypes}
        onSelectPolicy={handleSelectPolicy}
        onDemoScenario={handleDemoScenario}
      />
    );
  }

  /* ═══════ FORM SECTIONS ═══════ */
  const g = "grid grid-cols-1 sm:grid-cols-2 gap-5";

  const content = [
    /* Step 0 — Document Upload (AI auto-fills) */
    <div key="s0" className="space-y-6">
      <div className="blueprint-card p-5 relative overflow-hidden">
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.75" strokeLinecap="round"><path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/></svg>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-white tracking-tight">Multi-Modal Optical Calibration & Ingestion</p>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10">[OCR.AUTO_MAP]</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Upload authenticated identity, financial proofs, or health records. The neural pipeline extracts structured parameters directly into the actuarial docket.
            </p>
          </div>
        </div>
      </div>
      <DocumentUploader
        policyColor={cp.color}
        docType={docType}
        onDocTypeChange={setDocType}
        docs={docs}
        onUpload={uploadAndExtract}
        uploading={uploading}
        extracting={extracting}
        extraction={extraction}
        onApplyExtraction={applyExtraction}
        onDismissExtraction={() => setExtraction(null)}
        onRemoveDoc={(i) => setDocs(docs.filter((_, j) => j !== i))}
        DOC_TYPES={DOC_TYPES}
      />
    </div>,
    /* Step 1 — Personal Details */
    <div key="s1" className={g}>
      {F("Full Legal Name","applicantName","text","Enter applicant legal name",true)}
      {F("Encrypted Contact Email","applicantEmail","email","name@domain.com",true)}
      {F("Direct Telephony Route","applicantPhone","tel","+91 98765 43210")}
      {F("Chronological Age (Yrs)","age","number","e.g. 30")}
      {S("Actuarial Gender Class","gender",[{value:"",label:"Select Classification"},{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"other",label:"Non-Binary / Other"}])}
      {F("Primary Occupation Class","occupation","text","e.g. Software Engineer / Data Scientist")}
    </div>,
    /* Step 2 — Policy-Specific Fields */
    <div key="s2">
      <PolicyFormFields policyType={selectedPolicy} color={cp?.color} F={F} S={S} onGeoResult={(data) => {
        if (data?.riskAssessment?.floodRisk?.level) {
          const level = data.riskAssessment.floodRisk.level;
          const mapped = level === "high" ? "high" : level === "moderate" ? "moderate" : level === "low" ? "low" : "none";
          update("floodZone", mapped);
        }
      }} />
    </div>,
    /* Step 3 — Financial */
    <div key="s3" className={g}>
      {F("Gross Annual Income (₹)","income","number","e.g. 1200000")}
      {F("CIBIL / Credit Solvency Score","creditScore","number","300 - 900 Range")}
      {F("Active Concurrent Policies","existingPolicies","number","e.g. 1")}
    </div>,
    /* Step 4 — Review & Submit */
    <div key="s4" className="space-y-6">
      <AssessmentSummary form={form} policy={cp} docsCount={docs.length} />

      {/* Alternative Data enrichment */}
      <div className="blueprint-card p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">[ALTERNATIVE_TELEMETRY_ENRICHMENT]</h3>
          <span className="text-[10px] font-mono text-blue-400">NON-INVASIVE_OPT_IN</span>
        </div>
        <div className="rounded-xl p-4 mb-4 transition-all duration-300" style={{ background: form.consentAlternativeData ? "rgba(37,99,235,0.08)" : "rgba(10,15,29,0.5)", border: `1px solid ${form.consentAlternativeData ? "rgba(59,130,246,0.3)" : "rgba(59,130,246,0.15)"}` }}>
          <label className="flex items-start gap-3.5 cursor-pointer">
            <div className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200" style={{ background: form.consentAlternativeData ? "#2563eb" : "rgba(148,163,184,0.1)", border: form.consentAlternativeData ? "1px solid #3b82f6" : "1px solid rgba(148,163,184,0.2)" }}>
              {form.consentAlternativeData && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </div>
            <input type="checkbox" className="hidden" checked={form.consentAlternativeData} onChange={(e) => update("consentAlternativeData", e.target.checked)} />
            <div>
              <p className="text-sm font-semibold text-white">Enable Real-Time Telemetric & Alternative Risk Scoring</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">Opting into driving kinematics, verified payment regularity, and lifestyle biometrics can lower your premium rate by up to 22%.</p>
            </div>
          </label>
        </div>
        {form.consentAlternativeData && (
          <div className={g}>
            {F("Kinematic Telematics Score (0-100)","telematicsScore","number","Sensor telemetry baseline")}
            {F("Fiscal Behavioral Score (0-100)","behavioralScore","number","Transaction regularity index")}
            {F("Wearable Lifestyle Score (0-100)","lifestyleScore","number","Active biometrics data")}
            {S("Digital Footprint Variance","socialMediaRisk",[{value:"low",label:"Minimal Anomaly (Low)"},{value:"medium",label:"Moderate Variance (Medium)"},{value:"high",label:"Elevated Variance (High)"}])}
          </div>
        )}
      </div>
    </div>,
  ];

  /* ═══════ SPLIT-PANEL FORM LAYOUT ═══════ */
  const progress = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row tech-grid-pattern" style={{ background: "var(--bg-primary, #070a13)" }}>
      {/* ── LEFT PANEL: sticky context ── */}
      <StepSidebar
        policy={cp}
        steps={steps}
        currentStep={step}
        onStepChange={setStep}
        onChangePolicy={() => { setSelectedPolicy(null); setStep(0); }}
      />

      {/* ── RIGHT PANEL: form ── */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile nav */}
        <nav className="lg:hidden h-14 flex items-center justify-between px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs bg-gradient-to-br from-blue-600 to-indigo-700 border border-blue-400/30">U</div>
            <span className="font-bold text-sm text-white">Underwrite<span className="text-blue-500">AI</span></span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-blue-500/20 bg-blue-500/10">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cp.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{cp.icon}</svg>
            <span className="text-[10px] font-mono font-bold" style={{ color: cp.color }}>{cp.label}</span>
          </div>
        </nav>

        {/* Mobile stepper */}
        <div className="lg:hidden px-6 pt-4">
          <div className="h-1 rounded-full overflow-hidden mb-3 bg-slate-900 border border-slate-800">
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: cp.gradient }} />
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {steps.map((s, i) => (
              <button key={s.label} onClick={() => setStep(i)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 transition-all font-mono" style={{ background: i < step ? cp.gradient : i === step ? `${cp.color}15` : "rgba(10,15,29,0.5)", border: i === step ? `1px solid ${cp.color}40` : "1px solid rgba(59,130,246,0.15)", cursor: "pointer" }}>
                {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={i === step ? cp.color : "#64748b"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>}
                <span className="text-[10px] font-medium" style={{ color: i < step ? "#fff" : i === step ? cp.color : "#94a3b8" }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 px-6 sm:px-10 lg:px-16 xl:px-20 py-8 lg:py-12">
          <div className="max-w-3xl">
            {/* Section header */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[STAGE 0{step + 1} // CALIBRATION]</span>
                <span className="text-[10px] font-mono text-slate-400">INTAKE_DOCKET_{cp.id.toUpperCase()}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                {step === 2 ? `${cp.full} Actuarial Parameters` : steps[step].title}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">{steps[step].sub}</p>
            </div>

            {/* Form fields */}
            <div>
              {content[step]}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 px-6 sm:px-10 lg:px-16 xl:px-20 py-4 border-t border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
          <div className="max-w-3xl flex items-center justify-between">
            <button onClick={() => step > 0 ? setStep(step - 1) : (setSelectedPolicy(null), setStep(0))}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-mono font-medium transition-all duration-200 border border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800 hover:text-white cursor-pointer">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              {step === 0 ? "RETURN_TO_SELECTOR" : "PREVIOUS_STAGE"}
            </button>

            <div className="hidden sm:block text-[11px] font-mono text-slate-400">
              [PROGRESS: {step + 1}/5 STEPS // {progress}%]
            </div>

            {step < 4 ? (
              <button onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/20"
                style={{ background: cp.gradient }}>
                ADVANCE_STAGE <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="inline-flex items-center gap-2 px-7 py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider text-white transition-all duration-200 cursor-pointer shadow-lg shadow-blue-600/30"
                style={{ background: loading ? "#334155" : cp.gradient }}>
                {loading ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white inline-block animate-spin" />
                    DISPATCHING_TELEMETRY...
                  </>
                ) : (
                  <>
                    DISPATCH_FOR_REASONING <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
