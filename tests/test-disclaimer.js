import fs from "fs/promises";

function assert(condition, message) { if (!condition) throw new Error(message); }
const situation = await fs.readFile(new URL("../js/ui/situation.js", import.meta.url), "utf8");
const cards = await fs.readFile(new URL("../css/cards.css", import.meta.url), "utf8");

assert(situation.includes('id="openDisclaimer"'), "Situation tab must include the disclaimer banner trigger");
assert(situation.includes('id="appDisclaimer"'), "Situation tab must include the disclaimer dialog");
assert(situation.includes("not an official government emergency-notification service"), "Disclaimer must clearly state official-service limits");
assert(situation.includes("Precise location history is not stored by this app"), "Disclaimer must explain location handling");
assert(situation.includes("Republishes of the same PTI or ANI report"), "Disclaimer must explain wire-service deduplication");
assert(cards.includes(".disclaimer-dialog"), "Disclaimer dialog must have dedicated responsive styling");
console.log("Disclaimer presentation tests passed.");
