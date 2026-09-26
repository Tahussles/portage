import type { Locale } from "@/lib/engine/types";
import type { MessageKey, MessageVars } from "@/lib/i18n";
import type { RoadmapPlan, RoadmapWarning, ScheduleKey } from "./contract";
import { formatMonthYear, pick } from "./format";

export type Severity = RoadmapWarning["severity"];

export type WarningState =
  | {
      kind: "active";
      severity: Severity;
      /** YYYY-MM typical finish of the schedule on screen. */
      finish: string;
      windowCloses?: string;
    }
  | {
      /** Raised by one at a time, not by the Portage plan. */
      kind: "resolved";
      finish: string;
      windowCloses?: string;
      /** Whole months between the Portage plan finish and the window closing. */
      monthsEarly?: number;
    };

export type WarningView = { warning: RoadmapWarning; state: WarningState };

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warn: 1, info: 2 };

export function firesIn(warning: RoadmapWarning, schedule: ScheduleKey): boolean {
  return !warning.schedules || warning.schedules.includes(schedule);
}

export function severityIn(warning: RoadmapWarning, schedule: ScheduleKey): Severity {
  return warning.severityBySchedule?.[schedule] ?? warning.severity;
}

const toMonth = (isoDate: string) => isoDate.slice(0, 7);

/** Whole calendar months from `from` to `to` (both YYYY-MM or ISO dates). */
export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return ty * 12 + tm - (fy * 12 + fm);
}

/**
 * Warnings to show for one schedule, in a stable order (by base severity) so cards do not jump
 * when the toggle flips. A warning that only one-at-a-time raises stays visible in the Portage
 * plan as "resolved"; any other warning that does not fire on this schedule is hidden.
 */
export function viewWarnings(plan: RoadmapPlan, schedule: ScheduleKey): WarningView[] {
  const finish = toMonth(plan[schedule].finishDate);
  return [...plan.warnings]
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    .flatMap((warning): WarningView[] => {
      const windowCloses = warning.facts?.windowCloses;
      if (firesIn(warning, schedule)) {
        return [{ warning, state: { kind: "active", severity: severityIn(warning, schedule), finish, windowCloses } }];
      }
      if (schedule === "parallel" && firesIn(warning, "sequential")) {
        const monthsEarly = windowCloses ? monthsBetween(finish, windowCloses) : undefined;
        return [{ warning, state: { kind: "resolved", finish, windowCloses, monthsEarly } }];
      }
      return [];
    });
}

/** Steps that get a red ring: related to a warning that fires (warn or critical) on this schedule. */
export function flaggedNodes(views: WarningView[]): Set<string> {
  return new Set(
    views
      .filter((v) => v.state.kind === "active" && v.state.severity !== "info")
      .flatMap((v) => v.warning.relatedNodes),
  );
}

type Translate = (key: MessageKey, vars?: MessageVars) => string;

export type WarningCopy = {
  title: string;
  body: string;
  /** Extra line with the dates behind the warning, when the engine provides them. */
  facts?: string;
  /** Micro-label above the title (resolved) or under the body (tight). */
  label?: string;
};

/** Text for one warning card, in the viewer's locale. */
export function warningCopy(view: WarningView, t: Translate, locale: Locale): WarningCopy {
  const { warning, state } = view;
  const title = pick(warning.title, locale);
  const month = (ym: string) => formatMonthYear(`${ym}-01`, locale);

  if (state.kind === "resolved") {
    const { windowCloses, monthsEarly } = state;
    const body =
      windowCloses && monthsEarly !== undefined && monthsEarly > 0
        ? t(monthsEarly === 1 ? "warnings.resolvedFactsOne" : "warnings.resolvedFacts", {
            finish: month(state.finish),
            months: monthsEarly,
            windowCloses: month(windowCloses),
          })
        : t("warnings.resolvedPlain");
    return { title, body, label: t("warnings.resolvedLabel") };
  }

  // Tight: this schedule finishes before the window closes, but its conservative finish does not.
  // The data's body describes the missed-window case, so a tight card gets its own dated line.
  if (state.severity === "warn" && state.windowCloses) {
    return {
      title,
      body: t("warnings.tightFacts", { finish: month(state.finish), windowCloses: month(state.windowCloses) }),
      label: t("warnings.tight"),
    };
  }

  return {
    title,
    body: pick(warning.body, locale),
    facts: state.windowCloses
      ? t("warnings.activeFacts", { windowCloses: month(state.windowCloses), finish: month(state.finish) })
      : undefined,
  };
}
