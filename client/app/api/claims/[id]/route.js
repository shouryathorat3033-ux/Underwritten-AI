import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/lib/models/Claim";

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  // Underwriters/admins can view any claim; applicants can only view their own
  const filter = (session.user.role === "underwriter" || session.user.role === "admin")
    ? { _id: id }
    : { _id: id, userId: session.user.id };

  const claim = await Claim.findOne(filter).lean();
  if (!claim) return NextResponse.json({ error: "Claim not found" }, { status: 404 });

  return NextResponse.json({ claim });
}
