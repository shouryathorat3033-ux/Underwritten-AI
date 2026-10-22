import { NextResponse } from "next/server";

// Known Indian region prefixes for simulated fallback
const REGION_RISK_MAP = {
  "1": { region: "Delhi/NCR", floodBase: 0.3, windBase: 0.2 },
  "2": { region: "Haryana/Punjab", floodBase: 0.25, windBase: 0.2 },
  "3": { region: "Rajasthan/Gujarat", floodBase: 0.2, windBase: 0.35 },
  "4": { region: "Maharashtra/Goa", floodBase: 0.5, windBase: 0.4 },
  "5": { region: "Andhra Pradesh/Karnataka", floodBase: 0.45, windBase: 0.35 },
  "6": { region: "Tamil Nadu/Kerala", floodBase: 0.55, windBase: 0.45 },
  "7": { region: "West Bengal/Odisha", floodBase: 0.7, windBase: 0.6 },
  "8": { region: "Bihar/Jharkhand", floodBase: 0.6, windBase: 0.3 },
  "9": { region: "Uttar Pradesh", floodBase: 0.35, windBase: 0.2 },
  "0": { region: "Unknown Region", floodBase: 0.3, windBase: 0.25 },
};

function classifyRisk(score) {
  if (score >= 0.75) return { level: "high", score: Math.round(score * 100) / 100 };
  if (score >= 0.45) return { level: "moderate", score: Math.round(score * 100) / 100 };
  if (score >= 0.2) return { level: "low", score: Math.round(score * 100) / 100 };
  return { level: "minimal", score: Math.round(score * 100) / 100 };
}

function calculateFloodRisk(totalPrecipitation7d) {
  let score;
  let detail;
  if (totalPrecipitation7d > 100) {
    score = 0.85 + Math.min((totalPrecipitation7d - 100) / 200, 0.15);
    detail = `Very heavy rainfall expected: ${totalPrecipitation7d.toFixed(1)}mm over 7 days. High flood probability.`;
  } else if (totalPrecipitation7d > 50) {
    score = 0.5 + ((totalPrecipitation7d - 50) / 50) * 0.35;
    detail = `Significant rainfall expected: ${totalPrecipitation7d.toFixed(1)}mm over 7 days. Moderate flood risk in low-lying areas.`;
  } else if (totalPrecipitation7d > 20) {
    score = 0.2 + ((totalPrecipitation7d - 20) / 30) * 0.3;
    detail = `Moderate rainfall expected: ${totalPrecipitation7d.toFixed(1)}mm over 7 days. Low flood risk.`;
  } else {
    score = totalPrecipitation7d / 20 * 0.2;
    detail = `Light or no rainfall expected: ${totalPrecipitation7d.toFixed(1)}mm over 7 days. Minimal flood risk.`;
  }
  return { ...classifyRisk(score), detail };
}

function calculateWindRisk(maxWindSpeed7d) {
  let score;
  let detail;
  if (maxWindSpeed7d > 60) {
    score = 0.8 + Math.min((maxWindSpeed7d - 60) / 100, 0.2);
    detail = `Severe wind conditions: max ${maxWindSpeed7d.toFixed(1)} km/h. High risk of structural damage.`;
  } else if (maxWindSpeed7d > 40) {
    score = 0.45 + ((maxWindSpeed7d - 40) / 20) * 0.35;
    detail = `Strong winds expected: max ${maxWindSpeed7d.toFixed(1)} km/h. Moderate risk to exposed structures.`;
  } else if (maxWindSpeed7d > 20) {
    score = 0.2 + ((maxWindSpeed7d - 20) / 20) * 0.25;
    detail = `Moderate winds expected: max ${maxWindSpeed7d.toFixed(1)} km/h. Low structural risk.`;
  } else {
    score = maxWindSpeed7d / 20 * 0.2;
    detail = `Calm to light winds: max ${maxWindSpeed7d.toFixed(1)} km/h. Minimal wind risk.`;
  }
  return { ...classifyRisk(score), detail };
}

function calculateOverallRisk(floodScore, windScore) {
  // Flood risk weighted more heavily for property insurance
  const overall = floodScore * 0.65 + windScore * 0.35;
  return classifyRisk(overall);
}

function buildSimulatedResponse(pincode) {
  const prefix = pincode.charAt(0);
  const regionInfo = REGION_RISK_MAP[prefix] || REGION_RISK_MAP["0"];

  // Add some deterministic variance based on the full pincode
  const pincodeNum = parseInt(pincode, 10);
  const variance = ((pincodeNum % 100) - 50) / 200; // range -0.25 to +0.245

  const floodScore = Math.max(0, Math.min(1, regionInfo.floodBase + variance));
  const windScore = Math.max(0, Math.min(1, regionInfo.windBase + variance * 0.5));

  const simulatedTemp = 25 + (pincodeNum % 15);
  const simulatedHumidity = 40 + (pincodeNum % 45);
  const simulatedPrecipitation = floodScore * 150;
  const simulatedWindSpeed = windScore * 80;

  const floodRisk = calculateFloodRisk(simulatedPrecipitation);
  const windRisk = calculateWindRisk(simulatedWindSpeed);
  const overallRisk = calculateOverallRisk(floodRisk.score, windRisk.score);

  return {
    pincode,
    location: {
      name: `${regionInfo.region} (estimated)`,
      lat: null,
      lon: null,
      region: regionInfo.region,
    },
    weather: {
      temperature: simulatedTemp,
      humidity: simulatedHumidity,
      precipitation: Math.round(simulatedPrecipitation * 10) / 10,
      windSpeed: Math.round(simulatedWindSpeed * 10) / 10,
    },
    riskAssessment: {
      floodRisk,
      windRisk,
      overallRisk,
    },
    forecast: {
      totalRainfall7d: Math.round(simulatedPrecipitation * 10) / 10,
      maxWindSpeed7d: Math.round(simulatedWindSpeed * 10) / 10,
    },
    source: "simulated",
    note: "Geocoding could not resolve this pincode. Risk data is estimated based on regional patterns.",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { pincode } = body;

    // Validate pincode
    if (!pincode || typeof pincode !== "string") {
      return NextResponse.json(
        { error: "Pincode is required and must be a string" },
        { status: 400 }
      );
    }

    const cleanPincode = pincode.trim();
    if (!/^\d{6}$/.test(cleanPincode)) {
      return NextResponse.json(
        { error: "Invalid pincode. Must be a 6-digit Indian pincode." },
        { status: 400 }
      );
    }

    // Step 1: Geocode the pincode using Open-Meteo
    let lat, lon, locationName, region;
    let geocodeSuccess = false;

    try {
      const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${cleanPincode}+India&count=3&language=en`;
      const geocodeRes = await fetch(geocodeUrl, { signal: AbortSignal.timeout(8000) });

      if (!geocodeRes.ok) {
        throw new Error(`Geocoding API returned status ${geocodeRes.status}`);
      }

      const geocodeData = await geocodeRes.json();

      if (geocodeData.results && geocodeData.results.length > 0) {
        // Pick the best Indian result, or fall back to the first result
        const indiaResult = geocodeData.results.find(
          (r) => r.country_code === "IN" || r.country === "India"
        ) || geocodeData.results[0];

        lat = indiaResult.latitude;
        lon = indiaResult.longitude;
        locationName = indiaResult.name;
        region = indiaResult.admin1 || indiaResult.country || "India";
        geocodeSuccess = true;
      }
    } catch (geoErr) {
      console.warn(`Georisk: Geocoding failed for pincode ${cleanPincode}:`, geoErr.message);
    }

    // If geocoding failed, return simulated response
    if (!geocodeSuccess) {
      return NextResponse.json(buildSimulatedResponse(cleanPincode));
    }

    // Step 2: Fetch weather data from Open-Meteo
    let weatherData;
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m&daily=precipitation_sum,rain_sum,wind_speed_10m_max&timezone=Asia/Kolkata&forecast_days=7`;
      const weatherRes = await fetch(weatherUrl, { signal: AbortSignal.timeout(8000) });

      if (!weatherRes.ok) {
        throw new Error(`Weather API returned status ${weatherRes.status}`);
      }

      weatherData = await weatherRes.json();
    } catch (wxErr) {
      console.warn(`Georisk: Weather fetch failed for ${lat},${lon}:`, wxErr.message);
      // Fall back to simulated response if weather fails
      return NextResponse.json(buildSimulatedResponse(cleanPincode));
    }

    // Step 3: Extract metrics from weather data
    const current = weatherData.current || {};
    const daily = weatherData.daily || {};

    const temperature = current.temperature_2m ?? null;
    const humidity = current.relative_humidity_2m ?? null;
    const currentPrecipitation = current.precipitation ?? 0;
    const currentWindSpeed = current.wind_speed_10m ?? 0;

    const precipitationSums = daily.precipitation_sum || [];
    const windSpeedMaxes = daily.wind_speed_10m_max || [];

    const totalRainfall7d = precipitationSums.reduce((sum, val) => sum + (val || 0), 0);
    const maxWindSpeed7d = Math.max(0, ...windSpeedMaxes.map((v) => v || 0));

    // Step 4: Calculate risk scores
    const floodRisk = calculateFloodRisk(totalRainfall7d);
    const windRisk = calculateWindRisk(maxWindSpeed7d);
    const overallRisk = calculateOverallRisk(floodRisk.score, windRisk.score);

    // Step 5: Build response
    return NextResponse.json({
      pincode: cleanPincode,
      location: {
        name: locationName,
        lat,
        lon,
        region,
      },
      weather: {
        temperature,
        humidity,
        precipitation: currentPrecipitation,
        windSpeed: currentWindSpeed,
      },
      riskAssessment: {
        floodRisk,
        windRisk,
        overallRisk,
      },
      forecast: {
        totalRainfall7d: Math.round(totalRainfall7d * 10) / 10,
        maxWindSpeed7d: Math.round(maxWindSpeed7d * 10) / 10,
      },
      source: "open-meteo",
    });
  } catch (error) {
    console.error("Georisk API error:", error);
    return NextResponse.json(
      { error: "Geographic risk assessment failed: " + error.message },
      { status: 500 }
    );
  }
}
