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
  suggestions?: string[];
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
  if (error.details !== undefined) {
    const suggestions = Array.isArray(error.details.suggestions)
      ? error.details.suggestions.filter((item): item is string => typeof item === "string" && item.length > 0)
      : [];
    if (suggestions.length > 0) errorEnvelope.suggestions = suggestions;
    const { suggestions: _suggestions, ...details } = error.details;
    if (Object.keys(details).length > 0) errorEnvelope.details = details;
  }
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
