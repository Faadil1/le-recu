import test from "node:test"
import assert from "node:assert/strict"
import { canAdvanceChoice, experiencePhase, showErasureNotice, verifiedReveal, type PhaseInput } from "./experience-state.ts"

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

test("closed/expired challenges cannot be reshared as open invitations",()=>{
  assert.equal(canAdvanceChoice({...base,mine:1}),true)
  assert.equal(canAdvanceChoice({...base,id:"inv",role:"owner",status:"pending",mine:1}),true)
  assert.equal(canAdvanceChoice({...base,id:"inv",role:"owner",status:"expired",mine:1}),false)
  assert.equal(canAdvanceChoice({...base,id:"inv",role:"owner",status:"closed",mine:1}),false)
  assert.equal(canAdvanceChoice({...base,id:"inv",role:"guest",status:"pending",mine:1}),false)
})

test("a deletion confirmation cannot describe a currently active or newly chosen challenge",()=>{
  assert.equal(showErasureNotice({message:"Challenge deleted",id:null,mine:null,phase:"choose"}),true)
  assert.equal(showErasureNotice({message:"Challenge deleted",id:"new",mine:1,phase:"waiting"}),false)
  assert.equal(showErasureNotice({message:"Challenge deleted",id:null,mine:0,phase:"seal"}),false)
  assert.equal(showErasureNotice({message:"Challenge deleted",id:"guest",mine:null,phase:"reply"}),false)
  assert.equal(showErasureNotice({message:" ",id:null,mine:null,phase:"choose"}),false)
})
