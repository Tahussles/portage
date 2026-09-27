# Taha: track status (UI, motion, design)

## Current phase
Round 10: the Portage line hero, then real product shots in the chapters. Next: Step 5 chip row on the roadmap, pitch rehearsal.

## Completed
- Step 1: scaffold, tokens, fonts, i18n, navbar, hero, stub pages (PR #1).
- Step 3b: roadmap canvas, layouts, animated toggle, counter, side panel, warnings (PRs #7, #12); built from `buildPlan` (PR #21).
- Evidence-of-practice beat: critical one at a time; tight on the Portage plan with a dashed rule and ring, plus "What protects your window" steps (PR #24). The SPEP backup line appears once issue #23 lands.
- Step 4b: voice intake on `/start` (PR #20) through the shared client helpers (PR #21).
- Step 6 UI: `/documents` with drop zone, samples, scan line, findings and extracted fields (PR #26).
- Step 7: `/insights` with sourced CNO numbers, Natural Earth province map (`scripts/gen-geo.mjs`, 12 KB) and an illustrative stage funnel.
- Step 8: landing ticker, scroll-scrubbed chapters, three data-driven stats, final CTA, footer; Pexels hero footage (PR #31).
- Demo flow: shared screen nav, next-step links, `?demo=1` kept on links, `?reset=1`, favicon, Open Graph image, 404, copy lint (PR #32).
- README with screenshots of the five screens, `pnpm smoke <baseUrl>`.
- Live at https://portage-navy.vercel.app with real AI (PR #34).
- Intake progress tied to the real request phases (PR #40).
- Hear your plan: deterministic summary, faithful translation, ElevenLabs speech (PR #41).
- docs/DEMO_RUNBOOK.md: checklist, tested warm-up commands, click paths, failure plays.
- `/pitch`: nine-slide deck in the product's design language, keys, speaker notes with a timer, print to PDF, "See it live" and "Back to pitch" (PR #46). Every number comes from the data files, the engine or `src/components/pitch/sources.ts`.
- Hear your plan plays a short version by default (licence, window, first step), with "Full plan · Parcours complet" under the pill.
- Known-good releases: `v1.0-demo` on `8063c17`, `v1.1-demo` on `3fe94e1` (one language at a time), `v1.2-demo` on `5bab52a` (Portage line hero), each after a clean live smoke; the runbook rolls back to v1.2-demo.
- Landing chapters show real product shots in the selected language (`pnpm gen:chapters`), replacing the stock stills.
- Landing hero: "the Portage line" (decision 17) replaces the stock hallway video: still contours from `scripts/gen-topo.mjs` and the roadmap's red route drawn once after the headline; afterwards one dot every 14 s.
- One language at a time (decision 16): the EN/FR toggle decides, a French browser starts in French with no flash of English, `<html lang>`, title and description follow the locale; `one-language.test.ts` guards against pairs.

## Next
- Step 5: editable profile chip row above the roadmap canvas.
- Swap `src/data/insights.provisional.json` for `src/data/insights.json` (issue #27).

## Needs from Ebrahim
- #23: SPEP backup facts on the evidence-of-practice warning.
- #25: profile-based `name_mismatch` is dropped by `/api/doc-check` with the full Priya profile.
- #27: `src/data/insights.json`.
- `public/demo/priya-hi.webm` (native Hindi speaker).

## Blockers
- None. Waiting on the native Hindi recording (#15) and Ebrahim's #35 / #37.

## Last updated
Sat Sep 26, 2026, 11:29 PM
