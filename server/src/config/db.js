import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

let retryCount = 0;
let lastLog = ""; 
let isConnecting = false;


export async function connectMongo() {
  const MONGO_URI = process.env.MONGODB_URI;


  const options = {
    maxPoolSize: 5,
    minPoolSize: 1,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  const connectWithRetry = async () => {
    if (isConnecting) return; 
    isConnecting = true;

    try {
      await mongoose.connect(MONGO_URI, options);

      const logMsg = "✅ MongoDB connected successfully (Pool: 5 connections)";
      if (logMsg !== lastLog) {
        logger.info(logMsg);
        lastLog = logMsg;
      }

      retryCount = 0;
      isConnecting = false;
    } catch (error) {
      const logMsg = `❌ MongoDB connection failed: ${error.message}`;
      if (logMsg !== lastLog) {
        logger.error(logMsg);
        lastLog = logMsg;
      }

      retryCount += 1;
      isConnecting = false;

      if (retryCount <= 5) {
        logger.warn(`⏳ Retrying in 60 seconds (Attempt ${retryCount}/∞)...`);
        setTimeout(connectWithRetry, 60000);
      } else {
        logger.warn("⚠️ Still retrying every 60s, MongoDB unreachable...");
        setTimeout(connectWithRetry, 60000);
      }
    }
  };


  mongoose.connection.on("disconnected", () => {
    const logMsg = "⚠️ MongoDB disconnected! Attempting to reconnect...";
    if (logMsg !== lastLog) {
      logger.warn(logMsg);
      lastLog = logMsg;
    }
    connectWithRetry();
  });

  mongoose.connection.on("error", (err) => {
    const logMsg = `💥 MongoDB error: ${err.message}`;
    if (logMsg !== lastLog) {
      logger.error(logMsg);
      lastLog = logMsg;
    }
  });


  connectWithRetry();
}
