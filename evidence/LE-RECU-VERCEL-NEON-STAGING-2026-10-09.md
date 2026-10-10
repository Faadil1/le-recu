# LE REÇU — Vercel Preview / Neon Staging Deployment Evidence

Recorded: 2026-10-09 UTC  
Status: **BUILD DEPLOYED / LIVE CORE LOOP UNVERIFIED / DO NOT MERGE OR PUBLICLY PROMOTE**

## Deployment truth

Vercel account: `faadil1's projects` (connected main Vercel workspace).  
New **isolated project**: `le-recu-duplex-preview`, ID `prj_qQKX0cUEcuiRnppPX0XXRGlU8rsj`.  
GitHub source: `Faadil1/le-recu`, PR #2, branch `build/duplex-blind-duel-v1`.  
**Exact deployed commit:** `c057a1e26e94757ed8945458533dd6a18271bd8b`.

### Actual Vercel Preview

- Deployment ID: `dpl_BKm8cphEHNpes9HZjMXzMJgxJJZs`
- URL: `https://le-recu-duplex-preview-gn1mi0uii-faadil1s-projects.vercel.app/`
- Vercel state: `READY`, target `null` (Preview target inferred from deployment configuration), regional functions: `cle1`.
- Preview alias: `le-recu-duplex-preview-git-build-duple-9795f9-faadil1s-projects.vercel.app`.
- Server-side Vercel `DATABASE_URL`: created as encrypted environment variable **targeting preview only**, validated from project environment listing. Never recorded the privileged URL in GitHub or text.
- Neon: project `broad-sunset-79790814` / branch `br-shy-field-b425j1zd` (`le-recu-staging`) / database `neondb`; region AWS `us-east-2`.
- Neon schema verified: `_migrations`, `strikes`, `duels`; migration ledger contains `0002_strikes.sql`, `0003_duels.sql`; application tables initially empty.
- Build event stream showed Nitro/Vercel SSR bundle generation and the separate Vercel deployment reached `READY`.
- Code CI at the exact deployed commit: [GitHub Actions](https://github.com/Faadil1/le-recu/actions/runs/37865097187) SUCCESS (typecheck, focused product tests and build).

### Anomalous first Vercel deployment — preserved accurately

The first Vercel API call included `target: "preview"`, but Vercel reported **production**, not Preview, for the brand-new isolated project:
- Initial deployment: `dpl_d2EQ8V8ZKz1hw5dk7jVtnren797B`
- URL: `https://le-recu-duplex-preview-k8wfclma2-faadil1s-projects.vercel.app/`
- Target: `production`, status `READY`; associated production aliases `le-recu-duplex-preview.vercel.app` and `le-recu-duplex-preview-faadil1s-projects.vercel.app`.
- Cancellation was attempted, but the platform returned `deployment_not_canceled` after it had become ready. **No existing outside project or canonical GitHub main was changed.**
- The `DATABASE_URL` secret is **preview only**, not production; production-targeted initial deployment does not have the staging Neon credential. Room/duel functions explicitly fail closed in production without persistent Postgres.
- A second Vercel call **omitted** the target value and the new deployment was correctly registered as Preview.
- **Do not mistake the initial production-targeted deployment for a production-ready product.** Isolated project's automatic production aliases remain and require deliberate cleanup/protection before external public announcement.

### Verification boundaries

**OBSERVED:** Neon schema and ledger, staging isolation, Vercel preview secret metadata, deployed commit↔URL binding, Vercel READY status, successful build, generated Nitro SSR assets.

**NOT OBSERVED:** public HTTP/S response from the app, in-browser hydration, SSR content, actual runtime DB connection from Vercel, browser A→B distinct participant choice, unique-row persistence, expired/forged/duplicate link behavior, iOS share-sheet and PNG export, keyboard / mobile QA and external-user comprehension.

Automated external URL fetch from available runtime failed (not a 200/400 app-specific result); no live session was successfully exercised. Vercel runtime log query returned no requests at the time it was checked. **READY is build/deployment metadata, not a live product claim**.

## Immediate next step

Open the **Preview URL**, not the isolated project's production aliases. On Browser A, select a public desire → refuse a cost → *Sceller mon choix* → *Envoyer le défi*. On Browser B/private context, open the copied invite and commit a different cost before any reveal. A then clicks *Vérifier la réponse*. Compare both receipts, test PNG export, check keyboard and one narrow mobile device. Capture exact results or errors; only then classify real browser/DB path as LIVE VERIFIED.

On verified browser flow, add server-side rate limits, consent/retention/automatic cleanup, abuse defense, visual Product Design assurance and independent uncoached pair trial. This deployment is an isolated staging test and **is not approved for general public use**.
