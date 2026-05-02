// Ledger module - V1 owner of knb/ledger.jsonl filesystem correctness.
// Loads JSONL defensively with line-numbered parse issues, computes canonical
// fingerprints from ledger bytes, and runs read/append/flush inside a locked
// write transaction. Callers do not touch readFile / appendFile / writeFile
// against the ledger; if they did, lock and JSONL invariants would leak out.

import { appendFile, mkdir, open, readFile as fsReadFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

import type { KnbRow } from "./contract";
import { knbError } from "./errors";

export type LoadedRow = {
  row: KnbRow;
  line: number;
  bytes: number;
};

export type ParseIssue = {
  level: "error";
  code: "jsonl_parse_failed" | "ledger_unreadable";
  message: string;
  line?: number;
};

export type LedgerFingerprint = {
  path: string;
  rows: number;
  bytes: number;
  last_row_id?: string;
  content_hash: string;
};

export type LedgerSnapshot = {
  rows: LoadedRow[];
  parseIssues: ParseIssue[];
  fingerprint: LedgerFingerprint;
};

export type LedgerLoadOptions = {
  path: string;
  readFile?: (p: string) => Promise<string>;
  hash?: (data: string) => string;
};

export type LedgerLockHandle = {
  release(): Promise<void>;
};

export type LedgerFsBackend = {
  acquireLock(lockPath: string): Promise<LedgerLockHandle>;
  ensureDir(dir: string): Promise<void>;
  appendBytes(path: string, data: string): Promise<number>;
  fsyncFile?(path: string): Promise<void>;
  fsyncDir?(dir: string): Promise<void>;
};

export type LedgerWriteOptions = {
  path: string;
  lockPath: string;
  readFile?: (p: string) => Promise<string>;
  hash?: (data: string) => string;
  fsBackend?: LedgerFsBackend;
  waitMs?: number;
};

export type LedgerAppendPlan<T> = {
  rows: KnbRow[];
  result: T;
};

export type LedgerWriteTransaction<T> = (
  snapshot: LedgerSnapshot,
) => Promise<LedgerAppendPlan<T>>;

export type LedgerWriteResult<T> = {
  result: T;
  rowsRead: number;
  rowsAppended: number;
  bytesWritten: number;
  fingerprintBefore: LedgerFingerprint;
  fingerprintAfter: LedgerFingerprint;
};

export function canonicalContentHash(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export async function loadLedger(options: LedgerLoadOptions): Promise<LedgerSnapshot> {
  const reader = options.readFile ?? defaultReadFile;
  const hasher = options.hash ?? canonicalContentHash;

  let content: string;
  try {
    content = await reader(options.path);
  } catch (error) {
    if (isMissing(error)) {
      return {
        rows: [],
        parseIssues: [],
        fingerprint: {
          path: options.path,
          rows: 0,
          bytes: 0,
          content_hash: hasher(""),
        },
      };
    }
    throw knbError(
      "io_failed",
      `Failed to read ledger: ${options.path}`,
      { path: options.path },
      error,
    );
  }

  const rows: LoadedRow[] = [];
  const parseIssues: ParseIssue[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trim();
    if (!line) continue;
    const lineNumber = index + 1;
    try {
      const row = JSON.parse(line) as KnbRow;
      rows.push({ row, line: lineNumber, bytes: Buffer.byteLength(line, "utf8") });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      parseIssues.push({
        level: "error",
        code: "jsonl_parse_failed",
        line: lineNumber,
        message: `Invalid JSON at line ${lineNumber}: ${detail}`,
      });
    }
  }

  const fingerprint: LedgerFingerprint = {
    path: options.path,
    rows: rows.length,
    bytes: Buffer.byteLength(content, "utf8"),
    content_hash: hasher(content),
  };
  const lastId = rows.length > 0 ? stringId(rows[rows.length - 1]?.row) : undefined;
  if (lastId !== undefined) fingerprint.last_row_id = lastId;

  return { rows, parseIssues, fingerprint };
}

export async function writeLedger<T>(
  options: LedgerWriteOptions,
  transaction: LedgerWriteTransaction<T>,
): Promise<LedgerWriteResult<T>> {
  const backend = options.fsBackend ?? defaultLedgerFsBackend;
  const reader = options.readFile ?? defaultReadFile;
  const hasher = options.hash ?? canonicalContentHash;

  const handle = await backend.acquireLock(options.lockPath);

  let txResult: LedgerWriteResult<T> | undefined;
  let txError: unknown;
  try {
    const snapshotBefore = await loadLedger({ path: options.path, readFile: reader, hash: hasher });

    const plan = await transaction(snapshotBefore);
    if (!Array.isArray(plan?.rows)) {
      throw knbError(
        "internal_error",
        "Ledger write transaction must return an array of rows",
        { path: options.path },
      );
    }

    const serialized: string[] = [];
    for (let index = 0; index < plan.rows.length; index += 1) {
      const row = plan.rows[index];
      if (row === null || typeof row !== "object" || Array.isArray(row)) {
        throw knbError(
          "internal_error",
          `Ledger write transaction returned a non-object row at index ${index}`,
          { path: options.path, index },
        );
      }
      const json = JSON.stringify(row);
      if (json.includes("\n") || json.includes("\r")) {
        throw knbError(
          "internal_error",
          `Serialized row at index ${index} contains newline characters`,
          { path: options.path, index },
        );
      }
      serialized.push(json);
    }

    let bytesWritten = 0;
    if (serialized.length > 0) {
      const batch = `${serialized.join("\n")}\n`;
      try {
        await backend.ensureDir(dirname(options.path));
      } catch (error) {
        throw knbError(
          "io_failed",
          `Failed to create ledger directory: ${dirname(options.path)}`,
          { path: options.path },
          error,
        );
      }
      try {
        bytesWritten = await backend.appendBytes(options.path, batch);
      } catch (error) {
        throw knbError(
          "io_failed",
          `Failed to append to ledger: ${options.path}`,
          { path: options.path },
          error,
        );
      }
      if (backend.fsyncFile) {
        try {
          await backend.fsyncFile(options.path);
        } catch (error) {
          throw knbError(
            "io_failed",
            `Failed to fsync ledger file: ${options.path}`,
            { path: options.path },
            error,
          );
        }
      }
      if (backend.fsyncDir) {
        try {
          await backend.fsyncDir(dirname(options.path));
        } catch {
          // best-effort; some platforms reject directory fsync
        }
      }
    }

    const snapshotAfter = await loadLedger({ path: options.path, readFile: reader, hash: hasher });

    txResult = {
      result: plan.result,
      rowsRead: snapshotBefore.rows.length,
      rowsAppended: plan.rows.length,
      bytesWritten,
      fingerprintBefore: snapshotBefore.fingerprint,
      fingerprintAfter: snapshotAfter.fingerprint,
    };
  } catch (error) {
    txError = error;
  }

  let releaseError: unknown;
  try {
    await handle.release();
  } catch (error) {
    releaseError = error;
  }

  if (txError !== undefined) throw txError;
  if (releaseError !== undefined) {
    throw knbError(
      "internal_error",
      `Failed to release ledger lock: ${options.lockPath}`,
      { lockPath: options.lockPath },
      releaseError,
    );
  }
  return txResult as LedgerWriteResult<T>;
}

export const defaultLedgerFsBackend: LedgerFsBackend = {
  async acquireLock(lockPath: string): Promise<LedgerLockHandle> {
    try {
      await mkdir(dirname(lockPath), { recursive: true });
    } catch (error) {
      throw knbError(
        "io_failed",
        `Failed to create lock directory: ${dirname(lockPath)}`,
        { lockPath },
        error,
      );
    }
    let handle: Awaited<ReturnType<typeof open>>;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
        throw knbError("lock_busy", "Ledger lock busy", { lockPath });
      }
      throw knbError(
        "io_failed",
        `Failed to acquire ledger lock: ${lockPath}`,
        { lockPath },
        error,
      );
    }
    return {
      async release(): Promise<void> {
        try {
          await handle.close();
        } catch {
          // file handle may already be closed; the unlink below is the source of truth
        }
        try {
          await unlink(lockPath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
          throw error;
        }
      },
    };
  },

  async ensureDir(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  },

  async appendBytes(path: string, data: string): Promise<number> {
    await appendFile(path, data, "utf8");
    return Buffer.byteLength(data, "utf8");
  },

  async fsyncFile(path: string): Promise<void> {
    const handle = await open(path, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  },

  async fsyncDir(dir: string): Promise<void> {
    try {
      const handle = await open(dir, "r");
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
    } catch {
      // best-effort directory fsync; some platforms (notably Windows) refuse
    }
  },
};

function defaultReadFile(path: string): Promise<string> {
  return fsReadFile(path, "utf8");
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

function stringId(row: KnbRow | undefined): string | undefined {
  if (!row) return undefined;
  const id = (row as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}
