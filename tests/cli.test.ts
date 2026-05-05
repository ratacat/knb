import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
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

async function seedAsOfFixture(profile = "asof-cli"): Promise<{ sourceId: string; claimId: string }> {
  await initWorkspace();
  const sourcePayload = JSON.stringify({
    now: "2026-05-01T00:00:00Z",
    operations: [
      {
        op: "add",
        as: "src",
        row: {
          kind: "source",
          scope: { profiles: [profile] },
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
          scope: { profiles: [profile] },
          identity: { claim_key: `${profile}|claim` },
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
          scope: { profiles: [profile] },
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
          scope: { profiles: [profile] },
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
      row_samples: unknown[];
      operation_samples: unknown[];
    };
    expect(data.schema_version).toBe("knb.v1");
    expect(typeof data.json_schema).toBe("object");
    expect(data.json_schema).not.toBeNull();
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
      "schema",
      "apply",
      "add",
      "get",
      "query",
      "context",
      "render",
      "check",
      "index",
    ]) {
      expect(text).toContain(`knb ${cmd}`);
    }
    expect(text).not.toContain("knb validate");
    expect(text).not.toContain("knb append");
    expect(text).not.toContain("knb profiles");
    expect(text).not.toContain("status --profile");
    expect(text).not.toContain("knb log");
    expect(text).not.toContain("render --all");
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

  test("help text lists attached profile instructions when a workspace has profiles", async () => {
    const init = await runCliBinary(["init", "--json"]);
    expect(init.code).toBe(0);
    const create = await runCliBinary(
      ["profile", "create", "research.v1", "--stdin", "--attach", "--json"],
      {
        stdin: JSON.stringify({
          display_name: "Research",
          agent_instructions: [
            "Use this profile for sourced research records.",
            "Keep claims atomic and cite sources.",
          ],
        }),
      },
    );
    expect(create.code).toBe(0);

    const result = await runCliBinary(["help"]);

    expect(result.code).toBe(0);
    expect(result.stdout).toContain("profiles:");
    expect(result.stdout).toContain("research.v1: Use this profile for sourced research records.");
    expect(result.stdout).toContain("profile instructions: knb profile show <id> --json");
  });

});

describe("cli profile and instance commands", () => {
  test("profile create --stdin --attach is visible through list and instance show", async () => {
    const initRun = await runCliBinary(["init", "--json"]);
    expect(initRun.code).toBe(0);

    const payload = JSON.stringify({
      display_name: "Research",
      description: "General research profile.",
      record_types: [{ type: "record" }],
      link_types: [{ rel: "depends_on" }],
    });
    const create = await runCliBinary(
      ["profile", "create", "research.v1", "--stdin", "--attach", "--json"],
      { stdin: payload },
    );
    expect(create.code).toBe(0);
    const createEnv = JSON.parse(create.stdout.trim()) as {
      ok: boolean;
      command: string;
      data: { profile: { profile_id: string; schema_version: string }; attached: boolean; created: boolean };
    };
    expect(createEnv.ok).toBe(true);
    expect(createEnv.command).toBe("profile create");
    expect(createEnv.data.profile.profile_id).toBe("research.v1");
    expect(createEnv.data.profile.schema_version).toBe("knb.profile.v1");
    expect(createEnv.data.attached).toBe(true);
    expect(createEnv.data.created).toBe(true);

    const list = await runCliBinary(["profile", "list", "--attached", "--json"]);
    expect(list.code).toBe(0);
    const listEnv = JSON.parse(list.stdout.trim()) as {
      data: { profiles: Array<{ profile_id: string; defined: boolean; attached: boolean; display_name?: string; description?: string }> };
    };
    expect(listEnv.data.profiles).toEqual([{ profile_id: "research.v1", defined: true, attached: true, display_name: "Research", description: "General research profile." }]);

    const show = await runCliBinary(["instance", "show", "--json"]);
    expect(show.code).toBe(0);
    const showEnv = JSON.parse(show.stdout.trim()) as { data: { profiles: string[] } };
    expect(showEnv.data.profiles).toEqual(["research.v1"]);
  });

  test("profile show missing returns structured suggestions", async () => {
    const initRun = await runCliBinary(["init", "--json"]);
    expect(initRun.code).toBe(0);

    const result = await runCliBinary(["profile", "show", "missing.v1", "--json"]);

    expect(result.code).toBe(1);
    expect(result.stdout).toBe("");
    const env = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string; suggestions?: string[]; details?: { profile_id?: string } };
    };
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("not_found");
    expect(env.error.message).toContain("missing.v1");
    expect(env.error.details?.profile_id).toBe("missing.v1");
    expect(env.error.suggestions).toContain("knb profile list --json");
  });

  test("instance create targets the positional root and instance list finds it", async () => {
    const targetRoot = join(workDir, "nested", "research");

    const create = await runCliBinary([
      "instance",
      "create",
      targetRoot,
      "--instance-id",
      "research-main",
      "--profile",
      "research.v1",
      "--actor",
      "agent:cli-instance",
      "--json",
    ]);
    expect(create.code).toBe(0);
    const createEnv = JSON.parse(create.stdout.trim()) as {
      command: string;
      data: { workspace_root: string; instance_id: string; profiles: string[]; actor: string };
    };
    expect(createEnv.command).toBe("instance create");
    expect(createEnv.data.workspace_root).toBe(targetRoot);
    expect(createEnv.data.instance_id).toBe("research-main");
    expect(createEnv.data.profiles).toEqual(["research.v1"]);
    expect(createEnv.data.actor).toBe("agent:cli-instance");
    expect(await pathExists(join(targetRoot, ".knb", "config.json"))).toBe(true);

    const list = await runCliBinary(["instance", "list", "--under", workDir, "--json"]);
    expect(list.code).toBe(0);
    const listEnv = JSON.parse(list.stdout.trim()) as {
      data: { instances: Array<{ workspace_root: string; config_path: string; instance_id?: string; actor?: string; profiles: string[]; ok: boolean }> };
    };
    expect(listEnv.data.instances).toContainEqual({
      workspace_root: targetRoot,
      config_path: join(targetRoot, ".knb", "config.json"),
      instance_id: "research-main",
      actor: "agent:cli-instance",
      profiles: ["research.v1"],
      ok: true,
    });
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

  test("unknown flags are rejected instead of silently broadening scope", async () => {
    const initFirst = await runCliInProcess(["init"]);
    expect(initFirst.code).toBe(0);

    const result = await runCliInProcess(["status", "--no-such-flag", "--json"]);
    expect(result.code).toBe(2);
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; message: string; details?: { flag?: string; command?: string } };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.error.details?.flag).toBe("--no-such-flag");
    expect(envelope.error.details?.command).toBe("status");
  });

  test("removed --collection flag is rejected on scoped read commands", async () => {
    await initWorkspace();

    const result = await runCliBinary(["query", "--collection", "old", "--json"]);
    expect(result.code).toBe(2);
    expect(result.stdout).toBe("");
    const envelope = JSON.parse(result.stderr.trim()) as {
      ok: boolean;
      error: { code: string; details?: { flag?: string; command?: string } };
    };
    expect(envelope.ok).toBe(false);
    expect(envelope.error.code).toBe("invalid_arguments");
    expect(envelope.error.details?.flag).toBe("--collection");
    expect(envelope.error.details?.command).toBe("query");
  });

  test("known flags with the wrong value shape are rejected", async () => {
    await initWorkspace();

    const outputFlagValue = await runCliBinary(["query", "--json", "{\"not\":\"payload\"}"]);
    expect(outputFlagValue.code).toBe(2);
    const outputEnvelope = JSON.parse(outputFlagValue.stderr.trim()) as {
      error: { code: string; details?: { flag?: string; command?: string; value?: string } };
    };
    expect(outputEnvelope.error.code).toBe("invalid_arguments");
    expect(outputEnvelope.error.details?.flag).toBe("--json");
    expect(outputEnvelope.error.details?.command).toBe("query");

    const missingRoot = await runCliBinary(["status", "--root", "--json"]);
    expect(missingRoot.code).toBe(2);
    const rootEnvelope = JSON.parse(missingRoot.stderr.trim()) as {
      error: { code: string; details?: { flag?: string; command?: string; value?: string } };
    };
    expect(rootEnvelope.error.code).toBe("invalid_arguments");
    expect(rootEnvelope.error.details?.flag).toBe("--root");
    expect(rootEnvelope.error.details?.command).toBe("status");
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

describe("cli apply / add / add payload sources", () => {
  test("apply --file <path> reads operations from disk", async () => {
    await initWorkspace();
    const opsPath = join(workDir, "ops.json");
    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { profiles: ["files-flag"] },
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
            scope: { profiles: ["root-relative-file"] },
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
            scope: { profiles: ["inline"] },
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
            scope: { profiles: ["dry-run"] },
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

  test("apply --dry-run catches invalid link labels without appending rows", async () => {
    await initWorkspace();
    const seedPayload = JSON.stringify({
      operations: [
        {
          op: "add",
          as: "a",
          row: {
            kind: "source",
            scope: { profiles: ["dry-run-rel"] },
            source: { type: "web_page", title: "A", uri: "https://example.com/a" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          as: "b",
          row: {
            kind: "source",
            scope: { profiles: ["dry-run-rel"] },
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
          op: "link",
          from_id: seedEnv.data.created[0]?.id,
          to_id: seedEnv.data.created[1]?.id,
          rel: "partial_answer_to",
          scope: { profiles: ["dry-run-rel"] },
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
    const relIssue = env.error.details?.issues?.find((issue) => issue.code === "link_kind_invalid");
    expect(relIssue).toBeDefined();
    expect(relIssue?.op_index).toBe(0);
    expect(relIssue?.op_path).toBe("operations[0].rel");

    const statusRun = await runCliBinary(["status", "--json"]);
    const statusEnv = JSON.parse(statusRun.stdout.trim()) as { data: { row_count: number } };
    expect(statusEnv.data.row_count).toBe(2);
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
      scope: { profiles: ["add-file"] },
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

  test("add --dry-run is rejected so preview remains apply-only", async () => {
    await initWorkspace();
    const row = {
      kind: "source",
      scope: { profiles: ["add-dry-run"] },
      source: { type: "web_page", title: "Add dry run", uri: "https://example.com/add-dry-run" },
      provenance: { acquisition: { method: "manual" } },
    };

    const result = await runCliBinary(["add", "--json", JSON.stringify(row), "--dry-run", "--pretty"]);
    expect(result.code).toBe(2);
    const env = JSON.parse(result.stderr.trim()) as { error: { code: string; message: string } };
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message).toContain("knb add does not support --dry-run");

    const statusRun = await runCliBinary(["status", "--json"]);
    const statusEnv = JSON.parse(statusRun.stdout.trim()) as { data: { row_count: number } };
    expect(statusEnv.data.row_count).toBe(0);
  });

  test("add --file <relative path> resolves from workspace root", async () => {
    await initWorkspace();
    await mkdir(join(workDir, "raw"), { recursive: true });
    const row = {
      kind: "source",
      scope: { profiles: ["add-root-relative"] },
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

  test("apply --stdin with very large payload (>5000 ops) does not deadlock and succeeds", async () => {
    await initWorkspace();
    const ops = Array.from({ length: 5000 }, (_, i) => ({
      op: "add",
      row: {
        kind: "source",
        scope: { profiles: ["bulk"] },
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

describe("cli get / query / context success envelopes", () => {
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
        scope: { profiles: ["mix"] },
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
        scope: { profiles: ["q"] },
        source: { type: "web_page", title: "Q1", uri: "https://example.com/q1" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { profiles: ["q"] },
        source: { type: "web_page", title: "Q2", uri: "https://example.com/q2" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["query", "--profile", "q", "--json"]);
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
        scope: { profiles: ["kindtest"] },
        source: { type: "web_page", title: "kt-source", uri: "https://example.com/kt" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["query", "--kind", "claim", "--profile", "kindtest", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      data: { rows: unknown[]; total_returned: number };
    };
    expect(env.data.rows.length).toBe(0);
    expect(env.data.total_returned).toBe(0);
  });

  test("query --limit caps total_returned but not total_matched", async () => {
    await initWorkspace();
    for (let i = 0; i < 4; i += 1) {
      await runCliBinary([
        "add",
        "--json",
        JSON.stringify({
          kind: "source",
          scope: { profiles: ["limit"] },
          source: { type: "web_page", title: `lim-${i}`, uri: `https://example.com/lim/${i}` },
          provenance: { acquisition: { method: "manual" } },
        }),
      ]);
    }
    const result = await runCliBinary(["query", "--profile", "limit", "--limit", "2", "--json"]);
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
        scope: { profiles: ["ctx"] },
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
        scope: { profiles: ["ctx"] },
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

    const result = await runCliBinary(["context", "--profile", "ctx", "--json"]);
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
      "--profile",
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
      "--profile",
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
      "--profile",
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
      "--profile",
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

});

describe("cli render / check / index", () => {
  test("render without --profile writes instance view", async () => {
    await initWorkspace();
    const result = await runCliBinary(["render", "--json"]);
    expect(result.code).toBe(0);
    const env = JSON.parse(result.stdout.trim()) as {
      ok: boolean;
      data: { path: string; view: string; bytes_written: number; format: string };
      meta: { bytes_written: number };
    };
    expect(env.ok).toBe(true);
    expect(env.data.view).toBe("instance");
    expect(env.data.format).toBe("md");
    expect(env.data.path.endsWith(join("knb", "views", "instance.md"))).toBe(true);
    expect(env.data.bytes_written).toBeGreaterThan(0);
    expect(env.meta.bytes_written).toBe(env.data.bytes_written);
    expect(await pathExists(env.data.path)).toBe(true);
  });

  test("render --profile writes view file and returns bytes_written", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { profiles: ["renderc"] },
        source: { type: "web_page", title: "Render", uri: "https://example.com/render" },
        provenance: { acquisition: { method: "manual" } },
      }),
    ]);

    const result = await runCliBinary(["render", "--profile", "renderc", "--json"]);
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

  test("check before any render reports ok=false but exits 0", async () => {
    await initWorkspace();
    await runCliBinary([
      "add",
      "--json",
      JSON.stringify({
        kind: "source",
        scope: { profiles: ["chk"] },
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
      "active-by-id",
      "active-by-profile",
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
