import { readFile as fsReadFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import type { DraftRow, KnbRowKind } from "./core/contract";
import { fromUnknown, knbError } from "./core/errors";
import {
  ROW_KINDS,
  openKnb,
  type ApplyRequest,
  type CollectionStatusRequest,
  type Knb,
  type LogRequest,
  type OpenKnbOptions,
} from "./core/knb";
import {
  failure,
  render,
  success,
  type CommandResult,
  type OutputFormat,
  type OutputOptions,
} from "./core/output";
import type { ContextRequest } from "./core/context";
import type { GetRequest, QueryRequest } from "./core/query";
import type { RenderAllRequest, RenderRequest } from "./core/projections";

type FlagValue = string | boolean | Array<string | boolean>;
type FlagMap = Map<string, FlagValue>;

const COMMANDS = new Set([
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
  "render",
  "check",
  "index",
]);

export async function runCli(args: string[], options: OutputOptions = {}): Promise<number> {
  const [command, ...rest] = args;
  const positionals: string[] = [];
  const flags = parseFlags(rest, positionals);
  const outputOptions: OutputOptions = { ...options };
  const formatFromCli = formatFromFlags(flags);
  if (formatFromCli && options.format === undefined) outputOptions.format = formatFromCli;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  if (!COMMANDS.has(command)) {
    return renderResult(
      failure(command, knbError("invalid_arguments", `Unknown command: ${command}`), {
        exit_code: 2,
      }),
      outputOptions,
    );
  }

  return runFacadeCommand(command, flags, positionals, outputOptions);
}

async function runFacadeCommand(
  command: string,
  flags: FlagMap,
  positionals: string[],
  outputOptions: OutputOptions,
): Promise<number> {
  const start = Date.now();

  let knb: Knb;
  try {
    const openOptions: OpenKnbOptions = {};
    const rootFlag = stringFlag(flags, "root");
    const configFlag = stringFlag(flags, "config");
    const ledgerFlag = stringFlag(flags, "ledger");
    const actorFlag = stringFlag(flags, "actor");
    if (rootFlag) openOptions.root = rootFlag;
    if (configFlag) openOptions.configPath = configFlag;
    if (ledgerFlag) openOptions.ledgerPath = ledgerFlag;
    if (actorFlag) openOptions.actor = actorFlag;
    knb = await openKnb(openOptions);
  } catch (error) {
    return renderResult(
      failure(command, fromUnknown(error), { elapsed_ms: Date.now() - start }),
      outputOptions,
    );
  }

  const baseMeta = (): Record<string, unknown> => ({
    workspace_root: knb.workspace.root,
    ledger: knb.workspace.paths.ledger,
    elapsed_ms: Date.now() - start,
  });

  try {
    if (command === "init") {
      const force = booleanFlag(flags, "force");
      const initActor = stringFlag(flags, "actor");
      const result = await knb.init(initActor ? { force, actor: initActor } : { force });
      return renderResult(
        success("init", result, {
          workspace_root: knb.workspace.root,
          ledger: result.ledger_path,
          elapsed_ms: Date.now() - start,
        }),
        outputOptions,
      );
    }

    if (command === "status") {
      const collection = stringFlag(flags, "collection");
      if (collection) {
        const result = await knb.collectionStatus(collectionStatusRequestFromFlags(flags, collection));
        return renderResult(
          success("status", result, {
            ...baseMeta(),
            collection: result.collection,
            open_question_count: result.open_question_count,
          }),
          outputOptions,
        );
      }
      const result = await knb.status({ detailed: booleanFlag(flags, "detailed") });
      return renderResult(success("status", result, baseMeta()), outputOptions);
    }

    if (command === "collections") {
      const result = await knb.collections();
      return renderResult(
        success("collections", result, { ...baseMeta(), rows_returned: result.collections.length }),
        outputOptions,
      );
    }

    if (command === "schema") {
      const result = await knb.schema();
      return renderResult(
        success("schema", result, {
          workspace_root: knb.workspace.root,
          elapsed_ms: Date.now() - start,
        }),
        outputOptions,
      );
    }

    if (command === "log") {
      const request: LogRequest = {};
      const logActor = stringFlag(flags, "actor");
      const since = stringFlag(flags, "since");
      const until = stringFlag(flags, "until");
      const limit = numberFlag(flags, "limit");
      if (logActor !== undefined) request.actor = logActor;
      if (since !== undefined) request.since = since;
      if (until !== undefined) request.until = until;
      if (limit !== undefined) request.limit = limit;
      const result = await knb.log(request);
      return renderResult(
        success("log", result, { ...baseMeta(), rows_returned: result.total_returned }),
        outputOptions,
      );
    }

    if (command === "apply") {
      const request = await readApplyRequest(flags, knb.workspace.root);
      if (booleanFlag(flags, "atomic")) request.atomic = true;
      const dryRun = booleanFlag(flags, "dry-run");
      const result = dryRun ? await knb.previewApply(request) : await knb.apply(request);
      return renderResult(
        success("apply", result, {
          ...baseMeta(),
          rows_appended: result.meta.rows_appended,
          ...(dryRun ? { dry_run: true, planned_rows: result.meta.planned_rows ?? 0 } : {}),
        }),
        outputOptions,
      );
    }

    if (command === "add") {
      const row = (await readWorkspaceJsonPayload(flags, knb.workspace.root)) as DraftRow;
      const result = await knb.add(row);
      return renderResult(
        success("add", result, { ...baseMeta(), rows_appended: result.meta.rows_appended }),
        outputOptions,
      );
    }

    if (command === "get") {
      if (positionals.length === 0) {
        return renderResult(
          failure(
            "get",
            knbError("invalid_arguments", "knb get requires at least one id"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const result = await knb.get(positionals, getRequestFromFlags(flags));
      return renderResult(success("get", result, baseMeta()), outputOptions);
    }

    if (command === "query") {
      const request = queryRequestFromFlags(flags);
      const result = await knb.query(request);
      return renderResult(
        success("query", result, { ...baseMeta(), rows_returned: result.total_returned }),
        outputOptions,
      );
    }

    if (command === "context") {
      const request = contextRequestFromFlags(flags);
      const result = await knb.context(request);
      return renderResult(success("context", result, baseMeta()), outputOptions);
    }

    if (command === "render") {
      const renderAll = booleanFlag(flags, "all");
      const collection = stringFlag(flags, "collection");
      const asOf = stringFlag(flags, "as-of");
      if (renderAll && collection) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "Use either --collection <c> or --all, not both"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      if (renderAll && stringFlag(flags, "out")) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "--out can only be used with --collection"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const format = stringFlag(flags, "format") as RenderRequest["format"] | undefined;
      if (renderAll) {
        const request: RenderAllRequest = {};
        if (format) request.format = format;
        if (asOf !== undefined) request.asOf = asOf;
        const result = await knb.renderAll(request);
        return renderResult(
          success("render", result, {
            ...baseMeta(),
            collections_rendered: result.collections.length,
            bytes_written: result.total_bytes_written,
          }),
          outputOptions,
        );
      }
      if (!collection) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "Missing required flag: --collection or --all"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const request: RenderRequest = { collection };
      const out = stringFlag(flags, "out");
      if (out) request.out = out;
      if (format) request.format = format;
      if (asOf !== undefined) request.asOf = asOf;
      const result = await knb.render(request);
      return renderResult(
        success("render", result, { ...baseMeta(), bytes_written: result.bytes_written }),
        outputOptions,
      );
    }

    if (command === "check") {
      const result = await knb.check();
      return renderResult(success("check", result, baseMeta()), outputOptions);
    }

    if (command === "index") {
      if (booleanFlag(flags, "rebuild")) {
        const result = await knb.rebuildIndex();
        return renderResult(success("index", result, baseMeta()), outputOptions);
      }
      const result = await knb.check();
      return renderResult(
        success("index", { projection_freshness: result.projection_freshness }, baseMeta()),
        outputOptions,
      );
    }

    return renderResult(
      failure(command, knbError("invalid_arguments", `Unknown command: ${command}`), baseMeta()),
      outputOptions,
    );
  } catch (error) {
    return renderResult(failure(command, fromUnknown(error), baseMeta()), outputOptions);
  }
}

function renderResult(result: CommandResult, options: OutputOptions): number {
  return render(result, options).exitCode;
}

function formatFromFlags(flags: FlagMap): OutputFormat | undefined {
  if (booleanFlag(flags, "quiet")) return "quiet";
  if (booleanFlag(flags, "ndjson")) return "ndjson";
  if (booleanFlag(flags, "pretty")) return "pretty";
  if (booleanFlag(flags, "json")) return "json";
  if (booleanFlag(flags, "text")) return "text";
  return undefined;
}

function parseFlags(args: string[], positionals: string[]): FlagMap {
  const flags: FlagMap = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const equalsIndex = arg.indexOf("=");
    if (equalsIndex > -1) {
      setFlag(flags, arg.slice(2, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      setFlag(flags, key, next);
      index += 1;
    } else {
      setFlag(flags, key, true);
    }
  }
  return flags;
}

function setFlag(flags: FlagMap, key: string, value: string | boolean): void {
  const existing = flags.get(key);
  if (existing === undefined) {
    flags.set(key, value);
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  flags.set(key, [existing, value]);
}

function collectionStatusRequestFromFlags(flags: FlagMap, collection: string): CollectionStatusRequest {
  const request: CollectionStatusRequest = { collection };
  const maxQuestions = numberFlag(flags, "max-questions");
  if (maxQuestions !== undefined) request.maxQuestions = maxQuestions;
  return request;
}

function getRequestFromFlags(flags: FlagMap): Omit<GetRequest, "ids"> {
  const request: Omit<GetRequest, "ids"> = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  if (booleanFlag(flags, "include-history") || booleanFlag(flags, "history")) {
    request.includeHistory = true;
  }
  if (booleanFlag(flags, "explain")) request.explain = true;
  return request;
}

function queryRequestFromFlags(flags: FlagMap): QueryRequest {
  const request: QueryRequest = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  const kindFlag = stringFlag(flags, "kind");
  if (kindFlag) {
    if (!(ROW_KINDS as readonly string[]).includes(kindFlag)) {
      throw knbError("invalid_arguments", `Invalid --kind value: ${kindFlag}`, { kind: kindFlag });
    }
    request.kinds = [kindFlag as KnbRowKind];
  }
  const collection = stringFlag(flags, "collection");
  if (collection) request.collection = collection;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const text = stringFlag(flags, "text");
  if (text) request.text = text;
  const claimKey = stringFlag(flags, "claim-key");
  if (claimKey) request.claimKey = claimKey;
  const claimType = stringFlag(flags, "claim-type");
  if (claimType) request.claimType = claimType;
  const predicate = stringFlag(flags, "predicate");
  if (predicate) request.predicate = predicate;
  const qualifiers = parseQualifierFlags(flags);
  if (qualifiers !== undefined) request.qualifiers = qualifiers;
  const externalRefs = parseExternalRefFlags(flags);
  if (externalRefs !== undefined) request.externalRefs = externalRefs;
  const citing = stringFlag(flags, "citing");
  if (citing) request.citing = citing;
  const limit = numberFlag(flags, "limit");
  if (limit !== undefined) request.limit = limit;
  if (booleanFlag(flags, "history") || booleanFlag(flags, "include-history")) {
    request.includeHistory = true;
  }
  if (booleanFlag(flags, "full")) request.full = true;
  return request;
}

function contextRequestFromFlags(flags: FlagMap): ContextRequest {
  const request: ContextRequest = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  const collection = stringFlag(flags, "collection");
  if (collection) request.collection = collection;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const claimType = stringFlag(flags, "claim-type");
  if (claimType) request.claimType = claimType;
  const predicate = stringFlag(flags, "predicate");
  if (predicate) request.predicate = predicate;
  const qualifiers = parseQualifierFlags(flags);
  if (qualifiers !== undefined) request.qualifiers = qualifiers;
  const externalRefs = parseExternalRefFlags(flags);
  if (externalRefs !== undefined) request.externalRefs = externalRefs;
  const maxTokens = numberFlag(flags, "max-tokens");
  if (maxTokens !== undefined) request.maxTokens = maxTokens;
  const recencyWindowDays = numberFlag(flags, "recency-window-days");
  if (recencyWindowDays !== undefined) request.recencyWindowDays = recencyWindowDays;
  if (booleanFlag(flags, "no-warnings")) request.includeWarnings = false;
  return request;
}

function stringFlag(flags: FlagMap, key: string): string | undefined {
  const value = flags.get(key);
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const entry = value[index];
      if (typeof entry === "string" && entry.length > 0) return entry;
    }
    return undefined;
  }
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanFlag(flags: FlagMap, key: string): boolean {
  const value = flags.get(key);
  if (Array.isArray(value)) return value.includes(true);
  return value === true;
}

function numberFlag(flags: FlagMap, key: string): number | undefined {
  if (!flags.has(key)) return undefined;
  const value = stringFlag(flags, key);
  if (value === undefined) {
    throw knbError("invalid_arguments", `Invalid --${key} value; expected a number`, {
      flag: `--${key}`,
      value: String(flags.get(key)),
    });
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw knbError("invalid_arguments", `Invalid --${key} value; expected a number`, {
      flag: `--${key}`,
      value,
    });
  }
  return parsed;
}

function stringFlags(flags: FlagMap, key: string): string[] {
  const value = flags.get(key);
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function parseQualifierFlags(flags: FlagMap): Record<string, string> | undefined {
  const entries = stringFlags(flags, "qualifier");
  if (entries.length === 0) return undefined;
  const qualifiers: Record<string, string> = {};
  for (const entry of entries) {
    const equalsIndex = entry.indexOf("=");
    if (equalsIndex <= 0 || equalsIndex === entry.length - 1) {
      throw knbError("invalid_arguments", "Invalid --qualifier value; expected key=value", { qualifier: entry });
    }
    const key = entry.slice(0, equalsIndex).trim();
    const value = entry.slice(equalsIndex + 1);
    if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
      throw knbError("invalid_arguments", "Invalid --qualifier key; expected letters, numbers, dot, underscore, or dash", { qualifier: entry });
    }
    qualifiers[key] = value;
  }
  return qualifiers;
}

function parseExternalRefFlags(flags: FlagMap): Array<{ system: string; id: string }> | undefined {
  const entries = stringFlags(flags, "external-ref");
  if (entries.length === 0) return undefined;
  return entries.map((entry) => {
    const colonIndex = entry.indexOf(":");
    if (colonIndex <= 0 || colonIndex === entry.length - 1) {
      throw knbError("invalid_arguments", "Invalid --external-ref value; expected system:id", { external_ref: entry });
    }
    return { system: entry.slice(0, colonIndex), id: entry.slice(colonIndex + 1) };
  });
}

async function readJsonPayload(flags: FlagMap): Promise<unknown> {
  const file = stringFlag(flags, "file");
  if (file) {
    let raw: string;
    try {
      raw = await fsReadFile(file, "utf8");
    } catch (error) {
      throw knbError("io_failed", `Failed to read JSON file: ${file}`, { path: file }, error);
    }
    return parseJsonOrThrow(raw, `--file ${file}`);
  }
  const json = stringFlag(flags, "json");
  if (json) return parseJsonOrThrow(json, "--json");
  if (booleanFlag(flags, "stdin")) return readStdinJson();
  throw knbError("invalid_arguments", "Provide --file <path>, --json <text>, or --stdin");
}

async function readWorkspaceJsonPayload(flags: FlagMap, workspaceRoot: string): Promise<unknown> {
  const file = stringFlag(flags, "file");
  if (file) {
    const resolvedPath = isAbsolute(file) ? file : join(workspaceRoot, file);
    let raw: string;
    try {
      raw = await fsReadFile(resolvedPath, "utf8");
    } catch (error) {
      throw knbError(
        "io_failed",
        `Failed to read JSON file: ${file}`,
        { input_path: file, resolved_path: resolvedPath },
        error,
      );
    }
    return parseJsonOrThrow(raw, `--file ${file}`);
  }
  return readJsonPayload(flags);
}

function parseJsonOrThrow(raw: string, source: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw knbError(
      "invalid_arguments",
      `Failed to parse JSON from ${source}: ${message}`,
      { source },
      error,
    );
  }
}

async function readApplyRequest(flags: FlagMap, workspaceRoot: string): Promise<ApplyRequest> {
  const payload = await readWorkspaceJsonPayload(flags, workspaceRoot);
  return payload as ApplyRequest;
}

async function readStdinJson(): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  if (input.length === 0) {
    throw knbError("invalid_arguments", "stdin closed with no JSON input");
  }
  return parseJsonOrThrow(input, "--stdin");
}

function printHelp(): void {
  console.log(`knb

What this is:
  KNB is an append-only knowledge ledger for agent research. Store sourced facts as
  source/claim/question/synthesis/change rows, then read them through the same facade
  that the CLI uses. The ledger is canonical; views and indexes are disposable outputs.

Typical workflows:
  Research pass:
    1. Check orientation: knb status --collection <c> and knb context --collection <c>.
    2. Preview a batch: knb apply --dry-run --stdin --json.
    3. Apply the batch, then refresh outputs: knb render --all; knb index --rebuild; knb check --json.
    4. Keep one current synthesis per thread by superseding older synthesis rows.

  Handoff:
    Use knb status --collection <c> --max-questions N for latest synthesis and open questions.
    Use knb context --collection <c> --max-tokens N for a compact packet for the next agent.

  Host application:
    Use openKnb(...).apply/add/query/context/render/check/rebuildIndex so app code and CLI
    share the same rules, errors, lifecycle state, and projection freshness checks.

Usage:
  knb init    [--root <dir>] [--config <path>] [--ledger <path>] [--actor <name>] [--force] [--json|--pretty|--ndjson|--text|--quiet]
  knb status  [--root <dir>] [--collection <c>] [--max-questions N] [--detailed] [--json|--pretty|--ndjson|--text|--quiet]
  knb collections [--root <dir>] [--json|--pretty|--ndjson|--text|--quiet]
  knb schema  [--json|--pretty|--ndjson|--text|--quiet]
  knb log     [--actor <a>] [--since <date>] [--until <date>] [--limit N] [--json|--pretty|--ndjson|--text|--quiet]
  knb apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dry-run]
  knb add     (--file row.json | --json '{...}' | --stdin)
  knb get     <id> [<id>...] [--as-of <iso>] [--include-history] [--explain]
  knb query   [--as-of <iso>] [--kind <kind>] [--collection <c>] [--subject <s>] [--tag <t>] [--text <q>] [--claim-key <k>] [--claim-type <t>] [--predicate <p>] [--qualifier k=v] [--external-ref system:id] [--citing <uri>] [--limit N] [--history] [--full]
  knb context [--as-of <iso>] [--collection <c>] [--subject <s>] [--tag <t>] [--claim-type <t>] [--predicate <p>] [--qualifier k=v] [--external-ref system:id] [--max-tokens 3000] [--recency-window-days N] [--no-warnings]
  knb render  (--collection <c> [--out path] | --all) [--as-of <iso>] [--format md]
  knb check   [--json]
  knb index   [--rebuild]

Commands:
  init      Create workspace config, ledger, schema, views, and indexes.
  status    Cheap orientation packet: workspace, ledger, counts, projection freshness; with --collection, latest synthesis and open questions; with --detailed, corpus-health stats.
  collections
            List active collections with active row counts and latest active row timestamp.
  schema    Print row and operation contracts plus the JSON Schema.
  log       Show recent apply run manifests from .knb/runs, optionally filtered by actor and time.
  apply     Apply an atomic batch of operations through the apply pipeline; use --dry-run to preview without writing.
  add       Convenience wrapper for one add operation; identical envelope to apply.
  get       Fetch full rows by id; default returns only active rows.
  query     Search active rows by kind, scope, text, citation, and generic structured claim fields. Use --history to include inactive.
  context   Build a token-budgeted context packet for a scope.
  render    Generate Markdown view(s) for one collection or every active collection.
  check     Report parse, validation, state warnings, and projection freshness. Exit 0 if ok, otherwise the typed error code.
  index     Without --rebuild, report freshness only. With --rebuild, regenerate all V1 indexes.

Output formats:
  --json    Compact JSON envelope (default when stdout is piped).
  --pretty  Indented JSON envelope.
  --ndjson  One JSON line per item plus a final envelope line.
  --text    Human-readable text (default when stdout is a TTY).
  --quiet   No output on success; only the error code on failure.

Exit codes:
  0  ok
  1  not_found
  2  invalid_arguments
  3  validation_failed
  4  duplicate_blocked
  5  io_failed
  6  lock_busy
  7  broken_reference
  8  external_dependency_failed
  9  unsafe_operation_refused
  10 internal_error

knb check returns the exit code matching the highest-priority issue on failure (parse errors -> io_failed,
validation errors -> validation_failed). When ok is false purely due to stale or missing projections, the
envelope is still rendered as a success with data.ok=false and the process exits 0; rebuild via knb index
--rebuild or knb render --all.
`);
}

if (import.meta.main) {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}
