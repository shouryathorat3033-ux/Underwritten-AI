import mongoose from "mongoose";

const ApplicantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  // Personal info (accumulated from documents + manual entry)
  personal: {
    name: String,
    email: String,
    phone: String,
    dob: String,
    age: Number,
    gender: String,
    occupation: String,
    address: String,
    aadhaarNumber: String,
    panNumber: String,
  },

  // Financial data
  financial: {
    income: Number,
    creditScore: Number,
    employer: String,
    existingPolicies: Number,
  },

  // Health data
  health: {
    bmi: Number,
    bloodPressure: String,
    smokingStatus: { type: String, enum: ["never", "former", "current"] },
    exerciseFrequency: Number,
    medicalHistory: [String],
    currentMedications: [String],
    familyHealthHistory: [String],
  },

  // Vehicle data
  vehicle: {
    make: String,
    year: Number,
    type: String,
    registrationNumber: String,
    drivingYears: Number,
    accidentsLast5: Number,
    trafficViolations: Number,
    dailyCommute: Number,
  },

  // Property data
  property: {
    type: String,
    age: Number,
    value: Number,
    squareFootage: Number,
    floodZone: String,
    securitySystem: String,
    location: String,
  },

  // Alternative data
  alternativeData: {
    telematicsScore: Number,
    behavioralScore: Number,
    lifestyleScore: Number,
    socialMediaRisk: String,
  },

  // Uploaded documents history
  documents: [{
    name: String,
    type: String,
    docType: String, // aadhaar, pan, salary_slip, medical_report, etc.
    url: String,
    size: Number,
    extractedData: mongoose.Schema.Types.Mixed,
    uploadedAt: { type: Date, default: Date.now },
  }],

  // Profile completeness
  completeness: { type: Number, default: 0 },

  // Linked assessments
  assessmentCount: { type: Number, default: 0 },
  lastAssessmentAt: Date,

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Auto-calculate completeness before save
ApplicantSchema.pre("save", function () {
  let filled = 0;
  let total = 0;

  const check = (val) => { total++; if (val) filled++; };
  check(this.personal?.name);
  check(this.personal?.age);
  check(this.personal?.gender);
  check(this.personal?.occupation);
  check(this.financial?.income);
  check(this.financial?.creditScore);
  check(this.health?.bmi);
  check(this.health?.smokingStatus);
  check(this.alternativeData?.telematicsScore);
  check(this.alternativeData?.behavioralScore);
  check(this.alternativeData?.lifestyleScore);
  check(this.documents?.length > 0);

  this.completeness = total > 0 ? Math.round((filled / total) * 100) : 0;
  this.updatedAt = new Date();
});

export default mongoose.models.Applicant || mongoose.model("Applicant", ApplicantSchema);
