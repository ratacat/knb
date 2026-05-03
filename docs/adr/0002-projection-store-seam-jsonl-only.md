# ADR-0002: Projection Store Seam, JSON Artifacts Only in V1

Date: 2026-05-02

Status: Accepted

## Context

V1 needs generated views, generated indexes, sidecar metadata, and projection freshness checks. The design names a projection-store seam because a future SQLite-backed projection store may be useful, but no current measurement justifies adding a second adapter.

## Decision

Ship one V1 adapter: `JsonProjectionArtifactStore`. It writes disposable Markdown views, JSON indexes, and metadata under `knb/views/` and `knb/indexes/`. Keep the `ProjectionArtifactStore` interface as the seam, but do not add a SQLite adapter in this epic.

## Consequences

Generated artifacts stay simple, inspectable, and rebuildable. Future SQLite work must conform to `ProjectionArtifactStore` and should be introduced by a later epic with measurements that justify the extra dependency, migration surface, and operational complexity.
