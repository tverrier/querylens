export type SandboxResult =
  | { ok: true; sql: string }
  | { ok: false; reason: string };

const FORBIDDEN_KEYWORDS = [
  "insert",
  "update",
  "delete",
  "drop",
  "truncate",
  "alter",
  "create",
  "grant",
  "revoke",
  "vacuum",
  "reindex",
  "copy",
  "call",
  "do",
  "merge",
  "comment",
  "cluster",
  "lock",
  "refresh",
  "reset",
  "set",
  "security",
  "listen",
  "notify",
  "unlisten",
  "begin",
  "commit",
  "rollback",
  "savepoint",
];

const FORBIDDEN_SCHEMAS = ["pg_catalog", "information_schema", "pg_toast"];

function stripCommentsAndStrings(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/"(?:[^"]|"")*"/g, '""');
}

export function validateQuery(rawSql: string): SandboxResult {
  const trimmed = rawSql.trim().replace(/;+\s*$/, "");
  if (!trimmed) return { ok: false, reason: "Query is empty." };
  if (trimmed.length > 50_000) return { ok: false, reason: "Query exceeds 50k characters." };

  const scrubbed = stripCommentsAndStrings(trimmed).toLowerCase();

  if (scrubbed.includes(";")) {
    return { ok: false, reason: "Multiple statements are not allowed." };
  }

  if (!/^\s*(select|with|explain|table|values)\b/.test(scrubbed)) {
    return { ok: false, reason: "Only SELECT / WITH / VALUES / TABLE queries are allowed." };
  }

  for (const kw of FORBIDDEN_KEYWORDS) {
    const re = new RegExp(`\\b${kw}\\b`);
    if (re.test(scrubbed)) {
      return { ok: false, reason: `Forbidden keyword: ${kw.toUpperCase()}.` };
    }
  }

  for (const schema of FORBIDDEN_SCHEMAS) {
    if (scrubbed.includes(`${schema}.`)) {
      return { ok: false, reason: `Access to ${schema} is not allowed.` };
    }
  }

  return { ok: true, sql: trimmed };
}
