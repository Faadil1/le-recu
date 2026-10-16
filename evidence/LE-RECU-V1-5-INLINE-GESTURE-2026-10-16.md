# LE REÇU V1.5 — One continuous gesture (Rive inline ink) — build evidence

Branch `design/rive-inline-gesture-v1-5`, base `27482de` (V1.4). Contract: `product/LE-RECU-V1-5-ONE-CONTINUOUS-GESTURE.md`.
Nothing merged, PR #2 untouched, production and Neon untouched, a Preview was deployed by the owner afterwards (see LIVE section).
Evidence classes: **VISUAL** (Rive CLI headless frame), **LOCAL** (real browser, real server functions, real SQL on in-memory PGlite, real DOM geometry and real canvas pixels), **LIVE** (deployed Preview on Neon staging, *none produced*).

## What changed for the person

The refusal is no longer a decorative strip under the list. Tapping a cost draws a red dry-brush line **through the measured text of that very row** (one segment per real text line, up to three), the seal lands at the end of that line after — and only after — the server confirmed `createDuel`, and the second person's answer prints a black second impression on the **same sheet**: on the same row when both refused the same cost (registered overprint), on a different row with a thin tension line on the right margin when they did not. Both browsers show the creator's row in red and the responder's in black, in canonical creation order.

## Verdict matrix

| ID | Contract scenario | Status | Class | Proof |
| --- | --- | --- | --- | --- |
| P1 | Tap cost #3: ink on the text of row #3, none elsewhere, no POST | PROVEN | LOCAL + VISUAL | segment x/width equal the real text line box (±1.5 px); 2 357 red px on the chosen row, 0 on the other four; POST counter unchanged |
| P2 | Slow server: provisional mark stays, no seal before the receipt | PROVEN | LOCAL | route delayed 2.6 s; phases `pending>sealed>waiting`; no seal element while pending; positive control: Seal POSTs |
| P3 | Seal fails | PROVEN | LOCAL | aborted POST → `failed`, error shown, mark stays, no seal; retry reaches `waiting` |
| P4 | Seal succeeds | PROVEN | LOCAL | seal centre right of the struck text and inside the chosen row; valid `?duel=` invite |
| P5 | Blind guest | PROVEN | LOCAL | no `.ink-*`, seal, duplex block, struck cost; 0 red pixels in all five rows; empty geometry |
| P6 | Guest picks another row | PROVEN | LOCAL | `reveal` in both browsers, `first=creator row`, `second=guest row`, connector between the real rows |
| P7 | Both pick the same row | PROVEN | LOCAL | rows 1/1 and 4/4: no connector, seals coincide, both viewers |
| P8 | Reload / second browser / no ghost | PROVEN (scoped) | LOCAL | fresh contexts start `idle`; a reload into a pending duel does not replay the stamp (unit test); no double POST observed |
| P9 | Keyboard, reduced motion, WebGL2 missing, Rive file missing | PROVEN | LOCAL | SVG twin draws the same ink at the same measured coordinates; flow completes in each mode. **iPhone / Android: BLOCKED** |
| P10 | 320 / 390 / 430 / 1440 / 1920, FR + EN | PROVEN | LOCAL + VISUAL | 26 cases (every row at 320 and 1440), no overflow, row moves < 90 px on selection, no forced scroll; a label forced to wrap at 320 gets one stroke per line |
| P11 | Poster export | PROVEN | LOCAL | FR and EN posters are real PNG 1080×1350; canonical first/second identical for both |
| P12 | Participant erase | PROVEN | LOCAL | erase confirmed, other browser sees `unavailable`; outsider denied |
| — | Unmodified `scripts/live-beta-e2e.mjs` | PROVEN | LOCAL | run from a scratch copy with the URL guard bypassed, against the local PGlite server (guard in the repo is untouched) |
| — | Production build serves the overlay | PROVEN | LOCAL | clean worktree of code SHA `79d4ab7`, real `npm ci`, `tsc`, 43+8 product tests, `rive:check`, `vite build`, `vite preview` smoke (no database) |
| — | LIVE staging on the Preview (P0–P2, P4–P6, P11, P12, same/different) | PROVEN (scoped) | LIVE/STAGING | see "LIVE" below: Preview `le-recu-invite-beta-3mh044t9y`, Neon staging |
| — | Real devices, screen reader, sustained use | **BLOCKED / UNKNOWN** | — | not available here |

Release decision is unchanged: **BLOCKED**. `product/LIVE-PRODUCT-REALITY.json` is unchanged; every gate keeps its status (the 20 production-required gates stay BLOCKED; `live-core-loop-staging` stays PROVEN only for its original V1.3 SHA, V1.4's Rive/Neon proof only for `704be0c`). V1.5 must earn its own SHA on Neon staging.

## LIVE (Preview + Neon staging), 2026-10-16

Preview: `https://le-recu-invite-beta-3mh044t9y-faadil1s-projects.vercel.app/` (deployed by the owner; project `le-recu-invite-beta`, scope `faadil1s-projects`). Binding: the served `/rive/le-recu-paper.riv` is 14 043 bytes with sha256 `c5b891e7…f3a5`, identical to this branch's `PROVENANCE.json`; the deployed *application* SHA cannot be read from outside, so it is bound by the Rive binary and by behaviour (inline ink DOM attributes), not by a deployment record. Scope: automated Chromium on this machine (not the GitHub workflow: `workflow_dispatch` needs the workflow on the default branch), software GL, no real device.

```text
node scripts/rive-paper-live-smoke.mjs   PASS  hosted .riv, live canvas, state change on a real choice, reduced-motion twin
node scripts/live-beta-e2e.mjs           PASS  FR creator -> EN recipient -> Neon reply -> both duplex views -> PNG -> outsider denied -> erase
node scripts/rive-paper-live-inline.mjs  PASS  12 executed checks (below); skipped steps are listed as SKIPPED in the result file
```

Executed LIVE inline checks: P0 live Rive canvas inert over the list · hover ghost only · P1 ink on the text of row 3 (2 357 red px, 0 elsewhere, no POST) · P2 slow server (route delayed 2.6 s): `pending>sealed>waiting`, no seal while pending · P4 seal anchored on the chosen row · P5 blind guest has no ink/seal/outcome and 0 red pixels · P6 different rows, canonical first/second, connector, both browsers · P11 FR and EN posters 1080×1350 PNG · same-row and different-row repeats (rows 4/4 and 2/4), each erased afterwards · P12 outsider denied, erase closes the invite for the other browser · unknown id recovery · no console errors · no third-party Rive runtime. Skipped on LIVE on purpose (they would leave undeleted staging rows or only exercise the client): reduced motion, WebGL2/404 fallbacks, keyboard, layout matrix, wrapped label, fold, failure injection — all PROVEN LOCAL above. Result: `evidence/rive-v1-5/live-rive-paper-e2e-result.json`, frames `evidence/rive-v1-5/live-browser-frames/`.

Still **not** proven: real iPhone/Android, screen reader, outage and Neon cold-start recovery, repeated independent human use, any production gate. Release decision stays BLOCKED.

## Two compiled directions (both Rive CLI frames, same view model and state machine)

| | A — dry brush (**selected**) | B — marker |
| --- | --- | --- |
| Strike | irregular red dry-brush stroke 9.5 px with an ivory dry streak and a wet bloom, trimmed along the measured line | 20 px translucent multiply band with hard edges |
| Seal | double-ring red seal with ticks, pressure wave | solid disc with knocked-out rings |
| Second impression | thinner, translucent black overprint (multiply) | multiplied black bar |
| Verdict | the text under the line stays legible; reads as a hand refusing a price | strong and graphic, but it hides the cost it is meant to refuse, against "the five costs stay intelligible" |

Frames: `evidence/rive-v1-5/directions/direction-{dry,marker}-contact-sheet.png` (CLI frames use grey bars as a mock row, labelled `MOCK` in the scene; real-text alignment is proven in the browser E2E, not in these frames). Switch: `node rive/le-recu-paper/tools/gen-scene.mjs marker rive/le-recu-paper` + `npm run rive:build`.

## Architecture

- **Server and React stay authoritative.** `src/lib/rive-paper-contract.ts` is still the single adapter (`experiencePhase()` + in-flight action + visible error → phase). New in V1.5: pure geometry (`strikeSegments`, `sealPoint`, `buildGeometry`), `inkRows` (canonical first/second, never "me/them"; before a verified reveal a viewer only wears their own ink), `twinVisibility`.
- **Scene** `rive/le-recu-paper/scene.rml` (generated by `tools/gen-scene.mjs`; the V1.4 generator is kept as `gen-scene-v1-4.mjs`): artboard `InkOverlay`, state machine `InkMachine` (13 states), view model `InkState` (38 numbers: `phase outcome viewerFirst proximity`, seal centres, connector, and three marks × three lines × `x y w`). Compiled with Rive CLI 1.5.1 → `public/rive/le-recu-paper.riv`, 14 043 bytes, sha256 `c5b891e79749d5b99f82e8b0070685194f528ca6e823ca4ddcda8a1d5910f3a5` (`PROVENANCE.json`, `npm run rive:check`). **No scripts, listeners, text, cost labels, identity or counters** (asserted by a unit test); unsigned build is therefore valid on the web; nothing was pushed to or overwritten in any Rive account file.
- **One overlay, not five canvases.** `RiveInkOverlay` sits over the cost list (`position:absolute; inset:0; pointer-events:none`), measures `Range.getClientRects()` of the chosen label(s) on every row change, locale change, resize, font load, and writes numbers; the canvas is laid out to its CSS size (`Fit.Layout`), so scene units are CSS pixels at any device pixel ratio. Only changed values are written, otherwise the state machine re-enters and replays its state.
- **Fallback with the same truth.** The SVG twin uses the same measured geometry and the same visibility rules (`twinVisibility`) and covers loading, reduced motion, no WebGL2, load error and render crash. The CSS `line-through` is hidden because the overlay always draws the strike.
- **No forced scroll.** V1.4's `scrollIntoView` to a stage is gone.
- **Copy truth:** a local mark says `À SCELLER` / `READY TO SEAL` with "provisional: nothing is saved until you seal"; `SEND IT` no longer appears before the seal, `EN ATTENTE` / `WAITING` after it.
- **Desktop ≥ 1100 px:** an authored three-column composition (quiet sticky statement · the sheet at 560–700 px with larger cost text · sticky next action) instead of a phone-width column in a void. Frames: `evidence/rive-v1-5/browser-frames/13-layout-*.png`..
- Poster generation, SQL schema, permissions and every gate file are untouched.

## Results

```text
rive rive/le-recu-paper --verify     0 errors, 0 warnings          rive inspect: problems []
npm run rive:build / rive:check      ok  c5b891e7…f3a5  (14 043 bytes, 0 scripts)
npx tsc --noEmit                     exit 0
npm run test:product                 43 pass / 0 fail   (contract tests: 17, incl. exhaustive 6 480 states)
npm test                             71 pass / 0 fail
npx eslint (new/changed components)  clean
RIVE_E2E_URL=http://127.0.0.1:8080/ node scripts/rive-paper-e2e.mjs   24/24 PASS (fresh dev server, PGlite)
unmodified live-beta-e2e.mjs on the local server (scratch copy, guard bypassed)   PASS
vite build (clean worktree, 79d4ab7)  ok; assets: .riv, 2 wasm, lazy chunk; build smoke 3/3
```

Files: `evidence/rive-v1-5/{directions,rive-cli-frames,browser-frames}/`, `rive-paper-e2e-result.json`, `rive-paper-build-smoke-result.json`.

## Findings and limits

- The first E2E pass was **false-green**: the old CSS strike was drawing the row, not Rive. Disabling it exposed that the canvas drew at 2× on a DPR-2 screen (`layoutScaleFactor` must stay 1) and replayed on every re-write of an unchanged phase. Both fixed; the pixel assertions now read the real canvas.
- Rive pauses off-screen canvases. A reveal that happens while the rows are scrolled out of view animates when they return (the product shows the verdict text regardless); the harness therefore scrolls a row into view before judging pixels. This is a behaviour to keep in mind on a real phone.
- When both refuse the same row the black overprint multiplies the red on purpose, so less pure red remains (threshold lowered for that case only); the text stays readable because the second impression is thin and translucent.
- Vite dev server degraded after many PGlite duels (timeouts, not product failures); a fresh server restored 24/24. The harness records the real server's outcome only.
- `scripts/rive-paper-live-smoke.mjs`, `rive-paper-build-smoke.mjs` and a new manual workflow `.github/workflows/live-rive-v1-5-preview.yml` (input: Preview URL) are ready; none has run against a deployed V1.5.
- `npm run build` still fails on Windows at `spawn vite ENOENT` in `scripts/with-app-env.mjs` (pre-existing); `vite build` was run directly.

## To unblock LIVE

1. (done) Preview deployed by the owner; hosted smoke, `live-beta-e2e.mjs` and the inline LIVE E2E passed from this machine.
2. Make the Preview deployment record bind the application SHA (Vercel deployment id + commit) in this file.
3. Real iPhone Safari and Android Chrome pass; screen reader pass; outage / cold-start recovery; uncoached human use.
