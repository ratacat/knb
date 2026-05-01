# knb Agent-First CLI Design

`knb` is a small CLI-first package with a library underneath. Agents use the `knb` command. Host applications import the same core library. Both paths operate on the same append-only JSONL ledger.

## Goals

- Write many ledger changes in one atomic call.
- Retrieve compact research context in one call.
- Keep the canonical model portable, auditable, and dependency-light.
- Keep generated indexes and views disposable.
- Keep each module deep: callers learn a small interface and get a lot of behavior.

## Architecture Principles

The CLI stays thin. It parses arguments, opens a workspace, calls one library method, and sends the result through the output module.

The library owns correctness. Write ordering, current-state projection, row contracts, output envelopes, and token-budgeted context all sit behind deep modules. Callers should not reassemble these rules from helper functions.

The module interface is the test surface. Tests should exercise the same seams that the CLI and host applications use.

Do not add new CLI commands directly on top of prototype helpers. Establish the workspace, output, contract, ledger, and state seams first, then route commands through the public library.

## Module Depth Standard

A module earns an external seam when deleting it would push its rules into multiple callers. If deleting a module removes complexity instead of concentrating it, the module was shallow and should be folded into its caller.

V1 should have these external seams:

- `Knb` facade: the public library interface used by the CLI and host applications.
- Workspace module: path, config, and actor resolution.
- Ledger module: JSONL parsing, locked write transactions, and flush behavior.
- Contract module: row contracts, operation contracts, validation, samples, and JSON Schema.
- State module: deterministic projection from raw rows to current state.
- Read snapshot module: one read-side packet that combines ledger, validation, state, and projection freshness.
- Apply module: semantic write pipeline from operations to appendable rows.
- Query module: deterministic retrieval over effective state.
- Context module: token-budgeted research packet construction over effective state.
- Novelty module: deterministic claim comparison shared by `novelty` and `apply --dedupe`.
- Projection module: generated views, generated indexes, and freshness metadata.
- Output and error modules: CLI rendering, envelopes, and exit-code mapping.

`check` is a library capability. Give it a separate module only when its interface hides enough behavior to pass the deletion test. Until then, keep the behavior behind the `Knb` facade and reuse the deeper modules.

Internal seams are allowed inside a deep module for its own tests. Do not export an internal seam until two real callers or adapters need it.

## Storage

```text
.knb/
  config.json

knb/
  ledger.jsonl
  schema.json
  indexes/
  views/
```

Only `knb/ledger.jsonl` is canonical. `knb/indexes/` and `knb/views/` are projections and can be rebuilt.

## Workspace Module

The workspace module is the first seam every command crosses. It resolves where the `knb` workspace lives and who is acting.

Interface responsibilities:

- Resolve `--root`, `--config`, and `--ledger`.
- Resolve config in this order:

  ```text
  --config
  KNB_CONFIG
  .knb/config.json
  current directory fallback
  ```

- Normalize ledger, schema, index, view, and lock paths.
- Resolve the actor from `--actor`, `KNB_ACTOR`, Git user/email, system username, then `"unknown"`.
- Return one opened workspace object used by all commands.

The CLI and library should not duplicate path or actor logic. A command that needs the ledger asks the workspace for it.

## Runtime Inputs

Keep runtime variability explicit and small. V1 needs deterministic adapters for time and ID randomness because tests and reproducible agent runs need them. It does not need a storage adapter until a second real storage implementation exists.

Runtime inputs:

```ts
type KnbRuntime = {
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
};
```

Production uses system time and cryptographic randomness. Tests can pass deterministic adapters through `openKnb`. Core modules receive these inputs from the `Knb` facade; they do not call `new Date()` or random functions directly.

## Ledger Module

The ledger module owns file-system correctness. It is the only module that reads or writes `knb/ledger.jsonl` directly.

Interface responsibilities:

- Load JSONL defensively and preserve line numbers.
- Return parse issues without hiding valid later rows.
- Return a ledger fingerprint for loaded snapshots.
- Create storage directories when writing.
- Acquire and release `.knb/ledger.lock` for write transactions.
- Fail fast with exit code 6 when the lock is busy.
- Run read and append in one locked write transaction.
- Flush file and directory writes before reporting success.
- Report bytes written, rows read, rows appended, and ledger path metadata.

Callers do not use `readFile`, `appendFile`, or `writeFile` against the ledger. If apply, check, query, and render each need to know lock or JSONL details, the ledger module is too shallow.

Write transaction interface:

```ts
type LedgerWriteTransaction<T> = (snapshot: LedgerSnapshot) => Promise<LedgerAppendPlan<T>>;

type LedgerAppendPlan<T> = {
  rows: KnbRow[];
  result: T;
};
```

Snapshot metadata:

```ts
type LedgerFingerprint = {
  path: string;
  rows: number;
  bytes: number;
  last_row_id?: string;
  content_hash: string;
};
```

The ledger module computes the fingerprint from canonical ledger bytes. Projection freshness, status summaries, and check diagnostics use this fingerprint instead of recomputing their own ledger identity.

Atomic write semantics:

1. Acquire the lock with exclusive create.
2. Load and parse the current ledger while holding the lock.
3. Pass the locked snapshot to the caller callback.
4. Receive rows to append and the caller result.
5. Serialize rows to JSONL inside the ledger module.
6. Open the ledger for append, write the complete batch, and flush the file.
7. Release the file handle.
8. Flush the ledger directory when the runtime exposes directory fsync.
9. Release the lock in a `finally` path.
10. Return the caller result plus ledger metadata.

The ledger module does not validate row meaning. It guarantees that read, validation by the caller, and append by the ledger share one locked snapshot. Either the requested batch is appended as supplied by the callback, or the caller receives an error and no rows append.

## Migration From Current Prototype

The pre-rename prototype was named `knowbase`, exposed `knowbase` and `kb` CLI bins, stored canonical data under `kb/`, used `.kb/` for config and locks, exposed `kb.v1` as the schema version, and backed `validate`, `append`, `query`, and `render` with a broad `src/kb.ts` helper module. Treat that shape as historical scaffolding, not the target architecture.

V1 uses `knb` as the product name, package name, CLI command, storage namespace, and schema namespace. Do not keep compatibility aliases for `knowbase` or `kb` unless a later compatibility decision explicitly overrides the greenfield rule.

Prototype-to-V1 naming map:

```text
knowbase package             -> knb package
knowbase CLI bin             -> knb CLI bin
kb CLI bin                   -> knb CLI bin
bun run kb --                -> bun run knb --
.kb/config.json              -> .knb/config.json
.kb/ledger.lock              -> .knb/ledger.lock
kb/ledger.jsonl              -> knb/ledger.jsonl
kb/schema.json               -> knb/schema.json
kb/indexes/                  -> knb/indexes/
kb/views/                    -> knb/views/
kb.v1                        -> knb.v1
kb.projection.v1             -> knb.projection.v1
src/kb.ts                    -> src/core/knb.ts plus deeper core modules
scripts/kb/*                 -> remove or fold behind knb CLI/library tests
KB_SCHEMA_VERSION            -> KNB_SCHEMA_VERSION
KB*, openKB                  -> Knb*, openKnb
```

Naming rules for V1:

- Use lowercase `knb` for package names, command examples, file paths, schema namespaces, and prose that names the project.
- Use PascalCase `Knb` for exported TypeScript symbols: `Knb`, `KnbRow`, `KnbWorkspace`, `KnbRuntime`, `KnbStatus`, and `openKnb`.
- Prefer neutral module names for domain responsibilities: `ledger`, `contract`, `state`, `apply`, `query`, `context`, `novelty`, `projections`, `output`, and `errors`.
- Do not use `KB` as a shorthand in new code or outside migration notes. It is too generic and now conflicts with the project name.

Migration rules:

- Replace broad helper functions with deep modules under `src/core/`.
- Move row loading and JSONL parsing into `core/ledger.ts`.
- Move row and operation validation into `core/contract.ts`.
- Move current-state projection into `core/state.ts`.
- Build `apply` as a new write pipeline. Do not extend single-row append into the primary writer.
- Replace `validate` with `check`.
- Replace `append` with `apply` plus `add`.
- Remove package-level `validate`, `append`, and `render` script entry points once their behavior is behind `knb`.
- Keep no compatibility aliases unless a separate compatibility decision says otherwise.
- Keep generated `knb/schema.json` synchronized with the contract module until schema generation exists.

## Row Model

The canonical row kinds are:

- `source`: an information artifact.
- `claim`: an atomic proposition.
- `question`: unresolved uncertainty.
- `synthesis`: readable interpretation.
- `change`: an operational event that changes effective state.

Every canonical row in V1 uses `schema_version: "knb.v1"`. The current prototype's `kb.v1` schema string should be replaced during the V1 cutover, not preserved as an alias.

Knowledge rows remain immutable. Current state is a deterministic projection over ledger order.

`relations` express semantic links between knowledge rows. They do not retract, supersede, or merge rows. Lifecycle changes belong in `change` rows.

## Change Rows

Use `change` rows for operational history:

- `retract`: mark target rows ineffective.
- `supersede`: mark target rows ineffective in favor of a replacement row.
- `merge`: mark target rows as duplicates of a canonical row.
- `relate`: add relation state without rewriting rows.
- `patch`: record a mechanical repair without rewriting the target row.

Physical in-place repair is reserved for broken JSONL, invalid IDs, or other mechanical corruption that prevents the ledger from loading.

## Apply Pipeline Module

`knb apply` is the primary write interface. It should be one deep module, not a command that coordinates many shallow helpers.

The apply operation contract must exist before the write pipeline. The CLI, schema command, tests, and host applications all use the same operation types.

Base request shape:

```ts
type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true; // v1 supports only atomic writes
  dedupe?: boolean; // default false
  actor?: string;
  now?: string;
};
```

Base operation shapes:

```ts
type ApplyOperation =
  | { op: "add"; row: DraftRow; as?: string }
  | { op: "retract"; target_ids: Ref[]; reason: string; scope?: Scope; as?: string }
  | { op: "supersede"; target_ids: Ref[]; replacement_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "merge"; target_ids: Ref[]; canonical_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "relate"; from_id: Ref; to_id: Ref; rel: RelationType; strength?: "low" | "medium" | "high"; rationale?: string; scope?: Scope; as?: string }
  | { op: "patch"; target_id: Ref; patch: Array<Record<string, unknown>>; reason: string; scope?: Scope; as?: string };

type DraftRow = Omit<Partial<KnbRow>, "schema_version" | "created_at" | "created_by"> & {
  id?: string;
  kind: KnbRowKind;
  scope: Scope;
};

type Ref = string; // existing row ID, "$op<N>", or "$<as>"
```

`op: "add"` appends the supplied row after filling missing common fields. Lifecycle operations append `change` rows. If a lifecycle operation omits `scope`, apply derives it from the referenced target rows; validation fails if no anchored scope can be derived. The `as` field gives an operation a stable intra-batch reference. `$op0` also refers to the row created by operation index 0.

Intra-batch references are left-to-right only. A reference may target an existing row, a prior `$op<N>`, or a prior named `$<as>`. Forward references are validation errors.

`atomic: false` is not a v1 fallback mode. If a request explicitly asks for non-atomic writes, return `unsafe_operation_refused`.

Example:

```json
{
  "operations": [
    {
      "op": "add",
      "as": "source",
      "row": {
        "kind": "source",
        "scope": { "collections": ["example"] },
        "source": {
          "type": "web_page",
          "title": "Example",
          "uri": "https://example.com"
        },
        "provenance": {
          "acquisition": { "method": "manual" }
        }
      }
    },
    {
      "op": "add",
      "row": {
        "kind": "claim",
        "scope": { "collections": ["example"] },
        "identity": { "claim_key": "example|exists" },
        "claim": {
          "statement": "Example exists.",
          "atomic": true
        },
        "time": { "precision": "unknown" },
        "provenance": {
          "evidence": [
            {
              "source_id": "$source",
              "role": "supports",
              "summary": "The source exists."
            }
          ]
        },
        "assessment": { "confidence": "high" }
      }
    }
  ]
}
```

Interface responsibilities:

- Accept an `ApplyRequest`.
- Open a ledger write transaction.
- Validate all operations against the locked snapshot.
- Resolve intra-batch references such as `$op0`.
- Complete draft rows through the contract module using actor, time, and ID allocator inputs.
- Build all change rows for lifecycle operations.
- Run novelty and dedupe checks when requested.
- Validate the complete candidate ledger.
- Return rows to append through the ledger transaction.
- Tell the projection module to rebuild eager indexes after a successful write when configured.
- Return an `ApplyResult` with created IDs, skipped operations, warnings, and novelty classifications.

`knb apply` is atomic by default. If any operation fails inside the write transaction, no operation writes. Apply must not validate against one ledger snapshot and append against another.

Result shape:

```ts
type ApplyResult = {
  created: Array<{ op: number; as?: string; id: string; kind: KnbRowKind }>;
  skipped: Array<{ op: number; reason: string }>;
  warnings: string[];
  novelty: Array<{ op: number; classification: string; matched_ids: string[] }>;
};
```

Single-row append is a convenience wrapper:

```text
knb add --kind claim ...
```

`knb add` builds a one-operation `ApplyRequest` and calls the same apply module. It must not have its own validation or write path.

Lock behavior:

```text
0  write completed
6  lock busy
```

The ledger module may support `--wait-lock <ms>` later, but the base behavior should fail fast.

## Row Identity

Apply generates IDs for draft rows that omit `id`. Provided IDs are preserved after validation.

Generated IDs use this shape:

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

`scope-slug` comes from the first collection, subject, or tag in that order. If the scope cannot provide a slug, validation fails before ID generation. `random8` is lowercase base36. If a generated ID collides with the current ledger or the candidate batch, apply retries before failing with a conflict.

## Effective State Module

The effective state module is the read-side projection. `get`, `query`, `context`, `render`, `check`, and `index` should all use it.

Projection algorithm:

1. Read rows in ledger order.
2. Build an ID map.
3. Initialize each valid row as `active`.
4. Mark rows with intrinsic archived status as `archived`.
5. Apply `change` rows in order.
6. Mark retracted, superseded, and merged rows inactive.
7. Add relation changes to the effective relation graph.
8. Preserve enough history to explain why a row is inactive.

Effective statuses:

```text
active
retracted
superseded
duplicate
archived
invalid
```

Interface responsibilities:

- Return active rows by default.
- Return inactive rows only when asked for history.
- Return the effective status for any row ID.
- Return explanation data for `get --explain`.
- Return the effective relation graph.
- Return projection warnings for invalid, dangling, or contradictory change rows.

Suggested interface:

```ts
type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(options?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  explain(id: string): StateExplanation | undefined;
  relationGraph(): RelationGraph;
  warnings: StateWarning[];
};
```

The raw row is not the current state. Current state is the row plus later `change` rows.

Normal reads hide `change` rows unless the caller requests history or explicitly asks for `kind=change`. Operational rows remain queryable for audit.

## Read Snapshot Module

The read snapshot module is the read-side counterpart to apply. It concentrates the load, validate, project, and freshness sequence that many commands need.

Interface responsibilities:

- Load the ledger through the ledger module.
- Validate rows through the contract module.
- Build effective state through the state module only when contract validation has no errors.
- Collect projection freshness through the projection module.
- Return partial results when the ledger has parse or validation errors.
- Expose one `KnbReadSnapshot` for `status`, `check`, `get`, `query`, `context`, `render`, and `index`.

Suggested interface:

```ts
type KnbReadSnapshot = {
  ledger: LedgerSnapshot;
  fingerprint: LedgerFingerprint;
  validation: ValidationResult;
  state?: EffectiveState;
  projectionFreshness: ProjectionFreshness;
};
```

Callers should not independently repeat ledger loading, validation, state projection, or freshness checks. If a read command needs one of those details, it asks the read snapshot.

Snapshot validity levels:

```text
loaded      ledger bytes were read, but parse or validation errors may exist
validated   ledger parsed and contract validation had no errors
projected   effective state was built from a validated ledger
```

`status` and `check` may use a `loaded` snapshot. `get`, `query`, `context`, `render`, and `index` require `projected`; if the snapshot cannot project, they fail with `validation_failed` or `broken_reference`. Status fields derived from effective state should be `unknown` when the snapshot is not projected.

## Contract Module

Agents need `knb schema` to learn the contract without reading docs. That only works if TypeScript types, JSON Schema, examples, samples, and validation stay in one contract.

The contract module should be the single seam for row and operation contracts.

Interface responsibilities:

- Export row-kind and operation-kind lists.
- Validate row shapes and operation batch shapes.
- Validate cross-row references against supplied row maps.
- Complete draft rows with supplied actor, clock, and ID-generator inputs.
- Return normalized rows and operations without mutating caller input.
- Produce JSON Schema.
- Produce row samples.
- Produce apply-operation samples.
- Explain validation errors with stable paths.

Source of truth:

Use TypeScript constants and validator rules as the source of truth for v1. Generate or update `knb/schema.json` from that contract once the module exists. Until then, code changes must update TypeScript, validator behavior, tests, and `knb/schema.json` together.

After `core/contract.ts` exists, do not hand-edit `knb/schema.json`. Update the contract and regenerate the schema.

The contract module must not read files, inspect the workspace, choose clocks, or allocate randomness itself. Apply supplies actor, time, ID-generator inputs, and row maps; contract applies the row rules.

## CLI Surface

The base command set is:

```text
init       create config and storage
status     print a compact state summary
schema     print row and operation contracts
apply      apply many append/change operations
add        convenience wrapper for one row
get        fetch rows by ID
query      retrieve matching rows
context    build a compact research packet
novelty    classify candidate claims
render     generate disposable views
check      validate ledger health
index      rebuild or inspect generated indexes
```

The primary write command is `knb apply`. The primary read command is `knb context`.

V1 command cutover:

```text
validate  replaced by check
append    replaced by apply and add
```

`query` and `render` remain, but they must call the public library and use effective state. `render --json` reports render metadata; it does not print human text in JSON mode.

Agents should be able to run this loop:

```bash
knb status --json
knb context --collection <collection> --max-tokens 3000 --json
knb novelty --stdin --json < candidate-claims.json
knb apply --stdin --atomic --dedupe --json < ops.json
knb check --json
knb render --collection <collection> --format md --out knb/views/<collection>.md --json
```

## Status Capability

`knb status` gives agents a cheap orientation packet before they spend tokens on context or writes. It should summarize the read snapshot.

Default status fields:

```text
workspace_root
ledger_path
schema_version
actor
row_count
parse_error_count
validation_error_count
state_warning_count
active_counts_by_kind
inactive_counts_by_status
projection_freshness
```

Status should avoid returning full rows. If the ledger is broken, status still returns the workspace and ledger metadata it can compute, plus typed errors for the output module to render.

## Check Capability

`knb check` is the health command for the ledger. It should inspect the read snapshot rather than owning separate validation rules.

It reports:

- JSONL parse issues with line numbers.
- Row contract violations with stable paths.
- Duplicate IDs.
- Broken source, basis, relation, and change references.
- Projection warnings from effective state.
- Generated-view and generated-index staleness.

`check` returns success only when the ledger can be loaded, validated, and projected without errors. Warnings may still return success unless the caller sets a stricter mode later.

## Output And Error Module

Commands should return structured command results. They should not print directly.

The error module owns stable error codes and maps domain failures to exit codes. Core modules must return or throw typed errors; the CLI must not inspect message text.

Core error shape:

```ts
type KnbError = {
  code: KnbErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};
```

Examples:

```text
invalid_arguments
validation_failed
duplicate_blocked
lock_busy
io_failed
broken_reference
unsafe_operation_refused
internal_error
```

The output and error module owns:

- TTY detection.
- `--json`, `--text`, `--pretty`, `--ndjson`, and `--quiet`.
- stdout versus stderr behavior.
- Success envelopes.
- Error envelopes.
- Exit-code mapping.
- Human text rendering.

TTY output defaults to human text. Piped output defaults to compact JSON.

Every command returns a `CommandResult` to the CLI adapter. Only the output module writes to stdout or stderr.

Library methods return domain results such as `ApplyResult`, `QueryResult`, and `ContextResult`. They do not return `CommandResult` and do not know whether the caller is a TTY.

```ts
type CommandResult<T = unknown> = {
  ok: true;
  command: string;
  data: T;
  meta: CommandMeta;
} | {
  ok: false;
  command?: string;
  error: CommandError;
  meta: CommandMeta & { exit_code: number };
};
```

Success envelope:

```json
{
  "ok": true,
  "command": "query",
  "data": {},
  "meta": {
    "ledger": "knb/ledger.jsonl",
    "elapsed_ms": 18,
    "rows_read": 1284
  }
}
```

Error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "claim rows require provenance.evidence[].source_id",
    "details": {
      "path": "ops[2].row.provenance.evidence"
    }
  },
  "meta": {
    "exit_code": 3
  }
}
```

Exit codes:

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

## Query And Context Modules

`query` and `context` share data, but they do different jobs.

Both modules accept `EffectiveState` from the read snapshot as input. They do not load ledgers, validate row contracts, or apply lifecycle changes themselves.

The query module returns matching rows. It should:

1. Filter by collection, subject, tag, kind, and time.
2. Search exact IDs and claim keys first.
3. Search normalized text fields:
   - `claim.statement`
   - `source.title`
   - `question.text`
   - `synthesis.title`
   - `synthesis.summary`
4. Score with deterministic lexical matching.
5. Return compact rows unless `--full` is set.

The context module builds a research packet. It should:

1. Read effective state.
2. Select active syntheses by importance.
3. Select active claims by importance, confidence, and evidence depth.
4. Include open questions.
5. Include sources cited by selected rows.
6. Respect `--max-tokens` by dropping lower-value details first.

`context` is not filtered `query`. It is a briefing module with its own interface and tests.

Default `query` fields:

```text
id
kind
score
statement/title/text
confidence
source_ids
time.valid_at or time.occurred_at
```

Default `context` fields:

```text
summary
key_claims
open_questions
sources
warnings
token_estimate
```

## Novelty Module

The novelty module provides deterministic claim comparison. It is shared by the `novelty` command and `apply --dedupe`; callers should not implement their own dedupe checks.

Interface responsibilities:

- Accept candidate claim drafts or completed claim rows.
- Compare against active claims from `EffectiveState`.
- Match exact `identity.claim_key` first.
- Match exact `identity.dedupe_hash` second.
- Compare normalized claim statements lexically.
- Classify candidates as `new`, `duplicate`, `corroboration`, `update`, `contradiction`, or `correction`.
- Return matched row IDs and reasons for each classification.

The novelty module is deterministic and local. It does not use embeddings, network calls, LLM calls, or semantic search in v1. `contradiction` and `correction` require explicit structured signals, such as matching claim keys plus candidate metadata, evidence roles, or relation data. The module should classify conservatively when structured signals are absent.

## Projection Module

The projection module owns disposable outputs derived from effective state. It is the seam behind `render`, `index`, status freshness, and check freshness warnings.

Interface responsibilities:

- Render collection views from `EffectiveState`.
- Rebuild generated indexes from `EffectiveState`.
- Write only under workspace view and index paths.
- Record disposable projection metadata.
- Compare projection metadata with the current ledger fingerprint.
- Report fresh, stale, missing, and unknown projection states.

Projection metadata lives with generated outputs, not in the canonical ledger. It can be deleted and rebuilt.

Suggested metadata shape:

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

Use `LedgerFingerprint` for freshness checks. File mtimes can be displayed as diagnostics, but they are not the source of truth. Apply does not need to mark existing projections stale; a new ledger fingerprint makes old projection metadata stale automatically.

## Library Seam

The CLI wraps a reusable TypeScript library.

The package should expose the library entry point explicitly. Host applications should not import from command modules or internal file paths.

Suggested package shape:

```json
{
  "name": "knb",
  "bin": {
    "knb": "./src/cli.ts"
  },
  "scripts": {
    "knb": "bun run src/cli.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Suggested structure:

```text
src/
  cli.ts
  index.ts
  core/
    knb.ts
    workspace.ts
    ledger.ts
    contract.ts
    apply.ts
    state.ts
    read-snapshot.ts
    query.ts
    context.ts
    novelty.ts
    projections.ts
    output.ts
    errors.ts
```

Do not add pass-through files only to match this tree. The tree names the intended seams; the deletion test decides whether a file should exist.

Public library shape:

```ts
function openKnb(options?: OpenKnbOptions): Promise<Knb>;

type OpenKnbOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  actor?: string;
  runtime?: Partial<KnbRuntime>;
};

type Knb = {
  workspace: KnbWorkspace;
  status(): Promise<KnbStatus>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  get(ids: string[], options?: GetOptions): Promise<GetResult>;
  query(request: QueryRequest): Promise<QueryResult>;
  context(request: ContextRequest): Promise<ContextResult>;
  novelty(request: NoveltyRequest): Promise<NoveltyResult>;
  render(request: RenderRequest): Promise<RenderResult>;
  check(request?: CheckRequest): Promise<CheckResult>;
  rebuildIndex(): Promise<IndexResult>;
};
```

The `Knb` facade composes workspace, ledger, contract, state, read snapshot, apply, query, context, projection, and output-independent result mapping. CLI command handlers and host applications call the facade instead of importing core modules directly.

The CLI adapter should be boring:

```text
parse args -> open workspace -> call library -> render command result
```

## Testing Strategy

Test through module interfaces:

- Workspace tests cover config precedence, path normalization, and actor resolution.
- Contract tests cover row samples, operation samples, JSON Schema, and validation errors.
- Ledger tests cover defensive JSONL loading, line-numbered parse errors, locked write transactions, and flush behavior.
- Apply tests cover atomic writes, lock contention, intra-batch references, dedupe, and failed validation.
- Effective state tests cover retraction, supersession, merge, relation changes, and explanations.
- Read snapshot tests cover partial snapshots, validation summaries, effective state inclusion, and projection freshness.
- Novelty tests cover claim-key matches, dedupe-hash matches, normalized statement matches, and dedupe blocking.
- Projection tests cover deterministic render output, index rebuilds, metadata, and stale detection.
- Output tests cover JSON envelopes, human text, stderr, and exit codes.
- Context tests cover ranking, source inclusion, and token-budget truncation.
- Facade tests cover the same flow agents use: `status`, `context`, `apply`, `check`, and `render` against a temporary workspace.

Avoid tests that pin private helper behavior. If a helper needs direct tests, first ask whether it is a real module seam or only an internal implementation detail.

## Implementation Order

1. Define row schemas for `source`, `claim`, `question`, `synthesis`, and `change`.
2. Define the apply operation contract.
3. Add the workspace module.
4. Add the output and error module.
5. Move JSONL loading and writing into a defensive ledger module with locked write transactions.
6. Add the contract module.
7. Add the public `openKnb` facade and package export.
8. Deepen effective state projection around `change` rows.
9. Add projection metadata and stale detection.
10. Add the read snapshot module.
11. Add `init`, `status`, and `schema`.
12. Add `check` as the validation and health command.
13. Add the apply pipeline on top of ledger write transactions, auto IDs, intra-batch references, and atomic writes.
14. Replace `append` with `apply` and `add`.
15. Add `get` and replace `query` internals with the query module.
16. Add `context` as a separate research-packet module.
17. Add deterministic novelty checks.
18. Add deterministic rendering and disposable indexes through the projection module.

## Deferred Features

Keep these out of v1:

- `knb serve --stdio`
- semantic search
- source extraction
- synthesis generation
- source fetch/cache
- domain packs
- git-aware writes
- hooks
- web dashboard
- source intelligence plugins
