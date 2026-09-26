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

// Priya on data v1.1.0: window closes Jul 2027; one at a time finishes Dec 2027 (critical);
// the Portage plan finishes Apr 2027 typical but Aug 2027 conservative (warn, "tight").
const plan = planData as unknown as RoadmapPlan;
const EOP = "evidence_of_practice_window";
const eopDef = plan.warnings.find((w) => w.id === EOP)!;

/** The same warning if the Portage plan were comfortably inside the window. */
const sequentialOnly: RoadmapWarning = {
  ...eopDef,
  schedules: ["sequential"],
  severityBySchedule: { sequential: "critical" },
};
const withWarnings = (...warnings: RoadmapWarning[]): RoadmapPlan => ({ ...plan, warnings });

const find = (views: ReturnType<typeof viewWarnings>, id: string) => views.find((v) => v.warning.id === id);
const en = (key: MessageKey, vars?: MessageVars) => translate("en", key, vars);
const fr = (key: MessageKey, vars?: MessageVars) => translate("fr", key, vars);

describe("warnings per schedule", () => {
  it("raises evidence of practice as critical when steps run one at a time", () => {
    expect(find(viewWarnings(plan, "sequential"), EOP)?.state).toEqual({
      kind: "active",
      severity: "critical",
      finish: "2027-12",
      windowCloses: "2027-07",
    });
  });

  it("marks the Portage plan as tight when only the conservative finish misses the window", () => {
    expect(find(viewWarnings(plan, "parallel"), EOP)?.state).toEqual({
      kind: "active",
      severity: "warn",
      finish: "2027-04",
      windowCloses: "2027-07",
    });
  });

  it("shows a warning only one at a time raises as resolved in the Portage plan", () => {
    const view = viewWarnings(withWarnings(sequentialOnly), "parallel")[0];
    expect(view.state).toEqual({ kind: "resolved", finish: "2027-04", windowCloses: "2027-07", monthsEarly: 3 });
  });

  it("keeps warnings without `schedules` active on both schedules", () => {
    for (const schedule of ["sequential", "parallel"] as const) {
      expect(find(viewWarnings(plan, schedule), "direct_from_source")?.state.kind).toBe("active");
    }
  });

  it("keeps the same order on both schedules so cards do not jump", () => {
    const ids = (s: "sequential" | "parallel") => viewWarnings(plan, s).map((v) => v.warning.id);
    expect(ids("parallel")).toEqual(ids("sequential"));
  });

  it("hides a warning that only the Portage plan raises when viewing one at a time", () => {
    const onlyParallel: RoadmapWarning = { ...eopDef, id: "only_parallel", schedules: ["parallel"] };
    expect(viewWarnings(withWarnings(onlyParallel), "sequential")).toEqual([]);
  });

  it("reads per-schedule severity, falling back to the base severity", () => {
    expect(severityIn(eopDef, "parallel")).toBe("warn");
    expect(severityIn(eopDef, "sequential")).toBe("critical");
    expect(severityIn({ ...eopDef, severityBySchedule: undefined }, "parallel")).toBe("critical");
    expect(firesIn(sequentialOnly, "parallel")).toBe(false);
  });

  it("rings the evidence-of-practice step only where its warning fires", () => {
    expect(flaggedNodes(viewWarnings(plan, "sequential")).has("evidence_of_practice")).toBe(true);
    expect(flaggedNodes(viewWarnings(plan, "parallel")).has("evidence_of_practice")).toBe(true); // tight
    expect(flaggedNodes(viewWarnings(withWarnings(sequentialOnly), "parallel")).has("evidence_of_practice")).toBe(false);
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
  it("adds the dates under a critical warning", () => {
    const copy = warningCopy(find(viewWarnings(plan, "sequential"), EOP)!, en, "en");
    expect(copy.facts).toBe("Your window closes in Jul 2027. This plan finishes in Dec 2027.");
    expect(copy.label).toBeUndefined();
  });

  it("explains a tight plan with dates", () => {
    const copy = warningCopy(find(viewWarnings(plan, "parallel"), EOP)!, en, "en");
    expect(copy.label).toBe("Tight: only if each step goes to plan");
    expect(copy.body).toBe(
      "This plan finishes in Apr 2027, before your window closes in Jul 2027, but only if each step goes to plan.",
    );
    expect(copy.facts).toBeUndefined();
  });

  it("explains the resolved state with the months to spare, in both languages", () => {
    const view = viewWarnings(withWarnings(sequentialOnly), "parallel")[0];
    expect(warningCopy(view, en, "en")).toMatchObject({
      label: "Resolved in the Portage plan · Résolu dans le plan Portage",
      body: "Finishes Apr 2027, 3 months before your window closes in Jul 2027.",
    });
    expect(warningCopy(view, fr, "fr").body).toBe(
      "Se termine en avr. 2027, 3 mois avant la fin de votre période en juill. 2027.",
    );
  });
});
