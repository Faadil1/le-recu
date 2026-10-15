# LE REÇU — Beta Operator Runbook (not production)

**Goal:** Enable a small number of external users to test a real Neon-backed Duplex, with bounded writes and a documented stop switch. Operators must not mistake these controls for a fully proven public product.

## Environments

- External-read Beta Preview: `le-recu-invite-beta`, Vercel project `prj_MPbGX4nAIIlLSvuhm3eK8UJUAcJI`, stable branch-preview alias `le-recu-invite-beta-git-build-duplex-b-ec73a7-faadil1s-projects.vercel.app`. Vercel Authentication is disabled **only** here.
- Owner-protected internal Preview: `le-recu-duplex-preview`, project `prj_qQKX0cUEcuiRnppPX0XXRGlU8rsj`; remains protected.
- Neon database `neondb`, project `broad-sunset-79790814`, branch `le-recu-staging` / `br-shy-field-b425j1zd`. The separate Neon branch named `production` is never used.
- Production deployments have an executable fail-closed reality check and intentionally cannot be promoted yet.

## Daily safe operating checks

Run read-only in **Neon staging**; NEVER print raw `creator_token`, `responder_token`, `strikes.token`, or `DATABASE_URL`.

```sql
-- Successful and unfinished challenges
SELECT COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE responder_line IS NOT NULL)::int AS completed,
       COUNT(*) FILTER (WHERE responder_line IS NULL)::int AS pending,
       COUNT(*) FILTER (WHERE responder_line IS NULL
                         AND expires_at_ms < extract(epoch FROM now())*1000)::int AS expired
FROM duels;

-- Global action budgets: inspect only the GLOBAL pseudonym.
SELECT scope, day, used
FROM action_limits
WHERE actor_key = 'GLOBAL'
ORDER BY day DESC, scope
LIMIT 30;
```

The stored browser token is **not unique human identity**. Room tally is one browser pseudonym per desire per day **only after explicit opt-in**. Do not call it a representative poll.

## Current ceilings (UTC-day shared database)

- Create: 6 actions per browser, 60 total.
- Reply: 25 per browser, 240 total.
- Room opt-in vote: 8 per browser, 300 total (SQL uniqueness prevents repeat token/day/desire).
- Failed requests may consume slots. These global write budgets limit spend, but **do not stop all request flooding or token reset/sockpuppeting**. If usage suddenly spikes, do not raise limits before reviewing logs, economic exposure, and abuse.

## Data/consent truth

A sealed duel persists a predefined desire, one choice, timestamp, random browser token and later the second choice. The shared URL has a random UUID but no secret decision. Browser token is a bearer pseudonym, not login.
- Reply validity: 72 hours after creation.
- Data retention: **not automatically purged yet**; creator or responder can explicitly delete the whole duel and invalidate the link. Local browser history is separate; deleting the duel only removes the current matching local item in the acting browser.
- Optional public room contribution stores a separate vote; erasing the duel **does not erase that vote**. This remaining gap blocks production.
- Do not collect unrestricted sensitive free-text wishes, and do not claim automatic deletion. UI discloses known behavior.
- Keep `X-Robots-Tag: noindex, nofollow, noarchive`, `Referrer-Policy: no-referrer`, and `robots.txt` while Beta is non-production.

## Incident stop / recovery

1. In a confirmed abuse, privacy or billing incident, **restore deployment protection on the isolated external-beta Vercel project**, restricting Preview; do not disable the backend PRD gate or touch internal protected Preview.
2. Inspect Vercel logs and the **aggregate** SQL above. Do not publish pseudonymous tokens/duel IDs.
3. If required, disable the Preview `DATABASE_URL` using secure project settings to fail closed, but this also breaks legitimate reads; document the outage.
4. Never run mass destructive SQL without explicit owner authorization and a reviewed retention/delete plan. A user-initiated participant `eraseDuel` operation is already implemented.
5. Re-open only after reproduction on staging, reviewed fixes, actual negative/recovery checks and clear communication to affected users.

## Product Depth promotion blockers

A readable beta page and even successful automated external A→B→PNG→delete runs do **not** demonstrate:
- independent uncoached human use and voluntary return; invite→open→reply conversion;
- guaranteed scheduled retention, room-vote deletion, complete privacy consent;
- full failure matrix and race/expiry/storage-absent recovery;
- read-path rate limits / strong abuse controls / IP-level throttling;
- real operator dashboard with auth, metrics, cleanup jobs and one-click recovery;
- full bilingual accessibility/performance/device QA, immutable public shared origin, OG preview checks;
- genuine A→B→C chain propagation and meaningful sustained value.

Proceed with independent testers on the external beta, **not a general public release**. Keep PR #2 DRAFT, the full 42-gate registry ACTIVE and `product:release-check` intentionally failing.
