import { createHash } from "node:crypto"
import type { Sql } from "./db"

/**
 * Hard daily budgets for the SMALL closed public-beta. Browser IDs are not
 * identity, so limits per browser alone are insufficient: global caps fail closed.
 * All writes use Neon PostgreSQL atomic ON CONFLICT ... WHERE used < limit.
 */
export const BETA_BUDGET = {
  "duel-create": { perBrowser: 6, global: 60 },
  "duel-reply": { perBrowser: 25, global: 240 },
  "room-strike": { perBrowser: 8, global: 300 },
} as const

export type ActionScope = keyof typeof BETA_BUDGET
const DAY_MS = 86_400_000

export function utcDayBucket(now: number): number {
  if (!Number.isFinite(now) || now < 0) throw new Error("Invalid request timestamp")
  return Math.floor(now / DAY_MS)
}

/** Token is a random 128-bit local browser identifier, not a verified person. */
export function pseudonymKey(token: string): string {
  if (!/^[a-f0-9]{32}$/.test(token)) throw new Error("Invalid browser credential")
  return createHash("sha256").update(token, "utf8").digest("hex")
}

export function betaAllowed(scope: string): scope is ActionScope {
  return Object.prototype.hasOwnProperty.call(BETA_BUDGET, scope)
}

async function claim(
  sql: Sql, scope: ActionScope, day: number, key: string, maximum: number,
): Promise<boolean> {
  const rows=await sql<{used:number}>`
    insert into action_limits (scope, day, actor_key, used)
    values (${scope}, ${day}, ${key}, 1)
    on conflict (scope, day, actor_key)
    do update set used = action_limits.used + 1, updated_at = now()
    where action_limits.used < ${maximum}
    returning used
  `
  return rows.length === 1
}

export async function consumeBetaBudget(
  sql: Sql, scope: ActionScope, token: string, now: number,
): Promise<void> {
  const day = utcDayBucket(now)
  const limits = BETA_BUDGET[scope]
  // Global first: even a sybil attack with unlimited fresh tokens cannot cause
  // unlimited create/reply/room writes on a shared database.
  const globalOk=await claim(sql,scope,day,"GLOBAL",limits.global)
  if (!globalOk) throw new Error("Capacité de test atteinte pour aujourd'hui. Réessaie demain.")
  const actorOk=await claim(sql,scope,day,pseudonymKey(token),limits.perBrowser)
  if (!actorOk) throw new Error("Limite de participation atteinte sur ce navigateur aujourd'hui.")
}
