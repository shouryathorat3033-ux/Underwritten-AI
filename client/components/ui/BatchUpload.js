"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Batch CSV upload — upload a CSV of applicants, process them all,
 * and show a summary with individual risk scores in Ordivalabs precision style.
 */
export default function BatchUpload() {
  const [file, setFile] = useState(null);
  const [results, setResults] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef(null);

  const parseCSV = (text) => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    return lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = values[i] || "";
      });
      return obj;
    });
  };

  const handleUpload = async () => {
    if (!file) return;
    setProcessing(true);
    setProgress(0);
    setResults(null);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) {
        toast.error("No valid rows detected in CSV structure");
        setProcessing(false);
        return;
      }
      if (rows.length > 50) {
        toast.error("Batch volume limit exceeded (Max 50 applicants/batch)");
        setProcessing(false);
        return;
      }

      const batchResults = [];
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        try {
          const body = {
            policyType: (row.policyType || row.policy_type || "health").toLowerCase(),
            applicant: {
              name: row.name || row.applicantName || `Applicant ${i + 1}`,
              email: row.email || "",
              age: Number(row.age) || 0,
              gender: row.gender || "",
              occupation: row.occupation || "",
            },
            traditionalData: {
              income: Number(row.income) || 0,
              creditScore: Number(row.creditScore || row.credit_score) || 0,
              existingPolicies: Number(row.existingPolicies) || 0,
            },
            alternativeData: {},
            policySpecificData: {},
          };

          const res = await fetch("/api/assessments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = await res.json();

          if (res.ok && data.assessment?._id) {
            // Trigger analysis
            const analyzeRes = await fetch(`/api/assessments/${data.assessment._id}/analyze`, {
              method: "POST",
            });
            const analyzeData = analyzeRes.ok ? await analyzeRes.json() : null;
            batchResults.push({
              name: body.applicant.name,
              policyType: body.policyType,
              riskScore: analyzeData?.result?.riskScore ?? "—",
              decision: analyzeData?.result?.decision ?? "pending",
              id: data.assessment._id,
            });
          } else {
            batchResults.push({
              name: body.applicant.name,
              policyType: body.policyType,
              riskScore: "Error",
              decision: "error",
            });
          }
        } catch {
          batchResults.push({
            name: rows[i].name || `Row ${i + 1}`,
            policyType: "—",
            riskScore: "Error",
            decision: "error",
          });
        }
        setProgress(((i + 1) / rows.length) * 100);
      }

      setResults(batchResults);
      toast.success(`Processed ${batchResults.length} assessments through neural pipeline`);
    } catch {
      toast.error("Failed to parse and dispatch CSV batch");
    }
    setProcessing(false);
  };

  const riskColor = (s) => {
    if (typeof s !== "number") return "#64748B";
    return s <= 35 ? "#10B981" : s <= 65 ? "#F59E0B" : "#F43F5E";
  };

  return (
    <div>
      {!results && (
        <div className="space-y-4">
          {/* File selection */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={processing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-mono font-semibold transition-all bg-[#070A13] border border-blue-500/30 text-blue-400 hover:border-blue-400 hover:text-blue-300"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              {file ? file.name : "SELECT_CSV_DOSSIER"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                e.target.value = "";
              }}
            />
            {file && (
              <button
                type="button"
                onClick={handleUpload}
                disabled={processing}
                className="px-4 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-all shadow-md shadow-blue-500/20 border border-blue-400/30"
              >
                {processing ? `Ingesting... ${Math.round(progress)}%` : `PROCESS [${file.name}]`}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {processing && (
            <div className="h-1.5 rounded-full overflow-hidden bg-slate-900 border border-slate-800">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Sample CSV Format Preview */}
          <div className="p-3 rounded-lg bg-[#070A13] border border-slate-800/80">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5">
              [SCHEMA.CSV_SPECIFICATION]
            </span>
            <code className="text-[11px] font-mono text-slate-400 block whitespace-pre">
              name,email,age,gender,income,creditScore,policyType{"\n"}
              Priya Sharma,priya@test.com,28,female,1200000,780,health{"\n"}
              Arjun Patel,arjun@test.com,35,male,800000,650,auto
            </code>
          </div>
        </div>
      )}

      {/* Results table */}
      {results && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400">
              BATCH COMPLETE: {results.length} applicants analyzed
            </span>
            <button
              onClick={() => {
                setResults(null);
                setFile(null);
              }}
              className="text-[10px] font-mono uppercase px-3 py-1 rounded bg-[#070A13] border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              Dispatch New Batch
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500">
                  <th className="py-2 px-2">Applicant</th>
                  <th className="py-2 px-2">Policy Class</th>
                  <th className="py-2 px-2">Risk Vector</th>
                  <th className="py-2 px-2 text-right">Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {results.map((r, i) => (
                  <tr key={i} className="hover:bg-blue-950/20 transition-colors">
                    <td className="py-2.5 px-2 font-medium text-slate-200">{r.name}</td>
                    <td className="py-2.5 px-2 uppercase text-slate-400">{r.policyType}</td>
                    <td className="py-2.5 px-2">
                      <span className="font-bold" style={{ color: riskColor(r.riskScore) }}>
                        {r.riskScore}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span
                        className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          r.decision === "approve"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : r.decision === "decline"
                            ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}
                      >
                        {r.decision}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
