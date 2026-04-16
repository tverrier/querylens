import { describe, it, expect } from "vitest";
import { validateQuery } from "./sandbox";

describe("validateQuery", () => {
  it("accepts a simple SELECT", () => {
    const r = validateQuery("select 1");
    expect(r.ok).toBe(true);
  });

  it("accepts WITH (CTE) queries", () => {
    const r = validateQuery("with t as (select 1) select * from t");
    expect(r.ok).toBe(true);
  });

  it("strips a trailing semicolon", () => {
    const r = validateQuery("select 1;");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.sql.endsWith(";")).toBe(false);
  });

  it("rejects empty input", () => {
    const r = validateQuery("   ");
    expect(r.ok).toBe(false);
  });

  it("rejects multi-statement queries", () => {
    const r = validateQuery("select 1; select 2");
    expect(r.ok).toBe(false);
  });

  it("rejects INSERT", () => {
    const r = validateQuery("insert into users (id) values (1)");
    expect(r.ok).toBe(false);
  });

  it("rejects UPDATE", () => {
    const r = validateQuery("update users set name = 'x' where id = 1");
    expect(r.ok).toBe(false);
  });

  it("rejects DELETE", () => {
    const r = validateQuery("delete from users where id = 1");
    expect(r.ok).toBe(false);
  });

  it("rejects DROP", () => {
    const r = validateQuery("drop table users");
    expect(r.ok).toBe(false);
  });

  it("rejects a DDL keyword hidden after SELECT", () => {
    const r = validateQuery("select 1; drop table users");
    expect(r.ok).toBe(false);
  });

  it("rejects pg_catalog access", () => {
    const r = validateQuery("select * from pg_catalog.pg_tables");
    expect(r.ok).toBe(false);
  });

  it("rejects information_schema access", () => {
    const r = validateQuery("select * from information_schema.tables");
    expect(r.ok).toBe(false);
  });

  it("does not trip on forbidden keywords inside string literals", () => {
    const r = validateQuery("select 'drop table users' as msg");
    expect(r.ok).toBe(true);
  });

  it("does not trip on forbidden keywords inside line comments", () => {
    const r = validateQuery("select 1 -- drop table users");
    expect(r.ok).toBe(true);
  });

  it("does not trip on forbidden keywords inside block comments", () => {
    const r = validateQuery("select 1 /* delete from users */");
    expect(r.ok).toBe(true);
  });

  it("rejects queries exceeding 50k characters", () => {
    const r = validateQuery("select " + "1,".repeat(30000) + "1");
    expect(r.ok).toBe(false);
  });

  it("rejects non-SELECT statements like SET", () => {
    const r = validateQuery("set search_path = public");
    expect(r.ok).toBe(false);
  });

  it("rejects BEGIN/transaction control", () => {
    const r = validateQuery("begin");
    expect(r.ok).toBe(false);
  });
});
