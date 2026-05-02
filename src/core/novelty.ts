// Novelty module — V1 deterministic local classification of candidate claims
// against active claims in EffectiveState. No embeddings, no network, no LLM.

import type { ClaimRow, EvidenceRef } from "./contract";
import type { EffectiveRow, EffectiveState } from "./state";

export type NoveltyClassification =
  | "new"
  | "duplicate"
  | "corroboration"
  | "update"
  | "contradiction"
  | "correction";

export type NoveltyMatchReason =
  | "claim_key_exact"
  | "dedupe_hash_exact"
  | "statement_normalized_exact"
  | "statement_high_overlap"
  | "explicit_contradiction_relation"
  | "explicit_correction_metadata"
  | "evidence_added"
  | "time_changed"
  | "assessment_changed";

export type NoveltyMatch = {
  matched_id: string;
  reason: NoveltyMatchReason;
};

export type CandidateClaim = Partial<ClaimRow> & {
  identity?: ClaimRow["identity"];
  claim?: ClaimRow["claim"];
  scope?: ClaimRow["scope"];
  provenance?: ClaimRow["provenance"];
  time?: ClaimRow["time"];
  assessment?: ClaimRow["assessment"];
  relations?: ClaimRow["relations"];
};

export type NoveltyResult = {
  classification: NoveltyClassification;
  matched_ids: string[];
  matches: NoveltyMatch[];
  rationale: string;
};

const HIGH_OVERLAP_THRESHOLD = 0.85;

export const RTL_FOLD: Readonly<Record<string, string>> = {
  "آ": "ا",
  "أ": "ا",
  "إ": "ا",
  "ٱ": "ا",
  "ي": "ی",
  "ى": "ی",
  "ئ": "ی",
  "ك": "ک",
  "٠": "0",
  "۰": "0",
  "١": "1",
  "۱": "1",
  "٢": "2",
  "۲": "2",
  "٣": "3",
  "۳": "3",
  "٤": "4",
  "۴": "4",
  "٥": "5",
  "۵": "5",
  "٦": "6",
  "۶": "6",
  "٧": "7",
  "۷": "7",
  "٨": "8",
  "۸": "8",
  "٩": "9",
  "۹": "9",
};

const PRIORITY: Record<NoveltyClassification, number> = {
  correction: 6,
  contradiction: 5,
  update: 4,
  duplicate: 3,
  corroboration: 2,
  new: 1,
};

export function normalizeStatement(statement: string): string {
  if (typeof statement !== "string") return "";
  const straightened = statement
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/\u0640/g, "")
    .replace(/\u200c/g, " ");
  const lowered = straightened.toLowerCase();
  const filtered = Array.from(lowered)
    .map((ch) => RTL_FOLD[ch] ?? ch)
    .map((ch) => (isKeptChar(ch) ? ch : " "))
    .join("");
  return filtered.replace(/\s+/g, " ").trim();
}

export function classifyClaim(
  candidate: CandidateClaim,
  state: EffectiveState,
): NoveltyResult {
  const activeClaims = state.rows({ kinds: ["claim"] });
  const candidateNormalized = normalizeStatement(candidate.claim?.statement ?? "");
  const candidateTokens = candidateNormalized
    ? new Set(candidateNormalized.split(" ").filter((token) => token.length > 0))
    : new Set<string>();

  const matchesByReason = new Map<string, Set<NoveltyMatchReason>>();

  for (const entry of activeClaims) {
    const claim = entry.row as ClaimRow;
    if (claim.kind !== "claim") continue;
    const matchedId = claim.id;

    const candidateKey = candidate.identity?.claim_key;
    const matchKey = claim.identity?.claim_key;
    if (
      typeof candidateKey === "string" &&
      candidateKey.length > 0 &&
      candidateKey === matchKey
    ) {
      addReason(matchesByReason, matchedId, "claim_key_exact");
    }

    const candidateHash = candidate.identity?.dedupe_hash;
    const matchHash = claim.identity?.dedupe_hash;
    if (
      typeof candidateHash === "string" &&
      candidateHash.length > 0 &&
      candidateHash === matchHash
    ) {
      addReason(matchesByReason, matchedId, "dedupe_hash_exact");
    }

    if (candidateNormalized.length > 0) {
      const matchNormalized = normalizeStatement(claim.claim?.statement ?? "");
      if (matchNormalized.length > 0) {
        if (matchNormalized === candidateNormalized) {
          addReason(matchesByReason, matchedId, "statement_normalized_exact");
        } else {
          const matchTokens = new Set(
            matchNormalized.split(" ").filter((token) => token.length > 0),
          );
          if (jaccard(candidateTokens, matchTokens) >= HIGH_OVERLAP_THRESHOLD) {
            addReason(matchesByReason, matchedId, "statement_high_overlap");
          }
        }
      }
    }
  }

  if (matchesByReason.size === 0) {
    return {
      classification: "new",
      matched_ids: [],
      matches: [],
      rationale: "no active claim matched on key, hash, or statement",
    };
  }

  // Build per-pair classification
  const perPair: Array<{
    matchedId: string;
    classification: NoveltyClassification;
    reasons: NoveltyMatchReason[];
  }> = [];

  for (const [matchedId, reasonSet] of matchesByReason) {
    const matchedRow = findActiveById(activeClaims, matchedId);
    if (!matchedRow) continue;
    const reasons = Array.from(reasonSet);
    const pair = classifyPair(candidate, matchedRow, reasons);
    perPair.push({ matchedId, classification: pair.classification, reasons: pair.reasons });
  }

  if (perPair.length === 0) {
    return {
      classification: "new",
      matched_ids: [],
      matches: [],
      rationale: "no active claim matched on key, hash, or statement",
    };
  }

  // Pick highest priority classification
  let topPriority = 0;
  let topClassification: NoveltyClassification = "new";
  for (const pair of perPair) {
    const p = PRIORITY[pair.classification];
    if (p > topPriority) {
      topPriority = p;
      topClassification = pair.classification;
    }
  }

  const contributing = perPair.filter((p) => p.classification === topClassification);
  const matched_ids = contributing.map((p) => p.matchedId);
  const matches: NoveltyMatch[] = [];
  for (const pair of contributing) {
    for (const reason of pair.reasons) {
      matches.push({ matched_id: pair.matchedId, reason });
    }
  }

  const rationale = renderRationale(topClassification, contributing);
  return { classification: topClassification, matched_ids, matches, rationale };
}

export function classifyMany(
  candidates: CandidateClaim[],
  state: EffectiveState,
): NoveltyResult[] {
  return candidates.map((candidate) => classifyClaim(candidate, state));
}

type PairOutcome = {
  classification: NoveltyClassification;
  reasons: NoveltyMatchReason[];
};

function classifyPair(
  candidate: CandidateClaim,
  matchedRow: EffectiveRow,
  matchReasons: NoveltyMatchReason[],
): PairOutcome {
  const matched = matchedRow.row as ClaimRow;
  const reasons = [...matchReasons];

  const hasKeyOrHashMatch =
    matchReasons.includes("claim_key_exact") || matchReasons.includes("dedupe_hash_exact");
  const hasStatementExact = matchReasons.includes("statement_normalized_exact");
  const hasStatementOverlap = matchReasons.includes("statement_high_overlap");

  const explicitContradiction = detectContradiction(candidate, matched, hasKeyOrHashMatch);
  if (explicitContradiction) {
    reasons.push("explicit_contradiction_relation");
    return { classification: "contradiction", reasons };
  }

  const explicitCorrection = detectCorrection(candidate, hasKeyOrHashMatch);
  if (explicitCorrection) {
    reasons.push("explicit_correction_metadata");
    return { classification: "correction", reasons };
  }

  const evidenceAdded = candidateAddsEvidence(candidate, matched);
  const sourcesAdded = candidateAddsSources(candidate, matched);
  const timeChanged = candidateChangesTime(candidate, matched);
  const assessmentChanged = candidateChangesAssessment(candidate, matched);
  const statementChanged = candidateChangesStatement(candidate, matched);

  if (hasKeyOrHashMatch && timeChanged) {
    reasons.push("time_changed");
    return { classification: "update", reasons };
  }
  if (hasKeyOrHashMatch && assessmentChanged) {
    reasons.push("assessment_changed");
    return { classification: "update", reasons };
  }

  if (hasKeyOrHashMatch || hasStatementExact) {
    if (evidenceAdded || sourcesAdded) {
      reasons.push("evidence_added");
      return { classification: "corroboration", reasons };
    }
    if (
      !statementChanged &&
      !timeChanged &&
      !evidenceAdded &&
      !sourcesAdded &&
      !assessmentChanged
    ) {
      // Conservative rule: a normalized-statement-exact match without a key/hash
      // demotes to duplicate only when scopes overlap; otherwise treat as
      // corroboration since structured signals are absent.
      if (hasKeyOrHashMatch) return { classification: "duplicate", reasons };
      if (hasStatementExact && scopesOverlap(candidate, matched)) {
        return { classification: "duplicate", reasons };
      }
      return { classification: "corroboration", reasons };
    }
    return { classification: "corroboration", reasons };
  }

  if (hasStatementOverlap) {
    return { classification: "corroboration", reasons };
  }

  // Defensive fallback — shouldn't happen because matchReasons would be empty.
  return { classification: "new", reasons };
}

function detectContradiction(
  candidate: CandidateClaim,
  matched: ClaimRow,
  hasKeyOrHashMatch: boolean,
): boolean {
  const matchedId = matched.id;
  const relations = candidate.relations;
  if (Array.isArray(relations)) {
    for (const rel of relations) {
      if (rel && rel.rel === "contradicts" && rel.target_id === matchedId) {
        return true;
      }
    }
  }

  if (candidate.identity?.novelty === "contradiction" && hasKeyOrHashMatch) {
    return true;
  }

  const candidateEvidence = candidate.provenance?.evidence ?? [];
  if (candidateEvidence.length > 0) {
    const matchedSourceIds = new Set(matched.provenance?.source_ids ?? []);
    for (const ev of candidateEvidence) {
      if (ev?.role !== "contradicts") continue;
      const sourceId = ev.source_id;
      if (typeof sourceId !== "string" || sourceId.length === 0) continue;
      if (sourceId === matchedId) return true;
      if (matchedSourceIds.has(sourceId)) return true;
      const matchedEvidence = matched.provenance?.evidence ?? [];
      for (const matchedEv of matchedEvidence) {
        if (matchedEv?.source_id === sourceId) return true;
      }
    }
  }

  return false;
}

function detectCorrection(candidate: CandidateClaim, hasKeyOrHashMatch: boolean): boolean {
  if (candidate.identity?.novelty === "correction" && hasKeyOrHashMatch) {
    return true;
  }
  return false;
}

function candidateAddsEvidence(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const evidence = candidate.provenance?.evidence ?? [];
  if (evidence.length === 0) return false;
  const matchedPairs = evidencePairs(matched.provenance?.evidence ?? []);
  for (const ev of evidence) {
    const key = evidenceKey(ev);
    if (!key) continue;
    if (!matchedPairs.has(key)) return true;
  }
  return false;
}

function candidateAddsSources(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const sources = candidate.provenance?.source_ids ?? [];
  if (sources.length === 0) return false;
  const matchedSources = new Set(matched.provenance?.source_ids ?? []);
  for (const id of sources) {
    if (typeof id === "string" && id.length > 0 && !matchedSources.has(id)) return true;
  }
  return false;
}

function candidateChangesTime(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const ct = candidate.time;
  if (!ct) return false;
  const mt = matched.time ?? { precision: "unknown" as const };
  for (const field of ["valid_at", "valid_until", "occurred_at"] as const) {
    const cv = ct[field];
    if (cv === undefined || cv === null) continue;
    const mv = mt[field];
    if (cv !== mv) return true;
  }
  return false;
}

function candidateChangesAssessment(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const ca = candidate.assessment;
  if (!ca) return false;
  const ma = matched.assessment ?? {};
  if (ca.confidence !== undefined && ca.confidence !== ma.confidence) return true;
  if (ca.importance !== undefined && ca.importance !== ma.importance) return true;
  if (
    ca.information_depth?.level !== undefined &&
    ca.information_depth?.level !== ma.information_depth?.level
  ) {
    return true;
  }
  if (ca.contested !== undefined && ca.contested !== ma.contested) return true;
  return false;
}

function candidateChangesStatement(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const cs = candidate.claim?.statement;
  if (typeof cs !== "string" || cs.length === 0) return false;
  return normalizeStatement(cs) !== normalizeStatement(matched.claim?.statement ?? "");
}

function scopesOverlap(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const cs = candidate.scope;
  const ms = matched.scope;
  if (!cs || !ms) return false;
  const cCols = new Set(cs.collections ?? []);
  for (const col of ms.collections ?? []) {
    if (cCols.has(col)) return true;
  }
  const cSubs = new Set(cs.subjects ?? []);
  for (const sub of ms.subjects ?? []) {
    if (cSubs.has(sub)) return true;
  }
  return false;
}

function evidencePairs(evidence: EvidenceRef[]): Set<string> {
  const set = new Set<string>();
  for (const ev of evidence) {
    const key = evidenceKey(ev);
    if (key) set.add(key);
  }
  return set;
}

function evidenceKey(ev: EvidenceRef | undefined): string | undefined {
  if (!ev) return undefined;
  if (typeof ev.source_id !== "string" || ev.source_id.length === 0) return undefined;
  if (typeof ev.role !== "string") return undefined;
  return `${ev.source_id}::${ev.role}`;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

function isKeptChar(ch: string): boolean {
  if (ch === "-" || ch === "'") return true;
  if (ch >= "a" && ch <= "z") return true;
  if (ch >= "0" && ch <= "9") return true;
  const code = ch.codePointAt(0);
  if (code !== undefined) {
    if (code >= 0x0600 && code <= 0x06ff) return true;
    if (code >= 0x0750 && code <= 0x077f) return true;
    if (code >= 0xfb50 && code <= 0xfdff) return true;
    if (code >= 0xfe70 && code <= 0xfeff) return true;
  }
  return /[\p{L}\p{N}]/u.test(ch);
}

function addReason(
  store: Map<string, Set<NoveltyMatchReason>>,
  id: string,
  reason: NoveltyMatchReason,
): void {
  let set = store.get(id);
  if (!set) {
    set = new Set();
    store.set(id, set);
  }
  // Skip statement_high_overlap when statement_normalized_exact already present
  if (reason === "statement_high_overlap" && set.has("statement_normalized_exact")) return;
  if (reason === "statement_normalized_exact") set.delete("statement_high_overlap");
  set.add(reason);
}

function findActiveById(rows: EffectiveRow[], id: string): EffectiveRow | undefined {
  for (const row of rows) if (row.row.id === id) return row;
  return undefined;
}

function renderRationale(
  classification: NoveltyClassification,
  contributing: Array<{ matchedId: string; reasons: NoveltyMatchReason[] }>,
): string {
  const count = contributing.length;
  const reasonSet = new Set<string>();
  for (const c of contributing) for (const r of c.reasons) reasonSet.add(r);
  const reasonList = Array.from(reasonSet).join(", ");
  const noun = count === 1 ? "active claim" : "active claims";
  return `${classification}: matched ${count} ${noun} via ${reasonList}`;
}
