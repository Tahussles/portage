# PORTAGE: Master Build Plan

> Carry your career across. / Emportez votre carrière avec vous.

Ascendance Foundry Hackathon, Waterloo (QNC), Sept 26 to 27, 2026.
Hard deadline: builds submitted **Sunday 12:00 PM**. Industry panel 1:00 PM. Pitch to judges **2:00 PM**.
Our internal submit target: **Sunday 11:00 AM** (one full hour of buffer, non-negotiable).

Read order for any human or coding agent joining: `PLAN.md` > `AGENTS.md` > `PROJECT_STATE.md` > `docs/ARCHITECTURE.md` > `docs/DESIGN.md` > `docs/PATHWAY_ON_RN_IEN.md`.

---

## 0. North star

**One sentence:** Portage turns the licensing maze for internationally educated professionals into a personal, cited, deadline-aware roadmap, starting with internationally educated nurses in Ontario.

**The moment that wins the room:** Priya speaks to Portage in Hindi. Her licensing roadmap assembles itself on a map-like canvas. The critical path glows red. She taps "Plan in parallel" and the steps slide into side-by-side lanes while the "earliest licence date" counter ticks down by months. Then Portage warns her that her evidence of practice expires before her plan finishes, and shows the fix.

**What the judges score (from Devpost):**
1. Relevance to theme (national competitiveness, government efficiency, productivity)
2. Viability (real-world potential, plausible path to impact)
3. Presentation and pitch quality (VC-style panel)

Nothing on the rubric scores technical difficulty. Every hour we spend must improve the demo, the credibility, or the pitch.

**Why now (cite these, they are real):**
- July 16, 2026: federal, provincial and territorial labour ministers (FLMM, Halifax) agreed to work together to get internationally trained professionals into the workforce faster, including creating a digital platform that simplifies credential recognition, with recommendations to ministers by Fall 2026. Source: immigcanada.com, July 23, 2026.
- ESDC's Foreign Credential Recognition Program: 58 agreements, roughly 32,000 internationally trained professionals supported this year. Source: CIC News, April 8, 2026.
- CNO's own guidance: registration for nurses educated outside Canada takes approximately 12 months as a guideline, with nine separate requirements. Source: cno.org, Outside Canada registration guide.

**Pitch hook:** "Ministers asked for this platform this fall. We built the prototype this weekend."

---

## 1. Scope (MoSCoW). This is a contract.

### MUST (the demo does not exist without these)
- M1. Landing hero in the Architex design language, Canadian edition, bilingual navbar toggle (EN/FR).
- M2. Pathway data for **one** profession, fully sourced: Internationally Educated Nurse to RN in Ontario (CNO).
- M3. Deterministic pathway engine: applicability rules, one-at-a-time total vs critical-path (parallel) total, deadline warnings. Unit tested.
- M4. Roadmap canvas (React Flow): nodes animate in, critical path in red, **parallel toggle with animated re-layout and counter**, node side panel with official source link.
- M5. Voice intake: record in any language, ElevenLabs Scribe transcription, Claude extracts a structured profile, English translation shown.
- M6. Demo mode: every AI call has a fixture fallback so the live demo cannot die on venue wifi.
- M7. Deployed on Vercel, public GitHub repo, everything merged to `main`.
- M8. 5-minute demo video and pitch deck.

### SHOULD (big credibility gains, build after MUST is green)
- S1. Document pre-check: upload a document, Claude extracts fields, deterministic CNO rules flag problems (name mismatch, translation needed, criminal record check too old, document must come directly from source).
- S2. Government insights view: "Where Canada's talent gets stuck", dark map of Canada plus stage funnel. Clearly labelled **Illustrative data** unless we source real numbers.
- S3. Landing scroll chapters: Speak / Parlez, Map / Tracez, Prepare / Préparez, Practise / Exercez, with national ticker.

### COULD (only if ahead of schedule at Gate 4)
- C1. ElevenLabs text-to-speech: Portage reads the plan summary back in the user's language.
- C2. Second profession (P.Eng via PEO) to prove the data model generalizes.
- C3. Follow-up question loop in intake (Portage asks for missing fields by voice).
- C4. Export roadmap as PDF.

### WON'T (explicitly out of scope, do not get dragged in)
- Accounts, auth, databases, persistence of personal data.
- Anything that logs into, submits to, or impersonates the user at CNO or any regulator. (CNO explicitly warns applicants never to let a third party sign in or submit on their behalf. This is a product principle, not just a scope cut.)
- Immigration advice of any kind. We only cover professional licensing. "Authorization to work" is a yes/no/unsure input, nothing more.
- Paid features for individuals. Portage is free for newcomers, always.

---

## 2. Timeline with gates

Assumed build start: **Saturday 6:00 PM**. If you start later, shift every block and apply the cut rules at each gate. Gates are hard checkpoints: at each one, both builders stop, demo to each other on the deployed URL, update `PROJECT_STATE.md`, and decide cut or continue. Max 10 minutes per gate.

| Clock (Sat to Sun) | Builder A (logic, data, AI) | Builder B (UI, motion, design) |
|---|---|---|
| 6:00 to 7:30 PM | Step 2: pathway JSON v1 from `docs/PATHWAY_ON_RN_IEN.md`, types | Step 1: scaffold, tokens, fonts, i18n, `.githooks`, Vercel deploy, landing hero |
| **7:30 PM Gate 1** | Pathway JSON validates against schema | Hero live on Vercel URL, EN/FR toggle works |
| 7:30 to 10:30 PM | Step 3a: engine (applicability, CPM, warnings) + golden tests | Step 3b: roadmap canvas from engine output (use fixture profile) |
| **10:30 PM Gate 2** | 3 persona golden tests pass | Roadmap renders; parallel toggle animates; side panel opens |
| 10:30 PM to 1:30 AM | Step 4a: `/api/transcribe`, `/api/profile`, fixtures, demo mode | Step 4b: intake screen (orb, live transcript, translation) |
| **1:30 AM Gate 3** | Speak in Hindi on deployed URL, get a roadmap. Demo mode works with wifi off | Same, verified on a phone |
| 1:30 to 4:00 AM | Step 6: `/api/doc-check` + rules | Step 7: insights view (map + funnel) |
| 4:00 to 5:30 AM | Sleep (A) | Step 8: landing chapters, ticker, polish |
| 5:30 to 7:00 AM | Step 8: FR strings, bug bash, reduced motion | Sleep (B) |
| **8:00 AM Gate 4: FEATURE FREEZE** | Only bug fixes after this. No exceptions. | |
| 8:00 to 9:30 AM | Record demo video (3 takes minimum), edit, upload unlisted | Pitch deck |
| 9:30 to 10:30 AM | Rehearse pitch x3 with timer, Q&A drill (section 7) | |
| 10:30 to 11:00 AM | Submission checklist (section 9) | |
| 11:00 AM to 12:00 PM | Buffer. If unused, rehearse again. | |

Dinner and snacks happen at the keyboard. Sync every gate, plus a 5-minute check-in at midnight and 3:00 AM.

### Cut rules (apply at the gate where the trigger fires)
Cut in this order, top first:
1. C1 to C4 (all COULD items)
2. S2 map shading becomes a simple horizontal bar funnel
3. S1 reduced to one document type (criminal record check date rule + name mismatch)
4. S3 chapter videos become still images; keep the ticker
5. Parallel re-layout animation (GSAP Flip) becomes a crossfade between two layouts
6. French translation limited to navbar, hero, and roadmap labels

**Never cut:** M3 engine correctness, M4 roadmap with the toggle, M5 or its demo-mode fixture, M6, M7, honest labelling.

---

## 3. Team operating model

- **Contract first.** Before Step 3, A and B agree on `src/lib/engine/types.ts` (the `Profile`, `PathwayNode`, `Plan` types). B builds against `src/data/fixtures/plan-priya.json` so B never waits on A.
- **One owner per file area.** A owns `src/lib/**`, `src/app/api/**`, `src/data/**`. B owns `src/components/**`, `src/app/(pages)`, `public/**`, `docs/DESIGN.md`. Shared: `src/lib/i18n/*.json` (append-only, merge conflicts are easy).
- **Branches:** short-lived `feat/<thing>` branches, merged to `main` at every gate. Never more than 3 hours unmerged. `main` must always deploy.
- **Commits:** conventional commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`). Human authors only. No AI attribution trailers of any kind (enforced by `.githooks/commit-msg`, see `AGENTS.md`).
- **Coding agents:** point them at `AGENTS.md` first, then the specific step section below. Give them one step at a time with its acceptance criteria. Review every diff before merging.

---

## 4. Build steps

Each step: owner, deliverables, acceptance criteria (AC), timebox, fallback if it overruns.

### Step 1: Scaffold (B, 90 min)
Deliverables:
- Next.js (App Router, TypeScript, `src/` dir), Tailwind v4, `gsap` + `@gsap/react`, `@xyflow/react`, `zustand`, `zod`, `@anthropic-ai/sdk`, `lucide-react`, `clsx`, `tailwind-merge`, `vitest`.
- `.gitignore` with `.env*` except `.env.example`, committed in the **first** commit.
- Git guards active on both machines (`.githooks/pre-commit`, `.githooks/commit-msg`, via the private setup kit) and `attribution-guard` Action green on GitHub.
- Design tokens in `src/app/globals.css` per `docs/DESIGN.md`. Space Grotesk + Inter via `next/font/google`.
- Tiny i18n: `src/lib/i18n/{en,fr}.json`, `useT()` hook, locale in zustand, `?lang=fr` supported.
- Navbar (logo, EN/FR toggle, "Start" pill) and landing hero (video background, two-tone headline, GSAP rise-in).
- Vercel project linked, env vars set (even if unused yet).

AC:
- [ ] Deployed URL shows the hero with video, headline animates in, toggle swaps EN/FR instantly.
- [ ] `git log` shows only Taha and Ebrahim; a test commit with an assistant co-author trailer comes out clean (stripped) and an unknown author is rejected; `attribution-guard` Action is green.
- [ ] No `.env` in the repo history. `git ls-files | grep -i env` returns only `.env.example`.
- [ ] Lighthouse performance on hero is not catastrophic (video under 4 MB, poster image set).

Fallback: if video causes trouble, use a grayscale still image with a slow CSS scale (Ken Burns). Ship it and move on.

### Step 2: Pathway data (A, 90 min, overlaps Step 1)
Deliverables:
- `src/data/pathways/on-rn-ien.json` built from `docs/PATHWAY_ON_RN_IEN.md`, validated by a zod schema in `src/lib/engine/schema.ts`.
- Every node has `sources[]` with official URLs. Every duration is tagged `kind: "official"` (CNO processing times) or `kind: "estimate"` (applicant-side time, with a note on where the estimate came from).
- Fill the VERIFY items in the pathway doc that block the demo (fees, TTP course length, ECA provider times). Anything still unverified is shown in the UI with an "estimate" badge.

AC:
- [ ] `pnpm test` includes a schema test that loads the JSON and passes.
- [ ] Zero nodes without a source URL.
- [ ] Zero durations without a `kind`.

Fallback: if a duration cannot be sourced in 10 minutes, mark it estimate with a conservative range and move on. Do not stall the whole team on one number.

### Step 3a: Engine (A, 3 h)
Deliverables in `src/lib/engine/`:
- `applicability.ts`: given `Profile`, decide per node: `done`, `todo`, `not_applicable`, `blocked` (with reason).
- `schedule.ts`: topological sort; **one-at-a-time total** (sum of typical durations of `todo` nodes in dependency order); **parallel total** via critical path method (earliest start / earliest finish, longest path); per-node earliest start week; critical path node ids.
- `warnings.ts`: deadline rules (see pathway doc section 4): evidence of practice 3-year window vs projected finish; criminal record check 6-month validity (schedule it late); 2-year application window; documents that must come directly from the source.
- `plan.ts`: `buildPlan(profile, pathway, today) => Plan`.
- Golden tests for 3 personas in `engine.test.ts` (see `docs/ARCHITECTURE.md` section 6).

AC:
- [ ] Golden tests pass for Priya, Marco, Amina.
- [ ] Parallel total is never greater than one-at-a-time total (property test over random profiles).
- [ ] Engine is pure: no network, no Date.now() inside (today is an argument).
- [ ] Engine output for Priya is in a plausible range against CNO's ~12 month guideline. If wildly off, the data is wrong, fix the data.

Fallback: drop the random property test; keep the 3 golden tests.

### Step 3b: Roadmap canvas (B, 3 h)
Deliverables in `src/components/roadmap/`:
- React Flow canvas, custom `StepNode`, custom animated edge, topographic SVG background (not the dot grid).
- Two layouts from engine data: `sequential` (single meandering route) and `parallel` (x axis equals earliest start week, lanes for concurrent steps). Parallel mode is literally a timeline.
- Toggle "One at a time" / "Portage plan" (FR: "Une étape à la fois" / "Plan Portage").
- Counter: "Earliest licence" month and year, tweens between totals.
- Side panel on node click: title, what to do, who acts (you / CNO / third party), official processing time vs estimate badge, cost, source links, and warnings.
- Warning banner component for deadline warnings.

AC:
- [ ] Nodes animate in with stagger on first render.
- [ ] Critical path edges are red and animated; others stone.
- [ ] Toggle animates positions (GSAP Flip or React Flow node position tween) and the counter changes.
- [ ] Keyboard: toggle reachable with Tab, side panel closes with Esc.
- [ ] `prefers-reduced-motion`: no tweens, instant swap.

Fallback: crossfade between two pre-computed layouts instead of animating positions.

### Step 4a: AI routes (A, 3 h)
Deliverables (contracts in `docs/ARCHITECTURE.md` section 5):
- `POST /api/transcribe` (ElevenLabs Scribe, server-side key).
- `POST /api/profile` (Claude, forced tool use, zod-validated output).
- Fixtures in `src/data/fixtures/` and demo-mode fallback (`?demo=1` or any upstream failure or timeout).
- Pre-recorded demo audio `public/demo/priya-hi.webm` (native Hindi speaker preferred; see section 8).

AC:
- [ ] Real Hindi audio on the deployed URL returns a correct profile.
- [ ] Wifi off (or `?demo=1`): same flow completes from fixtures in under 3 s.
- [ ] Malformed model output never crashes the UI (zod failure falls back to fixture and logs).
- [ ] API keys never reach the client bundle (grep the build output).

### Step 4b: Intake screen (B, 3 h)
- Full-screen dark page, one large mic orb reacting to input volume (Web Audio `AnalyserNode`), states: idle, listening, thinking, done.
- Live transcript in large type after transcription, English translation fading in beneath.
- Language hint picker (optional, defaults to auto-detect).
- Consent line: what is sent to ElevenLabs and Anthropic, and that nothing is stored.
- "Use sample voice (Priya)" button that plays the demo clip through the same pipeline. This is also our judge-proof path.

AC:
- [ ] Works on Chrome desktop and iOS Safari (MediaRecorder mime differences handled).
- [ ] Mic permission denied shows a graceful message and the sample button.

### Step 5: Wire intake to roadmap (A+B, 45 min, inside Gate 3 block)
- Profile goes into zustand; `/roadmap` builds the plan client-side from the profile via the engine.
- A "Your profile" chip row above the canvas shows extracted facts; tapping one lets the user correct it and the plan recomputes instantly. (This is the "human stays in control" beat for the pitch.)

AC:
- [ ] Editing "last practised" date in the chip changes the evidence-of-practice warning live.

### Step 6: Document pre-check (A, 2.5 h) [SHOULD]
- `POST /api/doc-check` with a PDF or image. Claude extracts `{ docType, nameOnDocument, issueDate, language, issuer }`. Rules in `src/lib/engine/docRules.ts` produce findings.
- Rules (all from CNO's Outside Canada guide): name differs from profile name (needs legal name change document); language not English/French (needs accredited translation sent directly to CNO); criminal record check older than 6 months at planned submission (get a new one later); employment verification or registration verification uploaded by the user (must be sent directly by the source, not by you).
- UI: drop zone, scan-line sweep, findings list with ticks and red flags.
- Synthetic sample documents in `public/demo/docs/` clearly watermarked "SAMPLE / EXEMPLE".

### Step 7: Insights view (B, 2.5 h) [SHOULD]
- Dark map of Canada (simplified Natural Earth admin-1, public domain) with Ontario live and other provinces dimmed "Coming soon".
- Stage funnel: where applicants stall across the nine requirements.
- **Label: "Illustrative data" badge, always visible**, unless A sources real aggregate numbers from CNO Applicant Statistics in time (see pathway doc VERIFY list). Never present illustrative numbers as real to an MP.

### Step 8: Landing chapters and polish (B then A)
- Scroll chapters with GSAP ScrollTrigger scrub, national ticker, final CTA.
- French strings pass, Canadian spelling pass (licence noun, practise verb, centre, colour).
- Bug bash on phone and laptop, reduced-motion pass, 404 page, favicon, Open Graph image.

### Step 9: Ship (both)
See section 9 checklist.

---

## 5. Demo script (video, max 5:00)

| Time | Screen | Voiceover beat |
|---|---|---|
| 0:00 to 0:20 | Landing hero | "Priya was an ICU nurse for eight years. In Waterloo, she works retail. Canada needs nurses. Priya is one." |
| 0:20 to 0:40 | Landing chapters | The problem: nine requirements, several organizations, around 12 months by CNO's own guideline, no single place that shows *your* path. |
| 0:40 to 1:20 | Intake | Priya speaks in Hindi. Transcript and English translation appear. Profile chips populate. |
| 1:20 to 2:40 | Roadmap | Steps assemble, critical path glows. Toggle to Portage plan: lanes, counter drops. Click a node: official CNO processing time, source link. Evidence-of-practice warning appears with the fix. |
| 2:40 to 3:20 | Document check | Upload a sample employment letter: "Must be sent directly by your employer to CNO." Upload a sample record check: "Too early, it will expire before you apply." |
| 3:20 to 4:00 | Insights | "Where Canada's talent gets stuck." Explain: this is what the ministers' platform needs. Illustrative label visible. |
| 4:00 to 4:40 | Slide | Who pays, next steps (section 6). |
| 4:40 to 5:00 | Hero | "Portage. Carry your career across." |

Every number in the video must come from the engine running on sourced data. Record from the deployed URL in demo mode for stability, and say so if asked.

---

## 6. Pitch (VC-style)

Prepare a 3-minute and a 5-minute cut (confirm the time limit with organizers Saturday night).

1. **Hook (20 s):** Priya's story. "Canada's biggest untapped resource isn't in the ground."
2. **Problem (30 s):** licensing is split across provinces, regulators and professional bodies; nine requirements for nurses in Ontario alone; applicants lose months to ordering mistakes and expired documents.
3. **Why now (20 s):** FLMM July 2026 commitment to a credential recognition digital platform, recommendations due this fall.
4. **Demo (90 s to 3 min):** live, from the deployed URL, demo mode ready.
5. **Business model (30 s):** free for newcomers, always. Revenue from (a) provinces and regulators licensing the insights layer, (b) employers such as hospitals hiring internationally educated nurses (LHSC already hires IENs into non-nursing roles while they work toward registration, which shows employers invest in this pipeline), (c) settlement agencies delivering FCR-funded services.
6. **Moat (15 s):** a structured, cited pathway graph per profession per province, plus anonymized data on where people get stuck. Nobody else has the second one.
7. **Next steps (15 s):** validate with 5 internationally educated nurses and one settlement agency (CARE Centre for Internationally Educated Nurses is the obvious first call); add P.Eng and one skilled trade; second province.
8. **Close:** "Portage. Carry your career across."

---

## 7. Q&A drill (rehearse out loud)

- **"Why won't the government just build this?"** They might, and we'd love to be the vendor or the engine underneath. Governments are slow at consumer-grade products; ministers asked for recommendations by this fall; we're a working prototype today.
- **"What if your information is wrong?"** The AI never invents requirements. It only reads what the user says and what documents say. Every step comes from a curated, versioned data file with a link to the official source, and processing times are labelled official vs estimate. We tell users to confirm with the regulator.
- **"Isn't this unauthorized advice? CNO warns about third parties."** CNO warns applicants never to share their login or let anyone submit for them. Portage never asks for credentials and never submits anything. It is a planning tool that points to official sources.
- **"Privacy?"** No accounts, no database. Audio and text are processed to build the plan and not stored by us. Production would add Canadian data residency.
- **"How do you scale beyond nurses in Ontario?"** The engine is profession-agnostic; a new pathway is a data file plus expert review. Next: engineers (PEO), then one Red Seal trade.
- **"Who else does this?"** Newcomer checklists and settlement guides exist, and general AI assistants exist. None build a personal, cited, deadline-aware licensing plan, and none give government a view of where people get stuck. (Only say "none" if our last check still holds. Re-check Saturday night.)
- **"How do you make money if it's free?"** Section 6, point 5.
- **"What's your traction?"** Honest: built this weekend. Next 30 days: 5 user interviews, 1 agency pilot conversation.

---

## 8. Risk register

| Risk | Likelihood | Impact | Mitigation | Trigger to act |
|---|---|---|---|---|
| Venue wifi dies during pitch | Med | Fatal | Demo mode fixtures; phone hotspot; screen-recorded backup video on laptop | Any API latency over 3 s at rehearsal |
| Wrong pathway fact spotted by judge | Med | High | Sources on every node; official vs estimate badges; re-verify critical nodes at Gate 4 | Any node without a source |
| Engine numbers implausible | Med | High | Sanity check vs CNO ~12 month guideline; golden tests | Priya total under 6 or over 24 months |
| Scope creep | High | High | MoSCoW contract; gates; cut rules | Any gate missed by 30 min |
| Hindi audio sounds fake or wrong | Med | Med | Record a native speaker Saturday evening (ask around the venue); fallback: English intake with a language picker showing Hindi support | No speaker found by 11 PM |
| API keys leak into public repo | Low | High | `.gitignore` first commit; keys only server-side; grep build | Any `.env` in `git ls-files` |
| AI attribution in commits | Low | Med | commit-msg hook; human-authored commits | Hook not installed on a machine |
| iOS Safari MediaRecorder quirks | Med | Med | Detect supported mime; test on phone at Gate 3; sample-voice button | Recording fails on phone |
| Exhaustion errors after 3 AM | High | Med | Staggered sleep; freeze at 8 AM; no refactors after 4 AM | Anyone asleep at keyboard |
| Video over 5:00 | Med | Med | Script with timestamps; cut insights to 30 s if needed | First take over 5:15 |
| Illustrative data mistaken for real | Low | High | Permanent badge; say it out loud | Badge missing in any screenshot |

---

## 9. Submission checklist (10:30 to 11:00 AM)

- [ ] All branches merged to `main`; no open PRs.
- [ ] Repo is **public**; README has: what it is, screenshots, live URL, video link, how to run, tech stack, data sources, team.
- [ ] `git ls-files` contains no `.env`; keys rotated if ever exposed.
- [ ] Private `verify-history.sh` prints "Clean" and the `attribution-guard` Action is green on `main`.
- [ ] Live URL works in incognito on laptop and phone; `?demo=1` works with wifi off.
- [ ] Demo video under 5:00, uploaded (YouTube unlisted), link tested logged out.
- [ ] Devpost: title, tagline, description (Inspiration, What it does, How we built it, Challenges, Accomplishments, What we learned, What's next), video link, repo link, tech tags, team members added.
- [ ] Pitch deck exported to PDF on two devices plus a USB stick or cloud link.
- [ ] Backup: screen recording of the full demo saved locally on the pitching laptop.

---

## 10. Honesty rules (these protect the pitch)

1. No number on screen that the engine did not compute from sourced data.
2. "One at a time vs Portage plan" is a comparison between two schedules of the same steps. Never claim "Portage saves applicants X months on average"; we have no such data.
3. Illustrative data is always labelled.
4. Sample documents are watermarked SAMPLE / EXEMPLE.
5. Priya is a composite persona; say so if asked.
6. If a judge asks something we do not know, say so and say how we'd find out.
