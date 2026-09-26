# Taha: track status (UI, motion, design)

## Current phase
Step 3b roadmap canvas: built and in review (PR "feat: roadmap canvas (Step 3b)").

## Completed
- Step 1: scaffold, tokens, fonts, i18n, navbar, hero, stub pages (PR #1).
- Round 2 docs sync: coordination protocol, state, plan and persona updates (PR #5).
- Step 3b: `/roadmap` with React Flow canvas, serpentine one-at-a-time layout and parallel timeline (x = start week), GSAP position tween on toggle, licence counter with best/conservative range, side panel (Esc closes), warning stack, week ruler, "While you wait" lane (renders when side nodes exist), topo background (`scripts/gen-topo.mjs`), provisional Priya fixture.

## Next
- Swap `plan-priya.provisional.json` for `buildPlan(profile, pathway, today)` once the engine (PR #6) and the contract PR are on main (TODO in `src/components/roadmap/RoadmapView.tsx`).
- Replace `src/components/roadmap/contract.ts` with imports from `types.ts` when the contract PR lands.
- Step 4b intake screen.

## Needs from Ebrahim
- `feat(contract): add schedule ranges and side lane` in `src/lib/engine/types.ts`: `Lane`, `ScheduleRange`, `range` on both schedules, `Plan.side`.
- Side-lane nodes in on-rn-ien.json with `lane: "side"` (Temporary Class, bridge roles, support organizations).
- Engine fixture `plan-priya.json` uses last practised 2025-07; decision 11 says July 2024.

## Blockers
- None. Vercel import is a manual step for Taha.

## Last updated
Sat Sep 26, 2026, 3:50 PM
