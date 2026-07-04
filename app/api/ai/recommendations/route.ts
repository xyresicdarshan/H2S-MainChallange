import { createAiJsonRoute } from "@/lib/ai/json-route";
import { buildRecommendationsPrompt, CULTURAL_EXPERT_SYSTEM } from "@/lib/ai/prompts";
import {
  recommendationsGeminiSchema,
  recommendationsRequestSchema,
  recommendationsResultSchema,
} from "@/lib/ai/schemas";
import type { RecommendationsResponse } from "@/lib/types";

export const maxDuration = 60;

export const POST = createAiJsonRoute({
  feature: "recommendations",
  requestSchema: recommendationsRequestSchema,
  system: CULTURAL_EXPERT_SYSTEM,
  buildPrompt: buildRecommendationsPrompt,
  geminiSchema: recommendationsGeminiSchema,
  resultSchema: recommendationsResultSchema,
  buildResponse: (data, meta): RecommendationsResponse => ({
    recommendations: data.recommendations,
    meta,
  }),
});
