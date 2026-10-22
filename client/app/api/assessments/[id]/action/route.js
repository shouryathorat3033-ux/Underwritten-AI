import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "underwriter" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Only underwriters can perform this action" }, { status: 403 });
  }

  const { id } = await params;
  const { action, justification, modifiedPremium } = await req.json();

  if (!["accepted", "rejected", "modified", "info_requested"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }
  if (!justification || justification.length < 5) {
    return NextResponse.json({ error: "Justification is required (min 5 chars)" }, { status: 400 });
  }

  await dbConnect();
  const assessment = await Assessment.findById(id);
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const newStatus = action === "modified" ? "accepted" : action;
  await Assessment.updateOne({ _id: assessment._id }, { $set: {
    underwriterAction: {
      action,
      justification,
      modifiedPremium: action === "modified" ? modifiedPremium : undefined,
      actionBy: session.user.id,
      actionAt: new Date(),
    },
    status: newStatus,
  } });

  // Send decision email to applicant (fire-and-forget)
  const applicantEmail = assessment.applicant?.email;
  if (applicantEmail) {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    fetch(`${baseUrl}/api/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "decision",
        to: applicantEmail,
        name: assessment.applicant?.name,
        assessmentId: id,
        policyType: assessment.policyType,
        action,
        justification,
        riskScore: assessment.result?.riskScore,
        premium: assessment.result?.recommendedPremium,
        modifiedPremium: action === "modified" ? modifiedPremium : undefined,
      }),
    }).catch((err) => console.error("Decision email failed:", err));
  }

  return NextResponse.json({ message: "Action recorded", status: newStatus });
}
