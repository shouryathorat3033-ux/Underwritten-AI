import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function GET() {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.user.role !== "underwriter" && session.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: insufficient role" }, { status: 403 });
    }

    await dbConnect();

    // Fetch assessments sorted by most recent activity, limited for performance
    const assessments = await Assessment.find({})
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("userId", "name email role")
      .populate("underwriterAction.actionBy", "name email role")
      .lean();

    const events = [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    for (const a of assessments) {
      const user = a.userId
        ? { name: a.userId.name || "Unknown", role: a.userId.role || "applicant" }
        : { name: "System", role: "system" };

      // Event: assessment created
      events.push({
        id: `${a._id}_created`,
        type: "assessment_created",
        timestamp: a.createdAt,
        user,
        details: {
          policyType: a.policyType,
          applicantName: a.applicant?.name || "Unknown",
          action: "Submitted new assessment",
        },
        assessmentId: a._id,
      });

      // Event: analysis completed (if result exists and completedAt is set)
      if (a.result && a.result.riskScore != null && (a.completedAt || a.status === "completed" || a.status === "referred")) {
        events.push({
          id: `${a._id}_analyzed`,
          type: "analysis_completed",
          timestamp: a.completedAt || a.createdAt,
          user: { name: "AI Engine", role: "system" },
          details: {
            policyType: a.policyType,
            applicantName: a.applicant?.name || "Unknown",
            riskScore: a.result.riskScore,
            decision: a.result.decision,
            confidence: a.result.confidence,
            action: `Risk score: ${a.result.riskScore} - Decision: ${a.result.decision}`,
          },
          assessmentId: a._id,
        });
      }

      // Event: underwriter decision
      if (a.underwriterAction && a.underwriterAction.action) {
        const actionUser = a.underwriterAction.actionBy
          ? { name: a.underwriterAction.actionBy.name || "Underwriter", role: a.underwriterAction.actionBy.role || "underwriter" }
          : { name: session.user.name || "Underwriter", role: "underwriter" };

        events.push({
          id: `${a._id}_decision`,
          type: "underwriter_decision",
          timestamp: a.underwriterAction.actionAt || a.createdAt,
          user: actionUser,
          details: {
            policyType: a.policyType,
            applicantName: a.applicant?.name || "Unknown",
            riskScore: a.result?.riskScore,
            decision: a.underwriterAction.action,
            justification: a.underwriterAction.justification,
            action: `${a.underwriterAction.action} - ${a.underwriterAction.justification || "No justification"}`,
          },
          assessmentId: a._id,
        });
      }
    }

    // Sort all events by timestamp descending
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Trim to 100 most recent events
    const trimmedEvents = events.slice(0, 100);

    // Calculate stats
    const totalEvents = trimmedEvents.length;
    const todayEvents = trimmedEvents.filter(e => new Date(e.timestamp) >= todayStart).length;
    const decisionsToday = trimmedEvents.filter(
      e => e.type === "underwriter_decision" && new Date(e.timestamp) >= todayStart
    ).length;

    return NextResponse.json({
      events: trimmedEvents,
      stats: { totalEvents, todayEvents, decisionsToday },
    });
  } catch (err) {
    console.error("Audit API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
