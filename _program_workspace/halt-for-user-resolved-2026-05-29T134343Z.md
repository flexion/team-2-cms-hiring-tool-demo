# Halt for user — main.tsx naming backfill violation

**Halt site:** `step-0-naming-backfill-violation`
**Scenario:** `N/A`
**Iteration / step (if applicable):** `Step 0 initialization`
**Detail file path:** `_program_workspace/halt-for-user.md`
**Compliance-vote pairing:** `no — non-voting halt site`

---

## 1. What is being decided

Whether `web/src/main.tsx` should be renamed to a business-concept name or registered as scaffolding exempt (defer-indefinitely).

## 2. Current state

`web/src/main.tsx` (9 SLOC) — standard React entry point that imports CSS/fonts, gets the DOM root element, and renders the `HRSpecialist` component. Already classified in the axis-map as `composition_root/app` with interests `["wire HRSpecialist component into the React DOM root", "load CSS (Public Sans, USWDS)"]`.

## 3. Diagnostic context

The step-0 naming backfill audit detected 1 violation:

| Path | Matched Regex | SLOC | Control Flow Detected |
|------|---------------|------|----------------------|
| `web/src/main.tsx` | `framework_entry_point_path` | 9 | true |

**Why the audit flags it:** The `framework_entry_point_path` regex matches `web/src/main.tsx`. The bootstrap-exception property test requires BOTH (SLOC <= 30) AND (no control flow). SLOC passes (9 <= 30), but the `if (root)` null guard triggers `control_flow_detected: true`, failing the conjunction.

**File content:** Standard React bootstrapping — imports CSS and fonts, gets `document.getElementById('root')`, null-guards it, calls `createRoot(root).render(<HRSpecialist />)`.

## 4. Options the user can choose

(a) **Register as scaffolding exempt (defer-indefinitely):** The file is a standard React composition root with a trivial null guard. It is already tracked as `composition_root/app` in the axis-map. No rename needed — acknowledge it as framework wiring that legitimately uses a canonical entry-point name (`main.tsx`).

(b) **Rename via `/change`:** Rename `web/src/main.tsx` to a business-concept name (e.g., `web/src/applicationShell.tsx`) and cascade through `index.html` and any imports.

## 5. Recommendation

Option (a) — `main.tsx` is the standard composition-root canonical name per Phase 2.5, already classified as such in the axis-map. The `if (root)` null guard is idiomatic React bootstrapping, not business logic.

---

## Resolution path (instructions for the user)

To resolve this halt:

1. Read fields 1-3 above to understand what triggered the halt.
2. Pick one of the options in field 4. If none apply, write your own
   resolution under (e) in the Resolution block below.
3. Apply the resolution by editing the source-of-truth artifact named
   in field 2. Run `/change` if the resolution requires a structural
   codebase edit.
3a. **If your resolution includes direct edits to UI modules** (any
    file under the layer's UI source-root, typically `web/src/**/*.tsx`
    or equivalent): for each edited UI module, engage
    `/flexion-frontend-design` in Constrained mode against the edited
    component before declaring the resolution complete.
4. Append a `## Resolution` block to THIS FILE below the marker. The
   block MUST contain:
   - **`resolution_kind:`** one of: `spec-edit`, `axis-map-edit`,
     `notes-edit`, `change-session-applied`, `defer-indefinitely`
     (closed enum from `references/checkpoint-schemas.json` →
     `enums.halt_for_user_resolution_kind`).
   - **`halt_site:`** must equal the halt_site preamble value above
     (echoed for self-contained audit).
   - **`scenario:`** must equal the scenario preamble value above.
   - **`resolution_text:`** non-empty prose describing what you did
     and why. The next session's step 0 (Phase 5.4) reads this text
     and stamps it on the `halt-for-user-resolved` log entry.
5. Run `/program` again. Step 0 detects the `## Resolution` block,
   archives this file as `halt-for-user-resolved-<timestamp>.md` (RCA
   preservation per Phase 5.6), writes a paired `halt-for-user-resolved`
   log entry, and continues.

Do NOT delete this file before resolving. Do NOT touch the
`_program_workspace/halt-for-user` sentinel manually — step 0 cleans
it on the next session.

<!-- The user appends the block below. Do not edit anything above this marker. -->

## Resolution

- **resolution_kind:** defer-indefinitely
- **halt_site:** step-0-naming-backfill-violation
- **scenario:** N/A
- **resolution_text:** web/src/main.tsx is a standard React composition root with a canonical entry-point name. The `if (root)` null guard is idiomatic React bootstrapping, not business logic. Registered as scaffolding exempt — no rename needed.
