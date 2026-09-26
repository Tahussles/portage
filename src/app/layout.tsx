import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { LocaleSync } from "@/components/ui/LocaleSync";
import { Navbar } from "@/components/ui/Navbar";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500"],
  display: "swap",
});

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Portage",
  description: "Carry your career across. Emportez votre carrière avec vous.",
  openGraph: {
    title: "Portage",
    description: "A personal, cited, deadline-aware licensing roadmap for internationally educated nurses in Ontario.",
    type: "website",
    locale: "en_CA",
    alternateLocale: ["fr_CA"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-CA" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-svh bg-ink font-sans text-paper antialiased">
        <noscript>
          <style>{"[data-rise]{opacity:1!important}"}</style>
        </noscript>
        <LocaleSync />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
