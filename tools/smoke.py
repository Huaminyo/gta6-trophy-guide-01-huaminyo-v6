#!/usr/bin/env python3
"""12-check Playwright smoke test for Neon Palms (take 8).

Usage: python3 tools/smoke.py --base http://localhost:8103
The dev server must already be running (node serve.ts --port=8103).
"""
import argparse
import sys

from playwright.sync_api import sync_playwright


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://localhost:8103")
    args = ap.parse_args()

    results = []

    def check(name, ok, detail=""):
        results.append((name, ok))
        print(f"{'PASS' if ok else 'FAIL'} {name} {detail}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        errors = []
        external = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        page.on("request", lambda r: external.append(r.url)
                if not r.url.startswith(args.base) else None)

        # 1. Page loads, no JS errors.
        page.goto(args.base + "/", wait_until="networkidle")
        page.wait_for_selector("#trophyList li", timeout=10000)
        check("1. page loads, 0 JS errors", not errors, f"({len(errors)} errors)")

        # 2. 55 trophies listed.
        n = page.locator("#trophyList li").count()
        check("2. 55 trophies in the list", n == 55, f"(got {n})")

        # 3. Checklist toggling updates progress.
        page.locator('input[data-toggle="2"]').click()
        page.wait_for_timeout(300)
        progress = page.locator("#progressBox .big").inner_text()
        check("3. checklist toggle updates progress", progress.startswith("1/55"), f"({progress})")

        # 4. Counter +/- works (#28 has 18 meditations).
        page.locator('#trophyList li[data-id="28"]').click()
        page.wait_for_timeout(300)
        before = page.locator(".counter .num").first.inner_text()
        page.locator('.counter button[data-bump="28|1"]').first.click()
        page.wait_for_timeout(300)
        after = page.locator(".counter .num").first.inner_text()
        check("4. counter + works", before == "0 / 18" and after == "1 / 18", f"({before} -> {after})")

        # 5. Spoiler hiding.
        page.locator("#spoilerToggle").click()
        page.wait_for_timeout(300)
        hidden_text = page.locator("#trophyList").inner_text()
        check("5. spoiler toggle hides story names", "Story trophy (spoiler hidden)" in hidden_text)
        page.locator("#spoilerToggle").click()
        page.wait_for_timeout(300)

        # 6. Search filters the list.
        page.locator("#searchBox").fill("meditation")
        page.wait_for_timeout(300)
        n2 = page.locator("#trophyList li").count()
        names = page.locator("#trophyList").inner_text()
        check("6. search filters", 0 < n2 < 55 and "Positive Mental Attitude" in names, f"({n2} results)")
        page.locator("#searchBox").fill("")
        page.wait_for_timeout(300)

        # 7. View tabs switch.
        ok_tabs = True
        for view in ("roadmap", "missables", "nextup", "sources"):
            page.locator(f'button[data-view="{view}"]').click()
            page.wait_for_timeout(200)
            if not page.locator(f"#view-{view}.active").count():
                ok_tabs = False
        page.locator('button[data-view="checklist"]').click()
        page.wait_for_timeout(200)
        check("7. all view tabs switch", ok_tabs and page.locator("#view-checklist.active").count() == 1)

        # 8. Persistence across reload.
        page.reload(wait_until="networkidle")
        page.wait_for_selector("#trophyList li", timeout=10000)
        progress2 = page.locator("#progressBox .big").inner_text()
        check("8. progress persists across reload", progress2.startswith("1/55"), f"({progress2})")

        # 9. Zero external requests.
        check("9. zero external requests", not external, f"({len(external)} external)")

        # 10. Claims toggle shows cited claims.
        page.locator('#trophyList li[data-id="28"]').click()
        page.wait_for_timeout(300)
        page.locator('button[data-claims="28"]').click()
        page.wait_for_timeout(300)
        claims = page.locator("ul.claims li").count()
        check("10. claims toggle shows claims", claims >= 3, f"({claims} claims for #28)")

        # 11. Demo mode: 18/55 earned, 345 PTS.
        page.goto(args.base + "/?demo=1", wait_until="networkidle")
        page.wait_for_selector("#trophyList li", timeout=10000)
        demo = page.locator("#progressBox .big").inner_text()
        check("11. demo mode 18/55 @ 345 PTS", demo.startswith("18/55") and "345/1,230" in demo, f"({demo})")

        # 12. Roadmap has 7 stages; missables has 7 cards.
        page.locator('button[data-view="roadmap"]').click()
        page.wait_for_timeout(300)
        stages = page.locator("#view-roadmap .card").count()
        page.locator('button[data-view="missables"]').click()
        page.wait_for_timeout(300)
        cards = page.locator("#view-missables .card").count()
        check("12. roadmap 7 stages, missables 7 cards", stages == 7 and cards == 7,
              f"({stages} stages, {cards} cards)")

        browser.close()

    failed = [r for r in results if not r[1]]
    print(f"\n{len(results) - len(failed)}/{len(results)} smoke checks passed")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
