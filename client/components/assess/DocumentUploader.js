"use client";
import { useRef, useCallback, useState } from "react";
import DocumentVerificationBadge from "@/components/ui/DocumentVerificationBadge";

export default function DocumentUploader({
  policyColor,
  docType,
  onDocTypeChange,
  docs,
  onUpload,
  uploading,
  extracting,
  extraction,
  onApplyExtraction,
  onDismissExtraction,
  onRemoveDoc,
  DOC_TYPES,
}) {
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onUpload(f);
  }, [onUpload]);

  return (
    <>
      {/* Document type selector */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-3" style={{ color: "#52525b" }}>Select Document Type</p>
        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map(dt => (
            <button key={dt.value} onClick={() => onDocTypeChange(dt.value)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
              style={{
                background: docType === dt.value ? `${policyColor}12` : "rgba(255,255,255,0.02)",
                border: `1px solid ${docType === dt.value ? `${policyColor}35` : "rgba(255,255,255,0.06)"}`,
                color: docType === dt.value ? policyColor : "#71717a",
                cursor: "pointer", fontFamily: "inherit",
              }}>
              <span className="w-5 h-5 rounded text-[8px] font-bold flex items-center justify-center" style={{ background: docType === dt.value ? `${policyColor}20` : "rgba(255,255,255,0.04)", color: docType === dt.value ? policyColor : "#52525b" }}>{dt.icon}</span>
              {dt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload area */}
      <div className="rounded-2xl p-8 sm:p-10 text-center mb-5 transition-all duration-300 cursor-pointer group" onClick={() => !uploading && !extracting && fileRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={onDrop}
        style={{ background: dragOver ? `${policyColor}08` : "rgba(255,255,255,0.015)", border: `2px dashed ${dragOver ? policyColor + "50" : "rgba(255,255,255,0.06)"}`, opacity: uploading || extracting ? 0.6 : 1 }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" style={{ background: `${policyColor}10` }}>
          {uploading || extracting
            ? <span className="w-5 h-5 rounded-full border-2 border-t-2 inline-block" style={{ borderColor: `${policyColor}30`, borderTopColor: policyColor, animation: "spin-anim 1s linear infinite" }} />
            : <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={policyColor} strokeWidth="1.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><path d="M17 8l-5-5-5 5M12 3v12" /></svg>}
        </div>
        <p className="text-sm font-semibold mb-1" style={{ color: "#fafafa" }}>
          {uploading ? "Uploading..." : extracting ? "AI is extracting data..." : `Upload ${DOC_TYPES.find(d => d.value === docType)?.label || "Document"}`}
        </p>
        <p className="text-xs leading-relaxed max-w-sm mx-auto" style={{ color: "#52525b" }}>
          {extracting ? "Analyzing document and extracting fields automatically" : "Drag & drop or click to browse — PDF, JPG, PNG — Max 10MB"}
        </p>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }} disabled={uploading || extracting} />
      </div>

      {/* AI Extraction result — auto-fill confirmation */}
      {extraction && (
        <div className="rounded-2xl p-5 mb-5 relative overflow-hidden" style={{ background: `${policyColor}06`, border: `1px solid ${policyColor}20` }}>
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full pointer-events-none" style={{ background: `${policyColor}08`, filter: "blur(30px)" }} />
          <div className="flex items-center gap-3 mb-4 relative">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${policyColor}15` }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={policyColor} strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" /><path d="M10 22v-4M14 22v-4M10 18h4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "#fafafa" }}>AI Extracted Data</p>
              <p className="text-[10px]" style={{ color: "#71717a" }}>{Object.keys(extraction.formFields).length} fields found from {DOC_TYPES.find(d => d.value === extraction.documentType)?.label}</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-4 relative">
            {Object.entries(extraction.extracted).map(([key, value]) => {
              if (!value || value === "") return null;
              return (
                <div key={key} className="flex justify-between items-center px-3 py-2 rounded-lg" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <span className="text-[11px] capitalize" style={{ color: "#71717a" }}>{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-xs font-semibold font-mono" style={{ color: "#fafafa" }}>{String(value)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 relative">
            <button onClick={onApplyExtraction}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: policyColor, color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: `0 4px 16px ${policyColor}40` }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              Auto-fill Form
            </button>
            <button onClick={onDismissExtraction}
              className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#71717a", cursor: "pointer", fontFamily: "inherit" }}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Uploaded docs list with verification badges */}
      {docs.length > 0 && <div className="space-y-3 mb-8">{docs.map((d, i) => (
        <div key={i} className="rounded-xl overflow-hidden" style={{ background: `${policyColor}04`, border: `1px solid ${policyColor}10` }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${policyColor}12` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={policyColor} strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-xs font-medium truncate" style={{ color: "#fafafa" }}>{d.name}</p>
                  {d.verification && <DocumentVerificationBadge verification={d.verification} compact />}
                </div>
                <p className="text-[10px]" style={{ color: "#52525b" }}>{d.size ? `${(d.size / 1024).toFixed(0)} KB` : ""}{d.docType ? ` · ${d.docType}` : ""}</p>
              </div>
            </div>
            <button onClick={() => onRemoveDoc(i)} className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.06)", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.15)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(239,68,68,0.06)"}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Expandable verification details */}
          {d.verification && <div className="px-4 pb-3"><DocumentVerificationBadge verification={d.verification} /></div>}
        </div>
      ))}</div>}
    </>
  );
}
