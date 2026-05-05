import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
  stripCommentsAndStrings,
} from "./_helpers";

const APPLY_OWNER = "src/core/apply.ts";
const FACADE = "src/core/knb.ts";
const CLI_FILE = "src/cli.ts";

const CORE_SCAN = [
  "src/core/apply.ts",
  "src/core/contract.ts",
  "src/core/context.ts",
  "src/core/errors.ts",
  "src/core/knb.ts",
  "src/core/ledger.ts",
  "src/core/output.ts",
  "src/core/projections.ts",
  "src/core/query.ts",
  "src/core/read-snapshot.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
];

function findMethodBody(text: string, methodName: string): string | null {
  const headerPattern = new RegExp(
    `\\basync\\s+${methodName}\\s*\\([^)]*\\)\\s*(?::\\s*Promise<[^>]+>\\s*)?\\{`,
    "g",
  );
  const m = headerPattern.exec(text);
  if (m === null) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return text.slice(start, i - 1);
}

describe("apply and add write-path ownership (bd-3p4.6)", () => {
  test("only src/core/apply.ts imports writeLedger from ./ledger", async () => {
    const files = await readSourceFiles(CORE_SCAN);
    const violations: string[] = [];
    const pattern =
      /import\s*(?!type\b)[^;]*\bwriteLedger\b[^;]*from\s*["']\.\/ledger["']/g;
    for (const file of files) {
      if (file.path.endsWith(APPLY_OWNER)) continue;
      const matches = findMatches(file.strippedComments, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "import writeLedger from './ledger'", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only src/core/apply.ts calls writeLedger directly", async () => {
    const files = await readSourceFiles(CORE_SCAN);
    const violations: string[] = [];
    const pattern = /\bwriteLedger\s*\(/g;
    for (const file of files) {
      if (file.path.endsWith(APPLY_OWNER)) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "writeLedger(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("facade add method delegates to apply via applyOperations or facade.apply", async () => {
    const files = await readSourceFiles([FACADE]);
    const facade = files[0]!;
    const body = findMethodBody(facade.stripped, "add");
    expect(body).not.toBeNull();
    const callsApply =
      /\bapplyOperations\s*\(/.test(body!) ||
      /\b(?:this|facade)\s*\.\s*apply\s*\(/.test(body!) ||
      /\.apply\s*\(\s*\{/.test(body!);
    expect(callsApply).toBe(true);
  });

  test("facade add method does not import or call writeLedger / appendFile", async () => {
    const files = await readSourceFiles([FACADE]);
    const facade = files[0]!;
    const body = findMethodBody(facade.stripped, "add");
    expect(body).not.toBeNull();
    expect(/\bwriteLedger\s*\(/.test(body!)).toBe(false);
    expect(/\bappendFile\s*\(/.test(body!)).toBe(false);
  });

  test("cli.ts does not construct entry rows directly", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    const stringSensitive: Array<{ label: string; rx: RegExp }> = [
      { label: 'kind: "entry"', rx: /\bkind\s*:\s*["']entry["']/g },
    ];
    const codeOnly: Array<{ label: string; rx: RegExp }> = [
      { label: "applyOperations(", rx: /\bapplyOperations\s*\(/g },
      { label: "writeLedger(", rx: /\bwriteLedger\s*\(/g },
    ];
    for (const p of stringSensitive) {
      const matches = findMatches(cli.strippedComments, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    for (const p of codeOnly) {
      const matches = findMatches(cli.stripped, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts does not reintroduce a legacy append command in dispatcher", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    const stringSensitive: Array<{ label: string; rx: RegExp }> = [
      { label: 'command === "append"', rx: /\bcommand\s*===\s*["']append["']/g },
      { label: 'case "append":', rx: /\bcase\s+["']append["']\s*:/g },
      { label: '"append":', rx: /["']append["']\s*:/g },
    ];
    const codeOnly: Array<{ label: string; rx: RegExp }> = [
      { label: "commands.append", rx: /\bcommands\s*\.\s*append\b/g },
    ];
    for (const p of stringSensitive) {
      const matches = findMatches(cli.strippedComments, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    for (const p of codeOnly) {
      const matches = findMatches(cli.stripped, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("apply owner contains the writeLedger call site", async () => {
    const files = await readSourceFiles([APPLY_OWNER]);
    const apply = files[0]!;
    const matches = findMatches(apply.stripped, /\bwriteLedger\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden writeLedger import in negative fixture", () => {
    const bad = `
      import { writeLedger } from "./ledger";
      export async function rogue() {
        return writeLedger({} as never);
      }
    `;
    const scanned = stripComments(bad);
    const importMatches = findMatches(
      scanned,
      /import\s*(?!type\b)[^;]*\bwriteLedger\b[^;]*from\s*["']\.\/ledger["']/g,
    );
    expect(importMatches.length).toBe(1);
  });

  test("scanner detects forbidden case \"append\" in negative fixture", () => {
    const bad = `
      switch (command) {
        case "append":
          return runAppend(args);
        default:
          return null;
      }
    `;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bcase\s+["']append["']\s*:/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden entry-row construction in negative fixture", () => {
    const bad = `
      const row = { kind: "entry", action: "retract", target_id: id };
    `;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bkind\s*:\s*["']entry["']/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden direct writeLedger call in negative fixture", () => {
    const bad = `await writeLedger({ candidates, snapshot });`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bwriteLedger\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner ignores append mentions inside string literals and comments", () => {
    const benign = `
      // case "append": legacy
      const help = "old: case \\"append\\": handler";
    `;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bcase\s+["']append["']\s*:/g);
    expect(matches.length).toBe(0);
  });
});
