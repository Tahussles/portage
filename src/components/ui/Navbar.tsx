"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { useT } from "@/lib/i18n";
import { AppLink } from "./AppLink";
import { SCREENS, isCurrent } from "./links";
import { LocaleToggle } from "./LocaleToggle";
import { MapleMark } from "./MapleMark";

/** Shared top nav: the four screens with the current one marked; a second row on phones. */
export function Navbar() {
  const t = useT();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = (className: string) =>
    SCREENS.map((screen) => {
      const current = isCurrent(pathname, screen.href);
      return (
        <AppLink
          key={screen.id}
          href={screen.href}
          aria-current={current ? "page" : undefined}
          className={cn(
            className,
            "relative whitespace-nowrap transition-colors",
            current ? "text-paper after:absolute after:inset-x-0 after:-bottom-1.5 after:h-px after:bg-accent" : "text-mist hover:text-paper",
          )}
        >
          {t(screen.id === "start" ? "nav.start.label" : `nav.${screen.id}`)}
        </AppLink>
      );
    });

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b border-transparent transition-[background-color,border-color,backdrop-filter] duration-300",
        (scrolled || pathname !== "/") && "glass",
      )}
    >
      <nav aria-label={t("nav.primary")} className="mx-auto max-w-7xl px-4 sm:px-5 md:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          <AppLink href="/" aria-label={t("brand.home")} className="flex items-center gap-2 rounded-md">
            <MapleMark className="size-6 shrink-0 text-accent" />
            <span className="font-display text-lg font-medium tracking-tight">{t("brand.name")}</span>
          </AppLink>

          <div className="hidden items-center gap-7 text-sm md:flex">{links("py-1")}</div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LocaleToggle />
            <AppLink
              href="/start"
              className="rounded-full bg-accent px-3 py-2 text-xs font-medium whitespace-nowrap text-paper transition-colors hover:bg-accent-hover sm:px-4 sm:text-sm"
            >
              {t("nav.start")}
            </AppLink>
          </div>
        </div>
        <div className="-mt-1 flex h-10 items-center gap-6 overflow-x-auto text-sm md:hidden">{links("py-1")}</div>
      </nav>
    </header>
  );
}
