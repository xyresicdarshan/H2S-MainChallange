/**
 * Low-level Google Gemini client (REST v1beta, zero SDK dependencies).
 *
 * Every AI feature in the app goes through these two functions, so there is
 * exactly one place that talks to the model:
 * - generateJson(): schema-constrained JSON output (recommendations, hidden
 *   gems, events)
 * - streamText(): server-sent-events streaming (storytelling)
 *
 * The API key is read from the server-only GEMINI_API_KEY env var at call
 * time (never at module scope, never exposed with a NEXT_PUBLIC_ prefix).
 * On any failure we throw AiError — routes surface an honest error message.
 * There are NO canned fallback responses anywhere.
 */

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.5-flash";

export class AiError extends Error {
  constructor(
    message: string,
    public readonly status: number = 502,
    public readonly code: string = "AI_ERROR",
  ) {
    super(message);
    this.name = "AiError";
  }
}

function getConfig(): { apiKey: string; model: string } {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiError(
      "GEMINI_API_KEY is not configured on the server.",
      500,
      "AI_NOT_CONFIGURED",
    );
  }
  return { apiKey, model: process.env.GEMINI_MODEL || DEFAULT_MODEL };
}

/** Subset of the Gemini responseSchema format (OpenAPI-style, uppercase types). */
export interface GeminiSchema {
  type: "OBJECT" | "ARRAY" | "STRING" | "NUMBER" | "INTEGER" | "BOOLEAN";
  description?: string;
  properties?: Record<string, GeminiSchema>;
  required?: string[];
  items?: GeminiSchema;
  enum?: string[];
}

export interface GenerateJsonOptions {
  prompt: string;
  system?: string;
  schema: GeminiSchema;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateJsonResult<T> {
  data: T;
  model: string;
  latencyMs: number;
}

interface GeminiRestResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  error?: { message?: string; status?: string };
}

function buildBody(opts: {
  prompt: string;
  system?: string;
  generationConfig: Record<string, unknown>;
}) {
  return {
    ...(opts.system
      ? { systemInstruction: { parts: [{ text: opts.system }] } }
      : {}),
    contents: [{ role: "user", parts: [{ text: opts.prompt }] }],
    generationConfig: opts.generationConfig,
  };
}

async function throwFromBadResponse(res: Response): Promise<never> {
  let detail = "";
  try {
    const body = (await res.json()) as GeminiRestResponse;
    detail = body.error?.message ?? "";
  } catch {
    /* non-JSON error body */
  }
  if (res.status === 429) {
    throw new AiError(
      "The AI service is rate-limited right now. Please retry in a few seconds.",
      429,
      "AI_RATE_LIMITED",
    );
  }
  if (res.status === 400 && detail.toLowerCase().includes("api key")) {
    throw new AiError("The configured Gemini API key was rejected.", 500, "AI_BAD_KEY");
  }
  throw new AiError(
    `The AI service returned an error (HTTP ${res.status}).${detail ? ` ${detail}` : ""}`,
    502,
    "AI_UPSTREAM_ERROR",
  );
}

/**
 * One JSON-mode call to Gemini. The response is constrained by `schema`
 * (enforced server-side by Gemini's responseSchema) and parsed before being
 * returned, so callers always receive structured data or a thrown AiError.
 */
export async function generateJson<T>(opts: GenerateJsonOptions): Promise<GenerateJsonResult<T>> {
  const { apiKey, model } = getConfig();
  const started = Date.now();

  const res = await fetch(`${GEMINI_BASE}/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(
      buildBody({
        prompt: opts.prompt,
        system: opts.system,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: opts.schema,
          temperature: opts.temperature ?? 0.8,
          maxOutputTokens: opts.maxOutputTokens ?? 8192,
        },
      }),
    ),
  });

  if (!res.ok) await throwFromBadResponse(res);

  const body = (await res.json()) as GeminiRestResponse;

  if (body.promptFeedback?.blockReason) {
    throw new AiError(
      `The AI service declined this request (${body.promptFeedback.blockReason}). Try different inputs.`,
      422,
      "AI_BLOCKED",
    );
  }

  const text = body.candidates?.[0]?.content?.parts
    ?.map((p) => p.text ?? "")
    .join("");
  if (!text) {
    throw new AiError("The AI service returned an empty response.", 502, "AI_EMPTY");
  }

  let data: T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    throw new AiError("The AI service returned malformed JSON.", 502, "AI_BAD_JSON");
  }

  return { data, model, latencyMs: Date.now() - started };
}

export interface StreamTextOptions {
  prompt: string;
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface StreamTextResult {
  /** Plain-text chunks (already decoded from Gemini's SSE frames). */
  stream: ReadableStream<Uint8Array>;
  model: string;
}

/**
 * Streaming text call (SSE). Parses Gemini's `data: {...}` frames and
 * re-emits only the text deltas, so the route handler can pipe the stream
 * straight to the browser.
 */
export async function streamText(opts: StreamTextOptions): Promise<StreamTextResult> {
  const { apiKey, model } = getConfig();

  const res = await fetch(`${GEMINI_BASE}/${model}:streamGenerateContent?alt=sse`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(
      buildBody({
        prompt: opts.prompt,
        system: opts.system,
        generationConfig: {
          temperature: opts.temperature ?? 0.9,
          maxOutputTokens: opts.maxOutputTokens ?? 4096,
        },
      }),
    ),
  });

  if (!res.ok || !res.body) await throwFromBadResponse(res);

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffered = "";

  function processLine(frame: string, controller: TransformStreamDefaultController<Uint8Array>) {
    const line = frame.trim();
    if (!line.startsWith("data:")) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") return;
    try {
      const parsed = JSON.parse(payload) as GeminiRestResponse;
      const candidate = parsed.candidates?.[0];
      const text = candidate?.content?.parts?.map((p) => p.text ?? "").join("");
      if (text) controller.enqueue(encoder.encode(text));
      // A non-STOP finish means the story was cut short (SAFETY, MAX_TOKENS,
      // RECITATION…). Error the stream so the client shows an honest
      // interruption message instead of presenting a truncated story as done.
      const finishReason = candidate?.finishReason;
      if (finishReason && finishReason !== "STOP") {
        controller.error(
          new AiError(
            `The AI service stopped generating early (${finishReason}). Please try again.`,
            502,
            "AI_STREAM_INTERRUPTED",
          ),
        );
      }
    } catch {
      /* ignore malformed keep-alive frames */
    }
  }

  const stream = res.body!.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffered += decoder.decode(chunk, { stream: true });
        // SSE frames are newline-separated; keep the partial tail in buffer.
        const frames = buffered.split("\n");
        buffered = frames.pop() ?? "";
        for (const frame of frames) processLine(frame, controller);
      },
      // Without flush, a final frame lacking a trailing newline would be
      // silently dropped and the story would end truncated.
      flush(controller) {
        buffered += decoder.decode();
        if (buffered) processLine(buffered, controller);
      },
    }),
  );

  return { stream, model };
}
