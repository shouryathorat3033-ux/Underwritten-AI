import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { assessmentIds } = await req.json();
  if (!assessmentIds || !Array.isArray(assessmentIds) || assessmentIds.length === 0) {
    return NextResponse.json({ error: "assessmentIds array is required" }, { status: 400 });
  }

  if (assessmentIds.length > 50) {
    return NextResponse.json({ error: "Maximum 50 assessments per batch" }, { status: 400 });
  }

  await dbConnect();
  const startTime = Date.now();
  const results = [];

  for (const id of assessmentIds) {
    try {
      const assessment = await Assessment.findById(id);
      if (!assessment) {
        results.push({ id, status: "not_found" });
        continue;
      }

      const policyType = assessment.policyType || "health";

      // Try ML scoring
      let mlResult = null;
      try {
        const mlRes = await fetch(`${PYTHON_URL}/api/ml/score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assessment: assessment.toObject(), policyType }),
          signal: AbortSignal.timeout(5000),
        });
        if (mlRes.ok) mlResult = await mlRes.json();
      } catch {}

      if (mlResult) {
        assessment.result = {
          riskScore: mlResult.riskScore,
          decision: mlResult.decision,
          confidence: mlResult.confidence,
          recommendedPremium: mlResult.recommendedPremium,
          factors: mlResult.factors,
          explanation: `Batch-processed via ML model. Risk score: ${mlResult.riskScore}/100.`,
          processingTime: Date.now() - startTime,
          mlModelUsed: true,
        };
        assessment.status = "completed";
        assessment.completedAt = new Date();
        await assessment.save();
        results.push({ id, status: "completed", riskScore: mlResult.riskScore, decision: mlResult.decision });
      } else {
        results.push({ id, status: "ml_unavailable" });
      }
    } catch (err) {
      results.push({ id, status: "error", message: err.message });
    }
  }

  const totalTime = Date.now() - startTime;
  const completed = results.filter(r => r.status === "completed").length;

  return NextResponse.json({
    batch: {
      total: assessmentIds.length,
      completed,
      failed: assessmentIds.length - completed,
      totalTimeMs: totalTime,
      avgTimeMs: Math.round(totalTime / assessmentIds.length),
    },
    results,
  });
}
