// Config module - shared, explicit writes for .knb/config.json.
// Workspace resolution owns reading config at open time; this module owns
// mutation paths used by profile and instance management.

import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

import { knbError } from "./errors";
import type { KnbConfig, KnbWorkspace } from "./workspace";

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
  if (typeof config.actor === "string" && config.actor.length > 0) workspace.actor = config.actor;
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

export function configProfiles(config: KnbConfig): string[] {
  return Array.isArray(config.profiles)
    ? sortedUnique(config.profiles.filter((value): value is string => typeof value === "string" && value.length > 0))
    : [];
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
