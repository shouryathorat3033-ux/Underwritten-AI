"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import AskAI from "@/components/ui/AskAI";

const PC = { health: "#3b82f6", auto: "#f59e0b", life: "#f43f5e", property: "#8b5cf6" };

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card", icon: "ID", desc: "Identity, age, gender, address telemetry" },
  { value: "pan", label: "PAN Card", icon: "PAN", desc: "Tax authority solvency verification" },
  { value: "salary_slip", label: "Salary Slip / Form 16", icon: "₹", desc: "Fiscal liquidity & employer verification" },
  { value: "medical_report", label: "Medical Report", icon: "+", desc: "Biomarkers, BMI, clinical history" },
  { value: "driving_license", label: "Driving License", icon: "DL", desc: "Kinematics history, license class" },
  { value: "vehicle_rc", label: "Vehicle RC", icon: "RC", desc: "Vehicle make, year, telemetry spec" },
  { value: "property_document", label: "Property Document", icon: "🏠", desc: "Asset value, structural specs" },
  { value: "insurance_document", label: "Insurance Policy", icon: "📋", desc: "Historical policy schedule" },
];

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  // Document upload state
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");
  const [extraction, setExtraction] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/profile");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setProfile(data.profile);
      setAssessments(data.assessments || []);
    } catch { setError("Failed to load profile telemetry"); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const startEdit = (section) => {
    setEditing(section);
    setEditData(profile?.[section] || {});
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editing]: editData }),
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setEditing(null);
        toast.success("Profile parameters synchronized");
      }
    } catch { toast.error("Synchronization failed"); }
    setSaving(false);
  };

  /* ═══════ DOCUMENT UPLOAD + EXTRACTION ═══════ */
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds limit (max 10MB)"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) { toast.error("Upload failed"); setUploading(false); return; }
      const uploadData = await uploadRes.json();
      setUploading(false);

      setExtracting(true);
      const extractRes = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: selectedDocType,
          documentUrl: uploadData.url,
          documentText: "",
          fileName: uploadData.name,
        }),
      });

      if (!extractRes.ok) {
        toast.error("Telemetry extraction failed");
        setExtracting(false);
        return;
      }

      const extractData = await extractRes.json();
      setExtraction({
        extracted: extractData.extracted,
        formFields: extractData.formFields,
        documentUrl: uploadData.url,
        fileName: uploadData.name,
        fileType: uploadData.type,
        fileSize: uploadData.size,
        docType: selectedDocType,
      });
      setExtracting(false);
      toast.success("Optical telemetry calibrated! Review before committing.");
    } catch {
      toast.error("Telemetry pipeline exception");
      setUploading(false);
      setExtracting(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const confirmExtraction = async () => {
    if (!extraction) return;
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document: {
            name: extraction.fileName,
            type: extraction.fileType,
            docType: extraction.docType,
            url: extraction.documentUrl,
            size: extraction.fileSize,
            extractedData: extraction.extracted,
            uploadedAt: new Date().toISOString(),
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setExtraction(null);
        toast.success("Document payload committed and profile updated!");
      } else {
        toast.error("Failed to commit telemetry");
      }
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const discardExtraction = () => {
    setExtraction(null);
  };

  if (error) return <div><Breadcrumbs /><ErrorState message={error} onRetry={fetchProfile} /></div>;

  const p = profile?.personal || {};
  const f = profile?.financial || {};
  const h = profile?.health || {};
  const v = profile?.vehicle || {};
  const alt = profile?.alternativeData || {};

  return (
    <div className="space-y-6">
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-blue-500/20 text-blue-400 bg-blue-500/5">[IDENTITY.PROFILE // TELEMETRY]</span>
            <span className="text-[10px] font-mono text-slate-400">CREDENTIAL_VAULT</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Applicant Verification Profile</h1>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Encrypted personal coordinates, document locker, and verified biometric inputs
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto">
          {profile && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-blue-500/30 bg-blue-500/10 font-mono">
              <span className="text-base font-extrabold text-blue-400">{profile.completeness}%</span>
              <span className="text-[10px] uppercase text-slate-400">CALIBRATED</span>
            </div>
          )}
          <AskAI question="What data is missing from my profile and how would completing it improve my risk score?" label="Analyze Readiness" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div>
      ) : (
        <>
          {/* ═══════ DOCUMENT UPLOAD SECTION ═══════ */}
          <div className="blueprint-card p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
                [OPTICAL_TELEMETRY_INGESTION]
              </h3>
              <span className="text-[9px] font-mono text-blue-400">OCR_MAP_V3</span>
            </div>
            <p className="text-xs font-mono text-slate-400 mb-4">
              Upload authenticated identity, financial proofs, or health records — parameters auto-populate into your underwriting docket
            </p>

            {/* Doc type selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DOC_TYPES.map(dt => (
                <button key={dt.value} onClick={() => setSelectedDocType(dt.value)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 border cursor-pointer"
                  style={{
                    background: selectedDocType === dt.value ? "rgba(37,99,235,0.15)" : "rgba(10,15,29,0.6)",
                    borderColor: selectedDocType === dt.value ? "rgba(59,130,246,0.35)" : "rgba(59,130,246,0.15)",
                    color: selectedDocType === dt.value ? "#38bdf8" : "#94a3b8",
                  }}>
                  <span className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center border"
                    style={{
                      background: selectedDocType === dt.value ? "rgba(37,99,235,0.2)" : "rgba(148,163,184,0.05)",
                      borderColor: selectedDocType === dt.value ? "rgba(59,130,246,0.3)" : "rgba(148,163,184,0.1)",
                      color: selectedDocType === dt.value ? "#38bdf8" : "#64748b",
                    }}>
                    {dt.icon}
                  </span>
                  {dt.label}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div
              className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200 border-2 border-dashed"
              style={{
                background: dragOver ? "rgba(37,99,235,0.08)" : "rgba(10,15,29,0.4)",
                borderColor: dragOver ? "rgba(59,130,246,0.5)" : "rgba(59,130,246,0.2)",
              }}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={(e) => { if (e.target.files[0]) handleFileUpload(e.target.files[0]); e.target.value = ""; }} />

              {uploading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-slate-700 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-blue-400">[TRANSMITTING_ENCRYPTED_PAYLOAD...]</p>
                </div>
              ) : extracting ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-t-blue-500 border-slate-700 rounded-full animate-spin" />
                  <p className="text-xs font-mono text-blue-400">[NEURAL_OCR_PARSING_PARAMETERS...]</p>
                  <p className="text-[10px] font-mono text-slate-500">Processing {DOC_TYPES.find(d => d.value === selectedDocType)?.label}</p>
                </div>
              ) : (
                <>
                  <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <p className="text-sm font-mono font-bold text-white mb-1">
                    Drop your <strong className="text-blue-400">{DOC_TYPES.find(d => d.value === selectedDocType)?.label}</strong> payload here
                  </p>
                  <p className="text-[10px] font-mono text-slate-500">PDF, JPG, PNG up to 10MB — Target: {DOC_TYPES.find(d => d.value === selectedDocType)?.desc}</p>
                </>
              )}
            </div>
          </div>

          {/* ═══════ EXTRACTION CONFIRMATION MODAL ═══════ */}
          {extraction && (
            <div className="blueprint-card p-6 border-amber-500/30 bg-amber-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  [REVIEW_EXTRACTED_TELEMETRY: {DOC_TYPES.find(d => d.value === extraction.docType)?.label.toUpperCase()}]
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30 text-amber-400 bg-amber-500/10">{extraction.fileName}</span>
              </div>

              <p className="text-xs font-mono text-slate-400 mb-4">Neural pipeline extracted the following candidate parameters. Confirm to bind into profile schema.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 font-mono">
                {Object.entries(extraction.extracted || {}).map(([key, value]) => {
                  if (!value || value === "" || value === "null" || value === "N/A") return null;
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).replace("_", " ");
                  return (
                    <div key={key} className="flex justify-between items-center p-3 rounded-xl border border-slate-800/80 bg-slate-950/60 text-xs">
                      <span className="text-slate-400 uppercase text-[10px]">{label}</span>
                      <span className="text-white font-bold">{String(value)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={confirmExtraction} disabled={saving}
                  className="btn-primary flex items-center gap-2 px-5 py-2.5 text-xs font-mono uppercase tracking-wider cursor-pointer"
                  style={{ opacity: saving ? 0.6 : 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  {saving ? "COMMITTING..." : "CONFIRM_AND_BIND"}
                </button>
                <button onClick={discardExtraction}
                  className="px-5 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white cursor-pointer">
                  DISCARD_PAYLOAD
                </button>
              </div>
            </div>
          )}

          {/* Completeness bar */}
          <div className="blueprint-card p-5 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 font-mono">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">[ACTUARIAL_READINESS_METRIC]</span>
              <span className="text-sm font-bold text-blue-400">{profile?.completeness || 0}% CALIBRATED</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: `${profile?.completeness || 0}%`,
                background: "linear-gradient(90deg, #2563eb, #38bdf8)",
                boxShadow: "0 0 10px rgba(37,99,235,0.4)",
              }} />
            </div>
            <p className="text-[10px] font-mono text-slate-500 mt-2">
              {profile?.completeness < 50 ? "Upload Aadhaar, PAN, and salary slip to rapidly reach baseline underwriting clearance" :
               profile?.completeness < 80 ? "Telemetry advancing optimally. Attach medical reports or vehicle kinematics to unlock preferred tier" :
               "Optimal telemetry density achieved. Ready for real-time automated policy binding"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — data sections */}
            <div className="lg:col-span-2 space-y-4">
              {/* Personal */}
              <Section title="Demographic Coordinates" section="personal" editing={editing} onEdit={() => startEdit("personal")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Full Legal Name" value={p.name} editKey={editing === "personal" ? "name" : null} editData={editData} setEditData={setEditData} />
                <Field label="Encrypted Email" value={p.email} editKey={editing === "personal" ? "email" : null} editData={editData} setEditData={setEditData} />
                <Field label="Contact Telephony" value={p.phone} editKey={editing === "personal" ? "phone" : null} editData={editData} setEditData={setEditData} />
                <Field label="Chronological Age" value={p.age ? `${p.age} Yrs` : null} editKey={editing === "personal" ? "age" : null} editData={editData} setEditData={setEditData} />
                <Field label="Actuarial Gender Class" value={p.gender} editKey={editing === "personal" ? "gender" : null} editData={editData} setEditData={setEditData} />
                <Field label="Occupation Vector" value={p.occupation} editKey={editing === "personal" ? "occupation" : null} editData={editData} setEditData={setEditData} />
                <Field label="Aadhaar Hash" value={p.aadhaarNumber ? `XXXX-XXXX-${p.aadhaarNumber.slice(-4)}` : null} editData={editData} setEditData={setEditData} />
                <Field label="PAN Registry" value={p.panNumber} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Financial */}
              <Section title="Fiscal Solvency Coordinates" section="financial" editing={editing} onEdit={() => startEdit("financial")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Gross Annual Income" value={f.income ? `₹${Number(f.income).toLocaleString("en-IN")}` : null} editKey={editing === "financial" ? "income" : null} editData={editData} setEditData={setEditData} />
                <Field label="Credit Score (CIBIL)" value={f.creditScore} editKey={editing === "financial" ? "creditScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Employer Entity" value={f.employer} editKey={editing === "financial" ? "employer" : null} editData={editData} setEditData={setEditData} />
                <Field label="Active Concurrency" value={f.existingPolicies} editKey={editing === "financial" ? "existingPolicies" : null} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Health */}
              <Section title="Biometric Health Telemetry" section="health" editing={editing} onEdit={() => startEdit("health")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="BMI Index" value={h.bmi} editKey={editing === "health" ? "bmi" : null} editData={editData} setEditData={setEditData} />
                <Field label="Blood Pressure Range" value={h.bloodPressure} editKey={editing === "health" ? "bloodPressure" : null} editData={editData} setEditData={setEditData} />
                <Field label="Smoking Vector" value={h.smokingStatus} editKey={editing === "health" ? "smokingStatus" : null} editData={editData} setEditData={setEditData} />
                <Field label="Physical Activity (days/wk)" value={h.exerciseFrequency} editKey={editing === "health" ? "exerciseFrequency" : null} editData={editData} setEditData={setEditData} />
                <Field label="Medical Record Notes" value={h.medicalHistory?.join(", ")} editData={editData} setEditData={setEditData} />
                <Field label="Active Pharmaceutical Regimen" value={h.currentMedications?.join(", ")} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Vehicle */}
              <Section title="Kinematic Vehicle Telemetry" section="vehicle" editing={editing} onEdit={() => startEdit("vehicle")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Make & Model" value={v.make} editKey={editing === "vehicle" ? "make" : null} editData={editData} setEditData={setEditData} />
                <Field label="Production Year" value={v.year} editKey={editing === "vehicle" ? "year" : null} editData={editData} setEditData={setEditData} />
                <Field label="Chassis Type" value={v.type} editKey={editing === "vehicle" ? "type" : null} editData={editData} setEditData={setEditData} />
                <Field label="Registration Certificate" value={v.registrationNumber} editData={editData} setEditData={setEditData} />
                <Field label="Years of Operation" value={v.drivingYears} editKey={editing === "vehicle" ? "drivingYears" : null} editData={editData} setEditData={setEditData} />
                <Field label="Historical Claims (5yr)" value={v.accidentsLast5} editKey={editing === "vehicle" ? "accidentsLast5" : null} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Alternative Data */}
              <Section title="Alternative Telemetric Scoring" section="alternativeData" editing={editing} onEdit={() => startEdit("alternativeData")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Connected Telematics Score" value={alt.telematicsScore} editKey={editing === "alternativeData" ? "telematicsScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Fiscal Behavioral Index" value={alt.behavioralScore} editKey={editing === "alternativeData" ? "behavioralScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Wearable Lifestyle Metric" value={alt.lifestyleScore} editKey={editing === "alternativeData" ? "lifestyleScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Digital Variance Tolerance" value={alt.socialMediaRisk} editKey={editing === "alternativeData" ? "socialMediaRisk" : null} editData={editData} setEditData={setEditData} />
              </Section>
            </div>

            {/* Right column — documents + assessments + actions */}
            <div className="space-y-4">
              {/* Uploaded documents */}
              <div className="blueprint-card p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">[SEALED_EVIDENCE_LOCKER]</h3>
                  <span className="font-mono text-xs font-bold text-blue-400">COUNT: {profile?.documents?.length || 0}</span>
                </div>
                {(!profile?.documents || profile.documents.length === 0) ? (
                  <p className="text-xs font-mono text-center py-4 text-slate-500">[NO_DOCUMENTS_REGISTERED]</p>
                ) : (
                  <div className="space-y-3">
                    {profile.documents.map((doc, i) => {
                      const isImage = doc.url && /\.(jpg|jpeg|png|webp)/i.test(doc.url);
                      const docLabel = DOC_TYPES.find(d => d.value === doc.docType)?.label || doc.docType || doc.type || "Document";
                      const extractedFields = doc.extractedData ? Object.entries(doc.extractedData).filter(([, v]) => v && v !== "") : [];
                      return (
                        <div key={i} className="rounded-xl overflow-hidden border border-slate-800/80 bg-slate-950/40">
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 no-underline">
                            {isImage && doc.url ? (
                              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-800">
                                <img src={doc.url} alt={doc.name} className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-14 h-14 rounded-lg flex items-center justify-center shrink-0 border border-blue-500/20 bg-blue-500/10">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-xs font-mono font-bold truncate text-white uppercase">{docLabel}</p>
                                {doc.extractedData && (
                                  <span className="text-[8px] font-mono px-1.5 py-0.5 rounded border border-blue-500/30 text-blue-400 bg-blue-500/10 shrink-0">OCR_BOUND</span>
                                )}
                              </div>
                              <p className="text-[11px] font-mono truncate text-slate-400">{doc.name}</p>
                              <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}
                              </p>
                            </div>
                          </a>

                          {extractedFields.length > 0 && (
                            <div className="px-3 pb-3">
                              <div className="rounded-lg p-2 border border-blue-500/20 bg-blue-500/5 font-mono">
                                <p className="text-[8px] font-bold uppercase tracking-wider text-blue-400 mb-1">[EXTRACTED_VECTORS]</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px]">
                                  {extractedFields.slice(0, 4).map(([key, val]) => (
                                    <span key={key} className="text-slate-300">
                                      <span className="text-slate-500">{key.replace(/([A-Z])/g, " $1").trim()}: </span>
                                      {String(val).slice(0, 20)}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Assessment history */}
              <div className="blueprint-card p-5 relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">[HISTORICAL_DOCKETS]</h3>
                  <span className="font-mono text-xs font-bold text-blue-400">RECORDS: {assessments.length}</span>
                </div>
                {assessments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs font-mono text-slate-500 mb-3">[NO_DOCKETS_ON_FILE]</p>
                    <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs font-mono uppercase tracking-wider inline-block px-4 py-2">
                      DISPATCH_INTAKE
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assessments.slice(0, 6).map((a) => (
                      <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="flex items-center gap-3 p-2.5 rounded-xl no-underline border border-slate-800/60 bg-slate-950/40 hover:bg-slate-900/60 transition-colors">
                        <div className="w-1.5 h-7 rounded-full" style={{ background: PC[a.policyType] || "#3b82f6" }} />
                        <div className="flex-1 min-w-0 font-mono">
                          <p className="text-xs font-bold truncate text-white uppercase">{a.policyType} DOCKET</p>
                          <p className="text-[10px] text-slate-500">{new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ID #{a._id.slice(-6).toUpperCase()}</p>
                        </div>
                        {a.result?.riskScore != null && (
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">
                            {a.result.riskScore}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="blueprint-card p-5 relative overflow-hidden">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider mb-4 text-white">[RAPID_DISPATCH]</h3>
                <div className="space-y-2 font-mono">
                  <Link href="/applicant/dashboard/assess" className="flex items-center gap-2.5 p-3 rounded-xl no-underline border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 transition-colors text-xs font-bold text-blue-400 uppercase tracking-wider">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    <span>INITIATE_NEW_ASSESSMENT</span>
                  </Link>
                  <Link href="/applicant/dashboard/history" className="flex items-center gap-2.5 p-3 rounded-xl no-underline border border-slate-800 bg-slate-900/50 hover:bg-slate-800/80 transition-colors text-xs text-slate-300 uppercase tracking-wider">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                    <span>VIEW_ALL_RECORDS</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Editable Field ── */
function Field({ label, value, editKey, editData, setEditData }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-800/60 font-mono">
      <span className="text-xs text-slate-400 uppercase text-[10px]">{label}</span>
      {editKey ? (
        <input value={editData[editKey] || ""} onChange={(e) => setEditData(prev => ({ ...prev, [editKey]: e.target.value }))}
          className="text-xs font-medium text-right rounded-lg px-2.5 py-1 outline-none font-mono"
          style={{ background: "rgba(10,15,29,0.9)", border: "1px solid rgba(59,130,246,0.3)", color: "#f8fafc", width: 180 }} />
      ) : (
        <span className="text-xs font-bold text-white">{value || "\u2014"}</span>
      )}
    </div>
  );
}

/* ── Reusable Section Card ── */
function Section({ title, section, editing, onEdit, onSave, onCancel, saving, children }) {
  const isEditing = editing === section;
  return (
    <div className="blueprint-card p-5 relative overflow-hidden">
      <div className="flex items-center justify-between mb-3 font-mono">
        <h3 className="text-xs font-bold uppercase tracking-wider text-white">[{title.toUpperCase()}]</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={onSave} disabled={saving} className="text-xs font-mono font-bold px-3 py-1 rounded-lg border border-blue-500/30 text-blue-400 bg-blue-500/10 cursor-pointer uppercase">
              {saving ? "SAVING..." : "COMMIT"}
            </button>
            <button onClick={onCancel} className="text-xs font-mono px-3 py-1 rounded-lg border border-slate-800 text-slate-400 hover:text-white cursor-pointer uppercase">
              CANCEL
            </button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-xs font-mono px-3 py-1 rounded-lg border border-slate-800 text-slate-400 hover:text-blue-400 hover:border-blue-500/30 transition-colors cursor-pointer uppercase">
            CALIBRATE
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
