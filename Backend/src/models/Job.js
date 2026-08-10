import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    rawHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    rawText: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      default: "Uncategorized Vacancy",
      index: true,
    },
    category: {
      type: String,
      default: "General / Other",
      index: true,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    sourceName: {
      type: String,
      required: true,
    },
    sourceType: {
      type: String,
      enum: ["telegram", "web"],
      default: "telegram",
    },
    isAlertDispatched: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound Text Index for Web Searches
jobSchema.index({
  title: "text",
  category: "text",
  tags: "text",
  rawText: "text",
});

export const Job = mongoose.model("Job", jobSchema);