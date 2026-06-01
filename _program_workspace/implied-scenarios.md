# Implied Scenarios

## Scenario: View Active Hiring Pipeline

### Implied: Programmatic mirror of "View Active Hiring Pipeline"
A programmatic consumer authenticates via API credentials and retrieves the list of active positions in the hiring pipeline. The response contains all 7 positions, each with date, job title, GS grade, and status. The programmatic consumer retrieves a specific position by clicking (navigating to a position detail — equivalent: GET by position ID). All operations succeed through the HTTP interface with appropriate authentication.

### Implied: Non-develop infrastructure for "View Active Hiring Pipeline"
- Auth (translation-only per `specs/tech-stack-recommendations.md` Mode-of-Interaction Scope; Library: N/A): no per-mode plumbing required; the in-memory session implementation IS the realization, tested through its development counterpart.
- Persistence (tech-stack, non-boundary; in scope): at the layer where persistence is realized (in-memory + JSON fixtures per tech stack), production plumbing exists, implements store interface, wired for `production` mode; no stubs.
- LLM Service (external boundary, Mock Endpoint Specification derivable on demand): assertions ACTIVE at declaration time. At the layer where LLM interaction is realized, production plumbing exists (AWS Bedrock via @aws-sdk/client-bedrock-runtime), wired for `production`; demonstration plumbing exists (thin HTTP client against `${MOCK_SERVER_URL:-http://localhost:4000}/mock/llm-service`), wired for `demonstration`; both implement the plumbing interface; neither has stubs. Layers without LLM-realizing business code have assertions failing as the expected steady-state. NOTE: Scenario 1 does not reference the LLM boundary — per-layer plumbing build will emerge via refactoring when Scenario 2 introduces the LLM concern.
- ui-framework / styling / components / routing / markdown-editor / icons / fonts: out of scope per `specs/tech-stack-recommendations.md` Mode-of-Interaction Scope (single-layer Vite SPA; co-realized in the production bundle; no per-mode swap is meaningful).

### Standing-facet analysis
- **Distribution:** Narrative signals "the next morning" → `distributed` axis. Realizes a shared-datastore translation/adapter (in-memory JSON fixtures per tech stack — no external database).
- **Nature of user:** Human (Maria). Programmatic mirror derived above.
- **Mode of interaction:** Three axes present as candidates. `development` for tests; `production` for real AWS Bedrock calls; `demonstration` for mock-server HTTP calls. Per-mode plumbings pending until infrastructure splits.
- **Internal vs. external:** LLM Service is `external` (declared in specs/external-boundaries.md). Auth and persistence are `internal`.

---

## Scenario: Draft and Refine a Position Description with LLM Assistance

### Implied: Programmatic mirror of "Draft and Refine a Position Description with LLM Assistance"
A programmatic consumer authenticates via API credentials, retrieves the position detail for the IT Specialist (Full Stack Engineer) GS-13 position (including the PD working copy with duties and specialized experience sections), requests LLM suggestions for the PD content via a POST endpoint, receives a list of suggestions (each with target section, proposed text change, and explanation), accepts specific suggestions via the API (PATCH/POST), and rejects others. After accept/reject operations, retrieves the updated PD working copy reflecting only accepted suggestions. All operations succeed through the HTTP interface with appropriate authentication.

### Implied: Non-develop infrastructure for "Draft and Refine a Position Description with LLM Assistance"
- Auth (translation-only per `specs/tech-stack-recommendations.md` Mode-of-Interaction Scope; Library: N/A): no per-mode plumbing required; tested through its development counterpart.
- Persistence (tech-stack, non-boundary; in scope): production plumbing at the web layer — implements store interface for PD content and suggestion state, wired for `production` mode; no stubs.
- LLM Service (external boundary — THIS SCENARIO REALIZES IT): assertions ACTIVE. At the web layer where LLM interaction is realized by this scenario:
  - Production plumbing: AWS Bedrock (Converse API via @aws-sdk/client-bedrock-runtime), calls through Vite server middleware at `/api/llm`, wired for `production` mode; no stubs.
  - Development plumbing: returns canned suggestion responses instantly without credentials, wired for `development` mode; no stubs.
  - Demonstration plumbing: thin HTTP client against mock server (`${MOCK_SERVER_URL:-http://localhost:4000}/mock/llm-service`), wired for `demonstration` mode; no stubs.
  - All three implement the LLM plumbing interface (suggestPdEdits operation).

### Standing-facet analysis
- **Distribution:** Same as Scenario 1 — narrative continuity ("navigated to the position detail page").
- **Nature of user:** Human (Maria). Programmatic mirror derived above.
- **Mode of interaction:** This scenario actively exercises the LLM boundary. Development mode returns canned suggestions; production mode calls AWS Bedrock; demonstration mode calls the mock server. Per-mode plumbings will emerge via refactoring when the condition checker detects the LLM coupling.
- **Internal vs. external:** LLM Service is the active external boundary this scenario. Auth and persistence remain internal.

### Declared-boundary activation status
- **LLM Service:** ACTIVE (assertions activated at Scenario 1 derivation time; this scenario realizes the boundary at the web layer — per-layer plumbings will be created via refactoring when business code reaches for the boundary).

---

## Scenario: Review Applicant Resume Against PD Requirements

### Implied: Programmatic mirror of "Review Applicant Resume Against PD Requirements"
A programmatic consumer authenticates via API credentials, retrieves the position detail for the Health Insurance Specialist GS-12 position (status "Cert Issued") via GET, retrieves the list of attached applicant resumes filtered through the OHC certificate process (Jordan Mitchell, Priya Ramanathan, David Chen), retrieves a specific applicant's resume content (Jordan Mitchell) via GET, retrieves the bidirectional mapping between the PD's 4 requirements and that resume's passages via GET (for-each requirement → passages, for-each passage → requirements, with match-strength category), queries the forward direction (given a PD requirement, list mapped resume passages with match strength), and queries the reverse direction (given a resume passage, list mapped PD requirements). All operations succeed through the HTTP interface with appropriate authentication.

### Implied: Non-develop infrastructure for "Review Applicant Resume Against PD Requirements"
- Auth (translation-only per `specs/tech-stack-recommendations.md` Mode-of-Interaction Scope; Library: N/A): no per-mode plumbing required; tested through its development counterpart.
- Persistence (tech-stack, non-boundary; in scope): production plumbing at the web layer — implements store interface for positions, applicants, resume content, and computed mappings, wired for `production` mode; no stubs.
- LLM Service (external boundary — THIS SCENARIO REALIZES IT, second operation "Map resume to requirements"): assertions ACTIVE. At the web layer where LLM bidirectional-mapping interaction is realized:
  - Production plumbing: AWS Bedrock (Converse API via @aws-sdk/client-bedrock-runtime), calls through Vite server middleware at `/api/llm`, wired for `production` mode; no stubs.
  - Development plumbing: returns canned bidirectional-mapping responses instantly without credentials, wired for `development` mode; no stubs.
  - Demonstration plumbing: thin HTTP client against mock server (`${MOCK_SERVER_URL:-http://localhost:4000}/mock/llm-service`), wired for `demonstration` mode; no stubs.
  - All three implement the LLM plumbing interface (mapResumeToRequirements operation, in addition to the prior suggestPdEdits operation from Scenario 2).
- ui-framework / styling / components / routing / markdown-editor / icons / fonts: out of scope per `specs/tech-stack-recommendations.md` Mode-of-Interaction Scope (single-layer Vite SPA; co-realized in the production bundle; no per-mode swap is meaningful).

### Standing-facet analysis
- **Distribution:** No distinct narrative time-shift signal in this scenario; same-session continuity from prior scenarios. No new distribution implication.
- **Nature of user:** Human (Maria). Programmatic mirror derived above. Mirrors all narrative system-interaction verbs: navigate-to-position, list-applicants, open-resume-reader, query-bidirectional-mapping (forward + reverse), distinguish-strong-vs-partial-match.
- **Mode of interaction:** This scenario actively exercises the LLM boundary's second operation (Map resume to requirements). Development mode returns canned mapping; production mode calls AWS Bedrock; demonstration mode calls the mock server. The bidirectional-mapping operation reuses the existing pd-suggestions.ts plumbing extension (or splits into a separate resume-mapping plumbing if condition checkers detect a multi-axis split).
- **Internal vs. external:** LLM Service remains the active external boundary; auth and persistence remain internal. The applicant-resume domain data and bidirectional-mapping result types are new internal-domain concepts.

### Declared-boundary activation status
- **LLM Service:** ACTIVE (already activated at Scenario 1 derivation time, realized at the web layer in Scenario 2 with suggestPdEdits operation; this scenario extends realization with mapResumeToRequirements operation through the same plumbing path or via an extracted sibling).
