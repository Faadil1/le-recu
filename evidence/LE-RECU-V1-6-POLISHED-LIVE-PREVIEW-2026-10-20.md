# LE REÇU V1.6 — final interactive-product polish / live Preview QA

Date: 2026-10-20. Classification: **LIVE STAGING + AUTOMATED BROWSER SCREENSHOTS**, not production, device hardware, or independent adoption.

## Exact application/runtime binding

- Vercel project: `le-recu-invite-beta` / account scope `faadil1s-projects`, **Preview**.
- Deployed application commit: **`c5513849bfd8495e21512bf62744c32501824ebe`**.
- Deployment ID: **`dpl_FcbTR68NmCV8rfN8SxWrkKwLwgp7`**, READY.
- Immutable URL: https://le-recu-invite-beta-jcekvzs1f-faadil1s-projects.vercel.app/
- Existing encrypted Neon staging Preview DB; neither DB schema nor production credentials changed.
- No releases/merges. PR #4 remains draft, based on V1.5 PR #3 branch.

## Product defects corrected after first V1.6 visual pass

1. **Stale deletion message** blocked and cleared once a new chosen/active duel starts. Previously a live pending challenge could coexist visually with an earlier "deleted" status.
2. **Same-sheet revelation:** verified, compact `data-duplex-reveal` above actual cost list; **creator-first, responder-second** on both browsers. Actual Rive ink stays on measured chosen rows. No new V1.6 Rive binary was compiled.
3. **Share hierarchy:** one primary responsive PNG action. Sticky at 390px mobile, in the contextual action section at 1100 and 1440px. Secondary copied results, native text share, and participant erase under a collapsed accessible group.
4. **Canonical portable text:** `duelCopy` now says `01 / PREMIER REFUS` and `02 / SECOND REFUS` (or English equivalents). Both participants copy **identical text in the same language**, matching the actual first/second sequence in PNG. Never flips `them/you` depending on viewer. Locale unit regression added.
5. **Intermediate desktop/tablet composition:** 768–1239px viewport now gets a 740px-max enlarged physical paper, instead of the ~350px-wide isolated phone layout. Three-column editorial composition activates only above 1239px, when it fits.

## Live browser proof

- [GitHub Actions #39485018615](https://github.com/Faadil1/le-recu/actions/runs/39485018615) — **SUCCESS**, test-script/workflow checkout SHA `bfdc2d53797e62ae2616e4d1513075c7e20c3e47`; this is a later **QA-only** commit than the deployed app SHA.
- Install, real Rive compiled binary provenance check, TypeScript and full product tests passed. Independent headless Chromium loaded and exercised actual Rive on the hosted chosen cost row; reduced-motion fallback also passed.
- External FR creator → EN guest on actual Neon staging, verified canonical reveal, both browsers switched to FR and copied the **exact same text**, exported FR and EN real 1080×1350 PNGs; unauthorized outsider blocked; participant-authorized server deletion verified; next cost choice had no stale deletion message.
- Full-page screenshot QA at 390px mobile, 1100px intermediate, 1440px desktop; horizontal overflow checks at both desktop widths passed.
- Downloadable GitHub artifact `le-recu-v1-6-rive-neon-same-sheet` artifact ID **12293137089**, stored 7 days; contains screenshot PNGs and PNG poster exports.
- Visual inspection of actual `duplex-fr-1100.png` after CSS pass confirms the receipt uses much more available width while remaining readable. Mobile screenshot shows the fixed safe-area action without an extra visible primary action.

## Explicitly not proven

- A new, compiled V1.6-specific Rive pressure/contact/regeneration choreography: **NOT_IMPLEMENTED**. Current .riv remains V1.5 generated engine, successfully reused by the V1.6 layout.
- Real iPhone Safari / Android Chrome / VoiceOver/TalkBack: BLOCKED.
- Production-grade purge/retention, read abuse defense, token identity resistance, durable opt-in history and protected operator system: BLOCKED.
- Independent two-human sustained return value, uncoached usability and actual organic A→B→C chain: UNKNOWN.
- Negative-path and repeated same/different **LIVE** reliability beyond proven happy-path: PARTIAL.

See `product/LE-RECU-V1-6-SECOND-IMPRESSION-RIVE-DELTA.md` for actual Rive CLI creative build scope. Product Depth & Live Reality production promotion stays BLOCKED. No gate silently omitted or promoted.
