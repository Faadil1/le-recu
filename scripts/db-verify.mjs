#!/usr/bin/env node
/**
 * Read-only Neon readiness check. Does not log the connection string, role
 * password, application records or values from user data.
 * Does not create tables or apply migrations.
 */
import pg from "pg";

const value = process.env.DATABASE_URL?.trim();
if (!value) {
  console.error("[db:verify] BLOCKED: DATABASE_URL is not configured.");
  process.exit(1);
}
let parsed;
try {
  parsed = new URL(value);
} catch {
  console.error("[db:verify] BLOCKED: DATABASE_URL is invalid.");
  process.exit(1);
}
if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
  console.error("[db:verify] BLOCKED: expected a PostgreSQL connection URL.");
  process.exit(1);
}
if (!parsed.hostname.endsWith(".neon.tech")) {
  console.error("[db:verify] BLOCKED: staging verifier expects a Neon PostgreSQL host.");
  process.exit(1);
}
// SSL may be specified via the connection string or pg configuration.
// Neon connection URLs ordinarily carry sslmode=require.
if (!["require", "verify-full", "verify-ca"].includes(parsed.searchParams.get("sslmode") ?? "")) {
  console.error("[db:verify] BLOCKED: expected sslmode=require or stronger in DATABASE_URL.");
  process.exit(1);
}

const required = [
  "_migrations",
  "duels",
  "strikes",
  "action_limits",
];
const pool = new pg.Pool({ connectionString: value, max: 1, connectionTimeoutMillis: 8000 });
try {
  const { rows } = await pool.query(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_name = any($1::text[])`,
    [required],
  );
  const present = new Set(rows.map((r) => r.table_name));
  const missing = required.filter((name) => !present.has(name));
  if (missing.length > 0) {
    console.error("[db:verify] BLOCKED: missing schema objects:", missing.join(", "));
    process.exitCode = 1;
  } else {
    const { rows: migrations } = await pool.query(
      `select name from _migrations
       where name = any($1::text[])
       order by name`,
      [["0002_strikes.sql", "0003_duels.sql", "0004_action_limits.sql"]],
    );
    const applied = new Set(migrations.map((r) => r.name));
    const needed = ["0002_strikes.sql", "0003_duels.sql", "0004_action_limits.sql"];
    const pending = needed.filter((name) => !applied.has(name));
    if (pending.length > 0) {
      console.error("[db:verify] BLOCKED: required migrations not recorded:", pending.join(", "));
      process.exitCode = 1;
    } else {
      console.log("[db:verify] PASS: Neon reachable; duplex + room tables and required migrations present.");
      console.log("[db:verify] Note: persistence across deployments, multi-device operation and privacy remain unverified.");
    }
  }
} catch (error) {
  const known = error && typeof error === "object" && "code" in error ? error.code : "UNKNOWN";
  console.error("[db:verify] BLOCKED: read-only database verification failed; code:", known);
  process.exitCode = 1;
} finally {
  await pool.end();
}
