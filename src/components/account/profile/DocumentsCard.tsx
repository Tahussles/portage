"use client";

import { ArrowRight } from "lucide-react";
import { AppLink } from "@/components/ui/AppLink";
import { countIssues } from "@/components/documents/doc-check";
import { FindingsList } from "@/components/documents/FindingsList";
import type { Account } from "@/lib/account/types";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";
import { docLabel, shortDate } from "./provenance";

/** Checked documents with their issue count; each opens to its findings. Only findings are kept, never files. */
export function DocumentsCard({ account }: { account: Account }) {
  const t = useT();
  const locale = useAppStore((s) => s.locale);
  return (
    <section aria-labelledby="docs-title" className="rounded-[var(--radius)] bg-paper p-6 text-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="docs-title" className="micro-label text-quiet">
          {t("profile.section.documents")}
        </h2>
        <AppLink href="/documents" className="inline-flex items-center gap-1.5 text-sm font-medium underline-offset-4 hover:underline">
          {t("docs.another")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </AppLink>
      </div>
      {account.documents.length === 0 ? (
        <p className="mt-3 text-sm text-quiet">{t("profile.docs.none")}</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y divide-rule">
          {account.documents.map((d) => {
            const issues = countIssues(d.findings);
            return (
              <li key={d.id}>
                <details className="group py-3">
                  <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{docLabel(d.docType, t)}</span>
                    <span className="flex items-center gap-3 text-xs text-quiet">
                      {t("profile.docs.checked", { date: shortDate(d.checkedAt, locale) })}
                      <span className={issues ? "rounded-full bg-accent px-2.5 py-0.5 font-medium text-paper" : "rounded-full border border-rule px-2.5 py-0.5"}>
                        {issues === 0 ? t("docs.summary.none") : issues === 1 ? t("docs.summary.one") : t("docs.summary.many", { n: issues })}
                      </span>
                    </span>
                  </summary>
                  <div className="mt-3">
                    <FindingsList findings={d.findings} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
