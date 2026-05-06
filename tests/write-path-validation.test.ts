import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { applyOperations, type ApplyDeps } from "../src/core/apply";
import type {
  ApplyRequest,
  DraftRow,
  KnbRow,
  SourceRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { exitCodeForError } from "../src/core/errors";
import { canonicalContentHash, loadLedger, writeLedger } from "../src/core/ledger";
import { openKnb } from "../src/index";

let workDir: string;

const FIXED_DATE = new Date("2026-05-01T12:00:00Z");

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-writepath-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function ledgerPath(): string {
  return join(workDir, "knb", "ledger.jsonl");
}

function lockPath(): string {
  return join(workDir, ".knb", "locks", "main.lock");
}

function makeDeps(overrides?: {
  randomIdPart?: () => string;
  actor?: string;
  clock?: () => Date;
  workspace?: { paths: { ledger: string; lock: string } };
}): ApplyDeps {
  const deps: ApplyDeps = {
    workspace: overrides?.workspace ?? {
      paths: { ledger: ledgerPath(), lock: lockPath() },
    },
    runtime: {
      clock: overrides?.clock ?? (() => FIXED_DATE),
      randomIdPart: overrides?.randomIdPart ?? (() => "abcd0001"),
    },
    actor: overrides?.actor ?? "agent:test",
  };
  return deps;
}

const SOURCE_DRAFT: DraftRow = {
  kind: "source",
  scope: { profiles: ["example"] },
  source: {
    type: "web_page",
    title: "Example",
    uri: "https://example.com",
  },
  provenance: {
    acquisition: { method: "manual" },
  },
} as DraftRow;

function freshSource(suffix: number): DraftRow {
  return {
    kind: "source",
    scope: { profiles: ["example"] },
    source: {
      type: "web_page",
      title: `Example ${suffix}`,
      uri: `https://example.com/r/${suffix}`,
    },
    provenance: {
      acquisition: { method: "manual" },
    },
  } as DraftRow;
}

async function seedLedgerText(text: string): Promise<void> {
  await mkdir(join(workDir, "knb"), { recursive: true });
  await writeFile(ledgerPath(), text, "utf8");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findFilesByName(root: string, name: string): Promise<string[]> {
  const found: string[] = [];
  async function walk(dir: string): Promise<void> {
    let entries: Array<{ name: string; isDirectory: () => boolean }>;
    try {
      entries = (await readdir(dir, { withFileTypes: true })) as unknown as Array<{
        name: string;
        isDirectory: () => boolean;
      }>;
    } catch {
      return;
    }
    for (const entry of entries) {
      const entryName = String(entry.name);
      const full = join(dir, entryName);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entryName === name) {
        found.push(full);
      }
    }
  }
  await walk(root);
  return found;
}

describe("write path reliability", () => {
  test("five concurrent applyOperations: all serialize cleanly OR fail with lock_busy/exit 6, never partial corruption", async () => {
    const deps: ApplyDeps[] = [];
    for (let n = 1; n <= 5; n += 1) {
      const id = `c${n}aaaaaa`.slice(0, 8);
      deps.push(makeDeps({ randomIdPart: () => id }));
    }
    const settled = await Promise.allSettled(
      deps.map((d, n) =>
        applyOperations({ operations: [{ op: "add", row: freshSource(n + 1) }] }, d),
      ),
    );

    const fulfilled = settled.filter((s) => s.status === "fulfilled");
    const rejected = settled.filter((s) => s.status === "rejected");
    expect(fulfilled.length + rejected.length).toBe(5);
    // Every rejection MUST be a lock_busy (no other failure modes acceptable here).
    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(isKnbError(reason)).toBe(true);
      expect((reason as { code: string }).code).toBe("lock_busy");
      expect(exitCodeForError("lock_busy")).toBe(6);
    }
    // Whatever landed must be byte-clean: each line a parseable row.
    const after = await readFile(ledgerPath(), "utf8");
    const lines = after.trim().split("\n").filter((l) => l.length > 0);
    expect(lines).toHaveLength(fulfilled.length);
    const ids = lines.map((line) => (JSON.parse(line) as { id: string }).id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("callback that throws releases the lock and writes nothing", async () => {
    await seedLedgerText("");
    const before = "before-content\n";
    await writeFile(ledgerPath(), before, "utf8");

    let thrown: unknown;
    try {
      await writeLedger(
        { path: ledgerPath(), lockPath: lockPath() },
        async () => {
          throw new Error("mid-callback failure");
        },
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect((thrown as Error).message).toBe("mid-callback failure");

    const after = await readFile(ledgerPath(), "utf8");
    expect(after).toBe(before);

    // lock released - subsequent writeLedger succeeds immediately
    expect(await pathExists(lockPath())).toBe(false);
    const ok = await writeLedger(
      { path: ledgerPath(), lockPath: lockPath() },
      async () => ({ rows: [], result: "ok" as const }),
    );
    expect(ok.result).toBe("ok");
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("snapshot passed to callback matches file at start; bypass write inside callback does not corrupt batch", async () => {
    const initial = `${JSON.stringify({ id: "seed-a", kind: "source" })}\n`;
    await seedLedgerText(initial);
    const initialHash = canonicalContentHash(initial);

    const bypassRow = `${JSON.stringify({ id: "bypass-b", kind: "source" })}\n`;
    const appendRow = { id: "append-c", kind: "source" };

    const result = await writeLedger(
      { path: ledgerPath(), lockPath: lockPath() },
      async (snapshot) => {
        expect(snapshot.fingerprint.content_hash).toBe(initialHash);
        expect(snapshot.rows).toHaveLength(1);
        expect((snapshot.rows[0]?.row as { id: string }).id).toBe("seed-a");

        // External writer bypasses the lock and appends directly.
        await appendFile(ledgerPath(), bypassRow, "utf8");

        return { rows: [appendRow as unknown as KnbRow], result: snapshot.fingerprint.rows };
      },
    );

    expect(result.result).toBe(1);
    expect(result.rowsAppended).toBe(1);

    const finalText = await readFile(ledgerPath(), "utf8");
    expect(finalText).toBe(`${initial}${bypassRow}${JSON.stringify(appendRow)}\n`);
  });

  test("malformed JSONL line in pre-existing ledger surfaces as validation_failed (exit 3); ledger unchanged; lock cleaned up", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:seed0001",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { profiles: ["example"] },
      source: { type: "web_page", title: "Seed", uri: "https://seed.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    const text = `${JSON.stringify(seedSource)}\n{ this is not valid json\n`;
    await seedLedgerText(text);

    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: freshSource(99) }] },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    expect(exitCodeForError("validation_failed")).toBe(3);

    // The malformed ledger must not have been mutated by the failed apply.
    const after = await readFile(ledgerPath(), "utf8");
    expect(after).toBe(text);
    expect(await pathExists(lockPath())).toBe(false);
  });
});

describe("write path security boundaries", () => {
  test("atomic: false rejects with unsafe_operation_refused / exit code 9, no ledger or lock created", async () => {
    const request = {
      operations: [{ op: "add", row: SOURCE_DRAFT }],
      atomic: false,
    } as unknown as ApplyRequest;

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("unsafe_operation_refused");
    expect(exitCodeForError("unsafe_operation_refused")).toBe(9);
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("atomic: false with empty operations is also rejected with unsafe_operation_refused", async () => {
    const request = { operations: [], atomic: false } as unknown as ApplyRequest;
    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("unsafe_operation_refused");
  });

  test("evidence reference to non-existent source id throws broken_reference / exit 7 with no write or lock", async () => {
    const draft: DraftRow = {
      kind: "claim",
      scope: { profiles: ["example"] },
      identity: { claim_key: "example|exists" },
      claim: { statement: "Example exists.", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:nope:nope:nope", role: "supports", summary: "missing" },
        ],
      },
      assessment: { confidence: "high" },
    } as DraftRow;

    let thrown: unknown;
    try {
      await applyOperations({ operations: [{ op: "add", row: draft }] }, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("broken_reference");
    expect(exitCodeForError("broken_reference")).toBe(7);
    expect((thrown as { details?: { ref?: string } }).details?.ref).toBe("src:nope:nope:nope");
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("provided id colliding with pre-existing ledger row throws duplicate_blocked / exit 4 and does not mutate ledger", async () => {
    const seed: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:dup00001",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { profiles: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedgerText(`${JSON.stringify(seed)}\n`);
    const before = await readFile(ledgerPath(), "utf8");
    const draft = { ...SOURCE_DRAFT, id: seed.id } as DraftRow;

    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: draft }] },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect(exitCodeForError("duplicate_blocked")).toBe(4);
    expect(await readFile(ledgerPath(), "utf8")).toBe(before);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("forward $op alias from $op0 to $op2 throws broken_reference (exit 7)", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:fwd00001",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { profiles: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/fwd" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedgerText(`${JSON.stringify(seedSource)}\n`);
    const before = await readFile(ledgerPath(), "utf8");

    const claimDraft: DraftRow = {
      kind: "claim",
      scope: { profiles: ["example"] },
      identity: { claim_key: "k|fwd" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "$op2", role: "supports", summary: "forward ref" },
        ],
      },
      assessment: { confidence: "high" },
    } as DraftRow;

    const request: ApplyRequest = {
      operations: [
        { op: "add", row: claimDraft },
        { op: "add", row: freshSource(11) },
        { op: "add", row: freshSource(12) },
      ],
    };

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps({ randomIdPart: () => "ffff0000" }));
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("broken_reference");
    expect(exitCodeForError("broken_reference")).toBe(7);
    // Ledger must be unchanged after a broken_reference failure
    expect(await readFile(ledgerPath(), "utf8")).toBe(before);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("after a successful apply, the lock file at workspace.paths.lock is gone and no stray locks exist anywhere under workDir", async () => {
    await applyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }] },
      makeDeps(),
    );
    expect(await pathExists(lockPath())).toBe(false);
    const strays = await findFilesByName(workDir, "main.lock");
    expect(strays).toEqual([]);
    expect(lockPath()).toBe(join(workDir, ".knb", "locks", "main.lock"));
  });

  test("knb.render with absolute out path outside workspace views rejects with validation_failed (write-path security smoke)", async () => {
    const knb = await openKnb({
      root: workDir,
      env: {},
      cwd: () => workDir,
      actor: "agent:test",
      runtime: {
        clock: () => FIXED_DATE,
        randomIdPart: () => "render01",
      },
    });

    let thrown: unknown;
    try {
      await knb.render({
        profile: "x",
        out: "/tmp/escape-knb-write-path.md",
      });
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    expect(await pathExists("/tmp/escape-knb-write-path.md")).toBe(false);
  });
});

describe("write path performance and idempotence", () => {
  test("batch of 50 source adds: single apply, all rows landed in order with unique ids, fingerprint matches reload", async () => {
    const ids: string[] = [];
    for (let i = 0; i < 50; i += 1) {
      ids.push(`bulk${i.toString().padStart(4, "0")}`);
    }
    let cursor = 0;
    const operations = ids.map((_, i) => ({
      op: "add" as const,
      row: freshSource(1000 + i),
    }));

    const start = Date.now();
    const result = await applyOperations(
      { operations },
      makeDeps({ randomIdPart: () => ids[cursor++] as string }),
    );
    const elapsed = Date.now() - start;

    expect(result.created).toHaveLength(50);
    expect(result.meta.rows_appended).toBe(50);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(elapsed).toBeLessThan(2000);

    // Unique ids and stable order
    const createdIds = result.created.map((c) => c.id);
    expect(new Set(createdIds).size).toBe(50);

    const reload = await loadLedger({ path: ledgerPath() });
    expect(reload.rows).toHaveLength(50);
    expect(reload.fingerprint.content_hash).toBe(result.meta.fingerprint_after.content_hash);
    expect(reload.fingerprint.bytes).toBe(result.meta.fingerprint_after.bytes);
    expect(reload.fingerprint.rows).toBe(result.meta.fingerprint_after.rows);
    for (let i = 0; i < 50; i += 1) {
      expect((reload.rows[i]?.row as SourceRow).id).toBe(createdIds[i] as string);
    }
  });

  test("ten sequential applies leave no lock file behind on any iteration and total rows = 10", async () => {
    let cursor = 0;
    for (let i = 0; i < 10; i += 1) {
      const deps = makeDeps({
        randomIdPart: () => `seq${(cursor++).toString().padStart(5, "0")}`,
      });
      await applyOperations(
        { operations: [{ op: "add", row: freshSource(2000 + i) }] },
        deps,
      );
      expect(await pathExists(lockPath())).toBe(false);
    }
    const reload = await loadLedger({ path: ledgerPath() });
    expect(reload.rows).toHaveLength(10);
    // ids must all be unique
    const idSet = new Set(reload.rows.map((r) => (r.row as SourceRow).id));
    expect(idSet.size).toBe(10);
  });

  test("empty operations no-op does not acquire the lock (pre-existing lock file is left untouched)", async () => {
    await mkdir(join(workDir, ".knb", "locks"), { recursive: true });
    await writeFile(lockPath(), "external-lock-content", "utf8");

    const result = await applyOperations({ operations: [] }, makeDeps());
    expect(result.meta.rows_appended).toBe(0);
    expect(result.meta.bytes_written).toBe(0);

    const lockContent = await readFile(lockPath(), "utf8");
    expect(lockContent).toBe("external-lock-content");
    expect(await pathExists(ledgerPath())).toBe(false);
  });
});

describe("deterministic id generation", () => {
  test("same draft + same clock + same randomIdPart produces identical id, created_at, and serialized bytes across two fresh workspaces", async () => {
    const ws1 = await mkdtemp(join(tmpdir(), "knb-detid-a-"));
    const ws2 = await mkdtemp(join(tmpdir(), "knb-detid-b-"));
    try {
      const deps1 = makeDeps({
        workspace: {
          paths: {
            ledger: join(ws1, "knb", "ledger.jsonl"),
            lock: join(ws1, ".knb", "locks", "main.lock"),
          },
        },
        clock: () => FIXED_DATE,
        randomIdPart: () => "deadbeef",
      });
      const deps2 = makeDeps({
        workspace: {
          paths: {
            ledger: join(ws2, "knb", "ledger.jsonl"),
            lock: join(ws2, ".knb", "locks", "main.lock"),
          },
        },
        clock: () => FIXED_DATE,
        randomIdPart: () => "deadbeef",
      });
      const draft = freshSource(7);
      const r1 = await applyOperations({ operations: [{ op: "add", row: draft }] }, deps1);
      const r2 = await applyOperations({ operations: [{ op: "add", row: draft }] }, deps2);
      expect(r1.created[0]?.id).toBe("src:example:20260501:deadbeef");
      expect(r2.created[0]?.id).toBe(r1.created[0]?.id as string);

      const text1 = await readFile(join(ws1, "knb", "ledger.jsonl"), "utf8");
      const text2 = await readFile(join(ws2, "knb", "ledger.jsonl"), "utf8");
      expect(text1).toBe(text2);
      expect(canonicalContentHash(text1)).toBe(canonicalContentHash(text2));
      expect(r1.meta.fingerprint_after.content_hash).toBe(r2.meta.fingerprint_after.content_hash);
    } finally {
      await rm(ws1, { recursive: true, force: true });
      await rm(ws2, { recursive: true, force: true });
    }
  });

  test("collision retry advances through randomIdPart sequence and lands on the second value", async () => {
    const taken: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260501:deadbeef",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { profiles: ["example"] },
      source: { type: "web_page", title: "Taken", uri: "https://taken.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedgerText(`${JSON.stringify(taken)}\n`);

    const sequence = ["deadbeef", "cafebab1"];
    let i = 0;
    const result = await applyOperations(
      { operations: [{ op: "add", row: freshSource(42) }] },
      makeDeps({
        clock: () => FIXED_DATE,
        randomIdPart: () => sequence[i++] ?? "fallback",
      }),
    );
    expect(result.created[0]?.id).toBe("src:example:20260501:cafebab1");
    expect(i).toBe(2);
  });

  test("collision retry exhaustion: 8 consecutive collisions produces duplicate_blocked / exit 4", async () => {
    const taken: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260501:foreverc",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { profiles: ["example"] },
      source: { type: "web_page", title: "Taken", uri: "https://t.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedgerText(`${JSON.stringify(taken)}\n`);
    const before = await readFile(ledgerPath(), "utf8");

    let calls = 0;
    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: freshSource(0) }] },
        makeDeps({
          randomIdPart: () => {
            calls += 1;
            return "foreverc";
          },
        }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect(exitCodeForError("duplicate_blocked")).toBe(4);
    expect(calls).toBe(8);
    expect(await readFile(ledgerPath(), "utf8")).toBe(before);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("ID format regex pins format <prefix>:<slug>:YYYYMMDD:<random8>", async () => {
    const result = await applyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }] },
      makeDeps({ randomIdPart: () => "abcd0001" }),
    );
    expect(result.created[0]?.id).toMatch(/^src:example:\d{8}:[a-zA-Z0-9]{8}$/);
    expect(result.created[0]?.id).toBe("src:example:20260501:abcd0001");
  });
});
