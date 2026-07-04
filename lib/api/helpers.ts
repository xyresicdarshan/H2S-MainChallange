import { z } from "zod";

/** Error carrying an HTTP status + machine-readable code; route handlers map it to jsonError. */
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** Standard JSON error envelope: { error, code? } with an accurate status. */
export function jsonError(status: number, error: string, code?: string): Response {
  return Response.json({ error, ...(code !== undefined ? { code } : {}) }, { status });
}

/**
 * Parse and validate a JSON request body. Throws HttpError(400) with the first
 * zod issue message so clients get one actionable problem at a time.
 */
export async function parseBody<T>(req: Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new HttpError(400, "Request body must be valid JSON.", "BAD_REQUEST");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new HttpError(
      400,
      result.error.issues[0]?.message ?? "Invalid request body.",
      "BAD_REQUEST",
    );
  }
  return result.data;
}

/**
 * Best-effort client identifier for rate limiting.
 * Uses the LAST hop of x-forwarded-for: earlier hops are attacker-supplied,
 * while the last is appended by the trusted proxy in front of the app
 * (Vercel overwrites the header entirely). Assumes deployment behind such a
 * proxy; direct `next start` exposure would let clients spoof this header.
 */
export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const hops = forwarded?.split(",").map((h) => h.trim()).filter(Boolean);
  return hops?.[hops.length - 1] || "anonymous";
}
