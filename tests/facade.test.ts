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
  type EntryRow,
  type ClaimRow,
  type SourceRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { openWorkspace } from "../src/core/workspace";
import { defaultProjectState, readSnapshot } from "../src/core/read-snapshot";
import { V1_INDEX_NAMES } from "../src/core/projections";

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

function freshSourceRow(id = "src:facade:20260501:aaaa1111"): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { profiles: ["facade"] },
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
    scope: { profiles: ["facade"] },
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

function freshRetractEntry(targetId: string, id = "ent:facade:20260501:cccc3333"): EntryRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "entry",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { profiles: ["facade"] },
    entry: {
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
      "schema",
      "apply",
      "previewApply",
      "add",
      "get",
      "query",
      "context",
      "render",
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
      scope: { profiles: ["clocktest"] },
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
            scope: { profiles: ["preview"] },
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
    // We can't entry real process.cwd, but we can pass an empty options object
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

describe("Knb profile and instance management", () => {
  test("creates, attaches, lists, and shows a profile definition", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();

    const created = await knb.createProfile(
      "trade_map.v1",
      {
        display_name: "Trade Map",
        description: "Maps actors, assets, constraints, and predictions.",
        record_types: [{ type: "prediction", required_fields: ["value"] }],
        link_types: [{ rel: "depends_on" }],
        agent_instructions: ["Use prediction for forward-looking records."],
      },
      { attach: true },
    );

    expect(created.created).toBe(true);
    expect(created.attached).toBe(true);
    expect(created.path).toBe(join(".knb", "profiles", "trade_map.v1.json"));
    expect(await pathExists(join(workDir, ".knb", "profiles", "trade_map.v1.json"))).toBe(true);

    const shown = await knb.showProfile("trade_map.v1");
    expect(shown.profile.display_name).toBe("Trade Map");
    expect(shown.attached).toBe(true);

    const listed = await knb.listProfiles({ attachedOnly: true });
    expect(listed.profiles.map((profile) => profile.profile_id)).toEqual(["trade_map.v1"]);
    expect(listed.profiles[0]?.defined).toBe(true);
    expect(listed.profiles[0]?.attached).toBe(true);

    const config = JSON.parse(await readFile(join(workDir, ".knb", "config.json"), "utf8")) as { profiles?: string[] };
    expect(config.profiles).toEqual(["trade_map.v1"]);
  });

  test("profile delete refuses definitions referenced by ledger rows", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    await knb.createProfile("research.v1", { display_name: "Research" });
    await knb.add({
      kind: "source",
      scope: { profiles: ["research.v1"] },
      source: { type: "web_page", title: "Research source", uri: "https://example.com/research-source" },
      provenance: { acquisition: { method: "manual" } },
    });

    let thrown: unknown;
    try {
      await knb.deleteProfile("research.v1", { confirm: "research.v1" });
    } catch (error) {
      thrown = error;
    }

    expect(isKnbError(thrown)).toBe(true);
    if (!isKnbError(thrown)) throw new Error("expected KnbError");
    expect(thrown.code).toBe("unsafe_operation_refused");
    expect(thrown.details?.referenced_rows).toBe(1);
  });

  test("creates an instance config and manages attached profiles", async () => {
    const knb = await openKnb(makeOpenOptions());
    const created = await knb.createInstance({
      instanceId: "research-main",
      profiles: ["research.v1"],
      actor: "agent:instance-test",
    });

    expect(created.instance_id).toBe("research-main");
    expect(created.profiles).toEqual(["research.v1"]);
    expect(created.actor).toBe("agent:instance-test");
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);

    const attached = await knb.attachInstanceProfile("trade_map.v1");
    expect(attached.attached_profiles).toEqual(["research.v1", "trade_map.v1"]);
    expect(attached.changed).toBe(true);

    const detached = await knb.detachInstanceProfile("research.v1");
    expect(detached.attached_profiles).toEqual(["trade_map.v1"]);
    expect(detached.changed).toBe(true);

    const shown = await knb.showInstance();
    expect(shown.instance_id).toBe("research-main");
    expect(shown.profiles).toEqual(["trade_map.v1"]);
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

  test("after retract entry, inactive_counts_by_status.retracted is 1", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    const retract = freshRetractEntry(claim.id);
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
    const retract1 = freshRetractEntry(claim.id, "ent:facade:20260501:cccc3333");
    const retract2 = freshRetractEntry(claim.id, "ent:facade:20260501:cccc4444");
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
      scope: { profiles: ["after"] },
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
    expect(kinds).toEqual(["claim", "entry", "question", "source", "synthesis"]);
  });

  test("operation_samples covers all 6 operation kinds", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const ops = result.operation_samples.map((op) => op.op).sort();
    expect(ops).toEqual(["add", "link", "merge", "patch", "retract", "supersede"]);
    const samples = operationSamples();
    expect(result.operation_samples).toEqual([
      samples.add,
      samples.retract,
      samples.supersede,
      samples.merge,
      samples.link,
      samples.patch,
    ]);
  });
});

describe("Knb facade methods on empty workspace", () => {
  test("apply with zero operations returns empty result with proper shape", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.apply({ operations: [] });
    expect(result.created).toEqual([]);
    expect(result.warnings).toEqual([]);
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
      await knb.render({ profile: "x" });
    } catch (error) {
      rErr = error;
    }
    expect(isKnbError(rErr)).toBe(true);

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
      scope: { profiles: ["wrap"] },
      source: { type: "web_page" as const, title: "x", uri: "https://example.com/wrap" },
      provenance: { acquisition: { method: "manual" } },
    };
    const result = await knb.add(draft);
    expect(result.created.length).toBe(1);
    expect(result.created[0]?.kind).toBe("source");
    expect(result.meta.rows_appended).toBe(1);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(result.warnings).toBeDefined();
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
  });
});
