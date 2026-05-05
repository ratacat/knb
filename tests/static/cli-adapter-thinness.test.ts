import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
  stripCommentsAndStrings,
} from "./_helpers";

const CLI_FILE = "src/cli.ts";

const ALLOWED_CORE_IMPORTS = new Set([
  "./core/knb",
  "./core/output",
  "./core/errors",
  "./core/workspace",
]);

const FORBIDDEN_LEGACY_IMPORTS = new Set([
  "./knb",
  "./types",
]);

const FORBIDDEN_RUNTIME_CALLS = [
  "loadLedger",
  "validateLedger",
  "effectiveRows",
  "executeQuery",
  "executeGet",
  "buildContext",
  "classifyClaim",
  "applyOperations",
  "renderView",
  "rebuildIndexes",
  "checkFreshness",
];

type ImportSpec = {
  isTypeOnly: boolean;
  module: string;
  raw: string;
};

function extractImports(stripped: string): ImportSpec[] {
  const out: ImportSpec[] = [];
  const pattern = /import\s+(type\s+)?(?:\{[^}]*\}|\*\s+as\s+[A-Za-z_$][A-Za-z0-9_$]*|[A-Za-z_$][A-Za-z0-9_$]*)?\s*(?:,\s*\{[^}]*\})?\s*from\s*["']([^"']+)["']/g;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(stripped)) !== null) {
    out.push({
      isTypeOnly: m[1] !== undefined,
      module: m[2] ?? "",
      raw: m[0],
    });
  }
  const sideEffectPattern = /import\s*["']([^"']+)["']/g;
  while ((m = sideEffectPattern.exec(stripped)) !== null) {
    out.push({
      isTypeOnly: false,
      module: m[1] ?? "",
      raw: m[0],
    });
  }
  return out;
}

function bracedSpecifiers(rawImport: string): string[] | null {
  const open = rawImport.indexOf("{");
  if (open === -1) return null;
  const close = rawImport.indexOf("}", open);
  if (close === -1) return null;
  return rawImport
    .slice(open + 1, close)
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function importIsTypeOnly(spec: ImportSpec): boolean {
  if (spec.isTypeOnly) return true;
  const specifiers = bracedSpecifiers(spec.raw);
  if (specifiers === null) return false;
  if (specifiers.length === 0) return false;
  return specifiers.every((s) => /^type\s+/.test(s));
}

describe("CLI adapter thinness (bd-2f7.5)", () => {
  test("cli.ts does not import from legacy bridge modules", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const imports = extractImports(cli.strippedComments);
    const violations: string[] = [];
    for (const spec of imports) {
      if (FORBIDDEN_LEGACY_IMPORTS.has(spec.module)) {
        violations.push(`${cli.path}: forbidden legacy import "${spec.module}" -> ${spec.raw.trim()}`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts only value-imports from approved core modules", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const imports = extractImports(cli.strippedComments);
    const violations: string[] = [];
    for (const spec of imports) {
      if (!spec.module.startsWith("./core/")) continue;
      if (ALLOWED_CORE_IMPORTS.has(spec.module)) continue;
      if (importIsTypeOnly(spec)) continue;
      violations.push(`${cli.path}: forbidden value import from "${spec.module}" -> ${spec.raw.trim()}`);
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts does not call core pipeline functions directly", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    for (const name of FORBIDDEN_RUNTIME_CALLS) {
      const pattern = new RegExp(`\\b${name}\\s*\\(`, "g");
      const matches = findMatches(cli.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, `${name}(`, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts does not call console.error / console.warn or write to process.std{out,err} directly", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    const patterns: Array<{ label: string; rx: RegExp }> = [
      { label: "console.error(", rx: /\bconsole\s*\.\s*error\s*\(/g },
      { label: "console.warn(", rx: /\bconsole\s*\.\s*warn\s*\(/g },
      { label: "process.stdout.write(", rx: /\bprocess\s*\.\s*stdout\s*\.\s*write\s*\(/g },
      { label: "process.stderr.write(", rx: /\bprocess\s*\.\s*stderr\s*\.\s*write\s*\(/g },
    ];
    for (const p of patterns) {
      const matches = findMatches(cli.stripped, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts opens the facade via openKnb(", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const matches = findMatches(cli.stripped, /\bopenKnb\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("cli.ts dispatches results through render(", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const matches = findMatches(cli.stripped, /\brender\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden value import from a core seam in negative fixture", () => {
    const bad = `import { loadLedger } from "./core/ledger";\nconst x = loadLedger;`;
    const scanned = stripComments(bad);
    const imports = extractImports(scanned);
    const offending = imports.filter(
      (spec) =>
        spec.module.startsWith("./core/") &&
        !ALLOWED_CORE_IMPORTS.has(spec.module) &&
        !importIsTypeOnly(spec),
    );
    expect(offending.length).toBe(1);
  });

  test("scanner detects forbidden legacy bridge import in negative fixture", () => {
    const bad = `import { thing } from "./knb";\nimport type { Other } from "./types";`;
    const scanned = stripComments(bad);
    const imports = extractImports(scanned);
    const offending = imports.filter((spec) => FORBIDDEN_LEGACY_IMPORTS.has(spec.module));
    expect(offending.length).toBe(2);
  });

  test("scanner detects forbidden direct pipeline call in negative fixture", () => {
    const bad = `await applyOperations(req, deps);\nconst snap = await loadLedger({ path });`;
    const stripped = stripCommentsAndStrings(bad);
    const applyMatches = findMatches(stripped, /\bapplyOperations\s*\(/g);
    const loadMatches = findMatches(stripped, /\bloadLedger\s*\(/g);
    expect(applyMatches.length).toBe(1);
    expect(loadMatches.length).toBe(1);
  });

  test("scanner detects forbidden direct console.error in negative fixture", () => {
    const bad = `console.error("oops");\nprocess.stderr.write("oops\\n");`;
    const stripped = stripCommentsAndStrings(bad);
    const errMatches = findMatches(stripped, /\bconsole\s*\.\s*error\s*\(/g);
    const writeMatches = findMatches(stripped, /\bprocess\s*\.\s*stderr\s*\.\s*write\s*\(/g);
    expect(errMatches.length).toBe(1);
    expect(writeMatches.length).toBe(1);
  });

  test("type-only imports from forbidden core modules are accepted", () => {
    const benign = `import type { ApplyRequest } from "./core/contract";`;
    const scanned = stripComments(benign);
    const imports = extractImports(scanned);
    expect(imports.length).toBe(1);
    expect(importIsTypeOnly(imports[0]!)).toBe(true);
  });

  test("mixed imports with all-type specifiers are accepted", () => {
    const benign = `import { type ApplyRequest, type DraftRow } from "./core/contract";`;
    const scanned = stripComments(benign);
    const imports = extractImports(scanned);
    expect(imports.length).toBe(1);
    expect(importIsTypeOnly(imports[0]!)).toBe(true);
  });

  test("mixed imports with any value specifier are rejected", () => {
    const bad = `import { type ApplyRequest, somethingElse } from "./core/contract";`;
    const scanned = stripComments(bad);
    const imports = extractImports(scanned);
    expect(imports.length).toBe(1);
    expect(importIsTypeOnly(imports[0]!)).toBe(false);
  });
});
