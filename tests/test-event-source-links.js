import { eventSourceChoices, renderEventList } from "../js/ui/events.js";

const item = {
  id: "wari-incident", title: "Developing: Pune procession accident", summary: "Safety response is under way.",
  source: "Indian Express Pune", sourceTrust: "B", severity: "watch", publishedAt: "2026-07-13T04:00:00Z", sourceCheckedAt: "2026-07-13T05:00:00Z",
  corroboratedByIndependentSources: true, independentSourceCount: 3,
  sources: [
    { name: "Indian Express Pune", trust: "B", link: "https://news.google.com/ie" },
    { name: "Indian Express Pune", trust: "B", link: "https://indianexpress.com/pune/wari" },
    { name: "ThePrint", trust: "B", link: "https://theprint.in/wari" },
    { name: "Moneycontrol", trust: "B", link: "https://www.moneycontrol.com/wari" }
  ]
};
const choices = eventSourceChoices(item);
assert(choices.length === 3, "Repeated links from the same publisher must produce one source choice");
assert(choices[0].name === "Indian Express Pune" && choices[0].link.includes("indianexpress.com"), "The primary source must prefer the direct publisher article");
const html = renderEventList([item], "");
assert(html.includes("Read full report at Indian Express Pune"), "The primary publisher link must be clearly labelled");
assert(html.includes("Also reported by 2 trusted sources"), "Additional publishers must appear in an expandable source list");
assert((html.match(/target="_blank" rel="noopener"/g) || []).length === 3, "Every publisher report must open safely in a new tab");
assert(!/<img\b/i.test(html), "Alert and Incident cards must not render publisher images");
assert(!html.includes("Official confirmation is awaited"), "Tier 2 cards must not imply that an official report is always expected");
assert(html.includes("Independently reported by"), "Corroborated Tier 2 cards must explain their evidence status");
const officialHtml = renderEventList([{ ...item, sources: [...item.sources, { name: "Pune Police", trust: "A", link: "https://punepolice.gov.in/notice" }] }], "");
assert(officialHtml.includes("Officially confirmed by") && officialHtml.includes("punepolice.gov.in"), "Official confirmation must be shown only with a linked official source");
console.log("Event source-link presentation tests passed.");

function assert(condition, message) { if (!condition) throw new Error(message); }
