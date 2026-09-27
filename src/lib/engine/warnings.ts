import { evaluateRule } from "./applicability";
import { addMonths, addWeeks, toIsoDate, tryUtcDate } from "./dates";
import { isOpen, type DurationField, type Schedule } from "./schedule";
import { warningRuleDefSchema, type WarningRuleDefData } from "./schema";
import type { NodeStatus, Pathway, PathwayNode, PlanWarning, Profile, ScheduleKey } from "./types";

type Severity = PlanWarning["severity"];

type WarningContext = {
  profile: Profile;
  statuses: Record<string, NodeStatus>;
  nodes: PathwayNode[];
  /** Typical-duration schedule (the plan) and max-duration schedule (conservative range). */
  schedule: Schedule;
  conservative: Schedule;
  today: Date;
};

const SCHEDULES: ScheduleKey[] = ["sequential", "parallel"];
const RANK: Record<Severity, number> = { critical: 0, warn: 1, info: 2 };
const ONE_LOWER: Record<Severity, Severity> = { critical: "warn", warn: "info", info: "info" };

const toMonth = (date: Date) => toIsoDate(date).slice(0, 7);

function numberParam(def: WarningRuleDefData, key: string): number | null {
  const value = Number(def.params?.[key]);
  return Number.isFinite(value) ? value : null;
}

/** Week at which a node finishes in the given schedule (0 if it is done or not applicable). */
function finishWeek(ctx: WarningContext, sched: Schedule, key: ScheduleKey, field: DurationField, id: string): number {
  if (!isOpen(ctx.statuses[id])) return 0;
  if (key === "parallel") return sched.parallel.finishWeek[id];
  const node = ctx.nodes.find((n) => n.id === id)!;
  return sched.sequential.startWeek[id] + node.duration[field];
}

/**
 * A date-driven rule: `breaches(sched, key)` says whether the rule is broken when that schedule's
 * durations are used. Typical breach: the definition's severity. Conservative-only breach: one
 * level lower ("tight: only if each step goes to plan"). Neither: does not fire for that schedule.
 */
type DateRule = {
  breaches: (sched: Schedule, key: ScheduleKey, field: DurationField) => boolean;
  facts?: Record<string, string>;
};

function dateRule(def: WarningRuleDefData, ctx: WarningContext): DateRule | null {
  const finishDate = (sched: Schedule, key: ScheduleKey) => addWeeks(ctx.today, sched[key].totalWeeks);

  switch (def.trigger) {
    case "evidence_of_practice_window": {
      const months = numberParam(def, "windowMonths");
      const last = tryUtcDate(ctx.profile.lastPractisedAt);
      if (months === null || last === null) return null;
      if (!def.relatedNodes.some((id) => isOpen(ctx.statuses[id]))) return null;
      const closes = addMonths(last, months);
      const facts: Record<string, string> = { windowCloses: toMonth(closes) };
      // Backup route (SPEP): open while evidence of practice expired no more than N years before
      // applying. Applicants join SPEP once everything else is met, so compare with the plan's finish.
      const backupYears = numberParam(def, "backupYearsAfterExpiry");
      const backup = def.params?.backup;
      const backupSourceUrl = def.params?.backupSourceUrl;
      if (backupYears !== null && typeof backup === "string" && typeof backupSourceUrl === "string") {
        const eligibleUntil = addMonths(closes, backupYears * 12);
        if (eligibleUntil > finishDate(ctx.schedule, "parallel")) {
          Object.assign(facts, { backup, backupEligibleUntil: toMonth(eligibleUntil), backupSourceUrl });
        }
      }
      return { breaches: (s, k) => closes < finishDate(s, k), facts };
    }

    case "criminal_record_check_validity": {
      const months = numberParam(def, "validityMonths");
      const issued = tryUtcDate(ctx.profile.progress.criminalRecordCheckDate);
      if (months === null || issued === null) return null;
      const expires = addMonths(issued, months);
      return { breaches: (s, k) => expires < finishDate(s, k), facts: { windowCloses: toMonth(expires) } };
    }

    case "application_window": {
      const windowWeeks = numberParam(def, "windowWeeks");
      const fromNode = String(def.params?.fromNode ?? "");
      if (windowWeeks === null || !(fromNode in ctx.statuses)) return null;
      if (ctx.statuses[fromNode] === "not_applicable") return null;
      // Already submitted: the window started at an unknown past date, so measure from today.
      return {
        breaches: (s, k, f) => s[k].totalWeeks - finishWeek(ctx, s, k, f, fromNode) > windowWeeks,
      };
    }

    case "profile_rule":
      return null;
  }
}

function base(def: WarningRuleDefData): PlanWarning {
  return {
    id: def.id,
    severity: def.severity,
    title: def.title,
    body: def.body,
    relatedNodes: def.relatedNodes,
    sourceUrl: def.sourceUrl,
  };
}

function evaluate(def: WarningRuleDefData, ctx: WarningContext): PlanWarning | null {
  if (def.appliesIf && !evaluateRule(def.appliesIf, ctx.profile)) return null;

  if (def.trigger === "profile_rule") {
    // Only relevant while at least one related step is still ahead of the applicant. Same on both schedules.
    const relevant = def.relatedNodes.length === 0 || def.relatedNodes.some((id) => isOpen(ctx.statuses[id]));
    return relevant ? base(def) : null;
  }

  const rule = dateRule(def, ctx);
  if (!rule) return null;

  const bySchedule: Partial<Record<ScheduleKey, Severity>> = {};
  for (const key of SCHEDULES) {
    if (rule.breaches(ctx.schedule, key, "typicalWeeks")) bySchedule[key] = def.severity;
    else if (rule.breaches(ctx.conservative, key, "maxWeeks")) bySchedule[key] = ONE_LOWER[def.severity];
  }
  const schedules = SCHEDULES.filter((k) => bySchedule[k] !== undefined);
  if (schedules.length === 0) return null;

  const severity = schedules.map((k) => bySchedule[k]!).sort((a, b) => RANK[a] - RANK[b])[0];
  return {
    ...base(def),
    severity,
    schedules,
    severityBySchedule: bySchedule,
    ...(rule.facts ? { facts: rule.facts } : {}),
  };
}

export function evaluateWarnings(pathway: Pathway, ctx: WarningContext): PlanWarning[] {
  return pathway.warnings
    .map((raw) => evaluate(warningRuleDefSchema.parse(raw), ctx))
    .filter((w): w is PlanWarning => w !== null)
    .sort((a, b) => RANK[a.severity] - RANK[b.severity]);
}
