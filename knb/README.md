# Knowledge Base

This directory stores the canonical `knb` ledger.

- `ledger.jsonl` is the append-only source of truth.
- `schema.json` documents the structural row shape.
- `views/` contains generated Markdown views.
- `indexes/` contains generated indexes.

Knowledge rows are `source`, `claim`, `question`, and `synthesis`. Operational lifecycle events (retract, supersede, merge, relate, patch) use `change` rows.

Use the CLI instead of editing `ledger.jsonl` directly:

```bash
bun run knb -- status --json
bun run knb -- apply --stdin --json < ops.json
bun run knb -- add --file row.json --json
bun run knb -- query --collection example --kind claim
bun run knb -- check --json
bun run knb -- render --collection example --out knb/views/example.md
```

`views/` and `indexes/` are disposable. Delete them and rebuild with `knb render` and `knb index --rebuild`.
