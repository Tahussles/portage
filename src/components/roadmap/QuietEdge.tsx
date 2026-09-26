import { BaseEdge, type EdgeProps } from "@xyflow/react";
import { edgePath, type RoadmapFlowEdge } from "./CriticalEdge";

/** Every other dependency: stone, 1 px. */
export function QuietEdge(props: EdgeProps<RoadmapFlowEdge>) {
  return <BaseEdge id={props.id} path={edgePath(props)} className="roadmap-edge-quiet" />;
}
