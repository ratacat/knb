import { describe, expect, test } from "bun:test";

import { selectEffectiveRows, matchesRowSelector, validateRowSelector } from "../src";
import type { ClaimRow, ExternalRef, KnbRow, SourceRow } from "../src/core/contract";
import { buildEffectiveState } from "../src/core/state";

function source(id: string): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T00:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["selectors"] },
    source: { type: "web_page", title: `Source ${id}`, uri: `https://example.com/${id}` },
    provenance: { acquisition: { method: "manual" } },
  };
}

function load(rows: KnbRow[]) {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

function claim(
  id: string,
  options: {
    type?: string;
    location?: string;
    collection?: string;
    tags?: string[];
    created_at?: string;
    score?: number;
    external_refs?: ExternalRef[];
  } = {},
): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: options.created_at ?? "2026-05-01T01:00:00Z",
    created_by: "agent:test",
    scope: {
      collections: [options.collection ?? "selectors"],
      ...(options.tags !== undefined ? { tags: options.tags } : {}),
    },
    ...(options.external_refs !== undefined ? { external_refs: options.external_refs } : {}),
    identity: { claim_key: `selector|${id}` },
    claim: {
      statement: `Statement ${id}.`,
      atomic: true,
      ...(options.type !== undefined ? { type: options.type } : {}),
      qualifiers: {
        ...(options.location !== undefined ? { location: options.location } : {}),
        ...(options.score !== undefined ? { score: options.score } : {}),
      },
    },
    time: { precision: "unknown" },
    provenance: { source_ids: ["src:selectors:20260501:aaaa1111"] },
    assessment: { confidence: "high" },
  };
}

describe("RowSelector", () => {
  test("matches one structured claim by claim.type and claim.qualifiers.location", () => {
    const rows: KnbRow[] = [
      source("src:selectors:20260501:aaaa1111"),
      claim("claim:selectors:20260501:bbbb2222", { type: "prediction", location: "tehran" }),
      claim("claim:selectors:20260501:cccc3333", { type: "prediction", location: "shiraz" }),
      claim("claim:selectors:20260501:dddd4444", { type: "observation", location: "tehran" }),
    ];

    const matched = rows.filter((row) =>
      matchesRowSelector(row, {
        kinds: ["claim"],
        where: [
          { path: "claim.type", eq: "prediction" },
          { path: "claim.qualifiers.location", eq: "tehran" },
        ],
      }),
    );

    expect(matched.map((row) => row.id)).toEqual(["claim:selectors:20260501:bbbb2222"]);
  });

  test("validation rejects unknown paths and malformed where clauses", () => {
    const result = validateRowSelector({
      where: [
        { path: "weather.location", eq: "tehran" },
        { path: "claim.type" },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "selector_unknown_path",
      "selector_clause_missing_operator",
    ]);
    expect(result.issues[0]?.path).toBe("where[0].path");
    expect(result.issues[1]?.path).toBe("where[1]");
  });

  test("validation rejects malformed closed fields and primitive operators", () => {
    const result = validateRowSelector({
      kinds: ["claims"],
      ids: ["claim:ok", 3],
      scope: { collections: ["selectors"], tags: [false] },
      external_refs: [{ system: "x", id: ["bad"] }],
      where: [
        { path: "claim.type", eq: ["prediction"] },
        { path: "claim.type", in: ["prediction", ["bad"]] },
      ],
    });

    expect(result.ok).toBe(false);
    expect(result.issues.map((issue) => issue.code)).toEqual([
      "selector_kinds_invalid",
      "selector_ids_invalid",
      "selector_scope_invalid",
      "selector_external_ref_invalid",
      "selector_eq_invalid",
      "selector_in_invalid",
    ]);
  });

  test("combines ids, scope, in-list, and exists predicates", () => {
    const rows: KnbRow[] = [
      claim("claim:selectors:20260501:aaaa1111", {
        type: "prediction",
        location: "tehran",
        tags: ["urgent"],
      }),
      claim("claim:selectors:20260501:bbbb2222", {
        type: "observation",
        location: "tehran",
        tags: ["urgent"],
      }),
      claim("claim:selectors:20260501:cccc3333", {
        type: "forecast",
        location: "shiraz",
        tags: ["slow"],
      }),
      claim("claim:selectors:20260501:dddd4444", {
        type: "forecast",
        tags: ["urgent"],
      }),
    ];

    const matched = rows.filter((row) =>
      matchesRowSelector(row, {
        ids: ["claim:selectors:20260501:aaaa1111", "claim:selectors:20260501:cccc3333"],
        scope: { collections: ["selectors"], tags: ["urgent"] },
        where: [
          { path: "claim.type", in: ["prediction", "forecast"] },
          { path: "claim.qualifiers.location", exists: true },
        ],
      }),
    );

    expect(matched.map((row) => row.id)).toEqual(["claim:selectors:20260501:aaaa1111"]);
  });

  test("matches external_refs plus numeric and timestamp ranges", () => {
    const rows: KnbRow[] = [
      claim("claim:selectors:20260501:aaaa1111", {
        type: "prediction",
        location: "tehran",
        score: 72,
        created_at: "2026-05-01T01:00:00Z",
        external_refs: [{ system: "kalshi", id: "KXIRAN-20260501", type: "market", path: "/markets/KXIRAN" }],
      }),
      claim("claim:selectors:20260501:bbbb2222", {
        type: "prediction",
        location: "tehran",
        score: 55,
        created_at: "2026-05-01T01:30:00Z",
        external_refs: [{ system: "kalshi", id: "KXIRAN-20260501", type: "market", path: "/markets/KXIRAN" }],
      }),
      claim("claim:selectors:20260501:cccc3333", {
        type: "prediction",
        location: "tehran",
        score: 75,
        created_at: "2026-05-03T01:00:00Z",
        external_refs: [{ system: "other", id: "KXIRAN-20260501", type: "market" }],
      }),
    ];

    const matched = rows.filter((row) =>
      matchesRowSelector(row, {
        external_refs: [{ system: "kalshi", id: "KXIRAN-20260501", type: "market" }],
        where: [
          { path: "created_at", gte: "2026-05-01T00:30:00Z", lte: "2026-05-02T00:00:00Z" },
          { path: "claim.qualifiers.score", gte: 70, lte: 80 },
        ],
      }),
    );

    expect(matched.map((row) => row.id)).toEqual(["claim:selectors:20260501:aaaa1111"]);
  });

  test("selectEffectiveRows filters active EffectiveRows deterministically", () => {
    const rows: KnbRow[] = [
      source("src:selectors:20260501:aaaa1111"),
      claim("claim:selectors:20260501:bbbb2222", { type: "prediction", location: "tehran" }),
      claim("claim:selectors:20260501:cccc3333", { type: "prediction", location: "tehran" }),
      {
        schema_version: "knb.v1",
        id: "chg:selectors:20260501:dddd4444",
        kind: "change",
        created_at: "2026-05-01T02:00:00Z",
        created_by: "agent:test",
        scope: { collections: ["selectors"] },
        change: {
          action: "retract",
          target_ids: ["claim:selectors:20260501:cccc3333"],
          reason: "withdrawn",
        },
      },
    ];
    const state = buildEffectiveState(load(rows));

    const selected = selectEffectiveRows(state.rows(), {
      kinds: ["claim"],
      where: [
        { path: "claim.type", eq: "prediction" },
        { path: "claim.qualifiers.location", eq: "tehran" },
      ],
    });

    expect(selected.map((effective) => effective.row.id)).toEqual(["claim:selectors:20260501:bbbb2222"]);
  });
});
