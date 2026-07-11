import { state } from "../core/state.js";
import { escapeHtml, escapeAttr, relativeTime } from "../utils/format.js";

export const OFFICIAL_SOURCE_GROUPS = [
  ["Weather and disaster", [
    ["IMD", "https://mausam.imd.gov.in/", "imd_nowcast", "Weather warnings and nowcasts"],
    ["NDMA SACHET", "https://sachet.ndma.gov.in/", "ndma_sachet", "Public emergency alerts"],
    ["Maharashtra SDMA", "https://sdma.maharashtra.gov.in/en/", null, "State disaster-management updates and preparedness"],
    ["Pune Division Disaster Management", "https://divcompune.maharashtra.gov.in/en/disaster-management/", null, "District disaster-control information and contacts"],
    ["Pune District Administration", "https://pune.gov.in/", null, "District notices and helplines"]
  ]],
  ["Rivers and dams", [
    ["Maharashtra WRD RTDAS", "https://mahahp.gov.in/RTDAS_backgd.aspx", "maharashtra_rtdas", "Live river and dam readings used by this app"],
    ["Maharashtra Water Resources Department", "https://wrd.mahaonline.gov.in/", null, "State water-resource authority"],
    ["Central Water Commission", "https://cwc.gov.in/", null, "National river and flood authority"],
    ["CWC Flood Forecast", "https://ffs.india-water.gov.in/", null, "Flood forecasting and river information"],
    ["FloodWatch India", "https://cwc.gov.in/floodwatch-india", null, "National flood-information service"]
  ]],
  ["Civic and public safety", [
    ["Pune Municipal Corporation", "https://www.pmc.gov.in/", null, "Pune civic notices and services"],
    ["Pimpri Chinchwad Municipal Corporation", "https://www.pcmcindia.gov.in/", null, "PCMC civic notices and services"],
    ["Pune City Police", "https://punepolice.gov.in/", null, "Police, traffic issues and emergency assistance"],
    ["Maharashtra Highway Traffic Police", "https://highwaypolice.maharashtra.gov.in/", null, "Highway safety and traffic-police information"]
  ]],
  ["Transport and highways", [
    ["Pune Metro", "https://www.punemetrorail.org/press-release", "pune_metro", "Official Metro service updates"],
    ["PMPML", "https://www.pmpml.org/", null, "Pune and PCMC bus-service information"],
    ["Central Railway Pune Division", "https://cr.indianrailways.gov.in/view_section.jsp?id=0,6,381&lang=0", null, "Railway division information"],
    ["Pune Airport (AAI)", "https://www.aai.aero/en/airports/pune", null, "Airport notices and contacts"],
    ["Maharashtra State Road Transport", "https://msrtc.mahaonline.gov.in/", null, "Intercity bus service information"],
    ["National Highways Authority of India", "https://nhai.gov.in/", null, "National-highway authority"]
  ]]
];

export const TRUSTED_MEDIA_SOURCES = [
  ["Indian Express Pune", "https://indianexpress.com/section/cities/pune/", "indian_express_pune"],
  ["Hindustan Times Pune", "https://www.hindustantimes.com/cities/pune-news", "hindustan_times_pune"],
  ["eSakal Pune", "https://www.esakal.com/pune", null], ["Lokmat Pune", "https://www.lokmat.com/pune/", null], ["Loksatta Pune", "https://www.loksatta.com/pune/", null],
  ["Maharashtra Times Pune", "https://maharashtratimes.com/maharashtra/pune-news/articlelist/65119369.cms", null],
  ["ABP Majha Pune", "https://marathi.abplive.com/tv-show/pune", null], ["TV9 Marathi", "https://www.tv9marathi.com/", null]
];

export function renderOfficial() {
  document.getElementById("tab-official").innerHTML = `
    <section class="card feature"><div class="section-kicker">Verification</div><h2>Official</h2>
      <p>Official sources confirm emergency information. <strong>Connected</strong> means this app actively checks the source. <strong>Verification link</strong> opens the authority's own information and is not live-collected by this app.</p>
    </section>
    ${OFFICIAL_SOURCE_GROUPS.map(([title, sources]) => renderGroup(title, sources)).join("")}
    ${renderGroup("Tier 2: Trusted media", TRUSTED_MEDIA_SOURCES, true)}
  `;
}

function renderGroup(title, sources, mediaGroup = false) {
  return `<section class="card"><details open><summary>${escapeHtml(title)}</summary>
    ${mediaGroup ? `<p class="small">Trusted media supports early awareness. It cannot override official emergency information.</p>` : ""}
    <div class="source-directory">${sources.map(renderSource).join("")}</div>
  </details></section>`;
}

function renderSource([name, url, sourceId, description]) {
  const health = sourceId ? (state.sourceHealth?.sources || []).find(source => source.id === sourceId) : null;
  const status = health ? `Connected · ${health.status === "healthy" || health.status === "current" ? "current" : health.status}${health.sourceCheckedAt ? ` · checked ${relativeTime(health.sourceCheckedAt)}` : ""}` : "Verification link · not live-collected";
  return `<article class="source-entry"><a href="${escapeAttr(url)}" target="_blank" rel="noopener">${escapeHtml(name)}</a><span class="small">${escapeHtml(description || "Trusted-media coverage")}</span><span class="source-status ${health ? "connected" : "linked"}">${escapeHtml(status)}</span></article>`;
}
