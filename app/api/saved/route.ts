import { desc, eq } from "drizzle-orm";
import { jsonError, parseBody, withErrorHandling } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";
import type { SavedItemRecord, SavedItemType } from "@/lib/types";
import { savedItemInputSchema } from "@/lib/validation/saved";

function toRecord(row: typeof savedItems.$inferSelect): SavedItemRecord {
  return {
    id: row.id,
    itemType: row.itemType as SavedItemType,
    title: row.title,
    region: row.region ?? undefined,
    summary: row.summary ?? undefined,
    payload: row.payload ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export function GET(): Promise<Response> {
  return withErrorHandling("GET /api/saved", async () => {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const db = getDb();
    const rows = await db
      .select()
      .from(savedItems)
      .where(eq(savedItems.userId, user.id))
      .orderBy(desc(savedItems.createdAt));

    return Response.json({ items: rows.map(toRecord) });
  });
}

export function POST(req: Request): Promise<Response> {
  return withErrorHandling("POST /api/saved", async () => {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const input = await parseBody(req, savedItemInputSchema);
    const db = getDb();

    const [row] = await db
      .insert(savedItems)
      .values({ userId: user.id, ...input })
      .returning();

    return Response.json({ item: toRecord(row) }, { status: 201 });
  });
}
