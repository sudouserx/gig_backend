const mongoose = require("mongoose");

const JobApplicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
    },
    applicantId: {
      type: String,
      required: true,
    },
    applicantRating: {
      type: Number,
      default: 0,
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("JobApplication", JobApplicationSchema);
