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
