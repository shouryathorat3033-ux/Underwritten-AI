import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/lib/models/Claim";

export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Only underwriter or admin can settle claims
  if (session.user.role !== "underwriter" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden: only underwriters or admins can settle claims" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { action, approvedAmount, method, rejectionReason } = body;

  if (!action || !["approve", "reject", "dispute"].includes(action)) {
    return NextResponse.json({ error: "Invalid action. Must be 'approve', 'reject', or 'dispute'" }, { status: 400 });
  }

  await dbConnect();

  const claim = await Claim.findById(id);
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  const now = new Date();

  if (action === "approve") {
    claim.status = "approved";
    claim.settlement.status = "approved";
    claim.settlement.approvedBy = session.user.id;
    claim.settlement.approvedAt = now;
    if (approvedAmount != null) {
      claim.claimDetails.approvedAmount = Number(approvedAmount);
    }
    if (method) {
      claim.settlement.method = method;
    }
  } else if (action === "reject") {
    claim.status = "rejected";
    claim.settlement.status = "rejected";
    claim.settlement.approvedBy = session.user.id;
    claim.settlement.approvedAt = now;
    if (rejectionReason) {
      claim.settlement.rejectionReason = rejectionReason;
    }
  } else if (action === "dispute") {
    claim.status = "disputed";
    claim.settlement.status = "disputed";
  }

  await claim.save();

  return NextResponse.json({ claim });
}
