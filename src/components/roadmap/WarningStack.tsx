"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AlertTriangle, Check, ExternalLink, Info } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { formatMonthYear, pick } from "./format";
import { backupFor, isTight, warningCopy, type ProtectingStep, type WarningView } from "./warnings-view";

gsap.registerPlugin(useGSAP);

type WarningStackProps = {
  views: WarningView[];
  /** First not-done critical-path steps on the schedule on screen, listed under tight warnings. */
  protecting: ProtectingStep[];
  onSeeFix: (nodeId: string, trigger: HTMLElement) => void;
  className?: string;
};

const EASE = { duration: 0.5, ease: "power2.out" } as const;

export function WarningStack({ views, protecting, onSeeFix, className }: WarningStackProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const scope = useRef<HTMLElement>(null);
  const previous = useRef<Map<string, string> | null>(null);
  const signature = (v: WarningView) => `${v.state.kind}:${v.state.kind === "active" ? v.state.severity : ""}`;
  const stateKey = views.map((v) => `${v.warning.id}=${signature(v)}`).join("|");

  // Cards rise in once, after the canvas starts assembling.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-warning]", { x: 32, opacity: 0, duration: 0.5, ease: "power2.out", stagger: 0.08, delay: 0.6 });
      });
    },
    { scope },
  );

  // A card changing state (toggle): the red rule fades to stone and a check appears, or the red
  // rule grows back. The DOM already shows the end state; these tweens only play the transition.
  useGSAP(
    () => {
      const now = new Map(views.map((v) => [v.warning.id, signature(v)]));
      const before = previous.current;
      previous.current = now;
      if (!before) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        for (const [id, sig] of now) {
          const was = before.get(id);
          if (!was || was === sig) continue;
          const card = scope.current?.querySelector(`[data-warning="${id}"]`);
          if (!card) continue;
          const q = gsap.utils.selector(card);
          const kind = sig.split(":")[0];
          if (kind === was.split(":")[0]) {
            // Same state, new severity (critical <-> tight): only the copy changes.
            gsap.from(q("[data-copy]"), { opacity: 0, y: 4, ...EASE, clearProps: "all" });
            continue;
          }
          if (kind === "resolved") {
            gsap.fromTo(q("[data-rule]"), { opacity: 1 }, { opacity: 0, ...EASE, clearProps: "opacity" });
            gsap.fromTo(q("[data-icon='resolved']"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, ...EASE, clearProps: "all" });
            gsap.fromTo(q("[data-icon='active']"), { opacity: 1 }, { opacity: 0, ...EASE, clearProps: "opacity" });
          } else {
            gsap.fromTo(
              q("[data-rule]"),
              { scaleY: 0, opacity: 1 },
              { scaleY: 1, transformOrigin: "top", ...EASE, clearProps: "all" },
            );
            gsap.fromTo(q("[data-icon='active']"), { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, ...EASE, clearProps: "all" });
            gsap.fromTo(q("[data-icon='resolved']"), { opacity: 1 }, { opacity: 0, ...EASE, clearProps: "opacity" });
          }
          gsap.from(q("[data-copy]"), { opacity: 0, y: 4, ...EASE, clearProps: "all" });
        }
      });
    },
    { scope, dependencies: [stateKey] },
  );

  if (views.length === 0) return null;

  return (
    <section
      ref={scope}
      aria-label={t("roadmap.warnings")}
      aria-live="polite"
      className={cn("flex flex-col gap-2", className)}
    >
      <h2 className="sr-only">{t("roadmap.warnings")}</h2>
      {views.map((view) => {
        const { warning, state } = view;
        const resolved = state.kind === "resolved";
        const info = state.kind === "active" && state.severity === "info";
        const tight = isTight(view);
        const backup = tight ? backupFor(warning) : null;
        const copy = warningCopy(view, t, locale);
        const Icon = info ? Info : AlertTriangle;
        return (
          <article
            key={warning.id}
            data-warning={warning.id}
            className="relative overflow-hidden rounded-r-[var(--radius)] rounded-l-none bg-granite/95 p-3.5 pl-4 backdrop-blur"
          >
            <span aria-hidden="true" className="absolute inset-y-0 left-0 w-0.5 bg-stone-600" />
            <span
              aria-hidden="true"
              data-rule
              className={cn(
                "absolute inset-y-0 left-0",
                // Critical: solid red. Tight: dashed red (still at risk, but only if something slips).
                tight ? "w-0 border-l-2 border-dashed border-accent" : cn("w-0.5", info ? "bg-mist" : "bg-accent"),
                resolved && "opacity-0",
              )}
            />
            <div className="flex items-start gap-2.5">
              <span aria-hidden="true" className="relative mt-0.5 size-4 shrink-0">
                <Icon
                  data-icon="active"
                  className={cn("absolute inset-0 size-4", info ? "text-mist" : "text-accent", resolved && "opacity-0")}
                />
                <Check
                  data-icon="resolved"
                  strokeWidth={2.5}
                  className={cn("absolute inset-0 size-4 text-paper", !resolved && "opacity-0")}
                />
              </span>
              <div data-copy className="min-w-0">
                {resolved && copy.label && <p className="micro-label mb-1.5 text-mist">{copy.label}</p>}
                <h3 className={cn("text-sm leading-snug font-medium", resolved ? "text-mist" : "text-paper")}>
                  {copy.title}
                </h3>
                <p className={cn("mt-1 text-xs leading-relaxed text-mist", !resolved && !tight && "line-clamp-2")}>{copy.body}</p>
                {copy.facts && <p className="mt-1.5 text-xs text-paper/90">{copy.facts}</p>}
                {!resolved && copy.label && <p className="micro-label mt-1.5 text-accent">{copy.label}</p>}
                {tight && protecting.length > 0 && (
                  <div className="mt-3">
                    <p className="micro-label text-mist">{t("warnings.protects")}</p>
                    <ol className="mt-1.5 space-y-1">
                      {protecting.map((step) => (
                        <li key={step.id}>
                          <button
                            type="button"
                            onClick={(e) => onSeeFix(step.id, e.currentTarget)}
                            className="flex w-full items-baseline justify-between gap-3 text-left text-xs text-paper underline-offset-4 hover:underline"
                          >
                            <span className="min-w-0">{pick(step.title, locale)}</span>
                            <span className={cn("max-w-22 shrink-0 text-right", step.startsNow ? "text-accent" : "text-mist")}>
                              {step.startsNow ? t("warnings.startNow") : t("roadmap.week", { n: step.startWeek })}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {backup && (
                  <p className="mt-2.5 text-xs leading-relaxed text-mist">
                    {t("warnings.backup", { until: formatMonthYear(`${backup.until}-01`, locale) })}{" "}
                    <a
                      href={backup.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-paper underline-offset-4 hover:underline"
                    >
                      {t("warnings.backupSource")}
                      <ExternalLink aria-hidden="true" className="size-3" />
                    </a>
                  </p>
                )}
                {!resolved && warning.relatedNodes[0] && (
                  <button
                    type="button"
                    onClick={(e) => onSeeFix(warning.relatedNodes[0], e.currentTarget)}
                    className="mt-2 text-xs font-medium text-paper underline-offset-4 hover:underline"
                  >
                    {t("roadmap.seeFix")}
                  </button>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
