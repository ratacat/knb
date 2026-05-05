import { readFile } from "node:fs/promises";
import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  repoPath,
  stripComments,
} from "./_helpers";

const CLI_FILE = "src/cli.ts";

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
  "src/core/source-citations.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
];

const CURRENT_DOC_FILES = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "README.md",
  "knb/README.md",
  "research.md",
  "docs/library-usage.md",
  "docs/migration-and-rollback.md",
  "docs/design/agent-first-cli.md",
  "docs/design/context-scoring-spike.md",
  "docs/design/pro-refactor.md",
];

const LEGACY_DISPATCH_PATTERNS: Array<{ label: string; rx: RegExp }> = [
  { label: 'command === "validate"', rx: /\bcommand\s*===\s*["']validate["']/g },
  { label: 'command === "append"', rx: /\bcommand\s*===\s*["']append["']/g },
  { label: 'case "validate":', rx: /\bcase\s+["']validate["']\s*:/g },
  { label: 'case "append":', rx: /\bcase\s+["']append["']\s*:/g },
  { label: '"validate":', rx: /["']validate["']\s*:/g },
  { label: '"append":', rx: /["']append["']\s*:/g },
];

const LEGACY_DOC_COMMAND_PATTERNS: Array<{ label: string; rx: RegExp }> = [
  { label: "bun run knb -- validate", rx: /bun\s+run\s+knb\s+--\s+validate\b/g },
  { label: "bun run knb -- append", rx: /bun\s+run\s+knb\s+--\s+append\b/g },
  { label: "knb validate", rx: /(?<!bun\s+run\s+)\bknb\s+validate\b/g },
  { label: "knb append", rx: /(?<!bun\s+run\s+)\bknb\s+append\b/g },
];

const KB_SHORTHAND_PATTERNS: Array<{ label: string; rx: RegExp }> = [
  { label: "export type KB", rx: /\bexport\s+type\s+KB[A-Z_0-9]/g },
  { label: "export const KB", rx: /\bexport\s+const\s+KB[A-Z_0-9]/g },
  { label: "export class KB", rx: /\bexport\s+class\s+KB[A-Z_0-9]/g },
  { label: "export function KB", rx: /\bexport\s+function\s+KB[A-Z_0-9]/g },
  { label: "export interface KB", rx: /\bexport\s+interface\s+KB[A-Z_0-9]/g },
  { label: "import { KB", rx: /\bimport\s*\{\s*KB[A-Z_0-9]/g },
  { label: 'from "kb"', rx: /from\s*["']kb["']/g },
];

const RETIRED_SCOPE_EDGE_PATTERNS: Array<{ label: string; rx: RegExp }> = [
  { label: "collection", rx: /\bcollections?\b/g },
  { label: "relation", rx: /\brelations?\b/g },
  { label: "relate", rx: /\brelate\b/g },
  { label: "scope.collections", rx: /\bscope\.collections\b/g },
  { label: "includeChanges", rx: /\bincludeChanges\b/g },
  { label: "renderCollection", rx: /\brenderCollection\b/g },
  { label: "active-by-collection", rx: /\bactive-by-collection\b/g },
  { label: "ChangeRow", rx: /\bChangeRow\b/g },
  { label: "RelationType", rx: /\bRelationType\b/g },
  { label: "RELATION_TYPES", rx: /\bRELATION_TYPES\b/g },
];

function findPrintHelpBody(stripped: string): string | null {
  const headerPattern = /\bfunction\s+printHelp\s*\([^)]*\)\s*(?::\s*[A-Za-z_$][A-Za-z0-9_$<>|\s,]*\s*)?\{/g;
  const m = headerPattern.exec(stripped);
  if (m === null) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < stripped.length && depth > 0) {
    const ch = stripped[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return stripped.slice(start, i - 1);
}

function stripHtmlComments(markdown: string): string {
  return markdown.replace(/<!--[\s\S]*?-->/g, "");
}

async function readMarkdownIfExists(rel: string): Promise<string | null> {
  try {
    const path = repoPath(rel);
    return await readFile(path, "utf8");
  } catch {
    return null;
  }
}

describe("legacy command and naming cleanup (bd-2f7.6)", () => {
  test("src/cli.ts contains no legacy command dispatch shapes", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    for (const { label, rx } of LEGACY_DISPATCH_PATTERNS) {
      const matches = findMatches(cli.strippedComments, rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("printHelp() body in src/cli.ts contains no validate/append words", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const body = findPrintHelpBody(cli.stripped);
    expect(body).not.toBeNull();
    const validateMatches = findMatches(body!, /\bvalidate\b/g);
    const appendMatches = findMatches(body!, /\bappend\b/g);
    expect(validateMatches).toEqual([]);
    expect(appendMatches).toEqual([]);
  });

  test("README.md contains no legacy command examples", async () => {
    const raw = await readMarkdownIfExists("README.md");
    expect(raw).not.toBeNull();
    const text = stripHtmlComments(raw!);
    const violations: string[] = [];
    for (const { label, rx } of LEGACY_DOC_COMMAND_PATTERNS) {
      const matches = findMatches(text, rx);
      if (matches.length > 0) {
        violations.push(`README.md: forbidden "${label}" (${matches.length}x)`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("AGENTS.md contains no legacy command examples", async () => {
    const raw = await readMarkdownIfExists("AGENTS.md");
    expect(raw).not.toBeNull();
    const text = stripHtmlComments(raw!);
    const violations: string[] = [];
    for (const { label, rx } of LEGACY_DOC_COMMAND_PATTERNS) {
      const matches = findMatches(text, rx);
      if (matches.length > 0) {
        violations.push(`AGENTS.md: forbidden "${label}" (${matches.length}x)`);
      }
    }
    expect(violations).toEqual([]);
  });

  test("docs/library-usage.md contains no validate/append command mentions", async () => {
    const raw = await readMarkdownIfExists("docs/library-usage.md");
    if (raw === null) return;
    const text = stripHtmlComments(raw);
    const violations: string[] = [];
    for (const { label, rx } of LEGACY_DOC_COMMAND_PATTERNS) {
      const matches = findMatches(text, rx);
      if (matches.length > 0) {
        violations.push(`docs/library-usage.md: forbidden "${label}" (${matches.length}x)`);
      }
    }
    const validateMatches = findMatches(text, /\bvalidate\b/g);
    const appendMatches = findMatches(text, /\bappend\b/g);
    if (validateMatches.length > 0) {
      violations.push(`docs/library-usage.md: forbidden bare 'validate' (${validateMatches.length}x)`);
    }
    if (appendMatches.length > 0) {
      violations.push(`docs/library-usage.md: forbidden bare 'append' (${appendMatches.length}x)`);
    }
    expect(violations).toEqual([]);
  });

  test("no src/ file uses KB shorthand as exported identifier prefix", async () => {
    const files = await readSourceFiles(SRC_FILES);
    const violations: string[] = [];
    for (const file of files) {
      for (const { label, rx } of KB_SHORTHAND_PATTERNS) {
        const matches = findMatches(file.strippedComments, rx);
        if (matches.length > 0) {
          violations.push(describeViolations(file, label, matches));
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("PascalCase Knb prefix is allowed (sanity check on the KB shorthand scanner)", () => {
    const benign = `export type KnbRow = { kind: string };\nexport const KnbVersion = "v1";`;
    const scanned = stripComments(benign);
    for (const { rx } of KB_SHORTHAND_PATTERNS) {
      rx.lastIndex = 0;
      const matches = findMatches(scanned, rx);
      expect(matches).toEqual([]);
    }
  });

  test("kb.v1 schema string does not appear in src/", async () => {
    const files = await readSourceFiles(SRC_FILES);
    const violations: string[] = [];
    const pattern = /kb\.v1/g;
    for (const file of files) {
      const matches = findMatches(file.text, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "kb.v1", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("current source and docs do not reintroduce retired collection/relation terminology", async () => {
    const srcFiles = await readSourceFiles(SRC_FILES);
    const violations: string[] = [];
    for (const file of srcFiles) {
      for (const { label, rx } of RETIRED_SCOPE_EDGE_PATTERNS) {
        const matches = findMatches(file.strippedComments, rx);
        if (matches.length > 0) {
          violations.push(describeViolations(file, label, matches));
        }
      }
    }

    for (const rel of CURRENT_DOC_FILES) {
      const raw = await readMarkdownIfExists(rel);
      if (raw === null) continue;
      const text = stripHtmlComments(raw);
      for (const { label, rx } of RETIRED_SCOPE_EDGE_PATTERNS) {
        const matches = findMatches(text, rx);
        if (matches.length > 0) {
          violations.push(`${rel}: forbidden "${label}" (${matches.length}x)`);
        }
      }
    }

    expect(violations).toEqual([]);
  });

  test("scanner detects forbidden case dispatch in negative fixture", () => {
    const bad = `switch (command) {\n  case "validate":\n    return runLegacyValidate();\n  case "apply":\n    return runApply();\n}`;
    const stripped = stripComments(bad);
    const matches = findMatches(stripped, /\bcase\s+["']validate["']\s*:/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden 'bun run knb -- append' in markdown negative fixture", () => {
    const bad = "Run `bun run knb -- append --file row.json` to add a row.";
    const matches = findMatches(bad, /bun\s+run\s+knb\s+--\s+append\b/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden 'export type KB_Row' in TS negative fixture", () => {
    const bad = `export type KB_Row = { kind: string };`;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bexport\s+type\s+KB[A-Z_0-9]/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden kb.v1 string in negative fixture", () => {
    const bad = `const SCHEMA = "kb.v1";`;
    const matches = findMatches(bad, /kb\.v1/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects retired relation terminology in negative fixture", () => {
    const bad = "scope.collections and RelationType should not come back.";
    const collectionMatches = findMatches(bad, /\bscope\.collections\b/g);
    const relationMatches = findMatches(bad, /\bRelationType\b/g);
    expect(collectionMatches.length).toBe(1);
    expect(relationMatches.length).toBe(1);
  });
});
