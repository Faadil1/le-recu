# LE REÇU — Product Design / Product Reality Audit

Date: 2026-10-08  
Status: **CODE INSPECTED / RUNTIME NOT VERIFIED / NO CONCEPT LOCK / DO NOT MERGE**  
Repository baseline: `Faadil1/le-recu@b1de5ff549f553e269244754dab57f0bfcd79484`  
Scope: product proposition, mechanics, content, participation, integrity, viral hypotheses, technical truth.  
This is a review artifact only. No application code, environment, database, live deployment or production records changed.

## Product proposition, not the UI description

A person names a desire and sees five potential personal prices. They refuse to pay one, invite someone else to do the same **without seeing their answer**, then compare the two refusals. A single shareable receipt should contain an emotionally intelligible contradiction rather than an uncontextualized screenshot.

**Proposed differentiator:** *We can want the same thing but refuse to lose different things.*

The thermal-receipt metaphor is useful when it makes a recognizable decision object; it is not, by itself, evidence of uniqueness, virality, or user value.

## What is implemented (inspection of repository, not live/browser verification)

- `src/lib/receipt.ts`: authored cost catalogue, deterministic five-category selection, daily deck, generated labels, challenge payload, receipt copy.
- `src/components/receipt-app.tsx`: mobile-width receipt, selected strike, visitor response, local history, challenge/duel sharing, `navigator.share`/clipboard, local UI session recovery.
- `src/lib/room.functions.ts`: server read/write and daily vote tally by line index; SQL uniqueness by (day, desire, browser token).
- `src/lib/db.ts`: when `DATABASE_URL` exists, PostgreSQL connection; otherwise PGLite in-process/in-memory fallback. Database durability and multi-instance consistency are **not established** by merely deploying the app.
- `public/og.jpg` and `public/x-banner.jpg` exist; **dynamic recipient-specific Open Graph preview is not verified**.
- `README.md` describes 8 preset desires, five costs, one strike per browser token per day/desire; custom desires not included in room tally.

## P0 — Product-truth and causal-integrity defects to repair first

### P0-A Blind challenge is spoiled by the share copy

`challengeText(desire, {mine, salle})` explicitly includes `moi — <selected label>`; `defy()` and “Copier le défi” call it before the recipient chooses. The receiving UI may hide the line, but the invitation already discloses it. **Acceptance:** no unspoiled invitation (text, preview image, Open Graph, copy fallback, accessible label) reveals the starter's index/label until the recipient commits. The *final revealed duel* may show both.

### P0-B “Sealed” link is an unsigned, reversible client payload

`encodePayload()` serializes `{d,s,t,a,b?}` as JSON then Base64URL. A technically literate recipient can decode or change `a` before committing. This is concealment by convention, not cryptographic sealing. **Acceptance:** if the product claims a genuinely sealed blind duel, issue an opaque challenge identifier, store the creator's choice server-side and bind a recipient submission before reveal; require server validation, expiry and duplicate-submission policy. If backend is not present, relabel honestly as *blind-by-interface*, never “tamper-proof” or securely sealed.

### P0-C “The room refused this cost” may misstate the thing counted

`castStrike` persists `line` integer for a deck `desire`/day, while `generateLines(desire, seed)` may choose different authored cost labels within that position. `dailyReceipt()` uses a desire+UTC-day seed; `issue(prompt)` uses a desire-only seed. The aggregate can therefore count the same category position but display different labels across creation paths. **Acceptance:** stable issued `receipt_id`/`catalog_version` and stable `cost_id` per refusal, or an explicitly defined immutable daily deck with one canonical seed enforced on every entry path. Never claim votes for an exact label if only category-level data was collected. Include same-day preset-vs-daily regression tests.

### P0-D Population counts and durability

`room.functions.ts` accepts client-generated stable local browser tokens and dedupes on (day, desire, token). This is useful friction but easily reset/spoofed; it is not one human = one vote. In-memory PGLite resets with the process and does not guarantee cross-instance aggregation. **Acceptance:** durable shared Postgres provisioned and independently checked in deployed environment; rate limit and idempotency enforced server-side; no “representative public opinion” language; suppression or small-n disclosure consistent with sample size. Define resilience after restart and concurrent writes.

## P1 — Experience quality and originality

1. **First five seconds:** printed receipt visible immediately on ~390px screens, one decisive CTA. No hero wall or explanatory marketing copy ahead of the object.
2. **Improve the price, not the amount of prompts:** each of the five costs must be a believable, varied consequence of the stated desire. Test emotionally meaningful differentiation, not randomly grim wording. Support lighter subject matter; avoid framing coercive, highly distressing or personal disclosures as entertainment.
3. **Make the duel the payoff:** two conflicting lines visibly collide into a new artifact: before/after, overprint, perforation, opposing ink, or second stamp. The outcome should be legible in a cropped social image without needing a screenshot of app chrome.
4. **Blind challenge / resolved duel are distinct assets:** safe teaser with unanswered question; resolved image with both chosen costs + a conversational question. Provide proper social preview, aspect-ratio crops, alt text and direct link. No leaking creator answer from preview metadata.
5. **Social depth over superficial leaderboard:** room tallies are context, not the core. Results should deepen the *why are we different?* moment. Optional re-challenge and respondent reaction may be explored, but do not force registration or public self-disclosure.
6. **Retain author's visual identity:** monochrome carbon/ivory, confident type, tactile paper and one controlled red mark. Avoid generic share cards, excessive gamification, emoji confetti and leaderboard-first layouts.
7. **Accessibility and fallback:** semantic labels, one-hand mobile interaction, minimum tap targets, keyboard-only navigation, visible focus, prefers-reduced-motion, print/export sans animation, usable when Clipboard/Share API fails.
8. **Consent/privacy:** disclose local storage, avoid storing open-text desires in global analytics and public aggregates, allow deletion/restart, do not infer psychological profiles from refusal.

## Collision / reference check (bounded, NOT a comprehensive clearance)

These adjacent products demonstrate that simple choose-then-compare, secret voting, shared group games and recurring dilemmas are already established:
- [Would You Rather](https://www.would-you-rather-game.com/) — dilemma choice and aggregate comparison.
- [Problematic](https://problematicapp.com/) — daily choice, private friends and reveal.
- [Rikaido Me](https://rikaidome.com/) — blind shared-link answers followed by comparison.
- [Cronote This or That](https://www.cronote.com/this-or-that.html) — private selections and synchronized reveal.
- [DILEMMIX](https://dilemmix.app/en) — judgment/conversation after socially compared choices.

Preliminary differentiation hypothesis: LE REÇU might stand apart through **the five concrete personal costs of a specific desire, the single irrevocable refusal and a collectible two-person receipt artifact**. This is NOT a verified monopoly, brand/name clearance or proof of demand. Rerun competitor and naming research before launch.

## Candidate experience routes (all unlocked)

**R1 — Duplex / Two-Signature Receipt (first experimental preference).** Single challenge passes between two persons; receipt gains a second layer only after independent commitment. The collision is the shareable product. Strongest thematic fit and lowest interaction complexity.

**R2 — The Unpaid Line.** One refused cost is removed from the front but physically survives on the reverse/tear-off; the other person reveals a different cost they would bear. Risk: can become theatrical rather than socially consequential.

**R3 — Group Counter-Receipt.** A small trusted group makes private refusals from identical immutable costs; the final paper unfolds the splits, honest count and disagreements. Risk: long waiting time and fake social proof. Do not build before two-person loop is genuinely rewarding.

No concept lock from aesthetic preference. Explore further only when evidence warrants.

## Product depth after first genuine slice

Core loop: create/receive → read actual five costs → commit independent refusal → server-verified reveal → compare → retain/share/rechallenge → optional return to new daily idea.

Real integration: durable server-held challenge + participant commitment, deterministic immutable catalogue, real cross-device links and actual counts.  
Real consequence: another participant's distinct, confirmed action changes the final receipt; scripted/replay data is NOT live participation.  
Negative: expired/deleted link, opened by creator, duplicate reply, mismatched catalogue, no answer yet, network loss, empty room, request throttled.  
Recovery: retry safely, pending receipt resumes after reload, clear failure messaging, no accidental double vote or reveal.  
Economics/abuse: cost per challenge/view, rate limiting, rotation/retention, generated image/CDN costs, moderation for custom desires.  
Observability: completed pairs and genuine invitations, not merely page impressions.

## Exact verification checklist — NOT YET RUN

- From a new browser A: choose preset; send invitation; verify no creator choice leaks in *any* share surface.
- From browser B/private window: decode/modify old-style URL; confirm secure mode refuses tampering; commit different selection; only then reveal. Record actual server session identifiers without exposing secrets.
- Same day: enter a deck desire from daily print AND alternative preset button; confirm the five cost IDs and aggregate interpretation match the declared cohort.
- Persist two participants' tallies across restart and separate deployment instances using shared DB; test duplicates, concurrency, idempotent retry, invalid input.
- 390px iOS Safari and Android Chrome, desktop mouse, keyboard-only, screen reader sample and reduced-motion.
- OG crawler / X card / WhatsApp / iMessage preview; screenshot preview readability and privacy.
- Failure path when DB is absent: explicit safe state, no unqualified live aggregate claims.
- Actual receiver usability, not mocked second device. Audit analytics for consent/privacy.

**Current status: everything above is proposed acceptance criteria. No test pass is claimed.**

## Conditional gateway / truth register

- Problem/negative event: ACTIVE; genuine social disagreement hypothesis **INFERRED**, not tested.
- Competitive Novelty / Kill: ACTIVE, initial adjacent products identified; comprehensive collision test pending.
- Technical Reality: ACTIVE; repository-inspection findings OBSERVED, deployed runtime UNKNOWN.
- Truth Boundary: PROVEN as this document's claims; product implementation PARTIAL.
- Live Core Loop / real user evidence: BLOCKED / MISSING.
- Load-bearing integration: BLOCKED pending persistent backend and sealed-challenge verification.
- Negative Path / recovery: ACTIVE / untested.
- Evidence Integrity / Runtime↔Commit: BLOCKED; no deployed URL and SHA bound.
- Deterministic Demo: N/A as primary success criterion; replay only diagnostic fallback.
- Judge/Share Artifact: ACTIVE; opening/preview and comparison assets unverified.
- Other canonical conditional gates (including payments / x402 / wallets / contracts / LIVE_GATEWAY): remain **N/A unless scope changes**, not deleted from global registry.

## Recommended sequence

1. Record human reactions to the conceptual five-cost receipt and a post-commit duplex reveal; no novelty claim yet.
2. Repair P0-A/B/C/D and add code-level tests and server reconciliation.
3. Test truly blind two-device cross-origin flow with actual persistence, including negative and recovery cases.
4. Produce original share artifact and instrument consentful activation→invite→accept→complete→share loop.
5. Run independent, uncoached usability and social share experiments before production or Day Challenge branding.

**This document grants no merge, deploy, product promotion or concept lock.**
