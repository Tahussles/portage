import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Profile } from "@/lib/engine/types";

// Tool definition for Claude and the zod schema that validates what comes back.

const nullable = (type: string, extra: Record<string, unknown> = {}) => ({ type: [type, "null"], ...extra });
const nullableEnum = (values: string[]) => ({ type: ["string", "null"], enum: [...values, null] });

export const extractProfileTool: Anthropic.Tool = {
  name: "extract_profile",
  description:
    "Record the facts the nurse stated about their education, practice, location, work authorization, language testing and licensing progress, plus an English translation of the transcript.",
  input_schema: {
    type: "object",
    properties: {
      targetCategory: nullableEnum(["RN", "RPN"]),
      countryOfEducation: nullable("string", { description: "ISO 3166-1 alpha-2" }),
      credential: nullableEnum(["bachelor", "diploma", "other"]),
      graduationYear: nullable("integer"),
      lastPractisedAt: nullable("string", { description: "YYYY-MM or YYYY-MM-DD" }),
      yearsExperience: nullable("number"),
      currentlyInCanada: nullable("boolean"),
      province: nullable("string", { description: "Two-letter Canadian province code" }),
      authorizedToWork: nullableEnum(["yes", "no", "unsure"]),
      nameOnDocumentsMatches: nullable("boolean"),
      documentsLanguage: nullableEnum(["en", "fr", "other", "mixed"]),
      languageProficiency: {
        type: "object",
        properties: {
          status: nullableEnum(["none", "booked", "passed", "via_education_or_work"]),
          test: nullableEnum(["IELTS", "CELBAN", "OET", "PTE", "TEF", "TCF"]),
          date: nullable("string", { description: "YYYY-MM or YYYY-MM-DD" }),
        },
        required: ["status"],
      },
      progress: {
        type: "object",
        properties: {
          ecaStarted: nullable("boolean"),
          cnoAccountCreated: nullable("boolean"),
          cnoApplicationSubmitted: nullable("boolean"),
          ttpCompleted: nullable("boolean"),
          jurisprudencePassed: nullable("boolean"),
          registrationExamPassed: nullable("boolean"),
          criminalRecordCheckDate: nullable("string", { description: "YYYY-MM-DD" }),
        },
      },
      spokenLanguage: nullable("string", { description: "ISO 639-1 code of the language spoken" }),
      confidence: {
        type: "object",
        additionalProperties: { type: "number", minimum: 0, maximum: 1 },
        description: "Confidence 0..1 per non-null field, keyed by field name",
      },
      englishTranslation: { type: "string" },
      followUp: {
        type: ["object", "null"],
        properties: { native: { type: "string" }, english: { type: "string" } },
        required: ["native", "english"],
      },
    },
    required: ["englishTranslation", "languageProficiency", "progress", "confidence"],
  },
};

// Tolerant parsing: a malformed field becomes null instead of discarding the whole extraction,
// so a real speaker never silently gets the demo persona's profile.
const opt = <T extends z.ZodType>(schema: T) => schema.nullable().optional().catch(null);
const isoMonthOrDate = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/);
const isoDate = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/);

export const extractProfileInputSchema = z.object({
  targetCategory: opt(z.enum(["RN", "RPN"])),
  countryOfEducation: opt(z.string().regex(/^[A-Za-z]{2}$/)),
  credential: opt(z.enum(["bachelor", "diploma", "other"])),
  graduationYear: opt(z.number().int().min(1950).max(2100)),
  lastPractisedAt: opt(isoMonthOrDate),
  yearsExperience: opt(z.number().min(0).max(60)),
  currentlyInCanada: opt(z.boolean()),
  province: opt(z.string().regex(/^[A-Za-z]{2}$/)),
  authorizedToWork: opt(z.enum(["yes", "no", "unsure"])),
  nameOnDocumentsMatches: opt(z.boolean()),
  documentsLanguage: opt(z.enum(["en", "fr", "other", "mixed"])),
  languageProficiency: z
    .object({
      status: opt(z.enum(["none", "booked", "passed", "via_education_or_work"])),
      test: opt(z.enum(["IELTS", "CELBAN", "OET", "PTE", "TEF", "TCF"])),
      date: opt(isoMonthOrDate),
    })
    .catch({ status: null, test: null, date: null }),
  progress: z
    .object({
      ecaStarted: opt(z.boolean()),
      cnoAccountCreated: opt(z.boolean()),
      cnoApplicationSubmitted: opt(z.boolean()),
      ttpCompleted: opt(z.boolean()),
      jurisprudencePassed: opt(z.boolean()),
      registrationExamPassed: opt(z.boolean()),
      criminalRecordCheckDate: opt(isoDate),
    })
    .catch({}),
  spokenLanguage: opt(z.string().min(2).max(12)),
  confidence: z.record(z.string(), z.number().min(0).max(1)).catch({}),
  englishTranslation: z.string().min(1),
  followUp: opt(z.object({ native: z.string().min(1), english: z.string().min(1) })),
});

export type ExtractProfileInput = z.infer<typeof extractProfileInputSchema>;

/** Fields the engine needs most; if any is null the UI asks the follow-up question. */
export const KEY_FIELDS = ["lastPractisedAt", "credential", "languageProficiency.status", "authorizedToWork"] as const;

export function toProfile(input: ExtractProfileInput): Profile {
  const p = input.progress;
  const upper = (s: string | null | undefined) => (s ? s.toUpperCase() : null);
  const profile: Profile = {
    profession: "nurse",
    targetCategory: input.targetCategory ?? "RN", // v1 pathway is RN only
    countryOfEducation: upper(input.countryOfEducation),
    credential: input.credential ?? null,
    graduationYear: input.graduationYear ?? null,
    lastPractisedAt: input.lastPractisedAt ?? null,
    yearsExperience: input.yearsExperience ?? null,
    currentlyInCanada: input.currentlyInCanada ?? null,
    province: upper(input.province),
    authorizedToWork: input.authorizedToWork ?? null,
    nameOnDocumentsMatches: input.nameOnDocumentsMatches ?? null,
    documentsLanguage: input.documentsLanguage ?? null,
    languageProficiency: {
      status: input.languageProficiency.status ?? null,
      test: input.languageProficiency.test ?? null,
      date: input.languageProficiency.date ?? null,
    },
    progress: {
      ecaStarted: p.ecaStarted ?? null,
      cnoAccountCreated: p.cnoAccountCreated ?? null,
      cnoApplicationSubmitted: p.cnoApplicationSubmitted ?? null,
      ttpCompleted: p.ttpCompleted ?? null,
      jurisprudencePassed: p.jurisprudencePassed ?? null,
      registrationExamPassed: p.registrationExamPassed ?? null,
      criminalRecordCheckDate: p.criminalRecordCheckDate ?? null,
    },
    spokenLanguage: input.spokenLanguage ?? null,
    confidence: {},
  };
  // Keep confidences only for fields that ended up non-null.
  for (const [key, value] of Object.entries(input.confidence)) {
    const v = key.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), profile);
    if (v !== null && v !== undefined) profile.confidence[key] = value;
  }
  return profile;
}

export function missingKeyFields(profile: Profile): string[] {
  const get = (path: string) =>
    path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), profile);
  return KEY_FIELDS.filter((f) => get(f) === null || get(f) === undefined);
}
