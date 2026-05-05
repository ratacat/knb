import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { appendFile, mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
import type { ApplyOperation, ApplyRequest, DraftRow } from "../src/core/contract";
import { isKnbError } from "../src/core/errors";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-wiring-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function deterministicRuntime(): { runtime: OpenKnbOptions["runtime"] } {
  let n = 0;
  return {
    runtime: {
      clock: () => new Date("2026-05-01T12:00:00Z"),
      randomIdPart: () => {
        n += 1;
        return n.toString(16).padStart(8, "0");
      },
    },
  };
}

async function openWiringKnb(): Promise<Knb> {
  const { runtime } = deterministicRuntime();
  const options: OpenKnbOptions = {
    root: workDir,
    actor: "agent:test",
    env: {},
    cwd: () => workDir,
  };
  if (runtime) options.runtime = runtime;
  return openKnb(options);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

function sourceDraft(profile = "wire"): DraftRow {
  return {
    kind: "source",
    scope: { profiles: [profile] },
    source: {
      type: "web_page",
      title: "A wiring source",
      uri: `https://example.com/${profile}`,
    },
    provenance: { acquisition: { method: "manual" } },
  } as DraftRow;
}

function claimDraft(sourceRef: string, profile = "wire", statement = "Wiring exists."): DraftRow {
  return {
    kind: "claim",
    scope: { profiles: [profile] },
    identity: { claim_key: `wire|${statement.toLowerCase()}` },
    claim: { statement, atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceRef],
      evidence: [{ source_id: sourceRef, role: "supports", summary: "Source backs the claim." }],
    },
    assessment: { confidence: "high" },
  } as DraftRow;
}

describe("Wave 7 wiring", () => {
  test("knb.add for a source row appends one row that lands in the ledger", async () => {
    const knb = await openWiringKnb();
    const result = await knb.add(sourceDraft());
    expect(result.created.length).toBe(1);
    expect(result.created[0]?.kind).toBe("source");
    const id = result.created[0]?.id;
    expect(typeof id).toBe("string");
    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledger.includes(id ?? "MISSING")).toBe(true);
    // ApplyResult shape sanity.
    expect(result.meta.rows_appended).toBe(1);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(result.meta.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(result.meta.fingerprint_after).toBeDefined();
    expect(typeof result.meta.fingerprint_after.content_hash).toBe("string");
    expect(result.meta.fingerprint_after.rows).toBe(1);
  });

  test("knb.add then knb.query finds the new row", async () => {
    const knb = await openWiringKnb();
    const added = await knb.add(sourceDraft("findme"));
    const id = added.created[0]?.id;
    const queryResult = await knb.query({ kinds: ["source"] });
    expect(queryResult.total_returned).toBeGreaterThanOrEqual(1);
    expect(queryResult.rows.some((row) => row.id === id)).toBe(true);
  });

  test("knb.add then knb.get returns the appended row", async () => {
    const knb = await openWiringKnb();
    const added = await knb.add(sourceDraft("getme"));
    const id = added.created[0]?.id ?? "";
    const got = await knb.get([id]);
    expect(got.rows.length).toBe(1);
    expect(got.rows[0]?.id).toBe(id);
    expect(got.rows[0]?.status).toBe("active");
    expect(got.rows[0]?.row.kind).toBe("source");
    expect(got.not_found).toEqual([]);
  });

  test("two separate add calls (source + claim referencing it by id) both succeed and get returns both", async () => {
    const knb = await openWiringKnb();
    const sourceResult = await knb.add(sourceDraft("link-by-id"));
    const sourceId = sourceResult.created[0]?.id ?? "";
    expect(sourceId.length).toBeGreaterThan(0);
    const claimResult = await knb.add(claimDraft(sourceId, "link-by-id", "Linked by id."));
    expect(claimResult.created.length).toBe(1);
    expect(claimResult.created[0]?.kind).toBe("claim");

    const claimId = claimResult.created[0]?.id ?? "";
    const got = await knb.get([sourceId, claimId]);
    expect(got.rows.length).toBe(2);
    const ids = got.rows.map((r) => r.id).sort();
    expect(ids).toEqual([claimId, sourceId].sort());
  });

  test("multi-op apply with $alias references resolves the new source id into the claim row", async () => {
    const knb = await openWiringKnb();
    const ops: ApplyOperation[] = [
      { op: "add", row: sourceDraft("multi"), as: "source" },
      { op: "add", row: claimDraft("$source", "multi", "Multi-op resolves aliases.") },
    ];
    const request: ApplyRequest = { operations: ops };
    const result = await knb.apply(request);
    expect(result.created.length).toBe(2);
    const sourceId = result.created[0]?.id ?? "";
    expect(sourceId.startsWith("src:multi:")).toBe(true);
    const claimId = result.created[1]?.id ?? "";
    const ledger = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const claimLine = ledger
      .split("\n")
      .find((line) => line.includes(claimId)) ?? "";
    expect(claimLine.includes(sourceId)).toBe(true);
    // Verify the alias is preserved in created entries.
    expect(result.created[0]?.as).toBe("source");
  });

  test("knb.check on a clean rendered+indexed workspace reports ok=true", async () => {
    const knb = await openWiringKnb();
    await knb.add(sourceDraft("ok-profile"));
    await knb.render({ profile: "ok-profile" });
    await knb.rebuildIndex();
    const result = await knb.check();
    expect(result.parse_issues).toEqual([]);
    expect(result.validation_issues).toEqual([]);
    expect(result.ok).toBe(true);
    const fresh = result.projection_freshness.entries.every((entry) => entry.state === "fresh");
    expect(fresh).toBe(true);
  });

  test("knb.render writes a markdown file on disk and returns its path", async () => {
    const knb = await openWiringKnb();
    const sourceResult = await knb.add(sourceDraft("render-test"));
    const sourceId = sourceResult.created[0]?.id ?? "";
    await knb.add(claimDraft(sourceId, "render-test", "Rendering works."));
    const rendered = await knb.render({ profile: "render-test" });
    expect(rendered.profile).toBe("render-test");
    expect(rendered.format).toBe("md");
    expect(rendered.path).toBe(join(workDir, "knb", "views", "render-test.md"));
    expect(await pathExists(rendered.path)).toBe(true);
    expect(await pathExists(rendered.metadata_path)).toBe(true);
    expect(rendered.bytes_written).toBeGreaterThan(0);
    expect(rendered.metadata.kind).toBe("view");
    expect(rendered.metadata.schema_version).toBe("knb.projection.v1");

    const md = await readFile(rendered.path, "utf8");
    expect(md.includes("Rendering works.")).toBe(true);
  });

  test("knb.render then ledger append makes the view stale on next check", async () => {
    const knb = await openWiringKnb();
    await knb.add(sourceDraft("stale-profile"));
    await knb.render({ profile: "stale-profile" });
    await knb.rebuildIndex();
    const beforeCheck = await knb.check();
    expect(beforeCheck.ok).toBe(true);

    // Append another row out-of-band to invalidate the fingerprint.
    const ledgerPath = join(workDir, "knb", "ledger.jsonl");
    const extraId = "src:stale-profile:20260501:cafef00d";
    const extraRow = {
      schema_version: "knb.v1",
      id: extraId,
      kind: "source",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { profiles: ["stale-profile"] },
      source: { type: "web_page", title: "Stale-maker", uri: "https://example.com/stale-extra" },
      provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T13:00:00Z" } },
    };
    await appendFile(ledgerPath, `${JSON.stringify(extraRow)}\n`, "utf8");

    const afterCheck = await knb.check();
    const viewEntry = afterCheck.projection_freshness.entries.find((entry) => entry.kind === "view");
    expect(viewEntry?.state).toBe("stale");
    expect(afterCheck.ok).toBe(false);
  });

  test("knb.context returns ContextResult shape and reflects an added claim", async () => {
    const knb = await openWiringKnb();
    const sourceResult = await knb.add(sourceDraft("ctx-test"));
    const sourceId = sourceResult.created[0]?.id ?? "";
    await knb.add(claimDraft(sourceId, "ctx-test", "Context wiring is hooked up."));

    const ctx = await knb.context({ profile: "ctx-test" });
    expect(Array.isArray(ctx.key_claims)).toBe(true);
    expect(ctx.key_claims.length).toBeGreaterThanOrEqual(1);
    expect(ctx.key_claims.some((c) => c.statement === "Context wiring is hooked up.")).toBe(true);
    expect(ctx.meta.profile).toBe("ctx-test");
    expect(typeof ctx.token_estimate).toBe("number");
  });

  test("knb.apply throws KnbError (not raw Error) for invalid operations", async () => {
    const knb = await openWiringKnb();
    let caught: unknown;
    try {
      // Missing required fields → should fail validation inside apply.
      await knb.apply({ operations: [{ op: "add", row: { kind: "source" } as DraftRow }] });
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect(typeof (caught as { code?: unknown }).code).toBe("string");
  });

  test("the CLI public re-export Knb shape includes the methods used end-to-end", async () => {
    const knb = await openWiringKnb();
    // Smoke through every method shape used by the CLI/host side.
    expect(typeof knb.init).toBe("function");
    expect(typeof knb.status).toBe("function");
    expect(typeof knb.schema).toBe("function");
    expect(typeof knb.apply).toBe("function");
    expect(typeof knb.add).toBe("function");
    expect(typeof knb.get).toBe("function");
    expect(typeof knb.query).toBe("function");
    expect(typeof knb.context).toBe("function");
    expect(typeof knb.render).toBe("function");
    expect(typeof knb.check).toBe("function");
    expect(typeof knb.rebuildIndex).toBe("function");
  });
});
