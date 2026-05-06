# knb [knowledge base]

A flexible interface for project-local knowledge bases, graph workflows, and structured reasoning.

`knb` lets you create any number of custom, domain-specific knowledge bases inside one project folder. Use one instance for research, another for decisions, another for workflow state, game lore, incident timelines, or any other structure a profile defines.

Each instance is an append-only ledger with sources, timestamps, open questions, relationships, and synthesis. The CLI and library give every caller the same write path, so records stay structured instead of becoming loose notes or hand-edited JSON.

Profiles give each knowledge base its domain design: record types, link types, required fields, metadata, and instructions for how to work with the data. That makes `knb` a small temporal scaffold for reasoning: later work can see what was learned, when it changed, what is still uncertain, and how the current view was built.

## quick start with an AI

Install `knb`:

```bash
curl -fsSL https://raw.githubusercontent.com/ratacat/knb/main/scripts/install.sh | bash
```

The installer keeps a checkout in `~/.knb/knb-cli` and writes a `knb` launcher into a directory on your `PATH`. It installs Bun if Bun is missing. Rerun the same command to update.

Check the install:

```bash
knb help
```

Then open your project folder with an AI coding agent and give it a prompt like this:

```text
Use knb in this project as the knowledge system for <purpose>.

First inspect `knb help`, then initialize the workspace if needed.
Run commands from the project directory you want to use as the workspace.
Use `--instance <id>` when the project has more than one knowledge base.
Design a custom profile for this purpose, including record types, link types,
required fields, and agent_instructions.

Before writing anything, ask me 3-5 questions that would change the profile.
After I answer, create and attach the profile, then use `knb status`,
`knb context`, `knb apply --atomic`, `knb index --rebuild`, `knb render`,
and `knb check` to keep the knowledge base structured and auditable.

Prefer small sourced records, explicit open questions, and short synthesis.
Do not edit instance ledger files directly.
```

When you run `knb init` without `--root`, it initializes the current working directory and the selected instance. That creates project config in `<project-root>/.knb/config.json` and canonical knowledge storage for that instance.

## what knb provides

`knb` gives each knowledge base a few stable parts:

- Ledgers: one append-only JSONL file per instance. The default `main` instance uses `<project-root>/knb/ledger.jsonl`; additional instances use `<project-root>/knb/instances/<id>/ledger.jsonl`.
- Records: small sourced units of knowledge, open questions, and synthesis, with changes tracked by append-only entries.
- Profiles: named vocabularies and rules for a domain, with optional operating instructions.
- Instances: named knowledge bases inside one project folder, each with its own ledger, profiles, views, and indexes.
- Views and indexes: disposable projections rebuilt from the ledger.

The intended workflow: install `knb`, create or select an instance, design a profile for the job, then write, check, query, and render structured knowledge through the same interface.

The loop is usually:

1. Initialize an instance in the current project folder.
2. Create or attach a profile for the job.
3. Read orientation with `status` and `context`.
4. Write one atomic batch with `apply`.
5. Render views or rebuild indexes when another reader needs projected output.
6. Run `check`.

The ledger is append-only on purpose. If a record is wrong, write an `entry` row that retracts or supersedes it. Later readers get the full trail instead of a silently edited note.

Reads come from the effective state, not raw file scans. Queries, `context` output, renders, and profile summaries respect retractions, supersession, merges, and historical `--as-of` cutoffs. That history gives later reasoning a timeline: what was known, when it changed, what replaced it, and what remains unresolved.

## base profile

`knb.v1` is the base storage model every profile builds on. It comes set up for sourced knowledge, open uncertainty, synthesis, and lifecycle history:

- `source`: where knowledge came from
- `claim`: legacy storage kind for the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `entry`: append-only ledger mutation for retractions, supersession, merges, links, and repairs

`record` is the preferred domain term for a knowledge card. Current storage still exposes the legacy row kinds above.

Only instance ledger files are canonical. `views/` and `indexes/` directories are generated projections. Delete and rebuild them when they get stale.

```text
<project-root>/
  .knb/
    config.json
    profiles/
  knb/
    ledger.jsonl
    schema.json
    views/
    indexes/
    instances/
      research/
        ledger.jsonl
        schema.json
        views/
        indexes/
```

## profiles and extensibility

Profiles make `knb` modular. A profile can define:

- `display_name` and `description`
- `record_types` for domain-specific records
- `link_types` for typed relationships between records
- `required_fields` for profile-specific validation
- `agent_instructions` for profile-specific operating rules
- `metadata` for local conventions

One project can hold multiple instances. One instance can attach multiple profiles, so each knowledge base can expose the vocabulary it needs without mixing ledgers.

Some possibilities:

- `research.v1`: sources, claims, open questions, synthesis, and citation cleanup.
- `decision_map.v1`: options, constraints, tradeoffs, risks, decisions, and reversals.
- `workflow.v1`: tasks, dependencies, handoff notes, blockers, and verification gates.
- `dialogue_tree.v1`: scenes, speakers, choices, conditions, and consequences.
- `game_lore.v1`: entities, locations, quests, canon facts, contradictions, and retcons.
- `trade_map.v1`: predictions, evidence, conditions, signals, and time-scoped assessments.
- `incident_review.v1`: timeline events, hypotheses, evidence, mitigations, and follow-up work.

The same primitive can support a knowledge base, a graph, a decision tree, or a workflow model because the ledger stays general and the profile supplies the domain vocabulary.

## cli example

These commands show the normal lifecycle after a profile exists.

Create the default `main` instance:

```bash
knb init --json
```

Create another instance in the same project:

```bash
knb instance create research --profile research.v1 --json
knb status --instance research --json
```

Upgrade an older single-instance workspace:

```bash
knb migrate --dry-run --json
knb migrate --json
```

`knb help` also checks the current folder and prints a migration notice when it detects the old layout.

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

## command surface

```bash
knb <command> [--root <dir>] [--instance <id>] [--config <path>] [--ledger <path>] [--json]
knb init    [--actor <name>] [--force]
knb migrate [--dry-run]
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
knb instance show|create <id>|list|set|use <id>|attach-profile|detach-profile|delete
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

See [docs/library-usage.md](docs/library-usage.md) for facade methods and examples. Run `knb help` for the current command surface and output modes.
