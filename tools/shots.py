#!/usr/bin/env python3
"""Capture the 4 Playwright screenshots listed in shots.json.

Usage: python3 tools/shots.py --base http://localhost:8103
The dev server must already be running. Each shot must end up under
262,144 bytes; a PNG over the cap is re-saved as JPEG quality 85.
"""
import argparse
import json
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
CAP = 262144


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8103")
    args = ap.parse_args()

    spec = json.loads((ROOT / "shots.json").read_text())
    vp = spec["viewport"]
    shots_dir = ROOT / "screenshots"
    shots_dir.mkdir(exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": vp["width"], "height": vp["height"]})
        for shot in spec["shots"]:
            page.goto(args.base + shot["url"], wait_until="networkidle")
            page.wait_for_timeout(600)
            for action in shot.get("actions", []):
                if "click" in action:
                    page.locator(action["click"]).first.click()
                    page.wait_for_timeout(500)
                elif "scroll" in action:
                    page.locator(action["scroll"]).first.scroll_into_view_if_needed()
                    page.wait_for_timeout(300)
            out = shots_dir / shot["file"]
            page.screenshot(path=str(out))
            size = out.stat().st_size
            if size > CAP:
                from PIL import Image
                jpg = out.with_suffix(".jpg")
                Image.open(out).convert("RGB").save(jpg, "JPEG", quality=85)
                out.unlink()
                size = jpg.stat().st_size
                print(f"{jpg.name}: {size} bytes (converted to JPEG)")
            else:
                print(f"{out.name}: {size} bytes")
            if size > CAP:
                print(f"FAIL: {out.name} still over the {CAP}-byte cap")
                return 1
        browser.close()
    print("all screenshots under the cap")
    return 0


if __name__ == "__main__":
    sys.exit(main())
