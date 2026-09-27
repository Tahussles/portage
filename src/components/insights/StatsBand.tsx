"use client";

import pathwayData from "@/data/pathways/on-rn-ien.json";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { INSIGHTS, formatAsOf, formatCount, sourceName } from "./insights";

/** Two or three big sourced numbers, each with a small source line (DESIGN 6.1 item 5). */
export function StatsBand() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const guideline = pathwayData.guidelineMonths;

  return (
    <dl className="grid gap-10 md:grid-cols-3 md:gap-8">
      {INSIGHTS.stats.map((stat) => (
        <div key={stat.id} className="flex flex-col">
          <dt className="order-2 mt-3 text-sm leading-snug text-paper">{t(`insights.stat.${stat.id}`)}</dt>
          <dd className="order-1 font-display text-6xl leading-none font-medium tracking-tight tabular-nums md:text-7xl">
            {formatCount(stat.value, locale)}
          </dd>
          {stat.total !== undefined && (
            <dd className="order-3 mt-1 text-sm text-mist">
              {t(`insights.stat.${stat.id}.context`, { total: formatCount(stat.total, locale) })}
            </dd>
          )}
          <dd className="order-4 mt-3 text-xs text-mist">
            <a href={stat.source.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
              {t("insights.source", { label: sourceName(stat.source.label, t), date: formatAsOf(stat.asOf, locale) })}
            </a>
          </dd>
        </div>
      ))}
      {guideline && (
        <div className="flex flex-col">
          <dt className="order-2 mt-3 text-sm leading-snug text-paper">{t("insights.stat.guideline")}</dt>
          <dd className="order-1 font-display text-6xl leading-none font-medium tracking-tight tabular-nums md:text-7xl">
            ~{guideline}
          </dd>
          <dd className="order-4 mt-3 text-xs text-mist">
            <a href={pathwayData.regulator.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
              {t("insights.sourcePlain", { label: sourceName(pathwayData.regulator.name, t) })}
            </a>
          </dd>
        </div>
      )}
    </dl>
  );
}
