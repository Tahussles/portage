import { addMonths, tryUtcDate } from "./dates";
import { warningRuleDefSchema } from "./schema";
import type { NodeStatus, Pathway, Profile, Rule } from "./types";

/** Reads a dotted path such as "progress.cnoApplicationSubmitted" from the profile. */
export function getField(profile: Profile, path: string): unknown {
  let value: unknown = profile;
  for (const key of path.split(".")) {
    if (value === null || typeof value !== "object") return undefined;
    value = (value as Record<string, unknown>)[key];
  }
  return value;
}

export function evaluateRule(rule: Rule, profile: Profile): boolean {
  if ("all" in rule) return rule.all.every((r) => evaluateRule(r, profile));
  if ("any" in rule) return rule.any.some((r) => evaluateRule(r, profile));
  if ("not" in rule) return !evaluateRule(rule.not, profile);

  const value = getField(profile, rule.field);
  switch (rule.op) {
    case "eq":
      return value === rule.value;
    case "neq":
      return value !== rule.value;
    case "in":
      return Array.isArray(rule.value) && rule.value.includes(value);
    case "truthy":
      return Boolean(value);
    case "falsy":
      return !value;
  }
}

export type NodeApplicability = {
  statuses: Record<string, NodeStatus>;
  /** Why a node is blocked, keyed by node id (English, for logs and tests; the UI uses warnings). */
  blockedReasons: Record<string, string>;
};

/**
 * Decides done / todo / not_applicable / blocked per node.
 * - appliesIf false: not_applicable
 * - doneIf true: done
 * - evidence-of-practice window already closed today: related todo nodes become blocked
 */
export function getApplicability(profile: Profile, pathway: Pathway, today: Date): NodeApplicability {
  const statuses: Record<string, NodeStatus> = {};
  const blockedReasons: Record<string, string> = {};

  for (const node of pathway.nodes) {
    if (node.appliesIf && !evaluateRule(node.appliesIf, profile)) statuses[node.id] = "not_applicable";
    else if (node.doneIf && evaluateRule(node.doneIf, profile)) statuses[node.id] = "done";
    else statuses[node.id] = "todo";
  }

  const lastPractised = tryUtcDate(profile.lastPractisedAt);
  if (lastPractised) {
    for (const raw of pathway.warnings) {
      const def = warningRuleDefSchema.parse(raw);
      if (def.trigger !== "evidence_of_practice_window") continue;
      const months = Number(def.params?.windowMonths);
      if (!Number.isFinite(months)) continue;
      if (addMonths(lastPractised, months) > today) continue;
      for (const id of def.relatedNodes) {
        if (statuses[id] !== "todo") continue;
        statuses[id] = "blocked";
        blockedReasons[id] = `Last practised more than ${months} months ago`;
      }
    }
  }

  return { statuses, blockedReasons };
}
