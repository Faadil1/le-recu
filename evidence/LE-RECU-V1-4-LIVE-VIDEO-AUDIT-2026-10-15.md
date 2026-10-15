# LE REÇU V1.4 — Live Rive + Neon QA and user video audit (2026-10-15)

## Grounded runtime

- **Application deployment:** Vercel Preview `le-recu-invite-beta`, `dpl_HNew2b2ReToHJMUfDEpji4SGW3oe`, exact deployed application SHA `704be0c28ff7f3dcd7d7b999ef9944125de85b3f`, immutable URL: https://le-recu-invite-beta-5qyalwstz-faadil1s-projects.vercel.app/
- The site and real compiled `public/rive/le-recu-paper.riv` returned HTTP 200; Rive binary size was 13,684 bytes in GitHub and was served through Vercel.
- **CI repair:** original run `38805430275` failed *before* tests on `npm ci`: missing optional nested `lru-cache@11.5.3` lock entry (Nitro / unstorage). Lockfile repaired on the isolated feature branch; no application source changed in this repair.
- **Live QA after repair:** https://github.com/Faadil1/le-recu/actions/runs/38809103552 — **SUCCESS**. `npm ci`, `rive:check`, TypeScript and 37 product tests passed. Hosted real Rive canvas passed in Chromium, including local selection → ink projection and `prefers-reduced-motion` HTML/SVG fallback. External real Neon staging A→B duel passed with FR creator + EN respondent, correct readback/reveal, exports, nonparticipant privacy and successful participant-authorized deletion. GH artifact: `le-recu-v1-4-live-rive-neon`, ID `12007726570`. All new interaction assertions are scoped to the deployed SHA above, not to a later application build.
- **No production promotion** or merge. CI proving a happy path does not prove mobile hardware, outage recovery or organic adoption.

## User-provided video review

Source: user-uploaded 62.8s desktop screen recording in conversation on 2026-10-15, separately reviewed at roughly 0, 4, 7, 10, 38, 43, 49, 55 seconds. Classification **VISUAL / USER-RECORDED / RUNTIME**; not a substitute for server logs or independent human use.

Observed:
1. A cost is marked on the real receipt; the standalone Rive ink gesture animates **beneath the five rows**, not on the selected line itself.
2. Sealing leads to an actual invite URL and creates the visible stamped state; the pending second impression honestly remains empty.
3. User opens another browser with the shared URL; guest sees a blind challenge with no visibly disclosed first refusal. This video stops short of a completed guest response/reveal; **CI separately proves** the automated end-to-end.
4. The guest browser briefly shows “YOUR RECEIPT IS PRINTING…” while loading. Delay observed visually, not benchmarked; collect objective time-to-interactive measurements before attributing cause.
5. Desktop 1918×1038 space is underexploited: dominant editorial tagline left, narrow 390-ish-pixel receipt near center, large blank black expanse. Long vertical scrolling hides the crucial gesture and next action at separate moments.
6. Content-state mismatch: a pre-seal visual heading can say “SEND IT” while the actual next action is still “Seal my choice.” Requires state-specific copy.
7. The Rive scene is a meaningful real artifact, but the visual reads as a *short, isolated bristle line + seal* rather than a physically continuous ink stroke through the chosen consequence. A stronger and more causal composition is necessary for exceptional memorability.

## Priority visual/product delta (not implemented)

### P0 — fundamental experience, not decoration

- **Inline causal ink:** animating exactly **the cost row chosen** (same layout, same text), not a separate cinematic stage unrelated to the row. Touch and keyboard select must produce equivalent truthful marks; Rive remains projection and Neon the commit authority. Avoid overlay intercepting input.
- **One visible moment:** keep refusal, brief local choice confirmation and confirmed server seal visible without surprise scroll. Reduce layout shifts; on mobile keep selected row and key action in view. Preserve 5-row comprehension and fallback.
- **Meaningful reveal:** when Neon confirms response, the second mark must appear on the same artifact with unmistakable same/different meaning and participant privacy. Avoid replay-first / fake second person.
- **Pre-seal copy consistency:** stage labels, action prompt and server committed status must match; “send” must not precede seal.

### P1 — identity and operation

- Desktop art direction needs real editorial composition and space utilization; Rive scene should physically interact with receipt margins and typography. Avoid large generic blank void, over-wide paragraphs and pure postcard staging.
- Add verifiable loading performance measurements, truthful slow/failed guest states, retries and Neon cold-start recovery.
- Device matrix: real iPhone Safari, Android Chrome, 320/390/430, keyboard, screen reader, reduced-motion and performance of GPU fallback.
- Independent uncoached use and A→B→C continuation, consent, retention, operator controls and abuse protection remain blocked under Product Depth & Live Reality.

## Verdict

- `V1.4_RIVE_TECHNICAL_PREVIEW=PROVEN`
- `V1.4_NEON_STAGING_HAPPY_PATH=PROVEN`
- `V1.4_DESKTOP_VISUAL_NARRATIVE=REWORK`
- `V1.4_REAL_MOBILE_ACCESSIBILITY=BLOCKED`
- `V1.4_PRODUCT_DEPTH_PRODUCTION=BLOCKED`
- `V1.4_ORGANIC_VIRALITY=UNKNOWN`

Next step: V1.5 causal inline ink and coherent multi-stage composition, built in a separate draft feature branch, with independent live and negative-path testing. No automatic merge, no production promotion, no silent gateway status change.
