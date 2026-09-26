import type { NodeStatus, Pathway, PathwayNode, Plan } from "@/lib/engine/types";

// PROVISIONAL: local copy of the "feat(contract): add schedule ranges and side lane" block.
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

export type RoadmapPlan = Omit<Plan, "sequential" | "parallel"> & {
  sequential: WithRange<Plan["sequential"]>;
  parallel: WithRange<Plan["parallel"]>;
  side: { nodeId: string; status: NodeStatus }[];
};

export type RoadmapNode = PathwayNode & { lane?: Lane };

export type RoadmapPathway = Omit<Pathway, "nodes"> & { nodes: RoadmapNode[] };
