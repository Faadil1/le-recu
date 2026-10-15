# LE REÇU V1.3 — Real Preview Visual and Product E2E Evidence

Reviewed: **2026-10-11 UTC**. Classification: **LIVE / STAGING / AUTOMATED**, plus direct screenshot inspection, not production or human adoption.

## Runtime / artifact binding

- Public isolated **Vercel Preview** project `le-recu-invite-beta`; stable branch alias: `https://le-recu-invite-beta-git-build-duplex-b-ec73a7-faadil1s-projects.vercel.app/`.
- Exact deployed **application SHA**: `6dd6ea12750bfc351a64b387bba7b46ef5829171`.
- Vercel Preview deployment ID: `dpl_JDHM328fFBzJ2qos6YzA1ihko65X`, READY / Preview target, never production.
- Enhanced E2E test script SHA: `6118d6e4d2dcbdc4405d1e747bb814aa1dc72b66`.
- [Live E2E run #38116810151](https://github.com/Faadil1/le-recu/actions/runs/38116810151): **SUCCESS**.
- QA artifact `le-recu-live-beta-fr-en` (ID `11693771504`, GitHub retention 7 days). Exact files captured: `duplex-fr-mobile.png` and `duplex-en-mobile.png` (390px mobile full-page), `duplex-poster-fr.png` and `duplex-poster-en.png` (1080×1350 RGBA). The screenshots were opened and inspected in this review session.

## Real events checked

1. FR browser selects a refusal → **Neon-issued creator challenge** → server returns an opaque invite.
2. EN browser context opens same invite → creator choice is **not displayed** → independently commits a different cost → both get their correct result.
3. Phase rail is derived from real choices (choose, seal, confirmed reveal). No old local `spectacle` state can invent an actual duplex.
4. `THE ROOM` collective vote drawer stays **collapsed** and does not confuse an actual finished duplex with “no responses”.
5. Owner sees a mobile sticky share action only after legitimate two-sided completion. Both PNGs produce valid PNG signature and exact 1080×1350 dimensions.
6. Third non-participant opens closed link → cannot view `.duplex-imprint`, sees no active progress step and is offered a new receipt.
7. Participant-authorized deletion succeeds, confirmed by Playwright before teardown.

## Direct visual inspection

- **Strong:** editorial paper, deliberate ink hierarchy, unambiguous role/choice lines, restrained rough mark, contained double-ring verdict, legible 4:5 FR/EN export, matched color system across page and image.
- **Improved after screenshot audit:** optional room voting was moved outside personal receipt to a collapsed section; share action after server-confirmed reveal stays discoverable on mobile.
- **Not independently proven:** native iOS Safari Web Share; 320/430px hardware; exact long-label scaling of all canonical cost permutations, screen readers and keyboard-only actual use, reduce-motion device QA, independent 5-second comprehension.
- **Difference from the generative art-direction reference:** original hand-painted roughness is a target; Canvas output is intentionally a more disciplined production rendering. Do not pass off the illustrative concept art as a real application screenshot.

## Product Depth & Live Reality — still hard-blocked

There is no human adoption proof, no fully consented user history across devices, no durable optional private conversation, no genuine observed A→B→C chain, no robust read-rate defense or Sybil-proof identity, no guaranteed scheduled data purging, no room-vote deletion, and no authenticated operator console. The release gate remains **BLOCKED**; one green E2E or even this green E2E with PNG does not prove reliability over time.

**Truth boundary:** V1.3 work is validated as an isolated live-staging product change with a real Neon path and images. It is not final public production, not mature privacy compliance, not a measurable viral mechanism, and not permission to merge PR #2.
