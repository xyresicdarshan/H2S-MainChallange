import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import type { PreferencesPayload } from "@/lib/types";
import { DiscoverClient } from "@/components/discover/DiscoverClient";

export const metadata: Metadata = { title: "Discover" };

export default async function DiscoverPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/discover");

  let initialPreferences: PreferencesPayload | null = null;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.preferences)
      .where(eq(schema.preferences.userId, user.id))
      .limit(1);
    const row = rows[0];
    if (row) {
      initialPreferences = {
        interests: row.interests,
        homeRegion: row.homeRegion,
        travelStyle: row.travelStyle,
      };
    }
  } catch {
    // DB unreachable — render the form with defaults; generation still works.
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-maroon-deep sm:text-4xl">Discover</h1>
        <p className="mt-2 text-ink/70">
          Choose what draws you to India and Gemini will curate cultural experiences that fit —
          generated live for this exact request.
        </p>
      </div>
      <DiscoverClient initialPreferences={initialPreferences} />
    </div>
  );
}
