// Neon Palms — progress state. Everything lives in localStorage; nothing
// leaves the browser. Demo mode (?demo=1) loads the Phase-1 progress used
// by the screenshots so a fresh visitor sees a half-finished guide.
const KEY = "neon-palms-progress-v8";

// Demo mode is in-memory only: toggling a trophy while previewing the demo
// must not overwrite the visitor's real saved progress.
let demoMode = false;

export function setDemoMode(on) {
  demoMode = on;
}

export const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };

function freshState() {
  return { earned: [], counters: {}, spoilers: false, selected: 1, claimsOpen: {} };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return freshState();
    const s = JSON.parse(raw);
    if (!Array.isArray(s.earned) || typeof s.counters !== "object" || s.counters === null) {
      return freshState();
    }
    return { ...freshState(), ...s };
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  if (demoMode) return; // demo progress is never written to localStorage
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

export function demoState(trophies) {
  const s = freshState();
  s.earned = trophies.filter((t) => t.phase === 1 && t.missable === "none").map((t) => t.id);
  for (const t of trophies) {
    if (t.count !== null) s.counters[t.id] = Math.floor(t.count / 2);
  }
  s.selected = 28;
  return s;
}

export function isEarned(state, id) {
  return state.earned.includes(id);
}

export function toggleEarned(state, id) {
  const i = state.earned.indexOf(id);
  if (i >= 0) state.earned.splice(i, 1);
  else state.earned.push(id);
  saveState(state);
}

export function counterValue(state, t) {
  if (t.count === null) return null;
  return Math.min(t.count, Math.max(0, state.counters[t.id] ?? 0));
}

export function setCounter(state, id, value) {
  state.counters[id] = value;
  saveState(state);
}

export function bumpCounter(state, t, delta) {
  const v = counterValue(state, t);
  setCounter(state, t.id, Math.min(t.count, Math.max(0, v + delta)));
}

export function stats(trophies, state) {
  const earnedSet = new Set(state.earned);
  const earned = trophies.filter((t) => earnedSet.has(t.id));
  const points = earned.reduce((n, t) => n + POINTS[t.grade], 0);
  const totalPoints = trophies.reduce((n, t) => n + POINTS[t.grade], 0);
  return {
    earnedCount: earned.length,
    totalCount: trophies.length,
    points,
    totalPoints,
    pct: Math.round((earned.length / trophies.length) * 100),
  };
}

export function exportJSON(state) {
  return JSON.stringify({ app: "neon-palms", version: 8, earned: state.earned, counters: state.counters }, null, 2);
}

export function importJSON(text) {
  const d = JSON.parse(text);
  if (!Array.isArray(d.earned) || typeof d.counters !== "object" || d.counters === null) {
    throw new Error("not a Neon Palms export");
  }
  const s = freshState();
  s.earned = d.earned.filter((x) => Number.isInteger(x));
  for (const [k, v] of Object.entries(d.counters)) {
    if (Number.isInteger(v) && v >= 0) s.counters[k] = v;
  }
  return s;
}
