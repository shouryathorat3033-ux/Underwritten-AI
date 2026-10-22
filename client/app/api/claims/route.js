import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Claim from "@/lib/models/Claim";
import Assessment from "@/lib/models/Assessment";

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await dbConnect();

  // Build filter: underwriter/admin sees all, applicants see only their own
  const filter = (session.user.role === "underwriter" || session.user.role === "admin")
    ? {}
    : { userId: session.user.id };

  // Support query params for filtering
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const policyType = searchParams.get("policyType");
  if (status) filter.status = status;
  if (policyType) filter.policyType = policyType;

  const claims = await Claim.find(filter).sort({ createdAt: -1 }).lean();

  // Compute stats across the same visibility scope (ignoring status/policyType filters)
  const statsFilter = (session.user.role === "underwriter" || session.user.role === "admin")
    ? {}
    : { userId: session.user.id };
  const allClaims = await Claim.find(statsFilter).lean();
  const stats = {
    total: allClaims.length,
    pending: allClaims.filter((c) => ["submitted", "under_review", "manual_review"].includes(c.status)).length,
    approved: allClaims.filter((c) => ["stp_approved", "approved"].includes(c.status)).length,
    settled: allClaims.filter((c) => ["settled", "paid"].includes(c.status)).length,
    flagged: allClaims.filter((c) => c.status === "investigation" || c.fraud?.investigationRequired).length,
  };

  return NextResponse.json({ claims, stats });
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  if (!body.policyType) return NextResponse.json({ error: "Policy type is required" }, { status: 400 });
  if (!body.claimant?.name) return NextResponse.json({ error: "Claimant name is required" }, { status: 400 });
  if (!body.claimDetails) return NextResponse.json({ error: "Claim details are required" }, { status: 400 });

  await dbConnect();
  const stpStart = Date.now();

  // Look up linked assessment if provided
  let assessment = null;
  if (body.assessmentId) {
    assessment = await Assessment.findById(body.assessmentId).lean();
  }

  const estimatedAmount = Number(body.claimDetails.estimatedAmount) || 0;

  // ═══════════════════════════════════════════════
  // STP (Straight-Through Processing) evaluation
  // ═══════════════════════════════════════════════
  let complexityScore = 0;
  const stpReasons = [];

  // Amount-based complexity
  if (estimatedAmount < 50000) {
    complexityScore += 20;
    stpReasons.push("Low claim amount (< 50,000)");
  } else if (estimatedAmount <= 200000) {
    complexityScore += 50;
    stpReasons.push("Medium claim amount (50k - 2L)");
  } else {
    complexityScore += 75;
    stpReasons.push("High claim amount (> 2L)");
  }

  // Verified documents reduce complexity
  const docs = body.documents || [];
  const hasVerifiedDocs = docs.length > 0 && docs.some((d) => d.verified);
  if (hasVerifiedDocs) {
    complexityScore -= 10;
    stpReasons.push("Verified documents present (-10)");
  }

  // Policy active > 6 months (check assessment creation date)
  if (assessment?.createdAt) {
    const monthsSincePolicy = (Date.now() - new Date(assessment.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsSincePolicy > 6) {
      complexityScore -= 10;
      stpReasons.push("Policy active > 6 months (-10)");
    }
  }

  // First claim on this policy
  const priorClaimsOnPolicy = body.assessmentId
    ? await Claim.countDocuments({ assessmentId: body.assessmentId })
    : 0;
  if (priorClaimsOnPolicy === 0) {
    complexityScore -= 10;
    stpReasons.push("First claim on this policy (-10)");
  }

  // Claim type bonus for medical/accident with documents
  const claimType = body.claimDetails.type;
  if ((claimType === "medical" || claimType === "accident") && docs.length > 0) {
    complexityScore -= 5;
    stpReasons.push("Medical/accident claim with documents (-5)");
  }

  // No prior fraud flags on user
  const userFraudClaims = await Claim.countDocuments({
    userId: session.user.id,
    "fraud.investigationRequired": true,
  });
  if (userFraudClaims === 0) {
    complexityScore -= 15;
    stpReasons.push("No prior fraud flags on user (-15)");
  }

  // Clamp to 0-100
  complexityScore = Math.max(0, Math.min(100, complexityScore));

  const complexity = complexityScore < 30 ? "low" : complexityScore < 60 ? "medium" : "high";
  const stpEligible = complexity === "low" && estimatedAmount < 100000;
  const autoApproved = stpEligible;

  if (stpEligible) {
    stpReasons.push("STP eligible: low complexity + amount < 1L => auto-approved");
  }

  // ═══════════════════════════════════════════════
  // Fraud detection
  // ═══════════════════════════════════════════════
  let fraudScore = 0;
  const fraudFlags = [];
  const duplicateClaimIds = [];

  // Check for duplicate claims: same user + same policyType + similar amount (+-20%) + within 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  if (estimatedAmount > 0) {
    const duplicates = await Claim.find({
      userId: session.user.id,
      policyType: body.policyType,
      "claimDetails.estimatedAmount": {
        $gte: estimatedAmount * 0.8,
        $lte: estimatedAmount * 1.2,
      },
      createdAt: { $gte: thirtyDaysAgo },
    }).lean();

    if (duplicates.length > 0) {
      fraudScore += 30;
      duplicates.forEach((d) => duplicateClaimIds.push(d._id));
      fraudFlags.push({
        type: "duplicate_claim",
        description: `Found ${duplicates.length} similar claim(s) within 30 days with similar amount`,
        severity: "critical",
        score: 30,
      });
    }
  }

  // Check claim frequency: > 3 claims in last 6 months
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const recentClaimCount = await Claim.countDocuments({
    userId: session.user.id,
    createdAt: { $gte: sixMonthsAgo },
  });
  if (recentClaimCount > 3) {
    fraudScore += 25;
    fraudFlags.push({
      type: "high_frequency",
      description: `${recentClaimCount} claims in last 6 months (threshold: 3)`,
      severity: "warning",
      score: 25,
    });
  }

  // Check amount vs policy value (if assessment has premium data)
  if (assessment?.result?.recommendedPremium?.max && estimatedAmount > 0) {
    const coverageEstimate = assessment.result.recommendedPremium.max * 20; // rough coverage estimate
    if (estimatedAmount > coverageEstimate * 0.8) {
      fraudScore += 20;
      fraudFlags.push({
        type: "high_amount_ratio",
        description: `Claim amount (${estimatedAmount}) exceeds 80% of estimated coverage`,
        severity: "warning",
        score: 20,
      });
    }
  }

  // Clamp fraud score
  fraudScore = Math.max(0, Math.min(100, fraudScore));

  const fraudLevel = fraudScore < 20 ? "clean"
    : fraudScore < 40 ? "low"
    : fraudScore < 60 ? "medium"
    : fraudScore < 80 ? "high"
    : "critical";

  const investigationRequired = fraudScore >= 60;

  // ═══════════════════════════════════════════════
  // Determine final status
  // ═══════════════════════════════════════════════
  let claimStatus = "submitted";
  let settlementStatus = "pending";

  if (investigationRequired) {
    claimStatus = "investigation";
  } else if (autoApproved) {
    claimStatus = "stp_approved";
    settlementStatus = "approved";
  }

  const stpProcessingTime = Date.now() - stpStart;

  // Create the claim
  const claim = await Claim.create({
    userId: session.user.id,
    policyType: body.policyType,
    policyNumber: body.policyNumber || null,
    assessmentId: body.assessmentId || null,
    claimant: body.claimant,
    claimDetails: {
      ...body.claimDetails,
      reportedDate: new Date(),
    },
    documents: docs,
    stp: {
      eligible: stpEligible,
      complexity,
      complexityScore,
      autoApproved,
      reasons: stpReasons,
      processingTime: stpProcessingTime,
    },
    fraud: {
      score: fraudScore,
      level: fraudLevel,
      flags: fraudFlags,
      duplicateClaimIds,
      networkLinks: [],
      investigationRequired,
    },
    settlement: {
      status: settlementStatus,
    },
    status: claimStatus,
  });

  return NextResponse.json({ claim }, { status: 201 });
}
