#!/usr/bin/env python3
"""Audit the take-8 trophy data against every number in SPEC-TAKE8."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "app" / "data"

POINTS = {"platinum": 180, "gold": 90, "silver": 30, "bronze": 15}


def main() -> int:
    doc = json.loads((DATA / "trophies.json").read_text())
    trophies = doc["trophies"]
    routes = json.loads((DATA / "routes.json").read_text())["routes"]
    sources_doc = json.loads((DATA / "sources.json").read_text())
    sources = sources_doc["sources"]
    disputes = sources_doc["disputes"]

    checks = []

    def check(name, got, want):
        ok = got == want
        checks.append((name, got, want, ok))
        print(f"{'PASS' if ok else 'FAIL'} {name}: got {got}, want {want}")

    check("meta.counts entries", len(doc.get("meta", {}).get("counts", {})), 27)
    counts = doc.get("meta", {}).get("counts", {})
    check("meta meditations=18, stunts=397, target_decks=15",
          (counts.get("meditations"), counts.get("stunts"), counts.get("target_decks")),
          (18, 397, 15))
    check("counters have countLabel+countUnit",
          all(t["countLabel"] and t["countUnit"] for t in trophies if t["count"] is not None), True)
    check("non-counters have null countLabel+countUnit",
          all(t["countLabel"] is None and t["countUnit"] is None for t in trophies if t["count"] is None), True)
    check("trophies", len(trophies), 55)
    check("guides non-blank", sum(1 for t in trophies if t["guide"].strip()), 55)
    check("guides cited", sum(1 for t in trophies if t["sources"]), 55)
    steps = [s for t in trophies for s in t["steps"]]
    check("steps", len(steps), 160)
    check("steps cited", sum(1 for s in steps if s["s"]), 160)
    claims = [c for t in trophies for c in t["claims"]]
    check("claims total >= 400", len(claims) >= 400, True)
    print(f"INFO claims total: {len(claims)}")
    check("claims cited", sum(1 for c in claims if c["s"]), len(claims))
    backed_claims = sum(1 for c in claims if len(c["s"]) >= 2)
    print(f"INFO claims backed 2+: {backed_claims}")
    backed = sum(1 for t in trophies if len(t["sources"]) == 2 and len(t["steps"]) >= 2)
    check("backed 2+ (exactly-2 sources, >=2 steps)", backed, 32)
    check("sources", len(sources), 15)
    check("disputes", len(disputes), 9)
    check("trackers (non-null count)", sum(1 for t in trophies if t["count"] is not None), 29)
    check("hidden", sum(1 for t in trophies if t["hidden"]), 28)
    grades = {}
    for t in trophies:
        grades[t["grade"]] = grades.get(t["grade"], 0) + 1
    check("grades platinum/gold/silver/bronze",
          (grades.get("platinum", 0), grades.get("gold", 0), grades.get("silver", 0), grades.get("bronze", 0)),
          (1, 2, 6, 46))
    check("PSN total", sum(POINTS[t["grade"]] for t in trophies), 1230)
    phase1 = [t for t in trophies if t["phase"] == 1]
    check("phase-1 trophies", len(phase1), 19)
    check("phase-1 points", sum(POINTS[t["grade"]] for t in phase1), 360)
    demo = [t for t in phase1 if t["missable"] == "none"]
    check("demo earned (phase-1, missable none)", len(demo), 18)
    check("demo points", sum(POINTS[t["grade"]] for t in demo), 345)
    check("online trophies", sum(1 for t in trophies if t["kind"] == "online"), 0)
    check("possibly missable", sum(1 for t in trophies if t["missable"] == "possible"), 1)
    check("missable id", [t["id"] for t in trophies if t["missable"] == "possible"], [28])
    check("watch count", sum(1 for t in trophies if t["missable"] == "watch"), 5)
    check("routes", len(routes), 15)
    check("route stages all 3", all(len(r["stages"]) == 3 for r in routes), True)
    check("route stage sums", all(sum(s["n"] for s in r["stages"]) == r["count"] for r in routes), True)
    # Every claim/step source id must exist in sources.
    known = {s["n"] for s in sources}
    bad_refs = [c for c in claims if any(x not in known for x in c["s"])]
    check("claim source refs valid", len(bad_refs), 0)
    bad_step_refs = [s for s in steps if any(x not in known for x in s["s"])]
    check("step source refs valid", len(bad_step_refs), 0)
    bad_guide_refs = [t for t in trophies if any(x not in known for x in t["sources"])]
    check("guide source refs valid", len(bad_guide_refs), 0)
    # Every dispute id referenced by a trophy must exist.
    known_disputes = {d["id"] for d in disputes}
    bad_disputes = [t for t in trophies if t["dispute"] and t["dispute"] not in known_disputes]
    check("trophy dispute refs valid", len(bad_disputes), 0)
    # The 7 roadmap stages in views.js must partition all 55 trophy ids.
    import re
    views = (ROOT / "app" / "views.js").read_text()
    stage_ids = [int(x) for m in re.findall(r"ids:\s*\[([0-9,\s]+)\]", views)
                 for x in m.split(",") if x.strip()]
    check("roadmap stages partition 55 ids", sorted(stage_ids), list(range(1, 56)))
    # Every route must match exactly one counter trophy by (count, unit).
    for r in routes:
        matches = [t for t in trophies if t["count"] == r["count"] and t["countUnit"] == r["unit"]]
        if len(matches) != 1:
            check(f"route {r['count']} {r['unit']} matches one trophy", len(matches), 1)
    check("all 15 routes match one trophy",
          all(len([t for t in trophies if t["count"] == r["count"] and t["countUnit"] == r["unit"]]) == 1
              for r in routes), True)

    failed = [c for c in checks if not c[3]]
    print(f"\n{len(checks) - len(failed)}/{len(checks)} checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
