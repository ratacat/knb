# Context Scoring Spike

## Purpose

`knb context` ranks active syntheses, claims, and questions before it trims the packet to the token budget. This spike records the current scoring model and recommends the smallest recency option that supports current-events research without making the default output drift.

## Current Model

The current default is deterministic and lexicographic. Each row type sorts by a fixed vector, then by `id` for stable ties.

Syntheses:

1. `assessment.importance`: `high=3`, `medium=2`, `low=1`, `unknown=0`
2. `created_at`, newest first
3. basis depth, counting claim, question, and source IDs
4. `id`, ascending

Claims:

1. `assessment.importance`: `high=3`, `medium=2`, `low=1`, `unknown=0`
2. `assessment.confidence`: `high=3`, `medium=2`, `low=1`, `unknown=0`
3. `assessment.information_depth.level`: `complete=4`, `strong=3`, `partial=2`, `thin=1`, `unknown=0`
4. evidence count
5. `assessment.contested`, where contested claims rank first when all prior fields tie
6. `created_at`, newest first
7. `id`, ascending

Questions:

1. `question.priority`: `high=3`, `medium=2`, `low=1`
2. `assessment.importance`: `high=3`, `medium=2`, `low=1`, `unknown=0`
3. `created_at`, newest first
4. `id`, ascending

Warnings use the same profile indirectly. The thin-evidence warning fires when a selected claim has fewer than two evidence entries. Truncation also uses the default importance and priority maps when it decides which claims, questions, and source detail to drop first.

## Recommendation

Use a linear recency window:

```ts
type ContextRecencyProfile = {
  windowDays: number;
  weight: number;
};
```

For each row, compute:

```ts
ageDays = max(0, anchor - row.created_at)
recency = max(0, 1 - ageDays / windowDays) * weight
```

The anchor must be deterministic:

- If the caller supplied `asOf`, use that timestamp.
- Otherwise, use the newest `created_at` among scoped active rows.

Expose one CLI flag first:

```sh
knb context --collection iran --recency-window-days 3
```

The CLI flag maps to the TypeScript facade option `recencyWindowDays` and enables recency with `weight=1`. The library profile can expose both `windowDays` and `weight` so host applications can make recency stronger without adding more CLI surface.

## Rationale

Linear window scoring is easier to explain than half-life decay: rows inside the window receive a visible bonus, and rows outside it receive none. `recencyWindowDays` is concrete, maps to research practice, and avoids the misleading precision of "half-life" for human-written knowledge rows.

The default profile should leave recency disabled. With no `recency` profile, `buildContext` must produce byte-for-byte equivalent ranking to the current implementation. This protects existing callers and makes the feature opt-in.

## Implementation Notes

Add recency as a score component, not as a replacement for the existing maps. The default score functions should accept a profile and an anchor, but with recency disabled they should return the same values and sort order they return now.

When both `asOf` and recency are supplied, compute age relative to `asOf`, not wall-clock time. This makes historical context packets reproducible.
