"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";

gsap.registerPlugin(useGSAP);

const POSTER = "/video/hero-poster.jpg";

export function Hero() {
  const t = useT();
  const scope = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoFailed, setVideoFailed] = useState(false);

  // The error event can fire before hydration attaches onError, so check once on mount too.
  // React does not write `muted` into server HTML, so browsers block autoplay: mute and play here.
  // Under reduced motion the video stays on its poster frame.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.error || v.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
      setVideoFailed(true);
      return;
    }
    v.muted = true;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) v.pause();
    else void v.play().catch(() => {});
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          "[data-rise='headline']",
          { opacity: 0, y: 60 },
          { opacity: 1, y: 0, duration: 1.4, ease: "power3.out", delay: 0.3, stagger: 0.12 },
        );
        gsap.fromTo(
          "[data-rise='cta']",
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 1.0 },
        );
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-rise]", { opacity: 1, y: 0 });
      });
    },
    { scope },
  );

  return (
    <section ref={scope} className="relative isolate h-svh min-h-[640px] overflow-hidden bg-ink">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-cover bg-center opacity-40 grayscale"
        style={{ backgroundImage: `url(${POSTER})` }}
      />
      {!videoFailed && (
        <video
          ref={videoRef}
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 -z-10 size-full object-cover opacity-40 grayscale"
          src="/video/hero.mp4"
          poster={POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={() => setVideoFailed(true)}
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-linear-to-b from-ink/40 via-ink/30 to-ink"
      />

      <div className="mx-auto flex h-full max-w-7xl flex-col justify-end px-5 pb-20 md:px-8 md:pb-28">
        <p data-rise="headline" className="micro-label mb-6 max-w-xl text-mist">
          {t("hero.label")}
        </p>
        <h1 className="font-display text-[clamp(2.5rem,8vw,6.5rem)] leading-[1.05] font-medium tracking-tight">
          <span data-rise="headline" className="block text-paper">
            {t("hero.line1")}
          </span>
          <span data-rise="headline" className="block text-stone-500">
            {t("hero.line2")}
          </span>
        </h1>
        <div data-rise="cta" className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <Link
            href="/start"
            className="group inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 text-sm font-medium text-ink transition-colors hover:bg-white"
          >
            {t("hero.cta")}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/roadmap?demo=1"
            className="text-sm text-mist underline-offset-4 transition-colors hover:text-paper hover:underline"
          >
            {t("hero.sample")}
          </Link>
        </div>
      </div>
    </section>
  );
}
