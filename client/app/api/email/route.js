import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const POLICY_LABELS = {
  health: "Health Insurance",
  auto: "Auto Insurance",
  life: "Life Insurance",
  property: "Property Insurance",
};

const POLICY_COLORS = {
  health: "#10b981",
  auto: "#f59e0b",
  life: "#a78bfa",
  property: "#60a5fa",
};

/* ═══════════════════════════════════════════
   SHARED EMAIL LAYOUT
   ═══════════════════════════════════════════ */
function emailLayout({ title, preheader, accentColor, body }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light dark"/>
<title>${title}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body{margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;color:#e4e4e7;-webkit-font-smoothing:antialiased}
  .wrapper{width:100%;background:#0a0a0b;padding:40px 0}
  .container{max-width:600px;margin:0 auto;background:#111113;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06)}
  .header{background:linear-gradient(135deg,${accentColor}18,${accentColor}08);padding:32px 40px;border-bottom:1px solid rgba(255,255,255,0.06)}
  .logo{font-size:22px;font-weight:800;letter-spacing:-0.5px;color:#fafafa}
  .logo span{color:${accentColor}}
  .body{padding:36px 40px}
  .footer{padding:24px 40px;border-top:1px solid rgba(255,255,255,0.04);text-align:center}
  .footer p{margin:0;font-size:12px;color:#52525b;line-height:1.6}
  h1{font-size:24px;font-weight:700;color:#fafafa;margin:0 0 8px}
  h2{font-size:18px;font-weight:700;color:#fafafa;margin:24px 0 12px}
  p{font-size:14px;line-height:1.7;color:#a1a1aa;margin:0 0 16px}
  .badge{display:inline-block;padding:6px 16px;border-radius:20px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px}
  .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:20px 24px;margin:16px 0}
  .card-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
  .card-row:last-child{border-bottom:none}
  .card-label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:#71717a}
  .card-value{font-size:14px;font-weight:600;color:#e4e4e7}
  .btn{display:inline-block;padding:14px 32px;border-radius:12px;font-size:14px;font-weight:700;text-decoration:none;text-align:center;color:#fff;background:${accentColor};letter-spacing:0.3px}
  .divider{height:1px;background:rgba(255,255,255,0.06);margin:24px 0}
  .steps{list-style:none;padding:0;margin:16px 0}
  .steps li{position:relative;padding:8px 0 8px 32px;font-size:14px;color:#a1a1aa;line-height:1.6}
  .steps li::before{content:attr(data-step);position:absolute;left:0;top:8px;width:20px;height:20px;border-radius:50%;background:${accentColor}18;color:${accentColor};font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;text-align:center;line-height:20px}
  .score-ring{width:100px;height:100px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px}
  .score-num{font-size:36px;font-weight:800;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace}
  @media(max-width:640px){.body,.header,.footer{padding-left:24px;padding-right:24px}.container{margin:0 12px;border-radius:12px}}
</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden">${preheader}</div>
<div class="wrapper">
<div class="container">
  <div class="header">
    <div class="logo">Underwrite<span>AI</span></div>
  </div>
  <div class="body">
    ${body}
  </div>
  <div class="footer">
    <p>This is an automated message from UnderwriteAI.<br/>Please do not reply to this email.</p>
    <p style="margin-top:8px;color:#3f3f46">&copy; ${new Date().getFullYear()} UnderwriteAI &middot; AI-Powered Insurance Underwriting</p>
  </div>
</div>
</div>
</body>
</html>`;
}

/* ═══════════════════════════════════════════
   1. SUBMISSION CONFIRMATION EMAIL
   ═══════════════════════════════════════════ */
function buildSubmissionEmail({ name, assessmentId, policyType }) {
  const policyLabel = POLICY_LABELS[policyType] || "Insurance";
  const color = POLICY_COLORS[policyType] || "#10b981";

  const body = `
    <h1>Application Received</h1>
    <p>Hi <strong style="color:#fafafa">${name || "there"}</strong>,</p>
    <p>Thank you for submitting your <strong style="color:${color}">${policyLabel}</strong> application. We've received your information and our AI engine is already at work.</p>

    <div class="card">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Reference ID</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:13px;font-weight:700;color:${color};background:${color}15;padding:4px 12px;border-radius:6px">${assessmentId}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Policy Type</span>
          </td>
          <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span class="card-value">${policyLabel}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0">
            <span class="card-label">Status</span>
          </td>
          <td style="padding:8px 0;text-align:right">
            <span class="badge" style="background:rgba(245,158,11,0.12);color:#fbbf24;border:1px solid rgba(245,158,11,0.2)">Under Review</span>
          </td>
        </tr>
      </table>
    </div>

    <h2>What Happens Next?</h2>
    <ol class="steps">
      <li data-step="1"><strong style="color:#e4e4e7">AI Analysis</strong> — Our ML engine scores your risk profile using 15+ data points</li>
      <li data-step="2"><strong style="color:#e4e4e7">Underwriter Review</strong> — A qualified underwriter reviews the AI assessment</li>
      <li data-step="3"><strong style="color:#e4e4e7">Decision Notification</strong> — You'll receive an email with the final decision and premium details</li>
    </ol>

    <div class="divider"></div>
    <p style="font-size:13px;color:#71717a">Please save your Reference ID for future correspondence. If you have any questions, feel free to reach out to our support team.</p>
  `;

  return {
    subject: `Application Received — ${policyLabel} | Ref: ${assessmentId}`,
    html: emailLayout({
      title: `Application Received — ${policyLabel}`,
      preheader: `Your ${policyLabel} application (${assessmentId}) has been received and is being processed.`,
      accentColor: color,
      body,
    }),
  };
}

/* ═══════════════════════════════════════════
   2. UNDERWRITER DECISION EMAIL
   ═══════════════════════════════════════════ */
function buildDecisionEmail({ name, assessmentId, policyType, action, justification, riskScore, premium, modifiedPremium }) {
  const policyLabel = POLICY_LABELS[policyType] || "Insurance";

  const decisionConfig = {
    accepted: {
      color: "#10b981",
      label: "Approved",
      emoji: "&#10003;",
      headline: "Your Application Has Been Approved!",
      message: "Great news! After careful review by our underwriting team, your application has been approved.",
      bgGradient: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))",
    },
    rejected: {
      color: "#ef4444",
      label: "Declined",
      emoji: "&#10007;",
      headline: "Application Update",
      message: "After thorough review by our underwriting team, we regret to inform you that your application could not be approved at this time.",
      bgGradient: "linear-gradient(135deg, rgba(239,68,68,0.12), rgba(239,68,68,0.04))",
    },
    modified: {
      color: "#f59e0b",
      label: "Approved with Modified Premium",
      emoji: "&#9998;",
      headline: "Your Application Has Been Approved!",
      message: "Your application has been approved with an adjusted premium. Our underwriter has reviewed your profile and recommended a modified premium based on the risk assessment.",
      bgGradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))",
    },
    info_requested: {
      color: "#3b82f6",
      label: "Additional Information Required",
      emoji: "?",
      headline: "Additional Information Needed",
      message: "Our underwriting team has reviewed your application and requires some additional information before making a final decision.",
      bgGradient: "linear-gradient(135deg, rgba(59,130,246,0.12), rgba(59,130,246,0.04))",
    },
  };

  const d = decisionConfig[action] || decisionConfig.info_requested;
  const scoreColor = riskScore <= 30 ? "#10b981" : riskScore <= 60 ? "#f59e0b" : "#ef4444";
  const scoreLabel = riskScore <= 30 ? "Low Risk" : riskScore <= 60 ? "Medium Risk" : "High Risk";
  const finalPremium = modifiedPremium || premium;

  const body = `
    <!-- Decision Banner -->
    <div style="background:${d.bgGradient};border:1px solid ${d.color}25;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px">
      <div style="width:56px;height:56px;border-radius:50%;background:${d.color}18;border:2px solid ${d.color}30;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px">
        <span style="font-size:24px;color:${d.color}">${d.emoji}</span>
      </div>
      <h1 style="margin:0 0 4px;font-size:22px">${d.headline}</h1>
      <span class="badge" style="background:${d.color}18;color:${d.color};border:1px solid ${d.color}30;margin-top:8px">${d.label}</span>
    </div>

    <p>Hi <strong style="color:#fafafa">${name || "there"}</strong>,</p>
    <p>${d.message}</p>

    <!-- Assessment Details Card -->
    <div class="card">
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Reference ID</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:13px;font-weight:700;color:#a1a1aa">${assessmentId}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Policy Type</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span class="card-value">${policyLabel}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Decision</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span class="badge" style="background:${d.color}15;color:${d.color};border:1px solid ${d.color}25">${d.label}</span>
          </td>
        </tr>
        ${riskScore != null ? `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span class="card-label">Risk Score</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.04);text-align:right">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:18px;font-weight:800;color:${scoreColor}">${riskScore}</span>
            <span style="font-size:11px;color:#52525b">/100</span>
            <span style="display:inline-block;margin-left:8px;font-size:10px;font-weight:600;padding:2px 8px;border-radius:4px;background:${scoreColor}15;color:${scoreColor}">${scoreLabel}</span>
          </td>
        </tr>` : ""}
        ${finalPremium ? `
        <tr>
          <td style="padding:10px 0">
            <span class="card-label">${modifiedPremium ? "Modified Premium" : "Recommended Premium"}</span>
          </td>
          <td style="padding:10px 0;text-align:right">
            <span style="font-family:'SF Mono',SFMono-Regular,Consolas,monospace;font-size:16px;font-weight:700;color:#10b981">&#8377;${Number(finalPremium.min).toLocaleString("en-IN")} — &#8377;${Number(finalPremium.max).toLocaleString("en-IN")}</span>
            <span style="font-size:11px;color:#52525b">/year</span>
          </td>
        </tr>` : ""}
      </table>
    </div>

    <!-- Underwriter Remarks -->
    ${justification ? `
    <h2>Underwriter Remarks</h2>
    <div style="background:rgba(255,255,255,0.02);border-left:3px solid ${d.color};border-radius:0 8px 8px 0;padding:16px 20px;margin:12px 0">
      <p style="margin:0;font-size:14px;color:#d4d4d8;line-height:1.7;font-style:italic">&ldquo;${justification}&rdquo;</p>
    </div>` : ""}

    <div class="divider"></div>

    ${action === "rejected" ? `
    <h2>What You Can Do</h2>
    <ol class="steps">
      <li data-step="1"><strong style="color:#e4e4e7">Review the feedback</strong> — Understand the factors that influenced this decision</li>
      <li data-step="2"><strong style="color:#e4e4e7">Address risk factors</strong> — Work on improving the areas highlighted in the assessment</li>
      <li data-step="3"><strong style="color:#e4e4e7">Re-apply</strong> — You are welcome to submit a new application after addressing the concerns</li>
    </ol>` : ""}

    ${action === "info_requested" ? `
    <h2>What You Need To Do</h2>
    <ol class="steps">
      <li data-step="1"><strong style="color:#e4e4e7">Review the request</strong> — Check the underwriter's remarks above for what's needed</li>
      <li data-step="2"><strong style="color:#e4e4e7">Gather documents</strong> — Prepare the requested information or documents</li>
      <li data-step="3"><strong style="color:#e4e4e7">Respond promptly</strong> — Submit the additional information as soon as possible to avoid delays</li>
    </ol>` : ""}

    ${action === "accepted" || action === "modified" ? `
    <h2>Next Steps</h2>
    <ol class="steps">
      <li data-step="1"><strong style="color:#e4e4e7">Review your premium</strong> — Check the premium details above and ensure they meet your budget</li>
      <li data-step="2"><strong style="color:#e4e4e7">Policy issuance</strong> — Your policy documents will be prepared and sent to you shortly</li>
      <li data-step="3"><strong style="color:#e4e4e7">Coverage begins</strong> — Once payment is confirmed, your coverage will be activated</li>
    </ol>` : ""}

    <p style="font-size:13px;color:#71717a;margin-top:24px">If you have any questions about this decision, please contact our support team with your Reference ID.</p>
  `;

  const subjectMap = {
    accepted: `Application Approved — ${policyLabel} | Ref: ${assessmentId}`,
    rejected: `Application Update — ${policyLabel} | Ref: ${assessmentId}`,
    modified: `Application Approved (Modified Premium) — ${policyLabel} | Ref: ${assessmentId}`,
    info_requested: `Action Required — ${policyLabel} | Ref: ${assessmentId}`,
  };

  return {
    subject: subjectMap[action] || `Application Update — ${policyLabel}`,
    html: emailLayout({
      title: subjectMap[action] || "Application Update",
      preheader: d.message,
      accentColor: d.color,
      body,
    }),
  };
}

/* ═══════════════════════════════════════════
   ROUTE HANDLER
   ═══════════════════════════════════════════ */
export async function POST(req) {
  try {
    const payload = await req.json();
    const { to, type } = payload;

    if (!to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }

    let email;

    if (type === "decision") {
      // Underwriter decision email
      email = buildDecisionEmail(payload);
    } else {
      // Default: submission confirmation
      if (!payload.assessmentId) {
        return NextResponse.json({ error: "Assessment ID is required" }, { status: 400 });
      }
      email = buildSubmissionEmail(payload);
    }

    await transporter.sendMail({
      from: `"UnderwriteAI" <${process.env.EMAIL_USER}>`,
      to,
      subject: email.subject,
      html: email.html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
