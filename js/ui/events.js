import { escapeHtml, escapeAttr, relativeTime, severityLabel } from "../utils/format.js";
import { independentSourceCount } from "../../scripts/intelligence/source-independence.js";

export function renderEventList(items, emptyText) {
  if (!items.length) return `<section class="card empty">${escapeHtml(emptyText)}</section>`;
  return items.map(item => {
    const sources = eventSourceChoices(item);
    const primarySource = sources[0];
    const otherSources = sources.slice(1);
    return `
    <article id="event-${escapeAttr(item.id)}" tabindex="-1" class="card event-card ${item.severity || "advisory"}">
      <span class="badge ${item.severity || "advisory"}">${severityLabel(item.severity)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary || item.impact || "")}</p>
      ${item.impact ? `<p><strong>Impact:</strong> ${escapeHtml(item.impact)}</p>` : ""}
      ${item.recommendedAction ? `<p><strong>Action:</strong> ${escapeHtml(item.recommendedAction)}</p>` : ""}
      <p class="event-meta"><strong>Affected:</strong> ${escapeHtml([...(item.localities || []), ...(item.operationalZones || [])].slice(0, 5).join(" • ") || item.affectedArea || scopeLabel(item.geographicScope))}</p>
      <p class="event-meta">Updated ${relativeTime(item.lastVerifiedAt || item.sourceCheckedAt)} · ${escapeHtml(item.lifecycle || "active")}</p>
      <details class="event-details"><summary>Source and confidence</summary>
        <p class="event-meta">Confidence: ${escapeHtml(item.confidence || "Unknown")} · Trust: ${escapeHtml(item.sourceTrust || "N/A")}</p>
        ${item.sourceTrust === "B" ? `<p class="event-meta"><strong>Corroboration:</strong> ${item.corroboratedByIndependentSources ? `${item.independentSourceCount || independentSourceCount(item.sources || [])} independent trusted sources` : "Not yet independently confirmed; treat as developing"}</p>` : ""}
        <p class="event-meta">Published ${relativeTime(item.publishedAt)} · Source checked ${relativeTime(item.sourceCheckedAt)}</p>
      </details>
      ${primarySource?.link ? `<a class="primary-source-link" href="${escapeAttr(primarySource.link)}" target="_blank" rel="noopener">Read full report at ${escapeHtml(primarySource.name)} <span aria-hidden="true">→</span></a>` : ""}
      ${otherSources.length ? `<details class="corroborating-sources"><summary>Also reported by ${otherSources.length} trusted source${otherSources.length === 1 ? "" : "s"}</summary>
        <div class="source-choice-list">${otherSources.map(source => source.link
          ? `<a href="${escapeAttr(source.link)}" target="_blank" rel="noopener"><span>${escapeHtml(source.name)}</span><span>Open report <span aria-hidden="true">→</span></span></a>`
          : `<span class="unlinked-source">${escapeHtml(source.name)}</span>`).join("")}</div>
      </details>` : ""}
    </article>
  `;
  }).join("");
}

export function eventSourceChoices(item = {}) {
  const supplied = [...(item.sources || []), { name: item.source, link: item.link, trust: item.sourceTrust }]
    .filter(source => source?.name || source?.link);
  const byPublisher = new Map();
  for (const source of supplied) {
    const normalized = { name: String(source.name || "Source").trim(), link: safeHttpUrl(source.link), trust: source.trust || "", origin: source.origin || "" };
    const key = normalized.name.toLowerCase().replace(/\s+pune$/, "").replace(/[^a-z0-9]+/g, "");
    const existing = byPublisher.get(key);
    if (!existing || sourceQuality(normalized, item) > sourceQuality(existing, item)) byPublisher.set(key, normalized);
  }
  return [...byPublisher.values()].sort((a, b) => sourceQuality(b, item) - sourceQuality(a, item) || a.name.localeCompare(b.name));
}

function sourceQuality(source, item) {
  const trust = { "A+": 50, A: 40, B: 30, C: 20 }[source.trust || item.sourceTrust] || 0;
  const direct = source.link && !/news\.google\.com/i.test(source.link) ? 8 : 0;
  const primaryPublisher = source.name === item.source ? 4 : 0;
  const originalWire = /^(PTI|ANI|IANS)$/i.test(source.name) ? 2 : 0;
  return trust + direct + primaryPublisher + originalWire;
}

function safeHttpUrl(value) {
  try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ""; }
  catch { return ""; }
}

function scopeLabel(scope) { return scope === "pune_district" ? "Pune District" : scope === "broader_area" ? "Broader area - exact locality not specified" : "Broader Pune District area"; }
