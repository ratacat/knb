// Apply module - V1 single deep module for atomic operation batches.
// Owns reference resolution, ID generation with collision retry, lifecycle
// change-row construction, novelty hooks, and final candidate-ledger
// validation. Writes only through the ledger transaction; never touches
// the filesystem directly.

import {
  completeDraftRow,
  generateId,
  referenceFields,
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
  type Provenance,
  type Scope,
  type ValidationIssue,
} from "./contract";
import { isKnbError, knbError, type KnbErrorCode } from "./errors";
import {
  loadLedger,
  writeLedger as defaultWriteLedger,
  type LedgerFingerprint,
  type LedgerSnapshot,
  type LedgerWriteResult,
} from "./ledger";
import { isSafeRunManifestId, writeRunManifest as defaultWriteRunManifest, type RunManifest } from "./run-manifests";

const ID_COLLISION_RETRY_LIMIT = 8;

export function generateRunId(
  date: Date,
  randomIdPart: (bytes: number) => string,
  existingRandomPart?: string,
): string {
  const safeIso = date.toISOString().replace(/[:.]/g, "-");
  return `run_${safeIso}_${existingRandomPart ?? randomIdPart(4)}`;
}

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
  workspace: { paths: { ledger: string; lock: string; runs?: string } };
  runtime: { clock: () => Date; randomIdPart: (bytes: number) => string };
  actor: string;
  writeLedger?: typeof defaultWriteLedger;
  writeRunManifest?: typeof defaultWriteRunManifest | false;
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
  run_id: string;
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

type ApplyPlanningIssue = ApplyValidationIssue & {
  error_code: KnbErrorCode;
  ref?: string;
  id?: string;
  matched_ids?: string[];
};

export async function applyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  validateApplyRequestOrThrow(request);

  const ledgerPath = deps.workspace.paths.ledger;
  const actor = stringOrUndef(request.actor) ?? deps.actor;
  const clock = buildClockOrThrow(deps.runtime.clock, request.now);
  const startedAt = clock();
  const requestedRunId = stringOrUndef(request.run_id);
  if (requestedRunId !== undefined && !isSafeRunManifestId(requestedRunId)) {
    throw knbError("validation_failed", "Apply request failed validation", {
      issues: [
        {
          level: "error",
          code: "run_id_unsafe",
          message: `run_id is not safe for manifest filename: ${requestedRunId}`,
          path: "run_id",
        },
      ],
    });
  }

  if (!Array.isArray(request.operations) || request.operations.length === 0) {
    return {
      run_id: requestedRunId ?? generateRunId(startedAt, deps.runtime.randomIdPart),
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
        run_id: "",
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
      const planningIssues: ApplyPlanningIssue[] = [];
      const invalidAliasRefs = new Set<string>();

      for (let index = 0; index < request.operations.length; index += 1) {
        const operation = request.operations[index] as ApplyOperation;
        const aliasName = operationAlias(operation);
        try {
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
        } catch (error) {
          markFailedAliases(index, aliasName, invalidAliasRefs);
          if (isDependentAliasError(error, invalidAliasRefs)) continue;
          planningIssues.push(...planningIssuesFromError(error, index, aliasName));
        }
      }

      const runId = planningIssues.length === 0
        ? requestedRunId ??
          generateRunId(startedAt, deps.runtime.randomIdPart, randomPartFromFirstCreated(result))
        : "";
      if (runId !== "" && ledgerHasRunId(snapshot.rows, runId)) {
        throw knbError("validation_failed", "Apply request failed validation", {
          issues: [
            {
              level: "error",
              code: "run_id_duplicate",
              message: `run_id already exists in ledger provenance: ${runId}`,
              path: "run_id",
            },
          ],
        });
      }
      if (planningIssues.length === 0) result.run_id = runId;

      const appendedRows: KnbRow[] = [];
      const appendedLineToPlan = new Map<number, AppendedPlan>();
      for (const plan of plans) {
        if (plan.kind === "add-row" || plan.kind === "change-row") {
          if (planningIssues.length === 0) {
            plan.row = withRunProvenance(plan.row, runId, actor) as typeof plan.row;
          }
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
      if (planningIssues.length > 0 || !finalValidation.ok) {
        const allIssues = [
          ...planningIssues.map(publicPlanningIssue),
          ...finalIssues.filter((issue) => issue.level === "error"),
        ];
        throw aggregatedApplyError(planningIssues, allIssues, ledgerPath);
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

  const writeRunManifest = deps.writeRunManifest ?? defaultWriteRunManifest;
  if (writeRunManifest !== false && writeResult.rowsAppended > 0) {
    const manifest: RunManifest = {
      schema_version: "knb.run.v1",
      run_id: finalResult.run_id,
      actor,
      started_at: startedAt.toISOString(),
      completed_at: clock().toISOString(),
      rows_appended: writeResult.rowsAppended,
      row_ids: finalResult.created.map((entry) => entry.id),
    };
    const intent = stringOrUndef(request.intent);
    if (intent !== undefined) manifest.intent = intent;

    // Run manifests are observability sidecars. The ledger append is canonical,
    // so a manifest write failure is reported as a warning instead of rolling
    // back an otherwise valid apply.
    try {
      await writeRunManifest(deps.workspace, manifest);
    } catch (error) {
      finalResult.warnings.push(`run_manifest_write_failed: ${errorMessage(error)}`);
    }
  }
  return finalResult;
}

export async function previewApplyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  const ledgerPath = deps.workspace.paths.ledger;
  const result = await applyOperations(request, {
    ...deps,
    writeRunManifest: false,
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
  const rawDraft: DraftRow = {
    kind: "change",
    scope: {},
    change: buildChangeBody(op),
  } as DraftRow;
  const resolvedDraft = resolveDraftReferences(rawDraft, args.aliasMap, args.snapshotIds, args.index);
  const change = (resolvedDraft as { change: ChangeRow["change"] }).change;
  const targetRows = collectTargetRows(change, args);
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
): ChangeRow["change"] {
  if (op.op === "retract") {
    return {
      action: "retract",
      target_ids: [...op.target_ids],
      reason: op.reason,
    };
  }
  if (op.op === "supersede") {
    return {
      action: "supersede",
      target_ids: [...op.target_ids],
      replacement_id: op.replacement_id,
      reason: op.reason,
    };
  }
  if (op.op === "merge") {
    return {
      action: "merge",
      target_ids: [...op.target_ids],
      canonical_id: op.canonical_id,
      reason: op.reason,
    };
  }
  if (op.op === "relate") {
    const relation: ChangeRow["change"]["relation"] = {
      from_id: op.from_id,
      to_id: op.to_id,
      rel: op.rel,
    };
    if (op.strength !== undefined) relation.strength = op.strength;
    if (op.rationale !== undefined) relation.rationale = op.rationale;
    return { action: "relate", relation };
  }
  return {
    action: "patch",
    target_id: op.target_id,
    patch: op.patch,
    reason: op.reason,
  };
}

function collectTargetRows(
  change: ChangeRow["change"],
  args: ProcessLifecycleArgs,
): KnbRow[] {
  const ids = collectScopeAnchorIds(change);
  const rows: KnbRow[] = [];
  for (const id of ids) {
    const row = args.snapshotById.get(id) ?? args.appendedById.get(id);
    if (row) rows.push(row);
  }
  return rows;
}

function collectScopeAnchorIds(change: ChangeRow["change"]): string[] {
  const draft: DraftRow = {
    kind: "change",
    scope: {},
    change,
  } as DraftRow;
  return [...referenceFields(draft)].map((slot) => slot.get());
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

  for (const slot of referenceFields(cloned)) {
    slot.set(resolveRef(slot.get(), aliasMap, snapshotIds, opIndex));
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

function markFailedAliases(index: number, aliasName: string | undefined, refs: Set<string>): void {
  refs.add(`$op${index}`);
  if (aliasName !== undefined) refs.add(`$${aliasName}`);
}

function isDependentAliasError(error: unknown, invalidAliasRefs: Set<string>): boolean {
  if (!isKnbError(error)) return false;
  if (error.code !== "broken_reference") return false;
  const ref = error.details?.ref;
  return typeof ref === "string" && invalidAliasRefs.has(ref);
}

function planningIssuesFromError(
  error: unknown,
  opIndex: number,
  aliasName: string | undefined,
): ApplyPlanningIssue[] {
  if (!isKnbError(error)) throw error;
  const details = error.details ?? {};
  const rawIssues = Array.isArray(details.issues) ? details.issues : undefined;
  if (rawIssues !== undefined && rawIssues.length > 0) {
    return rawIssues.map((raw) => {
      const source = isRecord(raw) ? raw : {};
      return buildPlanningIssue(error.code, error.message, source, details, opIndex, aliasName);
    });
  }
  return [buildPlanningIssue(error.code, error.message, {}, details, opIndex, aliasName)];
}

function buildPlanningIssue(
  errorCode: KnbErrorCode,
  fallbackMessage: string,
  issueSource: Record<string, unknown>,
  detailSource: Record<string, unknown>,
  fallbackOpIndex: number,
  aliasName: string | undefined,
): ApplyPlanningIssue {
  const code = firstString(issueSource.code, detailSource.code, errorCode);
  const message = firstString(issueSource.message, fallbackMessage) ?? fallbackMessage;
  const issue: ApplyPlanningIssue = {
    level: "error",
    code,
    message,
    error_code: errorCode,
    op_index: firstNumber(issueSource.op_index, detailSource.op_index) ?? fallbackOpIndex,
  };

  const path = firstString(issueSource.path, detailSource.path);
  if (path !== undefined) issue.path = path;
  const opPath = firstString(issueSource.op_path, detailSource.op_path);
  if (opPath !== undefined) issue.op_path = opPath;
  const id = firstString(issueSource.id, detailSource.id);
  if (id !== undefined) issue.id = id;
  const ref = firstString(issueSource.ref, detailSource.ref);
  if (ref !== undefined) issue.ref = ref;
  const matchedIds = firstStringArray(issueSource.matched_ids, detailSource.matched_ids);
  if (matchedIds !== undefined) issue.matched_ids = matchedIds;
  if (aliasName !== undefined) issue.op_as = aliasName;
  return issue;
}

function publicPlanningIssue(issue: ApplyPlanningIssue): ApplyValidationIssue & {
  ref?: string;
  matched_ids?: string[];
} {
  const { error_code: _errorCode, ...publicIssue } = issue;
  return publicIssue;
}

function aggregatedApplyError(
  planningIssues: ApplyPlanningIssue[],
  allIssues: Array<ApplyValidationIssue | ReturnType<typeof publicPlanningIssue>>,
  ledgerPath: string,
): never {
  const first = planningIssues[0];
  const errorCode = first?.error_code ?? "validation_failed";
  const details: Record<string, unknown> = { issues: allIssues, path: ledgerPath };
  if (first?.code !== undefined) details.code = first.code;
  if (first?.op_index !== undefined) details.op_index = first.op_index;
  if (first?.op_path !== undefined) details.op_path = first.op_path;
  if (first?.ref !== undefined) details.ref = first.ref;
  if (first?.id !== undefined) details.id = first.id;
  if (first?.matched_ids !== undefined) details.matched_ids = first.matched_ids;
  throw knbError(errorCode, "Apply failed validation", details);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  }
  return undefined;
}

function firstStringArray(...values: unknown[]): string[] | undefined {
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    const strings = value.filter((item): item is string => typeof item === "string");
    if (strings.length === value.length) return strings;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

function buildClockOrThrow(base: () => Date, requestNow: string | undefined): () => Date {
  if (typeof requestNow !== "string" || requestNow.length === 0) return base;
  const parsed = new Date(requestNow);
  if (Number.isNaN(parsed.getTime())) {
    throw knbError("validation_failed", "Apply request failed validation", {
      issues: [
        {
          level: "error",
          code: "now_invalid",
          message: `now must be a valid ISO timestamp: ${requestNow}`,
          path: "now",
        },
      ],
    });
  }
  return () => new Date(parsed.getTime());
}

function ledgerHasRunId(rows: LoadedRow[], runId: string): boolean {
  return rows.some((loaded) => {
    const acquisition = (loaded.row as { provenance?: { acquisition?: { run_id?: unknown } } }).provenance?.acquisition;
    return acquisition?.run_id === runId;
  });
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

function randomPartFromFirstCreated(result: ApplyResult): string | undefined {
  const firstId = result.created[0]?.id;
  if (typeof firstId !== "string") return undefined;
  const lastColon = firstId.lastIndexOf(":");
  if (lastColon < 0) return undefined;
  const suffix = firstId.slice(lastColon + 1);
  return suffix.length > 0 ? suffix : undefined;
}

function withRunProvenance(row: KnbRow, runId: string, agent: string): KnbRow {
  if (row.kind === "change") return row;
  const current = (row as { provenance?: Provenance }).provenance ?? {};
  const acquisition = {
    ...(current.acquisition ?? {}),
    run_id: runId,
    agent,
  };
  return {
    ...row,
    provenance: {
      ...current,
      acquisition,
    },
  } as KnbRow;
}

function stringOrUndef(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return String(error);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}
