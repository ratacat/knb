import { describe, expect, test } from "bun:test";
import {
  classifyClaim,
  classifyMany,
  normalizeStatement,
  type CandidateClaim,
  type NoveltyClassification,
} from "../src/core/novelty";
import { buildEffectiveState } from "../src/core/state";
import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

function makeSource(id: string): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["test"], subjects: ["Example"] },
    source: { type: "web_page", title: "Example", uri: `https://example.com/${id}` },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
  };
}

function makeClaim(
  id: string,
  sourceId: string,
  overrides: Partial<ClaimRow> = {},
): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: { collections: ["test"], subjects: ["Example"], tags: ["fact"] },
    identity: { claim_key: `key|${id}` },
    claim: { statement: `Statement about ${id}.`, atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Supports." }],
    },
    assessment: { confidence: "high" },
    ...overrides,
  };
}

function makeChangeRetract(id: string, targetId: string): ChangeRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "change",
    created_at: "2026-05-01T13:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["test"] },
    change: { action: "retract", target_ids: [targetId], reason: "obsolete" },
  };
}

function buildState(rows: KnbRow[]) {
  return buildEffectiveState(load(rows));
}

const src1 = makeSource("src:test:20260501:s001a000");
const src2 = makeSource("src:test:20260501:s002a000");
const src3 = makeSource("src:test:20260501:s003a000");

const claimA: ClaimRow = makeClaim("claim:test:20260501:aaaa1111", src1.id, {
  identity: { claim_key: "alpha|exists" },
  claim: { statement: "Alpha exists.", atomic: true },
  time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
  provenance: {
    source_ids: [src1.id],
    evidence: [
      { source_id: src1.id, role: "supports", summary: "Source 1 supports." },
    ],
  },
  assessment: { confidence: "medium" },
  scope: { collections: ["alpha-col"], subjects: ["Alpha"] },
});

const claimB: ClaimRow = makeClaim("claim:test:20260501:bbbb2222", src2.id, {
  identity: { claim_key: "beta|grows", dedupe_hash: "deadbeef" },
  claim: { statement: "Beta grows quickly during summer.", atomic: true },
  time: { precision: "day", valid_at: "2026-06-01T00:00:00Z" },
  provenance: {
    source_ids: [src2.id],
    evidence: [{ source_id: src2.id, role: "supports", summary: "Source 2 supports." }],
  },
  assessment: { confidence: "high", importance: "medium" },
  scope: { collections: ["beta-col"], subjects: ["Beta"] },
});

const claimC: ClaimRow = makeClaim("claim:test:20260501:cccc3333", src3.id, {
  identity: { claim_key: "gamma|costs" },
  claim: { statement: "Gamma costs three credits per unit.", atomic: true },
  time: { precision: "unknown" },
  provenance: {
    source_ids: [src3.id],
    evidence: [{ source_id: src3.id, role: "supports", summary: "Source 3 supports." }],
  },
  assessment: { confidence: "low", contested: true },
  scope: { collections: ["gamma-col"], subjects: ["Gamma"] },
});

const claimD: ClaimRow = makeClaim("claim:test:20260501:dddd4444", src1.id, {
  identity: { claim_key: "delta|emits" },
  claim: { statement: "  Hello, World!  ", atomic: true },
  scope: { collections: ["delta-col"], subjects: ["Delta"] },
});

const claimE_retracted: ClaimRow = makeClaim("claim:test:20260501:eeee5555", src1.id, {
  identity: { claim_key: "epsilon|hidden" },
  claim: { statement: "Epsilon hidden statement.", atomic: true },
  scope: { collections: ["epsilon-col"], subjects: ["Epsilon"] },
});

const claimF_retracted: ClaimRow = makeClaim("claim:test:20260501:ffff6666", src2.id, {
  identity: { claim_key: "zeta|gone" },
  claim: { statement: "Zeta is no longer here.", atomic: true },
  scope: { collections: ["zeta-col"], subjects: ["Zeta"] },
});

const retract1 = makeChangeRetract("chg:test:20260501:r0001000", claimE_retracted.id);
const retract2 = makeChangeRetract("chg:test:20260501:r0002000", claimF_retracted.id);

const baseline: KnbRow[] = [
  src1,
  src2,
  src3,
  claimA,
  claimB,
  claimC,
  claimD,
  claimE_retracted,
  claimF_retracted,
  retract1,
  retract2,
];

describe("normalizeStatement", () => {
  test("collapses whitespace, strips punctuation, lowercases", () => {
    expect(normalizeStatement("  Hello, World!")).toBe("hello world");
    expect(normalizeStatement("hello world")).toBe("hello world");
    expect(normalizeStatement("Hello,   World!")).toBe(normalizeStatement("hello world"));
  });

  test("converts curly quotes to straight (apostrophe preserved)", () => {
    expect(normalizeStatement("It’s nice")).toBe("it's nice");
    expect(normalizeStatement("don‘t")).toBe("don't");
    expect(normalizeStatement("don’t")).toBe("don't");
    expect(normalizeStatement("can’t")).toBe("can't");
  });

  test("strips curly double quotes via straightening then punctuation strip", () => {
    expect(normalizeStatement("“Hello”")).toBe("hello");
    expect(normalizeStatement("“Hello world”")).toBe("hello world");
  });

  test("preserves internal hyphens and apostrophes", () => {
    expect(normalizeStatement("state-of-the-art it's fine")).toBe(
      "state-of-the-art it's fine",
    );
  });

  test("lowercases ASCII", () => {
    expect(normalizeStatement("HELLO")).toBe("hello");
    expect(normalizeStatement("HeLLo WoRLd")).toBe("hello world");
  });

  test("collapses tabs and newlines into single spaces", () => {
    expect(normalizeStatement("a   b\n\tc")).toBe("a b c");
    expect(normalizeStatement("foo\nbar\rbaz")).toBe("foo bar baz");
  });

  test("strips ASCII punctuation but keeps internal apostrophes/hyphens", () => {
    expect(normalizeStatement("hello, world!")).toBe("hello world");
    expect(normalizeStatement("hello; world: it works.")).toBe("hello world it works");
    expect(normalizeStatement("(parens) and [brackets] {braces}")).toBe(
      "parens and brackets braces",
    );
    expect(normalizeStatement("a/b\\c")).toBe("a b c");
    expect(normalizeStatement("a?b!c")).toBe("a b c");
  });

  test("preserves digits; periods inside numbers become spaces", () => {
    expect(normalizeStatement("v1.5")).toBe("v1 5");
    expect(normalizeStatement("3.14")).toBe("3 14");
    expect(normalizeStatement("100")).toBe("100");
  });

  test("empty and whitespace-only inputs return empty string", () => {
    expect(normalizeStatement("")).toBe("");
    expect(normalizeStatement("   ")).toBe("");
    expect(normalizeStatement("\t\n  \r")).toBe("");
  });

  test("non-string inputs return empty string", () => {
    expect(normalizeStatement(undefined as unknown as string)).toBe("");
    expect(normalizeStatement(null as unknown as string)).toBe("");
    expect(normalizeStatement(42 as unknown as string)).toBe("");
    expect(normalizeStatement({} as unknown as string)).toBe("");
  });

  test("preserves unicode letters via \\p{L} fallback", () => {
    expect(normalizeStatement("café")).toBe("café");
    expect(normalizeStatement("naïve")).toBe("naïve");
  });

  test("folds Persian and Arabic variants for matching only", () => {
    expect(normalizeStatement("ایران ۱۴۰۳")).toBe("ایران 1403");
    expect(normalizeStatement("إيران ١٤٠٣")).toBe("ایران 1403");
    expect(normalizeStatement("كتاب كيش")).toBe("کتاب کیش");
    expect(normalizeStatement("می\u200cرود")).toBe("می رود");
    expect(normalizeStatement("کشــور")).toBe("کشور");
  });

  test("is idempotent — normalizing twice equals normalizing once", () => {
    const inputs = [
      "  Hello, World!  ",
      "It’s a test",
      "a   b\n\tc",
      "v1.5",
      "state-of-the-art",
      "إيران ١٤٠٣",
    ];
    for (const input of inputs) {
      const once = normalizeStatement(input);
      expect(normalizeStatement(once)).toBe(once);
    }
  });
});

describe("classifyClaim — Persian/Arabic equivalence", () => {
  test.each([
    ["Arabic alef/yeh and Arabic-Indic digits", "ایران ۱۴۰۳ خبرساز بود", "إيران ١٤٠٣ خبرساز بود"],
    ["Arabic kaf/yeh fold to Persian letters", "کتاب کیش منتشر شد", "كتاب كيش منتشر شد"],
    ["Persian digits match ASCII digits", "جمعیت ۱۸۰ نفر گزارش شد", "جمعیت 180 نفر گزارش شد"],
    ["tatweel is ignored", "کشور در خبرها بود", "کشــور در خبرها بود"],
    ["ZWNJ tokenizes compatibly with spaces", "می رود", "می\u200cرود"],
  ])("%s", (_label, existingStatement, candidateStatement) => {
    const existing = makeClaim("claim:rtl:20260501:aaaa1111", src1.id, {
      identity: { claim_key: "rtl|existing" },
      claim: { statement: existingStatement, atomic: true },
    });
    const state = buildState([src1, existing]);
    const candidate: CandidateClaim = {
      identity: { claim_key: "rtl|candidate" },
      claim: { statement: candidateStatement, atomic: true },
      scope: existing.scope,
      provenance: existing.provenance,
    };

    const result = classifyClaim(candidate, state);

    expect(result.classification).not.toBe("new");
    expect(
      result.matches.some((match) =>
        match.reason === "statement_normalized_exact" ||
        match.reason === "statement_high_overlap",
      ),
    ).toBe(true);
  });
});

describe("classifyClaim — basic cases", () => {
  test("no matches returns new with empty matches", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "wholly|new" },
      claim: { statement: "Something completely unrelated about omega.", atomic: true },
      scope: { collections: ["omega-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
    expect(result.matched_ids).toEqual([]);
    expect(result.matches).toEqual([]);
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  test("claim_key exact + identical content returns duplicate", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src1.id],
        evidence: [
          { source_id: src1.id, role: "supports", summary: "Source 1 supports." },
        ],
      },
      assessment: { confidence: "medium" },
      scope: { collections: ["alpha-col"], subjects: ["Alpha"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toEqual([claimA.id]);
    expect(result.matches.some((m) => m.reason === "claim_key_exact")).toBe(true);
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  test("claim_key exact + new evidence pair returns corroboration with evidence_added", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src2.id],
        evidence: [{ source_id: src2.id, role: "supports", summary: "Second corroborating source." }],
      },
      scope: { collections: ["alpha-col"], subjects: ["Alpha"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("corroboration");
    expect(result.matched_ids).toContain(claimA.id);
    expect(result.matches.some((m) => m.reason === "evidence_added")).toBe(true);
    expect(result.matches.some((m) => m.reason === "claim_key_exact")).toBe(true);
  });

  test("claim_key exact + different valid_at returns update with time_changed", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "day", valid_at: "2026-05-15T00:00:00Z" },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matched_ids).toContain(claimA.id);
    expect(result.matches.some((m) => m.reason === "time_changed")).toBe(true);
  });

  test("claim_key exact + different valid_until returns update", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "day", valid_at: "2026-04-01T00:00:00Z", valid_until: "2027-01-01T00:00:00Z" },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matches.some((m) => m.reason === "time_changed")).toBe(true);
  });

  test("claim_key exact + different occurred_at returns update", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "day", valid_at: "2026-04-01T00:00:00Z", occurred_at: "2026-03-01T00:00:00Z" },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matches.some((m) => m.reason === "time_changed")).toBe(true);
  });

  test("claim_key exact + different confidence returns update with assessment_changed", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      assessment: { confidence: "high" }, // claimA: medium
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matches.some((m) => m.reason === "assessment_changed")).toBe(true);
  });

  test("claim_key exact + different importance returns update", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "beta|grows" },
      claim: { statement: "Beta grows quickly during summer.", atomic: true },
      time: { precision: "day", valid_at: "2026-06-01T00:00:00Z" },
      assessment: { confidence: "high", importance: "high" }, // claimB: medium
      scope: { collections: ["beta-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matches.some((m) => m.reason === "assessment_changed")).toBe(true);
  });

  test("claim_key exact + flipped contested returns update", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "gamma|costs" },
      claim: { statement: "Gamma costs three credits per unit.", atomic: true },
      assessment: { confidence: "low", contested: false }, // claimC: contested true
      scope: { collections: ["gamma-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matches.some((m) => m.reason === "assessment_changed")).toBe(true);
  });

  test("dedupe_hash exact + identical content returns duplicate with dedupe_hash_exact", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { dedupe_hash: "deadbeef" },
      claim: { statement: "Beta grows quickly during summer.", atomic: true },
      time: { precision: "day", valid_at: "2026-06-01T00:00:00Z" },
      provenance: {
        source_ids: [src2.id],
        evidence: [{ source_id: src2.id, role: "supports", summary: "Source 2 supports." }],
      },
      assessment: { confidence: "high", importance: "medium" },
      scope: { collections: ["beta-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toContain(claimB.id);
    expect(result.matches.some((m) => m.reason === "dedupe_hash_exact")).toBe(true);
  });

  test("empty claim_key string is not treated as a match key", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "" },
      claim: { statement: "Totally unrelated content.", atomic: true },
      scope: { collections: ["nowhere"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
  });

  test("empty dedupe_hash string is not treated as a match key", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { dedupe_hash: "" },
      claim: { statement: "Totally unrelated content.", atomic: true },
      scope: { collections: ["nowhere"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
  });

  test("source_ids only (no evidence) still triggers corroboration via sources_added", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src2.id], // brand new vs claimA's src1
      },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("corroboration");
    expect(result.matched_ids).toContain(claimA.id);
  });
});

describe("classifyClaim — statement-based matching with conservative rule", () => {
  test("normalized statement exact match without scope overlap → corroboration", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "different|key" },
      claim: { statement: "hello, world!!", atomic: true },
      scope: { collections: ["far-away-col"] },
      provenance: {
        evidence: [{ source_id: src1.id, role: "supports", summary: "Supports hello world." }],
      },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("corroboration");
    expect(result.matched_ids).toContain(claimD.id);
    expect(result.matches.some((m) => m.reason === "statement_normalized_exact")).toBe(true);
  });

  test("normalized statement exact match WITH scope overlap (collections) → duplicate", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "another|key" },
      claim: { statement: "HELLO   world", atomic: true },
      scope: { collections: ["delta-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toContain(claimD.id);
  });

  test("normalized statement exact match WITH scope overlap (subjects) → duplicate", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "another|key2" },
      claim: { statement: "Hello world", atomic: true },
      scope: { collections: ["unrelated-col"], subjects: ["Delta"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toContain(claimD.id);
  });

  test("statement high overlap (no exact match) → corroboration with statement_high_overlap", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "gamma|alt" },
      claim: { statement: "Gamma costs three credits per unit overall.", atomic: true },
      scope: { collections: ["unrelated-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("corroboration");
    expect(result.matched_ids).toContain(claimC.id);
    expect(result.matches.some((m) => m.reason === "statement_high_overlap")).toBe(true);
  });

  test("statement Jaccard < 0.85 → no statement match → new", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "totally|other" },
      // Sharing only "gamma" out of many tokens — well below 0.85.
      claim: { statement: "Gamma performs interpretive dance every Tuesday.", atomic: true },
      scope: { collections: ["unrelated-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
    expect(result.matched_ids).toEqual([]);
  });

  test("statement_normalized_exact suppresses statement_high_overlap reason", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "different|key" },
      claim: { statement: "Hello world!", atomic: true },
      scope: { collections: ["delta-col"] },
    };
    const result = classifyClaim(candidate, state);
    const reasons = result.matches.map((m) => m.reason);
    expect(reasons).toContain("statement_normalized_exact");
    expect(reasons).not.toContain("statement_high_overlap");
  });
});

describe("classifyClaim — contradiction and correction", () => {
  test("relations[].rel === contradicts pointing at matched id (with key match) → contradiction", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha does not exist.", atomic: true },
      scope: { collections: ["alpha-col"] },
      relations: [{ target_id: claimA.id, rel: "contradicts" }],
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("contradiction");
    expect(result.matched_ids).toContain(claimA.id);
    expect(result.matches.some((m) => m.reason === "explicit_contradiction_relation")).toBe(true);
  });

  test("contradicts relation pointing at non-matched id is ignored", () => {
    const state = buildState(baseline);
    // Relations point at claimB but candidate also has key match against claimA.
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src1.id],
        evidence: [{ source_id: src1.id, role: "supports", summary: "Source 1 supports." }],
      },
      assessment: { confidence: "medium" },
      scope: { collections: ["alpha-col"] },
      relations: [{ target_id: claimB.id, rel: "contradicts" }],
    };
    const result = classifyClaim(candidate, state);
    // claimA is the only matched row; relation points elsewhere → not contradiction.
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toEqual([claimA.id]);
  });

  test("identity.novelty === contradiction + key match → contradiction", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists", novelty: "contradiction" },
      claim: { statement: "Alpha exists in some other manner.", atomic: true },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("contradiction");
    expect(result.matched_ids).toContain(claimA.id);
  });

  test("identity.novelty === contradiction WITHOUT key/hash match → not promoted", () => {
    const state = buildState(baseline);
    // No key or hash match; statement-only match against claimA via Jaccard.
    const candidate: CandidateClaim = {
      identity: { claim_key: "different|key", novelty: "contradiction" },
      claim: { statement: "Alpha exists.", atomic: true },
      scope: { collections: ["far"] },
    };
    const result = classifyClaim(candidate, state);
    // Without key/hash match, identity.novelty=contradiction does NOT promote.
    expect(result.classification).not.toBe("contradiction");
  });

  test("identity.novelty === correction + key match → correction", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "gamma|costs", novelty: "correction" },
      claim: { statement: "Gamma actually costs four credits per unit.", atomic: true },
      scope: { collections: ["gamma-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("correction");
    expect(result.matched_ids).toContain(claimC.id);
    expect(result.matches.some((m) => m.reason === "explicit_correction_metadata")).toBe(true);
  });

  test("identity.novelty === correction WITHOUT key/hash match → not promoted", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "different|key", novelty: "correction" },
      claim: { statement: "Gamma costs three credits per unit.", atomic: true },
      scope: { collections: ["gamma-col"] },
    };
    const result = classifyClaim(candidate, state);
    // Statement-exact match with scope overlap → duplicate, not correction.
    expect(result.classification).toBe("duplicate");
  });

  test("evidence with role=contradicts pointing at matched id triggers contradiction", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha exists.", atomic: true },
      time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        evidence: [{ source_id: claimA.id, role: "contradicts", summary: "Contradicts directly." }],
      },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("contradiction");
  });
});

describe("classifyClaim — multi-match priority ordering", () => {
  test("correction beats contradiction when both apply to different rows", () => {
    const claimX: ClaimRow = makeClaim("claim:test:20260501:xxxx7777", src1.id, {
      identity: { claim_key: "x|key", dedupe_hash: "cafebabe" },
      claim: { statement: "Some other statement X.", atomic: true },
      scope: { collections: ["x-col"] },
    });
    const state = buildState([...baseline, claimX]);
    // Candidate: contradicts claimX via relation, correction toward claimA via novelty.
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists", dedupe_hash: "cafebabe", novelty: "correction" },
      claim: { statement: "Alpha exists differently.", atomic: true },
      scope: { collections: ["alpha-col"] },
      relations: [{ target_id: claimX.id, rel: "contradicts" }],
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("correction");
  });

  test("contradiction beats update", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "alpha|exists" },
      claim: { statement: "Alpha does not exist.", atomic: true },
      time: { precision: "day", valid_at: "2027-01-01T00:00:00Z" },
      scope: { collections: ["alpha-col"] },
      relations: [{ target_id: claimA.id, rel: "contradicts" }],
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("contradiction");
  });

  test("update beats duplicate when both apply to different rows", () => {
    // Build a peer claim with key match where candidate is identical (duplicate).
    const claimDup: ClaimRow = makeClaim("claim:test:20260501:duppdupp", src1.id, {
      identity: { claim_key: "dup|exists" },
      claim: { statement: "Dup exists.", atomic: true },
      time: { precision: "day", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src1.id],
        evidence: [{ source_id: src1.id, role: "supports", summary: "Source 1 supports." }],
      },
      assessment: { confidence: "medium" },
      scope: { collections: ["dup-col"] },
    });
    const claimX: ClaimRow = makeClaim("claim:test:20260501:xxxx7777", src1.id, {
      identity: { claim_key: "x|key", dedupe_hash: "cafebabe" },
      claim: { statement: "Some other statement.", atomic: true },
      time: { precision: "day", valid_at: "2026-01-01T00:00:00Z" },
      scope: { collections: ["x-col"] },
    });
    const state = buildState([...baseline, claimDup, claimX]);

    // Candidate matches claimDup via key (duplicate, identical content) AND claimX via dedupe_hash with time delta (update).
    const candidate: CandidateClaim = {
      identity: { claim_key: "dup|exists", dedupe_hash: "cafebabe" },
      claim: { statement: "Dup exists.", atomic: true },
      time: { precision: "day", valid_at: "2026-04-01T00:00:00Z" },
      provenance: {
        source_ids: [src1.id],
        evidence: [{ source_id: src1.id, role: "supports", summary: "Source 1 supports." }],
      },
      assessment: { confidence: "medium" },
      scope: { collections: ["dup-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("update");
    expect(result.matched_ids).toContain(claimX.id);
    // Only matches contributing to the chosen classification appear; duplicate match is excluded.
    expect(result.matched_ids).not.toContain(claimDup.id);
  });

  test("duplicate beats corroboration when both apply", () => {
    // Build a fresh row whose key/statement matches the candidate exactly (duplicate),
    // and let claimC also match via statement_high_overlap (corroboration).
    const claimDupGamma: ClaimRow = makeClaim("claim:test:20260501:dgmm0001", src3.id, {
      identity: { claim_key: "gamma|costs|alt" },
      claim: { statement: "Gamma costs three credits per unit overall.", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        source_ids: [src3.id],
        evidence: [{ source_id: src3.id, role: "supports", summary: "Source 3 supports." }],
      },
      assessment: { confidence: "low" },
      scope: { collections: ["gamma-col"] },
    });
    const state = buildState([...baseline, claimDupGamma]);
    const candidate: CandidateClaim = {
      identity: { claim_key: "gamma|costs|alt" },
      claim: { statement: "Gamma costs three credits per unit overall.", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        source_ids: [src3.id],
        evidence: [{ source_id: src3.id, role: "supports", summary: "Source 3 supports." }],
      },
      assessment: { confidence: "low" },
      scope: { collections: ["gamma-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("duplicate");
    expect(result.matched_ids).toContain(claimDupGamma.id);
    expect(result.matched_ids).not.toContain(claimC.id);
  });

  test("corroboration beats new when at least one corroboration match exists", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "wholly|new" },
      claim: { statement: "Gamma costs three credits per unit overall.", atomic: true },
      scope: { collections: ["new-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("corroboration");
    expect(result.matched_ids).toContain(claimC.id);
  });
});

describe("classifyClaim — ignores inactive and synthesis rows", () => {
  test("candidate matching only a retracted row returns new", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "epsilon|hidden" },
      claim: { statement: "Epsilon hidden statement.", atomic: true },
      scope: { collections: ["epsilon-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
    expect(result.matched_ids).toEqual([]);
  });

  test("candidate matching a retracted row by statement also returns new", () => {
    const state = buildState(baseline);
    const candidate: CandidateClaim = {
      identity: { claim_key: "free|key" },
      claim: { statement: "Zeta is no longer here.", atomic: true },
      scope: { collections: ["zeta-col"] },
    };
    const result = classifyClaim(candidate, state);
    expect(result.classification).toBe("new");
  });

  test("synthesis rows (even archived ones) are not considered as claim matches", () => {
    const synth: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:test:20260501:syyy0001",
      kind: "synthesis",
      created_at: "2026-05-01T12:05:00Z",
      created_by: "agent:test",
      scope: { collections: ["alpha-col"] },
      synthesis: {
        title: "Alpha synthesis",
        summary: "Alpha exists.",
        basis: { claim_ids: [claimA.id] },
        status: "archived",
      },
    };
    const state = buildState([...baseline, synth]);
    const candidate: CandidateClaim = {
      identity: { claim_key: "wholly|new" },
      claim: { statement: "Alpha exists.", atomic: true },
      scope: { collections: ["alpha-col"] },
    };
    const result = classifyClaim(candidate, state);
    // Should match claimA only (the synth's summary matches but synth isn't a claim).
    expect(result.matched_ids).toEqual([claimA.id]);
    // Statement-exact + scope overlap → duplicate.
    expect(result.classification).toBe("duplicate");
  });
});

describe("classifyMany", () => {
  test("returns one result per candidate against the same active set", () => {
    const state = buildState(baseline);
    const candidates: CandidateClaim[] = [
      {
        identity: { claim_key: "alpha|exists" },
        claim: { statement: "Alpha exists.", atomic: true },
        time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
        provenance: {
          source_ids: [src1.id],
          evidence: [
            { source_id: src1.id, role: "supports", summary: "Source 1 supports." },
          ],
        },
        assessment: { confidence: "medium" },
        scope: { collections: ["alpha-col"] },
      },
      {
        identity: { claim_key: "alpha|exists" },
        claim: { statement: "Alpha exists.", atomic: true },
        provenance: {
          evidence: [{ source_id: src2.id, role: "supports", summary: "Second source." }],
          source_ids: [src2.id],
        },
        scope: { collections: ["alpha-col"] },
      },
      {
        identity: { claim_key: "wholly|new" },
        claim: { statement: "An entirely new statement about omega.", atomic: true },
        scope: { collections: ["omega-col"] },
      },
    ];
    const results = classifyMany(candidates, state);
    expect(results.length).toBe(3);
    expect(results[0]?.classification).toBe("duplicate");
    expect(results[1]?.classification).toBe("corroboration");
    expect(results[2]?.classification).toBe("new");
  });

  test("classifyMany does not chain — each candidate sees the same active set", () => {
    const state = buildState(baseline);
    const candidates: CandidateClaim[] = [
      {
        identity: { claim_key: "alpha|exists" },
        claim: { statement: "Alpha exists.", atomic: true },
        time: { precision: "day", valid_at: "2026-07-01T00:00:00Z" },
        scope: { collections: ["alpha-col"] },
      },
      {
        identity: { claim_key: "alpha|exists" },
        claim: { statement: "Alpha exists.", atomic: true },
        time: { precision: "day", valid_at: "2026-08-01T00:00:00Z" },
        scope: { collections: ["alpha-col"] },
      },
    ];
    const results = classifyMany(candidates, state);
    expect(results[0]?.matched_ids).toEqual([claimA.id]);
    expect(results[1]?.matched_ids).toEqual([claimA.id]);
    expect(results[0]?.classification).toBe("update");
    expect(results[1]?.classification).toBe("update");
  });

  test("classifyMany on empty input returns empty array", () => {
    const state = buildState(baseline);
    const results = classifyMany([], state);
    expect(results).toEqual([]);
  });

  test("classifyMany preserves input order", () => {
    const state = buildState(baseline);
    const candidates: CandidateClaim[] = [
      {
        identity: { claim_key: "wholly|new1" },
        claim: { statement: "First brand new.", atomic: true },
        scope: { collections: ["new1"] },
      },
      {
        identity: { claim_key: "alpha|exists" },
        claim: { statement: "Alpha exists.", atomic: true },
        time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
        provenance: {
          source_ids: [src1.id],
          evidence: [{ source_id: src1.id, role: "supports", summary: "Source 1 supports." }],
        },
        assessment: { confidence: "medium" },
        scope: { collections: ["alpha-col"] },
      },
      {
        identity: { claim_key: "wholly|new2" },
        claim: { statement: "Second brand new.", atomic: true },
        scope: { collections: ["new2"] },
      },
    ];
    const results = classifyMany(candidates, state);
    expect(results.length).toBe(3);
    expect(results[0]?.classification).toBe("new");
    expect(results[1]?.classification).toBe("duplicate");
    expect(results[2]?.classification).toBe("new");
  });
});

describe("rationale", () => {
  test("non-new classifications include a non-empty rationale that names the classification", () => {
    const state = buildState(baseline);
    const cases: Array<{ candidate: CandidateClaim; expected: NoveltyClassification }> = [
      {
        expected: "duplicate",
        candidate: {
          identity: { claim_key: "alpha|exists" },
          claim: { statement: "Alpha exists.", atomic: true },
          time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" },
          provenance: {
            source_ids: [src1.id],
            evidence: [{ source_id: src1.id, role: "supports", summary: "Source 1 supports." }],
          },
          assessment: { confidence: "medium" },
          scope: { collections: ["alpha-col"] },
        },
      },
      {
        expected: "corroboration",
        candidate: {
          identity: { claim_key: "alpha|exists" },
          claim: { statement: "Alpha exists.", atomic: true },
          provenance: {
            evidence: [{ source_id: src2.id, role: "supports", summary: "Second source." }],
            source_ids: [src2.id],
          },
          scope: { collections: ["alpha-col"] },
        },
      },
      {
        expected: "update",
        candidate: {
          identity: { claim_key: "alpha|exists" },
          claim: { statement: "Alpha exists.", atomic: true },
          time: { precision: "day", valid_at: "2026-09-01T00:00:00Z" },
          scope: { collections: ["alpha-col"] },
        },
      },
      {
        expected: "contradiction",
        candidate: {
          identity: { claim_key: "alpha|exists" },
          claim: { statement: "Alpha does not exist.", atomic: true },
          scope: { collections: ["alpha-col"] },
          relations: [{ target_id: claimA.id, rel: "contradicts" }],
        },
      },
      {
        expected: "correction",
        candidate: {
          identity: { claim_key: "gamma|costs", novelty: "correction" },
          claim: { statement: "Gamma actually costs four credits per unit.", atomic: true },
          scope: { collections: ["gamma-col"] },
        },
      },
    ];
    for (const c of cases) {
      const r = classifyClaim(c.candidate, state);
      expect(r.classification).toBe(c.expected);
      expect(r.rationale.length).toBeGreaterThan(0);
      expect(r.rationale.startsWith(c.expected)).toBe(true);
    }
  });

  test("rationale for new classification is non-empty too", () => {
    const state = buildState(baseline);
    const r = classifyClaim(
      {
        identity: { claim_key: "wholly|other" },
        claim: { statement: "Nothing related at all here.", atomic: true },
        scope: { collections: ["nowhere"] },
      },
      state,
    );
    expect(r.classification).toBe("new");
    expect(r.rationale.length).toBeGreaterThan(0);
  });
});
