"use client";

import { Download, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { useHref } from "@/components/ui/links";
import { useAccountStore } from "@/lib/account/store";
import type { Account } from "@/lib/account/types";
import { useWipeStore } from "@/lib/account/wipe";
import { useT } from "@/lib/i18n";

/** Where the account lives, a JSON download, and a delete that plays the sign-out wipe. */
export function PrivacyCard({ account }: { account: Account }) {
  const t = useT();
  const toHref = useHref();
  const deleteCurrent = useAccountStore((s) => s.deleteCurrent);
  const startWipe = useWipeStore((s) => s.start);
  const [confirming, setConfirming] = useState(false);

  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(account, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "portage-account.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section aria-labelledby="privacy-title" className="rounded-[var(--radius)] border border-slate-line bg-granite/60 p-6">
      <h2 id="privacy-title" className="micro-label text-mist">
        {t("profile.section.privacy")}
      </h2>
      <p className="mt-3 flex items-center gap-2 font-display text-lg text-paper">
        <ShieldCheck aria-hidden="true" className="size-5 text-mist" />
        {t("profile.privacy.stored")}
      </p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist">{t("profile.privacy.body")}</p>
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" onClick={download} className="inline-flex items-center gap-2 rounded-full border border-slate-line px-4 py-2 text-sm text-paper transition-colors hover:border-mist">
          <Download aria-hidden="true" className="size-4" />
          {t("profile.privacy.download")}
        </button>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-mist transition-colors hover:text-paper">
            <Trash2 aria-hidden="true" className="size-4" />
            {t("profile.privacy.delete")}
          </button>
        ) : (
          <span role="alertdialog" aria-label={t("profile.privacy.confirm")} className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-paper">{t("profile.privacy.confirm")}</span>
            <button type="button" onClick={() => startWipe(toHref("/"), "back", deleteCurrent)} className="rounded-full bg-accent px-4 py-2 font-medium text-paper hover:bg-accent-hover">
              {t("profile.privacy.confirmYes")}
            </button>
            <button type="button" onClick={() => setConfirming(false)} className="rounded-full px-3 py-2 text-mist hover:text-paper">
              {t("profile.privacy.cancel")}
            </button>
          </span>
        )}
      </div>
    </section>
  );
}
