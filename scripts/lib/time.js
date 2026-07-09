export function nowIso() { return new Date().toISOString(); }
export function isFresh(isoDate, hours = 48) { const t = new Date(isoDate).getTime(); if (!t) return false; return Date.now() - t <= hours * 60 * 60 * 1000; }
