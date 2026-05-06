import { readFile as fsReadFile } from "node:fs/promises";
import { isAbsolute, join } from "node:path";

import type { DraftRow, KnbRowKind } from "./core/contract";
import { fromUnknown, knbError, type KnbError } from "./core/errors";
import {
  ROW_KINDS,
  openKnb,
  type ApplyRequest,
  type Knb,
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
import type { RenderRequest } from "./core/projections";

type FlagValue = string | boolean | Array<string | boolean>;
type FlagMap = Map<string, FlagValue>;

const COMMANDS = new Set([
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
  "migrate",
  "profile",
  "instance",
]);

const GLOBAL_VALUE_FLAGS = new Set(["root", "config", "ledger", "instance", "actor"]);
const GLOBAL_BOOLEAN_FLAGS = new Set(["json", "pretty", "ndjson", "text", "quiet"]);
const GLOBAL_FLAGS = new Set([...GLOBAL_VALUE_FLAGS, ...GLOBAL_BOOLEAN_FLAGS]);

const COMMAND_VALUE_FLAGS: Record<string, ReadonlySet<string>> = {
  init: new Set(),
  status: new Set(),
  schema: new Set(),
  apply: new Set(["file", "json"]),
  add: new Set(["file", "json"]),
  get: new Set(["as-of"]),
  query: new Set(["as-of", "kind", "profile", "subject", "tag", "text", "claim-key", "limit"]),
  context: new Set(["as-of", "profile", "subject", "tag", "max-tokens"]),
  render: new Set(["profile", "subject", "tag", "out", "as-of", "format"]),
  check: new Set(),
  index: new Set(),
  migrate: new Set(),
  profile: new Set(["file", "json", "confirm"]),
  instance: new Set(["profile", "ledger", "schema", "views", "indexes", "confirm"]),
};

const COMMAND_BOOLEAN_FLAGS: Record<string, ReadonlySet<string>> = {
  init: new Set(["force"]),
  status: new Set(),
  schema: new Set(),
  apply: new Set(["stdin", "atomic", "dry-run"]),
  add: new Set(["stdin", "dry-run"]),
  get: new Set(["include-history", "history", "explain"]),
  query: new Set(["history", "include-history", "full"]),
  context: new Set(["no-warnings"]),
  render: new Set(),
  check: new Set(),
  index: new Set(["rebuild"]),
  migrate: new Set(["dry-run"]),
  profile: new Set(["stdin", "full", "attached", "attach"]),
  instance: new Set(["paths"]),
};

export async function runCli(args: string[], options: OutputOptions = {}): Promise<number> {
  const [command, ...rest] = args;
  const positionals: string[] = [];
  const flags = parseFlags(rest, positionals);
  const outputOptions: OutputOptions = { ...options };
  const formatFromCli = formatFromFlags(flags);
  if (formatFromCli && options.format === undefined) outputOptions.format = formatFromCli;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    await printHelp(flags);
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

  const flagError = validateKnownFlags(command, flags);
  if (flagError) {
    return renderResult(failure(command, flagError, { exit_code: 2 }), outputOptions);
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
  let activeCommand = command;

  let knb: Knb;
  try {
    const openOptions: OpenKnbOptions = {};
    const rootFlag = stringFlag(flags, "root");
    const configFlag = stringFlag(flags, "config");
    const ledgerFlag = stringFlag(flags, "ledger");
    const instanceFlag = stringFlag(flags, "instance");
    const actorFlag = stringFlag(flags, "actor");
    if (rootFlag) openOptions.root = rootFlag;
    if (configFlag) openOptions.configPath = configFlag;
    if (ledgerFlag) openOptions.ledgerPath = ledgerFlag;
    if (instanceFlag) openOptions.instanceId = instanceFlag;
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
    if (command === "profile") {
      activeCommand = positionals[0] ? `profile ${positionals[0]}` : "profile";
      return await runProfileCommand(knb, flags, positionals, outputOptions, baseMeta);
    }

    if (command === "instance") {
      activeCommand = positionals[0] ? `instance ${positionals[0]}` : "instance";
      return await runInstanceCommand(knb, flags, positionals, outputOptions, baseMeta);
    }

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

    if (command === "migrate") {
      rejectExtraPositionals("migrate", positionals);
      const result = await knb.migrate({ dryRun: booleanFlag(flags, "dry-run") });
      return renderResult(success("migrate", result, baseMeta()), outputOptions);
    }

    if (command === "status") {
      const result = await knb.status();
      return renderResult(success("status", result, baseMeta()), outputOptions);
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
      if (booleanFlag(flags, "dry-run")) {
        return renderResult(
          failure(
            "add",
            knbError("invalid_arguments", "knb add does not support --dry-run; use knb apply --dry-run"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
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
      const asOf = stringFlag(flags, "as-of");
      const format = stringFlag(flags, "format") as RenderRequest["format"] | undefined;
      const request: RenderRequest = {};
      const profile = stringFlag(flags, "profile");
      const subject = stringFlag(flags, "subject");
      const tag = stringFlag(flags, "tag");
      if (profile) request.profile = profile;
      if (subject) request.subject = subject;
      if (tag) request.tag = tag;
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
    return renderResult(failure(activeCommand, fromUnknown(error), baseMeta()), outputOptions);
  }
}

function renderResult(result: CommandResult, options: OutputOptions): number {
  return render(result, options).exitCode;
}

async function runProfileCommand(
  knb: Knb,
  flags: FlagMap,
  positionals: string[],
  outputOptions: OutputOptions,
  baseMeta: () => Record<string, unknown>,
): Promise<number> {
  const [subcommand, profileId, ...extra] = positionals;
  if (!subcommand) {
    return renderResult(
      failure(
        "profile",
        knbError("invalid_arguments", "knb profile requires a subcommand", {
          suggestions: ["knb profile list --json", "knb profile show <profile-id> --json"],
        }),
        baseMeta(),
      ),
      outputOptions,
    );
  }

  if (subcommand === "list") {
    rejectExtraPositionals("profile list", [profileId, ...extra]);
    const result = await knb.listProfiles({
      attachedOnly: booleanFlag(flags, "attached"),
      full: booleanFlag(flags, "full"),
    });
    return renderResult(success("profile list", result, baseMeta()), outputOptions);
  }

  if (subcommand === "show") {
    requireOnePositional("profile show", profileId, "profile id");
    rejectExtraPositionals("profile show", extra);
    const result = await knb.showProfile(profileId);
    return renderResult(success("profile show", result, baseMeta()), outputOptions);
  }

  if (subcommand === "create") {
    requireOnePositional("profile create", profileId, "profile id");
    rejectExtraPositionals("profile create", extra);
    const payload = await readWorkspaceJsonPayload(flags, knb.workspace.root);
    const result = await knb.createProfile(profileId, payload, { attach: booleanFlag(flags, "attach") });
    return renderResult(success("profile create", result, baseMeta()), outputOptions);
  }

  if (subcommand === "replace") {
    requireOnePositional("profile replace", profileId, "profile id");
    rejectExtraPositionals("profile replace", extra);
    const payload = await readWorkspaceJsonPayload(flags, knb.workspace.root);
    const request: { confirm?: string } = {};
    const confirm = stringFlag(flags, "confirm");
    if (confirm !== undefined) request.confirm = confirm;
    const result = await knb.replaceProfile(profileId, payload, request);
    return renderResult(success("profile replace", result, baseMeta()), outputOptions);
  }

  if (subcommand === "delete") {
    requireOnePositional("profile delete", profileId, "profile id");
    rejectExtraPositionals("profile delete", extra);
    const request: { confirm?: string } = {};
    const confirm = stringFlag(flags, "confirm");
    if (confirm !== undefined) request.confirm = confirm;
    const result = await knb.deleteProfile(profileId, request);
    return renderResult(success("profile delete", result, baseMeta()), outputOptions);
  }

  if (subcommand === "check") {
    if (extra.length > 0) rejectExtraPositionals("profile check", extra);
    const result = await knb.checkProfiles(profileId);
    return renderResult(success("profile check", result, baseMeta()), outputOptions);
  }

  return renderResult(
    failure(
      `profile ${subcommand}`,
      knbError("invalid_arguments", `Unknown profile subcommand: ${subcommand}`, {
        subcommand,
        suggestions: ["knb profile list --json", "knb profile show <profile-id> --json"],
      }),
      baseMeta(),
    ),
    outputOptions,
  );
}

async function runInstanceCommand(
  knb: Knb,
  flags: FlagMap,
  positionals: string[],
  outputOptions: OutputOptions,
  baseMeta: () => Record<string, unknown>,
): Promise<number> {
  const [subcommand, first, ...extra] = positionals;
  if (!subcommand) {
    return renderResult(
      failure(
        "instance",
        knbError("invalid_arguments", "knb instance requires a subcommand", {
          suggestions: ["knb instance show --json", "knb instance create ./research --instance-id research-main --json"],
        }),
        baseMeta(),
      ),
      outputOptions,
    );
  }

  if (subcommand === "show") {
    rejectExtraPositionals("instance show", [first, ...extra]);
    const result = await knb.showInstance();
    return renderResult(success("instance show", result, baseMeta()), outputOptions);
  }

  if (subcommand === "create") {
    requireOnePositional("instance create", first, "instance id");
    rejectExtraPositionals("instance create", extra);
    const request: NonNullable<Parameters<Knb["createInstance"]>[0]> = {};
    const profiles = stringFlags(flags, "profile");
    const actor = stringFlag(flags, "actor");
    request.instanceId = first;
    if (profiles.length > 0) request.profiles = profiles;
    if (actor !== undefined) request.actor = actor;
    const result = await knb.createInstance(request);
    return renderResult(success("instance create", result, baseMeta()), outputOptions);
  }

  if (subcommand === "list") {
    rejectExtraPositionals("instance list", [first, ...extra]);
    const request: Parameters<Knb["listInstances"]>[0] = {};
    if (booleanFlag(flags, "paths")) request.includePaths = true;
    const result = await knb.listInstances(request);
    return renderResult(success("instance list", result, baseMeta()), outputOptions);
  }

  if (subcommand === "set") {
    rejectExtraPositionals("instance set", [first, ...extra]);
    const request: Parameters<Knb["updateInstance"]>[0] = {};
    const actor = stringFlag(flags, "actor");
    const ledger = stringFlag(flags, "ledger");
    const schema = stringFlag(flags, "schema");
    const views = stringFlag(flags, "views");
    const indexes = stringFlag(flags, "indexes");
    if (actor !== undefined) request.actor = actor;
    if (ledger !== undefined) request.ledger = ledger;
    if (schema !== undefined) request.schema = schema;
    if (views !== undefined) request.views = views;
    if (indexes !== undefined) request.indexes = indexes;
    if (Object.values(request).every((value) => value === undefined)) {
      throw knbError("invalid_arguments", "knb instance set requires at least one config flag", {
        suggestions: ["knb instance set --actor agent:name --json"],
      });
    }
    const result = await knb.updateInstance(request);
    return renderResult(success("instance set", result, baseMeta()), outputOptions);
  }

  if (subcommand === "attach-profile") {
    requireOnePositional("instance attach-profile", first, "profile id");
    rejectExtraPositionals("instance attach-profile", extra);
    const result = await knb.attachInstanceProfile(first);
    return renderResult(success("instance attach-profile", result, baseMeta()), outputOptions);
  }

  if (subcommand === "detach-profile") {
    requireOnePositional("instance detach-profile", first, "profile id");
    rejectExtraPositionals("instance detach-profile", extra);
    const result = await knb.detachInstanceProfile(first);
    return renderResult(success("instance detach-profile", result, baseMeta()), outputOptions);
  }

  if (subcommand === "use") {
    requireOnePositional("instance use", first, "instance id");
    rejectExtraPositionals("instance use", extra);
    const result = await knb.setDefaultInstance(first);
    return renderResult(success("instance use", result, baseMeta()), outputOptions);
  }

  if (subcommand === "delete") {
    rejectExtraPositionals("instance delete", [first, ...extra]);
    const request: { confirm?: string } = {};
    const confirm = stringFlag(flags, "confirm");
    if (confirm !== undefined) request.confirm = confirm;
    const result = await knb.deleteInstance(request);
    return renderResult(success("instance delete", result, baseMeta()), outputOptions);
  }

  return renderResult(
    failure(
      `instance ${subcommand}`,
      knbError("invalid_arguments", `Unknown instance subcommand: ${subcommand}`, {
        subcommand,
        suggestions: ["knb instance show --json", "knb instance list --json"],
      }),
      baseMeta(),
    ),
    outputOptions,
  );
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

function validateKnownFlags(command: string, flags: FlagMap): KnbError | undefined {
  const commandValueFlags = COMMAND_VALUE_FLAGS[command] ?? new Set<string>();
  const commandBooleanFlags = COMMAND_BOOLEAN_FLAGS[command] ?? new Set<string>();
  const commandFlags = new Set([...commandValueFlags, ...commandBooleanFlags]);
  const valueFlags = new Set([...commandValueFlags, ...GLOBAL_VALUE_FLAGS]);
  const booleanFlags = new Set([...commandBooleanFlags, ...GLOBAL_BOOLEAN_FLAGS]);
  for (const key of flags.keys()) {
    if (GLOBAL_FLAGS.has(key) || commandFlags.has(key)) continue;
    return knbError("invalid_arguments", `Unknown flag for knb ${command}: --${key}`, {
      flag: `--${key}`,
      command,
    });
  }
  for (const [key, raw] of flags.entries()) {
    const values = Array.isArray(raw) ? raw : [raw];
    if (valueFlags.has(key) && booleanFlags.has(key)) continue;
    if (valueFlags.has(key)) {
      const bad = values.find((value) => typeof value !== "string" || value.length === 0);
      if (bad !== undefined) {
        return knbError("invalid_arguments", `Flag --${key} requires a value`, {
          flag: `--${key}`,
          command,
          value: String(bad),
        });
      }
      continue;
    }
    if (booleanFlags.has(key)) {
      const bad = values.find((value) => value !== true);
      if (bad !== undefined) {
        return knbError("invalid_arguments", `Flag --${key} does not accept a value`, {
          flag: `--${key}`,
          command,
          value: String(bad),
        });
      }
    }
  }
  return undefined;
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
  const profile = stringFlag(flags, "profile");
  if (profile) request.profile = profile;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const text = stringFlag(flags, "text");
  if (text) request.text = text;
  const claimKey = stringFlag(flags, "claim-key");
  if (claimKey) request.claimKey = claimKey;
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
  const profile = stringFlag(flags, "profile");
  if (profile) request.profile = profile;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const maxTokens = numberFlag(flags, "max-tokens");
  if (maxTokens !== undefined) request.maxTokens = maxTokens;
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

function stringFlags(flags: FlagMap, key: string): string[] {
  const value = flags.get(key);
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  }
  return typeof value === "string" && value.length > 0 ? [value] : [];
}

function booleanFlag(flags: FlagMap, key: string): boolean {
  const value = flags.get(key);
  if (Array.isArray(value)) return value.includes(true);
  return value === true;
}

function requireOnePositional(command: string, value: string | undefined, label: string): asserts value is string {
  if (!value) {
    throw knbError("invalid_arguments", `knb ${command} requires ${label}`, {
      suggestions: [`knb ${command} <${label.replaceAll(" ", "-")}> --json`],
    });
  }
}

function rejectExtraPositionals(command: string, values: Array<string | undefined>): void {
  const extras = values.filter((value): value is string => typeof value === "string" && value.length > 0);
  if (extras.length > 0) {
    throw knbError("invalid_arguments", `knb ${command} received unexpected positional arguments`, {
      extras,
      suggestions: [`knb ${command} --json`],
    });
  }
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

async function printHelp(flags: FlagMap): Promise<void> {
  console.log(await helpText(flags));
}

async function helpText(flags: FlagMap): Promise<string> {
  const migrationHelp = await migrationHelpText(flags);
  const migrationLine = migrationHelp.length > 0 ? `${migrationHelp}\n` : "";
  const profileHelp = await profileHelpText(flags);
  return `knb: append-only knowledge ledger
Usage: knb <cmd> [--root dir] [--json|--text|--pretty|--ndjson|--quiet]
cmds: knb init, knb migrate, knb status, knb schema, knb apply, knb add, knb get, knb query, knb context, knb render, knb check, knb index, knb profile, knb instance
profile: list|show|create|replace|delete|check
instance: show|create|list|set|use|attach-profile|detach-profile|delete
root: defaults to current directory
instance: defaults to config.default_instance, then main
${migrationLine}${profileHelp}
exit: 0 ok; 1 not_found; 2 invalid_arguments; 3 validation_failed; 4 duplicate_blocked; 5 io_failed; 6 lock_busy; 7 broken_reference; 8 external_dependency_failed; 9 unsafe_operation_refused; 10 internal_error
`;
}

async function migrationHelpText(flags: FlagMap): Promise<string> {
  try {
    const knb = await openKnb(openOptionsFromHelpFlags(flags));
    const result = await knb.migrate({ dryRun: true });
    if (!result.migration_needed) return "";
    return "migration: legacy workspace detected; run knb migrate --json";
  } catch {
    return "migration: check unavailable";
  }
}

async function profileHelpText(flags: FlagMap): Promise<string> {
  try {
    const knb = await openKnb(openOptionsFromHelpFlags(flags));
    const listed = await knb.listProfiles({ attachedOnly: true });
    if (listed.profiles.length === 0) return "profiles: none";

    const maxProfiles = 5;
    const lines: string[] = ["profiles:"];
    for (const profile of listed.profiles.slice(0, maxProfiles)) {
      const instruction = profile.defined ? await firstProfileInstruction(knb, profile.profile_id) : "missing definition";
      lines.push(`  ${profile.profile_id}: ${instruction}`);
    }
    const remaining = listed.profiles.length - maxProfiles;
    if (remaining > 0) lines.push(`  ... +${remaining} more`);
    lines.push("profile instructions: knb profile show <id> --json");
    return lines.join("\n");
  } catch {
    return "profiles: unavailable";
  }
}

function openOptionsFromHelpFlags(flags: FlagMap): OpenKnbOptions {
  const openOptions: OpenKnbOptions = {};
  const rootFlag = stringFlag(flags, "root");
  const configFlag = stringFlag(flags, "config");
  const ledgerFlag = stringFlag(flags, "ledger");
  const instanceFlag = stringFlag(flags, "instance");
  const actorFlag = stringFlag(flags, "actor");
  if (rootFlag !== undefined) openOptions.root = rootFlag;
  if (configFlag !== undefined) openOptions.configPath = configFlag;
  if (ledgerFlag !== undefined) openOptions.ledgerPath = ledgerFlag;
  if (instanceFlag !== undefined) openOptions.instanceId = instanceFlag;
  if (actorFlag !== undefined) openOptions.actor = actorFlag;
  return openOptions;
}

async function firstProfileInstruction(knb: Knb, profileId: string): Promise<string> {
  try {
    const shown = await knb.showProfile(profileId);
    const first = shown.profile.agent_instructions?.find((item) => item.trim().length > 0);
    return first ? truncateHelpLine(first, 96) : "no agent_instructions";
  } catch {
    return "unavailable";
  }
}

function truncateHelpLine(value: string, maxLength: number): string {
  const compact = value.replace(/\s+/g, " ").trim();
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 3))}...`;
}

if (import.meta.main) {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}
