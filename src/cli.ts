import {
  DEFAULT_LEDGER_PATH,
  appendRow,
  loadLedger,
  queryRows,
  readJsonInput,
  validateLedger,
  writeRenderedCollection,
  type ValidationResult,
} from "./kb";

type FlagMap = Map<string, string | boolean>;

export async function runCli(args: string[]): Promise<number> {
  const [command, ...rest] = args;
  const flags = parseFlags(rest);
  const ledgerPath = stringFlag(flags, "ledger") ?? DEFAULT_LEDGER_PATH;

  try {
    if (!command || command === "help" || command === "--help" || command === "-h") {
      printHelp();
      return 0;
    }

    if (command === "validate") {
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      printValidation(result);
      return result.ok ? 0 : 1;
    }

    if (command === "append") {
      const row = await readJsonInput({
        file: stringFlag(flags, "file"),
        json: stringFlag(flags, "json"),
      });
      const id = typeof row === "object" && row !== null && "id" in row ? String((row as { id: unknown }).id) : "(unknown)";
      const result = await appendRow(ledgerPath, row);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      console.log(`Appended ${id} to ${ledgerPath}`);
      return 0;
    }

    if (command === "query") {
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      const rows = queryRows(ledger.rows, {
        kind: stringFlag(flags, "kind"),
        collection: stringFlag(flags, "collection"),
        subject: stringFlag(flags, "subject"),
        tag: stringFlag(flags, "tag"),
        text: stringFlag(flags, "text"),
        includeHistory: booleanFlag(flags, "history"),
      });

      if (booleanFlag(flags, "json")) {
        console.log(JSON.stringify(rows, null, 2));
      } else {
        for (const row of rows) {
          console.log(`${row.id}\t${row.kind}\t${displayText(row)}`);
        }
      }
      return 0;
    }

    if (command === "render") {
      const collection = stringFlag(flags, "collection");
      if (!collection) {
        console.error("Missing required flag: --collection");
        return 1;
      }
      const out = stringFlag(flags, "out") ?? `kb/views/${collection}.md`;
      const ledger = await loadLedger(ledgerPath);
      const result = validateLedger(ledger.rows, ledger.parseIssues);
      if (!result.ok) {
        printValidation(result);
        return 1;
      }
      await writeRenderedCollection(out, ledger.rows, collection);
      console.log(`Rendered ${collection} to ${out}`);
      return 0;
    }

    console.error(`Unknown command: ${command}`);
    printHelp();
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseFlags(args: string[]): FlagMap {
  const flags: FlagMap = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (!arg?.startsWith("--")) continue;

    const equalsIndex = arg.indexOf("=");
    if (equalsIndex > -1) {
      flags.set(arg.slice(2, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      flags.set(key, next);
      index += 1;
    } else {
      flags.set(key, true);
    }
  }
  return flags;
}

function stringFlag(flags: FlagMap, key: string): string | undefined {
  const value = flags.get(key);
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanFlag(flags: FlagMap, key: string): boolean {
  return flags.get(key) === true;
}

function printValidation(result: ValidationResult): void {
  if (result.issues.length === 0) {
    console.log("OK");
    return;
  }

  for (const issue of result.issues) {
    const where = [issue.line ? `line ${issue.line}` : undefined, issue.id].filter(Boolean).join(" ");
    const prefix = where ? `${issue.level.toUpperCase()} ${where}:` : `${issue.level.toUpperCase()}:`;
    const output = `${prefix} ${issue.message}`;
    if (issue.level === "error") console.error(output);
    else console.warn(output);
  }

  if (result.ok) console.log("OK");
}

function displayText(row: { kind: string; source?: { title?: string }; claim?: { statement?: string }; question?: { text?: string }; synthesis?: { title?: string } }): string {
  if (row.kind === "source") return row.source?.title ?? "";
  if (row.kind === "claim") return row.claim?.statement ?? "";
  if (row.kind === "question") return row.question?.text ?? "";
  if (row.kind === "synthesis") return row.synthesis?.title ?? "";
  return "";
}

function printHelp(): void {
  console.log(`knowbase

Usage:
  bun run kb -- validate [--ledger kb/ledger.jsonl]
  bun run kb -- append (--file row.json | --json '{"schema_version":"kb.v1",...}') [--ledger kb/ledger.jsonl]
  bun run kb -- query [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--json] [--history]
  bun run kb -- render --collection topic [--out kb/views/topic.md] [--ledger kb/ledger.jsonl]

Commands:
  validate  Check JSONL syntax, row shapes, duplicate IDs, source refs, relation targets, and synthesis basis refs.
  append    Validate the existing ledger plus one candidate row, then append the row.
  query     Return active rows matching filters. Use --history to include superseded, retracted, and duplicate rows.
  render    Generate a Markdown view for one collection.
`);
}

if (import.meta.main) {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}
