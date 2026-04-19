# Database

## Migrations

### 001_initial.sql
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE query_analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  raw_sql TEXT NOT NULL CHECK (char_length(raw_sql)<=10000),
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

CREATE INDEX idx_qa_user ON query_analyses(user_id);
CREATE INDEX idx_qa_created ON query_analyses(created_at DESC);
CREATE INDEX idx_qa_status ON query_analyses(status);
CREATE INDEX idx_qa_share ON query_analyses(share_token);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER qa_updated_at BEFORE UPDATE ON query_analyses FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE query_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_all" ON query_analyses FOR ALL USING (auth.uid()=user_id);
CREATE POLICY "share_select" ON query_analyses FOR SELECT USING (share_token IS NOT NULL);
CREATE POLICY "svc_update" ON query_analyses FOR UPDATE USING (auth.role()='service_role');
```

### 002_sandbox.sql
```sql
CREATE SCHEMA IF NOT EXISTS sandbox;
CREATE ROLE sandbox_reader NOLOGIN;
GRANT USAGE ON SCHEMA sandbox TO sandbox_reader;

CREATE TABLE sandbox.customers (id BIGSERIAL PRIMARY KEY, email TEXT NOT NULL, first_name TEXT, last_name TEXT, country TEXT DEFAULT 'US', created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE sandbox.products (id BIGSERIAL PRIMARY KEY, name TEXT NOT NULL, category TEXT, price NUMERIC(10,2), stock_qty INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE sandbox.orders (id BIGSERIAL PRIMARY KEY, customer_id BIGINT REFERENCES sandbox.customers(id), status TEXT DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','cancelled')), total_amount NUMERIC(10,2), created_at TIMESTAMPTZ DEFAULT now());
CREATE TABLE sandbox.order_items (id BIGSERIAL PRIMARY KEY, order_id BIGINT REFERENCES sandbox.orders(id), product_id BIGINT REFERENCES sandbox.products(id), quantity INT NOT NULL, unit_price NUMERIC(10,2), created_at TIMESTAMPTZ DEFAULT now());

GRANT SELECT ON ALL TABLES IN SCHEMA sandbox TO sandbox_reader;
-- Indexes intentionally omitted to produce slow queries for demos
-- Seed: customers 100k, products 10k, orders 500k, order_items 2M
```

### 003_rate_limiting.sql
```sql
CREATE TABLE rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, window_start TIMESTAMPTZ NOT NULL, count INT DEFAULT 1,
  UNIQUE(user_id, action, window_start)
);
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own" ON rate_limits FOR SELECT USING (auth.uid()=user_id);

CREATE OR REPLACE FUNCTION check_rate_limit(p_user_id UUID, p_action TEXT, p_max INT, p_window_min INT)
RETURNS BOOLEAN AS $$
DECLARE v_window TIMESTAMPTZ; v_count INT;
BEGIN
  v_window := date_trunc('hour',now()) + floor(extract(minute FROM now())/p_window_min)*(p_window_min||' minutes')::interval;
  INSERT INTO rate_limits(user_id,action,window_start,count) VALUES(p_user_id,p_action,v_window,1)
  ON CONFLICT(user_id,action,window_start) DO UPDATE SET count=rate_limits.count+1 RETURNING count INTO v_count;
  RETURN v_count<=p_max;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

## TypeScript Types
```typescript
// types/index.ts
export type AnalysisStatus = 'pending'|'processing'|'complete'|'error'|'degraded'

export interface Bottleneck {
  nodeId: string
  severity: 'critical'|'warning'|'info'
  title: string; explanation: string; recommendation: string
}

export interface TreeNode {
  id: string; nodeType: string; relationName?: string; alias?: string
  startupCost: number; totalCost: number; planRows: number
  actualRows?: number; actualTime?: number; loops?: number
  indexName?: string; joinType?: string; filterCondition?: string
  severity: 'good'|'warning'|'critical'
  children: TreeNode[]
}

export interface QueryAnalysis {
  id: string; user_id: string; raw_sql: string
  explain_output: Record<string,unknown>|null
  execution_tree: TreeNode|null
  ai_explanation: string|null; ai_bottlenecks: Bottleneck[]|null
  optimized_query: string|null; estimated_improvement: string|null
  index_suggestions: string[]|null; planner_insights: string|null
  status: AnalysisStatus; error_message: string|null
  share_token: string|null; processing_time_ms: number|null
  created_at: string; updated_at: string
}
```

## Supabase Clients
```typescript
// lib/supabase/server.ts — Server Components + API routes
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const c = cookies()
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { get: (n)=>c.get(n)?.value, set: (n,v,o)=>c.set({name:n,value:v,...o}), remove: (n,o)=>c.set({name:n,value:'',...o}) }
  })
}

// lib/supabase/service.ts — Inngest workers ONLY (bypasses RLS)
import { createClient as sc } from '@supabase/supabase-js'
export const serviceClient = sc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// WARNING: server-side only, never expose to client
```

## Common Queries
```typescript
// Recent analyses
supabase.from('query_analyses').select('id,raw_sql,status,estimated_improvement,created_at').eq('user_id',uid).order('created_at',{ascending:false}).limit(20)

// Poll status
supabase.from('query_analyses').select('id,status,error_message').eq('id',id).single()

// By share token (no auth)
supabase.from('query_analyses').select('*').eq('share_token',token).single()
```
