// Instance module - lifecycle operations for filesystem-backed KNB workspaces.

import { rm, rmdir, stat } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  configProfiles,
  currentInstanceConfig,
  KNB_CONFIG_SCHEMA_VERSION,
  readWorkspaceConfig,
  sortedUnique,
  updateConfigInstance,
  updateWorkspaceConfig,
} from "./config";
import { knbError, type KnbErrorCode } from "./errors";
import type { InitResult } from "./knb";
import { attachProfile, detachProfile, validateProfileId } from "./profiles";
import type { KnbConfig, KnbInstanceConfig, KnbWorkspace } from "./workspace";

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

export type InstanceDefaultResult = {
  default_instance: string;
  changed: boolean;
  config_path: string;
};

export type InstanceDeleteResult = {
  instance_id: string;
  workspace_root: string;
  deleted_paths: string[];
};

export type InstanceListOptions = {
  includePaths?: boolean;
};

export type InstanceSummary = {
  workspace_root: string;
  config_path: string;
  instance_id: string;
  actor?: string;
  profiles: string[];
  default: boolean;
  ok: boolean;
  error?: string;
  paths?: {
    ledger: string;
    schema: string;
    views: string;
    indexes: string;
  };
};

export type InstanceListResult = {
  instances: InstanceSummary[];
  total: number;
  default_instance?: string;
};

const INSTANCE_ID_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;

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
  const instanceConfig = currentInstanceConfig(config, workspace.instanceId);
  const result: InstanceShowResult = {
    initialized: Boolean(config.instances?.[workspace.instanceId]),
    workspace_root: workspace.root,
    config_path: workspace.paths.config,
    actor: typeof instanceConfig.actor === "string" && instanceConfig.actor.length > 0 ? instanceConfig.actor : workspace.actor,
    paths: {
      ledger: workspace.paths.ledger,
      schema: workspace.paths.schema,
      views: workspace.paths.views,
      indexes: workspace.paths.indexes,
    },
    profiles: configProfiles(instanceConfig),
  };
  if (config.schema_version === KNB_CONFIG_SCHEMA_VERSION) result.schema_version = config.schema_version;
  result.instance_id = workspace.instanceId;
  return result;
}

export async function finalizeInstanceCreate(
  workspace: KnbWorkspace,
  initResult: InitResult,
  options: InstanceCreateOptions = {},
): Promise<InstanceCreateResult> {
  const profiles = sortedUnique((options.profiles ?? []).map(validateProfileId));
  await updateWorkspaceConfig(workspace, (current) => {
    const next = updateConfigInstance(current, workspace.instanceId, (instance) => {
      const updated: KnbInstanceConfig = {
        ...instance,
        ledger: relativeToRoot(workspace, workspace.paths.ledger),
        schema: relativeToRoot(workspace, workspace.paths.schema),
        views: relativeToRoot(workspace, workspace.paths.views),
        indexes: relativeToRoot(workspace, workspace.paths.indexes),
        profiles,
      };
      if (options.actor !== undefined) updated.actor = options.actor;
      return updated;
    });
    return withConfigHeader(next, current.default_instance ?? workspace.instanceId);
  });
  const shown = await showInstance(workspace);
  return { ...shown, created_paths: initResult.created_paths };
}

export async function updateInstance(
  workspace: KnbWorkspace,
  options: InstanceUpdateOptions,
): Promise<InstanceUpdateResult> {
  const result = await updateWorkspaceConfig(workspace, (current) => {
    const next = updateConfigInstance(current, workspace.instanceId, (instance) => {
      const updated: KnbInstanceConfig = { ...instance };
      if (options.actor !== undefined) updated.actor = options.actor;
      if (options.ledger !== undefined) updated.ledger = options.ledger;
      if (options.schema !== undefined) updated.schema = options.schema;
      if (options.views !== undefined) updated.views = options.views;
      if (options.indexes !== undefined) updated.indexes = options.indexes;
      return updated;
    });
    return withConfigHeader(next, current.default_instance ?? workspace.instanceId);
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

export async function setDefaultInstance(
  workspace: KnbWorkspace,
  instanceId: string,
): Promise<InstanceDefaultResult> {
  const normalizedId = validateInstanceId(instanceId);
  let changed = false;
  const result = await updateWorkspaceConfig(workspace, (current) => {
    if (!current.instances?.[normalizedId]) {
      throw withSuggestions(
        "not_found",
        `Instance not found: ${normalizedId}`,
        { instance_id: normalizedId },
        [`knb instance create ${normalizedId} --json`, "knb instance list --json"],
      );
    }
    changed = current.default_instance !== normalizedId;
    return {
      ...current,
      schema_version: KNB_CONFIG_SCHEMA_VERSION,
      default_instance: normalizedId,
    };
  });
  return {
    default_instance: normalizedId,
    changed,
    config_path: result.relative_path,
  };
}

export async function deleteInstance(
  workspace: KnbWorkspace,
  options: { confirm?: string },
): Promise<InstanceDeleteResult> {
  const config = await readWorkspaceConfig(workspace);
  if (!config.instances?.[workspace.instanceId]) {
    throw withSuggestions(
      "unsafe_operation_refused",
      "instance delete requires a configured instance",
      { config_path: workspace.paths.config, instance_id: workspace.instanceId },
      ["knb instance show --json", "knb instance list --json"],
    );
  }
  if (options.confirm !== workspace.instanceId) {
    throw withSuggestions(
      "unsafe_operation_refused",
      `instance delete requires --confirm ${workspace.instanceId}`,
      { instance_id: workspace.instanceId, confirm: options.confirm },
      [`knb instance delete --instance ${workspace.instanceId} --confirm ${workspace.instanceId} --json`],
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
  await updateWorkspaceConfig(workspace, (current) => {
    const instances = { ...(current.instances ?? {}) };
    delete instances[workspace.instanceId];
    const remainingIds = Object.keys(instances).sort((a, b) => a.localeCompare(b));
    const next: KnbConfig = {
      ...current,
      schema_version: KNB_CONFIG_SCHEMA_VERSION,
      instances,
    };
    if (current.default_instance === workspace.instanceId) {
      if (remainingIds[0] !== undefined) next.default_instance = remainingIds[0];
      else delete next.default_instance;
    }
    return next;
  });

  return {
    instance_id: workspace.instanceId,
    workspace_root: workspace.root,
    deleted_paths: deleted,
  };
}

export async function listInstances(
  workspace: KnbWorkspace,
  options: InstanceListOptions = {},
): Promise<InstanceListResult> {
  const config = await readWorkspaceConfig(workspace);
  const ids = Object.keys(config.instances ?? {}).sort((a, b) => a.localeCompare(b));
  const instances = ids.map((instanceId): InstanceSummary => {
    const instance = config.instances?.[instanceId] ?? {};
    const summary: InstanceSummary = {
      workspace_root: workspace.root,
      config_path: workspace.paths.config,
      instance_id: instanceId,
      profiles: configProfiles(instance),
      default: config.default_instance === instanceId,
      ok: true,
    };
    if (instance.actor !== undefined) summary.actor = instance.actor;
    if (options.includePaths === true) {
      summary.paths = {
        ledger: instance.ledger ?? "",
        schema: instance.schema ?? "",
        views: instance.views ?? "",
        indexes: instance.indexes ?? "",
      };
    }
    return summary;
  });
  const result: InstanceListResult = { instances, total: instances.length };
  if (config.default_instance !== undefined) result.default_instance = config.default_instance;
  return result;
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

function withConfigHeader(config: KnbConfig, defaultInstance: string): KnbConfig {
  return {
    ...config,
    schema_version: KNB_CONFIG_SCHEMA_VERSION,
    default_instance: defaultInstance,
  };
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
