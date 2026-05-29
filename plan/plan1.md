We are starting on building a new application.

Please look at [cms-hiring-poc-hypothesis.html](../cms-hiring-poc-hypothesis.html) for hypothesis
Please look at [cms-hiring-synthesis.html](../cms-hiring-synthesis.html) for background beind the hypothesis.

Create a manifest-mode implementation plan for this application.



The plan should:

1. Start with Phase 0a (bootable skeleton — health endpoint +
   hello-world frontend + Docker local dev) and Phase 0b (deploy
   skeleton to cloud) before any feature work. Nothing exists
   until it runs.

2. Organize features as vertical slices, not horizontal layers.
   Each slice produces a working, testable feature end-to-end
   (DB + API + frontend + smoke test).

3. Build in waves of increasing complexity:
    - Wave 1: zero auth, zero validation — get CRUD working
    - Wave 2: add input validation and error handling
    - Wave 4: replace AI stubs with real integrations

4. Produce a manifest.yaml with phases, work units, dependency
   graph, verification commands, and model recommendations
   (haiku for CRUD/tests/UI, sonnet for deployment/auth/AI).

5. Generate contract fixtures (valid + invalid JSON) for every
   shared type before implementation begins.

6. Include issue templates for each work unit sized for parallel
   subagent execution in distinct git worktrees (

7. Design for the orchestrator to own hot files (router, App.tsx,
   package.json, shared types). Workers never modify those —
   they note needed changes in result.json.

8. Include a preflight.sh for environment validation and
   auth-aware smoke-test.sh for local and deployed verification.

Split the plan across separate documents so no single document
exceeds LLM context limits. 

>>>>>


>>> FRANK LOOP
Once a sub-agent is done, have another sub-agent review its
work. If there are any recommendations, have another sub-agent
consider them and implement them. Repeat this process in a loop
until all sub-agents achieve consensus that the result is
incredibly high quality (10/10, exceptional work, absolutely
zero issues, minor or otherwise) and does not require any
revisions.
> 
> >>> END FRANK LOOP

When the plan is complete, have subagents with the plan as
context, and only the plan as context, create two documents -
one that's focused on what functionality/features is being
implemented, so, suitable for executive level, board meeting,
sales/marketing that sort of thing. Then I need a principal
software architect/engineer CTO type. Each should be at most
2 pages when converted to PDF using `pandoc`, including
diagrams. I don't need any implementation timeline information
- the executive summary document is meant to clearly articulate
  what the systems' features/capabilities/etc. are. The principal
  architect/CTO is meant to give a technical view into the
  implemented system, based on what the plan articulates. In both
  instances, assume "the implementation plan is completed".
  Diagrams should look professional, not low-fidelity ASCII
  diagrams or basic mermaid diagrams. They should be clear,
  well-labeled, and visually appealing, suitable for inclusion
  in a professional presentation or report.