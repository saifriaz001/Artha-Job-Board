import { runImportForFeed } from "./feedFetcher.service.js";

async function runImportsForAllFeeds() {
  const feeds = (process.env.JOB_FEEDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const results = [];
  for (const feed of feeds) {
    const r = await runImportForFeed(feed);
    results.push({ feedUrl: feed, ...r });
  }
  return results;
}

export default runImportsForAllFeeds;
