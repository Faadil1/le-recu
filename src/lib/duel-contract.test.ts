import test from "node:test"
import assert from "node:assert/strict"
import { duelView, type DuelRecord } from "./duel-contract.ts"
import { challengeText, dailyReceipt, dailySeedFor, generateLines, hashString, fold, DECK } from "./receipt.ts"

const row: DuelRecord = {
  id: "00888888-8888-4888-8888-888888888888",
  desire: "quitter",
  seed: 120,
  created_at_ms: 1_780_000_000_000,
  expires_at_ms: 1_780_300_000_000,
  creator_line: 2,
  creator_token: "a".repeat(32),
  responder_line: null,
  responder_token: null,
}

test("unknown visitor cannot read a pending creator's selection", () => {
  const v = duelView(row, "f".repeat(32), row.created_at_ms + 1_000)
  assert.equal(v.role, "guest")
  assert.equal(v.status, "pending")
  assert.equal(v.mine, null)
  assert.equal(v.theirs, null)
  assert.equal(JSON.stringify(v).includes("creator_line"), false)
})

test("owner sees only their own selection while challenge is waiting", () => {
  const v = duelView(row, row.creator_token, row.created_at_ms + 1_000)
  assert.equal(v.role, "owner")
  assert.equal(v.mine, 2)
  assert.equal(v.theirs, null)
})

test("only committed participants see both decisions after reply", () => {
  const completed = { ...row, responder_line: 4, responder_token: "b".repeat(32) }
  const owner = duelView(completed, row.creator_token, row.created_at_ms + 1_000)
  const responder = duelView(completed, "b".repeat(32), row.created_at_ms + 1_000)
  const stranger = duelView(completed, "c".repeat(32), row.created_at_ms + 1_000)
  assert.deepEqual([owner.mine, owner.theirs], [2, 4])
  assert.deepEqual([responder.mine, responder.theirs], [4, 2])
  assert.equal(stranger.status, "closed")
  assert.deepEqual([stranger.mine, stranger.theirs], [null, null])
})

test("expired uncommitted invitations do not disclose the hidden choice", () => {
  const expired = duelView(row, "b".repeat(32), row.expires_at_ms + 1)
  assert.equal(expired.status, "expired")
  assert.equal(expired.theirs, null)
})

test("missing duel has no participation data", () => {
  const missing = duelView(null, "a".repeat(32))
  assert.equal(missing.status, "missing")
  assert.equal(missing.mine, null)
})

test("teaser copy cannot leak creator's refused cost", () => {
  const teaser = challengeText("quitter")
  assert.match(teaser, /choisis sans voir/)
  assert.doesNotMatch(teaser, /moi — |creator_line|responder_line/)
  assert.equal(challengeText.length, 1)
})

test("preset receipt seed is canonical across entry paths on the same UTC day", () => {
  const now = Date.UTC(2026, 9, 8, 12, 0, 0)
  const first = dailyReceipt(now)
  assert.equal(first.seed, dailySeedFor(first.desire, now))
  for (const desire of DECK) {
    const fromDaily = generateLines(desire, dailySeedFor(desire, now))
    const fromPresetButton = generateLines(desire, dailySeedFor(desire, now))
    assert.deepEqual(fromDaily.map((c) => c.id), fromPresetButton.map((c) => c.id))
  }
  assert.notEqual(dailySeedFor("quitter", now), hashString(fold("quitter")))
})

test("new UTC day produces new catalogue seed", () => {
  const before = Date.UTC(2026, 9, 8, 22, 30, 0)
  const after = Date.UTC(2026, 9, 9, 1, 30, 0)
  assert.notEqual(dailySeedFor("quitter", before), dailySeedFor("quitter", after))
})
