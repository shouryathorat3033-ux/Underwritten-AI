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
  const activeColor = policyColor || "#3B82F6";

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
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
            [01. SELECT DOCUMENT CATEGORY]
          </p>
          <span className="text-[10px] font-mono text-slate-500">// OCR_VECTOR_MAP</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {DOC_TYPES.map(dt => {
            const active = docType === dt.value;
            return (
              <button
                key={dt.value}
                onClick={() => onDocTypeChange(dt.value)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer"
                style={{
                  background: active ? "rgba(37,99,235,0.2)" : "rgba(14,21,38,0.7)",
                  border: `1px solid ${active ? "rgba(96,165,250,0.6)" : "rgba(37,99,235,0.18)"}`,
                  color: active ? "#93C5FD" : "#94A3B8",
                  boxShadow: active ? "0 0 12px rgba(37,99,235,0.25)" : "none",
                }}
              >
                <span
                  className="w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center"
                  style={{
                    background: active ? "rgba(37,99,235,0.3)" : "rgba(255,255,255,0.05)",
                    color: active ? "#60A5FA" : "#64748B"
                  }}
                >
                  {dt.icon}
                </span>
                <span>{dt.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload area — Ordivalabs Blueprint Dashed Box */}
      <div
        className="rounded-xl p-8 sm:p-10 text-center mb-5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
        onClick={() => !uploading && !extracting && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        style={{
          background: dragOver ? "rgba(37,99,235,0.12)" : "rgba(14,21,38,0.6)",
          border: `1.5px dashed ${dragOver ? "rgba(96,165,250,0.8)" : "rgba(37,99,235,0.3)"}`,
          boxShadow: dragOver ? "0 0 24px rgba(37,99,235,0.3)" : "none",
          opacity: uploading || extracting ? 0.6 : 1
        }}
      >
        <div className="absolute top-3 right-3 text-[9px] font-mono text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 bg-blue-500/10">
          [INGESTION.STREAM]
        </div>

        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
          style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}
        >
          {uploading || extracting ? (
            <span
              className="w-5 h-5 rounded-full border-2 inline-block animate-spin"
              style={{ borderColor: "rgba(96,165,250,0.3)", borderTopColor: "#60A5FA" }}
            />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.6" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <path d="M17 8l-5-5-5 5M12 3v12" />
            </svg>
          )}
        </div>

        <p className="text-sm font-semibold text-white mb-1 tracking-tight">
          {uploading ? "Ingesting payload..." : extracting ? "Neural OCR extracting telemetry..." : `Upload ${DOC_TYPES.find(d => d.value === docType)?.label || "Document"}`}
        </p>
        <p className="text-xs font-mono text-slate-400 leading-relaxed max-w-sm mx-auto">
          {extracting ? "Running structural parsing & entity resolution" : "Drag & drop document or browse local files — PDF, JPG, PNG — Max 10MB"}
        </p>
        <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={(e) => { onUpload(e.target.files?.[0]); e.target.value = ""; }} disabled={uploading || extracting} />
      </div>

      {/* AI Extraction result — Auto-fill confirmation card */}
      {extraction && (
        <div className="blueprint-card p-5 mb-5 relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(37,99,235,0.2)", border: "1px solid rgba(96,165,250,0.3)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round">
                <path d="M12 2a4 4 0 014 4c0 1.95-2 3-2 3h-4s-2-1.05-2-3a4 4 0 014-4z" />
                <path d="M10 22v-4M14 22v-4M10 18h4" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-mono font-bold text-white uppercase">[OCR_EXTRACTION_CONFIRMED]</p>
              <p className="text-[11px] font-mono text-slate-400">{Object.keys(extraction.formFields || {}).length} verified fields extracted from {DOC_TYPES.find(d => d.value === extraction.documentType)?.label}</p>
            </div>
          </div>

          <div className="space-y-1.5 mb-4 relative z-10">
            {Object.entries(extraction.extracted || {}).map(([key, value]) => {
              if (!value || value === "") return null;
              return (
                <div key={key} className="flex justify-between items-center px-3 py-2 rounded-lg bg-black/40 border border-blue-500/15">
                  <span className="text-[11px] font-mono text-slate-400 capitalize">{key.replace(/([A-Z])/g, " $1").trim()}</span>
                  <span className="text-xs font-mono font-bold text-blue-300">{String(value)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 relative z-10">
            <button
              onClick={onApplyExtraction}
              className="btn-primary flex-1 py-2 font-mono text-xs uppercase flex items-center justify-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
              <span>INJECT INTO APPLICATION</span>
            </button>
            <button
              onClick={onDismissExtraction}
              className="btn-secondary px-4 py-2 font-mono text-xs uppercase"
            >
              DISMISS
            </button>
          </div>
        </div>
      )}

      {/* Uploaded docs list with verification badges */}
      {docs.length > 0 && (
        <div className="space-y-3 mb-8">
          {docs.map((d, i) => (
            <div key={i} className="rounded-xl overflow-hidden" style={{ background: "rgba(14,21,38,0.7)", border: "1px solid rgba(37,99,235,0.2)" }}>
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(37,99,235,0.15)", border: "1px solid rgba(96,165,250,0.3)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="1.6"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /></svg>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono font-medium truncate text-white">{d.name}</p>
                      {d.verification && <DocumentVerificationBadge verification={d.verification} compact />}
                    </div>
                    <p className="text-[10px] font-mono text-slate-400">{d.size ? `${(d.size / 1024).toFixed(0)} KB` : ""}{d.docType ? ` · ${d.docType}` : ""}</p>
                  </div>
                </div>
                <button
                  onClick={() => onRemoveDoc(i)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors"
                  style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", cursor: "pointer" }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(244,63,94,0.25)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(244,63,94,0.1)"}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FB7185" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>
              {/* Expandable verification details */}
              {d.verification && <div className="px-4 pb-3"><DocumentVerificationBadge verification={d.verification} /></div>}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
