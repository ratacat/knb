import { describe, expect, test } from "bun:test";
import {
  exitCodeForError,
  fromUnknown,
  isKnbError,
  knbError,
  KnbErrorBase,
  type KnbError,
  type KnbErrorCode,
} from "../src/core/errors";

const codeMap: Record<KnbErrorCode, number> = {
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

describe("errors.exitCodeForError", () => {
  for (const [code, expected] of Object.entries(codeMap) as [KnbErrorCode, number][]) {
    test(`maps ${code} -> ${expected}`, () => {
      expect(exitCodeForError(code)).toBe(expected);
      expect(exitCodeForError(knbError(code, "x"))).toBe(expected);
      expect(exitCodeForError({ code, message: "y" })).toBe(expected);
    });
  }

  test("unknown code falls back to internal_error (10)", () => {
    expect(exitCodeForError("not_a_real_code" as KnbErrorCode)).toBe(10);
    expect(exitCodeForError({ code: "not_a_real_code", message: "x" } as unknown as KnbError)).toBe(10);
  });

  test("returns numeric exit codes only — never undefined or NaN", () => {
    for (const code of Object.keys(codeMap) as KnbErrorCode[]) {
      const value = exitCodeForError(code);
      expect(typeof value).toBe("number");
      expect(Number.isInteger(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(10);
    }
  });

  test("the ten exit codes form a 1..10 bijection (no collisions, no gaps)", () => {
    const values = Object.values(codeMap).sort((a, b) => a - b);
    expect(values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });
});

describe("errors.knbError", () => {
  test("produces a thrown-able error", () => {
    const error = knbError("validation_failed", "bad row", { path: "ops[0]" });
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(KnbErrorBase);
    expect(error.code).toBe("validation_failed");
    expect(error.message).toBe("bad row");
    expect(error.details).toEqual({ path: "ops[0]" });
    expect(error.name).toBe("KnbError");
    let thrown: unknown;
    try {
      throw error;
    } catch (caught) {
      thrown = caught;
    }
    expect(thrown).toBe(error);
    expect(thrown).toBeInstanceOf(Error);
  });

  test("preserves cause when constructed with one", () => {
    const cause = new Error("underlying");
    const error = knbError("io_failed", "wrap", { path: "/tmp" }, cause);
    expect(error.cause).toBe(cause);
    expect(error.details).toEqual({ path: "/tmp" });
  });

  test("omits cause and details when not provided", () => {
    const error = knbError("internal_error", "boom");
    expect(error.cause).toBeUndefined();
    expect(error.details).toBeUndefined();
  });

  test("toJSON omits cause and stack", () => {
    const cause = new Error("underlying");
    const error = knbError("io_failed", "disk full", { path: "/tmp" }, cause);
    const json = error.toJSON();
    expect(json).toEqual({ code: "io_failed", message: "disk full", details: { path: "/tmp" } });
    expect((json as Record<string, unknown>).cause).toBeUndefined();
    expect((json as Record<string, unknown>).stack).toBeUndefined();
    const stringified = JSON.parse(JSON.stringify(error));
    expect(stringified).toEqual({
      code: "io_failed",
      message: "disk full",
      details: { path: "/tmp" },
    });
    expect(stringified.cause).toBeUndefined();
    expect(stringified.stack).toBeUndefined();
  });

  test("toJSON omits details when absent", () => {
    const error = knbError("internal_error", "boom");
    const json = error.toJSON();
    expect(json).toEqual({ code: "internal_error", message: "boom" });
    expect("details" in json).toBe(false);
  });

  test("toJSON output is itself recognized as a KnbError shape (round-trip)", () => {
    const error = knbError("not_found", "missing", { id: "x" });
    const stringified = JSON.stringify(error);
    const parsed = JSON.parse(stringified);
    expect(isKnbError(parsed)).toBe(true);
    const rehydrated = fromUnknown(parsed);
    expect(rehydrated.code).toBe("not_found");
    expect(rehydrated.message).toBe("missing");
    expect(rehydrated.details).toEqual({ id: "x" });
  });

  test("constructor stores all four fields independently", () => {
    const cause = { custom: "cause" };
    const error = new KnbErrorBase("lock_busy", "held", { who: "you" }, cause);
    expect(error.code).toBe("lock_busy");
    expect(error.message).toBe("held");
    expect(error.details).toEqual({ who: "you" });
    expect(error.cause).toBe(cause);
  });
});

describe("errors.fromUnknown", () => {
  test("wraps a plain Error as internal_error and preserves cause", () => {
    const original = new Error("boom");
    const wrapped = fromUnknown(original);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.message).toBe("boom");
    expect(wrapped.cause).toBe(original);
  });

  test("returns the same KnbErrorBase instance", () => {
    const error = knbError("lock_busy", "held");
    expect(fromUnknown(error)).toBe(error);
  });

  test("rehydrates a plain KnbError shape preserving all fields", () => {
    const cause = new Error("under");
    const plain = {
      code: "duplicate_blocked" as const,
      message: "dup",
      details: { id: "x" },
      cause,
    };
    const wrapped = fromUnknown(plain);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("duplicate_blocked");
    expect(wrapped.message).toBe("dup");
    expect(wrapped.details).toEqual({ id: "x" });
    expect(wrapped.cause).toBe(cause);
  });

  test("wraps a string as internal_error with the string as message", () => {
    const wrapped = fromUnknown("kaboom");
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.message).toBe("kaboom");
    expect(wrapped.cause).toBeUndefined();
  });

  test("wraps null as internal_error with safe default message", () => {
    const wrapped = fromUnknown(null);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("internal_error");
    expect(typeof wrapped.message).toBe("string");
    expect(wrapped.message.length).toBeGreaterThan(0);
    expect(wrapped.cause).toBe(null);
  });

  test("wraps undefined as internal_error with safe default message", () => {
    const wrapped = fromUnknown(undefined);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("internal_error");
    expect(typeof wrapped.message).toBe("string");
    expect(wrapped.message.length).toBeGreaterThan(0);
  });

  test("wraps an arbitrary value as internal_error and keeps it as cause", () => {
    const wrapped = fromUnknown(42);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.cause).toBe(42);
    expect(typeof wrapped.message).toBe("string");
  });

  test("wraps an arbitrary object (not KnbError shape) as internal_error", () => {
    const obj = { random: "stuff" };
    const wrapped = fromUnknown(obj);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.cause).toBe(obj);
  });

  test("a TypeError subclass is wrapped not returned directly", () => {
    const original = new TypeError("bad type");
    const wrapped = fromUnknown(original);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
    expect(wrapped.code).toBe("internal_error");
    expect(wrapped.message).toBe("bad type");
    expect(wrapped.cause).toBe(original);
  });

  test("preserves brand identity on rewrapped shapes", () => {
    const plain = { code: "io_failed" as const, message: "x" };
    const wrapped = fromUnknown(plain);
    expect(isKnbError(wrapped)).toBe(true);
    expect(wrapped).toBeInstanceOf(KnbErrorBase);
  });
});

describe("errors.isKnbError", () => {
  test("true for KnbErrorBase instances", () => {
    expect(isKnbError(knbError("not_found", "missing"))).toBe(true);
  });

  test("true for valid plain KnbError shapes", () => {
    expect(isKnbError({ code: "validation_failed", message: "x" })).toBe(true);
    expect(isKnbError({ code: "io_failed", message: "x", details: { p: 1 } })).toBe(true);
  });

  test("false for unknown codes", () => {
    expect(isKnbError({ code: "weird_code", message: "x" })).toBe(false);
    expect(isKnbError({ code: "", message: "x" })).toBe(false);
  });

  test("false for non-objects", () => {
    expect(isKnbError(null)).toBe(false);
    expect(isKnbError(undefined)).toBe(false);
    expect(isKnbError("validation_failed")).toBe(false);
    expect(isKnbError(7)).toBe(false);
    expect(isKnbError(true)).toBe(false);
    expect(isKnbError(Symbol("x"))).toBe(false);
  });

  test("false when message is missing", () => {
    expect(isKnbError({ code: "internal_error" })).toBe(false);
  });

  test("false when message is non-string", () => {
    expect(isKnbError({ code: "internal_error", message: 123 })).toBe(false);
    expect(isKnbError({ code: "internal_error", message: null })).toBe(false);
  });

  test("false when code is non-string", () => {
    expect(isKnbError({ code: 7, message: "x" })).toBe(false);
    expect(isKnbError({ code: null, message: "x" })).toBe(false);
  });

  test("false for plain Error without code", () => {
    expect(isKnbError(new Error("x"))).toBe(false);
  });

  test("false for an array (even with code/message-shaped contents)", () => {
    expect(isKnbError([])).toBe(false);
    expect(isKnbError([{ code: "internal_error", message: "x" }])).toBe(false);
  });

  test("recognises every code in the vocabulary", () => {
    for (const code of Object.keys(codeMap) as KnbErrorCode[]) {
      expect(isKnbError({ code, message: "m" })).toBe(true);
    }
  });

  test("survives JSON round-trip via toJSON of a KnbErrorBase", () => {
    const error = knbError("broken_reference", "ref", { id: "z" });
    const round = JSON.parse(JSON.stringify(error));
    expect(isKnbError(round)).toBe(true);
    expect(round.code).toBe("broken_reference");
    expect(round.message).toBe("ref");
    expect(round.details).toEqual({ id: "z" });
  });
});
