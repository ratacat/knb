# Agent Instructions

## Project Goal

Knowbase is a small, portable, embeddable knowledge base structure for AI-assisted research. It stores sourced knowledge, uncertainty, and synthesis in an append-only JSONL ledger that agents can dedupe, audit, query, and reconstruct.

The canonical model is `kb.v1`:

- `source`: where knowledge came from
- `claim`: the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation

Reusable row modules are `scope`, `identity`, `time`, `provenance`, `assessment`, and `relations`.

## Rules

- Always use Bun for package management, scripts, tests, and local execution.
- Prefer the CLI over direct edits to `kb/ledger.jsonl`.
- Treat `kb/ledger.jsonl` as append-only. Do not rewrite old rows except for mechanical repair.
- Treat `kb/views/` and `kb/indexes/` as generated outputs. They are never canonical.
- Keep the schema general. Do not add app-specific fields to the canonical row model.
- Add dependencies only when they clearly improve reliability or maintainability.

## Commands

```bash
bun run kb -- validate
bun run kb -- append --file row.json
bun run kb -- query --collection example --kind claim
bun run kb -- render --collection example --out kb/views/example.md
```

## Design Notes

The CLI is the gate into and out of the ledger. It should validate JSON, preserve row identity, resolve source and relation references, and keep generated views disposable. Agents should add knowledge as small source, claim, question, and synthesis rows rather than dumping long essays into claims.
