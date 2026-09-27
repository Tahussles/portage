import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { LocaleSync } from "@/components/ui/LocaleSync";
import { Navbar } from "@/components/ui/Navbar";
import { LOCALE_BOOT_SCRIPT } from "@/lib/i18n/boot";
import en from "@/lib/i18n/en.json";
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

// Absolute base for Open Graph and other metadata URLs (the public production domain by default).
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://portage-navy.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  // The page title and description are rendered by LocaleSync, in the selected language.
  openGraph: {
    title: en["meta.title"],
    description: en["meta.description"],
    type: "website",
    locale: "en_CA",
    alternateLocale: ["fr_CA"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The boot script may set lang and data-locale-pending on <html> before hydration.
    <html lang="en-CA" className={`${inter.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LOCALE_BOOT_SCRIPT }} />
      </head>
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
