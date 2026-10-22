"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Skeleton } from "@/components/ui/Skeleton";
import ErrorState from "@/components/ui/ErrorState";
import { FadeUp } from "@/components/motion/StaggerReveal";

/* ═══════ CONSTANTS ═══════ */
const POLICY_COLORS = { health: "#10b981", auto: "#f59e0b", life: "#a78bfa", property: "#60a5fa" };
const POLICY_BG = { health: "rgba(16,185,129,0.1)", auto: "rgba(245,158,11,0.1)", life: "rgba(167,139,250,0.1)", property: "rgba(96,165,250,0.1)" };

const CLAIM_TYPES = [
  { value: "accident", label: "Accident" },
  { value: "theft", label: "Theft" },
  { value: "natural_disaster", label: "Natural Disaster" },
  { value: "medical", label: "Medical" },
  { value: "death", label: "Death" },
  { value: "disability", label: "Disability" },
  { value: "property_damage", label: "Property Damage" },
  { value: "liability", label: "Liability" },
  { value: "other", label: "Other" },
];

const selectStyle = {
  background: "rgba(15,15,19,0.9)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fafafa",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  cursor: "pointer",
  fontFamily: "inherit",
  width: "100%",
};

const inputStyle = {
  background: "rgba(15,15,19,0.9)",
  border: "1px solid rgba(255,255,255,0.08)",
  color: "#fafafa",
  borderRadius: 10,
  padding: "10px 14px",
  fontSize: 14,
  outline: "none",
  fontFamily: "inherit",
  width: "100%",
};

const labelStyle = {
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "#71717a",
  marginBottom: 6,
  display: "block",
};

function formatCurrency(amount) {
  if (!amount && amount !== 0) return "--";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
}

/* ═══════ COMPONENT ═══════ */
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
  const [result, setResult] = useState(null); // the created claim

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

  // Get selected assessment data
  const selectedAssessmentData = assessments.find((a) => a._id === selectedAssessment);
  const policyType = selectedAssessmentData?.policyType || null;

  // File upload
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
        // skip failed uploads silently
      }
    }

    setDocs((prev) => [...prev, ...uploaded]);
    setUploading(false);
    e.target.value = "";
  }, []);

  const removeDoc = useCallback((idx) => {
    setDocs((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Submit
  const handleSubmit = useCallback(async () => {
    if (!selectedAssessment) {
      setSubmitError("Please select a policy");
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
        throw new Error(err.error || "Failed to submit claim");
      }

      const data = await res.json();
      setResult(data.claim);
    } catch (err) {
      setSubmitError(err.message || "Failed to submit claim");
    } finally {
      setSubmitting(false);
    }
  }, [selectedAssessment, policyType, selectedAssessmentData, session, claimType, description, incidentDate, location, estimatedAmount, docs]);

  // ═══════ RESULT VIEW ═══════
  if (result) {
    const isStp = result.stp?.autoApproved;
    const isInvestigation = result.status === "investigation";
    const isManual = !isStp && !isInvestigation;

    return (
      <div>
        <Breadcrumbs />
        <FadeUp>
          <div className="glass-card p-8 max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: isStp ? "rgba(16,185,129,0.12)" : isInvestigation ? "rgba(239,68,68,0.12)" : "rgba(96,165,250,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              {isStp ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                </svg>
              ) : isInvestigation ? (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                </svg>
              )}
            </div>

            {/* Title */}
            <h2 className="text-xl font-extrabold mb-2" style={{ color: "#fafafa" }}>
              {isStp ? "Claim Auto-Approved via STP!" : isInvestigation ? "Claim Flagged for Investigation" : "Claim Submitted for Review"}
            </h2>

            {/* Description */}
            <p className="text-sm mb-6" style={{ color: "#71717a", maxWidth: 420, margin: "0 auto 24px" }}>
              {isStp
                ? "Your claim has been automatically processed and approved through our Straight-Through Processing engine."
                : isInvestigation
                ? "Your claim has been flagged for additional verification. Our team will review it and reach out if needed."
                : "Your claim has been submitted and will be reviewed by our team. You will be notified once a decision is made."}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6" style={{ maxWidth: 500, margin: "0 auto 24px" }}>
              {isStp && result.claimDetails?.estimatedAmount && (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.12)" }}>
                  <span className="font-mono text-lg font-bold" style={{ color: "#10b981" }}>
                    {formatCurrency(result.claimDetails.estimatedAmount)}
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#71717a" }}>Approved Amount</p>
                </div>
              )}
              {result.stp?.processingTime != null && (
                <div className="rounded-xl p-3 text-center" style={{ background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.12)" }}>
                  <span className="font-mono text-lg font-bold" style={{ color: "#60a5fa" }}>
                    {result.stp.processingTime}ms
                  </span>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#71717a" }}>Processing Time</p>
                </div>
              )}
              <div className="rounded-xl p-3 text-center" style={{
                background: isStp ? "rgba(16,185,129,0.06)" : isInvestigation ? "rgba(239,68,68,0.06)" : "rgba(245,158,11,0.06)",
                border: `1px solid ${isStp ? "rgba(16,185,129,0.12)" : isInvestigation ? "rgba(239,68,68,0.12)" : "rgba(245,158,11,0.12)"}`,
              }}>
                <span className="text-lg font-bold capitalize" style={{
                  color: isStp ? "#10b981" : isInvestigation ? "#ef4444" : "#f59e0b",
                }}>
                  {result.status?.replace(/_/g, " ")}
                </span>
                <p className="text-[10px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: "#71717a" }}>Status</p>
              </div>
            </div>

            {/* STP reasons */}
            {result.stp?.reasons?.length > 0 && (
              <div style={{ textAlign: "left", marginBottom: 24 }}>
                <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: "#52525b" }}>Processing Details</p>
                <div className="space-y-1">
                  {result.stp.reasons.map((r, i) => (
                    <div key={i} className="text-xs flex items-start gap-2" style={{ color: "#a1a1aa" }}>
                      <span style={{ color: "#10b981", marginTop: 1 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                      </span>
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action */}
            <Link
              href="/applicant/dashboard/claims"
              className="btn-primary no-underline text-sm inline-flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              Back to Claims
            </Link>
          </div>
        </FadeUp>
      </div>
    );
  }

  // ═══════ FORM VIEW ═══════
  return (
    <div>
      <Breadcrumbs />

      <FadeUp>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold" style={{ color: "#fafafa" }}>File New Claim</h1>
            <p className="text-sm mt-1" style={{ color: "#71717a" }}>Submit an insurance claim for processing</p>
          </div>
          <Link
            href="/applicant/dashboard/claims"
            className="btn-secondary no-underline text-sm hidden sm:inline-flex items-center gap-2"
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
        </div>
      </FadeUp>

      <div className="max-w-3xl">
        {/* Section 1: Policy Selection */}
        <FadeUp delay={0.05}>
          <div className="glass-card p-6 mb-4">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "#fafafa" }}>
              <span style={{ color: "#10b981", marginRight: 8 }}>1.</span>Policy Selection
            </h3>
            <p className="text-xs mb-4" style={{ color: "#52525b" }}>Select an approved policy to file a claim against</p>

            {loadingAssessments ? (
              <Skeleton width="100%" height={44} rounded={10} />
            ) : assessments.length === 0 ? (
              <div className="rounded-xl p-4 text-center" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <p className="text-sm" style={{ color: "#f59e0b" }}>No approved policies found</p>
                <p className="text-xs mt-1" style={{ color: "#71717a" }}>You need an approved assessment before filing a claim</p>
                <Link href="/applicant/dashboard/assess" className="text-xs no-underline mt-2 inline-block" style={{ color: "#10b981" }}>
                  Apply for a policy &rarr;
                </Link>
              </div>
            ) : (
              <>
                <select
                  value={selectedAssessment}
                  onChange={(e) => setSelectedAssessment(e.target.value)}
                  style={selectStyle}
                >
                  <option value="">-- Select a policy --</option>
                  {assessments.map((a) => (
                    <option key={a._id} value={a._id}>
                      {(a.policyType || "").toUpperCase()} - {a.applicant?.name || "Policy"} - {a.result?.decision || ""} (
                      {new Date(a.createdAt).toLocaleDateString("en-IN")})
                    </option>
                  ))}
                </select>

                {selectedAssessmentData && (
                  <div className="flex items-center gap-3 mt-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                    <span
                      className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full"
                      style={{ background: POLICY_BG[policyType] || "rgba(255,255,255,0.05)", color: POLICY_COLORS[policyType] || "#71717a" }}
                    >
                      {policyType}
                    </span>
                    <div>
                      <p className="text-sm" style={{ color: "#fafafa" }}>{selectedAssessmentData.applicant?.name || "--"}</p>
                      <p className="text-xs font-mono" style={{ color: "#52525b" }}>
                        Risk: {selectedAssessmentData.result?.riskScore ?? "--"}
                        {selectedAssessmentData.result?.recommendedPremium?.min != null && (
                          <> &middot; Premium: {formatCurrency(selectedAssessmentData.result.recommendedPremium.min)}-{formatCurrency(selectedAssessmentData.result.recommendedPremium.max)}</>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </FadeUp>

        {/* Section 2: Claim Details */}
        <FadeUp delay={0.1}>
          <div className="glass-card p-6 mb-4">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "#fafafa" }}>
              <span style={{ color: "#10b981", marginRight: 8 }}>2.</span>Claim Details
            </h3>
            <p className="text-xs mb-4" style={{ color: "#52525b" }}>Provide information about the incident</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label style={labelStyle}>Claim Type</label>
                <select value={claimType} onChange={(e) => setClaimType(e.target.value)} style={selectStyle}>
                  {CLAIM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Incident Date</label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  style={{ ...inputStyle, colorScheme: "dark" }}
                />
              </div>

              <div>
                <label style={labelStyle}>Location</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai, Maharashtra"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Estimated Amount (INR)</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#52525b", fontSize: 14 }}>
                    &#8377;
                  </span>
                  <input
                    type="number"
                    placeholder="50000"
                    value={estimatedAmount}
                    onChange={(e) => setEstimatedAmount(e.target.value)}
                    style={{ ...inputStyle, paddingLeft: 28 }}
                    min="0"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label style={labelStyle}>Description</label>
                <textarea
                  placeholder="Describe the incident and circumstances leading to this claim..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  style={{ ...inputStyle, resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        </FadeUp>

        {/* Section 3: Documents */}
        <FadeUp delay={0.15}>
          <div className="glass-card p-6 mb-4">
            <h3 className="text-sm font-semibold mb-1" style={{ color: "#fafafa" }}>
              <span style={{ color: "#10b981", marginRight: 8 }}>3.</span>Supporting Documents
            </h3>
            <p className="text-xs mb-4" style={{ color: "#52525b" }}>Upload photos, receipts, FIR copies, medical bills, etc.</p>

            {/* Upload area */}
            <label
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                borderRadius: 12,
                border: "2px dashed rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.02)",
                cursor: uploading ? "wait" : "pointer",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = "rgba(16,185,129,0.3)"}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"}
            >
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                style={{ display: "none" }}
              />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#52525b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5" /><path d="M12 3v12" />
              </svg>
              <p className="text-sm mt-2" style={{ color: "#71717a" }}>
                {uploading ? "Uploading..." : "Click to upload or drag files here"}
              </p>
              <p className="text-[10px] mt-1" style={{ color: "#52525b" }}>PDF, DOC, JPG, PNG up to 10MB each</p>
            </label>

            {/* Uploaded docs list */}
            {docs.length > 0 && (
              <div className="mt-4 space-y-2">
                {docs.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}
                  >
                    <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(16,185,129,0.1)" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" />
                        </svg>
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p className="text-sm truncate" style={{ color: "#fafafa" }}>{doc.name}</p>
                        <p className="text-[10px] font-mono" style={{ color: "#52525b" }}>
                          {doc.size ? `${(doc.size / 1024).toFixed(1)} KB` : ""}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeDoc(idx)}
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: 8,
                        padding: "6px 8px",
                        cursor: "pointer",
                        color: "#f87171",
                        fontSize: 11,
                        fontFamily: "inherit",
                      }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FadeUp>

        {/* Error */}
        {submitError && (
          <FadeUp>
            <div className="mb-4 p-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <p className="text-sm" style={{ color: "#f87171" }}>{submitError}</p>
            </div>
          </FadeUp>
        )}

        {/* Submit */}
        <FadeUp delay={0.2}>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              disabled={submitting || !selectedAssessment}
              className="btn-primary"
              style={{
                fontSize: 14,
                padding: "12px 32px",
                opacity: (submitting || !selectedAssessment) ? 0.5 : 1,
                cursor: (submitting || !selectedAssessment) ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              {submitting ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#fff",
                    animation: "spin 0.6s linear infinite",
                  }} />
                  Processing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                  Submit Claim
                </>
              )}
            </button>

            <Link
              href="/applicant/dashboard/claims"
              className="btn-secondary no-underline text-sm"
              style={{ fontSize: 13, padding: "12px 20px" }}
            >
              Cancel
            </Link>
          </div>
        </FadeUp>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
