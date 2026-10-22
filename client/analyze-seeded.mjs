/**
 * Analyze all unscored assessments directly via Python ML backend.
 * Bypasses Next.js auth — talks to Python + MongoDB directly.
 *
 * Run: node analyze-seeded.mjs
 * Requires: Python backend running on port 8000
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = join(__dirname, ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
} catch {}

const MONGODB_URI = process.env.MONGODB_URI;
const PYTHON_URL = process.env.PYTHON_BACKEND_URL || "http://localhost:8000";

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  // Find all assessments without results
  const unscored = await db.collection("assessments")
    .find({ "result.riskScore": { $exists: false } })
    .sort({ createdAt: -1 })
    .toArray();

  console.log(`Found ${unscored.length} unscored assessments.`);
  if (unscored.length === 0) {
    console.log("Nothing to do.");
    await mongoose.disconnect();
    return;
  }

  let ok = 0, fail = 0;

  for (const assessment of unscored) {
    try {
      // Call Python ML backend directly
      const mlRes = await fetch(`${PYTHON_URL}/api/ml/score`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessment: {
            policyType: assessment.policyType,
            applicant: assessment.applicant,
            traditionalData: assessment.traditionalData,
            alternativeData: assessment.alternativeData,
            policySpecificData: assessment.policySpecificData,
          },
          policyType: assessment.policyType,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!mlRes.ok) {
        fail++;
        continue;
      }

      const ml = await mlRes.json();

      // Build result object
      const result = {
        riskScore: ml.riskScore ?? ml.risk_score,
        decision: ml.decision,
        confidence: ml.confidence,
        recommendedPremium: ml.recommendedPremium ?? ml.recommended_premium,
        factors: (ml.factors || []).map(f => ({
          source: f.source || f.name,
          score: f.score,
          weight: f.weight,
          impact: f.impact,
        })),
        explanation: `Assessment scored by ML model. Risk score: ${ml.riskScore ?? ml.risk_score}, Decision: ${ml.decision}. Top factors: ${(ml.factors || []).slice(0, 3).map(f => f.source || f.name).join(", ")}.`,
        processingTime: ml.processing_time_ms || ml.processingTime || 0,
        adverseActionReasons: ml.adverse_action_reasons || ml.adverseActionReasons || [],
        mlModelUsed: true,
        modelVersion: ml.model_version || ml.modelVersion || "v1",
        traditionalScore: ml.traditional_score ?? ml.traditionalScore,
      };

      // Update in MongoDB
      await db.collection("assessments").updateOne(
        { _id: assessment._id },
        {
          $set: {
            result,
            status: "completed",
            completedAt: new Date(),
          },
        }
      );

      ok++;
    } catch (e) {
      fail++;
    }

    if ((ok + fail) % 10 === 0) {
      console.log(`  ${ok + fail}/${unscored.length} (${ok} scored, ${fail} failed)`);
    }

    // Small delay to avoid overwhelming the Python backend
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\nDone! ${ok} scored, ${fail} failed.`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
