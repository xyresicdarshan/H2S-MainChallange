"use client";

import { useState, type FormEvent } from "react";
import {
  INDIAN_REGIONS,
  MONTHS,
  type AiMeta,
  type CulturalEvent,
  type EventsRequest,
  type EventsResponse,
} from "@/lib/types";
import { ErrorAlert } from "@/components/ErrorAlert";
import { LoadingIndicator } from "@/components/LoadingIndicator";
import { MetaLine } from "@/components/MetaLine";
import { SaveButton } from "@/components/SaveButton";
import { readApiError } from "@/components/api";

export function EventsClient() {
  const [month, setMonth] = useState("");
  const [region, setRegion] = useState("");
  const [monthError, setMonthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CulturalEvent[] | null>(null);
  const [meta, setMeta] = useState<AiMeta | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!month) {
      setMonthError("Choose a month.");
      return;
    }
    setMonthError(null);
    setLoading(true);
    setError(null);
    try {
      const body: EventsRequest = {
        month,
        ...(region ? { region } : {}),
      };
      const res = await fetch("/api/ai/events", {
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
      const data = (await res.json()) as EventsResponse;
      setResults(data.events);
      setMeta(data.meta);
    } catch {
      setError("Network error — the request did not reach the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} noValidate className="card space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="events-month" className="block text-sm font-medium">
              Month
            </label>
            <select
              id="events-month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setMonthError(null);
              }}
              aria-invalid={monthError ? true : undefined}
              aria-describedby={monthError ? "events-month-error" : undefined}
              className="field-input mt-1.5"
            >
              <option value="">Choose a month…</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            {monthError && (
              <p id="events-month-error" role="alert" className="mt-1.5 text-sm text-maroon-deep">
                {monthError}
              </p>
            )}
          </div>
          <div>
            <label htmlFor="events-region" className="block text-sm font-medium">
              Region <span className="font-normal text-ink/70">(optional)</span>
            </label>
            <select
              id="events-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="field-input mt-1.5"
            >
              <option value="">All of India</option>
              {INDIAN_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Finding festivals…" : "Find festivals"}
        </button>
      </form>

      <div className="mt-6">
        <ErrorAlert message={error} />
      </div>

      <div aria-live="polite" aria-busy={loading} className="mt-6 space-y-6">
        {loading && <LoadingIndicator label="Gemini is compiling the festival calendar…" />}
        {!loading && results && (
          <section aria-labelledby="events-heading" className="space-y-6">
            <h2 id="events-heading" className="text-2xl text-maroon-deep">
              Festivals &amp; events{month ? ` in ${month}` : ""}
            </h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {results.map((item, index) => (
                <article key={`${item.name}-${index}`} className="card flex flex-col gap-4">
                  <div>
                    <p className="inline-block rounded-full bg-leaf/10 px-3 py-1 text-xs font-semibold text-leaf">
                      {item.timeframe}
                    </p>
                    <h3 className="mt-2 text-xl text-maroon-deep">{item.name}</h3>
                    <p className="mt-1 text-sm text-ink/70">
                      {item.location}, {item.state}
                    </p>
                  </div>
                  <p className="text-sm leading-relaxed">{item.description}</p>
                  <dl className="space-y-3 text-sm">
                    <div>
                      <dt className="font-medium text-ink/70">Cultural significance</dt>
                      <dd className="leading-relaxed">{item.culturalSignificance}</dd>
                    </div>
                    <div className="rounded-xl border-l-4 border-saffron bg-parchment p-3">
                      <dt className="text-xs font-semibold uppercase tracking-wide text-saffron">
                        Traveler tips
                      </dt>
                      <dd className="mt-1 leading-relaxed">{item.travelerTips}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto pt-2">
                    <SaveButton
                      item={{
                        itemType: "event",
                        title: item.name,
                        region: item.state,
                        summary: item.description,
                        payload: { ...item },
                      }}
                    />
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
