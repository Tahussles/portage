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
  lane?: Lane;                         // default "main"; "side" nodes are never scheduled (see Plan.side)
  sources: { label: string; url: string; accessed: string }[];
};

export type Lane = "main" | "side";

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

// best / typical / conservative totals from minWeeks / typicalWeeks / maxWeeks (decision 9).
// typicalWeeks always equals the schedule's totalWeeks. Finish dates are ISO dates.
export type ScheduleRange = {
  bestWeeks: number; typicalWeeks: number; conservativeWeeks: number;
  bestFinish: string; conservativeFinish: string;
};

export type Plan = {
  statuses: Record<string, NodeStatus>;
  order: string[];                     // topological
  sequential: { totalWeeks: number; finishDate: string; startWeek: Record<string, number>; range: ScheduleRange };
  parallel:   { totalWeeks: number; finishDate: string; startWeek: Record<string, number>; criticalPath: string[]; range: ScheduleRange };
  side: { nodeId: string; status: NodeStatus }[];   // "While you wait" nodes: not in order, startWeek or totals
  warnings: PlanWarning[];
  estimateShare: number;               // fraction of critical-path weeks that are estimates (shown in UI)
};

export type ScheduleKey = "sequential" | "parallel";

export type PlanWarning = {
  id: string; severity: "info" | "warn" | "critical";   // most severe across schedules
  title: { en: string; fr: string }; body: { en: string; fr: string };
  relatedNodes: string[]; sourceUrl: string;
  schedules?: ScheduleKey[];                              // schedules under which it fires; absent = both
  severityBySchedule?: Partial<Record<ScheduleKey, "info" | "warn" | "critical">>;
  facts?: Record<string, string>;                         // values for UI copy, e.g. { windowCloses: "2027-07" }
};

// Placeholder: referenced by Pathway above but not yet specified in docs/ARCHITECTURE.md.
// Step 2/3a owner replaces this with the real warning rule definition.
export type WarningRuleDef = { id: string } & Record<string, unknown>;

// Document pre-check (Step 6). The model only extracts what is printed; findings come from
// deterministic rules in docRules.ts.
export type DocType =
  | "education_transcript" | "diploma" | "nursing_licence" | "employment_letter"
  | "registration_verification" | "criminal_record_check" | "language_test_report"
  | "identity_document" | "other";

export type DocExtraction = {
  docType: DocType;
  nameOnDocument: string | null;
  issueDate: string | null;            // ISO date (YYYY-MM-DD or YYYY-MM) as printed
  documentLanguage: string | null;     // ISO 639-1, e.g. "en", "hi"
  issuer: string | null;
  description: string;                 // one sentence, English
};

export type DocFinding = {
  id: string;                          // e.g. "name_mismatch", "translation_needed", "crc_expires_early"
  severity: "ok" | "info" | "warn" | "critical";   // "ok" renders as a tick
  title: { en: string; fr: string };
  body: { en: string; fr: string };
  relatedNodes: string[];
  sourceUrl: string;
};
