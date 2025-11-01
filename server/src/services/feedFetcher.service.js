import axios from "axios";
import { XMLParser } from "fast-xml-parser";
import { jobImportQueue, defaultJobOptions } from "../config/queue.js";
import { ImportLog } from "../models/ImportLog.js";
import  normalizeJobicy  from "../utils/normalizers/jobicy.normalizer.js";
import  normalizeHigherEd  from "../utils/normalizers/highered.normalizer.js";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });

function pickNormalizer(feedUrl) {
  if (/jobicy\.com/i.test(feedUrl)) {
    return normalizeJobicy;
  }
  if (/higheredjobs\.com/i.test(feedUrl)) {
    return normalizeHigherEd;
  }
  return (x) => x; // fallback
}

export async function runImportForFeed(feedUrl) {
  const log = await ImportLog.create({
    feedUrl,
    status: "running",
    startedAt: new Date(),
  });

  try {
    const { data } = await axios.get(feedUrl, { timeout: 20000 });
    const json = parser.parse(data);
    const items =
      json?.rss?.channel?.item ??
      json?.feed?.entry ??
      json?.channel?.item ??
      [];

    const normalizer = pickNormalizer(feedUrl);
    const canonical = (Array.isArray(items) ? items : [items]).map(normalizer);

    await ImportLog.updateOne(
      { _id: log._id },
      { $set: { totalFetched: canonical.length } }
    );

    const jobs = canonical.map((c) => ({
      name: "import-one",
      data: { ...c, importLogId: String(log._id) },
      opts: { ...defaultJobOptions, jobId: `${c.source}:${c.externalId}` },
    }));

    const chunkSize = 200;
    for (let i = 0; i < jobs.length; i += chunkSize) {
      await jobImportQueue.addBulk(jobs.slice(i, i + chunkSize));
    }

    return { importLogId: String(log._id), count: canonical.length };
  } catch (e) {
    await ImportLog.updateOne(
      { _id: log._id },
      {
        $set: { status: "failed", endedAt: new Date() },
        $inc: { failedJobs: 1 },
      }
    );
    throw e;
  }
}
