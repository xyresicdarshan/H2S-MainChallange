import { createAiJsonRoute } from "@/lib/ai/json-route";
import { buildEventsPrompt, CULTURAL_EXPERT_SYSTEM } from "@/lib/ai/prompts";
import { eventsGeminiSchema, eventsRequestSchema, eventsResultSchema } from "@/lib/ai/schemas";
import type { EventsResponse } from "@/lib/types";

export const maxDuration = 60;

export const POST = createAiJsonRoute({
  feature: "events",
  requestSchema: eventsRequestSchema,
  system: CULTURAL_EXPERT_SYSTEM,
  buildPrompt: buildEventsPrompt,
  geminiSchema: eventsGeminiSchema,
  resultSchema: eventsResultSchema,
  buildResponse: (data, meta): EventsResponse => ({
    events: data.events,
    meta,
  }),
});
