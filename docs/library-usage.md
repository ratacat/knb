# Library Usage

`knb` is a TypeScript library first; the CLI is one of several adapters built on top. Host applications and tests should import `openKnb` from the package root. Do not import from `src/core/*` directly.

## Opening a workspace

```ts
import { openKnb } from "knb";

const knb = await openKnb({
  root: process.cwd(),     // optional; defaults to cwd / KNB_ROOT
  actor: "alice@example",  // optional; defaults to git/system/unknown
});
```

`openKnb` resolves the workspace (`.knb/config.json`, `knb/ledger.jsonl`), the acting identity, and runtime adapters. Pass `runtime: { clock, randomIdPart }` to inject deterministic time and IDs for tests.

## Facade methods

Each method returns a typed domain result. None of them know about TTYs or JSON envelopes; that is the CLI's job.

### `init(options?)`

Create config, ledger, schema, and projection directories. Idempotent unless `force: true`.

```ts
await knb.init();
```

### `status()`

Cheap orientation packet: workspace path, ledger path, row counts, parse/validation/state-warning counts, projection freshness.

```ts
const status = await knb.status();
console.log(status.row_count, status.active_counts_by_kind);
```

### `schema()`

Return the `knb.v1` JSON Schema, row samples, and apply-operation samples. Useful for agents that want to learn the contract without reading docs.

```ts
const { json_schema, row_samples, operation_samples } = await knb.schema();
```

### `apply(request)`

Primary write. Atomic by default; rejects forward references, unresolved IDs, and validation failures before touching the ledger.

```ts
await knb.apply({
  operations: [
    { op: "add", as: "src", row: { kind: "source", scope: { collections: ["x"] }, source: { type: "web_page", title: "T", uri: "https://x" }, provenance: { acquisition: { method: "manual" } } } },
    { op: "add", row: { kind: "claim", scope: { collections: ["x"] }, claim: { statement: "X is true.", atomic: true }, time: { precision: "unknown" }, provenance: { evidence: [{ source_id: "$src", role: "supports", summary: "stated" }] }, assessment: { confidence: "medium" } } },
  ],
  dedupe: true,
});
```

### `add(row)`

Convenience wrapper for one `add` operation. Identical envelope to `apply`.

```ts
await knb.add({
  kind: "question",
  scope: { collections: ["x"] },
  question: { text: "Is X always true?", status: "open" },
});
```

### `get(ids, options?)`

Fetch full rows by ID. Active-only by default; pass `{ includeHistory: true }` to see inactive rows or `{ explain: true }` to see lifecycle reasons.

```ts
const result = await knb.get(["claim:x:20260501:abc12345"], { explain: true });
```

### `query(request)`

Deterministic retrieval over effective state. Filter by `kind`, `collection`, `subject`, `tag`, `text`, `claimKey`, `claimType`, `externalRefs`, etc.

```ts
const result = await knb.query({
  kind: "claim",
  collection: "x",
  claimKey: "topic|fact",
  externalRefs: [{ system: "x", id: "123" }],
  limit: 20,
});
```

### `context(request)`

Build a token-budgeted research packet (syntheses, key claims, open questions, sources, warnings). Drops lower-value details first when over budget.

```ts
const ctx = await knb.context({
  collection: "x",
  maxTokens: 3000,
  includeWarnings: true,
  recencyWindowDays: 30,
  scoringProfile: {
    weights: { importance: { high: 3, medium: 2, low: 1, unknown: 0 } },
  },
});
```

### `novelty(request)`

Classify candidate claims against active claims as `new`, `duplicate`, `corroboration`, `update`, `contradiction`, or `correction`. No writes. Same module powers `apply --dedupe`.

```ts
const { results } = await knb.novelty({
  candidates: [
    { claim: { statement: "X is true.", atomic: true }, scope: { collections: ["x"] } },
  ],
});
```

A candidate is a `Partial<ClaimRow>`: the statement lives at `candidate.claim.statement`, not at the top level. Provide `identity.claim_key` to anchor key-based matches (`duplicate`/`corroboration`), or `identity.dedupe_hash` for hash-based matches.

## Request naming

Public TypeScript facade request fields are camelCase. CLI flags are kebab-case and ledger/schema fields remain snake_case. For example, call `knb.query({ claimKey })`, pass `--claim-key` on the CLI, and persist `identity.claim_key` in ledger rows.

### `render(request)`

Generate a Markdown view for one collection. Writes the view and a sidecar metadata file under `knb/views/`.

```ts
await knb.render({ collection: "x", format: "md" });
```

### `check()`

Health report: parse issues, validation issues, state warnings, projection freshness. The CLI maps this onto exit codes; the library returns the structured report.

```ts
const report = await knb.check();
```

### `rebuildIndex()`

Rebuild the V1 disposable indexes (active by ID, by collection, claim keys, source URIs/hashes) from current effective state.

```ts
await knb.rebuildIndex();
```

## Why the facade is the test surface

The CLI is intentionally boring: `parse args -> openKnb -> facade method -> output.render`. Tests should exercise the same seams. If you need behavior that is not on the facade, add it to the facade rather than reaching into `src/core/*`.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the module map and naming rules, and [docs/design/agent-first-cli.md](design/agent-first-cli.md) for the full command contracts.
