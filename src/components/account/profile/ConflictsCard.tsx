"use client";

import { AlertTriangle } from "lucide-react";
import type { Account } from "@/lib/account/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { provenanceText } from "./provenance";

type ConflictsCardProps = {
  account: Account;
  labelFor: (path: string) => string;
  onResolve: (conflictId: string, option: number) => void;
};

/** When sources disagree (a document and the interview), both values and where each came from; one click settles it. */
export function ConflictsCard({ account, labelFor, onResolve }: ConflictsCardProps) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  if (account.conflicts.length === 0) return null;
  return (
    <section aria-labelledby="conflicts-title" className="rounded-[var(--radius)] border border-accent/60 bg-accent-soft p-6">
      <div className="flex items-start gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h2 id="conflicts-title" className="font-display text-xl font-medium tracking-tight">
            {t("profile.conflicts.title")}
          </h2>
          <p className="mt-1 text-sm text-mist">{t("profile.conflicts.body")}</p>
          {account.conflicts.map((c) => (
            <div key={c.id} className="mt-5">
              <p className="micro-label text-mist">{labelFor(c.path)}</p>
              <ul className="mt-2 grid gap-3 sm:grid-cols-2">
                {c.options.map((o, i) => (
                  <li key={`${String(o.value)}-${i}`} className="flex flex-col gap-3 rounded-[var(--radius)] border border-slate-line bg-ink/60 p-4">
                    <div>
                      <p className="font-display text-lg text-paper">{String(o.value)}</p>
                      <p className="mt-1 text-[11px] text-mist">{provenanceText(o, t, locale)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onResolve(c.id, i)}
                      className="self-start rounded-full border border-slate-line px-4 py-1.5 text-sm text-paper transition-colors hover:border-mist"
                    >
                      {t("profile.conflicts.use")}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
