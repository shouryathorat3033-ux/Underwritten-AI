import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

const PYTHON_URL = process.env.PYTHON_BACKEND_URL || "http://127.0.0.1:8000";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    await dbConnect();

    const assessment = await Assessment.findById(id).lean();
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    const reasoning = assessment?.result?.gemmaReasoning;
    if (!reasoning) {
      return NextResponse.json({ available: false, reasoning: null });
    }

    return NextResponse.json({ available: true, reasoning });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const forceRefresh = Boolean(body?.refresh);

    await dbConnect();
    const assessment = await Assessment.findById(id);
    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Return cached reasoning if already present and not forcing refresh
    if (!forceRefresh && assessment.result?.gemmaReasoning?.success) {
      return NextResponse.json({
        cached: true,
        reasoning: assessment.result.gemmaReasoning,
      });
    }

    if (!assessment.result || !assessment.result.riskScore) {
      return NextResponse.json({
        error: "Assessment has not been scored yet. Run analysis first.",
      }, { status: 400 });
    }

    // Call Python backend's Gemma 4 E4B reasoning service
    const pyRes = await fetch(`${PYTHON_URL}/api/reasoning/risk-assessment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessment: assessment.toObject(),
        ml_result: assessment.result,
        policyType: assessment.policyType || "health",
      }),
      signal: AbortSignal.timeout(95000), // generous timeout for local LLM inference
    });

    if (!pyRes.ok) {
      const err = await pyRes.text();
      return NextResponse.json({
        error: `Reasoning service error: ${err}`,
      }, { status: 502 });
    }

    const reasoning = await pyRes.json();

    // Cache the reasoning in MongoDB
    try {
      assessment.result = assessment.result || {};
      assessment.result.gemmaReasoning = reasoning;
      assessment.markModified("result");
      await assessment.save();
    } catch {
      // Fallback directly to MongoDB collection update to bypass any model compilation caching
      await Assessment.collection.updateOne(
        { _id: assessment._id },
        { $set: { "result.gemmaReasoning": reasoning } }
      );
    }

    return NextResponse.json({
      cached: false,
      reasoning,
    });
  } catch (error) {
    console.error("Reasoning route error:", error);
    return NextResponse.json({
      error: error.message || "Failed to generate reasoning",
    }, { status: 500 });
  }
}
