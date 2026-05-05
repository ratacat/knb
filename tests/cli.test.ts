import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { appendFile, chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { realpath } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { runCli } from "../src/cli";
import type { CommandResult, OutputOptions, OutputSink } from "../src/core/output";

const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

let workDir: string;

beforeEach(async () => {
  const raw = await mkdtemp(join(tmpdir(), "knb-cli-"));
  workDir = await realpath(raw);
});

afterEach(async () => {
  try {
    await chmod(workDir, 0o700);
  } catch {}
  await rm(workDir, { recursive: true, force: true });
});

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type SpawnResult = { code: number; stdout: string; stderr: string };

async function runCliBinary(
  args: string[],
  options: { stdin?: string; cwd?: string; env?: Record<string, string> } = {},
): Promise<SpawnResult> {
  const stdio: ["pipe" | "ignore", "pipe", "pipe"] = [
    options.stdin === undefined ? "ignore" : "pipe",
    "pipe",
    "pipe",
  ];
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd: options.cwd ?? workDir,
    stdio,
    env: { ...process.env, KNB_CONFIG: "", ...(options.env ?? {}) },
  });
  if (options.stdin !== undefined && proc.stdin) {
    proc.stdin.write(options.stdin);
    await proc.stdin.end();
  }
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

type Captured = {
  stdout: string;
  stderr: string;
  results: CommandResult[];
};

function makeCapturingOptions(format: OutputOptions["format"]): {
  options: OutputOptions;
  captured: Captured;
} {
  const captured: Captured = { stdout: "", stderr: "", results: [] };
  const stdout: OutputSink = {
    write(chunk) {
      captured.stdout += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    },
  };
  const stderr: OutputSink = {
    write(chunk) {
      captured.stderr += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    },
  };
  const options: OutputOptions = { stdout, stderr, isTty: false };
  if (format !== undefined) options.format = format;
  return { options, captured };
}

async function runCliInProcess(
  args: string[],
  format: OutputOptions["format"] = "json",
  optionsExtra: Partial<OutputOptions> = {},
): Promise<{ code: number } & Captured> {
  const { options, captured } = makeCapturingOptions(format);
  const merged: OutputOptions = { ...options, ...optionsExtra };
  if (format !== undefined) merged.format = format;
  const [command, ...rest] = args;
  const finalArgs =
    command === undefined ? ["--root", workDir] : [command, "--root", workDir, ...rest];
  const code = await runCli(finalArgs, merged);
  return { code, ...captured };
}

function parseEnvelope(text: string): { envelope: Record<string, unknown>; raw: string } {
  const trimmed = text.trim();
  return { envelope: JSON.parse(trimmed) as Record<string, unknown>, raw: trimmed };
}

async function initWorkspace(): Promise<void> {
  const initRun = await runCliBinary(["init", "--json"]);
  if (initRun.code !== 0) throw new Error(`init failed: ${initRun.stderr}`);
}

type RunManifestFixture = {
  schema_version: "knb.run.v1";
  run_id: string;
  actor: string;
  intent?: string;
  started_at: string;
  completed_at: string;
  rows_appended: number;
  row_ids: string[];
};

async function seedRunManifests(manifests: RunManifestFixture[]): Promise<void> {
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
): RunManifestFixture {
  const result: RunManifestFixture = {
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

async function seedAsOfFixture(collection = "asof-cli"): Promise<{ sourceId: string; claimId: string }> {
  await initWorkspace();
  const sourcePayload = JSON.stringify({
    now: "2026-05-01T00:00:00Z",
    operations: [
      {
        op: "add",
        as: "src",
        row: {
          kind: "source",
          scope: { collections: [collection] },
          source: { type: "web_page", title: "CLI AsOf Source", uri: "https://example.com/asof-cli" },
          provenance: { acquisition: { method: "manual" } },
        },
      },
    ],
  });
  const sourceRun = await runCliBinary(["apply", "--json", sourcePayload, "--pretty"]);
  expect(sourceRun.code).toBe(0);
  const sourceId = (JSON.parse(sourceRun.stdout) as { data: { created: Array<{ id: string }> } }).data.created[0]?.id ?? "";

  const claimPayload = JSON.stringify({
    now: "2026-05-01T01:00:00Z",
    operations: [
      {
        op: "add",
        as: "claim",
        row: {
          kind: "claim",
          scope: { collections: [collection] },
          identity: { claim_key: `${collection}|claim` },
          claim: { statement: "CLI time-travel claim.", atomic: true },
          time: { precision: "unknown" },
          provenance: {
            source_ids: [sourceId],
            evidence: [{ source_id: sourceId, role: "supports", summary: "Source supports claim." }],
          },
          assessment: { confidence: "high" },
        },
      },
      {
        op: "add",
        row: {
          kind: "synthesis",
          scope: { collections: [collection] },
          synthesis: {
            title: "CLI AsOf Synthesis",
            summary: "CLI historical synthesis.",
            basis: { claim_ids: ["$claim"] },
            status: "active",
          },
        },
      },
    ],
  });
  const claimRun = await runCliBinary(["apply", "--json", claimPayload, "--pretty"]);
  expect(claimRun.code).toBe(0);
  const claimId = (JSON.parse(claimRun.stdout) as { data: { created: Array<{ id: string }> } }).data.created[0]?.id ?? "";

  const retractPayload = JSON.stringify({
    now: "2026-05-01T02:00:00Z",
    operations: [{ op: "retract", target_ids: [claimId], reason: "Later correction." }],
  });
  const retractRun = await runCliBinary(["apply", "--json", retractPayload, "--pretty"]);
  expect(retractRun.code).toBe(0);

  const questionPayload = JSON.stringify({
    now: "2026-05-01T03:00:00Z",
    operations: [
      {
        op: "add",
        row: {
          kind: "question",
          scope: { collections: [collection] },
          question: { text: "CLI question after cutoff?", status: "open" },
        },
      },
    ],
  });
  const questionRun = await runCliBinary(["apply", "--json", questionPayload, "--pretty"]);
  expect(questionRun.code).toBe(0);

  return { sourceId, claimId };
}

describe("cli init (spawned)", () => {
  test("init on a fresh dir creates expected paths and returns ok envelope", async () => {
    const result = await runCliBinary(["init", "--json"]);
    expect(result.code).toBe(0);
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "ledger.jsonl"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "schema.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "views"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "indexes"))).toBe(true);

    const envelope = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      command: string;
      data: { created_paths: string[]; ledger_path: string; config_path: string; schema_path: string; workspace_root: string };
      meta: { workspace_root: string; ledger: string; elapsed_ms: number };
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.command).toBe("init");
    expect(Array.isArray(envelope.data.created_paths)).toBe(true);
    expect(envelope.data.created_paths.length).toBeGreaterThan(0);
    expect(envelope.data.workspace_root).toBe(workDir);
    expect(envelope.data.ledger_path.endsWith(join("knb", "ledger.jsonl"))).toBe(true);
    expect(envelope.data.config_path.endsWith(join(".knb", "config.json"))).toBe(true);
    expect(envelope.data.schema_path.endsWith(join("knb", "schema.json"))).toBe(true);
    expect(typeof envelope.meta.elapsed_ms).toBe("number");
    expect(envelope.meta.workspace_root).toBe(workDir);
    expect(envelope.meta.ledger).toBe(envelope.data.ledger_path);
  });

  test("status after init returns row_count 0 with elapsed_ms numeric", async () => {
    const initRun = await runCliBinary(["init", "--json"]);
    expect(initRun.code).toBe(0);

    const statusRun = await runCliBinary(["status", "--json"]);
    expect(statusRun.code).toBe(0);
    const envelope = JSON.parse(statusRun.stdout.trim()) as {
      ok: boolean;
      data: { row_count: number; parse_error_count: number };
      meta: { elapsed_ms?: unknown };
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.data.row_count).toBe(0);
    expect(envelope.data.parse_error_count).toBe(0);
    expect(typeof envelope.meta.elapsed_ms).toBe("number");
  });
});

describe("cli init (in-process)", () => {
  test("init followed by schema returns full schema and >=5 row samples", async () => {
    const initResult = await runCliInProcess(["init"]);
    expect(initResult.code).toBe(0);

    const schemaResult = await runCliInProcess(["schema"]);
    expect(schemaResult.code).toBe(0);
    const { envelope } = parseEnvelope(schemaResult.stdout);
    expect(envelope.ok).toBe(true);
    expect(envelope.command).toBe("schema");
    const data = envelope.data as {
      schema_version: string;
      json_schema: object;
      selector_schema?: { schema_version?: string; properties?: Record<string, unknown> };
      profile_schema?: { schema_version?: string; properties?: Record<string, unknown> };
      selector_samples?: unknown[];
      profile_samples?: unknown[];
      row_samples: unknown[];
      operation_samples: unknown[];
    };
    expect(data.schema_version).toBe("knb.v1");
    expect(typeof data.json_schema).toBe("object");
    expect(data.json_schema).not.toBeNull();
    expect(data.selector_schema?.schema_version).toBe("knb.selector.v1");
    expect(data.profile_schema?.schema_version).toBe("knb.profile.v1");
    expect(data.profile_schema?.properties?.select).toBeDefined();
    expect(data.profile_samples?.length).toBeGreaterThanOrEqual(1);
    expect(data.selector_samples?.length).toBeGreaterThanOrEqual(1);
    expect(data.row_samples.length).toBeGreaterThanOrEqual(5);
    expect(data.operation_samples.length).toBeGreaterThanOrEqual(6);
  });

  test("init --force overwrites a mutated schema file", async () => {
    const first = await runCliInProcess(["init"]);
    expect(first.code).toBe(0);

    const schemaPath = join(workDir, "knb", "schema.json");
    await writeFile(schemaPath, "STALE_CONTENT", "utf8");
    const stale = await readFile(schemaPath, "utf8");
    expect(stale).toBe("STALE_CONTENT");

    const forced = await runCliInProcess(["init", "--force"]);
    expect(forced.code).toBe(0);
    const fresh = await readFile(schemaPath, "utf8");
    expect(fresh).not.toBe("STALE_CONTENT");
    expect(fresh.length).toBeGreaterThan(100);
    const parsed = JSON.parse(fresh) as { $id?: string };
    expect(parsed.$id).toBe("knb.v1");
  });

  test("status default human text writes a summary on stdout and nothing on stderr", async () => {
    const initResult = await runCliInProcess(["init"]);
    expect(initResult.code).toBe(0);

    const textResult = await runCliInProcess(["status"], "text");
    expect(textResult.code).toBe(0);
    expect(textResult.stdout.length).toBeGreaterThan(0);
    expect(textResult.stderr).toBe("");
    expect(textResult.stdout).toContain("knb.v1");
    expect(textResult.stdout.endsWith("\n")).toBe(true);
  });

  test("status --quiet writes nothing on success and exits 0", async () => {
    const initResult = await runCliInProcess(["init"]);
    expect(initResult.code).toBe(0);

    const quiet = await runCliInProcess(["status"], "quiet");
    expect(quiet.code).toBe(0);
    expect(quiet.stdout).toBe("");
    expect(quiet.stderr).toBe("");
  });

  test("status with no --root falls back to cwd workspace", async () => {
    const { options, captured } = makeCapturingOptions("json");
    const initCode = await runCli(["init", "--root", workDir], options);
    expect(initCode).toBe(0);
    captured.stdout = "";
    captured.stderr = "";

    const originalCwd = process.cwd();
    let statusCode: number;
    try {
      process.chdir(workDir);
      statusCode = await runCli(["status"], options);
    } finally {
      process.chdir(originalCwd);
    }
    expect(statusCode).toBe(0);
    const { envelope } = parseEnvelope(captured.stdout);
    expect(envelope.ok).toBe(true);
    const data = envelope.data as { workspace_root: string; row_count: number };
    expect(data.workspace_root).toBe(workDir);
    expect(data.row_count).toBe(0);
  });

  test("unknown command returns exit 2 with invalid_arguments error", async () => {
    const result = await runCliInProcess(["totally-unknown"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
      meta: { exit_code: number };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.error.message).toContain("totally-unknown");
    expect(envelope.meta.exit_code).toBe(2);
  });

  test("legacy validate command is unknown and exits 2", async () => {
    const result = await runCliInProcess(["validate"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      command?: string;
      error: { code: string };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.command).toBe("validate");
  });

  test("legacy append command is unknown and exits 2", async () => {
    const result = await runCliInProcess(["append"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      command?: string;
      error: { code: string };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.command).toBe("append");
  });

  test("status --json includes meta.elapsed_ms numeric field", async () => {
    const initResult = await runCliInProcess(["init"]);
    expect(initResult.code).toBe(0);

    const statusResult = await runCliInProcess(["status"]);
    expect(statusResult.code).toBe(0);
    const { envelope } = parseEnvelope(statusResult.stdout);
    const meta = envelope.meta as { elapsed_ms?: unknown };
    expect(typeof meta.elapsed_ms).toBe("number");
    expect((meta.elapsed_ms as number) >= 0).toBe(true);
  });
});

describe("cli help and entrypoint", () => {
  test("no command prints help text to stdout and exits 0", async () => {
    const result = await runCliBinary([]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("knb");
    expect(result.stdout).toContain("Usage:");
    expect(result.stderr).toBe("");
  });

  test("help command prints help text and exits 0", async () => {
    const result = await runCliBinary(["help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  test("--help long flag prints help and exits 0", async () => {
    const result = await runCliBinary(["--help"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  test("-h short flag prints help and exits 0", async () => {
    const result = await runCliBinary(["-h"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("Usage:");
  });

  test("help text mentions every supported command and no removed commands", async () => {
    const result = await runCliBinary(["help"]);
    const text = result.stdout;
    for (const cmd of [
      "init",
      "status",
      "collections",
      "schema",
      "log",
      "apply",
      "add",
      "get",
      "query",
      "context",
      "novelty",
      "render",
      "check",
      "index",
    ]) {
      expect(text).toContain(`knb ${cmd}`);
    }
    expect(text).not.toContain("knb validate");
    expect(text).not.toContain("knb append");
  });

  test("help text documents every typed exit code 0..10", async () => {
    const result = await runCliBinary(["help"]);
    const text = result.stdout;
    expect(text).toContain("not_found");
    expect(text).toContain("invalid_arguments");
    expect(text).toContain("validation_failed");
    expect(text).toContain("duplicate_blocked");
    expect(text).toContain("io_failed");
    expect(text).toContain("lock_busy");
    expect(text).toContain("broken_reference");
    expect(text).toContain("external_dependency_failed");
    expect(text).toContain("unsafe_operation_refused");
    expect(text).toContain("internal_error");
  });

  test("help text documents context recency flag", async () => {
    const result = await runCliBinary(["help"]);
    expect(result.stdout).toContain("--recency-window-days");
  });
});

describe("cli collections", () => {
  async function seedCollectionsRows(): Promise<void> {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "source",
          row: {
            kind: "source",
            scope: { collections: ["cli-alpha"] },
            source: { type: "web_page", title: "Alpha", uri: "https://example.com/alpha" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["cli-alpha", "cli-beta"] },
            identity: { claim_key: "cli|shared" },
            claim: { statement: "Shared claim.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$source", role: "supports", summary: "Source supports claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
        {
          op: "add",
          row: {
            kind: "question",
            scope: { collections: ["cli-beta"] },
            question: { text: "What next?", status: "open" },
          },
        },
      ],
    });
    const applied = await runCliBinary(["apply", "--json", payload, "--pretty"]);
    expect(applied.code).toBe(0);
  }

  test("collections --json returns empty collections on an empty workspace", async () => {
    await initWorkspace();
    const result = await runCliBinary(["collections", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      command: string;
      data: { collections: unknown[] };
      meta: { rows_returned: number };
    };
    expect(env.ok).toBe(true);
    expect(env.command).toBe("collections");
    expect(env.data.collections).toEqual([]);
    expect(env.meta.rows_returned).toBe(0);
  });

  test("collections --json summarizes active rows and ignores stale indexes", async () => {
    await seedCollectionsRows();
    await mkdir(join(workDir, "knb", "indexes"), { recursive: true });
    await writeFile(
      join(workDir, "knb", "indexes", "active-by-collection.json"),
      JSON.stringify({ "wrong-index": [{ id: "stale" }] }),
      "utf8",
    );

    const result = await runCliBinary(["collections", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: {
        collections: Array<{
          collection: string;
          active_counts_by_kind: Record<string, number>;
          latest_created_at?: string;
        }>;
      };
      meta: { rows_returned: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.collections.map((entry) => entry.collection)).toEqual(["cli-alpha", "cli-beta"]);
    expect(env.data.collections[0]?.active_counts_by_kind).toEqual({ source: 1, claim: 1 });
    expect(env.data.collections[1]?.active_counts_by_kind).toEqual({ claim: 1, question: 1 });
    expect(env.data.collections[0]?.latest_created_at).toBeDefined();
    expect(env.meta.rows_returned).toBe(2);
  });

  test("collections --text renders a compact table", async () => {
    await seedCollectionsRows();
    const result = await runCliBinary(["collections", "--text"]);
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("collection\tsource\tclaim\tquestion\tsynthesis\tchange\tlatest_created_at");
    expect(result.stdout).toContain("cli-alpha\t1\t1\t0\t0\t0\t");
    expect(result.stdout).toContain("cli-beta\t0\t1\t1\t0\t0\t");
  });
});

describe("cli status --detailed", () => {
  test("plain status --json omits detailed stats", async () => {
    await initWorkspace();
    const result = await runCliBinary(["status", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as { ok: boolean; data: Record<string, unknown> };
    expect(env.ok).toBe(true);
    expect("detailed" in env.data).toBe(false);
  });

  test("status --detailed --json includes corpus-health stats", async () => {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "source",
          row: {
            kind: "source",
            scope: { collections: ["detail-cli"] },
            source: { type: "web_page", title: "Detail", uri: "https://example.com/detail" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["detail-cli"] },
            identity: { claim_key: "detail-cli|claim", novelty: "duplicate" },
            claim: { statement: "Detailed status works.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$source", role: "supports", summary: "Source supports claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    });
    const applied = await runCliBinary(["apply", "--json", payload, "--pretty"]);
    expect(applied.code).toBe(0);

    const result = await runCliBinary(["status", "--detailed", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: {
        detailed?: {
          evidence_depth: { count: number; p50: number; p90: number; max: number };
          novelty_active_distribution: Record<string, number>;
          syntheses_per_collection: Record<string, number>;
        };
      };
    };
    expect(env.ok).toBe(true);
    expect(env.data.detailed?.evidence_depth).toEqual({ count: 1, p50: 1, p90: 1, max: 1 });
    expect(env.data.detailed?.novelty_active_distribution).toEqual({ duplicate: 1 });
    expect(env.data.detailed?.syntheses_per_collection).toEqual({});
  });
});

describe("cli log", () => {
  test("log --json returns empty entries when .knb/runs is missing", async () => {
    const result = await runCliBinary(["log", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      command: string;
      data: { entries: unknown[]; total_matched: number; total_returned: number };
      meta: { rows_returned: number };
    };
    expect(env.ok).toBe(true);
    expect(env.command).toBe("log");
    expect(env.data.entries).toEqual([]);
    expect(env.data.total_matched).toBe(0);
    expect(env.data.total_returned).toBe(0);
    expect(env.meta.rows_returned).toBe(0);
  });

  test("log --json filters by actor, since, and limit", async () => {
    await seedRunManifests([
      manifest("run_a", "agent:alpha", "2026-05-01T10:00:00.000Z", ["row:a"], "old"),
      manifest("run_b", "agent:beta", "2026-05-02T09:00:00.000Z", ["row:b"], "beta"),
      manifest("run_c", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:c"], "alpha c"),
      manifest("run_d", "agent:beta", "2026-05-03T00:00:00.000Z", ["row:d"], "newest"),
      manifest("run_e", "agent:alpha", "2026-05-02T13:00:00.000Z", ["row:e"], "alpha e"),
    ]);

    const result = await runCliBinary([
      "log",
      "--actor",
      "agent:alpha",
      "--since",
      "2026-05-02T00:00:00.000Z",
      "--limit",
      "2",
      "--json",
    ]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { entries: Array<{ run_id: string; actor: string; intent?: string }>; total_matched: number; total_returned: number };
      meta: { rows_returned: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.entries.map((entry) => entry.run_id)).toEqual(["run_e", "run_c"]);
    expect(env.data.entries.every((entry) => entry.actor === "agent:alpha")).toBe(true);
    expect(env.data.entries[0]?.intent).toBe("alpha e");
    expect(env.data.total_matched).toBe(2);
    expect(env.data.total_returned).toBe(2);
    expect(env.meta.rows_returned).toBe(2);
  });

  test("log --text renders a compact table", async () => {
    await seedRunManifests([
      manifest("run_table", "agent:table", "2026-05-02T13:00:00.000Z", ["row:1", "row:2"], "table intent"),
    ]);

    const result = await runCliBinary(["log", "--text"]);
    expect(result.code).toBe(0);
    expect(result.stderr).toBe("");
    expect(result.stdout).toContain("completed_at\tactor\trows\trun_id\tintent");
    expect(result.stdout).toContain("2026-05-02T13:00:00.000Z\tagent:table\t2\trun_table\ttable intent");
  });
});

describe("cli flag parsing", () => {
  test("equals form --ledger=<path> is honored and overrides default", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const customLedger = join(workDir, "custom-ledger.jsonl");
    const result = await runCliInProcess(["status", `--ledger=${customLedger}`]);
    expect(result.code).toBe(0);
    const { envelope } = parseEnvelope(result.stdout);
    const meta = envelope.meta as { ledger: string };
    expect(meta.ledger).toBe(customLedger);
  });

  test("space form --ledger <path> is honored and overrides default", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const customLedger = join(workDir, "another-ledger.jsonl");
    const result = await runCliInProcess(["status", "--ledger", customLedger]);
    expect(result.code).toBe(0);
    const { envelope } = parseEnvelope(result.stdout);
    const meta = envelope.meta as { ledger: string };
    expect(meta.ledger).toBe(customLedger);
  });

  test("--actor flag overrides KNB_ACTOR for status", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliInProcess(["status", "--actor", "alice@example"]);
    expect(result.code).toBe(0);
    const { envelope } = parseEnvelope(result.stdout);
    const data = envelope.data as { actor: string };
    expect(data.actor).toBe("alice@example");
  });

  test("--config flag accepts an alternate config path with a custom ledger", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const altConfigDir = join(workDir, "alt-config-dir");
    await mkdir(altConfigDir, { recursive: true });
    const altConfig = join(altConfigDir, "knb.json");
    const altLedger = join(altConfigDir, "alt-ledger.jsonl");
    await writeFile(altConfig, JSON.stringify({ ledger: altLedger }), "utf8");

    const result = await runCliInProcess(["status", "--config", altConfig]);
    expect(result.code).toBe(0);
    const { envelope } = parseEnvelope(result.stdout);
    const meta = envelope.meta as { ledger: string };
    expect(meta.ledger).toBe(altLedger);
  });

  test("unknown flag is silently ignored when commands do not consume it", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliInProcess(["status", "--no-such-flag"]);
    expect(result.code).toBe(0);
    const { envelope } = parseEnvelope(result.stdout);
    expect(envelope.ok).toBe(true);
  });

  test("invalid numeric flags are rejected with invalid_arguments", async () => {
    await initWorkspace();

    const result = await runCliBinary(["query", "--limit", "not-a-number", "--json"]);

    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string; details?: { flag?: string; value?: string } };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.error.details?.flag).toBe("--limit");
    expect(envelope.error.details?.value).toBe("not-a-number");
  });

  test("invalid query --kind is rejected with invalid_arguments", async () => {
    await initWorkspace();

    const result = await runCliBinary(["query", "--kind", "notakind", "--json"]);

    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string; details?: { kind?: string } };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.error.details?.kind).toBe("notakind");
  });

  test("--quiet beats --json when both are set", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status", "--json", "--quiet"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe("");
    expect(result.stderr).toBe("");
  });

  test("--ndjson beats --json when both are set", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status", "--json", "--ndjson"]);
    expect(result.code).toBe(0);
    const lines = result.stdout.split("\n").filter((l) => l.length > 0);
    expect(lines.length).toBeGreaterThanOrEqual(1);
    const last = JSON.parse(lines[lines.length - 1] ?? "");
    expect(last.ok).toBe(true);
    expect(last.command).toBe("status");
  });

  test("--pretty produces indented JSON envelope", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status", "--pretty"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("\n  ");
    const parsed = JSON.parse(result.stdout);
    expect(parsed.ok).toBe(true);
  });

  test("--json beats --text when both are set (json wins precedence)", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status", "--text", "--json"]);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout.trim());
    expect(parsed.ok).toBe(true);
  });

  test("--text forces human text even when piped (no envelope wrapper)", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status", "--text"]);
    expect(result.code).toBe(0);
    expect(result.stdout).toContain("knb.v1");
    let parsedAsEnvelope = false;
    try {
      const maybeEnv = JSON.parse(result.stdout.trim()) as { ok?: unknown; command?: unknown };
      if (typeof maybeEnv === "object" && maybeEnv !== null && "ok" in maybeEnv && "command" in maybeEnv) {
        parsedAsEnvelope = true;
      }
    } catch {}
    expect(parsedAsEnvelope).toBe(false);
  });

  test("piped (no TTY) defaults to compact JSON envelope", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliBinary(["status"]);
    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout.trim());
    expect(parsed.ok).toBe(true);
    expect(parsed.command).toBe("status");
    expect(result.stdout.includes("\n  ")).toBe(false);
  });

  test("isTty=true forces human text (auto-detect path) - no envelope wrapper", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const { options, captured } = makeCapturingOptions(undefined);
    const ttyOpts: OutputOptions = { ...options, isTty: true };
    const code = await runCli(["status", "--root", workDir], ttyOpts);
    expect(code).toBe(0);
    expect(captured.stdout).toContain("knb.v1");
    let parsedAsEnvelope = false;
    try {
      const maybeEnv = JSON.parse(captured.stdout.trim()) as { ok?: unknown; command?: unknown };
      if (typeof maybeEnv === "object" && maybeEnv !== null && "ok" in maybeEnv && "command" in maybeEnv) {
        parsedAsEnvelope = true;
      }
    } catch {}
    expect(parsedAsEnvelope).toBe(false);
  });
});

describe("cli apply / add / novelty payload sources", () => {
  test("apply --file <path> reads operations from disk", async () => {
    await initWorkspace();
    const opsPath = join(workDir, "ops.json");
    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["files-flag"] },
            source: { type: "web_page", title: "From file", uri: "https://example.com/from-file" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    await writeFile(opsPath, JSON.stringify(payload), "utf8");

    const result = await runCliBinary(["apply", "--file", opsPath, "--atomic", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { meta: { rows_appended: number }; created: Array<{ kind: string }> };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created.length).toBe(1);
    expect(env.data.created[0]?.kind).toBe("source");
    expect(env.data.meta.rows_appended).toBe(1);
  });

  test("apply --file <relative path> resolves from workspace root", async () => {
    await initWorkspace();
    await mkdir(join(workDir, "raw"), { recursive: true });
    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["root-relative-file"] },
            source: { type: "web_page", title: "Root relative", uri: "https://example.com/root-relative" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    await writeFile(join(workDir, "raw", "ops.json"), JSON.stringify(payload), "utf8");

    const result = await runCliBinary(
      ["apply", "--root", workDir, "--file", "raw/ops.json", "--atomic", "--json"],
      { cwd: tmpdir() },
    );

    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { created: Array<{ kind: string }>; meta: { rows_appended: number } };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created[0]?.kind).toBe("source");
    expect(env.data.meta.rows_appended).toBe(1);
  });

  test("apply --json '<payload>' inline JSON form is honored", async () => {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["inline"] },
            source: { type: "web_page", title: "Inline", uri: "https://example.com/inline" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    });
    const result = await runCliBinary(["apply", "--json", payload, "--atomic", "--pretty"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout) as {
      ok: boolean;
      data: { created: unknown[] };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created.length).toBe(1);
  });

  test("apply --dry-run previews a batch without appending rows", async () => {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["dry-run"] },
            source: { type: "web_page", title: "Dry run", uri: "https://example.com/dry-run" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    });

    const result = await runCliBinary(["apply", "--json", payload, "--dry-run", "--pretty"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { created: unknown[]; meta: { dry_run: boolean; planned_rows: number; rows_appended: number } };
      meta: { dry_run: boolean; planned_rows: number; rows_appended: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created.length).toBe(1);
    expect(env.data.meta.dry_run).toBe(true);
    expect(env.data.meta.planned_rows).toBe(1);
    expect(env.data.meta.rows_appended).toBe(0);
    expect(env.meta.dry_run).toBe(true);
    expect(env.meta.planned_rows).toBe(1);
    expect(env.meta.rows_appended).toBe(0);

    const statusRun = await runCliBinary(["status", "--json"]);
    const statusEnv = JSON.parse(statusRun.stdout.trim()) as { data: { row_count: number } };
    expect(statusEnv.data.row_count).toBe(0);
  });

  test("apply --dry-run catches invalid relation labels without appending rows", async () => {
    await initWorkspace();
    const seedPayload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "a",
          row: {
            kind: "source",
            scope: { collections: ["dry-run-rel"] },
            source: { type: "web_page", title: "A", uri: "https://example.com/a" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          as: "b",
          row: {
            kind: "source",
            scope: { collections: ["dry-run-rel"] },
            source: { type: "web_page", title: "B", uri: "https://example.com/b" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    });
    const seed = await runCliBinary(["apply", "--json", seedPayload, "--pretty"]);
    const seedEnv = JSON.parse(seed.stdout.trim()) as { data: { created: Array<{ id: string }> } };
    const badPayload = JSON.stringify({
      operations: [
        {
          op: "relate",
          from_id: seedEnv.data.created[0]?.id,
          to_id: seedEnv.data.created[1]?.id,
          rel: "partial_answer_to",
          scope: { collections: ["dry-run-rel"] },
        },
      ],
    });

    const result = await runCliBinary(["apply", "--json", badPayload, "--dry-run", "--pretty"]);
    expect(result.code).toBe(3);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { issues?: Array<{ code?: string; path?: string; op_index?: number; op_path?: string }> } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("validation_failed");
    const relIssue = env.error.details?.issues?.find((issue) => issue.code === "relation_kind_invalid");
    expect(relIssue).toBeDefined();
    expect(relIssue?.op_index).toBe(0);
    expect(relIssue?.op_path).toBe("operations[0].rel");

    const statusRun = await runCliBinary(["status", "--json"]);
    const statusEnv = JSON.parse(statusRun.stdout.trim()) as { data: { row_count: number } };
    expect(statusEnv.data.row_count).toBe(2);
  });

  test("apply --dry-run rejects profile-invalid claims without appending rows", async () => {
    await initWorkspace();
    await mkdir(join(workDir, "knb", "profiles"), { recursive: true });
    await writeFile(
      join(workDir, "knb", "profiles", "prediction.json"),
      `${JSON.stringify({
        profile_version: "knb.profile.v1",
        name: "prediction-profile",
        select: { kinds: ["claim"], where: [{ path: "claim.type", eq: "prediction" }] },
        rules: [{ path: "claim.qualifiers.location", required: true, type: "string" }],
      }, null, 2)}\n`,
      "utf8",
    );
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "src",
          row: {
            kind: "source",
            scope: { collections: ["dry-profile"] },
            source: { type: "web_page", title: "Dry profile source", uri: "https://example.com/dry-profile" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["dry-profile"] },
            identity: { claim_key: "dry-profile|prediction" },
            claim: {
              statement: "Prediction missing location.",
              atomic: true,
              type: "prediction",
            },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$src", role: "supports", summary: "Backs prediction." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    });

    const result = await runCliBinary(["apply", "--json", payload, "--dry-run", "--pretty"]);

    expect(result.code).toBe(3);
    const env = JSON.parse(result.stderr.trim()) as {
      error: { code: string; details?: { issues?: Array<{ code?: string; op_index?: number; profile?: string }> } };
    };
    expect(env.error.code).toBe("validation_failed");
    expect(env.error.details?.issues).toContainEqual(expect.objectContaining({
      code: "profile_required_path",
      op_index: 1,
      profile: "prediction-profile",
    }));
    const statusEnv = JSON.parse((await runCliBinary(["status", "--json"])).stdout.trim()) as {
      data: { row_count: number };
    };
    expect(statusEnv.data.row_count).toBe(0);
  });

  test("apply rejects invalid operation shapes with operation-index diagnostics", async () => {
    await initWorkspace();
    const payload = JSON.stringify({ operations: [{ op: "delete" }] });

    const result = await runCliBinary(["apply", "--json", payload, "--pretty"]);
    expect(result.code).toBe(3);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { issues?: Array<{ code?: string; op_index?: number; op_path?: string }> } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("validation_failed");
    expect(env.error.details?.issues?.[0]?.code).toBe("operation_kind_invalid");
    expect(env.error.details?.issues?.[0]?.op_index).toBe(0);
    expect(env.error.details?.issues?.[0]?.op_path).toBe("operations[0].op");

    const statusRun = await runCliBinary(["status", "--json"]);
    const statusEnv = JSON.parse(statusRun.stdout.trim()) as { data: { row_count: number } };
    expect(statusEnv.data.row_count).toBe(0);
  });

  test("add --file <path> appends a single row", async () => {
    await initWorkspace();
    const rowPath = join(workDir, "row.json");
    const row = {
      kind: "source",
      scope: { collections: ["add-file"] },
      source: { type: "web_page", title: "Added via file", uri: "https://example.com/add-file" },
      provenance: { acquisition: { method: "manual" } },
    };
    await writeFile(rowPath, JSON.stringify(row), "utf8");

    const result = await runCliBinary(["add", "--file", rowPath, "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { created: Array<{ kind: string }>; meta: { rows_appended: number } };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created.length).toBe(1);
    expect(env.data.created[0]?.kind).toBe("source");
    expect(env.data.meta.rows_appended).toBe(1);
  });

  test("add --file <relative path> resolves from workspace root", async () => {
    await initWorkspace();
    await mkdir(join(workDir, "raw"), { recursive: true });
    const row = {
      kind: "source",
      scope: { collections: ["add-root-relative"] },
      source: { type: "web_page", title: "Added root relative", uri: "https://example.com/add-root-relative" },
      provenance: { acquisition: { method: "manual" } },
    };
    await writeFile(join(workDir, "raw", "row.json"), JSON.stringify(row), "utf8");

    const result = await runCliBinary(
      ["add", "--root", workDir, "--file", "raw/row.json", "--json"],
      { cwd: tmpdir() },
    );

    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { created: Array<{ kind: string }>; meta: { rows_appended: number } };
    };
    expect(env.ok).toBe(true);
    expect(env.data.created[0]?.kind).toBe("source");
    expect(env.data.meta.rows_appended).toBe(1);
  });

  test("novelty --file <path> classifies candidates from disk", async () => {
    await initWorkspace();
    const file = join(workDir, "candidates.json");
    await writeFile(
      file,
      JSON.stringify([
        {
          kind: "claim",
          scope: { collections: ["novelty"] },
          identity: { claim_key: "novelty|never-before-seen" },
          claim: { statement: "Never before seen.", atomic: true },
          assessment: { confidence: "low" },
        },
      ]),
      "utf8",
    );

    const result = await runCliBinary(["novelty", "--file", file, "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { results: Array<{ classification: string }> };
    };
    expect(env.ok).toBe(true);
    expect(env.data.results.length).toBe(1);
    expect(env.data.results[0]?.classification).toBe("new");
  });

  test("apply with no payload source returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--atomic", "--json"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
      meta: { exit_code: number };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("--file");
    expect(env.meta.exit_code).toBe(2);
  });

  test("apply --stdin with empty stdin returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--stdin", "--atomic", "--json"], { stdin: "" });
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message.toLowerCase()).toContain("stdin");
  });

  test("apply --stdin with malformed JSON returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--stdin", "--atomic", "--json"], {
      stdin: "{not-json",
    });
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string; details?: { source?: string } };
      meta: { exit_code: number };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message.toLowerCase()).toContain("parse");
    expect(env.error.details?.source).toBe("--stdin");
    expect(env.meta.exit_code).toBe(2);
  });

  test("apply --json with malformed inline JSON returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--json", "{not:json", "--atomic", "--pretty"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { source?: string } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.details?.source).toBe("--json");
  });

  test("apply --file with nonexistent path returns exit 5 io_failed", async () => {
    await initWorkspace();
    const result = await runCliBinary([
      "apply",
      "--file",
      join(workDir, "no-such-file.json"),
      "--atomic",
      "--json",
    ]);
    expect(result.code).toBe(5);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { path?: string } };
      meta: { exit_code: number };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("io_failed");
    expect(env.meta.exit_code).toBe(5);
  });

  test("apply --file with missing relative path reports input and workspace-resolved path", async () => {
    await initWorkspace();

    const result = await runCliBinary(
      ["apply", "--root", workDir, "--file", "raw/missing.json", "--atomic", "--json"],
      { cwd: tmpdir() },
    );

    expect(result.code).toBe(5);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { input_path?: string; resolved_path?: string } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("io_failed");
    expect(env.error.details?.input_path).toBe("raw/missing.json");
    expect(env.error.details?.resolved_path).toBe(join(workDir, "raw", "missing.json"));
  });

  test("apply payload that is a JSON array (not object) returns contract diagnostics", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--json", "[1,2,3]", "--atomic", "--pretty"]);
    expect(result.code).toBe(3);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { issues?: Array<{ code?: string; path?: string }> } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("validation_failed");
    expect(env.error.details?.issues?.[0]?.code).toBe("apply_request_invalid");
  });

  test("apply payload missing operations[] returns contract diagnostics", async () => {
    await initWorkspace();
    const result = await runCliBinary(["apply", "--json", "{}", "--atomic", "--pretty"]);
    expect(result.code).toBe(3);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { issues?: Array<{ code?: string; path?: string }> } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("validation_failed");
    expect(env.error.details?.issues?.[0]?.code).toBe("apply_request_invalid");
    expect(env.error.details?.issues?.[0]?.path).toBe("operations");
  });

  test("novelty with non-array, non-{candidates} payload returns exit 2", async () => {
    await initWorkspace();
    const result = await runCliBinary(["novelty", "--json", "{}", "--pretty"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("candidates");
  });

  test("apply --stdin with very large payload (>5000 ops) does not deadlock and succeeds", async () => {
    await initWorkspace();
    const ops = Array.from({ length: 5000 }, (_, i) => ({
      op: "add",
      row: {
        kind: "source",
        scope: { collections: ["bulk"] },
        source: {
          type: "web_page",
          title: `Bulk ${i}`,
          uri: `https://example.com/bulk/${i}`,
        },
        provenance: { acquisition: { method: "manual" } },
      },
    }));
    const payload = JSON.stringify({ operations: ops });

    const result = await runCliBinary(["apply", "--stdin", "--atomic", "--json"], {
      stdin: payload,
    });
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { meta: { rows_appended: number } };
    };
    expect(env.ok).toBe(true);
    expect(env.data.meta.rows_appended).toBe(5000);
  }, 30000);
});

describe("cli get / query / context / novelty success envelopes", () => {
  test("get with no positional ids returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["get", "--json"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
      command?: string;
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("at least one id");
    expect(env.command).toBe("get");
  });

  test("get all-not-found returns exit 1 not_found with stderr envelope", async () => {
    await initWorkspace();
    const result = await runCliBinary(["get", "src:does:not:exist:deadbeef", "--json"]);
    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string };
      meta: { exit_code: number };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("not_found");
    expect(env.meta.exit_code).toBe(1);
  });

  test("get with mix of found and not-found returns exit 0 and not_found list", async () => {
    await initWorkspace();
    const addRun = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["mix"] },
        source: { type: "web_page", title: "Mix", uri: "https://example.com/mix" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    expect(addRun.code).toBe(0);
    const addEnv = JSON.parse(addRun.stdout.trim()) as {
      data: { created: Array<{ id: string }> };
    };
    const realId = addEnv.data.created[0]?.id ?? "";
    expect(realId.length).toBeGreaterThan(0);

    const result = await runCliBinary([
      "get",
      realId,
      "src:phantom:0:0",
      "--json",
    ]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { rows: Array<{ id: string; status: string }>; not_found: string[] };
    };
    expect(env.ok).toBe(true);
    expect(env.data.rows.length).toBe(1);
    expect(env.data.rows[0]?.id).toBe(realId);
    expect(env.data.not_found).toEqual(["src:phantom:0:0"]);
  });

  test("query returns rows with total_returned and meta.rows_returned matching", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["q"] },
        source: { type: "web_page", title: "Q1", uri: "https://example.com/q1" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["q"] },
        source: { type: "web_page", title: "Q2", uri: "https://example.com/q2" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["query", "--collection", "q", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { rows: unknown[]; total_returned: number; total_matched: number };
      meta: { rows_returned: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.rows.length).toBe(2);
    expect(env.data.total_returned).toBe(2);
    expect(env.data.total_matched).toBe(2);
    expect(env.meta.rows_returned).toBe(2);
  });

  test("query --kind <kind> filters by kind", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["kindtest"] },
        source: { type: "web_page", title: "kt-source", uri: "https://example.com/kt" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["query", "--kind", "claim", "--collection", "kindtest", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: { rows: unknown[]; total_returned: number };
    };
    expect(env.data.rows.length).toBe(0);
    expect(env.data.total_returned).toBe(0);
  });

  test("query --citing filters claims by cited source URI", async () => {
    await initWorkspace();
    const sourceAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["cite"] },
        source: { type: "web_page", title: "Cited", uri: "https://example.com/cited" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    expect(sourceAdd.code).toBe(0);
    const sourceEnv = JSON.parse(sourceAdd.stdout.trim()) as {
      data: { created: Array<{ id: string }> };
    };
    const sourceId = sourceEnv.data.created[0]!.id;

    const claimAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "claim",
        scope: { collections: ["cite"] },
        identity: { claim_key: "cite|one" },
        claim: { statement: "Cited claim.", atomic: true },
        time: { precision: "unknown" },
        provenance: {
          evidence: [{ source_id: sourceId, role: "supports", summary: "Cited source." }],
        },
        assessment: { confidence: "high" },
      }),
    ]);
    expect(claimAdd.code).toBe(0);

    const result = await runCliBinary(["query", "--citing", "https://example.com/cited", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: { rows: Array<{ id: string; kind: string }>; total_returned: number };
    };
    expect(env.data.total_returned).toBe(1);
    expect(env.data.rows[0]?.kind).toBe("claim");
    expect(env.data.rows[0]?.id).toContain("claim:cite:");
  });

  test("query structured filters use --claim-type, --qualifier, and --external-ref", async () => {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "src",
          row: {
            kind: "source",
            scope: { collections: ["structured-cli"] },
            source: { type: "web_page", title: "Structured source", uri: "https://example.com/structured-cli" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["structured-cli"] },
            external_refs: [{ system: "kalshi", id: "KXIRAN-20260501", type: "market" }],
            identity: { claim_key: "structured|match" },
            claim: {
              statement: "Structured CLI match.",
              atomic: true,
              type: "prediction",
              qualifiers: { location: "tehran", date: "2026-05-03" },
            },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$src", role: "supports", summary: "Backs match." }],
            },
            assessment: { confidence: "high" },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["structured-cli"] },
            external_refs: [{ system: "kalshi", id: "KXOTHER", type: "market" }],
            identity: { claim_key: "structured|miss" },
            claim: {
              statement: "Structured CLI miss.",
              atomic: true,
              type: "prediction",
              qualifiers: { location: "shiraz", date: "2026-05-03" },
            },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$src", role: "supports", summary: "Backs miss." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    });
    const applied = await runCliBinary(["apply", "--json", payload, "--pretty"]);
    expect(applied.code).toBe(0);

    const result = await runCliBinary([
      "query",
      "--collection",
      "structured-cli",
      "--claim-type",
      "prediction",
      "--qualifier",
      "location=tehran",
      "--qualifier",
      "date=2026-05-03",
      "--external-ref",
      "kalshi:KXIRAN-20260501",
      "--json",
    ]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: { rows: Array<{ text?: string; kind: string }>; total_returned: number };
    };
    expect(env.data.total_returned).toBe(1);
    expect(env.data.rows.map((row) => row.text)).toEqual(["Structured CLI match."]);
  });

  test("query --qualifier with invalid syntax returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["query", "--qualifier", "not-a-pair", "--json"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("key=value");
  });

  test("query --limit caps total_returned but not total_matched", async () => {
    await initWorkspace();
    for (let i = 0; i < 4; i += 1) {
      await runCliBinary([
        "add",
        "--json",
        JSON.stringify({
          kind: "source",
          scope: { collections: ["limit"] },
          source: { type: "web_page", title: `lim-${i}`, uri: `https://example.com/lim/${i}` },
          provenance: { acquisition: { method: "manual" } },
        }),
      ]);
    }
    const result = await runCliBinary(["query", "--collection", "limit", "--limit", "2", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: { rows: unknown[]; total_returned: number; total_matched: number };
    };
    expect(env.data.rows.length).toBe(2);
    expect(env.data.total_returned).toBe(2);
    expect(env.data.total_matched).toBe(4);
  });

  test("context returns a packet with summary and key_claims arrays", async () => {
    await initWorkspace();
    const sourceAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["ctx"] },
        source: { type: "web_page", title: "Ctx-src", uri: "https://example.com/ctx" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    expect(sourceAdd.code).toBe(0);
    const sourceId = (JSON.parse(sourceAdd.stdout.trim()) as {
      data: { created: Array<{ id: string }> };
    }).data.created[0]?.id ?? "";

    const claimAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "claim",
        scope: { collections: ["ctx"] },
        identity: { claim_key: "ctx|x" },
        claim: { statement: "x is true", atomic: true },
        time: { precision: "unknown" },
        provenance: {
          source_ids: [sourceId],
          evidence: [{ source_id: sourceId, role: "supports", summary: "Backs x." }],
        },
        assessment: { confidence: "high" },
      }),
    ]);
    expect(claimAdd.code).toBe(0);

    const result = await runCliBinary(["context", "--collection", "ctx", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { summary: string; key_claims: Array<{ id: string }> };
    };
    expect(env.ok).toBe(true);
    expect(typeof env.data.summary).toBe("string");
    expect(Array.isArray(env.data.key_claims)).toBe(true);
    expect(env.data.key_claims.length).toBeGreaterThan(0);
  });

  test("context --recency-window-days changes ranking for time-spread claims", async () => {
    await initWorkspace();
    const sourceAdd = await runCliBinary([
      "apply",
      "--json",
      JSON.stringify({
        now: "2026-05-01T12:00:00Z",
        operations: [
          {
            op: "add",
            row: {
              kind: "source",
              scope: { collections: ["ctx-recency"] },
              source: { type: "web_page", title: "Ctx recency source", uri: "https://example.com/ctx-recency" },
              provenance: { acquisition: { method: "manual" } },
            },
          },
        ],
      }),
    ]);
    expect(sourceAdd.code).toBe(0);
    const sourceId = (JSON.parse(sourceAdd.stdout.trim()) as {
      data: { created: Array<{ id: string }> };
    }).data.created[0]?.id ?? "";

    for (const entry of [
      {
        now: "2026-04-01T12:00:00Z",
        key: "ctx-recency|old",
        statement: "Older deeper-evidence context claim.",
        confidence: "high",
        evidenceCount: 2,
      },
      {
        now: "2026-05-01T12:00:00Z",
        key: "ctx-recency|recent",
        statement: "Recent thinner-evidence context claim.",
        confidence: "high",
        evidenceCount: 1,
      },
    ] as const) {
      const claimAdd = await runCliBinary([
        "apply",
        "--json",
        JSON.stringify({
          now: entry.now,
          operations: [
            {
              op: "add",
              row: {
                kind: "claim",
                scope: { collections: ["ctx-recency"] },
                identity: { claim_key: entry.key },
                claim: { statement: entry.statement, atomic: true },
                time: { precision: "unknown" },
                provenance: {
                  source_ids: [sourceId],
                  evidence: Array.from({ length: entry.evidenceCount }, (_, index) => ({
                    source_id: sourceId,
                    role: "supports",
                    summary: `Backs claim ${index}.`,
                  })),
                },
                assessment: { importance: "high", confidence: entry.confidence },
              },
            },
          ],
        }),
      ]);
      expect(claimAdd.code).toBe(0);
    }

    const defaultResult = await runCliBinary(["context", "--collection", "ctx-recency", "--json"]);
    expect(defaultResult.code).toBe(0);
    const defaultEnv = JSON.parse(defaultResult.stdout.trim()) as {
      data: { key_claims: Array<{ statement: string }> };
    };
    expect(defaultEnv.data.key_claims.map((row) => row.statement)).toEqual([
      "Older deeper-evidence context claim.",
      "Recent thinner-evidence context claim.",
    ]);

    const recencyResult = await runCliBinary([
      "context",
      "--collection",
      "ctx-recency",
      "--recency-window-days",
      "45",
      "--json",
    ]);
    expect(recencyResult.code).toBe(0);
    const recencyEnv = JSON.parse(recencyResult.stdout.trim()) as {
      data: { key_claims: Array<{ statement: string }> };
    };
    expect(recencyEnv.data.key_claims.map((row) => row.statement)).toEqual([
      "Recent thinner-evidence context claim.",
      "Older deeper-evidence context claim.",
    ]);
  });

  test("context structured filters use --claim-type, --qualifier, and --external-ref", async () => {
    await initWorkspace();
    const payload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "src",
          row: {
            kind: "source",
            scope: { collections: ["ctx-structured"] },
            source: { type: "web_page", title: "Context structured source", uri: "https://example.com/ctx-structured" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["ctx-structured"] },
            external_refs: [{ system: "kalshi", id: "KXCTX", type: "market" }],
            identity: { claim_key: "ctx-structured|match" },
            claim: {
              statement: "Context structured match.",
              atomic: true,
              type: "prediction",
              qualifiers: { location: "tehran", date: "2026-05-03" },
            },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$src", role: "supports", summary: "Backs match." }],
            },
            assessment: { confidence: "high" },
          },
        },
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["ctx-structured"] },
            external_refs: [{ system: "kalshi", id: "KXMISS", type: "market" }],
            identity: { claim_key: "ctx-structured|miss" },
            claim: {
              statement: "Context structured miss.",
              atomic: true,
              type: "prediction",
              qualifiers: { location: "shiraz", date: "2026-05-03" },
            },
            time: { precision: "unknown" },
            provenance: {
              evidence: [{ source_id: "$src", role: "supports", summary: "Backs miss." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    });
    const applied = await runCliBinary(["apply", "--json", payload, "--pretty"]);
    expect(applied.code).toBe(0);

    const result = await runCliBinary([
      "context",
      "--collection",
      "ctx-structured",
      "--claim-type",
      "prediction",
      "--qualifier",
      "location=tehran",
      "--external-ref",
      "kalshi:KXCTX",
      "--json",
    ]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: {
        key_claims: Array<{ id: string; statement: string; source_ids: string[] }>;
        sources: Array<{ id: string; title: string }>;
      };
    };
    expect(env.data.key_claims.map((claim) => claim.statement)).toEqual(["Context structured match."]);
    expect(env.data.sources.map((source) => source.title)).toEqual(["Context structured source"]);
    expect(env.data.key_claims[0]!.source_ids).toEqual([env.data.sources[0]!.id]);
  });

  test("read commands honor --as-of across query, get, context, and render", async () => {
    const { sourceId, claimId } = await seedAsOfFixture();

    const getBeforeClaim = await runCliBinary([
      "get",
      sourceId,
      claimId,
      "--as-of",
      "2026-05-01T00:30:00Z",
      "--json",
    ]);
    expect(getBeforeClaim.code).toBe(0);
    const getEnv = JSON.parse(getBeforeClaim.stdout.trim()) as {
      data: { rows: Array<{ id: string }>; not_found: string[] };
    };
    expect(getEnv.data.rows.map((row) => row.id)).toEqual([sourceId]);
    expect(getEnv.data.not_found).toEqual([claimId]);

    const queryAtClaim = await runCliBinary([
      "query",
      "--collection",
      "asof-cli",
      "--kind",
      "claim",
      "--as-of",
      "2026-05-01T01:30:00Z",
      "--json",
    ]);
    expect(queryAtClaim.code).toBe(0);
    const queryEnv = JSON.parse(queryAtClaim.stdout.trim()) as {
      data: { rows: Array<{ id: string; status: string; text?: string }> };
    };
    expect(queryEnv.data.rows.map((row) => row.id)).toEqual([claimId]);
    expect(queryEnv.data.rows[0]?.status).toBe("active");

    const historyQuery = await runCliBinary([
      "query",
      "--collection",
      "asof-cli",
      "--kind",
      "claim",
      "--history",
      "--as-of",
      "2026-05-01T02:30:00Z",
      "--json",
    ]);
    expect(historyQuery.code).toBe(0);
    const historyEnv = JSON.parse(historyQuery.stdout.trim()) as {
      data: { rows: Array<{ id: string; status: string }> };
    };
    expect(historyEnv.data.rows.map((row) => [row.id, row.status])).toEqual([[claimId, "retracted"]]);

    const contextAtClaim = await runCliBinary([
      "context",
      "--collection",
      "asof-cli",
      "--as-of",
      "2026-05-01T01:30:00Z",
      "--json",
    ]);
    expect(contextAtClaim.code).toBe(0);
    const contextEnv = JSON.parse(contextAtClaim.stdout.trim()) as {
      data: {
        key_claims: Array<{ id: string }>;
        syntheses: Array<{ title: string }>;
        open_questions: Array<{ text: string }>;
      };
    };
    expect(contextEnv.data.key_claims.map((claim) => claim.id)).toEqual([claimId]);
    expect(contextEnv.data.syntheses.map((synthesis) => synthesis.title)).toEqual(["CLI AsOf Synthesis"]);
    expect(contextEnv.data.open_questions).toEqual([]);

    const renderAtClaim = await runCliBinary([
      "render",
      "--collection",
      "asof-cli",
      "--as-of",
      "2026-05-01T01:30:00Z",
      "--json",
    ]);
    expect(renderAtClaim.code).toBe(0);
    const renderEnv = JSON.parse(renderAtClaim.stdout.trim()) as {
      data: { path: string; metadata: { options: Record<string, unknown> } };
    };
    const markdown = await readFile(renderEnv.data.path, "utf8");
    expect(markdown).toContain("CLI time-travel claim.");
    expect(markdown).toContain("CLI historical synthesis.");
    expect(markdown).not.toContain("CLI question after cutoff?");
    expect(renderEnv.data.metadata.options.asOf).toBe("2026-05-01T01:30:00Z");
  });

  test("query --as-of with invalid timestamp returns exit 2 invalid_arguments", async () => {
    await seedAsOfFixture("bad-asof-cli");
    const result = await runCliBinary(["query", "--as-of", "not-a-timestamp", "--json"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("Invalid asOf timestamp");
  });

  test("novelty inline payload classifies new vs duplicate against ledger", async () => {
    await initWorkspace();
    const sourceAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["nv"] },
        source: { type: "web_page", title: "nv-src", uri: "https://example.com/nv" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    expect(sourceAdd.code).toBe(0);
    const sourceId = (JSON.parse(sourceAdd.stdout.trim()) as {
      data: { created: Array<{ id: string }> };
    }).data.created[0]?.id ?? "";

    const claimAdd = await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "claim",
        scope: { collections: ["nv"] },
        identity: { claim_key: "nv|key1" },
        claim: { statement: "Existing claim text.", atomic: true },
        time: { precision: "unknown" },
        provenance: {
          source_ids: [sourceId],
          evidence: [{ source_id: sourceId, role: "supports", summary: "Backs claim." }],
        },
        assessment: { confidence: "high" },
      }),
    ]);
    expect(claimAdd.code).toBe(0);

    const candidates = JSON.stringify({
      candidates: [
        {
          kind: "claim",
          scope: { collections: ["nv"] },
          identity: { claim_key: "nv|key1" },
          claim: { statement: "Existing claim text.", atomic: true },
          assessment: { confidence: "high" },
        },
        {
          kind: "claim",
          scope: { collections: ["nv"] },
          identity: { claim_key: "nv|fresh" },
          claim: { statement: "Brand new claim.", atomic: true },
          assessment: { confidence: "low" },
        },
      ],
    });
    const result = await runCliBinary(["novelty", "--json", candidates, "--pretty"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout) as {
      ok: boolean;
      data: { results: Array<{ classification: string }> };
    };
    expect(env.ok).toBe(true);
    expect(env.data.results.length).toBe(2);
    expect(env.data.results[0]?.classification).toBe("duplicate");
    expect(env.data.results[1]?.classification).toBe("new");
  });
});

describe("cli render / check / index", () => {
  test("render without --collection returns exit 2 invalid_arguments", async () => {
    await initWorkspace();
    const result = await runCliBinary(["render", "--json"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
      command?: string;
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("--collection");
    expect(env.command).toBe("render");
  });

  test("render --collection writes view file and returns bytes_written", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["renderc"] },
        source: { type: "web_page", title: "Render", uri: "https://example.com/render" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["render", "--collection", "renderc", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { path: string; bytes_written: number; format: string };
      meta: { bytes_written: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.format).toBe("md");
    expect(env.data.path.endsWith(join("knb", "views", "renderc.md"))).toBe(true);
    expect(env.data.bytes_written).toBeGreaterThan(0);
    expect(env.meta.bytes_written).toBe(env.data.bytes_written);
    expect(await pathExists(env.data.path)).toBe(true);
  });

  test("render --all writes one view per active collection and returns total bytes", async () => {
    await initWorkspace();
    for (const collection of ["cli-beta", "cli-alpha"]) {
      await runCliBinary([
        "add",
        "--json",
        JSON.stringify({
          kind: "source",
          scope: { collections: [collection] },
          source: {
            type: "web_page",
            title: `Render ${collection}`,
            uri: `https://example.com/${collection}`,
          },
          provenance: { acquisition: { method: "manual" } },
        }),
      ]);
    }

    const result = await runCliBinary(["render", "--all", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: {
        collections: string[];
        rendered: Array<{ path: string; bytes_written: number }>;
        total_bytes_written: number;
      };
      meta: { collections_rendered: number; bytes_written: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.collections).toEqual(["cli-alpha", "cli-beta"]);
    expect(env.data.rendered.length).toBe(2);
    expect(env.meta.collections_rendered).toBe(2);
    expect(env.meta.bytes_written).toBe(env.data.total_bytes_written);
    for (const entry of env.data.rendered) {
      expect(entry.bytes_written).toBeGreaterThan(0);
      expect(await pathExists(entry.path)).toBe(true);
    }
  });

  test("render rejects --collection combined with --all", async () => {
    await initWorkspace();
    const result = await runCliBinary(["render", "--collection", "x", "--all", "--json"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("--collection");
    expect(env.error.message).toContain("--all");
  });

  test("check before any render reports ok=false but exits 0", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { collections: ["chk"] },
        source: { type: "web_page", title: "Chk", uri: "https://example.com/chk" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    const result = await runCliBinary(["check", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { ok: boolean };
    };
    expect(env.ok).toBe(true);
    expect(env.data.ok).toBe(false);
  });

  test("check --json reports profile validation failures", async () => {
    await initWorkspace();
    await mkdir(join(workDir, "knb", "profiles"), { recursive: true });
    await writeFile(
      join(workDir, "knb", "profiles", "prediction.json"),
      `${JSON.stringify({
        profile_version: "knb.profile.v1",
        name: "prediction-profile",
        select: { kinds: ["claim"], where: [{ path: "claim.type", eq: "prediction" }] },
        rules: [{ path: "claim.qualifiers.location", required: true, type: "string" }],
      }, null, 2)}\n`,
      "utf8",
    );
    const sourcePayload = JSON.stringify({
      kind: "source",
      scope: { collections: ["profile-check"] },
      source: { type: "web_page", title: "Profile check source", uri: "https://example.com/profile-check" },
      provenance: { acquisition: { method: "manual" } },
    });
    const applied = await runCliBinary(["add", "--json", sourcePayload, "--json"]);
    expect(applied.code).toBe(0);
    const appliedEnv = JSON.parse(applied.stdout.trim()) as { data: { created: Array<{ id: string }> } };
    const sourceId = appliedEnv.data.created[0]!.id;
    await appendFile(
      join(workDir, "knb", "ledger.jsonl"),
      `${JSON.stringify({
        schema_version: "knb.v1",
        id: "claim:profile-check:20260501:manual01",
        kind: "claim",
        created_at: "2026-05-01T12:01:00Z",
        created_by: "agent:test",
        scope: { collections: ["profile-check"] },
        identity: { claim_key: "profile-check|prediction" },
        claim: {
          statement: "Prediction missing location.",
          atomic: true,
          type: "prediction",
        },
        time: { precision: "unknown" },
        provenance: {
          evidence: [{ source_id: sourceId, role: "supports", summary: "Backs prediction." }],
        },
        assessment: { confidence: "high" },
      })}\n`,
      "utf8",
    );

    const result = await runCliBinary(["check", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: {
        ok: boolean;
        validation_issues: Array<{ code?: string; profile?: string; path?: string; message: string }>;
      };
    };
    const issue = env.data.validation_issues.find((candidate) => candidate.code === "profile_required_path");
    expect(env.data.ok).toBe(false);
    expect(issue?.profile).toBe("prediction-profile");
    expect(issue?.path).toBe("claim.qualifiers.location");
    expect(issue?.message).toContain("prediction-profile");
  });

  test("index without --rebuild returns projection_freshness only", async () => {
    await initWorkspace();
    const result = await runCliBinary(["index", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      command: string;
      data: { projection_freshness: { entries: unknown[] } };
    };
    expect(env.ok).toBe(true);
    expect(env.command).toBe("index");
    expect(Array.isArray(env.data.projection_freshness.entries)).toBe(true);
  });

  test("index --rebuild produces V1 sidecars in the indexes directory", async () => {
    await initWorkspace();
    const result = await runCliBinary(["index", "--rebuild", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { indexes: Array<{ name: string; path: string; bytes_written: number }> };
    };
    expect(env.ok).toBe(true);
    expect(env.data.indexes.length).toBe(6);
    expect(env.data.indexes.map((entry) => entry.name).sort()).toEqual([
      "active-by-collection",
      "active-by-id",
      "active-claims-by-key",
      "active-claims-by-source-uri",
      "active-sources-by-content-hash",
      "active-sources-by-uri",
    ]);
    for (const entry of env.data.indexes) {
      expect(entry.bytes_written).toBeGreaterThan(0);
      expect(await pathExists(entry.path)).toBe(true);
    }
  });
});

describe("cli envelope structure invariants", () => {
  test("every success envelope has ok/command/data/meta and no error key", async () => {
    await initWorkspace();
    const commands = [
      ["status"],
      ["schema"],
      ["check"],
      ["index"],
    ];
    for (const args of commands) {
      const result = await runCliBinary([...args, "--json"]);
      expect(result.code).toBe(0);
      const env = JSON.parse(result.stdout.trim()) as Record<string, unknown>;
      expect(env.ok).toBe(true);
      expect(env.command).toBe(args[0]);
      expect(env).toHaveProperty("data");
      expect(env).toHaveProperty("meta");
      expect(env).not.toHaveProperty("error");
      expect(typeof (env.meta as { elapsed_ms?: unknown }).elapsed_ms).toBe("number");
    }
  });

  test("every failure envelope has ok=false, error.code, error.message, meta.exit_code", async () => {
    await initWorkspace();
    const failures: Array<{ args: string[]; expectedCode: number; expectedErrorCode: string }> = [
      { args: ["totally-unknown"], expectedCode: 2, expectedErrorCode: "invalid_arguments" },
      { args: ["render"], expectedCode: 2, expectedErrorCode: "invalid_arguments" },
      { args: ["get"], expectedCode: 2, expectedErrorCode: "invalid_arguments" },
      { args: ["get", "src:phantom:0:00000000"], expectedCode: 1, expectedErrorCode: "not_found" },
    ];
    for (const f of failures) {
      const result = await runCliBinary([...f.args, "--json"]);
      expect(result.code).toBe(f.expectedCode);
      expect(result.stdout).toBe("");
      const env = JSON.parse(result.stderr.trim()) as {
        ok: boolean;
        error: { code: string; message: string };
        meta: { exit_code: number; elapsed_ms?: unknown };
      };
      expect(env.ok).toBe(false);
      expect(env.error.code).toBe(f.expectedErrorCode);
      expect(typeof env.error.message).toBe("string");
      expect(env.error.message.length).toBeGreaterThan(0);
      expect(env.meta.exit_code).toBe(f.expectedCode);
    }
  });

  test("--quiet on failure writes only the error code to stderr", async () => {
    const result = await runCliBinary(["totally-unknown", "--quiet"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    expect(result.stderr.trim()).toBe("invalid_arguments");
  });
});
