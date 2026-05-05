import { describe, expect, test } from "bun:test";
import { buildContext } from "../src/core/context";
import { buildEffectiveState } from "../src/core/state";
import type {
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

function source(id: string, overrides: Partial<SourceRow["source"]> = {}): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { profiles: ["alpha"], subjects: ["Subject A"], tags: ["fact"] },
    source: {
      type: "web_page",
      title: `Source ${id}`,
      uri: `https://example.com/${id}`,
      publisher: "Example Pub",
      ...overrides,
    },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
  };
}

function claim(
  id: string,
  sourceIds: string[],
  options: {
    importance?: "high" | "medium" | "low" | "unknown";
    confidence?: "high" | "medium" | "low" | "unknown";
    contested?: boolean;
    statement?: string;
    created_at?: string;
    profile?: string;
    evidenceCount?: number;
    external_refs?: ClaimRow["external_refs"];
  } = {},
): ClaimRow {
  const evidenceCount = options.evidenceCount ?? sourceIds.length;
  const evidence = [];
  for (let i = 0; i < evidenceCount; i += 1) {
    const sid = sourceIds[i % sourceIds.length] ?? sourceIds[0]!;
    evidence.push({ source_id: sid, role: "supports" as const, summary: `evidence ${i}` });
  }
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: options.created_at ?? "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: {
      profiles: [options.profile ?? "alpha"],
      subjects: ["Subject A"],
      tags: ["fact"],
    },
    identity: { claim_key: `key|${id}` },
    ...(options.external_refs ? { external_refs: options.external_refs } : {}),
    claim: {
      statement: options.statement ?? `Statement ${id}.`,
      atomic: true,
    },
    time: { precision: "unknown" },
    provenance: { source_ids: sourceIds, evidence },
    assessment: {
      confidence: options.confidence ?? "high",
      importance: options.importance ?? "medium",
      ...(options.contested === true ? { contested: true } : {}),
    },
  };
}

function question(
  id: string,
  options: {
    priority?: "high" | "medium" | "low";
    text?: string;
    status?: "open" | "resolved" | "archived";
    profile?: string;
    created_at?: string;
  } = {},
): QuestionRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "question",
    created_at: options.created_at ?? "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { profiles: [options.profile ?? "alpha"] },
    question: {
      text: options.text ?? "Why?",
      status: options.status ?? "open",
      ...(options.priority ? { priority: options.priority } : {}),
    },
  };
}

function synthesis(
  id: string,
  basisClaimIds: string[],
  options: {
    importance?: "high" | "medium" | "low" | "unknown";
    title?: string;
    created_at?: string;
    sourceIds?: string[];
    profile?: string;
  } = {},
): SynthesisRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "synthesis",
    created_at: options.created_at ?? "2026-05-01T12:03:00Z",
    created_by: "agent:test",
    scope: { profiles: [options.profile ?? "alpha"] },
    synthesis: {
      title: options.title ?? `Synthesis ${id}`,
      summary: `Summary for ${id}.`,
      basis: {
        claim_ids: basisClaimIds,
        ...(options.sourceIds ? { source_ids: options.sourceIds } : {}),
      },
      status: "active",
    },
    ...(options.importance
      ? { assessment: { importance: options.importance } }
      : {}),
  };
}

function fixtureState(rows: KnbRow[]) {
  return buildEffectiveState(load(rows));
}

type ContextRankingGolden = {
  syntheses: string[];
  key_claims: string[];
  open_questions: string[];
};

function contextRanking(result: ReturnType<typeof buildContext>): ContextRankingGolden {
  return {
    syntheses: result.syntheses.map((row) => row.id),
    key_claims: result.key_claims.map((row) => row.id),
    open_questions: result.open_questions.map((row) => row.id),
  };
}

function iranCracksLikeRows(): KnbRow[] {
  const srcSignals = source("src-signals", { title: "Regional signals roundup" });
  const srcMarkets = source("src-markets", { title: "Market reaction brief" });
  const srcArchive = source("src-archive", { title: "Older sanctions archive" });
  const commandRift = claim("claim-command-rift", [srcSignals.id, srcArchive.id], {
    importance: "high",
    confidence: "high",
    evidenceCount: 2,
    statement: "Command channels show visible strain.",
    created_at: "2026-04-22T12:00:00Z",
  });
  const bunkerShift = claim("claim-bunker-shift", [srcSignals.id], {
    importance: "high",
    confidence: "high",
    evidenceCount: 1,
    statement: "Senior officials shifted bunker routines.",
    created_at: "2026-04-30T12:00:00Z",
  });
  const militiaAlert = claim("claim-militia-alert", [srcSignals.id, srcMarkets.id], {
    importance: "medium",
    confidence: "high",
    evidenceCount: 3,
    statement: "Proxy channels elevated readiness.",
    created_at: "2026-05-01T11:00:00Z",
  });
  const marketRumor = claim("claim-market-rumor", [srcMarkets.id], {
    importance: "medium",
    confidence: "low",
    statement: "Thin market rumor suggests internal cracks.",
    created_at: "2026-05-01T13:00:00Z",
  });
  const oldSanctions = claim("claim-old-sanctions", [srcArchive.id], {
    importance: "low",
    confidence: "high",
    evidenceCount: 2,
    statement: "Older sanctions pressure remains unresolved.",
    created_at: "2026-04-10T12:00:00Z",
  });
  return [
    srcSignals,
    srcMarkets,
    srcArchive,
    commandRift,
    bunkerShift,
    militiaAlert,
    marketRumor,
    oldSanctions,
    synthesis("syn-command-cracks", [commandRift.id, bunkerShift.id, militiaAlert.id], {
      importance: "high",
      created_at: "2026-05-01T10:00:00Z",
      sourceIds: [srcSignals.id],
    }),
    synthesis("syn-market-noise", [marketRumor.id, oldSanctions.id], {
      importance: "medium",
      created_at: "2026-05-01T14:00:00Z",
      sourceIds: [srcMarkets.id],
    }),
    question("question-source-quality", {
      priority: "medium",
      text: "Which reports are independently corroborated?",
      created_at: "2026-05-01T16:00:00Z",
    }),
    question("question-chain-of-command", {
      priority: "high",
      text: "Where is the chain-of-command break?",
      created_at: "2026-04-28T16:00:00Z",
    }),
    question("question-sanctions-lag", {
      priority: "low",
      text: "How much of this is delayed sanctions pressure?",
      created_at: "2026-05-01T17:00:00Z",
    }),
  ];
}

describe("buildContext", () => {
  test("context over an asOf-projected state excludes post-cutoff rows", () => {
    const s1 = { ...source("src-asof"), created_at: "2026-05-01T00:00:00Z" };
    const c1 = claim("claim-asof", [s1.id], {
      statement: "As-of context claim.",
      created_at: "2026-05-01T01:00:00Z",
    });
    const syn1 = synthesis("syn-asof", [c1.id], {
      title: "AsOf Context Synthesis",
      created_at: "2026-05-01T01:10:00Z",
      sourceIds: [s1.id],
    });
    const q1 = question("q-asof", {
      text: "Question after context cutoff?",
      created_at: "2026-05-01T03:00:00Z",
    });

    const beforeQuestion = buildContext(
      buildEffectiveState(load([s1, c1, syn1, q1]), { asOf: "2026-05-01T01:30:00Z" }),
      { profile: "alpha" },
    );

    expect(beforeQuestion.key_claims.map((row) => row.statement)).toEqual(["As-of context claim."]);
    expect(beforeQuestion.syntheses.map((row) => row.title)).toEqual(["AsOf Context Synthesis"]);
    expect(beforeQuestion.open_questions).toEqual([]);
  });

  test("empty state returns Empty workspace summary", () => {
    const state = fixtureState([]);
    const result = buildContext(state);
    expect(result.summary).toBe("Empty workspace.");
    expect(result.syntheses.length).toBe(0);
    expect(result.key_claims.length).toBe(0);
    expect(result.open_questions.length).toBe(0);
    expect(result.sources.length).toBe(0);
    expect(result.token_estimate).toBeGreaterThanOrEqual(0);
    expect(result.truncated).toBe(false);
  });

  test("default budget returns full small fixture untruncated", () => {
    const s1 = source("src1");
    const s2 = source("src2");
    const c1 = claim("c1", ["src1"], { importance: "high" });
    const c2 = claim("c2", ["src2"], { importance: "low" });
    const q1 = question("q1", { priority: "high" });
    const syn1 = synthesis("syn1", ["c1"], { importance: "high", sourceIds: ["src1"] });
    const state = fixtureState([s1, s2, c1, c2, q1, syn1]);
    const result = buildContext(state);
    expect(result.truncated).toBe(false);
    expect(result.syntheses.length).toBe(1);
    expect(result.key_claims.length).toBe(2);
    expect(result.open_questions.length).toBe(1);
    expect(result.sources.length).toBe(2);
  });

  test("maxTokens 50 forces heavy truncation", () => {
    const s1 = source("src1", { title: "A relatively descriptive source title number one" });
    const s2 = source("src2", { title: "Another descriptive source title number two" });
    const c1 = claim("c1", ["src1"], {
      importance: "low",
      statement: "A reasonably long claim statement number one explaining a fact.",
    });
    const c2 = claim("c2", ["src2"], {
      importance: "low",
      statement: "A reasonably long claim statement number two explaining another fact.",
    });
    const q1 = question("q1", {
      priority: "low",
      text: "A reasonably long question text asking why something is the case.",
    });
    const syn1 = synthesis("syn1", ["c1"], {
      title: "A reasonably long synthesis title number one",
    });
    const state = fixtureState([s1, s2, c1, c2, q1, syn1]);
    const baseline = buildContext(state, { includeWarnings: false });
    expect(baseline.token_estimate).toBeGreaterThan(50);
    const result = buildContext(state, { maxTokens: 50, includeWarnings: false });
    expect(result.truncated).toBe(true);
    const totalSelected =
      result.syntheses.length +
      result.key_claims.length +
      result.open_questions.length +
      result.sources.length;
    expect(totalSelected).toBeLessThan(6);
  });

  test("profile filter limits returned rows", () => {
    const s1 = source("src1", {});
    const c1 = claim("c1", ["src1"], { profile: "alpha" });
    const c2 = claim("c2", ["src1"], { profile: "beta" });
    const state = fixtureState([s1, c1, c2]);
    const result = buildContext(state, { profile: "beta" });
    expect(result.key_claims.length).toBe(1);
    expect(result.key_claims[0]!.id).toBe("c2");
    expect(result.meta.profile).toBe("beta");
  });

  test("profile context includes sources cited by selected claims even when the source has a different profile", () => {
    const s1 = source("srcShared");
    s1.scope = { profiles: ["research.v1"] };
    const c1 = claim("cTrade", ["srcShared"], { profile: "trade_map.v1" });
    const state = fixtureState([s1, c1]);
    const result = buildContext(state, { profile: "trade_map.v1" });
    expect(result.key_claims.map((c) => c.id)).toEqual(["cTrade"]);
    expect(result.sources.map((s) => s.id)).toEqual(["srcShared"]);
  });

  test("ranking: high importance synthesis appears before low, recency breaks ties", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const synLow = synthesis("synLow", ["c1"], {
      importance: "low",
      created_at: "2026-05-01T12:03:00Z",
    });
    const synHigh = synthesis("synHigh", ["c1"], {
      importance: "high",
      created_at: "2026-05-01T12:03:00Z",
    });
    const synHighOld = synthesis("synHighOld", ["c1"], {
      importance: "high",
      created_at: "2026-04-01T12:03:00Z",
    });
    const state = fixtureState([s1, c1, synLow, synHigh, synHighOld]);
    const result = buildContext(state);
    expect(result.syntheses[0]!.id).toBe("synHigh");
    expect(result.syntheses[1]!.id).toBe("synHighOld");
    expect(result.syntheses[2]!.id).toBe("synLow");
  });

  test("default scoring matches Iran-cracks-like golden fixture", async () => {
    const golden = await Bun.file(
      new URL("./fixtures/context-default-scoring-golden.json", import.meta.url),
    ).json() as ContextRankingGolden;
    const state = fixtureState(iranCracksLikeRows());

    const implicitDefault = buildContext(state, { profile: "alpha", includeWarnings: false });

    expect(contextRanking(implicitDefault)).toEqual(golden);
  });

  test("contested claim outranks non-contested at same importance", () => {
    const s1 = source("src1");
    const cPlain = claim("cPlain", ["src1"], { importance: "medium", confidence: "high" });
    const cContested = claim("cContested", ["src1"], {
      importance: "medium",
      confidence: "high",
      contested: true,
    });
    const state = fixtureState([s1, cPlain, cContested]);
    const result = buildContext(state);
    expect(result.key_claims[0]!.id).toBe("cContested");
    expect(result.key_claims[1]!.id).toBe("cPlain");
  });

  test("sources only include those cited by selected claims/syntheses", () => {
    const s1 = source("src1");
    const sUnused = source("srcUnused");
    const c1 = claim("c1", ["src1"]);
    const state = fixtureState([s1, sUnused, c1]);
    const result = buildContext(state);
    const ids = result.sources.map((s) => s.id);
    expect(ids).toContain("src1");
    expect(ids).not.toContain("srcUnused");
  });

  test("includeWarnings true passes through state warnings", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const danglingEntry: KnbRow = {
      schema_version: "knb.v1",
      id: "entDangling",
      kind: "entry",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { profiles: ["alpha"] },
      entry: { action: "retract", target_ids: ["missing-id"], reason: "test" },
    };
    const state = fixtureState([s1, c1, danglingEntry]);
    const result = buildContext(state, { includeWarnings: true });
    const stateForwarded = result.warnings.find((w) => w.code === "state_entry_target_missing");
    expect(stateForwarded).toBeDefined();
  });

  test("includeWarnings false suppresses warnings entirely", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const danglingEntry: KnbRow = {
      schema_version: "knb.v1",
      id: "entDangling",
      kind: "entry",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { profiles: ["alpha"] },
      entry: { action: "retract", target_ids: ["missing-id"], reason: "test" },
    };
    const state = fixtureState([s1, c1, danglingEntry]);
    const result = buildContext(state, { includeWarnings: false });
    expect(result.warnings.length).toBe(0);
  });

  test("info_gap_no_active_synthesis warning when no syntheses in scope", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const state = fixtureState([s1, c1]);
    const result = buildContext(state);
    const w = result.warnings.find((w) => w.code === "info_gap_no_active_synthesis");
    expect(w).toBeDefined();
  });

  test("info_gap_thin_evidence when a selected claim has fewer than 2 evidence entries", () => {
    const s1 = source("src1");
    const cThin = claim("cThin", ["src1"], { evidenceCount: 1 });
    const state = fixtureState([s1, cThin]);
    const result = buildContext(state);
    const w = result.warnings.find((w) => w.code === "info_gap_thin_evidence");
    expect(w).toBeDefined();
    expect(w!.message).toContain("1");
  });

  test("contested_claims_present warning when any selected claim is contested", () => {
    const s1 = source("src1");
    const cContested = claim("cContested", ["src1"], { contested: true });
    const state = fixtureState([s1, cContested]);
    const result = buildContext(state);
    const w = result.warnings.find((w) => w.code === "contested_claims_present");
    expect(w).toBeDefined();
  });

  test("deterministic order: same input produces same output", () => {
    const s1 = source("src1");
    const s2 = source("src2");
    const c1 = claim("c1", ["src1"], { importance: "high" });
    const c2 = claim("c2", ["src2"], { importance: "medium" });
    const q1 = question("q1", { priority: "high" });
    const syn1 = synthesis("syn1", ["c1", "c2"], { importance: "high" });
    const a = buildContext(fixtureState([s1, s2, c1, c2, q1, syn1]));
    const b = buildContext(fixtureState([s1, s2, c1, c2, q1, syn1]));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  test("meta.counts matches lengths of returned lists", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], { importance: "high" });
    const c2 = claim("c2", ["src1"], { importance: "medium" });
    const q1 = question("q1", { priority: "high" });
    const q2 = question("q2", { priority: "low" });
    const syn1 = synthesis("syn1", ["c1"], { importance: "high" });
    const state = fixtureState([s1, c1, c2, q1, q2, syn1]);
    const result = buildContext(state);
    expect(result.meta.counts.syntheses).toBe(result.syntheses.length);
    expect(result.meta.counts.claims).toBe(result.key_claims.length);
    expect(result.meta.counts.questions).toBe(result.open_questions.length);
    expect(result.meta.counts.sources).toBe(result.sources.length);
  });
});

describe("buildContext - claim ranking dimensions", () => {
  test("equal importance: higher confidence outranks lower", () => {
    const s1 = source("src1");
    const cMid = claim("cMid", ["src1"], { importance: "medium", confidence: "medium" });
    const cHigh = claim("cHigh", ["src1"], { importance: "medium", confidence: "high" });
    const cLow = claim("cLow", ["src1"], { importance: "medium", confidence: "low" });
    const state = fixtureState([s1, cMid, cHigh, cLow]);
    const r = buildContext(state);
    expect(r.key_claims.map((c) => c.id)).toEqual(["cHigh", "cMid", "cLow"]);
  });

  test("equal importance and confidence: higher information_depth outranks lower", () => {
    const s1 = source("src1");
    const cThin: ClaimRow = {
      ...claim("cThin", ["src1"], { importance: "medium", confidence: "high" }),
      assessment: {
        confidence: "high",
        importance: "medium",
        information_depth: { level: "thin", rationale: "r" },
      },
    };
    const cStrong: ClaimRow = {
      ...claim("cStrong", ["src1"], { importance: "medium", confidence: "high" }),
      assessment: {
        confidence: "high",
        importance: "medium",
        information_depth: { level: "strong", rationale: "r" },
      },
    };
    const state = fixtureState([s1, cThin, cStrong]);
    const r = buildContext(state);
    expect(r.key_claims[0]!.id).toBe("cStrong");
    expect(r.key_claims[1]!.id).toBe("cThin");
  });

  test("equal importance/confidence/depth: higher evidence count outranks lower", () => {
    const s1 = source("src1");
    const cFew = claim("cFew", ["src1"], {
      importance: "medium",
      confidence: "high",
      evidenceCount: 1,
    });
    const cMany = claim("cMany", ["src1"], {
      importance: "medium",
      confidence: "high",
      evidenceCount: 5,
    });
    const state = fixtureState([s1, cFew, cMany]);
    const r = buildContext(state);
    expect(r.key_claims[0]!.id).toBe("cMany");
    expect(r.key_claims[1]!.id).toBe("cFew");
  });

  test("equal everything-but-recency: newer claim outranks older", () => {
    const s1 = source("src1");
    const cOld = claim("cOld", ["src1"], {
      importance: "medium",
      confidence: "high",
      evidenceCount: 1,
      created_at: "2026-01-01T12:00:00Z",
    });
    const cNew = claim("cNew", ["src1"], {
      importance: "medium",
      confidence: "high",
      evidenceCount: 1,
      created_at: "2026-05-01T12:00:00Z",
    });
    const state = fixtureState([s1, cOld, cNew]);
    const r = buildContext(state);
    expect(r.key_claims[0]!.id).toBe("cNew");
    expect(r.key_claims[1]!.id).toBe("cOld");
  });

  test("contested ranks above non-contested only when other dimensions tie", () => {
    const s1 = source("src1");
    const cNonContestedHigh = claim("cNonContestedHigh", ["src1"], {
      importance: "high",
      confidence: "high",
    });
    const cContestedMid = claim("cContestedMid", ["src1"], {
      importance: "medium",
      confidence: "high",
      contested: true,
    });
    const state = fixtureState([s1, cNonContestedHigh, cContestedMid]);
    const r = buildContext(state);
    expect(r.key_claims[0]!.id).toBe("cNonContestedHigh");
    expect(r.key_claims[1]!.id).toBe("cContestedMid");
  });
});

describe("buildContext - question ranking", () => {
  test("priority outranks importance, then recency", () => {
    const qHighOld = question("qHighOld", {
      priority: "high",
      created_at: "2026-01-01T12:00:00Z",
    });
    const qHighNew = question("qHighNew", {
      priority: "high",
      created_at: "2026-05-01T12:00:00Z",
    });
    const qLow = question("qLow", { priority: "low" });
    const qMed = question("qMed", { priority: "medium" });
    const state = fixtureState([qLow, qMed, qHighOld, qHighNew]);
    const r = buildContext(state);
    expect(r.open_questions.map((q) => q.id)).toEqual([
      "qHighNew",
      "qHighOld",
      "qMed",
      "qLow",
    ]);
  });

  test("question with status 'resolved' or 'archived' is excluded", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const qOpen = question("qOpen", { priority: "high", status: "open" });
    const qResolved = question("qResolved", { priority: "high", status: "resolved" });
    const qArchived = question("qArchived", { priority: "high", status: "archived" });
    const state = fixtureState([s1, c1, qOpen, qResolved, qArchived]);
    const r = buildContext(state);
    const ids = r.open_questions.map((q) => q.id);
    expect(ids).toEqual(["qOpen"]);
  });
});

describe("buildContext - synthesis ranking and exclusion", () => {
  test("synthesis basis-depth tie-breaker after importance and recency", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const c2 = claim("c2", ["src1"]);
    const synShallow = synthesis("synShallow", ["c1"], {
      importance: "high",
      created_at: "2026-05-01T12:03:00Z",
    });
    const synDeep = synthesis("synDeep", ["c1", "c2"], {
      importance: "high",
      created_at: "2026-05-01T12:03:00Z",
      sourceIds: ["src1"],
    });
    const state = fixtureState([s1, c1, c2, synShallow, synDeep]);
    const r = buildContext(state);
    expect(r.syntheses[0]!.id).toBe("synDeep");
    expect(r.syntheses[1]!.id).toBe("synShallow");
  });

  test("synthesis with status 'archived' is excluded", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const synArchived: SynthesisRow = {
      ...synthesis("synArchived", ["c1"], { importance: "high" }),
      synthesis: {
        title: "T",
        summary: "S",
        basis: { claim_ids: ["c1"] },
        status: "archived",
      },
    };
    const synActive = synthesis("synActive", ["c1"], { importance: "high" });
    const state = fixtureState([s1, c1, synArchived, synActive]);
    const r = buildContext(state);
    expect(r.syntheses.map((s) => s.id)).toEqual(["synActive"]);
  });
});

describe("buildContext - sources cleanup and metadata", () => {
  test("source order follows ledger order when both are cited", () => {
    const sB = source("srcB");
    const sA = source("srcA");
    const c1 = claim("c1", ["srcB", "srcA"]);
    const state = fixtureState([sB, sA, c1]);
    const r = buildContext(state);
    expect(r.sources.map((s) => s.id)).toEqual(["srcB", "srcA"]);
  });

  test("source publisher and uri appear by default in output", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const state = fixtureState([s1, c1]);
    const r = buildContext(state);
    const cited = r.sources.find((s) => s.id === "src1");
    expect(cited?.publisher).toBe("Example Pub");
    expect(cited?.uri).toBe("https://example.com/src1");
  });

  test("merged duplicate source ids resolve to canonical source ids", () => {
    const canonical = source("srcCanonical", { title: "Canonical source" });
    const duplicate = source("srcDuplicate", { title: "Duplicate source" });
    const c1 = claim("c1", ["srcDuplicate"]);
    const merge: KnbRow = {
      schema_version: "knb.v1",
      id: "entMergeSource",
      kind: "entry",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { profiles: ["alpha"] },
      entry: {
        action: "merge",
        target_ids: ["srcDuplicate"],
        canonical_id: "srcCanonical",
        reason: "same source uri",
      },
    };
    const state = fixtureState([canonical, duplicate, c1, merge]);
    const r = buildContext(state);
    expect(r.key_claims[0]?.source_ids).toEqual(["srcCanonical"]);
    expect(r.sources.map((s) => s.id)).toEqual(["srcCanonical"]);
    expect(r.sources.map((s) => s.id)).not.toContain("srcDuplicate");
  });

  test("source becomes minimal (no publisher/uri) under tight budget but is not yet dropped", () => {
    const s1 = source("src1");
    const s2 = source("src2");
    const c1 = claim("c1", ["src1"], {
      importance: "high",
      statement: "Short claim one.",
    });
    const c2 = claim("c2", ["src2"], {
      importance: "high",
      statement: "Short claim two.",
    });
    const state = fixtureState([s1, s2, c1, c2]);
    const baseline = buildContext(state, { includeWarnings: false });
    const stripBudget = baseline.token_estimate - 1;
    const r = buildContext(state, { maxTokens: stripBudget, includeWarnings: false });
    expect(r.truncated).toBe(true);
    expect(r.sources.length).toBe(2);
    const stripped = r.sources.filter(
      (s) => s.publisher === undefined && s.uri === undefined,
    );
    expect(stripped.length).toBeGreaterThan(0);
  });
});

describe("buildContext - truncation invariants", () => {
  test("tight budget preserves the highest-ranked synthesis before high-importance claims when possible", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], {
      importance: "high",
      statement: "High importance claim one that is long enough to create budget pressure.",
    });
    const c2 = claim("c2", ["src1"], {
      importance: "high",
      statement: "High importance claim two that is long enough to create budget pressure.",
    });
    const c3 = claim("c3", ["src1"], {
      importance: "high",
      statement: "High importance claim three that is long enough to create budget pressure.",
    });
    const syn1 = synthesis("syn1", ["c1", "c2", "c3"], {
      title: "Anchor synthesis",
    });
    const state = fixtureState([s1, c1, c2, c3, syn1]);
    const baseline = buildContext(state, { includeWarnings: false });
    expect(baseline.token_estimate).toBeGreaterThan(40);

    const r = buildContext(state, { maxTokens: 40, includeWarnings: false });
    expect(r.truncated).toBe(true);
    expect(r.syntheses.map((s) => s.id)).toEqual(["syn1"]);
    expect(r.token_estimate).toBeLessThanOrEqual(40);
  });

  test("no-active-synthesis warning is based on scoped state, not post-truncation packet", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], { importance: "high" });
    const syn1 = synthesis("syn1", ["c1"], {
      title: "Very long synthesis title that cannot fit the artificial estimator budget",
    });
    const state = fixtureState([s1, c1, syn1]);
    const r = buildContext(state, {
      maxTokens: 1,
    });
    expect(r.truncated).toBe(true);
    expect(r.syntheses.length).toBe(0);
    const warningCodes = r.warnings.map((w) => w.code);
    expect(warningCodes).not.toContain("info_gap_no_active_synthesis");
    expect(warningCodes).not.toContain("info_gap_no_active_claims");
  });

  test("token_estimate <= maxTokens after truncation when reachable", () => {
    const s1 = source("src1", { title: "Long source title number one for budget" });
    const s2 = source("src2", { title: "Long source title number two for budget" });
    const c1 = claim("c1", ["src1"], {
      importance: "low",
      statement: "Reasonably wordy claim statement number one for the budget test.",
    });
    const c2 = claim("c2", ["src2"], {
      importance: "low",
      statement: "Reasonably wordy claim statement number two for the budget test.",
    });
    const q1 = question("q1", {
      priority: "low",
      text: "A wordy enough question that adds budget pressure.",
    });
    const syn1 = synthesis("syn1", ["c1"], {
      title: "A wordy synthesis title number one for the budget test",
    });
    const state = fixtureState([s1, s2, c1, c2, q1, syn1]);
    const r = buildContext(state, { maxTokens: 30, includeWarnings: false });
    expect(r.token_estimate).toBeLessThanOrEqual(30);
    expect(r.truncated).toBe(true);
  });

  test("meta.counts after truncation reflect FINAL counts (not pre-truncation)", () => {
    const s1 = source("src1", { title: "Long source title number one" });
    const c1 = claim("c1", ["src1"], {
      importance: "low",
      statement: "Wordy enough claim statement number one for budget.",
    });
    const c2 = claim("c2", ["src1"], {
      importance: "low",
      statement: "Wordy enough claim statement number two for budget.",
    });
    const c3 = claim("c3", ["src1"], {
      importance: "low",
      statement: "Wordy enough claim statement number three for budget.",
    });
    const state = fixtureState([s1, c1, c2, c3]);
    const r = buildContext(state, { maxTokens: 25, includeWarnings: false });
    expect(r.meta.counts.claims).toBe(r.key_claims.length);
    expect(r.meta.counts.sources).toBe(r.sources.length);
    expect(r.meta.counts.questions).toBe(r.open_questions.length);
    expect(r.meta.counts.syntheses).toBe(r.syntheses.length);
  });

  test("after dropping a claim that cited a source, the source is dropped if no other selected row cites it", () => {
    const sUsed = source("srcUsed", { title: "Source one with publisher and uri text body" });
    const sLow = source("srcLow", { title: "Source two with publisher and uri text body" });
    const cHigh = claim("cHigh", ["srcUsed"], {
      importance: "high",
      statement: "High importance claim statement that we want to retain.",
    });
    const cLow = claim("cLow", ["srcLow"], {
      importance: "low",
      statement: "Low importance claim statement that we want truncated away first.",
    });
    const state = fixtureState([sUsed, sLow, cHigh, cLow]);
    const baseline = buildContext(state, { includeWarnings: false });
    expect(baseline.sources.map((s) => s.id).sort()).toEqual(["srcLow", "srcUsed"]);
    const r = buildContext(state, { maxTokens: 20, includeWarnings: false });
    expect(r.truncated).toBe(true);
    const claimIds = r.key_claims.map((c) => c.id);
    if (!claimIds.includes("cLow")) {
      expect(r.sources.map((s) => s.id)).not.toContain("srcLow");
    }
  });

  test("maxTokens default (3000) does not truncate a small fixture", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], { importance: "high" });
    const state = fixtureState([s1, c1]);
    const r = buildContext(state);
    expect(r.truncated).toBe(false);
  });
});

describe("buildContext - warnings", () => {
  test("info_gap_no_active_claims when zero claims in scope", () => {
    const q1 = question("q1", { priority: "high" });
    const state = fixtureState([q1]);
    const r = buildContext(state);
    const w = r.warnings.find((w) => w.code === "info_gap_no_active_claims");
    expect(w).toBeDefined();
  });

  test("state warnings forwarded with state_ prefix preserve message", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const danglingEntry: KnbRow = {
      schema_version: "knb.v1",
      id: "entDangling",
      kind: "entry",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { profiles: ["alpha"] },
      entry: { action: "retract", target_ids: ["missing-id"], reason: "test" },
    };
    const state = fixtureState([s1, c1, danglingEntry]);
    const r = buildContext(state, { includeWarnings: true });
    const fwd = r.warnings.find((w) => w.code === "state_entry_target_missing");
    expect(fwd).toBeDefined();
    expect(fwd!.code.startsWith("state_")).toBe(true);
    expect(fwd!.message).toContain("missing-id");
  });

  test("no info_gap_thin_evidence when all claims meet the threshold", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], { evidenceCount: 2 });
    const c2 = claim("c2", ["src1"], { evidenceCount: 3 });
    const state = fixtureState([s1, c1, c2]);
    const r = buildContext(state);
    const w = r.warnings.find((w) => w.code === "info_gap_thin_evidence");
    expect(w).toBeUndefined();
  });

  test("no contested_claims_present when none are contested", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"], { contested: false });
    const state = fixtureState([s1, c1]);
    const r = buildContext(state);
    const w = r.warnings.find((w) => w.code === "contested_claims_present");
    expect(w).toBeUndefined();
  });
});

describe("buildContext - scope and meta", () => {
  test("subject filter sets meta.subject and excludes other-subject rows", () => {
    const s1 = source("src1");
    const cAlpha = claim("cAlpha", ["src1"]);
    const cBeta: ClaimRow = {
      ...claim("cBeta", ["src1"]),
      scope: { profiles: ["alpha"], subjects: ["Subject B"], tags: ["fact"] },
    };
    const state = fixtureState([s1, cAlpha, cBeta]);
    const r = buildContext(state, { subject: "Subject B" });
    expect(r.meta.subject).toBe("Subject B");
    expect(r.key_claims.map((c) => c.id)).toEqual(["cBeta"]);
  });

  test("tag filter sets meta.tag and intersects rows", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const cOtherTag: ClaimRow = {
      ...claim("cOtherTag", ["src1"]),
      scope: { profiles: ["alpha"], subjects: ["Subject A"], tags: ["other"] },
    };
    const state = fixtureState([s1, c1, cOtherTag]);
    const r = buildContext(state, { tag: "fact" });
    expect(r.meta.tag).toBe("fact");
    expect(r.key_claims.map((c) => c.id)).toEqual(["c1"]);
  });

  test("no scope filter leaves meta without profile/subject/tag", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const state = fixtureState([s1, c1]);
    const r = buildContext(state);
    expect(r.meta.profile).toBeUndefined();
    expect(r.meta.subject).toBeUndefined();
    expect(r.meta.tag).toBeUndefined();
  });
});

describe("buildContext - shape details", () => {
  test("ContextClaim source_ids is union of provenance.source_ids and evidence[].source_id, no duplicates", () => {
    const s1 = source("src1");
    const s2 = source("src2");
    const c1 = claim("c1", ["src1"], { evidenceCount: 0 });
    const cTwoSources: ClaimRow = {
      ...c1,
      provenance: {
        source_ids: ["src1", "src2"],
        evidence: [
          { source_id: "src1", role: "supports", summary: "dup" },
          { source_id: "src2", role: "supports", summary: "again" },
        ],
      },
    };
    const state = fixtureState([s1, s2, cTwoSources]);
    const r = buildContext(state);
    const got = r.key_claims[0]!;
    expect(got.source_ids.sort()).toEqual(["src1", "src2"].sort());
    expect(new Set(got.source_ids).size).toBe(got.source_ids.length);
  });

  test("ContextClaim time precedence valid_at > occurred_at > valid_from > reported_at", () => {
    const s1 = source("src1");
    const cValid: ClaimRow = {
      ...claim("cValid", ["src1"]),
      time: {
        precision: "day",
        valid_at: "2026-01-01T00:00:00Z",
        occurred_at: "2026-02-01T00:00:00Z",
        valid_from: "2026-03-01T00:00:00Z",
        reported_at: "2026-04-01T00:00:00Z",
      },
    };
    const cOccurred: ClaimRow = {
      ...claim("cOccurred", ["src1"]),
      time: {
        precision: "day",
        occurred_at: "2026-02-01T00:00:00Z",
        valid_from: "2026-03-01T00:00:00Z",
        reported_at: "2026-04-01T00:00:00Z",
      },
    };
    const cValidFrom: ClaimRow = {
      ...claim("cValidFrom", ["src1"]),
      time: {
        precision: "day",
        valid_from: "2026-03-01T00:00:00Z",
        reported_at: "2026-04-01T00:00:00Z",
      },
    };
    const cReported: ClaimRow = {
      ...claim("cReported", ["src1"]),
      time: {
        precision: "day",
        reported_at: "2026-04-01T00:00:00Z",
      },
    };
    const state = fixtureState([s1, cValid, cOccurred, cValidFrom, cReported]);
    const r = buildContext(state);
    const byId = (id: string) => r.key_claims.find((c) => c.id === id)!;
    expect(byId("cValid").time).toBe("2026-01-01T00:00:00Z");
    expect(byId("cOccurred").time).toBe("2026-02-01T00:00:00Z");
    expect(byId("cValidFrom").time).toBe("2026-03-01T00:00:00Z");
    expect(byId("cReported").time).toBe("2026-04-01T00:00:00Z");
  });

  test("ContextClaim contested true is preserved; false/undefined is omitted", () => {
    const s1 = source("src1");
    const cContested = claim("cContested", ["src1"], { contested: true });
    const cPlain = claim("cPlain", ["src1"], { contested: false });
    const state = fixtureState([s1, cContested, cPlain]);
    const r = buildContext(state);
    const byId = (id: string) => r.key_claims.find((c) => c.id === id)!;
    expect(byId("cContested").contested).toBe(true);
    expect(byId("cPlain").contested).toBeUndefined();
  });

  test("ContextSynthesis carries limitations when set, omits when absent", () => {
    const s1 = source("src1");
    const c1 = claim("c1", ["src1"]);
    const synWith: SynthesisRow = {
      ...synthesis("synWith", ["c1"]),
      synthesis: {
        title: "T",
        summary: "S",
        basis: { claim_ids: ["c1"] },
        status: "active",
        limitations: "Limitations here",
      },
    };
    const synWithout = synthesis("synWithout", ["c1"]);
    const state = fixtureState([s1, c1, synWith, synWithout]);
    const r = buildContext(state);
    const byId = (id: string) => r.syntheses.find((s) => s.id === id)!;
    expect(byId("synWith").limitations).toBe("Limitations here");
    expect(byId("synWithout").limitations).toBeUndefined();
  });
});

describe("buildContext - estimator behavior", () => {
  test("default ceil(chars/4) estimator produces predictable totals on empty workspace", () => {
    const r = buildContext(fixtureState([]));
    expect(r.token_estimate).toBeGreaterThan(0);
    expect(r.summary).toBe("Empty workspace.");
  });
});
