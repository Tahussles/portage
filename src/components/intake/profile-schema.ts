import { z } from "zod";
import type { Profile } from "@/lib/engine/types";

// zod mirror of Profile (docs/ARCHITECTURE.md section 4) for the intake's API boundary.
// TODO(api): drop this once Ebrahim's client helpers in src/lib/client/api.ts validate responses.

const yearMonth = z.string().regex(/^\d{4}-\d{2}(-\d{2})?$/, "expected YYYY-MM or YYYY-MM-DD");

export const profileSchema = z.object({
  profession: z.literal("nurse"),
  targetCategory: z.enum(["RN", "RPN"]),
  countryOfEducation: z.string().nullable(),
  credential: z.enum(["bachelor", "diploma", "other"]).nullable(),
  graduationYear: z.number().int().nullable(),
  lastPractisedAt: yearMonth.nullable(),
  yearsExperience: z.number().nonnegative().nullable(),
  currentlyInCanada: z.boolean().nullable(),
  province: z.string().nullable(),
  authorizedToWork: z.enum(["yes", "no", "unsure"]).nullable(),
  nameOnDocumentsMatches: z.boolean().nullable(),
  documentsLanguage: z.enum(["en", "fr", "other", "mixed"]).nullable(),
  languageProficiency: z.object({
    status: z.enum(["none", "booked", "passed", "via_education_or_work"]).nullable(),
    test: z.enum(["IELTS", "CELBAN", "OET", "PTE", "TEF", "TCF"]).nullable().optional(),
    date: yearMonth.nullable().optional(),
  }),
  progress: z.object({
    ecaStarted: z.boolean().nullable(),
    cnoAccountCreated: z.boolean().nullable(),
    cnoApplicationSubmitted: z.boolean().nullable(),
    ttpCompleted: z.boolean().nullable(),
    jurisprudencePassed: z.boolean().nullable(),
    registrationExamPassed: z.boolean().nullable(),
    criminalRecordCheckDate: yearMonth.nullable(),
  }),
  spokenLanguage: z.string().nullable(),
  confidence: z.record(z.string(), z.number().min(0).max(1)),
}) satisfies z.ZodType<Profile>;

/** POST /api/transcribe `data` (ARCHITECTURE section 5). */
export const transcriptSchema = z.object({
  text: z.string().min(1),
  languageCode: z.string().min(2),
  languageProbability: z.number().optional(),
});

/** POST /api/profile `data` (ARCHITECTURE section 5). */
export const extractionSchema = z.object({
  profile: profileSchema,
  englishTranslation: z.string(),
  missingFields: z.array(z.string()),
  followUp: z.object({ native: z.string(), english: z.string() }).optional(),
});

export type Transcript = z.infer<typeof transcriptSchema>;
export type Extraction = z.infer<typeof extractionSchema>;

/** Every route answers `{ ok, data?, error?, fallback? }`. */
export function envelopeSchema<T extends z.ZodType>(data: T) {
  return z.object({
    ok: z.boolean(),
    data: data.optional(),
    error: z.string().optional(),
    fallback: z.boolean().optional(),
  });
}
