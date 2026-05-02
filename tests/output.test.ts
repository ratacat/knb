import { describe, expect, test } from "bun:test";

import { knbError } from "../src/core/errors";
import {
  failure,
  render,
  renderJson,
  renderNdjson,
  renderPrettyJson,
  success,
  type CommandResult,
  type OutputFormat,
} from "../src/core/output";

class BufferStream {
  chunks: string[] = [];
  write(chunk: string | Uint8Array): boolean {
    this.chunks.push(typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8"));
    return true;
  }
  text(): string {
    return this.chunks.join("");
  }
}

function streams(): { stdout: BufferStream; stderr: BufferStream } {
  return { stdout: new BufferStream(), stderr: new BufferStream() };
}

describe("output.success envelope", () => {
  test("includes ok, command, data, and meta", () => {
    const result = success("query", [{ id: "x" }], { ledger: "knb/ledger.jsonl", rows_read: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.command).toBe("query");
    expect(result.data).toEqual([{ id: "x" }]);
    expect(result.meta.ledger).toBe("knb/ledger.jsonl");
    expect(result.meta.rows_read).toBe(1);
  });

  test("default meta is empty object", () => {
    const result = success("status", { x: 1 });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.meta).toEqual({});
  });

  test("meta only includes elapsed_ms when set by caller", () => {
    const without = success("status", null);
    expect(without.ok).toBe(true);
    if (!without.ok) throw new Error("unreachable");
    expect("elapsed_ms" in without.meta).toBe(false);

    const withEms = success("status", null, { elapsed_ms: 12 });
    expect(withEms.ok).toBe(true);
    if (!withEms.ok) throw new Error("unreachable");
    expect(withEms.meta.elapsed_ms).toBe(12);
  });

  test("renderJson produces compact one-line envelope", () => {
    const result = success("status", { row_count: 0 }, { elapsed_ms: 5 });
    const json = renderJson(result);
    expect(json).toBe(JSON.stringify({ ok: true, command: "status", data: { row_count: 0 }, meta: { elapsed_ms: 5 } }));
    expect(json.includes("\n")).toBe(false);
  });

  test("renders to injected stdout when format=json", () => {
    const { stdout, stderr } = streams();
    const result = success("status", { row_count: 0 });
    const { exitCode } = render(result, { format: "json", stdout, stderr });
    expect(exitCode).toBe(0);
    expect(stdout.text()).toBe(`${renderJson(result)}\n`);
    expect(stderr.text()).toBe("");
  });

  test("render returns ONLY exitCode (no extra fields)", () => {
    const { stdout, stderr } = streams();
    const r = render(success("x", "h"), { format: "json", stdout, stderr });
    expect(Object.keys(r)).toEqual(["exitCode"]);
    expect(typeof r.exitCode).toBe("number");
  });
});

describe("output.failure envelope", () => {
  test("includes ok=false, error, and exit_code in meta", () => {
    const result = failure("apply", knbError("validation_failed", "bad", { path: "ops[0]" }));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error.code).toBe("validation_failed");
    expect(result.error.message).toBe("bad");
    expect(result.error.details).toEqual({ path: "ops[0]" });
    expect(result.meta.exit_code).toBe(3);
    expect(result.command).toBe("apply");
  });

  test("error envelope omits details when undefined", () => {
    const result = failure("apply", knbError("not_found", "missing"));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect("details" in result.error).toBe(false);
  });

  test("failure with undefined command omits the command field from envelope", () => {
    const result = failure(undefined, knbError("not_found", "missing"));
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.command).toBeUndefined();
    const json = JSON.parse(renderJson(result));
    expect("command" in json).toBe(false);
    expect(json).toEqual({
      ok: false,
      error: { code: "not_found", message: "missing" },
      meta: { exit_code: 1 },
    });
  });

  test("explicit meta.exit_code overrides derived value", () => {
    const result = failure("apply", knbError("validation_failed", "bad"), { exit_code: 99 });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.meta.exit_code).toBe(99);
  });

  test("envelope meta.exit_code matches what render returns", () => {
    const result = failure("apply", knbError("lock_busy", "held"));
    const { stdout, stderr } = streams();
    const { exitCode } = render(result, { format: "json", stdout, stderr });
    if (result.ok) throw new Error("unreachable");
    expect(exitCode).toBe(result.meta.exit_code);
    expect(exitCode).toBe(6);
  });

  test("renders to injected stderr, never stdout", () => {
    const { stdout, stderr } = streams();
    const result = failure("apply", knbError("lock_busy", "held"));
    const { exitCode } = render(result, { format: "json", stdout, stderr });
    expect(exitCode).toBe(6);
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toContain('"code":"lock_busy"');
    expect(stderr.text()).toContain('"exit_code":6');
    expect(stderr.text().endsWith("\n")).toBe(true);
  });

  test("exit code returned matches exitCodeForError for every code", () => {
    const cases: Array<[Parameters<typeof knbError>[0], number]> = [
      ["not_found", 1],
      ["invalid_arguments", 2],
      ["validation_failed", 3],
      ["duplicate_blocked", 4],
      ["io_failed", 5],
      ["lock_busy", 6],
      ["broken_reference", 7],
      ["external_dependency_failed", 8],
      ["unsafe_operation_refused", 9],
      ["internal_error", 10],
    ];
    for (const [code, expected] of cases) {
      const { stdout, stderr } = streams();
      const result = failure("x", knbError(code, "x"));
      const { exitCode } = render(result, { format: "json", stdout, stderr });
      expect(exitCode).toBe(expected);
    }
  });

  test("derived exit_code is correct in the envelope itself", () => {
    const r = failure("apply", knbError("broken_reference", "ref"));
    if (r.ok) throw new Error("unreachable");
    expect(r.meta.exit_code).toBe(7);
  });
});

describe("output.format selection", () => {
  test("auto + isTty=true renders human text to stdout", () => {
    const { stdout, stderr } = streams();
    const result = success("query", "hello world");
    render(result, { format: "auto", isTty: true, stdout, stderr });
    expect(stdout.text()).toBe("hello world\n");
    expect(stderr.text()).toBe("");
  });

  test("auto + isTty=false renders compact JSON to stdout", () => {
    const { stdout, stderr } = streams();
    const result = success("query", { id: "x" });
    render(result, { format: "auto", isTty: false, stdout, stderr });
    expect(stdout.text()).toBe(`${renderJson(result)}\n`);
    expect(stderr.text()).toBe("");
  });

  test("undefined format defaults to auto", () => {
    const { stdout, stderr } = streams();
    const result = success("query", { id: "x" });
    render(result, { isTty: false, stdout, stderr });
    expect(stdout.text()).toBe(`${renderJson(result)}\n`);
  });

  test("explicit json renders compact JSON regardless of TTY", () => {
    for (const isTty of [true, false]) {
      const { stdout, stderr } = streams();
      const result = success("q", { id: "y" });
      render(result, { format: "json", isTty, stdout, stderr });
      expect(stdout.text()).toBe(`${renderJson(result)}\n`);
      expect(stderr.text()).toBe("");
    }
  });

  test("explicit pretty renders pretty JSON regardless of TTY", () => {
    for (const isTty of [true, false]) {
      const { stdout, stderr } = streams();
      const result = success("q", { id: "y" });
      render(result, { format: "pretty", isTty, stdout, stderr });
      expect(stdout.text()).toBe(`${renderPrettyJson(result)}\n`);
      expect(stdout.text()).toContain("\n  ");
    }
  });

  test("explicit text renders human text regardless of TTY", () => {
    for (const isTty of [true, false]) {
      const { stdout, stderr } = streams();
      const result = success("q", "hi");
      render(result, { format: "text", isTty, stdout, stderr });
      expect(stdout.text()).toBe("hi\n");
    }
  });

  test("--pretty produces indented JSON", () => {
    const { stdout, stderr } = streams();
    const result = success("status", { row_count: 0 });
    render(result, { format: "pretty", stdout, stderr });
    expect(stdout.text()).toBe(`${renderPrettyJson(result)}\n`);
    expect(stdout.text()).toContain("\n  ");
    expect(stdout.text().endsWith("\n")).toBe(true);
  });

  test("--ndjson for an array data writes one line per item plus envelope", () => {
    const { stdout, stderr } = streams();
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const result = success("query", items, { rows_returned: 3 });
    render(result, { format: "ndjson", stdout, stderr });
    const expected = renderNdjson(result);
    expect(stdout.text()).toBe(expected);
    const lines = stdout.text().trim().split("\n");
    expect(lines.length).toBe(4);
    expect(JSON.parse(lines[0]!)).toEqual({ id: "a" });
    expect(JSON.parse(lines[1]!)).toEqual({ id: "b" });
    expect(JSON.parse(lines[2]!)).toEqual({ id: "c" });
    expect(JSON.parse(lines[3]!).meta.rows_returned).toBe(3);
    expect(JSON.parse(lines[3]!).ok).toBe(true);
    expect(stdout.text().endsWith("\n")).toBe(true);
  });

  test("--ndjson with empty array emits only the envelope line", () => {
    const { stdout, stderr } = streams();
    const result = success("query", [], { rows_returned: 0 });
    render(result, { format: "ndjson", stdout, stderr });
    const lines = stdout.text().trim().split("\n");
    expect(lines.length).toBe(1);
    const env = JSON.parse(lines[0]!);
    expect(env.ok).toBe(true);
    expect(env.data).toEqual([]);
    expect(env.meta.rows_returned).toBe(0);
  });

  test("--ndjson for non-array data emits a single envelope line", () => {
    const { stdout, stderr } = streams();
    const result = success("status", { row_count: 0 });
    render(result, { format: "ndjson", stdout, stderr });
    const lines = stdout.text().trim().split("\n");
    expect(lines.length).toBe(1);
    expect(JSON.parse(lines[0]!).data).toEqual({ row_count: 0 });
  });

  test("--ndjson failure emits a single envelope line on stderr", () => {
    const { stdout, stderr } = streams();
    const result = failure("query", knbError("not_found", "missing"));
    const { exitCode } = render(result, { format: "ndjson", stdout, stderr });
    expect(exitCode).toBe(1);
    expect(stdout.text()).toBe("");
    const lines = stderr.text().trim().split("\n");
    expect(lines.length).toBe(1);
    const env = JSON.parse(lines[0]!);
    expect(env.ok).toBe(false);
    expect(env.error.code).toBe("not_found");
  });

  test("unknown format value falls back to human text", () => {
    const { stdout, stderr } = streams();
    const result = success("q", "hello");
    const { exitCode } = render(result, { format: "yaml" as OutputFormat, stdout, stderr });
    expect(exitCode).toBe(0);
    expect(stdout.text()).toBe("hello\n");
    expect(stderr.text()).toBe("");
  });
});

describe("output.quiet mode", () => {
  test("success writes nothing to either stream", () => {
    const { stdout, stderr } = streams();
    const result = success("apply", { rows_appended: 3 });
    const { exitCode } = render(result, { format: "quiet", stdout, stderr });
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toBe("");
    expect(exitCode).toBe(0);
  });

  test("failure writes ONLY the error code line to stderr", () => {
    const { stdout, stderr } = streams();
    const result = failure("apply", knbError("duplicate_blocked", "dup"));
    const { exitCode } = render(result, { format: "quiet", stdout, stderr });
    expect(stdout.text()).toBe("");
    expect(stderr.text()).toBe("duplicate_blocked\n");
    expect(exitCode).toBe(4);
  });

  test("quiet failure does not include message or details", () => {
    const { stdout, stderr } = streams();
    const result = failure("apply", knbError("validation_failed", "bad row", { p: 1 }));
    render(result, { format: "quiet", stdout, stderr });
    expect(stderr.text()).not.toContain("bad row");
    expect(stderr.text()).not.toContain("\"p\"");
    expect(stderr.text()).toBe("validation_failed\n");
  });
});

describe("output.text rendering", () => {
  test("error text includes code, message, and details", () => {
    const { stdout, stderr } = streams();
    const result: CommandResult = failure(
      "validate",
      knbError("validation_failed", "bad row", { path: "ops[0]" }),
    );
    render(result, { format: "text", stdout, stderr });
    expect(stderr.text()).toContain("validation_failed");
    expect(stderr.text()).toContain("bad row");
    expect(stderr.text()).toContain("ops[0]");
    expect(stdout.text()).toBe("");
    expect(stderr.text().endsWith("\n")).toBe(true);
  });

  test("error text without details omits the details segment", () => {
    const { stdout, stderr } = streams();
    const result = failure("validate", knbError("not_found", "missing"));
    render(result, { format: "text", stdout, stderr });
    expect(stderr.text()).toBe("not_found: missing\n");
  });

  test("success null/undefined prints OK", () => {
    const { stdout, stderr } = streams();
    render(success("apply", null), { format: "text", stdout, stderr });
    expect(stdout.text()).toBe("OK\n");
    expect(stderr.text()).toBe("");
  });

  test("success empty array prints zero-rows marker", () => {
    const { stdout, stderr } = streams();
    render(success("query", []), { format: "text", stdout, stderr });
    expect(stdout.text()).toBe("OK (0 rows)\n");
  });

  test("success string is printed verbatim with newline", () => {
    const { stdout, stderr } = streams();
    render(success("status", "hello world"), { format: "text", stdout, stderr });
    expect(stdout.text()).toBe("hello world\n");
    expect(stderr.text()).toBe("");
  });
});

describe("output.render side-effects", () => {
  test("does NOT call process.exit (caller's responsibility)", () => {
    const { stdout, stderr } = streams();
    const result = failure("apply", knbError("internal_error", "boom"));
    const before = process.exitCode;
    render(result, { format: "json", stdout, stderr });
    expect(process.exitCode).toBe(before);
  });

  test("returns the result object — caller can inspect after invocation", () => {
    const { stdout, stderr } = streams();
    const ret = render(success("apply", null), { format: "json", stdout, stderr });
    expect(ret).toBeDefined();
    expect(ret.exitCode).toBe(0);
  });
});
