# knb Agent-First CLI Design

`knb` is a small CLI-first package with a library underneath. Agents use the `knb` command. Host applications import the same core library. Both paths operate on the same append-only JSONL ledger.

This is the live greenfield V1 spec. It incorporates the relevant decisions from [pro-refactor.md](/Users/jaredsmith/Projects/knb/docs/design/pro-refactor.md); treat that file as historical analysis, not an additional contract.

## Goals

- Write many ledger entries in one atomic call.
- Retrieve compact research context in one call.
- Keep the canonical model portable, auditable, and dependency-light.
- Keep generated indexes and views disposable.
- Keep each module deep: callers learn a small interface and get a lot of behavior.
- Replace prototype helpers with deep modules instead of extending broad helper files.

## Architecture Principles

The CLI stays thin. It parses arguments, opens a workspace, calls one library method, and sends the result through the output module.

The library owns correctness. Write ordering, current-state projection, row contracts, output envelopes, and token-budgeted context all sit behind deep modules. Callers should not reassemble these rules from helper functions.

The module interface is the test surface. Tests should exercise the same seams that the CLI and host applications use.

Do not add new CLI commands directly on top of prototype helpers. Establish the workspace, output, contract, ledger, and state seams first, then route commands through the public library.

Do not add fallback formats, deprecated aliases, dual storage layouts, or compatibility shims. This is a greenfield project; the final implementation should expose one current contract.

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

This is logical atomicity for normal process errors. A process or OS crash during the underlying append can still leave a partial trailing line on some filesystems. The loader must report that line-numbered parse issue, preserve valid rows before and after any bad line, and let `check` become the explicit recovery surface.

## Prototype Replacement Rules

The current implementation is scaffold. It has useful row vocabulary, fixtures, and validation behavior, but it is not a compatibility target. V1 should replace broad helpers with the target module graph and then remove the old paths.

Final V1 command set:

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

Removed public commands:

```text
validate
append
```

`validate` is replaced by `check`. `append` is replaced by `apply` and `add`. Do not preserve aliases in the final release.

Naming rules:

- Use lowercase `knb` for package names, command examples, file paths, schema namespaces, and prose that names the project.
- Use PascalCase `Knb` for exported TypeScript symbols: `Knb`, `KnbRow`, `KnbWorkspace`, `KnbRuntime`, `KnbStatus`, and `openKnb`.
- Do not use `KB` as shorthand in new code.

Extraction rules:

- Move row and operation contracts from `src/types.ts` and `src/knb.ts` into `src/core/contract.ts`.
- Move JSONL loading, fingerprints, locking, and append transactions into `src/core/ledger.ts`.
- Move current-state projection into `src/core/state.ts`; all reads consume `EffectiveState`.
- Move rendering, indexes, metadata, and freshness checks into `src/core/projections.ts`.
- Move deterministic retrieval into `src/core/query.ts`; do not use raw `JSON.stringify` search as the main query path.
- Build atomic writes in `src/core/apply.ts`; do not extend single-row append into the primary writer.
- Route the CLI through `openKnb` and output envelopes. The CLI should not import ledger, validation, query, or projection helpers directly.

Final cleanup rules:

- Delete `src/knb.ts`, or reduce it to a private wrapper only if tests still need a temporary bridge during the branch.
- Do not import broad helpers from `src/knb.ts` after final cutover.
- Reject obsolete schema versions such as `kb.v1` instead of translating them.
- Keep `knb/schema.json` synchronized with `contract.jsonSchema()` until schema generation exists.
- Add the package export: `{ "exports": { ".": "./src/index.ts" } }`.
- Update public docs and agent examples to use `status`, `schema`, `apply`, `add`, `context`, `check`, `render`, and `index`.

## Row Model

The canonical row kinds are:

- `source`: an information artifact.
- `claim`: an atomic proposition.
- `question`: unresolved uncertainty.
- `synthesis`: readable interpretation.
- `entry`: an operational event that changes effective state.

Terminology note: profile and domain docs should call the knowledge-card unit a `record`. The current V1 storage and API contract still exposes `claim` rows, `claim_key`, and `key_claims`; treat those as legacy storage names until the record substrate replaces them.

Every canonical row in V1 uses `schema_version: "knb.v1"`. Obsolete schema strings such as `kb.v1` should be rejected during the V1 cutover, not preserved as aliases.

Knowledge rows remain immutable. Current state is a deterministic projection over ledger order.

`links` express semantic links between knowledge rows. They do not retract, supersede, or merge rows. Lifecycle entries belong in `entry` rows.

Record identity policy for storage `claim` rows:

- `identity` is required for claim rows.
- `identity.claim_key` is optional. Agents should provide it when they know a stable key, but V1 should not force agents to invent weak keys.


- Duplicate source URI or content-hash evidence should produce warnings, not blocked writes.

## Entry Rows

Use `entry` rows for operational history:

- `retract`: mark target rows ineffective.
- `supersede`: mark target rows ineffective in favor of a replacement row.
- `merge`: mark target rows as duplicates of a canonical row.
- `link`: add link state without rewriting rows.
- `patch`: record a mechanical repair without rewriting the target row. V1 records audit metadata and explanations only; `EffectiveState` does not apply JSON patches to mutate row content.

Physical in-place repair is reserved for broken JSONL, invalid IDs, or other mechanical corruption that prevents the ledger from loading.

## Apply Pipeline Module

`knb apply` is the primary write interface. It should be one deep module, not a command that coordinates many shallow helpers.

The apply operation contract must exist before the write pipeline. The CLI, schema command, tests, and host applications all use the same operation types.

Base request shape:

```ts
type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true; // v1 supports only atomic writes
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
  | { op: "link"; from_id: Ref; to_id: Ref; rel: LinkType; strength?: "low" | "medium" | "high"; rationale?: string; scope?: Scope; as?: string }
  | { op: "patch"; target_id: Ref; patch: Array<Record<string, unknown>>; reason: string; scope?: Scope; as?: string };

type DraftRow = Omit<Partial<KnbRow>, "schema_version" | "created_at" | "created_by"> & {
  id?: string;
  kind: KnbRowKind;
  scope: Scope;
};

type Ref = string; // existing row ID, "$op<N>", or "$<as>"
```

`op: "add"` appends the supplied row after filling missing common fields. Lifecycle operations append `entry` rows. If a lifecycle operation omits `scope`, apply derives it from the referenced target rows; validation fails if no anchored scope can be derived. The `as` field gives an operation a stable intra-batch reference. `$op0` also refers to the row created by operation index 0.

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
        "scope": { "profiles": ["example"] },
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
        "scope": { "profiles": ["example"] },
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
- Validate the locked snapshot before accepting operations.
- Validate all operations against the locked snapshot.
- Resolve intra-batch references such as `$op0`.
- Complete draft rows through the contract module using actor, time, and ID allocator inputs.
- Build all entry rows for lifecycle operations.
- Validate the complete candidate ledger.
- Return rows to append through the ledger transaction.
- Tell the projection module to rebuild eager indexes after a successful write when configured.

`knb apply` is atomic by default. If any operation fails inside the write transaction, no operation writes. Apply must not validate against one ledger snapshot and append against another.

Reference resolution is structural. Apply resolves `$op<N>` and `$<as>` only in known reference fields:

- `provenance.source_ids[]`
- `provenance.evidence[].source_id`
- `links[].target_id`
- `synthesis.basis.claim_ids[]`
- `synthesis.basis.question_ids[]`
- `synthesis.basis.source_ids[]`
- `question.answer_claim_id`

Apply must not blindly string-replace arbitrary row fields.


Result shape:

```ts
type ApplyResult = {
  created: Array<{ op: number; as?: string; id: string; kind: KnbRowKind }>;
  warnings: string[];
};
```

Single-row append is a convenience wrapper:

```text
knb add --file row.json
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
entry      ent
```

`scope-slug` comes from the first profile, subject, or tag in that order. If the scope cannot provide a slug, validation fails before ID generation. `random8` is lowercase base36. If a generated ID collides with the current ledger or the candidate batch, apply retries before failing with a conflict.

## Effective State Module

The effective state module is the read-side projection. `get`, `query`, `context`, `render`, `check`, and `index` should all use it.

Projection algorithm:

1. Read rows in ledger order.
2. Build an ID map.
3. Initialize each valid row as `active`.
4. Mark rows with intrinsic archived status as `archived`; V1 treats `question.status === "archived"` and `synthesis.status === "archived"` as intrinsic archives.
5. Apply `entry` rows in order.
6. Mark retracted, superseded, and merged rows inactive.
7. Add link entries to the effective link graph.
8. Record `patch` entries as audit history without mutating target row content.
9. Preserve enough history to explain why a row is inactive.

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
- Return the effective link graph.
- Return projection warnings for invalid, dangling, or contradictory entry rows.
- Warn when lifecycle entries target already inactive rows.
- Warn when link entries point at missing endpoints.

Suggested interface:

```ts
type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(options?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  explain(id: string): StateExplanation | undefined;
  linkGraph(): LinkGraph;
  warnings: StateWarning[];
};
```

The raw row is not the current state. Current state is the row plus later `entry` rows.

Normal reads hide `entry` rows unless the caller requests history or explicitly asks for `kind=entry`. Operational rows remain queryable for audit.

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

Validation warnings do not block projection. The read snapshot should build `EffectiveState` when there are no parse or validation errors, carry warnings forward, and surface them through `status`, `check`, and `context`.

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

Validation issues use stable machine-readable fields:

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

Source of truth:

Use TypeScript constants and validator rules as the source of truth for v1. Generate or update `knb/schema.json` from that contract once the module exists. Until then, code changes must update TypeScript, validator behavior, tests, and `knb/schema.json` together.

After `core/contract.ts` exists, do not hand-edit `knb/schema.json`. Update the contract and regenerate the schema. A schema sync test must fail when `contract.jsonSchema()` and `knb/schema.json` diverge.

The contract module must not read files, inspect the workspace, choose clocks, or allocate randomness itself. Apply supplies actor, time, ID-generator inputs, and row maps; contract applies the row rules.

## CLI Surface

The base command set is:

```text
init       create config and storage
status     print a compact state summary
schema     print row and operation contracts
apply      apply many append/entry operations
add        convenience wrapper for one row
get        fetch rows by ID
query      retrieve matching rows
context    build a compact research packet
render     generate disposable views
check      validate ledger health
index      rebuild or inspect generated indexes
```

`--root`, `--config`, `--ledger`, and output-format flags are global. Commands pass through workspace resolution before they dispatch to the facade.
Unknown flags should fail with `invalid_arguments`; retired flags must not be ignored because that can broaden a scoped read.

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
knb context --profile <profile> --max-tokens 3000 --json
knb check --json
knb render --profile <profile> --format md --out knb/views/<profile>.md --json
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
- Broken source, basis, link, and entry references.
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

Both modules accept `EffectiveState` from the read snapshot as input. They do not load ledgers, validate row contracts, or apply lifecycle entries themselves.

The query module returns matching rows. It should:

1. Filter by profile, subject, tag, kind, and time.
2. Search exact IDs first.
3. Search exact `identity.claim_key` values second.
4. Search normalized text fields:
   - `claim.statement`
   - `source.title`
   - `question.text`
   - `synthesis.title`
   - `synthesis.summary`
5. Score with deterministic lexical matching.
6. Return compact rows unless `--full` is set.

The context module builds a research packet. It should:

1. Read effective state.
2. Filter active rows by profile, subject, and tag.
3. Select active syntheses by importance, recency, and basis depth.
4. Select active records by importance, confidence, information depth, evidence depth, and contested status.
5. Select open questions by priority, importance, and recency.
6. Include sources cited by selected records and syntheses.
7. Estimate tokens deterministically with `ceil(chars / 4)` by default.
8. Respect `--max-tokens` by dropping lower-value details first.

`context` is not filtered `query`. It is a briefing module with its own interface and tests.

When a context packet is over budget, drop details in this order:

1. Source metadata details.
2. Low-importance records.
3. Low-priority questions.
4. Lower-ranked syntheses.

Context should surface information gaps, contested records, thin evidence, stale projections, and open questions. It should not only retrieve connected rows.

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

## Projection Module

The projection module owns disposable outputs derived from effective state. It is the seam behind `render`, `index`, status freshness, and check freshness warnings.

Interface responsibilities:

- Render profile views from `EffectiveState`.
- Rebuild generated indexes from `EffectiveState`.
- Write only under workspace view and index paths.
- Record disposable projection metadata.
- Compare projection metadata with the current ledger fingerprint.
- Report fresh, stale, missing, and unknown projection states.

Projection metadata lives with generated outputs, not in the canonical ledger. It can be deleted and rebuilt.

For V1, projection paths must stay under workspace-managed view and index directories. If `--out` points outside those directories, reject the request unless a later design explicitly allows external writes.

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
    "profile": "example",
    "format": "md"
  },
  "generated_at": "2026-05-01T12:00:00Z"
}
```

Use `LedgerFingerprint` for freshness checks. File mtimes can be displayed as diagnostics, but they are not the source of truth. Apply does not need to mark existing projections stale; a new ledger fingerprint makes old projection metadata stale automatically.

V1 indexes are deterministic and disposable:

- Active rows by ID.
- Active rows by profile.
- Active storage claim rows by `identity.claim_key`.
- Active sources by URI or content hash when present.

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
- Contract tests cover row samples, operation samples, JSON Schema, schema sync, duplicate IDs, cross-row references, and validation errors.
- Ledger tests cover empty and missing ledgers, defensive JSONL loading, line-numbered parse errors, fingerprint changes, locked write transactions, lock contention, callback failure, and flush behavior.
- Effective state tests cover active rows, archived rows, retraction, supersession, merge, link entries, patch audit history, inactive explanations, hidden entry rows, and dangling-entry warnings.
- Read snapshot tests cover partial snapshots, validation summaries, effective state inclusion, and projection freshness.
- Query tests cover exact ID matches, claim-key matches, normalized text matches, filters, active/history behavior, and compact/full output.
- Get tests cover active rows, hidden inactive rows, history mode, and explanations.
- Projection tests cover deterministic render output, index rebuilds, metadata, stale detection, and workspace path constraints.
- Output tests cover JSON envelopes, human text, stderr, and exit codes.
- Context tests cover ranking, source inclusion, warnings, information gaps, and token-budget truncation.

Avoid tests that pin private helper behavior. If a helper needs direct tests, first ask whether it is a real module seam or only an internal implementation detail.

## Implementation Order

1. Lock the current baseline with `bun test` and `bun run typecheck`.
2. Extract `contract.ts`; move row constants, row types, validation, schema, samples, and stable validation issues.
3. Add apply operation contract types and validation.
4. Add `errors.ts` and stable exit-code mapping.
5. Add `output.ts` and command result envelopes.
6. Add `workspace.ts` for path, config, and actor resolution.
7. Add `ledger.ts` with defensive JSONL loading, fingerprints, locks, and append transactions.
8. Add `index.ts`, `core/knb.ts`, `openKnb`, runtime injection, and the package export.
9. Add `read-snapshot.ts` to centralize load, validate, project, and freshness.
10. Add `init`, `status`, `schema`, and `check`.
11. Replace `effectiveRows` with `state.ts`.
12. Add `apply.ts` and route `add` through the same module.
13. Add `get`.
14. Replace prototype query internals with `query.ts`.
15. Add `context.ts` as a separate research-packet module.
17. Add `projections.ts`, render metadata, freshness checks, and indexes.
18. Cut over the CLI to `parse args -> openKnb -> facade method -> output.render`.
19. Remove public `validate` and `append`.
20. Remove broad helper imports from `src/knb.ts`; delete the file if no temporary private wrapper remains.
21. Update public docs, agent examples, package exports, and the full agent-loop facade test.

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
