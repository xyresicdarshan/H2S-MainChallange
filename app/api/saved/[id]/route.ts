import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { HttpError, jsonError } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { savedItems } from "@/lib/db/schema";

const idSchema = z.string().uuid();

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);
    if (!parsed.success) return jsonError(400, "Invalid saved item id.", "BAD_REQUEST");

    const db = getDb();
    // userId in the WHERE clause enforces ownership; a foreign item 404s
    // identically to a missing one, so ids cannot be probed across users.
    const deleted = await db
      .delete(savedItems)
      .where(and(eq(savedItems.id, parsed.data), eq(savedItems.userId, user.id)))
      .returning({ id: savedItems.id });

    if (deleted.length === 0) return jsonError(404, "Saved item not found.", "NOT_FOUND");
    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
    console.error("DELETE /api/saved/[id] failed:", err);
    return jsonError(500, "Something went wrong.", "INTERNAL");
  }
}
