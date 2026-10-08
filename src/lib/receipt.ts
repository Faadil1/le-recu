export type Cat = "temps" | "lien" | "image" | "corps" | "retour"

export type Cost = {
  id: string
  cat: Cat
  label: string
  detail: string
  weight: 1 | 2 | 3
  tags: readonly string[]
}

export type Presented = Cost & { refused: boolean; theirs: boolean }

export type Payload = {
  d: string
  s: number
  t: number
  /** Challenger's struck line. Hidden until the friend strikes. */
  a: number
  /** Friend's line. Present only on a finished duel. */
  b?: number
}

export const CAT_LABEL: Record<Cat, string> = {
  temps: "TEMPS",
  lien: "LIEN",
  image: "IMAGE",
  corps: "CORPS",
  retour: "RETOUR",
}

const CATALOG: readonly Cost[] = [
  {
    id: "dimanches",
    cat: "temps",
    label: "tes dimanches",
    detail: "Ils cessent d'être à toi.",
    weight: 2,
    tags: ["quitter", "job", "travail", "boulot", "carriere", "demission", "poste", "patron", "boss", "quit"],
  },
  {
    id: "mois",
    cat: "temps",
    label: "dix-huit mois",
    detail: "Avant que ça ressemble à un choix, pas à une fuite.",
    weight: 2,
    tags: ["partir", "demenager", "emmenager", "expat", "pays", "ville", "move", "leave"],
  },
  {
    id: "soirs",
    cat: "temps",
    label: "les soirs après 22h",
    detail: "L'horaire réel. Le jour, tu fais semblant.",
    weight: 2,
    tags: ["ecrire", "message", "texte", "roman", "livre", "write", "sms", "boire", "alcool", "drink", "sober", "avouer", "poster", "publier", "story"],
  },
  {
    id: "flou",
    cat: "temps",
    label: "six semaines floues",
    detail: "Tu ne pourras pas dire ce que tu fais.",
    weight: 2,
    tags: ["lancer", "startup", "creer", "recommencer", "commencer", "fonder"],
  },
  {
    id: "an",
    cat: "temps",
    label: "un an de plus",
    detail: "Rester se paie aussi. Ça ne s'imprime pas.",
    weight: 2,
    tags: ["rester", "attendre", "stay", "augmentation", "salaire", "raise", "promotion"],
  },
  {
    id: "weekend",
    cat: "temps",
    label: "le week-end promis",
    detail: "Celui que tu avais déjà donné à quelqu'un.",
    weight: 2,
    tags: ["refuser", "limite", "boundary", "non"],
  },
  {
    id: "essai",
    cat: "temps",
    label: "l'essai non payé",
    detail: "Personne ne te paie pour apprendre.",
    weight: 2,
    tags: ["freelance", "independant", "solopreneur"],
  },
  {
    id: "apres",
    cat: "temps",
    label: "le dimanche d'après",
    detail: "Il arrive. Il n'est plus à deux.",
    weight: 2,
    tags: ["rompre", "rupture", "separation", "divorce", "breakup", "ex"],
  },
  {
    id: "calendrier",
    cat: "temps",
    label: "vingt ans",
    detail: "Ce n'est pas un sprint. C'est le calendrier.",
    weight: 2,
    tags: ["enfant", "bebe", "baby", "grossesse", "parental"],
  },
  {
    id: "cible",
    cat: "temps",
    label: "la semaine d'après",
    detail: "L'objet reste. L'envie a déjà bougé.",
    weight: 2,
    tags: ["acheter", "achat", "depense", "buy", "commande"],
  },
  {
    id: "ami",
    cat: "lien",
    label: "un ami qui savait",
    detail: "Il cesse de demander. Sans scène.",
    weight: 2,
    tags: ["ami", "amie", "pote", "friend"],
  },
  {
    id: "personne",
    cat: "lien",
    label: "la personne",
    detail: "« Comme si de rien » ne survivra pas.",
    weight: 2,
    tags: ["lui", "elle", "aimer", "amour", "crush", "love", "ecrire", "message", "sms", "text"],
  },
  {
    id: "mere",
    cat: "lien",
    label: "ta mère au téléphone",
    detail: "Trois sonneries de plus. À chaque fois.",
    weight: 2,
    tags: ["mere", "maman", "mom", "mother", "pere", "papa", "dad", "father", "parents", "partir", "demenager"],
  },
  {
    id: "vendredi",
    cat: "lien",
    label: "le groupe du vendredi",
    detail: "La place se referme. Personne ne vote.",
    weight: 2,
    tags: ["vendredi", "coloc", "colocation", "boire", "alcool", "drink", "sober"],
  },
  {
    id: "compte",
    cat: "lien",
    label: "celui qui comptait sur toi",
    detail: "Il lui faudra un autre oui.",
    weight: 2,
    tags: ["refuser", "limite", "non", "dispo", "boundary"],
  },
  {
    id: "enfant",
    cat: "lien",
    label: "l'enfant",
    detail: "Tu décides pour quelqu'un qui n'a pas la parole.",
    weight: 2,
    tags: ["enfant", "bebe", "baby", "grossesse", "parental"],
  },
  {
    id: "discussion",
    cat: "lien",
    label: "la discussion",
    detail: "Elle ne se ferme pas. Elle change de pièce.",
    weight: 2,
    tags: ["rompre", "rupture", "separation", "divorce", "breakup", "ghost", "ex"],
  },
  {
    id: "temoin",
    cat: "lien",
    label: "le témoin",
    detail: "Quelqu'un saura que c'était voulu.",
    weight: 2,
    tags: ["acheter", "poster", "publier", "confess", "augmentation", "salaire"],
  },
  {
    id: "dira",
    cat: "image",
    label: "ce qu'on dira",
    detail: "Pas un mensonge. Une version que tu n'as pas écrite.",
    weight: 2,
    tags: ["reputation", "honte"],
  },
  {
    id: "cv",
    cat: "image",
    label: "la ligne du CV",
    detail: "Un trou, à raconter comme un choix.",
    weight: 2,
    tags: ["quitter", "job", "travail", "demission", "boulot", "carriere", "poste", "quit", "cv"],
  },
  {
    id: "stable",
    cat: "image",
    label: "l'air stable",
    detail: "Tu le perds avant d'avoir la suite.",
    weight: 2,
    tags: ["partir", "demenager", "move", "lancer", "freelance", "recommencer"],
  },
  {
    id: "plaindre",
    cat: "image",
    label: "le droit de te plaindre",
    detail: "Une fois fait, la plainte est morte.",
    weight: 2,
    tags: ["rester", "stay"],
  },
  {
    id: "excuse",
    cat: "image",
    label: "l'excuse propre",
    detail: "Elle ne tiendra plus, et tu le sais.",
    weight: 2,
    tags: ["refuser", "limite", "non", "alcool", "boire", "excuse"],
  },
  {
    id: "recit",
    cat: "image",
    label: "le récit",
    detail: "Quelqu'un d'autre le tiendra à ta place.",
    weight: 2,
    tags: ["avouer", "verite", "secret", "confess"],
  },
  {
    id: "feed",
    cat: "image",
    label: "le feed",
    detail: "Tu montres la version. Jamais la facture.",
    weight: 2,
    tags: ["poster", "publier", "story", "instagram", "post", "feed", "tiktok"],
  },
  {
    id: "demande",
    cat: "image",
    label: "la demande",
    detail: "Elle peut mourir sans qu'on te dise non.",
    weight: 2,
    tags: ["augmentation", "salaire", "raise", "promotion"],
  },
  {
    id: "envoi",
    cat: "image",
    label: "l'envoi",
    detail: "Tu ne pourras plus dire que tu ne l'as pas écrit.",
    weight: 2,
    tags: ["ecrire", "message", "texte", "sms", "lui", "elle"],
  },
  {
    id: "objet",
    cat: "image",
    label: "l'objet",
    detail: "Il sera à toi. Le prix, lui, reste.",
    weight: 2,
    tags: ["acheter", "achat", "depense", "buy", "commande", "vouloir"],
  },
  {
    id: "epaules",
    cat: "corps",
    label: "les épaules",
    detail: "Elles gardent ça plus longtemps que ta tête.",
    weight: 2,
    tags: ["refuser", "rester", "non", "stay"],
  },
  {
    id: "sommeil",
    cat: "corps",
    label: "trois semaines de sommeil",
    detail: "Le corps cède avant toi.",
    weight: 2,
    tags: ["quitter", "job", "demission", "travail", "stress", "lancer", "startup", "freelance"],
  },
  {
    id: "appetit",
    cat: "corps",
    label: "l'appétit",
    detail: "Absent. Le mardi, surtout.",
    weight: 2,
    tags: ["attendre", "anxiety"],
  },
  {
    id: "matin",
    cat: "corps",
    label: "le matin",
    detail: "Un nœud, avant même le café.",
    weight: 2,
    tags: ["ecrire", "lui", "elle", "aimer", "amour", "augmentation", "salaire", "poster", "publier", "story"],
  },
  {
    id: "nuit",
    cat: "corps",
    label: "une nuit blanche",
    detail: "Pas belle. Nécessaire.",
    weight: 2,
    tags: ["lancer", "projet", "livre", "roman", "fonder"],
  },
  {
    id: "verre",
    cat: "corps",
    label: "le verre du soir",
    detail: "Il ne compte plus comme une récompense.",
    weight: 2,
    tags: ["boire", "alcool", "drink", "sober", "arreter"],
  },
  {
    id: "ventre",
    cat: "corps",
    label: "le ventre",
    detail: "Ça s'y pose avant d'être dit.",
    weight: 2,
    tags: ["avouer", "verite", "secret", "rompre", "rupture"],
  },
  {
    id: "corps",
    cat: "corps",
    label: "le corps prêté",
    detail: "Il ne te le rend pas en septembre.",
    weight: 2,
    tags: ["enfant", "bebe", "baby", "grossesse", "parental"],
  },
  {
    id: "doute",
    cat: "retour",
    label: "le doute confortable",
    detail: "Choisir tue l'autre option.",
    weight: 2,
    tags: ["rester", "attendre", "stay"],
  },
  {
    id: "planb",
    cat: "retour",
    label: "le plan B",
    detail: "Le nommer, c'est le brûler.",
    weight: 2,
    tags: ["quitter", "job", "demission", "lancer", "freelance", "recommencer", "augmentation", "salaire"],
  },
  {
    id: "semblant",
    cat: "retour",
    label: "faire semblant",
    detail: "Tu ne pourras plus le rallumer.",
    weight: 2,
    tags: ["avouer", "ecrire", "aimer", "lui", "elle", "rompre", "boire", "alcool", "drink"],
  },
  {
    id: "porte",
    cat: "retour",
    label: "la porte d'avant",
    detail: "Elle se ferme sans bruit.",
    weight: 2,
    tags: ["partir", "demenager", "move", "leave", "expat"],
  },
  {
    id: "retour",
    cat: "retour",
    label: "le retour",
    detail: "Pas interdit. Plus cher que le départ.",
    weight: 2,
    tags: ["rupture", "divorce", "ex", "breakup"],
  },
  {
    id: "arriere",
    cat: "retour",
    label: "la marche arrière",
    detail: "En théorie, oui. En pratique, non.",
    weight: 2,
    tags: ["refuser", "non", "limite", "boundary"],
  },
  {
    id: "ambigu",
    cat: "retour",
    label: "l'ambiguïté",
    detail: "Elle te protégeait. Tu la rends.",
    weight: 2,
    tags: ["lui", "elle", "aimer", "amour", "poster", "publier", "confess"],
  },
  {
    id: "ticket",
    cat: "retour",
    label: "le ticket de caisse",
    detail: "Tu rends l'objet. Pas la raison.",
    weight: 2,
    tags: ["acheter", "achat", "buy", "commande", "depense"],
  },
  {
    id: "sens",
    cat: "retour",
    label: "le sens unique",
    detail: "Pas une porte qui se rouvre.",
    weight: 2,
    tags: ["enfant", "bebe", "baby", "grossesse", "parental"],
  },
]

const DEFAULT_ID: Record<Cat, string> = {
  temps: "dimanches",
  lien: "ami",
  image: "dira",
  corps: "epaules",
  retour: "doute",
}

const ORDER: readonly Cat[] = ["temps", "lien", "image", "corps", "retour"]

export function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

export function cleanDesire(raw: string): string {
  return raw
    .replace(/[\u0000-\u001f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72)
}

export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hit(folded: string, tag: string): boolean {
  if (tag.length < 2) return false
  if (tag.length < 5) return new RegExp(`(?:^| )${tag}(?: |$)`).test(folded)
  return folded.includes(tag)
}

function score(item: Cost, folded: string): number {
  let total = 0
  for (const tag of item.tags) {
    if (hit(folded, tag)) total += tag.length
  }
  return total
}

function byId(id: string): Cost {
  const found = CATALOG.find((item) => item.id === id)
  if (!found) throw new Error(`missing cost ${id}`)
  return found
}

export function generateLines(desire: string, seed: number): Cost[] {
  const folded = fold(desire)
  const rand = mulberry32(seed)
  return ORDER.map((cat) => {
    const pool = CATALOG.filter((item) => item.cat === cat)
    let best = 0
    const scores = pool.map((item) => {
      const value = score(item, folded)
      if (value > best) best = value
      return value
    })
    if (best === 0) return byId(DEFAULT_ID[cat])
    const top = pool.filter((_, index) => scores[index] === best)
    return top[Math.floor(rand() * top.length)] ?? top[0]!
  })
}

export function present(
  lines: readonly Cost[],
  mine: number | null,
  theirs: number | null,
  reveal: boolean,
): Presented[] {
  return lines.map((line, index) => ({
    ...line,
    weight: mine === null || mine === index ? line.weight : 3,
    refused: mine === index,
    theirs: reveal && theirs === index,
  }))
}

export const DECK = [
  "dire non",
  "partir",
  "avouer",
  "rester",
  "poster ça",
  "rompre",
  "lui écrire",
  "quitter",
] as const

export function dailyReceipt(now = Date.now()): { desire: string; seed: number } {
  const date = new Date(now)
  const day = Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000)
  const desire = DECK[day % DECK.length] ?? DECK[0]
  return { desire, seed: hashString(`${fold(desire)}:${day}`) }
}

export function deckDesire(value: string): string | null {
  const folded = fold(value)
  for (const item of DECK) {
    if (fold(item) === folded) return item
  }
  return null
}

export type RoomTally = {
  total: number
  counts: [number, number, number, number, number]
  top: number | null
}

export function tallyRoom(rows: readonly { line: number; n: number }[]): RoomTally {
  const counts: [number, number, number, number, number] = [0, 0, 0, 0, 0]
  for (const row of rows) {
    if (row.line >= 0 && row.line <= 4) counts[row.line] += row.n
  }
  const total = counts.reduce((sum, n) => sum + n, 0)
  if (total < 2) return { total, counts, top: null }
  let best = 0
  let winners = 0
  for (const count of counts) {
    if (count > best) {
      best = count
      winners = 1
    } else if (count === best) winners += 1
  }
  const top = best > 0 && winners === 1 ? counts.indexOf(best) : null
  return { total, counts, top }
}

export function challengeText(desire: string, room?: { mine: string; salle?: string }): string {
  const head = ["LE REÇU", `« ${desire} »`, ""]
  if (!room) return [...head, "Cinq coûts. J'en ai barré un.", "", "Toi, tu barres quoi ?"].join("\n")
  const body = [`moi — ${room.mine}`]
  if (room.salle) body.push(room.salle)
  return [...head, ...body, "", "Toi, tu barres quoi ?"].join("\n")
}

export function duelText(desire: string, theirs: string, yours: string): string {
  const same = fold(theirs) === fold(yours)
  return [
    "LE REÇU",
    `« ${desire} »`,
    "",
    `eux — ${theirs}`,
    `toi — ${yours}`,
    "",
    same ? "même refus." : "pas la même ligne.",
  ].join("\n")
}

export function formatStamp(timestamp: number): string {
  const date = new Date(timestamp)
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const year = String(date.getFullYear()).slice(2)
  const hour = String(date.getHours()).padStart(2, "0")
  const minute = String(date.getMinutes()).padStart(2, "0")
  return `${day}.${month}.${year}  ${hour}:${minute}`
}

export function receiptNo(seed: number): string {
  return String(1000 + (seed % 9000)).padStart(4, "0")
}

export function encodePayload(payload: Payload): string {
  const body = {
    d: payload.d,
    s: payload.s,
    t: payload.t,
    a: payload.a,
    ...(payload.b !== undefined ? { b: payload.b } : {}),
  }
  const bytes = new TextEncoder().encode(JSON.stringify(body))
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/g, "")
}

function lineIndex(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 4) return null
  return value
}

export function decodePayload(code: string): Payload | null {
  if (!code || code.length > 2000) return null
  try {
    const pad = code.length % 4 === 0 ? "" : "=".repeat(4 - (code.length % 4))
    const binary = atob(code.replaceAll("-", "+").replaceAll("_", "/") + pad)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const parsed = JSON.parse(new TextDecoder().decode(bytes)) as unknown
    if (!parsed || typeof parsed !== "object") return null
    const row = parsed as Record<string, unknown>
    const desire = typeof row.d === "string" ? cleanDesire(row.d) : ""
    if (desire.length < 2 || desire.length > 72) return null
    if (typeof row.s !== "number" || !Number.isInteger(row.s) || row.s < 0 || row.s > 0xffffffff) return null
    if (typeof row.t !== "number" || !Number.isFinite(row.t) || row.t < 1_577_836_800_000 || row.t > 4_102_444_800_000) {
      return null
    }
    const struck = lineIndex(row.a ?? row.x)
    if (struck === null) return null
    if (row.b === undefined) return { d: desire, s: row.s, t: row.t, a: struck }
    const other = lineIndex(row.b)
    if (other === null) return null
    return { d: desire, s: row.s, t: row.t, a: struck, b: other }
  } catch {
    return null
  }
}
