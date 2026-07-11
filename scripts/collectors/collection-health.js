export const REQUIRED_EVENT_SOURCES = ["imd_nowcast", "ndma_sachet", "indian_express_pune", "hindustan_times_pune", "pune_metro"];

export function summarizeCollection(sourceStates, errors = []) {
  const required = sourceStates.filter(source => REQUIRED_EVENT_SOURCES.includes(source.id));
  const requiredHealthy = required.filter(source => source.status === "healthy");
  const status = requiredHealthy.length === required.length ? "healthy" : requiredHealthy.length ? "stale" : "unavailable";
  const requiredErrors = errors.filter(error => REQUIRED_EVENT_SOURCES.some(id => String(error).startsWith(`${id}:`)));
  const optionalErrors = errors.filter(error => !REQUIRED_EVENT_SOURCES.some(id => String(error).startsWith(`${id}:`)));
  return { status, error: requiredErrors.join("; ") || null, optionalErrors };
}
