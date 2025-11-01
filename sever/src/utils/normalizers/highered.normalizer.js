function normalizeHigherEd(item) {
  const link = item?.link || item?.guid || "";
  return {
    source: "highered",
    externalId: String(link),
    title: item?.title || "",
    company: item?.source || item?.author || "HigherEdJobs",
    location: item?.category || "",
    type: "unknown",
    remote: false,
    description: item?.description || "",
    applyUrl: link,
    publishedAt: item?.pubDate ? new Date(item.pubDate) : undefined,
    raw: item
  };
}

export default normalizeHigherEd;

