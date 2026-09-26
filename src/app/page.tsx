import { Chapters } from "@/components/landing/Chapters";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { Ticker } from "@/components/landing/Ticker";
import { WhyItMatters } from "@/components/landing/WhyItMatters";

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Ticker />
        <Chapters />
        <WhyItMatters />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}
