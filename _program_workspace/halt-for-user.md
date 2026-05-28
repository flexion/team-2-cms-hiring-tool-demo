# Halt for user — Coverage classification ambiguous on pipeline-api.ts and main.tsx

**Halt site:** `coverage-classification-ambiguous`
**Scenario:** `View Active Hiring Pipeline`
**Iteration / step (if applicable):** `Scenario Completion Gate, item 6 (Coverage gate)`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

How to dispose of uncovered lines in `web/src/pipeline-api.ts` (HTTP error branches) and `web/src/main.tsx` (the createRoot guard) — the closed-enum decision tree's strict application would delete authentication enforcement, but doing so would break the API contract.

## 2. Current state

Coverage report (vitest --coverage):

```
File               | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-------------------|---------|----------|---------|---------|-------------------
All files          |   93.47 |    70.83 |     100 |   93.47 |
hiring-pipeline.ts |     100 |      100 |     100 |     100 |
hr-specialist.tsx  |     100 |      100 |     100 |     100 |
main.tsx           |      80 |        0 |     100 |      80 | 9-10
pipeline-api.ts    |   82.92 |       60 |     100 |   82.92 | 26-27,37-41
```

**`web/src/pipeline-api.ts` uncovered lines:**

```ts
// Lines 25-27: 401 unauthorized branch
if (!isAuthenticated(token)) {
  return { status: 401, body: { error: 'Unauthorized' } };
}

// Line 37: 404 for missing position by ID
if (position) return { status: 200, body: position };
return { status: 404, body: { error: 'Not found' } };

// Lines 39-41: catch-all 404 for unmatched method/path
return { status: 404, body: { error: 'Not found' } };
```

**`web/src/main.tsx` uncovered lines:**

```tsx
// Lines 9-10: production-only mount block (test-driver renders <HRSpecialist /> directly)
if (root) {
  createRoot(root).render(<HRSpecialist />);
}
```

The implied scenario adapter (`web/test/scenario-adapter.tsx`) tests only the happy path:
authenticate → getPositions → getPositionById. It never exercises:
- 401 unauthorized (calling without a token)
- 404 not found (looking up a non-existent position ID)
- Catch-all 404 (unmatched HTTP method/path)
- The browser mount block in `main.tsx` (test-driver mounts directly via `@testing-library/react`)

## 3. Diagnostic context

Three distinct uncovered-line categories require user judgment:

**Category A: HTTP error branches in `pipeline-api.ts` (lines 26-27, 37, 39-41).**
These are not "extra" code in the YAGNI sense — they enforce the API contract (auth gating, 404 for missing resources, 404 for unsupported routes). The implied scenarios.md derivation produced the happy-path programmatic mirror only; per `specs/scenarios.md`, no scenario explicitly says "the API rejects unauthenticated requests" or "the API returns 404 for unknown IDs". Per the strict closed-enum rule (non-UI module + no covering scenario → DELETE), these lines should be deleted. But deleting `if (!isAuthenticated(token)) return 401` removes authentication entirely from the programmatic interface — a correctness regression, not a YAGNI cleanup. This is the kind of borderline case the closed-enum decision tree warns about: applying the rule mechanically produces a wrong outcome.

**Category B: `main.tsx` lines 9-10 (browser mount block).**
The `if (root) { createRoot(root).render(<HRSpecialist />); }` block is the production browser entry point. Tests mount components directly via `@testing-library/react` in test-driver.tsx — they never go through `main.tsx`. This is composition-root code that runs only in the deployed browser context. It maps to `composition-root-import` per `architecture-principles.md` and is exempt from YAGNI deletion (deleting it removes the production app's entry point). It fits the `regex-path-marker` evidence kind (recognized composition-root file at the layer root).

**Category C: catch-all 404 in `pipeline-api.ts` (lines 39-41).**
This is the fall-through for unrecognized HTTP method/path combos. Without it, requests fall off the function and return `undefined`, which crashes the test driver. Same correctness issue as Category A — the rule's strict reading says delete, but the lines protect the API.

## 4. Options the user can choose

(a) **Extend the implied scenario adapter to cover the 401 + 404 branches.** Add tests in `web/test/scenario-adapter.tsx` `impliedVerify` that call the API without authentication (expect 401), with a non-existent ID (expect 404 not found), and with an unsupported method (expect 404). This converts the implicit contract into tested behavior without adding new explicit scenarios in `specs/scenarios.md`. The branches become covered. Suggested when the API is intended to be used programmatically and authentication enforcement is part of the contract.

(b) **Add an explicit constraint to `specs/scenarios.md`** that says "the system rejects programmatic requests without valid authentication" and "the system returns 404 for unknown position IDs". Then write constraint adapter entries that drive the test, satisfying the rule while documenting the intent in the spec. More formal but better aligned with the "no behavior without a scenario" rule. Suggested if the API contract is genuinely a project-wide invariant the scenarios should declare.

(c) **Mark `main.tsx` lines 9-10 as `scaffolding_exempt` with `category: composition-root-import`** and `evidence_kind: regex-path-marker` (canonical composition-root file at layer root). This is the right disposition for that category regardless of decision on (a)/(b) — composition roots are recognized exempt scaffolding.

(d) **Delete the uncovered branches per strict anti-YAGNI** — including the auth check. Only viable if the user accepts that this demo project has no authentication and no error responses. Suggested only if the project will never be deployed beyond test fixtures.

## 5. Recommendation

(no mechanical recommendation; user judgment required)

The cleanest combination is likely (a) + (c): extend the implied adapter to test 401 + 404 paths (converts implicit behavior into tested behavior without adding scenario noise), and mark `main.tsx` 9-10 as composition-root-import scaffolding. This preserves API correctness while satisfying the coverage gate.

If the project's intent is "scenarios are the only source of truth", choose (b) + (c) — formalize the API contract as scenarios.md text.

Avoid (d) — strict deletion would silently remove authentication.

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1–3 above to understand what triggered the halt.
2. Pick one of the options in field 4. If none apply, write your own resolution under (e) in the Resolution block below.
3. Apply the resolution by editing the source-of-truth artifact named in field 2.
4. Append a `## Resolution` block to THIS FILE below the marker. The block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`, `notes-edit`, `change-session-applied`, `defer-indefinitely`
   - **`halt_site:`** must equal `coverage-classification-ambiguous`
   - **`scenario:`** must equal `View Active Hiring Pipeline`
   - **`resolution_text:`** non-empty prose describing what you did and why
5. Run `/program` again. Step 0 detects the `## Resolution` block and continues.

Do NOT delete this file before resolving. Do NOT touch the `_program_workspace/halt-for-user` sentinel manually — step 0 cleans it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

**resolution_kind:** change-session-applied
**halt_site:** coverage-classification-ambiguous
**scenario:** View Active Hiring Pipeline
**resolution_text:** Applied (a)+(c). Extended `web/test/test-driver.tsx` with three new helpers — `getPositionsWithoutAuth()`, `getPositionByIdRaw(token, id)`, and `requestUnknownRoute(token)` — and extended `impliedVerify` in `web/test/scenario-adapter.tsx` to assert that an unauthenticated GET returns 401, an unknown position id returns 404, and an unsupported HTTP method returns 404. Also tightened `pipeline-api.ts` line 18 by removing the never-taken `body?` fallback (anti-YAGNI cleanup; `authenticateAPI` always supplies a body). After changes: `pipeline-api.ts` covers 100% lines and 100% branches; `hiring-pipeline.ts` and `hr-specialist.tsx` already at 100%/100%. For (c), `main.tsx` lines 9-10 (`if (root) { createRoot(root).render(<HRSpecialist />); }`) will be registered as `scaffolding_exempt` with `category: composition-root-import` and `evidence_kind: regex-path-marker` in the gate-item-6 entry. All 28 tests still pass. Application-logic coverage is now 100%; the gate item 6 PASS predicate holds.
