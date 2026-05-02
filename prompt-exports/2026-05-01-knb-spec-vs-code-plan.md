<file_map>
/Users/jaredsmith/Projects-ultra/knb
├── docs
│   └── design
│       └── agent-first-cli.md *
├── knb
│   ├── indexes
│   │   └── .gitkeep
│   ├── views
│   │   └── .gitkeep
│   ├── README.md *
│   ├── ledger.jsonl *
│   └── schema.json *
├── src
│   ├── cli.ts * +
│   ├── knb.ts * +
│   └── types.ts * +
├── tests
│   └── validator.test.ts * +
├── AGENTS.md *
├── README.md *
├── package.json *
├── tsconfig.json *
├── .gitignore
└── bun.lock


(* denotes selected files)
(+ denotes code-map available)
</file_map>
<file_contents>
File: /Users/jaredsmith/Projects-ultra/knb/docs/design/agent-first-cli.md
```md
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

```

File: /Users/jaredsmith/Projects-ultra/knb/knb/ledger.jsonl
```jsonl


```

File: /Users/jaredsmith/Projects-ultra/knb/src/cli.ts
```ts
import {
  DEFAULT_LEDGER_PATH,
  appendRow,
  loadLedger,
  queryRows,
  readJsonInput,
  validateLedger,
  writeRenderedCollection,
  type ValidationResult,
} from "./knb";

type FlagMap = Map<string, string | boolean>;

export async function runCli(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  const flags = parseFlags(rest);
  const ledgerPath = stringFlag(flags, "ledger") ?? DEFAULT_LEDGER_PATH;

  try {
    if (!command || command === "help" || command === "--help" || command === "-h") {
      printHelp();
      return 0;
    }

    if (command === "validate") {
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      printValidation(result);
      return result.ok ? 0 : 1;
    }

    if (command === "append") {
      const row = await readJsonInput({
        file: stringFlag(flags, "file"),
        json: stringFlag(flags, "json"),
      });
      const id = typeof row === "object" && row !== null && "id" in row ? String((row as { id: unknown }).id) : "(unknown)";
      const result = await appendRow(ledgerPath, row);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      console.log(`Appended ${id} to ${ledgerPath}`);
      return 0;
    }

    if (command === "query") {
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      const rows = queryRows(ledger.rows, {
        kind: stringFlag(flags, "kind"),
        collection: stringFlag(flags, "collection"),
        subject: stringFlag(flags, "subject"),
        tag: stringFlag(flags, "tag"),
        text: stringFlag(flags, "text"),
        includeHistory: booleanFlag(flags, "history"),
      });

      if (booleanFlag(flags, "json")) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        for (const row of rows) {
          console.log(`${row.id}\t${row.kind}\t${displayText(row)}`);
        }
      }
      return 0;
    }

    if (command === "render") {
      const collection = stringFlag(flags, "collection");
      if (!collection) {
        console.error("Missing required flag: --collection");
        return 1;
      }
      const out = stringFlag(flags, "out") ?? `knb/views/${collection}.md`;
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      await writeRenderedCollection(out, ledger.rows, collection);
      console.log(`Rendered ${collection} to ${out}`);
      return 0;
    }

    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseFlags(args: string[]): FlagMap {
  const flags: FlagMap = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) continue;

    const equalsIndex = arg.indexOf("=");
    if (equalsIndex > -1) {
      flags.set(arg.slice(2, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }
  return flags;
}

function stringFlag(flags: FlagMap, key: string): string | undefined {
  const value = flags.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanFlag(flags: FlagMap, key: string): boolean {
  return flags.get(key) === true;
}

function printValidation(result: ValidationResult): void {
  if (result.issues.length === 0) {
    console.log("OK");
    return;
  }

  for (const issue of result.issues) {
    const where = [issue.line ? `line ${issue.line}` : undefined, issue.id].filter(Boolean).join(" ");
    const prefix = where ? `${issue.level.toUpperCase()} ${where}:` : `${issue.level.toUpperCase()}:`;
    const output = `${prefix} ${issue.message}`;
    if (issue.level === "error") console.error(output);
    else console.warn(output);
  }

  if (result.ok) console.log("OK");
}

function displayText(row: { kind: string; source?: { title?: string }; claim?: { statement?: string }; question?: { text?: string }; synthesis?: { title?: string } }): string {
  if (row.kind === "source") return row.source?.title ?? "";
  if (row.kind === "claim") return row.claim?.statement ?? "";
  if (row.kind === "question") return row.question?.text ?? "";
  if (row.kind === "synthesis") return row.synthesis?.title ?? "";
  return "";
}

function printHelp(): void {
  console.log(`knb

Usage:
  bun run knb -- validate [--ledger knb/ledger.jsonl]
  bun run knb -- append (--file row.json | --json '{"schema_version":"knb.v1",...}') [--ledger knb/ledger.jsonl]
  bun run knb -- query [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--json] [--history]
  bun run knb -- render --collection topic [--out knb/views/topic.md] [--ledger knb/ledger.jsonl]

Commands:
  validate  Check JSONL syntax, row shapes, duplicate IDs, source refs, relation targets, and synthesis basis refs.
  append    Validate the existing ledger plus one candidate row, then append the row.
  query     Return active knowledge rows matching filters. Use --history to include rows made inactive by change rows.
  render    Generate a Markdown view for one collection.
`);
}

if (import.meta.main) {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}

```

File: /Users/jaredsmith/Projects-ultra/knb/knb/schema.json
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "knb.v1",
  "title": "General Knowledge Base JSONL Row",
  "type": "object",
  "required": ["schema_version", "id", "kind", "created_at", "created_by", "scope"],
  "properties": {
    "schema_version": { "const": "knb.v1" },
    "id": { "type": "string", "minLength": 1 },
    "kind": { "enum": ["source", "claim", "question", "synthesis", "change"] },
    "created_at": { "type": "string" },
    "created_by": { "type": "string" },
    "scope": { "$ref": "#/$defs/scope" },
    "external_refs": {
      "type": "array",
      "items": { "$ref": "#/$defs/external_ref" }
    },
    "identity": { "$ref": "#/$defs/identity" },
    "source": { "$ref": "#/$defs/source" },
    "claim": { "$ref": "#/$defs/claim" },
    "question": { "$ref": "#/$defs/question" },
    "synthesis": { "$ref": "#/$defs/synthesis" },
    "change": { "$ref": "#/$defs/change" },
    "time": { "$ref": "#/$defs/time" },
    "provenance": { "$ref": "#/$defs/provenance" },
    "assessment": { "$ref": "#/$defs/assessment" },
    "relations": {
      "type": "array",
      "items": { "$ref": "#/$defs/relation" }
    }
  },
  "allOf": [
    {
      "if": { "properties": { "kind": { "const": "source" } } },
      "then": { "required": ["source", "provenance"] }
    },
    {
      "if": { "properties": { "kind": { "const": "claim" } } },
      "then": {
        "required": ["identity", "claim", "time", "provenance", "assessment"],
        "properties": {
          "provenance": {
            "required": ["evidence"],
            "properties": {
              "evidence": { "minItems": 1 }
            }
          },
          "assessment": {
            "required": ["confidence"]
          }
        }
      }
    },
    {
      "if": { "properties": { "kind": { "const": "question" } } },
      "then": { "required": ["question"] }
    },
    {
      "if": { "properties": { "kind": { "const": "synthesis" } } },
      "then": { "required": ["synthesis"] }
    },
    {
      "if": { "properties": { "kind": { "const": "change" } } },
      "then": { "required": ["change"] }
    }
  ],
  "$defs": {
    "scope": {
      "type": "object",
      "properties": {
        "collections": { "type": "array", "items": { "type": "string" } },
        "subjects": { "type": "array", "items": { "type": "string" } },
        "tags": { "type": "array", "items": { "type": "string" } },
        "language": { "type": ["string", "null"] },
        "geo": { "type": "array", "items": { "type": "string" } }
      },
      "anyOf": [
        { "required": ["collections"] },
        { "required": ["subjects"] },
        { "required": ["tags"] }
      ]
    },
    "external_ref": {
      "type": "object",
      "required": ["system", "id"],
      "properties": {
        "system": { "type": "string" },
        "id": { "type": "string" },
        "type": { "type": ["string", "null"] },
        "path": { "type": ["string", "null"] }
      }
    },
    "identity": {
      "type": "object",
      "properties": {
        "claim_key": { "type": "string" },
        "thread_key": { "type": "string" },
        "dedupe_hash": { "type": "string" },
        "novelty": {
          "enum": ["new", "duplicate", "corroboration", "update", "contradiction", "correction"]
        },
        "checked_at": { "type": "string" }
      }
    },
    "source": {
      "type": "object",
      "required": ["type", "title"],
      "anyOf": [
        { "required": ["uri"] },
        { "required": ["raw_path"] },
        { "required": ["content_hash"] }
      ],
      "properties": {
        "type": {
          "enum": [
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
            "other"
          ]
        },
        "title": { "type": "string" },
        "uri": { "type": ["string", "null"] },
        "publisher": { "type": ["string", "null"] },
        "author": { "type": ["string", "null"] },
        "language": { "type": ["string", "null"] },
        "published_at": { "type": ["string", "null"] },
        "content_hash": { "type": ["string", "null"] },
        "raw_path": { "type": ["string", "null"] }
      }
    },
    "claim": {
      "type": "object",
      "required": ["statement", "atomic"],
      "properties": {
        "statement": { "type": "string" },
        "atomic": { "type": "boolean" },
        "type": { "type": "string" },
        "subject": { "type": "string" },
        "predicate": { "type": "string" },
        "object": { "type": "string" },
        "qualifiers": { "type": "object" }
      }
    },
    "question": {
      "type": "object",
      "required": ["text", "status"],
      "properties": {
        "text": { "type": "string" },
        "status": { "enum": ["open", "resolved", "archived"] },
        "priority": { "enum": ["low", "medium", "high"] },
        "resolution_criteria": { "type": "string" },
        "why_it_matters": { "type": "string" },
        "answer_claim_id": { "type": ["string", "null"] }
      }
    },
    "synthesis": {
      "type": "object",
      "required": ["title", "summary", "basis", "status"],
      "properties": {
        "title": { "type": "string" },
        "summary": { "type": "string" },
        "basis": {
          "type": "object",
          "properties": {
            "claim_ids": { "type": "array", "items": { "type": "string" } },
            "question_ids": { "type": "array", "items": { "type": "string" } },
            "source_ids": { "type": "array", "items": { "type": "string" } }
          }
        },
        "limitations": { "type": "string" },
        "status": { "enum": ["active", "archived"] }
      }
    },
    "change": {
      "type": "object",
      "required": ["action"],
      "properties": {
        "action": { "enum": ["retract", "supersede", "merge", "relate", "patch"] },
        "target_ids": { "type": "array", "items": { "type": "string" } },
        "target_id": { "type": "string" },
        "replacement_id": { "type": "string" },
        "canonical_id": { "type": "string" },
        "reason": { "type": "string" },
        "relation": {
          "type": "object",
          "required": ["from_id", "to_id", "rel"],
          "properties": {
            "from_id": { "type": "string" },
            "to_id": { "type": "string" },
            "target_id": { "type": "string" },
            "rel": { "enum": ["supports", "contradicts", "depends_on", "context_for"] },
            "strength": { "enum": ["low", "medium", "high"] },
            "rationale": { "type": "string" }
          }
        },
        "patch": { "type": "array", "items": { "type": "object" } }
      }
    },
    "time": {
      "type": "object",
      "required": ["precision"],
      "properties": {
        "occurred_at": { "type": ["string", "null"] },
        "valid_at": { "type": ["string", "null"] },
        "valid_from": { "type": ["string", "null"] },
        "valid_until": { "type": ["string", "null"] },
        "reported_at": { "type": ["string", "null"] },
        "first_observed_at": { "type": ["string", "null"] },
        "last_checked_at": { "type": ["string", "null"] },
        "precision": { "enum": ["instant", "hour", "day", "month", "year", "range", "unknown"] },
        "timezone": { "type": ["string", "null"] },
        "notes": { "type": "string" }
      }
    },
    "provenance": {
      "type": "object",
      "properties": {
        "source_ids": { "type": "array", "items": { "type": "string" } },
        "evidence": { "type": "array", "items": { "$ref": "#/$defs/evidence_ref" } },
        "acquisition": { "type": "object" },
        "transformations": { "type": "array", "items": { "type": "object" } },
        "derivation": { "type": "object" }
      }
    },
    "evidence_ref": {
      "type": "object",
      "required": ["source_id", "role", "summary"],
      "properties": {
        "source_id": { "type": "string" },
        "role": { "enum": ["supports", "contradicts", "context"] },
        "locator": { "type": "object" },
        "summary": { "type": "string" }
      }
    },
    "assessment": {
      "type": "object",
      "properties": {
        "confidence": { "enum": ["unknown", "low", "medium", "high"] },
        "source_reliability": { "enum": ["unknown", "low", "medium", "high"] },
        "information_depth": {
          "type": "object",
          "required": ["level", "rationale"],
          "properties": {
            "level": { "enum": ["unknown", "thin", "partial", "strong", "complete"] },
            "rationale": { "type": "string" }
          }
        },
        "importance": { "enum": ["unknown", "low", "medium", "high"] },
        "contested": { "type": "boolean" },
        "uncertainty": { "type": "string" }
      }
    },
    "relation": {
      "type": "object",
      "required": ["target_id", "rel"],
      "properties": {
        "target_id": { "type": "string" },
        "rel": {
          "enum": ["supports", "contradicts", "depends_on", "context_for"]
        },
        "strength": { "enum": ["low", "medium", "high"] },
        "rationale": { "type": "string" }
      }
    }
  }
}

```

File: /Users/jaredsmith/Projects-ultra/knb/AGENTS.md
```md
# Agent Instructions

## Project Goal

`knb` is a small, portable, embeddable knowledge base structure for AI-assisted research. It stores sourced knowledge, uncertainty, and synthesis in an append-only JSONL ledger that agents can dedupe, audit, query, and reconstruct.

The canonical model is `knb.v1`:

- `source`: where knowledge came from
- `claim`: the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `change`: append-only operational event for retractions, supersession, merges, relation changes, and mechanical repairs

Reusable row modules are `scope`, `identity`, `time`, `provenance`, `assessment`, and `relations`.

## Rules

- Always use Bun for package management, scripts, tests, and local execution.
- Prefer the CLI over direct edits to `knb/ledger.jsonl`.
- Treat `knb/ledger.jsonl` as append-only. Do not rewrite old rows except for mechanical repair.
- Treat `knb/views/` and `knb/indexes/` as generated outputs. They are never canonical.
- Keep the schema general. Do not add app-specific fields to the canonical row model.
- Add dependencies only when they clearly improve reliability or maintainability.

## Commands

```bash
bun run knb -- validate
bun run knb -- append --file row.json
bun run knb -- query --collection example --kind claim
bun run knb -- render --collection example --out knb/views/example.md
```

## Design Notes

The CLI is the gate into and out of the ledger. It should validate JSON, preserve row identity, resolve source and relation references, and keep generated views disposable. Agents should add knowledge as small source, claim, question, and synthesis rows rather than dumping long essays into claims.

See [Agent-First CLI Design](docs/design/agent-first-cli.md) for the target command surface and lifecycle model.

```

File: /Users/jaredsmith/Projects-ultra/knb/README.md
```md
# knb

`knb` is a portable, embeddable JSONL knowledge base for AI-assisted research.

Repository: https://github.com/ratacat/knb

It stores one canonical append-only ledger with four knowledge row kinds: `source`, `claim`, `question`, and `synthesis`. Operational lifecycle events use `change` rows. The CLI validates rows, appends them safely, queries the ledger, and renders disposable Markdown views.

## Requirements

- Bun

## Quick Start

```bash
bun install
bun run knb -- validate
```

Append a row:

```bash
bun run knb -- append --file row.json
```

Query rows:

```bash
bun run knb -- query --kind claim --collection my-topic
```

Render a collection view:

```bash
bun run knb -- render --collection my-topic --out knb/views/my-topic.md
```

## Storage

```text
knb/
  ledger.jsonl
  schema.json
  README.md
  views/
  indexes/
```

Only `knb/ledger.jsonl` is canonical. Generated views and indexes can be deleted and rebuilt.

## CLI

```bash
bun run knb -- validate [--ledger knb/ledger.jsonl]
bun run knb -- append --file row.json [--ledger knb/ledger.jsonl]
bun run knb -- query [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--json]
bun run knb -- render --collection topic [--out knb/views/topic.md]
```

The append command validates the entire ledger plus the candidate row before writing. It rejects duplicate IDs, unresolved source references, unresolved relation targets, and kind-specific shape errors.

See [Agent-First CLI Design](docs/design/agent-first-cli.md) for the target CLI and lifecycle model.

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/validator.test.ts
```ts
import { describe, expect, test } from "bun:test";
import { queryRows, validateLedger, type LoadedRow } from "../src/knb";
import type { ChangeRow, ClaimRow, KnbRow, SourceRow, SynthesisRow } from "../src/types";

const source: SourceRow = {
  schema_version: "knb.v1",
  id: "src:test:20260501:aaaa1111",
  kind: "source",
  created_at: "2026-05-01T12:00:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"] },
  source: {
    type: "web_page",
    title: "Example source",
    uri: "https://example.com",
  },
  provenance: {
    acquisition: {
      method: "manual",
      observed_at: "2026-05-01T12:00:00Z",
    },
  },
};

const claim: ClaimRow = {
  schema_version: "knb.v1",
  id: "claim:test:20260501:bbbb2222",
  kind: "claim",
  created_at: "2026-05-01T12:01:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"], tags: ["fact"] },
  identity: {
    claim_key: "example|has|source",
    novelty: "new",
  },
  claim: {
    statement: "Example has a source.",
    atomic: true,
    subject: "Example",
    predicate: "has",
    object: "source",
  },
  time: {
    first_observed_at: "2026-05-01T12:01:00Z",
    precision: "instant",
  },
  provenance: {
    source_ids: [source.id],
    evidence: [
      {
        source_id: source.id,
        role: "supports",
        summary: "The example source supports the claim.",
      },
    ],
  },
  assessment: {
    confidence: "high",
  },
};

const synthesis: SynthesisRow = {
  schema_version: "knb.v1",
  id: "synth:test:20260501:cccc3333",
  kind: "synthesis",
  created_at: "2026-05-01T12:02:00Z",
  created_by: "agent:test",
  scope: { collections: ["test"], subjects: ["Example"] },
  synthesis: {
    title: "Example has sourced knowledge",
    summary: "knb can preserve a sourced claim and render it later.",
    basis: {
      claim_ids: [claim.id],
      source_ids: [source.id],
    },
    status: "active",
  },
};

describe("validateLedger", () => {
  test("accepts valid source, claim, and synthesis rows", () => {
    const rows = load([source, claim, synthesis]);
    const result = validateLedger(rows);
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  test("rejects unresolved evidence source IDs", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:dddd4444";
    badClaim.provenance.evidence = [{ source_id: "src:missing", role: "supports", summary: "Missing." }];
    const result = validateLedger(load([source, badClaim]));
    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("Unresolved evidence source_id"))).toBe(true);
  });

  test("query hides rows targeted by change supersede unless history is requested", () => {
    const replacement = structuredClone(claim);
    replacement.id = "claim:test:20260501:eeee5555";
    replacement.created_at = "2026-05-01T12:03:00Z";
    const change: ChangeRow = {
      schema_version: "knb.v1",
      id: "chg:test:20260501:ffff6666",
      kind: "change",
      created_at: "2026-05-01T12:04:00Z",
      created_by: "agent:test",
      scope: { collections: ["test"], subjects: ["Example"] },
      change: {
        action: "supersede",
        target_ids: [claim.id],
        replacement_id: replacement.id,
        reason: "The replacement states the claim more precisely.",
      },
    };
    const rows = load([source, claim, replacement, change]);

    const active = queryRows(rows, { kind: "claim", collection: "test" });
    const history = queryRows(rows, { kind: "claim", collection: "test", includeHistory: true });

    expect(active.map((row) => row.id)).toEqual([replacement.id]);
    expect(history.map((row) => row.id)).toEqual([claim.id, replacement.id]);
  });

  test("rejects lifecycle terms in semantic relations", () => {
    const badClaim = structuredClone(claim);
    badClaim.id = "claim:test:20260501:gggg7777";
    badClaim.relations = [{ target_id: claim.id, rel: "supersedes" as never }];

    const result = validateLedger(load([source, claim, badClaim]));

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.message.includes("relation.rel must be one of"))).toBe(true);
  });
});

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/knb.ts
```ts
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import {
  ASSESSMENT_LEVELS,
  CHANGE_ACTIONS,
  CONFIDENCE_VALUES,
  INFORMATION_DEPTH_VALUES,
  KNB_SCHEMA_VERSION,
  QUESTION_PRIORITIES,
  QUESTION_STATUSES,
  RELATION_TYPES,
  ROW_KINDS,
  SOURCE_TYPES,
  SYNTHESIS_STATUSES,
  TIME_PRECISIONS,
  type Assessment,
  type ChangeRow,
  type ClaimRow,
  type KnbRow,
  type QuestionRow,
  type Scope,
  type SourceRow,
  type SynthesisRow,
} from "./types";

export const DEFAULT_LEDGER_PATH = "knb/ledger.jsonl";

export type LoadedRow = {
  row: KnbRow;
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

type RowMap = Map<string, KnbRow>;

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
      rows.push({ row: JSON.parse(line) as KnbRow, line: lineNumber });
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
  const candidate = { row: row as KnbRow, line: ledger.rows.length + 1 };
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
    if (kind === "change") validateChange(loaded as LoadedRow & { row: ChangeRow }, byId, issues);

    validateSourceRefs(loaded, sourceIds, issues);
    validateRelations(loaded, byId, issues);
  }

  validateSynthesisBasis(rows, byId, issues);
  validateQuestionAnswers(rows, byId, issues);

  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

export function effectiveRows(rows: LoadedRow[]): KnbRow[] {
  const inactive = new Set<string>();

  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "change") continue;
    const change = (loaded.row as ChangeRow).change;
    if (!isRecord(change)) continue;
    if (!["retract", "supersede", "merge"].includes(String(change.action))) continue;
    for (const targetId of stringArray(change.target_ids)) inactive.add(targetId);
  }

  return rows.map((loaded) => loaded.row).filter((row) => !inactive.has(row.id));
}

export function queryRows(rows: LoadedRow[], options: QueryOptions): KnbRow[] {
  const haystack = options.includeHistory ? rows.map((loaded) => loaded.row) : effectiveRows(rows);
  const text = options.text?.toLowerCase();

  return haystack.filter((row) => {
    if (options.kind !== "change" && row.kind === "change") return false;
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
  if (row.schema_version !== KNB_SCHEMA_VERSION) {
    issues.push({ level: "error", line: loaded.line, id: stringValue(row.id), message: "schema_version must be knb.v1" });
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
  validateAssessment((loaded.row as { assessment?: unknown }).assessment, loaded, issues, { requireConfidence: false });
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
    validateAssessment(row.assessment, loaded, issues, { requireConfidence: true });
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
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
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
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
}

function validateChange(loaded: LoadedRow & { row: ChangeRow }, byId: RowMap, issues: ValidationIssue[]): void {
  const change = (loaded.row as { change?: unknown }).change;
  if (!isRecord(change)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "change row must include change object" });
    return;
  }

  requireEnum(change.action, CHANGE_ACTIONS, "change.action", loaded, issues);

  if (change.action === "retract") {
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids");
    requireString(change.reason, "change.reason", loaded, issues);
    return;
  }

  if (change.action === "supersede") {
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids");
    requireExistingId(change.replacement_id, loaded, byId, issues, "change.replacement_id");
    requireString(change.reason, "change.reason", loaded, issues);
    return;
  }

  if (change.action === "merge") {
    requireExistingId(change.canonical_id, loaded, byId, issues, "change.canonical_id");
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids");
    requireString(change.reason, "change.reason", loaded, issues);
    return;
  }

  if (change.action === "relate") {
    const relation = change.relation;
    if (!isRecord(relation)) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "change.relation must be an object" });
      return;
    }
    requireExistingId(relation.from_id, loaded, byId, issues, "change.relation.from_id");
    requireExistingId(relation.to_id, loaded, byId, issues, "change.relation.to_id");
    requireEnum(relation.rel, RELATION_TYPES, "change.relation.rel", loaded, issues);
    return;
  }

  if (change.action === "patch") {
    requireExistingId(change.target_id, loaded, byId, issues, "change.target_id");
    if (!Array.isArray(change.patch) || change.patch.length === 0) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "change.patch must have at least one item" });
    }
    requireString(change.reason, "change.reason", loaded, issues);
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
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "assessment must be an object" });
    return;
  }

  const assessment = value as Assessment;
  if (options.requireConfidence || assessment.confidence !== undefined) {
    requireEnum(assessment.confidence, CONFIDENCE_VALUES, "assessment.confidence", loaded, issues);
  }
  if (assessment.source_reliability !== undefined) {
    requireEnum(assessment.source_reliability, ASSESSMENT_LEVELS, "assessment.source_reliability", loaded, issues);
  }
  if (assessment.importance !== undefined) {
    requireEnum(assessment.importance, ASSESSMENT_LEVELS, "assessment.importance", loaded, issues);
  }
  if (assessment.information_depth !== undefined) {
    if (!isRecord(assessment.information_depth)) {
      issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: "assessment.information_depth must be an object" });
      return;
    }
    requireEnum(assessment.information_depth.level, INFORMATION_DEPTH_VALUES, "assessment.information_depth.level", loaded, issues);
    requireString(assessment.information_depth.rationale, "assessment.information_depth.rationale", loaded, issues);
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

function requireTargetIds(value: unknown, loaded: LoadedRow, byId: RowMap, issues: ValidationIssue[], field: string): void {
  const targetIds = stringArray(value);
  if (targetIds.length === 0) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `${field} must have at least one id` });
    return;
  }
  for (const targetId of targetIds) {
    requireExistingId(targetId, loaded, byId, issues, field);
  }
}

function requireExistingId(value: unknown, loaded: LoadedRow, byId: RowMap, issues: ValidationIssue[], field: string): void {
  const id = stringValue(value);
  if (!id) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `${field} is required` });
    return;
  }
  if (!byId.has(id)) {
    issues.push({ level: "error", line: loaded.line, id: loaded.row.id, message: `Unresolved ${field}: ${id}` });
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

function byCreated(a: KnbRow, b: KnbRow): number {
  return a.created_at.localeCompare(b.created_at);
}

function byImportanceThenCreated(a: SynthesisRow, b: SynthesisRow): number {
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

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/package.json
```json
{
  "name": "knb",
  "version": "0.1.0",
  "description": "Portable, embeddable, AI-friendly JSONL knowledge base tooling.",
  "homepage": "https://github.com/ratacat/knb#readme",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/ratacat/knb.git"
  },
  "type": "module",
  "bin": {
    "knb": "./src/cli.ts"
  },
  "scripts": {
    "knb": "bun run src/cli.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "latest"
  }
}

```

File: /Users/jaredsmith/Projects-ultra/knb/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "types": ["bun-types"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts"]
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/types.ts
```ts
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

```

File: /Users/jaredsmith/Projects-ultra/knb/knb/README.md
```md
# Knowledge Base

This directory stores the canonical `knb` ledger.

- `ledger.jsonl` is the append-only source of truth.
- `schema.json` documents the structural row shape.
- `views/` contains generated Markdown views.
- `indexes/` contains generated indexes.

Knowledge rows are `source`, `claim`, `question`, and `synthesis`. Operational lifecycle events use `change` rows.

Use the CLI instead of editing `ledger.jsonl` directly:

```bash
bun run knb -- validate
bun run knb -- append --file row.json
bun run knb -- query --collection example
bun run knb -- render --collection example --out knb/views/example.md
```

```
</file_contents>
<meta prompt 1 = "[Architect]">
You are producing an implementation-ready technical plan. The implementer will work from your plan without asking clarifying questions, so every design decision must be resolved, every touched component must be identified, and every behavioral change must be specified precisely.

Your job:
1. Analyze the requested change against the provided code — identify the relevant architecture, constraints, data flow, and extension points.
2. Decide whether this is best solved by a targeted change or a broader refactor, and justify that decision.
3. Produce a plan detailed enough that an engineer can implement it file-by-file without making design decisions of their own.

Hard constraints:
- Do not write production code, patches, diffs, or copy-paste-ready implementations.
- Stay in analysis and architecture mode only.
- Use illustrative snippets, interface shapes, sample signatures, state/data shapes, or pseudocode when they communicate the design more precisely than prose. Keep them partial — enough to remove ambiguity, not enough to copy-paste.
- Scale your response to the complexity of the request. Small, localized changes need short plans; only expand sections for changes that genuinely require the detail.

─── ANALYSIS ───

Current-state analysis (always include):
- Map the existing responsibilities, type relationships, ownership, data flow, and mutation points relevant to the request.
- Identify existing code that should be reused or extended — never duplicate what already exists without justification.
- Note hard constraints: API contracts, protocol conformances, state ownership rules, thread/actor isolation, persistence schemas, UI update mechanisms.
- When multiple subsystems interact, trace the call chain end-to-end and identify each transformation boundary.

─── DESIGN ───

Design standards — address only the standards relevant to the change; skip sections that don't apply:

1. New and modified components/types: For each, specify:
   - The name, kind (for example: class, interface, enum, record, service, module, controller), and why that kind fits the codebase and language.
   - The fields/properties/state it owns, including data shape, mutability, and ownership/lifecycle semantics.
   - Key callable interfaces or signatures, including inputs, outputs, and whether execution is synchronous/asynchronous or can fail.
   - Contracts it implements, extends, composes with, or depends on.
   - For closed sets of variants (for example enums, tagged unions, discriminated unions): all cases/variants and any attached data.
   - Where the component lives (file path) and who creates/owns its instances.

2. State and data flow: For each state change the plan introduces or modifies:
   - What triggers the change (user action, callback, notification, timer, stream event).
   - The exact path the data travels: source → transformations → destination.
   - Thread/actor/queue context at each step.
   - How downstream consumers observe the change (published property, delegate, notification, binding, callback).
   - What happens if the change arrives out of order, is duplicated, or is dropped.

3. API and interface changes: For each modified public/internal interface:
   - The before and after signatures (or new signature if additive).
   - Every call site that must be updated, grouped by file.
   - Backward-compatibility strategy if the interface is used by external consumers or persisted data.

4. Persistence and serialization: When the plan touches stored data:
   - Schema changes with exact field names, types, and defaults.
   - Migration strategy: how existing data is read, transformed, and re-persisted.
   - What happens when new code reads old data and when old code reads new data (if rollback is possible).

5. Concurrency and lifecycle:
   - Specify the execution model and safety boundaries for each new/modified component: thread affinity, event-loop/runtime constraints, isolation boundaries, queue/worker discipline, or thread-safety expectations as applicable.
   - Identify potential races, leaked references/resources, or lifecycle mismatches introduced by the change.
   - When operations are asynchronous, specify cancellation/abort behavior and what state remains after interruption.

6. Error handling and edge cases:
   - For each operation that can fail, specify what failures are possible and how they propagate.
   - Describe degraded-mode behavior: what the user sees, what state is preserved, what recovery is available.
   - Identify boundary conditions: empty collections, missing/null/optional values, first-run states, interrupted operations.

7. Algorithmic and logic-heavy work (include whenever the change involves non-trivial control flow, state machines, data transformations, or performance-sensitive paths):
   - Describe the algorithm step-by-step: inputs, outputs, invariants, and data structures.
   - Cover edge cases, failure modes, and performance characteristics (time/space complexity if relevant).
   - Explain why this approach over the most plausible alternatives.

8. Avoid unnecessary complexity:
   - Do not add layers, abstractions, or indirection without a concrete benefit identified in the plan.
   - Do not create parallel code paths — unify where possible.
   - Reuse existing patterns unless those patterns are themselves the problem.

─── OUTPUT ───

Structure your response as:

1. **Summary** — One paragraph: what changes, why, and the high-level approach.

2. **Current-state analysis** — How the relevant code works today. Trace the data/control flow end-to-end. Identify what is reusable and what is blocking.

3. **Design** — The core of the plan. Apply every applicable standard from above. Organize by logical component or subsystem, not by standard number. Each component section should cover types, state flow, interfaces, persistence, concurrency, and error handling as relevant to that component.

4. **File-by-file impact** — For every file that changes, list:
   - What changes (added/modified/removed types, methods, properties).
   - Why (which design decision drives this change).
   - Dependencies on other changes in this plan (ordering constraints).

5. **Risks and migration** — Include only when the change introduces breaking changes, data migration, or rollback concerns. Omit for additive or non-breaking work.

6. **Implementation order** — A numbered sequence of steps. Each step should be independently compilable and testable where possible. Call out steps that must be atomic (landed together).

Response discipline:
- Be specific to the provided code — reference actual type names, file paths, method names, and property names.
- Make every assumption explicit.
- Flag unknowns that must be validated during implementation, with a suggested validation approach.
- When a design decision has a non-obvious rationale, explain it in one sentence.
- Do not pad with generic advice. Every sentence should convey information the implementer needs.

Please proceed with your analysis based on the following <user instructions>
</meta prompt 1>
<user_instructions>
You are picking up work on `knb`, a small agent-first CLI + library backed by an append-only JSONL ledger.

The full design specification lives at `docs/design/agent-first-cli.md`. It is the source of truth for architecture, module boundaries, CLI surface, contracts, and behavior. Treat it as the canonical brief.

The current code in `src/` (`cli.ts`, `knb.ts`, `types.ts`) and `tests/validator.test.ts` is an early/prototype implementation. The data shape and seed artifacts under `knb/` (`schema.json`, `ledger.jsonl`, `README.md`) reflect the working data model. `AGENTS.md` and the top-level `README.md` describe project conventions.

Your task:

1. Read `docs/design/agent-first-cli.md` end-to-end and internalize the module depth standard, the V1 external seams it lists, and the CLI / library / output contracts it specifies.
2. Compare the spec against the current code in `src/` and `tests/`. Identify which seams exist, which are missing or shallow, and where current behavior diverges from the spec.
3. Produce a concrete, staged implementation plan to bring the codebase in line with the spec. The plan should:
   - Honor the "delete-test" depth principle — do not propose seams the spec does not justify.
   - Order work so each stage leaves the tree in a working, testable state.
   - Call out contracts (row contracts, operation contracts, output envelopes, exit codes) that need to be locked down before higher-level commands are wired through them.
   - Note risks, ambiguities, or places where the spec needs a decision before code can be written, and propose specific resolutions where you can.
4. Where the plan touches code that already exists, reference the relevant files and functions by name.

Output:
- A short gap analysis (current vs. spec).
- A staged plan (milestones with concrete deliverables and the seams/files each milestone establishes or modifies).
- An open-questions list, each with a recommended default answer.

Do not start writing implementation code. The goal here is a plan grounded in the actual spec and the actual current code.
</user_instructions>
