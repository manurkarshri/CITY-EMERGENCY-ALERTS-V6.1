export const SAFETY_CHECKLISTS = [
  {
    id: "heavy-rain",
    label: "Heavy rain / flood",
    items: [
      "Avoid flooded roads, underpasses and riverbanks.",
      "Do not drive through water when the road surface is not visible.",
      "Keep your phone charged and carry a torch or power bank.",
      "Move vehicles and valuables away from low-lying areas if it is safe to do so.",
      "Follow official warnings before travelling near rivers, dams or ghats."
    ]
  },
  {
    id: "storm-lightning",
    label: "Storm / lightning",
    items: [
      "Move indoors or into a hard-top vehicle as soon as thunder is heard.",
      "Avoid open fields, isolated trees, metal structures and water.",
      "Postpone outdoor work and avoid exposed hill or ghat routes.",
      "Unplug non-essential electrical equipment if conditions are unsafe."
    ]
  },
  {
    id: "fire",
    label: "Fire",
    items: [
      "Raise the alarm, leave by stairs and call Fire on 101 or Emergency on 112.",
      "Do not use lifts and do not re-enter until authorities say it is safe.",
      "Stay low under smoke and cover your nose and mouth with a cloth.",
      "If clothing catches fire: stop, drop and roll."
    ]
  },
  {
    id: "road-accident",
    label: "Road accident",
    items: [
      "Move to a safe position only if doing so will not create further danger.",
      "Call 112 or Ambulance on 108 and share the nearest landmark or road name.",
      "Do not crowd an injured person or move them unless there is immediate danger.",
      "Use hazard lights or warn approaching traffic from a safe distance."
    ]
  },
  {
    id: "emergency-kit",
    label: "Emergency kit",
    items: [
      "Keep drinking water, essential medicines and a basic first-aid kit ready.",
      "Keep a torch, power bank, spare batteries and a whistle accessible.",
      "Store ID copies and essential contacts in a waterproof pouch.",
      "Plan a safe meeting point and know how to contact family members."
    ]
  }
];

export function safetyChecklistKey(id) {
  return `city-emergency-alerts:safety-checklist:${id}`;
}

export function normalizeChecklistState(value, itemCount) {
  const selected = Array.isArray(value) ? value : [];
  return [...new Set(selected.filter(index => Number.isInteger(index) && index >= 0 && index < itemCount))].sort((a, b) => a - b);
}

export function checklistProgress(selected, itemCount) {
  return `${normalizeChecklistState(selected, itemCount).length}/${itemCount}`;
}
