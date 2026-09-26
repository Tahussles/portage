import type { NodeStatus, Pathway, PathwayNode, Plan, PlanWarning } from "@/lib/engine/types";

// PROVISIONAL: local copy of the contract in issue #8 ("feat(contract): add schedule ranges and
// side lane", plus the per-schedule warning fields).
// Once that PR is merged into src/lib/engine/types.ts, import Lane, ScheduleRange and Plan from
// there and delete this file. Never edit types.ts from this track.

export type Lane = "main" | "side";

export type ScheduleRange = {
  bestWeeks: number;
  typicalWeeks: number;
  conservativeWeeks: number;
  bestFinish: string;
  conservativeFinish: string;
};

type WithRange<T> = T & { range: ScheduleRange };

export type ScheduleKey = "sequential" | "parallel";

export type RoadmapWarning = PlanWarning & {
  /** Schedules under which this warning fires; absent means both. */
  schedules?: ScheduleKey[];
  severityBySchedule?: Partial<Record<ScheduleKey, PlanWarning["severity"]>>;
  /** Values for UI copy, e.g. { windowCloses: "2027-07", finish: "2027-11" }. */
  facts?: Record<string, string>;
};

export type RoadmapPlan = Omit<Plan, "sequential" | "parallel" | "warnings"> & {
  warnings: RoadmapWarning[];
  sequential: WithRange<Plan["sequential"]>;
  parallel: WithRange<Plan["parallel"]>;
  side: { nodeId: string; status: NodeStatus }[];
};

export type RoadmapNode = PathwayNode & { lane?: Lane };

export type RoadmapPathway = Omit<Pathway, "nodes"> & { nodes: RoadmapNode[] };
