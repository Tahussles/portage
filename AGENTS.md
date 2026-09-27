# AGENTS.md: Rules for anyone (human or AI) writing code in this repo

Read `PLAN.md` first. Then read the section of `PLAN.md` for the step you were given. Do **only** that step. When done, stop and report what changed, what to verify, and what is left.

## Product in one line
Portage builds a personal, cited, deadline-aware licensing roadmap for internationally educated professionals. v1: internationally educated nurses becoming RNs in Ontario (College of Nurses of Ontario, CNO).

## Stack (do not add to this without asking)
- Next.js (App Router, TypeScript strict, `src/` directory), React 19
- Tailwind CSS v4 (tokens in `src/app/globals.css`)
- GSAP + `@gsap/react` (`useGSAP`), ScrollTrigger, Flip
- `@xyflow/react` (React Flow v12) for the roadmap canvas
- `zustand` for client state, `zod` for every external boundary
- `@anthropic-ai/sdk` (server only), ElevenLabs REST (server only, `fetch`)
- `vitest` for tests
- `lucide-react` icons, `clsx` + `tailwind-merge`
- Package manager: pnpm. Hosting: Vercel.

## Directory map
```
src/
  app/
    page.tsx                 landing
    start/page.tsx           voice intake
    roadmap/page.tsx         roadmap canvas
    documents/page.tsx       document pre-check
    insights/page.tsx        government view
    api/transcribe/route.ts
    api/profile/route.ts
    api/doc-check/route.ts
    api/speak/route.ts       (COULD)
    globals.css
    layout.tsx
  components/{landing,intake,roadmap,documents,insights,ui}/
  lib/
    engine/                  PURE TypeScript. No React, no fetch, no Date.now().
      types.ts schema.ts applicability.ts schedule.ts warnings.ts docRules.ts plan.ts
      engine.test.ts
    ai/        anthropic.ts prompts.ts tools.ts
    voice/     elevenlabs.ts
    i18n/      en.json fr.json index.ts (useT hook)
    store.ts   zustand store (profile, plan, locale, demoMode)
    demo.ts    demo-mode detection + fixture loader
  data/
    pathways/on-rn-ien.json
    fixtures/  transcript-priya.json profile-priya.json plan-priya.json doccheck-*.json
    insights-illustrative.json
public/
  video/  (compressed mp4 loops + posters)
  geo/canada-provinces.json
  topo.svg
  demo/priya-hi.webm  demo/docs/*.png|pdf
```

## Hard rules
1. **Secrets.** API keys live only in server route handlers via `process.env`. Never prefix a secret with `NEXT_PUBLIC_`. Never commit `.env*` (except `.env.example`).
2. **Git history.** Commits are authored by the human teammates only. No `Co-Authored-By` lines, no "Generated with" lines, no AI names in author, committer, or message. The `.githooks/commit-msg` hook enforces this; install it with `git config core.hooksPath .githooks`. If you use an AI coding tool, disable its commit attribution setting as well.
3. **Never invent pathway facts.** Requirements, fees, processing times and rules come only from `src/data/pathways/*.json`, which cites official sources. The LLM never generates requirements. If data is missing, show "Not yet verified" and a link to the regulator.
4. **Engine purity.** `src/lib/engine/**` is deterministic and fully unit-testable. `today` is always a parameter.
5. **Every AI call is zod-validated and has a fixture fallback** (see `src/lib/demo.ts`). A failed or slow call must never break the UI.
6. **No credential handling.** Portage never asks for, stores, or uses a regulator login. Never build anything that submits to a regulator.
7. **No personal data persistence.** No database, no analytics that capture profile content, no localStorage of transcripts or documents.
8. **Bilingual, one language at a time.** Every user-visible string goes through `useT()` with keys in both `en.json` and `fr.json`; the screen shows only the selected language, never an "English · Français" pair (`one-language.test.ts` checks this). If you do not know the French, add the key with the English text and a `// TODO fr` note in `PROJECT_STATE.md`, never hardcode.
9. **Canadian spelling** in English UI: licence (noun), license (verb), practise (verb), practice (noun), centre, colour, programme is NOT used (use program).
10. **Design language.** Follow `docs/DESIGN.md`. Red (`--accent`) is rare: primary CTA, critical path, logo mark, warnings. Nothing else.
11. **Motion accessibility.** Every GSAP animation checks `prefers-reduced-motion` and degrades to instant state changes.
12. **Honesty labels.** Illustrative data shows the "Illustrative data" badge. Estimates show the "Estimate" badge. Sample documents are watermarked.
13. **No em dashes in UI copy.** Use commas, colons, or periods.

## Conventions
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `style:`.
- Components: PascalCase files, one component per file, props typed, no default exports except Next.js pages/layouts.
- Client components declare `"use client"` at the top; keep API calls in `src/lib/client/api.ts` helpers.
- Tailwind classes ordered: layout, spacing, typography, colour, effects.
- Server route handlers: `export const runtime = "nodejs"`; explicit `maxDuration` where needed; always return JSON `{ ok: boolean, data?, error?, fallback?: boolean }`.

## Definition of done (every step)
- [ ] Acceptance criteria for the step in `PLAN.md` all ticked
- [ ] `pnpm build` passes; `pnpm test` passes
- [ ] Works on the deployed Vercel URL, not just localhost
- [ ] Reduced motion checked
- [ ] Strings in both locales
- [ ] `PROJECT_STATE.md` updated (status, decisions, open issues)
- [ ] Merged to `main`

## Coordination (two independent tracks)
Taha and Ebrahim build in parallel, each with their own coding agent. The repo is the only channel between the tracks.

**Ownership** (only the owner edits these; ask through an issue otherwise):
- Taha: `PROJECT_STATE.md`, `PLAN.md`, `AGENTS.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `src/components/`, page files (`src/app/**/page.tsx`, `layout.tsx`), `src/app/globals.css`, `src/lib/i18n/`, `src/lib/store.ts` (UI state), `scripts/gen-topo.*`, `*.provisional.json` fixtures, `docs/status/taha.md`.
- Taha also owns the text-to-speech feature's new files: `src/app/api/speak/route.ts`, `src/lib/speak/**`, `src/components/speak/**`.
- Taha also owns the in-app pitch deck: `src/app/pitch/**`, `src/components/pitch/**`.
- Ebrahim: `src/lib/engine/`, `src/lib/ai/`, `src/lib/voice/`, `src/lib/demo.ts`, `src/lib/client/api.ts`, `src/app/api/` (except `api/speak`), `src/data/` (except `*.provisional.json`), `public/demo/**`, `docs/PATHWAY_VERIFIED.md`, `docs/pitch/**`, `docs/devpost.md`, `docs/status/ebrahim.md`.

**Rules**
- Each person merges their own PRs, after `attribution-guard` passes. Never merge or block the other person's PR.
- Contract changes (`src/lib/engine/types.ts`, API request/response shapes) are additive only and go in their own `feat(contract):` PR.
- Requests across tracks are GitHub issues: label `contract` for Ebrahim, `needs-taha` for Taha. Open the issue and keep working against a provisional fixture; do not wait.
- Live per-track status: `docs/status/taha.md` and `docs/status/ebrahim.md` (Current phase, Completed, Next, Needs from the other track, Blockers, Last updated). Update yours in every PR.
- Read the other track's progress from the repo only: its status file, `gh pr list --state all`, `gh issue list`, `git log`.

## Attribution guards (why commits can only ever show Taha and Ebrahim)
Four layers, all already in place:
1. `.githooks/pre-commit`: author and committer email must be listed in `.github/allowed-authors.txt`.
2. `.githooks/commit-msg`: strips known assistant footers automatically, then rejects any message that still names an AI assistant, and rejects co-author trailers for anyone not on the allowlist.
3. Each machine's coding-agent settings (installed by the private setup kit, never committed): attribution disabled, plus a pre-tool hook that blocks `--no-verify`, `--author`, identity changes, force-pushes, and attribution text.
4. `.github/workflows/attribution-guard.yml`: re-checks every commit on every push and PR, server-side, so nothing slips through even if a local hook is skipped.

Rules for agents: never skip hooks, never change git config, never force-push, never add trailers. If a hook rejects your commit, rewrite the message and try again.
Before submission, run the private `verify-history.sh`; it must print "Clean".
