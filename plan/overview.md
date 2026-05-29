# CMS Hiring POC — Implementation Overview

## Application Purpose

This application is a unified, LLM-enhanced position management workspace for CMS OIT BOG staff navigating federal job postings in the "ready-to-post through certificate issued" window. It replaces the personal Excel trackers, informal CMS Chat workarounds, and disconnected document repositories that staff currently rely on with a shared, structured, AI-augmented tool. The three core features — Position Tracker, Working Copy Editor, and Resume Reader — directly address the visibility, drafting quality, and review efficiency gaps confirmed in May 2026 discovery research.

**Scope: LOCAL DEVELOPMENT ONLY.** This is a proof-of-concept for internal demonstration. There is no cloud deployment, no CI/CD pipeline, and no Railway or AWS ECS target. All services run in Docker Compose on a developer's machine.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript + Vite 5 |
| Frontend styling | Tailwind CSS |
| Frontend data | @tanstack/react-query + axios |
| Frontend routing | react-router-dom v6 |
| Backend framework | Java 21 + Spring Boot 3.x |
| Backend ORM | Spring Data JPA (Hibernate 6.x) |
| Migrations | Flyway |
| Database | PostgreSQL 16 (Docker container) |
| LLM | AWS Bedrock (Claude 3.5 Sonnet via `anthropic.claude-3-5-sonnet-20241022-v2:0`) |
| Embeddings | AWS Bedrock (Amazon Titan Embeddings V2 `amazon.titan-embed-text-v2:0`) |
| PDF parsing | Apache PDFBox 3.x |
| DOCX parsing | Apache POI (poi-ooxml 5.x) |
| Containerization | Docker + docker compose (local dev only) |
| Build | Gradle (Kotlin DSL — build.gradle.kts) |
| Testing | JUnit 5 + Mockito + Spring Boot Test + Testcontainers (PostgreSQL) |
| Scripts | Python 3 (required by `scripts/local-verify.sh` and `plan/smoke-test.sh` for JSON parsing) |

## Directory Structure

```
cms-hiring-poc/
├── backend/                                        # Spring Boot application
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/gov/cms/hiring/
│   │   │   │   ├── Application.java               [HOT FILE]
│   │   │   │   ├── config/
│   │   │   │   │   └── WebConfig.java
│   │   │   │   ├── controller/
│   │   │   │   │   ├── HealthController.java
│   │   │   │   │   ├── PositionController.java
│   │   │   │   │   ├── PDDocumentController.java
│   │   │   │   │   ├── ResumeController.java
│   │   │   │   │   ├── AIController.java
│   │   │   │   │   └── QualificationMappingController.java
│   │   │   │   ├── service/
│   │   │   │   │   ├── PositionService.java
│   │   │   │   │   ├── PDDocumentService.java
│   │   │   │   │   ├── ResumeService.java
│   │   │   │   │   ├── BedrockService.java         # interface
│   │   │   │   │   ├── BedrockServiceStub.java     # Wave 1 stub
│   │   │   │   │   ├── BedrockServiceImpl.java     # Wave 4 real impl
│   │   │   │   │   ├── ResumeParserService.java
│   │   │   │   │   └── EmbeddingService.java
│   │   │   │   ├── repository/
│   │   │   │   │   ├── PositionRepository.java
│   │   │   │   │   ├── PDDocumentRepository.java
│   │   │   │   │   ├── ResumeRepository.java
│   │   │   │   │   └── QualificationMappingRepository.java
│   │   │   │   ├── model/
│   │   │   │   │   ├── Position.java
│   │   │   │   │   ├── PositionStatus.java
│   │   │   │   │   ├── PDDocument.java
│   │   │   │   │   ├── PDDocumentStatus.java
│   │   │   │   │   ├── Resume.java
│   │   │   │   │   ├── ResumeStatus.java
│   │   │   │   │   └── QualificationMapping.java
│   │   │   │   ├── dto/
│   │   │   │   │   ├── PositionDto.java
│   │   │   │   │   ├── PDDocumentDto.java
│   │   │   │   │   ├── PDSectionDto.java
│   │   │   │   │   ├── AISuggestionDto.java
│   │   │   │   │   ├── ResumeDto.java
│   │   │   │   │   └── QualificationMappingDto.java
│   │   │   │   └── exception/
│   │   │   │       ├── GlobalExceptionHandler.java
│   │   │   │       ├── NotFoundException.java
│   │   │   │       ├── ForbiddenException.java
│   │   │   │       └── UnauthorizedException.java
│   │   │   └── resources/
│   │   │       ├── application.yml                 [HOT FILE]
│   │   │       └── db/migration/
│   │   │           ├── V1__init.sql                # empty baseline
│   │   │           ├── V2__create_positions.sql
│   │   │           ├── V3__create_pd_documents.sql
│   │   │           └── V4__create_resumes.sql
│   │   └── test/
│   │       └── java/gov/cms/hiring/
│   │           ├── PositionControllerTest.java
│   │           ├── PDDocumentControllerTest.java
│   │           ├── ResumeControllerTest.java
│   │           ├── AIControllerTest.java
│   │           ├── ValidationTest.java
│   │           ├── ErrorHandlingTest.java
│   │           ├── BedrockServiceTest.java
│   │           ├── ResumeParserServiceTest.java
│   │           └── EmbeddingServiceTest.java
│   ├── build.gradle.kts                            [HOT FILE]
│   ├── settings.gradle.kts
│   ├── gradlew
│   ├── gradlew.bat
│   └── gradle/
│       └── wrapper/
│           ├── gradle-wrapper.jar
│           └── gradle-wrapper.properties
├── frontend/
│   ├── src/
│   │   ├── App.tsx                                 [HOT FILE]
│   │   ├── main.tsx
│   │   ├── types/
│   │   │   └── index.ts                            [HOT FILE]
│   │   ├── pages/
│   │   │   ├── PositionListPage.tsx
│   │   │   ├── PositionNewPage.tsx
│   │   │   ├── PositionDetailPage.tsx
│   │   │   ├── PDEditorPage.tsx
│   │   │   └── ResumeReaderPage.tsx
│   │   ├── components/
│   │   │   ├── Nav.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── SuggestionPill.tsx
│   │   └── api/
│   │       ├── positions.ts
│   │       ├── pdDocuments.ts
│   │       ├── resumes.ts
│   │       └── ai.ts
│   ├── package.json                                [HOT FILE]
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml                              [HOT FILE]
├── uploads/
│   └── resumes/                                    # Local resume file storage
├── scripts/
│   ├── preflight.sh                                # Environment validation script
│   ├── smoke-test.sh                               # API smoke tests
│   └── local-verify.sh                             # Phase 0b local stack checklist
├── plan/
│   ├── plan1.md                                # original brainstorm — not part of implementation
│   ├── manifest.yaml
│   ├── overview.md                                 # This file
│   ├── phase-0.md
│   ├── wave-1.md
│   ├── wave-2.md
│   ├── wave-4.md
│   ├── contracts.md
│   ├── issue-templates.md
│   ├── preflight.sh
│   └── smoke-test.sh
├── .env.example
└── .gitignore
```

## Hot Files

Hot files are files where a single merge conflict or accidental duplicate entry causes the entire application to fail. Every work unit that needs to register a new component in a hot file must **note the change in its result.json** rather than editing the file directly. The orchestrator performs all hot-file edits after each work unit completes.

| Hot File | Why It Is Sensitive |
|---|---|
| `backend/src/main/java/gov/cms/hiring/Application.java` | Spring Boot entry point with `@SpringBootApplication`. A bad component scan or import breaks server startup entirely. Orchestrator owns any changes to this file. |
| `backend/src/main/resources/application.yml` | Central YAML config for datasource, Flyway, AWS region, server port, multipart limits. Bad YAML causes Spring Context to fail to load. Orchestrator merges additions after each work unit. |
| `backend/build.gradle.kts` | Gradle dependency versions and plugin config. Two work units adding conflicting versions causes a build failure. Orchestrator merges `implementation(...)` additions in dependency-order. |
| `frontend/src/App.tsx` | React Router `<Routes>` table. A syntax error here white-screens the entire frontend. Orchestrator adds route elements in dependency order. |
| `frontend/package.json` | npm dependency versions. Conflicting version pins cause `npm install` to fail. Orchestrator merges dependency additions after verifying compatibility. |
| `frontend/src/types/index.ts` | All shared TypeScript interfaces (Position, PDSection, AISuggestion, etc.). If two workers independently define the same type differently, the entire frontend fails to compile. Orchestrator owns all type additions. |
| `docker-compose.yml` | Service orchestration — port mappings, health checks, volume mounts, env var injection. A missing health check or wrong port breaks the entire local stack. Orchestrator owns this file after Phase 0a. |

> **Authentication deferred:** JWT/Spring Security authentication is planned for a future phase not covered by this plan. All endpoints are currently public. See wave-2.md for details.

## Worker Protocol

Workers (subagents assigned a single work unit issue) **must never directly edit hot files**. Instead, after completing all other work for their unit, workers write a `result.json` file to `results/{work_unit_id}.json`. The orchestrator reads each `result.json` after a work unit completes and applies all pending hot-file changes before starting the next work unit.

### result.json Schema

```json
{
  "work_unit_id": "string — e.g. w1-position-tracker-crud",
  "status": "complete | partial | failed",
  "summary": "string — one sentence describing what was done",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": "string | null — Spring @Bean or @Configuration snippet needed in WebConfig.java",
    "app_tsx_route": "string | null — JSX route element(s) to insert into App.tsx <Routes>",
    "nav_item": "string | null — JSX nav item to add to Nav.tsx",
    "gradle_dependency": "string | null — Gradle Kotlin DSL implementation(...) line to add to build.gradle.kts",
    "application_yml_addition": "string | null — YAML block to add to application.yml",
    "env_var_needed": "string | null — env var name and description to add to .env.example",
    "smoke_test_additions": "string | null — test lines to append to smoke-test.sh"
  },
  "notes": "string | null — dependency issues, ambiguities, or follow-up needed"
}
```

All fields in `hot_file_changes` are either a complete, copy-pasteable string or `null`. Workers must use `null` only when a change is genuinely not needed. If a change is required but the worker is uncertain of the exact string, document the uncertainty in `notes` and provide a best attempt rather than leaving it null.

## Orchestrator Merge Sequence

After each work unit completes and its `result.json` is written to `results/{work_unit_id}.json`:

1. Read `result.json` and verify `status == "complete"` and `tests_passing == true`.
2. If `gradle_dependency` is non-null, add the `implementation(...)` line to `backend/build.gradle.kts` inside the `dependencies { }` block. Run `./gradlew dependencies` to verify no conflict.
3. If `application_yml_addition` is non-null, append the YAML block to `backend/src/main/resources/application.yml`. Verify YAML parses correctly.
4. If `router_bean` is non-null, apply the Spring `@Bean` or configuration change to `WebConfig.java` as appropriate.
5. If `app_tsx_route` is non-null, insert the route element inside the `<Routes>` block in `frontend/src/App.tsx`.
6. If `nav_item` is non-null, insert the nav item JSX into `frontend/src/components/Nav.tsx`.
7. If `env_var_needed` is non-null, append the variable and its description to `.env.example`.
8. If `smoke_test_additions` is non-null, append the test lines to `plan/smoke-test.sh` in the appropriate wave section (before the `# <<WAVE1_TESTS_END>>`, `# <<WAVE2_TESTS_END>>`, or `# <<WAVE4_TESTS_END>>` insertion marker).
9. Run `docker compose up -d --build` and verify `curl http://localhost:8080/health` still returns 200.
10. Run the wave's current smoke test subset: `bash plan/smoke-test.sh local wave1`. If it fails, pause and diagnose before proceeding to the next work unit.
11. Commit hot-file changes with message: `chore: merge hot-file changes for {work_unit_id}`.

## AWS Bedrock Notes

- SDK: `software.amazon.awssdk:bedrockruntime:2.x` (Java AWS SDK v2)
- Claude model ID: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Embeddings model ID: `amazon.titan-embed-text-v2:0`
- Auth: Default credential provider chain picks up `~/.aws/credentials` automatically. No explicit key wiring needed in application code.
- Region: configured via `aws.region: ${AWS_REGION:}` in application.yml. Setting `AWS_REGION` activates live Bedrock calls. Without it, `aws.region` resolves to blank, `BedrockServiceImpl` is not registered, and the AI stub returns hardcoded responses.
- The AWS account must have the Claude model enabled in the target region via the Bedrock console before wave-4 work units will function.
- Required IAM permissions: `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream`
- Streaming: Use `InvokeModelWithResponseStreamRequest` for Claude; use `InvokeModelRequest` (non-streaming) for Titan embeddings.

## Wave 3 Skip Note

Wave 3 was reserved for a search/filter enhancement pass (advanced position search, full-text PD search) but was descoped before implementation planning began. Wave numbering is kept for traceability. The manifest.yaml contains a YAML comment documenting the skip. Work unit IDs would have been `w3-*` if implemented.
