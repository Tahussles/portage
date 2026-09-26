"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AlertTriangle, Info } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import type { PlanWarning } from "@/lib/engine/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { pick } from "./format";

gsap.registerPlugin(useGSAP);

type WarningStackProps = {
  warnings: PlanWarning[];
  onSeeFix: (nodeId: string, trigger: HTMLElement) => void;
  className?: string;
};

const SEVERITY_ORDER = { critical: 0, warn: 1, info: 2 } as const;

export function WarningStack({ warnings, onSeeFix, className }: WarningStackProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const scope = useRef<HTMLElement>(null);
  const sorted = [...warnings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-warning]", {
          x: 32,
          opacity: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.08,
          delay: 0.6,
        });
      });
    },
    { scope },
  );

  if (sorted.length === 0) return null;

  return (
    <section ref={scope} aria-label={t("roadmap.warnings")} className={cn("flex flex-col gap-2", className)}>
      {sorted.map((w) => {
        const Icon = w.severity === "info" ? Info : AlertTriangle;
        return (
          <article
            key={w.id}
            data-warning
            className={cn(
              "rounded-r-[var(--radius)] rounded-l-none border-l-2 bg-granite/95 p-3.5 backdrop-blur",
              w.severity === "info" ? "border-mist" : "border-accent",
            )}
          >
            <div className="flex items-start gap-2.5">
              <Icon
                aria-hidden="true"
                className={cn("mt-0.5 size-4 shrink-0", w.severity === "info" ? "text-mist" : "text-accent")}
              />
              <div className="min-w-0">
                <h3 className="text-sm leading-snug font-medium text-paper">{pick(w.title, locale)}</h3>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">{pick(w.body, locale)}</p>
                {w.relatedNodes[0] && (
                  <button
                    type="button"
                    onClick={(e) => onSeeFix(w.relatedNodes[0], e.currentTarget)}
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
