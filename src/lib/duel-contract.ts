/**
 * Public boundary for LE REÇU duels.
 * Client tokens are pseudonymous browser credentials, NOT human verification.
 * Never expose the first choice to an uncommitted second browser.
 */
export type DuelRecord = {
  id: string
  desire: string
  seed: number
  created_at_ms: number
  expires_at_ms: number
  creator_line: number
  creator_token: string
  responder_line: number | null
  responder_token: string | null
}

export type DuelView = {
  id: string
  status: "missing" | "pending" | "complete" | "closed" | "expired"
  role: "owner" | "responder" | "guest"
  desire: string
  seed: number
  createdAt: number
  mine: number | null
  theirs: number | null
}

/**
 * Two browsers see "mine/theirs" in opposite orders.
 * A publicly exported receipt must use stable creation order instead.
 * This never introduces a choice before BOTH participants have committed.
 */
export function canonicalSelections(
  role: DuelView["role"], mine: number | null, theirs: number | null,
): { first: number; second: number } | null {
  if ((role !== "owner" && role !== "responder") || mine === null || theirs === null) return null
  if (!Number.isInteger(mine) || !Number.isInteger(theirs) || mine < 0 || mine > 4 || theirs < 0 || theirs > 4) return null
  return role === "owner" ? { first: mine, second: theirs } : { first: theirs, second: mine }
}

export function duelView(record: DuelRecord | null, token: string, now = Date.now()): DuelView {
  if (!record) return {
    id: "",
    status: "missing",
    role: "guest",
    desire: "",
    seed: 0,
    createdAt: 0,
    mine: null,
    theirs: null,
  }
  const owner = token.length > 0 && record.creator_token === token
  const responder = token.length > 0 && record.responder_token === token
  const role = owner ? "owner" : responder ? "responder" : "guest"
  const complete = record.responder_line !== null
  const expired = !complete && now > record.expires_at_ms
  const status: DuelView["status"] = expired
    ? "expired"
    : !complete
      ? "pending"
      : owner || responder
        ? "complete"
        : "closed"
  // No precommit leakage for guests or respondents, even on expired invites.
  return {
    id: record.id,
    status,
    role,
    desire: record.desire,
    seed: record.seed,
    createdAt: record.created_at_ms,
    mine: owner ? record.creator_line : responder && complete ? record.responder_line : null,
    theirs: owner && complete ? record.responder_line : responder && complete ? record.creator_line : null,
  }
}
