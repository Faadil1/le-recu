import { Component, lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react"
import {
  RIVE_ASSET_URL, buildGeometry, paperDescriptionKey, toViewModelValues, twinVisibility,
  type InkGeometry, type InkRows, type LineRect, type RivePaperState, type RivePhaseName,
} from "@/lib/rive-paper-contract"
import { t, type Locale } from "@/lib/locale"
import type { PaperCanvasStatus } from "./rive-paper-canvas"

const loadCanvas = () => import("./rive-paper-canvas")
const RivePaperCanvas = lazy(loadCanvas)

export type InkMode = "loading" | "rive" | "fallback-reduced" | "fallback-webgl" | "fallback-error"

type Props = {
  state: RivePaperState
  /** phase actually shown (the confirmed-seal impact is layered on by the caller) */
  phase: RivePhaseName
  rows: InkRows
  hoverIndex: number | null
  /** anything that changes the text layout (locale, desire, row count) */
  layoutKey: string
  locale: Locale
}

function webgl2Available(): boolean {
  try { return !!document.createElement("canvas").getContext("webgl2") } catch { return false }
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

/** The real, rendered line boxes of one cost label, in the overlay's coordinate space. */
function measureRows(host: HTMLElement, index: number | null): LineRect[] | null {
  if (index === null) return null
  const label = host.parentElement?.querySelector<HTMLElement>(`[data-cost-index="${index}"]`)
  if (!label) return null
  const range = document.createRange()
  range.selectNodeContents(label)
  const origin = host.getBoundingClientRect()
  const seen = new Set<number>()
  const out: LineRect[] = []
  for (const r of Array.from(range.getClientRects())) {
    if (r.width < 1 || r.height < 1) continue
    const top = Math.round(r.top - origin.top)
    if (seen.has(top)) continue
    seen.add(top)
    out.push({ left: r.left - origin.left, top: r.top - origin.top, width: r.width, height: r.height })
  }
  return out.sort((a, b) => a.top - b.top)
}

/** Static, accessible twin: the same ink at the same measured coordinates, no animation required. */
function InkTwin({ geometry, state, phase }: { geometry: InkGeometry; state: RivePaperState; phase: RivePhaseName }) {
  const v = twinVisibility(state, phase)
  const seg = (s: { x: number; y: number; w: number }, key: string, cls: string) => (
    <path key={key} className={cls} d={`M${s.x} ${s.y} L${s.x + s.w * 100} ${s.y}`} />
  )
  return (
    <svg className="ink-twin" data-phase={phase} data-dim={v.dim ? "true" : "false"} width={geometry.width} height="100%" focusable="false" aria-hidden="true">
      {v.first ? geometry.first.map((s, i) => seg(s, `a${i}`, "ink-a")) : null}
      {v.second ? geometry.second.map((s, i) => seg(s, `b${i}`, "ink-b")) : null}
      {v.pending && geometry.seal1 ? <circle className="ink-pending" cx={geometry.seal1.x} cy={geometry.seal1.y} r="26" /> : null}
      {v.connector && geometry.connector ? <path className="ink-conn" d={`M${geometry.connector.x} ${geometry.connector.y} V${geometry.connector.y + geometry.connector.h}`} /> : null}
      {v.seal1 && geometry.seal1 ? (
        <g className="ink-seal-a" transform={`translate(${geometry.seal1.x} ${geometry.seal1.y})`}>
          <circle r="21" className="ink-ring-a" /><circle r="16.5" className="ink-ring-b" /><circle r="2.3" className="ink-core" />
        </g>
      ) : null}
      {v.seal2 && geometry.seal2 ? (
        <g className="ink-seal-b" transform={`translate(${geometry.seal2.x} ${geometry.seal2.y})`}>
          <circle r="21" className="ink-ring-c" /><circle r="16.5" className="ink-ring-d" />
        </g>
      ) : null}
    </svg>
  )
}

const EMPTY: InkGeometry = { width: 0, first: [], second: [], ghost: [], seal1: null, seal2: null, connector: null }

/** Overlay laid over the real cost list (the parent must be position: relative and contain the labels). */
export function RiveInkOverlay({ state, phase, rows, hoverIndex, layoutKey, locale }: Props) {
  const words = t(locale)
  const reduced = usePrefersReducedMotion()
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [mounted, setMounted] = useState(false)
  const [webgl, setWebgl] = useState(true)
  const [canvas, setCanvas] = useState<PaperCanvasStatus>("loading")
  const [crashed, setCrashed] = useState(false)
  const [geometry, setGeometry] = useState<InkGeometry>(EMPTY)
  const [tick, setTick] = useState(0)

  useEffect(() => { setMounted(true); setWebgl(webgl2Available()) }, [])

  // Warm the runtime + scene while the person is still choosing, so the first stroke is not late.
  useEffect(() => {
    if (!mounted || reduced || !webgl) return
    void loadCanvas().catch(() => undefined)
    void fetch(RIVE_ASSET_URL, { cache: "force-cache" }).catch(() => undefined)
  }, [mounted, reduced, webgl])

  // Re-measure whenever the real text can have moved: container size, web fonts, orientation.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const bump = () => setTick((n) => n + 1)
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(bump) : null
    observer?.observe(host)
    window.addEventListener("resize", bump)
    void document.fonts?.ready.then(bump)
    return () => { observer?.disconnect(); window.removeEventListener("resize", bump) }
  }, [mounted])

  const different = state.outcome === "different"
  const measure = useCallback(() => {
    const host = hostRef.current
    if (!host) return
    const next = buildGeometry({
      width: host.clientWidth,
      first: measureRows(host, rows.first),
      second: measureRows(host, rows.second),
      ghost: measureRows(host, hoverIndex),
      differentOutcome: different,
    })
    setGeometry((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next))
  }, [rows.first, rows.second, hoverIndex, different])
  useLayoutEffect(() => { measure() }, [measure, layoutKey, tick, phase])

  const mode: InkMode = !mounted ? "loading"
    : reduced ? "fallback-reduced"
    : !webgl ? "fallback-webgl"
    : crashed || canvas === "error" ? "fallback-error"
    : "rive"
  const live = mode === "rive" && canvas === "ready"
  const values = useMemo(() => toViewModelValues(state, phase, geometry, hoverIndex === null ? 0 : 1), [state, phase, geometry, hoverIndex])
  const description = words.paper[paperDescriptionKey(state, phase)]

  return (
    <div ref={hostRef} className="ink-overlay" data-ink-mode={mode} data-ink-live={live ? "true" : "false"} data-ink-phase={phase}
      data-ink-first={rows.first ?? ""} data-ink-second={rows.second ?? ""}
      data-ink-geometry={JSON.stringify({ first: geometry.first, second: geometry.second, seal1: geometry.seal1, seal2: geometry.seal2, connector: geometry.connector })}>
      <InkTwin geometry={geometry} state={state} phase={phase} />
      {mode === "rive" ? (
        <div className="ink-canvas-wrap" aria-hidden="true">
          <CanvasBoundary onError={() => setCrashed(true)}>
            <Suspense fallback={null}>
              <RivePaperCanvas values={values} onStatus={setCanvas} />
            </Suspense>
          </CanvasBoundary>
        </div>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">{description}</p>
    </div>
  )
}
