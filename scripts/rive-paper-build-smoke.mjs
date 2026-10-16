// LOCAL smoke test of a PRODUCTION BUILD (vite build + vite preview) of the Rive integration.
//   RIVE_E2E_URL=http://127.0.0.1:4173/ node scripts/rive-paper-build-smoke.mjs
// A built server fails closed without a persistent database ("persistent database isn't configured"),
// so this checks what a build can prove without Neon: bundled assets resolve (lazy chunk, wasm, .riv),
// the Rive canvas goes live, the fallbacks engage, and a Seal that the server refuses shows the *failed*
// paper -- never a seal. Full duel flows against a database are covered by rive-paper-e2e.mjs (dev/PGlite)
// and need a deployed Preview with Neon staging to be LIVE (not done here).
import assert from "node:assert/strict"
import { mkdirSync, writeFileSync } from "node:fs"
import { chromium } from "playwright"

const BASE = process.env.RIVE_E2E_URL
if (!BASE || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/.test(BASE)) throw new Error("RIVE_E2E_URL must be a local preview URL")
const results = []
const step = async (name, fn) => {
  try { const d = await fn(); results.push({ name, ok: true, detail: d ?? "" }); console.log(`PASS  ${name}${d ? "  " + d : ""}`) }
  catch (e) { results.push({ name, ok: false, detail: String(e.message).split("\n")[0] }); console.log(`FAIL  ${name}  ${String(e.message).split("\n")[0]}`) }
}
const args = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
const browser = await chromium.launch({ headless: true, args })
const errors = [], notes = [], foreign = new Set(), requested = []
// `vite preview` serves .wasm without the application/wasm MIME type; the runtime logs it and falls back to
// ArrayBuffer instantiation (still works). Vercel's static host serves the correct type. Recorded, not hidden.
const KNOWN_PREVIEW_WASM_MIME = /wasm streaming compile failed|falling back to ArrayBuffer/
const watch = (page) => {
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => {
    if (m.type() !== "error" && m.type() !== "warning") return
    if (KNOWN_PREVIEW_WASM_MIME.test(m.text())) { notes.push(m.text().slice(0, 140)); return }
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(m.text())
  })
  page.on("request", (r) => { const u = new URL(r.url()); requested.push(u.pathname); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname)) foreign.add(u.origin) })
}
const phase = (p) => p.locator(".ink-overlay").getAttribute("data-ink-phase")
const waitPhase = (p, v, t = 20000) => p.waitForFunction((x) => document.querySelector(".ink-overlay")?.getAttribute("data-ink-phase") === x, v, { timeout: t })

await step("production build: Rive canvas goes live from bundled, self-hosted assets", async () => {
  const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
  const p = await ctx.newPage(); watch(p)
  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
  await p.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
  await p.waitForFunction(() => document.querySelector(".ink-overlay")?.getAttribute("data-ink-live") === "true", null, { timeout: 30000 })
  assert.ok(requested.some((u) => /\/rive\/le-recu-paper\.riv$/.test(u)), "the .riv was requested")
  assert.ok(requested.some((u) => /\.wasm$/.test(u)), "a bundled wasm was requested")
  const rive = [...foreign].filter((o) => /unpkg|jsdelivr|rive\.app|cdnjs/i.test(o))
  assert.deepEqual(rive, [], "no third-party Rive runtime")
  await p.locator(".line-btn").nth(1).click()
  await waitPhase(p, "ink")
  assert.equal(await p.locator(".ink-seal-a").count(), 0)
  await p.locator("[data-actions]").getByRole("button", { name: /Seal my choice/ }).click()
  await waitPhase(p, "failed", 30000)
  assert.equal(await p.locator(".ink-seal-a").count(), 0, "a refused seal is never drawn")
  assert.ok((await p.locator("[role=alert]").count()) > 0, "the failure is stated in text")
  await ctx.close()
  return `${requested.filter((u) => /wasm|\.riv$/.test(u)).join(", ")}`
})

await step("production build: reduced motion mounts no canvas", async () => {
  const ctx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
  const p = await ctx.newPage(); watch(p)
  await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
  await p.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
  await p.waitForFunction(() => document.querySelector(".ink-overlay")?.getAttribute("data-ink-mode") === "fallback-reduced")
  assert.equal(await p.locator(".ink-canvas").count(), 0)
  await ctx.close()
})

await step("production build: no console or page errors", async () => { assert.deepEqual(errors, []) })
await browser.close()
mkdirSync("evidence/rive-v1-4", { recursive: true })
writeFileSync("evidence/rive-v1-4/rive-paper-build-smoke-result.json", JSON.stringify({
  evidence_class: "LOCAL (production build, vite preview; no database)", base: BASE, ran_at: new Date().toISOString(),
  known_preview_notes: [...new Set(notes)], results,
}, null, 2))
process.exit(results.every((r) => r.ok) ? 0 : 1)
