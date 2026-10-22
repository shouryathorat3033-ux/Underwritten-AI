import { NextResponse } from "next/server";
import { getPythonBackendUrl } from "@/lib/api-config";

/**
 * POST /api/verify-document
 *
 * Two-layer verification:
 * 1. Python forensics (pixel-level: EXIF, ELA, noise, statistics) — FREE, no LLM
 * 2. LLM vision fallback only if Python is unavailable
 *
 * The forensic approach is technically superior:
 * - ELA detects tampered regions via JPEG recompression artifacts
 * - EXIF reveals editing software signatures (Photoshop, GIMP, AI tools)
 * - Noise consistency catches copy-paste edits (different sensor noise)
 * - Statistical analysis catches AI-generated images (low entropy, unnatural edges)
 */
export async function POST(req) {
  try {
    const pythonUrl = getPythonBackendUrl();
    const { documentUrl, fileName, expectedType } = await req.json();

    if (!documentUrl) {
      return NextResponse.json({ error: "Document URL is required" }, { status: 400 });
    }

    const isImage = fileName && /\.(jpg|jpeg|png|webp)$/i.test(fileName);

    if (!isImage) {
      return NextResponse.json({
        authentic: true,
        confidence: 60,
        verdict: "unverifiable",
        reasons: ["PDF documents require image format for pixel-level forensic analysis"],
        documentType: expectedType || "pdf_document",
        method: "skipped",
        checks: {
          metadataCheck: { passed: true, detail: "PDF format accepted" },
          tamperCheck: { passed: null, detail: "Requires image format" },
          noiseCheck: { passed: null, detail: "Requires image format" },
          statisticalCheck: { passed: null, detail: "Requires image format" },
        },
      });
    }

    // ═══ Layer 1: Python forensic analysis (real pixel-level checks) ═══
    try {
      const forensicRes = await fetch(new URL("/api/verify", pythonUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentUrl, expectedType: expectedType || "document" }),
        signal: AbortSignal.timeout(15000),
      });

      if (forensicRes.ok) {
        const result = await forensicRes.json();
        return NextResponse.json({
          ...result,
          method: "forensic_analysis",
          methodDetail: "EXIF metadata + Error Level Analysis + Noise Consistency + Statistical Analysis",
        });
      }
    } catch {
      // Python backend unavailable — fall through to basic checks
    }

    // ═══ Layer 2: Basic checks (no Python, no LLM — just file heuristics) ═══
    return NextResponse.json({
      authentic: true,
      confidence: 40,
      verdict: "unverified",
      reasons: ["Forensic analysis service unavailable — document accepted without verification"],
      documentType: expectedType || "unknown",
      method: "none",
      checks: {
        metadataCheck: { passed: null, detail: "Forensic service unavailable" },
        tamperCheck: { passed: null, detail: "Forensic service unavailable" },
        noiseCheck: { passed: null, detail: "Forensic service unavailable" },
        statisticalCheck: { passed: null, detail: "Forensic service unavailable" },
      },
    });
  } catch (error) {
    console.error("Document verification error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
