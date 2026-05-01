# Knowbase

Knowbase is a portable, embeddable JSONL knowledge base for AI-assisted research.

It stores one canonical append-only ledger with four row kinds: `source`, `claim`, `question`, and `synthesis`. The CLI validates rows, appends them safely, queries the ledger, and renders disposable Markdown views.

## Requirements

- Bun

## Quick Start

```bash
bun install
bun run kb -- validate
```

Append a row:

```bash
bun run kb -- append --file row.json
```

Query rows:

```bash
bun run kb -- query --kind claim --collection my-topic
```

Render a collection view:

```bash
bun run kb -- render --collection my-topic --out kb/views/my-topic.md
```

## Storage

```text
kb/
  ledger.jsonl
  schema.json
  README.md
  views/
  indexes/
```

Only `kb/ledger.jsonl` is canonical. Generated views and indexes can be deleted and rebuilt.

## CLI

```bash
bun run kb -- validate [--ledger kb/ledger.jsonl]
bun run kb -- append --file row.json [--ledger kb/ledger.jsonl]
bun run kb -- query [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--json]
bun run kb -- render --collection topic [--out kb/views/topic.md]
```

The append command validates the entire ledger plus the candidate row before writing. It rejects duplicate IDs, unresolved source references, unresolved relation targets, and kind-specific shape errors.
