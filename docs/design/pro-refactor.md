# Pro Refactor Guide

This guide records the high-intelligence refactor direction for turning the current prototype into the greenfield `knb` V1 architecture. The live specification remains [agent-first-cli.md](/Users/jaredsmith/Projects/knb/docs/design/agent-first-cli.md); use this file as source material when updating that spec.

## Summary


## 1. Short Gap Analysis

### What Already Matches The Spec

The prototype has the core canonical data model in place:

- `src/types.ts` defines `KnbRow`, `SourceRow`, `ClaimRow`, `QuestionRow`, `SynthesisRow`, and `ChangeRow`.
- The row kinds match the spec's canonical model: `source`, `claim`, `question`, `synthesis`, and `change`.
- Common modules such as `scope`, `identity`, `time`, `provenance`, `assessment`, and `relations` are already represented in TypeScript.
- `knb/schema.json` reflects the same general row shape.
- `src/knb.ts` already implements basic JSONL loading, validation, appending, querying, lifecycle hiding, and Markdown rendering.
- `tests/validator.test.ts` already exercises valid rows, unresolved evidence sources, supersession hiding, and invalid lifecycle relation terms.

That is useful scaffolding. The current implementation should be mined, not discarded blindly.

### What Is Missing Or Too Shallow

The major issue is that `src/knb.ts` is a broad helper module. It currently mixes responsibilities that the spec wants behind separate deep modules:

| Spec module | Current status |
| --- | --- |
| `Knb` facade / `openKnb` | Missing |
| Workspace module | Missing |
| Ledger module | Partially present inside `loadLedger` / `appendRow`, but no lock, no fingerprint, no transaction abstraction |
| Contract module | Missing; validation is hand-coded in `src/knb.ts`, while schema and types live elsewhere |
| State module | Very shallow; `effectiveRows` only hides rows targeted by lifecycle changes |
| Read snapshot module | Missing |
| Apply module | Missing; current `append` writes one row only |
| Query module | Shallow; `queryRows` does direct filters and `JSON.stringify` text search |
| Context module | Missing |
| Projection module | Missing; render writes directly and has no metadata/freshness |
| Output/error modules | Missing; CLI prints directly and uses ad hoc exit codes |
| Public package export | Missing; `package.json` has a bin but no `"exports"` entry |


### Important Behavioral Divergences

The most important correctness gap is write safety. Today, `appendRow` loads the ledger, validates the candidate ledger, then appends with `appendFile`. There is no lock, no read/write transaction, no snapshot fingerprint, and no guarantee that validation and append happen against the same ledger state. The spec requires a locked ledger write transaction that reads, validates, builds append rows, writes the complete batch, flushes, and releases the lock in one path.

The second big gap is that current state is underspecified in code. `effectiveRows` builds a simple inactive ID set from all `retract`, `supersede`, and `merge` changes. It does not return status explanations, relation graph changes, warnings, archived state, duplicate state, or inactive history. The spec wants an `EffectiveState` projection with `active`, `retracted`, `superseded`, `duplicate`, `archived`, and `invalid` statuses.


## 2. Design Direction

This is best handled as a broader staged refactor, not a single targeted change.

The deletion-test principle from the spec is the correct boundary rule: a module earns a seam only if deleting it would push rules into multiple callers. By that standard, the following modules are justified immediately because the CLI, facade, tests, and future host apps would otherwise duplicate their rules:

- `workspace`
- `ledger`
- `contract`
- `errors`
- `output`
- `state`
- `read-snapshot`
- `apply`
- `query`
- `context`
- `projections`
- `Knb` facade

Do not add storage adapters, plugin systems, semantic search, source fetching, hooks, dashboard code, or stdio server support in this pass. The spec explicitly defers those.

The high-level architecture should become:

```text
src/
  cli.ts                  CLI adapter only
  index.ts                package public export
  core/
    knb.ts                Knb facade / openKnb
    workspace.ts          path/config/actor resolution
    ledger.ts             JSONL load, fingerprint, locked append transactions
    contract.ts           row + apply operation contracts, validation, samples, schema
    errors.ts             typed errors and exit-code mapping
    output.ts             CLI result envelopes and rendering
    state.ts              effective state projection
    read-snapshot.ts      load + validate + project + freshness packet
    apply.ts              atomic semantic write pipeline
    query.ts              deterministic retrieval
    context.ts            research briefing packet
    projections.ts        render/index/freshness metadata
```

`src/knb.ts` should be treated as prototype scaffolding. During migration it can remain as a temporary wrapper for tests, but the final tree should not expose broad helpers as the public library interface.

## 3. Staged Implementation Plan

### Milestone 0: Baseline Stabilization

Goal: preserve the current behavior while preparing to carve it into modules.

Deliverables:

- Run and keep passing:
  - `bun test`
  - `bun run typecheck`
- Treat these current functions as source material:
  - `loadLedger`
  - `appendRow`
  - `validateLedger`
  - `effectiveRows`
  - `queryRows`
  - `renderCollection`
  - `writeRenderedCollection`
- Do not add new product behavior yet.

Why first: this gives the implementation a known-good baseline before moving code. The current tests in `tests/validator.test.ts` are narrow but useful; they should not be broken casually.

### Milestone 1: Establish The Contract Module

Goal: make row and operation contracts the first real module.

New file:

```text
src/core/contract.ts
```

This module owns:

- Row-kind constants.
- Relation/action/enum constants.
- `KnbRow` and row subtypes, either directly or by re-exporting internal contract-owned type definitions.
- `ApplyRequest`, `ApplyOperation`, `DraftRow`, and `Ref`.
- Row validation.
- Apply-operation validation.
- Cross-row reference validation.
- Draft-row completion rules.
- Row samples.
- Apply-operation samples.
- JSON Schema production.

Move or adapt from `src/types.ts`:

- `KNB_SCHEMA_VERSION`
- `ROW_KINDS`
- `SOURCE_TYPES`
- `RELATION_TYPES`
- `CHANGE_ACTIONS`
- `TIME_PRECISIONS`
- row and field types

Move or adapt from `src/knb.ts`:

- `validateLedger`
- `validateCommon`
- `validateSource`
- `validateClaim`
- `validateQuestion`
- `validateSynthesis`
- `validateChange`
- `validateSourceRefs`
- `validateRelations`
- `validateSynthesisBasis`
- `validateQuestionAnswers`

The operation contract should match the design doc:

```ts
type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true;
  actor?: string;
  now?: string;
};

type ApplyOperation =
  | { op: "add"; row: DraftRow; as?: string }
  | { op: "retract"; target_ids: Ref[]; reason: string; scope?: Scope; as?: string }
  | { op: "supersede"; target_ids: Ref[]; replacement_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "merge"; target_ids: Ref[]; canonical_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "relate"; from_id: Ref; to_id: Ref; rel: RelationType; strength?: "low" | "medium" | "high"; rationale?: string; scope?: Scope; as?: string }
  | { op: "patch"; target_id: Ref; patch: Array<Record<string, unknown>>; reason: string; scope?: Scope; as?: string };
```

Extend validation issues with stable machine-readable fields:

```ts
type ValidationIssue = {
  level: "error" | "warning";
  code?: string;
  message: string;
  path?: string;
  line?: number;
  id?: string;
};
```

Keep the source of truth as TypeScript constants plus validator rules. Expose a `jsonSchema()` function from `contract.ts` that returns the same object currently stored in `knb/schema.json`. Add a test that compares `knb/schema.json` to the object returned by the contract module.

Tests:

- `tests/contract.test.ts`
  - valid source/claim/synthesis rows
  - unresolved source references
  - invalid relation types
  - duplicate IDs
  - operation batch shape validation
  - row samples validate successfully
  - operation samples validate successfully
  - `knb/schema.json` matches the contract schema object

Stage exit condition: current CLI behavior still works, but validation now comes from `src/core/contract.ts`.

### Milestone 2: Add Errors, Output, And Workspace

Goal: lock down stable external behavior before adding higher-level commands.

`src/core/errors.ts` owns typed core errors and exit-code mapping.

```ts
type KnbErrorCode =
  | "invalid_arguments"
  | "validation_failed"
  | "duplicate_blocked"
  | "lock_busy"
  | "io_failed"
  | "broken_reference"
  | "unsafe_operation_refused"
  | "external_dependency_failed"
  | "internal_error";
```

Exit-code mapping:

```text
0   success
1   not found or no matches
2   invalid arguments
3   validation failed
4   conflict or duplicate blocked
5   filesystem or IO error
6   lock busy
7   broken reference or graph integrity error
8   external dependency failure
9   unsafe operation refused
10  internal error
```

`src/core/output.ts` owns command result envelopes and rendering.

```ts
type CommandResult<T = unknown> =
  | {
      ok: true;
      command: string;
      data: T;
      meta: CommandMeta;
    }
  | {
      ok: false;
      command?: string;
      error: CommandError;
      meta: CommandMeta & { exit_code: number };
    };
```

Behavior:

- `--json` prints the envelope, not raw rows.
- Human TTY output remains compact.
- Piped output defaults to compact JSON.
- Errors go to stderr.
- Success data goes to stdout.
- `--quiet` suppresses nonessential success text.

`src/core/workspace.ts` owns:

- `--root`
- `--config`
- `--ledger`
- `KNB_CONFIG`
- `.knb/config.json`
- fallback current directory
- ledger/schema/index/view/lock path normalization
- actor resolution from:
  - `--actor`
  - `KNB_ACTOR`
  - Git user/email
  - system username
  - `"unknown"`

Do not let CLI commands duplicate path or actor logic. After this milestone, commands should receive a `KnbWorkspace`.

Tests:

- `tests/workspace.test.ts`
  - config precedence
  - explicit ledger override
  - root-relative path normalization
  - actor precedence
- `tests/output.test.ts`
  - success envelope
  - error envelope
  - exit code mapping
  - JSON versus human output

Stage exit condition: the CLI may still call old helper behavior, but output/errors/workspace are available and tested.

### Milestone 3: Replace File Helpers With A Ledger Module

Goal: make canonical storage safe and auditable.

New file:

```text
src/core/ledger.ts
```

The ledger module owns:

- JSONL parsing.
- Line-number preservation.
- Parse issues without discarding valid later rows.
- Ledger byte fingerprint.
- Directory creation.
- Lock acquisition and release.
- Locked write transactions.
- Append batch serialization.
- File flush.
- Directory flush when available.
- Append result metadata.

Key types:

```ts
type LedgerSnapshot = {
  rows: LoadedRow[];
  parseIssues: ValidationIssue[];
  fingerprint: LedgerFingerprint;
};

type LedgerFingerprint = {
  path: string;
  rows: number;
  bytes: number;
  last_row_id?: string;
  content_hash: string;
};

type LedgerAppendPlan<T> = {
  rows: KnbRow[];
  result: T;
};

type LedgerWriteTransaction<T> =
  (snapshot: LedgerSnapshot) => Promise<LedgerAppendPlan<T>>;
```

`withWriteTransaction` must:

1. Acquire `.knb/ledger.lock` using exclusive create.
2. Fail fast with `lock_busy` and exit code `6` if the lock exists.
3. Load and parse the current ledger while holding the lock.
4. Pass the locked snapshot to the callback.
5. Receive rows to append and the semantic result.
6. Serialize rows as JSONL inside the ledger module.
7. Append the complete batch.
8. Flush the file.
9. Flush the ledger directory if supported.
10. Release the lock in `finally`.
11. Return the caller result plus ledger metadata.

The ledger module does not validate row meaning. It owns storage correctness. Validation remains in `contract.ts`.

Logical atomicity is guaranteed for normal process errors before append. A crash during the underlying OS write can still leave a partial trailing line. The loader must keep reporting line-numbered parse issues and must preserve valid rows before and after any bad line. `check` becomes the recovery surface.

Tests:

- `tests/ledger.test.ts`
  - empty/missing ledger loads as empty
  - invalid JSON line reports line number
  - valid rows after invalid lines are preserved
  - fingerprint changes when content changes
  - locked transaction appends a batch
  - lock contention returns `lock_busy`
  - transaction callback failure appends no rows

Stage exit condition: current append behavior can be temporarily routed through ledger transactions, but the public `apply` command does not exist yet.

### Milestone 4: Add The Public Facade And Read Snapshot Skeleton

Goal: establish the public library surface and stop letting the CLI coordinate internals.

New files:

- `src/index.ts`
- `src/core/knb.ts`
- `src/core/read-snapshot.ts`

`src/index.ts` exports only the public library entry point and public types:

```ts
export { openKnb };
export type {
  Knb,
  OpenKnbOptions,
  KnbWorkspace,
  ApplyRequest,
  ApplyResult,
  QueryRequest,
  QueryResult,
  ContextRequest,
  ContextResult,
  RenderRequest,
  RenderResult,
  CheckRequest,
  CheckResult,
};
```

Host applications import from the package root, not internal command files.

`src/core/knb.ts` owns the `Knb` facade:

```ts
type Knb = {
  workspace: KnbWorkspace;
  status(): Promise<KnbStatus>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  get(ids: string[], options?: GetOptions): Promise<GetResult>;
  query(request: QueryRequest): Promise<QueryResult>;
  context(request: ContextRequest): Promise<ContextResult>;
  render(request: RenderRequest): Promise<RenderResult>;
  check(request?: CheckRequest): Promise<CheckResult>;
  rebuildIndex(): Promise<IndexResult>;
};
```

Add deterministic runtime injection:

```ts
type KnbRuntime = {
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
};
```

No core module should call `new Date()` or random functions directly after this milestone.

`src/core/read-snapshot.ts` owns the read-side sequence:

1. Load ledger through `ledger.ts`.
2. Validate rows through `contract.ts`.
3. Build effective state only if validation has no errors.
4. Collect projection freshness, initially as `unknown`.
5. Return a single `KnbReadSnapshot`.

```ts
type KnbReadSnapshot = {
  ledger: LedgerSnapshot;
  fingerprint: LedgerFingerprint;
  validation: ValidationResult;
  state?: EffectiveState;
  projectionFreshness: ProjectionFreshness;
};
```

At this milestone, `EffectiveState` can be temporary or shallow, but the call chain should be correct.

CLI changes:

```text
parse args -> openKnb -> call facade method -> render CommandResult
```

Add initial commands:

- `status`
- `schema`
- `check`

Keep `validate` only as an internal migration alias during the branch. The final V1 command surface removes it.

Tests:

- `tests/facade.test.ts`
  - `openKnb`
  - `status`
  - `check`
  - `schema`
- `tests/read-snapshot.test.ts`
  - loaded snapshot with parse errors
  - validated snapshot
  - projected snapshot once state is available

Stage exit condition: the package now has a real library module, even though not every command is feature-complete.

### Milestone 5: Deepen Effective State

Goal: replace `effectiveRows` with the real read-side projection.

New file:

```text
src/core/state.ts
```

The state module owns deterministic projection from raw rows to current state.

```ts
type EffectiveStatus =
  | "active"
  | "retracted"
  | "superseded"
  | "duplicate"
  | "archived"
  | "invalid";

type EffectiveRow = {
  row: KnbRow;
  status: EffectiveStatus;
  explanation?: StateExplanation;
};

type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(options?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  explain(id: string): StateExplanation | undefined;
  relationGraph(): RelationGraph;
  warnings: StateWarning[];
};
```

Algorithm:

1. Read validated rows in ledger order.
2. Build an ID map.
3. Initialize valid rows as `active`.
4. Mark intrinsically archived rows:
   - `question.status === "archived"`
   - `synthesis.status === "archived"`
5. Apply `change` rows in ledger order:
   - `retract` -> target rows become `retracted`.
   - `supersede` -> target rows become `superseded`, explanation points to replacement.
   - `merge` -> target rows become `duplicate`, explanation points to canonical.
   - `relate` -> add relation edge to effective relation graph.
   - `patch` -> record explanation/audit metadata, but do not mutate the target row in v1.
6. Produce warnings for:
   - dangling change references
   - contradictory lifecycle changes
   - lifecycle changes targeting already inactive rows
   - relation changes with missing endpoints
7. Hide `change` rows from normal reads unless explicitly requested.

`effectiveRows` currently treats all target IDs as inactive regardless of detailed status or explanation. Replace all callers with `EffectiveState`.

Tests:

- `tests/state.test.ts`
  - active rows
  - retract
  - supersede
  - merge
  - archive
  - relation changes
  - `get --explain` data
  - normal reads hide changes
  - history reads include inactive rows
  - dangling change warnings

Stage exit condition: all read-side behavior uses `EffectiveState`, not raw rows.

### Milestone 6: Implement Atomic Apply And Add

Goal: replace single-row append with the semantic write pipeline.

New file:

```text
src/core/apply.ts
```

The apply module owns:

- `ApplyRequest` execution.
- Locked write transaction.
- Snapshot validation.
- Intra-batch references.
- Draft row completion.
- ID generation.
- Lifecycle operation conversion to `change` rows.
- Candidate ledger validation.
- `ApplyResult`.

```ts
type ApplyResult = {
  created: Array<{ op: number; as?: string; id: string; kind: KnbRowKind }>;
  warnings: string[];
};
```

Inside `ledger.withWriteTransaction`:

1. Load locked snapshot.
2. Validate snapshot with `contract.validateRows`.
3. Fail if snapshot has validation errors.
4. Validate operation batch shape.
5. Reject `atomic: false` with `unsafe_operation_refused`.
6. Initialize reference resolver with existing row IDs.
7. For each operation left-to-right:
   - Resolve `$op<N>` and `$<as>` only to previous operations.
   - Reject forward references.
   - For `add`, resolve references inside known row reference paths only:
     - `provenance.source_ids[]`
     - `provenance.evidence[].source_id`
     - `relations[].target_id`
     - `synthesis.basis.claim_ids[]`
     - `synthesis.basis.question_ids[]`
     - `synthesis.basis.source_ids[]`
     - `question.answer_claim_id`
   - Do not blindly string-replace arbitrary fields.
   - Complete missing common fields:
     - `schema_version`
     - `created_at`
     - `created_by`
     - generated `id`
   - For lifecycle operations, derive `scope` from target rows if omitted.
   - Build `change` rows for `retract`, `supersede`, `merge`, `relate`, and `patch`.
9. Validate the complete candidate ledger.
10. Return append rows and `ApplyResult` to the ledger transaction.
11. After successful append, trigger eager projection rebuild only if configured; otherwise freshness metadata naturally becomes stale by fingerprint mismatch.

Generated IDs use this format:

```text
<kind-prefix>:<scope-slug>:<YYYYMMDD>:<random8>
```

Kind prefixes:

```text
source     src
claim      claim
question   q
synthesis  synth
change     chg
```

Use the first available value from:

1. `scope.collections[0]`
2. `scope.subjects[0]`
3. `scope.tags[0]`

If no slug source exists, validation fails before ID generation.


CLI:

```text
knb add ...
```

`knb add` builds a one-operation `ApplyRequest` and calls the same apply module. It must not have its own validation/write path.

`appendRow` should no longer be used by CLI. Keep it only as a temporary compatibility wrapper if old tests still need it, then delete it in the final cleanup.

Tests:

- `tests/apply.test.ts`
  - add source + claim in one atomic batch
  - `$source` named reference in claim evidence
  - `$op0` reference
  - forward reference rejected
  - explicit `atomic: false` rejected
  - generated IDs
  - provided IDs preserved
  - collision retry
  - validation failure appends no rows
  - lock contention returns exit code `6`
  - lifecycle ops create `change` rows
  - scope derivation from target rows

Stage exit condition: agents can write many changes in one atomic call.

### Milestone 7: Implement Deterministic Query And Get

Goal: replace prototype `queryRows` with a true retrieval module over effective state.

New file:

```text
src/core/query.ts
```

The query module owns deterministic retrieval over `EffectiveState`.

Query behavior:

1. Filter by:
   - collection
   - subject
   - tag
   - kind
   - time fields
   - active/history mode
2. Search exact IDs first.
3. Search exact `identity.claim_key` second.
4. Search normalized text fields:
   - `claim.statement`
   - `source.title`
   - `question.text`
   - `synthesis.title`
   - `synthesis.summary`
5. Score deterministically.
6. Return compact rows unless `full` is requested.

Do not use `JSON.stringify(row).toLowerCase().includes(text)` as the main search path. It is useful as a temporary fallback but too noisy for agent-facing retrieval.

Add `get` to the facade and CLI:

```text
knb get <id> [--history] [--explain] [--json]
```

It uses `EffectiveState.get`.

Tests:

- `tests/query.test.ts`
  - exact ID match
  - claim-key match
  - text match against normalized fields
  - filters
  - active versus history
  - compact versus full output
- `tests/get.test.ts`
  - active row
  - inactive row hidden unless history requested
  - explanation included with `--explain`

Stage exit condition: `query` and `get` no longer inspect raw ledger rows directly.

### Milestone 8: Implement Context Packets

Goal: give agents the compact research packet the spec centers around.

New file:

```text
src/core/context.ts
```

Input:

```ts
type ContextRequest = {
  collection?: string;
  subject?: string;
  tag?: string;
  maxTokens?: number;
  includeHistory?: boolean;
};
```

Output:

```ts
type ContextResult = {
  summary: Array<CompactSynthesis>;
  key_claims: Array<CompactClaim>;
  open_questions: Array<CompactQuestion>;
  sources: Array<CompactSource>;
  warnings: string[];
  token_estimate: number;
};
```

Selection algorithm:

1. Filter effective active rows by request scope.
2. Select active syntheses by:
   - `assessment.importance`
   - recency
   - basis depth
3. Select active claims by:
   - `assessment.importance`
   - `assessment.confidence`
   - `assessment.information_depth`
   - evidence depth
   - contested status
4. Select open questions by:
   - priority
   - importance
   - recency
5. Include sources cited by selected claims and syntheses.
6. Estimate tokens deterministically, defaulting to `ceil(chars / 4)`.
7. If over budget, drop details in this order:
   - source metadata details
   - low-importance claims
   - low-priority questions
   - lower-ranked syntheses
8. Preserve warnings.

`context` should surface information gaps, contested claims, thin evidence, stale checks, and open questions. It should not only retrieve related things; it should expose where the knowledge graph is weak.

CLI:

```text
knb context --collection <collection> --max-tokens 3000 --json
```

Tests:

- `tests/context.test.ts`
  - includes syntheses, claims, questions, and cited sources
  - respects collection filter
  - respects token budget
  - drops lower-value details first
  - includes warnings

Stage exit condition: agents can cheaply orient before writing.


Goal: make "only add high-value stuff" enforceable locally and deterministically.

New file:

```text
```

CLI:

```text
```

### Milestone 10: Implement Projections, Render Metadata, And Indexes

Goal: move generated outputs behind a disposable projection module.

New file:

```text
src/core/projections.ts
```

The projection module owns:

- Markdown collection views.
- Generated indexes.
- Projection metadata.
- Freshness checks.
- Stale/missing/unknown status.

Move from `src/knb.ts`:

- `renderCollection`
- `writeRenderedCollection`
- source inclusion logic
- synthesis/claim/question/source formatting

Projection metadata:

```json
{
  "schema_version": "knb.projection.v1",
  "kind": "view",
  "target": "knb/views/example.md",
  "ledger": {
    "path": "knb/ledger.jsonl",
    "rows": 42,
    "last_row_id": "claim:example:20260501:9x8y7z6w",
    "content_hash": "sha256:..."
  },
  "options": {
    "collection": "example",
    "format": "md"
  },
  "generated_at": "2026-05-01T12:00:00Z"
}
```

Freshness rule: compare metadata ledger fingerprint to the current ledger fingerprint. Do not use file modification time as the source of truth.

`render` consumes `EffectiveState`; it does not read or validate the ledger itself.

For v1, keep indexes deterministic and simple:

- active rows by ID
- active rows by collection
- active claims by `claim_key`
- active sources by URI/content hash when present

Indexes are disposable. They are never canonical.

CLI:

```text
knb render --collection <collection> --format md --out knb/views/<collection>.md --json
knb index --rebuild --json
```

Tests:

- `tests/projections.test.ts`
  - deterministic render output
  - metadata written
  - freshness fresh/stale/missing/unknown
  - index rebuild from effective state
  - output paths stay under workspace view/index directories

Stage exit condition: generated views and indexes can be deleted and rebuilt without touching canonical knowledge.

### Milestone 11: Final CLI Cutover And Cleanup

Goal: align public behavior with the spec and remove prototype paths.

Final command set:

```text
init
status
schema
apply
add
get
query
context
render
check
index
```

Remove public commands:

```text
validate
append
```

The spec says `validate` is replaced by `check`, and `append` is replaced by `apply` plus `add`. Because this is greenfield V1, do not preserve compatibility aliases unless a later compatibility decision overrides that.

Update files:

- `README.md`
  - replace `validate` / `append` examples
  - document `status`, `schema`, `apply`, `add`, `context`, `check`
- `AGENTS.md`
  - update agent loop
  - remove old command examples
- `knb/README.md`
  - same command refresh
- `package.json`
  - add package export:

```json
{
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Remove or rewrite:

- Delete `src/knb.ts`, or reduce it to a temporary internal wrapper only if there is a compelling test migration reason.
- Final code should not import broad helpers from `src/knb.ts`.
- Tests should import from public facade or specific core modules, depending on what they are testing.

Final test flow:

```text
```

Run it against a temporary workspace.

## 4. File-By-File Impact

### `src/cli.ts`

Current role: parses flags, opens ledger path, directly calls `loadLedger`, `validateLedger`, `appendRow`, `queryRows`, and `writeRenderedCollection`, then prints directly.

Final role:

```text
parse args -> openKnb -> call facade method -> output.render
```

Changes:

- Remove direct imports from `src/knb.ts`.
- Import `openKnb` from `src/index.ts`.
- Import output/error helpers from `src/core/output.ts`.
- Add command handlers for target command set.
- Remove final public support for `validate` and `append`.

### `src/knb.ts`

Current role: monolithic prototype helper.

Final role: none, ideally deleted.

Migration use: temporarily keep as a wrapper while moving behavior:

- validation -> `contract.ts`
- ledger load/write -> `ledger.ts`
- state -> `state.ts`
- query -> `query.ts`
- render -> `projections.ts`

### `src/types.ts`

Current role: owns constants and row types.

Final role: either deleted or converted to a non-public internal re-export.

Recommended default: move type ownership into `src/core/contract.ts` or contract-owned internal type definitions. Public types should be exported through `src/index.ts`.

The spec says the contract module is the module for row contracts, operation contracts, validation, samples, and schema. Leaving public row definitions in a separate exported file risks drift.

### `src/index.ts`

Current role: missing.

Final role: package public library entry point.

Adds:

- `openKnb`
- public facade types
- request/result types

### `src/core/workspace.ts`

Current role: missing.

Final role: path/config/actor resolution.

Adds:

- `KnbWorkspace`
- `OpenKnbOptions`
- `openWorkspace`

### `src/core/ledger.ts`

Current role: missing.

Final role: canonical JSONL storage module.

Adds:

- `loadLedger`
- `withWriteTransaction`
- `LedgerSnapshot`
- `LedgerFingerprint`

Moves from `src/knb.ts`:

- `loadLedger`
- parts of `appendRow`

### `src/core/contract.ts`

Current role: missing.

Final role: row and operation contract module.

Adds/moves:

- row constants
- row types
- apply operation types
- validation
- schema object
- samples
- draft completion helpers

Moves from:

- `src/types.ts`
- validation logic in `src/knb.ts`

### `src/core/errors.ts`

Current role: missing.

Final role: typed errors and exit-code mapping.

### `src/core/output.ts`

Current role: missing.

Final role: CLI envelopes and rendering.

### `src/core/state.ts`

Current role: missing.

Final role: effective state projection.

Moves from `src/knb.ts`:

- `effectiveRows`, but expanded substantially.

### `src/core/read-snapshot.ts`

Current role: missing.

Final role: read-side packet builder.

Depends on:

- `ledger.ts`
- `contract.ts`
- `state.ts`
- `projections.ts` freshness hook

### `src/core/apply.ts`

Current role: missing.

Final role: atomic semantic write pipeline.

Depends on:

- `ledger.ts`
- `contract.ts`
- `state.ts`
- `errors.ts`

### `src/core/query.ts`

Current role: missing.

Final role: deterministic retrieval over `EffectiveState`.

Moves from `src/knb.ts`:

- `queryRows`, but replace `JSON.stringify` text search with field-aware scoring.

### `src/core/context.ts`

Current role: missing.

Final role: token-budgeted research packet construction.

Depends on:

- `state.ts`
- `query.ts` concepts, but not query as a filter wrapper
- `contract.ts` row types


Current role: missing.


Depends on:

- `state.ts`
- `contract.ts`

### `src/core/projections.ts`

Current role: missing.

Final role: generated views, indexes, metadata, and freshness.

Moves from `src/knb.ts`:

- `renderCollection`
- `writeRenderedCollection`

Depends on:

- `state.ts`
- `ledger.ts` fingerprint shape
- runtime clock from facade

### `tests/validator.test.ts`

Current role: tests prototype validator and query lifecycle hiding.

Final role: split into deeper tests:

- `contract.test.ts`
- `state.test.ts`
- `query.test.ts`
- `apply.test.ts`

Keep existing row fixtures where useful.

### `knb/schema.json`

Current role: hand-maintained schema artifact.

Final role: generated or synchronized from `contract.ts`.

Required test: a schema sync test should fail if `contract.jsonSchema()` and `knb/schema.json` diverge.

### `README.md`, `AGENTS.md`, `knb/README.md`

Current role: document prototype commands.

Final role: document V1 commands and agent loop.

Replace:

```text
validate
append
```

With:

```text
status
schema
apply
add
context
check
render
index
```

### `package.json`

Current role: has Bun scripts and CLI bin.

Final role: also exposes library entry point.

Change:

```json
"exports": {
  ".": "./src/index.ts"
}
```

Keep Bun as the package manager/runtime.

## 5. Risks And Migration Notes

### No Compatibility Aliases By Default

The design doc explicitly treats the earlier `knowbase` / `kb` shape as historical scaffolding and says not to preserve aliases unless a later compatibility decision overrides the greenfield rule. Apply that same rule to `validate` and `append`: temporary migration aliases are acceptable inside the branch, but final V1 should remove them.

### Ledger Migration Is Likely Trivial

`knb/ledger.jsonl` is currently empty, so there is no real data migration pressure. If prototype rows exist elsewhere with `kb.v1`, default behavior should be to reject them with `schema_version must be knb.v1`, matching the spec's greenfield stance.

### Atomicity Has A Crash Boundary

The ledger module can guarantee logical atomicity under normal runtime failures by validating and appending inside one lock-held transaction. It cannot perfectly guarantee crash-atomic multi-row append on every filesystem if the process dies mid-write. The recovery behavior should be: parse issues are reported by `check`, valid rows remain readable where possible, and mechanical repair is explicit.



- If the duplicate has exactly one active canonical match, resolve the batch reference to that existing row.
- If it has zero or multiple matches, fail the batch with `duplicate_blocked`.

That keeps agents from accidentally creating dangling syntheses or relations.

### Do Not Add Embeddings Yet


## 6. Open Questions With Recommended Defaults

### 1. Should `identity.claim_key` Be Required For Every Claim?


Requiring `claim_key` too early may make agents invent bad keys. Better to support strong keys without forcing low-quality ones.



This avoids opaque mutations to user-provided claim identity.


Recommended default: warn but do not block duplicate source URI/content hash in v1.


### 4. Should `patch` Change Rows Mutate Effective Rows?

Recommended default: no. In v1, `patch` records mechanical repair history and explanation data, but `EffectiveState` should not apply JSON patches to mutate row content.

That preserves the rule that knowledge rows remain immutable.

### 5. Should Old Public Commands Remain?

Recommended default: no. During migration, `validate` can temporarily call `check` and `append` can temporarily call `add`, but final V1 should remove them.

### 6. Should The Schema Be Generated Or Hand-Maintained?

Recommended default: contract-owned schema object first, generation later. Add a test that requires `knb/schema.json` to match the contract's schema object.

That gives drift protection without introducing a schema-generation dependency immediately.

### 7. Should `context` Use A Real Tokenizer?

Recommended default: no. Use a deterministic approximation such as `ceil(chars / 4)`.

This keeps v1 dependency-light and predictable for agents.

### 8. Should `read-snapshot` Build State When Validation Has Warnings?

Recommended default: yes, if there are no validation errors. Warnings should be included in the snapshot and surfaced by `status`, `check`, and `context`.

### 9. Should Forward References In Existing Ledger Rows Be Errors?

Recommended default: for `apply`, forward intra-batch references are errors. For existing ledgers, `check` should warn on temporal weirdness but only error on genuinely broken references.

This lets the system diagnose odd historical ledgers without being unnecessarily brittle.

### 10. Should `render` Write Outside `knb/views/` If `--out` Is Provided?

Recommended default: no, unless explicitly allowed later. For V1, constrain generated views and indexes to workspace-managed projection directories.

That protects agents from path traversal and keeps projections disposable.

## 7. Final Implementation Order

1. Lock current baseline with `bun test` and `bun run typecheck`.
2. Extract `contract.ts`; move row constants, types, validation, schema, and samples.
3. Add operation contract types and validation.
4. Add `errors.ts` and stable exit-code mapping.
5. Add `output.ts` and command result envelopes.
6. Add `workspace.ts`.
7. Add `ledger.ts` with fingerprints and locked transactions.
8. Add `index.ts`, `core/knb.ts`, and `openKnb`.
9. Add `read-snapshot.ts`.
10. Add `status`, `schema`, and `check`.
11. Replace `effectiveRows` with `state.ts`.
12. Add `apply.ts` and `add`.
13. Add `get`.
14. Replace prototype query with `query.ts`.
15. Add `context.ts`.
17. Add `projections.ts`, render metadata, freshness checks, and indexes.
18. Cut over CLI fully.
19. Remove `validate`, `append`, and broad helper usage from `src/knb.ts`.
20. Update docs and package exports.
21. Add the full agent-loop facade test.
