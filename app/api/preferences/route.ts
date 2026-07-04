import { eq } from "drizzle-orm";
import { HttpError, jsonError, parseBody } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { preferences } from "@/lib/db/schema";
import type { PreferencesPayload } from "@/lib/types";
import { preferencesSchema } from "@/lib/validation/preferences";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const db = getDb();
    const [row] = await db
      .select()
      .from(preferences)
      .where(eq(preferences.userId, user.id))
      .limit(1);

    const payload: PreferencesPayload | null = row
      ? { interests: row.interests, homeRegion: row.homeRegion, travelStyle: row.travelStyle }
      : null;

    return Response.json({ preferences: payload });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
    console.error("GET /api/preferences failed:", err);
    return jsonError(500, "Something went wrong.", "INTERNAL");
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const input = await parseBody(req, preferencesSchema);
    const db = getDb();

    const values = {
      interests: input.interests as string[],
      homeRegion: input.homeRegion ?? null,
      travelStyle: input.travelStyle ?? null,
      updatedAt: new Date(),
    };

    const [row] = await db
      .insert(preferences)
      .values({ userId: user.id, ...values })
      .onConflictDoUpdate({ target: preferences.userId, set: values })
      .returning();

    const payload: PreferencesPayload = {
      interests: row.interests,
      homeRegion: row.homeRegion,
      travelStyle: row.travelStyle,
    };
    return Response.json({ preferences: payload });
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
    console.error("PUT /api/preferences failed:", err);
    return jsonError(500, "Something went wrong.", "INTERNAL");
  }
}
