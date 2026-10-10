import assert from "node:assert/strict"
import { mkdirSync } from "node:fs"
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
  await a.locator(".line-btn").first().click()
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
  await b.getByRole("button",{name:"EN",exact:true}).click()
  const english=await b.locator("[data-receipt] h1").innerText()
  assert.ok(english.includes("“"),"recipient should see the translated heading")
  await b.locator(".line-btn").nth(2).click()
  await b.locator(".duplex-imprint").waitFor({state:"visible",timeout:30000})
  assert.match(await b.locator(".duplex-imprint").innerText(),/TWO SIGNATURES/)
  const enOutcome=await b.locator(".duplex-imprint").innerText()
  assert.match(enOutcome,/NOT THE SAME LINE|SAME REFUSAL/)

  await a.locator("[data-actions]").getByRole("button",{name:"Vérifier la réponse"}).click()
  await a.locator(".duplex-imprint").waitFor({state:"visible",timeout:30000})
  const frOutcome=await a.locator(".duplex-imprint").innerText()
  assert.match(frOutcome,/DEUX SIGNATURES/)

  // Confirm the actual first/second positions have a canonical, owner-independent
  // ordering in the exported artworks. Canvas PNG export uses the same roles.
  const ownerFirst=await a.locator(".duplex-first .duplex-cost").innerText()
  const responderFirst=await b.locator(".duplex-second .duplex-cost").innerText()
  assert.ok(ownerFirst.trim().length>2)
  assert.ok(responderFirst.trim().length>2)
  assert.notEqual(ownerFirst,responderFirst,"the browser languages must be independently presented")
  await b.getByRole("button",{name:"FR",exact:true}).click()
  assert.equal((await b.locator(".duplex-second .duplex-cost").innerText()).trim(),ownerFirst.trim())
  assert.equal((await b.locator(".duplex-first .duplex-cost").innerText()).trim(),
    (await a.locator(".duplex-second .duplex-cost").innerText()).trim())
  await b.getByRole("button",{name:"EN",exact:true}).click()
  mkdirSync("playwright-artifacts",{recursive:true})
  await a.screenshot({path:"playwright-artifacts/duplex-fr-mobile.png",fullPage:true})
  await b.screenshot({path:"playwright-artifacts/duplex-en-mobile.png",fullPage:true})
  const ownerDownload=a.waitForEvent("download",{timeout:25000})
  await a.locator("[data-actions]").getByRole("button",{name:"Partager l'image du duo"}).click()
  const file=await ownerDownload
  assert.match(file.suggestedFilename(),/le-recu-duplex.*\.png/)
  await file.saveAs("playwright-artifacts/duplex-poster-fr.png")
  console.log("LIVE STAGING BETA PASS: external FR creator → EN recipient → Neon reply → both duplex views → PNG generated.")
} finally {
  if (invite) {
    try {
      a.once("dialog",(dialog)=>{void dialog.accept()})
      const erase=a.getByRole("button",{name:"Effacer ce défi"})
      if (await erase.count()) await erase.click({timeout:12000})
      await a.getByText("Défi supprimé de la base.",{exact:false}).waitFor({state:"visible",timeout:25000})
      console.log("E2E teardown: server-confirmed participant-authorized erasure.")
    } catch(error) {
      console.warn("E2E teardown unverified; manually inspect staging test duel. Do not assume it was deleted.",error instanceof Error?error.message:"unknown")
    }
  }
  await original.close()
  await other.close()
  await browser.close()
}
