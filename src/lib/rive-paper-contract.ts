// The single, narrow adapter between real product state and the Rive "Paper Remembers" scene.
//
// Rive is a *visual projection only*: nothing in the .riv can create, confirm or read server
// state. Every value below is derived from state React already holds after a real Neon response
// (see experience-state.ts). The scene exposes four numbers and nothing else:
//
//   phase     0..7  (RIVE_PHASE)       what the paper is doing
//   outcome   0..2  (RIVE_OUTCOME)     only meaningful in `reveal`; derived from a verified duel
//   markKept  0|1                      in `failed`: 1 keeps the local ink mark, 0 lets it fade
//   proximity 0..1                     finger/pointer nearness; cosmetic, never persisted
//
// Keep the numeric codes in step with rive/le-recu-paper/tools/gen-scene.mjs.
import { experiencePhase, type PhaseInput } from './experience-state.ts'

export const RIVE_PHASE = {
  idle: 0,
  ink: 1,
  pending: 2,
  sealed: 3,
  waiting: 4,
  reveal: 5,
  failed: 6,
  unavailable: 7,
} as const
export type RivePhaseName = keyof typeof RIVE_PHASE

export const RIVE_OUTCOME = { none: 0, same: 1, different: 2 } as const
export type RiveOutcomeName = keyof typeof RIVE_OUTCOME

export const RIVE_VIEW_MODEL = 'PaperState'
export const RIVE_ARTBOARD = 'PaperStage'
export const RIVE_STATE_MACHINE = 'PaperMachine'
export const RIVE_ASSET_URL = '/rive/le-recu-paper.riv'
/** The "sealed" impact plays once after a confirmed create; afterwards the paper settles into "waiting". */
export const SEALED_DWELL_MS = 1600

/** `seal` = createDuel in flight, `reply` = answerDuel in flight. Other busy actions never drive the paper. */
export type PaperAction = 'seal' | 'share' | 'check' | 'reply' | null

export type RivePaperInput = {
  experience: PhaseInput
  action: PaperAction
  /** a user-visible error is currently shown */
  hasError: boolean
  /** an invite URL was opened but its duel could not be read */
  loadFailed: boolean
}

export type RivePaperState = {
  phase: RivePhaseName
  outcome: RiveOutcomeName
  markKept: boolean
}

export function rivePaperState(input: RivePaperInput): RivePaperState {
  const { experience, action, hasError, loadFailed } = input
  const exp = experiencePhase(experience)
  const base = { outcome: 'none' as RiveOutcomeName, markKept: false }

  // A second impression exists only for a verified, complete duel with a valid role and two indices.
  if (exp === 'reveal') {
    return { phase: 'reveal', outcome: experience.mine === experience.theirs ? 'same' : 'different', markKept: false }
  }
  if (exp === 'unavailable' || loadFailed) return { phase: 'unavailable', ...base }
  // The server has not answered yet: ambiguous texture, never a seal.
  if (action === 'seal' || action === 'reply') return { phase: 'pending', ...base }
  if (hasError && (exp === 'choose' || exp === 'seal' || exp === 'reply')) {
    return { phase: 'failed', outcome: 'none', markKept: experience.mine !== null }
  }
  // `waiting` is only reachable with a server-issued id, the owner role and a pending status.
  // (the creator's own mark must also be present: a seal with no refusal under it is never drawn)
  if (exp === 'waiting' && experience.mine !== null) return { phase: 'waiting', ...base }
  // `seal` in experience-state means "a choice exists locally" -- it is NOT server confirmed.
  if (exp === 'seal') return { phase: 'ink', ...base }
  return { phase: 'idle', ...base }
}

/** What the paper shows, once the one-shot impact of a freshly confirmed seal is layered on. */
export function visualPhase(derived: RivePhaseName, sealedHold: boolean): RivePhaseName {
  return derived === 'waiting' && sealedHold ? 'sealed' : derived
}

/** True when a derived-phase change is a *newly confirmed* seal (pending -> waiting), not a reload. */
export function isFreshSeal(previous: RivePhaseName | null, next: RivePhaseName): boolean {
  return previous === 'pending' && next === 'waiting'
}

export type RiveViewModelWrite = { phase: number; outcome: number; markKept: number }

export function toViewModelValues(state: RivePaperState, phase: RivePhaseName = state.phase): RiveViewModelWrite {
  return {
    phase: RIVE_PHASE[phase],
    outcome: phase === 'reveal' ? RIVE_OUTCOME[state.outcome] : RIVE_OUTCOME.none,
    markKept: phase === 'failed' && state.markKept ? 1 : 0,
  }
}

/** Cosmetic nearness 0..1 from a pointer distance (px) to the active line; 1 = touching. */
export function proximityFromDistance(distancePx: number, reachPx = 140): number {
  if (!Number.isFinite(distancePx) || distancePx < 0) return 0
  return Math.min(1, Math.max(0, 1 - distancePx / reachPx))
}

/** Plain-language mirror of the visual state for the accessible fallback and assistive tech. */
export function paperDescriptionKey(state: RivePaperState, phase: RivePhaseName = state.phase):
  'idle' | 'ink' | 'pending' | 'sealed' | 'waiting' | 'revealSame' | 'revealDifferent' | 'failed' | 'unavailable' {
  if (phase === 'reveal') return state.outcome === 'same' ? 'revealSame' : 'revealDifferent'
  return phase
}
