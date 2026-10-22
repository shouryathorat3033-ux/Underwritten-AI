"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";

/**
 * Batch CSV upload — upload a CSV of applicants, process them all,
 * and show a summary with individual risk scores.
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
    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    return lines.slice(1).map(line => {
      const values = line.split(",").map(v => v.trim().replace(/"/g, ""));
      const obj = {};
      headers.forEach((h, i) => { obj[h] = values[i] || ""; });
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
      if (rows.length === 0) { toast.error("No valid rows found in CSV"); setProcessing(false); return; }
      if (rows.length > 50) { toast.error("Maximum 50 applicants per batch"); setProcessing(false); return; }

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

          const res = await fetch("/api/assessments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
          const data = await res.json();

          if (res.ok && data.assessment?._id) {
            // Trigger analysis
            const analyzeRes = await fetch(`/api/assessments/${data.assessment._id}/analyze`, { method: "POST" });
            const analyzeData = analyzeRes.ok ? await analyzeRes.json() : null;
            batchResults.push({
              name: body.applicant.name,
              policyType: body.policyType,
              riskScore: analyzeData?.result?.riskScore ?? "—",
              decision: analyzeData?.result?.decision ?? "pending",
              id: data.assessment._id,
            });
          } else {
            batchResults.push({ name: body.applicant.name, policyType: body.policyType, riskScore: "Error", decision: "error" });
          }
        } catch {
          batchResults.push({ name: rows[i].name || `Row ${i + 1}`, policyType: "—", riskScore: "Error", decision: "error" });
        }
        setProgress(((i + 1) / rows.length) * 100);
      }

      setResults(batchResults);
      toast.success(`Processed ${batchResults.length} assessments`);
    } catch { toast.error("Failed to process CSV"); }
    setProcessing(false);
  };

  const riskColor = (s) => {
    if (typeof s !== "number") return "#71717a";
    return s <= 35 ? "#10b981" : s <= 55 ? "#f59e0b" : s <= 75 ? "#ef4444" : "#dc2626";
  };
  const decisionColor = (d) => d === "approve" ? "#10b981" : d === "refer" ? "#f59e0b" : d === "decline" ? "#ef4444" : "#71717a";

  return (
    <div className="glass-card p-6">
      <h3 className="text-sm font-bold mb-1" style={{ color: "#fafafa" }}>Batch Assessment Upload</h3>
      <p className="text-[10px] mb-4" style={{ color: "#52525b" }}>Upload a CSV with columns: name, email, age, gender, occupation, income, creditScore, policyType</p>

      {!results && (
        <>
          {/* File selection */}
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => fileRef.current?.click()} disabled={processing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all duration-200"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.15)", color: "#10b981", cursor: "pointer", fontFamily: "inherit" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
              {file ? file.name : "Select CSV File"}
            </button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { setFile(e.target.files?.[0] || null); e.target.value = ""; }} />
            {file && (
              <button onClick={handleUpload} disabled={processing}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200"
                style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 16px rgba(16,185,129,0.3)" }}>
                {processing ? `Processing... ${Math.round(progress)}%` : `Process ${file.name}`}
              </button>
            )}
          </div>

          {/* Progress */}
          {processing && (
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #10b981, #34d399)", transition: "width 0.3s", boxShadow: "0 0 12px rgba(16,185,129,0.3)" }} />
            </div>
          )}

          {/* Sample CSV format */}
          <div className="mt-4 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: "#3f3f46" }}>Sample CSV Format</p>
            <code className="text-[10px] font-mono leading-relaxed block" style={{ color: "#52525b" }}>
              name,email,age,gender,income,creditScore,policyType{"\n"}
              Priya Sharma,priya@test.com,28,female,1200000,780,health{"\n"}
              Arjun Patel,arjun@test.com,35,male,800000,650,auto
            </code>
          </div>
        </>
      )}

      {/* Results table */}
      {results && (
        <>
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-medium" style={{ color: "#a1a1aa" }}>{results.length} applicants processed</span>
            <button onClick={() => { setResults(null); setFile(null); }} className="text-[10px] font-medium px-3 py-1 rounded-lg"
              style={{ background: "rgba(255,255,255,0.04)", color: "#71717a", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              New Batch
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th className="text-[10px] font-semibold uppercase tracking-wider py-2 px-2" style={{ color: "#52525b" }}>Name</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider py-2 px-2" style={{ color: "#52525b" }}>Policy</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider py-2 px-2" style={{ color: "#52525b" }}>Score</th>
                  <th className="text-[10px] font-semibold uppercase tracking-wider py-2 px-2" style={{ color: "#52525b" }}>Decision</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td className="text-xs py-2.5 px-2 font-medium" style={{ color: "#fafafa" }}>{r.name}</td>
                    <td className="text-xs py-2.5 px-2 uppercase" style={{ color: "#71717a" }}>{r.policyType}</td>
                    <td className="py-2.5 px-2"><span className="font-mono text-xs font-bold" style={{ color: riskColor(r.riskScore) }}>{r.riskScore}</span></td>
                    <td className="py-2.5 px-2"><span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full" style={{ background: `${decisionColor(r.decision)}12`, color: decisionColor(r.decision) }}>{r.decision}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
