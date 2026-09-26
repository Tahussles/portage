# Taha: track status (UI, motion, design)

## Current phase
Round 3 done: warnings per schedule (PR #12) merged; Step 4b voice intake in review.

## Completed
- Step 1: scaffold, tokens, fonts, i18n, navbar, hero, stub pages (PR #1).
- Round 2 docs sync (PR #5), store ownership (PR #9).
- Step 3b: roadmap canvas, layouts, toggle animation, counter, side panel, warning stack (PR #7).
- Evidence-of-practice beat: warnings evaluated per schedule; critical, tight ("only if each step goes to plan") and "Resolved in the Portage plan" states animate on the toggle; flagged steps get a red ring (PR #12).
- Step 4b: `/start` voice intake (mic orb with live level, MediaRecorder webm/opus or mp4 with WAV fallback, 60 s cap, permission-denied message), native transcript + English translation, editable profile chips into the store, sample voice (Priya), language hint, consent line. Talks to `/api/transcribe` and `/api/profile` and falls back to provisional fixtures (`?demo=1`, 404, failure, timeout).
- Provisional plan refreshed to engine output for data v1.1.0 (school documents step, side lane) plus the per-schedule evidence-of-practice warning.

## Next
- Switch `/roadmap` to `buildPlan(profile, pathway, today)` once issue #13 (per-schedule warning fields) is on main; delete `contract.ts` and `plan-priya.provisional.json`.
- Swap `src/components/intake/intake-api.ts` for Ebrahim's `src/lib/client/api.ts` when it lands.
- Step 7 insights view.

## Needs from Ebrahim
- Issue #13: `schedules`, `severityBySchedule`, `facts` on `PlanWarning`, evaluated per schedule (decision posted there).
- `public/demo/priya-hi.webm` (the sample button uses it when present; until then a HEAD 404 shows in the console).
- `/api/transcribe` and `/api/profile` (Step 4a); the intake already calls them.

## Blockers
- None. Vercel import is a manual step for Taha.

## Last updated
Sat Sep 26, 2026, 4:50 PM
