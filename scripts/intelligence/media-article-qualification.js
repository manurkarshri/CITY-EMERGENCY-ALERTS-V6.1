import { classifyLifeSafetyText } from "./life-safety-classification.js";

export function classifyQualifyingMediaArticle(title = "", summary = "") {
  const titleClassification = classifyLifeSafetyText(title);
  if (!titleClassification) return null;
  const combinedClassification = classifyLifeSafetyText(`${title} ${summary}`);
  if (["structural_collapse", "rescue_operation", "explosion", "chemical_hazard", "infrastructure_failure", "health_emergency"].includes(combinedClassification?.category)) return combinedClassification;
  return titleClassification;
}
