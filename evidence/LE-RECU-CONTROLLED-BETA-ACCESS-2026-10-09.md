# LE REÇU — Controlled Public Beta Access, LIVE Reality Ledger

Date verified: 2026-10-09 (EDT) / 2026-10-10 UTC  
**Scope:** external-readable isolated Vercel Preview + real Neon staging. **NOT** a production promotion, finished product, paid service, measured adoption or successful uncoached A→B test.

## Isolated infrastructure

| Surface | Value |
| --- | --- |
| Main account | `faadil1's projects` |
| Original protected preview | `le-recu-duplex-preview` (unchanged, retains Vercel authentication) |
| New external beta | `le-recu-invite-beta` |
| Project ID | `prj_MPbGX4nAIIlLSvuhm3eK8UJUAcJI` |
| Stable beta Git branch alias | `https://le-recu-invite-beta-git-build-duplex-b-ec73a7-faadil1s-projects.vercel.app/` |
| Beta Preview deployment ID | `dpl_GAT5pGYSAiVM3P6CJ2jaNGTZLhUc` |
| Exact deployed source SHA | `2ffb3020bc7b59173348d2dfa8443e91ba1593ea` |
| Neon project/branch | `broad-sunset-79790814` / `br-shy-field-b425j1zd` (`le-recu-staging`) |
| Neon database | `neondb`; `DATABASE_URL` encrypted / Preview only |
| Production | **BLOCKED** by executable Product Reality gate |

The beta project's Vercel Authentication setting is intentionally disabled **on this project only**, not the existing original project. Vercel's API accidentally classified its first deploy as production despite a Preview request; the code's `VERCEL_ENV=production` release gate correctly caused that build to fail. A second build was created as an actual Vercel Preview and reached `READY`. No successful production deployment was created.

## Truthful external access observation

An independent external web extraction of the beta Preview hostname and the **stable Git branch alias** returned the actual LE REÇU / THE RECEIPT text and privacy disclaimer, without a Vercel team login or `_vercel_share` bypass token. The separate owner-authorized Vercel fetch returned HTTP 200. This is **LIVE EXTERNAL READ / PREVIEW**, not proof of a browser-correct invitation, API write, deletion, or third participant.

## Neon staging and quota evidence

- Migration `0004_action_limits.sql` applied to **staging only** and recorded in `_migrations`. Table `action_limits` exists with an atomic unique key `(scope, day, actor_key)`; Neon production has no such table.
- Limit policy, per UTC day: `duel-create` **6 per pseudonymous browser / 60 total**, `duel-reply` **25 / 240**, `room-strike` **8 / 300**.
- Real Neon SQL test ran inside a rolled-back savepoint: a unique test action counter returned 1 on first call, 2 on second and **no rows** when capped at 2; savepoint rolled back and a subsequent query confirmed zero retained test rows.
- No live beta participant usage existed in new quota table at initial verification. Previously observed staging data remains: **3 duels / 1 completed** from the earlier session.
- Quotas are genuine shared Postgres write ceilings, **not personhood verification, guaranteed anti-DoS, IP protection or general read-rate limiting**. Repeated browser token resetting can evade per-browser quotas but not the global ceiling. The two-row actor/global budget is not a single ACID transaction; denial can consume an actor slot. Cost/load behavior needs live monitoring.
- `castStrike` is no longer automatically called when a cost is chosen. Room contributions require an explicit voluntary button.
- `eraseDuel` allows either actual browser participant to delete an existing shared duel server-side, with a confirmation UX. No browser E2E deletion proof yet. The other person's link then becomes invalid. This does **not** delete a separately opted-in room vote.

## Important privacy limitation

Duel reply validity expires after 72 hours, but **database retention is currently open-ended until participant deletion**; there is no guaranteed scheduled purge, durable user account or full privacy-control workflow. The beta UI explicitly discloses this before sealing/responding. Only eight authored wishes may be stored in shared duels; custom intimate free text stays local. This small beta must remain limited, monitored and **NOT represented as public-production ready**.

## Acceptance still BLOCKED

1. A true outsider opens a **new** ordinary invitation using the stable beta alias, sees five costs uncoached and commits a second decision; A independently observes the correct persisted outcome on the same hostname.
2. Neon readback shows `action_limits` increments only after actual actions; verify limit violation / user-facing response and retries after commit.
3. Test duplicate reply race, expired/refused/forged links, network timeout recovery, cold-start, mixed FR/EN, owner/respondent erasure and room opt-in.
4. Add guaranteed retention/deletion schedule (not a periodic best-effort sweep), full consent/privacy copy, read-rate limiting, revocation/abuse investigation and operator recovery before full production.
5. Test A→B→C continuation plus real return value and uncoached comprehension; no adoption or virality claims from owner-led testing.
6. Measure performance, accessibility, device image exports and mobile usability. Build gates remain ACTIVE, release stays BLOCKED.

Do not confuse successful external **HTML GET** with end-to-end live product verification. Keep PR #2 **DRAFT / DO NOT MERGE** and old verified deployments unchanged.
