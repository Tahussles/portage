"use client";

import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { formatMonthYear, pick } from "@/components/roadmap/format";
import { cn } from "@/lib/cn";
import type { PlanSummary } from "@/lib/account/plan-summary";
import { initials } from "@/lib/account/seed";
import type { Account } from "@/lib/account/types";
import { htmlLang, useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

const R = 26;
const C = 2 * Math.PI * R;

/** Avatar and name, steps done, the earliest licence on the Portage plan, and the next step. */
export function ProfileHeader({ account, summary }: { account: Account; summary: PlanSummary }) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const since = new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: "long" }).format(new Date(account.createdAt));
  const share = summary.total ? summary.done / summary.total : 0;

  return (
    <section className="grid gap-6 rounded-[var(--radius)] border border-slate-line bg-granite/60 p-6 md:grid-cols-[1.2fr_auto_1.3fr] md:items-center md:gap-10">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full bg-ink font-display text-2xl text-paper ring-1 ring-slate-line">
          {initials(account.displayName)}
        </span>
        <div className="min-w-0">
          <h1 className="truncate font-display text-3xl font-medium tracking-tight">{account.displayName}</h1>
          <p className="text-sm text-mist">{t("profile.memberSince", { date: since })}</p>
          {account.legalName && <p className="mt-0.5 truncate text-xs text-mist">{t("profile.legalName", { name: account.legalName })}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden="true">
          <circle cx="32" cy="32" r={R} fill="none" stroke="#292524" strokeWidth="5" />
          <circle cx="32" cy="32" r={R} fill="none" stroke="#D52B1E" strokeWidth="5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - share)} />
        </svg>
        <p className="max-w-32 text-sm leading-snug text-paper">{t("profile.steps", { done: summary.done, total: summary.total })}</p>
      </div>

      <div className="flex flex-col gap-2 md:items-end md:text-right">
        <p className="micro-label text-mist">{t("profile.licence")}</p>
        <p className="font-display text-4xl leading-none font-medium tracking-tight tabular-nums">{formatMonthYear(summary.finish, locale, true)}</p>
        <p className={cn("text-xs", summary.state === "clear" ? "text-mist" : "text-accent")}>
          {summary.state === "tight" ? t("warnings.tight") : summary.state === "critical" ? t("profile.state.critical") : t("roadmap.ifToPlan")}
        </p>
        {summary.next ? (
          <AppLink
            href={`/roadmap?view=parallel&step=${summary.next.id}`}
            className="mt-1 inline-flex max-w-sm items-center gap-3 self-start rounded-[var(--radius)] bg-paper px-4 py-2.5 text-left text-sm leading-snug font-medium text-ink transition-colors hover:bg-white md:self-end"
          >
            {t("profile.next", { title: pick(summary.next.title, locale) })}
            <ArrowRight aria-hidden="true" className="size-4 shrink-0" />
          </AppLink>
        ) : (
          <p className="text-sm text-paper">{t("profile.allDone")}</p>
        )}
      </div>
    </section>
  );
}
