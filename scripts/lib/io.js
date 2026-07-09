import fs from "fs/promises";
import path from "path";
export async function readJson(filePath, fallback = null) { try { return JSON.parse(await fs.readFile(filePath, "utf8")); } catch { return fallback; } }
export async function writeJson(filePath, data) { await fs.mkdir(path.dirname(filePath), { recursive: true }); await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8"); }
