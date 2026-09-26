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

export function buildSummary(plan: Plan, pathway: Pathway, schedule: ScheduleKey): string {
  const parts: string[] = ["Here is your plan to register as a nurse in Ontario."];
  const finish = monthYear(plan[schedule].finishDate);

  parts.push(
    schedule === "parallel"
      ? `With the Portage plan, your earliest licence is ${finish}, if each step goes to plan.`
      : `Doing one step at a time, your earliest licence is ${finish}.`,
  );

  const eop = viewWarnings(plan, schedule).find((v) => v.warning.id === EVIDENCE_OF_PRACTICE);
  const windowCloses = eop?.state.windowCloses;
  if (eop && eop.state.kind === "active" && windowCloses) {
    parts.push(
      isTight(eop)
        ? `It is tight: your evidence of practice window closes in ${monthYear(windowCloses)}.`
        : `Your evidence of practice window closes in ${monthYear(windowCloses)}, before this plan finishes.`,
    );
  }

  // Portage plan: the critical-path steps that protect the window. One at a time: simply the next steps in order.
  const steps = schedule === "parallel" ? protectingSteps(plan, pathway, schedule) : nextSteps(plan, pathway);
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
