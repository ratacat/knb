import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
} from "./_helpers";

const SRC_FILES = [
  "src/cli.ts",
  "src/index.ts",
  "src/core/apply.ts",
  "src/core/context.ts",
  "src/core/contract.ts",
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

const TEST_FILES = [
  "tests/apply.test.ts",
  "tests/cli.test.ts",
  "tests/context.test.ts",
  "tests/contract.test.ts",
  "tests/errors.test.ts",
  "tests/facade.test.ts",
  "tests/ledger.test.ts",
  "tests/output.test.ts",
  "tests/projections.test.ts",
  "tests/query.test.ts",
  "tests/read-side.test.ts",
  "tests/state.test.ts",
  "tests/validator.test.ts",
  "tests/wiring.test.ts",
  "tests/workspace.test.ts",
  "tests/write-path-validation.test.ts",
];

const FORBIDDEN_LEGACY_MODULE_SPECIFIERS = new Set([
  "./types",
  "./knb",
  "../types",
  "../knb",
  "src/types",
  "src/knb",
]);

const SCHEMA_OWNER = "src/core/contract.ts";

type ImportSpec = {
  module: string;
  raw: string;
};

function extractImports(stripped: string): ImportSpec[] {
  const out: ImportSpec[] = [];
  const pattern =
    /import\s+(?:type\s+)?(?:\{[^}]*\}|\*\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*|[A-Za-z_$][A-Za-z0-9_$]*)?\s*(?:,\s*\{[^}]*\})?\s*from\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(stripped)) !== null) {
    out.push({ module: m[1] ?? "", raw: m[0] });
  }
  const sideEffectPattern = /import\s*["']([^"']+)["']/g;
  while ((m = sideEffectPattern.exec(stripped)) !== null) {
    out.push({ module: m[1] ?? "", raw: m[0] });
  }
  return out;
}

describe("contract and schema ownership (bd-1em.6)", () => {
  test("no src/ file imports from removed legacy modules", async () => {
    const files = await readSourceFiles(SRC_FILES);
    const violations: string[] = [];
    for (const file of files) {
      const imports = extractImports(file.strippedComments);
      for (const spec of imports) {
        if (FORBIDDEN_LEGACY_MODULE_SPECIFIERS.has(spec.module)) {
          violations.push(
            `${file.path}: forbidden legacy import "${spec.module}" -> ${spec.raw.trim()}`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("no tests/ file imports from removed legacy modules", async () => {
    const files = await readSourceFiles(TEST_FILES);
    const violations: string[] = [];
    for (const file of files) {
      const imports = extractImports(file.strippedComments);
      for (const spec of imports) {
        if (FORBIDDEN_LEGACY_MODULE_SPECIFIERS.has(spec.module)) {
          violations.push(
            `${file.path}: forbidden legacy import "${spec.module}" -> ${spec.raw.trim()}`,
          );
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("only src/core/contract.ts exports validateLedger", async () => {
    const files = await readSourceFiles(SRC_FILES);
    const exporters: string[] = [];
    const exportPattern =
      /export\s+(?:function|const|let|var)\s+validateLedger\b/g;
    for (const file of files) {
      const matches = findMatches(file.strippedComments, exportPattern);
      if (matches.length > 0) {
        exporters.push(file.path);
      }
    }
    expect(exporters.length).toBe(1);
    expect(exporters[0]!.endsWith(SCHEMA_OWNER)).toBe(true);
  });

  test("schema sync test references both jsonSchema() and on-disk knb/schema.json", async () => {
    const files = await readSourceFiles(TEST_FILES);
    let foundSyncTest = false;
    for (const file of files) {
      const hasJsonSchemaCall = /\bjsonSchema\s*\(/.test(file.strippedComments);
      const hasSchemaPath = /knb\/schema\.json/.test(file.text);
      if (hasJsonSchemaCall && hasSchemaPath) {
        foundSyncTest = true;
        break;
      }
    }
    expect(foundSyncTest).toBe(true);
  });

  test("only src/core/contract.ts and src/core/knb.ts may reference knb/schema.json (workspace.ts owns the path constant)", async () => {
    const files = await readSourceFiles(SRC_FILES);
    const allowed = new Set([
      "src/core/contract.ts",
      "src/core/knb.ts",
      "src/core/workspace.ts",
    ]);
    const violations: string[] = [];
    const pattern = /schema\.json/g;
    for (const file of files) {
      const isAllowed = [...allowed].some((p) => file.path.endsWith(p));
      if (isAllowed) continue;
      const matches = findMatches(file.text, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "schema.json", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("scanner detects forbidden legacy import in negative fixture", () => {
    const bad = `import { KnbRow } from "./types";\nimport { validateLedger } from "../knb";`;
    const scanned = stripComments(bad);
    const imports = extractImports(scanned);
    const offending = imports.filter((spec) =>
      FORBIDDEN_LEGACY_MODULE_SPECIFIERS.has(spec.module),
    );
    expect(offending.length).toBe(2);
  });

  test("scanner detects rogue validateLedger export in negative fixture", () => {
    const bad = `export function validateLedger(rows: unknown[]): boolean {\n  return rows.length === 0;\n}`;
    const scanned = stripComments(bad);
    const matches = findMatches(
      scanned,
      /export\s+(?:function|const|let|var)\s+validateLedger\b/g,
    );
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden schema.json reference in non-owner negative fixture", () => {
    const bad = `const SCHEMA_DATA = JSON.parse(await readFile("knb/schema.json", "utf8"));`;
    const matches = findMatches(bad, /schema\.json/g);
    expect(matches.length).toBe(1);
  });
});
