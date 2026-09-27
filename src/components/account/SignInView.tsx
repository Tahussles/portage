"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight, Check } from "lucide-react";
import { useRef, useState, type RefObject } from "react";
import { AppLink } from "@/components/ui/AppLink";
import { useHref } from "@/components/ui/links";
import { MapleMark } from "@/components/ui/MapleMark";
import { useAccountStore } from "@/lib/account/store";
import { useWipeStore } from "@/lib/account/wipe";
import { useT } from "@/lib/i18n";
import { useAppStore } from "@/lib/store";

gsap.registerPlugin(useGSAP);

const RING_R = 11;
const RING_C = 2 * Math.PI * RING_R;

type Kind = "demo" | "email";

/** The button's label, plus the progress ring and check it turns into. */
function Morph({ label, primary }: { label: string; primary: boolean }) {
  return (
    <>
      <span data-label className="inline-flex items-center gap-2">
        {label}
        {primary && <ArrowRight aria-hidden="true" className="size-4" />}
      </span>
      <svg data-ring aria-hidden="true" viewBox="0 0 28 28" className="absolute top-1/2 left-1/2 size-7 -translate-x-1/2 -translate-y-1/2 -rotate-90 opacity-0">
        <circle cx="14" cy="14" r={RING_R} fill="none" stroke="currentColor" strokeOpacity={0.25} strokeWidth="2" />
        <circle data-ring-arc cx="14" cy="14" r={RING_R} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray={RING_C} strokeDashoffset={RING_C} />
      </svg>
      <Check data-check aria-hidden="true" className="absolute top-1/2 left-1/2 size-5 -translate-x-1/2 -translate-y-1/2 opacity-0" />
    </>
  );
}

/**
 * /signin: passwordless demo sign-in. "Continue as Priya (demo)" opens the seeded account; an email
 * creates a fresh one. Either way the account lives only in this browser. The button turns into a
 * progress ring, then a check, then the Portage line wipes the screen into /profile.
 */
export function SignInView() {
  const t = useT();
  const toHref = useHref();
  const locale = useAppStore((s) => s.locale);
  const continueAsDemo = useAccountStore((s) => s.continueAsDemo);
  const continueWithEmail = useAccountStore((s) => s.continueWithEmail);
  const startWipe = useWipeStore((s) => s.start);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState<Kind | null>(null);
  const scope = useRef<HTMLElement>(null);
  const demoButton = useRef<HTMLButtonElement>(null);
  const emailButton = useRef<HTMLButtonElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-rise]", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.1 });
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-rise]", { opacity: 1, y: 0 });
      });
    },
    { scope },
  );

  const submit = contextSafe((kind: Kind, button: RefObject<HTMLButtonElement | null>) => {
    if (busy || !button.current) return;
    setBusy(kind);
    const signIn = () => (kind === "demo" ? continueAsDemo(locale) : continueWithEmail(email, locale));
    const go = () => startWipe(toHref("/profile"), "forward");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      signIn();
      go();
      return;
    }
    const b = button.current;
    gsap
      .timeline({ onComplete: go })
      .to(b.querySelector("[data-label]"), { opacity: 0, duration: 0.15 })
      .to(b, { width: 44, height: 44, minHeight: 44, padding: 0, borderRadius: 999, duration: 0.25, ease: "power2.inOut" })
      .set(b.querySelector("[data-ring]"), { opacity: 1 })
      .to(b.querySelector("[data-ring-arc]"), { strokeDashoffset: 0, duration: 0.8, ease: "power1.inOut" })
      .to(b.querySelector("[data-ring]"), { opacity: 0, duration: 0.1 })
      .fromTo(b.querySelector("[data-check]"), { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.2, ease: "back.out(2)" })
      // Signed in: the avatar pops into the navbar while the check shows.
      .add(signIn)
      .to({}, { duration: 0.3 });
  });

  return (
    <main ref={scope} className="relative isolate flex min-h-svh items-center justify-center bg-ink px-5 pt-(--nav-h) pb-12">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[url(/topo-hero.svg)] bg-cover bg-center" />
      <section data-rise aria-labelledby="signin-title" className="w-full max-w-sm rounded-[var(--radius)] border border-slate-line bg-granite/85 p-7 shadow-2xl backdrop-blur md:p-8">
        <MapleMark className="size-7 text-accent" />
        <p className="micro-label mt-5 text-mist">{t("signin.label")}</p>
        <h1 id="signin-title" className="mt-2 font-display text-2xl leading-tight font-medium tracking-tight">
          {t("signin.title")}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-mist">{t("signin.body")}</p>

        <div className="mt-7 flex justify-center">
          <button
            ref={demoButton}
            type="button"
            disabled={busy !== null}
            onClick={() => submit("demo", demoButton)}
            className="relative inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-5 py-2.5 text-center text-sm leading-snug font-medium text-paper transition-colors hover:bg-accent-hover disabled:cursor-progress"
          >
            <Morph label={t("signin.demo")} primary />
          </button>
        </div>

        <div className="my-6 flex items-center gap-3 text-xs text-mist" aria-hidden="true">
          <span className="h-px flex-1 bg-slate-line" />
          {t("signin.or")}
          <span className="h-px flex-1 bg-slate-line" />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit("email", emailButton);
          }}
          className="flex flex-col gap-3"
        >
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-mist">{t("signin.email")}</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy !== null}
              className="h-11 rounded-[var(--radius)] border border-slate-line bg-ink px-3 text-paper placeholder:text-stone-600 focus:border-mist focus:outline-none"
            />
          </label>
          <div className="flex justify-center">
            <button
              ref={emailButton}
              type="submit"
              disabled={busy !== null}
              className="relative inline-flex min-h-11 w-full items-center justify-center rounded-full border border-slate-line px-5 py-2.5 text-center text-sm leading-snug font-medium text-paper transition-colors hover:border-mist disabled:cursor-progress"
            >
              <Morph label={t("signin.emailButton")} primary={false} />
            </button>
          </div>
        </form>

        <p aria-live="polite" className="sr-only">
          {busy ? t("signin.working") : ""}
        </p>
        <p className="mt-6 text-xs leading-relaxed text-mist">{t("signin.note")}</p>
        <AppLink href="/start" className="mt-4 inline-flex items-center gap-1.5 text-sm text-paper underline-offset-4 hover:underline">
          {t("signin.skip")}
          <ArrowRight aria-hidden="true" className="size-4" />
        </AppLink>
      </section>
    </main>
  );
}
