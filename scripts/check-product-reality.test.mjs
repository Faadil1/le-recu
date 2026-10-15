import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { evaluateReality, RELEASE_REQUIRED, REQUIRED_GATES } from "./check-product-reality.mjs";

const baseline = JSON.parse(
  readFileSync(new URL("../product/LIVE-PRODUCT-REALITY.json", import.meta.url), "utf8"),
);
const snapshot = () => structuredClone(baseline);
const existsArtifact = () => true;

test("all canonical and conditional gates remain explicitly registered", () => {
  assert.equal(REQUIRED_GATES.length, 42);
  assert.ok(RELEASE_REQUIRED.length >= 18);
  const got = evaluateReality(baseline, { existsArtifact });
  assert.deepEqual(got.errors, []);
  assert.equal(got.blockers.length, RELEASE_REQUIRED.length);
});

test("current product is blocked from public production release", () => {
  const got = evaluateReality(baseline, { mode: "release", existsArtifact });
  assert.ok(got.errors.some(s => s.includes("LIVE PRODUCT RELEASE BLOCKED")));
  assert.ok(got.errors.some(s => s.includes("human-reviewed release approval")));
});

test("no silent omission or downgrade of a registered gateway", () => {
  const data = snapshot();
  data.gates = data.gates.filter(g => g.id !== "negative-path");
  assert.ok(evaluateReality(data, { existsArtifact }).errors.some(s => s.includes("Missing canonical conditional gate")));
});

test("release-required gates cannot be quietly declared N/A or optional", () => {
  const data = snapshot();
  const gate = data.gates.find(g => g.id === "privacy-consent-retention");
  gate.status = "N/A";
  gate.release_required = false;
  assert.ok(evaluateReality(data, { existsArtifact }).errors.some(s => s.includes("cannot be switched off")));
});

test("staging LIVE evidence never promotes a production release", () => {
  const data = snapshot();
  const gate = data.gates.find(g => g.id === "live-core-loop-production");
  gate.status = "PROVEN";
  gate.evidence = {
    classification: "LIVE", scope: "staging", method: "independent_observation",
    verified_at: "2026-10-09", artifact: "evidence/test.md",
    commit: "a".repeat(40), runtime_url: "https://example.test/",
  };
  const got = evaluateReality(data, { mode: "release", existsArtifact });
  assert.ok(got.blockers.includes("live-core-loop-production"));
});

test("screenshots, local tests, and simulated receipts cannot pass as production LIVE", () => {
  const data = snapshot();
  const gate = data.gates.find(g => g.id === "live-core-loop-production");
  gate.status = "PROVEN";
  gate.evidence = {
    classification: "SIMULATED", scope: "production", method: "independent_observation",
    verified_at: "2026-10-09", artifact: "evidence/test.md",
    commit: "a".repeat(40), runtime_url: "https://example.test/",
  };
  assert.ok(evaluateReality(data, { mode: "release", existsArtifact }).blockers.includes(gate.id));
});

test("a PROVEN gate must link to an available in-repository primary evidence record", () => {
  const data = snapshot();
  const gate = data.gates.find(g => g.id === "live-core-loop-staging");
  gate.evidence.artifact = "evidence/not-found.md";
  assert.ok(evaluateReality(data, { existsArtifact: () => false }).errors.some(s => s.includes("PROVEN without")));
});

test("APPROVED with outstanding blockers is an invalid registry", () => {
  const data = snapshot();
  data.release_decision = "APPROVED";
  assert.ok(evaluateReality(data, { existsArtifact }).errors.some(s => s.includes("Cannot approve")));
});
