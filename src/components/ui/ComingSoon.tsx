"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { type MessageKey, useT } from "@/lib/i18n";

type ComingSoonProps = {
  labelKey: MessageKey;
  titleKey: MessageKey;
};

export function ComingSoon({ labelKey, titleKey }: ComingSoonProps) {
  const t = useT();

  return (
    <main className="flex min-h-svh flex-col justify-center bg-ink">
      <div className="mx-auto w-full max-w-7xl px-5 pt-24 pb-20 md:px-8">
        <p className="micro-label mb-6 text-mist">{t(labelKey)}</p>
        <h1 className="max-w-4xl font-display text-4xl font-medium tracking-tight md:text-6xl">
          {t(titleKey)}
        </h1>
        <span className="micro-label mt-8 inline-flex rounded-full border border-slate-line px-3 py-1.5 text-mist">
          {t("soon.badge")}
        </span>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-mist md:text-lg">
          {t("soon.body")}
        </p>
        <Link
          href="/"
          className="mt-10 inline-flex items-center gap-2 text-sm text-mist transition-colors hover:text-paper"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          {t("soon.back")}
        </Link>
      </div>
    </main>
  );
}
