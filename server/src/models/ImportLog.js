import { Schema, model } from "mongoose";

const FailureSchema = new Schema(
  { externalId: String, reason: String },
  { _id: false }
);

const ImportLogSchema = new Schema(
  {
    feedUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["running", "success", "partial", "failed"],
      default: "running",
    },
    startedAt: { type: Date, default: () => new Date() },
    endedAt: { type: Date },
    totalFetched: { type: Number, default: 0 },
    newJobs: { type: Number, default: 0 },
    updatedJobs: { type: Number, default: 0 },
    failedJobs: { type: Number, default: 0 },
    failures: { type: [FailureSchema], default: [] },
  },
  { timestamps: true }
);


export const ImportLog = model("ImportLog", ImportLogSchema);
