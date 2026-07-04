import { eq } from "drizzle-orm";
import { clientKey, HttpError, jsonError, parseBody, withErrorHandling } from "@/lib/api/helpers";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword } from "@/lib/auth/passwords";
import { setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { registerSchema } from "@/lib/validation/auth";

function isUniqueViolation(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: unknown }).code === "23505"
  );
}

export function POST(req: Request): Promise<Response> {
  return withErrorHandling("POST /api/auth/register", async () => {
    // Rate-limited: each attempt costs a bcrypt hash (~250ms CPU) and creates
    // rows — throttle mass signups and CPU-burn attacks.
    const limited = rateLimit(`register:${clientKey(req)}`, { limit: 5, windowMs: 60_000 });
    if (!limited.ok) {
      return jsonError(
        429,
        `Too many registration attempts. Try again in ${limited.retryAfterSeconds} seconds.`,
        "RATE_LIMITED",
      );
    }

    const { name, email, password } = await parseBody(req, registerSchema);
    const db = getDb();

    try {
      const existing = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      if (existing.length > 0) {
        throw new HttpError(409, "An account with this email already exists.", "EMAIL_TAKEN");
      }

      const passwordHash = await hashPassword(password);
      const [user] = await db
        .insert(users)
        .values({ name, email, passwordHash })
        .returning({ id: users.id, email: users.email, name: users.name });

      await setSessionCookie(user);
      return Response.json({ user });
    } catch (err) {
      // Unique-constraint race: a concurrent registration won between our check and insert.
      if (isUniqueViolation(err)) {
        return jsonError(409, "An account with this email already exists.", "EMAIL_TAKEN");
      }
      throw err;
    }
  });
}
