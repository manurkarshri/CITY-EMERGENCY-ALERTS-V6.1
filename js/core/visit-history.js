const STORAGE_KEY = "cea.visitSnapshot.v1";

export function createVisitSnapshot(alerts = [], incidents = [], visitedAt = new Date().toISOString()) {
  return { visitedAt, events: [...alerts.map(item => eventRecord(item, "alerts")), ...incidents.map(item => eventRecord(item, "incidents"))] };
}

export function compareVisitSnapshots(previous, current) {
  if (!previous?.visitedAt) return { firstVisit: true, baselineAt: current.visitedAt, items: [] };
  const before = new Map((previous.events || []).map(item => [item.id, item]));
  const after = new Map((current.events || []).map(item => [item.id, item]));
  const items = [];
  for (const item of after.values()) {
    const old = before.get(item.id);
    if (!old) items.push({ ...item, change: "new" });
    else if (old.fingerprint !== item.fingerprint) items.push({ ...item, change: "updated" });
  }
  for (const item of before.values()) if (!after.has(item.id)) items.push({ ...item, change: "resolved" });
  items.sort((a, b) => changeRank(a.change) - changeRank(b.change) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
  return { firstVisit: false, baselineAt: previous.visitedAt, items };
}

export function loadVisitSnapshot(storage = globalThis.localStorage) {
  try { return JSON.parse(storage.getItem(STORAGE_KEY) || "null"); } catch { return null; }
}
export function saveVisitSnapshot(snapshot, storage = globalThis.localStorage) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); return true; } catch { return false; }
}

function eventRecord(item, tab) {
  const updatedAt = item.lastUpdated || item.lastVerifiedAt || item.publishedAt || null;
  const fingerprint = JSON.stringify([item.title || "", item.severity || "", item.lifecycle || "", updatedAt || "", item.summary || item.impact || ""]);
  return { id: String(item.id || ""), tab, title: item.title || "Untitled event", severity: item.severity || "advisory", lifecycle: item.lifecycle || "active", updatedAt, link: item.link || item.sources?.find(source => source.link)?.link || "", fingerprint };
}
function changeRank(value) { return ({ new: 1, updated: 2, resolved: 3 })[value] || 4; }
