// Config module - shared, explicit writes for .knb/config.json.
// Workspace resolution owns reading config at open time; this module owns
// mutation paths used by profile and instance management.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

import { knbError } from "./errors";
import type { KnbConfig, KnbInstanceConfig, KnbWorkspace } from "./workspace";

export const KNB_CONFIG_SCHEMA_VERSION = "knb.config.v1" as const;

export type ConfigWriteResult = {
  config_path: string;
  relative_path: string;
  config: KnbConfig;
};

export async function readWorkspaceConfig(workspace: KnbWorkspace): Promise<KnbConfig> {
  try {
    const raw = await readFile(workspace.paths.config, "utf8");
    if (raw.trim().length === 0) return {};
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw knbError("io_failed", `Config must be a JSON object: ${workspace.paths.config}`, {
        path: workspace.paths.config,
      });
    }
    return parsed as KnbConfig;
  } catch (error) {
    if (isMissing(error)) return {};
    if (error instanceof SyntaxError) {
      throw knbError(
        "io_failed",
        `Failed to parse config JSON: ${workspace.paths.config}`,
        { path: workspace.paths.config },
        error,
      );
    }
    throw error;
  }
}

export async function writeWorkspaceConfig(
  workspace: KnbWorkspace,
  config: KnbConfig,
): Promise<ConfigWriteResult> {
  await mkdir(dirname(workspace.paths.config), { recursive: true });
  await writeFile(workspace.paths.config, `${JSON.stringify(config, null, 2)}\n`, "utf8");
  workspace.config = config;
  workspace.instanceConfig = currentInstanceConfig(config, workspace.instanceId);
  if (typeof workspace.instanceConfig.actor === "string" && workspace.instanceConfig.actor.length > 0) {
    workspace.actor = workspace.instanceConfig.actor;
  }
  if (workspace.configPath === undefined) workspace.configPath = workspace.paths.config;
  return {
    config_path: workspace.paths.config,
    relative_path: relativeToRoot(workspace, workspace.paths.config),
    config,
  };
}

export async function updateWorkspaceConfig(
  workspace: KnbWorkspace,
  update: (config: KnbConfig) => KnbConfig,
): Promise<ConfigWriteResult> {
  const current = await readWorkspaceConfig(workspace);
  return writeWorkspaceConfig(workspace, update(current));
}

export function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

export function currentInstanceConfig(config: KnbConfig, instanceId: string): KnbInstanceConfig {
  return config.instances?.[instanceId] ?? {};
}

export function configProfiles(config: KnbInstanceConfig): string[] {
  return Array.isArray(config.profiles)
    ? sortedUnique(config.profiles.filter((value): value is string => typeof value === "string" && value.length > 0))
    : [];
}

export function configProfilesForInstance(config: KnbConfig, instanceId: string): string[] {
  const instanceProfiles = configProfiles(currentInstanceConfig(config, instanceId));
  return instanceProfiles.length > 0 ? instanceProfiles : configProfiles(config);
}

export function updateConfigInstance(
  config: KnbConfig,
  instanceId: string,
  update: (instance: KnbInstanceConfig) => KnbInstanceConfig,
): KnbConfig {
  const instances = { ...(config.instances ?? {}) };
  instances[instanceId] = update({ ...(instances[instanceId] ?? {}) });
  return { ...config, instances };
}

function relativeToRoot(workspace: KnbWorkspace, path: string): string {
  const rel = relative(workspace.root, path);
  return rel.length > 0 ? rel : ".";
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}
