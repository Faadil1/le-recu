import assert from "node:assert/strict"
import { mkdirSync, readFileSync } from "node:fs"
import { chromium } from "playwright"

const BASE=process.env.LIVE_BETA_URL
if (!BASE || !/^https:\/\/le-recu-invite-beta-[a-z0-9-]+\.vercel\.app\/$/.test(BASE)) {
  throw new Error("LIVE_BETA_URL must be the isolated public beta Vercel URL")
}

const browser=await chromium.launch({ headless:true })
const original=await browser.newContext({locale:"fr-CA",acceptDownloads:true,viewport:{width:390,height:844}})
const other=await browser.newContext({locale:"en-US",acceptDownloads:true,viewport:{width:390,height:844}})
const a=await original.newPage()
const b=await other.newPage()
let invite=null

async function waitReceipt(page) {
  await page.locator("[data-receipt]").waitFor({state:"visible",timeout:30000})
  await page.locator(".line-btn").first().waitFor({state:"visible"})
}

try {
  await a.goto(BASE,{waitUntil:"domcontentloaded",timeout:30000})
  await waitReceipt(a)
  assert.match(await a.locator("[data-receipt] h1").innerText(),/«|»/)
  assert.equal(await a.locator(".journey-rail [aria-current=step]").count(),1)
  assert.match(await a.locator(".journey-rail [aria-current=step]").innerText(),/CH/)
// The design stage must reflect real actions, not a fake completed demo.
  await a.locator(".line-btn").first().click()
  assert.match(await a.locator(".journey-rail [aria-current=step]").innerText(),/SCELLER/)
  await a.locator("[data-actions]").getByRole("button",{name:"Sceller mon choix"}).click()
  await a.locator("[data-actions]").getByRole("button",{name:"Envoyer le défi"}).waitFor({state:"visible",timeout:30000})
  invite=a.url()
  const parsed=new URL(invite)
  assert.ok(parsed.searchParams.get("duel"),"creator must receive an opaque id")
  assert.ok(!parsed.searchParams.has("_vercel_share"),"no bypass token must be shared")
  const apiOrigin=new URL(BASE).origin
  assert.equal(parsed.origin,apiOrigin,"stable origin must hold bearer browser token")

  await b.goto(invite,{waitUntil:"domcontentloaded",timeout:30000})
  await waitReceipt(b)
  assert.equal(await b.locator(".duplex-imprint").count(),0,"recipient sees no fake reveal")
  assert.equal(await b.locator("[data-receipt] .line-through").count(),0,"no creator refusal leaked before response")
  await b.getByRole("button",{name:"EN",exact:true}).click()
  const english=await b.locator("[data-receipt] h1").innerText()
  assert.ok(english.includes("“"),"recipient should see the translated heading")
  await b.locator(".line-btn").nth(2).click()
  await b.locator(".duplex-imprint").waitFor({state:"visible",timeout:30000})
  assert.match(await b.locator(".duplex-imprint").innerText(),/TWO SIGNATURES/)
  const enOutcome=await b.locator(".duplex-imprint").innerText()
  assert.match(enOutcome,/NOT THE SAME LINE|SAME REFUSAL/)
  assert.equal(await b.locator(".room-drawer").count(),1)
  assert.equal(await b.locator(".room-drawer").getAttribute("open"),null,"community room stays opt-in")
  assert.equal(await b.locator(".receipt-sheet").getByText("NO RESPONSES YET").count(),0)

  await a.locator("[data-actions]").getByRole("button",{name:"Vérifier la réponse"}).click()
  await a.locator(".duplex-imprint").waitFor({state:"visible",timeout:30000})
  const frOutcome=await a.locator(".duplex-imprint").innerText()
  assert.match(frOutcome,/DEUX SIGNATURES/)
  assert.match(await a.locator(".journey-rail [aria-current=step]").innerText(),/RÉVÉLER/)
  assert.ok(await a.locator(".mobile-next").getByRole("button",{name:"Partager l'image du duo"}).isVisible())

  // Confirm the actual first/second positions have a canonical, owner-independent
  // ordering in the exported artworks. Canvas PNG export uses the same roles.
  // The same physical receipt has ONE canonical creator-first ordering,
  // regardless of which participant is currently viewing it.
  const ownerFirst=await a.locator(".duplex-first .duplex-cost").innerText()
  const ownerSecond=await a.locator(".duplex-second .duplex-cost").innerText()
  const responderFirst=await b.locator(".duplex-first .duplex-cost").innerText()
  assert.ok(ownerFirst.trim().length>2 && ownerSecond.trim().length>2)
  assert.ok(responderFirst.trim().length>2)
  assert.notEqual(ownerFirst,responderFirst,"both browser languages are independent")
  await b.getByRole("button",{name:"FR",exact:true}).click()
  assert.equal((await b.locator(".duplex-first .duplex-cost").innerText()).trim(),ownerFirst.trim())
  assert.equal((await b.locator(".duplex-second .duplex-cost").innerText()).trim(),ownerSecond.trim())
  // The portable text must have the SAME creator-first order from both
  // participants, just like the PNG. In FR both clipboard payloads agree.
  for(const ctx of [original,other]){
    await ctx.grantPermissions(["clipboard-read","clipboard-write"],{origin:apiOrigin})
  }
  for(const page of [a,b]){
    await page.locator(".aftercare-tools summary").click()
    await page.locator(".aftercare-tools").getByRole("button",{name:"Copier le duel"}).click()
  }
  const textFromOwner=await a.evaluate(()=>navigator.clipboard.readText())
  const textFromResponder=await b.evaluate(()=>navigator.clipboard.readText())
  assert.equal(textFromOwner,textFromResponder,"two roles export one canonical text receipt")
  assert.ok(textFromOwner.indexOf("01 / PREMIER REFUS")<textFromOwner.indexOf("02 / SECOND REFUS"))
  assert.doesNotMatch(textFromOwner,/(?:toi|eux) — /i)
  // Reclose secondary options for consistent first-visit screenshots.
  for(const page of [a,b]) await page.locator(".aftercare-tools summary").click()
  // The outcome is now revealed INSIDE the sheet, before the marked rows;
  // no separate detached receipt or below-the-fold only outcome.
  for(const page of [a,b]){
    const summary=await page.locator("[data-duplex-reveal]").boundingBox()
    const rows=await page.locator(".ink-host").boundingBox()
    assert.ok(summary && rows && summary.y<rows.y,"second impression must be above marked rows on same paper")
    assert.equal(await page.locator("[data-duplex-reveal] .duplex-imprint").count(),1)
    assert.equal(await page.locator(".aftercare-tools").count(),1)
    assert.equal(await page.locator(".aftercare-tools").getAttribute("open"),null,"secondary sharing tools start folded")
  }
  await b.getByRole("button",{name:"EN",exact:true}).click()
  mkdirSync("playwright-artifacts",{recursive:true})
  // Handheld display: one CTA, controlled by the sticky safe-area bar.
  assert.equal(await a.locator("[data-actions] [data-primary-result-share]").isVisible(),false)
  assert.equal(await b.locator("[data-actions] [data-primary-result-share]").isVisible(),false)
  assert.ok(await a.locator(".mobile-next").getByRole("button",{name:"Partager l'image du duo"}).isVisible())
  await a.screenshot({path:"playwright-artifacts/duplex-fr-mobile.png",fullPage:true})
  await b.screenshot({path:"playwright-artifacts/duplex-en-mobile.png",fullPage:true})
  // V1.5's three-column threshold used to overflow at intermediate widths.
  for(const width of [1100,1440]){
    await a.setViewportSize({width,height:900})
    const layout=await a.evaluate(()=>({
      scrollWidth:document.documentElement.scrollWidth,
      viewport:window.innerWidth,
    }))
    assert.ok(layout.scrollWidth<=layout.viewport+1,
      `horizontal overflow at ${width}px: ${JSON.stringify(layout)}`)
    await a.screenshot({path:`playwright-artifacts/duplex-fr-${width}.png`,fullPage:true})
  }
  await a.setViewportSize({width:390,height:844})
  const ownerDownload=a.waitForEvent("download",{timeout:25000})
  await a.locator(".mobile-next").getByRole("button",{name:"Partager l'image du duo"}).click()
  const file=await ownerDownload
  assert.match(file.suggestedFilename(),/le-recu-duplex.*\.png/)
  await file.saveAs("playwright-artifacts/duplex-poster-fr.png")
  const png=readFileSync("playwright-artifacts/duplex-poster-fr.png")
  assert.equal(png.subarray(1,4).toString(),"PNG","export must be actual PNG")
  assert.equal(png.readUInt32BE(16),1080)
  assert.equal(png.readUInt32BE(20),1350)
  const englishDownload=b.waitForEvent("download",{timeout:25000})
  await b.locator(".mobile-next").getByRole("button",{name:"Share the duo image"}).click()
  const englishPoster=await englishDownload
  await englishPoster.saveAs("playwright-artifacts/duplex-poster-en.png")
  const pngEN=readFileSync("playwright-artifacts/duplex-poster-en.png")
  assert.equal(pngEN.readUInt32BE(16),1080)
  assert.equal(pngEN.readUInt32BE(20),1350)
  // A third, non-participant browser gets only the closed state, never the
  // two other people's private refusal choices.
  const outsider=await browser.newContext({locale:"en-US"})
  const outsiderPage=await outsider.newPage()
  try{
    await outsiderPage.goto(invite,{waitUntil:"domcontentloaded",timeout:30000})
    await waitReceipt(outsiderPage)
    assert.equal(await outsiderPage.locator(".duplex-imprint").count(),0)
    assert.equal(await outsiderPage.locator(".journey-rail [aria-current=step]").count(),0)
    assert.ok(await outsiderPage.getByRole("button",{name:"Print a fresh receipt"}).count()>0)
  }finally{await outsider.close()}
  console.log("LIVE STAGING BETA PASS: external FR creator → EN recipient → Neon reply → both duplex views → PNG generated.")
} finally {
  if (invite) {
    try {
      a.once("dialog",(dialog)=>{void dialog.accept()})
      const erase=a.getByRole("button",{name:"Effacer ce défi"})
      if (await erase.count()) await erase.click({timeout:12000})
      await a.getByText("Défi supprimé de la base.",{exact:false}).waitFor({state:"visible",timeout:25000})
      // The observed V1.5 trust bug: an old deletion message must never
      // remain alongside an active/new choice.
      await a.locator(".line-btn").first().click()
      assert.equal(await a.getByText("Défi supprimé de la base.",{exact:false}).count(),0,
        "past deletion confirmation must be cleared when the next choice begins")
      console.log("E2E teardown: server-confirmed participant-authorized erasure and no stale notice on next choice.")
    } catch(error) {
      console.warn("E2E teardown unverified; manually inspect staging test duel. Do not assume it was deleted.",error instanceof Error?error.message:"unknown")
    }
  }
  await original.close()
  await other.close()
  await browser.close()
}
