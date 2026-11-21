#!/usr/bin/env python3
"""Verify our 55 trophies against the kit's official list.

Loads both lists programmatically and prints ONLY mismatch counts (plus the
names of any mismatching trophies). Never open the kit list file by hand.
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
KIT_LIST = Path("/home/hatch/workspace/makefun/gta6-trophy-guide-01/"
                "gta6-trophy-guide-01-kit/starter/app/data/trophies.json")


def load_list(path):
    doc = json.loads(Path(path).read_text())
    if isinstance(doc, dict):
        return doc.get("trophies", [])
    return doc


def main() -> int:
    official = load_list(KIT_LIST)
    mine = load_list(ROOT / "app" / "data" / "trophies.json")
    print(f"official: {len(official)} trophies, mine: {len(mine)} trophies")

    by_name_official = {t["name"]: t for t in official}
    by_name_mine = {t["name"]: t for t in mine}

    missing = [n for n in by_name_official if n not in by_name_mine]
    extra = [n for n in by_name_mine if n not in by_name_official]
    desc_mismatch = [n for n in by_name_official if n in by_name_mine
                     and by_name_official[n].get("description") != by_name_mine[n].get("description")]
    grade_mismatch = [n for n in by_name_official if n in by_name_mine
                      and by_name_official[n].get("grade") != by_name_mine[n].get("grade")]

    print(f"missing (in official, not mine): {len(missing)} {missing}")
    print(f"extra (in mine, not official): {len(extra)} {extra}")
    print(f"description mismatches: {len(desc_mismatch)} {desc_mismatch}")
    print(f"grade mismatches: {len(grade_mismatch)} {grade_mismatch}")

    ok = not missing and not extra and not desc_mismatch and not grade_mismatch
    print("RESULT:", "PASS — 55/55 match" if ok else "FAIL")
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
