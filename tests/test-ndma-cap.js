import { parseNdmaCap, classifyCapEvent } from "../scripts/collectors/ndma-sachet-cap.js";
import { officialUpdateMatch, deduplicateEvents } from "../scripts/intelligence/deduplication.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const checkedAt = "2026-07-11T06:00:00.000Z";
const cap = `<cap:alert xmlns:cap="urn:oasis:names:tc:emergency:cap:1.2"><cap:identifier>IN-123</cap:identifier><cap:sender>Maharashtra-SDMA</cap:sender><cap:sent>2026-07-11T10:30:00+05:30</cap:sent><cap:status>Actual</cap:status><cap:msgType>Update</cap:msgType><cap:scope>Public</cap:scope><cap:references>IMD-Mumbai,IN-122,2026-07-11T10:00:00+05:30</cap:references><cap:info><cap:language>en-IN</cap:language><cap:event>Heavy Rain</cap:event><cap:severity>Severe</cap:severity><cap:expires>2026-07-11T14:00:00+05:30</cap:expires><cap:headline>Heavy rain likely in Pune district</cap:headline><cap:instruction>Avoid low lying roads.</cap:instruction><cap:area><cap:areaDesc>Pune,Satara districts of Maharashtra</cap:areaDesc></cap:area></cap:info></cap:alert>`;
const item = parseNdmaCap(cap, "https://sachet.ndma.gov.in/cap_public_website/FetchXMLFile?identifier=123", checkedAt);
assert(item?.sourceTrust === "A+" && item.severity === "warning", "Official CAP trust or severity mapping failed");
assert(item.recommendedAction === "Avoid low lying roads." && item.affectedArea.includes("Pune"), "CAP instruction or area missing");
assert(classifyCapEvent("Flood", "Extreme").severity === "emergency", "CAP extreme severity failed");
assert(parseNdmaCap(cap.replace("<cap:status>Actual</cap:status>", "<cap:status>Test</cap:status>"), "x", checkedAt) === null, "Test CAP must be rejected");
assert(parseNdmaCap(cap.replace("Pune,Satara", "Nashik,Satara"), "x", checkedAt) === null, "Non-Pune CAP must be rejected");
const imd = { ...item, id: "imd", source: "India Meteorological Department", sourceTrust: "A", title: "Heavy rain warning for Pune", summary: "Heavy rain likely in Pune district", publishedAt: "2026-07-11T05:15:00.000Z", expiresAt: item.expiresAt, sources: [{ name: "IMD", link: "https://mausam.imd.gov.in" }] };
const ndma = { ...item, id: "ndma", sources: [{ name: "NDMA SACHET", link: item.link }] };
assert(officialUpdateMatch(imd, ndma), "Matching official alert update should be recognized");
const merged = deduplicateEvents([imd, ndma]);
assert(merged.length === 1 && merged[0].sourceTrust === "A+" && merged[0].sources.length === 2, "Official priority deduplication failed");
console.log("NDMA SACHET CAP tests passed.");
