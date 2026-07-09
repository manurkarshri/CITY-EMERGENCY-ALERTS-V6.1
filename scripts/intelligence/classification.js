const rules = [
  { category: "dam_release", severity: "warning", words: ["dam release", "water release", "discharge", "khadakwasla", "panshet", "varasgaon", "temghar"] },
  { category: "flood", severity: "warning", words: ["flood", "river level", "overflow"] },
  { category: "waterlogging", severity: "watch", words: ["waterlogging", "water logged", "flooded road"] },
  { category: "heavy_rain", severity: "watch", words: ["heavy rain", "very heavy rain", "red alert", "orange alert", "rainfall"] },
  { category: "accident", severity: "watch", words: ["accident", "collision", "crash", "vehicle overturned"] },
  { category: "road_closure", severity: "warning", words: ["road closed", "route closed", "traffic diversion"] },
  { category: "fire", severity: "warning", words: ["fire", "blaze"] },
  { category: "power_outage", severity: "advisory", words: ["power outage", "electricity outage", "load shedding"] },
  { category: "gas_leak", severity: "emergency", words: ["gas leak", "chemical leak", "hazmat"] }
];

export function classifyEventText(text = "") {
  const hay = text.toLowerCase();
  for (const rule of rules) {
    if (rule.words.some(word => hay.includes(word))) return { category: rule.category, severity: rule.severity };
  }
  return { category: "public_safety", severity: "advisory" };
}
