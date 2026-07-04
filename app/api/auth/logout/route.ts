import { jsonError } from "@/lib/api/helpers";
import { clearSessionCookie } from "@/lib/auth/session";

export async function POST() {
  try {
    await clearSessionCookie();
    return Response.json({ ok: true });
  } catch (err) {
    logError("POST /api/auth/logout", "failed", err);
    return jsonError(500, "Something went wrong.", "INTERNAL");
  }
}
