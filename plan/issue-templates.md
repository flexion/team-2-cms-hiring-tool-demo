# Issue Templates — All Work Units

Each template is self-contained. A subagent with only the template as context can execute the work unit. All 16 work units are included.

**Java package for all backend code:** `gov.cms.hiring`
**Backend port:** `8080`
**Frontend proxy target:** `http://localhost:8080`

---

### ISSUE: p0a-backend-scaffold

**Title:** `[phase-0a] Spring Boot backend scaffold with health endpoint`

**Context:**
This is the first work unit. Nothing exists yet. You are creating the foundational Spring Boot 3.x application that all subsequent backend work units extend. The goal is a minimal app that compiles, starts, and responds to `GET /health`.

**Acceptance Criteria:**
- [ ] `backend/build.gradle.kts` exists with Java 21, Spring Boot 3.3.x plugin, all required dependencies
- [ ] `backend/settings.gradle.kts` exists with `rootProject.name = "hiring"`
- [ ] Gradle wrapper files exist: `gradlew`, `gradlew.bat`, `gradle/wrapper/`
- [ ] `Application.java` exists at `gov.cms.hiring.Application` with `@SpringBootApplication`
- [ ] `HealthController.java` exists — `GET /health` returns `{"status":"ok","version":"0.1.0"}`
- [ ] `WebConfig.java` exists — CORS configured for `http://localhost:3000`
- [ ] `application.yml` exists with datasource, JPA, and Flyway configuration
- [ ] `./gradlew bootRun` starts without errors (requires PostgreSQL on port 5432)
- [ ] `curl http://localhost:8080/health` returns `{"status":"ok","version":"0.1.0"}`

**Files to Create:**
- `backend/build.gradle.kts` — Gradle Kotlin DSL project with all Wave 0-4 dependencies pre-declared
- `backend/settings.gradle.kts`
- `backend/gradlew`, `backend/gradlew.bat`, `backend/gradle/wrapper/`
- `backend/src/main/java/gov/cms/hiring/Application.java`
- `backend/src/main/java/gov/cms/hiring/controller/HealthController.java`
- `backend/src/main/java/gov/cms/hiring/config/WebConfig.java`
- `backend/src/main/resources/application.yml`
- `backend/src/test/java/gov/cms/hiring/HealthControllerTest.java`

**Required build.gradle.kts dependencies:**
- `implementation("org.springframework.boot:spring-boot-starter-web")`
- `implementation("org.springframework.boot:spring-boot-starter-data-jpa")`
- `implementation("org.springframework.boot:spring-boot-starter-validation")`
- `testImplementation("org.springframework.boot:spring-boot-starter-test")`
- `implementation("org.flywaydb:flyway-core")`, `implementation("org.flywaydb:flyway-database-postgresql")`
- `runtimeOnly("org.postgresql:postgresql")`
- `implementation(platform("software.amazon.awssdk:bom:2.26.12"))`, `implementation("software.amazon.awssdk:bedrockruntime")`
- `implementation("org.apache.pdfbox:pdfbox:3.0.2")`
- `implementation("org.apache.poi:poi-ooxml:5.2.5")`
- `compileOnly("org.projectlombok:lombok")`, `annotationProcessor("org.projectlombok:lombok")`
- `testImplementation("org.testcontainers:postgresql")`, `testImplementation("org.testcontainers:junit-jupiter")`

**Authentication note:** All endpoints are currently public (auth deferred to future phase). No SecurityConfig needed.

**Do NOT Touch (hot files — note changes in result.json instead):**
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`
- `docker-compose.yml`

**Verification Command:**
```bash
cd backend
./gradlew bootRun &
sleep 15
curl -s http://localhost:8080/health
# Expected: {"status":"ok","version":"0.1.0"}
```

**result.json Spec:**
```json
{
  "work_unit_id": "p0a-backend-scaffold",
  "status": "complete",
  "summary": "Created Spring Boot 3.x backend scaffold with health endpoint and CORS config. Gradle Kotlin DSL build.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": "POSTGRES_USER — PostgreSQL username (default: cms)\nPOSTGRES_PASSWORD — PostgreSQL password (default: cms)\nPOSTGRES_DB — PostgreSQL database name (default: cms_hiring)",
    "smoke_test_additions": "GET /health → 200 {\"status\":\"ok\",\"version\":\"0.1.0\"}"
  },
  "notes": null
}
```

---

### ISSUE: p0a-frontend-scaffold

**Title:** `[phase-0a] Vite + React + TypeScript frontend scaffold`

**Context:**
This is the first frontend work unit. Nothing exists yet. You are creating the base React application. Goal: a Vite 5 project that builds cleanly, shows a hello-world page, and proxies `/api` to the Spring Boot backend at `http://localhost:8080` (NOT 8000).

**Acceptance Criteria:**
- [ ] `frontend/` is a valid Vite 5 + React 18 + TypeScript project
- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] `npm run dev` starts a dev server at http://localhost:3000 (configured port, not default 5173)
- [ ] `/api/*` requests proxied to `http://localhost:8080` in `vite.config.ts`
- [ ] Tailwind CSS configured and renders
- [ ] `frontend/src/App.tsx` has `<BrowserRouter>` with `<Routes>` and placeholder route at `/`
- [ ] `frontend/src/types/index.ts` exists with `export {};`
- [ ] Dependencies installed: `react-router-dom`, `axios`, `@tanstack/react-query`, `react-hook-form`, `react-dropzone`

**Files to Create:**
- `frontend/` — Vite scaffold then modify
- `frontend/vite.config.ts` — proxy to :8080, server port 3000
- `frontend/tailwind.config.ts`, `frontend/postcss.config.js`
- `frontend/src/index.css` — Tailwind directives
- `frontend/src/App.tsx` — initial version
- `frontend/src/types/index.ts` — `export {};` placeholder

**Do NOT Touch (hot files — note changes in result.json instead):**
- `backend/src/main/java/gov/cms/hiring/Application.java`
- `backend/src/main/resources/application.yml`
- `backend/build.gradle.kts`
- `docker-compose.yml`

**Verification Command:**
```bash
cd frontend
npm install
npm run build
echo "Build exit code: $?"
```

**result.json Spec:**
```json
{
  "work_unit_id": "p0a-frontend-scaffold",
  "status": "complete",
  "summary": "Created Vite + React + TypeScript frontend scaffold with Tailwind, proxy to :8080, and dev server on :3000.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": null
  },
  "notes": null
}
```

---

### ISSUE: p0a-db-flyway

**Title:** `[phase-0a] Flyway migration config and V1 baseline migration`

**Context:**
Phase 0a backend scaffold is complete. `Application.java` and `application.yml` exist. You are setting up Flyway for Spring Boot with an initial empty baseline migration. No tables yet — Wave 1 adds them. This unit establishes the migration infrastructure.

**Acceptance Criteria:**
- [ ] `spring.flyway.enabled=true` configured in `application.yml`
- [ ] Flyway migration location: `classpath:db/migration`
- [ ] `V1__init.sql` exists in `src/main/resources/db/migration/` (SQL comment only, no DDL)
- [ ] Spring Boot starts cleanly and logs "Successfully applied 1 migration to schema"
- [ ] `baseline-on-migrate: true` set to handle existing databases

**Files to Create:**
- `backend/src/main/resources/db/migration/V1__init.sql` — empty baseline

**Files to Modify (not hot files):**
None — Flyway config goes in application.yml which this unit notes via result.json.

**Do NOT Touch (hot files — note changes in result.json instead):**
- `backend/src/main/resources/application.yml` — note Flyway config block in result.json
- `backend/build.gradle.kts`
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`

**Verification Command:**
```bash
cd backend
./gradlew bootRun 2>&1 | grep -E "Flyway|migration"
# Expected log line: Successfully applied 1 migration to schema "public"
```

**result.json Spec:**
```json
{
  "work_unit_id": "p0a-db-flyway",
  "status": "complete",
  "summary": "Flyway configured with V1 baseline migration. Spring Boot applies it on startup.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": "spring:\n  flyway:\n    enabled: true\n    locations: classpath:db/migration\n    baseline-on-migrate: true\n    baseline-version: 0",
    "env_var_needed": "POSTGRES_USER=cms\nPOSTGRES_PASSWORD=cms\nPOSTGRES_DB=cms_hiring",
    "smoke_test_additions": null
  },
  "notes": null
}
```

---

### ISSUE: p0a-docker-compose

**Title:** `[phase-0a] Docker Compose with db, backend, and frontend services`

**Context:**
Phase 0a backend scaffold, frontend scaffold, and db-flyway are complete. You are writing the Docker Compose configuration for LOCAL DEVELOPMENT ONLY. No nginx, no cloud config. The frontend Dockerfile runs the Vite dev server (not a production build). Backend Dockerfile builds the Spring Boot JAR.

**Acceptance Criteria:**
- [ ] `docker-compose.yml` defines three services: `db` (postgres:16), `backend`, `frontend`
- [ ] `db` service has named volume `pgdata` and `pg_isready` healthcheck
- [ ] `backend` service depends_on db healthy; maps port 8080; mounts `./uploads` and `~/.aws`
- [ ] `frontend` service runs Vite dev server; maps port 3000
- [ ] `backend/Dockerfile` uses `eclipse-temurin:21-jdk-alpine`, builds JAR with `./gradlew bootJar`
- [ ] `frontend/Dockerfile` uses `node:20-alpine`, runs `npm run dev`
- [ ] `.env.example` contains all required and optional env vars with comments
- [ ] `docker compose up -d` starts cleanly
- [ ] `curl http://localhost:8080/health` returns `{"status":"ok"}` after startup

**Files to Create:**
- `docker-compose.yml` — three-service local dev configuration
- `backend/Dockerfile` — eclipse-temurin:21 multi-stage build
- `frontend/Dockerfile` — node:20-alpine Vite dev server
- `.env.example` — all env vars documented

**Do NOT Touch (hot files — note changes in result.json instead):**
- `backend/src/main/resources/application.yml`
- `backend/build.gradle.kts`
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`

**Verification Command:**
```bash
cp .env.example .env
docker compose up -d
sleep 30
curl -s http://localhost:8080/health
docker compose ps
```

**result.json Spec:**
```json
{
  "work_unit_id": "p0a-docker-compose",
  "status": "complete",
  "summary": "Docker Compose, backend/frontend Dockerfiles, and .env.example created for local dev.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": "AWS_REGION — AWS region for Bedrock (optional until Wave 4)\nAWS_PROFILE — AWS credentials profile (optional until Wave 4)",
    "smoke_test_additions": "docker compose ps → all services Up"
  },
  "notes": null
}
```

---

### ISSUE: p0b-local-stack-verify

**Title:** `[phase-0b] Local stack validation — all containers healthy, proxy working`

**Context:**
Phase 0a is complete. Docker Compose works on paper. You are validating the full local stack and writing a verification script. This is NOT a cloud deployment. Fix any startup issues found. Deliverable: a passing `scripts/local-verify.sh` that checks all four conditions.

**Acceptance Criteria:**
- [ ] `docker compose up -d` starts all three services without errors
- [ ] All services pass their health checks (`docker compose ps` shows healthy)
- [ ] `curl http://localhost:8080/health` → `{"status":"ok","version":"0.1.0"}`
- [ ] `curl http://localhost:3000` → HTTP 200 HTML page
- [ ] `curl http://localhost:3000/api/health` → `{"status":"ok","version":"0.1.0"}` (Vite proxy working)
- [ ] `scripts/local-verify.sh` exists, runs, and passes all four checks

**Files to Create:**
- `scripts/local-verify.sh` — automated local stack checklist script
- `scripts/local-stack-verify.md` — documents the validation steps and common fixes

**Do NOT Touch (hot files — note changes in result.json instead):**
- `backend/src/main/java/gov/cms/hiring/Application.java`
- `backend/src/main/resources/application.yml`
- `backend/build.gradle.kts`
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`
- `docker-compose.yml`

**Verification Command:**
```bash
bash scripts/local-verify.sh
# Expected: all four checks PASS
```

**result.json Spec:**
```json
{
  "work_unit_id": "p0b-local-stack-verify",
  "status": "complete",
  "summary": "Local stack validation script created. All four checks pass: db healthy, backend /health, frontend HTML, proxy /api/health.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "docker compose ps → all services healthy"
  },
  "notes": null
}
```

---

### ISSUE: w1-position-tracker-crud

**Title:** `[wave-1] Position JPA entity, Flyway V2 migration, and CRUD controller`

**Context:**
Phase 0 is complete. Database is running, Flyway V1 has applied, app starts. You are creating the first real JPA entity. The `PositionStatus` enum values are: `READY_TO_POST`, `POSTED`, `UNDER_REVIEW`, `CERTIFICATE_ISSUED`, `CLOSED`. No auth or validation in this wave.

**Java Classes to Create:**
- `gov.cms.hiring.model.Position` — JPA entity with UUID id (GenerationType.UUID)
- `gov.cms.hiring.model.PositionStatus` — enum
- `gov.cms.hiring.repository.PositionRepository` — `extends JpaRepository<Position, UUID>`, add `findByStatus()`
- `gov.cms.hiring.dto.PositionDto` — response DTO (never return entity directly)
- `gov.cms.hiring.dto.CreatePositionRequest` — request DTO
- `gov.cms.hiring.dto.UpdatePositionRequest` — all fields nullable
- `gov.cms.hiring.service.PositionService` — business logic, throws `NotFoundException`
- `gov.cms.hiring.controller.PositionController` — `@RequestMapping("/api/positions")`

**Flyway Migration:**
- `V2__create_positions.sql` — CREATE TABLE positions with all columns

**Test Class:**
- `PositionControllerTest.java` — Testcontainers PostgreSQL, MockMvc

**Acceptance Criteria:**
- [ ] `GET /api/positions` returns 200 list
- [ ] `GET /api/positions?status=POSTED` filters by status
- [ ] `GET /api/positions/{unknown-uuid}` returns 404
- [ ] `POST /api/positions` returns 201 with body including `id`
- [ ] `PATCH /api/positions/{id}` returns 200 with updated fields
- [ ] `DELETE /api/positions/{id}` returns 204
- [ ] Flyway V2 migration runs cleanly
- [ ] All Testcontainers tests pass

**Do NOT Touch (hot files — note changes in result.json instead):**
- `backend/src/main/java/gov/cms/hiring/Application.java`
- `backend/src/main/resources/application.yml`
- `backend/build.gradle.kts`
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`
- `docker-compose.yml`

**Verification Command:**
```bash
cd backend && ./gradlew test --tests "gov.cms.hiring.PositionControllerTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-position-tracker-crud",
  "status": "complete",
  "summary": "Position entity, repository, service, controller, and V2 migration created. All Testcontainers tests pass.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POST /api/positions → 201\nGET /api/positions → 200\nGET /api/positions/{id} → 200\nGET /api/positions/{unknown} → 404"
  },
  "notes": null
}
```

---

### ISSUE: w1-pd-document-crud

**Title:** `[wave-1] PDDocument JPA entity with normalized sections and CRUD controller`

**Context:**
Position CRUD is complete. `positions` table exists. You are creating the PD Document entity with a normalized schema. Sections are stored in a separate `pd_sections` table with a foreign key to `pd_documents`. AI suggestions are stored in an `ai_suggestions` table with a foreign key to `pd_sections`. Use JPA relationships (`@OneToMany`, `@ManyToOne`) with proper cascade and fetch strategies.

**Java Classes to Create:**
- `gov.cms.hiring.model.PDDocument` — JPA entity with `@OneToMany` relationship to PDSection
- `gov.cms.hiring.model.PDSection` — JPA entity with `@ManyToOne` to PDDocument, `@OneToMany` to AISuggestion
- `gov.cms.hiring.model.AISuggestion` — JPA entity with `@ManyToOne` to PDSection
- `gov.cms.hiring.model.PDDocumentStatus` — enum (DRAFT, SUBMITTED, APPROVED)
- `gov.cms.hiring.dto.PDSectionDto` — DTO for section with id, heading, body, sortOrder, suggestions, aiReviewed, reviewerApproved
- `gov.cms.hiring.dto.AISuggestionDto` — DTO for suggestion with id, type, originalText, suggestedText, ruleReference, accepted
- `gov.cms.hiring.repository.PDDocumentRepository` — `findByPositionId(UUID positionId)`, use `@EntityGraph` for eager loading sections
- `gov.cms.hiring.repository.PDSectionRepository`
- `gov.cms.hiring.repository.AISuggestionRepository`
- `gov.cms.hiring.service.PDDocumentService`
- `gov.cms.hiring.controller.PDDocumentController` — `@RequestMapping("/api/pd-documents")`

**Flyway Migration:**
- `V3__create_pd_documents.sql` — CREATE TABLE pd_documents, pd_sections, and ai_suggestions with proper foreign keys and indexes

**Test Class:**
- `PDDocumentControllerTest.java` — Testcontainers, test entity relationships, eager loading, and cascade operations

**Acceptance Criteria:**
- [ ] Three tables created: `pd_documents`, `pd_sections`, `ai_suggestions`
- [ ] Foreign key constraints properly set up with ON DELETE CASCADE
- [ ] Indexes created on foreign key columns and sort_order
- [ ] Entity relationships work correctly (create document with sections, sections with suggestions)
- [ ] `position_id` FK references `positions.id` ON DELETE CASCADE
- [ ] `GET /api/pd-documents?positionId={uuid}` filters by position and eagerly loads sections
- [ ] All Testcontainers tests pass
- [ ] Flyway V3 migration runs cleanly after V2

**Do NOT Touch (hot files — note in result.json):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend && ./gradlew test --tests "gov.cms.hiring.PDDocumentControllerTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-pd-document-crud",
  "status": "complete",
  "summary": "PDDocument entity with normalized schema (pd_sections and ai_suggestions tables), V3 migration, and CRUD controller created. Entity relationships and eager loading verified.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POST /api/pd-documents → 201\nGET /api/pd-documents/{id} → 200 with sections array"
  },
  "notes": "Using normalized schema with separate tables for pd_sections and ai_suggestions. No Hypersistence Utils dependency needed since we're not using JSONB."
}
```

---

### ISSUE: w1-resume-upload-storage

**Title:** `[wave-1] Resume multipart upload, local file storage, and stub mappings endpoint`

**Context:**
Position CRUD is complete. You are creating the Resume and QualificationMapping entities, the multipart upload endpoint, and a stub mappings endpoint. Files stored to `${app.upload-dir}/resumes/`. Return 413 if > 10MB, 415 if not PDF or DOCX. GET mappings returns `[]`. Wave 4 replaces the stub.

**Java Classes to Create:**
- `gov.cms.hiring.model.Resume` — JPA entity
- `gov.cms.hiring.model.ResumeStatus` — enum (UPLOADED, PARSED, MAPPED)
- `gov.cms.hiring.model.QualificationMapping` — JPA entity
- `gov.cms.hiring.repository.ResumeRepository`
- `gov.cms.hiring.repository.QualificationMappingRepository`
- `gov.cms.hiring.dto.ResumeDto`
- `gov.cms.hiring.dto.QualificationMappingDto`
- `gov.cms.hiring.service.ResumeService` — handles upload, size/MIME validation, file storage
- `gov.cms.hiring.controller.ResumeController` — `@RequestMapping("/api/resumes")`

**Flyway Migration:**
- `V4__create_resumes.sql` — CREATE TABLE resumes and qualification_mappings

**Test Class:**
- `ResumeControllerTest.java` — upload a small PDF byte array, get by id, mappings returns `[]`

**Acceptance Criteria:**
- [ ] `POST /api/resumes/upload` with valid PDF → 201 with resume `id`
- [ ] File saved to `./uploads/resumes/{uuid}_{originalFilename}`
- [ ] `POST /api/resumes/upload` with > 10MB file → 413
- [ ] `POST /api/resumes/upload` with `.txt` MIME type → 415
- [ ] `GET /api/resumes/{id}/mappings` → 200 `[]`
- [ ] All Testcontainers tests pass

**Do NOT Touch (hot files — note in result.json):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend && ./gradlew test --tests "gov.cms.hiring.ResumeControllerTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-resume-upload-storage",
  "status": "complete",
  "summary": "Resume and QualificationMapping entities, upload endpoint, file storage, and stub mappings created.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": "app.upload-dir: ${UPLOAD_DIR:./uploads}\nspring.servlet.multipart.max-file-size: 10MB\nspring.servlet.multipart.max-request-size: 10MB",
    "env_var_needed": "UPLOAD_DIR — local path for resume storage (default: ./uploads)",
    "smoke_test_additions": "POST /api/resumes/upload → 201\nGET /api/resumes/{id}/mappings → 200 []"
  },
  "notes": null
}
```

---

### ISSUE: w1-ai-stub

**Title:** `[wave-1] AI stub — BedrockService interface and hardcoded stub implementation`

**Context:**
Backend scaffold is complete. You are defining the `BedrockService` Java interface that Wave 4 will implement with real Bedrock calls, and writing `BedrockServiceStub` implementing it with hardcoded responses. The stub uses `@ConditionalOnMissingBean(BedrockServiceImpl.class)` so it is skipped once Wave 4 registers `BedrockServiceImpl`. Create `AIController` at `/api/ai`.

**Java Classes to Create:**
- `gov.cms.hiring.service.BedrockService` — interface with `suggestSection()` and `mapResumeToRequirements()`
- `gov.cms.hiring.service.BedrockServiceStub` — `@Service @ConditionalOnMissingBean(BedrockServiceImpl.class)` (no `@Primary`), returns 2 hardcoded `AISuggestionDto` objects
- `gov.cms.hiring.controller.AIController` — `POST /api/ai/suggest-section`

**Test Class:**
- `AIControllerTest.java` — MockMvc, stub returns 200 with array of 2 items, each has type/original/suggested/ruleReference

**Acceptance Criteria:**
- [ ] `BedrockService` interface exists with correct method signatures
- [ ] `BedrockServiceStub` uses `@ConditionalOnMissingBean(BedrockServiceImpl.class)` (not `@Primary`) — avoids dual-`@Primary` conflict when `BedrockServiceImpl` is also registered
- [ ] `BedrockServiceStub` returns exactly 2 `AISuggestionDto` objects: one `compliance`, one `specificity`
- [ ] Stub objects have non-empty `original`, `suggested`, `ruleReference` fields
- [ ] `POST /api/ai/suggest-section` → 200 with array length >= 1
- [ ] No external API calls made
- [ ] All MockMvc tests pass

**Do NOT Touch (hot files — note in result.json):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend && ./gradlew test --tests "gov.cms.hiring.AIControllerTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-ai-stub",
  "status": "complete",
  "summary": "BedrockService interface, BedrockServiceStub with hardcoded responses, and AIController created.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POST /api/ai/suggest-section → 200 with array >= 1 item"
  },
  "notes": null
}
```

---

### ISSUE: w1-position-tracker-ui

**Title:** `[wave-1] Position Tracker UI — list, create, and detail pages`

**Context:**
Position CRUD backend is complete and registered at `/api/positions`. Frontend scaffold is complete. You are creating the three-page Position Tracker. Backend uses camelCase field names (`postingDate`, `closeDate`, `createdAt`). Status enum values are uppercase: `READY_TO_POST`, `POSTED`, `UNDER_REVIEW`, `CERTIFICATE_ISSUED`, `CLOSED`.

**Files to Create:**
- `frontend/src/api/positions.ts` — axios functions
- `frontend/src/components/StatusBadge.tsx` — colored badge per status
- `frontend/src/components/Nav.tsx` — sidebar nav
- `frontend/src/pages/PositionListPage.tsx`
- `frontend/src/pages/PositionNewPage.tsx`
- `frontend/src/pages/PositionDetailPage.tsx`

**Do NOT Touch (hot files — note in result.json):**
- `frontend/src/App.tsx` — note route additions
- `frontend/package.json` — note any new deps
- `frontend/src/types/index.ts` — note type additions
- `backend/build.gradle.kts`, `application.yml`, `Application.java`, `docker-compose.yml`

**Verification Command:**
```bash
cd frontend && npm run build 2>&1 | grep -c "error TS" | xargs -I{} test {} -eq 0
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-position-tracker-ui",
  "status": "complete",
  "summary": "Position Tracker list, create, and detail pages created with Nav and StatusBadge components.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": "<Route path='/positions' element={<PositionListPage />} />\n<Route path='/positions/new' element={<PositionNewPage />} />\n<Route path='/positions/:id' element={<PositionDetailPage />} />",
    "nav_item": "<NavItem href='/positions' label='Positions' />",
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": null
  },
  "notes": "Types to add to index.ts: PositionStatus (uppercase enum), Position interface with camelCase fields. Imports to add to App.tsx: PositionListPage, PositionNewPage, PositionDetailPage."
}
```

---

### ISSUE: w1-pd-editor-ui

**Title:** `[wave-1] PD Editor UI — section editor with AI suggestion pills`

**Context:**
PD Document backend and AI stub are complete. Position Tracker UI is complete. You are building the Working Copy Editor. Types `PDSection` and `AISuggestion` must come from `frontend/src/types/index.ts` — note additions in result.json for orchestrator to merge. Field names are camelCase: `aiReviewed`, `reviewerApproved`, `ruleReference`.

**Files to Create:**
- `frontend/src/api/pdDocuments.ts`
- `frontend/src/api/ai.ts`
- `frontend/src/components/SuggestionPill.tsx`
- `frontend/src/pages/PDEditorPage.tsx`

**Do NOT Touch (hot files — note in result.json):**
- `frontend/src/App.tsx`, `frontend/package.json`, `frontend/src/types/index.ts`
- All backend hot files

**Verification Command:**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-pd-editor-ui",
  "status": "complete",
  "summary": "PD Editor page with section editor, AI suggestion pills, and auto-save created.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": "<Route path='/positions/:id/pd/:pdId' element={<PDEditorPage />} />",
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": null
  },
  "notes": "Types to add to index.ts: AISuggestionType, AISuggestion, PDSection, PDDocumentContent, PDDocumentStatus, PDDocument. Import to add to App.tsx: PDEditorPage."
}
```

---

### ISSUE: w1-resume-reader-ui

**Title:** `[wave-1] Resume Reader UI — upload dropzone and stub mapping view`

**Context:**
Resume upload backend is complete. Position Tracker UI is complete. Build the full mapping UI now (confidence badges, confirm/reject toggles) so Wave 4 only needs backend changes. Field names: `positionId`, `uploadDate`, `parsedText`, `resumeId`, `requirementText`, `matchedText`, `confirmedByReviewer`.

**Files to Create:**
- `frontend/src/api/resumes.ts`
- `frontend/src/pages/ResumeReaderPage.tsx`

**Do NOT Touch (hot files — note in result.json):**
- Same hot files as w1-pd-editor-ui

**Verification Command:**
```bash
cd frontend && npm run build 2>&1 | tail -5
```

**result.json Spec:**
```json
{
  "work_unit_id": "w1-resume-reader-ui",
  "status": "complete",
  "summary": "Resume Reader upload dropzone and stub mapping view created. Full mapping UI built for Wave 4.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": "<Route path='/positions/:id/resumes' element={<ResumeReaderPage />} />",
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POST /api/resumes/upload (small PDF) → 201\nGET /api/resumes/{id}/mappings → 200"
  },
  "notes": "Types to add to index.ts: ResumeStatus, Resume, QualificationMapping. Import to add to App.tsx: ResumeReaderPage."
}
```

---

### ISSUE: w2-input-validation

**Title:** `[wave-2] Jakarta Bean Validation constraints on all request DTOs`

**Context:**
All Wave 1 work units are complete. You are adding validation annotations to existing request DTOs. Controllers already declare `@Valid` on `@RequestBody`. Just add annotations to DTO fields and write tests. All Wave 1 tests must still pass. Cross-field date validator: `closeDate >= postingDate`; `closeDate == postingDate` is valid.

**Files to Modify (not hot files):**
- `gov.cms.hiring.dto.CreatePositionRequest` — add `@NotBlank`, `@Size`, `@Pattern` annotations
- `gov.cms.hiring.dto.PDDocumentContentDto` — add `@Size(min=1)` to sections
- `gov.cms.hiring.dto.PDSectionDto` — add `@Size(max=10000)` to body
- `gov.cms.hiring.service.ResumeService` — add size and MIME type validation in `uploadResume()`

**Files to Create:**
- `gov.cms.hiring.validation.CloseDateAfterPostingDate` — custom constraint annotation
- `gov.cms.hiring.validation.CloseDateValidator` — constraint validator implementation
- `backend/src/test/java/gov/cms/hiring/ValidationTest.java`

**Do NOT Touch (hot files):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend
./gradlew test --tests "gov.cms.hiring.ValidationTest"
./gradlew test  # verify no Wave 1 regressions
```

**result.json Spec:**
```json
{
  "work_unit_id": "w2-input-validation",
  "status": "complete",
  "summary": "Jakarta Bean Validation added to all request DTOs. Cross-field date validator added. All validation tests pass. No Wave 1 regressions.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POST /api/positions {title:'IT'} → 422\nPOST /api/positions {series:'22XX'} → 422\nPOST /api/resumes/upload (large) → 413"
  },
  "notes": null
}
```

---

### ISSUE: w2-error-handling

**Title:** `[wave-2] Global @ControllerAdvice with standard JSON error envelope`

**Context:**
Wave 1 is complete. You are adding a `@RestControllerAdvice` that catches validation errors, ResponseStatusException, MaxUploadSizeExceededException, custom exceptions, and unhandled exceptions. Every non-2xx response must have `{"error": {"code": "...", "message": "...", "details": [...]}}`. Internal errors must NOT leak stack traces.

**Java Classes to Create:**
- `gov.cms.hiring.exception.NotFoundException` — `extends RuntimeException`
- `gov.cms.hiring.exception.ForbiddenException` — `extends RuntimeException`
- `gov.cms.hiring.exception.UnauthorizedException` — `extends RuntimeException`
- `gov.cms.hiring.exception.GlobalExceptionHandler` — `@RestControllerAdvice`

**Files to Modify (not hot files):**
- All service classes — replace `ResponseStatusException(NOT_FOUND)` with `NotFoundException`

**Files to Create:**
- `backend/src/test/java/gov/cms/hiring/ErrorHandlingTest.java`

**Do NOT Touch (hot files):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend
./gradlew test --tests "gov.cms.hiring.ErrorHandlingTest"
./gradlew test  # no regressions
```

**result.json Spec:**
```json
{
  "work_unit_id": "w2-error-handling",
  "status": "complete",
  "summary": "GlobalExceptionHandler with standard error envelope created. Custom exceptions added. All error paths tested.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "error response has error.code field present"
  },
  "notes": "Multipart config was already applied by w1-resume-upload-storage — no application.yml change needed here."
}
```

---

### ISSUE: w4-pd-editor-bedrock

**Title:** `[wave-4] Replace AI stub with live AWS Bedrock Claude for PD suggestions`

**Context:**
Wave 2 complete. The AI stub at `/api/ai/suggest-section` returns hardcoded responses. You are creating `BedrockServiceImpl` using `software.amazon.awssdk:bedrockruntime`. Model: `anthropic.claude-3-5-sonnet-20241022-v2:0`. Uses `InvokeModelWithResponseStreamRequest`. AWS credentials come from default provider chain (`~/.aws/credentials`). On any error, return empty list — never 500. `@ConditionalOnProperty(name = "aws.region", matchIfMissing = false)` ensures stub stays active if AWS_REGION not set. `application.yml` sets `aws.region: ${AWS_REGION:}` (blank default) so the condition is NOT satisfied when AWS_REGION is unset — only a non-blank value activates `BedrockServiceImpl`.

**Java Classes to Create:**
- `gov.cms.hiring.service.BedrockServiceImpl` — `@Service @ConditionalOnProperty(name = "aws.region", matchIfMissing = false)` (no `@Primary` — when this bean registers it is the only `BedrockService` impl; stub is suppressed by `@ConditionalOnMissingBean`)
  - Required private helper: `extractTextFromStreamedResponse(String rawResponse)` — parses NDJSON-like Bedrock streaming output, collecting text from `content_block_delta` / `text_delta` events line by line. Called by `parseClaudeResponse(String rawResponse)` with the raw StringBuilder result, NOT a pre-parsed `JsonNode`.
- `backend/src/test/java/gov/cms/hiring/BedrockServiceTest.java`

**Required IAM permissions:** `bedrock:InvokeModel`, `bedrock:InvokeModelWithResponseStream`

**Acceptance Criteria:**
- [ ] `BedrockServiceImpl` is annotated with `@ConditionalOnProperty(name = "aws.region", matchIfMissing = false)`
- [ ] `BedrockRuntimeAsyncClient` and `modelId` are injected via constructor (NOT `@PostConstruct`) — `final` fields must be assigned in constructors to compile
- [ ] `mapResumeToRequirements()` is an intentional no-op stub returning `List.of()` — actual resume mapping is done by `EmbeddingService` called directly from `ResumeService`
- [ ] Uses `BedrockRuntimeAsyncClient` with 30-second timeout via `CompletableFuture.get(30, SECONDS)`
- [ ] `parseClaudeResponse(String rawResponse)` calls `extractTextFromStreamedResponse(rawResponse)` (passing the raw string, not a `JsonNode`)
- [ ] `extractTextFromStreamedResponse(String rawResponse)` iterates lines, parses each as JSON, collects `delta.text` from `content_block_delta` events; malformed lines are silently skipped
- [ ] System prompt includes OHC-PD-001 through OHC-PD-005 rules
- [ ] On TimeoutException or any SDK exception → returns empty list (never propagates)
- [ ] On JSON parse error → returns empty list
- [ ] Mockito tests for all error paths pass without AWS credentials
- [ ] Live integration test (annotated `@EnabledIfEnvironmentVariable(named = "AWS_REGION", matches = ".+")`) passes when AWS is configured

**Do NOT Touch (hot files):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend && ./gradlew test --tests "gov.cms.hiring.BedrockServiceTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w4-pd-editor-bedrock",
  "status": "complete",
  "summary": "BedrockServiceImpl with Bedrock streaming API, OHC system prompt, and error fallback created. Mockito tests pass.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": "implementation(\"software.amazon.awssdk:bedrockruntime\")",
    "application_yml_addition": "aws.region: ${AWS_REGION:}",
    "env_var_needed": "AWS_REGION — AWS region for Bedrock (no default; if unset, AI stub is used)\nAWS_PROFILE — AWS credentials profile (default: default)",
    "smoke_test_additions": "POST /api/ai/suggest-section with 'Responsible for...' → type=compliance suggestion\nTwo different inputs return different suggestions"
  },
  "notes": "Requires AWS account with Claude model enabled in Bedrock console. Model ID: anthropic.claude-3-5-sonnet-20241022-v2:0"
}
```

---

### ISSUE: w4-resume-embedding-bedrock

**Title:** `[wave-4] Live resume parsing and qualification mapping with Bedrock Titan embeddings`

**Context:**
Wave 4 PD editor Bedrock integration is complete. Resume upload stores files to disk. `GET /api/resumes/{id}/mappings` returns `[]`. You are replacing the stub with: parse PDF/DOCX → embed with Titan Embeddings V2 (`amazon.titan-embed-text-v2:0`) → cosine similarity → persist mappings above 0.65 threshold. Create `PATCH /api/qualification-mappings/{id}/confirm` for reviewer decisions.

**Java Classes to Create:**
- `gov.cms.hiring.service.ResumeParserService` — PDFBox + POI text extraction
- `gov.cms.hiring.service.EmbeddingService` — Titan embeddings + cosine similarity (plain Java math)
- `gov.cms.hiring.controller.QualificationMappingController` — `PATCH /{id}/confirm`
- `gov.cms.hiring.dto.ConfirmMappingRequest` — `@NotNull Boolean confirmed`
- `backend/src/test/java/gov/cms/hiring/ResumeParserServiceTest.java`
- `backend/src/test/java/gov/cms/hiring/EmbeddingServiceTest.java`

**Files to Modify (not hot files):**
- `gov.cms.hiring.service.ResumeService.getResumeMappings()` — replace stub with real implementation
- `gov.cms.hiring.repository.QualificationMappingRepository` — add `findByResumeId()`

**Confidence threshold:** 0.65 (inclusive — exactly 0.65 is included; 0.6499 is excluded)

**Acceptance Criteria:**
- [ ] `ResumeParserService` parses PDF (PDFBox 3.x) and DOCX (POI 5.x)
- [ ] `EmbeddingService` uses constructor injection for `BedrockRuntimeClient` (NOT `@PostConstruct`) — `final` fields must be assigned in constructors to compile
- [ ] `EmbeddingService.cosineSimilarity()` returns 1.0 for identical vectors, 0.0 for orthogonal
- [ ] `mapRequirementsToResume` only returns mappings with confidence >= 0.65
- [ ] `GET /api/resumes/{id}/mappings` triggers parsing + mapping on first call, returns stored on subsequent calls
- [ ] `Resume.status` transitions: UPLOADED → PARSED → MAPPED
- [ ] `PATCH /api/qualification-mappings/{id}/confirm` endpoint is public (auth deferred to future phase), updates `confirmedByReviewer`
- [ ] All Mockito and unit tests pass without AWS credentials
- [ ] Live tests guarded by `@EnabledIfEnvironmentVariable(named = "AWS_REGION", matches = ".+")`

**Do NOT Touch (hot files):**
- Same hot files as w1-position-tracker-crud

**Verification Command:**
```bash
cd backend
./gradlew test --tests "gov.cms.hiring.ResumeParserServiceTest,gov.cms.hiring.EmbeddingServiceTest"
```

**result.json Spec:**
```json
{
  "work_unit_id": "w4-resume-embedding-bedrock",
  "status": "complete",
  "summary": "ResumeParserService (PDFBox+POI), EmbeddingService (Titan V2 + cosine similarity), confirm endpoint created. Unit and Mockito tests pass.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": "implementation(\"org.apache.pdfbox:pdfbox:3.0.2\")\nimplementation(\"org.apache.poi:poi-ooxml:5.2.5\")",
    "application_yml_addition": null,
    "env_var_needed": "AWS_REGION (already set for w4-pd-editor-bedrock)",
    "smoke_test_additions": "GET /api/resumes/{id}/mappings → 200\nPATCH /api/qualification-mappings/{id}/confirm → 200"
  },
  "notes": "Titan Embeddings V2 model ID: amazon.titan-embed-text-v2:0. Uses synchronous BedrockRuntimeClient (not async) for embeddings."
}
```
