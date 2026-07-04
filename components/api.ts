import type { ApiErrorBody } from "@/lib/types";

/**
 * Extract the honest error message from a failed API response. Never
 * substitutes fabricated content — falls back to a plain HTTP status line.
 */
export async function readApiError(res: Response, fallback?: string): Promise<string> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (body && typeof body.error === "string" && body.error.length > 0) {
      return body.error;
    }
  } catch {
    /* non-JSON error body */
  }
  return fallback ?? `Request failed (HTTP ${res.status}).`;
}
