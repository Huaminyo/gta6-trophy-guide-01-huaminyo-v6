// Neon Palms — entry point. Loads the three data files, then renders.
import { loadState, saveState, demoState, setDemoMode, toggleEarned, bumpCounter, exportJSON, importJSON } from "./tracker.js";
import {
  renderAuditStrip, renderProgress, kindChips, renderList, renderDetail,
  renderCountPane, renderRoadmap, renderMissables, renderNextUp, renderSources,
} from "./views.js";

const filters = { q: "", kind: "", grade: "", earned: "", sort: "roadmap" };
let data = null;
let state = loadState();
let demo = false;

async function loadData() {
  const [t, r, s] = await Promise.all([
    fetch("data/trophies.json").then((x) => x.json()),
    fetch("data/routes.json").then((x) => x.json()),
    fetch("data/sources.json").then((x) => x.json()),
  ]);
  return {
    trophies: t.trophies,
    routes: r.routes,
    sources: s.sources,
    disputes: s.disputes,
    methodNote: s.method_note,
    readDate: s.read_date,
  };
}

function renderAll() {
  document.getElementById("progressBox").innerHTML = renderProgress(data, state);
  document.getElementById("kindChips").innerHTML = kindChips(data, filters);
  document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  document.getElementById("detailPane").innerHTML = renderDetail(data, state);
  document.getElementById("countPane").innerHTML = renderCountPane(data, state);
  document.getElementById("view-roadmap").innerHTML = renderRoadmap(data, state);
  document.getElementById("view-missables").innerHTML = renderMissables(data, state);
  document.getElementById("view-nextup").innerHTML = renderNextUp(data, state);
}

function switchView(name) {
  document.querySelectorAll("#viewTabs button[data-view]").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === name));
  document.querySelectorAll("main .view").forEach((v) =>
    v.classList.toggle("active", v.id === `view-${name}`));
}

function jumpTo(id) {
  state.selected = id;
  saveState(state);
  switchView("checklist");
  renderAll();
  const el = document.querySelector(`#trophyList li[data-id="${id}"]`);
  if (el) el.scrollIntoView({ block: "center" });
}

function wireEvents() {
  document.getElementById("viewTabs").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-view]");
    if (btn) switchView(btn.dataset.view);
  });

  document.getElementById("spoilerToggle").addEventListener("change", (e) => {
    state.spoilers = e.target.checked;
    saveState(state);
    renderAll();
  });

  document.getElementById("exportBtn").addEventListener("click", () => {
    const blob = new Blob([exportJSON(state)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "neon-palms-progress.json";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const imported = importJSON(await file.text());
      state = { ...state, earned: imported.earned, counters: imported.counters };
      saveState(state);
      renderAll();
    } catch {
      alert("That file is not a Neon Palms progress export.");
    }
    e.target.value = "";
  });

  document.getElementById("searchBox").addEventListener("input", (e) => {
    filters.q = e.target.value;
    document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  });

  document.getElementById("kindChips").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-kind]");
    if (!btn) return;
    filters.kind = btn.dataset.kind;
    document.getElementById("kindChips").innerHTML = kindChips(data, filters);
    document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  });

  document.getElementById("gradeFilter").addEventListener("change", (e) => {
    filters.grade = e.target.value;
    document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  });
  document.getElementById("earnedFilter").addEventListener("change", (e) => {
    filters.earned = e.target.value;
    document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  });
  document.getElementById("sortSelect").addEventListener("change", (e) => {
    filters.sort = e.target.value;
    document.getElementById("trophyList").innerHTML = renderList(data, state, filters);
  });

  document.getElementById("trophyList").addEventListener("click", (e) => {
    const chk = e.target.closest("input[data-toggle]");
    if (chk) {
      toggleEarned(state, Number(chk.dataset.toggle));
      renderAll();
      return;
    }
    const li = e.target.closest("li[data-id]");
    if (li) {
      state.selected = Number(li.dataset.id);
      saveState(state);
      renderAll();
    }
  });

  // Delegated clicks for the detail pane, count pane and other views.
  document.getElementById("viewRoot").addEventListener("click", (e) => {
    const jump = e.target.closest("[data-jump]");
    if (jump) { jumpTo(Number(jump.dataset.jump)); return; }
    const bump = e.target.closest("[data-bump]");
    if (bump) {
      const [id, delta] = bump.dataset.bump.split("|");
      const t = data.trophies.find((x) => x.id === Number(id));
      if (t) bumpCounter(state, t, Number(delta));
      renderAll();
      return;
    }
    const tog = e.target.closest("[data-toggle-earned]");
    if (tog) { toggleEarned(state, Number(tog.dataset.toggleEarned)); renderAll(); return; }
    const claims = e.target.closest("[data-claims]");
    if (claims) {
      const id = Number(claims.dataset.claims);
      state.claimsOpen[id] = !state.claimsOpen[id];
      saveState(state);
      document.getElementById("detailPane").innerHTML = renderDetail(data, state);
    }
  });
}

async function main() {
  data = await loadData();
  const params = new URLSearchParams(location.search);
  demo = params.get("demo") === "1";
  if (demo) {
    setDemoMode(true);
    state = demoState(data.trophies);
  }
  document.getElementById("auditStrip").innerHTML = renderAuditStrip(data);
  document.getElementById("view-sources").innerHTML = renderSources(data);
  document.getElementById("spoilerToggle").checked = state.spoilers;
  renderAll();
  wireEvents();
}

main();
