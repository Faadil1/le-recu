# LE REÇU — Duplex (research preview)

**Same desire. Two different prices.** A paper receipt becomes a real two-person, blind-by-interface decision: each participant chooses one of five costs they refuse to pay. Only after the second browser commits does the single duplex receipt reveal both answers.

**Branch status:** DRAFT / DO NOT MERGE. Product integration is coded; production deployment, live third-party participation, screenshot QA, retention and anti-abuse are NOT yet proven.

## Running locally

```bash
npm ci
npm run dev
```

Visit port **8080**. Without `DATABASE_URL`, development uses local in-memory PGLite and all shared data disappears when the server restarts. A **production** server deliberately refuses to create or read a duel without persistent PostgreSQL: deploy with a correctly configured `DATABASE_URL` and all migrations applied (including `0003_duels.sql`). Never call an ephemeral deployment a persistent social community.

```bash
npm run typecheck
npm run test:product
npm run build
```

`npm test` is the inherited full Grok workspace suite. Some scaffold tests require `.grok/skills/` files that are absent from this public repository; that legacy test failure is tracked separately and MUST NOT be disguised as proof of application correctness. The product-specific contract tests and typecheck/build are enforced by `.github/workflows/product-ci.yml`.

## The actual duel

1. One of eight authored public desires produces the same five-cost set for that UTC day, regardless of how the participant opens the preset.
2. The first participant refuses one cost and presses **Sceller mon choix**. The server creates a random opaque duel identifier and retains the creator's choice privately.
3. The next tap **Envoyer le défi** shares only an unanswered prompt and a URL such as `?duel=<UUID>`. The teaser, link and URL preview contain no choice index.
4. A separate browser with a different local token opens the invitation, sees the same five immutable choices, and independently commits a selection.
5. The server atomically accepts **one responder**; both known participants can see a duplex double-imprint, share the written result or produce an original 4:5 PNG.
6. The creator uses **Vérifier la réponse** to fetch the committed result. Unknown visitors to a finished duel see no private choices.

This is **blind-by-interface with server-held state**, not a cryptographic guarantee that one physical human could never use two browsers. Browser tokens are pseudonymous and can be cleared; not real identity verification.

The initial durable duel only supports the eight preset desires: open-text custom desires are local and deliberately never enter public duel storage or room aggregates.

## Room / votes

A browser token is limited to one strike per desire/day by a SQL uniqueness constraint, **not one person**. For public preset receipts, `dailySeedFor()` enforces the same cost-index mapping across daily and manual entry. Stale receipts are not silently counted in the current day's tally. A server with no durable database is an **ephemeral local preview**, not a community. Do not describe counts as representative polling.

## Live-production blockers

- Configure a real shared PostgreSQL database; verify migration and first-write, cross-device read, restart, concurrency and multi-instance persistence.
- Add server-side rate limits, anti-abuse and idempotency beyond the current per-duel atomic responder commit. Browser tokens alone don't prevent sockpuppets.
- Define documented retention/deletion, consent and safe handling of browser pseudonyms; duel IDs expire after **72 hours for new responses**, but **database rows are not yet automatically deleted**.
- Browser QA: Chrome/Safari mobile, keyboard, reduced motion, visual export / share-sheet fallback, exact runtime ↔ commit binding, safe expired/duplicate/broken links.
- Run uncoached two-person pilot; no viral/organic-usage, public-rollout, operational economics or final concept-lock claim before real evidence.

## Where the load-bearing logic lives

| Module | Responsibility |
| --- | --- |
| `src/lib/receipt.ts` | authored cost set, daily canonical seed, safe teaser |
| `src/lib/duel-contract.ts` | participant-specific view, hides choices before commitment |
| `src/lib/duel.functions.ts` | create / read / one atomic responder submission |
| `src/lib/duel-image.ts` | original two-person PNG |
| `src/components/duplex-result.tsx` | second physical ink impression |
| `src/components/receipt-app.tsx` | mobile receipt, links, participation and error recovery |
| `src/lib/room.functions.ts` | limited daily per-browser tally |
| `migrations/0003_duels.sql` | durable duel schema when PostgreSQL is configured |
| `research/LE-RECU-IMPLEMENTATION-RECEIPT-2026-10-08.md` | truth/evidence/debt and next checks |

Further exploratory research: [draft Product Design audit PR #1](https://github.com/Faadil1/le-recu/pull/1). It is deliberately independent from this build PR.
