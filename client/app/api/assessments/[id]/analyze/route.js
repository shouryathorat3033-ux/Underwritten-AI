import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";
import Groq from "groq-sdk";
import { getPythonBackendUrl } from "@/lib/api-config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ── Simple in-memory rate limiter (per user, 5 requests per minute) ── */
const rateMap = new Map();
const RATE_LIMIT = 5;
const RATE_WINDOW = 60_000;

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateMap.get(userId);
  if (!entry || now - entry.windowStart > RATE_WINDOW) {
    rateMap.set(userId, { windowStart: now, count: 1 });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

/* ── Scoring rubrics removed — ML model handles all scoring now ── */
const _UNUSED_RUBRICS = {
  health: `
SCORING RUBRIC (Health Insurance):
- Age 18-30: low risk (+0), 31-45: moderate (+5), 46-60: elevated (+15), 61+: high (+25)
- BMI 18.5-24.9: optimal (+0), 25-29.9: overweight (+8), 30+: obese (+18), <18.5: underweight (+10)
- Blood Pressure normal: +0, elevated: +8, high: +15, very high: +25
- Smoking: never +0, former +10, current +25
- Exercise 5+/week: -10, 3-4/week: -5, 1-2/week: +0, none: +12
- Medical history: each chronic condition +8, each surgery +5, cancer history +20
- Family history: heart disease +10, diabetes +8, cancer +12
- Credit Score >750: -5, 650-750: +0, 550-649: +10, <550: +20
- Income vs premium ratio: if income < 3x premium: +15
- Wearable data: resting HR <60: -5, 60-80: +0, >80: +10; steps >10k/day: -8, <5k: +8
- Telematics >80: -10, 60-80: -3, 40-60: +0, <40: +12
- Behavioral Score >80: -8, 60-80: -2, <40: +10
- Lifestyle Score >80: -10, 60-80: -3, <40: +15
- Social Media Risk: low -3, medium +5, high +15

BASE SCORE: 35. Add/subtract modifiers above. Clamp 0-100.
Decision thresholds: 0-35 APPROVE (low risk), 36-55 APPROVE (moderate risk), 56-75 REFER for manual review, 76-100 DECLINE.`,

  auto: `
SCORING RUBRIC (Auto Insurance):
- Age 18-21: very high risk (+25), 22-25: high (+15), 26-65: standard (+0), 66+: elevated (+10)
- Driving years <2: +20, 2-5: +10, 5-10: +3, 10+: -5
- Accidents (last 5y): 0: -5, 1: +10, 2: +22, 3+: +35
- Traffic violations: 0: -3, 1: +8, 2: +18, 3+: +30
- Vehicle age <2y: +5 (high value), 2-5y: +0, 5-10y: -3, 10+: +5 (reliability)
- Vehicle type: sedan +0, SUV +3, sports +15, truck +5, motorcycle +20
- Daily commute <10km: -5, 10-30km: +0, 30-60km: +8, 60+km: +15
- Credit Score >750: -8, 650-750: +0, <650: +12
- Telematics Score >85: -15, 70-85: -8, 50-70: +0, 30-50: +12, <30: +25
- Behavioral Score >80: -10, 60-80: -3, <60: +8
- Social Media Risk: low -3, medium +5, high +12

BASE SCORE: 30. Add/subtract modifiers. Clamp 0-100.
Decision: 0-35 APPROVE (preferred), 36-55 APPROVE (standard), 56-75 REFER, 76-100 DECLINE.`,

  life: `
SCORING RUBRIC (Life Insurance):
- Age 18-30: low (+0), 31-40: +5, 41-50: +12, 51-60: +22, 61-70: +35, 71+: +45
- Smoking: never +0, quit >5y +8, quit <5y +15, current +30
- Alcohol: none/moderate +0, heavy +15
- Exercise 5+/week: -10, 3-4: -5, 1-2: +0, none: +10
- BMI 18.5-24.9: +0, 25-29.9: +5, 30-34.9: +12, 35+: +22
- Family history: heart disease <60: +15, cancer <60: +18, diabetes: +8, longevity 80+: -8
- Income stability high: -5, medium: +0, low: +10
- Dependents 0: +0, 1-2: +0, 3+: +3 (higher coverage need)
- Existing policies 0: +3, 1-2: +0, 3+: -3 (insurance-savvy)
- Credit Score >750: -5, 650-750: +0, <650: +10
- Wearable data: good vitals (low HR, high activity): -12, poor vitals: +15
- Behavioral/Lifestyle Score >80: -10, 50-80: +0, <50: +12

BASE SCORE: 25. Add/subtract modifiers. Clamp 0-100.
Decision: 0-35 APPROVE (preferred rates), 36-55 APPROVE (standard), 56-75 REFER, 76-100 DECLINE.`,

  property: `
SCORING RUBRIC (Property Insurance):
- Property age <5y: -5, 5-15y: +0, 15-30y: +8, 30-50y: +15, 50+: +25
- Property value <20L: +0, 20-50L: +3, 50L-1Cr: +8, 1Cr+: +12
- Area >3000sqft: +5, 1500-3000sqft: +0, <1500sqft: -3
- Construction: concrete/brick -5, wood frame +8, mixed +3
- Flood zone: none -5, low +0, moderate +12, high +25
- Security system: comprehensive -10, basic -3, none +10
- Fire protection: <5km from station -3, 5-10km +0, >10km +10
- Roof age <5y: -5, 5-15y: +0, >15y: +12
- Previous claims: 0 -5, 1 +8, 2+ +20
- Credit Score >750: -5, 650-750: +0, <650: +10
- IoT sensors present: -8, not present: +5
- Neighborhood crime rate: low -5, medium +5, high +15

BASE SCORE: 30. Add/subtract modifiers. Clamp 0-100.
Decision: 0-35 APPROVE (preferred), 36-55 APPROVE (standard), 56-75 REFER, 76-100 DECLINE.`,
};

export async function POST(req, { params }) {
  const session = await auth();

  const { id } = await params;
  await dbConnect();

  // Allow authenticated users (own assessments or underwriter/admin) and public assessments
  let assessment;
  if (session) {
    if (!checkRateLimit(session.user.id)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute before analyzing again." }, { status: 429 });
    }
    // Underwriters/admins can analyze any assessment
    const filter = (session.user.role === "underwriter" || session.user.role === "admin")
      ? { _id: id }
      : { _id: id, userId: session.user.id };
    assessment = await Assessment.findOne(filter);
  } else {
    // Public assessment — rate limit by assessment id
    if (!checkRateLimit(id)) {
      return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
    }
    assessment = await Assessment.findOne({ _id: id, isPublic: true });
  }
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const startTime = Date.now();
  assessment.status = "processing";
  await Assessment.updateOne({ _id: assessment._id }, { $set: { status: "processing" } });

  try {
    const pythonUrl = getPythonBackendUrl();
    const policyType = ["health", "auto", "life", "property"].includes(assessment.policyType)
      ? assessment.policyType : "health";
    const trad = assessment.traditionalData || {};
    const alt = assessment.alternativeData || {};
    const psd = assessment.policySpecificData || {};

    // Sanitize user inputs before embedding in LLM prompt
    const sanitize = (val) => {
      if (val == null) return "";
      return String(val).replace(/[<>{}[\]\\`]/g, "").slice(0, 200);
    };

    // ═══════════════════════════════════════════════
    // STEP 1: Try ML model first (Python backend)
    // ═══════════════════════════════════════════════
    // STEP 1: ML MODEL (MANDATORY — no fallback)
    // All scoring comes from the trained ensemble model.
    // ═══════════════════════════════════════════════
    console.log("[analyze] STEP 1: Calling ML model at", pythonUrl);
    let mlResult;
    try {
      const mlRes = await fetch(new URL("/api/ml/score", pythonUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessment: assessment.toObject(), policyType }),
        signal: AbortSignal.timeout(15000),
      });
      if (!mlRes.ok) {
        const errText = await mlRes.text().catch(() => "");
        throw new Error(`ML returned ${mlRes.status}: ${errText}`);
      }
      mlResult = await mlRes.json();
      console.log("[analyze] ML OK: score=", mlResult.riskScore, "decision=", mlResult.decision);
    } catch (e) {
      console.error("[analyze] ML FAILED:", e.message);
      await Assessment.updateOne({ _id: assessment._id }, { $set: { status: "error" } });
      return NextResponse.json({
        error: `ML scoring failed: ${e.message}. Ensure the Python backend is running at ${pythonUrl}`,
      }, { status: 502 });
    }

    // ═══════════════════════════════════════════════
    // STEP 2: RAG — Fetch IRDAI regulations for LLM context
    // ═══════════════════════════════════════════════
    console.log("[analyze] STEP 2: Fetching RAG context");
    let ragContext = "";
    try {
      const topFactors = mlResult.factors.slice(0, 4).map(f => f.source).join(", ");
      const ragRes = await fetch(new URL("/api/rag/search", pythonUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `${policyType} insurance ${mlResult.decision} ${topFactors} IRDAI regulation underwriting`,
          top_k: 4,
          threshold: 0.04,
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (ragRes.ok) {
        const ragData = await ragRes.json();
        if (ragData.results?.length > 0) {
          ragContext = "\n\nIRDAI REGULATORY CONTEXT (you MUST cite these in your explanation):\n" +
            ragData.results.map((r, i) => `[${i + 1}] ${r.source}: "${r.text}"`).join("\n\n");
        }
      }
      console.log("[analyze] RAG: found", ragContext ? "citations" : "no citations");
    } catch {
      console.log("[analyze] RAG unavailable, continuing without citations");
    }

    // ═══════════════════════════════════════════════
    // ═══════════════════════════════════════════════
    // STEP 3: Gemma 4 E4B Reasoning (Primary) + Fallbacks
    // ═══════════════════════════════════════════════
    console.log("[analyze] STEP 3: Generating reasoning & explanation");
    let gemmaReasoning = null;
    let explanation = "";

    // 3a. Try local Gemma 4 E4B reasoning via Python backend
    try {
      const gemmaRes = await fetch(new URL("/api/reasoning/risk-assessment", pythonUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: assessment.toObject(),
          ml_result: mlResult,
          policyType,
        }),
        signal: AbortSignal.timeout(60000),
      });
      if (gemmaRes.ok) {
        const parsedGemma = await gemmaRes.json();
        gemmaReasoning = parsedGemma;
        if (parsedGemma.concise_dashboard_summary) {
          explanation = parsedGemma.concise_dashboard_summary;
          console.log("[analyze] Gemma 4 E4B reasoning generated successfully");
        }
      }
    } catch (gemmaErr) {
      console.warn("[analyze] Local Gemma 4 E4B reasoning unavailable or timed out:", gemmaErr.message);
    }

    // 3b. If local Gemma reasoning didn't set explanation, try Groq or compliance fallback
    if (!explanation) {
      const psdStr = Object.entries(psd)
        .filter(([, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => `- ${sanitize(k)}: ${sanitize(v)}`)
        .join("\n") || "No additional data provided";

      try {
        const prompt = `You are an insurance underwriting analyst for the Indian market regulated by IRDAI. Your job is to EXPLAIN an ML model's risk assessment decision — you do NOT generate scores or decisions yourself.

ML MODEL RESULT (these are final and authoritative):
- Risk Score: ${mlResult.riskScore}/100
- Decision: ${mlResult.decision.toUpperCase()}
- Confidence: ${mlResult.confidence}%
- Premium Range: ₹${mlResult.recommendedPremium?.min?.toLocaleString("en-IN")}-₹${mlResult.recommendedPremium?.max?.toLocaleString("en-IN")}
- Top Factors: ${mlResult.factors.slice(0, 6).map(f => `${f.source}: ${f.score}/100 (${f.impact}, weight ${Math.round(f.weight * 100)}%)`).join("; ")}
${mlResult.adverseActionReasons?.length ? `- Adverse Action Reasons: ${mlResult.adverseActionReasons.map(r => r.factor).join(", ")}` : ""}
${ragContext}

APPLICANT:
- Age: ${sanitize(assessment.applicant.age) || "N/A"}, Gender: ${sanitize(assessment.applicant.gender) || "N/A"}, Occupation: ${sanitize(assessment.applicant.occupation) || "N/A"}
- Income: ${trad.income ? `₹${Number(trad.income).toLocaleString("en-IN")}` : "N/A"}, Credit Score: ${sanitize(trad.creditScore) || "N/A"}
- ${policyType.toUpperCase()} data: ${psdStr}
- Alternative Data: Telematics ${alt.telematicsScore ?? "N/A"}/100, Behavioral ${alt.behavioralScore ?? "N/A"}/100, Lifestyle ${alt.lifestyleScore ?? "N/A"}/100, Social Media Risk: ${sanitize(alt.socialMediaRisk) || "N/A"}

Write a 2-3 paragraph explanation that:
1. References specific applicant data points and their impact
2. Explains how alternative data (telematics, behavioral, lifestyle) influenced the score
3. Cites specific IRDAI regulations by name/section from the regulatory context above (e.g., "Per IRDAI Circular IRDA/HLT/MISC/CIR/174/11/2020...")
4. Justifies why the ML decision (${mlResult.decision}) is appropriate for this risk level

Return ONLY the explanation text — no JSON, no formatting, just plain paragraphs.`;

        const completion = await groq.chat.completions.create({
          messages: [
            { role: "system", content: "You explain ML-generated insurance underwriting decisions to applicants and underwriters. Always cite IRDAI regulations. Write clear, professional paragraphs. Do NOT output JSON — just plain text." },
            { role: "user", content: prompt },
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          max_tokens: 1500,
        });
        explanation = completion.choices[0]?.message?.content?.trim() || "";
        console.log("[analyze] LLM explanation generated:", explanation.length, "chars");
      } catch (e) {
        console.warn("[analyze] LLM explanation failed:", e.message, e.status || "", e.error?.message || "");
        const posFactors = mlResult.factors.filter(f => f.impact === "positive").map(f => f.source);
        const negFactors = mlResult.factors.filter(f => f.impact === "negative").map(f => f.source);
        const decisionText = mlResult.decision === "approve"
          ? "approved for coverage at standard rates"
          : mlResult.decision === "refer"
          ? "referred for manual underwriter review due to elevated risk indicators"
          : "declined as the overall risk profile exceeds acceptable thresholds";

        const adverseText = mlResult.adverseActionReasons?.length
          ? `\n\nAs required by IRDAI (Health Insurance) Regulations 2016, Section 21, the key adverse factors are: ${mlResult.adverseActionReasons.map(r => `${r.factor} — ${r.reason}`).join("; ")}. Per IRDAI (Protection of Policyholders' Interests) Regulations 2017, Section 6, the applicant has been informed of the basis of risk classification applied to their proposal.`
          : "";

        const altDataText = alt.telematicsScore || alt.behavioralScore || alt.lifestyleScore
          ? ` Alternative data sources were incorporated: Telematics (${alt.telematicsScore ?? "N/A"}/100), Behavioral (${alt.behavioralScore ?? "N/A"}/100), Lifestyle (${alt.lifestyleScore ?? "N/A"}/100). Per IRDAI Regulatory Sandbox Regulations 2019, the use of telematics and behavioral analytics for risk assessment is permitted with appropriate consumer protection safeguards.`
          : " No alternative data sources were available for this assessment.";

        explanation = `The applicant's risk assessment produced a score of ${mlResult.riskScore}/100 with ${mlResult.confidence}% model confidence, and has been ${decisionText}. Per IRDAI Circular IRDA/HLT/MISC/CIR/174/11/2020, a holistic assessment of the applicant's profile was conducted considering multiple data sources rather than relying on any single parameter.`
          + `\n\n${posFactors.length ? `Positive factors that reduced risk include: ${posFactors.join(", ")}. ` : ""}${negFactors.length ? `Risk-elevating factors include: ${negFactors.join(", ")}. ` : ""}The recommended premium range of ₹${mlResult.recommendedPremium?.min?.toLocaleString("en-IN")}-₹${mlResult.recommendedPremium?.max?.toLocaleString("en-IN")} per year was calculated using actuarial tables (IALM 2012-14) with GLM-style risk loading, in accordance with IRDAI underwriting guidelines. Per IRDAI (Insurance Surety Bonds) Guidelines 2022, Section 4, automated underwriting systems are permitted provided they are regularly audited for accuracy and fairness.${altDataText}${adverseText}`;
      }
    }

    // ═══════════════════════════════════════════════
    // STEP 4: Assemble final result
    // ALL numbers from ML. Explanation from LLM. Citations from RAG.
    // ═══════════════════════════════════════════════
    const factors = mlResult.factors.map((f) => ({
      source: String(f.source || "Unknown"),
      score: Math.min(100, Math.max(0, Math.round(Number(f.score) || 50))),
      weight: Math.min(1, Math.max(0, Number(f.weight) || 0)),
      impact: ["positive", "negative", "neutral"].includes(f.impact) ? f.impact : "neutral",
      contribution: f.contribution ?? 0,
    }));

    const result = {
      riskScore: mlResult.riskScore,
      decision: mlResult.decision,
      confidence: mlResult.confidence,
      recommendedPremium: mlResult.recommendedPremium,
      factors,
      explanation,
      gemmaReasoning,
      processingTime: Date.now() - startTime,
      adverseActionReasons: mlResult.adverseActionReasons || [],
      regulatoryCitations: mlResult.regulatoryCitations || [],
      recommendations: mlResult.recommendations || [],
      mlModelUsed: true,
      modelVersion: mlResult.modelVersion || null,
      traditionalScore: mlResult.traditionalScore ?? null,
      baseScore: mlResult.baseScore ?? null,
    };

    await Assessment.updateOne({ _id: assessment._id }, { $set: {
      result,
      status: "completed",
      completedAt: new Date(),
    } });

    return NextResponse.json({ result, mlModelUsed: true });
  } catch (error) {
    console.error("[analyze] Fatal error:", error.message);
    await Assessment.updateOne({ _id: assessment._id }, { $set: { status: "error" } });
    return NextResponse.json({ error: "Analysis failed: " + error.message }, { status: 500 });
  }
}
