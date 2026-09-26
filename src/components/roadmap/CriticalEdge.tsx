import { BaseEdge, getBezierPath, getSmoothStepPath, type Edge, type EdgeProps } from "@xyflow/react";

export type RoadmapEdgeData = { curve: "step" | "bezier" };
export type RoadmapFlowEdge = Edge<RoadmapEdgeData, "critical" | "quiet">;

export function edgePath(props: EdgeProps<RoadmapFlowEdge>) {
  const args = {
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
  };
  const [path] =
    props.data?.curve === "bezier"
      ? getBezierPath(args)
      : getSmoothStepPath({ ...args, borderRadius: 18, offset: 28 });
  return path;
}

/** Critical path: accent red, 1.5 px, dash flowing toward the licence (static under reduced motion). */
export function CriticalEdge(props: EdgeProps<RoadmapFlowEdge>) {
  return <BaseEdge id={props.id} path={edgePath(props)} className="roadmap-edge-critical" />;
}
