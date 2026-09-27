import { backupFor, isTight, protectingSteps, viewWarnings } from "@/components/roadmap/warnings-view";
import type { Pathway, Plan, ScheduleKey } from "@/lib/engine/types";

// A short spoken summary of the plan, built deterministically from the engine's Plan and the cited
// pathway data. No model writes facts: the /api/speak route may only translate this text.

const EVIDENCE_OF_PRACTICE = "evidence_of_practice_window";

function monthYear(isoDate: string) {
  return new Intl.DateTimeFormat("en-CA", { month: "long", year: "numeric", timeZone: "UTC" }).format(
    Date.parse(`${isoDate.slice(0, 7)}-01T00:00:00Z`),
  );
}

/** Step titles are imperative sentences ("Get your nursing education assessed..."); lower-case the first
 *  word mid-sentence unless it is an acronym ("CNO confirms..."). */
function asClause(title: string) {
  const [first] = title.split(" ");
  return first === first.toUpperCase() ? title : title.charAt(0).toLowerCase() + title.slice(1);
}

function nextSteps(plan: Plan, pathway: Pathway, limit = 3) {
  const nodes = new Map(pathway.nodes.map((n) => [n.id, n]));
  const starts = plan.sequential.startWeek;
  return plan.order
    .filter((id) => nodes.has(id) && (plan.statuses[id] === "todo" || plan.statuses[id] === "blocked"))
    .sort((a, b) => (starts[a] ?? 0) - (starts[b] ?? 0))
    .slice(0, limit)
    .map((id) => {
      const startWeek = Math.round(starts[id] ?? 0);
      return { id, title: nodes.get(id)!.title, startWeek, startsNow: startWeek < 1 };
    });
}

export type SummaryLength = "short" | "full";

type FirstStep = { title: { en: string }; startWeek: number; startsNow: boolean };

/** About 35 English words (under 15 s in English): the licence, the window, and the first step's own title. */
function shortSummary(
  schedule: ScheduleKey,
  finish: string,
  window: { closes: string; tight: boolean } | null,
  first: FirstStep | undefined,
) {
  const parts = [
    schedule === "parallel"
      ? `Your earliest licence is ${finish}, if each step goes to plan.`
      : `One step at a time, your earliest licence is ${finish}.`,
  ];
  if (window) {
    parts.push(
      window.tight
        ? `It is tight: your practice window closes in ${window.closes}.`
        : `But your practice window closes in ${window.closes}, before then.`,
    );
  }
  if (first) {
    parts.push(
      first.startsNow ? `Start now: ${asClause(first.title.en)}.` : `First, in week ${first.startWeek}: ${asClause(first.title.en)}.`,
    );
  }
  return parts.join(" ");
}

/**
 * `short` (the stage default): earliest licence, whether the window is tight, and the first step only.
 * `full`: adds the intro, three steps, the backup and the closing reminder.
 */
export function buildSummary(
  plan: Plan,
  pathway: Pathway,
  schedule: ScheduleKey,
  length: SummaryLength = "full",
): string {
  const finish = monthYear(plan[schedule].finishDate);
  const eop = viewWarnings(plan, schedule).find((v) => v.warning.id === EVIDENCE_OF_PRACTICE);
  const windowCloses = eop?.state.windowCloses && eop.state.kind === "active" ? monthYear(eop.state.windowCloses) : null;
  // Portage plan: the critical-path steps that protect the window. One at a time: simply the next steps in order.
  const steps = schedule === "parallel" ? protectingSteps(plan, pathway, schedule) : nextSteps(plan, pathway);

  if (length === "short") {
    const window = eop && windowCloses ? { closes: windowCloses, tight: isTight(eop) } : null;
    return shortSummary(schedule, finish, window, steps[0]);
  }

  const parts: string[] = ["Here is your plan to register as a nurse in Ontario."];
  parts.push(
    schedule === "parallel"
      ? `With the Portage plan, your earliest licence is ${finish}, if each step goes to plan.`
      : `Doing one step at a time, your earliest licence is ${finish}.`,
  );
  if (eop && windowCloses) {
    parts.push(
      isTight(eop)
        ? `It is tight: your evidence of practice window closes in ${windowCloses}.`
        : `Your evidence of practice window closes in ${windowCloses}, before this plan finishes.`,
    );
  }
  if (steps.length > 0) {
    const lines = steps.map((s) =>
      s.startsNow ? `Start now: ${asClause(s.title.en)}.` : `In week ${s.startWeek}: ${asClause(s.title.en)}.`,
    );
    parts.push(`Your first steps. ${lines.join(" ")}`);
  }

  const backup = eop ? backupFor(eop.warning) : null;
  if (backup) {
    parts.push(
      `If anything slips, the Supervised Practice Experience Partnership is open to you until ${monthYear(`${backup.until}-01`)}.`,
    );
  }

  parts.push("Always confirm each step with the College of Nurses of Ontario.");
  return parts.join(" ");
}
