# knb

`knb` is an AI-first knowledge base primitive: a CLI and library for turning a folder into an append-only, profile-driven knowledge base agents can audit and rebuild.

Use it when you want an agent to build a purpose-specific knowledge base or knowledge graph without inventing a storage format first. A profile can make `knb` act like a research notebook, a decision map, a dialogue tree, a workflow model, a game lore database, or another structured memory system.

Repository: https://github.com/ratacat/knb

## install

```bash
curl -fsSL https://raw.githubusercontent.com/ratacat/knb/main/scripts/install.sh | bash
```

The installer keeps a checkout in `~/.knb/knb-cli` and writes a `knb` launcher into a directory on your `PATH`. It installs Bun if Bun is missing. Rerun the same command to update.

Check the install:

```bash
knb help
```

## what it gives an agent

`knb` gives agents a few stable parts they can combine instead of starting from blank files:

- Ledger: one append-only JSONL file, `knb/ledger.jsonl`, as the canonical store.
- Records: small sourced units of knowledge, open questions, and synthesis.
- Entries: lifecycle mutations for retractions, supersession, merges, links, and repairs.
- Profiles: named vocabularies and rules for a domain, with optional agent instructions.
- Instances: filesystem-backed workspaces with their own config, ledger, generated views, and indexes.
- Context packets: token-bounded output for the next agent turn.
- Views and indexes: disposable projections rebuilt from the ledger.

The intended workflow: install `knb`, ask an agent to create a custom profile for the job, then let the agent write, check, query, and render structured knowledge through the same interface.

## quick start

Create a workspace:

```bash
knb init --json
```

Create and attach a profile:

```bash
cat > research-profile.json <<'JSON'
{
  "display_name": "Research",
  "description": "Sourced research records, open questions, and short synthesis.",
  "agent_instructions": [
    "Use this profile for sourced research records.",
    "Keep records atomic. Prefer one claim per row.",
    "Write questions when uncertainty remains."
  ]
}
JSON

knb profile create research.v1 --stdin --attach --json < research-profile.json
```

Ask for the current workspace shape before writing:

```bash
knb status --json
knb context --profile research.v1 --max-tokens 3000 --json
```

Write one validated batch:

```bash
cat > ops.json <<'JSON'
{
  "operations": [
    {
      "op": "add",
      "row": {
        "kind": "source",
        "scope": { "profiles": ["research.v1"] },
        "source": {
          "type": "web_page",
          "title": "Example",
          "uri": "https://example.com"
        },
        "provenance": {
          "acquisition": { "method": "manual" }
        }
      }
    }
  ]
}
JSON

knb apply --stdin --atomic --json < ops.json
```

Rebuild outputs and check after writes:

```bash
knb index --rebuild --json
knb render --profile research.v1 --format md --json
knb check --json
```

## how agents use it

`knb` is for state that needs to survive across agent turns. A good record is small, sourced, and easy to invalidate later. Agents should store the source, split the records, leave open questions, and write synthesis that a later agent can audit.

The loop is usually:

1. Read orientation with `status` and `context`.
2. Write one atomic batch with `apply`.
3. Run `check`.
4. Render views or rebuild indexes when another agent or human needs projected output.

The ledger is append-only on purpose. If a record is wrong, an agent writes an `entry` row that retracts or supersedes it. Later agents get the full trail instead of a silently edited note.

Reads come from the effective state, not raw file scans. Queries, context packets, renders, and profile summaries respect retractions, supersession, merges, and historical `--as-of` cutoffs.

## core model

The canonical model is `knb.v1`.

- `source`: where knowledge came from
- `claim`: legacy storage kind for the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `entry`: append-only ledger mutation for retractions, supersession, merges, links, and repairs

`record` is the preferred domain term for a knowledge card. Current storage still exposes the legacy row kinds above.

Only `knb/ledger.jsonl` is canonical. `knb/views/` and `knb/indexes/` are generated projections. Delete and rebuild them when they get stale.

```text
knb/
  config.json
  ledger.jsonl
  schema.json
  profiles/
  views/
  indexes/
```

## profiles and extensibility

Profiles make `knb` modular. A profile can define:

- `display_name` and `description`
- `record_types` for domain-specific records
- `link_types` for typed relationships between records
- `required_fields` for profile-specific validation
- `agent_instructions` that tell agents how to use the profile
- `metadata` for local conventions

One instance can attach multiple profiles, so the same workspace can hold shared sources while exposing different views for research, planning, operations, or narrative structure.

Profile commands:

```bash
knb profile list --json
knb profile show research.v1 --json
knb profile create research.v1 --stdin --attach --json
knb profile replace research.v1 --stdin --confirm research.v1 --json
knb profile check --json
```

Instance commands:

```bash
knb instance show --json
knb instance create ./my-kb --instance-id my-kb --profile research.v1 --json
knb instance attach-profile research.v1 --json
knb instance detach-profile research.v1 --json
knb instance list --under . --json
```

## command surface

```bash
knb <command> [--root <dir>] [--config <path>] [--ledger <path>] [--json]
knb init    [--actor <name>] [--force]
knb status
knb schema
knb apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dry-run]
knb add     (--file row.json | --json '{...}' | --stdin)
knb get     <id> [<id>...] [--as-of <iso>] [--include-history] [--explain]
knb query   [--as-of <iso>] [--kind claim] [--profile topic] [--subject name] [--tag tag] [--text text] [--claim-key key] [--limit N] [--history] [--full] [--json]
knb context [--as-of <iso>] [--profile topic] [--subject name] [--tag tag] [--max-tokens 3000] [--no-warnings] [--json]
knb render  [--profile topic] [--out topic.md] [--as-of <iso>] [--format md] [--json]
knb check
knb index   [--rebuild]
knb profile list|show|create|replace|delete|check
knb instance show|create|list|set|attach-profile|detach-profile|delete
```

Workspace flags are global and accepted by every command. Unknown flags fail with `invalid_arguments`.

`apply` and `add` use the same locked write path. They validate the full batch before touching the ledger, so duplicate IDs, unresolved source references, unresolved link targets, and kind-specific shape errors fail cleanly.

`get`, `query`, `context`, and `render` accept `--as-of <iso>` for historical reads.

## local development

```bash
bun install
bun run knb -- init --json
bun run knb -- status --json
```

Run the checks:

```bash
bun test
bun run typecheck
```

## library usage

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
        scope: { profiles: ["example"] },
        source: { type: "web_page", title: "Example", uri: "https://example.com" },
        provenance: { acquisition: { method: "manual" } },
      },
    },
  ],
});
```

See [docs/library-usage.md](docs/library-usage.md) for facade methods and examples.

See [docs/design/agent-first-cli.md](docs/design/agent-first-cli.md) for the full command surface, output envelopes, and lifecycle model.

## profile ideas

Profiles are meant to be cheap to create. A few useful shapes:

- `research.v1`: sources, claims, open questions, synthesis, and citation cleanup.
- `decision_map.v1`: options, constraints, tradeoffs, risks, decisions, and reversals.
- `workflow.v1`: tasks, dependencies, handoff notes, blockers, and verification gates.
- `dialogue_tree.v1`: scenes, speakers, choices, conditions, and consequences.
- `game_lore.v1`: entities, locations, quests, canon facts, contradictions, and retcons.
- `trade_map.v1`: predictions, evidence, conditions, signals, and time-scoped assessments.
- `incident_review.v1`: timeline events, hypotheses, evidence, mitigations, and follow-up work.

The same primitive can support a knowledge base, a graph, a decision tree, or an agent workflow because the ledger stays general and the profile supplies the domain vocabulary.
