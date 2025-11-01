import IORedis from "ioredis";
import { logger } from "../utils/logger.js";
import "dotenv/config";

const REDIS_URL = process.env.REDIS_URL;
let lastLog = "";


const redisOptions = {
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  connectTimeout: 10000,
  retryStrategy: (times) => {
    const delay = Math.min(times * 2000, 30000); 
    const msg = `⏳ Redis reconnect attempt ${times}, retrying in ${delay / 1000}s`;
    if (msg !== lastLog) {
      logger.warn(msg);
      lastLog = msg;
    }
    return delay;
  },
};


export const redis = new IORedis(REDIS_URL, redisOptions);


redis.on("connect", () => {
  const msg = "✅ Redis connected successfully";
  if (msg !== lastLog) {
    logger.info(msg);
    lastLog = msg;
  }
});

redis.on("ready", () => {
  const msg = "🚀 Redis is ready to use";
  if (msg !== lastLog) {
    logger.info(msg);
    lastLog = msg;
  }
});

redis.on("error", (err) => {
  const msg = `❌ Redis error: ${err.message}`;
  if (msg !== lastLog) {
    logger.error(msg);
    lastLog = msg;
  }
});

redis.on("end", () => {
  const msg = "⚠️ Redis connection closed";
  if (msg !== lastLog) {
    logger.warn(msg);
    lastLog = msg;
  }
});


process.on("SIGINT", async () => {
  logger.info("🛑 Closing Redis connection...");
  await redis.quit();
  process.exit(0);
});
