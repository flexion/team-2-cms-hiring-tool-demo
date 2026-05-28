# UI Design Constraints Guidelines

This document explains how to fill in `ui-design-constraints.md`. The `/flexion-frontend-design` skill reads that file to generate the design system (`specs/ui-design-reference.md`). Your constraints are the inputs; the reference is the output.

## Why This File Matters

The grow-split-merge process styles UI components from the first iteration — there is no "make it work, then make it pretty" phase. When the process builds a form or a screen, it needs to know your colors, typography preferences, and interaction principles immediately. Without constraints, the design skill generates a generic design system. With constraints, it generates one that looks and feels like your product.

Quality attributes in this file are also enforced during implementation and audited at the Scenario Completion Gate. They're not suggestions — they're binding requirements.

## How to Fill In Each Section

### Context

Give the design skill enough context to make good composition decisions. What kind of application is this? Who uses it — internal employees, external customers, both? Is it data-heavy (dashboards, tables) or workflow-heavy (forms, wizards)? Are there navigation considerations — multiple feature areas that need room to grow?

This section doesn't need to be long. Two or three sentences that orient the designer are enough.

### Platforms

State which platforms the app must support. "Desktop and mobile" is the most common answer, but be specific if there are constraints: "primarily desktop, mobile is view-only" or "tablet-first for field workers." This drives layout decisions — a desktop-only app can use complex multi-column layouts that wouldn't work on mobile.

### Brand Assets

Drop actual files (logos, color palette PDFs, icon sets) into the `specs/` directory and reference them here by path. The design skill reads images and PDFs directly — it can extract colors from a palette PDF and use logo files for placement decisions.

If you don't have formal brand assets, that's fine. Describe what you want: "clean and professional, blue tones, minimal decoration" gives the design skill enough to start.

### Colors

If you have specific brand colors, list them with hex values. Categorize them as Primary (the main palette used everywhere) and Expanded (additional colors for status indicators, accents, or data visualization). The design skill maps these to semantic roles (background, text, accent, success, error, warning) when generating the reference.

If you don't have specific colors, leave this section empty and describe your preferences in Context. The design skill will generate a coherent palette.

### Quality Attributes

These are the most important part of the file. Quality attributes are cross-cutting interaction principles that apply to every screen. They're not features — they're properties the system must always have.

The template includes three standard attributes (escapability, recognition over recall, visibility of system state). These are good defaults for most applications. Modify them to fit your product, or add more.

When writing a quality attribute, state the principle, then explain what it means concretely. "Escapability" alone is ambiguous. "Every modal, form, and multi-step flow must have a cancel or back-out path" is actionable.

Good quality attributes are testable by inspection — you can look at a screen and verify whether it satisfies the attribute. "The app should feel fast" is not a quality attribute. "Every action must produce visible feedback within 200ms" is.

**How quality attributes affect the process:**

During the Grow step, every quality attribute is applied as a binding constraint when writing UI code. A modal without a cancel button violates escapability and will be caught. At the Scenario Completion Gate, a quality attributes audit re-scans all UI modules for violations.

Quality attributes also justify UI scaffolding — structural affordances like back buttons, empty states, and responsive layout that exist because of the attributes, not because a specific scenario asked for them. This aligns with the coverage rule exception: UI scaffolding is not deleted during coverage enforcement.

### Testable Constraints

Quality attributes are abstract principles. Testable constraints are their concrete, enforceable children — specific rules you can assert against the rendered UI. The `/program` process generates automated tests from testable constraints the same way it generates tests from scenario postconditions. If a testable constraint isn't satisfied, the test fails and the Grow step must fix it.

**Two categories of design constraints:**

- **Testable** — You can assert against the DOM. "Every modal has a visible close or cancel button." "The topbar renders the company logo SVG." "After a successful action, a success indicator appears." These go in the `## Testable Constraints` section and produce automated tests.
- **Judgment** — You can only evaluate by looking. "Information density is high but organized." "The design feels utilitarian, not playful." These stay in `## Quality Attributes` as guidance for the `/flexion-frontend-design` skill and are audited by inspection at the Scenario Completion Gate.

**How to write a testable constraint:**

State what should be true about the rendered UI in a way that a test can verify. The test will render the component and check for the presence, absence, or state of specific elements.

Good testable constraints are:
- **Specific:** "Every modal has a visible close or cancel button" — testable (query for the button).
- **Cross-cutting:** They apply to every screen or component, not to one scenario. A constraint about a specific business entity ("the contract list sorts by date") is a postcondition, not a design constraint.
- **Positive or negative:** "The topbar renders the logo SVG" (positive — element must exist) or "No free-text input for identifying existing people" (negative — element must not exist in that context).

Bad testable constraints are:
- **Vague:** "The UI looks professional" — can't be queried.
- **Scenario-specific:** "Sarah sees 3 positions" — that's a postcondition.
- **Implementation-prescriptive:** "Use a shadcn Dialog component" — that's a technology choice, not a design constraint.

**Organize by quality attribute.** Group testable constraints under the quality attribute they enforce (Escapability, Recognition Over Recall, etc.). Add a "Brand" group for brand asset rules and a "Layout" group for structural rules that don't fit under a specific attribute.

**When to add testable constraints:**

Add them when you realize a quality attribute or brand asset implies something concrete and checkable. Common triggers:
- You have brand assets (logos, icons) and want to ensure they're actually rendered, not replaced with placeholders
- A quality attribute like "escapability" implies specific UI patterns (cancel buttons, overlay dismiss, Escape key) that should be present everywhere
- You want consistent feedback patterns (success banners, error messages, loading indicators) across all screens

**Realization mechanism.** At session-start, `/program` Step 1.5 ("Cross-Cutting Constraint Realization") invokes the `design-constraint-test-generator` sub-agent on this section's contents. The agent produces `<ui-layer>/test/design-constraints.test.tsx` — one `describe` block per `###` heading, one `it` per constraint sentence — using runtime component discovery (Vite's `import.meta.glob`) and forall-over-discovered-set assertions. Tests run alongside scenario tests; failures surface as red and the grow loop drives them green as components materialize that satisfy the rule. A constraint the agent cannot realize as a DOM-assertable test (vague prose, judgment calls) is reported as `unrealized` so you can rewrite it or move it to `## Quality Attributes`. Constraints become enforcement via the test suite, not advisory notes.
