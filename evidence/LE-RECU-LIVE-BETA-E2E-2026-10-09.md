# LIVE Beta E2E — two real browser trajectories, 2026-10-09 EDT

**Environment:** Publicly readable Vercel **Preview**, project `le-recu-invite-beta`, stable Git-branch alias `https://le-recu-invite-beta-git-build-duplex-b-ec73a7-faadil1s-projects.vercel.app/`. React runtime SHA: `2ffb3020bc7b59173348d2dfa8443e91ba1593ea`; later GitHub commits only added evidence/test scripts and did not redeploy this app.

**Automated proof, NOT organic adoption:**
- [Live browser QA run 1](https://github.com/Faadil1/le-recu/actions/runs/38011381558), SUCCESS.
- [Live browser QA run 2](https://github.com/Faadil1/le-recu/actions/runs/38011391793), SUCCESS.
- Both used Chromium with **two isolated browser contexts**, FR creator and EN recipient, against the actual public URL. No preview authentication, token bypass or seeded result.
- Actual tested chain: read public page → creator independently refuses a line → server creates opaque duel → shareable URL has no Vercel grant → recipient in independent context opens invite → commits different line → both see Duplex reveal → language roles compared in FR and EN → creator exports original PNG → participant-authorized server deletion returns success.
- CI job log for each run prints `LIVE STAGING BETA PASS: external FR creator → EN recipient → Neon reply → both duplex views → PNG generated.` and `E2E teardown: server-confirmed participant-authorized erasure.`
- CI artifacts (retained 7 days) include `duplex-fr-mobile.png`, `duplex-en-mobile.png`, and `duplex-poster-fr.png` for QA review. [Artifact run 1](https://github.com/Faadil1/le-recu/actions/runs/38011381558) and [run 2](https://github.com/Faadil1/le-recu/actions/runs/38011391793); screenshots are **not yet independently judged for design quality**.
- Read-only Neon after both tests: 3 old staging duels remain, 1 completed; new test duels no longer present. Quota counters reflect create/reply activity. This supports actual database write→read→erase consequences.

**Database quota smoke proof:** Separate Neon staging transaction with isolated savepoint and a temporary test scope returned used=1, used=2 and then **no row** when the maximum of 2 was reached; rolled back its savepoint, readback verified 0 remaining test rows. This verifies the SQL UPSERT ceiling but does **not** establish real load, anti-Sybil or bounded read traffic.

**Deployment security:** Vercel accidentally attempted first deployment of this project as `production`; the deliberately fail-closed Product Reality build gate caused **ERROR**, not READY. The actual public beta deployment has `target=preview` and Vercel state READY. Original private staging project and Neon `production` untouched.

**Truth / scope boundaries**
- LIVE: an automated **external public HTML entry**, real Neon server-held A→B commitment on staging, dual-language client consequences, tested deletion, and generated PNG; two successful runs.
- NOT PROVEN: independent human comprehension, actual people distinctness, organic invitations, A→B→C chain, real retention, multi-device mobile Safari/Chrome, negative-path concurrency, anti-abuse load, read-rate protection, guaranteed auto deletion, user consent beyond disclosed copy, production integrations, operator UI and sustained usage.
- Our temporary public test link is **accessible to anyone**, subject to daily write budgets; it is not cryptographically invite-only. Do not mislabel it private or production safe.
- Product release and concept lock remain BLOCKED. One green run or two automated runs are not reliability, especially if only a happy path is exercised.

Keep these observations in the Product Reality Ledger and do not claim a judged final Day Challenge on this evidence alone.
