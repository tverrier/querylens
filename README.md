# QueryLens

Next.js 14 app that analyzes SQL queries: runs EXPLAIN, gets an AI walkthrough, and proposes an optimized rewrite. Built with Supabase auth + Postgres, Inngest for background jobs, and Tailwind.

## Stack
- Next.js 14 (App Router) + TypeScript
- Supabase: Google & GitHub OAuth, Postgres, RLS
- Inngest: background analysis jobs
- Tailwind CSS
- OpenAI (optional) for explanations

## Setup

1. `cp .env.example .env.local` and fill in values.
2. Create a Supabase project. In the dashboard:
   - Auth → Providers: enable Google + GitHub, set redirect URL to `${NEXT_PUBLIC_SITE_URL}/auth/callback`.
   - SQL Editor: run `supabase/schema.sql`.
3. Inngest: create an app, grab event + signing keys.
4. Install & run:
   ```bash
   npm install
   npm run dev
   # in another terminal
   npm run inngest
   ```

## Flow

1. User signs in at `/login` (OAuth → `/auth/callback` → session cookie).
2. Middleware (`src/middleware.ts`) protects `/dashboard` and `/analysis/*`.
3. Dashboard posts SQL to `/api/analyze`, which inserts a `query_analyses` row and sends an `query/analyze.requested` event to Inngest.
4. The Inngest function `analyzeQuery` runs EXPLAIN (stubbed), asks OpenAI for an explanation + optimized query, and updates the row.
5. `/analysis/[id]` polls `/api/analysis/[id]` every 2s until status is `completed` or `failed`.

## Deploy to Vercel

- Push to GitHub, import in Vercel.
- Set env vars (see `vercel.json`).
- Add `/api/inngest` as your Inngest serve endpoint in the Inngest dashboard.
- Update `NEXT_PUBLIC_SITE_URL` and Supabase OAuth redirect URL to the Vercel URL.
