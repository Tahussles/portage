"use client";

import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import { AlertTriangle, Check, Circle } from "lucide-react";
import { memo } from "react";
import { cn } from "@/lib/cn";
import type { NodeStatus } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { ActorIcon } from "./ActorIcon";
import type { RoadmapNode } from "./contract";
import { formatDurationRange, pick } from "./format";
import { KindBadge } from "./KindBadge";
import { NODE_WIDTH } from "./layout";

export type StepNodeData = {
  step: RoadmapNode;
  status: NodeStatus;
  critical: boolean;
  side: boolean;
  /** Parallel timeline: title and duration only. */
  compact: boolean;
  height: number;
  order: number;
  onOpen: (id: string, trigger: HTMLElement) => void;
};

export type StepNodeType = Node<StepNodeData, "step">;

const HANDLES = [
  { id: "left-target", type: "target", position: Position.Left },
  { id: "right-target", type: "target", position: Position.Right },
  { id: "top-target", type: "target", position: Position.Top },
  { id: "left-source", type: "source", position: Position.Left },
  { id: "right-source", type: "source", position: Position.Right },
  { id: "bottom-source", type: "source", position: Position.Bottom },
] as const;

function StatusGlyph({ status }: { status: NodeStatus }) {
  if (status === "done") {
    return (
      <span className="grid size-5 place-items-center rounded-full bg-paper text-ink">
        <Check aria-hidden="true" className="size-3" strokeWidth={3} />
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="grid size-5 place-items-center rounded-full ring-1 ring-accent">
        <AlertTriangle aria-hidden="true" className="size-3 text-accent" />
      </span>
    );
  }
  return <Circle aria-hidden="true" className="size-5 text-slate-line" strokeWidth={1.5} />;
}

function StepNodeView({ id, data }: NodeProps<StepNodeType>) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const { step, status, critical, side, compact, height, order, onOpen } = data;
  const title = pick(step.title, locale);

  return (
    <>
      {HANDLES.map((h) => (
        <Handle
          key={h.id}
          id={h.id}
          type={h.type}
          position={h.position}
          isConnectable={false}
          className="!pointer-events-none !size-1 !min-h-0 !min-w-0 !border-0 !bg-transparent"
        />
      ))}
      <button
        type="button"
        data-step-card
        data-order={order}
        onClick={(e) => onOpen(id, e.currentTarget)}
        aria-label={t("roadmap.openStep", { title })}
        style={{ width: NODE_WIDTH, height }}
        className={cn(
          "roadmap-step group relative flex flex-col gap-2 rounded-[var(--radius)] border bg-granite p-3 text-left transition-colors",
          side ? "border-dashed border-slate-line" : "border-slate-line",
          critical && "ring-1 ring-accent",
          status === "blocked" && "ring-1 ring-accent",
          status === "done" && "opacity-70",
          "hover:border-mist/50",
        )}
      >
        {!compact && (
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-mist">
              {step.actor.map((a) => (
                <ActorIcon key={a} actor={a} className="size-3.5" />
              ))}
            </span>
            <span className="flex items-center gap-2">
              {critical && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
              <StatusGlyph status={status} />
            </span>
          </span>
        )}
        <span className="sr-only">
          {step.actor.map((a) => t(`actor.${a}`)).join(", ")}. {t(`status.${status}`)}
          {critical ? `, ${t("status.critical")}` : ""}
        </span>
        <span className="line-clamp-2 font-display text-[15px] leading-snug font-medium text-paper">
          {title}
        </span>
        <span className="mt-auto flex items-center justify-between gap-2 text-xs text-mist">
          <span className="flex min-w-0 items-center gap-2">
            {compact && critical && <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-accent" />}
            {compact && status !== "todo" && <StatusGlyph status={status} />}
            <span className="truncate">{formatDurationRange(step.duration, t)}</span>
          </span>
          <KindBadge kind={step.duration.kind} />
        </span>
      </button>
    </>
  );
}

export const StepNode = memo(StepNodeView);
