// Knb facade - V1 public library entry point.
// Composes workspace, ledger, contract, read-snapshot, apply, query, context,
// novelty, and projections into one object that the CLI and host applications
// call.

import { randomBytes } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

import { applyOperations, previewApplyOperations, type ApplyResult } from "./apply";
import {
  buildContext,
  type ContextRequest,
  type ContextResult,
} from "./context";
import {
  jsonSchema,
  operationSamples,
  rowSamples,
  type ApplyOperation,
  type ApplyRequest,
  type DraftRow,
  type KnbRow,
  type QuestionRow,
  type SynthesisRow,
  type ValidationIssue,
} from "./contract";
import { knbError } from "./errors";
import type { LedgerFingerprint, ParseIssue } from "./ledger";
import {
  classifyClaim,
  type CandidateClaim,
  type NoveltyResult,
} from "./novelty";
import {
  JsonProjectionArtifactStore,
  type FreshnessReport,
  type IndexResult,
  type RenderAllRequest,
  type RenderAllResult,
  type RenderRequest,
  type RenderResult,
} from "./projections";
import {
  executeGet,
  executeQuery,
  type GetRequest,
  type GetResult,
  type QueryRequest,
  type QueryResult,
} from "./query";
import {
  readSnapshot,
  type KnbReadSnapshot,
  type ProjectionFreshness,
} from "./read-snapshot";
import { buildEffectiveState, type EffectiveState, type StateWarning } from "./state";
import { openWorkspace, type KnbWorkspace, type OpenWorkspaceOptions } from "./workspace";

export type KnbRuntime = {
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
};

export type OpenKnbOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  actor?: string;
  runtime?: Partial<KnbRuntime>;
  env?: NodeJS.ProcessEnv;
  cwd?: () => string;
};

export type KnbStatus = {
  workspace_root: string;
  ledger_path: string;
  schema_version: "knb.v1";
  actor: string;
  row_count: number;
  parse_error_count: number;
  validation_error_count: number;
  validation_warning_count: number;
  state_warning_count: number;
  active_counts_by_kind: Record<string, number>;
  inactive_counts_by_status: Record<string, number>;
  projection_freshness: ProjectionFreshness;
};

export type CollectionStatusRequest = {
  collection: string;
  max_questions?: number;
};

export type CollectionStatusResult = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  inactive_counts_by_status: Record<string, number>;
  latest_synthesis?: {
    id: string;
    title: string;
    created_at: string;
    summary: string;
    limitations?: string;
  };
  open_question_count: number;
  open_questions: Array<{
    id: string;
    text: string;
    created_at: string;
    priority?: "low" | "medium" | "high";
    why_it_matters?: string;
  }>;
};

export type SchemaResult = {
  schema_version: "knb.v1";
  json_schema: object;
  row_samples: KnbRow[];
  operation_samples: ApplyOperation[];
};

export type InitOptions = {
  force?: boolean;
  actor?: string;
};

export type InitResult = {
  workspace_root: string;
  created_paths: string[];
  ledger_path: string;
  config_path: string;
  schema_path: string;
};

export type CheckResult = {
  ok: boolean;
  parse_issues: ParseIssue[];
  validation_issues: ValidationIssue[];
  state_warnings: StateWarning[];
  projection_freshness: FreshnessReport;
  fingerprint: LedgerFingerprint;
};

export type NoveltyRequest = {
  candidates: CandidateClaim[];
};

export type NoveltyBatchResult = {
  results: NoveltyResult[];
};

export type Knb = {
  workspace: KnbWorkspace;
  runtime: KnbRuntime;
  init(options?: InitOptions): Promise<InitResult>;
  status(): Promise<KnbStatus>;
  collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult>;
  schema(): Promise<SchemaResult>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  previewApply(request: ApplyRequest): Promise<ApplyResult>;
  add(row: DraftRow): Promise<ApplyResult>;
  get(ids: string[], options?: Omit<GetRequest, "ids">): Promise<GetResult>;
  query(request: QueryRequest): Promise<QueryResult>;
  context(request: ContextRequest): Promise<ContextResult>;
  novelty(request: NoveltyRequest): Promise<NoveltyBatchResult>;
  render(request: RenderRequest): Promise<RenderResult>;
  renderAll(request?: RenderAllRequest): Promise<RenderAllResult>;
  check(): Promise<CheckResult>;
  rebuildIndex(): Promise<IndexResult>;
};

export function defaultRuntime(): KnbRuntime {
  return {
    clock: () => new Date(),
    randomIdPart: (bytes: number) => randomBytes(bytes).toString("hex").slice(0, 8).toLowerCase(),
  };
}

export async function openKnb(options: OpenKnbOptions = {}): Promise<Knb> {
  const wsOptions: OpenWorkspaceOptions = {};
  if (options.root !== undefined) wsOptions.root = options.root;
  if (options.configPath !== undefined) wsOptions.configPath = options.configPath;
  if (options.ledgerPath !== undefined) wsOptions.ledgerPath = options.ledgerPath;
  if (options.actor !== undefined) wsOptions.actor = options.actor;
  if (options.env !== undefined) wsOptions.env = options.env;
  if (options.cwd !== undefined) wsOptions.cwd = options.cwd;

  const workspace = await openWorkspace(wsOptions);

  const baseRuntime = defaultRuntime();
  const runtime: KnbRuntime = {
    clock: options.runtime?.clock ?? baseRuntime.clock,
    randomIdPart: options.runtime?.randomIdPart ?? baseRuntime.randomIdPart,
  };

  return makeKnb(workspace, runtime);
}

function makeKnb(workspace: KnbWorkspace, runtime: KnbRuntime): Knb {
  const projectionArtifacts = new JsonProjectionArtifactStore(workspace, runtime.clock);
  const projectionFreshness = (_workspace: KnbWorkspace, ledger_fingerprint: LedgerFingerprint) =>
    projectionArtifacts.checkFreshness(ledger_fingerprint);

  const facade: Knb = {
    workspace,
    runtime,
    async init(initOptions: InitOptions = {}): Promise<InitResult> {
      return performInit(workspace, initOptions);
    },
    async status(): Promise<KnbStatus> {
      const snapshot = await readSnapshot({ workspace, freshness: projectionFreshness });
      return statusFromSnapshot(workspace, snapshot);
    },
    async collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "collectionStatus");
      return collectionStatusFromState(state, request);
    },
    async schema(): Promise<SchemaResult> {
      return buildSchemaResult();
    },
    async apply(request: ApplyRequest): Promise<ApplyResult> {
      return applyOperations(request, {
        workspace,
        runtime,
        actor: workspace.actor,
        classifyNovelty: noveltyBridge,
      });
    },
    async previewApply(request: ApplyRequest): Promise<ApplyResult> {
      return previewApplyOperations(request, {
        workspace,
        runtime,
        actor: workspace.actor,
        classifyNovelty: noveltyBridge,
      });
    },
    async add(row: DraftRow): Promise<ApplyResult> {
      const operation = { op: "add", row } as ApplyOperation;
      return facade.apply({ operations: [operation] });
    },
    async get(ids: string[], getOptions: Omit<GetRequest, "ids"> = {}): Promise<GetResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "get");
      const request: GetRequest = { ids };
      if (getOptions.includeHistory !== undefined) request.includeHistory = getOptions.includeHistory;
      if (getOptions.explain !== undefined) request.explain = getOptions.explain;
      return executeGet(state, request);
    },
    async query(request: QueryRequest): Promise<QueryResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "query");
      return executeQuery(state, request);
    },
    async context(request: ContextRequest): Promise<ContextResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "context");
      return buildContext(state, request);
    },
    async novelty(request: NoveltyRequest): Promise<NoveltyBatchResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "novelty");
      const candidates = Array.isArray(request?.candidates) ? request.candidates : [];
      const results = candidates.map((candidate) => classifyClaim(candidate, state));
      return { results };
    },
    async render(request: RenderRequest): Promise<RenderResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "render");
      return projectionArtifacts.renderCollection(state, snapshot.fingerprint, request);
    },
    async renderAll(request: RenderAllRequest = {}): Promise<RenderAllResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "renderAll");
      return projectionArtifacts.renderAllCollections(state, snapshot.fingerprint, request);
    },
    async check(): Promise<CheckResult> {
      const snapshot = await readSnapshot({ workspace, freshness: projectionFreshness });
      return checkFromSnapshot(snapshot);
    },
    async rebuildIndex(): Promise<IndexResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "rebuildIndex");
      return projectionArtifacts.rebuildIndexes(state, snapshot.fingerprint);
    },
  };
  return facade;
}

const noveltyBridge: NonNullable<Parameters<typeof applyOperations>[1]["classifyNovelty"]> = (
  candidate,
  ledgerSnapshot,
) => {
  if (candidate.kind !== "claim") {
    return { classification: "new", matched_ids: [] };
  }
  const loaded = ledgerSnapshot.rows.map(({ row, line }) => ({ row, line }));
  const state = buildEffectiveState(loaded);
  const result = classifyClaim(candidate as CandidateClaim, state);
  return { classification: result.classification, matched_ids: result.matched_ids };
};

function requireState(snapshot: KnbReadSnapshot, op: string): EffectiveState {
  if (!snapshot.state) {
    const errors = snapshot.validation.issues.filter((issue) => issue.level === "error");
    const parseErrors = snapshot.ledger.parseIssues;
    if (parseErrors.length > 0) {
      throw knbError(
        "io_failed",
        `${op} requires a parseable ledger`,
        { path: snapshot.ledger.fingerprint.path, parse_issues: parseErrors },
      );
    }
    throw knbError(
      "validation_failed",
      `${op} requires a valid ledger`,
      { issues: errors },
    );
  }
  return snapshot.state;
}

async function performInit(workspace: KnbWorkspace, options: InitOptions): Promise<InitResult> {
  const created: string[] = [];
  const force = options.force === true;

  await ensureDir(workspace.root);

  const configPath = workspace.paths.config;
  const configExists = await pathExists(configPath);
  if (!configExists || force) {
    await ensureDir(dirname(configPath));
    const seedConfig = options.actor && options.actor.length > 0 ? { actor: options.actor } : {};
    await writeFile(configPath, `${JSON.stringify(seedConfig, null, 2)}\n`, "utf8");
    created.push(relativeToRoot(workspace.root, configPath));
  }

  const viewsDir = workspace.paths.views;
  const viewsExisted = await pathExists(viewsDir);
  await ensureDir(viewsDir);
  if (!viewsExisted) created.push(relativeToRoot(workspace.root, viewsDir));

  const indexesDir = workspace.paths.indexes;
  const indexesExisted = await pathExists(indexesDir);
  await ensureDir(indexesDir);
  if (!indexesExisted) created.push(relativeToRoot(workspace.root, indexesDir));

  const ledgerPath = workspace.paths.ledger;
  if (!(await pathExists(ledgerPath))) {
    await ensureDir(dirname(ledgerPath));
    await writeFile(ledgerPath, "", "utf8");
    created.push(relativeToRoot(workspace.root, ledgerPath));
  }

  const schemaPath = workspace.paths.schema;
  await ensureDir(dirname(schemaPath));
  const schemaText = `${JSON.stringify(jsonSchema(), null, 2)}\n`;
  await writeFile(schemaPath, schemaText, "utf8");
  created.push(relativeToRoot(workspace.root, schemaPath));

  return {
    workspace_root: workspace.root,
    created_paths: created,
    ledger_path: ledgerPath,
    config_path: configPath,
    schema_path: schemaPath,
  };
}

function statusFromSnapshot(workspace: KnbWorkspace, snapshot: KnbReadSnapshot): KnbStatus {
  const activeCounts: Record<string, number> = {};
  if (snapshot.state) {
    const activeRows = snapshot.state.rows({ includeChanges: true });
    for (const er of activeRows) {
      const kind = er.row.kind;
      if (typeof kind !== "string") continue;
      activeCounts[kind] = (activeCounts[kind] ?? 0) + 1;
    }
  } else {
    for (const loaded of snapshot.ledger.rows) {
      const kind = (loaded.row as { kind?: unknown }).kind;
      if (typeof kind !== "string") continue;
      activeCounts[kind] = (activeCounts[kind] ?? 0) + 1;
    }
  }

  const inactiveCounts: Record<string, number> = {};
  if (snapshot.state) {
    for (const status of ["retracted", "superseded", "duplicate", "archived"] as const) {
      const count = snapshot.state.rows({ status, includeChanges: true }).length;
      if (count > 0) inactiveCounts[status] = count;
    }
  }

  const parseErrorCount = snapshot.ledger.parseIssues.filter((issue) => issue.level === "error").length;
  const validationErrorCount = snapshot.validation.issues.filter((issue) => issue.level === "error").length;
  const validationWarningCount = snapshot.validation.issues.filter((issue) => issue.level === "warning").length;
  const stateWarningCount = snapshot.state?.warnings.length ?? 0;

  return {
    workspace_root: workspace.root,
    ledger_path: workspace.paths.ledger,
    schema_version: "knb.v1",
    actor: workspace.actor,
    row_count: snapshot.ledger.rows.length,
    parse_error_count: parseErrorCount,
    validation_error_count: validationErrorCount,
    validation_warning_count: validationWarningCount,
    state_warning_count: stateWarningCount,
    active_counts_by_kind: activeCounts,
    inactive_counts_by_status: inactiveCounts,
    projection_freshness: snapshot.projectionFreshness,
  };
}

function collectionStatusFromState(
  state: EffectiveState,
  request: CollectionStatusRequest,
): CollectionStatusResult {
  const collection = typeof request.collection === "string" ? request.collection.trim() : "";
  if (collection.length === 0) {
    throw knbError("validation_failed", "Collection status requires a non-empty collection", {
      collection: request.collection,
    });
  }

  const activeRows = state.rows({ collection, includeChanges: true });
  const activeCounts: Record<string, number> = {};
  for (const er of activeRows) {
    activeCounts[er.row.kind] = (activeCounts[er.row.kind] ?? 0) + 1;
  }

  const inactiveCounts: Record<string, number> = {};
  for (const status of ["retracted", "superseded", "duplicate", "archived"] as const) {
    const count = state.rows({ status, collection, includeChanges: true }).length;
    if (count > 0) inactiveCounts[status] = count;
  }

  const activeContentRows = state.rows({ collection, includeChanges: false });
  const latestSynthesis = activeContentRows
    .map((er) => er.row)
    .filter((row): row is SynthesisRow => row.kind === "synthesis" && row.synthesis.status === "active")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const openQuestions = activeContentRows
    .map((er) => er.row)
    .filter((row): row is QuestionRow => row.kind === "question" && row.question.status === "open")
    .sort(byQuestionPriorityThenCreated);

  const maxQuestions =
    typeof request.max_questions === "number" && Number.isFinite(request.max_questions)
      ? Math.max(0, Math.floor(request.max_questions))
      : 12;

  const result: CollectionStatusResult = {
    collection,
    active_counts_by_kind: activeCounts,
    inactive_counts_by_status: inactiveCounts,
    open_question_count: openQuestions.length,
    open_questions: openQuestions.slice(0, maxQuestions).map((row) => ({
      id: row.id,
      text: row.question.text,
      created_at: row.created_at,
      ...(row.question.priority !== undefined ? { priority: row.question.priority } : {}),
      ...(row.question.why_it_matters !== undefined
        ? { why_it_matters: row.question.why_it_matters }
        : {}),
    })),
  };

  if (latestSynthesis !== undefined) {
    result.latest_synthesis = {
      id: latestSynthesis.id,
      title: latestSynthesis.synthesis.title,
      created_at: latestSynthesis.created_at,
      summary: latestSynthesis.synthesis.summary,
      ...(latestSynthesis.synthesis.limitations !== undefined
        ? { limitations: latestSynthesis.synthesis.limitations }
        : {}),
    };
  }

  return result;
}

function byQuestionPriorityThenCreated(a: QuestionRow, b: QuestionRow): number {
  return questionPriorityWeight(b.question.priority) - questionPriorityWeight(a.question.priority)
    || b.created_at.localeCompare(a.created_at);
}

function questionPriorityWeight(priority: QuestionRow["question"]["priority"]): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 0;
}

function checkFromSnapshot(snapshot: KnbReadSnapshot): CheckResult {
  const parseIssues = [...snapshot.ledger.parseIssues];
  const validationIssues = [...snapshot.validation.issues];
  const stateWarnings = snapshot.state?.warnings ?? [];
  const projectionFreshness = snapshot.projectionFreshness;

  const hasParseError = parseIssues.length > 0;
  const hasValidationError = validationIssues.some((issue) => issue.level === "error");
  const projectionBroken = projectionFreshness.entries.some(
    (entry) => entry.state === "stale" || entry.state === "missing",
  );

  return {
    ok: !hasParseError && !hasValidationError && !projectionBroken,
    parse_issues: parseIssues,
    validation_issues: validationIssues,
    state_warnings: [...stateWarnings],
    projection_freshness: projectionFreshness,
    fingerprint: snapshot.fingerprint,
  };
}

function buildSchemaResult(): SchemaResult {
  const samples = rowSamples();
  const ops = operationSamples();
  return {
    schema_version: "knb.v1",
    json_schema: jsonSchema(),
    row_samples: [samples.source, samples.claim, samples.question, samples.synthesis, samples.change],
    operation_samples: [ops.add, ops.retract, ops.supersede, ops.merge, ops.relate, ops.patch],
  };
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    throw knbError("io_failed", `Failed to create directory: ${dir}`, { path: dir }, error);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return false;
    return false;
  }
}

function relativeToRoot(root: string, path: string): string {
  const rel = relative(root, path);
  return rel.length === 0 ? "." : rel;
}
