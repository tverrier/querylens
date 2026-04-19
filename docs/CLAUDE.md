# QueryLens — Master Context

SQL query analyzer: EXPLAIN ANALYZE → D3 execution tree + Claude AI bottleneck analysis + optimized rewrite.
Deploy target: Vercel + Supabase.

## Stack (canonical, no deviations)
| Layer | Tech |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Styling | Tailwind CSS + CSS vars (COMPONENTS.md) |
| Auth | Supabase Auth — Google + GitHub OAuth only |
| DB | Supabase PostgreSQL + RLS on every table |
| Jobs | Inngest (async analysis pipeline) |
| AI | Claude API `claude-sonnet-4-20250514`, JSON only |
| Viz | D3.js v7 |
| Deploy | Vercel, auto-deploy from main |

## Project Structure
```
querylens/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (auth)/callback/route.ts
│   ├── (dashboard)/layout.tsx
│   ├── (dashboard)/dashboard/page.tsx
│   ├── (dashboard)/analysis/[id]/page.tsx
│   ├── (dashboard)/history/page.tsx
│   ├── api/analyze/route.ts
│   ├── api/analysis/[id]/route.ts
│   ├── api/inngest/route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/
│   ├── query/QueryEditor.tsx
│   ├── query/QueryResults.tsx
│   ├── query/QueryHistory.tsx
│   ├── visualization/ExecutionTree.tsx
│   └── visualization/TreeNode.tsx
├── lib/
│   ├── supabase/client.ts
│   ├── supabase/server.ts
│   ├── supabase/service.ts
│   ├── inngest/client.ts
│   ├── inngest/functions/analyzeQuery.ts
│   ├── sql/parser.ts
│   ├── sql/sandbox.ts
│   ├── claude/analyze.ts
│   └── utils.ts
├── types/index.ts
├── supabase/migrations/
├── inngest.config.ts
├── middleware.ts
└── .env.local.example
```

## DB Schema (core table)
```sql
CREATE TABLE query_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_sql TEXT NOT NULL,
  explain_output JSONB, execution_tree JSONB,
  ai_explanation TEXT, ai_bottlenecks JSONB,
  optimized_query TEXT, estimated_improvement TEXT,
  index_suggestions JSONB DEFAULT '[]',
  planner_insights TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','error','degraded')),
  error_message TEXT,
  share_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  processing_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE query_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON query_analyses FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "share" ON query_analyses FOR SELECT USING (share_token IS NOT NULL);
CREATE POLICY "svc" ON query_analyses FOR UPDATE USING (auth.role()='service_role');
```

## Env Vars
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
INNGEST_EVENT_KEY=
INNGEST_SIGNING_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Rules
- No `any` types ever
- Server Components by default; `"use client"` only for D3/forms
- Error boundary + loading state on every async op
- All DB calls via `lib/supabase/` only
- All Claude calls via `lib/claude/analyze.ts` only
- Never expose service role key client-side
- Never use pages/ router
- async/await only, no .then()
- Zod on all API inputs
- Named exports for components, default for pages

## Reference Files
- ARCHITECTURE.md — data flow, sandbox, error handling
- PROMPTS.md — Claude API prompts (canonical)
- DATABASE.md — full migrations, types, queries
- COMPONENTS.md — design system, component specs
- TASKS.md — day-by-day task board
