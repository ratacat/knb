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
bun run knb -- init
bun run knb -- status --json
bun run knb -- schema --json
bun run knb -- apply --stdin --json
bun run knb -- add --stdin --json
bun run knb -- get <id>
bun run knb -- query --kind claim --collection example
bun run knb -- context --collection example --max-tokens 3000 --json
bun run knb -- check --json
bun run knb -- render --collection example
bun run knb -- index --rebuild
```

Writes go through `apply` (atomic batch) or its single-row wrapper `add`. Reads (`get`, `query`, `context`, `render`, `check`, `index`) go through validated effective-state snapshots, so they respect lifecycle changes and projection freshness automatically.

## Design Notes

The CLI is a thin adapter: parse args, open a workspace, call one library method, render an envelope. Both the CLI and host applications use the same `openKnb` facade, so the public library is also the test surface. Any new behavior should live behind a facade method, not in CLI argument handling.

`knb/ledger.jsonl` is canonical. Generated `knb/views/` and `knb/indexes/` are disposable projections rebuilt from the ledger.

See [Agent-First CLI Design](docs/design/agent-first-cli.md) for the full command surface, output envelopes, lifecycle model, and module seams. See [Library Usage](docs/library-usage.md) for `openKnb` and the facade methods host applications call.
