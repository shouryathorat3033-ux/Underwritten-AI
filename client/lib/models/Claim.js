import mongoose from "mongoose";

const ClaimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  policyType: { type: String, enum: ["health", "auto", "life", "property"], required: true },
  policyNumber: String,
  assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },

  claimant: {
    name: { type: String, required: true },
    email: String,
    phone: String,
    age: Number,
    gender: String,
  },

  claimDetails: {
    type: {
      type: String,
      enum: ["accident", "theft", "natural_disaster", "medical", "death", "disability", "property_damage", "liability", "other"],
    },
    description: String,
    incidentDate: Date,
    reportedDate: { type: Date, default: Date.now },
    location: String,
    estimatedAmount: Number,
    approvedAmount: Number,
  },

  documents: [{
    name: String,
    type: String,
    url: String,
    size: Number,
    docType: String,
    verified: Boolean,
    verificationResult: mongoose.Schema.Types.Mixed,
    uploadedAt: { type: Date, default: Date.now },
  }],

  stp: {
    eligible: { type: Boolean, default: false },
    complexity: { type: String, enum: ["low", "medium", "high"] },
    complexityScore: Number,
    autoApproved: { type: Boolean, default: false },
    reasons: [String],
    processingTime: Number,
  },

  fraud: {
    score: Number,
    level: { type: String, enum: ["clean", "low", "medium", "high", "critical"] },
    flags: [{
      type: { type: String },
      description: String,
      severity: { type: String, enum: ["info", "warning", "critical"] },
      score: Number,
    }],
    duplicateClaimIds: [{ type: mongoose.Schema.Types.ObjectId }],
    networkLinks: [{
      claimId: { type: mongoose.Schema.Types.ObjectId },
      linkType: String,
      detail: String,
    }],
    investigationRequired: { type: Boolean, default: false },
  },

  settlement: {
    status: {
      type: String,
      enum: ["pending", "processing", "approved", "rejected", "paid", "disputed"],
      default: "pending",
    },
    method: { type: String, enum: ["bank_transfer", "cheque", "upi"] },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    approvedAt: Date,
    paidAt: Date,
    rejectionReason: String,
  },

  status: {
    type: String,
    enum: [
      "submitted", "under_review", "stp_approved", "stp_rejected",
      "manual_review", "approved", "rejected", "settled", "paid",
      "disputed", "investigation",
    ],
    default: "submitted",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

ClaimSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Claim || mongoose.model("Claim", ClaimSchema);
