# Wave 4 — Live AI Integrations (AWS Bedrock)

**Wave 4 goal:** Replace the two hardcoded AI stubs with live AWS Bedrock calls. The PD Editor gets rule-aware, typed suggestions from Claude 3.5 Sonnet via Bedrock. The Resume Reader gets real embedding-based qualification mapping using Amazon Titan Embeddings V2.

**Pre-condition:** All Wave 2 work units complete. Wave 2 smoke tests passing. AWS credentials configured at `~/.aws/credentials` with permissions for `bedrock:InvokeModel` and `bedrock:InvokeModelWithResponseStream`. The Claude model `anthropic.claude-3-5-sonnet-20241022-v2:0` must be enabled in the Bedrock console in the target region.

> **Auth note:** All endpoints are currently public (auth deferred to a future phase). The PATCH /confirm endpoint does not require a token.

**Post-condition:** Two different section bodies return different suggestions (not hardcoded). Suggestions for "Responsible for..." text include at least one `type=compliance` suggestion. Resume PDF parsing produces text. Mappings above the 0.65 confidence threshold appear in `GET /api/resumes/{id}/mappings`.

**Model recommendation:** Use Claude Sonnet for both work units — the Bedrock SDK integration, streaming response parsing, error boundary logic, and embedding pipeline all require careful reasoning about failure modes.

**Note on governance:** Per discovery research, OHC has resisted formalizing AI use due to audit liability under 29 CFR 1607 (Uniform Guidelines on Employee Selection). The Resume Reader mapping tool explicitly does NOT score, rank, or exclude candidates — it assists reviewer judgment. The PD Editor suggestions are advisory only — reviewers approve each change. These constraints are encoded in the system prompts and must not be removed.

---

## Work Unit: w4-pd-editor-bedrock

### Replace AI Stub with Live AWS Bedrock Claude for PD Suggestions

**AWS Bedrock Java SDK pattern:**

```java
// Gradle dependency required (note in result.json):
// implementation(platform("software.amazon.awssdk:bom:2.26.12"))  [in dependencyManagement]
// implementation("software.amazon.awssdk:bedrockruntime")

BedrockRuntimeAsyncClient bedrockClient = BedrockRuntimeAsyncClient.builder()
    .region(Region.of(awsRegion))  // uses default credential provider chain automatically
    .build();
```

The default credential provider chain picks up `~/.aws/credentials` automatically. No API key wiring in application code.

**Files to create:**

`backend/src/main/java/gov/cms/hiring/service/BedrockServiceImpl.java`:
```java
@Service
@ConditionalOnProperty(name = "aws.region", matchIfMissing = false)  // only activates when AWS_REGION is set to a non-blank value
// No @Primary needed: when this bean registers, it is the only BedrockService implementation
// (BedrockServiceStub is suppressed by @ConditionalOnMissingBean(BedrockServiceImpl.class))
public class BedrockServiceImpl implements BedrockService {

    // model ID injected via constructor — see modelId field
    private static final String PD_SYSTEM_PROMPT = """
        You are an expert federal human resources specialist helping CMS OIT BOG staff write
        Position Descriptions (PDs) that comply with Office of Human Capital (OHC) standards.

        When reviewing a PD section, apply these rules and flag violations:

        OHC-PD-001 (Compliance): Never use "responsible for" — this phrase is prohibited in
        federal PDs. Replace with specific, active-voice duty statements.

        OHC-PD-002 (Compliance): Avoid passive constructions like "is required to" or
        "will be expected to." Use present-tense active voice throughout.

        OHC-PD-003 (Specificity): Specialized experience statements must cite specific years
        and level (e.g., "At least one (1) year of specialized experience equivalent to GS-13").

        OHC-PD-004 (Clarity): Avoid vague modal verbs. "May coordinate" underspecifies the duty.
        Use definitive present-tense statements.

        OHC-PD-005 (Specificity): Technical requirements must be specific enough to be assessable.

        IMPORTANT: Your suggestions are advisory only. A human reviewer approves or rejects
        every suggestion. Do not score, rank, or exclude candidates.

        Respond ONLY with a JSON array of suggestion objects. Each object must have exactly:
        - type: one of "compliance", "clarity", or "specificity"
        - original: the exact verbatim substring from the section that has the issue
        - suggested: your proposed replacement text
        - ruleReference: the OHC rule code (e.g., "OHC-PD-001")

        If the section has no issues, return []. Return ONLY the JSON array, no other text.
        """;

    private final BedrockRuntimeAsyncClient bedrockClient;
    private final ObjectMapper objectMapper;
    private final String modelId;

    public BedrockServiceImpl(
            ObjectMapper objectMapper,
            @Value("${aws.region}") String region,
            @Value("${aws.bedrock.model-id:anthropic.claude-3-5-sonnet-20241022-v2:0}") String modelId) {
        this.objectMapper = objectMapper;
        this.modelId = modelId;
        this.bedrockClient = BedrockRuntimeAsyncClient.builder()
            .region(Region.of(region))
            .build();
    }

    @Override
    public List<AISuggestionDto> suggestSection(String sectionHeading, String sectionBody) {
        // Build Claude Messages API request body as JSON string
        String requestBody = buildClaudeRequest(sectionHeading, sectionBody);

        try {
            // Collect streamed response into a StringBuilder
            StringBuilder responseText = new StringBuilder();

            InvokeModelWithResponseStreamRequest request = InvokeModelWithResponseStreamRequest.builder()
                .modelId(modelId)
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromUtf8String(requestBody))
                .build();

            // Call Bedrock synchronously (via CompletableFuture.get with timeout)
            bedrockClient.invokeModelWithResponseStream(request,
                InvokeModelWithResponseStreamResponseHandler.builder()
                    .onEventStream(publisher -> {
                        publisher.subscribe(event -> {
                            if (event instanceof PayloadPart part) {
                                responseText.append(part.bytes().asUtf8String());
                            }
                        });
                    })
                    .build()
            ).get(30, TimeUnit.SECONDS);

            return parseClaudeResponse(responseText.toString());

        } catch (TimeoutException e) {
            log.warn("Bedrock request timed out for section: {}", sectionHeading);
            return List.of();
        } catch (Exception e) {
            log.error("Bedrock request failed for section: {}", sectionHeading, e);
            return List.of();  // graceful degradation — never propagate to 500
        }
    }

    private String buildClaudeRequest(String sectionHeading, String sectionBody) {
        // Claude Messages API format
        Map<String, Object> request = Map.of(
            "anthropic_version", "bedrock-2023-05-31",
            "max_tokens", 2048,
            "system", PD_SYSTEM_PROMPT,
            "messages", List.of(
                Map.of("role", "user", "content",
                    "Section: " + sectionHeading + "\n\n" + sectionBody)
            )
        );
        try {
            return objectMapper.writeValueAsString(request);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize Bedrock request", e);
        }
    }

    private List<AISuggestionDto> parseClaudeResponse(String rawResponse) {
        try {
            // Extract streamed text content from NDJSON-like Bedrock response
            String text = extractTextFromStreamedResponse(rawResponse);
            // Parse the JSON array from Claude's text response
            JsonNode suggestions = objectMapper.readTree(text.trim());
            List<AISuggestionDto> result = new ArrayList<>();
            for (JsonNode s : suggestions) {
                result.add(new AISuggestionDto(
                    s.get("type").asText(),
                    s.get("original").asText(),
                    s.get("suggested").asText(),
                    s.get("ruleReference").asText()
                ));
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse Bedrock response: {}", e.getMessage());
            return List.of();
        }
    }

    // Bedrock streaming emits one JSON event object per line (NDJSON-like).
    // Claude content arrives in "content_block_delta" events with delta.type = "text_delta".
    private String extractTextFromStreamedResponse(String rawResponse) {
        StringBuilder text = new StringBuilder();
        for (String line : rawResponse.split("\n")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            try {
                JsonNode event = objectMapper.readTree(line);
                if ("content_block_delta".equals(event.path("type").asText())) {
                    JsonNode delta = event.path("delta");
                    if ("text_delta".equals(delta.path("type").asText())) {
                        text.append(delta.path("text").asText());
                    }
                }
            } catch (Exception ignored) {
                // skip malformed event lines
            }
        }
        return text.toString();
    }

    @Override
    public List<QualificationMappingDto> mapResumeToRequirements(UUID resumeId, List<String> requirements) {
        // NOTE: This method is an intentional no-op stub on BedrockServiceImpl.
        // Resume qualification mapping is handled entirely by EmbeddingService,
        // which ResumeService calls directly. BedrockServiceImpl provides this stub
        // only to satisfy the BedrockService interface contract.
        return List.of();
    }
}
```

`application.yml` addition (via result.json):
```yaml
aws:
  region: ${AWS_REGION:}
```

> **Why no default?** With `${AWS_REGION:us-east-1}`, the property is always non-blank and `@ConditionalOnProperty(name = "aws.region")` is always satisfied — `BedrockServiceImpl` always registers and the stub never activates. Setting the default to empty (`${AWS_REGION:}`) means Spring treats the property as blank when `AWS_REGION` is not set. `@ConditionalOnProperty` does NOT match a blank value, so the stub activates. Set `AWS_REGION=us-east-1` (or any non-empty value) to activate live Bedrock calls.

**Required IAM permissions** for the AWS principal in `~/.aws/credentials`:
- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`

**New test file:** `backend/src/test/java/gov/cms/hiring/BedrockServiceTest.java`

Tests using Mockito to mock `BedrockRuntimeAsyncClient`:
- Mock returns a valid Claude response JSON → `suggestSection` returns non-empty list
- Mock returns a compliance suggestion for "Responsible for..." input → type == "compliance"
- Mock throws `TimeoutException` → `suggestSection` returns empty list (no exception propagated)
- Mock throws SDK exception → `suggestSection` returns empty list (no exception propagated)
- Mock returns malformed JSON → `suggestSection` returns empty list (parse error gracefully handled)

Live integration test (only runs when `AWS_REGION` is set and AWS credentials are configured):
```java
@EnabledIfEnvironmentVariable(named = "AWS_REGION", matches = ".+")
@Test
void suggestSection_withResponsibleFor_returnsComplianceSuggestion() { ... }
```

**result.json hot_file_changes:**
```json
{
  "gradle_dependency": "implementation(\"software.amazon.awssdk:bedrockruntime\")",
  "application_yml_addition": "aws.region: ${AWS_REGION:}",
  "env_var_needed": "AWS_REGION — AWS region for Bedrock (no default; if unset, AI stub is used)\nAWS_PROFILE — AWS credentials profile (default: default)",
  "smoke_test_additions": "POST /api/ai/suggest-section with 'Responsible for...' → type=compliance suggestion\nTwo different inputs return different suggestions"
}
```

---

## Work Unit: w4-resume-embedding-bedrock

### Live Resume Parsing and Qualification Mapping with Bedrock Titan Embeddings

**Context:** OHC reviewers lack the technical domain knowledge to accurately assess IT specialist resumes — particularly around AI, cloud, Kafka, and full-stack platforms. The mapper extracts explicit requirement phrases from PD sections and uses semantic similarity to surface resume passages that match each requirement, reducing manual cross-referencing. All mapping is advisory; reviewers confirm or reject each match.

**Files to create:**

`backend/src/main/java/gov/cms/hiring/service/ResumeParserService.java`:
```java
@Service
public class ResumeParserService {

    /**
     * Extract all text from a PDF file.
     * Uses Apache PDFBox 3.x (org.apache.pdfbox:pdfbox:3.0.2).
     */
    public String parsePdf(byte[] fileBytes) throws IOException {
        try (PDDocument doc = Loader.loadPDF(fileBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }

    /**
     * Extract all paragraph text from a DOCX file.
     * Uses Apache POI (org.apache.poi:poi-ooxml:5.2.5).
     */
    public String parseDocx(byte[] fileBytes) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(fileBytes))) {
            return doc.getParagraphs().stream()
                .map(XWPFParagraph::getText)
                .filter(t -> !t.isBlank())
                .collect(Collectors.joining("\n"));
        }
    }

    /**
     * Split text into paragraph-sized chunks, filtering out very short lines.
     * Short lines (fewer than 10 words) are typically headers or whitespace noise.
     */
    public List<String> extractParagraphs(String text) {
        return Arrays.stream(text.split("\\n{2,}"))
            .map(String::trim)
            .filter(p -> p.split("\\s+").length >= 10)
            .collect(Collectors.toList());
    }
}
```

`backend/src/main/java/gov/cms/hiring/service/EmbeddingService.java`:
```java
@Service
public class EmbeddingService {

    private static final String TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";
    private static final double CONFIDENCE_THRESHOLD = 0.65;

    private final BedrockRuntimeClient bedrockClient;  // synchronous client for embeddings
    private final ObjectMapper objectMapper;

    public EmbeddingService(
            ObjectMapper objectMapper,
            @Value("${aws.region}") String region) {
        this.objectMapper = objectMapper;
        this.bedrockClient = BedrockRuntimeClient.builder()
            .region(Region.of(region))
            .build();
    }

    /**
     * Embed a single text string using Amazon Titan Embeddings V2.
     * Request: {"inputText": "..."}
     * Response: {"embedding": [...], "inputTextTokenCount": N}
     */
    public List<Double> embedText(String text) {
        try {
            String requestBody = objectMapper.writeValueAsString(Map.of("inputText", text));
            InvokeModelRequest request = InvokeModelRequest.builder()
                .modelId(TITAN_MODEL_ID)
                .contentType("application/json")
                .accept("application/json")
                .body(SdkBytes.fromUtf8String(requestBody))
                .build();

            InvokeModelResponse response = bedrockClient.invokeModel(request);
            JsonNode root = objectMapper.readTree(response.body().asByteArray());
            JsonNode embeddingNode = root.get("embedding");
            List<Double> embedding = new ArrayList<>();
            for (JsonNode val : embeddingNode) {
                embedding.add(val.asDouble());
            }
            return embedding;
        } catch (Exception e) {
            log.error("Embedding request failed: {}", e.getMessage(), e);
            throw new RuntimeException("Embedding failed", e);
        }
    }

    /**
     * Cosine similarity between two vectors. Pure Java, no ML library needed.
     */
    public double cosineSimilarity(List<Double> a, List<Double> b) {
        if (a.size() != b.size() || a.isEmpty()) return 0.0;
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.size(); i++) {
            dot  += a.get(i) * b.get(i);
            normA += a.get(i) * a.get(i);
            normB += b.get(i) * b.get(i);
        }
        double denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom == 0.0 ? 0.0 : dot / denom;
    }

    /**
     * Find the best-matching resume paragraph for each requirement.
     * Returns only matches >= CONFIDENCE_THRESHOLD (0.65).
     */
    public List<QualificationMappingDto> mapRequirementsToResume(
            List<String> requirements, List<String> resumeParagraphs) {

        if (requirements.isEmpty() || resumeParagraphs.isEmpty()) return List.of();

        // Embed all texts in two batches to reduce API calls
        List<List<Double>> reqEmbeddings = requirements.stream()
            .map(this::embedText).collect(Collectors.toList());
        List<List<Double>> paraEmbeddings = resumeParagraphs.stream()
            .map(this::embedText).collect(Collectors.toList());

        List<QualificationMappingDto> mappings = new ArrayList<>();
        for (int i = 0; i < requirements.size(); i++) {
            double bestScore = 0.0;
            String bestPara = "";
            for (int j = 0; j < resumeParagraphs.size(); j++) {
                double score = cosineSimilarity(reqEmbeddings.get(i), paraEmbeddings.get(j));
                if (score > bestScore) {
                    bestScore = score;
                    bestPara = resumeParagraphs.get(j);
                }
            }
            if (bestScore >= CONFIDENCE_THRESHOLD) {
                // Truncate very long paragraphs for storage
                String truncated = bestPara.length() > 500 ? bestPara.substring(0, 500) : bestPara;
                mappings.add(new QualificationMappingDto(
                    null, null,  // id and resumeId set by service layer
                    requirements.get(i),
                    truncated,
                    Math.round(bestScore * 10000.0) / 10000.0,
                    false
                ));
            }
        }
        return mappings;
    }
}
```

**Files to modify:**

`ResumeService.getResumeMappings(UUID resumeId)` — replace stub with real implementation:
1. Load resume from repository; throw `NotFoundException` if not found
2. If `status == MAPPED`, return stored `QualificationMapping` records from repository
3. If `status == UPLOADED`, parse file using `ResumeParserService` (PDF or DOCX based on filename extension), update `parsedText` and set `status = PARSED`
4. Load latest PD document for `resume.positionId`; if none, return empty list
5. Extract requirement strings: one string per section = `"{heading}: {body.substring(0, 300)}"`
6. Extract resume paragraphs via `ResumeParserService.extractParagraphs(parsedText)`
7. Call `EmbeddingService.mapRequirementsToResume(requirements, paragraphs)`
8. Persist resulting `QualificationMapping` entities, set resume `status = MAPPED`
9. Return persisted mappings as DTOs

**New controller:**

`backend/src/main/java/gov/cms/hiring/controller/QualificationMappingController.java`:
```java
@RestController
@RequestMapping("/api/qualification-mappings")
public class QualificationMappingController {

    @PatchMapping("/{mappingId}/confirm")
    public QualificationMappingDto confirmMapping(
            @PathVariable UUID mappingId,
            @RequestBody @Valid ConfirmMappingRequest body) {
        // Endpoint is currently public (auth deferred to future phase)
        return mappingService.confirmMapping(mappingId, body.confirmed());
    }
}

public record ConfirmMappingRequest(@NotNull Boolean confirmed) {}
```

**build.gradle.kts dependencies required** (note in result.json):
```kotlin
implementation("org.apache.pdfbox:pdfbox:3.0.2")
implementation("org.apache.poi:poi-ooxml:5.2.5")
```

**New test files:**

`backend/src/test/java/gov/cms/hiring/ResumeParserServiceTest.java` (no external dependencies — always runs):
- `parsePdf` with a minimal in-memory PDF (using PDFBox to create it) → returns non-empty string
- `parseDocx` with a minimal in-memory DOCX (using POI to create it) → returns non-empty string
- `extractParagraphs` with mixed short/long paras → filters out paragraphs with < 10 words
- `extractParagraphs` with empty string → returns empty list

`backend/src/test/java/gov/cms/hiring/EmbeddingServiceTest.java` (Mockito — always runs):
- `cosineSimilarity([1,0,...], [1,0,...])` → 1.0
- `cosineSimilarity([1,0,...], [0,1,...])` → 0.0
- `cosineSimilarity([], [])` → 0.0 (edge case — empty vectors)
- `mapRequirementsToResume` with mocked `embedText` returning controlled vectors → only entries >= 0.65 returned
- `mapRequirementsToResume` with confidence exactly 0.65 → included (at-threshold is valid)
- `mapRequirementsToResume` with confidence 0.6499 → excluded (below threshold)
- Mock `embedText` throws → `mapRequirementsToResume` propagates exception (caller must handle)

Live integration tests (only run when `AWS_REGION` env var is set):
```java
@EnabledIfEnvironmentVariable(named = "AWS_REGION", matches = ".+")
@Test
void embedText_returnsNonEmptyVector() { ... }
```

**result.json hot_file_changes:**
```json
{
  "gradle_dependency": "implementation(\"org.apache.pdfbox:pdfbox:3.0.2\")\nimplementation(\"org.apache.poi:poi-ooxml:5.2.5\")",
  "smoke_test_additions": "GET /api/resumes/{id}/mappings → 200\nPATCH /api/qualification-mappings/{id}/confirm → 200"
}
```
