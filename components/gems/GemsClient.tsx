"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import {
  INDIAN_REGIONS,
  INTEREST_OPTIONS,
  type AiMeta,
  type HiddenGem,
  type HiddenGemsRequest,
  type HiddenGemsResponse,
} from "@/lib/types";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MetaLine } from "@/components/MetaLine";
import { SaveButton } from "@/components/SaveButton";
import { readApiError } from "@/components/api";

export function GemsClient() {
  const [state, setState] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [stateError, setStateError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HiddenGem[] | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);

  function toggleInterest(value: string) {
    setInterests((prev) =>
      prev.includes(value) ? prev.filter((i) => i !== value) : [...prev, value],
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!state) {
      setStateError("Choose a state to explore.");
      return;
    }
    setStateError(null);
    setLoading(true);
    setError(null);
    try {
      const body: HiddenGemsRequest = {
        state,
        ...(interests.length > 0 ? { interests } : {}),
      };
      const res = await fetch("/api/ai/hidden-gems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setError(await readApiError(res, `Generation failed (HTTP ${res.status}).`));
        setResults(null);
        setMeta(null);
        return;
      }
      const data = (await res.json()) as HiddenGemsResponse;
      setResults(data.gems);
      setMeta(data.meta);
    } catch {
      setError("Network error — the request did not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  const atMax = interests.length >= 5;

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="card space-y-6">
        <div className="max-w-sm">
          <label htmlFor="gems-state" className="block text-sm font-medium">
            State
          </label>
          <select
            id="gems-state"
            value={state}
            onChange={(e) => {
              setState(e.target.value);
              setStateError(null);
            }}
            aria-invalid={stateError ? true : undefined}
            aria-describedby={stateError ? "gems-state-error" : undefined}
            className="field-input mt-1.5"
          >
            <option value="">Choose a state…</option>
            {INDIAN_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {stateError && (
            <p id="gems-state-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
              {stateError}
            </p>
          )}
        </div>

        <fieldset aria-describedby="gems-interests-hint">
          <legend className="text-sm font-medium">
            Focus interests <span className="font-normal text-ink/70">(optional)</span>
          </legend>
          <p id="gems-interests-hint" className="mt-1 text-xs text-ink/70">
            Pick up to five to narrow the search.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {INTEREST_OPTIONS.map((option, index) => {
              const checked = interests.includes(option);
              return (
                <div key={option} className="flex items-center gap-2">
                  <input
                    id={`gems-interest-${index}`}
                    type="checkbox"
                    checked={checked}
                    disabled={!checked && atMax}
                    onChange={() => toggleInterest(option)}
                    className="h-4 w-4 accent-maroon"
                  />
                  <label htmlFor={`gems-interest-${index}`} className="text-sm">
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Searching…" : "Find hidden gems"}
        </button>
      </form>

      <div className="mt-6">
        <ErrorAlert message={error} />
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-6 space-y-6">
        {loading && <LoadingIndicator label="Gemini is searching for hidden gems…" />}
        {!loading && results && (
          <section aria-labelledby="gems-heading" className="space-y-6">
            <h2 id="gems-heading" className="text-2xl text-maroon-deep">
              Hidden gems in {results[0]?.state ?? state}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {results.map((gem, index) => (
                <article key={`${gem.name}-${index}`} className="card flex flex-col gap-4">
                  <div>
                    <h3 className="text-xl text-maroon-deep">{gem.name}</h3>
                    <p className="mt-1 text-sm text-ink/70">
                      {gem.location}, {gem.state}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{gem.description}</p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="font-medium text-ink/70">Cultural context</dt>
                      <dd className="leading-relaxed">{gem.culturalContext}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-ink/70">How to reach</dt>
                      <dd className="leading-relaxed">{gem.howToReach}</dd>
                    </div>
                    <div className="rounded-xl border-l-4 border-leaf bg-parchment p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-leaf">
                        Local tip
                      </dt>
                      <dd className="mt-1 leading-relaxed">{gem.localTip}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap items-center gap-4 pt-2">
                    <SaveButton
                      item={{
                        itemType: "hidden-gem",
                        title: gem.name,
                        region: gem.state,
                        summary: gem.description,
                        payload: { ...gem },
                      }}
                    />
                    <Link
                      href={`/story?site=${encodeURIComponent(gem.name)}&state=${encodeURIComponent(gem.state)}`}
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
}
