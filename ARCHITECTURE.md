# knb Architecture

`knb` stores sourced knowledge in an append-only JSONL ledger and exposes it through a small TypeScript facade plus a thin CLI adapter. The ledger is canonical; everything in `knb/views/` and `knb/indexes/` is a disposable projection rebuilt from the ledger.

For full command contracts, output envelopes, and lifecycle details, see [docs/design/agent-first-cli.md](docs/design/agent-first-cli.md). Standing decisions live in [docs/adr/](docs/adr/).

## Event Model

Rows in `knb/ledger.jsonl` are canonical events. `source`, `claim`, `question`, and `synthesis` rows introduce knowledge artifacts. `change` rows are lifecycle events that retract, supersede, merge, relate, or patch earlier rows. `EffectiveState` is the deterministic projection of those events at a point in time; read paths consume `EffectiveState`, not raw ledger rows.

## Core Modules

| Module | Responsibility | Interface seam |
| --- | --- | --- |
| `src/core/apply.ts` | Validate semantic write operations, complete draft rows, dedupe candidate claims, and produce appendable rows. | `applyOperations` through the `Knb.apply` facade, with `ApplyResult` and generated `run_id`. |
| `src/core/context.ts` | Build token-budgeted research packets from effective state, including ranked syntheses, claims, questions, sources, and warnings. | `buildContext`, `ContextRequest`, scoring profile types, and scoring functions. |
| `src/core/contract.ts` | Own row types, operation types, constants, validation, draft completion, samples, reference walking, and JSON Schema. | `KnbRow`, `ApplyOperation`, `validateLedger`, `validateApplyRequest`, `jsonSchema`, `referenceFields`. |
| `src/core/errors.ts` | Define typed domain errors and map them to CLI exit codes. | `KnbErrorCode`, `knbError`, `fromUnknown`, `exitCodeForError`. |
| `src/core/knb.ts` | Public library facade that wires workspace, ledger, read snapshots, writes, queries, context, rendering, indexes, logs, and runtime adapters. | `openKnb`, `Knb`, `OpenKnbOptions`, public request/result types. |
| `src/core/ledger.ts` | Own JSONL loading, parse diagnostics, fingerprints, lock-protected append transactions, and durable flush behavior. | `loadLedger`, `writeLedger`, `LedgerFingerprint`, `LedgerSnapshot`. |
| `src/core/novelty.ts` | Classify candidate claims against active claims for dedupe and research triage. | `classifyClaim`, `classifyMany`, `NoveltyResult`. |
| `src/core/output.ts` | Render CLI success/failure envelopes and human text without changing domain results. | `success`, `failure`, `render`, `CommandResult`. |
| `src/core/profiles.ts` | Load and validate optional workspace profiles that constrain row shapes. | `KnbProfile`, `validateProfilesForWorkspace`, `profileSchema`, `profileSamples`. |
| `src/core/projections.ts` | Render Markdown views, rebuild disposable indexes, write projection metadata, and report freshness. | `ProjectionArtifactStore`, `JsonProjectionArtifactStore`, `renderCollection`, `renderAllCollections`, `rebuildIndexes`, `checkFreshness`. |
| `src/core/query.ts` | Retrieve active or historical rows from effective state with deterministic filtering and ranking. | `executeQuery`, `executeGet`, `QueryRequest`, `GetRequest`. |
| `src/core/read-snapshot.ts` | Build one read-side packet from ledger load, validation, state projection, profile validation, and projection freshness. | `readSnapshot`, `KnbReadSnapshot`, injected loader/validator/projector/freshness seams. |
| `src/core/run-manifests.ts` | Persist and read per-run operation manifests for audit logs. | `RunManifest`, `runsDirFor`, facade log methods. |
| `src/core/selectors.ts` | Validate and evaluate structured row selectors for claim type, qualifiers, and external references. | `RowSelector`, `structuredClaimSelectorFromRequest`, `matchesRowSelector`, `rowSelectorSchema`. |
| `src/core/source-citations.ts` | Build source URI/hash to citing-claim vocabulary for reverse citation lookup. | `SourceCitationIndex`, `buildSourceCitationIndex`. |
| `src/core/state.ts` | Project loaded ledger rows into current or as-of effective state, lifecycle explanations, relation graph, and warnings. | `buildEffectiveState`, `EffectiveState`, `EffectiveRow`, `StateOptions`. |
| `src/core/workspace.ts` | Resolve workspace paths, config, actor identity, and runtime command execution. | `openWorkspace`, `KnbWorkspace`, `OpenWorkspaceOptions`. |

## Scoring Model

Context scoring is explicit and narrow. Defaults preserve historical ordering: importance, confidence, information depth, evidence count, contested status, created time, then id. Callers may pass `ContextRequest.scoringProfile` to adjust weights and `recencyWindowDays` to enable linear recency scoring. The approved recency score is `max(0, 1 - ageDays / windowDays) * weight`, anchored to `request.asOf` when set and otherwise to the newest in-scope row.

## Projection Artifacts

`ProjectionArtifactStore` owns generated views, indexes, sidecar metadata, and freshness checks. Generated projection files are disposable artifacts, not read-side authority. Canonical reads always load the ledger, validate it, and project `EffectiveState`. V1 ships only `JsonProjectionArtifactStore`; see [ADR-0002](docs/adr/0002-projection-store-seam-jsonl-only.md).

Rendered Markdown views are structured for skimming: a top table of contents, stable row anchors derived from row ids, claim-key clusters derived from `EffectiveState`, an explicit unkeyed-claims section, open questions, and cited sources with counts from `SourceCitationIndex`. Views may change layout, but sidecar metadata keeps the projection envelope shape stable.

## Vocabulary

- Row kinds: `source`, `claim`, `question`, `synthesis`, and `change`.
- Change actions: `retract`, `supersede`, `merge`, `relate`, and `patch`.
- Identity fields: `claim_key` anchors semantic claim identity; `dedupe_hash` anchors normalized duplicate detection; `external_refs` links rows to outside systems.
- Scope fields: `collections`, `subjects`, and `tags` filter and group rows.
- Time precision values: `instant`, `hour`, `day`, `month`, `year`, `range`, and `unknown`.
- `EffectiveState`: projected active/inactive row state plus lifecycle explanations, relation graph, and state warnings.
- `LedgerFingerprint`: canonical ledger identity computed from path, row count, bytes, last row id, and content hash.
- `run_id`: per-apply transaction id stored in run manifests and core apply results. Public TypeScript callers pass `runId`; persisted/core rows and manifests use `run_id`.
- `SourceCitationIndex`: source URI/hash to citing claim ids; this owns the reverse-citation vocabulary.

## Naming

Use one casing per boundary. CLI flags are kebab-case, for example `--claim-key` and `--recency-window-days`. Ledger/schema fields are snake_case, for example `claim_key`, `external_refs`, and `run_id`. Public TypeScript facade request fields are camelCase, for example `claimKey`, `externalRefs`, `maxTokens`, `includeWarnings`, `recencyWindowDays`, and `runId`. The CLI adapter is responsible for translating flags into facade request fields.
