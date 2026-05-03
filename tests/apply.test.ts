import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { applyOperations, previewApplyOperations, type ApplyDeps, type NoveltyDecision } from "../src/core/apply";
import type {
  ApplyOperation,
  ApplyRequest,
  ChangeRow,
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { canonicalContentHash, loadLedger } from "../src/core/ledger";

let workDir: string;

const FIXED_DATE = new Date("2026-05-01T12:00:00Z");

const ID_REGEX = /^(src|claim|q|synth|chg):[a-z0-9-]+:\d{8}:[a-zA-Z0-9]{8}$/;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-apply-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function ledgerPath(): string {
  return join(workDir, "knb", "ledger.jsonl");
}

function lockPath(): string {
  return join(workDir, ".knb", "ledger.lock");
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

function makeDeps(overrides?: {
  randomIdPart?: () => string;
  classifyNovelty?: (candidate: KnbRow, snapshot?: unknown) => NoveltyDecision;
  actor?: string;
  clock?: () => Date;
}): ApplyDeps {
  const deps: ApplyDeps = {
    workspace: { paths: { ledger: ledgerPath(), lock: lockPath() } },
    runtime: {
      clock: overrides?.clock ?? (() => FIXED_DATE),
      randomIdPart: overrides?.randomIdPart ?? (() => "abcd0001"),
    },
    actor: overrides?.actor ?? "agent:test",
  };
  if (overrides?.classifyNovelty) {
    const fn = overrides.classifyNovelty;
    deps.classifyNovelty = (row, snapshot) => fn(row, snapshot);
  }
  return deps;
}

const SOURCE_DRAFT = {
  kind: "source" as const,
  scope: { collections: ["example"] },
  source: {
    type: "web_page" as const,
    title: "Example",
    uri: "https://example.com",
  },
  provenance: {
    acquisition: { method: "manual" },
  },
};

function buildClaimDraft(overrides?: { uri?: string; statement?: string }) {
  return {
    kind: "claim" as const,
    scope: { collections: ["example"] },
    identity: { claim_key: "example|exists" },
    claim: {
      statement: overrides?.statement ?? "Example exists.",
      atomic: true,
    },
    time: { precision: "unknown" as const },
    provenance: {
      evidence: [
        {
          source_id: "$source",
          role: "supports" as const,
          summary: "The source supports the claim.",
        },
      ],
    },
    assessment: { confidence: "high" as const },
  };
}

async function seedLedger(rows: KnbRow[]): Promise<void> {
  await mkdir(join(workDir, "knb"), { recursive: true });
  const text = rows.map((row) => JSON.stringify(row)).join("\n") + (rows.length ? "\n" : "");
  await writeFile(ledgerPath(), text, "utf8");
}

async function readLedgerText(): Promise<string> {
  return readFile(ledgerPath(), "utf8");
}

describe("applyOperations", () => {
  test("previewApplyOperations plans a valid batch without writing ledger bytes or lock files", async () => {
    const result = await previewApplyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }] },
      makeDeps(),
    );

    expect(result.created.length).toBe(1);
    expect(result.created[0]?.kind).toBe("source");
    expect(result.meta.dry_run).toBe(true);
    expect(result.meta.planned_rows).toBe(1);
    expect(result.meta.rows_appended).toBe(0);
    expect(result.meta.bytes_written).toBe(0);
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
    expect(await pathExists(join(workDir, ".knb", "runs", `${result.run_id}.json`))).toBe(false);
  });

  test("previewApplyOperations catches final-ledger validation errors without mutating existing rows", async () => {
    const seed = await applyOperations(
      {
        operations: [
          { op: "add", as: "a", row: SOURCE_DRAFT },
          {
            op: "add",
            as: "b",
            row: {
              ...SOURCE_DRAFT,
              source: { type: "web_page" as const, title: "Other", uri: "https://example.com/other" },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: (() => {
        const parts = ["aaaa0001", "bbbb0002"];
        let index = 0;
        return () => parts[index++] ?? "cccc0003";
      })() }),
    );
    const before = await readLedgerText();

    let caught: unknown;
    try {
      await previewApplyOperations(
        {
          operations: [
            {
              op: "relate",
              from_id: seed.created[0]?.id ?? "",
              to_id: seed.created[1]?.id ?? "",
              rel: "partial_answer_to" as never,
              scope: { collections: ["example"] },
            },
          ],
        },
        makeDeps(),
      );
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code?: string }).code).toBe("validation_failed");
    const issues = (caught as {
      details?: { issues?: Array<{ code?: string; op_index?: number; op_path?: string }> };
    }).details?.issues ?? [];
    const relIssue = issues.find((issue) => issue.code === "relation_kind_invalid");
    expect(relIssue?.op_index).toBe(0);
    expect(relIssue?.op_path).toBe("operations[0].rel");
    expect(await readLedgerText()).toBe(before);
  });

  test("empty operations returns successful no-op without touching the ledger or creating a lock", async () => {
    const request: ApplyRequest = { operations: [] };
    const result = await applyOperations(request, makeDeps());

    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.novelty).toEqual([]);
    expect(result.meta.rows_appended).toBe(0);
    expect(result.meta.bytes_written).toBe(0);
    expect(result.meta.ledger_path).toBe(ledgerPath());
    // empty fingerprint = sha256 of empty string
    expect(result.meta.fingerprint_after.content_hash).toBe(
      "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
    expect(result.meta.fingerprint_after.rows).toBe(0);
    expect(result.meta.fingerprint_after.bytes).toBe(0);

    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("invalid operation shape fails request validation before lock acquisition", async () => {
    const request = { operations: [{ op: "delete" }] } as unknown as ApplyRequest;
    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }

    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    const issues = (thrown as {
      details?: { issues?: Array<{ code?: string; op_index?: number; op_path?: string }> };
    }).details?.issues ?? [];
    expect(issues[0]?.code).toBe("operation_kind_invalid");
    expect(issues[0]?.op_index).toBe(0);
    expect(issues[0]?.op_path).toBe("operations[0].op");
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("atomic: false rejects with unsafe_operation_refused before lock acquired", async () => {
    const request = {
      operations: [{ op: "add", row: SOURCE_DRAFT }],
      atomic: false,
    } as unknown as ApplyRequest;

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("unsafe_operation_refused");
    expect((thrown as { details?: { path?: string } }).details?.path).toBe("atomic");

    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("atomic: true is treated identically to undefined", async () => {
    const request = { operations: [{ op: "add", row: SOURCE_DRAFT }], atomic: true } as ApplyRequest;
    const result = await applyOperations(request, makeDeps());
    expect(result.created).toHaveLength(1);
    expect(result.created[0]?.id).toMatch(ID_REGEX);
  });

  test("single add source row appends one JSONL row with deterministic id and fingerprint matching reload", async () => {
    const request: ApplyRequest = {
      operations: [{ op: "add", row: SOURCE_DRAFT }],
    };
    const result = await applyOperations(request, makeDeps());

    expect(result.created).toHaveLength(1);
    const created = result.created[0];
    expect(created?.id).toBe("src:example:20260501:abcd0001");
    expect(created?.id).toMatch(ID_REGEX);
    expect(created?.kind).toBe("source");
    expect(created?.op).toBe(0);
    expect(created?.as).toBeUndefined();
    expect(result.meta.rows_appended).toBe(1);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(result.skipped).toEqual([]);
    expect(result.warnings).toEqual([]);
    // sources are not classified -> novelty default ("new", no matches)
    expect(result.novelty).toEqual([
      { op: 0, classification: "new", matched_ids: [] },
    ]);

    const onDisk = await readLedgerText();
    const lines = onDisk.trim().split("\n");
    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] as string) as SourceRow;
    expect(parsed.id).toBe("src:example:20260501:abcd0001");
    expect(parsed.created_at).toBe(FIXED_DATE.toISOString());
    expect(parsed.created_by).toBe("agent:test");
    expect(parsed.schema_version).toBe("knb.v1");
    expect(parsed.kind).toBe("source");
    expect(parsed.scope.collections).toEqual(["example"]);
    expect(parsed.source.uri).toBe("https://example.com");

    // fingerprint_after must equal a fresh load
    const reload = await loadLedger({ path: ledgerPath() });
    expect(result.meta.fingerprint_after.content_hash).toBe(reload.fingerprint.content_hash);
    expect(result.meta.fingerprint_after.bytes).toBe(reload.fingerprint.bytes);
    expect(result.meta.fingerprint_after.rows).toBe(reload.fingerprint.rows);
    expect(result.meta.fingerprint_after.content_hash).toBe(canonicalContentHash(onDisk));

    // lock file is gone
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("ID format and prefix coverage for all 5 kinds", async () => {
    // source first (claim/synth/question reference it)
    const sourceIds = ["sssssssa", "ccccccca", "qqqqqqqa", "ssssssss", "chggchgg"];
    let i = 0;
    const claim = {
      ...buildClaimDraft(),
      provenance: {
        evidence: [{ source_id: "$source", role: "supports" as const, summary: "ok" }],
      },
    };
    const question = {
      kind: "question" as const,
      scope: { collections: ["example"] },
      question: { text: "Why?", status: "open" as const, priority: "low" as const },
    };
    const synthesis = {
      kind: "synthesis" as const,
      scope: { collections: ["example"] },
      synthesis: {
        title: "T",
        summary: "S",
        basis: { claim_ids: ["$claim"] },
        status: "active" as const,
      },
    };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "source", row: SOURCE_DRAFT },
          { op: "add", as: "claim", row: claim },
          { op: "add", as: "q", row: question },
          { op: "add", as: "synth", row: synthesis },
          { op: "retract", target_ids: ["$claim"], reason: "x" },
        ],
      },
      makeDeps({ randomIdPart: () => sourceIds[i++] ?? "fff00000" }),
    );

    expect(result.created).toHaveLength(5);
    expect(result.created[0]?.id).toMatch(/^src:example:20260501:[a-zA-Z0-9]{8}$/);
    expect(result.created[1]?.id).toMatch(/^claim:example:20260501:[a-zA-Z0-9]{8}$/);
    expect(result.created[2]?.id).toMatch(/^q:example:20260501:[a-zA-Z0-9]{8}$/);
    expect(result.created[3]?.id).toMatch(/^synth:example:20260501:[a-zA-Z0-9]{8}$/);
    expect(result.created[4]?.id).toMatch(/^chg:example:20260501:[a-zA-Z0-9]{8}$/);

    expect(result.created[0]?.kind).toBe("source");
    expect(result.created[1]?.kind).toBe("claim");
    expect(result.created[2]?.kind).toBe("question");
    expect(result.created[3]?.kind).toBe("synthesis");
    expect(result.created[4]?.kind).toBe("change");

    // novelty has an entry for every add op (5 - 1 lifecycle = 4)
    // and only the claim has a non-default classification path; sources/questions/syntheses default to "new"
    expect(result.novelty.map((n) => n.op)).toEqual([0, 1, 2, 3]);
  });

  test("scope-slug priority: collections > subjects > tags", async () => {
    // collections wins
    const ranked = await applyOperations(
      {
        operations: [
          {
            op: "add",
            row: {
              ...SOURCE_DRAFT,
              scope: { collections: ["alpha"], subjects: ["Beta"], tags: ["gamma"] },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: () => "rrrrrrr1" }),
    );
    expect(ranked.created[0]?.id).toBe("src:alpha:20260501:rrrrrrr1");

    // workspace cleared between tests by beforeEach; for the next two calls reset by writing fresh dirs
    await rm(ledgerPath(), { force: true });

    // subjects-only
    const subjOnly = await applyOperations(
      {
        operations: [
          {
            op: "add",
            row: {
              ...SOURCE_DRAFT,
              scope: { subjects: ["Some Subject"] },
              source: { ...SOURCE_DRAFT.source, uri: "https://example.com/sub" },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: () => "rrrrrrr2" }),
    );
    expect(subjOnly.created[0]?.id).toBe("src:some-subject:20260501:rrrrrrr2");

    await rm(ledgerPath(), { force: true });

    // tags-only
    const tagOnly = await applyOperations(
      {
        operations: [
          {
            op: "add",
            row: {
              ...SOURCE_DRAFT,
              scope: { tags: ["the-tag"] },
              source: { ...SOURCE_DRAFT.source, uri: "https://example.com/tag" },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: () => "rrrrrrr3" }),
    );
    expect(tagOnly.created[0]?.id).toBe("src:the-tag:20260501:rrrrrrr3");
  });

  test("scope without any anchor on add throws scope_anchor_required-equivalent and writes nothing", async () => {
    const draft = { ...SOURCE_DRAFT, scope: {} };
    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: draft as unknown as typeof SOURCE_DRAFT }] },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    expect((thrown as { details?: { code?: string } }).details?.code).toBe("scope_anchor_required");
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("add claim referencing a prior add via $alias resolves to the source id", async () => {
    let counter = 0;
    const ids = ["aaaa1111", "bbbb2222"];
    const request: ApplyRequest = {
      operations: [
        { op: "add", as: "source", row: SOURCE_DRAFT },
        { op: "add", row: buildClaimDraft() },
      ],
    };
    const result = await applyOperations(
      request,
      makeDeps({ randomIdPart: () => ids[counter++] as string }),
    );

    expect(result.created).toHaveLength(2);
    const sourceId = result.created[0]?.id as string;
    const claimId = result.created[1]?.id as string;
    expect(sourceId).toBe("src:example:20260501:aaaa1111");
    expect(claimId).toBe("claim:example:20260501:bbbb2222");

    const onDisk = await readLedgerText();
    const lines = onDisk.trim().split("\n");
    const claim = JSON.parse(lines[1] as string) as ClaimRow;
    expect(claim.provenance.evidence?.[0]?.source_id).toBe(sourceId);
    expect(claim.created_by).toBe("agent:test");
  });

  test("add claim referencing a prior add via $op0 (positional) resolves correctly", async () => {
    const ids = ["op0aaa11", "op0bbb22"];
    let i = 0;
    const claim = {
      ...buildClaimDraft(),
      provenance: {
        evidence: [{ source_id: "$op0", role: "supports" as const, summary: "ok" }],
      },
    };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", row: SOURCE_DRAFT },
          { op: "add", row: claim },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const sourceId = result.created[0]?.id as string;
    const onDisk = await readLedgerText();
    const claimRow = JSON.parse(onDisk.trim().split("\n")[1] as string) as ClaimRow;
    expect(claimRow.provenance.evidence?.[0]?.source_id).toBe(sourceId);
  });

  test("forward reference $op2 in op 0 throws broken_reference and writes nothing", async () => {
    const draft = buildClaimDraft();
    draft.provenance.evidence[0]!.source_id = "$op2";
    const request: ApplyRequest = {
      operations: [
        { op: "add", row: draft },
        { op: "add", row: SOURCE_DRAFT },
        { op: "add", row: SOURCE_DRAFT },
      ],
    };

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps({ randomIdPart: () => "abcd0001" }));
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("broken_reference");
    expect((thrown as { details?: { ref?: string } }).details?.ref).toBe("$op2");
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("independent semantic errors across operations are returned in one envelope", async () => {
    let thrown: unknown;
    try {
      await applyOperations(
        {
          operations: [
            {
              op: "add",
              row: {
                ...buildClaimDraft(),
                provenance: {
                  evidence: [
                    { source_id: "src:missing", role: "supports", summary: "Missing." },
                  ],
                },
              },
            },
            {
              op: "add",
              row: {
                ...SOURCE_DRAFT,
                scope: {},
              },
            },
          ],
        },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }

    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("broken_reference");
    const issues = (thrown as {
      details?: { issues?: Array<{ code?: string; op_index?: number; message?: string }> };
    }).details?.issues ?? [];
    expect(issues.some((issue) => issue.op_index === 0 && issue.code === "broken_reference")).toBe(true);
    expect(issues.some((issue) => issue.op_index === 1 && issue.code === "scope_anchor_required")).toBe(true);
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("dependent alias fallout from an earlier failed op is filtered from multi-error output", async () => {
    let thrown: unknown;
    try {
      await applyOperations(
        {
          operations: [
            {
              op: "add",
              as: "source",
              row: {
                ...SOURCE_DRAFT,
                scope: {},
              },
            },
            {
              op: "add",
              row: buildClaimDraft(),
            },
          ],
        },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }

    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    const issues = (thrown as {
      details?: { issues?: Array<{ code?: string; op_index?: number; ref?: string }> };
    }).details?.issues ?? [];
    expect(issues).toHaveLength(1);
    expect(issues[0]?.op_index).toBe(0);
    expect(issues[0]?.code).toBe("scope_anchor_required");
    expect(issues.some((issue) => issue.ref === "$source")).toBe(false);
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("reference resolved in provenance.source_ids[]", async () => {
    const claim = {
      ...buildClaimDraft(),
      provenance: {
        source_ids: ["$src"],
        evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }],
      },
    };
    const ids = ["srcsrc01", "claimcc1"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", row: claim },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const onDisk = await readLedgerText();
    const claimRow = JSON.parse(onDisk.trim().split("\n")[1] as string) as ClaimRow;
    expect(claimRow.provenance.source_ids).toEqual([result.created[0]?.id as string]);
  });

  test("reference resolved in synthesis.basis.{claim_ids,question_ids,source_ids}", async () => {
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
    };
    const questionDraft = {
      kind: "question" as const,
      scope: { collections: ["example"] },
      question: { text: "Why?", status: "open" as const },
    };
    const synthesisDraft = {
      kind: "synthesis" as const,
      scope: { collections: ["example"] },
      synthesis: {
        title: "T",
        summary: "S",
        basis: {
          claim_ids: ["$cl"],
          question_ids: ["$q"],
          source_ids: ["$src"],
        },
        status: "active" as const,
      },
    };
    const ids = ["aaaaaaaa", "bbbbbbbb", "cccccccc", "dddddddd"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", as: "cl", row: claimDraft },
          { op: "add", as: "q", row: questionDraft },
          { op: "add", row: synthesisDraft },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] ?? "fffffff0" }),
    );
    const srcId = result.created[0]?.id as string;
    const clId = result.created[1]?.id as string;
    const qId = result.created[2]?.id as string;
    const synthRow = JSON.parse((await readLedgerText()).trim().split("\n")[3] as string) as SynthesisRow;
    expect(synthRow.synthesis.basis.claim_ids).toEqual([clId]);
    expect(synthRow.synthesis.basis.question_ids).toEqual([qId]);
    expect(synthRow.synthesis.basis.source_ids).toEqual([srcId]);
  });

  test("reference resolved in question.answer_claim_id", async () => {
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
    };
    const questionDraft = {
      kind: "question" as const,
      scope: { collections: ["example"] },
      question: {
        text: "Q?",
        status: "resolved" as const,
        answer_claim_id: "$cl",
      },
    };
    const ids = ["aaaa1111", "bbbb2222", "cccc3333"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", as: "cl", row: claimDraft },
          { op: "add", row: questionDraft },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] ?? "ffff0000" }),
    );
    const clId = result.created[1]?.id as string;
    const qRow = JSON.parse((await readLedgerText()).trim().split("\n")[2] as string) as QuestionRow;
    expect(qRow.question.answer_claim_id).toBe(clId);
  });

  test("reference resolved in relations[].target_id on an add", async () => {
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
      relations: [{ target_id: "$src", rel: "context_for" as const }],
    };
    const ids = ["srcsrc01", "claimrel"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", row: claimDraft },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const srcId = result.created[0]?.id as string;
    const claimRow = JSON.parse((await readLedgerText()).trim().split("\n")[1] as string) as ClaimRow;
    expect(claimRow.relations?.[0]?.target_id).toBe(srcId);
  });

  test("provided id on add is preserved", async () => {
    const draft = { ...SOURCE_DRAFT, id: "src:custom:20260101:zzzz9999" };
    const request: ApplyRequest = { operations: [{ op: "add", row: draft }] };
    const result = await applyOperations(request, makeDeps());
    expect(result.created[0]?.id).toBe("src:custom:20260101:zzzz9999");
    const onDisk = await readLedgerText();
    const parsed = JSON.parse(onDisk.trim()) as SourceRow;
    expect(parsed.id).toBe("src:custom:20260101:zzzz9999");
  });

  test("provided id colliding with existing snapshot row triggers duplicate_blocked and leaves ledger unchanged", async () => {
    const existing: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:exist000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "Existing", uri: "https://existing.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([existing]);
    const before = await readLedgerText();
    const draft = { ...SOURCE_DRAFT, id: existing.id };
    const request: ApplyRequest = { operations: [{ op: "add", row: draft }] };

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect((thrown as { details?: { id?: string } }).details?.id).toBe(existing.id);

    const after = await readLedgerText();
    expect(after).toBe(before);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("provided id colliding with another op in the same batch triggers duplicate_blocked", async () => {
    const customId = "src:example:20260101:samebat0";
    const draftA = { ...SOURCE_DRAFT, id: customId };
    const draftB = { ...SOURCE_DRAFT, id: customId, source: { ...SOURCE_DRAFT.source, uri: "https://example.com/b" } };
    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: draftA }, { op: "add", row: draftB }] },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("ID collision retries succeed after exhausting the colliding random parts", async () => {
    const existing: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260501:collide0",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "Existing", uri: "https://existing.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([existing]);

    const sequence = ["collide0", "collide0", "unique11"];
    let i = 0;
    const request: ApplyRequest = { operations: [{ op: "add", row: SOURCE_DRAFT }] };
    const result = await applyOperations(
      request,
      makeDeps({ randomIdPart: () => sequence[i++] ?? "fallback" }),
    );
    expect(result.created[0]?.id).toBe("src:example:20260501:unique11");
    // confirm that exactly the colliding count + 1 calls occurred
    expect(i).toBe(3);
  });

  test("ID collision retry exhaustion (8 attempts) throws duplicate_blocked", async () => {
    const existing: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260501:foreverc",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "Existing", uri: "https://existing.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([existing]);
    const before = await readLedgerText();

    let calls = 0;
    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: SOURCE_DRAFT }] },
        makeDeps({
          randomIdPart: () => {
            calls += 1;
            return "foreverc";
          },
        }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect(calls).toBe(8);

    const after = await readLedgerText();
    expect(after).toBe(before);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("retract appends a single change row with derived scope and complete chg fields", async () => {
    const claim: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:example:20260101:target00",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["physics"], subjects: ["Newton"] },
      identity: { claim_key: "k" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:example:20260101:src00000", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:src00000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["physics"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource, claim]);

    const request: ApplyRequest = {
      operations: [{ op: "retract", target_ids: [claim.id], reason: "Wrong premise" }],
    };
    const result = await applyOperations(request, makeDeps());
    expect(result.created).toHaveLength(1);
    expect(result.created[0]?.kind).toBe("change");
    const onDisk = await readLedgerText();
    const lines = onDisk.trim().split("\n");
    expect(lines).toHaveLength(3);
    const change = JSON.parse(lines[lines.length - 1] as string) as ChangeRow;
    expect(change.kind).toBe("change");
    expect(change.schema_version).toBe("knb.v1");
    expect(change.created_at).toBe(FIXED_DATE.toISOString());
    expect(change.created_by).toBe("agent:test");
    expect(change.id).toBe("chg:physics:20260501:abcd0001");
    expect(change.change.action).toBe("retract");
    expect(change.change.target_ids).toEqual([claim.id]);
    expect(change.change.reason).toBe("Wrong premise");
    expect(change.scope.collections).toEqual(["physics"]);
    expect(change.change.relation).toBeUndefined();
    expect(change.change.replacement_id).toBeUndefined();
    expect(change.change.canonical_id).toBeUndefined();
    expect(change.change.patch).toBeUndefined();
  });

  test("supersede with explicit op.scope overrides derivation; reason and replacement preserved", async () => {
    const claim: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:foo:20260101:tgt00000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["foo"] },
      identity: { claim_key: "k" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:foo:20260101:src00000", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const replacement: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:foo:20260101:rep00000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["foo"] },
      identity: { claim_key: "k2" },
      claim: { statement: "y", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:foo:20260101:src00000", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const source: SourceRow = {
      schema_version: "knb.v1",
      id: "src:foo:20260101:src00000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["foo"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([source, claim, replacement]);

    const request: ApplyRequest = {
      operations: [
        {
          op: "supersede",
          target_ids: [claim.id],
          replacement_id: replacement.id,
          reason: "Better claim",
          scope: { collections: ["override-scope"] },
        },
      ],
    };
    const result = await applyOperations(request, makeDeps());
    const onDisk = await readLedgerText();
    const change = JSON.parse(onDisk.trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.action).toBe("supersede");
    expect(change.change.replacement_id).toBe(replacement.id);
    expect(change.change.target_ids).toEqual([claim.id]);
    expect(change.change.reason).toBe("Better claim");
    expect(change.scope.collections).toEqual(["override-scope"]);
    expect(change.id).toBe("chg:override-scope:20260501:abcd0001");
    expect(result.created[0]?.kind).toBe("change");
  });

  test("merge produces change row with target_ids, canonical_id, derived scope, and reason", async () => {
    const a: SourceRow = {
      schema_version: "knb.v1",
      id: "src:bar:20260101:aaaaa000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["bar"] },
      source: { type: "web_page", title: "A", uri: "https://example.com/a" },
      provenance: { acquisition: { method: "manual" } },
    };
    const b: SourceRow = { ...a, id: "src:bar:20260101:bbbbb000", source: { ...a.source, uri: "https://example.com/b" } };
    await seedLedger([a, b]);

    const request: ApplyRequest = {
      operations: [
        {
          op: "merge",
          target_ids: [b.id],
          canonical_id: a.id,
          reason: "Same source",
        },
      ],
    };
    await applyOperations(request, makeDeps());
    const onDisk = await readLedgerText();
    const change = JSON.parse(onDisk.trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.action).toBe("merge");
    expect(change.change.target_ids).toEqual([b.id]);
    expect(change.change.canonical_id).toBe(a.id);
    expect(change.change.reason).toBe("Same source");
    expect(change.scope.collections).toEqual(["bar"]);
    expect(change.id).toBe("chg:bar:20260501:abcd0001");
  });

  test("relate produces a change row with change.relation populated and derived scope", async () => {
    const a: SourceRow = {
      schema_version: "knb.v1",
      id: "src:rel:20260101:aaaaa000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["rel"] },
      source: { type: "web_page", title: "A", uri: "https://example.com/a" },
      provenance: { acquisition: { method: "manual" } },
    };
    const b: SourceRow = { ...a, id: "src:rel:20260101:bbbbb000", source: { ...a.source, uri: "https://example.com/b" } };
    await seedLedger([a, b]);

    const request: ApplyRequest = {
      operations: [
        {
          op: "relate",
          from_id: a.id,
          to_id: b.id,
          rel: "supports",
          rationale: "A backs B",
          strength: "high",
        },
      ],
    };
    await applyOperations(request, makeDeps());
    const onDisk = await readLedgerText();
    const change = JSON.parse(onDisk.trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.action).toBe("relate");
    expect(change.change.relation?.from_id).toBe(a.id);
    expect(change.change.relation?.to_id).toBe(b.id);
    expect(change.change.relation?.rel).toBe("supports");
    expect(change.change.relation?.rationale).toBe("A backs B");
    expect(change.change.relation?.strength).toBe("high");
    expect(change.scope.collections).toEqual(["rel"]);
    // a relate op never produces inline relations[] on the change row
    expect((change as unknown as { relations?: unknown }).relations).toBeUndefined();
  });

  test("patch produces change row; original target row on disk is NOT mutated", async () => {
    const claim: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:patch:20260101:tgt00000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["patch"] },
      identity: { claim_key: "k" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:patch:20260101:src00000", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const source: SourceRow = {
      schema_version: "knb.v1",
      id: "src:patch:20260101:src00000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["patch"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([source, claim]);
    const before = await readLedgerText();
    const beforeLines = before.trim().split("\n");
    const beforeClaimLine = beforeLines[1] as string;

    const patchOps = [{ op: "replace", path: "/claim/statement", value: "x." }];
    const request: ApplyRequest = {
      operations: [
        {
          op: "patch",
          target_id: claim.id,
          patch: patchOps,
          reason: "typo",
        },
      ],
    };
    await applyOperations(request, makeDeps());
    const onDisk = await readLedgerText();
    const lines = onDisk.trim().split("\n");
    expect(lines).toHaveLength(3);
    // claim row line is byte-identical
    expect(lines[1]).toBe(beforeClaimLine);
    const change = JSON.parse(lines[2] as string) as ChangeRow;
    expect(change.change.action).toBe("patch");
    expect(change.change.target_id).toBe(claim.id);
    expect(change.change.patch).toEqual(patchOps);
    expect(change.change.reason).toBe("typo");
    // patch sets target_id (not target_ids)
    expect(change.change.target_ids).toBeUndefined();
  });

  test("derived scope falls back to first target's first anchor when targets share NO collection/subject/tag", async () => {
    const source: SourceRow = {
      schema_version: "knb.v1",
      id: "src:nosharc:20260101:src00000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["seed-coll"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    const c1: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:foofirst:20260101:cone0000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["foo-first", "alpha"] },
      identity: { claim_key: "k1" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: { evidence: [{ source_id: source.id, role: "supports", summary: "ok" }] },
      assessment: { confidence: "high" },
    };
    const c2: ClaimRow = {
      ...c1,
      id: "claim:bardiff:20260101:ctwo0000",
      scope: { collections: ["bar-different"] },
      identity: { claim_key: "k2" },
    };
    await seedLedger([source, c1, c2]);

    const request: ApplyRequest = {
      operations: [{ op: "retract", target_ids: [c1.id, c2.id], reason: "no overlap" }],
    };
    await applyOperations(request, makeDeps());
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    // Falls back to first target's first anchor (foo-first)
    expect(change.scope.collections).toEqual(["foo-first"]);
    expect(change.id).toBe("chg:foo-first:20260501:abcd0001");
  });

  test("validation failure inside callback writes nothing and releases the lock", async () => {
    const badDraft = {
      kind: "claim" as const,
      scope: { collections: ["example"] },
      // missing identity / claim / time / provenance / assessment
    };

    const request: ApplyRequest = {
      operations: [{ op: "add", row: badDraft as unknown as ApplyOperation extends { op: "add"; row: infer R } ? R : never }],
    };

    let thrown: unknown;
    try {
      await applyOperations(request, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");

    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(lockPath())).toBe(false);
  });

  test("relations[].target_id pointing at unknown id is caught by final validation; ledger unchanged", async () => {
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: {
        evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }],
      },
      // Manually injected target_id that's not a $alias and not in snapshot.
      // resolveRef will reject it as broken_reference because it's neither $-prefixed
      // nor a known id.
      relations: [{ target_id: "src:nope:nope:nope0000", rel: "context_for" as const }],
    };
    let thrown: unknown;
    try {
      await applyOperations(
        {
          operations: [
            { op: "add", row: SOURCE_DRAFT },
            { op: "add", row: claimDraft },
          ],
        },
        makeDeps({ randomIdPart: () => "abcd0001" }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("broken_reference");
    expect(await pathExists(ledgerPath())).toBe(false);
  });

  test("synthesis with claim_id that points at a SOURCE row is caught by final validation", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:srcseed1",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);
    const before = await readLedgerText();

    const synthDraft = {
      kind: "synthesis" as const,
      scope: { collections: ["example"] },
      synthesis: {
        title: "T",
        summary: "S",
        // claim_ids points at a source row -> synthesis_basis_kind_mismatch
        basis: { claim_ids: [seedSource.id] },
        status: "active" as const,
      },
    };

    let thrown: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: synthDraft }] },
        makeDeps(),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");

    const after = await readLedgerText();
    expect(after).toBe(before);
  });

  test("lock-busy maps to lock_busy and leaves any pre-existing ledger byte-identical", async () => {
    // Pre-existing seed
    const existing: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:keepkeep",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "Existing", uri: "https://existing.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([existing]);
    const before = await readLedgerText();

    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(lockPath(), "", "utf8");

    let thrown: unknown;
    try {
      await applyOperations({ operations: [{ op: "add", row: SOURCE_DRAFT }] }, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("lock_busy");
    expect((thrown as { details?: { lockPath?: string } }).details?.lockPath).toBe(lockPath());

    const after = await readLedgerText();
    expect(after).toBe(before);
  });

  test("two sequential applies: second sees first's rows in its locked snapshot", async () => {
    const ids = ["src00001", "src00002"];
    let i = 0;
    const deps = makeDeps({ randomIdPart: () => ids[i++] ?? "ffffffff" });
    await applyOperations({ operations: [{ op: "add", row: SOURCE_DRAFT }] }, deps);
    await applyOperations(
      {
        operations: [
          {
            op: "add",
            row: { ...SOURCE_DRAFT, source: { ...SOURCE_DRAFT.source, uri: "https://example.com/2" } },
          },
        ],
      },
      deps,
    );

    const snapshot = await loadLedger({ path: ledgerPath() });
    expect(snapshot.rows).toHaveLength(2);
    expect((snapshot.rows[0]?.row as { id: string }).id).toBe("src:example:20260501:src00001");
    expect((snapshot.rows[1]?.row as { id: string }).id).toBe("src:example:20260501:src00002");
  });

  test("dedupe + duplicate single-match: row skipped, alias rebound, subsequent op resolves to canonical", async () => {
    const canonical: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:example:20260101:canon000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      identity: { claim_key: "k" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:example:20260101:srccccc0", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:srccccc0",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource, canonical]);

    const ids = ["aaaa1111", "bbbb2222", "cccc3333"];
    let i = 0;
    const deps = makeDeps({
      randomIdPart: () => ids[i++] ?? "ffffffff",
      classifyNovelty: (candidate) => {
        if (candidate.kind === "claim") {
          return { classification: "duplicate", matched_ids: [canonical.id] };
        }
        return { classification: "new", matched_ids: [] };
      },
    });

    const request: ApplyRequest = {
      dedupe: true,
      operations: [
        {
          op: "add",
          as: "newClaim",
          row: { ...buildClaimDraft(), provenance: { evidence: [{ source_id: seedSource.id, role: "supports", summary: "x" }] } },
        },
        // op 1 references the skipped op via $alias and via $op0 — both must resolve to canonical id
        { op: "retract", target_ids: ["$newClaim"], reason: "stale" },
        { op: "retract", target_ids: ["$op0"], reason: "via $op0" },
      ],
    };
    const result = await applyOperations(request, deps);

    expect(result.skipped).toHaveLength(1);
    expect(result.skipped[0]?.op).toBe(0);
    expect(result.skipped[0]?.matched_ids).toEqual([canonical.id]);
    expect(result.skipped[0]?.reason).toContain(canonical.id);
    expect(result.created).toHaveLength(2);
    expect(result.created.every((c) => c.kind === "change")).toBe(true);
    // novelty still records the classification for the skipped op
    expect(result.novelty).toHaveLength(1);
    expect(result.novelty[0]).toEqual({ op: 0, classification: "duplicate", matched_ids: [canonical.id] });

    const onDisk = await readLedgerText();
    const lines = onDisk.trim().split("\n");
    expect(lines).toHaveLength(4); // 2 seed + 2 change rows
    const change1 = JSON.parse(lines[2] as string) as ChangeRow;
    const change2 = JSON.parse(lines[3] as string) as ChangeRow;
    expect(change1.change.target_ids).toEqual([canonical.id]);
    expect(change2.change.target_ids).toEqual([canonical.id]);
  });

  test("dedupe + duplicate with multiple matches throws duplicate_blocked and writes nothing", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:srccccc0",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);
    const before = await readLedgerText();

    const deps = makeDeps({
      classifyNovelty: () => ({ classification: "duplicate", matched_ids: ["a", "b"] }),
    });
    const request: ApplyRequest = {
      dedupe: true,
      operations: [
        { op: "add", row: { ...buildClaimDraft(), provenance: { evidence: [{ source_id: seedSource.id, role: "supports", summary: "x" }] } } },
      ],
    };

    let thrown: unknown;
    try {
      await applyOperations(request, deps);
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("duplicate_blocked");
    expect((thrown as { details?: { matched_ids?: string[] } }).details?.matched_ids).toEqual(["a", "b"]);
    expect(await readLedgerText()).toBe(before);
  });

  test("without dedupe, duplicate classification still appends row but reports classification", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:srccccc0",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);

    const deps = makeDeps({
      classifyNovelty: () => ({ classification: "duplicate", matched_ids: ["existing"] }),
    });
    const request: ApplyRequest = {
      operations: [
        { op: "add", row: { ...buildClaimDraft(), provenance: { evidence: [{ source_id: seedSource.id, role: "supports", summary: "x" }] } } },
      ],
    };
    const result = await applyOperations(request, deps);
    expect(result.created).toHaveLength(1);
    expect(result.created[0]?.id).not.toBe("existing");
    expect(result.skipped).toEqual([]);
    expect(result.novelty).toEqual([
      { op: 0, classification: "duplicate", matched_ids: ["existing"] },
    ]);
  });

  test("classifier is called only for claim adds, never for sources/questions/syntheses/lifecycle", async () => {
    const seenKinds: string[] = [];
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
    };
    const questionDraft = {
      kind: "question" as const,
      scope: { collections: ["example"] },
      question: { text: "Why?", status: "open" as const },
    };
    const synthesisDraft = {
      kind: "synthesis" as const,
      scope: { collections: ["example"] },
      synthesis: {
        title: "T",
        summary: "S",
        basis: { claim_ids: ["$cl"] },
        status: "active" as const,
      },
    };
    const ids = ["aaaaaaaa", "bbbbbbbb", "cccccccc", "dddddddd", "eeeeeeee"];
    let i = 0;
    await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", as: "cl", row: claimDraft },
          { op: "add", row: questionDraft },
          { op: "add", row: synthesisDraft },
          { op: "retract", target_ids: ["$cl"], reason: "x" },
        ],
      },
      makeDeps({
        randomIdPart: () => ids[i++] ?? "fffffff0",
        classifyNovelty: (candidate) => {
          seenKinds.push(candidate.kind);
          return { classification: "new", matched_ids: [] };
        },
      }),
    );
    expect(seenKinds).toEqual(["claim"]);
  });

  test("classifier receives the locked snapshot containing the seeded rows", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:locksnap",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);

    let snapshotRowCount = -1;
    let snapshotIds: string[] = [];
    const deps = makeDeps({
      randomIdPart: () => "claimid1",
      classifyNovelty: (_candidate, snapshot) => {
        const snap = snapshot as { rows: Array<{ row: { id: string } }> };
        snapshotRowCount = snap.rows.length;
        snapshotIds = snap.rows.map((r) => r.row.id);
        return { classification: "new", matched_ids: [] };
      },
    });
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: seedSource.id, role: "supports" as const, summary: "ok" }] },
    };
    await applyOperations({ operations: [{ op: "add", row: claimDraft }] }, deps);
    expect(snapshotRowCount).toBe(1);
    expect(snapshotIds).toEqual([seedSource.id]);
  });

  test("warnings array is populated when contract validation surfaces a duplicate-source-uri warning", async () => {
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:example:20260101:dupewarn",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["example"] },
      source: { type: "web_page", title: "S", uri: "https://duplicate.example" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);

    // Add a new source with the same uri -> warning duplicate_source_evidence
    const newSource = {
      ...SOURCE_DRAFT,
      source: { ...SOURCE_DRAFT.source, uri: "https://duplicate.example" },
    };
    const result = await applyOperations(
      { operations: [{ op: "add", row: newSource }] },
      makeDeps({ randomIdPart: () => "newdupe1" }),
    );
    // Apply must succeed (warnings are not errors).
    expect(result.created).toHaveLength(1);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.warnings.some((w) => w.includes("duplicate_source_evidence"))).toBe(true);
    expect(result.warnings.some((w) => w.includes("https://duplicate.example"))).toBe(true);
  });

  test("request.now overrides clock and is reflected in created_at and id date segment", async () => {
    const altDate = "2025-07-04T10:00:00Z";
    const result = await applyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }], now: altDate },
      makeDeps({ randomIdPart: () => "alt00001" }),
    );
    expect(result.created[0]?.id).toBe("src:example:20250704:alt00001");
    const onDisk = await readLedgerText();
    const parsed = JSON.parse(onDisk.trim()) as SourceRow;
    expect(parsed.created_at).toBe(new Date(altDate).toISOString());
  });

  test("invalid request.now is rejected before ledger append", async () => {
    let caught: unknown;
    try {
      await applyOperations(
        { operations: [{ op: "add", row: SOURCE_DRAFT }], now: "not-a-date" },
        makeDeps({ randomIdPart: () => "badnow01" }),
      );
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code?: string }).code).toBe("validation_failed");
    expect((caught as { details?: { issues?: Array<{ code?: string; path?: string }> } }).details?.issues).toContainEqual(
      expect.objectContaining({ code: "now_invalid", path: "now" }),
    );
    expect(await pathExists(ledgerPath())).toBe(false);
  });

  test("request.actor overrides deps.actor for created_by", async () => {
    const result = await applyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }], actor: "agent:override" },
      makeDeps({ actor: "agent:default" }),
    );
    expect(result.created).toHaveLength(1);
    const parsed = JSON.parse((await readLedgerText()).trim()) as SourceRow;
    expect(parsed.created_by).toBe("agent:override");
  });

  test("apply generates a run_id without consuming the row id random suffix", async () => {
    const parts = ["row00001"];
    let index = 0;
    const result = await applyOperations(
      { operations: [{ op: "add", row: SOURCE_DRAFT }] },
      makeDeps({ randomIdPart: () => parts[index++] as string }),
    );

    expect(result.created[0]?.id).toBe("src:example:20260501:row00001");
    expect(result.run_id).toBe("run_2026-05-01T12-00-00-000Z_row00001");
    expect(index).toBe(1);
  });

  test("caller supplied run_id is honored on ApplyResult", async () => {
    const result = await applyOperations(
      {
        run_id: "run_custom_001",
        intent: "manual import",
        operations: [{ op: "add", row: SOURCE_DRAFT }],
      },
      makeDeps(),
    );

    expect(result.run_id).toBe("run_custom_001");
  });

  test("caller supplied unsafe run_id is rejected before ledger append", async () => {
    let caught: unknown;
    try {
      await applyOperations(
        {
          run_id: "run/bad",
          operations: [{ op: "add", row: SOURCE_DRAFT }],
        },
        makeDeps(),
      );
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code?: string }).code).toBe("validation_failed");
    expect((caught as { details?: { issues?: Array<{ code?: string; path?: string }> } }).details?.issues).toContainEqual(
      expect.objectContaining({
        code: "run_id_unsafe",
        path: "run_id",
      }),
    );
    expect(await pathExists(ledgerPath())).toBe(false);
    expect(await pathExists(join(workDir, ".knb", "runs", "run/bad.json"))).toBe(false);
  });

  test("caller supplied duplicate run_id is rejected before appending a second batch", async () => {
    await applyOperations(
      {
        run_id: "same_run",
        actor: "agent:first",
        operations: [{ op: "add", row: SOURCE_DRAFT }],
      },
      makeDeps({ randomIdPart: () => "firstrun" }),
    );
    const before = await readLedgerText();

    let caught: unknown;
    try {
      await applyOperations(
        {
          run_id: "same_run",
          actor: "agent:second",
          operations: [
            {
              op: "add",
              row: {
                ...SOURCE_DRAFT,
                source: { ...SOURCE_DRAFT.source, uri: "https://example.com/second-run" },
              },
            },
          ],
        },
        makeDeps({ randomIdPart: () => "secondrn" }),
      );
    } catch (error) {
      caught = error;
    }

    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code?: string }).code).toBe("validation_failed");
    expect((caught as { details?: { issues?: Array<{ code?: string; path?: string }> } }).details?.issues).toContainEqual(
      expect.objectContaining({ code: "run_id_duplicate", path: "run_id" }),
    );
    expect(await readLedgerText()).toBe(before);
    const manifest = JSON.parse(await readFile(join(workDir, ".knb", "runs", "same_run.json"), "utf8")) as { actor: string; row_ids: string[] };
    expect(manifest.actor).toBe("agent:first");
    expect(manifest.row_ids).toEqual(["src:example:20260501:firstrun"]);
  });

  test("apply populates run provenance on knowledge rows without overwriting acquisition metadata", async () => {
    const ids = ["srcprov1", "clmprov2", "qstprov3", "synprov4"];
    let index = 0;
    const result = await applyOperations(
      {
        run_id: "run_provenance_test",
        actor: "agent:run",
        operations: [
          {
            op: "add",
            as: "source",
            row: {
              ...SOURCE_DRAFT,
              provenance: {
                acquisition: {
                  method: "manual",
                  query: "keep me",
                },
              },
            },
          },
          { op: "add", as: "cl", row: buildClaimDraft() },
          {
            op: "add",
            as: "q",
            row: {
              kind: "question",
              scope: { collections: ["example"] },
              question: { text: "Open?", status: "open" },
            },
          },
          {
            op: "add",
            row: {
              kind: "synthesis",
              scope: { collections: ["example"] },
              synthesis: {
                title: "S",
                summary: "Summary",
                basis: { claim_ids: ["$cl"], question_ids: ["$q"], source_ids: ["$source"] },
                status: "active",
              },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: () => ids[index++] as string }),
    );

    expect(result.run_id).toBe("run_provenance_test");
    const rows = (await loadLedger({ path: ledgerPath() })).rows.map((loaded) => loaded.row);
    expect(rows.map((row) => row.kind)).toEqual(["source", "claim", "question", "synthesis"]);
    for (const row of rows) {
      const provenance = (row as { provenance?: { acquisition?: { run_id?: string; agent?: string } } }).provenance;
      expect(provenance?.acquisition?.run_id).toBe("run_provenance_test");
      expect(provenance?.acquisition?.agent).toBe("agent:run");
    }
    const source = rows[0] as SourceRow;
    expect(source.provenance.acquisition?.method).toBe("manual");
    expect(source.provenance.acquisition?.query).toBe("keep me");
  });

  test("apply writes a run manifest including change rows while ChangeRow stays manifest-traced only", async () => {
    const ids = ["srcmani1", "chgmani2"];
    let index = 0;
    const result = await applyOperations(
      {
        run_id: "run_manifest_test",
        intent: "test manifest",
        actor: "agent:manifest",
        operations: [
          { op: "add", as: "source", row: SOURCE_DRAFT },
          { op: "retract", target_ids: ["$source"], reason: "exercise change rows" },
        ],
      },
      makeDeps({ randomIdPart: () => ids[index++] as string }),
    );

    expect(result.run_id).toBe("run_manifest_test");
    const manifestPath = join(workDir, ".knb", "runs", "run_manifest_test.json");
    expect(await pathExists(manifestPath)).toBe(true);
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
      schema_version: string;
      run_id: string;
      actor: string;
      intent?: string;
      started_at: string;
      completed_at: string;
      rows_appended: number;
      row_ids: string[];
    };
    expect(manifest.schema_version).toBe("knb.run.v1");
    expect(manifest.run_id).toBe("run_manifest_test");
    expect(manifest.actor).toBe("agent:manifest");
    expect(manifest.intent).toBe("test manifest");
    expect(manifest.started_at).toBe(FIXED_DATE.toISOString());
    expect(manifest.completed_at).toBe(FIXED_DATE.toISOString());
    expect(manifest.rows_appended).toBe(2);
    expect(manifest.row_ids).toEqual([
      "src:example:20260501:srcmani1",
      "chg:example:20260501:chgmani2",
    ]);

    const rows = (await loadLedger({ path: ledgerPath() })).rows.map((loaded) => loaded.row);
    const change = rows.find((row): row is ChangeRow => row.kind === "change");
    expect(change).toBeDefined();
    expect((change as { provenance?: unknown } | undefined)?.provenance).toBeUndefined();
  });

  test("two applies by different actors produce distinct run manifests", async () => {
    const ids = ["actorone", "actortwo"];
    let index = 0;
    const first = await applyOperations(
      {
        actor: "agent:one",
        operations: [{ op: "add", row: SOURCE_DRAFT }],
      },
      makeDeps({ randomIdPart: () => ids[index++] as string }),
    );
    const second = await applyOperations(
      {
        actor: "agent:two",
        operations: [
          {
            op: "add",
            row: {
              ...SOURCE_DRAFT,
              source: { ...SOURCE_DRAFT.source, uri: "https://example.com/two" },
            },
          },
        ],
      },
      makeDeps({ randomIdPart: () => ids[index++] as string }),
    );

    expect(first.run_id).toBe("run_2026-05-01T12-00-00-000Z_actorone");
    expect(second.run_id).toBe("run_2026-05-01T12-00-00-000Z_actortwo");
    expect(first.run_id).not.toBe(second.run_id);

    const firstManifest = JSON.parse(
      await readFile(join(workDir, ".knb", "runs", `${first.run_id}.json`), "utf8"),
    ) as { actor: string; row_ids: string[]; rows_appended: number };
    const secondManifest = JSON.parse(
      await readFile(join(workDir, ".knb", "runs", `${second.run_id}.json`), "utf8"),
    ) as { actor: string; row_ids: string[]; rows_appended: number };

    expect(firstManifest.actor).toBe("agent:one");
    expect(firstManifest.rows_appended).toBe(1);
    expect(firstManifest.row_ids).toEqual([first.created[0]!.id]);
    expect(secondManifest.actor).toBe("agent:two");
    expect(secondManifest.rows_appended).toBe(1);
    expect(secondManifest.row_ids).toEqual([second.created[0]!.id]);
  });

  test("run manifest write failure warns without rolling back the ledger append", async () => {
    const deps = makeDeps({ randomIdPart: () => "warnrun1" });
    deps.writeRunManifest = async () => {
      throw new Error("disk full");
    };

    const result = await applyOperations(
      {
        run_id: "run_warning_test",
        operations: [{ op: "add", row: SOURCE_DRAFT }],
      },
      deps,
    );

    expect(result.created[0]?.id).toBe("src:example:20260501:warnrun1");
    expect(result.warnings).toContain("run_manifest_write_failed: disk full");
    const rows = (await loadLedger({ path: ledgerPath() })).rows.map((loaded) => loaded.row);
    expect(rows.map((row) => row.id)).toEqual(["src:example:20260501:warnrun1"]);
    expect(await pathExists(join(workDir, ".knb", "runs", "run_warning_test.json"))).toBe(false);
  });

  test("retract two claims sharing a collection: derived scope is the intersection", async () => {
    const source: SourceRow = {
      schema_version: "knb.v1",
      id: "src:shared:20260101:src00000",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["shared"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/s" },
      provenance: { acquisition: { method: "manual" } },
    };
    const c1: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:shared:20260101:c1000000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["shared", "alpha"] },
      identity: { claim_key: "k1" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [{ source_id: source.id, role: "supports", summary: "ok" }],
      },
      assessment: { confidence: "high" },
    };
    const c2: ClaimRow = {
      ...c1,
      id: "claim:shared:20260101:c2000000",
      scope: { collections: ["shared", "beta"] },
      identity: { claim_key: "k2" },
    };
    await seedLedger([source, c1, c2]);

    const request: ApplyRequest = {
      operations: [{ op: "retract", target_ids: [c1.id, c2.id], reason: "both wrong" }],
    };
    await applyOperations(request, makeDeps());
    const onDisk = await readLedgerText();
    const change = JSON.parse(onDisk.trim().split("\n").pop() as string) as ChangeRow;
    expect(change.scope.collections).toEqual(["shared"]);
  });

  test("retract via $op alias from a same-batch add resolves correctly in change.target_ids", async () => {
    // Add a claim and immediately retract it in the same batch.
    const ids = ["src1add0", "claimad0", "chgop001"];
    let i = 0;
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
    };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", as: "newClaim", row: claimDraft },
          { op: "retract", target_ids: ["$newClaim"], reason: "regret" },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    expect(result.created).toHaveLength(3);
    const claimId = result.created[1]?.id as string;
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.target_ids).toEqual([claimId]);
  });

  test("supersede via $alias for replacement_id resolves correctly in same batch", async () => {
    // Two adds + supersede that references the second via $alias as replacement
    const seedClaim: ClaimRow = {
      schema_version: "knb.v1",
      id: "claim:supbat:20260101:olda0000",
      kind: "claim",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["supbat"] },
      identity: { claim_key: "old" },
      claim: { statement: "old", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [
          { source_id: "src:supbat:20260101:srcseed1", role: "supports", summary: "ok" },
        ],
      },
      assessment: { confidence: "high" },
    };
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:supbat:20260101:srcseed1",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["supbat"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/sb" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource, seedClaim]);
    const ids = ["newclai1", "chgsup01"];
    let i = 0;
    const newClaimDraft = {
      kind: "claim" as const,
      scope: { collections: ["supbat"] },
      identity: { claim_key: "new" },
      claim: { statement: "new", atomic: true },
      time: { precision: "unknown" as const },
      provenance: { evidence: [{ source_id: seedSource.id, role: "supports" as const, summary: "ok" }] },
      assessment: { confidence: "high" as const },
    };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "fresh", row: newClaimDraft },
          {
            op: "supersede",
            target_ids: [seedClaim.id],
            replacement_id: "$fresh",
            reason: "swap",
          },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const newId = result.created[0]?.id as string;
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.replacement_id).toBe(newId);
    expect(change.change.target_ids).toEqual([seedClaim.id]);
  });

  test("merge via $alias for canonical_id resolves in same batch", async () => {
    const ids = ["aaaa00aa", "bbbb00bb", "chgmerg1"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "a", row: SOURCE_DRAFT },
          {
            op: "add",
            as: "b",
            row: { ...SOURCE_DRAFT, source: { ...SOURCE_DRAFT.source, uri: "https://example.com/b" } },
          },
          {
            op: "merge",
            target_ids: ["$b"],
            canonical_id: "$a",
            reason: "same",
          },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const aId = result.created[0]?.id as string;
    const bId = result.created[1]?.id as string;
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.action).toBe("merge");
    expect(change.change.canonical_id).toBe(aId);
    expect(change.change.target_ids).toEqual([bId]);
  });

  test("relate via $alias for from_id and to_id resolves in same batch", async () => {
    const ids = ["aaaa11aa", "bbbb11bb", "chgrel11"];
    let i = 0;
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "a", row: SOURCE_DRAFT },
          {
            op: "add",
            as: "b",
            row: { ...SOURCE_DRAFT, source: { ...SOURCE_DRAFT.source, uri: "https://example.com/rb" } },
          },
          { op: "relate", from_id: "$a", to_id: "$b", rel: "supports" },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const aId = result.created[0]?.id as string;
    const bId = result.created[1]?.id as string;
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.relation?.from_id).toBe(aId);
    expect(change.change.relation?.to_id).toBe(bId);
  });

  test("patch via $alias for target_id resolves in same batch", async () => {
    const ids = ["claim001", "chgptch1"];
    let i = 0;
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "src:patchbatch:20260101:seedseed", role: "supports" as const, summary: "ok" }] },
    };
    const seedSource: SourceRow = {
      schema_version: "knb.v1",
      id: "src:patchbatch:20260101:seedseed",
      kind: "source",
      created_at: "2026-01-01T00:00:00Z",
      created_by: "agent:seed",
      scope: { collections: ["patchbatch"] },
      source: { type: "web_page", title: "S", uri: "https://example.com/pb" },
      provenance: { acquisition: { method: "manual" } },
    };
    await seedLedger([seedSource]);
    // Use a scope matching "patchbatch" so derivation works
    const claim2 = { ...claimDraft, scope: { collections: ["patchbatch"] } };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "freshClaim", row: claim2 },
          {
            op: "patch",
            target_id: "$freshClaim",
            patch: [{ op: "replace", path: "/claim/statement", value: "Y" }],
            reason: "fix",
          },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    const claimId = result.created[0]?.id as string;
    const change = JSON.parse((await readLedgerText()).trim().split("\n").pop() as string) as ChangeRow;
    expect(change.change.target_id).toBe(claimId);
  });

  test("pre-existing ledger validation errors abort apply with validation_failed before any write", async () => {
    // Seed a row missing schema_version (clearly invalid)
    const broken = {
      id: "claim:bad:20260101:broken00",
      kind: "claim",
      scope: { collections: ["bad"] },
      identity: { claim_key: "k" },
      claim: { statement: "x", atomic: true },
      time: { precision: "unknown" },
      provenance: {
        evidence: [{ source_id: "src:bad:20260101:noooooo0", role: "supports", summary: "ok" }],
      },
      assessment: { confidence: "high" },
      // no schema_version, no created_at, no created_by
    };
    await seedLedger([broken as unknown as KnbRow]);
    const before = await readLedgerText();

    let thrown: unknown;
    try {
      await applyOperations({ operations: [{ op: "add", row: SOURCE_DRAFT }] }, makeDeps());
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    expect((thrown as { code: string }).code).toBe("validation_failed");
    expect(await readLedgerText()).toBe(before);
  });

  test("operation order is preserved in result.created when mixing add and lifecycle", async () => {
    const ids = ["mix00001", "mix00002", "mix00003"];
    let i = 0;
    const claimDraft = {
      ...buildClaimDraft(),
      provenance: { evidence: [{ source_id: "$src", role: "supports" as const, summary: "ok" }] },
    };
    const result = await applyOperations(
      {
        operations: [
          { op: "add", as: "src", row: SOURCE_DRAFT },
          { op: "add", as: "cl", row: claimDraft },
          { op: "retract", target_ids: ["$cl"], reason: "x" },
        ],
      },
      makeDeps({ randomIdPart: () => ids[i++] as string }),
    );
    expect(result.created.map((c) => c.op)).toEqual([0, 1, 2]);
    expect(result.created.map((c) => c.kind)).toEqual(["source", "claim", "change"]);
    expect(result.created[0]?.as).toBe("src");
    expect(result.created[1]?.as).toBe("cl");
    expect(result.created[2]?.as).toBeUndefined();
  });

  test("100-op batch of source adds works and all rows land in order with unique ids", async () => {
    const ops: ApplyOperation[] = [];
    for (let n = 0; n < 100; n += 1) {
      ops.push({
        op: "add",
        row: {
          ...SOURCE_DRAFT,
          source: { ...SOURCE_DRAFT.source, uri: `https://example.com/p/${n}` },
        },
      });
    }
    let i = 0;
    const result = await applyOperations(
      { operations: ops },
      makeDeps({ randomIdPart: () => `b${i++}`.padEnd(8, "x").slice(0, 8) }),
    );
    expect(result.created).toHaveLength(100);
    const idSet = new Set(result.created.map((c) => c.id));
    expect(idSet.size).toBe(100);
    const reload = await loadLedger({ path: ledgerPath() });
    expect(reload.rows).toHaveLength(100);
    for (let n = 0; n < 100; n += 1) {
      expect((reload.rows[n]?.row as SourceRow).id).toBe(result.created[n]?.id as string);
    }
  });
});
