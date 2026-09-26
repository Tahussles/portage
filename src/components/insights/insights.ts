import { z } from "zod";
import insightsData from "@/data/insights.provisional.json";
import type { Locale } from "@/lib/engine/types";
import { htmlLang } from "@/lib/i18n";

// TODO(data): read src/data/insights.json once it exists (issue #27); drop the provisional copy.

const sourceSchema = z.object({ label: z.string().min(1), url: z.url() });

export const insightsSchema = z.object({
  stats: z.array(
    z.object({
      id: z.enum(["international_applicants", "spep_registered"]),
      value: z.number().int().nonnegative(),
      total: z.number().int().nonnegative().optional(),
      asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      source: sourceSchema,
      illustrative: z.boolean().optional(),
    }),
  ),
  funnel: z.object({
    illustrative: z.boolean(),
    stages: z.array(z.object({ nodeId: z.string().min(1), share: z.number().min(0).max(1) })).min(2),
  }),
});

export type Insights = z.infer<typeof insightsSchema>;

export const INSIGHTS: Insights = insightsSchema.parse(insightsData);

export function formatCount(n: number, locale: Locale) {
  return new Intl.NumberFormat(htmlLang[locale]).format(n);
}

export function formatAsOf(isoDate: string, locale: Locale) {
  return new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: "long", timeZone: "UTC" }).format(
    Date.parse(`${isoDate}T00:00:00Z`),
  );
}

export type FunnelBar = { nodeId: string; share: number; drop: number; biggestDrop: boolean };

/** Bars for the stage funnel; the stage that loses the most applicants is marked (it is drawn red). */
export function funnelBars(stages: Insights["funnel"]["stages"]): FunnelBar[] {
  const drops = stages.map((s, i) => (i === 0 ? 0 : Math.max(0, stages[i - 1].share - s.share)));
  const max = Math.max(...drops);
  return stages.map((s, i) => ({
    nodeId: s.nodeId,
    share: s.share,
    drop: drops[i],
    biggestDrop: max > 0 && drops[i] === max,
  }));
}

export type Province = { code: string; name: { en: string; fr: string }; d: string };
export type ProvinceMapData = { source: string; viewBox: string; provinces: Province[] };

/** v1 covers Ontario (CNO) only. */
export const LIVE_PROVINCES = new Set(["ON"]);
