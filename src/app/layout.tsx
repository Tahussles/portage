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

export const metadata: Metadata = {
  title: "Portage",
  description: "Carry your career across. Emportez votre carrière avec vous.",
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
