import { eq } from "drizzle-orm";
import { clientKey, jsonError, parseBody, withErrorHandling } from "@/lib/api/helpers";
import { verifyPassword } from "@/lib/auth/passwords";
import { setSessionCookie } from "@/lib/auth/session";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { loginSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/rate-limit";

export function POST(req: Request): Promise<Response> {
  return withErrorHandling("POST /api/auth/login", async () => {
    const limited = rateLimit(`login:${clientKey(req)}`, { limit: 10, windowMs: 60_000 });
    if (!limited.ok) {
      return jsonError(
        429,
        `Too many login attempts. Try again in ${limited.retryAfterSeconds} seconds.`,
        "RATE_LIMITED",
      );
    }

    const { email, password } = await parseBody(req, loginSchema);
    const db = getDb();

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

    // Identical response for unknown email and wrong password so attackers
    // cannot probe which accounts exist.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return jsonError(401, "Invalid email or password.", "BAD_CREDENTIALS");
    }

    const sessionUser = { id: user.id, email: user.email, name: user.name };
    await setSessionCookie(sessionUser);
    return Response.json({ user: sessionUser });
  });
}
