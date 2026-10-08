# LE REÇU — Comparative Prototype / Independent Pilot Plan

Date: 2026-10-08  
Status: **PREDECLARED RESEARCH DESIGN — NOT EXECUTED**  
Companion audit: `product/LE-RECU-PRODUCT-REALITY-AUDIT-2026-10-08.md`.

## Decision being tested

Does LE REÇU offer a real, memorable and naturally shareable social experience **because of the different personal prices of the same desire**—or does it merely reproduce a generic vote-and-compare game with better art direction?

Do not put “viral”, “secure”, “live community” or “a real human voted” on a screen without corresponding measured evidence.

## Comparable concepts

- **A — Current Receipt:** present app's five costs, one refusal, link, side-by-side comparison, with P0 functional defects repaired before participant validation. This is not a “bad control”; it must work correctly.
- **B — Duplex Receipt:** same five costs, same desire, same number of choices and same backend; on independent second commitment, a second printed layer physically collides with the first, resulting in a single memorable two-person object.
- **C — Counter-Receipt:** same choices and social truth, but a reverse-side tear-off reveals the cost each person most refuses. Distinct tactile consequence; same friction and content quality as A/B.

Do not run a visual preference poll comparing only screenshots. Differences must be in the actual consequence and participant interpretation, not differences in typography quality.

## Required technical preflight before claiming cross-device live participation

- No pre-commit leak via share text, preview, URL or accessible metadata.
- Opaque server challenge + two valid distinct response state transitions with idempotency and expiry.
- Immutable `cost_id` set and coherent aggregate identity.
- A truly persistent shared database; successful cross-device, cross-instance and after-restart tests.
- Proper behavior for expired, reused, modified or malformed invites, outages and missing privileges.
- No fabricated seed votes, no undocumented replay as live evidence.
- Correct mobile screenshot and full keyboard navigation.

Until P0 is repaired, **run only clearly labeled moderated concept/usability trials**, not a claim of functional live social comparison.

## Initial exploratory study (a starting plan, not a fixed cap)

Recruit 8 distinct pairs (16 consenting adults), with balanced first exposures across viable arms after the code preflight. No participant receives multiple concepts before their initial unaided feedback. Use at least two unfamiliar pairs, not only friends of the creator. Expand only if observations are contradictory, not to hunt for a favorable metric. Do not solicit intimate details, publicize desires without consent or pressure recipients to reply.

Neutral opening: “Try this short decision experience however feels natural. If you feel comfortable, share the challenge with your partner; I’ll ask what you think happened afterward.”

Capture:
1. Is the first interactive action found without instruction within roughly five seconds after render?
2. Can participant describe the rule (“five costs / refuse one”) accurately?
3. Was there any accidental reveal of the other person's refusal before individual commitment?
4. Did the second participant really follow an independent link and choose?
5. Did the eventual comparison produce an actual difference, surprise, agreement or conversation?
6. What artifact, if any, would they share without prompting and why?
7. Did anyone interpret the “room” as representative data? Correct language and record confusion.
8. Was the experience distressing or coercive? Provide immediate skip/exit.
9. How long from opened link to first refusal; how long from invite to independent response?

## Instrumentation definitions (aggregate, consent-aware)

- **eligible_start:** legitimate receipt opened by a distinct session, excluding bots/diagnostics where possible.
- **first_refusal:** explicit first human action persisted.
- **invite_issued:** valid challenge created.
- **invite_opened:** independent recipient accepted challenge link.
- **second_refusal:** valid server-recorded, independent respondent commitment.
- **duel_completed:** both valid commitments joined and displayed after correct reveal.
- **share_intent / actual_share:** never equate opening a share sheet to confirmed external sharing.
- **organic_next_invite:** next unique invitation from a respondent, without paid/self traffic.

Report funnel counts by truthful denomination, not solely conversion rates. Separate in-app intentions, actual observable writes, inferred off-platform sharing and unknown conversion. Do not track full raw free-text desires or sell a psychological profile.

## Qualitative promotion signals

Promising when multiple independent pairs, without coaching:
- say why two *prices* mattered (not just “I chose red or blue”);
- recognize that the recipient choice was genuinely independent;
- find the final object understandable outside the app;
- voluntarily want to discuss or reuse it;
- demonstrate a working recovery and no high-impact privacy/trust issue.

REVISE when the five costs feel contrived, the recipient doesn't understand what they are refusing, the comparison feels unsurprising or meaningless, or a stronger share design worsens usability.

KILL a variant if it requires spoiler-filled text to recruit a respondent, fake data, coercive emotional disclosure, an inaccessible interaction or a visually impressive but causally empty receipt.

## Reality / evidence contract

Mark every result OBSERVED, INFERRED or UNKNOWN. Retain raw sanitized participant language as received. Screenshot and video from a test browser prove an interface path, not viral distribution, repeat retention or a real community. Mark prototype vs staging vs live with the exact commit and runtime link. One successful pair proves only that one pair completed.

## Gate after pilot

A product direction can be recommended, not locked, after:
- code safety and duel integrity verified;
- comparable independent pilot complete;
- participant quotes and actual events reconciled;
- no critical blind/privacy/durability failures;
- competitive novelty and name collision research refreshed;
- human owner explicitly decides scope before final design/build.

No deployment, merge or release is authorized by this document.
