"use client";

import { useCallback, useRef, useState } from "react";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import samplePlan from "@/data/fixtures/plan-priya.provisional.json";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import type { RoadmapPathway, RoadmapPlan } from "./contract";
import { LayoutToggle } from "./LayoutToggle";
import { LicenceCounter } from "./LicenceCounter";
import { RoadmapCanvas } from "./RoadmapCanvas";
import { statusOf, type LayoutMode } from "./layout";
import { SidePanel } from "./SidePanel";
import { WarningStack } from "./WarningStack";

const pathway = pathwayData as unknown as RoadmapPathway;

// TODO(engine): once the engine lands (src/lib/engine/plan.ts), build the plan from the profile:
//   const plan = profile ? buildPlan(profile, pathway, today) : null;
// and fall back to the sample only when there is no profile. Until then every visitor sees the
// provisional Priya plan, which is labelled as a sample in the header.
const PROVISIONAL_PLAN = samplePlan as unknown as RoadmapPlan;

export function RoadmapView() {
  const t = useT();
  const profile = useAppStore((s) => s.profile);
  const plan = PROVISIONAL_PLAN;
  const isSample = profile === null || plan === PROVISIONAL_PLAN;

  const [mode, setMode] = useState<LayoutMode>("sequential");
  const [panel, setPanel] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const trigger = useRef<HTMLElement | null>(null);

  const openStep = useCallback((id: string, from: HTMLElement) => {
    trigger.current = from;
    setPanel({ open: true, id });
  }, []);

  const closePanel = useCallback(() => {
    setPanel((p) => ({ ...p, open: false }));
    trigger.current?.focus({ preventScroll: true });
  }, []);

  const schedule = plan[mode];
  const step = pathway.nodes.find((n) => n.id === panel.id) ?? null;

  return (
    <main className="flex min-h-svh flex-col bg-ink pt-16 md:h-svh">
      <header className="flex flex-col gap-5 border-b border-slate-line px-5 py-5 lg:flex-row lg:items-end lg:justify-between md:px-8">
        <div className="max-w-xl">
          <p className="micro-label text-mist">{t("roadmap.label")}</p>
          <h1 className="mt-2 font-display text-3xl font-medium tracking-tight md:text-4xl">
            {t("roadmap.title")}
          </h1>
          {isSample && (
            <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mist">
              <span className="rounded-full border border-slate-line px-3 py-1 text-paper">
                {t("roadmap.sample")}
              </span>
              <span>{t("roadmap.sampleNote")}</span>
            </p>
          )}
        </div>
        <div className="flex flex-col-reverse gap-5 md:flex-row md:items-end md:gap-8">
          <div className="flex flex-col gap-1.5 md:items-end">
            <LayoutToggle mode={mode} onChange={setMode} />
            <p className="text-xs text-mist">
              {mode === "parallel" ? t("roadmap.ifToPlan") : t("roadmap.oneAtATimeNote")}
            </p>
          </div>
          <LicenceCounter
            finishDate={schedule.finishDate}
            range={schedule.range}
            estimateShare={plan.estimateShare}
          />
        </div>
      </header>

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        {plan.warnings.length > 0 && (
          <div className="order-last border-t border-slate-line p-4 md:order-none md:w-[340px] md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-r">
            <WarningStack warnings={plan.warnings} onSeeFix={openStep} />
          </div>
        )}
        <div className="relative min-h-[70svh] flex-1 overflow-hidden md:min-h-0">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[url(/topo.svg)] bg-cover bg-center opacity-[0.06]"
          />
          <RoadmapCanvas
            plan={plan}
            pathway={pathway}
            mode={mode}
            activeId={panel.open ? panel.id : null}
            onOpen={openStep}
          />
        </div>
      </div>

      <SidePanel
        open={panel.open}
        step={step}
        status={step ? statusOf(plan, step.id) : "todo"}
        critical={step ? plan.parallel.criticalPath.includes(step.id) : false}
        warnings={step ? plan.warnings.filter((w) => w.relatedNodes.includes(step.id)) : []}
        onClose={closePanel}
      />
    </main>
  );
}
