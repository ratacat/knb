# Context Ranking Spike

## Purpose

`knb context` ranks active syntheses, claims, and questions before it trims the packet to the token budget. This note records the fixed internal ranking model after the public scoring customization surface was removed.

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

## Decision

Do not expose ranking weights or recency policy in the CLI or TypeScript facade. The public request controls scope, token budget, historical cutoff, and warnings. Ranking remains deterministic and private so agents can rely on stable context packets.
