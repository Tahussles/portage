# PROJECT_STATE.md (living file: update at every gate)

Last updated: Sat Sep 26, 2026, 3:50 PM (round 2 sync)
Current step: Step 3a (engine, Ebrahim) + Step 3b (roadmap canvas, Taha), in parallel
Next gate: Gate 2 at 10:30 PM

Live per-track status (updated in every PR): [docs/status/taha.md](docs/status/taha.md) and [docs/status/ebrahim.md](docs/status/ebrahim.md). This file holds decisions, the gate log and cross-track facts.

## Step status
| Step | Owner | Status | Notes |
|---|---|---|---|
| 1 Scaffold | Taha | done | PR #1: tokens, fonts, i18n, navbar, hero, stub pages. Vercel import pending. |
| 2 Pathway data | Ebrahim | done | PR #2 (docs/PATHWAY_VERIFIED.md) and PR #3 (schema, on-rn-ien.json, tests) merged 3:40 PM. Data corrections in progress (decision 10) |
| 3a Engine | Ebrahim | not started | |
| 3b Roadmap canvas | Taha | in progress | Built against src/data/fixtures/plan-priya.provisional.json until the engine lands |
| 4a AI routes | Ebrahim | not started | |
| 4b Intake UI | Taha | not started | |
| 5 Wiring | Both | not started | |
| 6 Doc check (SHOULD) | Ebrahim | not started | |
| 7 Insights (SHOULD) | Taha | not started | |
| 8 Polish | Both | not started | |
| 9 Ship | Both | not started | |

## Gate log
| Gate | Time | Result | Cuts applied |
|---|---|---|---|
| Gate 1 | 3:50 PM | Gate 1: passed; hero local PASS, Vercel pending; pathway schema tests 10/10 | none |

## Roles
- Taha: Builder B (UI, motion, design) and repo owner.
- Ebrahim: Builder A (pathway data, engine, AI routes).

## Decisions (append only)
1. Name: Portage. Tagline: "Carry your career across." / "Emportez votre carrière avec vous."
2. v1 scope: IEN to RN, Ontario (CNO) only.
3. Engine is deterministic and client-side; LLM only extracts facts from speech and documents.
4. No database, no accounts, no persistence of personal data.
5. Never collect immigration category; authorization to work is yes/no/unsure only.
6. Illustrative data always labelled.
7. Only Taha and Ebrahim appear in git history: allowlist pre-commit hook, stripping commit-msg hook, agent-side safety hook, and the attribution-guard GitHub Action.
8. Each person merges their own PRs with GitHub's merge button after enabling GitHub email privacy; the allowlist holds each person's noreply address (plus Ebrahim's gmail, already in history).
9. Every timeline is shown as a range (best / typical / conservative from min/typical/max weeks). The parallel plan is labelled "if each step goes to plan". Sanity check: the one-at-a-time typical total should sit near CNO's ~12-month guideline (9 to 18 months). Never tune durations to hit a target; only fix modelling errors.
10. Data corrections in progress (Ebrahim): school transcripts node before ECA; police check near the end; side-lane nodes (Temporary Class, bridge roles, support organizations).
11. Priya persona: stopped practising in July 2024 when she moved to Canada (paid ICU work).
12. Language and Transition to Practice are split into an applicant step (estimate) and CNO processing (official).
13. Two independent tracks coordinated only through the repo: status files, PRs, and labelled issues (see AGENTS.md "Coordination").

## Open questions
- Pitch time limit on Sunday (ask organizers).
- Native Hindi speaker for the demo recording (ask around the venue by 11 PM).
- Real CNO applicant statistics usable for the insights view? Yes for totals: 14,298 active applicants living in Ontario, 7,957 international (as of Sept 1, 2026); SPEP 8,885 eligible, 8,406 applied, 6,738 registered (as of Sept 18, 2026). No stage funnel, so the funnel stays illustrative. See docs/PATHWAY_VERIFIED.md section 10.
- Priya plausibility: with current typical durations the parallel plan is about 21 weeks (4.9 months), below the 6-month floor in the risk register; one-at-a-time is about 58 weeks (13.3 months). (Decision 9 replaces the 6-month floor: the check is now one-at-a-time typical within 9 to 18 months, which 13.3 months meets.) Critical path: eca, cno_application, registration_exam. Decide in Step 3a whether to widen the team estimates (exam prep, third-party documents) or explain the gap to CNO's 12-month guideline.
- Side-lane nodes (Temporary Class, bridge roles, support orgs) are not in on-rn-ien.json: PathwayNode has no lane flag, so the engine would schedule them. Needs a types.ts decision.
- ICAS fee has two conflicting figures ($132 vs $165); marked estimate.
- French native check: the hero now uses the gender-neutral "Vous avez étudié à l'étranger."; the rest of the French strings still need a native read.
- Official French name for SPEP (Supervised Practice Experience Partnership).
- Is the 3-year evidence-of-practice window measured at assessment or at registration? It changes when the warning fires.

## Engine outputs to record (for the pitch)
- Priya one-at-a-time total: TBD
- Priya parallel total: TBD
- Priya estimate share: TBD
- Evidence-of-practice warning fires for Priya: TBD

## Estimates in on-rn-ien.json (show the "Estimate" badge)
| Node | min / typical / max weeks | Why |
|---|---|---|
| cno_account | 0 / 0.5 / 1 | Team estimate, no official time |
| third_party_docs | 2 / 8 / 26 | Team estimate, foreign employers and regulators |
| eca | 3 / 7 / 10 | Provider-posted times (WES, ICES, ICAS), excludes school sending time |
| translations | 1 / 3 / 6 | Team estimate |
| language_test | 2 / 4 / 8 | Team estimate, booking plus results |
| ttp_course | 7 / 10 / 14 | CNO range 7 to 14 weeks, typical is a midpoint |
| jurisprudence | 0.5 / 1 / 4.3 | Prep is a team estimate; 30-day window official |
| registration_exam | 4 / 12 / 24 | Team estimate for prep and booking |
| criminal_record_check | 0.7 / 2 / 5 | 30 days to complete and 5-day processing official; typical is a team estimate |

Cost estimates: eca ($200, varies by provider), ttp_course ($390, sample of two schools). Unknown costs: third_party_docs, translations, language_test, criminal_record_check.

## French TODO keys
French lines in on-rn-ien.json to review by a native speaker:
- CNO is written as "l'OIIO" (Ordre des infirmières et infirmiers de l'Ontario) throughout; confirm the team wants the acronym.
- third_party_docs title: "ordre d'origine" for home regulator.
- authorization_to_work and registration: inclusive forms "autorisé(e)", "inscrit(e)", "infirmière autorisée ou infirmier autorisé".
- language_test summary: IELTS skill names ("compréhension orale", "expression écrite").
- evidence_of_practice: "Partenariat d'expérience de pratique supervisée (SPEP)" is our translation; CNO's official French name not checked.
- ttp_course / ttp: "transition vers la pratique" and "vérification de réussite du cours" are our translations of CNO form names.
- direct_from_source warning: "téléversés".
