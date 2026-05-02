import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
import type { ApplyOperation, DraftRow } from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { V1_INDEX_NAMES } from "../src/core/projections";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-novproj-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function makeStubAllocator(): (bytes: number) => string {
  let n = 0;
  return () => {
    n += 1;
    return `a${n.toString(16).padStart(7, "0")}`;
  };
}

async function openTestKnb(): Promise<Knb> {
  const options: OpenKnbOptions = {
    root: workDir,
    actor: "agent:test",
    env: {},
    cwd: () => workDir,
    runtime: {
      clock: () => new Date("2026-05-01T12:00:00Z"),
      randomIdPart: makeStubAllocator(),
    },
  };
  return openKnb(options);
}

function sourceDraft(collection: string, suffix = ""): DraftRow {
  const tag = suffix.length > 0 ? `-${suffix}` : "";
  return {
    kind: "source",
    scope: { collections: [collection] },
    source: {
      type: "web_page",
      title: `Source${tag}`,
      uri: `https://example.com/${collection}${tag}`,
    },
    provenance: { acquisition: { method: "manual" } },
  } as DraftRow;
}

type ClaimExtras = {
  claim_key?: string;
  validAt?: string;
  evidenceSummary?: string;
};

function claimDraft(
  sourceRef: string,
  collection: string,
  statement: string,
  extras: ClaimExtras = {},
): DraftRow {
  const time: Record<string, unknown> = { precision: "unknown" };
  if (extras.validAt !== undefined) {
    time.precision = "day";
    time.valid_at = extras.validAt;
  }
  return {
    kind: "claim",
    scope: { collections: [collection] },
    identity: extras.claim_key !== undefined ? { claim_key: extras.claim_key } : {},
    claim: { statement, atomic: true },
    time,
    provenance: {
      source_ids: [sourceRef],
      evidence: [
        {
          source_id: sourceRef,
          role: "supports",
          summary: extras.evidenceSummary ?? "Source backs the claim.",
        },
      ],
    },
    assessment: { confidence: "high" },
  } as DraftRow;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

describe("novelty integration through apply", () => {
  test("identical statements without dedupe append both rows; classification reported", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("nodedupe"), as: "src" },
        { op: "add", row: claimDraft("$src", "nodedupe", "Same statement.") },
      ],
    });
    expect(seed.created.length).toBe(2);

    const second = await knb.apply({
      operations: [
        { op: "add", row: claimDraft(seed.created[0]!.id, "nodedupe", "Same statement.") },
      ],
      dedupe: false,
    });
    expect(second.created.length).toBe(1);
    expect(second.skipped.length).toBe(0);
    const noveltyEntry = second.novelty[0];
    expect(noveltyEntry).toBeDefined();
    expect(["corroboration", "duplicate"]).toContain(noveltyEntry!.classification);
    expect(noveltyEntry!.matched_ids.length).toBeGreaterThanOrEqual(1);

    // Ledger must contain BOTH claims.
    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const lines = ledger.trim().split("\n");
    expect(lines.length).toBe(3); // source + 2 claims
  });

  test("duplicate classification with dedupe=false STILL appends; classification recorded only", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("alsodup"), as: "src" },
        { op: "add", row: claimDraft("$src", "alsodup", "Same.", { claim_key: "alsodup|a" }) },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";
    const claimId = seed.created[1]?.id ?? "";
    expect(claimId.length).toBeGreaterThan(0);

    const second = await knb.apply({
      operations: [
        { op: "add", row: claimDraft(sourceId, "alsodup", "Same.", { claim_key: "alsodup|a" }) },
      ],
      // dedupe omitted defaults to false
    });
    expect(second.created.length).toBe(1);
    expect(second.skipped.length).toBe(0);
    expect(second.novelty[0]?.classification).toBe("duplicate");
    expect(second.novelty[0]?.matched_ids).toContain(claimId);
    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledger.trim().split("\n").length).toBe(3);
  });

  test("identical claim_key with dedupe true: second is skipped", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("dd"), as: "src" },
        { op: "add", row: claimDraft("$src", "dd", "Statement A.", { claim_key: "dd|a" }) },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";
    const claimId = seed.created[1]?.id ?? "";

    const second = await knb.apply({
      operations: [
        { op: "add", row: claimDraft(sourceId, "dd", "Statement A.", { claim_key: "dd|a" }) },
      ],
      dedupe: true,
    });
    expect(second.created.length).toBe(0);
    expect(second.skipped.length).toBe(1);
    expect(second.skipped[0]?.reason).toContain(claimId);
    expect(second.skipped[0]?.matched_ids).toEqual([claimId]);
    expect(second.novelty[0]?.classification).toBe("duplicate");

    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const lines = ledger.trim().split("\n");
    expect(lines.length).toBe(2);
  });

  test("multi-op batch: dedupe on op1 + synthesis basis $op1 resolves to canonical id", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("multi"), as: "src" },
        { op: "add", row: claimDraft("$src", "multi", "Multi statement.", { claim_key: "multi|a" }) },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";
    const canonicalClaimId = seed.created[1]?.id ?? "";
    expect(canonicalClaimId.length).toBeGreaterThan(0);

    const batch = await knb.apply({
      operations: [
        {
          op: "add",
          row: claimDraft(sourceId, "multi", "Multi statement.", { claim_key: "multi|a" }),
          as: "dup",
        },
        {
          op: "add",
          row: {
            kind: "synthesis",
            scope: { collections: ["multi"] },
            synthesis: {
              title: "Multi synthesis",
              summary: "Summarizes multi.",
              basis: { claim_ids: ["$dup"] },
              status: "active",
            },
          } as DraftRow,
        },
      ],
      dedupe: true,
    });

    expect(batch.skipped.length).toBe(1);
    expect(batch.created.length).toBe(1);
    const synthesisId = batch.created[0]?.id ?? "";

    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const synthesisLine = ledger.split("\n").find((line) => line.includes(synthesisId));
    expect(synthesisLine).toBeDefined();
    expect(synthesisLine!.includes(canonicalClaimId)).toBe(true);
    expect(synthesisLine!.includes("$dup")).toBe(false);
    // Ledger has source + canonical claim + synthesis (no duplicate appended).
    expect(ledger.trim().split("\n").length).toBe(3);
  });

  test("two duplicates of the same claim in one batch: in-batch dedupe is NOT supported; both append", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [{ op: "add", row: sourceDraft("twodup"), as: "src" }],
    });
    const sourceId = seed.created[0]?.id ?? "";

    const batch = await knb.apply({
      operations: [
        { op: "add", row: claimDraft(sourceId, "twodup", "Identical claim.", { claim_key: "twodup|x" }), as: "first" },
        { op: "add", row: claimDraft(sourceId, "twodup", "Identical claim.", { claim_key: "twodup|x" }), as: "second" },
      ],
      dedupe: true,
    });
    expect(batch.created.length).toBe(2);
    expect(batch.skipped.length).toBe(0);
    expect(batch.novelty[0]?.classification).toBe("new");
    expect(batch.novelty[1]?.classification).toBe("new");

    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const lines = ledger.trim().split("\n");
    expect(lines.length).toBe(3);
  });

  test("dedupe with ambiguous match (two existing duplicates): throws duplicate_blocked", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("amb"), as: "src" },
        { op: "add", row: claimDraft("$src", "amb", "Ambiguous statement.", { claim_key: "amb|one" }) },
        { op: "add", row: claimDraft("$src", "amb", "Ambiguous statement.", { claim_key: "amb|two" }) },
      ],
    });
    expect(seed.created.length).toBe(3);
    const sourceId = seed.created[0]?.id ?? "";

    let caught: unknown;
    try {
      await knb.apply({
        operations: [
          { op: "add", row: claimDraft(sourceId, "amb", "Ambiguous statement.") },
        ],
        dedupe: true,
      });
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("duplicate_blocked");
    // Ambiguous reject must not append anything.
    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledger.trim().split("\n").length).toBe(3);
  });

  test("knb.novelty classifies candidates without writing to the ledger", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("classify"), as: "src" },
        { op: "add", row: claimDraft("$src", "classify", "Existing thing.", { claim_key: "classify|a" }) },
      ],
    });
    const ledgerBefore = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const linesBefore = ledgerBefore.trim().split("\n").length;

    const result = await knb.novelty({
      candidates: [
        {
          kind: "claim",
          scope: { collections: ["classify"] },
          identity: { claim_key: "classify|a" },
          claim: { statement: "Existing thing.", atomic: true },
          time: { precision: "unknown" },
          provenance: {
            source_ids: [seed.created[0]!.id],
            evidence: [{ source_id: seed.created[0]!.id, role: "supports", summary: "X" }],
          },
          assessment: { confidence: "high" },
        },
      ],
    });
    expect(result.results.length).toBe(1);
    expect(["duplicate", "corroboration"]).toContain(result.results[0]!.classification);

    const ledgerAfter = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const linesAfter = ledgerAfter.trim().split("\n").length;
    expect(linesAfter).toBe(linesBefore);
  });

  test("knb.novelty on empty candidates returns empty results", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("e") }] });
    const result = await knb.novelty({ candidates: [] });
    expect(result.results).toEqual([]);
  });

  test("corroboration: identical statement plus a NEW supporting source -> classification reports corroboration", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("corr"), as: "srcA" },
        { op: "add", row: claimDraft("$srcA", "corr", "Stable fact.", { claim_key: "corr|a" }) },
      ],
    });
    const sourceA = seed.created[0]?.id ?? "";

    const second = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("corr", "two"), as: "srcB" },
        {
          op: "add",
          row: claimDraft("$srcB", "corr", "Stable fact.", {
            claim_key: "corr|a",
            evidenceSummary: "Second source corroborates.",
          }),
        },
      ],
    });
    expect(second.created.length).toBe(2);
    const claimNovelty = second.novelty.find((n) => n.op === 1);
    expect(claimNovelty?.classification).toBe("corroboration");
    expect(claimNovelty?.matched_ids.length).toBeGreaterThanOrEqual(1);
    expect(claimNovelty?.matched_ids[0]).not.toBe(second.created[1]?.id);
    expect(sourceA.length).toBeGreaterThan(0);
  });

  test("update: same claim_key with a different valid_at -> classification reports update", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("upd"), as: "src" },
        {
          op: "add",
          row: claimDraft("$src", "upd", "Time-bound fact.", {
            claim_key: "upd|a",
            validAt: "2026-04-01",
          }),
        },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";

    const second = await knb.apply({
      operations: [
        {
          op: "add",
          row: claimDraft(sourceId, "upd", "Time-bound fact.", {
            claim_key: "upd|a",
            validAt: "2026-05-01",
          }),
        },
      ],
    });
    expect(second.created.length).toBe(1);
    expect(second.novelty[0]?.classification).toBe("update");
  });

  test("dedupe ignores RETRACTED prior claim — second add is NEW (not skipped)", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("ret"), as: "src" },
        { op: "add", row: claimDraft("$src", "ret", "Will be retracted.", { claim_key: "ret|a" }) },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";
    const claimId = seed.created[1]?.id ?? "";
    await knb.apply({
      operations: [{ op: "retract", target_ids: [claimId], reason: "wrong" }],
    });

    const second = await knb.apply({
      operations: [
        { op: "add", row: claimDraft(sourceId, "ret", "Will be retracted.", { claim_key: "ret|a" }) },
      ],
      dedupe: true,
    });
    expect(second.created.length).toBe(1);
    expect(second.skipped.length).toBe(0);
    expect(second.novelty[0]?.classification).toBe("new");
  });
});

describe("projection integration through render / rebuildIndex / check", () => {
  test("render writes a markdown file under views and a sidecar matching the current ledger fingerprint", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("rend"), as: "src" },
        { op: "add", row: claimDraft("$src", "rend", "Render me.") },
      ],
    });

    const render = await knb.render({ collection: "rend" });
    const expectedView = join(workDir, "knb", "views", "rend.md");
    expect(render.path).toBe(expectedView);
    expect(await fileExists(expectedView)).toBe(true);

    const sidecarPath = `${expectedView}.meta.json`;
    expect(render.metadata_path).toBe(sidecarPath);
    expect(await fileExists(sidecarPath)).toBe(true);

    const sidecar = JSON.parse(await readFile(sidecarPath, "utf8")) as Record<string, unknown>;
    expect(sidecar.schema_version).toBe("knb.projection.v1");
    expect((sidecar.ledger as { content_hash?: string }).content_hash).toBe(
      render.metadata.ledger.content_hash,
    );
  });

  test("render twice in a row produces byte-identical output", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("det"), as: "src" },
        { op: "add", row: claimDraft("$src", "det", "Determinism.") },
      ],
    });

    await knb.render({ collection: "det" });
    const firstBody = await readFile(join(workDir, "knb", "views", "det.md"), "utf8");
    await knb.render({ collection: "det" });
    const secondBody = await readFile(join(workDir, "knb", "views", "det.md"), "utf8");
    expect(secondBody).toBe(firstBody);
  });

  test("render then apply more rows then re-render produces DIFFERING output (fingerprint changed)", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("changes"), as: "src" },
        { op: "add", row: claimDraft("$src", "changes", "First fact.") },
      ],
    });
    const sourceId = seed.created[0]?.id ?? "";
    const first = await knb.render({ collection: "changes" });
    const firstBody = await readFile(first.path, "utf8");

    await knb.apply({
      operations: [
        { op: "add", row: claimDraft(sourceId, "changes", "Second fact.") },
      ],
    });

    const second = await knb.render({ collection: "changes" });
    const secondBody = await readFile(second.path, "utf8");
    expect(secondBody).not.toBe(firstBody);
    expect(second.metadata.ledger.content_hash).not.toBe(first.metadata.ledger.content_hash);
    expect(secondBody).toContain("Second fact.");
  });

  test("rebuildIndex writes all V1 indexes with .meta.json sidecars", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("idx") }] });
    const result = await knb.rebuildIndex();
    expect(result.indexes.length).toBe(V1_INDEX_NAMES.length);
    for (const entry of result.indexes) {
      expect(await fileExists(entry.path)).toBe(true);
      expect(await fileExists(entry.metadata_path)).toBe(true);
    }
    const names = result.indexes.map((e) => e.name).sort();
    expect(names).toEqual([...V1_INDEX_NAMES].sort());
  });

  test("after rebuildIndex, check projection_freshness reports all index entries fresh", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("freshall") }] });
    await knb.rebuildIndex();
    const result = await knb.check();
    const indexEntries = result.projection_freshness.entries.filter((e) => e.kind === "index");
    expect(indexEntries.length).toBe(V1_INDEX_NAMES.length);
    expect(indexEntries.every((e) => e.state === "fresh")).toBe(true);
  });

  test("after rebuild + render, then a new apply, indexes and views are reported stale", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("staleall") }] });
    await knb.rebuildIndex();
    await knb.render({ collection: "staleall" });

    const before = await knb.check();
    expect(before.projection_freshness.entries.every((e) => e.state === "fresh")).toBe(true);
    expect(before.ok).toBe(true);

    await knb.apply({ operations: [{ op: "add", row: sourceDraft("staleall", "two") }] });

    const after = await knb.check();
    const indexEntries = after.projection_freshness.entries.filter((e) => e.kind === "index");
    const viewEntries = after.projection_freshness.entries.filter((e) => e.kind === "view");
    expect(indexEntries.every((e) => e.state === "stale")).toBe(true);
    expect(viewEntries.every((e) => e.state === "stale")).toBe(true);
    // Stale projections cause overall check.ok = false.
    expect(after.ok).toBe(false);
  });

  test("render with out path outside workspace views throws validation_failed", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("oob") }] });

    let caught: unknown;
    try {
      await knb.render({ collection: "oob", out: "/tmp/elsewhere/oob.md" });
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("validation_failed");
  });

  test("render with relative out under views stays inside views and freshness picks it up", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("subdir"), as: "src" },
        { op: "add", row: claimDraft("$src", "subdir", "Sub.") },
      ],
    });
    const result = await knb.render({ collection: "subdir", out: "deep/inside/out.md" });
    const expected = join(workDir, "knb", "views", "deep", "inside", "out.md");
    expect(result.path).toBe(expected);
    expect(await fileExists(expected)).toBe(true);
    expect(await fileExists(`${expected}.meta.json`)).toBe(true);
    await knb.rebuildIndex();
    const check = await knb.check();
    const viewEntry = check.projection_freshness.entries.find(
      (e) => e.target === "knb/views/deep/inside/out.md",
    );
    expect(viewEntry?.state).toBe("fresh");
  });

  test("active-claims-by-key index includes only claims with claim_key", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("ckidx"), as: "src" },
        { op: "add", row: claimDraft("$src", "ckidx", "With key.", { claim_key: "ckidx|a" }) },
        { op: "add", row: claimDraft("$src", "ckidx", "Without key.") },
      ],
    });
    await knb.rebuildIndex();
    const indexPath = join(workDir, "knb", "indexes", "active-claims-by-key.json");
    const data = JSON.parse(await readFile(indexPath, "utf8")) as Record<string, string>;
    expect(Object.keys(data)).toEqual(["ckidx|a"]);
  });

  test("active-sources-by-uri index includes only sources with a source.uri", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("uridx") },
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["uridx"] },
            source: { type: "raw_note", title: "No uri", raw_path: "notes/x.md" },
            provenance: { acquisition: { method: "manual" } },
          } as DraftRow,
        },
      ],
    });
    await knb.rebuildIndex();
    const indexPath = join(workDir, "knb", "indexes", "active-sources-by-uri.json");
    const data = JSON.parse(await readFile(indexPath, "utf8")) as Record<string, string>;
    const uris = Object.keys(data);
    expect(uris.length).toBe(1);
    expect(uris[0]).toBe("https://example.com/uridx");
  });

  test("rebuildIndex after retract: retracted claim is absent from active-by-id", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("retidx"), as: "src" },
        { op: "add", row: claimDraft("$src", "retidx", "About to die.", { claim_key: "retidx|a" }) },
      ],
    });
    const claimId = seed.created[1]?.id ?? "";
    await knb.apply({
      operations: [{ op: "retract", target_ids: [claimId], reason: "wrong" }],
    });
    await knb.rebuildIndex();

    const byId = JSON.parse(
      await readFile(join(workDir, "knb", "indexes", "active-by-id.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(byId[claimId]).toBeUndefined();
    const byKey = JSON.parse(
      await readFile(join(workDir, "knb", "indexes", "active-claims-by-key.json"), "utf8"),
    ) as Record<string, string>;
    expect(byKey["retidx|a"]).toBeUndefined();
  });
});
