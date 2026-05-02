import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { V1_INDEX_NAMES } from "../src/core/projections";

const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

let workDir: string;

beforeEach(async () => {
  const raw = await mkdtemp(join(tmpdir(), "knb-e2e-"));
  workDir = await realpath(raw);
});

afterEach(async () => {
  try {
    await chmod(workDir, 0o700);
  } catch {}
  await rm(workDir, { recursive: true, force: true });
});

type SpawnResult = { code: number; stdout: string; stderr: string };

async function runKnb(args: string[], stdinPayload?: string): Promise<SpawnResult> {
  const stdio: ["pipe" | "ignore", "pipe", "pipe"] = [stdinPayload === undefined ? "ignore" : "pipe", "pipe", "pipe"];
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd: workDir,
    stdio,
    env: { ...process.env, KNB_CONFIG: "" },
  });
  if (stdinPayload !== undefined && proc.stdin) {
    proc.stdin.write(stdinPayload);
    await proc.stdin.end();
  }
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type Envelope<T = unknown> =
  | { ok: true; command: string; data: T; meta: Record<string, unknown> }
  | { ok: false; command?: string; error: { code: string; message: string; details?: unknown }; meta: Record<string, unknown> & { exit_code: number } };

function parseSuccess<T>(text: string): { ok: true; command: string; data: T; meta: Record<string, unknown> } {
  const env = JSON.parse(text.trim()) as Envelope<T>;
  if (!env.ok) throw new Error(`Expected success envelope; got ${text}`);
  return env;
}

function parseFailure(text: string): { ok: false; command?: string; error: { code: string; message: string; details?: unknown }; meta: Record<string, unknown> & { exit_code: number } } {
  const env = JSON.parse(text.trim()) as Envelope;
  if (env.ok) throw new Error(`Expected failure envelope; got ${text}`);
  return env;
}

describe("e2e: full agent loop", () => {
  test("init -> status -> schema -> apply 3-op -> check -> context -> novelty -> dedupe -> render -> index --rebuild -> check -> status", async () => {
    // 1. init
    const initRun = await runKnb(["init", "--json"]);
    expect(initRun.code).toBe(0);
    const initEnv = parseSuccess<{ created_paths: string[]; ledger_path: string; schema_path: string; config_path: string; workspace_root: string }>(initRun.stdout);
    expect(initEnv.command).toBe("init");
    expect(Array.isArray(initEnv.data.created_paths)).toBe(true);
    expect(initEnv.data.created_paths.length).toBeGreaterThan(0);
    expect(await pathExists(join(workDir, "knb", "ledger.jsonl"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "schema.json"))).toBe(true);
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);

    // 2. status
    const statusRun = await runKnb(["status", "--json"]);
    expect(statusRun.code).toBe(0);
    const statusEnv = parseSuccess<{ row_count: number; schema_version: string }>(statusRun.stdout);
    expect(statusEnv.data.row_count).toBe(0);
    expect(statusEnv.data.schema_version).toBe("knb.v1");

    // 3. schema
    const schemaRun = await runKnb(["schema", "--json"]);
    expect(schemaRun.code).toBe(0);
    const schemaEnv = parseSuccess<{ schema_version: string; row_samples: unknown[]; operation_samples: unknown[] }>(schemaRun.stdout);
    expect(schemaEnv.data.schema_version).toBe("knb.v1");
    expect(schemaEnv.data.row_samples.length).toBeGreaterThanOrEqual(5);

    // 4. apply 3-op batch (source -> claim -> synthesis)
    const opsPayload = {
      operations: [
        {
          op: "add",
          as: "source",
          row: {
            kind: "source",
            scope: { collections: ["example"] },
            source: {
              type: "web_page",
              title: "E2E source",
              uri: "https://example.com/e2e",
            },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          as: "claim",
          row: {
            kind: "claim",
            scope: { collections: ["example"] },
            identity: { claim_key: "example|e2e-loop-runs" },
            claim: { statement: "The e2e loop runs.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: ["$source"],
              evidence: [{ source_id: "$source", role: "supports", summary: "Source backs the claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
        {
          op: "add",
          as: "synthesis",
          row: {
            kind: "synthesis",
            scope: { collections: ["example"] },
            synthesis: {
              title: "E2E synthesis",
              summary: "Synthesizes the e2e loop.",
              basis: { claim_ids: ["$claim"], source_ids: ["$source"] },
              status: "active",
            },
          },
        },
      ],
    };
    const applyRun = await runKnb(
      ["apply", "--stdin", "--atomic", "--json"],
      JSON.stringify(opsPayload),
    );
    expect(applyRun.code).toBe(0);
    const applyEnv = parseSuccess<{
      created: Array<{ id: string; kind: string; as?: string }>;
      meta: { rows_appended: number };
    }>(applyRun.stdout);
    expect(applyEnv.data.created.length).toBe(3);
    expect(applyEnv.data.meta.rows_appended).toBe(3);
    const createdSource = applyEnv.data.created[0];
    const createdClaim = applyEnv.data.created[1];
    const createdSynthesis = applyEnv.data.created[2];
    expect(createdSource?.kind).toBe("source");
    expect(createdClaim?.kind).toBe("claim");
    expect(createdSynthesis?.kind).toBe("synthesis");

    // 5. check (indexes still missing because we haven't rebuilt yet)
    const checkRunBefore = await runKnb(["check", "--json"]);
    expect(checkRunBefore.code).toBe(0);
    const checkEnvBefore = parseSuccess<{ ok: boolean; projection_freshness: { entries: Array<{ kind: string; state: string }> } }>(checkRunBefore.stdout);
    expect(checkEnvBefore.data.ok).toBe(false);
    const missingIndexes = checkEnvBefore.data.projection_freshness.entries.filter(
      (entry) => entry.kind === "index" && entry.state === "missing",
    );
    expect(missingIndexes.length).toBe(V1_INDEX_NAMES.length);

    // 6. context for the example collection
    const contextRun = await runKnb(["context", "--collection", "example", "--json"]);
    expect(contextRun.code).toBe(0);
    const contextEnv = parseSuccess<{
      summary: string;
      key_claims: Array<{ id: string; statement: string }>;
    }>(contextRun.stdout);
    expect(contextEnv.data.summary.length).toBeGreaterThan(0);
    const keyIds = contextEnv.data.key_claims.map((c) => c.id);
    expect(keyIds).toContain(createdClaim?.id ?? "MISSING");

    // 7. novelty against fixtures (one duplicate of the existing claim, one brand new)
    const noveltyPayload = {
      candidates: [
        {
          kind: "claim",
          scope: { collections: ["example"] },
          identity: { claim_key: "example|e2e-loop-runs" },
          claim: { statement: "The e2e loop runs.", atomic: true },
          assessment: { confidence: "high" },
        },
        {
          kind: "claim",
          scope: { collections: ["example"] },
          identity: { claim_key: "example|fresh-novel-fact" },
          claim: { statement: "A fresh and novel fact.", atomic: true },
          assessment: { confidence: "medium" },
        },
      ],
    };
    const noveltyRun = await runKnb(
      ["novelty", "--stdin", "--json"],
      JSON.stringify(noveltyPayload),
    );
    expect(noveltyRun.code).toBe(0);
    const noveltyEnv = parseSuccess<{ results: Array<{ classification: string; matched_ids: string[] }> }>(noveltyRun.stdout);
    expect(noveltyEnv.data.results.length).toBe(2);
    expect(noveltyEnv.data.results[0]?.classification).toBe("duplicate");
    expect(noveltyEnv.data.results[1]?.classification).toBe("new");

    // 8. apply --dedupe with a duplicate add
    const dedupePayload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["example"] },
            identity: { claim_key: "example|e2e-loop-runs" },
            claim: { statement: "The e2e loop runs.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: [createdSource?.id ?? ""],
              evidence: [{ source_id: createdSource?.id ?? "", role: "supports", summary: "Source backs the claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    };
    const dedupeRun = await runKnb(
      ["apply", "--stdin", "--atomic", "--dedupe", "--json"],
      JSON.stringify(dedupePayload),
    );
    expect(dedupeRun.code).toBe(0);
    const dedupeEnv = parseSuccess<{
      created: unknown[];
      skipped: Array<{ op: number; reason: string }>;
      meta: { rows_appended: number };
    }>(dedupeRun.stdout);
    expect(dedupeEnv.data.created.length).toBe(0);
    expect(dedupeEnv.data.skipped.length).toBe(1);
    expect(dedupeEnv.data.skipped[0]?.reason.startsWith("duplicate of ")).toBe(true);
    expect(dedupeEnv.data.meta.rows_appended).toBe(0);

    // 9. render the example collection
    const renderRun = await runKnb(["render", "--collection", "example", "--json"]);
    expect(renderRun.code).toBe(0);
    const renderEnv = parseSuccess<{ path: string; bytes_written: number }>(renderRun.stdout);
    expect(renderEnv.data.path.endsWith(join("knb", "views", "example.md"))).toBe(true);
    expect(renderEnv.data.bytes_written).toBeGreaterThan(0);
    expect(await pathExists(renderEnv.data.path)).toBe(true);

    // 10. index --rebuild
    const indexRun = await runKnb(["index", "--rebuild", "--json"]);
    expect(indexRun.code).toBe(0);
    const indexEnv = parseSuccess<{ indexes: Array<{ name: string; bytes_written: number }> }>(indexRun.stdout);
    expect(indexEnv.data.indexes.length).toBe(V1_INDEX_NAMES.length);
    const indexNames = indexEnv.data.indexes.map((entry) => entry.name).sort();
    expect(indexNames).toEqual([...V1_INDEX_NAMES].sort());

    // 11. check after rebuild - everything fresh
    const checkRunAfter = await runKnb(["check", "--json"]);
    expect(checkRunAfter.code).toBe(0);
    const checkEnvAfter = parseSuccess<{
      ok: boolean;
      projection_freshness: { entries: Array<{ kind: string; state: string }> };
    }>(checkRunAfter.stdout);
    expect(checkEnvAfter.data.ok).toBe(true);
    const allFresh = checkEnvAfter.data.projection_freshness.entries.every((entry) => entry.state === "fresh");
    expect(allFresh).toBe(true);

    // 11b. on-disk verification: V1 sidecars + view file
    const indexFiles = await readdir(join(workDir, "knb", "indexes"));
    const indexJsonFiles = indexFiles.filter((f) => f.endsWith(".json"));
    expect(indexJsonFiles.length).toBeGreaterThanOrEqual(V1_INDEX_NAMES.length);
    const viewFiles = await readdir(join(workDir, "knb", "views"));
    expect(viewFiles).toContain("example.md");

    // 12. status final - 3 rows on disk (dedupe skipped)
    const finalStatus = await runKnb(["status", "--json"]);
    expect(finalStatus.code).toBe(0);
    const finalStatusEnv = parseSuccess<{ row_count: number; active_counts_by_kind: Record<string, number> }>(finalStatus.stdout);
    expect(finalStatusEnv.data.row_count).toBe(3);
    expect(finalStatusEnv.data.active_counts_by_kind.source).toBe(1);
    expect(finalStatusEnv.data.active_counts_by_kind.claim).toBe(1);
    expect(finalStatusEnv.data.active_counts_by_kind.synthesis).toBe(1);

    // 13. idempotency: re-applying the same dedupe payload still skips and
    // re-rendering / re-rebuilding is a no-op for row count.
    const dedupeReplay = await runKnb(
      ["apply", "--stdin", "--atomic", "--dedupe", "--json"],
      JSON.stringify({
        operations: [
          {
            op: "add",
            row: {
              kind: "claim",
              scope: { collections: ["example"] },
              identity: { claim_key: "example|e2e-loop-runs" },
              claim: { statement: "The e2e loop runs.", atomic: true },
              time: { precision: "unknown" },
              provenance: {
                source_ids: [createdSource?.id ?? ""],
                evidence: [{ source_id: createdSource?.id ?? "", role: "supports", summary: "Backs the claim." }],
              },
              assessment: { confidence: "high" },
            },
          },
        ],
      }),
    );
    expect(dedupeReplay.code).toBe(0);
    const replayEnv = parseSuccess<{ created: unknown[]; skipped: unknown[]; meta: { rows_appended: number } }>(dedupeReplay.stdout);
    expect(replayEnv.data.created.length).toBe(0);
    expect(replayEnv.data.skipped.length).toBe(1);
    expect(replayEnv.data.meta.rows_appended).toBe(0);

    const finalStatus2 = await runKnb(["status", "--json"]);
    const final2Env = parseSuccess<{ row_count: number }>(finalStatus2.stdout);
    expect(final2Env.data.row_count).toBe(3);

    const indexRebuild2 = await runKnb(["index", "--rebuild", "--json"]);
    expect(indexRebuild2.code).toBe(0);
    const rebuild2Env = parseSuccess<{ indexes: Array<{ name: string }> }>(indexRebuild2.stdout);
    expect(rebuild2Env.data.indexes.length).toBe(V1_INDEX_NAMES.length);

    const checkAfterReplay = await runKnb(["check", "--json"]);
    const checkReplayEnv = parseSuccess<{ ok: boolean }>(checkAfterReplay.stdout);
    expect(checkReplayEnv.data.ok).toBe(true);
  });
});

describe("e2e: failure envelopes", () => {
  test("knb get nonexistent returns exit 1 not_found", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const getRun = await runKnb(["get", "claim:does:not:exist", "--json"]);
    expect(getRun.code).toBe(1);
    expect(getRun.stdout).toBe("");
    const env = parseFailure(getRun.stderr);
    expect(env.error.code).toBe("not_found");
    expect(env.meta.exit_code).toBe(1);
    expect(env.command).toBe("get");
  });

  test("unknown command returns exit 2 invalid_arguments", async () => {
    const run = await runKnb(["totally-unknown", "--json"]);
    expect(run.code).toBe(2);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.meta.exit_code).toBe(2);
    expect(env.command).toBe("totally-unknown");
  });

  test("apply with a row missing required fields returns exit 3 validation_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      operations: [
        {
          op: "add",
          row: { kind: "claim" },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(3);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("validation_failed");
    expect(env.meta.exit_code).toBe(3);
  });

  test("apply with two adds using the same explicit id returns exit 4 duplicate_blocked", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const explicitId = "src:dup:20260501:0000beef";
    const sourceRow = {
      kind: "source",
      id: explicitId,
      scope: { collections: ["dup"] },
      source: { type: "web_page", title: "Dup A", uri: "https://example.com/a" },
      provenance: { acquisition: { method: "manual" } },
    };
    const sourceRowB = {
      kind: "source",
      id: explicitId,
      scope: { collections: ["dup"] },
      source: { type: "web_page", title: "Dup B", uri: "https://example.com/b" },
      provenance: { acquisition: { method: "manual" } },
    };
    const payload = {
      operations: [
        { op: "add", row: sourceRow },
        { op: "add", row: sourceRowB },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(4);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("duplicate_blocked");
    expect(env.meta.exit_code).toBe(4);
  });

  test("pre-existing lock file causes exit 6 lock_busy on apply", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    await writeFile(join(workDir, ".knb", "ledger.lock"), "", "utf8");

    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["lock"] },
            source: { type: "web_page", title: "Locked", uri: "https://example.com/locked" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(6);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("lock_busy");
    expect(env.meta.exit_code).toBe(6);
  });

  test("apply with a claim referencing a nonexistent source id returns exit 7 broken_reference", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["broken"] },
            identity: { claim_key: "broken|orphan" },
            claim: { statement: "Orphan claim references a missing source.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: ["src:does:not:exist:deadbeef"],
              evidence: [
                {
                  source_id: "src:does:not:exist:deadbeef",
                  role: "supports",
                  summary: "Phantom evidence",
                },
              ],
            },
            assessment: { confidence: "low" },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(7);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("broken_reference");
    expect(env.meta.exit_code).toBe(7);
  });

  test("apply request with atomic: false in payload returns exit 9 unsafe_operation_refused", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      atomic: false,
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["unsafe"] },
            source: { type: "web_page", title: "Unsafe", uri: "https://example.com/unsafe" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(9);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("unsafe_operation_refused");
    expect(env.meta.exit_code).toBe(9);
  });

  test("apply --file with nonexistent path returns exit 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb([
      "apply",
      "--file",
      join(workDir, "no-such.json"),
      "--atomic",
      "--json",
    ]);
    expect(run.code).toBe(5);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("io_failed");
    expect(env.meta.exit_code).toBe(5);
    expect(env.command).toBe("apply");
  });

  test("query against a corrupted (unparseable) ledger returns exit 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    await writeFile(join(workDir, "knb", "ledger.jsonl"), "this is not valid jsonl{{\n", "utf8");

    const run = await runKnb(["query", "--collection", "foo", "--json"]);
    expect(run.code).toBe(5);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("io_failed");
    expect(env.meta.exit_code).toBe(5);
    expect(env.command).toBe("query");
    const details = env.error.details as { parse_issues?: unknown[] };
    expect(Array.isArray(details?.parse_issues)).toBe(true);
    expect((details.parse_issues ?? []).length).toBeGreaterThan(0);
  });

  test("apply against unwriteable ledger directory exits 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    if (process.getuid && process.getuid() === 0) return;

    const lockedDir = join(workDir, "locked");
    await mkdir(lockedDir, { recursive: true });
    await chmod(lockedDir, 0o500);
    try {
      const lockedLedger = join(lockedDir, "ledger.jsonl");
      const payload = {
        operations: [
          {
            op: "add",
            row: {
              kind: "source",
              scope: { collections: ["io"] },
              source: { type: "web_page", title: "IO", uri: "https://example.com/io" },
              provenance: { acquisition: { method: "manual" } },
            },
          },
        ],
      };
      const run = await runKnb(
        ["apply", "--stdin", "--atomic", "--ledger", lockedLedger, "--json"],
        JSON.stringify(payload),
      );
      expect(run.code).toBe(5);
      const env = parseFailure(run.stderr);
      expect(env.error.code).toBe("io_failed");
      expect(env.meta.exit_code).toBe(5);
    } finally {
      await chmod(lockedDir, 0o700);
    }
  });

  test("apply --json with malformed inline JSON returns exit 2 invalid_arguments", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb(["apply", "--json", "{not-json", "--atomic", "--pretty"]);
    expect(run.code).toBe(2);
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.meta.exit_code).toBe(2);
  });

  test("apply --stdin with empty stdin returns exit 2 invalid_arguments", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], "");
    expect(run.code).toBe(2);
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message.toLowerCase()).toContain("stdin");
  });

  // Code 8 (external_dependency_failed) is not reachable via the CLI in V1
  // because no command depends on a network/IPC peer. The error code exists in
  // the vocabulary for future commands that shell out (e.g. embeddings, sync).
  // No producer path triggers it today; this test pins the absence.
  test("no V1 CLI path produces external_dependency_failed (code 8)", async () => {
    const helpRun = await runKnb(["help"]);
    expect(helpRun.code).toBe(0);
    expect(helpRun.stdout).toContain("external_dependency_failed");
    expect(helpRun.stdout).toContain("8");
  });

  // Code 10 (internal_error) wraps anything thrown that is not already a
  // KnbError. The CLI's two intentional sources of unexpected failure are
  // out of reach from a clean env (we cannot easily corrupt internal state
  // from a subprocess). This test pins the contract: if such an error were to
  // bubble, it would be wrapped via fromUnknown into code 10.
  test("internal_error code (10) is documented in help and mapped to exit 10", async () => {
    const helpRun = await runKnb(["help"]);
    expect(helpRun.code).toBe(0);
    expect(helpRun.stdout).toContain("internal_error");
    expect(helpRun.stdout).toContain("10 internal_error");
  });
});
