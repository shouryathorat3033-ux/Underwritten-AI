import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();
  const assessment = await Assessment.findById(id);
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const r = assessment.result || {};
  const a = assessment.applicant || {};
  const trad = assessment.traditionalData || {};
  const action = assessment.underwriterAction || {};
  const policyType = (assessment.policyType || "health").toUpperCase();
  const isAccepted = action.action === "accepted" || r.decision === "approve";
  const docType = isAccepted ? "POLICY APPROVAL" : r.decision === "decline" ? "ADVERSE ACTION NOTICE" : "UNDERWRITING REPORT";
  const date = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
  const refId = `UW-${id.slice(-8).toUpperCase()}`;

  const factors = (r.factors || []).map(f =>
    `| ${f.source || "—"} | ${f.score ?? "—"} | ${(f.weight * 100).toFixed(1)}% | ${f.impact || "—"} |`
  ).join("\n");

  const adverseReasons = (r.adverseActionReasons || []).map((ar, i) =>
    `${i + 1}. **${ar.factor}** — ${ar.reason}`
  ).join("\n");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>UnderwriteAI - ${docType}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; color: #1a1a1a; padding: 40px; max-width: 800px; margin: 0 auto; font-size: 13px; line-height: 1.6; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #10b981; padding-bottom: 20px; margin-bottom: 30px; }
  .logo { font-size: 22px; font-weight: 800; color: #10b981; }
  .logo span { color: #1a1a1a; }
  .doc-type { font-size: 18px; font-weight: 700; color: ${isAccepted ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"}; margin-bottom: 4px; }
  .ref { font-size: 11px; color: #888; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #10b981; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .field { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
  .field-label { color: #6b7280; font-size: 12px; }
  .field-value { font-weight: 600; text-align: right; }
  .score-box { text-align: center; padding: 24px; background: ${isAccepted ? "#f0fdf4" : r.decision === "decline" ? "#fef2f2" : "#fffbeb"}; border-radius: 12px; border: 2px solid ${isAccepted ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"}; margin: 20px 0; }
  .score-number { font-size: 48px; font-weight: 800; color: ${isAccepted ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"}; }
  .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #6b7280; margin-top: 4px; }
  .decision-badge { display: inline-block; padding: 6px 20px; border-radius: 999px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: white; background: ${isAccepted ? "#10b981" : r.decision === "decline" ? "#ef4444" : "#f59e0b"}; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th { background: #f9fafb; text-align: left; padding: 8px 10px; font-weight: 600; color: #374151; border-bottom: 2px solid #e5e7eb; }
  td { padding: 6px 10px; border-bottom: 1px solid #f3f4f6; }
  .adverse { background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin: 16px 0; }
  .adverse-title { font-weight: 700; color: #ef4444; margin-bottom: 8px; }
  .premium-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 16px 0; }
  .premium-range { font-size: 22px; font-weight: 700; color: #10b981; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e5e7eb; display: flex; justify-content: space-between; font-size: 10px; color: #9ca3af; }
  .stamp { text-align: right; }
  .stamp-text { font-size: 12px; font-weight: 700; color: #10b981; }
  .explanation { background: #f9fafb; border-radius: 8px; padding: 14px; font-size: 12px; color: #4b5563; line-height: 1.7; margin-top: 8px; }
  @media print { body { padding: 20px; } .score-box { break-inside: avoid; } }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">Underwrite<span>AI</span></div>
    <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">Intelligent Risk Assessment Platform</div>
  </div>
  <div style="text-align: right;">
    <div class="doc-type">${docType}</div>
    <div class="ref">Ref: ${refId}</div>
    <div class="ref">Date: ${date}</div>
  </div>
</div>

<div class="section">
  <div class="section-title">Applicant Information</div>
  <div class="grid">
    <div class="field"><span class="field-label">Full Name</span><span class="field-value">${a.name || "—"}</span></div>
    <div class="field"><span class="field-label">Age</span><span class="field-value">${a.age || "—"}</span></div>
    <div class="field"><span class="field-label">Gender</span><span class="field-value" style="text-transform:capitalize">${a.gender || "—"}</span></div>
    <div class="field"><span class="field-label">Occupation</span><span class="field-value">${a.occupation || "—"}</span></div>
    <div class="field"><span class="field-label">Policy Type</span><span class="field-value">${policyType}</span></div>
    <div class="field"><span class="field-label">Annual Income</span><span class="field-value">${trad.income ? `₹${Number(trad.income).toLocaleString("en-IN")}` : "—"}</span></div>
    <div class="field"><span class="field-label">Credit Score</span><span class="field-value">${trad.creditScore || "—"}</span></div>
    <div class="field"><span class="field-label">Existing Policies</span><span class="field-value">${trad.existingPolicies ?? "—"}</span></div>
  </div>
</div>

<div class="score-box">
  <div class="score-number">${r.riskScore ?? "—"}</div>
  <div class="score-label">AI Risk Score (0-100)</div>
  <div style="margin-top: 12px;">
    <span class="decision-badge">${r.decision || "pending"}</span>
  </div>
  <div style="font-size: 11px; color: #6b7280; margin-top: 8px;">Confidence: ${r.confidence || "—"}% &nbsp;|&nbsp; Processing: ${r.processingTime || "—"}ms</div>
</div>

${r.recommendedPremium ? `
<div class="premium-box">
  <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 4px;">Recommended Annual Premium</div>
  <div class="premium-range">₹${r.recommendedPremium.min?.toLocaleString("en-IN")} — ₹${r.recommendedPremium.max?.toLocaleString("en-IN")}</div>
</div>
` : ""}

<div class="section">
  <div class="section-title">Risk Factor Analysis</div>
  <table>
    <thead><tr><th>Factor</th><th>Score</th><th>Weight</th><th>Impact</th></tr></thead>
    <tbody>
      ${(r.factors || []).map(f => `
        <tr>
          <td>${f.source || "—"}</td>
          <td>${f.score ?? "—"}</td>
          <td>${(f.weight * 100).toFixed(1)}%</td>
          <td style="color: ${f.impact === "positive" ? "#10b981" : f.impact === "negative" ? "#ef4444" : "#6b7280"}; font-weight: 600; text-transform: capitalize;">${f.impact || "—"}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>
</div>

${r.adverseActionReasons?.length > 0 ? `
<div class="adverse">
  <div class="adverse-title">Adverse Action Reasons</div>
  ${r.adverseActionReasons.map((ar, i) => `
    <div style="margin-bottom: 6px;"><strong>${i + 1}. ${ar.factor}</strong> — ${ar.reason}</div>
  `).join("")}
  <div style="font-size: 11px; color: #6b7280; margin-top: 10px;">The applicant may address these factors and reapply for coverage.</div>
</div>
` : ""}

${r.explanation ? `
<div class="section">
  <div class="section-title">AI Analysis</div>
  <div class="explanation">${r.explanation}</div>
</div>
` : ""}

${action.action ? `
<div class="section">
  <div class="section-title">Underwriter Decision</div>
  <div class="grid">
    <div class="field"><span class="field-label">Action</span><span class="field-value" style="text-transform:capitalize; color: ${action.action === "accepted" ? "#10b981" : "#ef4444"}">${action.action}</span></div>
    <div class="field"><span class="field-label">Date</span><span class="field-value">${action.actionAt ? new Date(action.actionAt).toLocaleDateString("en-IN") : date}</span></div>
  </div>
  ${action.justification ? `<div class="explanation" style="margin-top: 10px;"><strong>Justification:</strong> ${action.justification}</div>` : ""}
</div>
` : ""}

<div class="footer">
  <div>
    <div>UnderwriteAI — Automated Risk Assessment Platform</div>
    <div>This document was generated by an AI-powered underwriting system.</div>
    <div>Assessment ID: ${id}</div>
  </div>
  <div class="stamp">
    <div class="stamp-text">DIGITALLY VERIFIED</div>
    <div>Generated: ${date}</div>
    <div>${r.mlModelUsed ? "ML Model + LLM Analysis" : "LLM Analysis"}</div>
  </div>
</div>

</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="UnderwriteAI-${refId}.html"`,
    },
  });
}
