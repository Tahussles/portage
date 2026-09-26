"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n";
import { AppLink } from "./AppLink";

export function NotFoundView() {
  const t = useT();
  return (
    <main className="flex min-h-svh flex-col justify-center bg-ink pt-(--nav-h)">
      <div className="relative isolate mx-auto w-full max-w-7xl px-5 py-20 md:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[url(/topo.svg)] bg-cover opacity-[0.06]" />
        <p className="micro-label text-mist">{t("notFound.label")}</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight font-medium tracking-tight md:text-6xl">
          {t("notFound.title")}
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-mist">{t("notFound.body")}</p>
        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <AppLink href="/" className="inline-flex items-center gap-2 rounded-full bg-paper px-5 py-2.5 text-sm font-medium text-ink">
            <ArrowLeft aria-hidden="true" className="size-4" />
            {t("notFound.home")}
          </AppLink>
          <AppLink href="/roadmap" className="inline-flex items-center gap-2 text-sm text-mist underline-offset-4 hover:text-paper hover:underline">
            {t("notFound.roadmap")}
            <ArrowRight aria-hidden="true" className="size-4" />
          </AppLink>
        </div>
      </div>
    </main>
  );
}
