import { describe, expect, it } from "vitest";
import {
  eventsRequestSchema,
  hiddenGemsRequestSchema,
  recommendationsRequestSchema,
  storyRequestSchema,
} from "@/lib/ai/schemas";
import { loginSchema, registerSchema } from "@/lib/validation/auth";
import { preferencesSchema } from "@/lib/validation/preferences";
import { savedItemInputSchema } from "@/lib/validation/saved";

describe("registerSchema", () => {
  const valid = { name: "Asha Rao", email: "asha@example.com", password: "sunrise42" };

  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("lowercases and trims the email", () => {
    const result = registerSchema.parse({ ...valid, email: "  Asha@Example.COM " });
    expect(result.email).toBe("asha@example.com");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(registerSchema.safeParse({ ...valid, password: "abc1" }).success).toBe(false);
  });

  it("rejects a password without a digit", () => {
    expect(registerSchema.safeParse({ ...valid, password: "onlyletters" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(registerSchema.safeParse({ ...valid, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects a one-character name", () => {
    expect(registerSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts credentials and lowercases the email", () => {
    const result = loginSchema.parse({ email: "USER@Example.com", password: "whatever" });
    expect(result.email).toBe("user@example.com");
  });

  it("rejects an empty email", () => {
    expect(loginSchema.safeParse({ email: "", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("savedItemInputSchema", () => {
  it("accepts a minimal valid item", () => {
    const result = savedItemInputSchema.safeParse({ itemType: "hidden-gem", title: "Nirona village" });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown itemType", () => {
    expect(
      savedItemInputSchema.safeParse({ itemType: "bookmark", title: "Nirona village" }).success,
    ).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(savedItemInputSchema.safeParse({ itemType: "event", title: "" }).success).toBe(false);
    expect(savedItemInputSchema.safeParse({ itemType: "event", title: "   " }).success).toBe(false);
  });
});

describe("preferencesSchema", () => {
  it("accepts an empty interests array", () => {
    expect(preferencesSchema.safeParse({ interests: [] }).success).toBe(true);
  });

  it("accepts known interests with region and style", () => {
    const result = preferencesSchema.safeParse({
      interests: ["Food & Cuisine", "Textiles & Weaves"],
      homeRegion: "Gujarat",
      travelStyle: "Offbeat explorer",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown interest", () => {
    expect(preferencesSchema.safeParse({ interests: ["Skydiving"] }).success).toBe(false);
  });
});

describe("recommendationsRequestSchema", () => {
  it("rejects empty interests", () => {
    expect(recommendationsRequestSchema.safeParse({ interests: [] }).success).toBe(false);
  });

  it("rejects more than five interests", () => {
    const six = [
      "Heritage & Monuments",
      "Festivals & Fairs",
      "Food & Cuisine",
      "Art & Handicrafts",
      "Music & Dance",
      "Spirituality & Temples",
    ];
    expect(recommendationsRequestSchema.safeParse({ interests: six }).success).toBe(false);
  });

  it("accepts a valid request with optional region and style", () => {
    const result = recommendationsRequestSchema.safeParse({
      interests: ["Heritage & Monuments"],
      region: "Rajasthan",
      travelStyle: "Immersive slow travel",
    });
    expect(result.success).toBe(true);
  });
});

describe("hiddenGemsRequestSchema", () => {
  it("rejects an unknown state", () => {
    expect(hiddenGemsRequestSchema.safeParse({ state: "Atlantis" }).success).toBe(false);
  });

  it("accepts a known state with optional interests", () => {
    expect(
      hiddenGemsRequestSchema.safeParse({ state: "Odisha", interests: ["Art & Handicrafts"] })
        .success,
    ).toBe(true);
  });
});

describe("eventsRequestSchema", () => {
  it("rejects an unknown month", () => {
    expect(eventsRequestSchema.safeParse({ month: "Smarch" }).success).toBe(false);
  });

  it("accepts a known month with optional region", () => {
    expect(eventsRequestSchema.safeParse({ month: "November", region: "Punjab" }).success).toBe(
      true,
    );
  });
});

describe("storyRequestSchema", () => {
  it("rejects a one-character site name", () => {
    expect(storyRequestSchema.safeParse({ siteName: "A" }).success).toBe(false);
  });

  it("accepts a real-looking site name with optional state and theme", () => {
    const result = storyRequestSchema.safeParse({
      siteName: "Konark Sun Temple",
      state: "Odisha",
      theme: "Legends & folklore",
    });
    expect(result.success).toBe(true);
  });
});
