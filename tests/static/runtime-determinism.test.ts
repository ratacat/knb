import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripCommentsAndStrings,
} from "./_helpers";

const RUNTIME_OWNER = "src/core/knb.ts";

const FORBIDDEN_FILES = [
  "src/core/contract.ts",
  "src/core/apply.ts",
  "src/core/state.ts",
  "src/core/query.ts",
  "src/core/context.ts",
  "src/core/read-snapshot.ts",
  "src/core/ledger.ts",
  "src/core/workspace.ts",
  "src/core/output.ts",
  "src/core/errors.ts",
];

const PROJECTIONS_FILE = "src/core/projections.ts";

describe("runtime determinism (bd-1em.7)", () => {
  test("core modules do not call new Date() with no arguments", async () => {
    const files = await readSourceFiles(FORBIDDEN_FILES);
    const violations: string[] = [];
    const pattern = /\bnew\s+Date\s*\(\s*\)/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "new Date()", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call Date.now()", async () => {
    const files = await readSourceFiles(FORBIDDEN_FILES);
    const violations: string[] = [];
    const pattern = /\bDate\s*\.\s*now\s*\(/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "Date.now(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call Math.random()", async () => {
    const files = await readSourceFiles([...FORBIDDEN_FILES, PROJECTIONS_FILE]);
    const violations: string[] = [];
    const pattern = /\bMath\s*\.\s*random\s*\(/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "Math.random(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call crypto.randomBytes / randomUUID directly", async () => {
    const files = await readSourceFiles([...FORBIDDEN_FILES, PROJECTIONS_FILE]);
    const violations: string[] = [];
    const patterns: Array<{ label: string; rx: RegExp }> = [
      { label: "crypto.randomBytes(", rx: /\bcrypto\s*\.\s*randomBytes\s*\(/g },
      { label: "crypto.randomUUID(", rx: /\bcrypto\s*\.\s*randomUUID\s*\(/g },
      { label: "randomBytes( (bare)", rx: /(?<!\bcrypto\s*\.\s*)\brandomBytes\s*\(/g },
      { label: "randomUUID( (bare)", rx: /(?<!\bcrypto\s*\.\s*)\brandomUUID\s*\(/g },
    ];
    for (const file of files) {
      for (const p of patterns) {
        const matches = findMatches(file.stripped, p.rx);
        if (matches.length > 0) {
          violations.push(describeViolations(file, p.label, matches));
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("runtime owner is the only core file that constructs the default clock and randomness", async () => {
    const files = await readSourceFiles([RUNTIME_OWNER]);
    const owner = files[0]!;
    const clockMatches = findMatches(owner.stripped, /\bnew\s+Date\s*\(\s*\)/g);
    const randomMatches = findMatches(owner.stripped, /\brandomBytes\s*\(/g);
    expect(clockMatches.length).toBeGreaterThan(0);
    expect(randomMatches.length).toBeGreaterThan(0);
  });

  test("apply pipeline only constructs Date from injected request inputs", async () => {
    const files = await readSourceFiles(["src/core/apply.ts"]);
    const apply = files[0]!;
    const noArgMatches = findMatches(apply.stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(noArgMatches.length).toBe(0);
    const argMatches = findMatches(apply.stripped, /\bnew\s+Date\s*\(\s*[^)\s]/g);
    expect(argMatches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden no-arg new Date() in negative fixture", () => {
    const bad = `
      export function nowIso(): string {
        return new Date().toISOString();
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden Date.now() in negative fixture", () => {
    const bad = `const start = Date.now();`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bDate\s*\.\s*now\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden Math.random() in negative fixture", () => {
    const bad = `const r = Math.random();`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bMath\s*\.\s*random\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner does not flag new Date(stringExpr) used for parsing", () => {
    const benign = `const parsed = new Date(input); const cloned = new Date(parsed.getTime());`;
    const stripped = stripCommentsAndStrings(benign);
    const noArg = findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(noArg.length).toBe(0);
  });

  test("scanner ignores Date mentions inside comments and strings", () => {
    const benign = `
      // call new Date() somewhere else
      /* Date.now() in a block comment */
      const docs = "Math.random() and crypto.randomBytes()";
    `;
    const stripped = stripCommentsAndStrings(benign);
    expect(findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g).length).toBe(0);
    expect(findMatches(stripped, /\bDate\s*\.\s*now\s*\(/g).length).toBe(0);
    expect(findMatches(stripped, /\bMath\s*\.\s*random\s*\(/g).length).toBe(0);
    expect(findMatches(stripped, /\brandomBytes\s*\(/g).length).toBe(0);
  });
});
