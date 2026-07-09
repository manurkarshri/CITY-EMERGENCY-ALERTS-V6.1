export function haversineKm(a, b) { const R = 6371; const dLat = toRad((b.lat || 0) - (a.lat || 0)); const dLon = toRad((b.lon || 0) - (a.lon || 0)); const lat1 = toRad(a.lat || 0); const lat2 = toRad(b.lat || 0); const h = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2; return 2 * R * Math.asin(Math.sqrt(h)); }
function toRad(v) { return v * Math.PI / 180; }
