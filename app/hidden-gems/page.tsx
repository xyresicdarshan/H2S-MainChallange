import type { Metadata } from "next";
import { GemsClient } from "@/components/gems/GemsClient";

export const metadata: Metadata = { title: "Hidden gems" };

export default function HiddenGemsPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-maroon-deep sm:text-4xl">Hidden gems</h1>
        <p className="mt-2 text-ink/70">
          Pick a state and Gemini will surface lesser-known cultural places — each with context,
          directions, and a practical local tip.
        </p>
      </div>
      <GemsClient />
    </div>
  );
}
