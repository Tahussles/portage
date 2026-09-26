# PROJECT_STATE.md (living file: update at every gate)

Last updated: Sat Sep 26, 2026, Step 3a (engine) in review
Current step: Step 1 (scaffold) + Step 2 (pathway data), in parallel
Next gate: Gate 1 at 7:30 PM

## Step status
| Step | Owner | Status | Notes |
|---|---|---|---|
| 1 Scaffold | Taha | not started | |
| 2 Pathway data | Ebrahim | done | PRs #2, #3, #4 merged. Facts in docs/PATHWAY_VERIFIED.md |
| 3a Engine | Ebrahim | in review | buildPlan in src/lib/engine/plan.ts; golden tests for Priya, Marco, Amina + 200-profile property test pass. src/data/fixtures/plan-priya.json is generated from the engine and checked by a test |
| 3b Roadmap canvas | Taha | not started | Build against fixtures/plan-priya.json |
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

## Open questions
- Pitch time limit on Sunday (ask organizers).
- Native Hindi speaker for the demo recording (ask around the venue by 11 PM).
- Real CNO applicant statistics usable for the insights view? Yes for totals: 14,298 active applicants living in Ontario, 7,957 international (as of Sept 1, 2026); SPEP 8,885 eligible, 8,406 applied, 6,738 registered (as of Sept 18, 2026). No stage funnel, so the funnel stays illustrative. See docs/PATHWAY_VERIFIED.md section 10.
- Priya plausibility: with current typical durations the parallel plan is about 21 weeks (4.9 months), below the 6-month floor in the risk register; one-at-a-time is about 58 weeks (13.3 months). Critical path: eca, cno_application, registration_exam. Decide in Step 3a whether to widen the team estimates (exam prep, third-party documents) or explain the gap to CNO's 12-month guideline.
- Side-lane nodes (Temporary Class, bridge roles, support orgs) are not in on-rn-ien.json: PathwayNode has no lane flag, so the engine would schedule them. Needs a types.ts decision.
- ICAS fee has two conflicting figures ($132 vs $165); marked estimate.

## Engine outputs to record (for the pitch)
(today = 2026-09-26, Priya last practised 2025-07)
- Priya one-at-a-time total: 58 weeks, finish Nov 2027
- Priya parallel total: 21.1 weeks, finish Feb 2027. Critical path: eca, cno_application, registration_exam, registration
- Priya estimate share: 90% of the critical path is estimated
- Evidence-of-practice warning fires for Priya: NO. Her window closes Jul 2028, after the Feb 2027 finish. The demo beat in PLAN.md section 0 needs a different persona date (it fires if she last practised before about Feb 2024) or a decision from the team
- Marco: 39 weeks one at a time, 12.1 weeks parallel (exam and language test done)
- Amina: evidence_of_practice blocked, critical warning fires; 55 weeks one at a time, 21.1 weeks parallel

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
