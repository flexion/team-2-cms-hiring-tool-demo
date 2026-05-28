# Tech Stack Guidelines

This document explains how to fill in `tech-stack-recommendations.md`. The `/program` process reads that file before introducing any technology — if a category isn't listed, the process stops and asks you. This is intentional: technology choices are yours, not the AI's.

## Why This File Matters

The grow-split-merge process enforces architectural boundaries through the mode-of-interaction facet. Every infrastructure concern (persistence, auth, HTTP framework) gets an interface owned by the domain, with separate implementations for development (fast, in-memory, deterministic) and production (real database, real auth, real deployment). The tech stack file tells the process which production technologies to use when building those implementations.

Without this file, the process has no basis for choosing between PostgreSQL and DynamoDB, or between Express and Hono. It would have to guess — and guessing leads to rework.

## How to Fill In Each Section

### Architecture

Describe the physical project layout. This doesn't need to be elaborate — it tells the process where to put files.

Questions to answer: Is frontend and backend in the same directory or separate? Is it a monorepo with workspaces? A single application? The process uses this to know where source modules, test infrastructure, and entry points live.

### Project Paths

These paths are read by the test runner and condition checkers to find your source modules and test infrastructure. Get them right — wrong paths mean the condition checkers evaluate the wrong files.

The key paths are: where the test runner lives, where the scenario adapter and test driver live, what directory contains test infrastructure (so it gets excluded from condition checking), and what directories contain vendored or generated code (also excluded).

### Coverage Scope

The default is simple: **100% coverage on everything except UI scaffolding.** Every source module requires 100% line coverage. UI modules (components, views, pages) get a partial exemption — uncovered structural affordances (back buttons, modal dismiss, responsive layout, empty states, navigation) are kept because users need them regardless of scenarios. All other uncovered code is deleted.

You can leave the Coverage Scope table empty and the default applies. Fill in specific glob patterns only if the default doesn't fit — for example, if you need to explicitly separate which files are "application logic" vs "UI" because the file extensions alone don't distinguish them.

**Application logic** includes everything that implements business behavior: domain modules, stores, routes, API handlers, infrastructure adapters, composition roots. If the file contains executable code that makes the system work, it belongs here.

**UI modules** are components, views, and pages. They get a partial exemption: uncovered *business logic* in UI modules is deleted (domain rules, data transformations), but uncovered *UI scaffolding* is kept. These are structural affordances every user needs.

**Excluded files** produce 0 executable lines (type-only `.d.ts` files, interfaces with no runtime code) or aren't application code (test infrastructure, vendored components, generated code). These are excluded automatically per Project Paths — you don't need to list them again unless you have additional exclusions.

**Instrumentability:** If your project has multiple layers (e.g., api/ and web/) and the test runner only instruments one, the other layer's code is invisible to coverage. This is a silent gap — the gate passes at "100%" because it never sees the uninstrumented files. List every layer's coverage command in the instrumentability table so the process runs all of them. If a layer can't be instrumented (subprocess issue), fix the test architecture — either use in-process testing or configure a separate coverage pass.

### Technology Tables (API, Web, Testing, Auth)

For each concern, name the specific technology and explain briefly why you chose it. The "Notes" column is important — it helps the process (and future you) understand the reasoning. If a technology gets reconsidered later, the notes explain what would need to change.

The **Library** column names the specific package or module imported in code (e.g., `@aws-sdk/client-dynamodb`, `express`, `zod`). Comma-separated if multiple packages serve the same concern. The condition checker uses this to determine which operations in an infrastructure module are directly coupled to the technology — those operations are on the mode-of-interaction axis. For tech-stack libraries (non-boundary), they need production and development counterparts (two plumbing modules). For external-boundary libraries with a Mock Endpoint Specification, they additionally need a demonstration counterpart (three plumbing modules). Operations that map between semantic levels without importing this library are translation — they're tested through the plumbing's development counterpart. External boundaries have a parallel Library field that serves the same purpose — see external-boundaries-guidelines.md. The Library column is most relevant for infrastructure-tier technologies (databases, APIs, auth, deployment). Build tools, test runners, and styling frameworks may have a Library entry but won't typically appear in the condition checker's mode-of-interaction evaluation because those libraries don't appear in infrastructure modules.

Cover every concern you can anticipate: framework, runtime, validation, database, deployment, build tool, UI framework, styling, component library, fonts, test runner, test environment, coverage tool, and auth approach.

### Pre-test build command

This is a single command the orchestrator runs at gate item 1 before the gate's test-run, ONLY when some tests in your suite require build artifacts to exist (e.g., a CSS bundle file, a transpiled output, a compiled binary). Common pattern: tests using `it.skipIf(!existsSync(...))` to guard build-artifact assertions. Without the pre-test build, those tests silently skip — the test framework reports them as `skip`, not `fail`, so neither the orchestrator nor the gate notices the missing assertion coverage.

Set this only when some tests need build artifacts. Leave as `(none)` otherwise — most projects don't need it. The orchestrator runs the command verbatim from the project root before the gate test-run; iteration-level test-runs deliberately don't invoke it (one build per gate, not per iteration).

### Explicitly Avoided

This section prevents the process from introducing technologies you've already considered and rejected. Without it, the process might suggest Next.js for a project where you've deliberately chosen a simpler SPA, or suggest Prisma when you want direct database access behind port interfaces.

For each avoided technology, explain why. "YAGNI" and "too much abstraction" are valid reasons. The explanation helps when someone asks "why not X?" six months later.

### Testable Constraints

The technology tables and Explicitly Avoided list declare your choices. The Testable Constraints section turns those declarations into automated assertions: at session-start, `/program` generates a test file (typically `<ui-layer>/test/tech-stack-constraints.test.ts`) that runs alongside scenario tests and fails when an artifact drifts from a declared rule. If `package.json` is supposed to include `@fontsource/montserrat` and doesn't, the test goes red and the grow loop drives a fix.

**Two categories of tech-stack rules:**

- **Testable** — You can assert against a deterministic file-system fact. "package.json declares the declared font packages." "The web build produces a CSS bundle containing the brand primary hex color." "web/index.css imports tailwindcss." These go in the `## Testable Constraints` section.
- **Judgment** — You can only evaluate by inspection. "The build is fast enough." "The dev server starts in under 2 seconds." These don't belong here — they need either a separate performance budget mechanism or stay as `Notes:` prose in the technology tables.

**How to write a tech-stack testable constraint:**

State what should be true about a file or build artifact in a way the test can verify with `fs.readFileSync` and an `expect` call. The generator agent produces tests that read package.json files, parse them, and assert on declared dependencies; that read CSS bundles in `dist/` and assert content; that check file-tree shape.

Good tech-stack testable constraints are:
- **Specific:** "web/package.json includes @fontsource/montserrat" — the test reads the file, parses JSON, asserts the dependency.
- **Tied to a declaration elsewhere in this file:** if the `## Web` Fonts row says Montserrat, the constraint asserts the package is installed. The constraint is the bridge between the human-readable choice and the machine-checkable fact.
- **Positive or negative:** "package.json declares X" (positive) or "package.json does not declare Y" (negative — typically pairs with `## Explicitly Avoided` entries).

Bad tech-stack testable constraints are:
- **Runtime judgments:** "the build is fast" — vitest can't measure that.
- **Long-running:** "the dev server starts within 2s" — would need to spawn a subprocess; doesn't fit the test-run-once model.
- **Implementation-prescriptive when the tech-stack table already declares it:** "use Vite as the build tool" — that's already in the technology table; the testable form is "package.json devDependencies includes vite," which adds enforcement.

**Organize by class.** Use `### Dependencies` for package.json assertions, `### Build Output` for assertions about generated files (CSS bundles, dist/), `### File Tree` for assertions about source files (imports, configs). Add subsections as needed; the generator agent groups tests by `###` heading.

**Do not duplicate scenario coverage.** Tech-stack constraints are repo-wide rules about artifacts. Behaviors specific to a scenario (a particular endpoint responding correctly) belong in scenario postconditions, not here.

## Principles for Good Choices

**Own your dependencies.** Prefer technologies where, if the library disappeared, migration would be mechanical. Isolate every external dependency behind a wrapper module (the Invasive Species Rule). This means the choice of framework, ORM, or component library is always reversible.

**Match complexity to the problem.** An internal CRUD tool behind auth doesn't need SSR, GraphQL, or edge middleware. A public-facing product with SEO requirements might. Let the actual requirements (your scenarios) drive the complexity budget.

**Two or three implementations for every infrastructure concern.** When you choose a production database or auth provider, you're also implicitly choosing that an in-memory implementation will serve development and testing. Make sure the production choice can be reasonably faked in-memory for fast, deterministic tests. For external boundaries (listed in `specs/external-boundaries.md`), a third implementation — demonstration — is generated by `/program` from the Mock Endpoint Specification that `/mock-context` writes. Demonstration is a thin HTTP client pointed at the local mock server, used for offline demos and frontend development. Demonstration does not apply to non-boundary tech-stack infrastructure (databases, auth libraries, local validation) because there is no mock server for those — those concerns stay at two implementations (development + production).

**Mode is a composition-root selection.** The composition root reads an environment variable (e.g., `MODE=development|production|demonstration`, or whatever your project uses — document the convention in this file) to map each concern to a plumbing module. `development` uses development plumbing for everything (tests). `production` uses production plumbing for everything (production). `demonstration` uses demonstration plumbing for boundaries and development plumbing for non-boundary concerns (offline demos that exercise the real HTTP path for external calls while keeping datastores in-memory).

**State your non-choices explicitly.** The Explicitly Avoided section is as important as the technology tables. It encodes your reasoning and prevents the process from relitigating settled decisions.
