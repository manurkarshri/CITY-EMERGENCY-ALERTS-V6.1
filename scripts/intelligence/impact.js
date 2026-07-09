import { loadConfig } from "../lib/config.js";

export async function assessImpact(event) {
  const rules = await loadConfig("decision-rules.config.json");
  const rule = (rules.rules || []).find(r => r.category === event.category);
  return {
    ...event,
    impact: rule?.impact || "This event may affect local awareness or movement.",
    recommendedAction: rule?.action || "Monitor updates and verify through official sources where needed."
  };
}
