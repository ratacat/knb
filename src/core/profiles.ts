// Profile module - local profile definitions layered on a KNB instance.
// Profiles are rules/vocab packages; row membership still lives in scope.profiles.

import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

import {
  configProfiles,
  configProfilesForInstance,
  KNB_CONFIG_SCHEMA_VERSION,
  readWorkspaceConfig,
  sortedUnique,
  updateConfigInstance,
  updateWorkspaceConfig,
} from "./config";
import { ROW_KINDS } from "./contract";
import { knbError, type KnbErrorCode } from "./errors";
import { loadLedger } from "./ledger";
import type { KnbWorkspace } from "./workspace";

export const KNB_PROFILE_SCHEMA_VERSION = "knb.profile.v1" as const;

export type ProfileRecordType = {
  type: string;
  description?: string;
  required_fields?: string[];
  [key: string]: unknown;
};

export type ProfileLinkType = {
  rel: string;
  description?: string;
  from?: string[];
  to?: string[];
  [key: string]: unknown;
};

export type ProfileDefinition = {
  schema_version: typeof KNB_PROFILE_SCHEMA_VERSION;
  profile_id: string;
  display_name?: string;
  description?: string;
  extends?: string[];
  record_types?: ProfileRecordType[];
  link_types?: ProfileLinkType[];
  required_fields?: string[];
  agent_instructions?: string[];
  metadata?: Record<string, unknown>;
};

export type ProfileSummary = {
  profile_id: string;
  defined: boolean;
  attached: boolean;
  display_name?: string;
  description?: string;
  path?: string;
};

export type ProfileListOptions = {
  attachedOnly?: boolean;
  full?: boolean;
};

export type ProfileListResult = {
  profiles: ProfileSummary[];
  total: number;
  defined_count: number;
  attached_count: number;
};

export type ProfileShowResult = {
  profile: ProfileDefinition;
  attached: boolean;
  path: string;
};

export type ProfileWriteResult = ProfileShowResult & {
  created: boolean;
  attached_changed: boolean;
  config_path?: string;
};

export type ProfileDeleteResult = {
  profile_id: string;
  deleted_path: string;
  detached: boolean;
  remaining_attached_profiles: string[];
};

export type ProfileIssue = {
  level: "error" | "warning";
  code: string;
  message: string;
  profile_id?: string;
  path?: string;
};

export type ProfileCheckResult = {
  ok: boolean;
  issues: ProfileIssue[];
  profiles_checked: number;
  attached_missing: string[];
};

export type ProfileLinkRelMap = Record<string, string[]>;

const PROFILE_DIR = join(".knb", "profiles");
const PROFILE_ID_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;
const TOKEN_PATTERN = /^[a-z][a-z0-9_]*(?:[.-][a-z0-9_]+)*$/;
const RESERVED_PROFILE_IDS = new Set([
  "knb",
  "profile",
  "profiles",
  "instance",
  "instances",
  "ledger",
  "schema",
  "index",
  "indexes",
  "view",
  "views",
  ...ROW_KINDS,
]);

export function validateProfileId(profileId: string): string {
  if (!PROFILE_ID_PATTERN.test(profileId) || RESERVED_PROFILE_IDS.has(profileId) || profileId.length > 96) {
    throw withSuggestions(
      "invalid_arguments",
      `Invalid profile id: ${profileId}`,
      {
        profile_id: profileId,
        rule: "Use lowercase ids like research.v1 or trade_map.v1; avoid reserved row/command names.",
      },
      ["knb profile list --json", "knb profile create research.v1 --stdin --json"],
    );
  }
  return profileId;
}

export async function listProfiles(
  workspace: KnbWorkspace,
  options: ProfileListOptions = {},
): Promise<ProfileListResult> {
  const attached = new Set(configProfilesForInstance(await readWorkspaceConfig(workspace), workspace.instanceId));
  const definitions = await readProfileDefinitions(workspace);
  const byId = new Map<string, ProfileSummary>();

  for (const item of definitions) {
    if (item.issue) continue;
    const summary: ProfileSummary = {
      profile_id: item.profile.profile_id,
      defined: true,
      attached: attached.has(item.profile.profile_id),
    };
    if (item.profile.display_name !== undefined) summary.display_name = item.profile.display_name;
    if (item.profile.description !== undefined) summary.description = item.profile.description;
    if (options.full === true) summary.path = item.path;
    byId.set(summary.profile_id, summary);
  }

  for (const profileId of attached) {
    const existing = byId.get(profileId);
    if (existing) {
      existing.attached = true;
      continue;
    }
    byId.set(profileId, { profile_id: profileId, defined: false, attached: true });
  }

  const profiles = [...byId.values()]
    .filter((summary) => options.attachedOnly !== true || summary.attached)
    .sort((a, b) => a.profile_id.localeCompare(b.profile_id));

  return {
    profiles,
    total: profiles.length,
    defined_count: profiles.filter((profile) => profile.defined).length,
    attached_count: profiles.filter((profile) => profile.attached).length,
  };
}

export async function showProfile(workspace: KnbWorkspace, profileId: string): Promise<ProfileShowResult> {
  const normalizedId = validateProfileId(profileId);
  const read = await readProfileDefinition(workspace, normalizedId);
  if (!read) {
    throw withSuggestions(
      "not_found",
      `Profile not found: ${normalizedId}`,
      { profile_id: normalizedId },
      ["knb profile list --json", `knb profile create ${normalizedId} --stdin --json`],
    );
  }
  const attached = configProfilesForInstance(await readWorkspaceConfig(workspace), workspace.instanceId).includes(normalizedId);
  return { profile: read.profile, attached, path: read.path };
}

export async function createProfile(
  workspace: KnbWorkspace,
  profileId: string,
  input: unknown,
  options: { attach?: boolean } = {},
): Promise<ProfileWriteResult> {
  const normalizedId = validateProfileId(profileId);
  const path = profilePath(workspace, normalizedId);
  if (await pathExists(path)) {
    throw withSuggestions(
      "duplicate_blocked",
      `Profile already exists: ${normalizedId}`,
      { profile_id: normalizedId, path },
      [`knb profile replace ${normalizedId} --confirm ${normalizedId} --stdin --json`, `knb profile show ${normalizedId} --json`],
    );
  }
  const profile = normalizeProfileDefinition(normalizedId, input);
  await writeProfileDefinition(workspace, profile);
  let attachedChanged = false;
  let configPath: string | undefined;
  if (options.attach === true) {
    const result = await attachProfile(workspace, normalizedId);
    attachedChanged = result.attached_changed;
    configPath = result.config_path;
  }
  const output: ProfileWriteResult = {
    profile,
    attached: options.attach === true,
    path: relativeToRoot(workspace, path),
    created: true,
    attached_changed: attachedChanged,
  };
  if (configPath !== undefined) output.config_path = configPath;
  return output;
}

export async function replaceProfile(
  workspace: KnbWorkspace,
  profileId: string,
  input: unknown,
  options: { confirm?: string },
): Promise<ProfileWriteResult> {
  const normalizedId = validateProfileId(profileId);
  requireConfirm(normalizedId, options.confirm, "profile replace");
  const path = profilePath(workspace, normalizedId);
  if (!(await pathExists(path))) {
    throw withSuggestions(
      "not_found",
      `Profile not found: ${normalizedId}`,
      { profile_id: normalizedId },
      [`knb profile create ${normalizedId} --stdin --json`, "knb profile list --json"],
    );
  }
  const profile = normalizeProfileDefinition(normalizedId, input);
  await writeProfileDefinition(workspace, profile);
  const attached = configProfilesForInstance(await readWorkspaceConfig(workspace), workspace.instanceId).includes(normalizedId);
  return {
    profile,
    attached,
    path: relativeToRoot(workspace, path),
    created: false,
    attached_changed: false,
  };
}

export async function deleteProfile(
  workspace: KnbWorkspace,
  profileId: string,
  options: { confirm?: string },
): Promise<ProfileDeleteResult> {
  const normalizedId = validateProfileId(profileId);
  requireConfirm(normalizedId, options.confirm, "profile delete");
  const read = await readProfileDefinition(workspace, normalizedId);
  if (!read) {
    throw withSuggestions(
      "not_found",
      `Profile not found: ${normalizedId}`,
      { profile_id: normalizedId },
      ["knb profile list --json"],
    );
  }

  const references = await countLedgerProfileReferences(workspace, normalizedId);
  if (references > 0) {
    throw withSuggestions(
      "unsafe_operation_refused",
      `Profile ${normalizedId} is still referenced by ${references} ledger row(s)`,
      { profile_id: normalizedId, referenced_rows: references },
      [`knb query --profile ${normalizedId} --history --json`, `knb profile replace ${normalizedId} --confirm ${normalizedId} --stdin --json`],
    );
  }

  await rm(profilePath(workspace, normalizedId), { force: true });
  const config = await updateWorkspaceConfig(workspace, (current) => {
    const next = updateConfigInstance(current, workspace.instanceId, (instance) => ({
      ...instance,
      profiles: configProfiles(instance).filter((value) => value !== normalizedId),
    }));
    return withConfigHeader(next, workspace.instanceId);
  });
  return {
    profile_id: normalizedId,
    deleted_path: read.path,
    detached: true,
    remaining_attached_profiles: configProfilesForInstance(config.config, workspace.instanceId),
  };
}

export async function checkProfiles(
  workspace: KnbWorkspace,
  profileId?: string,
): Promise<ProfileCheckResult> {
  const issues: ProfileIssue[] = [];
  const attached = configProfilesForInstance(await readWorkspaceConfig(workspace), workspace.instanceId);
  for (const attachedId of attached) {
    if (!PROFILE_ID_PATTERN.test(attachedId)) {
      issues.push({
        level: "error",
        code: "profile_id_invalid",
        message: `Attached profile id is invalid: ${attachedId}`,
        profile_id: attachedId,
      });
    }
  }

  const definitions = await readProfileDefinitions(workspace);
  const defined = new Set<string>();
  for (const item of definitions) {
    if (profileId !== undefined && item.profileId !== profileId) continue;
    if (item.issue) {
      issues.push(item.issue);
      continue;
    }
    defined.add(item.profile.profile_id);
  }

  if (profileId !== undefined) {
    const normalized = validateProfileId(profileId);
    if (!defined.has(normalized) && !definitions.some((item) => item.profileId === normalized)) {
      issues.push({
        level: "error",
        code: "profile_not_found",
        message: `Profile not found: ${normalized}`,
        profile_id: normalized,
      });
    }
  }

  const attachedMissing = attached.filter((id) => !defined.has(id));
  for (const missing of attachedMissing) {
    if (profileId !== undefined && missing !== profileId) continue;
    issues.push({
      level: "warning",
      code: "attached_profile_missing_definition",
      message: `Attached profile has no local definition: ${missing}`,
      profile_id: missing,
    });
  }

  return {
    ok: issues.every((issue) => issue.level !== "error"),
    issues,
    profiles_checked: profileId === undefined ? definitions.length : definitions.filter((item) => item.profileId === profileId).length,
    attached_missing: attachedMissing,
  };
}

export async function profileLinkRelsForWorkspace(workspace: KnbWorkspace): Promise<ProfileLinkRelMap> {
  const attached = configProfilesForInstance(await readWorkspaceConfig(workspace), workspace.instanceId);
  if (attached.length === 0) return {};

  const definitions = await readProfileDefinitions(workspace);
  const byId = new Map<string, ProfileDefinition>();
  for (const item of definitions) {
    if (item.issue) continue;
    byId.set(item.profile.profile_id, item.profile);
  }

  const resolved = new Map<string, string[]>();
  const resolve = (profileId: string, seen: Set<string>): string[] => {
    const existing = resolved.get(profileId);
    if (existing) return existing;
    if (seen.has(profileId)) return [];
    const nextSeen = new Set(seen);
    nextSeen.add(profileId);

    const profile = byId.get(profileId);
    if (!profile) {
      resolved.set(profileId, []);
      return [];
    }

    const rels = new Set<string>();
    for (const parentId of profile.extends ?? []) {
      for (const rel of resolve(parentId, nextSeen)) rels.add(rel);
    }
    for (const item of profile.link_types ?? []) {
      if (typeof item.rel === "string" && item.rel.length > 0) rels.add(item.rel);
    }

    const out = [...rels].sort((a, b) => a.localeCompare(b));
    resolved.set(profileId, out);
    return out;
  };

  const result: ProfileLinkRelMap = {};
  for (const profileId of attached) {
    result[profileId] = resolve(profileId, new Set());
  }
  return result;
}

export async function attachProfile(
  workspace: KnbWorkspace,
  profileId: string,
): Promise<{ profile_id: string; attached_profiles: string[]; attached_changed: boolean; config_path: string }> {
  const normalizedId = validateProfileId(profileId);
  let changed = false;
  const result = await updateWorkspaceConfig(workspace, (current) => {
    const currentInstance = current.instances?.[workspace.instanceId] ?? {};
    const profiles = configProfiles(currentInstance);
    if (!profiles.includes(normalizedId)) {
      profiles.push(normalizedId);
      changed = true;
    }
    const next = updateConfigInstance(current, workspace.instanceId, (instance) => ({
      ...instance,
      profiles: sortedUnique(profiles),
    }));
    return withConfigHeader(next, workspace.instanceId);
  });
  return {
    profile_id: normalizedId,
    attached_profiles: configProfilesForInstance(result.config, workspace.instanceId),
    attached_changed: changed,
    config_path: result.relative_path,
  };
}

export async function detachProfile(
  workspace: KnbWorkspace,
  profileId: string,
): Promise<{ profile_id: string; attached_profiles: string[]; detached: boolean; config_path: string }> {
  const normalizedId = validateProfileId(profileId);
  let detached = false;
  const result = await updateWorkspaceConfig(workspace, (current) => {
    const before = configProfilesForInstance(current, workspace.instanceId);
    const profiles = before.filter((value) => value !== normalizedId);
    detached = profiles.length !== before.length;
    const next = updateConfigInstance(current, workspace.instanceId, (instance) => ({
      ...instance,
      profiles,
    }));
    return withConfigHeader(next, workspace.instanceId);
  });
  return {
    profile_id: normalizedId,
    attached_profiles: configProfilesForInstance(result.config, workspace.instanceId),
    detached,
    config_path: result.relative_path,
  };
}

function withConfigHeader(config: ReturnType<typeof updateConfigInstance>, instanceId: string): ReturnType<typeof updateConfigInstance> {
  return {
    ...config,
    schema_version: KNB_CONFIG_SCHEMA_VERSION,
    default_instance: config.default_instance ?? instanceId,
  };
}

function normalizeProfileDefinition(profileId: string, input: unknown): ProfileDefinition {
  const issues = validateProfileInput(profileId, input);
  if (issues.length > 0) {
    throw knbError("validation_failed", `Invalid profile definition for ${profileId}`, {
      profile_id: profileId,
      issues,
    });
  }
  const source = input as Record<string, unknown>;
  const definition: ProfileDefinition = {
    schema_version: KNB_PROFILE_SCHEMA_VERSION,
    profile_id: profileId,
  };
  assignOptionalString(definition, source, "display_name");
  assignOptionalString(definition, source, "description");
  assignOptionalStringArray(definition, source, "extends");
  assignOptionalObjectArray(definition, source, "record_types");
  assignOptionalObjectArray(definition, source, "link_types");
  assignOptionalStringArray(definition, source, "required_fields");
  assignOptionalStringArray(definition, source, "agent_instructions");
  if (source.metadata !== undefined) definition.metadata = source.metadata as Record<string, unknown>;
  return definition;
}

function validateProfileInput(profileId: string, input: unknown): ProfileIssue[] {
  const issues: ProfileIssue[] = [];
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return [{
      level: "error",
      code: "profile_definition_invalid",
      message: "Profile definition must be a JSON object",
      profile_id: profileId,
    }];
  }
  const source = input as Record<string, unknown>;
  const allowed = new Set([
    "schema_version",
    "profile_id",
    "display_name",
    "description",
    "extends",
    "record_types",
    "link_types",
    "required_fields",
    "agent_instructions",
    "metadata",
  ]);
  for (const key of Object.keys(source)) {
    if (!allowed.has(key)) {
      issues.push({
        level: "error",
        code: "profile_field_unknown",
        message: `Unknown profile field: ${key}`,
        profile_id: profileId,
        path: key,
      });
    }
  }
  if (source.schema_version !== undefined && source.schema_version !== KNB_PROFILE_SCHEMA_VERSION) {
    issues.push({
      level: "error",
      code: "profile_schema_version_invalid",
      message: `schema_version must be ${KNB_PROFILE_SCHEMA_VERSION}`,
      profile_id: profileId,
      path: "schema_version",
    });
  }
  if (source.profile_id !== undefined && source.profile_id !== profileId) {
    issues.push({
      level: "error",
      code: "profile_id_mismatch",
      message: `profile_id must match command argument ${profileId}`,
      profile_id: profileId,
      path: "profile_id",
    });
  }
  validateOptionalString(source, "display_name", issues, profileId);
  validateOptionalString(source, "description", issues, profileId);
  validateOptionalStringArray(source, "extends", issues, profileId, true);
  validateOptionalStringArray(source, "required_fields", issues, profileId, false);
  validateOptionalStringArray(source, "agent_instructions", issues, profileId, false);
  validateOptionalRecordTypes(source, issues, profileId);
  validateOptionalLinkTypes(source, issues, profileId);
  if (source.metadata !== undefined && (source.metadata === null || typeof source.metadata !== "object" || Array.isArray(source.metadata))) {
    issues.push({
      level: "error",
      code: "profile_metadata_invalid",
      message: "metadata must be a JSON object",
      profile_id: profileId,
      path: "metadata",
    });
  }
  return issues;
}

async function readProfileDefinitions(
  workspace: KnbWorkspace,
): Promise<Array<{ profileId: string; path: string; profile: ProfileDefinition; issue?: undefined } | { profileId: string; path: string; issue: ProfileIssue }>> {
  const results: Array<{ profileId: string; path: string; profile: ProfileDefinition; issue?: undefined } | { profileId: string; path: string; issue: ProfileIssue }> = [];
  const seen = new Set<string>();
  for (const dir of profileDefinitionDirs(workspace)) {
    let entries: string[];
    try {
      entries = await readdir(dir);
    } catch (error) {
      if (isMissing(error)) continue;
      throw knbError("io_failed", `Failed to read profiles directory: ${dir}`, { path: dir }, error);
    }
    for (const entry of entries.filter((name) => name.endsWith(".json")).sort()) {
      const profileId = entry.slice(0, -5);
      if (seen.has(profileId)) continue;
      seen.add(profileId);
      const path = join(dir, entry);
      try {
        const raw = await readFile(path, "utf8");
        const parsed = JSON.parse(raw);
        const profile = normalizeProfileDefinition(profileId, parsed);
        results.push({ profileId, path: relativeToRoot(workspace, path), profile });
      } catch (error) {
        results.push({
          profileId,
          path: relativeToRoot(workspace, path),
          issue: {
            level: "error",
            code: "profile_file_invalid",
            message: error instanceof Error ? error.message : String(error),
            profile_id: profileId,
            path: relativeToRoot(workspace, path),
          },
        });
      }
    }
  }
  return results;
}

function profileDefinitionDirs(workspace: KnbWorkspace): string[] {
  const local = profilesDir(workspace);
  const parent = join(dirname(workspace.root), PROFILE_DIR);
  return parent === local ? [local] : [local, parent];
}

async function readProfileDefinition(
  workspace: KnbWorkspace,
  profileId: string,
): Promise<{ profile: ProfileDefinition; path: string } | undefined> {
  const path = profilePath(workspace, profileId);
  let raw: string;
  try {
    raw = await readFile(path, "utf8");
  } catch (error) {
    if (isMissing(error)) return undefined;
    throw knbError("io_failed", `Failed to read profile: ${profileId}`, { profile_id: profileId, path }, error);
  }
  try {
    const parsed = JSON.parse(raw);
    return { profile: normalizeProfileDefinition(profileId, parsed), path: relativeToRoot(workspace, path) };
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw knbError("validation_failed", `Failed to parse profile JSON: ${profileId}`, {
        profile_id: profileId,
        path: relativeToRoot(workspace, path),
      }, error);
    }
    throw error;
  }
}

async function writeProfileDefinition(workspace: KnbWorkspace, profile: ProfileDefinition): Promise<void> {
  const path = profilePath(workspace, profile.profile_id);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(profile, null, 2)}\n`, "utf8");
}

async function countLedgerProfileReferences(workspace: KnbWorkspace, profileId: string): Promise<number> {
  const snapshot = await loadLedger({ path: workspace.paths.ledger });
  if (snapshot.parseIssues.length > 0) {
    throw knbError("io_failed", "profile delete requires a parseable ledger", {
      path: workspace.paths.ledger,
      parse_issues: snapshot.parseIssues,
    });
  }
  let count = 0;
  for (const loaded of snapshot.rows) {
    const profiles = (loaded.row as { scope?: { profiles?: unknown } }).scope?.profiles;
    if (Array.isArray(profiles) && profiles.includes(profileId)) count += 1;
  }
  return count;
}

function requireConfirm(profileId: string, confirm: string | undefined, action: string): void {
  if (confirm !== profileId) {
    const suggestion =
      action === "profile replace"
        ? `knb profile replace ${profileId} --confirm ${profileId} --stdin --json`
        : `knb profile delete ${profileId} --confirm ${profileId} --json`;
    throw withSuggestions(
      "unsafe_operation_refused",
      `${action} requires --confirm ${profileId}`,
      { profile_id: profileId, confirm },
      [suggestion],
    );
  }
}

function assignOptionalString(target: ProfileDefinition, source: Record<string, unknown>, key: "display_name" | "description"): void {
  const value = source[key];
  if (typeof value === "string") target[key] = value;
}

function assignOptionalStringArray(target: ProfileDefinition, source: Record<string, unknown>, key: "extends" | "required_fields" | "agent_instructions"): void {
  const value = source[key];
  if (Array.isArray(value)) target[key] = value as string[];
}

function assignOptionalObjectArray(target: ProfileDefinition, source: Record<string, unknown>, key: "record_types" | "link_types"): void {
  const value = source[key];
  if (!Array.isArray(value)) return;
  if (key === "record_types") target.record_types = value as ProfileRecordType[];
  else target.link_types = value as ProfileLinkType[];
}

function validateOptionalString(
  source: Record<string, unknown>,
  key: string,
  issues: ProfileIssue[],
  profileId: string,
): void {
  if (source[key] !== undefined && typeof source[key] !== "string") {
    issues.push({ level: "error", code: "profile_field_invalid", message: `${key} must be a string`, profile_id: profileId, path: key });
  }
}

function validateOptionalStringArray(
  source: Record<string, unknown>,
  key: string,
  issues: ProfileIssue[],
  profileId: string,
  validateIds: boolean,
): void {
  const value = source[key];
  if (value === undefined) return;
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string" || item.length === 0)) {
    issues.push({ level: "error", code: "profile_field_invalid", message: `${key} must be an array of non-empty strings`, profile_id: profileId, path: key });
    return;
  }
  if (validateIds) {
    for (const item of value) {
      if (!PROFILE_ID_PATTERN.test(item)) {
        issues.push({ level: "error", code: "profile_id_invalid", message: `Invalid profile id in ${key}: ${item}`, profile_id: profileId, path: key });
      }
    }
  }
}

function validateOptionalRecordTypes(source: Record<string, unknown>, issues: ProfileIssue[], profileId: string): void {
  const value = source.record_types;
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push({ level: "error", code: "profile_field_invalid", message: "record_types must be an array", profile_id: profileId, path: "record_types" });
    return;
  }
  value.forEach((item, index) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      issues.push({ level: "error", code: "profile_record_type_invalid", message: "record_types entries must be objects", profile_id: profileId, path: `record_types[${index}]` });
      return;
    }
    const type = (item as { type?: unknown }).type;
    if (typeof type !== "string" || !TOKEN_PATTERN.test(type)) {
      issues.push({ level: "error", code: "profile_record_type_invalid", message: "record type must include a lowercase type", profile_id: profileId, path: `record_types[${index}].type` });
    }
  });
}

function validateOptionalLinkTypes(source: Record<string, unknown>, issues: ProfileIssue[], profileId: string): void {
  const value = source.link_types;
  if (value === undefined) return;
  if (!Array.isArray(value)) {
    issues.push({ level: "error", code: "profile_field_invalid", message: "link_types must be an array", profile_id: profileId, path: "link_types" });
    return;
  }
  value.forEach((item, index) => {
    if (item === null || typeof item !== "object" || Array.isArray(item)) {
      issues.push({ level: "error", code: "profile_link_type_invalid", message: "link_types entries must be objects", profile_id: profileId, path: `link_types[${index}]` });
      return;
    }
    const rel = (item as { rel?: unknown }).rel;
    if (typeof rel !== "string" || !TOKEN_PATTERN.test(rel)) {
      issues.push({ level: "error", code: "profile_link_type_invalid", message: "link type must include a lowercase rel", profile_id: profileId, path: `link_types[${index}].rel` });
    }
  });
}

function profilePath(workspace: KnbWorkspace, profileId: string): string {
  return join(profilesDir(workspace), `${profileId}.json`);
}

function profilesDir(workspace: KnbWorkspace): string {
  return join(workspace.root, PROFILE_DIR);
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
