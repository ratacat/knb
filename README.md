# knb

`knb` is a small JSONL knowledge base for AI-assisted research. It keeps sourced claims, open questions, and synthesis in one append-only ledger that agents can audit and rebuild from scratch.

The CLI is designed for agents, not for hand-operated note taking. It favors explicit commands, JSON envelopes, stable exit codes, and append-only writes over a cozy human interface.

Repository: https://github.com/ratacat/knb

## How agents use it

`knb` is for research state that needs to survive across agent turns. A good row is small, sourced, and easy to invalidate later. Agents should not paste a whole dossier into one blob if they can store the source, split the claims, leave open questions, and write a short synthesis.

The loop is usually:

1. Read orientation with `status` and `context`.
2. Check whether candidate claims are new with `novelty`.
3. Write one atomic batch with `apply`.
4. Run `check`.
5. Render views or rebuild indexes when another agent or human needs the projected output.

The ledger is append-only on purpose. If a claim is wrong, an agent writes a `change` row that retracts or supersedes it. That gives later agents the full trail instead of a silently edited note.

Reads come from the effective state, not raw file scans. That means queries, context packets, renders, and collection summaries all respect retractions, supersession, merges, and historical `--as-of` cutoffs.

## What it stores

The canonical model is `knb.v1`.

- `source`: where knowledge came from
- `claim`: the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `change`: lifecycle events such as retractions, supersession, merges, relation changes, and repairs

Only `knb/ledger.jsonl` is canonical. `knb/views/` and `knb/indexes/` are generated projections. Delete and rebuild them whenever they get stale.

```text
knb/
  ledger.jsonl
  schema.json
  README.md
  views/
  indexes/
```

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/ratacat/knb/main/scripts/install.sh | bash
```

The installer keeps a checkout in `~/.knb/knb-cli` and writes a `knb` launcher into a directory on your `PATH`. It installs Bun if Bun is missing. Rerun the same command to update.

## Agent examples

Before writing, ask for the current shape of the workspace:

```bash
knb status --json
knb context --collection my-topic --max-tokens 3000 --json
```

Preview candidate claims without writing:

```bash
knb novelty --stdin --json < candidate-claims.json
```

Commit a batch only after the candidate rows are ready:

```bash
knb apply --stdin --atomic --dedupe --json < ops.json
```

Check the workspace after writes:

```bash
knb check --json
```

Generate disposable outputs for handoff or inspection:

```bash
knb render --collection my-topic --format md --out knb/views/my-topic.md --json
knb index --rebuild
```

For one-off row insertion, `add` wraps the same write path as `apply`:

```bash
knb add --file row.json --json
```

For targeted reads, query the effective state:

```bash
knb query --kind claim --collection my-topic --json
knb collections --json
```

## CLI reference

```bash
knb init    [--root <dir>] [--config <path>] [--ledger <path>] [--actor <name>] [--force] [--json]
knb status  [--root <dir>] [--collection <c>] [--max-questions N] [--detailed] [--json]
knb collections [--root <dir>] [--json]
knb schema  [--json]
knb log     [--actor <a>] [--since <date>] [--until <date>] [--limit N] [--json]
knb apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dedupe] [--dry-run]
knb add     (--file row.json | --json '{...}' | --stdin)
knb get     <id> [<id>...] [--as-of <iso>] [--include-history] [--explain]
knb query   [--as-of <iso>] [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--claim-key key] [--claim-type type] [--predicate value] [--qualifier key=value] [--external-ref system:id] [--citing uri] [--limit N] [--history] [--full] [--json]
knb context [--as-of <iso>] [--collection topic] [--subject name] [--tag tag] [--claim-type type] [--predicate value] [--qualifier key=value] [--external-ref system:id] [--max-tokens 3000] [--recency-window-days N] [--no-warnings] [--json]
knb novelty (--file candidates.json | --json '{...}' | --stdin)
knb render  (--collection topic [--out knb/views/topic.md] | --all) [--as-of <iso>] [--format md] [--json]
knb check   [--json]
knb index   [--rebuild]
```

`apply` and `add` use the same locked write path. They validate the full batch before touching the ledger, so duplicate IDs, unresolved source references, unresolved relation targets, and kind-specific shape errors fail cleanly.

`collections` reads from the validated effective-state snapshot, not from generated indexes. `log` reads apply run manifests from `.knb/runs/`.

`get`, `query`, `context`, and `render` accept `--as-of <iso>` for historical reads. `query` and `context` also accept generic structured-claim filters such as `--claim-type`, `--predicate`, `--qualifier key=value`, and `--external-ref system:id`.

## Local development

For local development in this repository:

```bash
bun install
bun run knb -- init --json
bun run knb -- status --json
```

## Library usage

Host applications import the same facade the CLI uses:

```ts
import { openKnb } from "knb";

const knb = await openKnb();
const status = await knb.status();
const result = await knb.apply({
  operations: [
    {
      op: "add",
      row: {
        kind: "source",
        scope: { collections: ["example"] },
        source: { type: "web_page", title: "Example", uri: "https://example.com" },
        provenance: { acquisition: { method: "manual" } },
      },
    },
  ],
});
```

See [docs/library-usage.md](docs/library-usage.md) for the facade methods and examples.

See [docs/design/agent-first-cli.md](docs/design/agent-first-cli.md) for the full command surface, output envelopes, and lifecycle model.
