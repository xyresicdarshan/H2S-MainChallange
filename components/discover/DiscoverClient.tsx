"use client";

import { useCallback, useState, type FormEvent, memo } from "react";
import Link from "next/link";
import {
  INDIAN_REGIONS,
  INTEREST_OPTIONS,
  TRAVEL_STYLES,
  type AiMeta,
  type PreferencesPayload,
  type Recommendation,
  type RecommendationsRequest,
  type RecommendationsResponse,
} from "@/lib/types";
import { INTEREST_LIMITS, MESSAGES } from "@/lib/messages";
import { API_HEADERS } from "@/lib/api-utils";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MetaLine } from "@/components/MetaLine";
import { SaveButton } from "@/components/SaveButton";
import { readApiError } from "@/components/api";

export const DiscoverClientMemo = memo(function DiscoverClient({
  initialPreferences,
}: {
  initialPreferences: PreferencesPayload | null;
}) {
  const [interests, setInterests] = useState<string[]>(
    (initialPreferences?.interests ?? []).filter((i) =>
      (INTEREST_OPTIONS as readonly string[]).includes(i),
    ),
  );
  const [region, setRegion] = useState(initialPreferences?.homeRegion ?? "");
  const [travelStyle, setTravelStyle] = useState(initialPreferences?.travelStyle ?? "");
  const [interestError, setInterestError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Recommendation[] | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);
  const [prefSaving, setPrefSaving] = useState(false);
  const [prefError, setPrefError] = useState<string | null>(null);
  const [prefSuccess, setPrefSuccess] = useState<string | null>(null);

  const toggleInterestMemo = useCallback((value: string) => {
    setInterestError(null);
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }, []);

  const validateInterests = useCallback((): boolean => {
    if (interests.length < INTEREST_LIMITS.MIN) {
      setInterestError(MESSAGES.INTERESTS_MIN);
      return false;
    }
    if (interests.length > INTEREST_LIMITS.MAX) {
      setInterestError(MESSAGES.INTERESTS_MAX);
      return false;
    }
    setInterestError(null);
    return true;
  }, [interests]);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!validateInterests()) return;

      setLoading(true);
      setError(null);
      try {
        const body: RecommendationsRequest = {
          interests,
          ...(region ? { region } : {}),
          ...(travelStyle ? { travelStyle } : {}),
        };
        const res = await fetch("/api/ai/recommendations", {
          method: "POST",
          headers: API_HEADERS.JSON,
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          setError(
            await readApiError(res, MESSAGES.AI_GENERATION_FAILED(res.status)),
          );
          setResults(null);
          setMeta(null);
          return;
        }
        const data = (await res.json()) as RecommendationsResponse;
        setResults(data.recommendations);
        setMeta(data.meta);
      } catch {
        setError(MESSAGES.NETWORK_ERROR);
      } finally {
        setLoading(false);
      }
    },
    [interests, region, travelStyle, validateInterests],
  );

  const handleSavePreferences = useCallback(async () => {
    if (!validateInterests()) return;
    setPrefSaving(true);
    setPrefError(null);
    setPrefSuccess(null);
    try {
      const body: PreferencesPayload = {
        interests,
        homeRegion: region || null,
        travelStyle: travelStyle || null,
      };
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: API_HEADERS.JSON,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setPrefError(
          await readApiError(res, MESSAGES.PREFERENCES_SAVE_FAILED(res.status)),
        );
        return;
      }
      setPrefSuccess(MESSAGES.PREFERENCES_SAVED);
    } catch {
      setPrefError(MESSAGES.NETWORK_ERROR_PREF);
    } finally {
      setPrefSaving(false);
    }
  }, [interests, region, travelStyle, validateInterests]);

  const atMax = interests.length >= 5;

  return (
    <div>
      <form onSubmit={handleSubmit} noValidate className="card space-y-6">
        <fieldset aria-describedby={interestError ? "interests-error interests-hint" : "interests-hint"}>
          <legend className="text-sm font-medium">Your interests</legend>
          <p id="interests-hint" className="mt-1 text-xs text-ink/70">
            {MESSAGES.INTERESTS_HINT}
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((option, index) => {
              const checked = interests.includes(option);
              return (
                <div key={option} className="flex items-center gap-2">
                  <input
                    id={`discover-interest-${index}`}
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && atMax}
                    onChange={() => toggleInterestMemo(option)}
                    aria-invalid={interestError ? true : undefined}
                    className="h-4 w-4 accent-maroon"
                  />
                  <label htmlFor={`discover-interest-${index}`} className="text-sm">
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
          {interestError && (
            <p id="interests-error" role="alert" className="mt-2 text-sm text-maroon-deep">
              {interestError}
            </p>
          )}
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="discover-region" className="block text-sm font-medium">
              Region
            </label>
            <select
              id="discover-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="field-input mt-1.5"
            >
              <option value="">Anywhere in India</option>
              {INDIAN_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="discover-travel-style" className="block text-sm font-medium">
              Travel style <span className="font-normal text-ink/70">{MESSAGES.TRAVEL_STYLE_OPTIONAL}</span>
            </label>
            <select
              id="discover-travel-style"
              value={travelStyle}
              onChange={(e) => setTravelStyle(e.target.value)}
              className="field-input mt-1.5"
            >
              <option value="">No preference</option>
              {TRAVEL_STYLES.map((style) => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Generating…" : "Generate recommendations"}
          </button>
          <button
            type="button"
            onClick={handleSavePreferences}
            disabled={prefSaving}
            className="btn-secondary"
          >
            {prefSaving ? "Saving…" : "Save these interests to my profile"}
          </button>
        </div>
        <div aria-live="polite">
          {prefSuccess && <p className="text-sm text-leaf">{prefSuccess}</p>}
        </div>
        <ErrorAlert message={prefError} />
      </form>

      <div className="mt-6">
        <ErrorAlert message={error} />
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-6 space-y-6">
        {loading && <LoadingIndicator label="Gemini is curating recommendations…" />}
        {!loading && results && (
          <section aria-labelledby="recommendations-heading" className="space-y-6">
            <h2 id="recommendations-heading" className="text-2xl text-maroon-deep">
              Recommendations
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {results.map((rec, index) => (
                <article key={`${rec.name}-${index}`} className="card flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-saffron">
                      {rec.category}
                    </p>
                    <h3 className="mt-1 text-xl text-maroon-deep">{rec.name}</h3>
                    <p className="mt-1 text-sm text-ink/70">
                      {rec.location}, {rec.state}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{rec.description}</p>
                  <div className="rounded-xl border-l-4 border-saffron bg-parchment p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-saffron">
                      Why this fits you
                    </p>
                    <p className="mt-1 text-sm leading-relaxed">{rec.whyRecommended}</p>
                  </div>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="font-medium text-ink/70">Best time to visit</dt>
                      <dd>{rec.bestTimeToVisit}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink/70">Cultural significance</dt>
                      <dd>{rec.culturalSignificance}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                    <SaveButton
                      item={{
                        itemType: "attraction",
                        title: rec.name,
                        region: rec.state,
                        summary: rec.description,
                        payload: { ...rec },
                      }}
                    />
                    <Link
                      href={`/story?site=${encodeURIComponent(rec.name)}&state=${encodeURIComponent(rec.state)}`}
                      className="text-sm font-medium text-maroon underline underline-offset-4 hover:text-maroon-deep"
                    >
                      Generate its story
                    </Link>
                  </div>
                </article>
              ))}
            </div>
            {meta && <MetaLine model={meta.model} latencyMs={meta.latencyMs} />}
          </section>
        )}
      </div>
    </div>
  );
});

export const DiscoverClient = DiscoverClientMemo;
