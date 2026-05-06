# Agent Instructions

## Project Goal

`knb` is a small, portable, embeddable knowledge base structure for AI-assisted research. It stores sourced knowledge, uncertainty, and synthesis in an append-only JSONL ledger that agents can dedupe, audit, query, and reconstruct.

The current storage model is `knb.v1`:

- `source`: where knowledge came from
- `claim`: legacy storage kind for the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `entry`: append-only ledger mutation for retractions, supersession, merges, links, and mechanical repairs

Reusable row modules are `scope`, `identity`, `time`, `provenance`, `assessment`, and `links`.

Profiles and instances:

- **Profile**: a named vocabulary and rule set layered on `knb.v1`, such as `research.v1` or `trade_map.v1`.
- **Instance**: one named knowledge base inside a project folder. Each instance has its own ledger, generated views/indexes, lock, and attached profile list.
- One instance may use multiple profiles.
- One project folder may contain multiple instances. The default instance is `main`.

Vocabulary migration decisions:

- Use `profile`, `subject`, and `tag` for scope/render filters. Do not add another project or filesystem-boundary scope term.
- Use **record** for the domain unit. `claim` is legacy `knb.v1` storage language to replace, not preferred profile language.
- Use **link** for typed semantic edges between records. The old edge term is not current vocabulary.
- Use **entry** for append-only ledger mutations.
- Recovered decision: old beads `bd-2v6c`/`bd-2v6c.1` chose a record/link/entry substrate. Link and entry are current vocabulary; records still need to replace the legacy knowledge row kinds.
- Profile-specific record fields live in the current extension slot (`claim.qualifiers`) only while legacy storage remains. Profile docs should name fields directly; avoid "qualifiers" as user-facing language.
- Trade-map profile: use `prediction`, not `forecast` or `estimate`. A prediction may have a `value`; conditions get time-scoped assessments via a term still being finalized.

## Rules

- Always use Bun for package management, scripts, tests, and local execution.
- Prefer the CLI over direct edits to instance ledger files.
- Treat instance ledger files as append-only. Do not rewrite old rows except for mechanical repair.
- Treat instance `views/` and `indexes/` directories as generated outputs. They are never canonical.
- Keep the schema general. Do not add app-specific fields to the canonical row model.
- Add dependencies only when they clearly improve reliability or maintainability.

## Commands

```bash
bun run knb -- init
bun run knb -- migrate --dry-run --json
bun run knb -- status --json
bun run knb -- schema --json
bun run knb -- apply --stdin --json
bun run knb -- add --stdin --json
bun run knb -- get <id>
bun run knb -- query --kind claim --profile example
bun run knb -- context --profile example --max-tokens 3000 --json
bun run knb -- check --json
bun run knb -- render --profile example
bun run knb -- index --rebuild
bun run knb -- instance create research --profile research.v1 --json
bun run knb -- status --instance research --json
```

Writes go through `apply` (atomic batch) or its single-row wrapper `add`. Reads (`get`, `query`, `context`, `render`, `check`, `index`) go through validated effective-state snapshots, so they respect lifecycle entries and projection freshness automatically.

## Design Notes

The CLI is a thin adapter: parse args, open a workspace, call one library method, render an envelope. Both the CLI and host applications use the same `openKnb` facade, so the public library is also the test surface. Any new behavior should live behind a facade method, not in CLI argument handling.

The selected instance ledger is canonical. The default `main` instance uses `knb/ledger.jsonl`; additional instances use `knb/instances/<id>/ledger.jsonl` unless config overrides paths. Generated views and indexes are disposable projections rebuilt from the selected ledger.

See [Architecture](ARCHITECTURE.md) for the module map, vocabulary, naming boundaries, projection seams, and ADR index.

See [Library Usage](docs/library-usage.md) for `openKnb` and the facade methods host applications call. Run `bun run knb -- help` for the current command surface.
