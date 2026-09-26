"use client";

import { useT } from "@/lib/i18n";
import { ProvinceMap } from "./ProvinceMap";
import { StageFunnel } from "./StageFunnel";
import { StatsBand } from "./StatsBand";

export function InsightsView() {
  const t = useT();
  return (
    <main className="min-h-svh bg-ink pt-16">
      <div className="relative isolate overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[url(/topo.svg)] bg-cover bg-center opacity-[0.06]"
        />
        <div className="mx-auto max-w-6xl px-5 pt-10 pb-16 md:px-8 md:pt-14">
          <p className="micro-label text-mist">{t("insights.label")}</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-tight font-medium tracking-tight md:text-6xl">
            {t("insights.title")}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-mist md:text-base">{t("insights.intro")}</p>

          <div className="mt-14">
            <StatsBand />
          </div>

          <div className="mt-20 grid gap-14 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            <ProvinceMap />
            <StageFunnel />
          </div>

          <p className="mt-20 border-t border-slate-line pt-6 text-xs text-mist">{t("insights.footer")}</p>
        </div>
      </div>
    </main>
  );
}
