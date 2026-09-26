import { getApplicability } from "./applicability";
import { addWeeks, toIsoDate, toUtcDate } from "./dates";
import { schedule } from "./schedule";
import type { Pathway, Plan, Profile } from "./types";
import { evaluateWarnings } from "./warnings";

/**
 * Builds a personal plan. Pure: the same inputs always give the same plan.
 * `today` is "YYYY-MM-DD" (or a Date); finish dates are ISO dates the UI shows as month and year.
 */
export function buildPlan(profile: Profile, pathway: Pathway, today: string | Date): Plan {
  const start = toUtcDate(today);
  const { statuses } = getApplicability(profile, pathway, start);
  const sched = schedule(pathway.nodes, statuses);
  const byId = new Map(pathway.nodes.map((n) => [n.id, n]));

  const total = sched.parallel.totalWeeks;
  const estimateWeeks = sched.parallel.criticalPath
    .map((id) => byId.get(id)!.duration)
    .filter((d) => d.kind === "estimate")
    .reduce((sum, d) => sum + d.typicalWeeks, 0);

  return {
    statuses,
    order: sched.order,
    sequential: {
      totalWeeks: sched.sequential.totalWeeks,
      finishDate: toIsoDate(addWeeks(start, sched.sequential.totalWeeks)),
      startWeek: sched.sequential.startWeek,
    },
    parallel: {
      totalWeeks: total,
      finishDate: toIsoDate(addWeeks(start, total)),
      startWeek: sched.parallel.startWeek,
      criticalPath: sched.parallel.criticalPath,
    },
    warnings: evaluateWarnings(pathway, { profile, statuses, schedule: sched, today: start }),
    estimateShare: total > 0 ? Math.round((estimateWeeks / total) * 1000) / 1000 : 0,
  };
}
