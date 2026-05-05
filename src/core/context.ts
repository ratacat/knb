import type {
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "./contract";
import type { EffectiveRow, EffectiveState, StateWarning } from "./state";

export type ContextRequest = {
  collection?: string;
  subject?: string;
  tag?: string;
  asOf?: string;
  maxTokens?: number;
  includeWarnings?: boolean;
  recencyWindowDays?: number;
  scoringProfile?: ContextScoringProfileInput;
  tokenEstimator?: (text: string) => number;
};

export type ContextSource = {
  id: string;
  title: string;
  publisher?: string;
  uri?: string;
};

export type ContextClaim = {
  id: string;
  statement: string;
  confidence?: string;
  importance?: string;
  contested?: boolean;
  source_ids: string[];
  time?: string;
};

export type ContextSynthesis = {
  id: string;
  title: string;
  summary: string;
  limitations?: string;
  basis: { claim_ids?: string[]; question_ids?: string[]; source_ids?: string[] };
};

export type ContextQuestion = {
  id: string;
  text: string;
  priority?: string;
  why_it_matters?: string;
};

export type ContextWarning = {
  code: string;
  message: string;
};

export type ContextResult = {
  summary: string;
  syntheses: ContextSynthesis[];
  key_claims: ContextClaim[];
  open_questions: ContextQuestion[];
  sources: ContextSource[];
  warnings: ContextWarning[];
  token_estimate: number;
  truncated: boolean;
  meta: {
    collection?: string;
    subject?: string;
    tag?: string;
    counts: {
      syntheses: number;
      claims: number;
      questions: number;
      sources: number;
    };
  };
};

const DEFAULT_MAX_TOKENS = 3000;
const THIN_EVIDENCE_THRESHOLD = 2;

const IMPORTANCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
const INFO_DEPTH_RANK: Record<string, number> = {
  complete: 4,
  strong: 3,
  partial: 2,
  thin: 1,
  unknown: 0,
};
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export type ContextScoringWeights = {
  importance: Readonly<Record<string, number>>;
  confidence: Readonly<Record<string, number>>;
  informationDepth: Readonly<Record<string, number>>;
  priority: Readonly<Record<string, number>>;
};

export type ContextScoringWeightsInput = {
  importance?: Readonly<Record<string, number>>;
  confidence?: Readonly<Record<string, number>>;
  informationDepth?: Readonly<Record<string, number>>;
  priority?: Readonly<Record<string, number>>;
};

export type ContextScoringProfile = {
  weights: ContextScoringWeights;
  thinEvidenceThreshold: number;
  recency?: ContextRecencyProfile;
};

export type ContextRecencyProfile = {
  windowDays: number;
  weight: number;
};

export type ContextScoringProfileInput = {
  weights?: ContextScoringWeightsInput;
  thinEvidenceThreshold?: number;
  recency?: Partial<ContextRecencyProfile>;
};

export type ContextSynthesisScore = {
  importance: number;
  recency: number;
  createdAt: string;
  basisDepth: number;
  id: string;
};

export type ContextClaimScore = {
  importance: number;
  confidence: number;
  recency: number;
  informationDepth: number;
  evidenceCount: number;
  contested: number;
  createdAt: string;
  id: string;
};

export type ContextQuestionScore = {
  priority: number;
  importance: number;
  recency: number;
  createdAt: string;
  id: string;
};

export const DEFAULT_CONTEXT_SCORING_PROFILE: ContextScoringProfile = {
  weights: {
    importance: IMPORTANCE_RANK,
    confidence: CONFIDENCE_RANK,
    informationDepth: INFO_DEPTH_RANK,
    priority: PRIORITY_RANK,
  },
  thinEvidenceThreshold: THIN_EVIDENCE_THRESHOLD,
};

function resolveContextScoringProfile(
  input: ContextScoringProfileInput | undefined,
  recencyWindowDays: number | undefined,
): ContextScoringProfile {
  if (input === undefined && recencyWindowDays === undefined) return DEFAULT_CONTEXT_SCORING_PROFILE;
  const profile: ContextScoringProfile = {
    weights: {
      importance: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.importance, ...input?.weights?.importance },
      confidence: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.confidence, ...input?.weights?.confidence },
      informationDepth: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.informationDepth, ...input?.weights?.informationDepth },
      priority: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.priority, ...input?.weights?.priority },
    },
    thinEvidenceThreshold:
      typeof input?.thinEvidenceThreshold === "number" && Number.isFinite(input.thinEvidenceThreshold)
        ? Math.max(0, input.thinEvidenceThreshold)
        : DEFAULT_CONTEXT_SCORING_PROFILE.thinEvidenceThreshold,
  };
  const profileRecencyWindow = finitePositiveNumber(input?.recency?.windowDays);
  const requestRecencyWindow = finitePositiveNumber(recencyWindowDays);
  const windowDays = requestRecencyWindow ?? profileRecencyWindow;
  if (windowDays !== undefined) {
    profile.recency = {
      windowDays,
      weight: finitePositiveNumber(input?.recency?.weight) ?? 1,
    };
  }
  return profile;
}

function finitePositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function recencyScore(row: KnbRow, profile: ContextScoringProfile, anchor: string | undefined): number {
  const recency = profile.recency;
  if (recency === undefined || anchor === undefined) return 0;
  const anchorMs = Date.parse(anchor);
  const createdMs = Date.parse(row.created_at);
  if (!Number.isFinite(anchorMs) || !Number.isFinite(createdMs) || createdMs > anchorMs) return 0;
  const ageDays = (anchorMs - createdMs) / 86_400_000;
  return Math.max(0, 1 - ageDays / recency.windowDays) * recency.weight;
}

function defaultEstimator(text: string): number {
  return Math.ceil(text.length / 4);
}

function importanceOf(row: KnbRow): string {
  const assessment = (row as { assessment?: { importance?: string } }).assessment;
  return assessment?.importance ?? "unknown";
}

function confidenceOf(row: ClaimRow): string {
  return row.assessment?.confidence ?? "unknown";
}

function informationDepthOf(row: ClaimRow): string {
  return row.assessment?.information_depth?.level ?? "unknown";
}

function evidenceCountOf(row: ClaimRow): number {
  return row.provenance?.evidence?.length ?? 0;
}

function contestedOf(row: ClaimRow): boolean {
  return row.assessment?.contested === true;
}

function priorityOf(row: QuestionRow): string {
  return row.question.priority ?? "low";
}

function basisDepthOf(row: SynthesisRow): number {
  const basis = row.synthesis.basis;
  const claims = basis.claim_ids?.length ?? 0;
  const questions = basis.question_ids?.length ?? 0;
  const sources = basis.source_ids?.length ?? 0;
  return claims + questions + sources;
}

export function scoreContextSynthesis(
  row: SynthesisRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextSynthesisScore {
  return {
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    createdAt: row.created_at,
    basisDepth: basisDepthOf(row),
    id: row.id,
  };
}

export function scoreContextClaim(
  row: ClaimRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextClaimScore {
  return {
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    confidence: profile.weights.confidence[confidenceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    informationDepth: profile.weights.informationDepth[informationDepthOf(row)] ?? 0,
    evidenceCount: evidenceCountOf(row),
    contested: contestedOf(row) ? 1 : 0,
    createdAt: row.created_at,
    id: row.id,
  };
}

export function scoreContextQuestion(
  row: QuestionRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextQuestionScore {
  return {
    priority: profile.weights.priority[priorityOf(row)] ?? 0,
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    createdAt: row.created_at,
    id: row.id,
  };
}

function timeOf(row: ClaimRow): string | undefined {
  const t = row.time;
  return t.valid_at ?? t.occurred_at ?? t.valid_from ?? t.reported_at ?? undefined;
}

function rankSyntheses(rows: SynthesisRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): SynthesisRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextSynthesis(a, profile, recencyAnchor);
    const scoreB = scoreContextSynthesis(b, profile, recencyAnchor);
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    if (scoreA.basisDepth !== scoreB.basisDepth) return scoreB.basisDepth - scoreA.basisDepth;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function rankClaims(rows: ClaimRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): ClaimRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextClaim(a, profile, recencyAnchor);
    const scoreB = scoreContextClaim(b, profile, recencyAnchor);
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.confidence !== scoreB.confidence) return scoreB.confidence - scoreA.confidence;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (scoreA.informationDepth !== scoreB.informationDepth) return scoreB.informationDepth - scoreA.informationDepth;
    if (scoreA.evidenceCount !== scoreB.evidenceCount) return scoreB.evidenceCount - scoreA.evidenceCount;
    if (scoreA.contested !== scoreB.contested) return scoreB.contested - scoreA.contested;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function rankQuestions(rows: QuestionRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): QuestionRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextQuestion(a, profile, recencyAnchor);
    const scoreB = scoreContextQuestion(b, profile, recencyAnchor);
    if (scoreA.priority !== scoreB.priority) return scoreB.priority - scoreA.priority;
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function matchesScope(row: KnbRow, request: ContextRequest): boolean {
  if (request.collection && !row.scope.collections?.includes(request.collection)) return false;
  if (request.subject && !row.scope.subjects?.includes(request.subject)) return false;
  if (request.tag && !row.scope.tags?.includes(request.tag)) return false;
  return true;
}

function newestCreatedAt(rows: EffectiveRow[]): string | undefined {
  let newest: string | undefined;
  for (const effective of rows) {
    const createdAt = effective.row.created_at;
    if (newest === undefined || createdAt > newest) newest = createdAt;
  }
  return newest;
}

function canonicalSourceIds(ids: Iterable<string | undefined>, state: EffectiveState): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    out.add(state.canonicalIdOf(id));
  }
  return [...out];
}

function toContextSynthesis(row: SynthesisRow, state: EffectiveState): ContextSynthesis {
  const basis: ContextSynthesis["basis"] = { ...row.synthesis.basis };
  if (row.synthesis.basis.source_ids !== undefined) {
    basis.source_ids = canonicalSourceIds(row.synthesis.basis.source_ids, state);
  }
  const out: ContextSynthesis = {
    id: row.id,
    title: row.synthesis.title,
    summary: row.synthesis.summary,
    basis,
  };
  if (row.synthesis.limitations) out.limitations = row.synthesis.limitations;
  return out;
}

function toContextClaim(row: ClaimRow, state: EffectiveState): ContextClaim {
  const sourceIds = canonicalSourceIds(
    [
      ...(row.provenance.source_ids ?? []),
      ...(row.provenance.evidence ?? []).map((evidence) => evidence.source_id),
    ],
    state,
  );
  const out: ContextClaim = {
    id: row.id,
    statement: row.claim.statement,
    source_ids: sourceIds,
  };
  const conf = row.assessment?.confidence;
  if (conf) out.confidence = conf;
  const imp = row.assessment?.importance;
  if (imp) out.importance = imp;
  if (row.assessment?.contested === true) out.contested = true;
  const t = timeOf(row);
  if (t) out.time = t;
  return out;
}

function toContextQuestion(row: QuestionRow): ContextQuestion {
  const out: ContextQuestion = { id: row.id, text: row.question.text };
  if (row.question.priority) out.priority = row.question.priority;
  if (row.question.why_it_matters) out.why_it_matters = row.question.why_it_matters;
  return out;
}

function toContextSource(row: SourceRow): ContextSource {
  const out: ContextSource = { id: row.id, title: row.source.title };
  if (row.source.publisher) out.publisher = row.source.publisher;
  if (row.source.uri) out.uri = row.source.uri;
  return out;
}

function toMinimalSource(source: ContextSource): ContextSource {
  return { id: source.id, title: source.title };
}

function renderSynthesis(s: ContextSynthesis): string {
  return [s.title, s.summary, s.limitations ?? ""].join(" ");
}

function renderClaim(c: ContextClaim): string {
  return [c.statement, c.confidence ?? "", c.time ?? ""].join(" ");
}

function renderQuestion(q: ContextQuestion): string {
  return [q.text, q.why_it_matters ?? ""].join(" ");
}

function renderSource(s: ContextSource): string {
  return [s.title, s.publisher ?? ""].join(" ");
}

function estimatePacket(
  summary: string,
  syntheses: ContextSynthesis[],
  claims: ContextClaim[],
  questions: ContextQuestion[],
  sources: ContextSource[],
  warnings: ContextWarning[],
  estimator: (text: string) => number,
): number {
  let total = estimator(summary);
  for (const s of syntheses) total += estimator(renderSynthesis(s));
  for (const c of claims) total += estimator(renderClaim(c));
  for (const q of questions) total += estimator(renderQuestion(q));
  for (const s of sources) total += estimator(renderSource(s));
  for (const w of warnings) total += estimator(`${w.code} ${w.message}`);
  return total;
}

function buildSummary(
  scopeLabel: string,
  syntheses: ContextSynthesis[],
  claims: ContextClaim[],
  questions: ContextQuestion[],
  warningsCount: number,
  includeWarnings: boolean,
  empty: boolean,
): string {
  if (empty) return "Empty workspace.";
  const parts = [
    `${scopeLabel}: ${syntheses.length} syntheses, ${claims.length} claims, ${questions.length} open questions.`,
  ];
  if (includeWarnings && warningsCount > 0) {
    parts.push(`${warningsCount} warning${warningsCount === 1 ? "" : "s"}.`);
  }
  return parts.join(" ");
}

function selectedSourceIds(
  claims: ContextClaim[],
  syntheses: ContextSynthesis[],
): Set<string> {
  const ids = new Set<string>();
  for (const c of claims) for (const id of c.source_ids) ids.add(id);
  for (const s of syntheses) for (const id of s.basis.source_ids ?? []) ids.add(id);
  return ids;
}

function backingImportanceForSource(
  sourceId: string,
  claims: ContextClaim[],
  syntheses: ContextSynthesis[],
  rankedSynthesisOrder: Map<string, number>,
  profile: ContextScoringProfile,
): { importance: number; synthRank: number } {
  let importance = -1;
  let synthRank = Number.POSITIVE_INFINITY;
  for (const c of claims) {
    if (c.source_ids.includes(sourceId)) {
      const r = profile.weights.importance[c.importance ?? "unknown"] ?? 0;
      if (r > importance) importance = r;
    }
  }
  for (const s of syntheses) {
    if (s.basis.source_ids?.includes(sourceId)) {
      const rank = rankedSynthesisOrder.get(s.id) ?? Number.POSITIVE_INFINITY;
      if (rank < synthRank) synthRank = rank;
      if (importance < 0) importance = 0;
    }
  }
  return { importance, synthRank };
}

function buildWarnings(
  state: EffectiveState,
  selectedClaims: ContextClaim[],
  selectedClaimRows: ClaimRow[],
  scopedActiveCounts: { syntheses: number; claims: number },
  includeWarnings: boolean,
  profile: ContextScoringProfile,
): ContextWarning[] {
  if (!includeWarnings) return [];
  const warnings: ContextWarning[] = [];
  for (const w of state.warnings) warnings.push(stateWarningToContext(w));
  if (scopedActiveCounts.syntheses === 0) {
    warnings.push({
      code: "info_gap_no_active_synthesis",
      message: "No active syntheses in scope. Consider drafting one to orient further work.",
    });
  }
  if (scopedActiveCounts.claims === 0) {
    warnings.push({
      code: "info_gap_no_active_claims",
      message: "No active claims in scope.",
    });
  }
  const thinEvidenceThreshold = profile.thinEvidenceThreshold;
  const thin = selectedClaimRows.filter((c) => evidenceCountOf(c) < thinEvidenceThreshold).length;
  if (thin > 0) {
    warnings.push({
      code: "info_gap_thin_evidence",
      message: `${thin} selected claim${thin === 1 ? " has" : "s have"} fewer than ${thinEvidenceThreshold} evidence entries.`,
    });
  }
  const contested = selectedClaims.filter((c) => c.contested === true).length;
  if (contested > 0) {
    warnings.push({
      code: "contested_claims_present",
      message: `${contested} selected claim${contested === 1 ? " is" : "s are"} contested.`,
    });
  }
  return warnings;
}

function stateWarningToContext(w: StateWarning): ContextWarning {
  return { code: `state_${w.code}`, message: w.message };
}

export function buildContext(state: EffectiveState, request: ContextRequest = {}): ContextResult {
  const estimator = request.tokenEstimator ?? defaultEstimator;
  const scoringProfile = resolveContextScoringProfile(request.scoringProfile, request.recencyWindowDays);
  const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
  const includeWarnings = request.includeWarnings !== false;

  const allActive: EffectiveRow[] = state.rows();
  const inScope = allActive.filter((r) => matchesScope(r.row, request));
  const recencyAnchor = scoringProfile.recency === undefined
    ? undefined
    : request.asOf ?? newestCreatedAt(inScope);
  const synthesisRows: SynthesisRow[] = [];
  const claimRows: ClaimRow[] = [];
  const questionRows: QuestionRow[] = [];
  const sourceRows = new Map<string, SourceRow>();
  for (const r of inScope) {
    if (r.row.kind === "synthesis") {
      const s = r.row as SynthesisRow;
      if (s.synthesis.status === "active") synthesisRows.push(s);
    } else if (r.row.kind === "claim") {
      claimRows.push(r.row as ClaimRow);
    } else if (r.row.kind === "question") {
      const q = r.row as QuestionRow;
      if (q.question.status === "open") questionRows.push(q);
    } else if (r.row.kind === "source") {
      sourceRows.set(r.row.id, r.row as SourceRow);
    }
  }

  const rankedSyntheses = rankSyntheses(synthesisRows, scoringProfile, recencyAnchor);
  const rankedClaims = rankClaims(claimRows, scoringProfile, recencyAnchor);
  const rankedQuestions = rankQuestions(questionRows, scoringProfile, recencyAnchor);
  const scopedActiveCounts = { syntheses: synthesisRows.length, claims: claimRows.length };

  let syntheses = rankedSyntheses.map((row) => toContextSynthesis(row, state));
  let claims = rankedClaims.map((row) => toContextClaim(row, state));
  let questions = rankedQuestions.map(toContextQuestion);
  let claimRowsBySelection = [...rankedClaims];

  const sourceIdsCited = selectedSourceIds(claims, syntheses);
  const candidateSources: ContextSource[] = [];
  for (const r of inScope) {
    if (r.row.kind !== "source") continue;
    if (sourceIdsCited.has(r.row.id)) {
      const sourceRow = sourceRows.get(r.row.id);
      if (sourceRow) candidateSources.push(toContextSource(sourceRow));
    }
  }
  let sources = candidateSources;

  const empty =
    syntheses.length === 0 &&
    claims.length === 0 &&
    questions.length === 0 &&
    sources.length === 0;

  const scopeLabel = request.collection
    ? `Collection ${request.collection}`
    : request.subject
      ? `Subject ${request.subject}`
      : request.tag
        ? `Tag ${request.tag}`
        : "Workspace";

  let warnings = buildWarnings(state, claims, claimRowsBySelection, scopedActiveCounts, includeWarnings, scoringProfile);
  let summary = buildSummary(
    scopeLabel,
    syntheses,
    claims,
    questions,
    warnings.length,
    includeWarnings,
    empty,
  );

  let estimate = estimatePacket(summary, syntheses, claims, questions, sources, warnings, estimator);
  let truncated = false;

  const recompute = () => {
    warnings = buildWarnings(state, claims, claimRowsBySelection, scopedActiveCounts, includeWarnings, scoringProfile);
    summary = buildSummary(
      scopeLabel,
      syntheses,
      claims,
      questions,
      warnings.length,
      includeWarnings,
      syntheses.length === 0 &&
        claims.length === 0 &&
        questions.length === 0 &&
        sources.length === 0,
    );
    estimate = estimatePacket(summary, syntheses, claims, questions, sources, warnings, estimator);
  };

  if (estimate > maxTokens) {
    const synthRankIndex = new Map<string, number>();
    rankedSyntheses.forEach((s, i) => synthRankIndex.set(s.id, i));

    const sortedSourcesForDrop = [...sources].sort((a, b) => {
      const ba = backingImportanceForSource(a.id, claims, syntheses, synthRankIndex, scoringProfile);
      const bb = backingImportanceForSource(b.id, claims, syntheses, synthRankIndex, scoringProfile);
      if (ba.importance !== bb.importance) return ba.importance - bb.importance;
      if (ba.synthRank !== bb.synthRank) return bb.synthRank - ba.synthRank;
      return a.id < b.id ? -1 : 1;
    });

    for (const s of sortedSourcesForDrop) {
      if (estimate <= maxTokens) break;
      if (s.publisher === undefined && s.uri === undefined) continue;
      const idx = sources.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        sources[idx] = toMinimalSource(sources[idx]!);
        truncated = true;
        recompute();
      }
    }

    while (estimate > maxTokens && claims.length > 0) {
      const lowFirst = [...claims].sort((a, b) => {
        const ai = scoringProfile.weights.importance[a.importance ?? "unknown"] ?? 0;
        const bi = scoringProfile.weights.importance[b.importance ?? "unknown"] ?? 0;
        return ai - bi;
      });
      const lowest = lowFirst[0];
      if (!lowest) break;
      const lowestRank = scoringProfile.weights.importance[lowest.importance ?? "unknown"] ?? 0;
      if (lowestRank > (scoringProfile.weights.importance.medium ?? 0)) break;
      claims = claims.filter((c) => c.id !== lowest.id);
      claimRowsBySelection = claimRowsBySelection.filter((c) => c.id !== lowest.id);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }

    while (estimate > maxTokens && questions.length > 0) {
      const lowFirst = [...questions].sort((a, b) => {
        const ai = scoringProfile.weights.priority[a.priority ?? "low"] ?? 0;
        const bi = scoringProfile.weights.priority[b.priority ?? "low"] ?? 0;
        return ai - bi;
      });
      const lowest = lowFirst[0];
      if (!lowest) break;
      const lowestRank = scoringProfile.weights.priority[lowest.priority ?? "low"] ?? 0;
      if (lowestRank > (scoringProfile.weights.priority.low ?? 0)) break;
      questions = questions.filter((q) => q.id !== lowest.id);
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && syntheses.length > 1) {
      syntheses = syntheses.slice(0, -1);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }

    while (estimate > maxTokens && claims.length > 0) {
      const lastId = claims[claims.length - 1]!.id;
      claims = claims.slice(0, -1);
      claimRowsBySelection = claimRowsBySelection.filter((c) => c.id !== lastId);
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && questions.length > 0) {
      questions = questions.slice(0, -1);
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && syntheses.length > 0) {
      syntheses = syntheses.slice(0, -1);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }
  }

  const result: ContextResult = {
    summary,
    syntheses,
    key_claims: claims,
    open_questions: questions,
    sources,
    warnings,
    token_estimate: estimate,
    truncated,
    meta: {
      counts: {
        syntheses: syntheses.length,
        claims: claims.length,
        questions: questions.length,
        sources: sources.length,
      },
    },
  };
  if (request.collection) result.meta.collection = request.collection;
  if (request.subject) result.meta.subject = request.subject;
  if (request.tag) result.meta.tag = request.tag;
  return result;
}
