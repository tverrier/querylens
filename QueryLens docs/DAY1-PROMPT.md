# Day 1 Claude Code Prompt

## Pre-flight (do manually first)
1. `mkdir querylens && cd querylens`
2. Create Supabase project → note URL + anon key
3. Create Inngest account → note event key
4. Get Anthropic API key
5. Create GitHub repo

---

## Day 1 Scaffold Prompt — paste into Claude Code Agent/Composer mode

```
Build QueryLens: a full-stack PostgreSQL slow query analyzer.
Read CLAUDE.md, ARCHITECTURE.md, DATABASE.md, COMPONENTS.md before writing any code.

STACK: Next.js 14 App Router | TypeScript strict | Tailwind | Supabase Auth+DB | Inngest | Zod | D3.js v7 | Vercel

STEPS:

1. INIT
npx create-next-app@latest querylens --typescript --tailwind --app --no-src-dir
npm install @supabase/ssr @supabase/supabase-js inngest zod d3 @types/d3

2. STRUCTURE
Create all dirs and placeholder files from CLAUDE.md structure. Placeholder content: // TODO: implement

3. DESIGN TOKENS
Implement all CSS vars from COMPONENTS.md in globals.css.
Extend tailwind.config.ts with these as custom Tailwind colors (bg-primary, bg-secondary, bg-tertiary, bg-hover, border-default, border-bright, accent, accent-hover, accent-subtle, critical, warning, good, info + -subtle variants, text-primary, text-secondary, text-muted, text-accent).
Add all animations from COMPONENTS.md.

4. FONTS
Import Geist + Geist Mono from next/font/google in layout.tsx. Apply as CSS vars.

5. ENV
Create .env.local.example from CLAUDE.md env vars. Create .env.local (gitignored) with empty values.

6. SUPABASE CLIENTS
Implement lib/supabase/server.ts, client.ts, service.ts exactly from DATABASE.md.
Implement middleware.ts: protect /dashboard/* /analysis/* /history/*, allow / /login /share/*.

7. AUTH
app/(auth)/login/page.tsx: centered card, dark theme, "Continue with Google" + "Continue with GitHub" buttons, QueryLens wordmark.
app/(auth)/callback/route.ts: handle Supabase OAuth callback, redirect /dashboard on success, /login?error on fail.

8. TYPES
Implement types/index.ts with all types from DATABASE.md (AnalysisStatus, Bottleneck, TreeNode, QueryAnalysis).

9. MIGRATIONS
Copy migration SQL exactly from DATABASE.md into supabase/migrations/001_initial.sql, 002_sandbox.sql, 003_rate_limiting.sql.

10. API ROUTES
POST /api/analyze:
- Zod schema: { sql: z.string().min(1).max(10000) }
- Auth check → 401 if not authenticated
- Forbidden keywords check: INSERT UPDATE DELETE DROP CREATE ALTER TRUNCATE GRANT REVOKE → 400
- Rate limit check via check_rate_limit() (10/hour)
- Insert query_analyses record status:'pending'
- Send Inngest event 'analyze/query.submitted' with {analysisId, userId, sql}
- Return {analysisId, status:'pending'}

GET /api/analysis/[id]:
- Fetch by id, verify user owns it
- pending/processing: return {id, status}
- complete: return full QueryAnalysis object
- error: return {id, status, error_message}
- not found: 404

11. INNGEST
inngest.config.ts: Inngest client with event key.
app/api/inngest/route.ts: serve handler.
lib/inngest/functions/analyzeQuery.ts: event 'analyze/query.submitted', 4 step.run() skeletons (log only for now), update status:'complete' at end.

12. LANDING PAGE
app/page.tsx dark theme using design tokens:
- Navbar: QueryLens logo | GitHub link | Sign In
- Hero: "Stop guessing why your SQL is slow" | "Paste any PostgreSQL query. Get an AI-powered visual execution tree, bottleneck analysis, and optimized rewrite." | [Try Demo] [Sign Up Free →]
- Feature grid: 3 cards (Execution Tree, AI Analysis, Query Rewrites) with icons + descriptions
- Footer: GitHub | Built with Claude API
No lorem ipsum. Use real copy.

13. DASHBOARD SHELL
app/(dashboard)/layout.tsx: sidebar (Dashboard, History links), user email + avatar, Sign Out.
app/(dashboard)/dashboard/page.tsx: "Dashboard" heading, 4 placeholder stat cards, query editor placeholder textarea, "No analyses yet" empty state.

14. VERCEL CONFIG
vercel.json: { "functions": { "app/api/inngest/route.ts": { "maxDuration": 60 } } }
Add .env.local to .gitignore.

15. README
README.md: title, live demo badge placeholder, one-line description, tech stack table, local setup steps (placeholder), architecture diagram placeholder.

VERIFY BEFORE FINISHING:
✅ npm run dev starts with zero TypeScript errors
✅ localhost:3000 shows landing page
✅ /login shows auth page
✅ No `any` types anywhere
✅ All env vars in code exist in .env.local.example
✅ Middleware redirects unauthenticated /dashboard → /login

DO NOT implement D3 visualization (Day 4) or Claude API calls (Day 3) yet.
```

---

## After Day 1 Prompt Completes
1. Run migrations in Supabase SQL editor
2. Enable Google + GitHub OAuth in Supabase dashboard
3. Add env vars to Vercel
4. Push to GitHub, verify auto-deploy
5. Test full auth flow on live URL

---

## Day 2 Prompt
```
QueryLens Day 2: SQL Engine. Read CLAUDE.md + ARCHITECTURE.md first.

1. lib/sql/sandbox.ts — executeSandboxExplain(sql: string):
   - Use service role Supabase client
   - Prepend: EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)
   - Set search_path to sandbox schema
   - Hard 5s timeout (pg statement_timeout)
   - Read-only transaction
   - Throw SandboxTimeoutError | ExplainFailedError with typed messages

2. lib/sql/parser.ts — parseExplainOutput(explainJson): TreeNode
   - Recursively convert PostgreSQL EXPLAIN JSON → TreeNode tree
   - Extract: Node Type, Startup Cost, Total Cost, Plan Rows, Actual Rows, Actual Time, Index Name, Relation Name, Join Type, Filter
   - Assign unique id: `${counter}-${nodeType.replace(/ /g,'-').toLowerCase()}`
   - Compute severity per ARCHITECTURE.md rules
   - Recursively process Plans[] as children

3. __tests__/sql/parser.test.ts — 3 fixtures:
   - Fixture A: seq scan single table (no indexes) → expect critical severity
   - Fixture B: hash join two tables → expect warning or good
   - Fixture C: index scan with filter → expect good

4. lib/inngest/functions/analyzeQuery.ts — complete Steps 1+2:
   Step 1 (step.run): executeSandboxExplain → serviceClient update explain_output, status:'processing'
   Step 2 (step.run): parseExplainOutput → serviceClient update execution_tree
   On any error: serviceClient update status:'error', error_message

Verify: POST /api/analyze with "SELECT * FROM customers WHERE country='US'" → job completes → tree in DB ✅
```

---

## Day 3 Prompt
```
QueryLens Day 3: Claude API. Read PROMPTS.md carefully — copy prompts exactly, never paraphrase.

1. lib/claude/analyze.ts:
   - Export buildAnalysisPrompt(rawSql, executionTree, explainJson): string — exact from PROMPTS.md
   - Export buildFallbackPrompt(rawSql): string — exact from PROMPTS.md
   - Export analyzeExecutionPlan(rawSql, executionTree, explainJson): Promise<AnalysisResult>
     * POST to https://api.anthropic.com/v1/messages
     * model: claude-sonnet-4-20250514, max_tokens: 2000
     * system: system prompt from PROMPTS.md
     * Parse text content block, validate with AnalysisResponseSchema (Zod from ARCHITECTURE.md)
     * On Zod fail: retry once with buildFallbackPrompt
     * Return typed result

2. Complete Inngest Steps 3+4:
   Step 3: analyzeExecutionPlan → save ai_explanation, ai_bottlenecks, optimized_query, estimated_improvement, index_suggestions, planner_insights
   Step 4: update status:'complete', processing_time_ms

3. Test with all 3 demo queries from PROMPTS.md. Log full responses. Verify:
   - Valid JSON every time
   - nodeIds match tree nodes
   - optimizedQuery is valid SQL
```

---

## Day 4 Prompt
```
QueryLens Day 4: D3 Visualization. Read COMPONENTS.md carefully for exact specs.

1. components/visualization/ExecutionTree.tsx — "use client":
   Props: { tree:TreeNode, bottlenecks:Bottleneck[], onNodeClick:(n:TreeNode)=>void, selectedNodeId?:string }
   - d3.tree() layout, SVG rendering
   - Nodes: 160×64px rounded rect, severity bg colors from COMPONENTS.md
   - Node text: nodeType bold mono (top) | "Cost:X | Rows:X | Xms" muted (bottom)
   - Edges: d3.linkVertical() curved, --border color
   - Selected: accent border + glow effect
   - d3.zoom() pan/zoom | fit-to-screen button
   - Stagger entry animation: nodes fade in at index*50ms
   - Click → onNodeClick(node)
   - aria-label="[nodeType] cost:[X] rows:[X]" on each node

2. components/query/BottleneckCard.tsx — per COMPONENTS.md spec
3. components/query/OptimizedQueryPanel.tsx — manual line diff, no diff library
4. lib/hooks/useAnalysisPoller.ts — intervals [2000,5000,10000], MAX_DURATION 120000, MAX_POLLS 30
5. components/query/LoadingAnalysis.tsx — 4-step progress, pulse animation, aria-live
6. app/(dashboard)/analysis/[id]/page.tsx:
   - useAnalysisPoller → show LoadingAnalysis until complete
   - Two-panel: ExecutionTree (left 50%) | AI panel (right 50%)
   - State: selectedNodeId — clicking BottleneckCard sets it, clicking tree node scrolls+highlights card
   - Share button: copies ${APP_URL}/share/${analysis.share_token}

Verify: analysis page renders tree + bottlenecks + diff, clicking bottleneck highlights tree node ✅
```
