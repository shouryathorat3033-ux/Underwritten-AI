import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Applicant from "@/lib/models/Applicant";
import Assessment from "@/lib/models/Assessment";

// GET — fetch current user's applicant profile
export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  let profile = await Applicant.findOne({ userId: session.user.id });

  // Auto-create profile if doesn't exist
  if (!profile) {
    // Try to build from existing assessments
    const assessments = await Assessment.find({ userId: session.user.id }).sort({ createdAt: -1 }).limit(10);

    const latest = assessments[0];
    profile = await Applicant.create({
      userId: session.user.id,
      personal: {
        name: session.user.name || latest?.applicant?.name || "",
        email: session.user.email || latest?.applicant?.email || "",
        phone: latest?.applicant?.phone || "",
        age: latest?.applicant?.age || null,
        gender: latest?.applicant?.gender || "",
        occupation: latest?.applicant?.occupation || "",
      },
      financial: {
        income: latest?.traditionalData?.income || null,
        creditScore: latest?.traditionalData?.creditScore || null,
        existingPolicies: latest?.traditionalData?.existingPolicies || null,
      },
      health: latest?.policySpecificData?.bmi ? {
        bmi: latest.policySpecificData.bmi,
        smokingStatus: latest.policySpecificData.smokingStatus,
        exerciseFrequency: latest.policySpecificData.exerciseFrequency,
      } : {},
      alternativeData: {
        telematicsScore: latest?.alternativeData?.telematicsScore || null,
        behavioralScore: latest?.alternativeData?.behavioralScore || null,
        lifestyleScore: latest?.alternativeData?.lifestyleScore || null,
        socialMediaRisk: latest?.alternativeData?.socialMediaRisk || "",
      },
      assessmentCount: assessments.length,
      lastAssessmentAt: assessments[0]?.createdAt || null,
    });
  }

  // Get linked assessments summary
  const assessments = await Assessment.find({ userId: session.user.id })
    .sort({ createdAt: -1 }).limit(20)
    .select("policyType status result.riskScore result.decision createdAt applicant.name");

  return NextResponse.json({ profile, assessments });
}

// PUT — update profile
export async function PUT(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    await dbConnect();

    let profile = await Applicant.findOne({ userId: session.user.id });
    if (!profile) {
      profile = new Applicant({ userId: session.user.id, personal: {}, financial: {}, health: {}, vehicle: {}, property: {}, alternativeData: {}, documents: [] });
    }

    // Deep merge updates — safe for Mongoose subdocs
    const merge = (target, source) => {
      if (!source || typeof source !== "object") return;
      for (const key of Object.keys(source)) {
        const val = source[key];
        if (val === null || val === undefined || val === "") continue;
        if (typeof val === "object" && !Array.isArray(val) && !(val instanceof Date)) {
          if (!target[key] || typeof target[key] !== "object") target[key] = {};
          merge(target[key], val);
        } else {
          target[key] = val;
        }
      }
    };

    // Normalize enum values before merging
    if (body.health?.smokingStatus) {
      const raw = String(body.health.smokingStatus).toLowerCase().trim();
      if (raw.includes("current") || raw.includes("active") || raw === "yes" || raw === "smoker") {
        body.health.smokingStatus = "current";
      } else if (raw.includes("former") || raw.includes("ex") || raw.includes("quit") || raw.includes("past")) {
        body.health.smokingStatus = "former";
      } else if (raw.includes("never") || raw === "no" || raw === "non" || raw.includes("none")) {
        body.health.smokingStatus = "never";
      } else {
        delete body.health.smokingStatus;
      }
    }

    // Sanitize numeric fields — prevent NaN from crashing save
    const toNum = (v) => { const n = Number(v); return isNaN(n) ? undefined : n; };
    if (body.personal?.age) body.personal.age = toNum(body.personal.age);
    if (body.financial?.income) body.financial.income = toNum(body.financial.income);
    if (body.financial?.creditScore) body.financial.creditScore = toNum(body.financial.creditScore);
    if (body.health?.bmi) body.health.bmi = toNum(body.health.bmi);
    if (body.vehicle?.year) body.vehicle.year = toNum(body.vehicle.year);
    if (body.property?.value) body.property.value = toNum(body.property.value);
    if (body.property?.squareFootage) body.property.squareFootage = toNum(body.property.squareFootage);
    if (body.property?.age) body.property.age = toNum(body.property.age);

    if (body.personal) merge(profile.personal, body.personal);
    if (body.financial) merge(profile.financial, body.financial);
    if (body.health) merge(profile.health, body.health);
    if (body.vehicle) merge(profile.vehicle, body.vehicle);
    if (body.property) merge(profile.property, body.property);
    if (body.alternativeData) merge(profile.alternativeData, body.alternativeData);

    // Add document if provided
    if (body.document) {
      if (!profile.documents) profile.documents = [];
      profile.documents.push(body.document);
    }

    profile.markModified("personal");
    profile.markModified("financial");
    profile.markModified("health");
    profile.markModified("vehicle");
    profile.markModified("property");
    profile.markModified("alternativeData");
    if (body.document) profile.markModified("documents");

    await profile.save();

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("PUT /api/profile error:", error);
    return NextResponse.json({ error: error.message || "Failed to update profile" }, { status: 500 });
  }
}
