import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();
  const filter = session.user.role === "underwriter" || session.user.role === "admin"
    ? { status: { $in: ["completed", "accepted", "rejected", "referred"] } }
    : { userId: session.user.id, status: { $in: ["completed", "accepted", "rejected", "referred"] } };

  const assessments = await Assessment.find(filter).lean();

  const total = assessments.length;
  const avgRisk = total ? assessments.reduce((a, b) => a + (b.result?.riskScore || 0), 0) / total : 0;
  const approved = assessments.filter(a => a.result?.decision === "approve").length;
  const referred = assessments.filter(a => a.result?.decision === "refer").length;
  const declined = assessments.filter(a => a.result?.decision === "decline").length;
  const approvalRate = total ? (approved / total) * 100 : 0;
  const avgTime = total ? assessments.reduce((a, b) => a + (b.result?.processingTime || 0), 0) / total : 0;
  const riskLow = assessments.filter(a => (a.result?.riskScore || 0) <= 30).length;
  const riskMed = assessments.filter(a => (a.result?.riskScore || 0) > 30 && (a.result?.riskScore || 0) <= 60).length;
  const riskHigh = assessments.filter(a => (a.result?.riskScore || 0) > 60).length;

  // Policy type breakdown
  const policyTypes = ["health", "auto", "life", "property"];
  const byPolicyType = {};
  for (const pt of policyTypes) {
    const ptAssessments = assessments.filter(a => a.policyType === pt);
    const ptTotal = ptAssessments.length;
    byPolicyType[pt] = {
      total: ptTotal,
      avgRisk: ptTotal ? Math.round(ptAssessments.reduce((a, b) => a + (b.result?.riskScore || 0), 0) / ptTotal) : 0,
      approved: ptAssessments.filter(a => a.result?.decision === "approve").length,
      referred: ptAssessments.filter(a => a.result?.decision === "refer").length,
      declined: ptAssessments.filter(a => a.result?.decision === "decline").length,
    };
  }

  return NextResponse.json({
    total, avgRisk, approved, referred, declined, approvalRate, avgTime,
    riskLow, riskMed, riskHigh, byPolicyType,
  });
}
