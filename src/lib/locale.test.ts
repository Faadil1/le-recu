import test from "node:test"
import assert from "node:assert/strict"
import { catalogCostIds, DECK, dailySeedFor, generateLines } from "./receipt.ts"
import { localizedCost, localizedDesire, getEnglishDesireMap, missingEnglishCostIds, parseLocale, t, challengeCopy, duelCopy } from "./locale.ts"

test("every authored cost has both English label and detail",()=>{
  const ids=catalogCostIds()
  assert.ok(ids.length>=40,"catalogue must remain substantive")
  assert.equal(new Set(ids).size,ids.length,"stable ids must be unique")
  const sample=ids.map(id=>({id,cat:"temps" as const,label:"x",detail:"y",weight:2 as const,tags:[]}))
  assert.deepEqual(missingEnglishCostIds(sample),[])
  for(const cost of sample){
    const en=localizedCost(cost,"en")
    assert.ok(en.label.trim().length>1 && en.detail.trim().length>1)
    assert.notEqual(en.label,cost.label)
    assert.equal(en.id,cost.id)
  }
})
test("all eight canonical prompts have English titles but their server keys do not change",()=>{
  const map=getEnglishDesireMap()
  assert.equal(DECK.length,8)
  for(const prompt of DECK) {
    assert.ok(map[prompt],"missing English prompt "+prompt)
    assert.equal(localizedDesire(prompt,"fr"),prompt)
    assert.equal(localizedDesire(prompt,"en"),map[prompt])
  }
})
test("locale changes never change the ordered catalogue or the chosen index",()=>{
  for(const desire of DECK){
    const seed=dailySeedFor(desire,Date.UTC(2026,9,9,12))
    const base=generateLines(desire,seed)
    const english=base.map(x=>localizedCost(x,"en"))
    const french=base.map(x=>localizedCost(x,"fr"))
    assert.deepEqual(english.map(c=>c.id),french.map(c=>c.id))
    assert.equal(english.length,5)
    assert.ok(english.every(c=>c.label && c.detail))
  }
})
test("FR and EN teaser do not leak a refusal and neither contains a response index",()=>{
  const english=challengeCopy("partir","en")
  const french=challengeCopy("partir","fr")
  assert.match(english,/Five costs/)
  assert.match(english,/leave/)
  assert.doesNotMatch(english,/eighteen months|looking settled|creator_line|my refusal/i)
  assert.match(french,/Cinq coûts/)
  assert.doesNotMatch(french,/dix-huit mois|l'air stable|creator_line/)
})
test("complete duel copy follows the selected reader language",()=>{
  assert.match(duelCopy("partir","eighteen months","looking settled","en"),/not the same line/i)
  assert.match(duelCopy("partir","dix-huit mois","l'air stable","fr"),/pas la même ligne/)
})
test("UI switch dictionary contains distinct concise status text in both languages",()=>{
  assert.equal(parseLocale("en"),"en")
  assert.equal(parseLocale("fr"),"fr")
  assert.equal(parseLocale("de"),null)
  const fr=t("fr"),en=t("en")
  assert.notEqual(fr.seal,en.seal)
  assert.match(fr.pending,/DÉFI EN ATTENTE/)
  assert.match(en.pending,/WAITING/)
  assert.match(en.stillPending,/72 hours/)
  assert.match(fr.stillPending,/72 h/)
})
