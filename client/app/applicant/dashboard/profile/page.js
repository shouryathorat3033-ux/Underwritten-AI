"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import toast from "react-hot-toast";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import AskAI from "@/components/ui/AskAI";

const PC = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };

const DOC_TYPES = [
  { value: "aadhaar", label: "Aadhaar Card", icon: "ID", desc: "Name, age, gender, address" },
  { value: "pan", label: "PAN Card", icon: "PAN", desc: "Name, PAN number" },
  { value: "salary_slip", label: "Salary Slip / Form 16", icon: "₹", desc: "Income, employer" },
  { value: "medical_report", label: "Medical Report", icon: "+", desc: "BMI, BP, conditions" },
  { value: "driving_license", label: "Driving License", icon: "DL", desc: "Driving years, vehicle class" },
  { value: "vehicle_rc", label: "Vehicle RC", icon: "RC", desc: "Vehicle make, year, registration" },
  { value: "property_document", label: "Property Document", icon: "🏠", desc: "Value, area, age" },
  { value: "insurance_document", label: "Insurance Policy", icon: "📋", desc: "Policy type, coverage" },
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
  const [extraction, setExtraction] = useState(null); // { extracted, formFields, documentUrl, fileName, docType }
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
    } catch { setError("Failed to load profile"); }
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
        toast.success("Profile updated");
      }
    } catch { toast.error("Update failed"); }
    setSaving(false);
  };

  /* ═══════ DOCUMENT UPLOAD + EXTRACTION ═══════ */
  const handleFileUpload = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File too large (max 10MB)"); return; }

    // Step 1: Upload to Cloudinary
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
      if (!uploadRes.ok) { toast.error("Upload failed"); setUploading(false); return; }
      const uploadData = await uploadRes.json();
      setUploading(false);

      // Step 2: Extract data with AI
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
        toast.error("Extraction failed");
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
      toast.success("Data extracted! Please review and confirm.");
    } catch {
      toast.error("Something went wrong");
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
      // Save document + extracted data to profile
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
        toast.success("Document saved and profile updated!");
      } else {
        toast.error("Failed to save");
      }
    } catch { toast.error("Failed to save"); }
    setSaving(false);
  };

  const discardExtraction = () => {
    setExtraction(null);
  };

  // Field is defined outside the component below to avoid re-creation on every render

  if (error) return <div><Breadcrumbs /><ErrorState message={error} onRetry={fetchProfile} /></div>;

  const p = profile?.personal || {};
  const f = profile?.financial || {};
  const h = profile?.health || {};
  const v = profile?.vehicle || {};
  const alt = profile?.alternativeData || {};

  return (
    <div>
      <Breadcrumbs />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "#fafafa" }}>My Profile</h1>
          <p className="text-sm mt-1" style={{ color: "#71717a" }}>
            Upload your documents to auto-fill your profile with AI extraction
          </p>
        </div>
        <div className="flex items-center gap-3">
          {profile && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl" style={{ background: `${profile.completeness > 70 ? "rgba(16,185,129,0.08)" : profile.completeness > 40 ? "rgba(245,158,11,0.08)" : "rgba(239,68,68,0.08)"}`, border: `1px solid ${profile.completeness > 70 ? "rgba(16,185,129,0.15)" : profile.completeness > 40 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}>
              <span className="font-mono text-lg font-bold" style={{ color: profile.completeness > 70 ? "#10b981" : profile.completeness > 40 ? "#f59e0b" : "#ef4444" }}>{profile.completeness}%</span>
              <span className="text-xs" style={{ color: "#71717a" }}>complete</span>
            </div>
          )}
          <AskAI question="What data is missing from my profile and how would completing it improve my risk score?" label="Improve Profile" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div>
      ) : (
        <>
          {/* ═══════ DOCUMENT UPLOAD SECTION ═══════ */}
          <div className="glass-card p-6 mb-6" style={{ borderColor: "rgba(16,185,129,0.1)" }}>
            <h3 className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "#fafafa" }}>
              <span className="inline-flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>
                Upload Documents
              </span>
            </h3>
            <p className="text-[11px] mb-4" style={{ color: "#52525b" }}>Upload Aadhaar, PAN, salary slips, medical reports — AI will extract and auto-fill your profile</p>

            {/* Doc type selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {DOC_TYPES.map(dt => (
                <button key={dt.value} onClick={() => setSelectedDocType(dt.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
                  style={{
                    background: selectedDocType === dt.value ? "rgba(16,185,129,0.1)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${selectedDocType === dt.value ? "rgba(16,185,129,0.25)" : "rgba(255,255,255,0.06)"}`,
                    color: selectedDocType === dt.value ? "#10b981" : "#71717a",
                    cursor: "pointer", fontFamily: "inherit",
                  }}>
                  <span className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center"
                    style={{ background: selectedDocType === dt.value ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)", color: selectedDocType === dt.value ? "#10b981" : "#52525b" }}>
                    {dt.icon}
                  </span>
                  {dt.label}
                </button>
              ))}
            </div>

            {/* Drop zone */}
            <div
              className="rounded-xl p-8 text-center cursor-pointer transition-all duration-200"
              style={{
                background: dragOver ? "rgba(16,185,129,0.06)" : "rgba(255,255,255,0.01)",
                border: `2px dashed ${dragOver ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.06)"}`,
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
                  <div className="w-8 h-8 border-2 border-t-emerald-500 border-zinc-700 rounded-full animate-spin" />
                  <p className="text-xs font-medium" style={{ color: "#10b981" }}>Uploading to cloud...</p>
                </div>
              ) : extracting ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-t-emerald-500 border-zinc-700 rounded-full animate-spin" />
                  <p className="text-xs font-medium" style={{ color: "#10b981" }}>AI is extracting data...</p>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>Analyzing your {DOC_TYPES.find(d => d.value === selectedDocType)?.label}</p>
                </div>
              ) : (
                <>
                  <svg className="mx-auto mb-3" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3f3f46" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" />
                  </svg>
                  <p className="text-sm font-medium mb-1" style={{ color: "#a1a1aa" }}>
                    Drop your <strong style={{ color: "#10b981" }}>{DOC_TYPES.find(d => d.value === selectedDocType)?.label}</strong> here
                  </p>
                  <p className="text-[10px]" style={{ color: "#52525b" }}>PDF, JPG, PNG up to 10MB — AI will extract: {DOC_TYPES.find(d => d.value === selectedDocType)?.desc}</p>
                </>
              )}
            </div>
          </div>

          {/* ═══════ EXTRACTION CONFIRMATION MODAL ═══════ */}
          {extraction && (
            <div className="glass-card p-6 mb-6" style={{ borderColor: "rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.02)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#f59e0b" }}>
                  <span className="inline-flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
                      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" /><path d="M12 8v4M12 16h.01" />
                    </svg>
                    Review Extracted Data — {DOC_TYPES.find(d => d.value === extraction.docType)?.label}
                  </span>
                </h3>
                <span className="text-[10px] px-2 py-1 rounded-lg" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>{extraction.fileName}</span>
              </div>

              <p className="text-xs mb-4" style={{ color: "#71717a" }}>AI extracted the following data. Please review and confirm to save to your profile.</p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                {Object.entries(extraction.extracted || {}).map(([key, value]) => {
                  if (!value || value === "" || value === "null" || value === "N/A") return null;
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, s => s.toUpperCase()).replace("_", " ");
                  return (
                    <div key={key} className="flex justify-between items-center p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
                      <span className="text-[11px]" style={{ color: "#71717a" }}>{label}</span>
                      <span className="text-sm font-medium" style={{ color: "#fafafa" }}>{String(value)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <button onClick={confirmExtraction} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{ background: "#10b981", color: "white", border: "none", cursor: "pointer", fontFamily: "inherit", opacity: saving ? 0.6 : 1 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                  {saving ? "Saving..." : "Confirm & Save to Profile"}
                </button>
                <button onClick={discardExtraction}
                  className="px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "1px solid rgba(255,255,255,0.06)", cursor: "pointer", fontFamily: "inherit" }}>
                  Discard
                </button>
              </div>
            </div>
          )}

          {/* Completeness bar */}
          <div className="glass-card p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium" style={{ color: "#a1a1aa" }}>Profile Completeness</span>
              <span className="font-mono text-sm font-bold" style={{ color: profile?.completeness > 70 ? "#10b981" : "#f59e0b" }}>{profile?.completeness || 0}%</span>
            </div>
            <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="h-full rounded-full transition-all duration-1000" style={{
                width: `${profile?.completeness || 0}%`,
                background: profile?.completeness > 70 ? "#10b981" : profile?.completeness > 40 ? "#f59e0b" : "#ef4444",
              }} />
            </div>
            <p className="text-[10px] mt-2" style={{ color: "#52525b" }}>
              {profile?.completeness < 50 ? "Upload Aadhaar, PAN, and salary slip to quickly boost your profile" :
               profile?.completeness < 80 ? "Good progress! Add medical reports or vehicle RC to fill gaps" :
               "Excellent! Your profile has enough data for accurate scoring"}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column — data sections */}
            <div className="lg:col-span-2 space-y-4">
              {/* Personal */}
              <Section title="Personal Information" section="personal" editing={editing} onEdit={() => startEdit("personal")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Full Name" value={p.name} editKey={editing === "personal" ? "name" : null} editData={editData} setEditData={setEditData} />
                <Field label="Email" value={p.email} editKey={editing === "personal" ? "email" : null} editData={editData} setEditData={setEditData} />
                <Field label="Phone" value={p.phone} editKey={editing === "personal" ? "phone" : null} editData={editData} setEditData={setEditData} />
                <Field label="Age" value={p.age} editKey={editing === "personal" ? "age" : null} editData={editData} setEditData={setEditData} />
                <Field label="Gender" value={p.gender} editKey={editing === "personal" ? "gender" : null} editData={editData} setEditData={setEditData} />
                <Field label="Occupation" value={p.occupation} editKey={editing === "personal" ? "occupation" : null} editData={editData} setEditData={setEditData} />
                <Field label="Aadhaar" value={p.aadhaarNumber ? `XXXX-XXXX-${p.aadhaarNumber.slice(-4)}` : null} editData={editData} setEditData={setEditData} />
                <Field label="PAN" value={p.panNumber} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Financial */}
              <Section title="Financial Data" section="financial" editing={editing} onEdit={() => startEdit("financial")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Annual Income" value={f.income ? `₹${Number(f.income).toLocaleString("en-IN")}` : null} editKey={editing === "financial" ? "income" : null} editData={editData} setEditData={setEditData} />
                <Field label="Credit Score (CIBIL)" value={f.creditScore} editKey={editing === "financial" ? "creditScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Employer" value={f.employer} editKey={editing === "financial" ? "employer" : null} editData={editData} setEditData={setEditData} />
                <Field label="Existing Policies" value={f.existingPolicies} editKey={editing === "financial" ? "existingPolicies" : null} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Health */}
              <Section title="Health Data" section="health" editing={editing} onEdit={() => startEdit("health")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="BMI" value={h.bmi} editKey={editing === "health" ? "bmi" : null} editData={editData} setEditData={setEditData} />
                <Field label="Blood Pressure" value={h.bloodPressure} editKey={editing === "health" ? "bloodPressure" : null} editData={editData} setEditData={setEditData} />
                <Field label="Smoking Status" value={h.smokingStatus} editKey={editing === "health" ? "smokingStatus" : null} editData={editData} setEditData={setEditData} />
                <Field label="Exercise (days/week)" value={h.exerciseFrequency} editKey={editing === "health" ? "exerciseFrequency" : null} editData={editData} setEditData={setEditData} />
                <Field label="Medical History" value={h.medicalHistory?.join(", ")} editData={editData} setEditData={setEditData} />
                <Field label="Medications" value={h.currentMedications?.join(", ")} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Vehicle */}
              <Section title="Vehicle Data" section="vehicle" editing={editing} onEdit={() => startEdit("vehicle")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Make & Model" value={v.make} editKey={editing === "vehicle" ? "make" : null} editData={editData} setEditData={setEditData} />
                <Field label="Year" value={v.year} editKey={editing === "vehicle" ? "year" : null} editData={editData} setEditData={setEditData} />
                <Field label="Type" value={v.type} editKey={editing === "vehicle" ? "type" : null} editData={editData} setEditData={setEditData} />
                <Field label="Registration" value={v.registrationNumber} editData={editData} setEditData={setEditData} />
                <Field label="Driving Years" value={v.drivingYears} editKey={editing === "vehicle" ? "drivingYears" : null} editData={editData} setEditData={setEditData} />
                <Field label="Accidents (5yr)" value={v.accidentsLast5} editKey={editing === "vehicle" ? "accidentsLast5" : null} editData={editData} setEditData={setEditData} />
              </Section>

              {/* Alternative Data */}
              <Section title="Alternative Data" section="alternativeData" editing={editing} onEdit={() => startEdit("alternativeData")} onSave={saveEdit} onCancel={() => setEditing(null)} saving={saving}>
                <Field label="Telematics Score" value={alt.telematicsScore} editKey={editing === "alternativeData" ? "telematicsScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Behavioral Score" value={alt.behavioralScore} editKey={editing === "alternativeData" ? "behavioralScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Lifestyle Score" value={alt.lifestyleScore} editKey={editing === "alternativeData" ? "lifestyleScore" : null} editData={editData} setEditData={setEditData} />
                <Field label="Social Media Risk" value={alt.socialMediaRisk} editKey={editing === "alternativeData" ? "socialMediaRisk" : null} editData={editData} setEditData={setEditData} />
              </Section>
            </div>

            {/* Right column — documents + assessments + actions */}
            <div className="space-y-4">
              {/* Uploaded documents with previews */}
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>My Documents</h3>
                  <span className="font-mono text-sm font-bold" style={{ color: "#10b981" }}>{profile?.documents?.length || 0}</span>
                </div>
                {(!profile?.documents || profile.documents.length === 0) ? (
                  <p className="text-xs text-center py-4" style={{ color: "#52525b" }}>No documents yet — upload above to get started</p>
                ) : (
                  <div className="space-y-3">
                    {profile.documents.map((doc, i) => {
                      const isImage = doc.url && /\.(jpg|jpeg|png|webp)/i.test(doc.url);
                      const docLabel = DOC_TYPES.find(d => d.value === doc.docType)?.label || doc.docType || doc.type || "Document";
                      const extractedFields = doc.extractedData ? Object.entries(doc.extractedData).filter(([, v]) => v && v !== "") : [];
                      return (
                        <div key={i} className="rounded-xl overflow-hidden transition-all duration-300" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                          {/* Preview + Info row */}
                          <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex gap-3 p-3 no-underline">
                            {/* Thumbnail */}
                            {isImage && doc.url ? (
                              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
                                <img src={doc.url} alt={doc.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                              </div>
                            )}
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-semibold truncate" style={{ color: "#fafafa" }}>{docLabel}</p>
                                {doc.extractedData && (
                                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.15)" }}>AI Verified</span>
                                )}
                              </div>
                              <p className="text-[11px] truncate" style={{ color: "#71717a" }}>{doc.name}</p>
                              <p className="text-[10px]" style={{ color: "#3f3f46" }}>
                                {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""}
                                {doc.size ? ` · ${(doc.size / 1024).toFixed(0)} KB` : ""}
                              </p>
                            </div>
                          </a>

                          {/* Extracted data preview */}
                          {extractedFields.length > 0 && (
                            <div className="px-3 pb-3">
                              <div className="rounded-lg p-2.5" style={{ background: "rgba(16,185,129,0.03)", border: "1px solid rgba(16,185,129,0.08)" }}>
                                <p className="text-[9px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "#10b981" }}>Extracted Data</p>
                                <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                  {extractedFields.slice(0, 5).map(([key, val]) => (
                                    <span key={key} className="text-[10px]" style={{ color: "#a1a1aa" }}>
                                      <span style={{ color: "#52525b" }}>{key.replace(/([A-Z])/g, " $1").trim()}: </span>
                                      {String(val).slice(0, 25)}
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
              <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>Assessments</h3>
                  <span className="font-mono text-sm font-bold" style={{ color: "#10b981" }}>{assessments.length}</span>
                </div>
                {assessments.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-xs mb-3" style={{ color: "#52525b" }}>No assessments yet</p>
                    <Link href="/applicant/dashboard/assess" className="btn-primary no-underline text-xs" style={{ padding: "8px 16px" }}>Start Assessment</Link>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {assessments.slice(0, 8).map((a) => (
                      <Link key={a._id} href={`/applicant/dashboard/assessment/${a._id}`} className="flex items-center gap-3 p-2.5 rounded-xl no-underline transition-all duration-200"
                        style={{ background: "rgba(255,255,255,0.02)" }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                        <div className="w-2 h-8 rounded-full" style={{ background: PC[a.policyType] || "#10b981" }} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: "#fafafa" }}>{a.applicant?.name || "—"}</p>
                          <p className="text-[10px]" style={{ color: "#52525b" }}>{a.policyType} · {new Date(a.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                        </div>
                        {a.result?.riskScore != null && (
                          <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${a.result.riskScore <= 35 ? "risk-low" : a.result.riskScore <= 55 ? "risk-medium" : "risk-high"}`}>
                            {a.result.riskScore}
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick actions */}
              <div className="glass-card p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: "#fafafa" }}>Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/applicant/dashboard/assess" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-all duration-200" style={{ background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.08)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(16,185,129,0.04)"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                    <span className="text-sm font-medium" style={{ color: "#10b981" }}>New Assessment</span>
                  </Link>
                  <Link href="/applicant/dashboard/history" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-all duration-200" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
                    <span className="text-sm font-medium" style={{ color: "#a1a1aa" }}>View All Assessments</span>
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

/* ── Editable Field — defined outside component to avoid re-creation ── */
function Field({ label, value, editKey, editData, setEditData }) {
  return (
    <div className="flex justify-between items-center py-2.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
      <span className="text-xs" style={{ color: "#71717a" }}>{label}</span>
      {editKey ? (
        <input value={editData[editKey] || ""} onChange={(e) => setEditData(prev => ({ ...prev, [editKey]: e.target.value }))}
          className="text-sm font-medium text-right rounded-lg px-2 py-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#fafafa", outline: "none", width: 160, fontFamily: "inherit" }} />
      ) : (
        <span className="text-sm font-medium" style={{ color: value ? "#fafafa" : "#3f3f46" }}>{value || "\u2014"}</span>
      )}
    </div>
  );
}

/* ── Reusable Section Card ── */
function Section({ title, section, editing, onEdit, onSave, onCancel, saving, children }) {
  const isEditing = editing === section;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#fafafa" }}>{title}</h3>
        {isEditing ? (
          <div className="flex gap-2">
            <button onClick={onSave} disabled={saving} className="text-xs font-medium px-3 py-1 rounded-lg" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {saving ? "Saving..." : "Save"}
            </button>
            <button onClick={onCancel} className="text-xs font-medium px-3 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
          </div>
        ) : (
          <button onClick={onEdit} className="text-xs font-medium px-3 py-1 rounded-lg" style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "#fafafa"}
            onMouseLeave={(e) => e.currentTarget.style.color = "#71717a"}>
            Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
}
