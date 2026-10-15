## Verified Neon setup receipt — 2026-10-09 UTC

**OBSERVED through the connected Neon project**, not a simulated or local database.

- Project ID: `broad-sunset-79790814` — Neon project `le-recu`, AWS `aws-us-east-2`, PostgreSQL 18.
- Production branch: `br-square-tooth-b42e0mc2` / `production`; schema empty and **untouched**.
- Staging branch: `br-shy-field-b425j1zd` / `le-recu-staging`, created explicitly from the empty production parent and confirmed `ready`.
- Database: `neondb` (Neon's initial database). No new database or live-user data was created.
- Migration transaction on staging: **APPLIED** exact `migrations/0002_strikes.sql` and `migrations/0003_duels.sql` from build branch as discrete SQL statements, with an atomic `_migrations` ledger. Original multi-command prepared-statement attempt was rejected and retried as a transaction with individually separated statements.
- Read-only verification: three tables `_migrations`, `duels`, `strikes` exist. Ledger holds `0002_strikes.sql`, `0003_duels.sql`.
- Schema inspection: `duels` unique id and responder pair constraints; `strikes` unique (day, desire, token) and line bounds. Both application tables contain **zero rows**.
- Production branch tables remain empty after staging migration, confirming branch isolation.
- No credentials retrieved or printed. No `DATABASE_URL` added to GitHub, GitHub Actions or Vercel. No deployed runtime or cross-device result is claimed.
- `readDuel` server function now uses POST instead of GET to avoid putting browser bearer tokens into query URLs.

### Actual next gate

Choose the intended connected Vercel account for a new isolated `le-recu` Preview project. Then securely provision its `DATABASE_URL` **for the staging Neon branch only** and deploy the exact GitHub build branch, verify runtime↔commit and the complete two-device flow. Neon already contains the schema, so a normal Vercel build must not re-run migrations.

**Neon CLI onboarding prompt note:** the generated `npm i -g neon; neon login; neon link --branch production; neon config init; neon deploy` is a generic template. It is not required to connect an existing Node/React application to server-side PostgreSQL. Avoid linking or deploying `production` for staging experiments. Use the connected Neon tools and isolated staging branch as actually verified above.

---

# Neon PostgreSQL — isolated staging contract

Status: **STAGING PREPARATION ONLY** (2026-10-08). No Neon branch, database, secret, Vercel project, runtime or external participant has been created/configured by this document.

## Required authorization / locator

Neon connector is available, but **project discovery and project creation are not exposed**. The connection requires a **Neon project ID**, e.g. the non-secret `project_id` from Neon Console → Project settings / project URL. Do not ask the owner to paste any database password, connection string, API key or secret in chat.

Once project ID is supplied:
1. `describe_project(project_id)` and `list_branches(project_id)` to identify intended scope, capabilities, and whether a dedicated branch already exists.
2. Select/create **`le-recu-staging`** branch within the authorized Neon project, using a development-only empty schema where possible. Branching clones the parent's data by default: **never branch from an existing sensitive production database**. If only sensitive/prod databases exist, stop and request a fresh empty Neon project instead of copying real records.
3. Obtain Neon pooled connection string with `get_connection_string` in a secure tool session; do **not** surface it in responses, GitHub files, screenshots, commit bodies or CI logs.
4. Only after selecting the verified dedicated staging branch: run `npm run db:migrate` with a temporary, scoped `DATABASE_URL`. Build has been changed to pure `npm run build` and will never migrate implicitly.
5. Independently call `npm run db:verify` read-only. Verify schema objects `_migrations`, `strikes`, `duels` and recorded migration names `0002_strikes.sql`, `0003_duels.sql`.
6. Configure `DATABASE_URL` as a **server-only** Preview secret in the chosen Vercel project/account. Limit Preview environment to the intended non-main deployment branch; no secrets in `VITE_` prefixed keys or files. Do not write a password into `vercel.json`, `.grok/app-env.json`, README or CI.
7. Deploy the isolated branch and record commit SHA ↔ deployment URL; then test two real browser contexts + data durability over a separate cold-start / deployed instance.
8. Add rate limits, consent & retention process and abuse validation before a public launch. No self-reported live/community/viral claims until independently observed.

## Deployment and economics

- Code: `build/duplex-blind-duel-v1` / draft PR #2. `main` remains unchanged.
- Vercel install: `npm ci` with build dependencies; build: `npm run build`, no migration side effects.
- Neon: pooled Postgres connection through `pg`, SSL-requiring URL expected.
- Database migrations: explicit, separately reviewed `npm run db:migrate`.
- Tables: `strikes` (aggregate room), `duels` (server-held challenge and reply), `_migrations` (migration ledger).
- Expiration: new duel replies stop after 72h; rows are **not auto-deleted**. Implement retention and deletion before any public promotion.
- Failure boundary: in production, no Neon URL means both the duel and public room cannot create false live results (fail closed).
- User must choose a specific Vercel account (two connected accounts exist). **No account was selected**; no deployment requested or claimed.

## Staging acceptance gates (all pending until done)

| Gate | Status |
| --- | --- |
| Neon project ID identified and ownership verified | BLOCKED |
| Dedicated empty/data-safe staging branch | BLOCKED |
| Secret safely delivered into Preview env | BLOCKED |
| Schema migrations completed in intended branch | BLOCKED |
| Read-only Neon schema verifier | CODED / NOT EXECUTED |
| DB persistence / concurrent answers / idempotency | BLOCKED |
| Cross-device live duel | BLOCKED |
| Vercel Preview deployment and commit binding | BLOCKED |
| CI typecheck / product test / build | CI ON BRANCH — check exact final head |
| Public release / merge | NOT AUTHORIZED |

Do not use the temporary in-process PGLite fallback as evidence for persistent Neon behavior.
