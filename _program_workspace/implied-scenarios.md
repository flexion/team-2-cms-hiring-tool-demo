# Implied Scenarios

## Scenario: View Active Hiring Pipeline

### Implied: Programmatic mirror of "View Active Hiring Pipeline"
A programmatic consumer authenticates via API credentials and retrieves the list of active positions in the hiring pipeline. The response contains all 7 positions, each with date, job title, GS grade, and status. The programmatic consumer retrieves a specific position by clicking (navigating to a position detail — equivalent: GET by position ID). All operations succeed through the HTTP interface with appropriate authentication.

### Implied: Non-develop infrastructure for "View Active Hiring Pipeline"
- Auth (tech-stack, non-boundary): at the layer where auth is realized, production plumbing exists, implements auth interface, wired for `production` mode; no stubs. Other layers have assertions pending until layer-local business code realizes auth.
- Persistence (tech-stack, non-boundary): at the layer where persistence is realized (in-memory + JSON fixtures per tech stack), production plumbing exists, implements store interface, wired for `production` mode; no stubs.
- LLM Service (external boundary, Mock Endpoint Specification derivable on demand): assertions ACTIVE at declaration time. At the layer where LLM interaction is realized, production plumbing exists (AWS Bedrock via @aws-sdk/client-bedrock-runtime), wired for `production`; demonstration plumbing exists (thin HTTP client against `${MOCK_SERVER_URL:-http://localhost:4000}/mock/llm-service`), wired for `demonstration`; both implement the plumbing interface; neither has stubs. Layers without LLM-realizing business code have assertions failing as the expected steady-state. NOTE: Scenario 1 does not reference the LLM boundary — per-layer plumbing build will emerge via refactoring when Scenario 2 introduces the LLM concern.

### Standing-facet analysis
- **Distribution:** Narrative signals "the next morning" → `distributed` axis. Realizes a shared-datastore translation/adapter (in-memory JSON fixtures per tech stack — no external database).
- **Nature of user:** Human (Maria). Programmatic mirror derived above.
- **Mode of interaction:** Three axes present as candidates. `development` for tests; `production` for real AWS Bedrock calls; `demonstration` for mock-server HTTP calls. Per-mode plumbings pending until infrastructure splits.
- **Internal vs. external:** LLM Service is `external` (declared in specs/external-boundaries.md). Auth and persistence are `internal`.
