<file_map>
/Users/jaredsmith/Projects-ultra/knb
├── docs
│   ├── adr
│   │   ├── 0001-v1-cutover-validate-to-check.md *
│   │   └── 0002-projection-store-seam-jsonl-only.md *
│   ├── design
│   │   ├── agent-first-cli.md *
│   │   ├── context-scoring-spike.md
│   │   └── pro-refactor.md
│   ├── library-usage.md *
│   └── migration-and-rollback.md
├── knb
│   ├── indexes
│   │   └── .gitkeep
│   ├── views
│   │   └── .gitkeep
│   ├── schema.json *
│   ├── README.md
│   └── ledger.jsonl
├── scripts
│   ├── sync-schema.ts * +
│   ├── install.sh
│   └── release-smoke.ts +
├── src
│   ├── core
│   │   ├── apply.ts * +
│   │   ├── context.ts * +
│   │   ├── contract.ts * +
│   │   ├── errors.ts * +
│   │   ├── knb.ts * +
│   │   ├── ledger.ts * +
│   │   ├── novelty.ts * +
│   │   ├── output.ts * +
│   │   ├── profiles.ts * +
│   │   ├── projections.ts * +
│   │   ├── query.ts * +
│   │   ├── read-snapshot.ts * +
│   │   ├── run-manifests.ts * +
│   │   ├── selectors.ts * +
│   │   ├── source-citations.ts * +
│   │   ├── state.ts * +
│   │   └── workspace.ts * +
│   ├── cli.ts * +
│   └── index.ts * +
├── tests
│   ├── static
│   │   ├── _helpers.ts * +
│   │   ├── apply-add-ownership.test.ts * +
│   │   ├── cli-adapter-thinness.test.ts * +
│   │   ├── contract-schema-ownership.test.ts * +
│   │   ├── iran-fixture.expected.md *
│   │   ├── ledger-ownership.test.ts * +
│   │   ├── legacy-cleanup.test.ts * +
│   │   ├── projection-ownership.test.ts * +
│   │   ├── runtime-determinism.test.ts * +
│   │   └── state-boundaries.test.ts * +
│   ├── fixtures
│   │   └── context-default-scoring-golden.json
│   ├── e2e-agent-loop.test.ts * +
│   ├── facade.test.ts * +
│   ├── apply.test.ts +
│   ├── cli.test.ts +
│   ├── context.test.ts +
│   ├── contract.test.ts +
│   ├── errors.test.ts +
│   ├── ledger.test.ts +
│   ├── novelty-projection.test.ts +
│   ├── novelty.test.ts +
│   ├── output.test.ts +
│   ├── profiles.test.ts +
│   ├── projections.test.ts +
│   ├── public-api-request-names.test.ts +
│   ├── query.test.ts +
│   ├── read-side.test.ts +
│   ├── selectors.test.ts +
│   ├── state.test.ts +
│   ├── validator.test.ts +
│   ├── wiring.test.ts +
│   ├── workspace.test.ts +
│   └── write-path-validation.test.ts +
├── .claude
│   └── settings.local.json
├── .liquid-mail
│   └── state.json
├── days
│   └── May01
│       ├── iran-cracks
│       │   ├── raw
│       │   │   ├── apply-1.json
│       │   │   ├── apply-10-source-notes.md
│       │   │   ├── apply-10.json
│       │   │   ├── apply-11-source-notes.md
│       │   │   ├── apply-11.json
│       │   │   ├── apply-12-source-notes.md
│       │   │   ├── apply-12.json
│       │   │   ├── apply-13-source-notes.md
│       │   │   ├── apply-13.json
│       │   │   ├── apply-14-source-notes.md
│       │   │   ├── apply-14.json
│       │   │   ├── apply-15-source-notes.md
│       │   │   ├── apply-15.json
│       │   │   ├── apply-16-source-notes.md
│       │   │   ├── apply-16.json
│       │   │   ├── apply-17-source-notes.md
│       │   │   ├── apply-17.json
│       │   │   ├── apply-18-source-notes.md
│       │   │   ├── apply-18.json
│       │   │   ├── apply-19.json
│       │   │   ├── apply-2.json
│       │   │   ├── apply-20.json
│       │   │   ├── apply-21-source-notes.md
│       │   │   ├── apply-21.json
│       │   │   ├── apply-22.json
│       │   │   ├── apply-23-source-notes.md
│       │   │   ├── apply-23.json
│       │   │   ├── apply-24-source-notes.md
│       │   │   ├── apply-24.json
│       │   │   ├── apply-25-source-notes.md
│       │   │   ├── apply-25.json
│       │   │   ├── apply-26-source-notes.md
│       │   │   ├── apply-26.json
│       │   │   ├── apply-27-source-notes.md
│       │   │   ├── apply-27.json
│       │   │   ├── apply-28-source-notes.md
│       │   │   ├── apply-28.json
│       │   │   ├── apply-29.json
│       │   │   ├── apply-3.json
│       │   │   ├── apply-30-source-notes.md
│       │   │   ├── apply-30.json
│       │   │   ├── apply-31-source-notes.md
│       │   │   ├── apply-31.json
│       │   │   ├── apply-32-source-notes.md
│       │   │   ├── apply-32.json
│       │   │   ├── apply-33-source-notes.md
│       │   │   ├── apply-33.json
│       │   │   ├── apply-34-source-notes.md
│       │   │   ├── apply-34.json
│       │   │   ├── apply-35-source-notes.md
│       │   │   ├── apply-35.json
│       │   │   ├── apply-36-source-notes.md
│       │   │   ├── apply-36.json
│       │   │   ├── apply-37-source-notes.md
│       │   │   ├── apply-37.json
│       │   │   ├── apply-38-source-notes.md
│       │   │   ├── apply-38.json
│       │   │   ├── apply-39-source-notes.md
│       │   │   ├── apply-39.json
│       │   │   ├── apply-4.json
│       │   │   ├── apply-40-source-notes.md
│       │   │   ├── apply-40.json
│       │   │   ├── apply-41-source-notes.md
│       │   │   ├── apply-41.json
│       │   │   ├── apply-42-source-notes.md
│       │   │   ├── apply-42.json
│       │   │   ├── apply-43-source-notes.md
│       │   │   ├── apply-43.json
│       │   │   ├── apply-44-source-notes.md
│       │   │   ├── apply-44.json
│       │   │   ├── apply-45.json
│       │   │   ├── apply-46-source-notes.md
│       │   │   ├── apply-46.json
│       │   │   ├── apply-47-source-notes.md
│       │   │   ├── apply-47.json
│       │   │   ├── apply-48-source-notes.md
│       │   │   ├── apply-48.json
│       │   │   ├── apply-49-source-notes.md
│       │   │   ├── apply-49.json
│       │   │   ├── apply-5.json
│       │   │   ├── apply-6.json
│       │   │   ├── apply-7.json
│       │   │   ├── apply-8-source-notes.md
│       │   │   ├── apply-8.json
│       │   │   ├── apply-9-source-notes.md
│       │   │   ├── apply-9.json
│       │   │   ├── batch-2-new-angles.json
│       │   │   ├── batch-3-x-discourse.json
│       │   │   ├── crawl11-didbaniran-tehran-pressure-dams-9-3.txt
│       │   │   ├── crawl11-jahansanat-karaj-7-percent-15-days.txt
│       │   │   ├── crawl11-mehr-power-less-limits.txt
│       │   │   ├── crawl11-shahrara-mashhad-94-empty.txt
│       │   │   ├── crawl11-snn-tehran-autumn-bad-scenario.txt
│       │   │   ├── crawl12-fararu-dollar-may1-177910.txt
│       │   │   ├── crawl12-ibena-real-estate-funds-reopen-may2.txt
│       │   │   ├── crawl12-nournews-stock-staged-controlled.txt
│       │   │   ├── crawl12-shahrara-stock-halted-until-may4.txt
│       │   │   ├── crawl12-tasnim-stock-reopening-conditions.txt
│       │   │   ├── crawl13-asriran-sharif-phd-reopen-may14.txt
│       │   │   └── crawl13-eghtesadonline-exams-konkur-war-end.txt
│       │   └── knb-operator-notes.md
│       ├── iran-fissures
│       │   └── raw
│       │       ├── apply-watchpoints-25.json
│       │       ├── apply.json
│       │       ├── digest.txt
│       │       ├── exa-en-aghazadeh.json
│       │       ├── exa-en-artists.json
│       │       ├── exa-en-cities.json
│       │       ├── exa-en-farmers.json
│       │       ├── exa-en-gold.json
│       │       ├── exa-en-health.json
│       │       ├── exa-en-hezbollah.json
│       │       ├── exa-en-khuzestan.json
│       │       ├── exa-en-russia-china.json
│       │       ├── exa-en-sports.json
│       │       ├── exa-fa-artists.json
│       │       ├── exa-fa-farmers.json
│       │       ├── exa-fa-gold.json
│       │       ├── exa-fa-hezbollah.json
│       │       ├── exa-fa-khuzestan.json
│       │       ├── exa-fa-sports.json
│       │       ├── extract.jq
│       │       ├── jobs.txt
│       │       ├── res-aghazadeh.json
│       │       ├── res-artists.json
│       │       ├── res-cities.json
│       │       ├── res-farmers.json
│       │       ├── res-gold.json
│       │       ├── res-health.json
│       │       ├── res-hezbollah.json
│       │       ├── res-khuzestan.json
│       │       ├── res-russia-china.json
│       │       ├── res-sports.json
│       │       ├── xp-aghazadeh.json
│       │       ├── xp-artists.json
│       │       ├── xp-cities.json
│       │       ├── xp-farmers.json
│       │       ├── xp-gold.json
│       │       ├── xp-health.json
│       │       ├── xp-hezbollah.json
│       │       ├── xp-khuzestan.json
│       │       ├── xp-russia-china.json
│       │       └── xp-sports.json
│       ├── iran-margins
│       │   └── raw
│       │       ├── apply.json
│       │       ├── batch-conscripts-police.json
│       │       ├── digest.txt
│       │       ├── exa-en-afghan.json
│       │       ├── exa-en-bahai.json
│       │       ├── exa-en-bazaar.json
│       │       ├── exa-en-elite.json
│       │       ├── exa-en-irib.json
│       │       ├── exa-en-oil.json
│       │       ├── exa-fa-afghan.json
│       │       ├── exa-fa-bahai.json
│       │       ├── exa-fa-bazaar.json
│       │       ├── exa-fa-conscription.json
│       │       ├── exa-fa-elite.json
│       │       ├── exa-fa-faculty.json
│       │       ├── exa-fa-friday.json
│       │       ├── exa-fa-hijab.json
│       │       ├── exa-fa-irib.json
│       │       ├── exa-fa-oil.json
│       │       ├── extract.jq
│       │       ├── jobs.txt
│       │       ├── res-afghan.json
│       │       ├── res-bahai.json
│       │       ├── res-bazaar.json
│       │       ├── res-conscription.json
│       │       ├── res-elite.json
│       │       ├── res-faculty.json
│       │       ├── res-friday.json
│       │       ├── res-hijab.json
│       │       ├── res-irib.json
│       │       ├── res-oil.json
│       │       ├── xp-afghan.json
│       │       ├── xp-bahai.json
│       │       ├── xp-bazaar.json
│       │       ├── xp-conscription.json
│       │       ├── xp-elite.json
│       │       ├── xp-faculty.json
│       │       ├── xp-friday.json
│       │       ├── xp-hijab.json
│       │       ├── xp-irib.json
│       │       └── xp-oil.json
│       └── v1-baseline.md
├── prompt-exports
│   └── 2026-05-01-knb-spec-vs-code-plan.md
├── AGENTS.md *
├── ARCHITECTURE.md *
├── CLAUDE.md *
├── README.md *
├── package.json *
├── tsconfig.json *
├── .gitignore
├── bun.lock
└── research.md


(* denotes selected files)
(+ denotes code-map available)

File: /Users/jaredsmith/Projects-ultra/knb/scripts/release-smoke.ts
Imports:
  - import { mkdtemp, realpath, rm } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
---

Type-aliases:
  - SpawnResult

Functions:
  - L5: const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts")
  - L9: async function runKnb(workDir: string, args: string[]): Promise<SpawnResult>
  - L21: function fail(message: string): never
  - L26: async function main(): Promise<void>
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/apply.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { applyOperations, previewApplyOperations, type ApplyDeps, type NoveltyDecision } from "../src/core/apply";
  - import type {
  ApplyOperation,
  ApplyRequest,
  ChangeRow,
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
  - import { canonicalContentHash, loadLedger } from "../src/core/ledger";
---

Functions:
  - L34: function ledgerPath(): string
  - L38: function lockPath(): string
  - L42: async function pathExists(path: string): Promise<boolean>
  - L51: function makeDeps(overrides?: { randomIdPart?: () => string; classifyNovelty?: (candidate: KnbRow, snapshot?: unknown) => NoveltyDecision; actor?: string; clock?: () => Date; }): ApplyDeps
  - L85: function buildClaimDraft(overrides?: { uri?: string; statement?: string })
  - L108: async function seedLedger(rows: KnbRow[]): Promise<void>
  - L114: async function readLedgerText(): Promise<string>

Global vars:
  - workDir: string
  - FIXED_DATE
  - ID_REGEX
  - SOURCE_DRAFT
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/contract.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { readFileSync } from "node:fs";
  - import { resolve } from "node:path";
  - import {
  APPLY_OPERATION_KINDS,
  ASSESSMENT_LEVELS,
  CHANGE_ACTIONS,
  completeDraftRow,
  CONFIDENCE_VALUES,
  EVIDENCE_ROLES,
  INFORMATION_DEPTH_VALUES,
  jsonSchema,
  KIND_PREFIXES,
  KNB_SCHEMA_VERSION,
  operationSamples,
  QUESTION_PRIORITIES,
  QUESTION_STATUSES,
  referenceFields,
  RELATION_TYPES,
  ROW_KINDS,
  rowSamples,
  scopeSlug,
  SOURCE_TYPES,
  SYNTHESIS_STATUSES,
  TIME_PRECISIONS,
  validateApplyRequest,
  validateLedger,
  validateRows,
  type ApplyRequest,
  type ChangeRow,
  type ClaimRow,
  type DraftRow,
  type KnbRow,
  type LoadedRow,
  type QuestionRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";
---

Functions:
  - L40: function load(rows: KnbRow[]): LoadedRow[]
  - L44: function codes(issues: { code?: string | undefined }[]): string[]
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/state.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import {
  buildEffectiveState,
  type EffectiveRelation,
} from "../src/core/state";
  - import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
---

Functions:
  - L17: function load(rows: KnbRow[]): LoadedRow[]
  - L21: function makeSource(id: string, overrides: Partial<SourceRow> = {}): SourceRow
  - L35: function makeClaim(id: string, sourceId: string, overrides: Partial<ClaimRow> = {}): ClaimRow
  - L55: function makeQuestion(id: string, status: "open" | "resolved" | "archived" = "open"): QuestionRow
  - L67: function makeSynthesis( id: string, basisClaimIds: string[], status: "active" | "archived" = "active", ): SynthesisRow
  - L88: function makeChange( id: string, change: ChangeRow["change"], createdAt = "2026-05-01T13:00:00Z", ): ChangeRow
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/wiring.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { appendFile, mkdtemp, readFile, rm, stat } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
  - import type { ApplyOperation, ApplyRequest, DraftRow } from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
---

Functions:
  - L20: function deterministicRuntime(): { runtime: OpenKnbOptions["runtime"] }
  - L33: async function openWiringKnb(): Promise<Knb>
  - L45: async function pathExists(p: string): Promise<boolean>
  - L54: function sourceDraft(collection = "wire"): DraftRow
  - L67: function claimDraft(sourceRef: string, collection = "wire", statement = "Wiring exists."): DraftRow

Global vars:
  - workDir: string
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/write-path-validation.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import {
  appendFile,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { applyOperations, type ApplyDeps, type NoveltyDecision } from "../src/core/apply";
  - import type {
  ApplyRequest,
  DraftRow,
  KnbRow,
  SourceRow,
} from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
  - import { exitCodeForError } from "../src/core/errors";
  - import { canonicalContentHash, loadLedger, writeLedger } from "../src/core/ledger";
  - import { openKnb } from "../src/index";
---

Functions:
  - L39: function ledgerPath(): string
  - L43: function lockPath(): string
  - L47: function makeDeps(overrides?: { randomIdPart?: () => string; classifyNovelty?: (candidate: KnbRow) => NoveltyDecision; actor?: string; clock?: () => Date; workspace?: { paths: { ledger: string; lock: string } }; }): ApplyDeps
  - L84: function freshSource(suffix: number): DraftRow
  - L99: async function seedLedgerText(text: string): Promise<void>
  - L104: async function pathExists(path: string): Promise<boolean>
  - L113: async function findFilesByName(root: string, name: string): Promise<string[]>

Global vars:
  - workDir: string
  - FIXED_DATE
  - SOURCE_DRAFT: DraftRow
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/validator.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import {
  validateLedger,
  type ChangeRow,
  type ClaimRow,
  type KnbRow,
  type LoadedRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";
  - import { executeQuery } from "../src/core/query";
  - import { buildEffectiveState } from "../src/core/state";
---

Functions:
  - L270: function load(rows: KnbRow[]): LoadedRow[]

Global vars:
  - source: SourceRow
  - claim: ClaimRow
  - synthesis: SynthesisRow
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/cli.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { appendFile, chmod, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
  - import { realpath } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { runCli } from "../src/cli";
  - import type { CommandResult, OutputOptions, OutputSink } from "../src/core/output";
---

Type-aliases:
  - SpawnResult
  - Captured
  - RunManifestFixture

Functions:
  - L10: const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts")
  - L26: async function pathExists(path: string): Promise<boolean>
  - L37: async function runCliBinary( args: string[], options: { stdin?: string; cwd?: string; env?: Record<string, string> } = {}, ): Promise<SpawnResult>
  - L67: function makeCapturingOptions(format: OutputOptions["format"]): { options: OutputOptions; captured: Captured; }
  - L89: async function runCliInProcess( args: string[], format: OutputOptions["format"] = "json", optionsExtra: Partial<OutputOptions> = {}, ): Promise<{ code: number } & Captured>
  - L104: function parseEnvelope(text: string): { envelope: Record<string, unknown>; raw: string }
  - L109: async function initWorkspace(): Promise<void>
  - L125: async function seedRunManifests(manifests: RunManifestFixture[]): Promise<void>
  - L133: function manifest( run_id: string, actor: string, completed_at: string, row_ids: string[], intent?: string, ): RunManifestFixture
  - L153: async function seedAsOfFixture(collection = "asof-cli"): Promise<{ sourceId: string; claimId: string }>

Global vars:
  - workDir: string
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/context.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import {
  DEFAULT_CONTEXT_SCORING_PROFILE,
  buildContext,
  scoreContextClaim,
  scoreContextQuestion,
  scoreContextSynthesis,
} from "../src/core/context";
  - import { buildEffectiveState } from "../src/core/state";
  - import type {
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
---

Type-aliases:
  - ContextRankingGolden

Functions:
  - L19: function load(rows: KnbRow[]): LoadedRow[]
  - L23: function source(id: string, overrides: Partial<SourceRow["source"]> = {}): SourceRow
  - L42: function claim( id: string, sourceIds: string[], options: { importance?: "high" | "medium" | "low" | "unknown"; confidence?: "high" | "medium" | "low" | "unknown"; contested?: boolean; statement?: string; created_at?: string; collection?: string; evidenceCount?: number; claimType?: string; predicate?: string; qualifiers?: Record<string, unknown>; external_refs?: ClaimRow["external_refs"]; } = {}, ): ClaimRow
  - L95: function question( id: string, options: { priority?: "high" | "medium" | "low"; text?: string; status?: "open" | "resolved" | "archived"; collection?: string; created_at?: string; } = {}, ): QuestionRow
  - L120: function synthesis( id: string, basisClaimIds: string[], options: { importance?: "high" | "medium" | "low" | "unknown"; title?: string; created_at?: string; sourceIds?: string[]; collection?: string; } = {}, ): SynthesisRow
  - L153: function fixtureState(rows: KnbRow[])
  - L163: function contextRanking(result: ReturnType<typeof buildContext>): ContextRankingGolden
  - L171: function iranCracksLikeRows(): KnbRow[]
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/ledger.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { access, mkdtemp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { createHash } from "node:crypto";
  - import { isKnbError } from "../src/core/errors";
  - import {
  canonicalContentHash,
  defaultLedgerFsBackend,
  loadLedger,
  writeLedger,
  type LedgerFsBackend,
  type LedgerLockHandle,
  type LedgerSnapshot,
} from "../src/core/ledger";
  - import { rowSamples } from "../src/core/contract";
---

Functions:
  - L29: function ledgerPath(): string
  - L33: function lockPath(): string
  - L37: function rawSha256Hex(text: string): string
  - L41: async function seedLedger(text: string): Promise<string>
  - L48: async function seedLedgerBytes(buffer: Buffer): Promise<string>
  - L55: function jsonRow(id: string, kind = "claim"): string
  - L59: async function fileExists(path: string): Promise<boolean>

Global vars:
  - workDir: string
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/novelty.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import {
  classifyClaim,
  classifyMany,
  normalizeStatement,
  type CandidateClaim,
  type NoveltyClassification,
} from "../src/core/novelty";
  - import { buildEffectiveState } from "../src/core/state";
  - import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
---

Functions:
  - L19: function load(rows: KnbRow[]): LoadedRow[]
  - L23: function makeSource(id: string): SourceRow
  - L36: function makeClaim( id: string, sourceId: string, overrides: Partial<ClaimRow> = {}, ): ClaimRow
  - L60: function makeChangeRetract(id: string, targetId: string): ChangeRow
  - L72: function buildState(rows: KnbRow[])
  - L76: const src1 = makeSource("src:test:20260501:s001a000")
  - L77: const src2 = makeSource("src:test:20260501:s002a000")
  - L78: const src3 = makeSource("src:test:20260501:s003a000")
  - L80: const claimA: ClaimRow = makeClaim("claim:test:20260501:aaaa1111", src1.id, { identity: { claim_key: "alpha|exists" }, claim: { statement: "Alpha exists.", atomic: true }, time: { precision: "unknown", valid_at: "2026-04-01T00:00:00Z" }, provenance: { source_ids: [src1.id], evidence: [ { source_id: src1.id, role: "supports", summary: "Source 1 supports." }, ], }, assessment: { confidence: "medium" }, scope: { collections: ["alpha-col"], subjects: ["Alpha"] }, })
  - L94: const claimB: ClaimRow = makeClaim("claim:test:20260501:bbbb2222", src2.id, { identity: { claim_key: "beta|grows", dedupe_hash: "deadbeef" }, claim: { statement: "Beta grows quickly during summer.", atomic: true }, time: { precision: "day", valid_at: "2026-06-01T00:00:00Z" }, provenance: { source_ids: [src2.id], evidence: [{ source_id: src2.id, role: "supports", summary: "Source 2 supports." }], }, assessment: { confidence: "high", importance: "medium" }, scope: { collections: ["beta-col"], subjects: ["Beta"] }, })
  - L106: const claimC: ClaimRow = makeClaim("claim:test:20260501:cccc3333", src3.id, { identity: { claim_key: "gamma|costs" }, claim: { statement: "Gamma costs three credits per unit.", atomic: true }, time: { precision: "unknown" }, provenance: { source_ids: [src3.id], evidence: [{ source_id: src3.id, role: "supports", summary: "Source 3 supports." }], }, assessment: { confidence: "low", contested: true }, scope: { collections: ["gamma-col"], subjects: ["Gamma"] }, })
  - L118: const claimD: ClaimRow = makeClaim("claim:test:20260501:dddd4444", src1.id, { identity: { claim_key: "delta|emits" }, claim: { statement: " Hello, World! ", atomic: true }, scope: { collections: ["delta-col"], subjects: ["Delta"] }, })
  - L124: const claimE_retracted: ClaimRow = makeClaim("claim:test:20260501:eeee5555", src1.id, { identity: { claim_key: "epsilon|hidden" }, claim: { statement: "Epsilon hidden statement.", atomic: true }, scope: { collections: ["epsilon-col"], subjects: ["Epsilon"] }, })
  - L130: const claimF_retracted: ClaimRow = makeClaim("claim:test:20260501:ffff6666", src2.id, { identity: { claim_key: "zeta|gone" }, claim: { statement: "Zeta is no longer here.", atomic: true }, scope: { collections: ["zeta-col"], subjects: ["Zeta"] }, })
  - L136: const retract1 = makeChangeRetract("chg:test:20260501:r0001000", claimE_retracted.id)
  - L137: const retract2 = makeChangeRetract("chg:test:20260501:r0002000", claimF_retracted.id)

Global vars:
  - baseline: KnbRow[]
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/novelty-projection.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
  - import type { ApplyOperation, DraftRow } from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
  - import { V1_INDEX_NAMES } from "../src/core/projections";
---

Type-aliases:
  - ClaimExtras

Functions:
  - L21: function makeStubAllocator(): (bytes: number) =>
  - L29: async function openTestKnb(): Promise<Knb>
  - L43: function sourceDraft(collection: string, suffix = ""): DraftRow
  - L63: function claimDraft( sourceRef: string, collection: string, statement: string, extras: ClaimExtras = {}, ): DraftRow
  - L94: async function fileExists(path: string): Promise<boolean>

Global vars:
  - workDir: string
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/output.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { knbError } from "../src/core/errors";
  - import {
  failure,
  render,
  renderJson,
  renderNdjson,
  renderPrettyJson,
  success,
  type CommandResult,
  type OutputFormat,
} from "../src/core/output";
---
Classes:
  - BufferStream
    Methods:
      - L17: write(chunk: string | Uint8Array): boolean
      - L21: text(): string
    Properties:
      - chunks: string[]

Functions:
  - L26: function streams(): { stdout: BufferStream; stderr: BufferStream }
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/profiles.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { appendFile, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
  - import type { DraftRow } from "../src/core/contract";
---

Functions:
  - L19: function makeStubAllocator(): (bytes: number) =>
  - L27: async function openTestKnb(): Promise<Knb>
  - L41: async function writeProfile(name: string, profile: unknown): Promise<void>
  - L47: async function writeRawProfile(name: string, raw: string): Promise<void>
  - L53: function sourceDraft(collection = "profiles"): DraftRow
  - L62: function claimDraft(sourceRef: string, collection = "profiles"): DraftRow
  - L81: function validPredictionClaimDraft(sourceRef: string, collection = "profiles"): DraftRow

Global vars:
  - workDir: string
  - predictionProfile
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/projections.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join, sep } from "node:path";
  - import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
  - import type { LedgerFingerprint } from "../src/core/ledger";
  - import { canonicalContentHash } from "../src/core/ledger";
  - import {
  buildClaimKeyClusters,
  JsonProjectionArtifactStore,
  V1_INDEX_NAMES,
  checkFreshness,
  rebuildIndexes,
  renderAllCollections,
  renderCollection,
} from "../src/core/projections";
  - import { executeQuery } from "../src/core/query";
  - import { buildEffectiveState } from "../src/core/state";
  - import type { KnbWorkspace } from "../src/core/workspace";
---

Functions:
  - L31: function load(rows: KnbRow[]): LoadedRow[]
  - L35: function makeSource(id: string, overrides: Partial<SourceRow> = {}): SourceRow
  - L49: function makeClaim(id: string, sourceId: string, overrides: Partial<ClaimRow> = {}): ClaimRow
  - L69: function makeQuestion(id: string, overrides: Partial<QuestionRow> = {}): QuestionRow
  - L82: function makeSynthesis( id: string, basisClaimIds: string[], basisSourceIds: string[], overrides: Partial<SynthesisRow> = {}, ): SynthesisRow
  - L105: function fixtureRows(): KnbRow[]
  - L127: function iranFixtureRows(): KnbRow[]
  - L251: function goldenFingerprint(rows: KnbRow[]): LedgerFingerprint
  - L263: function fingerprintFor(rows: KnbRow[], path = "/repo/knb/ledger.jsonl"): LedgerFingerprint
  - L278: async function makeWorkspace(): Promise<KnbWorkspace>
  - L313: async function freshWorkspace(): Promise<KnbWorkspace>
  - L319: function markdownSections(markdown: string): Map<string, string>

Global vars:
  - workspaces: KnbWorkspace[]
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/public-api-request-names.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { openKnb } from "../src/index";
  - import type {
  ApplyRequest,
  CollectionStatusRequest,
  ContextRequest,
  ContextScoringProfileInput,
  GetRequest,
  QueryRequest,
  RenderAllRequest,
  RenderRequest,
} from "../src/index";
---

Type-aliases:
  - HasKey
  - Not
  - Expect
  - PublicRequestNamesUseCamelCase

Global vars:
  - typecheckPublicRequestExamples
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/query.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { buildEffectiveState } from "../src/core/state";
  - import { executeGet, executeQuery } from "../src/core/query";
  - import { isKnbError } from "../src/core/errors";
  - import type {
  ChangeRow,
  ClaimRow,
  KnbRow,
  LoadedRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "../src/core/contract";
---

Functions:
  - L15: function load(rows: KnbRow[]): LoadedRow[]
  - L19: function makeSource(id: string, overrides: Partial<SourceRow> = {}): SourceRow
  - L38: function makeClaim(id: string, sourceId: string, overrides: Partial<ClaimRow> = {}): ClaimRow
  - L58: function makeQuestion(id: string, overrides: Partial<QuestionRow> = {}): QuestionRow
  - L71: function makeSynthesis( id: string, basisClaimIds: string[], overrides: Partial<SynthesisRow> = {}, ): SynthesisRow
  - L93: function makeChange(id: string, change: ChangeRow["change"], createdAt = "2026-05-01T13:00:00Z"): ChangeRow
  - L105: function buildFixture(): { source: SourceRow; betaSource: SourceRow; claimA: ClaimRow; claimB: ClaimRow; claimSuperseded: ClaimRow; claimReplacement: ClaimRow; claimRetracted: ClaimRow; claimBeta: ClaimRow; question: QuestionRow; synthesis: SynthesisRow; supersedeChange: ChangeRow; retractChange: ChangeRow; rows: LoadedRow[]; }
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/read-side.test.ts
Imports:
  - import { afterEach, beforeEach, describe, expect, test } from "bun:test";
  - import { appendFile, mkdtemp, readFile, rm } from "node:fs/promises";
  - import { tmpdir } from "node:os";
  - import { join } from "node:path";
  - import { openKnb, type Knb, type OpenKnbOptions } from "../src/index";
  - import type { ApplyOperation, ApplyRequest, DraftRow, ExternalRef } from "../src/core/contract";
  - import { isKnbError } from "../src/core/errors";
  - import { readSnapshot, type ReadSnapshotFreshnessProbe } from "../src/core/read-snapshot";
---

Functions:
  - L21: function makeStubAllocator(): (bytes: number) =>
  - L29: async function openTestKnb(): Promise<Knb>
  - L43: function sourceDraft(collection: string, uri = `https://example.com/${collection}`, title = "Source"): DraftRow
  - L52: function claimDraft( sourceRef: string, collection: string, statement: string, claimKey?: string, extras: { time?: { precision: "instant" | "hour" | "day" | "month" | "year" | "range" | "unknown"; valid_at?: string }; importance?: "high" | "medium" | "low"; claimType?: string; predicate?: string; qualifiers?: Record<string, unknown>; external_refs?: ExternalRef[]; } = {}, ): DraftRow
  - L92: function synthDraft(collection: string, claimRef: string, title = "Synthesis", summary = "Sums it up."): DraftRow
  - L105: function questionDraft(collection: string, text = "What remains open?"): DraftRow

Global vars:
  - workDir: string
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/selectors.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { selectEffectiveRows, matchesRowSelector, validateRowSelector } from "../src";
  - import type { ClaimRow, ExternalRef, KnbRow, SourceRow } from "../src/core/contract";
  - import { buildEffectiveState } from "../src/core/state";
---

Functions:
  - L7: function source(id: string): SourceRow
  - L20: function load(rows: KnbRow[])
  - L24: function claim( id: string, options: { type?: string; location?: string; collection?: string; tags?: string[]; created_at?: string; score?: number; external_refs?: ExternalRef[]; } = {}, ): ClaimRow
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/workspace.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import { isAbsolute, join, sep } from "node:path";
  - import { isKnbError } from "../src/core/errors";
  - import { openWorkspace, type ExecResult, type OpenWorkspaceOptions } from "../src/core/workspace";
---

Type-aliases:
  - FileMap
  - ExecFn

Functions:
  - L11: function fileSystem(initial: FileMap): { files: FileMap; readFile: (path: string) =>
  - L31: function noopExec(): ExecFn
  - L35: function makeOptions(overrides: Partial<OpenWorkspaceOptions>): OpenWorkspaceOptions

Global vars:
  - ROOT
---


File: /Users/jaredsmith/Projects-ultra/knb/tests/errors.test.ts
Imports:
  - import { describe, expect, test } from "bun:test";
  - import {
  exitCodeForError,
  fromUnknown,
  isKnbError,
  knbError,
  KnbErrorBase,
  type KnbError,
  type KnbErrorCode,
} from "../src/core/errors";
---

Global vars:
  - codeMap: Record<KnbErrorCode, number>
---

</file_map>
<file_contents>
File: /Users/jaredsmith/Projects-ultra/knb/package.json
```json
{
  "name": "knb",
  "version": "0.1.0",
  "description": "Portable, embeddable, AI-friendly JSONL knowledge base tooling.",
  "homepage": "https://github.com/ratacat/knb#readme",
  "repository": {
    "type": "git",
    "url": "git+ssh://git@github.com/ratacat/knb.git"
  },
  "type": "module",
  "bin": {
    "knb": "./src/cli.ts"
  },
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "knb": "bun run src/cli.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "sync-schema": "bun run scripts/sync-schema.ts",
    "release:smoke": "bun run scripts/release-smoke.ts",
    "release-check": "bun test && bun run typecheck && bun run release:smoke"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "typescript": "latest"
  }
}

```

File: /Users/jaredsmith/Projects-ultra/knb/README.md
```md
# knb

`knb` is a small JSONL knowledge base for AI-assisted research. It keeps sourced claims, open questions, and synthesis in one append-only ledger that agents can audit and rebuild from scratch.

The CLI is designed for agents, not for hand-operated note taking. It favors explicit commands, JSON envelopes, stable exit codes, and append-only writes over a cozy human interface.

Repository: https://github.com/ratacat/knb

## How agents use it

`knb` is for research state that needs to survive across agent turns. A good row is small, sourced, and easy to invalidate later. Agents should not paste a whole dossier into one blob if they can store the source, split the claims, leave open questions, and write a short synthesis.

The loop is usually:

1. Read orientation with `status` and `context`.
2. Check whether candidate claims are new with `novelty`.
3. Write one atomic batch with `apply`.
4. Run `check`.
5. Render views or rebuild indexes when another agent or human needs the projected output.

The ledger is append-only on purpose. If a claim is wrong, an agent writes a `change` row that retracts or supersedes it. That gives later agents the full trail instead of a silently edited note.

Reads come from the effective state, not raw file scans. That means queries, context packets, renders, and collection summaries all respect retractions, supersession, merges, and historical `--as-of` cutoffs.

## What it stores

The canonical model is `knb.v1`.

- `source`: where knowledge came from
- `claim`: the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `change`: lifecycle events such as retractions, supersession, merges, relation changes, and repairs

Only `knb/ledger.jsonl` is canonical. `knb/views/` and `knb/indexes/` are generated projections. Delete and rebuild them whenever they get stale.

```text
knb/
  ledger.jsonl
  schema.json
  README.md
  views/
  indexes/
```

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/ratacat/knb/main/scripts/install.sh | bash
```

The installer keeps a checkout in `~/.knb/knb-cli` and writes a `knb` launcher into a directory on your `PATH`. It installs Bun if Bun is missing. Rerun the same command to update.

## Agent examples

Before writing, ask for the current shape of the workspace:

```bash
knb status --json
knb context --collection my-topic --max-tokens 3000 --json
```

Preview candidate claims without writing:

```bash
knb novelty --stdin --json < candidate-claims.json
```

Commit a batch only after the candidate rows are ready:

```bash
knb apply --stdin --atomic --dedupe --json < ops.json
```

Check the workspace after writes:

```bash
knb check --json
```

Generate disposable outputs for handoff or inspection:

```bash
knb render --collection my-topic --format md --out knb/views/my-topic.md --json
knb index --rebuild
```

For one-off row insertion, `add` wraps the same write path as `apply`:

```bash
knb add --file row.json --json
```

For targeted reads, query the effective state:

```bash
knb query --kind claim --collection my-topic --json
knb collections --json
```

## CLI reference

```bash
knb init    [--root <dir>] [--config <path>] [--ledger <path>] [--actor <name>] [--force] [--json]
knb status  [--root <dir>] [--collection <c>] [--max-questions N] [--detailed] [--json]
knb collections [--root <dir>] [--json]
knb schema  [--json]
knb log     [--actor <a>] [--since <date>] [--until <date>] [--limit N] [--json]
knb apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dedupe] [--dry-run]
knb add     (--file row.json | --json '{...}' | --stdin)
knb get     <id> [<id>...] [--as-of <iso>] [--include-history] [--explain]
knb query   [--as-of <iso>] [--kind claim] [--collection topic] [--subject name] [--tag tag] [--text text] [--claim-key key] [--claim-type type] [--predicate value] [--qualifier key=value] [--external-ref system:id] [--citing uri] [--limit N] [--history] [--full] [--json]
knb context [--as-of <iso>] [--collection topic] [--subject name] [--tag tag] [--claim-type type] [--predicate value] [--qualifier key=value] [--external-ref system:id] [--max-tokens 3000] [--recency-window-days N] [--no-warnings] [--json]
knb novelty (--file candidates.json | --json '{...}' | --stdin)
knb render  (--collection topic [--out knb/views/topic.md] | --all) [--as-of <iso>] [--format md] [--json]
knb check   [--json]
knb index   [--rebuild]
```

`apply` and `add` use the same locked write path. They validate the full batch before touching the ledger, so duplicate IDs, unresolved source references, unresolved relation targets, and kind-specific shape errors fail cleanly.

`collections` reads from the validated effective-state snapshot, not from generated indexes. `log` reads apply run manifests from `.knb/runs/`.

`get`, `query`, `context`, and `render` accept `--as-of <iso>` for historical reads. `query` and `context` also accept generic structured-claim filters such as `--claim-type`, `--predicate`, `--qualifier key=value`, and `--external-ref system:id`.

Optional profile files in `knb/profiles/*.json` can validate project-specific claim vocabularies without changing the row model. Run `knb schema --json` to inspect the row schema, RowSelector contract, profile-file contract, and examples.

## Local development

For local development in this repository:

```bash
bun install
bun run knb -- init --json
bun run knb -- status --json
```

## Library usage

Host applications import the same facade the CLI uses:

```ts
import { openKnb } from "knb";

const knb = await openKnb();
const status = await knb.status();
const result = await knb.apply({
  operations: [
    {
      op: "add",
      row: {
        kind: "source",
        scope: { collections: ["example"] },
        source: { type: "web_page", title: "Example", uri: "https://example.com" },
        provenance: { acquisition: { method: "manual" } },
      },
    },
  ],
});
```

See [docs/library-usage.md](docs/library-usage.md) for the facade methods and examples.

See [docs/design/agent-first-cli.md](docs/design/agent-first-cli.md) for the full command surface, output envelopes, and lifecycle model.

```

File: /Users/jaredsmith/Projects-ultra/knb/docs/adr/0001-v1-cutover-validate-to-check.md
```md
# ADR-0001: V1 Cutover from Validate/Append to Check/Apply

Date: 2026-05-02

Status: Accepted

## Context

The V1 design replaces prototype command names and schema names with one current contract. Older sketches used `validate`, `append`, and `kb.v1`. The accepted V1 surface uses `check`, `apply`, `add`, and `knb.v1`.

## Decision

Do not preserve compatibility aliases for removed prototype commands or schema versions. `validate` is replaced by `check`; `append` is replaced by `apply` plus the one-row `add` wrapper; obsolete schema versions such as `kb.v1` are rejected rather than translated.

A future validate-batch-before-commit need is filled by `apply --dry-run`, not by reintroducing `validate`. See `bd-3r4`.

## Consequences

Agents and host applications learn one command set and one schema namespace. Documentation and tests must use the V1 names only. Future proposals to add `validate` or `append` should first explain why `check`, `apply`, `add`, or `apply --dry-run` are insufficient.

```

File: /Users/jaredsmith/Projects-ultra/knb/docs/adr/0002-projection-store-seam-jsonl-only.md
```md
# ADR-0002: Projection Store Seam, JSON Artifacts Only in V1

Date: 2026-05-02

Status: Accepted

## Context

V1 needs generated views, generated indexes, sidecar metadata, and projection freshness checks. The design names a projection-store seam because a future SQLite-backed projection store may be useful, but no current measurement justifies adding a second adapter.

## Decision

Ship one V1 adapter: `JsonProjectionArtifactStore`. It writes disposable Markdown views, JSON indexes, and metadata under `knb/views/` and `knb/indexes/`. Keep the `ProjectionArtifactStore` interface as the seam, but do not add a SQLite adapter in this epic.

## Consequences

Generated artifacts stay simple, inspectable, and rebuildable. Future SQLite work must conform to `ProjectionArtifactStore` and should be introduced by a later epic with measurements that justify the extra dependency, migration surface, and operational complexity.

```

File: /Users/jaredsmith/Projects-ultra/knb/AGENTS.md
```md
# Agent Instructions

## Project Goal

`knb` is a small, portable, embeddable knowledge base structure for AI-assisted research. It stores sourced knowledge, uncertainty, and synthesis in an append-only JSONL ledger that agents can dedupe, audit, query, and reconstruct.

The canonical model is `knb.v1`:

- `source`: where knowledge came from
- `claim`: the smallest useful proposition
- `question`: unresolved uncertainty
- `synthesis`: readable interpretation
- `change`: append-only operational event for retractions, supersession, merges, relation changes, and mechanical repairs

Reusable row modules are `scope`, `identity`, `time`, `provenance`, `assessment`, and `relations`.

## Rules

- Always use Bun for package management, scripts, tests, and local execution.
- Prefer the CLI over direct edits to `knb/ledger.jsonl`.
- Treat `knb/ledger.jsonl` as append-only. Do not rewrite old rows except for mechanical repair.
- Treat `knb/views/` and `knb/indexes/` as generated outputs. They are never canonical.
- Keep the schema general. Do not add app-specific fields to the canonical row model.
- Add dependencies only when they clearly improve reliability or maintainability.

## Commands

```bash
bun run knb -- init
bun run knb -- status --json
bun run knb -- schema --json
bun run knb -- apply --stdin --json
bun run knb -- add --stdin --json
bun run knb -- get <id>
bun run knb -- query --kind claim --collection example
bun run knb -- context --collection example --max-tokens 3000 --json
bun run knb -- check --json
bun run knb -- render --collection example
bun run knb -- index --rebuild
```

Writes go through `apply` (atomic batch) or its single-row wrapper `add`. Reads (`get`, `query`, `context`, `render`, `check`, `index`) go through validated effective-state snapshots, so they respect lifecycle changes and projection freshness automatically.

## Design Notes

The CLI is a thin adapter: parse args, open a workspace, call one library method, render an envelope. Both the CLI and host applications use the same `openKnb` facade, so the public library is also the test surface. Any new behavior should live behind a facade method, not in CLI argument handling.

`knb/ledger.jsonl` is canonical. Generated `knb/views/` and `knb/indexes/` are disposable projections rebuilt from the ledger.

See [Architecture](ARCHITECTURE.md) for the module map, vocabulary, naming boundaries, projection seams, and ADR index.

See [Agent-First CLI Design](docs/design/agent-first-cli.md) for the full command surface, output envelopes, lifecycle model, and module seams. See [Library Usage](docs/library-usage.md) for `openKnb` and the facade methods host applications call.

```

File: /Users/jaredsmith/Projects-ultra/knb/docs/design/agent-first-cli.md
```md
# knb Agent-First CLI Design

`knb` is a small CLI-first package with a library underneath. Agents use the `knb` command. Host applications import the same core library. Both paths operate on the same append-only JSONL ledger.

This is the live greenfield V1 spec. It incorporates the relevant decisions from [pro-refactor.md](/Users/jaredsmith/Projects/knb/docs/design/pro-refactor.md); treat that file as historical analysis, not an additional contract.

## Goals

- Write many ledger changes in one atomic call.
- Retrieve compact research context in one call.
- Keep the canonical model portable, auditable, and dependency-light.
- Keep generated indexes and views disposable.
- Keep each module deep: callers learn a small interface and get a lot of behavior.
- Replace prototype helpers with deep modules instead of extending broad helper files.

## Architecture Principles

The CLI stays thin. It parses arguments, opens a workspace, calls one library method, and sends the result through the output module.

The library owns correctness. Write ordering, current-state projection, row contracts, output envelopes, and token-budgeted context all sit behind deep modules. Callers should not reassemble these rules from helper functions.

The module interface is the test surface. Tests should exercise the same seams that the CLI and host applications use.

Do not add new CLI commands directly on top of prototype helpers. Establish the workspace, output, contract, ledger, and state seams first, then route commands through the public library.

Do not add fallback formats, deprecated aliases, dual storage layouts, or compatibility shims. This is a greenfield project; the final implementation should expose one current contract.

## Module Depth Standard

A module earns an external seam when deleting it would push its rules into multiple callers. If deleting a module removes complexity instead of concentrating it, the module was shallow and should be folded into its caller.

V1 should have these external seams:

- `Knb` facade: the public library interface used by the CLI and host applications.
- Workspace module: path, config, and actor resolution.
- Ledger module: JSONL parsing, locked write transactions, and flush behavior.
- Contract module: row contracts, operation contracts, validation, samples, and JSON Schema.
- State module: deterministic projection from raw rows to current state.
- Read snapshot module: one read-side packet that combines ledger, validation, state, and projection freshness.
- Apply module: semantic write pipeline from operations to appendable rows.
- Query module: deterministic retrieval over effective state.
- Context module: token-budgeted research packet construction over effective state.
- Novelty module: deterministic claim comparison shared by `novelty` and `apply --dedupe`.
- Projection module: generated views, generated indexes, and freshness metadata.
- Output and error modules: CLI rendering, envelopes, and exit-code mapping.

`check` is a library capability. Give it a separate module only when its interface hides enough behavior to pass the deletion test. Until then, keep the behavior behind the `Knb` facade and reuse the deeper modules.

Internal seams are allowed inside a deep module for its own tests. Do not export an internal seam until two real callers or adapters need it.

## Storage

```text
.knb/
  config.json

knb/
  ledger.jsonl
  schema.json
  indexes/
  views/
```

Only `knb/ledger.jsonl` is canonical. `knb/indexes/` and `knb/views/` are projections and can be rebuilt.

## Workspace Module

The workspace module is the first seam every command crosses. It resolves where the `knb` workspace lives and who is acting.

Interface responsibilities:

- Resolve `--root`, `--config`, and `--ledger`.
- Resolve config in this order:

  ```text
  --config
  KNB_CONFIG
  .knb/config.json
  current directory fallback
  ```

- Normalize ledger, schema, index, view, and lock paths.
- Resolve the actor from `--actor`, `KNB_ACTOR`, Git user/email, system username, then `"unknown"`.
- Return one opened workspace object used by all commands.

The CLI and library should not duplicate path or actor logic. A command that needs the ledger asks the workspace for it.

## Runtime Inputs

Keep runtime variability explicit and small. V1 needs deterministic adapters for time and ID randomness because tests and reproducible agent runs need them. It does not need a storage adapter until a second real storage implementation exists.

Runtime inputs:

```ts
type KnbRuntime = {
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
};
```

Production uses system time and cryptographic randomness. Tests can pass deterministic adapters through `openKnb`. Core modules receive these inputs from the `Knb` facade; they do not call `new Date()` or random functions directly.

## Ledger Module

The ledger module owns file-system correctness. It is the only module that reads or writes `knb/ledger.jsonl` directly.

Interface responsibilities:

- Load JSONL defensively and preserve line numbers.
- Return parse issues without hiding valid later rows.
- Return a ledger fingerprint for loaded snapshots.
- Create storage directories when writing.
- Acquire and release `.knb/ledger.lock` for write transactions.
- Fail fast with exit code 6 when the lock is busy.
- Run read and append in one locked write transaction.
- Flush file and directory writes before reporting success.
- Report bytes written, rows read, rows appended, and ledger path metadata.

Callers do not use `readFile`, `appendFile`, or `writeFile` against the ledger. If apply, check, query, and render each need to know lock or JSONL details, the ledger module is too shallow.

Write transaction interface:

```ts
type LedgerWriteTransaction<T> = (snapshot: LedgerSnapshot) => Promise<LedgerAppendPlan<T>>;

type LedgerAppendPlan<T> = {
  rows: KnbRow[];
  result: T;
};
```

Snapshot metadata:

```ts
type LedgerFingerprint = {
  path: string;
  rows: number;
  bytes: number;
  last_row_id?: string;
  content_hash: string;
};
```

The ledger module computes the fingerprint from canonical ledger bytes. Projection freshness, status summaries, and check diagnostics use this fingerprint instead of recomputing their own ledger identity.

Atomic write semantics:

1. Acquire the lock with exclusive create.
2. Load and parse the current ledger while holding the lock.
3. Pass the locked snapshot to the caller callback.
4. Receive rows to append and the caller result.
5. Serialize rows to JSONL inside the ledger module.
6. Open the ledger for append, write the complete batch, and flush the file.
7. Release the file handle.
8. Flush the ledger directory when the runtime exposes directory fsync.
9. Release the lock in a `finally` path.
10. Return the caller result plus ledger metadata.

The ledger module does not validate row meaning. It guarantees that read, validation by the caller, and append by the ledger share one locked snapshot. Either the requested batch is appended as supplied by the callback, or the caller receives an error and no rows append.

This is logical atomicity for normal process errors. A process or OS crash during the underlying append can still leave a partial trailing line on some filesystems. The loader must report that line-numbered parse issue, preserve valid rows before and after any bad line, and let `check` become the explicit recovery surface.

## Prototype Replacement Rules

The current implementation is scaffold. It has useful row vocabulary, fixtures, and validation behavior, but it is not a compatibility target. V1 should replace broad helpers with the target module graph and then remove the old paths.

Final V1 command set:

```text
init
status
schema
apply
add
get
query
context
novelty
render
check
index
```

Removed public commands:

```text
validate
append
```

`validate` is replaced by `check`. `append` is replaced by `apply` and `add`. Do not preserve aliases in the final release.

Naming rules:

- Use lowercase `knb` for package names, command examples, file paths, schema namespaces, and prose that names the project.
- Use PascalCase `Knb` for exported TypeScript symbols: `Knb`, `KnbRow`, `KnbWorkspace`, `KnbRuntime`, `KnbStatus`, and `openKnb`.
- Do not use `KB` as shorthand in new code.

Extraction rules:

- Move row and operation contracts from `src/types.ts` and `src/knb.ts` into `src/core/contract.ts`.
- Move JSONL loading, fingerprints, locking, and append transactions into `src/core/ledger.ts`.
- Move current-state projection into `src/core/state.ts`; all reads consume `EffectiveState`.
- Move rendering, indexes, metadata, and freshness checks into `src/core/projections.ts`.
- Move deterministic retrieval into `src/core/query.ts`; do not use raw `JSON.stringify` search as the main query path.
- Build atomic writes in `src/core/apply.ts`; do not extend single-row append into the primary writer.
- Build `src/core/context.ts` and `src/core/novelty.ts` as separate modules because agents need both orientation and duplicate pressure.
- Route the CLI through `openKnb` and output envelopes. The CLI should not import ledger, validation, query, or projection helpers directly.

Final cleanup rules:

- Delete `src/knb.ts`, or reduce it to a private wrapper only if tests still need a temporary bridge during the branch.
- Do not import broad helpers from `src/knb.ts` after final cutover.
- Reject obsolete schema versions such as `kb.v1` instead of translating them.
- Keep `knb/schema.json` synchronized with `contract.jsonSchema()` until schema generation exists.
- Add the package export: `{ "exports": { ".": "./src/index.ts" } }`.
- Update public docs and agent examples to use `status`, `schema`, `apply`, `add`, `context`, `check`, `render`, and `index`.

## Row Model

The canonical row kinds are:

- `source`: an information artifact.
- `claim`: an atomic proposition.
- `question`: unresolved uncertainty.
- `synthesis`: readable interpretation.
- `change`: an operational event that changes effective state.

Every canonical row in V1 uses `schema_version: "knb.v1"`. Obsolete schema strings such as `kb.v1` should be rejected during the V1 cutover, not preserved as aliases.

Knowledge rows remain immutable. Current state is a deterministic projection over ledger order.

`relations` express semantic links between knowledge rows. They do not retract, supersede, or merge rows. Lifecycle changes belong in `change` rows.

Claim identity policy:

- `identity` is required for claim rows.
- `identity.claim_key` is optional. Agents should provide it when they know a stable key, but V1 should not force agents to invent weak keys.
- `identity.dedupe_hash` is optional. Novelty may compute normalized statement hashes internally, but apply must not silently persist a dedupe hash that the caller did not provide.

Source dedupe policy:

- Duplicate source URI or content-hash evidence should produce warnings, not blocked writes.
- Claim-level novelty is the V1 duplicate-control surface.

## Change Rows

Use `change` rows for operational history:

- `retract`: mark target rows ineffective.
- `supersede`: mark target rows ineffective in favor of a replacement row.
- `merge`: mark target rows as duplicates of a canonical row.
- `relate`: add relation state without rewriting rows.
- `patch`: record a mechanical repair without rewriting the target row. V1 records audit metadata and explanations only; `EffectiveState` does not apply JSON patches to mutate row content.

Physical in-place repair is reserved for broken JSONL, invalid IDs, or other mechanical corruption that prevents the ledger from loading.

## Apply Pipeline Module

`knb apply` is the primary write interface. It should be one deep module, not a command that coordinates many shallow helpers.

The apply operation contract must exist before the write pipeline. The CLI, schema command, tests, and host applications all use the same operation types.

Base request shape:

```ts
type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true; // v1 supports only atomic writes
  dedupe?: boolean; // default false
  actor?: string;
  now?: string;
};
```

Base operation shapes:

```ts
type ApplyOperation =
  | { op: "add"; row: DraftRow; as?: string }
  | { op: "retract"; target_ids: Ref[]; reason: string; scope?: Scope; as?: string }
  | { op: "supersede"; target_ids: Ref[]; replacement_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "merge"; target_ids: Ref[]; canonical_id: Ref; reason: string; scope?: Scope; as?: string }
  | { op: "relate"; from_id: Ref; to_id: Ref; rel: RelationType; strength?: "low" | "medium" | "high"; rationale?: string; scope?: Scope; as?: string }
  | { op: "patch"; target_id: Ref; patch: Array<Record<string, unknown>>; reason: string; scope?: Scope; as?: string };

type DraftRow = Omit<Partial<KnbRow>, "schema_version" | "created_at" | "created_by"> & {
  id?: string;
  kind: KnbRowKind;
  scope: Scope;
};

type Ref = string; // existing row ID, "$op<N>", or "$<as>"
```

`op: "add"` appends the supplied row after filling missing common fields. Lifecycle operations append `change` rows. If a lifecycle operation omits `scope`, apply derives it from the referenced target rows; validation fails if no anchored scope can be derived. The `as` field gives an operation a stable intra-batch reference. `$op0` also refers to the row created by operation index 0.

Intra-batch references are left-to-right only. A reference may target an existing row, a prior `$op<N>`, or a prior named `$<as>`. Forward references are validation errors.

`atomic: false` is not a v1 fallback mode. If a request explicitly asks for non-atomic writes, return `unsafe_operation_refused`.

Example:

```json
{
  "operations": [
    {
      "op": "add",
      "as": "source",
      "row": {
        "kind": "source",
        "scope": { "collections": ["example"] },
        "source": {
          "type": "web_page",
          "title": "Example",
          "uri": "https://example.com"
        },
        "provenance": {
          "acquisition": { "method": "manual" }
        }
      }
    },
    {
      "op": "add",
      "row": {
        "kind": "claim",
        "scope": { "collections": ["example"] },
        "identity": { "claim_key": "example|exists" },
        "claim": {
          "statement": "Example exists.",
          "atomic": true
        },
        "time": { "precision": "unknown" },
        "provenance": {
          "evidence": [
            {
              "source_id": "$source",
              "role": "supports",
              "summary": "The source exists."
            }
          ]
        },
        "assessment": { "confidence": "high" }
      }
    }
  ]
}
```

Interface responsibilities:

- Accept an `ApplyRequest`.
- Open a ledger write transaction.
- Validate the locked snapshot before accepting operations.
- Validate all operations against the locked snapshot.
- Resolve intra-batch references such as `$op0`.
- Complete draft rows through the contract module using actor, time, and ID allocator inputs.
- Build all change rows for lifecycle operations.
- Run novelty and dedupe checks when requested.
- Validate the complete candidate ledger.
- Return rows to append through the ledger transaction.
- Tell the projection module to rebuild eager indexes after a successful write when configured.
- Return an `ApplyResult` with created IDs, skipped operations, warnings, and novelty classifications.

`knb apply` is atomic by default. If any operation fails inside the write transaction, no operation writes. Apply must not validate against one ledger snapshot and append against another.

Reference resolution is structural. Apply resolves `$op<N>` and `$<as>` only in known reference fields:

- `provenance.source_ids[]`
- `provenance.evidence[].source_id`
- `relations[].target_id`
- `synthesis.basis.claim_ids[]`
- `synthesis.basis.question_ids[]`
- `synthesis.basis.source_ids[]`
- `question.answer_claim_id`

Apply must not blindly string-replace arbitrary row fields.

When `dedupe` skips a duplicate claim that later operations reference, apply resolves that reference to the matched active canonical row only when novelty returns exactly one unambiguous match. If no match or multiple matches exist, apply fails the whole batch with `duplicate_blocked`.

Result shape:

```ts
type ApplyResult = {
  created: Array<{ op: number; as?: string; id: string; kind: KnbRowKind }>;
  skipped: Array<{ op: number; reason: string }>;
  warnings: string[];
  novelty: Array<{ op: number; classification: string; matched_ids: string[] }>;
};
```

Single-row append is a convenience wrapper:

```text
knb add --kind claim ...
```

`knb add` builds a one-operation `ApplyRequest` and calls the same apply module. It must not have its own validation or write path.

Lock behavior:

```text
0  write completed
6  lock busy
```

The ledger module may support `--wait-lock <ms>` later, but the base behavior should fail fast.

## Row Identity

Apply generates IDs for draft rows that omit `id`. Provided IDs are preserved after validation.

Generated IDs use this shape:

```text
<kind-prefix>:<scope-slug>:<YYYYMMDD>:<random8>
```

Kind prefixes:

```text
source     src
claim      claim
question   q
synthesis  synth
change     chg
```

`scope-slug` comes from the first collection, subject, or tag in that order. If the scope cannot provide a slug, validation fails before ID generation. `random8` is lowercase base36. If a generated ID collides with the current ledger or the candidate batch, apply retries before failing with a conflict.

## Effective State Module

The effective state module is the read-side projection. `get`, `query`, `context`, `render`, `check`, and `index` should all use it.

Projection algorithm:

1. Read rows in ledger order.
2. Build an ID map.
3. Initialize each valid row as `active`.
4. Mark rows with intrinsic archived status as `archived`; V1 treats `question.status === "archived"` and `synthesis.status === "archived"` as intrinsic archives.
5. Apply `change` rows in order.
6. Mark retracted, superseded, and merged rows inactive.
7. Add relation changes to the effective relation graph.
8. Record `patch` changes as audit history without mutating target row content.
9. Preserve enough history to explain why a row is inactive.

Effective statuses:

```text
active
retracted
superseded
duplicate
archived
invalid
```

Interface responsibilities:

- Return active rows by default.
- Return inactive rows only when asked for history.
- Return the effective status for any row ID.
- Return explanation data for `get --explain`.
- Return the effective relation graph.
- Return projection warnings for invalid, dangling, or contradictory change rows.
- Warn when lifecycle changes target already inactive rows.
- Warn when relation changes point at missing endpoints.

Suggested interface:

```ts
type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(options?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  explain(id: string): StateExplanation | undefined;
  relationGraph(): RelationGraph;
  warnings: StateWarning[];
};
```

The raw row is not the current state. Current state is the row plus later `change` rows.

Normal reads hide `change` rows unless the caller requests history or explicitly asks for `kind=change`. Operational rows remain queryable for audit.

## Read Snapshot Module

The read snapshot module is the read-side counterpart to apply. It concentrates the load, validate, project, and freshness sequence that many commands need.

Interface responsibilities:

- Load the ledger through the ledger module.
- Validate rows through the contract module.
- Build effective state through the state module only when contract validation has no errors.
- Collect projection freshness through the projection module.
- Return partial results when the ledger has parse or validation errors.
- Expose one `KnbReadSnapshot` for `status`, `check`, `get`, `query`, `context`, `render`, and `index`.

Suggested interface:

```ts
type KnbReadSnapshot = {
  ledger: LedgerSnapshot;
  fingerprint: LedgerFingerprint;
  validation: ValidationResult;
  state?: EffectiveState;
  projectionFreshness: ProjectionFreshness;
};
```

Callers should not independently repeat ledger loading, validation, state projection, or freshness checks. If a read command needs one of those details, it asks the read snapshot.

Snapshot validity levels:

```text
loaded      ledger bytes were read, but parse or validation errors may exist
validated   ledger parsed and contract validation had no errors
projected   effective state was built from a validated ledger
```

`status` and `check` may use a `loaded` snapshot. `get`, `query`, `context`, `render`, and `index` require `projected`; if the snapshot cannot project, they fail with `validation_failed` or `broken_reference`. Status fields derived from effective state should be `unknown` when the snapshot is not projected.

Validation warnings do not block projection. The read snapshot should build `EffectiveState` when there are no parse or validation errors, carry warnings forward, and surface them through `status`, `check`, and `context`.

## Contract Module

Agents need `knb schema` to learn the contract without reading docs. That only works if TypeScript types, JSON Schema, examples, samples, and validation stay in one contract.

The contract module should be the single seam for row and operation contracts.

Interface responsibilities:

- Export row-kind and operation-kind lists.
- Validate row shapes and operation batch shapes.
- Validate cross-row references against supplied row maps.
- Complete draft rows with supplied actor, clock, and ID-generator inputs.
- Return normalized rows and operations without mutating caller input.
- Produce JSON Schema.
- Produce row samples.
- Produce apply-operation samples.
- Explain validation errors with stable paths.

Validation issues use stable machine-readable fields:

```ts
type ValidationIssue = {
  level: "error" | "warning";
  code?: string;
  message: string;
  path?: string;
  line?: number;
  id?: string;
};
```

Source of truth:

Use TypeScript constants and validator rules as the source of truth for v1. Generate or update `knb/schema.json` from that contract once the module exists. Until then, code changes must update TypeScript, validator behavior, tests, and `knb/schema.json` together.

After `core/contract.ts` exists, do not hand-edit `knb/schema.json`. Update the contract and regenerate the schema. A schema sync test must fail when `contract.jsonSchema()` and `knb/schema.json` diverge.

The contract module must not read files, inspect the workspace, choose clocks, or allocate randomness itself. Apply supplies actor, time, ID-generator inputs, and row maps; contract applies the row rules.

## CLI Surface

The base command set is:

```text
init       create config and storage
status     print a compact state summary
schema     print row and operation contracts
apply      apply many append/change operations
add        convenience wrapper for one row
get        fetch rows by ID
query      retrieve matching rows
context    build a compact research packet
novelty    classify candidate claims
render     generate disposable views
check      validate ledger health
index      rebuild or inspect generated indexes
```

The primary write command is `knb apply`. The primary read command is `knb context`.

V1 command cutover:

```text
validate  replaced by check
append    replaced by apply and add
```

`query` and `render` remain, but they must call the public library and use effective state. `render --json` reports render metadata; it does not print human text in JSON mode.

Agents should be able to run this loop:

```bash
knb status --json
knb context --collection <collection> --max-tokens 3000 --json
knb novelty --stdin --json < candidate-claims.json
knb apply --stdin --atomic --dedupe --json < ops.json
knb check --json
knb render --collection <collection> --format md --out knb/views/<collection>.md --json
```

## Status Capability

`knb status` gives agents a cheap orientation packet before they spend tokens on context or writes. It should summarize the read snapshot.

Default status fields:

```text
workspace_root
ledger_path
schema_version
actor
row_count
parse_error_count
validation_error_count
state_warning_count
active_counts_by_kind
inactive_counts_by_status
projection_freshness
```

Status should avoid returning full rows. If the ledger is broken, status still returns the workspace and ledger metadata it can compute, plus typed errors for the output module to render.

## Check Capability

`knb check` is the health command for the ledger. It should inspect the read snapshot rather than owning separate validation rules.

It reports:

- JSONL parse issues with line numbers.
- Row contract violations with stable paths.
- Duplicate IDs.
- Broken source, basis, relation, and change references.
- Projection warnings from effective state.
- Generated-view and generated-index staleness.

`check` returns success only when the ledger can be loaded, validated, and projected without errors. Warnings may still return success unless the caller sets a stricter mode later.

## Output And Error Module

Commands should return structured command results. They should not print directly.

The error module owns stable error codes and maps domain failures to exit codes. Core modules must return or throw typed errors; the CLI must not inspect message text.

Core error shape:

```ts
type KnbError = {
  code: KnbErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};
```

Examples:

```text
invalid_arguments
validation_failed
duplicate_blocked
lock_busy
io_failed
broken_reference
unsafe_operation_refused
internal_error
```

The output and error module owns:

- TTY detection.
- `--json`, `--text`, `--pretty`, `--ndjson`, and `--quiet`.
- stdout versus stderr behavior.
- Success envelopes.
- Error envelopes.
- Exit-code mapping.
- Human text rendering.

TTY output defaults to human text. Piped output defaults to compact JSON.

Every command returns a `CommandResult` to the CLI adapter. Only the output module writes to stdout or stderr.

Library methods return domain results such as `ApplyResult`, `QueryResult`, and `ContextResult`. They do not return `CommandResult` and do not know whether the caller is a TTY.

```ts
type CommandResult<T = unknown> = {
  ok: true;
  command: string;
  data: T;
  meta: CommandMeta;
} | {
  ok: false;
  command?: string;
  error: CommandError;
  meta: CommandMeta & { exit_code: number };
};
```

Success envelope:

```json
{
  "ok": true,
  "command": "query",
  "data": {},
  "meta": {
    "ledger": "knb/ledger.jsonl",
    "elapsed_ms": 18,
    "rows_read": 1284
  }
}
```

Error envelope:

```json
{
  "ok": false,
  "error": {
    "code": "validation_failed",
    "message": "claim rows require provenance.evidence[].source_id",
    "details": {
      "path": "ops[2].row.provenance.evidence"
    }
  },
  "meta": {
    "exit_code": 3
  }
}
```

Exit codes:

```text
0   success
1   not found or no matches
2   invalid arguments
3   validation failed
4   conflict or duplicate blocked
5   filesystem or IO error
6   lock busy
7   broken reference or graph integrity error
8   external dependency failure
9   unsafe operation refused
10  internal error
```

## Query And Context Modules

`query` and `context` share data, but they do different jobs.

Both modules accept `EffectiveState` from the read snapshot as input. They do not load ledgers, validate row contracts, or apply lifecycle changes themselves.

The query module returns matching rows. It should:

1. Filter by collection, subject, tag, kind, and time.
2. Search exact IDs first.
3. Search exact `identity.claim_key` values second.
4. Search normalized text fields:
   - `claim.statement`
   - `source.title`
   - `question.text`
   - `synthesis.title`
   - `synthesis.summary`
5. Score with deterministic lexical matching.
6. Return compact rows unless `--full` is set.

The context module builds a research packet. It should:

1. Read effective state.
2. Filter active rows by collection, subject, and tag.
3. Select active syntheses by importance, recency, and basis depth.
4. Select active claims by importance, confidence, information depth, evidence depth, and contested status.
5. Select open questions by priority, importance, and recency.
6. Include sources cited by selected claims and syntheses.
7. Estimate tokens deterministically with `ceil(chars / 4)` by default.
8. Respect `--max-tokens` by dropping lower-value details first.

`context` is not filtered `query`. It is a briefing module with its own interface and tests.

When a context packet is over budget, drop details in this order:

1. Source metadata details.
2. Low-importance claims.
3. Low-priority questions.
4. Lower-ranked syntheses.

Context should surface information gaps, contested claims, thin evidence, stale projections, and open questions. It should not only retrieve related rows.

Default `query` fields:

```text
id
kind
score
statement/title/text
confidence
source_ids
time.valid_at or time.occurred_at
```

Default `context` fields:

```text
summary
key_claims
open_questions
sources
warnings
token_estimate
```

## Novelty Module

The novelty module provides deterministic claim comparison. It is shared by the `novelty` command and `apply --dedupe`; callers should not implement their own dedupe checks.

Interface responsibilities:

- Accept candidate claim drafts or completed claim rows.
- Compare against active claims from `EffectiveState`.
- Match exact `identity.claim_key` first.
- Match exact `identity.dedupe_hash` second.
- Compare normalized claim statements lexically.
- Use structured evidence and relation signals, including evidence roles such as `supports` and `contradicts`, relation `contradicts`, and explicit correction or novelty metadata.
- Classify candidates as `new`, `duplicate`, `corroboration`, `update`, `contradiction`, or `correction`.
- Return matched row IDs and reasons for each classification.

The novelty module is deterministic and local. It does not use embeddings, network calls, LLM calls, or semantic search in v1. `contradiction` and `correction` require explicit structured signals, such as matching claim keys plus candidate metadata, evidence roles, or relation data. The module should classify conservatively when structured signals are absent.

Classification policy:

- `duplicate`: the candidate adds no material statement, time, evidence, or assessment.
- `corroboration`: the statement or key matches, but the source or evidence is materially new.
- `update`: the same key or thread has a newer time, changed value, or changed assessment.
- `contradiction`: explicit structured contradiction signals exist.
- `correction`: explicit correction metadata or relation exists.
- `new`: no meaningful active match exists.

Apply integration policy:

- Skip `duplicate` claims when `dedupe` is enabled.
- Allow `corroboration`, `update`, `contradiction`, `correction`, and `new` claims by default.
- Report every novelty classification in `ApplyResult`.
- Resolve references to skipped duplicates only under the single-match rule in the apply module.

## Projection Module

The projection module owns disposable outputs derived from effective state. It is the seam behind `render`, `index`, status freshness, and check freshness warnings.

Interface responsibilities:

- Render collection views from `EffectiveState`.
- Rebuild generated indexes from `EffectiveState`.
- Write only under workspace view and index paths.
- Record disposable projection metadata.
- Compare projection metadata with the current ledger fingerprint.
- Report fresh, stale, missing, and unknown projection states.

Projection metadata lives with generated outputs, not in the canonical ledger. It can be deleted and rebuilt.

For V1, projection paths must stay under workspace-managed view and index directories. If `--out` points outside those directories, reject the request unless a later design explicitly allows external writes.

Suggested metadata shape:

```json
{
  "schema_version": "knb.projection.v1",
  "kind": "view",
  "target": "knb/views/example.md",
  "ledger": {
    "path": "knb/ledger.jsonl",
    "rows": 42,
    "last_row_id": "claim:example:20260501:9x8y7z6w",
    "content_hash": "sha256:..."
  },
  "options": {
    "collection": "example",
    "format": "md"
  },
  "generated_at": "2026-05-01T12:00:00Z"
}
```

Use `LedgerFingerprint` for freshness checks. File mtimes can be displayed as diagnostics, but they are not the source of truth. Apply does not need to mark existing projections stale; a new ledger fingerprint makes old projection metadata stale automatically.

V1 indexes are deterministic and disposable:

- Active rows by ID.
- Active rows by collection.
- Active claims by `identity.claim_key`.
- Active sources by URI or content hash when present.

## Library Seam

The CLI wraps a reusable TypeScript library.

The package should expose the library entry point explicitly. Host applications should not import from command modules or internal file paths.

Suggested package shape:

```json
{
  "name": "knb",
  "bin": {
    "knb": "./src/cli.ts"
  },
  "scripts": {
    "knb": "bun run src/cli.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "exports": {
    ".": "./src/index.ts"
  }
}
```

Suggested structure:

```text
src/
  cli.ts
  index.ts
  core/
    knb.ts
    workspace.ts
    ledger.ts
    contract.ts
    apply.ts
    state.ts
    read-snapshot.ts
    query.ts
    context.ts
    novelty.ts
    projections.ts
    output.ts
    errors.ts
```

Do not add pass-through files only to match this tree. The tree names the intended seams; the deletion test decides whether a file should exist.

Public library shape:

```ts
function openKnb(options?: OpenKnbOptions): Promise<Knb>;

type OpenKnbOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  actor?: string;
  runtime?: Partial<KnbRuntime>;
};

type Knb = {
  workspace: KnbWorkspace;
  status(): Promise<KnbStatus>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  get(ids: string[], options?: GetOptions): Promise<GetResult>;
  query(request: QueryRequest): Promise<QueryResult>;
  context(request: ContextRequest): Promise<ContextResult>;
  novelty(request: NoveltyRequest): Promise<NoveltyResult>;
  render(request: RenderRequest): Promise<RenderResult>;
  check(request?: CheckRequest): Promise<CheckResult>;
  rebuildIndex(): Promise<IndexResult>;
};
```

The `Knb` facade composes workspace, ledger, contract, state, read snapshot, apply, query, context, projection, and output-independent result mapping. CLI command handlers and host applications call the facade instead of importing core modules directly.

The CLI adapter should be boring:

```text
parse args -> open workspace -> call library -> render command result
```

## Testing Strategy

Test through module interfaces:

- Workspace tests cover config precedence, path normalization, and actor resolution.
- Contract tests cover row samples, operation samples, JSON Schema, schema sync, duplicate IDs, cross-row references, and validation errors.
- Ledger tests cover empty and missing ledgers, defensive JSONL loading, line-numbered parse errors, fingerprint changes, locked write transactions, lock contention, callback failure, and flush behavior.
- Apply tests cover atomic writes, lock contention, allowed reference paths, forward-reference rejection, generated IDs, collision retry, lifecycle operations, scope derivation, dedupe, skipped duplicate references, and failed validation.
- Effective state tests cover active rows, archived rows, retraction, supersession, merge, relation changes, patch audit history, inactive explanations, hidden change rows, and dangling-change warnings.
- Read snapshot tests cover partial snapshots, validation summaries, effective state inclusion, and projection freshness.
- Query tests cover exact ID matches, claim-key matches, normalized text matches, filters, active/history behavior, and compact/full output.
- Get tests cover active rows, hidden inactive rows, history mode, and explanations.
- Novelty tests cover claim-key matches, dedupe-hash matches, normalized statement matches, corroboration, explicit contradiction, conservative classification, and dedupe blocking.
- Projection tests cover deterministic render output, index rebuilds, metadata, stale detection, and workspace path constraints.
- Output tests cover JSON envelopes, human text, stderr, and exit codes.
- Context tests cover ranking, source inclusion, warnings, information gaps, and token-budget truncation.
- Facade tests cover the same flow agents use: `init`, `status`, `schema`, `apply`, `check`, `context`, `novelty`, `render`, and `index` against a temporary workspace.

Avoid tests that pin private helper behavior. If a helper needs direct tests, first ask whether it is a real module seam or only an internal implementation detail.

## Implementation Order

1. Lock the current baseline with `bun test` and `bun run typecheck`.
2. Extract `contract.ts`; move row constants, row types, validation, schema, samples, and stable validation issues.
3. Add apply operation contract types and validation.
4. Add `errors.ts` and stable exit-code mapping.
5. Add `output.ts` and command result envelopes.
6. Add `workspace.ts` for path, config, and actor resolution.
7. Add `ledger.ts` with defensive JSONL loading, fingerprints, locks, and append transactions.
8. Add `index.ts`, `core/knb.ts`, `openKnb`, runtime injection, and the package export.
9. Add `read-snapshot.ts` to centralize load, validate, project, and freshness.
10. Add `init`, `status`, `schema`, and `check`.
11. Replace `effectiveRows` with `state.ts`.
12. Add `apply.ts` and route `add` through the same module.
13. Add `get`.
14. Replace prototype query internals with `query.ts`.
15. Add `context.ts` as a separate research-packet module.
16. Add `novelty.ts` and wire `apply --dedupe` through it.
17. Add `projections.ts`, render metadata, freshness checks, and indexes.
18. Cut over the CLI to `parse args -> openKnb -> facade method -> output.render`.
19. Remove public `validate` and `append`.
20. Remove broad helper imports from `src/knb.ts`; delete the file if no temporary private wrapper remains.
21. Update public docs, agent examples, package exports, and the full agent-loop facade test.

## Deferred Features

Keep these out of v1:

- `knb serve --stdio`
- semantic search
- source extraction
- synthesis generation
- source fetch/cache
- domain packs
- git-aware writes
- hooks
- web dashboard
- source intelligence plugins

```

File: /Users/jaredsmith/Projects-ultra/knb/docs/library-usage.md
```md
# Library Usage

`knb` is a TypeScript library first; the CLI is one of several adapters built on top. Host applications and tests should import `openKnb` from the package root. Do not import from `src/core/*` directly.

## Opening a workspace

```ts
import { openKnb } from "knb";

const knb = await openKnb({
  root: process.cwd(),     // optional; defaults to cwd / KNB_ROOT
  actor: "alice@example",  // optional; defaults to git/system/unknown
});
```

`openKnb` resolves the workspace (`.knb/config.json`, `knb/ledger.jsonl`), the acting identity, and runtime adapters. Pass `runtime: { clock, randomIdPart }` to inject deterministic time and IDs for tests.

## Facade methods

Each method returns a typed domain result. None of them know about TTYs or JSON envelopes; that is the CLI's job.

### `init(options?)`

Create config, ledger, schema, and projection directories. Idempotent unless `force: true`.

```ts
await knb.init();
```

### `status()`

Cheap orientation packet: workspace path, ledger path, row counts, parse/validation/state-warning counts, projection freshness.

```ts
const status = await knb.status();
console.log(status.row_count, status.active_counts_by_kind);
```

### `schema()`

Return the `knb.v1` JSON Schema, row samples, and apply-operation samples. Useful for agents that want to learn the contract without reading docs.

```ts
const { json_schema, row_samples, operation_samples } = await knb.schema();
```

### `apply(request)`

Primary write. Atomic by default; rejects forward references, unresolved IDs, and validation failures before touching the ledger.

```ts
await knb.apply({
  operations: [
    { op: "add", as: "src", row: { kind: "source", scope: { collections: ["x"] }, source: { type: "web_page", title: "T", uri: "https://x" }, provenance: { acquisition: { method: "manual" } } } },
    { op: "add", row: { kind: "claim", scope: { collections: ["x"] }, claim: { statement: "X is true.", atomic: true }, time: { precision: "unknown" }, provenance: { evidence: [{ source_id: "$src", role: "supports", summary: "stated" }] }, assessment: { confidence: "medium" } } },
  ],
  dedupe: true,
});
```

### `add(row)`

Convenience wrapper for one `add` operation. Identical envelope to `apply`.

```ts
await knb.add({
  kind: "question",
  scope: { collections: ["x"] },
  question: { text: "Is X always true?", status: "open" },
});
```

### `get(ids, options?)`

Fetch full rows by ID. Active-only by default; pass `{ includeHistory: true }` to see inactive rows or `{ explain: true }` to see lifecycle reasons.

```ts
const result = await knb.get(["claim:x:20260501:abc12345"], { explain: true });
```

### `query(request)`

Deterministic retrieval over effective state. Filter by `kind`, `collection`, `subject`, `tag`, `text`, `claimKey`, `claimType`, `externalRefs`, etc.

```ts
const result = await knb.query({
  kind: "claim",
  collection: "x",
  claimKey: "topic|fact",
  externalRefs: [{ system: "x", id: "123" }],
  limit: 20,
});
```

### `context(request)`

Build a token-budgeted research packet (syntheses, key claims, open questions, sources, warnings). Drops lower-value details first when over budget.

```ts
const ctx = await knb.context({
  collection: "x",
  maxTokens: 3000,
  includeWarnings: true,
  recencyWindowDays: 30,
  scoringProfile: {
    weights: { importance: { high: 3, medium: 2, low: 1, unknown: 0 } },
  },
});
```

### `novelty(request)`

Classify candidate claims against active claims as `new`, `duplicate`, `corroboration`, `update`, `contradiction`, or `correction`. No writes. Same module powers `apply --dedupe`.

```ts
const { results } = await knb.novelty({
  candidates: [
    { claim: { statement: "X is true.", atomic: true }, scope: { collections: ["x"] } },
  ],
});
```

A candidate is a `Partial<ClaimRow>`: the statement lives at `candidate.claim.statement`, not at the top level. Provide `identity.claim_key` to anchor key-based matches (`duplicate`/`corroboration`), or `identity.dedupe_hash` for hash-based matches.

## Request naming

Public TypeScript facade request fields are camelCase. CLI flags are kebab-case and ledger/schema fields remain snake_case. For example, call `knb.query({ claimKey })`, pass `--claim-key` on the CLI, and persist `identity.claim_key` in ledger rows.

### `render(request)`

Generate a Markdown view for one collection. Writes the view and a sidecar metadata file under `knb/views/`.

```ts
await knb.render({ collection: "x", format: "md" });
```

### `check()`

Health report: parse issues, validation issues, state warnings, projection freshness. The CLI maps this onto exit codes; the library returns the structured report.

```ts
const report = await knb.check();
```

### `rebuildIndex()`

Rebuild the V1 disposable indexes (active by ID, by collection, claim keys, source URIs/hashes) from current effective state.

```ts
await knb.rebuildIndex();
```

## Why the facade is the test surface

The CLI is intentionally boring: `parse args -> openKnb -> facade method -> output.render`. Tests should exercise the same seams. If you need behavior that is not on the facade, add it to the facade rather than reaching into `src/core/*`.

See [ARCHITECTURE.md](../ARCHITECTURE.md) for the module map and naming rules, and [docs/design/agent-first-cli.md](design/agent-first-cli.md) for the full command contracts.

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/output.ts
```ts
// Output module - V1 command result envelopes, rendering, TTY/JSON detection,
// exit-code mapping, and stdout/stderr routing. Commands return CommandResult
// values; only this module writes to stdout or stderr.

import { exitCodeForError, type KnbError, type KnbErrorCode } from "./errors";

export type CommandMeta = {
  ledger?: string;
  elapsed_ms?: number;
  rows_read?: number;
  rows_appended?: number;
  rows_returned?: number;
  exit_code?: number;
  [key: string]: unknown;
};

export type CommandError = {
  code: KnbErrorCode;
  message: string;
  details?: Record<string, unknown>;
};

export type CommandResult<T = unknown> =
  | { ok: true; command: string; data: T; meta: CommandMeta }
  | { ok: false; command?: string; error: CommandError; meta: CommandMeta & { exit_code: number } };

export type OutputFormat = "auto" | "json" | "text" | "pretty" | "ndjson" | "quiet";

export type OutputSink = {
  write: (chunk: string | Uint8Array) => unknown;
};

export type OutputOptions = {
  format?: OutputFormat;
  isTty?: boolean;
  stdout?: OutputSink;
  stderr?: OutputSink;
};

export function success<T>(command: string, data: T, meta: CommandMeta = {}): CommandResult<T> {
  return { ok: true, command, data, meta };
}

export function failure(
  command: string | undefined,
  error: KnbError,
  meta: CommandMeta = {},
): CommandResult {
  const exit_code = meta.exit_code ?? exitCodeForError(error.code);
  const errorEnvelope: CommandError = { code: error.code, message: error.message };
  if (error.details !== undefined) errorEnvelope.details = error.details;
  const result: CommandResult = {
    ok: false,
    error: errorEnvelope,
    meta: { ...meta, exit_code },
  };
  if (command !== undefined) result.command = command;
  return result;
}

function resolveFormat(options: OutputOptions | undefined): { format: OutputFormat; isTty: boolean } {
  const explicit = options?.format ?? "auto";
  const isTty = options?.isTty ?? Boolean((process.stdout as { isTTY?: boolean }).isTTY);
  if (explicit !== "auto") return { format: explicit, isTty };
  return { format: isTty ? "text" : "json", isTty };
}

function envelopeJson(result: CommandResult): unknown {
  if (result.ok) {
    return { ok: true, command: result.command, data: result.data, meta: result.meta };
  }
  const out: Record<string, unknown> = { ok: false };
  if (result.command !== undefined) out.command = result.command;
  out.error = result.error;
  out.meta = result.meta;
  return out;
}

export function renderJson(result: CommandResult): string {
  return JSON.stringify(envelopeJson(result));
}

export function renderPrettyJson(result: CommandResult): string {
  return JSON.stringify(envelopeJson(result), null, 2);
}

// Ndjson rule: when data is an array, emit one JSON line per element (each line
// is the raw row, not an envelope) followed by one envelope line carrying meta.
// For non-array data or any error envelope, emit a single envelope line.
export function renderNdjson(result: CommandResult): string {
  if (result.ok && Array.isArray(result.data)) {
    const lines = result.data.map((item) => JSON.stringify(item));
    lines.push(JSON.stringify(envelopeJson(result)));
    return `${lines.join("\n")}\n`;
  }
  return `${JSON.stringify(envelopeJson(result))}\n`;
}

export function renderHumanText(result: CommandResult): string {
  if (result.ok) {
    const data = result.data;
    if (data === null || data === undefined) return "OK\n";
    if (typeof data === "string") return `${data}\n`;
    if (Array.isArray(data)) {
      if (data.length === 0) return "OK (0 rows)\n";
      const lines = data.map((item) => formatHumanItem(item));
      return `${lines.join("\n")}\n`;
    }
    if (typeof data === "object") {
      return `${formatHumanItem(data)}\n`;
    }
    return `${String(data)}\n`;
  }
  const detailSegment =
    result.error.details && Object.keys(result.error.details).length > 0
      ? ` ${JSON.stringify(result.error.details)}`
      : "";
  return `${result.error.code}: ${result.error.message}${detailSegment}\n`;
}

function formatHumanItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item === null || item === undefined) return "";
  if (typeof item !== "object") return String(item);
  const runLog = asRunLogResult(item);
  if (runLog) return formatRunLog(runLog.entries);
  const collections = asCollectionsResult(item);
  if (collections) return formatCollections(collections.collections);
  const candidate = item as { id?: unknown; kind?: unknown };
  const id = typeof candidate.id === "string" ? candidate.id : undefined;
  const kind = typeof candidate.kind === "string" ? candidate.kind : undefined;
  const text = humanRowText(item);
  const parts = [id, kind, text].filter((value): value is string => typeof value === "string" && value.length > 0);
  if (parts.length > 0) return parts.join("\t");
  return JSON.stringify(item);
}

function humanRowText(item: unknown): string | undefined {
  if (item === null || typeof item !== "object") return undefined;
  const row = item as {
    kind?: unknown;
    source?: { title?: unknown };
    claim?: { statement?: unknown };
    question?: { text?: unknown };
    synthesis?: { title?: unknown };
  };
  if (row.kind === "source" && typeof row.source?.title === "string") return row.source.title;
  if (row.kind === "claim" && typeof row.claim?.statement === "string") return row.claim.statement;
  if (row.kind === "question" && typeof row.question?.text === "string") return row.question.text;
  if (row.kind === "synthesis" && typeof row.synthesis?.title === "string") return row.synthesis.title;
  return undefined;
}

type HumanRunLogEntry = {
  run_id: string;
  actor: string;
  intent?: string;
  completed_at: string;
  rows_appended: number;
};

function asRunLogResult(item: unknown): { entries: HumanRunLogEntry[] } | undefined {
  if (item === null || typeof item !== "object" || Array.isArray(item)) return undefined;
  const entries = (item as { entries?: unknown }).entries;
  if (!Array.isArray(entries)) return undefined;
  const parsed: HumanRunLogEntry[] = [];
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const candidate = entry as {
      run_id?: unknown;
      actor?: unknown;
      intent?: unknown;
      completed_at?: unknown;
      rows_appended?: unknown;
    };
    if (
      typeof candidate.run_id !== "string" ||
      typeof candidate.actor !== "string" ||
      typeof candidate.completed_at !== "string" ||
      typeof candidate.rows_appended !== "number"
    ) {
      return undefined;
    }
    const parsedEntry: HumanRunLogEntry = {
      run_id: candidate.run_id,
      actor: candidate.actor,
      completed_at: candidate.completed_at,
      rows_appended: candidate.rows_appended,
    };
    if (typeof candidate.intent === "string") parsedEntry.intent = candidate.intent;
    parsed.push(parsedEntry);
  }
  return { entries: parsed };
}

function formatRunLog(entries: HumanRunLogEntry[]): string {
  if (entries.length === 0) return "OK (0 runs)";
  const lines = ["completed_at\tactor\trows\trun_id\tintent"];
  for (const entry of entries) {
    lines.push([
      entry.completed_at,
      entry.actor,
      String(entry.rows_appended),
      entry.run_id,
      entry.intent ?? "",
    ].join("\t"));
  }
  return lines.join("\n");
}

type HumanCollectionEntry = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  latest_created_at?: string;
};

function asCollectionsResult(item: unknown): { collections: HumanCollectionEntry[] } | undefined {
  if (item === null || typeof item !== "object" || Array.isArray(item)) return undefined;
  const entries = (item as { collections?: unknown }).collections;
  if (!Array.isArray(entries)) return undefined;
  const parsed: HumanCollectionEntry[] = [];
  for (const entry of entries) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return undefined;
    const candidate = entry as {
      collection?: unknown;
      active_counts_by_kind?: unknown;
      latest_created_at?: unknown;
    };
    if (
      typeof candidate.collection !== "string" ||
      candidate.active_counts_by_kind === null ||
      typeof candidate.active_counts_by_kind !== "object" ||
      Array.isArray(candidate.active_counts_by_kind)
    ) {
      return undefined;
    }
    const parsedEntry: HumanCollectionEntry = {
      collection: candidate.collection,
      active_counts_by_kind: candidate.active_counts_by_kind as Record<string, number>,
    };
    if (typeof candidate.latest_created_at === "string") parsedEntry.latest_created_at = candidate.latest_created_at;
    parsed.push(parsedEntry);
  }
  return { collections: parsed };
}

function formatCollections(collections: HumanCollectionEntry[]): string {
  if (collections.length === 0) return "OK (0 collections)";
  const kinds = ["source", "claim", "question", "synthesis", "change"] as const;
  const lines = [`collection\t${kinds.join("\t")}\tlatest_created_at`];
  for (const entry of collections) {
    const counts = kinds.map((kind) => String(entry.active_counts_by_kind[kind] ?? 0));
    lines.push([entry.collection, ...counts, entry.latest_created_at ?? ""].join("\t"));
  }
  return lines.join("\n");
}

export function render(
  result: CommandResult,
  options: OutputOptions = {},
): { exitCode: number } {
  const { format } = resolveFormat(options);
  const stdout = options.stdout ?? process.stdout;
  const stderr = options.stderr ?? process.stderr;
  const exitCode = result.ok ? 0 : result.meta.exit_code;

  if (format === "quiet") {
    if (!result.ok) stderr.write(`${result.error.code}\n`);
    return { exitCode };
  }

  const target = result.ok ? stdout : stderr;

  switch (format) {
    case "json":
      target.write(`${renderJson(result)}\n`);
      break;
    case "pretty":
      target.write(`${renderPrettyJson(result)}\n`);
      break;
    case "ndjson":
      target.write(renderNdjson(result));
      break;
    case "text":
      target.write(renderHumanText(result));
      break;
    default:
      target.write(renderHumanText(result));
      break;
  }

  return { exitCode };
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/errors.ts
```ts
// Errors module - V1 typed-error vocabulary and exit-code mapping.
// Domain failures travel as KnbError values so the output module and CLI adapter
// never inspect message text.

export type KnbErrorCode =
  | "invalid_arguments"
  | "validation_failed"
  | "duplicate_blocked"
  | "lock_busy"
  | "io_failed"
  | "broken_reference"
  | "unsafe_operation_refused"
  | "external_dependency_failed"
  | "internal_error"
  | "not_found";

export type KnbError = {
  code: KnbErrorCode;
  message: string;
  details?: Record<string, unknown>;
  cause?: unknown;
};

const EXIT_CODES: Record<KnbErrorCode, number> = {
  not_found: 1,
  invalid_arguments: 2,
  validation_failed: 3,
  duplicate_blocked: 4,
  io_failed: 5,
  lock_busy: 6,
  broken_reference: 7,
  external_dependency_failed: 8,
  unsafe_operation_refused: 9,
  internal_error: 10,
};

const KNB_ERROR_BRAND: unique symbol = Symbol.for("knb.error");

export class KnbErrorBase extends Error implements KnbError {
  readonly code: KnbErrorCode;
  override readonly message: string;
  readonly details?: Record<string, unknown>;
  override readonly cause?: unknown;
  readonly [KNB_ERROR_BRAND] = true as const;

  constructor(code: KnbErrorCode, message: string, details?: Record<string, unknown>, cause?: unknown) {
    super(message);
    this.name = "KnbError";
    this.code = code;
    this.message = message;
    if (details !== undefined) this.details = details;
    if (cause !== undefined) this.cause = cause;
  }

  toJSON(): KnbError {
    const json: KnbError = { code: this.code, message: this.message };
    if (this.details !== undefined) json.details = this.details;
    return json;
  }
}

export function knbError(
  code: KnbErrorCode,
  message: string,
  details?: Record<string, unknown>,
  cause?: unknown,
): KnbErrorBase {
  return new KnbErrorBase(code, message, details, cause);
}

export function isKnbError(value: unknown): value is KnbError {
  if (value === null || typeof value !== "object") return false;
  if ((value as { [KNB_ERROR_BRAND]?: unknown })[KNB_ERROR_BRAND] === true) return true;
  const candidate = value as { code?: unknown; message?: unknown };
  if (typeof candidate.code !== "string" || typeof candidate.message !== "string") return false;
  return candidate.code in EXIT_CODES;
}

export function exitCodeForError(error: KnbError | KnbErrorCode): number {
  const code = typeof error === "string" ? error : error.code;
  return EXIT_CODES[code] ?? EXIT_CODES.internal_error;
}

export function fromUnknown(error: unknown): KnbErrorBase {
  if (error instanceof KnbErrorBase) return error;
  if (isKnbError(error)) {
    return new KnbErrorBase(
      error.code,
      error.message,
      error.details,
      (error as { cause?: unknown }).cause,
    );
  }
  if (error instanceof Error) {
    return new KnbErrorBase("internal_error", error.message, undefined, error);
  }
  if (typeof error === "string") {
    return new KnbErrorBase("internal_error", error);
  }
  return new KnbErrorBase("internal_error", "Unknown error", undefined, error);
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/run-manifests.ts
```ts
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export type RunManifest = {
  schema_version: "knb.run.v1";
  run_id: string;
  actor: string;
  intent?: string;
  started_at: string;
  completed_at: string;
  rows_appended: number;
  row_ids: string[];
};

export type RunManifestWorkspace = {
  paths: {
    lock: string;
    runs?: string;
  };
};

export function runsDirFor(workspace: RunManifestWorkspace): string {
  return workspace.paths.runs ?? join(dirname(workspace.paths.lock), "runs");
}

export async function writeRunManifest(
  workspace: RunManifestWorkspace,
  manifest: RunManifest,
): Promise<string> {
  const runsDir = runsDirFor(workspace);
  await mkdir(runsDir, { recursive: true });
  const fileName = runManifestFileName(manifest.run_id);
  const target = join(runsDir, fileName);
  const temp = join(runsDir, `${fileName}.tmp`);
  const body = `${JSON.stringify(manifest, null, 2)}\n`;
  await writeFile(temp, body, "utf8");
  await rename(temp, target);
  return target;
}

export async function readRunManifests(workspace: RunManifestWorkspace): Promise<RunManifest[]> {
  const runsDir = runsDirFor(workspace);
  let names: string[];
  try {
    names = await readdir(runsDir);
  } catch (error) {
    if (isMissing(error)) return [];
    throw error;
  }
  const manifests: RunManifest[] = [];
  for (const name of names.sort()) {
    if (!name.endsWith(".json")) continue;
    const path = join(runsDir, name);
    try {
      const parsed = JSON.parse(await readFile(path, "utf8")) as RunManifest;
      if (isRunManifest(parsed)) manifests.push(parsed);
    } catch {
      continue;
    }
  }
  return manifests;
}

function runManifestFileName(runId: string): string {
  if (!isSafeRunManifestId(runId)) {
    throw new Error(`run_id is not safe for manifest filename: ${runId}`);
  }
  return `${runId}.json`;
}

export function isSafeRunManifestId(runId: string): boolean {
  return /^[A-Za-z0-9_.-]+$/.test(runId);
}

function isRunManifest(value: unknown): value is RunManifest {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<RunManifest>;
  return candidate.schema_version === "knb.run.v1" &&
    typeof candidate.run_id === "string" &&
    typeof candidate.actor === "string" &&
    typeof candidate.started_at === "string" &&
    typeof candidate.completed_at === "string" &&
    typeof candidate.rows_appended === "number" &&
    Array.isArray(candidate.row_ids) &&
    candidate.row_ids.every((id) => typeof id === "string");
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

```

File: /Users/jaredsmith/Projects-ultra/knb/CLAUDE.md
```md
@AGENTS.md

```

File: /Users/jaredsmith/Projects-ultra/knb/knb/schema.json
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "knb.v1",
  "title": "knb JSONL Row",
  "type": "object",
  "required": [
    "schema_version",
    "id",
    "kind",
    "created_at",
    "created_by",
    "scope"
  ],
  "properties": {
    "schema_version": {
      "const": "knb.v1"
    },
    "id": {
      "type": "string",
      "minLength": 1
    },
    "kind": {
      "enum": [
        "source",
        "claim",
        "question",
        "synthesis",
        "change"
      ]
    },
    "created_at": {
      "type": "string"
    },
    "created_by": {
      "type": "string"
    },
    "scope": {
      "$ref": "#/$defs/scope"
    },
    "external_refs": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/external_ref"
      }
    },
    "identity": {
      "$ref": "#/$defs/identity"
    },
    "source": {
      "$ref": "#/$defs/source"
    },
    "claim": {
      "$ref": "#/$defs/claim"
    },
    "question": {
      "$ref": "#/$defs/question"
    },
    "synthesis": {
      "$ref": "#/$defs/synthesis"
    },
    "change": {
      "$ref": "#/$defs/change"
    },
    "time": {
      "$ref": "#/$defs/time"
    },
    "provenance": {
      "$ref": "#/$defs/provenance"
    },
    "assessment": {
      "$ref": "#/$defs/assessment"
    },
    "relations": {
      "type": "array",
      "items": {
        "$ref": "#/$defs/relation"
      }
    }
  },
  "allOf": [
    {
      "if": {
        "properties": {
          "kind": {
            "const": "source"
          }
        }
      },
      "then": {
        "required": [
          "source",
          "provenance"
        ]
      }
    },
    {
      "if": {
        "properties": {
          "kind": {
            "const": "claim"
          }
        }
      },
      "then": {
        "required": [
          "identity",
          "claim",
          "time",
          "provenance",
          "assessment"
        ],
        "properties": {
          "provenance": {
            "required": [
              "evidence"
            ],
            "properties": {
              "evidence": {
                "minItems": 1
              }
            }
          },
          "assessment": {
            "required": [
              "confidence"
            ]
          }
        }
      }
    },
    {
      "if": {
        "properties": {
          "kind": {
            "const": "question"
          }
        }
      },
      "then": {
        "required": [
          "question"
        ]
      }
    },
    {
      "if": {
        "properties": {
          "kind": {
            "const": "synthesis"
          }
        }
      },
      "then": {
        "required": [
          "synthesis"
        ]
      }
    },
    {
      "if": {
        "properties": {
          "kind": {
            "const": "change"
          }
        }
      },
      "then": {
        "required": [
          "change"
        ]
      }
    }
  ],
  "$defs": {
    "scope": {
      "type": "object",
      "properties": {
        "collections": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "subjects": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "tags": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "language": {
          "type": [
            "string",
            "null"
          ]
        },
        "geo": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "anyOf": [
        {
          "required": [
            "collections"
          ]
        },
        {
          "required": [
            "subjects"
          ]
        },
        {
          "required": [
            "tags"
          ]
        }
      ]
    },
    "external_ref": {
      "type": "object",
      "required": [
        "system",
        "id"
      ],
      "properties": {
        "system": {
          "type": "string"
        },
        "id": {
          "type": "string"
        },
        "type": {
          "type": [
            "string",
            "null"
          ]
        },
        "path": {
          "type": [
            "string",
            "null"
          ]
        }
      }
    },
    "identity": {
      "type": "object",
      "properties": {
        "claim_key": {
          "type": "string"
        },
        "thread_key": {
          "type": "string"
        },
        "dedupe_hash": {
          "type": "string"
        },
        "novelty": {
          "enum": [
            "new",
            "duplicate",
            "corroboration",
            "update",
            "contradiction",
            "correction"
          ]
        },
        "checked_at": {
          "type": "string"
        }
      }
    },
    "source": {
      "type": "object",
      "required": [
        "type",
        "title"
      ],
      "anyOf": [
        {
          "required": [
            "uri"
          ]
        },
        {
          "required": [
            "raw_path"
          ]
        },
        {
          "required": [
            "content_hash"
          ]
        }
      ],
      "properties": {
        "type": {
          "enum": [
            "article",
            "official_record",
            "dataset",
            "paper",
            "social_post",
            "transcript",
            "legal_document",
            "api_response",
            "raw_note",
            "web_page",
            "other"
          ]
        },
        "title": {
          "type": "string"
        },
        "uri": {
          "type": [
            "string",
            "null"
          ]
        },
        "publisher": {
          "type": [
            "string",
            "null"
          ]
        },
        "author": {
          "type": [
            "string",
            "null"
          ]
        },
        "language": {
          "type": [
            "string",
            "null"
          ]
        },
        "published_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "content_hash": {
          "type": [
            "string",
            "null"
          ]
        },
        "raw_path": {
          "type": [
            "string",
            "null"
          ]
        }
      }
    },
    "claim": {
      "type": "object",
      "required": [
        "statement",
        "atomic"
      ],
      "properties": {
        "statement": {
          "type": "string"
        },
        "atomic": {
          "type": "boolean"
        },
        "type": {
          "type": "string"
        },
        "subject": {
          "type": "string"
        },
        "predicate": {
          "type": "string"
        },
        "object": {
          "type": "string"
        },
        "qualifiers": {
          "type": "object"
        }
      }
    },
    "question": {
      "type": "object",
      "required": [
        "text",
        "status"
      ],
      "properties": {
        "text": {
          "type": "string"
        },
        "status": {
          "enum": [
            "open",
            "resolved",
            "archived"
          ]
        },
        "priority": {
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        "resolution_criteria": {
          "type": "string"
        },
        "why_it_matters": {
          "type": "string"
        },
        "answer_claim_id": {
          "type": [
            "string",
            "null"
          ]
        }
      }
    },
    "synthesis": {
      "type": "object",
      "required": [
        "title",
        "summary",
        "basis",
        "status"
      ],
      "properties": {
        "title": {
          "type": "string"
        },
        "summary": {
          "type": "string"
        },
        "basis": {
          "type": "object",
          "properties": {
            "claim_ids": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "question_ids": {
              "type": "array",
              "items": {
                "type": "string"
              }
            },
            "source_ids": {
              "type": "array",
              "items": {
                "type": "string"
              }
            }
          }
        },
        "target_selector": {
          "type": "object",
          "$ref": "knb.selector.v1",
          "description": "Optional RowSelector describing the intended synthesis coverage."
        },
        "limitations": {
          "type": "string"
        },
        "status": {
          "enum": [
            "active",
            "archived"
          ]
        }
      }
    },
    "change": {
      "type": "object",
      "required": [
        "action"
      ],
      "properties": {
        "action": {
          "enum": [
            "retract",
            "supersede",
            "merge",
            "relate",
            "patch"
          ]
        },
        "target_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "target_id": {
          "type": "string"
        },
        "replacement_id": {
          "type": "string"
        },
        "canonical_id": {
          "type": "string"
        },
        "reason": {
          "type": "string"
        },
        "relation": {
          "type": "object",
          "required": [
            "from_id",
            "to_id",
            "rel"
          ],
          "properties": {
            "from_id": {
              "type": "string"
            },
            "to_id": {
              "type": "string"
            },
            "target_id": {
              "type": "string"
            },
            "rel": {
              "enum": [
                "supports",
                "contradicts",
                "depends_on",
                "context_for"
              ]
            },
            "strength": {
              "enum": [
                "low",
                "medium",
                "high"
              ]
            },
            "rationale": {
              "type": "string"
            }
          }
        },
        "patch": {
          "type": "array",
          "items": {
            "type": "object"
          }
        }
      }
    },
    "time": {
      "type": "object",
      "required": [
        "precision"
      ],
      "properties": {
        "occurred_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "valid_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "valid_from": {
          "type": [
            "string",
            "null"
          ]
        },
        "valid_until": {
          "type": [
            "string",
            "null"
          ]
        },
        "reported_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "first_observed_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "last_checked_at": {
          "type": [
            "string",
            "null"
          ]
        },
        "precision": {
          "enum": [
            "instant",
            "hour",
            "day",
            "month",
            "year",
            "range",
            "unknown"
          ]
        },
        "timezone": {
          "type": [
            "string",
            "null"
          ]
        },
        "notes": {
          "type": "string"
        }
      }
    },
    "provenance": {
      "type": "object",
      "properties": {
        "source_ids": {
          "type": "array",
          "items": {
            "type": "string"
          }
        },
        "evidence": {
          "type": "array",
          "items": {
            "$ref": "#/$defs/evidence_ref"
          }
        },
        "acquisition": {
          "type": "object"
        },
        "transformations": {
          "type": "array",
          "items": {
            "type": "object"
          }
        },
        "derivation": {
          "type": "object"
        }
      }
    },
    "evidence_ref": {
      "type": "object",
      "required": [
        "source_id",
        "role",
        "summary"
      ],
      "properties": {
        "source_id": {
          "type": "string"
        },
        "role": {
          "enum": [
            "supports",
            "contradicts",
            "context"
          ]
        },
        "locator": {
          "type": "object"
        },
        "summary": {
          "type": "string"
        }
      }
    },
    "assessment": {
      "type": "object",
      "properties": {
        "confidence": {
          "enum": [
            "unknown",
            "low",
            "medium",
            "high"
          ]
        },
        "source_reliability": {
          "enum": [
            "unknown",
            "low",
            "medium",
            "high"
          ]
        },
        "information_depth": {
          "type": "object",
          "required": [
            "level",
            "rationale"
          ],
          "properties": {
            "level": {
              "enum": [
                "unknown",
                "thin",
                "partial",
                "strong",
                "complete"
              ]
            },
            "rationale": {
              "type": "string"
            }
          }
        },
        "importance": {
          "enum": [
            "unknown",
            "low",
            "medium",
            "high"
          ]
        },
        "contested": {
          "type": "boolean"
        },
        "uncertainty": {
          "type": "string"
        }
      }
    },
    "relation": {
      "type": "object",
      "required": [
        "target_id",
        "rel"
      ],
      "properties": {
        "target_id": {
          "type": "string"
        },
        "rel": {
          "enum": [
            "supports",
            "contradicts",
            "depends_on",
            "context_for"
          ]
        },
        "strength": {
          "enum": [
            "low",
            "medium",
            "high"
          ]
        },
        "rationale": {
          "type": "string"
        }
      }
    }
  }
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/read-snapshot.ts
```ts
// Read snapshot module - V1 read-side counterpart to apply.
// Concentrates load -> validate -> optional project -> freshness collection so
// status, check, get, query, context, render, and index do not reassemble the
// rules independently.

import type { LoadedRow as ContractLoadedRow, ValidationIssue, ValidationResult } from "./contract";
import { validateLedger } from "./contract";
import { loadLedger as defaultLoadLedger, type LedgerFingerprint, type LedgerSnapshot } from "./ledger";
import {
  checkFreshness as defaultCheckFreshness,
  type FreshnessReport,
} from "./projections";
import { validateProfilesForWorkspace } from "./profiles";
import { buildEffectiveState, type EffectiveState, type StateOptions } from "./state";
import type { KnbWorkspace } from "./workspace";

export type SnapshotValidity = "loaded" | "validated" | "projected";

export type ProjectionFreshness = FreshnessReport;
export type ProjectionFreshnessEntry = FreshnessReport["entries"][number];

export type { EffectiveState } from "./state";

export type KnbReadSnapshot = {
  validity: SnapshotValidity;
  ledger: LedgerSnapshot;
  fingerprint: LedgerFingerprint;
  validation: ValidationResult;
  state?: EffectiveState;
  projectionFreshness: ProjectionFreshness;
};

export type ReadSnapshotLedgerLoader = (options: { path: string }) => Promise<LedgerSnapshot>;

export type ReadSnapshotValidator = (
  rows: ContractLoadedRow[],
  parseIssues: ValidationIssue[],
) => ValidationResult;

export type ReadSnapshotProjector = (rows: ContractLoadedRow[], options: StateOptions) => EffectiveState;

export type ReadSnapshotFreshnessProbe = (
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
) => Promise<FreshnessReport>;

export type ReadSnapshotProfileValidator = (
  workspace: KnbWorkspace,
  rows: ContractLoadedRow[],
) => Promise<ValidationIssue[]>;

export type ReadSnapshotOptions = {
  workspace: KnbWorkspace;
  loadLedger?: ReadSnapshotLedgerLoader;
  validate?: ReadSnapshotValidator;
  profiles?: ReadSnapshotProfileValidator | false;
  projectState?: ReadSnapshotProjector | false;
  freshness?: ReadSnapshotFreshnessProbe | false;
  asOf?: string;
};

export function defaultProjectState(rows: ContractLoadedRow[], options: StateOptions = {}): EffectiveState {
  return buildEffectiveState(rows, options);
}

export const defaultFreshness: ReadSnapshotFreshnessProbe = (workspace, ledger_fingerprint) =>
  defaultCheckFreshness({ workspace, ledger_fingerprint });

export async function readSnapshot(options: ReadSnapshotOptions): Promise<KnbReadSnapshot> {
  const loader = options.loadLedger ?? defaultLoadLedger;
  const validator = options.validate ?? validateLedger;

  const ledger = await loader({ path: options.workspace.paths.ledger });

  const contractRows: ContractLoadedRow[] = ledger.rows.map(({ row, line }) => ({ row, line }));
  const parseIssues: ValidationIssue[] = ledger.parseIssues.map((issue) => ({
    level: issue.level,
    code: issue.code,
    message: issue.message,
    line: issue.line,
  }));

  const baseValidation = validator(contractRows, parseIssues);
  const profileIssues =
    options.profiles === false
      ? []
      : await (options.profiles ?? validateProfilesForWorkspace)(options.workspace, contractRows);
  const validation: ValidationResult = {
    ok: baseValidation.ok && !profileIssues.some((issue) => issue.level === "error"),
    issues: [...baseValidation.issues, ...profileIssues],
  };

  const hasParseError = ledger.parseIssues.length > 0;
  const hasValidationError = validation.issues.some((issue) => issue.level === "error");

  let validity: SnapshotValidity;
  let state: EffectiveState | undefined;

  if (hasParseError || hasValidationError) {
    validity = "loaded";
  } else if (options.projectState === false) {
    validity = "validated";
  } else {
    const projector = options.projectState ?? defaultProjectState;
    const stateOptions: StateOptions = {};
    if (options.asOf !== undefined) stateOptions.asOf = options.asOf;
    state = projector(contractRows, stateOptions);
    validity = "projected";
  }

  let projectionFreshness: ProjectionFreshness = { entries: [] };
  if (options.freshness !== false) {
    const probe = options.freshness ?? defaultFreshness;
    projectionFreshness = await probe(options.workspace, ledger.fingerprint);
  }

  const snapshot: KnbReadSnapshot = {
    validity,
    ledger,
    fingerprint: ledger.fingerprint,
    validation,
    projectionFreshness,
  };
  if (state !== undefined) snapshot.state = state;
  return snapshot;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/index.ts
```ts
export { openKnb } from "./core/knb";
export type {
  Knb,
  OpenKnbOptions,
  StatusOptions,
  KnbStatus,
  DetailedStatus,
  DuplicateSourceUriCluster,
  DuplicateClaimKeyCluster,
  EvidenceDepthStats,
  CollectionStatusRequest,
  CollectionStatusResult,
  CollectionSummary,
  CollectionsResult,
  LogRequest,
  LogResult,
  SchemaResult,
  InitOptions,
  InitResult,
  KnbRuntime,
  ApplyRequest,
} from "./core/knb";

export type { KnbWorkspace, KnbConfig } from "./core/workspace";
export type {
  KnbRow,
  KnbRowKind,
  Scope,
  ApplyOperation,
  DraftRow,
  ValidationResult,
  ValidationIssue,
} from "./core/contract";
export type { KnbError, KnbErrorCode } from "./core/errors";
export type {
  KnbReadSnapshot,
  ProjectionFreshness,
  ProjectionFreshnessEntry,
  SnapshotValidity,
} from "./core/read-snapshot";
export type { LedgerFingerprint } from "./core/ledger";
export type {
  ContextRequest,
  ContextRecencyProfile,
  ContextResult,
  ContextScoringProfile,
  ContextScoringProfileInput,
  ContextScoringWeights,
  ContextScoringWeightsInput,
} from "./core/context";
export type {
  GetRequest,
  GetResult,
  QueryRequest,
  QueryResult,
} from "./core/query";
export type {
  RenderAllRequest,
  RenderAllResult,
  RenderRequest,
  RenderResult,
} from "./core/projections";
export {
  matchesRowSelector,
  selectEffectiveRows,
  validateRowSelector,
} from "./core/selectors";
export type {
  RowSelector,
  RowSelectorComparable,
  RowSelectorExternalRef,
  RowSelectorValidationResult,
  RowSelectorValue,
  RowSelectorWhere,
} from "./core/selectors";

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/source-citations.ts
```ts
import type { ClaimRow, SourceRow } from "./contract";
import type { EffectiveState } from "./state";

export type SourceCitationIndex = Record<string, string[]>;

export function buildSourceCitationIndex(state: EffectiveState): SourceCitationIndex {
  const activeRows = state.rows({ status: "active", includeChanges: false });
  const sourcesById = new Map<string, SourceRow>();

  for (const effective of activeRows) {
    if (effective.row.kind !== "source") continue;
    sourcesById.set(effective.row.id, effective.row as SourceRow);
  }

  const buckets = new Map<string, Set<string>>();
  for (const effective of activeRows) {
    if (effective.row.kind !== "claim") continue;
    const claim = effective.row as ClaimRow;
    const urisForClaim = new Set<string>();

    for (const sourceId of claimSourceIds(claim)) {
      const canonicalId = state.canonicalIdOf(sourceId);
      const source = sourcesById.get(canonicalId);
      const uri = source?.source.uri;
      if (typeof uri === "string" && uri.length > 0) urisForClaim.add(uri);
    }

    for (const uri of urisForClaim) {
      const bucket = buckets.get(uri) ?? new Set<string>();
      bucket.add(claim.id);
      buckets.set(uri, bucket);
    }
  }

  const out: SourceCitationIndex = {};
  for (const uri of [...buckets.keys()].sort((a, b) => a.localeCompare(b))) {
    out[uri] = [...(buckets.get(uri) ?? [])].sort((a, b) => a.localeCompare(b));
  }
  return out;
}

function claimSourceIds(claim: ClaimRow): string[] {
  const ids = new Set<string>();
  for (const id of claim.provenance.source_ids ?? []) {
    if (typeof id === "string" && id.length > 0) ids.add(id);
  }
  for (const evidence of claim.provenance.evidence ?? []) {
    const id = evidence?.source_id;
    if (typeof id === "string" && id.length > 0) ids.add(id);
  }
  return [...ids];
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/workspace.ts
```ts
// Workspace module - V1 root, config, actor, and path resolution.
// Every command crosses this seam first. The opened workspace travels through
// every library call so paths and actor are not recomputed downstream.

import { readFile as fsReadFile } from "node:fs/promises";
import { userInfo } from "node:os";
import { isAbsolute, join, normalize, resolve, sep } from "node:path";
import { execFile } from "node:child_process";

import { knbError } from "./errors";

export type KnbConfig = {
  ledger?: string;
  schema?: string;
  views?: string;
  indexes?: string;
  actor?: string;
};

export type KnbWorkspace = {
  root: string;
  configPath?: string;
  config: KnbConfig;
  paths: {
    ledger: string;
    schema: string;
    views: string;
    indexes: string;
    profiles: string;
    runs: string;
    lock: string;
    config: string;
  };
  actor: string;
};

export type ExecResult = { stdout: string; status: number };

export type OpenWorkspaceOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  actor?: string;
  env?: NodeJS.ProcessEnv;
  cwd?: () => string;
  readFile?: (path: string) => Promise<string>;
  exec?: (cmd: string, args: string[]) => Promise<ExecResult | undefined>;
  systemUser?: () => string | undefined;
};

const DEFAULT_PATHS = {
  ledger: join("knb", "ledger.jsonl"),
  schema: join("knb", "schema.json"),
  views: join("knb", "views"),
  indexes: join("knb", "indexes"),
  profiles: join("knb", "profiles"),
  runs: join(".knb", "runs"),
  lock: join(".knb", "ledger.lock"),
  config: join(".knb", "config.json"),
} as const;

export async function openWorkspace(options: OpenWorkspaceOptions = {}): Promise<KnbWorkspace> {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? (() => process.cwd());
  const readFile = options.readFile ?? defaultReadFile;
  const exec = options.exec ?? defaultExec;
  const systemUser = options.systemUser ?? defaultSystemUser;

  const root = await resolveRoot(options.root, cwd, readFile);
  const configPath = await resolveConfigPath(root, options.configPath, env, readFile);
  const config = await loadConfig(configPath, readFile);

  const ledgerSource = options.ledgerPath ?? config.ledger ?? DEFAULT_PATHS.ledger;
  const schemaSource = config.schema ?? DEFAULT_PATHS.schema;
  const viewsSource = config.views ?? DEFAULT_PATHS.views;
  const indexesSource = config.indexes ?? DEFAULT_PATHS.indexes;

  const paths = {
    ledger: normalizeUnderRoot(root, ledgerSource),
    schema: normalizeUnderRoot(root, schemaSource),
    views: normalizeUnderRoot(root, viewsSource),
    indexes: normalizeUnderRoot(root, indexesSource),
    profiles: join(root, DEFAULT_PATHS.profiles),
    runs: join(root, DEFAULT_PATHS.runs),
    lock: join(root, DEFAULT_PATHS.lock),
    config: configPath ?? join(root, DEFAULT_PATHS.config),
  };

  const actor = await resolveActor(options.actor, env, exec, systemUser, config);

  const workspace: KnbWorkspace = { root, config, paths, actor };
  if (configPath !== undefined) workspace.configPath = configPath;
  return workspace;
}

async function resolveRoot(
  explicit: string | undefined,
  cwd: () => string,
  readFile: (path: string) => Promise<string>,
): Promise<string> {
  if (explicit) return resolve(explicit);
  const start = resolve(cwd());
  let current = start;
  while (true) {
    const candidate = join(current, ".knb", "config.json");
    if (await exists(candidate, readFile)) return current;
    const parent = dirOf(current);
    if (parent === current) break;
    current = parent;
  }
  return start;
}

async function resolveConfigPath(
  root: string,
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
  readFile: (path: string) => Promise<string>,
): Promise<string | undefined> {
  if (explicit) return resolve(explicit);
  const fromEnv = env.KNB_CONFIG;
  if (fromEnv && fromEnv.length > 0) return resolve(fromEnv);
  const defaultPath = join(root, DEFAULT_PATHS.config);
  if (await exists(defaultPath, readFile)) return defaultPath;
  return undefined;
}

async function loadConfig(
  configPath: string | undefined,
  readFile: (path: string) => Promise<string>,
): Promise<KnbConfig> {
  if (!configPath) return {};
  let raw: string;
  try {
    raw = await readFile(configPath);
  } catch (error) {
    if (isMissing(error)) return {};
    throw knbError("io_failed", `Failed to read config: ${configPath}`, { path: configPath }, error);
  }
  try {
    const parsed = JSON.parse(raw);
    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw knbError("io_failed", `Config must be a JSON object: ${configPath}`, { path: configPath });
    }
    return parsed as KnbConfig;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw knbError(
        "io_failed",
        `Failed to parse config JSON: ${configPath}`,
        { path: configPath },
        error,
      );
    }
    throw error;
  }
}

async function resolveActor(
  explicit: string | undefined,
  env: NodeJS.ProcessEnv,
  exec: (cmd: string, args: string[]) => Promise<ExecResult | undefined>,
  systemUser: () => string | undefined,
  config: KnbConfig,
): Promise<string> {
  if (explicit && explicit.length > 0) return explicit;
  const fromEnv = env.KNB_ACTOR;
  if (fromEnv && fromEnv.length > 0) return fromEnv;
  const fromConfig = config.actor;
  if (fromConfig && fromConfig.length > 0) return fromConfig;
  const email = await runGit(exec, ["config", "user.email"]);
  if (email) return email;
  const name = await runGit(exec, ["config", "user.name"]);
  if (name) return name;
  const sys = systemUser();
  if (sys && sys.length > 0) return sys;
  return "unknown";
}

async function runGit(
  exec: (cmd: string, args: string[]) => Promise<ExecResult | undefined>,
  args: string[],
): Promise<string | undefined> {
  try {
    const result = await exec("git", args);
    if (!result || result.status !== 0) return undefined;
    const trimmed = result.stdout.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  } catch {
    return undefined;
  }
}

function normalizeUnderRoot(root: string, value: string): string {
  if (isAbsolute(value)) return normalize(value);
  return normalize(join(root, value));
}

function dirOf(path: string): string {
  const trimmed = path.endsWith(sep) && path.length > 1 ? path.slice(0, -1) : path;
  const lastSep = trimmed.lastIndexOf(sep);
  if (lastSep <= 0) return sep;
  return trimmed.slice(0, lastSep);
}

async function exists(path: string, readFile: (path: string) => Promise<string>): Promise<boolean> {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    return false;
  }
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

async function defaultReadFile(path: string): Promise<string> {
  return fsReadFile(path, "utf8");
}

async function defaultExec(cmd: string, args: string[]): Promise<ExecResult | undefined> {
  return new Promise((resolvePromise) => {
    execFile(cmd, args, { encoding: "utf8" }, (error, stdout) => {
      if (error) {
        const status = typeof (error as { code?: unknown }).code === "number" ? Number((error as { code?: unknown }).code) : 1;
        resolvePromise({ stdout: stdout ?? "", status });
        return;
      }
      resolvePromise({ stdout: stdout ?? "", status: 0 });
    });
  });
}

function defaultSystemUser(): string | undefined {
  try {
    const info = userInfo();
    return info.username && info.username.length > 0 ? info.username : undefined;
  } catch {
    return undefined;
  }
}

```

File: /Users/jaredsmith/Projects-ultra/knb/ARCHITECTURE.md
```md
# knb Architecture

`knb` stores sourced knowledge in an append-only JSONL ledger and exposes it through a small TypeScript facade plus a thin CLI adapter. The ledger is canonical; everything in `knb/views/` and `knb/indexes/` is a disposable projection rebuilt from the ledger.

For full command contracts, output envelopes, and lifecycle details, see [docs/design/agent-first-cli.md](docs/design/agent-first-cli.md). Standing decisions live in [docs/adr/](docs/adr/).

## Event Model

Rows in `knb/ledger.jsonl` are canonical events. `source`, `claim`, `question`, and `synthesis` rows introduce knowledge artifacts. `change` rows are lifecycle events that retract, supersede, merge, relate, or patch earlier rows. `EffectiveState` is the deterministic projection of those events at a point in time; read paths consume `EffectiveState`, not raw ledger rows.

## Core Modules

| Module | Responsibility | Interface seam |
| --- | --- | --- |
| `src/core/apply.ts` | Validate semantic write operations, complete draft rows, dedupe candidate claims, and produce appendable rows. | `applyOperations` through the `Knb.apply` facade, with `ApplyResult` and generated `run_id`. |
| `src/core/context.ts` | Build token-budgeted research packets from effective state, including ranked syntheses, claims, questions, sources, and warnings. | `buildContext`, `ContextRequest`, scoring profile types, and scoring functions. |
| `src/core/contract.ts` | Own row types, operation types, constants, validation, draft completion, samples, reference walking, and JSON Schema. | `KnbRow`, `ApplyOperation`, `validateLedger`, `validateApplyRequest`, `jsonSchema`, `referenceFields`. |
| `src/core/errors.ts` | Define typed domain errors and map them to CLI exit codes. | `KnbErrorCode`, `knbError`, `fromUnknown`, `exitCodeForError`. |
| `src/core/knb.ts` | Public library facade that wires workspace, ledger, read snapshots, writes, queries, context, rendering, indexes, logs, and runtime adapters. | `openKnb`, `Knb`, `OpenKnbOptions`, public request/result types. |
| `src/core/ledger.ts` | Own JSONL loading, parse diagnostics, fingerprints, lock-protected append transactions, and durable flush behavior. | `loadLedger`, `writeLedger`, `LedgerFingerprint`, `LedgerSnapshot`. |
| `src/core/novelty.ts` | Classify candidate claims against active claims for dedupe and research triage. | `classifyClaim`, `classifyMany`, `NoveltyResult`. |
| `src/core/output.ts` | Render CLI success/failure envelopes and human text without changing domain results. | `success`, `failure`, `render`, `CommandResult`. |
| `src/core/profiles.ts` | Load and validate optional workspace profiles that constrain row shapes. | `KnbProfile`, `validateProfilesForWorkspace`, `profileSchema`, `profileSamples`. |
| `src/core/projections.ts` | Render Markdown views, rebuild disposable indexes, write projection metadata, and report freshness. | `ProjectionArtifactStore`, `JsonProjectionArtifactStore`, `renderCollection`, `renderAllCollections`, `rebuildIndexes`, `checkFreshness`. |
| `src/core/query.ts` | Retrieve active or historical rows from effective state with deterministic filtering and ranking. | `executeQuery`, `executeGet`, `QueryRequest`, `GetRequest`. |
| `src/core/read-snapshot.ts` | Build one read-side packet from ledger load, validation, state projection, profile validation, and projection freshness. | `readSnapshot`, `KnbReadSnapshot`, injected loader/validator/projector/freshness seams. |
| `src/core/run-manifests.ts` | Persist and read per-run operation manifests for audit logs. | `RunManifest`, `runsDirFor`, facade log methods. |
| `src/core/selectors.ts` | Validate and evaluate structured row selectors for claim type, qualifiers, and external references. | `RowSelector`, `structuredClaimSelectorFromRequest`, `matchesRowSelector`, `rowSelectorSchema`. |
| `src/core/source-citations.ts` | Build source URI/hash to citing-claim vocabulary for reverse citation lookup. | `SourceCitationIndex`, `buildSourceCitationIndex`. |
| `src/core/state.ts` | Project loaded ledger rows into current or as-of effective state, lifecycle explanations, relation graph, and warnings. | `buildEffectiveState`, `EffectiveState`, `EffectiveRow`, `StateOptions`. |
| `src/core/workspace.ts` | Resolve workspace paths, config, actor identity, and runtime command execution. | `openWorkspace`, `KnbWorkspace`, `OpenWorkspaceOptions`. |

## Scoring Model

Context scoring is explicit and narrow. Defaults preserve historical ordering: importance, confidence, information depth, evidence count, contested status, created time, then id. Callers may pass `ContextRequest.scoringProfile` to adjust weights and `recencyWindowDays` to enable linear recency scoring. The approved recency score is `max(0, 1 - ageDays / windowDays) * weight`, anchored to `request.asOf` when set and otherwise to the newest in-scope row.

## Projection Artifacts

`ProjectionArtifactStore` owns generated views, indexes, sidecar metadata, and freshness checks. Generated projection files are disposable artifacts, not read-side authority. Canonical reads always load the ledger, validate it, and project `EffectiveState`. V1 ships only `JsonProjectionArtifactStore`; see [ADR-0002](docs/adr/0002-projection-store-seam-jsonl-only.md).

Rendered Markdown views are structured for skimming: a top table of contents, stable row anchors derived from row ids, claim-key clusters derived from `EffectiveState`, an explicit unkeyed-claims section, open questions, and cited sources with counts from `SourceCitationIndex`. Views may change layout, but sidecar metadata keeps the projection envelope shape stable.

## Vocabulary

- Row kinds: `source`, `claim`, `question`, `synthesis`, and `change`.
- Change actions: `retract`, `supersede`, `merge`, `relate`, and `patch`.
- Identity fields: `claim_key` anchors semantic claim identity; `dedupe_hash` anchors normalized duplicate detection; `external_refs` links rows to outside systems.
- Scope fields: `collections`, `subjects`, and `tags` filter and group rows.
- Time precision values: `instant`, `hour`, `day`, `month`, `year`, `range`, and `unknown`.
- `EffectiveState`: projected active/inactive row state plus lifecycle explanations, relation graph, and state warnings.
- `LedgerFingerprint`: canonical ledger identity computed from path, row count, bytes, last row id, and content hash.
- `run_id`: per-apply transaction id stored in run manifests and core apply results. Public TypeScript callers pass `runId`; persisted/core rows and manifests use `run_id`.
- `SourceCitationIndex`: source URI/hash to citing claim ids; this owns the reverse-citation vocabulary.

## Naming

Use one casing per boundary. CLI flags are kebab-case, for example `--claim-key` and `--recency-window-days`. Ledger/schema fields are snake_case, for example `claim_key`, `external_refs`, and `run_id`. Public TypeScript facade request fields are camelCase, for example `claimKey`, `externalRefs`, `maxTokens`, `includeWarnings`, `recencyWindowDays`, and `runId`. The CLI adapter is responsible for translating flags into facade request fields.

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/state.ts
```ts
// Effective state module - V1 lifecycle-aware projection over the ledger.
// Single deep module: consumers only see EffectiveState. Internals walk the
// ledger once, build status, relations, patch audit, and warnings, then expose
// indexed read methods that respect change rows, intrinsic archived state, and
// hidden change rows by default.

import type {
  ChangeRow,
  KnbRow,
  KnbRowKind,
  LoadedRow,
  QuestionRow,
  RelationType,
  Relation,
  SynthesisRow,
} from "./contract";
import { knbError } from "./errors";
import { matchesRowSelector, type RowSelector } from "./selectors";

export type EffectiveStatus =
  | "active"
  | "retracted"
  | "superseded"
  | "duplicate"
  | "archived"
  | "invalid";

export type StateWarningCode =
  | "change_target_inactive"
  | "change_target_missing"
  | "relation_endpoint_missing"
  | "patch_target_missing"
  | "supersede_replacement_inactive"
  | "merge_canonical_inactive"
  | "synthesis_target_stale";

export type StateWarning = {
  code: StateWarningCode;
  message: string;
  change_id?: string;
  target_id?: string;
  line?: number;
};

export type EffectiveRow = {
  row: KnbRow;
  status: EffectiveStatus;
  reason?: string;
  by_change_id?: string;
  intrinsic_archived?: true;
};

export type StateExplanationEntry = {
  change_id: string;
  action: "retract" | "supersede" | "merge" | "patch";
  by: string;
  at: string;
  reason?: string;
  replacement_id?: string;
  canonical_id?: string;
  patch_summary?: string;
};

export type StatePatchAuditEntry = {
  change_id: string;
  at: string;
  by: string;
  reason: string;
  patch: Array<Record<string, unknown>>;
};

export type StateExplanation = {
  id: string;
  status: EffectiveStatus;
  reason?: string;
  history: StateExplanationEntry[];
  patch_audit: StatePatchAuditEntry[];
};

export type EffectiveRelation = {
  from_id: string;
  to_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
  source: "row_relations" | "change_relate";
  by_change_id?: string;
};

export type RelationGraph = {
  all(): EffectiveRelation[];
  outgoing(id: string): EffectiveRelation[];
  incoming(id: string): EffectiveRelation[];
};

export type StateFilter = {
  kinds?: KnbRowKind[];
  collection?: string;
  subject?: string;
  tag?: string;
  status?: EffectiveStatus;
  includeChanges?: boolean;
};

export type EffectiveState = {
  get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined;
  rows(filter?: StateFilter): EffectiveRow[];
  statusOf(id: string): EffectiveStatus | undefined;
  canonicalIdOf(id: string): string;
  explain(id: string): StateExplanation | undefined;
  relationGraph(): RelationGraph;
  warnings: StateWarning[];
};

export type StateOptions = {
  asOf?: string;
};

type InternalRow = EffectiveRow & {
  line: number;
};

export function buildEffectiveState(loaded: LoadedRow[], options: StateOptions = {}): EffectiveState {
  const projectedRows = filterRowsAsOf(loaded, options.asOf);
  const idMap = new Map<string, InternalRow>();
  const order: string[] = [];
  const warnings: StateWarning[] = [];
  const relations: EffectiveRelation[] = [];
  const outgoingIndex = new Map<string, EffectiveRelation[]>();
  const incomingIndex = new Map<string, EffectiveRelation[]>();
  const explanationHistory = new Map<string, StateExplanationEntry[]>();
  const patchAudit = new Map<string, StatePatchAuditEntry[]>();
  const canonicalIdByDuplicate = new Map<string, string>();

  for (const item of projectedRows) {
    const row = item.row;
    if (typeof row.id !== "string" || row.id.length === 0) continue;
    if (idMap.has(row.id)) continue;
    const internal: InternalRow = { row, status: "active", line: item.line };
    if (row.kind === "question") {
      const status = (row as QuestionRow).question?.status;
      if (status === "archived") {
        internal.status = "archived";
        internal.intrinsic_archived = true;
      }
    } else if (row.kind === "synthesis") {
      const status = (row as SynthesisRow).synthesis?.status;
      if (status === "archived") {
        internal.status = "archived";
        internal.intrinsic_archived = true;
      }
    }
    idMap.set(row.id, internal);
    order.push(row.id);
  }

  for (const item of projectedRows) {
    const row = item.row;
    if (row.kind === "change") continue;
    const relationsList = (row as { relations?: Relation[] }).relations;
    if (!Array.isArray(relationsList)) continue;
    for (const relation of relationsList) {
      if (!relation || typeof relation !== "object") continue;
      const targetId = relation.target_id;
      if (typeof targetId !== "string" || !idMap.has(targetId)) {
        const warning: StateWarning = {
          code: "relation_endpoint_missing",
          message: `Relation target ${typeof targetId === "string" ? targetId : "(missing)"} not found for ${row.id}`,
          line: item.line,
        };
        if (typeof targetId === "string") warning.target_id = targetId;
        warnings.push(warning);
        continue;
      }
      const edge: EffectiveRelation = {
        from_id: row.id,
        to_id: targetId,
        rel: relation.rel,
        source: "row_relations",
      };
      if (relation.strength !== undefined) edge.strength = relation.strength;
      if (relation.rationale !== undefined) edge.rationale = relation.rationale;
      relations.push(edge);
      pushIndex(outgoingIndex, edge.from_id, edge);
      pushIndex(incomingIndex, edge.to_id, edge);
    }
  }

  for (const item of projectedRows) {
    const row = item.row;
    if (row.kind !== "change") continue;
    const change = (row as ChangeRow).change;
    if (!change || typeof change !== "object") continue;
    const action = change.action;

    if (action === "retract") {
      for (const targetId of change.target_ids ?? []) {
        applyInactivation(
          idMap,
          targetId,
          "retracted",
          `retracted: ${change.reason ?? ""}`.trim(),
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "retract",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
          },
          item.line,
        );
      }
      continue;
    }

    if (action === "supersede") {
      const replacementId = change.replacement_id;
      for (const targetId of change.target_ids ?? []) {
        applyInactivation(
          idMap,
          targetId,
          "superseded",
          `superseded by ${replacementId ?? "(unknown)"}`,
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "supersede",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
            ...(replacementId !== undefined ? { replacement_id: replacementId } : {}),
          },
          item.line,
        );
      }
      if (typeof replacementId === "string") {
        const replacement = idMap.get(replacementId);
        if (replacement && replacement.status !== "active") {
          warnings.push({
            code: "supersede_replacement_inactive",
            message: `Supersede replacement ${replacementId} is not active (status: ${replacement.status})`,
            change_id: row.id,
            target_id: replacementId,
            line: item.line,
          });
        }
      }
      continue;
    }

    if (action === "merge") {
      const canonicalId = change.canonical_id;
      for (const targetId of change.target_ids ?? []) {
        if (
          typeof canonicalId === "string" &&
          canonicalId.length > 0 &&
          typeof targetId === "string" &&
          idMap.get(targetId)?.status === "active"
        ) {
          canonicalIdByDuplicate.set(targetId, canonicalId);
        }
        applyInactivation(
          idMap,
          targetId,
          "duplicate",
          `merged into ${canonicalId ?? "(unknown)"}`,
          row.id,
          warnings,
          explanationHistory,
          {
            change_id: row.id,
            action: "merge",
            by: row.created_by,
            at: row.created_at,
            ...(change.reason !== undefined ? { reason: change.reason } : {}),
            ...(canonicalId !== undefined ? { canonical_id: canonicalId } : {}),
          },
          item.line,
        );
      }
      if (typeof canonicalId === "string") {
        const canonical = idMap.get(canonicalId);
        if (canonical && canonical.status !== "active") {
          warnings.push({
            code: "merge_canonical_inactive",
            message: `Merge canonical ${canonicalId} is not active (status: ${canonical.status})`,
            change_id: row.id,
            target_id: canonicalId,
            line: item.line,
          });
        }
      }
      continue;
    }

    if (action === "relate") {
      const relation = change.relation;
      if (!relation || typeof relation !== "object") continue;
      const fromId = relation.from_id;
      const toId = relation.to_id;
      const fromMissing = typeof fromId !== "string" || !idMap.has(fromId);
      const toMissing = typeof toId !== "string" || !idMap.has(toId);
      if (fromMissing || toMissing) {
        warnings.push({
          code: "relation_endpoint_missing",
          message: `Relate change ${row.id} has missing endpoint(s): from=${fromId ?? "(missing)"} to=${toId ?? "(missing)"}`,
          change_id: row.id,
          ...(fromMissing && typeof fromId === "string" ? { target_id: fromId } : {}),
          ...(!fromMissing && toMissing && typeof toId === "string" ? { target_id: toId } : {}),
          line: item.line,
        });
        continue;
      }
      const edge: EffectiveRelation = {
        from_id: fromId as string,
        to_id: toId as string,
        rel: relation.rel,
        source: "change_relate",
        by_change_id: row.id,
      };
      if (relation.strength !== undefined) edge.strength = relation.strength;
      if (relation.rationale !== undefined) edge.rationale = relation.rationale;
      relations.push(edge);
      pushIndex(outgoingIndex, edge.from_id, edge);
      pushIndex(incomingIndex, edge.to_id, edge);
      continue;
    }

    if (action === "patch") {
      const targetId = change.target_id;
      if (typeof targetId !== "string" || !idMap.has(targetId)) {
        const warning: StateWarning = {
          code: "patch_target_missing",
          message: `Patch target ${typeof targetId === "string" ? targetId : "(missing)"} not found for change ${row.id}`,
          change_id: row.id,
          line: item.line,
        };
        if (typeof targetId === "string") warning.target_id = targetId;
        warnings.push(warning);
        continue;
      }
      const auditEntry: StatePatchAuditEntry = {
        change_id: row.id,
        at: row.created_at,
        by: row.created_by,
        reason: change.reason ?? "",
        patch: change.patch ?? [],
      };
      const list = patchAudit.get(targetId) ?? [];
      list.push(auditEntry);
      patchAudit.set(targetId, list);
      const historyEntry: StateExplanationEntry = {
        change_id: row.id,
        action: "patch",
        by: row.created_by,
        at: row.created_at,
        ...(change.reason !== undefined ? { reason: change.reason } : {}),
        patch_summary: summarizePatch(change.patch ?? []),
      };
      const historyList = explanationHistory.get(targetId) ?? [];
      historyList.push(historyEntry);
      explanationHistory.set(targetId, historyList);
      continue;
    }
  }

  addSynthesisTargetFreshnessWarnings(idMap, warnings);

  const graph: RelationGraph = {
    all(): EffectiveRelation[] {
      return [...relations];
    },
    outgoing(id: string): EffectiveRelation[] {
      return [...(outgoingIndex.get(id) ?? [])];
    },
    incoming(id: string): EffectiveRelation[] {
      return [...(incomingIndex.get(id) ?? [])];
    },
  };

  const state: EffectiveState = {
    warnings,
    get(id: string, options?: { includeHistory?: boolean }): EffectiveRow | undefined {
      const internal = idMap.get(id);
      if (!internal) return undefined;
      if (options?.includeHistory === true) return toEffectiveRow(internal);
      if (internal.status === "active") return toEffectiveRow(internal);
      return undefined;
    },
    rows(filter?: StateFilter): EffectiveRow[] {
      const wantStatus: EffectiveStatus = filter?.status ?? "active";
      const includeChanges = filter?.includeChanges === true;
      const kindsAllowed = filter?.kinds && filter.kinds.length > 0 ? new Set(filter.kinds) : undefined;
      const wantsChangeKind = kindsAllowed?.has("change") === true;
      const result: EffectiveRow[] = [];
      for (const id of order) {
        const internal = idMap.get(id);
        if (!internal) continue;
        if (internal.status !== wantStatus) continue;
        if (internal.row.kind === "change" && !includeChanges && !wantsChangeKind) continue;
        if (kindsAllowed && !kindsAllowed.has(internal.row.kind)) continue;
        if (filter?.collection && !internal.row.scope.collections?.includes(filter.collection)) continue;
        if (filter?.subject && !internal.row.scope.subjects?.includes(filter.subject)) continue;
        if (filter?.tag && !internal.row.scope.tags?.includes(filter.tag)) continue;
        result.push(toEffectiveRow(internal));
      }
      return result;
    },
    statusOf(id: string): EffectiveStatus | undefined {
      return idMap.get(id)?.status;
    },
    canonicalIdOf(id: string): string {
      return resolveCanonicalId(id, canonicalIdByDuplicate);
    },
    explain(id: string): StateExplanation | undefined {
      const internal = idMap.get(id);
      if (!internal) return undefined;
      const explanation: StateExplanation = {
        id,
        status: internal.status,
        history: [...(explanationHistory.get(id) ?? [])],
        patch_audit: [...(patchAudit.get(id) ?? [])],
      };
      if (internal.reason !== undefined) explanation.reason = internal.reason;
      return explanation;
    },
    relationGraph(): RelationGraph {
      return graph;
    },
  };

  return state;
}

function addSynthesisTargetFreshnessWarnings(
  idMap: Map<string, InternalRow>,
  warnings: StateWarning[],
): void {
  const activeRows = [...idMap.values()].filter((row) => row.status === "active");
  const activeSyntheses = activeRows.filter((row): row is InternalRow & { row: SynthesisRow } => {
    return row.row.kind === "synthesis" && (row.row as SynthesisRow).synthesis.status === "active";
  });

  for (const synthesis of activeSyntheses) {
    const selector = synthesis.row.synthesis.target_selector;
    if (selector === undefined) continue;

    const newerMatchingIds: string[] = [];
    for (const candidate of activeRows) {
      if (candidate.row.id === synthesis.row.id) continue;
      if (candidate.row.kind === "change" && !selectorIncludesChangeRows(selector)) continue;
      if (compareCreatedAt(candidate.row.created_at, synthesis.row.created_at) <= 0) continue;
      if (!matchesRowSelector(candidate.row, selector)) continue;
      if (isRepresentedByNewerSynthesis(candidate.row, synthesis.row, activeSyntheses)) continue;
      newerMatchingIds.push(candidate.row.id);
    }

    if (newerMatchingIds.length === 0) continue;
    warnings.push({
      code: "synthesis_target_stale",
      message: `Synthesis ${synthesis.row.id} target_selector has newer matching row(s): ${newerMatchingIds.join(", ")}`,
      target_id: synthesis.row.id,
      line: synthesis.line,
    });
  }
}

function selectorIncludesChangeRows(selector: RowSelector): boolean {
  return Array.isArray(selector.kinds) && selector.kinds.includes("change");
}

function isRepresentedByNewerSynthesis(
  candidate: KnbRow,
  current: SynthesisRow,
  activeSyntheses: Array<InternalRow & { row: SynthesisRow }>,
): boolean {
  for (const synthesis of activeSyntheses) {
    if (synthesis.row.id === current.id) continue;
    if (compareCreatedAt(synthesis.row.created_at, current.created_at) <= 0) continue;
    if (compareCreatedAt(candidate.created_at, synthesis.row.created_at) > 0) continue;
    if (synthesisBasisIncludes(synthesis.row, candidate.id)) return true;
    const selector = synthesis.row.synthesis.target_selector;
    if (selector !== undefined && matchesRowSelector(candidate, selector)) return true;
  }
  return false;
}

function synthesisBasisIncludes(synthesis: SynthesisRow, id: string): boolean {
  const basis = synthesis.synthesis.basis;
  return (
    basis.claim_ids?.includes(id) === true ||
    basis.question_ids?.includes(id) === true ||
    basis.source_ids?.includes(id) === true
  );
}

function compareCreatedAt(a: string, b: string): number {
  const aTime = Date.parse(a);
  const bTime = Date.parse(b);
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return a.localeCompare(b);
}

function filterRowsAsOf(loaded: LoadedRow[], asOf: string | undefined): LoadedRow[] {
  if (asOf === undefined) return loaded;
  const cutoff = Date.parse(asOf);
  if (Number.isNaN(cutoff)) {
    throw knbError("invalid_arguments", "Invalid asOf timestamp", { asOf });
  }
  return loaded.filter((item) => {
    const createdAt = Date.parse(item.row.created_at);
    if (Number.isNaN(createdAt)) return true;
    return createdAt <= cutoff;
  });
}

function resolveCanonicalId(id: string, canonicalIdByDuplicate: Map<string, string>): string {
  if (typeof id !== "string" || id.length === 0) return id;
  const seen = new Set<string>();
  let current = id;
  while (true) {
    if (seen.has(current)) return id;
    seen.add(current);
    const next = canonicalIdByDuplicate.get(current);
    if (typeof next !== "string" || next.length === 0 || next === current) return current;
    current = next;
  }
}

function applyInactivation(
  idMap: Map<string, InternalRow>,
  targetId: string,
  status: EffectiveStatus,
  reason: string,
  changeId: string,
  warnings: StateWarning[],
  explanationHistory: Map<string, StateExplanationEntry[]>,
  historyEntry: StateExplanationEntry,
  line: number,
): void {
  if (typeof targetId !== "string" || targetId.length === 0) return;
  const target = idMap.get(targetId);
  if (!target) {
    warnings.push({
      code: "change_target_missing",
      message: `Change target ${targetId} not found`,
      change_id: changeId,
      target_id: targetId,
      line,
    });
    return;
  }
  pushHistory(explanationHistory, targetId, historyEntry);
  if (target.status !== "active") {
    warnings.push({
      code: "change_target_inactive",
      message: `Change target ${targetId} already inactive (status: ${target.status})`,
      change_id: changeId,
      target_id: targetId,
      line,
    });
    return;
  }
  target.status = status;
  target.reason = reason;
  target.by_change_id = changeId;
}

function pushHistory(
  store: Map<string, StateExplanationEntry[]>,
  id: string,
  entry: StateExplanationEntry,
): void {
  const list = store.get(id) ?? [];
  list.push(entry);
  store.set(id, list);
}

function pushIndex(
  store: Map<string, EffectiveRelation[]>,
  key: string,
  edge: EffectiveRelation,
): void {
  const list = store.get(key) ?? [];
  list.push(edge);
  store.set(key, list);
}

function toEffectiveRow(internal: InternalRow): EffectiveRow {
  const out: EffectiveRow = { row: internal.row, status: internal.status };
  if (internal.reason !== undefined) out.reason = internal.reason;
  if (internal.by_change_id !== undefined) out.by_change_id = internal.by_change_id;
  if (internal.intrinsic_archived) out.intrinsic_archived = true;
  return out;
}

function summarizePatch(patch: Array<Record<string, unknown>>): string {
  if (!Array.isArray(patch) || patch.length === 0) return "(empty patch)";
  const ops: string[] = [];
  for (const entry of patch) {
    if (!entry || typeof entry !== "object") continue;
    const op = typeof entry.op === "string" ? entry.op : "?";
    const path = typeof entry.path === "string" ? entry.path : "";
    ops.push(path ? `${op} ${path}` : op);
  }
  return ops.join("; ");
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/query.ts
```ts
import type {
  ClaimRow,
  KnbRow,
  KnbRowKind,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "./contract";
import { knbError } from "./errors";
import { normalizeStatement } from "./novelty";
import {
  matchesRowSelector,
  type RowSelectorExternalRef,
  type RowSelectorValue,
  structuredClaimSelectorFromRequest,
} from "./selectors";
import { buildSourceCitationIndex } from "./source-citations";
import type { EffectiveRow, EffectiveState, EffectiveStatus, StateExplanation } from "./state";

export type QueryRequest = {
  ids?: string[];
  kinds?: KnbRowKind[];
  collection?: string;
  subject?: string;
  tag?: string;
  text?: string;
  claimKey?: string;
  claimType?: string;
  predicate?: string;
  qualifiers?: Record<string, RowSelectorValue>;
  externalRefs?: RowSelectorExternalRef[];
  citing?: string;
  asOf?: string;
  status?: EffectiveStatus;
  includeHistory?: boolean;
  full?: boolean;
  limit?: number;
};

export type QueryRow = {
  id: string;
  kind: KnbRowKind;
  score: number;
  status: EffectiveStatus;
  text?: string;
  confidence?: string;
  source_ids?: string[];
  time?: string;
  row?: KnbRow;
};

export type QueryResult = {
  rows: QueryRow[];
  total_matched: number;
  total_returned: number;
};

export type GetRequest = {
  ids: string[];
  asOf?: string;
  includeHistory?: boolean;
  explain?: boolean;
};

export type GetRow = {
  id: string;
  status: EffectiveStatus;
  row: KnbRow;
  reason?: string;
  explanation?: StateExplanation;
};

export type GetResult = {
  rows: GetRow[];
  not_found: string[];
};

const HISTORY_STATUSES: EffectiveStatus[] = [
  "active",
  "retracted",
  "superseded",
  "duplicate",
  "archived",
  "invalid",
];

const TEXT_FIELD_KINDS: KnbRowKind[] = ["claim", "source", "question", "synthesis"];

export function executeQuery(state: EffectiveState, request: QueryRequest): QueryResult {
  const candidates = collectCandidates(state, request);
  const filtered = applyScopeFilters(candidates, request);
  const structuredFiltered = applyStructuredFilters(filtered, request);
  const kindFiltered = applyKindFilter(structuredFiltered, request);
  const citationFiltered = applyCitingFilter(kindFiltered, state, request);

  const hasIdTerm = Array.isArray(request.ids) && request.ids.length > 0;
  const hasClaimKeyTerm = typeof request.claimKey === "string" && request.claimKey.length > 0;
  const normalizedQuery = normalizeStatement(request.text ?? "");
  const hasTextTerm = normalizedQuery.length > 0;
  const hasAnyTerm = hasIdTerm || hasClaimKeyTerm || hasTextTerm;
  const idSet = hasIdTerm ? new Set(request.ids) : undefined;

  const scored: Array<{ effective: EffectiveRow; score: number; index: number }> = [];
  for (let index = 0; index < citationFiltered.length; index += 1) {
    const effective = citationFiltered[index];
    if (!effective) continue;
    const score = scoreRow(effective.row, {
      idSet,
      claimKey: hasClaimKeyTerm ? request.claimKey : undefined,
      normalizedQuery: hasTextTerm ? normalizedQuery : undefined,
      hasAnyTerm,
    });
    if (hasAnyTerm && score === 0) continue;
    scored.push({ effective, score, index });
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.index - b.index;
  });

  const totalMatched = scored.length;
  const limited = typeof request.limit === "number" && request.limit >= 0 ? scored.slice(0, request.limit) : scored;

  const rows: QueryRow[] = limited.map((entry) =>
    buildQueryRow(entry.effective, entry.score, request.full === true, state)
  );

  return {
    rows,
    total_matched: totalMatched,
    total_returned: rows.length,
  };
}

export function executeGet(state: EffectiveState, request: GetRequest): GetResult {
  const ids = Array.isArray(request.ids) ? request.ids : [];
  const rows: GetRow[] = [];
  const notFound: string[] = [];
  const includeHistory = request.includeHistory === true;

  for (const id of ids) {
    const effective = state.get(id, { includeHistory: true });
    if (!effective) {
      notFound.push(id);
      continue;
    }
    if (effective.status !== "active" && !includeHistory) {
      notFound.push(id);
      continue;
    }
    const entry: GetRow = {
      id,
      status: effective.status,
      row: effective.row,
    };
    if (effective.reason !== undefined) entry.reason = effective.reason;
    if (request.explain === true) {
      const explanation = state.explain(id);
      if (explanation) entry.explanation = explanation;
    }
    rows.push(entry);
  }

  if (ids.length > 0 && rows.length === 0) {
    throw knbError("not_found", "No matching rows", { ids });
  }

  return { rows, not_found: notFound };
}

function applyStructuredFilters(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  const selector = structuredClaimSelectorFromRequest(request);
  if (selector === undefined) return rows;
  return rows.filter((effective) => matchesRowSelector(effective.row, selector));
}

function collectCandidates(state: EffectiveState, request: QueryRequest): EffectiveRow[] {
  if (request.includeHistory === true) {
    const merged: EffectiveRow[] = [];
    const seen = new Set<string>();
    for (const status of HISTORY_STATUSES) {
      for (const effective of state.rows({ status, includeChanges: true })) {
        if (seen.has(effective.row.id)) continue;
        seen.add(effective.row.id);
        merged.push(effective);
      }
    }
    return merged;
  }
  const status = request.status ?? "active";
  return state.rows({ status, includeChanges: true });
}

function applyScopeFilters(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  if (!request.collection && !request.subject && !request.tag) return rows;
  return rows.filter((effective) => {
    const scope = effective.row.scope;
    if (request.collection && !scope.collections?.includes(request.collection)) return false;
    if (request.subject && !scope.subjects?.includes(request.subject)) return false;
    if (request.tag && !scope.tags?.includes(request.tag)) return false;
    return true;
  });
}

function applyKindFilter(rows: EffectiveRow[], request: QueryRequest): EffectiveRow[] {
  const kinds = request.kinds;
  if (Array.isArray(kinds) && kinds.length > 0) {
    const allowed = new Set(kinds);
    return rows.filter((effective) => allowed.has(effective.row.kind));
  }
  if (request.includeHistory === true) return rows;
  return rows.filter((effective) => effective.row.kind !== "change");
}

function applyCitingFilter(rows: EffectiveRow[], state: EffectiveState, request: QueryRequest): EffectiveRow[] {
  const uri = typeof request.citing === "string" ? request.citing.trim() : "";
  if (uri.length === 0) return rows;
  const citedIds = new Set(buildSourceCitationIndex(state)[uri] ?? []);
  if (citedIds.size === 0) return [];
  return rows.filter((effective) => effective.row.kind === "claim" && citedIds.has(effective.row.id));
}

type ScoreContext = {
  idSet: Set<string> | undefined;
  claimKey: string | undefined;
  normalizedQuery: string | undefined;
  hasAnyTerm: boolean;
};

function scoreRow(row: KnbRow, ctx: ScoreContext): number {
  if (!ctx.hasAnyTerm) return 1;
  let best = 0;
  if (ctx.idSet && ctx.idSet.has(row.id)) best = Math.max(best, 100);
  if (ctx.claimKey !== undefined && row.kind === "claim") {
    const key = (row as ClaimRow).identity?.claim_key;
    if (typeof key === "string" && key === ctx.claimKey) best = Math.max(best, 90);
  }
  if (ctx.normalizedQuery !== undefined && TEXT_FIELD_KINDS.includes(row.kind)) {
    let textBest = 0;
    for (const value of textFieldsFor(row)) {
      const fieldScore = scoreTextField(value, ctx.normalizedQuery);
      if (fieldScore > textBest) textBest = fieldScore;
      if (textBest === 80) break;
    }
    if (textBest > best) best = textBest;
  }
  return best;
}

function scoreTextField(value: string | undefined, query: string): number {
  if (!value) return 0;
  const normalized = normalizeStatement(value);
  if (!normalized) return 0;
  if (normalized === query) return 80;
  if (containsWholeWord(normalized, query)) return 60;
  if (normalized.includes(query)) return 40;
  return 0;
}

function containsWholeWord(haystack: string, needle: string): boolean {
  if (!needle) return false;
  let from = 0;
  while (true) {
    const index = haystack.indexOf(needle, from);
    if (index === -1) return false;
    const before = index === 0 ? " " : haystack.charAt(index - 1);
    const afterIndex = index + needle.length;
    const after = afterIndex >= haystack.length ? " " : haystack.charAt(afterIndex);
    if (!isWordChar(before) && !isWordChar(after)) return true;
    from = index + 1;
  }
}

function isWordChar(ch: string): boolean {
  if (ch.length === 0) return false;
  const code = ch.codePointAt(0);
  if (code === undefined) return false;
  if (code >= 48 && code <= 57) return true;
  if (code >= 65 && code <= 90) return true;
  if (code >= 97 && code <= 122) return true;
  if (code >= 0x0600 && code <= 0x06ff) return true;
  if (code >= 0x0750 && code <= 0x077f) return true;
  if (code >= 0xfb50 && code <= 0xfdff) return true;
  if (code >= 0xfe70 && code <= 0xfeff) return true;
  if (ch === "_") return true;
  return /[\p{L}\p{N}]/u.test(ch);
}

function textFieldsFor(row: KnbRow): string[] {
  if (row.kind === "claim") {
    const statement = (row as ClaimRow).claim?.statement;
    return typeof statement === "string" ? [statement] : [];
  }
  if (row.kind === "source") {
    const title = (row as SourceRow).source?.title;
    return typeof title === "string" ? [title] : [];
  }
  if (row.kind === "question") {
    const text = (row as QuestionRow).question?.text;
    return typeof text === "string" ? [text] : [];
  }
  if (row.kind === "synthesis") {
    const synth = (row as SynthesisRow).synthesis;
    const fields: string[] = [];
    if (typeof synth?.title === "string") fields.push(synth.title);
    if (typeof synth?.summary === "string") fields.push(synth.summary);
    return fields;
  }
  return [];
}

function buildQueryRow(
  effective: EffectiveRow,
  score: number,
  full: boolean,
  state: EffectiveState,
): QueryRow {
  const row = effective.row;
  const out: QueryRow = {
    id: row.id,
    kind: row.kind,
    score,
    status: effective.status,
  };
  const text = displayTextFor(row);
  if (text !== undefined) out.text = text;
  const confidence = confidenceFor(row);
  if (confidence !== undefined) out.confidence = confidence;
  const sourceIds = sourceIdsFor(row, state);
  if (sourceIds.length > 0) out.source_ids = sourceIds;
  const time = timeFor(row);
  if (time !== undefined) out.time = time;
  if (full) out.row = row;
  return out;
}

function displayTextFor(row: KnbRow): string | undefined {
  if (row.kind === "claim") {
    const statement = (row as ClaimRow).claim?.statement;
    return typeof statement === "string" ? statement : undefined;
  }
  if (row.kind === "source") {
    const title = (row as SourceRow).source?.title;
    return typeof title === "string" ? title : undefined;
  }
  if (row.kind === "question") {
    const text = (row as QuestionRow).question?.text;
    return typeof text === "string" ? text : undefined;
  }
  if (row.kind === "synthesis") {
    const title = (row as SynthesisRow).synthesis?.title;
    return typeof title === "string" ? title : undefined;
  }
  return undefined;
}

function confidenceFor(row: KnbRow): string | undefined {
  if (row.kind !== "claim") return undefined;
  const confidence = (row as ClaimRow).assessment?.confidence;
  return typeof confidence === "string" ? confidence : undefined;
}

function canonicalSourceIds(ids: Iterable<string | undefined>, state: EffectiveState): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    out.add(state.canonicalIdOf(id));
  }
  return [...out];
}

function sourceIdsFor(row: KnbRow, state: EffectiveState): string[] {
  if (row.kind === "claim") {
    const claim = row as ClaimRow;
    return canonicalSourceIds(
      [
        ...(claim.provenance?.source_ids ?? []),
        ...(claim.provenance?.evidence ?? []).map((evidence) => evidence?.source_id),
      ],
      state,
    );
  }
  if (row.kind === "synthesis") {
    const ids = (row as SynthesisRow).synthesis?.basis?.source_ids ?? [];
    return canonicalSourceIds(ids, state);
  }
  if (row.kind === "question") {
    const ids = (row as QuestionRow).provenance?.source_ids ?? [];
    return canonicalSourceIds(ids, state);
  }
  return [];
}

function timeFor(row: KnbRow): string | undefined {
  if (row.kind === "claim") {
    const time = (row as ClaimRow).time;
    return firstString(time?.valid_at, time?.occurred_at, time?.first_observed_at);
  }
  if (row.kind === "source") {
    const published = (row as SourceRow).source?.published_at;
    return typeof published === "string" && published.length > 0 ? published : undefined;
  }
  if (row.kind === "question") {
    const observed = (row as QuestionRow).time?.first_observed_at;
    return typeof observed === "string" && observed.length > 0 ? observed : undefined;
  }
  return undefined;
}

function firstString(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/knb.ts
```ts
// Knb facade - V1 public library entry point.
// Composes workspace, ledger, contract, read-snapshot, apply, query, context,
// novelty, and projections into one object that the CLI and host applications
// call.

import { randomBytes } from "node:crypto";
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, relative } from "node:path";

import { applyOperations, previewApplyOperations, type ApplyResult } from "./apply";
import {
  buildContext,
  type ContextRequest,
  type ContextResult,
} from "./context";
import {
  jsonSchema,
  operationSamples,
  rowSamples,
  type ApplyOperation,
  type ApplyRequest as CoreApplyRequest,
  type ClaimRow,
  type DraftRow,
  type KnbRow,
  type QuestionRow,
  type SourceRow,
  type SynthesisRow,
  type ValidationIssue,
} from "./contract";
import { knbError } from "./errors";
import type { LedgerFingerprint, ParseIssue } from "./ledger";
import {
  classifyClaim,
  type CandidateClaim,
  type NoveltyResult,
} from "./novelty";
import {
  profileSamples,
  profileSchema,
  type KnbProfileFile,
} from "./profiles";
import {
  JsonProjectionArtifactStore,
  type FreshnessReport,
  type IndexResult,
  type RenderAllRequest,
  type RenderAllResult,
  type RenderRequest,
  type RenderResult,
} from "./projections";
import { readRunManifests, type RunManifest } from "./run-manifests";
import {
  executeGet,
  executeQuery,
  type GetRequest,
  type GetResult,
  type QueryRequest,
  type QueryResult,
} from "./query";
import {
  readSnapshot,
  type KnbReadSnapshot,
  type ProjectionFreshness,
  type ReadSnapshotOptions,
} from "./read-snapshot";
import { buildEffectiveState, type EffectiveState, type StateWarning } from "./state";
import { rowSelectorSamples, rowSelectorSchema, type RowSelector } from "./selectors";
import { openWorkspace, type KnbWorkspace, type OpenWorkspaceOptions } from "./workspace";

export { ROW_KINDS } from "./contract";

export type KnbRuntime = {
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
};

export type OpenKnbOptions = {
  root?: string;
  configPath?: string;
  ledgerPath?: string;
  actor?: string;
  runtime?: Partial<KnbRuntime>;
  env?: NodeJS.ProcessEnv;
  cwd?: () => string;
};

export type KnbStatus = {
  workspace_root: string;
  ledger_path: string;
  schema_version: "knb.v1";
  actor: string;
  row_count: number;
  parse_error_count: number;
  validation_error_count: number;
  validation_warning_count: number;
  state_warning_count: number;
  active_counts_by_kind: Record<string, number>;
  inactive_counts_by_status: Record<string, number>;
  projection_freshness: ProjectionFreshness;
  detailed?: DetailedStatus;
};

export type StatusOptions = {
  detailed?: boolean;
};

export type DuplicateSourceUriCluster = {
  uri: string;
  count: number;
  source_ids: string[];
};

export type DuplicateClaimKeyCluster = {
  claim_key: string;
  count: number;
  claim_ids: string[];
};

export type EvidenceDepthStats = {
  count: number;
  p50: number;
  p90: number;
  max: number;
};

export type DetailedStatus = {
  duplicate_source_uri_clusters: DuplicateSourceUriCluster[];
  duplicate_claim_key_clusters: DuplicateClaimKeyCluster[];
  evidence_depth: EvidenceDepthStats;
  novelty_active_distribution: Record<string, number>;
  syntheses_per_collection: Record<string, number>;
};

export type CollectionStatusRequest = {
  collection: string;
  maxQuestions?: number;
};

export type CollectionStatusResult = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  inactive_counts_by_status: Record<string, number>;
  latest_synthesis?: {
    id: string;
    title: string;
    created_at: string;
    summary: string;
    limitations?: string;
  };
  open_question_count: number;
  open_questions: Array<{
    id: string;
    text: string;
    created_at: string;
    priority?: "low" | "medium" | "high";
    why_it_matters?: string;
  }>;
};

export type CollectionSummary = {
  collection: string;
  active_counts_by_kind: Record<string, number>;
  latest_created_at?: string;
};

export type CollectionsResult = {
  collections: CollectionSummary[];
};

export type SchemaResult = {
  schema_version: "knb.v1";
  json_schema: object;
  selector_schema: object;
  profile_schema: object;
  selector_samples: RowSelector[];
  profile_samples: KnbProfileFile[];
  row_samples: KnbRow[];
  operation_samples: ApplyOperation[];
};

export type InitOptions = {
  force?: boolean;
  actor?: string;
};

export type InitResult = {
  workspace_root: string;
  created_paths: string[];
  ledger_path: string;
  config_path: string;
  schema_path: string;
};

export type CheckResult = {
  ok: boolean;
  parse_issues: ParseIssue[];
  validation_issues: ValidationIssue[];
  state_warnings: StateWarning[];
  projection_freshness: FreshnessReport;
  fingerprint: LedgerFingerprint;
};

export type NoveltyRequest = {
  candidates: CandidateClaim[];
};

export type ApplyRequest = Omit<CoreApplyRequest, "run_id"> & {
  runId?: string;
};

export type NoveltyBatchResult = {
  results: NoveltyResult[];
};

export type LogRequest = {
  actor?: string;
  since?: string;
  until?: string;
  limit?: number;
};

export type LogResult = {
  entries: RunManifest[];
  total_matched: number;
  total_returned: number;
};

export type Knb = {
  workspace: KnbWorkspace;
  runtime: KnbRuntime;
  init(options?: InitOptions): Promise<InitResult>;
  status(options?: StatusOptions): Promise<KnbStatus>;
  collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult>;
  collections(): Promise<CollectionsResult>;
  schema(): Promise<SchemaResult>;
  apply(request: ApplyRequest): Promise<ApplyResult>;
  previewApply(request: ApplyRequest): Promise<ApplyResult>;
  add(row: DraftRow): Promise<ApplyResult>;
  log(request?: LogRequest): Promise<LogResult>;
  get(ids: string[], options?: Omit<GetRequest, "ids">): Promise<GetResult>;
  query(request: QueryRequest): Promise<QueryResult>;
  context(request: ContextRequest): Promise<ContextResult>;
  novelty(request: NoveltyRequest): Promise<NoveltyBatchResult>;
  render(request: RenderRequest): Promise<RenderResult>;
  renderAll(request?: RenderAllRequest): Promise<RenderAllResult>;
  check(): Promise<CheckResult>;
  rebuildIndex(): Promise<IndexResult>;
};

export function defaultRuntime(): KnbRuntime {
  return {
    clock: () => new Date(),
    randomIdPart: (bytes: number) => randomBytes(bytes).toString("hex").slice(0, 8).toLowerCase(),
  };
}

export async function openKnb(options: OpenKnbOptions = {}): Promise<Knb> {
  const wsOptions: OpenWorkspaceOptions = {};
  if (options.root !== undefined) wsOptions.root = options.root;
  if (options.configPath !== undefined) wsOptions.configPath = options.configPath;
  if (options.ledgerPath !== undefined) wsOptions.ledgerPath = options.ledgerPath;
  if (options.actor !== undefined) wsOptions.actor = options.actor;
  if (options.env !== undefined) wsOptions.env = options.env;
  if (options.cwd !== undefined) wsOptions.cwd = options.cwd;

  const workspace = await openWorkspace(wsOptions);

  const baseRuntime = defaultRuntime();
  const runtime: KnbRuntime = {
    clock: options.runtime?.clock ?? baseRuntime.clock,
    randomIdPart: options.runtime?.randomIdPart ?? baseRuntime.randomIdPart,
  };

  return makeKnb(workspace, runtime);
}

function makeKnb(workspace: KnbWorkspace, runtime: KnbRuntime): Knb {
  const projectionArtifacts = new JsonProjectionArtifactStore(workspace, runtime.clock);
  const projectionFreshness = (_workspace: KnbWorkspace, ledger_fingerprint: LedgerFingerprint) =>
    projectionArtifacts.checkFreshness(ledger_fingerprint);

  const facade: Knb = {
    workspace,
    runtime,
    async init(initOptions: InitOptions = {}): Promise<InitResult> {
      return performInit(workspace, initOptions);
    },
    async status(options: StatusOptions = {}): Promise<KnbStatus> {
      const snapshot = await readSnapshot({ workspace, freshness: projectionFreshness });
      return statusFromSnapshot(workspace, snapshot, options);
    },
    async collectionStatus(request: CollectionStatusRequest): Promise<CollectionStatusResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "collectionStatus");
      return collectionStatusFromState(state, request);
    },
    async collections(): Promise<CollectionsResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "collections");
      return collectionsFromState(state);
    },
    async schema(): Promise<SchemaResult> {
      return buildSchemaResult();
    },
    async apply(request: ApplyRequest): Promise<ApplyResult> {
      return applyOperations(toCoreApplyRequest(request), {
        workspace,
        runtime,
        actor: workspace.actor,
        classifyNovelty: noveltyBridge,
      });
    },
    async previewApply(request: ApplyRequest): Promise<ApplyResult> {
      return previewApplyOperations(toCoreApplyRequest(request), {
        workspace,
        runtime,
        actor: workspace.actor,
        classifyNovelty: noveltyBridge,
      });
    },
    async add(row: DraftRow): Promise<ApplyResult> {
      const operation = { op: "add", row } as ApplyOperation;
      return facade.apply({ operations: [operation] });
    },
    async log(request: LogRequest = {}): Promise<LogResult> {
      return buildLog(workspace, request);
    },
    async get(ids: string[], getOptions: Omit<GetRequest, "ids"> = {}): Promise<GetResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, getOptions.asOf));
      const state = requireState(snapshot, "get");
      const request: GetRequest = { ids };
      if (getOptions.includeHistory !== undefined) request.includeHistory = getOptions.includeHistory;
      if (getOptions.explain !== undefined) request.explain = getOptions.explain;
      return executeGet(state, request);
    },
    async query(request: QueryRequest): Promise<QueryResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "query");
      return executeQuery(state, request);
    },
    async context(request: ContextRequest): Promise<ContextResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "context");
      return buildContext(state, request);
    },
    async novelty(request: NoveltyRequest): Promise<NoveltyBatchResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "novelty");
      const candidates = Array.isArray(request?.candidates) ? request.candidates : [];
      const results = candidates.map((candidate) => classifyClaim(candidate, state));
      return { results };
    },
    async render(request: RenderRequest): Promise<RenderResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "render");
      return projectionArtifacts.renderCollection(state, snapshot.fingerprint, request);
    },
    async renderAll(request: RenderAllRequest = {}): Promise<RenderAllResult> {
      const snapshot = await readSnapshot(readSnapshotOptions(workspace, false, request.asOf));
      const state = requireState(snapshot, "renderAll");
      return projectionArtifacts.renderAllCollections(state, snapshot.fingerprint, request);
    },
    async check(): Promise<CheckResult> {
      const snapshot = await readSnapshot({ workspace, freshness: projectionFreshness });
      return checkFromSnapshot(snapshot);
    },
    async rebuildIndex(): Promise<IndexResult> {
      const snapshot = await readSnapshot({ workspace, freshness: false });
      const state = requireState(snapshot, "rebuildIndex");
      return projectionArtifacts.rebuildIndexes(state, snapshot.fingerprint);
    },
  };
  return facade;
}

function toCoreApplyRequest(request: ApplyRequest): CoreApplyRequest {
  const { runId, ...rest } = request;
  const coreRequest: CoreApplyRequest = { ...rest };
  if (runId !== undefined) coreRequest.run_id = runId;
  return coreRequest;
}

function readSnapshotOptions(
  workspace: KnbWorkspace,
  freshness: Exclude<ReadSnapshotOptions["freshness"], undefined>,
  asOf: string | undefined,
): ReadSnapshotOptions {
  const options: ReadSnapshotOptions = { workspace, freshness };
  if (asOf !== undefined) options.asOf = asOf;
  return options;
}

async function buildLog(workspace: KnbWorkspace, request: LogRequest): Promise<LogResult> {
  const manifests = await readRunManifests(workspace);
  const actor = stringOption(request.actor);
  const since = parseLogDate(request.since, "since");
  const until = parseLogDate(request.until, "until");

  const filtered = manifests
    .filter((manifest) => actor === undefined || manifest.actor === actor)
    .filter((manifest) => {
      const completed = logTime(manifest.completed_at);
      if (!Number.isFinite(completed)) return false;
      if (since !== undefined && completed < since) return false;
      if (until !== undefined && completed > until) return false;
      return true;
    })
    .sort((a, b) => {
      const byTime = logTime(b.completed_at) - logTime(a.completed_at);
      if (byTime !== 0) return byTime;
      return a.run_id.localeCompare(b.run_id);
    });

  const limit = normalizeLogLimit(request.limit);
  const entries = filtered.slice(0, limit);
  return {
    entries,
    total_matched: filtered.length,
    total_returned: entries.length,
  };
}

function normalizeLogLimit(limit: number | undefined): number {
  if (limit === undefined) return 20;
  if (!Number.isFinite(limit)) return 20;
  return Math.max(0, Math.trunc(limit));
}

function parseLogDate(value: string | undefined, field: "since" | "until"): number | undefined {
  const trimmed = stringOption(value);
  if (trimmed === undefined) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) {
    throw knbError("validation_failed", `Invalid log ${field} timestamp`, { [field]: value });
  }
  return parsed;
}

function logTime(value: string): number {
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function stringOption(value: string | undefined): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const noveltyBridge: NonNullable<Parameters<typeof applyOperations>[1]["classifyNovelty"]> = (
  candidate,
  ledgerSnapshot,
) => {
  if (candidate.kind !== "claim") {
    return { classification: "new", matched_ids: [] };
  }
  const loaded = ledgerSnapshot.rows.map(({ row, line }) => ({ row, line }));
  const state = buildEffectiveState(loaded);
  const result = classifyClaim(candidate as CandidateClaim, state);
  return { classification: result.classification, matched_ids: result.matched_ids };
};

function requireState(snapshot: KnbReadSnapshot, op: string): EffectiveState {
  if (!snapshot.state) {
    const errors = snapshot.validation.issues.filter((issue) => issue.level === "error");
    const parseErrors = snapshot.ledger.parseIssues;
    if (parseErrors.length > 0) {
      throw knbError(
        "io_failed",
        `${op} requires a parseable ledger`,
        { path: snapshot.ledger.fingerprint.path, parse_issues: parseErrors },
      );
    }
    throw knbError(
      "validation_failed",
      `${op} requires a valid ledger`,
      { issues: errors },
    );
  }
  return snapshot.state;
}

async function performInit(workspace: KnbWorkspace, options: InitOptions): Promise<InitResult> {
  const created: string[] = [];
  const force = options.force === true;

  await ensureDir(workspace.root);

  const configPath = workspace.paths.config;
  const configExists = await pathExists(configPath);
  if (!configExists || force) {
    await ensureDir(dirname(configPath));
    const seedConfig = options.actor && options.actor.length > 0 ? { actor: options.actor } : {};
    await writeFile(configPath, `${JSON.stringify(seedConfig, null, 2)}\n`, "utf8");
    created.push(relativeToRoot(workspace.root, configPath));
  }

  const viewsDir = workspace.paths.views;
  const viewsExisted = await pathExists(viewsDir);
  await ensureDir(viewsDir);
  if (!viewsExisted) created.push(relativeToRoot(workspace.root, viewsDir));

  const indexesDir = workspace.paths.indexes;
  const indexesExisted = await pathExists(indexesDir);
  await ensureDir(indexesDir);
  if (!indexesExisted) created.push(relativeToRoot(workspace.root, indexesDir));

  const ledgerPath = workspace.paths.ledger;
  if (!(await pathExists(ledgerPath))) {
    await ensureDir(dirname(ledgerPath));
    await writeFile(ledgerPath, "", "utf8");
    created.push(relativeToRoot(workspace.root, ledgerPath));
  }

  const schemaPath = workspace.paths.schema;
  await ensureDir(dirname(schemaPath));
  const schemaText = `${JSON.stringify(jsonSchema(), null, 2)}\n`;
  await writeFile(schemaPath, schemaText, "utf8");
  created.push(relativeToRoot(workspace.root, schemaPath));

  return {
    workspace_root: workspace.root,
    created_paths: created,
    ledger_path: ledgerPath,
    config_path: configPath,
    schema_path: schemaPath,
  };
}

function statusFromSnapshot(
  workspace: KnbWorkspace,
  snapshot: KnbReadSnapshot,
  options: StatusOptions = {},
): KnbStatus {
  const activeCounts: Record<string, number> = {};
  if (snapshot.state) {
    const activeRows = snapshot.state.rows({ includeChanges: true });
    for (const er of activeRows) {
      const kind = er.row.kind;
      if (typeof kind !== "string") continue;
      activeCounts[kind] = (activeCounts[kind] ?? 0) + 1;
    }
  } else {
    for (const loaded of snapshot.ledger.rows) {
      const kind = (loaded.row as { kind?: unknown }).kind;
      if (typeof kind !== "string") continue;
      activeCounts[kind] = (activeCounts[kind] ?? 0) + 1;
    }
  }

  const inactiveCounts: Record<string, number> = {};
  if (snapshot.state) {
    for (const status of ["retracted", "superseded", "duplicate", "archived"] as const) {
      const count = snapshot.state.rows({ status, includeChanges: true }).length;
      if (count > 0) inactiveCounts[status] = count;
    }
  }

  const parseErrorCount = snapshot.ledger.parseIssues.filter((issue) => issue.level === "error").length;
  const validationErrorCount = snapshot.validation.issues.filter((issue) => issue.level === "error").length;
  const validationWarningCount = snapshot.validation.issues.filter((issue) => issue.level === "warning").length;
  const stateWarningCount = snapshot.state?.warnings.length ?? 0;

  const result: KnbStatus = {
    workspace_root: workspace.root,
    ledger_path: workspace.paths.ledger,
    schema_version: "knb.v1",
    actor: workspace.actor,
    row_count: snapshot.ledger.rows.length,
    parse_error_count: parseErrorCount,
    validation_error_count: validationErrorCount,
    validation_warning_count: validationWarningCount,
    state_warning_count: stateWarningCount,
    active_counts_by_kind: activeCounts,
    inactive_counts_by_status: inactiveCounts,
    projection_freshness: snapshot.projectionFreshness,
  };
  if (options.detailed === true && snapshot.state !== undefined) {
    result.detailed = detailedStatusFromState(snapshot.state);
  }
  return result;
}

function collectionsFromState(state: EffectiveState): CollectionsResult {
  const byCollection = new Map<string, CollectionSummary>();
  for (const er of state.rows({ includeChanges: true })) {
    const collections = er.row.scope.collections ?? [];
    for (const rawCollection of collections) {
      const collection = rawCollection.trim();
      if (collection.length === 0) continue;
      const summary = byCollection.get(collection) ?? {
        collection,
        active_counts_by_kind: {},
      };
      incrementCount(summary.active_counts_by_kind, er.row.kind);
      if (summary.latest_created_at === undefined || er.row.created_at > summary.latest_created_at) {
        summary.latest_created_at = er.row.created_at;
      }
      byCollection.set(collection, summary);
    }
  }
  return {
    collections: [...byCollection.values()].sort((a, b) => a.collection.localeCompare(b.collection)),
  };
}

function detailedStatusFromState(state: EffectiveState): DetailedStatus {
  const active = state.rows({ includeChanges: true }).map((er) => er.row);
  const activeSources = active.filter((row): row is SourceRow => row.kind === "source");
  const activeClaims = active.filter((row): row is ClaimRow => row.kind === "claim");
  const collections = collectionsFromState(state).collections;

  return {
    duplicate_source_uri_clusters: duplicateSourceUriClusters(activeSources),
    duplicate_claim_key_clusters: duplicateClaimKeyClusters(activeClaims),
    evidence_depth: evidenceDepthStats(activeClaims),
    novelty_active_distribution: noveltyDistribution(activeClaims),
    syntheses_per_collection: synthesesPerCollection(collections),
  };
}

function duplicateSourceUriClusters(rows: SourceRow[]): DuplicateSourceUriCluster[] {
  const byUri = new Map<string, string[]>();
  for (const row of rows) {
    const uri = typeof row.source.uri === "string" ? row.source.uri.trim() : "";
    if (uri.length === 0) continue;
    const ids = byUri.get(uri) ?? [];
    ids.push(row.id);
    byUri.set(uri, ids);
  }
  return [...byUri.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([uri, ids]) => ({ uri, count: ids.length, source_ids: ids }));
}

function duplicateClaimKeyClusters(rows: ClaimRow[]): DuplicateClaimKeyCluster[] {
  const byKey = new Map<string, string[]>();
  for (const row of rows) {
    const key = typeof row.identity.claim_key === "string" ? row.identity.claim_key.trim() : "";
    if (key.length === 0) continue;
    const ids = byKey.get(key) ?? [];
    ids.push(row.id);
    byKey.set(key, ids);
  }
  return [...byKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([claim_key, ids]) => ({ claim_key, count: ids.length, claim_ids: ids }));
}

function evidenceDepthStats(rows: ClaimRow[]): EvidenceDepthStats {
  const depths = rows.map(evidenceDepth).sort((a, b) => a - b);
  if (depths.length === 0) return { count: 0, p50: 0, p90: 0, max: 0 };
  return {
    count: depths.length,
    p50: percentileNearestRank(depths, 0.5),
    p90: percentileNearestRank(depths, 0.9),
    max: depths[depths.length - 1] as number,
  };
}

function evidenceDepth(row: ClaimRow): number {
  const sourceIds = new Set<string>();
  for (const id of row.provenance.source_ids ?? []) {
    if (typeof id === "string" && id.length > 0) sourceIds.add(id);
  }
  for (const evidence of row.provenance.evidence ?? []) {
    if (typeof evidence.source_id === "string" && evidence.source_id.length > 0) {
      sourceIds.add(evidence.source_id);
    }
  }
  return sourceIds.size;
}

function percentileNearestRank(sortedAscending: number[], percentile: number): number {
  if (sortedAscending.length === 0) return 0;
  const rank = Math.max(1, Math.ceil(percentile * sortedAscending.length));
  return sortedAscending[Math.min(rank - 1, sortedAscending.length - 1)] as number;
}

function noveltyDistribution(rows: ClaimRow[]): Record<string, number> {
  const distribution: Record<string, number> = {};
  for (const row of rows) {
    const novelty = row.identity.novelty;
    if (typeof novelty !== "string" || novelty.length === 0) continue;
    incrementCount(distribution, novelty);
  }
  return sortedRecord(distribution);
}

function synthesesPerCollection(collections: CollectionSummary[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const entry of collections) {
    const count = entry.active_counts_by_kind.synthesis ?? 0;
    if (count > 0) counts[entry.collection] = count;
  }
  return counts;
}

function collectionStatusFromState(
  state: EffectiveState,
  request: CollectionStatusRequest,
): CollectionStatusResult {
  const collection = typeof request.collection === "string" ? request.collection.trim() : "";
  if (collection.length === 0) {
    throw knbError("validation_failed", "Collection status requires a non-empty collection", {
      collection: request.collection,
    });
  }

  const activeRows = state.rows({ collection, includeChanges: true });
  const activeCounts: Record<string, number> = {};
  for (const er of activeRows) {
    incrementCount(activeCounts, er.row.kind);
  }

  const inactiveCounts: Record<string, number> = {};
  for (const status of ["retracted", "superseded", "duplicate", "archived"] as const) {
    const count = state.rows({ status, collection, includeChanges: true }).length;
    if (count > 0) inactiveCounts[status] = count;
  }

  const activeContentRows = state.rows({ collection, includeChanges: false });
  const latestSynthesis = activeContentRows
    .map((er) => er.row)
    .filter((row): row is SynthesisRow => row.kind === "synthesis" && row.synthesis.status === "active")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

  const openQuestions = activeContentRows
    .map((er) => er.row)
    .filter((row): row is QuestionRow => row.kind === "question" && row.question.status === "open")
    .sort(byQuestionPriorityThenCreated);

  const maxQuestions =
    typeof request.maxQuestions === "number" && Number.isFinite(request.maxQuestions)
      ? Math.max(0, Math.floor(request.maxQuestions))
      : 12;

  const result: CollectionStatusResult = {
    collection,
    active_counts_by_kind: activeCounts,
    inactive_counts_by_status: inactiveCounts,
    open_question_count: openQuestions.length,
    open_questions: openQuestions.slice(0, maxQuestions).map((row) => ({
      id: row.id,
      text: row.question.text,
      created_at: row.created_at,
      ...(row.question.priority !== undefined ? { priority: row.question.priority } : {}),
      ...(row.question.why_it_matters !== undefined
        ? { why_it_matters: row.question.why_it_matters }
        : {}),
    })),
  };

  if (latestSynthesis !== undefined) {
    result.latest_synthesis = {
      id: latestSynthesis.id,
      title: latestSynthesis.synthesis.title,
      created_at: latestSynthesis.created_at,
      summary: latestSynthesis.synthesis.summary,
      ...(latestSynthesis.synthesis.limitations !== undefined
        ? { limitations: latestSynthesis.synthesis.limitations }
        : {}),
    };
  }

  return result;
}

function incrementCount(counts: Record<string, number>, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function sortedRecord(record: Record<string, number>): Record<string, number> {
  const sorted: Record<string, number> = {};
  for (const key of Object.keys(record).sort()) sorted[key] = record[key] as number;
  return sorted;
}

function byQuestionPriorityThenCreated(a: QuestionRow, b: QuestionRow): number {
  return questionPriorityWeight(b.question.priority) - questionPriorityWeight(a.question.priority)
    || b.created_at.localeCompare(a.created_at);
}

function questionPriorityWeight(priority: QuestionRow["question"]["priority"]): number {
  if (priority === "high") return 3;
  if (priority === "medium") return 2;
  if (priority === "low") return 1;
  return 0;
}

function checkFromSnapshot(snapshot: KnbReadSnapshot): CheckResult {
  const parseIssues = [...snapshot.ledger.parseIssues];
  const validationIssues = [...snapshot.validation.issues];
  const stateWarnings = snapshot.state?.warnings ?? [];
  const projectionFreshness = snapshot.projectionFreshness;

  const hasParseError = parseIssues.length > 0;
  const hasValidationError = validationIssues.some((issue) => issue.level === "error");
  const projectionBroken = projectionFreshness.entries.some(
    (entry) => entry.state === "stale" || entry.state === "missing",
  );

  return {
    ok: !hasParseError && !hasValidationError && !projectionBroken,
    parse_issues: parseIssues,
    validation_issues: validationIssues,
    state_warnings: [...stateWarnings],
    projection_freshness: projectionFreshness,
    fingerprint: snapshot.fingerprint,
  };
}

function buildSchemaResult(): SchemaResult {
  const samples = rowSamples();
  const ops = operationSamples();
  return {
    schema_version: "knb.v1",
    json_schema: jsonSchema(),
    selector_schema: rowSelectorSchema(),
    profile_schema: profileSchema(),
    selector_samples: rowSelectorSamples(),
    profile_samples: profileSamples(),
    row_samples: [samples.source, samples.claim, samples.question, samples.synthesis, samples.change],
    operation_samples: [ops.add, ops.retract, ops.supersede, ops.merge, ops.relate, ops.patch],
  };
}

async function ensureDir(dir: string): Promise<void> {
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    throw knbError("io_failed", `Failed to create directory: ${dir}`, { path: dir }, error);
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return false;
    return false;
  }
}

function relativeToRoot(root: string, path: string): string {
  const rel = relative(root, path);
  return rel.length === 0 ? "." : rel;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/projections.ts
```ts
import type { Dirent } from "node:fs";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join, normalize, relative, resolve, sep } from "node:path";

import type {
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
  Assessment,
} from "./contract";
import { knbError } from "./errors";
import type { LedgerFingerprint } from "./ledger";
import { buildSourceCitationIndex } from "./source-citations";
import type { EffectiveRow, EffectiveState } from "./state";
import type { KnbWorkspace } from "./workspace";

export type RenderFormat = "md";

export type RenderRequest = {
  collection: string;
  format?: RenderFormat;
  out?: string;
  asOf?: string;
};

export type RenderAllRequest = {
  format?: RenderFormat;
  asOf?: string;
};

export type ProjectionKind = "view" | "index";

export type ProjectionClock = () => Date;

export type ProjectionWriteOptions = {
  clock?: ProjectionClock;
};

export type ProjectionMetadata = {
  schema_version: "knb.projection.v1";
  kind: ProjectionKind;
  target: string;
  ledger: {
    path: string;
    rows: number;
    last_row_id?: string;
    content_hash: string;
  };
  options: Record<string, unknown>;
  generated_at: string;
};

export type RenderResult = {
  collection: string;
  format: RenderFormat;
  path: string;
  bytes_written: number;
  metadata_path: string;
  metadata: ProjectionMetadata;
};

export type RenderAllResult = {
  collections: string[];
  rendered: RenderResult[];
  total_bytes_written: number;
};

export type IndexResult = {
  indexes: Array<{
    name: string;
    path: string;
    bytes_written: number;
    metadata_path: string;
    metadata: ProjectionMetadata;
  }>;
};

export type FreshnessRequest = {
  workspace: KnbWorkspace;
  ledger_fingerprint: LedgerFingerprint;
};

export type FreshnessEntry = {
  kind: ProjectionKind;
  target: string;
  state: "fresh" | "stale" | "missing" | "unknown";
  metadata_path?: string;
  ledger_hash?: string;
  generated_at?: string;
};

export type FreshnessReport = {
  entries: FreshnessEntry[];
};

export type ProjectionArtifactStore = {
  renderCollection(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderRequest,
  ): Promise<RenderResult>;
  renderAllCollections(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request?: RenderAllRequest,
  ): Promise<RenderAllResult>;
  rebuildIndexes(state: EffectiveState, ledger_fingerprint: LedgerFingerprint): Promise<IndexResult>;
  checkFreshness(ledger_fingerprint: LedgerFingerprint): Promise<FreshnessReport>;
};

export type ClaimKeyCluster = {
  claim_key: string;
  claims: ClaimRow[];
};

export type ClaimKeyClusters = {
  keyed: ClaimKeyCluster[];
  unkeyed: ClaimRow[];
};

export const V1_INDEX_NAMES = [
  "active-by-id",
  "active-by-collection",
  "active-claims-by-key",
  "active-sources-by-uri",
  "active-sources-by-content-hash",
  "active-claims-by-source-uri",
] as const;

export type V1IndexName = (typeof V1_INDEX_NAMES)[number];

export class JsonProjectionArtifactStore implements ProjectionArtifactStore {
  constructor(
    private readonly workspace: KnbWorkspace,
    private readonly clock: ProjectionClock = () => new Date(),
  ) {}

  renderCollection(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderRequest,
  ): Promise<RenderResult> {
    return renderCollection(state, this.workspace, ledger_fingerprint, request, { clock: this.clock });
  }

  renderAllCollections(
    state: EffectiveState,
    ledger_fingerprint: LedgerFingerprint,
    request: RenderAllRequest = {},
  ): Promise<RenderAllResult> {
    return renderAllCollections(state, this.workspace, ledger_fingerprint, request, { clock: this.clock });
  }

  rebuildIndexes(state: EffectiveState, ledger_fingerprint: LedgerFingerprint): Promise<IndexResult> {
    return rebuildIndexes(state, this.workspace, ledger_fingerprint, { clock: this.clock });
  }

  checkFreshness(ledger_fingerprint: LedgerFingerprint): Promise<FreshnessReport> {
    return checkFreshness({ workspace: this.workspace, ledger_fingerprint });
  }
}

export async function renderCollection(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  request: RenderRequest,
  options: ProjectionWriteOptions = {},
): Promise<RenderResult> {
  const collection = typeof request.collection === "string" ? request.collection.trim() : "";
  if (collection.length === 0) {
    throw knbError("validation_failed", "Render request requires a non-empty collection", {
      collection: request.collection,
    });
  }
  const format: RenderFormat = request.format ?? "md";
  if (format !== "md") {
    throw knbError("validation_failed", `Unsupported render format: ${format}`, { format });
  }

  const outPath = resolveViewPath(workspace, collection, request.out);

  const body = buildMarkdown(state, collection, ledger_fingerprint);
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, body, "utf8");
  const bytesWritten = Buffer.byteLength(body, "utf8");

  const metadata: ProjectionMetadata = {
    schema_version: "knb.projection.v1",
    kind: "view",
    target: workspaceRelative(workspace, outPath),
    ledger: ledgerMeta(ledger_fingerprint),
    options: projectionOptions({ collection, format, asOf: request.asOf }),
    generated_at: projectionTimestamp(options),
  };
  const metadataPath = `${outPath}.meta.json`;
  await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

  return {
    collection,
    format,
    path: outPath,
    bytes_written: bytesWritten,
    metadata_path: metadataPath,
    metadata,
  };
}

export async function renderAllCollections(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  request: RenderAllRequest = {},
  options: ProjectionWriteOptions = {},
): Promise<RenderAllResult> {
  const format: RenderFormat = request.format ?? "md";
  if (format !== "md") {
    throw knbError("validation_failed", `Unsupported render format: ${format}`, { format });
  }

  const collections = activeCollectionNames(state);
  const rendered: RenderResult[] = [];
  for (const collection of collections) {
    const renderRequest: RenderRequest = { collection, format };
    if (request.asOf !== undefined) renderRequest.asOf = request.asOf;
    rendered.push(await renderCollection(state, workspace, ledger_fingerprint, renderRequest, options));
  }

  return {
    collections,
    rendered,
    total_bytes_written: rendered.reduce((sum, entry) => sum + entry.bytes_written, 0),
  };
}

export async function rebuildIndexes(
  state: EffectiveState,
  workspace: KnbWorkspace,
  ledger_fingerprint: LedgerFingerprint,
  options: ProjectionWriteOptions = {},
): Promise<IndexResult> {
  const activeRows = state.rows({ status: "active", includeChanges: false });
  const indexesDir = workspace.paths.indexes;
  await mkdir(indexesDir, { recursive: true });

  const builders: Record<V1IndexName, () => unknown> = {
    "active-by-id": () => buildActiveById(activeRows),
    "active-by-collection": () => buildActiveByCollection(activeRows),
    "active-claims-by-key": () => buildActiveClaimsByKey(activeRows),
    "active-sources-by-uri": () => buildActiveSourcesByUri(activeRows),
    "active-sources-by-content-hash": () => buildActiveSourcesByContentHash(activeRows),
    "active-claims-by-source-uri": () => buildSourceCitationIndex(state),
  };

  const generated_at = projectionTimestamp(options);
  const ledger = ledgerMeta(ledger_fingerprint);

  const out: IndexResult["indexes"] = [];
  for (const name of V1_INDEX_NAMES) {
    const data = builders[name]();
    const filePath = join(indexesDir, `${name}.json`);
    const body = `${JSON.stringify(data, null, 2)}\n`;
    await writeFile(filePath, body, "utf8");
    const bytesWritten = Buffer.byteLength(body, "utf8");

    const metadata: ProjectionMetadata = {
      schema_version: "knb.projection.v1",
      kind: "index",
      target: workspaceRelative(workspace, filePath),
      ledger,
      options: { name },
      generated_at,
    };
    const metadataPath = `${filePath}.meta.json`;
    await writeFile(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`, "utf8");

    out.push({
      name,
      path: filePath,
      bytes_written: bytesWritten,
      metadata_path: metadataPath,
      metadata,
    });
  }

  return { indexes: out };
}

export async function checkFreshness(request: FreshnessRequest): Promise<FreshnessReport> {
  const { workspace, ledger_fingerprint } = request;
  const expectedHash = ledger_fingerprint.content_hash;

  const indexEntries: FreshnessEntry[] = [];
  const viewEntries: FreshnessEntry[] = [];

  const indexSidecars = await collectSidecars(workspace.paths.indexes);
  const viewSidecars = await collectSidecars(workspace.paths.views);

  const seenIndexNames = new Set<string>();

  for (const sidecar of indexSidecars) {
    const entry = await classifySidecar(sidecar, expectedHash);
    if (entry.kind === "index") {
      const name = indexNameFromTarget(entry.target);
      if (name) seenIndexNames.add(name);
    }
    indexEntries.push(entry);
  }
  for (const sidecar of viewSidecars) {
    viewEntries.push(await classifySidecar(sidecar, expectedHash));
  }

  for (const name of V1_INDEX_NAMES) {
    if (seenIndexNames.has(name)) continue;
    const filePath = join(workspace.paths.indexes, `${name}.json`);
    indexEntries.push({
      kind: "index",
      target: workspaceRelative(workspace, filePath),
      state: "missing",
    });
  }

  indexEntries.sort((a, b) => a.target.localeCompare(b.target));
  viewEntries.sort((a, b) => a.target.localeCompare(b.target));

  return { entries: [...indexEntries, ...viewEntries] };
}

export function buildClaimKeyClusters(rows: Iterable<EffectiveRow>): ClaimKeyClusters {
  const keyed = new Map<string, ClaimRow[]>();
  const unkeyed: ClaimRow[] = [];
  for (const effective of rows) {
    if (effective.row.kind !== "claim") continue;
    const claim = effective.row as ClaimRow;
    const claimKey = claim.identity?.claim_key?.trim();
    if (claimKey === undefined || claimKey.length === 0) {
      unkeyed.push(claim);
      continue;
    }
    const claims = keyed.get(claimKey) ?? [];
    claims.push(claim);
    keyed.set(claimKey, claims);
  }

  const clusters: ClaimKeyCluster[] = [];
  for (const claimKey of [...keyed.keys()].sort((a, b) => a.localeCompare(b))) {
    clusters.push({
      claim_key: claimKey,
      claims: [...(keyed.get(claimKey) ?? [])].sort(byCreatedAscThenId),
    });
  }
  return {
    keyed: clusters,
    unkeyed: [...unkeyed].sort(byCreatedAscThenId),
  };
}

function resolveViewPath(workspace: KnbWorkspace, collection: string, out: string | undefined): string {
  const viewsRoot = resolve(workspace.paths.views);
  if (out === undefined || out === null || out.length === 0) {
    return join(viewsRoot, `${sanitizeCollection(collection)}.md`);
  }
  const candidate = isAbsolute(out) ? resolve(out) : resolve(viewsRoot, out);
  const normalized = normalize(candidate);
  const rel = relative(viewsRoot, normalized);
  if (rel.startsWith("..") || rel === "" || isAbsolute(rel)) {
    throw knbError(
      "validation_failed",
      "Render output must stay within workspace views",
      { out, views: viewsRoot, resolved: normalized },
    );
  }
  return normalized;
}

function sanitizeCollection(collection: string): string {
  return collection.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_");
}

function activeCollectionNames(state: EffectiveState): string[] {
  const names = new Set<string>();
  for (const effective of state.rows({ status: "active", includeChanges: false })) {
    const collections = effective.row.scope.collections;
    if (!Array.isArray(collections)) continue;
    for (const raw of collections) {
      if (typeof raw !== "string") continue;
      const collection = raw.trim();
      if (collection.length > 0) names.add(collection);
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b));
}

function workspaceRelative(workspace: KnbWorkspace, target: string): string {
  const rel = relative(workspace.root, target);
  return rel.split(sep).join("/");
}

function ledgerMeta(fingerprint: LedgerFingerprint): ProjectionMetadata["ledger"] {
  const ledger: ProjectionMetadata["ledger"] = {
    path: fingerprint.path,
    rows: fingerprint.rows,
    content_hash: fingerprint.content_hash,
  };
  if (fingerprint.last_row_id !== undefined) ledger.last_row_id = fingerprint.last_row_id;
  return ledger;
}

function projectionTimestamp(options: ProjectionWriteOptions): string {
  return (options.clock ?? (() => new Date()))().toISOString();
}

function projectionOptions(options: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(options)) {
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function buildMarkdown(
  state: EffectiveState,
  collection: string,
  ledger_fingerprint: LedgerFingerprint,
): string {
  const active = state.rows({ status: "active", collection, includeChanges: false });

  const syntheses = active
    .map((er) => er.row)
    .filter((row): row is SynthesisRow => row.kind === "synthesis" && row.synthesis.status === "active")
    .sort(byImportanceThenCreatedDesc);

  const claims = active
    .map((er) => er.row)
    .filter((row): row is ClaimRow => row.kind === "claim")
    .sort(byCreatedAscThenId);
  const claimClusters = buildClaimKeyClusters(active);

  const questions = active
    .map((er) => er.row)
    .filter((row): row is QuestionRow => row.kind === "question" && row.question.status === "open")
    .sort(byCreatedAscThenId);

  const citedSourceIds = new Set<string>();
  for (const synthesis of syntheses) {
    addCanonicalSourceIds(citedSourceIds, synthesis.synthesis.basis.source_ids ?? [], state);
  }
  for (const claim of claims) {
    addCanonicalSourceIds(citedSourceIds, claim.provenance.source_ids ?? [], state);
    addCanonicalSourceIds(
      citedSourceIds,
      (claim.provenance.evidence ?? []).map((evidence) => evidence.source_id),
      state,
    );
  }

  const sources = active
    .map((er) => er.row)
    .filter((row): row is SourceRow => row.kind === "source" && citedSourceIds.has(row.id))
    .sort(byCreatedAscThenId);
  const sourceCitationIndex = buildSourceCitationIndex(state);

  const title = titleize(collection);
  const lines: string[] = [];
  lines.push(`# ${title}`, "");
  lines.push(
    `Ledger: ${ledger_fingerprint.rows} rows; hash ${ledger_fingerprint.content_hash}`,
    "",
  );

  lines.push("## Contents {#contents}", "");
  lines.push("- [Current Synthesis](#current-synthesis)");
  lines.push("- [Key Claims](#key-claims)");
  lines.push("  - [Claim Key Clusters](#claim-key-clusters)");
  lines.push("  - [Unkeyed Claims](#unkeyed-claims)");
  lines.push("- [Open Questions](#open-questions)");
  lines.push("- [Sources](#sources)", "");

  lines.push("## Current Synthesis {#current-synthesis}", "");
  if (syntheses.length === 0) {
    lines.push("No active synthesis rows.", "");
  } else {
    for (const synthesis of syntheses) {
      lines.push(`### ${synthesis.synthesis.title} {#${rowAnchorId(synthesis)}}`, "", synthesis.synthesis.summary, "");
      if (synthesis.synthesis.limitations) {
        lines.push(`Limitations: ${synthesis.synthesis.limitations}`, "");
      }
    }
  }

  lines.push("## Key Claims {#key-claims}", "");
  if (claims.length === 0) {
    lines.push("No active claim rows.", "");
  } else {
    lines.push("### Claim Key Clusters {#claim-key-clusters}", "");
    if (claimClusters.keyed.length === 0) {
      lines.push("No keyed claim rows.", "");
    } else {
      for (const cluster of claimClusters.keyed) {
        lines.push(`#### ${cluster.claim_key} {#${claimKeyAnchorId(cluster.claim_key)}}`, "");
        for (const claim of cluster.claims) {
          pushClaimLines(lines, claim);
        }
        lines.push("");
      }
    }

    lines.push("### Unkeyed Claims {#unkeyed-claims}", "");
    if (claimClusters.unkeyed.length === 0) {
      lines.push("No unkeyed claim rows.", "");
    } else {
      for (const claim of claimClusters.unkeyed) {
        pushClaimLines(lines, claim);
      }
      lines.push("");
    }
  }

  lines.push("## Open Questions {#open-questions}", "");
  if (questions.length === 0) {
    lines.push("No open question rows.", "");
  } else {
    for (const question of questions) {
      lines.push(`- ${question.question.text} {#${rowAnchorId(question)}}`);
    }
    lines.push("");
  }

  lines.push("## Sources {#sources}", "");
  if (sources.length === 0) {
    lines.push("No cited sources.", "");
  } else {
    for (const source of sources) {
      const publisher = source.source.publisher ? `${source.source.publisher} - ` : "";
      const uri = source.source.uri;
      const citationCount = typeof uri === "string" ? sourceCitationIndex[uri]?.length ?? 0 : 0;
      const citationSuffix = citationCount > 0 ? ` (Cited by ${citationCount} ${citationCount === 1 ? "claim" : "claims"})` : "";
      lines.push(`- ${publisher}${source.source.title}${citationSuffix} {#${rowAnchorId(source)}}`);
    }
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function pushClaimLines(lines: string[], claim: ClaimRow): void {
  lines.push(`- ${claim.claim.statement} {#${rowAnchorId(claim)}}`);
  if (claim.assessment.confidence) lines.push(`  - Confidence: ${claim.assessment.confidence}`);
  const observed = claim.time.valid_at ?? claim.time.occurred_at ?? claim.time.first_observed_at;
  if (observed) lines.push(`  - Time: ${observed}`);
  const depth = claim.assessment.information_depth?.level;
  if (depth) lines.push(`  - Depth: ${depth}`);
}

function rowAnchorId(row: KnbRow): string {
  return sanitizeAnchor(row.id);
}

function claimKeyAnchorId(claimKey: string): string {
  return `claim-key-${sanitizeAnchor(claimKey)}`;
}

function sanitizeAnchor(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function addCanonicalSourceIds(
  target: Set<string>,
  ids: Iterable<string | undefined>,
  state: EffectiveState,
): void {
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    target.add(state.canonicalIdOf(id));
  }
}

function buildActiveById(rows: EffectiveRow[]): Record<string, { kind: string; scope: KnbRow["scope"] }> {
  const entries: Array<[string, { kind: string; scope: KnbRow["scope"] }]> = [];
  for (const effective of rows) {
    entries.push([effective.row.id, { kind: effective.row.kind, scope: effective.row.scope }]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, { kind: string; scope: KnbRow["scope"] }> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

function buildActiveByCollection(rows: EffectiveRow[]): Record<string, string[]> {
  const map = new Map<string, string[]>();
  for (const effective of rows) {
    const collections = effective.row.scope.collections;
    if (!Array.isArray(collections)) continue;
    for (const collection of collections) {
      if (typeof collection !== "string" || collection.length === 0) continue;
      const list = map.get(collection) ?? [];
      list.push(effective.row.id);
      map.set(collection, list);
    }
  }
  const sortedKeys = [...map.keys()].sort((a, b) => a.localeCompare(b));
  const out: Record<string, string[]> = {};
  for (const key of sortedKeys) {
    out[key] = map.get(key) ?? [];
  }
  return out;
}

function buildActiveClaimsByKey(rows: EffectiveRow[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const cluster of buildClaimKeyClusters(rows).keyed) {
    out[cluster.claim_key] = cluster.claims.map((claim) => claim.id);
  }
  return out;
}

function buildActiveSourcesByUri(rows: EffectiveRow[]): Record<string, string> {
  const entries: Array<[string, string]> = [];
  for (const effective of rows) {
    if (effective.row.kind !== "source") continue;
    const uri = (effective.row as SourceRow).source?.uri;
    if (typeof uri !== "string" || uri.length === 0) continue;
    entries.push([uri, effective.row.id]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

function buildActiveSourcesByContentHash(rows: EffectiveRow[]): Record<string, string> {
  const entries: Array<[string, string]> = [];
  for (const effective of rows) {
    if (effective.row.kind !== "source") continue;
    const hash = (effective.row as SourceRow).source?.content_hash;
    if (typeof hash !== "string" || hash.length === 0) continue;
    entries.push([hash, effective.row.id]);
  }
  entries.sort(([a], [b]) => a.localeCompare(b));
  const out: Record<string, string> = {};
  for (const [key, value] of entries) out[key] = value;
  return out;
}

async function collectSidecars(dir: string): Promise<string[]> {
  const out: string[] = [];
  await walkSidecars(dir, out);
  return out;
}

async function walkSidecars(dir: string, acc: string[]): Promise<void> {
  let entries: Dirent[];
  try {
    entries = (await readdir(dir, { withFileTypes: true })) as unknown as Dirent[];
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
  for (const entry of entries) {
    const name = entry.name;
    const full = join(dir, name);
    if (entry.isDirectory()) {
      await walkSidecars(full, acc);
      continue;
    }
    if (entry.isFile() && name.endsWith(".meta.json")) {
      acc.push(full);
    }
  }
}

async function classifySidecar(sidecarPath: string, expectedHash: string): Promise<FreshnessEntry> {
  let raw: string;
  try {
    raw = await readFile(sidecarPath, "utf8");
  } catch (error) {
    if (isMissing(error)) {
      return {
        kind: "view",
        target: sidecarPath,
        state: "missing",
        metadata_path: sidecarPath,
      };
    }
    throw error;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {
      kind: "view",
      target: sidecarPath,
      state: "unknown",
      metadata_path: sidecarPath,
    };
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      kind: "view",
      target: sidecarPath,
      state: "unknown",
      metadata_path: sidecarPath,
    };
  }

  const meta = parsed as Partial<ProjectionMetadata>;
  const kind: ProjectionKind = meta.kind === "index" ? "index" : "view";
  const target = typeof meta.target === "string" ? meta.target : sidecarPath;
  const ledgerHash = typeof meta.ledger?.content_hash === "string" ? meta.ledger.content_hash : undefined;
  const generatedAt = typeof meta.generated_at === "string" ? meta.generated_at : undefined;

  if (
    meta.schema_version !== "knb.projection.v1" ||
    typeof meta.target !== "string" ||
    ledgerHash === undefined
  ) {
    const entry: FreshnessEntry = {
      kind,
      target,
      state: "unknown",
      metadata_path: sidecarPath,
    };
    if (ledgerHash !== undefined) entry.ledger_hash = ledgerHash;
    if (generatedAt !== undefined) entry.generated_at = generatedAt;
    return entry;
  }

  const targetPath = sidecarPath.slice(0, -".meta.json".length);
  const targetExists = await fileExists(targetPath);

  const baseEntry: FreshnessEntry = {
    kind,
    target,
    state: "fresh",
    metadata_path: sidecarPath,
    ledger_hash: ledgerHash,
  };
  if (generatedAt !== undefined) baseEntry.generated_at = generatedAt;

  if (!targetExists) {
    baseEntry.state = "missing";
    return baseEntry;
  }
  if (kind === "view" && hasAsOfOption(meta.options)) {
    baseEntry.state = "stale";
    return baseEntry;
  }
  baseEntry.state = ledgerHash === expectedHash ? "fresh" : "stale";
  return baseEntry;
}

function hasAsOfOption(options: unknown): boolean {
  if (options === null || typeof options !== "object" || Array.isArray(options)) return false;
  return typeof (options as { asOf?: unknown }).asOf === "string";
}

function indexNameFromTarget(target: string): V1IndexName | undefined {
  const lastSlash = target.lastIndexOf("/");
  const file = lastSlash >= 0 ? target.slice(lastSlash + 1) : target;
  if (!file.endsWith(".json")) return undefined;
  const name = file.slice(0, -".json".length);
  return (V1_INDEX_NAMES as readonly string[]).includes(name) ? (name as V1IndexName) : undefined;
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch (error) {
    if (isMissing(error)) return false;
    throw error;
  }
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

function byCreatedAsc(a: KnbRow, b: KnbRow): number {
  return a.created_at.localeCompare(b.created_at);
}

function byCreatedAscThenId(a: KnbRow, b: KnbRow): number {
  return byCreatedAsc(a, b) || a.id.localeCompare(b.id);
}

function byImportanceThenCreatedDesc(a: SynthesisRow, b: SynthesisRow): number {
  const importanceA = assessmentLevelWeight(a.assessment?.importance);
  const importanceB = assessmentLevelWeight(b.assessment?.importance);
  return importanceB - importanceA || b.created_at.localeCompare(a.created_at);
}

function assessmentLevelWeight(level: Assessment["importance"]): number {
  if (level === "high") return 3;
  if (level === "medium") return 2;
  if (level === "low") return 1;
  return 0;
}

function titleize(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/cli.ts
```ts
import { readFile as fsReadFile } from "node:fs/promises";

import type { DraftRow, KnbRowKind } from "./core/contract";
import { fromUnknown, knbError } from "./core/errors";
import {
  ROW_KINDS,
  openKnb,
  type ApplyRequest,
  type CollectionStatusRequest,
  type Knb,
  type LogRequest,
  type OpenKnbOptions,
} from "./core/knb";
import {
  failure,
  render,
  success,
  type CommandResult,
  type OutputFormat,
  type OutputOptions,
} from "./core/output";
import type { CandidateClaim } from "./core/novelty";
import type { ContextRequest } from "./core/context";
import type { GetRequest, QueryRequest } from "./core/query";
import type { RenderAllRequest, RenderRequest } from "./core/projections";

type FlagValue = string | boolean | Array<string | boolean>;
type FlagMap = Map<string, FlagValue>;

const COMMANDS = new Set([
  "init",
  "status",
  "collections",
  "schema",
  "log",
  "apply",
  "add",
  "get",
  "query",
  "context",
  "novelty",
  "render",
  "check",
  "index",
]);

export async function runCli(args: string[], options: OutputOptions = {}): Promise<number> {
  const [command, ...rest] = args;
  const positionals: string[] = [];
  const flags = parseFlags(rest, positionals);
  const outputOptions: OutputOptions = { ...options };
  const formatFromCli = formatFromFlags(flags);
  if (formatFromCli && options.format === undefined) outputOptions.format = formatFromCli;

  if (!command || command === "help" || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  if (!COMMANDS.has(command)) {
    return renderResult(
      failure(command, knbError("invalid_arguments", `Unknown command: ${command}`), {
        exit_code: 2,
      }),
      outputOptions,
    );
  }

  return runFacadeCommand(command, flags, positionals, outputOptions);
}

async function runFacadeCommand(
  command: string,
  flags: FlagMap,
  positionals: string[],
  outputOptions: OutputOptions,
): Promise<number> {
  const start = Date.now();

  let knb: Knb;
  try {
    const openOptions: OpenKnbOptions = {};
    const rootFlag = stringFlag(flags, "root");
    const configFlag = stringFlag(flags, "config");
    const ledgerFlag = stringFlag(flags, "ledger");
    const actorFlag = stringFlag(flags, "actor");
    if (rootFlag) openOptions.root = rootFlag;
    if (configFlag) openOptions.configPath = configFlag;
    if (ledgerFlag) openOptions.ledgerPath = ledgerFlag;
    if (actorFlag) openOptions.actor = actorFlag;
    knb = await openKnb(openOptions);
  } catch (error) {
    return renderResult(
      failure(command, fromUnknown(error), { elapsed_ms: Date.now() - start }),
      outputOptions,
    );
  }

  const baseMeta = (): Record<string, unknown> => ({
    workspace_root: knb.workspace.root,
    ledger: knb.workspace.paths.ledger,
    elapsed_ms: Date.now() - start,
  });

  try {
    if (command === "init") {
      const force = booleanFlag(flags, "force");
      const initActor = stringFlag(flags, "actor");
      const result = await knb.init(initActor ? { force, actor: initActor } : { force });
      return renderResult(
        success("init", result, {
          workspace_root: knb.workspace.root,
          ledger: result.ledger_path,
          elapsed_ms: Date.now() - start,
        }),
        outputOptions,
      );
    }

    if (command === "status") {
      const collection = stringFlag(flags, "collection");
      if (collection) {
        const result = await knb.collectionStatus(collectionStatusRequestFromFlags(flags, collection));
        return renderResult(
          success("status", result, {
            ...baseMeta(),
            collection: result.collection,
            open_question_count: result.open_question_count,
          }),
          outputOptions,
        );
      }
      const result = await knb.status({ detailed: booleanFlag(flags, "detailed") });
      return renderResult(success("status", result, baseMeta()), outputOptions);
    }

    if (command === "collections") {
      const result = await knb.collections();
      return renderResult(
        success("collections", result, { ...baseMeta(), rows_returned: result.collections.length }),
        outputOptions,
      );
    }

    if (command === "schema") {
      const result = await knb.schema();
      return renderResult(
        success("schema", result, {
          workspace_root: knb.workspace.root,
          elapsed_ms: Date.now() - start,
        }),
        outputOptions,
      );
    }

    if (command === "log") {
      const request: LogRequest = {};
      const logActor = stringFlag(flags, "actor");
      const since = stringFlag(flags, "since");
      const until = stringFlag(flags, "until");
      const limit = numberFlag(flags, "limit");
      if (logActor !== undefined) request.actor = logActor;
      if (since !== undefined) request.since = since;
      if (until !== undefined) request.until = until;
      if (limit !== undefined) request.limit = limit;
      const result = await knb.log(request);
      return renderResult(
        success("log", result, { ...baseMeta(), rows_returned: result.total_returned }),
        outputOptions,
      );
    }

    if (command === "apply") {
      const request = await readApplyRequest(flags);
      if (booleanFlag(flags, "dedupe")) request.dedupe = true;
      if (booleanFlag(flags, "atomic")) request.atomic = true;
      const dryRun = booleanFlag(flags, "dry-run");
      const result = dryRun ? await knb.previewApply(request) : await knb.apply(request);
      return renderResult(
        success("apply", result, {
          ...baseMeta(),
          rows_appended: result.meta.rows_appended,
          ...(dryRun ? { dry_run: true, planned_rows: result.meta.planned_rows ?? 0 } : {}),
        }),
        outputOptions,
      );
    }

    if (command === "add") {
      const row = (await readJsonPayload(flags)) as DraftRow;
      const result = await knb.add(row);
      return renderResult(
        success("add", result, { ...baseMeta(), rows_appended: result.meta.rows_appended }),
        outputOptions,
      );
    }

    if (command === "get") {
      if (positionals.length === 0) {
        return renderResult(
          failure(
            "get",
            knbError("invalid_arguments", "knb get requires at least one id"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const result = await knb.get(positionals, getRequestFromFlags(flags));
      return renderResult(success("get", result, baseMeta()), outputOptions);
    }

    if (command === "query") {
      const request = queryRequestFromFlags(flags);
      const result = await knb.query(request);
      return renderResult(
        success("query", result, { ...baseMeta(), rows_returned: result.total_returned }),
        outputOptions,
      );
    }

    if (command === "context") {
      const request = contextRequestFromFlags(flags);
      const result = await knb.context(request);
      return renderResult(success("context", result, baseMeta()), outputOptions);
    }

    if (command === "novelty") {
      const payload = await readJsonPayload(flags);
      const candidates = extractCandidates(payload);
      const result = await knb.novelty({ candidates });
      return renderResult(success("novelty", result, baseMeta()), outputOptions);
    }

    if (command === "render") {
      const renderAll = booleanFlag(flags, "all");
      const collection = stringFlag(flags, "collection");
      const asOf = stringFlag(flags, "as-of");
      if (renderAll && collection) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "Use either --collection <c> or --all, not both"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      if (renderAll && stringFlag(flags, "out")) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "--out can only be used with --collection"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const format = stringFlag(flags, "format") as RenderRequest["format"] | undefined;
      if (renderAll) {
        const request: RenderAllRequest = {};
        if (format) request.format = format;
        if (asOf !== undefined) request.asOf = asOf;
        const result = await knb.renderAll(request);
        return renderResult(
          success("render", result, {
            ...baseMeta(),
            collections_rendered: result.collections.length,
            bytes_written: result.total_bytes_written,
          }),
          outputOptions,
        );
      }
      if (!collection) {
        return renderResult(
          failure(
            "render",
            knbError("invalid_arguments", "Missing required flag: --collection or --all"),
            baseMeta(),
          ),
          outputOptions,
        );
      }
      const request: RenderRequest = { collection };
      const out = stringFlag(flags, "out");
      if (out) request.out = out;
      if (format) request.format = format;
      if (asOf !== undefined) request.asOf = asOf;
      const result = await knb.render(request);
      return renderResult(
        success("render", result, { ...baseMeta(), bytes_written: result.bytes_written }),
        outputOptions,
      );
    }

    if (command === "check") {
      const result = await knb.check();
      return renderResult(success("check", result, baseMeta()), outputOptions);
    }

    if (command === "index") {
      if (booleanFlag(flags, "rebuild")) {
        const result = await knb.rebuildIndex();
        return renderResult(success("index", result, baseMeta()), outputOptions);
      }
      const result = await knb.check();
      return renderResult(
        success("index", { projection_freshness: result.projection_freshness }, baseMeta()),
        outputOptions,
      );
    }

    return renderResult(
      failure(command, knbError("invalid_arguments", `Unknown command: ${command}`), baseMeta()),
      outputOptions,
    );
  } catch (error) {
    return renderResult(failure(command, fromUnknown(error), baseMeta()), outputOptions);
  }
}

function renderResult(result: CommandResult, options: OutputOptions): number {
  return render(result, options).exitCode;
}

function formatFromFlags(flags: FlagMap): OutputFormat | undefined {
  if (booleanFlag(flags, "quiet")) return "quiet";
  if (booleanFlag(flags, "ndjson")) return "ndjson";
  if (booleanFlag(flags, "pretty")) return "pretty";
  if (booleanFlag(flags, "json")) return "json";
  if (booleanFlag(flags, "text")) return "text";
  return undefined;
}

function parseFlags(args: string[], positionals: string[]): FlagMap {
  const flags: FlagMap = new Map();
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === undefined) continue;
    if (!arg.startsWith("--")) {
      positionals.push(arg);
      continue;
    }

    const equalsIndex = arg.indexOf("=");
    if (equalsIndex > -1) {
      setFlag(flags, arg.slice(2, equalsIndex), arg.slice(equalsIndex + 1));
      continue;
    }

    const key = arg.slice(2);
    const next = args[index + 1];
    if (next && !next.startsWith("--")) {
      setFlag(flags, key, next);
      index += 1;
    } else {
      setFlag(flags, key, true);
    }
  }
  return flags;
}

function setFlag(flags: FlagMap, key: string, value: string | boolean): void {
  const existing = flags.get(key);
  if (existing === undefined) {
    flags.set(key, value);
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  flags.set(key, [existing, value]);
}

function collectionStatusRequestFromFlags(flags: FlagMap, collection: string): CollectionStatusRequest {
  const request: CollectionStatusRequest = { collection };
  const maxQuestions = numberFlag(flags, "max-questions");
  if (maxQuestions !== undefined) request.maxQuestions = maxQuestions;
  return request;
}

function getRequestFromFlags(flags: FlagMap): Omit<GetRequest, "ids"> {
  const request: Omit<GetRequest, "ids"> = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  if (booleanFlag(flags, "include-history") || booleanFlag(flags, "history")) {
    request.includeHistory = true;
  }
  if (booleanFlag(flags, "explain")) request.explain = true;
  return request;
}

function queryRequestFromFlags(flags: FlagMap): QueryRequest {
  const request: QueryRequest = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  const kindFlag = stringFlag(flags, "kind");
  if (kindFlag) {
    if (!(ROW_KINDS as readonly string[]).includes(kindFlag)) {
      throw knbError("invalid_arguments", `Invalid --kind value: ${kindFlag}`, { kind: kindFlag });
    }
    request.kinds = [kindFlag as KnbRowKind];
  }
  const collection = stringFlag(flags, "collection");
  if (collection) request.collection = collection;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const text = stringFlag(flags, "text");
  if (text) request.text = text;
  const claimKey = stringFlag(flags, "claim-key");
  if (claimKey) request.claimKey = claimKey;
  const claimType = stringFlag(flags, "claim-type");
  if (claimType) request.claimType = claimType;
  const predicate = stringFlag(flags, "predicate");
  if (predicate) request.predicate = predicate;
  const qualifiers = parseQualifierFlags(flags);
  if (qualifiers !== undefined) request.qualifiers = qualifiers;
  const externalRefs = parseExternalRefFlags(flags);
  if (externalRefs !== undefined) request.externalRefs = externalRefs;
  const citing = stringFlag(flags, "citing");
  if (citing) request.citing = citing;
  const limit = numberFlag(flags, "limit");
  if (limit !== undefined) request.limit = limit;
  if (booleanFlag(flags, "history") || booleanFlag(flags, "include-history")) {
    request.includeHistory = true;
  }
  if (booleanFlag(flags, "full")) request.full = true;
  return request;
}

function contextRequestFromFlags(flags: FlagMap): ContextRequest {
  const request: ContextRequest = {};
  const asOf = stringFlag(flags, "as-of");
  if (asOf !== undefined) request.asOf = asOf;
  const collection = stringFlag(flags, "collection");
  if (collection) request.collection = collection;
  const subject = stringFlag(flags, "subject");
  if (subject) request.subject = subject;
  const tag = stringFlag(flags, "tag");
  if (tag) request.tag = tag;
  const claimType = stringFlag(flags, "claim-type");
  if (claimType) request.claimType = claimType;
  const predicate = stringFlag(flags, "predicate");
  if (predicate) request.predicate = predicate;
  const qualifiers = parseQualifierFlags(flags);
  if (qualifiers !== undefined) request.qualifiers = qualifiers;
  const externalRefs = parseExternalRefFlags(flags);
  if (externalRefs !== undefined) request.externalRefs = externalRefs;
  const maxTokens = numberFlag(flags, "max-tokens");
  if (maxTokens !== undefined) request.maxTokens = maxTokens;
  const recencyWindowDays = numberFlag(flags, "recency-window-days");
  if (recencyWindowDays !== undefined) request.recencyWindowDays = recencyWindowDays;
  if (booleanFlag(flags, "no-warnings")) request.includeWarnings = false;
  return request;
}

function stringFlag(flags: FlagMap, key: string): string | undefined {
  const value = flags.get(key);
  if (Array.isArray(value)) {
    for (let index = value.length - 1; index >= 0; index -= 1) {
      const entry = value[index];
      if (typeof entry === "string" && entry.length > 0) return entry;
    }
    return undefined;
  }
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function booleanFlag(flags: FlagMap, key: string): boolean {
  const value = flags.get(key);
  if (Array.isArray(value)) return value.includes(true);
  return value === true;
}

function numberFlag(flags: FlagMap, key: string): number | undefined {
  if (!flags.has(key)) return undefined;
  const value = stringFlag(flags, key);
  if (value === undefined) {
    throw knbError("invalid_arguments", `Invalid --${key} value; expected a number`, {
      flag: `--${key}`,
      value: String(flags.get(key)),
    });
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw knbError("invalid_arguments", `Invalid --${key} value; expected a number`, {
      flag: `--${key}`,
      value,
    });
  }
  return parsed;
}

function stringFlags(flags: FlagMap, key: string): string[] {
  const value = flags.get(key);
  if (Array.isArray(value)) return value.filter((entry): entry is string => typeof entry === "string" && entry.length > 0);
  if (typeof value === "string" && value.length > 0) return [value];
  return [];
}

function parseQualifierFlags(flags: FlagMap): Record<string, string> | undefined {
  const entries = stringFlags(flags, "qualifier");
  if (entries.length === 0) return undefined;
  const qualifiers: Record<string, string> = {};
  for (const entry of entries) {
    const equalsIndex = entry.indexOf("=");
    if (equalsIndex <= 0 || equalsIndex === entry.length - 1) {
      throw knbError("invalid_arguments", "Invalid --qualifier value; expected key=value", { qualifier: entry });
    }
    const key = entry.slice(0, equalsIndex).trim();
    const value = entry.slice(equalsIndex + 1);
    if (!/^[A-Za-z0-9_.-]+$/.test(key)) {
      throw knbError("invalid_arguments", "Invalid --qualifier key; expected letters, numbers, dot, underscore, or dash", { qualifier: entry });
    }
    qualifiers[key] = value;
  }
  return qualifiers;
}

function parseExternalRefFlags(flags: FlagMap): Array<{ system: string; id: string }> | undefined {
  const entries = stringFlags(flags, "external-ref");
  if (entries.length === 0) return undefined;
  return entries.map((entry) => {
    const colonIndex = entry.indexOf(":");
    if (colonIndex <= 0 || colonIndex === entry.length - 1) {
      throw knbError("invalid_arguments", "Invalid --external-ref value; expected system:id", { external_ref: entry });
    }
    return { system: entry.slice(0, colonIndex), id: entry.slice(colonIndex + 1) };
  });
}

async function readJsonPayload(flags: FlagMap): Promise<unknown> {
  const file = stringFlag(flags, "file");
  if (file) {
    let raw: string;
    try {
      raw = await fsReadFile(file, "utf8");
    } catch (error) {
      throw knbError("io_failed", `Failed to read JSON file: ${file}`, { path: file }, error);
    }
    return parseJsonOrThrow(raw, `--file ${file}`);
  }
  const json = stringFlag(flags, "json");
  if (json) return parseJsonOrThrow(json, "--json");
  if (booleanFlag(flags, "stdin")) return readStdinJson();
  throw knbError("invalid_arguments", "Provide --file <path>, --json <text>, or --stdin");
}

function parseJsonOrThrow(raw: string, source: string): unknown {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw knbError(
      "invalid_arguments",
      `Failed to parse JSON from ${source}: ${message}`,
      { source },
      error,
    );
  }
}

async function readApplyRequest(flags: FlagMap): Promise<ApplyRequest> {
  const payload = await readJsonPayload(flags);
  return payload as ApplyRequest;
}

function extractCandidates(payload: unknown): CandidateClaim[] {
  if (Array.isArray(payload)) return payload as CandidateClaim[];
  if (payload && typeof payload === "object") {
    const candidates = (payload as { candidates?: unknown }).candidates;
    if (Array.isArray(candidates)) return candidates as CandidateClaim[];
  }
  throw knbError(
    "invalid_arguments",
    "novelty payload must be an array of candidates or { candidates: [...] }",
  );
}

async function readStdinJson(): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const input = Buffer.concat(chunks).toString("utf8").trim();
  if (input.length === 0) {
    throw knbError("invalid_arguments", "stdin closed with no JSON input");
  }
  return parseJsonOrThrow(input, "--stdin");
}

function printHelp(): void {
  console.log(`knb

What this is:
  KNB is an append-only knowledge ledger for agent research. Store sourced facts as
  source/claim/question/synthesis/change rows, then read them through the same facade
  that the CLI uses. The ledger is canonical; views and indexes are disposable outputs.

Typical workflows:
  Research pass:
    1. Check orientation: knb status --collection <c> and knb context --collection <c>.
    2. Preview a batch: knb apply --dry-run --stdin --json.
    3. Apply the batch, then refresh outputs: knb render --all; knb index --rebuild; knb check --json.
    4. Keep one current synthesis per thread by superseding older synthesis rows.

  Handoff:
    Use knb status --collection <c> --max-questions N for latest synthesis and open questions.
    Use knb context --collection <c> --max-tokens N for a compact packet for the next agent.

  Host application:
    Use openKnb(...).apply/add/query/context/render/check/rebuildIndex so app code and CLI
    share the same rules, errors, lifecycle state, and projection freshness checks.

Usage:
  knb init    [--root <dir>] [--config <path>] [--ledger <path>] [--actor <name>] [--force] [--json|--pretty|--ndjson|--text|--quiet]
  knb status  [--root <dir>] [--collection <c>] [--max-questions N] [--detailed] [--json|--pretty|--ndjson|--text|--quiet]
  knb collections [--root <dir>] [--json|--pretty|--ndjson|--text|--quiet]
  knb schema  [--json|--pretty|--ndjson|--text|--quiet]
  knb log     [--actor <a>] [--since <date>] [--until <date>] [--limit N] [--json|--pretty|--ndjson|--text|--quiet]
  knb apply   (--file ops.json | --json '{...}' | --stdin) [--atomic] [--dedupe] [--dry-run]
  knb add     (--file row.json | --json '{...}' | --stdin)
  knb get     <id> [<id>...] [--as-of <iso>] [--include-history] [--explain]
  knb query   [--as-of <iso>] [--kind <kind>] [--collection <c>] [--subject <s>] [--tag <t>] [--text <q>] [--claim-key <k>] [--claim-type <t>] [--predicate <p>] [--qualifier k=v] [--external-ref system:id] [--citing <uri>] [--limit N] [--history] [--full]
  knb context [--as-of <iso>] [--collection <c>] [--subject <s>] [--tag <t>] [--claim-type <t>] [--predicate <p>] [--qualifier k=v] [--external-ref system:id] [--max-tokens 3000] [--recency-window-days N] [--no-warnings]
  knb novelty (--file candidates.json | --json '{...}' | --stdin)
  knb render  (--collection <c> [--out path] | --all) [--as-of <iso>] [--format md]
  knb check   [--json]
  knb index   [--rebuild]

Commands:
  init      Create workspace config, ledger, schema, views, and indexes.
  status    Cheap orientation packet: workspace, ledger, counts, projection freshness; with --collection, latest synthesis and open questions; with --detailed, corpus-health stats.
  collections
            List active collections with active row counts and latest active row timestamp.
  schema    Print row and operation contracts plus the JSON Schema.
  log       Show recent apply run manifests from .knb/runs, optionally filtered by actor and time.
  apply     Apply an atomic batch of operations through the apply pipeline; use --dry-run to preview without writing.
  add       Convenience wrapper for one add operation; identical envelope to apply.
  get       Fetch full rows by id; default returns only active rows.
  query     Search active rows by kind, scope, text, citation, and generic structured claim fields. Use --history to include inactive.
  context   Build a token-budgeted context packet for a scope.
  novelty   Classify candidate claims against active claims (no writes).
  render    Generate Markdown view(s) for one collection or every active collection.
  check     Report parse, validation, state warnings, and projection freshness. Exit 0 if ok, otherwise the typed error code.
  index     Without --rebuild, report freshness only. With --rebuild, regenerate all V1 indexes.

Output formats:
  --json    Compact JSON envelope (default when stdout is piped).
  --pretty  Indented JSON envelope.
  --ndjson  One JSON line per item plus a final envelope line.
  --text    Human-readable text (default when stdout is a TTY).
  --quiet   No output on success; only the error code on failure.

Exit codes:
  0  ok
  1  not_found
  2  invalid_arguments
  3  validation_failed
  4  duplicate_blocked
  5  io_failed
  6  lock_busy
  7  broken_reference
  8  external_dependency_failed
  9  unsafe_operation_refused
  10 internal_error

knb check returns the exit code matching the highest-priority issue on failure (parse errors -> io_failed,
validation errors -> validation_failed). When ok is false purely due to stale or missing projections, the
envelope is still rendered as a success with data.ok=false and the process exits 0; rebuild via knb index
--rebuild or knb render --all.
`);
}

if (import.meta.main) {
  const code = await runCli(process.argv.slice(2));
  process.exit(code);
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/novelty.ts
```ts
// Novelty module — V1 deterministic local classification of candidate claims
// against active claims in EffectiveState. No embeddings, no network, no LLM.

import type { ClaimRow, EvidenceRef } from "./contract";
import type { EffectiveRow, EffectiveState } from "./state";

export type NoveltyClassification =
  | "new"
  | "duplicate"
  | "corroboration"
  | "update"
  | "contradiction"
  | "correction";

export type NoveltyMatchReason =
  | "claim_key_exact"
  | "dedupe_hash_exact"
  | "statement_normalized_exact"
  | "statement_high_overlap"
  | "explicit_contradiction_relation"
  | "explicit_correction_metadata"
  | "evidence_added"
  | "time_changed"
  | "assessment_changed";

export type NoveltyMatch = {
  matched_id: string;
  reason: NoveltyMatchReason;
};

export type CandidateClaim = Partial<ClaimRow> & {
  identity?: ClaimRow["identity"];
  claim?: ClaimRow["claim"];
  scope?: ClaimRow["scope"];
  provenance?: ClaimRow["provenance"];
  time?: ClaimRow["time"];
  assessment?: ClaimRow["assessment"];
  relations?: ClaimRow["relations"];
};

export type NoveltyResult = {
  classification: NoveltyClassification;
  matched_ids: string[];
  matches: NoveltyMatch[];
  rationale: string;
};

const HIGH_OVERLAP_THRESHOLD = 0.85;

export const RTL_FOLD: Readonly<Record<string, string>> = {
  "آ": "ا",
  "أ": "ا",
  "إ": "ا",
  "ٱ": "ا",
  "ي": "ی",
  "ى": "ی",
  "ئ": "ی",
  "ك": "ک",
  "٠": "0",
  "۰": "0",
  "١": "1",
  "۱": "1",
  "٢": "2",
  "۲": "2",
  "٣": "3",
  "۳": "3",
  "٤": "4",
  "۴": "4",
  "٥": "5",
  "۵": "5",
  "٦": "6",
  "۶": "6",
  "٧": "7",
  "۷": "7",
  "٨": "8",
  "۸": "8",
  "٩": "9",
  "۹": "9",
};

const PRIORITY: Record<NoveltyClassification, number> = {
  correction: 6,
  contradiction: 5,
  update: 4,
  duplicate: 3,
  corroboration: 2,
  new: 1,
};

export function normalizeStatement(statement: string): string {
  if (typeof statement !== "string") return "";
  const straightened = statement
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”‟″]/g, '"')
    .replace(/\u0640/g, "")
    .replace(/\u200c/g, " ");
  const lowered = straightened.toLowerCase();
  const filtered = Array.from(lowered)
    .map((ch) => RTL_FOLD[ch] ?? ch)
    .map((ch) => (isKeptChar(ch) ? ch : " "))
    .join("");
  return filtered.replace(/\s+/g, " ").trim();
}

export function classifyClaim(
  candidate: CandidateClaim,
  state: EffectiveState,
): NoveltyResult {
  const activeClaims = state.rows({ kinds: ["claim"] });
  const candidateNormalized = normalizeStatement(candidate.claim?.statement ?? "");
  const candidateTokens = candidateNormalized
    ? new Set(candidateNormalized.split(" ").filter((token) => token.length > 0))
    : new Set<string>();

  const matchesByReason = new Map<string, Set<NoveltyMatchReason>>();

  for (const entry of activeClaims) {
    const claim = entry.row as ClaimRow;
    if (claim.kind !== "claim") continue;
    const matchedId = claim.id;

    const candidateKey = candidate.identity?.claim_key;
    const matchKey = claim.identity?.claim_key;
    if (
      typeof candidateKey === "string" &&
      candidateKey.length > 0 &&
      candidateKey === matchKey
    ) {
      addReason(matchesByReason, matchedId, "claim_key_exact");
    }

    const candidateHash = candidate.identity?.dedupe_hash;
    const matchHash = claim.identity?.dedupe_hash;
    if (
      typeof candidateHash === "string" &&
      candidateHash.length > 0 &&
      candidateHash === matchHash
    ) {
      addReason(matchesByReason, matchedId, "dedupe_hash_exact");
    }

    if (candidateNormalized.length > 0) {
      const matchNormalized = normalizeStatement(claim.claim?.statement ?? "");
      if (matchNormalized.length > 0) {
        if (matchNormalized === candidateNormalized) {
          addReason(matchesByReason, matchedId, "statement_normalized_exact");
        } else {
          const matchTokens = new Set(
            matchNormalized.split(" ").filter((token) => token.length > 0),
          );
          if (jaccard(candidateTokens, matchTokens) >= HIGH_OVERLAP_THRESHOLD) {
            addReason(matchesByReason, matchedId, "statement_high_overlap");
          }
        }
      }
    }
  }

  if (matchesByReason.size === 0) {
    return {
      classification: "new",
      matched_ids: [],
      matches: [],
      rationale: "no active claim matched on key, hash, or statement",
    };
  }

  // Build per-pair classification
  const perPair: Array<{
    matchedId: string;
    classification: NoveltyClassification;
    reasons: NoveltyMatchReason[];
  }> = [];

  for (const [matchedId, reasonSet] of matchesByReason) {
    const matchedRow = findActiveById(activeClaims, matchedId);
    if (!matchedRow) continue;
    const reasons = Array.from(reasonSet);
    const pair = classifyPair(candidate, matchedRow, reasons);
    perPair.push({ matchedId, classification: pair.classification, reasons: pair.reasons });
  }

  if (perPair.length === 0) {
    return {
      classification: "new",
      matched_ids: [],
      matches: [],
      rationale: "no active claim matched on key, hash, or statement",
    };
  }

  // Pick highest priority classification
  let topPriority = 0;
  let topClassification: NoveltyClassification = "new";
  for (const pair of perPair) {
    const p = PRIORITY[pair.classification];
    if (p > topPriority) {
      topPriority = p;
      topClassification = pair.classification;
    }
  }

  const contributing = perPair.filter((p) => p.classification === topClassification);
  const matched_ids = contributing.map((p) => p.matchedId);
  const matches: NoveltyMatch[] = [];
  for (const pair of contributing) {
    for (const reason of pair.reasons) {
      matches.push({ matched_id: pair.matchedId, reason });
    }
  }

  const rationale = renderRationale(topClassification, contributing);
  return { classification: topClassification, matched_ids, matches, rationale };
}

export function classifyMany(
  candidates: CandidateClaim[],
  state: EffectiveState,
): NoveltyResult[] {
  return candidates.map((candidate) => classifyClaim(candidate, state));
}

type PairOutcome = {
  classification: NoveltyClassification;
  reasons: NoveltyMatchReason[];
};

function classifyPair(
  candidate: CandidateClaim,
  matchedRow: EffectiveRow,
  matchReasons: NoveltyMatchReason[],
): PairOutcome {
  const matched = matchedRow.row as ClaimRow;
  const reasons = [...matchReasons];

  const hasKeyOrHashMatch =
    matchReasons.includes("claim_key_exact") || matchReasons.includes("dedupe_hash_exact");
  const hasStatementExact = matchReasons.includes("statement_normalized_exact");
  const hasStatementOverlap = matchReasons.includes("statement_high_overlap");

  const explicitContradiction = detectContradiction(candidate, matched, hasKeyOrHashMatch);
  if (explicitContradiction) {
    reasons.push("explicit_contradiction_relation");
    return { classification: "contradiction", reasons };
  }

  const explicitCorrection = detectCorrection(candidate, hasKeyOrHashMatch);
  if (explicitCorrection) {
    reasons.push("explicit_correction_metadata");
    return { classification: "correction", reasons };
  }

  const evidenceAdded = candidateAddsEvidence(candidate, matched);
  const sourcesAdded = candidateAddsSources(candidate, matched);
  const timeChanged = candidateChangesTime(candidate, matched);
  const assessmentChanged = candidateChangesAssessment(candidate, matched);
  const statementChanged = candidateChangesStatement(candidate, matched);

  if (hasKeyOrHashMatch && timeChanged) {
    reasons.push("time_changed");
    return { classification: "update", reasons };
  }
  if (hasKeyOrHashMatch && assessmentChanged) {
    reasons.push("assessment_changed");
    return { classification: "update", reasons };
  }

  if (hasKeyOrHashMatch || hasStatementExact) {
    if (evidenceAdded || sourcesAdded) {
      reasons.push("evidence_added");
      return { classification: "corroboration", reasons };
    }
    if (
      !statementChanged &&
      !timeChanged &&
      !evidenceAdded &&
      !sourcesAdded &&
      !assessmentChanged
    ) {
      // Conservative rule: a normalized-statement-exact match without a key/hash
      // demotes to duplicate only when scopes overlap; otherwise treat as
      // corroboration since structured signals are absent.
      if (hasKeyOrHashMatch) return { classification: "duplicate", reasons };
      if (hasStatementExact && scopesOverlap(candidate, matched)) {
        return { classification: "duplicate", reasons };
      }
      return { classification: "corroboration", reasons };
    }
    return { classification: "corroboration", reasons };
  }

  if (hasStatementOverlap) {
    return { classification: "corroboration", reasons };
  }

  // Defensive fallback — shouldn't happen because matchReasons would be empty.
  return { classification: "new", reasons };
}

function detectContradiction(
  candidate: CandidateClaim,
  matched: ClaimRow,
  hasKeyOrHashMatch: boolean,
): boolean {
  const matchedId = matched.id;
  const relations = candidate.relations;
  if (Array.isArray(relations)) {
    for (const rel of relations) {
      if (rel && rel.rel === "contradicts" && rel.target_id === matchedId) {
        return true;
      }
    }
  }

  if (candidate.identity?.novelty === "contradiction" && hasKeyOrHashMatch) {
    return true;
  }

  const candidateEvidence = candidate.provenance?.evidence ?? [];
  if (candidateEvidence.length > 0) {
    const matchedSourceIds = new Set(matched.provenance?.source_ids ?? []);
    for (const ev of candidateEvidence) {
      if (ev?.role !== "contradicts") continue;
      const sourceId = ev.source_id;
      if (typeof sourceId !== "string" || sourceId.length === 0) continue;
      if (sourceId === matchedId) return true;
      if (matchedSourceIds.has(sourceId)) return true;
      const matchedEvidence = matched.provenance?.evidence ?? [];
      for (const matchedEv of matchedEvidence) {
        if (matchedEv?.source_id === sourceId) return true;
      }
    }
  }

  return false;
}

function detectCorrection(candidate: CandidateClaim, hasKeyOrHashMatch: boolean): boolean {
  if (candidate.identity?.novelty === "correction" && hasKeyOrHashMatch) {
    return true;
  }
  return false;
}

function candidateAddsEvidence(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const evidence = candidate.provenance?.evidence ?? [];
  if (evidence.length === 0) return false;
  const matchedPairs = evidencePairs(matched.provenance?.evidence ?? []);
  for (const ev of evidence) {
    const key = evidenceKey(ev);
    if (!key) continue;
    if (!matchedPairs.has(key)) return true;
  }
  return false;
}

function candidateAddsSources(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const sources = candidate.provenance?.source_ids ?? [];
  if (sources.length === 0) return false;
  const matchedSources = new Set(matched.provenance?.source_ids ?? []);
  for (const id of sources) {
    if (typeof id === "string" && id.length > 0 && !matchedSources.has(id)) return true;
  }
  return false;
}

function candidateChangesTime(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const ct = candidate.time;
  if (!ct) return false;
  const mt = matched.time ?? { precision: "unknown" as const };
  for (const field of ["valid_at", "valid_until", "occurred_at"] as const) {
    const cv = ct[field];
    if (cv === undefined || cv === null) continue;
    const mv = mt[field];
    if (cv !== mv) return true;
  }
  return false;
}

function candidateChangesAssessment(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const ca = candidate.assessment;
  if (!ca) return false;
  const ma = matched.assessment ?? {};
  if (ca.confidence !== undefined && ca.confidence !== ma.confidence) return true;
  if (ca.importance !== undefined && ca.importance !== ma.importance) return true;
  if (
    ca.information_depth?.level !== undefined &&
    ca.information_depth?.level !== ma.information_depth?.level
  ) {
    return true;
  }
  if (ca.contested !== undefined && ca.contested !== ma.contested) return true;
  return false;
}

function candidateChangesStatement(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const cs = candidate.claim?.statement;
  if (typeof cs !== "string" || cs.length === 0) return false;
  return normalizeStatement(cs) !== normalizeStatement(matched.claim?.statement ?? "");
}

function scopesOverlap(candidate: CandidateClaim, matched: ClaimRow): boolean {
  const cs = candidate.scope;
  const ms = matched.scope;
  if (!cs || !ms) return false;
  const cCols = new Set(cs.collections ?? []);
  for (const col of ms.collections ?? []) {
    if (cCols.has(col)) return true;
  }
  const cSubs = new Set(cs.subjects ?? []);
  for (const sub of ms.subjects ?? []) {
    if (cSubs.has(sub)) return true;
  }
  return false;
}

function evidencePairs(evidence: EvidenceRef[]): Set<string> {
  const set = new Set<string>();
  for (const ev of evidence) {
    const key = evidenceKey(ev);
    if (key) set.add(key);
  }
  return set;
}

function evidenceKey(ev: EvidenceRef | undefined): string | undefined {
  if (!ev) return undefined;
  if (typeof ev.source_id !== "string" || ev.source_id.length === 0) return undefined;
  if (typeof ev.role !== "string") return undefined;
  return `${ev.source_id}::${ev.role}`;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  const union = a.size + b.size - intersection;
  if (union === 0) return 0;
  return intersection / union;
}

function isKeptChar(ch: string): boolean {
  if (ch === "-" || ch === "'") return true;
  if (ch >= "a" && ch <= "z") return true;
  if (ch >= "0" && ch <= "9") return true;
  const code = ch.codePointAt(0);
  if (code !== undefined) {
    if (code >= 0x0600 && code <= 0x06ff) return true;
    if (code >= 0x0750 && code <= 0x077f) return true;
    if (code >= 0xfb50 && code <= 0xfdff) return true;
    if (code >= 0xfe70 && code <= 0xfeff) return true;
  }
  return /[\p{L}\p{N}]/u.test(ch);
}

function addReason(
  store: Map<string, Set<NoveltyMatchReason>>,
  id: string,
  reason: NoveltyMatchReason,
): void {
  let set = store.get(id);
  if (!set) {
    set = new Set();
    store.set(id, set);
  }
  // Skip statement_high_overlap when statement_normalized_exact already present
  if (reason === "statement_high_overlap" && set.has("statement_normalized_exact")) return;
  if (reason === "statement_normalized_exact") set.delete("statement_high_overlap");
  set.add(reason);
}

function findActiveById(rows: EffectiveRow[], id: string): EffectiveRow | undefined {
  for (const row of rows) if (row.row.id === id) return row;
  return undefined;
}

function renderRationale(
  classification: NoveltyClassification,
  contributing: Array<{ matchedId: string; reasons: NoveltyMatchReason[] }>,
): string {
  const count = contributing.length;
  const reasonSet = new Set<string>();
  for (const c of contributing) for (const r of c.reasons) reasonSet.add(r);
  const reasonList = Array.from(reasonSet).join(", ");
  const noun = count === 1 ? "active claim" : "active claims";
  return `${classification}: matched ${count} ${noun} via ${reasonList}`;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/selectors.ts
```ts
import { ROW_KINDS, type ExternalRef, type KnbRow, type KnbRowKind, type ValidationIssue } from "./contract";
import type { EffectiveRow } from "./state";

export type RowSelectorValue = string | number | boolean | null;
export type RowSelectorComparable = string | number;

export type RowSelectorWhere = {
  path: string;
  eq?: RowSelectorValue;
  in?: RowSelectorValue[];
  exists?: boolean;
  gte?: RowSelectorComparable;
  lte?: RowSelectorComparable;
};

export type RowSelectorExternalRef = {
  system?: string;
  id?: string;
  type?: string | null;
  path?: string | null;
};

export type RowSelector = {
  kinds?: KnbRowKind[];
  ids?: string[];
  scope?: {
    collections?: string[];
    subjects?: string[];
    tags?: string[];
  };
  external_refs?: RowSelectorExternalRef[];
  where?: RowSelectorWhere[];
};

export type StructuredClaimFilterRequest = {
  claimType?: string;
  predicate?: string;
  qualifiers?: Record<string, RowSelectorValue>;
  externalRefs?: RowSelectorExternalRef[];
};

export type RowSelectorValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

const ROW_SELECTOR_EXACT_PATHS = [
  "kind",
  "id",
  "created_at",
  "scope.collections",
  "scope.subjects",
  "scope.tags",
  "claim.type",
  "claim.subject",
  "claim.predicate",
  "claim.object",
  "time.valid_at",
  "time.occurred_at",
  "time.valid_from",
  "time.valid_until",
  "time.reported_at",
  "external_refs.system",
  "external_refs.id",
  "external_refs.type",
  "external_refs.path",
] as const;

const ROW_SELECTOR_PATH_PATTERNS = ["claim.qualifiers.<key>"] as const;

export function structuredClaimSelectorFromRequest(
  request: StructuredClaimFilterRequest,
): RowSelector | undefined {
  const where: RowSelectorWhere[] = [];
  if (request.claimType !== undefined) {
    where.push({ path: "claim.type", eq: request.claimType });
  }
  if (request.predicate !== undefined) {
    where.push({ path: "claim.predicate", eq: request.predicate });
  }
  for (const [key, value] of Object.entries(request.qualifiers ?? {})) {
    where.push({ path: `claim.qualifiers.${key}`, eq: value });
  }
  const externalRefs = request.externalRefs;
  if (where.length === 0 && (!Array.isArray(externalRefs) || externalRefs.length === 0)) {
    return undefined;
  }
  const selector: RowSelector = {};
  if (where.length > 0) selector.where = where;
  if (Array.isArray(externalRefs) && externalRefs.length > 0) selector.external_refs = externalRefs;
  return selector;
}

export function validateRowSelector(selector: unknown): RowSelectorValidationResult {
  const issues: ValidationIssue[] = [];
  if (selector === null || typeof selector !== "object" || Array.isArray(selector)) {
    issues.push({
      level: "error",
      code: "selector_invalid",
      message: "Row selector must be an object.",
    });
    return { ok: false, issues };
  }

  const typedSelector = selector as {
    kinds?: unknown;
    ids?: unknown;
    scope?: unknown;
    external_refs?: unknown;
    where?: unknown;
  };
  validateOptionalStringArray(typedSelector.kinds, "kinds", "selector_kinds_invalid", issues, ROW_KINDS);
  validateOptionalStringArray(typedSelector.ids, "ids", "selector_ids_invalid", issues);
  validateScopeSelector(typedSelector.scope, issues);
  validateExternalRefsSelector(typedSelector.external_refs, issues);

  const where = typedSelector.where;
  if (where !== undefined) {
    if (!Array.isArray(where)) {
      issues.push({
        level: "error",
        code: "selector_where_invalid",
        message: "Row selector where must be an array.",
        path: "where",
      });
    } else {
      where.forEach((clause, index) => validateWhereClause(clause, index, issues));
    }
  }

  return { ok: issues.length === 0, issues };
}

export function matchesRowSelector(row: KnbRow, selector: RowSelector): boolean {
  if (Array.isArray(selector.kinds) && selector.kinds.length > 0 && !selector.kinds.includes(row.kind)) {
    return false;
  }
  if (Array.isArray(selector.ids) && selector.ids.length > 0 && !selector.ids.includes(row.id)) {
    return false;
  }
  if (!matchesScope(row, selector.scope)) return false;
  if (!matchesExternalRefs(row.external_refs, selector.external_refs)) return false;
  for (const clause of selector.where ?? []) {
    const value = valueAtPath(row, clause.path);
    if (clause.eq !== undefined && !valueEquals(value, clause.eq)) return false;
    if (clause.in !== undefined && !valueIn(value, clause.in)) return false;
    if (clause.exists !== undefined && valueExists(value) !== clause.exists) return false;
    if ((clause.gte !== undefined || clause.lte !== undefined) && !valueInRange(value, clause)) return false;
  }
  return true;
}

export function selectEffectiveRows(rows: EffectiveRow[], selector: RowSelector): EffectiveRow[] {
  return rows.filter((effective) => matchesRowSelector(effective.row, selector));
}

export function rowSelectorValueAtPath(row: KnbRow, path: string): unknown {
  return valueAtPath(row, path);
}

export function rowSelectorSchema(): object {
  return {
    schema_version: "knb.selector.v1",
    type: "object",
    additionalProperties: false,
    properties: {
      kinds: { type: "array", items: { enum: ["source", "claim", "question", "synthesis", "change"] } },
      ids: { type: "array", items: { type: "string" } },
      scope: {
        type: "object",
        properties: {
          collections: { type: "array", items: { type: "string" } },
          subjects: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      external_refs: {
        type: "array",
        items: {
          type: "object",
          properties: {
            system: { type: "string" },
            id: { type: "string" },
            type: { type: ["string", "null"] },
            path: { type: ["string", "null"] },
          },
        },
      },
      where: {
        type: "array",
        items: {
          type: "object",
          required: ["path"],
          properties: {
            path: { type: "string" },
            eq: { type: ["string", "number", "boolean", "null"] },
            in: { type: "array", items: { type: ["string", "number", "boolean", "null"] } },
            exists: { type: "boolean" },
            gte: { type: ["string", "number"] },
            lte: { type: ["string", "number"] },
          },
        },
      },
    },
    allowed_paths: [...ROW_SELECTOR_EXACT_PATHS],
    path_patterns: [...ROW_SELECTOR_PATH_PATTERNS],
  };
}

export function rowSelectorSamples(): RowSelector[] {
  return [
    {
      kinds: ["claim"],
      scope: { collections: ["example-research"] },
      where: [
        { path: "claim.type", eq: "measurement" },
        { path: "claim.qualifiers.metric", eq: "latency" },
      ],
    },
    {
      kinds: ["claim"],
      where: [
        { path: "claim.type", in: ["measurement", "evaluation"] },
        { path: "time.valid_at", gte: "2026-01-01T00:00:00Z" },
      ],
    },
  ];
}

function validateWhereClause(clause: unknown, index: number, issues: ValidationIssue[]): void {
  const pathPrefix = `where[${index}]`;
  if (clause === null || typeof clause !== "object" || Array.isArray(clause)) {
    issues.push({
      level: "error",
      code: "selector_clause_invalid",
      message: "Row selector where clause must be an object.",
      path: pathPrefix,
    });
    return;
  }
  const typed = clause as {
    path?: unknown;
    eq?: unknown;
    in?: unknown;
    exists?: unknown;
    gte?: unknown;
    lte?: unknown;
  };
  if (typeof typed.path !== "string" || typed.path.length === 0) {
    issues.push({
      level: "error",
      code: "selector_path_missing",
      message: "Row selector where clause requires a non-empty path.",
      path: `${pathPrefix}.path`,
    });
  } else if (!isAllowedPath(typed.path)) {
    issues.push({
      level: "error",
      code: "selector_unknown_path",
      message: `Unknown selector path: ${typed.path}`,
      path: `${pathPrefix}.path`,
    });
  }
  const hasEq = "eq" in typed;
  const hasIn = "in" in typed;
  const hasExists = "exists" in typed;
  const hasRange = "gte" in typed || "lte" in typed;
  if (!hasEq && !hasIn && !hasExists && !hasRange) {
    issues.push({
      level: "error",
      code: "selector_clause_missing_operator",
      message: "Row selector where clause requires an operator.",
      path: pathPrefix,
    });
  }
  if (hasIn && (!Array.isArray(typed.in) || typed.in.length === 0)) {
    issues.push({
      level: "error",
      code: "selector_in_invalid",
      message: "Row selector in operator must be a non-empty array.",
      path: `${pathPrefix}.in`,
    });
  } else if (hasIn && Array.isArray(typed.in) && typed.in.some((value) => !isSelectorValue(value))) {
    issues.push({
      level: "error",
      code: "selector_in_invalid",
      message: "Row selector in operator values must be strings, numbers, booleans, or null.",
      path: `${pathPrefix}.in`,
    });
  }
  if (hasEq && !isSelectorValue(typed.eq)) {
    issues.push({
      level: "error",
      code: "selector_eq_invalid",
      message: "Row selector eq operator must be a string, number, boolean, or null.",
      path: `${pathPrefix}.eq`,
    });
  }
  if (hasExists && typeof typed.exists !== "boolean") {
    issues.push({
      level: "error",
      code: "selector_exists_invalid",
      message: "Row selector exists operator must be boolean.",
      path: `${pathPrefix}.exists`,
    });
  }
  if ("gte" in typed && !isComparableValue(typed.gte)) {
    issues.push({
      level: "error",
      code: "selector_range_invalid",
      message: "Row selector gte operator must be a string or number.",
      path: `${pathPrefix}.gte`,
    });
  }
  if ("lte" in typed && !isComparableValue(typed.lte)) {
    issues.push({
      level: "error",
      code: "selector_range_invalid",
      message: "Row selector lte operator must be a string or number.",
      path: `${pathPrefix}.lte`,
    });
  }
}

function validateOptionalStringArray(
  value: unknown,
  path: string,
  code: string,
  issues: ValidationIssue[],
  allowedValues?: readonly string[],
): void {
  if (value === undefined) return;
  const valid = Array.isArray(value) &&
    value.every((entry) =>
      typeof entry === "string" &&
      entry.length > 0 &&
      (allowedValues === undefined || allowedValues.includes(entry))
    );
  if (!valid) {
    issues.push({
      level: "error",
      code,
      message: `Row selector ${path} must be an array of valid strings.`,
      path,
    });
  }
}

function validateScopeSelector(scope: unknown, issues: ValidationIssue[]): void {
  if (scope === undefined) return;
  if (scope === null || typeof scope !== "object" || Array.isArray(scope)) {
    issues.push({
      level: "error",
      code: "selector_scope_invalid",
      message: "Row selector scope must be an object.",
      path: "scope",
    });
    return;
  }
  const typed = scope as { collections?: unknown; subjects?: unknown; tags?: unknown };
  const before = issues.length;
  validateOptionalStringArray(typed.collections, "scope.collections", "selector_scope_invalid", issues);
  validateOptionalStringArray(typed.subjects, "scope.subjects", "selector_scope_invalid", issues);
  validateOptionalStringArray(typed.tags, "scope.tags", "selector_scope_invalid", issues);
  if (issues.length > before) {
    for (let index = before; index < issues.length; index += 1) {
      const issue = issues[index];
      if (issue) issue.message = "Row selector scope arrays must contain only non-empty strings.";
    }
  }
}

function validateExternalRefsSelector(externalRefs: unknown, issues: ValidationIssue[]): void {
  if (externalRefs === undefined) return;
  if (!Array.isArray(externalRefs)) {
    issues.push({
      level: "error",
      code: "selector_external_ref_invalid",
      message: "Row selector external_refs must be an array.",
      path: "external_refs",
    });
    return;
  }
  for (let index = 0; index < externalRefs.length; index += 1) {
    const ref = externalRefs[index];
    if (ref === null || typeof ref !== "object" || Array.isArray(ref)) {
      issues.push({
        level: "error",
        code: "selector_external_ref_invalid",
        message: "Row selector external_refs entries must be objects.",
        path: `external_refs[${index}]`,
      });
      continue;
    }
    const typed = ref as Record<string, unknown>;
    for (const key of ["system", "id"] as const) {
      if (typed[key] !== undefined && typeof typed[key] !== "string") {
        issues.push({
          level: "error",
          code: "selector_external_ref_invalid",
          message: `Row selector external_refs[${index}].${key} must be a string.`,
          path: `external_refs[${index}].${key}`,
        });
        break;
      }
    }
    for (const key of ["type", "path"] as const) {
      if (typed[key] !== undefined && typed[key] !== null && typeof typed[key] !== "string") {
        issues.push({
          level: "error",
          code: "selector_external_ref_invalid",
          message: `Row selector external_refs[${index}].${key} must be a string or null.`,
          path: `external_refs[${index}].${key}`,
        });
        break;
      }
    }
  }
}

function isSelectorValue(value: unknown): value is RowSelectorValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function isAllowedPath(path: string): boolean {
  return (
    (ROW_SELECTOR_EXACT_PATHS as readonly string[]).includes(path) ||
    (path.startsWith("claim.qualifiers.") && path.length > "claim.qualifiers.".length)
  );
}

function valueAtPath(row: KnbRow, path: string): unknown {
  if (path === "kind") return row.kind;
  if (path === "id") return row.id;
  if (path === "created_at") return row.created_at;
  if (path === "scope.collections") return row.scope.collections;
  if (path === "scope.subjects") return row.scope.subjects;
  if (path === "scope.tags") return row.scope.tags;
  if (path === "claim.type") return row.kind === "claim" ? row.claim.type : undefined;
  if (path === "claim.subject") return row.kind === "claim" ? row.claim.subject : undefined;
  if (path === "claim.predicate") return row.kind === "claim" ? row.claim.predicate : undefined;
  if (path === "claim.object") return row.kind === "claim" ? row.claim.object : undefined;
  if (path === "time.valid_at") return "time" in row ? row.time?.valid_at : undefined;
  if (path === "time.occurred_at") return "time" in row ? row.time?.occurred_at : undefined;
  if (path === "time.valid_from") return "time" in row ? row.time?.valid_from : undefined;
  if (path === "time.valid_until") return "time" in row ? row.time?.valid_until : undefined;
  if (path === "time.reported_at") return "time" in row ? row.time?.reported_at : undefined;
  if (path === "external_refs.system") return row.external_refs?.map((ref) => ref.system);
  if (path === "external_refs.id") return row.external_refs?.map((ref) => ref.id);
  if (path === "external_refs.type") return row.external_refs?.map((ref) => ref.type);
  if (path === "external_refs.path") return row.external_refs?.map((ref) => ref.path);
  if (path.startsWith("claim.qualifiers.")) {
    if (row.kind !== "claim") return undefined;
    const key = path.slice("claim.qualifiers.".length);
    return row.claim.qualifiers?.[key];
  }
  return undefined;
}

function matchesScope(row: KnbRow, scope: RowSelector["scope"]): boolean {
  if (scope === undefined) return true;
  if (!scopeArrayMatches(row.scope.collections, scope.collections)) return false;
  if (!scopeArrayMatches(row.scope.subjects, scope.subjects)) return false;
  if (!scopeArrayMatches(row.scope.tags, scope.tags)) return false;
  return true;
}

function matchesExternalRefs(
  actual: ExternalRef[] | undefined,
  expected: RowSelectorExternalRef[] | undefined,
): boolean {
  if (!Array.isArray(expected) || expected.length === 0) return true;
  if (!Array.isArray(actual) || actual.length === 0) return false;
  return expected.every((selector) => actual.some((ref) => externalRefMatches(ref, selector)));
}

function externalRefMatches(actual: ExternalRef, expected: RowSelectorExternalRef): boolean {
  if (expected.system !== undefined && actual.system !== expected.system) return false;
  if (expected.id !== undefined && actual.id !== expected.id) return false;
  if (expected.type !== undefined && actual.type !== expected.type) return false;
  if (expected.path !== undefined && actual.path !== expected.path) return false;
  return true;
}

function scopeArrayMatches(actual: string[] | undefined, expected: string[] | undefined): boolean {
  if (!Array.isArray(expected) || expected.length === 0) return true;
  if (!Array.isArray(actual)) return false;
  return expected.some((value) => actual.includes(value));
}

function valueEquals(actual: unknown, expected: RowSelectorValue): boolean {
  if (Array.isArray(actual)) return actual.some((item) => item === expected);
  return actual === expected;
}

function valueIn(actual: unknown, expected: RowSelectorValue[]): boolean {
  if (Array.isArray(actual)) return actual.some((item) => expected.includes(item as RowSelectorValue));
  return expected.includes(actual as RowSelectorValue);
}

function valueExists(actual: unknown): boolean {
  if (actual === undefined || actual === null) return false;
  if (Array.isArray(actual)) return actual.length > 0;
  return true;
}

function valueInRange(actual: unknown, clause: RowSelectorWhere): boolean {
  const values = Array.isArray(actual) ? actual : [actual];
  return values.some((value) => comparableInRange(value, clause.gte, clause.lte));
}

function comparableInRange(
  actual: unknown,
  gte: RowSelectorComparable | undefined,
  lte: RowSelectorComparable | undefined,
): boolean {
  if (!isComparableValue(actual)) return false;
  if (gte !== undefined && compareComparable(actual, gte) < 0) return false;
  if (lte !== undefined && compareComparable(actual, lte) > 0) return false;
  return true;
}

function compareComparable(a: RowSelectorComparable, b: RowSelectorComparable): number {
  if (typeof a === "number" && typeof b === "number") return a - b;
  const aString = String(a);
  const bString = String(b);
  const aTime = Date.parse(aString);
  const bTime = Date.parse(bString);
  if (!Number.isNaN(aTime) && !Number.isNaN(bTime)) return aTime - bTime;
  return aString.localeCompare(bString);
}

function isComparableValue(value: unknown): value is RowSelectorComparable {
  return typeof value === "string" || typeof value === "number";
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/profiles.ts
```ts
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { KnbRow, LoadedRow, ValidationIssue } from "./contract";
import {
  matchesRowSelector,
  rowSelectorValueAtPath,
  validateRowSelector,
  type RowSelector,
  type RowSelectorValue,
} from "./selectors";
export type ProfileWorkspace = {
  paths: {
    profiles: string;
  };
};

type ProfileRuleType = "string" | "number" | "boolean";

export type ProfileRule = {
  path: string;
  required?: boolean;
  type?: ProfileRuleType;
  enum?: RowSelectorValue[];
  pattern?: string;
  min?: number;
  max?: number;
};

export type KnbProfile = {
  profile_version: "knb.profile.v1";
  name: string;
  select: RowSelector;
  rules: ProfileRule[];
  file_path: string;
};

export type KnbProfileFile = Omit<KnbProfile, "file_path">;

type LoadedProfiles = {
  profiles: KnbProfile[];
  issues: ValidationIssue[];
};

const PROFILE_VERSION = "knb.profile.v1";
const RULE_TYPES: ProfileRuleType[] = ["string", "number", "boolean"];

export async function validateProfilesForWorkspace(
  workspace: ProfileWorkspace,
  rows: LoadedRow[],
): Promise<ValidationIssue[]> {
  const loaded = await loadProfiles(workspace);
  const issues = [...loaded.issues];
  for (const profile of loaded.profiles) {
    for (const loadedRow of rows) {
      if (!rowMatchesProfile(loadedRow.row, profile)) continue;
      for (const rule of profile.rules) {
        validateProfileRule(profile, loadedRow, rule, issues);
      }
    }
  }
  return issues;
}

export function profileSchema(): object {
  return {
    schema_version: PROFILE_VERSION,
    type: "object",
    additionalProperties: false,
    required: ["profile_version", "name", "select", "rules"],
    properties: {
      profile_version: { const: PROFILE_VERSION },
      name: { type: "string", minLength: 1 },
      select: {
        description: "RowSelector deciding which canonical rows this profile validates.",
        $ref: "knb.selector.v1",
      },
      rules: {
        type: "array",
        items: {
          type: "object",
          required: ["path"],
          properties: {
            path: { type: "string" },
            required: { type: "boolean" },
            type: { enum: RULE_TYPES },
            enum: { type: "array", items: { type: ["string", "number", "boolean", "null"] } },
            pattern: { type: "string" },
            min: { type: "number" },
            max: { type: "number" },
          },
        },
      },
    },
  };
}

export function profileSamples(): KnbProfileFile[] {
  return [
    {
      profile_version: PROFILE_VERSION,
      name: "measurement-profile",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "measurement" }],
      },
      rules: [
        { path: "claim.qualifiers.metric", required: true, type: "string" },
        { path: "claim.qualifiers.value", required: true, type: "number" },
        { path: "claim.qualifiers.unit", required: true, type: "string" },
      ],
    },
    {
      profile_version: PROFILE_VERSION,
      name: "evaluation-profile",
      select: {
        kinds: ["claim"],
        where: [{ path: "claim.type", eq: "evaluation" }],
      },
      rules: [
        { path: "claim.qualifiers.subject", required: true, type: "string" },
        { path: "claim.qualifiers.rating", enum: ["low", "medium", "high"] },
      ],
    },
  ];
}

async function loadProfiles(workspace: ProfileWorkspace): Promise<LoadedProfiles> {
  let entries: string[];
  try {
    entries = await readdir(workspace.paths.profiles);
  } catch (error) {
    if (isMissing(error)) return { profiles: [], issues: [] };
    return {
      profiles: [],
      issues: [
        {
          level: "error",
          code: "profile_directory_unreadable",
          path: workspace.paths.profiles,
          message: `Failed to read profiles directory: ${workspace.paths.profiles}`,
        },
      ],
    };
  }

  const profiles: KnbProfile[] = [];
  const issues: ValidationIssue[] = [];
  for (const entry of entries.filter((name) => name.endsWith(".json")).sort()) {
    const filePath = join(workspace.paths.profiles, entry);
    let raw: string;
    try {
      raw = await readFile(filePath, "utf8");
    } catch (error) {
      issues.push({
        level: "error",
        code: "profile_file_unreadable",
        path: filePath,
        message: `Failed to read profile file: ${filePath}`,
      });
      continue;
    }
    const parsed = parseProfile(filePath, raw);
    issues.push(...parsed.issues);
    if (parsed.profile !== undefined) profiles.push(parsed.profile);
  }
  return { profiles, issues };
}

function parseProfile(filePath: string, raw: string): { profile?: KnbProfile; issues: ValidationIssue[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    return {
      issues: [
        {
          level: "error",
          code: "profile_parse_error",
          path: filePath,
          message: `Failed to parse profile JSON: ${filePath}`,
        },
      ],
    };
  }

  const issues: ValidationIssue[] = [];
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {
      issues: [
        {
          level: "error",
          code: "profile_definition_invalid",
          path: filePath,
          message: `Profile must be a JSON object: ${filePath}`,
        },
      ],
    };
  }

  const rawProfile = parsed as Record<string, unknown>;
  const profileName = typeof rawProfile.name === "string" && rawProfile.name.length > 0
    ? rawProfile.name
    : undefined;
  const issueProfile = profileName ?? filePath;

  if (rawProfile.profile_version !== PROFILE_VERSION) {
    issues.push(profileDefinitionIssue(filePath, issueProfile, "profile_version", "profile_version_invalid", `Profile ${issueProfile}: profile_version must be ${PROFILE_VERSION}.`));
  }
  if (profileName === undefined) {
    issues.push(profileDefinitionIssue(filePath, issueProfile, "name", "profile_name_required", `Profile ${filePath}: name must be a non-empty string.`));
  }

  const selectValidation = validateRowSelector(rawProfile.select);
  if (!selectValidation.ok) {
    for (const issue of selectValidation.issues) {
      issues.push(profileDefinitionIssue(
        filePath,
        issueProfile,
        `select${issue.path ? `.${issue.path}` : ""}`,
        "profile_selector_invalid",
        `Profile ${issueProfile}: invalid selector: ${issue.message}`,
      ));
    }
  }

  const rules = parseRules(filePath, issueProfile, rawProfile.rules, issues);
  if (issues.length > 0 || profileName === undefined) return { issues };
  return {
    profile: {
      profile_version: PROFILE_VERSION,
      name: profileName,
      select: rawProfile.select as RowSelector,
      rules,
      file_path: filePath,
    },
    issues,
  };
}

function parseRules(
  filePath: string,
  profile: string,
  rawRules: unknown,
  issues: ValidationIssue[],
): ProfileRule[] {
  if (!Array.isArray(rawRules)) {
    issues.push(profileDefinitionIssue(filePath, profile, "rules", "profile_rules_invalid", `Profile ${profile}: rules must be an array.`));
    return [];
  }

  const rules: ProfileRule[] = [];
  rawRules.forEach((rawRule, index) => {
    const prefix = `rules[${index}]`;
    if (rawRule === null || typeof rawRule !== "object" || Array.isArray(rawRule)) {
      issues.push(profileDefinitionIssue(filePath, profile, prefix, "profile_rule_invalid", `Profile ${profile}: ${prefix} must be an object.`));
      return;
    }
    const rule = rawRule as Record<string, unknown>;
    if (typeof rule.path !== "string" || rule.path.length === 0) {
      issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.path`, "profile_rule_path_required", `Profile ${profile}: ${prefix}.path must be a non-empty string.`));
      return;
    }
    const pathValidation = validateRowSelector({ where: [{ path: rule.path, exists: true }] });
    if (!pathValidation.ok) {
      issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.path`, "profile_rule_path_invalid", `Profile ${profile}: invalid rule path ${rule.path}.`));
      return;
    }
    const parsed: ProfileRule = { path: rule.path };
    if (rule.required !== undefined) {
      if (typeof rule.required !== "boolean") {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.required`, "profile_rule_required_invalid", `Profile ${profile}: ${prefix}.required must be boolean.`));
        return;
      }
      parsed.required = rule.required;
    }
    if (rule.type !== undefined) {
      if (!isProfileRuleType(rule.type)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.type`, "profile_rule_type_invalid", `Profile ${profile}: ${prefix}.type must be string, number, or boolean.`));
        return;
      }
      parsed.type = rule.type;
    }
    if (rule.enum !== undefined) {
      if (!Array.isArray(rule.enum) || rule.enum.length === 0 || !rule.enum.every(isRowSelectorValue)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.enum`, "profile_rule_enum_invalid", `Profile ${profile}: ${prefix}.enum must be a non-empty primitive array.`));
        return;
      }
      parsed.enum = rule.enum;
    }
    if (rule.pattern !== undefined) {
      if (typeof rule.pattern !== "string") {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.pattern`, "profile_rule_pattern_invalid", `Profile ${profile}: ${prefix}.pattern must be a string.`));
        return;
      }
      try {
        new RegExp(rule.pattern);
      } catch {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.pattern`, "profile_rule_pattern_invalid", `Profile ${profile}: ${prefix}.pattern must compile as a regular expression.`));
        return;
      }
      parsed.pattern = rule.pattern;
    }
    if (rule.min !== undefined) {
      if (typeof rule.min !== "number" || !Number.isFinite(rule.min)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.min`, "profile_rule_min_invalid", `Profile ${profile}: ${prefix}.min must be a finite number.`));
        return;
      }
      parsed.min = rule.min;
    }
    if (rule.max !== undefined) {
      if (typeof rule.max !== "number" || !Number.isFinite(rule.max)) {
        issues.push(profileDefinitionIssue(filePath, profile, `${prefix}.max`, "profile_rule_max_invalid", `Profile ${profile}: ${prefix}.max must be a finite number.`));
        return;
      }
      parsed.max = rule.max;
    }
    if (parsed.min !== undefined && parsed.max !== undefined && parsed.min > parsed.max) {
      issues.push(profileDefinitionIssue(filePath, profile, prefix, "profile_rule_range_invalid", `Profile ${profile}: ${prefix}.min must be <= max.`));
      return;
    }
    rules.push(parsed);
  });
  return rules;
}

function validateProfileRule(
  profile: KnbProfile,
  loaded: LoadedRow,
  rule: ProfileRule,
  issues: ValidationIssue[],
): void {
  const value = rowSelectorValueAtPath(loaded.row, rule.path);
  const values = concreteValues(value);
  if (rule.required === true && values.length === 0) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_required_path", `Profile ${profile.name}: row ${loaded.row.id} is missing required path ${rule.path}.`));
    return;
  }
  if (values.length === 0) return;

  if (rule.type !== undefined && !values.every((item) => valueMatchesType(item, rule.type!))) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_type_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be ${rule.type}.`));
  }
  if (rule.enum !== undefined && !values.every((item) => rule.enum!.includes(item as RowSelectorValue))) {
    issues.push(rowIssue(profile, loaded, rule.path, "profile_enum_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be one of the configured enum values.`));
  }
  if (rule.pattern !== undefined) {
    const re = new RegExp(rule.pattern);
    if (!values.every((item) => typeof item === "string" && re.test(item))) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_pattern_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must match ${rule.pattern}.`));
    }
  }
  if (rule.min !== undefined) {
    if (!values.every((item) => typeof item === "number" && item >= rule.min!)) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_min_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be >= ${rule.min}.`));
    }
  }
  if (rule.max !== undefined) {
    if (!values.every((item) => typeof item === "number" && item <= rule.max!)) {
      issues.push(rowIssue(profile, loaded, rule.path, "profile_max_mismatch", `Profile ${profile.name}: row ${loaded.row.id} path ${rule.path} must be <= ${rule.max}.`));
    }
  }
}

function rowMatchesProfile(row: KnbRow, profile: KnbProfile): boolean {
  try {
    return matchesRowSelector(row, profile.select);
  } catch {
    return false;
  }
}

function concreteValues(value: unknown): unknown[] {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter((entry) => entry !== undefined && entry !== null);
  return [value];
}

function profileDefinitionIssue(
  filePath: string,
  profile: string,
  path: string,
  code: string,
  message: string,
): ValidationIssue {
  return {
    level: "error",
    code,
    profile,
    path: `${filePath}:${path}`,
    message,
  };
}

function rowIssue(
  profile: KnbProfile,
  loaded: LoadedRow,
  path: string,
  code: string,
  message: string,
): ValidationIssue {
  return {
    level: "error",
    code,
    profile: profile.name,
    id: loaded.row.id,
    line: loaded.line,
    path,
    message,
  };
}

function isProfileRuleType(value: unknown): value is ProfileRuleType {
  return typeof value === "string" && (RULE_TYPES as string[]).includes(value);
}

function isRowSelectorValue(value: unknown): value is RowSelectorValue {
  return value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean";
}

function valueMatchesType(value: unknown, type: ProfileRuleType): boolean {
  return typeof value === type;
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/ledger.ts
```ts
// Ledger module - V1 owner of knb/ledger.jsonl filesystem correctness.
// Loads JSONL defensively with line-numbered parse issues, computes canonical
// fingerprints from ledger bytes, and runs read/append/flush inside a locked
// write transaction. Callers do not touch readFile / appendFile / writeFile
// against the ledger; if they did, lock and JSONL invariants would leak out.

import { appendFile, mkdir, open, readFile as fsReadFile, unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname } from "node:path";

import type { KnbRow } from "./contract";
import { knbError } from "./errors";

export type LoadedRow = {
  row: KnbRow;
  line: number;
  bytes: number;
};

export type ParseIssue = {
  level: "error";
  code: "jsonl_parse_failed" | "ledger_unreadable";
  message: string;
  line?: number;
};

export type LedgerFingerprint = {
  path: string;
  rows: number;
  bytes: number;
  last_row_id?: string;
  content_hash: string;
};

export type LedgerSnapshot = {
  rows: LoadedRow[];
  parseIssues: ParseIssue[];
  fingerprint: LedgerFingerprint;
};

export type LedgerLoadOptions = {
  path: string;
  readFile?: (p: string) => Promise<string>;
  hash?: (data: string) => string;
};

export type LedgerLockHandle = {
  release(): Promise<void>;
};

export type LedgerFsBackend = {
  acquireLock(lockPath: string): Promise<LedgerLockHandle>;
  ensureDir(dir: string): Promise<void>;
  appendBytes(path: string, data: string): Promise<number>;
  fsyncFile?(path: string): Promise<void>;
  fsyncDir?(dir: string): Promise<void>;
};

export type LedgerWriteOptions = {
  path: string;
  lockPath: string;
  readFile?: (p: string) => Promise<string>;
  hash?: (data: string) => string;
  fsBackend?: LedgerFsBackend;
  waitMs?: number;
};

export type LedgerAppendPlan<T> = {
  rows: KnbRow[];
  result: T;
};

export type LedgerWriteTransaction<T> = (
  snapshot: LedgerSnapshot,
) => Promise<LedgerAppendPlan<T>>;

export type LedgerWriteResult<T> = {
  result: T;
  rowsRead: number;
  rowsAppended: number;
  bytesWritten: number;
  fingerprintBefore: LedgerFingerprint;
  fingerprintAfter: LedgerFingerprint;
};

export function canonicalContentHash(text: string): string {
  return `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
}

export async function loadLedger(options: LedgerLoadOptions): Promise<LedgerSnapshot> {
  const reader = options.readFile ?? defaultReadFile;
  const hasher = options.hash ?? canonicalContentHash;

  let content: string;
  try {
    content = await reader(options.path);
  } catch (error) {
    if (isMissing(error)) {
      return {
        rows: [],
        parseIssues: [],
        fingerprint: {
          path: options.path,
          rows: 0,
          bytes: 0,
          content_hash: hasher(""),
        },
      };
    }
    throw knbError(
      "io_failed",
      `Failed to read ledger: ${options.path}`,
      { path: options.path },
      error,
    );
  }

  const rows: LoadedRow[] = [];
  const parseIssues: ParseIssue[] = [];
  const lines = content.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const line = raw.trim();
    if (!line) continue;
    const lineNumber = index + 1;
    try {
      const row = JSON.parse(line) as KnbRow;
      rows.push({ row, line: lineNumber, bytes: Buffer.byteLength(line, "utf8") });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      parseIssues.push({
        level: "error",
        code: "jsonl_parse_failed",
        line: lineNumber,
        message: `Invalid JSON at line ${lineNumber}: ${detail}`,
      });
    }
  }

  const fingerprint: LedgerFingerprint = {
    path: options.path,
    rows: rows.length,
    bytes: Buffer.byteLength(content, "utf8"),
    content_hash: hasher(content),
  };
  const lastId = rows.length > 0 ? stringId(rows[rows.length - 1]?.row) : undefined;
  if (lastId !== undefined) fingerprint.last_row_id = lastId;

  return { rows, parseIssues, fingerprint };
}

export async function writeLedger<T>(
  options: LedgerWriteOptions,
  transaction: LedgerWriteTransaction<T>,
): Promise<LedgerWriteResult<T>> {
  const backend = options.fsBackend ?? defaultLedgerFsBackend;
  const reader = options.readFile ?? defaultReadFile;
  const hasher = options.hash ?? canonicalContentHash;

  const handle = await backend.acquireLock(options.lockPath);

  let txResult: LedgerWriteResult<T> | undefined;
  let txError: unknown;
  try {
    const snapshotBefore = await loadLedger({ path: options.path, readFile: reader, hash: hasher });

    const plan = await transaction(snapshotBefore);
    if (!Array.isArray(plan?.rows)) {
      throw knbError(
        "internal_error",
        "Ledger write transaction must return an array of rows",
        { path: options.path },
      );
    }

    const serialized: string[] = [];
    for (let index = 0; index < plan.rows.length; index += 1) {
      const row = plan.rows[index];
      if (row === null || typeof row !== "object" || Array.isArray(row)) {
        throw knbError(
          "internal_error",
          `Ledger write transaction returned a non-object row at index ${index}`,
          { path: options.path, index },
        );
      }
      const json = JSON.stringify(row);
      if (json.includes("\n") || json.includes("\r")) {
        throw knbError(
          "internal_error",
          `Serialized row at index ${index} contains newline characters`,
          { path: options.path, index },
        );
      }
      serialized.push(json);
    }

    let bytesWritten = 0;
    if (serialized.length > 0) {
      const batch = `${serialized.join("\n")}\n`;
      try {
        await backend.ensureDir(dirname(options.path));
      } catch (error) {
        throw knbError(
          "io_failed",
          `Failed to create ledger directory: ${dirname(options.path)}`,
          { path: options.path },
          error,
        );
      }
      try {
        bytesWritten = await backend.appendBytes(options.path, batch);
      } catch (error) {
        throw knbError(
          "io_failed",
          `Failed to append to ledger: ${options.path}`,
          { path: options.path },
          error,
        );
      }
      if (backend.fsyncFile) {
        try {
          await backend.fsyncFile(options.path);
        } catch (error) {
          throw knbError(
            "io_failed",
            `Failed to fsync ledger file: ${options.path}`,
            { path: options.path },
            error,
          );
        }
      }
      if (backend.fsyncDir) {
        try {
          await backend.fsyncDir(dirname(options.path));
        } catch {
          // best-effort; some platforms reject directory fsync
        }
      }
    }

    const snapshotAfter = await loadLedger({ path: options.path, readFile: reader, hash: hasher });

    txResult = {
      result: plan.result,
      rowsRead: snapshotBefore.rows.length,
      rowsAppended: plan.rows.length,
      bytesWritten,
      fingerprintBefore: snapshotBefore.fingerprint,
      fingerprintAfter: snapshotAfter.fingerprint,
    };
  } catch (error) {
    txError = error;
  }

  let releaseError: unknown;
  try {
    await handle.release();
  } catch (error) {
    releaseError = error;
  }

  if (txError !== undefined) throw txError;
  if (releaseError !== undefined) {
    throw knbError(
      "internal_error",
      `Failed to release ledger lock: ${options.lockPath}`,
      { lockPath: options.lockPath },
      releaseError,
    );
  }
  return txResult as LedgerWriteResult<T>;
}

export const defaultLedgerFsBackend: LedgerFsBackend = {
  async acquireLock(lockPath: string): Promise<LedgerLockHandle> {
    try {
      await mkdir(dirname(lockPath), { recursive: true });
    } catch (error) {
      throw knbError(
        "io_failed",
        `Failed to create lock directory: ${dirname(lockPath)}`,
        { lockPath },
        error,
      );
    }
    let handle: Awaited<ReturnType<typeof open>>;
    try {
      handle = await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code === "EEXIST") {
        throw knbError("lock_busy", "Ledger lock busy", { lockPath });
      }
      throw knbError(
        "io_failed",
        `Failed to acquire ledger lock: ${lockPath}`,
        { lockPath },
        error,
      );
    }
    return {
      async release(): Promise<void> {
        try {
          await handle.close();
        } catch {
          // file handle may already be closed; the unlink below is the source of truth
        }
        try {
          await unlink(lockPath);
        } catch (error) {
          if ((error as NodeJS.ErrnoException)?.code === "ENOENT") return;
          throw error;
        }
      },
    };
  },

  async ensureDir(dir: string): Promise<void> {
    await mkdir(dir, { recursive: true });
  },

  async appendBytes(path: string, data: string): Promise<number> {
    await appendFile(path, data, "utf8");
    return Buffer.byteLength(data, "utf8");
  },

  async fsyncFile(path: string): Promise<void> {
    const handle = await open(path, "r+");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  },

  async fsyncDir(dir: string): Promise<void> {
    try {
      const handle = await open(dir, "r");
      try {
        await handle.sync();
      } finally {
        await handle.close();
      }
    } catch {
      // best-effort directory fsync; some platforms (notably Windows) refuse
    }
  },
};

function defaultReadFile(path: string): Promise<string> {
  return fsReadFile(path, "utf8");
}

function isMissing(error: unknown): boolean {
  if (error === null || typeof error !== "object") return false;
  const code = (error as { code?: unknown }).code;
  return code === "ENOENT" || code === "ENOTDIR";
}

function stringId(row: KnbRow | undefined): string | undefined {
  if (!row) return undefined;
  const id = (row as { id?: unknown }).id;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/context.ts
```ts
import type {
  ClaimRow,
  KnbRow,
  QuestionRow,
  SourceRow,
  SynthesisRow,
} from "./contract";
import {
  matchesRowSelector,
  structuredClaimSelectorFromRequest,
  type RowSelectorExternalRef,
  type RowSelectorValue,
} from "./selectors";
import type { EffectiveRow, EffectiveState, StateWarning } from "./state";

export type ContextRequest = {
  collection?: string;
  subject?: string;
  tag?: string;
  asOf?: string;
  claimType?: string;
  predicate?: string;
  qualifiers?: Record<string, RowSelectorValue>;
  externalRefs?: RowSelectorExternalRef[];
  maxTokens?: number;
  includeWarnings?: boolean;
  recencyWindowDays?: number;
  scoringProfile?: ContextScoringProfileInput;
  tokenEstimator?: (text: string) => number;
};

export type ContextSource = {
  id: string;
  title: string;
  publisher?: string;
  uri?: string;
};

export type ContextClaim = {
  id: string;
  statement: string;
  confidence?: string;
  importance?: string;
  contested?: boolean;
  source_ids: string[];
  time?: string;
};

export type ContextSynthesis = {
  id: string;
  title: string;
  summary: string;
  limitations?: string;
  basis: { claim_ids?: string[]; question_ids?: string[]; source_ids?: string[] };
};

export type ContextQuestion = {
  id: string;
  text: string;
  priority?: string;
  why_it_matters?: string;
};

export type ContextWarning = {
  code: string;
  message: string;
};

export type ContextResult = {
  summary: string;
  syntheses: ContextSynthesis[];
  key_claims: ContextClaim[];
  open_questions: ContextQuestion[];
  sources: ContextSource[];
  warnings: ContextWarning[];
  token_estimate: number;
  truncated: boolean;
  meta: {
    collection?: string;
    subject?: string;
    tag?: string;
    counts: {
      syntheses: number;
      claims: number;
      questions: number;
      sources: number;
    };
  };
};

const DEFAULT_MAX_TOKENS = 3000;
const THIN_EVIDENCE_THRESHOLD = 2;

const IMPORTANCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
const CONFIDENCE_RANK: Record<string, number> = { high: 3, medium: 2, low: 1, unknown: 0 };
const INFO_DEPTH_RANK: Record<string, number> = {
  complete: 4,
  strong: 3,
  partial: 2,
  thin: 1,
  unknown: 0,
};
const PRIORITY_RANK: Record<string, number> = { high: 3, medium: 2, low: 1 };

export type ContextScoringWeights = {
  importance: Readonly<Record<string, number>>;
  confidence: Readonly<Record<string, number>>;
  informationDepth: Readonly<Record<string, number>>;
  priority: Readonly<Record<string, number>>;
};

export type ContextScoringWeightsInput = {
  importance?: Readonly<Record<string, number>>;
  confidence?: Readonly<Record<string, number>>;
  informationDepth?: Readonly<Record<string, number>>;
  priority?: Readonly<Record<string, number>>;
};

export type ContextScoringProfile = {
  weights: ContextScoringWeights;
  thinEvidenceThreshold: number;
  recency?: ContextRecencyProfile;
};

export type ContextRecencyProfile = {
  windowDays: number;
  weight: number;
};

export type ContextScoringProfileInput = {
  weights?: ContextScoringWeightsInput;
  thinEvidenceThreshold?: number;
  recency?: Partial<ContextRecencyProfile>;
};

export type ContextSynthesisScore = {
  importance: number;
  recency: number;
  createdAt: string;
  basisDepth: number;
  id: string;
};

export type ContextClaimScore = {
  importance: number;
  confidence: number;
  recency: number;
  informationDepth: number;
  evidenceCount: number;
  contested: number;
  createdAt: string;
  id: string;
};

export type ContextQuestionScore = {
  priority: number;
  importance: number;
  recency: number;
  createdAt: string;
  id: string;
};

export const DEFAULT_CONTEXT_SCORING_PROFILE: ContextScoringProfile = {
  weights: {
    importance: IMPORTANCE_RANK,
    confidence: CONFIDENCE_RANK,
    informationDepth: INFO_DEPTH_RANK,
    priority: PRIORITY_RANK,
  },
  thinEvidenceThreshold: THIN_EVIDENCE_THRESHOLD,
};

function resolveContextScoringProfile(
  input: ContextScoringProfileInput | undefined,
  recencyWindowDays: number | undefined,
): ContextScoringProfile {
  if (input === undefined && recencyWindowDays === undefined) return DEFAULT_CONTEXT_SCORING_PROFILE;
  const profile: ContextScoringProfile = {
    weights: {
      importance: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.importance, ...input?.weights?.importance },
      confidence: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.confidence, ...input?.weights?.confidence },
      informationDepth: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.informationDepth, ...input?.weights?.informationDepth },
      priority: { ...DEFAULT_CONTEXT_SCORING_PROFILE.weights.priority, ...input?.weights?.priority },
    },
    thinEvidenceThreshold:
      typeof input?.thinEvidenceThreshold === "number" && Number.isFinite(input.thinEvidenceThreshold)
        ? Math.max(0, input.thinEvidenceThreshold)
        : DEFAULT_CONTEXT_SCORING_PROFILE.thinEvidenceThreshold,
  };
  const profileRecencyWindow = finitePositiveNumber(input?.recency?.windowDays);
  const requestRecencyWindow = finitePositiveNumber(recencyWindowDays);
  const windowDays = requestRecencyWindow ?? profileRecencyWindow;
  if (windowDays !== undefined) {
    profile.recency = {
      windowDays,
      weight: finitePositiveNumber(input?.recency?.weight) ?? 1,
    };
  }
  return profile;
}

function finitePositiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : undefined;
}

function recencyScore(row: KnbRow, profile: ContextScoringProfile, anchor: string | undefined): number {
  const recency = profile.recency;
  if (recency === undefined || anchor === undefined) return 0;
  const anchorMs = Date.parse(anchor);
  const createdMs = Date.parse(row.created_at);
  if (!Number.isFinite(anchorMs) || !Number.isFinite(createdMs) || createdMs > anchorMs) return 0;
  const ageDays = (anchorMs - createdMs) / 86_400_000;
  return Math.max(0, 1 - ageDays / recency.windowDays) * recency.weight;
}

function defaultEstimator(text: string): number {
  return Math.ceil(text.length / 4);
}

function importanceOf(row: KnbRow): string {
  const assessment = (row as { assessment?: { importance?: string } }).assessment;
  return assessment?.importance ?? "unknown";
}

function confidenceOf(row: ClaimRow): string {
  return row.assessment?.confidence ?? "unknown";
}

function informationDepthOf(row: ClaimRow): string {
  return row.assessment?.information_depth?.level ?? "unknown";
}

function evidenceCountOf(row: ClaimRow): number {
  return row.provenance?.evidence?.length ?? 0;
}

function contestedOf(row: ClaimRow): boolean {
  return row.assessment?.contested === true;
}

function priorityOf(row: QuestionRow): string {
  return row.question.priority ?? "low";
}

function basisDepthOf(row: SynthesisRow): number {
  const basis = row.synthesis.basis;
  const claims = basis.claim_ids?.length ?? 0;
  const questions = basis.question_ids?.length ?? 0;
  const sources = basis.source_ids?.length ?? 0;
  return claims + questions + sources;
}

export function scoreContextSynthesis(
  row: SynthesisRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextSynthesisScore {
  return {
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    createdAt: row.created_at,
    basisDepth: basisDepthOf(row),
    id: row.id,
  };
}

export function scoreContextClaim(
  row: ClaimRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextClaimScore {
  return {
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    confidence: profile.weights.confidence[confidenceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    informationDepth: profile.weights.informationDepth[informationDepthOf(row)] ?? 0,
    evidenceCount: evidenceCountOf(row),
    contested: contestedOf(row) ? 1 : 0,
    createdAt: row.created_at,
    id: row.id,
  };
}

export function scoreContextQuestion(
  row: QuestionRow,
  profile: ContextScoringProfile = DEFAULT_CONTEXT_SCORING_PROFILE,
  recencyAnchor?: string,
): ContextQuestionScore {
  return {
    priority: profile.weights.priority[priorityOf(row)] ?? 0,
    importance: profile.weights.importance[importanceOf(row)] ?? 0,
    recency: recencyScore(row, profile, recencyAnchor),
    createdAt: row.created_at,
    id: row.id,
  };
}

function timeOf(row: ClaimRow): string | undefined {
  const t = row.time;
  return t.valid_at ?? t.occurred_at ?? t.valid_from ?? t.reported_at ?? undefined;
}

function rankSyntheses(rows: SynthesisRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): SynthesisRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextSynthesis(a, profile, recencyAnchor);
    const scoreB = scoreContextSynthesis(b, profile, recencyAnchor);
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    if (scoreA.basisDepth !== scoreB.basisDepth) return scoreB.basisDepth - scoreA.basisDepth;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function rankClaims(rows: ClaimRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): ClaimRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextClaim(a, profile, recencyAnchor);
    const scoreB = scoreContextClaim(b, profile, recencyAnchor);
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.confidence !== scoreB.confidence) return scoreB.confidence - scoreA.confidence;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (scoreA.informationDepth !== scoreB.informationDepth) return scoreB.informationDepth - scoreA.informationDepth;
    if (scoreA.evidenceCount !== scoreB.evidenceCount) return scoreB.evidenceCount - scoreA.evidenceCount;
    if (scoreA.contested !== scoreB.contested) return scoreB.contested - scoreA.contested;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function rankQuestions(rows: QuestionRow[], profile: ContextScoringProfile, recencyAnchor: string | undefined): QuestionRow[] {
  return [...rows].sort((a, b) => {
    const scoreA = scoreContextQuestion(a, profile, recencyAnchor);
    const scoreB = scoreContextQuestion(b, profile, recencyAnchor);
    if (scoreA.priority !== scoreB.priority) return scoreB.priority - scoreA.priority;
    if (scoreA.importance !== scoreB.importance) return scoreB.importance - scoreA.importance;
    if (scoreA.recency !== scoreB.recency) return scoreB.recency - scoreA.recency;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

function matchesScope(row: KnbRow, request: ContextRequest): boolean {
  if (request.collection && !row.scope.collections?.includes(request.collection)) return false;
  if (request.subject && !row.scope.subjects?.includes(request.subject)) return false;
  if (request.tag && !row.scope.tags?.includes(request.tag)) return false;
  return true;
}

function newestCreatedAt(rows: EffectiveRow[]): string | undefined {
  let newest: string | undefined;
  for (const effective of rows) {
    const createdAt = effective.row.created_at;
    if (newest === undefined || createdAt > newest) newest = createdAt;
  }
  return newest;
}

function canonicalSourceIds(ids: Iterable<string | undefined>, state: EffectiveState): string[] {
  const out = new Set<string>();
  for (const id of ids) {
    if (typeof id !== "string" || id.length === 0) continue;
    out.add(state.canonicalIdOf(id));
  }
  return [...out];
}

function toContextSynthesis(row: SynthesisRow, state: EffectiveState): ContextSynthesis {
  const basis: ContextSynthesis["basis"] = { ...row.synthesis.basis };
  if (row.synthesis.basis.source_ids !== undefined) {
    basis.source_ids = canonicalSourceIds(row.synthesis.basis.source_ids, state);
  }
  const out: ContextSynthesis = {
    id: row.id,
    title: row.synthesis.title,
    summary: row.synthesis.summary,
    basis,
  };
  if (row.synthesis.limitations) out.limitations = row.synthesis.limitations;
  return out;
}

function toContextClaim(row: ClaimRow, state: EffectiveState): ContextClaim {
  const sourceIds = canonicalSourceIds(
    [
      ...(row.provenance.source_ids ?? []),
      ...(row.provenance.evidence ?? []).map((evidence) => evidence.source_id),
    ],
    state,
  );
  const out: ContextClaim = {
    id: row.id,
    statement: row.claim.statement,
    source_ids: sourceIds,
  };
  const conf = row.assessment?.confidence;
  if (conf) out.confidence = conf;
  const imp = row.assessment?.importance;
  if (imp) out.importance = imp;
  if (row.assessment?.contested === true) out.contested = true;
  const t = timeOf(row);
  if (t) out.time = t;
  return out;
}

function toContextQuestion(row: QuestionRow): ContextQuestion {
  const out: ContextQuestion = { id: row.id, text: row.question.text };
  if (row.question.priority) out.priority = row.question.priority;
  if (row.question.why_it_matters) out.why_it_matters = row.question.why_it_matters;
  return out;
}

function toContextSource(row: SourceRow): ContextSource {
  const out: ContextSource = { id: row.id, title: row.source.title };
  if (row.source.publisher) out.publisher = row.source.publisher;
  if (row.source.uri) out.uri = row.source.uri;
  return out;
}

function toMinimalSource(source: ContextSource): ContextSource {
  return { id: source.id, title: source.title };
}

function renderSynthesis(s: ContextSynthesis): string {
  return [s.title, s.summary, s.limitations ?? ""].join(" ");
}

function renderClaim(c: ContextClaim): string {
  return [c.statement, c.confidence ?? "", c.time ?? ""].join(" ");
}

function renderQuestion(q: ContextQuestion): string {
  return [q.text, q.why_it_matters ?? ""].join(" ");
}

function renderSource(s: ContextSource): string {
  return [s.title, s.publisher ?? ""].join(" ");
}

function estimatePacket(
  summary: string,
  syntheses: ContextSynthesis[],
  claims: ContextClaim[],
  questions: ContextQuestion[],
  sources: ContextSource[],
  warnings: ContextWarning[],
  estimator: (text: string) => number,
): number {
  let total = estimator(summary);
  for (const s of syntheses) total += estimator(renderSynthesis(s));
  for (const c of claims) total += estimator(renderClaim(c));
  for (const q of questions) total += estimator(renderQuestion(q));
  for (const s of sources) total += estimator(renderSource(s));
  for (const w of warnings) total += estimator(`${w.code} ${w.message}`);
  return total;
}

function buildSummary(
  scopeLabel: string,
  syntheses: ContextSynthesis[],
  claims: ContextClaim[],
  questions: ContextQuestion[],
  warningsCount: number,
  includeWarnings: boolean,
  empty: boolean,
): string {
  if (empty) return "Empty workspace.";
  const parts = [
    `${scopeLabel}: ${syntheses.length} syntheses, ${claims.length} claims, ${questions.length} open questions.`,
  ];
  if (includeWarnings && warningsCount > 0) {
    parts.push(`${warningsCount} warning${warningsCount === 1 ? "" : "s"}.`);
  }
  return parts.join(" ");
}

function selectedSourceIds(
  claims: ContextClaim[],
  syntheses: ContextSynthesis[],
): Set<string> {
  const ids = new Set<string>();
  for (const c of claims) for (const id of c.source_ids) ids.add(id);
  for (const s of syntheses) for (const id of s.basis.source_ids ?? []) ids.add(id);
  return ids;
}

function backingImportanceForSource(
  sourceId: string,
  claims: ContextClaim[],
  syntheses: ContextSynthesis[],
  rankedSynthesisOrder: Map<string, number>,
  profile: ContextScoringProfile,
): { importance: number; synthRank: number } {
  let importance = -1;
  let synthRank = Number.POSITIVE_INFINITY;
  for (const c of claims) {
    if (c.source_ids.includes(sourceId)) {
      const r = profile.weights.importance[c.importance ?? "unknown"] ?? 0;
      if (r > importance) importance = r;
    }
  }
  for (const s of syntheses) {
    if (s.basis.source_ids?.includes(sourceId)) {
      const rank = rankedSynthesisOrder.get(s.id) ?? Number.POSITIVE_INFINITY;
      if (rank < synthRank) synthRank = rank;
      if (importance < 0) importance = 0;
    }
  }
  return { importance, synthRank };
}

function buildWarnings(
  state: EffectiveState,
  selectedClaims: ContextClaim[],
  selectedClaimRows: ClaimRow[],
  scopedActiveCounts: { syntheses: number; claims: number },
  includeWarnings: boolean,
  profile: ContextScoringProfile,
): ContextWarning[] {
  if (!includeWarnings) return [];
  const warnings: ContextWarning[] = [];
  for (const w of state.warnings) warnings.push(stateWarningToContext(w));
  if (scopedActiveCounts.syntheses === 0) {
    warnings.push({
      code: "info_gap_no_active_synthesis",
      message: "No active syntheses in scope. Consider drafting one to orient further work.",
    });
  }
  if (scopedActiveCounts.claims === 0) {
    warnings.push({
      code: "info_gap_no_active_claims",
      message: "No active claims in scope.",
    });
  }
  const thinEvidenceThreshold = profile.thinEvidenceThreshold;
  const thin = selectedClaimRows.filter((c) => evidenceCountOf(c) < thinEvidenceThreshold).length;
  if (thin > 0) {
    warnings.push({
      code: "info_gap_thin_evidence",
      message: `${thin} selected claim${thin === 1 ? " has" : "s have"} fewer than ${thinEvidenceThreshold} evidence entries.`,
    });
  }
  const contested = selectedClaims.filter((c) => c.contested === true).length;
  if (contested > 0) {
    warnings.push({
      code: "contested_claims_present",
      message: `${contested} selected claim${contested === 1 ? " is" : "s are"} contested.`,
    });
  }
  return warnings;
}

function stateWarningToContext(w: StateWarning): ContextWarning {
  return { code: `state_${w.code}`, message: w.message };
}

export function buildContext(state: EffectiveState, request: ContextRequest = {}): ContextResult {
  const estimator = request.tokenEstimator ?? defaultEstimator;
  const scoringProfile = resolveContextScoringProfile(request.scoringProfile, request.recencyWindowDays);
  const maxTokens = request.maxTokens ?? DEFAULT_MAX_TOKENS;
  const includeWarnings = request.includeWarnings !== false;

  const allActive: EffectiveRow[] = state.rows();
  const inScope = allActive.filter((r) => matchesScope(r.row, request));
  const recencyAnchor = scoringProfile.recency === undefined
    ? undefined
    : request.asOf ?? newestCreatedAt(inScope);
  const structuredClaimSelector = structuredClaimSelectorFromRequest(request);
  const hasStructuredClaimFilter = structuredClaimSelector !== undefined;

  const synthesisRows: SynthesisRow[] = [];
  const claimRows: ClaimRow[] = [];
  const questionRows: QuestionRow[] = [];
  const sourceRows = new Map<string, SourceRow>();
  for (const r of inScope) {
    if (r.row.kind === "synthesis") {
      const s = r.row as SynthesisRow;
      if (!hasStructuredClaimFilter && s.synthesis.status === "active") synthesisRows.push(s);
    } else if (r.row.kind === "claim") {
      if (structuredClaimSelector !== undefined && !matchesRowSelector(r.row, structuredClaimSelector)) {
        continue;
      }
      claimRows.push(r.row as ClaimRow);
    } else if (r.row.kind === "question") {
      const q = r.row as QuestionRow;
      if (!hasStructuredClaimFilter && q.question.status === "open") questionRows.push(q);
    } else if (r.row.kind === "source") {
      sourceRows.set(r.row.id, r.row as SourceRow);
    }
  }

  const rankedSyntheses = rankSyntheses(synthesisRows, scoringProfile, recencyAnchor);
  const rankedClaims = rankClaims(claimRows, scoringProfile, recencyAnchor);
  const rankedQuestions = rankQuestions(questionRows, scoringProfile, recencyAnchor);
  const scopedActiveCounts = { syntheses: synthesisRows.length, claims: claimRows.length };

  let syntheses = rankedSyntheses.map((row) => toContextSynthesis(row, state));
  let claims = rankedClaims.map((row) => toContextClaim(row, state));
  let questions = rankedQuestions.map(toContextQuestion);
  let claimRowsBySelection = [...rankedClaims];

  const sourceIdsCited = selectedSourceIds(claims, syntheses);
  const candidateSources: ContextSource[] = [];
  for (const r of inScope) {
    if (r.row.kind !== "source") continue;
    if (sourceIdsCited.has(r.row.id)) {
      const sourceRow = sourceRows.get(r.row.id);
      if (sourceRow) candidateSources.push(toContextSource(sourceRow));
    }
  }
  let sources = candidateSources;

  const empty =
    syntheses.length === 0 &&
    claims.length === 0 &&
    questions.length === 0 &&
    sources.length === 0;

  const scopeLabel = request.collection
    ? `Collection ${request.collection}`
    : request.subject
      ? `Subject ${request.subject}`
      : request.tag
        ? `Tag ${request.tag}`
        : "Workspace";

  let warnings = buildWarnings(state, claims, claimRowsBySelection, scopedActiveCounts, includeWarnings, scoringProfile);
  let summary = buildSummary(
    scopeLabel,
    syntheses,
    claims,
    questions,
    warnings.length,
    includeWarnings,
    empty,
  );

  let estimate = estimatePacket(summary, syntheses, claims, questions, sources, warnings, estimator);
  let truncated = false;

  const recompute = () => {
    warnings = buildWarnings(state, claims, claimRowsBySelection, scopedActiveCounts, includeWarnings, scoringProfile);
    summary = buildSummary(
      scopeLabel,
      syntheses,
      claims,
      questions,
      warnings.length,
      includeWarnings,
      syntheses.length === 0 &&
        claims.length === 0 &&
        questions.length === 0 &&
        sources.length === 0,
    );
    estimate = estimatePacket(summary, syntheses, claims, questions, sources, warnings, estimator);
  };

  if (estimate > maxTokens) {
    const synthRankIndex = new Map<string, number>();
    rankedSyntheses.forEach((s, i) => synthRankIndex.set(s.id, i));

    const sortedSourcesForDrop = [...sources].sort((a, b) => {
      const ba = backingImportanceForSource(a.id, claims, syntheses, synthRankIndex, scoringProfile);
      const bb = backingImportanceForSource(b.id, claims, syntheses, synthRankIndex, scoringProfile);
      if (ba.importance !== bb.importance) return ba.importance - bb.importance;
      if (ba.synthRank !== bb.synthRank) return bb.synthRank - ba.synthRank;
      return a.id < b.id ? -1 : 1;
    });

    for (const s of sortedSourcesForDrop) {
      if (estimate <= maxTokens) break;
      if (s.publisher === undefined && s.uri === undefined) continue;
      const idx = sources.findIndex((x) => x.id === s.id);
      if (idx >= 0) {
        sources[idx] = toMinimalSource(sources[idx]!);
        truncated = true;
        recompute();
      }
    }

    while (estimate > maxTokens && claims.length > 0) {
      const lowFirst = [...claims].sort((a, b) => {
        const ai = scoringProfile.weights.importance[a.importance ?? "unknown"] ?? 0;
        const bi = scoringProfile.weights.importance[b.importance ?? "unknown"] ?? 0;
        return ai - bi;
      });
      const lowest = lowFirst[0];
      if (!lowest) break;
      const lowestRank = scoringProfile.weights.importance[lowest.importance ?? "unknown"] ?? 0;
      if (lowestRank > (scoringProfile.weights.importance.medium ?? 0)) break;
      claims = claims.filter((c) => c.id !== lowest.id);
      claimRowsBySelection = claimRowsBySelection.filter((c) => c.id !== lowest.id);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }

    while (estimate > maxTokens && questions.length > 0) {
      const lowFirst = [...questions].sort((a, b) => {
        const ai = scoringProfile.weights.priority[a.priority ?? "low"] ?? 0;
        const bi = scoringProfile.weights.priority[b.priority ?? "low"] ?? 0;
        return ai - bi;
      });
      const lowest = lowFirst[0];
      if (!lowest) break;
      const lowestRank = scoringProfile.weights.priority[lowest.priority ?? "low"] ?? 0;
      if (lowestRank > (scoringProfile.weights.priority.low ?? 0)) break;
      questions = questions.filter((q) => q.id !== lowest.id);
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && syntheses.length > 1) {
      syntheses = syntheses.slice(0, -1);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }

    while (estimate > maxTokens && claims.length > 0) {
      const lastId = claims[claims.length - 1]!.id;
      claims = claims.slice(0, -1);
      claimRowsBySelection = claimRowsBySelection.filter((c) => c.id !== lastId);
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && questions.length > 0) {
      questions = questions.slice(0, -1);
      truncated = true;
      recompute();
    }

    while (estimate > maxTokens && syntheses.length > 0) {
      syntheses = syntheses.slice(0, -1);
      truncated = true;
      const stillCited = selectedSourceIds(claims, syntheses);
      sources = sources.filter((s) => stillCited.has(s.id));
      recompute();
    }
  }

  const result: ContextResult = {
    summary,
    syntheses,
    key_claims: claims,
    open_questions: questions,
    sources,
    warnings,
    token_estimate: estimate,
    truncated,
    meta: {
      counts: {
        syntheses: syntheses.length,
        claims: claims.length,
        questions: questions.length,
        sources: sources.length,
      },
    },
  };
  if (request.collection) result.meta.collection = request.collection;
  if (request.subject) result.meta.subject = request.subject;
  if (request.tag) result.meta.tag = request.tag;
  return result;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/apply.ts
```ts
// Apply module - V1 single deep module for atomic operation batches.
// Owns reference resolution, ID generation with collision retry, lifecycle
// change-row construction, novelty hooks, and final candidate-ledger
// validation. Writes only through the ledger transaction; never touches
// the filesystem directly.

import {
  completeDraftRow,
  generateId,
  referenceFields,
  scopeSlug,
  validateApplyRequest,
  validateLedger,
  type ApplyOperation,
  type ApplyRequest,
  type ChangeRow,
  type DraftRow,
  type KnbRow,
  type KnbRowKind,
  type LoadedRow,
  type Provenance,
  type Scope,
  type ValidationIssue,
} from "./contract";
import { isKnbError, knbError, type KnbErrorCode } from "./errors";
import {
  loadLedger,
  writeLedger as defaultWriteLedger,
  type LedgerFingerprint,
  type LedgerSnapshot,
  type LedgerWriteResult,
} from "./ledger";
import { validateProfilesForWorkspace } from "./profiles";
import { isSafeRunManifestId, writeRunManifest as defaultWriteRunManifest, type RunManifest } from "./run-manifests";

const ID_COLLISION_RETRY_LIMIT = 8;

export function generateRunId(
  date: Date,
  randomIdPart: (bytes: number) => string,
  existingRandomPart?: string,
): string {
  const safeIso = date.toISOString().replace(/[:.]/g, "-");
  return `run_${safeIso}_${existingRandomPart ?? randomIdPart(4)}`;
}

export type NoveltyClassification =
  | "new"
  | "duplicate"
  | "corroboration"
  | "update"
  | "contradiction"
  | "correction";

export type NoveltyDecision = {
  classification: NoveltyClassification;
  matched_ids: string[];
};

export type ApplyDeps = {
  workspace: { paths: { ledger: string; lock: string; profiles?: string; runs?: string } };
  runtime: { clock: () => Date; randomIdPart: (bytes: number) => string };
  actor: string;
  writeLedger?: typeof defaultWriteLedger;
  writeRunManifest?: typeof defaultWriteRunManifest | false;
  classifyNovelty?: (candidate: KnbRow, snapshot: LedgerSnapshot) => NoveltyDecision;
};

export type ApplyCreatedEntry = {
  op: number;
  as?: string;
  id: string;
  kind: KnbRowKind;
};

export type ApplySkippedEntry = {
  op: number;
  reason: string;
  matched_ids?: string[];
};

export type ApplyNoveltyEntry = {
  op: number;
  classification: string;
  matched_ids: string[];
};

export type ApplyResult = {
  run_id: string;
  created: ApplyCreatedEntry[];
  skipped: ApplySkippedEntry[];
  warnings: string[];
  novelty: ApplyNoveltyEntry[];
  meta: {
    rows_appended: number;
    bytes_written: number;
    ledger_path: string;
    fingerprint_after: LedgerFingerprint;
    dry_run?: boolean;
    planned_rows?: number;
  };
};

type ResolvedAddPlan = {
  kind: "add-row";
  index: number;
  row: KnbRow;
  as?: string;
};

type ResolvedSkipPlan = {
  kind: "skip";
  index: number;
  matchedId: string;
  reason: string;
  matchedIds: string[];
  as?: string;
};

type ResolvedChangePlan = {
  kind: "change-row";
  index: number;
  row: ChangeRow;
  as?: string;
};

type Plan = ResolvedAddPlan | ResolvedSkipPlan | ResolvedChangePlan;
type AppendedPlan = ResolvedAddPlan | ResolvedChangePlan;
type ApplyValidationIssue = ValidationIssue & {
  op_index?: number;
  op_path?: string;
  op_as?: string;
};

type ApplyPlanningIssue = ApplyValidationIssue & {
  error_code: KnbErrorCode;
  ref?: string;
  id?: string;
  matched_ids?: string[];
};

export async function applyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  validateApplyRequestOrThrow(request);

  const ledgerPath = deps.workspace.paths.ledger;
  const actor = stringOrUndef(request.actor) ?? deps.actor;
  const clock = buildClockOrThrow(deps.runtime.clock, request.now);
  const startedAt = clock();
  const requestedRunId = stringOrUndef(request.run_id);
  if (requestedRunId !== undefined && !isSafeRunManifestId(requestedRunId)) {
    throw knbError("validation_failed", "Apply request failed validation", {
      issues: [
        {
          level: "error",
          code: "run_id_unsafe",
          message: `run_id is not safe for manifest filename: ${requestedRunId}`,
          path: "run_id",
        },
      ],
    });
  }

  if (!Array.isArray(request.operations) || request.operations.length === 0) {
    return {
      run_id: requestedRunId ?? generateRunId(startedAt, deps.runtime.randomIdPart),
      created: [],
      skipped: [],
      warnings: [],
      novelty: [],
      meta: {
        rows_appended: 0,
        bytes_written: 0,
        ledger_path: ledgerPath,
        fingerprint_after: emptyFingerprint(ledgerPath),
      },
    };
  }

  const writeLedger = deps.writeLedger ?? defaultWriteLedger;
  const classifyNovelty = deps.classifyNovelty ?? defaultNovelty;
  const dedupe = request.dedupe === true;

  const writeResult: LedgerWriteResult<ApplyResult> = await writeLedger(
    { path: ledgerPath, lockPath: deps.workspace.paths.lock },
    async (snapshot) => {
      const validation = validateLedger(snapshot.rows, snapshot.parseIssues);
      if (!validation.ok) {
        throw knbError(
          "validation_failed",
          "Ledger has pre-existing validation errors",
          { issues: validation.issues, path: ledgerPath },
        );
      }

      const snapshotIds = new Set<string>();
      for (const loaded of snapshot.rows) {
        const id = (loaded.row as { id?: unknown }).id;
        if (typeof id === "string" && id.length > 0) snapshotIds.add(id);
      }
      const snapshotById = new Map<string, KnbRow>();
      for (const loaded of snapshot.rows) {
        const id = (loaded.row as { id?: unknown }).id;
        if (typeof id === "string" && id.length > 0) snapshotById.set(id, loaded.row);
      }

      const aliasMap = new Map<string, string>();
      const appendedById = new Map<string, KnbRow>();
      const result: ApplyResult = {
        run_id: "",
        created: [],
        skipped: [],
        warnings: [],
        novelty: [],
        meta: {
          rows_appended: 0,
          bytes_written: 0,
          ledger_path: ledgerPath,
          fingerprint_after: emptyFingerprint(ledgerPath),
        },
      };
      const plans: Plan[] = [];
      const planningIssues: ApplyPlanningIssue[] = [];
      const invalidAliasRefs = new Set<string>();

      for (let index = 0; index < request.operations.length; index += 1) {
        const operation = request.operations[index] as ApplyOperation;
        const aliasName = operationAlias(operation);
        try {
          if (operation.op === "add") {
            const completed = processAdd({
              operation,
              index,
              actor,
              clock,
              randomIdPart: deps.runtime.randomIdPart,
              snapshotIds,
              appendedById,
              aliasMap,
              snapshot,
              classifyNovelty,
              dedupe,
              result,
            });
            if (completed.kind === "add-row") {
              plans.push(completed);
              const completedId = completed.row.id;
              appendedById.set(completedId, completed.row);
              snapshotIds.add(completedId);
              aliasMap.set(`$op${index}`, completedId);
              if (aliasName) aliasMap.set(`$${aliasName}`, completedId);
              result.created.push({
                op: index,
                ...(aliasName ? { as: aliasName } : {}),
                id: completedId,
                kind: completed.row.kind,
              });
            } else {
              plans.push(completed);
              aliasMap.set(`$op${index}`, completed.matchedId);
              if (aliasName) aliasMap.set(`$${aliasName}`, completed.matchedId);
              result.skipped.push({
                op: index,
                reason: completed.reason,
                ...(completed.matchedIds.length > 0 ? { matched_ids: completed.matchedIds } : {}),
              });
            }
          } else {
            const change = processLifecycle({
              operation,
              index,
              actor,
              clock,
              randomIdPart: deps.runtime.randomIdPart,
              snapshotIds,
              snapshotById,
              appendedById,
              aliasMap,
            });
            plans.push(change);
            appendedById.set(change.row.id, change.row);
            snapshotIds.add(change.row.id);
            aliasMap.set(`$op${index}`, change.row.id);
            if (aliasName) aliasMap.set(`$${aliasName}`, change.row.id);
            result.created.push({
              op: index,
              ...(aliasName ? { as: aliasName } : {}),
              id: change.row.id,
              kind: change.row.kind,
            });
          }
        } catch (error) {
          markFailedAliases(index, aliasName, invalidAliasRefs);
          if (isDependentAliasError(error, invalidAliasRefs)) continue;
          planningIssues.push(...planningIssuesFromError(error, index, aliasName));
        }
      }

      const runId = planningIssues.length === 0
        ? requestedRunId ??
          generateRunId(startedAt, deps.runtime.randomIdPart, randomPartFromFirstCreated(result))
        : "";
      if (runId !== "" && ledgerHasRunId(snapshot.rows, runId)) {
        throw knbError("validation_failed", "Apply request failed validation", {
          issues: [
            {
              level: "error",
              code: "run_id_duplicate",
              message: `run_id already exists in ledger provenance: ${runId}`,
              path: "run_id",
            },
          ],
        });
      }
      if (planningIssues.length === 0) result.run_id = runId;

      const appendedRows: KnbRow[] = [];
      const appendedLineToPlan = new Map<number, AppendedPlan>();
      for (const plan of plans) {
        if (plan.kind === "add-row" || plan.kind === "change-row") {
          if (planningIssues.length === 0) {
            plan.row = withRunProvenance(plan.row, runId, actor) as typeof plan.row;
          }
          appendedRows.push(plan.row);
        }
      }

      const candidate: LoadedRow[] = [
        ...snapshot.rows.map((loaded) => ({ row: loaded.row, line: loaded.line })),
      ];
      for (let index = 0; index < appendedRows.length; index += 1) {
        const line = snapshot.rows.length + index + 1;
        const plan = findPlanForAppendedRow(plans, appendedRows[index] as KnbRow);
        if (plan) appendedLineToPlan.set(line, plan);
        candidate.push({
          row: appendedRows[index] as KnbRow,
          line,
        });
      }
      const finalValidation = validateLedger(candidate, snapshot.parseIssues);
      const profileValidationIssues = deps.workspace.paths.profiles === undefined
        ? []
        : await validateProfilesForWorkspace(
            { paths: { profiles: deps.workspace.paths.profiles } },
            candidate,
          );
      const candidateIssues = [...finalValidation.issues, ...profileValidationIssues];
      const finalIssues = annotateApplyValidationIssues(candidateIssues, appendedLineToPlan);
      const hasProfileValidationError = profileValidationIssues.some((issue) => issue.level === "error");
      if (planningIssues.length > 0 || !finalValidation.ok || hasProfileValidationError) {
        const allIssues = [
          ...planningIssues.map(publicPlanningIssue),
          ...finalIssues.filter((issue) => issue.level === "error"),
        ];
        throw aggregatedApplyError(planningIssues, allIssues, ledgerPath);
      }

      const firstAppendedLine = snapshot.rows.length + 1;
      for (const issue of finalIssues) {
        if (issue.level !== "warning") continue;
        if (typeof issue.line === "number" && issue.line < firstAppendedLine) continue;
        const code = issue.code ? `${issue.code}: ` : "";
        result.warnings.push(`${code}${issue.message}`);
      }

      return { rows: appendedRows, result };
    },
  );

  const finalResult = writeResult.result;
  finalResult.meta = {
    rows_appended: writeResult.rowsAppended,
    bytes_written: writeResult.bytesWritten,
    ledger_path: ledgerPath,
    fingerprint_after: writeResult.fingerprintAfter,
  };

  const writeRunManifest = deps.writeRunManifest ?? defaultWriteRunManifest;
  if (writeRunManifest !== false && writeResult.rowsAppended > 0) {
    const manifest: RunManifest = {
      schema_version: "knb.run.v1",
      run_id: finalResult.run_id,
      actor,
      started_at: startedAt.toISOString(),
      completed_at: clock().toISOString(),
      rows_appended: writeResult.rowsAppended,
      row_ids: finalResult.created.map((entry) => entry.id),
    };
    const intent = stringOrUndef(request.intent);
    if (intent !== undefined) manifest.intent = intent;

    // Run manifests are observability sidecars. The ledger append is canonical,
    // so a manifest write failure is reported as a warning instead of rolling
    // back an otherwise valid apply.
    try {
      await writeRunManifest(deps.workspace, manifest);
    } catch (error) {
      finalResult.warnings.push(`run_manifest_write_failed: ${errorMessage(error)}`);
    }
  }
  return finalResult;
}

export async function previewApplyOperations(
  request: ApplyRequest,
  deps: ApplyDeps,
): Promise<ApplyResult> {
  const ledgerPath = deps.workspace.paths.ledger;
  const result = await applyOperations(request, {
    ...deps,
    writeRunManifest: false,
    writeLedger: async (options, transaction) => {
      const loadOptions: Parameters<typeof loadLedger>[0] = { path: options.path };
      if (options.readFile !== undefined) loadOptions.readFile = options.readFile;
      if (options.hash !== undefined) loadOptions.hash = options.hash;
      const snapshot = await loadLedger(loadOptions);
      const plan = await transaction(snapshot);
      return {
        result: plan.result,
        rowsRead: snapshot.rows.length,
        rowsAppended: plan.rows.length,
        bytesWritten: 0,
        fingerprintBefore: snapshot.fingerprint,
        fingerprintAfter: snapshot.fingerprint,
      };
    },
  });
  const plannedRows = result.meta.rows_appended;
  result.meta = {
    ...result.meta,
    rows_appended: 0,
    bytes_written: 0,
    ledger_path: ledgerPath,
    dry_run: true,
    planned_rows: plannedRows,
  };
  return result;
}

type ProcessAddArgs = {
  operation: Extract<ApplyOperation, { op: "add" }>;
  index: number;
  actor: string;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  appendedById: Map<string, KnbRow>;
  aliasMap: Map<string, string>;
  snapshot: LedgerSnapshot;
  classifyNovelty: (candidate: KnbRow, snapshot: LedgerSnapshot) => NoveltyDecision;
  dedupe: boolean;
  result: ApplyResult;
};

function processAdd(args: ProcessAddArgs): ResolvedAddPlan | ResolvedSkipPlan {
  const draft = args.operation.row;
  if (draft === null || typeof draft !== "object") {
    throw knbError("validation_failed", `Operation ${args.index}: add requires a row object`, {
      op_index: args.index,
    });
  }
  const kind = (draft as { kind?: unknown }).kind;
  if (typeof kind !== "string") {
    throw knbError("validation_failed", `Operation ${args.index}: row.kind must be a string`, {
      op_index: args.index,
    });
  }

  const resolvedDraft = resolveDraftReferences(draft, args.aliasMap, args.snapshotIds, args.index);

  const providedId = typeof resolvedDraft.id === "string" && resolvedDraft.id.length > 0 ? resolvedDraft.id : undefined;
  if (providedId) {
    if (args.snapshotIds.has(providedId) || args.appendedById.has(providedId)) {
      throw knbError(
        "duplicate_blocked",
        `Operation ${args.index}: id ${providedId} already exists`,
        { op_index: args.index, id: providedId },
      );
    }
  }

  const finalId = providedId ?? allocateId({
    kind: kind as KnbRowKind,
    scope: (resolvedDraft as { scope?: Scope }).scope ?? {},
    clock: args.clock,
    randomIdPart: args.randomIdPart,
    snapshotIds: args.snapshotIds,
    appendedById: args.appendedById,
    opIndex: args.index,
  });

  const draftWithId: DraftRow = { ...(resolvedDraft as DraftRow), id: finalId };
  const completion = completeDraftRow(draftWithId, {
    actor: args.actor,
    now: args.clock,
    randomIdPart: args.randomIdPart,
  });
  if (!completion.ok) {
    throw knbError(
      "validation_failed",
      `Operation ${args.index}: draft completion failed`,
      { op_index: args.index, issues: completion.issues },
    );
  }

  const candidateRow = completion.row;
  const novelty = candidateRow.kind === "claim"
    ? args.classifyNovelty(candidateRow, args.snapshot)
    : ({ classification: "new", matched_ids: [] } as NoveltyDecision);

  args.result.novelty.push({
    op: args.index,
    classification: novelty.classification,
    matched_ids: [...novelty.matched_ids],
  });

  if (args.dedupe && novelty.classification === "duplicate") {
    if (novelty.matched_ids.length === 1) {
      const matchedId = novelty.matched_ids[0] as string;
      return {
        kind: "skip",
        index: args.index,
        matchedId,
        matchedIds: [...novelty.matched_ids],
        reason: `duplicate of ${matchedId}`,
        ...(typeof args.operation.as === "string" ? { as: args.operation.as } : {}),
      };
    }
    throw knbError(
      "duplicate_blocked",
      `Operation ${args.index}: duplicate detected without unambiguous canonical id`,
      { op_index: args.index, matched_ids: novelty.matched_ids },
    );
  }

  return {
    kind: "add-row",
    index: args.index,
    row: candidateRow,
    ...(typeof args.operation.as === "string" ? { as: args.operation.as } : {}),
  };
}

type ProcessLifecycleArgs = {
  operation: Exclude<ApplyOperation, { op: "add" }>;
  index: number;
  actor: string;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  snapshotById: Map<string, KnbRow>;
  appendedById: Map<string, KnbRow>;
  aliasMap: Map<string, string>;
};

function processLifecycle(args: ProcessLifecycleArgs): ResolvedChangePlan {
  const op = args.operation;
  const rawDraft: DraftRow = {
    kind: "change",
    scope: {},
    change: buildChangeBody(op),
  } as DraftRow;
  const resolvedDraft = resolveDraftReferences(rawDraft, args.aliasMap, args.snapshotIds, args.index);
  const change = (resolvedDraft as { change: ChangeRow["change"] }).change;
  const targetRows = collectTargetRows(change, args);
  const scope = op.scope ?? deriveScope(targetRows, args.index);

  const draft: DraftRow = {
    kind: "change",
    scope,
    change,
  } as DraftRow;

  const id = allocateId({
    kind: "change",
    scope,
    clock: args.clock,
    randomIdPart: args.randomIdPart,
    snapshotIds: args.snapshotIds,
    appendedById: args.appendedById,
    opIndex: args.index,
  });
  const draftWithId = { ...draft, id } as DraftRow;
  const completion = completeDraftRow(draftWithId, {
    actor: args.actor,
    now: args.clock,
    randomIdPart: args.randomIdPart,
  });
  if (!completion.ok) {
    throw knbError(
      "validation_failed",
      `Operation ${args.index}: change row completion failed`,
      { op_index: args.index, issues: completion.issues },
    );
  }
  return {
    kind: "change-row",
    index: args.index,
    row: completion.row as ChangeRow,
    ...(typeof op.as === "string" ? { as: op.as } : {}),
  };
}

function buildChangeBody(
  op: Exclude<ApplyOperation, { op: "add" }>,
): ChangeRow["change"] {
  if (op.op === "retract") {
    return {
      action: "retract",
      target_ids: [...op.target_ids],
      reason: op.reason,
    };
  }
  if (op.op === "supersede") {
    return {
      action: "supersede",
      target_ids: [...op.target_ids],
      replacement_id: op.replacement_id,
      reason: op.reason,
    };
  }
  if (op.op === "merge") {
    return {
      action: "merge",
      target_ids: [...op.target_ids],
      canonical_id: op.canonical_id,
      reason: op.reason,
    };
  }
  if (op.op === "relate") {
    const relation: ChangeRow["change"]["relation"] = {
      from_id: op.from_id,
      to_id: op.to_id,
      rel: op.rel,
    };
    if (op.strength !== undefined) relation.strength = op.strength;
    if (op.rationale !== undefined) relation.rationale = op.rationale;
    return { action: "relate", relation };
  }
  return {
    action: "patch",
    target_id: op.target_id,
    patch: op.patch,
    reason: op.reason,
  };
}

function collectTargetRows(
  change: ChangeRow["change"],
  args: ProcessLifecycleArgs,
): KnbRow[] {
  const ids = collectScopeAnchorIds(change);
  const rows: KnbRow[] = [];
  for (const id of ids) {
    const row = args.snapshotById.get(id) ?? args.appendedById.get(id);
    if (row) rows.push(row);
  }
  return rows;
}

function collectScopeAnchorIds(change: ChangeRow["change"]): string[] {
  const draft: DraftRow = {
    kind: "change",
    scope: {},
    change,
  } as DraftRow;
  return [...referenceFields(draft)].map((slot) => slot.get());
}

function deriveScope(targets: KnbRow[], opIndex: number): Scope {
  if (targets.length === 0) {
    throw knbError(
      "validation_failed",
      `Operation ${opIndex}: cannot derive scope without target rows`,
      { op_index: opIndex, code: "scope_anchor_required" },
    );
  }
  const collections = intersectScopeField(targets, "collections");
  if (collections.length > 0) return { collections };
  const subjects = intersectScopeField(targets, "subjects");
  if (subjects.length > 0) return { subjects };
  const tags = intersectScopeField(targets, "tags");
  if (tags.length > 0) return { tags };

  const first = targets[0] as KnbRow;
  const fallback = pickFirstAnchor(first.scope);
  if (!fallback) {
    throw knbError(
      "validation_failed",
      `Operation ${opIndex}: no target row has an anchored scope`,
      { op_index: opIndex, code: "scope_anchor_required" },
    );
  }
  return fallback;
}

function pickFirstAnchor(scope: Scope | undefined): Scope | undefined {
  if (!scope) return undefined;
  if (scope.collections && scope.collections.length > 0) {
    return { collections: [scope.collections[0] as string] };
  }
  if (scope.subjects && scope.subjects.length > 0) {
    return { subjects: [scope.subjects[0] as string] };
  }
  if (scope.tags && scope.tags.length > 0) {
    return { tags: [scope.tags[0] as string] };
  }
  return undefined;
}

function intersectScopeField(rows: KnbRow[], field: "collections" | "subjects" | "tags"): string[] {
  const first = rows[0]?.scope?.[field];
  if (!Array.isArray(first) || first.length === 0) return [];
  let acc = new Set<string>(first);
  for (let i = 1; i < rows.length; i += 1) {
    const next = rows[i]?.scope?.[field];
    if (!Array.isArray(next) || next.length === 0) return [];
    const nextSet = new Set(next);
    const filtered = new Set<string>();
    for (const value of acc) if (nextSet.has(value)) filtered.add(value);
    acc = filtered;
    if (acc.size === 0) return [];
  }
  return [...acc];
}

type AllocateIdArgs = {
  kind: KnbRowKind;
  scope: Scope;
  clock: () => Date;
  randomIdPart: (bytes: number) => string;
  snapshotIds: Set<string>;
  appendedById: Map<string, KnbRow>;
  opIndex: number;
};

function allocateId(args: AllocateIdArgs): string {
  const slug = scopeSlug(args.scope);
  if (!slug) {
    throw knbError(
      "validation_failed",
      `Operation ${args.opIndex}: scope must include at least one collection, subject, or tag`,
      { op_index: args.opIndex, code: "scope_anchor_required" },
    );
  }
  const date = args.clock();
  for (let attempt = 0; attempt < ID_COLLISION_RETRY_LIMIT; attempt += 1) {
    const id = generateId(args.kind, slug, date, args.randomIdPart);
    if (!args.snapshotIds.has(id) && !args.appendedById.has(id)) return id;
  }
  throw knbError(
    "duplicate_blocked",
    `Operation ${args.opIndex}: ID collision retries exhausted`,
    { op_index: args.opIndex, kind: args.kind, slug },
  );
}

function resolveDraftReferences(
  draft: DraftRow,
  aliasMap: Map<string, string>,
  snapshotIds: Set<string>,
  opIndex: number,
): DraftRow {
  const cloned = cloneJson(draft) as DraftRow & Record<string, unknown>;

  for (const slot of referenceFields(cloned)) {
    slot.set(resolveRef(slot.get(), aliasMap, snapshotIds, opIndex));
  }

  return cloned as DraftRow;
}

function resolveRef(
  ref: string,
  aliasMap: Map<string, string>,
  snapshotIds: Set<string>,
  opIndex: number,
): string {
  if (typeof ref !== "string" || ref.length === 0) {
    throw knbError("broken_reference", `Operation ${opIndex}: empty reference`, { op_index: opIndex });
  }
  if (ref.startsWith("$")) {
    const resolved = aliasMap.get(ref);
    if (!resolved) {
      throw knbError(
        "broken_reference",
        `Operation ${opIndex}: forward or unknown alias ${ref}`,
        { op_index: opIndex, ref },
      );
    }
    return resolved;
  }
  if (snapshotIds.has(ref)) return ref;
  throw knbError(
    "broken_reference",
    `Operation ${opIndex}: unknown id ${ref}`,
    { op_index: opIndex, ref },
  );
}

function findPlanForAppendedRow(plans: Plan[], row: KnbRow): AppendedPlan | undefined {
  for (const plan of plans) {
    if ((plan.kind === "add-row" || plan.kind === "change-row") && plan.row === row) return plan;
  }
  return undefined;
}

function validateApplyRequestOrThrow(request: ApplyRequest): void {
  const validation = validateApplyRequest(request);
  if (validation.ok) return;
  const issues = annotateApplyRequestIssues(validation.issues);
  const unsafe = issues.find((issue) => issue.code === "unsafe_operation_refused");
  if (unsafe) {
    throw knbError(
      "unsafe_operation_refused",
      unsafe.message,
      { path: unsafe.path, issues },
    );
  }
  throw knbError(
    "validation_failed",
    "Apply request failed validation",
    { issues },
  );
}

function annotateApplyRequestIssues(issues: ValidationIssue[]): ApplyValidationIssue[] {
  return issues.map((issue) => {
    const opPath = issue.path;
    const opIndex = operationIndexFromPath(opPath);
    if (opIndex === undefined || opPath === undefined) return issue;
    return {
      ...issue,
      op_index: opIndex,
      op_path: opPath,
    };
  });
}

function annotateApplyValidationIssues(
  issues: ValidationIssue[],
  appendedLineToPlan: Map<number, AppendedPlan>,
): ApplyValidationIssue[] {
  return issues.map((issue) => {
    if (typeof issue.line !== "number") return issue;
    const plan = appendedLineToPlan.get(issue.line);
    if (!plan) return issue;
    const annotated: ApplyValidationIssue = {
      ...issue,
      op_index: plan.index,
      op_path: operationPathForIssue(plan, issue),
    };
    if (plan.as !== undefined) annotated.op_as = plan.as;
    return annotated;
  });
}

function markFailedAliases(index: number, aliasName: string | undefined, refs: Set<string>): void {
  refs.add(`$op${index}`);
  if (aliasName !== undefined) refs.add(`$${aliasName}`);
}

function isDependentAliasError(error: unknown, invalidAliasRefs: Set<string>): boolean {
  if (!isKnbError(error)) return false;
  if (error.code !== "broken_reference") return false;
  const ref = error.details?.ref;
  return typeof ref === "string" && invalidAliasRefs.has(ref);
}

function planningIssuesFromError(
  error: unknown,
  opIndex: number,
  aliasName: string | undefined,
): ApplyPlanningIssue[] {
  if (!isKnbError(error)) throw error;
  const details = error.details ?? {};
  const rawIssues = Array.isArray(details.issues) ? details.issues : undefined;
  if (rawIssues !== undefined && rawIssues.length > 0) {
    return rawIssues.map((raw) => {
      const source = isRecord(raw) ? raw : {};
      return buildPlanningIssue(error.code, error.message, source, details, opIndex, aliasName);
    });
  }
  return [buildPlanningIssue(error.code, error.message, {}, details, opIndex, aliasName)];
}

function buildPlanningIssue(
  errorCode: KnbErrorCode,
  fallbackMessage: string,
  issueSource: Record<string, unknown>,
  detailSource: Record<string, unknown>,
  fallbackOpIndex: number,
  aliasName: string | undefined,
): ApplyPlanningIssue {
  const code = firstString(issueSource.code, detailSource.code, errorCode);
  const message = firstString(issueSource.message, fallbackMessage) ?? fallbackMessage;
  const issue: ApplyPlanningIssue = {
    level: "error",
    code,
    message,
    error_code: errorCode,
    op_index: firstNumber(issueSource.op_index, detailSource.op_index) ?? fallbackOpIndex,
  };

  const path = firstString(issueSource.path, detailSource.path);
  if (path !== undefined) issue.path = path;
  const opPath = firstString(issueSource.op_path, detailSource.op_path);
  if (opPath !== undefined) issue.op_path = opPath;
  const id = firstString(issueSource.id, detailSource.id);
  if (id !== undefined) issue.id = id;
  const ref = firstString(issueSource.ref, detailSource.ref);
  if (ref !== undefined) issue.ref = ref;
  const matchedIds = firstStringArray(issueSource.matched_ids, detailSource.matched_ids);
  if (matchedIds !== undefined) issue.matched_ids = matchedIds;
  if (aliasName !== undefined) issue.op_as = aliasName;
  return issue;
}

function publicPlanningIssue(issue: ApplyPlanningIssue): ApplyValidationIssue & {
  ref?: string;
  matched_ids?: string[];
} {
  const { error_code: _errorCode, ...publicIssue } = issue;
  return publicIssue;
}

function aggregatedApplyError(
  planningIssues: ApplyPlanningIssue[],
  allIssues: Array<ApplyValidationIssue | ReturnType<typeof publicPlanningIssue>>,
  ledgerPath: string,
): never {
  const first = planningIssues[0];
  const errorCode = first?.error_code ?? "validation_failed";
  const details: Record<string, unknown> = { issues: allIssues, path: ledgerPath };
  if (first?.code !== undefined) details.code = first.code;
  if (first?.op_index !== undefined) details.op_index = first.op_index;
  if (first?.op_path !== undefined) details.op_path = first.op_path;
  if (first?.ref !== undefined) details.ref = first.ref;
  if (first?.id !== undefined) details.id = first.id;
  if (first?.matched_ids !== undefined) details.matched_ids = first.matched_ids;
  throw knbError(errorCode, "Apply failed validation", details);
}

function firstString(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.length > 0) return value;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) {
    if (typeof value === "number" && Number.isSafeInteger(value)) return value;
  }
  return undefined;
}

function firstStringArray(...values: unknown[]): string[] | undefined {
  for (const value of values) {
    if (!Array.isArray(value)) continue;
    const strings = value.filter((item): item is string => typeof item === "string");
    if (strings.length === value.length) return strings;
  }
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function operationPathForIssue(plan: AppendedPlan, issue: ValidationIssue): string {
  const prefix = `operations[${plan.index}]`;
  if (plan.kind === "add-row") {
    return issue.path ? `${prefix}.row.${issue.path}` : `${prefix}.row`;
  }
  const suffix = lifecycleOperationSuffix(issue.path);
  return suffix ? `${prefix}.${suffix}` : prefix;
}

function lifecycleOperationSuffix(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (path === "change.relation.from_id") return "from_id";
  if (path === "change.relation.to_id") return "to_id";
  if (path === "change.relation.rel") return "rel";
  if (path === "change.relation.strength") return "strength";
  if (path === "change.relation.rationale") return "rationale";
  if (path.startsWith("change.")) return path.slice("change.".length);
  if (path === "scope") return "scope";
  return undefined;
}

function operationIndexFromPath(path: string | undefined): number | undefined {
  const match = /^operations\[(\d+)\](?:\.|$)/.exec(path ?? "");
  if (!match) return undefined;
  const index = Number(match[1]);
  return Number.isSafeInteger(index) ? index : undefined;
}

function operationAlias(op: ApplyOperation): string | undefined {
  return typeof op.as === "string" && op.as.length > 0 ? op.as : undefined;
}

function buildClockOrThrow(base: () => Date, requestNow: string | undefined): () => Date {
  if (typeof requestNow !== "string" || requestNow.length === 0) return base;
  const parsed = new Date(requestNow);
  if (Number.isNaN(parsed.getTime())) {
    throw knbError("validation_failed", "Apply request failed validation", {
      issues: [
        {
          level: "error",
          code: "now_invalid",
          message: `now must be a valid ISO timestamp: ${requestNow}`,
          path: "now",
        },
      ],
    });
  }
  return () => new Date(parsed.getTime());
}

function ledgerHasRunId(rows: LoadedRow[], runId: string): boolean {
  return rows.some((loaded) => {
    const acquisition = (loaded.row as { provenance?: { acquisition?: { run_id?: unknown } } }).provenance?.acquisition;
    return acquisition?.run_id === runId;
  });
}

function defaultNovelty(): NoveltyDecision {
  return { classification: "new", matched_ids: [] };
}

function emptyFingerprint(path: string): LedgerFingerprint {
  return {
    path,
    rows: 0,
    bytes: 0,
    content_hash: "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  };
}

function randomPartFromFirstCreated(result: ApplyResult): string | undefined {
  const firstId = result.created[0]?.id;
  if (typeof firstId !== "string") return undefined;
  const lastColon = firstId.lastIndexOf(":");
  if (lastColon < 0) return undefined;
  const suffix = firstId.slice(lastColon + 1);
  return suffix.length > 0 ? suffix : undefined;
}

function withRunProvenance(row: KnbRow, runId: string, agent: string): KnbRow {
  if (row.kind === "change") return row;
  const current = (row as { provenance?: Provenance }).provenance ?? {};
  const acquisition = {
    ...(current.acquisition ?? {}),
    run_id: runId,
    agent,
  };
  return {
    ...row,
    provenance: {
      ...current,
      acquisition,
    },
  } as KnbRow;
}

function stringOrUndef(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.length > 0) return error.message;
  return String(error);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/src/core/contract.ts
```ts
// Contract module — V1 source of truth for row contracts, operation contracts,
// validation, samples, and JSON Schema. The contract module must not read files,
// inspect the workspace, choose clocks, or allocate randomness itself.

import { validateRowSelector, type RowSelector } from "./selectors";

export const KNB_SCHEMA_VERSION = "knb.v1" as const;

export const ROW_KINDS = ["source", "claim", "question", "synthesis", "change"] as const;
export const QUESTION_STATUSES = ["open", "resolved", "archived"] as const;
export const QUESTION_PRIORITIES = ["low", "medium", "high"] as const;
export const SYNTHESIS_STATUSES = ["active", "archived"] as const;
export const CONFIDENCE_VALUES = ["unknown", "low", "medium", "high"] as const;
export const ASSESSMENT_LEVELS = ["unknown", "low", "medium", "high"] as const;
export const INFORMATION_DEPTH_VALUES = ["unknown", "thin", "partial", "strong", "complete"] as const;
export const TIME_PRECISIONS = ["instant", "hour", "day", "month", "year", "range", "unknown"] as const;
export const SOURCE_TYPES = [
  "article",
  "official_record",
  "dataset",
  "paper",
  "social_post",
  "transcript",
  "legal_document",
  "api_response",
  "raw_note",
  "web_page",
  "other",
] as const;
export const RELATION_TYPES = [
  "supports",
  "contradicts",
  "depends_on",
  "context_for",
] as const;
export const CHANGE_ACTIONS = ["retract", "supersede", "merge", "relate", "patch"] as const;
export const EVIDENCE_ROLES = ["supports", "contradicts", "context"] as const;
export const APPLY_OPERATION_KINDS = ["add", "retract", "supersede", "merge", "relate", "patch"] as const;
export const KIND_PREFIXES = {
  source: "src",
  claim: "claim",
  question: "q",
  synthesis: "synth",
  change: "chg",
} as const;

export type KnbRowKind = (typeof ROW_KINDS)[number];
export type RelationType = (typeof RELATION_TYPES)[number];
export type ChangeAction = (typeof CHANGE_ACTIONS)[number];
export type AssessmentLevel = (typeof ASSESSMENT_LEVELS)[number];
export type ApplyOperationKind = (typeof APPLY_OPERATION_KINDS)[number];

export type Scope = {
  collections?: string[];
  subjects?: string[];
  tags?: string[];
  language?: string | null;
  geo?: string[];
};

export type ExternalRef = {
  system: string;
  id: string;
  type?: string | null;
  path?: string | null;
};

export type Identity = {
  claim_key?: string;
  thread_key?: string;
  dedupe_hash?: string;
  novelty?: "new" | "duplicate" | "corroboration" | "update" | "contradiction" | "correction";
  checked_at?: string;
};

export type Time = {
  occurred_at?: string | null;
  valid_at?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  reported_at?: string | null;
  first_observed_at?: string | null;
  last_checked_at?: string | null;
  precision: (typeof TIME_PRECISIONS)[number];
  timezone?: string | null;
  notes?: string;
};

export type EvidenceRef = {
  source_id: string;
  role: "supports" | "contradicts" | "context";
  locator?: {
    url?: string | null;
    path?: string | null;
    page?: string | number | null;
    section?: string | null;
    quote?: string | null;
  };
  summary: string;
};

export type Acquisition = {
  method?: string;
  query?: string | null;
  retrieved_at?: string | null;
  observed_at?: string | null;
  run_id?: string | null;
  agent?: string | null;
};

export type Transformation = {
  type: "translation" | "summarization" | "calculation" | "normalization" | "extraction";
  from?: string | null;
  to?: string | null;
  tool?: string | null;
  notes?: string;
};

export type Provenance = {
  source_ids?: string[];
  evidence?: EvidenceRef[];
  acquisition?: Acquisition;
  transformations?: Transformation[];
  derivation?: {
    method: "direct" | "extracted" | "inferred" | "calculated" | "translated" | "summarized";
    notes?: string;
  };
};

export type Assessment = {
  confidence?: "unknown" | "low" | "medium" | "high";
  source_reliability?: AssessmentLevel;
  information_depth?: {
    level: (typeof INFORMATION_DEPTH_VALUES)[number];
    rationale: string;
  };
  importance?: AssessmentLevel;
  contested?: boolean;
  uncertainty?: string;
};

export type Relation = {
  target_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type ChangeRelation = {
  from_id: string;
  to_id: string;
  rel: RelationType;
  strength?: "low" | "medium" | "high";
  rationale?: string;
};

export type KnbRowCommon = {
  schema_version: typeof KNB_SCHEMA_VERSION;
  id: string;
  kind: KnbRowKind;
  created_at: string;
  created_by: string;
  scope: Scope;
  external_refs?: ExternalRef[];
};

export type SourceRow = KnbRowCommon & {
  kind: "source";
  source: {
    type: (typeof SOURCE_TYPES)[number];
    title: string;
    uri?: string | null;
    publisher?: string | null;
    author?: string | null;
    language?: string | null;
    published_at?: string | null;
    content_hash?: string | null;
    raw_path?: string | null;
  };
  provenance: Provenance;
  assessment?: Assessment;
};

export type ClaimRow = KnbRowCommon & {
  kind: "claim";
  identity: Identity;
  claim: {
    statement: string;
    atomic: boolean;
    type?: string;
    subject?: string;
    predicate?: string;
    object?: string;
    qualifiers?: Record<string, unknown>;
  };
  time: Time;
  provenance: Provenance;
  assessment: Assessment;
  relations?: Relation[];
};

export type QuestionRow = KnbRowCommon & {
  kind: "question";
  question: {
    text: string;
    status: "open" | "resolved" | "archived";
    priority?: "low" | "medium" | "high";
    resolution_criteria?: string;
    why_it_matters?: string;
    answer_claim_id?: string | null;
  };
  time?: Time;
  provenance?: Provenance;
  assessment?: Assessment;
  relations?: Relation[];
};

export type SynthesisRow = KnbRowCommon & {
  kind: "synthesis";
  synthesis: {
    title: string;
    summary: string;
    basis: {
      claim_ids?: string[];
      question_ids?: string[];
      source_ids?: string[];
    };
    target_selector?: RowSelector;
    limitations?: string;
    status: "active" | "archived";
  };
  provenance?: Provenance;
  assessment?: Assessment;
  relations?: Relation[];
};

export type ChangeRow = KnbRowCommon & {
  kind: "change";
  change: {
    action: ChangeAction;
    target_ids?: string[];
    target_id?: string;
    replacement_id?: string;
    canonical_id?: string;
    reason?: string;
    relation?: ChangeRelation;
    patch?: Array<Record<string, unknown>>;
  };
};

export type KnbRow = SourceRow | ClaimRow | QuestionRow | SynthesisRow | ChangeRow;

export type Ref = string;

type OmitCommon<T> = Omit<T, "schema_version" | "created_at" | "created_by" | "id" | "kind" | "scope">;
type DistributeDraft<T> = T extends KnbRow ? Partial<OmitCommon<T>> & { kind: T["kind"]; id?: string; scope: Scope } : never;
export type DraftRow = DistributeDraft<KnbRow>;

export type RefSlotKind = "source" | "claim" | "question" | "any";

export type RefSlot = {
  kind: RefSlotKind;
  path: string;
  get(): string;
  set(newId: string): void;
};

export function* referenceFields(row: KnbRow | DraftRow): Iterable<RefSlot> {
  const record = row as Record<string, unknown>;

  const provenance = record.provenance;
  if (isRecord(provenance)) {
    yield* arrayRefSlots(provenance.source_ids, "source", "provenance.source_ids");
    const evidence = provenance.evidence;
    if (Array.isArray(evidence)) {
      for (let index = 0; index < evidence.length; index += 1) {
        const item = evidence[index];
        if (!isRecord(item)) continue;
        const slot = objectRefSlot(item, "source_id", "source", `provenance.evidence[${index}].source_id`);
        if (slot) yield slot;
      }
    }
  }

  const relations = record.relations;
  if (Array.isArray(relations)) {
    for (let index = 0; index < relations.length; index += 1) {
      const relation = relations[index];
      if (!isRecord(relation)) continue;
      const slot = objectRefSlot(relation, "target_id", "any", `relations[${index}].target_id`);
      if (slot) yield slot;
    }
  }

  const question = record.question;
  if (isRecord(question)) {
    const slot = objectRefSlot(question, "answer_claim_id", "claim", "question.answer_claim_id");
    if (slot) yield slot;
  }

  const synthesis = record.synthesis;
  if (isRecord(synthesis) && isRecord(synthesis.basis)) {
    yield* arrayRefSlots(synthesis.basis.claim_ids, "claim", "synthesis.basis.claim_ids");
    yield* arrayRefSlots(synthesis.basis.question_ids, "question", "synthesis.basis.question_ids");
    yield* arrayRefSlots(synthesis.basis.source_ids, "source", "synthesis.basis.source_ids");
  }

  const change = record.change;
  if (isRecord(change)) {
    yield* arrayRefSlots(change.target_ids, "any", "change.target_ids");
    const targetSlot = objectRefSlot(change, "target_id", "any", "change.target_id");
    if (targetSlot) yield targetSlot;
    const replacementSlot = objectRefSlot(change, "replacement_id", "any", "change.replacement_id");
    if (replacementSlot) yield replacementSlot;
    const canonicalSlot = objectRefSlot(change, "canonical_id", "any", "change.canonical_id");
    if (canonicalSlot) yield canonicalSlot;
    if (isRecord(change.relation)) {
      const fromSlot = objectRefSlot(change.relation, "from_id", "any", "change.relation.from_id");
      if (fromSlot) yield fromSlot;
      const toSlot = objectRefSlot(change.relation, "to_id", "any", "change.relation.to_id");
      if (toSlot) yield toSlot;
    }
  }
}

function* arrayRefSlots(value: unknown, kind: RefSlotKind, basePath: string): Iterable<RefSlot> {
  if (!Array.isArray(value)) return;
  for (let index = 0; index < value.length; index += 1) {
    if (typeof value[index] !== "string") continue;
    yield {
      kind,
      path: `${basePath}[${index}]`,
      get: () => value[index] as string,
      set(newId: string): void {
        value[index] = newId;
      },
    };
  }
}

function objectRefSlot(
  object: Record<string, unknown>,
  key: string,
  kind: RefSlotKind,
  path: string,
): RefSlot | undefined {
  if (typeof object[key] !== "string") return undefined;
  return {
    kind,
    path,
    get: () => object[key] as string,
    set(newId: string): void {
      object[key] = newId;
    },
  };
}

export type ApplyOperation =
  | { op: "add"; row: DraftRow; as?: string }
  | { op: "retract"; target_ids: Ref[]; reason: string; scope?: Scope; as?: string }
  | {
      op: "supersede";
      target_ids: Ref[];
      replacement_id: Ref;
      reason: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "merge";
      target_ids: Ref[];
      canonical_id: Ref;
      reason: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "relate";
      from_id: Ref;
      to_id: Ref;
      rel: RelationType;
      strength?: "low" | "medium" | "high";
      rationale?: string;
      scope?: Scope;
      as?: string;
    }
  | {
      op: "patch";
      target_id: Ref;
      patch: Array<Record<string, unknown>>;
      reason: string;
      scope?: Scope;
      as?: string;
    };

export type ApplyRequest = {
  operations: ApplyOperation[];
  atomic?: true;
  dedupe?: boolean;
  actor?: string;
  now?: string;
  run_id?: string;
  intent?: string;
};

export type ValidationIssue = {
  level: "error" | "warning";
  code?: string | undefined;
  message: string;
  path?: string | undefined;
  line?: number | undefined;
  id?: string | undefined;
  profile?: string | undefined;
};

export type ValidationResult = {
  ok: boolean;
  issues: ValidationIssue[];
};

export type LoadedRow = {
  row: KnbRow;
  line: number;
};

export type DraftCompletionDeps = {
  actor: string;
  now: () => Date;
  randomIdPart: (bytes: number) => string;
};

export type DraftCompletionResult =
  | { ok: true; row: KnbRow; issues: ValidationIssue[] }
  | { ok: false; issues: ValidationIssue[] };

type RowMap = Map<string, KnbRow>;

export function validateLedger(rows: LoadedRow[], parseIssues: ValidationIssue[] = []): ValidationResult {
  const issues: ValidationIssue[] = [...parseIssues];
  const byId: RowMap = new Map();
  const sourceIds = new Set<string>();
  const sourceUris = new Map<string, LoadedRow>();
  const sourceHashes = new Map<string, LoadedRow>();

  for (const loaded of rows) {
    validateCommon(loaded, issues);
    const id = stringValue((loaded.row as { id?: unknown }).id);
    if (id) {
      if (byId.has(id)) {
        issues.push({
          level: "error",
          code: "duplicate_id",
          line: loaded.line,
          id,
          message: `Duplicate id: ${id}`,
          path: "id",
        });
      } else {
        byId.set(id, loaded.row);
      }
    }
    if ((loaded.row as { kind?: unknown }).kind === "source" && id) {
      sourceIds.add(id);
    }
  }
  const inactiveSourceIds = collectInactiveSourceIds(rows, byId);

  for (const loaded of rows) {
    const row = loaded.row;
    const kind = (row as { kind?: unknown }).kind;
    if (kind === "source") {
      validateSource(loaded as LoadedRow & { row: SourceRow }, issues);
      checkSourceDuplicate(
        loaded as LoadedRow & { row: SourceRow },
        sourceUris,
        sourceHashes,
        inactiveSourceIds,
        issues,
      );
    }
    if (kind === "claim") validateClaim(loaded as LoadedRow & { row: ClaimRow }, issues);
    if (kind === "question") validateQuestion(loaded, issues);
    if (kind === "synthesis") validateSynthesis(loaded as LoadedRow & { row: SynthesisRow }, issues);
    if (kind === "change") validateChange(loaded as LoadedRow & { row: ChangeRow }, byId, issues);

    validateSourceRefs(loaded, sourceIds, issues);
    validateRelations(loaded, byId, issues);
  }

  validateSynthesisBasis(rows, byId, issues);
  validateQuestionAnswers(rows, byId, issues);

  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

function collectInactiveSourceIds(rows: LoadedRow[], byId: RowMap): Set<string> {
  const inactive = new Set<string>();
  for (const loaded of rows) {
    const row = loaded.row;
    if ((row as { kind?: unknown }).kind !== "change") continue;
    const change = (row as ChangeRow).change;
    if (!isRecord(change)) continue;
    const action = stringValue(change.action);
    if (action !== "retract" && action !== "supersede" && action !== "merge") continue;
    if (!Array.isArray(change.target_ids)) continue;
    for (const targetId of change.target_ids) {
      if (typeof targetId !== "string" || targetId.length === 0) continue;
      const target = byId.get(targetId);
      if (target?.kind === "source") inactive.add(targetId);
    }
  }
  return inactive;
}

export function validateRows(rows: KnbRow[]): ValidationResult {
  return validateLedger(rows.map((row, index) => ({ row, line: index + 1 })));
}

export function validateApplyRequest(request: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(request)) {
    issues.push({ level: "error", code: "apply_request_invalid", message: "ApplyRequest must be an object", path: "" });
    return { ok: false, issues };
  }
  if (request.atomic === false) {
    issues.push({
      level: "error",
      code: "unsafe_operation_refused",
      message: "atomic: false is not supported in v1; apply must be atomic",
      path: "atomic",
    });
  }
  const operations = (request as { operations?: unknown }).operations;
  if (!Array.isArray(operations)) {
    issues.push({
      level: "error",
      code: "apply_request_invalid",
      message: "ApplyRequest.operations must be an array",
      path: "operations",
    });
    return { ok: !issues.some((issue) => issue.level === "error"), issues };
  }
  for (let index = 0; index < operations.length; index += 1) {
    validateOperation(operations[index], `operations[${index}]`, issues);
  }
  return { ok: !issues.some((issue) => issue.level === "error"), issues };
}

export function completeDraftRow(draft: DraftRow, deps: DraftCompletionDeps): DraftCompletionResult {
  const issues: ValidationIssue[] = [];
  if (!isRecord(draft)) {
    issues.push({ level: "error", code: "draft_invalid", message: "draft must be an object", path: "" });
    return { ok: false, issues };
  }
  const kind = (draft as { kind?: unknown }).kind;
  if (typeof kind !== "string" || !ROW_KINDS.includes(kind as KnbRowKind)) {
    issues.push({
      level: "error",
      code: "kind_invalid",
      message: `kind must be one of: ${ROW_KINDS.join(", ")}`,
      path: "kind",
    });
    return { ok: false, issues };
  }
  const scope = (draft as { scope?: unknown }).scope;
  if (!isRecord(scope)) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      message: "scope must include at least one collection, subject, or tag",
      path: "scope",
    });
    return { ok: false, issues };
  }
  const slug = scopeSlug(scope as Scope);
  if (!slug) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      message: "scope must include at least one collection, subject, or tag",
      path: "scope",
    });
    return { ok: false, issues };
  }

  const date = deps.now();
  if (Number.isNaN(date.getTime())) {
    issues.push({ level: "error", code: "now_invalid", message: "deps.now() returned an invalid date" });
    return { ok: false, issues };
  }

  const providedId = typeof draft.id === "string" && draft.id.length > 0 ? draft.id : undefined;
  const id = providedId ?? generateId(kind as KnbRowKind, slug, date, deps.randomIdPart);

  const completed: KnbRow = {
    ...(draft as object),
    id,
    schema_version: KNB_SCHEMA_VERSION,
    created_at: date.toISOString(),
    created_by: deps.actor,
  } as KnbRow;

  return { ok: true, row: completed, issues };
}

export function generateId(
  kind: KnbRowKind,
  slug: string,
  date: Date,
  randomIdPart: (bytes: number) => string,
): string {
  return `${KIND_PREFIXES[kind]}:${slug}:${formatYmd(date)}:${randomIdPart(4)}`;
}

export function scopeSlug(scope: Scope): string | undefined {
  const candidate =
    scope.collections?.[0] ?? scope.subjects?.[0] ?? scope.tags?.[0] ?? undefined;
  if (!candidate) return undefined;
  return slugify(candidate);
}

export function rowSamples(): { source: SourceRow; claim: ClaimRow; question: QuestionRow; synthesis: SynthesisRow; change: ChangeRow } {
  const source: SourceRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "src:example:20260501:aaaa1111",
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:example",
    scope: { collections: ["example"], subjects: ["Example"] },
    source: {
      type: "web_page",
      title: "Example source",
      uri: "https://example.com",
    },
    provenance: {
      acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" },
    },
  };

  const claim: ClaimRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "claim:example:20260501:bbbb2222",
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:example",
    scope: { collections: ["example"], subjects: ["Example"], tags: ["fact"] },
    identity: { claim_key: "example|exists" },
    claim: {
      statement: "Example exists.",
      atomic: true,
    },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [source.id],
      evidence: [
        { source_id: source.id, role: "supports", summary: "The example source supports the claim." },
      ],
    },
    assessment: {
      confidence: "high",
      source_reliability: "high",
      information_depth: { level: "partial", rationale: "Single supporting source; no contradicting evidence checked." },
    },
  };

  const question: QuestionRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "q:example:20260501:cccc3333",
    kind: "question",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:example",
    scope: { collections: ["example"], subjects: ["Example"] },
    question: {
      text: "Does the example always exist?",
      status: "open",
      priority: "medium",
    },
  };

  const synthesis: SynthesisRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "synth:example:20260501:dddd4444",
    kind: "synthesis",
    created_at: "2026-05-01T12:03:00Z",
    created_by: "agent:example",
    scope: { collections: ["example"], subjects: ["Example"] },
    synthesis: {
      title: "Example synthesis",
      summary: "Examples usually exist when referenced.",
      basis: {
        claim_ids: [claim.id],
        question_ids: [question.id],
        source_ids: [source.id],
      },
      status: "active",
    },
  };

  const change: ChangeRow = {
    schema_version: KNB_SCHEMA_VERSION,
    id: "chg:example:20260501:eeee5555",
    kind: "change",
    created_at: "2026-05-01T12:04:00Z",
    created_by: "agent:example",
    scope: { collections: ["example"] },
    change: {
      action: "retract",
      target_ids: [claim.id],
      reason: "Replaced by a more precise claim.",
    },
  };

  return { source, claim, question, synthesis, change };
}

export function operationSamples(): {
  add: ApplyOperation;
  retract: ApplyOperation;
  supersede: ApplyOperation;
  merge: ApplyOperation;
  relate: ApplyOperation;
  patch: ApplyOperation;
} {
  const samples = rowSamples();
  return {
    add: {
      op: "add",
      as: "claim",
      row: {
        kind: "claim",
        scope: { collections: ["example"] },
        identity: { claim_key: "example|exists" },
        claim: { statement: "Example exists.", atomic: true },
        time: { precision: "unknown" },
        provenance: {
          evidence: [
            { source_id: samples.source.id, role: "supports", summary: "The source supports the claim." },
          ],
        },
        assessment: { confidence: "high" },
      },
    },
    retract: {
      op: "retract",
      target_ids: [samples.claim.id],
      reason: "Claim was retracted by the author.",
    },
    supersede: {
      op: "supersede",
      target_ids: [samples.claim.id],
      replacement_id: "$newClaim",
      reason: "Replacement states the same fact more precisely.",
    },
    merge: {
      op: "merge",
      target_ids: [samples.claim.id],
      canonical_id: "$canonicalClaim",
      reason: "Both rows describe the same fact.",
    },
    relate: {
      op: "relate",
      from_id: samples.claim.id,
      to_id: samples.source.id,
      rel: "supports",
      rationale: "Source supports the claim.",
    },
    patch: {
      op: "patch",
      target_id: samples.claim.id,
      patch: [{ op: "replace", path: "/claim/statement", value: "Example exists for sure." }],
      reason: "Mechanical correction of typo.",
    },
  };
}

export function jsonSchema(): Record<string, unknown> {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: KNB_SCHEMA_VERSION,
    title: "knb JSONL Row",
    type: "object",
    required: ["schema_version", "id", "kind", "created_at", "created_by", "scope"],
    properties: {
      schema_version: { const: KNB_SCHEMA_VERSION },
      id: { type: "string", minLength: 1 },
      kind: { enum: [...ROW_KINDS] },
      created_at: { type: "string" },
      created_by: { type: "string" },
      scope: { $ref: "#/$defs/scope" },
      external_refs: { type: "array", items: { $ref: "#/$defs/external_ref" } },
      identity: { $ref: "#/$defs/identity" },
      source: { $ref: "#/$defs/source" },
      claim: { $ref: "#/$defs/claim" },
      question: { $ref: "#/$defs/question" },
      synthesis: { $ref: "#/$defs/synthesis" },
      change: { $ref: "#/$defs/change" },
      time: { $ref: "#/$defs/time" },
      provenance: { $ref: "#/$defs/provenance" },
      assessment: { $ref: "#/$defs/assessment" },
      relations: { type: "array", items: { $ref: "#/$defs/relation" } },
    },
    allOf: [
      {
        if: { properties: { kind: { const: "source" } } },
        then: { required: ["source", "provenance"] },
      },
      {
        if: { properties: { kind: { const: "claim" } } },
        then: {
          required: ["identity", "claim", "time", "provenance", "assessment"],
          properties: {
            provenance: {
              required: ["evidence"],
              properties: { evidence: { minItems: 1 } },
            },
            assessment: { required: ["confidence"] },
          },
        },
      },
      {
        if: { properties: { kind: { const: "question" } } },
        then: { required: ["question"] },
      },
      {
        if: { properties: { kind: { const: "synthesis" } } },
        then: { required: ["synthesis"] },
      },
      {
        if: { properties: { kind: { const: "change" } } },
        then: { required: ["change"] },
      },
    ],
    $defs: {
      scope: {
        type: "object",
        properties: {
          collections: { type: "array", items: { type: "string" } },
          subjects: { type: "array", items: { type: "string" } },
          tags: { type: "array", items: { type: "string" } },
          language: { type: ["string", "null"] },
          geo: { type: "array", items: { type: "string" } },
        },
        anyOf: [
          { required: ["collections"] },
          { required: ["subjects"] },
          { required: ["tags"] },
        ],
      },
      external_ref: {
        type: "object",
        required: ["system", "id"],
        properties: {
          system: { type: "string" },
          id: { type: "string" },
          type: { type: ["string", "null"] },
          path: { type: ["string", "null"] },
        },
      },
      identity: {
        type: "object",
        properties: {
          claim_key: { type: "string" },
          thread_key: { type: "string" },
          dedupe_hash: { type: "string" },
          novelty: {
            enum: ["new", "duplicate", "corroboration", "update", "contradiction", "correction"],
          },
          checked_at: { type: "string" },
        },
      },
      source: {
        type: "object",
        required: ["type", "title"],
        anyOf: [
          { required: ["uri"] },
          { required: ["raw_path"] },
          { required: ["content_hash"] },
        ],
        properties: {
          type: { enum: [...SOURCE_TYPES] },
          title: { type: "string" },
          uri: { type: ["string", "null"] },
          publisher: { type: ["string", "null"] },
          author: { type: ["string", "null"] },
          language: { type: ["string", "null"] },
          published_at: { type: ["string", "null"] },
          content_hash: { type: ["string", "null"] },
          raw_path: { type: ["string", "null"] },
        },
      },
      claim: {
        type: "object",
        required: ["statement", "atomic"],
        properties: {
          statement: { type: "string" },
          atomic: { type: "boolean" },
          type: { type: "string" },
          subject: { type: "string" },
          predicate: { type: "string" },
          object: { type: "string" },
          qualifiers: { type: "object" },
        },
      },
      question: {
        type: "object",
        required: ["text", "status"],
        properties: {
          text: { type: "string" },
          status: { enum: [...QUESTION_STATUSES] },
          priority: { enum: [...QUESTION_PRIORITIES] },
          resolution_criteria: { type: "string" },
          why_it_matters: { type: "string" },
          answer_claim_id: { type: ["string", "null"] },
        },
      },
      synthesis: {
        type: "object",
        required: ["title", "summary", "basis", "status"],
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          basis: {
            type: "object",
            properties: {
              claim_ids: { type: "array", items: { type: "string" } },
              question_ids: { type: "array", items: { type: "string" } },
              source_ids: { type: "array", items: { type: "string" } },
            },
          },
          target_selector: {
            type: "object",
            $ref: "knb.selector.v1",
            description: "Optional RowSelector describing the intended synthesis coverage.",
          },
          limitations: { type: "string" },
          status: { enum: [...SYNTHESIS_STATUSES] },
        },
      },
      change: {
        type: "object",
        required: ["action"],
        properties: {
          action: { enum: [...CHANGE_ACTIONS] },
          target_ids: { type: "array", items: { type: "string" } },
          target_id: { type: "string" },
          replacement_id: { type: "string" },
          canonical_id: { type: "string" },
          reason: { type: "string" },
          relation: {
            type: "object",
            required: ["from_id", "to_id", "rel"],
            properties: {
              from_id: { type: "string" },
              to_id: { type: "string" },
              target_id: { type: "string" },
              rel: { enum: [...RELATION_TYPES] },
              strength: { enum: ["low", "medium", "high"] },
              rationale: { type: "string" },
            },
          },
          patch: { type: "array", items: { type: "object" } },
        },
      },
      time: {
        type: "object",
        required: ["precision"],
        properties: {
          occurred_at: { type: ["string", "null"] },
          valid_at: { type: ["string", "null"] },
          valid_from: { type: ["string", "null"] },
          valid_until: { type: ["string", "null"] },
          reported_at: { type: ["string", "null"] },
          first_observed_at: { type: ["string", "null"] },
          last_checked_at: { type: ["string", "null"] },
          precision: { enum: [...TIME_PRECISIONS] },
          timezone: { type: ["string", "null"] },
          notes: { type: "string" },
        },
      },
      provenance: {
        type: "object",
        properties: {
          source_ids: { type: "array", items: { type: "string" } },
          evidence: { type: "array", items: { $ref: "#/$defs/evidence_ref" } },
          acquisition: { type: "object" },
          transformations: { type: "array", items: { type: "object" } },
          derivation: { type: "object" },
        },
      },
      evidence_ref: {
        type: "object",
        required: ["source_id", "role", "summary"],
        properties: {
          source_id: { type: "string" },
          role: { enum: [...EVIDENCE_ROLES] },
          locator: { type: "object" },
          summary: { type: "string" },
        },
      },
      assessment: {
        type: "object",
        properties: {
          confidence: { enum: [...CONFIDENCE_VALUES] },
          source_reliability: { enum: [...ASSESSMENT_LEVELS] },
          information_depth: {
            type: "object",
            required: ["level", "rationale"],
            properties: {
              level: { enum: [...INFORMATION_DEPTH_VALUES] },
              rationale: { type: "string" },
            },
          },
          importance: { enum: [...ASSESSMENT_LEVELS] },
          contested: { type: "boolean" },
          uncertainty: { type: "string" },
        },
      },
      relation: {
        type: "object",
        required: ["target_id", "rel"],
        properties: {
          target_id: { type: "string" },
          rel: { enum: [...RELATION_TYPES] },
          strength: { enum: ["low", "medium", "high"] },
          rationale: { type: "string" },
        },
      },
    },
  };
}

function validateCommon(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  const id = stringValue(row.id);
  if (!stringValue(row.schema_version)) {
    issues.push({
      level: "error",
      code: "schema_version_required",
      line: loaded.line,
      id,
      message: "schema_version is required",
      path: "schema_version",
    });
  } else if (row.schema_version !== KNB_SCHEMA_VERSION) {
    issues.push({
      level: "error",
      code: "schema_version_invalid",
      line: loaded.line,
      id,
      message: `schema_version must be ${KNB_SCHEMA_VERSION}`,
      path: "schema_version",
    });
  }
  if (!id) {
    issues.push({ level: "error", code: "id_required", line: loaded.line, message: "id is required", path: "id" });
  }
  if (typeof row.kind !== "string" || !ROW_KINDS.includes(row.kind as KnbRowKind)) {
    issues.push({
      level: "error",
      code: "kind_invalid",
      line: loaded.line,
      id,
      message: `kind must be one of: ${ROW_KINDS.join(", ")}`,
      path: "kind",
    });
  }
  if (!stringValue(row.created_at)) {
    issues.push({
      level: "error",
      code: "created_at_required",
      line: loaded.line,
      id,
      message: "created_at is required",
      path: "created_at",
    });
  } else if (typeof row.created_at === "string" && Number.isNaN(Date.parse(row.created_at))) {
    issues.push({
      level: "error",
      code: "created_at_invalid",
      line: loaded.line,
      id,
      message: "created_at must be ISO-ish datetime",
      path: "created_at",
    });
  }
  if (!stringValue(row.created_by)) {
    issues.push({
      level: "error",
      code: "created_by_required",
      line: loaded.line,
      id,
      message: "created_by is required",
      path: "created_by",
    });
  }
  if (!isRecord(row.scope)) {
    issues.push({
      level: "error",
      code: "scope_invalid",
      line: loaded.line,
      id,
      message: "scope must be an object",
      path: "scope",
    });
  } else if (!scopeHasAnchor(row.scope as Scope)) {
    issues.push({
      level: "error",
      code: "scope_anchor_required",
      line: loaded.line,
      id,
      message: "scope must include at least one collection, subject, or tag",
      path: "scope",
    });
  }
}

function validateSource(loaded: LoadedRow & { row: SourceRow }, issues: ValidationIssue[]): void {
  const row = loaded.row;
  const source = (row as { source?: unknown }).source;
  if (!isRecord(source)) {
    issues.push({
      level: "error",
      code: "source_object_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include source object",
      path: "source",
    });
    return;
  }
  requireEnum(source.type, SOURCE_TYPES, "source.type", "source_type_invalid", loaded, issues);
  requireString(source.title, "source.title", "source_title_required", loaded, issues);
  if (!stringValue(source.uri) && !stringValue(source.raw_path) && !stringValue(source.content_hash)) {
    issues.push({
      level: "error",
      code: "source_evidence_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include source.uri, source.raw_path, or source.content_hash",
      path: "source",
    });
  }
  if (!isRecord((row as { provenance?: unknown }).provenance)) {
    issues.push({
      level: "error",
      code: "source_provenance_required",
      line: loaded.line,
      id: row.id,
      message: "source row must include provenance object",
      path: "provenance",
    });
  }
  validateAssessment((row as { assessment?: unknown }).assessment, loaded, issues, { requireConfidence: false });
}

function checkSourceDuplicate(
  loaded: LoadedRow & { row: SourceRow },
  uris: Map<string, LoadedRow>,
  hashes: Map<string, LoadedRow>,
  inactiveSourceIds: Set<string>,
  issues: ValidationIssue[],
): void {
  const source = (loaded.row as { source?: unknown }).source;
  if (!isRecord(source)) return;
  if (inactiveSourceIds.has(loaded.row.id)) return;
  const uri = stringValue(source.uri);
  if (uri) {
    const previous = uris.get(uri);
    if (previous) {
      issues.push({
        level: "warning",
        code: "duplicate_source_evidence",
        line: loaded.line,
        id: loaded.row.id,
        message: `Duplicate source.uri: ${uri} also appears at line ${previous.line}`,
        path: "source.uri",
      });
    } else {
      uris.set(uri, loaded);
    }
  }
  const hash = stringValue(source.content_hash);
  if (hash) {
    const previous = hashes.get(hash);
    if (previous) {
      issues.push({
        level: "warning",
        code: "duplicate_source_evidence",
        line: loaded.line,
        id: loaded.row.id,
        message: `Duplicate source.content_hash: ${hash} also appears at line ${previous.line}`,
        path: "source.content_hash",
      });
    } else {
      hashes.set(hash, loaded);
    }
  }
}

function validateClaim(loaded: LoadedRow & { row: ClaimRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.identity)) {
    issues.push({
      level: "error",
      code: "claim_identity_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include identity object",
      path: "identity",
    });
  }
  if (!isRecord(row.claim)) {
    issues.push({
      level: "error",
      code: "claim_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include claim object",
      path: "claim",
    });
  } else {
    requireString(row.claim.statement, "claim.statement", "claim_statement_required", loaded, issues);
    if (typeof row.claim.atomic !== "boolean") {
      issues.push({
        level: "error",
        code: "claim_atomic_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "claim.atomic must be boolean",
        path: "claim.atomic",
      });
    }
  }
  if (!isRecord(row.time)) {
    issues.push({
      level: "error",
      code: "claim_time_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include time object",
      path: "time",
    });
  } else {
    requireEnum(row.time.precision, TIME_PRECISIONS, "time.precision", "time_precision_invalid", loaded, issues);
  }
  if (!isRecord(row.provenance)) {
    issues.push({
      level: "error",
      code: "claim_provenance_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include provenance object",
      path: "provenance",
    });
  } else if (!Array.isArray(row.provenance.evidence) || row.provenance.evidence.length === 0) {
    issues.push({
      level: "error",
      code: "claim_provenance_evidence_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim provenance.evidence must have at least one item",
      path: "provenance.evidence",
    });
  }
  if (!isRecord(row.assessment)) {
    issues.push({
      level: "error",
      code: "claim_assessment_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "claim row must include assessment object",
      path: "assessment",
    });
  } else {
    validateAssessment(row.assessment, loaded, issues, { requireConfidence: true });
  }
}

function validateQuestion(loaded: LoadedRow, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.question)) {
    issues.push({
      level: "error",
      code: "question_object_required",
      line: loaded.line,
      id: stringValue(row.id),
      message: "question row must include question object",
      path: "question",
    });
    return;
  }
  requireString(row.question.text, "question.text", "question_text_required", loaded, issues);
  requireEnum(row.question.status, QUESTION_STATUSES, "question.status", "question_status_invalid", loaded, issues);
  if (row.question.priority !== undefined) {
    requireEnum(
      row.question.priority,
      QUESTION_PRIORITIES,
      "question.priority",
      "question_priority_invalid",
      loaded,
      issues,
    );
  }
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
}

function validateSynthesis(loaded: LoadedRow & { row: SynthesisRow }, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  if (!isRecord(row.synthesis)) {
    issues.push({
      level: "error",
      code: "synthesis_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis row must include synthesis object",
      path: "synthesis",
    });
    return;
  }
  requireString(row.synthesis.title, "synthesis.title", "synthesis_title_required", loaded, issues);
  requireString(row.synthesis.summary, "synthesis.summary", "synthesis_summary_required", loaded, issues);
  requireEnum(
    row.synthesis.status,
    SYNTHESIS_STATUSES,
    "synthesis.status",
    "synthesis_status_invalid",
    loaded,
    issues,
  );
  if (!isRecord(row.synthesis.basis)) {
    issues.push({
      level: "error",
      code: "synthesis_basis_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis.basis must be an object",
      path: "synthesis.basis",
    });
    return;
  }
  const basis = row.synthesis.basis as Record<string, unknown>;
  const hasBasis =
    nonEmptyStringArray(basis.claim_ids) ||
    nonEmptyStringArray(basis.question_ids) ||
    nonEmptyStringArray(basis.source_ids);
  if (!hasBasis && !stringValue(row.synthesis.limitations)) {
    issues.push({
      level: "error",
      code: "synthesis_basis_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "synthesis must include a basis id or explicit limitations note",
      path: "synthesis.basis",
    });
  }
  if (row.synthesis.target_selector !== undefined) {
    const selectorValidation = validateRowSelector(row.synthesis.target_selector);
    for (const issue of selectorValidation.issues) {
      issues.push({
        level: "error",
        code: "synthesis_target_selector_invalid",
        line: loaded.line,
        id: loaded.row.id,
        message: `Invalid synthesis.target_selector: ${issue.message}`,
        path: issue.path ? `synthesis.target_selector.${issue.path}` : "synthesis.target_selector",
      });
    }
  }
  validateAssessment(row.assessment, loaded, issues, { requireConfidence: false });
}

function validateChange(loaded: LoadedRow & { row: ChangeRow }, byId: RowMap, issues: ValidationIssue[]): void {
  const change = (loaded.row as { change?: unknown }).change;
  if (!isRecord(change)) {
    issues.push({
      level: "error",
      code: "change_object_required",
      line: loaded.line,
      id: loaded.row.id,
      message: "change row must include change object",
      path: "change",
    });
    return;
  }

  requireEnum(change.action, CHANGE_ACTIONS, "change.action", "change_action_invalid", loaded, issues);

  if (change.action === "retract") {
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids", "change_target_required", "change_target_unresolved");
    requireString(change.reason, "change.reason", "change_reason_required", loaded, issues);
    return;
  }

  if (change.action === "supersede") {
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids", "change_target_required", "change_target_unresolved");
    requireExistingId(
      change.replacement_id,
      loaded,
      byId,
      issues,
      "change.replacement_id",
      "change_replacement_required",
      "change_replacement_unresolved",
    );
    requireString(change.reason, "change.reason", "change_reason_required", loaded, issues);
    return;
  }

  if (change.action === "merge") {
    requireExistingId(
      change.canonical_id,
      loaded,
      byId,
      issues,
      "change.canonical_id",
      "change_canonical_required",
      "change_canonical_unresolved",
    );
    requireTargetIds(change.target_ids, loaded, byId, issues, "change.target_ids", "change_target_required", "change_target_unresolved");
    requireString(change.reason, "change.reason", "change_reason_required", loaded, issues);
    return;
  }

  if (change.action === "relate") {
    const relation = change.relation;
    if (!isRecord(relation)) {
      issues.push({
        level: "error",
        code: "change_relation_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "change.relation must be an object",
        path: "change.relation",
      });
      return;
    }
    requireExistingId(
      relation.from_id,
      loaded,
      byId,
      issues,
      "change.relation.from_id",
      "change_relation_endpoint_required",
      "change_relation_endpoint_unresolved",
    );
    requireExistingId(
      relation.to_id,
      loaded,
      byId,
      issues,
      "change.relation.to_id",
      "change_relation_endpoint_required",
      "change_relation_endpoint_unresolved",
    );
    requireEnum(relation.rel, RELATION_TYPES, "change.relation.rel", "relation_kind_invalid", loaded, issues);
    return;
  }

  if (change.action === "patch") {
    requireExistingId(
      change.target_id,
      loaded,
      byId,
      issues,
      "change.target_id",
      "change_target_required",
      "change_target_unresolved",
    );
    if (!Array.isArray(change.patch) || change.patch.length === 0) {
      issues.push({
        level: "error",
        code: "change_patch_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "change.patch must have at least one item",
        path: "change.patch",
      });
    }
    requireString(change.reason, "change.reason", "change_reason_required", loaded, issues);
  }
}

function validateAssessment(
  value: unknown,
  loaded: LoadedRow,
  issues: ValidationIssue[],
  options: { requireConfidence: boolean },
): void {
  if (value === undefined) return;
  if (!isRecord(value)) {
    issues.push({
      level: "error",
      code: "assessment_invalid",
      line: loaded.line,
      id: loaded.row.id,
      message: "assessment must be an object",
      path: "assessment",
    });
    return;
  }

  const assessment = value as Assessment;
  if (options.requireConfidence || assessment.confidence !== undefined) {
    requireEnum(
      assessment.confidence,
      CONFIDENCE_VALUES,
      "assessment.confidence",
      "assessment_confidence_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.source_reliability !== undefined) {
    requireEnum(
      assessment.source_reliability,
      ASSESSMENT_LEVELS,
      "assessment.source_reliability",
      "assessment_source_reliability_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.importance !== undefined) {
    requireEnum(
      assessment.importance,
      ASSESSMENT_LEVELS,
      "assessment.importance",
      "assessment_importance_invalid",
      loaded,
      issues,
    );
  }
  if (assessment.information_depth !== undefined) {
    if (!isRecord(assessment.information_depth)) {
      issues.push({
        level: "error",
        code: "assessment_information_depth_invalid",
        line: loaded.line,
        id: loaded.row.id,
        message: "assessment.information_depth must be an object",
        path: "assessment.information_depth",
      });
      return;
    }
    requireEnum(
      assessment.information_depth.level,
      INFORMATION_DEPTH_VALUES,
      "assessment.information_depth.level",
      "assessment_information_depth_level_invalid",
      loaded,
      issues,
    );
    requireString(
      assessment.information_depth.rationale,
      "assessment.information_depth.rationale",
      "assessment_information_depth_rationale_required",
      loaded,
      issues,
    );
  }
}

function validateSourceRefs(loaded: LoadedRow, sourceIds: Set<string>, issues: ValidationIssue[]): void {
  const row = loaded.row as Record<string, unknown>;
  const provenance = isRecord(row.provenance) ? row.provenance : undefined;
  if (!provenance) return;

  for (const sourceId of stringArray(provenance.source_ids)) {
    if (!sourceIds.has(sourceId)) {
      issues.push({
        level: "error",
        code: "evidence_source_unresolved",
        line: loaded.line,
        id: stringValue(row.id),
        message: `Unresolved provenance source_id: ${sourceId}`,
        path: "provenance.source_ids",
      });
    }
  }

  if (Array.isArray(provenance.evidence)) {
    for (const evidence of provenance.evidence) {
      if (!isRecord(evidence)) {
        issues.push({
          level: "error",
          code: "evidence_invalid",
          line: loaded.line,
          id: stringValue(row.id),
          message: "Evidence item must be an object",
          path: "provenance.evidence",
        });
        continue;
      }
      const sourceId = stringValue(evidence.source_id);
      if (!sourceId) {
        issues.push({
          level: "error",
          code: "evidence_source_required",
          line: loaded.line,
          id: stringValue(row.id),
          message: "Evidence item must include source_id",
          path: "provenance.evidence.source_id",
        });
      } else if (!sourceIds.has(sourceId)) {
        issues.push({
          level: "error",
          code: "evidence_source_unresolved",
          line: loaded.line,
          id: stringValue(row.id),
          message: `Unresolved evidence source_id: ${sourceId}`,
          path: "provenance.evidence.source_id",
        });
      }
      requireEnum(evidence.role, EVIDENCE_ROLES, "evidence.role", "evidence_role_invalid", loaded, issues);
      requireString(evidence.summary, "evidence.summary", "evidence_summary_required", loaded, issues);
    }
  }
}

function validateRelations(loaded: LoadedRow, byId: RowMap, issues: ValidationIssue[]): void {
  const relations = (loaded.row as { relations?: unknown }).relations;
  if (relations === undefined) return;
  if (!Array.isArray(relations)) {
    issues.push({
      level: "error",
      code: "relations_invalid",
      line: loaded.line,
      id: loaded.row.id,
      message: "relations must be an array",
      path: "relations",
    });
    return;
  }
  for (const relation of relations) {
    if (!isRecord(relation)) {
      issues.push({
        level: "error",
        code: "relation_invalid",
        line: loaded.line,
        id: loaded.row.id,
        message: "relation item must be an object",
        path: "relations",
      });
      continue;
    }
    const targetId = stringValue(relation.target_id);
    if (!targetId) {
      issues.push({
        level: "error",
        code: "relation_target_required",
        line: loaded.line,
        id: loaded.row.id,
        message: "relation.target_id is required",
        path: "relations.target_id",
      });
    } else if (!byId.has(targetId)) {
      issues.push({
        level: "error",
        code: "relation_target_unresolved",
        line: loaded.line,
        id: loaded.row.id,
        message: `Unresolved relation target_id: ${targetId}`,
        path: "relations.target_id",
      });
    }
    requireEnum(relation.rel, RELATION_TYPES, "relation.rel", "relation_kind_invalid", loaded, issues);
  }
}

function requireTargetIds(
  value: unknown,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
  requiredCode: string,
  unresolvedCode: string,
): void {
  const targetIds = stringArray(value);
  if (targetIds.length === 0) {
    issues.push({
      level: "error",
      code: requiredCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} must have at least one id`,
      path: field,
    });
    return;
  }
  for (const targetId of targetIds) {
    requireExistingId(targetId, loaded, byId, issues, field, requiredCode, unresolvedCode);
  }
}

function requireExistingId(
  value: unknown,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
  requiredCode: string,
  unresolvedCode: string,
): void {
  const id = stringValue(value);
  if (!id) {
    issues.push({
      level: "error",
      code: requiredCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} is required`,
      path: field,
    });
    return;
  }
  if (!byId.has(id)) {
    issues.push({
      level: "error",
      code: unresolvedCode,
      line: loaded.line,
      id: loaded.row.id,
      message: `Unresolved ${field}: ${id}`,
      path: field,
    });
  }
}

function validateSynthesisBasis(rows: LoadedRow[], byId: RowMap, issues: ValidationIssue[]): void {
  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "synthesis") continue;
    const synthesis = (loaded.row as SynthesisRow).synthesis;
    if (!isRecord(synthesis?.basis)) continue;
    for (const id of synthesis.basis.claim_ids ?? []) {
      requireTargetKind(id, "claim", loaded, byId, issues, "synthesis.basis.claim_ids");
    }
    for (const id of synthesis.basis.question_ids ?? []) {
      requireTargetKind(id, "question", loaded, byId, issues, "synthesis.basis.question_ids");
    }
    for (const id of synthesis.basis.source_ids ?? []) {
      requireTargetKind(id, "source", loaded, byId, issues, "synthesis.basis.source_ids");
    }
  }
}

function validateQuestionAnswers(rows: LoadedRow[], byId: RowMap, issues: ValidationIssue[]): void {
  for (const loaded of rows) {
    if ((loaded.row as { kind?: unknown }).kind !== "question") continue;
    const answerId = (loaded.row as { question?: { answer_claim_id?: unknown } }).question?.answer_claim_id;
    if (typeof answerId === "string" && answerId) {
      requireTargetKind(answerId, "claim", loaded, byId, issues, "question.answer_claim_id");
    }
  }
}

function requireTargetKind(
  id: string,
  kind: string,
  loaded: LoadedRow,
  byId: RowMap,
  issues: ValidationIssue[],
  field: string,
): void {
  const target = byId.get(id);
  if (!target) {
    issues.push({
      level: "error",
      code: "synthesis_basis_unresolved",
      line: loaded.line,
      id: loaded.row.id,
      message: `Unresolved ${field}: ${id}`,
      path: field,
    });
    return;
  }
  if (target.kind !== kind) {
    issues.push({
      level: "error",
      code: "synthesis_basis_kind_mismatch",
      line: loaded.line,
      id: loaded.row.id,
      message: `${field} must reference a ${kind} row: ${id}`,
      path: field,
    });
  }
}

function validateOperation(operation: unknown, basePath: string, issues: ValidationIssue[]): void {
  if (!isRecord(operation)) {
    issues.push({
      level: "error",
      code: "operation_invalid",
      message: "operation must be an object",
      path: basePath,
    });
    return;
  }
  const op = (operation as { op?: unknown }).op;
  if (typeof op !== "string" || !APPLY_OPERATION_KINDS.includes(op as ApplyOperationKind)) {
    issues.push({
      level: "error",
      code: "operation_kind_invalid",
      message: `op must be one of: ${APPLY_OPERATION_KINDS.join(", ")}`,
      path: `${basePath}.op`,
    });
    return;
  }
  if (op === "add") {
    if (!isRecord((operation as { row?: unknown }).row)) {
      issues.push({
        level: "error",
        code: "operation_row_required",
        message: "add operation requires a row object",
        path: `${basePath}.row`,
      });
    }
    return;
  }
  const reason = (operation as { reason?: unknown }).reason;
  if (op === "retract" || op === "supersede" || op === "merge" || op === "patch") {
    if (typeof reason !== "string" || reason.length === 0) {
      issues.push({
        level: "error",
        code: "operation_reason_required",
        message: `${op} operation requires a reason`,
        path: `${basePath}.reason`,
      });
    }
  }
  if (op === "retract" || op === "supersede" || op === "merge") {
    const targets = (operation as { target_ids?: unknown }).target_ids;
    if (!Array.isArray(targets) || targets.length === 0) {
      issues.push({
        level: "error",
        code: "operation_target_required",
        message: `${op} operation requires target_ids`,
        path: `${basePath}.target_ids`,
      });
    }
  }
  if (op === "supersede") {
    if (typeof (operation as { replacement_id?: unknown }).replacement_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_replacement_required",
        message: "supersede operation requires replacement_id",
        path: `${basePath}.replacement_id`,
      });
    }
  }
  if (op === "merge") {
    if (typeof (operation as { canonical_id?: unknown }).canonical_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_canonical_required",
        message: "merge operation requires canonical_id",
        path: `${basePath}.canonical_id`,
      });
    }
  }
  if (op === "relate") {
    if (typeof (operation as { from_id?: unknown }).from_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_from_required",
        message: "relate operation requires from_id",
        path: `${basePath}.from_id`,
      });
    }
    if (typeof (operation as { to_id?: unknown }).to_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_to_required",
        message: "relate operation requires to_id",
        path: `${basePath}.to_id`,
      });
    }
    const rel = (operation as { rel?: unknown }).rel;
    if (typeof rel !== "string" || !RELATION_TYPES.includes(rel as RelationType)) {
      issues.push({
        level: "error",
        code: "relation_kind_invalid",
        message: `rel must be one of: ${RELATION_TYPES.join(", ")}`,
        path: `${basePath}.rel`,
      });
    }
  }
  if (op === "patch") {
    if (typeof (operation as { target_id?: unknown }).target_id !== "string") {
      issues.push({
        level: "error",
        code: "operation_target_required",
        message: "patch operation requires target_id",
        path: `${basePath}.target_id`,
      });
    }
    const patch = (operation as { patch?: unknown }).patch;
    if (!Array.isArray(patch) || patch.length === 0) {
      issues.push({
        level: "error",
        code: "operation_patch_required",
        message: "patch operation requires a non-empty patch array",
        path: `${basePath}.patch`,
      });
    }
  }
}

function requireString(
  value: unknown,
  field: string,
  code: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
): void {
  if (!stringValue(value)) {
    issues.push({
      level: "error",
      code,
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} is required`,
      path: field,
    });
  }
}

function requireEnum<T extends readonly string[]>(
  value: unknown,
  allowed: T,
  field: string,
  code: string,
  loaded: LoadedRow,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string" || !allowed.includes(value)) {
    issues.push({
      level: "error",
      code,
      line: loaded.line,
      id: stringValue((loaded.row as { id?: unknown }).id),
      message: `${field} must be one of: ${allowed.join(", ")}`,
      path: field,
    });
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

function nonEmptyStringArray(value: unknown): boolean {
  return stringArray(value).length > 0;
}

function scopeHasAnchor(scope: Scope): boolean {
  return Boolean(scope.collections?.length || scope.subjects?.length || scope.tags?.length);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function formatYmd(date: Date): string {
  const year = date.getUTCFullYear().toString().padStart(4, "0");
  const month = (date.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = date.getUTCDate().toString().padStart(2, "0");
  return `${year}${month}${day}`;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/cli-adapter-thinness.test.ts
```ts
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
  "renderCollection",
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

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/contract-schema-ownership.test.ts
```ts
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
  "src/core/novelty.ts",
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
  "tests/novelty-projection.test.ts",
  "tests/novelty.test.ts",
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

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/apply-add-ownership.test.ts
```ts
import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripComments,
  stripCommentsAndStrings,
} from "./_helpers";

const APPLY_OWNER = "src/core/apply.ts";
const FACADE = "src/core/knb.ts";
const CLI_FILE = "src/cli.ts";

const CORE_SCAN = [
  "src/core/apply.ts",
  "src/core/contract.ts",
  "src/core/context.ts",
  "src/core/errors.ts",
  "src/core/knb.ts",
  "src/core/ledger.ts",
  "src/core/novelty.ts",
  "src/core/output.ts",
  "src/core/projections.ts",
  "src/core/query.ts",
  "src/core/read-snapshot.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
];

function findMethodBody(text: string, methodName: string): string | null {
  const headerPattern = new RegExp(
    `\\basync\\s+${methodName}\\s*\\([^)]*\\)\\s*(?::\\s*Promise<[^>]+>\\s*)?\\{`,
    "g",
  );
  const m = headerPattern.exec(text);
  if (m === null) return null;
  const start = m.index + m[0].length;
  let depth = 1;
  let i = start;
  while (i < text.length && depth > 0) {
    const ch = text[i];
    if (ch === "{") depth += 1;
    else if (ch === "}") depth -= 1;
    i += 1;
  }
  return text.slice(start, i - 1);
}

describe("apply and add write-path ownership (bd-3p4.6)", () => {
  test("only src/core/apply.ts imports writeLedger from ./ledger", async () => {
    const files = await readSourceFiles(CORE_SCAN);
    const violations: string[] = [];
    const pattern =
      /import\s*(?!type\b)[^;]*\bwriteLedger\b[^;]*from\s*["']\.\/ledger["']/g;
    for (const file of files) {
      if (file.path.endsWith(APPLY_OWNER)) continue;
      const matches = findMatches(file.strippedComments, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "import writeLedger from './ledger'", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only src/core/apply.ts calls writeLedger directly", async () => {
    const files = await readSourceFiles(CORE_SCAN);
    const violations: string[] = [];
    const pattern = /\bwriteLedger\s*\(/g;
    for (const file of files) {
      if (file.path.endsWith(APPLY_OWNER)) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "writeLedger(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("facade add method delegates to apply via applyOperations or facade.apply", async () => {
    const files = await readSourceFiles([FACADE]);
    const facade = files[0]!;
    const body = findMethodBody(facade.stripped, "add");
    expect(body).not.toBeNull();
    const callsApply =
      /\bapplyOperations\s*\(/.test(body!) ||
      /\b(?:this|facade)\s*\.\s*apply\s*\(/.test(body!) ||
      /\.apply\s*\(\s*\{/.test(body!);
    expect(callsApply).toBe(true);
  });

  test("facade add method does not import or call writeLedger / appendFile", async () => {
    const files = await readSourceFiles([FACADE]);
    const facade = files[0]!;
    const body = findMethodBody(facade.stripped, "add");
    expect(body).not.toBeNull();
    expect(/\bwriteLedger\s*\(/.test(body!)).toBe(false);
    expect(/\bappendFile\s*\(/.test(body!)).toBe(false);
  });

  test("cli.ts does not construct change rows directly", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    const stringSensitive: Array<{ label: string; rx: RegExp }> = [
      { label: 'kind: "change"', rx: /\bkind\s*:\s*["']change["']/g },
    ];
    const codeOnly: Array<{ label: string; rx: RegExp }> = [
      { label: "applyOperations(", rx: /\bapplyOperations\s*\(/g },
      { label: "writeLedger(", rx: /\bwriteLedger\s*\(/g },
    ];
    for (const p of stringSensitive) {
      const matches = findMatches(cli.strippedComments, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    for (const p of codeOnly) {
      const matches = findMatches(cli.stripped, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("cli.ts does not reintroduce a legacy append command in dispatcher", async () => {
    const files = await readSourceFiles([CLI_FILE]);
    const cli = files[0]!;
    const violations: string[] = [];
    const stringSensitive: Array<{ label: string; rx: RegExp }> = [
      { label: 'command === "append"', rx: /\bcommand\s*===\s*["']append["']/g },
      { label: 'case "append":', rx: /\bcase\s+["']append["']\s*:/g },
      { label: '"append":', rx: /["']append["']\s*:/g },
    ];
    const codeOnly: Array<{ label: string; rx: RegExp }> = [
      { label: "commands.append", rx: /\bcommands\s*\.\s*append\b/g },
    ];
    for (const p of stringSensitive) {
      const matches = findMatches(cli.strippedComments, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    for (const p of codeOnly) {
      const matches = findMatches(cli.stripped, p.rx);
      if (matches.length > 0) {
        violations.push(describeViolations(cli, p.label, matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("apply owner contains the writeLedger call site", async () => {
    const files = await readSourceFiles([APPLY_OWNER]);
    const apply = files[0]!;
    const matches = findMatches(apply.stripped, /\bwriteLedger\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden writeLedger import in negative fixture", () => {
    const bad = `
      import { writeLedger } from "./ledger";
      export async function rogue() {
        return writeLedger({} as never);
      }
    `;
    const scanned = stripComments(bad);
    const importMatches = findMatches(
      scanned,
      /import\s*(?!type\b)[^;]*\bwriteLedger\b[^;]*from\s*["']\.\/ledger["']/g,
    );
    expect(importMatches.length).toBe(1);
  });

  test("scanner detects forbidden case \"append\" in negative fixture", () => {
    const bad = `
      switch (command) {
        case "append":
          return runAppend(args);
        default:
          return null;
      }
    `;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bcase\s+["']append["']\s*:/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden change-row construction in negative fixture", () => {
    const bad = `
      const row = { kind: "change", action: "retract", target_id: id };
    `;
    const scanned = stripComments(bad);
    const matches = findMatches(scanned, /\bkind\s*:\s*["']change["']/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden direct writeLedger call in negative fixture", () => {
    const bad = `await writeLedger({ candidates, snapshot });`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bwriteLedger\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner ignores append mentions inside string literals and comments", () => {
    const benign = `
      // case "append": legacy
      const help = "old: case \\"append\\": handler";
    `;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bcase\s+["']append["']\s*:/g);
    expect(matches.length).toBe(0);
  });
});

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/legacy-cleanup.test.ts
```ts
import { readFile } from "node:fs/promises";
import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  repoPath,
  stripComments,
  stripCommentsAndStrings,
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
  "src/core/novelty.ts",
  "src/core/output.ts",
  "src/core/projections.ts",
  "src/core/query.ts",
  "src/core/read-snapshot.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
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
});

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/e2e-agent-loop.test.ts
```ts
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { V1_INDEX_NAMES } from "../src/core/projections";

const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

let workDir: string;

beforeEach(async () => {
  const raw = await mkdtemp(join(tmpdir(), "knb-e2e-"));
  workDir = await realpath(raw);
});

afterEach(async () => {
  try {
    await chmod(workDir, 0o700);
  } catch {}
  await rm(workDir, { recursive: true, force: true });
});

type SpawnResult = { code: number; stdout: string; stderr: string };

async function runKnb(args: string[], stdinPayload?: string): Promise<SpawnResult> {
  const stdio: ["pipe" | "ignore", "pipe", "pipe"] = [stdinPayload === undefined ? "ignore" : "pipe", "pipe", "pipe"];
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd: workDir,
    stdio,
    env: { ...process.env, KNB_CONFIG: "" },
  });
  if (stdinPayload !== undefined && proc.stdin) {
    proc.stdin.write(stdinPayload);
    await proc.stdin.end();
  }
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

type Envelope<T = unknown> =
  | { ok: true; command: string; data: T; meta: Record<string, unknown> }
  | { ok: false; command?: string; error: { code: string; message: string; details?: unknown }; meta: Record<string, unknown> & { exit_code: number } };

function parseSuccess<T>(text: string): { ok: true; command: string; data: T; meta: Record<string, unknown> } {
  const env = JSON.parse(text.trim()) as Envelope<T>;
  if (!env.ok) throw new Error(`Expected success envelope; got ${text}`);
  return env;
}

function parseFailure(text: string): { ok: false; command?: string; error: { code: string; message: string; details?: unknown }; meta: Record<string, unknown> & { exit_code: number } } {
  const env = JSON.parse(text.trim()) as Envelope;
  if (env.ok) throw new Error(`Expected failure envelope; got ${text}`);
  return env;
}

describe("e2e: full agent loop", () => {
  test("init -> status -> schema -> apply 3-op -> check -> context -> novelty -> dedupe -> render -> index --rebuild -> check -> status", async () => {
    // 1. init
    const initRun = await runKnb(["init", "--json"]);
    expect(initRun.code).toBe(0);
    const initEnv = parseSuccess<{ created_paths: string[]; ledger_path: string; schema_path: string; config_path: string; workspace_root: string }>(initRun.stdout);
    expect(initEnv.command).toBe("init");
    expect(Array.isArray(initEnv.data.created_paths)).toBe(true);
    expect(initEnv.data.created_paths.length).toBeGreaterThan(0);
    expect(await pathExists(join(workDir, "knb", "ledger.jsonl"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "schema.json"))).toBe(true);
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);

    // 2. status
    const statusRun = await runKnb(["status", "--json"]);
    expect(statusRun.code).toBe(0);
    const statusEnv = parseSuccess<{ row_count: number; schema_version: string }>(statusRun.stdout);
    expect(statusEnv.data.row_count).toBe(0);
    expect(statusEnv.data.schema_version).toBe("knb.v1");

    // 3. schema
    const schemaRun = await runKnb(["schema", "--json"]);
    expect(schemaRun.code).toBe(0);
    const schemaEnv = parseSuccess<{ schema_version: string; row_samples: unknown[]; operation_samples: unknown[] }>(schemaRun.stdout);
    expect(schemaEnv.data.schema_version).toBe("knb.v1");
    expect(schemaEnv.data.row_samples.length).toBeGreaterThanOrEqual(5);

    // 4. apply 3-op batch (source -> claim -> synthesis)
    const opsPayload = {
      operations: [
        {
          op: "add",
          as: "source",
          row: {
            kind: "source",
            scope: { collections: ["example"] },
            source: {
              type: "web_page",
              title: "E2E source",
              uri: "https://example.com/e2e",
            },
            provenance: { acquisition: { method: "manual" } },
          },
        },
        {
          op: "add",
          as: "claim",
          row: {
            kind: "claim",
            scope: { collections: ["example"] },
            identity: { claim_key: "example|e2e-loop-runs" },
            claim: { statement: "The e2e loop runs.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: ["$source"],
              evidence: [{ source_id: "$source", role: "supports", summary: "Source backs the claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
        {
          op: "add",
          as: "synthesis",
          row: {
            kind: "synthesis",
            scope: { collections: ["example"] },
            synthesis: {
              title: "E2E synthesis",
              summary: "Synthesizes the e2e loop.",
              basis: { claim_ids: ["$claim"], source_ids: ["$source"] },
              status: "active",
            },
          },
        },
      ],
    };
    const applyRun = await runKnb(
      ["apply", "--stdin", "--atomic", "--json"],
      JSON.stringify(opsPayload),
    );
    expect(applyRun.code).toBe(0);
    const applyEnv = parseSuccess<{
      created: Array<{ id: string; kind: string; as?: string }>;
      meta: { rows_appended: number };
    }>(applyRun.stdout);
    expect(applyEnv.data.created.length).toBe(3);
    expect(applyEnv.data.meta.rows_appended).toBe(3);
    const createdSource = applyEnv.data.created[0];
    const createdClaim = applyEnv.data.created[1];
    const createdSynthesis = applyEnv.data.created[2];
    expect(createdSource?.kind).toBe("source");
    expect(createdClaim?.kind).toBe("claim");
    expect(createdSynthesis?.kind).toBe("synthesis");

    // 5. check (indexes still missing because we haven't rebuilt yet)
    const checkRunBefore = await runKnb(["check", "--json"]);
    expect(checkRunBefore.code).toBe(0);
    const checkEnvBefore = parseSuccess<{ ok: boolean; projection_freshness: { entries: Array<{ kind: string; state: string }> } }>(checkRunBefore.stdout);
    expect(checkEnvBefore.data.ok).toBe(false);
    const missingIndexes = checkEnvBefore.data.projection_freshness.entries.filter(
      (entry) => entry.kind === "index" && entry.state === "missing",
    );
    expect(missingIndexes.length).toBe(V1_INDEX_NAMES.length);

    // 6. context for the example collection
    const contextRun = await runKnb(["context", "--collection", "example", "--json"]);
    expect(contextRun.code).toBe(0);
    const contextEnv = parseSuccess<{
      summary: string;
      key_claims: Array<{ id: string; statement: string }>;
    }>(contextRun.stdout);
    expect(contextEnv.data.summary.length).toBeGreaterThan(0);
    const keyIds = contextEnv.data.key_claims.map((c) => c.id);
    expect(keyIds).toContain(createdClaim?.id ?? "MISSING");

    // 7. novelty against fixtures (one duplicate of the existing claim, one brand new)
    const noveltyPayload = {
      candidates: [
        {
          kind: "claim",
          scope: { collections: ["example"] },
          identity: { claim_key: "example|e2e-loop-runs" },
          claim: { statement: "The e2e loop runs.", atomic: true },
          assessment: { confidence: "high" },
        },
        {
          kind: "claim",
          scope: { collections: ["example"] },
          identity: { claim_key: "example|fresh-novel-fact" },
          claim: { statement: "A fresh and novel fact.", atomic: true },
          assessment: { confidence: "medium" },
        },
      ],
    };
    const noveltyRun = await runKnb(
      ["novelty", "--stdin", "--json"],
      JSON.stringify(noveltyPayload),
    );
    expect(noveltyRun.code).toBe(0);
    const noveltyEnv = parseSuccess<{ results: Array<{ classification: string; matched_ids: string[] }> }>(noveltyRun.stdout);
    expect(noveltyEnv.data.results.length).toBe(2);
    expect(noveltyEnv.data.results[0]?.classification).toBe("duplicate");
    expect(noveltyEnv.data.results[1]?.classification).toBe("new");

    // 8. apply --dedupe with a duplicate add
    const dedupePayload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["example"] },
            identity: { claim_key: "example|e2e-loop-runs" },
            claim: { statement: "The e2e loop runs.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: [createdSource?.id ?? ""],
              evidence: [{ source_id: createdSource?.id ?? "", role: "supports", summary: "Source backs the claim." }],
            },
            assessment: { confidence: "high" },
          },
        },
      ],
    };
    const dedupeRun = await runKnb(
      ["apply", "--stdin", "--atomic", "--dedupe", "--json"],
      JSON.stringify(dedupePayload),
    );
    expect(dedupeRun.code).toBe(0);
    const dedupeEnv = parseSuccess<{
      created: unknown[];
      skipped: Array<{ op: number; reason: string }>;
      meta: { rows_appended: number };
    }>(dedupeRun.stdout);
    expect(dedupeEnv.data.created.length).toBe(0);
    expect(dedupeEnv.data.skipped.length).toBe(1);
    expect(dedupeEnv.data.skipped[0]?.reason.startsWith("duplicate of ")).toBe(true);
    expect(dedupeEnv.data.meta.rows_appended).toBe(0);

    // 9. render the example collection
    const renderRun = await runKnb(["render", "--collection", "example", "--json"]);
    expect(renderRun.code).toBe(0);
    const renderEnv = parseSuccess<{ path: string; bytes_written: number }>(renderRun.stdout);
    expect(renderEnv.data.path.endsWith(join("knb", "views", "example.md"))).toBe(true);
    expect(renderEnv.data.bytes_written).toBeGreaterThan(0);
    expect(await pathExists(renderEnv.data.path)).toBe(true);

    // 10. index --rebuild
    const indexRun = await runKnb(["index", "--rebuild", "--json"]);
    expect(indexRun.code).toBe(0);
    const indexEnv = parseSuccess<{ indexes: Array<{ name: string; bytes_written: number }> }>(indexRun.stdout);
    expect(indexEnv.data.indexes.length).toBe(V1_INDEX_NAMES.length);
    const indexNames = indexEnv.data.indexes.map((entry) => entry.name).sort();
    expect(indexNames).toEqual([...V1_INDEX_NAMES].sort());

    // 11. check after rebuild - everything fresh
    const checkRunAfter = await runKnb(["check", "--json"]);
    expect(checkRunAfter.code).toBe(0);
    const checkEnvAfter = parseSuccess<{
      ok: boolean;
      projection_freshness: { entries: Array<{ kind: string; state: string }> };
    }>(checkRunAfter.stdout);
    expect(checkEnvAfter.data.ok).toBe(true);
    const allFresh = checkEnvAfter.data.projection_freshness.entries.every((entry) => entry.state === "fresh");
    expect(allFresh).toBe(true);

    // 11b. on-disk verification: V1 sidecars + view file
    const indexFiles = await readdir(join(workDir, "knb", "indexes"));
    const indexJsonFiles = indexFiles.filter((f) => f.endsWith(".json"));
    expect(indexJsonFiles.length).toBeGreaterThanOrEqual(V1_INDEX_NAMES.length);
    const viewFiles = await readdir(join(workDir, "knb", "views"));
    expect(viewFiles).toContain("example.md");

    // 12. status final - 3 rows on disk (dedupe skipped)
    const finalStatus = await runKnb(["status", "--json"]);
    expect(finalStatus.code).toBe(0);
    const finalStatusEnv = parseSuccess<{ row_count: number; active_counts_by_kind: Record<string, number> }>(finalStatus.stdout);
    expect(finalStatusEnv.data.row_count).toBe(3);
    expect(finalStatusEnv.data.active_counts_by_kind.source).toBe(1);
    expect(finalStatusEnv.data.active_counts_by_kind.claim).toBe(1);
    expect(finalStatusEnv.data.active_counts_by_kind.synthesis).toBe(1);

    // 13. idempotency: re-applying the same dedupe payload still skips and
    // re-rendering / re-rebuilding is a no-op for row count.
    const dedupeReplay = await runKnb(
      ["apply", "--stdin", "--atomic", "--dedupe", "--json"],
      JSON.stringify({
        operations: [
          {
            op: "add",
            row: {
              kind: "claim",
              scope: { collections: ["example"] },
              identity: { claim_key: "example|e2e-loop-runs" },
              claim: { statement: "The e2e loop runs.", atomic: true },
              time: { precision: "unknown" },
              provenance: {
                source_ids: [createdSource?.id ?? ""],
                evidence: [{ source_id: createdSource?.id ?? "", role: "supports", summary: "Backs the claim." }],
              },
              assessment: { confidence: "high" },
            },
          },
        ],
      }),
    );
    expect(dedupeReplay.code).toBe(0);
    const replayEnv = parseSuccess<{ created: unknown[]; skipped: unknown[]; meta: { rows_appended: number } }>(dedupeReplay.stdout);
    expect(replayEnv.data.created.length).toBe(0);
    expect(replayEnv.data.skipped.length).toBe(1);
    expect(replayEnv.data.meta.rows_appended).toBe(0);

    const finalStatus2 = await runKnb(["status", "--json"]);
    const final2Env = parseSuccess<{ row_count: number }>(finalStatus2.stdout);
    expect(final2Env.data.row_count).toBe(3);

    const indexRebuild2 = await runKnb(["index", "--rebuild", "--json"]);
    expect(indexRebuild2.code).toBe(0);
    const rebuild2Env = parseSuccess<{ indexes: Array<{ name: string }> }>(indexRebuild2.stdout);
    expect(rebuild2Env.data.indexes.length).toBe(V1_INDEX_NAMES.length);

    const checkAfterReplay = await runKnb(["check", "--json"]);
    const checkReplayEnv = parseSuccess<{ ok: boolean }>(checkAfterReplay.stdout);
    expect(checkReplayEnv.data.ok).toBe(true);
  });
});

describe("e2e: failure envelopes", () => {
  test("knb get nonexistent returns exit 1 not_found", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const getRun = await runKnb(["get", "claim:does:not:exist", "--json"]);
    expect(getRun.code).toBe(1);
    expect(getRun.stdout).toBe("");
    const env = parseFailure(getRun.stderr);
    expect(env.error.code).toBe("not_found");
    expect(env.meta.exit_code).toBe(1);
    expect(env.command).toBe("get");
  });

  test("unknown command returns exit 2 invalid_arguments", async () => {
    const run = await runKnb(["totally-unknown", "--json"]);
    expect(run.code).toBe(2);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.meta.exit_code).toBe(2);
    expect(env.command).toBe("totally-unknown");
  });

  test("apply with a row missing required fields returns exit 3 validation_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      operations: [
        {
          op: "add",
          row: { kind: "claim" },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(3);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("validation_failed");
    expect(env.meta.exit_code).toBe(3);
  });

  test("apply with two adds using the same explicit id returns exit 4 duplicate_blocked", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const explicitId = "src:dup:20260501:0000beef";
    const sourceRow = {
      kind: "source",
      id: explicitId,
      scope: { collections: ["dup"] },
      source: { type: "web_page", title: "Dup A", uri: "https://example.com/a" },
      provenance: { acquisition: { method: "manual" } },
    };
    const sourceRowB = {
      kind: "source",
      id: explicitId,
      scope: { collections: ["dup"] },
      source: { type: "web_page", title: "Dup B", uri: "https://example.com/b" },
      provenance: { acquisition: { method: "manual" } },
    };
    const payload = {
      operations: [
        { op: "add", row: sourceRow },
        { op: "add", row: sourceRowB },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(4);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("duplicate_blocked");
    expect(env.meta.exit_code).toBe(4);
  });

  test("pre-existing lock file causes exit 6 lock_busy on apply", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    await writeFile(join(workDir, ".knb", "ledger.lock"), "", "utf8");

    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["lock"] },
            source: { type: "web_page", title: "Locked", uri: "https://example.com/locked" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(6);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("lock_busy");
    expect(env.meta.exit_code).toBe(6);
  });

  test("apply with a claim referencing a nonexistent source id returns exit 7 broken_reference", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      operations: [
        {
          op: "add",
          row: {
            kind: "claim",
            scope: { collections: ["broken"] },
            identity: { claim_key: "broken|orphan" },
            claim: { statement: "Orphan claim references a missing source.", atomic: true },
            time: { precision: "unknown" },
            provenance: {
              source_ids: ["src:does:not:exist:deadbeef"],
              evidence: [
                {
                  source_id: "src:does:not:exist:deadbeef",
                  role: "supports",
                  summary: "Phantom evidence",
                },
              ],
            },
            assessment: { confidence: "low" },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(7);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("broken_reference");
    expect(env.meta.exit_code).toBe(7);
  });

  test("apply request with atomic: false in payload returns exit 9 unsafe_operation_refused", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const payload = {
      atomic: false,
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["unsafe"] },
            source: { type: "web_page", title: "Unsafe", uri: "https://example.com/unsafe" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    };
    const run = await runKnb(["apply", "--stdin", "--json"], JSON.stringify(payload));
    expect(run.code).toBe(9);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("unsafe_operation_refused");
    expect(env.meta.exit_code).toBe(9);
  });

  test("apply --file with nonexistent path returns exit 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb([
      "apply",
      "--file",
      join(workDir, "no-such.json"),
      "--atomic",
      "--json",
    ]);
    expect(run.code).toBe(5);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("io_failed");
    expect(env.meta.exit_code).toBe(5);
    expect(env.command).toBe("apply");
  });

  test("query against a corrupted (unparseable) ledger returns exit 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    await writeFile(join(workDir, "knb", "ledger.jsonl"), "this is not valid jsonl{{\n", "utf8");

    const run = await runKnb(["query", "--collection", "foo", "--json"]);
    expect(run.code).toBe(5);
    expect(run.stdout).toBe("");
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("io_failed");
    expect(env.meta.exit_code).toBe(5);
    expect(env.command).toBe("query");
    const details = env.error.details as { parse_issues?: unknown[] };
    expect(Array.isArray(details?.parse_issues)).toBe(true);
    expect((details.parse_issues ?? []).length).toBeGreaterThan(0);
  });

  test("apply against unwriteable ledger directory exits 5 io_failed", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    if (process.getuid && process.getuid() === 0) return;

    const lockedDir = join(workDir, "locked");
    await mkdir(lockedDir, { recursive: true });
    await chmod(lockedDir, 0o500);
    try {
      const lockedLedger = join(lockedDir, "ledger.jsonl");
      const payload = {
        operations: [
          {
            op: "add",
            row: {
              kind: "source",
              scope: { collections: ["io"] },
              source: { type: "web_page", title: "IO", uri: "https://example.com/io" },
              provenance: { acquisition: { method: "manual" } },
            },
          },
        ],
      };
      const run = await runKnb(
        ["apply", "--stdin", "--atomic", "--ledger", lockedLedger, "--json"],
        JSON.stringify(payload),
      );
      expect(run.code).toBe(5);
      const env = parseFailure(run.stderr);
      expect(env.error.code).toBe("io_failed");
      expect(env.meta.exit_code).toBe(5);
    } finally {
      await chmod(lockedDir, 0o700);
    }
  });

  test("apply --json with malformed inline JSON returns exit 2 invalid_arguments", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb(["apply", "--json", "{not-json", "--atomic", "--pretty"]);
    expect(run.code).toBe(2);
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.meta.exit_code).toBe(2);
  });

  test("apply --stdin with empty stdin returns exit 2 invalid_arguments", async () => {
    const init = await runKnb(["init", "--json"]);
    expect(init.code).toBe(0);

    const run = await runKnb(["apply", "--stdin", "--atomic", "--json"], "");
    expect(run.code).toBe(2);
    const env = parseFailure(run.stderr);
    expect(env.error.code).toBe("invalid_arguments");
    expect(env.error.message.toLowerCase()).toContain("stdin");
  });

  // Code 8 (external_dependency_failed) is not reachable via the CLI in V1
  // because no command depends on a network/IPC peer. The error code exists in
  // the vocabulary for future commands that shell out (e.g. embeddings, sync).
  // No producer path triggers it today; this test pins the absence.
  test("no V1 CLI path produces external_dependency_failed (code 8)", async () => {
    const helpRun = await runKnb(["help"]);
    expect(helpRun.code).toBe(0);
    expect(helpRun.stdout).toContain("external_dependency_failed");
    expect(helpRun.stdout).toContain("8");
  });

  // Code 10 (internal_error) wraps anything thrown that is not already a
  // KnbError. The CLI's two intentional sources of unexpected failure are
  // out of reach from a clean env (we cannot easily corrupt internal state
  // from a subprocess). This test pins the contract: if such an error were to
  // bubble, it would be wrapped via fromUnknown into code 10.
  test("internal_error code (10) is documented in help and mapped to exit 10", async () => {
    const helpRun = await runKnb(["help"]);
    expect(helpRun.code).toBe(0);
    expect(helpRun.stdout).toContain("internal_error");
    expect(helpRun.stdout).toContain("10 internal_error");
  });
});

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/_helpers.ts
```ts
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

export type SourceFile = {
  path: string;
  text: string;
  stripped: string;
  strippedComments: string;
};

export type Match = {
  line: number;
  column: number;
  match: string;
};

const REPO_ROOT = resolve(import.meta.dir, "..", "..");

export function repoPath(rel: string): string {
  return resolve(REPO_ROOT, rel);
}

export async function readSourceFiles(relPaths: string[]): Promise<SourceFile[]> {
  const out: SourceFile[] = [];
  for (const rel of relPaths) {
    const path = repoPath(rel);
    const text = await readFile(path, "utf8");
    out.push({
      path,
      text,
      stripped: stripCommentsAndStrings(text),
      strippedComments: stripComments(text),
    });
  }
  return out;
}

export function stripComments(text: string): string {
  const out: string[] = [];
  const len = text.length;
  let i = 0;
  let mode: "code" | "line-comment" | "block-comment" | "single" | "double" | "template" = "code";

  const pushNonNewline = (ch: string) => {
    out.push(ch === "\n" ? "\n" : " ");
  };

  while (i < len) {
    const ch = text[i] as string;
    const next: string | undefined = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
        out.push("'");
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = "double";
        out.push('"');
        i += 1;
        continue;
      }
      if (ch === "`") {
        mode = "template";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        mode = "code";
        out.push("\n");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        mode = "code";
        out.push("  ");
        i += 2;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "single") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "code";
        out.push("'");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "double") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === '"') {
        mode = "code";
        out.push('"');
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "template") {
      if (ch === "\\" && next !== undefined) {
        out.push(ch);
        out.push(next as string);
        i += 2;
        continue;
      }
      if (ch === "`") {
        mode = "code";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }
  }

  return out.join("");
}

export function stripCommentsAndStrings(text: string): string {
  const out: string[] = [];
  const len = text.length;
  let i = 0;
  let mode: "code" | "line-comment" | "block-comment" | "single" | "double" | "template" = "code";

  const pushNonNewline = (ch: string) => {
    out.push(ch === "\n" ? "\n" : " ");
  };

  while (i < len) {
    const ch = text[i] as string;
    const next: string | undefined = text[i + 1];

    if (mode === "code") {
      if (ch === "/" && next === "/") {
        mode = "line-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "/" && next === "*") {
        mode = "block-comment";
        out.push("  ");
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "single";
        out.push("'");
        i += 1;
        continue;
      }
      if (ch === '"') {
        mode = "double";
        out.push('"');
        i += 1;
        continue;
      }
      if (ch === "`") {
        mode = "template";
        out.push("`");
        i += 1;
        continue;
      }
      out.push(ch);
      i += 1;
      continue;
    }

    if (mode === "line-comment") {
      if (ch === "\n") {
        mode = "code";
        out.push("\n");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "block-comment") {
      if (ch === "*" && next === "/") {
        mode = "code";
        out.push("  ");
        i += 2;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "single") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === "'") {
        mode = "code";
        out.push("'");
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "double") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === '"') {
        mode = "code";
        out.push('"');
        i += 1;
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }

    if (mode === "template") {
      if (ch === "\\" && next !== undefined) {
        pushNonNewline(ch);
        pushNonNewline(next);
        i += 2;
        continue;
      }
      if (ch === "`") {
        mode = "code";
        out.push("`");
        i += 1;
        continue;
      }
      if (ch === "$" && next === "{") {
        out.push("${");
        i += 2;
        let depth = 1;
        while (i < len && depth > 0) {
          const c = text[i] as string;
          if (c === "{") depth += 1;
          else if (c === "}") depth -= 1;
          if (depth === 0) {
            out.push("}");
            i += 1;
            break;
          }
          out.push(c);
          i += 1;
        }
        continue;
      }
      pushNonNewline(ch);
      i += 1;
      continue;
    }
  }

  return out.join("");
}

export function findMatches(stripped: string, pattern: RegExp): Match[] {
  if (!pattern.global) {
    throw new Error("findMatches requires a global RegExp");
  }
  const matches: Match[] = [];
  pattern.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = pattern.exec(stripped)) !== null) {
    const upto = stripped.slice(0, m.index);
    const lastNewline = upto.lastIndexOf("\n");
    const line = upto.split("\n").length;
    const column = lastNewline === -1 ? m.index + 1 : m.index - lastNewline;
    matches.push({ line, column, match: m[0] });
    if (m.index === pattern.lastIndex) pattern.lastIndex += 1;
  }
  return matches;
}

export function describeViolations(
  file: SourceFile,
  patternLabel: string,
  matches: Match[],
): string {
  const lines = matches.map((m) => `  ${file.path}:${m.line}:${m.column} -> ${m.match.trim()}`);
  return `Forbidden pattern "${patternLabel}" found in ${file.path}:\n${lines.join("\n")}`;
}

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/facade.test.ts
```ts
import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { isAbsolute, join } from "node:path";

import { openKnb } from "../src/index";
import * as publicApi from "../src/index";
import * as knbModule from "../src/core/knb";
import {
  jsonSchema,
  rowSamples,
  operationSamples,
  type ApplyOperation,
  type ChangeRow,
  type ClaimRow,
  type QuestionRow,
  type SourceRow,
  type SynthesisRow,
} from "../src/core/contract";
import { isKnbError } from "../src/core/errors";
import { openWorkspace } from "../src/core/workspace";
import { defaultProjectState, readSnapshot } from "../src/core/read-snapshot";
import { V1_INDEX_NAMES } from "../src/core/projections";
import type { RunManifest } from "../src/core/run-manifests";

let workDir: string;

beforeEach(async () => {
  workDir = await mkdtemp(join(tmpdir(), "knb-facade-"));
});

afterEach(async () => {
  await rm(workDir, { recursive: true, force: true });
});

function makeOpenOptions(): { root: string; env: NodeJS.ProcessEnv; cwd: () => string } {
  return { root: workDir, env: {}, cwd: () => workDir };
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function seedLedger(text: string): Promise<string> {
  const path = join(workDir, "knb", "ledger.jsonl");
  await mkdir(join(workDir, "knb"), { recursive: true });
  await writeFile(path, text, "utf8");
  return path;
}

function jsonl(rows: object[]): string {
  return `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`;
}

async function seedRunManifests(manifests: RunManifest[]): Promise<void> {
  const runsDir = join(workDir, ".knb", "runs");
  await mkdir(runsDir, { recursive: true });
  for (const manifest of manifests) {
    await writeFile(join(runsDir, `${manifest.run_id}.json`), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  }
}

function manifest(
  run_id: string,
  actor: string,
  completed_at: string,
  row_ids: string[],
  intent?: string,
): RunManifest {
  const result: RunManifest = {
    schema_version: "knb.run.v1",
    run_id,
    actor,
    started_at: completed_at,
    completed_at,
    rows_appended: row_ids.length,
    row_ids,
  };
  if (intent !== undefined) result.intent = intent;
  return result;
}

function freshSourceRow(id = "src:facade:20260501:aaaa1111"): SourceRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "source",
    created_at: "2026-05-01T12:00:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    source: {
      type: "web_page",
      title: "Facade source",
      uri: `https://example.com/${id}`,
    },
    provenance: { acquisition: { method: "manual", observed_at: "2026-05-01T12:00:00Z" } },
  };
}

function freshClaimRow(sourceId: string, id = "claim:facade:20260501:bbbb2222"): ClaimRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "claim",
    created_at: "2026-05-01T12:01:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    identity: { claim_key: "facade|exists" },
    claim: { statement: "Facade exists.", atomic: true },
    time: { precision: "unknown" },
    provenance: {
      source_ids: [sourceId],
      evidence: [{ source_id: sourceId, role: "supports", summary: "Source supports the claim." }],
    },
    assessment: { confidence: "high" },
  };
}

function freshRetractChange(targetId: string, id = "chg:facade:20260501:cccc3333"): ChangeRow {
  return {
    schema_version: "knb.v1",
    id,
    kind: "change",
    created_at: "2026-05-01T12:02:00Z",
    created_by: "agent:test",
    scope: { collections: ["facade"] },
    change: {
      action: "retract",
      target_ids: [targetId],
      reason: "test retract",
    },
  };
}

describe("openKnb", () => {
  test("returns a Knb facade with workspace pointed at root and a runtime", async () => {
    const knb = await openKnb(makeOpenOptions());
    expect(knb.workspace.root).toBe(workDir);
    expect(typeof knb.runtime.clock).toBe("function");
    expect(typeof knb.runtime.randomIdPart).toBe("function");
    const date = knb.runtime.clock();
    expect(date instanceof Date).toBe(true);
    const part = knb.runtime.randomIdPart(4);
    expect(typeof part).toBe("string");
    expect(part.length).toBeGreaterThan(0);
  });

  test("facade exposes every documented method as a function", async () => {
    const knb = await openKnb(makeOpenOptions());
    const expected = [
      "init",
      "status",
      "collectionStatus",
      "collections",
      "schema",
      "log",
      "apply",
      "previewApply",
      "add",
      "get",
      "query",
      "context",
      "novelty",
      "render",
      "renderAll",
      "check",
      "rebuildIndex",
    ] as const;
    for (const name of expected) {
      expect(typeof knb[name]).toBe("function");
    }
    expect(knb.workspace).toBeDefined();
    expect(knb.runtime).toBeDefined();
  });

  test("default runtime is provided when none injected and matches defaultRuntime()", async () => {
    const knb = await openKnb(makeOpenOptions());
    const baseline = knbModule.defaultRuntime();
    expect(typeof baseline.clock).toBe("function");
    expect(typeof baseline.randomIdPart).toBe("function");
    expect(typeof knb.runtime.clock()).toBe("object");
    expect(knb.runtime.clock() instanceof Date).toBe(true);
    const part = knb.runtime.randomIdPart(4);
    expect(part).toMatch(/^[0-9a-f]+$/);
    expect(part.length).toBeLessThanOrEqual(8);
  });

  test("accepts actor override", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    expect(knb.workspace.actor).toBe("agent:test");
  });

  test("actor resolution: KNB_ACTOR env beats git/system fallback", async () => {
    const knb = await openKnb({
      root: workDir,
      env: { KNB_ACTOR: "agent:from-env" },
      cwd: () => workDir,
    });
    expect(knb.workspace.actor).toBe("agent:from-env");
  });

  test("actor resolution: explicit option beats KNB_ACTOR env", async () => {
    const knb = await openKnb({
      root: workDir,
      actor: "agent:explicit",
      env: { KNB_ACTOR: "agent:from-env" },
      cwd: () => workDir,
    });
    expect(knb.workspace.actor).toBe("agent:explicit");
  });

  test("runtime clock and randomIdPart can be injected", async () => {
    const fixedDate = new Date("2026-05-01T00:00:00Z");
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: {
        clock: () => fixedDate,
        randomIdPart: () => "deadbeef",
      },
    });
    expect(knb.runtime.clock()).toBe(fixedDate);
    expect(knb.runtime.randomIdPart(4)).toBe("deadbeef");
  });

  test("partial runtime override still uses default for the other slot", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: { randomIdPart: () => "stable99" },
    });
    expect(knb.runtime.randomIdPart(4)).toBe("stable99");
    expect(knb.runtime.clock() instanceof Date).toBe(true);
  });

  test("injected clock flows through apply() to the created row's created_at", async () => {
    const fixedDate = new Date("2026-04-01T08:09:10.000Z");
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:clock-test",
      runtime: {
        clock: () => fixedDate,
        randomIdPart: () => "abcd1234",
      },
    });
    const result = await knb.add({
      kind: "source",
      scope: { collections: ["clocktest"] },
      source: { type: "web_page", title: "X", uri: "https://example.com/x" },
      provenance: { acquisition: { method: "manual" } },
    });
    expect(result.created.length).toBe(1);
    const id = result.created[0]?.id ?? "";
    expect(id.endsWith(":abcd1234")).toBe(true);
    expect(id.startsWith("src:clocktest:20260401:")).toBe(true);
    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    const row = JSON.parse(ledgerText.trim()) as { created_at: string; created_by: string };
    expect(row.created_at).toBe(fixedDate.toISOString());
    expect(row.created_by).toBe("agent:clock-test");
  });

  test("previewApply reports planned rows without mutating the ledger", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      runtime: {
        clock: () => new Date("2026-04-01T08:09:10.000Z"),
        randomIdPart: () => "feed0001",
      },
    });

    const result = await knb.previewApply({
      operations: [
        {
          op: "add",
          row: {
            kind: "source",
            scope: { collections: ["preview"] },
            source: { type: "web_page", title: "Preview", uri: "https://example.com/preview" },
            provenance: { acquisition: { method: "manual" } },
          },
        },
      ],
    });

    expect(result.created.length).toBe(1);
    expect(result.meta.dry_run).toBe(true);
    expect(result.meta.planned_rows).toBe(1);
    expect(result.meta.rows_appended).toBe(0);
    const status = await knb.status();
    expect(status.row_count).toBe(0);
  });

  test("ledgerPath override is reflected in workspace.paths.ledger", async () => {
    const customLedger = join(workDir, "custom-ledger.jsonl");
    const knb = await openKnb({ ...makeOpenOptions(), ledgerPath: customLedger });
    expect(knb.workspace.paths.ledger).toBe(customLedger);
  });

  test("configPath override is reflected in workspace.configPath", async () => {
    const customConfigDir = join(workDir, "alt");
    await mkdir(customConfigDir, { recursive: true });
    const customConfigPath = join(customConfigDir, "knb-config.json");
    await writeFile(customConfigPath, JSON.stringify({ actor: "agent:from-cfg" }), "utf8");
    const knb = await openKnb({
      root: workDir,
      env: {},
      cwd: () => workDir,
      configPath: customConfigPath,
    });
    expect(knb.workspace.configPath).toBe(customConfigPath);
    expect(knb.workspace.actor).toBe("agent:from-cfg");
  });

  test("openKnb with no options falls back to cwd as root", async () => {
    const cwdProvider = () => workDir;
    // We can't change real process.cwd, but we can pass an empty options object
    // and rely on env/cwd defaults. Provide cwd to keep test hermetic.
    const knb = await openKnb({ env: {}, cwd: cwdProvider });
    expect(knb.workspace.root).toBe(workDir);
  });
});

describe("Knb.init", () => {
  test("creates config, ledger, schema, views and indexes on an empty tmp", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    const result = await knb.init();
    expect(result.workspace_root).toBe(workDir);
    expect(result.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(result.config_path).toBe(join(workDir, ".knb", "config.json"));
    expect(result.schema_path).toBe(join(workDir, "knb", "schema.json"));
    expect(await pathExists(join(workDir, ".knb", "config.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "ledger.jsonl"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "schema.json"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "views"))).toBe(true);
    expect(await pathExists(join(workDir, "knb", "indexes"))).toBe(true);

    const schemaText = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    expect(schemaText).toBe(`${JSON.stringify(jsonSchema(), null, 2)}\n`);

    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe("{}\n");

    expect(result.created_paths).toContain(join(".knb", "config.json"));
    expect(result.created_paths).toContain(join("knb", "ledger.jsonl"));
    expect(result.created_paths).toContain(join("knb", "schema.json"));
    expect(result.created_paths).toContain(join("knb", "views"));
    expect(result.created_paths).toContain(join("knb", "indexes"));
  });

  test("init with explicit actor persists actor into config.json", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:claude-research" });
    await knb.init({ actor: "agent:claude-research" });
    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    const parsed = JSON.parse(configText) as { actor?: string };
    expect(parsed.actor).toBe("agent:claude-research");

    const reopened = await openKnb({ root: workDir, env: {}, cwd: () => workDir });
    expect(reopened.workspace.actor).toBe("agent:claude-research");
  });

  test("after init: status returns row_count 0 and clean error counts", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    await knb.init();
    const status = await knb.status();
    expect(status.row_count).toBe(0);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.validation_warning_count).toBe(0);
    expect(status.state_warning_count).toBe(0);
  });

  test("after init: schema() result matches schema written to disk", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const schemaResult = await knb.schema();
    const onDisk = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    const parsed = JSON.parse(onDisk);
    expect(schemaResult.json_schema).toEqual(parsed);
  });

  test("init without force leaves existing config untouched", async () => {
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(join(workDir, ".knb", "config.json"), JSON.stringify({ actor: "agent:preset" }), "utf8");
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.init();
    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe(JSON.stringify({ actor: "agent:preset" }));
    expect(result.created_paths).not.toContain(join(".knb", "config.json"));
  });

  test("init without force preserves a non-empty ledger", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledgerText).toBe(jsonl([source]));
  });

  test("init is idempotent (second call without force is a no-op for created_paths apart from schema)", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const second = await knb.init();
    // Schema is generated and always rewritten by spec; ledger and config are preserved.
    expect(second.created_paths).not.toContain(join(".knb", "config.json"));
    expect(second.created_paths).not.toContain(join("knb", "ledger.jsonl"));
    expect(second.created_paths).not.toContain(join("knb", "views"));
    expect(second.created_paths).not.toContain(join("knb", "indexes"));
    expect(second.created_paths).toContain(join("knb", "schema.json"));
  });

  test("init with force overwrites schema and config, but leaves a non-empty ledger alone", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));
    await mkdir(join(workDir, "knb"), { recursive: true });
    await writeFile(join(workDir, "knb", "schema.json"), "STALE", "utf8");
    await mkdir(join(workDir, ".knb"), { recursive: true });
    await writeFile(join(workDir, ".knb", "config.json"), JSON.stringify({ actor: "old" }), "utf8");

    const knb = await openKnb(makeOpenOptions());
    await knb.init({ force: true });

    const schemaText = await readFile(join(workDir, "knb", "schema.json"), "utf8");
    expect(schemaText).toBe(`${JSON.stringify(jsonSchema(), null, 2)}\n`);

    const configText = await readFile(join(workDir, ".knb", "config.json"), "utf8");
    expect(configText).toBe("{}\n");

    const ledgerText = await readFile(join(workDir, "knb", "ledger.jsonl"), "utf8");
    expect(ledgerText).toBe(jsonl([source, claim]));
  });
});

describe("Knb.status", () => {
  test("empty workspace returns row_count 0 and clean counts", async () => {
    const knb = await openKnb({ ...makeOpenOptions(), actor: "agent:test" });
    const status = await knb.status();
    expect(status.workspace_root).toBe(workDir);
    expect(status.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(status.schema_version).toBe("knb.v1");
    expect(status.actor).toBe("agent:test");
    expect(status.row_count).toBe(0);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.validation_warning_count).toBe(0);
    expect(status.state_warning_count).toBe(0);
    expect(status.active_counts_by_kind).toEqual({});
    expect(status.inactive_counts_by_status).toEqual({});
    expect(isAbsolute(status.workspace_root)).toBe(true);
    expect(isAbsolute(status.ledger_path)).toBe(true);
    // No projections rendered/built yet — V1 indexes report as missing.
    const missingIndexes = status.projection_freshness.entries.filter(
      (entry) => entry.kind === "index" && entry.state === "missing",
    );
    expect(missingIndexes.length).toBe(V1_INDEX_NAMES.length);
  });

  test("valid ledger reports correct row_count and active_counts_by_kind", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));

    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.row_count).toBe(2);
    expect(status.parse_error_count).toBe(0);
    expect(status.validation_error_count).toBe(0);
    expect(status.active_counts_by_kind).toEqual({ source: 1, claim: 1 });
  });

  test("ledger with parse error reports parse_error_count >= 1", async () => {
    await seedLedger(`${JSON.stringify(freshSourceRow())}\n{not json\n`);
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.parse_error_count).toBeGreaterThanOrEqual(1);
    expect(status.row_count).toBe(1);
  });

  test("ledger with validation error reports validation_error_count >= 1", async () => {
    // Claim referencing a missing source id => broken_reference error.
    const claim = freshClaimRow("src:missing:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.validation_error_count).toBeGreaterThanOrEqual(1);
  });

  test("after retract change, inactive_counts_by_status.retracted is 1", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    const retract = freshRetractChange(claim.id);
    await seedLedger(jsonl([source, claim, retract]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.inactive_counts_by_status.retracted).toBe(1);
    // Active claim count should now be 0 (only source remains active).
    expect(status.active_counts_by_kind.claim ?? 0).toBe(0);
    expect(status.active_counts_by_kind.source).toBe(1);
  });

  test("retracting an already-retracted target produces a state warning", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    const retract1 = freshRetractChange(claim.id, "chg:facade:20260501:cccc3333");
    const retract2 = freshRetractChange(claim.id, "chg:facade:20260501:cccc4444");
    retract2.created_at = "2026-05-01T12:03:00Z";
    await seedLedger(jsonl([source, claim, retract1, retract2]));
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status();
    expect(status.state_warning_count).toBeGreaterThanOrEqual(1);
  });

  test("status.actor reflects KNB_ACTOR when no explicit actor is set", async () => {
    const knb = await openKnb({
      root: workDir,
      env: { KNB_ACTOR: "agent:env-actor" },
      cwd: () => workDir,
    });
    const status = await knb.status();
    expect(status.actor).toBe("agent:env-actor");
  });

  test("apply then immediate status reflects the appended row", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:test",
      runtime: { clock: () => new Date("2026-05-01T12:00:00Z"), randomIdPart: () => "11112222" },
    });
    const before = await knb.status();
    expect(before.row_count).toBe(0);
    await knb.add({
      kind: "source",
      scope: { collections: ["after"] },
      source: { type: "web_page", title: "x", uri: "https://example.com/after" },
      provenance: { acquisition: { method: "manual" } },
    });
    const after = await knb.status();
    expect(after.row_count).toBe(1);
    expect(after.active_counts_by_kind.source).toBe(1);
  });

  test("the same Knb instance picks up rows appended externally between calls", async () => {
    const knb = await openKnb(makeOpenOptions());
    expect((await knb.status()).row_count).toBe(0);
    await seedLedger(jsonl([freshSourceRow()]));
    expect((await knb.status()).row_count).toBe(1);
  });

  test("default status does not include detailed stats", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const knb = await openKnb(makeOpenOptions());
    const baseline = await knb.status();
    const explicitDefault = await knb.status({ detailed: false });
    expect(explicitDefault).toEqual(baseline);
    expect("detailed" in baseline).toBe(false);
  });

  test("detailed status returns empty corpus-health stats on an empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status({ detailed: true });
    expect(status.detailed).toEqual({
      duplicate_source_uri_clusters: [],
      duplicate_claim_key_clusters: [],
      evidence_depth: { count: 0, p50: 0, p90: 0, max: 0 },
      novelty_active_distribution: {},
      syntheses_per_collection: {},
    });
  });

  test("detailed status computes mixed dup-heavy stats from EffectiveState and ignores stale indexes", async () => {
    const sourceA = freshSourceRow("src:detail:20260501:sourcea1");
    sourceA.scope = { collections: ["alpha"] };
    sourceA.source.uri = "https://example.com/shared-source";
    const sourceB = freshSourceRow("src:detail:20260501:sourceb2");
    sourceB.scope = { collections: ["beta"] };
    sourceB.source.uri = "https://example.com/shared-source";
    const sourceC = freshSourceRow("src:detail:20260501:sourcec3");
    sourceC.scope = { collections: ["beta"] };
    sourceC.source.uri = "https://example.com/unique-source";

    const claimA = freshClaimRow(sourceA.id, "claim:detail:20260501:claimaaa");
    claimA.scope = { collections: ["alpha"] };
    claimA.identity = { claim_key: "detail|shared", novelty: "duplicate" };
    claimA.provenance = {
      evidence: [{ source_id: sourceA.id, role: "supports", summary: "A" }],
    };
    const claimB = freshClaimRow(sourceA.id, "claim:detail:20260501:claimbbb");
    claimB.scope = { collections: ["alpha", "beta"] };
    claimB.identity = { claim_key: "detail|shared", novelty: "duplicate" };
    claimB.provenance = {
      source_ids: [sourceA.id, sourceB.id],
      evidence: [
        { source_id: sourceA.id, role: "supports", summary: "A" },
        { source_id: sourceB.id, role: "supports", summary: "B" },
      ],
    };
    const claimC = freshClaimRow(sourceC.id, "claim:detail:20260501:claimccc");
    claimC.scope = { collections: ["beta"] };
    claimC.identity = { claim_key: "detail|unique", novelty: "correction" };
    claimC.provenance = {
      evidence: [{ source_id: sourceC.id, role: "supports", summary: "C" }],
    };

    const synthesisA: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:detail:20260501:syntha11",
      kind: "synthesis",
      created_at: "2026-05-01T15:00:00.000Z",
      created_by: "agent:test",
      scope: { collections: ["alpha"] },
      synthesis: { title: "Alpha", summary: "Alpha summary", basis: { claim_ids: [claimA.id] }, status: "active" },
    };
    const synthesisB: SynthesisRow = {
      ...synthesisA,
      id: "synth:detail:20260501:synthb22",
      scope: { collections: ["beta"] },
      synthesis: { title: "Beta", summary: "Beta summary", basis: { claim_ids: [claimB.id] }, status: "active" },
    };
    const archivedSynthesis: SynthesisRow = {
      ...synthesisA,
      id: "synth:detail:20260501:synthold",
      scope: { collections: ["alpha"] },
      synthesis: { title: "Archived", summary: "Old", basis: { claim_ids: [claimA.id] }, status: "archived" },
    };

    await seedLedger(jsonl([
      sourceA,
      sourceB,
      sourceC,
      claimA,
      claimB,
      claimC,
      synthesisA,
      synthesisB,
      archivedSynthesis,
    ]));
    await mkdir(join(workDir, "knb", "indexes"), { recursive: true });
    await writeFile(join(workDir, "knb", "indexes", "active-by-id.json"), JSON.stringify({ stale: true }), "utf8");

    const knb = await openKnb(makeOpenOptions());
    const status = await knb.status({ detailed: true });

    expect(status.detailed?.duplicate_source_uri_clusters).toEqual([
      {
        uri: "https://example.com/shared-source",
        count: 2,
        source_ids: [sourceA.id, sourceB.id],
      },
    ]);
    expect(status.detailed?.duplicate_claim_key_clusters).toEqual([
      {
        claim_key: "detail|shared",
        count: 2,
        claim_ids: [claimA.id, claimB.id],
      },
    ]);
    expect(status.detailed?.evidence_depth).toEqual({ count: 3, p50: 1, p90: 2, max: 2 });
    expect(status.detailed?.novelty_active_distribution).toEqual({ correction: 1, duplicate: 2 });
    expect(status.detailed?.syntheses_per_collection).toEqual({ alpha: 1, beta: 1 });
  });
});

describe("Knb.schema", () => {
  test("returns schema, samples, and operation samples", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    expect(result.schema_version).toBe("knb.v1");
    expect(result.json_schema).toEqual(jsonSchema());
    expect(result.row_samples.length).toBe(5);
    expect(result.operation_samples.length).toBe(6);
    const samples = rowSamples();
    expect(result.row_samples[0]).toEqual(samples.source);
  });

  test("exposes selector and profile contracts with generic samples", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();

    expect(result.json_schema).toEqual(jsonSchema());
    expect(result.selector_schema).toMatchObject({
      schema_version: "knb.selector.v1",
      type: "object",
    });
    expect(result.profile_schema).toMatchObject({
      schema_version: "knb.profile.v1",
      type: "object",
    });
    expect(result.profile_samples[0]).toMatchObject({
      profile_version: "knb.profile.v1",
      select: { kinds: ["claim"] },
    });
    expect(JSON.stringify(result.profile_samples)).toContain("measurement");
    expect(JSON.stringify(result.profile_samples)).not.toContain("weather");
    expect(JSON.stringify(result.selector_samples)).not.toContain("weather");
  });

  test("json_schema has the expected top-level keys ($schema, $id, type, allOf, $defs)", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const schema = result.json_schema as Record<string, unknown>;
    expect(typeof schema.$schema).toBe("string");
    expect(schema.$id).toBe("knb.v1");
    expect(schema.type).toBe("object");
    expect(Array.isArray(schema.allOf)).toBe(true);
    expect(typeof schema.$defs).toBe("object");
    expect(Array.isArray(schema.required)).toBe(true);
  });

  test("row_samples contains exactly one of each kind", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const kinds = result.row_samples.map((row) => row.kind).sort();
    expect(kinds).toEqual(["change", "claim", "question", "source", "synthesis"]);
  });

  test("operation_samples covers all 6 operation kinds", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.schema();
    const ops = result.operation_samples.map((op) => op.op).sort();
    expect(ops).toEqual(["add", "merge", "patch", "relate", "retract", "supersede"]);
    const samples = operationSamples();
    expect(result.operation_samples).toEqual([
      samples.add,
      samples.retract,
      samples.supersede,
      samples.merge,
      samples.relate,
      samples.patch,
    ]);
  });
});

describe("Knb facade methods on empty workspace", () => {
  test("apply with zero operations returns empty result with proper shape", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.apply({ operations: [] });
    expect(result.created).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.novelty).toEqual([]);
    expect(result.meta.rows_appended).toBe(0);
    expect(result.meta.bytes_written).toBe(0);
    expect(result.meta.ledger_path).toBe(join(workDir, "knb", "ledger.jsonl"));
    expect(result.meta.fingerprint_after).toBeDefined();
  });

  test("query and context return empty shapes on empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const queryResult = await knb.query({});
    expect(queryResult.rows).toEqual([]);
    expect(queryResult.total_matched).toBe(0);
    expect(queryResult.total_returned).toBe(0);
    const contextResult = await knb.context({});
    expect(contextResult.key_claims).toEqual([]);
    expect(contextResult.syntheses).toEqual([]);
    expect(contextResult.open_questions).toEqual([]);
    expect(contextResult.sources).toEqual([]);
    expect(typeof contextResult.token_estimate).toBe("number");
    expect(contextResult.meta.counts.claims).toBe(0);
  });

  test("log returns an empty result when .knb/runs is missing", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({});
    expect(result.entries).toEqual([]);
    expect(result.total_matched).toBe(0);
    expect(result.total_returned).toBe(0);
  });

  test("collections returns empty list on an empty workspace", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.collections();
    expect(result).toEqual({ collections: [] });
  });

  test("get with an unknown id throws KnbError with code not_found", async () => {
    const knb = await openKnb(makeOpenOptions());
    let caught: unknown;
    try {
      await knb.get(["never-here"]);
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("not_found");
  });

  test("get of all-missing ids reports them and throws not_found", async () => {
    const knb = await openKnb(makeOpenOptions());
    let caught: unknown;
    try {
      await knb.get(["a", "b", "c"]);
    } catch (error) {
      caught = error;
    }
    expect(isKnbError(caught)).toBe(true);
    expect((caught as { code: string }).code).toBe("not_found");
    const details = (caught as { details?: { ids?: string[] } }).details;
    expect(details?.ids).toEqual(["a", "b", "c"]);
  });

  test("novelty on empty candidates returns empty results", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.novelty({ candidates: [] });
    expect(result.results).toEqual([]);
  });

  test("collectionStatus returns latest active synthesis and priority-sorted open questions", async () => {
    const source = freshSourceRow();
    const oldSynthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:facade:20260501:aaaa1111",
      kind: "synthesis",
      created_at: "2026-05-01T12:00:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      synthesis: {
        title: "Old synthesis",
        summary: "Old summary.",
        basis: { source_ids: [source.id] },
        status: "active",
      },
    };
    const latestSynthesis: SynthesisRow = {
      ...oldSynthesis,
      id: "synth:facade:20260501:bbbb2222",
      created_at: "2026-05-01T13:00:00Z",
      synthesis: {
        title: "Latest synthesis",
        summary: "Latest summary.",
        limitations: "Still thin.",
        basis: { source_ids: [source.id] },
        status: "active",
      },
    };
    const lowQuestion: QuestionRow = {
      schema_version: "knb.v1",
      id: "q:facade:20260501:low11111",
      kind: "question",
      created_at: "2026-05-01T12:30:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      question: { text: "Low question?", status: "open", priority: "low" },
    };
    const highQuestion: QuestionRow = {
      ...lowQuestion,
      id: "q:facade:20260501:high2222",
      created_at: "2026-05-01T12:20:00Z",
      question: {
        text: "High question?",
        status: "open",
        priority: "high",
        why_it_matters: "handoff",
      },
    };
    await seedLedger(jsonl([source, oldSynthesis, latestSynthesis, lowQuestion, highQuestion]));
    const knb = await openKnb(makeOpenOptions());

    const result = await knb.collectionStatus({ collection: "facade", maxQuestions: 1 });

    expect(result.collection).toBe("facade");
    expect(result.active_counts_by_kind.source).toBe(1);
    expect(result.active_counts_by_kind.synthesis).toBe(2);
    expect(result.active_counts_by_kind.question).toBe(2);
    expect(result.latest_synthesis?.id).toBe(latestSynthesis.id);
    expect(result.latest_synthesis?.title).toBe("Latest synthesis");
    expect(result.latest_synthesis?.limitations).toBe("Still thin.");
    expect(result.open_question_count).toBe(2);
    expect(result.open_questions).toEqual([
      {
        id: highQuestion.id,
        text: "High question?",
        created_at: highQuestion.created_at,
        priority: "high",
        why_it_matters: "handoff",
      },
    ]);
  });

  test("check on empty workspace reports clean parse and validation but missing indexes", async () => {
    const knb = await openKnb(makeOpenOptions());
    const result = await knb.check();
    expect(result.parse_issues).toEqual([]);
    expect(result.validation_issues).toEqual([]);
    expect(result.state_warnings).toEqual([]);
    // Indexes have not been built — projection freshness reports them missing.
    const missing = result.projection_freshness.entries.filter((entry) => entry.state === "missing");
    expect(missing.length).toBe(V1_INDEX_NAMES.length);
    expect(result.ok).toBe(false);
    // Fingerprint is exposed even on empty.
    expect(result.fingerprint).toBeDefined();
    expect(typeof result.fingerprint.content_hash).toBe("string");
  });

  test("check and context warn when a targeted synthesis has newer matching claims", async () => {
    const source = freshSourceRow("src:targeted:20260501:aaaa1111");
    const oldClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:targeted:20260501:bbbb2222"),
      created_at: "2026-05-01T12:01:00Z",
      scope: { collections: ["targeted"] },
      claim: {
        statement: "Initial latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const synthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:targeted:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["targeted"] },
      synthesis: {
        title: "Latency synthesis",
        summary: "Initial latency summary.",
        basis: { claim_ids: [oldClaim.id] },
        target_selector: {
          kinds: ["claim"],
          scope: { collections: ["targeted"] },
          where: [
            { path: "claim.type", eq: "measurement" },
            { path: "claim.qualifiers.metric", eq: "latency" },
          ],
        },
        status: "active",
      } as SynthesisRow["synthesis"],
    };
    const newerClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:targeted:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
      scope: { collections: ["targeted"] },
      claim: {
        statement: "Newer latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    await seedLedger(jsonl([source, oldClaim, synthesis, newerClaim]));
    const knb = await openKnb(makeOpenOptions());

    const check = await knb.check();
    const stateWarning = check.state_warnings.find((warning) => warning.code === "synthesis_target_stale");
    expect(stateWarning).toBeDefined();
    expect(stateWarning?.target_id).toBe(synthesis.id);
    expect(stateWarning?.message).toContain(newerClaim.id);

    const context = await knb.context({ collection: "targeted" });
    const contextWarning = context.warnings.find((warning) => warning.code === "state_synthesis_target_stale");
    expect(contextWarning?.message).toContain(newerClaim.id);
  });

  test("check accepts syntheses without target_selector and rejects invalid target selectors", async () => {
    const source = freshSourceRow("src:targetless:20260501:aaaa1111");
    const claim = freshClaimRow(source.id, "claim:targetless:20260501:bbbb2222");
    const laterClaim = {
      ...freshClaimRow(source.id, "claim:targetless:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
    };
    const targetless: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:targetless:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["facade"] },
      synthesis: {
        title: "Untargeted synthesis",
        summary: "A synthesis that uses only basis ids.",
        basis: { claim_ids: [claim.id] },
        status: "active",
      },
    };
    await seedLedger(jsonl([source, claim, targetless, laterClaim]));
    const clean = await openKnb(makeOpenOptions());
    const cleanCheck = await clean.check();
    expect(cleanCheck.validation_issues).toEqual([]);
    expect(cleanCheck.state_warnings.some((warning) => warning.code === "synthesis_target_stale")).toBe(false);

    const invalidTargeted: SynthesisRow = {
      ...targetless,
      id: "synth:targetless:20260501:dddd4444",
      synthesis: {
        ...targetless.synthesis,
        target_selector: {
          kinds: ["claim"],
          where: [{ path: "claim.unknown", eq: "x" }],
        },
      } as SynthesisRow["synthesis"],
    };
    await seedLedger(jsonl([source, claim, invalidTargeted]));
    const invalid = await openKnb(makeOpenOptions());
    const issue = (await invalid.check()).validation_issues.find(
      (candidate) => candidate.code === "synthesis_target_selector_invalid",
    );
    expect(issue).toBeDefined();
    expect(issue?.path).toBe("synthesis.target_selector.where[0].path");
  });

  test("targeted synthesis freshness is satisfied by a newer covering synthesis", async () => {
    const source = freshSourceRow("src:covered:20260501:aaaa1111");
    const oldClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:covered:20260501:bbbb2222"),
      created_at: "2026-05-01T12:01:00Z",
      scope: { collections: ["covered"] },
      claim: {
        statement: "Initial latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const targetSelector: SynthesisRow["synthesis"]["target_selector"] = {
      kinds: ["claim"],
      scope: { collections: ["covered"] },
      where: [
        { path: "claim.type", eq: "measurement" },
        { path: "claim.qualifiers.metric", eq: "latency" },
      ],
    };
    const firstSynthesis: SynthesisRow = {
      schema_version: "knb.v1",
      id: "synth:covered:20260501:cccc3333",
      kind: "synthesis",
      created_at: "2026-05-01T12:02:00Z",
      created_by: "agent:test",
      scope: { collections: ["covered"] },
      synthesis: {
        title: "Latency synthesis",
        summary: "Initial latency summary.",
        basis: { claim_ids: [oldClaim.id] },
        target_selector: targetSelector,
        status: "active",
      } as SynthesisRow["synthesis"],
    };
    const newerClaim: ClaimRow = {
      ...freshClaimRow(source.id, "claim:covered:20260501:dddd4444"),
      created_at: "2026-05-01T12:03:00Z",
      scope: { collections: ["covered"] },
      claim: {
        statement: "Newer latency measurement exists.",
        atomic: true,
        type: "measurement",
        qualifiers: { metric: "latency" },
      },
    };
    const coveringSynthesis: SynthesisRow = {
      ...firstSynthesis,
      id: "synth:covered:20260501:eeee5555",
      created_at: "2026-05-01T12:04:00Z",
      synthesis: {
        ...firstSynthesis.synthesis,
        title: "Updated latency synthesis",
        summary: "Updated latency summary.",
        basis: { claim_ids: [oldClaim.id, newerClaim.id] },
      } as SynthesisRow["synthesis"],
    };
    await seedLedger(jsonl([source, oldClaim, firstSynthesis, newerClaim, coveringSynthesis]));
    const knb = await openKnb(makeOpenOptions());

    expect((await knb.check()).state_warnings.some((warning) => warning.code === "synthesis_target_stale")).toBe(false);
  });

  test("rebuildIndex returns IndexResult with all V1 indexes and writes them to disk", async () => {
    const knb = await openKnb(makeOpenOptions());
    await knb.init();
    const result = await knb.rebuildIndex();
    expect(result.indexes.length).toBe(V1_INDEX_NAMES.length);
    const names = result.indexes.map((entry) => entry.name).sort();
    expect(names).toEqual([...V1_INDEX_NAMES].sort());
    for (const entry of result.indexes) {
      expect(typeof entry.path).toBe("string");
      expect(await pathExists(entry.path)).toBe(true);
      expect(await pathExists(entry.metadata_path)).toBe(true);
      expect(entry.metadata.kind).toBe("index");
      expect(entry.metadata.schema_version).toBe("knb.projection.v1");
      expect(entry.bytes_written).toBeGreaterThan(0);
    }
  });

  test("renderAll writes views for every active collection through the facade", async () => {
    const rows = [
      freshSourceRow("src:alpha:20260501:aaaa1111"),
      {
        ...freshSourceRow("src:beta:20260501:bbbb2222"),
        scope: { collections: ["beta"] },
      },
    ];
    await seedLedger(jsonl(rows));
    const knb = await openKnb(makeOpenOptions());

    const result = await knb.renderAll();

    expect(result.collections).toEqual(["beta", "facade"]);
    expect(result.rendered.length).toBe(2);
    expect(result.total_bytes_written).toBeGreaterThan(0);
    for (const entry of result.rendered) {
      expect(await pathExists(entry.path)).toBe(true);
      expect(await pathExists(entry.metadata_path)).toBe(true);
    }
  });

  test("query/context/render/check propagate KnbError when ledger has parse errors", async () => {
    await seedLedger("{invalid json\n");
    const knb = await openKnb(makeOpenOptions());

    let qErr: unknown;
    try {
      await knb.query({});
    } catch (error) {
      qErr = error;
    }
    expect(isKnbError(qErr)).toBe(true);
    expect((qErr as { code: string }).code).toBe("io_failed");

    let cErr: unknown;
    try {
      await knb.context({});
    } catch (error) {
      cErr = error;
    }
    expect(isKnbError(cErr)).toBe(true);

    let rErr: unknown;
    try {
      await knb.render({ collection: "x" });
    } catch (error) {
      rErr = error;
    }
    expect(isKnbError(rErr)).toBe(true);

    let raErr: unknown;
    try {
      await knb.renderAll();
    } catch (error) {
      raErr = error;
    }
    expect(isKnbError(raErr)).toBe(true);
  });

  test("query/context propagate validation_failed when ledger has validation errors", async () => {
    const claim = freshClaimRow("src:nope:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));
    const knb = await openKnb(makeOpenOptions());
    let qErr: unknown;
    try {
      await knb.query({});
    } catch (error) {
      qErr = error;
    }
    expect(isKnbError(qErr)).toBe(true);
    expect((qErr as { code: string }).code).toBe("validation_failed");
  });

  test("add is a single-op wrapper equivalent to apply with one add operation", async () => {
    const knb = await openKnb({
      ...makeOpenOptions(),
      actor: "agent:test",
      runtime: { clock: () => new Date("2026-05-01T12:00:00Z"), randomIdPart: () => "aaaa1111" },
    });
    const draft = {
      kind: "source" as const,
      scope: { collections: ["wrap"] },
      source: { type: "web_page" as const, title: "x", uri: "https://example.com/wrap" },
      provenance: { acquisition: { method: "manual" } },
    };
    const result = await knb.add(draft);
    expect(result.created.length).toBe(1);
    expect(result.created[0]?.kind).toBe("source");
    expect(result.meta.rows_appended).toBe(1);
    expect(result.meta.bytes_written).toBeGreaterThan(0);
    expect(result.warnings).toBeDefined();
    expect(Array.isArray(result.novelty)).toBe(true);
  });
});

describe("Knb.collections", () => {
  test("summarizes active collections from EffectiveState, not generated indexes", async () => {
    const sourceA = freshSourceRow("src:alpha:20260501:aaaa1111");
    sourceA.scope = { collections: ["alpha"] };
    sourceA.created_at = "2026-05-01T10:00:00.000Z";
    const sourceB = freshSourceRow("src:beta:20260501:bbbb2222");
    sourceB.scope = { collections: ["beta"] };
    sourceB.created_at = "2026-05-01T11:00:00.000Z";
    const claim = freshClaimRow(sourceA.id, "claim:shared:20260501:cccc3333");
    claim.scope = { collections: ["alpha", "beta"] };
    claim.created_at = "2026-05-01T12:00:00.000Z";
    const question: QuestionRow = {
      schema_version: "knb.v1",
      id: "q:beta:20260501:dddd4444",
      kind: "question",
      created_at: "2026-05-01T13:00:00.000Z",
      created_by: "agent:test",
      scope: { collections: ["beta"] },
      question: { text: "What next?", status: "open" },
    };
    const archivedQuestion: QuestionRow = {
      ...question,
      id: "q:alpha:20260501:eeee5555",
      created_at: "2026-05-01T14:00:00.000Z",
      scope: { collections: ["alpha"] },
      question: { text: "Archived?", status: "archived" },
    };
    await seedLedger(jsonl([sourceA, sourceB, claim, question, archivedQuestion]));
    await mkdir(join(workDir, "knb", "indexes"), { recursive: true });
    await writeFile(
      join(workDir, "knb", "indexes", "active-by-collection.json"),
      JSON.stringify({ stale: ["wrong"] }),
      "utf8",
    );

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.collections();

    expect(result.collections).toEqual([
      {
        collection: "alpha",
        active_counts_by_kind: { source: 1, claim: 1 },
        latest_created_at: "2026-05-01T12:00:00.000Z",
      },
      {
        collection: "beta",
        active_counts_by_kind: { source: 1, claim: 1, question: 1 },
        latest_created_at: "2026-05-01T13:00:00.000Z",
      },
    ]);
  });
});

describe("Knb.log", () => {
  test("sorts manifests by completed_at desc and run_id tie-break with default limit", async () => {
    await seedRunManifests([
      manifest("run_a", "agent:alpha", "2026-05-01T10:00:00.000Z", ["row:a"], "old"),
      manifest("run_b", "agent:beta", "2026-05-02T09:00:00.000Z", ["row:b"], "middle"),
      manifest("run_e", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:e"], "tie e"),
      manifest("run_d", "agent:beta", "2026-05-03T00:00:00.000Z", ["row:d"], "newest"),
      manifest("run_c", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:c"], "tie c"),
    ]);

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({});
    expect(result.entries.map((entry) => entry.run_id)).toEqual(["run_d", "run_c", "run_e", "run_b", "run_a"]);
    expect(result.total_matched).toBe(5);
    expect(result.total_returned).toBe(5);
  });

  test("filters manifests by actor, since, until, and limit", async () => {
    await seedRunManifests([
      manifest("run_a", "agent:alpha", "2026-05-01T10:00:00.000Z", ["row:a"]),
      manifest("run_b", "agent:beta", "2026-05-02T09:00:00.000Z", ["row:b"]),
      manifest("run_c", "agent:alpha", "2026-05-02T12:00:00.000Z", ["row:c"]),
      manifest("run_d", "agent:beta", "2026-05-03T00:00:00.000Z", ["row:d"]),
      manifest("run_e", "agent:alpha", "2026-05-02T13:00:00.000Z", ["row:e"]),
    ]);

    const knb = await openKnb(makeOpenOptions());
    const result = await knb.log({
      actor: "agent:alpha",
      since: "2026-05-02T00:00:00.000Z",
      until: "2026-05-02T23:59:59.999Z",
      limit: 1,
    });

    expect(result.entries.map((entry) => entry.run_id)).toEqual(["run_e"]);
    expect(result.total_matched).toBe(2);
    expect(result.total_returned).toBe(1);
  });
});

describe("readSnapshot", () => {
  test("clean ledger returns validity = projected with state defined", async () => {
    const source = freshSourceRow();
    const claim = freshClaimRow(source.id);
    await seedLedger(jsonl([source, claim]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state).toBeDefined();
    expect(snapshot.state?.rows().length).toBe(2);
    expect(snapshot.validation.ok).toBe(true);
    expect(snapshot.fingerprint.rows).toBe(2);
  });

  test("ledger with parse error returns validity = loaded", async () => {
    await seedLedger(`${JSON.stringify(freshSourceRow())}\n{nope\n`);
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("loaded");
    expect(snapshot.state).toBeUndefined();
    expect(snapshot.ledger.parseIssues.length).toBeGreaterThanOrEqual(1);
  });

  test("validation warnings (duplicate source uri) do not block projection", async () => {
    const sharedUri = "https://example.com/shared";
    const sourceA = freshSourceRow("src:facade:20260501:aaaa1111");
    const sourceB = freshSourceRow("src:facade:20260501:aaaa2222");
    sourceA.source.uri = sharedUri;
    sourceB.source.uri = sharedUri;
    await seedLedger(jsonl([sourceA, sourceB]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state).toBeDefined();
    const warnings = snapshot.validation.issues.filter((issue) => issue.level === "warning");
    expect(warnings.length).toBeGreaterThanOrEqual(1);
    expect(warnings[0]?.code).toBe("duplicate_source_evidence");
    expect(snapshot.validation.ok).toBe(true);
  });

  test("validation errors return validity = loaded with no state", async () => {
    const claim = freshClaimRow("src:missing:20260501:zzzz9999");
    await seedLedger(jsonl([claim]));

    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("loaded");
    expect(snapshot.state).toBeUndefined();
    const errors = snapshot.validation.issues.filter((issue) => issue.level === "error");
    expect(errors.length).toBeGreaterThanOrEqual(1);
  });

  test("projectState=false returns validity = validated when no errors", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace, projectState: false });
    expect(snapshot.validity).toBe("validated");
    expect(snapshot.state).toBeUndefined();
    expect(snapshot.validation.ok).toBe(true);
  });

  test("custom projectState is invoked when validation passes", async () => {
    const source = freshSourceRow();
    await seedLedger(jsonl([source]));
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    let called = 0;
    const snapshot = await readSnapshot({
      workspace,
      projectState: (rows) => {
        called += 1;
        return defaultProjectState(rows);
      },
    });
    expect(called).toBe(1);
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.state?.rows().length).toBe(1);
  });

  test("missing ledger returns empty projected snapshot", async () => {
    const workspace = await openWorkspace({ root: workDir, env: {}, cwd: () => workDir });
    const snapshot = await readSnapshot({ workspace });
    expect(snapshot.validity).toBe("projected");
    expect(snapshot.ledger.rows.length).toBe(0);
    expect(snapshot.state?.rows()).toEqual([]);
    expect(snapshot.fingerprint.rows).toBe(0);
  });
});

describe("src/index.ts public surface", () => {
  test("openKnb is exported as a function", () => {
    expect(typeof publicApi.openKnb).toBe("function");
  });

  test("re-exported types resolve to the same module's openKnb", async () => {
    // Smoke test: instantiate via the index re-export and confirm shape.
    const knb = await publicApi.openKnb(makeOpenOptions());
    expect(typeof knb.apply).toBe("function");
    expect(typeof knb.add).toBe("function");
    expect(typeof knb.status).toBe("function");
    expect(typeof knb.renderAll).toBe("function");
  });
});

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/ledger-ownership.test.ts
```ts
import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripCommentsAndStrings,
} from "./_helpers";

const LEDGER_OWNER = "src/core/ledger.ts";
const PROJECTIONS_OWNER = "src/core/projections.ts";
const RUN_MANIFESTS_OWNER = "src/core/run-manifests.ts";

const SCANNED_FILES = [
  "src/core/apply.ts",
  "src/core/contract.ts",
  "src/core/context.ts",
  "src/core/errors.ts",
  "src/core/knb.ts",
  "src/core/ledger.ts",
  "src/core/novelty.ts",
  "src/core/output.ts",
  "src/core/projections.ts",
  "src/core/query.ts",
  "src/core/read-snapshot.ts",
  "src/core/run-manifests.ts",
  "src/core/state.ts",
  "src/core/workspace.ts",
  "src/cli.ts",
  "src/index.ts",
];

describe("ledger storage ownership (bd-3p4.5)", () => {
  test("only the ledger module appends to ledger.jsonl", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const pattern = /append(File|FileSync)\s*\([^)]*ledger/g;
    for (const file of files) {
      if (file.path.endsWith(LEDGER_OWNER)) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "appendFile(... ledger ...)", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only the ledger module imports raw fs append/write/unlink targeting ledger paths", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const appendPattern = /\bappendFile(Sync)?\s*\(/g;
    const unlinkPattern = /\bunlink\s*\(/g;
    for (const file of files) {
      if (file.path.endsWith(LEDGER_OWNER)) continue;
      const appendMatches = findMatches(file.stripped, appendPattern);
      if (appendMatches.length > 0) {
        violations.push(describeViolations(file, "appendFile(", appendMatches));
      }
      const unlinkMatches = findMatches(file.stripped, unlinkPattern);
      if (unlinkMatches.length > 0) {
        violations.push(describeViolations(file, "unlink(", unlinkMatches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("only ledger, projections, and run manifest modules write artifacts via writeFile in core", async () => {
    const files = await readSourceFiles(SCANNED_FILES);
    const violations: string[] = [];
    const pattern = /\bwriteFile\s*\(/g;
    const allowed = new Set([
      LEDGER_OWNER,
      PROJECTIONS_OWNER,
      RUN_MANIFESTS_OWNER,
      "src/core/knb.ts",
    ]);
    for (const file of files) {
      if (!file.path.includes("/src/core/")) continue;
      const isAllowed = [...allowed].some((p) => file.path.endsWith(p));
      if (isAllowed) continue;
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "writeFile(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("ledger module owns the ledger append helper", async () => {
    const files = await readSourceFiles([LEDGER_OWNER]);
    const ledger = files[0]!;
    const matches = findMatches(ledger.stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden append in negative fixture", () => {
    const bad = `
      import { appendFile } from "node:fs/promises";
      export async function rogue(path: string) {
        await appendFile(path, "data\\n", "utf8");
        await appendFile(path, "more\\n", "utf8");
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(2);
  });

  test("scanner ignores appendFile mentions inside comments", () => {
    const benign = `
      // this comment talks about appendFile(ledgerPath) for context
      /* appendFile(otherPath) */
      export const note = "appendFile usage";
    `;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(0);
  });

  test("scanner ignores appendFile mentions inside string literals", () => {
    const benign = `const description = "we never call appendFile(ledger.jsonl)";`;
    const stripped = stripCommentsAndStrings(benign);
    const matches = findMatches(stripped, /\bappendFile\s*\(/g);
    expect(matches.length).toBe(0);
  });
});

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/iran-fixture.expected.md
```md
# Iran Cracks

Ledger: 16 rows; hash sha256:golden

## Contents {#contents}

- [Current Synthesis](#current-synthesis)
- [Key Claims](#key-claims)
  - [Claim Key Clusters](#claim-key-clusters)
  - [Unkeyed Claims](#unkeyed-claims)
- [Open Questions](#open-questions)
- [Sources](#sources)

## Current Synthesis {#current-synthesis}

### Command Pressure Summary {#synth-iran-20260501-summary01}

Visible stress is concentrated around command channels and readiness signals.

## Key Claims {#key-claims}

### Claim Key Clusters {#claim-key-clusters}

#### iran|command {#claim-key-iran-command}

- Command channels show visible strain. {#claim-iran-20260501-command01}
  - Confidence: high
  - Time: 2026-04-30
- Senior officials shifted bunker routines. {#claim-iran-20260501-command02}
  - Confidence: medium
  - Time: 2026-05-01T08:00:00Z

#### iran|market {#claim-key-iran-market}

- Market makers priced a short disruption window. {#claim-iran-20260501-market01}
  - Confidence: high
- Rumor desks amplified unverified succession chatter. {#claim-iran-20260501-market02}
  - Confidence: low

### Unkeyed Claims {#unkeyed-claims}

- Older sanctions pressure remains unresolved. {#claim-iran-20260501-unkeyed01}
  - Confidence: high
- Proxy channels elevated readiness. {#claim-iran-20260501-unkeyed02}
  - Confidence: medium
- Diplomatic backchannels stayed open. {#claim-iran-20260501-unkeyed03}
  - Confidence: medium
- Port inspections slowed on the Gulf route. {#claim-iran-20260501-unkeyed04}
  - Confidence: low

## Open Questions {#open-questions}

- Where is the chain-of-command break? {#q-iran-20260501-question01}
- Which reports are independently corroborated? {#q-iran-20260501-question02}

## Sources {#sources}

- Signals Desk - Dispatch One (Cited by 2 claims) {#src-iran-20260501-source01}
- Signals Desk - Dispatch Two (Cited by 2 claims) {#src-iran-20260501-source02}
- Market Desk - Market Note (Cited by 3 claims) {#src-iran-20260501-source03}
- Archive - Archive Note (Cited by 1 claim) {#src-iran-20260501-source04}

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/projection-ownership.test.ts
```ts
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
  "src/core/novelty.ts",
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

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/state-boundaries.test.ts
```ts
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
  "src/core/novelty.ts",
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

  test("read-side modules do not branch on raw change.action lifecycle values", async () => {
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
    const methods = ["status", "get", "query", "context", "render", "check", "rebuildIndex", "novelty"];
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
      "src/core/novelty.ts",
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
      function rogue(change: { action: string }) {
        if (change.action === "retract") return "stale";
        if (change.action === "supersede") return "stale";
        if (change.action === "merge") return "stale";
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

```

File: /Users/jaredsmith/Projects-ultra/knb/tests/static/runtime-determinism.test.ts
```ts
import { describe, expect, test } from "bun:test";

import {
  describeViolations,
  findMatches,
  readSourceFiles,
  stripCommentsAndStrings,
} from "./_helpers";

const RUNTIME_OWNER = "src/core/knb.ts";

const FORBIDDEN_FILES = [
  "src/core/contract.ts",
  "src/core/apply.ts",
  "src/core/state.ts",
  "src/core/query.ts",
  "src/core/context.ts",
  "src/core/novelty.ts",
  "src/core/read-snapshot.ts",
  "src/core/ledger.ts",
  "src/core/workspace.ts",
  "src/core/output.ts",
  "src/core/errors.ts",
];

const PROJECTIONS_FILE = "src/core/projections.ts";

describe("runtime determinism (bd-1em.7)", () => {
  test("core modules do not call new Date() with no arguments", async () => {
    const files = await readSourceFiles(FORBIDDEN_FILES);
    const violations: string[] = [];
    const pattern = /\bnew\s+Date\s*\(\s*\)/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "new Date()", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call Date.now()", async () => {
    const files = await readSourceFiles(FORBIDDEN_FILES);
    const violations: string[] = [];
    const pattern = /\bDate\s*\.\s*now\s*\(/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "Date.now(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call Math.random()", async () => {
    const files = await readSourceFiles([...FORBIDDEN_FILES, PROJECTIONS_FILE]);
    const violations: string[] = [];
    const pattern = /\bMath\s*\.\s*random\s*\(/g;
    for (const file of files) {
      const matches = findMatches(file.stripped, pattern);
      if (matches.length > 0) {
        violations.push(describeViolations(file, "Math.random(", matches));
      }
    }
    expect(violations).toEqual([]);
  });

  test("core modules do not call crypto.randomBytes / randomUUID directly", async () => {
    const files = await readSourceFiles([...FORBIDDEN_FILES, PROJECTIONS_FILE]);
    const violations: string[] = [];
    const patterns: Array<{ label: string; rx: RegExp }> = [
      { label: "crypto.randomBytes(", rx: /\bcrypto\s*\.\s*randomBytes\s*\(/g },
      { label: "crypto.randomUUID(", rx: /\bcrypto\s*\.\s*randomUUID\s*\(/g },
      { label: "randomBytes( (bare)", rx: /(?<!\bcrypto\s*\.\s*)\brandomBytes\s*\(/g },
      { label: "randomUUID( (bare)", rx: /(?<!\bcrypto\s*\.\s*)\brandomUUID\s*\(/g },
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

  test("runtime owner is the only core file that constructs the default clock and randomness", async () => {
    const files = await readSourceFiles([RUNTIME_OWNER]);
    const owner = files[0]!;
    const clockMatches = findMatches(owner.stripped, /\bnew\s+Date\s*\(\s*\)/g);
    const randomMatches = findMatches(owner.stripped, /\brandomBytes\s*\(/g);
    expect(clockMatches.length).toBeGreaterThan(0);
    expect(randomMatches.length).toBeGreaterThan(0);
  });

  test("apply pipeline only constructs Date from injected request inputs", async () => {
    const files = await readSourceFiles(["src/core/apply.ts"]);
    const apply = files[0]!;
    const noArgMatches = findMatches(apply.stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(noArgMatches.length).toBe(0);
    const argMatches = findMatches(apply.stripped, /\bnew\s+Date\s*\(\s*[^)\s]/g);
    expect(argMatches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden no-arg new Date() in negative fixture", () => {
    const bad = `
      export function nowIso(): string {
        return new Date().toISOString();
      }
    `;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(matches.length).toBeGreaterThan(0);
  });

  test("scanner detects forbidden Date.now() in negative fixture", () => {
    const bad = `const start = Date.now();`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bDate\s*\.\s*now\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner detects forbidden Math.random() in negative fixture", () => {
    const bad = `const r = Math.random();`;
    const stripped = stripCommentsAndStrings(bad);
    const matches = findMatches(stripped, /\bMath\s*\.\s*random\s*\(/g);
    expect(matches.length).toBe(1);
  });

  test("scanner does not flag new Date(stringExpr) used for parsing", () => {
    const benign = `const parsed = new Date(input); const cloned = new Date(parsed.getTime());`;
    const stripped = stripCommentsAndStrings(benign);
    const noArg = findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g);
    expect(noArg.length).toBe(0);
  });

  test("scanner ignores Date mentions inside comments and strings", () => {
    const benign = `
      // call new Date() somewhere else
      /* Date.now() in a block comment */
      const docs = "Math.random() and crypto.randomBytes()";
    `;
    const stripped = stripCommentsAndStrings(benign);
    expect(findMatches(stripped, /\bnew\s+Date\s*\(\s*\)/g).length).toBe(0);
    expect(findMatches(stripped, /\bDate\s*\.\s*now\s*\(/g).length).toBe(0);
    expect(findMatches(stripped, /\bMath\s*\.\s*random\s*\(/g).length).toBe(0);
    expect(findMatches(stripped, /\brandomBytes\s*\(/g).length).toBe(0);
  });
});

```

File: /Users/jaredsmith/Projects-ultra/knb/scripts/sync-schema.ts
```ts
// Regenerate `knb/schema.json` from `contract.jsonSchema()` so the static schema
// file stays in sync with the TypeScript source of truth.
// Run via: bun run sync-schema
import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { jsonSchema } from "../src/core/contract";

const target = resolve(import.meta.dir, "..", "knb", "schema.json");
const content = `${JSON.stringify(jsonSchema(), null, 2)}\n`;
await writeFile(target, content, "utf8");
console.log(`Wrote ${target}`);

```

File: /Users/jaredsmith/Projects-ultra/knb/tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "types": ["bun-types"],
    "skipLibCheck": true
  },
  "include": ["src/**/*.ts", "scripts/**/*.ts", "tests/**/*.ts"]
}

```
</file_contents>
<meta prompt 1 = "[Architect]">
You are producing an implementation-ready technical plan. The implementer will work from your plan without asking clarifying questions, so every design decision must be resolved, every touched component must be identified, and every behavioral change must be specified precisely.

Your job:
1. Analyze the requested change against the provided code — identify the relevant architecture, constraints, data flow, and extension points.
2. Decide whether this is best solved by a targeted change or a broader refactor, and justify that decision.
3. Produce a plan detailed enough that an engineer can implement it file-by-file without making design decisions of their own.

Hard constraints:
- Do not write production code, patches, diffs, or copy-paste-ready implementations.
- Stay in analysis and architecture mode only.
- Use illustrative snippets, interface shapes, sample signatures, state/data shapes, or pseudocode when they communicate the design more precisely than prose. Keep them partial — enough to remove ambiguity, not enough to copy-paste.
- Scale your response to the complexity of the request. Small, localized changes need short plans; only expand sections for changes that genuinely require the detail.

─── ANALYSIS ───

Current-state analysis (always include):
- Map the existing responsibilities, type relationships, ownership, data flow, and mutation points relevant to the request.
- Identify existing code that should be reused or extended — never duplicate what already exists without justification.
- Note hard constraints: API contracts, protocol conformances, state ownership rules, thread/actor isolation, persistence schemas, UI update mechanisms.
- When multiple subsystems interact, trace the call chain end-to-end and identify each transformation boundary.

─── DESIGN ───

Design standards — address only the standards relevant to the change; skip sections that don't apply:

1. New and modified components/types: For each, specify:
   - The name, kind (for example: class, interface, enum, record, service, module, controller), and why that kind fits the codebase and language.
   - The fields/properties/state it owns, including data shape, mutability, and ownership/lifecycle semantics.
   - Key callable interfaces or signatures, including inputs, outputs, and whether execution is synchronous/asynchronous or can fail.
   - Contracts it implements, extends, composes with, or depends on.
   - For closed sets of variants (for example enums, tagged unions, discriminated unions): all cases/variants and any attached data.
   - Where the component lives (file path) and who creates/owns its instances.

2. State and data flow: For each state change the plan introduces or modifies:
   - What triggers the change (user action, callback, notification, timer, stream event).
   - The exact path the data travels: source → transformations → destination.
   - Thread/actor/queue context at each step.
   - How downstream consumers observe the change (published property, delegate, notification, binding, callback).
   - What happens if the change arrives out of order, is duplicated, or is dropped.

3. API and interface changes: For each modified public/internal interface:
   - The before and after signatures (or new signature if additive).
   - Every call site that must be updated, grouped by file.
   - Backward-compatibility strategy if the interface is used by external consumers or persisted data.

4. Persistence and serialization: When the plan touches stored data:
   - Schema changes with exact field names, types, and defaults.
   - Migration strategy: how existing data is read, transformed, and re-persisted.
   - What happens when new code reads old data and when old code reads new data (if rollback is possible).

5. Concurrency and lifecycle:
   - Specify the execution model and safety boundaries for each new/modified component: thread affinity, event-loop/runtime constraints, isolation boundaries, queue/worker discipline, or thread-safety expectations as applicable.
   - Identify potential races, leaked references/resources, or lifecycle mismatches introduced by the change.
   - When operations are asynchronous, specify cancellation/abort behavior and what state remains after interruption.

6. Error handling and edge cases:
   - For each operation that can fail, specify what failures are possible and how they propagate.
   - Describe degraded-mode behavior: what the user sees, what state is preserved, what recovery is available.
   - Identify boundary conditions: empty collections, missing/null/optional values, first-run states, interrupted operations.

7. Algorithmic and logic-heavy work (include whenever the change involves non-trivial control flow, state machines, data transformations, or performance-sensitive paths):
   - Describe the algorithm step-by-step: inputs, outputs, invariants, and data structures.
   - Cover edge cases, failure modes, and performance characteristics (time/space complexity if relevant).
   - Explain why this approach over the most plausible alternatives.

8. Avoid unnecessary complexity:
   - Do not add layers, abstractions, or indirection without a concrete benefit identified in the plan.
   - Do not create parallel code paths — unify where possible.
   - Reuse existing patterns unless those patterns are themselves the problem.

─── OUTPUT ───

Structure your response as:

1. **Summary** — One paragraph: what changes, why, and the high-level approach.

2. **Current-state analysis** — How the relevant code works today. Trace the data/control flow end-to-end. Identify what is reusable and what is blocking.

3. **Design** — The core of the plan. Apply every applicable standard from above. Organize by logical component or subsystem, not by standard number. Each component section should cover types, state flow, interfaces, persistence, concurrency, and error handling as relevant to that component.

4. **File-by-file impact** — For every file that changes, list:
   - What changes (added/modified/removed types, methods, properties).
   - Why (which design decision drives this change).
   - Dependencies on other changes in this plan (ordering constraints).

5. **Risks and migration** — Include only when the change introduces breaking changes, data migration, or rollback concerns. Omit for additive or non-breaking work.

6. **Implementation order** — A numbered sequence of steps. Each step should be independently compilable and testable where possible. Call out steps that must be atomic (landed together).

Response discipline:
- Be specific to the provided code — reference actual type names, file paths, method names, and property names.
- Make every assumption explicit.
- Flag unknowns that must be validated during implementation, with a suggested validation approach.
- When a design decision has a non-obvious rationale, explain it in one sentence.
- Do not pad with generic advice. Every sentence should convey information the implementer needs.

Please proceed with your analysis based on the following <user instructions>
</meta prompt 1>
<user_instructions>
<taskname="KNB Architectural Review"/>

<task>
Review the KNB codebase end-to-end as an outside expert and produce an architectural critique with concrete, prioritized recommendations.

KNB is a small portable embeddable knowledge-base library and CLI for AI-assisted research. It stores sourced knowledge, uncertainty, and synthesis in an append-only JSONL ledger. The canonical row model is `knb.v1` with kinds: `source`, `claim`, `question`, `synthesis`, `change`. Reusable row modules: `scope`, `identity`, `time`, `provenance`, `assessment`, `relations`. Reads go through validated effective-state snapshots (lifecycle-aware projections). Writes go through `apply` (atomic batch) or its single-row wrapper `add`. The CLI is meant to be a thin adapter over the `openKnb` facade, so the public library is the test surface.

Evaluate and report on:
1. **Architectural soundness** — module map, layering, projection seams, append-only ledger discipline, snapshot/effective-state boundary, CLI-as-thin-adapter principle. Where does the code honor its stated architecture, where does it leak?
2. **API/facade design** — `openKnb` ergonomics, request/response shapes, error model, naming consistency, surface area for host applications. Is the public library actually the test surface?
3. **Schema and data model** — `knb.v1` row kinds and modules, generality vs over-fit to current use cases, lifecycle/change-row semantics, dedupe/novelty design.
4. **Correctness and reliability risks** — concurrency, atomicity of `apply`, projection freshness, failure modes, validation coverage, mechanical-repair pathways.
5. **Code quality** — readability, duplication, error handling, test coverage gaps, anti-patterns.
6. **Doc/code alignment** — does the code actually implement what AGENTS.md, ARCHITECTURE.md, docs/design/agent-first-cli.md, docs/library-usage.md, and the ADRs claim?

Deliver a prioritized list (P0/P1/P2) of findings, each with: file/area, observation, why it matters, and a concrete recommendation. Highlight the top 3 things you would change first and why.
</task>

<context>
This is a complete snapshot of the KNB project being handed to you as an external reviewer. All live research instances and ledger contents have been stripped — only the library, CLI, schema, docs, scripts, and tests remain. Use the docs and ADRs as ground truth for *intent*, then check whether the code matches.

The project uses **Bun** as its runtime, package manager, and test runner. There are zero production dependencies — only `@types/bun` and `typescript` as devDependencies. All source is TypeScript, all tests run with `bun test`.
</context>

<architecture>

## Module Map (from ARCHITECTURE.md)

| Module | Responsibility | Key exports |
|---|---|---|
| `src/core/contract.ts` | Row types, operation types, constants, validation, draft completion, samples, JSON Schema | `KnbRow`, `ApplyOperation`, `validateLedger`, `validateApplyRequest`, `jsonSchema`, `referenceFields` |
| `src/core/ledger.ts` | JSONL loading, fingerprints, lock-protected append transactions | `loadLedger`, `writeLedger`, `LedgerFingerprint`, `LedgerSnapshot` |
| `src/core/state.ts` | Project loaded rows into EffectiveState (lifecycle-aware) | `buildEffectiveState`, `EffectiveState`, `EffectiveRow`, `StateOptions` |
| `src/core/apply.ts` | Validate semantic write ops, complete drafts, dedupe, produce appendable rows | `applyOperations`, `previewApplyOperations`, `ApplyResult` |
| `src/core/read-snapshot.ts` | Combine load→validate→project→freshness for all read commands | `readSnapshot`, `KnbReadSnapshot` |
| `src/core/knb.ts` | Public facade that wires everything; CLI and host apps both use this | `openKnb`, `Knb`, `OpenKnbOptions` |
| `src/core/context.ts` | Token-budgeted research packets from EffectiveState | `buildContext`, `ContextRequest`, scoring profiles |
| `src/core/query.ts` | Deterministic retrieval over EffectiveState | `executeQuery`, `executeGet` |
| `src/core/novelty.ts` | Deterministic claim comparison for dedupe/triage | `classifyClaim`, `classifyMany`, `NoveltyResult` |
| `src/core/projections.ts` | Generated views, indexes, sidecar metadata, freshness | `JsonProjectionArtifactStore`, `renderCollection`, `rebuildIndexes` |
| `src/core/output.ts` | CLI success/failure envelopes, rendering, exit-code mapping | `success`, `failure`, `render`, `CommandResult` |
| `src/core/errors.ts` | Typed domain errors, exit-code mapping | `KnbErrorCode`, `knbError`, `fromUnknown` |
| `src/core/selectors.ts` | Structured row selectors (filter/matching DSL) | `RowSelector`, `matchesRowSelector`, `validateRowSelector` |
| `src/core/profiles.ts` | Optional workspace profile files that constrain row shapes | `validateProfilesForWorkspace`, `KnbProfile` |
| `src/core/workspace.ts` | Path, config, actor resolution | `openWorkspace`, `KnbWorkspace` |
| `src/core/run-manifests.ts` | Per-run operation manifests for audit logs | `RunManifest`, `writeRunManifest`, `readRunManifests` |
| `src/core/source-citations.ts` | Source URI/hash → citing-claim reverse-citation index | `buildSourceCitationIndex`, `SourceCitationIndex` |
| `src/cli.ts` | CLI adapter — parse args, openKnb, call facade, render envelope | `runCli` |
| `src/index.ts` | Public library entry point — re-exports from core | `openKnb` + all public types |

## Data Flow

```
Write path:
  CLI/host → openKnb → Knb.apply(ApplyRequest)
    → applyOperations(request, deps)
    → writeLedger (acquires lock, loads snapshot, validates, plans, appends)
    → ApplyResult { created, skipped, novelty, warnings, meta }

Read path:
  CLI/host → openKnb → Knb.query/context/get/render/check/status(...)
    → readSnapshot(workspace) → { validity, ledger, validation, state, projectionFreshness }
    → executeQuery/buildContext/executeGet/... (take EffectiveState, return result)
    → CommandResult through output.render()
```

## Key Vocabulary (from ARCHITECTURE.md)
- **EffectiveState**: deterministic projection of ledger events at a point in time; read paths consume this, not raw rows
- **LedgerFingerprint**: `{ path, rows, bytes, last_row_id, content_hash }` — canonical ledger identity
- **run_id**: per-apply transaction id; camelCase (`runId`) in public TS API, snake_case in persisted rows
- **snapshot validity levels**: `loaded` | `validated` | `projected` — `status/check` work at `loaded`; `get/query/context/render/index` require `projected`
- **SourceCitationIndex**: source-to-citing-claim reverse index; built by `buildSourceCitationIndex`
- **Naming rule**: CLI flags → kebab-case; ledger/schema fields → snake_case; public TS → camelCase

## Static Architecture Tests (in `tests/static/`)
These enforce invariants and are as authoritative as the module docs:
- `cli-adapter-thinness.test.ts` — CLI must only value-import from `./core/knb`, `./core/output`, `./core/errors`, `./core/workspace`; may NOT call pipeline functions directly; must use `openKnb()` + `render()`
- `apply-add-ownership.test.ts` — only `apply.ts` imports/calls `writeLedger`; `add` must delegate to `apply`; CLI must not construct change rows
- `ledger-ownership.test.ts` — only `ledger.ts` may call `appendFile`/`unlink`; only ledger/projections/run-manifests may call `writeFile` in core
- `runtime-determinism.test.ts` — core modules must NOT call `new Date()`, `Date.now()`, `Math.random()`, `crypto.randomBytes` — only `knb.ts` constructs the default clock/randomness
- `legacy-cleanup.test.ts` — no `validate`/`append` command aliases; no `KB` shorthand; no legacy dispatch
- `projection-ownership.test.ts` — only projections module writes to view/index paths
- `state-boundaries.test.ts` — lifecycle mutations confined to designated owners
- `contract-schema-ownership.test.ts` — no legacy module imports across src/tests

## ADR Decisions
- **ADR-0001** (Accepted): `validate` → `check`; `append` → `apply`+`add`; `kb.v1` → `knb.v1` (no compat aliases)
- **ADR-0002** (Accepted): V1 ships only `JsonProjectionArtifactStore`; `ProjectionArtifactStore` interface is the seam for a future SQLite adapter

## Ledger Locking
`writeLedger` acquires an exclusive-create file lock at `.knb/ledger.lock`. The lock protects the read-validate-append transaction sequence. Fail-fast on lock-busy (exit code 6). The design spec mentions a future `--wait-lock <ms>` option but V1 fails fast.

## Scoring Model
Context scoring is explicit: importance → confidence → information depth → evidence count → contested → created_at → id. Recency scoring is opt-in via `ContextRequest.scoringProfile.recencyWindowDays`. Formula: `max(0, 1 - ageDays / windowDays) * weight`, anchored to `request.asOf` or newest in-scope row.
</architecture>

<selected_context>
**Docs (full — these are the ground truth for intent):**
- `AGENTS.md` — project goal, rules, canonical model, agent commands
- `ARCHITECTURE.md` — module map, vocabulary, naming rules, projection seams, ADR index
- `docs/design/agent-first-cli.md` — full command surface (1037 lines), all module seams, apply pipeline spec, testing strategy, implementation order
- `docs/library-usage.md` — `openKnb` and every facade method with examples
- `docs/adr/0001-v1-cutover-validate-to-check.md` — command rename ADR
- `docs/adr/0002-projection-store-seam-jsonl-only.md` — projection store seam ADR

**Schema (full):**
- `knb/schema.json` — canonical JSON Schema (779 lines); `$id: "knb.v1"`; includes `$defs` for all row types and modules

**Source — all core modules (full):**
- `src/index.ts` — public library entry point; re-exports from `./core/knb`, `./core/contract`, `./core/context`, `./core/query`, `./core/projections`, `./core/selectors`, etc.
- `src/cli.ts` — thin CLI adapter (~600 lines); dispatches 13 commands through `openKnb` facade
- `src/core/apply.ts` — write pipeline (1080 lines); `applyOperations`, `previewApplyOperations`; handles all reference resolution, novelty, draft completion, change-row construction
- `src/core/contract.ts` — schema owner (1975 lines); all row types, validation functions, draft completion, JSON Schema generation, samples
- `src/core/context.ts` — context/scoring module; `buildContext`, scoring profiles, rank functions
- `src/core/errors.ts` — typed error vocabulary; `KnbErrorCode` union, `KnbErrorBase`, `EXIT_CODES`
- `src/core/knb.ts` — facade (851 lines); `openKnb`, `makeKnb`, all `Knb` methods wired together
- `src/core/ledger.ts` — JSONL storage (364 lines); `loadLedger`, `writeLedger`, lock logic, `LedgerFsBackend`
- `src/core/novelty.ts` — deterministic claim classifier; `classifyClaim`, `classifyMany`, `normalizeStatement`
- `src/core/output.ts` — CLI envelope rendering; JSON/text/ndjson/pretty/quiet modes
- `src/core/profiles.ts` — workspace profiles (optional row-shape constraints); `validateProfilesForWorkspace`
- `src/core/projections.ts` — generated views/indexes/metadata/freshness; `JsonProjectionArtifactStore`
- `src/core/query.ts` — read-side retrieval; `executeQuery`, `executeGet`, scoring
- `src/core/read-snapshot.ts` — read pipeline orchestrator (126 lines); `readSnapshot`
- `src/core/run-manifests.ts` — per-run audit manifests; `writeRunManifest`, `readRunManifests`
- `src/core/selectors.ts` — row selector DSL; `validateRowSelector`, `matchesRowSelector`, `selectEffectiveRows`
- `src/core/source-citations.ts` — reverse citation index; `buildSourceCitationIndex`
- `src/core/state.ts` — EffectiveState projection (612 lines); `buildEffectiveState`, lifecycle application
- `src/core/workspace.ts` — path/config/actor resolution; `openWorkspace`, `KnbWorkspace`
- `scripts/sync-schema.ts` — schema sync script

**Tests — static invariants (full):**
- `tests/static/_helpers.ts` — test utilities: `readSourceFiles`, `stripComments`, `stripCommentsAndStrings`, `findMatches`
- `tests/static/apply-add-ownership.test.ts` — enforces write-path ownership; only apply.ts calls writeLedger; add delegates to apply
- `tests/static/cli-adapter-thinness.test.ts` — enforces CLI thinness; forbidden direct pipeline calls; approved imports only
- `tests/static/contract-schema-ownership.test.ts` — no legacy module imports; schema owned by contract.ts
- `tests/static/ledger-ownership.test.ts` — only ledger.ts calls appendFile/unlink
- `tests/static/legacy-cleanup.test.ts` — no validate/append aliases; no KB shorthand
- `tests/static/projection-ownership.test.ts` — projection path writes restricted to projections module
- `tests/static/runtime-determinism.test.ts` — no Date/random calls outside knb.ts
- `tests/static/state-boundaries.test.ts` — lifecycle mutation ownership boundaries
- `tests/static/iran-fixture.expected.md` — golden render output for projection tests

**Tests — integration (full):**
- `tests/e2e-agent-loop.test.ts` — end-to-end agent workflow via CLI binary; full apply→check→context→render loop
- `tests/facade.test.ts` — facade integration tests; exercises `openKnb` + all major methods including `init`, `status`, `apply`, `check`, `get`, `query`, `context`, `render`, `rebuildIndex`, `log`

**Tests — unit codemaps (signatures only):**
- `tests/apply.test.ts` — apply pipeline unit tests
- `tests/cli.test.ts` — CLI adapter tests
- `tests/context.test.ts` — context scoring and ranking tests
- `tests/contract.test.ts` — contract validation, schema, samples, referenceFields
- `tests/errors.test.ts` — error type and exit code tests
- `tests/ledger.test.ts` — JSONL load/lock/write tests
- `tests/novelty.test.ts` — claim novelty classification tests
- `tests/novelty-projection.test.ts` — novelty+projection integration
- `tests/output.test.ts` — envelope rendering tests
- `tests/profiles.test.ts` — profile validation tests
- `tests/projections.test.ts` — view/index/freshness tests
- `tests/public-api-request-names.test.ts` — camelCase enforcement on public request types
- `tests/query.test.ts` — query/get retrieval tests
- `tests/read-side.test.ts` — read snapshot + facade read methods
- `tests/selectors.test.ts` — row selector DSL tests
- `tests/state.test.ts` — EffectiveState projection tests
- `tests/validator.test.ts` — validation tests
- `tests/wiring.test.ts` — module wiring tests
- `tests/workspace.test.ts` — workspace resolution tests
- `tests/write-path-validation.test.ts` — write-path validation tests

**Config:**
- `package.json` — name `knb`; no production deps; exports `{ ".": "./src/index.ts" }`; bin `knb: ./src/cli.ts`
- `tsconfig.json` — TypeScript config
</selected_context>

<relationships>
- `openKnb(options)` → `openWorkspace` → `makeKnb(workspace, runtime)` → returns `Knb` facade closure
- `Knb.apply(request)` → `applyOperations(toCoreApplyRequest(request), { workspace, runtime, actor, classifyNovelty })` → `writeLedger(...)` (acquires lock, runs transaction, appends)
- `Knb.query/get/context/render/check/rebuildIndex` → `readSnapshot(workspace)` → `requireState(snapshot, op)` → delegates to `executeQuery/executeGet/buildContext/renderCollection/checkFromSnapshot/rebuildIndexes`
- `readSnapshot` orchestrates: `loadLedger` → `validateLedger` → optional `validateProfilesForWorkspace` → optional `buildEffectiveState` → optional `checkFreshness`
- `applyOperations` uses `classifyNovelty` callback injected by `knb.ts` via `noveltyBridge` (which calls `classifyClaim`)
- `buildContext` and `executeQuery` both receive `EffectiveState` from `readSnapshot`; neither loads ledgers independently
- `JsonProjectionArtifactStore` is constructed once in `makeKnb` and reused across all render/index/freshness calls
- `src/index.ts` re-exports public API; selectors (`matchesRowSelector`, `selectEffectiveRows`, `validateRowSelector`) are value-exported (not type-only)
- Static tests in `tests/static/` import from `./_helpers.ts` and scan source files as text — they are static analysis tests, not functional tests
- `scripts/sync-schema.ts` regenerates `knb/schema.json` from `contract.jsonSchema()`; a sync test enforces they match
</relationships>

<ambiguities>
- **`Knb` type vs `makeKnb` implementation diverge**: `makeKnb` adds `runtime`, `previewApply`, `renderAll`, `collectionStatus`, `collections`, `log` methods to the returned object — but the exported `Knb` type in `knb.ts` (codemap) may not expose all of them. Check whether `src/index.ts` exports the correct complete `Knb` type and whether `CheckResult` type is exported. The `library-usage.md` describes `check()` but `CheckResult` doesn't appear in `src/index.ts` exports.
- **`readSnapshot` uses `freshness: false` in most facade methods**: Only `status` and `check` pass a real freshness probe; `query`, `context`, `get`, `render`, `rebuildIndex` all pass `freshness: false`. This means most read operations never check projection staleness — confirm whether this is intentional or a gap.
- **`contract.ts` is a 1975-line monolith**: It owns types, validation (1000+ lines of inline validators), JSON Schema generation, samples, and draft completion. The `agent-first-cli.md` spec says "contract module should be the single seam" — evaluate whether this concentration creates maintenance problems or whether the module-depth principle justifies it.
- **`ExternalRef` type mismatch**: The `knb/schema.json` `external_ref` def includes optional `path` field; the TypeScript `ExternalRef` type in `contract.ts` may only declare `{ system: string; id: string }`. Verify if there's a drift between schema and TypeScript types.
- **`Knb.log` is not documented in `library-usage.md`** but is visible in the facade implementation in `knb.ts`. Determine if this is an oversight or intentionally undocumented.
- **`scope` anchor requirement for lifecycle ops**: The spec says "if a lifecycle operation omits scope, apply derives it from the referenced target rows; validation fails if no anchored scope can be derived." Verify that `deriveScope` and `pickFirstAnchor` in `apply.ts` implement this exactly.
</ambiguities>

</user_instructions>
