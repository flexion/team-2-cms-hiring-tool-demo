# Halt for user — Narrative–postcondition consistency findings on scenario 3

**Halt site:** `narrative-consistency-check`
**Scenario:** `Review Applicant Resume Against PD Requirements`
**Iteration / step (if applicable):** `S2pre (narrative–postcondition consistency check)`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

Three narrative–postcondition inconsistencies were flagged by 2-of-3 or 3-of-3 of the independent consistency reviewers on scenario 3 (`Review Applicant Resume Against PD Requirements`). The user must decide how each finding should be resolved before adapter writing can proceed.

## 2. Current state

The scenario at `specs/scenarios.md` § "Review Applicant Resume Against PD Requirements" reads as written. Three findings reach the 2-of-3 majority accept threshold under the universal voting rule.

## 3. Each agent's verdict (full per-agent findings, verbatim)

### Agent A
```json
{
  "findings": [
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative describes Maria seeing three candidate resumes (Jordan Mitchell, Priya Ramanathan, David Chen) in the applicant resumes section before opening the reader, but no postcondition asserts that the applicant resumes list with these three candidates is visible."},
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative states Maria clicked a passage about Medicare Part D experience and saw it mapped to two different duties, but no postcondition asserts that a resume passage maps to multiple (specifically two) PD requirements."},
    {"finding_type": "postcondition-no-basis", "detail": "The postcondition 'Maria sees that the bidirectional mapping covers all 4 PD requirements' asserts complete coverage across all four requirements, but the narrative only describes Maria clicking one PD requirement and one resume passage — no narrative action establishes that all 4 requirements have mappings visible."}
  ]
}
```

### Agent B
```json
{
  "findings": [
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative describes Maria clicking a resume passage about Medicare Part D and seeing it map to two different duties, but no postcondition or mid-condition asserts the specific observable state that a clicked resume passage maps to multiple (two) PD requirements — only the general bidirectional behavior is asserted."},
    {"finding_type": "postcondition-no-basis", "detail": "The postcondition 'Maria sees that the bidirectional mapping covers all 4 PD requirements' asserts coverage across all 4 requirements, but the narrative only describes Maria interacting with one PD requirement and one resume passage — no narrative action (by Maria or another actor) establishes that all 4 requirements are covered by the mapping as an observable state."}
  ]
}
```

### Agent C
```json
{
  "findings": [
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative describes Maria navigating to the position detail page and viewing the applicant resumes section with three candidates filtered through the OHC certificate process, but no postcondition asserts the observable state of that resume list view."},
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative states Maria clicked a passage about Medicare Part D experience and the reader showed it mapped to two different duties, but no postcondition asserts the specific observable state that a single passage maps to multiple (two) PD requirements."},
    {"finding_type": "postcondition-no-basis", "detail": "The postcondition 'Maria sees that the bidirectional mapping covers all 4 PD requirements' asserts coverage across all four requirements, but the narrative only describes Maria interacting with one PD requirement and one resume passage — no narrative action establishes that all 4 requirements are covered by the mapping as observable state."}
  ]
}
```

### Universal rule application (2-of-3 accept threshold)

- **F1: Resume list / 3 candidates / OHC filtering visible — narrative-no-postcondition.** Agents A and C → 2-of-3 → ACCEPT.
- **F2: Resume passage maps to 2 PD requirements — narrative-no-postcondition.** Agents A, B, C → 3-of-3 → ACCEPT.
- **F3: Postcondition asserts mapping covers all 4 PD requirements without narrative basis — postcondition-no-basis.** Agents A, B, C → 3-of-3 → ACCEPT.

## 4. Options the user can choose

Per finding, you can pick one of the three resolution shapes for each finding type:

For **F1** (`narrative-no-postcondition`: 3-candidate resume list / OHC filtering visible):
- (a) Add a postcondition asserting "Maria sees three applicant resumes (Jordan Mitchell, Priya Ramanathan, David Chen) listed in the applicant resumes section."
- (b) Edit the narrative to remove the specific 3-candidate observation if it was incidental scene-setting and not load-bearing system behavior.
- (c) Mark this finding as accepted-as-is with rationale (state implies action: opening the resume reader for Jordan implies the list was visible enough to click — though the OHC-filtering and Priya/David details are not separately asserted).

For **F2** (`narrative-no-postcondition`: passage-maps-to-multiple-requirements):
- (a) Add a postcondition or mid-condition asserting "Maria sees that a single resume passage can map to multiple PD requirements" (or specifically: "the Medicare Part D passage maps to multiple duties").
- (b) Edit the narrative to remove the "mapped to two different duties" detail if it was illustrative rather than acceptance-criterion.
- (c) Mark accepted-as-is — the bidirectional-mapping postconditions cover the general behavior and the multi-mapping case is illustrative.

For **F3** (`postcondition-no-basis`: "covers all 4 PD requirements"):
- (a) Edit the narrative to add an action that surfaces all 4 requirements visibly (e.g., "Maria scanned the left pane, where each of the 4 PD requirements appeared with a count of related passages alongside it"), giving the postcondition a producing chain.
- (b) Reword the postcondition to focus on what the test can prove from the narrative (e.g., "Maria sees the bidirectional mapping is computed for the PD requirements" — without asserting all-4 coverage as observable state).
- (c) Mark accepted-as-is — interpreting "covers all 4 PD requirements" as a property of the data structure (each requirement has a mapping entry, even if Maria didn't click each one), provable by inspecting the rendered left pane regardless of which requirement Maria clicked.

You may pick a different combination per finding. After deciding, edit `specs/scenarios.md` to apply your resolutions (or run `/change` to do it via the structured edit flow).

## 5. Recommendation

Pragmatically:
- **F1** → option (c) accepted-as-is. The 3-candidate list visibility is implied by the resume-reader-opens-for-Jordan action; OHC filtering is precondition framing, not a postcondition.
- **F2** → option (a) add a mid-condition. The bidirectional behavior is the scenario's central claim; an explicit "passage can map to multiple requirements" mid-condition makes that observable and testable, matching the narrative's specific Medicare Part D example.
- **F3** → option (a) edit the narrative to add an action that surfaces all 4 requirements visibly. The "all 4" property is testable and meaningful, but the narrative needs a corresponding action so the postcondition has a producing chain.

The orchestrator does not auto-edit the spec. Pick per finding and edit `specs/scenarios.md` (or run `/change`).

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1–3 above to understand what triggered the halt.
2. Pick one of the options in field 4 for each finding (you may mix options across F1/F2/F3). If none apply, write your own resolution under (e) in the Resolution block below.
3. Apply the resolution by editing `specs/scenarios.md` § "Review Applicant Resume Against PD Requirements" — or run `/change` to do the edits via the structured flow.
4. Append a `## Resolution` block to THIS FILE below the marker. The block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`, `notes-edit`, `change-session-applied`, `defer-indefinitely`
   - **`halt_site:`** must equal the halt_site preamble value above (`narrative-consistency-check`)
   - **`scenario:`** must equal the scenario preamble value above (`Review Applicant Resume Against PD Requirements`)
   - **`resolution_text:`** non-empty prose describing per-finding what you decided and why.
5. Run `/program` again. Step 0 detects the `## Resolution` block, archives this file, writes a paired `halt-for-user-resolved` log entry, and continues. The next session re-runs S2pre against the post-edit spec; if no findings remain, /program proceeds to S2a and beyond.

Do NOT delete this file before resolving. Do NOT touch the `_program_workspace/halt-for-user` sentinel manually — step 0 cleans it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

**resolution_kind:** spec-edit
**halt_site:** narrative-consistency-check
**scenario:** Review Applicant Resume Against PD Requirements
**resolution_text:** F1=b: removed the load-bearing 3-candidate observation from the narrative; the applicant-resumes section is now described as listing "the candidates whose resumes had been filtered and screened" without naming the count or the specific candidates as a visible-list claim. F2=b: removed the "showing it mapped to two different duties" detail from the narrative; the bidirectional behavior is preserved as a postcondition without requiring a multi-mapping-specific observable. F3=a: added a narrative sentence surfacing all 4 requirements visibly — "Each of the four requirements appeared in the left pane with a count of related resume passages alongside it, so Maria could see at a glance that the bidirectional mapping had been computed for every requirement" — giving the all-4-coverage postcondition a producing chain.
