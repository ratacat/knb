import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { access, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";

import { isKnbError } from "../src/core/errors";
import {
  canonicalContentHash,
  defaultLedgerFsBackend,
  loadLedger,
  writeLedger,
  type LedgerFsBackend,
  type LedgerLockHandle,
  type LedgerSnapshot,
} from "../src/core/ledger";
import { rowSamples } from "../src/core/contract";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-ledger-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function ledgerPath(): string {
  return join(workDir, "knb", "ledger.jsonl");
}

function lockPath(): string {
  return join(workDir, ".knb", "ledger.lock");
}

function rawSha256Hex(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

async function seedLedger(text: string): Promise<string> {
  const path = ledgerPath();
  await mkdir(join(workDir, "knb"), { recursive: true });
  await writeFile(path, text, "utf8");
  return path;
}

async function seedLedgerBytes(buffer: Buffer): Promise<string> {
  const path = ledgerPath();
  await mkdir(join(workDir, "knb"), { recursive: true });
  await writeFile(path, buffer);
  return path;
}

function jsonRow(id: string, kind = "claim"): string {
  return JSON.stringify({ id, kind });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

describe("loadLedger", () => {
  test("missing file returns empty snapshot with empty-string content hash", async () => {
    const path = ledgerPath();
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toEqual([]);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint).toEqual({
      path,
      rows: 0,
      bytes: 0,
      content_hash: `sha256:${rawSha256Hex("")}`,
    });
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("empty file returns rows=0 and content_hash equals sha256 of empty string", async () => {
    const path = await seedLedger("");
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toEqual([]);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.bytes).toBe(0);
    expect(snapshot.fingerprint.content_hash).toBe(`sha256:${rawSha256Hex("")}`);
    expect(snapshot.fingerprint.path).toBe(path);
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("file with only blank lines parses as zero rows and zero issues", async () => {
    const path = await seedLedger("\n\n   \n\t\n\n");
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toEqual([]);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(0);
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("multi-line ledger returns one LoadedRow per non-empty line with line and bytes", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const r3 = jsonRow("c");
    const path = await seedLedger(`${r1}\n${r2}\n${r3}\n`);
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toHaveLength(3);
    expect(snapshot.rows[0]?.line).toBe(1);
    expect(snapshot.rows[1]?.line).toBe(2);
    expect(snapshot.rows[2]?.line).toBe(3);
    expect(snapshot.rows[0]?.bytes).toBe(Buffer.byteLength(r1, "utf8"));
    expect(snapshot.rows[1]?.bytes).toBe(Buffer.byteLength(r2, "utf8"));
    expect(snapshot.rows[2]?.bytes).toBe(Buffer.byteLength(r3, "utf8"));
    expect(snapshot.parseIssues).toEqual([]);
  });

  test("single row with no trailing newline still parses (trim)", async () => {
    const r1 = jsonRow("only");
    const path = await seedLedger(r1);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(1);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("only");
    expect(snapshot.rows[0]?.line).toBe(1);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(1);
  });

  test("single row with trailing newline parses as one row", async () => {
    const r1 = jsonRow("only");
    const path = await seedLedger(`${r1}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.fingerprint.rows).toBe(1);
  });

  test("CRLF line endings parse each line correctly", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const r3 = jsonRow("c");
    const path = await seedLedger(`${r1}\r\n${r2}\r\n${r3}\r\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(3);
    expect(snapshot.parseIssues).toEqual([]);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("a");
    expect((snapshot.rows[1]?.row as { id: string }).id).toBe("b");
    expect((snapshot.rows[2]?.row as { id: string }).id).toBe("c");
    expect(snapshot.fingerprint.last_row_id).toBe("c");
  });

  test("mixed LF and CRLF line endings parse all lines correctly", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const r3 = jsonRow("c");
    const path = await seedLedger(`${r1}\n${r2}\r\n${r3}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(3);
    expect(snapshot.parseIssues).toEqual([]);
  });

  test("UTF-8 BOM at start is silently absorbed by trim(); both rows parse cleanly", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const path = await seedLedgerBytes(
      Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(`${r1}\n${r2}\n`, "utf8"),
      ]),
    );
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(2);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("a");
    expect((snapshot.rows[1]?.row as { id: string }).id).toBe("b");
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.last_row_id).toBe("b");
    expect(snapshot.fingerprint.bytes).toBe(3 + Buffer.byteLength(`${r1}\n${r2}\n`, "utf8"));
  });

  test("multi-byte UTF-8 row content yields correct byte counts", async () => {
    const row = JSON.stringify({ id: "x", note: "héllo 🌍 — résumé" });
    const path = await seedLedger(`${row}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.rows[0]?.bytes).toBe(Buffer.byteLength(row, "utf8"));
    expect(snapshot.fingerprint.bytes).toBe(Buffer.byteLength(`${row}\n`, "utf8"));
  });

  test("embedded NUL bytes inside JSON string values parse correctly", async () => {
    const note = ["before", "after"].join(String.fromCharCode(0));
    const row = JSON.stringify({ id: "n", note });
    const path = await seedLedger(`${row}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(1);
    expect(snapshot.parseIssues).toEqual([]);
    const parsed = snapshot.rows[0]?.row as unknown as { note: string };
    expect(parsed.note).toBe(note);
    expect(parsed.note.length).toBe(12);
    expect(parsed.note.charCodeAt(6)).toBe(0);
  });

  test("skips trailing and blank lines without errors", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const path = await seedLedger(`${r1}\n\n   \n${r2}\n\n`);
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toHaveLength(2);
    expect(snapshot.rows[0]?.line).toBe(1);
    expect(snapshot.rows[1]?.line).toBe(4);
    expect(snapshot.parseIssues).toEqual([]);
  });

  test("partial corruption preserves valid rows before and after the bad line", async () => {
    const r1 = jsonRow("a");
    const bad = "{ this is not valid json";
    const r3 = jsonRow("c");
    const path = await seedLedger(`${r1}\n${bad}\n${r3}\n`);
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toHaveLength(2);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("a");
    expect((snapshot.rows[1]?.row as { id: string }).id).toBe("c");
    expect(snapshot.rows[1]?.line).toBe(3);

    expect(snapshot.parseIssues).toHaveLength(1);
    expect(snapshot.parseIssues[0]?.code).toBe("jsonl_parse_failed");
    expect(snapshot.parseIssues[0]?.line).toBe(2);
    expect(snapshot.parseIssues[0]?.level).toBe("error");
    expect(snapshot.parseIssues[0]?.message).toContain("line 2");
  });

  test("truncated trailing line (crashed write) is an error and earlier rows survive", async () => {
    const r1 = jsonRow("a");
    const r2 = jsonRow("b");
    const path = await seedLedger(`${r1}\n${r2}\n{"id":"c"`);
    const snapshot = await loadLedger({ path });

    expect(snapshot.rows).toHaveLength(2);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("a");
    expect((snapshot.rows[1]?.row as { id: string }).id).toBe("b");
    expect(snapshot.parseIssues).toHaveLength(1);
    expect(snapshot.parseIssues[0]?.line).toBe(3);
    expect(snapshot.fingerprint.last_row_id).toBe("b");
    expect(snapshot.fingerprint.rows).toBe(2);
  });

  test("multiple bad lines each get their own parse issue with correct line numbers", async () => {
    const path = await seedLedger(`${jsonRow("a")}\nbad-1\n${jsonRow("c")}\nbad-2\n${jsonRow("e")}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(3);
    expect(snapshot.parseIssues).toHaveLength(2);
    expect(snapshot.parseIssues[0]?.line).toBe(2);
    expect(snapshot.parseIssues[1]?.line).toBe(4);
    expect(snapshot.fingerprint.last_row_id).toBe("e");
    expect(snapshot.fingerprint.rows).toBe(3);
  });

  test("real I/O error throws KnbError with code io_failed", async () => {
    const path = ledgerPath();
    let thrown: unknown;
    try {
      await loadLedger({
        path,
        readFile: async () => {
          const error: NodeJS.ErrnoException = Object.assign(new Error("EACCES: permission denied"), {
            code: "EACCES",
          });
          throw error;
        },
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("io_failed");
    expect((thrown as { details?: { path: string } }).details?.path).toBe(path);
    expect((thrown as { cause?: unknown }).cause).toBeDefined();
  });

  test("ENOTDIR (intermediate path component is not a directory) treated as missing", async () => {
    const path = ledgerPath();
    const snapshot = await loadLedger({
      path,
      readFile: async () => {
        const error: NodeJS.ErrnoException = Object.assign(new Error("ENOTDIR"), { code: "ENOTDIR" });
        throw error;
      },
    });
    expect(snapshot.rows).toEqual([]);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(0);
    expect(snapshot.fingerprint.bytes).toBe(0);
  });

  test("fingerprint changes when a row is appended; same content yields same hash", async () => {
    const r1 = jsonRow("a");
    const path = await seedLedger(`${r1}\n`);
    const snapshot1 = await loadLedger({ path });
    const snapshot2 = await loadLedger({ path });

    expect(snapshot1.fingerprint.content_hash).toBe(snapshot2.fingerprint.content_hash);

    await writeFile(path, `${r1}\n${jsonRow("b")}\n`, "utf8");
    const snapshot3 = await loadLedger({ path });
    expect(snapshot3.fingerprint.content_hash).not.toBe(snapshot1.fingerprint.content_hash);
    expect(snapshot3.fingerprint.rows).toBe(2);
    expect(snapshot3.fingerprint.bytes).toBeGreaterThan(snapshot1.fingerprint.bytes);
  });

  test("one byte difference in content yields a different content hash", async () => {
    const path1 = await seedLedger(`${jsonRow("a")}\n`);
    const snapshot1 = await loadLedger({ path: path1 });
    await writeFile(path1, `${jsonRow("b")}\n`, "utf8");
    const snapshot2 = await loadLedger({ path: path1 });
    expect(snapshot2.fingerprint.content_hash).not.toBe(snapshot1.fingerprint.content_hash);
  });

  test("content_hash format is exactly 'sha256:' + 64-char lowercase hex", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.content_hash).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("fingerprint.bytes equals actual on-disk size in UTF-8 bytes", async () => {
    const text = `${JSON.stringify({ id: "a", note: "héllo 🌍" })}\n${jsonRow("b")}\n`;
    const path = await seedLedger(text);
    const snapshot = await loadLedger({ path });
    const stats = await stat(path);
    expect(snapshot.fingerprint.bytes).toBe(stats.size);
    expect(snapshot.fingerprint.bytes).toBe(Buffer.byteLength(text, "utf8"));
  });

  test("fingerprint.path equals the input path verbatim", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.path).toBe(path);
  });

  test("fingerprint.rows counts successfully-parsed rows, not total non-blank lines", async () => {
    const path = await seedLedger(`${jsonRow("a")}\nbad\n${jsonRow("c")}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.rows).toBe(2);
  });

  test("last_row_id matches the id of the last parsed row", async () => {
    const path = await seedLedger(`${jsonRow("first")}\n${jsonRow("second")}\n${jsonRow("third")}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.last_row_id).toBe("third");
  });

  test("last_row_id absent when no rows parsed", async () => {
    const path = await seedLedger("");
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("last_row_id is the last GOOD row's id when bad lines follow good ones", async () => {
    const path = await seedLedger(`${jsonRow("good-1")}\n${jsonRow("good-2")}\nbad\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.last_row_id).toBe("good-2");
  });

  test("last_row_id is undefined when last parsed row has no id field", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n${JSON.stringify({ kind: "claim" })}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(2);
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("last_row_id is undefined when last row's id is empty string", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n${JSON.stringify({ id: "", kind: "claim" })}\n`);
    const snapshot = await loadLedger({ path });
    expect(snapshot.rows).toHaveLength(2);
    expect(snapshot.fingerprint.last_row_id).toBeUndefined();
  });

  test("custom hash function is honored for fingerprint.content_hash", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const snapshot = await loadLedger({ path, hash: () => "custom:HASH" });
    expect(snapshot.fingerprint.content_hash).toBe("custom:HASH");
  });

  test("loads a 10,000-row ledger in reasonable time and reports correct counts", async () => {
    const lines: string[] = [];
    for (let i = 0; i < 10_000; i += 1) lines.push(jsonRow(`r-${i}`));
    const text = `${lines.join("\n")}\n`;
    const path = await seedLedger(text);
    const start = Date.now();
    const snapshot = await loadLedger({ path });
    const elapsed = Date.now() - start;
    expect(snapshot.rows).toHaveLength(10_000);
    expect(snapshot.parseIssues).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(10_000);
    expect(snapshot.fingerprint.last_row_id).toBe("r-9999");
    expect(elapsed).toBeLessThan(2_000);
  });

  test("canonicalContentHash matches sha256 of UTF-8 bytes", async () => {
    expect(canonicalContentHash("")).toBe(`sha256:${rawSha256Hex("")}`);
    expect(canonicalContentHash("hello")).toBe(`sha256:${rawSha256Hex("hello")}`);
    expect(canonicalContentHash("héllo")).toBe(`sha256:${rawSha256Hex("héllo")}`);
  });

  test("canonicalContentHash format is exactly 'sha256:' + 64 hex chars", async () => {
    expect(canonicalContentHash("anything")).toMatch(/^sha256:[0-9a-f]{64}$/);
    expect(canonicalContentHash("")).toMatch(/^sha256:[0-9a-f]{64}$/);
  });

  test("canonicalContentHash agrees with loader's internal hash for the same input", async () => {
    const text = `${jsonRow("a")}\n${jsonRow("b")}\n`;
    const path = await seedLedger(text);
    const snapshot = await loadLedger({ path });
    expect(snapshot.fingerprint.content_hash).toBe(canonicalContentHash(text));
  });
});

describe("writeLedger", () => {
  test("acquires lock, loads, runs callback, appends, returns metadata", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const samples = rowSamples();
    const result = await writeLedger(
      { path, lockPath: lockPath() },
      async (snapshot) => {
        expect(snapshot.rows).toHaveLength(1);
        return { rows: [samples.source], result: { rows_seen: snapshot.rows.length } };
      },
    );

    expect(result.rowsRead).toBe(1);
    expect(result.rowsAppended).toBe(1);
    expect(result.bytesWritten).toBeGreaterThan(0);
    expect(result.result).toEqual({ rows_seen: 1 });

    const onDisk = await readFile(path, "utf8");
    const expectedAppended = `${JSON.stringify(samples.source)}\n`;
    expect(onDisk).toBe(`${jsonRow("a")}\n${expectedAppended}`);
  });

  test("rowsAppended equals callback rows length and bytesWritten equals UTF-8 batch length", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const rows = [samples.source, samples.claim];
    const result = await writeLedger({ path, lockPath: lockPath() }, async () => ({ rows, result: rows.length }));

    expect(result.rowsAppended).toBe(rows.length);
    const expectedBatch = `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`;
    expect(result.bytesWritten).toBe(Buffer.byteLength(expectedBatch, "utf8"));
  });

  test("bytesWritten counts UTF-8 bytes for multi-byte content (emoji/accented chars)", async () => {
    const path = ledgerPath();
    const row = { id: "u", kind: "claim", note: "héllo 🌍 résumé 北京" } as unknown as never;
    const result = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [row], result: undefined }),
    );
    const expectedBatch = `${JSON.stringify(row)}\n`;
    const utf8Len = Buffer.byteLength(expectedBatch, "utf8");
    expect(result.bytesWritten).toBe(utf8Len);
    expect(utf8Len).toBeGreaterThan(expectedBatch.length);
    const stats = await stat(path);
    expect(stats.size).toBe(utf8Len);
  });

  test("throws lock_busy KnbError when the lock file already exists", async () => {
    const path = ledgerPath();
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(lockPath(), "", "utf8");

    let thrown: unknown;
    try {
      await writeLedger({ path, lockPath: lockPath() }, async () => ({ rows: [], result: undefined }));
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("lock_busy");
    expect((thrown as { details?: { lockPath: string } }).details?.lockPath).toBe(lockPath());
  });

  test("propagates callback exception and releases the lock for subsequent writes", async () => {
    const path = ledgerPath();
    const samples = rowSamples();

    let thrown: unknown;
    try {
      await writeLedger({ path, lockPath: lockPath() }, async () => {
        throw new Error("callback boom");
      });
    } catch (error) {
      thrown = error;
    }
    expect((thrown as Error).message).toBe("callback boom");
    expect(await fileExists(lockPath())).toBe(false);

    const result = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source], result: "ok" }),
    );
    expect(result.rowsAppended).toBe(1);
  });

  test("does not write any bytes if the callback throws", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const before = await readFile(path, "utf8");

    let thrown: unknown;
    try {
      await writeLedger({ path, lockPath: lockPath() }, async () => {
        throw new Error("nope");
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();

    const after = await readFile(path, "utf8");
    expect(after).toBe(before);
  });

  test("calls fsyncFile and fsyncDir exactly once each in the right order", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const calls: string[] = [];
    const fsyncFileArgs: string[] = [];
    const fsyncDirArgs: string[] = [];

    const handle: LedgerLockHandle = {
      release: async () => {
        calls.push("release");
      },
    };
    const backend: LedgerFsBackend = {
      acquireLock: async () => handle,
      ensureDir: async () => {
        calls.push("ensureDir");
      },
      appendBytes: async (_p, data) => {
        calls.push("appendBytes");
        return Buffer.byteLength(data, "utf8");
      },
      fsyncFile: async (p) => {
        calls.push("fsyncFile");
        fsyncFileArgs.push(p);
      },
      fsyncDir: async (d) => {
        calls.push("fsyncDir");
        fsyncDirArgs.push(d);
      },
    };

    await writeLedger(
      {
        path,
        lockPath: lockPath(),
        fsBackend: backend,
        readFile: async () => "",
      },
      async () => ({ rows: [samples.source], result: undefined }),
    );

    expect(calls).toEqual(["ensureDir", "appendBytes", "fsyncFile", "fsyncDir", "release"]);
    expect(fsyncFileArgs).toEqual([path]);
    expect(fsyncDirArgs).toEqual([join(workDir, "knb")]);
  });

  test("backend without fsyncDir still completes write successfully", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const calls: string[] = [];
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { calls.push("release"); } }),
      ensureDir: async () => { calls.push("ensureDir"); },
      appendBytes: async (_p, data) => { calls.push("appendBytes"); return Buffer.byteLength(data, "utf8"); },
      fsyncFile: async () => { calls.push("fsyncFile"); },
    };
    const result = await writeLedger(
      { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
      async () => ({ rows: [samples.source], result: "ok" }),
    );
    expect(result.result).toBe("ok");
    expect(calls).toEqual(["ensureDir", "appendBytes", "fsyncFile", "release"]);
  });

  test("backend without fsyncFile or fsyncDir still completes write successfully", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const calls: string[] = [];
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { calls.push("release"); } }),
      ensureDir: async () => { calls.push("ensureDir"); },
      appendBytes: async (_p, data) => { calls.push("appendBytes"); return Buffer.byteLength(data, "utf8"); },
    };
    await writeLedger(
      { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    expect(calls).toEqual(["ensureDir", "appendBytes", "release"]);
  });

  test("fsyncFile failure is wrapped as io_failed and lock is released", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const calls: string[] = [];
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { calls.push("release"); } }),
      ensureDir: async () => { calls.push("ensureDir"); },
      appendBytes: async (_p, data) => { calls.push("appendBytes"); return Buffer.byteLength(data, "utf8"); },
      fsyncFile: async () => { throw new Error("disk-on-fire"); },
    };

    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => ({ rows: [samples.source], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("io_failed");
    expect((thrown as { details?: { path: string } }).details?.path).toBe(path);
    expect(calls).toEqual(["ensureDir", "appendBytes", "release"]);
  });

  test("fsyncDir failure does NOT fail the write (best-effort durability)", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => {} }),
      ensureDir: async () => {},
      appendBytes: async (_p, data) => Buffer.byteLength(data, "utf8"),
      fsyncFile: async () => {},
      fsyncDir: async () => { throw new Error("dir-fsync-not-supported"); },
    };
    const result = await writeLedger(
      { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
      async () => ({ rows: [samples.source], result: "ok" }),
    );
    expect(result.result).toBe("ok");
    expect(result.rowsAppended).toBe(1);
  });

  test("appendBytes failure surfaces as io_failed with original error preserved as cause", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const original = new Error("ENOSPC: no space left");
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => {} }),
      ensureDir: async () => {},
      appendBytes: async () => { throw original; },
    };
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => ({ rows: [samples.source], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect((thrown as { code?: string }).code).toBe("io_failed");
    expect((thrown as { details?: { path?: string } }).details?.path).toBe(path);
    expect((thrown as { cause?: unknown }).cause).toBe(original);
    expect((thrown as Error).message).toContain(path);
  });

  test("ensureDir failure surfaces as io_failed with original error preserved as cause", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const original = Object.assign(new Error("EACCES: permission denied"), { code: "EACCES" });
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => {} }),
      ensureDir: async () => { throw original; },
      appendBytes: async (_p, data) => Buffer.byteLength(data, "utf8"),
    };
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => ({ rows: [samples.source], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect((thrown as { code?: string }).code).toBe("io_failed");
    expect((thrown as { details?: { path?: string } }).details?.path).toBe(path);
    expect((thrown as { cause?: unknown }).cause).toBe(original);
  });

  test("fingerprintAfter content hash equals re-loading the same ledger", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const writeResult = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source, samples.claim], result: undefined }),
    );

    const reload = await loadLedger({ path });
    expect(writeResult.fingerprintAfter.content_hash).toBe(reload.fingerprint.content_hash);
    expect(writeResult.fingerprintAfter.bytes).toBe(reload.fingerprint.bytes);
    expect(writeResult.fingerprintAfter.rows).toBe(reload.fingerprint.rows);
    expect(writeResult.fingerprintAfter.last_row_id).toBe(reload.fingerprint.last_row_id);
    expect(writeResult.fingerprintAfter.path).toBe(path);
  });

  test("fingerprintBefore matches a load taken right before the write", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n${jsonRow("b")}\n`);
    const samples = rowSamples();
    const before = await loadLedger({ path });
    const writeResult = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    expect(writeResult.fingerprintBefore.content_hash).toBe(before.fingerprint.content_hash);
    expect(writeResult.fingerprintBefore.rows).toBe(before.fingerprint.rows);
    expect(writeResult.fingerprintBefore.bytes).toBe(before.fingerprint.bytes);
    expect(writeResult.fingerprintBefore.last_row_id).toBe(before.fingerprint.last_row_id);
  });

  test("ensures the parent directory exists when writing into a fresh temp dir", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source], result: undefined }),
    );

    const stats = await stat(path);
    expect(stats.isFile()).toBe(true);
  });

  test("writes into a deeply nested non-existent directory, creating all intermediate dirs", async () => {
    const path = join(workDir, "a", "b", "c", "d", "e", "ledger.jsonl");
    const lock = join(workDir, "x", "y", "z", "ledger.lock");
    const samples = rowSamples();
    const result = await writeLedger(
      { path, lockPath: lock },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    expect(result.rowsAppended).toBe(1);
    const stats = await stat(path);
    expect(stats.isFile()).toBe(true);
  });

  test("callback sees the snapshot returned by the loader without re-reading", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n${jsonRow("b")}\n`);
    const samples = rowSamples();

    let observed: LedgerSnapshot | undefined;
    await writeLedger({ path, lockPath: lockPath() }, async (snapshot) => {
      observed = snapshot;
      return { rows: [samples.source], result: undefined };
    });

    expect(observed).toBeDefined();
    expect(observed?.rows).toHaveLength(2);
    expect((observed?.rows[0]?.row as { id: string }).id).toBe("a");
    expect((observed?.rows[1]?.row as { id: string }).id).toBe("b");
    expect(observed?.fingerprint.rows).toBe(2);
  });

  test("snapshot fingerprint matches a load taken at the moment of lock acquisition", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n${jsonRow("b")}\n`);
    const expected = await loadLedger({ path });
    let observed: LedgerSnapshot | undefined;
    await writeLedger({ path, lockPath: lockPath() }, async (snapshot) => {
      observed = snapshot;
      return { rows: [], result: undefined };
    });
    expect(observed?.fingerprint.content_hash).toBe(expected.fingerprint.content_hash);
    expect(observed?.fingerprint.bytes).toBe(expected.fingerprint.bytes);
    expect(observed?.fingerprint.rows).toBe(expected.fingerprint.rows);
  });

  test("two sequential writes append both batches in order; second sees the first's rows", async () => {
    const path = ledgerPath();
    const samples = rowSamples();

    let secondSawFirst = false;
    await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    await writeLedger(
      { path, lockPath: lockPath() },
      async (snap) => {
        secondSawFirst = snap.rows.some((r) => (r.row as { id: string }).id === samples.source.id);
        return { rows: [samples.claim], result: undefined };
      },
    );

    expect(secondSawFirst).toBe(true);

    const reload = await loadLedger({ path });
    expect(reload.rows).toHaveLength(2);
    expect((reload.rows[0]?.row as { id: string }).id).toBe(samples.source.id);
    expect((reload.rows[1]?.row as { id: string }).id).toBe(samples.claim.id);
  });

  test("non-array rows from callback throw internal_error", async () => {
    const path = ledgerPath();
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath() },
        async () =>
          ({ rows: "not an array" as unknown as never[], result: undefined }) as unknown as never,
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("internal_error");
    expect(await fileExists(lockPath())).toBe(false);
  });

  test("non-object row in batch throws internal_error and writes nothing", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const before = await readFile(path, "utf8");

    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath() },
        async () => ({ rows: ["not an object" as unknown as never], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("internal_error");

    const after = await readFile(path, "utf8");
    expect(after).toBe(before);
    expect(await fileExists(lockPath())).toBe(false);
  });

  test("array row in batch is rejected as internal_error", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const before = await readFile(path, "utf8");
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath() },
        async () => ({ rows: [[] as unknown as never], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("internal_error");
    const after = await readFile(path, "utf8");
    expect(after).toBe(before);
  });

  test("null row in batch is rejected as internal_error", async () => {
    const path = ledgerPath();
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath() },
        async () => ({ rows: [null as unknown as never], result: undefined }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("internal_error");
  });

  test("row content with literal newline and CR characters is escaped by JSON.stringify and round-trips cleanly", async () => {
    const path = ledgerPath();
    const row = { id: "nl", kind: "claim", note: "line1\nline2\rline3" } as unknown as never;
    const result = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [row], result: undefined }),
    );
    expect(result.rowsAppended).toBe(1);
    const onDisk = await readFile(path, "utf8");
    expect(onDisk.endsWith("\n")).toBe(true);
    const lines = onDisk.split(/\r?\n/).filter((l) => l.length > 0);
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] as string) as { id: string; note: string };
    expect(parsed.id).toBe("nl");
    expect(parsed.note).toBe("line1\nline2\rline3");
    const reload = await loadLedger({ path });
    expect(reload.rows).toHaveLength(1);
    expect((reload.rows[0]?.row as unknown as { note: string }).note).toBe("line1\nline2\rline3");
  });

  test("empty batch acquires and releases lock, leaves file unchanged byte-for-byte, no fsync", async () => {
    const path = await seedLedger(`${jsonRow("a")}\n`);
    const before = await readFile(path, "utf8");
    const beforeStat = await stat(path);

    const calls: string[] = [];
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { calls.push("release"); } }),
      ensureDir: async () => { calls.push("ensureDir"); },
      appendBytes: async (_p, data) => { calls.push("appendBytes"); return Buffer.byteLength(data, "utf8"); },
      fsyncFile: async () => { calls.push("fsyncFile"); },
      fsyncDir: async () => { calls.push("fsyncDir"); },
    };
    const result = await writeLedger(
      { path, lockPath: lockPath(), fsBackend: backend },
      async () => ({ rows: [], result: "no-op" }),
    );

    expect(result.rowsAppended).toBe(0);
    expect(result.bytesWritten).toBe(0);
    expect(result.result).toBe("no-op");
    expect(calls).toEqual(["release"]);
    const after = await readFile(path, "utf8");
    expect(after).toBe(before);
    const afterStat = await stat(path);
    expect(afterStat.size).toBe(beforeStat.size);
    expect(result.fingerprintAfter.content_hash).toBe(result.fingerprintBefore.content_hash);
    expect(result.fingerprintAfter.rows).toBe(result.fingerprintBefore.rows);
  });

  test("default backend acquires and releases the lock such that the lock file does not linger", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source], result: undefined }),
    );

    expect(await fileExists(lockPath())).toBe(false);
  });

  test("default backend uses lockPath verbatim (not a derived name)", async () => {
    const path = ledgerPath();
    const customLock = join(workDir, ".knb", "custom.lockfile");
    let observed: string | undefined;
    const samples = rowSamples();
    const handle = await defaultLedgerFsBackend.acquireLock(customLock);
    observed = customLock;
    expect(await fileExists(customLock)).toBe(true);
    await handle.release();
    expect(await fileExists(customLock)).toBe(false);
    expect(observed).toBe(customLock);
    void path;
    void samples;
  });

  test("default backend lock acquire auto-creates the lock parent directory", async () => {
    const lp = join(workDir, "deep", "nested", "subdir", "ledger.lock");
    expect(await fileExists(join(workDir, "deep"))).toBe(false);
    const handle = await defaultLedgerFsBackend.acquireLock(lp);
    expect(await fileExists(lp)).toBe(true);
    await handle.release();
    expect(await fileExists(lp)).toBe(false);
  });

  test("releasing an already-removed lock file does not throw", async () => {
    const lp = lockPath();
    const handle = await defaultLedgerFsBackend.acquireLock(lp);
    await rm(lp, { force: true });
    await handle.release();
    expect(await fileExists(lp)).toBe(false);
  });

  test("five concurrent default-backend writes produce exactly one success and four lock_busy failures", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const tasks: Array<Promise<unknown>> = [];
    for (let i = 0; i < 5; i += 1) {
      tasks.push(
        writeLedger(
          { path, lockPath: lockPath() },
          async () => {
            await new Promise((r) => setTimeout(r, 25));
            return { rows: [samples.source], result: i };
          },
        ),
      );
    }
    const settled = await Promise.allSettled(tasks);
    const fulfilled = settled.filter((s) => s.status === "fulfilled");
    const rejected = settled.filter((s) => s.status === "rejected");
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(4);
    for (const r of rejected) {
      const reason = (r as PromiseRejectedResult).reason;
      expect(isKnbError(reason)).toBe(true);
      expect((reason as { code: string }).code).toBe("lock_busy");
    }
    expect(await fileExists(lockPath())).toBe(false);
    const reload = await loadLedger({ path });
    expect(reload.rows).toHaveLength(1);
  });

  test("default backend exposes fsyncFile and fsyncDir", () => {
    expect(typeof defaultLedgerFsBackend.fsyncFile).toBe("function");
    expect(typeof defaultLedgerFsBackend.fsyncDir).toBe("function");
  });

  test("default backend lock contention surfaces as lock_busy with details.lockPath", async () => {
    const lp = lockPath();
    const first = await defaultLedgerFsBackend.acquireLock(lp);
    let thrown: unknown;
    try {
      await defaultLedgerFsBackend.acquireLock(lp);
    } catch (e) {
      thrown = e;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("lock_busy");
    expect((thrown as { details?: { lockPath: string } }).details?.lockPath).toBe(lp);
    await first.release();
  });

  test("stale lock file from a prior crash (with arbitrary contents) still produces lock_busy", async () => {
    const lp = lockPath();
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(lp, "pid:99999 host:crashed-machine\n", "utf8");
    let thrown: unknown;
    try {
      await defaultLedgerFsBackend.acquireLock(lp);
    } catch (e) {
      thrown = e;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("lock_busy");
    expect(await fileExists(lp)).toBe(true);
  });

  test("release is invoked exactly once even when transaction succeeds", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    let releases = 0;
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { releases += 1; } }),
      ensureDir: async () => {},
      appendBytes: async (_p, d) => Buffer.byteLength(d, "utf8"),
    };
    await writeLedger(
      { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    expect(releases).toBe(1);
  });

  test("release is invoked exactly once when transaction throws", async () => {
    const path = ledgerPath();
    let releases = 0;
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({ release: async () => { releases += 1; } }),
      ensureDir: async () => {},
      appendBytes: async (_p, d) => Buffer.byteLength(d, "utf8"),
    };
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => { throw new Error("nope"); },
      );
    } catch (e) {
      thrown = e;
    }
    expect((thrown as Error).message).toBe("nope");
    expect(releases).toBe(1);
  });

  test("release failure after a successful write surfaces as internal_error", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({
        release: async () => {
          throw new Error("release-broken");
        },
      }),
      ensureDir: async () => {},
      appendBytes: async (_p, d) => Buffer.byteLength(d, "utf8"),
    };
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => ({ rows: [samples.source], result: "ok" }),
      );
    } catch (e) {
      thrown = e;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("internal_error");
    expect((thrown as { details?: { lockPath: string } }).details?.lockPath).toBe(lockPath());
  });

  test("release failure when transaction also throws prefers the original error", async () => {
    const path = ledgerPath();
    const backend: LedgerFsBackend = {
      acquireLock: async () => ({
        release: async () => { throw new Error("release-broken"); },
      }),
      ensureDir: async () => {},
      appendBytes: async (_p, d) => Buffer.byteLength(d, "utf8"),
    };
    let thrown: unknown;
    try {
      await writeLedger(
        { path, lockPath: lockPath(), fsBackend: backend, readFile: async () => "" },
        async () => { throw new Error("tx-broken"); },
      );
    } catch (e) {
      thrown = e;
    }
    expect((thrown as Error).message).toBe("tx-broken");
  });

  test("fingerprintAfter reflects rows appended in the batch", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    const result = await writeLedger(
      { path, lockPath: lockPath() },
      async () => ({ rows: [samples.source, samples.claim], result: undefined }),
    );
    expect(result.fingerprintAfter.rows).toBe(2);
    expect(result.fingerprintAfter.last_row_id).toBe(samples.claim.id);
    expect(result.fingerprintAfter.bytes).toBeGreaterThan(result.fingerprintBefore.bytes);
  });

  test("hash and reader options propagate to inner loadLedger calls", async () => {
    const path = ledgerPath();
    const samples = rowSamples();
    let hashCalls = 0;
    let readCalls = 0;
    const result = await writeLedger(
      {
        path,
        lockPath: lockPath(),
        readFile: async () => {
          readCalls += 1;
          return "";
        },
        hash: () => {
          hashCalls += 1;
          return "sha256:custom";
        },
      },
      async () => ({ rows: [samples.source], result: undefined }),
    );
    expect(readCalls).toBeGreaterThanOrEqual(2);
    expect(hashCalls).toBeGreaterThanOrEqual(2);
    expect(result.fingerprintBefore.content_hash).toBe("sha256:custom");
    expect(result.fingerprintAfter.content_hash).toBe("sha256:custom");
  });
});
