import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
  stripCommentsAndStrings,
} from "./_helpers";

const READ_SIDE_FILES = [
  "src/core/query.ts",
  "src/core/context.ts",
  "src/core/projections.ts",
  "src/core/knb.ts",
];

const LIFECYCLE_OWNERS = new Set([
  "src/core/state.ts",
  "src/core/contract.ts",
  "src/core/apply.ts",
]);

const LIFECYCLE_SCAN = [
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

describe("read-side EffectiveState boundaries (bd-3p9.6)", () => {
  test("read-side modules do not call loadLedger directly", async () => {
    const files = await readSourceFiles(READ_SIDE_FILES);
    const violations: string[] = [];
    const pattern = /\bloadLedger\s*\(/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "loadLedger(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("read-side modules do not import loadLedger from ./ledger", async () => {
    const files = await readSourceFiles(READ_SIDE_FILES);
    const violations: string[] = [];
    const pattern = /import\s*(?!type\b)[^;]*\bloadLedger\b[^;]*from\s*["']\.\/ledger["']/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "import loadLedger from './ledger'", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("query module does not stringify rows for substring search", async () => {
    const files = await readSourceFiles(["src/core/query.ts"]);
    const query = files[0]!;
    const stringifyMatches = findMatches(
      query.stripped,
      /\bJSON\s*\.\s*stringify\s*\(\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\.\s*row\b/g,
    );
    expect(stringifyMatches).toEqual([]);
    const bareRowStringify = findMatches(
      query.stripped,
      /\bJSON\s*\.\s*stringify\s*\(\s*row\s*\)/g,
    );
    expect(bareRowStringify).toEqual([]);
  });

  test("read-side modules do not branch on raw entry.action lifecycle values", async () => {
    const files = await readSourceFiles(LIFECYCLE_SCAN);
    const violations: string[] = [];
    const pattern = /\baction\s*===\s*["'](retract|supersede|merge)["']/g;
    for (const file of files) {
      const isOwner = [...LIFECYCLE_OWNERS].some((p) => file.path.endsWith(p));
      if (isOwner) continue;
      const matches = findMatches(file.strippedComments, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, 'action === "retract|supersede|merge"', matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("facade read methods consume read snapshots", async () => {
    const files = await readSourceFiles(["src/core/knb.ts"]);
    const facade = files[0]!;
    const text = facade.stripped;
    const methods = ["status", "get", "query", "context", "render", "check", "rebuildIndex"];
    const missing: string[] = [];
    for (const name of methods) {
      const methodPattern = new RegExp(
        `\\basync\\s+${name}\\s*\\([^)]*\\)\\s*:\\s*Promise<[^>]+>\\s*\\{`,
        "g",
      );
      const m = methodPattern.exec(text);
      if (m === null) {
        missing.push(`could not locate facade method ${name}`);
        continue;
      }
      const start = m.index + m[0].length;
      let depth = 1;
      let i = start;
      while (i < text.length && depth > 0) {
        const ch = text[i];
        if (ch === "{") depth += 1;
        else if (ch === "}") depth -= 1;
        i += 1;
      }
      const body = text.slice(start, i - 1);
      if (!/\breadSnapshot\s*\(/.test(body)) {
        missing.push(`facade method ${name} does not call readSnapshot(`);
      }
    }
    expect(missing).toEqual([]);
  });

  test("only read-snapshot, ledger, and apply modules invoke loadLedger", async () => {
    const files = await readSourceFiles([
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
    ]);
    const allowed = new Set([
      "src/core/ledger.ts",
      "src/core/read-snapshot.ts",
      "src/core/apply.ts",
    ]);
    const violations: string[] = [];
    const pattern = /\bloadLedger\s*\(/g;
    for (const file of files) {
      const isAllowed = [...allowed].some((p) => file.path.endsWith(p));
      if (isAllowed) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "loadLedger(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("scanner detects forbidden loadLedger usage in negative fixture", () => {
    const bad = `
      import { loadLedger } from "./ledger";
      export async function rogue(path: string) {
        const snap = await loadLedger({ path });
        return snap.rows.length;
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bloadLedger\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden raw lifecycle branch in negative fixture", () => {
    const bad = `
      function rogue(entry: { action: string }) {
        if (entry.action === "retract") return "stale";
        if (entry.action === "supersede") return "stale";
        if (entry.action === "merge") return "stale";
        return "active";
      }
    `;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\baction\s*===\s*["'](retract|supersede|merge)["']/g);
    expect(matches.length).toBe(3);
  });

  test("scanner detects forbidden JSON.stringify(row) in query negative fixture", () => {
    const bad = `
      function rogue(rows: Array<{ row: unknown }>) {
        return rows.filter((r) => JSON.stringify(r.row).includes("foo"));
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(
      stripped,
      /\bJSON\s*\.\s*stringify\s*\(\s*[A-Za-z_$][A-Za-z0-9_$]*\s*\.\s*row\b/g,
    );
    expect(matches.length).toBe(1);
  });
});
