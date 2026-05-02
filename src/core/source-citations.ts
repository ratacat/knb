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
