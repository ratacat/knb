// Instance module - lifecycle operations for filesystem-backed KNB workspaces.

import { readdir, readFile, rm, rmdir, stat } from "node:fs/promises";
import { basename, join, relative, resolve } from "node:path";

import {
  configProfiles,
  KNB_CONFIG_SCHEMA_VERSION,
  readWorkspaceConfig,
  sortedUnique,
  updateWorkspaceConfig,
} from "./config";
import { knbError, type KnbErrorCode } from "./errors";
import type { InitResult } from "./knb";
import { attachProfile, detachProfile, validateProfileId } from "./profiles";
import type { KnbConfig, KnbWorkspace } from "./workspace";

export type InstanceShowResult = {
  schema_version?: "knb.config.v1";
  instance_id?: string;
  initialized: boolean;
  workspace_root: string;
  config_path: string;
  actor: string;
  paths: {
    ledger: string;
    schema: string;
    views: string;
    indexes: string;
  };
  profiles: string[];
};

export type InstanceCreateOptions = {
  instanceId?: string;
  profiles?: string[];
  actor?: string;
};

export type InstanceCreateResult = InstanceShowResult & {
  created_paths: string[];
};

export type InstanceUpdateOptions = {
  actor?: string;
  ledger?: string;
  schema?: string;
  views?: string;
  indexes?: string;
};

export type InstanceUpdateResult = {
  config_path: string;
  config: KnbConfig;
};

export type InstanceProfileResult = {
  profile_id: string;
  attached_profiles: string[];
  changed: boolean;
  config_path: string;
};

export type InstanceDeleteResult = {
  instance_id: string;
  workspace_root: string;
  deleted_paths: string[];
};

export type InstanceListOptions = {
  under: string;
  maxDepth?: number;
};

export type InstanceSummary = {
  workspace_root: string;
  config_path: string;
  instance_id?: string;
  actor?: string;
  profiles: string[];
  ok: boolean;
  error?: string;
};

export type InstanceListResult = {
  under: string;
  instances: InstanceSummary[];
  total: number;
};

const INSTANCE_ID_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;
const DEFAULT_MAX_DEPTH = 4;

export function validateInstanceId(instanceId: string): string {
  if (!INSTANCE_ID_PATTERN.test(instanceId) || instanceId.length > 96) {
    throw withSuggestions(
      "invalid_arguments",
      `Invalid instance id: ${instanceId}`,
      { instance_id: instanceId, rule: "Use lowercase ids like research-main or trade_map.v1." },
      ["knb instance show --json", "knb instance create ./research --instance-id research-main --json"],
    );
  }
  return instanceId;
}

export async function showInstance(workspace: KnbWorkspace): Promise<InstanceShowResult> {
  const config = await readWorkspaceConfig(workspace);
  const result: InstanceShowResult = {
    initialized: await pathExists(workspace.paths.config),
    workspace_root: workspace.root,
    config_path: workspace.paths.config,
    actor: typeof config.actor === "string" && config.actor.length > 0 ? config.actor : workspace.actor,
    paths: {
      ledger: workspace.paths.ledger,
      schema: workspace.paths.schema,
      views: workspace.paths.views,
      indexes: workspace.paths.indexes,
    },
    profiles: configProfiles(config),
  };
  if (config.schema_version === KNB_CONFIG_SCHEMA_VERSION) result.schema_version = config.schema_version;
  if (typeof config.instance_id === "string") result.instance_id = config.instance_id;
  return result;
}

export async function finalizeInstanceCreate(
  workspace: KnbWorkspace,
  initResult: InitResult,
  options: InstanceCreateOptions = {},
): Promise<InstanceCreateResult> {
  const instanceId = validateInstanceId(options.instanceId ?? defaultInstanceId(workspace));
  const profiles = sortedUnique((options.profiles ?? []).map(validateProfileId));
  await updateWorkspaceConfig(workspace, (current) => {
    const next: KnbConfig = {
      ...current,
      schema_version: KNB_CONFIG_SCHEMA_VERSION,
      instance_id: instanceId,
      profiles,
    };
    if (options.actor !== undefined) next.actor = options.actor;
    return next;
  });
  const shown = await showInstance(workspace);
  return { ...shown, created_paths: initResult.created_paths };
}

export async function updateInstance(
  workspace: KnbWorkspace,
  options: InstanceUpdateOptions,
): Promise<InstanceUpdateResult> {
  const result = await updateWorkspaceConfig(workspace, (current) => {
    const next: KnbConfig = { ...current };
    if (next.schema_version === undefined) next.schema_version = KNB_CONFIG_SCHEMA_VERSION;
    if (options.actor !== undefined) next.actor = options.actor;
    if (options.ledger !== undefined) next.ledger = options.ledger;
    if (options.schema !== undefined) next.schema = options.schema;
    if (options.views !== undefined) next.views = options.views;
    if (options.indexes !== undefined) next.indexes = options.indexes;
    return next;
  });
  return { config_path: result.relative_path, config: result.config };
}

export async function attachInstanceProfile(
  workspace: KnbWorkspace,
  profileId: string,
): Promise<InstanceProfileResult> {
  const result = await attachProfile(workspace, profileId);
  return {
    profile_id: result.profile_id,
    attached_profiles: result.attached_profiles,
    changed: result.attached_changed,
    config_path: result.config_path,
  };
}

export async function detachInstanceProfile(
  workspace: KnbWorkspace,
  profileId: string,
): Promise<InstanceProfileResult> {
  const result = await detachProfile(workspace, profileId);
  return {
    profile_id: result.profile_id,
    attached_profiles: result.attached_profiles,
    changed: result.detached,
    config_path: result.config_path,
  };
}

export async function deleteInstance(
  workspace: KnbWorkspace,
  options: { confirm?: string },
): Promise<InstanceDeleteResult> {
  const config = await readWorkspaceConfig(workspace);
  if (typeof config.instance_id !== "string" || config.instance_id.length === 0) {
    throw withSuggestions(
      "unsafe_operation_refused",
      "instance delete requires a configured instance_id",
      { config_path: workspace.paths.config },
      ["knb instance show --json", "knb instance set --json"],
    );
  }
  if (options.confirm !== config.instance_id) {
    throw withSuggestions(
      "unsafe_operation_refused",
      `instance delete requires --confirm ${config.instance_id}`,
      { instance_id: config.instance_id, confirm: options.confirm },
      [`knb instance delete --root ${workspace.root} --confirm ${config.instance_id} --json`],
    );
  }
  const ledgerSize = await fileSize(workspace.paths.ledger);
  if (ledgerSize > 0) {
    throw withSuggestions(
      "unsafe_operation_refused",
      "instance delete refuses to remove a non-empty ledger",
      { ledger: workspace.paths.ledger, bytes: ledgerSize },
      ["knb status --json", "Create a fresh instance instead of deleting ledger history."],
    );
  }

  const targets = [
    join(workspace.root, ".knb", "profiles"),
    workspace.paths.config,
    workspace.paths.lock,
    workspace.paths.ledger,
    workspace.paths.schema,
    workspace.paths.views,
    workspace.paths.indexes,
  ];
  const deleted: string[] = [];
  for (const target of targets) {
    if (!(await pathExists(target))) continue;
    await rm(target, { recursive: true, force: true });
    deleted.push(relativeToRoot(workspace, target));
  }
  await rmdir(join(workspace.root, ".knb")).catch((error) => {
    if (!isDirectoryNotEmpty(error) && !isMissing(error)) throw error;
  });
  await rmdir(join(workspace.root, "knb")).catch((error) => {
    if (!isDirectoryNotEmpty(error) && !isMissing(error)) throw error;
  });

  return {
    instance_id: config.instance_id,
    workspace_root: workspace.root,
    deleted_paths: deleted,
  };
}

export async function listInstances(options: InstanceListOptions): Promise<InstanceListResult> {
  const under = resolve(options.under);
  const maxDepth = options.maxDepth ?? DEFAULT_MAX_DEPTH;
  if (!Number.isInteger(maxDepth) || maxDepth < 0) {
    throw knbError("invalid_arguments", "instance list --max-depth must be a non-negative integer", {
      max_depth: maxDepth,
    });
  }
  const instances: InstanceSummary[] = [];
  await scanForInstances(under, under, maxDepth, instances);
  instances.sort((a, b) => a.workspace_root.localeCompare(b.workspace_root));
  return { under, instances, total: instances.length };
}

function defaultInstanceId(workspace: KnbWorkspace): string {
  const base = basename(workspace.root)
    .toLowerCase()
    .replace(/[^a-z0-9_.-]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/[^a-z0-9]+$/g, "");
  return base.length > 0 && INSTANCE_ID_PATTERN.test(base) ? base : "knb-instance";
}

async function scanForInstances(
  root: string,
  current: string,
  remainingDepth: number,
  instances: InstanceSummary[],
): Promise<void> {
  const configPath = join(current, ".knb", "config.json");
  if (await pathExists(configPath)) {
    instances.push(await readInstanceSummary(current, configPath));
  }
  if (remainingDepth <= 0) return;

  let entries;
  try {
    entries = await readdir(current, { withFileTypes: true });
  } catch (error) {
    if (current === root) {
      throw knbError("io_failed", `Failed to read directory: ${current}`, { path: current }, error);
    }
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name === ".git" || entry.name === "node_modules" || entry.name === ".knb" || entry.name === "knb") continue;
    await scanForInstances(root, join(current, entry.name), remainingDepth - 1, instances);
  }
}

async function readInstanceSummary(workspaceRoot: string, configPath: string): Promise<InstanceSummary> {
  try {
    const raw = await readFile(configPath, "utf8");
    const parsed = raw.trim().length === 0 ? {} : JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        workspace_root: workspaceRoot,
        config_path: configPath,
        profiles: [],
        ok: false,
        error: "config must be a JSON object",
      };
    }
    const config = parsed as KnbConfig;
    const summary: InstanceSummary = {
      workspace_root: workspaceRoot,
      config_path: configPath,
      profiles: configProfiles(config),
      ok: true,
    };
    if (typeof config.actor === "string") summary.actor = config.actor;
    if (typeof config.instance_id === "string") summary.instance_id = config.instance_id;
    return summary;
  } catch (error) {
    return {
      workspace_root: workspaceRoot,
      config_path: configPath,
      profiles: [],
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function fileSize(path: string): Promise<number> {
  try {
    const info = await stat(path);
    return info.size;
  } catch (error) {
    if (isMissing(error)) return 0;
    throw error;
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function relativeToRoot(workspace: KnbWorkspace, path: string): string {
  const rel = relative(workspace.root, path);
  return rel.length > 0 ? rel : ".";
}

function withSuggestions(
  code: KnbErrorCode,
  message: string,
  details: Record<string, unknown>,
  suggestions: string[],
) {
  return knbError(code, message, { ...details, suggestions });
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

function isDirectoryNotEmpty(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOTEMPTY" || code === "EEXIST";
}
