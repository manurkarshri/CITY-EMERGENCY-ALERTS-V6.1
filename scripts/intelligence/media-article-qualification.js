import { classifyLifeSafetyText } from "./life-safety-classification.js";

export function classifyQualifyingMediaArticle(title = "", summary = "") {
  const titleClassification = classifyLifeSafetyText(title);
  if (!titleClassification) return null;
  const combinedClassification = classifyLifeSafetyText(`${title} ${summary}`);
  if (["structural_collapse", "rescue_operation", "explosion", "chemical_hazard"].includes(combinedClassification?.category)) return combinedClassification;
  return titleClassification;
}
