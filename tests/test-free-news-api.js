import { buildFreeNewsUrl, normalizeFreeNewsResponse } from "../scripts/collectors/free-news-api.js";

const checkedAt = "2026-07-12T06:00:00.000Z";
const items = normalizeFreeNewsResponse({ data: [
  { uuid: "one", title: "Major fire reported in Pune industrial area", subtitle: "Fire crews are responding", publisher: "TV9 Marathi", published_at: "2026-07-12T05:30:00Z", original_url: "https://www.tv9marathi.com/pune/example" },
  { uuid: "two", title: "Political meeting held in Mumbai", publisher: "TV9 Marathi", published_at: "2026-07-12T05:00:00Z", original_url: "https://www.tv9marathi.com/mumbai/example" },
  { uuid: "three", title: "पुण्यात भीषण अपघात", publisher: { name: "Loksatta" }, published_at: "2026-07-12T05:10:00Z", original_url: "https://www.loksatta.com/pune/example" },
  { uuid: "four", title: "पुणे में भीषण सड़क दुर्घटना", publisher: "Live Hindustan", published_at: "2026-07-12T05:20:00Z", original_url: "https://www.livehindustan.com/maharashtra/pune/example" },
  { uuid: "five", title: "Major fire in Pune", publisher: "Unknown Blog", published_at: "2026-07-12T05:20:00Z", original_url: "https://example.com/fire" },
  { uuid: "six", title: "Three women killed as truck crashes into procession of warkaris in Pune", publisher: "ThePrint", published_at: "2026-07-12T05:25:00Z", original_url: "https://theprint.in/india/example" },
  { uuid: "seven", title: "Pune bridge structural failure closes road", publisher: "Mid Day", published_at: "2026-07-12T05:26:00Z", original_url: "https://www.mid-day.com/example" }
] }, checkedAt);
assert(items.length === 5, "Approved English, Marathi and Hindi Pune emergency articles must be normalized");
assert(items.some(item => item.source === "ThePrint" && item.category === "accident"), "ThePrint accident reporting must be accepted as Tier 2");
assert(items.some(item => item.source === "Mid-day" && item.category === "infrastructure_failure"), "Mid-day infrastructure reporting must be accepted as Tier 2");
assert(items.every(item => item.sourceTrust === "B"), "Allowlisted media must remain Tier 2");
assert(items.every(item => item.link.startsWith("https://")), "Original publisher links must be retained");
const requestUrl = buildFreeNewsUrl();
assert(requestUrl.searchParams.get("in_title") === "Pune" && !requestUrl.searchParams.has("q"), "FreeNewsAPI must use the supported title-search parameter");
console.log("FreeNewsAPI collector tests passed.");
function assert(condition, message) { if (!condition) throw new Error(message); }

