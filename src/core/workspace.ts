// Workspace module - V1 root, config, actor, and path resolution.
// Every command crosses this seam first. The opened workspace travels through
// every library call so paths and actor are not recomputed downstream.

import { readFile as fsReadFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { isAbsolute, join, normalize, resolve } from "node:path";
import { execFile } from "node:child_process";

import { knbError } from "./errors";

export type KnbConfig = {
  schema_version?: "knb.config.v1";
  default_instance?: string;
  instances?: Record<string, KnbInstanceConfig>;
  profiles?: string[];
};

export type KnbInstanceConfig = {
  ledger?: string;
  schema?: string;
  views?: string;
  indexes?: string;
  actor?: string;
  profiles?: string[];
};

export type KnbWorkspace = {
  root: string;
  configPath?: string;
  config: KnbConfig;
  instanceId: string;
  instanceConfig: KnbInstanceConfig;
  paths: {
    ledger: string;
    schema: string;
    views: string;
    indexes: string;
    lock: string;
    config: string;
  };
  actor: string;
};

export type ExecResult = { stdout: string; status: number };

export type OpenWorkspaceOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  instanceId?: string;
  actor?: string;
  env?: NodeJS.ProcessEnv;
  cwd?: () => string;
  readFile?: (path: string) => Promise<string>;
  exec?: (cmd: string, args: string[]) => Promise<ExecResult | undefined>;
  systemUser?: () => string | undefined;
};

export const DEFAULT_INSTANCE_ID = "main";

export const DEFAULT_PATHS = {
  ledger: join("knb", "ledger.jsonl"),
  schema: join("knb", "schema.json"),
  views: join("knb", "views"),
  indexes: join("knb", "indexes"),
  config: join(".knb", "config.json"),
} as const;
const INSTANCE_ID_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;

export async function openWorkspace(options: OpenWorkspaceOptions = {}): Promise<KnbWorkspace> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? (() => process.cwd());
  const readFile = options.readFile ?? defaultReadFile;
  const exec = options.exec ?? defaultExec;
  const systemUser = options.systemUser ?? defaultSystemUser;

  const root = resolveRoot(options.root, cwd);
  const configPath = await resolveConfigPath(root, options.configPath, env, readFile);
  const config = await loadConfig(configPath, readFile);
  const instanceId = resolveInstanceId(options.instanceId, env, config);
  const instanceConfig = config.instances?.[instanceId] ?? {};
  const defaultPaths = defaultPathsForInstance(instanceId);

  const ledgerSource = options.ledgerPath ?? instanceConfig.ledger ?? defaultPaths.ledger;
  const schemaSource = instanceConfig.schema ?? defaultPaths.schema;
  const viewsSource = instanceConfig.views ?? defaultPaths.views;
  const indexesSource = instanceConfig.indexes ?? defaultPaths.indexes;

  const paths = {
    ledger: normalizeUnderRoot(root, ledgerSource),
    schema: normalizeUnderRoot(root, schemaSource),
    views: normalizeUnderRoot(root, viewsSource),
    indexes: normalizeUnderRoot(root, indexesSource),
    lock: join(root, ".knb", "locks", `${instanceId}.lock`),
    config: configPath ?? join(root, DEFAULT_PATHS.config),
  };

  const actor = await resolveActor(options.actor, env, exec, systemUser, instanceConfig);

  const workspace: KnbWorkspace = { root, config, instanceId, instanceConfig, paths, actor };
  if (configPath !== undefined) workspace.configPath = configPath;
  return workspace;
}

function resolveRoot(
  explicit: string | undefined,
  cwd: () => string,
): string {
  if (explicit) return resolve(explicit);
  return resolve(cwd());
}

async function resolveConfigPath(
  root: string,
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
  readFile: (path: string) => Promise<string>,
): Promise<string | undefined> {
  if (explicit) return resolve(explicit);
  const fromEnv = env.KNB_CONFIG;
  if (fromEnv && fromEnv.length > 0) return resolve(fromEnv);
  const defaultPath = join(root, DEFAULT_PATHS.config);
  if (await exists(defaultPath, readFile)) return defaultPath;
  return undefined;
}

async function loadConfig(
  configPath: string | undefined,
  readFile: (path: string) => Promise<string>,
): Promise<KnbConfig> {
  if (!configPath) return {};
  let raw: string;
  try {
    raw = await readFile(configPath);
  } catch (error) {
    if (isMissing(error)) return {};
    throw knbError("io_failed", `Failed to read config: ${configPath}`, { path: configPath }, error);
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw knbError("io_failed", `Config must be a JSON object: ${configPath}`, { path: configPath });
    }
    return parsed as KnbConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw knbError(
        "io_failed",
        `Failed to parse config JSON: ${configPath}`,
        { path: configPath },
        error,
      );
    }
    throw error;
  }
}

function resolveInstanceId(
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
  config: KnbConfig,
): string {
  const candidate =
    nonEmpty(explicit) ??
    nonEmpty(env.KNB_INSTANCE) ??
    nonEmpty(config.default_instance) ??
    DEFAULT_INSTANCE_ID;
  if (!INSTANCE_ID_PATTERN.test(candidate) || candidate.length > 96) {
    throw knbError("invalid_arguments", `Invalid instance id: ${candidate}`, {
      instance_id: candidate,
      rule: "Use lowercase ids like main, research, or trade_map.v1.",
    });
  }
  return candidate;
}

export function defaultPathsForInstance(instanceId: string): {
  ledger: string;
  schema: string;
  views: string;
  indexes: string;
} {
  if (instanceId === DEFAULT_INSTANCE_ID) return DEFAULT_PATHS;
  const base = join("knb", "instances", instanceId);
  return {
    ledger: join(base, "ledger.jsonl"),
    schema: join(base, "schema.json"),
    views: join(base, "views"),
    indexes: join(base, "indexes"),
  };
}

async function resolveActor(
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
  exec: (cmd: string, args: string[]) => Promise<ExecResult | undefined>,
  systemUser: () => string | undefined,
  instanceConfig: KnbInstanceConfig,
): Promise<string> {
  if (explicit && explicit.length > 0) return explicit;
  const fromEnv = env.KNB_ACTOR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromConfig = instanceConfig.actor;
  if (fromConfig && fromConfig.length > 0) return fromConfig;
  const email = await runGit(exec, ["config", "user.email"]);
  if (email) return email;
  const name = await runGit(exec, ["config", "user.name"]);
  if (name) return name;
  const sys = systemUser();
  if (sys && sys.length > 0) return sys;
  return "unknown";
}

async function runGit(
  exec: (cmd: string, args: string[]) => Promise<ExecResult | undefined>,
  args: string[],
): Promise<string | undefined> {
  try {
    const result = await exec("git", args);
    if (!result || result.status !== 0) return undefined;
    const trimmed = result.stdout.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

export function normalizeUnderRoot(root: string, value: string): string {
  if (isAbsolute(value)) return normalize(value);
  return normalize(join(root, value));
}

function nonEmpty(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

async function exists(path: string, readFile: (path: string) => Promise<string>): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    return false;
  }
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

async function defaultReadFile(path: string): Promise<string> {
  return fsReadFile(path, "utf8");
}

async function defaultExec(cmd: string, args: string[]): Promise<ExecResult | undefined> {
  return new Promise((resolvePromise) => {
    execFile(cmd, args, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        const status = typeof (error as { code?: unknown }).code === "number" ? Number((error as { code?: unknown }).code) : 1;
        resolvePromise({ stdout: stdout ?? "", status });
        return;
      }
      resolvePromise({ stdout: stdout ?? "", status: 0 });
    });
  });
}

function defaultSystemUser(): string | undefined {
  try {
    const info = userInfo();
    return info.username && info.username.length > 0 ? info.username : undefined;
  } catch {
    return undefined;
  }
}
