# Prompts (Canonical)

All Claude API calls go through `lib/claude/analyze.ts`. Never write prompts inline.

## System Prompt
```
You are QueryLens, an expert PostgreSQL performance engineer.
Analyze SQL execution plans and return ONLY valid JSON — no markdown, no preamble, no code fences.
Expertise: query planner, indexes (B-tree/GIN/GiST/partial), join algorithms, seq vs index scan tradeoffs, statistics, buffer/disk spill analysis, query rewriting.
```

## buildAnalysisPrompt(rawSql, executionTree, explainJson)
```typescript
export function buildAnalysisPrompt(rawSql: string, executionTree: TreeNode, explainJson: object): string {
  return `Analyze this PostgreSQL query and execution plan. Return ONLY the JSON below, no other text.

SQL: ${rawSql}

EXPLAIN JSON: ${JSON.stringify(explainJson)}

Execution Tree: ${JSON.stringify(executionTree)}

Return:
{
  "summary": "one sentence — primary performance problem",
  "bottlenecks": [{
    "nodeId": "must match a node id in execution tree",
    "severity": "critical|warning|info",
    "title": "max 8 words",
    "explanation": "2-3 sentences, specific row counts and costs",
    "recommendation": "1-2 sentences, include exact SQL for indexes"
  }],
  "optimizedQuery": "complete rewritten SQL",
  "estimatedImprovement": "e.g. '10-50x faster' or '~80% cost reduction'",
  "indexSuggestions": ["CREATE INDEX ..."],
  "plannerInsights": "1-2 sentences on estimate accuracy and stats health"
}
Rules: bottlenecks 1-5 items | optimizedQuery valid PostgreSQL | nodeId must match tree | critical=seq scan large table or bad row estimate | warning=suboptimal join or missing index`
}
```

## buildFallbackPrompt(rawSql) — use if primary returns invalid JSON
```typescript
export function buildFallbackPrompt(rawSql: string): string {
  return `You are a PostgreSQL expert. Return ONLY this JSON, no other text:
{
  "summary": "likely performance issues",
  "bottlenecks": [{"nodeId":"unknown","severity":"warning","title":"Performance concern","explanation":"...","recommendation":"..."}],
  "optimizedQuery": ${JSON.stringify(rawSql)},
  "estimatedImprovement": "Unable to estimate without execution plan",
  "indexSuggestions": [],
  "plannerInsights": "Run EXPLAIN ANALYZE for detailed statistics"
}
SQL: ${rawSql}`
}
```

## Demo Queries (preload on landing page)
```sql
-- Demo 1: N+1 / missing index
SELECT * FROM orders o
WHERE o.customer_id IN (SELECT id FROM customers WHERE country='US')
ORDER BY o.created_at DESC;
-- Expected: seq scan on orders(2M rows), missing idx on customer_id

-- Demo 2: Missing composite index
SELECT p.name, COUNT(oi.id), SUM(oi.quantity)
FROM products p
JOIN order_items oi ON p.id=oi.product_id
JOIN orders o ON oi.order_id=o.id
WHERE o.status='completed' AND o.created_at > NOW()-INTERVAL '30 days'
GROUP BY p.id, p.name ORDER BY 3 DESC LIMIT 20;
-- Expected: seq scan orders(500k), needs (status,created_at) composite index

-- Demo 3: Hash join spill
SELECT c.email, COUNT(o.id)
FROM customers c LEFT JOIN orders o ON c.id=o.customer_id
GROUP BY c.id, c.email HAVING COUNT(o.id)>5;
-- Expected: Hash Batches>1, spilling to disk
```

## Tuning Notes
- Generic advice → reduce tree depth to top 3 levels or add "focus on nodes with totalCost>100"
- Invalid JSON → append "verify JSON is valid before responding" or use fallback
- Bad nodeIds → add explicit node ID list to prompt
- Token budget: prompt ~800-1200t, response ~600-900t, max_tokens=2000 (never lower)
