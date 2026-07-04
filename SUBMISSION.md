# Competition Submission — Virasat

> **Fill in the two ALL-CAPS placeholders (live URL + repo visibility check) before submitting.**

## 1. Public GitHub repository

https://github.com/xyresicdarshan/H2S-MainChallange — make sure the repo is set to **Public** in Settings before submitting.

## 2. Deployed version vs. development

**Live URL:** `https://YOUR-DEPLOYMENT.vercel.app` ← replace after the Vercel import (steps in README → "Deploying to Vercel").

The deployed version is identical to `main` — the same code path runs locally and in production. The only environment differences:

- Production reads `GEMINI_API_KEY`, `DATABASE_URL`, and `AUTH_SECRET` from Vercel environment variables (never committed).
- Session cookies are `secure` in production (HTTPS-only).
- The CSP drops `'unsafe-eval'` outside development (it exists in dev only for React Fast Refresh).
- The database schema is applied with `npm run db:push` and the evaluator account seeded with `npm run db:seed` against the production database.

There are no demo-only flags, no feature switches, and no behavior that differs between the demo and genuine testing.

## 3. GenAI services utilized, and where

**Service: Google Gemini** (model `gemini-2.5-flash`, REST API v1beta). All calls go through a single client, [`lib/ai/client.ts`](lib/ai/client.ts) — there is no other model integration point, which makes the integration easy to audit.

| Where in the app | API call | File |
|---|---|---|
| **Personalized recommendations** on `/discover` | Gemini JSON-mode (`generateContent` with `responseSchema`) generates 6 attraction recommendations from the user's interests/region/travel style | [`app/api/ai/recommendations/route.ts`](app/api/ai/recommendations/route.ts) |
| **Hidden gems** on `/hidden-gems` | Gemini JSON-mode generates 5 lesser-known cultural places for a chosen state | [`app/api/ai/hidden-gems/route.ts`](app/api/ai/hidden-gems/route.ts) |
| **Cultural storytelling** on `/story` (also linked from every recommendation card) | Gemini **streaming** (`streamGenerateContent?alt=sse`) writes a 450–650 word heritage narrative, streamed to the browser token-by-token | [`app/api/ai/story/route.ts`](app/api/ai/story/route.ts) |
| **Festival & event finder** on `/events` | Gemini JSON-mode suggests recurring festivals/cultural events for a month + region | [`app/api/ai/events/route.ts`](app/api/ai/events/route.ts) |

Prompt engineering lives in [`lib/ai/prompts.ts`](lib/ai/prompts.ts) (system prompt constrains the model to real, verifiable places and culturally respectful content). Every response is schema-constrained by Gemini **and** re-validated with zod ([`lib/ai/schemas.ts`](lib/ai/schemas.ts)) before display. Every call is audit-logged to the `ai_interactions` table with model + latency, and the UI shows *"Generated live by [model] in X.Xs"* under every result.

**There are no canned, mock, or fallback AI responses anywhere in the codebase.** If Gemini errors or rate-limits, the user sees an honest error message with the correct HTTP status.

## 4. Test credentials

| Field | Value |
|---|---|
| URL | the live URL above → **Log in** |
| Email | `demo@virasat.app` |
| Password | `VirasatDemo@2026` |

Registration is also open — evaluators can create a fresh account on `/register`.

## 5. How the six evaluation criteria are addressed

### 1. Code quality
Strict TypeScript throughout; a single shared contract module ([`lib/types.ts`](lib/types.ts)) keeps client and server in lockstep; one responsibility per module (`lib/ai`, `lib/auth`, `lib/db`, `lib/validation`); ESLint (`next/core-web-vitals` + `next/typescript`) and `tsc --noEmit` both pass; comments explain security/efficiency decisions rather than restating code.

### 2. Security
Documented in README → Architecture notes. Highlights: server-only API keys, bcrypt(12) password hashing, HS256 JWT sessions in httpOnly/sameSite cookies, edge middleware **plus** per-route session re-checks, user-id-scoped queries (incl. deletes), zod validation on every input, parameterized SQL via Drizzle, login rate limiting with uniform error messages (no account enumeration), open-redirect protection on the login `next` param, strict CSP + security headers.

### 3. Efficiency
~106 kB first-load JS; server components by default; DB-free cryptographic auth check in middleware; lazy pooled Postgres connections (`prepare: false` for serverless); **streaming** story generation for sub-second first paint of AI output; self-hosted fonts; zero external runtime origins.

### 4. Testing
Vitest suite in [`tests/`](tests/): unit tests (JWT session round-trips, bcrypt hashing, every zod validator, rate limiter, the Gemini client against a stubbed `fetch` including SSE-parsing across chunk boundaries and every error mapping), integration tests (API route handlers invoked with real `Request` objects — auth, validation, and error paths), and component tests (jsdom) for the shared a11y components. Run with `npm run test`.

### 5. Accessibility
Skip link, landmarks, one `h1`/page, labeled inputs with `aria-invalid`/`aria-describedby`, `role="alert"` errors, `aria-live` + `aria-busy` async regions, `role="status"` loading with visible text, keyboard operability with visible focus rings, AA contrast palette, `prefers-reduced-motion` support. Verified in server-rendered output during testing.

### 6. Problem statement alignment
The challenge asks for GenAI-powered discovery of Indian cultural experiences. Virasat's four core features map one-to-one: attraction **recommendations**, **hidden-gem** discovery, **storytelling** content for heritage promotion, and **local event/festival** suggestions — each an authentic cultural lens (crafts, cuisine, music, spirituality), each a live Gemini generation, with user preferences and saved collections persisted in Postgres to connect travelers with what they love.

## Anti-disqualification checklist (self-audit)

- [x] No static/hardcoded pages posing as AI output — all four features call Gemini live per request
- [x] No mock data presented as real — the only non-AI data shown is the user's own DB records
- [x] No hallucinated "AI" responses — outputs come exclusively from `lib/ai/client.ts` API calls; failures show honest errors
- [x] No demo-only behavior — same code path in demo and production; test credentials provided above
- [x] End-to-end tested: build ✅, typecheck ✅, lint ✅, automated tests ✅, manual flow-through of every feature ✅
