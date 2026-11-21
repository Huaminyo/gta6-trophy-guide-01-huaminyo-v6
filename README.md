[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v6/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Huaminyo/gta6-trophy-guide-01-huaminyo-v6/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01)

# Neon Palms — GTA VI Trophy Guide & Tracker

A complete, fully cited PlayStation 5 trophy guide for Grand Theft Auto VI,
built for the [gta6-trophy-guide-01 bounty](https://make.fun/bounty/gta6-trophy-guide-01)
on make.fun. Open `app/index.html` in a browser, or run `node serve.ts` and
visit http://localhost:8103/.

## What it covers

- **55/55 trophies** — every name, description and grade checked against the
  official list (Exophase and PSNProfiles agree on all of them).
- **160/160 steps cited** — every guide step names at least one source.
- **407/407 claims cited** — each step is split into individually cited
  facts; 83 claims are backed by 2 or more sources.
- **15 sources, 9 disputes** — where sources disagree, both positions are
  shown and our call is stated in the open.
- **29 counters** — every count-based trophy gets a +/- tracker with a
  suggested 3-stage route for the 15 biggest grinds.
- **1 possible missable** — the Chapter 1 balcony meditation, flagged loudly,
  plus 5 watch-window stranger chains.
- **0 online trophies** — the whole list is single-player.
- **1,230 PSN points** — 1 platinum (180), 2 gold (90), 6 silver (30),
  46 bronze (15).

## How to use it

The checklist view is a dense 3-pane layout: the trophy list on the left
(search, kind/grade/earned filters, sort), the full guide in the middle
(steps, cited claims, counter, route, dispute box, sources), and your
personal count on the right (progress, PSN points, roadmap stages, all 29
counters, next-up). The Roadmap view plans the run in 7 stages; Missables
covers the one confirmed missable window plus the watch list; Next Up shows
your next 10 trophies in roadmap order; Sources & Method lists every source
and settles every dispute.

Progress saves in your browser (localStorage) and can be exported or
imported as JSON. A spoiler setting hides story trophy names until you earn
them. Add `?demo=1` to load a half-finished run (18/55 earned, 345 PTS).

## Method

PowerPyx's trophy guide was read in full on 20 November 2026; fourteen
further guides were read as published excerpts the same day. Every claim in
this guide names the source it came from. Trophy names and descriptions are
quoted as PlayStation publishes them; all guide text is written in our own
words. No Rockstar artwork is used.

## Verify it yourself

```sh
python3 tools/audit.py                # all audit counts (55/55, 160/160, 407 claims, ...)
python3 tools/verify_official_list.py # 55/55 names/descriptions/grades vs the kit list
node serve.ts --port=8103             # serve the app
python3 tools/smoke.py --base http://localhost:8103   # 12-check browser smoke test
python3 tools/shots.py --base http://localhost:8103    # the 4 screenshots
node main.ts out && node main.ts out2 && diff out/dossier.json out2/dossier.json  # deterministic dossier
```

## License

MIT. Neon Palms is an unofficial fan guide; Grand Theft Auto and GTA are
trademarks of Take-Two Interactive.
