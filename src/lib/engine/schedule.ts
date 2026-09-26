import type { NodeStatus, PathwayNode } from "./types";

/** Nodes that still take time. Blocked nodes stay in the schedule so the plan shows where they sit. */
export function isOpen(status: NodeStatus | undefined): boolean {
  return status === "todo" || status === "blocked";
}

/**
 * Kahn's algorithm. Among ready nodes, earlier nodes in the data win, and `late` nodes are
 * taken only when nothing else is ready, so "one at a time" also leaves them for the end.
 * Throws on unknown dependencies or cycles.
 */
export function topologicalOrder(nodes: PathwayNode[]): string[] {
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const indegree = new Map(nodes.map((n) => [n.id, 0]));
  const dependents = new Map<string, string[]>(nodes.map((n) => [n.id, []]));

  for (const n of nodes) {
    for (const dep of n.dependsOn) {
      if (!index.has(dep)) throw new Error(`Node "${n.id}" depends on unknown node "${dep}"`);
      indegree.set(n.id, (indegree.get(n.id) ?? 0) + 1);
      dependents.get(dep)!.push(n.id);
    }
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const rank = (id: string) => (byId.get(id)!.scheduleHint === "late" ? nodes.length : 0) + index.get(id)!;
  const ready = nodes.filter((n) => indegree.get(n.id) === 0).map((n) => n.id);
  const order: string[] = [];

  while (ready.length > 0) {
    ready.sort((a, b) => rank(a) - rank(b));
    const id = ready.shift()!;
    order.push(id);
    for (const next of dependents.get(id)!) {
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) ready.push(next);
    }
  }

  if (order.length !== nodes.length) {
    const stuck = nodes.filter((n) => !order.includes(n.id)).map((n) => n.id);
    throw new Error(`Dependency cycle among: ${stuck.join(", ")}`);
  }
  return order;
}

export type Schedule = {
  order: string[];
  sequential: { totalWeeks: number; startWeek: Record<string, number> };
  parallel: {
    totalWeeks: number;
    startWeek: Record<string, number>;
    finishWeek: Record<string, number>;
    criticalPath: string[];
  };
};

/** Rounds away floating point noise (2.1 + 2.1 ...) without hiding real fractions. */
const clean = (weeks: number) => Math.round(weeks * 1000) / 1000;

export function schedule(nodes: PathwayNode[], statuses: Record<string, NodeStatus>): Schedule {
  const order = topologicalOrder(nodes);
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const weeks = (id: string) => (isOpen(statuses[id]) ? byId.get(id)!.duration.typicalWeeks : 0);
  const open = order.filter((id) => isOpen(statuses[id]));

  // One at a time: each open step starts when the previous one finishes.
  const seqStart: Record<string, number> = {};
  let cursor = 0;
  for (const id of open) {
    seqStart[id] = clean(cursor);
    cursor += weeks(id);
  }

  // Critical path method, forward pass. Done and not-applicable nodes finish at week 0.
  const es: Record<string, number> = {};
  const ef: Record<string, number> = {};
  const setBy: Record<string, string | null> = {};
  for (const id of order) {
    let start = 0;
    let from: string | null = null;
    for (const dep of byId.get(id)!.dependsOn) {
      if (ef[dep] > start) {
        start = ef[dep];
        from = dep;
      }
    }
    es[id] = start;
    ef[id] = start + weeks(id);
    setBy[id] = from;
  }
  const total = open.reduce((max, id) => Math.max(max, ef[id]), 0);

  // Backward pass, used to push `late` nodes as late as possible without extending the total.
  const successors = new Map<string, string[]>(order.map((id) => [id, []]));
  for (const id of order) for (const dep of byId.get(id)!.dependsOn) successors.get(dep)!.push(id);
  const ls: Record<string, number> = {};
  for (const id of [...order].reverse()) {
    const lf = successors
      .get(id)!
      .filter((s) => isOpen(statuses[s]))
      .reduce((min, s) => Math.min(min, ls[s]), total);
    ls[id] = lf - weeks(id);
  }

  const parStart: Record<string, number> = {};
  const parFinish: Record<string, number> = {};
  for (const id of open) {
    const start = byId.get(id)!.scheduleHint === "late" ? ls[id] : es[id];
    parStart[id] = clean(start);
    parFinish[id] = clean(start + weeks(id));
  }

  // Critical path: from the open node that finishes last (on ties, the later one in order, so a
  // zero-length final step such as registration is included), follow the dependency that set its start.
  const criticalPath: string[] = [];
  let tail = open.reduce<string | null>((best, id) => (best === null || ef[id] >= ef[best] ? id : best), null);
  while (tail !== null && isOpen(statuses[tail])) {
    criticalPath.unshift(tail);
    tail = setBy[tail];
  }

  return {
    order,
    sequential: { totalWeeks: clean(cursor), startWeek: seqStart },
    parallel: { totalWeeks: clean(total), startWeek: parStart, finishWeek: parFinish, criticalPath },
  };
}
