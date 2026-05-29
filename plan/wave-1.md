# Wave 1 — CRUD End-to-End (No Auth, No Validation)

**Wave 1 goal:** Build all three feature tracks (Position Tracker, PD Editor, Resume Reader) end-to-end with real database persistence, but with zero authentication and zero input validation. The objective is to prove the full data flow works — JPA entities, Flyway migrations, Spring Boot controllers, and React UI — before adding the complexity of auth and validation in Wave 2.

**Pre-condition:** Phase 0a and 0b complete. `docker compose up -d` starts cleanly. `curl http://localhost:8080/health` returns 200. Flyway V1 migration has run successfully.

**Post-condition:** All Wave 1 smoke tests pass. A position can be created, a PD document attached to it, a resume uploaded, and AI suggestions requested — all via the frontend UI and verifiable via the API. All Testcontainers tests pass.

**Java conventions for this wave:**
- Package: `gov.cms.hiring`
- All entities use `@GeneratedValue(strategy = GenerationType.UUID)` for UUID primary keys
- All timestamp fields use `@CreationTimestamp` / `@UpdateTimestamp` (Hibernate)
- All controllers use `@RestController`, `@RequestMapping("/api/...")`, and `@Valid` on `@RequestBody`
- Response DTOs returned from all endpoints (never return JPA entities directly)
- Service layer owns business logic; repositories are pure JPA interfaces

---

## Work Unit: w1-position-tracker-crud

### Backend — Position JPA Entity, Migration, and CRUD Controller

**Files to create:**

`backend/src/main/java/gov/cms/hiring/model/PositionStatus.java`:
```java
package gov.cms.hiring.model;

public enum PositionStatus {
    READY_TO_POST, POSTED, UNDER_REVIEW, CERTIFICATE_ISSUED, CLOSED
}
```

`backend/src/main/java/gov/cms/hiring/model/Position.java`:
```java
@Entity
@Table(name = "positions")
public class Position {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String title;

    private String series;
    private String grade;

    @Enumerated(EnumType.STRING)
    private PositionStatus status;

    private LocalDate postingDate;
    private LocalDate closeDate;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

`backend/src/main/java/gov/cms/hiring/repository/PositionRepository.java`:
```java
public interface PositionRepository extends JpaRepository<Position, UUID> {
    List<Position> findByStatus(PositionStatus status);
}
```

`backend/src/main/java/gov/cms/hiring/dto/PositionDto.java` — record or class with all Position fields in camelCase. Include `CreatePositionRequest` and `UpdatePositionRequest` as nested classes or separate DTOs. All fields nullable in Update requests.

`backend/src/main/java/gov/cms/hiring/service/PositionService.java` — methods: `createPosition`, `getPosition` (throws NotFoundException), `listPositions` (optional status filter), `updatePosition`, `deletePosition`.

`backend/src/main/java/gov/cms/hiring/controller/PositionController.java`:
- `GET /api/positions` — list all, optional `?status=POSTED` query param
- `GET /api/positions/{id}` — get by UUID, 404 if not found
- `POST /api/positions` — create, returns 201 with body
- `PATCH /api/positions/{id}` — partial update, returns 200
- `DELETE /api/positions/{id}` — returns 204

`backend/src/main/resources/db/migration/V2__create_positions.sql`:
```sql
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    series VARCHAR(10),
    grade VARCHAR(10),
    status VARCHAR(30) DEFAULT 'READY_TO_POST',
    posting_date DATE,
    close_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

`backend/src/test/java/gov/cms/hiring/PositionControllerTest.java` — Testcontainers PostgreSQL integration test covering: create, get, list, list with status filter, update, delete, 404 on unknown id.

**result.json hot_file_changes:**
```json
{
  "router_bean": null,
  "smoke_test_additions": "POST /api/positions → 201\nGET /api/positions → 200\nGET /api/positions/{id} → 200\nGET /api/positions/{unknown} → 404"
}
```

---

## Work Unit: w1-pd-document-crud

### Backend — PDDocument Entity with Normalized Sections

**Data model context:** PD documents are position descriptions submitted to OHC. Each document has structured sections (introduction, specialized experience, KSAs, etc.) stored in a separate `pd_sections` table with a foreign key relationship. This normalized approach enables better data integrity, efficient querying, and proper relational constraints. AI suggestions are stored in a separate `ai_suggestions` table linked to sections.

**Files to create:**

`backend/src/main/java/gov/cms/hiring/model/PDDocument.java`:
```java
@Entity
@Table(name = "pd_documents")
public class PDDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID positionId;

    @Column(nullable = false)
    private String title;

    @OneToMany(mappedBy = "pdDocument", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("sortOrder ASC")
    private List<PDSection> sections = new ArrayList<>();

    @Column(nullable = false)
    private int version = 1;

    @Enumerated(EnumType.STRING)
    private PDDocumentStatus status = PDDocumentStatus.DRAFT;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

`backend/src/main/java/gov/cms/hiring/model/PDSection.java`:
```java
@Entity
@Table(name = "pd_sections")
public class PDSection {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pd_document_id", nullable = false)
    private PDDocument pdDocument;

    @Column(nullable = false, length = 200)
    private String heading;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(nullable = false)
    private Integer sortOrder;

    @Column(nullable = false)
    private Boolean aiReviewed = false;

    @Column(nullable = false)
    private Boolean reviewerApproved = false;

    @OneToMany(mappedBy = "pdSection", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<AISuggestion> suggestions = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
```

`backend/src/main/java/gov/cms/hiring/model/AISuggestion.java`:
```java
@Entity
@Table(name = "ai_suggestions")
public class AISuggestion {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pd_section_id", nullable = false)
    private PDSection pdSection;

    @Column(nullable = false, length = 20)
    private String type;  // 'compliance', 'clarity', or 'specificity'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String originalText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String suggestedText;

    @Column(length = 50)
    private String ruleReference;

    @Column(nullable = false)
    private Boolean accepted = false;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
```

DTOs for API responses in `dto` package:

```java
// gov.cms.hiring.dto.PDSectionDto
public record PDSectionDto(
    UUID id,
    String heading,
    String body,
    Integer sortOrder,
    List<AISuggestionDto> suggestions,
    Boolean aiReviewed,
    Boolean reviewerApproved
) {}

// gov.cms.hiring.dto.AISuggestionDto
public record AISuggestionDto(
    UUID id,
    String type,
    String originalText,
    String suggestedText,
    String ruleReference,
    Boolean accepted
) {}
```

`backend/src/main/java/gov/cms/hiring/model/PDDocumentStatus.java`:
```java
public enum PDDocumentStatus { DRAFT, SUBMITTED, APPROVED }
```

CRUD controller at `/api/pd-documents`:
- `GET /api/pd-documents?positionId={uuid}` — list by position
- `GET /api/pd-documents/{id}` — get by id
- `POST /api/pd-documents` — create with positionId and content; initializes with one empty section if content not provided
- `PATCH /api/pd-documents/{id}` — update content and/or status
- `DELETE /api/pd-documents/{id}` — delete

`backend/src/main/resources/db/migration/V3__create_pd_documents.sql`:
```sql
CREATE TABLE pd_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    version INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE pd_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pd_document_id UUID NOT NULL REFERENCES pd_documents(id) ON DELETE CASCADE,
    heading VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    sort_order INT NOT NULL,
    ai_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewer_approved BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ai_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pd_section_id UUID NOT NULL REFERENCES pd_sections(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL,
    original_text TEXT NOT NULL,
    suggested_text TEXT NOT NULL,
    rule_reference VARCHAR(50),
    accepted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pd_documents_position_id ON pd_documents(position_id);
CREATE INDEX idx_pd_sections_document ON pd_sections(pd_document_id, sort_order);
CREATE INDEX idx_ai_suggestions_section ON ai_suggestions(pd_section_id);
```

`backend/src/test/java/gov/cms/hiring/PDDocumentControllerTest.java` — Testcontainers tests covering entity relationships, section creation, eager loading with `@EntityGraph`, and content updates.

**result.json hot_file_changes:**
```json
{
  "gradle_dependency": null,
  "smoke_test_additions": "POST /api/pd-documents → 201\nGET /api/pd-documents/{id} → 200 with sections array"
}
```

---

## Work Unit: w1-resume-upload-storage

### Backend — Resume Upload, File Storage, and Stub Mappings

**Context:** The Resume Reader feature lets BOG staff upload candidate resumes for side-by-side comparison with PD requirements. In Wave 1, files are stored locally and the mapping endpoint returns a stub. Wave 4 replaces the stub with real embedding-based mapping.

**Files to create:**

`backend/src/main/java/gov/cms/hiring/model/Resume.java`:
```java
@Entity
@Table(name = "resumes")
public class Resume {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID positionId;

    @Column(nullable = false)
    private String filename;

    @Column(nullable = false)
    private String filePath;  // relative path under upload-dir

    @CreationTimestamp
    private LocalDateTime uploadDate;

    @Column(columnDefinition = "TEXT")
    private String parsedText;  // null until Wave 4

    @Enumerated(EnumType.STRING)
    private ResumeStatus status = ResumeStatus.UPLOADED;
}
```

`backend/src/main/java/gov/cms/hiring/model/QualificationMapping.java`:
```java
@Entity
@Table(name = "qualification_mappings")
public class QualificationMapping {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID resumeId;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String requirementText;

    @Column(columnDefinition = "TEXT")
    private String matchedText;

    private Double confidence;  // 0.0 - 1.0

    private boolean confirmedByReviewer = false;
}
```

`ResumeStatus` enum: `UPLOADED`, `PARSED`, `MAPPED`

`ResumeController` at `/api/resumes`:
- `POST /api/resumes/upload` — `@RequestParam MultipartFile file`, `@RequestParam UUID positionId`. Save to `${app.upload-dir}/resumes/{uuid}_{originalFilename}`. Return 201. Return 413 if `file.getSize() > 10 * 1024 * 1024`. Return 415 if content type is not `application/pdf` or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
- `GET /api/resumes/{id}` — get resume metadata
- `GET /api/resumes/{id}/mappings` — returns empty list `[]` (stub)

`application.yml` addition (note in result.json):
```yaml
app:
  upload-dir: ${UPLOAD_DIR:./uploads}
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 10MB
```

`backend/src/main/resources/db/migration/V4__create_resumes.sql`:
```sql
CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
    filename VARCHAR(500) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    upload_date TIMESTAMP DEFAULT NOW(),
    parsed_text TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADED'
);

CREATE TABLE qualification_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    requirement_text TEXT NOT NULL,
    matched_text TEXT,
    confidence DOUBLE PRECISION,
    confirmed_by_reviewer BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_resumes_position_id ON resumes(position_id);
CREATE INDEX idx_qual_mappings_resume_id ON qualification_mappings(resume_id);
```

**result.json hot_file_changes:**
```json
{
  "application_yml_addition": "app.upload-dir: ${UPLOAD_DIR:./uploads}\nspring.servlet.multipart.max-file-size: 10MB\nspring.servlet.multipart.max-request-size: 10MB",
  "env_var_needed": "UPLOAD_DIR — local path for resume storage (default: ./uploads)",
  "smoke_test_additions": "POST /api/resumes/upload → 201\nGET /api/resumes/{id}/mappings → 200 []"
}
```

---

## Work Unit: w1-ai-stub

### Backend — BedrockService Interface and Hardcoded Stub Implementation

**Context:** The AI endpoints need to exist and return plausible-shaped data so the frontend can be built and tested without AWS Bedrock credentials. The stub returns deterministic hardcoded responses. Wave 4 replaces the stub implementation with real Bedrock calls.

**Define the real interface now** so Wave 4 only swaps the implementation:

`backend/src/main/java/gov/cms/hiring/service/BedrockService.java`:
```java
package gov.cms.hiring.service;

import gov.cms.hiring.dto.AISuggestionDto;
import gov.cms.hiring.dto.QualificationMappingDto;
import java.util.List;
import java.util.UUID;

public interface BedrockService {
    /**
     * Suggest improvements for a PD section. Returns empty list on any error.
     */
    List<AISuggestionDto> suggestSection(String sectionHeading, String sectionBody);

    /**
     * Map resume content to PD requirements using embeddings.
     * Returns mappings above the 0.65 confidence threshold.
     *
     * Note: mapResumeToRequirements is fulfilled by EmbeddingService directly in ResumeService.
     * BedrockServiceImpl provides a stub no-op for this method. The real implementation
     * lives in EmbeddingService.mapRequirementsToResume(), called directly by ResumeService.
     */
    List<QualificationMappingDto> mapResumeToRequirements(UUID resumeId, List<String> requirements);
}
```

`backend/src/main/java/gov/cms/hiring/service/BedrockServiceStub.java`:
```java
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;

@Service
@ConditionalOnMissingBean(BedrockServiceImpl.class)
public class BedrockServiceStub implements BedrockService {

    @Override
    public List<AISuggestionDto> suggestSection(String sectionHeading, String sectionBody) {
        return List.of(
            new AISuggestionDto(
                "compliance",
                "Responsible for managing the cloud infrastructure.",
                "Manages cloud infrastructure, ensuring availability, security, and performance of production systems.",
                "OHC-PD-001: Avoid 'responsible for' language"
            ),
            new AISuggestionDto(
                "specificity",
                "Experience with cloud technologies.",
                "At least one (1) year of experience deploying production workloads on AWS, including EC2, RDS, Lambda, and CloudFormation.",
                "OHC-PD-005: Technical requirements must be specific and assessable"
            )
        );
    }

    @Override
    public List<QualificationMappingDto> mapResumeToRequirements(UUID resumeId, List<String> requirements) {
        return List.of();  // stub returns empty — Wave 4 replaces
    }
}
```

`backend/src/main/java/gov/cms/hiring/dto/AISuggestionDto.java`:
```java
public record AISuggestionDto(
    String type,          // "compliance" | "clarity" | "specificity"
    String original,
    String suggested,
    String ruleReference
) {}
```

`AIController` at `/api/ai`:
- `POST /api/ai/suggest-section` — body: `{sectionHeading, sectionBody, positionTitle}` → calls `bedrockService.suggestSection()` → returns `List<AISuggestionDto>`

`backend/src/test/java/gov/cms/hiring/AIControllerTest.java` — MockMvc tests: stub returns 200 with array of 2 items, each has type/original/suggested/ruleReference.

**result.json hot_file_changes:**
```json
{
  "smoke_test_additions": "POST /api/ai/suggest-section → 200 with array >= 1 item"
}
```

---

## Work Unit: w1-position-tracker-ui

### Frontend — Position List, Create, and Detail Pages

**Context:** This is the Position Tracker landing page — the replacement for the personal Excel trackers. It shows shared visibility into all active positions and their current status. Backend field names are camelCase (postingDate, closeDate, createdAt, updatedAt) — match them exactly in TypeScript.

**Files to create:**

`frontend/src/api/positions.ts` — axios wrapper functions: `listPositions(status?)`, `getPosition(id)`, `createPosition(data)`, `updatePosition(id, data)`, `deletePosition(id)`.

`frontend/src/components/StatusBadge.tsx` — colored badge chip based on `PositionStatus`:
- `READY_TO_POST` → blue background
- `POSTED` → teal background
- `UNDER_REVIEW` → amber/gold background
- `CERTIFICATE_ISSUED` → green background
- `CLOSED` → gray background

`frontend/src/pages/PositionListPage.tsx`:
- `useQuery` fetches positions from `GET /api/positions`
- Table columns: Title, Series, Grade, Status (StatusBadge), Posting Date, Actions
- Status filter dropdown
- Sort by clicking column headers
- "New Position" button → `/positions/new`

`frontend/src/pages/PositionNewPage.tsx`:
- `react-hook-form` form: title, series, grade, status select, postingDate, closeDate
- Submit calls `createPosition`, navigates to `/positions/{id}` on success

`frontend/src/pages/PositionDetailPage.tsx`:
- Shows position header with status badge
- Tab navigation: "PD Documents" and "Resumes"
- PD Documents tab: list + "New PD" button
- Resumes tab: list + link to `/positions/{id}/resumes`

`frontend/src/components/Nav.tsx` — sidebar nav with logo and nav items via props.

**Types to add to `frontend/src/types/index.ts`** (note in result.json — orchestrator adds):
```typescript
export type PositionStatus = 'READY_TO_POST' | 'POSTED' | 'UNDER_REVIEW' | 'CERTIFICATE_ISSUED' | 'CLOSED';
export interface Position {
  id: string;
  title: string;
  series: string;
  grade: string;
  status: PositionStatus;
  postingDate: string | null;
  closeDate: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**result.json hot_file_changes:**
```json
{
  "app_tsx_route": "<Route path='/positions' element={<PositionListPage />} />\n<Route path='/positions/new' element={<PositionNewPage />} />\n<Route path='/positions/:id' element={<PositionDetailPage />} />",
  "nav_item": "<NavItem href='/positions' label='Positions' />"
}
```

---

## Work Unit: w1-pd-editor-ui

### Frontend — Section-by-Section PD Editor with AI Suggestion Pills

**Files to create:**

`frontend/src/api/pdDocuments.ts` — `listPDDocuments(positionId)`, `getPDDocument(id)`, `createPDDocument(data)`, `updatePDDocument(id, data)`.

`frontend/src/api/ai.ts` — `suggestSection(req: SuggestSectionRequest)`.

`frontend/src/components/SuggestionPill.tsx`:
- Props: `suggestion: AISuggestion, onAccept: (suggested: string) => void`
- Type badge colors: compliance=red, clarity=blue, specificity=purple
- Truncated `suggested` text; `ruleReference` on hover tooltip
- Click calls `onAccept(suggestion.suggested)`

`frontend/src/pages/PDEditorPage.tsx` — route `/positions/:id/pd/:pdId`:
- Loads PD document via `getPDDocument(pdId)`
- Each section in a card: editable heading, body textarea, "Get AI Suggestions" button
- "Get AI Suggestions" calls `suggestSection`, shows loading spinner, renders `SuggestionPill` per suggestion
- Accepting a suggestion sets body textarea to `suggestion.suggested`
- `aiReviewed` icon (checkmark if true), `reviewerApproved` checkbox (calls PATCH on change)
- "Add Section" button appends new empty section
- "Save" button calls `updatePDDocument` with current content
- Auto-save on blur debounced 1 second

**Types to add to `frontend/src/types/index.ts`** (note in result.json):
```typescript
export type AISuggestionType = 'compliance' | 'clarity' | 'specificity';
export interface AISuggestion {
  type: AISuggestionType;
  original: string;
  suggested: string;
  ruleReference: string;
}
export interface PDSection {
  id: string;
  heading: string;
  body: string;
  suggestions: AISuggestion[];
  aiReviewed: boolean;
  reviewerApproved: boolean;
}
export interface PDDocumentContent {
  sections: PDSection[];
}
export type PDDocumentStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED';
export interface PDDocument {
  id: string;
  positionId: string;
  title: string;
  content: PDDocumentContent;
  version: number;
  status: PDDocumentStatus;
  createdAt: string;
  updatedAt: string;
}
```

**result.json hot_file_changes:**
```json
{
  "app_tsx_route": "<Route path='/positions/:id/pd/:pdId' element={<PDEditorPage />} />"
}
```

---

## Work Unit: w1-resume-reader-ui

### Frontend — Resume Upload Dropzone and Stub Mapping View

**Files to create:**

`frontend/src/api/resumes.ts` — `uploadResume(positionId, file)` (multipart POST), `getResume(id)`, `getResumeMappings(id)`, `confirmMapping(mappingId, confirmed)`.

`frontend/src/pages/ResumeReaderPage.tsx` — route `/positions/:id/resumes`:
- File upload dropzone (`react-dropzone`), accepts `.pdf` and `.docx` (client-side MIME check)
- Shows filename and size on hover, "Upload" button calls `uploadResume`
- On 415: "File type not supported. Please upload a PDF or DOCX file."
- On 413: "File too large. Maximum size is 10 MB."
- After successful upload:
  - Left panel: PD requirement headings from the position's active PD document
  - Right panel: resume filename, calls `getResumeMappings(resumeId)`
  - Wave 1: empty mappings → "No mappings found yet"
  - When mappings exist (Wave 4): requirement text highlighted in left, matchedText excerpt right, confidence % badge, confirm/reject toggle (calls `confirmMapping`)

**Types to add to `frontend/src/types/index.ts`** (note in result.json):
```typescript
export type ResumeStatus = 'UPLOADED' | 'PARSED' | 'MAPPED';
export interface Resume {
  id: string;
  positionId: string;
  filename: string;
  uploadDate: string;
  parsedText: string | null;
  status: ResumeStatus;
}
export interface QualificationMapping {
  id: string;
  resumeId: string;
  requirementText: string;
  matchedText: string;
  confidence: number;
  confirmedByReviewer: boolean;
}
```

**result.json hot_file_changes:**
```json
{
  "app_tsx_route": "<Route path='/positions/:id/resumes' element={<ResumeReaderPage />} />",
  "smoke_test_additions": "POST /api/resumes/upload (small PDF) → 201\nGET /api/resumes/{id}/mappings → 200"
}
```
