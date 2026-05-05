import { describe, expect, test } from "bun:test";
import {
  buildEffectiveState,
  type EffectiveLink,
} from "../src/core/state";
import type {
  EntryRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

function makeSource(id: string, overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { profiles: ["test"], subjects: ["Example"] },
    source: { type: "web_page", title: "Example", uri: `https://example.com/${id}` },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
    ...overrides,
  };
}

function makeClaim(id: string, sourceId: string, overrides: Partial<ClaimRow> = {}): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: { profiles: ["test"], subjects: ["Example"], tags: ["fact"] },
    identity: { claim_key: `key|${id}` },
    claim: { statement: `Statement ${id}.`, atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Supports." }],
    },
    assessment: { confidence: "high" },
    ...overrides,
  };
}

function makeQuestion(id: string, status: "open" | "resolved" | "archived" = "open"): QuestionRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "question",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { profiles: ["test"] },
    question: { text: "Why?", status },
  };
}

function makeSynthesis(
  id: string,
  basisClaimIds: string[],
  status: "active" | "archived" = "active",
): SynthesisRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "synthesis",
    created_at: "2026-05-01T12:03:00Z",
    created_by: "agent:test",
    scope: { profiles: ["test"] },
    synthesis: {
      title: "Synthesis",
      summary: "Summary.",
      basis: { claim_ids: basisClaimIds },
      status,
    },
  };
}

function makeEntry(
  id: string,
  entry: EntryRow["entry"],
  createdAt = "2026-05-01T13:00:00Z",
): EntryRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "entry",
    created_at: createdAt,
    created_by: "agent:test",
    scope: { profiles: ["test"] },
    entry,
  };
}

describe("buildEffectiveState - basics", () => {
  test("empty input yields empty state", () => {
    const state = buildEffectiveState([]);
    expect(state.rows()).toEqual([]);
    expect(state.warnings).toEqual([]);
    expect(state.linkGraph().all()).toEqual([]);
  });

  test("single source/claim/synthesis are all active", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const synthesis = makeSynthesis("synth:test:20260501:cccc3333", [claim.id]);
    const state = buildEffectiveState(load([source, claim, synthesis]));
    const ids = state.rows().map((er) => er.row.id);
    expect(ids).toEqual([source.id, claim.id, synthesis.id]);
    for (const er of state.rows()) expect(er.status).toBe("active");
  });
});

describe("buildEffectiveState - asOf", () => {
  test("filters rows by created_at before applying lifecycle entries", () => {
    const source = makeSource("src:test:20260501:aaaa1111", {
      created_at: "2026-05-01T00:00:00Z",
    });
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      created_at: "2026-05-01T01:00:00Z",
    });
    const retract = makeEntry(
      "ent:test:20260501:cccc3333",
      {
        action: "retract",
        target_ids: [claim.id],
        reason: "Bad data",
      },
      "2026-05-01T02:00:00Z",
    );
    const question = makeQuestion("q:test:20260501:dddd4444");
    question.created_at = "2026-05-01T03:00:00Z";

    const rows = load([source, claim, retract, question]);

    const t0 = buildEffectiveState(rows, { asOf: "2026-05-01T00:30:00Z" });
    expect(t0.rows({ includeEntries: true }).map((er) => er.row.id)).toEqual([source.id]);
    expect(t0.statusOf(claim.id)).toBeUndefined();

    const t1 = buildEffectiveState(rows, { asOf: "2026-05-01T01:30:00Z" });
    expect(t1.rows({ includeEntries: true }).map((er) => er.row.id)).toEqual([source.id, claim.id]);
    expect(t1.statusOf(claim.id)).toBe("active");

    const t2 = buildEffectiveState(rows, { asOf: "2026-05-01T02:30:00Z" });
    expect(t2.rows({ includeEntries: true }).map((er) => er.row.id)).toEqual([source.id, retract.id]);
    expect(t2.statusOf(claim.id)).toBe("retracted");
    expect(t2.get(claim.id, { includeHistory: true })?.by_entry_id).toBe(retract.id);

    const t3 = buildEffectiveState(rows, { asOf: "2026-05-01T03:30:00Z" });
    expect(t3.rows({ includeEntries: true }).map((er) => er.row.id)).toEqual([
      source.id,
      retract.id,
      question.id,
    ]);
    expect(t3.statusOf(question.id)).toBe("active");
  });

  test("throws invalid_arguments for invalid asOf timestamps", () => {
    let caught: unknown;
    try {
      buildEffectiveState([], { asOf: "not-a-timestamp" });
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    if (isKnbError(caught)) {
      expect(caught.code).toBe("invalid_arguments");
      expect(caught.message).toContain("Invalid asOf timestamp");
    }
  });
});

describe("buildEffectiveState - intrinsic archived", () => {
  test("question with status=archived projects to archived", () => {
    const q = makeQuestion("q:test:20260501:qqqq1111", "archived");
    const state = buildEffectiveState(load([q]));
    expect(state.statusOf(q.id)).toBe("archived");
    const er = state.get(q.id, { includeHistory: true });
    expect(er?.intrinsic_archived).toBe(true);
    expect(state.rows()).toEqual([]);
    expect(state.rows({ status: "archived" }).length).toBe(1);
  });

  test("synthesis with status=archived projects to archived", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const synthesis = makeSynthesis("synth:test:20260501:dddd4444", [claim.id], "archived");
    const state = buildEffectiveState(load([source, claim, synthesis]));
    expect(state.statusOf(synthesis.id)).toBe("archived");
    const er = state.get(synthesis.id, { includeHistory: true });
    expect(er?.intrinsic_archived).toBe(true);
  });
});

describe("buildEffectiveState - retract", () => {
  test("retract marks target retracted with by_entry_id and reason", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "Bad data",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    expect(state.statusOf(claim.id)).toBe("retracted");
    const er = state.get(claim.id, { includeHistory: true });
    expect(er?.status).toBe("retracted");
    expect(er?.by_entry_id).toBe(entry.id);
    expect(er?.reason).toBe("retracted: Bad data");
  });

  test("retract with missing target raises entry_target_missing", () => {
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: ["claim:does:not:exist"],
      reason: "x",
    });
    const state = buildEffectiveState(load([entry]));
    expect(state.warnings.length).toBe(1);
    expect(state.warnings[0]?.code).toBe("entry_target_missing");
  });

  test("retract on already-retracted target raises entry_target_inactive", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry1 = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "first",
    });
    const entry2 = makeEntry("ent:test:20260501:cccc4444", {
      action: "retract",
      target_ids: [claim.id],
      reason: "second",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, claim, entry1, entry2]));
    expect(state.statusOf(claim.id)).toBe("retracted");
    expect(state.get(claim.id, { includeHistory: true })?.reason).toBe("retracted: first");
    expect(state.warnings.some((w) => w.code === "entry_target_inactive")).toBe(true);
  });
});

describe("buildEffectiveState - supersede", () => {
  test("supersede marks target superseded with replacement reason", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const entry = makeEntry("ent:test:20260501:ffff6666", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: replacement.id,
      reason: "improved",
    });
    const state = buildEffectiveState(load([source, claim, replacement, entry]));
    expect(state.statusOf(claim.id)).toBe("superseded");
    const er = state.get(claim.id, { includeHistory: true });
    expect(er?.reason).toContain(replacement.id);
    expect(state.statusOf(replacement.id)).toBe("active");
  });

  test("supersede with inactive replacement raises supersede_replacement_inactive", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const b = makeClaim("claim:test:20260501:bbbb3333", source.id);
    const c = makeClaim("claim:test:20260501:cccc4444", source.id);
    const retractB = makeEntry("ent:test:20260501:rrrr5555", {
      action: "retract",
      target_ids: [b.id],
      reason: "remove first",
    });
    const supersedeAwithB = makeEntry("ent:test:20260501:ssss6666", {
      action: "supersede",
      target_ids: [a.id],
      replacement_id: b.id,
      reason: "trying to use a retracted replacement",
    }, "2026-05-01T13:02:00Z");
    const state = buildEffectiveState(load([source, a, b, c, retractB, supersedeAwithB]));
    expect(state.warnings.some((w) => w.code === "supersede_replacement_inactive")).toBe(true);
    expect(state.statusOf(b.id)).toBe("retracted");
    expect(state.statusOf(a.id)).toBe("superseded");
  });
});

describe("buildEffectiveState - merge", () => {
  test("merge marks targets duplicate with canonical reason", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const b = makeClaim("claim:test:20260501:bbbb3333", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const merge = makeEntry("ent:test:20260501:mmmm5555", {
      action: "merge",
      target_ids: [a.id, b.id],
      canonical_id: canonical.id,
      reason: "same fact",
    });
    const state = buildEffectiveState(load([source, a, b, canonical, merge]));
    expect(state.statusOf(a.id)).toBe("duplicate");
    expect(state.statusOf(b.id)).toBe("duplicate");
    expect(state.statusOf(canonical.id)).toBe("active");
    const er = state.get(a.id, { includeHistory: true });
    expect(er?.reason).toContain(canonical.id);
  });

  test("canonicalIdOf resolves merge targets through canonical chains", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const b = makeClaim("claim:test:20260501:bbbb3333", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const mergeAtoB = makeEntry("ent:test:20260501:mmmm5555", {
      action: "merge",
      target_ids: [a.id],
      canonical_id: b.id,
      reason: "same fact",
    });
    const mergeBtoCanonical = makeEntry("ent:test:20260501:mmmm6666", {
      action: "merge",
      target_ids: [b.id],
      canonical_id: canonical.id,
      reason: "better canonical",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, a, b, canonical, mergeAtoB, mergeBtoCanonical]));
    expect(state.canonicalIdOf(a.id)).toBe(canonical.id);
    expect(state.canonicalIdOf(b.id)).toBe(canonical.id);
    expect(state.canonicalIdOf(canonical.id)).toBe(canonical.id);
    expect(state.canonicalIdOf("claim:test:20260501:unknown1")).toBe("claim:test:20260501:unknown1");
  });

  test("merge with inactive canonical raises merge_canonical_inactive", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const retractCanonical = makeEntry("ent:test:20260501:rrrr5555", {
      action: "retract",
      target_ids: [canonical.id],
      reason: "remove canonical",
    });
    const merge = makeEntry("ent:test:20260501:mmmm6666", {
      action: "merge",
      target_ids: [a.id],
      canonical_id: canonical.id,
      reason: "merging into a retracted canonical",
    }, "2026-05-01T13:02:00Z");
    const state = buildEffectiveState(load([source, a, canonical, retractCanonical, merge]));
    expect(state.warnings.some((w) => w.code === "merge_canonical_inactive")).toBe(true);
  });
});

describe("buildEffectiveState - link", () => {
  test("entry link adds edge with source=entry_link; outgoing/incoming find it", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const link = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: claim.id, to_id: source.id, rel: "supports" },
    });
    const state = buildEffectiveState(load([source, claim, link]));
    const all = state.linkGraph().all();
    expect(all.length).toBe(1);
    const edge = all[0] as EffectiveLink;
    expect(edge.source).toBe("entry_link");
    expect(edge.by_entry_id).toBe(link.id);
    expect(state.linkGraph().outgoing(claim.id).length).toBe(1);
    expect(state.linkGraph().incoming(source.id).length).toBe(1);
    expect(state.statusOf(claim.id)).toBe("active");
    expect(state.statusOf(source.id)).toBe("active");
  });

  test("link with missing endpoint raises link_endpoint_missing", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const link = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: "claim:missing", to_id: source.id, rel: "supports" },
    });
    const state = buildEffectiveState(load([source, link]));
    expect(state.warnings.some((w) => w.code === "link_endpoint_missing")).toBe(true);
    expect(state.linkGraph().all().length).toBe(0);
  });
});

describe("buildEffectiveState - inline links", () => {
  test("inline row.links[] appear as row_links edges", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: "src:test:20260501:aaaa1111", rel: "supports" }],
    });
    const state = buildEffectiveState(load([source, claim]));
    const all = state.linkGraph().all();
    expect(all.length).toBe(1);
    expect(all[0]?.source).toBe("row_links");
    expect(all[0]?.from_id).toBe(claim.id);
    expect(all[0]?.to_id).toBe(source.id);
  });

  test("inline link with missing target raises link_endpoint_missing", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: "src:bogus", rel: "supports" }],
    });
    const state = buildEffectiveState(load([source, claim]));
    expect(state.warnings.some((w) => w.code === "link_endpoint_missing")).toBe(true);
    expect(state.linkGraph().all().length).toBe(0);
  });
});

describe("buildEffectiveState - patch", () => {
  test("patch does not mutate target row content; explain.patch_audit has the entry", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const originalStatement = claim.claim.statement;
    const patch = makeEntry("ent:test:20260501:pppp3333", {
      action: "patch",
      target_id: claim.id,
      patch: [{ op: "replace", path: "/claim/statement", value: "rewritten" }],
      reason: "typo fix",
    });
    const state = buildEffectiveState(load([source, claim, patch]));
    const er = state.get(claim.id);
    expect((er?.row as ClaimRow).claim.statement).toBe(originalStatement);
    expect(state.statusOf(claim.id)).toBe("active");
    const explanation = state.explain(claim.id);
    expect(explanation?.patch_audit.length).toBe(1);
    expect(explanation?.patch_audit[0]?.entry_id).toBe(patch.id);
    expect(explanation?.patch_audit[0]?.reason).toBe("typo fix");
    expect(explanation?.history.some((h) => h.action === "patch")).toBe(true);
  });

  test("patch with missing target raises patch_target_missing", () => {
    const patch = makeEntry("ent:test:20260501:pppp3333", {
      action: "patch",
      target_id: "claim:missing",
      patch: [{ op: "replace", path: "/x", value: 1 }],
      reason: "x",
    });
    const state = buildEffectiveState(load([patch]));
    expect(state.warnings.some((w) => w.code === "patch_target_missing")).toBe(true);
  });
});

describe("buildEffectiveState - rows() filters", () => {
  test("rows() default hides entry rows", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const ids = state.rows().map((er) => er.row.id);
    expect(ids).toEqual([source.id]);
  });

  test("rows({ includeEntries: true }) includes entry rows", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const ids = state.rows({ includeEntries: true }).map((er) => er.row.id);
    expect(ids).toContain(entry.id);
  });

  test('rows({ kinds: ["entry"] }) returns entry rows', () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const ids = state.rows({ kinds: ["entry"] }).map((er) => er.row.id);
    expect(ids).toEqual([entry.id]);
  });

  test("rows({ profile }) filters by scope.profiles", () => {
    const source = makeSource("src:test:20260501:aaaa1111", {
      scope: { profiles: ["x"] },
    });
    const otherSource = makeSource("src:test:20260501:zzzz9999", {
      scope: { profiles: ["y"] },
    });
    const state = buildEffectiveState(load([source, otherSource]));
    const ids = state.rows({ profile: "x" }).map((er) => er.row.id);
    expect(ids).toEqual([source.id]);
  });

  test("rows({ status: 'retracted' }) returns inactive rows of that status", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const ids = state.rows({ status: "retracted" }).map((er) => er.row.id);
    expect(ids).toEqual([claim.id]);
  });
});

describe("buildEffectiveState - get/statusOf", () => {
  test("get(id) returns active row; get(retractedId) is undefined; with includeHistory returns it", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    expect(state.get(source.id)?.row.id).toBe(source.id);
    expect(state.get(claim.id)).toBeUndefined();
    const withHistory = state.get(claim.id, { includeHistory: true });
    expect(withHistory?.row.id).toBe(claim.id);
    expect(withHistory?.status).toBe("retracted");
  });

  test("statusOf(unknown) returns undefined", () => {
    const state = buildEffectiveState([]);
    expect(state.statusOf("missing")).toBeUndefined();
  });
});

describe("buildEffectiveState - explain", () => {
  test("explain(retractedId).history contains the retraction entry", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "bad",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const explanation = state.explain(claim.id);
    expect(explanation?.status).toBe("retracted");
    expect(explanation?.history.length).toBe(1);
    expect(explanation?.history[0]?.action).toBe("retract");
    expect(explanation?.history[0]?.entry_id).toBe(entry.id);
    expect(explanation?.history[0]?.reason).toBe("bad");
  });

  test("explain(supersededId).history contains supersede entry with replacement_id", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const entry = makeEntry("ent:test:20260501:ffff6666", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: replacement.id,
      reason: "improved",
    });
    const state = buildEffectiveState(load([source, claim, replacement, entry]));
    const explanation = state.explain(claim.id);
    expect(explanation?.history[0]?.action).toBe("supersede");
    expect(explanation?.history[0]?.replacement_id).toBe(replacement.id);
  });
});

describe("buildEffectiveState - ledger order stability", () => {
  test("same input produces same row order", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const synthesis = makeSynthesis("synth:test:20260501:cccc3333", [claim.id]);
    const inputA = load([source, claim, synthesis]);
    const inputB = load([source, claim, synthesis]);
    const a = buildEffectiveState(inputA).rows().map((er) => er.row.id);
    const b = buildEffectiveState(inputB).rows().map((er) => er.row.id);
    expect(a).toEqual(b);
    expect(a).toEqual([source.id, claim.id, synthesis.id]);
  });

  test("rows() reflects ledger order even when alphabetical id order differs", () => {
    const source = makeSource("src:test:20260501:zzzz9999");
    const claim1 = makeClaim("claim:test:20260501:aaaa1111", source.id);
    const claim2 = makeClaim("claim:test:20260501:mmmm5555", source.id);
    const claim3 = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const state = buildEffectiveState(load([source, claim1, claim2, claim3]));
    const ids = state.rows().map((er) => er.row.id);
    expect(ids).toEqual([source.id, claim1.id, claim2.id, claim3.id]);
    expect(ids).not.toEqual([...ids].sort());
  });
});

describe("buildEffectiveState - link graph (bd-3p9.1.2)", () => {
  test("outgoing(claimId) returns edges where from_id === claimId", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const otherSource = makeSource("src:test:20260501:zzzz9999");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: "src:test:20260501:zzzz9999", rel: "supports" }],
    });
    const link = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: claim.id, to_id: source.id, rel: "context_for" },
    });
    const state = buildEffectiveState(load([source, otherSource, claim, link]));
    const outgoing = state.linkGraph().outgoing(claim.id);
    expect(outgoing.length).toBe(2);
    const sources = new Set(outgoing.map((e) => e.source));
    expect(sources.has("row_links")).toBe(true);
    expect(sources.has("entry_link")).toBe(true);
  });

  test("incoming(targetId) returns edges where to_id === targetId", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: "src:test:20260501:aaaa1111", rel: "supports" }],
    });
    const otherClaim = makeClaim("claim:test:20260501:cccc4444", source.id);
    const link = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: otherClaim.id, to_id: source.id, rel: "context_for" },
    });
    const state = buildEffectiveState(load([source, claim, otherClaim, link]));
    const incoming = state.linkGraph().incoming(source.id);
    expect(incoming.length).toBe(2);
    expect(incoming.every((e) => e.to_id === source.id)).toBe(true);
  });

  test("outgoing(unknown) and incoming(unknown) return empty arrays without throwing", () => {
    const state = buildEffectiveState([]);
    expect(state.linkGraph().outgoing("nope")).toEqual([]);
    expect(state.linkGraph().incoming("nope")).toEqual([]);
    expect(state.linkGraph().all()).toEqual([]);
  });

  test("linkGraph().all() returns row_links edges before entry_link edges", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const otherSource = makeSource("src:test:20260501:zzzz9999");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: source.id, rel: "supports" }],
    });
    const link = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: claim.id, to_id: otherSource.id, rel: "context_for" },
    });
    const state = buildEffectiveState(load([source, otherSource, claim, link]));
    const all = state.linkGraph().all();
    expect(all.length).toBe(2);
    expect(all[0]?.source).toBe("row_links");
    expect(all[1]?.source).toBe("entry_link");
  });

  test("all() returns a fresh array (mutation does not leak into next call)", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: source.id, rel: "supports" }],
    });
    const state = buildEffectiveState(load([source, claim]));
    const a = state.linkGraph().all();
    a.length = 0;
    const b = state.linkGraph().all();
    expect(b.length).toBe(1);
  });
});

describe("buildEffectiveState - lifecycle interactions (first wins)", () => {
  test("retract then supersede same row: status remains retracted; both entries in history", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const retract = makeEntry("ent:test:20260501:rrrr3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "wrong",
    });
    const supersede = makeEntry("ent:test:20260501:ssss4444", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: replacement.id,
      reason: "tried later",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, claim, replacement, retract, supersede]));
    expect(state.statusOf(claim.id)).toBe("retracted");
    const er = state.get(claim.id, { includeHistory: true });
    expect(er?.by_entry_id).toBe(retract.id);
    expect(er?.reason).toBe("retracted: wrong");
    const explanation = state.explain(claim.id)!;
    expect(explanation.history.length).toBe(2);
    expect(explanation.history[0]?.action).toBe("retract");
    expect(explanation.history[0]?.entry_id).toBe(retract.id);
    expect(explanation.history[1]?.action).toBe("supersede");
    expect(explanation.history[1]?.entry_id).toBe(supersede.id);
    expect(explanation.history[1]?.replacement_id).toBe(replacement.id);
    expect(state.warnings.some((w) => w.code === "entry_target_inactive" && w.entry_id === supersede.id)).toBe(true);
  });

  test("supersede then retract same row: status remains superseded; both entries in history", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const supersede = makeEntry("ent:test:20260501:ssss3333", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: replacement.id,
      reason: "first",
    });
    const retract = makeEntry("ent:test:20260501:rrrr4444", {
      action: "retract",
      target_ids: [claim.id],
      reason: "second",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, claim, replacement, supersede, retract]));
    expect(state.statusOf(claim.id)).toBe("superseded");
    const er = state.get(claim.id, { includeHistory: true });
    expect(er?.by_entry_id).toBe(supersede.id);
    expect(er?.reason).toContain(replacement.id);
    const explanation = state.explain(claim.id)!;
    expect(explanation.history.length).toBe(2);
    expect(explanation.history[0]?.action).toBe("supersede");
    expect(explanation.history[1]?.action).toBe("retract");
    expect(explanation.history[1]?.reason).toBe("second");
    const inactiveWarn = state.warnings.find((w) => w.code === "entry_target_inactive");
    expect(inactiveWarn?.entry_id).toBe(retract.id);
    expect(inactiveWarn?.target_id).toBe(claim.id);
    expect(inactiveWarn?.line).toBe(5);
  });

  test("three entries targeting the same row: only first wins, two redundant warnings", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc6666", source.id);
    const c1 = makeEntry("ent:test:20260501:1111aaaa", {
      action: "retract",
      target_ids: [claim.id],
      reason: "first",
    });
    const c2 = makeEntry("ent:test:20260501:2222bbbb", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: replacement.id,
      reason: "second",
    }, "2026-05-01T13:01:00Z");
    const c3 = makeEntry("ent:test:20260501:3333cccc", {
      action: "merge",
      target_ids: [claim.id],
      canonical_id: canonical.id,
      reason: "third",
    }, "2026-05-01T13:02:00Z");
    const state = buildEffectiveState(load([source, claim, replacement, canonical, c1, c2, c3]));
    expect(state.statusOf(claim.id)).toBe("retracted");
    const explanation = state.explain(claim.id)!;
    expect(explanation.history.length).toBe(3);
    expect(explanation.history.map((h) => h.action)).toEqual(["retract", "supersede", "merge"]);
    const inactiveWarnings = state.warnings.filter((w) => w.code === "entry_target_inactive");
    expect(inactiveWarnings.length).toBe(2);
    expect(inactiveWarnings.map((w) => w.entry_id).sort()).toEqual([c2.id, c3.id].sort());
  });

  test("merge then link same row: link fires; warning identifies inactive endpoint", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const merge = makeEntry("ent:test:20260501:mmmm5555", {
      action: "merge",
      target_ids: [a.id],
      canonical_id: canonical.id,
      reason: "merge",
    });
    const link = makeEntry("ent:test:20260501:rrrr6666", {
      action: "link",
      link: { from_id: a.id, to_id: canonical.id, rel: "supports" },
    }, "2026-05-01T13:02:00Z");
    const state = buildEffectiveState(load([source, a, canonical, merge, link]));
    expect(state.statusOf(a.id)).toBe("duplicate");
    expect(state.statusOf(canonical.id)).toBe("active");
    const edges = state.linkGraph().all();
    expect(edges.length).toBe(1);
    expect(edges[0]?.from_id).toBe(a.id);
    expect(edges[0]?.to_id).toBe(canonical.id);
    expect(edges[0]?.source).toBe("entry_link");
  });

  test("patch on a previously retracted row: patch_audit still records but no row mutation", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const retract = makeEntry("ent:test:20260501:rrrr3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "out",
    });
    const patch = makeEntry("ent:test:20260501:pppp4444", {
      action: "patch",
      target_id: claim.id,
      patch: [{ op: "replace", path: "/claim/statement", value: "later" }],
      reason: "audit-only fix",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, claim, retract, patch]));
    expect(state.statusOf(claim.id)).toBe("retracted");
    const explanation = state.explain(claim.id)!;
    expect(explanation.patch_audit.length).toBe(1);
    expect(explanation.patch_audit[0]?.entry_id).toBe(patch.id);
    expect(explanation.patch_audit[0]?.reason).toBe("audit-only fix");
    expect(explanation.history.some((h) => h.action === "patch" && h.entry_id === patch.id)).toBe(true);
  });
});

describe("buildEffectiveState - degenerate entry shapes", () => {
  test("supersede with target_id === replacement_id: target becomes superseded; replacement_inactive warning fires", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "supersede",
      target_ids: [claim.id],
      replacement_id: claim.id,
      reason: "self",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    expect(state.statusOf(claim.id)).toBe("superseded");
    expect(state.warnings.some((w) => w.code === "supersede_replacement_inactive" && w.target_id === claim.id)).toBe(true);
  });

  test("merge where canonical is also in target_ids: canonical becomes duplicate; merge_canonical_inactive warning fires", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const entry = makeEntry("ent:test:20260501:mmmm5555", {
      action: "merge",
      target_ids: [a.id, canonical.id],
      canonical_id: canonical.id,
      reason: "self-merge",
    });
    const state = buildEffectiveState(load([source, a, canonical, entry]));
    expect(state.statusOf(a.id)).toBe("duplicate");
    expect(state.statusOf(canonical.id)).toBe("duplicate");
    expect(state.warnings.some((w) => w.code === "merge_canonical_inactive")).toBe(true);
  });

  test("link with from_id === to_id (self-loop) creates a self-edge without warning", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: claim.id, to_id: claim.id, rel: "supports" },
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const edges = state.linkGraph().all();
    expect(edges.length).toBe(1);
    expect(edges[0]?.from_id).toBe(claim.id);
    expect(edges[0]?.to_id).toBe(claim.id);
    expect(state.warnings).toEqual([]);
  });

  test("retract with empty target_ids array does not crash and produces no warnings", () => {
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [],
      reason: "empty",
    });
    const state = buildEffectiveState(load([entry]));
    expect(state.warnings).toEqual([]);
    expect(state.rows({ includeEntries: true }).map((er) => er.row.id)).toEqual([entry.id]);
  });

  test("retract with missing target_ids field does not crash", () => {
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      reason: "no targets",
    } as EntryRow["entry"]);
    const state = buildEffectiveState(load([entry]));
    expect(state.warnings).toEqual([]);
  });

  test("patch with empty patch array does not crash; audit entry still recorded with empty summary", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:pppp3333", {
      action: "patch",
      target_id: claim.id,
      patch: [],
      reason: "empty patch",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const explanation = state.explain(claim.id)!;
    expect(explanation.patch_audit.length).toBe(1);
    expect(explanation.patch_audit[0]?.patch).toEqual([]);
    const patchHistory = explanation.history.find((h) => h.action === "patch");
    expect(patchHistory?.patch_summary).toBe("(empty patch)");
  });
});

describe("buildEffectiveState - link type coverage", () => {
  test("each LinkType (supports, contradicts, depends_on, context_for) round-trips through entry-link", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const rels: Array<EffectiveLink["rel"]> = ["supports", "contradicts", "depends_on", "context_for"];
    for (const rel of rels) {
      const entry = makeEntry(`ent:test:20260501:${rel.padEnd(8, "x").slice(0, 8)}`, {
        action: "link",
        link: { from_id: claim.id, to_id: source.id, rel, strength: "high", rationale: `because ${rel}` },
      });
      const state = buildEffectiveState(load([source, claim, entry]));
      const all = state.linkGraph().all();
      expect(all.length).toBe(1);
      expect(all[0]?.rel).toBe(rel);
      expect(all[0]?.strength).toBe("high");
      expect(all[0]?.rationale).toBe(`because ${rel}`);
    }
  });
});

describe("buildEffectiveState - inline links expanded", () => {
  test("a row with multiple inline links to multiple targets produces N edges", () => {
    const sourceA = makeSource("src:test:20260501:aaaa1111");
    const sourceB = makeSource("src:test:20260501:bbbb2222");
    const sourceC = makeSource("src:test:20260501:cccc3333");
    const claim = makeClaim("claim:test:20260501:dddd4444", sourceA.id, {
      links: [
        { target_id: sourceA.id, rel: "supports" },
        { target_id: sourceB.id, rel: "context_for" },
        { target_id: sourceC.id, rel: "contradicts" },
      ],
    });
    const state = buildEffectiveState(load([sourceA, sourceB, sourceC, claim]));
    const out = state.linkGraph().outgoing(claim.id);
    expect(out.length).toBe(3);
    expect(out.map((e) => e.to_id).sort()).toEqual([sourceA.id, sourceB.id, sourceC.id].sort());
    for (const edge of out) expect(edge.source).toBe("row_links");
  });

  test("two claims pointing at each other: outgoing/incoming reflect mutual edges", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id, {
      links: [{ target_id: "claim:test:20260501:bbbb3333", rel: "supports" }],
    });
    const b = makeClaim("claim:test:20260501:bbbb3333", source.id, {
      links: [{ target_id: "claim:test:20260501:aaaa2222", rel: "contradicts" }],
    });
    const state = buildEffectiveState(load([source, a, b]));
    expect(state.linkGraph().outgoing(a.id).map((e) => e.to_id)).toEqual([b.id]);
    expect(state.linkGraph().incoming(a.id).map((e) => e.from_id)).toEqual([b.id]);
    expect(state.linkGraph().outgoing(b.id).map((e) => e.to_id)).toEqual([a.id]);
    expect(state.linkGraph().incoming(b.id).map((e) => e.from_id)).toEqual([a.id]);
  });

  test("inline AND entry-link edges to the same pair coexist, distinguishable by source", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id, {
      links: [{ target_id: source.id, rel: "supports" }],
    });
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "link",
      link: { from_id: claim.id, to_id: source.id, rel: "context_for" },
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const edges = state.linkGraph().outgoing(claim.id);
    expect(edges.length).toBe(2);
    const sources = edges.map((e) => e.source).sort();
    expect(sources).toEqual(["entry_link", "row_links"]);
    const entryLinkEdge = edges.find((e) => e.source === "entry_link");
    expect(entryLinkEdge?.by_entry_id).toBe(entry.id);
    expect(entryLinkEdge?.rel).toBe("context_for");
    const rowRelEdge = edges.find((e) => e.source === "row_links");
    expect(rowRelEdge?.rel).toBe("supports");
    expect(rowRelEdge?.by_entry_id).toBeUndefined();
  });
});

describe("buildEffectiveState - filters expanded", () => {
  test('rows({ kinds: ["claim", "source"] }) returns both, no syntheses or entry rows', () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const synthesis = makeSynthesis("synth:test:20260501:cccc3333", [claim.id]);
    const entry = makeEntry("ent:test:20260501:dddd4444", {
      action: "retract",
      target_ids: [synthesis.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, synthesis, entry]));
    const ids = state.rows({ kinds: ["claim", "source"] }).map((er) => er.row.id);
    expect(ids.sort()).toEqual([source.id, claim.id].sort());
  });

  test("rows({ status: 'active', includeEntries: true }) returns active rows AND entry rows", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    const ids = state.rows({ status: "active", includeEntries: true }).map((er) => er.row.id);
    expect(ids).toContain(source.id);
    expect(ids).toContain(entry.id);
    expect(ids).not.toContain(claim.id);
  });

  test("rows({ profile, kinds }) combines correctly", () => {
    const sourceX = makeSource("src:test:20260501:aaaa1111", {
      scope: { profiles: ["x"] },
    });
    const sourceY = makeSource("src:test:20260501:bbbb2222", {
      scope: { profiles: ["y"] },
    });
    const claimX = makeClaim("claim:test:20260501:cccc3333", sourceX.id, {
      scope: { profiles: ["x"] },
    });
    const state = buildEffectiveState(load([sourceX, sourceY, claimX]));
    const ids = state.rows({ profile: "x", kinds: ["claim"] }).map((er) => er.row.id);
    expect(ids).toEqual([claimX.id]);
  });

  test("rows({ tag }) filters by scope.tags", () => {
    const source = makeSource("src:test:20260501:aaaa1111", {
      scope: { profiles: ["test"], tags: ["alpha"] },
    });
    const otherSource = makeSource("src:test:20260501:bbbb2222", {
      scope: { profiles: ["test"], tags: ["beta"] },
    });
    const state = buildEffectiveState(load([source, otherSource]));
    const ids = state.rows({ tag: "alpha" }).map((er) => er.row.id);
    expect(ids).toEqual([source.id]);
  });

  test("rows({ subject }) filters by scope.subjects", () => {
    const source = makeSource("src:test:20260501:aaaa1111", {
      scope: { profiles: ["test"], subjects: ["Alpha"] },
    });
    const otherSource = makeSource("src:test:20260501:bbbb2222", {
      scope: { profiles: ["test"], subjects: ["Beta"] },
    });
    const state = buildEffectiveState(load([source, otherSource]));
    const ids = state.rows({ subject: "Alpha" }).map((er) => er.row.id);
    expect(ids).toEqual([source.id]);
  });

  test("rows({ status: 'retracted' }) returns retracted only, NOT active", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const otherClaim = makeClaim("claim:test:20260501:cccc4444", source.id);
    const entry = makeEntry("ent:test:20260501:dddd5555", {
      action: "retract",
      target_ids: [claim.id],
      reason: "x",
    });
    const state = buildEffectiveState(load([source, claim, otherClaim, entry]));
    const ids = state.rows({ status: "retracted" }).map((er) => er.row.id);
    expect(ids).toEqual([claim.id]);
    expect(ids).not.toContain(otherClaim.id);
    expect(ids).not.toContain(source.id);
  });
});

describe("buildEffectiveState - get/explain edge cases", () => {
  test("get(unknownId) returns undefined; statusOf(unknownId) returns undefined; explain(unknownId) returns undefined", () => {
    const state = buildEffectiveState([]);
    expect(state.get("nope")).toBeUndefined();
    expect(state.get("nope", { includeHistory: true })).toBeUndefined();
    expect(state.statusOf("nope")).toBeUndefined();
    expect(state.explain("nope")).toBeUndefined();
  });

  test("statusOf returns the inactive status (not undefined) for retracted/superseded/duplicate rows", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const b = makeClaim("claim:test:20260501:bbbb3333", source.id);
    const c = makeClaim("claim:test:20260501:cccc4444", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const canonical = makeClaim("claim:test:20260501:ffff6666", source.id);
    const retract = makeEntry("ent:test:20260501:r1", { action: "retract", target_ids: [a.id], reason: "x" });
    const supersede = makeEntry("ent:test:20260501:s2", {
      action: "supersede",
      target_ids: [b.id],
      replacement_id: replacement.id,
      reason: "y",
    });
    const merge = makeEntry("ent:test:20260501:m3", {
      action: "merge",
      target_ids: [c.id],
      canonical_id: canonical.id,
      reason: "z",
    });
    const state = buildEffectiveState(load([source, a, b, c, replacement, canonical, retract, supersede, merge]));
    expect(state.statusOf(a.id)).toBe("retracted");
    expect(state.statusOf(b.id)).toBe("superseded");
    expect(state.statusOf(c.id)).toBe("duplicate");
  });

  test("explain on a never-targeted active row: history and patch_audit are empty", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const state = buildEffectiveState(load([source, claim]));
    const explanation = state.explain(claim.id)!;
    expect(explanation.id).toBe(claim.id);
    expect(explanation.status).toBe("active");
    expect(explanation.history).toEqual([]);
    expect(explanation.patch_audit).toEqual([]);
    expect(explanation.reason).toBeUndefined();
  });

  test("explain on a row that was a replacement_id: history is empty (only targets accumulate history)", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const old = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const replacement = makeClaim("claim:test:20260501:eeee5555", source.id);
    const entry = makeEntry("ent:test:20260501:ssss3333", {
      action: "supersede",
      target_ids: [old.id],
      replacement_id: replacement.id,
      reason: "x",
    });
    const state = buildEffectiveState(load([source, old, replacement, entry]));
    const explanation = state.explain(replacement.id)!;
    expect(explanation.status).toBe("active");
    expect(explanation.history).toEqual([]);
  });

  test("explain on a row that was canonical_id in a merge: history is empty", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const a = makeClaim("claim:test:20260501:aaaa2222", source.id);
    const canonical = makeClaim("claim:test:20260501:cccc4444", source.id);
    const entry = makeEntry("ent:test:20260501:mmmm5555", {
      action: "merge",
      target_ids: [a.id],
      canonical_id: canonical.id,
      reason: "x",
    });
    const state = buildEffectiveState(load([source, a, canonical, entry]));
    const explanation = state.explain(canonical.id)!;
    expect(explanation.status).toBe("active");
    expect(explanation.history).toEqual([]);
  });

  test("explain on a patched row: patch_audit lists each patch in ledger order, with patch_summary in history", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const patch1 = makeEntry("ent:test:20260501:pppp3333", {
      action: "patch",
      target_id: claim.id,
      patch: [{ op: "replace", path: "/claim/statement", value: "v2" }],
      reason: "fix1",
    });
    const patch2 = makeEntry("ent:test:20260501:pppp4444", {
      action: "patch",
      target_id: claim.id,
      patch: [{ op: "add", path: "/claim/qualifiers/note", value: "n" }],
      reason: "fix2",
    }, "2026-05-01T13:01:00Z");
    const state = buildEffectiveState(load([source, claim, patch1, patch2]));
    const explanation = state.explain(claim.id)!;
    expect(explanation.patch_audit.length).toBe(2);
    expect(explanation.patch_audit[0]?.entry_id).toBe(patch1.id);
    expect(explanation.patch_audit[1]?.entry_id).toBe(patch2.id);
    const patchEntries = explanation.history.filter((h) => h.action === "patch");
    expect(patchEntries.length).toBe(2);
    expect(patchEntries[0]?.patch_summary).toBe("replace /claim/statement");
    expect(patchEntries[1]?.patch_summary).toBe("add /claim/qualifiers/note");
  });

  test("get(retractedId) without includeHistory returns undefined; with includeHistory returns row + reason + by_entry_id", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const entry = makeEntry("ent:test:20260501:cccc3333", {
      action: "retract",
      target_ids: [claim.id],
      reason: "bad",
    });
    const state = buildEffectiveState(load([source, claim, entry]));
    expect(state.get(claim.id)).toBeUndefined();
    const er = state.get(claim.id, { includeHistory: true })!;
    expect(er.status).toBe("retracted");
    expect(er.reason).toBe("retracted: bad");
    expect(er.by_entry_id).toBe(entry.id);
  });

  test("get on intrinsic-archived synthesis: undefined by default, returned with includeHistory and intrinsic_archived flag", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const claim = makeClaim("claim:test:20260501:bbbb2222", source.id);
    const synthesis = makeSynthesis("synth:test:20260501:dddd4444", [claim.id], "archived");
    const state = buildEffectiveState(load([source, claim, synthesis]));
    expect(state.get(synthesis.id)).toBeUndefined();
    const er = state.get(synthesis.id, { includeHistory: true })!;
    expect(er.intrinsic_archived).toBe(true);
    expect(er.status).toBe("archived");
  });
});

describe("buildEffectiveState - parsing safety", () => {
  test("rows without ids are skipped silently and do not crash", () => {
    const source = makeSource("src:test:20260501:aaaa1111");
    const broken = { ...source, id: "" } as KnbRow;
    const state = buildEffectiveState(load([source, broken]));
    expect(state.rows().map((er) => er.row.id)).toEqual([source.id]);
  });

  test("duplicate ids: first wins; second is ignored", () => {
    const source1 = makeSource("src:test:20260501:aaaa1111");
    const source2 = makeSource("src:test:20260501:aaaa1111", {
      source: { type: "web_page", title: "DIFFERENT", uri: "https://different.com" },
    });
    const state = buildEffectiveState(load([source1, source2]));
    const rows = state.rows();
    expect(rows.length).toBe(1);
    expect((rows[0]?.row as SourceRow).source.title).toBe("Example");
  });

  test("link entry with from_id missing AND to_id missing emits a single link_endpoint_missing", () => {
    const entry = makeEntry("ent:test:20260501:rrrr3333", {
      action: "link",
      link: { from_id: "claim:nope1", to_id: "claim:nope2", rel: "supports" },
    });
    const state = buildEffectiveState(load([entry]));
    const missing = state.warnings.filter((w) => w.code === "link_endpoint_missing");
    expect(missing.length).toBe(1);
    expect(missing[0]?.entry_id).toBe(entry.id);
  });
});
