import { getApplicability } from "./applicability";
import { addWeeks, toIsoDate, toUtcDate } from "./dates";
import { schedule } from "./schedule";
import type { Pathway, Plan, Profile, ScheduleRange } from "./types";
import { evaluateWarnings } from "./warnings";

/**
 * Builds a personal plan. Pure: the same inputs always give the same plan.
 * `today` is "YYYY-MM-DD" (or a Date); finish dates are ISO dates the UI shows as month and year.
 */
export function buildPlan(profile: Profile, pathway: Pathway, today: string | Date): Plan {
  const start = toUtcDate(today);
  const { statuses } = getApplicability(profile, pathway, start);
  // Side-lane nodes ("While you wait") are shown next to the plan but never scheduled.
  const mainNodes = pathway.nodes.filter((n) => (n.lane ?? "main") === "main");
  const sideNodes = pathway.nodes.filter((n) => n.lane === "side");
  const mainStatuses = Object.fromEntries(mainNodes.map((n) => [n.id, statuses[n.id]]));

  const sched = schedule(mainNodes, mainStatuses);
  const best = schedule(mainNodes, mainStatuses, "minWeeks");
  const conservative = schedule(mainNodes, mainStatuses, "maxWeeks");
  const byId = new Map(pathway.nodes.map((n) => [n.id, n]));
  const range = (bestWeeks: number, typicalWeeks: number, conservativeWeeks: number): ScheduleRange => ({
    bestWeeks,
    typicalWeeks,
    conservativeWeeks,
    bestFinish: toIsoDate(addWeeks(start, bestWeeks)),
    conservativeFinish: toIsoDate(addWeeks(start, conservativeWeeks)),
  });

  const total = sched.parallel.totalWeeks;
  const estimateWeeks = sched.parallel.criticalPath
    .map((id) => byId.get(id)!.duration)
    .filter((d) => d.kind === "estimate")
    .reduce((sum, d) => sum + d.typicalWeeks, 0);

  return {
    statuses: mainStatuses,
    order: sched.order,
    sequential: {
      totalWeeks: sched.sequential.totalWeeks,
      finishDate: toIsoDate(addWeeks(start, sched.sequential.totalWeeks)),
      startWeek: sched.sequential.startWeek,
      range: range(best.sequential.totalWeeks, sched.sequential.totalWeeks, conservative.sequential.totalWeeks),
    },
    parallel: {
      totalWeeks: total,
      finishDate: toIsoDate(addWeeks(start, total)),
      startWeek: sched.parallel.startWeek,
      criticalPath: sched.parallel.criticalPath,
      range: range(best.parallel.totalWeeks, total, conservative.parallel.totalWeeks),
    },
    side: sideNodes.map((n) => ({ nodeId: n.id, status: statuses[n.id] })),
    warnings: evaluateWarnings(pathway, {
      profile,
      statuses: mainStatuses,
      nodes: mainNodes,
      schedule: sched,
      conservative,
      today: start,
    }),
    estimateShare: total > 0 ? Math.round((estimateWeeks / total) * 1000) / 1000 : 0,
  };
}
