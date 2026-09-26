import type { NodeStatus } from "@/lib/engine/types";
import type { RoadmapNode, RoadmapPathway, RoadmapPlan } from "./contract";

export const NODE_WIDTH = 240;
export const NODE_HEIGHT = 120;
/** Parallel mode uses a compact card so up to seven concurrent lanes still fit on screen. */
export const NODE_HEIGHT_COMPACT = 92;
export const WEEK_PX = 40;

const SEQ_COLUMNS = 4;
const SEQ_GAP_X = 96;
const SEQ_GAP_Y = 64;
const LANE_GAP_Y = 20;
const LANE_GAP_X = 24;
const SIDE_LANE_GAP = 120;

export type LayoutMode = "sequential" | "parallel";

export type Placement = { x: number; y: number };

export type RoadmapLayout = {
  mode: LayoutMode;
  positions: Record<string, Placement>;
  mainIds: string[];
  sideIds: string[];
  /** Top of the "While you wait" lane, or null when there are no side nodes. */
  sideLaneY: number | null;
  nodeHeight: number;
  width: number;
  height: number;
};

export type RoadmapEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle: string;
  targetHandle: string;
  critical: boolean;
  curve: "step" | "bezier";
};

const EPSILON = 1e-6;

function nodeIndex(pathway: RoadmapPathway): Map<string, RoadmapNode> {
  return new Map(pathway.nodes.map((n) => [n.id, n]));
}

/** Main-lane nodes worth drawing, in the plan's topological order. */
export function visibleMainIds(plan: RoadmapPlan, pathway: RoadmapPathway): string[] {
  const nodes = nodeIndex(pathway);
  return plan.order.filter((id) => {
    const node = nodes.get(id);
    return node && (node.lane ?? "main") === "main" && plan.statuses[id] !== "not_applicable";
  });
}

export function visibleSideIds(plan: RoadmapPlan, pathway: RoadmapPathway): string[] {
  const nodes = nodeIndex(pathway);
  return plan.side
    .filter((s) => nodes.has(s.nodeId) && s.status !== "not_applicable")
    .map((s) => s.nodeId);
}

export function statusOf(plan: RoadmapPlan, id: string): NodeStatus {
  return plan.statuses[id] ?? plan.side.find((s) => s.nodeId === id)?.status ?? "todo";
}

function placeSideLane(
  positions: Record<string, Placement>,
  sideIds: string[],
  mainBottom: number,
  gapX: number,
): number | null {
  if (sideIds.length === 0) return null;
  const y = mainBottom + SIDE_LANE_GAP;
  sideIds.forEach((id, i) => {
    positions[id] = { x: i * (NODE_WIDTH + gapX), y };
  });
  return y;
}

function bounds(positions: Record<string, Placement>, nodeHeight: number) {
  const all = Object.values(positions);
  const width = all.length ? Math.max(...all.map((p) => p.x)) + NODE_WIDTH : 0;
  const height = all.length ? Math.max(...all.map((p) => p.y)) + nodeHeight : 0;
  return { width, height, nodeHeight };
}

/** One meandering route in topological order: serpentine rows of four (one column on phones). */
export function layoutSequential(
  plan: RoadmapPlan,
  pathway: RoadmapPathway,
  columns = SEQ_COLUMNS,
): RoadmapLayout {
  const mainIds = visibleMainIds(plan, pathway);
  const sideIds = visibleSideIds(plan, pathway);
  const positions: Record<string, Placement> = {};

  mainIds.forEach((id, i) => {
    const row = Math.floor(i / columns);
    const step = i % columns;
    const col = row % 2 === 0 ? step : columns - 1 - step;
    positions[id] = { x: col * (NODE_WIDTH + SEQ_GAP_X), y: row * (NODE_HEIGHT + SEQ_GAP_Y) };
  });

  const rows = Math.ceil(mainIds.length / columns);
  const mainBottom = rows * NODE_HEIGHT + Math.max(0, rows - 1) * SEQ_GAP_Y;
  const sideLaneY = placeSideLane(positions, sideIds, mainBottom, SEQ_GAP_X);
  return { mode: "sequential", positions, mainIds, sideIds, sideLaneY, ...bounds(positions, NODE_HEIGHT) };
}

/**
 * A timeline: x is the earliest start week, lanes are assigned greedily so cards never overlap.
 * Critical-path nodes claim lanes first at equal start weeks, so the red route stays near the top.
 */
export function layoutParallel(plan: RoadmapPlan, pathway: RoadmapPathway): RoadmapLayout {
  const mainIds = visibleMainIds(plan, pathway);
  const sideIds = visibleSideIds(plan, pathway);
  const critical = new Set(plan.parallel.criticalPath);
  const start = (id: string) => plan.parallel.startWeek[id] ?? 0;
  const rank = new Map(mainIds.map((id, i) => [id, i]));

  const sorted = [...mainIds].sort(
    (a, b) =>
      start(a) - start(b) ||
      Number(critical.has(b)) - Number(critical.has(a)) ||
      rank.get(a)! - rank.get(b)!,
  );

  const laneEnds: number[] = [];
  const positions: Record<string, Placement> = {};
  for (const id of sorted) {
    const x = start(id) * WEEK_PX;
    let lane = laneEnds.findIndex((end) => end + LANE_GAP_X <= x + EPSILON);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = x + NODE_WIDTH;
    positions[id] = { x, y: lane * (NODE_HEIGHT_COMPACT + LANE_GAP_Y) };
  }

  const lanes = laneEnds.length;
  const mainBottom = lanes * NODE_HEIGHT_COMPACT + Math.max(0, lanes - 1) * LANE_GAP_Y;
  const sideLaneY = placeSideLane(positions, sideIds, mainBottom, LANE_GAP_X);
  return { mode: "parallel", positions, mainIds, sideIds, sideLaneY, ...bounds(positions, NODE_HEIGHT_COMPACT) };
}

/**
 * Sequential mode draws the route itself (each step to the next). Parallel mode draws real
 * dependencies; an edge is critical when both ends are on the critical path and it is tight.
 */
export function buildEdges(
  layout: RoadmapLayout,
  plan: RoadmapPlan,
  pathway: RoadmapPathway,
): RoadmapEdge[] {
  const critical = new Set(plan.parallel.criticalPath);

  if (layout.mode === "sequential") {
    return layout.mainIds.slice(1).map((target, i) => {
      const source = layout.mainIds[i];
      const a = layout.positions[source];
      const b = layout.positions[target];
      const sameRow = a.y === b.y;
      const leftToRight = b.x >= a.x;
      return {
        id: `${source}->${target}`,
        source,
        target,
        sourceHandle: sameRow ? (leftToRight ? "right-source" : "left-source") : "bottom-source",
        targetHandle: sameRow ? (leftToRight ? "left-target" : "right-target") : "top-target",
        critical: critical.has(source) && critical.has(target),
        curve: "step",
      };
    });
  }

  const nodes = nodeIndex(pathway);
  const visible = new Set(layout.mainIds);
  const start = (id: string) => plan.parallel.startWeek[id] ?? 0;
  const edges: RoadmapEdge[] = [];
  for (const target of layout.mainIds) {
    for (const source of nodes.get(target)?.dependsOn ?? []) {
      if (!visible.has(source)) continue;
      const finish = start(source) + (nodes.get(source)?.duration.typicalWeeks ?? 0);
      edges.push({
        id: `${source}->${target}`,
        source,
        target,
        sourceHandle: "right-source",
        targetHandle: "left-target",
        critical:
          critical.has(source) && critical.has(target) && Math.abs(start(target) - finish) < 0.05,
        curve: "bezier",
      });
    }
  }
  return edges;
}

/** Week ticks for the ruler above the parallel timeline. */
export function weekTicks(plan: RoadmapPlan, every = 4): number[] {
  const last = Math.max(0, plan.parallel.totalWeeks);
  const count = Math.ceil(last / every) + 1;
  return Array.from({ length: count }, (_, i) => i * every);
}
