import type {
  ClaimRow,
  KnbRow,
  KnbRowKind,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "./contract";
import { knbError } from "./errors";
import {
  matchesRowSelector,
  type RowSelectorExternalRef,
  type RowSelectorValue,
  structuredClaimSelectorFromRequest,
} from "./selectors";
import { buildSourceCitationIndex } from "./source-citations";
import type { EffectiveRow, EffectiveState, EffectiveStatus, StateExplanation } from "./state";

export type QueryRequest = {
  ids?: string[];
  kinds?: KnbRowKind[];
  collection?: string;
  subject?: string;
  tag?: string;
  text?: string;
  claimKey?: string;
  claimType?: string;
  predicate?: string;
  qualifiers?: Record<string, RowSelectorValue>;
  externalRefs?: RowSelectorExternalRef[];
  citing?: string;
  asOf?: string;
  status?: EffectiveStatus;
  includeHistory?: boolean;
  full?: boolean;
  limit?: number;
};

export type QueryRow = {
  id: string;
  kind: KnbRowKind;
  score: number;
  status: EffectiveStatus;
  text?: string;
  confidence?: string;
  source_ids?: string[];
  time?: string;
  row?: KnbRow;
};

export type QueryResult = {
  rows: QueryRow[];
  total_matched: number;
  total_returned: number;
};

export type GetRequest = {
  ids: string[];
  asOf?: string;
  includeHistory?: boolean;
  explain?: boolean;
};

export type GetRow = {
  id: string;
  status: EffectiveStatus;
  row: KnbRow;
  reason?: string;
  explanation?: StateExplanation;
};

export type GetResult = {
  rows: GetRow[];
  not_found: string[];
};

const HISTORY_STATUSES: EffectiveStatus[] = [
  "active",
  "retracted",
  "superseded",
  "duplicate",
  "archived",
  "invalid",
];

const TEXT_FIELD_KINDS: KnbRowKind[] = ["claim", "source", "question", "synthesis"];

const RTL_FOLD: Readonly<Record<string, string>> = {
  "آ": "ا",
  "أ": "ا",
  "إ": "ا",
  "ٱ": "ا",
  "ي": "ی",
  "ى": "ی",
  "ئ": "ی",
  "ك": "ک",
  "٠": "0",
  "۰": "0",
  "١": "1",
  "۱": "1",
  "٢": "2",
  "۲": "2",
  "٣": "3",
  "۳": "3",
  "٤": "4",
  "۴": "4",
  "٥": "5",
  "۵": "5",
  "٦": "6",
  "۶": "6",
  "٧": "7",
  "۷": "7",
  "٨": "8",
  "۸": "8",
  "٩": "9",
  "۹": "9",
};

export function normalizeStatement(statement: string): string {
  if (typeof statement !== "string") return "";
  const straightened = statement
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/\u0640/g, "")
    .replace(/\u200c/g, " ");
  const lowered = straightened.toLowerCase();
  const filtered = Array.from(lowered)
    .map((ch) => RTL_FOLD[ch] ?? ch)
    .map((ch) => (isKeptChar(ch) ? ch : " "))
    .join("");
  return filtered.replace(/\s+/g, " ").trim();
}

export function executeQuery(state: EffectiveState, request: QueryRequest): QueryResult {
  const candidates = collectCandidates(state, request);
  const filtered = applyScopeFilters(candidates, request);
  const structuredFiltered = applyStructuredFilters(filtered, request);
  const kindFiltered = applyKindFilter(structuredFiltered, request);
  const citationFiltered = applyCitingFilter(kindFiltered, state, request);

  const hasIdTerm = Array.isArray(request.ids) && request.ids.length > 0;
  const hasClaimKeyTerm = typeof request.claimKey === "string" && request.claimKey.length > 0;
  const normalizedQuery = normalizeStatement(request.text ?? "");
  const hasTextTerm = normalizedQuery.length > 0;
  const hasAnyTerm = hasIdTerm || hasClaimKeyTerm || hasTextTerm;
  const idSet = hasIdTerm ? new Set(request.ids) : undefined;

  const scored: Array<{ effective: EffectiveRow; score: number; index: number }> = [];
  for (let index = 0; index < citationFiltered.length; index += 1) {
    const effective = citationFiltered[index];
    if (!effective) continue;
    const score = scoreRow(effective.row, {
      idSet,
      claimKey: hasClaimKeyTerm ? request.claimKey : undefined,
      normalizedQuery: hasTextTerm ? normalizedQuery : undefined,
      hasAnyTerm,
    });
    if (hasAnyTerm && score === 0) continue;
    scored.push({ effective, score, index });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const totalMatched = scored.length;
  const limited = typeof request.limit === "number" && request.limit >= 0 ? scored.slice(0, request.limit) : scored;

  const rows: QueryRow[] = limited.map((entry) =>
    buildQueryRow(entry.effective, entry.score, request.full === true, state)
  );

  return {
    rows,
    total_matched: totalMatched,
    total_returned: rows.length,
  };
}

export function executeGet(state: EffectiveState, request: GetRequest): GetResult {
  const ids = Array.isArray(request.ids) ? request.ids : [];
  const rows: GetRow[] = [];
  const notFound: string[] = [];
  const includeHistory = request.includeHistory === true;

  for (const id of ids) {
    const effective = state.get(id, { includeHistory: true });
    if (!effective) {
      notFound.push(id);
      continue;
    }
    if (effective.status !== "active" && !includeHistory) {
      notFound.push(id);
      continue;
    }
    const entry: GetRow = {
      id,
      status: effective.status,
      row: effective.row,
    };
    if (effective.reason !== undefined) entry.reason = effective.reason;
    if (request.explain === true) {
      const explanation = state.explain(id);
      if (explanation) entry.explanation = explanation;
    }
    rows.push(entry);
  }

  if (ids.length > 0 && rows.length === 0) {
    throw knbError("not_found", "No matching rows", { ids });
  }

  return { rows, not_found: notFound };
}

function applyStructuredFilters(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  const selector = structuredClaimSelectorFromRequest(request);
  if (selector === undefined) return rows;
  return rows.filter((effective) => matchesRowSelector(effective.row, selector));
}

function collectCandidates(state: EffectiveState, request: QueryRequest): EffectiveRow[] {
  if (request.includeHistory === true) {
    const merged: EffectiveRow[] = [];
    const seen = new Set<string>();
    for (const status of HISTORY_STATUSES) {
      for (const effective of state.rows({ status, includeChanges: true })) {
        if (seen.has(effective.row.id)) continue;
        seen.add(effective.row.id);
        merged.push(effective);
      }
    }
    return merged;
  }
  const status = request.status ?? "active";
  return state.rows({ status, includeChanges: true });
}

function applyScopeFilters(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  if (!request.collection && !request.subject && !request.tag) return rows;
  return rows.filter((effective) => {
    const scope = effective.row.scope;
    if (request.collection && !scope.collections?.includes(request.collection)) return false;
    if (request.subject && !scope.subjects?.includes(request.subject)) return false;
    if (request.tag && !scope.tags?.includes(request.tag)) return false;
    return true;
  });
}

function applyKindFilter(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  const kinds = request.kinds;
  if (Array.isArray(kinds) && kinds.length > 0) {
    const allowed = new Set(kinds);
    return rows.filter((effective) => allowed.has(effective.row.kind));
  }
  if (request.includeHistory === true) return rows;
  return rows.filter((effective) => effective.row.kind !== "change");
}

function applyCitingFilter(rows: EffectiveRow[], state: EffectiveState, request: QueryRequest): EffectiveRow[] {
  const uri = typeof request.citing === "string" ? request.citing.trim() : "";
  if (uri.length === 0) return rows;
  const citedIds = new Set(buildSourceCitationIndex(state)[uri] ?? []);
  if (citedIds.size === 0) return [];
  return rows.filter((effective) => effective.row.kind === "claim" && citedIds.has(effective.row.id));
}

type ScoreContext = {
  idSet: Set<string> | undefined;
  claimKey: string | undefined;
  normalizedQuery: string | undefined;
  hasAnyTerm: boolean;
};

function scoreRow(row: KnbRow, ctx: ScoreContext): number {
  if (!ctx.hasAnyTerm) return 1;
  let best = 0;
  if (ctx.idSet && ctx.idSet.has(row.id)) best = Math.max(best, 100);
  if (ctx.claimKey !== undefined && row.kind === "claim") {
    const key = (row as ClaimRow).identity?.claim_key;
    if (typeof key === "string" && key === ctx.claimKey) best = Math.max(best, 90);
  }
  if (ctx.normalizedQuery !== undefined && TEXT_FIELD_KINDS.includes(row.kind)) {
    let textBest = 0;
    for (const value of textFieldsFor(row)) {
      const fieldScore = scoreTextField(value, ctx.normalizedQuery);
      if (fieldScore > textBest) textBest = fieldScore;
      if (textBest === 80) break;
    }
    if (textBest > best) best = textBest;
  }
  return best;
}

function scoreTextField(value: string | undefined, query: string): number {
  if (!value) return 0;
  const normalized = normalizeStatement(value);
  if (!normalized) return 0;
  if (normalized === query) return 80;
  if (containsWholeWord(normalized, query)) return 60;
  if (normalized.includes(query)) return 40;
  return 0;
}

function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  let from = 0;
  while (true) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) return false;
    const before = index === 0 ? " " : haystack.charAt(index - 1);
    const afterIndex = index + needle.length;
    const after = afterIndex >= haystack.length ? " " : haystack.charAt(afterIndex);
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = index + 1;
  }
}

function isWordChar(ch: string): boolean {
  if (ch.length === 0) return false;
  const code = ch.codePointAt(0);
  if (code === undefined) return false;
  if (code >= 48 && code <= 57) return true;
  if (code >= 65 && code <= 90) return true;
  if (code >= 97 && code <= 122) return true;
  if (code >= 0x0600 && code <= 0x06ff) return true;
  if (code >= 0x0750 && code <= 0x077f) return true;
  if (code >= 0xfb50 && code <= 0xfdff) return true;
  if (code >= 0xfe70 && code <= 0xfeff) return true;
  if (ch === "_") return true;
  return /[\p{L}\p{N}]/u.test(ch);
}

function textFieldsFor(row: KnbRow): string[] {
  if (row.kind === "claim") {
    const statement = (row as ClaimRow).claim?.statement;
    return typeof statement === "string" ? [statement] : [];
  }
  if (row.kind === "source") {
    const title = (row as SourceRow).source?.title;
    return typeof title === "string" ? [title] : [];
  }
  if (row.kind === "question") {
    const text = (row as QuestionRow).question?.text;
    return typeof text === "string" ? [text] : [];
  }
  if (row.kind === "synthesis") {
    const synth = (row as SynthesisRow).synthesis;
    const fields: string[] = [];
    if (typeof synth?.title === "string") fields.push(synth.title);
    if (typeof synth?.summary === "string") fields.push(synth.summary);
    return fields;
  }
  return [];
}

function buildQueryRow(
  effective: EffectiveRow,
  score: number,
  full: boolean,
  state: EffectiveState,
): QueryRow {
  const row = effective.row;
  const out: QueryRow = {
    id: row.id,
    kind: row.kind,
    score,
    status: effective.status,
  };
  const text = displayTextFor(row);
  if (text !== undefined) out.text = text;
  const confidence = confidenceFor(row);
  if (confidence !== undefined) out.confidence = confidence;
  const sourceIds = sourceIdsFor(row, state);
  if (sourceIds.length > 0) out.source_ids = sourceIds;
  const time = timeFor(row);
  if (time !== undefined) out.time = time;
  if (full) out.row = row;
  return out;
}

function displayTextFor(row: KnbRow): string | undefined {
  if (row.kind === "claim") {
    const statement = (row as ClaimRow).claim?.statement;
    return typeof statement === "string" ? statement : undefined;
  }
  if (row.kind === "source") {
    const title = (row as SourceRow).source?.title;
    return typeof title === "string" ? title : undefined;
  }
  if (row.kind === "question") {
    const text = (row as QuestionRow).question?.text;
    return typeof text === "string" ? text : undefined;
  }
  if (row.kind === "synthesis") {
    const title = (row as SynthesisRow).synthesis?.title;
    return typeof title === "string" ? title : undefined;
  }
  return undefined;
}

function confidenceFor(row: KnbRow): string | undefined {
  if (row.kind !== "claim") return undefined;
  const confidence = (row as ClaimRow).assessment?.confidence;
  return typeof confidence === "string" ? confidence : undefined;
}

function canonicalSourceIds(ids: Iterable<string | undefined>, state: EffectiveState): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    out.add(state.canonicalIdOf(id));
  }
  return [...out];
}

function sourceIdsFor(row: KnbRow, state: EffectiveState): string[] {
  if (row.kind === "claim") {
    const claim = row as ClaimRow;
    return canonicalSourceIds(
      [
        ...(claim.provenance?.source_ids ?? []),
        ...(claim.provenance?.evidence ?? []).map((evidence) => evidence?.source_id),
      ],
      state,
    );
  }
  if (row.kind === "synthesis") {
    const ids = (row as SynthesisRow).synthesis?.basis?.source_ids ?? [];
    return canonicalSourceIds(ids, state);
  }
  if (row.kind === "question") {
    const ids = (row as QuestionRow).provenance?.source_ids ?? [];
    return canonicalSourceIds(ids, state);
  }
  return [];
}

function timeFor(row: KnbRow): string | undefined {
  if (row.kind === "claim") {
    const time = (row as ClaimRow).time;
    return firstString(time?.valid_at, time?.occurred_at, time?.first_observed_at);
  }
  if (row.kind === "source") {
    const published = (row as SourceRow).source?.published_at;
    return typeof published === "string" && published.length > 0 ? published : undefined;
  }
  if (row.kind === "question") {
    const observed = (row as QuestionRow).time?.first_observed_at;
    return typeof observed === "string" && observed.length > 0 ? observed : undefined;
  }
  return undefined;
}

function firstString(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function isKeptChar(ch: string): boolean {
  if (ch === "-" || ch === "'") return true;
  if (ch >= "a" && ch <= "z") return true;
  if (ch >= "0" && ch <= "9") return true;
  const code = ch.codePointAt(0);
  if (code !== undefined) {
    if (code >= 0x0600 && code <= 0x06ff) return true;
    if (code >= 0x0750 && code <= 0x077f) return true;
    if (code >= 0xfb50 && code <= 0xfdff) return true;
    if (code >= 0xfe70 && code <= 0xfeff) return true;
  }
  return /[\p{L}\p{N}]/u.test(ch);
}
