const DEFAULT_FRESHNESS_HOURS = {
  emergency: 72,
  warning: 48,
  watch: 36,
  advisory: 24
};

export function applyEventFreshness(event, options = {}) {
  const now = new Date(options.now || Date.now());
  const thresholds = options.freshnessHours || DEFAULT_FRESHNESS_HOURS;
  const reference = validDate(event.lastVerifiedAt) || validDate(event.lastUpdated) || validDate(event.publishedAt);
  const configuredHours = Number(thresholds[event.severity] || thresholds.advisory || 24);
  const expiresAt = validDate(event.expiresAt) || (reference ? new Date(reference.getTime() + configuredHours * 36e5) : null);
  let lifecycle = event.lifecycle || (["A+", "A"].includes(event.sourceTrust) ? "verified" : "detected");
  if (["resolved", "archived", "expired"].includes(lifecycle)) return { ...event, expiresAt: expiresAt?.toISOString() || null, lifecycle };
  lifecycle = !expiresAt || now.getTime() >= expiresAt.getTime() ? "expired" : "active";
  return { ...event, expiresAt: expiresAt?.toISOString() || null, lifecycle };
}

export function isActiveEvent(event, now = Date.now()) {
  if (!event || !["active", "verified", "developing"].includes(event.lifecycle)) return false;
  const expiry = validDate(event.expiresAt);
  return !expiry || new Date(now).getTime() < expiry.getTime();
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}
