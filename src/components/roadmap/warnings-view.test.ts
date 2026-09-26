import { describe, expect, it } from "vitest";
import planData from "@/data/fixtures/plan-priya.provisional.json";
import { translate, type MessageKey, type MessageVars } from "@/lib/i18n";
import type { RoadmapPlan, RoadmapWarning } from "./contract";
import {
  firesIn,
  flaggedNodes,
  monthsBetween,
  severityIn,
  viewWarnings,
  warningCopy,
} from "./warnings-view";

const plan = planData as unknown as RoadmapPlan;
const EOP = "evidence_of_practice_window";

const find = (views: ReturnType<typeof viewWarnings>, id: string) => views.find((v) => v.warning.id === id);

describe("warnings per schedule", () => {
  it("raises evidence of practice as critical when steps run one at a time", () => {
    const eop = find(viewWarnings(plan, "sequential"), EOP);
    expect(eop?.state).toEqual({
      kind: "active",
      severity: "critical",
      finish: "2027-11",
      windowCloses: "2027-07",
    });
  });

  it("shows it as resolved in the Portage plan, with the months to spare", () => {
    const eop = find(viewWarnings(plan, "parallel"), EOP);
    expect(eop?.state).toEqual({
      kind: "resolved",
      finish: "2027-02",
      windowCloses: "2027-07",
      monthsEarly: 5,
    });
  });

  it("keeps warnings without `schedules` active on both schedules", () => {
    for (const schedule of ["sequential", "parallel"] as const) {
      const direct = find(viewWarnings(plan, schedule), "direct_from_source");
      expect(direct?.state.kind).toBe("active");
    }
  });

  it("keeps the same order on both schedules so cards do not jump", () => {
    const ids = (s: "sequential" | "parallel") => viewWarnings(plan, s).map((v) => v.warning.id);
    expect(ids("parallel")).toEqual(ids("sequential"));
  });

  it("hides a warning that only the Portage plan raises when viewing one at a time", () => {
    const onlyParallel: RoadmapWarning = { ...plan.warnings[0], id: "only_parallel", schedules: ["parallel"] };
    const views = viewWarnings({ ...plan, warnings: [onlyParallel] }, "sequential");
    expect(views).toEqual([]);
  });

  it("uses the per-schedule severity for a tight plan", () => {
    const tight: RoadmapWarning = {
      ...plan.warnings[0],
      schedules: ["sequential", "parallel"],
      severityBySchedule: { sequential: "critical", parallel: "warn" },
    };
    expect(severityIn(tight, "parallel")).toBe("warn");
    expect(severityIn(tight, "sequential")).toBe("critical");
    expect(firesIn(tight, "parallel")).toBe(true);
    const view = viewWarnings({ ...plan, warnings: [tight] }, "parallel")[0];
    expect(view.state).toMatchObject({ kind: "active", severity: "warn" });
  });

  it("rings the evidence-of-practice step only where its warning fires", () => {
    expect(flaggedNodes(viewWarnings(plan, "sequential")).has("evidence_of_practice")).toBe(true);
    expect(flaggedNodes(viewWarnings(plan, "parallel")).has("evidence_of_practice")).toBe(false);
  });

  it("never rings steps for info warnings", () => {
    const flagged = flaggedNodes(viewWarnings(plan, "parallel"));
    expect(flagged.has("third_party_docs")).toBe(false);
    expect(flagged.has("translations")).toBe(false);
  });

  it("counts whole calendar months", () => {
    expect(monthsBetween("2027-02", "2027-07")).toBe(5);
    expect(monthsBetween("2026-11", "2027-01")).toBe(2);
    expect(monthsBetween("2027-11", "2027-07")).toBe(-4);
  });
});

describe("warning copy", () => {
  const en = (key: MessageKey, vars?: MessageVars) => translate("en", key, vars);
  const fr = (key: MessageKey, vars?: MessageVars) => translate("fr", key, vars);

  it("explains the resolved state with dates", () => {
    const eop = find(viewWarnings(plan, "parallel"), EOP)!;
    expect(warningCopy(eop, en, "en")).toMatchObject({
      label: "Resolved in the Portage plan · Résolu dans le plan Portage",
      body: "Finishes Feb 2027, 5 months before your window closes in Jul 2027.",
    });
    expect(warningCopy(eop, fr, "fr").body).toBe(
      "Se termine en févr. 2027, 5 mois avant la fin de votre période en juill. 2027.",
    );
  });

  it("adds the dates under an active warning", () => {
    const eop = find(viewWarnings(plan, "sequential"), EOP)!;
    const copy = warningCopy(eop, en, "en");
    expect(copy.facts).toBe("Your window closes in Jul 2027. This plan finishes in Nov 2027.");
    expect(copy.label).toBeUndefined();
  });

  it("labels a tight plan", () => {
    const tight: RoadmapWarning = {
      ...plan.warnings[0],
      schedules: ["sequential", "parallel"],
      severityBySchedule: { sequential: "critical", parallel: "warn" },
    };
    const view = viewWarnings({ ...plan, warnings: [tight] }, "parallel")[0];
    expect(warningCopy(view, en, "en").label).toBe("Tight: only if each step goes to plan");
  });
});
