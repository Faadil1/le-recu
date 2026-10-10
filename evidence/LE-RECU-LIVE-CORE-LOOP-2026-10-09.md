# LE REÇU — Live Staging Core Loop Receipt

Observed on: 2026-10-09. This document is a **staging-only** truth record, not a production or unique-human claim.

## Real, grounded proof

- User-supplied iPhone recording and exported 1080 × 1350 image displayed a finished `partir` duplex choice: `dix-huit mois` versus `l'air stable`. The iOS share-sheet was opened with the produced image. Visual evidence remains in the project conversation, not re-hosted as personal media in GitHub.
- Neon project `broad-sunset-79790814`, isolated branch `br-shy-field-b425j1zd` (`le-recu-staging`) is the durable server-held record. Schema: `duels` and `strikes`.
- Read-only SQL at review time confirmed exactly **3 created duels, 1 completed, 2 waiting**. The completed record has two different **browser-token strings** and responder timestamp within the creator's issued TTL. No participant tokens, link identifiers, or user personal data are recorded here.
- These observations confirm at least one actual server-persisted A→B decision loop, not a replay/static-only demo. They do **not** establish different human individuals, repeat reliability, production behavior, or paid/organic adoption.

## 2026-10-09 follow-up read-only Neon query

```sql
SELECT count(*)::int AS total,
       count(*) FILTER (WHERE responder_line IS NOT NULL)::int AS completed,
       count(*) FILTER (
         WHERE responder_line IS NOT NULL
           AND responder_token <> creator_token
           AND responded_at_ms BETWEEN created_at_ms AND expires_at_ms
       )::int AS distinct_token_valid_completions
FROM duels;
```

Observed result:

```text
total=3; completed=1; distinct_token_valid_completions=1
```

**Truth boundary:** `LIVE / STAGING / ONE VERIFIED LOOP`, not `LIVE_PRODUCTION`, not `2 people verified`, and not `viral`. Do not promote any release-blocking production gate using this file alone.

## What remains unproven

Public zero-coaching onboarding; stable share URL without Vercel Preview Authentication; strong permission/abuse controls; consent/retention/deletion; external participants; repeat runs and concurrency/failure recovery; bilingual mobile export after new revisions; operator observability; cost under load and time-to-first-value.

When a new revision claims those features, record a new runtime SHA + external observation and update the gate registry only with appropriate production-scoped evidence.
