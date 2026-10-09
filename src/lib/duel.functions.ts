import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { cleanDesire, dailySeedFor, deckDesire } from "@/lib/receipt"
import { duelView, type DuelRecord, type DuelView } from "@/lib/duel-contract"

/**
 * The server issues an opaque UUID; participant selections NEVER live in links.
 * A browser token is a convenience credential, not authentication or anti-sybil proof.
 * Public release requires abuse controls, consent/retention and a persistent database.
 */
const tokenRule = z.string().regex(/^[a-f0-9]{32}$/)
const idRule = z.string().uuid()
const lineRule = z.number().int().min(0).max(4)
const seedRule = z.number().int().min(0).max(0xffffffff)
const lifetimeMs = 72 * 60 * 60 * 1000

async function sqlForDuel() {
  const { dbSource, getSql } = await import("@/lib/db")
  if (dbSource === "pglite" && process.env.NODE_ENV === "production") {
    throw new Error("Duel indisponible : base de données persistante non configurée.")
  }
  return getSql()
}

function normalize(record: Record<string, unknown>): DuelRecord {
  return {
    id: String(record.id),
    desire: String(record.desire),
    seed: Number(record.seed),
    created_at_ms: Number(record.created_at_ms),
    expires_at_ms: Number(record.expires_at_ms),
    creator_line: Number(record.creator_line),
    creator_token: String(record.creator_token),
    responder_line: record.responder_line === null ? null : Number(record.responder_line),
    responder_token: record.responder_token === null ? null : String(record.responder_token),
  }
}

async function find(id: string): Promise<DuelRecord | null> {
  const sql = await sqlForDuel()
  const rows = await sql<Record<string, unknown>>`
    select id, desire, seed, created_at_ms, expires_at_ms,
           creator_line, creator_token, responder_line, responder_token
    from duels where id = ${id} limit 1
  `
  return rows[0] ? normalize(rows[0]) : null
}

export const createDuel = createServerFn({ method: "POST" })
  .validator(z.object({ desire: z.string().min(2).max(72), seed: seedRule, line: lineRule, token: tokenRule }))
  .handler(async ({ data }): Promise<DuelView> => {
    const desire = deckDesire(data.desire)
    if (!desire || cleanDesire(data.desire) !== data.desire) {
      throw new Error("Les duels sont disponibles sur les huit envies du jeu uniquement.")
    }
    const createdAt = Date.now()
    if (dailySeedFor(desire, createdAt) !== data.seed) {
      throw new Error("Le reçu du jour a changé. Réimprime ce reçu avant de défier.")
    }
    const sql = await sqlForDuel()
    const id = crypto.randomUUID()
    await sql`
      insert into duels (
        id, desire, seed, created_at_ms, expires_at_ms, creator_line, creator_token
      ) values (
        ${id}, ${desire}, ${data.seed}, ${createdAt}, ${createdAt + lifetimeMs},
        ${data.line}, ${data.token}
      )
    `
    return duelView({
      id, desire, seed: data.seed, created_at_ms: createdAt,
      expires_at_ms: createdAt + lifetimeMs, creator_line: data.line,
      creator_token: data.token, responder_line: null, responder_token: null,
    }, data.token, createdAt)
  })

export const readDuel = createServerFn({ method: "GET" })
  .validator(z.object({ id: idRule, token: tokenRule }))
  .handler(async ({ data }): Promise<DuelView> => {
    const record = await find(data.id)
    return duelView(record, data.token)
  })

export const answerDuel = createServerFn({ method: "POST" })
  .validator(z.object({ id: idRule, line: lineRule, token: tokenRule }))
  .handler(async ({ data }): Promise<DuelView> => {
    const sql = await sqlForDuel()
    const now = Date.now()
    // One atomic responder commitment, no second browser can overwrite it.
    const rows = await sql<Record<string, unknown>>`
      update duels
      set responder_line = ${data.line}, responder_token = ${data.token},
          responded_at_ms = ${now}
      where id = ${data.id} and responder_line is null
        and creator_token <> ${data.token} and expires_at_ms > ${now}
      returning id, desire, seed, created_at_ms, expires_at_ms,
                creator_line, creator_token, responder_line, responder_token
    `
    if (rows[0]) return duelView(normalize(rows[0]), data.token, now)
    const existing = await find(data.id)
    if (!existing) throw new Error("Défi introuvable.")
    if (existing.creator_token === data.token) {
      throw new Error("Ouvre le défi dans un autre navigateur pour jouer à deux.")
    }
    const view = duelView(existing, data.token, now)
    if (view.role === "responder" && view.status === "complete") return view // idempotent retry
    if (view.status === "expired") throw new Error("Ce défi a expiré.")
    throw new Error("Ce défi a déjà reçu une réponse.")
  })
