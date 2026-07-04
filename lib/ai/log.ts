import { getDb } from "@/lib/db";
import { aiInteractions } from "@/lib/db/schema";
import { logError } from "@/lib/logger";

/**
 * Records one real Gemini call in the ai_interactions audit table.
 *
 * Best-effort by design: the user already has (or is receiving) their AI
 * result, so an audit-log failure must never fail the request — we log the
 * error server-side and move on.
 */
export async function logAiInteraction(entry: {
  userId: string;
  feature: string;
  model: string;
  latencyMs: number;
  request: Record<string, unknown>;
}): Promise<void> {
  try {
    await getDb().insert(aiInteractions).values(entry);
  } catch (err) {
    logError("ai-interaction", "failed to record interaction", err);
  }
}
