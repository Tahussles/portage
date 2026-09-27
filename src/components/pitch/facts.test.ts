import { describe, expect, it } from "vitest";
import profile from "@/data/fixtures/profile-priya.json";
import pathway from "@/data/pathways/on-rn-ien.json";
import type { Profile } from "@/lib/engine/types";
import { dataFacts, priyaFacts } from "./facts";
import { SOURCES } from "./sources";

describe("pitch facts", () => {
  it("reads the problem numbers from data files", () => {
    const f = dataFacts();
    expect(f.requirements).toBe(9);
    expect(f.guidelineMonths).toBe(pathway.guidelineMonths);
    expect(f.applicants).toBe(7957);
    expect(f.applicantsAsOf).toBe("2026-09-01");
  });

  it("computes Priya's plan with the engine", () => {
    const p = priyaFacts(profile as Profile, "2026-09-26");
    expect(p.oneAtATime).toBe("December 2027");
    expect(p.portagePlan).toBe("April 2027");
    expect(p.windowCloses).toBe("July 2027");
    expect(p.tightOnPortagePlan).toBe(true);
    expect(p.criticalOnOneAtATime).toBe(true);
  });

  it("cites every why-now source with an https URL", () => {
    for (const s of Object.values(SOURCES)) expect(s.url).toMatch(/^https:\/\//);
  });
});
