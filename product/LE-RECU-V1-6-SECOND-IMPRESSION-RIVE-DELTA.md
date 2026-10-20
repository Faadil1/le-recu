# LE REÇU V1.6 — THE SECOND IMPRESSION
## Product implementation + Rive CLI production delta (2026-10-20)

**Design decision:** the revelation of two independently committed refusals is the central event of the product. It must happen **on the same physical sheet**, and must be visible when it occurs; never make the recipient read a detached second component far below the chosen line.

**Branch:** `feature/second-impression-v1-6` (draft PR #4), cut from V1.5. V1.5 itself and PR #3 remain unmerged. No production promotion.

## Already implemented in React / CSS on this branch

- Fixed stale deletion acknowledgment: `showErasureNotice()` only allows a visible confirmation on an idle unselected receipt with no live challenge ID. Starting a new choice clears the previous message. Regression tests cover all relevant states.
- Canonical creator-first / responder-second ordering in the `.duplex-imprint` text on *both* browsers; the PNG already used canonical order.
- Moved `DuplexResult` from the bottom of the sheet to `data-duplex-reveal`, **above the actual measured cost lines** within the existing `[data-receipt]`/article. The original Rive `RiveInkOverlay` stays mounted and gains real repositioned line geometry. It remains on the same paper; no false second user, no remount by participant index.
- The verdict has a compact press/stamp treatment and two abbreviated real cost impressions; visually distinguishes same/different without extra fake social signals.
- After a user-triggered server-confirmed reply/check, scroll only to the verdict (never on page hydration/reload). Honors reduced motion.
- One leading PNG export/share action and an optional, collapsible secondary toolset for text share, copied result and participant-authorized erase. New FR/EN labels accurately distinguish native Web Share from clipboard copy.
- The old V1.5 Rive binary is reused; it already draws the second overprint on the actual cost row. **No V1.6 RML scene has been built yet.**

## Remaining Rive CLI art-direction work — must be REAL, not CSS pretend

Use Claude Code with installed Rive CLI / Cadet to build the true emotional **pressure→contact→registration** choreography on the same cost sheet. Do NOT implement it by adding a disconnected secondary decorative scene or mocking an animation screenshot.

1. **Second impression arrives** only on transition from verified server `pending` to `complete` for an authorized owner/responder; no replay of a newly arrived second player on initial hydration and no invented completion.
2. **Paper compression** must originate at the actual real second cost's measured geometry; clear contact mechanics, not 2D confetti, no overdone splatter.
3. **Same**: the two ink layers physically register on one refusal line; **different**: two lines remain separate, marked tension without implying consensus. Explicit text verdict remains true even if WebGL fails.
4. **Keep the cost typography readable** while pressure blooms; mark strength and underprint opacity must not obliterate the actual label.
5. **A single canvas** (existing Rive overlay), no pointer interception, no separate truth engine. Keep screen reader order and existing self-hosted Rive WASM fallback.
6. **Timing:** interaction completion must never block the server acknowledgement, keyboard input, reduced-motion or sharing. No auto-scroll on refresh or reopened links. If reveal occurs off-screen, do not play a fake historical reply on re-entry.
7. **Responsive:** FR/EN long cost labels, 320 / 390 / 430 / 1440 / 1920 widths, low-power iOS Safari. Re-evaluate desktop paper prominence and right-side options after test footage.
8. **RML:** version source in `rive/le-recu-paper`, `npm run rive:build`, `rive --verify`, `rive inspect`, `rive:check`, record actual .riv hash and runtime contract. Do not claim CLI proof without actual command output and compiled asset.

## Non-negotiable evidence / gates

- Current CSS/React **layout and product** changes can be validated independently of the future CLI animation. Mark the latter **NOT_IMPLEMENTED** until a compiled new V1.6 `.riv` is actually published and rendered.
- External Preview: Vercel project `le-recu-invite-beta` under scope `faadil1s-projects`, Neon Preview-only encrypted `DATABASE_URL`, no production schema edits.
- Live two-browser staging tests: creator FR → responder EN → both canonical IDs, valid real 1080x1350 PNG, third-party privacy refusal, deletion and next-choice notice cleared.
- Extend negative-path test matrix: expired, outsider, slow Neon, atomic double reply, failed seal, stale receipt, signed-out browser token, reduced motion, Rive 404/WebGL unavailable.
- Repeated regression rather than one green happy path, measured 5-second comprehension, hardware iPhone/Android, screen reader checks, real independent return usage; none may be fabricated or treated as proven from headless screenshots.
- Keep Product Depth & Live Reality **production BLOCKED** until all applicable release gates have independent evidence: guaranteed retention/purge, room-vote deletion, read/abuse controls, operator recovery, informed consent and organic value. The 42 registered conditional gateways keep their prior statuses unless independently verified.

## Proposed signoff

1. Staging Preview CSS/React code checked and screens visibly inspected.
2. Real V1.6 CLI motion integrated **only after** artifact inspection and targeted iteration.
3. Independent E2E QA with exact Rive file hash, Git SHA, Neon staging, screenshot mobile/desktop. No PR merges or public release unless user approves.

The primary standard is **the whole product meaningfully improves**: one sheet, one decision, one new real impression, then a reason to talk or share. No vertical-slice-only finish.
