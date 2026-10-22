import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { auth } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Applicant from "@/lib/models/Applicant";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPTS = {
  aadhaar: `You are reading an Indian Aadhaar Card (UID card issued by UIDAI). Extract EXACTLY what is printed on the card:
- Full name (as printed, in English)
- Date of birth (MUST be in DD/MM/YYYY format as printed on the card — look for "DOB" or "Date of Birth" or "Year of Birth" label)
- Gender (look for "MALE"/"FEMALE"/"पुरुष"/"महिला" printed on the card)
- Address (if visible on back side)
- Aadhaar number (12-digit number, usually formatted as XXXX XXXX XXXX)

IMPORTANT: Aadhaar cards have the name in English AND Hindi/regional language. Extract the ENGLISH name only.
The DOB is usually near the photo. Do NOT calculate age — return the date as printed.
If you cannot read a field clearly, use empty string "".
Return ONLY valid JSON: {"name":"","dob":"","gender":"","address":"","aadhaarNumber":""}`,

  pan: `You are reading an Indian PAN Card (Permanent Account Number card issued by Income Tax Department). Extract EXACTLY what is printed:
- Full name (as printed in English)
- PAN number (10-character alphanumeric, format: XXXXX0000X, e.g., ABCDE1234F)
- Father's name (as printed)
- Date of birth (if visible)
PAN numbers ALWAYS follow the pattern: 5 letters + 4 digits + 1 letter. If what you read doesn't match this pattern, use "".
Return ONLY valid JSON: {"name":"","pan":"","fatherName":"","dob":""}`,

  salary_slip: `Extract the following from this Salary Slip / Form 16 / Income document:
- Employee name
- Annual income or monthly salary (convert to annual if monthly)
- Employer/company name
Return ONLY valid JSON: {"name":"","annualIncome":"","employer":""}`,

  medical_report: `Extract the following from this Medical Report / Health Checkup document:
- Patient name
- BMI (if mentioned)
- Blood pressure (if mentioned)
- Pre-existing conditions or diagnoses (comma-separated list)
- Current medications (comma-separated list)
- Any other health observations
Return ONLY valid JSON: {"name":"","bmi":"","bloodPressure":"","conditions":"","medications":"","observations":""}`,

  driving_license: `Extract the following from this Driving License document:
- Full name
- Date of birth or age
- License issue date (to calculate driving years)
- Vehicle class/type authorized
Return ONLY valid JSON: {"name":"","age":"","issueDate":"","vehicleClass":""}`,

  property_document: `Extract the following from this Property Document / Registration / Tax Receipt:
- Property owner name
- Property type (apartment/house/villa/condo/land)
- Property area in square feet
- Property value or registration value
- Property address or location
- Year of construction or property age
Return ONLY valid JSON: {"ownerName":"","propertyType":"","squareFootage":"","propertyValue":"","location":"","propertyAge":""}`,

  insurance_document: `Extract the following from this existing Insurance Policy document:
- Policyholder name
- Policy type (health/auto/life/property)
- Premium amount
- Coverage amount
- Policy number
Return ONLY valid JSON: {"name":"","policyType":"","premium":"","coverage":"","policyNumber":""}`,

  vehicle_rc: `Extract the following from this Vehicle Registration Certificate (RC):
- Owner name
- Vehicle make and model
- Year of manufacture
- Vehicle type (must be one of: sedan, suv, truck, motorcycle, van)
- Registration number
Return ONLY valid JSON: {"ownerName":"","vehicleMake":"","vehicleYear":"","vehicleType":"","registrationNumber":""}`,
};

// Map extracted fields to form field keys
const FIELD_MAPPING = {
  aadhaar: { name: "applicantName", gender: "gender", dob: "dob" },
  pan: { name: "applicantName" },
  salary_slip: { name: "applicantName", annualIncome: "income" },
  medical_report: { name: "applicantName", bmi: "bmi", bloodPressure: "bloodPressure", conditions: "medicalHistory", medications: "currentMedications" },
  driving_license: { name: "applicantName", age: "age" },
  property_document: { ownerName: "applicantName", propertyType: "propertyType", squareFootage: "squareFootage", propertyValue: "propertyValue", propertyAge: "propertyAge" },
  vehicle_rc: { ownerName: "applicantName", vehicleMake: "vehicleMake", vehicleYear: "vehicleYear", vehicleType: "vehicleType" },
  insurance_document: {},
};

export async function POST(req) {
  try {
    const { documentType, documentUrl, documentText, fileName } = await req.json();

    if (!documentType || !EXTRACTION_PROMPTS[documentType]) {
      return NextResponse.json({ error: "Invalid document type", validTypes: Object.keys(EXTRACTION_PROMPTS) }, { status: 400 });
    }

    const isImage = fileName && /\.(jpg|jpeg|png|webp)$/i.test(fileName);
    const systemMsg = "You are a document data extraction AI. Extract ONLY the REAL data you can see in the document. NEVER fabricate or guess data. Return ONLY valid JSON. No markdown.";

    const instructions = `${EXTRACTION_PROMPTS[documentType]}

CRITICAL: Only extract data you can ACTUALLY read from the document. Use empty string "" for ANY field you cannot clearly see. Do NOT invent names, numbers, or addresses.

Rules:
- Return ONLY the JSON object, no markdown, no code fences
- Use "" for fields you CANNOT read — do NOT guess
- For income, return just the number without currency symbols
- For age, return just the number
- For gender, use lowercase "male" or "female"`;

    // Helper: convert URL to base64 data URL (fallback if Groq can't fetch directly)
    async function urlToBase64(url) {
      try {
        const resp = await fetch(url);
        if (!resp.ok) return null;
        const buffer = await resp.arrayBuffer();
        const contentType = resp.headers.get("content-type") || "image/jpeg";
        const base64 = Buffer.from(buffer).toString("base64");
        return `data:${contentType};base64,${base64}`;
      } catch { return null; }
    }

    // Helper: call vision model with an image URL (tries direct URL first, then base64)
    async function callVision(imgUrl, text) {
      // Try direct URL first
      try {
        return await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: imgUrl } }] },
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0,
          max_tokens: 500,
        });
      } catch (directErr) {
        console.error("Direct URL failed, trying base64:", directErr?.message);
        // Fallback: download and send as base64
        const dataUrl = await urlToBase64(imgUrl);
        if (!dataUrl) throw directErr; // re-throw if download also failed
        return await groq.chat.completions.create({
          messages: [
            { role: "system", content: systemMsg },
            { role: "user", content: [{ type: "text", text }, { type: "image_url", image_url: { url: dataUrl } }] },
          ],
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          temperature: 0,
          max_tokens: 500,
        });
      }
    }

    let completion;

    if (isImage && documentUrl) {
      completion = await callVision(documentUrl, instructions);
    } else if (documentText) {
      completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: `${instructions}\n\nDocument text:\n${documentText.slice(0, 3000)}` },
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0,
        max_tokens: 500,
      });
    } else if (documentUrl) {
      completion = await callVision(documentUrl, instructions);
    } else {
      return NextResponse.json({
        documentType,
        extracted: {},
        formFields: {},
        fieldsCount: 0,
        warning: "No document content provided. Please upload a clear image or PDF.",
      });
    }

    const responseText = completion.choices[0]?.message?.content || "";
    let extracted;
    try {
      extracted = JSON.parse(responseText);
    } catch {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) extracted = JSON.parse(jsonMatch[0]);
      else return NextResponse.json({ error: "Failed to parse extracted data" }, { status: 500 });
    }

    // ── Post-extraction validation: remove hallucinated/invalid values ──
    // PAN number must match XXXXX0000X pattern
    if (extracted.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(extracted.pan.toUpperCase())) {
      extracted.pan = "";
    } else if (extracted.pan) {
      extracted.pan = extracted.pan.toUpperCase();
    }
    // Aadhaar must be 12 digits
    if (extracted.aadhaarNumber) {
      const digits = extracted.aadhaarNumber.replace(/\s/g, "");
      if (!/^\d{12}$/.test(digits)) extracted.aadhaarNumber = "";
      else extracted.aadhaarNumber = digits;
    }
    // DOB validation: must parse to a real date between 1920-2015
    if (extracted.dob) {
      let testDob = extracted.dob;
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(testDob)) {
        const [dd, mm, yyyy] = testDob.split("/");
        testDob = `${yyyy}-${mm}-${dd}`;
      }
      const d = new Date(testDob);
      if (isNaN(d.getTime()) || d.getFullYear() < 1920 || d.getFullYear() > 2015) {
        extracted.dob = "";
      }
    }
    // Age sanity check: must be 1-120
    if (extracted.age) {
      const a = parseInt(extracted.age);
      if (isNaN(a) || a < 1 || a > 120) extracted.age = "";
    }
    // Gender normalization
    if (extracted.gender) {
      const g = extracted.gender.toLowerCase().trim();
      if (g.includes("male") && !g.includes("female")) extracted.gender = "male";
      else if (g.includes("female") || g.includes("महिला")) extracted.gender = "female";
      else if (g.includes("पुरुष")) extracted.gender = "male";
      else extracted.gender = "";
    }
    // Income must be a positive number
    if (extracted.annualIncome) {
      const inc = parseFloat(String(extracted.annualIncome).replace(/[₹,\s]/g, ""));
      if (isNaN(inc) || inc <= 0) extracted.annualIncome = "";
      else extracted.annualIncome = String(Math.round(inc));
    }
    // BMI must be 10-60
    if (extracted.bmi) {
      const b = parseFloat(extracted.bmi);
      if (isNaN(b) || b < 10 || b > 60) extracted.bmi = "";
    }
    // Remove fields that are clearly hallucinated (generic placeholder text)
    const hallucinated = ["john doe", "jane doe", "test", "example", "sample", "n/a", "not available", "placeholder", "rahul kumar", "unknown"];
    for (const key of Object.keys(extracted)) {
      const val = String(extracted[key]).toLowerCase().trim();
      if (hallucinated.includes(val)) extracted[key] = "";
    }

    // Map extracted fields to form fields
    const mapping = FIELD_MAPPING[documentType] || {};
    const formFields = {};
    for (const [extractedKey, formKey] of Object.entries(mapping)) {
      const val = extracted[extractedKey];
      if (val && val !== "") {
        formFields[formKey] = String(val);
      }
    }

    // Calculate age from DOB (Aadhaar, DL, etc.)
    if (extracted.dob) {
      try {
        // Handle DD/MM/YYYY, YYYY-MM-DD, or other formats
        let dob = extracted.dob;
        // Convert DD/MM/YYYY to YYYY-MM-DD
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(dob)) {
          const [dd, mm, yyyy] = dob.split("/");
          dob = `${yyyy}-${mm}-${dd}`;
        }
        const birthDate = new Date(dob);
        if (!isNaN(birthDate.getTime()) && birthDate.getFullYear() > 1920) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          formFields.age = String(age);
          extracted.age = String(age); // Add computed age to extracted for display
        }
      } catch {}
    }

    // Calculate driving years if we have issue date
    if (documentType === "driving_license" && extracted.issueDate) {
      try {
        const issueYear = new Date(extracted.issueDate).getFullYear();
        if (issueYear > 1950 && issueYear <= new Date().getFullYear()) {
          formFields.drivingYears = String(new Date().getFullYear() - issueYear);
        }
      } catch {}
    }

    // Save extracted data to applicant profile (if authenticated)
    let profileUpdated = false;
    try {
      const session = await auth();
      if (session?.user?.id) {
        await dbConnect();
        let profile = await Applicant.findOne({ userId: session.user.id });
        if (!profile) {
          profile = new Applicant({ userId: session.user.id, personal: {} });
        }

        // Map extracted data to profile sections
        const profileUpdate = {};
        if (extracted.name || extracted.ownerName) {
          profileUpdate["personal.name"] = extracted.name || extracted.ownerName;
        }
        if (extracted.dob) profileUpdate["personal.dob"] = extracted.dob;
        if (extracted.age) profileUpdate["personal.age"] = Number(extracted.age);
        if (extracted.gender) profileUpdate["personal.gender"] = extracted.gender;
        if (extracted.pan) profileUpdate["personal.panNumber"] = extracted.pan;
        if (extracted.annualIncome) profileUpdate["financial.income"] = Number(extracted.annualIncome);
        if (extracted.employer) profileUpdate["financial.employer"] = extracted.employer;
        if (extracted.bmi) profileUpdate["health.bmi"] = Number(extracted.bmi);
        if (extracted.bloodPressure) profileUpdate["health.bloodPressure"] = extracted.bloodPressure;
        if (extracted.conditions) {
          profileUpdate["health.medicalHistory"] = extracted.conditions.split(",").map(s => s.trim()).filter(Boolean);
        }
        if (extracted.medications) {
          profileUpdate["health.currentMedications"] = extracted.medications.split(",").map(s => s.trim()).filter(Boolean);
        }
        if (extracted.vehicleMake) profileUpdate["vehicle.make"] = extracted.vehicleMake;
        if (extracted.vehicleYear) profileUpdate["vehicle.year"] = Number(extracted.vehicleYear);
        if (extracted.vehicleType) profileUpdate["vehicle.type"] = extracted.vehicleType;
        if (extracted.registrationNumber) profileUpdate["vehicle.registrationNumber"] = extracted.registrationNumber;
        if (extracted.propertyValue) profileUpdate["property.value"] = Number(extracted.propertyValue);
        if (extracted.squareFootage) profileUpdate["property.squareFootage"] = Number(extracted.squareFootage);
        if (extracted.propertyAge) profileUpdate["property.age"] = Number(extracted.propertyAge);
        if (extracted.propertyType) profileUpdate["property.type"] = extracted.propertyType;

        // Save document to profile
        profile.documents.push({
          name: fileName || "uploaded_document",
          type: documentType,
          docType: documentType,
          url: documentUrl || "",
          extractedData: extracted,
          uploadedAt: new Date(),
        });

        // Apply updates
        for (const [key, val] of Object.entries(profileUpdate)) {
          const parts = key.split(".");
          if (parts.length === 2) {
            if (!profile[parts[0]]) profile[parts[0]] = {};
            profile[parts[0]][parts[1]] = val;
          }
        }

        profile.markModified("personal");
        profile.markModified("financial");
        profile.markModified("health");
        profile.markModified("vehicle");
        profile.markModified("property");
        profile.markModified("documents");
        await profile.save();
        profileUpdated = true;
      }
    } catch {}

    return NextResponse.json({
      documentType,
      extracted,
      formFields,
      fieldsCount: Object.keys(formFields).length,
      profileUpdated,
    });
  } catch (error) {
    console.error("Extract API error:", error?.message || error, error?.status, error?.error?.message);
    const msg = error?.error?.message || error?.message || "Unknown error";
    return NextResponse.json({ error: "Extraction failed: " + msg }, { status: 500 });
  }
}
