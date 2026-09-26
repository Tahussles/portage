import { z } from "zod";
import type { Pathway, PathwayNode, Rule } from "./types";

const httpsUrl = z.url({ protocol: /^https$/ });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

export const localizedSchema = z.object({
  en: z.string().min(1),
  fr: z.string().min(1),
});

export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
  z.union([
    z.object({ all: z.array(ruleSchema) }).strict(),
    z.object({ any: z.array(ruleSchema) }).strict(),
    z.object({ not: ruleSchema }).strict(),
    z
      .object({
        field: z.string().min(1),
        op: z.enum(["eq", "neq", "in", "truthy", "falsy"]),
        value: z.unknown().optional(),
      })
      .strict(),
  ]),
);

export const actorSchema = z.enum(["you", "cno", "third_party", "school", "test_provider"]);

export const durationSchema = z
  .object({
    minWeeks: z.number().nonnegative(),
    typicalWeeks: z.number().nonnegative(),
    maxWeeks: z.number().nonnegative(),
    kind: z.enum(["official", "estimate"]),
    note: z.string().min(1),
  })
  .refine((d) => d.minWeeks <= d.typicalWeeks && d.typicalWeeks <= d.maxWeeks, {
    message: "typicalWeeks must be within [minWeeks, maxWeeks]",
  });

export const costSchema = z.object({
  amountCad: z.number().nonnegative().nullable(),
  note: z.string().min(1),
  kind: z.enum(["official", "estimate", "unknown"]),
});

export const sourceSchema = z.object({
  label: z.string().min(1),
  url: httpsUrl,
  accessed: isoDate,
});

export const pathwayNodeSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  title: localizedSchema,
  summary: localizedSchema,
  actor: z.array(actorSchema).min(1),
  dependsOn: z.array(z.string()),
  duration: durationSchema,
  cost: costSchema.optional(),
  appliesIf: ruleSchema.optional(),
  doneIf: ruleSchema.optional(),
  canStartBeforeArrival: z.boolean().optional(),
  scheduleHint: z.enum(["asap", "late"]).optional(),
  lane: z.enum(["main", "side"]).optional(),
  sources: z.array(sourceSchema).min(1),
});

// Warning definitions. `types.ts` keeps WarningRuleDef open ({ id } & Record<string, unknown>);
// this is the concrete shape the pathway data uses and the engine (Step 3a) reads.
//   profile_rule                    fires when `appliesIf` matches the profile (always, if omitted)
//   evidence_of_practice_window     fires when lastPractisedAt + params.windowMonths < projected finish
//   criminal_record_check_validity  fires when a check dated in the profile is older than params.validityMonths at projected submission
//   application_window              fires when weeks from params.fromNode finishing to overall finish exceed params.windowWeeks
export const warningTriggerSchema = z.enum([
  "profile_rule",
  "evidence_of_practice_window",
  "criminal_record_check_validity",
  "application_window",
]);

export const warningRuleDefSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9_]*$/),
  severity: z.enum(["info", "warn", "critical"]),
  trigger: warningTriggerSchema,
  params: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  appliesIf: ruleSchema.optional(),
  title: localizedSchema,
  body: localizedSchema,
  relatedNodes: z.array(z.string()),
  sourceUrl: httpsUrl,
});

export const pathwaySchema = z.object({
  id: z.literal("on-rn-ien"),
  version: z.string().min(1),
  lastReviewed: isoDate,
  regulator: z.object({ name: z.string().min(1), url: httpsUrl }),
  guidelineMonths: z.number().positive().optional(),
  nodes: z.array(pathwayNodeSchema).min(1),
  warnings: z.array(warningRuleDefSchema),
});

export type WarningRuleDefData = z.infer<typeof warningRuleDefSchema>;

// Compile-time guard: the schema output must stay assignable to the shared types.
type Assert<T extends true> = T;
export type SchemaMatchesTypes = Assert<
  z.infer<typeof pathwaySchema> extends Pathway
    ? z.infer<typeof pathwayNodeSchema> extends PathwayNode
      ? true
      : false
    : false
>;

export function parsePathway(data: unknown): Pathway {
  return pathwaySchema.parse(data);
}
