# LE REÇU — V1.3 full-product visual + product-depth review

Date: 2026-10-11  
State: **Design/code iteration on draft PR #2 — LIVE QA required, NO public release**

## Product hypothesis

LE REÇU is a physically legible comparison of two people's **independent refusal of a price** for the same desire. The interesting product is not the receipt as decoration. It is the journey:

**a desire → five concrete consequences → one committed refusal → blind second refusal → genuine conflict or convergence → an optional conversation / invitation to continue.**

A world of fake social counters, seeded comparisons or empty archive cards would hollow out this core. The signature red ink must reflect an actual committed choice and the double imprint an actual second server answer. Neon remains the system of record.

## Design decision — Paper Under Pressure

Keep the selected aggressive editorial direction, but exercise editorial control rather than adding random grime. Align the entire product to a single physical grammar:

| Product moment | Mechanically honest visual | User value |
| --- | --- | --- |
| Enter / choose | Quiet cream paper, four-step progress rail with real phase, a visible selection prompt | Understand what the object does without onboarding |
| Refuse | Actual crossed line; red ink means a committed/refused price, not mere decoration | See the specific personal consequence |
| Seal | Circular red stamped event and a durable server-held creator choice; clear next step | Acknowledge that decision has consequence |
| Invite / wait | Dark exterior stage and clear current status; no fabricated response | Understand share versus delivered and pending |
| Second choice | Same canonical five costs, first choice hidden until atomic commit | Blind consent and surprise retained |
| Reveal | Second impression with actual two rows, strong verdict and honest same/different case | Meaningful comparison, not a chart |
| Export | 4:5 editorial poster, canonical first/second order, ink bristles and carefully broken double ring | The same shareable object from both browsers |
| Return | New current-day choice, explicitly limited local receipt history | Continue voluntarily without misleading persistence |

### Micro-polish from selected visual

1. **Brush strokes** are controlled (one 8.5px bristle pass, fine companion passes and approximately fourteen small fragments near the ends). No gore-like excess, and both declined costs are marked from actual recorded indices.
2. **Verdict seal** grows to an approximately 236px outer diameter, double-ring with slight misregistration, verdict centered on two lines inside; it cannot overrun the circle.
3. **Bottom question** uses deliberate mono letter spacing and sits beneath the verdict, without overlapping the perforated edge. Bilingual lengths are clamped.
4. **Canvas rendering waits for loaded local typefaces**, preventing early fallback-font PNG changes after Safari loads.

The generated illustrative reference is an art-direction target, **not** a screenshot or a proven live export. PNG behavior must be verified on the actual deployed V1.3.

## Implemented code scope

- `src/lib/duel-image.ts`: actual Canvas 4:5 design treatment with deterministic wear rather than random per-export results; both red strikes, authority of seal, letter-spaced question, font readiness and long-text scaling.
- `src/styles.css`: shared tactile language across product phases, responsive editorial desktop composition, stronger in-paper comparison, touch/focus states, motion reduction.
- `src/lib/experience-state.ts` and focused tests: derive visual stage from the **real** server role and status. Old browser-local state cannot create a counterfeit complete duel. Expired, closed or missing invite is not represented as active.
- `src/components/receipt-app.tsx`: stage rail, clearer selection/next-action, shortened initial onboarding note, full data explanation before seal, an accessible recovery action, and mobile sticky CTA retaining a short storage disclaimer.
- `src/lib/locale.ts`: FR/EN labels for actual states and editorial lines.

## Product-depth audit: what is actually good vs not good

| Capability | Evidence classification | Current evaluation |
| --- | --- | --- |
| Live blind A→B commit→compare on Neon staging | LIVE STAGING / previous deployed SHA | **PROVEN for limited runs**, not a production claim |
| Exact creator/responder and stable 4:5 poster roles | LOCAL tests / earlier browser QA | Built; V1.3 artwork unverified on devices |
| FR/EN two-browser comparison | LIVE STAGING / earlier SHA | Positive happy path, fresh visual regression still required |
| Public beta URL without Vercel team auth | LIVE EXTERNAL READ | Real usable entry, not production hardening |
| Honest room participation | CODED + database | Opt-in; same browser token is not a unique person |
| Participant-authorized duel deletion | LIVE STAGING / previous QA | Confirmed on previous build; room-vote deletion still missing |
| Public safe invite/share chain A→B→C | NOT PROVEN | New round available; true organic continuation and referral source not measured |
| Deep returning-user archive | NOT IMPLEMENTED | Browser-local cache only; no authenticated cross-device archive |
| Conversation after disagreement | NOT IMPLEMENTED | No private consented discussion |
| Abuse/read throttling, Sybil resistance | PARTIAL | Write caps present; no verified robust read protection |
| Retention/cleanup | BLOCKED | 72h response expiry is NOT automatic row removal |
| Operator controls and observability | BLOCKED | Runbook and SQL, not a protected operator product |
| Mobile, assistive-tech, reduced-motion and English typography QA | PARTIAL | CSS/code present, no full external device acceptance |
| Independent user value / repeat engagement | UNKNOWN | No uncoached longitudinal observations or credible virality claim |

## Non-negotiable P0 acceptance

**Product Depth & Live Reality**
- New A→B tested against deployed exact SHA, not an earlier build or local mock.
- Second choice hidden until its actual Neon transaction succeeds. Same role/indices on both independently opened browsers.
- Concurrent responder requests, read-only guest, malformed and expired link, storage blocked, depleted global budget, database outage and deletion are each classified by observed outcomes.
- Public beta safety: fully consented storage, guaranteed retention/deletion and dedicated operator recovery. Room votes must be independently removable. Never say "72h deletion" while only answer validity is 72 hours.
- Screenshots and 4:5 PNG from real iOS/Android/desktop, bilingual text-fit and accessibility must be checked.
- A third independent participant actually completes a fresh new challenge before calling `The Chain` LIVE.

**Visual experience**
- The same paper language on entry, selection, committed wait, duplex reveal, aftercare and archive.
- No generic card dashboard, confetti, seed-only dynamic counters, or template aesthetic.
- 5-second uncoached understanding and visible next action on common mobile heights.
- Exact 1080×1350 PNG: all ink and text inside bounds in both languages, long lines scaled legibly, no duplicate share text, no visual-only disabled buttons.

## Release decision

**BLOCKED** under `product/LIVE-PRODUCT-REALITY.json`. This is a scoped design/product pass on the **draft** branch. Existing public beta remains an earlier deployed commit until a new exact-commit preview and successful regression are observed. No merge/production promotion authorized.

Next build should be a tested **product** increment, not additional dramatic imagery: complete E2E V1.3 validation, negative-path suite, retention and operator safeguards, then voluntary A→B→C and return-value trials. 
