import { isDue, normalizeNewsDataResponse } from "../scripts/collectors/newsdata-io.js";

const checkedAt = "2026-07-12T06:00:00.000Z";
assert(!isDue("2026-07-12T05:31:00.000Z", checkedAt), "NewsData.io must not run before 30 minutes");
assert(isDue("2026-07-12T05:30:00.000Z", checkedAt), "NewsData.io must run at 30 minutes");
const items = normalizeNewsDataResponse({ results: [
  { article_id: "one", title: "Major fire in Pune industrial area disrupts traffic", description: "Fire crews responded in Pune", source_name: "Lokmat", pubDate: "2026-07-12 05:30:00", link: "https://www.lokmat.com/pune/example" },
  { article_id: "two", title: "Mumbai political meeting", description: "Leaders meet", source_name: "Lokmat", pubDate: "2026-07-12 05:30:00", link: "https://www.lokmat.com/mumbai/example" },
  { article_id: "three", title: "Pune fire", description: "Incident", source_name: "Unknown Blog", pubDate: "2026-07-12 05:30:00", link: "https://example.com/pune" }
] }, checkedAt);
const indirectMention = normalizeNewsDataResponse({ results: [{ article_id: "four", title: "Panchgani murder case", description: "Victim from Indapur, Pune district", source_name: "Lokmat", pubDate: "2026-07-12 05:30:00", link: "https://www.lokmat.com/other/example" }] }, checkedAt);
assert(indirectMention.length === 0, "A Pune mention only in background context must not create a Pune incident");
assert(items.length === 1, "Only trusted Pune emergency coverage must be retained");
assert(items[0].collectionSourceId === "newsdata_io", "NewsData.io provenance must be retained");
console.log("NewsData.io collector tests passed.");
function assert(condition, message) { if (!condition) throw new Error(message); }
