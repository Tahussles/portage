import { describe, expect, it } from "vitest";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import planData from "@/data/fixtures/plan-priya.json";
import type { Pathway, Plan } from "@/lib/engine/types";
import {
  NODE_WIDTH,
  WEEK_PX,
  buildEdges,
  layoutParallel,
  layoutSequential,
  type RoadmapLayout,
} from "./layout";

const pathway = pathwayData as unknown as Pathway;
const plan = planData as unknown as Plan;

function overlaps(layout: RoadmapLayout): string[] {
  const ids = Object.keys(layout.positions);
  const hits: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = layout.positions[ids[i]];
      const b = layout.positions[ids[j]];
      const apart =
        a.x + NODE_WIDTH <= b.x ||
        b.x + NODE_WIDTH <= a.x ||
        a.y + layout.nodeHeight <= b.y ||
        b.y + layout.nodeHeight <= a.y;
      if (!apart) hits.push(`${ids[i]} / ${ids[j]}`);
    }
  }
  return hits;
}

/** A dense synthetic plan: many steps start in the same weeks, plus a side lane. */
function densePlan(): { plan: Plan; pathway: Pathway } {
  const base = pathway.nodes[0];
  const nodes = Array.from({ length: 24 }, (_, i) => ({
    ...base,
    id: `n${i}`,
    dependsOn: i === 0 ? [] : [`n${Math.floor((i - 1) / 3)}`],
    lane: "main" as const,
  }));
  const side = ["s0", "s1", "s2"].map((id) => ({ ...base, id, dependsOn: [], lane: "side" as const }));
  const startWeek = Object.fromEntries(nodes.map((n, i) => [n.id, Math.floor(i / 3) * 1.5]));
  const dense: Plan = {
    ...plan,
    statuses: Object.fromEntries(nodes.map((n) => [n.id, "todo"])),
    order: nodes.map((n) => n.id),
    parallel: { ...plan.parallel, startWeek, criticalPath: ["n0", "n1", "n4"] },
    side: side.map((s) => ({ nodeId: s.id, status: "todo" })),
  };
  return { plan: dense, pathway: { ...pathway, nodes: [...nodes, ...side] } };
}

describe("roadmap layouts", () => {
  it("never overlaps cards in either layout", () => {
    expect(overlaps(layoutSequential(plan, pathway))).toEqual([]);
    expect(overlaps(layoutParallel(plan, pathway))).toEqual([]);
    const dense = densePlan();
    expect(overlaps(layoutSequential(dense.plan, dense.pathway))).toEqual([]);
    expect(overlaps(layoutParallel(dense.plan, dense.pathway))).toEqual([]);
  });

  it("places parallel x exactly at startWeek and monotonic with it", () => {
    for (const { plan: p, pathway: pw } of [{ plan, pathway }, densePlan()]) {
      const layout = layoutParallel(p, pw);
      for (const id of layout.mainIds) {
        expect(layout.positions[id].x).toBeCloseTo((p.parallel.startWeek[id] ?? 0) * WEEK_PX);
      }
      const byWeek = [...layout.mainIds].sort(
        (a, b) => p.parallel.startWeek[a] - p.parallel.startWeek[b],
      );
      const xs = byWeek.map((id) => layout.positions[id].x);
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
    }
  });

  it("lays the sequential route out as serpentine rows of four in plan order", () => {
    const layout = layoutSequential(plan, pathway);
    const [first, second, , fourth, fifth] = layout.mainIds.map((id) => layout.positions[id]);
    expect(second.x).toBeGreaterThan(first.x);
    expect(fifth.y).toBeGreaterThan(fourth.y);
    expect(fifth.x).toBe(fourth.x);
  });

  it("stacks the route in one column on phones", () => {
    const layout = layoutSequential(plan, pathway, 1);
    expect(new Set(layout.mainIds.map((id) => layout.positions[id].x))).toEqual(new Set([0]));
    expect(overlaps(layout)).toEqual([]);
  });

  it("hides not-applicable steps", () => {
    const skipped: Plan = {
      ...plan,
      statuses: { ...plan.statuses, translations: "not_applicable" },
    };
    expect(layoutSequential(plan, pathway).positions.translations).toBeDefined();
    expect(layoutSequential(skipped, pathway).positions.translations).toBeUndefined();
    expect(layoutParallel(skipped, pathway).positions.translations).toBeUndefined();
  });

  it("puts the side lane below every main-lane card", () => {
    const dense = densePlan();
    for (const layout of [
      layoutSequential(dense.plan, dense.pathway),
      layoutParallel(dense.plan, dense.pathway),
    ]) {
      expect(layout.sideIds).toEqual(["s0", "s1", "s2"]);
      const mainBottom =
        Math.max(...layout.mainIds.map((id) => layout.positions[id].y)) + layout.nodeHeight;
      expect(layout.sideLaneY).toBeGreaterThan(mainBottom);
      for (const id of layout.sideIds) expect(layout.positions[id].y).toBe(layout.sideLaneY);
    }
  });

  it("marks the tight critical chain red in parallel mode", () => {
    const edges = buildEdges(layoutParallel(plan, pathway), plan, pathway);
    const red = edges.filter((e) => e.critical).map((e) => e.id);
    expect(red).toEqual(
      expect.arrayContaining([
        "eca->cno_application",
        "cno_application->registration_exam",
        "registration_exam->registration",
      ]),
    );
    expect(red).not.toContain("cno_application->jurisprudence");
  });
});
