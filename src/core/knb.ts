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
  type ApplyRequest as CoreApplyRequest,
  type ClaimRow,
  type DraftRow,
  type KnbRow,
  type QuestionRow,
  type SourceRow,
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
import { readRunManifests, type RunManifest } from "./run-manifests";
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
  type ReadSnapshotOptions,
} from "./read-snapshot";
import { buildEffectiveState, type EffectiveState, type StateWarning } from "./state";
import { rowSelectorSamples, rowSelectorSchema, type RowSelector } from "./selectors";
import { openWorkspace, type KnbWorkspace, type OpenWorkspaceOptions } from "./workspace";

export { ROW_KINDS } from "./contract";

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
  detailed?: DetailedStatus;
};

export type StatusOptions = {
  detailed?: boolean;
};

export type DuplicateSourceUriCluster = {
  uri: string;
  count: number;
  source_ids: string[];
};

export type DuplicateClaimKeyCluster = {
  claim_key: string;
  count: number;
  claim_ids: string[];
};

export type EvidenceDepthStats = {
  count: number;
  p50: number;
  p90: number;
  max: number;
};

export type DetailedStatus = {
  duplicate_source_uri_clusters: DuplicateSourceUriCluster[];
  duplicate_claim_key_clusters: DuplicateClaimKeyCluster[];
  evidence_depth: EvidenceDepthStats;
  novelty_active_distribution: Record<string, number>;
  syntheses_per_collection: Record<string, number>;
};

export type CollectionStatusRequest = {
  collection: string;
  maxQuestions?: number;
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

export type CollectionSummary = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  latest_created_at?: string;
};

export type CollectionsResult = {
  collections: CollectionSummary[];
};

export type SchemaResult = {
  schema_version: "knb.v1";
  json_schema: object;
  selector_schema: object;
  selector_samples: RowSelector[];
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

export type ApplyRequest = Omit<CoreApplyRequest, "run_id"> & {
  runId?: string;
};

export type NoveltyBatchResult = {
  results: NoveltyResult[];
};

export type LogRequest = {
  actor?: string;
  since?: string;
  until?: string;
  limit?: number;
};

export type LogResult = {
  entries: RunManifest[];
  total_matched: number;
  total_returned: number;
};

export type Knb = {
  workspace: KnbWorkspace;
  runtime: KnbRuntime;
  init(options?: InitOptions): Promise<InitResult>;
  status(options?: StatusOptions): Promise<KnbStatus>;
  collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult>;
  collections(): Promise<CollectionsResult>;
  schema(): Promise<SchemaResult>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  previewApply(request: ApplyRequest): Promise<ApplyResult>;
  add(row: DraftRow): Promise<ApplyResult>;
  log(request?: LogRequest): Promise<LogResult>;
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
    async status(options: StatusOptions = {}): Promise<KnbStatus> {
      const snapshot = await readSnapshot({ workspace, freshness: projectionFreshness });
      return statusFromSnapshot(workspace, snapshot, options);
    },
    async collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "collectionStatus");
      return collectionStatusFromState(state, request);
    },
    async collections(): Promise<CollectionsResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "collections");
      return collectionsFromState(state);
    },
    async schema(): Promise<SchemaResult> {
      return buildSchemaResult();
    },
    async apply(request: ApplyRequest): Promise<ApplyResult> {
      return applyOperations(toCoreApplyRequest(request), {
        workspace,
        runtime,
        actor: workspace.actor,
        classifyNovelty: noveltyBridge,
      });
    },
    async previewApply(request: ApplyRequest): Promise<ApplyResult> {
      return previewApplyOperations(toCoreApplyRequest(request), {
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
    async log(request: LogRequest = {}): Promise<LogResult> {
      return buildLog(workspace, request);
    },
    async get(ids: string[], getOptions: Omit<GetRequest, "ids"> = {}): Promise<GetResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, getOptions.asOf));
      const state = requireState(snapshot, "get");
      const request: GetRequest = { ids };
      if (getOptions.includeHistory !== undefined) request.includeHistory = getOptions.includeHistory;
      if (getOptions.explain !== undefined) request.explain = getOptions.explain;
      return executeGet(state, request);
    },
    async query(request: QueryRequest): Promise<QueryResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "query");
      return executeQuery(state, request);
    },
    async context(request: ContextRequest): Promise<ContextResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
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
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "render");
      return projectionArtifacts.renderCollection(state, snapshot.fingerprint, request);
    },
    async renderAll(request: RenderAllRequest = {}): Promise<RenderAllResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
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

function toCoreApplyRequest(request: ApplyRequest): CoreApplyRequest {
  const { runId, ...rest } = request;
  const coreRequest: CoreApplyRequest = { ...rest };
  if (runId !== undefined) coreRequest.run_id = runId;
  return coreRequest;
}

function readSnapshotOptions(
  workspace: KnbWorkspace,
  freshness: Exclude<ReadSnapshotOptions["freshness"], undefined>,
  asOf: string | undefined,
): ReadSnapshotOptions {
  const options: ReadSnapshotOptions = { workspace, freshness };
  if (asOf !== undefined) options.asOf = asOf;
  return options;
}

async function buildLog(workspace: KnbWorkspace, request: LogRequest): Promise<LogResult> {
  const manifests = await readRunManifests(workspace);
  const actor = stringOption(request.actor);
  const since = parseLogDate(request.since, "since");
  const until = parseLogDate(request.until, "until");

  const filtered = manifests
    .filter((manifest) => actor === undefined || manifest.actor === actor)
    .filter((manifest) => {
      const completed = logTime(manifest.completed_at);
      if (!Number.isFinite(completed)) return false;
      if (since !== undefined && completed < since) return false;
      if (until !== undefined && completed > until) return false;
      return true;
    })
    .sort((a, b) => {
      const byTime = logTime(b.completed_at) - logTime(a.completed_at);
      if (byTime !== 0) return byTime;
      return a.run_id.localeCompare(b.run_id);
    });

  const limit = normalizeLogLimit(request.limit);
  const entries = filtered.slice(0, limit);
  return {
    entries,
    total_matched: filtered.length,
    total_returned: entries.length,
  };
}

function normalizeLogLimit(limit: number | undefined): number {
  if (limit === undefined) return 20;
  if (!Number.isFinite(limit)) return 20;
  return Math.max(0, Math.trunc(limit));
}

function parseLogDate(value: string | undefined, field: "since" | "until"): number | undefined {
  const trimmed = stringOption(value);
  if (trimmed === undefined) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    throw knbError("validation_failed", `Invalid log ${field} timestamp`, { [field]: value });
  }
  return parsed;
}

function logTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function stringOption(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
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

function statusFromSnapshot(
  workspace: KnbWorkspace,
  snapshot: KnbReadSnapshot,
  options: StatusOptions = {},
): KnbStatus {
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

  const result: KnbStatus = {
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
  if (options.detailed === true && snapshot.state !== undefined) {
    result.detailed = detailedStatusFromState(snapshot.state);
  }
  return result;
}

function collectionsFromState(state: EffectiveState): CollectionsResult {
  const byCollection = new Map<string, CollectionSummary>();
  for (const er of state.rows({ includeChanges: true })) {
    const collections = er.row.scope.collections ?? [];
    for (const rawCollection of collections) {
      const collection = rawCollection.trim();
      if (collection.length === 0) continue;
      const summary = byCollection.get(collection) ?? {
        collection,
        active_counts_by_kind: {},
      };
      incrementCount(summary.active_counts_by_kind, er.row.kind);
      if (summary.latest_created_at === undefined || er.row.created_at > summary.latest_created_at) {
        summary.latest_created_at = er.row.created_at;
      }
      byCollection.set(collection, summary);
    }
  }
  return {
    collections: [...byCollection.values()].sort((a, b) => a.collection.localeCompare(b.collection)),
  };
}

function detailedStatusFromState(state: EffectiveState): DetailedStatus {
  const active = state.rows({ includeChanges: true }).map((er) => er.row);
  const activeSources = active.filter((row): row is SourceRow => row.kind === "source");
  const activeClaims = active.filter((row): row is ClaimRow => row.kind === "claim");
  const collections = collectionsFromState(state).collections;

  return {
    duplicate_source_uri_clusters: duplicateSourceUriClusters(activeSources),
    duplicate_claim_key_clusters: duplicateClaimKeyClusters(activeClaims),
    evidence_depth: evidenceDepthStats(activeClaims),
    novelty_active_distribution: noveltyDistribution(activeClaims),
    syntheses_per_collection: synthesesPerCollection(collections),
  };
}

function duplicateSourceUriClusters(rows: SourceRow[]): DuplicateSourceUriCluster[] {
  const byUri = new Map<string, string[]>();
  for (const row of rows) {
    const uri = typeof row.source.uri === "string" ? row.source.uri.trim() : "";
    if (uri.length === 0) continue;
    const ids = byUri.get(uri) ?? [];
    ids.push(row.id);
    byUri.set(uri, ids);
  }
  return [...byUri.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uri, ids]) => ({ uri, count: ids.length, source_ids: ids }));
}

function duplicateClaimKeyClusters(rows: ClaimRow[]): DuplicateClaimKeyCluster[] {
  const byKey = new Map<string, string[]>();
  for (const row of rows) {
    const key = typeof row.identity.claim_key === "string" ? row.identity.claim_key.trim() : "";
    if (key.length === 0) continue;
    const ids = byKey.get(key) ?? [];
    ids.push(row.id);
    byKey.set(key, ids);
  }
  return [...byKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([claim_key, ids]) => ({ claim_key, count: ids.length, claim_ids: ids }));
}

function evidenceDepthStats(rows: ClaimRow[]): EvidenceDepthStats {
  const depths = rows.map(evidenceDepth).sort((a, b) => a - b);
  if (depths.length === 0) return { count: 0, p50: 0, p90: 0, max: 0 };
  return {
    count: depths.length,
    p50: percentileNearestRank(depths, 0.5),
    p90: percentileNearestRank(depths, 0.9),
    max: depths[depths.length - 1] as number,
  };
}

function evidenceDepth(row: ClaimRow): number {
  const sourceIds = new Set<string>();
  for (const id of row.provenance.source_ids ?? []) {
    if (typeof id === "string" && id.length > 0) sourceIds.add(id);
  }
  for (const evidence of row.provenance.evidence ?? []) {
    if (typeof evidence.source_id === "string" && evidence.source_id.length > 0) {
      sourceIds.add(evidence.source_id);
    }
  }
  return sourceIds.size;
}

function percentileNearestRank(sortedAscending: number[], percentile: number): number {
  if (sortedAscending.length === 0) return 0;
  const rank = Math.max(1, Math.ceil(percentile * sortedAscending.length));
  return sortedAscending[Math.min(rank - 1, sortedAscending.length - 1)] as number;
}

function noveltyDistribution(rows: ClaimRow[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const row of rows) {
    const novelty = row.identity.novelty;
    if (typeof novelty !== "string" || novelty.length === 0) continue;
    incrementCount(distribution, novelty);
  }
  return sortedRecord(distribution);
}

function synthesesPerCollection(collections: CollectionSummary[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of collections) {
    const count = entry.active_counts_by_kind.synthesis ?? 0;
    if (count > 0) counts[entry.collection] = count;
  }
  return counts;
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
    incrementCount(activeCounts, er.row.kind);
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
    typeof request.maxQuestions === "number" && Number.isFinite(request.maxQuestions)
      ? Math.max(0, Math.floor(request.maxQuestions))
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

function incrementCount(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortedRecord(record: Record<string, number>): Record<string, number> {
  const sorted: Record<string, number> = {};
  for (const key of Object.keys(record).sort()) sorted[key] = record[key] as number;
  return sorted;
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
    selector_schema: rowSelectorSchema(),
    selector_samples: rowSelectorSamples(),
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
