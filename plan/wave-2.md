# Wave 2 — Input Validation + Error Handling

**Wave 2 goal:** Add field-level validation and a consistent error response envelope to all endpoints. Wave 2 is strictly additive — no Wave 1 functionality is removed, and all Wave 1 smoke tests must still pass.

> **Authentication deferred:** Authentication (JWT, Spring Security) is deferred to a future phase. All endpoints are currently public. The `w2-jwt-auth` and `w2-auth-middleware` work units have been removed from this plan.

**Pre-condition:** All Wave 1 work units complete and passing. Wave 1 smoke tests green against a running Docker Compose stack.

**Post-condition:** Wave 2 smoke tests pass. Malformed input returns 422 with a structured error envelope.

**Java tech note:** Validation uses Jakarta Bean Validation annotations from `spring-boot-starter-validation`. Controllers already declare `@Valid` on request bodies (Wave 1 requirement). Wave 2 adds annotations to DTO fields and writes tests for the failure cases.

---

## Work Unit: w2-input-validation

### Jakarta Bean Validation Constraints on All Request DTOs

**What changes (none of these are hot files):**

`PositionCreateRequest.java` — add constraint annotations:
```java
public class PositionCreateRequest {
    @NotBlank
    @Size(min = 3, max = 200)
    private String title;

    @NotBlank
    @Pattern(regexp = "^\\d{4}$", message = "Series must be exactly 4 digits")
    private String series;

    @NotBlank
    @Pattern(regexp = "^GS-\\d{1,2}$", message = "Grade must match GS-N or GS-NN format")
    private String grade;

    private PositionStatus status = PositionStatus.READY_TO_POST;

    private LocalDate postingDate;
    private LocalDate closeDate;
}
```

Cross-field date validator — create `CloseDateAfterPostingDate` annotation and `CloseDateValidator`:
```java
// Validates that closeDate >= postingDate when both are non-null
// close_date == posting_date is explicitly valid (same-day close is a real scenario)
@CloseDateAfterPostingDate
public class PositionCreateRequest { ... }
```

`PDDocumentContentDto.java` — add constraint:
```java
@Size(min = 1, message = "At least one section is required")
private List<PDSectionDto> sections;
```

`PDSectionDto.java` — add constraints:
```java
@NotBlank(message = "Section heading must not be blank")
private String heading;

@Size(max = 10000, message = "Section body must not exceed 10000 characters")
private String body;
```

Resume upload — size and MIME type validation in `ResumeService.validateUpload()`:
```java
private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
private static final Set<String> ALLOWED_TYPES = Set.of(
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
);

public void validateUpload(MultipartFile file) {
    if (file.getSize() > MAX_FILE_SIZE) {
        throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE, "File size exceeds 10 MB limit");
    }
    if (!ALLOWED_TYPES.contains(file.getContentType())) {
        throw new ResponseStatusException(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "File type not supported");
    }
}
```

Note: `spring.servlet.multipart.max-file-size: 10MB` in application.yml (from w1-resume-upload-storage result.json) causes Spring to throw `MaxUploadSizeExceededException` for files over the limit. The `GlobalExceptionHandler` (w2-error-handling) handles this with a 413 response. The service-level check provides an earlier, cleaner error before the multipart is fully parsed.

**New test file:** `backend/src/test/java/gov/cms/hiring/ValidationTest.java`

Tests must cover (all use MockMvc with Testcontainers):
- `POST /api/positions` with `title="IT"` (2 chars) → 422 VALIDATION_ERROR
- `POST /api/positions` with `series="22XX"` → 422 VALIDATION_ERROR
- `POST /api/positions` with `grade="GS-999"` → 422 VALIDATION_ERROR
- `POST /api/positions` with `closeDate` = 2026-07-01, `postingDate` = 2026-07-15 (close before posting) → 422 VALIDATION_ERROR
- `POST /api/positions` with `closeDate == postingDate` = 2026-07-01 → 201 (valid boundary)
- `POST /api/pd-documents` with empty `sections: []` → 422 VALIDATION_ERROR
- `POST /api/pd-documents` with section body of 10001 chars → 422 VALIDATION_ERROR
- `POST /api/pd-documents` with section `heading` blank or missing → 422 VALIDATION_ERROR
- Resume upload with `.txt` file → 415 UNSUPPORTED_MEDIA_TYPE
- Resume upload with file > 10MB → 413 PAYLOAD_TOO_LARGE
- Valid position with all fields → 201 OK

**result.json hot_file_changes:**
```json
{
  "smoke_test_additions": "POST /api/positions {title:'IT'} → 422\nPOST /api/positions {series:'22XX'} → 422\nPOST /api/resumes/upload (large) → 413"
}
```

---

## Work Unit: w2-error-handling

### Global @ControllerAdvice with Standard JSON Error Envelope

**Motivation:** Without a consistent error format, the frontend must handle Spring's default validation error JSON, ResponseStatusException detail strings, and unhandled exception HTML pages differently. The error envelope standardizes all error responses so the frontend can always read `error.code`.

**Files to create:**

`backend/src/main/java/gov/cms/hiring/exception/NotFoundException.java`:
```java
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {
    public NotFoundException(String message) { super(message); }
    public NotFoundException() { super("Resource not found"); }
}
```

`backend/src/main/java/gov/cms/hiring/exception/ForbiddenException.java`:
```java
@ResponseStatus(HttpStatus.FORBIDDEN)
public class ForbiddenException extends RuntimeException {
    public ForbiddenException() { super("Forbidden"); }
}
```

`backend/src/main/java/gov/cms/hiring/exception/UnauthorizedException.java`:
```java
@ResponseStatus(HttpStatus.UNAUTHORIZED)
public class UnauthorizedException extends RuntimeException {
    public UnauthorizedException() { super("Unauthorized"); }
}
```

`backend/src/main/java/gov/cms/hiring/exception/GlobalExceptionHandler.java`:
```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    // Jakarta Validation failures (field constraint violations)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.UNPROCESSABLE_ENTITY)
    public Map<String, Object> handleValidation(MethodArgumentNotValidException ex) {
        List<Map<String, Object>> details = ex.getBindingResult().getFieldErrors().stream()
            .map(err -> Map.of(
                "field", err.getField(),
                "message", err.getDefaultMessage(),
                "rejectedValue", String.valueOf(err.getRejectedValue())
            ))
            .collect(Collectors.toList());
        return errorEnvelope("VALIDATION_ERROR", "Input validation failed", details);
    }

    // ResponseStatusException (from service layer — 404, 413, 415, etc.)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatus(ResponseStatusException ex) {
        String code = statusToCode(ex.getStatusCode().value());
        return ResponseEntity.status(ex.getStatusCode())
            .body(errorEnvelope(code, ex.getReason(), List.of()));
    }

    // MaxUploadSizeExceededException → 413
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    public Map<String, Object> handleLargeUpload(MaxUploadSizeExceededException ex) {
        return errorEnvelope("PAYLOAD_TOO_LARGE", "File size exceeds the maximum allowed limit", List.of());
    }

    // NotFoundException, ForbiddenException, UnauthorizedException
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public Map<String, Object> handleNotFound(NotFoundException ex) {
        return errorEnvelope("NOT_FOUND", ex.getMessage(), List.of());
    }

    @ExceptionHandler(ForbiddenException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, Object> handleForbidden(ForbiddenException ex) {
        return errorEnvelope("FORBIDDEN", ex.getMessage(), List.of());
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public Map<String, Object> handleUnauthorized(UnauthorizedException ex) {
        return errorEnvelope("UNAUTHORIZED", ex.getMessage(), List.of());
    }

    // Catch-all — log full trace server-side, return generic message to client
    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public Map<String, Object> handleGeneral(Exception ex) {
        // SECURITY: do NOT include exception message or stacktrace in response
        log.error("Unhandled exception", ex);
        return errorEnvelope("INTERNAL_ERROR", "An unexpected error occurred", List.of());
    }

    private Map<String, Object> errorEnvelope(String code, String message, List<?> details) {
        return Map.of("error", Map.of("code", code, "message", message, "details", details));
    }

    private String statusToCode(int status) {
        return switch (status) {
            case 400 -> "BAD_REQUEST";
            case 401 -> "UNAUTHORIZED";
            case 403 -> "FORBIDDEN";
            case 404 -> "NOT_FOUND";
            case 413 -> "PAYLOAD_TOO_LARGE";
            case 415 -> "UNSUPPORTED_MEDIA_TYPE";
            case 422 -> "VALIDATION_ERROR";
            default -> "HTTP_ERROR";
        };
    }
}
```

Update all existing service methods that currently throw `RuntimeException` or `ResponseStatusException(NOT_FOUND)` to throw `NotFoundException` instead.

`backend/src/test/java/gov/cms/hiring/ErrorHandlingTest.java`:
- GET unknown position UUID → 404 with `error.code == "NOT_FOUND"`
- POST position with bad series → 422 with `error.code == "VALIDATION_ERROR"` and `error.details` non-empty
- Every non-2xx response has `error.code` present and non-null
- Deliberately triggered 500 does NOT contain "Traceback", "stackTrace", or class names in response body

**result.json hot_file_changes:**
```json
{
  "application_yml_addition": null,
  "smoke_test_additions": "error response has error.code field present"
}
```

> **Note:** Multipart config (`spring.servlet.multipart.max-file-size: 10MB` and `max-request-size: 10MB`) was already applied by `w1-resume-upload-storage` — no `application.yml` change needed here.

