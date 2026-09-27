// All deck text in one place (English: the judges' language). Numbers are filled in from
// facts.ts and sources.ts at render time; `{placeholders}` below are replaced, never typed.

export type SlideId = "hook" | "priya" | "problem" | "whyNow" | "demo" | "happened" | "business" | "moat" | "next";

export type SlideCopy = {
  id: SlideId;
  label: string;
  /** Speaker notes for the 3-minute cut; lines starting "5 min:" are additions for the 5-minute cut. */
  notes: string[];
};

export const SLIDES: SlideCopy[] = [
  {
    id: "hook",
    label: "Portage",
    notes: [
      "Canada's biggest untapped resource isn't in the ground.",
      "It's the nurses, engineers and tradespeople who already live here and cannot practise.",
      "5 min: pause and let the line land before clicking.",
    ],
  },
  {
    id: "priya",
    label: "Meet Priya",
    notes: [
      "Meet Priya. Eight years as an ICU nurse. In Waterloo, she works retail.",
      "Priya is a composite persona built from the public process, not a real person. Say so if asked.",
      "5 min: Canada needs nurses. Priya is one.",
    ],
  },
  {
    id: "problem",
    label: "The problem",
    notes: [
      "To practise in Ontario she has to meet {requirements} separate requirements, across several organizations.",
      "CNO's own guideline is about {guidelineMonths} months. There is no single place that shows her path.",
      "{applicants} internationally educated applicants are waiting in Ontario right now.",
      "5 min: people lose months to steps done in the wrong order and documents that expire.",
    ],
  },
  {
    id: "whyNow",
    label: "Why now",
    notes: [
      "In July 2026 the labour ministers agreed to build a digital platform that simplifies credential recognition, with recommendations due this fall.",
      "Ottawa already funds {fcrAgreements} credential recognition agreements for about {fcrProfessionals} professionals this year.",
      "Ministers asked for this platform. We built the prototype this weekend.",
    ],
  },
  {
    id: "demo",
    label: "Live",
    notes: [
      "Let me show you. Click See it live: same tab, real AI.",
      "Path: sample voice, Build my roadmap, toggle to the Portage plan, Hear your plan, Documents police check, Insights, then Back to pitch.",
      "If anything is slow, use the demo-mode link instead: same flow with fixtures.",
    ],
  },
  {
    id: "happened",
    label: "What just happened",
    notes: [
      "One step at a time, Priya finishes in {oneAtATime}, after her evidence of practice window closes in {windowCloses}.",
      "With the Portage plan, {portagePlan}. Tight, so Portage shows what protects her window.",
      "Every number came from the engine, running on CNO's own published data. The AI only listens and reads.",
    ],
  },
  {
    id: "business",
    label: "Business model",
    notes: [
      "Free for newcomers, always.",
      "Regulators and provinces license the insights layer. Employers hiring internationally educated nurses pay to bring them on sooner. Settlement agencies deliver FCR-funded services on top of it.",
      "5 min: London Health Sciences Centre already hires internationally educated nurses into non-nursing roles while they register; employers invest in this pipeline.",
    ],
  },
  {
    id: "moat",
    label: "Why Portage",
    notes: [
      "Checklists and settlement guides are generic. General AI assistants guess.",
      "Portage builds a personal, cited, deadline-aware plan, and gives government a live view of where people get stuck. Nobody else has that second part.",
    ],
  },
  {
    id: "next",
    label: "Next 30 days",
    notes: [
      "Five interviews with internationally educated nurses, and a pilot conversation with CARE Centre.",
      "Then engineers through PEO, one skilled trade, and a second province.",
      "We're Taha and Ebrahim. Portage. Carry your career across.",
    ],
  },
];

export const DECK_TEXT = {
  hook: "Canada's biggest untapped resource isn't in the ground.",
  priyaName: "Priya",
  priyaLine1: "ICU nurse, 8 years.",
  priyaLine2: "In Waterloo, she works retail.",
  priyaNote: "Composite persona",
  problemTitle: "The path is real. The map isn't.",
  problemRequirements: "separate requirements",
  problemGuideline: "months: CNO's own guideline",
  problemOrgs: "Several organizations. No single place that shows your path.",
  problemApplicants: "internationally educated applicants waiting in Ontario",
  whyNowTitle: "Ministers asked for this platform.",
  whyNowFlmm: "Federal, provincial and territorial labour ministers agreed to build a digital platform that simplifies credential recognition. Recommendations due {due}.",
  whyNowFcr: "credential recognition agreements, for about {professionals} internationally trained professionals this year.",
  demoTitle: "See it live.",
  demoButton: "See it live · Voir en direct",
  demoBackup: "Instant backup (demo mode)",
  happenedTitle: "Same steps. Different order. Months back.",
  happenedOneAtATime: "One at a time",
  happenedPortage: "Portage plan",
  happenedWindow: "Evidence of practice window closes",
  happenedTight: "Tight: only if each step goes to plan",
  happenedEngine: "Computed live by the Portage engine from CNO's published requirements.",
  businessTitle: "Free for newcomers. Always.",
  business: [
    { who: "Regulators and provinces", what: "license the insights layer: where applicants stall, by requirement." },
    { who: "Employers", what: "hiring internationally educated nurses get them to the floor sooner." },
    { who: "Settlement agencies", what: "deliver FCR-funded services on top of Portage." },
  ],
  moatTitle: "Why Portage",
  moatOthers: [
    { who: "Newcomer checklists and settlement guides", what: "Generic. Not your path, not your deadlines." },
    { who: "General AI assistants", what: "Fluent, but uncited. They can invent requirements." },
  ],
  moatPortage: "Portage: a personal, cited, deadline-aware plan, and a government view of where people get stuck.",
  nextTitle: "Next 30 days",
  next: [
    "5 interviews with internationally educated nurses",
    "1 pilot conversation with a settlement agency (CARE Centre)",
    "Add engineers (PEO) and one skilled trade",
    "A second province",
  ],
  team: "Taha Hussain · Ebrahim Zuberi",
  close1: "Portage.",
  close2: "Carry your career across.",
  sourcePrefix: "Source:",
  asOf: "as of",
  notesTitle: "Speaker notes",
  keys: "→ / Space next · ← back · 1-9 jump · F fullscreen · N notes",
} as const;

export function fill(text: string, values: Record<string, string | number | null | undefined>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (values[k] === undefined || values[k] === null ? m : String(values[k])));
}
