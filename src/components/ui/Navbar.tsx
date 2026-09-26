"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { LocaleToggle } from "./LocaleToggle";
import { MapleMark } from "./MapleMark";

export function Navbar() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled && "glass",
      )}
    >
      <nav
        aria-label={t("nav.primary")}
        className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-5 md:px-8"
      >
        <Link href="/" aria-label={t("brand.home")} className="flex items-center gap-2 rounded-md">
          <MapleMark className="size-6 shrink-0 text-accent" />
          <span className="font-display text-lg font-medium tracking-tight">{t("brand.name")}</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm text-mist lg:flex">
          <Link href="/#how" className="transition-colors hover:text-paper">
            {t("nav.howItWorks")}
          </Link>
          <Link href="/insights" className="transition-colors hover:text-paper">
            {t("nav.forGovernment")}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleToggle />
          <Link
            href="/start"
            className="rounded-full bg-accent px-3 py-2 text-xs font-medium whitespace-nowrap sm:px-4 sm:text-sm text-paper transition-colors hover:bg-accent-hover"
          >
            {t("nav.start")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
