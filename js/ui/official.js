import { state } from "../core/state.js";
import { escapeHtml, escapeAttr, relativeTime } from "../utils/format.js";

const groups = [
  ["Weather and disaster", [
    ["IMD", "https://mausam.imd.gov.in/", "imd_nowcast"],
    ["NDMA SACHET", "https://sachet.ndma.gov.in/", "ndma_sachet"],
    ["Pune District Administration", "https://pune.gov.in/", null]
  ]],
  ["Rivers and dams", [
    ["Maharashtra Water Resources Department", "https://wrd.maharashtra.gov.in/", "maharashtra_rtdas"],
    ["Central Water Commission", "https://cwc.gov.in/", null],
    ["CWC Flood Forecast", "https://ffs.india-water.gov.in/", null],
    ["FloodWatch India", "https://cwc.gov.in/floodwatch-india", null]
  ]],
  ["Civic and public safety", [
    ["Pune Municipal Corporation", "https://www.pmc.gov.in/", null],
    ["Pimpri Chinchwad Municipal Corporation", "https://www.pcmcindia.gov.in/", null],
    ["Pune Police", "https://punepolice.gov.in/", null]
  ]],
  ["Transport and highways", [
    ["Pune Metro", "https://www.punemetrorail.org/press-release", "pune_metro"],
    ["National Highways Authority of India", "https://nhai.gov.in/", null]
  ]]
];
const media = [
  ["Indian Express Pune", "https://indianexpress.com/section/cities/pune/", "indian_express_pune"],
  ["Hindustan Times Pune", "https://www.hindustantimes.com/cities/pune-news", "hindustan_times_pune"],
  ["eSakal Pune", "https://www.esakal.com/pune", null], ["Lokmat Pune", "https://www.lokmat.com/pune/", null], ["Loksatta Pune", "https://www.loksatta.com/pune/", null],
  ["Maharashtra Times Pune", "https://maharashtratimes.com/maharashtra/pune-news/articlelist/65119369.cms", null],
  ["ABP Majha Pune", "https://marathi.abplive.com/tv-show/pune", null], ["TV9 Marathi", "https://www.tv9marathi.com/", null]
];

export function renderOfficial() {
  document.getElementById("tab-official").innerHTML = `
    <section class="card feature"><div class="section-kicker">Verification</div><h2>Official</h2>
      <p>Official sources confirm emergency information. “Connected” means this app actively checks the source; “Verification link” opens the authority’s own information.</p>
    </section>
    ${groups.map(([title, sources]) => renderGroup(title, sources)).join("")}
    ${renderGroup("Tier 2: Trusted media", media, true)}
  `;
}

function renderGroup(title, sources, mediaGroup = false) {
  return `<section class="card"><details open><summary>${escapeHtml(title)}</summary>
    ${mediaGroup ? `<p class="small">Trusted media supports early awareness. It cannot override official emergency information.</p>` : ""}
    <div class="source-directory">${sources.map(renderSource).join("")}</div>
  </details></section>`;
}
function renderSource([name, url, sourceId]) {
  const health = sourceId ? (state.sourceHealth?.sources || []).find(source => source.id === sourceId) : null;
  const status = health ? `Connected · ${health.status === "healthy" || health.status === "current" ? "current" : health.status}${health.sourceCheckedAt ? ` · checked ${relativeTime(health.sourceCheckedAt)}` : ""}` : "Verification link";
  return `<p><a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a><br><span class="small">${escapeHtml(status)}</span></p>`;
}
