import "dotenv/config";
import pkg from "bullmq";
import { redis } from "./redis.js";
import { logger } from "../utils/logger.js";

const { Queue, QueueEvents } = pkg;

// Log which Redis URL is being used
console.log("🔗 Using Redis URL:", process.env.REDIS_URL);

// Reuse the verified Redis connection
export const jobImportQueue = new Queue("job-import-queue", { connection: redis });
export const jobImportEvents = new QueueEvents("job-import-queue", { connection: redis });

export const defaultJobOptions = {
  attempts: Number(process.env.QUEUE_MAX_RETRIES || 5),
  backoff: {
    type: "exponential",
    delay: Number(process.env.QUEUE_BACKOFF_MS || 3000),
  },
  removeOnComplete: 5000,
  removeOnFail: 5000,
};

// Log event errors
jobImportEvents.on("error", (e) => logger.error({ e }, "QueueEvents error"));
