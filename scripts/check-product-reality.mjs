#!/usr/bin/env node
/**
 * LE REÇU product-depth / reality gate.
 *
 * REVIEW mode: validate a complete, honest registry so iteration can continue.
 * RELEASE mode: fail closed unless all immutable release criteria have
 * production-scoped LIVE evidence and a deliberate approval.
 *
 * Neither a passing CI suite nor a self-declared PROVEN state is proof of a
 * live product; humans must inspect primary evidence before approval.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registryPath = resolve(root, "product/LIVE-PRODUCT-REALITY.json");
const allowedStatuses = new Set(["ACTIVE", "N/A", "BLOCKED", "PROVEN"]);
export const REQUIRED_GATES = Object.freeze([
  "macro-lifecycle", "pre-build-reality", "competitive-novelty-kill",
  "ossium-oss-reference-intelligence", "technical-reality", "truth-boundary",
  "negative-path", "evidence-integrity", "eval-driven-reliability",
  "runtime-commit-binding", "deterministic-demo", "judge-performance",
  "live-core-loop-staging", "live-core-loop-production",
  "load-bearing-integration-staging", "load-bearing-integration-production",
  "real-consequence-production", "representative-paths",
  "negative-recovery-production", "external-user-evidence",
  "product-depth-max-exploitation", "shared-product-core", "real-user-surface",
  "operator-surface-observability", "time-to-first-value",
  "operational-economics", "reproducibility-clean-room",
  "growth-distribution", "identity-permissions", "privacy-consent-retention",
  "anti-abuse-sybil-rate-limits", "cross-language-live",
  "accessibility-mobile-performance", "public-entry-domain",
  "safe-share-preview-semantics", "chain-continuation-live",
  "organic-usage-adoption", "x402", "nanopayments", "wallets",
  "contracts", "live-gateway",
]);

// These are immutable release requirements even if the JSON is edited.
export const RELEASE_REQUIRED = Object.freeze([
  "negative-path", "runtime-commit-binding", "live-core-loop-production",
  "load-bearing-integration-production", "real-consequence-production",
  "representative-paths", "negative-recovery-production",
  "external-user-evidence", "operator-surface-observability",
  "time-to-first-value", "operational-economics", "reproducibility-clean-room",
  "growth-distribution", "privacy-consent-retention",
  "anti-abuse-sybil-rate-limits", "cross-language-live",
  "accessibility-mobile-performance", "public-entry-domain",
  "safe-share-preview-semantics", "chain-continuation-live",
]);

function validArtifact(artifact, existsArtifact) {
  return typeof artifact === "string" &&
    /^evidence\/[a-zA-Z0-9/_-]+\.md$/.test(artifact) &&
    !artifact.includes("..") && existsArtifact(artifact);
}

function productionProof(e, existsArtifact) {
  return Boolean(e && e.classification === "LIVE" &&
    e.scope === "production" &&
    e.method === "independent_observation" &&
    /^\d{4}-\d{2}-\d{2}$/.test(e.verified_at || "") &&
    /^[a-f0-9]{40}$/.test(e.commit || "") &&
    /^https:\/\//.test(e.runtime_url || "") &&
    validArtifact(e.artifact, existsArtifact));
}

/** Pure evaluator: used by CI and regression tests. */
export function evaluateReality(data, { mode = "review", existsArtifact = () => true } = {}) {
  const errors = [];
  const blockers = [];
  if (!data || typeof data !== "object" || !Array.isArray(data.gates)) {
    return { errors: ["Invalid or missing gate registry"], blockers: [] };
  }
  if (data.schema_version !== 1) errors.push("Unsupported registry schema_version");
  const found = new Map();
  for (const gate of data.gates) {
    if (!gate || typeof gate.id !== "string") { errors.push("Invalid gate entry"); continue; }
    if (found.has(gate.id)) errors.push("Duplicate gate: " + gate.id);
    found.set(gate.id, gate);
    if (!allowedStatuses.has(gate.status)) errors.push("Invalid status: " + gate.id);
    if (typeof gate.basis !== "string" || gate.basis.trim().length < 12) {
      errors.push("Missing grounded status rationale: " + gate.id);
    }
    if (gate.status === "PROVEN") {
      const e = gate.evidence;
      if (!e || !["LIVE", "LOCAL", "PARTIAL", "SIMULATED"].includes(e.classification) ||
          !["staging", "production", "local"].includes(e.scope) ||
          !validArtifact(e.artifact, existsArtifact) ||
          !/^\d{4}-\d{2}-\d{2}$/.test(e.verified_at || "")) {
        errors.push("PROVEN without a properly scoped local evidence file: " + gate.id);
      }
    }
  }
  for (const id of REQUIRED_GATES) {
    if (!found.has(id)) errors.push("Missing canonical conditional gate: " + id);
  }
  for (const id of found.keys()) {
    if (!REQUIRED_GATES.includes(id)) errors.push("Unregistered conditional gate: " + id);
  }
  for (const id of RELEASE_REQUIRED) {
    const g = found.get(id);
    if (!g) continue;
    if (g.release_required !== true) {
      errors.push("Release requirement cannot be switched off: " + id);
    }
    if (g.status !== "PROVEN" || !productionProof(g.evidence, existsArtifact)) {
      blockers.push(id);
    }
  }
  if (!["BLOCKED", "APPROVED"].includes(data.release_decision)) {
    errors.push("release_decision must be BLOCKED or APPROVED");
  }
  if (data.release_decision === "APPROVED" && blockers.length) {
    errors.push("Cannot approve a release with unproven production gates");
  }
  if (mode === "release" && data.release_decision !== "APPROVED") {
    errors.push("Explicit human-reviewed release approval is missing");
  }
  if (mode === "release" && blockers.length) {
    errors.push("LIVE PRODUCT RELEASE BLOCKED: " + blockers.join(", "));
  }
  return { errors, blockers };
}

function main() {
  const mode = process.argv.includes("--release") ? "release" :
    process.argv.includes("--production-preflight") && process.env.VERCEL_ENV === "production"
      ? "release" : "review";
  let data;
  try {
    data = JSON.parse(readFileSync(registryPath, "utf8"));
  } catch (error) {
    console.error("[product-reality] Cannot load gate registry:", error.code || "PARSE_FAILURE");
    process.exitCode = 1;
    return;
  }
  const result = evaluateReality(data, {
    mode,
    existsArtifact: (file) => !isAbsolute(file) && existsSync(resolve(root, file)),
  });
  console.log("[product-reality] mode=" + mode + " | release=" + data.release_decision +
    " | unproven production gates=" + result.blockers.length);
  if (result.blockers.length) console.log("[product-reality] BLOCKED: " + result.blockers.join(", "));
  if (result.errors.length) {
    for (const msg of result.errors) console.error("[product-reality] ERROR: " + msg);
    process.exitCode = 1;
  } else {
    console.log("[product-reality] Registry integrity PASS. This is not proof of production behavior.");
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
