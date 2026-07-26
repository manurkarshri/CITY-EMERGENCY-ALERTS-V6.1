import { promoteCorroboratedMediaAlert } from "../scripts/intelligence/media-alert-promotion.js";

function assert(condition, message) { if (!condition) throw new Error(message); }
const corroborated = promoteCorroboratedMediaAlert({ eventKind: "incident", sourceTrust: "B", corroboratedByIndependentSources: true, independentSourceCount: 2, category: "road_closure", severity: "warning", summary: "Road closed" });
assert(corroborated.eventKind === "alert" && corroborated.alertBasis === "media_corroborated", "Two independent trusted reports must create a labelled media-correlated alert");
const singleSource = promoteCorroboratedMediaAlert({ eventKind: "incident", sourceTrust: "B", corroboratedByIndependentSources: false, independentSourceCount: 1, category: "road_closure", severity: "warning" });
assert(singleSource.eventKind === "incident", "A single media report must remain a developing incident");
const attributed = promoteCorroboratedMediaAlert({ eventKind: "incident", source: "Indian Express Pune", sourceTrust: "B", reportedAuthority: "India Meteorological Department", category: "heavy_rain", severity: "warning", summary: "IMD issues a red alert for Pune ghats." });
assert(attributed.eventKind === "alert" && attributed.alertBasis === "trusted_media_attributed_official", "A trusted-media report explicitly attributed to an authority must enter Alerts with a transparent basis");
const collapse = promoteCorroboratedMediaAlert({ eventKind: "incident", sourceTrust: "B", corroboratedByIndependentSources: true, independentSourceCount: 2, category: "structural_collapse", severity: "warning" });
assert(collapse.eventKind === "incident", "A corroborated structural collapse remains an incident, not a public instruction alert");
console.log("Media alert promotion tests passed.");
