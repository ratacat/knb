# knb Architecture

`knb` stores sourced knowledge in append-only JSONL ledgers and exposes it through a small TypeScript facade plus a thin CLI adapter. The selected instance ledger is canonical; generated views and indexes are disposable projections rebuilt from that ledger.

Run `knb help` for the current command surface and output modes. Standing decisions live in [docs/adr/](docs/adr/).

## Event Model

Rows in the selected instance ledger are canonical events. The default `main` instance uses `knb/ledger.jsonl`; additional instances use `knb/instances/<id>/ledger.jsonl` unless config overrides paths. `source`, `claim`, `question`, and `synthesis` rows introduce knowledge artifacts. `entry` rows retract, supersede, merge, link, or patch earlier rows. `EffectiveState` is the deterministic projection of those events at a point in time; read paths consume `EffectiveState`, not raw ledger rows.

Terminology direction: use **record** for domain and profile language, **link** for typed semantic edges, and **entry** for append-only ledger mutations. `link` and `entry` are current storage/API terms. `source`, `claim`, `question`, and `synthesis` remain legacy knowledge row kinds until records replace them. This restores the old `bd-2v6c`/`bd-2v6c.1` decision rather than treating `record` as tentative.

## Profiles And Instances

- A **profile** is a named vocabulary and rule set layered on top of the general `knb.v1` row model. Profiles define domain record types, required profile fields, link conventions, and agent instructions. Examples: `research.v1`, `trade_map.v1`.
- An **instance** is one named knowledge base inside a project folder. Each instance has its own ledger, views, indexes, lock, and profile attachments. With no `--root`, the CLI and library use the current working directory as the project root; they do not search parent directories for `.knb/config.json`. Select an instance with `--instance <id>`, `KNB_INSTANCE`, or `config.default_instance`; otherwise `main` is used. One project folder may contain many instances.
- Rows can declare profile membership through `scope.profiles`, which also supports profile-scoped reads and renders. Profile membership is not a filesystem boundary.
- Profile-specific record data currently lives in `claim.qualifiers`, the canonical extension slot. Profile docs should name their own fields directly; agents do not need to use "qualifiers" as domain language.

## Core Modules

| Module | Responsibility | Interface seam |
| --- | --- | --- |
| `src/core/apply.ts` | Validate semantic write operations, complete draft rows, and produce appendable rows. | `applyOperations` through the `Knb.apply` facade, with `ApplyResult` and generated `run_id`. |
| `src/core/context.ts` | Build token-budgeted research packets from effective state, including ranked syntheses, records, questions, sources, and warnings. | `buildContext`, `ContextRequest`, and `ContextResult`. |
| `src/core/contract.ts` | Own row types, operation types, constants, validation, draft completion, samples, reference walking, and JSON Schema. | `KnbRow`, `ApplyOperation`, `validateLedger`, `validateApplyRequest`, `jsonSchema`, `referenceFields`. |
| `src/core/errors.ts` | Define typed domain errors and map them to CLI exit codes. | `KnbErrorCode`, `knbError`, `fromUnknown`, `exitCodeForError`. |
| `src/core/knb.ts` | Public library facade that wires workspace, ledger, read snapshots, writes, queries, context, rendering, indexes, and runtime adapters. | `openKnb`, `Knb`, `OpenKnbOptions`, public request/result types. |
| `src/core/ledger.ts` | Own JSONL loading, parse diagnostics, fingerprints, lock-protected append transactions, and durable flush behavior. | `loadLedger`, `writeLedger`, `LedgerFingerprint`, `LedgerSnapshot`. |
| `src/core/migrate.ts` | Detect and upgrade old single-instance configs into the current instance registry without rewriting ledgers. | `migrateWorkspace`, `MigrationOptions`, `MigrationResult`. |
| `src/core/output.ts` | Render CLI success/failure envelopes and human text without changing domain results. | `success`, `failure`, `render`, `CommandResult`. |
| `src/core/projections.ts` | Render Markdown views, rebuild disposable indexes, write projection metadata, and report freshness. | `ProjectionArtifactStore`, `JsonProjectionArtifactStore`, `renderView`, `rebuildIndexes`, `checkFreshness`. |
| `src/core/query.ts` | Retrieve active or historical rows from effective state with deterministic filtering and ranking. | `executeQuery`, `executeGet`, `QueryRequest`, `GetRequest`. |
| `src/core/read-snapshot.ts` | Build one read-side packet from ledger load, validation, state projection, and projection freshness. | `readSnapshot`, `KnbReadSnapshot`, injected loader/validator/projector/freshness seams. |
| `src/core/source-citations.ts` | Build source URI/hash to referencing record ids for projections. | `SourceCitationIndex`, `buildSourceCitationIndex`. |
| `src/core/state.ts` | Project loaded ledger rows into current or as-of effective state, lifecycle explanations, link graph, and warnings. | `buildEffectiveState`, `EffectiveState`, `EffectiveRow`, `StateOptions`. |
| `src/core/workspace.ts` | Resolve workspace paths, config, actor identity, and runtime command execution. | `openWorkspace`, `KnbWorkspace`, `OpenWorkspaceOptions`. |

## Context Ranking

Context ranking is deterministic and private. The public request controls scope, token budget, historical cutoff, and warnings; callers do not supply ranking weights or recency policy.

## Projection Artifacts

`ProjectionArtifactStore` owns generated views, indexes, sidecar metadata, and freshness checks. Generated projection files are disposable artifacts, not read-side authority. Canonical reads always load the ledger, validate it, and project `EffectiveState`. V1 ships only `JsonProjectionArtifactStore`; see [ADR-0002](docs/adr/0002-projection-store-seam-jsonl-only.md).

Rendered Markdown views are structured for skimming: a top table of contents, stable row anchors derived from row ids, legacy claim-key clusters derived from `EffectiveState`, an explicit unkeyed-records section, open questions, and cited sources with counts from `SourceCitationIndex`. Views may change layout, but sidecar metadata keeps the projection envelope shape stable.

## Vocabulary

- Record: the preferred domain/profile term for the knowledge card unit.
- Link: the preferred term for typed semantic edges between records.
- Entry: the preferred term for append-only ledger mutations.
- Legacy knowledge row kinds: current storage still exposes `source`, `claim`, `question`, and `synthesis` until records replace them.
- Profile: a named vocabulary and rules package applied within an instance.
- Instance: one named knowledge base inside a project folder, with its own canonical ledger, generated projections, lock, and profile attachments.
- Entry actions: `retract`, `supersede`, `merge`, `link`, and `patch`; storage persists them under `entry.action`.
- Identity fields: legacy `claim_key` anchors semantic record identity; `external_refs` links rows to outside systems.
- Scope fields: `profiles`, `subjects`, and `tags` filter and group rows. `profiles` records profile membership; instances select the ledger and attached profile list.
- Time precision values: `instant`, `hour`, `day`, `month`, `year`, `range`, and `unknown`.
- `EffectiveState`: projected active/inactive row state plus lifecycle explanations, link graph, and state warnings.
- `LedgerFingerprint`: canonical ledger identity computed from path, row count, bytes, last row id, and content hash.
- `run_id`: per-apply transaction id stored in core apply results and row provenance. Public TypeScript callers pass `runId`; persisted/core rows use `run_id`.
- `SourceCitationIndex`: source URI/hash to referencing record ids for generated projections.

## Naming

Use one casing per boundary. CLI flags are kebab-case, for example `--claim-key` and `--max-tokens`. Ledger/schema fields are snake_case, for example `claim_key`, `external_refs`, and `run_id`. Public TypeScript facade request fields are camelCase, for example `claimKey`, `maxTokens`, `includeWarnings`, and `runId`. The CLI adapter is responsible for translating flags into facade request fields.
