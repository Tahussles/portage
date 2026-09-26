"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { LIVE_PROVINCES, type ProvinceMapData } from "./insights";

/** Simplified provinces (public/geo, from scripts/gen-geo.mjs). Ontario is live; others are coming soon. */
export function ProvinceMap() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const [map, setMap] = useState<ProvinceMapData | null>(null);
  const [focus, setFocus] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/geo/canada-provinces.json")
      .then((r) => r.json())
      .then((data: ProvinceMapData) => alive && setMap(data))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const focused = map?.provinces.find((p) => p.code === focus);
  const status = (code: string) => (LIVE_PROVINCES.has(code) ? t("insights.map.live") : t("insights.map.soon"));

  return (
    <figure className="relative">
      <p aria-live="polite" className="micro-label mb-3 min-h-4 text-mist">
        {focused ? `${focused.name[locale] || focused.name.en} · ${status(focused.code)}` : t("insights.map.label")}
      </p>
      <div className="aspect-[1000/850] w-full">
        {map && (
          <svg viewBox={map.viewBox} role="group" aria-label={t("insights.map.aria")} className="size-full overflow-visible">
            {map.provinces.map((p) => {
              const live = LIVE_PROVINCES.has(p.code);
              return (
                <path
                  key={p.code}
                  d={p.d}
                  tabIndex={0}
                  role="img"
                  aria-label={`${p.name[locale] || p.name.en}: ${status(p.code)}`}
                  onMouseEnter={() => setFocus(p.code)}
                  onMouseLeave={() => setFocus(null)}
                  onFocus={() => setFocus(p.code)}
                  onBlur={() => setFocus(null)}
                  className={cn(
                    "cursor-default stroke-slate-line outline-none [stroke-width:0.75] transition-[transform,fill] duration-300 motion-reduce:transition-none",
                    "hover:-translate-y-0.5 focus-visible:-translate-y-0.5 focus-visible:stroke-paper",
                    live ? "fill-accent stroke-accent" : "fill-transparent hover:fill-granite focus-visible:fill-granite",
                  )}
                  style={{ transformBox: "fill-box", transformOrigin: "center", strokeWidth: live ? 0.75 : 1.25 }}
                />
              );
            })}
          </svg>
        )}
      </div>
      <figcaption className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-mist">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm bg-accent" />
          {t("insights.map.live")}
        </span>
        <span className="inline-flex items-center gap-2">
          <span aria-hidden="true" className="size-2.5 rounded-sm border border-mist/60" />
          {t("insights.map.soon")}
        </span>
        <span>{t("insights.map.note")}</span>
      </figcaption>
    </figure>
  );
}
