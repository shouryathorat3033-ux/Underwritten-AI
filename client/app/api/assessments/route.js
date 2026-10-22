import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Assessment from "@/lib/models/Assessment";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await dbConnect();

  // Underwriters/admins see ALL assessments; applicants see only their own
  const filter = (session.user.role === "underwriter" || session.user.role === "admin")
    ? {}
    : { userId: session.user.id };

  const assessments = await Assessment.find(filter).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ assessments });
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Sign up required to submit an assessment" }, { status: 401 });

  const body = await req.json();

  if (!body.applicant?.name) return NextResponse.json({ error: "Applicant name is required" }, { status: 400 });
  if (!body.policyType) return NextResponse.json({ error: "Policy type is required" }, { status: 400 });

  // Safely parse documents — handle string, array-of-strings, or proper array
  let documents = body.documents || [];
  console.log("[assessments POST] documents type:", typeof documents, "isArray:", Array.isArray(documents), Array.isArray(documents) ? `length=${documents.length}, item0 type=${typeof documents[0]}` : "");

  // Case 1: entire array is a string (e.g., util.inspect or JSON stringified)
  if (typeof documents === "string") {
    try {
      // Try JSON parse first
      documents = JSON.parse(documents);
    } catch {
      // Try eval-safe parse for JS-style strings with single quotes
      try {
        documents = JSON.parse(documents.replace(/'/g, '"').replace(/(\w+):/g, '"$1":'));
      } catch {
        console.warn("[assessments POST] Failed to parse documents string, using empty array");
        documents = [];
      }
    }
  }

  // Case 2: array contains string elements instead of objects
  if (Array.isArray(documents)) {
    documents = documents.map((d) => {
      if (!d || typeof d === "string") return null;
      // Extract only safe, known fields
      return {
        name: String(d.name || ""),
        type: String(d.type || ""),
        url: String(d.url || ""),
        size: Number(d.size) || 0,
        docType: String(d.docType || ""),
        uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
        ...(d.verification && typeof d.verification === "object" ? {
          verification: {
            authentic: !!d.verification.authentic,
            confidence: Number(d.verification.confidence) || 0,
            verdict: String(d.verification.verdict || ""),
            documentType: String(d.verification.documentType || ""),
            method: String(d.verification.method || ""),
          },
        } : {}),
      };
    }).filter(Boolean);
  } else {
    documents = [];
  }
  console.log("[assessments POST] final documents:", JSON.stringify(documents).slice(0, 200));

  await dbConnect();

  try {
    const assessment = await Assessment.create({
      userId: session.user.id,
      policyType: body.policyType,
      applicant: body.applicant,
      traditionalData: body.traditionalData || {},
      alternativeData: body.alternativeData || {},
      policySpecificData: body.policySpecificData || {},
      documents,
      status: "draft",
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    console.error("[assessments POST] create failed:", err.message);
    // If documents caused the error, retry without them
    if (err.message?.includes("documents")) {
      console.warn("[assessments POST] Retrying without documents");
      const assessment = await Assessment.create({
        userId: session.user.id,
        policyType: body.policyType,
        applicant: body.applicant,
        traditionalData: body.traditionalData || {},
        alternativeData: body.alternativeData || {},
        policySpecificData: body.policySpecificData || {},
        documents: [],
        status: "draft",
      });
      return NextResponse.json({ assessment, warning: "Documents could not be attached" }, { status: 201 });
    }
    return NextResponse.json({ error: err.message || "Failed to create assessment" }, { status: 500 });
  }
}
