# knb

`knb` is a portable, embeddable JSONL knowledge base for AI-assisted research.

Repository: https://github.com/ratacat/knb

It stores one canonical append-only ledger with four knowledge row kinds: `source`, `claim`, `question`, and `synthesis`. Operational lifecycle events use `change` rows. The CLI is a thin adapter over the `Knb` library facade: it parses arguments, opens a workspace, calls one library method, and renders a structured envelope. Writes go through `apply` and `add` with locked, atomic, fully validated batches; reads go through validated snapshots that respect lifecycle state and projection freshness.

## Requirements

- Bun

## Quick Start

```bash
bun install
bun run knb -- init --json
bun run knb -- status --json
```

Apply an atomic batch of operations from stdin:

```bash
bun run knb -- apply --stdin --json < ops.json
```

Add a single row:

```bash
bun run knb -- add --file row.json --json
```

Query rows:

```bash
bun run knb -- query --kind claim --collection my-topic --json
```

Build a token-budgeted context packet:

```bash
bun run knb -- context --collection my-topic --json
```

Verify ledger health and projection freshness:

```bash
bun run knb -- check --json
```

Render a collection view:

```bash
bun run knb -- render --collection my-topic --json
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
bun run knb -- init    [--root <dir>] [--force] [--json]
bun run knb -- status  [--root <dir>] [--json]
bun run knb -- schema  [--json]
bun run knb -- apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dedupe]
bun run knb -- add     (--file row.json | --json '{...}' | --stdin)
bun run knb -- get     <id> [<id>...] [--include-history] [--explain]
bun run knb -- query   [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--limit N] [--history] [--json]
bun run knb -- context [--collection topic] [--max-tokens 3000] [--json]
bun run knb -- novelty (--file candidates.json | --json '{...}' | --stdin)
bun run knb -- render  --collection topic [--out knb/views/topic.md]
bun run knb -- check   [--json]
bun run knb -- index   [--rebuild]
```

`apply` and `add` both go through the same locked, validated, atomic write pipeline. They reject duplicate IDs, unresolved source references, unresolved relation targets, and kind-specific shape errors before the ledger is touched.

## Agent Loop

A typical agent research turn:

```bash
knb status --json
knb context --collection example --max-tokens 3000 --json
knb novelty --stdin --json < candidate-claims.json
knb apply --stdin --atomic --dedupe --json < ops.json
knb check --json
knb render --collection example --format md --out knb/views/example.md --json
```

`status` orients (cheap), `context` builds a token-budgeted packet, `novelty` classifies candidate claims (no writes), `apply` writes one atomic batch with optional dedupe, `check` reports parse/validation/freshness issues, and `render` regenerates the collection view.

## Library Usage

Host applications import the same facade the CLI uses:

```ts
import { openKnb } from "knb";

const knb = await openKnb();
const status = await knb.status();
const result = await knb.apply({
  operations: [
    {
      op: "add",
      row: {
        kind: "source",
        scope: { collections: ["example"] },
        source: { type: "web_page", title: "Example", uri: "https://example.com" },
        provenance: { acquisition: { method: "manual" } },
      },
    },
  ],
});
```

See [docs/library-usage.md](docs/library-usage.md) for the full facade and per-method examples.

See [Agent-First CLI Design](docs/design/agent-first-cli.md) for the full CLI surface, output envelopes, and lifecycle model.
