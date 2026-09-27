"use client";

import { ArrowRight, Mic } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { initials } from "@/lib/account/seed";
import { useAccountStore, useCurrentAccount } from "@/lib/account/store";
import { htmlLang, useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

/** /profile: one place for everything Portage knows about the signed-in person. */
export function ProfileView() {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  const hydrated = useAccountStore((s) => s.hydrated);
  const account = useCurrentAccount();

  if (!hydrated) return <main className="min-h-svh bg-ink pt-(--nav-h)" />;

  if (!account) {
    return (
      <main className="min-h-svh bg-ink pt-(--nav-h)">
        <section className="mx-auto flex max-w-xl flex-col items-start px-5 py-20 md:px-8">
          <p className="micro-label text-mist">{t("profile.label")}</p>
          <h1 className="mt-3 font-display text-3xl leading-tight font-medium tracking-tight md:text-5xl">{t("profile.signedOut.title")}</h1>
          <p className="mt-4 text-sm leading-relaxed text-mist md:text-base">{t("profile.signedOut.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <AppLink href="/signin" className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-paper hover:bg-accent-hover">
              {t("profile.signedOut.signIn")}
              <ArrowRight aria-hidden="true" className="size-4" />
            </AppLink>
            <AppLink href="/start" className="inline-flex items-center gap-2 rounded-full border border-slate-line px-5 py-2.5 text-sm text-paper hover:border-mist">
              <Mic aria-hidden="true" className="size-4" />
              {t("profile.signedOut.start")}
            </AppLink>
          </div>
        </section>
      </main>
    );
  }

  const since = new Intl.DateTimeFormat(htmlLang[locale], { dateStyle: "long" }).format(new Date(account.createdAt));
  return (
    <main className="min-h-svh bg-ink pt-(--nav-h)">
      <section className="mx-auto max-w-5xl px-5 py-10 md:px-8">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-full bg-granite font-display text-xl text-paper ring-1 ring-slate-line">
            {initials(account.displayName)}
          </span>
          <div>
            <h1 className="font-display text-3xl font-medium tracking-tight">{account.displayName}</h1>
            <p className="text-sm text-mist">{t("profile.memberSince", { date: since })}</p>
          </div>
        </div>
      </section>
    </main>
  );
}
