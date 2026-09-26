"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import type { ScheduleRange } from "./contract";
import { formatMonthYear } from "./format";

gsap.registerPlugin(useGSAP);

type LicenceCounterProps = {
  /** Typical finish (ISO date) of the plan currently shown. */
  finishDate: string;
  range: ScheduleRange;
  estimateShare: number;
};

const toMs = (iso: string) => Date.parse(`${iso}T00:00:00Z`);

export function LicenceCounter({ finishDate, range, estimateShare }: LicenceCounterProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const target = toMs(finishDate);
  const [shown, setShown] = useState(target);
  const tweened = useRef({ ms: target });

  // Tween the date itself, so the month ticks down with the layout animation (0.9 s, power3.inOut).
  useGSAP(
    () => {
      if (tweened.current.ms === target) return;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.to(tweened.current, {
          ms: target,
          duration: 0.9,
          ease: "power3.inOut",
          onUpdate: () => setShown(tweened.current.ms),
        });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        tweened.current.ms = target;
        setShown(target);
      });
    },
    { dependencies: [target] },
  );

  return (
    <div className="text-left md:text-right">
      <p className="micro-label text-mist">{t("roadmap.earliestLicence")}</p>
      <p
        aria-live="polite"
        className="mt-1 font-display text-5xl leading-none font-medium tracking-tight tabular-nums md:text-6xl"
      >
        {formatMonthYear(shown, locale, true)}
      </p>
      <p className="mt-2 text-sm text-mist">
        {t("roadmap.range", {
          best: formatMonthYear(range.bestFinish, locale),
          conservative: formatMonthYear(range.conservativeFinish, locale),
        })}
      </p>
      <p className="mt-1 text-xs text-mist">
        {t("roadmap.estimated", { n: Math.round(estimateShare * 100) })}
      </p>
    </div>
  );
}
