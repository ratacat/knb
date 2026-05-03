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
