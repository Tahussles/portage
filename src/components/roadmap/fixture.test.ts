import { describe, expect, it } from "vitest";
import { z } from "zod";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import planData from "@/data/fixtures/plan-priya.provisional.json";
import type { RoadmapPlan } from "./contract";

// zod mirror of Plan plus the provisional contract additions (ranges, side lane).
const status = z.enum(["done", "todo", "not_applicable", "blocked"]);
const localized = z.object({ en: z.string().min(1), fr: z.string().min(1) });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const range = z.object({
  bestWeeks: z.number().nonnegative(),
  typicalWeeks: z.number().nonnegative(),
  conservativeWeeks: z.number().nonnegative(),
  bestFinish: isoDate,
  conservativeFinish: isoDate,
});
const schedule = z.object({
  totalWeeks: z.number().nonnegative(),
  finishDate: isoDate,
  startWeek: z.record(z.string(), z.number().nonnegative()),
  range,
});
const planSchema = z.object({
  statuses: z.record(z.string(), status),
  order: z.array(z.string()),
  sequential: schedule,
  parallel: schedule.extend({ criticalPath: z.array(z.string()) }),
  warnings: z.array(
    z.object({
      id: z.string(),
      severity: z.enum(["info", "warn", "critical"]),
      title: localized,
      body: localized,
      relatedNodes: z.array(z.string()),
      sourceUrl: z.url(),
    }),
  ),
  estimateShare: z.number().min(0).max(1),
  side: z.array(z.object({ nodeId: z.string(), status })),
});

// Compile-time: the zod output must be assignable to the plan type the canvas renders.
const typed: RoadmapPlan = planSchema.parse(planData);

describe("provisional Priya plan fixture", () => {
  const ids = new Set(pathwayData.nodes.map((n) => n.id));

  it("matches the Plan shape", () => {
    expect(planSchema.safeParse(planData).success).toBe(true);
  });

  it("only uses real node ids from the pathway", () => {
    for (const id of [
      ...typed.order,
      ...Object.keys(typed.statuses),
      ...Object.keys(typed.parallel.startWeek),
      ...typed.parallel.criticalPath,
      ...typed.warnings.flatMap((w) => w.relatedNodes),
      ...typed.side.map((s) => s.nodeId),
    ]) {
      expect(ids.has(id), id).toBe(true);
    }
  });

  it("keeps ranges ordered and the parallel plan no longer than one at a time", () => {
    for (const s of [typed.sequential, typed.parallel]) {
      expect(s.range.bestWeeks).toBeLessThanOrEqual(s.range.typicalWeeks);
      expect(s.range.typicalWeeks).toBeLessThanOrEqual(s.range.conservativeWeeks);
      expect(s.range.typicalWeeks).toBe(s.totalWeeks);
    }
    expect(typed.parallel.totalWeeks).toBeLessThanOrEqual(typed.sequential.totalWeeks);
  });

  it("carries one critical evidence-of-practice warning", () => {
    const critical = typed.warnings.filter((w) => w.severity === "critical");
    expect(critical.map((w) => w.id)).toEqual(["evidence_of_practice_window"]);
  });
});
