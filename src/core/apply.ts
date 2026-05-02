// Apply module - V1 single deep module for atomic operation batches.
// Owns reference resolution, ID generation with collision retry, lifecycle
// change-row construction, novelty hooks, and final candidate-ledger
// validation. Writes only through the ledger transaction; never touches
// the filesystem directly.

import {
  completeDraftRow,
  generateId,
  scopeSlug,
  validateApplyRequest,
  validateLedger,
  type ApplyOperation,
  type ApplyRequest,
  type ChangeRow,
  type DraftRow,
  type KnbRow,
  type KnbRowKind,
  type LoadedRow,
  type Scope,
  type ValidationIssue,
} from "./contract";
import { knbError } from "./errors";
import {
  loadLedger,
  writeLedger as defaultWriteLedger,
  type LedgerFingerprint,
  type LedgerSnapshot,
  type LedgerWriteResult,
} from "./ledger";

const ID_COLLISION_RETRY_LIMIT = 8;

export type NoveltyClassification =
  | "new"
  | "duplicate"
  | "corroboration"
  | "update"
  | "contradiction"
  | "correction";

export type NoveltyDecision = {
  classification: NoveltyClassification;
  matched_ids: string[];
};

export type ApplyDeps = {
  workspace: { paths: { ledger: string; lock: string } };
  runtime: { clock: () => Date; randomIdPart: (bytes: number) => string };
  actor: string;
  writeLedger?: typeof defaultWriteLedger;
  classifyNovelty?: (candidate: KnbRow, snapshot: LedgerSnapshot) => NoveltyDecision;
};

export type ApplyCreatedEntry = {
  op: number;
  as?: string;
  id: string;
  kind: KnbRowKind;
};

export type ApplySkippedEntry = {
  op: number;
  reason: string;
  matched_ids?: string[];
};

export type ApplyNoveltyEntry = {
  op: number;
  classification: string;
  matched_ids: string[];
};

export type ApplyResult = {
  created: ApplyCreatedEntry[];
  skipped: ApplySkippedEntry[];
  warnings: string[];
  novelty: ApplyNoveltyEntry[];
  meta: {
    rows_appended: number;
    bytes_written: number;
    ledger_path: string;
    fingerprint_after: LedgerFingerprint;
    dry_run?: boolean;
    planned_rows?: number;
  };
};

type ResolvedAddPlan = {
  kind: "add-row";
  index: number;
  row: KnbRow;
  as?: string;
};

type ResolvedSkipPlan = {
  kind: "skip";
  index: number;
  matchedId: string;
  reason: string;
  matchedIds: string[];
  as?: string;
};

type ResolvedChangePlan = {
  kind: "change-row";
  index: number;
  row: ChangeRow;
  as?: string;
};

type Plan = ResolvedAddPlan | ResolvedSkipPlan | ResolvedChangePlan;
type AppendedPlan = ResolvedAddPlan | ResolvedChangePlan;
type ApplyValidationIssue = ValidationIssue & {
  op_index?: number;
  op_path?: string;
  op_as?: string;
};

export async function applyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  validateApplyRequestOrThrow(request);

  const ledgerPath = deps.workspace.paths.ledger;

  if (!Array.isArray(request.operations) || request.operations.length === 0) {
    return {
      created: [],
      skipped: [],
      warnings: [],
      novelty: [],
      meta: {
        rows_appended: 0,
        bytes_written: 0,
        ledger_path: ledgerPath,
        fingerprint_after: emptyFingerprint(ledgerPath),
      },
    };
  }

  const writeLedger = deps.writeLedger ?? defaultWriteLedger;
  const actor = stringOrUndef(request.actor) ?? deps.actor;
  const clock = buildClock(deps.runtime.clock, request.now);
  const classifyNovelty = deps.classifyNovelty ?? defaultNovelty;
  const dedupe = request.dedupe === true;

  const writeResult: LedgerWriteResult<ApplyResult> = await writeLedger(
    { path: ledgerPath, lockPath: deps.workspace.paths.lock },
    async (snapshot) => {
      const validation = validateLedger(snapshot.rows, snapshot.parseIssues);
      if (!validation.ok) {
        throw knbError(
          "validation_failed",
          "Ledger has pre-existing validation errors",
          { issues: validation.issues, path: ledgerPath },
        );
      }

      const snapshotIds = new Set<string>();
      for (const loaded of snapshot.rows) {
        const id = (loaded.row as { id?: unknown }).id;
        if (typeof id === "string" && id.length > 0) snapshotIds.add(id);
      }
      const snapshotById = new Map<string, KnbRow>();
      for (const loaded of snapshot.rows) {
        const id = (loaded.row as { id?: unknown }).id;
        if (typeof id === "string" && id.length > 0) snapshotById.set(id, loaded.row);
      }

      const aliasMap = new Map<string, string>();
      const appendedById = new Map<string, KnbRow>();
      const result: ApplyResult = {
        created: [],
        skipped: [],
        warnings: [],
        novelty: [],
        meta: {
          rows_appended: 0,
          bytes_written: 0,
          ledger_path: ledgerPath,
          fingerprint_after: emptyFingerprint(ledgerPath),
        },
      };
      const plans: Plan[] = [];

      for (let index = 0; index < request.operations.length; index += 1) {
        const operation = request.operations[index] as ApplyOperation;
        const aliasName = operationAlias(operation);
        if (operation.op === "add") {
          const completed = processAdd({
            operation,
            index,
            actor,
            clock,
            randomIdPart: deps.runtime.randomIdPart,
            snapshotIds,
            appendedById,
            aliasMap,
            snapshot,
            classifyNovelty,
            dedupe,
            result,
          });
          if (completed.kind === "add-row") {
            plans.push(completed);
            const completedId = completed.row.id;
            appendedById.set(completedId, completed.row);
            snapshotIds.add(completedId);
            aliasMap.set(`$op${index}`, completedId);
            if (aliasName) aliasMap.set(`$${aliasName}`, completedId);
            result.created.push({
              op: index,
              ...(aliasName ? { as: aliasName } : {}),
              id: completedId,
              kind: completed.row.kind,
            });
          } else {
            plans.push(completed);
            aliasMap.set(`$op${index}`, completed.matchedId);
            if (aliasName) aliasMap.set(`$${aliasName}`, completed.matchedId);
            result.skipped.push({
              op: index,
              reason: completed.reason,
              ...(completed.matchedIds.length > 0 ? { matched_ids: completed.matchedIds } : {}),
            });
          }
        } else {
          const change = processLifecycle({
            operation,
            index,
            actor,
            clock,
            randomIdPart: deps.runtime.randomIdPart,
            snapshotIds,
            snapshotById,
            appendedById,
            aliasMap,
          });
          plans.push(change);
          appendedById.set(change.row.id, change.row);
          snapshotIds.add(change.row.id);
          aliasMap.set(`$op${index}`, change.row.id);
          if (aliasName) aliasMap.set(`$${aliasName}`, change.row.id);
          result.created.push({
            op: index,
            ...(aliasName ? { as: aliasName } : {}),
            id: change.row.id,
            kind: change.row.kind,
          });
        }
      }

      const appendedRows: KnbRow[] = [];
      const appendedLineToPlan = new Map<number, AppendedPlan>();
      for (const plan of plans) {
        if (plan.kind === "add-row" || plan.kind === "change-row") {
          appendedRows.push(plan.row);
        }
      }

      const candidate: LoadedRow[] = [
        ...snapshot.rows.map((loaded) => ({ row: loaded.row, line: loaded.line })),
      ];
      for (let index = 0; index < appendedRows.length; index += 1) {
        const line = snapshot.rows.length + index + 1;
        const plan = findPlanForAppendedRow(plans, appendedRows[index] as KnbRow);
        if (plan) appendedLineToPlan.set(line, plan);
        candidate.push({
          row: appendedRows[index] as KnbRow,
          line,
        });
      }
      const finalValidation = validateLedger(candidate, snapshot.parseIssues);
      const finalIssues = annotateApplyValidationIssues(finalValidation.issues, appendedLineToPlan);
      if (!finalValidation.ok) {
        throw knbError(
          "validation_failed",
          "Apply produced an invalid ledger",
          { issues: finalIssues, path: ledgerPath },
        );
      }

      const firstAppendedLine = snapshot.rows.length + 1;
      for (const issue of finalIssues) {
        if (issue.level !== "warning") continue;
        if (typeof issue.line === "number" && issue.line < firstAppendedLine) continue;
        const code = issue.code ? `${issue.code}: ` : "";
        result.warnings.push(`${code}${issue.message}`);
      }

      return { rows: appendedRows, result };
    },
  );

  const finalResult = writeResult.result;
  finalResult.meta = {
    rows_appended: writeResult.rowsAppended,
    bytes_written: writeResult.bytesWritten,
    ledger_path: ledgerPath,
    fingerprint_after: writeResult.fingerprintAfter,
  };
  return finalResult;
}

export async function previewApplyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  const ledgerPath = deps.workspace.paths.ledger;
  const result = await applyOperations(request, {
    ...deps,
    writeLedger: async (options, transaction) => {
      const loadOptions: Parameters<typeof loadLedger>[0] = { path: options.path };
      if (options.readFile !== undefined) loadOptions.readFile = options.readFile;
      if (options.hash !== undefined) loadOptions.hash = options.hash;
      const snapshot = await loadLedger(loadOptions);
      const plan = await transaction(snapshot);
      return {
        result: plan.result,
        rowsRead: snapshot.rows.length,
        rowsAppended: plan.rows.length,
        bytesWritten: 0,
        fingerprintBefore: snapshot.fingerprint,
        fingerprintAfter: snapshot.fingerprint,
      };
    },
  });
  const plannedRows = result.meta.rows_appended;
  result.meta = {
    ...result.meta,
    rows_appended: 0,
    bytes_written: 0,
    ledger_path: ledgerPath,
    dry_run: true,
    planned_rows: plannedRows,
  };
  return result;
}

type ProcessAddArgs = {
  operation: Extract<ApplyOperation, { op: "add" }>;
  index: number;
  actor: string;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  appendedById: Map<string, KnbRow>;
  aliasMap: Map<string, string>;
  snapshot: LedgerSnapshot;
  classifyNovelty: (candidate: KnbRow, snapshot: LedgerSnapshot) => NoveltyDecision;
  dedupe: boolean;
  result: ApplyResult;
};

function processAdd(args: ProcessAddArgs): ResolvedAddPlan | ResolvedSkipPlan {
  const draft = args.operation.row;
  if (draft === null || typeof draft !== "object") {
    throw knbError("validation_failed", `Operation ${args.index}: add requires a row object`, {
      op_index: args.index,
    });
  }
  const kind = (draft as { kind?: unknown }).kind;
  if (typeof kind !== "string") {
    throw knbError("validation_failed", `Operation ${args.index}: row.kind must be a string`, {
      op_index: args.index,
    });
  }

  const resolvedDraft = resolveDraftReferences(draft, args.aliasMap, args.snapshotIds, args.index);

  const providedId = typeof resolvedDraft.id === "string" && resolvedDraft.id.length > 0 ? resolvedDraft.id : undefined;
  if (providedId) {
    if (args.snapshotIds.has(providedId) || args.appendedById.has(providedId)) {
      throw knbError(
        "duplicate_blocked",
        `Operation ${args.index}: id ${providedId} already exists`,
        { op_index: args.index, id: providedId },
      );
    }
  }

  const finalId = providedId ?? allocateId({
    kind: kind as KnbRowKind,
    scope: (resolvedDraft as { scope?: Scope }).scope ?? {},
    clock: args.clock,
    randomIdPart: args.randomIdPart,
    snapshotIds: args.snapshotIds,
    appendedById: args.appendedById,
    opIndex: args.index,
  });

  const draftWithId: DraftRow = { ...(resolvedDraft as DraftRow), id: finalId };
  const completion = completeDraftRow(draftWithId, {
    actor: args.actor,
    now: args.clock,
    randomIdPart: args.randomIdPart,
  });
  if (!completion.ok) {
    throw knbError(
      "validation_failed",
      `Operation ${args.index}: draft completion failed`,
      { op_index: args.index, issues: completion.issues },
    );
  }

  const candidateRow = completion.row;
  const novelty = candidateRow.kind === "claim"
    ? args.classifyNovelty(candidateRow, args.snapshot)
    : ({ classification: "new", matched_ids: [] } as NoveltyDecision);

  args.result.novelty.push({
    op: args.index,
    classification: novelty.classification,
    matched_ids: [...novelty.matched_ids],
  });

  if (args.dedupe && novelty.classification === "duplicate") {
    if (novelty.matched_ids.length === 1) {
      const matchedId = novelty.matched_ids[0] as string;
      return {
        kind: "skip",
        index: args.index,
        matchedId,
        matchedIds: [...novelty.matched_ids],
        reason: `duplicate of ${matchedId}`,
        ...(typeof args.operation.as === "string" ? { as: args.operation.as } : {}),
      };
    }
    throw knbError(
      "duplicate_blocked",
      `Operation ${args.index}: duplicate detected without unambiguous canonical id`,
      { op_index: args.index, matched_ids: novelty.matched_ids },
    );
  }

  return {
    kind: "add-row",
    index: args.index,
    row: candidateRow,
    ...(typeof args.operation.as === "string" ? { as: args.operation.as } : {}),
  };
}

type ProcessLifecycleArgs = {
  operation: Exclude<ApplyOperation, { op: "add" }>;
  index: number;
  actor: string;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  snapshotById: Map<string, KnbRow>;
  appendedById: Map<string, KnbRow>;
  aliasMap: Map<string, string>;
};

function processLifecycle(args: ProcessLifecycleArgs): ResolvedChangePlan {
  const op = args.operation;
  const change: ChangeRow["change"] = buildChangeBody(op, args);
  const targetRows = collectTargetRows(op, change, args);
  const scope = op.scope ?? deriveScope(targetRows, args.index);

  const draft: DraftRow = {
    kind: "change",
    scope,
    change,
  } as DraftRow;

  const id = allocateId({
    kind: "change",
    scope,
    clock: args.clock,
    randomIdPart: args.randomIdPart,
    snapshotIds: args.snapshotIds,
    appendedById: args.appendedById,
    opIndex: args.index,
  });
  const draftWithId = { ...draft, id } as DraftRow;
  const completion = completeDraftRow(draftWithId, {
    actor: args.actor,
    now: args.clock,
    randomIdPart: args.randomIdPart,
  });
  if (!completion.ok) {
    throw knbError(
      "validation_failed",
      `Operation ${args.index}: change row completion failed`,
      { op_index: args.index, issues: completion.issues },
    );
  }
  return {
    kind: "change-row",
    index: args.index,
    row: completion.row as ChangeRow,
    ...(typeof op.as === "string" ? { as: op.as } : {}),
  };
}

function buildChangeBody(
  op: Exclude<ApplyOperation, { op: "add" }>,
  args: ProcessLifecycleArgs,
): ChangeRow["change"] {
  if (op.op === "retract") {
    return {
      action: "retract",
      target_ids: op.target_ids.map((ref) => resolveRef(ref, args.aliasMap, args.snapshotIds, args.index)),
      reason: op.reason,
    };
  }
  if (op.op === "supersede") {
    return {
      action: "supersede",
      target_ids: op.target_ids.map((ref) => resolveRef(ref, args.aliasMap, args.snapshotIds, args.index)),
      replacement_id: resolveRef(op.replacement_id, args.aliasMap, args.snapshotIds, args.index),
      reason: op.reason,
    };
  }
  if (op.op === "merge") {
    return {
      action: "merge",
      target_ids: op.target_ids.map((ref) => resolveRef(ref, args.aliasMap, args.snapshotIds, args.index)),
      canonical_id: resolveRef(op.canonical_id, args.aliasMap, args.snapshotIds, args.index),
      reason: op.reason,
    };
  }
  if (op.op === "relate") {
    const relation: ChangeRow["change"]["relation"] = {
      from_id: resolveRef(op.from_id, args.aliasMap, args.snapshotIds, args.index),
      to_id: resolveRef(op.to_id, args.aliasMap, args.snapshotIds, args.index),
      rel: op.rel,
    };
    if (op.strength !== undefined) relation.strength = op.strength;
    if (op.rationale !== undefined) relation.rationale = op.rationale;
    return { action: "relate", relation };
  }
  return {
    action: "patch",
    target_id: resolveRef(op.target_id, args.aliasMap, args.snapshotIds, args.index),
    patch: op.patch,
    reason: op.reason,
  };
}

function collectTargetRows(
  op: Exclude<ApplyOperation, { op: "add" }>,
  change: ChangeRow["change"],
  args: ProcessLifecycleArgs,
): KnbRow[] {
  const ids = collectScopeAnchorIds(op, change);
  const rows: KnbRow[] = [];
  for (const id of ids) {
    const row = args.snapshotById.get(id) ?? args.appendedById.get(id);
    if (row) rows.push(row);
  }
  return rows;
}

function collectScopeAnchorIds(
  op: Exclude<ApplyOperation, { op: "add" }>,
  change: ChangeRow["change"],
): string[] {
  if (op.op === "relate") {
    return [change.relation?.from_id, change.relation?.to_id].filter((id): id is string => typeof id === "string");
  }
  if (op.op === "patch") {
    return change.target_id ? [change.target_id] : [];
  }
  const targets = change.target_ids ?? [];
  if (op.op === "supersede" && change.replacement_id) return [...targets, change.replacement_id];
  if (op.op === "merge" && change.canonical_id) return [...targets, change.canonical_id];
  return targets;
}

function deriveScope(targets: KnbRow[], opIndex: number): Scope {
  if (targets.length === 0) {
    throw knbError(
      "validation_failed",
      `Operation ${opIndex}: cannot derive scope without target rows`,
      { op_index: opIndex, code: "scope_anchor_required" },
    );
  }
  const collections = intersectScopeField(targets, "collections");
  if (collections.length > 0) return { collections };
  const subjects = intersectScopeField(targets, "subjects");
  if (subjects.length > 0) return { subjects };
  const tags = intersectScopeField(targets, "tags");
  if (tags.length > 0) return { tags };

  const first = targets[0] as KnbRow;
  const fallback = pickFirstAnchor(first.scope);
  if (!fallback) {
    throw knbError(
      "validation_failed",
      `Operation ${opIndex}: no target row has an anchored scope`,
      { op_index: opIndex, code: "scope_anchor_required" },
    );
  }
  return fallback;
}

function pickFirstAnchor(scope: Scope | undefined): Scope | undefined {
  if (!scope) return undefined;
  if (scope.collections && scope.collections.length > 0) {
    return { collections: [scope.collections[0] as string] };
  }
  if (scope.subjects && scope.subjects.length > 0) {
    return { subjects: [scope.subjects[0] as string] };
  }
  if (scope.tags && scope.tags.length > 0) {
    return { tags: [scope.tags[0] as string] };
  }
  return undefined;
}

function intersectScopeField(rows: KnbRow[], field: "collections" | "subjects" | "tags"): string[] {
  const first = rows[0]?.scope?.[field];
  if (!Array.isArray(first) || first.length === 0) return [];
  let acc = new Set<string>(first);
  for (let i = 1; i < rows.length; i += 1) {
    const next = rows[i]?.scope?.[field];
    if (!Array.isArray(next) || next.length === 0) return [];
    const nextSet = new Set(next);
    const filtered = new Set<string>();
    for (const value of acc) if (nextSet.has(value)) filtered.add(value);
    acc = filtered;
    if (acc.size === 0) return [];
  }
  return [...acc];
}

type AllocateIdArgs = {
  kind: KnbRowKind;
  scope: Scope;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  appendedById: Map<string, KnbRow>;
  opIndex: number;
};

function allocateId(args: AllocateIdArgs): string {
  const slug = scopeSlug(args.scope);
  if (!slug) {
    throw knbError(
      "validation_failed",
      `Operation ${args.opIndex}: scope must include at least one collection, subject, or tag`,
      { op_index: args.opIndex, code: "scope_anchor_required" },
    );
  }
  const date = args.clock();
  for (let attempt = 0; attempt < ID_COLLISION_RETRY_LIMIT; attempt += 1) {
    const id = generateId(args.kind, slug, date, args.randomIdPart);
    if (!args.snapshotIds.has(id) && !args.appendedById.has(id)) return id;
  }
  throw knbError(
    "duplicate_blocked",
    `Operation ${args.opIndex}: ID collision retries exhausted`,
    { op_index: args.opIndex, kind: args.kind, slug },
  );
}

function resolveDraftReferences(
  draft: DraftRow,
  aliasMap: Map<string, string>,
  snapshotIds: Set<string>,
  opIndex: number,
): DraftRow {
  const cloned = cloneJson(draft) as DraftRow & Record<string, unknown>;

  const provenance = (cloned as { provenance?: unknown }).provenance;
  if (provenance && typeof provenance === "object") {
    const prov = provenance as Record<string, unknown>;
    if (Array.isArray(prov.source_ids)) {
      prov.source_ids = prov.source_ids.map((ref) =>
        typeof ref === "string" ? resolveRef(ref, aliasMap, snapshotIds, opIndex) : ref,
      );
    }
    if (Array.isArray(prov.evidence)) {
      for (const item of prov.evidence) {
        if (item && typeof item === "object") {
          const entry = item as Record<string, unknown>;
          if (typeof entry.source_id === "string") {
            entry.source_id = resolveRef(entry.source_id, aliasMap, snapshotIds, opIndex);
          }
        }
      }
    }
  }

  const relations = (cloned as { relations?: unknown }).relations;
  if (Array.isArray(relations)) {
    for (const item of relations) {
      if (item && typeof item === "object") {
        const entry = item as Record<string, unknown>;
        if (typeof entry.target_id === "string") {
          entry.target_id = resolveRef(entry.target_id, aliasMap, snapshotIds, opIndex);
        }
      }
    }
  }

  const synthesis = (cloned as { synthesis?: unknown }).synthesis;
  if (synthesis && typeof synthesis === "object") {
    const basis = (synthesis as { basis?: unknown }).basis;
    if (basis && typeof basis === "object") {
      const obj = basis as Record<string, unknown>;
      for (const field of ["claim_ids", "question_ids", "source_ids"] as const) {
        const value = obj[field];
        if (Array.isArray(value)) {
          obj[field] = value.map((ref) =>
            typeof ref === "string" ? resolveRef(ref, aliasMap, snapshotIds, opIndex) : ref,
          );
        }
      }
    }
  }

  const question = (cloned as { question?: unknown }).question;
  if (question && typeof question === "object") {
    const q = question as Record<string, unknown>;
    if (typeof q.answer_claim_id === "string") {
      q.answer_claim_id = resolveRef(q.answer_claim_id, aliasMap, snapshotIds, opIndex);
    }
  }

  return cloned as DraftRow;
}

function resolveRef(
  ref: string,
  aliasMap: Map<string, string>,
  snapshotIds: Set<string>,
  opIndex: number,
): string {
  if (typeof ref !== "string" || ref.length === 0) {
    throw knbError("broken_reference", `Operation ${opIndex}: empty reference`, { op_index: opIndex });
  }
  if (ref.startsWith("$")) {
    const resolved = aliasMap.get(ref);
    if (!resolved) {
      throw knbError(
        "broken_reference",
        `Operation ${opIndex}: forward or unknown alias ${ref}`,
        { op_index: opIndex, ref },
      );
    }
    return resolved;
  }
  if (snapshotIds.has(ref)) return ref;
  throw knbError(
    "broken_reference",
    `Operation ${opIndex}: unknown id ${ref}`,
    { op_index: opIndex, ref },
  );
}

function findPlanForAppendedRow(plans: Plan[], row: KnbRow): AppendedPlan | undefined {
  for (const plan of plans) {
    if ((plan.kind === "add-row" || plan.kind === "change-row") && plan.row === row) return plan;
  }
  return undefined;
}

function validateApplyRequestOrThrow(request: ApplyRequest): void {
  const validation = validateApplyRequest(request);
  if (validation.ok) return;
  const issues = annotateApplyRequestIssues(validation.issues);
  const unsafe = issues.find((issue) => issue.code === "unsafe_operation_refused");
  if (unsafe) {
    throw knbError(
      "unsafe_operation_refused",
      unsafe.message,
      { path: unsafe.path, issues },
    );
  }
  throw knbError(
    "validation_failed",
    "Apply request failed validation",
    { issues },
  );
}

function annotateApplyRequestIssues(issues: ValidationIssue[]): ApplyValidationIssue[] {
  return issues.map((issue) => {
    const opPath = issue.path;
    const opIndex = operationIndexFromPath(opPath);
    if (opIndex === undefined || opPath === undefined) return issue;
    return {
      ...issue,
      op_index: opIndex,
      op_path: opPath,
    };
  });
}

function annotateApplyValidationIssues(
  issues: ValidationIssue[],
  appendedLineToPlan: Map<number, AppendedPlan>,
): ApplyValidationIssue[] {
  return issues.map((issue) => {
    if (typeof issue.line !== "number") return issue;
    const plan = appendedLineToPlan.get(issue.line);
    if (!plan) return issue;
    const annotated: ApplyValidationIssue = {
      ...issue,
      op_index: plan.index,
      op_path: operationPathForIssue(plan, issue),
    };
    if (plan.as !== undefined) annotated.op_as = plan.as;
    return annotated;
  });
}

function operationPathForIssue(plan: AppendedPlan, issue: ValidationIssue): string {
  const prefix = `operations[${plan.index}]`;
  if (plan.kind === "add-row") {
    return issue.path ? `${prefix}.row.${issue.path}` : `${prefix}.row`;
  }
  const suffix = lifecycleOperationSuffix(issue.path);
  return suffix ? `${prefix}.${suffix}` : prefix;
}

function lifecycleOperationSuffix(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path === "change.relation.from_id") return "from_id";
  if (path === "change.relation.to_id") return "to_id";
  if (path === "change.relation.rel") return "rel";
  if (path === "change.relation.strength") return "strength";
  if (path === "change.relation.rationale") return "rationale";
  if (path.startsWith("change.")) return path.slice("change.".length);
  if (path === "scope") return "scope";
  return undefined;
}

function operationIndexFromPath(path: string | undefined): number | undefined {
  const match = /^operations\[(\d+)\](?:\.|$)/.exec(path ?? "");
  if (!match) return undefined;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) ? index : undefined;
}

function operationAlias(op: ApplyOperation): string | undefined {
  return typeof op.as === "string" && op.as.length > 0 ? op.as : undefined;
}

function buildClock(base: () => Date, requestNow: string | undefined): () => Date {
  if (typeof requestNow !== "string" || requestNow.length === 0) return base;
  const parsed = new Date(requestNow);
  if (Number.isNaN(parsed.getTime())) return base;
  return () => new Date(parsed.getTime());
}

function defaultNovelty(): NoveltyDecision {
  return { classification: "new", matched_ids: [] };
}

function emptyFingerprint(path: string): LedgerFingerprint {
  return {
    path,
    rows: 0,
    bytes: 0,
    content_hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  };
}

function stringOrUndef(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
