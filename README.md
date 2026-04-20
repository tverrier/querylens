# QueryLens

AI-powered PostgreSQL query analyzer. Paste a SQL query, get a visual execution plan, AI bottleneck analysis, and an optimized rewrite — all in seconds.

## Stack

- **Framework:** Next.js 14 (App Router), TypeScript (strict)
- **Auth:** Supabase Auth (Google + GitHub OAuth)
- **Database:** Supabase PostgreSQL with RLS
- **Jobs:** Inngest (async analysis pipeline)
- **AI:** Claude API (Sonnet 4.6)
- **Visualization:** D3.js v7
- **Styling:** Tailwind CSS

## How it works

```
User submits SQL → POST /api/analyze
  → Insert query_analyses row (status: pending)
  → Inngest event dispatched
  → Worker: EXPLAIN → parse tree → Claude AI analysis
  → Results saved, client polls until complete
  → D3 execution tree + AI bottleneck cards rendered
```

## Setup

1. Clone and install:
   ```bash
   git clone https://github.com/tverrier/querylens.git
   cd querylens
   npm install
   ```

2. Create a [Supabase](https://supabase.com) project and apply the three migrations from `docs/DATABASE.md` via the SQL Editor.

3. Enable Google and GitHub OAuth providers in Supabase Auth settings. Set the redirect URL to `https://<project-ref>.supabase.co/auth/v1/callback`.

4. Copy env vars:
   ```bash
   cp .env.example .env.local
   ```
   Fill in: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `TARGET_DATABASE_URL`.

5. Run:
   ```bash
   npm run dev          # Next.js dev server
   npm run inngest      # Inngest dev server (separate terminal)
   ```

6. Open `http://localhost:3000`, sign in, and analyze a query.

## Deploy to Vercel

1. Push to GitHub and import in Vercel.
2. Set all env vars from `.env.example`.
3. Register `/api/inngest` as your Inngest serve endpoint.
4. Update `NEXT_PUBLIC_SITE_URL` and OAuth redirect URLs to the Vercel URL.

## License

MIT
