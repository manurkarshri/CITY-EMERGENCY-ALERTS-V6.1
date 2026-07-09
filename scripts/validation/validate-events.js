import { allowedSeverity, allowedLifecycle, requiredEventFields } from "./schema.js";

export function validateEvent(event) {
  const errors = [];
  for (const field of requiredEventFields) if (event[field] === undefined || event[field] === null || event[field] === "") errors.push(`Missing field: ${field}`);
  if (event.severity && !allowedSeverity.includes(event.severity)) errors.push(`Invalid severity: ${event.severity}`);
  if (event.lifecycle && !allowedLifecycle.includes(event.lifecycle)) errors.push(`Invalid lifecycle: ${event.lifecycle}`);
  if (event.confidenceScore !== undefined && (event.confidenceScore < 0 || event.confidenceScore > 100)) errors.push(`Invalid confidence score: ${event.confidenceScore}`);
  return errors;
}
