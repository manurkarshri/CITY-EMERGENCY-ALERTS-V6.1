import { escapeHtml, escapeAttr, relativeTime, severityLabel } from "../utils/format.js";

export function renderEventList(items, emptyText) {
  if (!items.length) return `<section class="card empty">${escapeHtml(emptyText)}</section>`;
  return items.map(item => `
    <article id="event-${escapeAttr(item.id)}" tabindex="-1" class="card event-card ${item.severity || "advisory"}">
      <span class="badge ${item.severity || "advisory"}">${severityLabel(item.severity)}</span>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.summary || item.impact || "")}</p>
      ${item.impact ? `<p><strong>Impact:</strong> ${escapeHtml(item.impact)}</p>` : ""}
      ${item.recommendedAction ? `<p><strong>Action:</strong> ${escapeHtml(item.recommendedAction)}</p>` : ""}
      <p class="event-meta">Confidence: ${escapeHtml(item.confidence || "Unknown")} · Trust: ${escapeHtml(item.sourceTrust || "N/A")} · Status: ${escapeHtml(item.lifecycle || "active")}</p>
      ${item.sourceTrust === "B" ? `<p class="event-meta"><strong>Corroboration:</strong> ${item.corroboratedByIndependentSources ? `${new Set((item.sources || []).map(source => source.name)).size} independent trusted sources` : "Not yet independently confirmed; treat as developing"}</p>` : ""}
      <p class="event-meta">Published: ${relativeTime(item.publishedAt)} · Verified: ${relativeTime(item.lastVerifiedAt)} · Source checked: ${relativeTime(item.sourceCheckedAt)}</p>
      <p class="event-meta">Affected: ${escapeHtml([...(item.localities || []), ...(item.operationalZones || [])].slice(0,5).join(" • ") || item.affectedArea || scopeLabel(item.geographicScope))}</p>
      <div class="source-list">
        ${(item.sources || [{ name: item.source, link: item.link }]).slice(0,5).map(source =>
          source.link ? `<a class="source-pill" href="${escapeAttr(source.link)}" target="_blank" rel="noopener">${escapeHtml(source.name || "Source")}</a>` : `<span class="source-pill">${escapeHtml(source.name || "Source")}</span>`
        ).join("")}
      </div>
    </article>
  `).join("");
}

function scopeLabel(scope) { return scope === "pune_district" ? "Pune District" : scope === "broader_area" ? "Broader area - exact locality not specified" : "Broader Pune District area"; }
