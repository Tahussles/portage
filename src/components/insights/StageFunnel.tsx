"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { htmlLang, type MessageKey, useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { INSIGHTS, funnelBars } from "./insights";

gsap.registerPlugin(useGSAP);

/** Horizontal bars for the requirement stages; the biggest drop is red. Illustrative until real per-stage data exists. */
export function StageFunnel() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const percent = new Intl.NumberFormat(htmlLang[locale], { style: "percent" });
  const scope = useRef<HTMLElement>(null);
  const bars = funnelBars(INSIGHTS.funnel.stages);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-bar]", {
          scaleX: 0,
          transformOrigin: "left center",
          duration: 0.8,
          stagger: 0.06,
          ease: "power2.out",
        });
      });
    },
    { scope },
  );

  return (
    <section ref={scope} aria-labelledby="funnel-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="funnel-title" className="micro-label text-mist">
          {t("insights.funnel.title")}
        </h2>
        {INSIGHTS.funnel.illustrative && (
          <span className="micro-label rounded-full border border-mist/60 px-2.5 py-1 text-mist">
            {t("insights.illustrative")}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm text-mist">{t("insights.funnel.caption")}</p>
      <ol className="mt-5 flex flex-col gap-2.5">
        {bars.map((bar) => (
          <li key={bar.nodeId} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-3 text-sm sm:grid-cols-[12rem_1fr_3rem]">
            <span className="truncate text-paper">{t(`insights.stage.${bar.nodeId}` as MessageKey)}</span>
            <span className="h-2.5 overflow-hidden rounded-full bg-granite">
              <span
                data-bar
                className={cn("block h-full rounded-full", bar.biggestDrop ? "bg-accent" : "bg-stone-500")}
                style={{ width: `${Math.round(bar.share * 100)}%` }}
              />
            </span>
            <span className="text-right text-xs whitespace-nowrap text-mist tabular-nums">{percent.format(bar.share)}</span>
          </li>
        ))}
      </ol>
      {INSIGHTS.funnel.illustrative && <p className="mt-4 max-w-xl text-xs leading-relaxed text-mist">{t("insights.funnel.note")}</p>}
    </section>
  );
}
