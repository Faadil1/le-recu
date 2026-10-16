# LE REÇU V1.5 — Live isolated Vercel Preview / Neon staging proof

Date: 2026-10-16. **App code deployed by exact commit**, distinct from later QA workflow and documentation commits.

## Runtime binding

- Project: `le-recu-invite-beta`, Vercel team `faadil1s-projects`, Vercel Preview (not production).
- Immutable deployment: `dpl_3es2rSQHMF9tc8GioZ9iFBrsYZiQ`
- **Deployed application SHA: `c1254bc7d44e880cec26fe8c009da7323720621f`**.
- Immutable URL: https://le-recu-invite-beta-3mh044t9y-faadil1s-projects.vercel.app/
- Branch alias: https://le-recu-invite-beta-git-design-rive-in-0301be-faadil1s-projects.vercel.app/
- Host externally accessible without Vercel team login. `/` HTTP 200, `/rive/le-recu-paper.riv` HTTP 200. `noindex,nofollow,noarchive`, `Referrer-Policy: no-referrer`.
- Rive byte asset: 14,043 B in tracked `public/rive`, same resource is served by Preview. No external Rive editor publication or production DB was necessary.
- `DATABASE_URL` is an encrypted **Preview** environment variable of the existing isolated Vercel project. Values were not disclosed or changed.

## Independent hosted QA

- Run [#38888528402](https://github.com/Faadil1/le-recu/actions/runs/38888528402): **SUCCESS**.
- The run's checkout SHA `021276e6540aa1c7ba40c164517679a5ccb262d1` differs only by the workflow change that allowed this run and pinned its target URL. **Tests target the immutable deployed application SHA `c1254bc7...`**, not an assumed branch HEAD deployment.
- `npm ci`, `npm run rive:check`, `npm run typecheck`, `npm run test:product`: PASS, 43 product tests / zero failures.
- Hosted Chromium smoke: actual self-hosted compiled Rive canvas loads, local cost choice updates the visual phase, and `prefers-reduced-motion` has a non-canvas semantic twin. PASS. This basic live smoke asserts row index `data-ink-first=2`; exact red pixel/geometry assertions were run locally earlier, **not independently remeasured on the hosted live build**.
- Real external staging Neon E2E: FR creator commits → EN independent browser replies → both compare, export FR+EN PNG 1080×1350 → outsider denied private duel data → server-confirmed participant deletion. PASS.
- Uploaded screenshots and exports: workflow artifact `le-recu-v1-5-live-rive-neon` (artifact ID `12040223199`, seven-day configured retention). Files include `rive-v1-5-idle-390.png`, `rive-v1-5-ink-390.png`, `rive-v1-5-reduced-320.png`, `duplex-fr-mobile.png`, `duplex-en-mobile.png`, and 1080×1350 posters FR/EN. Actual artifacts were inspected following the run.

## Design observations from actual hosted screenshots

- **Progression proved visually:** in the real 390px mobile screenshot the red Rive brush appears on the third chosen cost line, not in a separate strip. In completed duplex screenshot, distinct first and second refusal marks appear within the same cost sheet and the verdict is rendered below.
- The final output remains intentionally more restrained than the generative art reference. Needs real iPhone touch, font rendering, sound judgement, cold-start timing and accessibility review.
- The 390px viewport has a fixed mobile next-action bar; full-page Playwright screenshots show it at capture position while the entire scrollable page is stitched. This is not, on its own, proof of an overlap bug in a normal viewport.
- Further visual refinement (especially desktop composition, legibility under the stroke, native mobile share, response reveal while off-screen) remains open. Do not equate screenshot pass with exceptional design.

## Integrity and release boundary

`V1_5_REAL_RIVE_HOSTED = PROVEN`; `V1_5_LIVE_STAGING_A_TO_B = PROVEN` for this deployed SHA and automated path; `V1_5_SAME_AND_DIFFERENT_LIVE_REPEATED_REGRESSION = PARTIAL` (local cases exist, only one distinct live flow in this CI); `V1_5_PRODUCTION_RELEASE = BLOCKED`; `V1_5_HARDWARE_IOS_ANDROID = BLOCKED`; `V1_5_INDEPENDENT_HUMAN_VALUE = UNKNOWN`.

No merge; original PR #2 remains draft and V1.5 PR #3 remains draft. Production gates in `product/LIVE-PRODUCT-REALITY.json` are not promoted by this evidence. Neon production untouched. No automated purging, read-side defenses, authenticated operator console or independent long-term adoption is asserted.
