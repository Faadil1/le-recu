import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  RIVE_ASSET_URL, paperDescriptionKey, toViewModelValues,
  type RivePaperState, type RivePhaseName,
} from "@/lib/rive-paper-contract"
import { t, type Locale } from "@/lib/locale"
import type { PaperCanvasStatus } from "./rive-paper-canvas"

const loadCanvas = () => import("./rive-paper-canvas")
const RivePaperCanvas = lazy(loadCanvas)

type Props = {
  state: RivePaperState
  /** phase actually shown (the confirmed-seal impact is layered on by the caller) */
  phase: RivePhaseName
  proximity: number
  locale: Locale
  /** the person's own refused cost, shown by the fallback only; never sent to the scene */
  refusedLabel: string
}

export type PaperStageMode = "loading" | "rive" | "fallback-reduced" | "fallback-webgl" | "fallback-error"

function webgl2Available(): boolean {
  try {
    const canvas = document.createElement("canvas")
    return !!canvas.getContext("webgl2")
  } catch {
    return false
  }
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return
    const query = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(query.matches)
    const onChange = () => setReduced(query.matches)
    query.addEventListener("change", onChange)
    return () => query.removeEventListener("change", onChange)
  }, [])
  return reduced
}

class CanvasBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onError() }
  render() { return this.state.failed ? null : this.props.children }
}

/** Static, accessible paper that tells exactly the same truth as the Rive scene. */
function FallbackPaper({ phase, state, refusedLabel }: { phase: RivePhaseName; state: RivePaperState; refusedLabel: string }) {
  const sealed = phase === "sealed" || phase === "waiting" || phase === "reveal"
  const inked = phase !== "idle" && phase !== "unavailable" && !(phase === "failed" && !state.markKept)
  const second = phase === "reveal"
  const apart = second && state.outcome === "different"
  return (
    <svg className="paper-fallback" data-phase={phase} viewBox="0 0 360 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <path className="pf-guide" d="M48 126 Q 120 112 180 122 T 312 120" />
      {inked ? <path className="pf-ink" d="M48 126 Q 120 112 180 122 T 312 120" /> : null}
      {phase === "pending" ? <circle className="pf-pending" cx="180" cy="120" r="50" /> : null}
      {phase === "waiting" ? <circle className="pf-slot" cx="180" cy="120" r="54" /> : null}
      {sealed ? (
        <g className="pf-seal" transform={apart ? "translate(-28 0)" : undefined}>
          <circle cx="180" cy="120" r="46" className="pf-ring-a" />
          <circle cx="180" cy="120" r="37" className="pf-ring-b" />
          <circle cx="180" cy="120" r="3.5" className="pf-core" />
        </g>
      ) : null}
      {second ? (
        <g className="pf-second" transform={apart ? "translate(58 -8)" : undefined}>
          <circle cx="180" cy="120" r="46" className="pf-ring-c" />
          <circle cx="180" cy="120" r="37" className="pf-ring-d" />
        </g>
      ) : null}
      {phase === "failed" ? <path className="pf-slit" d="M177 48 L184 94 L176 142 L182 194" /> : null}
      <title>{refusedLabel}</title>
    </svg>
  )
}

export function RivePaperStage({ state, phase, proximity, locale, refusedLabel }: Props) {
  const words = t(locale)
  const reduced = usePrefersReducedMotion()
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(true)
  const [canvas, setCanvas] = useState<PaperCanvasStatus>("loading")
  const [crashed, setCrashed] = useState(false)

  useEffect(() => {
    setMounted(true)
    setWebgl(webgl2Available())
  }, [])

  // Warm the runtime + scene while the person is still choosing, so the first ink stroke is not late.
  useEffect(() => {
    if (!mounted || reduced || !webgl) return
    void loadCanvas().catch(() => undefined)
    void fetch(RIVE_ASSET_URL, { cache: "force-cache" }).catch(() => undefined)
  }, [mounted, reduced, webgl])

  const mode: PaperStageMode = !mounted ? "loading"
    : reduced ? "fallback-reduced"
    : !webgl ? "fallback-webgl"
    : crashed || canvas === "error" ? "fallback-error"
    : "rive"
  const live = mode === "rive" && canvas === "ready"
  const sectionRef = useRef<HTMLElement | null>(null)

  // The moments that matter (a confirmed seal, a failure, the second impression) must be seen:
  // Rive pauses off-screen canvases, so bring the paper into view instead of animating unseen.
  useEffect(() => {
    if (!mounted || !["sealed", "failed", "reveal"].includes(phase)) return
    const el = sectionRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const vh = window.innerHeight || document.documentElement.clientHeight
    const visible = Math.min(rect.bottom, vh) - Math.max(rect.top, 0)
    if (visible >= rect.height * 0.7) return
    el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" })
  }, [phase, mounted, reduced])

  const values = useMemo(() => toViewModelValues(state, phase), [state, phase])
  const description = words.paper[paperDescriptionKey(state, phase)]
  const compact = phase === "idle"

  return (
    <section ref={sectionRef} className="paper-stage" data-stage-mode={mode} data-stage-live={live ? "true" : "false"}
      data-stage-phase={phase} data-stage-size={compact ? "compact" : "full"} aria-label={words.paper.stage}>
      <div className="paper-stage-frame" aria-hidden="true">
        <FallbackPaper phase={phase} state={state} refusedLabel={refusedLabel} />
        {mode === "rive" ? (
          <CanvasBoundary onError={() => setCrashed(true)}>
            <Suspense fallback={null}>
              <RivePaperCanvas values={values} proximity={proximity} onStatus={setCanvas} />
            </Suspense>
          </CanvasBoundary>
        ) : null}
      </div>
      <p className="paper-stage-caption" role="status" aria-live="polite">{description}</p>
    </section>
  )
}
