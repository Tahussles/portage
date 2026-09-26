"use client";

import "@xyflow/react/dist/style.css";
import { useGSAP } from "@gsap/react";
import {
  ReactFlow,
  ReactFlowProvider,
  useNodesInitialized,
  useReactFlow,
  type EdgeTypes,
  type NodeTypes,
} from "@xyflow/react";
import gsap from "gsap";
import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n";
import type { Pathway, Plan } from "@/lib/engine/types";
import { CriticalEdge, type RoadmapFlowEdge } from "./CriticalEdge";
import {
  NODE_WIDTH,
  buildEdges,
  layoutParallel,
  layoutSequential,
  statusOf,
  weekTicks,
  type LayoutMode,
  type Placement,
  type RoadmapLayout,
} from "./layout";
import { QuietEdge } from "./QuietEdge";
import { SideLaneLabel } from "./SideLaneLabel";
import { StepNode, type StepNodeType } from "./StepNode";
import type { Flag } from "./warnings-view";
import { WeekRuler } from "./WeekRuler";
import { ZoomControls } from "./ZoomControls";

gsap.registerPlugin(useGSAP);

const nodeTypes: NodeTypes = { step: StepNode };
// React Flow turns off pointer events on nodes that are neither selectable, draggable nor clickable.
// The card's own button opens the panel; this handler only keeps the node clickable.
const keepNodesClickable = () => {};
const edgeTypes: EdgeTypes = { critical: CriticalEdge, quiet: QuietEdge };

type RoadmapCanvasProps = {
  plan: Plan;
  pathway: Pathway;
  mode: LayoutMode;
  activeId: string | null;
  /** Steps with a warning that fires on the schedule on screen. */
  flagged: Map<string, Flag>;
  onOpen: (id: string, trigger: HTMLElement) => void;
};

type Positions = Record<string, Placement>;

const prefersReducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const NARROW_QUERY = "(max-width: 639px)";
function subscribeNarrow(onChange: () => void) {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
/** Phones get a one-column route and a readable zoom instead of fitting everything. */
function useNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

/** Area to frame: the cards plus room for the week ruler (parallel) and the side-lane label. */
function frame(layout: RoadmapLayout) {
  const top = layout.mode === "parallel" ? 72 : 24;
  return { x: -32, y: -top, width: layout.width + 64, height: layout.height + top + 32 };
}

function interpolate(from: Positions, to: Positions, t: number): Positions {
  const out: Positions = {};
  for (const id of Object.keys(to)) {
    const a = from[id] ?? to[id];
    const b = to[id];
    out[id] = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }
  return out;
}

function Canvas({ plan, pathway, mode, activeId, flagged, onOpen }: RoadmapCanvasProps) {
  const t = useT();
  const { fitBounds, setViewport } = useReactFlow();
  const initialized = useNodesInitialized();
  const narrow = useNarrow();
  const scope = useRef<HTMLDivElement>(null);

  const layouts = useMemo(
    () => ({
      sequential: layoutSequential(plan, pathway, narrow ? 1 : undefined),
      parallel: layoutParallel(plan, pathway),
    }),
    [plan, pathway, narrow],
  );
  const layout = layouts[mode];

  const [positions, setPositions] = useState<Positions>(layout.positions);
  const shown = useRef({ positions: layout.positions, layout, narrow });
  const tween = useRef<gsap.core.Tween | null>(null);
  const introDone = useRef(false);

  const fit = useCallback(
    (target: RoadmapLayout, animate: boolean) => {
      const duration = animate && !prefersReducedMotion() ? 900 : 0;
      const box = frame(target);
      const width = scope.current?.clientWidth ?? 0;
      if (width >= 640) return fitBounds(box, { padding: 0.08, duration });
      // Narrow screens: start at the beginning of the route at a readable zoom; pan for the rest.
      const zoom = Math.min(1, (width - 32) / (target.mode === "sequential" ? box.width : NODE_WIDTH * 1.6));
      return setViewport({ x: 16 - box.x * zoom, y: 16 - box.y * zoom, zoom }, { duration });
    },
    [fitBounds, setViewport],
  );

  // Layout change (toggle, or a recomputed plan): tween every card from where it is to where it goes.
  useGSAP(
    () => {
      if (shown.current.layout === layout) return;
      // Crossing the phone breakpoint (including right after hydration) snaps; it is not a state change.
      const snap = shown.current.narrow !== narrow;
      shown.current.layout = layout;
      shown.current.narrow = narrow;
      tween.current?.kill();
      const from = shown.current.positions;
      const to = layout.positions;
      const apply = (p: Positions) => {
        shown.current.positions = p;
        setPositions(p);
      };
      if (snap) {
        apply(to);
        fit(layout, false);
        return;
      }
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const progress = { t: 0 };
        tween.current = gsap.to(progress, {
          t: 1,
          duration: 0.9,
          ease: "power3.inOut",
          onUpdate: () => apply(interpolate(from, to, progress.t)),
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => apply(to));
      fit(layout, true);
    },
    { dependencies: [layout, narrow] },
  );

  // First render: cards rise in one after another, in plan order.
  useGSAP(
    () => {
      if (!initialized || introDone.current) return;
      introDone.current = true;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const cards = gsap.utils
          .toArray<HTMLElement>("[data-step-card]")
          .sort((a, b) => Number(a.dataset.order) - Number(b.dataset.order));
        gsap.from(cards, { opacity: 0, scale: 0.92, y: 12, duration: 0.5, stagger: 0.08, ease: "power2.out" });
      });
    },
    { scope, dependencies: [initialized] },
  );

  const critical = useMemo(() => new Set(plan.parallel.criticalPath), [plan]);
  const byId = useMemo(() => new Map(pathway.nodes.map((n) => [n.id, n])), [pathway]);

  const nodes = useMemo<StepNodeType[]>(() => {
    const ids = [...layout.mainIds, ...layout.sideIds];
    const order = new Map(plan.order.map((id, i) => [id, i]));
    return ids.map((id) => ({
      id,
      type: "step",
      position: positions[id] ?? layout.positions[id],
      width: NODE_WIDTH,
      height: layout.nodeHeight,
      draggable: false,
      selectable: false,
      focusable: false,
      className: activeId === id ? "roadmap-node-active" : undefined,
      data: {
        step: byId.get(id)!,
        status: statusOf(plan, id),
        critical: critical.has(id),
        flag: flagged.get(id) ?? null,
        side: layout.sideIds.includes(id),
        compact: layout.mode === "parallel",
        height: layout.nodeHeight,
        order: order.get(id) ?? ids.length + layout.sideIds.indexOf(id),
        onOpen,
      },
    }));
  }, [layout, positions, plan, byId, critical, flagged, activeId, onOpen]);

  const edges = useMemo<RoadmapFlowEdge[]>(
    () =>
      buildEdges(layout, plan, pathway)
        .sort((a, b) => Number(a.critical) - Number(b.critical))
        .map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
          type: e.critical ? "critical" : "quiet",
          data: { curve: e.curve },
          selectable: false,
          focusable: false,
        })),
    [layout, plan, pathway],
  );

  const parallel = layouts.parallel;

  return (
    <div ref={scope} className="absolute inset-0">
      <ReactFlow
        aria-label={t("roadmap.canvas")}
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        colorMode="dark"
        onInit={() => fit(layout, false)}
        minZoom={0.2}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        onNodeClick={keepNodesClickable}
        zoomOnScroll={false}
        panOnScroll
        zoomOnDoubleClick={false}
        attributionPosition="bottom-left"
        style={{ background: "transparent" }}
      >
        <WeekRuler
          ticks={weekTicks(plan)}
          height={parallel.sideLaneY ?? parallel.height}
          visible={mode === "parallel"}
        />
        {layout.sideLaneY !== null && <SideLaneLabel y={layout.sideLaneY} width={layout.width} />}
      </ReactFlow>
      <ZoomControls onFit={() => fit(layout, true)} />
    </div>
  );
}

export function RoadmapCanvas(props: RoadmapCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
