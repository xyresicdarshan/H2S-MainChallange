import { describe, expect, it } from "vitest";
import {
  CULTURAL_EXPERT_SYSTEM,
  STORY_SYSTEM,
  buildEventsPrompt,
  buildHiddenGemsPrompt,
  buildRecommendationsPrompt,
  buildStoryPrompt,
} from "@/lib/ai/prompts";

describe("system prompts", () => {
  it("cultural expert system pins the model to real, verifiable places", () => {
    expect(CULTURAL_EXPERT_SYSTEM).toContain("ONLY real, verifiable");
    expect(CULTURAL_EXPERT_SYSTEM).toContain("Never invent");
  });

  it("story system forbids invented details and demands documented grounding", () => {
    expect(STORY_SYSTEM).toContain("Never invent");
    expect(STORY_SYSTEM).toMatch(/documented/i);
  });
});

describe("buildRecommendationsPrompt", () => {
  it("embeds interests, region, and travel style", () => {
    const prompt = buildRecommendationsPrompt({
      interests: ["Food & Cuisine", "Textiles & Weaves"],
      region: "Rajasthan",
      travelStyle: "Offbeat explorer",
    });
    expect(prompt).toContain("Food & Cuisine, Textiles & Weaves");
    expect(prompt).toContain("within Rajasthan, India");
    expect(prompt).toContain('"Offbeat explorer"');
  });

  it("falls back to pan-India scope when no region is given", () => {
    const prompt = buildRecommendationsPrompt({ interests: ["Music & Dance"] });
    expect(prompt).toContain("from anywhere across India");
    expect(prompt).toContain("Music & Dance");
  });
});

describe("buildHiddenGemsPrompt", () => {
  it("embeds the state and interest focus", () => {
    const prompt = buildHiddenGemsPrompt({
      state: "Odisha",
      interests: ["Art & Handicrafts"],
    });
    expect(prompt).toContain("Odisha");
    expect(prompt).toContain("Art & Handicrafts");
  });

  it("still targets the state without interests", () => {
    const prompt = buildHiddenGemsPrompt({ state: "Meghalaya" });
    expect(prompt).toContain("Meghalaya");
  });
});

describe("buildEventsPrompt", () => {
  it("embeds the month and region", () => {
    const prompt = buildEventsPrompt({ month: "November", region: "Punjab" });
    expect(prompt).toContain("November");
    expect(prompt).toContain("in Punjab, India");
  });

  it("scopes to all of India without a region", () => {
    const prompt = buildEventsPrompt({ month: "April" });
    expect(prompt).toContain("April");
    expect(prompt).toContain("across India");
  });
});

describe("buildStoryPrompt", () => {
  it("embeds site name, state, and theme", () => {
    const prompt = buildStoryPrompt({
      siteName: "Konark Sun Temple",
      state: "Odisha",
      theme: "Legends & folklore",
    });
    expect(prompt).toContain('"Konark Sun Temple"');
    expect(prompt).toContain("in Odisha, India");
    expect(prompt).toContain('"Legends & folklore"');
  });

  it("defaults to an India-wide framing without a state", () => {
    const prompt = buildStoryPrompt({ siteName: "Living root bridges" });
    expect(prompt).toContain('"Living root bridges"');
    expect(prompt).toContain("in India");
  });
});
