// Contract module — V1 source of truth for row contracts, operation contracts,
// validation, samples, and JSON Schema. The contract module must not read files,
// inspect the workspace, choose clocks, or allocate randomness itself.


export const KNB_SCHEMA_VERSION = "knb.v1" as const;

export const ROW_KINDS = ["source", "claim", "question", "synthesis", "entry"] as const;
export const QUESTION_STATUSES = ["open", "resolved", "archived"] as const;
export const QUESTION_PRIORITIES = ["low", "medium", "high"] as const;
export const SYNTHESIS_STATUSES = ["active", "archived"] as const;
export const CONFIDENCE_VALUES = ["unknown", "low", "medium", "high"] as const;
export const ASSESSMENT_LEVELS = ["unknown", "low", "medium", "high"] as const;
export const INFORMATION_DEPTH_VALUES = ["unknown", "thin", "partial", "strong", "complete"] as const;
export const TIME_PRECISIONS = ["instant", "hour", "day", "month", "year", "range", "unknown"] as const;
export const SOURCE_TYPES = [
  "article",
  "official_record",
  "dataset",
  "paper",
  "social_post",
  "transcript",
  "legal_document",
  "api_response",
  "raw_note",
  "web_page",
  "other",
] as const;
export const LINK_TYPES = [
  "supports",
  "contradicts",
  "depends_on",
  "context_for",
] as const;
export const ENTRY_ACTIONS = ["retract", "supersede", "merge", "link", "patch"] as const;
export const EVIDENCE_ROLES = ["supports", "contradicts", "context"] as const;
export const APPLY_OPERATION_KINDS = ["add", "retract", "supersede", "merge", "link", "patch"] as const;
export const KIND_PREFIXES = {
  source: "src",
  claim: "claim",
  question: "q",
  synthesis: "synth",
  entry: "ent",
} as const;

export type KnbRowKind = (typeof ROW_KINDS)[number];
export type LinkType = (typeof LINK_TYPES)[number] | (string & {});
export type EntryAction = (typeof ENTRY_ACTIONS)[number];
export type AssessmentLevel = (typeof ASSESSMENT_LEVELS)[number];
export type ApplyOperationKind = (typeof APPLY_OPERATION_KINDS)[number];

export type Scope = {
  profiles?: string[];
  subjects?: string[];
  tags?: string[];
  language?: string | null;
  geo?: string[];
};

export type ExternalRef = {
  system: string;
  id: string;
  type?: string | null;
  path?: string | null;
};

export type Identity = {
  claim_key?: string;
  thread_key?: string;
  checked_at?: string;
};

export type Time = {
  occurred_at?: string | null;
  valid_at?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  reported_at?: string | null;
  first_observed_at?: string | null;
  last_checked_at?: string | null;
  precision: (typeof TIME_PRECISIONS)[number];
  timezone?: string | null;
  notes?: string;
};

export type EvidenceRef = {
  source_id: string;
  role: "supports" | "contradicts" | "context";
  locator?: {
    url?: string | null;
    path?: string | null;
    page?: string | number | null;
    section?: string | null;
    quote?: string | null;
  };
  summary: string;
};

export type Acquisition = {
  method?: string;
  query?: string | null;
  retrieved_at?: string | null;
  observed_at?: string | null;
  run_id?: string | null;
  agent?: string | null;
};

export type Transformation = {
  type: "translation" | "summarization" | "calculation" | "normalization" | "extraction";
  from?: string | null;
  to?: string | null;
  tool?: string | null;
  notes?: string;
};

export type Provenance = {
  source_ids?: string[];
  evidence?: EvidenceRef[];
  acquisition?: Acquisition;
  transformations?: Transformation[];
  derivation?: {
    method: "direct" | "extracted" | "inferred" | "calculated" | "translated" | "summarized";
    notes?: string;
  };
};

export type Assessment = {
  confidence?: "unknown" | "low" | "medium" | "high";
  source_reliability?: AssessmentLevel;
  information_depth?: {
    level: (typeof INFORMATION_DEPTH_VALUES)[number];
    rationale: string;
  };
  importance?: AssessmentLevel;
  contested?: boolean;
  uncertainty?: string;
};

export type Link = {
  target_id: string;
  rel: LinkType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type EntryLink = {
  from_id: string;
  to_id: string;
  rel: LinkType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type KnbRowCommon = {
  schema_version: typeof KNB_SCHEMA_VERSION;
  id: string;
  kind: KnbRowKind;
  created_at: string;
  created_by: string;
  scope: Scope;
  external_refs?: ExternalRef[];
};

export type SourceRow = KnbRowCommon & {
  kind: "source";
  source: {
    type: (typeof SOURCE_TYPES)[number];
    title: string;
    uri?: string | null;
    publisher?: string | null;
    author?: string | null;
    language?: string | null;
    published_at?: string | null;
    content_hash?: string | null;
    raw_path?: string | null;
  };
  provenance: Provenance;
  assessment?: Assessment;
};

export type ClaimRow = KnbRowCommon & {
  kind: "claim";
  identity: Identity;
  claim: {
    statement: string;
    atomic: boolean;
    type?: string;
    subject?: string;
    predicate?: string;
    object?: string;
    qualifiers?: Record<string, unknown>;
  };
  time: Time;
  provenance: Provenance;
  assessment: Assessment;
  links?: Link[];
};

export type QuestionRow = KnbRowCommon & {
  kind: "question";
  question: {
    text: string;
    status: "open" | "resolved" | "archived";
    priority?: "low" | "medium" | "high";
    resolution_criteria?: string;
    why_it_matters?: string;
    answer_claim_id?: string | null;
  };
  time?: Time;
  provenance?: Provenance;
  assessment?: Assessment;
  links?: Link[];
};

export type SynthesisRow = KnbRowCommon & {
  kind: "synthesis";
  synthesis: {
    title: string;
    summary: string;
    basis: {
      claim_ids?: string[];
      question_ids?: string[];
      source_ids?: string[];
    };
    limitations?: string;
    status: "active" | "archived";
  };
  provenance?: Provenance;
  assessment?: Assessment;
  links?: Link[];
};

export type EntryRow = KnbRowCommon & {
  kind: "entry";
  entry: {
    action: EntryAction;
    target_ids?: string[];
    target_id?: string;
    replacement_id?: string;
    canonical_id?: string;
    reason?: string;
    link?: EntryLink;
    patch?: Array<Record<string, unknown>>;
  };
};

export type KnbRow = SourceRow | ClaimRow | QuestionRow | SynthesisRow | EntryRow;

export type Ref = string;

type OmitCommon<T> = Omit<T, "schema_version" | "created_at" | "created_by" | "id" | "kind" | "scope">;
type DistributeDraft<T> = T extends KnbRow ? Partial<OmitCommon<T>> & { kind: T["kind"]; id?: string; scope: Scope } : never;
export type DraftRow = DistributeDraft<KnbRow>;

export type RefSlotKind = "source" | "claim" | "question" | "any";

export type RefSlot = {
  kind: RefSlotKind;
  path: string;
  get(): string;
  set(newId: string): void;
};

export function* referenceFields(row: KnbRow | DraftRow): Iterable<RefSlot> {
  const record = row as Record<string, unknown>;

  const provenance = record.provenance;
  if (isRecord(provenance)) {
    yield* arrayRefSlots(provenance.source_ids, "source", "provenance.source_ids");
    const evidence = provenance.evidence;
    if (Array.isArray(evidence)) {
      for (let index = 0; index < evidence.length; index += 1) {
        const item = evidence[index];
        if (!isRecord(item)) continue;
        const slot = objectRefSlot(item, "source_id", "source", `provenance.evidence[${index}].source_id`);
        if (slot) yield slot;
      }
    }
  }

  const links = record.links;
  if (Array.isArray(links)) {
    for (let index = 0; index < links.length; index += 1) {
      const link = links[index];
      if (!isRecord(link)) continue;
      const slot = objectRefSlot(link, "target_id", "any", `links[${index}].target_id`);
      if (slot) yield slot;
    }
  }

  const question = record.question;
  if (isRecord(question)) {
    const slot = objectRefSlot(question, "answer_claim_id", "claim", "question.answer_claim_id");
    if (slot) yield slot;
  }

  const synthesis = record.synthesis;
  if (isRecord(synthesis) && isRecord(synthesis.basis)) {
    yield* arrayRefSlots(synthesis.basis.claim_ids, "claim", "synthesis.basis.claim_ids");
    yield* arrayRefSlots(synthesis.basis.question_ids, "question", "synthesis.basis.question_ids");
    yield* arrayRefSlots(synthesis.basis.source_ids, "source", "synthesis.basis.source_ids");
  }

  const entry = record.entry;
  if (isRecord(entry)) {
    yield* arrayRefSlots(entry.target_ids, "any", "entry.target_ids");
    const targetSlot = objectRefSlot(entry, "target_id", "any", "entry.target_id");
    if (targetSlot) yield targetSlot;
    const replacementSlot = objectRefSlot(entry, "replacement_id", "any", "entry.replacement_id");
    if (replacementSlot) yield replacementSlot;
    const canonicalSlot = objectRefSlot(entry, "canonical_id", "any", "entry.canonical_id");
    if (canonicalSlot) yield canonicalSlot;
    if (isRecord(entry.link)) {
      const fromSlot = objectRefSlot(entry.link, "from_id", "any", "entry.link.from_id");
      if (fromSlot) yield fromSlot;
      const toSlot = objectRefSlot(entry.link, "to_id", "any", "entry.link.to_id");
      if (toSlot) yield toSlot;
    }
  }
}

function* arrayRefSlots(value: unknown, kind: RefSlotKind, basePath: string): Iterable<RefSlot> {
  if (!Array.isArray(value)) return;
  for (let index = 0; index < value.length; index += 1) {
    if (typeof value[index] !== "string") continue;
    yield {
      kind,
      path: `${basePath}[${index}]`,
      get: () => value[index] as string,
      set(newId: string): void {
        value[index] = newId;
      },
    };
  }
}

function objectRefSlot(
  object: Record<string, unknown>,
  key: string,
  kind: RefSlotKind,
  path: string,
): RefSlot | undefined {
  if (typeof object[key] !== "string") return undefined;
  return {
    kind,
    path,
    get: () => object[key] as string,
    set(newId: string): void {
      object[key] = newId;
    },
  };
}

export type ApplyOperation =
  | { op: "add"; row: DraftRow; as?: string }
  | { op: "retract"; target_ids: Ref[]; reason: string; scope?: Scope; as?: string }
  | {
      op: "supersede";
      target_ids: Ref[];
      replacement_id: Ref;
      reason: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "merge";
      target_ids: Ref[];
      canonical_id: Ref;
      reason: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "link";
      from_id: Ref;
      to_id: Ref;
      rel: LinkType;
      strength?: "low" | "medium" | "high";
      rationale?: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "patch";
      target_id: Ref;
      patch: Array<Record<string, unknown>>;
      reason: string;
      scope?: Scope;
      as?: string;
    };

export type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true;
  actor?: string;
  now?: string;
  run_id?: string;
  intent?: string;
};

export type ValidationIssue = {
  level: "error" | "warning";
  code?: string | undefined;
  message: string;
  path?: string | undefined;
  line?: number | undefined;
  id?: string | undefined;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type LedgerValidationOptions = {
  profileLinkRels?: Record<string, readonly string[]>;
};

export type LoadedRow = {
  row: KnbRow;
  line: number;
};

export type DraftCompletionDeps = {
  actor: string;
  now: () => Date;
  randomIdPart: (bytes: number) => string;
};

export type DraftCompletionResult =
  | { ok: true; row: KnbRow; issues: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

type RowMap = Map<string, KnbRow>;

export function validateLedger(
  rows: LoadedRow[],
  parseIssues: ValidationIssue[] = [],
  options: LedgerValidationOptions = {},
): ValidationResult {
  const issues: ValidationIssue[] = [...parseIssues];
  const byId: RowMap = new Map();
  const sourceIds = new Set<string>();
  const sourceUris = new Map<string, LoadedRow>();
  const sourceHashes = new Map<string, LoadedRow>();

  for (const loaded of rows) {
    validateCommon(loaded, issues);
    const id = stringValue((loaded.row as { id?: unknown }).id);
    if (id) {
      if (byId.has(id)) {
        issues.push({
          level: "error",
          code: "duplicate_id",
          line: loaded.line,
          id,
          message: `Duplicate id: ${id}`,
          path: "id",
        });
      } else {
        byId.set(id, loaded.row);
      }
    }
    if ((loaded.row as { kind?: unknown }).kind === "source" && id) {
      sourceIds.add(id);
    }
  }
  const inactiveSourceIds = collectInactiveSourceIds(rows, byId);

  for (const loaded of rows) {
    const row = loaded.row;
    const kind = (row as { kind?: unknown }).kind;
    if (kind === "source") {
      validateSource(loaded as LoadedRow & { row: SourceRow }, issues);
      checkSourceDuplicate(
        loaded as LoadedRow & { row: SourceRow },
        sourceUris,
        sourceHashes,
        inactiveSourceIds,
        issues,
      );
    }
    if (kind === "claim") validateClaim(loaded as LoadedRow & { row: ClaimRow }, issues);
    if (kind === "question") validateQuestion(loaded, issues);
    if (kind === "synthesis") validateSynthesis(loaded as LoadedRow & { row: SynthesisRow }, issues);
    if (kind === "entry") validateEntry(loaded as LoadedRow & { row: EntryRow }, byId, issues, options);

    validateSourceRefs(loaded, sourceIds, issues);
    validateLinks(loaded, byId, issues, options);
  }

  validateSynthesisBasis(rows, byId, issues);
  validateQuestionAnswers(rows, byId, issues);

  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

function collectInactiveSourceIds(rows: LoadedRow[], byId: RowMap): Set<string> {
  const inactive = new Set<string>();
  for (const loaded of rows) {
    const row = loaded.row;
    if ((row as { kind?: unknown }).kind !== "entry") continue;
    const entry = (row as EntryRow).entry;
    if (!isRecord(entry)) continue;
    const action = stringValue(entry.action);
    if (action !== "retract" && action !== "supersede" && action !== "merge") continue;
    if (!Array.isArray(entry.target_ids)) continue;
    for (const targetId of entry.target_ids) {
      if (typeof targetId !== "string" || targetId.length === 0) continue;
      const target = byId.get(targetId);
      if (target?.kind === "source") inactive.add(targetId);
    }
  }
  return inactive;
}

export function validateRows(rows: KnbRow[], options: LedgerValidationOptions = {}): ValidationResult {
  return validateLedger(rows.map((row, index) => ({ row, line: index + 1 })), [], options);
}

export function validateApplyRequest(request: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(request)) {
    issues.push({ level: "error", code: "apply_request_invalid", message: "ApplyRequest must be an object", path: "" });
    return { ok: false, issues };
  }
  if (request.atomic === false) {
    issues.push({
      level: "error",
      code: "unsafe_operation_refused",
      message: "atomic: false is not supported in v1; apply must be atomic",
      path: "atomic",
    });
  }
  const operations = (request as { operations?: unknown }).operations;
  if (!Array.isArray(operations)) {
    issues.push({
      level: "error",
      code: "apply_request_invalid",
      message: "ApplyRequest.operations must be an array",
      path: "operations",
    });
    return { ok: !issues.some((issue) => issue.level === "error"), issues };
  }
  for (let index = 0; index < operations.length; index += 1) {
    validateOperation(operations[index], `operations[${index}]`, issues);
  }
  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

export function completeDraftRow(draft: DraftRow, deps: DraftCompletionDeps): DraftCompletionResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(draft)) {
    issues.push({ level: "error", code: "draft_invalid", message: "draft must be an object", path: "" });
    return { ok: false, issues };
  }
  const kind = (draft as { kind?: unknown }).kind;
  if (typeof kind !== "string" || !ROW_KINDS.includes(kind as KnbRowKind)) {
    issues.push({
      level: "error",
      code: "kind_invalid",
      message: `kind must be one of: ${ROW_KINDS.join(", ")}`,
      path: "kind",
    });
    return { ok: false, issues };
  }
  const scope = (draft as { scope?: unknown }).scope;
  if (!isRecord(scope)) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      message: "scope must include at least one profile, subject, or tag",
      path: "scope",
    });
    return { ok: false, issues };
  }
  const slug = scopeSlug(scope as Scope);
  if (!slug) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      message: "scope must include at least one profile, subject, or tag",
      path: "scope",
    });
    return { ok: false, issues };
  }

  const date = deps.now();
  if (Number.isNaN(date.getTime())) {
    issues.push({ level: "error", code: "now_invalid", message: "deps.now() returned an invalid date" });
    return { ok: false, issues };
  }

  const providedId = typeof draft.id === "string" && draft.id.length > 0 ? draft.id : undefined;
  const id = providedId ?? generateId(kind as KnbRowKind, slug, date, deps.randomIdPart);

  const completed: KnbRow = {
    ...(draft as object),
    id,
    schema_version: KNB_SCHEMA_VERSION,
    created_at: date.toISOString(),
    created_by: deps.actor,
  } as KnbRow;

  return { ok: true, row: completed, issues };
}

export function generateId(
  kind: KnbRowKind,
  slug: string,
  date: Date,
  randomIdPart: (bytes: number) => string,
): string {
  return `${KIND_PREFIXES[kind]}:${slug}:${formatYmd(date)}:${randomIdPart(4)}`;
}

export function scopeSlug(scope: Scope): string | undefined {
  const candidate =
    scope.profiles?.[0] ?? scope.subjects?.[0] ?? scope.tags?.[0] ?? undefined;
  if (!candidate) return undefined;
  return slugify(candidate);
}

export function rowSamples(): { source: SourceRow; claim: ClaimRow; question: QuestionRow; synthesis: SynthesisRow; entry: EntryRow } {
  const source: SourceRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "src:example:20260501:aaaa1111",
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:example",
    scope: { profiles: ["research.v1"], subjects: ["Example"] },
    source: {
      type: "web_page",
      title: "Example source",
      uri: "https://example.com",
    },
    provenance: {
      acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" },
    },
  };

  const claim: ClaimRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "claim:example:20260501:bbbb2222",
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:example",
    scope: { profiles: ["research.v1"], subjects: ["Example"], tags: ["fact"] },
    identity: { claim_key: "example|exists" },
    claim: {
      statement: "Example exists.",
      atomic: true,
    },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [source.id],
      evidence: [
        { source_id: source.id, role: "supports", summary: "The example source supports the claim." },
      ],
    },
    assessment: {
      confidence: "high",
      source_reliability: "high",
      information_depth: { level: "partial", rationale: "Single supporting source; no contradicting evidence checked." },
    },
  };

  const question: QuestionRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "q:example:20260501:cccc3333",
    kind: "question",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:example",
    scope: { profiles: ["research.v1"], subjects: ["Example"] },
    question: {
      text: "Does the example always exist?",
      status: "open",
      priority: "medium",
    },
  };

  const synthesis: SynthesisRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "synth:example:20260501:dddd4444",
    kind: "synthesis",
    created_at: "2026-05-01T12:03:00Z",
    created_by: "agent:example",
    scope: { profiles: ["research.v1"], subjects: ["Example"] },
    synthesis: {
      title: "Example synthesis",
      summary: "Examples usually exist when referenced.",
      basis: {
        claim_ids: [claim.id],
        question_ids: [question.id],
        source_ids: [source.id],
      },
      status: "active",
    },
  };

  const entry: EntryRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "ent:example:20260501:eeee5555",
    kind: "entry",
    created_at: "2026-05-01T12:04:00Z",
    created_by: "agent:example",
    scope: { profiles: ["research.v1"], subjects: ["Example"] },
    entry: {
      action: "retract",
      target_ids: [claim.id],
      reason: "Replaced by a more precise claim.",
    },
  };

  return { source, claim, question, synthesis, entry };
}

export function operationSamples(): {
  add: ApplyOperation;
  retract: ApplyOperation;
  supersede: ApplyOperation;
  merge: ApplyOperation;
  link: ApplyOperation;
  patch: ApplyOperation;
} {
  const samples = rowSamples();
  return {
    add: {
      op: "add",
      as: "claim",
      row: {
        kind: "claim",
        scope: { profiles: ["research.v1"], subjects: ["Example"] },
        identity: { claim_key: "example|exists" },
        claim: { statement: "Example exists.", atomic: true },
        time: { precision: "unknown" },
        provenance: {
          evidence: [
            { source_id: samples.source.id, role: "supports", summary: "The source supports the claim." },
          ],
        },
        assessment: { confidence: "high" },
      },
    },
    retract: {
      op: "retract",
      target_ids: [samples.claim.id],
      reason: "Claim was retracted by the author.",
    },
    supersede: {
      op: "supersede",
      target_ids: [samples.claim.id],
      replacement_id: "$newClaim",
      reason: "Replacement states the same fact more precisely.",
    },
    merge: {
      op: "merge",
      target_ids: [samples.claim.id],
      canonical_id: "$canonicalClaim",
      reason: "Both rows describe the same fact.",
    },
    link: {
      op: "link",
      from_id: samples.claim.id,
      to_id: samples.source.id,
      rel: "supports",
      rationale: "Source supports the claim.",
    },
    patch: {
      op: "patch",
      target_id: samples.claim.id,
      patch: [{ op: "replace", path: "/claim/statement", value: "Example exists for sure." }],
      reason: "Mechanical correction of typo.",
    },
  };
}

export function jsonSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: KNB_SCHEMA_VERSION,
    title: "knb JSONL Row",
    type: "object",
    required: ["schema_version", "id", "kind", "created_at", "created_by", "scope"],
    properties: {
      schema_version: { const: KNB_SCHEMA_VERSION },
      id: { type: "string", minLength: 1 },
      kind: { enum: [...ROW_KINDS] },
      created_at: { type: "string" },
      created_by: { type: "string" },
      scope: { $ref: "#/$defs/scope" },
      external_refs: { type: "array", items: { $ref: "#/$defs/external_ref" } },
      identity: { $ref: "#/$defs/identity" },
      source: { $ref: "#/$defs/source" },
      claim: { $ref: "#/$defs/claim" },
      question: { $ref: "#/$defs/question" },
      synthesis: { $ref: "#/$defs/synthesis" },
      entry: { $ref: "#/$defs/entry" },
      time: { $ref: "#/$defs/time" },
      provenance: { $ref: "#/$defs/provenance" },
      assessment: { $ref: "#/$defs/assessment" },
      links: { type: "array", items: { $ref: "#/$defs/link" } },
    },
    allOf: [
      {
        if: { properties: { kind: { const: "source" } } },
        then: { required: ["source", "provenance"] },
      },
      {
        if: { properties: { kind: { const: "claim" } } },
        then: {
          required: ["identity", "claim", "time", "provenance", "assessment"],
          properties: {
            provenance: {
              required: ["evidence"],
              properties: { evidence: { minItems: 1 } },
            },
            assessment: { required: ["confidence"] },
          },
        },
      },
      {
        if: { properties: { kind: { const: "question" } } },
        then: { required: ["question"] },
      },
      {
        if: { properties: { kind: { const: "synthesis" } } },
        then: { required: ["synthesis"] },
      },
      {
        if: { properties: { kind: { const: "entry" } } },
        then: { required: ["entry"] },
      },
    ],
    $defs: {
      scope: {
        type: "object",
        properties: {
          profiles: { type: "array", items: { type: "string" } },
          subjects: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          language: { type: ["string", "null"] },
          geo: { type: "array", items: { type: "string" } },
        },
        anyOf: [
          { required: ["profiles"] },
          { required: ["subjects"] },
          { required: ["tags"] },
        ],
      },
      external_ref: {
        type: "object",
        required: ["system", "id"],
        properties: {
          system: { type: "string" },
          id: { type: "string" },
          type: { type: ["string", "null"] },
          path: { type: ["string", "null"] },
        },
      },
      identity: {
        type: "object",
        properties: {
          claim_key: { type: "string" },
          thread_key: { type: "string" },
          checked_at: { type: "string" },
        },
      },
      source: {
        type: "object",
        required: ["type", "title"],
        anyOf: [
          { required: ["uri"] },
          { required: ["raw_path"] },
          { required: ["content_hash"] },
        ],
        properties: {
          type: { enum: [...SOURCE_TYPES] },
          title: { type: "string" },
          uri: { type: ["string", "null"] },
          publisher: { type: ["string", "null"] },
          author: { type: ["string", "null"] },
          language: { type: ["string", "null"] },
          published_at: { type: ["string", "null"] },
          content_hash: { type: ["string", "null"] },
          raw_path: { type: ["string", "null"] },
        },
      },
      claim: {
        type: "object",
        required: ["statement", "atomic"],
        properties: {
          statement: { type: "string" },
          atomic: { type: "boolean" },
          type: { type: "string" },
          subject: { type: "string" },
          predicate: { type: "string" },
          object: { type: "string" },
          qualifiers: { type: "object" },
        },
      },
      question: {
        type: "object",
        required: ["text", "status"],
        properties: {
          text: { type: "string" },
          status: { enum: [...QUESTION_STATUSES] },
          priority: { enum: [...QUESTION_PRIORITIES] },
          resolution_criteria: { type: "string" },
          why_it_matters: { type: "string" },
          answer_claim_id: { type: ["string", "null"] },
        },
      },
      synthesis: {
        type: "object",
        required: ["title", "summary", "basis", "status"],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          basis: {
            type: "object",
            properties: {
              claim_ids: { type: "array", items: { type: "string" } },
              question_ids: { type: "array", items: { type: "string" } },
              source_ids: { type: "array", items: { type: "string" } },
            },
          },
          limitations: { type: "string" },
          status: { enum: [...SYNTHESIS_STATUSES] },
        },
      },
      entry: {
        type: "object",
        required: ["action"],
        properties: {
          action: { enum: [...ENTRY_ACTIONS] },
          target_ids: { type: "array", items: { type: "string" } },
          target_id: { type: "string" },
          replacement_id: { type: "string" },
          canonical_id: { type: "string" },
          reason: { type: "string" },
          link: {
            type: "object",
            required: ["from_id", "to_id", "rel"],
            properties: {
              from_id: { type: "string" },
              to_id: { type: "string" },
              target_id: { type: "string" },
              rel: { enum: [...LINK_TYPES] },
              strength: { enum: ["low", "medium", "high"] },
              rationale: { type: "string" },
            },
          },
          patch: { type: "array", items: { type: "object" } },
        },
      },
      time: {
        type: "object",
        required: ["precision"],
        properties: {
          occurred_at: { type: ["string", "null"] },
          valid_at: { type: ["string", "null"] },
          valid_from: { type: ["string", "null"] },
          valid_until: { type: ["string", "null"] },
          reported_at: { type: ["string", "null"] },
          first_observed_at: { type: ["string", "null"] },
          last_checked_at: { type: ["string", "null"] },
          precision: { enum: [...TIME_PRECISIONS] },
          timezone: { type: ["string", "null"] },
          notes: { type: "string" },
        },
      },
      provenance: {
        type: "object",
        properties: {
          source_ids: { type: "array", items: { type: "string" } },
          evidence: { type: "array", items: { $ref: "#/$defs/evidence_ref" } },
          acquisition: { type: "object" },
          transformations: { type: "array", items: { type: "object" } },
          derivation: { type: "object" },
        },
      },
      evidence_ref: {
        type: "object",
        required: ["source_id", "role", "summary"],
        properties: {
          source_id: { type: "string" },
          role: { enum: [...EVIDENCE_ROLES] },
          locator: { type: "object" },
          summary: { type: "string" },
        },
      },
      assessment: {
        type: "object",
        properties: {
          confidence: { enum: [...CONFIDENCE_VALUES] },
          source_reliability: { enum: [...ASSESSMENT_LEVELS] },
          information_depth: {
            type: "object",
            required: ["level", "rationale"],
            properties: {
              level: { enum: [...INFORMATION_DEPTH_VALUES] },
              rationale: { type: "string" },
            },
          },
          importance: { enum: [...ASSESSMENT_LEVELS] },
          contested: { type: "boolean" },
          uncertainty: { type: "string" },
        },
      },
      link: {
        type: "object",
        required: ["target_id", "rel"],
        properties: {
          target_id: { type: "string" },
          rel: { enum: [...LINK_TYPES] },
          strength: { enum: ["low", "medium", "high"] },
          rationale: { type: "string" },
        },
      },
    },
  };
}

function validateCommon(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  const id = stringValue(row.id);
  if (!stringValue(row.schema_version)) {
    issues.push({
      level: "error",
      code: "schema_version_required",
      line: loaded.line,
      id,
      message: "schema_version is required",
      path: "schema_version",
    });
  } else if (row.schema_version !== KNB_SCHEMA_VERSION) {
    issues.push({
      level: "error",
      code: "schema_version_invalid",
      line: loaded.line,
      id,
      message: `schema_version must be ${KNB_SCHEMA_VERSION}`,
      path: "schema_version",
    });
  }
  if (!id) {
    issues.push({ level: "error", code: "id_required", line: loaded.line, message: "id is required", path: "id" });
  }
  if (typeof row.kind !== "string" || !ROW_KINDS.includes(row.kind as KnbRowKind)) {
    issues.push({
      level: "error",
      code: "kind_invalid",
      line: loaded.line,
      id,
      message: `kind must be one of: ${ROW_KINDS.join(", ")}`,
      path: "kind",
    });
  }
  if (!stringValue(row.created_at)) {
    issues.push({
      level: "error",
      code: "created_at_required",
      line: loaded.line,
      id,
      message: "created_at is required",
      path: "created_at",
    });
  } else if (typeof row.created_at === "string" && Number.isNaN(Date.parse(row.created_at))) {
    issues.push({
      level: "error",
      code: "created_at_invalid",
      line: loaded.line,
      id,
      message: "created_at must be ISO-ish datetime",
      path: "created_at",
    });
  }
  if (!stringValue(row.created_by)) {
    issues.push({
      level: "error",
      code: "created_by_required",
      line: loaded.line,
      id,
      message: "created_by is required",
      path: "created_by",
    });
  }
  if (!isRecord(row.scope)) {
    issues.push({
      level: "error",
      code: "scope_invalid",
      line: loaded.line,
      id,
      message: "scope must be an object",
      path: "scope",
    });
  } else if (!scopeHasAnchor(row.scope as Scope)) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      line: loaded.line,
      id,
      message: "scope must include at least one profile, subject, or tag",
      path: "scope",
    });
  }
}

function validateSource(loaded: LoadedRow & { row: SourceRow }, issues: ValidationIssue[]): void {
  const row = loaded.row;
  const source = (row as { source?: unknown }).source;
  if (!isRecord(source)) {
    issues.push({
      level: "error",
      code: "source_object_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include source object",
      path: "source",
    });
    return;
  }
  requireEnum(source.type, SOURCE_TYPES, "source.type", "source_type_invalid", loaded, issues);
  requireString(source.title, "source.title", "source_title_required", loaded, issues);
  if (!stringValue(source.uri) && !stringValue(source.raw_path) && !stringValue(source.content_hash)) {
    issues.push({
      level: "error",
      code: "source_evidence_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include source.uri, source.raw_path, or source.content_hash",
      path: "source",
    });
  }
  if (!isRecord((row as { provenance?: unknown }).provenance)) {
    issues.push({
      level: "error",
      code: "source_provenance_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include provenance object",
      path: "provenance",
    });
  }
  validateAssessment((row as { assessment?: unknown }).assessment, loaded, issues, { requireConfidence: false });
}

function checkSourceDuplicate(
  loaded: LoadedRow & { row: SourceRow },
  uris: Map<string, LoadedRow>,
  hashes: Map<string, LoadedRow>,
  inactiveSourceIds: Set<string>,
  issues: ValidationIssue[],
): void {
  const source = (loaded.row as { source?: unknown }).source;
  if (!isRecord(source)) return;
  if (inactiveSourceIds.has(loaded.row.id)) return;
  const uri = stringValue(source.uri);
  if (uri) {
    const previous = uris.get(uri);
    if (previous) {
      issues.push({
        level: "warning",
        code: "duplicate_source_evidence",
        line: loaded.line,
        id: loaded.row.id,
        message: `Duplicate source.uri: ${uri} also appears at line ${previous.line}`,
        path: "source.uri",
      });
    } else {
      uris.set(uri, loaded);
    }
  }
  const hash = stringValue(source.content_hash);
  if (hash) {
    const previous = hashes.get(hash);
    if (previous) {
      issues.push({
        level: "warning",
        code: "duplicate_source_evidence",
        line: loaded.line,
        id: loaded.row.id,
        message: `Duplicate source.content_hash: ${hash} also appears at line ${previous.line}`,
        path: "source.content_hash",
      });
    } else {
      hashes.set(hash, loaded);
    }
  }
}

function validateClaim(loaded: LoadedRow & { row: ClaimRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.identity)) {
    issues.push({
      level: "error",
      code: "claim_identity_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include identity object",
      path: "identity",
    });
  }
  if (!isRecord(row.claim)) {
    issues.push({
      level: "error",
      code: "claim_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include claim object",
      path: "claim",
    });
  } else {
    requireString(row.claim.statement, "claim.statement", "claim_statement_required", loaded, issues);
    if (typeof row.claim.atomic !== "boolean") {
      issues.push({
        level: "error",
        code: "claim_atomic_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "claim.atomic must be boolean",
        path: "claim.atomic",
      });
    }
  }
  if (!isRecord(row.time)) {
    issues.push({
      level: "error",
      code: "claim_time_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include time object",
      path: "time",
    });
  } else {
    requireEnum(row.time.precision, TIME_PRECISIONS, "time.precision", "time_precision_invalid", loaded, issues);
  }
  if (!isRecord(row.provenance)) {
    issues.push({
      level: "error",
      code: "claim_provenance_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include provenance object",
      path: "provenance",
    });
  } else if (!Array.isArray(row.provenance.evidence) || row.provenance.evidence.length === 0) {
    issues.push({
      level: "error",
      code: "claim_provenance_evidence_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim provenance.evidence must have at least one item",
      path: "provenance.evidence",
    });
  }
  if (!isRecord(row.assessment)) {
    issues.push({
      level: "error",
      code: "claim_assessment_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include assessment object",
      path: "assessment",
    });
  } else {
    validateAssessment(row.assessment, loaded, issues, { requireConfidence: true });
  }
}

function validateQuestion(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.question)) {
    issues.push({
      level: "error",
      code: "question_object_required",
      line: loaded.line,
      id: stringValue(row.id),
      message: "question row must include question object",
      path: "question",
    });
    return;
  }
  requireString(row.question.text, "question.text", "question_text_required", loaded, issues);
  requireEnum(row.question.status, QUESTION_STATUSES, "question.status", "question_status_invalid", loaded, issues);
  if (row.question.priority !== undefined) {
    requireEnum(
      row.question.priority,
      QUESTION_PRIORITIES,
      "question.priority",
      "question_priority_invalid",
      loaded,
      issues,
    );
  }
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
}

function validateSynthesis(loaded: LoadedRow & { row: SynthesisRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.synthesis)) {
    issues.push({
      level: "error",
      code: "synthesis_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis row must include synthesis object",
      path: "synthesis",
    });
    return;
  }
  requireString(row.synthesis.title, "synthesis.title", "synthesis_title_required", loaded, issues);
  requireString(row.synthesis.summary, "synthesis.summary", "synthesis_summary_required", loaded, issues);
  requireEnum(
    row.synthesis.status,
    SYNTHESIS_STATUSES,
    "synthesis.status",
    "synthesis_status_invalid",
    loaded,
    issues,
  );
  if (!isRecord(row.synthesis.basis)) {
    issues.push({
      level: "error",
      code: "synthesis_basis_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis.basis must be an object",
      path: "synthesis.basis",
    });
    return;
  }
  const basis = row.synthesis.basis as Record<string, unknown>;
  const hasBasis =
    nonEmptyStringArray(basis.claim_ids) ||
    nonEmptyStringArray(basis.question_ids) ||
    nonEmptyStringArray(basis.source_ids);
  if (!hasBasis && !stringValue(row.synthesis.limitations)) {
    issues.push({
      level: "error",
      code: "synthesis_basis_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis must include a basis id or explicit limitations note",
      path: "synthesis.basis",
    });
  }
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
}

function validateEntry(
  loaded: LoadedRow & { row: EntryRow },
  byId: RowMap,
  issues: ValidationIssue[],
  options: LedgerValidationOptions,
): void {
  const entry = (loaded.row as { entry?: unknown }).entry;
  if (!isRecord(entry)) {
    issues.push({
      level: "error",
      code: "entry_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "entry row must include entry object",
      path: "entry",
    });
    return;
  }

  requireEnum(entry.action, ENTRY_ACTIONS, "entry.action", "entry_action_invalid", loaded, issues);

  if (entry.action === "retract") {
    requireTargetIds(entry.target_ids, loaded, byId, issues, "entry.target_ids", "entry_target_required", "entry_target_unresolved");
    requireString(entry.reason, "entry.reason", "entry_reason_required", loaded, issues);
    return;
  }

  if (entry.action === "supersede") {
    requireTargetIds(entry.target_ids, loaded, byId, issues, "entry.target_ids", "entry_target_required", "entry_target_unresolved");
    requireExistingId(
      entry.replacement_id,
      loaded,
      byId,
      issues,
      "entry.replacement_id",
      "entry_replacement_required",
      "entry_replacement_unresolved",
    );
    requireString(entry.reason, "entry.reason", "entry_reason_required", loaded, issues);
    return;
  }

  if (entry.action === "merge") {
    requireExistingId(
      entry.canonical_id,
      loaded,
      byId,
      issues,
      "entry.canonical_id",
      "entry_canonical_required",
      "entry_canonical_unresolved",
    );
    requireTargetIds(entry.target_ids, loaded, byId, issues, "entry.target_ids", "entry_target_required", "entry_target_unresolved");
    requireString(entry.reason, "entry.reason", "entry_reason_required", loaded, issues);
    return;
  }

  if (entry.action === "link") {
    const link = entry.link;
    if (!isRecord(link)) {
      issues.push({
        level: "error",
        code: "entry_link_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "entry.link must be an object",
        path: "entry.link",
      });
      return;
    }
    requireExistingId(
      link.from_id,
      loaded,
      byId,
      issues,
      "entry.link.from_id",
      "entry_link_endpoint_required",
      "entry_link_endpoint_unresolved",
    );
    requireExistingId(
      link.to_id,
      loaded,
      byId,
      issues,
      "entry.link.to_id",
      "entry_link_endpoint_required",
      "entry_link_endpoint_unresolved",
    );
    requireLinkRel(link.rel, "entry.link.rel", loaded, issues, options);
    return;
  }

  if (entry.action === "patch") {
    requireExistingId(
      entry.target_id,
      loaded,
      byId,
      issues,
      "entry.target_id",
      "entry_target_required",
      "entry_target_unresolved",
    );
    if (!Array.isArray(entry.patch) || entry.patch.length === 0) {
      issues.push({
        level: "error",
        code: "entry_patch_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "entry.patch must have at least one item",
        path: "entry.patch",
      });
    }
    requireString(entry.reason, "entry.reason", "entry_reason_required", loaded, issues);
  }
}

function validateAssessment(
  value: unknown,
  loaded: LoadedRow,
  issues: ValidationIssue[],
  options: { requireConfidence: boolean },
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push({
      level: "error",
      code: "assessment_invalid",
      line: loaded.line,
      id: loaded.row.id,
      message: "assessment must be an object",
      path: "assessment",
    });
    return;
  }

  const assessment = value as Assessment;
  if (options.requireConfidence || assessment.confidence !== undefined) {
    requireEnum(
      assessment.confidence,
      CONFIDENCE_VALUES,
      "assessment.confidence",
      "assessment_confidence_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.source_reliability !== undefined) {
    requireEnum(
      assessment.source_reliability,
      ASSESSMENT_LEVELS,
      "assessment.source_reliability",
      "assessment_source_reliability_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.importance !== undefined) {
    requireEnum(
      assessment.importance,
      ASSESSMENT_LEVELS,
      "assessment.importance",
      "assessment_importance_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.information_depth !== undefined) {
    if (!isRecord(assessment.information_depth)) {
      issues.push({
        level: "error",
        code: "assessment_information_depth_invalid",
        line: loaded.line,
        id: loaded.row.id,
        message: "assessment.information_depth must be an object",
        path: "assessment.information_depth",
      });
      return;
    }
    requireEnum(
      assessment.information_depth.level,
      INFORMATION_DEPTH_VALUES,
      "assessment.information_depth.level",
      "assessment_information_depth_level_invalid",
      loaded,
      issues,
    );
    requireString(
      assessment.information_depth.rationale,
      "assessment.information_depth.rationale",
      "assessment_information_depth_rationale_required",
      loaded,
      issues,
    );
  }
}

function validateSourceRefs(loaded: LoadedRow, sourceIds: Set<string>, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  const provenance = isRecord(row.provenance) ? row.provenance : undefined;
  if (!provenance) return;

  for (const sourceId of stringArray(provenance.source_ids)) {
    if (!sourceIds.has(sourceId)) {
      issues.push({
        level: "error",
        code: "evidence_source_unresolved",
        line: loaded.line,
        id: stringValue(row.id),
        message: `Unresolved provenance source_id: ${sourceId}`,
        path: "provenance.source_ids",
      });
    }
  }

  if (Array.isArray(provenance.evidence)) {
    for (const evidence of provenance.evidence) {
      if (!isRecord(evidence)) {
        issues.push({
          level: "error",
          code: "evidence_invalid",
          line: loaded.line,
          id: stringValue(row.id),
          message: "Evidence item must be an object",
          path: "provenance.evidence",
        });
        continue;
      }
      const sourceId = stringValue(evidence.source_id);
      if (!sourceId) {
        issues.push({
          level: "error",
          code: "evidence_source_required",
          line: loaded.line,
          id: stringValue(row.id),
          message: "Evidence item must include source_id",
          path: "provenance.evidence.source_id",
        });
      } else if (!sourceIds.has(sourceId)) {
        issues.push({
          level: "error",
          code: "evidence_source_unresolved",
          line: loaded.line,
          id: stringValue(row.id),
          message: `Unresolved evidence source_id: ${sourceId}`,
          path: "provenance.evidence.source_id",
        });
      }
      requireEnum(evidence.role, EVIDENCE_ROLES, "evidence.role", "evidence_role_invalid", loaded, issues);
      requireString(evidence.summary, "evidence.summary", "evidence_summary_required", loaded, issues);
    }
  }
}

function validateLinks(
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  options: LedgerValidationOptions,
): void {
  const links = (loaded.row as { links?: unknown }).links;
  if (links === undefined) return;
  if (!Array.isArray(links)) {
    issues.push({
      level: "error",
      code: "links_invalid",
      line: loaded.line,
      id: loaded.row.id,
      message: "links must be an array",
      path: "links",
    });
    return;
  }
  for (const link of links) {
    if (!isRecord(link)) {
      issues.push({
        level: "error",
        code: "link_invalid",
        line: loaded.line,
        id: loaded.row.id,
        message: "link item must be an object",
        path: "links",
      });
      continue;
    }
    const targetId = stringValue(link.target_id);
    if (!targetId) {
      issues.push({
        level: "error",
        code: "link_target_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "link.target_id is required",
        path: "links.target_id",
      });
    } else if (!byId.has(targetId)) {
      issues.push({
        level: "error",
        code: "link_target_unresolved",
        line: loaded.line,
        id: loaded.row.id,
        message: `Unresolved link target_id: ${targetId}`,
        path: "links.target_id",
      });
    }
    requireLinkRel(link.rel, "link.rel", loaded, issues, options);
  }
}

function requireTargetIds(
  value: unknown,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
  requiredCode: string,
  unresolvedCode: string,
): void {
  const targetIds = stringArray(value);
  if (targetIds.length === 0) {
    issues.push({
      level: "error",
      code: requiredCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} must have at least one id`,
      path: field,
    });
    return;
  }
  for (const targetId of targetIds) {
    requireExistingId(targetId, loaded, byId, issues, field, requiredCode, unresolvedCode);
  }
}

function requireExistingId(
  value: unknown,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
  requiredCode: string,
  unresolvedCode: string,
): void {
  const id = stringValue(value);
  if (!id) {
    issues.push({
      level: "error",
      code: requiredCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} is required`,
      path: field,
    });
    return;
  }
  if (!byId.has(id)) {
    issues.push({
      level: "error",
      code: unresolvedCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `Unresolved ${field}: ${id}`,
      path: field,
    });
  }
}

function validateSynthesisBasis(rows: LoadedRow[], byId: RowMap, issues: ValidationIssue[]): void {
  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "synthesis") continue;
    const synthesis = (loaded.row as SynthesisRow).synthesis;
    if (!isRecord(synthesis?.basis)) continue;
    for (const id of synthesis.basis.claim_ids ?? []) {
      requireTargetKind(id, "claim", loaded, byId, issues, "synthesis.basis.claim_ids");
    }
    for (const id of synthesis.basis.question_ids ?? []) {
      requireTargetKind(id, "question", loaded, byId, issues, "synthesis.basis.question_ids");
    }
    for (const id of synthesis.basis.source_ids ?? []) {
      requireTargetKind(id, "source", loaded, byId, issues, "synthesis.basis.source_ids");
    }
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
    issues.push({
      level: "error",
      code: "synthesis_basis_unresolved",
      line: loaded.line,
      id: loaded.row.id,
      message: `Unresolved ${field}: ${id}`,
      path: field,
    });
    return;
  }
  if (target.kind !== kind) {
    issues.push({
      level: "error",
      code: "synthesis_basis_kind_mismatch",
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} must reference a ${kind} row: ${id}`,
      path: field,
    });
  }
}

function validateOperation(operation: unknown, basePath: string, issues: ValidationIssue[]): void {
  if (!isRecord(operation)) {
    issues.push({
      level: "error",
      code: "operation_invalid",
      message: "operation must be an object",
      path: basePath,
    });
    return;
  }
  const op = (operation as { op?: unknown }).op;
  if (typeof op !== "string" || !APPLY_OPERATION_KINDS.includes(op as ApplyOperationKind)) {
    issues.push({
      level: "error",
      code: "operation_kind_invalid",
      message: `op must be one of: ${APPLY_OPERATION_KINDS.join(", ")}`,
      path: `${basePath}.op`,
    });
    return;
  }
  if (op === "add") {
    if (!isRecord((operation as { row?: unknown }).row)) {
      issues.push({
        level: "error",
        code: "operation_row_required",
        message: "add operation requires a row object",
        path: `${basePath}.row`,
      });
    }
    return;
  }
  const reason = (operation as { reason?: unknown }).reason;
  if (op === "retract" || op === "supersede" || op === "merge" || op === "patch") {
    if (typeof reason !== "string" || reason.length === 0) {
      issues.push({
        level: "error",
        code: "operation_reason_required",
        message: `${op} operation requires a reason`,
        path: `${basePath}.reason`,
      });
    }
  }
  if (op === "retract" || op === "supersede" || op === "merge") {
    const targets = (operation as { target_ids?: unknown }).target_ids;
    if (!Array.isArray(targets) || targets.length === 0) {
      issues.push({
        level: "error",
        code: "operation_target_required",
        message: `${op} operation requires target_ids`,
        path: `${basePath}.target_ids`,
      });
    }
  }
  if (op === "supersede") {
    if (typeof (operation as { replacement_id?: unknown }).replacement_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_replacement_required",
        message: "supersede operation requires replacement_id",
        path: `${basePath}.replacement_id`,
      });
    }
  }
  if (op === "merge") {
    if (typeof (operation as { canonical_id?: unknown }).canonical_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_canonical_required",
        message: "merge operation requires canonical_id",
        path: `${basePath}.canonical_id`,
      });
    }
  }
  if (op === "link") {
    if (typeof (operation as { from_id?: unknown }).from_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_from_required",
        message: "link operation requires from_id",
        path: `${basePath}.from_id`,
      });
    }
    if (typeof (operation as { to_id?: unknown }).to_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_to_required",
        message: "link operation requires to_id",
        path: `${basePath}.to_id`,
      });
    }
    const rel = (operation as { rel?: unknown }).rel;
    if (typeof rel !== "string" || rel.length === 0) {
      issues.push({
        level: "error",
        code: "link_kind_invalid",
        message: "rel must be a non-empty string",
        path: `${basePath}.rel`,
      });
    }
  }
  if (op === "patch") {
    if (typeof (operation as { target_id?: unknown }).target_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_target_required",
        message: "patch operation requires target_id",
        path: `${basePath}.target_id`,
      });
    }
    const patch = (operation as { patch?: unknown }).patch;
    if (!Array.isArray(patch) || patch.length === 0) {
      issues.push({
        level: "error",
        code: "operation_patch_required",
        message: "patch operation requires a non-empty patch array",
        path: `${basePath}.patch`,
      });
    }
  }
}

function requireString(
  value: unknown,
  field: string,
  code: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
): void {
  if (!stringValue(value)) {
    issues.push({
      level: "error",
      code,
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} is required`,
      path: field,
    });
  }
}

function requireEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
  code: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({
      level: "error",
      code,
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} must be one of: ${allowed.join(", ")}`,
      path: field,
    });
  }
}

function requireLinkRel(
  value: unknown,
  field: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
  options: LedgerValidationOptions,
): void {
  const allowed = allowedLinkRelsForRow(loaded.row, options);
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({
      level: "error",
      code: "link_kind_invalid",
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} must be one of: ${allowed.join(", ")}`,
      path: field,
    });
  }
}

function allowedLinkRelsForRow(row: KnbRow, options: LedgerValidationOptions): string[] {
  const allowed: string[] = [...LINK_TYPES];
  const seen = new Set<string>(allowed);
  const profiles = stringArray((row as { scope?: { profiles?: unknown } }).scope?.profiles);
  for (const profileId of profiles) {
    for (const rel of options.profileLinkRels?.[profileId] ?? []) {
      if (seen.has(rel)) continue;
      allowed.push(rel);
      seen.add(rel);
    }
  }
  return allowed;
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
  return Boolean(scope.profiles?.length || scope.subjects?.length || scope.tags?.length);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatYmd(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}
