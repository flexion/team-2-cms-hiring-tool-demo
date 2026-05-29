# Halt for user — New finding on strong-vs-partial-matches postcondition (2/3)

**Halt site:** `narrative-consistency-check`
**Scenario:** `Review Applicant Resume Against PD Requirements`
**Iteration / step (if applicable):** `S2pre re-run #3 after option-b spec edit`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

The Medicare Part D flag is gone (removed by your spec edit). A new finding emerged with 2/3 majority: postcondition #5 *"Maria sees visual indicators distinguishing strong matches from partial matches"* introduces a strong-vs-partial distinction the narrative doesn't establish. The narrative only mentions "color-coding to indicate relevance" — generically, without specifying that there are at least two distinct match-strength categories Maria can see distinguished.

## 2. Current state

`specs/scenarios.md` § scenario 3, narrative (relevant sentences):

> The resume reader **highlighted** the passages in Jordan's resume that mapped to that requirement, using color-coding to indicate relevance.

Postcondition #5:

> Maria sees visual indicators distinguishing strong matches from partial matches.

The reviewers note: the narrative mentions "color-coding indicating relevance" generically, but no narrative action surfaces a strong match alongside a partial match for Maria to observe. The mid-condition *"Maria sees color-coding indicating the strength or category of the match"* is closer but still doesn't assert a strong-vs-partial distinction explicitly.

## 3. Each agent's verdict (full per-agent findings, verbatim)

### Agent A
```json
{"findings": [{"finding_type": "postcondition-no-basis", "detail": "The postcondition 'Maria sees visual indicators distinguishing strong matches from partial matches' implies multiple match strength categories (strong vs. partial), but the narrative only describes color-coding indicating relevance generically without establishing that distinct categories like 'strong' and 'partial' exist."}]}
```

### Agent B
```json
{"findings": [{"finding_type": "postcondition-no-basis", "detail": "Postcondition 'Maria sees visual indicators distinguishing strong matches from partial matches' has no narrative basis — the narrative mentions color-coding for relevance but does not establish that Maria observes a distinction between strong and partial matches (no narrative action surfaces a partial match alongside a strong one)."}]}
```

### Agent C
```json
{"findings": []}
```

### Universal rule application

2-of-3 majority (A + B) on the strong-vs-partial finding → ACCEPT → halt. The Medicare Part D flag dropped to 0/3 — your option-b edit fixed that one cleanly. The reviewers found a different over-specific postcondition relative to its narrative grounding.

## 4. Options the user can choose

For **F-strength** (`postcondition-no-basis`: strong vs partial matches):

- (a) Add a narrative sentence establishing the distinction visibly — e.g., *"Some passages in Jordan's resume appeared in a darker color indicating a strong match, while others showed in a lighter color indicating a partial match."* This gives the postcondition a producing chain.
- (b) Soften the postcondition to match what the narrative actually shows — e.g., *"Maria sees color-coded visual indicators on the highlighted passages."* Drops the strong-vs-partial specificity.
- (c) Drop the postcondition entirely. The mid-condition *"Maria sees color-coding indicating the strength or category of the match"* covers the color-coding observation; the postcondition adds specificity (strong vs partial) the narrative doesn't establish.
- (d) Accept-as-is via `defer-indefinitely`. Risk: same as last time — the next S2pre run on the unchanged spec will likely re-fire the same flag.

## 5. Recommendation

**Per-halt finding-count trajectory** (this is the 4th firing of `narrative-consistency-check` for scenario 3):

| Halt | Findings raised (2+/3 majority) | Reviewer flag totals | Notes |
|---|---|---|---|
| halt 1 (S2pre initial) | 3 (F1 2/3, F2 3/3, F3 3/3) | 8 flags / 9 verdicts | Initial halt; 3 distinct issues |
| halt 2 (S2pre re-run #1, after F1+F2+F3 spec edits) | 1 (F-counts 2/3) | 5 flags / 9 verdicts | Down 2 findings; F1/F2/F3 cleanly fixed |
| halt 3 (S2pre re-run #2, after F-counts spec edit) | 1 (F-mpd 3/3) | 3 flags / 9 verdicts | Same finding count, different finding (over-literal Medicare Part D click) |
| halt 4 (S2pre re-run #3, after Medicare Part D removal + passage-click rephrase) | 1 (F-strength 2/3) | 2 flags / 9 verdicts | Same finding count, different finding (postcondition strong-vs-partial distinction) |

**Trajectory alignment: convergent-with prior pattern.** Each halt's spec edit cleanly resolves the named finding (F1→F2→F3 dropped from halt 1 to 2; F-counts dropped from halt 2 to 3; F-mpd dropped from halt 3 to 4). New findings emerge each round but on different (postcondition, narrative) pairs — the reviewers are surfacing genuinely distinct issues at each cycle rather than re-flagging the same finding stochastically. Reviewer-flag totals are decreasing (8 → 5 → 3 → 2). This is convergent: each round eliminates a real over-specification or missing chain in the spec, and the count of remaining issues is dropping. The recommendation continues to bias toward small spec edits that fix the named finding rather than escalation framing.

**Recommendation: (a) add a narrative sentence.** The strong-vs-partial distinction is meaningful for the test (it's a real visual feature worth asserting), but it needs a producing narrative chain. A single sentence — "Some passages appeared in darker color indicating a strong match, others in lighter color indicating a partial match" — gives the postcondition narrative grounding and matches what the test would assert (rendered passages with at least two distinct color values).

(b) is a smaller edit but loses real scenario information (the strength distinction is valuable to test).

(c) is fine if you don't actually want to assert the strength distinction; the mid-condition covers the basic color-coding fact.

(d) loop-risks repeats of this halt; the trajectory shows each round genuinely reduces flag count, so spec edits are the converging path — defer-indefinitely is the diverging path.

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1–3 above to understand what triggered the halt.
2. Pick one of the options in field 4 (or write your own under (e) in the Resolution block).
3. Apply the resolution by editing `specs/scenarios.md` § "Review Applicant Resume Against PD Requirements" — or accept-as-is for option (d).
4. Append a `## Resolution` block to THIS FILE below the marker. The block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`, `notes-edit`, `change-session-applied`, `defer-indefinitely`
   - **`halt_site:`** must equal `narrative-consistency-check`
   - **`scenario:`** must equal `Review Applicant Resume Against PD Requirements`
   - **`resolution_text:`** non-empty prose describing what you decided and why
5. Re-run `/program`. Step 0 archives this file and re-runs S2pre against the (possibly-edited) spec.

Do NOT delete this file before resolving. Do NOT touch the `_program_workspace/halt-for-user` sentinel manually — step 0 cleans it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

**resolution_kind:** spec-edit
**halt_site:** narrative-consistency-check
**scenario:** Review Applicant Resume Against PD Requirements
**resolution_text:** Option (a) applied. Added a narrative sentence establishing the strong-vs-partial visual distinction: "Some passages appeared in a darker color indicating a strong match, while others showed in a lighter color indicating a partial match." Postcondition #5 ("Maria sees visual indicators distinguishing strong matches from partial matches") now has a clear narrative producing chain. The strong-vs-partial distinction is a real test-worthy visual feature worth asserting.
