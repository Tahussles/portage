# Taha: track status (UI, motion, design)

## Current phase
Round 4 done: tight state, documents page and insights page merged. Next: polish (Step 8) and the roadmap chip row (Step 5).

## Completed
- Step 1: scaffold, tokens, fonts, i18n, navbar, hero, stub pages (PR #1).
- Step 3b: roadmap canvas, layouts, animated toggle, counter, side panel, warnings (PRs #7, #12); built from `buildPlan` (PR #21).
- Evidence-of-practice beat: critical one at a time; tight on the Portage plan with a dashed rule and ring, plus "What protects your window" steps (PR #24). The SPEP backup line appears once issue #23 lands.
- Step 4b: voice intake on `/start` (PR #20) through the shared client helpers (PR #21).
- Step 6 UI: `/documents` with drop zone, samples, scan line, findings and extracted fields (PR #26).
- Step 7: `/insights` with sourced CNO numbers, Natural Earth province map (`scripts/gen-geo.mjs`, 12 KB) and an illustrative stage funnel.

## Next
- Step 5: editable profile chip row above the roadmap canvas.
- Step 8 polish: landing chapters, ticker, final CTA, 404, favicon, Open Graph image.
- Swap `src/data/insights.provisional.json` for `src/data/insights.json` (issue #27).

## Needs from Ebrahim
- #23: SPEP backup facts on the evidence-of-practice warning.
- #25: profile-based `name_mismatch` is dropped by `/api/doc-check` with the full Priya profile.
- #27: `src/data/insights.json`.
- `public/demo/priya-hi.webm` (native Hindi speaker).

## Blockers
- None. Vercel import and keys are Taha's manual steps (issue #15).

## Last updated
Sat Sep 26, 2026, 5:25 PM
