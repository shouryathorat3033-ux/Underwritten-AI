import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Mock Telematics & Alternative Data API
 *
 * Simulates real-time data feeds from IoT devices, wearables, and behavioral
 * analytics platforms. In production, this would connect to actual telematics
 * providers (e.g., OBD-II devices, smartphone SDKs, wearable APIs).
 *
 * GET  /api/telematics?type=driving|health|behavioral|lifestyle
 * POST /api/telematics  { applicantId, type }
 */

// Realistic score distributions calibrated to Indian market
function generateDrivingTelematics() {
  const safetyScore = Math.round(55 + Math.random() * 40); // 55-95
  const harshBraking = Math.round(Math.random() * 12);     // 0-12 events/week
  const speeding = Math.round(Math.random() * 8);           // 0-8 events/week
  const nightDriving = Math.round(5 + Math.random() * 30);  // 5-35% of trips
  const avgSpeed = Math.round(25 + Math.random() * 35);     // 25-60 km/h
  const totalKm = Math.round(200 + Math.random() * 1200);   // 200-1400 km/month

  return {
    source: "SmartDrive OBD-II Telematics",
    provider: "Persistent IoT Platform",
    collectionPeriod: "Last 30 days",
    data: {
      overallScore: safetyScore,
      harshBrakingEvents: harshBraking,
      speedingEvents: speeding,
      nightDrivingPercent: nightDriving,
      averageSpeedKmh: avgSpeed,
      totalDistanceKm: totalKm,
      phoneUsageWhileDriving: Math.round(Math.random() * 5),
      ecoScore: Math.round(60 + Math.random() * 35),
    },
    riskFactors: [
      harshBraking > 8 ? "Frequent harsh braking detected" : null,
      speeding > 5 ? "Speeding incidents above threshold" : null,
      nightDriving > 25 ? "High proportion of night driving" : null,
    ].filter(Boolean),
    telematicsScore: safetyScore,
  };
}

function generateHealthWearable() {
  const restingHR = Math.round(55 + Math.random() * 30);   // 55-85 bpm
  const dailySteps = Math.round(3000 + Math.random() * 9000); // 3k-12k
  const sleepHours = +(5.5 + Math.random() * 3).toFixed(1);   // 5.5-8.5
  const activeMinutes = Math.round(10 + Math.random() * 60);  // 10-70 min/day
  const stressLevel = Math.round(20 + Math.random() * 60);    // 20-80

  const lifestyleScore = Math.min(100, Math.round(
    (dailySteps > 7000 ? 30 : 15) +
    (restingHR < 70 ? 25 : 10) +
    (sleepHours > 7 ? 20 : 8) +
    (activeMinutes > 30 ? 20 : 8) +
    (stressLevel < 40 ? 10 : 3)
  ));

  return {
    source: "Health Wearable API",
    provider: "Persistent Health Connect",
    collectionPeriod: "Last 90 days average",
    data: {
      restingHeartRate: restingHR,
      dailyStepsAvg: dailySteps,
      sleepHoursAvg: sleepHours,
      activeMinutesPerDay: activeMinutes,
      stressLevelAvg: stressLevel,
      bloodOxygenAvg: +(96 + Math.random() * 3).toFixed(1),
      vo2MaxEstimate: +(30 + Math.random() * 20).toFixed(1),
    },
    riskFactors: [
      restingHR > 80 ? "Elevated resting heart rate" : null,
      dailySteps < 4000 ? "Low daily physical activity" : null,
      sleepHours < 6 ? "Insufficient sleep patterns" : null,
      stressLevel > 65 ? "Elevated chronic stress indicators" : null,
    ].filter(Boolean),
    lifestyleScore,
  };
}

function generateBehavioralAnalytics() {
  const paymentConsistency = Math.round(65 + Math.random() * 30);
  const creditUtilization = Math.round(10 + Math.random() * 60);
  const savingsRate = Math.round(5 + Math.random() * 30);
  const jobChanges = Math.round(Math.random() * 4);
  const tenureYears = +(0.5 + Math.random() * 8).toFixed(1);

  const behavioralScore = Math.min(100, Math.round(
    (paymentConsistency > 85 ? 35 : 20) +
    (creditUtilization < 30 ? 25 : 10) +
    (savingsRate > 15 ? 20 : 8) +
    (jobChanges <= 1 ? 15 : 5) +
    (tenureYears > 3 ? 10 : 3)
  ));

  return {
    source: "Financial Behavioral Analytics",
    provider: "Persistent Data Intelligence",
    collectionPeriod: "Last 12 months",
    data: {
      paymentConsistencyScore: paymentConsistency,
      creditUtilizationPercent: creditUtilization,
      savingsRatePercent: savingsRate,
      recentJobChanges: jobChanges,
      currentTenureYears: tenureYears,
      digitalTransactionRatio: +(0.4 + Math.random() * 0.5).toFixed(2),
      loanRepaymentHistory: paymentConsistency > 80 ? "excellent" : paymentConsistency > 60 ? "good" : "fair",
    },
    riskFactors: [
      paymentConsistency < 70 ? "Inconsistent payment history" : null,
      creditUtilization > 50 ? "High credit utilization" : null,
      jobChanges > 2 ? "Frequent job transitions" : null,
    ].filter(Boolean),
    behavioralScore,
  };
}

function generateLifestyleData() {
  const socialRisk = ["low", "medium", "high"][Math.floor(Math.random() * 3)];
  const fitnessLevel = ["sedentary", "light", "moderate", "active"][Math.floor(Math.random() * 4)];
  const dietScore = Math.round(40 + Math.random() * 50);

  return {
    source: "Lifestyle & Social Analytics",
    provider: "Persistent Social Intelligence",
    collectionPeriod: "Point-in-time assessment",
    data: {
      socialMediaRisk: socialRisk,
      fitnessLevel,
      dietQualityScore: dietScore,
      smokingIndicators: Math.random() > 0.75 ? "detected" : "none",
      alcoholIndicators: Math.random() > 0.7 ? "moderate" : "low",
      communityEngagement: Math.random() > 0.5 ? "active" : "limited",
    },
    riskFactors: [
      socialRisk === "high" ? "High social media risk indicators" : null,
      fitnessLevel === "sedentary" ? "Sedentary lifestyle detected" : null,
    ].filter(Boolean),
    socialMediaRisk: socialRisk,
  };
}

const generators = {
  driving: generateDrivingTelematics,
  health: generateHealthWearable,
  behavioral: generateBehavioralAnalytics,
  lifestyle: generateLifestyleData,
};

export async function GET(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "driving";

  const generator = generators[type];
  if (!generator) {
    return NextResponse.json(
      { error: `Invalid type. Use: ${Object.keys(generators).join(", ")}` },
      { status: 400 }
    );
  }

  // Simulate realistic API latency (50-200ms)
  await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    type,
    ...generator(),
  });
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await req.json();
  const type = body.type || "driving";

  const generator = generators[type];
  if (!generator) {
    return NextResponse.json(
      { error: `Invalid type. Use: ${Object.keys(generators).join(", ")}` },
      { status: 400 }
    );
  }

  await new Promise((r) => setTimeout(r, 50 + Math.random() * 150));

  const result = generator();

  // If fetching all types at once
  if (type === "all") {
    const all = {};
    for (const [key, gen] of Object.entries(generators)) {
      all[key] = gen();
    }
    return NextResponse.json({
      success: true,
      simulated: true,
      disclaimer: "Data generated from statistical models calibrated to Indian market distributions. In production, connects to real IoT/telematics providers.",
      timestamp: new Date().toISOString(),
      type: "all",
      results: all,
      aggregated: {
        telematicsScore: all.driving.telematicsScore,
        behavioralScore: all.behavioral.behavioralScore,
        lifestyleScore: all.health.lifestyleScore,
        socialMediaRisk: all.lifestyle.socialMediaRisk,
      },
    });
  }

  return NextResponse.json({
    success: true,
    simulated: true,
    disclaimer: "Data generated from statistical models. In production, connects to real data providers.",
    timestamp: new Date().toISOString(),
    type,
    applicantId: body.applicantId || null,
    ...result,
  });
}
