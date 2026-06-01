# Halt for user — One narrative–postcondition consistency finding remains on scenario 3

**Halt site:** `narrative-consistency-check`
**Scenario:** `Review Applicant Resume Against PD Requirements`
**Iteration / step (if applicable):** `S2pre re-run after spec edit`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

The S2pre re-run (after the user's spec edits applied F1=b, F2=b, F3=a) reduces the prior 3 findings to 1. One finding still reaches the 2-of-3 majority accept threshold under the universal voting rule: the narrative's "count of related resume passages alongside" each requirement is an observable detail that no postcondition asserts.

## 2. Current state

`specs/scenarios.md` § scenario 3, post-edit, includes this narrative sentence:

> Each of the four requirements appeared in the left pane with a count of related resume passages alongside it, so Maria could see at a glance that the bidirectional mapping had been computed for every requirement.

The closest postcondition reads:

> Maria sees that the bidirectional mapping covers all 4 PD requirements.

Two reviewers think the count display is its own observable that should be asserted; one reviewer thinks the existing postcondition covers it.

## 3. Each agent's verdict (full per-agent findings, verbatim)

### Agent A
```json
{ "findings": [] }
```

### Agent B
```json
{
  "findings": [
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative states that each requirement in the left pane displays a count of related resume passages alongside it, but no postcondition asserts that these per-requirement counts are visible."},
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative describes Maria clicking a PD requirement and seeing highlighted passages with color-coding (captured in mid-conditions), but no postcondition asserts the forward direction (clicking a PD requirement highlights related resume passages) — only the reverse direction (clicking a passage highlights requirements) is asserted in postconditions."}
  ]
}
```

### Agent C
```json
{
  "findings": [
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative describes Maria navigating to the position detail page and viewing the applicant resumes section listing the three candidates, but no postcondition asserts the observable state of the position detail page or the list of attached applicant resumes."},
    {"finding_type": "narrative-no-postcondition", "detail": "The narrative states that each of the four requirements appeared in the left pane with a count of related resume passages alongside it, but no postcondition asserts that per-requirement passage counts are visible to Maria."}
  ]
}
```

### Universal rule application (2-of-3 accept threshold)

- **F-counts: Per-requirement passage counts visible.** Agents B and C → 2-of-3 → ACCEPT (halts).
- **F-position-page: Position detail page / applicant-resumes list visible.** Agent C only → 1-of-3 → 2-of-3 against → preserved in per-agent findings, no halt.
- **F-forward: Forward direction (PD click → passage highlight) not asserted as a postcondition.** Agent B only → 1-of-3 → 2-of-3 against → preserved in per-agent findings, no halt. (Note: the forward direction IS asserted as a mid-condition, just not as a final postcondition; Agent B was scanning postconditions narrowly.)

## 4. Options the user can choose

For **F-counts** (`narrative-no-postcondition`: per-requirement passage counts visible):

- (a) Add a postcondition asserting the per-requirement counts are visible — e.g., *"Maria sees a count of related resume passages displayed alongside each PD requirement in the left pane."* This makes the count display its own testable observable.
- (b) Edit the narrative to remove the "with a count of related resume passages alongside it" clause. The all-4-coverage postcondition would then need a different producing chain — perhaps simpler: *"Each of the four requirements appeared in the left pane as a clickable section, so Maria could see at a glance that the bidirectional mapping had been computed for every requirement."* (The count detail goes away; the test becomes "4 requirement entries render," which is enough to verify the mapping was computed for each.)
- (c) Mark accepted-as-is — the existing postcondition *"Maria sees that the bidirectional mapping covers all 4 PD requirements"* implicitly requires evidence of per-requirement coverage, and the count display is the mechanism for that evidence. The test verifies coverage by checking each requirement entry renders with a count > 0 (or some equivalent indicator); the count detail is interpretive, not a separately-asserted postcondition.

## 5. Recommendation

**(c) accepted-as-is.** Reviewer A's reading is reasonable: the count display IS how the all-4-coverage postcondition is rendered observable. Adding a separate postcondition for the count detail would be duplicative (the test for "covers all 4 PD requirements" would naturally inspect the per-requirement rendering and the count is part of that rendering). However, if you prefer maximally explicit postconditions, **(a)** is the cleanest path forward and adds minimal noise.

**(b)** is also fine — it removes the count detail from the narrative but keeps the all-4-coverage postcondition with a slightly weaker producing chain (4 clickable entries, no count). The test would just verify 4 entries render.

The other two findings (F-position-page, F-forward) reached only 1-of-3 and are preserved in per-agent findings for RCA but did NOT trigger this halt under the universal rule.

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1–3 above to understand what triggered the halt.
2. Pick one of the options in field 4. If none apply, write your own resolution under (e) in the Resolution block below.
3. Apply the resolution by editing `specs/scenarios.md` § "Review Applicant Resume Against PD Requirements" — or run `/change` to do the edits via the structured flow. (Option (c) requires no spec edit.)
4. Append a `## Resolution` block to THIS FILE below the marker. The block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`, `notes-edit`, `change-session-applied`, `defer-indefinitely`
   - **`halt_site:`** must equal the halt_site preamble value above (`narrative-consistency-check`)
   - **`scenario:`** must equal the scenario preamble value above (`Review Applicant Resume Against PD Requirements`)
   - **`resolution_text:`** non-empty prose describing what you decided and why.
5. Run `/program` again. Step 0 detects the `## Resolution` block, archives this file, writes a paired `halt-for-user-resolved` log entry, and continues. The next session re-runs S2pre against the (possibly-edited) spec; if no findings remain, /program proceeds to S2a and beyond.

Do NOT delete this file before resolving. Do NOT touch the `_program_workspace/halt-for-user` sentinel manually — step 0 cleans it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

**resolution_kind:** spec-edit
**halt_site:** narrative-consistency-check
**scenario:** Review Applicant Resume Against PD Requirements
**resolution_text:** Applied option (b) for F-counts: removed the "with a count of related resume passages alongside it" clause from the narrative. The sentence now reads "Each of the four requirements appeared in the left pane as a clickable section, so Maria could see at a glance that the bidirectional mapping had been computed for every requirement." The all-4-coverage postcondition retains a producing chain (4 clickable requirement entries render in the left pane) without requiring a separate count-display assertion. The F-position-page and F-forward singletons did not trigger halts under the universal rule's 2-of-3 threshold and are preserved in per-agent findings for RCA.
