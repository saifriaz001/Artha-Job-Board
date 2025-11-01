import "dotenv/config";
import { Worker, Queue } from "bullmq";
import crypto from "crypto";
import { logger } from "../utils/logger.js";
import { Job } from "../models/Job.js";
import { ImportLog } from "../models/ImportLog.js";
import { connectMongo } from "../config/db.js";
import { redis } from "../config/redis.js"; // ✅ shared redis connection

// ---- INITIAL SETUP ----
await connectMongo().catch((err) => {
  console.error("❌ MongoDB connection failed:", err.message);
  process.exit(1);
});

console.log("🔗 Using Redis URL:", process.env.REDIS_URL);
console.log("✅ MongoDB connection established for worker");
console.log("🚀 Worker is starting...");

// ---- HELPERS ----
function computeHash(d) {
  const key = [d.title, d.description, d.applyUrl, d.location, d.type].join("|");
  return crypto.createHash("sha1").update(key).digest("hex");
}

const concurrency = Number(process.env.QUEUE_CONCURRENCY || 10);

// ---- WORKER DEFINITION ----
const worker = new Worker(
  "job-import-queue",
  async (job) => {
    const d = job.data;
    const { importLogId, source, externalId, ...rest } = d;

    console.log(`⚙️  Processing job: [${source}] ${externalId}`);

    try {
      const hash = computeHash(rest);
      const existing = await Job.findOne({ source, externalId }).lean();

      if (!existing) {
        await Job.create({ source, externalId, hash, ...rest });
        await ImportLog.updateOne({ _id: importLogId }, { $inc: { newJobs: 1 } });
        console.log(`🆕 Inserted new job → ${externalId}`);
        return "inserted";
      }

      if (existing.hash !== hash) {
        await Job.updateOne({ _id: existing._id }, { $set: { hash, ...rest } });
        await ImportLog.updateOne({ _id: importLogId }, { $inc: { updatedJobs: 1 } });
        console.log(`♻️  Updated existing job → ${externalId}`);
        return "updated";
      }

      console.log(`⏭️  No changes detected → ${externalId}`);
      return "noop";
    } catch (e) {
      await ImportLog.updateOne(
        { _id: importLogId },
        {
          $inc: { failedJobs: 1 },
          $push: { failures: { externalId, reason: e?.message || "unknown" } },
        }
      );
      console.error(`❌ Failed job → ${externalId} | ${e.message}`);
      throw e;
    }
  },
  { connection: redis, concurrency }
);

// ---- WORKER EVENT LISTENERS ----
worker.on("ready", () => {
  console.log("💼 Worker is ready and waiting for jobs...");
});

worker.on("active", (job) => {
  console.log(`▶️  Started job: ${job.id}`);
});

worker.on("completed", (job, result) => {
  console.log(`✅ Completed job: ${job.id} → ${result}`);
  logger.debug({ id: job.id, result }, "Job completed");
});

worker.on("failed", (job, err) => {
  console.error(`❌ Job failed: ${job?.id} → ${err?.message}`);
  logger.error({ id: job?.id, err }, "Job failed");
});

worker.on("error", (err) => {
  console.error("⚠️  Worker error:", err.message);
});

// ---- LIVE QUEUE MONITOR ----
const monitorQueue = new Queue("job-import-queue", { connection: redis });

setInterval(async () => {
  try {
    const counts = await monitorQueue.getJobCounts();
    console.log(
      `📊 Queue Status → waiting: ${counts.waiting || 0}, active: ${counts.active || 0}, completed: ${counts.completed || 0}, failed: ${counts.failed || 0}`
    );
  } catch (err) {
    console.error("⚠️  Queue monitor error:", err.message);
  }
}, 10000);

// ---- HEARTBEAT ----
setInterval(() => {
  console.log(`💓 Worker alive @ ${new Date().toLocaleTimeString()}`);
}, 60000);

// ---- GLOBAL ERROR GUARDS ----
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
});
