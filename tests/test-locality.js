import { detectLocality } from "../scripts/intelligence/locality.js";
import { loadConfig } from "../scripts/lib/config.js";
import { canonicalLocality, localityMatches } from "../js/utils/locality.js";

function assert(condition, message) { if (!condition) throw new Error(message); }

const talukas = await loadConfig("talukas.config.json");
const config = await loadConfig("localities.config.json");
const regions = await loadConfig("regions.config.json");
assert(Object.keys(talukas).length === 16, "Pune District should expose all 16 configured talukas");
assert(Object.keys(regions).length === 1 && regions.pune_district, "Pune District must be the only Region; Pune City and PCMC remain Talukas");
for (const locality of ["Kalas", "Vishrantwadi", "Sadashiv Peth", "Deccan Gymkhana"]) {
  assert(talukas.pune_city.localities.includes(locality), `${locality} must be under Pune City`);
}
assert(talukas.mulshi.localities.includes("Hinjawadi"), "Hinjawadi must be under Mulshi");
assert(!talukas.pcmc.localities.includes("Hinjawadi"), "Hinjawadi must not be duplicated under PCMC");

const hinjewadi = await detectLocality("Traffic is slow near Hinjewadi Phase 1");
assert(hinjewadi.localities.includes("Hinjawadi") && hinjewadi.talukas.includes("mulshi"), "Hinjewadi alias did not resolve to Hinjawadi, Mulshi");
const deccan = await detectLocality("Waterlogging reported near Deccan");
assert(deccan.localities.includes("Deccan Gymkhana") && deccan.talukas.includes("pune_city"), "Deccan alias did not resolve to Pune City");
const sinhgad = await detectLocality("Slow traffic on Sinhgad Road");
assert(sinhgad.localities.includes("Sinhagad Road") && sinhgad.talukas.includes("pune_city"), "Sinhgad alias did not resolve to Sinhagad Road, Pune City");
const sadashiv = await detectLocality("Advisory for Sadashiv Peth");
assert(sadashiv.talukas.length === 1 && sadashiv.talukas[0] === "pune_city", "Sadashiv Peth matched an incorrect taluka");
assert(canonicalLocality("Hinjewadi", config) === "Hinjawadi", "Browser alias canonicalization failed");
assert(localityMatches("Deccan", "Deccan Gymkhana", config), "Browser locality alias matching failed");

console.log("Locality hierarchy tests passed.");
