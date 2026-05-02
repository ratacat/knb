import type { Dirent } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

import type {
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
  Assessment,
} from "./contract";
import { knbError } from "./errors";
import type { LedgerFingerprint } from "./ledger";
import { buildSourceCitationIndex } from "./source-citations";
import type { EffectiveRow, EffectiveState } from "./state";
import type { KnbWorkspace } from "./workspace";

export type RenderFormat = "md";

export type RenderRequest = {
  collection: string;
  format?: RenderFormat;
  out?: string;
};

export type RenderAllRequest = {
  format?: RenderFormat;
};

export type ProjectionKind = "view" | "index";

export type ProjectionClock = () => Date;

export type ProjectionWriteOptions = {
  clock?: ProjectionClock;
};

export type ProjectionMetadata = {
  schema_version: "knb.projection.v1";
  kind: ProjectionKind;
  target: string;
  ledger: {
    path: string;
    rows: number;
    last_row_id?: string;
    content_hash: string;
  };
  options: Record<string, unknown>;
  generated_at: string;
};

export type RenderResult = {
  collection: string;
  format: RenderFormat;
  path: string;
  bytes_written: number;
  metadata_path: string;
  metadata: ProjectionMetadata;
};

export type RenderAllResult = {
  collections: string[];
  rendered: RenderResult[];
  total_bytes_written: number;
};

export type IndexResult = {
  indexes: Array<{
    name: string;
    path: string;
    bytes_written: number;
    metadata_path: string;
    metadata: ProjectionMetadata;
  }>;
};

export type FreshnessRequest = {
  workspace: KnbWorkspace;
  ledger_fingerprint: LedgerFingerprint;
};

export type FreshnessEntry = {
  kind: ProjectionKind;
  target: string;
  state: "fresh" | "stale" | "missing" | "unknown";
  metadata_path?: string;
  ledger_hash?: string;
  generated_at?: string;
};

export type FreshnessReport = {
  entries: FreshnessEntry[];
};

export type ProjectionArtifactStore = {
  renderCollection(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderRequest,
  ): Promise<RenderResult>;
  renderAllCollections(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request?: RenderAllRequest,
  ): Promise<RenderAllResult>;
  rebuildIndexes(state: EffectiveState, ledger_fingerprint: LedgerFingerprint): Promise<IndexResult>;
  checkFreshness(ledger_fingerprint: LedgerFingerprint): Promise<FreshnessReport>;
};

export const V1_INDEX_NAMES = [
  "active-by-id",
  "active-by-collection",
  "active-claims-by-key",
  "active-sources-by-uri",
  "active-sources-by-content-hash",
  "active-claims-by-source-uri",
] as const;

export type V1IndexName = (typeof V1_INDEX_NAMES)[number];

export class JsonProjectionArtifactStore implements ProjectionArtifactStore {
  constructor(
    private readonly workspace: KnbWorkspace,
    private readonly clock: ProjectionClock = () => new Date(),
  ) {}

  renderCollection(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderRequest,
  ): Promise<RenderResult> {
    return renderCollection(state, this.workspace, ledger_fingerprint, request, { clock: this.clock });
  }

  renderAllCollections(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderAllRequest = {},
  ): Promise<RenderAllResult> {
    return renderAllCollections(state, this.workspace, ledger_fingerprint, request, { clock: this.clock });
  }

  rebuildIndexes(state: EffectiveState, ledger_fingerprint: LedgerFingerprint): Promise<IndexResult> {
    return rebuildIndexes(state, this.workspace, ledger_fingerprint, { clock: this.clock });
  }

  checkFreshness(ledger_fingerprint: LedgerFingerprint): Promise<FreshnessReport> {
    return checkFreshness({ workspace: this.workspace, ledger_fingerprint });
  }
}

export async function renderCollection(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  request: RenderRequest,
  options: ProjectionWriteOptions = {},
): Promise<RenderResult> {
  const collection = typeof request.collection === "string" ? request.collection.trim() : "";
  if (collection.length === 0) {
    throw knbError("validation_failed", "Render request requires a non-empty collection", {
      collection: request.collection,
    });
  }
  const format: RenderFormat = request.format ?? "md";
  if (format !== "md") {
    throw knbError("validation_failed", `Unsupported render format: ${format}`, { format });
  }

  const outPath = resolveViewPath(workspace, collection, request.out);

  const body = buildMarkdown(state, collection, ledger_fingerprint);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, body, "utf8");
  const bytesWritten = Buffer.byteLength(body, "utf8");

  const metadata: ProjectionMetadata = {
    schema_version: "knb.projection.v1",
    kind: "view",
    target: workspaceRelative(workspace, outPath),
    ledger: ledgerMeta(ledger_fingerprint),
    options: { collection, format },
    generated_at: projectionTimestamp(options),
  };
  const metadataPath = `${outPath}.meta.json`;
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return {
    collection,
    format,
    path: outPath,
    bytes_written: bytesWritten,
    metadata_path: metadataPath,
    metadata,
  };
}

export async function renderAllCollections(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  request: RenderAllRequest = {},
  options: ProjectionWriteOptions = {},
): Promise<RenderAllResult> {
  const format: RenderFormat = request.format ?? "md";
  if (format !== "md") {
    throw knbError("validation_failed", `Unsupported render format: ${format}`, { format });
  }

  const collections = activeCollectionNames(state);
  const rendered: RenderResult[] = [];
  for (const collection of collections) {
    rendered.push(await renderCollection(state, workspace, ledger_fingerprint, { collection, format }, options));
  }

  return {
    collections,
    rendered,
    total_bytes_written: rendered.reduce((sum, entry) => sum + entry.bytes_written, 0),
  };
}

export async function rebuildIndexes(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  options: ProjectionWriteOptions = {},
): Promise<IndexResult> {
  const activeRows = state.rows({ status: "active", includeChanges: false });
  const indexesDir = workspace.paths.indexes;
  await mkdir(indexesDir, { recursive: true });

  const builders: Record<V1IndexName, () => unknown> = {
    "active-by-id": () => buildActiveById(activeRows),
    "active-by-collection": () => buildActiveByCollection(activeRows),
    "active-claims-by-key": () => buildActiveClaimsByKey(activeRows),
    "active-sources-by-uri": () => buildActiveSourcesByUri(activeRows),
    "active-sources-by-content-hash": () => buildActiveSourcesByContentHash(activeRows),
    "active-claims-by-source-uri": () => buildSourceCitationIndex(state),
  };

  const generated_at = projectionTimestamp(options);
  const ledger = ledgerMeta(ledger_fingerprint);

  const out: IndexResult["indexes"] = [];
  for (const name of V1_INDEX_NAMES) {
    const data = builders[name]();
    const filePath = join(indexesDir, `${name}.json`);
    const body = `${JSON.stringify(data, null, 2)}\n`;
    await writeFile(filePath, body, "utf8");
    const bytesWritten = Buffer.byteLength(body, "utf8");

    const metadata: ProjectionMetadata = {
      schema_version: "knb.projection.v1",
      kind: "index",
      target: workspaceRelative(workspace, filePath),
      ledger,
      options: { name },
      generated_at,
    };
    const metadataPath = `${filePath}.meta.json`;
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    out.push({
      name,
      path: filePath,
      bytes_written: bytesWritten,
      metadata_path: metadataPath,
      metadata,
    });
  }

  return { indexes: out };
}

export async function checkFreshness(request: FreshnessRequest): Promise<FreshnessReport> {
  const { workspace, ledger_fingerprint } = request;
  const expectedHash = ledger_fingerprint.content_hash;

  const indexEntries: FreshnessEntry[] = [];
  const viewEntries: FreshnessEntry[] = [];

  const indexSidecars = await collectSidecars(workspace.paths.indexes);
  const viewSidecars = await collectSidecars(workspace.paths.views);

  const seenIndexNames = new Set<string>();

  for (const sidecar of indexSidecars) {
    const entry = await classifySidecar(sidecar, expectedHash);
    if (entry.kind === "index") {
      const name = indexNameFromTarget(entry.target);
      if (name) seenIndexNames.add(name);
    }
    indexEntries.push(entry);
  }
  for (const sidecar of viewSidecars) {
    viewEntries.push(await classifySidecar(sidecar, expectedHash));
  }

  for (const name of V1_INDEX_NAMES) {
    if (seenIndexNames.has(name)) continue;
    const filePath = join(workspace.paths.indexes, `${name}.json`);
    indexEntries.push({
      kind: "index",
      target: workspaceRelative(workspace, filePath),
      state: "missing",
    });
  }

  indexEntries.sort((a, b) => a.target.localeCompare(b.target));
  viewEntries.sort((a, b) => a.target.localeCompare(b.target));

  return { entries: [...indexEntries, ...viewEntries] };
}

function resolveViewPath(workspace: KnbWorkspace, collection: string, out: string | undefined): string {
  const viewsRoot = resolve(workspace.paths.views);
  if (out === undefined || out === null || out.length === 0) {
    return join(viewsRoot, `${sanitizeCollection(collection)}.md`);
  }
  const candidate = isAbsolute(out) ? resolve(out) : resolve(viewsRoot, out);
  const normalized = normalize(candidate);
  const rel = relative(viewsRoot, normalized);
  if (rel.startsWith("..") || rel === "" || isAbsolute(rel)) {
    throw knbError(
      "validation_failed",
      "Render output must stay within workspace views",
      { out, views: viewsRoot, resolved: normalized },
    );
  }
  return normalized;
}

function sanitizeCollection(collection: string): string {
  return collection.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_");
}

function activeCollectionNames(state: EffectiveState): string[] {
  const names = new Set<string>();
  for (const effective of state.rows({ status: "active", includeChanges: false })) {
    const collections = effective.row.scope.collections;
    if (!Array.isArray(collections)) continue;
    for (const raw of collections) {
      if (typeof raw !== "string") continue;
      const collection = raw.trim();
      if (collection.length > 0) names.add(collection);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function workspaceRelative(workspace: KnbWorkspace, target: string): string {
  const rel = relative(workspace.root, target);
  return rel.split(sep).join("/");
}

function ledgerMeta(fingerprint: LedgerFingerprint): ProjectionMetadata["ledger"] {
  const ledger: ProjectionMetadata["ledger"] = {
    path: fingerprint.path,
    rows: fingerprint.rows,
    content_hash: fingerprint.content_hash,
  };
  if (fingerprint.last_row_id !== undefined) ledger.last_row_id = fingerprint.last_row_id;
  return ledger;
}

function projectionTimestamp(options: ProjectionWriteOptions): string {
  return (options.clock ?? (() => new Date()))().toISOString();
}

function buildMarkdown(
  state: EffectiveState,
  collection: string,
  ledger_fingerprint: LedgerFingerprint,
): string {
  const active = state.rows({ status: "active", collection, includeChanges: false });

  const syntheses = active
    .map((er) => er.row)
    .filter((row): row is SynthesisRow => row.kind === "synthesis" && row.synthesis.status === "active")
    .sort(byImportanceThenCreatedDesc);

  const claims = active
    .map((er) => er.row)
    .filter((row): row is ClaimRow => row.kind === "claim")
    .sort(byCreatedAsc);

  const questions = active
    .map((er) => er.row)
    .filter((row): row is QuestionRow => row.kind === "question" && row.question.status === "open")
    .sort(byCreatedAsc);

  const citedSourceIds = new Set<string>();
  for (const synthesis of syntheses) {
    addCanonicalSourceIds(citedSourceIds, synthesis.synthesis.basis.source_ids ?? [], state);
  }
  for (const claim of claims) {
    addCanonicalSourceIds(citedSourceIds, claim.provenance.source_ids ?? [], state);
    addCanonicalSourceIds(
      citedSourceIds,
      (claim.provenance.evidence ?? []).map((evidence) => evidence.source_id),
      state,
    );
  }

  const sources = active
    .map((er) => er.row)
    .filter((row): row is SourceRow => row.kind === "source" && citedSourceIds.has(row.id))
    .sort(byCreatedAsc);
  const sourceCitationIndex = buildSourceCitationIndex(state);

  const title = titleize(collection);
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  lines.push(
    `Ledger: ${ledger_fingerprint.rows} rows; hash ${ledger_fingerprint.content_hash}`,
    "",
  );

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
      const depth = claim.assessment.information_depth?.level;
      if (depth) lines.push(`  - Depth: ${depth}`);
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
      const uri = source.source.uri;
      const citationCount = typeof uri === "string" ? sourceCitationIndex[uri]?.length ?? 0 : 0;
      const citationSuffix = citationCount > 0 ? ` (Cited by ${citationCount} ${citationCount === 1 ? "claim" : "claims"})` : "";
      lines.push(`- ${publisher}${source.source.title}${citationSuffix}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function addCanonicalSourceIds(
  target: Set<string>,
  ids: Iterable<string | undefined>,
  state: EffectiveState,
): void {
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    target.add(state.canonicalIdOf(id));
  }
}

function buildActiveById(rows: EffectiveRow[]): Record<string, { kind: string; scope: KnbRow["scope"] }> {
  const entries: Array<[string, { kind: string; scope: KnbRow["scope"] }]> = [];
  for (const effective of rows) {
    entries.push([effective.row.id, { kind: effective.row.kind, scope: effective.row.scope }]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, { kind: string; scope: KnbRow["scope"] }> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

function buildActiveByCollection(rows: EffectiveRow[]): Record<string, string[]> {
  const map = new Map<string, string[]>();
  for (const effective of rows) {
    const collections = effective.row.scope.collections;
    if (!Array.isArray(collections)) continue;
    for (const collection of collections) {
      if (typeof collection !== "string" || collection.length === 0) continue;
      const list = map.get(collection) ?? [];
      list.push(effective.row.id);
      map.set(collection, list);
    }
  }
  const sortedKeys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  const out: Record<string, string[]> = {};
  for (const key of sortedKeys) {
    out[key] = map.get(key) ?? [];
  }
  return out;
}

function buildActiveClaimsByKey(rows: EffectiveRow[]): Record<string, string> {
  const entries: Array<[string, string]> = [];
  for (const effective of rows) {
    if (effective.row.kind !== "claim") continue;
    const key = (effective.row as ClaimRow).identity?.claim_key;
    if (typeof key !== "string" || key.length === 0) continue;
    entries.push([key, effective.row.id]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

function buildActiveSourcesByUri(rows: EffectiveRow[]): Record<string, string> {
  const entries: Array<[string, string]> = [];
  for (const effective of rows) {
    if (effective.row.kind !== "source") continue;
    const uri = (effective.row as SourceRow).source?.uri;
    if (typeof uri !== "string" || uri.length === 0) continue;
    entries.push([uri, effective.row.id]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

function buildActiveSourcesByContentHash(rows: EffectiveRow[]): Record<string, string> {
  const entries: Array<[string, string]> = [];
  for (const effective of rows) {
    if (effective.row.kind !== "source") continue;
    const hash = (effective.row as SourceRow).source?.content_hash;
    if (typeof hash !== "string" || hash.length === 0) continue;
    entries.push([hash, effective.row.id]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

async function collectSidecars(dir: string): Promise<string[]> {
  const out: string[] = [];
  await walkSidecars(dir, out);
  return out;
}

async function walkSidecars(dir: string, acc: string[]): Promise<void> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as unknown as Dirent[];
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
  for (const entry of entries) {
    const name = entry.name;
    const full = join(dir, name);
    if (entry.isDirectory()) {
      await walkSidecars(full, acc);
      continue;
    }
    if (entry.isFile() && name.endsWith(".meta.json")) {
      acc.push(full);
    }
  }
}

async function classifySidecar(sidecarPath: string, expectedHash: string): Promise<FreshnessEntry> {
  let raw: string;
  try {
    raw = await readFile(sidecarPath, "utf8");
  } catch (error) {
    if (isMissing(error)) {
      return {
        kind: "view",
        target: sidecarPath,
        state: "missing",
        metadata_path: sidecarPath,
      };
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      kind: "view",
      target: sidecarPath,
      state: "unknown",
      metadata_path: sidecarPath,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      kind: "view",
      target: sidecarPath,
      state: "unknown",
      metadata_path: sidecarPath,
    };
  }

  const meta = parsed as Partial<ProjectionMetadata>;
  const kind: ProjectionKind = meta.kind === "index" ? "index" : "view";
  const target = typeof meta.target === "string" ? meta.target : sidecarPath;
  const ledgerHash = typeof meta.ledger?.content_hash === "string" ? meta.ledger.content_hash : undefined;
  const generatedAt = typeof meta.generated_at === "string" ? meta.generated_at : undefined;

  if (
    meta.schema_version !== "knb.projection.v1" ||
    typeof meta.target !== "string" ||
    ledgerHash === undefined
  ) {
    const entry: FreshnessEntry = {
      kind,
      target,
      state: "unknown",
      metadata_path: sidecarPath,
    };
    if (ledgerHash !== undefined) entry.ledger_hash = ledgerHash;
    if (generatedAt !== undefined) entry.generated_at = generatedAt;
    return entry;
  }

  const targetPath = sidecarPath.slice(0, -".meta.json".length);
  const targetExists = await fileExists(targetPath);

  const baseEntry: FreshnessEntry = {
    kind,
    target,
    state: "fresh",
    metadata_path: sidecarPath,
    ledger_hash: ledgerHash,
  };
  if (generatedAt !== undefined) baseEntry.generated_at = generatedAt;

  if (!targetExists) {
    baseEntry.state = "missing";
    return baseEntry;
  }
  baseEntry.state = ledgerHash === expectedHash ? "fresh" : "stale";
  return baseEntry;
}

function indexNameFromTarget(target: string): V1IndexName | undefined {
  const lastSlash = target.lastIndexOf("/");
  const file = lastSlash >= 0 ? target.slice(lastSlash + 1) : target;
  if (!file.endsWith(".json")) return undefined;
  const name = file.slice(0, -".json".length);
  return (V1_INDEX_NAMES as readonly string[]).includes(name) ? (name as V1IndexName) : undefined;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

function byCreatedAsc(a: KnbRow, b: KnbRow): number {
  return a.created_at.localeCompare(b.created_at);
}

function byImportanceThenCreatedDesc(a: SynthesisRow, b: SynthesisRow): number {
  const importanceA = assessmentLevelWeight(a.assessment?.importance);
  const importanceB = assessmentLevelWeight(b.assessment?.importance);
  return importanceB - importanceA || b.created_at.localeCompare(a.created_at);
}

function assessmentLevelWeight(level: Assessment["importance"]): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  if (level === "low") return 1;
  return 0;
}

function titleize(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}
