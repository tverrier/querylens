# Task Board

Paste the current day's section into Claude Code at session start to keep it focused.

---

## Day 1 — Foundation
- [ ] `npx create-next-app@latest querylens --typescript --tailwind --app --no-src-dir`
- [ ] `npm install @supabase/ssr @supabase/supabase-js inngest zod d3 @types/d3`
- [ ] Create all dirs/files from CLAUDE.md structure (placeholder `// TODO` files)
- [ ] Implement design tokens + typography in globals.css from COMPONENTS.md
- [ ] Extend tailwind.config.ts with CSS var colors
- [ ] Add Geist + Geist Mono fonts via next/font in layout.tsx
- [ ] Create .env.local.example from CLAUDE.md env vars
- [ ] Implement lib/supabase/client.ts, server.ts, service.ts from DATABASE.md
- [ ] Implement middleware.ts — protect /dashboard/* /analysis/* /history/*
- [ ] Implement app/(auth)/login/page.tsx — Google + GitHub OAuth buttons, dark themed
- [ ] Implement app/(auth)/callback/route.ts — handle OAuth, redirect to /dashboard
- [ ] Implement types/index.ts from DATABASE.md
- [ ] Create supabase/migrations/ files from DATABASE.md
- [ ] Scaffold POST /api/analyze — Zod validate, auth check, insert record, trigger Inngest, return {analysisId}
- [ ] Scaffold GET /api/analysis/[id] — return status or full object
- [ ] Implement inngest.config.ts + app/api/inngest/route.ts
- [ ] Scaffold lib/inngest/functions/analyzeQuery.ts — 4 step skeletons
- [ ] Implement app/page.tsx — full landing page with real copy, dark theme
- [ ] Implement app/(dashboard)/layout.tsx — sidebar + user avatar + sign out
- [ ] Implement app/(dashboard)/dashboard/page.tsx — shell with placeholder stats/editor
- [ ] Create vercel.json with inngest maxDuration:60
- [ ] Push to GitHub, connect Vercel, add env vars, confirm live URL

**Done when:** Live URL accessible, OAuth login works, lands on dashboard ✅

---

## Day 2 — SQL Engine
- [ ] Implement lib/sql/sandbox.ts — EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON), read-only tx, 5s timeout, forbidden keyword check, typed errors (SandboxTimeoutError, ExplainFailedError)
- [ ] Implement lib/sql/parser.ts — PostgreSQL EXPLAIN JSON → TreeNode tree with severity scoring per ARCHITECTURE.md rules
- [ ] Create __tests__/sql/parser.test.ts — 3 fixtures: seq scan, hash join, index scan
- [ ] Complete Inngest Step 1: runExplainAnalyze → save explain_output, update status:"processing"
- [ ] Complete Inngest Step 2: parseExecutionTree → save execution_tree
- [ ] Error handling: update status:"error" + error_message on any step failure

**Done when:** POST /api/analyze → job runs → parsed tree saved to DB ✅

---

## Day 3 — Claude API
- [ ] Implement lib/claude/analyze.ts with buildAnalysisPrompt() and buildFallbackPrompt() from PROMPTS.md
- [ ] Implement AnalysisResponseSchema (Zod) from ARCHITECTURE.md
- [ ] Retry logic: primary prompt → fallback on invalid JSON → status:"degraded" on second fail
- [ ] Complete Inngest Step 3: analyzeWithClaude → save all ai_* fields
- [ ] Complete Inngest Step 4: status:"complete", save processing_time_ms
- [ ] Test with all 3 demo queries from PROMPTS.md, verify structured output

**Done when:** Full pipeline runs end-to-end, AI results in DB ✅

---

## Day 4 — D3 Visualization
- [ ] Implement components/visualization/ExecutionTree.tsx per COMPONENTS.md — d3.tree(), severity colors, zoom/pan, stagger animation, click handler
- [ ] Implement components/query/BottleneckCard.tsx
- [ ] Implement components/query/OptimizedQueryPanel.tsx — manual line diff, copy buttons
- [ ] Implement lib/hooks/useAnalysisPoller.ts — escalating intervals per ARCHITECTURE.md
- [ ] Implement components/query/LoadingAnalysis.tsx — 4-step progress
- [ ] Implement app/(dashboard)/analysis/[id]/page.tsx — two-panel layout, bidirectional tree↔card highlight, share button

**Done when:** Analysis page renders interactive tree + AI panel + diff ✅

---

## Day 5 — Dashboard + History
- [ ] Implement DashboardStats component (4 cards)
- [ ] Implement QueryEditor component — Cmd+Enter, char count, loading state
- [ ] Wire dashboard: submit → create analysis → redirect to /analysis/[id]
- [ ] Add 3 quick-select demo query buttons on dashboard
- [ ] Implement app/(dashboard)/history/page.tsx — paginated, searchable
- [ ] Implement app/share/[token]/page.tsx — public read-only + sign-up CTA

**Done when:** Full user flow: login → submit → results → history → share ✅

---

## Day 6 — Polish + Launch
- [ ] Mobile responsive check (analysis page stack on <768px)
- [ ] Loading skeletons on all async content
- [ ] Empty states (new user)
- [ ] Toast notifications
- [ ] Favicon + meta tags + OG image
- [ ] Landing page live demo section (pre-loaded query, works without login)
- [ ] Seed sandbox DB to target row counts
- [ ] Write README.md (architecture diagram, setup instructions, live URL, screenshots)
- [ ] MIT license
- [ ] Tag v1.0.0

**Done when:** Live URL, public GitHub, README complete, demo works without login ✅

---

## Stretch Goals
- [ ] MySQL support
- [ ] GitHub repo SQL scanner
- [ ] VS Code extension
- [ ] Slack integration
- [ ] Query benchmark mode (100x run, latency distribution chart)
- [ ] Team workspaces

## Issues Log
| Issue | Status | Notes |
|---|---|---|
| | | |
