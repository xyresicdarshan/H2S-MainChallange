import { z } from "zod";
import { AiError } from "@/lib/ai/client";
import { logError } from "@/lib/logger";

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
 * Runs a route handler under one shared error-mapping policy, so every route
 * maps HttpError/AiError to their carried status and everything else to an
 * honest, logged 500 — instead of repeating that catch block per file.
 */
export async function withErrorHandling(
  routeLabel: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
    if (err instanceof AiError) return jsonError(err.status, err.message, err.code);
    logError(routeLabel, "unhandled error", err);
    return jsonError(500, "Something went wrong. Please try again.", "INTERNAL");
  }
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
