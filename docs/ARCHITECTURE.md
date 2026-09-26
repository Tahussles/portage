# Portage Architecture

## 1. Requirements

**Functional:** voice intake in any language; structured profile; deterministic licensing plan from cited data; two schedules (one at a time, parallel critical path); deadline warnings; document pre-check; government insights view; EN/FR UI.

**Non-functional:** demo must survive bad wifi (fixtures); every AI response under 8 s or fall back; zero personal data persisted; keys server-side only; runs on Vercel free/hobby tier; loads fast on a phone.

**Constraints:** 2 builders, about 17 hours of build time, public repo, judges score theme, viability, pitch.

## 2. High-level design

```
 Browser (Next.js client)                       Vercel server routes                External
 ------------------------                       --------------------                --------
 /start  MediaRecorder -> audio blob  ------->  POST /api/transcribe  ------------> ElevenLabs STT (scribe_v2)
                                                 (fixture on fail)
         transcript + lang  ------------------> POST /api/profile     ------------> Claude (forced tool use)
                                                 zod validate, fixture on fail
         Profile  -> zustand store
 /roadmap  buildPlan(profile, pathway, today)   (runs in the browser: pure engine + static JSON)
           -> React Flow canvas, counter, warnings
 /documents file ---------------------------->  POST /api/doc-check   ------------> Claude (PDF/image input, forced tool use)
                                                 extraction -> docRules (deterministic) -> findings
 /insights  static insights-illustrative.json  (no network)
```

Key decision: **the engine runs client-side** on a static JSON import. The roadmap and the "wow" animation need zero network, so the centrepiece cannot fail on stage.

## 3. Trade-offs we chose

| Decision | Chosen | Rejected | Why |
|---|---|---|---|
| Backend | Next.js route handlers | FastAPI | One repo, one language, one deploy |
| Storage | None (static JSON + in-memory state) | MongoDB/Postgres | No personal data retention; nothing to break |
| i18n | Tiny custom `useT()` + JSON | next-intl with locale routing | Fewer moving parts in 17 hours |
| Plan logic | Deterministic engine | LLM-generated plans | Accuracy, testability, judge trust |
| LLM output | Forced tool use + zod | Free-text JSON parsing | Structured, validated, fallback-safe |
| Layout | Engine computes x/y | dagre/elk | Parallel layout must equal a timeline; we own the math |
| Map | Natural Earth admin-1, simplified | StatCan boundary files | Public domain, tiny after simplification |

What we would revisit at scale: a pathway authoring tool with expert review workflow, a database of versioned pathways, Canadian data residency for AI processing, server-side analytics for the insights layer with consent.

## 4. Data model (`src/lib/engine/types.ts`)

```ts
export type Locale = "en" | "fr";

export type Profile = {
  profession: "nurse";                 // v1
  targetCategory: "RN" | "RPN";
  countryOfEducation: string | null;   // ISO 3166 alpha-2 preferred
  credential: "bachelor" | "diploma" | "other" | null;
  graduationYear: number | null;
  lastPractisedAt: string | null;      // ISO date (YYYY-MM or YYYY-MM-DD); drives the 3-year rule
  yearsExperience: number | null;
  currentlyInCanada: boolean | null;
  province: string | null;             // "ON"
  authorizedToWork: "yes" | "no" | "unsure" | null;   // NEVER collect immigration category
  nameOnDocumentsMatches: boolean | null;
  documentsLanguage: "en" | "fr" | "other" | "mixed" | null;
  languageProficiency: {
    status: "none" | "booked" | "passed" | "via_education_or_work" | null;
    test?: "IELTS" | "CELBAN" | "OET" | "PTE" | "TEF" | "TCF" | null;
    date?: string | null;
  };
  progress: {                          // what the person says they already did
    ecaStarted: boolean | null;
    cnoAccountCreated: boolean | null;
    cnoApplicationSubmitted: boolean | null;
    ttpCompleted: boolean | null;
    jurisprudencePassed: boolean | null;
    registrationExamPassed: boolean | null;
    criminalRecordCheckDate: string | null;
  };
  spokenLanguage: string | null;       // e.g. "hi"
  confidence: Record<string, number>;  // 0..1 per extracted field, from the LLM
};

export type Actor = "you" | "cno" | "third_party" | "school" | "test_provider";

export type Duration = {
  minWeeks: number; typicalWeeks: number; maxWeeks: number;
  kind: "official" | "estimate";
  note: string;                        // where the number came from
};

export type PathwayNode = {
  id: string;                          // "eca", "cno_application", ...
  title: { en: string; fr: string };
  summary: { en: string; fr: string };
  actor: Actor[];
  dependsOn: string[];
  duration: Duration;
  cost?: { amountCad: number | null; note: string; kind: "official" | "estimate" | "unknown" };
  appliesIf?: Rule;                    // default: always applies
  doneIf?: Rule;                       // profile says it is complete
  canStartBeforeArrival?: boolean;
  scheduleHint?: "asap" | "late";      // "late" for criminal record check (6-month validity)
  sources: { label: string; url: string; accessed: string }[];
};

export type Rule =
  | { all: Rule[] } | { any: Rule[] } | { not: Rule }
  | { field: string; op: "eq" | "neq" | "in" | "truthy" | "falsy"; value?: unknown };

export type Pathway = {
  id: "on-rn-ien";
  version: string; lastReviewed: string;
  regulator: { name: string; url: string };
  guidelineMonths?: number;            // CNO: ~12, used only as a sanity check
  nodes: PathwayNode[];
  warnings: WarningRuleDef[];
};

export type NodeStatus = "done" | "todo" | "not_applicable" | "blocked";

export type Plan = {
  statuses: Record<string, NodeStatus>;
  order: string[];                     // topological
  sequential: { totalWeeks: number; finishDate: string; startWeek: Record<string, number> };
  parallel:   { totalWeeks: number; finishDate: string; startWeek: Record<string, number>; criticalPath: string[] };
  warnings: PlanWarning[];
  estimateShare: number;               // fraction of critical-path weeks that are estimates (shown in UI)
};

export type PlanWarning = {
  id: string; severity: "info" | "warn" | "critical";
  title: { en: string; fr: string }; body: { en: string; fr: string };
  relatedNodes: string[]; sourceUrl: string;
};
```

## 5. API contracts

All routes return `{ ok: boolean, data?: T, error?: string, fallback?: boolean }`. `fallback: true` means fixture data was served (a tiny dot appears in the footer so the team knows; judges will not notice).

### POST `/api/transcribe`
- Request: `multipart/form-data` with `audio` (webm/ogg/mp4/wav, max 10 MB), optional `languageHint`.
- Upstream: `POST https://api.elevenlabs.io/v1/speech-to-text`, header `xi-api-key`, multipart fields `file`, `model_id=scribe_v2`, optional `language_code`. (Verify exact response field names against the official ElevenLabs docs during Step 4; community integrations confirm the endpoint and `scribe_v2`.)
- Response `data`: `{ text: string, languageCode: string, languageProbability?: number }`
- Timeout 12 s, then fixture `transcript-priya.json`.

### POST `/api/profile`
- Request: `{ transcript: string, languageCode: string, locale: Locale }`
- Upstream: Claude, model `claude-sonnet-5`, `max_tokens` 1500, `tools: [extract_profile]`, `tool_choice: { type: "tool", name: "extract_profile" }`.
- Response `data`: `{ profile: Profile, englishTranslation: string, missingFields: string[], followUp?: { native: string, english: string } }`
- zod-validate the tool input. On failure or 12 s timeout: fixture.

### POST `/api/doc-check` [SHOULD]
- Request: `multipart/form-data` with `file` (pdf/png/jpg, max 8 MB) and `profile` (JSON string).
- Upstream: Claude with a `document` (PDF) or `image` content block, forced tool `extract_document`.
- Server then runs `docRules(extraction, profile, plan)` and returns `{ extraction, findings: Finding[] }`.

### POST `/api/speak` [COULD]
- Request `{ text, languageCode }`, upstream ElevenLabs TTS (`eleven_multilingual_v2`), returns `audio/mpeg`.

## 6. Prompts and tool schemas (`src/lib/ai/`)

### System prompt: profile extraction
```
You extract facts about an internationally educated nurse from what they said, for a licensing planning tool in Ontario, Canada.
Rules:
- Only record facts the person actually stated. If something was not said, use null. Never guess.
- Convert relative dates to absolute using today's date: {{TODAY}}.
- Do not ask about or record immigration category. Only record whether they said they are authorized to work in Canada (yes/no/unsure).
- Do not record health, criminal, or conduct information even if mentioned.
- Provide an English translation of the full transcript.
- For each non-null field, give a confidence from 0 to 1.
- If key fields are missing (lastPractisedAt, credential, languageProficiency.status, authorizedToWork), write ONE short follow-up question in the speaker's language and in English.
Call the extract_profile tool exactly once.
```
Tool `extract_profile`: JSON schema mirroring `Profile` (all fields nullable) plus `englishTranslation`, `missingFields`, `followUp`.

### System prompt: document extraction
```
You read one document uploaded by a nurse preparing a registration application. Extract only what is visible.
Return: docType (one of: education_transcript, diploma, nursing_licence, employment_letter, registration_verification, criminal_record_check, language_test_report, identity_document, other), nameOnDocument, issueDate (ISO or null), documentLanguage (ISO 639-1), issuer, and a one-sentence description.
Never infer values that are not printed on the document. Call extract_document exactly once.
```
Findings are produced by deterministic rules, not by the model.

### Grounding rule for any future Q&A feature
The model may only answer from the pathway JSON passed in context and must cite the node's source URL. If the answer is not in the data: "I don't have verified information on that. Please check with CNO:" plus the link.

## 7. Engine algorithms (`src/lib/engine/`)

1. **Applicability:** evaluate `appliesIf` and `doneIf` per node against the profile. A node whose dependencies are `not_applicable` treats them as satisfied.
2. **Topological order:** Kahn's algorithm; throw on cycles (schema test catches this).
3. **One at a time:** walk `todo` nodes in topological order; start of each = finish of the previous; total = sum of `typicalWeeks`.
4. **Parallel (critical path method):** `ES(n) = max(EF(dep))` over deps (0 if none or all done), `EF(n) = ES(n) + typicalWeeks`. Total = max EF. Critical path = backtrack from the node with max EF through the dep that set ES.
5. **Schedule hints:** `late` nodes (criminal record check) are scheduled as late as possible without extending the total: `LS(n) = LF(n) - duration`, where LF comes from a backward pass.
6. **Dates:** `finishDate = today + totalWeeks * 7 days`, rendered as month and year only (false precision hurts credibility).
7. **Warnings** (from pathway `warnings` definitions):
   - Evidence of practice: if `lastPractisedAt + 3 years < parallel.finishDate`, critical warning with options (SPEP, upgrading programs) and the source link.
   - Criminal record check: valid 6 months from issue; if the profile has a date that will be stale before the projected submission, warn.
   - Application window: CNO closes applications 2 years after opening; if parallel total after application opening exceeds 104 weeks, warn.
   - Direct-from-source documents: info warning on nodes involving employer or registration verifications.
8. **Estimate share:** sum of estimate-kind weeks on the critical path divided by total; displayed as "X% of this timeline is estimated".

### Golden test personas (`engine.test.ts`)
- **Priya** (demo persona): BSc Nursing, India, 8 years ICU, last practised 14 months before `today`, in Waterloo ON, authorized to work: yes, no language test yet, nothing started. Expect: ECA, CNO account, application, language, TTP, jurisprudence, NCLEX, criminal record check (late), registration all `todo`; evidence-of-practice warning fires only if parallel finish exceeds the 3-year window (assert whichever the data implies, and record the numbers in `PROJECT_STATE.md`).
- **Marco**: Philippines BSN, already passed the registration exam elsewhere, IELTS passed 6 months ago, ECA started. Expect: exam node `done` if the pathway data supports accepting results from another jurisdiction (VERIFY), language `done`, shorter totals.
- **Amina**: diploma, last practised 4 years ago. Expect: evidence-of-practice node `blocked` with SPEP/upgrading alternative, critical warning.
- Property test: for 200 random valid profiles, `parallel.totalWeeks <= sequential.totalWeeks` and no NaN.

## 8. Demo mode (`src/lib/demo.ts`)
- Active if URL has `?demo=1`, or env `NEXT_PUBLIC_FORCE_DEMO=1`, or any upstream call fails or times out.
- Route handlers import fixtures directly so fallback is instant.
- "Use sample voice (Priya)" plays `public/demo/priya-hi.webm` through the real pipeline when online, fixture when offline.

## 9. Environment variables (`.env.example`)
```
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
NEXT_PUBLIC_FORCE_DEMO=0
```

## 10. Deployment
- Vercel, project root = repo root, Node runtime for API routes, `maxDuration` 30 on AI routes.
- Env vars set in Vercel for Production and Preview.
- Test on venue wifi AND a phone hotspot at Gate 3 and Gate 4.
- Videos: 1080p H.264, 8 to 12 s loops, under 4 MB each, `preload="metadata"`, poster JPGs.

## 11. Security and privacy checklist
- [ ] Keys only in route handlers; `grep -r "sk-" .next/static` returns nothing after build.
- [ ] Upload size limits enforced server-side.
- [ ] No logging of transcripts or document contents (log only status codes and timings).
- [ ] Consent line on intake and documents screens.
- [ ] No regulator login fields anywhere in the product.
