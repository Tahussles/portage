import { describe, expect, it } from "vitest";
import { z } from "zod";
import insightsJson from "@/data/insights.json";
import pathwayJson from "@/data/pathways/on-rn-ien.json";

// Shape the insights page reads (issue #27), plus the honesty rules: every stat is sourced and
// dated; anything not published by CNO is marked illustrative.
const httpsSource = z.object({ label: z.string().min(1), url: z.url({ protocol: /^https$/ }) });
const insightsSchema = z.object({
  stats: z
    .array(
      z.object({
        id: z.enum(["international_applicants", "spep_registered"]),
        value: z.number().int().nonnegative(),
        total: z.number().int().nonnegative().optional(),
        asOf: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        source: httpsSource,
        illustrative: z.boolean(),
      }),
    )
    .min(1),
  requirements: z.object({ source: httpsSource, items: z.array(z.string().min(1)).length(9) }),
  funnel: z.object({
    illustrative: z.boolean(),
    note: z.string().min(1),
    stages: z.array(z.object({ nodeId: z.string().min(1), share: z.number().min(0).max(1) })).min(2),
  }),
});

const insights = insightsSchema.parse(insightsJson);

describe("insights.json", () => {
  it("parses with the page's shape", () => {
    expect(insightsSchema.safeParse(insightsJson).success).toBe(true);
  });

  it("holds the real CNO numbers from docs/PATHWAY_VERIFIED.md section 10", () => {
    const byId = Object.fromEntries(insights.stats.map((s) => [s.id, s]));
    expect(byId.international_applicants).toMatchObject({ value: 7957, total: 14298, asOf: "2026-09-01", illustrative: false });
    expect(byId.spep_registered).toMatchObject({ value: 6738, total: 8406, asOf: "2026-09-18", illustrative: false });
    for (const s of insights.stats) expect(s.value).toBeLessThanOrEqual(s.total ?? Infinity);
  });

  it("marks the funnel illustrative, since CNO publishes no per-stage counts", () => {
    expect(insights.funnel.illustrative).toBe(true);
  });

  it("uses real pathway nodes and never grows down the funnel", () => {
    const ids = new Set(pathwayJson.nodes.map((n) => n.id));
    const stages = insights.funnel.stages;
    for (const s of stages) expect(ids.has(s.nodeId), s.nodeId).toBe(true);
    for (let i = 1; i < stages.length; i++) expect(stages[i].share).toBeLessThanOrEqual(stages[i - 1].share);
  });
});
