import { runImportForFeed } from "../services/feedFetcher.service.js";
import  runImportsForAllFeeds  from "../services/importCoordinator.service.js";
import { ImportLog } from "../models/ImportLog.js";

export async function triggerAll(req, res) {
  const runs = await runImportsForAllFeeds();
  res.json({ runs });
}

export async function triggerSome(req, res) {
  const feeds = Array.isArray(req.body?.feeds) ? req.body.feeds : [];
  const runs = [];

  for (const f of feeds) {
    const result = await runImportForFeed(f);
    runs.push({ feedUrl: f, ...result });
  }

  res.json({ runs });
}

export async function history(req, res) {
  const limit = Math.min(Number(req.query.limit || 20), 100);
  const feedUrl = req.query.feedUrl;
  const query = feedUrl ? { feedUrl } : {};

  const logs = await ImportLog.find(query)
    .sort({ startedAt: -1 })
    .limit(limit)
    .lean();

  res.json({ logs });
}
