import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST as eventsPost } from "@/app/api/ai/events/route";
import { POST as hiddenGemsPost } from "@/app/api/ai/hidden-gems/route";
import { POST as recommendationsPost } from "@/app/api/ai/recommendations/route";
import { AiError, generateJson } from "@/lib/ai/client";
import { logAiInteraction } from "@/lib/ai/log";
import { getSessionUser } from "@/lib/auth/session";

vi.mock("@/lib/auth/session", () => ({
  getSessionUser: vi.fn(),
}));

// Keep the real AiError class so the routes' instanceof checks stay meaningful.
vi.mock("@/lib/ai/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/client")>();
  return { ...actual, generateJson: vi.fn() };
});

vi.mock("@/lib/ai/log", () => ({
  logAiInteraction: vi.fn(async () => undefined),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(() => ({ ok: true, retryAfterSeconds: 0 })),
}));

const testUser = {
  id: "11111111-2222-3333-4444-555555555555",
  email: "asha@example.com",
  name: "Asha Rao",
};

const recommendationItem = {
  name: "Raghurajpur",
  location: "Puri district",
  state: "Odisha",
  category: "Heritage crafts village",
  description: "d",
  whyRecommended: "w",
  bestTimeToVisit: "b",
  culturalSignificance: "c",
};

const gemItem = {
  name: "Nirona",
  location: "Kutch",
  state: "Gujarat",
  description: "d",
  culturalContext: "c",
  howToReach: "h",
  localTip: "t",
};

const eventItem = {
  name: "Hornbill Festival",
  location: "Kisama",
  state: "Nagaland",
  timeframe: "First week of December",
  description: "d",
  culturalSignificance: "c",
  travelerTips: "t",
};

interface RouteCase {
  label: string;
  post: (req: Request) => Promise<Response>;
  url: string;
  validBody: Record<string, unknown>;
  invalidBody: Record<string, unknown>;
  aiData: Record<string, unknown>;
  listKey: string;
  feature: string;
}

const cases: RouteCase[] = [
  {
    label: "recommendations",
    post: recommendationsPost,
    url: "http://test/api/ai/recommendations",
    validBody: { interests: ["Heritage & Monuments"], region: "Odisha" },
    invalidBody: { interests: [] },
    aiData: { recommendations: [recommendationItem] },
    listKey: "recommendations",
    feature: "recommendations",
  },
  {
    label: "hidden-gems",
    post: hiddenGemsPost,
    url: "http://test/api/ai/hidden-gems",
    validBody: { state: "Gujarat", interests: ["Art & Handicrafts"] },
    invalidBody: { state: "Atlantis" },
    aiData: { gems: [gemItem] },
    listKey: "gems",
    feature: "hidden-gems",
  },
  {
    label: "events",
    post: eventsPost,
    url: "http://test/api/ai/events",
    validBody: { month: "December", region: "Nagaland" },
    invalidBody: { month: "Smarch" },
    aiData: { events: [eventItem] },
    listKey: "events",
    feature: "events",
  },
];

function jsonRequest(url: string, body: unknown): Request {
  return new Request(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getSessionUser).mockResolvedValue(testUser);
});

for (const c of cases) {
  describe(`POST /api/ai/${c.label}`, () => {
    it("returns 200 with the envelope and passes AI meta through", async () => {
      vi.mocked(generateJson).mockResolvedValue({
        data: c.aiData,
        model: "gemini-test-model",
        latencyMs: 123,
      });

      const res = await c.post(jsonRequest(c.url, c.validBody));
      expect(res.status).toBe(200);

      const body = (await res.json()) as Record<string, unknown>;
      expect(body[c.listKey]).toEqual(c.aiData[c.listKey]);
      expect(body.meta).toEqual({ model: "gemini-test-model", latencyMs: 123 });

      expect(vi.mocked(logAiInteraction)).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: testUser.id,
          feature: c.feature,
          model: "gemini-test-model",
          latencyMs: 123,
        }),
      );
    });

    it("returns 400 with an error message for an invalid body", async () => {
      const res = await c.post(jsonRequest(c.url, c.invalidBody));
      expect(res.status).toBe(400);
      const body = (await res.json()) as { error: string };
      expect(typeof body.error).toBe("string");
      expect(body.error.length).toBeGreaterThan(0);
      expect(vi.mocked(generateJson)).not.toHaveBeenCalled();
    });

    it("maps an AiError(429) from the client to a 429 response", async () => {
      vi.mocked(generateJson).mockRejectedValue(
        new AiError("The AI service is rate-limited right now.", 429, "AI_RATE_LIMITED"),
      );

      const res = await c.post(jsonRequest(c.url, c.validBody));
      expect(res.status).toBe(429);
      const body = (await res.json()) as { error: string; code?: string };
      expect(body.code).toBe("AI_RATE_LIMITED");
    });

    it("returns 401 UNAUTHENTICATED when there is no session", async () => {
      vi.mocked(getSessionUser).mockResolvedValue(null);

      const res = await c.post(jsonRequest(c.url, c.validBody));
      expect(res.status).toBe(401);
      const body = (await res.json()) as { error: string; code?: string };
      expect(body.code).toBe("UNAUTHENTICATED");
      expect(vi.mocked(generateJson)).not.toHaveBeenCalled();
    });

    it("returns an honest 502 when the model output fails shape validation", async () => {
      vi.mocked(generateJson).mockResolvedValue({
        data: { unexpected: true },
        model: "gemini-test-model",
        latencyMs: 5,
      });

      const res = await c.post(jsonRequest(c.url, c.validBody));
      expect(res.status).toBe(502);
      const body = (await res.json()) as { error: string; code?: string };
      expect(body.code).toBe("AI_INVALID_SHAPE");
    });

    it("calls logAiInteraction with correct metadata on successful response", async () => {
      vi.mocked(generateJson).mockResolvedValue({
        data: c.aiData,
        model: "gemini-2.0",
        latencyMs: 500,
      });

      const res = await c.post(jsonRequest(c.url, c.validBody));
      expect(res.status).toBe(200);

      // Verify logAiInteraction was called with the correct metadata
      expect(vi.mocked(logAiInteraction)).toHaveBeenCalledWith(
        expect.objectContaining({
          latencyMs: 500,
          model: "gemini-2.0",
        }),
      );
    });
  });
}
