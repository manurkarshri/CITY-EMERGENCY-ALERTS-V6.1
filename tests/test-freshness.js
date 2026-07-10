import { applyEventFreshness, isActiveEvent } from "../scripts/intelligence/freshness.js";
import { isCurrentEvent } from "../js/utils/freshness.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const base = {
  id: "fresh-warning",
  severity: "warning",
  sourceTrust: "A",
  publishedAt: "2026-07-10T00:00:00.000Z",
  lastUpdated: "2026-07-10T00:00:00.000Z",
  lastVerifiedAt: "2026-07-10T00:00:00.000Z",
  lifecycle: "verified"
};

const active = applyEventFreshness(base, { now: "2026-07-11T00:00:00.000Z", freshnessHours: { warning: 48 } });
assert(active.lifecycle === "active", "Fresh event should be active");
assert(active.expiresAt === "2026-07-12T00:00:00.000Z", "Warning expiry was not calculated correctly");
assert(isActiveEvent(active, "2026-07-11T00:00:00.000Z"), "Active event was filtered out by the pipeline");
assert(isCurrentEvent(active, "2026-07-11T00:00:00.000Z"), "Active event was filtered out by the browser");

const expired = applyEventFreshness(base, { now: "2026-07-12T00:00:00.000Z", freshnessHours: { warning: 48 } });
assert(expired.lifecycle === "expired", "Event should expire at its expiry timestamp");
assert(!isActiveEvent(expired, "2026-07-12T00:00:00.000Z"), "Expired event remained active in the pipeline");
assert(!isCurrentEvent(expired, "2026-07-12T00:00:00.000Z"), "Expired event remained visible in the browser");
assert(!isCurrentEvent({ ...active, expiresAt: null }), "Event without an expiry must not appear current");

console.log("Freshness and lifecycle tests passed.");
