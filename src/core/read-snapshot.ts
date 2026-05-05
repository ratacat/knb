// Read snapshot module - V1 read-side counterpart to apply.
// Concentrates load -> validate -> optional project -> freshness collection so
// status, check, get, query, context, render, and index do not reassemble the
// rules independently.

import type { LoadedRow as ContractLoadedRow, ValidationIssue, ValidationResult } from "./contract";
import { validateLedger } from "./contract";
import { loadLedger as defaultLoadLedger, type LedgerFingerprint, type LedgerSnapshot } from "./ledger";
import {
  checkFreshness as defaultCheckFreshness,
  type FreshnessReport,
} from "./projections";
import { buildEffectiveState, type EffectiveState, type StateOptions } from "./state";
import type { KnbWorkspace } from "./workspace";

export type SnapshotValidity = "loaded" | "validated" | "projected";

export type ProjectionFreshness = FreshnessReport;
export type ProjectionFreshnessEntry = FreshnessReport["entries"][number];

export type { EffectiveState } from "./state";

export type KnbReadSnapshot = {
  validity: SnapshotValidity;
  ledger: LedgerSnapshot;
  fingerprint: LedgerFingerprint;
  validation: ValidationResult;
  state?: EffectiveState;
  projectionFreshness: ProjectionFreshness;
};

export type ReadSnapshotLedgerLoader = (options: { path: string }) => Promise<LedgerSnapshot>;

export type ReadSnapshotValidator = (
  rows: ContractLoadedRow[],
  parseIssues: ValidationIssue[],
) => ValidationResult;

export type ReadSnapshotProjector = (rows: ContractLoadedRow[], options: StateOptions) => EffectiveState;

export type ReadSnapshotFreshnessProbe = (
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
) => Promise<FreshnessReport>;

export type ReadSnapshotOptions = {
  workspace: KnbWorkspace;
  loadLedger?: ReadSnapshotLedgerLoader;
  validate?: ReadSnapshotValidator;
  projectState?: ReadSnapshotProjector | false;
  freshness?: ReadSnapshotFreshnessProbe | false;
  asOf?: string;
};

export function defaultProjectState(rows: ContractLoadedRow[], options: StateOptions = {}): EffectiveState {
  return buildEffectiveState(rows, options);
}

export const defaultFreshness: ReadSnapshotFreshnessProbe = (workspace, ledger_fingerprint) =>
  defaultCheckFreshness({ workspace, ledger_fingerprint });

export async function readSnapshot(options: ReadSnapshotOptions): Promise<KnbReadSnapshot> {
  const loader = options.loadLedger ?? defaultLoadLedger;
  const validator = options.validate ?? validateLedger;

  const ledger = await loader({ path: options.workspace.paths.ledger });

  const contractRows: ContractLoadedRow[] = ledger.rows.map(({ row, line }) => ({ row, line }));
  const parseIssues: ValidationIssue[] = ledger.parseIssues.map((issue) => ({
    level: issue.level,
    code: issue.code,
    message: issue.message,
    line: issue.line,
  }));

  const validation = validator(contractRows, parseIssues);

  const hasParseError = ledger.parseIssues.length > 0;
  const hasValidationError = validation.issues.some((issue) => issue.level === "error");

  let validity: SnapshotValidity;
  let state: EffectiveState | undefined;

  if (hasParseError || hasValidationError) {
    validity = "loaded";
  } else if (options.projectState === false) {
    validity = "validated";
  } else {
    const projector = options.projectState ?? defaultProjectState;
    const stateOptions: StateOptions = {};
    if (options.asOf !== undefined) stateOptions.asOf = options.asOf;
    state = projector(contractRows, stateOptions);
    validity = "projected";
  }

  let projectionFreshness: ProjectionFreshness = { entries: [] };
  if (options.freshness !== false) {
    const probe = options.freshness ?? defaultFreshness;
    projectionFreshness = await probe(options.workspace, ledger.fingerprint);
  }

  const snapshot: KnbReadSnapshot = {
    validity,
    ledger,
    fingerprint: ledger.fingerprint,
    validation,
    projectionFreshness,
  };
  if (state !== undefined) snapshot.state = state;
  return snapshot;
}
