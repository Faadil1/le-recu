import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { deckDesire, tallyRoom, type RoomTally } from "@/lib/receipt"

const empty: RoomTally = { total: 0, counts: [0, 0, 0, 0, 0], top: null }

function utcDay(now = Date.now()): number {
  const date = new Date(now)
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / 86_400_000)
}

async function countsFor(desire: string): Promise<RoomTally> {
  const { getSql } = await import("@/lib/db")
  const sql = await getSql()
  const day = utcDay()
  const rows = await sql<{ line: number; n: number }>`
    select line, count(*) as n
    from strikes
    where day = ${day} and desire = ${desire}
    group by line
  `
  return tallyRoom(rows.map((row) => ({ line: Number(row.line), n: Number(row.n) })))
}

export const readRoom = createServerFn({ method: "GET" })
  .validator(z.object({ desire: z.string().max(72) }))
  .handler(async ({ data }): Promise<RoomTally> => {
    const desire = deckDesire(data.desire)
    if (!desire) return empty
    return countsFor(desire)
  })

export const castStrike = createServerFn({ method: "POST" })
  .validator(
    z.object({
      desire: z.string().max(72),
      line: z.number().int().min(0).max(4),
      token: z.string().regex(/^[a-f0-9]{32}$/),
    }),
  )
  .handler(async ({ data }): Promise<RoomTally> => {
    const desire = deckDesire(data.desire)
    if (!desire) return empty
    const { getSql } = await import("@/lib/db")
    const sql = await getSql()
    const day = utcDay()
    await sql`
      insert into strikes (day, desire, line, token)
      values (${day}, ${desire}, ${data.line}, ${data.token})
      on conflict (day, desire, token) do nothing
    `
    return countsFor(desire)
  })
