import { allowedSeverity, allowedLifecycle, requiredEventFields } from "./schema.js";

export function validateEvent(event) {
  const errors = [];
  for (const field of requiredEventFields) if (!(field in event)) errors.push(`Missing field: ${field}`);
  if (event.severity && !allowedSeverity.includes(event.severity)) errors.push(`Invalid severity: ${event.severity}`);
  if (event.lifecycle && !allowedLifecycle.includes(event.lifecycle)) errors.push(`Invalid lifecycle: ${event.lifecycle}`);
  if (event.confidenceScore !== undefined && (event.confidenceScore < 0 || event.confidenceScore > 100)) errors.push(`Invalid confidence score: ${event.confidenceScore}`);
  if (["active", "verified", "developing"].includes(event.lifecycle) && !event.expiresAt) errors.push("Active event must have expiresAt");
  if (["active", "verified", "developing"].includes(event.lifecycle) && !event.sourceCheckedAt) errors.push("Current event must have sourceCheckedAt");
  if (["A+", "A"].includes(event.sourceTrust) && event.lifecycle === "active" && !event.lastVerifiedAt) errors.push("Current official event must have lastVerifiedAt");
  if (/^https?:\/\/example\.com(?:\/|$)/i.test(event.link || "")) errors.push("Placeholder source link is not allowed in generated events");
  return errors;
}
