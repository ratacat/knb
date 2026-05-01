export const KB_SCHEMA_VERSION = "kb.v1" as const;

export const ROW_KINDS = ["source", "claim", "question", "synthesis"] as const;
export const QUESTION_STATUSES = ["open", "resolved", "archived"] as const;
export const QUESTION_PRIORITIES = ["low", "medium", "high"] as const;
export const SYNTHESIS_STATUSES = ["active", "superseded", "archived"] as const;
export const CONFIDENCE_VALUES = ["unknown", "low", "medium", "high"] as const;
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
  "updates",
  "supersedes",
  "retracts",
  "duplicates",
  "depends_on",
  "context_for",
] as const;

export type KBRowKind = (typeof ROW_KINDS)[number];
export type RelationType = (typeof RELATION_TYPES)[number];

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
  confidence_score?: number;
  source_reliability?: number;
  information_depth?: {
    score: number;
    label?: string;
    rationale: string;
  };
  importance?: number;
  contested?: boolean;
  uncertainty?: string;
};

export type Relation = {
  target_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type KBRowCommon = {
  schema_version: typeof KB_SCHEMA_VERSION;
  id: string;
  kind: KBRowKind;
  created_at: string;
  created_by: string;
  scope: Scope;
  external_refs?: ExternalRef[];
};

export type SourceRow = KBRowCommon & {
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

export type ClaimRow = KBRowCommon & {
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

export type QuestionRow = KBRowCommon & {
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

export type SynthesisRow = KBRowCommon & {
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
    status: "active" | "superseded" | "archived";
  };
  assessment?: Assessment;
  relations?: Relation[];
};

export type KBRow = SourceRow | ClaimRow | QuestionRow | SynthesisRow;
