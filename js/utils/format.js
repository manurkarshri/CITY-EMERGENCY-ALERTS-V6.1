export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

export function escapeAttr(value) { return escapeHtml(value); }

export function relativeTime(iso) {
  if (!iso) return "not available";
  const time = new Date(iso).getTime();
  if (!time) return "not available";
  const mins = Math.floor((Date.now() - time) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function severityLabel(severity) {
  return { emergency: "🔴 Emergency", warning: "🟠 Warning", watch: "🟡 Watch", advisory: "🔵 Advisory" }[severity] || "🔵 Advisory";
}
