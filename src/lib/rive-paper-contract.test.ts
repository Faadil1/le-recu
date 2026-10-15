import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import type { PhaseInput } from "./experience-state.ts"
import {
  RIVE_OUTCOME, RIVE_PHASE, isFreshSeal, paperDescriptionKey, proximityFromDistance,
  rivePaperState, toViewModelValues, visualPhase, type PaperAction, type RivePaperInput,
} from "./rive-paper-contract.ts"

const exp:PhaseInput={id:null,role:"guest",status:"none",mine:null,theirs:null}
type Over=Partial<Omit<RivePaperInput,"experience">>&{experience?:Partial<PhaseInput>}
const input=(over:Over={}):RivePaperInput=>({
  experience:{...exp,...over.experience},action:over.action??null,hasError:over.hasError??false,loadFailed:over.loadFailed??false,
})

test("a local-only choice is ink, never a seal", () => {
  assert.equal(rivePaperState(input()).phase,"idle")
  assert.equal(rivePaperState(input({experience:{mine:2}})).phase,"ink")
})

test("createDuel / answerDuel in flight is ambiguous pending, not success", () => {
  assert.equal(rivePaperState(input({experience:{mine:1},action:"seal"})).phase,"pending")
  assert.equal(rivePaperState(input({experience:{id:"x",role:"guest",status:"pending"},action:"reply"})).phase,"pending")
})

test("the seal exists only after a server-issued id, owner role and pending status", () => {
  const confirmed=input({experience:{id:"x",role:"owner",status:"pending",mine:1}})
  assert.equal(rivePaperState(confirmed).phase,"waiting")
  assert.equal(visualPhase("waiting",true),"sealed")
  assert.equal(visualPhase("waiting",false),"waiting")
  assert.equal(visualPhase("pending",true),"pending")
  assert.equal(isFreshSeal("pending","waiting"),true)
  assert.equal(isFreshSeal(null,"waiting"),false) // a reload into a pending duel does not replay the stamp
  assert.equal(isFreshSeal("ink","waiting"),false)
})

test("refresh/share/check while waiting never re-seal or reveal", () => {
  for(const action of ["share","check"] as const){
    assert.equal(rivePaperState(input({experience:{id:"x",role:"owner",status:"pending",mine:1},action})).phase,"waiting")
  }
})

test("failure keeps or releases the local mark honestly and never claims a seal", () => {
  const owner=rivePaperState(input({experience:{mine:3},hasError:true}))
  assert.deepEqual([owner.phase,owner.markKept],["failed",true])
  const guest=rivePaperState(input({experience:{id:"x",role:"guest",status:"pending"},hasError:true}))
  assert.deepEqual([guest.phase,guest.markKept],["failed",false])
  assert.equal(toViewModelValues(owner).markKept,1)
  assert.equal(toViewModelValues(guest).markKept,0)
  // an error while the owner waits (e.g. a failed refresh) must not erase the real seal
  assert.equal(rivePaperState(input({experience:{id:"x",role:"owner",status:"pending",mine:1},hasError:true})).phase,"waiting")
})

test("the second impression needs a verified complete duel and encodes the real outcome", () => {
  const same=rivePaperState(input({experience:{id:"x",role:"owner",status:"complete",mine:2,theirs:2}}))
  assert.deepEqual([same.phase,same.outcome],["reveal","same"])
  const different=rivePaperState(input({experience:{id:"x",role:"responder",status:"complete",mine:2,theirs:4}}))
  assert.deepEqual([different.phase,different.outcome],["reveal","different"])
  assert.equal(toViewModelValues(different).outcome,RIVE_OUTCOME.different)
  for(const e of [
    {id:"x",role:"guest",status:"complete",mine:2,theirs:4},   // outsider
    {id:"x",role:"owner",status:"complete",mine:2,theirs:null}, // no second answer
    {id:"x",role:"owner",status:"pending",mine:2,theirs:4},     // not committed
    {id:null,role:"owner",status:"complete",mine:2,theirs:4},   // no server id
  ] as const){
    assert.notEqual(rivePaperState(input({experience:e})).phase,"reveal")
  }
})

test("expired, closed, missing and unreadable invites close the paper", () => {
  for(const status of ["expired","closed","missing"] as const){
    assert.equal(rivePaperState(input({experience:{id:"x",role:"guest",status}})).phase,"unavailable")
  }
  assert.equal(rivePaperState(input({loadFailed:true})).phase,"unavailable")
})

test("exhaustive: no input combination yields sealed/waiting/reveal without server truth", () => {
  const ids=[null,"x"], roles=["guest","owner","responder"] as const
  const statuses=["none","pending","complete","expired","closed","missing"] as const
  const idx=[null,0,3] as const, actions:PaperAction[]=[null,"seal","share","check","reply"]
  for(const id of ids) for(const role of roles) for(const status of statuses)
  for(const mine of idx) for(const theirs of idx) for(const action of actions)
  for(const hasError of [false,true]) for(const loadFailed of [false,true]) {
    const s=rivePaperState({experience:{id,role,status,mine,theirs},action,hasError,loadFailed})
    if(s.phase==="waiting") assert.ok(id&&role==="owner"&&status==="pending"&&mine!==null)
    if(s.phase==="reveal") assert.ok(id&&status==="complete"&&mine!==null&&theirs!==null&&role!=="guest")
    if(s.phase==="reveal") assert.equal(s.outcome,mine===theirs?"same":"different")
    if(s.phase!=="reveal") assert.equal(s.outcome,"none")
    const v=toViewModelValues(s)
    assert.ok(Object.values(v).every(Number.isInteger))
    assert.ok(v.phase>=0&&v.phase<=7)
    assert.equal(v.phase,RIVE_PHASE[s.phase])
  }
})

test("proximity is clamped, finite and purely cosmetic", () => {
  assert.equal(proximityFromDistance(0),1)
  assert.equal(proximityFromDistance(500),0)
  assert.equal(proximityFromDistance(Number.NaN),0)
  assert.equal(proximityFromDistance(-5),0)
  assert.ok(proximityFromDistance(70)>0.4&&proximityFromDistance(70)<0.6)
})

test("every phase has a plain-language description key (accessible fallback)", () => {
  const seen=new Set<string>()
  for(const phase of Object.keys(RIVE_PHASE) as (keyof typeof RIVE_PHASE)[]){
    seen.add(paperDescriptionKey({phase,outcome:"same",markKept:false},phase))
  }
  assert.ok(seen.has("revealSame")&&seen.has("sealed")&&seen.has("failed")&&seen.size===8)
})

test("the compiled scene source contains the contract and no scripts, listeners or text", () => {
  const rml=readFileSync(new URL("../../rive/le-recu-paper/scene.rml",import.meta.url),"utf8")
  for(const name of ["phase","outcome","proximity","markKept"]) {
    assert.match(rml,new RegExp(`<ViewModelPropertyNumber name="${name}"`))
  }
  assert.match(rml,/<ViewModel [^>]*name="PaperState"/)
  assert.match(rml,/<Artboard [^>]*name="PaperStage"/)
  assert.match(rml,/<StateMachine name="PaperMachine"/)
  assert.doesNotMatch(rml,/<Script|ScriptAsset|<StateMachineListener|<Text[ >]|TextValueRun|ListenerViewModelChange/)
  assert.doesNotMatch(rml,/<Backboard/)
  // transparent: the shipped scene must not paint a plate over the HTML paper
  assert.doesNotMatch(rml,/name="Backdrop"/)
})
