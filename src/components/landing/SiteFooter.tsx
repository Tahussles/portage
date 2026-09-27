"use client";

import { useT } from "@/lib/i18n";
import { MapleMark } from "@/components/ui/MapleMark";

/** The planning-tool disclaimer (DESIGN 6.1 item 7), in the selected language. */
export function SiteFooter() {
  const t = useT();
  return (
    <footer className="border-t border-slate-line bg-ink">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 text-sm text-mist md:flex-row md:justify-between md:px-8">
        <div className="flex max-w-2xl flex-col gap-3">
          <p>{t("footer.disclaimer")}</p>
          <p className="text-xs">{t("footer.credits")}</p>
        </div>
        <div className="flex items-center gap-2 self-start text-paper">
          <MapleMark className="size-5 text-accent" />
          <span className="font-display font-medium">{t("brand.name")}</span>
        </div>
      </div>
    </footer>
  );
}
