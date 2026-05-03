import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
import type { DraftRow } from "../src/core/contract";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-profiles-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function makeStubAllocator(): (bytes: number) => string {
  let n = 0;
  return () => {
    n += 1;
    return `p${n.toString(16).padStart(7, "0")}`;
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

async function writeProfile(name: string, profile: unknown): Promise<void> {
  const profilesDir = join(workDir, "knb", "profiles");
  await mkdir(profilesDir, { recursive: true });
  await writeFile(join(profilesDir, name), `${JSON.stringify(profile, null, 2)}\n`, "utf8");
}

async function writeRawProfile(name: string, raw: string): Promise<void> {
  const profilesDir = join(workDir, "knb", "profiles");
  await mkdir(profilesDir, { recursive: true });
  await writeFile(join(profilesDir, name), raw, "utf8");
}

function sourceDraft(collection = "profiles"): DraftRow {
  return {
    kind: "source",
    scope: { collections: [collection] },
    source: { type: "web_page", title: "Profile source", uri: `https://example.com/${collection}` },
    provenance: { acquisition: { method: "manual" } },
  } as DraftRow;
}

function claimDraft(sourceRef: string, collection = "profiles"): DraftRow {
  return {
    kind: "claim",
    scope: { collections: [collection] },
    identity: { claim_key: `${collection}|prediction` },
    claim: {
      statement: "Prediction without a required location qualifier.",
      atomic: true,
      type: "prediction",
      qualifiers: { probability: 0.8 },
    },
    time: { precision: "unknown" },
    provenance: {
      evidence: [{ source_id: sourceRef, role: "supports", summary: "Backs prediction." }],
    },
    assessment: { confidence: "high" },
  } as DraftRow;
}

function validPredictionClaimDraft(sourceRef: string, collection = "profiles"): DraftRow {
  return {
    kind: "claim",
    scope: { collections: [collection] },
    identity: { claim_key: `${collection}|valid-prediction` },
    claim: {
      statement: "Prediction with valid profile qualifiers.",
      atomic: true,
      type: "prediction",
      qualifiers: { location: "tehran", probability: 0.8 },
    },
    time: { precision: "unknown" },
    provenance: {
      evidence: [{ source_id: sourceRef, role: "supports", summary: "Backs prediction." }],
    },
    assessment: { confidence: "high" },
  } as DraftRow;
}

const predictionProfile = {
  profile_version: "knb.profile.v1",
  name: "prediction-profile",
  select: {
    kinds: ["claim"],
    where: [{ path: "claim.type", eq: "prediction" }],
  },
  rules: [
    { path: "claim.qualifiers.location", required: true, type: "string" },
    { path: "claim.qualifiers.probability", type: "number", min: 0, max: 1 },
  ],
};

describe("Profiles check validation", () => {
  test("check reports a profile validation issue for a selected invalid claim", async () => {
    await writeProfile("prediction.json", predictionProfile);
    const knb = await openTestKnb();
    const sourceApply = await knb.apply({ operations: [{ op: "add", row: sourceDraft() }] });
    const sourceId = sourceApply.created[0]!.id;
    const claimId = "claim:profiles:20260501:manual01";
    await appendFile(
      join(workDir, "knb", "ledger.jsonl"),
      `${JSON.stringify({
        schema_version: "knb.v1",
        id: claimId,
        kind: "claim",
        created_at: "2026-05-01T12:01:00Z",
        created_by: "agent:test",
        scope: { collections: ["profiles"] },
        identity: { claim_key: "profiles|manual-invalid" },
        claim: {
          statement: "Prediction without a required location qualifier.",
          atomic: true,
          type: "prediction",
          qualifiers: { probability: 0.8 },
        },
        time: { precision: "unknown" },
        provenance: {
          evidence: [{ source_id: sourceId, role: "supports", summary: "Backs prediction." }],
        },
        assessment: { confidence: "high" },
      })}\n`,
      "utf8",
    );

    const result = await knb.check();

    expect(result.ok).toBe(false);
    const issue = result.validation_issues.find((candidate) => candidate.code === "profile_required_path");
    expect(issue).toBeDefined();
    expect(issue?.profile).toBe("prediction-profile");
    expect(issue?.id).toBe(claimId);
    expect(issue?.path).toBe("claim.qualifiers.location");
    expect(issue?.message).toContain("prediction-profile");
  });

  test("apply rejects a profile-invalid claim atomically with operation index details", async () => {
    await writeProfile("prediction.json", predictionProfile);
    const knb = await openTestKnb();
    const before = await knb.status();

    let error: unknown;
    try {
      await knb.apply({
        operations: [
          { op: "add", as: "src", row: sourceDraft("apply-profile") },
          { op: "add", row: claimDraft("$src", "apply-profile") },
        ],
      });
    } catch (caught) {
      error = caught;
    }

    expect((error as { code?: string })?.code).toBe("validation_failed");
    const issues = (error as { details?: { issues?: Array<{ code?: string; op_index?: number; profile?: string }> } })
      ?.details?.issues ?? [];
    expect(issues).toContainEqual(expect.objectContaining({
      code: "profile_required_path",
      op_index: 1,
      profile: "prediction-profile",
    }));
    const after = await knb.status();
    expect(after.row_count).toBe(before.row_count);
  });

  test("previewApply rejects the same profile-invalid candidate without appending", async () => {
    await writeProfile("prediction.json", predictionProfile);
    const knb = await openTestKnb();

    let error: unknown;
    try {
      await knb.previewApply({
        operations: [
          { op: "add", as: "src", row: sourceDraft("preview-profile") },
          { op: "add", row: claimDraft("$src", "preview-profile") },
        ],
      });
    } catch (caught) {
      error = caught;
    }

    expect((error as { code?: string })?.code).toBe("validation_failed");
    expect((await knb.status()).row_count).toBe(0);
  });

  test("profile validation sees completed row fields during apply", async () => {
    await writeProfile("completed-row.json", {
      profile_version: "knb.profile.v1",
      name: "completed-row",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "prediction" }],
      },
      rules: [
        { path: "created_at", required: true, pattern: "^2026-05-01T12:00:00" },
        { path: "claim.qualifiers.location", required: true, type: "string" },
      ],
    });
    const knb = await openTestKnb();

    const result = await knb.apply({
      operations: [
        { op: "add", as: "src", row: sourceDraft("completed-row") },
        { op: "add", row: validPredictionClaimDraft("$src", "completed-row") },
      ],
    });

    expect(result.created.map((entry) => entry.kind)).toEqual(["source", "claim"]);
  });

  test("missing profiles directory leaves validation issues unchanged", async () => {
    const knb = await openTestKnb();
    await knb.apply({
      operations: [
        { op: "add", as: "src", row: sourceDraft("no-profiles") },
        { op: "add", row: claimDraft("$src", "no-profiles") },
      ],
    });

    const result = await knb.check();

    expect(result.validation_issues.filter((issue) => issue.code?.startsWith("profile_"))).toEqual([]);
  });

  test("invalid profile files are reported as profile definition errors", async () => {
    await writeProfile("bad-selector.json", {
      profile_version: "knb.profile.v1",
      name: "bad-selector",
      select: { where: [{ path: "claim.unknown", eq: "x" }] },
      rules: [{ path: "claim.qualifiers.location", required: true }],
    });
    const knb = await openTestKnb();

    const result = await knb.check();

    const issue = result.validation_issues.find((candidate) => candidate.code === "profile_selector_invalid");
    expect(issue).toBeDefined();
    expect(issue?.profile).toBe("bad-selector");
    expect(issue?.path).toContain("bad-selector.json");
    expect(issue?.message).toContain("claim.unknown");
  });

  test("profile selector rejects malformed closed selector fields instead of matching no rows", async () => {
    await writeProfile("bad-kind.json", {
      profile_version: "knb.profile.v1",
      name: "bad-kind",
      select: {
        kinds: ["claims"],
        where: [{ path: "claim.type", eq: "prediction" }],
      },
      rules: [{ path: "claim.qualifiers.location", required: true }],
    });
    const knb = await openTestKnb();

    const result = await knb.check();

    const issue = result.validation_issues.find((candidate) => candidate.code === "profile_selector_invalid");
    expect(issue).toBeDefined();
    expect(issue?.profile).toBe("bad-kind");
    expect(issue?.message).toContain("kinds");
  });

  test("malformed profile JSON is reported without crashing check", async () => {
    await writeRawProfile("malformed.json", "{not-json");
    const knb = await openTestKnb();

    const result = await knb.check();

    const issue = result.validation_issues.find((candidate) => candidate.code === "profile_parse_error");
    expect(issue).toBeDefined();
    expect(issue?.path).toContain("malformed.json");
  });

  test("primitive profile rules validate enum, pattern, boolean type, and numeric max", async () => {
    await writeProfile("primitive-rules.json", {
      profile_version: "knb.profile.v1",
      name: "primitive-rules",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "prediction" }],
      },
      rules: [
        { path: "claim.qualifiers.outcome", enum: ["yes", "no"] },
        { path: "claim.qualifiers.city", type: "string", pattern: "^[a-z-]+$" },
        { path: "claim.qualifiers.live", type: "boolean" },
        { path: "claim.qualifiers.probability", type: "number", min: 0, max: 1 },
      ],
    });
    const knb = await openTestKnb();
    const sourceApply = await knb.apply({ operations: [{ op: "add", row: sourceDraft("primitive-rules") }] });
    const sourceId = sourceApply.created[0]!.id;
    await appendFile(
      join(workDir, "knb", "ledger.jsonl"),
      `${JSON.stringify({
        schema_version: "knb.v1",
        id: "claim:primitive-rules:20260501:manual01",
        kind: "claim",
        created_at: "2026-05-01T12:01:00Z",
        created_by: "agent:test",
        scope: { collections: ["primitive-rules"] },
        identity: { claim_key: "primitive-rules|prediction" },
        claim: {
          statement: "Prediction with malformed primitive qualifiers.",
          atomic: true,
          type: "prediction",
          qualifiers: {
            outcome: "maybe",
            city: "Tehran!",
            live: "true",
            probability: 1.2,
          },
        },
        time: { precision: "unknown" },
        provenance: {
          evidence: [{ source_id: sourceId, role: "supports", summary: "Backs prediction." }],
        },
        assessment: { confidence: "high" },
      })}\n`,
      "utf8",
    );

    const result = await knb.check();
    const codes = result.validation_issues.map((issue) => issue.code);

    expect(codes).toContain("profile_enum_mismatch");
    expect(codes).toContain("profile_pattern_mismatch");
    expect(codes).toContain("profile_type_mismatch");
    expect(codes).toContain("profile_max_mismatch");
  });
});
