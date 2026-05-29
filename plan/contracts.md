# API Contracts — JSON Fixture Reference

This file contains canonical JSON fixtures for every shared type in the CMS Hiring POC. Each type has three examples: a valid complete instance, an invalid instance (with explanation of why it fails), and an edge case instance that exercises a boundary condition. These fixtures are used in tests and as a shared reference for frontend/backend type alignment.

**Field naming convention:** All JSON fields use camelCase to match both the Java DTO fields and TypeScript interface fields. Java entity column names use snake_case in the database, but all API responses and request bodies use camelCase throughout.

> **Authentication deferred:** The `User` and `AuthToken` types are authentication concerns and are deferred to a future auth phase. This plan covers 7 types: Position, PDDocumentContent, PDSection, AISuggestion, ResumeUpload, QualificationMapping, APIError.

---

## Position

**Schema summary:** id (UUID string), title (3-200 chars), series (4 digits), grade (GS-N or GS-NN), status (enum), postingDate (date or null), closeDate (date >= postingDate or null), createdAt, updatedAt.

### Valid — complete position record

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

### Invalid — title too short

```json
{
  "title": "IT",
  "series": "2210",
  "grade": "GS-13",
  "status": "READY_TO_POST"
}
```

Fails because: `title` has 2 characters; minimum is 3. Expected response: `422 VALIDATION_ERROR` with `details[0].field == "title"`.

### Edge case — closeDate equals postingDate (valid)

```json
{
  "title": "IT Specialist (Cloud Operations)",
  "series": "2210",
  "grade": "GS-14",
  "status": "READY_TO_POST",
  "postingDate": "2026-07-01",
  "closeDate": "2026-07-01"
}
```

Boundary condition: `closeDate == postingDate` is explicitly valid (same-day close). Expected response: `201`. This is a common scenario for positions that are posted and immediately close to re-direct to a standing register.

---

## PDDocumentContent

**Schema summary:** sections array (minimum 1 item), each item is a PDSection.

### Valid — two sections

```json
{
  "sections": [
    {
      "id": "sec-001",
      "heading": "Introduction",
      "body": "This position serves as an IT Specialist within CMS OIT, providing full-stack development expertise for mission-critical healthcare data systems.",
      "suggestions": [],
      "aiReviewed": false,
      "reviewerApproved": false
    },
    {
      "id": "sec-002",
      "heading": "Specialized Experience",
      "body": "At least one (1) year of specialized experience equivalent to the GS-12 level in the Federal service designing and deploying cloud-native applications on AWS, including containerization via ECS or EKS.",
      "suggestions": [
        {
          "type": "compliance",
          "original": "deploying cloud-native applications",
          "suggested": "designing, developing, and deploying cloud-native applications",
          "ruleReference": "OHC-PD-001"
        }
      ],
      "aiReviewed": true,
      "reviewerApproved": false
    }
  ]
}
```

### Invalid — empty sections array

```json
{
  "sections": []
}
```

Fails because: `sections` must have at least 1 item. Expected response: `422 VALIDATION_ERROR` with `details` citing the `sections` field.

### Edge case — section body at exactly 10000 characters

```json
{
  "sections": [
    {
      "id": "sec-max",
      "heading": "Duties",
      "body": "AAAAAAAAAA ... (10000 'A' characters total)",
      "suggestions": [],
      "aiReviewed": false,
      "reviewerApproved": false
    }
  ]
}
```

Boundary condition: body length == 10000 is valid (max allowed). A body of 10001 characters must return `422`. Test both sides of this boundary.

---

## PDSection

**Schema summary:** id (string, client-generated), heading (string), body (max 10000 chars), suggestions (AISuggestion array), aiReviewed (bool), reviewerApproved (bool).

### Valid — section with suggestions

```json
{
  "id": "sec-003",
  "heading": "Knowledge, Skills, and Abilities",
  "body": "Demonstrated ability to architect distributed systems using microservices patterns, event-driven messaging (Kafka, SQS), and RESTful API design.",
  "suggestions": [
    {
      "type": "specificity",
      "original": "architect distributed systems",
      "suggested": "architect and implement distributed systems with demonstrated production deployments",
      "ruleReference": "OHC-PD-005"
    }
  ],
  "aiReviewed": true,
  "reviewerApproved": true
}
```

### Invalid — missing heading

```json
{
  "id": "sec-004",
  "body": "Some duty text here.",
  "suggestions": [],
  "aiReviewed": false,
  "reviewerApproved": false
}
```

Fails because: `heading` is a required field. Expected response: `422 VALIDATION_ERROR`.

### Edge case — empty suggestions array with aiReviewed true (valid)

```json
{
  "id": "sec-005",
  "heading": "Supervisory Status",
  "body": "This position has no supervisory responsibilities.",
  "suggestions": [],
  "aiReviewed": true,
  "reviewerApproved": true
}
```

Edge: `aiReviewed: true` with empty `suggestions` is valid — it means Claude reviewed the section and found no issues. Both `reviewerApproved` and `aiReviewed` can be true simultaneously.

---

## AISuggestion

**Schema summary:** type (compliance|clarity|specificity), original (string), suggested (string), ruleReference (string).

### Valid — compliance type

```json
{
  "type": "compliance",
  "original": "Responsible for managing the cloud infrastructure and ensuring uptime.",
  "suggested": "Manages cloud infrastructure and maintains system availability, including monitoring, incident response, and capacity planning.",
  "ruleReference": "OHC-PD-001"
}
```

### Invalid — unknown type field

```json
{
  "type": "grammar",
  "original": "Some text.",
  "suggested": "Better text.",
  "ruleReference": "OHC-PD-001"
}
```

Fails because: `type` must be one of `compliance`, `clarity`, `specificity`. `grammar` is not a valid enum value. Expected: `422 VALIDATION_ERROR` when this object is nested in a PDSection being saved.

### Edge case — all three types in a single section's suggestion list

This is not a single object but a valid array containing one of each type, to confirm the frontend renders all three suggestion pill variants:

```json
[
  {
    "type": "compliance",
    "original": "Responsible for coordinating with stakeholders.",
    "suggested": "Coordinates directly with program stakeholders to gather requirements and deliver solutions.",
    "ruleReference": "OHC-PD-001"
  },
  {
    "type": "clarity",
    "original": "May assist with data pipeline development.",
    "suggested": "Develops and maintains ETL data pipelines using Apache Airflow and dbt.",
    "ruleReference": "OHC-PD-004"
  },
  {
    "type": "specificity",
    "original": "Experience with cloud technologies.",
    "suggested": "At least one (1) year of experience deploying production workloads on AWS, including EC2, RDS, Lambda, and CloudFormation.",
    "ruleReference": "OHC-PD-005"
  }
]
```

---

## ResumeUpload

**Schema summary (response after upload):** id (UUID), positionId (UUID), filename (string), uploadDate (datetime), parsedText (null until Wave 4), status (UPLOADED|PARSED|MAPPED).

### Valid — PDF upload response

```json
{
  "id": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
  "positionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "filename": "jane_smith_resume.pdf",
  "uploadDate": "2026-05-28T14:30:00",
  "parsedText": null,
  "status": "UPLOADED"
}
```

### Invalid — file too large (request fixture, not response)

```
POST /api/resumes/upload
Content-Type: multipart/form-data
(file > 10 MB body)
```

Fails because: file size exceeds 10 MB (10,485,760 bytes). Expected response: `413 PAYLOAD_TOO_LARGE` with `error.code == "PAYLOAD_TOO_LARGE"`.

### Edge case — DOCX file (valid, not PDF)

```json
{
  "id": "c2d3e4f5-a6b7-8901-2345-678901bcdef0",
  "positionId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "filename": "john_doe_cv.docx",
  "uploadDate": "2026-05-28T15:00:00",
  "parsedText": null,
  "status": "UPLOADED"
}
```

Edge: DOCX files are equally valid as PDFs. The frontend dropzone accepts both. MIME type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`. A plain `.doc` file (old binary format) is NOT accepted and must return 415.

---

## QualificationMapping

**Schema summary:** id (UUID), resumeId (UUID), requirementText (string), matchedText (string), confidence (double 0.0-1.0), confirmedByReviewer (bool).

### Valid — confirmed mapping

```json
{
  "id": "d4e5f6a7-b8c9-0123-4567-89abcdef0123",
  "resumeId": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
  "requirementText": "Specialized Experience: At least one (1) year of specialized experience deploying applications on AWS including EC2 and ECS.",
  "matchedText": "Led migration of legacy monolith to containerized microservices on AWS ECS, reducing deployment time by 40%. Managed IAM policies, VPC configuration, and CloudWatch alerting across 3 production environments.",
  "confidence": 0.8823,
  "confirmedByReviewer": true
}
```

### Invalid — confirmed must not be null (PATCH /confirm request)

```json
{
  "_comment": "Invalid — confirmed must not be null",
  "confirmed": null
}
```

This is a `PATCH /api/qualification-mappings/{id}/confirm` request body. Fails because: `ConfirmMappingRequest.confirmed` is annotated `@NotNull Boolean` — sending `null` violates this constraint. Expected response: `422 VALIDATION_ERROR` with `details[0].field == "confirmed"`.

Note: The `PATCH /confirm` endpoint only accepts `{confirmed: true}` or `{confirmed: false}`. It does not accept a full `QualificationMapping` body — the confidence value is set internally by the embedding service and is not a client-settable field.

### Edge case — confidence exactly at threshold (0.65)

```json
{
  "id": "f6a7b8c9-d0e1-2345-6789-abcdef012345",
  "resumeId": "f1e2d3c4-b5a6-7890-1234-567890abcdef",
  "requirementText": "Knowledge of agile software development methodologies.",
  "matchedText": "Participated in two-week sprint cycles using Jira for backlog management and Confluence for documentation. Attended daily standups and sprint retrospectives.",
  "confidence": 0.6500,
  "confirmedByReviewer": false
}
```

Edge: `confidence == 0.65` is exactly at the threshold. The mapper must include this mapping (not exclude it). A confidence of `0.6499` would be excluded. Test both sides of this boundary in `EmbeddingServiceTest`.

---

## APIError

**Schema summary:** `{"error": {"code": string, "message": string, "details": array}}`. The `error` wrapper is always present. `code` is always an uppercase SNAKE_CASE string. `details` is an array (empty if no per-field details).

### Valid — validation error with details

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Input validation failed",
    "details": [
      {
        "field": "title",
        "message": "size must be between 3 and 200",
        "rejectedValue": "IT"
      },
      {
        "field": "series",
        "message": "Series must be exactly 4 digits",
        "rejectedValue": "22XX"
      }
    ]
  }
}
```

### Invalid — missing code field

```json
{
  "error": {
    "message": "Something went wrong",
    "details": []
  }
}
```

Fails because: `code` is a required field in the error envelope. Any error response without `code` is a bug. The frontend relies on `error.code` to determine handling (401 triggers logout flow, 422 shows inline field errors, 500 shows a generic banner). Tests must assert `error.code` is present and non-null in every non-2xx response.

### Edge case — 500 internal error (details always empty, no stack trace)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "details": []
  }
}
```

Edge: Internal errors must NEVER include stack traces, exception types, class names, or internal file paths in the `details` array or `message` field. The full exception is logged server-side only via SLF4J. Tests must verify that a deliberately triggered 500 response body does not contain "Exception", "at gov.cms", or "StackTrace".
