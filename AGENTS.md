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
