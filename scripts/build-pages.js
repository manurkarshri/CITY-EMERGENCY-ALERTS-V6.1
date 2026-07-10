import fs from "fs/promises";
import path from "path";

const output = path.resolve("_site");
const ignored = new Set([".git", "_site", "node_modules"]);
await fs.rm(output, { recursive: true, force: true });
await fs.mkdir(output, { recursive: true });
for (const entry of await fs.readdir(path.resolve("."), { withFileTypes: true })) {
  if (ignored.has(entry.name)) continue;
  await fs.cp(path.resolve(entry.name), path.join(output, entry.name), { recursive: true });
}

const key = process.env.TOMTOM_API_KEY || "";
if (!key) throw new Error("TOMTOM_API_KEY is required for the Pages deployment");
if (!/^[A-Za-z0-9_-]+$/.test(key)) throw new Error("TOMTOM_API_KEY has an unexpected format");
await fs.writeFile(path.join(output, "config", "runtime-config.js"), `window.__CEA_CONFIG__ = Object.freeze({ tomtomApiKey: ${JSON.stringify(key)} });\n`, "utf8");
console.log("GitHub Pages artifact created with deployment-only runtime configuration.");
