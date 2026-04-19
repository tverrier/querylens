# Components & Design System

## Aesthetic
Dark theme. Industrial precision. Terminal-grown-up-with-a-UI.
Ref: Linear.app density + Vercel dark mode + code editor syntax coloring.

## Design Tokens (globals.css)
```css
:root {
  --bg-primary:#0a0a0f; --bg-secondary:#111118; --bg-tertiary:#1a1a24; --bg-hover:#1f1f2e;
  --border:#2a2a3d; --border-bright:#3d3d5c;
  --accent:#4f7cff; --accent-hover:#6b92ff;
  --accent-subtle:rgba(79,124,255,.12); --accent-glow:rgba(79,124,255,.25);
  --critical:#ff4757; --critical-subtle:rgba(255,71,87,.12);
  --warning:#ffa502; --warning-subtle:rgba(255,165,2,.12);
  --good:#2ed573; --good-subtle:rgba(46,213,115,.12);
  --info:#5352ed; --info-subtle:rgba(83,82,237,.12);
  --font-display:'Geist',system-ui,sans-serif;
  --font-mono:'Geist Mono','JetBrains Mono',monospace;
  --text-primary:#e8e8f0; --text-secondary:#8888aa; --text-muted:#55556a; --text-accent:#4f7cff;
}
h1{font-size:2.5rem;font-weight:700;letter-spacing:-.03em}
h2{font-size:1.75rem;font-weight:600;letter-spacing:-.02em}
h3{font-size:1.25rem;font-weight:600}
.mono{font-family:var(--font-mono)}
.stat-value{font-family:var(--font-mono);font-size:2rem;font-weight:700;letter-spacing:-.04em}
.page-enter{animation:fadeSlideUp .3s ease forwards}
@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.pulse{animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.tree-node{transition:transform .15s ease,box-shadow .15s ease}
.tree-node:hover{transform:scale(1.02)}
```
Extend tailwind.config.ts with these vars as custom colors.

## Components

### QueryEditor — `"use client"`
```typescript
interface QueryEditorProps { onSubmit:(sql:string)=>void; isLoading:boolean; defaultValue?:string }
// Full-width dark code editor | Geist Mono | CSS line numbers (no lib)
// Bottom bar: char count + "Analyze Query" button (spinner on loading)
// Cmd+Enter submits | min-h:160px max-h:400px resizable
// Border: 1px solid var(--border), accent glow on focus
```

### AnalysisStatusBadge
```typescript
interface StatusBadgeProps { status:'pending'|'processing'|'complete'|'error'|'degraded' }
// pending→gray dot "Queued" | processing→pulse blue "Analyzing..."
// complete→green "Complete" | error→red "Failed" | degraded→yellow "Partial"
```

### ExecutionTree — `"use client"` (D3 requires browser)
```typescript
interface ExecutionTreeProps { tree:TreeNode; bottlenecks:Bottleneck[]; onNodeClick:(n:TreeNode)=>void; selectedNodeId?:string }
// d3.tree() layout | SVG nodes: 160×64px rounded rect
// Node fill by severity: critical→critical-subtle+red glow | warning→warning-subtle+orange | good→good-subtle | default→bg-tertiary
// Node text: nodeType bold mono (top) | "Cost:X | Rows:X | Xms" muted (bottom)
// Edges: d3.linkVertical(), --border stroke, curved
// Selected: accent border + glow | Hover: scale(1.02)
// d3.zoom() pan+zoom | fit-to-screen button
// Entry: nodes stagger fade-in (index*50ms delay)
// Click → calls onNodeClick
// aria-label on each node for a11y
```

### BottleneckCard
```typescript
interface BottleneckCardProps { bottleneck:Bottleneck; isSelected:boolean; onClick:()=>void }
// Left border: 3px solid severity color | bg: severity-subtle
// Severity pill badge | title bold 14px
// Explanation: text-secondary 13px, 2-line clamp + "show more"
// Recommendation: mono smaller + copy button
// Selected: bright border + elevated shadow
```

### OptimizedQueryPanel
```typescript
// Split view: original SQL vs optimized SQL
// Diff: added lines green bg | removed lines red bg + strikethrough
// estimatedImprovement badge top-right (e.g. "~50x faster") in accent
// Copy button for optimized query
// Index suggestions: individual copyable code blocks
```

### DashboardStats
```typescript
// 4 stat cards: [Total Analyses] [This Week] [Avg Improvement] [Queries Optimized]
// bg-secondary | large mono number | small label | subtle icon top-right
// Hover: border → border-bright
```

### LoadingAnalysis
```typescript
// 4-step progress display with animated connecting line:
// ⚡ Running EXPLAIN ANALYZE → 🌳 Parsing tree → 🤖 Analyzing with AI → 💾 Saving
// Current step pulses | completed steps get green ✓
// Skeleton preview behind overlay | aria-live="polite"
```

## Page Layouts

### / (Landing)
```
NAVBAR: Logo | GitHub | Sign In
HERO: "Stop guessing why your SQL is slow" | [Try Demo] [Sign Up Free]
LIVE DEMO: QueryEditor (left) | D3 preview (right) — no sign-up required
3 FEATURE CARDS: Execution Tree | AI Analysis | Query Rewrites
FOOTER: GitHub | Built with Claude
```

### /analysis/[id]
```
NAVBAR: ← Back | Analysis ID | Share button
LEFT 50%: ExecutionTree (full height, zoomable)
RIGHT 50%: Summary card → BottleneckCards (click→highlights tree node) → OptimizedQueryPanel → IndexSuggestions
```

### /dashboard
```
NAVBAR + user avatar
STATS ROW (4 cards)
QUERY EDITOR (prominent, centered)
RECENT ANALYSES (last 5: SQL preview | status | time)
```

## Responsive
- Mobile <768px: analysis page stacks (tree top, panel bottom)
- Tablet 768-1024: 60/40 split
- Desktop >1024: 50/50 full-height tree

## A11y
- Keyboard nav on all interactive elements | 2px accent focus rings
- Severity: color + icon/label (never color alone)
- Min contrast 4.5:1 | aria-live on loading states
