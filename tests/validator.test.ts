import { describe, expect, test } from "bun:test";
import { queryRows, validateLedger, type LoadedRow } from "../src/kb";
import type { ClaimRow, SourceRow, SynthesisRow } from "../src/types";

const source: SourceRow = {
  schema_version: "kb.v1",
  id: "src:test:20260501:aaaa1111",
  kind: "source",
  created_at: "2026-05-01T12:00:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"] },
  source: {
    type: "web_page",
    title: "Example source",
    uri: "https://example.com",
  },
  provenance: {
    acquisition: {
      method: "manual",
      observed_at: "2026-05-01T12:00:00Z",
    },
  },
};

const claim: ClaimRow = {
  schema_version: "kb.v1",
  id: "claim:test:20260501:bbbb2222",
  kind: "claim",
  created_at: "2026-05-01T12:01:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"], tags: ["fact"] },
  identity: {
    claim_key: "example|has|source",
    novelty: "new",
  },
  claim: {
    statement: "Example has a source.",
    atomic: true,
    subject: "Example",
    predicate: "has",
    object: "source",
  },
  time: {
    first_observed_at: "2026-05-01T12:01:00Z",
    precision: "instant",
  },
  provenance: {
    source_ids: [source.id],
    evidence: [
      {
        source_id: source.id,
        role: "supports",
        summary: "The example source supports the claim.",
      },
    ],
  },
  assessment: {
    confidence: "high",
  },
};

const synthesis: SynthesisRow = {
  schema_version: "kb.v1",
  id: "synth:test:20260501:cccc3333",
  kind: "synthesis",
  created_at: "2026-05-01T12:02:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"] },
  synthesis: {
    title: "Example has sourced knowledge",
    summary: "The KB can preserve a sourced claim and render it later.",
    basis: {
      claim_ids: [claim.id],
      source_ids: [source.id],
    },
    status: "active",
  },
};

describe("validateLedger", () => {
  test("accepts valid source, claim, and synthesis rows", () => {
    const rows = load([source, claim, synthesis]);
    const result = validateLedger(rows);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("rejects unresolved evidence source IDs", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4444";
    badClaim.provenance.evidence = [{ source_id: "src:missing", role: "supports", summary: "Missing." }];
    const result = validateLedger(load([source, badClaim]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Unresolved evidence source_id"))).toBe(true);
  });

  test("query hides rows targeted by supersedes unless history is requested", () => {
    const replacement = structuredClone(claim);
    replacement.id = "claim:test:20260501:eeee5555";
    replacement.created_at = "2026-05-01T12:03:00Z";
    replacement.relations = [{ target_id: claim.id, rel: "supersedes" }];
    const rows = load([source, claim, replacement]);

    const active = queryRows(rows, { kind: "claim", collection: "test" });
    const history = queryRows(rows, { kind: "claim", collection: "test", includeHistory: true });

    expect(active.map((row) => row.id)).toEqual([replacement.id]);
    expect(history.map((row) => row.id)).toEqual([claim.id, replacement.id]);
  });
});

function load(rows: Array<SourceRow | ClaimRow | SynthesisRow>): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}
