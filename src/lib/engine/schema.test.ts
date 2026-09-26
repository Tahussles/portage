import { describe, expect, it } from "vitest";
import pathwayJson from "@/data/pathways/on-rn-ien.json";
import { pathwaySchema } from "./schema";
import type { PathwayNode } from "./types";

const pathway = pathwaySchema.parse(pathwayJson);
const ids = new Set(pathway.nodes.map((n) => n.id));

function findCycle(nodes: PathwayNode[]): string[] | null {
  const deps = new Map(nodes.map((n) => [n.id, n.dependsOn]));
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];

  const visit = (id: string): string[] | null => {
    if (state.get(id) === "done") return null;
    if (state.get(id) === "visiting") return [...stack.slice(stack.indexOf(id)), id];
    state.set(id, "visiting");
    stack.push(id);
    for (const dep of deps.get(id) ?? []) {
      const cycle = visit(dep);
      if (cycle) return cycle;
    }
    stack.pop();
    state.set(id, "done");
    return null;
  };

  for (const n of nodes) {
    const cycle = visit(n.id);
    if (cycle) return cycle;
  }
  return null;
}

describe("on-rn-ien pathway data", () => {
  it("parses with the pathway schema", () => {
    expect(pathwaySchema.safeParse(pathwayJson).success).toBe(true);
  });

  it("has unique node ids", () => {
    expect(ids.size).toBe(pathway.nodes.length);
  });

  it("references only existing nodes in dependsOn", () => {
    const missing = pathway.nodes.flatMap((n) =>
      n.dependsOn.filter((d) => !ids.has(d)).map((d) => `${n.id} -> ${d}`),
    );
    expect(missing).toEqual([]);
  });

  it("never makes a main-lane node depend on a side-lane node", () => {
    const side = new Set(pathway.nodes.filter((n) => n.lane === "side").map((n) => n.id));
    const bad = pathway.nodes
      .filter((n) => (n.lane ?? "main") === "main")
      .flatMap((n) => n.dependsOn.filter((d) => side.has(d)).map((d) => `${n.id} -> ${d}`));
    expect(bad).toEqual([]);
  });

  it("has no dependency cycles", () => {
    expect(findCycle(pathway.nodes)).toBeNull();
  });

  it("gives every node at least one https source", () => {
    const unsourced = pathway.nodes
      .filter((n) => n.sources.length === 0 || n.sources.some((s) => !s.url.startsWith("https://")))
      .map((n) => n.id);
    expect(unsourced).toEqual([]);
  });

  it("tags every duration with a kind and a note", () => {
    for (const n of pathway.nodes) {
      expect(["official", "estimate"], n.id).toContain(n.duration.kind);
      expect(n.duration.note.trim().length, n.id).toBeGreaterThan(0);
    }
  });

  it("keeps typicalWeeks within [minWeeks, maxWeeks]", () => {
    const outOfRange = pathway.nodes
      .filter(
        (n) =>
          n.duration.typicalWeeks < n.duration.minWeeks ||
          n.duration.typicalWeeks > n.duration.maxWeeks,
      )
      .map((n) => n.id);
    expect(outOfRange).toEqual([]);
  });

  it("points warnings at existing nodes", () => {
    const missing = pathway.warnings.flatMap((w) =>
      w.relatedNodes.filter((id) => !ids.has(id)).map((id) => `${w.id} -> ${id}`),
    );
    expect(missing).toEqual([]);
  });

  it("rejects a node without sources", () => {
    const broken = structuredClone(pathwayJson) as { nodes: { sources: unknown[] }[] };
    broken.nodes[0].sources = [];
    expect(pathwaySchema.safeParse(broken).success).toBe(false);
  });
});
