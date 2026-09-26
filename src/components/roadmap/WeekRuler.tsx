"use client";

import { ViewportPortal } from "@xyflow/react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { WEEK_PX } from "./layout";

type WeekRulerProps = {
  ticks: number[];
  /** Height of the lanes the guide lines run through. */
  height: number;
  visible: boolean;
};

/** "Week 0, 4, 8..." along the top of the parallel timeline, drawn in flow coordinates. */
export function WeekRuler({ ticks, height, visible }: WeekRulerProps) {
  const t = useT();
  return (
    <ViewportPortal>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-0 left-0 transition-opacity duration-500 motion-reduce:transition-none",
          visible ? "opacity-100" : "opacity-0",
        )}
      >
        {ticks.map((week) => (
          <div
            key={week}
            className="absolute"
            style={{ transform: `translate(${week * WEEK_PX}px, -44px)` }}
          >
            <span className="micro-label block -translate-x-1/2 whitespace-nowrap text-mist">
              {t("roadmap.week", { n: week })}
            </span>
            <span
              className="absolute top-6 left-0 w-px border-l border-dashed border-slate-line"
              style={{ height: height + 20 }}
            />
          </div>
        ))}
      </div>
    </ViewportPortal>
  );
}
