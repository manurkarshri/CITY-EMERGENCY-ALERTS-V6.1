export function assessConfidence(event) {
  const trust = { A: 45, B: 35, C: 22, D: 10 }[event.sourceTrust] || 10;
  const sourceCount = new Set((event.sources || []).map(s => s.name)).size;
  let score = trust + Math.min(20, Math.max(0, sourceCount - 1) * 8);
  if ((event.localities || []).length) score += 12;
  if ((event.talukas || []).length) score += 8;
  const ageHours = (Date.now() - new Date(event.lastUpdated).getTime()) / 36e5;
  if (ageHours <= 6) score += 15;
  else if (ageHours <= 24) score += 8;
  score = Math.max(0, Math.min(100, Math.round(score)));
  return { confidenceScore: score, confidence: score >= 80 ? "High" : score >= 55 ? "Medium" : "Low" };
}
