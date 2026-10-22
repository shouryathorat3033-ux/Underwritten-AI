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
  { id: "health", label: "Health", full: "Health Insurance", desc: "Medical history, BMI, pre-existing conditions, wearable health data", icon: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />, color: "#10b981", gradient: "linear-gradient(135deg, #10b981, #059669)" },
  { id: "auto", label: "Auto", full: "Auto Insurance", desc: "Vehicle details, driving history, telematics, GPS & speed behavior", icon: <><rect x="1" y="3" width="15" height="13" rx="2" /><path d="M16 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2M8 21v-4M16 21v-4M3 16h18" /></>, color: "#f59e0b", gradient: "linear-gradient(135deg, #f59e0b, #d97706)" },
  { id: "life", label: "Life", full: "Life Insurance", desc: "Age, income, family history, lifestyle habits, wearable vitals", icon: <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />, color: "#ef4444", gradient: "linear-gradient(135deg, #ef4444, #dc2626)" },
  { id: "property", label: "Property", full: "Property Insurance", desc: "Location, building age, IoT sensors, weather risk, neighbourhood data", icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>, color: "#8b5cf6", gradient: "linear-gradient(135deg, #8b5cf6, #7c3aed)" },
];

const commonFields = { applicantName: "", applicantEmail: "", applicantPhone: "", age: "", gender: "", occupation: "", income: "", creditScore: "", existingPolicies: "", telematicsScore: "", behavioralScore: "", lifestyleScore: "", socialMediaRisk: "low", jobStabilityScore: "", consentAlternativeData: false };
const policyFields = {
  health: { bmi: "", bloodPressure: "", smokingStatus: "never", exerciseFrequency: "", medicalHistory: "", currentMedications: "", familyHealthHistory: "" },
  auto: { vehicleMake: "", vehicleYear: "", vehicleType: "", drivingYears: "", accidentsLast5: "", trafficViolations: "", dailyCommute: "" },
  life: { maritalStatus: "", dependents: "", smokingStatus: "never", alcoholFrequency: "", exerciseFrequency: "", familyHistory: "", existingLifePolicies: "" },
  property: { propertyType: "", propertyAge: "", propertyValue: "", squareFootage: "", constructionType: "", floodZone: "no", securitySystem: "no" },
};

const steps = [
  { label: "Documents", title: "Upload Documents", sub: "Upload Aadhaar, PAN, salary slips — AI will auto-fill your details", icon: <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></> },
  { label: "Personal", title: "Your Details", sub: "Verify auto-filled info or enter manually", icon: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
  { label: "Policy", title: "Policy Details", sub: "Specific details for your policy type", icon: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></> },
  { label: "Financial", title: "Financial Information", sub: "Income and credit details for premium calculation", icon: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></> },
  { label: "Review", title: "Review & Submit", sub: "Review your application and submit for AI analysis", icon: <><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></> },
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

    // 2) From most recent assessment (age, gender, phone, occupation, income, etc.)
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
        // Still apply session data even if assessment fetch fails
        if (Object.keys(prefill).length > 0) {
          setForm(prev => ({ ...prev, ...prefill }));
        }
        setProfileLoaded(true);
      });
  }, [session, profileLoaded]);

  const update = (key, val) => setForm(prev => ({ ...prev, [key]: val }));
  const handleSelectPolicy = (id) => {
    setSelectedPolicy(id);
    // Preserve pre-filled user data, only reset policy-specific fields
    setForm(prev => {
      const base = { ...commonFields, ...policyFields[id] };
      // Keep any values from prev that were pre-filled (non-empty, non-default)
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
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }

    // Step 1: Upload to Cloudinary
    setUploading(true);
    setExtraction(null);
    let uploadData;
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      uploadData = await res.json();
      if (!res.ok) { toast.error(uploadData.error || "Upload failed"); setUploading(false); return; }
      toast.success(`Uploaded ${uploadData.name}`);
    } catch { toast.error("Upload failed"); setUploading(false); return; }
    setUploading(false);

    // Step 2: Verify document authenticity
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
          toast.error("Document appears to be AI-generated or fake", { id: "verify" });
        } else if (verification.verdict === "suspicious") {
          toast.error("Document flagged for review — proceeding with caution", { id: "verify", icon: "⚠️" });
        } else {
          toast.success("Document verified as authentic", { id: "verify" });
        }
      } else {
        toast.dismiss("verify");
      }
    } catch { toast.dismiss("verify"); }

    // Add doc to list with verification result
    setDocs(prev => [...prev, { name: uploadData.name, type: uploadData.type, url: uploadData.url, size: uploadData.size, docType, uploadedAt: new Date().toISOString(), verification }]);

    // Step 3: AI extraction (only if not likely_fake)
    if (verification?.verdict === "likely_fake") {
      toast.error("Skipping data extraction — document failed authenticity check");
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
        toast.success(`AI extracted ${data.fieldsCount} fields from ${uploadData.name}`);
      } else {
        toast.error("Could not extract data from this document");
      }
    } catch { toast.error("AI extraction failed"); }
    setExtracting(false);
  }, [docType]);

  const applyExtraction = () => {
    if (!extraction) return;
    setForm(prev => ({ ...prev, ...extraction.formFields }));
    toast.success("Form auto-filled with extracted data!");
    setExtraction(null);
  };

  const handleSubmit = async () => {
    if (!form.applicantName) { toast.error("Your name is required"); return; }
    if (!form.applicantEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.applicantEmail)) { toast.error("Valid email is required"); return; }
    setLoading(true);
    try {
      const ps = {}; Object.keys(policyFields[selectedPolicy] || {}).forEach(k => { ps[k] = form[k]; });

      // Fetch profile documents to auto-attach
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
      // Trigger AI analysis immediately after creation
      toast.success("Assessment submitted! Running AI analysis...");
      try {
        await fetch(`/api/assessments/${data.assessment._id}/analyze`, { method: "POST" });
      } catch { /* analysis failure is non-blocking */ }
      fetch("/api/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: form.applicantEmail, name: form.applicantName, assessmentId: data.assessment._id, policyType: selectedPolicy }) }).catch(() => {});
      router.push(`/applicant/dashboard/assessment/${data.assessment._id}`);
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  /* ── Field helpers ── */
  const cp = selectedPolicy ? policyTypes.find(p => p.id === selectedPolicy) : null;
  const F = (label, key, type = "text", placeholder = "", required = false) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{label}{required && <span style={{ color: "#ef4444" }}> *</span>}</label>
      <input className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 outline-none" type={type} placeholder={placeholder} value={form[key] || ""} onChange={(e) => update(key, e.target.value)}
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#fafafa", fontFamily: "inherit" }}
        onFocus={(e) => { e.target.style.borderColor = cp?.color + "60"; e.target.style.boxShadow = `0 0 0 3px ${cp?.color}12`; e.target.style.background = "rgba(255,255,255,0.05)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "none"; e.target.style.background = "rgba(255,255,255,0.03)"; }} />
    </div>
  );
  const S = (label, key, options) => (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>{label}</label>
      <select className="w-full px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 outline-none appearance-none cursor-pointer" value={form[key] || ""} onChange={(e) => update(key, e.target.value)}
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", color: "#fafafa", fontFamily: "inherit", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2371717a' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}
        onFocus={(e) => { e.target.style.borderColor = cp?.color + "60"; e.target.style.boxShadow = `0 0 0 3px ${cp?.color}12`; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; e.target.style.boxShadow = "none"; }}>
        {options.map(o => <option key={o.value} value={o.value} style={{ background: "#15151a", color: "#fafafa" }}>{o.label}</option>)}
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
    <div key="s0">
      <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.12)" }}>
        <div className="flex items-start gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" className="shrink-0 mt-0.5"><path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z"/><path d="M10 22v-4M14 22v-4M10 18h4"/></svg>
          <div>
            <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>Upload documents to auto-fill your application</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: "#71717a" }}>Our AI reads Aadhaar, PAN, salary slips, medical reports, driving license, and vehicle RC — then auto-fills all the relevant fields. You can also skip this and fill manually.</p>
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
    /* Step 1 — Personal Details (verify auto-filled or enter manually) */
    <div key="s1" className={g}>{F("Full Name","applicantName","text","Enter your full name",true)}{F("Email Address","applicantEmail","email","you@example.in",true)}{F("Phone Number","applicantPhone","tel","+91 98765 43210")}{F("Age","age","number","e.g. 30")}{S("Gender","gender",[{value:"",label:"Select Gender"},{value:"male",label:"Male"},{value:"female",label:"Female"},{value:"other",label:"Other"}])}{F("Occupation","occupation","text","e.g. Software Engineer")}</div>,
    /* Step 2 — Policy-Specific Fields */
    <div key="s2"><PolicyFormFields policyType={selectedPolicy} color={cp?.color} F={F} S={S} onGeoResult={(data) => {
      if (data?.riskAssessment?.floodRisk?.level) {
        const level = data.riskAssessment.floodRisk.level;
        const mapped = level === "high" ? "high" : level === "moderate" ? "moderate" : level === "low" ? "low" : "none";
        update("floodZone", mapped);
      }
    }} /></div>,
    /* Step 3 — Financial */
    <div key="s3" className={g}>{F("Annual Income (₹)","income","number","e.g. 800000")}{F("Credit Score (CIBIL)","creditScore","number","300-900")}{F("Existing Policies","existingPolicies","number","e.g. 1")}</div>,
    /* Step 4 — Review & Submit (summary + optional alt data + digital footprint) */
    <div key="s4">
      <AssessmentSummary form={form} policy={cp} docsCount={docs.length} />

      {/* Optional: Alternative Data enrichment */}
      <div className="mt-6">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#52525b" }}>Optional: Boost your score with alternative data</h3>
        <div className="rounded-2xl p-5 mb-4 transition-all duration-300" style={{ background: form.consentAlternativeData ? `${cp.color}08` : "rgba(255,255,255,0.02)", border: `1px solid ${form.consentAlternativeData ? cp.color + "20" : "rgba(255,255,255,0.06)"}` }}>
          <label className="flex items-start gap-4 cursor-pointer">
            <div className="mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-all duration-200" style={{ background: form.consentAlternativeData ? cp.color : "rgba(255,255,255,0.06)", border: form.consentAlternativeData ? "none" : "1px solid rgba(255,255,255,0.1)" }}>
              {form.consentAlternativeData && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>}
            </div>
            <input type="checkbox" className="hidden" checked={form.consentAlternativeData} onChange={(e) => update("consentAlternativeData", e.target.checked)} />
            <div><p className="text-sm font-semibold" style={{ color: "#fafafa" }}>I consent to alternative data collection</p><p className="text-xs mt-1 leading-relaxed" style={{ color: "#71717a" }}>Telematics, behavioral analytics, and digital footprint may lower your premium.</p></div>
          </label>
        </div>
        {form.consentAlternativeData && (
          <div className={g}>{F("Telematics Score (0-100)","telematicsScore","number","From connected device")}{F("Behavioral Score (0-100)","behavioralScore","number","From financial analytics")}{F("Lifestyle Score (0-100)","lifestyleScore","number","From wearable/health app")}{S("Social Media Risk","socialMediaRisk",[{value:"low",label:"Low"},{value:"medium",label:"Medium"},{value:"high",label:"High"}])}</div>
        )}
      </div>
    </div>,
  ];

  /* ═══════ SPLIT-PANEL FORM LAYOUT ═══════ */
  const progress = ((step + 1) / 5) * 100;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row" style={{ background: "#09090b" }}>
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
        <nav className="lg:hidden h-14 flex items-center justify-between px-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white text-xs" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>U</div>
            <span className="font-bold text-sm" style={{ color: "#fafafa" }}>Underwrite<span style={{ color: "#10b981" }}>AI</span></span>
          </Link>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${cp.color}10`, border: `1px solid ${cp.color}20` }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={cp.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{cp.icon}</svg>
            <span className="text-[10px] font-semibold" style={{ color: cp.color }}>{cp.label}</span>
          </div>
        </nav>

        {/* Mobile stepper */}
        <div className="lg:hidden px-6 pt-4">
          <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "rgba(255,255,255,0.04)" }}>
            <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%`, background: cp.gradient }} />
          </div>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {steps.map((s, i) => (
              <button key={s.label} onClick={() => setStep(i)} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg shrink-0 transition-all duration-200" style={{ background: i < step ? cp.gradient : i === step ? `${cp.color}15` : "rgba(255,255,255,0.02)", border: i === step ? `1px solid ${cp.color}25` : "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                {i < step ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={i === step ? cp.color : "#3f3f46"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{s.icon}</svg>}
                <span className="text-[10px] font-medium" style={{ color: i < step ? "#fff" : i === step ? cp.color : "#52525b" }}>{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <div className="flex-1 px-6 sm:px-10 lg:px-16 xl:px-20 py-8 lg:py-14">
          <div className="max-w-2xl">
            {/* Section header */}
            <div className="mb-8" style={{ animation: "fade-up 0.4s cubic-bezier(0.16,1,0.3,1) both" }}>
              <h2 className="text-2xl sm:text-3xl font-extrabold mb-2" style={{ color: "#fafafa" }}>
                {step === 2 ? `${cp.full} Details` : steps[step].title}
              </h2>
              <p className="text-sm" style={{ color: "#52525b" }}>{steps[step].sub}</p>
            </div>

            {/* Form fields */}
            <div style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) 60ms both" }}>
              {content[step]}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sticky bottom-0 px-6 sm:px-10 lg:px-16 xl:px-20 py-5" style={{ background: "rgba(9,9,11,0.9)", backdropFilter: "blur(12px)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <div className="max-w-2xl flex items-center justify-between">
            <button onClick={() => step > 0 ? setStep(step - 1) : (setSelectedPolicy(null), setStep(0))}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "#a1a1aa", cursor: "pointer" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "#fafafa"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.color = "#a1a1aa"; }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
              {step === 0 ? "Back" : "Previous"}
            </button>

            <div className="hidden sm:block text-[11px] font-medium" style={{ color: "#3f3f46" }}>Step {step + 1} of 5</div>

            {step < 4 ? (
              <button onClick={() => setStep(step + 1)}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: cp.gradient, boxShadow: `0 4px 20px ${cp.color}25`, cursor: "pointer", border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = `0 8px 30px ${cp.color}35`; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${cp.color}25`; }}>
                Continue <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{ background: loading ? "#3f3f46" : cp.gradient, boxShadow: loading ? "none" : `0 4px 20px ${cp.color}25`, cursor: loading ? "wait" : "pointer", border: "none" }}>
                {loading ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white inline-block" style={{ animation: "spin-anim 1s linear infinite" }} />Submitting...</> : <>Submit Assessment <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
