// Neon Palms — view renderers. Pure functions of (data, state) returning
// HTML strings; main.js wires the events.
import { POINTS, stats, counterValue, isEarned } from "./tracker.js";

export const STAGES = [
  { n: 1, title: "Chapter 1 — First Run", ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28], note: "Story beats of Chapter 1. Do the balcony meditation (#28) here — it is the only thing with a closing window." },
  { n: 2, title: "Vice City Opens Up", ids: [16, 20, 21, 33, 44, 46], note: "First activities and side trophies. Start every counter you can; they stack up over the whole run." },
  { n: 3, title: "Collections & Exploration", ids: [14, 30, 31, 35, 42, 54, 55], note: "The 100% checklist backbone: cards, scans, vehicles, areas, garages. Slow and steady, mostly done while doing other things." },
  { n: 4, title: "Skills & Grinds", ids: [15, 17, 18, 19, 32, 36, 48, 53], note: "Stunts, shooting ranges, races, challenges. The skill trophies live here — practice beats grinding." },
  { n: 5, title: "Crime Pays", ids: [34, 37, 38, 39, 40, 41, 43, 45, 49, 52], note: "Robberies, heists and feats. The money trophies and the crime chains, in roadmap order." },
  { n: 6, title: "Strangers & Loose Ends", ids: [22, 23, 24, 25, 26, 27, 29, 47, 50, 51], note: "Stranger questlines, the UFO and Ten Pin. Start the watch-window chains early; finish them here." },
  { n: 7, title: "The Platinum Run", ids: [1], note: "Vice Got a Price! pops the moment the other 54 are earned. Check every tracker before you call it done." },
];

export function stageOf(id) {
  for (const st of STAGES) if (st.ids.includes(id)) return st.n;
  return 1;
}

const KIND_LABELS = {
  story: "Story", activity: "Activity", collectible: "Collectible", completion: "Completion",
  crime: "Crime", feat: "Feat", side: "Side", platinum: "Platinum",
};

export function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function srcSup(ids) {
  if (!ids || !ids.length) return "";
  return `<sup class="src">${ids.map((n) => `[${n}]`).join("")}</sup>`;
}

export function gradeBadge(grade) {
  return `<span class="grade ${grade}">${grade[0].toUpperCase() + grade.slice(1)}</span>`;
}

export function flagHtml(t) {
  let out = "";
  if (t.missable === "possible") out += `<span class="flag miss">MISSABLE</span>`;
  else if (t.missable === "watch") out += `<span class="flag watch">WATCH</span>`;
  if (t.hidden) out += `<span class="flag hidden">HIDDEN</span>`;
  if (t.count !== null) out += `<span class="flag ctr">${t.count} ${esc(t.countUnit)}</span>`;
  return out;
}

export function hiddenBySpoiler(t, state) {
  return state.spoilers && t.kind === "story" && !isEarned(state, t.id) && t.id !== 1;
}

export function displayName(t, state) {
  return hiddenBySpoiler(t, state) ? "Story trophy (spoiler hidden)" : t.name;
}

export function displayDesc(t, state) {
  return hiddenBySpoiler(t, state) ? "Turn off the spoiler setting to see this description." : t.description;
}

export function auditNumbers(data) {
  const claims = data.trophies.flatMap((t) => t.claims);
  return {
    trophies: data.trophies.length,
    steps: data.trophies.reduce((n, t) => n + t.steps.length, 0),
    claims: claims.length,
    claimsBacked: claims.filter((c) => c.s.length >= 2).length,
    backed2: data.trophies.filter((t) => t.sources.length === 2 && t.steps.length >= 2).length,
    sources: data.sources.length,
    disputes: data.disputes.length,
    trackers: data.trophies.filter((t) => t.count !== null).length,
    hidden: data.trophies.filter((t) => t.hidden).length,
    points: data.trophies.reduce((n, t) => n + POINTS[t.grade], 0),
    online: data.trophies.filter((t) => t.kind === "online").length,
  };
}

export function renderAuditStrip(data) {
  const a = auditNumbers(data);
  return `<span><b>${a.trophies}</b> trophies</span><span><b>${a.steps}</b> steps, all cited</span>` +
    `<span><b>${a.claims}</b> claims, all cited</span><span><b>${a.claimsBacked}</b> claims backed by 2+ sources</span>` +
    `<span><b>${a.sources}</b> sources</span><span><b>${a.disputes}</b> disputes settled</span>` +
    `<span><b>${a.trackers}</b> counters</span><span><b>${a.hidden}</b> hidden</span>` +
    `<span><b>${a.points.toLocaleString()}</b> PSN points</span><span><b>${a.online}</b> online</span>` +
    `<span class="warn">1 possible missable</span><span>read 20 Nov 2026</span>`;
}

export function renderProgress(data, state) {
  const s = stats(data.trophies, state);
  return `<div class="big">${s.earnedCount}/${s.totalCount} earned · ${s.points.toLocaleString()}/${s.totalPoints.toLocaleString()} PTS</div>` +
    `<div class="bar"><i style="width:${s.pct}%"></i></div>` +
    `<div class="sub">${s.pct}% complete — progress saves in this browser</div>`;
}

export function kindChips(data, filters) {
  const counts = {};
  for (const t of data.trophies) counts[t.kind] = (counts[t.kind] || 0) + 1;
  const kinds = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  let out = `<button data-kind="" class="${filters.kind === "" ? "active" : ""}">All ${data.trophies.length}</button>`;
  for (const k of kinds) {
    out += `<button data-kind="${k}" class="${filters.kind === k ? "active" : ""}">${KIND_LABELS[k] || k} ${counts[k]}</button>`;
  }
  return out;
}

export function filterTrophies(data, state, filters) {
  let list = data.trophies.slice();
  if (filters.kind) list = list.filter((t) => t.kind === filters.kind);
  if (filters.grade) list = list.filter((t) => t.grade === filters.grade);
  if (filters.earned === "todo") list = list.filter((t) => !isEarned(state, t.id));
  if (filters.earned === "earned") list = list.filter((t) => isEarned(state, t.id));
  if (filters.q) {
    const q = filters.q.toLowerCase();
    list = list.filter((t) => (t.name + " " + t.description + " " + t.guide).toLowerCase().includes(q));
  }
  if (filters.sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
  else if (filters.sort === "grade") {
    const rank = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
    list.sort((a, b) => rank[a.grade] - rank[b.grade] || a.name.localeCompare(b.name));
  } else list.sort((a, b) => stageOf(a.id) - stageOf(b.id) || a.id - b.id);
  return list;
}

export function renderList(data, state, filters) {
  const list = filterTrophies(data, state, filters);
  if (!list.length) return `<li style="cursor:default">No trophies match. Clear the search or filters.</li>`;
  return list.map((t) => {
    const earned = isEarned(state, t.id);
    const ctr = t.count !== null ? `<span class="flag ctr">${counterValue(state, t)}/${t.count}</span>` : "";
    return `<li data-id="${t.id}" class="${t.id === state.selected ? "selected" : ""} ${earned ? "earned" : ""}">` +
      `<input type="checkbox" class="chk" data-toggle="${t.id}" ${earned ? "checked" : ""} aria-label="Mark ${esc(displayName(t, state))} earned">` +
      `<div class="tmeta"><div class="tname">${gradeBadge(t.grade)}${esc(displayName(t, state))}${flagHtml(t)}${ctr}</div>` +
      `<div class="tdesc">${esc(displayDesc(t, state))}</div></div></li>`;
  }).join("");
}

export function routeFor(data, t) {
  if (t.count === null) return null;
  return data.routes.find((r) => r.count === t.count && r.unit === t.countUnit) || null;
}

export function renderDetail(data, state) {
  const t = data.trophies.find((x) => x.id === state.selected) || data.trophies[0];
  const earned = isEarned(state, t.id);
  const route = routeFor(data, t);
  const dispute = t.dispute ? data.disputes.find((d) => d.id === t.dispute) : null;
  const claimsOpen = !!state.claimsOpen[t.id];
  let out = `<h2>${gradeBadge(t.grade)}${esc(displayName(t, state))}</h2>` +
    `<p class="odesc">${esc(displayDesc(t, state))} — ${POINTS[t.grade]} PTS · ${KIND_LABELS[t.kind] || t.kind} · Stage ${stageOf(t.id)}</p>` +
    `<div class="pills">${flagHtml(t)}${t.count !== null ? `<span class="flag ctr">${counterValue(state, t)}/${t.count} ${esc(t.countUnit)}</span>` : ""}</div>` +
    `<button class="claims-toggle" data-toggle-earned="${t.id}">${earned ? "Mark as not earned" : "Mark as earned"}</button>`;
  if (t.missable === "possible") {
    out += `<div class="box miss"><h4>Missable — read this first</h4><p>This is the only trophy with a confirmed missable window. Do the Chapter 1 balcony meditation at Jason's house, then make a manual save. It disappears after the chapter, and no source confirms the trophy works without it. ${dispute ? esc(dispute.call) : ""}</p></div>`;
  } else if (t.missable === "watch") {
    out += `<div class="box warn"><h4>Watch window</h4><p>Start this chain when it first appears. Sources disagree on whether the window closes — starting early costs nothing and removes the risk.</p></div>`;
  }
  out += `<h3>How to unlock</h3><p class="guide">${esc(t.guide)} ${srcSup(t.sources)}</p>`;
  if (t.count !== null) {
    const v = counterValue(state, t);
    out += `<div class="counter"><button data-bump="${t.id}|-1" aria-label="Decrease counter">−</button>` +
      `<div class="num">${v} / ${t.count}</div><button data-bump="${t.id}|1" aria-label="Increase counter">+</button>` +
      `<span class="clabel">${esc(t.countLabel)} — your count saves in this browser</span></div>`;
  }
  if (route) {
    out += `<div class="box"><h4>Suggested route — ${route.count} ${esc(route.unit)} in 3 stages</h4>` +
      route.stages.map((s, i) => `<p><b>Stage ${i + 1} — ${esc(s.label)} (${s.n})</b><br>${esc(s.tip)}</p>`).join("") + `</div>`;
  }
  out += `<h3>Steps — ${t.steps.length} steps, every one cited</h3><ol class="steps">` +
    t.steps.map((s) => `<li>${esc(s.t)} ${srcSup(s.s)}${s.s.length >= 2 ? ` <span class="twoplus">2+</span>` : ""}</li>`).join("") + `</ol>`;
  out += `<button class="claims-toggle" data-claims="${t.id}">${claimsOpen ? "Hide" : "Show"} ${t.claims.length} cited claims for this trophy</button>`;
  if (claimsOpen) {
    out += `<ul class="claims">` + t.claims.map((c) => `<li>${esc(c.c)} ${srcSup(c.s)}${c.s.length >= 2 ? ` <span class="twoplus">2+</span>` : ""}</li>`).join("") + `</ul>`;
  }
  if (dispute) {
    out += `<div class="box warn"><h4>Dispute ${dispute.id} — settled</h4><p><b>${esc(dispute.q)}</b></p>` +
      `<p>Position A: ${esc(dispute.a)}</p><p>Position B: ${esc(dispute.b)}</p><p><b>Our call:</b> ${esc(dispute.call)}</p></div>`;
  }
  const srcs = t.sources.map((n) => data.sources.find((s) => s.n === n)).filter(Boolean);
  out += `<h3>Sources for this trophy</h3><ul class="srclist">` +
    srcs.map((s) => `<li>[${s.n}] ${esc(s.site)} — <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a> (${esc(s.read)})</li>`).join("") + `</ul>`;
  return out;
}

export function renderCountPane(data, state, onJump) {
  const s = stats(data.trophies, state);
  const counters = data.trophies.filter((t) => t.count !== null).sort((a, b) => stageOf(a.id) - stageOf(b.id) || a.id - b.id);
  const next = nextUp(data, state, 3);
  let out = `<h3>Your count</h3><div class="big-num">${s.earnedCount}/${s.totalCount}</div>` +
    `<div class="sub">${s.points.toLocaleString()} / ${s.totalPoints.toLocaleString()} PSN points · ${s.pct}%</div>` +
    `<div class="bar"><i style="width:${s.pct}%"></i></div>`;
  out += `<h3>Roadmap progress</h3>` + STAGES.map((st) => {
    const inStage = data.trophies.filter((t) => st.ids.includes(t.id));
    const done = inStage.filter((t) => isEarned(state, t.id)).length;
    return `<div class="mini-stage"><span>Stage ${st.n} — ${esc(st.title.split(" — ")[1] || st.title)}</span><b>${done}/${inStage.length}</b></div>`;
  }).join("");
  out += `<h3 style="margin-top:14px">Counters — ${counters.length}</h3>` + counters.map((t) => {
    const v = counterValue(state, t);
    return `<div class="ctr-row"><span class="nm">${esc(displayName(t, state))}</span>` +
      `<button data-bump="${t.id}|-1" aria-label="Decrease">−</button><span class="v">${v}/${t.count}</span>` +
      `<button data-bump="${t.id}|1" aria-label="Increase">+</button></div>`;
  }).join("");
  out += `<h3 style="margin-top:14px">Next up</h3>` + (next.length ? next.map((x) =>
    `<div class="mini-next" data-jump="${x.t.id}"><b>${esc(displayName(x.t, state))}</b><div class="why">${esc(x.why)}</div></div>`).join("") : `<p class="sub">All 55 earned — platinum unlocked.</p>`);
  return out;
}

export function nextUp(data, state, n) {
  const todo = data.trophies.filter((t) => !isEarned(state, t.id))
    .sort((a, b) => stageOf(a.id) - stageOf(b.id) || a.id - b.id);
  return todo.slice(0, n).map((t) => ({ t, why: nextWhy(t) }));
}

export function nextWhy(t) {
  if (t.missable === "possible") return "The only possible missable — do it now, before the chapter ends.";
  if (t.missable === "watch") return "Watch window: start it while the chapter is open.";
  if (t.kind === "story") return "Next story trophy in roadmap order.";
  if (t.count !== null) return `Counter trophy — ${t.count} ${t.unit}. Chip away from now.`;
  return "Next in roadmap order.";
}

export function renderRoadmap(data, state) {
  let out = `<h2>Roadmap — 55 trophies in 7 stages</h2>` +
    `<p class="intro">One playthrough, all offline. Story first, counters running in the background, cleanup last. Roughly 200 hours: 60–80 for the story, ~100 for the 100% sweep, ~10 for cleanup. Sources disagree on the total (PowerPyx and GTABase say ~200h; Push Square says 250+) — plan on 200 and treat 250 as the slow-play read.</p><div class="cards">`;
  for (const st of STAGES) {
    const inStage = data.trophies.filter((t) => st.ids.includes(t.id)).sort((a, b) => a.id - b.id);
    const done = inStage.filter((t) => isEarned(state, t.id)).length;
    const pts = inStage.reduce((n, t) => n + POINTS[t.grade], 0);
    out += `<div class="card"><h3>Stage ${st.n} — ${esc(st.title)}</h3>` +
      `<p class="note">${esc(st.note)}</p><p class="earned-line">${done}/${inStage.length} earned · ${pts} PTS</p><ul>` +
      inStage.map((t) => `<li class="${isEarned(state, t.id) ? "done" : ""}" data-jump="${t.id}">${gradeBadge(t.grade)}${esc(displayName(t, state))}</li>`).join("") +
      `</ul></div>`;
  }
  return out + `</div>`;
}

export function renderMissables(data, state) {
  const missable = data.trophies.find((t) => t.missable === "possible");
  const watch = data.trophies.filter((t) => t.missable === "watch").sort((a, b) => a.id - b.id);
  let out = `<h2>Missables — 1 confirmed, 5 to watch</h2>` +
    `<p class="intro">Only one trophy has a confirmed missable window. Five more sit in stranger quest chains where sources disagree on whether the window closes. Start them when they appear and the risk disappears.</p><div class="cards">`;
  out += `<div class="card miss-card"><h3>${gradeBadge(missable.grade)}${esc(missable.name)} — MISSABLE</h3>` +
    `<p class="note">${esc(missable.description)}</p><p>${esc(missable.guide)} ${srcSup(missable.sources)}</p>` +
    `<p><b>Do this:</b> in Chapter 1, meditate on the balcony at Jason's house, then make a manual save. The balcony spot disappears after the chapter and no source confirms the trophy works without it. The other 17 meditations can wait.</p>` +
    `<button class="claims-toggle" data-jump="${missable.id}">Open full guide</button></div>`;
  for (const t of watch) {
    const dispute = t.dispute ? data.disputes.find((d) => d.id === t.dispute) : null;
    out += `<div class="card watch-card"><h3>${gradeBadge(t.grade)}${esc(t.name)} — WATCH</h3>` +
      `<p class="note">${esc(t.description)}</p><p>${esc(t.guide)} ${srcSup(t.sources)}</p>` +
      (dispute ? `<p><b>Dispute ${dispute.id}:</b> ${esc(dispute.call)}</p>` : "") +
      `<button class="claims-toggle" data-jump="${t.id}">Open full guide</button></div>`;
  }
  const d8 = data.disputes.find((d) => d.id === "D8");
  if (d8) {
    out += `<div class="card watch-card"><h3>Stranger chains in general — WATCH</h3>` +
      `<p class="note">The five quest-giver chains above share one open question.</p>` +
      `<p><b>${esc(d8.q)}</b></p><p>${esc(d8.a)}</p><p>${esc(d8.b)}</p>` +
      `<p><b>Our call:</b> ${esc(d8.call)}</p></div>`;
  }
  return out + `</div>`;
}

export function renderNextUp(data, state) {
  const list = nextUp(data, state, 10);
  let out = `<h2>Next up — your next 10 trophies</h2>` +
    `<p class="intro">In roadmap order, skipping what you have already earned. The missable and watch-window trophies come first when they are still open.</p>`;
  if (!list.length) return out + `<p>All 55 earned. Vice Got a Price! — platinum unlocked.</p>`;
  return out + list.map((x, i) =>
    `<div class="next-row"><div class="rank">${i + 1}</div><div class="body"><b>${gradeBadge(x.t.grade)}${esc(displayName(x.t, state))}</b>` +
    `<div class="why">${esc(x.why)}</div><div class="why">${esc(x.t.description)}</div></div>` +
    `<button data-jump="${x.t.id}">Open guide</button></div>`).join("");
}

export function renderSources(data) {
  let out = `<h2>Sources &amp; method</h2>` +
    `<p class="intro">${esc(data.methodNote)}</p>` +
    `<p class="intro">Every step and every claim in this guide names its source. A claim seen in two or more sources carries a <b>2+</b> mark. Where sources disagree, the dispute is shown in full and our call is stated — see the 9 disputes below.</p>` +
    `<table class="src"><tr><th>#</th><th>Source</th><th>Title</th><th>Read</th><th>What it was used for</th></tr>` +
    data.sources.map((s) => `<tr><td>[${s.n}]</td><td><b>${esc(s.site)}</b></td>` +
      `<td>${s.url ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a>` : esc(s.title)}</td>` +
      `<td>${esc(s.read)}</td><td>${esc(s.note)}</td></tr>`).join("") + `</table>` +
    `<h2 style="margin-top:20px">9 disputes, settled</h2>`;
  for (const d of data.disputes) {
    out += `<div class="dispute"><h3>${d.id} — ${esc(d.q)}</h3>` +
      `<p><b>Position A:</b> ${esc(d.a)}</p><p><b>Position B:</b> ${esc(d.b)}</p>` +
      `<p class="call"><b>Our call:</b> ${esc(d.call)}</p></div>`;
  }
  return out;
}
