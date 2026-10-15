import { useEffect, useRef } from "react"
import { Alignment, Fit, Layout, useRive, useViewModel, useViewModelInstance } from "@rive-app/react-webgl2"
import { RuntimeLoader } from "@rive-app/webgl2"
import riveWasmUrl from "@rive-app/webgl2/rive.wasm?url"
import riveFallbackWasmUrl from "@rive-app/webgl2/rive_fallback.wasm?url"
import {
  RIVE_ARTBOARD, RIVE_ASSET_URL, RIVE_STATE_MACHINE, RIVE_VIEW_MODEL,
  type RiveViewModelWrite,
} from "@/lib/rive-paper-contract"

// Self-host the Rive runtime: no third-party CDN (unpkg/jsdelivr) request, no runtime fetched from outside our origin.
RuntimeLoader.setWasmUrl(riveWasmUrl)
RuntimeLoader.setWasmFallbackUrl(riveFallbackWasmUrl)

export type PaperCanvasStatus = "loading" | "ready" | "error"

type Props = {
  values: RiveViewModelWrite
  proximity: number
  onStatus: (status: PaperCanvasStatus) => void
}

// Client-only. Loaded lazily by RivePaperStage; a throw here is caught by its error boundary
// and the HTML/CSS paper keeps telling the truth.
export default function RivePaperCanvas({ values, proximity, onStatus }: Props) {
  const { rive, RiveComponent } = useRive({
    src: RIVE_ASSET_URL,
    artboard: RIVE_ARTBOARD,
    stateMachine: RIVE_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Cover, alignment: Alignment.Center }),
    // The canvas is feedback only: it never owns pointer, touch or keyboard input.
    shouldDisableRiveListeners: true,
    onLoadError: () => onStatus("error"),
  })
  const viewModel = useViewModel(rive, { name: RIVE_VIEW_MODEL })
  const instance = useViewModelInstance(viewModel, { useDefault: true, rive })
  const reported = useRef(false)

  // outcome and markKept are written before phase so the state machine evaluates a consistent set.
  useEffect(() => {
    if (!instance) return
    const write = (name: string, value: number) => {
      const prop = instance.number(name)
      if (prop) prop.value = value
    }
    write("outcome", values.outcome)
    write("markKept", values.markKept)
    write("phase", values.phase)
    if (!reported.current) {
      reported.current = true
      onStatus("ready")
    }
  }, [instance, values.phase, values.outcome, values.markKept, onStatus])

  // Ease the cosmetic proximity toward its target so the bristles lean instead of snapping.
  const eased = useRef(0)
  useEffect(() => {
    const prop = instance?.number("proximity")
    if (!prop) return
    let frame = 0
    const step = () => {
      eased.current += (proximity - eased.current) * 0.2
      if (Math.abs(proximity - eased.current) < 0.004) eased.current = proximity
      prop.value = eased.current
      if (eased.current !== proximity) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [instance, proximity])

  return <RiveComponent aria-hidden="true" tabIndex={-1} className="rive-paper-canvas" />
}
