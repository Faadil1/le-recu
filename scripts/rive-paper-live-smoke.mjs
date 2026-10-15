// LIVE preview-only Rive render smoke. Does not write to Neon.
// Deliberately only accepts the isolated Vercel beta domain.
import assert from "node:assert/strict"
import { mkdirSync } from "node:fs"
import { chromium } from "playwright"

const BASE=process.env.LIVE_BETA_URL
if(!BASE || !/^https:\/\/le-recu-invite-beta-[a-z0-9-]+\.vercel\.app\/$/.test(BASE)){
  throw new Error("LIVE_BETA_URL must be the isolated Vercel beta Preview")
}
const out="playwright-artifacts-rive"
mkdirSync(out,{recursive:true})
const browser=await chromium.launch({
  headless:true,
  args:["--enable-webgl","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"],
})
try {
  const context=await browser.newContext({locale:"fr-CA",viewport:{width:390,height:844}})
  const page=await context.newPage()
  const errors=[]
  page.on("pageerror",e=>errors.push(e.message))
  const response=await page.goto(BASE,{waitUntil:"domcontentloaded",timeout:30000})
  assert.equal(response?.status(),200,"beta HTML must load")
  const asset=await page.request.get(new URL("/rive/le-recu-paper.riv",BASE).href)
  assert.equal(asset.status(),200,"binary Rive asset must be published")
  const buffer=await asset.body()
  assert.ok(buffer.byteLength>10_000,"scene must contain real compiled binary")
  await page.locator(".paper-stage").waitFor({state:"visible",timeout:30000})
  await page.locator(".paper-stage[data-stage-live='true']").waitFor({state:"attached",timeout:30000})
  assert.equal(await page.locator(".rive-paper-canvas canvas").count(),1,"real Rive canvas loaded")
  assert.equal(await page.locator(".paper-stage").getAttribute("data-stage-phase"),"idle")
  await page.screenshot({path:out+"/rive-v1-4-idle-390.png",fullPage:true})
  await page.locator(".line-btn").first().click()
  await page.locator(".paper-stage[data-stage-phase='ink']").waitFor({state:"attached",timeout:12000})
  await page.screenshot({path:out+"/rive-v1-4-ink-390.png",fullPage:true})
  assert.deepEqual(errors,[],"no uncaught runtime exceptions")
  console.log("LIVE RIVE CANVAS PASS: compiled .riv served over HTTP, scene mounted and state changed with genuine local choice")
  await context.close()

  const reduced=await browser.newContext({locale:"en-US",reducedMotion:"reduce",viewport:{width:320,height:640}})
  const pageReduced=await reduced.newPage()
  await pageReduced.goto(BASE,{waitUntil:"domcontentloaded",timeout:30000})
  await pageReduced.locator(".paper-stage[data-stage-mode='fallback-reduced']").waitFor({state:"attached",timeout:12000})
  assert.equal(await pageReduced.locator(".rive-paper-canvas canvas").count(),0)
  assert.ok(await pageReduced.locator(".paper-fallback").count()>0)
  await pageReduced.screenshot({path:out+"/rive-v1-4-reduced-320.png",fullPage:true})
  console.log("LIVE REDUCED-MOTION PASS: no canvas, semantic paper preserved")
  await reduced.close()
} finally {await browser.close()}
