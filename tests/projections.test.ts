import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import type { LedgerFingerprint } from "../src/core/ledger";
import { canonicalContentHash } from "../src/core/ledger";
import {
  buildClaimKeyClusters,
  JsonProjectionArtifactStore,
  V1_INDEX_NAMES,
  checkFreshness,
  rebuildIndexes,
  renderAllCollections,
  renderCollection,
} from "../src/core/projections";
import { executeQuery } from "../src/core/query";
import { buildEffectiveState } from "../src/core/state";
import type { KnbWorkspace } from "../src/core/workspace";

function load(rows: KnbRow[]): LoadedRow[] {
  return rows.map((row, index) => ({ row, line: index + 1 }));
}

function makeSource(id: string, overrides: Partial<SourceRow> = {}): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["x"] },
    source: { type: "web_page", title: `Source ${id}`, uri: `https://example.com/${id}` },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
    ...overrides,
  };
}

function makeClaim(id: string, sourceId: string, overrides: Partial<ClaimRow> = {}): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: { collections: ["x"] },
    identity: { claim_key: `key|${id}` },
    claim: { statement: `Statement ${id}.`, atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Supports." }],
    },
    assessment: { confidence: "high" },
    ...overrides,
  };
}

function makeQuestion(id: string, overrides: Partial<QuestionRow> = {}): QuestionRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "question",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { collections: ["x"] },
    question: { text: `Question ${id}?`, status: "open" },
    ...overrides,
  };
}

function makeSynthesis(
  id: string,
  basisClaimIds: string[],
  basisSourceIds: string[],
  overrides: Partial<SynthesisRow> = {},
): SynthesisRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "synthesis",
    created_at: "2026-05-01T12:03:00Z",
    created_by: "agent:test",
    scope: { collections: ["x"] },
    synthesis: {
      title: `Synthesis ${id}`,
      summary: `Summary for ${id}.`,
      basis: { claim_ids: basisClaimIds, source_ids: basisSourceIds },
      status: "active",
    },
    ...overrides,
  };
}

function fixtureRows(): KnbRow[] {
  const src1 = makeSource("src:x:20260501:aaaa1111");
  const src2 = makeSource("src:x:20260501:aaaa2222", {
    source: {
      type: "article",
      title: "Article Two",
      uri: "https://example.com/two",
      content_hash: "sha256:deadbeef",
    },
  });
  const srcUnused = makeSource("src:x:20260501:aaaa3333", {
    source: { type: "web_page", title: "Unused", raw_path: "/tmp/unused.txt" },
  });
  const claim1 = makeClaim("claim:x:20260501:bbbb1111", src1.id);
  const claim2 = makeClaim("claim:x:20260501:bbbb2222", src2.id, {
    identity: {},
  });
  const question1 = makeQuestion("q:x:20260501:cccc1111");
  const synth1 = makeSynthesis("synth:x:20260501:dddd1111", [claim1.id], [src1.id]);
  return [src1, src2, srcUnused, claim1, claim2, question1, synth1];
}

function iranFixtureRows(): KnbRow[] {
  const src1 = makeSource("src:iran:20260501:source01", {
    scope: { collections: ["iran-cracks"] },
    source: {
      type: "web_page",
      title: "Dispatch One",
      uri: "https://example.com/dispatch-one",
      publisher: "Signals Desk",
    },
  });
  const src2 = makeSource("src:iran:20260501:source02", {
    scope: { collections: ["iran-cracks"] },
    source: {
      type: "web_page",
      title: "Dispatch Two",
      uri: "https://example.com/dispatch-two",
      publisher: "Signals Desk",
    },
  });
  const src3 = makeSource("src:iran:20260501:source03", {
    scope: { collections: ["iran-cracks"] },
    source: {
      type: "article",
      title: "Market Note",
      uri: "https://example.com/market-note",
      publisher: "Market Desk",
    },
  });
  const src4 = makeSource("src:iran:20260501:source04", {
    scope: { collections: ["iran-cracks"] },
    source: {
      type: "raw_note",
      title: "Archive Note",
      uri: "https://example.com/archive-note",
      publisher: "Archive",
    },
  });
  const src5 = makeSource("src:iran:20260501:source05", {
    scope: { collections: ["iran-cracks"] },
    source: {
      type: "web_page",
      title: "Uncited Note",
      uri: "https://example.com/uncited-note",
      publisher: "Archive",
    },
  });
  const c1 = makeClaim("claim:iran:20260501:command01", src1.id, {
    scope: { collections: ["iran-cracks"] },
    identity: { claim_key: "iran|command" },
    claim: { statement: "Command channels show visible strain.", atomic: true },
    time: { precision: "day", valid_at: "2026-04-30" },
    assessment: { confidence: "high" },
  });
  const c2 = makeClaim("claim:iran:20260501:command02", src2.id, {
    created_at: "2026-05-01T12:02:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: { claim_key: "iran|command" },
    claim: { statement: "Senior officials shifted bunker routines.", atomic: true },
    time: { precision: "instant", occurred_at: "2026-05-01T08:00:00Z" },
    assessment: { confidence: "medium" },
  });
  const c3 = makeClaim("claim:iran:20260501:market01", src3.id, {
    created_at: "2026-05-01T12:03:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: { claim_key: "iran|market" },
    claim: { statement: "Market makers priced a short disruption window.", atomic: true },
    assessment: { confidence: "high" },
  });
  const c4 = makeClaim("claim:iran:20260501:market02", src3.id, {
    created_at: "2026-05-01T12:04:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: { claim_key: "iran|market" },
    claim: { statement: "Rumor desks amplified unverified succession chatter.", atomic: true },
    assessment: { confidence: "low" },
  });
  const c5 = makeClaim("claim:iran:20260501:unkeyed01", src4.id, {
    created_at: "2026-05-01T12:05:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: {},
    claim: { statement: "Older sanctions pressure remains unresolved.", atomic: true },
    assessment: { confidence: "high" },
  });
  const c6 = makeClaim("claim:iran:20260501:unkeyed02", src1.id, {
    created_at: "2026-05-01T12:06:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: {},
    claim: { statement: "Proxy channels elevated readiness.", atomic: true },
    assessment: { confidence: "medium" },
  });
  const c7 = makeClaim("claim:iran:20260501:unkeyed03", src2.id, {
    created_at: "2026-05-01T12:07:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: {},
    claim: { statement: "Diplomatic backchannels stayed open.", atomic: true },
    assessment: { confidence: "medium" },
  });
  const c8 = makeClaim("claim:iran:20260501:unkeyed04", src3.id, {
    created_at: "2026-05-01T12:08:00Z",
    scope: { collections: ["iran-cracks"] },
    identity: {},
    claim: { statement: "Port inspections slowed on the Gulf route.", atomic: true },
    assessment: { confidence: "low" },
  });
  const q1 = makeQuestion("q:iran:20260501:question01", {
    scope: { collections: ["iran-cracks"] },
    question: { text: "Where is the chain-of-command break?", status: "open" },
  });
  const q2 = makeQuestion("q:iran:20260501:question02", {
    created_at: "2026-05-01T12:03:00Z",
    scope: { collections: ["iran-cracks"] },
    question: { text: "Which reports are independently corroborated?", status: "open" },
  });
  const synth = makeSynthesis("synth:iran:20260501:summary01", [c1.id, c2.id, c6.id], [src1.id], {
    scope: { collections: ["iran-cracks"] },
    synthesis: {
      title: "Command Pressure Summary",
      summary: "Visible stress is concentrated around command channels and readiness signals.",
      basis: { claim_ids: [c1.id, c2.id, c6.id], source_ids: [src1.id] },
      status: "active",
    },
  });
  return [src1, src2, src3, src4, src5, c1, c2, c3, c4, c5, c6, c7, c8, q1, q2, synth];
}

function goldenFingerprint(rows: KnbRow[]): LedgerFingerprint {
  const fingerprint: LedgerFingerprint = {
    path: "/repo/knb/ledger.jsonl",
    rows: rows.length,
    bytes: 0,
    content_hash: "sha256:golden",
  };
  const last = rows[rows.length - 1];
  if (last !== undefined) fingerprint.last_row_id = last.id;
  return fingerprint;
}

function fingerprintFor(rows: KnbRow[], path = "/repo/knb/ledger.jsonl"): LedgerFingerprint {
  const text = rows.length === 0 ? "" : `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
  const fp: LedgerFingerprint = {
    path,
    rows: rows.length,
    bytes: Buffer.byteLength(text, "utf8"),
    content_hash: canonicalContentHash(text),
  };
  if (rows.length > 0) {
    const last = rows[rows.length - 1];
    if (last) fp.last_row_id = last.id;
  }
  return fp;
}

async function makeWorkspace(): Promise<KnbWorkspace> {
  const root = await mkdtemp(join(tmpdir(), "knb-projections-"));
  const ledger = join(root, "knb", "ledger.jsonl");
  const views = join(root, "knb", "views");
  const indexes = join(root, "knb", "indexes");
  await mkdir(join(root, "knb"), { recursive: true });
  return {
    root,
    config: {},
    paths: {
      ledger,
      schema: join(root, "knb", "schema.json"),
      views,
      indexes,
      runs: join(root, ".knb", "runs"),
      lock: join(root, ".knb", "ledger.lock"),
      config: join(root, ".knb", "config.json"),
    },
    actor: "agent:test",
  };
}

let workspaces: KnbWorkspace[] = [];

beforeEach(() => {
  workspaces = [];
});

afterEach(async () => {
  for (const ws of workspaces) {
    await rm(ws.root, { recursive: true, force: true });
  }
});

async function freshWorkspace(): Promise<KnbWorkspace> {
  const ws = await makeWorkspace();
  workspaces.push(ws);
  return ws;
}

function markdownSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const matches = [...markdown.matchAll(/^## ([^{\n]+?)(?: \{#[^}]+\})?\n/gm)];
  for (let index = 0; index < matches.length; index += 1) {
    const match = matches[index]!;
    const title = match[1]!.trim();
    const start = match.index ?? 0;
    const next = matches[index + 1];
    const end = next?.index ?? markdown.length;
    sections.set(title, markdown.slice(start, end));
  }
  return sections;
}

describe("renderCollection", () => {
  test("JsonProjectionArtifactStore owns workspace and projection timestamps", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const store = new JsonProjectionArtifactStore(ws, () => new Date("2026-05-02T10:00:00Z"));

    const result = await store.renderCollection(state, fp, { collection: "x" });

    expect(result.path).toBe(join(ws.paths.views, "x.md"));
    expect(result.metadata.generated_at).toBe("2026-05-02T10:00:00.000Z");
  });

  test("writes a markdown file under workspace views with title-cased header and sections", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });

    expect(result.collection).toBe("x");
    expect(result.format).toBe("md");
    expect(result.path).toBe(join(ws.paths.views, "x.md"));
    expect(result.bytes_written).toBeGreaterThan(0);

    const body = await readFile(result.path, "utf8");
    expect(body.startsWith("# X\n")).toBe(true);
    expect(body).toContain("## Current Synthesis");
    expect(body).toContain("## Key Claims");
    expect(body).toContain("## Open Questions");
    expect(body).toContain("## Sources");
    expect(body).toContain("Synthesis synth:x:20260501:dddd1111");
    expect(body).toContain("Statement claim:x:20260501:bbbb1111.");
    expect(body).toContain("Question q:x:20260501:cccc1111?");
    expect(body).toContain("Source src:x:20260501:aaaa1111");
    expect(body).not.toContain("Unused");
    expect(body.endsWith("\n")).toBe(true);
  });

  test("renders TOC links and deterministic row anchors", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");

    expect(body).toContain("## Contents {#contents}");
    expect(body).toContain("- [Current Synthesis](#current-synthesis)");
    expect(body).toContain("- [Key Claims](#key-claims)");
    expect(body).toContain("- [Open Questions](#open-questions)");
    expect(body).toContain("- [Sources](#sources)");
    expect(body).toContain("{#synth-x-20260501-dddd1111}");
    expect(body).toContain("{#claim-x-20260501-bbbb1111}");
    expect(body).toContain("{#q-x-20260501-cccc1111}");
    expect(body).toContain("{#src-x-20260501-aaaa1111}");
  });

  test("groups claims by claim_key and renders explicit unkeyed section", async () => {
    const ws = await freshWorkspace();
    const rows = iranFixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = goldenFingerprint(rows);

    const result = await renderCollection(state, ws, fp, { collection: "iran-cracks" });
    const body = await readFile(result.path, "utf8");

    expect(body).toContain("### Claim Key Clusters {#claim-key-clusters}");
    expect(body).toContain("#### iran|command {#claim-key-iran-command}");
    expect(body).toContain("#### iran|market {#claim-key-iran-market}");
    expect(body.indexOf("#### iran|command")).toBeLessThan(body.indexOf("#### iran|market"));
    expect(body).toContain("### Unkeyed Claims {#unkeyed-claims}");
    expect(body).toContain("Older sanctions pressure remains unresolved.");
    expect(body).toContain("Proxy channels elevated readiness.");
  });

  test("claim-key cluster builder derives from active EffectiveState rows", () => {
    const source = makeSource("src:clusters:20260501:source01", {
      scope: { collections: ["clusters"] },
    });
    const activeA = makeClaim("claim:clusters:20260501:active01", source.id, {
      scope: { collections: ["clusters"] },
      identity: { claim_key: "clusters|a" },
    });
    const activeB = makeClaim("claim:clusters:20260501:active02", source.id, {
      created_at: "2026-05-01T12:02:00Z",
      scope: { collections: ["clusters"] },
      identity: { claim_key: "clusters|a" },
    });
    const unkeyed = makeClaim("claim:clusters:20260501:active03", source.id, {
      created_at: "2026-05-01T12:03:00Z",
      scope: { collections: ["clusters"] },
      identity: {},
    });
    const retracted = makeClaim("claim:clusters:20260501:dead0001", source.id, {
      created_at: "2026-05-01T12:04:00Z",
      scope: { collections: ["clusters"] },
      identity: { claim_key: "clusters|a" },
    });
    const retract: KnbRow = {
      schema_version: "knb.v1",
      id: "chg:clusters:20260501:dead0002",
      kind: "change",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["clusters"] },
      change: { action: "retract", target_ids: [retracted.id], reason: "obsolete" },
    };
    const state = buildEffectiveState(load([source, activeA, activeB, unkeyed, retracted, retract]));

    const clusters = buildClaimKeyClusters(state.rows({ status: "active", collection: "clusters", includeChanges: false }));

    expect(clusters.keyed).toEqual([
      {
        claim_key: "clusters|a",
        claims: [activeA, activeB],
      },
    ]);
    expect(clusters.unkeyed).toEqual([unkeyed]);
  });

  test("Iran fixture render matches golden Markdown and stays byte-identical on re-render", async () => {
    const ws = await freshWorkspace();
    const rows = iranFixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = goldenFingerprint(rows);
    const expected = await readFile(join(process.cwd(), "tests", "static", "iran-fixture.expected.md"), "utf8");

    const first = await renderCollection(state, ws, fp, { collection: "iran-cracks" });
    const firstBody = await readFile(first.path, "utf8");
    const second = await renderCollection(state, ws, fp, { collection: "iran-cracks" });
    const secondBody = await readFile(second.path, "utf8");

    expect(firstBody).toBe(expected);
    expect(secondBody).toBe(firstBody);
  });

  test("adding a claim-keyed row changes only the Key Claims section when no new source is cited", async () => {
    const ws = await freshWorkspace();
    const rows = iranFixtureRows();
    const baseState = buildEffectiveState(load(rows));
    const added = makeClaim("claim:iran:20260501:market03", "src:missing:20260501:none0001", {
      created_at: "2026-05-01T12:09:00Z",
      scope: { collections: ["iran-cracks"] },
      identity: { claim_key: "iran|market" },
      claim: { statement: "A new market-only row landed.", atomic: true },
      provenance: { evidence: [] },
      assessment: { confidence: "medium" },
    });
    const nextState = buildEffectiveState(load([...rows, added]));

    const before = await renderCollection(baseState, ws, goldenFingerprint(rows), {
      collection: "iran-cracks",
      out: "before.md",
    });
    const after = await renderCollection(nextState, ws, goldenFingerprint([...rows, added]), {
      collection: "iran-cracks",
      out: "after.md",
    });

    const beforeSections = markdownSections(await readFile(before.path, "utf8"));
    const afterSections = markdownSections(await readFile(after.path, "utf8"));
    const changed = [...afterSections.keys()].filter((key) => beforeSections.get(key) !== afterSections.get(key));

    expect(changed).toEqual(["Key Claims"]);
    expect(afterSections.get("Key Claims")).toContain("A new market-only row landed.");
  });

  test("renders an asOf-projected state without post-cutoff rows", async () => {
    const ws = await freshWorkspace();
    const source = makeSource("src:x:20260501:asof1111", {
      created_at: "2026-05-01T00:00:00Z",
      source: { type: "web_page", title: "AsOf Projection Source", uri: "https://example.com/asof-projection" },
    });
    const claim = makeClaim("claim:x:20260501:asof2222", source.id, {
      created_at: "2026-05-01T01:00:00Z",
      claim: { statement: "As-of projection claim.", atomic: true },
    });
    const synthesis = makeSynthesis("synth:x:20260501:asof3333", [claim.id], [source.id], {
      created_at: "2026-05-01T01:10:00Z",
      synthesis: {
        title: "AsOf Projection Synthesis",
        summary: "Historical projection summary.",
        basis: { claim_ids: [claim.id], source_ids: [source.id] },
        status: "active",
      },
    });
    const question = makeQuestion("q:x:20260501:asof4444", {
      created_at: "2026-05-01T03:00:00Z",
      question: { text: "Projection question after cutoff?", status: "open" },
    });
    const rows = [source, claim, synthesis, question];
    const fp = fingerprintFor(rows);
    const state = buildEffectiveState(load(rows), { asOf: "2026-05-01T01:30:00Z" });

    const result = await renderCollection(state, ws, fp, {
      collection: "x",
      asOf: "2026-05-01T01:30:00Z",
    });
    const body = await readFile(result.path, "utf8");

    expect(body).toContain("As-of projection claim.");
    expect(body).toContain("AsOf Projection Synthesis");
    expect(body).not.toContain("Projection question after cutoff?");
    expect(result.metadata.options.asOf).toBe("2026-05-01T01:30:00Z");
  });

  test("resolves merged duplicate source citations to the canonical source", async () => {
    const ws = await freshWorkspace();
    const canonical = makeSource("src:x:20260501:canonical", {
      source: { type: "web_page", title: "Canonical Source", uri: "https://example.com/shared" },
    });
    const duplicate = makeSource("src:x:20260501:duplicate", {
      source: { type: "web_page", title: "Duplicate Source", uri: "https://example.com/shared" },
    });
    const claim = makeClaim("claim:x:20260501:mergedsrc", duplicate.id);
    const merge: ChangeRow = {
      schema_version: "knb.v1",
      id: "chg:x:20260501:mergesrc",
      kind: "change",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["x"] },
      change: {
        action: "merge",
        target_ids: [duplicate.id],
        canonical_id: canonical.id,
        reason: "same source",
      },
    };
    const rows: KnbRow[] = [canonical, duplicate, claim, merge];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");
    expect(body).toContain("Canonical Source");
    expect(body).not.toContain("Duplicate Source");
    expect(body).not.toContain("No cited sources.");
  });

  test("ledger header line includes row count and content hash from fingerprint", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");
    expect(body).toContain(`Ledger: ${fp.rows} rows`);
    expect(body).toContain(fp.content_hash);
  });

  test("bytes_written equals UTF-8 byte length of file body", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");
    expect(result.bytes_written).toBe(Buffer.byteLength(body, "utf8"));
  });

  test("titleizes hyphenated collection names", async () => {
    const ws = await freshWorkspace();
    const rows = [
      makeClaim("claim:hello-world:20260501:b1", "src:hello-world:20260501:a1", {
        scope: { collections: ["hello-world"] },
      }),
      makeSource("src:hello-world:20260501:a1", {
        scope: { collections: ["hello-world"] },
      }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "hello-world" });
    const body = await readFile(result.path, "utf8");
    expect(body.startsWith("# Hello World\n")).toBe(true);
  });

  test("titleizes underscored and space-mixed collection names", async () => {
    const ws = await freshWorkspace();
    const rows = [
      makeSource("src:foo_bar:20260501:a1", { scope: { collections: ["foo_bar baz"] } }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, {
      collection: "foo_bar baz",
      out: "fb.md",
    });
    const body = await readFile(result.path, "utf8");
    expect(body.startsWith("# Foo Bar Baz\n")).toBe(true);
  });

  test("filters rows by collection — rows from other collections are excluded", async () => {
    const ws = await freshWorkspace();
    const rows: KnbRow[] = [
      makeSource("src:a:20260501:s1", { scope: { collections: ["a"] } }),
      makeSource("src:b:20260501:s2", { scope: { collections: ["b"] } }),
      makeClaim("claim:a:20260501:c1", "src:a:20260501:s1", {
        scope: { collections: ["a"] },
        claim: { statement: "Claim in A.", atomic: true },
      }),
      makeClaim("claim:b:20260501:c2", "src:b:20260501:s2", {
        scope: { collections: ["b"] },
        claim: { statement: "Claim in B.", atomic: true },
      }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, { collection: "a" });
    const body = await readFile(result.path, "utf8");
    expect(body).toContain("Claim in A.");
    expect(body).not.toContain("Claim in B.");
  });

  test("only cited sources appear under Sources; uncited sources are omitted", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");
    // src1 cited via claim1 + synth1; src2 cited via claim2; srcUnused not cited.
    expect(body).toContain("Source src:x:20260501:aaaa1111");
    expect(body).toContain("Source src:x:20260501:aaaa1111 (Cited by 1 claim)");
    expect(body).toContain("Article Two");
    expect(body).toContain("Article Two (Cited by 1 claim)");
    expect(body).not.toContain("Unused");
  });

  test("source citation counts include source_ids and evidence references", async () => {
    const ws = await freshWorkspace();
    const targetSource = makeSource("src:x:20260501:cited", {
      source: { type: "web_page", title: "Cited Article", uri: "https://example.com/cited" },
    });
    const otherSource = makeSource("src:x:20260501:other", {
      source: { type: "web_page", title: "Other Article", uri: "https://example.com/other" },
    });
    const viaSourceIds = makeClaim("claim:x:20260501:citea", targetSource.id, {
      provenance: {
        source_ids: [targetSource.id],
        evidence: [{ source_id: otherSource.id, role: "supports", summary: "Secondary evidence." }],
      },
    });
    const viaEvidence = makeClaim("claim:x:20260501:citeb", targetSource.id, {
      provenance: {
        evidence: [{ source_id: targetSource.id, role: "supports", summary: "Direct evidence." }],
      },
    });
    const viaBoth = makeClaim("claim:x:20260501:citec", targetSource.id);
    const rows = [targetSource, otherSource, viaSourceIds, viaEvidence, viaBoth];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });
    const body = await readFile(result.path, "utf8");

    expect(body).toContain("Cited Article (Cited by 3 claims)");
  });

  test("retracted claims are excluded from rendered Key Claims", async () => {
    const ws = await freshWorkspace();
    const src1 = makeSource("src:y:20260501:s1", { scope: { collections: ["y"] } });
    const claimAlive = makeClaim("claim:y:20260501:c1", src1.id, {
      scope: { collections: ["y"] },
      claim: { statement: "Alive claim.", atomic: true },
    });
    const claimDead = makeClaim("claim:y:20260501:c2", src1.id, {
      scope: { collections: ["y"] },
      claim: { statement: "Dead claim about to be retracted.", atomic: true },
    });
    const retract: KnbRow = {
      schema_version: "knb.v1",
      id: "chg:y:20260501:r1",
      kind: "change",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["y"] },
      change: { action: "retract", target_ids: [claimDead.id], reason: "wrong" },
    };
    const rows: KnbRow[] = [src1, claimAlive, claimDead, retract];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, { collection: "y" });
    const body = await readFile(result.path, "utf8");
    expect(body).toContain("Alive claim.");
    expect(body).not.toContain("Dead claim about to be retracted.");
  });

  test("empty collection still renders valid markdown with placeholders", async () => {
    const ws = await freshWorkspace();
    const state = buildEffectiveState([]);
    const fp = fingerprintFor([]);
    const result = await renderCollection(state, ws, fp, { collection: "empty" });
    const body = await readFile(result.path, "utf8");
    expect(body.startsWith("# Empty\n")).toBe(true);
    expect(body).toContain("## Current Synthesis");
    expect(body).toContain("No active synthesis rows.");
    expect(body).toContain("## Key Claims");
    expect(body).toContain("No active claim rows.");
    expect(body).toContain("## Open Questions");
    expect(body).toContain("No open question rows.");
    expect(body).toContain("## Sources");
    expect(body).toContain("No cited sources.");
    expect(body.endsWith("\n")).toBe(true);
  });

  test("writes a sidecar with ledger fingerprint hash and target", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });
    expect(result.metadata_path).toBe(`${result.path}.meta.json`);
    const meta = JSON.parse(await readFile(result.metadata_path, "utf8"));
    expect(meta.schema_version).toBe("knb.projection.v1");
    expect(meta.kind).toBe("view");
    expect(meta.target).toBe("knb/views/x.md");
    expect(meta.ledger.content_hash).toBe(fp.content_hash);
    expect(meta.ledger.rows).toBe(fp.rows);
    expect(meta.ledger.last_row_id).toBe(fp.last_row_id);
    expect(meta.ledger.path).toBe(fp.path);
    expect(meta.options).toEqual({ collection: "x", format: "md" });
    expect(typeof meta.generated_at).toBe("string");
    // generated_at must be ISO-parsable.
    expect(Number.isNaN(Date.parse(meta.generated_at as string))).toBe(false);
  });

  test("rejects out path that escapes workspace views", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    let captured: unknown;
    try {
      await renderCollection(state, ws, fp, {
        collection: "x",
        out: join(ws.root, "knb", "elsewhere", "x.md"),
      });
    } catch (error) {
      captured = error;
    }
    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });

  test("rejects parent-traversal out path", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    let captured: unknown;
    try {
      await renderCollection(state, ws, fp, {
        collection: "x",
        out: `..${sep}..${sep}escape.md`,
      });
    } catch (error) {
      captured = error;
    }
    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });

  test("rejects absolute out path outside views even when on same volume", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    let captured: unknown;
    try {
      await renderCollection(state, ws, fp, {
        collection: "x",
        out: "/tmp/should/not/work/x.md",
      });
    } catch (error) {
      captured = error;
    }
    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });

  test("accepts out path inside views and creates parent directory", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const target = join(ws.paths.views, "sub", "nested", "x.md");
    const result = await renderCollection(state, ws, fp, { collection: "x", out: target });
    expect(result.path).toBe(target);
    const body = await readFile(target, "utf8");
    expect(body.startsWith("# X\n")).toBe(true);
    // Sidecar should sit alongside.
    const meta = JSON.parse(await readFile(`${target}.meta.json`, "utf8"));
    expect(meta.target).toBe("knb/views/sub/nested/x.md");
  });

  test("relative out path is resolved against views root", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const result = await renderCollection(state, ws, fp, {
      collection: "x",
      out: join("relout", "x.md"),
    });
    expect(result.path).toBe(join(ws.paths.views, "relout", "x.md"));
  });

  test("rejects empty collection", async () => {
    const ws = await freshWorkspace();
    const state = buildEffectiveState([]);
    const fp = fingerprintFor([]);
    let captured: unknown;
    try {
      await renderCollection(state, ws, fp, { collection: "   " });
    } catch (error) {
      captured = error;
    }
    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });

  test("rejects unsupported render format", async () => {
    const ws = await freshWorkspace();
    const state = buildEffectiveState([]);
    const fp = fingerprintFor([]);
    let captured: unknown;
    try {
      await renderCollection(state, ws, fp, {
        collection: "x",
        format: "html" as unknown as "md",
      });
    } catch (error) {
      captured = error;
    }
    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });

  test("two consecutive renders against the same fingerprint produce identical markdown", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const first = await renderCollection(state, ws, fp, { collection: "x" });
    const firstBody = await readFile(first.path, "utf8");
    const firstBytes = first.bytes_written;

    const second = await renderCollection(state, ws, fp, { collection: "x" });
    const secondBody = await readFile(second.path, "utf8");

    expect(secondBody).toBe(firstBody);
    expect(second.bytes_written).toBe(firstBytes);
  });

  test("changing fingerprint changes rendered markdown header", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fpA = fingerprintFor(rows);
    const fpB: LedgerFingerprint = {
      ...fpA,
      content_hash: canonicalContentHash("changed"),
      rows: 99,
    };

    const a = await renderCollection(state, ws, fpA, { collection: "x" });
    const bodyA = await readFile(a.path, "utf8");

    const b = await renderCollection(state, ws, fpB, { collection: "x" });
    const bodyB = await readFile(b.path, "utf8");

    expect(bodyA).not.toBe(bodyB);
    expect(bodyB).toContain("Ledger: 99 rows");
    expect(bodyB).toContain(canonicalContentHash("changed"));
  });
});

describe("renderAllCollections", () => {
  test("renders one default Markdown view for each active collection", async () => {
    const ws = await freshWorkspace();
    const rows: KnbRow[] = [
      makeSource("src:a:20260501:s1", { scope: { collections: ["beta", "alpha"] } }),
      makeSource("src:b:20260501:s2", { scope: { collections: ["gamma"] } }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderAllCollections(state, ws, fp);

    expect(result.collections).toEqual(["alpha", "beta", "gamma"]);
    expect(result.rendered.map((entry) => entry.collection)).toEqual(["alpha", "beta", "gamma"]);
    expect(result.total_bytes_written).toBe(
      result.rendered.reduce((sum, entry) => sum + entry.bytes_written, 0),
    );
    for (const collection of result.collections) {
      expect(await readFile(join(ws.paths.views, `${collection}.md`), "utf8")).toContain(
        `# ${collection.charAt(0).toUpperCase()}${collection.slice(1)}`,
      );
      expect(await readFile(join(ws.paths.views, `${collection}.md.meta.json`), "utf8")).toContain(
        `"collection": "${collection}"`,
      );
    }
  });

  test("does not render collections that only appear on inactive rows or change rows", async () => {
    const ws = await freshWorkspace();
    const live = makeSource("src:live:20260501:s1", { scope: { collections: ["live"] } });
    const dead = makeSource("src:dead:20260501:s2", { scope: { collections: ["dead"] } });
    const retract: ChangeRow = {
      schema_version: "knb.v1",
      id: "chg:dead:20260501:r1",
      kind: "change",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["change-only"] },
      change: { action: "retract", target_ids: [dead.id], reason: "inactive test" },
    };
    const rows: KnbRow[] = [live, dead, retract];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderAllCollections(state, ws, fp);

    expect(result.collections).toEqual(["live"]);
    expect(result.rendered.length).toBe(1);
  });

  test("rejects unsupported format before rendering any collection", async () => {
    const ws = await freshWorkspace();
    const rows = [makeSource("src:x:20260501:s1")];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    let captured: unknown;
    try {
      await renderAllCollections(state, ws, fp, { format: "html" as unknown as "md" });
    } catch (error) {
      captured = error;
    }

    expect(isKnbError(captured)).toBe(true);
    if (isKnbError(captured)) expect(captured.code).toBe("validation_failed");
  });
});

describe("rebuildIndexes", () => {
  test("writes all V1 indexes and sidecars under workspace indexes", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await rebuildIndexes(state, ws, fp);
    expect(result.indexes.length).toBe(V1_INDEX_NAMES.length);
    for (const idx of result.indexes) {
      expect(idx.path).toBe(join(ws.paths.indexes, `${idx.name}.json`));
      expect(idx.metadata_path).toBe(`${idx.path}.meta.json`);
      expect(idx.metadata.schema_version).toBe("knb.projection.v1");
      expect(idx.metadata.kind).toBe("index");
      expect(idx.metadata.target).toBe(`knb/indexes/${idx.name}.json`);
      expect(idx.metadata.ledger.content_hash).toBe(fp.content_hash);
      expect(idx.metadata.ledger.rows).toBe(fp.rows);
      expect(idx.metadata.ledger.last_row_id).toBe(fp.last_row_id);
      expect(idx.metadata.options).toEqual({ name: idx.name });
      expect(idx.bytes_written).toBeGreaterThan(0);
      const fileBody = await readFile(idx.path, "utf8");
      expect(fileBody.endsWith("\n")).toBe(true);
      expect(idx.bytes_written).toBe(Buffer.byteLength(fileBody, "utf8"));
      const parsed = JSON.parse(fileBody);
      expect(parsed).toBeDefined();
    }
    // All indexes share a single generated_at timestamp.
    const generatedAt = result.indexes[0]?.metadata.generated_at;
    for (const idx of result.indexes) {
      expect(idx.metadata.generated_at).toBe(generatedAt as string);
    }
  });

  test("active-by-id contains every active row with kind and scope", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const indexPath = join(ws.paths.indexes, "active-by-id.json");
    const data = JSON.parse(await readFile(indexPath, "utf8")) as Record<
      string,
      { kind: string; scope: { collections?: string[] } }
    >;
    expect(Object.keys(data).length).toBe(rows.length);
    for (const row of rows) {
      expect(data[row.id]?.kind).toBe(row.kind);
      expect(data[row.id]?.scope?.collections).toEqual(row.scope.collections ?? []);
    }
    // Keys are sorted lexicographically.
    const keys = Object.keys(data);
    const sorted = [...keys].sort((a, b) => a.localeCompare(b));
    expect(keys).toEqual(sorted);
  });

  test("retracted rows are absent from active-by-id", async () => {
    const ws = await freshWorkspace();
    const src = makeSource("src:r:20260501:s1", { scope: { collections: ["r"] } });
    const claim = makeClaim("claim:r:20260501:c1", src.id, { scope: { collections: ["r"] } });
    const change: KnbRow = {
      schema_version: "knb.v1",
      id: "chg:r:20260501:r1",
      kind: "change",
      created_at: "2026-05-01T13:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["r"] },
      change: { action: "retract", target_ids: [claim.id], reason: "obsolete" },
    };
    const rows: KnbRow[] = [src, claim, change];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-by-id.json"), "utf8"),
    ) as Record<string, unknown>;
    expect(data[claim.id]).toBeUndefined();
    expect(data[src.id]).toBeDefined();
    // Change row is not "active" in V1 row filtering.
    expect(data[change.id]).toBeUndefined();
  });

  test("active-claims-by-key only includes claims with claim_key", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-claims-by-key.json"), "utf8"),
    ) as Record<string, string[]>;
    expect(data["key|claim:x:20260501:bbbb1111"]).toEqual(["claim:x:20260501:bbbb1111"]);
    expect(Object.keys(data)).not.toContain("key|claim:x:20260501:bbbb2222");
    expect(Object.keys(data).length).toBe(1);
    // Keys sorted.
    const keys = Object.keys(data);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  test("active-sources-by-uri only includes sources with a uri; keys sorted", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-sources-by-uri.json"), "utf8"),
    ) as Record<string, string>;
    expect(data["https://example.com/src:x:20260501:aaaa1111"]).toBe("src:x:20260501:aaaa1111");
    expect(data["https://example.com/two"]).toBe("src:x:20260501:aaaa2222");
    expect(Object.keys(data).length).toBe(2);
    const keys = Object.keys(data);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));

    const hashData = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-sources-by-content-hash.json"), "utf8"),
    ) as Record<string, string>;
    expect(hashData["sha256:deadbeef"]).toBe("src:x:20260501:aaaa2222");
    expect(Object.keys(hashData).length).toBe(1);
  });

  test("active-claims-by-source-uri maps source URIs to active referencing claims", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-claims-by-source-uri.json"), "utf8"),
    ) as Record<string, string[]>;
    expect(data["https://example.com/src:x:20260501:aaaa1111"]).toEqual([
      "claim:x:20260501:bbbb1111",
    ]);
    expect(data["https://example.com/two"]).toEqual(["claim:x:20260501:bbbb2222"]);
    expect(Object.keys(data)).not.toContain("https://example.com/src:x:20260501:aaaa3333");
    const keys = Object.keys(data);
    expect(keys).toEqual([...keys].sort((a, b) => a.localeCompare(b)));
  });

  test("active-by-collection arrays preserve ledger order and keys are sorted", async () => {
    const ws = await freshWorkspace();
    const rows: KnbRow[] = [
      makeSource("src:b:20260501:0001", { scope: { collections: ["b-coll"] } }),
      makeSource("src:a:20260501:0002", { scope: { collections: ["a-coll"] } }),
      makeClaim("claim:b:20260501:0003", "src:b:20260501:0001", {
        scope: { collections: ["b-coll"] },
      }),
      makeClaim("claim:b:20260501:0004", "src:b:20260501:0001", {
        scope: { collections: ["b-coll"] },
      }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-by-collection.json"), "utf8"),
    ) as Record<string, string[]>;
    const keys = Object.keys(data);
    expect(keys).toEqual(["a-coll", "b-coll"]);
    expect(data["b-coll"]).toEqual([
      "src:b:20260501:0001",
      "claim:b:20260501:0003",
      "claim:b:20260501:0004",
    ]);
    expect(data["a-coll"]).toEqual(["src:a:20260501:0002"]);
  });

  test("active-by-collection: a row in two collections appears in both arrays", async () => {
    const ws = await freshWorkspace();
    const rows: KnbRow[] = [
      makeSource("src:multi:20260501:s1", {
        scope: { collections: ["c1", "c2"] },
      }),
    ];
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    await rebuildIndexes(state, ws, fp);
    const data = JSON.parse(
      await readFile(join(ws.paths.indexes, "active-by-collection.json"), "utf8"),
    ) as Record<string, string[]>;
    expect(data["c1"]).toContain("src:multi:20260501:s1");
    expect(data["c2"]).toContain("src:multi:20260501:s1");
  });

  test("rebuildIndexes is deterministic across runs", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await rebuildIndexes(state, ws, fp);
    const firstBodies: Record<string, string> = {};
    for (const name of V1_INDEX_NAMES) {
      firstBodies[name] = await readFile(join(ws.paths.indexes, `${name}.json`), "utf8");
    }

    await rebuildIndexes(state, ws, fp);
    for (const name of V1_INDEX_NAMES) {
      const second = await readFile(join(ws.paths.indexes, `${name}.json`), "utf8");
      expect(second).toBe(firstBodies[name] ?? "");
    }
  });
});

describe("checkFreshness", () => {
  test("returns fresh for a freshly rendered and indexed workspace", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await renderCollection(state, ws, fp, { collection: "x" });
    await rebuildIndexes(state, ws, fp);

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    expect(report.entries.length).toBe(V1_INDEX_NAMES.length + 1);
    for (const entry of report.entries) {
      expect(entry.state).toBe("fresh");
      expect(entry.ledger_hash).toBe(fp.content_hash);
      expect(typeof entry.generated_at === "string" || entry.generated_at === undefined).toBe(true);
    }
  });

  test("treats asOf-rendered views as stale for current projection freshness", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows), { asOf: "2026-05-01T12:02:30Z" });
    const fp = fingerprintFor(rows);

    await renderCollection(state, ws, fp, { collection: "x", asOf: "2026-05-01T12:02:30Z" });

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const view = report.entries.find((entry) => entry.target === "knb/views/x.md");
    expect(view?.state).toBe("stale");
    expect(view?.ledger_hash).toBe(fp.content_hash);
  });

  test("freshness report sorts entries by target lexicographically within each kind", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    await renderCollection(state, ws, fp, { collection: "alpha" });
    await renderCollection(state, ws, fp, { collection: "beta" });
    await renderCollection(state, ws, fp, { collection: "gamma" });
    await rebuildIndexes(state, ws, fp);

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const indexTargets = report.entries.filter((e) => e.kind === "index").map((e) => e.target);
    const viewTargets = report.entries.filter((e) => e.kind === "view").map((e) => e.target);
    expect(indexTargets).toEqual([...indexTargets].sort((a, b) => a.localeCompare(b)));
    expect(viewTargets).toEqual([...viewTargets].sort((a, b) => a.localeCompare(b)));
  });

  test("freshness recursively walks views subdirectories and finds nested sidecars", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);
    const sub = join(ws.paths.views, "sub", "deep");
    const target = join(sub, "x.md");
    await renderCollection(state, ws, fp, { collection: "x", out: target });
    await rebuildIndexes(state, ws, fp);

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const view = report.entries.find((e) => e.target === "knb/views/sub/deep/x.md");
    expect(view).toBeDefined();
    expect(view?.state).toBe("fresh");
  });

  test("returns stale after the ledger fingerprint changes", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    await renderCollection(state, ws, fp, { collection: "x" });
    await rebuildIndexes(state, ws, fp);

    const newFp: LedgerFingerprint = {
      ...fp,
      content_hash: canonicalContentHash("changed"),
    };
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: newFp });
    const view = report.entries.find((entry) => entry.target === "knb/views/x.md");
    expect(view?.state).toBe("stale");
    // Stale view still carries the OLD ledger_hash on the entry.
    expect(view?.ledger_hash).toBe(fp.content_hash);
    const indexEntries = report.entries.filter((entry) => entry.kind === "index");
    expect(indexEntries.length).toBe(V1_INDEX_NAMES.length);
    for (const entry of indexEntries) {
      expect(entry.state).toBe("stale");
      expect(entry.ledger_hash).toBe(fp.content_hash);
    }
  });

  test("returns missing when sidecar exists but target file was removed", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const state = buildEffectiveState(load(rows));
    const fp = fingerprintFor(rows);

    const result = await renderCollection(state, ws, fp, { collection: "x" });
    await rebuildIndexes(state, ws, fp);

    await rm(result.path);

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const view = report.entries.find((entry) => entry.target === "knb/views/x.md");
    expect(view?.state).toBe("missing");
    expect(view?.metadata_path).toBe(result.metadata_path);
  });

  test("returns missing for known V1 indexes when no sidecar exists yet", async () => {
    const ws = await freshWorkspace();
    const rows = fixtureRows();
    const fp = fingerprintFor(rows);

    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const indexEntries = report.entries.filter((entry) => entry.kind === "index");
    expect(indexEntries.length).toBe(V1_INDEX_NAMES.length);
    for (const entry of indexEntries) {
      expect(entry.state).toBe("missing");
    }
    const targets = indexEntries.map((entry) => entry.target).sort();
    const expected = [...V1_INDEX_NAMES]
      .map((name) => `knb/indexes/${name}.json`)
      .sort();
    expect(targets).toEqual(expected);
  });

  test("returns unknown for an unparseable sidecar", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "broken.md.meta.json");
    await writeFile(sidecarPath, "{not json", "utf8");

    const fp = fingerprintFor([]);
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const broken = report.entries.find((entry) => entry.metadata_path === sidecarPath);
    expect(broken?.state).toBe("unknown");
  });

  test("returns unknown for sidecar missing required schema_version field", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "partial.md.meta.json");
    await writeFile(
      sidecarPath,
      JSON.stringify({ kind: "view", target: "knb/views/partial.md", ledger: { content_hash: "x" } }),
      "utf8",
    );
    const fp = fingerprintFor([]);
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const partial = report.entries.find((entry) => entry.metadata_path === sidecarPath);
    expect(partial?.state).toBe("unknown");
  });

  test("returns unknown for sidecar missing target field", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "notarget.md.meta.json");
    await writeFile(
      sidecarPath,
      JSON.stringify({
        schema_version: "knb.projection.v1",
        kind: "view",
        ledger: { content_hash: "x" },
      }),
      "utf8",
    );
    const fp = fingerprintFor([]);
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    expect(entry?.state).toBe("unknown");
  });

  test("returns unknown for sidecar missing ledger.content_hash", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "nohash.md.meta.json");
    await writeFile(
      sidecarPath,
      JSON.stringify({
        schema_version: "knb.projection.v1",
        kind: "view",
        target: "knb/views/nohash.md",
        ledger: {},
      }),
      "utf8",
    );
    const fp = fingerprintFor([]);
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    expect(entry?.state).toBe("unknown");
  });

  test("returns unknown for sidecar that is a JSON array, not object", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "arr.md.meta.json");
    await writeFile(sidecarPath, "[1,2,3]", "utf8");
    const fp = fingerprintFor([]);
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    expect(entry?.state).toBe("unknown");
  });

  test("freshness tolerates leading whitespace in sidecar JSON (parse succeeds)", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "ws.md.meta.json");
    const targetPath = join(ws.paths.views, "ws.md");
    await writeFile(targetPath, "# WS\n", "utf8");
    const expectedHash = canonicalContentHash("anything");
    const meta = {
      schema_version: "knb.projection.v1",
      kind: "view",
      target: "knb/views/ws.md",
      ledger: { content_hash: expectedHash },
    };
    await writeFile(sidecarPath, `   \n\t${JSON.stringify(meta)}\n`, "utf8");

    const fp: LedgerFingerprint = {
      path: "/tmp/ledger.jsonl",
      rows: 0,
      bytes: 0,
      content_hash: expectedHash,
    };
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    expect(entry?.state).toBe("fresh");
  });

  test("sidecar with kind:view but target outside views resolves freshness against present hash", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const sidecarPath = join(ws.paths.views, "weird.md.meta.json");
    const meta = {
      schema_version: "knb.projection.v1",
      kind: "view",
      target: "knb/elsewhere/weird.md",
      ledger: { content_hash: "sha256:deadbeef" },
    };
    await writeFile(sidecarPath, JSON.stringify(meta), "utf8");
    const fp: LedgerFingerprint = {
      path: "/tmp/ledger.jsonl",
      rows: 0,
      bytes: 0,
      content_hash: "sha256:deadbeef",
    };
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    // The classifier looks for the SIBLING file of the sidecar (sidecarPath sans .meta.json),
    // not the value of meta.target. Since that sibling does not exist, state is "missing".
    expect(entry?.state).toBe("missing");
    // The reported target field still mirrors what the sidecar claimed.
    expect(entry?.target).toBe("knb/elsewhere/weird.md");
  });

  test("sidecar content_hash mismatch reports stale (target file present)", async () => {
    const ws = await freshWorkspace();
    await mkdir(ws.paths.views, { recursive: true });
    const targetPath = join(ws.paths.views, "mismatch.md");
    const sidecarPath = `${targetPath}.meta.json`;
    await writeFile(targetPath, "# Mismatch\n", "utf8");
    await writeFile(
      sidecarPath,
      JSON.stringify({
        schema_version: "knb.projection.v1",
        kind: "view",
        target: "knb/views/mismatch.md",
        ledger: { content_hash: "sha256:abc" },
      }),
      "utf8",
    );
    const fp: LedgerFingerprint = {
      path: "/tmp/ledger.jsonl",
      rows: 0,
      bytes: 0,
      content_hash: "sha256:def",
    };
    const report = await checkFreshness({ workspace: ws, ledger_fingerprint: fp });
    const entry = report.entries.find((e) => e.metadata_path === sidecarPath);
    expect(entry?.state).toBe("stale");
  });
});
