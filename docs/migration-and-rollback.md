# V1 Migration and Rollback Notes

## Current state
- The default `main` instance uses `knb/ledger.jsonl`.
- Additional instances use `knb/instances/<id>/ledger.jsonl` unless config overrides paths.
- All canonical rows use `schema_version: "knb.v1"`. Obsolete `kb.v1` rows are rejected.
- Old single-instance configs can be upgraded with `knb migrate`.

## Workspace migration
- Check first with `knb migrate --dry-run --json`.
- Apply with `knb migrate --json`.
- Migration rewrites old flat config fields into `.knb/config.json` under `instances.<id>`.
- Migration preserves existing ledger paths and does not rewrite ledger history.
- `knb help` prints a migration notice when the current project still looks like the old layout.

## Generated artifacts
- Instance `views/` and `indexes/` directories are disposable. Delete and rebuild via:
  - `knb render --profile <name>` for views
  - `knb index --rebuild` for indexes
- Both are recomputed deterministically from the selected instance ledger.

## Mechanical repair
- Mechanical in-place repair of an instance ledger is reserved for:
  - broken JSONL that prevents loading
  - invalid IDs that prevent unique-id checks
- All other "repairs" go through `entry` rows: `retract`, `supersede`, `merge`, `link`, `patch`.
- `patch` records a mechanical-repair audit entry without rewriting the target row's content.

## Rollback
- The ledger is append-only and content-hashed (`LedgerFingerprint.content_hash`).
- To roll back to a previous ledger state, restore the selected instance ledger from version control and rebuild projections via `knb index --rebuild`.
- There is no in-place delete operation. Removed knowledge is expressed via `entry` rows.

## Release gates
Run `bun run release-check` before tagging a release:
- `bun test` — full unit + integration + static seam test suite
- `bun run typecheck` — strict TypeScript check
- `bun run release:smoke` — CLI binary smoke test on a fresh workspace
