"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Skeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";

/* ═══════ CONSTANTS ═══════ */
const POLICY_THEMES = {
  health: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", code: "HLTH" },
  auto: { color: "#06B6D4", bg: "rgba(6,182,212,0.1)", border: "rgba(6,182,212,0.25)", code: "AUTO" },
  life: { color: "#818CF8", bg: "rgba(129,140,248,0.1)", border: "rgba(129,140,248,0.25)", code: "LIFE" },
  property: { color: "#38BDF8", bg: "rgba(56,189,248,0.1)", border: "rgba(56,189,248,0.25)", code: "PROP" },
};

const CLAIM_TYPES = [
  { value: "accident", label: "Accident / Collision Incident" },
  { value: "theft", label: "Total / Partial Asset Theft" },
  { value: "natural_disaster", label: "Catastrophic Weather / Flooding" },
  { value: "medical", label: "Emergency Hospitalization & Care" },
  { value: "death", label: "Life Term Benefit Claim" },
  { value: "disability", label: "Accidental Permanent Disability" },
  { value: "property_damage", label: "Structural / Property Damage" },
  { value: "liability", label: "Third-Party Legal Liability" },
  { value: "other", label: "General Casualty Loss" },
];

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "--";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

export default function NewClaimPage() {
  const { data: session } = useSession();

  // Approved assessments for policy selection
  const [assessments, setAssessments] = useState([]);
  const [loadingAssessments, setLoadingAssessments] = useState(true);

  // Form state
  const [selectedAssessment, setSelectedAssessment] = useState("");
  const [claimType, setClaimType] = useState("accident");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [location, setLocation] = useState("");
  const [estimatedAmount, setEstimatedAmount] = useState("");
  const [docs, setDocs] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);

  // Load approved assessments
  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        const approved = (data?.assessments || []).filter((a) =>
          (a.status === "accepted" || a.status === "completed") &&
          a.result?.decision === "approve"
        );
        setAssessments(approved);
        setLoadingAssessments(false);
      })
      .catch(() => setLoadingAssessments(false));
  }, []);

  const selectedAssessmentData = assessments.find((a) => a._id === selectedAssessment);
  const policyType = selectedAssessmentData?.policyType || null;
  const theme = POLICY_THEMES[policyType] || { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", border: "rgba(59,130,246,0.25)", code: "POL" };

  const handleFileUpload = useCallback(async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const uploaded = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (res.ok) {
          const data = await res.json();
          uploaded.push({
            name: file.name,
            type: file.type,
            size: file.size,
            url: data.url || data.path || "",
            docType: "claim_document",
            verified: false,
          });
        }
      } catch {
        // skip failed uploads
      }
    }

    setDocs((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }, []);

  const removeDoc = useCallback((idx) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!selectedAssessment) {
      setSubmitError("Please select an underwritten policy docket");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    const body = {
      policyType: policyType,
      assessmentId: selectedAssessment,
      policyNumber: selectedAssessmentData?.policyNumber || null,
      claimant: {
        name: session?.user?.name || selectedAssessmentData?.applicant?.name || "",
        email: session?.user?.email || selectedAssessmentData?.applicant?.email || "",
        phone: selectedAssessmentData?.applicant?.phone || "",
        age: selectedAssessmentData?.applicant?.age || null,
        gender: selectedAssessmentData?.applicant?.gender || "",
      },
      claimDetails: {
        type: claimType,
        description,
        incidentDate: incidentDate ? new Date(incidentDate).toISOString() : null,
        location,
        estimatedAmount: Number(estimatedAmount) || 0,
      },
      documents: docs,
    };

    try {
      const res = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Loss adjudication submission failed");
      }

      const data = await res.json();
      setResult(data.claim);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit loss adjudication request");
    } finally {
      setSubmitting(false);
    }
  }, [selectedAssessment, policyType, selectedAssessmentData, session, claimType, description, incidentDate, location, estimatedAmount, docs]);

  // ═══════ RESULT VIEW ═══════
  if (result) {
    const isStp = result.stp?.autoApproved;
    const isInvestigation = result.status === "investigation";

    return (
      <div className="space-y-6">
        <Breadcrumbs />
        <FadeUp>
          <div className="blueprint-card p-8 max-w-2xl mx-auto text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-40 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

            {/* Diagnostic Icon */}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 border ${
              isStp
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : isInvestigation
                ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
                : "bg-blue-500/10 border-blue-500/30 text-blue-400"
            }`}>
              {isStp ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              ) : isInvestigation ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              )}
            </div>

            <span className="font-mono text-[10px] tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 rounded uppercase">
              {isStp ? "[STATUS: STP_AUTO_APPROVED]" : isInvestigation ? "[STATUS: INVESTIGATION_FLAGGED]" : "[STATUS: QUEUED_ADJUDICATION]"}
            </span>

            <h2 className="text-2xl font-extrabold text-white mt-3 mb-2 tracking-tight">
              {isStp ? "Straight-Through Adjudication Confirmed" : isInvestigation ? "Flagged for Forensic Inspection" : "Docket Ingested into Underwriter Queue"}
            </h2>

            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6 leading-relaxed">
              {isStp
                ? "Autonomous risk validator verified telemetry against policy clauses. Settlement approved for disbursement."
                : isInvestigation
                ? "Heuristic anomaly detectors identified outlier indicators. Our investigative unit is reviewing submitted credentials."
                : "Your claim has been cataloged. You will receive real-time telemetry updates as manual review progresses."}
            </p>

            {/* Diagnostic stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-w-lg mx-auto">
              {isStp && result.claimDetails?.estimatedAmount && (
                <div className="bg-[#070A13] p-3 rounded-lg border border-emerald-500/20">
                  <span className="font-mono text-sm font-bold text-emerald-400 block">
                    {formatCurrency(result.claimDetails.estimatedAmount)}
                  </span>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase mt-0.5 block">Approved Amount</span>
                </div>
              )}
              {result.stp?.processingTime != null && (
                <div className="bg-[#070A13] p-3 rounded-lg border border-blue-500/20">
                  <span className="font-mono text-sm font-bold text-blue-400 block">
                    {result.stp.processingTime}ms
                  </span>
                  <span className="font-mono text-[9px] text-zinc-500 uppercase mt-0.5 block">Latency</span>
                </div>
              )}
              <div className="bg-[#070A13] p-3 rounded-lg border border-zinc-800">
                <span className="font-mono text-sm font-bold text-zinc-300 capitalize block truncate">
                  {result.status?.replace(/_/g, " ")}
                </span>
                <span className="font-mono text-[9px] text-zinc-500 uppercase mt-0.5 block">Status Code</span>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-center gap-3">
              <Link
                href="/applicant/dashboard/claims"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs tracking-wide transition shadow-lg shadow-blue-500/20 no-underline"
              >
                Return to Claims Register
              </Link>
            </div>
          </div>
        </FadeUp>
      </div>
    );
  }

  // ═══════ FORM VIEW ═══════
  return (
    <div className="space-y-6">
      <Breadcrumbs />

      <FadeUp>
        <div className="blueprint-card p-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded">
                [ACT.DISPATCH_INTAKE]
              </span>
              <span className="font-mono text-[10px] text-zinc-500">STAGE 1: ADJUDICATION_DOSSIER</span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">File Loss Adjudication Docket</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Submit casualty telemetry and supporting verification documents for straight-through processing.
            </p>
          </div>

          <Link
            href="/applicant/dashboard/claims"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-400 hover:text-white text-xs font-mono transition no-underline"
          >
            &larr; Cancel / Back
          </Link>
        </div>
      </FadeUp>

      <div className="max-w-3xl space-y-5">
        {/* Section 1: Policy Selection */}
        <FadeUp delay={0.05}>
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono text-[10px] text-blue-400 block mb-0.5">[PAR.01_POLICY_AFFILIATION]</span>
                <h3 className="text-sm font-bold text-white">Underwritten Policy Selection</h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                REQUIRED
              </span>
            </div>

            {loadingAssessments ? (
              <Skeleton width="100%" height={44} rounded={8} />
            ) : assessments.length === 0 ? (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-center">
                <span className="font-mono text-[10px] text-amber-400 block mb-1">[NULL_ACTIVE_POLICIES]</span>
                <p className="text-xs text-zinc-300 font-medium">No approved policy dockets found on your account.</p>
                <p className="text-[11px] text-zinc-500 mt-1">An approved underwriting assessment is required prior to filing loss claims.</p>
                <Link href="/applicant/dashboard/assess" className="inline-block mt-3 text-xs font-mono text-blue-400 hover:underline">
                  Initiate New Policy Assessment &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-3 outline-none transition font-mono"
                >
                  <option value="">-- Select Active Policy Docket --</option>
                  {assessments.map((a) => (
                    <option key={a._id} value={a._id}>
                      [{a.policyType?.toUpperCase()}] - {a.applicant?.name || "Policyholder"} - Ref #{a._id?.slice(-6).toUpperCase()} ({new Date(a.createdAt).toLocaleDateString("en-IN")})
                    </option>
                  ))}
                </select>

                {selectedAssessmentData && (
                  <div className="p-3.5 rounded-lg bg-[#070A13] border border-blue-500/20 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className="font-mono text-[10px] font-bold px-2 py-0.5 rounded border"
                        style={{ background: theme.bg, color: theme.color, borderColor: theme.border }}
                      >
                        {theme.code}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-white">{selectedAssessmentData.applicant?.name || "--"}</p>
                        <p className="text-[10px] font-mono text-zinc-500">
                          Risk Score: {selectedAssessmentData.result?.riskScore ?? "--"}/100 &middot; Model Decision: APPROVED
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-[9px] text-zinc-500 block uppercase">Policy Premium</span>
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {selectedAssessmentData.result?.recommendedPremium?.min != null
                          ? `${formatCurrency(selectedAssessmentData.result.recommendedPremium.min)}`
                          : "--"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Section 2: Incident Details */}
        <FadeUp delay={0.1}>
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono text-[10px] text-blue-400 block mb-0.5">[PAR.02_INCIDENT_VECTOR]</span>
                <h3 className="text-sm font-bold text-white">Loss Incident Telemetry</h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                REQUIRED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Loss Categorization
                </label>
                <select
                  value={claimType}
                  onChange={(e) => setClaimType(e.target.value)}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-2.5 outline-none font-mono"
                >
                  {CLAIM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Incident Timestamp
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-2.5 outline-none font-mono color-scheme-dark"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Incident Geolocation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bandra Kurla Complex, Mumbai"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-2.5 outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Estimated Financial Loss (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs text-zinc-500">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="75000"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg pl-7 p-2.5 outline-none font-mono"
                    min="0"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="font-mono text-[10px] text-zinc-400 uppercase block mb-1.5">
                  Loss Narrative & Forensic Circumstances
                </label>
                <textarea
                  placeholder="Detail the sequence of events, damages sustained, and any third parties involved..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-[#070A13] border border-zinc-800 focus:border-blue-500 text-white text-xs rounded-lg p-3 outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Section 3: Documents */}
        <FadeUp delay={0.15}>
          <div className="blueprint-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="font-mono text-[10px] text-blue-400 block mb-0.5">[PAR.03_EVIDENCE_PAYLOAD]</span>
                <h3 className="text-sm font-bold text-white">Forensic & Evidentiary Artifacts</h3>
              </div>
              <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded">
                OPTIONAL / OCR
              </span>
            </div>

            <label className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-blue-500/25 bg-blue-500/[0.02] hover:bg-blue-500/[0.04] cursor-pointer transition group">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-105 transition mb-2">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
              </div>
              <p className="text-xs font-semibold text-white">
                {uploading ? "Ingesting & Analyzing Payload..." : "Click or drag incident evidence files"}
              </p>
              <p className="font-mono text-[10px] text-zinc-500 mt-1">FIR copies, medical discharges, damage photos, repair estimates (PDF, JPG, PNG)</p>
            </label>

            {docs.length > 0 && (
              <div className="mt-4 space-y-2">
                {docs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-[#070A13] border border-zinc-800"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-mono text-zinc-200 truncate">{doc.name}</p>
                        <p className="font-mono text-[9px] text-zinc-500">
                          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : "Attached"} &middot; OCR STATUS: READY
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDoc(idx)}
                      className="text-rose-400 hover:text-rose-300 font-mono text-xs px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 transition"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Submit Error */}
        {submitError && (
          <FadeUp>
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center gap-3">
              <span className="font-mono text-rose-400 text-xs">ERR:</span>
              <p className="text-xs text-rose-300">{submitError}</p>
            </div>
          </FadeUp>
        )}

        {/* Action Bar */}
        <FadeUp delay={0.2}>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAssessment}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs tracking-wider transition shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Processing Adjudication Vector...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                  </svg>
                  <span>Dispatch Claim for Adjudication</span>
                </>
              )}
            </button>

            <Link
              href="/applicant/dashboard/claims"
              className="px-4 py-3 rounded-lg border border-zinc-800 bg-[#0A0F1D] text-zinc-400 hover:text-white text-xs font-mono transition no-underline"
            >
              Cancel
            </Link>
          </div>
        </FadeUp>
      </div>
    </div>
  );
}
