const SOURCE_NAME = "Maharashtra WRD Pravah Daily Report";
const SOURCE_URL = "https://mwrdpravah.in/damsafety/control/pdfLatestReportEng";

const PUNE_DAMS = {
  Khadakwasla: "khadakwasla",
  Panshet: "panshet",
  Warasgaon: "varasgaon",
  Temghar: "temghar",
  Pawana: "pawna",
  "Mulshi Tata": "mulshi",
  Bhatghar: "bhatghar",
  Veer: "veer"
};

export async function fetchPravahDailyReport(url = SOURCE_URL, options = {}) {
  const fetchImpl = options.fetchImpl || globalThis.fetch;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 45000);
  try {
    try {
      const response = await fetchImpl(url, {
        headers: { "User-Agent": "CITY-EMERGENCY-ALERTS/6.1" },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Pravah daily report request failed with HTTP ${response.status}`);
      return new Uint8Array(await response.arrayBuffer());
    } catch (error) {
      if (options.fetchImpl || !["UNABLE_TO_VERIFY_LEAF_SIGNATURE", "SELF_SIGNED_CERT_IN_CHAIN"].includes(error?.cause?.code)) throw error;
      return fetchWithSystemCurl(url, options.timeoutMs || 45000);
    }
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchWithSystemCurl(url, timeoutMs) {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execute = promisify(execFile);
  const seconds = Math.max(10, Math.ceil(timeoutMs / 1000));
  const { stdout } = await execute("curl", ["-fL", "--connect-timeout", "15", "--max-time", String(seconds), "--user-agent", "CITY-EMERGENCY-ALERTS/6.1", url], {
    encoding: "buffer",
    maxBuffer: 5 * 1024 * 1024
  });
  return new Uint8Array(stdout);
}

export async function extractPravahPdfText(bytes) {
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const document = await getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pages = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = new Map();
    for (const item of content.items || []) {
      const y = Math.round(Number(item.transform?.[5] || 0) * 2) / 2;
      const line = lines.get(y) || [];
      line.push({ x: Number(item.transform?.[4] || 0), text: String(item.str || "").trim() });
      lines.set(y, line);
    }
    pages.push([...lines.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, line]) => line.sort((a, b) => a.x - b.x).map(item => item.text).filter(Boolean).join(" "))
      .join("\n"));
  }
  return pages.join("\n");
}

export function parsePravahDailyReport(text = "", checkedAt = new Date().toISOString()) {
  const reportDate = String(text).match(/Status\s+as\s+on\s+Date\s*:\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!reportDate) throw new Error("Pravah report date was not found");
  const reportDay = `${reportDate[3]}-${reportDate[2]}-${reportDate[1]}`;
  const items = [];
  for (const [label, dam] of Object.entries(PUNE_DAMS)) {
    const pattern = new RegExp(`${escapeRegExp(label)}\\s+(\\d{2})\\/(\\d{2})\\/(\\d{4})\\s+(\\d{1,2}):(\\d{2})\\s+(AM|PM)\\s+((?:\\d+(?:\\.\\d+)?\\s+){5}\\d+(?:\\.\\d+)?)\\s*%`, "i");
    const match = String(text).match(pattern);
    if (!match) continue;
    const values = match[7].trim().split(/\s+/).map(Number);
    const observedAt = indiaTimestamp(match[1], match[2], match[3], match[4], match[5], match[6]);
    const currentDay = reportDay === puneDay(checkedAt) && puneDay(observedAt) === puneDay(checkedAt);
    items.push({
      id: `pravah-reservoir-${dam}`,
      kind: "reservoir",
      dam,
      station: label,
      storagePercent: values[5],
      liveContentsMcum: values[3],
      dischargeCumecs: null,
      status: "normal",
      trend: "unknown",
      freshness: currentDay ? "current" : "stale",
      lastUpdated: observedAt,
      sourceCheckedAt: checkedAt,
      source: SOURCE_NAME,
      sourceTrust: "A",
      sourceUrl: SOURCE_URL,
      measurementType: "daily_official_storage",
      storageOnly: true
    });
  }
  if (!items.length) throw new Error("Pravah report contained no configured Pune dam rows");
  return { reportDay, items };
}

function indiaTimestamp(day, month, year, hour, minute, meridiem) {
  let value = Number(hour) % 12;
  if (String(meridiem).toUpperCase() === "PM") value += 12;
  return `${year}-${month}-${day}T${String(value).padStart(2, "0")}:${minute}:00+05:30`;
}

function puneDay(value) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
