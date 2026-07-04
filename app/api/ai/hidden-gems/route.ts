import { generateJson, AiError } from "@/lib/ai/client";
import { logAiInteraction } from "@/lib/ai/log";
import { buildHiddenGemsPrompt, CULTURAL_EXPERT_SYSTEM } from "@/lib/ai/prompts";
import {
  hiddenGemsGeminiSchema,
  hiddenGemsRequestSchema,
  hiddenGemsResultSchema,
} from "@/lib/ai/schemas";
import { HttpError, jsonError, parseBody } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import type { HiddenGemsResponse } from "@/lib/types";

export const maxDuration = 60;

export async function POST(req: Request): Promise<Response> {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const limit = rateLimit(`ai:hidden-gems:${user.id}`, { limit: 5, windowMs: 60000 });
    if (!limit.ok) {
      return jsonError(
        429,
        `Too many AI requests. Please try again in ${limit.retryAfterSeconds} seconds.`,
        "RATE_LIMITED",
      );
    }

    const body = await parseBody(req, hiddenGemsRequestSchema);

    const result = await generateJson<unknown>({
      system: CULTURAL_EXPERT_SYSTEM,
      prompt: buildHiddenGemsPrompt(body),
      schema: hiddenGemsGeminiSchema,
    });

    // Never patch or substitute model output — an off-shape response is an
    // honest 502, not fabricated content.
    const parsed = hiddenGemsResultSchema.safeParse(result.data);
    if (!parsed.success) {
      return jsonError(
        502,
        "The AI returned an unexpected response shape. Please try again.",
        "AI_INVALID_SHAPE",
      );
    }

    await logAiInteraction({
      userId: user.id,
      feature: "hidden-gems",
      model: result.model,
      latencyMs: result.latencyMs,
      request: body,
    });

    const response: HiddenGemsResponse = {
      gems: parsed.data.gems,
      meta: { model: result.model, latencyMs: result.latencyMs },
    };
    return Response.json(response);
  } catch (err) {
    if (err instanceof HttpError) return jsonError(err.status, err.message, err.code);
    if (err instanceof AiError) return jsonError(err.status, err.message, err.code);
    console.error("[/api/ai/hidden-gems]", err);
    return jsonError(500, "Something went wrong on our side. Please try again.", "INTERNAL");
  }
}
