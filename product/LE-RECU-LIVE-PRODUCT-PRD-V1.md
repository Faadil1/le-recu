# LE REÇU — Full Live Product PRD / Operational Acceptance Contract

State: **ACTIVE / NO CONCEPT LOCK / NO PRODUCTION PROMOTION**  
Source of truth for gates: [LIVE-PRODUCT-REALITY.json](./LIVE-PRODUCT-REALITY.json)  
Product promise: **a person's decision has a hidden cost; two people can reveal how differently they price the same desire, keep a meaningful record, and optionally start a real conversation or chain.**

This is **not** a mockup competition, a postcard generator, a static Day Challenge scene, a replay engine, or a benchmark-only build. Original art may make the product unforgettable, but is subordinate to a load-bearing live core.

## Governing rules

1. **Vertical Slice = entry point; never Definition of Done.** One live two-browser duel on Neon staging is a concrete milestone, not launch quality or adoption.
2. **LIVE is scoped.** Mark server-observed staging behavior `LIVE/STAGING`, a passing TypeScript or unit test `LOCAL_VERIFIED`, screenshots `VISUAL`, mocks `SIMULATED`; never silently promote one to another.
3. **Real consequences are required.** State changes survive process restarts, browser navigation and two users; conflicts, retries, duplicate messages and negative events have explicit correct outcomes.
4. **The system of record is authoritative.** Neon persists issued challenges, creator/respondent commitments and timestamps; no front-end-generated outcomes can impersonate a server receipt.
5. **Real user and operator surfaces matter.** “User can click share” does not prove invite delivery, open, conversion or actual sharing. A production product needs privacy, abuse response, durable observability and recovery.
6. **Maximum justified exploitation.** Keep exploring meaningful product depth *after* the first real slice, with no arbitrary cap on concepts. Judge each by user value, causality, differentiation and costs, not by quantity or cosmetic wow.
7. **Release requires evidence.** `npm run product:check` audits the registry; `npm run product:release-check` must fail until all mandatory production gates have real external observations and reviewed approval. Vercel builds marked `VERCEL_ENV=production` enforce this preflight in `npm run build`. Preview builds remain available for development.

## Actual user / operator journeys

| Actor | Complete value sequence | Durable consequence | Failure + recovery acceptance |
| --- | --- | --- | --- |
| Creator | Choose an authored wish → inspect five actual costs → refuse one → seal → invite | Unique opaque server challenge, immutable wish/seed and hidden creator refusal | Invalid/old seed offers new receipt without silently substituting costs; failed create does not show “sent” |
| Recipient | Open a stable URL without an insider bypass → see the same five costs → commit independently | One atomic second choice, creator choice hidden before commit | Expired/refused/replayed link gives honest state and usable new round; duplicate concurrent response never overwrites |
| Both people | See identical **first/second** ordering → compare → share or copy an accessible artifact | Same causal result for both browsers, with no third-party role data leak | Client reload/browser retry retrieves own view; guest cannot read private result |
| Returning reader | Revisit own receipts, meaningfully compare prior choices, optionally originate a fresh independent challenge | Durable, consented history (not merely local browser cache) | Data export and deletion; handle lost token/device plainly, not silently expose someone else's archive |
| Third participant | Receive independently shareable new invitation from B after A→B, answer blind and optionally continue | Track a genuine A→B→C continuation without reusing the first pair's secret | Stale/blocked/hidden social previews do not leak private refusal; do not claim real conversion from share-sheet opening |
| Operator | Observe service health, safe counts, abuse, cleanup, complaints and cost limits | Auditable operational state and deletion activity | Retry / rate-limit / revoke / purge with accountable outcomes, no manual SQL reliance for routine care |

The returning-reader and operator flows **are targets, not existing features**. Do not claim they're built because a `loadHistory()` local cache exists.

## Priority order: genuine product depth before visual promotion

### P0 — external playable loop and safe access

- Establish one stable public-beta domain with coherent origin and browser credentials (existing per-deployment Vercel hostnames change token scope). Deploy a fresh **isolated** environment bound to a reviewed SHA; prevent automatic product promotion from Preview.
- A recipient opening an ordinary invite must reach the first unanswered decision without ChatGPT coaching or a Vercel bypass. Choose public access controls appropriate to an opt-in beta, not unrestricted publication of private receipts.
- Preserve the sealed first choice, one atomic responder, 72-hour reply expiry and correct same/different outcome. No false “delivered” acknowledgment from a copied text or OS share dialog.
- Test A→B using two ordinary devices, browser back/refresh, a closed app, and a server cold-start. Compare actual Neon records before/after.

### P0 — negative, abuse, safety, and privacy

- Add **server-side** request rate limiting per coarse actor/IP/session within privacy constraints. Browser-generated hex tokens alone permit repeat persons and sockpuppets.
- Replace faux representative room stats with explicitly defined *browser participation* count and denominator. Show “insufficient data” for tiny cohorts; never treat participant counts as humans or population statistics.
- Implement expiry **and deletion** (they are currently different), transparent retention, opt-in for public listing, a revoke/delete route and consent for any public metrics. Do not store or publish free-text intimate statements automatically.
- Exercise missing/invalid/expired invites, wrong browser, double submission race, network loss after server commit, storage disabled, query-language changes, UTC-midnight cost rotation, suspended Neon branch and DB outage. Each outcome has an explicit recovery path.
- Add minimal operator view/jobs (protected and authorized) for state, failures, rate limits, cleanup/retention and rollback; track durable results, not screenshots.

### P1 — meaningful post-duel value

- **Conversation:** optional, private and consented discussion prompt that references the *difference* in refused costs; no enforced confession and no public user text by default.
- **Return value:** durable opt-in personal receipt history across authorized sessions, comparisons over time, export and deletion. The current local history isn't a cross-device account.
- **Chain:** B starts a *new* canonical challenge after A→B; C answers independently. Chain events must come from real server interactions with clear consent, not synthetic “XX people continued”.
- **Content variety:** expand the authored wish/cost catalogue only after testing emotional clarity, translation equivalence and safety across FR/EN; do not turn an intimate comparison into repetitive AI-generated clichés.

### P1 — social/reliability proof

- Build the actual browser-openable invitation behind shared social media previews. OG text must not reveal creator selection before the recipient commits; never embed protected staging credentials in receipts or QR codes.
- Measure genuine invitation→open→commit→compare→continuation and time-to-first-value from server-confirmed events; differentiate user/browser/session, denominators and unknown attribution.
- Execute repeated database-backed tests and a small **independent, uncoached** pilot including at least one FR→EN and EN→FR pair. Record errors, recovery, comprehension and if a recipient *voluntarily* starts a new challenge.
- Check load, spend under abuse, expiry cleanup, cold start, accessibility, reduced motion, exports, and failure with dependency down.

### P2 — exceptionally memorable full experience (must remain causal)

- Design an overarching visual universe rather than decorating a single artifact: invitation, cost selection, seal, uncertain wait, duplex reveal, intimate reply, archive, collective room and next challenge each deserve a distinct **meaningful** visual/interaction state.
- Thematic materials (ivory paper, decisive red ink, typography, stamps, perforation, motion and sound) must map to real state: seal=committed, ink strike=actual refusal, second print=real response, archive=durably saved, empty room=insufficient data.
- A “Living Archive” cannot show anonymous receipts invented to fill a grid, imply community participation that did not occur, or make private records public by default.
- All interfaces FR/EN, responsive, keyboard and screen reader accessible; real browser screenshots and exported PNG/OG reviewed on target devices. Reduced-motion is a first-class effect, not an afterthought.

## Real-evidence scenario set

| Case | Required consequence / observation | Evidence |
| --- | --- | --- |
| 1. New wish and five costs | Canonical stable catalogue on both devices/languages | Database row + client output |
| 2. Seal first refusal | Creator-only first choice in durable DB | Insert then independent query |
| 3. Blind invite | Recipient cannot derive creator choice from public URL/API view | Negative permission test + browser |
| 4. Second independent commit | One durable responder; no precommit leak | A/B interaction and SQL |
| 5. Shared identical result | Owner/responder generate same ordered choices | Cross-device export comparison |
| 6. Retry after timeout | Server idempotence or honest recovery, no double count | Injected network failure + DB |
| 7. Concurrent submit | Exactly one answer committed | Concurrent DB trajectory |
| 8. Expired/forged/closed URL | Explicit refused/expired route, safe fresh start | Live negative route |
| 9. No DB / slow DB | Fail closed and recover, no phantom “done” | Dependency-failure run |
| 10. Fresh second browser & locale | FR/EN refer to same IDs/seed and role permissions | Real mixed-language devices |
| 11. Public recipient entry | Open link without Vercel insider auth or copied staging secret | Outside-device user session |
| 12. Retention/revoke/delete | Private data removed/revoked as stated | SQL + UI operator/user receipt |
| 13. A→B→C continuation | C's new live response is unrelated to previous pair's secret | Persisted chain events |
| 14. Operator abuse event | Rate limit takes effect and operator can recover safely | Real rejected action and logs |
| 15. Privacy and share boundaries | Guest sees neither private choice; preview reveals no secret | API/OG/live access tests |
| 16. Multiple visits and returns | Voluntary use beyond guided first trial, no fake adoption math | Consented longitudinal evidence |

No date, score, or fabricated conversion percentage makes a missing case proven. Mark each as **OBSERVED / INFERRED / UNKNOWN** and **LIVE / LOCAL / SIMULATED / NOT_IMPLEMENTED** as appropriate.

## Metrics that could actually matter

- **Time to first meaningful choice**, successful creator commits / genuine initiation attempts.
- **Invite landing success** and actual responder commits / successfully opened invites (not clipboard clicks).
- **Duel completion / abandonment** separated by failed delivery, no response, expired and consciously declined.
- **Return value**: opt-in repeated use, useful recall and conversations, not share sheet alone.
- **Organic continuation**: independent follow-on invitations with confirmed respondents; referral spam and duplicates excluded or labelled.
- **Reliability/quality**: failed commits, duplicate races, DB unavailability, expiry cleanup, refusal paths, accessibility barriers, FR/EN content parity, response latency, and unit cost per successful duel.

Use truthful labels; do not infer unique humans from random browser tokens. Any personal tracking requires consent, minimization and a retention plan.

## Release decision and evidence ownership

At this review the release decision is **BLOCKED**. One Neon staging live duplex is PROVEN within its scope. All production-required gates in `LIVE-PRODUCT-REALITY.json` remain BLOCKED. Only update a status after recording a reproducible primary evidence artifact, exact runtime commit, environment, counterevidence and limits. An independent reviewer must approve production promotion.

Relevant modules: `src/lib/duel.functions.ts`, `src/lib/duel-contract.ts`, `src/lib/room.functions.ts`, `src/lib/db.ts`, `src/lib/receipt.ts`, `src/lib/locale.ts`, `src/components/receipt-app.tsx`, `src/lib/duel-image.ts`.

**Protect the validated staging flow while building deeper value; never replace it with a seeded replay-first demonstration.**
