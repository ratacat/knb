// Output module - V1 command result envelopes, rendering, TTY/JSON detection,
// exit-code mapping, and stdout/stderr routing. Commands return CommandResult
// values; only this module writes to stdout or stderr.

import { exitCodeForError, type KnbError, type KnbErrorCode } from "./errors";

export type CommandMeta = {
  ledger?: string;
  elapsed_ms?: number;
  rows_read?: number;
  rows_appended?: number;
  rows_returned?: number;
  exit_code?: number;
  [key: string]: unknown;
};

export type CommandError = {
  code: KnbErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type CommandResult<T = unknown> =
  | { ok: true; command: string; data: T; meta: CommandMeta }
  | { ok: false; command?: string; error: CommandError; meta: CommandMeta & { exit_code: number } };

export type OutputFormat = "auto" | "json" | "text" | "pretty" | "ndjson" | "quiet";

export type OutputSink = {
  write: (chunk: string | Uint8Array) => unknown;
};

export type OutputOptions = {
  format?: OutputFormat;
  isTty?: boolean;
  stdout?: OutputSink;
  stderr?: OutputSink;
};

export function success<T>(command: string, data: T, meta: CommandMeta = {}): CommandResult<T> {
  return { ok: true, command, data, meta };
}

export function failure(
  command: string | undefined,
  error: KnbError,
  meta: CommandMeta = {},
): CommandResult {
  const exit_code = meta.exit_code ?? exitCodeForError(error.code);
  const errorEnvelope: CommandError = { code: error.code, message: error.message };
  if (error.details !== undefined) errorEnvelope.details = error.details;
  const result: CommandResult = {
    ok: false,
    error: errorEnvelope,
    meta: { ...meta, exit_code },
  };
  if (command !== undefined) result.command = command;
  return result;
}

function resolveFormat(options: OutputOptions | undefined): { format: OutputFormat; isTty: boolean } {
  const explicit = options?.format ?? "auto";
  const isTty = options?.isTty ?? Boolean((process.stdout as { isTTY?: boolean }).isTTY);
  if (explicit !== "auto") return { format: explicit, isTty };
  return { format: isTty ? "text" : "json", isTty };
}

function envelopeJson(result: CommandResult): unknown {
  if (result.ok) {
    return { ok: true, command: result.command, data: result.data, meta: result.meta };
  }
  const out: Record<string, unknown> = { ok: false };
  if (result.command !== undefined) out.command = result.command;
  out.error = result.error;
  out.meta = result.meta;
  return out;
}

export function renderJson(result: CommandResult): string {
  return JSON.stringify(envelopeJson(result));
}

export function renderPrettyJson(result: CommandResult): string {
  return JSON.stringify(envelopeJson(result), null, 2);
}

// Ndjson rule: when data is an array, emit one JSON line per element (each line
// is the raw row, not an envelope) followed by one envelope line carrying meta.
// For non-array data or any error envelope, emit a single envelope line.
export function renderNdjson(result: CommandResult): string {
  if (result.ok && Array.isArray(result.data)) {
    const lines = result.data.map((item) => JSON.stringify(item));
    lines.push(JSON.stringify(envelopeJson(result)));
    return `${lines.join("\n")}\n`;
  }
  return `${JSON.stringify(envelopeJson(result))}\n`;
}

export function renderHumanText(result: CommandResult): string {
  if (result.ok) {
    const data = result.data;
    if (data === null || data === undefined) return "OK\n";
    if (typeof data === "string") return `${data}\n`;
    if (Array.isArray(data)) {
      if (data.length === 0) return "OK (0 rows)\n";
      const lines = data.map((item) => formatHumanItem(item));
      return `${lines.join("\n")}\n`;
    }
    if (typeof data === "object") {
      return `${formatHumanItem(data)}\n`;
    }
    return `${String(data)}\n`;
  }
  const detailSegment =
    result.error.details && Object.keys(result.error.details).length > 0
      ? ` ${JSON.stringify(result.error.details)}`
      : "";
  return `${result.error.code}: ${result.error.message}${detailSegment}\n`;
}

function formatHumanItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item === null || item === undefined) return "";
  if (typeof item !== "object") return String(item);
  const runLog = asRunLogResult(item);
  if (runLog) return formatRunLog(runLog.entries);
  const collections = asCollectionsResult(item);
  if (collections) return formatCollections(collections.collections);
  const candidate = item as { id?: unknown; kind?: unknown };
  const id = typeof candidate.id === "string" ? candidate.id : undefined;
  const kind = typeof candidate.kind === "string" ? candidate.kind : undefined;
  const text = humanRowText(item);
  const parts = [id, kind, text].filter((value): value is string => typeof value === "string" && value.length > 0);
  if (parts.length > 0) return parts.join("\t");
  return JSON.stringify(item);
}

function humanRowText(item: unknown): string | undefined {
  if (item === null || typeof item !== "object") return undefined;
  const row = item as {
    kind?: unknown;
    source?: { title?: unknown };
    claim?: { statement?: unknown };
    question?: { text?: unknown };
    synthesis?: { title?: unknown };
  };
  if (row.kind === "source" && typeof row.source?.title === "string") return row.source.title;
  if (row.kind === "claim" && typeof row.claim?.statement === "string") return row.claim.statement;
  if (row.kind === "question" && typeof row.question?.text === "string") return row.question.text;
  if (row.kind === "synthesis" && typeof row.synthesis?.title === "string") return row.synthesis.title;
  return undefined;
}

type HumanRunLogEntry = {
  run_id: string;
  actor: string;
  intent?: string;
  completed_at: string;
  rows_appended: number;
};

function asRunLogResult(item: unknown): { entries: HumanRunLogEntry[] } | undefined {
  if (item === null || typeof item !== "object" || Array.isArray(item)) return undefined;
  const entries = (item as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return undefined;
  const parsed: HumanRunLogEntry[] = [];
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const candidate = entry as {
      run_id?: unknown;
      actor?: unknown;
      intent?: unknown;
      completed_at?: unknown;
      rows_appended?: unknown;
    };
    if (
      typeof candidate.run_id !== "string" ||
      typeof candidate.actor !== "string" ||
      typeof candidate.completed_at !== "string" ||
      typeof candidate.rows_appended !== "number"
    ) {
      return undefined;
    }
    const parsedEntry: HumanRunLogEntry = {
      run_id: candidate.run_id,
      actor: candidate.actor,
      completed_at: candidate.completed_at,
      rows_appended: candidate.rows_appended,
    };
    if (typeof candidate.intent === "string") parsedEntry.intent = candidate.intent;
    parsed.push(parsedEntry);
  }
  return { entries: parsed };
}

function formatRunLog(entries: HumanRunLogEntry[]): string {
  if (entries.length === 0) return "OK (0 runs)";
  const lines = ["completed_at\tactor\trows\trun_id\tintent"];
  for (const entry of entries) {
    lines.push([
      entry.completed_at,
      entry.actor,
      String(entry.rows_appended),
      entry.run_id,
      entry.intent ?? "",
    ].join("\t"));
  }
  return lines.join("\n");
}

type HumanCollectionEntry = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  latest_created_at?: string;
};

function asCollectionsResult(item: unknown): { collections: HumanCollectionEntry[] } | undefined {
  if (item === null || typeof item !== "object" || Array.isArray(item)) return undefined;
  const entries = (item as { collections?: unknown }).collections;
  if (!Array.isArray(entries)) return undefined;
  const parsed: HumanCollectionEntry[] = [];
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const candidate = entry as {
      collection?: unknown;
      active_counts_by_kind?: unknown;
      latest_created_at?: unknown;
    };
    if (
      typeof candidate.collection !== "string" ||
      candidate.active_counts_by_kind === null ||
      typeof candidate.active_counts_by_kind !== "object" ||
      Array.isArray(candidate.active_counts_by_kind)
    ) {
      return undefined;
    }
    const parsedEntry: HumanCollectionEntry = {
      collection: candidate.collection,
      active_counts_by_kind: candidate.active_counts_by_kind as Record<string, number>,
    };
    if (typeof candidate.latest_created_at === "string") parsedEntry.latest_created_at = candidate.latest_created_at;
    parsed.push(parsedEntry);
  }
  return { collections: parsed };
}

function formatCollections(collections: HumanCollectionEntry[]): string {
  if (collections.length === 0) return "OK (0 collections)";
  const kinds = ["source", "claim", "question", "synthesis", "change"] as const;
  const lines = [`collection\t${kinds.join("\t")}\tlatest_created_at`];
  for (const entry of collections) {
    const counts = kinds.map((kind) => String(entry.active_counts_by_kind[kind] ?? 0));
    lines.push([entry.collection, ...counts, entry.latest_created_at ?? ""].join("\t"));
  }
  return lines.join("\n");
}

export function render(
  result: CommandResult,
  options: OutputOptions = {},
): { exitCode: number } {
  const { format } = resolveFormat(options);
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const exitCode = result.ok ? 0 : result.meta.exit_code;

  if (format === "quiet") {
    if (!result.ok) stderr.write(`${result.error.code}\n`);
    return { exitCode };
  }

  const target = result.ok ? stdout : stderr;

  switch (format) {
    case "json":
      target.write(`${renderJson(result)}\n`);
      break;
    case "pretty":
      target.write(`${renderPrettyJson(result)}\n`);
      break;
    case "ndjson":
      target.write(renderNdjson(result));
      break;
    case "text":
      target.write(renderHumanText(result));
      break;
    default:
      target.write(renderHumanText(result));
      break;
  }

  return { exitCode };
}
