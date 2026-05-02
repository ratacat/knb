import { mkdtemp, realpath, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CLI_PATH = join(import.meta.dir, "..", "src", "cli.ts");

type SpawnResult = { code: number; stdout: string; stderr: string };

async function runKnb(workDir: string, args: string[]): Promise<SpawnResult> {
  const proc = Bun.spawn(["bun", "run", CLI_PATH, ...args], {
    cwd: workDir,
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, KNB_CONFIG: "" },
  });
  const code = await proc.exited;
  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  return { code, stdout, stderr };
}

function fail(message: string): never {
  console.error(`release-smoke: FAIL - ${message}`);
  process.exit(1);
}

async function main(): Promise<void> {
  const raw = await mkdtemp(join(tmpdir(), "knb-release-smoke-"));
  const workDir = await realpath(raw);

  try {
    const initRun = await runKnb(workDir, ["init", "--json"]);
    if (initRun.code !== 0) {
      fail(`init exited ${initRun.code}; stderr=${initRun.stderr}`);
    }
    let initEnv: { ok: boolean; data?: { created_paths?: unknown } };
    try {
      initEnv = JSON.parse(initRun.stdout.trim()) as { ok: boolean; data?: { created_paths?: unknown } };
    } catch (error) {
      fail(`init stdout was not valid JSON: ${initRun.stdout}`);
    }
    if (!initEnv.ok) fail(`init envelope ok=false: ${initRun.stdout}`);
    const createdPaths = initEnv.data?.created_paths;
    if (!Array.isArray(createdPaths) || createdPaths.length === 0) {
      fail(`init data.created_paths not a non-empty array: ${initRun.stdout}`);
    }

    const statusRun = await runKnb(workDir, ["status", "--json"]);
    if (statusRun.code !== 0) {
      fail(`status exited ${statusRun.code}; stderr=${statusRun.stderr}`);
    }
    let statusEnv: { ok: boolean; data?: { row_count?: unknown } };
    try {
      statusEnv = JSON.parse(statusRun.stdout.trim()) as { ok: boolean; data?: { row_count?: unknown } };
    } catch (error) {
      fail(`status stdout was not valid JSON: ${statusRun.stdout}`);
    }
    if (!statusEnv.ok) fail(`status envelope ok=false: ${statusRun.stdout}`);
    if (statusEnv.data?.row_count !== 0) {
      fail(`status data.row_count expected 0, got ${String(statusEnv.data?.row_count)}`);
    }

    console.log("release-smoke: ok");
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`release-smoke: FAIL - ${(error as Error).message}`);
  process.exit(1);
});
