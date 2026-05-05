# V1 Migration and Rollback Notes

## Current state
- The repo ledger `knb/ledger.jsonl` is currently empty (V1 launch).
- All canonical rows use `schema_version: "knb.v1"`. Obsolete `kb.v1` rows are rejected.

## Generated artifacts
- `knb/views/` and `knb/indexes/` are disposable. Delete and rebuild via:
  - `knb render --profile <name>` for views
  - `knb index --rebuild` for indexes
- Both are recomputed deterministically from `knb/ledger.jsonl`.

## Mechanical repair
- Mechanical in-place repair of `knb/ledger.jsonl` is reserved for:
  - broken JSONL that prevents loading
  - invalid IDs that prevent unique-id checks
- All other "repairs" go through `entry` rows: `retract`, `supersede`, `merge`, `link`, `patch`.
- `patch` records a mechanical-repair audit entry without rewriting the target row's content.

## Rollback
- The ledger is append-only and content-hashed (`LedgerFingerprint.content_hash`).
- To roll back to a previous ledger state, restore `knb/ledger.jsonl` from version control and rebuild projections via `knb index --rebuild`.
- There is no in-place delete operation. Removed knowledge is expressed via `entry` rows.

## Release gates
Run `bun run release-check` before tagging a release:
- `bun test` — full unit + integration + static seam test suite
- `bun run typecheck` — strict TypeScript check
- `bun run release:smoke` — CLI binary smoke test on a fresh workspace
