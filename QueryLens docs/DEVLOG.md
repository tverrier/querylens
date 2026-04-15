# Dev Log

Update as you build. This becomes your interview story.

## Format
```
### [DATE] Day N — [Focus]
Built: 
Decision: [choice] because [reason]
Blocker: 
Fixed: 
Hours:
```

---

### Day 1 — Foundation
Built:
Decision:
Blocker:
Fixed:
Hours:

### Day 2 — SQL Engine
Built:
Decision:
Blocker:
Fixed:
Hours:

### Day 3 — Claude API
Built:
Decision:
Blocker:
Fixed:
Hours:

### Day 4 — D3 Visualization
Built:
Decision:
Blocker:
Fixed:
Hours:

### Day 5 — Dashboard + History
Built:
Decision:
Blocker:
Fixed:
Hours:

### Day 6 — Polish + Launch
Built:
Decision:
Blocker:
Fixed:
Hours:

---

## Architecture Decisions

| Decision | Options | Choice | Reason |
|---|---|---|---|
| Background jobs | Celery/Redis vs Inngest | Inngest | No Redis infra, simpler, free tier |
| Auth | NextAuth vs Supabase | Supabase | Already using Supabase DB |
| SQL sandbox | Separate DB vs schema | Schema | Simpler, isolated with RLS |
| AI model | GPT-4 vs Claude | Claude | Better structured JSON output |
| Visualization | react-flow vs D3 | D3 | More control, stronger interview talking point |
