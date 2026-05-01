export const KNB_SCHEMA_VERSION = "knb.v1" as const;

export const ROW_KINDS = ["source", "claim", "question", "synthesis", "change"] as const;
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
export const RELATION_TYPES = [
  "supports",
  "contradicts",
  "depends_on",
  "context_for",
] as const;
export const CHANGE_ACTIONS = ["retract", "supersede", "merge", "relate", "patch"] as const;

export type KnbRowKind = (typeof ROW_KINDS)[number];
export type RelationType = (typeof RELATION_TYPES)[number];
export type ChangeAction = (typeof CHANGE_ACTIONS)[number];
export type AssessmentLevel = (typeof ASSESSMENT_LEVELS)[number];

export type Scope = {
  collections?: string[];
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
  dedupe_hash?: string;
  novelty?: "new" | "duplicate" | "corroboration" | "update" | "contradiction" | "correction";
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

export type Relation = {
  target_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type ChangeRelation = {
  from_id: string;
  to_id: string;
  rel: RelationType;
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
  relations?: Relation[];
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
  relations?: Relation[];
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
  assessment?: Assessment;
  relations?: Relation[];
};

export type ChangeRow = KnbRowCommon & {
  kind: "change";
  change: {
    action: ChangeAction;
    target_ids?: string[];
    target_id?: string;
    replacement_id?: string;
    canonical_id?: string;
    reason?: string;
    relation?: ChangeRelation;
    patch?: Array<Record<string, unknown>>;
  };
};

export type KnbRow = SourceRow | ClaimRow | QuestionRow | SynthesisRow | ChangeRow;
