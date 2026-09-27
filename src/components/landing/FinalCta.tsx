"use client";

import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { useT } from "@/lib/i18n";

export function FinalCta() {
  const t = useT();
  return (
    <section className="border-t border-slate-line bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col items-start gap-10 px-5 py-24 md:px-8 md:py-32">
        <p className="font-display text-[clamp(2.5rem,7vw,5.5rem)] leading-[1.05] font-medium tracking-tight">
          <span className="block text-paper">
            {t("cta.line1")}
          </span>
          <span className="block text-stone-500">
            {t("cta.line2")}
          </span>
        </p>
        <AppLink
          href="/start"
          className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-accent-hover"
        >
          {t("hero.cta")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </AppLink>
      </div>
    </section>
  );
}
