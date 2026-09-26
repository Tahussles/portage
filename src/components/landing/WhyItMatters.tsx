"use client";

import { INSIGHTS, formatAsOf, formatCount } from "@/components/insights/insights";
import pathwayData from "@/data/pathways/on-rn-ien.json";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** Exactly three sourced numbers, all read from data files (never typed as literals). */
export function WhyItMatters() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const applicants = INSIGHTS.stats.find((s) => s.id === "international_applicants");

  const stats = [
    applicants && {
      key: "applicants",
      value: formatCount(applicants.value, locale),
      label: t("why.applicants"),
      source: t("insights.source", { label: applicants.source.label, date: formatAsOf(applicants.asOf, locale) }),
      url: applicants.source.url,
    },
    pathwayData.guidelineMonths && {
      key: "guideline",
      value: `~${pathwayData.guidelineMonths}`,
      label: t("why.guideline"),
      source: t("insights.sourcePlain", { label: pathwayData.regulator.name }),
      url: pathwayData.regulator.url,
    },
    {
      key: "requirements",
      value: formatCount(INSIGHTS.requirements.items.length, locale),
      label: t("why.requirements"),
      source: t("insights.sourcePlain", { label: INSIGHTS.requirements.source.label }),
      url: INSIGHTS.requirements.source.url,
    },
  ].filter((s): s is Exclude<typeof s, undefined | 0 | null> => Boolean(s));

  return (
    <section aria-labelledby="why-title" className="bg-ink">
      <div className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28">
        <h2 id="why-title" className="micro-label text-mist">
          {t("why.label")}
        </h2>
        <dl className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
          {stats.map((stat) => (
            <div key={stat.key} className="flex flex-col">
              <dt className="order-2 mt-3 max-w-xs text-base leading-snug text-paper">{stat.label}</dt>
              <dd className="order-1 font-display text-6xl leading-none font-medium tracking-tight tabular-nums md:text-8xl">
                {stat.value}
              </dd>
              <dd className="order-3 mt-3 text-xs text-mist">
                <a href={stat.url} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:underline">
                  {stat.source}
                </a>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
