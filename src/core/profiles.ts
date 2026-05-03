import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { KnbRow, LoadedRow, ValidationIssue } from "./contract";
import {
  matchesRowSelector,
  rowSelectorValueAtPath,
  validateRowSelector,
  type RowSelector,
  type RowSelectorValue,
} from "./selectors";
export type ProfileWorkspace = {
  paths: {
    profiles: string;
  };
};

type ProfileRuleType = "string" | "number" | "boolean";

export type ProfileRule = {
  path: string;
  required?: boolean;
  type?: ProfileRuleType;
  enum?: RowSelectorValue[];
  pattern?: string;
  min?: number;
  max?: number;
};

export type KnbProfile = {
  profile_version: "knb.profile.v1";
  name: string;
  select: RowSelector;
  rules: ProfileRule[];
  file_path: string;
};

export type KnbProfileFile = Omit<KnbProfile, "file_path">;

type LoadedProfiles = {
  profiles: KnbProfile[];
  issues: ValidationIssue[];
};

const PROFILE_VERSION = "knb.profile.v1";
const RULE_TYPES: ProfileRuleType[] = ["string", "number", "boolean"];

export async function validateProfilesForWorkspace(
  workspace: ProfileWorkspace,
  rows: LoadedRow[],
): Promise<ValidationIssue[]> {
  const loaded = await loadProfiles(workspace);
  const issues = [...loaded.issues];
  for (const profile of loaded.profiles) {
    for (const loadedRow of rows) {
      if (!rowMatchesProfile(loadedRow.row, profile)) continue;
      for (const rule of profile.rules) {
        validateProfileRule(profile, loadedRow, rule, issues);
      }
    }
  }
  return issues;
}

export function profileSchema(): object {
  return {
    schema_version: PROFILE_VERSION,
    type: "object",
    additionalProperties: false,
    required: ["profile_version", "name", "select", "rules"],
    properties: {
      profile_version: { const: PROFILE_VERSION },
      name: { type: "string", minLength: 1 },
      select: {
        description: "RowSelector deciding which canonical rows this profile validates.",
        $ref: "knb.selector.v1",
      },
      rules: {
        type: "array",
        items: {
          type: "object",
          required: ["path"],
          properties: {
            path: { type: "string" },
            required: { type: "boolean" },
            type: { enum: RULE_TYPES },
            enum: { type: "array", items: { type: ["string", "number", "boolean", "null"] } },
            pattern: { type: "string" },
            min: { type: "number" },
            max: { type: "number" },
          },
        },
      },
    },
  };
}

export function profileSamples(): KnbProfileFile[] {
  return [
    {
      profile_version: PROFILE_VERSION,
      name: "measurement-profile",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "measurement" }],
      },
      rules: [
        { path: "claim.qualifiers.metric", required: true, type: "string" },
        { path: "claim.qualifiers.value", required: true, type: "number" },
        { path: "claim.qualifiers.unit", required: true, type: "string" },
      ],
    },
    {
      profile_version: PROFILE_VERSION,
      name: "evaluation-profile",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "evaluation" }],
      },
      rules: [
        { path: "claim.qualifiers.subject", required: true, type: "string" },
        { path: "claim.qualifiers.rating", enum: ["low", "medium", "high"] },
      ],
    },
  ];
}

async function loadProfiles(workspace: ProfileWorkspace): Promise<LoadedProfiles> {
  let entries: string[];
  try {
    entries = await readdir(workspace.paths.profiles);
  } catch (error) {
    if (isMissing(error)) return { profiles: [], issues: [] };
    return {
      profiles: [],
      issues: [
        {
          level: "error",
          code: "profile_directory_unreadable",
          path: workspace.paths.profiles,
          message: `Failed to read profiles directory: ${workspace.paths.profiles}`,
        },
      ],
    };
  }

  const profiles: KnbProfile[] = [];
  const issues: ValidationIssue[] = [];
  for (const entry of entries.filter((name) => name.endsWith(".json")).sort()) {
    const filePath = join(workspace.paths.profiles, entry);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      issues.push({
        level: "error",
        code: "profile_file_unreadable",
        path: filePath,
        message: `Failed to read profile file: ${filePath}`,
      });
      continue;
    }
    const parsed = parseProfile(filePath, raw);
    issues.push(...parsed.issues);
    if (parsed.profile !== undefined) profiles.push(parsed.profile);
  }
  return { profiles, issues };
}

function parseProfile(filePath: string, raw: string): { profile?: KnbProfile; issues: ValidationIssue[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      issues: [
        {
          level: "error",
          code: "profile_parse_error",
          path: filePath,
          message: `Failed to parse profile JSON: ${filePath}`,
        },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      issues: [
        {
          level: "error",
          code: "profile_definition_invalid",
          path: filePath,
          message: `Profile must be a JSON object: ${filePath}`,
        },
      ],
    };
  }

  const rawProfile = parsed as Record<string, unknown>;
  const profileName = typeof rawProfile.name === "string" && rawProfile.name.length > 0
    ? rawProfile.name
    : undefined;
  const issueProfile = profileName ?? filePath;

  if (rawProfile.profile_version !== PROFILE_VERSION) {
    issues.push(profileDefinitionIssue(filePath, issueProfile, "profile_version", "profile_version_invalid", `Profile ${issueProfile}: profile_version must be ${PROFILE_VERSION}.`));
  }
  if (profileName === undefined) {
    issues.push(profileDefinitionIssue(filePath, issueProfile, "name", "profile_name_required", `Profile ${filePath}: name must be a non-empty string.`));
  }

  const selectValidation = validateRowSelector(rawProfile.select);
  if (!selectValidation.ok) {
    for (const issue of selectValidation.issues) {
      issues.push(profileDefinitionIssue(
        filePath,
        issueProfile,
        `select${issue.path ? `.${issue.path}` : ""}`,
        "profile_selector_invalid",
        `Profile ${issueProfile}: invalid selector: ${issue.message}`,
      ));
    }
  }

  const rules = parseRules(filePath, issueProfile, rawProfile.rules, issues);
  if (issues.length > 0 || profileName === undefined) return { issues };
  return {
    profile: {
      profile_version: PROFILE_VERSION,
      name: profileName,
      select: rawProfile.select as RowSelector,
      rules,
      file_path: filePath,
    },
    issues,
  };
}

function parseRules(
  filePath: string,
  profile: string,
  rawRules: unknown,
  issues: ValidationIssue[],
): ProfileRule[] {
  if (!Array.isArray(rawRules)) {
    issues.push(profileDefinitionIssue(filePath, profile, "rules", "profile_rules_invalid", `Profile ${profile}: rules must be an array.`));
    return [];
  }

  const rules: ProfileRule[] = [];
  rawRules.forEach((rawRule, index) => {
    const prefix = `rules[${index}]`;
    if (rawRule === null || typeof rawRule !== "object" || Array.isArray(rawRule)) {
      issues.push(profileDefinitionIssue(filePath, profile, prefix, "profile_rule_invalid", `Profile ${profile}: ${prefix} must be an object.`));
      return;
    }
    const rule = rawRule as Record<string, unknown>;
    if (typeof rule.path !== "string" || rule.path.length === 0) {
      issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.path`, "profile_rule_path_required", `Profile ${profile}: ${prefix}.path must be a non-empty string.`));
      return;
    }
    const pathValidation = validateRowSelector({ where: [{ path: rule.path, exists: true }] });
    if (!pathValidation.ok) {
      issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.path`, "profile_rule_path_invalid", `Profile ${profile}: invalid rule path ${rule.path}.`));
      return;
    }
    const parsed: ProfileRule = { path: rule.path };
    if (rule.required !== undefined) {
      if (typeof rule.required !== "boolean") {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.required`, "profile_rule_required_invalid", `Profile ${profile}: ${prefix}.required must be boolean.`));
        return;
      }
      parsed.required = rule.required;
    }
    if (rule.type !== undefined) {
      if (!isProfileRuleType(rule.type)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.type`, "profile_rule_type_invalid", `Profile ${profile}: ${prefix}.type must be string, number, or boolean.`));
        return;
      }
      parsed.type = rule.type;
    }
    if (rule.enum !== undefined) {
      if (!Array.isArray(rule.enum) || rule.enum.length === 0 || !rule.enum.every(isRowSelectorValue)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.enum`, "profile_rule_enum_invalid", `Profile ${profile}: ${prefix}.enum must be a non-empty primitive array.`));
        return;
      }
      parsed.enum = rule.enum;
    }
    if (rule.pattern !== undefined) {
      if (typeof rule.pattern !== "string") {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.pattern`, "profile_rule_pattern_invalid", `Profile ${profile}: ${prefix}.pattern must be a string.`));
        return;
      }
      try {
        new RegExp(rule.pattern);
      } catch {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.pattern`, "profile_rule_pattern_invalid", `Profile ${profile}: ${prefix}.pattern must compile as a regular expression.`));
        return;
      }
      parsed.pattern = rule.pattern;
    }
    if (rule.min !== undefined) {
      if (typeof rule.min !== "number" || !Number.isFinite(rule.min)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.min`, "profile_rule_min_invalid", `Profile ${profile}: ${prefix}.min must be a finite number.`));
        return;
      }
      parsed.min = rule.min;
    }
    if (rule.max !== undefined) {
      if (typeof rule.max !== "number" || !Number.isFinite(rule.max)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.max`, "profile_rule_max_invalid", `Profile ${profile}: ${prefix}.max must be a finite number.`));
        return;
      }
      parsed.max = rule.max;
    }
    if (parsed.min !== undefined && parsed.max !== undefined && parsed.min > parsed.max) {
      issues.push(profileDefinitionIssue(filePath, profile, prefix, "profile_rule_range_invalid", `Profile ${profile}: ${prefix}.min must be <= max.`));
      return;
    }
    rules.push(parsed);
  });
  return rules;
}

function validateProfileRule(
  profile: KnbProfile,
  loaded: LoadedRow,
  rule: ProfileRule,
  issues: ValidationIssue[],
): void {
  const value = rowSelectorValueAtPath(loaded.row, rule.path);
  const values = concreteValues(value);
  if (rule.required === true && values.length === 0) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_required_path", `Profile ${profile.name}: row ${loaded.row.id} is missing required path ${rule.path}.`));
    return;
  }
  if (values.length === 0) return;

  if (rule.type !== undefined && !values.every((item) => valueMatchesType(item, rule.type!))) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_type_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be ${rule.type}.`));
  }
  if (rule.enum !== undefined && !values.every((item) => rule.enum!.includes(item as RowSelectorValue))) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_enum_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be one of the configured enum values.`));
  }
  if (rule.pattern !== undefined) {
    const re = new RegExp(rule.pattern);
    if (!values.every((item) => typeof item === "string" && re.test(item))) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_pattern_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must match ${rule.pattern}.`));
    }
  }
  if (rule.min !== undefined) {
    if (!values.every((item) => typeof item === "number" && item >= rule.min!)) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_min_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be >= ${rule.min}.`));
    }
  }
  if (rule.max !== undefined) {
    if (!values.every((item) => typeof item === "number" && item <= rule.max!)) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_max_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be <= ${rule.max}.`));
    }
  }
}

function rowMatchesProfile(row: KnbRow, profile: KnbProfile): boolean {
  try {
    return matchesRowSelector(row, profile.select);
  } catch {
    return false;
  }
}

function concreteValues(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((entry) => entry !== undefined && entry !== null);
  return [value];
}

function profileDefinitionIssue(
  filePath: string,
  profile: string,
  path: string,
  code: string,
  message: string,
): ValidationIssue {
  return {
    level: "error",
    code,
    profile,
    path: `${filePath}:${path}`,
    message,
  };
}

function rowIssue(
  profile: KnbProfile,
  loaded: LoadedRow,
  path: string,
  code: string,
  message: string,
): ValidationIssue {
  return {
    level: "error",
    code,
    profile: profile.name,
    id: loaded.row.id,
    line: loaded.line,
    path,
    message,
  };
}

function isProfileRuleType(value: unknown): value is ProfileRuleType {
  return typeof value === "string" && (RULE_TYPES as string[]).includes(value);
}

function isRowSelectorValue(value: unknown): value is RowSelectorValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function valueMatchesType(value: unknown, type: ProfileRuleType): boolean {
  return typeof value === type;
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}
