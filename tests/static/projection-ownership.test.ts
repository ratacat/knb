import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
  stripCommentsAndStrings,
} from "./_helpers";

const PROJECTIONS_OWNER = "src/core/projections.ts";
const READ_SNAPSHOT = "src/core/read-snapshot.ts";
const FACADE = "src/core/knb.ts";
const CLI_FILE = "src/cli.ts";

const NON_OWNER_SCAN = [
  "src/core/apply.ts",
  "src/core/contract.ts",
  "src/core/context.ts",
  "src/core/errors.ts",
  "src/core/knb.ts",
  "src/core/ledger.ts",
  "src/core/output.ts",
  "src/core/query.ts",
  "src/core/read-snapshot.ts",
  "src/core/run-manifests.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
  "src/cli.ts",
];

const PROJECTION_PATH_FRAGMENTS = ["views", "indexes", ".meta.json"];

function writeFileCallsTargetingFragment(stripped: string, fragment: string) {
  const pattern = new RegExp(
    `\\bwriteFile\\s*\\(\\s*[^)]*${fragment.replace(/\./g, "\\.")}[^)]*\\)`,
    "g",
  );
  return findMatches(stripped, pattern);
}

describe("projection output ownership (bd-txx.6)", () => {
  test("only src/core/projections.ts writes to projection paths (views, indexes, .meta.json)", async () => {
    const files = await readSourceFiles(NON_OWNER_SCAN);
    const violations: string[] = [];
    for (const file of files) {
      for (const fragment of PROJECTION_PATH_FRAGMENTS) {
        const matches = writeFileCallsTargetingFragment(file.strippedComments, fragment);
        if (matches.length > 0) {
          violations.push(describeViolations(file, `writeFile( ... ${fragment} ... )`, matches));
        }
      }
    }
    expect(violations).toEqual([]);
  });

  test("src/core/projections.ts does not append to or write the ledger", async () => {
    const files = await readSourceFiles([PROJECTIONS_OWNER]);
    const proj = files[0]!;
    const appendMatches = findMatches(proj.stripped, /\bappendFile(Sync)?\s*\(/g);
    expect(appendMatches).toEqual([]);
    const ledgerWrite = findMatches(
      proj.strippedComments,
      /\bwriteFile\s*\(\s*[^)]*ledger\.jsonl[^)]*\)/g,
    );
    expect(ledgerWrite).toEqual([]);
  });

  test("src/core/projections.ts does not import writeLedger from ./ledger", async () => {
    const files = await readSourceFiles([PROJECTIONS_OWNER]);
    const proj = files[0]!;
    const importPattern =
      /import\s*(?!type\b)[^;]*\bwriteLedger\b[^;]*from\s*["']\.\/ledger["']/g;
    const matches = findMatches(proj.strippedComments, importPattern);
    expect(matches).toEqual([]);
    const callMatches = findMatches(proj.stripped, /\bwriteLedger\s*\(/g);
    expect(callMatches).toEqual([]);
  });

  test("projection freshness owners do not consult file mtimes", async () => {
    const files = await readSourceFiles([PROJECTIONS_OWNER, READ_SNAPSHOT]);
    const violations: string[] = [];
    const patterns: Array<{ label: string; rx: RegExp }> = [
      { label: "mtime", rx: /\bmtime\b/g },
      { label: "mtimeMs", rx: /\bmtimeMs\b/g },
      { label: "mtimeNs", rx: /\bmtimeNs\b/g },
      { label: "birthtime", rx: /\bbirthtime\b/g },
      { label: "birthtimeMs", rx: /\bbirthtimeMs\b/g },
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

  test("read-snapshot does not call stat (existence checks belong to projections owner)", async () => {
    const files = await readSourceFiles([READ_SNAPSHOT]);
    const snap = files[0]!;
    const matches = findMatches(snap.stripped, /\bstat\s*\(/g);
    expect(matches).toEqual([]);
  });

  test("cli.ts does not call writeFile or appendFile to construct projection outputs", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const writeMatches = findMatches(cli.stripped, /\bwriteFile\s*\(/g);
    expect(writeMatches).toEqual([]);
    const appendMatches = findMatches(cli.stripped, /\bappendFile\s*\(/g);
    expect(appendMatches).toEqual([]);
  });

  test("cli.ts render and index handlers route through facade methods, not direct file IO", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const text = cli.stripped;
    expect(/\bknb\s*\.\s*render\s*\(/.test(text)).toBe(true);
    expect(/\bknb\s*\.\s*rebuildIndex\s*\(/.test(text)).toBe(true);
  });

  test("projections owner constructs sidecar paths and writes them", async () => {
    const files = await readSourceFiles([PROJECTIONS_OWNER]);
    const proj = files[0]!;
    const sidecarRefs = findMatches(proj.strippedComments, /\.meta\.json/g);
    expect(sidecarRefs.length).toBeGreaterThan(0);
    const writeCalls = findMatches(proj.stripped, /\bwriteFile\s*\(/g);
    expect(writeCalls.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden writeFile to a views path in negative fixture", () => {
    const bad = `await writeFile("workspace/views/foo.md", body, "utf8");`;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bwriteFile\s*\(\s*[^)]*views[^)]*\)/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden writeFile to an indexes path in negative fixture", () => {
    const bad = `await writeFile("workspace/indexes/active-by-id.json", payload, "utf8");`;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bwriteFile\s*\(\s*[^)]*indexes[^)]*\)/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden writeFile to a .meta.json path in negative fixture", () => {
    const bad = `await writeFile(\`\${path}.meta.json\`, body, "utf8");`;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bwriteFile\s*\(\s*[^)]*\.meta\.json[^)]*\)/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden mtime usage in negative fixture", () => {
    const bad = `
      const info = await stat(file);
      if (info.mtimeMs > stale) return "stale";
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bmtimeMs\b/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden writeFile of ledger.jsonl from projections in negative fixture", () => {
    const bad = `await writeFile("workspace/.knb/ledger.jsonl", line, { flag: "a" });`;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bwriteFile\s*\(\s*[^)]*ledger\.jsonl[^)]*\)/g);
    expect(matches.length).toBe(1);
  });

  test("scanner ignores mtime mentions inside string literals and comments", () => {
    const benign = `
      // freshness uses LedgerFingerprint, not mtime
      const docs = "do not use mtimeMs for projection freshness";
    `;
    const stripped = stripCommentsAndStrings(benign);
    expect(findMatches(stripped, /\bmtime\b/g).length).toBe(0);
    expect(findMatches(stripped, /\bmtimeMs\b/g).length).toBe(0);
  });
});
