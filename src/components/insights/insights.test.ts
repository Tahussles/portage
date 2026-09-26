import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import pathway from "@/data/pathways/on-rn-ien.json";
import { INSIGHTS, LIVE_PROVINCES, formatAsOf, formatCount, funnelBars, type ProvinceMapData } from "./insights";

describe("insights data", () => {
  it("only shows sourced numbers, each with an as-of date", () => {
    for (const stat of INSIGHTS.stats) {
      expect(stat.source.url).toMatch(/^https:\/\/www\.cno\.org\//);
      expect(stat.illustrative).toBeUndefined();
    }
    expect(INSIGHTS.stats.find((s) => s.id === "international_applicants")).toMatchObject({
      value: 7957,
      total: 14298,
      asOf: "2026-09-01",
    });
  });

  it("marks the stage funnel as illustrative and uses real pathway steps", () => {
    expect(INSIGHTS.funnel.illustrative).toBe(true);
    const ids = new Set(pathway.nodes.map((n) => n.id));
    for (const stage of INSIGHTS.funnel.stages) expect(ids.has(stage.nodeId)).toBe(true);
  });
});

describe("funnel", () => {
  it("marks the single biggest drop", () => {
    const bars = funnelBars(INSIGHTS.funnel.stages);
    const biggest = bars.filter((b) => b.biggestDrop);
    expect(biggest.map((b) => b.nodeId)).toEqual(["evidence_of_practice"]);
    expect(bars[0].drop).toBe(0);
  });

  it("never marks a drop when shares do not fall", () => {
    const flat = funnelBars([
      { nodeId: "a", share: 1 },
      { nodeId: "b", share: 1 },
    ]);
    expect(flat.some((b) => b.biggestDrop)).toBe(false);
  });
});

describe("formatting", () => {
  it("formats counts and dates per locale", () => {
    expect(formatCount(7957, "en")).toBe("7,957");
    expect(formatCount(7957, "fr").replace(/\s/g, " ")).toBe("7 957");
    expect(formatAsOf("2026-09-01", "en")).toBe("September 1, 2026");
    expect(formatAsOf("2026-09-01", "fr")).toBe("1 septembre 2026");
  });
});

describe("province map file", () => {
  const map: ProvinceMapData = JSON.parse(readFileSync("public/geo/canada-provinces.json", "utf8"));

  it("has all 13 provinces and territories with French names, under 150 KB", () => {
    expect(map.provinces).toHaveLength(13);
    expect(map.provinces.find((p) => p.code === "QC")?.name.fr).toBe("Québec");
    expect(readFileSync("public/geo/canada-provinces.json").byteLength).toBeLessThan(150 * 1024);
    expect([...LIVE_PROVINCES].every((c) => map.provinces.some((p) => p.code === c))).toBe(true);
  });
});

describe("requirements", () => {
  it("lists CNO's registration requirements with the official source", () => {
    expect(INSIGHTS.requirements.items).toHaveLength(9);
    expect(new Set(INSIGHTS.requirements.items).size).toBe(9);
    expect(INSIGHTS.requirements.source.url).toBe("https://www.cno.org/become-a-nurse/registration-guides/outside-canada");
  });
});
