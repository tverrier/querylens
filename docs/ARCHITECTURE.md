# Architecture

## Pipeline
```
POST /api/analyze
  → validate (Zod) + auth check + rate limit
  → insert query_analyses (status:pending)
  → send Inngest event: analyze/query.submitted
  → return {analysisId, status:"pending"} immediately

Inngest worker (lib/inngest/functions/analyzeQuery.ts):
  Step 1: EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) on sandbox DB → save explain_output
  Step 2: parse raw plan → TreeNode tree → save execution_tree
  Step 3: Claude API → structured JSON → save ai_* fields
  Step 4: status:"complete", processing_time_ms

Client polls GET /api/analysis/[id] every 2s → renders on complete
```

## Routes
```
/                   public landing
/login              Supabase OAuth (Google, GitHub)
/dashboard          submit queries, recent analyses, stats
/analysis/[id]      D3 tree (left) + AI panel (right)
/history            paginated all analyses
/share/[token]      public read-only view
```

## SQL Sandbox (SECURITY CRITICAL)
- Isolated schema: `sandbox` with read-only role `sandbox_reader`
- Pre-seeded tables: customers(100k), products(10k), orders(500k), order_items(2M)
- Hard 5s query timeout
- Forbidden keywords check before execution:
```typescript
const FORBIDDEN = ['INSERT','UPDATE','DELETE','DROP','CREATE','ALTER','TRUNCATE','GRANT','REVOKE']
```
- Indexes intentionally omitted from sandbox tables to produce interesting slow queries

## TreeNode Model
```typescript
interface TreeNode {
  id: string
  nodeType: string        // "Seq Scan", "Hash Join", etc.
  relationName?: string
  startupCost: number; totalCost: number
  planRows: number; actualRows?: number
  actualTime?: number     // ms
  loops?: number
  indexName?: string; joinType?: string; filterCondition?: string
  severity: 'good'|'warning'|'critical'
  children: TreeNode[]
}
// Severity rules:
// critical: Seq Scan rows>100k | actualRows/planRows>10x
// warning:  Seq Scan rows>10k  | Hash Batches>1 (disk spill)
// good:     Index Scan | Bitmap Index Scan
```

## Claude API Shape
```typescript
{
  model: "claude-sonnet-4-6-20250416",
  max_tokens: 2000,
  system: SYSTEM_PROMPT,   // from PROMPTS.md
  messages: [{role:"user", content: buildAnalysisPrompt(tree,sql,explainJson)}]
}
// Validate response with Zod. On fail → retry with buildFallbackPrompt()
// Second fail → status:"degraded"
```
Zod schema:
```typescript
z.object({
  summary: z.string().max(500),
  bottlenecks: z.array(z.object({
    nodeId: z.string(), severity: z.enum(['critical','warning','info']),
    title: z.string(), explanation: z.string(), recommendation: z.string()
  })).min(1).max(5),
  optimizedQuery: z.string(),
  estimatedImprovement: z.string(),
  indexSuggestions: z.array(z.string()),
  plannerInsights: z.string()
})
```

## Polling
```typescript
// lib/hooks/useAnalysisPoller.ts
intervals: [2000, 5000, 10000]  // escalate after 10s, 30s
MAX_DURATION: 120000
MAX_POLLS: 30
```

## Error Codes
```
INVALID_SQL       query failed validation
SANDBOX_TIMEOUT   exceeded 5s
EXPLAIN_FAILED    PostgreSQL rejected query
AI_UNAVAILABLE    Claude API failed after retry
PARSE_FAILED      could not parse execution plan
```
Inngest retries each step 3x with exponential backoff.

## Performance Targets
landing TTFB <200ms | dashboard load <1s | submit→job <500ms | analysis 8-15s | D3 render <100ms

## Security Checklist
- [ ] Supabase middleware on all /dashboard/* /analysis/* /history/* routes
- [ ] RLS on all tables
- [ ] Sandbox: read-only role + keyword check + timeout
- [ ] Zod validation all API inputs
- [ ] Rate limit /api/analyze: 10/hour/user
- [ ] No PII in client error responses
- [ ] Share tokens: 32-char random hex
