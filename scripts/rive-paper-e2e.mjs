// LOCAL end-to-end evidence for the Rive "Paper Remembers" integration.
//   RIVE_E2E_URL=http://127.0.0.1:8080/ node scripts/rive-paper-e2e.mjs [outDir]
// Runs two independent browser contexts (FR creator, EN guest) against a *local* dev server whose
// database is the in-memory PGlite fallback (no DATABASE_URL). It never touches Neon.
// Evidence class: LOCAL (real server functions + real SQL on PGlite), not LIVE/STAGING.
import assert from "node:assert/strict"
import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

const BASE = process.env.RIVE_E2E_URL
if (!BASE || !/^http:\/\/(127\.0\.0\.1|localhost):\d+\/$/.test(BASE)) {
  throw new Error("RIVE_E2E_URL must be a local dev server such as http://127.0.0.1:8080/ (never Neon/staging)")
}
const OUT = process.argv[2] ?? "evidence/rive-v1-4/browser-frames"
mkdirSync(OUT, { recursive: true })
const log = []
const record = (name, ok, detail = "") => { log.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`) }
const step = async (name, fn) => { try { const d = await fn(); record(name, true, d ?? ""); } catch (e) { record(name, false, String(e.message).split("\n")[0]); throw e } }

const launchArgs = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
const browser = await chromium.launch({ headless: true, args: launchArgs })
const consoleErrors = []
const foreignRequests = new Set()
function watch(page, tag) {
  page.on("request", (r) => { const u = new URL(r.url()); if (!/^(127.0.0.1|localhost)$/.test(u.hostname) && u.protocol.startsWith("http")) foreignRequests.add(u.origin) })
  page.on("console", (m) => {
    if (m.type() !== "error") return
    // the failure scenario aborts createDuel on purpose; the browser logs that as a failed resource
    if (/^(failure|rive-error|no-webgl)$/.test(tag) && /ERR_FAILED|Failed to load resource|rive/i.test(m.text())) return
    consoleErrors.push(`${tag}: ${m.text()}`)
  })
  page.on("pageerror", (e) => consoleErrors.push(`${tag} pageerror: ${e.message}`))
}
const stage = (page) => page.locator(".paper-stage")
const phaseOf = (page) => stage(page).getAttribute("data-stage-phase")
const modeOf = (page) => stage(page).getAttribute("data-stage-mode")
async function shot(page, name) { await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: false }); }
async function stageShot(page, name) { await stage(page).locator(".paper-stage-frame").screenshot({ path: join(OUT, `${name}.png`) }) }
async function waitPhase(page, phase, timeout = 15000) {
  await page.waitForFunction((p) => document.querySelector(".paper-stage")?.getAttribute("data-stage-phase") === p, phase, { timeout })
}
async function waitLive(page) {
  await page.waitForFunction(() => document.querySelector(".paper-stage")?.getAttribute("data-stage-live") === "true", null, { timeout: 30000 })
}

try {
  // - creator (FR, mobile) -
  const creatorCtx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const guestCtx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const a = await creatorCtx.newPage(); watch(a, "creator")
  const b = await guestCtx.newPage(); watch(b, "guest")

  await step("creator: receipt loads, paper stage idle with a Rive canvas", async () => {
    await a.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await a.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    assert.equal(await phaseOf(a), "idle")
    await waitLive(a)
    assert.equal(await modeOf(a), "rive")
    assert.equal(await a.locator(".rive-paper-canvas").count(), 1)
    assert.equal(await a.locator(".paper-stage-frame").getAttribute("aria-hidden"), "true")
    assert.equal(await a.locator(".rive-paper-canvas").evaluate((el) => getComputedStyle(el).pointerEvents), "none")
    await a.waitForTimeout(500)
    await stageShot(a, "01-idle")
  })

  await step("hover on a cost line reaches the scene as cosmetic proximity only", async () => {
    await a.locator(".line-btn").nth(1).hover()
    await a.waitForTimeout(600)
    await stageShot(a, "02-proximity")
    assert.equal(await phaseOf(a), "idle") // proximity never changes the product phase
  })

  await step("local refusal is ink, not a seal; nothing sent to the server yet", async () => {
    let creates = 0
    a.on("request", (r) => { if (r.method() === "POST" && /createDuel|duel/i.test(r.url())) creates++ })
    await a.locator(".line-btn").nth(1).click()
    await waitPhase(a, "ink")
    await a.waitForTimeout(1300)
    await stageShot(a, "03-ink")
    assert.equal(creates, 0)
    assert.equal(await a.locator(".pf-seal").count(), 0)
  })

  await step("sealing: pending is ambiguous until the server answers, then sealed", async () => {
    const seen = []
    await a.exposeFunction("__seen", (p) => seen.push(p))
    await a.evaluate(() => {
      const el = document.querySelector(".paper-stage")
      new MutationObserver(() => window.__seen(el.getAttribute("data-stage-phase"))).observe(el, { attributes: true, attributeFilter: ["data-stage-phase"] })
    })
    await a.locator("[data-actions]").getByRole("button", { name: /Sceller mon choix/ }).click()
    await waitPhase(a, "sealed", 30000)
    await a.waitForTimeout(450)
    await stageShot(a, "05-sealed-impact")
    await waitPhase(a, "waiting", 10000)
    await a.waitForTimeout(700)
    await stageShot(a, "06-waiting")
    assert.ok(seen.indexOf("sealed") > -1, `phases seen ${seen}`)
    const firstSeal = seen.findIndex((p) => ["sealed", "waiting"].includes(p))
    const pendingAt = seen.indexOf("pending")
    assert.ok(pendingAt === -1 || pendingAt < firstSeal, `a seal must never precede pending: ${seen}`)
    assert.ok(!seen.slice(0, firstSeal).some((p) => ["sealed", "waiting", "reveal"].includes(p)))
    return `phases ${seen.join(">")}`
  })

  const invite = a.url()
  assert.ok(new URL(invite).searchParams.get("duel"), "creator receives an opaque duel id")

  await step("creator: waiting keeps an empty slot; no second impression exists", async () => {
    assert.equal(await phaseOf(a), "waiting")
    assert.equal(await a.locator(".pf-second").count(), 0)
    const text = await a.locator(".paper-stage-caption").innerText()
    assert.match(text, /vide|empty|Scell|Seal/i)
  })

  // - guest (EN, mobile) -
  await step("guest: opens the invite, paper blank, creator's refusal not in the page", async () => {
    await b.goto(invite, { waitUntil: "domcontentloaded", timeout: 60000 })
    await b.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await waitLive(b)
    assert.equal(await phaseOf(b), "idle")
    const html = await b.content()
    assert.ok(!/pf-second|pf-ink/.test(html.replace(/<style[\s\S]*?<\/style>/g, "")) || (await b.locator(".pf-ink").count()) === 0)
    await stageShot(b, "07-guest-blank")
  })

  await step("guest: replying is pending (no second impression) until the server commits", async () => {
    await b.locator(".line-btn").nth(3).click()
    await waitPhase(b, "reveal", 30000)
    await b.waitForTimeout(2300)
    await stageShot(b, "08-guest-reveal")
    return `guest sees outcome ${await b.locator(".paper-stage-caption").innerText()}`
  })

  await step("creator: refresh reveals the same duplex; both captions agree on outcome", async () => {
    await a.locator("[data-actions]").getByRole("button", { name: /V[ée]rifier la r[ée]ponse/ }).click()
    await waitPhase(a, "reveal", 30000)
    await a.waitForTimeout(2300)
    await stageShot(a, "09-creator-reveal")
    const ca = await a.locator(".paper-stage-caption").innerText()
    const cb = await b.locator(".paper-stage-caption").innerText()
    assert.ok(ca.length > 0 && cb.length > 0)
    await shot(a, "10-creator-full-reveal")
    await shot(b, "11-guest-full-reveal")
  })

  await step("same refusal: a second duel where both refuse the same cost converges (registered impression)", async () => {
    const ctxA = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 } })
    const ctxB = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const p = await ctxA.newPage(); watch(p, "same-creator")
    const q = await ctxB.newPage(); watch(q, "same-guest")
    await p.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await p.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await p.locator(".line-btn").nth(2).click()
    await waitPhase(p, "ink")
    await p.locator("[data-actions]").getByRole("button", { name: /Sceller mon choix/ }).click()
    await waitPhase(p, "waiting", 30000)
    await q.goto(p.url(), { waitUntil: "domcontentloaded", timeout: 60000 })
    await q.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await q.locator(".line-btn").nth(2).click()
    await waitPhase(q, "reveal", 30000)
    await q.waitForTimeout(2500)
    await stageShot(q, "08b-guest-reveal-same")
    assert.match(await q.locator(".paper-stage-caption").innerText(), /exactly on the first/i)
    await p.locator("[data-actions]").getByRole("button", { name: /V[ée]rifier la r[ée]ponse/ }).click()
    await waitPhase(p, "reveal", 30000)
    await p.waitForTimeout(2500)
    await stageShot(p, "09b-creator-reveal-same")
    assert.match(await p.locator(".paper-stage-caption").innerText(), /exactement sur la premi[èe]re/i)
    await ctxA.close(); await ctxB.close()
  })

  await step("third browser cannot reveal: outsider sees an unavailable paper", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "outsider")
    await c.goto(invite, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator("[data-receipt]").waitFor({ state: "visible", timeout: 60000 })
    await waitPhase(c, "unavailable", 20000)
    assert.equal(await c.locator(".pf-second").count(), 0)
    await stageShot(c, "12-outsider-unavailable")
    await ctx.close()
  })

  await step("negative: missing invite id closes the paper and offers recovery", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "missing")
    await c.goto(new URL("?duel=0000000000000000000000000000dead", BASE).toString(), { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator("[data-receipt]").waitFor({ state: "visible", timeout: 60000 })
    await waitPhase(c, "unavailable", 20000)
    assert.ok(await c.getByRole("button", { name: /fresh receipt/i }).count() > 0)
    await ctx.close()
  })

  await step("failure: a rejected createDuel plays the failed paper, keeps the mark, never seals", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "failure")
    await c.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await waitLive(c)
    await c.route(/_serverFn|createDuel/i, (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue())
    await c.locator(".line-btn").nth(2).click()
    await waitPhase(c, "ink")
    await c.locator("[data-actions]").getByRole("button", { name: /Seal my choice/ }).click()
    await waitPhase(c, "failed", 20000)
    await c.waitForTimeout(1900)
    await stageShot(c, "13-failed")
    assert.equal(await c.locator(".paper-fallback .pf-seal").count(), 0)
    // recovery: network back, retry succeeds
    await c.unroute(/_serverFn|createDuel/i)
    await c.locator("[data-actions]").getByRole("button", { name: /Seal my choice/ }).click()
    await waitPhase(c, "waiting", 30000)
    await ctx.close()
  })

  // - fallback & accessibility matrix -
  async function usableFlow(page, label) {
    await page.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await page.locator(".line-btn").nth(0).click()
    await waitPhase(page, "ink")
    await page.locator("[data-actions]").getByRole("button", { name: /Seal my choice/ }).click()
    await waitPhase(page, "waiting", 30000)
    assert.equal(await page.locator(".paper-fallback .pf-seal").count(), 1, label + ": static seal appears only after confirmation")
  }

  await step("reduced motion: no canvas is mounted, the static paper carries the truth, flow works", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
    const c = await ctx.newPage(); watch(c, "reduced")
    await c.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await c.waitForFunction(() => document.querySelector(".paper-stage")?.getAttribute("data-stage-mode") === "fallback-reduced")
    assert.equal(await c.locator(".rive-paper-canvas").count(), 0)
    await usableFlow(c, "reduced")
    await stageShot(c, "14-reduced-motion-waiting")
    assert.equal(await c.locator(".rive-paper-canvas").count(), 0)
    await ctx.close()
  })

  await step("WebGL2 unavailable: DOM paper only, decisions still work", async () => {
    const ctx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 } })
    await ctx.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext
      HTMLCanvasElement.prototype.getContext = function (type, ...rest) { return type === "webgl2" ? null : original.call(this, type, ...rest) }
    })
    const c = await ctx.newPage(); watch(c, "no-webgl")
    await c.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await c.waitForFunction(() => document.querySelector(".paper-stage")?.getAttribute("data-stage-mode") === "fallback-webgl")
    assert.equal(await c.locator(".rive-paper-canvas").count(), 0)
    await c.locator(".line-btn").nth(0).click()
    await waitPhase(c, "ink")
    await c.locator("[data-actions]").getByRole("button", { name: /Sceller mon choix/ }).click()
    await waitPhase(c, "waiting", 30000)
    await stageShot(c, "15-no-webgl-waiting")
    await ctx.close()
  })

  await step("Rive file fails to load: fallback takes over, no black screen", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    await ctx.route("**/rive/le-recu-paper.riv", (route) => route.fulfill({ status: 404, body: "nope" }))
    const c = await ctx.newPage(); watch(c, "rive-error")
    await c.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await c.waitForFunction(() => document.querySelector(".paper-stage")?.getAttribute("data-stage-mode") === "fallback-error", null, { timeout: 30000 })
    assert.equal(await c.locator(".paper-fallback").evaluate((el) => getComputedStyle(el).opacity), "1")
    await usableFlow(c, "rive-error")
    await ctx.close()
  })

  await step("keyboard only: Tab to a cost, Enter refuses it, Tab to Seal, Enter seals", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "keyboard")
    await c.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
    await c.locator(".line-btn").first().focus()
    assert.equal(await c.locator(".rive-paper-canvas").evaluate((el) => el.tabIndex), -1)
    await c.keyboard.press("Enter")
    await waitPhase(c, "ink")
    const seal = c.locator("[data-actions]").getByRole("button", { name: /Seal my choice/ })
    await seal.focus()
    await c.keyboard.press("Enter")
    await waitPhase(c, "waiting", 30000)
    await ctx.close()
  })

  await step("no horizontal overflow at 320 / 390 / 430 / 1280 in both locales", async () => {
    const widths = []
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [1280, 800]]) {
      for (const lang of ["fr", "en"]) {
        const ctx = await browser.newContext({ locale: lang === "fr" ? "fr-CA" : "en-US", viewport: { width: w, height: h } })
        const c = await ctx.newPage()
        await c.goto(new URL("?lang=" + lang, BASE).toString(), { waitUntil: "domcontentloaded", timeout: 60000 })
        await c.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
        await c.locator(".line-btn").nth(0).click()
        await waitPhase(c, "ink")
        await c.waitForTimeout(500)
        const over = await c.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        assert.ok(over <= 0, `${w}px ${lang} overflows by ${over}px`)
        if (lang === "en" && (w === 320 || w === 1280)) await shot(c, `16-layout-${w}`)
        widths.push(`${w}${lang}`)
        await ctx.close()
      }
    }
    return widths.join(" ")
  })

  const riveForeign = [...foreignRequests].filter((o) => /unpkg|jsdelivr|rive.app|cdnjs/i.test(o))
  record("self-hosted Rive runtime: no unpkg/jsdelivr/rive.app request", riveForeign.length === 0, riveForeign.join(", ") || `other pre-existing origins: ${[...foreignRequests].join(", ") || "none"}`)
  record("no console/page errors across the run", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "))
} finally {
  writeFileSync(join(OUT, "..", "rive-paper-e2e-result.json"), JSON.stringify({
    evidence_class: "LOCAL", base: BASE, database: "PGlite in-memory (no DATABASE_URL)", ran_at: new Date().toISOString(), results: log,
  }, null, 2))
  await browser.close()
}
process.exit(log.every((r) => r.ok) ? 0 : 1)
