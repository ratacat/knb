// Effective state module - V1 lifecycle-aware projection over the ledger.
// Single deep module: consumers only see EffectiveState. Internals walk the
// ledger once, build status, relations, patch audit, and warnings, then expose
// indexed read methods that respect change rows, intrinsic archived state, and
// hidden change rows by default.

import type {
  ChangeRow,
  KnbRow,
  KnbRowKind,
  LoadedRow,
  QuestionRow,
  RelationType,
  Relation,
  SynthesisRow,
} from "./contract";

export type EffectiveStatus =
  | "active"
  | "retracted"
  | "superseded"
  | "duplicate"
  | "archived"
  | "invalid";

export type StateWarningCode =
  | "change_target_inactive"
  | "change_target_missing"
  | "relation_endpoint_missing"
  | "patch_target_missing"
  | "supersede_replacement_inactive"
  | "merge_canonical_inactive";

export type StateWarning = {
  code: StateWarningCode;
  message: string;
  change_id?: string;
  target_id?: string;
  line?: number;
};

export type EffectiveRow = {
  row: KnbRow;
  status: EffectiveStatus;
  reason?: string;
  by_change_id?: string;
  intrinsic_archived?: true;
};

export type StateExplanationEntry = {
  change_id: string;
  action: "retract" | "supersede" | "merge" | "patch";
  by: string;
  at: string;
  reason?: string;
  replacement_id?: string;
  canonical_id?: string;
  patch_summary?: string;
};

export type StatePatchAuditEntry = {
  change_id: string;
  at: string;
  by: string;
  reason: string;
  patch: Array<Record<string, unknown>>;
};

export type StateExplanation = {
  id: string;
  status: EffectiveStatus;
  reason?: string;
  history: StateExplanationEntry[];
  patch_audit: StatePatchAuditEntry[];
};

export type EffectiveRelation = {
  from_id: string;
  to_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
  source: "row_relations" | "change_relate";
  by_change_id?: string;
};

export type RelationGraph = {
  all(): EffectiveRelation[];
  outgoing(id: string): EffectiveRelation[];
  incoming(id: string): EffectiveRelation[];
};

export type StateFilter = {
  kinds?: KnbRowKind[];
  collection?: string;
  subject?: string;
  tag?: string;
  status?: EffectiveStatus;
  includeChanges?: boolean;
};

export type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(filter?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  canonicalIdOf(id: string): string;
  explain(id: string): StateExplanation | undefined;
  relationGraph(): RelationGraph;
  warnings: StateWarning[];
};

type InternalRow = EffectiveRow & {
  line: number;
};

export function buildEffectiveState(loaded: LoadedRow[]): EffectiveState {
  const idMap = new Map<string, InternalRow>();
  const order: string[] = [];
  const warnings: StateWarning[] = [];
  const relations: EffectiveRelation[] = [];
  const outgoingIndex = new Map<string, EffectiveRelation[]>();
  const incomingIndex = new Map<string, EffectiveRelation[]>();
  const explanationHistory = new Map<string, StateExplanationEntry[]>();
  const patchAudit = new Map<string, StatePatchAuditEntry[]>();
  const canonicalIdByDuplicate = new Map<string, string>();

  for (const item of loaded) {
    const row = item.row;
    if (typeof row.id !== "string" || row.id.length === 0) continue;
    if (idMap.has(row.id)) continue;
    const internal: InternalRow = { row, status: "active", line: item.line };
    if (row.kind === "question") {
      const status = (row as QuestionRow).question?.status;
      if (status === "archived") {
        internal.status = "archived";
        internal.intrinsic_archived = true;
      }
    } else if (row.kind === "synthesis") {
      const status = (row as SynthesisRow).synthesis?.status;
      if (status === "archived") {
        internal.status = "archived";
        internal.intrinsic_archived = true;
      }
    }
    idMap.set(row.id, internal);
    order.push(row.id);
  }

  for (const item of loaded) {
    const row = item.row;
    if (row.kind === "change") continue;
    const relationsList = (row as { relations?: Relation[] }).relations;
    if (!Array.isArray(relationsList)) continue;
    for (const relation of relationsList) {
      if (!relation || typeof relation !== "object") continue;
      const targetId = relation.target_id;
      if (typeof targetId !== "string" || !idMap.has(targetId)) {
        const warning: StateWarning = {
          code: "relation_endpoint_missing",
          message: `Relation target ${typeof targetId === "string" ? targetId : "(missing)"} not found for ${row.id}`,
          line: item.line,
        };
        if (typeof targetId === "string") warning.target_id = targetId;
        warnings.push(warning);
        continue;
      }
      const edge: EffectiveRelation = {
        from_id: row.id,
        to_id: targetId,
        rel: relation.rel,
        source: "row_relations",
      };
      if (relation.strength !== undefined) edge.strength = relation.strength;
      if (relation.rationale !== undefined) edge.rationale = relation.rationale;
      relations.push(edge);
      pushIndex(outgoingIndex, edge.from_id, edge);
      pushIndex(incomingIndex, edge.to_id, edge);
    }
  }

  for (const item of loaded) {
    const row = item.row;
    if (row.kind !== "change") continue;
    const change = (row as ChangeRow).change;
    if (!change || typeof change !== "object") continue;
    const action = change.action;

    if (action === "retract") {
      for (const targetId of change.target_ids ?? []) {
        applyInactivation(
          idMap,
          targetId,
          "retracted",
          `retracted: ${change.reason ?? ""}`.trim(),
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "retract",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
          },
          item.line,
        );
      }
      continue;
    }

    if (action === "supersede") {
      const replacementId = change.replacement_id;
      for (const targetId of change.target_ids ?? []) {
        applyInactivation(
          idMap,
          targetId,
          "superseded",
          `superseded by ${replacementId ?? "(unknown)"}`,
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "supersede",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
            ...(replacementId !== undefined ? { replacement_id: replacementId } : {}),
          },
          item.line,
        );
      }
      if (typeof replacementId === "string") {
        const replacement = idMap.get(replacementId);
        if (replacement && replacement.status !== "active") {
          warnings.push({
            code: "supersede_replacement_inactive",
            message: `Supersede replacement ${replacementId} is not active (status: ${replacement.status})`,
            change_id: row.id,
            target_id: replacementId,
            line: item.line,
          });
        }
      }
      continue;
    }

    if (action === "merge") {
      const canonicalId = change.canonical_id;
      for (const targetId of change.target_ids ?? []) {
        if (
          typeof canonicalId === "string" &&
          canonicalId.length > 0 &&
          typeof targetId === "string" &&
          idMap.get(targetId)?.status === "active"
        ) {
          canonicalIdByDuplicate.set(targetId, canonicalId);
        }
        applyInactivation(
          idMap,
          targetId,
          "duplicate",
          `merged into ${canonicalId ?? "(unknown)"}`,
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "merge",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
            ...(canonicalId !== undefined ? { canonical_id: canonicalId } : {}),
          },
          item.line,
        );
      }
      if (typeof canonicalId === "string") {
        const canonical = idMap.get(canonicalId);
        if (canonical && canonical.status !== "active") {
          warnings.push({
            code: "merge_canonical_inactive",
            message: `Merge canonical ${canonicalId} is not active (status: ${canonical.status})`,
            change_id: row.id,
            target_id: canonicalId,
            line: item.line,
          });
        }
      }
      continue;
    }

    if (action === "relate") {
      const relation = change.relation;
      if (!relation || typeof relation !== "object") continue;
      const fromId = relation.from_id;
      const toId = relation.to_id;
      const fromMissing = typeof fromId !== "string" || !idMap.has(fromId);
      const toMissing = typeof toId !== "string" || !idMap.has(toId);
      if (fromMissing || toMissing) {
        warnings.push({
          code: "relation_endpoint_missing",
          message: `Relate change ${row.id} has missing endpoint(s): from=${fromId ?? "(missing)"} to=${toId ?? "(missing)"}`,
          change_id: row.id,
          ...(fromMissing && typeof fromId === "string" ? { target_id: fromId } : {}),
          ...(!fromMissing && toMissing && typeof toId === "string" ? { target_id: toId } : {}),
          line: item.line,
        });
        continue;
      }
      const edge: EffectiveRelation = {
        from_id: fromId as string,
        to_id: toId as string,
        rel: relation.rel,
        source: "change_relate",
        by_change_id: row.id,
      };
      if (relation.strength !== undefined) edge.strength = relation.strength;
      if (relation.rationale !== undefined) edge.rationale = relation.rationale;
      relations.push(edge);
      pushIndex(outgoingIndex, edge.from_id, edge);
      pushIndex(incomingIndex, edge.to_id, edge);
      continue;
    }

    if (action === "patch") {
      const targetId = change.target_id;
      if (typeof targetId !== "string" || !idMap.has(targetId)) {
        const warning: StateWarning = {
          code: "patch_target_missing",
          message: `Patch target ${typeof targetId === "string" ? targetId : "(missing)"} not found for change ${row.id}`,
          change_id: row.id,
          line: item.line,
        };
        if (typeof targetId === "string") warning.target_id = targetId;
        warnings.push(warning);
        continue;
      }
      const auditEntry: StatePatchAuditEntry = {
        change_id: row.id,
        at: row.created_at,
        by: row.created_by,
        reason: change.reason ?? "",
        patch: change.patch ?? [],
      };
      const list = patchAudit.get(targetId) ?? [];
      list.push(auditEntry);
      patchAudit.set(targetId, list);
      const historyEntry: StateExplanationEntry = {
        change_id: row.id,
        action: "patch",
        by: row.created_by,
        at: row.created_at,
        ...(change.reason !== undefined ? { reason: change.reason } : {}),
        patch_summary: summarizePatch(change.patch ?? []),
      };
      const historyList = explanationHistory.get(targetId) ?? [];
      historyList.push(historyEntry);
      explanationHistory.set(targetId, historyList);
      continue;
    }
  }

  const graph: RelationGraph = {
    all(): EffectiveRelation[] {
      return [...relations];
    },
    outgoing(id: string): EffectiveRelation[] {
      return [...(outgoingIndex.get(id) ?? [])];
    },
    incoming(id: string): EffectiveRelation[] {
      return [...(incomingIndex.get(id) ?? [])];
    },
  };

  const state: EffectiveState = {
    warnings,
    get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined {
      const internal = idMap.get(id);
      if (!internal) return undefined;
      if (options?.includeHistory === true) return toEffectiveRow(internal);
      if (internal.status === "active") return toEffectiveRow(internal);
      return undefined;
    },
    rows(filter?: StateFilter): EffectiveRow[] {
      const wantStatus: EffectiveStatus = filter?.status ?? "active";
      const includeChanges = filter?.includeChanges === true;
      const kindsAllowed = filter?.kinds && filter.kinds.length > 0 ? new Set(filter.kinds) : undefined;
      const wantsChangeKind = kindsAllowed?.has("change") === true;
      const result: EffectiveRow[] = [];
      for (const id of order) {
        const internal = idMap.get(id);
        if (!internal) continue;
        if (internal.status !== wantStatus) continue;
        if (internal.row.kind === "change" && !includeChanges && !wantsChangeKind) continue;
        if (kindsAllowed && !kindsAllowed.has(internal.row.kind)) continue;
        if (filter?.collection && !internal.row.scope.collections?.includes(filter.collection)) continue;
        if (filter?.subject && !internal.row.scope.subjects?.includes(filter.subject)) continue;
        if (filter?.tag && !internal.row.scope.tags?.includes(filter.tag)) continue;
        result.push(toEffectiveRow(internal));
      }
      return result;
    },
    statusOf(id: string): EffectiveStatus | undefined {
      return idMap.get(id)?.status;
    },
    canonicalIdOf(id: string): string {
      return resolveCanonicalId(id, canonicalIdByDuplicate);
    },
    explain(id: string): StateExplanation | undefined {
      const internal = idMap.get(id);
      if (!internal) return undefined;
      const explanation: StateExplanation = {
        id,
        status: internal.status,
        history: [...(explanationHistory.get(id) ?? [])],
        patch_audit: [...(patchAudit.get(id) ?? [])],
      };
      if (internal.reason !== undefined) explanation.reason = internal.reason;
      return explanation;
    },
    relationGraph(): RelationGraph {
      return graph;
    },
  };

  return state;
}

function resolveCanonicalId(id: string, canonicalIdByDuplicate: Map<string, string>): string {
  if (typeof id !== "string" || id.length === 0) return id;
  const seen = new Set<string>();
  let current = id;
  while (true) {
    if (seen.has(current)) return id;
    seen.add(current);
    const next = canonicalIdByDuplicate.get(current);
    if (typeof next !== "string" || next.length === 0 || next === current) return current;
    current = next;
  }
}

function applyInactivation(
  idMap: Map<string, InternalRow>,
  targetId: string,
  status: EffectiveStatus,
  reason: string,
  changeId: string,
  warnings: StateWarning[],
  explanationHistory: Map<string, StateExplanationEntry[]>,
  historyEntry: StateExplanationEntry,
  line: number,
): void {
  if (typeof targetId !== "string" || targetId.length === 0) return;
  const target = idMap.get(targetId);
  if (!target) {
    warnings.push({
      code: "change_target_missing",
      message: `Change target ${targetId} not found`,
      change_id: changeId,
      target_id: targetId,
      line,
    });
    return;
  }
  pushHistory(explanationHistory, targetId, historyEntry);
  if (target.status !== "active") {
    warnings.push({
      code: "change_target_inactive",
      message: `Change target ${targetId} already inactive (status: ${target.status})`,
      change_id: changeId,
      target_id: targetId,
      line,
    });
    return;
  }
  target.status = status;
  target.reason = reason;
  target.by_change_id = changeId;
}

function pushHistory(
  store: Map<string, StateExplanationEntry[]>,
  id: string,
  entry: StateExplanationEntry,
): void {
  const list = store.get(id) ?? [];
  list.push(entry);
  store.set(id, list);
}

function pushIndex(
  store: Map<string, EffectiveRelation[]>,
  key: string,
  edge: EffectiveRelation,
): void {
  const list = store.get(key) ?? [];
  list.push(edge);
  store.set(key, list);
}

function toEffectiveRow(internal: InternalRow): EffectiveRow {
  const out: EffectiveRow = { row: internal.row, status: internal.status };
  if (internal.reason !== undefined) out.reason = internal.reason;
  if (internal.by_change_id !== undefined) out.by_change_id = internal.by_change_id;
  if (internal.intrinsic_archived) out.intrinsic_archived = true;
  return out;
}

function summarizePatch(patch: Array<Record<string, unknown>>): string {
  if (!Array.isArray(patch) || patch.length === 0) return "(empty patch)";
  const ops: string[] = [];
  for (const entry of patch) {
    if (!entry || typeof entry !== "object") continue;
    const op = typeof entry.op === "string" ? entry.op : "?";
    const path = typeof entry.path === "string" ? entry.path : "";
    ops.push(path ? `${op} ${path}` : op);
  }
  return ops.join("; ");
}
