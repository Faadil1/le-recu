import test from "node:test"
import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import type { PhaseInput } from "./experience-state.ts"
import {
  MAX_SEGMENTS, RIVE_OUTCOME, RIVE_PHASE, buildGeometry, inkRows, isFreshSeal, paperDescriptionKey, proximityFromDistance,
  rivePaperState, sealPoint, strikeSegments, toViewModelValues, twinVisibility, visualPhase,
  type PaperAction, type RivePaperInput,
} from "./rive-paper-contract.ts"

const exp:PhaseInput={id:null,role:"guest",status:"none",mine:null,theirs:null}
type Over=Partial<Omit<RivePaperInput,"experience">>&{experience?:Partial<PhaseInput>}
const input=(over:Over={}):RivePaperInput=>({
  experience:{...exp,...over.experience},action:over.action??null,hasError:over.hasError??false,loadFailed:over.loadFailed??false,
})

test("a local-only choice is ink, never a seal", () => {
  assert.equal(rivePaperState(input()).phase,"idle")
  const local=rivePaperState(input({experience:{mine:2}}))
  assert.deepEqual([local.phase,local.viewerFirst],["ink",true])
})

test("createDuel / answerDuel in flight is ambiguous pending, not success", () => {
  assert.equal(rivePaperState(input({experience:{mine:1},action:"seal"})).phase,"pending")
  const guest=rivePaperState(input({experience:{id:"x",role:"guest",status:"pending"},action:"reply"}))
  assert.deepEqual([guest.phase,guest.viewerFirst],["pending",false])
})

test("the seal exists only after a server-issued id, owner role, pending status and the creator's mark", () => {
  const confirmed=input({experience:{id:"x",role:"owner",status:"pending",mine:1}})
  assert.equal(rivePaperState(confirmed).phase,"waiting")
  assert.equal(rivePaperState(input({experience:{id:"x",role:"owner",status:"pending",mine:null}})).phase,"idle")
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

test("failure never claims a seal and says which impression was attempted", () => {
  const owner=rivePaperState(input({experience:{mine:3},hasError:true}))
  assert.deepEqual([owner.phase,owner.viewerFirst],["failed",true])
  const guest=rivePaperState(input({experience:{id:"x",role:"guest",status:"pending"},hasError:true}))
  assert.deepEqual([guest.phase,guest.viewerFirst],["failed",false])
  assert.equal(rivePaperState(input({experience:{id:"x",role:"owner",status:"pending",mine:1},hasError:true})).phase,"waiting")
})

test("the second impression needs a verified complete duel and encodes the real outcome", () => {
  const same=rivePaperState(input({experience:{id:"x",role:"owner",status:"complete",mine:2,theirs:2}}))
  assert.deepEqual([same.phase,same.outcome,same.viewerFirst],["reveal","same",true])
  const different=rivePaperState(input({experience:{id:"x",role:"responder",status:"complete",mine:2,theirs:4}}))
  assert.deepEqual([different.phase,different.outcome,different.viewerFirst],["reveal","different",false])
  for(const e of [
    {id:"x",role:"guest",status:"complete",mine:2,theirs:4},
    {id:"x",role:"owner",status:"complete",mine:2,theirs:null},
    {id:"x",role:"owner",status:"pending",mine:2,theirs:4},
    {id:null,role:"owner",status:"complete",mine:2,theirs:4},
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

test("rows wearing ink: own local mark before the reveal, canonical first/second at the reveal", () => {
  const base={role:"guest" as const,mine:null,theirs:null,localPick:null}
  // creator, local or waiting: only their own row, as the first impression
  assert.deepEqual(inkRows({...base,phase:"ink",viewerFirst:true,role:"owner",mine:2}),{first:2,second:null})
  assert.deepEqual(inkRows({...base,phase:"waiting",viewerFirst:true,role:"owner",mine:2}),{first:2,second:null})
  // blind guest: nothing until they pick; then only their own pick, never the creator's row
  assert.deepEqual(inkRows({...base,phase:"idle",viewerFirst:false}),{first:null,second:null})
  assert.deepEqual(inkRows({...base,phase:"pending",viewerFirst:false,localPick:3}),{first:null,second:3})
  assert.deepEqual(inkRows({...base,phase:"failed",viewerFirst:false,localPick:3}),{first:null,second:3})
  // reveal: identical canonical ordering for both participants
  assert.deepEqual(inkRows({phase:"reveal",viewerFirst:true,role:"owner",mine:1,theirs:4,localPick:null}),{first:1,second:4})
  assert.deepEqual(inkRows({phase:"reveal",viewerFirst:false,role:"responder",mine:4,theirs:1,localPick:4}),{first:1,second:4})
  assert.deepEqual(inkRows({phase:"reveal",viewerFirst:false,role:"guest",mine:4,theirs:1,localPick:null}),{first:null,second:null})
  assert.deepEqual(inkRows({...base,phase:"unavailable",viewerFirst:true,role:"owner",mine:2}),{first:null,second:null})
})

test("a strike is derived from measured text lines, one segment per line, at most three", () => {
  const one=strikeSegments([{left:20,top:100,width:140,height:24}])
  assert.equal(one.length,1)
  assert.ok(Math.abs(one[0].x-17)<1e-9 && Math.abs(one[0].w*100-146)<1e-9)
  assert.ok(one[0].y>100&&one[0].y<124, "through the middle of the line box")
  const two=strikeSegments([{left:20,top:100,width:300,height:24},{left:20,top:124,width:90,height:24}])
  assert.equal(two.length,2)
  const many=strikeSegments(Array.from({length:5},(_,i)=>({left:10+i,top:100+i*24,width:100,height:24})))
  assert.equal(many.length,MAX_SEGMENTS)
  assert.deepEqual(strikeSegments([{left:0,top:0,width:0,height:0}]),[])
})

test("the seal sits at the end of the struck text and never leaves the overlay", () => {
  const seg=[{x:20,y:60,w:1.2}]
  const p=sealPoint(seg,360)!
  assert.ok(p.x>140&&p.x<200&&p.y===60)
  const long=sealPoint([{x:10,y:60,w:3.6}],360)!
  assert.ok(long.x<=360-28)
  assert.equal(sealPoint([],360),null)
})

test("different outcome draws a tension line between the two real rows; same outcome does not", () => {
  const a=[{left:20,top:40,width:120,height:24}], b=[{left:20,top:300,width:100,height:24}]
  const diff=buildGeometry({width:340,first:a,second:b,ghost:null,differentOutcome:true})
  assert.ok(diff.connector&&diff.connector.h>200&&diff.connector.x<=340)
  const same=buildGeometry({width:340,first:a,second:a,ghost:null,differentOutcome:false})
  assert.equal(same.connector,null)
  assert.deepEqual(same.seal1,same.seal2)
})

test("view model writes are finite numbers that name real scene properties", () => {
  const geometry=buildGeometry({width:340,first:[{left:20,top:40,width:120,height:24}],second:null,ghost:[{left:20,top:140,width:90,height:24}],differentOutcome:false})
  const state=rivePaperState(input({experience:{id:"x",role:"owner",status:"pending",mine:1}}))
  const v=toViewModelValues(state,"waiting",geometry,1)
  assert.ok(Object.values(v).every(Number.isFinite))
  assert.equal(v.phase,RIVE_PHASE.waiting)
  assert.equal(v.outcome,RIVE_OUTCOME.none)
  assert.equal(v.viewerFirst,1)
  assert.ok(v.a0w>1.2&&v.a1w===0&&v.b0w===0&&v.g0w>0)
  const rml=readFileSync(new URL("../../rive/le-recu-paper/scene.rml",import.meta.url),"utf8")
  for(const name of Object.keys(v)) assert.match(rml,new RegExp(`<ViewModelPropertyNumber name="${name}"`),`scene is missing ${name}`)
})

test("the static twin shows only what the server has confirmed", () => {
  const owner=(phase:Parameters<typeof twinVisibility>[1],outcome:"none"|"same"|"different"="none")=>twinVisibility({phase,outcome,viewerFirst:true},phase)
  const guest=(phase:Parameters<typeof twinVisibility>[1])=>twinVisibility({phase,outcome:"none",viewerFirst:false},phase)
  assert.equal(owner("ink").seal1,false)       // local mark: ink only
  assert.equal(owner("pending").seal1,false)   // in flight: ambiguous ring only
  assert.equal(owner("pending").pending,true)
  assert.equal(owner("failed").seal1,false)
  assert.equal(owner("sealed").seal1,true)
  assert.equal(owner("waiting").seal2,false)   // no second impression before a real reply
  assert.equal(owner("reveal","different").seal2,true)
  assert.equal(owner("reveal","different").connector,true)
  assert.equal(owner("reveal","same").connector,false)
  assert.equal(guest("pending").second,true)   // the guest's own local ink
  assert.equal(guest("pending").first,false)   // never the creator's
  assert.equal(guest("idle").first||guest("idle").second,false)
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
    const rows=inkRows({phase:s.phase,viewerFirst:s.viewerFirst,role,mine,theirs,localPick:3})
    // a viewer never wears the other person's ink before a verified reveal
    if(s.phase!=="reveal"&&s.viewerFirst) assert.equal(rows.second,null)
    if(s.phase!=="reveal"&&!s.viewerFirst) assert.equal(rows.first,null)
    const tv=twinVisibility(s,s.phase)
    if(tv.seal1||tv.seal2) assert.ok(["sealed","waiting","reveal"].includes(s.phase))
  }
})

test("proximity is clamped, finite and purely cosmetic", () => {
  assert.equal(proximityFromDistance(0),1)
  assert.equal(proximityFromDistance(500),0)
  assert.equal(proximityFromDistance(Number.NaN),0)
})

test("every phase has a plain-language description key (accessible fallback)", () => {
  const seen=new Set<string>()
  for(const phase of Object.keys(RIVE_PHASE) as (keyof typeof RIVE_PHASE)[]){
    seen.add(paperDescriptionKey({phase,outcome:"same",viewerFirst:true},phase))
  }
  assert.ok(seen.has("revealSame")&&seen.has("sealed")&&seen.has("failed")&&seen.size===8)
})

test("the scene source contains the contract and no scripts, listeners or text", () => {
  const rml=readFileSync(new URL("../../rive/le-recu-paper/scene.rml",import.meta.url),"utf8")
  assert.match(rml,/<ViewModel [^>]*name="InkState"/)
  assert.match(rml,/<Artboard [^>]*name="InkOverlay"/)
  assert.match(rml,/<StateMachine name="InkMachine"/)
  assert.doesNotMatch(rml,/<Script|ScriptAsset|<StateMachineListener|<Text[ >]|TextValueRun|ListenerViewModelChange/)
  assert.doesNotMatch(rml,/<Backboard/)
  assert.doesNotMatch(rml,/name="Backdrop"|MOCK/) // the shipped scene is transparent and has no mock row
})
