function normalizeJobicy(item) {
  const link = item?.link || item?.guid || "";
  return {
    source: "jobicy",
    externalId: String(link),
    title: item?.title || "",
    company: item?.["job:company_name"] || item?.company || "",
    location: item?.["job:location"] || item?.location || "",
    type: item?.["job:job_type"] || item?.type || "",
    remote: /remote/i.test(item?.["job:location"] || "") || /remote/i.test(item?.title || ""),
    description: item?.description || "",
    applyUrl: link,
    publishedAt: item?.pubDate ? new Date(item.pubDate) : undefined,
    raw: item
  };
}
export default normalizeJobicy;

