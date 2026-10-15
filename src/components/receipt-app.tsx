import { useEffect, useMemo, useState } from "react"
import {
  DECK,
  cleanDesire,
  dailyReceipt,
  dailySeedFor,
  deckDesire,
  fold,
  formatStamp,
  generateLines,
  hashString,
  present,
  receiptNo,
  type RoomTally,
} from "@/lib/receipt"
import { castStrike, readRoom } from "@/lib/room.functions"
import { createDuel, readDuel, answerDuel, eraseDuel } from "@/lib/duel.functions"
import { canonicalSelections, type DuelView } from "@/lib/duel-contract"
import { canAdvanceChoice, experiencePhase } from "@/lib/experience-state"
import { makeDuplexPoster } from "@/lib/duel-image"
import { DuplexResult } from "@/components/duplex-result"
import { RivePaperStage } from "@/components/rive-paper"
import { SEALED_DWELL_MS, isFreshSeal, rivePaperState, visualPhase, type RivePhaseName } from "@/lib/rive-paper-contract"
import { CATEGORY, challengeCopy, duelCopy, localizedCost, localizedDesire, localizedServerError, parseLocale, t, type Locale } from "@/lib/locale"

const HISTORY_KEY = "lerecu.v1"
const TOKEN_KEY = "lerecu.token"
const LOCALE_KEY = "lerecu.locale.v1"

function preferredLocale(): Locale {
  const query = parseLocale(new URLSearchParams(location.search).get("lang"))
  if (query) return query
  try {
    const stored = parseLocale(localStorage.getItem(LOCALE_KEY))
    if (stored) return stored
  } catch { /* optional */ }
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "fr"
}

function voterToken(): string | null {
  try {
    const existing = localStorage.getItem(TOKEN_KEY)
    if (existing && /^[a-f0-9]{32}$/.test(existing)) return existing
    const next = crypto.randomUUID().replaceAll("-", "")
    localStorage.setItem(TOKEN_KEY, next)
    return next
  } catch {
    return null
  }
}
const LIVE_KEY = "lerecu.live.v2"

type Saved = { d: string; s: number; x: number; t: number }

type Live = {
  d: string
  s: number
  t: number
  mine: number | null
  theirs: number | null
  show: boolean
}

function quote(value: string,locale:Locale):string {
  return locale==="en"?`“${value}”`:`«\u00a0${value}\u00a0»`
}

function isSaved(value: unknown): value is Saved {
  if (!value || typeof value !== "object") return false
  const row = value as Saved
  return (
    typeof row.d === "string" &&
    typeof row.s === "number" &&
    typeof row.x === "number" &&
    typeof row.t === "number"
  )
}

function loadHistory(): Saved[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (!raw) return []
    const data = JSON.parse(raw) as unknown
    if (!Array.isArray(data)) return []
    return data.filter(isSaved).slice(0, 8)
  } catch {
    return []
  }
}

function pushHistory(item: Saved): Saved[] {
  const next = [item, ...loadHistory().filter((row) => !(row.d === item.d && row.x === item.x && row.s === item.s))].slice(
    0,
    8,
  )
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    return next
  }
  return next
}

function isLive(value: unknown): value is Live {
  if (!value || typeof value !== "object") return false
  const row = value as Live
  const index = (n: number | null) => n === null || (Number.isInteger(n) && n >= 0 && n <= 4)
  return (
    typeof row.d === "string" &&
    typeof row.s === "number" &&
    typeof row.t === "number" &&
    index(row.mine) &&
    index(row.theirs) &&
    typeof row.show === "boolean"
  )
}

function loadLive(): Live | null {
  try {
    const raw = sessionStorage.getItem(LIVE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as unknown
    return isLive(data) ? data : null
  } catch {
    return null
  }
}

function saveLive(live: Live) {
  try {
    sessionStorage.setItem(LIVE_KEY, JSON.stringify(live))
  } catch {
    return
  }
}

function duelFromUrl(): string | null {
  return new URLSearchParams(location.search).get("duel")
}

function setDuelUrl(id: string | null) {
  const url = new URL(location.href)
  if (id) url.searchParams.set("duel", id)
  else url.searchParams.delete("duel")
  // A temporary Vercel Preview access grant must never be carried into public challenge URLs.
  url.searchParams.delete("_vercel_share")
  url.hash = ""
  history.replaceState(null, "", url.pathname + url.search)
}

function duelUrl(id: string, locale: Locale) {
  const url = new URL(location.href)
  url.searchParams.set("duel", id)
  url.searchParams.set("lang",locale)
  url.searchParams.delete("_vercel_share")
  url.hash = ""
  return url.toString()
}

function Bars({ weight }: { weight: 1 | 2 | 3 }) {
  return (
    <span className="flex items-center gap-1" aria-hidden="true">
      {[1, 2, 3].map((step) => (
        <span key={step} className={step <= weight ? "h-2 w-3 bg-ink" : "h-2 w-3 bg-ink/15"} />
      ))}
    </span>
  )
}

function Rule({ seed }: { seed: number }) {
  return (
    <div className="mt-5 flex h-7 items-end gap-px" aria-hidden="true">
      {Array.from({ length: 36 }, (_, index) => {
        const on = ((seed >>> (index % 31)) & 1) === 1
        const tall = ((seed >>> ((index * 3) % 31)) & 3) === 0
        return <span key={index} className={on ? (tall ? "h-7 w-0.5 bg-ink" : "h-4 w-0.5 bg-ink") : "h-7 w-px bg-ink/20"} />
      })}
    </div>
  )
}

export function ReceiptApp() {
  const opening = useMemo(() => dailyReceipt(), [])
  const [desire, setDesire] = useState(opening.desire)
  const [seed, setSeed] = useState(opening.seed)
  const [createdAt, setCreatedAt] = useState(0)
  const [mine, setMine] = useState<number | null>(null)
  const [theirs, setTheirs] = useState<number | null>(null)
  const [spectacle, setSpectacle] = useState(false)
  const [booted, setBooted] = useState(false)
  const [draft, setDraft] = useState("")
  const [customOpen, setCustomOpen] = useState(false)
  const [historyRows, setHistoryRows] = useState<Saved[]>([])
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle")
  const [shareBlock, setShareBlock] = useState("")
  const [room, setRoom] = useState<RoomTally | null>(null)
  const [roomJoined, setRoomJoined] = useState(false)
  const [roomOpen, setRoomOpen] = useState(false)
  const [roomSubmitting, setRoomSubmitting] = useState(false)
  const [duelId, setDuelId] = useState<string | null>(null)
  const [duelRole, setDuelRole] = useState<DuelView["role"]>("guest")
  const [duelStatus, setDuelStatus] = useState<DuelView["status"] | "none">("none")
  const [locale, setLocale] = useState<Locale>("fr")
  const [busy, setBusy] = useState(false)
  const [busyAction, setBusyAction] = useState<"seal" | "share" | "check" | "reply" | null>(null)
  const [responseChecked, setResponseChecked] = useState(false)
  const [posterBusy, setPosterBusy] = useState(false)
  const [eraseBusy, setEraseBusy] = useState(false)
  const [eraseNotice, setEraseNotice] = useState("")
  const [duelError, setDuelError] = useState("")
  const [inviteUnreadable, setInviteUnreadable] = useState(false)
  const [proximity, setProximity] = useState(0)
  const [seenPaperPhase, setSeenPaperPhase] = useState<RivePhaseName | null>(null)
  const [sealedHold, setSealedHold] = useState(false)

  const lines = useMemo(() => (desire ? generateLines(desire, seed) : []), [desire, seed])
  const phase = experiencePhase({id:duelId,role:duelRole,status:duelStatus,mine,theirs})
  // The paper (Rive or its static twin) is a projection of state the server has already answered.
  const paperState = rivePaperState({
    experience:{id:duelId,role:duelRole,status:duelStatus,mine,theirs},
    action:busyAction, hasError:duelError!=="", loadFailed:inviteUnreadable,
  })
  if (seenPaperPhase !== paperState.phase) {
    // derived during render so a freshly confirmed seal never flashes as "waiting" first
    setSeenPaperPhase(paperState.phase)
    if (isFreshSeal(seenPaperPhase, paperState.phase)) setSealedHold(true)
    else if (paperState.phase !== "waiting") setSealedHold(false)
  }
  const paperPhase = visualPhase(paperState.phase, sealedHold)
  const reveal = phase === "reveal"
  const shown = useMemo(() => present(lines, mine, theirs, reveal), [lines, mine, theirs, reveal])
  const words=t(locale)
  const shownDesire=localizedDesire(desire,locale)
  const myLabel=mine!==null&&lines[mine]?localizedCost(lines[mine],locale).label:""
  const theirLabel=theirs!==null&&reveal&&lines[theirs]?localizedCost(lines[theirs],locale).label:""
  const same = reveal && mine !== null && mine === theirs
  const ordered = canonicalSelections(duelRole, mine, theirs)

  useEffect(() => {
    if (!sealedHold) return
    const id = window.setTimeout(() => setSealedHold(false), SEALED_DWELL_MS)
    return () => window.clearTimeout(id)
  }, [sealedHold])

  useEffect(() => {
    let cancelled = false
    async function boot() {
      setHistoryRows(loadHistory())
      setLocale(preferredLocale())
      const id = duelFromUrl()
      const token = voterToken()
      if (id) {
        if (!token) {
          setDuelError(t(preferredLocale()).storage)
        } else {
          try {
            const view = await readDuel({ data: { id, token } })
            if (cancelled) return
            if (view.status === "missing") {
              setDuelError(t(preferredLocale()).missing)
              setInviteUnreadable(true)
            } else {
              setDuelId(id)
              setDuelRole(view.role)
              setDuelStatus(view.status)
              setDesire(view.desire)
              setSeed(view.seed)
              setCreatedAt(view.createdAt)
              setMine(view.mine)
              setTheirs(view.theirs)
              setSpectacle(view.status === "complete")
            }
          } catch (error) {
            if (!cancelled) {
              setDuelError(error instanceof Error ? localizedServerError(error.message,preferredLocale()) : t(preferredLocale()).unavailable)
              setInviteUnreadable(true)
            }
          }
        }
      } else {
        const live = loadLive()
        if (live && cleanDesire(live.d).length >= 2) {
          setDesire(live.d)
          setSeed(live.s)
          setCreatedAt(live.t)
          setMine(live.mine)
          setTheirs(live.theirs)
          setSpectacle(live.show)
        } else {
          setCreatedAt(Date.now())
        }
      }
      if (!cancelled) setBooted(true)
    }
    void boot()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10)
    const issuedDay = createdAt > 0 ? new Date(createdAt).toISOString().slice(0, 10) : ""
    if (!booted || !roomOpen || mine === null || !deckDesire(desire) ||
        dailySeedFor(desire) !== seed || today !== issuedDay) {
      setRoom(null)
      return
    }
    let cancel = false
    // Reading the room does NOT cast a vote. Only the explicit opt-in action
    // below is allowed to persist an anonymous browser-token strike.
    void readRoom({ data: { desire } }).then((next) => {
      if (!cancel) setRoom(next)
    }).catch(() => {
      if (!cancel) setRoom(null)
    })
    return () => {
      cancel = true
    }
  }, [booted, roomOpen, mine, desire, seed, createdAt])

  useEffect(() => {
    if (!booted) return
    saveLive({ d: desire, s: seed, t: createdAt, mine, theirs, show: spectacle })
  }, [booted, desire, seed, createdAt, mine, theirs, spectacle])

  useEffect(() => {
    if (!booted) return
    document.documentElement.lang=locale
    document.title=t(locale).title
    const description=document.querySelector('meta[name="description"]')
    description?.setAttribute("content",locale==="fr"
      ?"Cinq coûts. Tu en barres un. Eux barrent sans voir le tien."
      :"Five costs. Refuse one. They choose before seeing yours.")
  }, [booted,locale])

  function switchLocale(next: Locale) {
    setLocale(next)
    try {localStorage.setItem(LOCALE_KEY,next)} catch { /* optional */ }
    const url=new URL(location.href)
    url.searchParams.set("lang",next)
    history.replaceState(null,"",url.pathname+url.search+url.hash)
  }

  useEffect(() => {
    if (copied !== "ok") return
    const id = window.setTimeout(() => setCopied("idle"), 1600)
    return () => window.clearTimeout(id)
  }, [copied])


  function resetDuel() {
    setDuelId(null)
    setDuelRole("guest")
    setDuelStatus("none")
    setDuelError("")
    setInviteUnreadable(false)
    setResponseChecked(false)
    setDuelUrl(null)
  }

  function issue(raw: string) {
    const next = cleanDesire(raw)
    if (next.length < 2) return
    setDesire(next)
    setSeed(deckDesire(next) ? dailySeedFor(next) : hashString(fold(next)))
    setCreatedAt(Date.now())
    setMine(null)
    setTheirs(null)
    setSpectacle(false)
    setDraft("")
    setCustomOpen(false)
    setCopied("idle")
    setRoom(null)
    setRoomJoined(false)
    setRoomOpen(false)
    setEraseNotice("")
    resetDuel()
    window.scrollTo({ top: 0, behavior: "auto" })
  }

  async function strike(index: number) {
    if (mine !== null || spectacle || busy) return
    if (duelId) {
      if (duelRole !== "guest" || duelStatus !== "pending") return
      const token = voterToken()
      if (!token) {
        setDuelError(words.storage)
        return
      }
      setBusy(true)
      setBusyAction("reply")
      setDuelError("")
      try {
        const view = await answerDuel({ data: { id: duelId, line: index, token } })
        if (view.status !== "complete") throw new Error(words.errorReceipt)
        setMine(view.mine)
        setTheirs(view.theirs)
        setSpectacle(true)
        setDuelRole(view.role)
        setDuelStatus(view.status)
        setHistoryRows(pushHistory({ d: desire, s: seed, x: index, t: createdAt }))
      } catch (error) {
        setDuelError(error instanceof Error ? localizedServerError(error.message,locale) : words.errorReply)
      } finally {
        setBusy(false)
        setBusyAction(null)
      }
      return
    }
    setMine(index)
    setHistoryRows(pushHistory({ d: desire, s: seed, x: index, t: createdAt || Date.now() }))
  }

  function playMine() {
    // An invitation chain is a NEW independent decision, never a replay of
    // an expired receipt/old daily seed or a public reveal of the previous pair.
    issue(desire)
  }

  function openSaved(item: Saved) {
    setDesire(item.d)
    setSeed(item.s)
    setCreatedAt(item.t)
    setMine(item.x)
    setTheirs(null)
    setSpectacle(false)
    setCopied("idle")
    setRoom(null)
    setRoomJoined(false)
    setRoomOpen(false)
    resetDuel()
  }

  async function joinRoom() {
    if (roomSubmitting || roomJoined || mine === null || !deckDesire(desire)) return
    const token=voterToken()
    if(!token){setDuelError(words.storage);return}
    setRoomSubmitting(true)
    setDuelError("")
    try {
      const next=await castStrike({data:{desire,line:mine,token,seed,issuedAt:createdAt}})
      setRoom(next)
      setRoomJoined(true)
    } catch(error) {
      setDuelError(error instanceof Error ? localizedServerError(error.message,locale) : words.unavailable)
    } finally { setRoomSubmitting(false) }
  }

  async function eraseCurrentDuel() {
    if (!duelId || eraseBusy || (duelRole !== "owner" && duelRole !== "responder")) return
    if (!window.confirm(words.eraseConfirm)) return
    const token=voterToken()
    if (!token) {setDuelError(words.storage);return}
    setEraseBusy(true)
    setDuelError("")
    setEraseNotice("")
    try {
      const result=await eraseDuel({data:{id:duelId,token}})
      if (!result.erased) throw new Error(words.eraseFailed)
      const saved=loadHistory().filter(row=>
        !(row.d===desire && row.s===seed && row.x===mine)
      )
      try {localStorage.setItem(HISTORY_KEY,JSON.stringify(saved))} catch { /* optional local cache */ }
      setHistoryRows(saved)
      issue(desire)
      setEraseNotice(words.eraseSuccess)
    } catch(error) {
      setDuelError(error instanceof Error && error.message===words.eraseFailed
        ? words.eraseFailed
        : error instanceof Error ? localizedServerError(error.message,locale) : words.eraseFailed)
    } finally {setEraseBusy(false)}
  }

  async function writeShare(text: string, url: string) {
    // A copied invite should paste directly into a browser's address field.
    const block = text && url ? `${text}\n${url}` : url || text
    try {
      await navigator.clipboard.writeText(block)
      setCopied("ok")
      setShareBlock("")
    } catch {
      setCopied("fail")
      setShareBlock(block)
    }
  }

  async function share(text: string, url: string) {
    if (navigator.share) {
      try {
        await navigator.share(url ? { title: words.title, text, url } : { title: words.title, text })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    await writeShare(text, url)
  }

  async function defy(copyOnly = false) {
    if (mine === null || busy) return
    const token = voterToken()
    if (!token) {
      setDuelError(words.storage)
      return
    }
    setBusy(true)
    setBusyAction(duelId ? "share" : "seal")
    setDuelError("")
    try {
      let id = duelId
      if (!id) {
        const view = await createDuel({ data: { desire, seed, line: mine, token } })
        id = view.id
        setDuelId(id)
        setDuelRole("owner")
        setDuelStatus("pending")
        setCreatedAt(view.createdAt)
        setDuelUrl(id)
        // A second explicit tap preserves mobile user activation for Web Share.
        // A newly created challenge has no recipient until the owner sends it.
        return
      }
      const url = duelUrl(id,locale)
      if (copyOnly) await writeShare("", url)
      else await share(challengeCopy(desire,locale), url)
    } catch (error) {
      setDuelError(error instanceof Error ? localizedServerError(error.message,locale) : words.errorCreate)
    } finally {
      setBusy(false)
      setBusyAction(null)
    }
  }

  async function checkResponse() {
    if (!duelId || busy) return
    const token = voterToken()
    if (!token) return
    setBusy(true)
    setBusyAction("check")
    setResponseChecked(false)
    setDuelError("")
    try {
      const view = await readDuel({ data: { id: duelId, token } })
      setDuelRole(view.role)
      setDuelStatus(view.status)
      setResponseChecked(view.status === "pending")
      if (view.status === "complete") {
        setMine(view.mine)
        setTheirs(view.theirs)
        setSpectacle(true)
      }
    } catch (error) {
      setDuelError(error instanceof Error ? localizedServerError(error.message,locale) : words.errorCheck)
    } finally {
      setBusy(false)
      setBusyAction(null)
    }
  }

  async function downloadDuelPoster() {
    if (!ordered || posterBusy) return
    setPosterBusy(true)
    setDuelError("")
    try {
      const first = lines[ordered.first]
      const second = lines[ordered.second]
      if (!first || !second) throw new Error(words.errorExport)
      const blob = await makeDuplexPoster({
        desire: shownDesire,
        first: localizedCost(first, locale).label,
        second: localizedCost(second, locale).label,
        locale, timestamp: createdAt, number: receiptNo(seed),
      })
      const file = new File([blob], "le-recu-duplex.png", { type: "image/png" })
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title:words.title,text:words.invitation })
          return
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return
        }
      }
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = objectUrl
      link.download = "le-recu-duplex.png"
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 4000)
    } catch (error) {
      setDuelError(error instanceof Error ? localizedServerError(error.message,locale) : words.errorExport)
    } finally {
      setPosterBusy(false)
    }
  }

  function showDuel() {
    if (mine === null || theirs === null) return
    void share(duelCopy(desire,theirLabel,myLabel,locale),"")
  }

  const sub = reveal
    ? words.revealed
    : duelId && duelRole === "guest" && duelStatus === "pending"
      ? words.hidden
      : duelId && duelRole === "owner" ? words.owner
        : mine !== null ? words.decided : words.intro
  const kicker = phase==="unavailable" ? words.stepUnavailable : reveal
    ? same ? words.kickerSame : words.kickerDifferent
    : duelId && duelRole === "guest" && duelStatus === "pending"
      ? words.kickerBlind : mine !== null ? words.kickerReady : words.kickerToday

  const locked = mine !== null || spectacle || busy || (duelId !== null && duelStatus !== "pending")
  const canAdvance = canAdvanceChoice({id:duelId,role:duelRole,status:duelStatus,mine,theirs})
  const canShareResult=phase==="reveal"&&ordered!==null
  const flowLabels=[words.stepChoose, words.stepSeal,
    phase === "reply" ? words.stepReply : words.stepWaiting,words.stepReveal]
  const flowAt = phase==="unavailable" ? -1 : phase === "choose" ? 0 : phase === "seal" ? 1
    : phase === "reveal" ? 3 : 2

  if (!booted) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-start px-4 pt-10">
        <div role="status" className="paper w-full px-6 py-10">
          <p className="font-display text-3xl">{words.title}</p>
          <p className="mt-3 text-xs tracking-widest text-ink/60">{words.loading}</p>
        </div>
      </main>
    )
  }

  return (
    <main className={`receipt-world mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-5 ${canAdvance || canShareResult ? "pb-44" : "pb-12"}`}>
      <aside aria-hidden="true" className="editorial-side">
        <span className="editorial-serial">{words.edition}</span>
        <strong>{words.typographyLead}</strong>
        <em>{words.typographyClose}</em>
        <span className="editorial-rule" />
      </aside>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs tracking-widest text-paper/50">{kicker}</p>
        <div role="group" aria-label="Langue / Language" className="flex gap-1" data-language>
          {(["fr","en"] as const).map((lang) => (
            <button key={lang} type="button" lang={lang} aria-pressed={locale===lang}
              onClick={() => switchLocale(lang)}
              className={`tap min-h-11 min-w-11 border px-3 text-xs tracking-widest ${locale===lang?"border-paper bg-paper text-ink":"border-paper/35 text-paper"}`}>
              {lang.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <nav aria-label={words.journey} className="journey-rail mt-4" data-phase={phase}>
        {flowLabels.map((label,index)=>(
          <span key={index} aria-current={index===flowAt?"step":undefined}
            className={`journey-step ${index===flowAt?"journey-active":index<flowAt?"journey-past":""}`}>
            <span className="journey-tick" aria-hidden="true" />
            <span>{label}</span>
          </span>
        ))}
      </nav>
      {duelError ? <p role="alert" className="mt-3 border border-stamp px-3 py-3 text-sm leading-normal text-paper">{duelError}</p> : null}
      {duelId && duelRole === "owner" && duelStatus === "pending" ? (
        <p className="mt-3 text-xs text-paper/55">{words.pending}</p>
      ) : null}
      {duelStatus === "closed" || duelStatus === "expired" ? (
        <p role="status" className="mt-3 text-sm text-paper/70">
          {duelStatus === "expired" ? words.expired : words.closed}
        </p>
      ) : null}
      {(phase==="unavailable" || (duelError && duelFromUrl() && !duelId)) ? (
        <button type="button" onClick={()=>issue(desire)}
          className="tap mt-3 min-h-12 w-full border border-paper/50 text-sm text-paper">
          {words.recover}
        </button>
      ) : null}

      {/* Keyed by the receipt only: the Rive stage must survive the reveal so the second impression
          prints onto the very same paper instead of a freshly mounted canvas. */}
      <div key={`${desire}-${seed}`} data-receipt className="paper-in mt-3">
        <article className="paper receipt-sheet px-4 pt-4 pb-4" data-paper-state={phase}>
          <header className="flex items-baseline justify-between gap-3">
            <p className="font-display text-xl font-semibold tracking-wide">{words.title}</p>
            <p className="text-xs text-ink/55 tabular-nums">Nº {receiptNo(seed)}</p>
          </header>
          <p className="mt-1 text-xs text-ink/55 tabular-nums">{createdAt > 0 ? formatStamp(createdAt) : "\u00a0"}</p>
          <h1
            className={
              desire.length > 32
                ? "mt-4 font-display text-2xl font-medium italic leading-tight text-balance break-words"
                : "mt-4 font-display text-3xl font-medium italic leading-tight text-balance break-words"
            }
          >
            {quote(shownDesire,locale)}
          </h1>
          <p className="mt-2 text-sm leading-normal text-pretty text-ink/70">{sub}</p>
          {phase==="choose" ? (
            <p className="reading-cue mt-3">{words.selectionHint}</p>
          ) : phase==="seal" ? (
            <p className="reading-cue mt-3">{words.afterChoice}</p>
          ) : null}
          {phase==="reply" ? (
            <p className="mt-3 border-l-2 border-stamp/55 pl-3 text-xs leading-relaxed text-ink/65">{words.betaGuest}</p>
          ) : null}
          <ul className="lines mt-4 divide-y divide-ink/10"
            onPointerOver={(event) => setProximity((event.target as HTMLElement).closest(".line-btn:not(:disabled)") ? 1 : 0)}
            onPointerLeave={() => setProximity(0)}
            onFocusCapture={() => setProximity(0.8)}
            onBlurCapture={() => setProximity(0)}>
            {shown.map((line, index) => (
              <li key={line.id}>
                <button
                  type="button"
                  className="tap line-btn min-h-11 w-full py-3 text-left disabled:opacity-100"
                  disabled={locked || !booted}
                  onClick={() => strike(index)}
                  aria-label={locked ? undefined : `${words.refuse} ${localizedCost(line,locale).label}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs tracking-widest text-ink/50">{CATEGORY[locale][line.cat]}</span>
                    {line.refused ? (
                      <span className="text-xs tracking-widest text-stamp">{line.theirs ? words.twoMarked : words.no}</span>
                    ) : line.theirs ? (
                      <span className="text-xs tracking-widest text-stamp">{words.other}</span>
                    ) : roomJoined && room && room.total >= 2 ? (
                      <span className="text-xs tabular-nums text-ink/50">{room.counts[index]}</span>
                    ) : (
                      <Bars weight={line.weight} />
                    )}
                  </span>
                  <span
                    className={
                      line.refused
                        ? "mt-1 block text-base leading-normal line-through decoration-stamp"
                        : "mt-1 block text-base leading-normal"
                    }
                  >
                    {localizedCost(line,locale).label}
                  </span>
                  <span className="mt-1 block text-sm leading-normal text-pretty text-ink/70">{localizedCost(line,locale).detail}</span>
                </button>
              </li>
            ))}
          </ul>
          <RivePaperStage state={paperState} phase={paperPhase} proximity={proximity} locale={locale} refusedLabel={myLabel} />
          {mine !== null && duelRole !== "responder" && (phase==="seal" || phase==="waiting") ? (
            <p className="mt-4 border-l-2 border-stamp/55 pl-3 text-xs leading-relaxed text-ink/65">
              {words.betaNotice}
            </p>
          ) : null}
          {mine !== null || theirs !== null ? (
          <div className="flex items-center justify-center py-4" aria-live="polite">
            {mine === null && theirs !== null ? (
              <p className="max-w-64 text-center text-sm leading-normal text-pretty text-ink/70">
                {words.sealedOther}
              </p>
            ) : null}
            {mine !== null && !reveal ? (
              <div className="text-center">
                {/* No stamp here: the seal is drawn by the paper stage only after the server confirms createDuel. */}
                <p className="text-sm leading-normal text-ink/70">
                  {words.refused}
                  <span className="mt-1 block font-display text-xl font-medium italic text-ink">{myLabel}</span>
                </p>
              </div>
            ) : null}
            {reveal ? (
              <DuplexResult same={same} mine={myLabel} theirs={theirLabel} locale={locale} />
            ) : null}
          </div>
          ) : null}
          <Rule seed={seed} />
          <p className="mt-4 text-center text-xs tracking-widest text-ink/40">{words.signoff}</p>
        </article>
        <div className="paper-teeth" aria-hidden="true" />
      </div>

      <div data-actions className="action-block mt-6 flex flex-col gap-3">
        <p className="action-eyebrow">{words.actionLabel}</p>
        {canAdvance ? (
          <button type="button" disabled={busy} className="tap h-12 w-full bg-paper text-sm font-medium text-ink disabled:opacity-50" onClick={() => void defy()}>
            {busy && busyAction === "share" ? words.sharing : busy && busyAction === "seal" ? words.sealing : duelId ? words.send : words.seal}
          </button>
        ) : null}
        {duelId && duelRole === "owner" && duelStatus === "pending" ? (
          <button type="button" disabled={busy} className="tap h-12 w-full border border-paper/30 text-sm text-paper disabled:opacity-50" onClick={() => void checkResponse()}>
            {busyAction === "check" ? words.checking : words.check}
          </button>
        ) : null}
        {responseChecked && duelRole === "owner" && duelStatus === "pending" ? (
          <p role="status" className="text-center text-sm text-paper/70">
            {words.stillPending}
          </p>
        ) : null}
        {reveal ? (
          <>
            <button type="button" disabled={posterBusy} className="tap h-12 w-full bg-paper text-sm font-medium text-ink disabled:opacity-50" onClick={() => void downloadDuelPoster()}>
              {posterBusy ? words.composing : words.poster}
            </button>
            <button type="button" className="tap h-12 w-full border border-paper/30 text-sm text-paper" onClick={showDuel}>
              {words.copyText}
            </button>
          </>
        ) : null}
        {mine !== null && theirs !== null && !spectacle ? (
          <button type="button" className="tap h-12 w-full border border-paper/30 text-sm text-paper" onClick={() => void defy()}>
            {words.challengeAgain}
          </button>
        ) : null}
        {spectacle ? (
          <button type="button" className="tap h-12 w-full border border-paper/30 text-sm text-paper" onClick={playMine}>
            {words.again}
          </button>
        ) : null}
        {mine !== null && theirs === null && duelId ? (
          <button
            type="button"
            className="tap h-12 w-full border border-paper/30 text-sm text-paper"
            onClick={() => void defy(true)}
          >
            {words.copyUrl}
          </button>
        ) : null}
        {reveal ? (
          <button
            type="button"
            className="tap h-12 w-full border border-paper/30 text-sm text-paper"
            onClick={() => {
              if (mine === null || theirs === null) return
              void writeShare(
                duelCopy(desire,theirLabel,myLabel,locale), "",
              )
            }}
          >
            {words.copyDuel}
          </button>
        ) : null}
        {duelId && (duelRole === "owner" || duelRole === "responder") ? (
          <button type="button" disabled={eraseBusy || busy}
            className="tap min-h-12 w-full border border-stamp/60 text-sm text-paper/85 disabled:opacity-50"
            onClick={() => void eraseCurrentDuel()}>
            {eraseBusy ? words.erasing : words.erase}
          </button>
        ) : null}
        {eraseNotice ? <p role="status" className="text-center text-sm text-paper/75">{eraseNotice}</p> : null}
        {copied === "ok" ? <p role="status" className="text-center text-sm text-paper/70">{words.copied}</p> : null}
        {copied === "fail" ? (
          <pre className="overflow-x-auto text-xs leading-normal whitespace-pre-wrap text-paper/75">{shareBlock}</pre>
        ) : null}
      </div>

      {mine!==null && deckDesire(desire) ? (
        <details className="room-drawer mt-8 border-t border-paper/20 pt-4"
          onToggle={(event)=>setRoomOpen(event.currentTarget.open)}>
          <summary className="tap cursor-pointer text-xs tracking-widest text-paper/65">{words.room}</summary>
          <div className="mt-4 space-y-3">
            <p className="text-xs leading-relaxed text-paper/65">{words.roomNotice}</p>
            {roomJoined && room ? (
              room.total<2 ? (
                <p role="status" className="text-xs text-paper/60">{words.empty}</p>
              ) : room.top===null ? (
                <p className="text-sm text-paper/70">{words.tie(room.total)}</p>
              ) : (
                <p className="text-sm text-paper/85">
                  {lines[room.top] ? localizedCost(lines[room.top],locale).label : ""}
                  <span className="ml-2 text-xs text-paper/60">{words.of(room.counts[room.top],room.total)}</span>
                </p>
              )
            ) : null}
            {!roomJoined ? (
              <button type="button" onClick={()=>void joinRoom()} disabled={roomSubmitting}
                className="tap min-h-12 w-full border border-paper/40 text-sm text-paper disabled:opacity-50">
                {roomSubmitting?words.roomSubmitting:words.roomConsent}
              </button>
            ) : <p role="status" className="text-xs text-paper/65">{words.roomJoined}</p>}
          </div>
        </details>
      ) : null}
      <div className="mt-8">
        <p className="text-xs tracking-widest text-paper/50">{words.more}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DECK.filter((prompt) => fold(prompt) !== fold(desire)).map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="tap h-11 border border-paper/25 px-3 text-sm text-paper"
              onClick={() => issue(prompt)}
            >
              {localizedDesire(prompt,locale)}
            </button>
          ))}
          <button
            type="button"
            className="tap h-11 border border-paper/25 px-3 text-sm text-paper"
            onClick={() => setCustomOpen((open) => !open)}
          >
            {words.mine}
          </button>
        </div>
        {customOpen ? (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault()
              issue(draft)
            }}
          >
            <label htmlFor="envie" className="text-sm text-paper/70">
              {words.yourWish}
            </label>
            <p className="mt-2 text-xs leading-normal text-paper/55">
              {words.personal}
            </p>
            <input
              id="envie"
              value={draft}
              maxLength={72}
              enterKeyHint="done"
              autoComplete="off"
              placeholder={words.placeholder}
              onChange={(event) => setDraft(event.target.value)}
              className="mt-2 w-full border-b border-paper/25 bg-transparent py-3 font-display text-2xl font-semibold text-paper outline-none placeholder:text-paper/45"
            />
            <button
              type="submit"
              className="tap mt-4 h-12 w-full bg-paper text-sm font-medium text-ink disabled:opacity-40"
              disabled={cleanDesire(draft).length < 2}
            >
              {words.print}
            </button>
          </form>
        ) : null}
      </div>

      {canAdvance || canShareResult ? (
        <aside className="mobile-next fixed inset-x-0 bottom-0 z-40 border-t border-paper/20 bg-carbon/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden" aria-label={words.nextStep}>
          <p className="mx-auto mb-2 max-w-md text-[10px] leading-snug text-paper/70">{canShareResult?words.invitation:words.betaNoticeShort}</p>
          <div className="mx-auto flex max-w-md items-center gap-3">
            <span className="max-w-24 shrink-0 text-[10px] leading-tight tracking-widest text-paper/70">{words.nextStep}</span>
            <button type="button" disabled={busy||posterBusy}
              className="tap min-h-12 flex-1 bg-paper px-3 text-sm font-medium text-ink disabled:opacity-50"
              onClick={() => canShareResult ? void downloadDuelPoster() : void defy()}>
              {canShareResult ? (posterBusy?words.composing:words.poster)
                : busyAction==="seal"?words.sealing:busyAction==="share"?words.sharing:duelId?words.send:words.seal}
            </button>
          </div>
        </aside>
      ) : null}

      {historyRows.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs tracking-widest text-paper/50">{words.receipts}</h2>
          <ul className="mt-2">
            {historyRows.map((item) => {
              const savedCost=generateLines(item.d,item.s)[item.x]
              const label=savedCost?localizedCost(savedCost,locale).label:""
              return (
                <li key={`${item.t}-${item.s}-${item.x}`}>
                  <button
                    type="button"
                    className="tap min-h-11 w-full border-t border-paper/15 py-3 text-left"
                    onClick={() => openSaved(item)}
                  >
                    <span className="block text-paper">{quote(localizedDesire(item.d,locale),locale)}</span>
                    <span className="mt-1 block text-sm text-paper/55">{words.history} · {label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      ) : null}
    </main>
  )
}
