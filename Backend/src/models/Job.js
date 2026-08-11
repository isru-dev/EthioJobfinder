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
      index: true,
    },
    company: {
      type: String,
      default: "Not Specified",
    },
    category: {
      type: String,
      default: "General / Other",
      index: true,
    },
    contactEmail: {
      type: String,
      default: null,
    },
    contactPhone: {
      type: String,
      default: null,
    },
    tags: [{ type: String, lowercase: true, trim: true }],
    sourceName: {
      type: String,
      required: true, // e.g. "@effoyjobs"
    },
    sourceType: {
      type: String,
      enum: ["telegram", "web"],
      default: "telegram",
    },
    // NEW OPTIONAL FIELDS FOR DEEP LINKING
    messageId: {
      type: Number,
      default: null,
    },
    channelUsername: {
      type: String,
      default: null,
    },
    postUrl: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Full-Text Search Index
jobSchema.index({
  title: "text",
  company: "text",
  category: "text",
  tags: "text",
  rawText: "text",
});

export const Job = mongoose.model("Job", jobSchema);