# Knowledge Base

This directory stores the canonical Knowbase ledger.

- `ledger.jsonl` is the append-only source of truth.
- `schema.json` documents the structural row shape.
- `views/` contains generated Markdown views.
- `indexes/` contains generated indexes.

Use the CLI instead of editing `ledger.jsonl` directly:

```bash
bun run kb -- validate
bun run kb -- append --file row.json
bun run kb -- query --collection example
bun run kb -- render --collection example --out kb/views/example.md
```
