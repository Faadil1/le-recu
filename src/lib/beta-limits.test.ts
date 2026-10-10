import test from "node:test"
import assert from "node:assert/strict"
import { BETA_BUDGET, betaAllowed, consumeBetaBudget, pseudonymKey, utcDayBucket } from "./beta-limits.ts"
import type { Sql } from "./db"

function fakeSql() {
  // Pure-state simulation of the unique-index SQL clause, not a live DB test.
  const counters=new Map<string,number>()
  const sql=(async (_parts:TemplateStringsArray,...values:unknown[])=>{
    const [scope,day,key,_used,max]=values
    const id=`${scope}/${day}/${key}`
    const old=counters.get(id)??0
    if(old>=Number(max))return []
    const count=old+1
    counters.set(id,count)
    return [{used:count}]
  }) as Sql
  sql.query=async()=>[]
  return {sql,counters}
}

test("limits are explicitly small, nonzero and global",()=>{
  assert.equal(BETA_BUDGET["duel-create"].perBrowser,6)
  assert.equal(BETA_BUDGET["duel-create"].global,60)
  assert.ok(BETA_BUDGET["duel-reply"].global>BETA_BUDGET["duel-create"].global)
  assert.equal(betaAllowed("duel-create"),true)
  assert.equal(betaAllowed("arbitrary"),false)
})

test("pseudonymous actor keys are hashed, deterministic and never equal to raw tokens",()=>{
  const token="a".repeat(32)
  assert.equal(pseudonymKey(token).length,64)
  assert.notEqual(pseudonymKey(token),token)
  assert.equal(pseudonymKey(token),pseudonymKey(token))
  assert.notEqual(pseudonymKey(token),pseudonymKey("b".repeat(32)))
  assert.throws(()=>pseudonymKey("short"))
})

test("UTC bucket changes exactly at midnight",()=>{
  assert.equal(utcDayBucket(Date.UTC(2026,9,9,23,59,59)),utcDayBucket(Date.UTC(2026,9,9,1,0,0)))
  assert.equal(utcDayBucket(Date.UTC(2026,9,10,0,0,0)),utcDayBucket(Date.UTC(2026,9,9,1,0,0))+1)
})

test("single actor is capped before it can spend all global capacity (mock, not Neon)",async()=>{
  const {sql,counters}=fakeSql()
  const now=Date.UTC(2026,9,9,10)
  for(let i=0;i<6;i++)await consumeBetaBudget(sql,"duel-create","a".repeat(32),now)
  await assert.rejects(()=>consumeBetaBudget(sql,"duel-create","a".repeat(32),now),/Limite de participation/)
  assert.equal(counters.get(`duel-create/${utcDayBucket(now)}/GLOBAL`),6)
  await consumeBetaBudget(sql,"duel-create","b".repeat(32),now)
  assert.equal(counters.get(`duel-create/${utcDayBucket(now)}/GLOBAL`),7)
})

test("global ceiling applies despite fresh browser identifiers (mock, not Neon)",async()=>{
  const {sql}=fakeSql()
  const now=Date.UTC(2026,9,9,10)
  for(let i=0;i<60;i++){
    const token=i.toString(16).padStart(32,"0")
    await consumeBetaBudget(sql,"duel-create",token,now)
  }
  await assert.rejects(
    ()=>consumeBetaBudget(sql,"duel-create","f".repeat(32),now),
    /Capacité de test atteinte/,
  )
  // Each day has a separate budget. This is not identity verification.
  await consumeBetaBudget(sql,"duel-create","f".repeat(32),now+86400000)
})
