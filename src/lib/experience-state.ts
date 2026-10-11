import type { DuelView } from './duel-contract'
export type Phase = 'choose'|'seal'|'waiting'|'reply'|'reveal'|'unavailable'
export type PhaseInput = { id:string|null; role:DuelView['role']; status:DuelView['status']|'none'; mine:number|null; theirs:number|null }
export function experiencePhase(v:PhaseInput):Phase {
  if(v.id && ['expired','closed','missing'].includes(v.status)) return 'unavailable'
  if(v.id && v.status==='complete') return (v.role==='owner'||v.role==='responder') && v.mine!==null && v.theirs!==null ? 'reveal' : 'unavailable'
  if(v.id && v.role==='guest' && v.status==='pending') return 'reply'
  if(v.id && v.role==='owner' && v.status==='pending') return 'waiting'
  return v.mine!==null ? 'seal' : 'choose'
}
export const verifiedReveal = (v:PhaseInput):boolean => experiencePhase(v)==='reveal'
