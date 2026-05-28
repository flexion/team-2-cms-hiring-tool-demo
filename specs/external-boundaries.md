# External Boundaries

## Boundaries

### LLM Service

**Purpose:** Provides AI-powered analysis for position description improvement suggestions and bidirectional resume-to-PD requirement mapping.

**Operations:**

| Operation | Data In (domain terms) | Data Out (domain terms) |
|-----------|----------------------|------------------------|
| Suggest PD edits | Current PD content (duties, specialized experience), federal PD writing context | List of suggestions, each with: target section, proposed text change, explanation of the federal rule it addresses |
| Map resume to requirements | PD requirements (duties and specialized experience criteria), resume content | Structured mapping: for each requirement, which resume passages relate to it and match strength; for each resume passage, which requirements it supports |

**Testing considerations:**

- Requires AWS credentials (access key, secret, session token, region) — development plumbing must work without credentials set (returns canned responses).
- Responses are non-deterministic — development plumbing should return canned, realistic responses for consistent testing.
- Can return errors (expired credentials, throttling, model access denied, context too long) — development plumbing should be able to simulate these failure modes.
- Real API calls may be slow (2-10 seconds depending on model) — development plumbing should be instant.
- No destructive side effects — safe to call repeatedly during development when credentials are available.
- The production adapter must show a clear "Configure LLM" message in the UI when AWS credentials are not configured (missing environment variables), rather than silently failing.

**Status:** EXISTS

**Production technology:** AWS Bedrock (Converse API). Authenticated via standard AWS credential chain — user sets `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, and `AWS_REGION` environment variables locally before running the app. No secrets are stored in the repository.

**Library:** @aws-sdk/client-bedrock-runtime

**Architecture note:** Because the AWS SDK requires server-side execution (credentials cannot be safely exposed in a browser bundle), the app includes a minimal local dev-server route (Vite server middleware) that proxies LLM calls to Bedrock. The frontend calls a local `/api/llm` endpoint; the server-side middleware handles Bedrock auth and request translation.
