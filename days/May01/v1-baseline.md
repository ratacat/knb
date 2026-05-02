# V1 Baseline + Migration Inventory (bd-1em.4)

Recorded 2026-05-01 immediately before the contract / workspace / facade extraction.

## Baseline signals

```
$ bun test
bun test v1.3.5 (1e86cebd)
 4 pass
 0 fail
 8 expect() calls
Ran 4 tests across 1 file. [83 ms]

$ bun run typecheck
$ tsc --noEmit
(no output)
```

`tests/validator.test.ts` covers:

1. valid `source` + `claim` + `synthesis` rows accepted
2. unresolved `evidence.source_id` rejected
3. `change.action: "supersede"` hides the target unless `--history`
4. lifecycle terms (`supersedes`) rejected inside semantic `relations[].rel`

These four assertions must continue to pass, in shape, after the refactor.
The supersession-hiding test moves to the State module; the relation-term
rejection moves to the Contract module; the unresolved-evidence test moves
to the Contract module's cross-row validation; the happy-path moves to
Contract row tests.

## Repo state at lock time

- `src/types.ts` — row vocabulary, enum constants, `KnbRow` discriminated union
- `src/knb.ts` — `loadLedger`, `appendRow`, `validateLedger`, `effectiveRows`,
  `queryRows`, `renderCollection`, `writeRenderedCollection`,
  `readJsonInput`, plus all private validation helpers
- `src/cli.ts` — flag parser, dispatch for `validate`, `append`, `query`,
  `render`, `help`; calls `console.log` / `console.error` directly
- `tests/validator.test.ts` — single file, asserts `validateLedger` and
  `queryRows` directly against in-memory `LoadedRow[]` fixtures
- `knb/schema.json` — hand-maintained JSON Schema at 274 lines
- `knb/ledger.jsonl` — empty (0 rows)
- `package.json` — `bun:knb`, `typecheck`, `test`. **Missing `exports`.**
- `tsconfig.json` — strict, no rewriting needed

Uncommitted (intentional, preserved):

- `docs/design/agent-first-cli.md` — V1 spec edits (the live contract)
- `docs/design/pro-refactor.md` — historical analysis
- `CLAUDE.md` — `@AGENTS.md` re-export
- `prompt-exports/`, `.liquid-mail/` — agent infra, ignored

## Helper → V1 module map

| Current helper / file              | Target V1 module                                                         |
| ---------------------------------- | ------------------------------------------------------------------------ |
| `src/types.ts` (constants + types) | `src/core/contract.ts` (owns row + operation contracts and JSON Schema)  |
| `validateLedger` + private helpers | `src/core/contract.ts` (row + cross-row validation)                      |
| `loadLedger`                       | `src/core/ledger.ts` (defensive JSONL load with line-numbered issues)     |
| `appendRow`                        | `src/core/ledger.ts` (locked write transaction) + `src/core/apply.ts`     |
| `readJsonInput`                    | `src/cli.ts` only (CLI input plumbing; not a library seam)                |
| `effectiveRows`                    | `src/core/state.ts` (`EffectiveState`, lifecycle-aware projection)        |
| `queryRows`                        | `src/core/query.ts` (deterministic retrieval over `EffectiveState`)       |
| `renderCollection` / `writeRendered…` | `src/core/projections.ts` (with metadata + freshness)                  |
| Direct `console.log` / `error`     | `src/core/output.ts` + `src/core/errors.ts`                              |
| `--ledger` flag handling           | `src/core/workspace.ts` (root, config, ledger, schema, lock, actor)       |
| Implicit V1 facade gap             | `src/core/knb.ts` + `src/index.ts` (`openKnb`, runtime injection)         |
| Missing read pipeline              | `src/core/read-snapshot.ts` (load + validate + project + freshness)       |
| Missing novelty                    | `src/core/novelty.ts`                                                    |
| Missing context                    | `src/core/context.ts`                                                    |

## Replacement boundaries (no shims)

- Public `validate` and `append` commands are replaced by `check` and
  `apply`/`add` in the cutover epic. No aliases.
- `src/types.ts` becomes a thin private re-export of contract types only as
  long as the migration needs it; deleted in the final cleanup task.
- `src/knb.ts` is deleted entirely once each helper has a V1 home.
- Validation issues gain `code` + optional `path`; existing `level` /
  `message` / `line` / `id` shape is preserved by the contract module.
- Source rows with duplicate URI or content-hash become **warnings**, not
  errors (claim-level novelty is the dedupe surface in V1).

## Test-naming note

`tests/validator.test.ts` will be renamed / replaced by per-module test
files (`tests/contract.test.ts`, `tests/state.test.ts`,
`tests/query.test.ts`, etc.) as each module lands. Until the cutover, the
file may live alongside the new tests so `bun test` keeps reporting the
baseline assertions.
