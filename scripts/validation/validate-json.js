import fs from "fs/promises";
export async function validateJsonFile(filePath) { const text = await fs.readFile(filePath, "utf8"); JSON.parse(text); return true; }
