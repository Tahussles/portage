import { INSIGHTS } from "@/components/insights/insights";
import { isTight, viewWarnings } from "@/components/roadmap/warnings-view";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { buildPlan } from "@/lib/engine/plan";
import type { Pathway, Profile } from "@/lib/engine/types";

// Every number on the deck comes from here: data files or the engine, never typed into the slides.

const pathway = pathwayData as unknown as Pathway;

export function monthYear(isoDate: string) {
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    Date.parse(`${isoDate.slice(0, 7)}-01T00:00:00Z`),
  );
}

export function dataFacts() {
  const applicants = INSIGHTS.stats.find((s) => s.id === "international_applicants")!;
  return {
    requirements: INSIGHTS.requirements.items.length,
    requirementsSource: INSIGHTS.requirements.source,
    guidelineMonths: pathway.guidelineMonths ?? null,
    regulator: pathway.regulator,
    applicants: applicants.value,
    applicantsAsOf: applicants.asOf,
    applicantsSource: applicants.source,
  };
}

/** Priya's plan, computed live with the engine from her fixture profile. */
export function priyaFacts(profile: Profile, today: string) {
  const plan = buildPlan(profile, pathway, today);
  const eopParallel = viewWarnings(plan, "parallel").find((v) => v.warning.id === "evidence_of_practice_window");
  const eopSequential = viewWarnings(plan, "sequential").find((v) => v.warning.id === "evidence_of_practice_window");
  const windowCloses = eopSequential?.state.windowCloses ?? eopParallel?.state.windowCloses ?? null;
  return {
    oneAtATime: monthYear(plan.sequential.finishDate),
    portagePlan: monthYear(plan.parallel.finishDate),
    oneAtATimeWeeks: plan.sequential.totalWeeks,
    portagePlanWeeks: plan.parallel.totalWeeks,
    windowCloses: windowCloses ? monthYear(`${windowCloses}-01`) : null,
    tightOnPortagePlan: eopParallel ? isTight(eopParallel) : false,
    criticalOnOneAtATime: eopSequential?.state.kind === "active" && eopSequential.state.severity === "critical",
  };
}
