"use client";

import { AlertTriangle, Check, ExternalLink, Info, Plane, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { NodeStatus, PathwayNode } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { ActorIcon } from "./ActorIcon";
import { formatCad, formatDay, formatDurationRange, formatTypical, pick } from "./format";
import { KindBadge } from "./KindBadge";
import { warningCopy, type WarningView } from "./warnings-view";

type SidePanelProps = {
  open: boolean;
  /** Last opened step; kept while the panel slides out. */
  step: PathwayNode | null;
  status: NodeStatus;
  critical: boolean;
  /** Warnings for this step on the schedule on screen (active or resolved). */
  warnings: WarningView[];
  onClose: () => void;
};

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-slate-line pt-5">
      <h3 className="micro-label mb-3 text-mist">{label}</h3>
      {children}
    </section>
  );
}

export function SidePanel({ open, step, status, critical, warnings, onClose }: SidePanelProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, step?.id, onClose]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby="step-panel-title"
      aria-hidden={!open}
      inert={!open}
      className={cn(
        "fixed top-(--nav-h) right-0 bottom-0 z-40 flex w-full flex-col border-l border-slate-line bg-granite shadow-2xl shadow-black/60 transition-transform duration-500 ease-out motion-reduce:transition-none sm:w-[420px]",
        open ? "translate-x-0" : "translate-x-full",
      )}
    >
      {step && (
        <>
          <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
            <div className="min-w-0">
              <p className="micro-label flex items-center gap-2 text-mist">
                {critical && <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />}
                {t(`status.${status}`)}
                {critical && <span>· {t("status.critical")}</span>}
              </p>
              <h2 id="step-panel-title" className="mt-2 font-display text-2xl leading-tight font-medium">
                {pick(step.title, locale)}
              </h2>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={t("panel.close")}
              className="grid size-9 shrink-0 place-items-center rounded-full border border-slate-line text-mist transition-colors hover:text-paper"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </header>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 pb-8">
            <p className="text-sm leading-relaxed text-paper/90">{pick(step.summary, locale)}</p>

            {step.canStartBeforeArrival && (
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-line px-3 py-1 text-xs text-mist">
                <Plane aria-hidden="true" className="size-3.5" />
                {t("panel.beforeArrival")}
              </p>
            )}

            <Section label={t("panel.who")}>
              <ul className="flex flex-wrap gap-2">
                {step.actor.map((a) => (
                  <li
                    key={a}
                    className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-xs text-paper"
                  >
                    <ActorIcon actor={a} className="size-3.5 text-mist" />
                    {t(`actor.${a}`)}
                  </li>
                ))}
              </ul>
            </Section>

            <Section label={t("panel.time")}>
              <div className="flex items-center gap-3">
                <span className="font-display text-lg">{formatDurationRange(step.duration, t)}</span>
                <KindBadge kind={step.duration.kind} />
              </div>
              <p className="mt-1 text-sm text-mist">{formatTypical(step.duration.typicalWeeks, t)}</p>
              <p lang="en" className="mt-2 text-xs leading-relaxed text-mist">
                {step.duration.note}
              </p>
            </Section>

            <Section label={t("panel.cost")}>
              {step.cost && step.cost.amountCad !== null ? (
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg">{formatCad(step.cost.amountCad, locale)}</span>
                  <KindBadge kind={step.cost.kind} />
                </div>
              ) : (
                <p className="text-sm text-mist">{t("panel.costUnknown")}</p>
              )}
              {step.cost?.note && (
                <p lang="en" className="mt-2 text-xs leading-relaxed text-mist">
                  {step.cost.note}
                </p>
              )}
            </Section>

            {warnings.length > 0 && (
              <Section label={t("panel.warnings")}>
                <ul className="space-y-2">
                  {warnings.map((view) => {
                    const resolved = view.state.kind === "resolved";
                    const info = view.state.kind === "active" && view.state.severity === "info";
                    const copy = warningCopy(view, t, locale);
                    const Icon = resolved ? Check : info ? Info : AlertTriangle;
                    return (
                      <li
                        key={view.warning.id}
                        className={cn(
                          "rounded-r-[var(--radius)] rounded-l-none border-l-2 bg-ink p-3",
                          resolved ? "border-stone-600" : info ? "border-mist" : "border-accent",
                        )}
                      >
                        {resolved && copy.label && <p className="micro-label mb-1.5 text-mist">{copy.label}</p>}
                        <p className="flex items-start gap-2 text-sm font-medium">
                          <Icon
                            aria-hidden="true"
                            className={cn(
                              "mt-0.5 size-4 shrink-0",
                              resolved ? "text-paper" : info ? "text-mist" : "text-accent",
                            )}
                          />
                          {copy.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-mist">{copy.body}</p>
                        {copy.facts && <p className="mt-1.5 text-xs text-paper/90">{copy.facts}</p>}
                        {!resolved && copy.label && <p className="micro-label mt-1.5 text-accent">{copy.label}</p>}
                      </li>
                    );
                  })}
                </ul>
              </Section>
            )}

            <Section label={t("panel.sources")}>
              <ul className="space-y-3">
                {step.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-start gap-2 text-sm text-paper underline-offset-4 hover:underline"
                    >
                      <ExternalLink aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-mist" />
                      <span>
                        {s.label}
                        <span className="sr-only"> ({t("panel.newTab")})</span>
                      </span>
                    </a>
                    <p className="mt-0.5 pl-5.5 text-xs text-mist">
                      {t("panel.accessed", { date: formatDay(s.accessed, locale) })}
                    </p>
                  </li>
                ))}
              </ul>
              {locale === "fr" && <p className="mt-4 text-xs text-mist">{t("panel.dataNote")}</p>}
            </Section>
          </div>
        </>
      )}
    </aside>
  );
}
