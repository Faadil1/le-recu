import { useEffect, useRef } from "react"
import { Alignment, Fit, Layout, useRive, useViewModel, useViewModelInstance } from "@rive-app/react-webgl2"
import { RuntimeLoader } from "@rive-app/webgl2"
import riveWasmUrl from "@rive-app/webgl2/rive.wasm?url"
import riveFallbackWasmUrl from "@rive-app/webgl2/rive_fallback.wasm?url"
import { RIVE_ARTBOARD, RIVE_ASSET_URL, RIVE_STATE_MACHINE, RIVE_VIEW_MODEL, type RiveWrites } from "@/lib/rive-paper-contract"

// Self-host the Rive runtime: no third-party CDN (unpkg/jsdelivr) request.
RuntimeLoader.setWasmUrl(riveWasmUrl)
RuntimeLoader.setWasmFallbackUrl(riveFallbackWasmUrl)

export type PaperCanvasStatus = "loading" | "ready" | "error"

type Props = { values: RiveWrites; onStatus: (status: PaperCanvasStatus) => void }

// Client-only, lazy. The canvas is a transparent overlay laid over the real cost list: pointer-events none,
// aria-hidden, no focus. Its artboard is laid out to the canvas size so scene units are CSS pixels.
export default function RivePaperCanvas({ values, onStatus }: Props) {
  const { rive, RiveComponent } = useRive({
    src: RIVE_ASSET_URL,
    artboard: RIVE_ARTBOARD,
    stateMachine: RIVE_STATE_MACHINE,
    autoplay: true,
    layout: new Layout({ fit: Fit.Layout, alignment: Alignment.TopLeft }),
    shouldDisableRiveListeners: true,
    onLoadError: () => onStatus("error"),
  })
  const viewModel = useViewModel(rive, { name: RIVE_VIEW_MODEL })
  const instance = useViewModelInstance(viewModel, { useDefault: true, rive })
  const reported = useRef(false)
  // Only write what changed: re-writing an unchanged phase would let the state machine re-enter its state and replay it.
  const written = useRef<Record<string, number>>({})

  // Geometry first, then viewerFirst / outcome / phase last, so the state machine always evaluates a
  // consistent set (a reveal never starts against the previous row's coordinates).
  useEffect(() => {
    if (!instance) return
    const set = (name: string) => {
      const prop = instance.number(name)
      if (prop && name in values && written.current[name] !== values[name]) { prop.value = values[name]; written.current[name] = values[name] }
    }
    for (const name of Object.keys(values)) if (!["phase", "outcome", "viewerFirst"].includes(name)) set(name)
    set("viewerFirst"); set("outcome"); set("phase")
    if (!reported.current) { reported.current = true; onStatus("ready") }
  }, [instance, values, onStatus])

  return <RiveComponent aria-hidden="true" tabIndex={-1} className="ink-canvas" />
}
