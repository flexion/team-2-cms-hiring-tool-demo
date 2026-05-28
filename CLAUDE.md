# Hiring Tool Demo Development Process

This project uses the grow-split-merge development process. Run `/program` to implement scenarios. Use `/change` to make incremental modifications (add behavior, constraints, or modify existing scenarios) — it edits scenarios.md and delegates to `/program` for implementation.

## Rules (always active, even outside /program)

- **Do not pre-split modules or impose structure upfront.** Structure emerges from the code through the grow-split-merge loop.
- **No behavior without a scenario and a test.** Every business behavior must trace to a scenario postcondition. If it's not in a scenario, don't build it.
- **Tests before code.** Write failing tests first, then implement only enough to pass them.
- **Name files after business concepts, not technical roles.** `contracts` not `controller`. `placeOrder` not `handlePost`.
- **Don't introduce unlisted technologies.** Check `specs/tech-stack-recommendations.md` before adding any dependency. If the category has no recommendation, ask.
- **Standing facets are always present as candidates.** Nature of user, distribution, internal vs. external, and mode of interaction are evaluated on every module even when no scenario mentions them.

## Key Files

- `specs/scenarios.md` — the requirements (scenarios with actors, narratives, postconditions)
- `specs/tech-stack-recommendations.md` — technology choices and project paths
- `specs/ui-design-constraints.md` — brand assets and quality attributes
- `specs/external-boundaries.md` — external systems and their boundary interfaces
- `_program_workspace/dev-journal.md` — append-only human audit trail of the development process
- `_program_workspace/process-log.jsonl` — machine-readable compliance record (verify the process was followed)
- `_program_workspace/axis-map.json` — axes of change with associated interests and modules (used for targeting during grow)
