import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AiError, generateJson, streamText, type GeminiSchema } from "@/lib/ai/client";

const MINIMAL_SCHEMA: GeminiSchema = { type: "OBJECT" };

const originalApiKey = process.env.GEMINI_API_KEY;
const originalModel = process.env.GEMINI_MODEL;

function stubFetch(response: Response) {
  const fn = vi.fn(async () => response);
  vi.stubGlobal("fetch", fn);
  return fn;
}

function geminiJsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

async function captureAiError(promise: Promise<unknown>): Promise<AiError> {
  try {
    await promise;
  } catch (err) {
    expect(err).toBeInstanceOf(AiError);
    return err as AiError;
  }
  throw new Error("expected the call to throw AiError, but it resolved");
}

beforeEach(() => {
  process.env.GEMINI_API_KEY = "test-api-key";
  delete process.env.GEMINI_MODEL; // make the default model deterministic
});

afterEach(() => {
  vi.unstubAllGlobals();
});

afterAll(() => {
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
  if (originalModel === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = originalModel;
});

describe("generateJson", () => {
  it("returns parsed data, model, and latencyMs on success", async () => {
    const payload = { greeting: "namaste", spots: ["Hampi", "Majuli"] };
    const fetchMock = stubFetch(
      geminiJsonResponse({
        candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }],
      }),
    );

    const result = await generateJson<typeof payload>({
      prompt: "hello",
      schema: MINIMAL_SCHEMA,
    });

    expect(result.data).toEqual(payload);
    expect(result.model).toBe("gemini-2.5-flash");
    expect(typeof result.latencyMs).toBe("number");
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toContain("gemini-2.5-flash:generateContent");
    expect(new Headers(init.headers).get("x-goog-api-key")).toBe("test-api-key");
  });

  it("joins multi-part candidate text before parsing", async () => {
    stubFetch(
      geminiJsonResponse({
        candidates: [{ content: { parts: [{ text: '{"a":' }, { text: "1}" }] } }],
      }),
    );
    const result = await generateJson<{ a: number }>({ prompt: "p", schema: MINIMAL_SCHEMA });
    expect(result.data).toEqual({ a: 1 });
  });

  it("throws AI_RATE_LIMITED with status 429 on HTTP 429", async () => {
    stubFetch(geminiJsonResponse({ error: { message: "Quota exceeded" } }, 429));
    const err = await captureAiError(generateJson({ prompt: "p", schema: MINIMAL_SCHEMA }));
    expect(err.code).toBe("AI_RATE_LIMITED");
    expect(err.status).toBe(429);
  });

  it("throws AI_BLOCKED when promptFeedback reports a block reason", async () => {
    stubFetch(geminiJsonResponse({ promptFeedback: { blockReason: "SAFETY" } }));
    const err = await captureAiError(generateJson({ prompt: "p", schema: MINIMAL_SCHEMA }));
    expect(err.code).toBe("AI_BLOCKED");
    expect(err.status).toBe(422);
  });

  it("throws AI_EMPTY when the response has no candidates", async () => {
    stubFetch(geminiJsonResponse({ candidates: [] }));
    const err = await captureAiError(generateJson({ prompt: "p", schema: MINIMAL_SCHEMA }));
    expect(err.code).toBe("AI_EMPTY");
  });

  it("throws AI_BAD_JSON when the candidate text is not valid JSON", async () => {
    stubFetch(
      geminiJsonResponse({
        candidates: [{ content: { parts: [{ text: "this is not { json" }] } }],
      }),
    );
    const err = await captureAiError(generateJson({ prompt: "p", schema: MINIMAL_SCHEMA }));
    expect(err.code).toBe("AI_BAD_JSON");
  });

  it("throws AI_NOT_CONFIGURED without calling fetch when GEMINI_API_KEY is missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const fetchMock = stubFetch(geminiJsonResponse({}));
    try {
      const err = await captureAiError(generateJson({ prompt: "p", schema: MINIMAL_SCHEMA }));
      expect(err.code).toBe("AI_NOT_CONFIGURED");
      expect(err.status).toBe(500);
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      process.env.GEMINI_API_KEY = "test-api-key";
    }
  });
});

describe("streamText", () => {
  function sseFrame(text: string): string {
    return `data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`;
  }

  function chunkedBody(raw: string, chunkSize: number): ReadableStream<Uint8Array> {
    const encoder = new TextEncoder();
    return new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < raw.length; i += chunkSize) {
          controller.enqueue(encoder.encode(raw.slice(i, i + chunkSize)));
        }
        controller.close();
      },
    });
  }

  async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let out = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      out += decoder.decode(value, { stream: true });
    }
    return out + decoder.decode();
  }

  it("re-emits exactly the text deltas even when SSE frames split across chunks", async () => {
    const raw =
      sseFrame("Once upon ") + sseFrame("a time, ") + sseFrame("in Hampi.");
    // 17-byte chunks guarantee every frame is split mid-JSON, proving buffering.
    stubFetch(new Response(chunkedBody(raw, 17), { status: 200 }));

    const result = await streamText({ prompt: "tell me a story" });
    expect(result.model).toBe("gemini-2.5-flash");
    await expect(readAll(result.stream)).resolves.toBe("Once upon a time, in Hampi.");
  });

  it("ignores keep-alive/malformed frames and [DONE] markers", async () => {
    const raw =
      ": keep-alive comment\n\n" +
      sseFrame("Hello") +
      "data: not-json\n\n" +
      sseFrame(" world") +
      "data: [DONE]\n\n";
    stubFetch(new Response(chunkedBody(raw, 11), { status: 200 }));

    const result = await streamText({ prompt: "p" });
    await expect(readAll(result.stream)).resolves.toBe("Hello world");
  });

  it("throws AI_RATE_LIMITED on HTTP 429 before streaming", async () => {
    stubFetch(geminiJsonResponse({ error: { message: "Quota exceeded" } }, 429));
    const err = await captureAiError(streamText({ prompt: "p" }));
    expect(err.code).toBe("AI_RATE_LIMITED");
    expect(err.status).toBe(429);
  });
});
