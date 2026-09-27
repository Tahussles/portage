"use client";

import { useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { profileFixture } from "@/lib/demo";
import { buildPlan } from "@/lib/engine/plan";
import { HearPlan } from "@/components/speak/HearPlan";
import { NextLink } from "@/components/ui/NextLink";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import type { Pathway } from "@/lib/engine/types";
import { LayoutToggle } from "./LayoutToggle";
import { LicenceCounter } from "./LicenceCounter";
import { RoadmapCanvas } from "./RoadmapCanvas";
import { statusOf, type LayoutMode } from "./layout";
import { SidePanel } from "./SidePanel";
import { WarningStack } from "./WarningStack";
import { flaggedNodes, protectingSteps, viewWarnings } from "./warnings-view";

const pathway = pathwayData as unknown as Pathway;

/** Priya (composite persona): shown until someone completes the intake. */
const SAMPLE_PROFILE = profileFixture().profile;

// The page is prerendered, so the server and the hydration pass build the plan as of the pathway's
// last review date (a constant both sides agree on); the browser then rebuilds it for the visitor's
// local date. Cached so every render in a session agrees.
const REFERENCE_DATE = pathway.lastReviewed;
let todayCache: string | null = null;
const getToday = () => (todayCache ??= new Date().toLocaleDateString("en-CA"));
const getReferenceDate = () => REFERENCE_DATE;
const subscribeNever = () => () => {};

export function RoadmapView() {
  const t = useT();
  const profile = useAppStore((s) => s.profile);
  const locale = useAppStore((s) => s.locale);
  const today = useSyncExternalStore(subscribeNever, getToday, getReferenceDate);
  const plan = useMemo(() => buildPlan(profile ?? SAMPLE_PROFILE, pathway, today), [profile, today]);
  const isSample = profile === null;

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
  const warnings = useMemo(() => viewWarnings(plan, mode), [plan, mode]);
  const flagged = useMemo(() => flaggedNodes(warnings), [warnings]);
  const protecting = useMemo(() => protectingSteps(plan, pathway, mode), [plan, mode]);
  const step = pathway.nodes.find((n) => n.id === panel.id) ?? null;

  return (
    <main className="flex min-h-svh flex-col bg-ink pt-(--nav-h) md:h-svh">
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
          <div className="flex flex-col gap-3">
            <LicenceCounter
            finishDate={schedule.finishDate}
            range={schedule.range}
            estimateShare={plan.estimateShare}
          />
            <HearPlan
              key={`${mode}-${(profile ?? SAMPLE_PROFILE).spokenLanguage ?? locale}`}
              plan={plan}
              pathway={pathway}
              schedule={mode}
              language={(profile ?? SAMPLE_PROFILE).spokenLanguage ?? locale}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 flex-col md:min-h-0 md:flex-row">
        <div className="order-last flex flex-col gap-6 border-t border-slate-line p-4 md:order-none md:w-[340px] md:shrink-0 md:overflow-y-auto md:border-t-0 md:border-r">
          {plan.warnings.length > 0 && <WarningStack views={warnings} protecting={protecting} onSeeFix={openStep} />}
          <NextLink from="roadmap" className="mt-auto" />
        </div>
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
            flagged={flagged}
            onOpen={openStep}
          />
        </div>
      </div>

      <SidePanel
        open={panel.open}
        step={step}
        status={step ? statusOf(plan, step.id) : "todo"}
        critical={step ? plan.parallel.criticalPath.includes(step.id) : false}
        warnings={step ? warnings.filter((v) => v.warning.relatedNodes.includes(step.id)) : []}
        onClose={closePanel}
      />
    </main>
  );
}
