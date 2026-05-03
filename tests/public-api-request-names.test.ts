import { describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openKnb } from "../src/index";
import type {
  ApplyRequest,
  CollectionStatusRequest,
  ContextRequest,
  ContextScoringProfileInput,
  GetRequest,
  QueryRequest,
  RenderAllRequest,
  RenderRequest,
} from "../src/index";

type HasKey<T, K extends PropertyKey> = K extends keyof T ? true : false;
type Not<T extends boolean> = T extends true ? false : true;
type Expect<T extends true> = T;

type PublicRequestNamesUseCamelCase = [
  Expect<HasKey<ApplyRequest, "runId">>,
  Expect<Not<HasKey<ApplyRequest, "run_id">>>,
  Expect<HasKey<CollectionStatusRequest, "maxQuestions">>,
  Expect<Not<HasKey<CollectionStatusRequest, "max_questions">>>,
  Expect<HasKey<ContextRequest, "claimType">>,
  Expect<HasKey<ContextRequest, "externalRefs">>,
  Expect<HasKey<ContextRequest, "includeWarnings">>,
  Expect<HasKey<ContextRequest, "maxTokens">>,
  Expect<Not<HasKey<ContextRequest, "claim_type">>>,
  Expect<Not<HasKey<ContextRequest, "external_refs">>>,
  Expect<Not<HasKey<ContextRequest, "include_warnings">>>,
  Expect<Not<HasKey<ContextRequest, "max_tokens">>>,
  Expect<HasKey<QueryRequest, "claimKey">>,
  Expect<HasKey<QueryRequest, "claimType">>,
  Expect<HasKey<QueryRequest, "externalRefs">>,
  Expect<Not<HasKey<QueryRequest, "claim_key">>>,
  Expect<Not<HasKey<QueryRequest, "claim_type">>>,
  Expect<Not<HasKey<QueryRequest, "external_refs">>>,
  Expect<HasKey<GetRequest, "includeHistory">>,
  Expect<HasKey<RenderRequest, "asOf">>,
  Expect<HasKey<RenderAllRequest, "asOf">>,
];

const typecheckPublicRequestExamples = [
  {
    operations: [],
    runId: "run_public_camel",
  } satisfies ApplyRequest,
  {
    collection: "public",
    maxQuestions: 2,
  } satisfies CollectionStatusRequest,
  {
    collection: "public",
    claimType: "prediction",
    externalRefs: [{ system: "x", id: "123" }],
    includeWarnings: false,
    maxTokens: 1000,
    recencyWindowDays: 30,
    scoringProfile: {
      weights: { importance: { high: 3, medium: 2, low: 1, unknown: 0 } },
    } satisfies ContextScoringProfileInput,
  } satisfies ContextRequest,
  {
    collection: "public",
    claimKey: "public|fact",
    claimType: "prediction",
    externalRefs: [{ system: "x", id: "123" }],
  } satisfies QueryRequest,
  {
    ids: ["claim:public:20260501:bbbb2222"],
    includeHistory: true,
  } satisfies GetRequest,
  {
    collection: "public",
    asOf: "2026-05-01T12:30:00Z",
  } satisfies RenderRequest,
  {
    asOf: "2026-05-01T12:30:00Z",
  } satisfies RenderAllRequest,
];

describe("public facade request option names", () => {
  let workDir = "";

  test("camelCase facade options drive apply, query, context, get, and render", async () => {
    workDir = await mkdtemp(join(tmpdir(), "knb-public-request-names-"));
    try {
      const knb = await openKnb({
        root: workDir,
        actor: "agent:public-request-test",
        env: {},
        cwd: () => workDir,
        runtime: {
          clock: () => new Date("2026-05-01T12:00:00.000Z"),
          randomIdPart: () => "aaaa1111",
        },
      });
      await knb.init();

      const result = await knb.apply({
        runId: "run_public_camel",
        operations: [
          {
            op: "add",
            as: "src",
            row: {
              kind: "source",
              scope: { collections: ["public"] },
              source: { type: "web_page", title: "Public request source", uri: "https://example.com/public" },
              provenance: { acquisition: { method: "manual" } },
            },
          },
          {
            op: "add",
            as: "claim",
            row: {
              kind: "claim",
              scope: { collections: ["public"] },
              external_refs: [{ system: "x", id: "123" }],
              identity: { claim_key: "public|fact" },
              claim: {
                statement: "Public facade request names are camelCase.",
                atomic: true,
                type: "prediction",
              },
              time: { precision: "unknown" },
              provenance: { evidence: [{ source_id: "$src", role: "supports", summary: "Source supports the claim." }] },
              assessment: { confidence: "high" },
            },
          },
        ],
      });

      expect(result.run_id).toBe("run_public_camel");

      const query = await knb.query({
        collection: "public",
        claimKey: "public|fact",
        claimType: "prediction",
        externalRefs: [{ system: "x", id: "123" }],
      });
      expect(query.rows.map((row) => row.id)).toEqual([result.created[1]!.id]);

      const context = await knb.context({
        collection: "public",
        claimType: "prediction",
        externalRefs: [{ system: "x", id: "123" }],
        includeWarnings: false,
        maxTokens: 1000,
      });
      expect(context.key_claims.map((row) => row.id)).toEqual([result.created[1]!.id]);
      expect(context.warnings).toEqual([]);

      const got = await knb.get([result.created[1]!.id], { includeHistory: true });
      expect(got.rows).toHaveLength(1);

      const rendered = await knb.render({ collection: "public", asOf: "2026-05-01T12:30:00.000Z" });
      expect(rendered.metadata.options.asOf).toBe("2026-05-01T12:30:00.000Z");
      expect(await readFile(rendered.path, "utf8")).toContain("Public facade request names are camelCase.");
    } finally {
      if (workDir.length > 0) await rm(workDir, { recursive: true, force: true });
    }
  });

  test("compile-time examples are present", () => {
    expect(typecheckPublicRequestExamples).toHaveLength(7);
  });
});
