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
