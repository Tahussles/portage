# PROJECT_STATE.md (living file: update at every gate)

Last updated: Sat Sep 26, 2026, planning complete
Current step: Step 1 (scaffold) + Step 2 (pathway data), in parallel
Next gate: Gate 1 at 7:30 PM

## Step status
| Step | Owner | Status | Notes |
|---|---|---|---|
| 1 Scaffold | Taha | not started | |
| 2 Pathway data | Ebrahim | not started | Research base in docs/PATHWAY_ON_RN_IEN.md |
| 3a Engine | Ebrahim | not started | |
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
- Real CNO applicant statistics usable for the insights view?

## Engine outputs to record (for the pitch)
- Priya one-at-a-time total: TBD
- Priya parallel total: TBD
- Priya estimate share: TBD
- Evidence-of-practice warning fires for Priya: TBD

## French TODO keys
(none yet)
