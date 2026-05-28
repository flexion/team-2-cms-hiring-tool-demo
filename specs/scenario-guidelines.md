# Scenario Writing Guidelines

These guidelines are derived from the patterns in the scenarios that drive the `/program` development process. Each scenario becomes the single source of truth for what gets built — the tests, the code, and the architecture all emerge from what's written here. Write carefully.

## Template

```markdown
## Scenario: <Verb Phrase Describing the Business Action>

### Actor
<Full Name>, a human <role> (with <Secondary Actor Name>, a human <role>, <doing what>, if applicable)

### Preconditions

<Bullet list or table describing the exact system state before this scenario begins.>

### Narrative

<Story written in past tense, from the perspective of the actor(s). Describes what happened, why, and what the system did in response.>

### Postconditions

- <Each postcondition is one verifiable assertion about the system state after the narrative completes.>
```

## Section-by-Section Guidelines

### Scenario Name

Name the scenario after the business action, not the technical implementation. Use a verb phrase that a role from the scenarios would recognize.

| Good | Bad |
|---|---|
| Initialize a Contract and Define Positions | Create Contract API Endpoint |
| Move a Person | Transfer Employee Between Teams |
| Close Out a Contract | Delete Contract and Cascade |

The name should answer: "What happened from the business's perspective?"

### Actor

**Name the primary actor with a full name, role, and interface type.** The persona makes the scenario concrete; the role is what the system cares about; the interface type — `human` or `programmatic` — tells the test harness how to drive that actor's narrative actions.

```
Sarah, a human Resource Manager
Chris Maddox, a human recruiter
The Inventory Sync Service, a programmatic consumer
```

**If secondary actors participate, name them in parentheses with their own interface type** and a brief description of their involvement:

```
Sarah, a human Resource Manager (with Chris Maddox, a human recruiter, filling a role later)
Amanda Smith, a human Claimant (with Thomas Ly, a human Claims Examiner, investigating and settling the claim)
The Order Service, a programmatic consumer (with the Inventory Service, a programmatic consumer, reserving stock)
James Okafor, a human Senior Full-Stack Engineer (with coordination from Sarah, a human Director, and the CI Pipeline, a programmatic consumer, reporting build status)
```

**The `human`/`programmatic` keyword can be omitted in unambiguous cases (DSR-16).** When an actor line lacks the keyword, the orchestrator tries bidirectional inference at S1: (1) if the role descriptor contains a programmatic role-descriptor word (`service`, `consumer`, `scheduler`, `bot`, `daemon`, `worker`, `integration`, `listener`, `mock`, `api-client` — the closed enum at `references/checkpoint-schemas.json` `enums.programmatic_role_descriptor`), infer `programmatic`; (2) else if the name has personal-name shape (capitalized-first + capitalized-last+ tokens per `regex_refs.personal_name`) AND the role descriptor contains a human role-descriptor word (`applicant`, `claimant`, `clerk`, `customer`, `driller`, `employee`, `examiner`, `inspector`, `manager`, `recruiter` — the closed enum at `enums.human_role_descriptor`), infer `human`; (3) otherwise halt for explicit declaration. **You can still write the keyword explicitly** — it makes the scenario unambiguous regardless of what enum membership might change in the future. Recommended: write the keyword explicitly for the first few scenarios of any project, and rely on inference only after you've seen which cases your role names fall into. Single-name actors (e.g., "Sarah"), hyphenated names, names with middle initials, names with accented characters, and role descriptors not in either closed enum all fall to halt for explicit declaration — the inference covers the dominant case, not every edge.

**Why explicit declaration is still recommended in edge cases:**

A test must exercise the same interface the production actor will use — UI for humans, HTTP for programmatic consumers — because **bypassing the actor's real interface creates bug opportunities, and we've seen it happen repeatedly.** Code paths exercised only by the real interface (UI rendering, form validation, accessibility wiring, focus management; or API authentication, payload shaping, error responses) get no coverage when the test goes around them. Bugs in those paths ship to production because nothing in the test ever touched them. The bidirectional inference covers the cases where the role + name evidence is unambiguous; the halt-for-explicit-declaration fallback preserves the defense for ambiguous cases.

Earlier versions of this process used a "primary = human; secondaries = HTTP" shortcut that produced exactly this failure: a scenario with a human secondary actor (e.g., Thomas, the Claims Examiner) had all of his narrative actions tested through HTTP, so no test ever demanded that his UI be built. The Examiner UI stayed a placeholder while every "Examiner can see..." postcondition passed against a JSON response. The same failure mode applies symmetrically to programmatic actors driven through UI — the API contract goes untested even when the UI happens to render correctly. Per-actor declaration (explicit OR inferred) is the runtime guard: if you write `Thomas, a Claims Examiner`, the inference resolves to `human` (personal-name + "examiner" in human enum); his actions must drive his UI, his UI must exist, and the test demands it.

Mechanically, the interface type binds each actor's narrative actions to a specific test driver. Human actors drive through the project's UI testing library: each action a human performs in the narrative becomes a UI interaction in their authenticated browser session. Programmatic actors drive through HTTP: each action becomes an API call. When a scenario has multiple actors, each gets their own session — one rendered tree per human, one HTTP client per programmatic actor — and verifiers route to the right one.

**Why roles are the most important thing in the scenario:**

Role names are the primary signal that tells the system when to split modules apart. Each distinct role represents a distinct set of interests — a different reason the system might need to change. When the process sees two roles interacting with the same code, it recognizes two axes of change and splits the module so each role's concerns can evolve independently.

This means: **if two people use the system but care about different things, they need different role labels** — even if the org chart calls them the same title. "Sarah, a Resource Manager" and "Chris, a recruiter" is what told the system that contract management and vacancy filling are different concerns. If both had been written as "a Resource Manager," the system would never have seen two axes and the architecture would have stayed monolithic.

The inverse matters too: **don't invent separate roles for people who have the same interests.** Two Resource Managers doing the same work should share a role name. Artificial role distinctions create artificial splits.

Getting the role names right is the single most important thing a scenario writer does for the system's architecture. Everything else — the template, the preconditions, the postconditions — is mechanics. The roles are the design.

**How actors affect the process mechanically:**
- Each actor's narrative actions are driven through that actor's declared interface — `human` actors drive through UI in their own session; `programmatic` actors drive through HTTP.
- Each `<role> can see <X>` postcondition is verified through the actor's declared interface — UI assertions for humans, HTTP assertions for programmatic consumers.
- Preconditions are always set up programmatically (HTTP), regardless of any actor's interface type. Preconditions are setup, not actor behavior.
- The actor's role replaces their proper name in test descriptions ("a Resource Manager sees..." not "Sarah sees...").

### Preconditions

State the exact system state before the scenario begins. This is what the test setup must reproduce.

**Rules:**

1. **Be explicit about what exists and who created it.** Don't assume the reader knows the history. Reference previous scenarios by describing their outcomes, not by name.

   ```
   Good: Sarah previously created the VA Benefits Portal Modernization contract with the Portal Dev Team.
   Bad:  The system is in the state from Scenario 1.
   ```

2. **Use tables for roster state.** When the scenario depends on specific assignments, show them:

   ```
   | # | Role | Person | Type |
   |---|---|---|---|
   | 1 | Staff Software Engineer — Tech Lead | Marcus Chen | Flexion |
   | 2 | Senior Full-Stack Engineer | *(open)* | — |
   ```

3. **State who is NOT in the system.** If the scenario introduces new people, say so explicitly:

   ```
   - Amira Hassan is a newly hired Flexion employee who does not yet exist in OpenRoles.
   - Elena Vasquez is a vetted subcontractor at TechBridge Solutions but does not yet exist in OpenRoles.
   ```

4. **Name the other actors.** If the scenario references people in other roles (recruiters, other resource managers), name them in the preconditions so the test knows who does what:

   ```
   - Chris Maddox is the recruiter.
   - Tom Reeves is the Resource Manager for Contract 2.
   ```

5. **Signal infrastructure dimensions with natural language.** The process watches for specific phrases to trigger architectural splits. Use them when they apply:

   | Phrase | What it triggers |
   |---|---|
   | "works from a different computer" | Usage distribution — cross-machine, needs durable persistence |
   | "the next morning" | Usage distribution — data must survive a restart |
   | "securely signed in" | Mode of interaction — auth infrastructure needed |
   | A new role appears as actor | Role facet — potential UI/workflow split |

### Narrative

Write a story in past tense describing what happened. The narrative serves three purposes: it reveals domain language, it specifies the sequence of actions, and it exposes business rules.

**Rules:**

1. **Write from the actor's perspective.** The actor does things; the system responds. "Sarah created a contract" not "The system received a contract creation request."

2. **Bold domain terms when they first appear.** This signals to the developer that these are the nouns and verbs of the domain model:

   ```
   She created a new contract: **Department of Veterans Affairs, Benefits Portal Modernization**.
   She named the team **Portal Dev Team**.
   James submitted a **Flexchange request** through the formal process.
   ```

3. **Constraints can appear in the narrative as context, but don't test them here.** If the narrative mentions a rule the system enforces, that's fine for storytelling — but the constraint itself should be declared in the `### Constraints` section and tested separately. Don't write a postcondition that asserts the system rejected an invalid operation. The narrative can acknowledge the constraint ("Sarah unassigned David before deleting the position") without the postconditions testing it.

4. **Include the WHY, not just the WHAT.** Business context helps the developer make better judgment calls about importance and design:

   ```
   She marked the Staff Software Engineer and Senior DevOps Engineer as Critical — 
   they'd need to make architecture and infrastructure decisions before anyone else 
   could be productive.
   ```

5. **Don't specify UI or API details.** The narrative is deliberately technology-free. Say "Sarah created a contract" not "Sarah filled in the contract form and clicked Submit." This gives the designer freedom to create the best interface for the situation.

6. **Use concrete data, not placeholders.** Real names, real titles, real company names. This makes the scenario testable and unambiguous:

   ```
   Good: She assigned Marcus Chen as the Staff Software Engineer.
   Bad:  She assigned an employee to the Tech Lead position.
   ```

### Postconditions

Each postcondition is a single verifiable assertion about the system state after the narrative completes. Every postcondition becomes a test. Nothing else becomes a test.

**Rules:**

1. **Start with who sees it.** Attribute observations to actors. This determines which adapter verifies the assertion:

   ```
   - Sarah sees the contract "VA Benefits Portal Modernization" with client name "Department of Veterans Affairs."
   - Chris sees 7 open positions on the vacancy board.
   - Tom sees the Claims Processing Team has 4 filled positions and 0 open positions.
   ```

2. **One assertion per bullet.** Don't combine multiple checks:

   ```
   Good:
   - Sarah sees the Portal Dev Team has exactly 8 positions.
   - Each position has a title and level.
   
   Bad:
   - Sarah sees 8 positions, each with a title and level.
   ```

3. **Use exact values, not ranges or approximations.** The test needs to assert something specific:

   ```
   Good: Sarah sees 3 positions filled and 5 positions open.
   Bad:  Sarah sees some positions are filled and some are open.
   ```

4. **Don't duplicate constraints as postconditions.** If the `### Constraints` section already declares an invariant (e.g., "a filled position cannot be deleted"), don't add a postcondition that asserts the same rejection. Constraints are tested by their own tests targeting the enforcement module. Postconditions test interaction outcomes — the state of the system after valid operations. A postcondition that asserts an invalid operation was rejected is a constraint masquerading as a postcondition and should be moved to the Constraints section.

5. **Test absence as well as presence.** When something is removed, verify it's gone from every relevant view:

   ```
   - Tomasz Nowak does not exist anywhere in OpenRoles — no person record, no role assignments.
   - A search for "Tomasz Nowak" returns no results.
   - All other role assignments on the Portal Dev Team are unchanged.
   ```

6. **Test cross-actor visibility.** If the action by one actor should be visible to another, say so. This forces the system to have shared state:

   ```
   - Chris sees the open Senior Full-Stack Engineer position on the Portal Dev Team on his vacancy board.
   ```

7. **Use mid-conditions to check state at intermediate points in the narrative.** When a scenario has a long flow and a later action destroys state you want to verify (e.g., closing a contract removes all the assignments you just set up), place a `### Mid-conditions` section inline in the narrative at the point where the check should happen:

   ```markdown
   ### Narrative

   Sarah created the contract, added positions, and assigned three people...

   ### Mid-conditions (after Sarah staffs the team)

   - Sarah sees 3 positions filled and 3 positions open.
   - Marcus Chen is assigned to Staff Software Engineer.

   Chris then filled the remaining vacancies...

   ### Mid-conditions (after all positions are filled)

   - All 6 positions are filled.
   - Chris sees no open positions on the vacancy board.

   Five months later, Sarah closed out the contract...

   ### Postconditions

   - The contract no longer exists.
   ```

   Mid-conditions appear **inline in the narrative**, at the exact point where they should be true. The narrative continues after each mid-conditions block. Postconditions appear at the end and represent the final system state.

   Both mid-conditions and postconditions produce test groups. Each group gets its own test setup — the setup replays the narrative up to that point. Use `(after <description>)` labels to identify each checkpoint.

8. **Use multiple postcondition groups (at the end) for multi-phase endings.** If the scenario has distinct phases that all happen at the end with no narrative between them, use labeled postcondition groups:

   ```
   ### Postconditions (after Marcus is assigned to both roles)
   - ...
   
   ### Postconditions (after Marcus is replaced by Kai Romero)
   - ...
   ```

   **When to use mid-conditions vs. multiple postcondition groups:**
   - **Mid-conditions:** The narrative continues after the check. Later actions change or destroy the state being verified. The check is a waypoint, not a destination.
   - **Multiple postcondition groups:** The scenario has distinct phases but they all describe end states. No narrative continues after the checks.

## Ordering Scenarios

Scenarios are implemented one at a time, in order. Later scenarios build on the state established by earlier ones. The order should follow the natural lifecycle of the domain:

1. **Start with creation.** The first scenario creates the core entities.
2. **Then exercise the primary workflow.** Fill the entities with data, assign people, do the main job.
3. **Then introduce variations.** Change the structure, move things around, handle edge cases.
4. **End with cleanup/lifecycle.** Close things out, remove things, verify cleanup.

Don't introduce a second role until the first role's primary workflow is complete. Don't test cleanup before there's something to clean up. Constraints are declared in the `### Constraints` section and tested separately — they don't need their own scenarios.

## Constraints

Constraints are domain invariants — rules the system must always enforce. They are declared within the scenario that introduces them, as a `### Constraints` section after the postconditions.

**Why constraints are separate from scenarios:**

A scenario describes an interaction — an actor does something, the system responds, and the state changes. A constraint describes what the system prevents — an operation that must always be rejected regardless of who tries it or how. Testing a constraint through a scenario forces you to construct an elaborate interaction just to trigger a rejection, and the test ends up coupled to a specific UI flow rather than to the invariant itself.

**Format:**

Constraints appear as a `### Constraints` section within the scenario that introduces them, after the postconditions:

```markdown
### Postconditions

- ...

### Constraints

- <Invariant statement>.
```

The constraint belongs to the scenario's actor's axis of change. The `/program` process writes the test when it processes that scenario, targeting whichever module enforces the business logic for that role.

**Rules:**

1. **One invariant per bullet.** State what the system prevents, not how the UI should handle it.

2. **Place constraints in the introducing scenario.** The constraint appears in the scenario that first creates the conditions where it could be violated — not collected at the top of the file, not in a future scenario.

3. **Don't duplicate constraints as postconditions.** If a constraint is declared here, no scenario postcondition should assert the same rejection. Constraints are tested by their own tests; postconditions test interaction outcomes.

4. **Narratives can acknowledge constraints without testing them.** "Sarah unassigned David before deleting the position" is fine in a narrative — it shows the actor working within the constraint. But the postconditions for that scenario should verify the outcome (position deleted, David on bench), not that the constraint was enforced.

5. **Constraints emerge from scenarios — don't write them in advance.** A constraint becomes relevant when a scenario creates the conditions where it could be violated. Don't declare a constraint before the scenario that introduces its context.

6. **Express what the system rejects, not what it allows.** A constraint sentence describes the rule the system must enforce — the operation it prevents. "A claims examiner cannot approve a claim whose amount exceeds their individual approval authority" expresses rejection. "Claims examiners can approve claims within their approval authority" describes allowance — that's a postcondition shape, not a constraint. The fidelity check at step 2a-verify (see `agents/test-fidelity-checker.md` check #5) verifies that the constraint test actually exercises the rejection: `constraintSetup` produces an invalid state, `constraintVerify` asserts the system refuses (`expect(...).rejects.toThrow(...)` or equivalent). A positive-path test against the domain module passes without proving the rejection works — the strengthened fidelity check fails such tests as missing behavioral fidelity.

## Quality Attributes

Some expectations apply to every scenario — they're not specific to one business action but are properties the system must always have. These belong in the **Quality Attributes** section of `specs/ui-design-constraints.md`, alongside the other human-provided design inputs.

Quality attributes are **design constraints, not test cases.** They don't produce `it()` blocks. Instead, they are read by the `/program` process during the Grow step and treated as binding requirements when building UI components. A quality attribute like "every form must have a cancel path" means the developer adds a cancel button to every form — not because a scenario postcondition said to, but because the quality attribute requires it.

Examples:
- Escapability — cancel/back-out paths on all flows
- Recognition over recall — selection from lists instead of free-text entry
- Visibility of system state — confirmation messages, error feedback

Quality attributes also justify **UI scaffolding** that wouldn't otherwise have a scenario driving it. This aligns with the coverage rule exception: see the architecture principles document → 'UI scaffolding exemption' for the canonical list. These are structural affordances required by quality attributes, not by individual scenarios.

## What NOT to Write

- **Don't write implementation hints.** No "using a REST API" or "in a modal dialog" or "stored in DynamoDB."
- **Don't write test steps.** The narrative is a story, not a test script. "Click the Create button" is a test step; "Sarah created a contract" is a narrative.
- **Don't invent postconditions for behaviors the narrative didn't describe.** If the narrative didn't mention sorting, don't add a postcondition about sort order.
- **Don't reference other scenarios by number or name.** Each scenario's preconditions should be self-contained. Describe the state, don't point at another scenario.
- **Don't write scenarios for technical concerns.** "The system handles 1000 concurrent users" is a non-functional requirement, not a scenario. Scenarios describe business actions by named people.
