import { describe, expect, test } from "bun:test";
import { buildEffectiveState } from "../src/core/state";
import { executeGet, executeQuery } from "../src/core/query";
import { isKnbError } from "../src/core/errors";
import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";

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
    scope: { collections: ["alpha"], subjects: ["Alpha"] },
    source: {
      type: "web_page",
      title: "Alpha example source",
      uri: `https://example.com/${id}`,
      published_at: "2026-04-30T00:00:00Z",
    },
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
    scope: { collections: ["alpha"], subjects: ["Alpha"], tags: ["fact"] },
    identity: { claim_key: `key|${id}` },
    claim: { statement: `Statement ${id}.`, atomic: true },
    time: { precision: "unknown", valid_at: "2026-04-29T00:00:00Z" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Supports." }],
    },
    assessment: { confidence: "high" },
    ...overrides,
  };
}

function makeQuestion(id: string, overrides: Partial<QuestionRow> = {}): QuestionRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "question",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { collections: ["alpha"] },
    question: { text: "What is the answer?", status: "open" },
    ...overrides,
  };
}

function makeSynthesis(
  id: string,
  basisClaimIds: string[],
  overrides: Partial<SynthesisRow> = {},
): SynthesisRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "synthesis",
    created_at: "2026-05-01T12:03:00Z",
    created_by: "agent:test",
    scope: { collections: ["alpha"] },
    synthesis: {
      title: "Synthesis title",
      summary: "Summary text.",
      basis: { claim_ids: basisClaimIds, source_ids: [] },
      status: "active",
    },
    ...overrides,
  };
}

function makeChange(id: string, change: ChangeRow["change"], createdAt = "2026-05-01T13:00:00Z"): ChangeRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "change",
    created_at: createdAt,
    created_by: "agent:test",
    scope: { collections: ["alpha"] },
    change,
  };
}

function buildFixture(): {
  source: SourceRow;
  betaSource: SourceRow;
  claimA: ClaimRow;
  claimB: ClaimRow;
  claimSuperseded: ClaimRow;
  claimReplacement: ClaimRow;
  claimRetracted: ClaimRow;
  claimBeta: ClaimRow;
  question: QuestionRow;
  synthesis: SynthesisRow;
  supersedeChange: ChangeRow;
  retractChange: ChangeRow;
  rows: LoadedRow[];
} {
  const source = makeSource("src:alpha:20260501:aaaa1111");
  const betaSource = makeSource("src:beta:20260501:bbbb1111", {
    scope: { collections: ["beta"], subjects: ["Beta"] },
    source: { type: "web_page", title: "Beta example", uri: "https://example.com/beta" },
  });

  const claimA = makeClaim("claim:alpha:20260501:aaaa2222", source.id, {
    identity: { claim_key: "alpha|exists" },
    claim: { statement: "The example pattern shows up here.", atomic: true },
    scope: { collections: ["alpha"], subjects: ["Alpha"], tags: ["fact"] },
  });
  const claimB = makeClaim("claim:alpha:20260501:bbbb3333", source.id, {
    identity: { claim_key: "alpha|other" },
    claim: { statement: "Another claim with no special words.", atomic: true },
    scope: { collections: ["alpha"], subjects: ["Alpha"], tags: ["fact", "important"] },
  });
  const claimSuperseded = makeClaim("claim:alpha:20260501:cccc4444", source.id, {
    identity: { claim_key: "alpha|old" },
    claim: { statement: "Old claim text exact phrase.", atomic: true },
  });
  const claimReplacement = makeClaim("claim:alpha:20260501:dddd5555", source.id, {
    identity: { claim_key: "alpha|new" },
    claim: { statement: "Replacement claim.", atomic: true },
  });
  const claimRetracted = makeClaim("claim:alpha:20260501:eeee6666", source.id, {
    identity: { claim_key: "alpha|retracted" },
    claim: { statement: "Retracted claim text.", atomic: true },
  });
  const claimBeta = makeClaim("claim:beta:20260501:ffff7777", betaSource.id, {
    identity: { claim_key: "beta|fact" },
    claim: { statement: "Beta-only claim with example word.", atomic: true },
    scope: { collections: ["beta"], subjects: ["Beta"], tags: ["fact"] },
  });

  const question = makeQuestion("q:alpha:20260501:qqqq8888", {
    question: { text: "Does the example always exist?", status: "open" },
    time: { precision: "day", first_observed_at: "2026-04-28T00:00:00Z" },
  });
  const synthesis = makeSynthesis("synth:alpha:20260501:ssss9999", [claimA.id], {
    synthesis: {
      title: "Synthesis title",
      summary: "Summary mentioning example pattern.",
      basis: { claim_ids: [claimA.id], source_ids: [source.id] },
      status: "active",
    },
  });

  const supersedeChange = makeChange("chg:alpha:20260501:supr0001", {
    action: "supersede",
    target_ids: [claimSuperseded.id],
    replacement_id: claimReplacement.id,
    reason: "improved",
  }, "2026-05-01T13:00:00Z");
  const retractChange = makeChange("chg:alpha:20260501:retr0002", {
    action: "retract",
    target_ids: [claimRetracted.id],
    reason: "wrong",
  }, "2026-05-01T13:01:00Z");

  const rows = load([
    source,
    betaSource,
    claimA,
    claimB,
    claimSuperseded,
    claimReplacement,
    claimRetracted,
    claimBeta,
    question,
    synthesis,
    supersedeChange,
    retractChange,
  ]);

  return {
    source,
    betaSource,
    claimA,
    claimB,
    claimSuperseded,
    claimReplacement,
    claimRetracted,
    claimBeta,
    question,
    synthesis,
    supersedeChange,
    retractChange,
    rows,
  };
}

describe("executeQuery - filtering", () => {
  test("queries over an asOf-projected state see pre-cutoff lifecycle", () => {
    const source = makeSource("src:alpha:20260501:asof1111", {
      created_at: "2026-05-01T00:00:00Z",
    });
    const claim = makeClaim("claim:alpha:20260501:asof2222", source.id, {
      created_at: "2026-05-01T01:00:00Z",
      claim: { statement: "As-of query claim.", atomic: true },
    });
    const retract = makeChange(
      "chg:alpha:20260501:asof3333",
      { action: "retract", target_ids: [claim.id], reason: "later" },
      "2026-05-01T02:00:00Z",
    );
    const rows = load([source, claim, retract]);

    const beforeRetract = executeQuery(
      buildEffectiveState(rows, { asOf: "2026-05-01T01:30:00Z" }),
      { collection: "alpha", kinds: ["claim"] },
    );
    expect(beforeRetract.rows.map((row) => [row.id, row.status])).toEqual([[claim.id, "active"]]);

    const afterRetract = executeQuery(
      buildEffectiveState(rows, { asOf: "2026-05-01T02:30:00Z" }),
      { collection: "alpha", kinds: ["claim"] },
    );
    expect(afterRetract.rows).toEqual([]);

    const history = executeQuery(
      buildEffectiveState(rows, { asOf: "2026-05-01T02:30:00Z" }),
      { collection: "alpha", kinds: ["claim"], includeHistory: true },
    );
    expect(history.rows.map((row) => [row.id, row.status])).toEqual([[claim.id, "retracted"]]);
  });

  test("empty request returns all active rows in ledger order with score 1, no change rows", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, {});
    const ids = result.rows.map((r) => r.id);
    expect(ids).toEqual([
      fx.source.id,
      fx.betaSource.id,
      fx.claimA.id,
      fx.claimB.id,
      fx.claimReplacement.id,
      fx.claimBeta.id,
      fx.question.id,
      fx.synthesis.id,
    ]);
    for (const r of result.rows) expect(r.score).toBe(1);
    expect(result.total_matched).toBe(8);
    expect(result.total_returned).toBe(8);
  });

  test("kinds: ['claim'] returns only claims", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { kinds: ["claim"] });
    expect(result.rows.every((r) => r.kind === "claim")).toBe(true);
    expect(result.rows.length).toBe(4);
  });

  test("collection filter limits results to that collection", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { collection: "beta" });
    const ids = result.rows.map((r) => r.id).sort();
    expect(ids).toEqual([fx.betaSource.id, fx.claimBeta.id].sort());
  });

  test("subject and tag filtering", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const subjectResult = executeQuery(state, { subject: "Beta" });
    expect(subjectResult.rows.map((r) => r.id).sort()).toEqual(
      [fx.betaSource.id, fx.claimBeta.id].sort(),
    );
    const tagResult = executeQuery(state, { tag: "important" });
    expect(tagResult.rows.map((r) => r.id)).toEqual([fx.claimB.id]);
  });
});

describe("executeQuery - text scoring", () => {
  test("substring match returns the row and ranks higher than non-matches", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { text: "example" });
    expect(result.rows.length).toBeGreaterThan(0);
    const ids = result.rows.map((r) => r.id);
    expect(ids).toContain(fx.source.id);
    expect(ids).not.toContain(fx.claimB.id);
    for (const r of result.rows) expect(r.score).toBeGreaterThan(0);
  });

  test("whole-word match scores higher than substring match", () => {
    const fx = buildFixture();
    const wholeWord = makeClaim("claim:alpha:20260501:wwww1111", fx.source.id, {
      identity: { claim_key: "alpha|whole" },
      claim: { statement: "The cat sat on the mat.", atomic: true },
    });
    const substring = makeClaim("claim:alpha:20260501:ssss2222", fx.source.id, {
      identity: { claim_key: "alpha|sub" },
      claim: { statement: "Concatenation of values.", atomic: true },
    });
    const state = buildEffectiveState(load([fx.source, wholeWord, substring]));
    const result = executeQuery(state, { text: "cat" });
    expect(result.rows[0]?.id).toBe(wholeWord.id);
    expect(result.rows[1]?.id).toBe(substring.id);
    expect(result.rows[0]?.score).toBe(60);
    expect(result.rows[1]?.score).toBe(40);
  });

  test("exact normalized match scores 80", () => {
    const source = makeSource("src:exact:20260501:aaaa1111");
    const claim = makeClaim("claim:exact:20260501:bbbb2222", source.id, {
      identity: { claim_key: "exact|key" },
      claim: { statement: "Hello World", atomic: true },
    });
    const state = buildEffectiveState(load([source, claim]));
    const result = executeQuery(state, { text: "  hello   world  " });
    const claimRow = result.rows.find((r) => r.id === claim.id);
    expect(claimRow?.score).toBe(80);
  });

  test("text query with no matches returns empty rows and total_matched 0", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { text: "zzz-no-such-text-zzz" });
    expect(result.rows).toEqual([]);
    expect(result.total_matched).toBe(0);
    expect(result.total_returned).toBe(0);
  });
});

describe("executeQuery - id and claim_key", () => {
  test("ids: [<source>] returns the matching row with score 100", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: [fx.source.id] });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.id).toBe(fx.source.id);
    expect(result.rows[0]?.score).toBe(100);
  });

  test("claim_key match returns the matching claim with score 90", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { claimKey: "alpha|exists" });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.id).toBe(fx.claimA.id);
    expect(result.rows[0]?.score).toBe(90);
  });
});

describe("executeQuery - history and status", () => {
  test("includeHistory: true includes the superseded claim", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { includeHistory: true, kinds: ["claim"] });
    const ids = result.rows.map((r) => r.id);
    expect(ids).toContain(fx.claimSuperseded.id);
    expect(ids).toContain(fx.claimRetracted.id);
  });

  test("status: 'retracted' returns only retracted rows", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { status: "retracted" });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.id).toBe(fx.claimRetracted.id);
    expect(result.rows[0]?.status).toBe("retracted");
  });
});

describe("executeQuery - limit and shape", () => {
  test("limit: 1 returns one row with total_matched reflecting full count", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { limit: 1 });
    expect(result.rows.length).toBe(1);
    expect(result.total_returned).toBe(1);
    expect(result.total_matched).toBe(8);
  });

  test("full: true populates row on each result", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { kinds: ["claim"], full: true, limit: 1 });
    expect(result.rows[0]?.row).toBeDefined();
    expect(result.rows[0]?.row?.id).toBe(result.rows[0]?.id);
  });

  test("compact output omits row", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { kinds: ["claim"], limit: 1 });
    expect(result.rows[0]?.row).toBeUndefined();
  });

  test("kinds: ['change'] returns change rows (overrides default hide)", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { kinds: ["change"] });
    const ids = result.rows.map((r) => r.id).sort();
    expect(ids).toEqual([fx.supersedeChange.id, fx.retractChange.id].sort());
  });

  test("deterministic tie-breaking - same input yields same output order", () => {
    const fx1 = buildFixture();
    const fx2 = buildFixture();
    const state1 = buildEffectiveState(fx1.rows);
    const state2 = buildEffectiveState(fx2.rows);
    const a = executeQuery(state1, { text: "claim" });
    const b = executeQuery(state2, { text: "claim" });
    expect(a.rows.map((r) => r.id)).toEqual(b.rows.map((r) => r.id));
    expect(a.rows.map((r) => r.score)).toEqual(b.rows.map((r) => r.score));
  });
});

describe("executeQuery - row shape details", () => {
  test("query row exposes text, confidence, source_ids, time", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: [fx.claimA.id] });
    const row = result.rows[0];
    expect(row?.text).toBe("The example pattern shows up here.");
    expect(row?.confidence).toBe("high");
    expect(row?.source_ids).toContain(fx.source.id);
    expect(row?.time).toBe("2026-04-29T00:00:00Z");
  });

  test("source row exposes title and published_at as time", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: [fx.source.id] });
    const row = result.rows[0];
    expect(row?.text).toBe("Alpha example source");
    expect(row?.time).toBe("2026-04-30T00:00:00Z");
  });
});

describe("executeGet", () => {
  test("ids: [<active>] returns the row with status active", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [fx.claimA.id] });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.status).toBe("active");
    expect(result.rows[0]?.row.id).toBe(fx.claimA.id);
    expect(result.not_found).toEqual([]);
  });

  test("ids: [<retracted>] without includeHistory puts it in not_found", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [fx.claimRetracted.id, fx.claimA.id] });
    expect(result.not_found).toEqual([fx.claimRetracted.id]);
    expect(result.rows.map((r) => r.id)).toEqual([fx.claimA.id]);
  });

  test("ids: [<retracted>] with includeHistory returns it with reason populated", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, {
      ids: [fx.claimRetracted.id],
      includeHistory: true,
    });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.status).toBe("retracted");
    expect(result.rows[0]?.reason).toBeDefined();
    expect(result.rows[0]?.reason).toContain("retracted");
    expect(result.not_found).toEqual([]);
  });

  test("mixed missing and active does not throw", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: ["claim:does:not:exist", fx.claimA.id] });
    expect(result.not_found).toEqual(["claim:does:not:exist"]);
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.id).toBe(fx.claimA.id);
  });

  test("all-missing throws not_found", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    let caught: unknown;
    try {
      executeGet(state, { ids: ["claim:no:way", "claim:also:not"] });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeDefined();
    expect(isKnbError(caught)).toBe(true);
    if (isKnbError(caught)) {
      expect(caught.code).toBe("not_found");
      expect(caught.details?.ids).toEqual(["claim:no:way", "claim:also:not"]);
    }
  });

  test("explain: true populates explanation.history", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, {
      ids: [fx.claimSuperseded.id],
      includeHistory: true,
      explain: true,
    });
    expect(result.rows.length).toBe(1);
    const explanation = result.rows[0]?.explanation;
    expect(explanation).toBeDefined();
    expect(explanation?.history.length).toBeGreaterThan(0);
    expect(explanation?.history[0]?.action).toBe("supersede");
  });

  test("ids: [] empty input returns {rows:[], not_found:[]} without throwing", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [] });
    expect(result.rows).toEqual([]);
    expect(result.not_found).toEqual([]);
  });

  test("duplicate ids in input produces one row per occurrence", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [fx.claimA.id, fx.claimA.id] });
    expect(result.rows.length).toBe(2);
    expect(result.rows[0]?.id).toBe(fx.claimA.id);
    expect(result.rows[1]?.id).toBe(fx.claimA.id);
    expect(result.not_found).toEqual([]);
  });

  test("explain: false (default) does not populate explanation", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [fx.claimA.id] });
    expect(result.rows[0]?.explanation).toBeUndefined();
  });

  test("active row with includeHistory true does not populate reason", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, { ids: [fx.claimA.id], includeHistory: true });
    expect(result.rows[0]?.status).toBe("active");
    expect(result.rows[0]?.reason).toBeUndefined();
  });

  test("explain history for a superseded row reports replacement_id", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeGet(state, {
      ids: [fx.claimSuperseded.id],
      includeHistory: true,
      explain: true,
    });
    const entry = result.rows[0]?.explanation?.history[0];
    expect(entry?.replacement_id).toBe(fx.claimReplacement.id);
    expect(entry?.reason).toBe("improved");
  });
});

describe("executeQuery - score determinism (exact values)", () => {
  test("each scoring tier hits its exact value (100/90/80/60/40/1)", () => {
    const src = makeSource("src:exact:20260501:aaaa1111");
    const idMatchClaim = makeClaim("claim:exact:20260501:bbbb2222", src.id, {
      identity: { claim_key: "key|alpha" },
      claim: { statement: "Identifier match.", atomic: true },
    });
    const claimKeyClaim = makeClaim("claim:exact:20260501:cccc3333", src.id, {
      identity: { claim_key: "key|target" },
      claim: { statement: "Claim key wins.", atomic: true },
    });
    const exactTextClaim = makeClaim("claim:exact:20260501:dddd4444", src.id, {
      identity: { claim_key: "key|exact" },
      claim: { statement: "hello world", atomic: true },
    });
    const wholeWordClaim = makeClaim("claim:exact:20260501:eeee5555", src.id, {
      identity: { claim_key: "key|whole" },
      claim: { statement: "the cat sat", atomic: true },
    });
    const substringClaim = makeClaim("claim:exact:20260501:ffff6666", src.id, {
      identity: { claim_key: "key|sub" },
      claim: { statement: "concatenated value", atomic: true },
    });
    const noTermClaim = makeClaim("claim:exact:20260501:gggg7777", src.id, {
      identity: { claim_key: "key|none" },
      claim: { statement: "Unrelated.", atomic: true },
    });

    const stateForId = buildEffectiveState(load([src, idMatchClaim]));
    expect(executeQuery(stateForId, { ids: [idMatchClaim.id] }).rows[0]?.score).toBe(100);

    const stateForKey = buildEffectiveState(load([src, claimKeyClaim]));
    expect(executeQuery(stateForKey, { claimKey: "key|target" }).rows[0]?.score).toBe(90);

    const stateForExact = buildEffectiveState(load([src, exactTextClaim]));
    expect(executeQuery(stateForExact, { text: "hello world" }).rows[0]?.score).toBe(80);

    const stateForWhole = buildEffectiveState(load([src, wholeWordClaim]));
    expect(executeQuery(stateForWhole, { text: "cat" }).rows[0]?.score).toBe(60);

    const stateForSub = buildEffectiveState(load([src, substringClaim]));
    expect(executeQuery(stateForSub, { text: "cat" }).rows[0]?.score).toBe(40);

    const stateForNone = buildEffectiveState(load([src, noTermClaim]));
    expect(executeQuery(stateForNone, {}).rows.find((r) => r.id === noTermClaim.id)?.score).toBe(1);
  });

  test("multiple matching strategies on same row yield max, not sum", () => {
    const src = makeSource("src:multi:20260501:aaaa1111");
    const c = makeClaim("claim:multi:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|multi" },
      claim: { statement: "multi target", atomic: true },
    });
    const state = buildEffectiveState(load([src, c]));
    const result = executeQuery(state, {
      ids: [c.id],
      claimKey: "k|multi",
      text: "multi target",
    });
    expect(result.rows[0]?.score).toBe(100);
  });

  test("text-only query: whole-word vs substring with explicit boundaries", () => {
    const src = makeSource("src:wb:20260501:aaaa1111");
    const wholePunct = makeClaim("claim:wb:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|wb-whole" },
      claim: { statement: "Yes, cat. End.", atomic: true },
    });
    const subOnly = makeClaim("claim:wb:20260501:cccc3333", src.id, {
      identity: { claim_key: "k|wb-sub" },
      claim: { statement: "concatenation", atomic: true },
    });
    const state = buildEffectiveState(load([src, wholePunct, subOnly]));
    const r = executeQuery(state, { text: "cat" });
    const idsByScore = r.rows.map((row) => ({ id: row.id, score: row.score }));
    expect(idsByScore.find((x) => x.id === wholePunct.id)?.score).toBe(60);
    expect(idsByScore.find((x) => x.id === subOnly.id)?.score).toBe(40);
  });

  test("empty text query is treated as no-text-match (matches all active rows)", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { text: "" });
    expect(result.total_matched).toBe(8);
    for (const r of result.rows) expect(r.score).toBe(1);
  });

  test("whitespace-only text query is treated as no-text-match", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { text: "   " });
    expect(result.total_matched).toBe(8);
  });

  test("synthesis summary text matches (in addition to title)", () => {
    const src = makeSource("src:syn:20260501:aaaa1111");
    const c = makeClaim("claim:syn:20260501:bbbb2222", src.id);
    const synth = makeSynthesis("synth:syn:20260501:cccc3333", [c.id], {
      synthesis: {
        title: "Unrelated heading",
        summary: "Mentions noteworthy phrase here.",
        basis: { claim_ids: [c.id] },
        status: "active",
      },
    });
    const state = buildEffectiveState(load([src, c, synth]));
    const result = executeQuery(state, { text: "noteworthy" });
    const ids = result.rows.map((r) => r.id);
    expect(ids).toContain(synth.id);
  });

  test("normalization collapses internal whitespace and lowercases", () => {
    const src = makeSource("src:norm:20260501:aaaa1111");
    const c = makeClaim("claim:norm:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|norm" },
      claim: { statement: "Hello\t\tWorld\nFoo", atomic: true },
    });
    const state = buildEffectiveState(load([src, c]));
    const result = executeQuery(state, { text: "hello world foo" });
    expect(result.rows[0]?.id).toBe(c.id);
    expect(result.rows[0]?.score).toBe(80);
  });

  test("text matching is case-insensitive", () => {
    const src = makeSource("src:case:20260501:aaaa1111");
    const c = makeClaim("claim:case:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|case" },
      claim: { statement: "FOO BAR", atomic: true },
    });
    const state = buildEffectiveState(load([src, c]));
    const result = executeQuery(state, { text: "foo bar" });
    expect(result.rows[0]?.score).toBe(80);
  });

  test("text matching normalizes Persian/Arabic variants", () => {
    const src = makeSource("src:rtl:20260501:aaaa1111");
    const c = makeClaim("claim:rtl:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|rtl" },
      claim: { statement: "إيران ١٤٠٣ خبرساز بود.", atomic: true },
    });
    const state = buildEffectiveState(load([src, c]));
    const result = executeQuery(state, { text: "ایران ۱۴۰۳" });
    expect(result.rows[0]?.id).toBe(c.id);
    expect(result.rows[0]?.score).toBe(60);
  });

  test("text matching handles Persian digits, tatweel, and ZWNJ", () => {
    const src = makeSource("src:rtl:20260501:cccc3333");
    const c = makeClaim("claim:rtl:20260501:dddd4444", src.id, {
      identity: { claim_key: "k|rtl-joiners" },
      claim: { statement: "می\u200cرود به کشــور با ۱۸۰ نفر.", atomic: true },
    });
    const state = buildEffectiveState(load([src, c]));
    const result = executeQuery(state, { text: "می رود به کشور با 180 نفر" });
    expect(result.rows[0]?.id).toBe(c.id);
    expect(result.rows[0]?.score).toBe(80);
  });

  test("claim_key: 'unknown' returns zero rows (claim_key is a query term)", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { claimKey: "no|such|key" });
    expect(result.rows).toEqual([]);
    expect(result.total_matched).toBe(0);
  });

  test("ids: [non-existent] returns zero rows but does not throw", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: ["does:not:exist"] });
    expect(result.rows).toEqual([]);
    expect(result.total_matched).toBe(0);
  });
});

describe("executeQuery - tie-break stability", () => {
  test("intentionally out-of-order ledger preserves ledger insertion order on score ties", () => {
    const src = makeSource("src:tie:20260501:aaaa1111");
    const cZ = makeClaim("claim:tie:20260501:zzzz1111", src.id, {
      identity: { claim_key: "k|z" },
      claim: { statement: "shared word here z", atomic: true },
    });
    const cA = makeClaim("claim:tie:20260501:aaaa2222", src.id, {
      identity: { claim_key: "k|a" },
      claim: { statement: "shared word here a", atomic: true },
    });
    const cM = makeClaim("claim:tie:20260501:mmmm3333", src.id, {
      identity: { claim_key: "k|m" },
      claim: { statement: "shared word here m", atomic: true },
    });
    const state = buildEffectiveState(load([src, cZ, cA, cM]));
    const r = executeQuery(state, { text: "shared" });
    expect(r.rows.map((x) => x.id)).toEqual([cZ.id, cA.id, cM.id]);
    for (const row of r.rows) expect(row.score).toBe(60);
  });
});

describe("executeQuery - filter combinations", () => {
  test("collection + kind + text intersect correctly", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, {
      collection: "beta",
      kinds: ["claim"],
      text: "example",
    });
    expect(result.rows.map((r) => r.id)).toEqual([fx.claimBeta.id]);
  });

  test("kinds: [] (empty array) behaves as kinds unset (default-hide change rows)", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const empty = executeQuery(state, { kinds: [] });
    const unset = executeQuery(state, {});
    expect(empty.rows.map((r) => r.id)).toEqual(unset.rows.map((r) => r.id));
  });

  test("status: 'superseded' returns the superseded but not the retracted row", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { status: "superseded" });
    const ids = result.rows.map((r) => r.id);
    expect(ids).toContain(fx.claimSuperseded.id);
    expect(ids).not.toContain(fx.claimRetracted.id);
    for (const r of result.rows) expect(r.status).toBe("superseded");
  });

  test("includeHistory: true returns rows of all statuses (active, retracted, superseded)", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { includeHistory: true, kinds: ["claim"] });
    const statuses = new Set(result.rows.map((r) => r.status));
    expect(statuses.has("active")).toBe(true);
    expect(statuses.has("retracted")).toBe(true);
    expect(statuses.has("superseded")).toBe(true);
  });
});

describe("executeQuery - row shape - source_ids and time", () => {
  test("source_ids for claim is the union of provenance.source_ids and evidence[].source_id, no duplicates", () => {
    const src1 = makeSource("src:union:20260501:aaaa1111");
    const src2 = makeSource("src:union:20260501:bbbb2222");
    const c = makeClaim("claim:union:20260501:cccc3333", src1.id, {
      identity: { claim_key: "k|union" },
      claim: { statement: "union claim", atomic: true },
      provenance: {
        source_ids: [src1.id, src2.id],
        evidence: [
          { source_id: src1.id, role: "supports", summary: "dup" },
          { source_id: src2.id, role: "supports", summary: "again" },
        ],
      },
    });
    const state = buildEffectiveState(load([src1, src2, c]));
    const result = executeQuery(state, { ids: [c.id] });
    const sids = result.rows[0]?.source_ids ?? [];
    expect(sids.sort()).toEqual([src1.id, src2.id].sort());
    expect(new Set(sids).size).toBe(sids.length);
  });

  test("source_ids for claim resolve merged duplicate sources to the canonical id", () => {
    const canonical = makeSource("src:alpha:20260501:canonical");
    const duplicate = makeSource("src:alpha:20260501:duplicate");
    const c = makeClaim("claim:alpha:20260501:mergedsrc", duplicate.id);
    const merge = makeChange("chg:alpha:20260501:mergesrc", {
      action: "merge",
      target_ids: [duplicate.id],
      canonical_id: canonical.id,
      reason: "same source",
    });
    const state = buildEffectiveState(load([canonical, duplicate, c, merge]));
    const result = executeQuery(state, { ids: [c.id] });
    expect(result.rows[0]?.source_ids).toEqual([canonical.id]);
  });

  test("source_ids for synthesis comes from synthesis.basis.source_ids", () => {
    const src1 = makeSource("src:synSid:20260501:aaaa1111");
    const c = makeClaim("claim:synSid:20260501:bbbb2222", src1.id);
    const synth = makeSynthesis("synth:synSid:20260501:cccc3333", [c.id], {
      synthesis: {
        title: "T",
        summary: "S",
        basis: { claim_ids: [c.id], source_ids: [src1.id] },
        status: "active",
      },
    });
    const state = buildEffectiveState(load([src1, c, synth]));
    const result = executeQuery(state, { ids: [synth.id] });
    expect(result.rows[0]?.source_ids).toEqual([src1.id]);
  });

  test("time precedence for claim: valid_at > occurred_at > first_observed_at", () => {
    const src = makeSource("src:time:20260501:aaaa1111");
    const validClaim = makeClaim("claim:time:20260501:bbbb2222", src.id, {
      identity: { claim_key: "k|valid" },
      time: {
        precision: "day",
        valid_at: "2026-01-01T00:00:00Z",
        occurred_at: "2026-02-01T00:00:00Z",
        first_observed_at: "2026-03-01T00:00:00Z",
      },
    });
    const occurredClaim = makeClaim("claim:time:20260501:cccc3333", src.id, {
      identity: { claim_key: "k|occurred" },
      time: {
        precision: "day",
        occurred_at: "2026-02-01T00:00:00Z",
        first_observed_at: "2026-03-01T00:00:00Z",
      },
    });
    const observedClaim = makeClaim("claim:time:20260501:dddd4444", src.id, {
      identity: { claim_key: "k|observed" },
      time: {
        precision: "day",
        first_observed_at: "2026-03-01T00:00:00Z",
      },
    });
    const state = buildEffectiveState(load([src, validClaim, occurredClaim, observedClaim]));
    const r1 = executeQuery(state, { ids: [validClaim.id] });
    expect(r1.rows[0]?.time).toBe("2026-01-01T00:00:00Z");
    const r2 = executeQuery(state, { ids: [occurredClaim.id] });
    expect(r2.rows[0]?.time).toBe("2026-02-01T00:00:00Z");
    const r3 = executeQuery(state, { ids: [observedClaim.id] });
    expect(r3.rows[0]?.time).toBe("2026-03-01T00:00:00Z");
  });

  test("question time uses first_observed_at", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: [fx.question.id] });
    expect(result.rows[0]?.time).toBe("2026-04-28T00:00:00Z");
    expect(result.rows[0]?.text).toBe("Does the example always exist?");
  });

  test("synthesis row exposes title (not summary) as text and has no confidence/time", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: [fx.synthesis.id] });
    const row = result.rows[0];
    expect(row?.text).toBe("Synthesis title");
    expect(row?.confidence).toBeUndefined();
    expect(row?.time).toBeUndefined();
  });

  test("compact output (full: false) carries no row even if rows count is 0", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { ids: ["nonexistent"] });
    expect(result.rows).toEqual([]);
  });
});

describe("executeQuery - limit behavior", () => {
  test("limit: 0 returns empty rows but reports total_matched", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { limit: 0 });
    expect(result.rows).toEqual([]);
    expect(result.total_returned).toBe(0);
    expect(result.total_matched).toBe(8);
  });

  test("text query + limit: total_matched is post-filter pre-limit count", () => {
    const fx = buildFixture();
    const state = buildEffectiveState(fx.rows);
    const result = executeQuery(state, { text: "claim", limit: 1 });
    expect(result.rows.length).toBe(1);
    expect(result.total_returned).toBe(1);
    expect(result.total_matched).toBeGreaterThan(1);
  });
});

describe("executeQuery - empty/single-row workspaces", () => {
  test("empty workspace returns predictable empty shape", () => {
    const state = buildEffectiveState([]);
    const result = executeQuery(state, {});
    expect(result.rows).toEqual([]);
    expect(result.total_matched).toBe(0);
    expect(result.total_returned).toBe(0);
  });

  test("single-row workspace returns one row", () => {
    const src = makeSource("src:single:20260501:aaaa1111");
    const state = buildEffectiveState(load([src]));
    const result = executeQuery(state, {});
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.id).toBe(src.id);
  });

  test("only-inactive workspace returns no active rows by default", () => {
    const src = makeSource("src:inactive:20260501:aaaa1111");
    const c = makeClaim("claim:inactive:20260501:bbbb2222", src.id);
    const retract = makeChange("chg:inactive:20260501:cccc3333", {
      action: "retract",
      target_ids: [c.id],
      reason: "wrong",
    });
    const state = buildEffectiveState(load([src, c, retract]));
    const active = executeQuery(state, { kinds: ["claim"] });
    expect(active.rows).toEqual([]);
    const all = executeQuery(state, { includeHistory: true, kinds: ["claim"] });
    expect(all.rows.length).toBe(1);
    expect(all.rows[0]?.status).toBe("retracted");
  });
});
