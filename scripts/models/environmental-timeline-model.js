export function createTimeline(state = "developing", note = "") {
  const allowed = ["expected", "developing", "peak", "recovering", "normal", "monitoring"];
  return { state: allowed.includes(state) ? state : "developing", note, updatedAt: new Date().toISOString() };
}
