# CMS Hiring Process Optimization POC — Design Document

**Document Version:** 1.0  
**Date:** 2026-05-28  
**Status:** Draft  
**Scope:** Local Development POC Only

---

## Executive Summary

This document describes the design of a unified, LLM-enhanced position management workspace for CMS OIT BOG staff. The application replaces personal Excel trackers, informal CMS Chat workarounds, and disconnected document repositories with a shared, structured, AI-augmented tool that addresses visibility, drafting quality, and review efficiency gaps identified in May 2026 discovery research.

**Key Design Principles:**
- **Local-first:** Docker Compose only, no cloud deployment infrastructure
- **Wave-based delivery:** Incremental builds from skeleton → CRUD → validation → AI integration
- **Hot file protection:** Orchestrated merge process prevents concurrent edit conflicts
- **Graceful AI degradation:** Stub implementations enable frontend development without AWS credentials
- **Contract-first APIs:** Canonical JSON fixtures ensure frontend/backend alignment

---

## 1. Problem Statement

### 1.1 Current State Pain Points

CMS OIT BOG staff managing federal job postings face three critical gaps:

1. **Visibility Gap:** Personal Excel trackers create information silos; no shared view of position pipeline status
2. **Quality Gap:** PD documents drafted without real-time compliance feedback often require multiple OHC revision cycles
3. **Efficiency Gap:** Manual resume-to-requirements matching is time-consuming and error-prone

### 1.2 User Needs

- **Shared position pipeline visibility** across the team with filterable status tracking
- **Real-time PD compliance suggestions** using OHC writing rules (OHC-PD-001 through OHC-PD-005)
- **Automated resume qualification mapping** via semantic similarity to accelerate candidate review

---

## 2. Solution Architecture

### 2.1 System Overview

**Architecture Pattern:** Three-tier web application with AI enhancement layer

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Vite dev server, React 18, TypeScript, Tailwind)     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/JSON (axios + react-query)
                     ▼
┌─────────────────────────────────────────────────────────┐
│              Spring Boot Backend                         │
│  (Java 21, Spring Web, Spring Data JPA, Flyway)        │
├─────────────────────────────────────────────────────────┤
│  AI Enhancement Layer                                    │
│  ├─ BedrockService (Claude 3.5 Sonnet)                 │
│  ├─ EmbeddingService (Titan Embeddings V2)             │
│  └─ Graceful degradation to stubs when AWS_REGION unset│
└────────────────────┬────────────────────────────────────┘
                     │ JDBC
                     ▼
┌─────────────────────────────────────────────────────────┐
│              PostgreSQL 16 Database                      │
│  (JSONB for PD document content, vector-free mapping)   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Core Features

**Position Tracker**
- CRUD operations for position records
- Status-based filtering (READY_TO_POST, POSTED, UNDER_REVIEW, CERTIFICATE_ISSUED, CLOSED)
- Color-coded status badges for quick pipeline visibility

**PD Editor (Working Copy Editor)**
- Section-by-section editing with JSONB storage
- "Get AI Suggestions" button per section → Claude analyzes against OHC rules
- Suggestion pills (compliance, clarity, specificity) → click to accept
- Reviewer approval workflow (aiReviewed flag + reviewerApproved checkbox)

**Resume Reader**
- Drag-and-drop upload (PDF/DOCX, max 10MB)
- Automatic text extraction (PDFBox for PDF, Apache POI for DOCX)
- Semantic matching via Titan embeddings + cosine similarity (threshold: 0.65)
- Side-by-side qualification mapping view with confidence scores
- Reviewer confirmation toggles for each mapping

### 2.3 Technology Stack

| Layer               | Technology                                   |
|---------------------|----------------------------------------------|
| Frontend Framework  | React 18 + TypeScript + Vite 5              |
| Frontend Styling    | Tailwind CSS                                 |
| Frontend Data       | @tanstack/react-query + axios                |
| Frontend Routing    | react-router-dom v6                          |
| Backend Framework   | Java 21 + Spring Boot 3.x                    |
| Backend ORM         | Spring Data JPA (Hibernate 6.x)             |
| Migrations          | Flyway                                       |
| Database            | PostgreSQL 16                                |
| LLM                 | AWS Bedrock Claude 3.5 Sonnet v2            |
| Embeddings          | AWS Bedrock Titan Embeddings V2             |
| JSONB Mapping       | Hypersistence Utils (hibernate-63)          |
| PDF Parsing         | Apache PDFBox 3.x                            |
| DOCX Parsing        | Apache POI (poi-ooxml 5.x)                  |
| Containerization    | Docker + docker compose (local dev only)    |
| Build               | Gradle (Kotlin DSL)                          |
| Testing             | JUnit 5 + Mockito + Testcontainers          |

---

## 3. Data Model

### 3.1 Entity Relationship Diagram

```
positions (1) ──┬──< (N) pd_documents
                │
                └──< (N) resumes
                           │
                           └──< (N) qualification_mappings
```

### 3.2 Core Entities

**Position**
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    series VARCHAR(10),
    grade VARCHAR(10),
    status VARCHAR(30) DEFAULT 'READY_TO_POST',
    posting_date DATE,
    close_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**PDDocument**
```sql
CREATE TABLE pd_documents (
    id UUID PRIMARY KEY,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    content JSONB NOT NULL,  -- PDDocumentContent type
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(20) DEFAULT 'DRAFT',
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**PDDocumentContent (JSONB structure)**
```typescript
{
  sections: [
    {
      id: "client-generated-uuid",
      heading: "Introduction",
      body: "Position description text...",
      suggestions: [
        {
          type: "compliance" | "clarity" | "specificity",
          original: "original phrase",
          suggested: "improved phrase",
          ruleReference: "OHC-PD-001"
        }
      ],
      aiReviewed: false,
      reviewerApproved: false
    }
  ]
}
```

**Resume**
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY,
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    upload_date TIMESTAMP,
    parsed_text TEXT,
    status VARCHAR(20) DEFAULT 'UPLOADED'
);
```

**QualificationMapping**
```sql
CREATE TABLE qualification_mappings (
    id UUID PRIMARY KEY,
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    matched_text TEXT,
    confidence DOUBLE PRECISION,
    confirmed_by_reviewer BOOLEAN DEFAULT FALSE
);
```

### 3.3 Design Decisions

**Q: Why JSONB for PD content instead of a sections table?**
- **A:** Section structure is highly variable and edited as a unit. JSONB avoids ORM N+1 queries, simplifies section ordering, and enables atomic updates of the entire document. AI suggestions are transient (not historical audit items), so they live in-document rather than in a suggestions table.

**Q: Why no vector extension (pgvector) for embeddings?**
- **A:** This is a local POC with <100 expected positions/resumes. Cosine similarity in-memory is sufficient. pgvector would add deployment complexity (extension installation, index tuning) with no performance benefit at this scale.

**Q: Why separate Resume and QualificationMapping tables instead of JSONB mappings?**
- **A:** Mappings require individual PATCH operations for reviewer confirmation. Storing them as rows enables simple `UPDATE qualification_mappings SET confirmed_by_reviewer = true WHERE id = ?` without full document deserialization/reserialize cycles.

---

## 4. AI Integration Strategy

### 4.1 PD Suggestion Generation (Claude 3.5 Sonnet)

**Endpoint:** `POST /api/ai/suggest-section`

**Request:**
```json
{
  "sectionHeading": "Specialized Experience",
  "sectionBody": "Responsible for managing the cloud infrastructure.",
  "positionTitle": "IT Specialist (Cloud Engineer)"
}
```

**Claude System Prompt (excerpt):**
```
You are an expert federal position description reviewer trained on CMS OHC writing standards.
Analyze the provided section against these rules:
- OHC-PD-001: Avoid "responsible for" — use active verbs
- OHC-PD-004: Eliminate weak verbs like "may assist"
- OHC-PD-005: Technical requirements must be specific and assessable

Return up to 3 suggestions as JSON array.
```

**Response:**
```json
[
  {
    "type": "compliance",
    "original": "Responsible for managing the cloud infrastructure.",
    "suggested": "Manages cloud infrastructure, ensuring availability, security, and performance.",
    "ruleReference": "OHC-PD-001"
  }
]
```

**Error Handling:**
- Timeout (>30s): Return empty array, log exception
- SDK error (credentials, throttling): Return empty array, log exception
- Parse error (malformed JSON): Return empty array, log exception
- Frontend behavior: Empty array → "No suggestions available at this time"

### 4.2 Resume Qualification Mapping (Titan Embeddings V2)

**Flow:**
1. Resume upload → text extraction (PDFBox/POI)
2. Split resume into paragraphs (max 512 tokens per chunk)
3. Extract PD requirements from active PDDocument for position
4. Generate embeddings: `POST` to Bedrock with `{"inputText": "..."}` → `{"embedding": [...]}`
5. Compute cosine similarity between each requirement embedding and all resume chunk embeddings
6. Keep mappings where similarity ≥ 0.65
7. Store as QualificationMapping records with confidence score

**Cosine Similarity (Java implementation):**
```java
public double cosineSimilarity(List<Double> vecA, List<Double> vecB) {
    double dotProduct = 0.0;
    double normA = 0.0;
    double normB = 0.0;
    for (int i = 0; i < vecA.size(); i++) {
        dotProduct += vecA.get(i) * vecB.get(i);
        normA += Math.pow(vecA.get(i), 2);
        normB += Math.pow(vecB.get(i), 2);
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

**Confidence Threshold Rationale:**
- 0.65 chosen empirically as balance between precision (avoiding false positives) and recall (not missing valid matches)
- Reviewer confirmation workflow allows staff to reject false positives and surface missed mappings

### 4.3 Graceful Degradation Strategy

**Problem:** Frontend developers and CI environments may not have AWS Bedrock credentials.

**Solution:** Conditional bean registration based on `AWS_REGION` environment variable.

```java
@Service
@ConditionalOnProperty(name = "aws.region")
public class BedrockServiceImpl implements BedrockService { ... }

@Service
@ConditionalOnMissingBean(BedrockServiceImpl.class)
public class BedrockServiceStub implements BedrockService {
    @Override
    public List<AISuggestionDto> suggestSection(...) {
        return List.of(/* hardcoded stub suggestions */);
    }
}
```

**Behavior:**
- `AWS_REGION` set → `BedrockServiceImpl` registers, real API calls
- `AWS_REGION` unset → `BedrockServiceStub` registers, hardcoded responses
- Frontend sees identical JSON shape in both cases

---

## 5. Implementation Approach

### 5.1 Wave-Based Delivery

| Phase | Goal | Exit Criteria |
|-------|------|---------------|
| **Phase 0a** | Bootable skeleton | `./gradlew bootRun` starts; `/health` returns 200 |
| **Phase 0b** | Local stack validation | `docker compose up` healthy; proxy verified |
| **Wave 1** | CRUD end-to-end | All 3 features working with stub AI |
| **Wave 2** | Validation + errors | Jakarta Bean Validation + global exception handler |
| **Wave 3** | (Skipped) | Reserved for search/filter enhancements |
| **Wave 4** | Live AI integration | Real Bedrock calls replacing stubs |

### 5.2 Hot File Protection Protocol

**Problem:** Concurrent edits to central files (`Application.java`, `App.tsx`, `build.gradle.kts`) cause merge conflicts that break the build.

**Solution:** Workers (subagents assigned to work units) NEVER directly edit hot files. Instead, they write `result.json` with pending changes, and the orchestrator applies them sequentially.

**Hot Files:**
- `backend/src/main/java/gov/cms/hiring/Application.java`
- `backend/src/main/resources/application.yml`
- `backend/build.gradle.kts`
- `frontend/src/App.tsx`
- `frontend/package.json`
- `frontend/src/types/index.ts`
- `docker-compose.yml`

**result.json Schema:**
```json
{
  "work_unit_id": "w1-position-tracker-crud",
  "status": "complete",
  "summary": "Created Position JPA entity, CRUD controller, and Testcontainers tests",
  "tests_passing": true,
  "hot_file_changes": {
    "gradle_dependency": "implementation(\"io.hypersistence:hypersistence-utils-hibernate-63:3.7.3\")",
    "application_yml_addition": "app.upload-dir: ${UPLOAD_DIR:./uploads}",
    "app_tsx_route": "<Route path='/positions' element={<PositionListPage />} />",
    "nav_item": "<NavItem href='/positions' label='Positions' />",
    "smoke_test_additions": "POST /api/positions → 201"
  },
  "notes": null
}
```

**Orchestrator Merge Sequence:**
1. Read `result.json` and verify `status == "complete"` and `tests_passing == true`
2. Apply Gradle dependency additions → run `./gradlew dependencies` to verify
3. Append YAML blocks to `application.yml` → verify YAML parses
4. Insert routes into `App.tsx` → verify TypeScript compiles
5. Run `docker compose up -d --build` and verify `/health` still returns 200
6. Run wave-specific smoke tests: `bash plan/smoke-test.sh local wave1`
7. Commit hot-file changes: `chore: merge hot-file changes for {work_unit_id}`

### 5.3 Contract-First API Design

**Approach:** Define canonical JSON fixtures in `contracts.md` before writing code.

**Benefits:**
- Frontend and backend teams develop independently against agreed-upon contracts
- Test fixtures double as API documentation
- Type mismatches (camelCase vs snake_case) caught early

**Example — Position contract:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "IT Specialist (Full Stack Engineer)",
  "series": "2210",
  "grade": "GS-13",
  "status": "POSTED",
  "postingDate": "2026-06-01",
  "closeDate": "2026-06-15",
  "createdAt": "2026-05-28T10:00:00",
  "updatedAt": "2026-05-28T10:00:00"
}
```

**Naming Convention:** All JSON fields use **camelCase** (matching Java DTOs and TypeScript interfaces). Database columns use **snake_case**. Hibernate handles mapping automatically.

---

## 6. Validation and Error Handling

### 6.1 Input Validation (Wave 2)

**Strategy:** Jakarta Bean Validation annotations on request DTOs.

**Example — Position validation:**
```java
public record CreatePositionRequest(
    @NotBlank @Size(min = 3, max = 200) String title,
    @Pattern(regexp = "^\\d{4}$", message = "Series must be 4 digits") String series,
    @Pattern(regexp = "^GS-\\d{1,2}$") String grade,
    PositionStatus status,
    @FutureOrPresent LocalDate postingDate,
    @FutureOrPresent LocalDate closeDate
) {
    @AssertTrue(message = "closeDate must be >= postingDate")
    public boolean isCloseDateValid() {
        return closeDate == null || postingDate == null || !closeDate.isBefore(postingDate);
    }
}
```

### 6.2 Global Exception Handler

**Consistent Error Envelope:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {"field": "title", "message": "size must be between 3 and 200", "rejectedValue": "IT"}
    ]
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (422) — Bean validation failure
- `NOT_FOUND` (404) — Entity not found
- `UNAUTHORIZED` (401) — (Future auth phase)
- `FORBIDDEN` (403) — (Future auth phase)
- `PAYLOAD_TOO_LARGE` (413) — File upload >10MB
- `UNSUPPORTED_MEDIA_TYPE` (415) — Non-PDF/DOCX upload
- `INTERNAL_ERROR` (500) — Unhandled exception

**Security Note:** 500 responses MUST NOT include stack traces, exception class names, or internal file paths. Full exception logged server-side only.

---

## 7. Testing Strategy

### 7.1 Backend Testing

**Unit Tests (Mockito):**
- Service layer with mocked repositories
- BedrockService with mocked AWS SDK clients
- Validation logic (closeDate >= postingDate)

**Integration Tests (Testcontainers):**
- Full Spring Boot context with PostgreSQL container
- JPA entity persistence and JSONB round-trip
- Flyway migration execution
- Controller MockMvc tests hitting real database

**Example:**
```java
@Testcontainers
@SpringBootTest
class PositionControllerTest {
    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");
    
    @Test
    void createPosition_validInput_returns201() {
        // arrange
        var request = new CreatePositionRequest("IT Specialist", "2210", "GS-13", ...);
        
        // act
        var response = mockMvc.perform(post("/api/positions")
            .contentType(APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)));
        
        // assert
        response.andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists());
    }
}
```

### 7.2 Frontend Testing

**Approach:** `npm run build` verifies TypeScript compilation. No additional test framework required for POC.

**Manual Smoke Tests:**
- Create position → verify appears in list
- Create PD document → click "Get AI Suggestions" → accept suggestion → verify body updated
- Upload resume → verify side-by-side mapping view

### 7.3 Smoke Test Script

**File:** `plan/smoke-test.sh`

**Usage:** `bash plan/smoke-test.sh local wave1`

**Tests:**
```bash
# Wave 1 smoke tests
POST /api/positions → 201
GET /api/positions → 200
POST /api/pd-documents → 201
POST /api/ai/suggest-section → 200 (array with >= 1 item)
POST /api/resumes/upload → 201
GET /api/resumes/{id}/mappings → 200

# Wave 2 smoke tests
POST /api/positions {title: "IT"} → 422 VALIDATION_ERROR
POST /api/positions {series: "22XX"} → 422
POST /api/resumes/upload (11MB file) → 413 PAYLOAD_TOO_LARGE
```

---

## 8. Security Considerations

### 8.1 Current State (POC Scope)

**No Authentication:** All endpoints are public. JWT/Spring Security deferred to future phase.

**CORS Configuration:**
```java
@Override
public void addCorsMappings(CorsRegistry registry) {
    registry.addMapping("/api/**")
        .allowedOrigins("http://localhost:3000")  // Vite dev server only
        .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
        .allowedHeaders("*")
        .allowCredentials(true);
}
```

### 8.2 Input Validation Protections

**SQL Injection:** Prevented by Spring Data JPA parameterized queries (no raw SQL with string concatenation)

**File Upload Limits:**
- Max size: 10MB (enforced by `spring.servlet.multipart.max-file-size`)
- Allowed MIME types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- File storage: Local filesystem under `./uploads/resumes/` (not web-accessible)

**XSS Prevention:** React automatically escapes all interpolated values. No `dangerouslySetInnerHTML` used.

### 8.3 AWS Credentials Security

**Credential Handling:**
- AWS SDK uses default credential provider chain (reads `~/.aws/credentials`)
- No credentials hardcoded in application.yml or code
- Docker Compose mounts `~/.aws` read-only: `- ${HOME}/.aws:/root/.aws:ro`
- `.env` file MUST be in `.gitignore` (confirmed in Phase 0a)

**IAM Permissions Required:**
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

### 8.4 Future Auth Phase Considerations

**Planned Approach (not in this POC):**
- Spring Security with JWT tokens
- Separate `users` table with `role` column (ADMIN, REVIEWER, VIEWER)
- Position-level access control: only ADMIN can delete positions; REVIEWER can approve PD documents
- Resume uploads restricted to authenticated users
- Audit log for PD document changes (created_by, updated_by columns)

---

## 9. Deployment and Operations

### 9.1 Local Development Workflow

**Initial Setup:**
```bash
# 1. Clone repository
git clone <repo-url> && cd cms-hiring-poc

# 2. Copy environment template
cp .env.example .env

# 3. (Optional) Set AWS credentials for Wave 4 features
export AWS_REGION=us-east-1
export AWS_PROFILE=default

# 4. Start Docker Compose stack
docker compose up -d

# 5. Verify health
curl http://localhost:8080/health
curl http://localhost:3000/api/health  # via proxy
```

**Development Iteration:**
```bash
# Backend changes
cd backend
./gradlew bootRun  # Run outside Docker for faster iteration

# Frontend changes
cd frontend
npm run dev  # Hot reload enabled

# Database migrations (auto-applied on backend startup)
# Flyway migrations in src/main/resources/db/migration/
```

### 9.2 Smoke Testing

**Preflight Check (before starting work on a wave):**
```bash
bash plan/preflight.sh
# Verifies: Docker installed, Python 3 available, ports 3000/5432/8080 free
```

**Post-Wave Smoke Tests:**
```bash
bash plan/smoke-test.sh local wave1  # Tests Wave 1 endpoints
bash plan/smoke-test.sh local wave2  # Tests Wave 2 validation
bash plan/smoke-test.sh local wave4  # Tests Wave 4 AI integration
```

### 9.3 Non-Goals (Out of Scope)

This POC explicitly excludes:
- ❌ Cloud deployment (no Railway, AWS ECS, Kubernetes)
- ❌ CI/CD pipelines (no GitHub Actions, Jenkins)
- ❌ Production database backups
- ❌ Load balancing or horizontal scaling
- ❌ SSL/TLS certificates
- ❌ CDN for frontend assets
- ❌ Real-time notifications (WebSockets)
- ❌ Email notifications for status changes
- ❌ Audit logging or change history

---

## 10. Key Design Decisions and Rationale

### 10.1 Why Local-Only POC?

**Decision:** No cloud deployment infrastructure (Railway, AWS ECS, etc.).

**Rationale:**
- POC goal is to validate LLM-augmented PD editing workflow with internal stakeholders
- Cloud deployment adds operational complexity (secrets management, database migrations, health checks, rollback procedures) that distracts from core UX validation
- Local Docker Compose enables rapid iteration without cloud vendor costs or approval delays

**Trade-off:** Limits demo audience to developers with Docker installed, but this aligns with internal-facing POC scope.

### 10.2 Why Spring Boot (Java) vs Node.js Backend?

**Decision:** Java 21 + Spring Boot 3.x for backend.

**Rationale:**
- CMS OIT standardized on Java for backend services (Spring Boot ecosystem familiar to team)
- Spring Data JPA provides robust transaction management and Flyway integration
- AWS SDK for Java has first-class support (AWS is Java-first shop)
- Type safety (Java + TypeScript) reduces runtime errors vs JavaScript backend

**Trade-off:** Longer build times than Node.js, but Gradle caching mitigates this for incremental builds.

### 10.3 Why JSONB for PD Content?

**Decision:** Store PD sections as JSONB in `pd_documents.content` column instead of separate `pd_sections` table.

**Rationale:**
- Sections always loaded/saved together (no independent section queries)
- Avoids N+1 query problem (loading document + 10 sections = 11 queries with separate table)
- Simplifies section ordering (array index vs `ORDER BY sort_order` with gap management)
- AI suggestions are transient (not audit items), so embedding them in-document is cleaner

**Trade-off:** Can't query "all sections with compliance suggestions" without full-table scan, but POC scale (<100 positions) makes this acceptable.

### 10.4 Why Stub AI Implementation in Wave 1?

**Decision:** BedrockServiceStub returns hardcoded suggestions instead of deferring AI features to Wave 4 entirely.

**Rationale:**
- Frontend developers can build suggestion pills, acceptance UX, and reviewer workflow without AWS credentials
- Contract-first approach ensures Wave 4 backend changes require zero frontend changes (just swap implementations)
- Enables early UX validation with stakeholders before committing to Bedrock costs

**Trade-off:** Stub suggestions are not realistic, but clearly labeled as "Example" in UI.

### 10.5 Why No Vector Database (pgvector)?

**Decision:** Cosine similarity computed in-memory in Java, no pgvector extension.

**Rationale:**
- POC scale: <100 positions, ~50 resumes expected → in-memory cosine similarity is O(n²) but n is small
- pgvector requires extension installation, index creation/tuning, and versioned migrations — operational overhead not justified at this scale
- Keeps PostgreSQL setup vanilla (standard postgres:16 Docker image with no extensions)

**Trade-off:** Won't scale to 10,000+ resumes, but that's outside POC scope. Production system would need pgvector or dedicated vector DB.

### 10.6 Why Wave-Based Delivery vs Big Bang?

**Decision:** Phase 0 → Wave 1 → Wave 2 → Wave 4 incremental delivery.

**Rationale:**
- Early skeleton (Phase 0) unblocks parallel frontend/backend work
- Wave 1 proves data flow end-to-end before adding validation complexity
- Wave 2 validation can be comprehensive because data model is stable
- Wave 4 AI integration is isolated risk (if Bedrock fails, stubs still work)

**Trade-off:** More orchestrator overhead (merging hot file changes after each wave), but prevents "everything broken until last day" scenario.

---

## 11. Future Enhancements (Post-POC)

### 11.1 Authentication and Authorization

- Spring Security with JWT tokens
- Role-based access control (ADMIN, REVIEWER, VIEWER)
- Position-level permissions (creator can edit, reviewer can approve)
- Audit log for PD changes (created_by, updated_by columns)

### 11.2 Search and Filtering (Wave 3 Descoped Items)

- Full-text search in PD document bodies (PostgreSQL `tsvector`)
- Advanced position filtering (date range, series, grade, status combinations)
- Resume search by candidate name or skills

### 11.3 Real-Time Collaboration

- WebSocket-based live editing indicators ("User X is editing this section")
- Optimistic locking to prevent concurrent edit conflicts
- Comment threads on PD sections for reviewer feedback

### 11.4 Notification System

- Email notifications when position status changes
- Slack integration for certificate issued events
- Daily digest of positions closing soon

### 11.5 Analytics Dashboard

- Time-to-certificate metrics by position series
- AI suggestion acceptance rate (compliance vs clarity vs specificity)
- Resume mapping confidence distribution (histogram of scores)

### 11.6 Integration with External Systems

- Import positions from USAJOBS API
- Export PD documents to OHC submission format (PDF generation)
- Sync with HR systems (Workday, PeopleSoft)

---

## 12. Success Metrics (POC Evaluation Criteria)

### 12.1 Functional Completeness

- ✅ All 3 core features (Position Tracker, PD Editor, Resume Reader) working end-to-end
- ✅ Live AI integration with real Bedrock responses (not stubs)
- ✅ All smoke tests passing

### 12.2 User Experience

- ✅ PD suggestions reduce OHC revision cycles (qualitative feedback from BOG staff)
- ✅ Resume mapping accelerates candidate review (< 5 minutes per resume vs 15+ minutes manual)
- ✅ Shared position pipeline reduces "where is this position?" CMS Chat threads

### 12.3 Code Quality

- ✅ All Testcontainers integration tests passing
- ✅ No SQL injection, XSS, or credential leakage vulnerabilities
- ✅ TypeScript compiles with zero errors
- ✅ Consistent error envelope across all error responses

### 12.4 Operational Readiness (for future production system)

- ✅ Flyway migrations run cleanly on fresh database
- ✅ Docker Compose starts all services with health checks passing
- ✅ Graceful degradation when AWS_REGION unset (stubs activate)

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **BOG** | Business Operations Group — CMS OIT division managing hiring process |
| **OHC** | Office of Human Capital — CMS HR division that reviews position descriptions |
| **PD** | Position Description — formal document defining duties and qualifications for a federal job posting |
| **Hot File** | Central file where merge conflicts break the build (e.g., Application.java, App.tsx) — requires orchestrated edits |
| **result.json** | Worker output file documenting completed work and pending hot-file changes for orchestrator to apply |
| **Wave** | Implementation phase delivering a cohesive set of features (Wave 1: CRUD, Wave 2: Validation, Wave 4: AI) |
| **Stub** | Hardcoded implementation returning deterministic responses, used before real AWS Bedrock integration |
| **Orchestrator** | Coordinator role that merges hot-file changes from result.json files and runs smoke tests between waves |

---

## 14. References

### 14.1 Internal Documentation

- `overview.md` — High-level application overview and tech stack
- `phase-0.md` — Bootable skeleton implementation details
- `wave-1.md` — CRUD feature implementation details
- `wave-2.md` — Validation and error handling implementation
- `wave-4.md` — AI integration implementation
- `contracts.md` — Canonical JSON fixtures for API contracts
- `manifest.yaml` — Complete work unit breakdown with dependencies

### 14.2 External Resources

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [AWS Bedrock Developer Guide](https://docs.aws.amazon.com/bedrock/latest/userguide/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/)
- [React Query Documentation](https://tanstack.com/query/latest/docs/react/overview)
- [Hypersistence Utils (JSONB mapping)](https://github.com/vladmihalcea/hypersistence-utils)

---

## Appendix A: Work Unit Dependency Graph

```
Phase 0a (parallel)
  ├─ p0a-backend-scaffold
  ├─ p0a-frontend-scaffold
  └─ p0a-db-flyway (depends on backend-scaffold)
     └─ p0a-docker-compose (depends on all 3 above)
        └─ Phase 0b
           └─ p0b-local-stack-verify

Wave 1 (sequential dependencies)
  ├─ w1-position-tracker-crud (depends on p0a-db-flyway)
  ├─ w1-pd-document-crud (depends on position-tracker-crud)
  ├─ w1-resume-upload-storage (depends on position-tracker-crud)
  ├─ w1-ai-stub (depends on p0a-backend-scaffold)
  ├─ w1-position-tracker-ui (depends on position-tracker-crud + p0a-frontend-scaffold)
  ├─ w1-pd-editor-ui (depends on pd-document-crud + ai-stub + position-tracker-ui)
  └─ w1-resume-reader-ui (depends on resume-upload-storage + position-tracker-ui)

Wave 2 (parallel)
  ├─ w2-input-validation (depends on all Wave 1 CRUD units)
  └─ w2-error-handling (depends on p0a-backend-scaffold)

Wave 3: SKIPPED

Wave 4 (sequential)
  ├─ w4-pd-editor-bedrock (depends on w1-ai-stub)
  └─ w4-resume-embedding-bedrock (depends on w1-resume-upload-storage)
```

---

## Appendix B: Environment Variables Reference

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `POSTGRES_USER` | No | `cms` | PostgreSQL username |
| `POSTGRES_PASSWORD` | No | `cms` | PostgreSQL password |
| `POSTGRES_DB` | No | `cms_hiring` | PostgreSQL database name |
| `AWS_REGION` | No | (unset) | AWS region for Bedrock; if unset, AI stubs activate |
| `AWS_PROFILE` | No | `default` | AWS credentials profile name |
| `UPLOAD_DIR` | No | `./uploads` | Local filesystem path for resume file storage |

**Security Note:** `.env` file MUST be in `.gitignore`. Never commit credentials to version control.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-05-28 | Claude (Sonnet 4.5) | Initial design document created from plan folder contents |

