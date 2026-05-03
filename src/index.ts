export { openKnb } from "./core/knb";
export type {
  Knb,
  OpenKnbOptions,
  StatusOptions,
  KnbStatus,
  DetailedStatus,
  DuplicateSourceUriCluster,
  DuplicateClaimKeyCluster,
  EvidenceDepthStats,
  CollectionStatusRequest,
  CollectionStatusResult,
  CollectionSummary,
  CollectionsResult,
  LogRequest,
  LogResult,
  SchemaResult,
  InitOptions,
  InitResult,
  KnbRuntime,
  ApplyRequest,
} from "./core/knb";

export type { KnbWorkspace, KnbConfig } from "./core/workspace";
export type {
  KnbRow,
  KnbRowKind,
  Scope,
  ApplyOperation,
  DraftRow,
  ValidationResult,
  ValidationIssue,
} from "./core/contract";
export type { KnbError, KnbErrorCode } from "./core/errors";
export type {
  KnbReadSnapshot,
  ProjectionFreshness,
  ProjectionFreshnessEntry,
  SnapshotValidity,
} from "./core/read-snapshot";
export type { LedgerFingerprint } from "./core/ledger";
export type {
  ContextRequest,
  ContextRecencyProfile,
  ContextResult,
  ContextScoringProfile,
  ContextScoringProfileInput,
  ContextScoringWeights,
  ContextScoringWeightsInput,
} from "./core/context";
export type {
  GetRequest,
  GetResult,
  QueryRequest,
  QueryResult,
} from "./core/query";
export type {
  RenderAllRequest,
  RenderAllResult,
  RenderRequest,
  RenderResult,
} from "./core/projections";
export {
  matchesRowSelector,
  selectEffectiveRows,
  validateRowSelector,
} from "./core/selectors";
export type {
  RowSelector,
  RowSelectorComparable,
  RowSelectorExternalRef,
  RowSelectorValidationResult,
  RowSelectorValue,
  RowSelectorWhere,
} from "./core/selectors";
