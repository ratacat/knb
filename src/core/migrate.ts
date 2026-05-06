// Migration module - upgrades legacy single-instance workspace config to the
// current project registry shape without touching ledger history.

import { stat } from "node:fs/promises";
import { join, relative } from "node:path";

import {
  KNB_CONFIG_SCHEMA_VERSION,
  configProfiles,
  currentInstanceConfig,
  writeWorkspaceConfig,
} from "./config";
import { knbError } from "./errors";
import {
  DEFAULT_INSTANCE_ID,
  DEFAULT_PATHS,
  defaultPathsForInstance,
  normalizeUnderRoot,
  type KnbConfig,
  type KnbInstanceConfig,
  type KnbWorkspace,
} from "./workspace";

export type MigrationOptions = {
  dryRun?: boolean;
};

export type MigrationResult = {
  workspace_root: string;
  config_path: string;
  detected_legacy: boolean;
  already_current: boolean;
  migration_needed: boolean;
  migrated: boolean;
  dry_run: boolean;
  target_instance_id: string;
  legacy_fields: string[];
  legacy_paths: string[];
  warnings: string[];
  before_config: KnbConfig;
  after_config: KnbConfig;
  changed_paths: string[];
};

type LegacyConfig = KnbConfig & {
  instance_id?: unknown;
  ledger?: unknown;
  schema?: unknown;
  views?: unknown;
  indexes?: unknown;
  actor?: unknown;
  profiles?: unknown;
};

const LEGACY_CONFIG_FIELDS = ["instance_id", "ledger", "schema", "views", "indexes", "actor", "profiles"] as const;
const INSTANCE_ID_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;

export async function migrateWorkspace(
  workspace: KnbWorkspace,
  options: MigrationOptions = {},
): Promise<MigrationResult> {
  const config = workspace.config as LegacyConfig;
  const legacyFields = legacyConfigFields(config);
  const hasRegistry = isPlainRecord(config.instances) && Object.keys(config.instances).length > 0;
  const legacyPaths = hasRegistry ? [] : await legacyPathEvidence(workspace.root);
  const detectedLegacy = legacyFields.length > 0 || legacyPaths.length > 0;
  const alreadyCurrent = hasRegistry && legacyFields.length === 0;
  const targetInstanceId = resolveTargetInstanceId(workspace, config);
  const afterConfig = detectedLegacy ? migratedConfig(config, targetInstanceId) : workspace.config;
  const migrationNeeded = detectedLegacy && !configsEqual(workspace.config, afterConfig);
  const dryRun = options.dryRun === true;
  const warnings = migrationWarnings(workspace.root, legacyPaths);

  if (migrationNeeded && !dryRun) {
    await writeWorkspaceConfig(workspace, afterConfig);
    applyWorkspaceMigration(workspace, afterConfig, targetInstanceId);
  }

  return {
    workspace_root: workspace.root,
    config_path: workspace.paths.config,
    detected_legacy: detectedLegacy,
    already_current: alreadyCurrent,
    migration_needed: migrationNeeded,
    migrated: migrationNeeded && !dryRun,
    dry_run: dryRun,
    target_instance_id: targetInstanceId,
    legacy_fields: legacyFields,
    legacy_paths: legacyPaths,
    warnings,
    before_config: config,
    after_config: afterConfig,
    changed_paths: migrationNeeded && !dryRun ? [relativeToRoot(workspace, workspace.paths.config)] : [],
  };
}

function migratedConfig(config: LegacyConfig, targetInstanceId: string): KnbConfig {
  const {
    instance_id: _instanceId,
    ledger: _ledger,
    schema: _schema,
    views: _views,
    indexes: _indexes,
    actor: _actor,
    profiles: _profiles,
    instances: rawInstances,
    default_instance: _defaultInstance,
    schema_version: _schemaVersion,
    ...unknownTopLevel
  } = config as LegacyConfig & Record<string, unknown>;

  const instances = readInstances(rawInstances);
  const existing = instances[targetInstanceId] ?? {};
  instances[targetInstanceId] = {
    ...legacyInstanceConfig(config),
    ...existing,
  };

  return {
    ...unknownTopLevel,
    schema_version: KNB_CONFIG_SCHEMA_VERSION,
    default_instance: targetInstanceId,
    instances,
  };
}

function legacyInstanceConfig(config: LegacyConfig): KnbInstanceConfig {
  const instance: KnbInstanceConfig = {
    ledger: stringField(config, "ledger") ?? DEFAULT_PATHS.ledger,
    schema: stringField(config, "schema") ?? DEFAULT_PATHS.schema,
    views: stringField(config, "views") ?? DEFAULT_PATHS.views,
    indexes: stringField(config, "indexes") ?? DEFAULT_PATHS.indexes,
    profiles: configProfiles({ profiles: Array.isArray(config.profiles) ? config.profiles.filter(isString) : [] }),
  };
  const actor = stringField(config, "actor");
  if (actor !== undefined) instance.actor = actor;
  return instance;
}

function resolveTargetInstanceId(workspace: KnbWorkspace, config: LegacyConfig): string {
  if (workspace.instanceId !== DEFAULT_INSTANCE_ID) return workspace.instanceId;
  if (typeof config.instance_id === "string" && config.instance_id.length > 0) return validateInstanceId(config.instance_id);
  return workspace.instanceId;
}

function validateInstanceId(instanceId: string): string {
  if (!INSTANCE_ID_PATTERN.test(instanceId) || instanceId.length > 96) {
    throw knbError("invalid_arguments", `Invalid legacy instance id: ${instanceId}`, {
      instance_id: instanceId,
      rule: "Use --instance <id> to choose a valid target id like main or research.",
    });
  }
  return instanceId;
}

function legacyConfigFields(config: LegacyConfig): string[] {
  const fields: string[] = [];
  for (const field of LEGACY_CONFIG_FIELDS) {
    if ((config as Record<string, unknown>)[field] !== undefined) fields.push(field);
  }
  return fields;
}

async function legacyPathEvidence(root: string): Promise<string[]> {
  const paths = [
    DEFAULT_PATHS.ledger,
    DEFAULT_PATHS.schema,
    DEFAULT_PATHS.views,
    DEFAULT_PATHS.indexes,
    join(".knb", "ledger.lock"),
  ];
  const existing: string[] = [];
  for (const path of paths) {
    if (await pathExists(join(root, path))) existing.push(path);
  }
  return existing;
}

function migrationWarnings(root: string, legacyPaths: readonly string[]): string[] {
  if (!legacyPaths.includes(join(".knb", "ledger.lock"))) return [];
  return [`Legacy lock file left in place: ${join(root, ".knb", "ledger.lock")}`];
}

function applyWorkspaceMigration(workspace: KnbWorkspace, config: KnbConfig, targetInstanceId: string): void {
  const instance = currentInstanceConfig(config, targetInstanceId);
  const defaults = defaultPathsForInstance(targetInstanceId);
  workspace.instanceId = targetInstanceId;
  workspace.instanceConfig = instance;
  workspace.config = config;
  workspace.paths.ledger = normalizeUnderRoot(workspace.root, instance.ledger ?? defaults.ledger);
  workspace.paths.schema = normalizeUnderRoot(workspace.root, instance.schema ?? defaults.schema);
  workspace.paths.views = normalizeUnderRoot(workspace.root, instance.views ?? defaults.views);
  workspace.paths.indexes = normalizeUnderRoot(workspace.root, instance.indexes ?? defaults.indexes);
  workspace.paths.lock = join(workspace.root, ".knb", "locks", `${targetInstanceId}.lock`);
}

function readInstances(value: unknown): Record<string, KnbInstanceConfig> {
  if (!isPlainRecord(value)) return {};
  const instances: Record<string, KnbInstanceConfig> = {};
  for (const [id, instance] of Object.entries(value)) {
    if (!isPlainRecord(instance)) continue;
    instances[id] = { ...(instance as KnbInstanceConfig) };
  }
  return instances;
}

function stringField(config: LegacyConfig, field: keyof LegacyConfig): string | undefined {
  const value = config[field];
  if (value === undefined) return undefined;
  if (typeof value === "string") return value;
  throw knbError("invalid_arguments", `Legacy config field must be a string: ${String(field)}`, {
    field,
    value_type: typeof value,
  });
}

function configsEqual(left: KnbConfig, right: KnbConfig): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
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
