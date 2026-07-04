import type { z } from "zod";
import { generateJson, type GeminiSchema } from "@/lib/ai/client";
import { logAiInteraction } from "@/lib/ai/log";
import { withErrorHandling, jsonError, parseBody } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import type { AiMeta } from "@/lib/types";

/**
 * Every schema-constrained Gemini feature (recommendations, hidden gems,
 * events, ...) is the same shape: auth -> rate limit -> validate request ->
 * generate JSON -> validate model output -> audit log -> respond. This
 * factory captures that shape once so each route only supplies what differs.
 */
export interface AiJsonRouteConfig<
  TBody extends Record<string, unknown>,
  TResult,
  TResponse,
> {
  /** Used in the rate-limit key, the ai_interactions row, and error logs. */
  feature: string;
  requestSchema: z.ZodType<TBody>;
  system: string;
  buildPrompt: (body: TBody) => string;
  geminiSchema: GeminiSchema;
  /** Validates the parsed model output — never trust responseSchema alone. */
  resultSchema: z.ZodType<TResult>;
  buildResponse: (data: TResult, meta: AiMeta) => TResponse;
}

export function createAiJsonRoute<
  TBody extends Record<string, unknown>,
  TResult,
  TResponse,
>(config: AiJsonRouteConfig<TBody, TResult, TResponse>) {
  const routeLabel = `/api/ai/${config.feature}`;

  return function POST(req: Request): Promise<Response> {
    return withErrorHandling(routeLabel, async () => {
      const user = await getSessionUser();
      if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

      const limit = rateLimit(`ai:${config.feature}:${user.id}`, {
        limit: 5,
        windowMs: 60_000,
      });
      if (!limit.ok) {
        return jsonError(
          429,
          `Too many AI requests. Please try again in ${limit.retryAfterSeconds} seconds.`,
          "RATE_LIMITED",
        );
      }

      const body = await parseBody(req, config.requestSchema);

      const result = await generateJson<unknown>({
        system: config.system,
        prompt: config.buildPrompt(body),
        schema: config.geminiSchema,
      });

      // Never patch or substitute model output — an off-shape response is an
      // honest 502, not fabricated content.
      const parsed = config.resultSchema.safeParse(result.data);
      if (!parsed.success) {
        return jsonError(
          502,
          "The AI returned an unexpected response shape. Please try again.",
          "AI_INVALID_SHAPE",
        );
      }

      const meta: AiMeta = { model: result.model, latencyMs: result.latencyMs };

      // Best-effort audit log (already swallows its own errors) — fire it
      // without awaiting so a slow insert never adds latency to a response
      // the user is already waiting on.
      void logAiInteraction({
        userId: user.id,
        feature: config.feature,
        model: result.model,
        latencyMs: result.latencyMs,
        request: body,
      });

      return Response.json(config.buildResponse(parsed.data, meta));
    });
  };
}
