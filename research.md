# Knowledge graph research notes

This is an exploratory record book for design discussion. It is not a definitive design authority.

Use this file to capture promising mechanics, open questions, and design-space observations while the knowledge base system is still taking shape. Treat entries here as hypotheses to test, not settled decisions.

## Central question: controlled knowledge evolution

The central design problem for useful knowledge graphs may be controlled knowledge evolution.

A graph becomes valuable when it can grow, connect, prune, and synthesize knowledge over time. But if it grows without constraints, it turns into noise: duplicate nodes, vague edges, stale records, accidental schema drift, and syntheses that look confident but are hard to audit.

The design challenge is to let agents and humans increase usefulness without destroying trust.

That means the graph needs explicit rules for:

- how new nodes and edges are admitted
- how schema changes are proposed, reviewed, and rolled back
- how weak records decay or get pruned
- how contradictions are preserved until resolved
- how linked records are synthesized into higher-level understanding
- how the system decides what to surface for a task
- how every synthesis remains traceable back to evidence

The goal is not just a bigger graph. The goal is a graph that gets more useful, more navigable, and more honest as it changes.

One useful framing: treat growth, pruning, merging, contradiction, and synthesis as first-class graph events. The graph should remember not only what it currently believes, but how those beliefs got there.

## Required shapes as a retrieval mechanic

A promising mechanic: define required record and link shapes for a domain.

Instead of treating retrieval as "find related text," the system can ask whether the graph contains the shape needed to answer a class of questions. For a market-research domain, a required shape might be:

- market
- possible outcome
- supporting record
- contradicting record
- source
- time validity
- confidence or uncertainty

Then retrieval can score against the shape:

- which required records are present?
- which links are present?
- which required node or edge is missing?
- would the answer become obvious if that missing piece were filled?

This turns graph retrieval into a way to find both answers and research gaps.

## Temporal retrieval

Temporal validity should probably be queryable directly.

Agents should be able to ask for records active during a time range, records first observed after a date, or records whose evidence has gone stale. This should not rely only on prompt wording like "make sure this is current." Time should be part of the retrieval contract.

Open direction: combine temporal range filters with vector or graph retrieval. For example: "find semantically relevant records about this market, but only those active after the debate date."

## Triplets and projections

Triplets seem promising as a simple graph shape:

`subject -> predicate -> object`

Examples:

- `candidate A -> leads in -> poll X`
- `storm system -> threatens -> region Y`
- `source Z -> supports -> record Q`

RDF stands for Resource Description Framework. It is a standards-heavy way to represent graph facts as triples. Even if RDF itself is not the right default for this project, experimenting with triples could be useful because triples are easy to inspect, project, validate, and translate into other graph forms.

Open direction: keep the canonical KNB row model stable, then project selected records into triples when graph-style traversal or validation is useful.

## Hypothesis memory for markets

The "rolling incident memory" idea from cybersecurity may translate well to market research.

For a Polymarket-style market, the graph could maintain live hypotheses about each outcome. New evidence would support, contradict, weaken, or update those hypotheses.

Example shape:

- market
- outcome
- hypothesis
- supporting record
- contradicting record
- source
- time validity
- confidence

This could help an agent avoid treating every new source as isolated. The graph would remember what each source does to the current hypothesis: strengthen it, weaken it, change its scope, or make an older record stale.

Open direction: use this for research workflows where the question is not just "what happened?" but "which side of this market does this evidence move, and why?"

## PM weather-market experiment direction

Polymarket weather markets look like a good early domain for testing controlled knowledge evolution.

The possible experiment: build a PM weather-market research graph where each market has an expected shape. A useful market node should eventually connect to:

- settlement source and station
- current outcome buckets
- forecast distribution
- source-specific bias or reliability notes
- price and liquidity context
- live hypotheses for likely settlement
- evidence supporting or contradicting each hypothesis
- time validity for each record
- final settlement and postmortem notes

The graph can then score the market by missing pieces, not just by existing evidence. For example: "we have forecasts and prices, but no settlement-station behavior," or "we have a point forecast, but no distribution across the listed buckets."

This could let an agent ask a better next question:

- what missing node or edge would most change the trade decision?
- which evidence changed after the price moved?
- what did we believe before settlement?
- which source was misleading for this city/date?
- which hypotheses survived contact with settlement?

High-value loop to test:

1. Create or update a market graph from current evidence.
2. Compare the graph against the required weather-market shape.
3. Retrieve a compact context packet for the agent.
4. Ask for the highest-value missing evidence.
5. Add new evidence as records, links, and hypothesis updates.
6. After settlement, append a postmortem that updates source and hypothesis memory.

This would test whether KNB can become more than a notes store: an AI-native market memory that tracks what is known, what changed, what remains uncertain, and what evidence would make a decision clearer.
