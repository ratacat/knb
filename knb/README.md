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
