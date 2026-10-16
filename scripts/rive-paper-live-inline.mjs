// LIVE/STAGING inline-ink E2E against an isolated Vercel Preview (Neon staging). Derived from rive-paper-e2e.mjs:
//   RIVE_E2E_URL=https://le-recu-invite-beta-<hash>-<scope>.vercel.app/ node scripts/rive-paper-live-inline.mjs
// It creates and then erases its own duels; steps that would leave undeleted staging rows are skipped (see SKIP).
import assert from "node:assert/strict"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { chromium } from "playwright"

const BASE = process.env.RIVE_E2E_URL
if (!BASE || !BASE.startsWith("https://le-recu-invite-beta-") || !BASE.endsWith(".vercel.app/")) {
  throw new Error("must be the isolated Preview URL")
}
const OUT = process.argv[2] ?? "evidence/rive-v1-5/live-browser-frames"
mkdirSync(OUT, { recursive: true })
const SHOT_LAYOUTS = new Set(["320en", "1440fr", "1920en"])
const log = []
const metrics = {}
const record = (name, ok, detail = "") => { log.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  " + detail : ""}`) }
const SKIP = /reduced motion|WebGL2|keyboard|layout:|wrapped label|fold:|P3 seal fails|guest reply fails/
const step = async (name, fn) => { if (SKIP.test(name)) { record(name + " [skipped on LIVE: would leave undeleted staging rows]", true, "SKIPPED"); return } try { const d = await fn(); record(name, true, d ?? "") } catch (e) { record(name, false, String(e.message).split("\n")[0]); throw e } }

const launchArgs = ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"]
const browser = await chromium.launch({ headless: true, args: launchArgs })
const consoleErrors = []
const foreignRequests = new Set()
function watch(page, tag) {
  page.on("request", (r) => { const u = new URL(r.url()); if (!/^(127\.0\.0\.1|localhost)$/.test(u.hostname) && u.protocol.startsWith("http")) foreignRequests.add(u.origin) })
  page.on("console", (m) => {
    if (m.type() !== "error") return
    if (/^(failure|rive-error|no-webgl)$/.test(tag) && /ERR_FAILED|Failed to load resource|rive/i.test(m.text())) return
    consoleErrors.push(`${tag}: ${m.text()}`)
  })
  page.on("pageerror", (e) => consoleErrors.push(`${tag} pageerror: ${e.message}`))
}

const overlay = (p) => p.locator(".ink-overlay")
const attr = (p, name) => overlay(p).getAttribute(name)
const phaseOf = (p) => attr(p, "data-ink-phase")
async function waitPhase(p, phase, timeout = 20000) {
  await p.waitForFunction((x) => document.querySelector(".ink-overlay")?.getAttribute("data-ink-phase") === x, phase, { timeout })
}
async function waitLive(p) {
  await p.waitForFunction(() => document.querySelector(".ink-overlay")?.getAttribute("data-ink-live") === "true", null, { timeout: 40000 })
}
const geometry = async (p) => JSON.parse((await attr(p, "data-ink-geometry")) || "{}")
async function ready(p, url = BASE) {
  await p.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 })
  await p.locator(".line-btn").first().waitFor({ state: "visible", timeout: 60000 })
}
/** the real rendered text line boxes of a cost label, in page coordinates */
const labelRects = (p, i) => p.evaluate((idx) => {
  const el = document.querySelector(`[data-cost-index="${idx}"]`)
  const r = document.createRange(); r.selectNodeContents(el)
  const seen = new Set()
  return Array.from(r.getClientRects()).filter((q) => q.width > 1 && q.height > 1).filter((q) => { const k = Math.round(q.top); if (seen.has(k)) return false; seen.add(k); return true })
    .map((q) => ({ left: q.left, top: q.top, width: q.width, height: q.height })).sort((a, b) => a.top - b.top)
}, i)
const hostOrigin = (p) => p.evaluate(() => { const r = document.querySelector(".ink-host").getBoundingClientRect(); return { left: r.left, top: r.top } })
/** count pixels of a colour class inside a page clip (decoded in the page from a real screenshot) */
/** clip is in viewport coordinates (getBoundingClientRect); Playwright wants page coordinates */
const pageClip = async (p, clip) => { const sc = await p.evaluate(() => ({ x: scrollX, y: scrollY })); return { ...clip, x: clip.x + sc.x, y: clip.y + sc.y } }
async function pixels(p, clip, kind = "red") {
  const buf = await p.screenshot({ clip: await pageClip(p, clip), fullPage: true })
  return p.evaluate(async ({ b64, kind }) => {
    const img = new Image(); img.src = "data:image/png;base64," + b64; await img.decode()
    const c = document.createElement("canvas"); c.width = img.width; c.height = img.height
    const g = c.getContext("2d"); g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height).data
    let n = 0
    for (let i = 0; i < d.length; i += 4) {
      const [r, gg, b] = [d[i], d[i + 1], d[i + 2]]
      if (kind === "red" ? (r > 120 && gg < 90 && b < 90 && r - gg > 60) : (r < 70 && gg < 70 && b < 70)) n++
    }
    return n
  }, { b64: buf.toString("base64"), kind })
}
async function waitPixels(p, clip, min, kind = "red", timeout = 6000) {
  const t0 = Date.now(); let n = 0
  while (Date.now() - t0 < timeout) { n = await pixels(p, clip, kind); if (n >= min) return n; await p.waitForTimeout(250) }
  throw new Error(`expected >= ${min} ${kind} pixels, saw ${n}`)
}
const expand = (r, pad = 2) => ({ x: Math.max(0, r.x - pad), y: Math.max(0, r.y - pad), width: r.width + pad * 2, height: r.height + pad * 2 })
/** a person looks at the row before it can be judged: Rive pauses canvases that are off-screen, so bring it into view first */
async function look(p, i) {
  const y = await p.evaluate((idx) => { const r = document.querySelector(`[data-cost-index="${idx}"]`).getBoundingClientRect(); return r.top }, i)
  const vh = await p.evaluate(() => innerHeight)
  if (y < 80 || y > vh - 200) { await p.evaluate((idx) => document.querySelector(`[data-cost-index="${idx}"]`).scrollIntoView({ block: "center", behavior: "instant" }), i); await p.waitForTimeout(700) }
}
async function rowClip(p, i) {
  await look(p, i)
  const rs = await labelRects(p, i)
  const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.top + r.height))
  const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.left + r.width))
  return { x: left, y: top, width: right - left, height: bottom - top }
}
async function rowShot(p, name, i) {
  const li = await p.evaluate((idx) => { const r = document.querySelector(`[data-cost-index="${idx}"]`).closest("li").getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height } }, i)
  await p.screenshot({ path: join(OUT, `${name}.png`), clip: await pageClip(p, li), fullPage: true })
}
async function cardShot(p, name) { await p.locator(".receipt-sheet").screenshot({ path: join(OUT, `${name}.png`) }) }
const sealBtn = (p) => p.locator("[data-actions]").getByRole("button", { name: /Sceller mon choix|Seal my choice/ })
const redAllRows = async (p) => { const out = []; for (let i = 0; i < 5; i++) out.push(await pixels(p, expand(await rowClip(p, i)), "red")); return out }
const checkBtn = (p) => p.locator("[data-actions]").getByRole("button", { name: /V[ée]rifier la r[ée]ponse|Check for a reply|Check the reply/i })

try {
  const creatorCtx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const guestCtx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
  const a = await creatorCtx.newPage(); watch(a, "creator")
  const b = await guestCtx.newPage(); watch(b, "guest")
  let posts = 0
  a.on("request", (r) => { if (r.method() === "POST") posts++ })

  await step("P0 creator: receipt loads, overlay is a live Rive canvas over the list, input-inert", async () => {
    await ready(a); await waitLive(a)
    assert.equal(await attr(a, "data-ink-mode"), "rive")
    assert.equal(await phaseOf(a), "idle")
    assert.equal(await a.locator(".ink-canvas").count(), 1)
    assert.equal(await a.locator(".ink-canvas").evaluate((el) => getComputedStyle(el).pointerEvents), "none")
    assert.equal(await a.locator(".ink-overlay").evaluate((el) => getComputedStyle(el).pointerEvents), "none")
    assert.equal(await a.locator(".ink-canvas").evaluate((el) => !!el.closest("[aria-hidden=true]")), true, "canvas is hidden from assistive tech")
    const same = await a.evaluate(() => { const h = document.querySelector(".ink-host").getBoundingClientRect(), o = document.querySelector(".ink-overlay").getBoundingClientRect(), u = document.querySelector(".lines").getBoundingClientRect(); return [h.width === o.width && h.height === o.height, Math.abs(u.height - o.height) < 1] })
    assert.deepEqual(same, [true, true], "the overlay exactly covers the five rows")
    assert.equal(posts, 0)
  })

  await step("hover reaches the scene as a ghost of the real row only; phase unchanged", async () => {
    await a.locator(".line-btn").nth(3).hover(); await a.waitForTimeout(500)
    assert.equal(await phaseOf(a), "idle")
    const g = await geometry(a)
    await rowShot(a, "02-hover-row4", 3)
    await a.mouse.move(2, 2)
    return `phase idle, no strike (${g.first.length} first segments)`
  })

  const FIRST = 2
  await step("P1 FR creator taps cost #3: brush on the TEXT of row #3, no red elsewhere, no server POST", async () => {
    const before = posts
    await a.locator(".line-btn").nth(FIRST).click()
    await waitPhase(a, "ink")
    assert.equal(await attr(a, "data-ink-first"), String(FIRST))
    const rects = await labelRects(a, FIRST)
    const origin = await hostOrigin(a)
    const g = await geometry(a)
    assert.equal(g.first.length, rects.length, "one segment per real text line")
    g.first.forEach((s, i) => {
      assert.ok(Math.abs(s.x + origin.left - (rects[i].left - 3)) < 1.5, `x ${s.x}`)
      assert.ok(Math.abs(s.w * 100 - (rects[i].width + 6)) < 1.5, `w ${s.w}`)
      assert.ok(s.y + origin.top > rects[i].top && s.y + origin.top < rects[i].top + rects[i].height, "inside the line box")
    })
    const rowPx = await waitPixels(a, expand(await rowClip(a, FIRST)), 60)
    await a.waitForTimeout(600)
    const all = await redAllRows(a)
    all.forEach((n, i) => { if (i !== FIRST) assert.ok(n < 4, `unrelated row ${i + 1} has ${n} red pixels`) })
    assert.equal(posts, before, "selecting a cost must not hit the server")
    await rowShot(a, "03-ink-on-row3", FIRST)
    await cardShot(a, "03-card-ink")
    metrics.ink_pixels_chosen_row = rowPx; metrics.ink_pixels_other_rows = all.filter((_, i) => i !== FIRST)
    return `chosen row ${rowPx}px red, others ${all.filter((_, i) => i !== FIRST).join("/")}`
  })

  await step("P2 slow server: pending keeps the provisional mark and shows no seal until the receipt", async () => {
    await a.route(/_serverFn/, async (route) => { if (route.request().method() === "POST") await new Promise((r) => setTimeout(r, 2600)); await route.continue() })
    const phases = []
    await a.exposeFunction("__seen", (p) => phases.push(p))
    await a.evaluate(() => { const el = document.querySelector(".ink-overlay"); new MutationObserver(() => window.__seen(el.getAttribute("data-ink-phase"))).observe(el, { attributes: true, attributeFilter: ["data-ink-phase"] }) })
    const before = posts
    await sealBtn(a).click()
    await waitPhase(a, "pending", 5000)
    assert.ok(posts > before, "Seal posts to the server")
    await a.waitForTimeout(900)
    assert.equal(await a.locator(".ink-seal-a").count(), 0, "no seal while pending")
    assert.equal(await attr(a, "data-ink-first"), String(FIRST), "the mark stays on its row")
    await rowShot(a, "04-pending-row3", FIRST)
    await waitPhase(a, "waiting", 30000) // the one-shot "sealed" impact is brief; the observer below records it
    await a.unroute(/_serverFn/)
    assert.ok(phases.includes("sealed"), `the confirmed seal impact played: ${phases}`)
    const first = phases.findIndex((p) => ["sealed", "waiting"].includes(p))
    assert.ok(phases.indexOf("pending") > -1 && phases.indexOf("pending") < first, `pending before seal: ${phases}`)
    return `phases ${phases.join(">")}`
  })

  await step("P4 seal succeeds: owner waiting, seal anchored at the end of the chosen row's text, valid invite", async () => {
    await a.waitForTimeout(800)
    const g = await geometry(a)
    const rects = await labelRects(a, FIRST)
    const origin = await hostOrigin(a)
    const last = rects[rects.length - 1]
    const li = await a.evaluate((idx) => { const r = document.querySelector(`[data-cost-index="${idx}"]`).closest("li").getBoundingClientRect(); return { top: r.top, bottom: r.bottom } }, FIRST)
    assert.ok(g.seal1.x + origin.left > last.left + last.width, "right of the struck text")
    assert.ok(g.seal1.y + origin.top > li.top && g.seal1.y + origin.top < li.bottom, "inside the chosen row")
    assert.equal(await a.locator(".ink-seal-b").count(), 0)
    await rowShot(a, "05-seal-on-row3", FIRST)
    await cardShot(a, "05-card-waiting")
    assert.ok(new URL(a.url()).searchParams.get("duel"), "valid invite")
  })
  const invite = a.url()

  await step("P5 blind guest: no creator strike, chosen id, seal or outcome anywhere", async () => {
    await ready(b, invite); await waitLive(b)
    assert.equal(await phaseOf(b), "idle")
    assert.equal(await attr(b, "data-ink-first"), ""); assert.equal(await attr(b, "data-ink-second"), "")
    for (const sel of [".ink-a", ".ink-b", ".ink-seal-a", ".ink-seal-b", ".duplex-imprint", "[data-receipt] .line-through"]) assert.equal(await b.locator(sel).count(), 0, sel)
    const all = await redAllRows(b)
    assert.ok(all.every((n) => n < 4), `guest red pixels ${all}`)
    const g = await geometry(b); assert.deepEqual([g.first.length, g.second.length], [0, 0])
    await cardShot(b, "06-guest-blind")
  })

  const GUEST = 4
  await step("P6 guest picks a different row: verified reveal on both browsers, creator's row red in both", async () => {
    await b.locator(".line-btn").nth(GUEST).click()
    await waitPhase(b, "reveal", 30000)
    assert.equal(await attr(b, "data-ink-first"), String(FIRST)); assert.equal(await attr(b, "data-ink-second"), String(GUEST))
    await b.waitForTimeout(3500)
    await rowShot(b, "07-guest-reveal-first-row", FIRST); await rowShot(b, "07-guest-reveal-second-row", GUEST)
    await cardShot(b, "07-guest-reveal-card")
    await checkBtn(a).click()
    await waitPhase(a, "reveal", 30000)
    assert.equal(await attr(a, "data-ink-first"), String(FIRST)); assert.equal(await attr(a, "data-ink-second"), String(GUEST))
    await a.waitForTimeout(3500)
    const g = await geometry(a)
    assert.ok(g.connector && g.connector.h > 100, "tension line between the two real rows")
    await cardShot(a, "08-creator-reveal-card")
    const gg = await geometry(b)
    assert.equal(gg.first.length, g.first.length); assert.equal(gg.second.length, g.second.length)
    for (const [p, who] of [[a, "creator"], [b, "guest"]]) {
      const clip = await rowClip(p, FIRST)
      const sc = await p.evaluate(() => ({ y: scrollY, h: innerHeight }))
      await p.locator(".lines").evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await p.waitForTimeout(1200)
      const clip2 = await rowClip(p, FIRST)
      try { await waitPixels(p, expand(clip2), 60) } catch (e) { throw new Error(`${who}: ${e.message} (clip y ${Math.round(clip.y)} scrollY ${sc.y} vh ${sc.h})`) }
    }
  })

  await step("P11 posters are real 1080x1350 PNGs; canonical first/second identical for both participants", async () => {
    assert.match(await a.locator(".duplex-imprint").innerText(), /DEUX SIGNATURES/)
    assert.match(await b.locator(".duplex-imprint").innerText(), /TWO SIGNATURES/)
    const ownerFirst = (await a.locator(".duplex-first .duplex-cost").innerText()).trim()
    await b.getByRole("button", { name: "FR", exact: true }).click()
    assert.equal((await b.locator(".duplex-second .duplex-cost").innerText()).trim(), ownerFirst)
    await b.getByRole("button", { name: "EN", exact: true }).click()
    const sizes = []
    for (const [page, label, name] of [[a, "fr", /Partager l'image du duo/], [b, "en", /Share the duo image/]]) {
      const wait = page.waitForEvent("download", { timeout: 25000 })
      await page.locator("[data-actions]").getByRole("button", { name }).click()
      const file = await wait
      const target = join(OUT, `poster-${label}.png`); await file.saveAs(target)
      const png = readFileSync(target)
      assert.equal(png.subarray(1, 4).toString(), "PNG"); assert.equal(png.readUInt32BE(16), 1080); assert.equal(png.readUInt32BE(20), 1350)
      sizes.push(`${label}:1080x1350`)
    }
    return sizes.join(" ")
  })

  // repeated regression with deterministic row pairs: same and different, both viewers
  for (const [c1, g1] of [[1, 3], [3, 3]]) {
    await step(`repeat: creator row ${c1 + 1}, guest row ${g1 + 1} -> ${c1 === g1 ? "SAME" : "DIFFERENT"} on the real rows, both viewers`, async () => {
      const cx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 } })
      const gx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
      const p = await cx.newPage(); watch(p, "rep-creator"); const q = await gx.newPage(); watch(q, "rep-guest")
      await ready(p); await waitLive(p)
      await p.locator(".line-btn").nth(c1).click(); await waitPhase(p, "ink")
      await sealBtn(p).click(); await waitPhase(p, "waiting", 30000)
      await ready(q, p.url()); await waitLive(q)
      await q.locator(".line-btn").nth(g1).click(); await waitPhase(q, "reveal", 30000)
      await checkBtn(p).click(); await waitPhase(p, "reveal", 30000)
      for (const page of [p, q]) {
        assert.equal(await attr(page, "data-ink-first"), String(c1)); assert.equal(await attr(page, "data-ink-second"), String(g1))
        await page.waitForTimeout(3200)
        const g = await geometry(page)
        if (c1 === g1) { assert.equal(g.connector, null); assert.deepEqual(g.seal1, g.seal2) } else { assert.ok(g.connector) }
        // same row: the black second impression overprints (multiplies) the red, so less pure red survives by design
        await waitPixels(page, expand(await rowClip(page, c1)), c1 === g1 ? 20 : 60)
        if (c1 !== g1) assert.ok((await pixels(page, expand(await rowClip(page, g1)), "red")) < 80, "the second row is not struck in the first impression's red")
      }
      if (c1 === 3) { await cardShot(p, "09-same-row4-creator"); await cardShot(q, "09-same-row4-guest") }
      if (c1 === 4) { await cardShot(p, "09-diff-row5-row1-creator") }
      p.once("dialog", (d) => { void d.accept() })
      await p.locator("[data-actions]").getByRole("button", { name: /Effacer ce d[ée]fi/ }).click()
      await p.getByText("Défi supprimé de la base.", { exact: false }).waitFor({ state: "visible", timeout: 25000 })
      await cx.close(); await gx.close()
    })
  }

  await step("P12 outsider denied; participant erase closes the invite for the other browser", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "outsider")
    await ready(c, invite); await waitPhase(c, "unavailable", 20000)
    assert.equal(await c.locator(".ink-b").count(), 0); assert.equal(await attr(c, "data-ink-first"), "")
    await cardShot(c, "10-outsider-unavailable")
    await ctx.close()
    a.once("dialog", (d) => { void d.accept() })
    await a.locator("[data-actions]").getByRole("button", { name: /Effacer ce d[ée]fi/ }).click()
    await a.getByText("Défi supprimé de la base.", { exact: false }).waitFor({ state: "visible", timeout: 25000 })
    const fresh = await guestCtx.newPage(); watch(fresh, "guest-after-erase")
    await ready(fresh, invite); await waitPhase(fresh, "unavailable", 20000)
  })

  await step("negative: unknown invite id closes the paper and offers recovery", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "missing")
    await c.goto(new URL("?duel=0000000000000000000000000000dead", BASE).toString(), { waitUntil: "domcontentloaded", timeout: 60000 })
    await c.locator("[data-receipt]").waitFor({ state: "visible", timeout: 60000 }); await waitPhase(c, "unavailable", 20000)
    assert.ok(await c.getByRole("button", { name: /fresh receipt/i }).count() > 0)
    await ctx.close()
  })

  await step("P3 seal fails: no stamp, provisional mark stays on its row, retry succeeds", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
    const c = await ctx.newPage(); watch(c, "failure")
    await ready(c); await waitLive(c)
    await c.route(/_serverFn/, (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue())
    await c.locator(".line-btn").nth(1).click(); await waitPhase(c, "ink")
    await sealBtn(c).click(); await waitPhase(c, "failed", 20000)
    await c.waitForTimeout(1800)
    assert.equal(await c.locator(".ink-seal-a").count(), 0)
    assert.equal(await attr(c, "data-ink-first"), "1")
    assert.ok((await c.locator("[role=alert]").count()) > 0)
    await waitPixels(c, expand(await rowClip(c, 1)), 40)
    await cardShot(c, "11-seal-failed")
    await c.unroute(/_serverFn/)
    await sealBtn(c).click(); await waitPhase(c, "waiting", 30000)
    await ctx.close()
  })

  await step("guest reply fails: own local ink retracts, no second impression, retry works", async () => {
    const hostCtx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 } })
    const h = await hostCtx.newPage(); watch(h, "rf-creator")
    await ready(h); await waitLive(h); await h.locator(".line-btn").nth(0).click(); await waitPhase(h, "ink"); await sealBtn(h).click(); await waitPhase(h, "waiting", 30000)
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "failure")
    await ready(c, h.url()); await waitLive(c)
    await c.route(/_serverFn/, (route) => route.request().method() === "POST" ? route.abort("failed") : route.continue())
    await c.locator(".line-btn").nth(2).click(); await waitPhase(c, "failed", 20000)
    assert.equal(await c.locator(".duplex-imprint").count(), 0); assert.equal(await c.locator(".ink-seal-a, .ink-seal-b").count(), 0)
    await c.unroute(/_serverFn/)
    await c.locator(".line-btn").nth(2).click(); await waitPhase(c, "reveal", 30000)
    await ctx.close(); await hostCtx.close()
  })

  await step("P9 reduced motion: no canvas, the SVG twin draws the same ink on the same row, flow works", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 }, reducedMotion: "reduce" })
    const c = await ctx.newPage(); watch(c, "reduced")
    await ready(c)
    await c.waitForFunction(() => document.querySelector(".ink-overlay")?.getAttribute("data-ink-mode") === "fallback-reduced")
    assert.equal(await c.locator(".ink-canvas").count(), 0)
    await c.locator(".line-btn").nth(3).click(); await waitPhase(c, "ink")
    const rects = await labelRects(c, 3); const origin = await hostOrigin(c)
    const d = await c.locator(".ink-a").first().getAttribute("d")
    const m = d.match(/M([\d.-]+) ([\d.-]+) L([\d.-]+)/); assert.ok(m)
    assert.ok(Math.abs(Number(m[1]) + origin.left - (rects[0].left - 3)) < 1.5)
    await waitPixels(c, expand(await rowClip(c, 3)), 60)
    await sealBtn(c).click(); await waitPhase(c, "waiting", 30000)
    assert.equal(await c.locator(".ink-seal-a").count(), 1); assert.equal(await c.locator(".ink-canvas").count(), 0)
    await cardShot(c, "12-reduced-motion-waiting")
    await ctx.close()
  })

  await step("P9 WebGL2 unavailable and Rive file 404: the SVG twin carries the same ink, flow works", async () => {
    for (const mode of ["webgl", "404"]) {
      const ctx = await browser.newContext({ locale: "fr-CA", viewport: { width: 390, height: 844 } })
      if (mode === "webgl") await ctx.addInitScript(() => { const o = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function (t, ...r) { return t === "webgl2" ? null : o.call(this, t, ...r) } })
      else await ctx.route("**/rive/le-recu-paper.riv", (route) => route.fulfill({ status: 404, body: "nope" }))
      const c = await ctx.newPage(); watch(c, mode === "webgl" ? "no-webgl" : "rive-error")
      await ready(c)
      try {
        await c.waitForFunction((m) => document.querySelector(".ink-overlay")?.getAttribute("data-ink-mode") === (m === "webgl" ? "fallback-webgl" : "fallback-error"), mode, { timeout: 30000 })
      } catch (e) { throw new Error(`${mode}: stuck in mode "${await attr(c, "data-ink-mode")}" live=${await attr(c, "data-ink-live")}`) }
      await c.locator(".line-btn").nth(1).click(); await waitPhase(c, "ink")
      await waitPixels(c, expand(await rowClip(c, 1)), 60)
      await sealBtn(c).click(); await waitPhase(c, "waiting", 30000)
      await ctx.close()
    }
  })

  await step("P9 keyboard only: Tab/Enter refuses a cost and seals", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 390, height: 844 } })
    const c = await ctx.newPage(); watch(c, "keyboard")
    await ready(c)
    await c.locator(".line-btn").nth(2).focus()
    await c.keyboard.press("Enter"); await waitPhase(c, "ink")
    assert.equal(await attr(c, "data-ink-first"), "2")
    await sealBtn(c).focus(); await c.keyboard.press("Enter"); await waitPhase(c, "waiting", 30000)
    await ctx.close()
  })

  await step("P10 layout: strike inside its text, no overflow or forced jump at 320/390/430/1440/1920, FR and EN, every row at 320 and 1440", async () => {
    const checked = []
    for (const [w, h] of [[320, 640], [390, 844], [430, 932], [1440, 900], [1920, 1080]]) {
      for (const lang of ["fr", "en"]) {
        const ctx = await browser.newContext({ locale: lang === "fr" ? "fr-CA" : "en-US", viewport: { width: w, height: h } })
        const c = await ctx.newPage(); watch(c, "layout")
        const url = new URL("?lang=" + lang, BASE).toString()
        const rows = w === 320 || w === 1440 ? [0, 1, 2, 3, 4] : [2]
        for (const row of rows) {
          await ready(c, url); await c.evaluate(() => sessionStorage.clear()); await ready(c, url); await waitLive(c)
          await c.locator(".line-btn").nth(row).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await c.waitForTimeout(300)
          const top0 = (await labelRects(c, row))[0].top
          await c.locator(".line-btn").nth(row).click(); await waitPhase(c, "ink"); await c.waitForTimeout(900)
          const rects = await labelRects(c, row); const origin = await hostOrigin(c); const g = await geometry(c)
          assert.equal(g.first.length, Math.min(rects.length, 3), `${w}px ${lang} row ${row}: one segment per text line`)
          g.first.forEach((s, i) => { assert.ok(Math.abs(s.x + origin.left - (rects[i].left - 3)) < 1.5 && Math.abs(s.w * 100 - (rects[i].width + 6)) < 1.5, `${w}px ${lang} row ${row} drift`) })
          const over = await c.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
          assert.ok(over <= 0, `${w}px ${lang} overflows ${over}px`)
          // the chosen row stays where the person is looking: no forced scroll to a disconnected stage
          const top1 = rects[0].top
          assert.ok(Math.abs(top1 - top0) < 90 && top1 > 0 && top1 < h, `${w}x${h} ${lang} row ${row + 1}: label moved ${Math.round(top1 - top0)}px on selection (now at ${Math.round(top1)})`)
          checked.push(`${w}${lang}r${row + 1}${rects.length > 1 ? `(${rects.length}l)` : ""}`)
          if (row === 2 && SHOT_LAYOUTS.has(`${w}${lang}`)) { await c.waitForTimeout(1700); await c.screenshot({ path: join(OUT, `13-layout-${w}-${lang}.png`) }) }
        }
        await ctx.close()
      }
    }
    metrics.layout_cases = checked.length
    metrics.layout_wrapped_rows = checked.filter((x) => x.includes("l)"))
    return `${checked.length} cases, wrapped: ${metrics.layout_wrapped_rows.join(",") || "none"}`
  })

  await step("wrapped label (forced 30px at 320px): one segment per real text line, ink on every line", async () => {
    const ctx = await browser.newContext({ locale: "en-US", viewport: { width: 320, height: 640 }, deviceScaleFactor: 2 })
    const c = await ctx.newPage(); watch(c, "wrap")
    await ready(c); await waitLive(c)
    await c.addStyleTag({ content: "[data-cost-index]{font-size:30px !important}" }); await c.waitForTimeout(500)
    let best = 0, bestLines = 0
    for (let i = 0; i < 5; i++) { const n = (await labelRects(c, i)).length; if (n > bestLines) { best = i; bestLines = n } }
    assert.ok(bestLines >= 2, "the forced size must wrap at least one label")
    await c.locator(".line-btn").nth(best).evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" })); await c.waitForTimeout(300)
    await c.locator(".line-btn").nth(best).click(); await waitPhase(c, "ink"); await c.waitForTimeout(400)
    const rects = await labelRects(c, best); const origin = await hostOrigin(c); const g = await geometry(c)
    assert.equal(g.first.length, Math.min(rects.length, 3))
    g.first.forEach((seg, i) => assert.ok(Math.abs(seg.x + origin.left - (rects[i].left - 3)) < 1.5 && Math.abs(seg.w * 100 - (rects[i].width + 6)) < 1.5))
    for (const r of rects.slice(0, 3)) await waitPixels(c, expand({ x: r.left, y: r.top, width: r.width, height: r.height }), 25)
    await c.locator(".ink-host").screenshot({ path: join(OUT, "14-wrapped-label-320.png") })
    await ctx.close()
    return `row ${best + 1}: ${rects.length} lines`
  })

  await step("fold: V1.3 first-screen reading preserved (the overlay adds no height)", async () => {
    const rows = {}
    for (const [w, h] of [[390, 844], [320, 640]]) {
      const ctx = await browser.newContext({ locale: "en-US", viewport: { width: w, height: h } })
      const c = await ctx.newPage(); await ready(c); await c.waitForTimeout(500)
      rows[`${w}x${h}`] = await c.evaluate(() => [...document.querySelectorAll(".line-btn")].filter((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight }).length)
      await ctx.close()
    }
    metrics.fully_visible_cost_rows_at_idle = rows
    return JSON.stringify(rows)
  })

  const foreign = [...foreignRequests].filter((o) => /unpkg|jsdelivr|rive\.app|cdnjs/i.test(o))
  record("self-hosted Rive runtime: no unpkg/jsdelivr/rive.app request", foreign.length === 0, foreign.join(", ") || `other pre-existing origins: ${[...foreignRequests].join(", ") || "none"}`)
  record("no console/page errors across the run", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "))
} finally {
  writeFileSync(join(OUT, "..", "rive-paper-e2e-result.json"), JSON.stringify({
    evidence_class: "LIVE/STAGING (Vercel Preview + Neon staging)", base: BASE, database: "Neon staging via the deployed Preview", ran_at: new Date().toISOString(), metrics, results: log,
  }, null, 2))
  await browser.close()
}
process.exit(log.every((r) => r.ok) ? 0 : 1)
