import type { Metadata } from "next";
import { EventsClient } from "@/components/events/EventsClient";

export const metadata: Metadata = { title: "Festivals & events" };

export default function EventsPage() {
  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-maroon-deep sm:text-4xl">Festivals &amp; events</h1>
        <p className="mt-2 text-ink/70">
          Choose a month — and a region if you like — and Gemini will list the festivals and
          cultural events worth planning around.
        </p>
      </div>
      <EventsClient />
    </div>
  );
}
