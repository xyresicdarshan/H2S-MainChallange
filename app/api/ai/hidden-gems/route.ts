import { createAiJsonRoute } from "@/lib/ai/json-route";
import { buildHiddenGemsPrompt, CULTURAL_EXPERT_SYSTEM } from "@/lib/ai/prompts";
import {
  hiddenGemsGeminiSchema,
  hiddenGemsRequestSchema,
  hiddenGemsResultSchema,
} from "@/lib/ai/schemas";
import type { HiddenGemsResponse } from "@/lib/types";

export const maxDuration = 60;

export const POST = createAiJsonRoute({
  feature: "hidden-gems",
  requestSchema: hiddenGemsRequestSchema,
  system: CULTURAL_EXPERT_SYSTEM,
  buildPrompt: buildHiddenGemsPrompt,
  geminiSchema: hiddenGemsGeminiSchema,
  resultSchema: hiddenGemsResultSchema,
  buildResponse: (data, meta): HiddenGemsResponse => ({
    gems: data.gems,
    meta,
  }),
});
