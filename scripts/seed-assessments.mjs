/**
 * Seed 100 realistic Indian assessments into the database.
 * Run from client/: node ../scripts/seed-assessments.mjs
 */

import mongoose from "mongoose";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = join(__dirname, "..", "client", ".env.local");
try {
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq > 0) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  }
} catch {}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

const EMAIL = "jayeshgjadhav14@gmail.com";

// ── Indian names ──
const M = ["Aarav","Vihaan","Aditya","Sai","Arjun","Reyansh","Krishna","Ishaan","Dhruv","Kabir","Vivaan","Rudra","Arnav","Rohan","Yash","Karthik","Nikhil","Rahul","Vikram","Suresh","Rajesh","Ganesh","Naveen","Pranav","Deepak","Vishal","Amit","Sanjay","Raghav","Dev","Parth","Sahil","Tushar","Akash","Jayesh","Prateek","Hitesh","Chirag","Kunal","Varun","Gaurav","Harsh","Omkar","Tanmay","Bhavesh"];
const F = ["Aanya","Saanvi","Aadhya","Isha","Ananya","Diya","Priya","Riya","Kavya","Nisha","Aditi","Shreya","Pooja","Neha","Meera","Kiara","Avni","Gauri","Trisha","Divya","Tanvi","Kriti","Aisha","Ankita","Pallavi","Swati","Sunita","Lakshmi","Manju","Kiran","Sonali","Deepa","Nandini","Revathi","Sneha","Aarti","Bhavna","Trupti","Rashmi","Shweta","Vrinda","Mahima","Ritika","Payal","Simran"];
const LN = ["Sharma","Patel","Singh","Kumar","Verma","Gupta","Joshi","Reddy","Nair","Iyer","Desai","Rao","Pillai","Chatterjee","Banerjee","Das","Sinha","Agarwal","Jain","Mehta","Shah","Thakur","Yadav","Pandey","Mishra","Chauhan","Saxena","Bhat","Patil","Kulkarni","Deshpande","Kaur","Malhotra","Chopra","Arora","Bhatt","Tiwari","Dwivedi","Rathore","Solanki"];
const OCC = ["Software Engineer","Doctor","Teacher","Bank Manager","Business Owner","Chartered Accountant","Civil Engineer","Government Officer","Marketing Manager","Data Scientist","Pharmacist","Lawyer","Architect","Professor","Dentist","Nurse","Sales Executive","HR Manager","Graphic Designer","Journalist","Chef","Police Officer","Farmer","Shop Owner","Student","Homemaker","Retired","Mechanical Engineer","Financial Analyst","Content Writer"];
const VEHICLES = [["Maruti Swift","sedan"],["Hyundai i20","sedan"],["Tata Nexon","suv"],["Kia Seltos","suv"],["Honda City","sedan"],["Mahindra XUV700","suv"],["Maruti Baleno","sedan"],["Hyundai Creta","suv"],["Tata Punch","suv"],["Royal Enfield Classic","motorcycle"],["Honda Activa","motorcycle"],["TVS Jupiter","motorcycle"],["Bajaj Pulsar","motorcycle"],["Hero Splendor","motorcycle"],["Toyota Fortuner","suv"]];
const MED = ["","","","","","","","diabetes","hypertension","asthma","thyroid","diabetes, hypertension","","","","","arthritis","","migraine",""];

const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (a) => a[Math.floor(Math.random() * a.length)];

function gen(i) {
  const female = i % 3 === 1;
  const name = `${pick(female ? F : M)} ${pick(LN)}`;
  const age = rand(18, 68);
  const income = age < 22 ? rand(0, 200000) : rand(200000, 2800000);
  const credit = income > 500000 ? rand(620, 880) : rand(350, 720);
  const pt = ["health", "auto", "life", "property"][i % 4];
  const med = pick(MED);

  const doc = {
    policyType: pt,
    applicant: { name, email: EMAIL, phone: `+91 ${rand(70000, 99999)}${rand(10000, 99999)}`, age, gender: female ? "female" : "male", occupation: pick(OCC) },
    traditionalData: { income, creditScore: credit, medicalHistory: med ? med.split(", ") : [], existingPolicies: rand(0, 3) },
    alternativeData: {
      telematicsScore: Math.random() > 0.25 ? rand(35, 95) : null,
      behavioralScore: Math.random() > 0.25 ? rand(35, 95) : null,
      lifestyleScore: Math.random() > 0.25 ? rand(35, 95) : null,
      socialMediaRisk: pick(["low", "low", "low", "medium", "medium", "high"]),
    },
    policySpecificData: {},
    documents: [],
    status: "draft",
    createdAt: new Date(Date.now() - rand(0, 30) * 86400000 - rand(0, 86400000)),
  };

  if (pt === "health") {
    doc.policySpecificData = {
      bmi: String(+(rand(170, 380) / 10).toFixed(1)),
      bloodPressure: `${rand(100, 155)}/${rand(60, 100)}`,
      smokingStatus: pick(["never", "never", "never", "never", "former", "current"]),
      exerciseFrequency: String(rand(0, 7)),
      medicalHistory: med,
      currentMedications: "",
      familyHealthHistory: Math.random() > 0.7 ? pick(["heart disease", "diabetes", "cancer"]) : "",
    };
  } else if (pt === "auto") {
    const v = pick(VEHICLES);
    doc.policySpecificData = {
      vehicleMake: v[0], vehicleYear: String(rand(2016, 2026)), vehicleType: v[1],
      drivingYears: String(Math.max(0, age - 18 - rand(0, 5))),
      accidentsLast5: String(rand(0, 3)), trafficViolations: String(rand(0, 4)),
      dailyCommute: String(rand(5, 55)),
    };
  } else if (pt === "life") {
    doc.policySpecificData = {
      maritalStatus: age > 28 ? pick(["married", "married", "married", "single"]) : pick(["single", "single", "married"]),
      dependents: String(age > 30 ? rand(0, 4) : rand(0, 1)),
      smokingStatus: pick(["never", "never", "never", "former", "current"]),
      alcoholFrequency: pick(["never", "never", "occasional", "moderate"]),
      exerciseFrequency: String(rand(0, 7)),
      familyHistory: Math.random() > 0.6 ? pick(["heart disease", "diabetes", "cancer"]) : "",
      existingLifePolicies: String(rand(0, 2)),
    };
  } else {
    doc.policySpecificData = {
      propertyType: pick(["house", "apartment", "apartment", "condo"]),
      propertyAge: String(rand(1, 35)), propertyValue: String(rand(2000000, 18000000)),
      squareFootage: String(rand(500, 2800)),
      constructionType: pick(["concrete", "brick", "concrete", "steel"]),
      floodZone: pick(["none", "none", "none", "low", "moderate", "high"]),
      securitySystem: pick(["none", "basic", "comprehensive"]),
    };
  }

  return doc;
}

async function main() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const user = await db.collection("users").findOne({ email: EMAIL });
  if (!user) { console.error(`User ${EMAIL} not found — sign up first.`); process.exit(1); }
  console.log(`User: ${user.name} (${user._id})`);

  const docs = [];
  for (let i = 0; i < 100; i++) {
    const d = gen(i);
    d.userId = user._id;
    docs.push(d);
  }

  const r = await db.collection("assessments").insertMany(docs);
  console.log(`Inserted ${r.insertedCount} assessments.`);

  // Trigger ML analysis
  const ids = Object.values(r.insertedIds);
  console.log(`Triggering AI analysis (this takes ~5 minutes)...`);

  let ok = 0, fail = 0;
  for (const id of ids) {
    try {
      const res = await fetch(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/assessments/${id}/analyze`, { method: "POST" });
      if (res.ok) ok++; else fail++;
    } catch { fail++; }
    if ((ok + fail) % 10 === 0) console.log(`  ${ok + fail}/100 (${ok} analyzed, ${fail} failed)`);
  }

  console.log(`\nDone! ${ok} analyzed, ${fail} failed.`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
