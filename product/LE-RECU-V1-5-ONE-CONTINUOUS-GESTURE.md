# LE REÇU V1.5 — ONE CONTINUOUS GESTURE
## Build contract for Claude Code + Rive CLI · 2026-10-16

**Status:** DESIGN APPROVED / IMPLEMENTATION NOT YET STARTED / NO CONCEPT OR RELEASE PROMOTION.

**Project:** `Faadil1/le-recu`
**Work branch:** `design/rive-inline-gesture-v1-5`
**Base revision:** `27482de52888904b1a5694af0d4cc024eecb6558` from `feature/rive-paper-remembers-v1-4`.
**Preview reference:** https://le-recu-invite-beta-5qyalwstz-faadil1s-projects.vercel.app/ (V1.4 app SHA `704be0c28ff7f3dcd7d7b999ef9944125de85b3f`).
**Baseline V1.4 quality:** Real Rive canvas and fallback proved in Chromium + genuine Neon staging FR→EN E2E. GitHub Actions run [38809103552](https://github.com/Faadil1/le-recu/actions/runs/38809103552); no real iPhone verification.

## Why we are building V1.5

The user-provided ~63s screen recording exposes a clear product/visual failure: Rive currently produces a **separate decorative strip beneath the five costs**. The action that matters is *crossing out a specific cost*, but the physical ink isn't connected to that text. On desktop, a giant left editorial heading and a phone-width product floating in black space are out of balance. The most meaningful gesture and seal are off-screen or require scroll. V1.4 passes functional tests but reads as an integrated animation *demo*, not an exceptional singular product.

**Chosen resolution:** one physical sheet; one continuous causal stroke; one genuine two-person overprint. Design the interaction in situ. Do not add scatter, ink particles, animation quantity, or more sections as a substitute.

### Direction: Ink is a consequence

1. **Read:** a cost list feels printed on one real sheet. Short tactile affordance; the five authored costs remain intelligible, focusable, and discoverable. Mobile 320/390/430 widths, FR/EN, long labels/translation remain first-class.
2. **Refuse:** selecting a cost causes a visibly dimensional, slightly irregular red dry-brush line **on the chosen cost's actual typographic baseline(s)**. Its x/y placement and width are derived from the DOM text geometry, not from a hard-coded Rive slot or imaginary character length. The chosen row remains in frame; no forced viewport jump.
3. **Hold:** the local selection is visibly provisional until the participant explicitly taps Seal. Crucial distinction: **selected locally ≠ persisted / sealed**.
4. **Seal:** pressing Seal sends `createDuel` to Neon. During `pending`, show loading/press resistance only; **no definitive stamp before server confirms**. Once confirmed, the selected sheet is impressed with the red seal physically tied to the ink line, without relocating to a separate independent canvas. Copy says WAITING, not SENT, until the invite is actually shared; success of native share cannot be falsely inferred.
5. **Blind reply:** guest sees exactly the same cost catalogue, but never the creator's marked row before their own choice is committed. The guest's inline ink can be locally drawn only on their chosen row. No response, second stroke or SAME/DIFFERENT outcome implied prior to atomic `answerDuel`.
6. **Duplex:** on confirmed `DuelView.status === complete` for an authorized participant, reveal actual **first/second** decisions in canonical creation order, and animate second physical ink impression onto the very same sheet. Convergent marks can register; divergent marks visually separate, tied to the two actual row IDs. Screen text explains the human outcome, not only abstract rings.
7. **Recover:** expired, denied, offline, duplicate, or server failed does not produce a success stamp, ghost companion, stuck animation or black screen. DOM stays operable and offers next honest action.

## Rive integration architecture: one projection, not a parallel decision engine

The **server and React remain authoritative**. Keep the state adapter in `src/lib/rive-paper-contract.ts` tied to `experiencePhase()` and its real Neon results. Existing model is `phase / outcome / markKept / proximity` with 10 Rive states, four numeric View Model properties and a 13,684-byte V1.4 `.riv`. Upgrade the source RML **through installed Rive CLI**, not by pretending to hand-edit an opaque `.riv`.

**Recommended technical shape** (adapt after real Rive CLI testing):
- One runtime canvas or artboard overlay for the **selected cost's ink** rather than five independent WebGL canvases. Place it in the same positioned row (or a clipped overlay anchored by `ResizeObserver`) with `pointer-events:none`, `aria-hidden`, no focus interception; ensure actual text, buttons and screen-reader names stay in DOM.
- Measure the chosen text's visible line boxes and paint stroke(s) across them; ensure two-line labels and responsive type never cause strike drift. If fine-grained per-glyph mapping is too fragile, use a resilient single underline-through center with measured width, or a DOM/SVG stroke covering actual chosen labels, while the compiled Rive engine handles bristle, pressure, distortion and seal animation. This fallback is preferable to faking an implementation.
- Adapt `rive/le-recu-paper/tools/gen-scene.mjs`, `scene.rml`, `src/components/rive-paper*.tsx`, and `src/styles.css`; keep `npm run rive:build`, `rive:check`, provenance and runtime self-hosting. Add measurements as an internal view-model property **only if required by the verified CLI**; never leak private strings into `.riv`.
- No forced `scrollIntoView` to a disconnected stage. Honor actual viewport behavior and keyboard focus. If canvas cannot render, inline stroke remains meaningful and buttons still work.
- Preserve proven poster generation `src/lib/duel-image.ts` (1080×1350 real PNG, canonical first/second roles) and do not alter SQL schema or permissions for an animation.
- Match asset visuals to the product, not AI-slop: ink red `#a32018`, textured cream `#f3ecdf`, near-black `#1c1612`, restrained tactile affordance, Fraunces + IBM Plex Mono.

### Composition

**Desktop**: do not scale a phone screenshot into the center and leave a dead black flank. Use a considered, responsive editorial composition that actually gives cost rows, gesture and aftercare more space. A left statement may remain but it must not dominate the only functional object. 1366/1440/1920 wide layouts must feel authored; touch/mouse keyboard still work.

**Mobile**: 390×844 is the main reference; 320×640 and 430×932 must not overflow horizontally or send the active row and action to entirely unrelated screen positions. The initial five-choice reading must not be harmed by gratuitous canvas height; maintain sticky next action when appropriate.

### Bilingual & semantic stability

- FR/EN copy for local choice, persisting, waiting and confirmed result; **don't show `ENVOIE-LE` / `SEND IT` before the choice is successfully sealed.**
- The visual mark must target the real chosen label under both locales. Every canonical desire and its dynamically generated five costs must remain addressable by stable IDs, not translated text matching.
- The second participant's choice remains hidden until server confirmation. The image export must remain the exact same result irrespective of which participant exports it (canonical creator/responder ordering, never `THEM/YOU` that flips).
- If any viewport has `prefers-reduced-motion`, no Rive canvas is required; static HTML/SVG or CSS means the same thing.

## Acceptance scenarios (no stage omitted)

| ID | Flow | Observable pass | Evidence class |
| --- | --- | --- | --- |
| P1 | FR creator taps cost #3 | Brush emerges on *the text of row #3*; no red marks on unrelated rows, no Neon POST yet | LOCAL + VISUAL |
| P2 | Press Seal then server slow | Provisional mark stays, loading action visible, **no confirmed seal** until a real server receipt | LIVE STAGING |
| P3 | Seal fails | Error + retry; still no stamp, creator decision not implied saved | LIVE/STAGING or explicitly LOCAL |
| P4 | Seal succeeds | Persistent owner waiting status; seal visually anchored to selected row; valid share link | LIVE STAGING |
| P5 | Blind guest opens link | No creator strike, chosen ID, seal verdict, second impression or outcome leak | LIVE STAGING |
| P6 | Guest chooses different index | Correct guest mark and confirmed answer; creator and responder see consistent different outcome | LIVE STAGING |
| P7 | Two choose same index | Two real commitments, distinct actual browsers; visually convergent outcome only after response | LIVE STAGING |
| P8 | Refresh/reopen / second browser | No ghost previous animation, no double-tap commit, no reshare invalid invite | LIVE STAGING |
| P9 | iPhone / Android / keyboard / reduced-motion / Rive missing | Primary loop stays operable, correctly marks real text and recovers | Device/Browser |
| P10 | FR/EN layout 320,390,430,1440,1920 | No overlap, stroke drift, text clipping, overflow or forced scroll jump | VISUAL |
| P11 | Screenshot and export real PNG | User sees same underlying refusals, faithful canonical first/second, no invented participation | LIVE + VISUAL |
| P12 | Participant erases duel | Shared record actually deleted, other browser sees closed/unavailable | LIVE STAGING |

Run **repeated regression** of Rive drawing and true-state server transitions rather than one happy-path green run. Record deterministic seeds, screenshots and failure recovery. Keep existing `scripts/live-beta-e2e.mjs`, `scripts/rive-paper-e2e.mjs`, `scripts/rive-paper-live-smoke.mjs` passing; add **inline-row geometry assertions and real same/different cases**.

## Canonical gateway handling

Carry all gates from `product/LIVE-PRODUCT-REALITY.json`; explicitly keep `ACTIVE`, `N/A`, `BLOCKED`, or `PROVEN` per gate; **no silent omission**. PR #2 remains DRAFT, unmerged. V1.4 staging happy-path Rive/Neon can remain **PROVEN only for its original SHA and scope**. V1.5 must earn its own runtime SHA/Neon evidence. Production release is **BLOCKED**: retention and deletion guarantees, read throttling/abuse, operator actions, external uncoached value, hardware accessibility, and genuine sustained depth are not proven. Never claim Rive fidelity or production viability from mockups, generated art, local CSS, seeded outputs or a single scripted demo.

## Workflow for Claude Code

**QUALIFY → DECIDE → DESIGN → DELIVER → AUDIT → EXPAND.** Before changing RML, use Rive CLI to render and compare at least two genuinely buildable **inline-gesture** approaches, not two independent stickers. Evaluate integration feasibility on the real selected text, performance, touch and visual originality. Preserve reversible direction and evidence.

After the visual candidate passes, build it on `design/rive-inline-gesture-v1-5` (this branch). Do not merge or push to production. Validate RML with `rive --verify`, inspect, compile, hash and test. Use actual CLI help for syntax; never invent subcommands.

Only deploy a Vercel Preview to the already existing `le-recu-invite-beta` on account scope `faadil1s-projects` (not `bfaadil-a11y`), with Preview-only encrypted `DATABASE_URL` to Neon staging, when explicit user signoff or established authorization permits. Do not touch production DB, schemas or public release. Report SHA, design screenshots, Rive CLI output, preview URL if READY, LIVE Neon E2E, negative-path matrix, accessibility findings, release gate verdict and reasons for every unproven item.

**Done criterion:** the cost line itself becomes the tactile interaction, the confirm/reveal read as a single coherent real object, and the resulting product is more legible and meaningful—not merely more animated.
