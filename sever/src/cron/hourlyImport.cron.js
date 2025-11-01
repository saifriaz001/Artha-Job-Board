import "dotenv/config";
import cron from "node-cron";
import axios from "axios";

// your API endpoint that triggers imports
const API_URL = process.env.IMPORT_TRIGGER_URL || "http://localhost:4000/api/import/trigger";

// ─────────────────────────────────────────────
// Schedule the job: every hour at minute 0
// ─────────────────────────────────────────────
cron.schedule("0 * * * *", async () => {
  console.log(`⏱️  [${new Date().toLocaleTimeString()}] Running hourly job import...`);
  try {
    const res = await axios.post(API_URL);
    console.log("✅ Hourly import completed successfully:");
    res.data.runs?.forEach((r) => {
      console.log(`   • ${r.feedUrl} → ${r.count} jobs`);
    });
  } catch (err) {
    console.error("❌ Hourly import failed:", err.message);
  }
});

// ─────────────────────────────────────────────
// Optional immediate trigger on startup
// ─────────────────────────────────────────────
(async () => {
  console.log("🚀 Auto-import cron initialized.");
  try {
    const res = await axios.post(API_URL);
    console.log("✅ Initial import triggered on startup:", res.data?.runs?.length, "feeds");
  } catch (err) {
    console.error("⚠️  Initial import failed:", err.message);
  }
})();
