"use client";

import { useState, type FormEvent } from "react";
import { INDIAN_REGIONS, STORY_THEMES, type StoryRequest } from "@/lib/types";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MetaLine } from "@/components/MetaLine";
import { SaveButton } from "@/components/SaveButton";
import { readApiError } from "@/components/api";

export function StoryClient({
  initialSite,
  initialState,
}: {
  initialSite?: string;
  initialState?: string;
}) {
  const [siteName, setSiteName] = useState(initialSite ?? "");
  const [state, setState] = useState(
    initialState && (INDIAN_REGIONS as readonly string[]).includes(initialState)
      ? initialState
      : "",
  );
  const [theme, setTheme] = useState("");
  const [siteError, setSiteError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const [story, setStory] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState<StoryRequest | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = siteName.trim();
    if (trimmed.length < 2 || trimmed.length > 120) {
      setSiteError("Enter a place name between 2 and 120 characters.");
      return;
    }
    setSiteError(null);

    const request: StoryRequest = {
      siteName: trimmed,
      ...(state ? { state } : {}),
      ...(theme ? { theme } : {}),
    };

    setError(null);
    setStory("");
    setModel(null);
    setDone(false);
    setLastRequest(request);
    setStreaming(true);
    try {
      const res = await fetch("/api/ai/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });
      if (!res.ok) {
        setError(await readApiError(res, `The story could not be generated (HTTP ${res.status}).`));
        return;
      }
      setModel(res.headers.get("X-Ai-Model"));
      if (!res.body) {
        setError("The story stream could not be read from the server.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      for (;;) {
        const { done: finished, value } = await reader.read();
        if (finished) break;
        if (value) {
          text += decoder.decode(value, { stream: true });
          setStory(text);
        }
      }
      text += decoder.decode();
      setStory(text);
      if (text.length === 0) {
        setError("The AI service returned an empty story. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("The connection dropped while the story was streaming. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="card space-y-6">
        <div className="grid gap-5 sm:grid-cols-3">
          <div className="sm:col-span-3 lg:col-span-1">
            <label htmlFor="story-site" className="block text-sm font-medium">
              Place or site name
            </label>
            <input
              id="story-site"
              type="text"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                setSiteError(null);
              }}
              aria-invalid={siteError ? true : undefined}
              aria-describedby={siteError ? "story-site-error" : undefined}
              placeholder="e.g. Rani ki Vav"
              className="field-input mt-1.5"
            />
            {siteError && (
              <p id="story-site-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
                {siteError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="story-state" className="block text-sm font-medium">
              State <span className="font-normal text-ink/70">(optional)</span>
            </label>
            <select
              id="story-state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="field-input mt-1.5"
            >
              <option value="">Not sure / skip</option>
              {INDIAN_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="story-theme" className="block text-sm font-medium">
              Theme <span className="font-normal text-ink/70">(optional)</span>
            </label>
            <select
              id="story-theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="field-input mt-1.5"
            >
              <option value="">Let Gemini choose</option>
              {STORY_THEMES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" disabled={streaming} className="btn-primary">
          {streaming ? "Writing…" : "Tell me its story"}
        </button>
      </form>

      <div className="mt-6">
        <ErrorAlert message={error} />
      </div>

      <div aria-live="polite" aria-busy={streaming} className="mt-6 space-y-4">
        {streaming && <LoadingIndicator label="Gemini is writing…" />}
        {(story.length > 0 || streaming) && lastRequest && (
          <section aria-labelledby="story-heading" className="space-y-3">
            <h2 id="story-heading" className="text-2xl text-maroon-deep">
              The story of {lastRequest.siteName}
            </h2>
            <div className="card whitespace-pre-wrap text-[0.95rem] leading-relaxed">{story}</div>
            {model && <MetaLine model={model} />}
          </section>
        )}
        {done && lastRequest && (
          <>
            <p role="status" className="text-sm text-leaf">
              Story complete.
            </p>
            <SaveButton
              item={{
                itemType: "story",
                title: lastRequest.siteName,
                region: lastRequest.state,
                summary: story.slice(0, 180),
                payload: {
                  storyText: story,
                  siteName: lastRequest.siteName,
                  state: lastRequest.state,
                  theme: lastRequest.theme,
                },
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
