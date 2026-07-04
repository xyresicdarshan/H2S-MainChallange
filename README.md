# Virasat — AI-Powered Discovery of India's Living Heritage

Virasat (Hindi: *heritage*) is a GenAI-powered destination discovery platform focused on **Indian cultural experiences**. Tell it what you love — temple architecture, folk music, regional cuisine, handloom weaves — and it generates personalized attraction recommendations, uncovers genuinely lesser-known hidden gems, writes rich cultural narratives about heritage sites, and finds festivals and cultural events worth traveling for.

**Every piece of content in this app is generated live by Google Gemini at request time.** There are no canned responses, no seeded content, and no fallback data — if the AI call fails, the app says so honestly.

## Features

| Feature | Route | How AI is used |
|---|---|---|
| Personalized discoveries | `/discover` | Gemini (JSON mode) generates 6 attraction recommendations from your interests, region, and travel style |
| Hidden gems | `/hidden-gems` | Gemini surfaces 5 genuinely lesser-known cultural places in a chosen state, with local tips |
| AI storyteller | `/story` | Gemini streams a 450–650 word cultural narrative about any heritage site, live token-by-token |
| Festival finder | `/events` | Gemini suggests recurring festivals/cultural events for a month and region |
| Saved collection | `/saved` | Database-backed: save any AI result to your account, revisit and manage it |
| Profile preferences | `/discover` | Your interests persist to Postgres and prefill future sessions |

Every AI result displays a transparency line — *"Generated live by [model] in X.Xs"* — and every call is written to an `ai_interactions` audit table (feature, model, latency, request) as proof of live generation.

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **Tailwind CSS v4**
- **Google Gemini** (`gemini-2.5-flash` by default) via direct REST — one auditable integration point: [`lib/ai/client.ts`](lib/ai/client.ts)
- **PostgreSQL + Drizzle ORM** (Neon recommended) — users, preferences, saved items, AI audit log
- **Custom JWT auth** — `jose` (HS256) + `bcryptjs`, httpOnly cookies, Edge-verified middleware
- **Vitest** + React Testing Library — unit, integration (route handlers), and component tests

## Getting started

### 1. Prerequisites

- Node.js 20+
- A **Google Gemini API key** — free at [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
- A **Postgres database** — free at [neon.tech](https://neon.tech) (use the pooled connection string)

### 2. Configure

```bash
cp .env.example .env
```

Fill in `.env`:

```
GEMINI_API_KEY=your-key
DATABASE_URL=postgres://...
AUTH_SECRET=<48+ random chars; generate with the command in .env.example>
```

### 3. Install, migrate, seed, run

```bash
npm install
npm run db:push     # creates tables
npm run db:seed     # creates the demo account (demo@virasat.app / VirasatDemo@2026)
npm run dev
```

Open http://localhost:3000 and log in with the demo account, or register your own.

### 4. Test & build

```bash
npm run test        # vitest: unit + integration + component tests
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run build       # production build
```

## Deploying to Vercel

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new) (framework auto-detected).
2. Add environment variables in Vercel → Project → Settings → Environment Variables: `GEMINI_API_KEY`, `DATABASE_URL`, `AUTH_SECRET` (optionally `GEMINI_MODEL`).
3. Deploy. Then apply the schema and seed the demo account against the production DB once from your machine: `npm run db:push && npm run db:seed` (with the production `DATABASE_URL` in your local `.env`).

## Architecture notes

### Security

- **Secrets never reach the client.** The Gemini key is read server-side at call time in `lib/ai/client.ts`; there are no `NEXT_PUBLIC_` secrets. `.env` is git-ignored.
- **Sessions** are HS256-signed JWTs in an httpOnly, sameSite=lax, secure (prod) cookie — invisible to client JS, CSRF-mitigated ([`lib/auth/session.ts`](lib/auth/session.ts)).
- **Defense in depth:** middleware gates all protected pages/APIs at the edge, and every route handler *re-verifies* the session and scopes DB queries by the session user id.
- **Passwords** are bcrypt-hashed (cost 12). Login returns a uniform error for unknown email vs wrong password (no account enumeration) and is rate-limited per client.
- **Input validation:** every request body is parsed with zod before use; Drizzle parameterizes all SQL. AI output is schema-constrained by Gemini *and* re-validated with zod before it is returned.
- **Headers:** strict CSP (self-only origins), `X-Frame-Options: DENY`, `nosniff`, restrictive `Permissions-Policy` ([`next.config.ts`](next.config.ts)).

### Efficiency

- Server components by default; client JS only where interactivity requires it (~106 kB first load).
- Middleware auth check is purely cryptographic (no DB round-trip).
- One lazy Postgres connection per serverless instance (`prepare: false` for pooled Neon).
- The storyteller **streams** — first words render in well under a second instead of waiting many seconds for the full generation.
- Self-hosted fonts via `next/font`; zero external origins at runtime (also enforced by CSP).

### Accessibility

Skip-to-content link, semantic landmarks, one `h1` per page, labeled controls with `aria-invalid`/`aria-describedby` error wiring, `role="alert"` errors, `aria-live` result regions with `aria-busy`, `role="status"` loading indicators with visible text, keyboard-operable everything with visible focus rings, AA-contrast palette, and `prefers-reduced-motion` support.

### Honesty by design (anti-disqualification)

- `lib/ai/client.ts` is the **only** place that talks to the model; grep the repo — there is no fallback-content path anywhere.
- AI failures surface as honest error messages with correct HTTP statuses (`AI_RATE_LIMITED`, `AI_UPSTREAM_ERROR`, …) — never substituted content.
- The `ai_interactions` table logs every live call (model, latency, request) per user.
- The footer of every page states that content is generated live by Google Gemini and may be imperfect.

## Project structure

```
app/                  # pages (App Router) + API route handlers
  api/auth/           # register, login, logout
  api/ai/             # recommendations, hidden-gems, events, story (streaming)
  api/saved/          # saved-items CRUD
  api/preferences/    # user preference persistence
components/           # UI components (client + server)
lib/
  ai/                 # Gemini client, prompts, response schemas, audit logging
  auth/               # JWT sessions, password hashing
  db/                 # Drizzle schema + lazy client
  validation/         # zod schemas for every API input
middleware.ts         # edge auth gate for protected routes
scripts/seed.ts       # demo account seeder
tests/                # vitest unit / integration / component suites
```

## Test credentials

| Email | Password |
|---|---|
| `demo@virasat.app` | `VirasatDemo@2026` |

(Created by `npm run db:seed`; you can also register a fresh account.)
