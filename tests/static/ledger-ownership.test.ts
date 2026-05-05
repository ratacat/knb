import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripCommentsAndStrings,
} from "./_helpers";

const LEDGER_OWNER = "src/core/ledger.ts";
const PROJECTIONS_OWNER = "src/core/projections.ts";

const SCANNED_FILES = [
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
  "src/cli.ts",
  "src/index.ts",
];

describe("ledger storage ownership (bd-3p4.5)", () => {
  test("only the ledger module appends to ledger.jsonl", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const pattern = /append(File|FileSync)\s*\([^)]*ledger/g;
    for (const file of files) {
      if (file.path.endsWith(LEDGER_OWNER)) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "appendFile(... ledger ...)", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only the ledger module imports raw fs append/write/unlink targeting ledger paths", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const appendPattern = /\bappendFile(Sync)?\s*\(/g;
    const unlinkPattern = /\bunlink\s*\(/g;
    for (const file of files) {
      if (file.path.endsWith(LEDGER_OWNER)) continue;
      const appendMatches = findMatches(file.stripped, appendPattern);
      if (appendMatches.length > 0) {
        violations.push(describeViolations(file, "appendFile(", appendMatches));
      }
      const unlinkMatches = findMatches(file.stripped, unlinkPattern);
      if (unlinkMatches.length > 0) {
        violations.push(describeViolations(file, "unlink(", unlinkMatches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only ledger and projection owner modules write artifacts via writeFile in core", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const pattern = /\bwriteFile\s*\(/g;
    const allowed = new Set([
      LEDGER_OWNER,
      PROJECTIONS_OWNER,
      "src/core/knb.ts",
    ]);
    for (const file of files) {
      if (!file.path.includes("/src/core/")) continue;
      const isAllowed = [...allowed].some((p) => file.path.endsWith(p));
      if (isAllowed) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "writeFile(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("ledger module owns the ledger append helper", async () => {
    const files = await readSourceFiles([LEDGER_OWNER]);
    const ledger = files[0]!;
    const matches = findMatches(ledger.stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden append in negative fixture", () => {
    const bad = `
      import { appendFile } from "node:fs/promises";
      export async function rogue(path: string) {
        await appendFile(path, "data\\n", "utf8");
        await appendFile(path, "more\\n", "utf8");
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(2);
  });

  test("scanner ignores appendFile mentions inside comments", () => {
    const benign = `
      // this comment talks about appendFile(ledgerPath) for context
      /* appendFile(otherPath) */
      export const note = "appendFile usage";
    `;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(0);
  });

  test("scanner ignores appendFile mentions inside string literals", () => {
    const benign = `const description = "we never call appendFile(ledger.jsonl)";`;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(0);
  });
});
