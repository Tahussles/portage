import { describe, expect, it } from "vitest";
import planData from "@/data/fixtures/plan-priya.json";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import type { Pathway, Plan, PlanWarning } from "@/lib/engine/types";
import { buildSummary } from "./summary";

const plan = planData as unknown as Plan;
const pathway = pathwayData as unknown as Pathway;
const EOP = "evidence_of_practice_window";

describe("spoken plan summary", () => {
  it("summarizes Priya's Portage plan from engine data only", () => {
    const text = buildSummary(plan, pathway, "parallel");
    expect(text).toContain("With the Portage plan, your earliest licence is April 2027, if each step goes to plan.");
    expect(text).toContain("It is tight: your evidence of practice window closes in July 2027.");
    expect(text).toContain("Start now: ask your nursing school to send your documents to the assessment provider.");
    expect(text).toMatch(/In week \d+: get your nursing education assessed by a CNO-approved provider\./);
    expect(text.endsWith("Always confirm each step with the College of Nurses of Ontario.")).toBe(true);
  });

  it("says the window closes first when steps run one at a time", () => {
    const text = buildSummary(plan, pathway, "sequential");
    expect(text).toContain("Doing one step at a time, your earliest licence is December 2027.");
    expect(text).toContain("Your evidence of practice window closes in July 2027, before this plan finishes.");
    expect(text).toMatch(/Your first steps\. Start now: /);
  });

  it("mentions the SPEP backup only when the engine provides it", () => {
    const withoutBackup: Plan = {
      ...plan,
      warnings: plan.warnings.map((w) => (w.id === EOP ? { ...w, facts: { windowCloses: "2027-07" } } : w)),
    };
    expect(buildSummary(withoutBackup, pathway, "parallel")).not.toContain("Supervised Practice");
    const withBackup: Plan = {
      ...plan,
      warnings: plan.warnings.map((w): PlanWarning =>
        w.id === EOP
          ? {
              ...w,
              facts: { windowCloses: "2027-07", backup: "spep", backupEligibleUntil: "2032-07", backupSourceUrl: "https://www.cno.org/x" },
            }
          : w,
      ),
    };
    expect(buildSummary(withBackup, pathway, "parallel")).toContain(
      "If anything slips, the Supervised Practice Experience Partnership is open to you until July 2032.",
    );
  });

  it("uses no em dashes and keeps Canadian spelling", () => {
    const text = buildSummary(plan, pathway, "parallel");
    expect(text).not.toContain("—");
    expect(text).toContain("licence");
  });

  it("keeps the short version to the licence, the window and the first step", () => {
    expect(buildSummary(plan, pathway, "parallel", "short")).toBe(
      "Your earliest licence is April 2027, if each step goes to plan. " +
        "It is tight: your practice window closes in July 2027. " +
        "Start now: ask your nursing school to send your documents to the assessment provider.",
    );
    expect(buildSummary(plan, pathway, "sequential", "short")).toBe(
      "One step at a time, your earliest licence is December 2027. " +
        "But your practice window closes in July 2027, before then. " +
        "Start now: create your CNO online account.",
    );
  });

  it("makes the short version much shorter than the full one", () => {
    const short = buildSummary(plan, pathway, "parallel", "short");
    const full = buildSummary(plan, pathway, "parallel");
    expect(short.length).toBeLessThan(full.length / 2);
    expect(short.split(/\s+/).length).toBeLessThanOrEqual(36); // about 15 s in English at the voice's pace
  });
});
