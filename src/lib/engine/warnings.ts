import { evaluateRule } from "./applicability";
import { addMonths, addWeeks, tryUtcDate } from "./dates";
import { isOpen, type Schedule } from "./schedule";
import { warningRuleDefSchema, type WarningRuleDefData } from "./schema";
import type { NodeStatus, Pathway, PlanWarning, Profile } from "./types";

type WarningContext = {
  profile: Profile;
  statuses: Record<string, NodeStatus>;
  schedule: Schedule;
  today: Date;
};

function toPlanWarning(def: WarningRuleDefData): PlanWarning {
  return {
    id: def.id,
    severity: def.severity,
    title: def.title,
    body: def.body,
    relatedNodes: def.relatedNodes,
    sourceUrl: def.sourceUrl,
  };
}

function numberParam(def: WarningRuleDefData, key: string): number | null {
  const value = Number(def.params?.[key]);
  return Number.isFinite(value) ? value : null;
}

function fires(def: WarningRuleDefData, ctx: WarningContext): boolean {
  if (def.appliesIf && !evaluateRule(def.appliesIf, ctx.profile)) return false;
  const finish = addWeeks(ctx.today, ctx.schedule.parallel.totalWeeks);

  switch (def.trigger) {
    case "profile_rule":
      // Only relevant while at least one related step is still ahead of the applicant.
      return def.relatedNodes.length === 0 || def.relatedNodes.some((id) => isOpen(ctx.statuses[id]));

    case "evidence_of_practice_window": {
      const months = numberParam(def, "windowMonths");
      const last = tryUtcDate(ctx.profile.lastPractisedAt);
      if (months === null || last === null) return false;
      if (!def.relatedNodes.some((id) => isOpen(ctx.statuses[id]))) return false;
      return addMonths(last, months) < finish;
    }

    case "criminal_record_check_validity": {
      const months = numberParam(def, "validityMonths");
      const issued = tryUtcDate(ctx.profile.progress.criminalRecordCheckDate);
      if (months === null || issued === null) return false;
      return addMonths(issued, months) < finish;
    }

    case "application_window": {
      const windowWeeks = numberParam(def, "windowWeeks");
      const fromNode = String(def.params?.fromNode ?? "");
      if (windowWeeks === null || !(fromNode in ctx.statuses)) return false;
      if (ctx.statuses[fromNode] === "not_applicable") return false;
      // Already submitted: the window started at some unknown past date, so measure from today.
      const opened = isOpen(ctx.statuses[fromNode]) ? ctx.schedule.parallel.finishWeek[fromNode] : 0;
      return ctx.schedule.parallel.totalWeeks - opened > windowWeeks;
    }
  }
}

export function evaluateWarnings(pathway: Pathway, ctx: WarningContext): PlanWarning[] {
  const order = { critical: 0, warn: 1, info: 2 } as const;
  return pathway.warnings
    .map((raw) => warningRuleDefSchema.parse(raw))
    .filter((def) => fires(def, ctx))
    .map(toPlanWarning)
    .sort((a, b) => order[a.severity] - order[b.severity]);
}
