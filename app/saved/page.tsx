import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/auth/session";
import { getDb, schema } from "@/lib/db";
import type { SavedItemRecord, SavedItemType } from "@/lib/types";
import { SavedList } from "@/components/saved/SavedList";

export const metadata: Metadata = { title: "Saved" };

export default async function SavedPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/saved");

  let items: SavedItemRecord[] | null = null;
  try {
    const db = getDb();
    const rows = await db
      .select()
      .from(schema.savedItems)
      .where(eq(schema.savedItems.userId, user.id))
      .orderBy(desc(schema.savedItems.createdAt));
    items = rows.map((row) => ({
      id: row.id,
      itemType: row.itemType as SavedItemType,
      title: row.title,
      region: row.region ?? undefined,
      summary: row.summary ?? undefined,
      payload: row.payload ?? undefined,
      createdAt: row.createdAt.toISOString(),
    }));
  } catch {
    items = null;
  }

  return (
    <div className="space-y-8">
      <div className="max-w-2xl">
        <h1 className="text-3xl text-maroon-deep sm:text-4xl">Saved</h1>
        <p className="mt-2 text-ink/70">
          Your personal collection of discoveries, gems, festivals, and stories.
        </p>
      </div>
      {items === null ? (
        <div role="alert" className="card border-maroon/30 text-sm text-ink/80">
          <p>
            We couldn&rsquo;t reach the database right now, so your saved items can&rsquo;t be
            shown. Please try again in a moment.
          </p>
        </div>
      ) : items.length === 0 ? (
        <div className="card text-sm text-ink/80">
          <p>
            Nothing saved yet. Head to{" "}
            <Link href="/discover" className="font-medium text-maroon underline underline-offset-2">
              Discover
            </Link>{" "}
            to generate recommendations and save the ones you love.
          </p>
        </div>
      ) : (
        <SavedList initialItems={items} />
      )}
    </div>
  );
}
