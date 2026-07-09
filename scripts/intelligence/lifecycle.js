export function applyLifecycle(event) {
  const ageHours = (Date.now() - new Date(event.lastUpdated).getTime()) / 36e5;
  let lifecycle = event.lifecycle || "detected";
  if (event.sourceTrust === "A" && lifecycle === "detected") lifecycle = "verified";
  if (ageHours <= 48 && ["detected", "verified"].includes(lifecycle)) lifecycle = "active";
  if (ageHours > 48 && ageHours <= 96) lifecycle = "monitoring";
  if (ageHours > 96) lifecycle = "archived";
  return { ...event, lifecycle };
}
