import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await dbConnect();

  // Underwriters and admins can view any assessment; others only their own
  const filter = (session.user.role === "underwriter" || session.user.role === "admin")
    ? { _id: id }
    : { _id: id, userId: session.user.id };

  const assessment = await Assessment.findOne(filter).lean();
  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ assessment });
}
