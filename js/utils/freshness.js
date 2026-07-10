export function isCurrentEvent(event, now = Date.now()) {
  if (!event || !["active", "verified", "developing"].includes(event.lifecycle)) return false;
  if (!event.expiresAt) return false;
  const expiry = new Date(event.expiresAt).getTime();
  return Number.isFinite(expiry) && new Date(now).getTime() < expiry;
}

export function sourceStatus(source, now = Date.now()) {
  if (!source) return "unavailable";
  if (source.status === "unavailable" || !source.lastSuccessfulAt) return source.status || "unavailable";
  const staleAfterMinutes = Number(source.staleAfterMinutes || 90);
  const age = new Date(now).getTime() - new Date(source.lastSuccessfulAt).getTime();
  return ["healthy", "current"].includes(source.status)
    ? (age <= staleAfterMinutes * 60000 ? "current" : "stale")
    : source.status;
}
