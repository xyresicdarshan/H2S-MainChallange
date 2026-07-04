import { z } from "zod";
import type { GeminiSchema } from "@/lib/ai/client";
import {
  INDIAN_REGIONS,
  INTEREST_OPTIONS,
  MONTHS,
  STORY_THEMES,
  TRAVEL_STYLES,
} from "@/lib/types";

/**
 * Two validation layers per structured AI feature:
 * 1. GeminiSchema — sent to the model as responseSchema so generation is
 *    constrained at the source.
 * 2. Zod validator — run on the parsed result, because responseSchema is a
 *    strong hint, not a guarantee; routes must never trust unvalidated model
 *    output. Plus zod schemas for the incoming request bodies.
 */

// ── Request schemas ──────────────────────────────────────────────────────────

export const recommendationsRequestSchema = z.object({
  interests: z
    .array(z.enum(INTEREST_OPTIONS))
    .min(1, "Pick at least one interest.")
    .max(5, "Pick at most five interests."),
  region: z.enum(INDIAN_REGIONS).optional(),
  travelStyle: z.enum(TRAVEL_STYLES).optional(),
});

export const hiddenGemsRequestSchema = z.object({
  state: z.enum(INDIAN_REGIONS),
  interests: z.array(z.enum(INTEREST_OPTIONS)).max(5, "Pick at most five interests.").optional(),
});

export const eventsRequestSchema = z.object({
  month: z.enum(MONTHS),
  region: z.enum(INDIAN_REGIONS).optional(),
});

export const storyRequestSchema = z.object({
  siteName: z
    .string()
    .trim()
    .min(2, "Site name must be at least 2 characters.")
    .max(120, "Site name must be at most 120 characters."),
  state: z.enum(INDIAN_REGIONS).optional(),
  theme: z.enum(STORY_THEMES).optional(),
});

// ── Gemini response schemas (uppercase types per lib/ai/client.ts) ──────────

export const recommendationsGeminiSchema: GeminiSchema = {
  type: "OBJECT",
  properties: {
    recommendations: {
      type: "ARRAY",
      description: "Exactly 6 diverse cultural recommendations.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          location: { type: "STRING", description: "City or district." },
          state: { type: "STRING" },
          category: { type: "STRING" },
          description: { type: "STRING" },
          whyRecommended: { type: "STRING" },
          bestTimeToVisit: { type: "STRING" },
          culturalSignificance: { type: "STRING" },
        },
        required: [
          "name",
          "location",
          "state",
          "category",
          "description",
          "whyRecommended",
          "bestTimeToVisit",
          "culturalSignificance",
        ],
      },
    },
  },
  required: ["recommendations"],
};

export const hiddenGemsGeminiSchema: GeminiSchema = {
  type: "OBJECT",
  properties: {
    gems: {
      type: "ARRAY",
      description: "Exactly 5 genuinely lesser-known cultural places.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          location: { type: "STRING" },
          state: { type: "STRING" },
          description: { type: "STRING" },
          culturalContext: { type: "STRING" },
          howToReach: { type: "STRING" },
          localTip: { type: "STRING" },
        },
        required: [
          "name",
          "location",
          "state",
          "description",
          "culturalContext",
          "howToReach",
          "localTip",
        ],
      },
    },
  },
  required: ["gems"],
};

export const eventsGeminiSchema: GeminiSchema = {
  type: "OBJECT",
  properties: {
    events: {
      type: "ARRAY",
      description: "Exactly 6 recurring festivals or cultural events.",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          location: { type: "STRING" },
          state: { type: "STRING" },
          timeframe: { type: "STRING", description: "Realistic recurring timeframe wording." },
          description: { type: "STRING" },
          culturalSignificance: { type: "STRING" },
          travelerTips: { type: "STRING" },
        },
        required: [
          "name",
          "location",
          "state",
          "timeframe",
          "description",
          "culturalSignificance",
          "travelerTips",
        ],
      },
    },
  },
  required: ["events"],
};

// ── Runtime validators for parsed model output ──────────────────────────────

const aiText = z.string().trim().min(1);

export const recommendationsResultSchema = z.object({
  recommendations: z
    .array(
      z.object({
        name: aiText,
        location: aiText,
        state: aiText,
        category: aiText,
        description: aiText,
        whyRecommended: aiText,
        bestTimeToVisit: aiText,
        culturalSignificance: aiText,
      }),
    )
    .min(1)
    .max(8),
});

export const hiddenGemsResultSchema = z.object({
  gems: z
    .array(
      z.object({
        name: aiText,
        location: aiText,
        state: aiText,
        description: aiText,
        culturalContext: aiText,
        howToReach: aiText,
        localTip: aiText,
      }),
    )
    .min(1)
    .max(8),
});

export const eventsResultSchema = z.object({
  events: z
    .array(
      z.object({
        name: aiText,
        location: aiText,
        state: aiText,
        timeframe: aiText,
        description: aiText,
        culturalSignificance: aiText,
        travelerTips: aiText,
      }),
    )
    .min(1)
    .max(8),
});
