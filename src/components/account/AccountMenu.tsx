"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { useHref } from "@/components/ui/links";
import { DEMO_ACCOUNT_ID, initials } from "@/lib/account/seed";
import { useAccountStore, useCurrentAccount } from "@/lib/account/store";
import { useWipeStore } from "@/lib/account/wipe";
import { useT } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

const ITEM = "block w-full px-4 py-2 text-left text-sm text-paper transition-colors hover:bg-slate-line focus-visible:bg-slate-line focus-visible:outline-none";

/** Navbar: "Sign in" when signed out; an avatar with initials (popping in) and its menu when signed in. */
export function AccountMenu() {
  const t = useT();
  const toHref = useHref();
  const hydrated = useAccountStore((s) => s.hydrated);
  const account = useCurrentAccount();
  const signOut = useAccountStore((s) => s.signOut);
  const resetDemo = useAccountStore((s) => s.resetDemo);
  const startWipe = useWipeStore((s) => s.start);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useGSAP(
    () => {
      if (!account) return;
      gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-avatar]", { scale: 0.6, opacity: 0, duration: 0.35, ease: "back.out(2.2)" });
      });
    },
    { scope: root, dependencies: [account?.id] },
  );

  // Close on Escape or a click outside; focus the first item when the menu opens.
  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // Same width as the avatar until the stored account has been read, so nothing jumps.
  if (!hydrated) return <span aria-hidden="true" className="inline-block size-8" />;

  if (!account) {
    return (
      <AppLink href="/signin" className="inline-flex items-center gap-1.5 text-sm text-mist transition-colors hover:text-paper">
        <UserRound aria-hidden="true" className="size-4 sm:hidden" />
        <span className="sr-only sm:not-sr-only">{t("account.signIn")}</span>
      </AppLink>
    );
  }

  return (
    <div ref={root} className="relative">
      <button
        ref={button}
        type="button"
        data-avatar
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account.menu", { name: account.displayName })}
        onClick={() => setOpen((o) => !o)}
        className="grid size-8 place-items-center rounded-full bg-granite text-xs font-medium text-paper ring-1 ring-slate-line transition-colors hover:ring-mist"
      >
        {initials(account.displayName)}
      </button>
      {open && (
        <div role="menu" aria-label={t("account.menu", { name: account.displayName })} className="absolute right-0 top-11 z-10 w-56 overflow-hidden rounded-[var(--radius)] border border-slate-line bg-granite py-1 shadow-xl">
          <p className="border-b border-slate-line px-4 pt-2 pb-2.5 text-xs text-mist">{t("account.signedInAs", { name: account.displayName })}</p>
          {(["profile", "roadmap", "documents"] as const).map((id) => (
            <AppLink key={id} role="menuitem" href={`/${id}`} onClick={() => setOpen(false)} className={ITEM}>
              {t(id === "profile" ? "account.profile" : `nav.${id}`)}
            </AppLink>
          ))}
          <div className="my-1 border-t border-slate-line" />
          {account.id === DEMO_ACCOUNT_ID && (
            <button
              type="button"
              role="menuitem"
              className={ITEM}
              onClick={() => {
                resetDemo();
                setOpen(false);
              }}
            >
              {t("account.resetDemo")}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            className={ITEM}
            onClick={() => {
              setOpen(false);
              startWipe(toHref("/"), "back", signOut);
            }}
          >
            {t("account.signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
