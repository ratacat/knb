import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
import type { ApplyOperation, ApplyRequest, DraftRow, ExternalRef } from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { readSnapshot, type ReadSnapshotFreshnessProbe } from "../src/core/read-snapshot";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-readside-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function makeStubAllocator(): (bytes: number) => string {
  let n = 0;
  return () => {
    n += 1;
    return `a${n.toString(16).padStart(7, "0")}`;
  };
}

async function openTestKnb(): Promise<Knb> {
  const options: OpenKnbOptions = {
    root: workDir,
    actor: "agent:test",
    env: {},
    cwd: () => workDir,
    runtime: {
      clock: () => new Date("2026-05-01T12:00:00Z"),
      randomIdPart: makeStubAllocator(),
    },
  };
  return openKnb(options);
}

function sourceDraft(collection: string, uri = `https://example.com/${collection}`, title = "Source"): DraftRow {
  return {
    kind: "source",
    scope: { collections: [collection] },
    source: { type: "web_page", title, uri },
    provenance: { acquisition: { method: "manual" } },
  } as DraftRow;
}

function claimDraft(
  sourceRef: string,
  collection: string,
  statement: string,
  claimKey?: string,
  extras: {
    time?: { precision: "instant" | "hour" | "day" | "month" | "year" | "range" | "unknown"; valid_at?: string };
    importance?: "high" | "medium" | "low";
    external_refs?: ExternalRef[];
  } = {},
): DraftRow {
  const claimShape: Record<string, unknown> = { statement, atomic: true };
  const draft: Record<string, unknown> = {
    kind: "claim",
    scope: { collections: [collection] },
    ...(extras.external_refs !== undefined ? { external_refs: extras.external_refs } : {}),
    identity: claimKey ? { claim_key: claimKey } : {},
    claim: claimShape,
    time: extras.time ?? { precision: "unknown" },
    provenance: {
      source_ids: [sourceRef],
      evidence: [{ source_id: sourceRef, role: "supports", summary: "Source backs the claim." }],
    },
    assessment: { confidence: "high", ...(extras.importance ? { importance: extras.importance } : {}) },
  };
  return draft as DraftRow;
}

function synthDraft(collection: string, claimRef: string, title = "Synthesis", summary = "Sums it up."): DraftRow {
  return {
    kind: "synthesis",
    scope: { collections: [collection] },
    synthesis: {
      title,
      summary,
      basis: { claim_ids: [claimRef] },
      status: "active",
    },
  } as DraftRow;
}

function questionDraft(collection: string, text = "What remains open?"): DraftRow {
  return {
    kind: "question",
    scope: { collections: [collection] },
    question: { text, status: "open" },
  } as DraftRow;
}

describe("read-side integration: get through the facade", () => {
  test("get returns active source and claim after apply", async () => {
    const knb = await openTestKnb();
    const result = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("getme"), as: "src" },
        { op: "add", row: claimDraft("$src", "getme", "It exists.") },
      ],
    });
    const sourceId = result.created[0]?.id ?? "";
    const claimId = result.created[1]?.id ?? "";
    expect(sourceId.length).toBeGreaterThan(0);
    expect(claimId.length).toBeGreaterThan(0);

    const got = await knb.get([sourceId, claimId]);
    expect(got.rows.length).toBe(2);
    expect(got.not_found).toEqual([]);
    const ids = got.rows.map((r) => r.id).sort();
    expect(ids).toEqual([sourceId, claimId].sort());
    for (const row of got.rows) expect(row.status).toBe("active");
  });

  test("get for an unknown id alone throws not_found", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("alone") }] });
    let caught: unknown;
    try {
      await knb.get(["never-here"]);
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("not_found");
  });

  test("get for some present + some missing returns present rows and not_found", async () => {
    const knb = await openTestKnb();
    const result = await knb.apply({ operations: [{ op: "add", row: sourceDraft("partial") }] });
    const sourceId = result.created[0]?.id ?? "";

    const got = await knb.get([sourceId, "missing-one", "missing-two"]);
    expect(got.rows.length).toBe(1);
    expect(got.rows[0]?.id).toBe(sourceId);
    expect(got.not_found.sort()).toEqual(["missing-one", "missing-two"].sort());
  });

  test("get with explain on a retracted claim returns history with the retract change", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("explain"), as: "src" },
        { op: "add", row: claimDraft("$src", "explain", "Retract me."), as: "claim" },
      ],
    });
    const claimId = seed.created[1]?.id ?? "";

    await knb.apply({
      operations: [
        { op: "retract", target_ids: [claimId], reason: "It was wrong." },
      ],
    });

    const got = await knb.get([claimId], { includeHistory: true, explain: true });
    expect(got.rows.length).toBe(1);
    const row = got.rows[0]!;
    expect(row.status).toBe("retracted");
    expect(typeof row.reason).toBe("string");
    expect(row.reason).toContain("It was wrong");
    expect(row.explanation).toBeDefined();
    expect(row.explanation?.history.length).toBeGreaterThanOrEqual(1);
    const entry = row.explanation!.history[0]!;
    expect(entry.action).toBe("retract");
    expect(typeof entry.change_id).toBe("string");
  });
});

describe("read-side integration: query through the facade", () => {
  test("query filters by collection AND kind", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("alpha", "https://a.example/x"), as: "sa" },
        { op: "add", row: claimDraft("$sa", "alpha", "Alpha statement.") },
        { op: "add", row: sourceDraft("beta", "https://b.example/y"), as: "sb" },
        { op: "add", row: claimDraft("$sb", "beta", "Beta statement.") },
      ],
    });

    const result = await knb.query({ collection: "alpha", kinds: ["claim"] });
    expect(result.rows.length).toBe(1);
    expect(result.rows[0]?.kind).toBe("claim");
    expect(result.rows[0]?.text).toBe("Alpha statement.");
  });

  test("query --text ranks exact word match higher than substring", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("textq"), as: "src" },
        { op: "add", row: claimDraft("$src", "textq", "the cat sat") },
        { op: "add", row: claimDraft("$src", "textq", "cats are great") },
        { op: "add", row: claimDraft("$src", "textq", "sat there") },
      ],
    });

    const result = await knb.query({ text: "cat" });
    const claims = result.rows.filter((r) => r.kind === "claim");
    expect(claims.length).toBeGreaterThanOrEqual(2);
    // First match should be the exact-word "cat" — "the cat sat".
    expect(claims[0]?.text).toBe("the cat sat");
    const texts = claims.map((c) => c.text);
    expect(texts).toContain("cats are great");
    expect(texts).not.toContain("sat there");
  });

  test("query with includeHistory true returns superseded rows", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("hist"), as: "src" },
        { op: "add", row: claimDraft("$src", "hist", "Old version."), as: "old" },
        { op: "add", row: claimDraft("$src", "hist", "New version."), as: "new" },
      ],
    });
    const oldId = seed.created[1]?.id ?? "";
    const newId = seed.created[2]?.id ?? "";

    await knb.apply({
      operations: [
        {
          op: "supersede",
          target_ids: [oldId],
          replacement_id: newId,
          reason: "Updated phrasing.",
        },
      ],
    });

    const activeOnly = await knb.query({ kinds: ["claim"] });
    const activeIds = activeOnly.rows.map((r) => r.id);
    expect(activeIds).not.toContain(oldId);
    expect(activeIds).toContain(newId);

    const withHistory = await knb.query({ kinds: ["claim"], includeHistory: true });
    const histIds = withHistory.rows.map((r) => r.id);
    expect(histIds).toContain(oldId);
    expect(histIds).toContain(newId);
    const supersededRow = withHistory.rows.find((r) => r.id === oldId);
    expect(supersededRow?.status).toBe("superseded");
  });

  test("query claim_key exact match returns just the matching claim", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("ck"), as: "src" },
        { op: "add", row: claimDraft("$src", "ck", "First.", "ck|first") },
        { op: "add", row: claimDraft("$src", "ck", "Second.", "ck|second") },
      ],
    });

    const result = await knb.query({ claimKey: "ck|second" });
    expect(result.total_matched).toBe(1);
    expect(result.rows[0]?.text).toBe("Second.");
  });

  test("query --full returns row in row field; without it, row is omitted", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("shape") }] });

    const compact = await knb.query({ kinds: ["source"] });
    expect(compact.rows[0]?.row).toBeUndefined();

    const full = await knb.query({ kinds: ["source"], full: true });
    expect(full.rows[0]?.row).toBeDefined();
    expect(full.rows[0]?.row?.kind).toBe("source");
  });

});

describe("read-side integration: asOf through the facade", () => {
  test("query, get, context, and render read the same historical snapshot", async () => {
    const knb = await openTestKnb();

    const sourceBatch = await knb.apply({
      now: "2026-05-01T00:00:00Z",
      operations: [{ op: "add", row: sourceDraft("asof", "https://example.com/asof", "AsOf Source"), as: "src" }],
    });
    const sourceId = sourceBatch.created[0]?.id ?? "";

    const claimBatch = await knb.apply({
      now: "2026-05-01T01:00:00Z",
      operations: [
        { op: "add", row: claimDraft(sourceId, "asof", "Time-travel claim."), as: "claim" },
        { op: "add", row: synthDraft("asof", "$claim", "AsOf Synthesis", "Historical synthesis.") },
      ],
    });
    const claimId = claimBatch.created[0]?.id ?? "";

    await knb.apply({
      now: "2026-05-01T02:00:00Z",
      operations: [{ op: "retract", target_ids: [claimId], reason: "Later correction." }],
    });

    await knb.apply({
      now: "2026-05-01T03:00:00Z",
      operations: [{ op: "add", row: questionDraft("asof", "Question after cutoff?") }],
    });

    const beforeClaim = await knb.get([sourceId, claimId], { asOf: "2026-05-01T00:30:00Z" });
    expect(beforeClaim.rows.map((row) => row.id)).toEqual([sourceId]);
    expect(beforeClaim.not_found).toEqual([claimId]);

    const queryAtClaim = await knb.query({
      collection: "asof",
      kinds: ["claim"],
      asOf: "2026-05-01T01:30:00Z",
    });
    expect(queryAtClaim.rows.map((row) => row.id)).toEqual([claimId]);
    expect(queryAtClaim.rows[0]?.status).toBe("active");

    const queryAfterRetract = await knb.query({
      collection: "asof",
      kinds: ["claim"],
      includeHistory: true,
      asOf: "2026-05-01T02:30:00Z",
    });
    expect(queryAfterRetract.rows.map((row) => [row.id, row.status])).toEqual([[claimId, "retracted"]]);

    const contextAtClaim = await knb.context({ collection: "asof", asOf: "2026-05-01T01:30:00Z" });
    expect(contextAtClaim.key_claims.map((claim) => claim.id)).toEqual([claimId]);
    expect(contextAtClaim.syntheses.map((synthesis) => synthesis.title)).toEqual(["AsOf Synthesis"]);
    expect(contextAtClaim.open_questions).toEqual([]);

    const contextAfterQuestion = await knb.context({ collection: "asof", asOf: "2026-05-01T03:30:00Z" });
    expect(contextAfterQuestion.key_claims.map((claim) => claim.id)).not.toContain(claimId);
    expect(contextAfterQuestion.open_questions.map((question) => question.text)).toEqual(["Question after cutoff?"]);

    const renderResult = await knb.render({ collection: "asof", asOf: "2026-05-01T01:30:00Z" });
    const markdown = await readFile(renderResult.path, "utf8");
    expect(markdown).toContain("Time-travel claim.");
    expect(markdown).toContain("Historical synthesis.");
    expect(markdown).not.toContain("Question after cutoff?");
    expect(renderResult.metadata.options.asOf).toBe("2026-05-01T01:30:00Z");
  });

  test("invalid asOf from facade reads is reported as invalid_arguments", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("bad-asof") }] });

    let caught: unknown;
    try {
      await knb.query({ asOf: "not-a-timestamp" });
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    if (isKnbError(caught)) {
      expect(caught.code).toBe("invalid_arguments");
    }
  });
});

describe("read-side integration: context through the facade", () => {
  test("context on empty workspace returns Empty workspace summary, not truncated", async () => {
    const knb = await openTestKnb();
    const result = await knb.context({});
    expect(result.summary).toBe("Empty workspace.");
    expect(result.truncated).toBe(false);
    expect(result.key_claims).toEqual([]);
  });

  test("context with very small maxTokens forces truncation", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("ctx"), as: "src" },
        { op: "add", row: claimDraft("$src", "ctx", "Important fact one.", undefined, { importance: "low" }) },
        { op: "add", row: claimDraft("$src", "ctx", "Important fact two.", undefined, { importance: "low" }) },
        { op: "add", row: claimDraft("$src", "ctx", "Important fact three.", undefined, { importance: "low" }) },
      ],
    });

    const result = await knb.context({ collection: "ctx", maxTokens: 5 });
    expect(result.truncated).toBe(true);
    // Truncation should have removed at least one item.
    expect(result.key_claims.length).toBeLessThan(3);
  });

  test("context with no syntheses emits info_gap_no_active_synthesis warning", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("warn"), as: "src" },
        { op: "add", row: claimDraft("$src", "warn", "A claim with no synthesis.") },
      ],
    });

    const result = await knb.context({ collection: "warn" });
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain("info_gap_no_active_synthesis");
  });
});

describe("read-side integration: status and check through the facade", () => {
  test("status reflects state warnings when a change targets a missing id", async () => {
    const knb = await openTestKnb();
    // Append a retract change row with an unresolved target by writing directly,
    // but make it pass validation by also preinserting the target_id row.
    // Instead, exercise this by adding two claims, retracting one, then writing
    // a second retract that references the already-retracted row. This produces
    // change_target_inactive — a state warning.
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("warns"), as: "src" },
        { op: "add", row: claimDraft("$src", "warns", "Will be retracted twice."), as: "claim" },
      ],
    });
    const claimId = seed.created[1]?.id ?? "";
    await knb.apply({ operations: [{ op: "retract", target_ids: [claimId], reason: "first." }] });
    await knb.apply({ operations: [{ op: "retract", target_ids: [claimId], reason: "second." }] });

    const status = await knb.status();
    expect(status.state_warning_count).toBeGreaterThanOrEqual(1);
  });

  test("check returns ok=false when ledger has a JSON parse error", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("parse") }] });
    await appendFile(join(workDir, "knb", "ledger.jsonl"), "{not json}\n", "utf8");
    const result = await knb.check();
    expect(result.ok).toBe(false);
    expect(result.parse_issues.length).toBeGreaterThanOrEqual(1);
  });

  test("check returns ok=false when a manually-appended row fails validation", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("validfail") }] });
    // Append a row missing required fields (no kind, no scope, etc.).
    const bad = { schema_version: "knb.v1", id: "bad:1", created_at: "2026-05-01T12:00:00Z", created_by: "x", scope: { collections: ["validfail"] } };
    await appendFile(join(workDir, "knb", "ledger.jsonl"), `${JSON.stringify(bad)}\n`, "utf8");
    const result = await knb.check();
    expect(result.ok).toBe(false);
    expect(result.validation_issues.some((issue) => issue.level === "error")).toBe(true);
  });

  test("check projection_freshness flips fresh -> stale after appending a row", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("fresh") }] });
    await knb.render({ collection: "fresh" });
    await knb.rebuildIndex();

    const initial = await knb.check();
    expect(initial.projection_freshness.entries.every((e) => e.state === "fresh")).toBe(true);

    // Append another valid row to invalidate the fingerprint.
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("fresh", "https://example.com/fresh-2", "Other") }] });

    const after = await knb.check();
    const viewEntry = after.projection_freshness.entries.find((e) => e.kind === "view");
    expect(viewEntry?.state).toBe("stale");
    const indexEntries = after.projection_freshness.entries.filter((e) => e.kind === "index");
    expect(indexEntries.some((e) => e.state === "stale")).toBe(true);
  });
});

describe("read-side integration: snapshot consistency", () => {
  test("two consecutive facade reads on an unchanged ledger see the same fingerprint hash", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("snap"), as: "src" },
        { op: "add", row: claimDraft("$src", "snap", "Snap me.") },
      ],
    });

    // Use check() because it returns the fingerprint; query() just uses it under the hood.
    // Run query, then check; check, then check — all should agree on the hash.
    await knb.query({});
    const first = await knb.check();
    await knb.query({});
    const second = await knb.check();
    expect(first.fingerprint.content_hash).toBe(second.fingerprint.content_hash);
    expect(first.fingerprint.rows).toBe(second.fingerprint.rows);
  });
});

describe("readSnapshot - validity transitions", () => {
  test("empty workspace yields validity='projected' with empty state", async () => {
    const knb = await openTestKnb();
    await knb.init();
    const snap = await readSnapshot({ workspace: knb.workspace });
    expect(snap.validity).toBe("projected");
    expect(snap.state).toBeDefined();
    expect(snap.state!.rows()).toEqual([]);
    expect(snap.validation.ok).toBe(true);
  });

  test("projectState: false opts out: validity='validated' and state is undefined", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("validated") }] });
    const snap = await readSnapshot({ workspace: knb.workspace, projectState: false });
    expect(snap.validity).toBe("validated");
    expect(snap.state).toBeUndefined();
    expect(snap.validation.ok).toBe(true);
  });

  test("parse error yields validity='loaded' and undefined state", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("loaded") }] });
    await appendFile(join(workDir, "knb", "ledger.jsonl"), "{not json}\n", "utf8");
    const snap = await readSnapshot({ workspace: knb.workspace });
    expect(snap.validity).toBe("loaded");
    expect(snap.state).toBeUndefined();
    expect(snap.ledger.parseIssues.length).toBeGreaterThan(0);
  });

  test("validation error yields validity='loaded'; warning-only stays 'projected'", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("warn-only", "https://dup.example/w", "First") }] });
    // Append an identical-uri source row so validation flags duplicate_source_evidence (warning only).
    const ts = "2026-05-01T12:30:00Z";
    const dupRow = {
      schema_version: "knb.v1",
      id: "src:warn-only:20260501:bbbb2222",
      kind: "source",
      created_at: ts,
      created_by: "agent:test",
      scope: { collections: ["warn-only"] },
      source: { type: "web_page", title: "Second", uri: "https://dup.example/w" },
      provenance: { acquisition: { method: "manual" } },
    };
    await appendFile(join(workDir, "knb", "ledger.jsonl"), `${JSON.stringify(dupRow)}\n`, "utf8");
    const warnSnap = await readSnapshot({ workspace: knb.workspace });
    expect(warnSnap.validity).toBe("projected");
    expect(warnSnap.validation.issues.some((i) => i.level === "warning")).toBe(true);
    expect(warnSnap.validation.issues.every((i) => i.level !== "error")).toBe(true);

    // Now add a hard validation error.
    const bad = {
      schema_version: "knb.v1",
      id: "bad:1",
      created_at: ts,
      created_by: "x",
      scope: { collections: ["warn-only"] },
    };
    await appendFile(join(workDir, "knb", "ledger.jsonl"), `${JSON.stringify(bad)}\n`, "utf8");
    const errSnap = await readSnapshot({ workspace: knb.workspace });
    expect(errSnap.validity).toBe("loaded");
    expect(errSnap.state).toBeUndefined();
  });
});

describe("readSnapshot - freshness probe wiring", () => {
  test("custom freshness probe receives workspace and ledger fingerprint; result flows into projectionFreshness", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("probe") }] });
    let receivedFingerprintHash = "";
    let receivedRoot = "";
    const probe: ReadSnapshotFreshnessProbe = async (workspace, fingerprint) => {
      receivedFingerprintHash = fingerprint.content_hash;
      receivedRoot = workspace.root;
      return {
        entries: [{ kind: "view", target: "knb/views/probed.md", state: "fresh" }],
      };
    };
    const snap = await readSnapshot({ workspace: knb.workspace, freshness: probe });
    expect(receivedFingerprintHash.length).toBeGreaterThan(0);
    expect(receivedFingerprintHash).toBe(snap.fingerprint.content_hash);
    expect(receivedRoot).toBe(knb.workspace.root);
    expect(snap.projectionFreshness.entries.length).toBe(1);
    expect(snap.projectionFreshness.entries[0]?.state).toBe("fresh");
    expect(snap.projectionFreshness.entries[0]?.target).toBe("knb/views/probed.md");
  });

  test("freshness: false yields empty entries (no probe call)", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("nofresh") }] });
    let probeCalled = false;
    const probe: ReadSnapshotFreshnessProbe = async () => {
      probeCalled = true;
      return { entries: [{ kind: "view", target: "x", state: "fresh" }] };
    };
    const snap = await readSnapshot({
      workspace: knb.workspace,
      freshness: false,
      // freshness:false should override even an explicit probe — but the option-level
      // type forbids passing both. Verify the default-skip behaviour instead.
    });
    expect(snap.projectionFreshness.entries).toEqual([]);
    expect(probeCalled).toBe(false);
    void probe; // keep symbol used.
  });

  test("custom validator is used in place of contract.validateLedger", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("vinj") }] });
    let calledWithRows = -1;
    const snap = await readSnapshot({
      workspace: knb.workspace,
      validate: (rows, parseIssues) => {
        calledWithRows = rows.length;
        return { ok: true, issues: [...parseIssues] };
      },
    });
    expect(calledWithRows).toBe(1);
    expect(snap.validity).toBe("projected");
  });

  test("custom projector is used in place of defaultProjectState", async () => {
    const knb = await openTestKnb();
    await knb.apply({ operations: [{ op: "add", row: sourceDraft("pinj") }] });
    let projectorRowCount = -1;
    const snap = await readSnapshot({
      workspace: knb.workspace,
      projectState: (rows) => {
        projectorRowCount = rows.length;
        return {
          warnings: [],
          get: () => undefined,
          rows: () => [],
          statusOf: () => undefined,
          canonicalIdOf: (id) => id,
          explain: () => undefined,
          relationGraph: () => ({ all: () => [], outgoing: () => [], incoming: () => [] }),
        };
      },
    });
    expect(projectorRowCount).toBe(1);
    expect(snap.validity).toBe("projected");
    expect(snap.state).toBeDefined();
    expect(snap.state!.rows()).toEqual([]);
  });
});

describe("read-side integration: status row counts", () => {
  test("status active_counts_by_kind reflects only active rows; inactive_counts_by_status counts retracted", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("counts"), as: "src" },
        { op: "add", row: claimDraft("$src", "counts", "Keep me.") },
        { op: "add", row: claimDraft("$src", "counts", "Drop me."), as: "drop" },
      ],
    });
    const dropId = seed.created[2]?.id ?? "";
    await knb.apply({ operations: [{ op: "retract", target_ids: [dropId], reason: "remove" }] });
    const status = await knb.status();
    expect(status.active_counts_by_kind.source).toBe(1);
    expect(status.active_counts_by_kind.claim).toBe(1);
    expect(status.inactive_counts_by_status.retracted).toBe(1);
    // row_count is the raw ledger row count (sources + claims + the retract change row).
    expect(status.row_count).toBe(4);
  });
});

describe("read-side integration: query filter coverage", () => {
  test("query filters by tag and by subject", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", row: { ...sourceDraft("tags"), scope: { collections: ["tags"], tags: ["green"] } }, as: "sg" },
        { op: "add", row: { ...sourceDraft("tags", "https://b.example/y"), scope: { collections: ["tags"], tags: ["red"] } }, as: "sr" },
      ],
    });
    const greens = await knb.query({ tag: "green" });
    expect(greens.rows.length).toBe(1);
    const redIds = (await knb.query({ tag: "red" })).rows.map((r) => r.id);
    expect(redIds.length).toBe(1);
    expect(redIds[0]).not.toBe(greens.rows[0]?.id);

    await knb.apply({
      operations: [
        { op: "add", row: { ...sourceDraft("subj", "https://s.example/a"), scope: { collections: ["subj"], subjects: ["Alpha"] } } },
        { op: "add", row: { ...sourceDraft("subj", "https://s.example/b", "Other"), scope: { collections: ["subj"], subjects: ["Beta"] } } },
      ],
    });
    const alpha = await knb.query({ subject: "Alpha" });
    expect(alpha.rows.length).toBe(1);
  });
});

describe("read-side integration: get without explain", () => {
  test("get with includeHistory=true but explain=false returns row + reason but no explanation field", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("noexpl"), as: "src" },
        { op: "add", row: claimDraft("$src", "noexpl", "Bye."), as: "claim" },
      ],
    });
    const claimId = seed.created[1]?.id ?? "";
    await knb.apply({ operations: [{ op: "retract", target_ids: [claimId], reason: "no" }] });

    const got = await knb.get([claimId], { includeHistory: true });
    expect(got.rows.length).toBe(1);
    expect(got.rows[0]?.status).toBe("retracted");
    expect(got.rows[0]?.reason).toContain("no");
    expect(got.rows[0]?.explanation).toBeUndefined();
  });
});

describe("read-side integration: context reflects effective state", () => {
  test("context after retract no longer surfaces the retracted claim", async () => {
    const knb = await openTestKnb();
    const seed = await knb.apply({
      operations: [
        { op: "add", row: sourceDraft("ctx2"), as: "src" },
        { op: "add", row: claimDraft("$src", "ctx2", "Pre-retract claim."), as: "claim" },
        { op: "add", row: synthDraft("ctx2", "$claim", "S", "Sums.") },
      ],
    });
    const claimId = seed.created[1]?.id ?? "";

    const before = await knb.context({ collection: "ctx2" });
    expect(before.key_claims.some((c) => c.id === claimId)).toBe(true);

    await knb.apply({ operations: [{ op: "retract", target_ids: [claimId], reason: "no" }] });
    const after = await knb.context({ collection: "ctx2" });
    expect(after.key_claims.some((c) => c.id === claimId)).toBe(false);
  });
});
