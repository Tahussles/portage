# Taha: track status (UI, motion, design)

## Current phase
Round 5 done: landing (Step 8), seamless demo flow, README with screenshots and a smoke test. Next: the roadmap chip row (Step 5) and live checks once the Vercel URL is public.

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

## Next
- Step 5: editable profile chip row above the roadmap canvas.
- Swap `src/data/insights.provisional.json` for `src/data/insights.json` (issue #27).

## Needs from Ebrahim
- #23: SPEP backup facts on the evidence-of-practice warning.
- #25: profile-based `name_mismatch` is dropped by `/api/doc-check` with the full Priya profile.
- #27: `src/data/insights.json`.
- `public/demo/priya-hi.webm` (native Hindi speaker).

## Blockers
- The Vercel deployment is behind Vercel Authentication (every URL redirects to the Vercel login), so judges cannot open it yet. Taha: turn off Deployment Protection for production or share the public domain.

## Last updated
Sat Sep 26, 2026, 6:35 PM
