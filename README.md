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
