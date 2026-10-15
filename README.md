# LE REÇU — Duplex (research preview)


> **PRODUCT DEPTH & LIVE REALITY — RELEASE BLOCKED.** The existing Neon staging duet demonstrates one real load-bearing A→B outcome, **not** a publicly operable product. Production requires live external journeys, failure/recovery, privacy, abuse handling, operator capability, stable onboarding and meaningful post-duel depth. Art, screenshots, deterministic demos, Vercel READY and CI success cannot waive this requirement. See [Full Live Product PRD](product/LE-RECU-LIVE-PRODUCT-PRD-V1.md) and [Conditional Gate Registry](product/LIVE-PRODUCT-REALITY.json).

```bash
npm run product:check          # truthful registry integrity; allows blocked staging work
npm run product:release-check  # fails until mandatory production claims are LIVE-proven
```

Production-targeted Vercel builds run the release check **before** bundling and intentionally fail closed while release criteria are unproven. Preview builds remain available for development, with no automatic promotion from `main`.


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

**Staging + Neon:** `npm run build` does not mutate any database. Apply migrations only when pointed at the intended isolated Neon staging branch using `npm run db:migrate`, then run `npm run db:verify`. Never put a Neon `DATABASE_URL` into a committed file. Preview runtime gets the credential solely as a server-side secret in the chosen host. Do not use a production/main Neon branch for trials.

```bash
# Only after selecting the correct Neon staging branch and setting DATABASE_URL:
npm run db:migrate
npm run db:verify
```

`npm test` is the inherited full Grok workspace suite. Some scaffold tests require `.grok/skills/` files that are absent from this public repository; that legacy test failure is tracked separately and MUST NOT be disguised as proof of application correctness. The product-specific contract tests and typecheck/build are enforced by `.github/workflows/product-ci.yml`.

## Duplex V1.1 — French / English + share artwork

The experience now has a persistent **FR / EN** switch near the top of the receipt. A fresh visitor can start in their browser's French or English locale; an explicit choice is stored locally. Sharing a challenge carries only the selected *display language* via `?lang=en|fr`, never a translated cost ID or a participant's decision.

- All authored category labels, five-cost titles and explanations, eight preset desires, buttons, pending/expired/recovery states, room captions, history, blind invitation and completed-duel copy are translated.
- The **stored desire key is always the same canonical French value** (e.g. `partir`). Cost IDs, UTC-day seed, integer refusal index and server transaction remain unchanged. Two people can independently play the same challenge in different languages without diverging results or tally cohorts.
- The 1080 × 1350 PNG export follows the viewer's language. Both rejected costs are struck in red; the outcome is split into two short lines **inside** the stamp; the closing line asks a question intended to invite further participation.
- The English version is authored copy, not machine translation at request time. Test translation integrity with `npm run test:product`. Changing locale never writes another duel or vote.
- **Known limitation:** server-rendered Open Graph cards are still baseline French until per-locale server metadata/assets are added. Client-side document language/title/description and native sharing text follow the chosen language. Do not advertise fully localized social previews yet.
- Preview deployments stay Vercel-auth protected. New invitation links omit the temporary Vercel access grant intentionally; a recipient needs their own authorized preview access. This is a staging constraint, not intended production UX.

## Proven versus pending

**Observed live:** one real, completed two-browser duel in Neon staging, with distinct browser pseudonymous tokens and an iOS 4:5 PNG share-sheet recording. One such completion proves neither distinct human identities nor demand.  
**Still required:** fresh bilingual participant walkthroughs, real iOS screenshot/PNG and Android verification after V1.1 redeploy, keyboard and reduced-motion test, larger/edge-case copy fitting, no misleading room statistics, rate limits/retention and approved public sharing flow. No merge or public promotion.

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
