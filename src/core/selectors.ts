import { ROW_KINDS, type ExternalRef, type KnbRow, type KnbRowKind, type ValidationIssue } from "./contract";
import type { EffectiveRow } from "./state";

export type RowSelectorValue = string | number | boolean | null;
export type RowSelectorComparable = string | number;

export type RowSelectorWhere = {
  path: string;
  eq?: RowSelectorValue;
  in?: RowSelectorValue[];
  exists?: boolean;
  gte?: RowSelectorComparable;
  lte?: RowSelectorComparable;
};

export type RowSelectorExternalRef = {
  system?: string;
  id?: string;
  type?: string | null;
  path?: string | null;
};

export type RowSelector = {
  kinds?: KnbRowKind[];
  ids?: string[];
  scope?: {
    collections?: string[];
    subjects?: string[];
    tags?: string[];
  };
  external_refs?: RowSelectorExternalRef[];
  where?: RowSelectorWhere[];
};

export type StructuredClaimFilterRequest = {
  claimType?: string;
  predicate?: string;
  qualifiers?: Record<string, RowSelectorValue>;
  externalRefs?: RowSelectorExternalRef[];
};

export type RowSelectorValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const ROW_SELECTOR_EXACT_PATHS = [
  "kind",
  "id",
  "created_at",
  "scope.collections",
  "scope.subjects",
  "scope.tags",
  "claim.type",
  "claim.subject",
  "claim.predicate",
  "claim.object",
  "time.valid_at",
  "time.occurred_at",
  "time.valid_from",
  "time.valid_until",
  "time.reported_at",
  "external_refs.system",
  "external_refs.id",
  "external_refs.type",
  "external_refs.path",
] as const;

const ROW_SELECTOR_PATH_PATTERNS = ["claim.qualifiers.<key>"] as const;

export function structuredClaimSelectorFromRequest(
  request: StructuredClaimFilterRequest,
): RowSelector | undefined {
  const where: RowSelectorWhere[] = [];
  if (request.claimType !== undefined) {
    where.push({ path: "claim.type", eq: request.claimType });
  }
  if (request.predicate !== undefined) {
    where.push({ path: "claim.predicate", eq: request.predicate });
  }
  for (const [key, value] of Object.entries(request.qualifiers ?? {})) {
    where.push({ path: `claim.qualifiers.${key}`, eq: value });
  }
  const externalRefs = request.externalRefs;
  if (where.length === 0 && (!Array.isArray(externalRefs) || externalRefs.length === 0)) {
    return undefined;
  }
  const selector: RowSelector = {};
  if (where.length > 0) selector.where = where;
  if (Array.isArray(externalRefs) && externalRefs.length > 0) selector.external_refs = externalRefs;
  return selector;
}

export function validateRowSelector(selector: unknown): RowSelectorValidationResult {
  const issues: ValidationIssue[] = [];
  if (selector === null || typeof selector !== "object" || Array.isArray(selector)) {
    issues.push({
      level: "error",
      code: "selector_invalid",
      message: "Row selector must be an object.",
    });
    return { ok: false, issues };
  }

  const typedSelector = selector as {
    kinds?: unknown;
    ids?: unknown;
    scope?: unknown;
    external_refs?: unknown;
    where?: unknown;
  };
  validateOptionalStringArray(typedSelector.kinds, "kinds", "selector_kinds_invalid", issues, ROW_KINDS);
  validateOptionalStringArray(typedSelector.ids, "ids", "selector_ids_invalid", issues);
  validateScopeSelector(typedSelector.scope, issues);
  validateExternalRefsSelector(typedSelector.external_refs, issues);

  const where = typedSelector.where;
  if (where !== undefined) {
    if (!Array.isArray(where)) {
      issues.push({
        level: "error",
        code: "selector_where_invalid",
        message: "Row selector where must be an array.",
        path: "where",
      });
    } else {
      where.forEach((clause, index) => validateWhereClause(clause, index, issues));
    }
  }

  return { ok: issues.length === 0, issues };
}

export function matchesRowSelector(row: KnbRow, selector: RowSelector): boolean {
  if (Array.isArray(selector.kinds) && selector.kinds.length > 0 && !selector.kinds.includes(row.kind)) {
    return false;
  }
  if (Array.isArray(selector.ids) && selector.ids.length > 0 && !selector.ids.includes(row.id)) {
    return false;
  }
  if (!matchesScope(row, selector.scope)) return false;
  if (!matchesExternalRefs(row.external_refs, selector.external_refs)) return false;
  for (const clause of selector.where ?? []) {
    const value = valueAtPath(row, clause.path);
    if (clause.eq !== undefined && !valueEquals(value, clause.eq)) return false;
    if (clause.in !== undefined && !valueIn(value, clause.in)) return false;
    if (clause.exists !== undefined && valueExists(value) !== clause.exists) return false;
    if ((clause.gte !== undefined || clause.lte !== undefined) && !valueInRange(value, clause)) return false;
  }
  return true;
}

export function selectEffectiveRows(rows: EffectiveRow[], selector: RowSelector): EffectiveRow[] {
  return rows.filter((effective) => matchesRowSelector(effective.row, selector));
}

export function rowSelectorValueAtPath(row: KnbRow, path: string): unknown {
  return valueAtPath(row, path);
}

export function rowSelectorSchema(): object {
  return {
    schema_version: "knb.selector.v1",
    type: "object",
    additionalProperties: false,
    properties: {
      kinds: { type: "array", items: { enum: ["source", "claim", "question", "synthesis", "change"] } },
      ids: { type: "array", items: { type: "string" } },
      scope: {
        type: "object",
        properties: {
          collections: { type: "array", items: { type: "string" } },
          subjects: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      external_refs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            system: { type: "string" },
            id: { type: "string" },
            type: { type: ["string", "null"] },
            path: { type: ["string", "null"] },
          },
        },
      },
      where: {
        type: "array",
        items: {
          type: "object",
          required: ["path"],
          properties: {
            path: { type: "string" },
            eq: { type: ["string", "number", "boolean", "null"] },
            in: { type: "array", items: { type: ["string", "number", "boolean", "null"] } },
            exists: { type: "boolean" },
            gte: { type: ["string", "number"] },
            lte: { type: ["string", "number"] },
          },
        },
      },
    },
    allowed_paths: [...ROW_SELECTOR_EXACT_PATHS],
    path_patterns: [...ROW_SELECTOR_PATH_PATTERNS],
  };
}

export function rowSelectorSamples(): RowSelector[] {
  return [
    {
      kinds: ["claim"],
      scope: { collections: ["example-research"] },
      where: [
        { path: "claim.type", eq: "measurement" },
        { path: "claim.qualifiers.metric", eq: "latency" },
      ],
    },
    {
      kinds: ["claim"],
      where: [
        { path: "claim.type", in: ["measurement", "evaluation"] },
        { path: "time.valid_at", gte: "2026-01-01T00:00:00Z" },
      ],
    },
  ];
}

function validateWhereClause(clause: unknown, index: number, issues: ValidationIssue[]): void {
  const pathPrefix = `where[${index}]`;
  if (clause === null || typeof clause !== "object" || Array.isArray(clause)) {
    issues.push({
      level: "error",
      code: "selector_clause_invalid",
      message: "Row selector where clause must be an object.",
      path: pathPrefix,
    });
    return;
  }
  const typed = clause as {
    path?: unknown;
    eq?: unknown;
    in?: unknown;
    exists?: unknown;
    gte?: unknown;
    lte?: unknown;
  };
  if (typeof typed.path !== "string" || typed.path.length === 0) {
    issues.push({
      level: "error",
      code: "selector_path_missing",
      message: "Row selector where clause requires a non-empty path.",
      path: `${pathPrefix}.path`,
    });
  } else if (!isAllowedPath(typed.path)) {
    issues.push({
      level: "error",
      code: "selector_unknown_path",
      message: `Unknown selector path: ${typed.path}`,
      path: `${pathPrefix}.path`,
    });
  }
  const hasEq = "eq" in typed;
  const hasIn = "in" in typed;
  const hasExists = "exists" in typed;
  const hasRange = "gte" in typed || "lte" in typed;
  if (!hasEq && !hasIn && !hasExists && !hasRange) {
    issues.push({
      level: "error",
      code: "selector_clause_missing_operator",
      message: "Row selector where clause requires an operator.",
      path: pathPrefix,
    });
  }
  if (hasIn && (!Array.isArray(typed.in) || typed.in.length === 0)) {
    issues.push({
      level: "error",
      code: "selector_in_invalid",
      message: "Row selector in operator must be a non-empty array.",
      path: `${pathPrefix}.in`,
    });
  } else if (hasIn && Array.isArray(typed.in) && typed.in.some((value) => !isSelectorValue(value))) {
    issues.push({
      level: "error",
      code: "selector_in_invalid",
      message: "Row selector in operator values must be strings, numbers, booleans, or null.",
      path: `${pathPrefix}.in`,
    });
  }
  if (hasEq && !isSelectorValue(typed.eq)) {
    issues.push({
      level: "error",
      code: "selector_eq_invalid",
      message: "Row selector eq operator must be a string, number, boolean, or null.",
      path: `${pathPrefix}.eq`,
    });
  }
  if (hasExists && typeof typed.exists !== "boolean") {
    issues.push({
      level: "error",
      code: "selector_exists_invalid",
      message: "Row selector exists operator must be boolean.",
      path: `${pathPrefix}.exists`,
    });
  }
  if ("gte" in typed && !isComparableValue(typed.gte)) {
    issues.push({
      level: "error",
      code: "selector_range_invalid",
      message: "Row selector gte operator must be a string or number.",
      path: `${pathPrefix}.gte`,
    });
  }
  if ("lte" in typed && !isComparableValue(typed.lte)) {
    issues.push({
      level: "error",
      code: "selector_range_invalid",
      message: "Row selector lte operator must be a string or number.",
      path: `${pathPrefix}.lte`,
    });
  }
}

function validateOptionalStringArray(
  value: unknown,
  path: string,
  code: string,
  issues: ValidationIssue[],
  allowedValues?: readonly string[],
): void {
  if (value === undefined) return;
  const valid = Array.isArray(value) &&
    value.every((entry) =>
      typeof entry === "string" &&
      entry.length > 0 &&
      (allowedValues === undefined || allowedValues.includes(entry))
    );
  if (!valid) {
    issues.push({
      level: "error",
      code,
      message: `Row selector ${path} must be an array of valid strings.`,
      path,
    });
  }
}

function validateScopeSelector(scope: unknown, issues: ValidationIssue[]): void {
  if (scope === undefined) return;
  if (scope === null || typeof scope !== "object" || Array.isArray(scope)) {
    issues.push({
      level: "error",
      code: "selector_scope_invalid",
      message: "Row selector scope must be an object.",
      path: "scope",
    });
    return;
  }
  const typed = scope as { collections?: unknown; subjects?: unknown; tags?: unknown };
  const before = issues.length;
  validateOptionalStringArray(typed.collections, "scope.collections", "selector_scope_invalid", issues);
  validateOptionalStringArray(typed.subjects, "scope.subjects", "selector_scope_invalid", issues);
  validateOptionalStringArray(typed.tags, "scope.tags", "selector_scope_invalid", issues);
  if (issues.length > before) {
    for (let index = before; index < issues.length; index += 1) {
      const issue = issues[index];
      if (issue) issue.message = "Row selector scope arrays must contain only non-empty strings.";
    }
  }
}

function validateExternalRefsSelector(externalRefs: unknown, issues: ValidationIssue[]): void {
  if (externalRefs === undefined) return;
  if (!Array.isArray(externalRefs)) {
    issues.push({
      level: "error",
      code: "selector_external_ref_invalid",
      message: "Row selector external_refs must be an array.",
      path: "external_refs",
    });
    return;
  }
  for (let index = 0; index < externalRefs.length; index += 1) {
    const ref = externalRefs[index];
    if (ref === null || typeof ref !== "object" || Array.isArray(ref)) {
      issues.push({
        level: "error",
        code: "selector_external_ref_invalid",
        message: "Row selector external_refs entries must be objects.",
        path: `external_refs[${index}]`,
      });
      continue;
    }
    const typed = ref as Record<string, unknown>;
    for (const key of ["system", "id"] as const) {
      if (typed[key] !== undefined && typeof typed[key] !== "string") {
        issues.push({
          level: "error",
          code: "selector_external_ref_invalid",
          message: `Row selector external_refs[${index}].${key} must be a string.`,
          path: `external_refs[${index}].${key}`,
        });
        break;
      }
    }
    for (const key of ["type", "path"] as const) {
      if (typed[key] !== undefined && typed[key] !== null && typeof typed[key] !== "string") {
        issues.push({
          level: "error",
          code: "selector_external_ref_invalid",
          message: `Row selector external_refs[${index}].${key} must be a string or null.`,
          path: `external_refs[${index}].${key}`,
        });
        break;
      }
    }
  }
}

function isSelectorValue(value: unknown): value is RowSelectorValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isAllowedPath(path: string): boolean {
  return (
    (ROW_SELECTOR_EXACT_PATHS as readonly string[]).includes(path) ||
    (path.startsWith("claim.qualifiers.") && path.length > "claim.qualifiers.".length)
  );
}

function valueAtPath(row: KnbRow, path: string): unknown {
  if (path === "kind") return row.kind;
  if (path === "id") return row.id;
  if (path === "created_at") return row.created_at;
  if (path === "scope.collections") return row.scope.collections;
  if (path === "scope.subjects") return row.scope.subjects;
  if (path === "scope.tags") return row.scope.tags;
  if (path === "claim.type") return row.kind === "claim" ? row.claim.type : undefined;
  if (path === "claim.subject") return row.kind === "claim" ? row.claim.subject : undefined;
  if (path === "claim.predicate") return row.kind === "claim" ? row.claim.predicate : undefined;
  if (path === "claim.object") return row.kind === "claim" ? row.claim.object : undefined;
  if (path === "time.valid_at") return "time" in row ? row.time?.valid_at : undefined;
  if (path === "time.occurred_at") return "time" in row ? row.time?.occurred_at : undefined;
  if (path === "time.valid_from") return "time" in row ? row.time?.valid_from : undefined;
  if (path === "time.valid_until") return "time" in row ? row.time?.valid_until : undefined;
  if (path === "time.reported_at") return "time" in row ? row.time?.reported_at : undefined;
  if (path === "external_refs.system") return row.external_refs?.map((ref) => ref.system);
  if (path === "external_refs.id") return row.external_refs?.map((ref) => ref.id);
  if (path === "external_refs.type") return row.external_refs?.map((ref) => ref.type);
  if (path === "external_refs.path") return row.external_refs?.map((ref) => ref.path);
  if (path.startsWith("claim.qualifiers.")) {
    if (row.kind !== "claim") return undefined;
    const key = path.slice("claim.qualifiers.".length);
    return row.claim.qualifiers?.[key];
  }
  return undefined;
}

function matchesScope(row: KnbRow, scope: RowSelector["scope"]): boolean {
  if (scope === undefined) return true;
  if (!scopeArrayMatches(row.scope.collections, scope.collections)) return false;
  if (!scopeArrayMatches(row.scope.subjects, scope.subjects)) return false;
  if (!scopeArrayMatches(row.scope.tags, scope.tags)) return false;
  return true;
}

function matchesExternalRefs(
  actual: ExternalRef[] | undefined,
  expected: RowSelectorExternalRef[] | undefined,
): boolean {
  if (!Array.isArray(expected) || expected.length === 0) return true;
  if (!Array.isArray(actual) || actual.length === 0) return false;
  return expected.every((selector) => actual.some((ref) => externalRefMatches(ref, selector)));
}

function externalRefMatches(actual: ExternalRef, expected: RowSelectorExternalRef): boolean {
  if (expected.system !== undefined && actual.system !== expected.system) return false;
  if (expected.id !== undefined && actual.id !== expected.id) return false;
  if (expected.type !== undefined && actual.type !== expected.type) return false;
  if (expected.path !== undefined && actual.path !== expected.path) return false;
  return true;
}

function scopeArrayMatches(actual: string[] | undefined, expected: string[] | undefined): boolean {
  if (!Array.isArray(expected) || expected.length === 0) return true;
  if (!Array.isArray(actual)) return false;
  return expected.some((value) => actual.includes(value));
}

function valueEquals(actual: unknown, expected: RowSelectorValue): boolean {
  if (Array.isArray(actual)) return actual.some((item) => item === expected);
  return actual === expected;
}

function valueIn(actual: unknown, expected: RowSelectorValue[]): boolean {
  if (Array.isArray(actual)) return actual.some((item) => expected.includes(item as RowSelectorValue));
  return expected.includes(actual as RowSelectorValue);
}

function valueExists(actual: unknown): boolean {
  if (actual === undefined || actual === null) return false;
  if (Array.isArray(actual)) return actual.length > 0;
  return true;
}

function valueInRange(actual: unknown, clause: RowSelectorWhere): boolean {
  const values = Array.isArray(actual) ? actual : [actual];
  return values.some((value) => comparableInRange(value, clause.gte, clause.lte));
}

function comparableInRange(
  actual: unknown,
  gte: RowSelectorComparable | undefined,
  lte: RowSelectorComparable | undefined,
): boolean {
  if (!isComparableValue(actual)) return false;
  if (gte !== undefined && compareComparable(actual, gte) < 0) return false;
  if (lte !== undefined && compareComparable(actual, lte) > 0) return false;
  return true;
}

function compareComparable(a: RowSelectorComparable, b: RowSelectorComparable): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const aString = String(a);
  const bString = String(b);
  const aTime = Date.parse(aString);
  const bTime = Date.parse(bString);
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return aString.localeCompare(bString);
}

function isComparableValue(value: unknown): value is RowSelectorComparable {
  return typeof value === "string" || typeof value === "number";
}
