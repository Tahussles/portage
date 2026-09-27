import { isTight, viewWarnings } from "@/components/roadmap/warnings-view";
import { buildPlan } from "@/lib/engine/plan";
import type { Pathway, Plan, Profile } from "@/lib/engine/types";

export type LicenceState = "tight" | "critical" | "clear";

export type PlanSummary = {
  plan: Plan;
  /** Steps marked done, out of every step that applies to this person. */
  done: number;
  total: number;
  /** Earliest licence with the Portage plan (ISO date). */
  finish: string;
  /** Is the evidence of practice window tight or already lost on the Portage plan? */
  state: LicenceState;
  /** The first step still to do on the Portage plan. */
  next: { id: string; title: { en: string; fr: string } } | null;
};

export function summarizePlan(profile: Profile, pathway: Pathway, today: string): PlanSummary {
  const plan = buildPlan(profile, pathway, today);
  const statuses = Object.values(plan.statuses);
  const done = statuses.filter((s) => s === "done").length;
  const total = statuses.filter((s) => s !== "not_applicable").length;

  const active = viewWarnings(plan, "parallel").filter((v) => v.state.kind === "active");
  const state: LicenceState = active.some((v) => v.state.kind === "active" && v.state.severity === "critical" && !isTight(v))
    ? "critical"
    : active.some(isTight)
      ? "tight"
      : "clear";

  // Earliest start first; among steps that start together, the critical path (what protects the date).
  const starts = plan.parallel.startWeek;
  const critical = new Set(plan.parallel.criticalPath);
  const nextId = plan.order
    .filter((id) => plan.statuses[id] === "todo" || plan.statuses[id] === "blocked")
    .sort((a, b) => (starts[a] ?? 0) - (starts[b] ?? 0) || Number(critical.has(b)) - Number(critical.has(a)))[0];
  const node = pathway.nodes.find((n) => n.id === nextId);
  return { plan, done, total, finish: plan.parallel.finishDate, state, next: node ? { id: node.id, title: node.title } : null };
}
