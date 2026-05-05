import { describe, expect, test } from "bun:test";
import {
  validateLedger,
  type EntryRow,
  type ClaimRow,
  type KnbRow,
  type LoadedRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";
import { executeQuery } from "../src/core/query";
import { buildEffectiveState } from "../src/core/state";

const source: SourceRow = {
  schema_version: "knb.v1",
  id: "src:test:20260501:aaaa1111",
  kind: "source",
  created_at: "2026-05-01T12:00:00Z",
  created_by: "agent:test",
  scope: { profiles: ["test"], subjects: ["Example"] },
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
  schema_version: "knb.v1",
  id: "claim:test:20260501:bbbb2222",
  kind: "claim",
  created_at: "2026-05-01T12:01:00Z",
  created_by: "agent:test",
  scope: { profiles: ["test"], subjects: ["Example"], tags: ["fact"] },
  identity: {
    claim_key: "example|has|source",
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
  schema_version: "knb.v1",
  id: "synth:test:20260501:cccc3333",
  kind: "synthesis",
  created_at: "2026-05-01T12:02:00Z",
  created_by: "agent:test",
  scope: { profiles: ["test"], subjects: ["Example"] },
  synthesis: {
    title: "Example has sourced knowledge",
    summary: "knb can preserve a sourced claim and render it later.",
    basis: {
      claim_ids: [claim.id],
      source_ids: [source.id],
    },
    status: "active",
  },
};

describe("validateLedger.happyPath", () => {
  test("accepts valid source, claim, and synthesis rows with no issues", () => {
    const rows = load([source, claim, synthesis]);
    const result = validateLedger(rows);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("validates again after deep clone (no aliasing required)", () => {
    const rows = load([structuredClone(source), structuredClone(claim), structuredClone(synthesis)]);
    const result = validateLedger(rows);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("validateLedger does not mutate input rows", () => {
    const original = JSON.stringify([source, claim, synthesis]);
    validateLedger(load([source, claim, synthesis]));
    expect(JSON.stringify([source, claim, synthesis])).toBe(original);
  });
});

describe("validateLedger.evidenceResolution", () => {
  test("rejects unresolved evidence source IDs with exact code and message text", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4444";
    badClaim.provenance.evidence = [{ source_id: "src:missing", role: "supports", summary: "Missing." }];
    const result = validateLedger(load([source, badClaim]));
    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.code === "evidence_source_unresolved");
    expect(issue).toBeDefined();
    expect(issue?.message).toContain("Unresolved evidence source_id");
    expect(issue?.message).toContain("src:missing");
    expect(issue?.id).toBe(badClaim.id);
    expect(issue?.path).toBe("provenance.evidence.source_id");
  });

  test("rejects unresolved provenance.source_ids separately from evidence", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4445";
    badClaim.provenance.source_ids = ["src:not-here"];
    const result = validateLedger(load([source, badClaim]));
    expect(result.ok).toBe(false);
    const issue = result.issues.find(
      (i) => i.code === "evidence_source_unresolved" && i.path === "provenance.source_ids",
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toContain("Unresolved provenance source_id");
  });

  test("reports every unresolved id when multiple are present, not just the first", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4446";
    badClaim.provenance.evidence = [
      { source_id: "src:missing-a", role: "supports", summary: "a" },
      { source_id: "src:missing-b", role: "supports", summary: "b" },
      { source_id: source.id, role: "supports", summary: "ok" },
    ];
    const result = validateLedger(load([source, badClaim]));
    expect(result.ok).toBe(false);
    const unresolved = result.issues.filter((i) => i.code === "evidence_source_unresolved");
    expect(unresolved).toHaveLength(2);
    expect(unresolved.some((i) => i.message.includes("src:missing-a"))).toBe(true);
    expect(unresolved.some((i) => i.message.includes("src:missing-b"))).toBe(true);
  });

  test("does not flag resolution when source row is missing source kind tag (defensive)", () => {
    // sourceIds is built from rows whose kind === "source" — confirm a non-source row
    // with the source's id does NOT satisfy reference resolution
    const fakeSource = structuredClone(claim);
    fakeSource.id = "src:fake-but-claim";
    fakeSource.kind = "claim";
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4447";
    badClaim.provenance.evidence = [
      { source_id: "src:fake-but-claim", role: "supports", summary: "ok" },
    ];
    const result = validateLedger(load([fakeSource, badClaim]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "evidence_source_unresolved")).toBe(true);
  });
});

describe("validateLedger.lifecycleHistory", () => {
  test("query hides rows targeted by entry supersede unless history is requested", () => {
    const replacement = structuredClone(claim);
    replacement.id = "claim:test:20260501:eeee5555";
    replacement.created_at = "2026-05-01T12:03:00Z";
    const entry: EntryRow = {
      schema_version: "knb.v1",
      id: "ent:test:20260501:ffff6666",
      kind: "entry",
      created_at: "2026-05-01T12:04:00Z",
      created_by: "agent:test",
      scope: { profiles: ["test"], subjects: ["Example"] },
      entry: {
        action: "supersede",
        target_ids: [claim.id],
        replacement_id: replacement.id,
        reason: "The replacement states the claim more precisely.",
      },
    };
    const rows = load([source, claim, replacement, entry]);

    const validation = validateLedger(rows);
    expect(validation.ok).toBe(true);
    expect(validation.issues).toEqual([]);

    const state = buildEffectiveState(rows);

    const active = executeQuery(state, { kinds: ["claim"], profile: "test" });
    const history = executeQuery(state, { kinds: ["claim"], profile: "test", includeHistory: true });

    expect(active.rows.map((row) => row.id)).toEqual([replacement.id]);
    expect([...history.rows.map((row) => row.id)].sort()).toEqual([claim.id, replacement.id]);
  });
});

describe("validateLedger.linkSemantics", () => {
  test("rejects lifecycle terms in semantic links with link_kind_invalid", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:gggg7777";
    badClaim.links = [{ target_id: claim.id, rel: "supersedes" as never }];

    const result = validateLedger(load([source, claim, badClaim]));

    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.code === "link_kind_invalid");
    expect(issue).toBeDefined();
    expect(issue?.message).toContain("link.rel must be one of");
    expect(issue?.message).toContain("supports");
    expect(issue?.message).toContain("contradicts");
    expect(issue?.message).toContain("depends_on");
    expect(issue?.message).toContain("context_for");
    expect(issue?.id).toBe(badClaim.id);
  });

  test("rejects retracts as link rel (lifecycle leak)", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:gggg7778";
    badClaim.links = [{ target_id: claim.id, rel: "retracts" as never }];
    const result = validateLedger(load([source, claim, badClaim]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "link_kind_invalid")).toBe(true);
  });

  test("rejects merges as link rel (lifecycle leak)", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:gggg7779";
    badClaim.links = [{ target_id: claim.id, rel: "merges" as never }];
    const result = validateLedger(load([source, claim, badClaim]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "link_kind_invalid")).toBe(true);
  });

  test("accepts each of the four valid semantic link kinds", () => {
    for (const rel of ["supports", "contradicts", "depends_on", "context_for"] as const) {
      const r = structuredClone(claim);
      r.id = `claim:test:20260501:rel${rel.slice(0, 5).padEnd(5, "x")}`;
      r.links = [{ target_id: claim.id, rel }];
      const result = validateLedger(load([source, claim, r]));
      expect(result.ok).toBe(true);
    }
  });
});

describe("validateLedger.lineNumbers", () => {
  test("issues carry the LoadedRow.line value (not array index) so line numbers are stable across slices", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:linenumb";
    badClaim.provenance.evidence = [{ source_id: "src:missing", role: "supports", summary: "x" }];
    const result = validateLedger([
      { row: source, line: 100 },
      { row: badClaim, line: 200 },
    ]);
    expect(result.ok).toBe(false);
    const issue = result.issues.find((i) => i.code === "evidence_source_unresolved");
    expect(issue?.line).toBe(200);
  });
});

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}
