import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  CONFIDENCE_VALUES,
  KB_SCHEMA_VERSION,
  QUESTION_PRIORITIES,
  QUESTION_STATUSES,
  RELATION_TYPES,
  ROW_KINDS,
  SOURCE_TYPES,
  SYNTHESIS_STATUSES,
  TIME_PRECISIONS,
  type ClaimRow,
  type KBRow,
  type QuestionRow,
  type Relation,
  type Scope,
  type SourceRow,
  type SynthesisRow,
} from "./types";

export const DEFAULT_LEDGER_PATH = "kb/ledger.jsonl";

export type LoadedRow = {
  row: KBRow;
  line: number;
};

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
  line?: number | undefined;
  id?: string | undefined;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type Ledger = {
  rows: LoadedRow[];
  parseIssues: ValidationIssue[];
};

export type QueryOptions = {
  kind?: string | undefined;
  collection?: string | undefined;
  subject?: string | undefined;
  tag?: string | undefined;
  text?: string | undefined;
  includeHistory?: boolean | undefined;
};

type RowMap = Map<string, KBRow>;

export async function loadLedger(path = DEFAULT_LEDGER_PATH): Promise<Ledger> {
  let content = "";
  try {
    content = await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return { rows: [], parseIssues: [] };
    }
    throw error;
  }

  const rows: LoadedRow[] = [];
  const parseIssues: ValidationIssue[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]?.trim();
    if (!line) continue;
    const lineNumber = index + 1;
    try {
      rows.push({ row: JSON.parse(line) as KBRow, line: lineNumber });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      parseIssues.push({ level: "error", line: lineNumber, message: `Invalid JSON: ${detail}` });
    }
  }

  return { rows, parseIssues };
}

export async function readJsonInput(options: { file?: string | undefined; json?: string | undefined }): Promise<unknown> {
  if (options.file) {
    return JSON.parse(await readFile(options.file, "utf8"));
  }
  if (options.json) {
    return JSON.parse(options.json);
  }
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  if (!input) {
    throw new Error("Expected row JSON from --file, --json, or stdin.");
  }
  return JSON.parse(input);
}

export async function appendRow(path: string, row: unknown): Promise<ValidationResult> {
  const ledger = await loadLedger(path);
  const candidate = { row: row as KBRow, line: ledger.rows.length + 1 };
  const result = validateLedger([...ledger.rows, candidate], ledger.parseIssues);
  if (!result.ok) return result;

  await mkdir(dirname(path), { recursive: true });
  await appendFile(path, `${JSON.stringify(row)}\n`, "utf8");
  return result;
}

export function validateLedger(rows: LoadedRow[], parseIssues: ValidationIssue[] = []): ValidationResult {
  const issues: ValidationIssue[] = [...parseIssues];
  const byId: RowMap = new Map();
  const sourceIds = new Set<string>();

  for (const loaded of rows) {
    validateCommon(loaded, issues);
    const id = stringValue((loaded.row as { id?: unknown }).id);
    if (id) {
      if (byId.has(id)) {
        issues.push({ level: "error", line: loaded.line, id, message: `Duplicate id: ${id}` });
      } else {
        byId.set(id, loaded.row);
      }
    }
    if ((loaded.row as { kind?: unknown }).kind === "source" && id) {
      sourceIds.add(id);
    }
  }

  for (const loaded of rows) {
    const row = loaded.row;
    const kind = (row as { kind?: unknown }).kind;
    if (kind === "source") validateSource(loaded as LoadedRow & { row: SourceRow }, issues);
    if (kind === "claim") validateClaim(loaded as LoadedRow & { row: ClaimRow }, issues);
    if (kind === "question") validateQuestion(loaded, issues);
    if (kind === "synthesis") validateSynthesis(loaded as LoadedRow & { row: SynthesisRow }, issues);

    validateSourceRefs(loaded, sourceIds, issues);
    validateRelations(loaded, byId, issues);
  }

  validateSynthesisBasis(rows, byId, issues);
  validateQuestionAnswers(rows, byId, issues);

  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

export function effectiveRows(rows: LoadedRow[]): KBRow[] {
  const inactive = new Set<string>();

  for (const loaded of rows) {
    const relations = relationArray((loaded.row as { relations?: unknown }).relations);
    for (const relation of relations) {
      if (["supersedes", "retracts", "duplicates"].includes(relation.rel)) {
        inactive.add(relation.target_id);
      }
    }
  }

  return rows.map((loaded) => loaded.row).filter((row) => !inactive.has(row.id));
}

export function queryRows(rows: LoadedRow[], options: QueryOptions): KBRow[] {
  const haystack = options.includeHistory ? rows.map((loaded) => loaded.row) : effectiveRows(rows);
  const text = options.text?.toLowerCase();

  return haystack.filter((row) => {
    if (options.kind && row.kind !== options.kind) return false;
    if (options.collection && !row.scope.collections?.includes(options.collection)) return false;
    if (options.subject && !row.scope.subjects?.includes(options.subject)) return false;
    if (options.tag && !row.scope.tags?.includes(options.tag)) return false;
    if (text && !JSON.stringify(row).toLowerCase().includes(text)) return false;
    return true;
  });
}

export function renderCollection(rows: LoadedRow[], collection: string): string {
  const active = effectiveRows(rows).filter((row) => row.scope.collections?.includes(collection));
  const syntheses = active
    .filter((row): row is SynthesisRow => row.kind === "synthesis" && row.synthesis.status === "active")
    .sort(byImportanceThenCreated);
  const claims = active.filter((row): row is ClaimRow => row.kind === "claim").sort(byCreated);
  const questions = active
    .filter((row): row is QuestionRow => row.kind === "question" && row.question.status === "open")
    .sort(byCreated);
  const citedSourceIds = new Set<string>();

  for (const synthesis of syntheses) {
    for (const id of synthesis.synthesis.basis.source_ids ?? []) citedSourceIds.add(id);
  }
  for (const claim of claims) {
    for (const id of claim.provenance.source_ids ?? []) citedSourceIds.add(id);
    for (const evidence of claim.provenance.evidence ?? []) citedSourceIds.add(evidence.source_id);
  }

  const sources = active
    .filter((row): row is SourceRow => row.kind === "source" && citedSourceIds.has(row.id))
    .sort(byCreated);

  const title = titleize(collection);
  const lines = [`# ${title}`, "", `Last rendered: ${new Date().toISOString()}`, ""];

  lines.push("## Current Synthesis", "");
  if (syntheses.length === 0) {
    lines.push("No active synthesis rows.", "");
  } else {
    for (const synthesis of syntheses) {
      lines.push(`### ${synthesis.synthesis.title}`, "", synthesis.synthesis.summary, "");
      if (synthesis.synthesis.limitations) {
        lines.push(`Limitations: ${synthesis.synthesis.limitations}`, "");
      }
    }
  }

  lines.push("## Key Claims", "");
  if (claims.length === 0) {
    lines.push("No active claim rows.", "");
  } else {
    for (const claim of claims) {
      lines.push(`- ${claim.claim.statement}`);
      if (claim.assessment.confidence) lines.push(`  - Confidence: ${claim.assessment.confidence}`);
      const observed = claim.time.valid_at ?? claim.time.occurred_at ?? claim.time.first_observed_at;
      if (observed) lines.push(`  - Time: ${observed}`);
      const depth = claim.assessment.information_depth?.score;
      if (depth !== undefined) lines.push(`  - Depth: ${depth}/10`);
    }
    lines.push("");
  }

  lines.push("## Open Questions", "");
  if (questions.length === 0) {
    lines.push("No open question rows.", "");
  } else {
    for (const question of questions) {
      lines.push(`- ${question.question.text}`);
    }
    lines.push("");
  }

  lines.push("## Sources", "");
  if (sources.length === 0) {
    lines.push("No cited sources.", "");
  } else {
    for (const source of sources) {
      const publisher = source.source.publisher ? `${source.source.publisher} - ` : "";
      lines.push(`- ${publisher}${source.source.title}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

export async function writeRenderedCollection(path: string, rows: LoadedRow[], collection: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, renderCollection(rows, collection), "utf8");
}

function validateCommon(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  requireString(row.schema_version, "schema_version", loaded, issues);
  if (row.schema_version !== KB_SCHEMA_VERSION) {
    issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "schema_version must be kb.v1" });
  }
  requireString(row.id, "id", loaded, issues);
  requireEnum(row.kind, ROW_KINDS, "kind", loaded, issues);
  requireString(row.created_at, "created_at", loaded, issues);
  if (typeof row.created_at === "string" && Number.isNaN(Date.parse(row.created_at))) {
    issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "created_at must be ISO-ish datetime" });
  }
  requireString(row.created_by, "created_by", loaded, issues);
  if (!isRecord(row.scope)) {
    issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "scope must be an object" });
  } else if (!scopeHasAnchor(row.scope as Scope)) {
    issues.push({
      level: "error",
      line: loaded.line,
      id: stringValue(row.id),
      message: "scope must include at least one collection, subject, or tag",
    });
  }
}

function validateSource(loaded: LoadedRow & { row: SourceRow }, issues: ValidationIssue[]): void {
  const source = (loaded.row as { source?: unknown }).source;
  if (!isRecord(source)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "source row must include source object" });
    return;
  }
  requireEnum(source.type, SOURCE_TYPES, "source.type", loaded, issues);
  requireString(source.title, "source.title", loaded, issues);
  if (!stringValue(source.uri) && !stringValue(source.raw_path) && !stringValue(source.content_hash)) {
    issues.push({
      level: "error",
      line: loaded.line,
      id: loaded.row.id,
      message: "source row must include source.uri, source.raw_path, or source.content_hash",
    });
  }
  if (!isRecord((loaded.row as { provenance?: unknown }).provenance)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "source row must include provenance object" });
  }
}

function validateClaim(loaded: LoadedRow & { row: ClaimRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.identity)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim row must include identity object" });
  }
  if (!isRecord(row.claim)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim row must include claim object" });
  } else {
    requireString(row.claim.statement, "claim.statement", loaded, issues);
    if (typeof row.claim.atomic !== "boolean") {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim.atomic must be boolean" });
    }
  }
  if (!isRecord(row.time)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim row must include time object" });
  } else {
    requireEnum(row.time.precision, TIME_PRECISIONS, "time.precision", loaded, issues);
  }
  if (!isRecord(row.provenance)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim row must include provenance object" });
  } else if (!Array.isArray(row.provenance.evidence) || row.provenance.evidence.length === 0) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim provenance.evidence must have at least one item" });
  }
  if (!isRecord(row.assessment)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "claim row must include assessment object" });
  } else {
    requireEnum(row.assessment.confidence, CONFIDENCE_VALUES, "assessment.confidence", loaded, issues);
  }
}

function validateQuestion(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.question)) {
    issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "question row must include question object" });
    return;
  }
  requireString(row.question.text, "question.text", loaded, issues);
  requireEnum(row.question.status, QUESTION_STATUSES, "question.status", loaded, issues);
  if (row.question.priority !== undefined) {
    requireEnum(row.question.priority, QUESTION_PRIORITIES, "question.priority", loaded, issues);
  }
}

function validateSynthesis(loaded: LoadedRow & { row: SynthesisRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.synthesis)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "synthesis row must include synthesis object" });
    return;
  }
  requireString(row.synthesis.title, "synthesis.title", loaded, issues);
  requireString(row.synthesis.summary, "synthesis.summary", loaded, issues);
  requireEnum(row.synthesis.status, SYNTHESIS_STATUSES, "synthesis.status", loaded, issues);
  if (!isRecord(row.synthesis.basis)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "synthesis.basis must be an object" });
    return;
  }
  const basis = row.synthesis.basis as Record<string, unknown>;
  const hasBasis =
    nonEmptyStringArray(basis.claim_ids) || nonEmptyStringArray(basis.question_ids) || nonEmptyStringArray(basis.source_ids);
  if (!hasBasis && !stringValue(row.synthesis.limitations)) {
    issues.push({
      level: "error",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis must include a basis id or explicit limitations note",
    });
  }
}

function validateSourceRefs(loaded: LoadedRow, sourceIds: Set<string>, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  const provenance = isRecord(row.provenance) ? row.provenance : undefined;
  if (!provenance) return;

  for (const sourceId of stringArray(provenance.source_ids)) {
    if (!sourceIds.has(sourceId)) {
      issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: `Unresolved provenance source_id: ${sourceId}` });
    }
  }

  if (Array.isArray(provenance.evidence)) {
    for (const evidence of provenance.evidence) {
      if (!isRecord(evidence)) {
        issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "Evidence item must be an object" });
        continue;
      }
      const sourceId = stringValue(evidence.source_id);
      if (!sourceId) {
        issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "Evidence item must include source_id" });
      } else if (!sourceIds.has(sourceId)) {
        issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: `Unresolved evidence source_id: ${sourceId}` });
      }
      requireEnum(evidence.role, ["supports", "contradicts", "context"] as const, "evidence.role", loaded, issues);
      requireString(evidence.summary, "evidence.summary", loaded, issues);
    }
  }
}

function validateRelations(loaded: LoadedRow, byId: RowMap, issues: ValidationIssue[]): void {
  const relations = (loaded.row as { relations?: unknown }).relations;
  if (relations === undefined) return;
  if (!Array.isArray(relations)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "relations must be an array" });
    return;
  }
  for (const relation of relations) {
    if (!isRecord(relation)) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "relation item must be an object" });
      continue;
    }
    const targetId = stringValue(relation.target_id);
    if (!targetId) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "relation.target_id is required" });
    } else if (!byId.has(targetId)) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `Unresolved relation target_id: ${targetId}` });
    }
    requireEnum(relation.rel, RELATION_TYPES, "relation.rel", loaded, issues);
  }
}

function validateSynthesisBasis(rows: LoadedRow[], byId: RowMap, issues: ValidationIssue[]): void {
  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "synthesis") continue;
    const synthesis = (loaded.row as SynthesisRow).synthesis;
    if (!isRecord(synthesis?.basis)) continue;
    for (const id of synthesis.basis.claim_ids ?? []) requireTargetKind(id, "claim", loaded, byId, issues, "synthesis.basis.claim_ids");
    for (const id of synthesis.basis.question_ids ?? []) requireTargetKind(id, "question", loaded, byId, issues, "synthesis.basis.question_ids");
    for (const id of synthesis.basis.source_ids ?? []) requireTargetKind(id, "source", loaded, byId, issues, "synthesis.basis.source_ids");
  }
}

function validateQuestionAnswers(rows: LoadedRow[], byId: RowMap, issues: ValidationIssue[]): void {
  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "question") continue;
    const answerId = (loaded.row as { question?: { answer_claim_id?: unknown } }).question?.answer_claim_id;
    if (typeof answerId === "string" && answerId) {
      requireTargetKind(answerId, "claim", loaded, byId, issues, "question.answer_claim_id");
    }
  }
}

function requireTargetKind(
  id: string,
  kind: string,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
): void {
  const target = byId.get(id);
  if (!target) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `Unresolved ${field}: ${id}` });
    return;
  }
  if (target.kind !== kind) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `${field} must reference a ${kind} row: ${id}` });
  }
}

function requireString(value: unknown, field: string, loaded: LoadedRow, issues: ValidationIssue[]): void {
  if (!stringValue(value)) {
    issues.push({ level: "error", line: loaded.line, id: stringValue((loaded.row as { id?: unknown }).id), message: `${field} is required` });
  }
}

function requireEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({
      level: "error",
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} must be one of: ${allowed.join(", ")}`,
    });
  }
}

function relationArray(value: unknown): Relation[] {
  return Array.isArray(value) ? (value.filter(isRecord) as Relation[]) : [];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function nonEmptyStringArray(value: unknown): boolean {
  return stringArray(value).length > 0;
}

function scopeHasAnchor(scope: Scope): boolean {
  return Boolean(scope.collections?.length || scope.subjects?.length || scope.tags?.length);
}

function byCreated(a: KBRow, b: KBRow): number {
  return a.created_at.localeCompare(b.created_at);
}

function byImportanceThenCreated(a: SynthesisRow, b: SynthesisRow): number {
  const importanceA = a.assessment?.importance ?? 0;
  const importanceB = b.assessment?.importance ?? 0;
  return importanceB - importanceA || b.created_at.localeCompare(a.created_at);
}

function titleize(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
