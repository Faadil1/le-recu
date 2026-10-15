# LE REÇU V1.4 — Rive CLI / Claude Code build handoff

Status: **AUTHORIZED TO BUILD IN A NEW DRAFT FEATURE BRANCH ONLY**. Not concept-locked, not production approved.
Owner has Rive Cadet and Claude Code with Rive CLI available.
Core target: real, editable **RML source + a verified, previewable .riv** embedded in the existing React/TanStack product. No fake/composite runtime.

## Grounding / read before any edit

Repository: `Faadil1/le-recu`. Base branch: `build/duplex-blind-duel-v1`. Base PR #2 is **DRAFT / DO NOT MERGE**.
Files:
- `src/components/receipt-app.tsx`: creator selection, actual `createDuel` seal, guest `answerDuel`, owner `readDuel` refresh, completion, opt-in room and deletion.
- `src/lib/experience-state.ts` + tests: real server-derived `choose|seal|waiting|reply|reveal|unavailable`.
- `src/lib/duel-contract.ts`: strict participant visibility.
- `src/lib/duel-image.ts`: deterministic FR/EN 1080×1350 PNG; preserve unless proven integration change.
- `src/lib/locale.ts`: bilingual UI, canonical IDs.
- `src/styles.css`: Paper Under Pressure visual language; needs coherence with Rive, not replacement.
- `product/LE-RECU-LIVE-PRODUCT-PRD-V1.md`, `product/LIVE-PRODUCT-REALITY.json`, `research/LE-RECU-V1-3-FULL-PRODUCT-VISUAL-AUDIT-2026-10-11.md`, `evidence/LE-RECU-V1-3-LIVE-VISUAL-QA-2026-10-11.md`.
- `scripts/live-beta-e2e.mjs`: real browser dual-session FR/EN evidence; retain existing QA.

**No creation of server side state from Rive**. All actual events remain explicitly authorized React → Neon. Rive is a visual projection of state only.
Real user gesture can change a preview/hover animation, but **persistent refusal does not exist until the current React event and applicable server response**. No response animation can imply a second player before Neon commits it.

## Desired art direction — The Paper Remembers

Original tactile microinteraction, not a generic floating-card animation:
1. **Ink / Refuse**: finger approaches; fine bristles react; an ink line slowly absorbs into coarse ivory fiber; on committing choice, the mark remains, but no illusion of server commit. React remains focusable and keyboard-usable.
2. **Seal / Persist**: short, restrained paper compression / pressure wave; a physical double-ring red seal appears **after confirmed `createDuel`**, not on button press. While awaiting network response, ambiguous pending texture, no forged success. On refusal/timeout/failure, paper softens/reopens with clear retry/unknown-state guidance.
3. **Duplex / Reveal**: only after real `DuelView` status `complete` with valid participant role and two choice indices, second impression appears. The art direction encodes convergence or divergence based on actual same/different; neither cost text nor author identity lives secretly in public .riv.
4. **Fail and reduced motion**: static CSS/HTML paper with the same truth, plus robust fallbacks for reduced-motion, Rive load error, WebGL unavailable, keyboard, low-power iPhone. App cannot become a black screen.
5. **No fake counters, fake community, fake interactions, seeding or visual-only 2nd player.**

Visual details: crème `#f3ecdf`, near-black `#1c1612`, ink red `#a32018`; paper fibers and deliberate clean bristle texture, typography editorial (Fraunces + IBM Plex Mono in HTML), tension but no gore or noisy particle spam; phone-first 390×844; sensible at 320, 430, desktop.

## Expected project structure

```text
rive/le-recu-paper/          # source-controlled Rive CLI/RML project
  rive.yaml
  scene.rml
  AGENTS.md
  CLAUDE.md
  ...                        # authored assets/scripts
  build/le-recu-paper.riv    # if genuinely compiled and supported by repo policy
public/rive/le-recu-paper.riv # runtime-ready published asset when verified
src/components/rive-paper.tsx # client-only, progressive enhancement
src/lib/rive-paper-contract.ts
src/lib/rive-paper-contract.test.ts
```

Don't invent CLI subcommands or an inaccessible binary format; use the **installed CLI's** `rive --help`, `rive doctor`, `rive docs`, `rive schema` and generated project `AGENTS.md` / `CLAUDE.md` as authority. Create an actual RML project with `rive create rive/le-recu-paper`. Run the CLI compiler `rive rive/le-recu-paper --once` or syntax applicable to installed release, `--verify`, and `rive inspect --summary`. Inspect screenshots of decisive states with `--screenshot`. Never claim Rive delivered without a real binary.

For scripted web assets, consult latest CLI publication rules. `rive login` and `rive push` may be needed to bind to owner's Cadet workspace and `--publish` may sign scripts for web runtimes. Ask for account sign-in only via secure Rive login; do not copy credentials into repository/logs. **Do not overwrite existing Rive remote files without approval.** Maintain provenance of remote project/file.

Use current `@rive-app/react-webgl2` or a more appropriate runtime from official docs as needed; prefer current View Models / Data Binding rather than deprecated state-machine input hooks. Keep React's text and interaction semantics, do not place essential decision UI wholly inside canvas. Layer Rive as transparent animated feedback; coordinate actual state through one narrow `PhaseInput` → `Rive visual state` adapter. No canvas interception of touch, tap, accessibility or gesture input needed for real refusal.

## Delivery stages / gates

**Gate A — environment & visual exploration**:
- Document installed CLI/runtime versions and Cadet account/workspace availability.
- Show 2 distinct rendered Rive *frame* directions with screenshots, not AI mockups. One must express physical ink/bristle/paper/sigil; the other can be more daring.
- Pick one with user or clearly document the reversible first selection; never build three shallow sketches instead of a functional prototype.

**Gate B — real interactive component**:
- Build actual source-controlled `scene.rml`, state machine / View Model property contract and compiled `.riv`.
- In React, use Rive only for visual projection. Create no secondary decision engine.
- Bind preview/touch/reduced motion only when safe and preserve HTML & Canvas fallback.
- Lifecycle: select → locally indicate cost → create/persist with Neon → seal/await → response verified → second impression; errors and declined/expired flows visibly and honestly recover.

**Gate C — real regression evidence**:
- `rive ... --verify`, `rive inspect --summary`, rendered Rive screenshots for idle, cross-out, network-pending, confirmed, failure, reveal and reduced-motion.
- `npm ci`, `npm run typecheck`, `npm run test:product`, `npm run build`.
- Actual Vercel Preview on the protected or isolated staging project; exact SHA and app/rive binary hash, actual dual-browser FR→EN Neon E2E with same/different and expired/guest negative test.
- Rive render failure / WebGL missing: UI and decision actions continue on DOM fallback; keyboard, 320/390/430 mobile, prefers-reduced-motion and no horizontal overflow.
- **No success claim on local CLI-only animation**. Keep all conditional gateway states explicit, Blocked until runtime-observed. Record `LIVE / LOCAL / SIMULATED / NOT_IMPLEMENTED` per observed artifact.

**Do not** change Neon schema, disable release gates, auto-merge PR #2, push production deployments, leak participant tokens in files, or add invented adoption/viral figures.

## At the end

Provide: Git branch and SHA; actual CLI artifact paths; Rive file dimensions/contract/state machine; 2 screenshot references; test matrix with honest results; Vercel Preview URL **only if genuinely READY**, and unproven blockers. Request explicit user approval before any merge or public promotion.
