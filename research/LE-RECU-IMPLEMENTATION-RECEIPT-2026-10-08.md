# LE REÇU — Duplex V1 Implementation & Evidence Ledger

Date: 2026-10-08  
Branch: `build/duplex-blind-duel-v1`, from `main@b1de5ff549f553e269244754dab57f0bfcd79484`  
Scope: code + local contract regression and CI, not production rollout.  
Product Design audit: [PR #1](https://github.com/Faadil1/le-recu/pull/1), separate.

## Design delta

The single-screen receipt is preserved. A deliberate **SEAL → INVITE → INDEPENDENT COMMIT → DUPLEX REVEAL** sequence replaces the former publicly decoded hash payload. The second ink impression lives on the very same receipt. Actual sharing artwork is produced with a client-side 4:5 Canvas export of the committed choices (not a screenshot of prototype chrome).

## Implementation facts from branch code (not runtime proof)

1. `duel.functions.ts` creates opaque UUIDs, stores first selection server-side, accepts a single responder with an atomic conditional SQL update, and exposes participant-limited choice views via `duel-contract.ts`. Known participant tokens permit a completed result; anonymous visitors do not receive a response payload.
2. `migrations/0003_duels.sql` adds server-held duel state. Expiry for new answers is 72 hours. No automated erasure job yet; **TTL means reply validity, not deletion**.
3. `receipt-app.tsx` handles incoming `?duel=` links, creator state, independent respondent state, retries, expired/closed display, result printing and explicit second tap to preserve native mobile share activation.
4. `receipt.ts` uses one deterministic daily seed for all entry paths; `room.functions.ts` refuses to insert current-day votes associated with stale/mismatched catalogue seeds. This fixes the known mismatched-label aggregation path for the eight canonical presets.
5. `duel-image.ts` exports a 1080 × 1350 original PNG based on two committed decisions; `duplex-result.tsx` renders the physical double impression and avoids animation when reduced motion is requested.
6. Only eight predefined public desires are accepted into durable duels. Freely written sensitive/private desires remain client-local, by policy.
7. Production backend refuses shared duels if `DATABASE_URL` is absent; no deployed-PGlite “community” claim.

## Known limitations and decisions

- **Browser token ≠ authenticated person.** Ownership/responder claims are per browser credential; malicious people can bypass anti-sybil constraints.
- **Opaque ≠ tamper-proof personhood.** No token is placed in public invitations, but a user with multiple browser identities can self-respond; no assertion of fully cheat-proof social proof.
- **Duel export still needs device/browser testing.** Some native share sheets may not accept images; downloader fallback exists in code, unverified on mobile.
- **The duel's final artifact is private to the two browsers.** Sharing to a third party sends a static PNG or clear textual result, not a public result URL.
- **No backend for unrestricted free text.** Deliberate until moderation, privacy, retention and consent are solved.
- **No real external participant proof.** A green CI check is not a cross-device user test.
- **Scaffold test debt:** inherited `npm test` looks for excluded `.grok/skills` fixtures, producing unrelated failures in public repo CI. `npm run test:product` is the focused app regression suite; preserve and surface this distinction rather than claiming the whole legacy suite passed.

## Conditional gateway register (product-level projection, not central policy replacement)

| Gateway / rule | Status | Current evidence or blocker |
| --- | --- | --- |
| Macro lifecycle QUALIFY → DECIDE → DESIGN → DELIVER → AUDIT → EXPAND | ACTIVE | In DELIVER/AUDIT on feature branch; EXPAND not authorized |
| Pre-Build Reality / negative event | ACTIVE | Same desire, divergent refused costs is still user hypothesis |
| Competitive Novelty / Kill | ACTIVE | Adjacent comparison/dilemma apps identified; exhaustive collision not proven |
| PRD / Product Decision | ACTIVE | Design audit and this scoped delta; comprehensive living PRD still needed before feature expansion |
| Technical Reality Check | ACTIVE | Typecheck and product CI; browser, DB concurrency and runtime pending |
| Truth Boundary | ACTIVE | Known implementation ≠ live behavior; visitor intention UNKNOWN |
| Negative Path REFUSE / ABSTAIN / REVIEW / UNKNOWN | ACTIVE | Invalid, expired, claimed invite states in code; runtime verification pending |
| Evidence Integrity LIVE / LOCAL / SIMULATED etc | ACTIVE | Code committed; no real external user/production receipts |
| Runtime / Commit Binding | BLOCKED | No deployed duplex runtime with bound SHA |
| Live Core Loop | BLOCKED | Actual second browser commit and persistence not observed |
| Load-Bearing Integration | BLOCKED | Real persistent PostgreSQL + multi-device tests missing |
| Time to First Value | BLOCKED | No measured participant results |
| Operational economics / abuse | ACTIVE | Rate-limit, storage costs, monitoring, moderation and deletion pending |
| Deterministic Demo | N/A | Replay secondary; cannot replace human response |
| Eval-Driven Reliability | ACTIVE | Unit contract tests implemented; actual server trajectory regressions pending |
| Creative / TRACE design assurance | ACTIVE | Mobile, export, reduced-motion and original artifact need browser and human review |
| External/user comprehension | BLOCKED | No independent two-person pilot |
| Judge/Share Performance | ACTIVE | Image created in code; OG and actual sharing not verified |
| Auth / privacy / consent | ACTIVE | Client token only; strong identity absent; deck-only data minimization |
| x402, nanopayments, wallets, contracts, LIVE_GATEWAY | N/A | Not part of this product; reactivate if its purpose changes |
| Naming / brand clearance | BLOCKED | “LE REÇU” remains working name, not cleared or locked |
| Production / promotion | BLOCKED | Must not merge based on CI alone |

Every other inherited canonical gate remains registered in central project policy and activates conditionally. This document does not relax any existing system rule.

## Exact next action

1. **CI:** record typecheck + `test:product` + build result and commit SHA; disclose failing legacy sandbox suite separately.
2. **Preview:** deploy an isolated staging server connected to a test Postgres database, bind exact branch/SHA, not production `main`.
3. **Cross-device:** A creates a preset invitation, B opens URL and commits unseen, A refreshes/checks, each result matches actual SQL; test separate physical devices and browser contexts.
4. **Abuse & negatives:** creator self-opening, third browser, forged/expired/replayed invite, double responder race, stale day at UTC boundary, absent DB, lost storage, network outage/retry.
5. **Visual:** actual iPhone mobile 390px, Android and desktop, keyboard, reduced-motion, PNG export, native share sheet and social unfurl previews.
6. **Production hardening:** abuse protection, storage cleanup, privacy/consent, observability and real cohort stats, then pilot as independently preregistered in PR #1.
7. **Product exploitation:** once first real pair succeeds, go beyond technical proof into repeat-value, meaningful recipient experience, choice quality, invitations, varied creative outcomes, truthful analytics, economics and organic sharing. No automatic final declaration.

Until verified, keep PR **DRAFT / DO NOT MERGE**. Do not change or merge Day 20/V4.
