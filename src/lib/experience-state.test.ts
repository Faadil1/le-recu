import test from "node:test"
import assert from "node:assert/strict"
import { experiencePhase, verifiedReveal, type PhaseInput } from "./experience-state.ts"

const base:PhaseInput={id:null,role:"guest",status:"none",mine:null,theirs:null}
test("no participant is invented by an old local-only display state",()=>{
  assert.equal(experiencePhase(base),"choose")
  assert.equal(experiencePhase({...base,mine:2}),"seal")
  assert.equal(verifiedReveal({...base,mine:2,theirs:3}),false)
})
test("the hidden first refusal remains pending until the reply commits",()=>{
  assert.equal(experiencePhase({...base,id:"invite",role:"owner",status:"pending",mine:1}),"waiting")
  assert.equal(experiencePhase({...base,id:"invite",role:"guest",status:"pending"}),"reply")
  assert.equal(verifiedReveal({...base,id:"invite",role:"guest",status:"pending",mine:2,theirs:1}),false)
})
test("only participants in a completed two-sided result can show the reveal",()=>{
  for(const role of ["owner","responder"] as const){
    assert.equal(verifiedReveal({...base,id:"invite",role,status:"complete",mine:0,theirs:4}),true)
  }
  assert.equal(verifiedReveal({...base,id:"invite",role:"guest",status:"closed",mine:0,theirs:4}),false)
  assert.equal(verifiedReveal({...base,id:"invite",role:"owner",status:"complete",mine:0,theirs:null}),false)
})
test("expired, invalid and closed challenges cannot masquerade as active",()=>{
  for(const status of ["expired","closed","missing"] as const){
    assert.equal(experiencePhase({...base,id:"invite",role:"guest",status}),"unavailable")
  }
})
