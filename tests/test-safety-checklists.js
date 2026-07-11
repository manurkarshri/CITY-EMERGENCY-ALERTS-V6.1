import { SAFETY_CHECKLISTS, checklistProgress, normalizeChecklistState, safetyChecklistKey } from "../js/utils/safety-checklists.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

assert(SAFETY_CHECKLISTS.length >= 5, "Safety checklist coverage is incomplete");
assert(safetyChecklistKey("fire") === "city-emergency-alerts:safety-checklist:fire", "Safety checklist storage key failed");
assert(JSON.stringify(normalizeChecklistState([2, 0, 2, -1, 9, "1"], 3)) === JSON.stringify([0, 2]), "Checklist state normalization failed");
assert(checklistProgress([0, 1, 1, 6], 3) === "2/3", "Checklist progress failed");
