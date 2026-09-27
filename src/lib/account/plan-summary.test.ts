import { describe, expect, it } from "vitest";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { profileFixture } from "@/lib/demo";
import type { Pathway } from "@/lib/engine/types";
import { summarizePlan } from "./plan-summary";

const pathway = pathwayData as unknown as Pathway;

describe("profile plan summary", () => {
  it("summarises Priya's Portage plan: April 2027, tight, starting with her school documents", () => {
    const s = summarizePlan(profileFixture().profile, pathway, "2026-09-26");
    expect(s.finish.slice(0, 7)).toBe("2027-04");
    expect(s.state).toBe("tight");
    expect(s.done).toBe(0);
    expect(s.total).toBeGreaterThan(8);
    expect(s.next?.id).toBe("school_documents");
  });

  it("counts steps the person has already done", () => {
    const p = profileFixture().profile;
    const s = summarizePlan({ ...p, progress: { ...p.progress, cnoAccountCreated: true, ecaStarted: true } }, pathway, "2026-09-26");
    expect(s.done).toBeGreaterThan(0);
  });

  it("reports a lost window as critical", () => {
    const p = { ...profileFixture().profile, lastPractisedAt: "2023-01" };
    expect(summarizePlan(p, pathway, "2026-09-26").state).toBe("critical");
  });
});
