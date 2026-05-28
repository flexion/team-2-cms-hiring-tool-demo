# Tech Stack

## Architecture

Single-directory frontend SPA with a thin local dev-server layer for Bedrock access. Vite + React + TypeScript monolith. All data is local (in-memory store or JSON fixtures). The LLM integration flows through a Vite server middleware route (`/api/llm`) that calls AWS Bedrock server-side — this avoids exposing AWS credentials in the browser bundle. The app runs with `npm run dev`.

## Project Paths

| Concern | Path |
|---|---|
| Test runner | web/test/scenarios.test.tsx |
| Scenario adapter | web/test/scenario-adapter.tsx |
| Test driver (UI/HTTP helpers) | web/test/test-driver.tsx |
| Test infrastructure directory | web/test/ |

### Source root (per layer)

| Layer | Source root | Notes |
|---|---|---|
| web | src | TypeScript/Vite default |

## Coverage Scope

| Category | Glob patterns | Notes |
|---|---|---|
| Application logic (100% required) | web/src/**/*.ts | Domain logic, stores, adapters — all non-UI executable code. |
| UI modules (scaffolding exempt) | web/src/**/*.tsx | React components and views. |
| Excluded from coverage | **/*.d.ts, web/test/** | Type-only files, test infrastructure. |

| Layer | Coverage command | Notes |
|---|---|---|
| web | npx vitest --coverage | Single layer, default test suite. |

## Web

| Concern | Choice | Library | Notes |
|---|---|---|---|
| Build tool | Vite | vite | Fast HMR, native ESM. |
| UI framework | React 18 | react, react-dom | Standard SPA framework. |
| Styling | USWDS | @uswds/uswds | U.S. Web Design System — standard for federal government sites. |
| Components | USWDS React | @trussworks/react-uswds | Accessible, compliant USWDS components for React. |
| Fonts | Public Sans | @fontsource/public-sans | USWDS default font for federal sites. |
| Routing | React Router 6 | react-router-dom | Client-side SPA routing. |
| Markdown editor | MDXEditor | @mdxeditor/editor | Rich WYSIWYG markdown editing for PD drafts. |
| Icons | Lucide React | lucide-react | Consistent icon set, tree-shakeable. |
| LLM | AWS Bedrock | @aws-sdk/client-bedrock-runtime | Converse API via Vite server middleware. Auth via AWS env vars. |

## Testing

| Layer | Tool | Library | Approach |
|---|---|---|---|
| Acceptance tests | Vitest + Testing Library | vitest, @testing-library/react, @testing-library/user-event | BDD-style Given/When/Then. |
| Test environment | happy-dom | happy-dom | Fast DOM simulation. |
| Coverage | @vitest/coverage-v8 | @vitest/coverage-v8 | 100% line coverage on domain logic. |

### Pre-test build command

`(none)`

## Auth

| Concern | Choice | Library | Notes |
|---|---|---|---|
| Auth | In-memory session (no real auth) | N/A | Local demo only — no login flow. The "securely signed in" narrative signal creates the auth interface shape, but the dev implementation auto-authenticates. |

## Explicitly Avoided

| Technology | Why |
|---|---|
| Next.js | YAGNI — no SSR, no API routes needed. Pure client-side SPA is simpler. |
| External database (PostgreSQL, DynamoDB) | Local-only demo. In-memory store with JSON fixtures. |
| Cloud storage (S3, GCS) | No file uploads for this demo. Resumes are pre-loaded sample data. |
| Prisma / Drizzle | No database, so no ORM needed. |
| Redux / Zustand | In-memory store behind a domain interface is sufficient. No global state library. |
| Storybook | Demo scope doesn't warrant isolated component development tooling. |
| openai | Using AWS Bedrock directly — no OpenAI-compatible proxy needed. |
| @anthropic-ai/sdk | Using AWS Bedrock Converse API — model-agnostic, managed by AWS credentials. |
| Tailwind CSS | Replaced with USWDS for federal government compliance and accessibility. |
| shadcn/ui | Replaced with @trussworks/react-uswds for federal-compliant components. |

## Testable Constraints

### Dependencies

- web/package.json includes @fontsource/public-sans.
- web/package.json includes @uswds/uswds.
- web/package.json includes @trussworks/react-uswds.
- web/package.json includes @mdxeditor/editor.
- web/package.json includes react-router-dom.
- web/package.json includes @aws-sdk/client-bedrock-runtime.
- web/package.json does not include openai.
- web/package.json does not include next.
- web/package.json does not include prisma.
- web/package.json does not include @anthropic-ai/sdk.
- web/package.json does not include tailwindcss.
- web/package.json does not include @radix-ui/react-dialog.

### File Tree

- web/src/main.tsx imports @fontsource/public-sans.
- web/src/main.tsx imports @uswds/uswds/dist/css/uswds.min.css.
