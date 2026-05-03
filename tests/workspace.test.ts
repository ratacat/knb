import { describe, expect, test } from "bun:test";
import { isAbsolute, join, sep } from "node:path";

import { isKnbError } from "../src/core/errors";
import { openWorkspace, type ExecResult, type OpenWorkspaceOptions } from "../src/core/workspace";

type FileMap = Record<string, string>;

const ROOT = `${sep}repo`;

function fileSystem(initial: FileMap): {
  files: FileMap;
  readFile: (path: string) => Promise<string>;
} {
  const files: FileMap = { ...initial };
  return {
    files,
    readFile: async (path: string) => {
      const value = files[path];
      if (value === undefined) {
        const error: NodeJS.ErrnoException = Object.assign(new Error(`ENOENT: ${path}`), { code: "ENOENT" });
        throw error;
      }
      return value;
    },
  };
}

type ExecFn = (cmd: string, args: string[]) => Promise<ExecResult | undefined>;

function noopExec(): ExecFn {
  return async () => undefined;
}

function makeOptions(overrides: Partial<OpenWorkspaceOptions>): OpenWorkspaceOptions {
  return {
    cwd: () => ROOT,
    env: {},
    exec: noopExec(),
    systemUser: () => undefined,
    ...overrides,
  };
}

describe("openWorkspace.config precedence", () => {
  test("explicit configPath wins over KNB_CONFIG and .knb/config.json", async () => {
    const { readFile } = fileSystem({
      [`${sep}explicit.json`]: JSON.stringify({ ledger: "explicit/ledger.jsonl" }),
      [`${sep}env.json`]: JSON.stringify({ ledger: "env/ledger.jsonl" }),
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "fs/ledger.jsonl" }),
    });
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        configPath: `${sep}explicit.json`,
        env: { KNB_CONFIG: `${sep}env.json` },
        readFile,
      }),
    );
    expect(ws.configPath).toBe(`${sep}explicit.json`);
    expect(ws.config.ledger).toBe("explicit/ledger.jsonl");
    expect(ws.paths.ledger).toBe(join(ROOT, "explicit", "ledger.jsonl"));
  });

  test("KNB_CONFIG wins over .knb/config.json", async () => {
    const { readFile } = fileSystem({
      [`${sep}env.json`]: JSON.stringify({ ledger: "env/ledger.jsonl" }),
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "fs/ledger.jsonl" }),
    });
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        env: { KNB_CONFIG: `${sep}env.json` },
        readFile,
      }),
    );
    expect(ws.configPath).toBe(`${sep}env.json`);
    expect(ws.config.ledger).toBe("env/ledger.jsonl");
  });

  test("empty KNB_CONFIG is treated as unset", async () => {
    const fsConfig = JSON.stringify({ ledger: "fs/ledger.jsonl" });
    const { readFile } = fileSystem({ [join(ROOT, ".knb", "config.json")]: fsConfig });
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, env: { KNB_CONFIG: "" }, readFile }),
    );
    expect(ws.configPath).toBe(join(ROOT, ".knb", "config.json"));
    expect(ws.config.ledger).toBe("fs/ledger.jsonl");
  });

  test(".knb/config.json wins when no explicit or env config is set", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "fs/ledger.jsonl" }),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.configPath).toBe(join(ROOT, ".knb", "config.json"));
    expect(ws.config.ledger).toBe("fs/ledger.jsonl");
  });

  test("no config file yields empty config and no configPath", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.configPath).toBeUndefined();
    expect(ws.config).toEqual({});
  });

  test("empty config object {} does not override defaults", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({}),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.config).toEqual({});
    expect(ws.paths.ledger).toBe(join(ROOT, "knb", "ledger.jsonl"));
    expect(ws.paths.schema).toBe(join(ROOT, "knb", "schema.json"));
    expect(ws.paths.views).toBe(join(ROOT, "knb", "views"));
    expect(ws.paths.indexes).toBe(join(ROOT, "knb", "indexes"));
    expect(ws.paths.profiles).toBe(join(ROOT, "knb", "profiles"));
  });

  test("config with extra unknown fields is silently retained without affecting paths", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({
        ledger: "data/ledger.jsonl",
        someUnknown: 42,
        anotherWeirdField: { nested: true },
      }),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.ledger).toBe(join(ROOT, "data", "ledger.jsonl"));
    expect((ws.config as Record<string, unknown>).someUnknown).toBe(42);
  });
});

describe("openWorkspace.root resolution", () => {
  test("explicit root is resolved as-is", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.root).toBe(ROOT);
  });

  test("trailing slash on root is normalized away", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: `${ROOT}${sep}`, readFile }));
    expect(ws.root).toBe(ROOT);
    expect(ws.paths.ledger).toBe(join(ROOT, "knb", "ledger.jsonl"));
  });

  test("walks up from cwd until it finds .knb/config.json", async () => {
    const nested = join(ROOT, "a", "b", "c");
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "data/ledger.jsonl" }),
    });
    const ws = await openWorkspace(makeOptions({ cwd: () => nested, readFile }));
    expect(ws.root).toBe(ROOT);
    expect(ws.configPath).toBe(join(ROOT, ".knb", "config.json"));
    expect(ws.paths.ledger).toBe(join(ROOT, "data", "ledger.jsonl"));
  });

  test("falls back to cwd when walk-up finds no .knb/config.json", async () => {
    const nested = join(ROOT, "a", "b", "c");
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ cwd: () => nested, readFile }));
    expect(ws.root).toBe(nested);
    expect(ws.configPath).toBeUndefined();
    expect(ws.paths.ledger).toBe(join(nested, "knb", "ledger.jsonl"));
  });

  test("explicit root suppresses walk-up", async () => {
    const nested = join(ROOT, "a", "b");
    const otherRoot = `${sep}elsewhere`;
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "data/ledger.jsonl" }),
    });
    const ws = await openWorkspace(makeOptions({ root: otherRoot, cwd: () => nested, readFile }));
    expect(ws.root).toBe(otherRoot);
    expect(ws.configPath).toBeUndefined();
    expect(ws.paths.ledger).toBe(join(otherRoot, "knb", "ledger.jsonl"));
  });

  test("absolute root outside cwd works", async () => {
    const absoluteRoot = `${sep}some${sep}other${sep}place`;
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: absoluteRoot, cwd: () => ROOT, readFile }));
    expect(ws.root).toBe(absoluteRoot);
    expect(ws.paths.ledger).toBe(join(absoluteRoot, "knb", "ledger.jsonl"));
    expect(ws.paths.lock).toBe(join(absoluteRoot, ".knb", "ledger.lock"));
  });
});

describe("openWorkspace.path normalization", () => {
  test("explicit --ledger wins over config ledger", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "config/ledger.jsonl" }),
    });
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, ledgerPath: "cli/ledger.jsonl", readFile }),
    );
    expect(ws.paths.ledger).toBe(join(ROOT, "cli", "ledger.jsonl"));
  });

  test("explicit --ledger absolute wins over absolute config ledger", async () => {
    const cliAbs = `${sep}cli${sep}ledger.jsonl`;
    const cfgAbs = `${sep}cfg${sep}ledger.jsonl`;
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: cfgAbs }),
    });
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, ledgerPath: cliAbs, readFile }),
    );
    expect(ws.paths.ledger).toBe(cliAbs);
  });

  test("relative paths are normalized under root with default values", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.ledger).toBe(join(ROOT, "knb", "ledger.jsonl"));
    expect(ws.paths.schema).toBe(join(ROOT, "knb", "schema.json"));
    expect(ws.paths.views).toBe(join(ROOT, "knb", "views"));
    expect(ws.paths.indexes).toBe(join(ROOT, "knb", "indexes"));
    expect(ws.paths.profiles).toBe(join(ROOT, "knb", "profiles"));
    expect(ws.paths.lock).toBe(join(ROOT, ".knb", "ledger.lock"));
    expect(ws.paths.config).toBe(join(ROOT, ".knb", "config.json"));
  });

  test("config-supplied relative paths are normalized under root", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({
        ledger: "data/ledger.jsonl",
        schema: "data/schema.json",
        views: "data/views",
        indexes: "data/indexes",
      }),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.ledger).toBe(join(ROOT, "data", "ledger.jsonl"));
    expect(ws.paths.schema).toBe(join(ROOT, "data", "schema.json"));
    expect(ws.paths.views).toBe(join(ROOT, "data", "views"));
    expect(ws.paths.indexes).toBe(join(ROOT, "data", "indexes"));
  });

  test("config-supplied absolute paths are preserved as-is", async () => {
    const absLedger = `${sep}var${sep}lib${sep}knb${sep}ledger.jsonl`;
    const absSchema = `${sep}var${sep}lib${sep}knb${sep}schema.json`;
    const absViews = `${sep}var${sep}lib${sep}knb${sep}views`;
    const absIndexes = `${sep}var${sep}lib${sep}knb${sep}indexes`;
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({
        ledger: absLedger,
        schema: absSchema,
        views: absViews,
        indexes: absIndexes,
      }),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.ledger).toBe(absLedger);
    expect(ws.paths.schema).toBe(absSchema);
    expect(ws.paths.views).toBe(absViews);
    expect(ws.paths.indexes).toBe(absIndexes);
    expect(isAbsolute(ws.paths.ledger)).toBe(true);
  });

  test("absolute ledger path is preserved", async () => {
    const absolute = `${sep}absolute${sep}ledger.jsonl`;
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, ledgerPath: absolute, readFile }),
    );
    expect(isAbsolute(ws.paths.ledger)).toBe(true);
    expect(ws.paths.ledger).toBe(absolute);
  });

  test("lock path always lives at <root>/.knb/ledger.lock regardless of config.ledger", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ ledger: "elsewhere/ledger.jsonl" }),
    });
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.lock).toBe(join(ROOT, ".knb", "ledger.lock"));
  });

  test("paths.config matches resolved configPath when one exists", async () => {
    const cfgPath = `${sep}env.json`;
    const { readFile } = fileSystem({
      [cfgPath]: JSON.stringify({ ledger: "x/ledger.jsonl" }),
    });
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, env: { KNB_CONFIG: cfgPath }, readFile }),
    );
    expect(ws.paths.config).toBe(cfgPath);
    expect(ws.configPath).toBe(cfgPath);
  });

  test("paths.config defaults to <root>/.knb/config.json when none exists", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.paths.config).toBe(join(ROOT, ".knb", "config.json"));
    expect(ws.configPath).toBeUndefined();
  });
});

describe("openWorkspace.actor precedence", () => {
  function execReturning(map: Record<string, ExecResult>): ExecFn {
    return async (cmd, args) => {
      const key = `${cmd} ${args.join(" ")}`;
      return map[key];
    };
  }

  test("explicit actor wins over everything", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        actor: "agent:explicit",
        env: { KNB_ACTOR: "env-actor" },
        exec: execReturning({ "git config user.email": { stdout: "git@example.com\n", status: 0 } }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("agent:explicit");
  });

  test("KNB_ACTOR wins over git and system", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        env: { KNB_ACTOR: "env-actor" },
        exec: execReturning({ "git config user.email": { stdout: "git@example.com\n", status: 0 } }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("env-actor");
  });

  test("empty KNB_ACTOR is treated as unset", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        env: { KNB_ACTOR: "" },
        exec: noopExec(),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("sysuser");
  });

  test("empty explicit actor is treated as unset", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        actor: "",
        env: { KNB_ACTOR: "env-actor" },
        readFile,
      }),
    );
    expect(ws.actor).toBe("env-actor");
  });

  test("config.actor is used when no explicit/env override", async () => {
    const { readFile } = fileSystem({
      [join(ROOT, ".knb", "config.json")]: JSON.stringify({ actor: "config-actor" }),
    });
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: execReturning({ "git config user.email": { stdout: "git@example.com\n", status: 0 } }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("config-actor");
  });

  test("git user.email wins over user.name and system", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: execReturning({
          "git config user.email": { stdout: "git@example.com\n", status: 0 },
          "git config user.name": { stdout: "Git Name\n", status: 0 },
        }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("git@example.com");
  });

  test("git user.name wins over system when email is missing", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: execReturning({
          "git config user.name": { stdout: "Git Name\n", status: 0 },
        }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("Git Name");
  });

  test("git non-zero status is ignored (falls through to next tier)", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: execReturning({
          "git config user.email": { stdout: "ignored@example.com\n", status: 1 },
          "git config user.name": { stdout: "Ignored Name\n", status: 128 },
        }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("sysuser");
  });

  test("git stdout that is whitespace-only is ignored", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: execReturning({
          "git config user.email": { stdout: "   \n  \n", status: 0 },
        }),
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("sysuser");
  });

  test("git exec throwing is caught and falls through", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({
        root: ROOT,
        exec: async () => {
          throw new Error("git: command not found");
        },
        systemUser: () => "sysuser",
        readFile,
      }),
    );
    expect(ws.actor).toBe("sysuser");
  });

  test("system user is the next fallback", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, systemUser: () => "sysuser", readFile }),
    );
    expect(ws.actor).toBe("sysuser");
  });

  test("falls back to 'unknown' when nothing else resolves", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(makeOptions({ root: ROOT, readFile }));
    expect(ws.actor).toBe("unknown");
  });

  test("empty system user is treated as unset", async () => {
    const { readFile } = fileSystem({});
    const ws = await openWorkspace(
      makeOptions({ root: ROOT, systemUser: () => "", readFile }),
    );
    expect(ws.actor).toBe("unknown");
  });
});

describe("openWorkspace.config errors", () => {
  test("malformed config JSON throws KnbError(io_failed) with path in details", async () => {
    const configPath = join(ROOT, ".knb", "config.json");
    const { readFile } = fileSystem({ [configPath]: "{not json" });
    let thrown: unknown;
    try {
      await openWorkspace(makeOptions({ root: ROOT, readFile }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    expect(isKnbError(thrown)).toBe(true);
    if (!isKnbError(thrown)) throw new Error("unreachable");
    expect(thrown.code).toBe("io_failed");
    expect(thrown.details?.path).toBe(configPath);
  });

  test("malformed config preserves original SyntaxError as cause", async () => {
    const configPath = join(ROOT, ".knb", "config.json");
    const { readFile } = fileSystem({ [configPath]: "{not json" });
    let thrown: unknown;
    try {
      await openWorkspace(makeOptions({ root: ROOT, readFile }));
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeDefined();
    const cause = (thrown as { cause?: unknown }).cause;
    expect(cause).toBeInstanceOf(SyntaxError);
  });

  test("config that is JSON null throws KnbError(io_failed)", async () => {
    const configPath = join(ROOT, ".knb", "config.json");
    const { readFile } = fileSystem({ [configPath]: "null" });
    let thrown: unknown;
    try {
      await openWorkspace(makeOptions({ root: ROOT, readFile }));
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    if (!isKnbError(thrown)) throw new Error("unreachable");
    expect(thrown.code).toBe("io_failed");
    expect(thrown.message).toContain("must be a JSON object");
    expect(thrown.details?.path).toBe(configPath);
  });

  test("config that is a JSON array throws KnbError(io_failed)", async () => {
    const configPath = join(ROOT, ".knb", "config.json");
    const { readFile } = fileSystem({ [configPath]: "[]" });
    let thrown: unknown;
    try {
      await openWorkspace(makeOptions({ root: ROOT, readFile }));
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    if (!isKnbError(thrown)) throw new Error("unreachable");
    expect(thrown.code).toBe("io_failed");
    expect(thrown.message).toContain("must be a JSON object");
  });

  test("non-ENOENT IO error on config read throws KnbError(io_failed)", async () => {
    const configPath = `${sep}env.json`;
    const readFile = async (path: string) => {
      if (path === configPath) {
        const error: NodeJS.ErrnoException = Object.assign(new Error("EACCES"), { code: "EACCES" });
        throw error;
      }
      const enoent: NodeJS.ErrnoException = Object.assign(new Error("ENOENT"), { code: "ENOENT" });
      throw enoent;
    };
    let thrown: unknown;
    try {
      await openWorkspace(
        makeOptions({ root: ROOT, env: { KNB_CONFIG: configPath }, readFile }),
      );
    } catch (error) {
      thrown = error;
    }
    expect(isKnbError(thrown)).toBe(true);
    if (!isKnbError(thrown)) throw new Error("unreachable");
    expect(thrown.code).toBe("io_failed");
    expect(thrown.details?.path).toBe(configPath);
    expect((thrown as { cause?: unknown }).cause).toBeDefined();
  });
});
