# Halt for user — Derivation audit found 5 mode-of-interaction concerns missing from working doc

**Halt site:** `derivation-audit`
**Scenario:** `Review Applicant Resume Against PD Requirements`
**Iteration / step (if applicable):** `S2a derivation audit (post-S2pre clean)`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

Whether the orchestrator's S2a working doc for scenario 3 must add mode-of-interaction infrastructure entries for **ui-framework, routing, styling, components, icons** (each flagged as a missing tech-stack-coupled concern by 2+ of 3 independent derivation auditors) and whether the working doc's listing of **auth as a non-boundary library-coupled concern** must be reclassified to **translation-only** (flagged by 2 of 3 auditors).

## 2. Current state

The orchestrator's `_program_workspace/implied-scenarios.md` Scenario 3 derivation lists exactly 3 infrastructure concerns: `auth` (tech-stack non-boundary), `persistence` (tech-stack non-boundary), and `llm-service` (external boundary). The same shape was used for Scenarios 1 and 2 and was previously audited PASS at Scenario 1 derivation time.

Three independent derivation auditors run at S2a re-derived the implied scenarios and produced the following infrastructure concern lists:

- **Reviewer A** (7 concerns): ui-framework, styling, components, routing, icons, fonts, llm-service. 6 non-boundary library-coupled concerns + LLM Service. Did NOT list auth, did NOT list persistence.
- **Reviewer B** (7 concerns): llm-service, ui-framework, routing, components, styling, icons, **auth (translation-only)**. Did NOT list persistence or fonts.
- **Reviewer C** (4 concerns): llm-service, ui-framework, routing, markdown-editor, **auth (translation-only / N/A)**. Did NOT list persistence, styling, components, icons, fonts.

Universal-rule 2-of-3 majority gaps (`union_gaps_found`):
- **ui-framework** as tech-stack library-coupled concern requiring production plumbing: 3/3 (A+B+C) — gap
- **routing** as tech-stack library-coupled concern requiring production plumbing: 3/3 (A+B+C) — gap
- **styling** as tech-stack library-coupled concern requiring production plumbing: 2/3 (A+B) — gap
- **components** as tech-stack library-coupled concern requiring production plumbing: 2/3 (A+B) — gap
- **icons** as tech-stack library-coupled concern requiring production plumbing: 2/3 (A+B) — gap
- **auth reclassification from "tech-stack non-boundary requiring production plumbing" to "translation-only / no plumbing counterparts"**: 2/3 (B+C) — gap (Reviewer B explicit "translation-only — no library; not external boundary"; Reviewer C explicit "none — translation-only"; Reviewer A did not address auth)

Singleton 1-of-3 findings preserved for RCA, no halt under the universal rule:
- **fonts** as tech-stack non-boundary: A only
- **markdown-editor** as tech-stack non-boundary: C only
- **persistence reclassification**: 0/3 (none of the auditors listed persistence; orchestrator's working doc lists it; treat as singleton-against, no halt)

## 3. Each agent's verdict (compliance-vote sites) / Diagnostic context (non-voting sites)

This is a non-voting halt site. The diagnostic context is the per-agent derivations summarized in field 2 above. Verbatim per-agent infrastructure concerns are recorded in the `derivation-audit` log entry's `per_agent_derivations` field; the auditor agent reports are in this session's transcript.

The orchestrator's reading: the universal-rule majority for ui-framework, routing, styling, components, icons reflects auditor application of the structural-property-test name-based lookup rule at `references/implied-scenarios.md:37-43` — every Library column entry in `specs/tech-stack-recommendations.md` is structurally a library-coupled concern requiring per-mode plumbing per the implied-scenarios reference, regardless of whether the active scenario realizes a multi-mode split for that concern. Reviewer C scoped narrower (routing, ui-framework, markdown-editor — concerns most clearly evidenced by the resume-reader narrative: navigation, rendering, clickable passages); Reviewers A and B applied the rule maximally across the tech-stack table.

The orchestrator's working doc does not list ui-framework / routing / styling / components / icons because Scenarios 1 and 2 also did not list them and passed audit at the time. The auditor universal-rule majority surfaces the discrepancy now. The auditors are mechanically correct under the structural property test; the question is whether the project's standing-facet audit scope has drifted over the prior 2 scenarios or whether the auditors' read of the rule is over-literal for a single-layer SPA where the entire tech-stack is co-realized in the one bootstrap-collapsed UI surface and no multi-mode swap is intended.

The auth reclassification (B+C, 2/3) is more clearly mechanical: `tech-stack-recommendations.md` lists Auth as `In-memory session (no real auth)` with `Library: N/A` and the explicit note "no library; tested through development counterpart" — under the structural property test this resolves to **translation-only**, not tech-stack library-coupled. The orchestrator's working doc has carried "auth (tech-stack, non-boundary)" since Scenario 1 — this is a derivation error, propagated into Scenario 2, that the auditors have now caught.

## 4. Options the user can choose

The orchestrator does not adjudicate; the user picks one of the following per-finding (or applies one option set across all 6 findings).

For the 5 tech-stack concerns (ui-framework, routing, styling, components, icons):

(a) **Add the missing concerns to the working doc** — record each as `tech-stack, non-boundary, production plumbing required, modes applicable: production, bootstrap status: pending until first infrastructure split` per the auditors' majority. Subsequent grow/refactor work for scenario 3 (and beyond) treats every Library column entry as structurally tracked under mode-of-interaction. This is the structurally-correct application of the implied-scenarios rule, and it brings the working doc into alignment with the rule's text. Cost: gate item 2 expects to verify these concerns at every scenario completion; the SL-sc realized-concern predicate may surface deferred-tech-stack-plumbing requirements where none would have surfaced before; this catches up an audit-scope drift carried from Scenarios 1+2.

(b) **Justify the orchestrator's exclusion** — the project is a single-layer Vite+React SPA where ui-framework, routing, styling, components, icons are library decisions baked into the Vite build itself; there is no realistic per-mode swap (the production build IS the React/USWDS/Lucide bundle; no "development plumbing for ui-framework" or "demonstration plumbing for routing" is meaningful). Document the exclusion as a project-scope rule: "for this project, only LLM Service and persistence are mode-of-interaction concerns; ui-framework / routing / styling / components / icons / fonts / markdown-editor are co-realized in the Vite build and not subject to per-mode plumbing." This is a project-scope override of the rule's maximalist read; it requires the user to accept that gate item 2's audit will not enforce structural assertions on these libraries. The justification is sensible for a small SPA but creates a precedent that future scenarios must respect.

(c) **Mark AMBIGUOUS for user clarification** — the project intends `MODE=demonstration` to swap LLM Service plumbing for the mock-server client, but does not intend per-mode plumbings for ui-framework / routing / styling / components / icons. If that's the intent, declare it in `specs/tech-stack-recommendations.md` (e.g., a "Mode-of-interaction concerns" section listing the libraries that vary per mode). Then re-run derivation audit; the auditors read the spec and would then resolve to (b)'s scoped list mechanically.

For the auth reclassification (B+C, 2/3):

(d) **Reclassify auth as translation-only** in `_program_workspace/implied-scenarios.md` for Scenario 3 (and update the existing entries for Scenarios 1+2 if desired). Auth has Library: N/A in tech-stack-recommendations.md, so structurally it IS translation-only; no production plumbing is required (the in-memory session test double IS the implementation, not a development-mode plumbing of a real auth library). This corrects a derivation error carried from Scenario 1.

(e) **Justify the orchestrator's prior classification** — auth was listed under tech-stack non-boundary because the "securely signed in" narrative signal creates an auth interface shape, even if the implementation is in-memory. Document this stance and accept that auth's "production plumbing" is the in-memory session module itself.

The orchestrator's own preference, surfaced for the user's information only: option (b) for ui-framework / routing / styling / components / icons (single-layer Vite SPA with no realistic per-mode swap); option (d) for auth (Library N/A is structurally translation-only). Combined: scope the project's mode-of-interaction concerns to **LLM Service** (external boundary) and **persistence** (in-memory store with potential JSON-fixture or real-database future swap) only. Document this scope in `specs/tech-stack-recommendations.md` so future audits respect it.

## 5. Recommendation

Recommend option (b) + (d) combined: declare the project's mode-of-interaction scope in `specs/tech-stack-recommendations.md` and reclassify auth as translation-only. Rationale: the derivation auditors are mechanically correct under a maximalist read of the implied-scenarios rule, but a single-layer Vite SPA has no realistic per-mode plumbing for ui-framework / routing / styling / components / icons / fonts / markdown-editor — the Vite build is the production realization, no swap is meaningful. The right place to record this scoping is `specs/tech-stack-recommendations.md`, which the auditors read at S2a; once recorded, future re-derivations resolve to a scoped list mechanically. Auth is structurally translation-only because its Library column reads N/A; this correction belongs in the working doc regardless of the rest. Trajectory note: this is the first `derivation-audit` halt for this project — no prior firings exist to compute a trend. Past Scenarios 1 + 2 passed audit with the same scope; the present halt is the first time the auditors have applied the maximalist read, suggesting per-agent variance rather than a structural shift in the project.

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1–3 above to understand what triggered the halt.
2. Pick one of the options in field 4. If none apply, write your own
   resolution under (e) in the Resolution block below.
3. Apply the resolution by editing the source-of-truth artifact named
   in field 2. Run `/change` if the resolution requires a structural
   codebase edit.
3a. **If your resolution includes direct edits to UI modules** (any
    file under the layer's UI source-root, typically `web/src/**/*.tsx`
    or equivalent): for each edited UI module, engage
    `/flexion-frontend-design` in Constrained mode against the edited
    component before declaring the resolution complete. (Not applicable
    to this halt — resolution is spec-edit / working-doc-edit, no UI
    code changes.)
4. Append a `## Resolution` block to THIS FILE below the marker. The
   block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`,
     `notes-edit`, `change-session-applied`, `defer-indefinitely`.
     For (b)+(d) combined: `spec-edit` (edits to
     `specs/tech-stack-recommendations.md` declaring mode-of-interaction
     scope) + working-doc edit to `_program_workspace/implied-scenarios.md`
     (auth reclassification).
   - **`halt_site:`** must equal `derivation-audit`.
   - **`scenario:`** must equal `Review Applicant Resume Against PD Requirements`.
   - **`resolution_text:`** non-empty prose describing what you did
     and why. Step 0 of the next session reads this text and stamps it
     on the `halt-for-user-resolved` log entry.
5. Run `/program` again. Step 0 detects the `## Resolution` block,
   archives this file as `halt-for-user-resolved-<timestamp>.md`,
   writes a paired `halt-for-user-resolved` log entry, and re-runs
   the S2a derivation audit against the (potentially updated) spec.

Do NOT delete this file before resolving. Do NOT touch the
`_program_workspace/halt-for-user` sentinel manually — step 0 cleans
it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

**resolution_kind:** spec-edit
**halt_site:** derivation-audit
**scenario:** Review Applicant Resume Against PD Requirements
**resolution_text:** Applied the orchestrator's recommended option (b) + (d) combined.

(b) — Added a "Mode-of-Interaction Scope" section to `specs/tech-stack-recommendations.md` (between Explicitly Avoided and Testable Constraints) declaring the project's mode-of-interaction concern scope. In-scope: LLM Service (external boundary, production + demonstration) and Persistence (tech-stack non-boundary, production). Out of scope: ui-framework (react/react-dom), styling (@uswds/uswds), components (@trussworks/react-uswds), routing (react-router-dom), markdown-editor (@mdxeditor/editor), icons (lucide-react), fonts (@fontsource/public-sans). Reasoning written into the section: this is a single-layer Vite SPA; the production bundle IS the React/USWDS/Lucide realization; no per-mode swap is meaningful for those libraries. The 5 derivation auditors' majority findings (ui-framework, routing, styling, components, icons as missing tech-stack mode-of-interaction concerns) are now resolved at the spec level — auditors reading the spec on the next S2a re-derivation will see the explicit scope and resolve to the scoped list mechanically.

(d) — Reclassified Auth as translation-only in `_program_workspace/implied-scenarios.md` for all three scenarios (1, 2, 3). The Library column for Auth in `specs/tech-stack-recommendations.md` is N/A, so structurally Auth IS translation-only per the implied-scenarios.md structural property test ("name match in tech-stack Library column → tech-stack-coupled; otherwise → translation-only"). The in-memory session implementation IS the realization; no production plumbing of a real auth library is required. The Auth row in tech-stack-recommendations.md was also annotated to clearly state translation-only and point at the new Mode-of-Interaction Scope section. The reviewer-B+C 2-of-3 majority is honored.

Singletons (fonts from Reviewer A, markdown-editor from Reviewer C) are explicitly listed in the Mode-of-Interaction Scope section as out-of-scope, foreclosing future singleton flags on the same concerns.

Re-run S2a will derive against the updated spec and working doc; expecting union_gaps_found = 0.
