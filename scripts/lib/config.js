import { readJson } from "./io.js";

const cache = new Map();

export async function loadConfig(name) {
  if (cache.has(name)) return cache.get(name);
  const data = await readJson(`config/${name}`, {});
  cache.set(name, data);
  return data;
}
