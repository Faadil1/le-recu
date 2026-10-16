// The single, narrow adapter between real product state and the Rive inline-ink overlay (V1.5).
//
// Rive is a *visual projection only*: nothing in the .riv can create, confirm or read server state.
// Every value below derives from state React already holds after a real Neon response
// (see experience-state.ts) plus pure DOM geometry measured from the visible cost rows.
//
// View-model numbers exposed by rive/le-recu-paper/scene.rml (keep in step with tools/gen-scene.mjs):
//   phase 0..7, outcome 0..2, viewerFirst 0|1, proximity 0..1
//   s1x s1y s2x s2y   seal centres (px, overlay space)        cx cy ch   connector (x, top y, height/100)
//   a|b|g + i(0..2) + x|y|w   three marks (first, second, hover ghost) x up to three measured text lines:
//                      line origin x/y in px and length/100. w = 0 hides the line.
// The file holds no text, cost label, identity or counter: it only draws ink where React says a real row is.
import { canonicalSelections } from './duel-contract.ts'
import { experiencePhase, type PhaseInput } from './experience-state.ts'

export const RIVE_PHASE = {
  idle: 0, ink: 1, pending: 2, sealed: 3, waiting: 4, reveal: 5, failed: 6, unavailable: 7,
} as const
export type RivePhaseName = keyof typeof RIVE_PHASE

export const RIVE_OUTCOME = { none: 0, same: 1, different: 2 } as const
export type RiveOutcomeName = keyof typeof RIVE_OUTCOME

export const RIVE_VIEW_MODEL = 'InkState'
export const RIVE_ARTBOARD = 'InkOverlay'
export const RIVE_STATE_MACHINE = 'InkMachine'
export const RIVE_ASSET_URL = '/rive/le-recu-paper.riv'
/** The one-shot seal impact plays once after a confirmed create; afterwards the paper settles into "waiting". */
export const SEALED_DWELL_MS = 1600
export const MAX_SEGMENTS = 3

/** `seal` = createDuel in flight, `reply` = answerDuel in flight. Other busy actions never drive the ink. */
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
  /** true when the viewer holds the first (red, creator) impression; false for the responder/guest */
  viewerFirst: boolean
}

export function rivePaperState(input: RivePaperInput): RivePaperState {
  const { experience, action, hasError, loadFailed } = input
  const exp = experiencePhase(experience)
  const viewerFirst = experience.role === 'owner' || experience.id === null
  const base = { outcome: 'none' as RiveOutcomeName, viewerFirst }

  // A second impression exists only for a verified, complete duel with a valid role and two indices.
  if (exp === 'reveal') {
    return { phase: 'reveal', outcome: experience.mine === experience.theirs ? 'same' : 'different', viewerFirst: experience.role === 'owner' }
  }
  if (exp === 'unavailable' || loadFailed) return { phase: 'unavailable', ...base }
  // The server has not answered yet: ambiguous texture, never a seal.
  if (action === 'seal' || action === 'reply') return { phase: 'pending', ...base }
  if (hasError && (exp === 'choose' || exp === 'seal' || exp === 'reply')) return { phase: 'failed', ...base }
  // `waiting` is only reachable with a server-issued id, the owner role, pending status AND the creator's mark.
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

// ---- which rows carry ink ---------------------------------------------------------------------
export type InkRows = { first: number | null; second: number | null }

/**
 * Row indices (into the five costs) that wear ink. The first impression is the creator's, the second the
 * responder's, in canonical creation order, never "me/them". Before a verified reveal a viewer only ever
 * sees their own local mark: the creator's `mine`, or the guest's picked row while the answer is in flight.
 */
export function inkRows(args: {
  phase: RivePhaseName
  viewerFirst: boolean
  role: PhaseInput['role']
  mine: number | null
  theirs: number | null
  localPick: number | null
}): InkRows {
  const { phase, viewerFirst, role, mine, theirs, localPick } = args
  if (phase === 'reveal') {
    const ordered = canonicalSelections(role, mine, theirs)
    return ordered ? { first: ordered.first, second: ordered.second } : { first: null, second: null }
  }
  if (phase === 'idle' || phase === 'unavailable') return { first: null, second: null }
  if (viewerFirst) return { first: mine, second: null }
  return { first: null, second: phase === 'pending' || phase === 'failed' ? localPick : null }
}

// ---- geometry (pure) --------------------------------------------------------------------------
export type LineRect = { left: number; top: number; width: number; height: number }
export type Segment = { x: number; y: number; w: number }
export type Point = { x: number; y: number }

const REACH_PAD = 3

/** Strike through the vertical middle of each measured line box of the label's real text. */
export function strikeSegments(rects: readonly LineRect[]): Segment[] {
  const usable = rects.filter((r) => r.width > 1 && r.height > 1)
  const picked = usable.length <= MAX_SEGMENTS ? usable : [...usable.slice(0, MAX_SEGMENTS - 1), mergeRects(usable.slice(MAX_SEGMENTS - 1))]
  return picked.map((r) => ({ x: r.left - REACH_PAD, y: r.top + r.height * 0.56, w: (r.width + REACH_PAD * 2) / 100 }))
}

function mergeRects(rs: readonly LineRect[]): LineRect {
  const left = Math.min(...rs.map((r) => r.left)), right = Math.max(...rs.map((r) => r.left + r.width))
  const top = Math.min(...rs.map((r) => r.top)), bottom = Math.max(...rs.map((r) => r.top + r.height))
  return { left, top, width: right - left, height: bottom - top }
}

/** Seal sits at the end of the struck text, kept inside the overlay. */
export function sealPoint(segments: readonly Segment[], overlayWidth: number): Point | null {
  const last = segments[segments.length - 1]
  if (!last) return null
  const reach = 28
  return { x: Math.max(reach, Math.min(overlayWidth - reach, last.x + last.w * 100 + reach - 2)), y: last.y }
}

export type InkGeometry = {
  width: number
  first: Segment[]
  second: Segment[]
  ghost: Segment[]
  seal1: Point | null
  seal2: Point | null
  /** vertical tension line on the right margin between the two seals (different outcome only) */
  connector: { x: number; y: number; h: number } | null
}

export function buildGeometry(args: {
  width: number
  first: readonly LineRect[] | null
  second: readonly LineRect[] | null
  ghost: readonly LineRect[] | null
  differentOutcome: boolean
}): InkGeometry {
  const first = args.first ? strikeSegments(args.first) : []
  const second = args.second ? strikeSegments(args.second) : []
  const seal1 = sealPoint(first, args.width)
  const seal2 = sealPoint(second, args.width)
  const connector = args.differentOutcome && seal1 && seal2 && Math.abs(seal1.y - seal2.y) > 8
    ? { x: Math.max(8, args.width - 8), y: Math.min(seal1.y, seal2.y), h: Math.abs(seal1.y - seal2.y) }
    : null
  return { width: args.width, first, second, ghost: args.ghost ? strikeSegments(args.ghost) : [], seal1, seal2, connector }
}

// ---- view model writes ---------------------------------------------------------------------------
export type RiveWrites = Record<string, number>

export function toViewModelValues(state: RivePaperState, phase: RivePhaseName, geometry: InkGeometry, proximity: number): RiveWrites {
  const out: RiveWrites = {
    phase: RIVE_PHASE[phase],
    outcome: phase === 'reveal' ? RIVE_OUTCOME[state.outcome] : RIVE_OUTCOME.none,
    viewerFirst: state.viewerFirst ? 1 : 0,
    proximity: Math.min(1, Math.max(0, proximity)),
    s1x: geometry.seal1?.x ?? 0, s1y: geometry.seal1?.y ?? 0,
    s2x: geometry.seal2?.x ?? 0, s2y: geometry.seal2?.y ?? 0,
    cx: geometry.connector?.x ?? 0, cy: geometry.connector?.y ?? 0, ch: (geometry.connector?.h ?? 0) / 100,
  }
  const marks: [string, Segment[]][] = [['a', geometry.first], ['b', geometry.second], ['g', geometry.ghost]]
  for (const [m, segs] of marks) {
    for (let i = 0; i < MAX_SEGMENTS; i++) {
      const s = segs[i]
      out[`${m}${i}x`] = s?.x ?? 0
      out[`${m}${i}y`] = s?.y ?? 0
      out[`${m}${i}w`] = s?.w ?? 0
    }
  }
  return out
}

/** Cosmetic nearness 0..1 from a pointer distance (px) to the active line; 1 = touching. */
export function proximityFromDistance(distancePx: number, reachPx = 140): number {
  if (!Number.isFinite(distancePx) || distancePx < 0) return 0
  return Math.min(1, Math.max(0, 1 - distancePx / reachPx))
}

// ---- the static twin shows exactly the same truth ------------------------------------------------------
export type TwinVisibility = { first: boolean; second: boolean; seal1: boolean; seal2: boolean; pending: boolean; connector: boolean; dim: boolean }

export function twinVisibility(state: RivePaperState, phase: RivePhaseName): TwinVisibility {
  const ownerInk = state.viewerFirst
  return {
    first: ownerInk && ['ink', 'pending', 'sealed', 'waiting', 'failed', 'unavailable'].includes(phase) || phase === 'reveal',
    second: !ownerInk && ['pending'].includes(phase) || phase === 'reveal',
    seal1: ['sealed', 'waiting', 'reveal'].includes(phase),
    seal2: phase === 'reveal',
    pending: phase === 'pending' && ownerInk,
    connector: phase === 'reveal' && state.outcome === 'different',
    dim: phase === 'unavailable' || phase === 'failed',
  }
}

/** Plain-language mirror of the visual state for assistive tech. */
export function paperDescriptionKey(state: RivePaperState, phase: RivePhaseName):
  'idle' | 'ink' | 'pending' | 'sealed' | 'waiting' | 'revealSame' | 'revealDifferent' | 'failed' | 'unavailable' {
  if (phase === 'reveal') return state.outcome === 'same' ? 'revealSame' : 'revealDifferent'
  return phase
}
