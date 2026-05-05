import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

import { openKnb } from "../src/index";
import * as publicApi from "../src/index";
import * as knbModule from "../src/core/knb";
import {
  jsonSchema,
  rowSamples,
  operationSamples,
  type ApplyOperation,
  type ChangeRow,
  type ClaimRow,
  type QuestionRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { openWorkspace } from "../src/core/workspace";
import { defaultProjectState, readSnapshot } from "../src/core/read-snapshot";
import { V1_INDEX_NAMES } from "../src/core/projections";
import type { RunManifest } from "../src/core/run-manifests";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-facade-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function makeOpenOptions(): { root: string; env: NodeJS.ProcessEnv; cwd: () => string } {
  return { root: workDir, env: {}, cwd: () => workDir };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function seedLedger(text: string): Promise<string> {
  const path = join(workDir, "knb", "ledger.jsonl");
  await mkdir(join(workDir, "knb"), { recursive: true });
  await writeFile(path, text, "utf8");
  return path;
}

function jsonl(rows: object[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

async function seedRunManifests(manifests: RunManifest[]): Promise<void> {
  const runsDir = join(workDir, ".knb", "runs");
  await mkdir(runsDir, { recursive: true });
  for (const manifest of manifests) {
    await writeFile(join(runsDir, `${manifest.run_id}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
}

function manifest(
  run_id: string,
  actor: string,
  completed_at: string,
  row_ids: string[],
  intent?: string,
): RunManifest {
  const result: RunManifest = {
    schema_version: "knb.run.v1",
    run_id,
    actor,
    started_at: completed_at,
    completed_at,
    rows_appended: row_ids.length,
    row_ids,
  };
  if (intent !== undefined) result.intent = intent;
  return result;
}

function freshSourceRow(id = "src:facade:20260501:aaaa1111"): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    source: {
      type: "web_page",
      title: "Facade source",
      uri: `https://example.com/${id}`,
    },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
  };
}

function freshClaimRow(sourceId: string, id = "claim:facade:20260501:bbbb2222"): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    identity: { claim_key: "facade|exists" },
    claim: { statement: "Facade exists.", atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Source supports the claim." }],
    },
    assessment: { confidence: "high" },
  };
}

function freshRetractChange(targetId: string, id = "chg:facade:20260501:cccc3333"): ChangeRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "change",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    change: {
      action: "retract",
      target_ids: [targetId],
      reason: "test retract",
    },
  };
}

describe("openKnb", () => {
  test("returns a Knb facade with workspace pointed at root and a runtime", async () => {
    const knb = await openKnb(makeOpenOptions());
    expect(knb.workspace.root).toBe(workDir);
    expect(typeof knb.runtime.clock).toBe("function");
    expect(typeof knb.runtime.randomIdPart).toBe("function");
    const date = knb.runtime.clock();
    expect(date instanceof Date).toBe(true);
    const part = knb.runtime.randomIdPart(4);
    expect(typeof part).toBe("string");
    expect(part.length).toBeGreaterThan(0);
  });

  test("facade exposes every documented method as a function", async () => {
    const knb = await openKnb(makeOpenOptions());
    const expected = [
      "init",
      "status",
      "collectionStatus",
      "collections",
      "schema",
      "log",
      "apply",
      "previewApply",
      "add",
      "get",
      "query",
      "context",
      "novelty",
      "render",
      "renderAll",
      "check",
      "rebuildIndex",
    ] as const;
    for (const name of expected) {
      expect(typeof knb[name]).toBe("function");
    }
    expect(knb.workspace).toBeDefined();
    expect(knb.runtime).toBeDefined();
  });

  test("default runtime is provided when none injected and matches defaultRuntime()", async () => {
    const knb = await openKnb(makeOpenOptions());
    const baseline = knbModule.defaultRuntime();
    expect(typeof baseline.clock).toBe("function");
    expect(typeof baseline.randomIdPart).toBe("function");
    expect(typeof knb.runtime.clock()).toBe("object");
    expect(knb.runtime.clock() instanceof Date).toBe(true);
    const part = knb.runtime.randomIdPart(4);
    expect(part).toMatch(/^[0-9a-f]+$/);
    expect(part.length).toBeLessThanOrEqual(8);
  });

  test("accepts actor override", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    expect(knb.workspace.actor).toBe("agent:test");
  });

  test("actor resolution: KNB_ACTOR env beats git/system fallback", async () => {
    const knb = await openKnb({
      root: workDir,
      env: { KNB_ACTOR: "agent:from-env" },
      cwd: () => workDir,
    });
    expect(knb.workspace.actor).toBe("agent:from-env");
  });

  test("actor resolution: explicit option beats KNB_ACTOR env", async () => {
    const knb = await openKnb({
      root: workDir,
      actor: "agent:explicit",
      env: { KNB_ACTOR: "agent:from-env" },
      cwd: () => workDir,
    });
    expect(knb.workspace.actor).toBe("agent:explicit");
  });

  test("runtime clock and randomIdPart can be injected", async () => {
    const fixedDate = new Date("2026-05-01T00:00:00Z");
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: {
        clock: () => fixedDate,
        randomIdPart: () => "deadbeef",
      },
    });
    expect(knb.runtime.clock()).toBe(fixedDate);
    expect(knb.runtime.randomIdPart(4)).toBe("deadbeef");
  });

  test("partial runtime override still uses default for the other slot", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: { randomIdPart: () => "stable99" },
    });
    expect(knb.runtime.randomIdPart(4)).toBe("stable99");
    expect(knb.runtime.clock() instanceof Date).toBe(true);
  });

  test("injected clock flows through apply() to the created row's created_at", async () => {
    const fixedDate = new Date("2026-04-01T08:09:10.000Z");
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:clock-test",
      runtime: {
        clock: () => fixedDate,
        randomIdPart: () => "abcd1234",
      },
    });
    const result = await knb.add({
      kind: "source",
      scope: { collections: ["clocktest"] },
      source: { type: "web_page", title: "X", uri: "https://example.com/x" },
      provenance: { acquisition: { method: "manual" } },
    });
    expect(result.created.length).toBe(1);
    const id = result.created[0]?.id ?? "";
    expect(id.endsWith(":abcd1234")).toBe(true);
    expect(id.startsWith("src:clocktest:20260401:")).toBe(true);
    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const row = JSON.parse(ledgerText.trim()) as { created_at: string; created_by: string };
    expect(row.created_at).toBe(fixedDate.toISOString());
    expect(row.created_by).toBe("agent:clock-test");
  });

  test("previewApply reports planned rows without mutating the ledger", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: {
        clock: () => new Date("2026-04-01T08:09:10.000Z"),
        randomIdPart: () => "feed0001",
      },
    });

    const result = await knb.previewApply({
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["preview"] },
            source: { type: "web_page", title: "Preview", uri: "https://example.com/preview" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    });

    expect(result.created.length).toBe(1);
    expect(result.meta.dry_run).toBe(true);
    expect(result.meta.planned_rows).toBe(1);
    expect(result.meta.rows_appended).toBe(0);
    const status = await knb.status();
    expect(status.row_count).toBe(0);
  });

  test("ledgerPath override is reflected in workspace.paths.ledger", async () => {
    const customLedger = join(workDir, "custom-ledger.jsonl");
    const knb = await openKnb({ ...makeOpenOptions(), ledgerPath: customLedger });
    expect(knb.workspace.paths.ledger).toBe(customLedger);
  });

  test("configPath override is reflected in workspace.configPath", async () => {
    const customConfigDir = join(workDir, "alt");
    await mkdir(customConfigDir, { recursive: true });
    const customConfigPath = join(customConfigDir, "knb-config.json");
    await writeFile(customConfigPath, JSON.stringify({ actor: "agent:from-cfg" }), "utf8");
    const knb = await openKnb({
      root: workDir,
      env: {},
      cwd: () => workDir,
      configPath: customConfigPath,
    });
    expect(knb.workspace.configPath).toBe(customConfigPath);
    expect(knb.workspace.actor).toBe("agent:from-cfg");
  });

  test("openKnb with no options falls back to cwd as root", async () => {
    const cwdProvider = () => workDir;
    // We can't change real process.cwd, but we can pass an empty options object
    // and rely on env/cwd defaults. Provide cwd to keep test hermetic.
    const knb = await openKnb({ env: {}, cwd: cwdProvider });
    expect(knb.workspace.root).toBe(workDir);
  });
});

describe("Knb.init", () => {
  test("creates config, ledger, schema, views and indexes on an empty tmp", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    const result = await knb.init();
    expect(result.workspace_root).toBe(workDir);
    expect(result.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(result.config_path).toBe(join(workDir, ".knb", "config.json"));
    expect(result.schema_path).toBe(join(workDir, "knb", "schema.json"));
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "ledger.jsonl"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "schema.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "views"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "indexes"))).toBe(true);

    const schemaText = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    expect(schemaText).toBe(`${JSON.stringify(jsonSchema(), null, 2)}\n`);

    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe("{}\n");

    expect(result.created_paths).toContain(join(".knb", "config.json"));
    expect(result.created_paths).toContain(join("knb", "ledger.jsonl"));
    expect(result.created_paths).toContain(join("knb", "schema.json"));
    expect(result.created_paths).toContain(join("knb", "views"));
    expect(result.created_paths).toContain(join("knb", "indexes"));
  });

  test("init with explicit actor persists actor into config.json", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:claude-research" });
    await knb.init({ actor: "agent:claude-research" });
    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    const parsed = JSON.parse(configText) as { actor?: string };
    expect(parsed.actor).toBe("agent:claude-research");

    const reopened = await openKnb({ root: workDir, env: {}, cwd: () => workDir });
    expect(reopened.workspace.actor).toBe("agent:claude-research");
  });

  test("after init: status returns row_count 0 and clean error counts", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    await knb.init();
    const status = await knb.status();
    expect(status.row_count).toBe(0);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.validation_warning_count).toBe(0);
    expect(status.state_warning_count).toBe(0);
  });

  test("after init: schema() result matches schema written to disk", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const schemaResult = await knb.schema();
    const onDisk = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    const parsed = JSON.parse(onDisk);
    expect(schemaResult.json_schema).toEqual(parsed);
  });

  test("init without force leaves existing config untouched", async () => {
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(join(workDir, ".knb", "config.json"), JSON.stringify({ actor: "agent:preset" }), "utf8");
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.init();
    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe(JSON.stringify({ actor: "agent:preset" }));
    expect(result.created_paths).not.toContain(join(".knb", "config.json"));
  });

  test("init without force preserves a non-empty ledger", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledgerText).toBe(jsonl([source]));
  });

  test("init is idempotent (second call without force is a no-op for created_paths apart from schema)", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const second = await knb.init();
    // Schema is generated and always rewritten by spec; ledger and config are preserved.
    expect(second.created_paths).not.toContain(join(".knb", "config.json"));
    expect(second.created_paths).not.toContain(join("knb", "ledger.jsonl"));
    expect(second.created_paths).not.toContain(join("knb", "views"));
    expect(second.created_paths).not.toContain(join("knb", "indexes"));
    expect(second.created_paths).toContain(join("knb", "schema.json"));
  });

  test("init with force overwrites schema and config, but leaves a non-empty ledger alone", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));
    await mkdir(join(workDir, "knb"), { recursive: true });
    await writeFile(join(workDir, "knb", "schema.json"), "STALE", "utf8");
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(join(workDir, ".knb", "config.json"), JSON.stringify({ actor: "old" }), "utf8");

    const knb = await openKnb(makeOpenOptions());
    await knb.init({ force: true });

    const schemaText = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    expect(schemaText).toBe(`${JSON.stringify(jsonSchema(), null, 2)}\n`);

    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe("{}\n");

    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledgerText).toBe(jsonl([source, claim]));
  });
});

describe("Knb.status", () => {
  test("empty workspace returns row_count 0 and clean counts", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    const status = await knb.status();
    expect(status.workspace_root).toBe(workDir);
    expect(status.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(status.schema_version).toBe("knb.v1");
    expect(status.actor).toBe("agent:test");
    expect(status.row_count).toBe(0);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.validation_warning_count).toBe(0);
    expect(status.state_warning_count).toBe(0);
    expect(status.active_counts_by_kind).toEqual({});
    expect(status.inactive_counts_by_status).toEqual({});
    expect(isAbsolute(status.workspace_root)).toBe(true);
    expect(isAbsolute(status.ledger_path)).toBe(true);
    // No projections rendered/built yet — V1 indexes report as missing.
    const missingIndexes = status.projection_freshness.entries.filter(
      (entry) => entry.kind === "index" && entry.state === "missing",
    );
    expect(missingIndexes.length).toBe(V1_INDEX_NAMES.length);
  });

  test("valid ledger reports correct row_count and active_counts_by_kind", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));

    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.row_count).toBe(2);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.active_counts_by_kind).toEqual({ source: 1, claim: 1 });
  });

  test("ledger with parse error reports parse_error_count >= 1", async () => {
    await seedLedger(`${JSON.stringify(freshSourceRow())}\n{not json\n`);
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.parse_error_count).toBeGreaterThanOrEqual(1);
    expect(status.row_count).toBe(1);
  });

  test("ledger with validation error reports validation_error_count >= 1", async () => {
    // Claim referencing a missing source id => broken_reference error.
    const claim = freshClaimRow("src:missing:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.validation_error_count).toBeGreaterThanOrEqual(1);
  });

  test("after retract change, inactive_counts_by_status.retracted is 1", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    const retract = freshRetractChange(claim.id);
    await seedLedger(jsonl([source, claim, retract]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.inactive_counts_by_status.retracted).toBe(1);
    // Active claim count should now be 0 (only source remains active).
    expect(status.active_counts_by_kind.claim ?? 0).toBe(0);
    expect(status.active_counts_by_kind.source).toBe(1);
  });

  test("retracting an already-retracted target produces a state warning", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    const retract1 = freshRetractChange(claim.id, "chg:facade:20260501:cccc3333");
    const retract2 = freshRetractChange(claim.id, "chg:facade:20260501:cccc4444");
    retract2.created_at = "2026-05-01T12:03:00Z";
    await seedLedger(jsonl([source, claim, retract1, retract2]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.state_warning_count).toBeGreaterThanOrEqual(1);
  });

  test("status.actor reflects KNB_ACTOR when no explicit actor is set", async () => {
    const knb = await openKnb({
      root: workDir,
      env: { KNB_ACTOR: "agent:env-actor" },
      cwd: () => workDir,
    });
    const status = await knb.status();
    expect(status.actor).toBe("agent:env-actor");
  });

  test("apply then immediate status reflects the appended row", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:test",
      runtime: { clock: () => new Date("2026-05-01T12:00:00Z"), randomIdPart: () => "11112222" },
    });
    const before = await knb.status();
    expect(before.row_count).toBe(0);
    await knb.add({
      kind: "source",
      scope: { collections: ["after"] },
      source: { type: "web_page", title: "x", uri: "https://example.com/after" },
      provenance: { acquisition: { method: "manual" } },
    });
    const after = await knb.status();
    expect(after.row_count).toBe(1);
    expect(after.active_counts_by_kind.source).toBe(1);
  });

  test("the same Knb instance picks up rows appended externally between calls", async () => {
    const knb = await openKnb(makeOpenOptions());
    expect((await knb.status()).row_count).toBe(0);
    await seedLedger(jsonl([freshSourceRow()]));
    expect((await knb.status()).row_count).toBe(1);
  });

  test("default status does not include detailed stats", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const knb = await openKnb(makeOpenOptions());
    const baseline = await knb.status();
    const explicitDefault = await knb.status({ detailed: false });
    expect(explicitDefault).toEqual(baseline);
    expect("detailed" in baseline).toBe(false);
  });

  test("detailed status returns empty corpus-health stats on an empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status({ detailed: true });
    expect(status.detailed).toEqual({
      duplicate_source_uri_clusters: [],
      duplicate_claim_key_clusters: [],
      evidence_depth: { count: 0, p50: 0, p90: 0, max: 0 },
      novelty_active_distribution: {},
      syntheses_per_collection: {},
    });
  });

  test("detailed status computes mixed dup-heavy stats from EffectiveState and ignores stale indexes", async () => {
    const sourceA = freshSourceRow("src:detail:20260501:sourcea1");
    sourceA.scope = { collections: ["alpha"] };
    sourceA.source.uri = "https://example.com/shared-source";
    const sourceB = freshSourceRow("src:detail:20260501:sourceb2");
    sourceB.scope = { collections: ["beta"] };
    sourceB.source.uri = "https://example.com/shared-source";
    const sourceC = freshSourceRow("src:detail:20260501:sourcec3");
    sourceC.scope = { collections: ["beta"] };
    sourceC.source.uri = "https://example.com/unique-source";

    const claimA = freshClaimRow(sourceA.id, "claim:detail:20260501:claimaaa");
    claimA.scope = { collections: ["alpha"] };
    claimA.identity = { claim_key: "detail|shared", novelty: "duplicate" };
    claimA.provenance = {
      evidence: [{ source_id: sourceA.id, role: "supports", summary: "A" }],
    };
    const claimB = freshClaimRow(sourceA.id, "claim:detail:20260501:claimbbb");
    claimB.scope = { collections: ["alpha", "beta"] };
    claimB.identity = { claim_key: "detail|shared", novelty: "duplicate" };
    claimB.provenance = {
      source_ids: [sourceA.id, sourceB.id],
      evidence: [
        { source_id: sourceA.id, role: "supports", summary: "A" },
        { source_id: sourceB.id, role: "supports", summary: "B" },
      ],
    };
    const claimC = freshClaimRow(sourceC.id, "claim:detail:20260501:claimccc");
    claimC.scope = { collections: ["beta"] };
    claimC.identity = { claim_key: "detail|unique", novelty: "correction" };
    claimC.provenance = {
      evidence: [{ source_id: sourceC.id, role: "supports", summary: "C" }],
    };

    const synthesisA: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:detail:20260501:syntha11",
      kind: "synthesis",
      created_at: "2026-05-01T15:00:00.000Z",
      created_by: "agent:test",
      scope: { collections: ["alpha"] },
      synthesis: { title: "Alpha", summary: "Alpha summary", basis: { claim_ids: [claimA.id] }, status: "active" },
    };
    const synthesisB: SynthesisRow = {
      ...synthesisA,
      id: "synth:detail:20260501:synthb22",
      scope: { collections: ["beta"] },
      synthesis: { title: "Beta", summary: "Beta summary", basis: { claim_ids: [claimB.id] }, status: "active" },
    };
    const archivedSynthesis: SynthesisRow = {
      ...synthesisA,
      id: "synth:detail:20260501:synthold",
      scope: { collections: ["alpha"] },
      synthesis: { title: "Archived", summary: "Old", basis: { claim_ids: [claimA.id] }, status: "archived" },
    };

    await seedLedger(jsonl([
      sourceA,
      sourceB,
      sourceC,
      claimA,
      claimB,
      claimC,
      synthesisA,
      synthesisB,
      archivedSynthesis,
    ]));
    await mkdir(join(workDir, "knb", "indexes"), { recursive: true });
    await writeFile(join(workDir, "knb", "indexes", "active-by-id.json"), JSON.stringify({ stale: true }), "utf8");

    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status({ detailed: true });

    expect(status.detailed?.duplicate_source_uri_clusters).toEqual([
      {
        uri: "https://example.com/shared-source",
        count: 2,
        source_ids: [sourceA.id, sourceB.id],
      },
    ]);
    expect(status.detailed?.duplicate_claim_key_clusters).toEqual([
      {
        claim_key: "detail|shared",
        count: 2,
        claim_ids: [claimA.id, claimB.id],
      },
    ]);
    expect(status.detailed?.evidence_depth).toEqual({ count: 3, p50: 1, p90: 2, max: 2 });
    expect(status.detailed?.novelty_active_distribution).toEqual({ correction: 1, duplicate: 2 });
    expect(status.detailed?.syntheses_per_collection).toEqual({ alpha: 1, beta: 1 });
  });
});

describe("Knb.schema", () => {
  test("returns schema, samples, and operation samples", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    expect(result.schema_version).toBe("knb.v1");
    expect(result.json_schema).toEqual(jsonSchema());
    expect(result.row_samples.length).toBe(5);
    expect(result.operation_samples.length).toBe(6);
    const samples = rowSamples();
    expect(result.row_samples[0]).toEqual(samples.source);
  });

  test("exposes selector contracts with generic samples", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();

    expect(result.json_schema).toEqual(jsonSchema());
    expect(result.selector_schema).toMatchObject({
      schema_version: "knb.selector.v1",
      type: "object",
    });
    expect(JSON.stringify(result.selector_samples)).not.toContain("weather");
  });

  test("json_schema has the expected top-level keys ($schema, $id, type, allOf, $defs)", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const schema = result.json_schema as Record<string, unknown>;
    expect(typeof schema.$schema).toBe("string");
    expect(schema.$id).toBe("knb.v1");
    expect(schema.type).toBe("object");
    expect(Array.isArray(schema.allOf)).toBe(true);
    expect(typeof schema.$defs).toBe("object");
    expect(Array.isArray(schema.required)).toBe(true);
  });

  test("row_samples contains exactly one of each kind", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const kinds = result.row_samples.map((row) => row.kind).sort();
    expect(kinds).toEqual(["change", "claim", "question", "source", "synthesis"]);
  });

  test("operation_samples covers all 6 operation kinds", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const ops = result.operation_samples.map((op) => op.op).sort();
    expect(ops).toEqual(["add", "merge", "patch", "relate", "retract", "supersede"]);
    const samples = operationSamples();
    expect(result.operation_samples).toEqual([
      samples.add,
      samples.retract,
      samples.supersede,
      samples.merge,
      samples.relate,
      samples.patch,
    ]);
  });
});

describe("Knb facade methods on empty workspace", () => {
  test("apply with zero operations returns empty result with proper shape", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.apply({ operations: [] });
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.novelty).toEqual([]);
    expect(result.meta.rows_appended).toBe(0);
    expect(result.meta.bytes_written).toBe(0);
    expect(result.meta.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(result.meta.fingerprint_after).toBeDefined();
  });

  test("query and context return empty shapes on empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const queryResult = await knb.query({});
    expect(queryResult.rows).toEqual([]);
    expect(queryResult.total_matched).toBe(0);
    expect(queryResult.total_returned).toBe(0);
    const contextResult = await knb.context({});
    expect(contextResult.key_claims).toEqual([]);
    expect(contextResult.syntheses).toEqual([]);
    expect(contextResult.open_questions).toEqual([]);
    expect(contextResult.sources).toEqual([]);
    expect(typeof contextResult.token_estimate).toBe("number");
    expect(contextResult.meta.counts.claims).toBe(0);
  });

  test("log returns an empty result when .knb/runs is missing", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({});
    expect(result.entries).toEqual([]);
    expect(result.total_matched).toBe(0);
    expect(result.total_returned).toBe(0);
  });

  test("collections returns empty list on an empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.collections();
    expect(result).toEqual({ collections: [] });
  });

  test("get with an unknown id throws KnbError with code not_found", async () => {
    const knb = await openKnb(makeOpenOptions());
    let caught: unknown;
    try {
      await knb.get(["never-here"]);
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("not_found");
  });

  test("get of all-missing ids reports them and throws not_found", async () => {
    const knb = await openKnb(makeOpenOptions());
    let caught: unknown;
    try {
      await knb.get(["a", "b", "c"]);
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("not_found");
    const details = (caught as { details?: { ids?: string[] } }).details;
    expect(details?.ids).toEqual(["a", "b", "c"]);
  });

  test("novelty on empty candidates returns empty results", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.novelty({ candidates: [] });
    expect(result.results).toEqual([]);
  });

  test("collectionStatus returns latest active synthesis and priority-sorted open questions", async () => {
    const source = freshSourceRow();
    const oldSynthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:facade:20260501:aaaa1111",
      kind: "synthesis",
      created_at: "2026-05-01T12:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      synthesis: {
        title: "Old synthesis",
        summary: "Old summary.",
        basis: { source_ids: [source.id] },
        status: "active",
      },
    };
    const latestSynthesis: SynthesisRow = {
      ...oldSynthesis,
      id: "synth:facade:20260501:bbbb2222",
      created_at: "2026-05-01T13:00:00Z",
      synthesis: {
        title: "Latest synthesis",
        summary: "Latest summary.",
        limitations: "Still thin.",
        basis: { source_ids: [source.id] },
        status: "active",
      },
    };
    const lowQuestion: QuestionRow = {
      schema_version: "knb.v1",
      id: "q:facade:20260501:low11111",
      kind: "question",
      created_at: "2026-05-01T12:30:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      question: { text: "Low question?", status: "open", priority: "low" },
    };
    const highQuestion: QuestionRow = {
      ...lowQuestion,
      id: "q:facade:20260501:high2222",
      created_at: "2026-05-01T12:20:00Z",
      question: {
        text: "High question?",
        status: "open",
        priority: "high",
        why_it_matters: "handoff",
      },
    };
    await seedLedger(jsonl([source, oldSynthesis, latestSynthesis, lowQuestion, highQuestion]));
    const knb = await openKnb(makeOpenOptions());

    const result = await knb.collectionStatus({ collection: "facade", maxQuestions: 1 });

    expect(result.collection).toBe("facade");
    expect(result.active_counts_by_kind.source).toBe(1);
    expect(result.active_counts_by_kind.synthesis).toBe(2);
    expect(result.active_counts_by_kind.question).toBe(2);
    expect(result.latest_synthesis?.id).toBe(latestSynthesis.id);
    expect(result.latest_synthesis?.title).toBe("Latest synthesis");
    expect(result.latest_synthesis?.limitations).toBe("Still thin.");
    expect(result.open_question_count).toBe(2);
    expect(result.open_questions).toEqual([
      {
        id: highQuestion.id,
        text: "High question?",
        created_at: highQuestion.created_at,
        priority: "high",
        why_it_matters: "handoff",
      },
    ]);
  });

  test("check on empty workspace reports clean parse and validation but missing indexes", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.check();
    expect(result.parse_issues).toEqual([]);
    expect(result.validation_issues).toEqual([]);
    expect(result.state_warnings).toEqual([]);
    // Indexes have not been built — projection freshness reports them missing.
    const missing = result.projection_freshness.entries.filter((entry) => entry.state === "missing");
    expect(missing.length).toBe(V1_INDEX_NAMES.length);
    expect(result.ok).toBe(false);
    // Fingerprint is exposed even on empty.
    expect(result.fingerprint).toBeDefined();
    expect(typeof result.fingerprint.content_hash).toBe("string");
  });

  test("check and context warn when a targeted synthesis has newer matching claims", async () => {
    const source = freshSourceRow("src:targeted:20260501:aaaa1111");
    const oldClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:targeted:20260501:bbbb2222"),
      created_at: "2026-05-01T12:01:00Z",
      scope: { collections: ["targeted"] },
      claim: {
        statement: "Initial latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const synthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:targeted:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["targeted"] },
      synthesis: {
        title: "Latency synthesis",
        summary: "Initial latency summary.",
        basis: { claim_ids: [oldClaim.id] },
        target_selector: {
          kinds: ["claim"],
          scope: { collections: ["targeted"] },
          where: [
            { path: "claim.type", eq: "measurement" },
            { path: "claim.qualifiers.metric", eq: "latency" },
          ],
        },
        status: "active",
      } as SynthesisRow["synthesis"],
    };
    const newerClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:targeted:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
      scope: { collections: ["targeted"] },
      claim: {
        statement: "Newer latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    await seedLedger(jsonl([source, oldClaim, synthesis, newerClaim]));
    const knb = await openKnb(makeOpenOptions());

    const check = await knb.check();
    const stateWarning = check.state_warnings.find((warning) => warning.code === "synthesis_target_stale");
    expect(stateWarning).toBeDefined();
    expect(stateWarning?.target_id).toBe(synthesis.id);
    expect(stateWarning?.message).toContain(newerClaim.id);

    const context = await knb.context({ collection: "targeted" });
    const contextWarning = context.warnings.find((warning) => warning.code === "state_synthesis_target_stale");
    expect(contextWarning?.message).toContain(newerClaim.id);
  });

  test("check accepts syntheses without target_selector and rejects invalid target selectors", async () => {
    const source = freshSourceRow("src:targetless:20260501:aaaa1111");
    const claim = freshClaimRow(source.id, "claim:targetless:20260501:bbbb2222");
    const laterClaim = {
      ...freshClaimRow(source.id, "claim:targetless:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
    };
    const targetless: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:targetless:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      synthesis: {
        title: "Untargeted synthesis",
        summary: "A synthesis that uses only basis ids.",
        basis: { claim_ids: [claim.id] },
        status: "active",
      },
    };
    await seedLedger(jsonl([source, claim, targetless, laterClaim]));
    const clean = await openKnb(makeOpenOptions());
    const cleanCheck = await clean.check();
    expect(cleanCheck.validation_issues).toEqual([]);
    expect(cleanCheck.state_warnings.some((warning) => warning.code === "synthesis_target_stale")).toBe(false);

    const invalidTargeted: SynthesisRow = {
      ...targetless,
      id: "synth:targetless:20260501:dddd4444",
      synthesis: {
        ...targetless.synthesis,
        target_selector: {
          kinds: ["claim"],
          where: [{ path: "claim.unknown", eq: "x" }],
        },
      } as SynthesisRow["synthesis"],
    };
    await seedLedger(jsonl([source, claim, invalidTargeted]));
    const invalid = await openKnb(makeOpenOptions());
    const issue = (await invalid.check()).validation_issues.find(
      (candidate) => candidate.code === "synthesis_target_selector_invalid",
    );
    expect(issue).toBeDefined();
    expect(issue?.path).toBe("synthesis.target_selector.where[0].path");
  });

  test("targeted synthesis freshness is satisfied by a newer covering synthesis", async () => {
    const source = freshSourceRow("src:covered:20260501:aaaa1111");
    const oldClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:covered:20260501:bbbb2222"),
      created_at: "2026-05-01T12:01:00Z",
      scope: { collections: ["covered"] },
      claim: {
        statement: "Initial latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const targetSelector: SynthesisRow["synthesis"]["target_selector"] = {
      kinds: ["claim"],
      scope: { collections: ["covered"] },
      where: [
        { path: "claim.type", eq: "measurement" },
        { path: "claim.qualifiers.metric", eq: "latency" },
      ],
    };
    const firstSynthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:covered:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["covered"] },
      synthesis: {
        title: "Latency synthesis",
        summary: "Initial latency summary.",
        basis: { claim_ids: [oldClaim.id] },
        target_selector: targetSelector,
        status: "active",
      } as SynthesisRow["synthesis"],
    };
    const newerClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:covered:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
      scope: { collections: ["covered"] },
      claim: {
        statement: "Newer latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const coveringSynthesis: SynthesisRow = {
      ...firstSynthesis,
      id: "synth:covered:20260501:eeee5555",
      created_at: "2026-05-01T12:04:00Z",
      synthesis: {
        ...firstSynthesis.synthesis,
        title: "Updated latency synthesis",
        summary: "Updated latency summary.",
        basis: { claim_ids: [oldClaim.id, newerClaim.id] },
      } as SynthesisRow["synthesis"],
    };
    await seedLedger(jsonl([source, oldClaim, firstSynthesis, newerClaim, coveringSynthesis]));
    const knb = await openKnb(makeOpenOptions());

    expect((await knb.check()).state_warnings.some((warning) => warning.code === "synthesis_target_stale")).toBe(false);
  });

  test("rebuildIndex returns IndexResult with all V1 indexes and writes them to disk", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const result = await knb.rebuildIndex();
    expect(result.indexes.length).toBe(V1_INDEX_NAMES.length);
    const names = result.indexes.map((entry) => entry.name).sort();
    expect(names).toEqual([...V1_INDEX_NAMES].sort());
    for (const entry of result.indexes) {
      expect(typeof entry.path).toBe("string");
      expect(await pathExists(entry.path)).toBe(true);
      expect(await pathExists(entry.metadata_path)).toBe(true);
      expect(entry.metadata.kind).toBe("index");
      expect(entry.metadata.schema_version).toBe("knb.projection.v1");
      expect(entry.bytes_written).toBeGreaterThan(0);
    }
  });

  test("renderAll writes views for every active collection through the facade", async () => {
    const rows = [
      freshSourceRow("src:alpha:20260501:aaaa1111"),
      {
        ...freshSourceRow("src:beta:20260501:bbbb2222"),
        scope: { collections: ["beta"] },
      },
    ];
    await seedLedger(jsonl(rows));
    const knb = await openKnb(makeOpenOptions());

    const result = await knb.renderAll();

    expect(result.collections).toEqual(["beta", "facade"]);
    expect(result.rendered.length).toBe(2);
    expect(result.total_bytes_written).toBeGreaterThan(0);
    for (const entry of result.rendered) {
      expect(await pathExists(entry.path)).toBe(true);
      expect(await pathExists(entry.metadata_path)).toBe(true);
    }
  });

  test("query/context/render/check propagate KnbError when ledger has parse errors", async () => {
    await seedLedger("{invalid json\n");
    const knb = await openKnb(makeOpenOptions());

    let qErr: unknown;
    try {
      await knb.query({});
    } catch (error) {
      qErr = error;
    }
    expect(isKnbError(qErr)).toBe(true);
    expect((qErr as { code: string }).code).toBe("io_failed");

    let cErr: unknown;
    try {
      await knb.context({});
    } catch (error) {
      cErr = error;
    }
    expect(isKnbError(cErr)).toBe(true);

    let rErr: unknown;
    try {
      await knb.render({ collection: "x" });
    } catch (error) {
      rErr = error;
    }
    expect(isKnbError(rErr)).toBe(true);

    let raErr: unknown;
    try {
      await knb.renderAll();
    } catch (error) {
      raErr = error;
    }
    expect(isKnbError(raErr)).toBe(true);
  });

  test("query/context propagate validation_failed when ledger has validation errors", async () => {
    const claim = freshClaimRow("src:nope:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));
    const knb = await openKnb(makeOpenOptions());
    let qErr: unknown;
    try {
      await knb.query({});
    } catch (error) {
      qErr = error;
    }
    expect(isKnbError(qErr)).toBe(true);
    expect((qErr as { code: string }).code).toBe("validation_failed");
  });

  test("add is a single-op wrapper equivalent to apply with one add operation", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:test",
      runtime: { clock: () => new Date("2026-05-01T12:00:00Z"), randomIdPart: () => "aaaa1111" },
    });
    const draft = {
      kind: "source" as const,
      scope: { collections: ["wrap"] },
      source: { type: "web_page" as const, title: "x", uri: "https://example.com/wrap" },
      provenance: { acquisition: { method: "manual" } },
    };
    const result = await knb.add(draft);
    expect(result.created.length).toBe(1);
    expect(result.created[0]?.kind).toBe("source");
    expect(result.meta.rows_appended).toBe(1);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.novelty)).toBe(true);
  });
});

describe("Knb.collections", () => {
  test("summarizes active collections from EffectiveState, not generated indexes", async () => {
    const sourceA = freshSourceRow("src:alpha:20260501:aaaa1111");
    sourceA.scope = { collections: ["alpha"] };
    sourceA.created_at = "2026-05-01T10:00:00.000Z";
    const sourceB = freshSourceRow("src:beta:20260501:bbbb2222");
    sourceB.scope = { collections: ["beta"] };
    sourceB.created_at = "2026-05-01T11:00:00.000Z";
    const claim = freshClaimRow(sourceA.id, "claim:shared:20260501:cccc3333");
    claim.scope = { collections: ["alpha", "beta"] };
    claim.created_at = "2026-05-01T12:00:00.000Z";
    const question: QuestionRow = {
      schema_version: "knb.v1",
      id: "q:beta:20260501:dddd4444",
      kind: "question",
      created_at: "2026-05-01T13:00:00.000Z",
      created_by: "agent:test",
      scope: { collections: ["beta"] },
      question: { text: "What next?", status: "open" },
    };
    const archivedQuestion: QuestionRow = {
      ...question,
      id: "q:alpha:20260501:eeee5555",
      created_at: "2026-05-01T14:00:00.000Z",
      scope: { collections: ["alpha"] },
      question: { text: "Archived?", status: "archived" },
    };
    await seedLedger(jsonl([sourceA, sourceB, claim, question, archivedQuestion]));
    await mkdir(join(workDir, "knb", "indexes"), { recursive: true });
    await writeFile(
      join(workDir, "knb", "indexes", "active-by-collection.json"),
      JSON.stringify({ stale: ["wrong"] }),
      "utf8",
    );

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.collections();

    expect(result.collections).toEqual([
      {
        collection: "alpha",
        active_counts_by_kind: { source: 1, claim: 1 },
        latest_created_at: "2026-05-01T12:00:00.000Z",
      },
      {
        collection: "beta",
        active_counts_by_kind: { source: 1, claim: 1, question: 1 },
        latest_created_at: "2026-05-01T13:00:00.000Z",
      },
    ]);
  });
});

describe("Knb.log", () => {
  test("sorts manifests by completed_at desc and run_id tie-break with default limit", async () => {
    await seedRunManifests([
      manifest("run_a", "agent:alpha", "2026-05-01T10:00:00.000Z", ["row:a"], "old"),
      manifest("run_b", "agent:beta", "2026-05-02T09:00:00.000Z", ["row:b"], "middle"),
      manifest("run_e", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:e"], "tie e"),
      manifest("run_d", "agent:beta", "2026-05-03T00:00:00.000Z", ["row:d"], "newest"),
      manifest("run_c", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:c"], "tie c"),
    ]);

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({});
    expect(result.entries.map((entry) => entry.run_id)).toEqual(["run_d", "run_c", "run_e", "run_b", "run_a"]);
    expect(result.total_matched).toBe(5);
    expect(result.total_returned).toBe(5);
  });

  test("filters manifests by actor, since, until, and limit", async () => {
    await seedRunManifests([
      manifest("run_a", "agent:alpha", "2026-05-01T10:00:00.000Z", ["row:a"]),
      manifest("run_b", "agent:beta", "2026-05-02T09:00:00.000Z", ["row:b"]),
      manifest("run_c", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:c"]),
      manifest("run_d", "agent:beta", "2026-05-03T00:00:00.000Z", ["row:d"]),
      manifest("run_e", "agent:alpha", "2026-05-02T13:00:00.000Z", ["row:e"]),
    ]);

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({
      actor: "agent:alpha",
      since: "2026-05-02T00:00:00.000Z",
      until: "2026-05-02T23:59:59.999Z",
      limit: 1,
    });

    expect(result.entries.map((entry) => entry.run_id)).toEqual(["run_e"]);
    expect(result.total_matched).toBe(2);
    expect(result.total_returned).toBe(1);
  });
});

describe("readSnapshot", () => {
  test("clean ledger returns validity = projected with state defined", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state).toBeDefined();
    expect(snapshot.state?.rows().length).toBe(2);
    expect(snapshot.validation.ok).toBe(true);
    expect(snapshot.fingerprint.rows).toBe(2);
  });

  test("ledger with parse error returns validity = loaded", async () => {
    await seedLedger(`${JSON.stringify(freshSourceRow())}\n{nope\n`);
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("loaded");
    expect(snapshot.state).toBeUndefined();
    expect(snapshot.ledger.parseIssues.length).toBeGreaterThanOrEqual(1);
  });

  test("validation warnings (duplicate source uri) do not block projection", async () => {
    const sharedUri = "https://example.com/shared";
    const sourceA = freshSourceRow("src:facade:20260501:aaaa1111");
    const sourceB = freshSourceRow("src:facade:20260501:aaaa2222");
    sourceA.source.uri = sharedUri;
    sourceB.source.uri = sharedUri;
    await seedLedger(jsonl([sourceA, sourceB]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state).toBeDefined();
    const warnings = snapshot.validation.issues.filter((issue) => issue.level === "warning");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0]?.code).toBe("duplicate_source_evidence");
    expect(snapshot.validation.ok).toBe(true);
  });

  test("validation errors return validity = loaded with no state", async () => {
    const claim = freshClaimRow("src:missing:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("loaded");
    expect(snapshot.state).toBeUndefined();
    const errors = snapshot.validation.issues.filter((issue) => issue.level === "error");
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  test("projectState=false returns validity = validated when no errors", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace, projectState: false });
    expect(snapshot.validity).toBe("validated");
    expect(snapshot.state).toBeUndefined();
    expect(snapshot.validation.ok).toBe(true);
  });

  test("custom projectState is invoked when validation passes", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    let called = 0;
    const snapshot = await readSnapshot({
      workspace,
      projectState: (rows) => {
        called += 1;
        return defaultProjectState(rows);
      },
    });
    expect(called).toBe(1);
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state?.rows().length).toBe(1);
  });

  test("missing ledger returns empty projected snapshot", async () => {
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.ledger.rows.length).toBe(0);
    expect(snapshot.state?.rows()).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(0);
  });
});

describe("src/index.ts public surface", () => {
  test("openKnb is exported as a function", () => {
    expect(typeof publicApi.openKnb).toBe("function");
  });

  test("re-exported types resolve to the same module's openKnb", async () => {
    // Smoke test: instantiate via the index re-export and confirm shape.
    const knb = await publicApi.openKnb(makeOpenOptions());
    expect(typeof knb.apply).toBe("function");
    expect(typeof knb.add).toBe("function");
    expect(typeof knb.status).toBe("function");
    expect(typeof knb.renderAll).toBe("function");
  });
});
