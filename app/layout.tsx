import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { SkipLink } from "@/components/SkipLink";
import { SiteHeader } from "@/components/SiteHeader";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Virasat — Discover India’s living heritage",
    template: "%s — Virasat",
  },
  description:
    "Virasat is an AI-powered guide to Indian cultural experiences — personalized heritage recommendations, hidden gems, festivals, and stories generated live by Google Gemini.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="flex min-h-screen flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          {children}
        </main>
        <footer className="border-t border-ink/10 bg-parchment">
          <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
            <p className="text-sm text-ink/70">
              Virasat generates all content live with Google Gemini. AI results can be imperfect —
              please verify key details such as dates, timings, and access before you travel.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
