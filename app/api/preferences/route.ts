import { eq } from "drizzle-orm";
import { jsonError, parseBody, withErrorHandling } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { preferences } from "@/lib/db/schema";
import type { PreferencesPayload } from "@/lib/types";
import { preferencesSchema } from "@/lib/validation/preferences";

export function GET(): Promise<Response> {
  return withErrorHandling("GET /api/preferences", async () => {
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
  });
}

export function PUT(req: Request): Promise<Response> {
  return withErrorHandling("PUT /api/preferences", async () => {
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
  });
}
