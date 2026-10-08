import { useEffect, useMemo, useState } from "react"
import {
  CAT_LABEL,
  DECK,
  challengeText,
  cleanDesire,
  dailyReceipt,
  deckDesire,
  decodePayload,
  duelText,
  encodePayload,
  fold,
  formatStamp,
  generateLines,
  hashString,
  present,
  receiptNo,
  type Payload,
  type RoomTally,
} from "@/lib/receipt"
import { castStrike, readRoom } from "@/lib/room.functions"

const HISTORY_KEY = "lerecu.v1"
const TOKEN_KEY = "lerecu.token"

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

function quote(value: string): string {
  return `«\u00a0${value}\u00a0»`
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

function readHash(): Payload | null {
  const code = location.hash.replace(/^#/, "")
  if (!code) return null
  try {
    return decodePayload(decodeURIComponent(code))
  } catch {
    return decodePayload(code)
  }
}

function setHash(code: string) {
  history.replaceState(null, "", `${location.pathname}${location.search}#${code}`)
}

function clearHash() {
  history.replaceState(null, "", `${location.pathname}${location.search}`)
}

function pageUrl(payload: Payload): string {
  return `${location.origin}${location.pathname}${location.search}#${encodePayload(payload)}`
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

  const lines = useMemo(() => (desire ? generateLines(desire, seed) : []), [desire, seed])
  const reveal = spectacle || (mine !== null && theirs !== null)
  const shown = useMemo(() => present(lines, mine, theirs, reveal), [lines, mine, theirs, reveal])
  const myLabel = mine !== null ? lines[mine]?.label ?? "" : ""
  const theirLabel = theirs !== null && reveal ? lines[theirs]?.label ?? "" : ""
  const same = reveal && mine !== null && mine === theirs

  useEffect(() => {
    function applyPayload(payload: Payload) {
      setDesire(payload.d)
      setSeed(payload.s)
      setCreatedAt(payload.t)
      setTheirs(payload.a)
      setCopied("idle")
      if (payload.b !== undefined) {
        setMine(payload.b)
        setSpectacle(true)
      } else {
        setMine(null)
        setSpectacle(false)
      }
    }

    setHistoryRows(loadHistory())
    const payload = readHash()
    if (payload) {
      applyPayload(payload)
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
    setBooted(true)

    function onHash() {
      const next = readHash()
      if (next) applyPayload(next)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [])

  useEffect(() => {
    if (!booted || mine === null || !deckDesire(desire)) {
      setRoom(null)
      return
    }
    let cancel = false
    const run = spectacle
      ? readRoom({ data: { desire } })
      : (() => {
          const token = voterToken()
          return token ? castStrike({ data: { desire, line: mine, token } }) : readRoom({ data: { desire } })
        })()
    void run.then((next) => {
      if (!cancel) setRoom(next)
    }).catch(() => {
      if (!cancel) setRoom(null)
    })
    return () => {
      cancel = true
    }
  }, [booted, mine, desire, spectacle])

  useEffect(() => {
    if (!booted) return
    saveLive({ d: desire, s: seed, t: createdAt, mine, theirs, show: spectacle })
  }, [booted, desire, seed, createdAt, mine, theirs, spectacle])

  useEffect(() => {
    if (copied !== "ok") return
    const id = window.setTimeout(() => setCopied("idle"), 1600)
    return () => window.clearTimeout(id)
  }, [copied])

  function issue(raw: string) {
    const next = cleanDesire(raw)
    if (next.length < 2) return
    setDesire(next)
    setSeed(hashString(fold(next)))
    setCreatedAt(Date.now())
    setMine(null)
    setTheirs(null)
    setSpectacle(false)
    setDraft("")
    setCustomOpen(false)
    setCopied("idle")
    clearHash()
  }

  function strike(index: number) {
    if (mine !== null || spectacle) return
    setMine(index)
    setHistoryRows(pushHistory({ d: desire, s: seed, x: index, t: createdAt || Date.now() }))
    if (theirs !== null) setHash(encodePayload({ d: desire, s: seed, t: createdAt, a: theirs, b: index }))
  }

  function playMine() {
    setMine(null)
    setTheirs(null)
    setSpectacle(false)
    setCopied("idle")
    clearHash()
  }

  function openSaved(item: Saved) {
    setDesire(item.d)
    setSeed(item.s)
    setCreatedAt(item.t)
    setMine(item.x)
    setTheirs(null)
    setSpectacle(false)
    setCopied("idle")
    clearHash()
  }

  async function writeShare(text: string, url: string) {
    const block = `${text}\n${url}`
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
        await navigator.share({ title: "LE REÇU", text, url })
        return
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
      }
    }
    await writeShare(text, url)
  }

  function salleLine(): string | undefined {
    if (!room || room.top === null) return undefined
    const label = lines[room.top]?.label
    if (!label) return undefined
    return `la salle — ${label} (${room.counts[room.top]} sur ${room.total})`
  }

  function defy() {
    if (mine === null) return
    const payload: Payload = { d: desire, s: seed, t: createdAt, a: mine }
    void share(challengeText(desire, { mine: myLabel, salle: salleLine() }), pageUrl(payload))
  }

  function showDuel() {
    if (mine === null || theirs === null) return
    const payload: Payload = { d: desire, s: seed, t: createdAt, a: theirs, b: mine }
    void share(duelText(desire, lines[theirs]?.label ?? "", lines[mine]?.label ?? ""), pageUrl(payload))
  }

  const sub = reveal
    ? "Même envie. Le refus, lui, se voit."
    : theirs !== null && mine === null
      ? "Quelqu'un a barré. Tu ne vois pas laquelle."
      : mine !== null
        ? "Ta ligne est barrée. Eux joueront sans la voir."
        : "Cinq coûts. Tu en refuses un. Ensuite tu défies."
  const kicker = reveal
    ? same
      ? "MÊME REFUS"
      : "PAS LA MÊME LIGNE"
    : mine !== null
      ? "ENVOIE-LE"
      : theirs !== null
        ? "DÉFI"
        : "AUJOURD'HUI"

  const locked = mine !== null || spectacle

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pt-5 pb-12">
      <p className="text-xs tracking-widest text-paper/50">{kicker}</p>

      <div key={`${desire}-${seed}-${theirs ?? "x"}`} data-receipt className="paper-in mt-3">
        <article className="paper px-4 pt-4 pb-4">
          <header className="flex items-baseline justify-between gap-3">
            <p className="font-display text-xl font-semibold tracking-wide">LE REÇU</p>
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
            {quote(desire)}
          </h1>
          <p className="mt-2 text-sm leading-normal text-pretty text-ink/70">{sub}</p>
          <ul className="lines mt-4 divide-y divide-ink/10">
            {shown.map((line, index) => (
              <li key={line.id}>
                <button
                  type="button"
                  className="tap line-btn min-h-11 w-full py-3 text-left disabled:opacity-100"
                  disabled={locked || !booted}
                  onClick={() => strike(index)}
                  aria-label={locked ? undefined : `Refuser de payer ${line.label}`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-xs tracking-widest text-ink/50">{CAT_LABEL[line.cat]}</span>
                    {line.refused ? (
                      <span className="text-xs tracking-widest text-stamp">{line.theirs ? "TOI · EUX" : "NON"}</span>
                    ) : line.theirs ? (
                      <span className="text-xs tracking-widest text-stamp">EUX</span>
                    ) : room && room.total >= 2 ? (
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
                    {line.label}
                  </span>
                  <span className="mt-1 block text-sm leading-normal text-pretty text-ink/70">{line.detail}</span>
                </button>
              </li>
            ))}
          </ul>
          {mine !== null || theirs !== null ? (
          <div className="flex items-center justify-center py-4" aria-live="polite">
            {mine === null && theirs !== null ? (
              <p className="max-w-64 text-center text-sm leading-normal text-pretty text-ink/70">
                Leur ligne est scellée. Barre la tienne.
              </p>
            ) : null}
            {mine !== null && !reveal ? (
              <div className="text-center">
                <div className="stamp-in mx-auto flex size-24 items-center justify-center rounded-full border-2 border-stamp">
                  <div className="flex size-20 items-center justify-center rounded-full border border-stamp">
                    <span className="font-display text-3xl font-semibold tracking-widest text-stamp">DÛ</span>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-normal text-ink/70">
                  Refusé
                  <span className="mt-1 block font-display text-xl font-medium italic text-ink">{myLabel}</span>
                </p>
              </div>
            ) : null}
            {reveal ? (
              <div className="w-full text-center">
                <p className="text-xs tracking-widest text-stamp">{same ? "MÊME REFUS" : "PAS LA MÊME"}</p>
                {same ? (
                  <p className="mt-3 font-display text-xl font-medium italic leading-tight text-balance">{theirLabel}</p>
                ) : (
                  <div className="mt-3 grid grid-cols-2">
                    <div className="border-r border-ink/15 px-2">
                      <p className="text-xs tracking-widest text-ink/45">EUX</p>
                      <p className="mt-1 font-display text-lg font-medium italic leading-tight text-balance">{theirLabel}</p>
                    </div>
                    <div className="px-2">
                      <p className="text-xs tracking-widest text-stamp">TOI</p>
                      <p className="mt-1 font-display text-lg font-medium italic leading-tight text-balance">{myLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
          ) : null}
          {room && mine !== null && deckDesire(desire) ? (
            <div className="pt-3 text-center">
              {room.total < 2 ? (
                <p className="text-xs tracking-widest text-ink/45">LA SALLE EST VIDE</p>
              ) : room.top === null ? (
                <p className="text-sm leading-normal text-ink/70">{room.total} refus. Aucune ligne ne mène.</p>
              ) : (
                <>
                  <p className="text-xs tracking-widest text-ink/45">LA SALLE</p>
                  <p className="mt-1 font-display text-lg font-medium italic leading-tight text-balance">
                    {lines[room.top]?.label}
                  </p>
                  <p className="mt-1 text-xs tabular-nums text-ink/55">
                    {room.counts[room.top]} sur {room.total}
                  </p>
                </>
              )}
            </div>
          ) : null}
          <Rule seed={seed} />
          <p className="mt-4 text-center text-xs tracking-widest text-ink/40">PAS UN CONSEIL · UN PRIX</p>
        </article>
        <div className="paper-teeth" aria-hidden="true" />
      </div>

      <div data-actions className="mt-6 flex flex-col gap-3">
        {mine !== null && theirs === null ? (
          <button type="button" className="tap h-12 w-full bg-paper text-sm font-medium text-ink" onClick={defy}>
            Défier
          </button>
        ) : null}
        {reveal ? (
          <button type="button" className="tap h-12 w-full bg-paper text-sm font-medium text-ink" onClick={showDuel}>
            {spectacle ? "Envoyer le duel" : "Montrer le duel"}
          </button>
        ) : null}
        {mine !== null && theirs !== null && !spectacle ? (
          <button type="button" className="tap h-12 w-full border border-paper/30 text-sm text-paper" onClick={defy}>
            Défier à mon tour
          </button>
        ) : null}
        {spectacle ? (
          <button type="button" className="tap h-12 w-full border border-paper/30 text-sm text-paper" onClick={playMine}>
            À mon tour
          </button>
        ) : null}
        {mine !== null && theirs === null ? (
          <button
            type="button"
            className="tap h-12 w-full border border-paper/30 text-sm text-paper"
            onClick={() => {
              if (mine === null) return
              void writeShare(
                challengeText(desire, { mine: lines[mine]?.label ?? "", salle: salleLine() }),
                pageUrl({ d: desire, s: seed, t: createdAt, a: mine }),
              )
            }}
          >
            Copier le défi
          </button>
        ) : null}
        {reveal ? (
          <button
            type="button"
            className="tap h-12 w-full border border-paper/30 text-sm text-paper"
            onClick={() => {
              if (mine === null || theirs === null) return
              void writeShare(
                duelText(desire, lines[theirs]?.label ?? "", lines[mine]?.label ?? ""),
                pageUrl({ d: desire, s: seed, t: createdAt, a: theirs, b: mine }),
              )
            }}
          >
            Copier le duel
          </button>
        ) : null}
        {copied === "ok" ? <p className="text-center text-sm text-paper/70">Copié. Envoie-le.</p> : null}
        {copied === "fail" ? (
          <pre className="overflow-x-auto text-xs leading-normal whitespace-pre-wrap text-paper/75">{shareBlock}</pre>
        ) : null}
      </div>

      <div className="mt-8">
        <p className="text-xs tracking-widest text-paper/50">UNE AUTRE ENVIE</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {DECK.filter((prompt) => fold(prompt) !== fold(desire)).map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="tap h-11 border border-paper/25 px-3 text-sm text-paper"
              onClick={() => issue(prompt)}
            >
              {prompt}
            </button>
          ))}
          <button
            type="button"
            className="tap h-11 border border-paper/25 px-3 text-sm text-paper"
            onClick={() => setCustomOpen((open) => !open)}
          >
            la mienne
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
              Ton envie
            </label>
            <input
              id="envie"
              value={draft}
              maxLength={72}
              enterKeyHint="done"
              autoComplete="off"
              placeholder="partir, écrire, dire non…"
              onChange={(event) => setDraft(event.target.value)}
              className="mt-2 w-full border-b border-paper/25 bg-transparent py-3 font-display text-2xl font-semibold text-paper outline-none placeholder:text-paper/45"
            />
            <button
              type="submit"
              className="tap mt-4 h-12 w-full bg-paper text-sm font-medium text-ink disabled:opacity-40"
              disabled={cleanDesire(draft).length < 2}
            >
              Imprimer
            </button>
          </form>
        ) : null}
      </div>

      {historyRows.length > 0 ? (
        <section className="mt-12">
          <h2 className="text-xs tracking-widest text-paper/50">TES REÇUS</h2>
          <ul className="mt-2">
            {historyRows.map((item) => {
              const label = generateLines(item.d, item.s)[item.x]?.label ?? ""
              return (
                <li key={`${item.t}-${item.s}-${item.x}`}>
                  <button
                    type="button"
                    className="tap min-h-11 w-full border-t border-paper/15 py-3 text-left"
                    onClick={() => openSaved(item)}
                  >
                    <span className="block text-paper">{quote(item.d)}</span>
                    <span className="mt-1 block text-sm text-paper/55">refusé · {label}</span>
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
