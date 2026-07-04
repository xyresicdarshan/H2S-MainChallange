import { streamText } from "@/lib/ai/client";
import { logAiInteraction } from "@/lib/ai/log";
import { buildStoryPrompt, STORY_SYSTEM } from "@/lib/ai/prompts";
import { storyRequestSchema } from "@/lib/ai/schemas";
import { jsonError, parseBody, withErrorHandling } from "@/lib/api/helpers";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";

export const maxDuration = 60;

export function POST(req: Request): Promise<Response> {
  return withErrorHandling("/api/ai/story", async () => {
    const user = await getSessionUser();
    if (!user) return jsonError(401, "Authentication required.", "UNAUTHENTICATED");

    const limit = rateLimit(`ai:story:${user.id}`, { limit: 5, windowMs: 60000 });
    if (!limit.ok) {
      return jsonError(
        429,
        `Too many AI requests. Please try again in ${limit.retryAfterSeconds} seconds.`,
        "RATE_LIMITED",
      );
    }

    const body = await parseBody(req, storyRequestSchema);

    const started = Date.now();
    const { stream, model } = await streamText({
      system: STORY_SYSTEM,
      prompt: buildStoryPrompt(body),
      temperature: 0.9,
    });

    // latencyMs here is a time-to-first-byte proxy (stream creation): the
    // full generation duration is unknowable before piping to the client.
    // Best-effort audit log — fire-and-forget so it never delays the stream.
    void logAiInteraction({
      userId: user.id,
      feature: "story",
      model,
      latencyMs: Date.now() - started,
      request: body,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Ai-Model": model,
        "Cache-Control": "no-store",
      },
    });
  });
}
