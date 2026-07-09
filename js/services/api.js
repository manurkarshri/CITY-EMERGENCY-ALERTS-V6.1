export async function loadJson(url, fallback) {
  try {
    const response = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) throw new Error(response.statusText);
    return await response.json();
  } catch (error) {
    console.warn("Failed to load", url, error);
    return fallback;
  }
}
