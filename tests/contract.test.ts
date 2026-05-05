import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  APPLY_OPERATION_KINDS,
  ASSESSMENT_LEVELS,
  ENTRY_ACTIONS,
  completeDraftRow,
  CONFIDENCE_VALUES,
  EVIDENCE_ROLES,
  INFORMATION_DEPTH_VALUES,
  jsonSchema,
  KIND_PREFIXES,
  KNB_SCHEMA_VERSION,
  operationSamples,
  QUESTION_PRIORITIES,
  QUESTION_STATUSES,
  referenceFields,
  LINK_TYPES,
  ROW_KINDS,
  rowSamples,
  scopeSlug,
  SOURCE_TYPES,
  SYNTHESIS_STATUSES,
  TIME_PRECISIONS,
  validateApplyRequest,
  validateLedger,
  validateRows,
  type ApplyRequest,
  type EntryRow,
  type ClaimRow,
  type DraftRow,
  type KnbRow,
  type LoadedRow,
  type QuestionRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

function codes(issues: { code?: string | undefined }[]): string[] {
  return issues.map((i) => i.code ?? "");
}

describe("contract.constants", () => {
  test("KNB_SCHEMA_VERSION is exactly knb.v1", () => {
    expect(KNB_SCHEMA_VERSION).toBe("knb.v1");
  });

  test("ROW_KINDS exposes the five row kinds in fixed order", () => {
    expect([...ROW_KINDS]).toEqual(["source", "claim", "question", "synthesis", "entry"]);
  });

  test("KIND_PREFIXES maps each kind to its expected prefix", () => {
    expect(KIND_PREFIXES.source).toBe("src");
    expect(KIND_PREFIXES.claim).toBe("claim");
    expect(KIND_PREFIXES.question).toBe("q");
    expect(KIND_PREFIXES.synthesis).toBe("synth");
    expect(KIND_PREFIXES.entry).toBe("ent");
    expect(Object.keys(KIND_PREFIXES).sort()).toEqual([...ROW_KINDS].sort());
  });

  test("ENTRY_ACTIONS includes every documented action", () => {
    expect([...ENTRY_ACTIONS].sort()).toEqual(["link", "merge", "patch", "retract", "supersede"]);
  });

  test("APPLY_OPERATION_KINDS includes add and every entry action", () => {
    expect([...APPLY_OPERATION_KINDS].sort()).toEqual(
      ["add", "link", "merge", "patch", "retract", "supersede"],
    );
  });

  test("LINK_TYPES is exactly the four semantic links (no lifecycle terms)", () => {
    expect([...LINK_TYPES].sort()).toEqual(["context_for", "contradicts", "depends_on", "supports"]);
    expect(LINK_TYPES as readonly string[]).not.toContain("supersedes");
    expect(LINK_TYPES as readonly string[]).not.toContain("retracts");
    expect(LINK_TYPES as readonly string[]).not.toContain("merges");
  });
});

describe("contract.rowSamples", () => {
  const samples = rowSamples();

  test("source sample validates with no issues", () => {
    const result = validateRows([samples.source]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("source sample carries the canonical schema_version and prefix", () => {
    expect(samples.source.schema_version).toBe(KNB_SCHEMA_VERSION);
    expect(samples.source.id.startsWith(`${KIND_PREFIXES.source}:`)).toBe(true);
    expect(samples.source.kind).toBe("source");
  });

  test("claim sample validates with no issues", () => {
    const result = validateRows([samples.source, samples.claim]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("claim sample exercises required identity/claim/time/provenance/assessment", () => {
    expect(samples.claim.identity).toBeDefined();
    expect(samples.claim.claim.statement.length).toBeGreaterThan(0);
    expect(typeof samples.claim.claim.atomic).toBe("boolean");
    expect(samples.claim.time.precision).toBeDefined();
    expect(samples.claim.provenance.evidence?.length).toBeGreaterThan(0);
    expect(samples.claim.assessment.confidence).toBeDefined();
  });

  test("question sample validates with no issues", () => {
    const result = validateRows([samples.question]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("synthesis sample validates with no issues", () => {
    const result = validateRows([samples.source, samples.claim, samples.question, samples.synthesis]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("entry sample validates with no issues", () => {
    const result = validateRows([samples.source, samples.claim, samples.entry]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("samples are independent objects (no aliasing between calls)", () => {
    const a = rowSamples();
    const b = rowSamples();
    expect(a.source).not.toBe(b.source);
    a.source.source.title = "MUTATED";
    expect(b.source.source.title).not.toBe("MUTATED");
  });
});

describe("contract.validateLedger.empty-and-trivial", () => {
  test("empty ledger validates ok with no issues", () => {
    const result = validateLedger([]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("forwards parseIssues into result and treats errors as failure", () => {
    const result = validateLedger([], [
      { level: "error", code: "parse_error", message: "bad json", line: 1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe("parse_error");
  });

  test("forwards parseIssues warnings without failing the ledger", () => {
    const samples = rowSamples();
    const result = validateLedger(load([samples.source]), [
      { level: "warning", code: "parse_note", message: "noted", line: 0 },
    ]);
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.code === "parse_note" && i.level === "warning")).toBe(true);
  });

  test("rows with extra unknown fields still validate (open schema)", () => {
    const samples = rowSamples();
    const augmented = { ...samples.source, _internal_marker: "ignored" } as unknown as SourceRow;
    const result = validateRows([augmented]);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });
});

describe("contract.validateLedger.common", () => {
  const samples = rowSamples();

  test("rejects missing schema_version with schema_version_required", () => {
    const row = structuredClone(samples.source) as Record<string, unknown>;
    delete row.schema_version;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("schema_version_required");
  });

  test("rejects empty-string schema_version with schema_version_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.schema_version = "";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("schema_version_required");
  });

  test("rejects whitespace-only schema_version with schema_version_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.schema_version = "   ";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("schema_version_required");
  });

  test("rejects schema_version of wrong type (number) with schema_version_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.schema_version = 1;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    // stringValue() returns undefined for non-strings, so the required code fires
    expect(codes(result.issues)).toContain("schema_version_required");
  });

  test("rejects obsolete kb.v1 schema_version with schema_version_invalid", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.schema_version = "kb.v1";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("schema_version_invalid");
  });

  test("rejects future knb.v2 schema_version with schema_version_invalid", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.schema_version = "knb.v2";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("schema_version_invalid");
  });

  test("rejects missing id with id_required", () => {
    const row = structuredClone(samples.source) as Record<string, unknown>;
    delete row.id;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("id_required");
  });

  test("rejects whitespace-only id with id_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.id = "   ";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("id_required");
  });

  test("rejects non-string id with id_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.id = 42;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("id_required");
  });

  test("rejects missing kind with kind_invalid", () => {
    const row = structuredClone(samples.source) as Record<string, unknown>;
    delete row.kind;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("kind_invalid");
  });

  test("rejects unknown kind value with kind_invalid", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.kind = "asteroid";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("kind_invalid");
  });

  test("rejects missing created_at with created_at_required", () => {
    const row = structuredClone(samples.source) as Record<string, unknown>;
    delete row.created_at;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("created_at_required");
  });

  test("rejects empty-string created_at with created_at_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.created_at = "";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("created_at_required");
  });

  test("rejects malformed created_at with created_at_invalid", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.created_at = "banana";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("created_at_invalid");
  });

  test("rejects missing created_by with created_by_required", () => {
    const row = structuredClone(samples.source) as Record<string, unknown>;
    delete row.created_by;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("created_by_required");
  });

  test("rejects scope as a non-object (array)", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.scope = ["whatever"];
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("scope_invalid");
  });

  test("rejects scope as a string", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.scope = "global";
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("scope_invalid");
  });

  test("rejects scope of null", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    row.scope = null;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("scope_invalid");
  });

  test("rejects scope with all-empty arrays", () => {
    const row = structuredClone(samples.source);
    row.scope = { profiles: [], subjects: [], tags: [] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("scope_anchor_required");
  });

  test("rejects scope with no anchor (empty object)", () => {
    const row = structuredClone(samples.source);
    row.scope = {};
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("scope_anchor_required");
  });

  test("accepts scope where only tags are present", () => {
    const row = structuredClone(samples.source);
    row.scope = { tags: ["onlytag"] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("accepts scope where only subjects are present", () => {
    const row = structuredClone(samples.source);
    row.scope = { subjects: ["only-subject"] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("issue carries line number from LoadedRow", () => {
    const row = structuredClone(samples.source);
    row.scope = {};
    const result = validateLedger([{ row, line: 42 }]);
    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.code === "scope_anchor_required");
    expect(issue?.line).toBe(42);
  });

  test("issue carries id (where present) for cross-referencing", () => {
    const row = structuredClone(samples.source);
    row.scope = {};
    const result = validateLedger(load([row]));
    const issue = result.issues.find((i) => i.code === "scope_anchor_required");
    expect(issue?.id).toBe(samples.source.id);
  });

  test("multiple errors on one row are all reported, not just the first", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    delete row.id;
    delete row.created_at;
    delete row.created_by;
    row.scope = {};
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    const found = new Set(codes(result.issues));
    expect(found).toContain("id_required");
    expect(found).toContain("created_at_required");
    expect(found).toContain("created_by_required");
    expect(found).toContain("scope_anchor_required");
  });
});

describe("contract.validateLedger.duplicateIds", () => {
  const samples = rowSamples();

  test("rejects duplicate ids with duplicate_id code on the second occurrence", () => {
    const dup = structuredClone(samples.source);
    const result = validateLedger(load([samples.source, dup]));
    expect(result.ok).toBe(false);
    const duplicate = result.issues.find((i) => i.code === "duplicate_id");
    expect(duplicate).toBeDefined();
    // duplicate_id is reported on the SECOND occurrence (line 2), not the first
    expect(duplicate?.line).toBe(2);
    expect(duplicate?.id).toBe(samples.source.id);
  });

  test("first occurrence retains reference resolution; duplicate doesn't poison byId", () => {
    // Use first source as evidence — should be resolved despite duplicate
    const dup = structuredClone(samples.source);
    const claim = structuredClone(samples.claim);
    const result = validateLedger(load([samples.source, dup, claim]));
    // Evidence resolution still works (claim's evidence references samples.source.id)
    expect(result.issues.some((i) => i.code === "evidence_source_unresolved")).toBe(false);
    // But duplicate_id is reported
    expect(result.issues.some((i) => i.code === "duplicate_id")).toBe(true);
  });

  test("three identical ids produce two duplicate_id issues", () => {
    const a = structuredClone(samples.source);
    const b = structuredClone(samples.source);
    const c = structuredClone(samples.source);
    const result = validateLedger(load([a, b, c]));
    const duplicates = result.issues.filter((i) => i.code === "duplicate_id");
    expect(duplicates).toHaveLength(2);
  });
});

describe("contract.validateLedger.source", () => {
  const samples = rowSamples();

  test("rejects missing source object with source_object_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    delete row.source;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("source_object_required");
  });

  test("rejects source with invalid type with source_type_invalid", () => {
    const row = structuredClone(samples.source);
    (row.source as unknown as Record<string, unknown>).type = "blog_rant";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("source_type_invalid");
  });

  test("rejects source with missing title with source_title_required", () => {
    const row = structuredClone(samples.source);
    (row.source as unknown as Record<string, unknown>).title = "";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("source_title_required");
  });

  test("rejects source missing all of uri/raw_path/content_hash with source_evidence_required", () => {
    const row = structuredClone(samples.source);
    row.source.uri = null;
    row.source.raw_path = null;
    row.source.content_hash = null;
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("source_evidence_required");
  });

  test("accepts source with raw_path only", () => {
    const row = structuredClone(samples.source);
    row.source.uri = null;
    row.source.raw_path = "/inbox/file.txt";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("accepts source with content_hash only", () => {
    const row = structuredClone(samples.source);
    row.source.uri = null;
    row.source.content_hash = "sha256:cafebabe";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("rejects source with missing provenance with source_provenance_required", () => {
    const row = structuredClone(samples.source) as unknown as Record<string, unknown>;
    delete row.provenance;
    const result = validateLedger(load([row as unknown as SourceRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("source_provenance_required");
  });

  test("emits warning (not error) for duplicate source URI with both lines noted", () => {
    const second = structuredClone(samples.source);
    second.id = "src:example:20260501:dupuri12";
    const result = validateLedger(load([samples.source, second]));
    expect(result.ok).toBe(true);
    const warning = result.issues.find((i) => i.code === "duplicate_source_evidence");
    expect(warning?.level).toBe("warning");
    expect(warning?.line).toBe(2);
    expect(warning?.message).toContain("line 1");
  });

  test("emits warning (not error) for duplicate source content_hash", () => {
    const first = structuredClone(samples.source);
    first.source.uri = null;
    first.source.content_hash = "sha256:abcdef";
    const second = structuredClone(first);
    second.id = "src:example:20260501:duphash1";
    const result = validateLedger(load([first, second]));
    expect(result.ok).toBe(true);
    const warning = result.issues.find((i) => i.code === "duplicate_source_evidence");
    expect(warning?.level).toBe("warning");
  });

  test("emits TWO warnings when duplicate source has both same uri AND content_hash", () => {
    const first = structuredClone(samples.source);
    first.source.content_hash = "sha256:abcdef";
    const second = structuredClone(first);
    second.id = "src:example:20260501:bothdup1";
    const result = validateLedger(load([first, second]));
    expect(result.ok).toBe(true);
    const warnings = result.issues.filter((i) => i.code === "duplicate_source_evidence");
    expect(warnings).toHaveLength(2);
    expect(warnings.some((w) => w.path === "source.uri")).toBe(true);
    expect(warnings.some((w) => w.path === "source.content_hash")).toBe(true);
  });

  test("does not warn for duplicate source URI once duplicate source is merged", () => {
    const canonical = structuredClone(samples.source);
    const duplicate = structuredClone(samples.source);
    duplicate.id = "src:example:20260501:merged1x";
    const merge: EntryRow = {
      schema_version: "knb.v1",
      id: "ent:example:20260501:merge1x",
      kind: "entry",
      created_at: "2026-05-01T12:05:00Z",
      created_by: "agent:test",
      scope: { profiles: ["example"] },
      entry: {
        action: "merge",
        target_ids: [duplicate.id],
        canonical_id: canonical.id,
        reason: "same source URI",
      },
    };

    const result = validateLedger(load([canonical, duplicate, merge]));
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.code === "duplicate_source_evidence")).toBe(false);
  });
});

describe("contract.validateLedger.claim", () => {
  const samples = rowSamples();

  test("rejects claim missing identity with claim_identity_required", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    delete row.identity;
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_identity_required");
  });

  test("rejects claim missing claim object with claim_object_required", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    delete row.claim;
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_object_required");
  });

  test("rejects claim with missing statement with claim_statement_required", () => {
    const row = structuredClone(samples.claim);
    (row.claim as unknown as Record<string, unknown>).statement = "";
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_statement_required");
  });

  test("rejects claim with non-boolean atomic with claim_atomic_required", () => {
    const row = structuredClone(samples.claim);
    (row.claim as unknown as Record<string, unknown>).atomic = "yes";
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_atomic_required");
  });

  test("rejects claim missing time object with claim_time_required", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    delete row.time;
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_time_required");
  });

  test("rejects claim with invalid time.precision with time_precision_invalid", () => {
    const row = structuredClone(samples.claim);
    (row.time as unknown as Record<string, unknown>).precision = "decade";
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("time_precision_invalid");
  });

  test("accepts claim with each valid time.precision", () => {
    for (const precision of TIME_PRECISIONS) {
      const row = structuredClone(samples.claim);
      row.id = `claim:example:20260501:tp${precision.slice(0, 6).padEnd(6, "x")}`;
      row.time.precision = precision;
      const result = validateLedger(load([samples.source, row]));
      expect(result.ok).toBe(true);
    }
  });

  test("rejects claim missing provenance with claim_provenance_required", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    delete row.provenance;
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_provenance_required");
  });

  test("rejects claim with empty provenance.evidence array with claim_provenance_evidence_required", () => {
    const row = structuredClone(samples.claim);
    row.provenance.evidence = [];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_provenance_evidence_required");
  });

  test("rejects claim missing provenance.evidence entirely", () => {
    const row = structuredClone(samples.claim);
    row.provenance = { source_ids: [samples.source.id] };
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_provenance_evidence_required");
  });

  test("rejects claim missing assessment with claim_assessment_required", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    delete row.assessment;
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("claim_assessment_required");
  });

  test("rejects claim with invalid confidence with assessment_confidence_invalid", () => {
    const row = structuredClone(samples.claim);
    (row.assessment as unknown as Record<string, unknown>).confidence = "kinda";
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("assessment_confidence_invalid");
  });

  test("rejects claim missing assessment.confidence with assessment_confidence_invalid", () => {
    const row = structuredClone(samples.claim);
    delete (row.assessment as unknown as Record<string, unknown>).confidence;
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("assessment_confidence_invalid");
  });

  test("accepts claim with each valid confidence value", () => {
    for (const c of CONFIDENCE_VALUES) {
      const row = structuredClone(samples.claim);
      row.id = `claim:example:20260501:cf${c.slice(0, 6).padEnd(6, "x")}`;
      row.assessment.confidence = c;
      const result = validateLedger(load([samples.source, row]));
      expect(result.ok).toBe(true);
    }
  });

  test("rejects claim with invalid source_reliability with assessment_source_reliability_invalid", () => {
    const row = structuredClone(samples.claim);
    row.assessment.source_reliability = "amazing" as never;
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("assessment_source_reliability_invalid");
  });

  test("rejects claim with invalid information_depth.level", () => {
    const row = structuredClone(samples.claim);
    row.assessment.information_depth = { level: "infinite" as never, rationale: "ok" };
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("assessment_information_depth_level_invalid");
  });

  test("rejects claim with information_depth missing rationale", () => {
    const row = structuredClone(samples.claim);
    row.assessment.information_depth = { level: "thin", rationale: "" };
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("assessment_information_depth_rationale_required");
  });
});

describe("contract.validateLedger.question", () => {
  const samples = rowSamples();

  test("rejects question missing question object with question_object_required", () => {
    const row = structuredClone(samples.question) as unknown as Record<string, unknown>;
    delete row.question;
    const result = validateLedger(load([row as unknown as QuestionRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("question_object_required");
  });

  test("rejects question with missing text with question_text_required", () => {
    const row = structuredClone(samples.question);
    (row.question as unknown as Record<string, unknown>).text = "";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("question_text_required");
  });

  test("rejects question with invalid status with question_status_invalid", () => {
    const row = structuredClone(samples.question);
    (row.question as unknown as Record<string, unknown>).status = "pending";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("question_status_invalid");
  });

  test("accepts each valid question status", () => {
    for (const status of QUESTION_STATUSES) {
      const row = structuredClone(samples.question);
      row.id = `q:example:20260501:st${status.slice(0, 6).padEnd(6, "x")}`;
      row.question.status = status;
      const result = validateLedger(load([row]));
      expect(result.ok).toBe(true);
    }
  });

  test("rejects question with invalid priority with question_priority_invalid", () => {
    const row = structuredClone(samples.question);
    row.question.priority = "urgent" as never;
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("question_priority_invalid");
  });

  test("accepts each valid question priority", () => {
    for (const priority of QUESTION_PRIORITIES) {
      const row = structuredClone(samples.question);
      row.id = `q:example:20260501:pr${priority.slice(0, 6).padEnd(6, "x")}`;
      row.question.priority = priority;
      const result = validateLedger(load([row]));
      expect(result.ok).toBe(true);
    }
  });

  test("question without priority is accepted (priority is optional)", () => {
    const row = structuredClone(samples.question);
    delete row.question.priority;
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("rejects question.answer_claim_id pointing at a non-claim row", () => {
    const row = structuredClone(samples.question);
    row.question.answer_claim_id = samples.source.id;
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_kind_mismatch");
  });

  test("rejects question.answer_claim_id pointing at non-existent row", () => {
    const row = structuredClone(samples.question);
    row.question.answer_claim_id = "claim:does:not:exist";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_unresolved");
  });

  test("accepts question.answer_claim_id pointing at a real claim", () => {
    const row = structuredClone(samples.question);
    row.question.answer_claim_id = samples.claim.id;
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(true);
  });
});

describe("contract.validateLedger.synthesis", () => {
  const samples = rowSamples();

  test("rejects synthesis missing synthesis object with synthesis_object_required", () => {
    const row = structuredClone(samples.synthesis) as unknown as Record<string, unknown>;
    delete row.synthesis;
    const result = validateLedger(load([row as unknown as SynthesisRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_object_required");
  });

  test("rejects synthesis missing title with synthesis_title_required", () => {
    const row = structuredClone(samples.synthesis);
    (row.synthesis as unknown as Record<string, unknown>).title = "";
    const result = validateLedger(load([samples.source, samples.claim, samples.question, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_title_required");
  });

  test("rejects synthesis missing summary with synthesis_summary_required", () => {
    const row = structuredClone(samples.synthesis);
    (row.synthesis as unknown as Record<string, unknown>).summary = "";
    const result = validateLedger(load([samples.source, samples.claim, samples.question, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_summary_required");
  });

  test("rejects synthesis with invalid status with synthesis_status_invalid", () => {
    const row = structuredClone(samples.synthesis);
    (row.synthesis as unknown as Record<string, unknown>).status = "draft";
    const result = validateLedger(load([samples.source, samples.claim, samples.question, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_status_invalid");
  });

  test("accepts each valid synthesis status", () => {
    for (const status of SYNTHESIS_STATUSES) {
      const row = structuredClone(samples.synthesis);
      row.id = `synth:example:20260501:st${status.slice(0, 6).padEnd(6, "x")}`;
      row.synthesis.status = status;
      const result = validateLedger(load([samples.source, samples.claim, samples.question, row]));
      expect(result.ok).toBe(true);
    }
  });

  test("rejects synthesis with non-object basis with synthesis_basis_required", () => {
    const row = structuredClone(samples.synthesis);
    (row.synthesis as unknown as Record<string, unknown>).basis = "claim:foo";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_required");
  });

  test("rejects synthesis with empty basis and no limitations", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = {};
    delete row.synthesis.limitations;
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_required");
  });

  test("accepts synthesis with empty basis if limitations is provided", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = {};
    row.synthesis.limitations = "Speculative summary; no concrete basis yet.";
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(true);
  });

  test("rejects synthesis basis claim_ids pointing at synthesis (wrong kind)", () => {
    const row = structuredClone(samples.synthesis);
    row.id = "synth:example:20260501:wrongkin";
    row.synthesis.basis = { claim_ids: [samples.synthesis.id] };
    const result = validateLedger(load([samples.synthesis, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_kind_mismatch");
  });

  test("rejects synthesis basis question_ids pointing at a source (wrong kind)", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = { question_ids: [samples.source.id] };
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_kind_mismatch");
  });

  test("rejects synthesis basis source_ids pointing at a claim (wrong kind)", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = { source_ids: [samples.claim.id] };
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_kind_mismatch");
  });

  test("rejects unresolved synthesis basis claim_ids", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = { claim_ids: ["claim:missing"] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_unresolved");
  });

  test("rejects unresolved synthesis basis question_ids", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = { question_ids: ["q:missing"] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_unresolved");
  });

  test("rejects unresolved synthesis basis source_ids", () => {
    const row = structuredClone(samples.synthesis);
    row.synthesis.basis = { source_ids: ["src:missing"] };
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("synthesis_basis_unresolved");
  });
});

describe("contract.validateLedger.entry", () => {
  const samples = rowSamples();

  function entryRow(action: string, extras: Record<string, unknown>): EntryRow {
    return {
      schema_version: "knb.v1",
      id: `ent:example:20260501:${action.slice(0, 6).padEnd(6, "x")}xx`,
      kind: "entry",
      created_at: "2026-05-01T12:05:00Z",
      created_by: "agent:test",
      scope: { profiles: ["example"] },
      entry: { action, ...extras } as EntryRow["entry"],
    } as EntryRow;
  }

  test("rejects entry missing entry object with entry_object_required", () => {
    const row = entryRow("retract", {}) as unknown as Record<string, unknown>;
    delete row.entry;
    const result = validateLedger(load([row as unknown as EntryRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_object_required");
  });

  test("rejects entry with invalid action with entry_action_invalid", () => {
    const row = entryRow("invalidate", { target_ids: [samples.claim.id], reason: "x" });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_action_invalid");
  });

  test("rejects retract missing target_ids with entry_target_required", () => {
    const row = entryRow("retract", { reason: "no targets" });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_target_required");
  });

  test("rejects retract missing reason with entry_reason_required", () => {
    const row = entryRow("retract", { target_ids: [samples.claim.id] });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_reason_required");
  });

  test("rejects retract with unresolved target with entry_target_unresolved", () => {
    const row = entryRow("retract", { target_ids: ["claim:missing"], reason: "missing" });
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_target_unresolved");
  });

  test("retract reports BOTH unresolved targets when given a mix", () => {
    const row = entryRow("retract", {
      target_ids: ["claim:missing-a", "claim:missing-b", samples.claim.id],
      reason: "test",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    const unresolved = result.issues.filter((i) => i.code === "entry_target_unresolved");
    expect(unresolved).toHaveLength(2);
    expect(unresolved.some((i) => i.message.includes("claim:missing-a"))).toBe(true);
    expect(unresolved.some((i) => i.message.includes("claim:missing-b"))).toBe(true);
  });

  test("rejects supersede missing replacement_id with entry_replacement_required", () => {
    const row = entryRow("supersede", {
      target_ids: [samples.claim.id],
      reason: "no replacement",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_replacement_required");
  });

  test("rejects supersede with unresolved replacement_id with entry_replacement_unresolved", () => {
    const row = entryRow("supersede", {
      target_ids: [samples.claim.id],
      replacement_id: "claim:does:not:exist",
      reason: "x",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_replacement_unresolved");
  });

  test("rejects merge missing canonical_id with entry_canonical_required", () => {
    const row = entryRow("merge", {
      target_ids: [samples.claim.id],
      reason: "no canonical",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_canonical_required");
  });

  test("rejects merge with unresolved canonical_id with entry_canonical_unresolved", () => {
    const row = entryRow("merge", {
      target_ids: [samples.claim.id],
      canonical_id: "claim:no:such:thing",
      reason: "x",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_canonical_unresolved");
  });

  test("rejects link missing link object with entry_link_required", () => {
    const row = entryRow("link", {});
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_link_required");
  });

  test("rejects link missing from_id/to_id endpoints", () => {
    const row = entryRow("link", {
      link: { rel: "supports" },
    });
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    const found = codes(result.issues);
    expect(found.filter((c) => c === "entry_link_endpoint_required")).toHaveLength(2);
  });

  test("rejects link with unresolved endpoints", () => {
    const row = entryRow("link", {
      link: {
        from_id: "claim:nope-from",
        to_id: "src:nope-to",
        rel: "supports",
      },
    });
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_link_endpoint_unresolved");
  });

  test("rejects link with invalid rel with link_kind_invalid", () => {
    const row = entryRow("link", {
      link: {
        from_id: samples.claim.id,
        to_id: samples.source.id,
        rel: "supersedes",
      },
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("link_kind_invalid");
  });

  test("accepts well-formed link entry", () => {
    const row = entryRow("link", {
      link: {
        from_id: samples.claim.id,
        to_id: samples.source.id,
        rel: "supports",
      },
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(true);
  });

  test("rejects patch missing target_id with entry_target_required", () => {
    const row = entryRow("patch", {
      patch: [{ op: "replace", path: "/x", value: 1 }],
      reason: "test",
    });
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_target_required");
  });

  test("rejects patch with empty patch array with entry_patch_required", () => {
    const row = entryRow("patch", {
      target_id: samples.claim.id,
      patch: [],
      reason: "test",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_patch_required");
  });

  test("rejects patch missing patch field with entry_patch_required", () => {
    const row = entryRow("patch", {
      target_id: samples.claim.id,
      reason: "test",
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_patch_required");
  });

  test("rejects patch missing reason with entry_reason_required", () => {
    const row = entryRow("patch", {
      target_id: samples.claim.id,
      patch: [{ op: "replace", path: "/x", value: 1 }],
    });
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_reason_required");
  });

  test("rejects patch with unresolved target_id with entry_target_unresolved", () => {
    const row = entryRow("patch", {
      target_id: "claim:no-exist",
      patch: [{ op: "replace", path: "/x", value: 1 }],
      reason: "test",
    });
    const result = validateLedger(load([row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("entry_target_unresolved");
  });
});

describe("contract.validateLedger.links", () => {
  const samples = rowSamples();

  test("rejects links as a non-array with links_invalid", () => {
    const row = structuredClone(samples.claim) as unknown as Record<string, unknown>;
    row.links = { target_id: samples.source.id, rel: "supports" };
    const result = validateLedger(load([samples.source, row as unknown as ClaimRow]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("links_invalid");
  });

  test("rejects unresolved link target with link_target_unresolved", () => {
    const row = structuredClone(samples.claim);
    row.id = "claim:example:20260501:relmiss1";
    row.links = [{ target_id: "claim:missing", rel: "supports" }];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("link_target_unresolved");
  });

  test("rejects link missing target_id with link_target_required", () => {
    const row = structuredClone(samples.claim);
    row.links = [{ rel: "supports" } as never];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("link_target_required");
  });

  test("rejects link with invalid item type with link_invalid", () => {
    const row = structuredClone(samples.claim);
    row.links = ["not-an-object"] as never;
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("link_invalid");
  });

  test("rejects lifecycle terms in semantic links with link_kind_invalid", () => {
    const row = structuredClone(samples.claim);
    row.id = "claim:example:20260501:gggg7777";
    row.links = [{ target_id: samples.claim.id, rel: "supersedes" as never }];
    const result = validateLedger(load([samples.source, samples.claim, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("link_kind_invalid");
  });

  test("does not falsely flag rows that lack links entirely", () => {
    const result = validateLedger(load([samples.source]));
    expect(result.issues.some((i) => i.code === "links_invalid")).toBe(false);
    expect(result.issues.some((i) => i.code === "link_target_unresolved")).toBe(false);
  });

  test("accepts links referencing rows defined later in the ledger", () => {
    const a = structuredClone(samples.claim);
    a.id = "claim:example:20260501:relfwd11";
    a.links = [{ target_id: samples.claim.id, rel: "supports" }];
    const result = validateLedger(load([samples.source, a, samples.claim]));
    expect(result.ok).toBe(true);
  });
});

describe("contract.validateLedger.evidence", () => {
  const samples = rowSamples();

  test("rejects unresolved evidence source IDs with evidence_source_unresolved", () => {
    const row = structuredClone(samples.claim);
    row.id = "claim:example:20260501:zzzz1234";
    row.provenance.evidence = [{ source_id: "src:missing", role: "supports", summary: "Missing." }];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_source_unresolved");
  });

  test("rejects unresolved provenance.source_ids with evidence_source_unresolved", () => {
    const row = structuredClone(samples.claim);
    row.provenance.source_ids = ["src:nope"];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_source_unresolved");
  });

  test("rejects evidence missing source_id with evidence_source_required", () => {
    const row = structuredClone(samples.claim);
    row.provenance.evidence = [{ role: "supports", summary: "ok" } as never];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_source_required");
  });

  test("rejects evidence with invalid role with evidence_role_invalid", () => {
    const row = structuredClone(samples.claim);
    row.provenance.evidence = [
      { source_id: samples.source.id, role: "agrees" as never, summary: "ok" },
    ];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_role_invalid");
  });

  test("rejects evidence missing summary with evidence_summary_required", () => {
    const row = structuredClone(samples.claim);
    row.provenance.evidence = [
      { source_id: samples.source.id, role: "supports", summary: "" },
    ];
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_summary_required");
  });

  test("rejects evidence item that is not an object with evidence_invalid", () => {
    const row = structuredClone(samples.claim);
    row.provenance.evidence = ["bad"] as never;
    const result = validateLedger(load([samples.source, row]));
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("evidence_invalid");
  });

  test("accepts each valid evidence role", () => {
    for (const role of EVIDENCE_ROLES) {
      const row = structuredClone(samples.claim);
      row.id = `claim:example:20260501:er${role.slice(0, 6).padEnd(6, "x")}`;
      row.provenance.evidence = [
        { source_id: samples.source.id, role, summary: "ok" },
      ];
      const result = validateLedger(load([samples.source, row]));
      expect(result.ok).toBe(true);
    }
  });
});

describe("contract.validateApplyRequest", () => {
  const samples = operationSamples();

  test("rejects non-object request with apply_request_invalid", () => {
    const result = validateApplyRequest("not an object");
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("apply_request_invalid");
  });

  test("rejects null request with apply_request_invalid", () => {
    const result = validateApplyRequest(null);
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("apply_request_invalid");
  });

  test("rejects request missing operations field with apply_request_invalid", () => {
    const result = validateApplyRequest({});
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("apply_request_invalid");
  });

  test("rejects operations as a non-array with apply_request_invalid", () => {
    const result = validateApplyRequest({ operations: "nope" });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("apply_request_invalid");
  });

  test("accepts the add operation sample", () => {
    const request: ApplyRequest = { operations: [samples.add] };
    const result = validateApplyRequest(request);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("accepts the retract operation sample", () => {
    const result = validateApplyRequest({ operations: [samples.retract] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("accepts the supersede operation sample", () => {
    const result = validateApplyRequest({ operations: [samples.supersede] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("accepts the merge operation sample", () => {
    const result = validateApplyRequest({ operations: [samples.merge] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("accepts the link operation sample", () => {
    const result = validateApplyRequest({ operations: [samples.link] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("accepts the patch operation sample", () => {
    const result = validateApplyRequest({ operations: [samples.patch] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("rejects atomic: false with unsafe_operation_refused", () => {
    const result = validateApplyRequest({ operations: [samples.add], atomic: false });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("unsafe_operation_refused");
  });

  test("accepts empty operations list as an apply no-op", () => {
    const result = validateApplyRequest({ operations: [] });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("rejects unknown operation kind with operation_kind_invalid", () => {
    const result = validateApplyRequest({ operations: [{ op: "delete" }] });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_kind_invalid");
  });

  test("rejects non-object operation with operation_invalid", () => {
    const result = validateApplyRequest({ operations: ["not an object"] });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_invalid");
  });

  test("rejects add operation missing row with operation_row_required", () => {
    const result = validateApplyRequest({ operations: [{ op: "add" }] });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_row_required");
  });

  test("rejects retract without reason with operation_reason_required", () => {
    const result = validateApplyRequest({
      operations: [{ op: "retract", target_ids: ["claim:something"] }],
    });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_reason_required");
  });

  test("rejects retract without target_ids with operation_target_required", () => {
    const result = validateApplyRequest({
      operations: [{ op: "retract", reason: "x" }],
    });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_target_required");
  });

  test("rejects supersede without replacement_id with operation_replacement_required", () => {
    const result = validateApplyRequest({
      operations: [{ op: "supersede", target_ids: ["claim:x"], reason: "x" }],
    });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_replacement_required");
  });

  test("rejects merge without canonical_id with operation_canonical_required", () => {
    const result = validateApplyRequest({
      operations: [{ op: "merge", target_ids: ["claim:x"], reason: "x" }],
    });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_canonical_required");
  });

  test("rejects link without from_id, to_id, rel", () => {
    const result = validateApplyRequest({ operations: [{ op: "link" }] });
    expect(result.ok).toBe(false);
    const found = codes(result.issues);
    expect(found).toContain("operation_from_required");
    expect(found).toContain("operation_to_required");
    expect(found).toContain("link_kind_invalid");
  });

  test("rejects patch without target_id and patch", () => {
    const result = validateApplyRequest({ operations: [{ op: "patch", reason: "x" }] });
    expect(result.ok).toBe(false);
    const found = codes(result.issues);
    expect(found).toContain("operation_target_required");
    expect(found).toContain("operation_patch_required");
  });

  test("validates each operation independently when multiple are given", () => {
    const result = validateApplyRequest({
      operations: [
        { op: "retract", target_ids: ["claim:x"], reason: "ok" },
        { op: "delete" },
        { op: "merge", target_ids: ["claim:y"], canonical_id: "claim:z", reason: "ok" },
      ],
    });
    expect(result.ok).toBe(false);
    expect(codes(result.issues)).toContain("operation_kind_invalid");
    // operations[1] path identifies the offending entry
    const offender = result.issues.find((i) => i.code === "operation_kind_invalid");
    expect(offender?.path).toContain("operations[1]");
  });
});

describe("contract.completeDraftRow", () => {
  const fixedDate = new Date("2026-05-01T12:00:00.000Z");
  const deps = {
    actor: "agent:test",
    now: () => fixedDate,
    randomIdPart: (_bytes: number) => "deadbeef",
  };

  test("produces deterministic id and sets common fields", () => {
    const draft: DraftRow = {
      kind: "claim",
      scope: { profiles: ["example"] },
      identity: { claim_key: "x|y" },
      claim: { statement: "x is y", atomic: true },
      time: { precision: "unknown" },
      provenance: { evidence: [{ source_id: "src:any", role: "supports", summary: "ok" }] },
      assessment: { confidence: "low" },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id).toBe(`${KIND_PREFIXES.claim}:example:20260501:deadbeef`);
    expect(result.row.created_at).toBe("2026-05-01T12:00:00.000Z");
    expect(result.row.created_by).toBe("agent:test");
    expect(result.row.schema_version).toBe("knb.v1");
  });

  test("same inputs produce same id (determinism)", () => {
    const draft = { kind: "source", scope: { profiles: ["alpha"] } } as DraftRow;
    const a = completeDraftRow(draft, deps);
    const b = completeDraftRow(draft, deps);
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) expect(a.row.id).toBe(b.row.id);
  });

  test("id matches expected format <prefix>:<slug>:<YYYYMMDD>:<random>", () => {
    const draft = { kind: "source", scope: { profiles: ["alpha"] } } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id).toMatch(/^src:alpha:\d{8}:[a-z0-9]+$/);
  });

  test("uses the right kind prefix per kind (explicit assertion per kind)", () => {
    const expectations: Array<[KnbRow["kind"], string]> = [
      ["source", "src"],
      ["claim", "claim"],
      ["question", "q"],
      ["synthesis", "synth"],
      ["entry", "ent"],
    ];
    for (const [kind, prefix] of expectations) {
      const draft = { kind, scope: { profiles: ["x"] } } as DraftRow;
      const result = completeDraftRow(draft, deps);
      expect(result.ok).toBe(true);
      if (!result.ok) continue;
      expect(result.row.id.split(":")[0]).toBe(prefix);
    }
  });

  test("scope-slug priority: profiles beats subjects beats tags", () => {
    const collFirst = {
      kind: "claim",
      scope: { profiles: ["a-coll"], subjects: ["b-subj"], tags: ["c-tag"] },
    } as DraftRow;
    const r1 = completeDraftRow(collFirst, deps);
    expect(r1.ok && r1.row.id.split(":")[1]).toBe("a-coll");

    const subjOnly = { kind: "claim", scope: { subjects: ["b-subj"], tags: ["c-tag"] } } as DraftRow;
    const r2 = completeDraftRow(subjOnly, deps);
    expect(r2.ok && r2.row.id.split(":")[1]).toBe("b-subj");

    const tagsOnly = { kind: "claim", scope: { tags: ["c-tag"] } } as DraftRow;
    const r3 = completeDraftRow(tagsOnly, deps);
    expect(r3.ok && r3.row.id.split(":")[1]).toBe("c-tag");
  });

  test("scope-slug priority: profiles=[] still falls through to subjects", () => {
    const draft = {
      kind: "claim",
      scope: { profiles: [], subjects: ["only-sub"] },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id.split(":")[1]).toBe("only-sub");
  });

  test("scope-slug sanitizes special characters (slashes, colons, spaces)", () => {
    const draft = {
      kind: "claim",
      scope: { profiles: ["My Project: alpha/beta"] },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const slug = result.row.id.split(":")[1];
    expect(slug).toBe("my-project-alpha-beta");
  });

  test("scope-slug strips leading/trailing dashes after sanitization", () => {
    const draft = {
      kind: "claim",
      scope: { profiles: ["___edge___"] },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id.split(":")[1]).toBe("edge");
  });

  test("rejects scope with no anchor with scope_anchor_required", () => {
    const draft = { kind: "claim", scope: {} } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("scope_anchor_required");
  });

  test("rejects scope as non-object with scope_anchor_required", () => {
    const draft = { kind: "claim", scope: "global" } as unknown as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("scope_anchor_required");
  });

  test("rejects invalid kind with kind_invalid", () => {
    const draft = { kind: "blob", scope: { profiles: ["x"] } } as unknown as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("kind_invalid");
  });

  test("rejects missing kind with kind_invalid", () => {
    const draft = { scope: { profiles: ["x"] } } as unknown as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("kind_invalid");
  });

  test("rejects non-object draft with draft_invalid", () => {
    const result = completeDraftRow(null as unknown as DraftRow, deps);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("draft_invalid");
  });

  test("rejects when deps.now() returns invalid date with now_invalid", () => {
    const result = completeDraftRow(
      { kind: "source", scope: { profiles: ["x"] } } as DraftRow,
      { ...deps, now: () => new Date("not-a-date") },
    );
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(codes(result.issues)).toContain("now_invalid");
  });

  test("preserves a caller-provided id verbatim", () => {
    const draft: DraftRow = {
      kind: "source",
      id: "src:custom:20260101:custom01",
      scope: { profiles: ["custom"] },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.row.id).toBe("src:custom:20260101:custom01");
  });

  test("ignores empty-string caller-provided id (treats as missing, generates one)", () => {
    const draft: DraftRow = {
      kind: "source",
      id: "",
      scope: { profiles: ["custom"] },
    } as DraftRow;
    const result = completeDraftRow(draft, deps);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id).not.toBe("");
    expect(result.row.id).toMatch(/^src:custom:\d{8}:[a-z0-9]+$/);
  });

  test("YMD in id matches deps.now() in UTC", () => {
    const newYearsEveLate = new Date("2026-12-31T23:59:59.999Z");
    const result = completeDraftRow(
      { kind: "source", scope: { profiles: ["x"] } } as DraftRow,
      { ...deps, now: () => newYearsEveLate },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.id.split(":")[2]).toBe("20261231");
  });

  test("uses deps.actor in created_by", () => {
    const result = completeDraftRow(
      { kind: "source", scope: { profiles: ["x"] } } as DraftRow,
      { ...deps, actor: "agent:custom-actor" },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.created_by).toBe("agent:custom-actor");
  });

  test("invokes randomIdPart with expected byte count (4)", () => {
    const calls: number[] = [];
    completeDraftRow(
      { kind: "source", scope: { profiles: ["x"] } } as DraftRow,
      {
        ...deps,
        randomIdPart: (bytes) => {
          calls.push(bytes);
          return "abcd";
        },
      },
    );
    expect(calls).toEqual([4]);
  });
});

describe("contract.scopeSlug", () => {
  test("returns undefined for empty scope", () => {
    expect(scopeSlug({})).toBeUndefined();
  });

  test("returns undefined for scope with all-empty arrays", () => {
    expect(scopeSlug({ profiles: [], subjects: [], tags: [] })).toBeUndefined();
  });

  test("prefers profiles over subjects and tags", () => {
    expect(scopeSlug({ profiles: ["a"], subjects: ["b"], tags: ["c"] })).toBe("a");
  });

  test("falls back to subjects when profiles is empty", () => {
    expect(scopeSlug({ profiles: [], subjects: ["b"], tags: ["c"] })).toBe("b");
  });

  test("falls back to tags when profiles and subjects are empty", () => {
    expect(scopeSlug({ tags: ["c"] })).toBe("c");
  });

  test("slugifies", () => {
    expect(scopeSlug({ profiles: ["Hello, World!"] })).toBe("hello-world");
  });
});

describe("contract.referenceFields", () => {
  test("walks every row-to-row reference slot with stable paths and setters", () => {
    const samples = rowSamples();
    const claim: ClaimRow = {
      ...samples.claim,
      provenance: {
        source_ids: [samples.source.id],
        evidence: [{ source_id: samples.source.id, role: "supports", summary: "Evidence." }],
      },
      links: [{ target_id: samples.question.id, rel: "context_for" }],
    };
    const question: QuestionRow = {
      ...samples.question,
      question: { ...samples.question.question, answer_claim_id: samples.claim.id },
      provenance: {
        source_ids: [samples.source.id],
        evidence: [{ source_id: samples.source.id, role: "supports", summary: "Evidence." }],
      },
      links: [{ target_id: samples.claim.id, rel: "depends_on" }],
    };
    const synthesis: SynthesisRow = {
      ...samples.synthesis,
      provenance: {
        source_ids: [samples.source.id],
        evidence: [{ source_id: samples.source.id, role: "supports", summary: "Evidence." }],
      },
      links: [{ target_id: samples.claim.id, rel: "supports" }],
    };
    const entry: EntryRow = {
      ...samples.entry,
      entry: {
        action: "supersede",
        target_ids: [samples.claim.id],
        replacement_id: "claim:contract:20260501:replace1",
        canonical_id: "claim:contract:20260501:canon001",
        target_id: samples.question.id,
        link: { from_id: samples.claim.id, to_id: samples.question.id, rel: "context_for" },
        reason: "Exercise all reference slots.",
      },
    };

    const slots = [claim, question, synthesis, entry].flatMap((row) =>
      [...referenceFields(row)].map((slot) => ({
        kind: slot.kind,
        path: slot.path,
        value: slot.get(),
      })),
    );

    expect(slots).toEqual([
      { kind: "source", path: "provenance.source_ids[0]", value: samples.source.id },
      { kind: "source", path: "provenance.evidence[0].source_id", value: samples.source.id },
      { kind: "any", path: "links[0].target_id", value: samples.question.id },
      { kind: "source", path: "provenance.source_ids[0]", value: samples.source.id },
      { kind: "source", path: "provenance.evidence[0].source_id", value: samples.source.id },
      { kind: "any", path: "links[0].target_id", value: samples.claim.id },
      { kind: "claim", path: "question.answer_claim_id", value: samples.claim.id },
      { kind: "source", path: "provenance.source_ids[0]", value: samples.source.id },
      { kind: "source", path: "provenance.evidence[0].source_id", value: samples.source.id },
      { kind: "any", path: "links[0].target_id", value: samples.claim.id },
      { kind: "claim", path: "synthesis.basis.claim_ids[0]", value: samples.claim.id },
      { kind: "question", path: "synthesis.basis.question_ids[0]", value: samples.question.id },
      { kind: "source", path: "synthesis.basis.source_ids[0]", value: samples.source.id },
      { kind: "any", path: "entry.target_ids[0]", value: samples.claim.id },
      { kind: "any", path: "entry.target_id", value: samples.question.id },
      { kind: "any", path: "entry.replacement_id", value: "claim:contract:20260501:replace1" },
      { kind: "any", path: "entry.canonical_id", value: "claim:contract:20260501:canon001" },
      { kind: "any", path: "entry.link.from_id", value: samples.claim.id },
      { kind: "any", path: "entry.link.to_id", value: samples.question.id },
    ]);

    const evidenceSlot = [...referenceFields(claim)].find(
      (slot) => slot.path === "provenance.evidence[0].source_id",
    );
    evidenceSlot?.set("src:contract:20260501:changed1");
    expect(claim.provenance.evidence?.[0]?.source_id).toBe("src:contract:20260501:changed1");
  });
});

describe("contract.operationSamples", () => {
  test("each sample is a well-formed apply operation", () => {
    const samples = operationSamples();
    for (const op of Object.values(samples)) {
      const result = validateApplyRequest({ operations: [op] });
      expect(result.ok).toBe(true);
      expect(result.issues).toEqual([]);
    }
  });

  test("samples cover every APPLY_OPERATION_KIND", () => {
    const samples = operationSamples();
    const kinds = new Set(Object.values(samples).map((op) => op.op));
    for (const kind of APPLY_OPERATION_KINDS) {
      expect(kinds.has(kind)).toBe(true);
    }
  });
});

describe("contract.jsonSchema", () => {
  test("matches knb/schema.json contents byte-for-byte (deep equality)", () => {
    const target = resolve(import.meta.dir, "..", "knb", "schema.json");
    const onDisk = JSON.parse(readFileSync(target, "utf8"));
    expect(jsonSchema()).toEqual(onDisk);
  });

  test("$id equals KNB_SCHEMA_VERSION", () => {
    expect((jsonSchema() as { $id: string }).$id).toBe(KNB_SCHEMA_VERSION);
  });

  test("schema_version property is constrained to KNB_SCHEMA_VERSION as a const", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.properties.schema_version.const).toBe(KNB_SCHEMA_VERSION);
  });

  test("kind enum equals ROW_KINDS exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.properties.kind.enum).toEqual([...ROW_KINDS]);
  });

  test("entry.action enum equals ENTRY_ACTIONS exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.entry.properties.action.enum).toEqual([...ENTRY_ACTIONS]);
  });

  test("link.rel enum equals LINK_TYPES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.link.properties.rel.enum).toEqual([...LINK_TYPES]);
  });

  test("source.type enum equals SOURCE_TYPES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.source.properties.type.enum).toEqual([...SOURCE_TYPES]);
  });

  test("question.status enum equals QUESTION_STATUSES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.question.properties.status.enum).toEqual([...QUESTION_STATUSES]);
  });

  test("question.priority enum equals QUESTION_PRIORITIES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.question.properties.priority.enum).toEqual([...QUESTION_PRIORITIES]);
  });

  test("synthesis.status enum equals SYNTHESIS_STATUSES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.synthesis.properties.status.enum).toEqual([...SYNTHESIS_STATUSES]);
  });

  test("time.precision enum equals TIME_PRECISIONS exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.time.properties.precision.enum).toEqual([...TIME_PRECISIONS]);
  });

  test("evidence_ref.role enum equals EVIDENCE_ROLES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.evidence_ref.properties.role.enum).toEqual([...EVIDENCE_ROLES]);
  });

  test("assessment.confidence enum equals CONFIDENCE_VALUES exactly", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.assessment.properties.confidence.enum).toEqual([...CONFIDENCE_VALUES]);
  });

  test("assessment.source_reliability and importance enums equal ASSESSMENT_LEVELS", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.assessment.properties.source_reliability.enum).toEqual([...ASSESSMENT_LEVELS]);
    expect(schema.$defs.assessment.properties.importance.enum).toEqual([...ASSESSMENT_LEVELS]);
  });

  test("assessment.information_depth.level enum equals INFORMATION_DEPTH_VALUES", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect(schema.$defs.assessment.properties.information_depth.properties.level.enum).toEqual([
      ...INFORMATION_DEPTH_VALUES,
    ]);
  });

  test("required common fields enforced at the top level", () => {
    const schema = jsonSchema() as Record<string, any>;
    expect([...schema.required].sort()).toEqual(
      ["created_at", "created_by", "id", "kind", "schema_version", "scope"],
    );
  });

  test("scope anyOf demands at least one of profiles/subjects/tags", () => {
    const schema = jsonSchema() as Record<string, any>;
    const required = schema.$defs.scope.anyOf.map((b: { required: string[] }) => b.required[0]);
    expect(required.sort()).toEqual(["profiles", "subjects", "tags"]);
  });

  test("source anyOf demands at least one of uri/raw_path/content_hash", () => {
    const schema = jsonSchema() as Record<string, any>;
    const required = schema.$defs.source.anyOf.map((b: { required: string[] }) => b.required[0]);
    expect(required.sort()).toEqual(["content_hash", "raw_path", "uri"]);
  });

  test("claim allOf gate requires evidence with minItems 1", () => {
    const schema = jsonSchema() as Record<string, any>;
    const claimGate = schema.allOf.find(
      (clause: any) => clause.if?.properties?.kind?.const === "claim",
    );
    expect(claimGate).toBeDefined();
    expect(claimGate.then.required).toContain("identity");
    expect(claimGate.then.required).toContain("claim");
    expect(claimGate.then.required).toContain("time");
    expect(claimGate.then.required).toContain("provenance");
    expect(claimGate.then.required).toContain("assessment");
    expect(claimGate.then.properties.provenance.properties.evidence.minItems).toBe(1);
    expect(claimGate.then.properties.assessment.required).toContain("confidence");
  });

  test("returns a fresh object each call (no mutation hazards)", () => {
    const a = jsonSchema();
    const b = jsonSchema();
    expect(a).not.toBe(b);
    (a as Record<string, unknown>).$id = "MUTATED";
    expect((b as Record<string, unknown>).$id).toBe(KNB_SCHEMA_VERSION);
  });
});
