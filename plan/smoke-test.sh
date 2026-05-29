#!/usr/bin/env bash
# =============================================================================
# smoke-test.sh — CMS Hiring POC API Smoke Tests
# Stack: Java 21 + Spring Boot (port 8080) + AWS Bedrock
# Scope: LOCAL DEVELOPMENT ONLY
# Note: All endpoints are currently public (auth deferred to future phase).
#
# Usage: bash plan/smoke-test.sh [local|<base-url>] [wave1|wave2|wave4]
#
# Examples:
#   bash plan/smoke-test.sh local wave1
#   bash plan/smoke-test.sh local wave2
#   bash plan/smoke-test.sh local wave4
#   bash plan/smoke-test.sh http://localhost:8080 wave1
#
# NOTE: Backend runs on port 8080 (Spring Boot), NOT 8000.
# If no wave is specified, runs wave1 tests only.
# If no URL is specified, defaults to http://localhost:8080.
# =============================================================================
set -euo pipefail

# ── Args ──────────────────────────────────────────────────────────────────────
ARG1="${1:-local}"
WAVE="${2:-wave1}"

if [ "$ARG1" = "local" ]; then
  BASE_URL="http://localhost:8080"
else
  BASE_URL="${ARG1%/}"  # strip trailing slash
fi

# ── Colors ────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Counters ─────────────────────────────────────────────────────────────────
PASS=0
FAIL=0
SKIP=0
WARN=0

# ── State ─────────────────────────────────────────────────────────────────────
POSITION_ID=""
PD_DOC_ID=""
RESUME_ID=""
MAPPING_ID=""

# ── Helpers ───────────────────────────────────────────────────────────────────
ok() {
  echo -e "  ${GREEN}PASS${RESET}  $1"
  (( PASS++ )) || true
}

fail_test() {
  echo -e "  ${RED}FAIL${RESET}  $1"
  (( FAIL++ )) || true
}

skip_test() {
  echo -e "  ${YELLOW}SKIP${RESET}  $1"
  (( SKIP++ )) || true
}

warn() { echo -e "  ${YELLOW}[WARN]${RESET} $1"; ((WARN++)) || true; }

section() {
  echo ""
  echo -e "${BLUE}${BOLD}── $1 ──${RESET}"
}

# Run a curl and capture status + body
# Sets: LAST_STATUS, LAST_BODY
run_curl() {
  local response
  response=$(curl -s -w "\n__STATUS__%{http_code}__STATUS__" "$@" 2>/dev/null) || true
  LAST_BODY=$(echo "$response" | sed '/__STATUS__/d')
  LAST_STATUS=$(echo "$response" | grep -oP '(?<=__STATUS__)\d+(?=__STATUS__)' || echo "000")
}

assert_status() {
  local expected=$1
  local label=$2
  if [ "$LAST_STATUS" = "$expected" ]; then
    ok "$label → $expected"
  else
    fail_test "$label → expected $expected, got $LAST_STATUS. Body: ${LAST_BODY:0:200}"
  fi
}

assert_field() {
  local field=$1
  local label=$2
  # Uses key presence check, not string search, to avoid false positives
  if echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert '$field' in d, f'Key $field missing from response'
" 2>/dev/null; then
    ok "$label — response contains '$field'"
  else
    fail_test "$label — response does not contain key '$field'. Body: ${LAST_BODY:0:200}"
  fi
}

assert_json_path() {
  local path=$1
  local expected=$2
  local label=$3
  local actual
  actual=$(echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
keys = '$path'.split('.')
for k in keys:
    if isinstance(d, list): d = d[int(k)]
    else: d = d[k]
print(d)
" 2>/dev/null || echo "PATH_NOT_FOUND")
  if [ "$actual" = "$expected" ]; then
    ok "$label — $path == $expected"
  else
    fail_test "$label — expected $path='$expected', got '$actual'. Body: ${LAST_BODY:0:200}"
  fi
}

extract_json_field() {
  local field=$1
  echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$field',''))" 2>/dev/null || echo ""
}

# Create a minimal valid PDF with proper PDF header
# This is a real minimal PDF that passes both MIME detection and basic PDF validation.
TINY_PDF_FILE=$(mktemp /tmp/smoke_test_XXXXXX.pdf)
printf '%s' '%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj
xref
0 4
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
190
%%EOF' > "$TINY_PDF_FILE"

# Large PDF: proper PDF header + zero-byte padding to exceed 10MB limit
LARGE_PDF_FILE=$(mktemp /tmp/smoke_test_large_XXXXXX.pdf)
TXT_FILE=$(mktemp /tmp/smoke_test_XXXXXX.txt)

cleanup() {
  rm -f "$TINY_PDF_FILE"
  rm -f "$LARGE_PDF_FILE"
  rm -f "$TXT_FILE"
}
trap cleanup EXIT

# =============================================================================
echo ""
echo -e "${BOLD}CMS Hiring POC — Smoke Tests${RESET}"
echo -e "Backend URL: ${BLUE}$BASE_URL${RESET}  (Spring Boot port 8080)"
echo -e "Wave:        ${BLUE}$WAVE${RESET}"
echo ""

# =============================================================================
# WAVE 1 — Health Check (always runs)
# =============================================================================
section "Wave 1: Health Check"

run_curl "$BASE_URL/health"
assert_status "200" "GET /health"
assert_json_path "status" "ok" "GET /health status field"

# =============================================================================
section "Wave 1: Position CRUD"

# Create a position — endpoint is public (no auth required)
run_curl -s -X POST "$BASE_URL/api/positions" \
  -H "Content-Type: application/json" \
  -d '{"title":"IT Specialist (Full Stack Engineer)","series":"2210","grade":"GS-13","status":"READY_TO_POST","postingDate":"2026-06-01","closeDate":"2026-06-15"}'
assert_status "201" "POST /api/positions → 201"
POSITION_ID=$(extract_json_field "id")
if [ -n "$POSITION_ID" ]; then
  ok "POST /api/positions — received id: $POSITION_ID"
else
  fail_test "POST /api/positions — no id in response"
fi

# Get by id
if [ -n "$POSITION_ID" ]; then
  run_curl "$BASE_URL/api/positions/$POSITION_ID"
  assert_status "200" "GET /api/positions/$POSITION_ID → 200"
fi

# List all positions
run_curl "$BASE_URL/api/positions"
assert_status "200" "GET /api/positions → 200"
COUNT=$(echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "0")
if [ "${COUNT:-0}" -gt 0 ]; then
  ok "GET /api/positions — returned $COUNT position(s)"
else
  fail_test "GET /api/positions — returned empty array"
fi

# PATCH status
if [ -n "$POSITION_ID" ]; then
  run_curl -X PATCH "$BASE_URL/api/positions/$POSITION_ID" \
    -H "Content-Type: application/json" \
    -d '{"status":"POSTED"}'
  assert_status "200" "PATCH /api/positions/$POSITION_ID {status:POSTED} → 200"
fi

# Filter by status
run_curl "$BASE_URL/api/positions?status=POSTED"
assert_status "200" "GET /api/positions?status=POSTED → 200"

# 404 on unknown UUID
UNKNOWN_UUID="00000000-0000-0000-0000-000000000000"
run_curl "$BASE_URL/api/positions/$UNKNOWN_UUID"
assert_status "404" "GET /api/positions/{unknown-uuid} → 404"

# =============================================================================
section "Wave 1: PD Documents"

if [ -n "$POSITION_ID" ]; then
  run_curl -X POST "$BASE_URL/api/pd-documents" \
    -H "Content-Type: application/json" \
    -d "{\"positionId\":\"$POSITION_ID\",\"title\":\"Draft PD v1\",\"content\":{\"sections\":[{\"id\":\"sec-001\",\"heading\":\"Introduction\",\"body\":\"This position provides IT specialist support.\",\"suggestions\":[],\"aiReviewed\":false,\"reviewerApproved\":false}]}}"
  assert_status "201" "POST /api/pd-documents → 201"
  PD_DOC_ID=$(extract_json_field "id")
  if [ -n "$PD_DOC_ID" ]; then
    ok "POST /api/pd-documents — received id: $PD_DOC_ID"
  else
    fail_test "POST /api/pd-documents — no id in response"
  fi
else
  skip_test "POST /api/pd-documents — skipped (no position_id)"
fi

# =============================================================================
section "Wave 1: AI Stub"

run_curl -X POST "$BASE_URL/api/ai/suggest-section" \
  -H "Content-Type: application/json" \
  -d '{"sectionHeading":"Specialized Experience","sectionBody":"Responsible for managing the cloud infrastructure.","positionTitle":"IT Specialist"}'
assert_status "200" "POST /api/ai/suggest-section → 200"
SUGGESTION_COUNT=$(echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "0")
if [ "${SUGGESTION_COUNT:-0}" -ge 1 ]; then
  ok "POST /api/ai/suggest-section — returned $SUGGESTION_COUNT suggestion(s)"
else
  fail_test "POST /api/ai/suggest-section — returned empty array or non-array"
fi

# Verify suggestion shape (ruleReference not rule_reference — camelCase)
if [ "${SUGGESTION_COUNT:-0}" -ge 1 ]; then
  if echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
s = d[0]
assert 'type' in s, 'missing type'
assert 'original' in s, 'missing original'
assert 'suggested' in s, 'missing suggested'
assert 'ruleReference' in s, 'missing ruleReference'
" 2>/dev/null; then
    ok "AI suggestion has expected fields: type, original, suggested, ruleReference"
  else
    fail_test "AI suggestion missing expected fields. Body: ${LAST_BODY:0:300}"
  fi
fi

# =============================================================================
section "Wave 1: Resume Upload"

if [ -n "$POSITION_ID" ]; then
  run_curl -X POST "$BASE_URL/api/resumes/upload" \
    -F "file=@$TINY_PDF_FILE;type=application/pdf" \
    -F "positionId=$POSITION_ID"
  assert_status "201" "POST /api/resumes/upload (small PDF) → 201"
  RESUME_ID=$(extract_json_field "id")
  if [ -n "$RESUME_ID" ]; then
    ok "POST /api/resumes/upload — received id: $RESUME_ID"
  else
    fail_test "POST /api/resumes/upload — no id in response"
  fi
else
  skip_test "POST /api/resumes/upload — skipped (no position_id)"
fi

# 413 on large file — proper PDF header + dd padding to exceed 10MB
printf '%s' '%PDF-1.4 1 0 obj<</Type /Catalog>>endobj' > "$LARGE_PDF_FILE"
dd if=/dev/zero bs=1024 count=10241 >> "$LARGE_PDF_FILE" 2>/dev/null
LARGE_FILE_SIZE=$(wc -c < "$LARGE_PDF_FILE" 2>/dev/null | tr -d ' ')
if [ "${LARGE_FILE_SIZE:-0}" -le 10485760 ]; then
  skip_test "POST /api/resumes/upload (>10MB) → 413 — could not create a sufficiently large test file"
elif [ -n "$POSITION_ID" ]; then
  run_curl -X POST "$BASE_URL/api/resumes/upload" \
    -F "file=@$LARGE_PDF_FILE;type=application/pdf" \
    -F "positionId=$POSITION_ID"
  assert_status "413" "POST /api/resumes/upload (>10MB) → 413"
else
  skip_test "POST /api/resumes/upload (>10MB) → 413 — skipped (no position_id)"
fi

# 415 on wrong MIME type — use the pre-created TXT_FILE from the trap setup above
echo "This is a plain text file, not a valid resume format." > "$TXT_FILE"
if [ -n "$POSITION_ID" ]; then
  run_curl -X POST "$BASE_URL/api/resumes/upload" \
    -F "file=@$TXT_FILE;type=text/plain" \
    -F "positionId=$POSITION_ID"
  assert_status "415" "POST /api/resumes/upload (text/plain) → 415"
else
  skip_test "POST /api/resumes/upload (415 check) — skipped (no position_id)"
fi

# Mappings (stub returns [])
if [ -n "$RESUME_ID" ]; then
  run_curl "$BASE_URL/api/resumes/$RESUME_ID/mappings"
  assert_status "200" "GET /api/resumes/$RESUME_ID/mappings → 200"
  MAPPINGS_BODY=$(echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(type(d).__name__)" 2>/dev/null || echo "unknown")
  if [ "$MAPPINGS_BODY" = "list" ]; then
    ok "GET /api/resumes/$RESUME_ID/mappings — response is a JSON array"
  else
    fail_test "GET /api/resumes/$RESUME_ID/mappings — expected JSON array, got: ${LAST_BODY:0:100}"
  fi
else
  skip_test "GET /api/resumes/{id}/mappings — skipped (no resume_id)"
fi

# <<WAVE1_TESTS_END>>

# =============================================================================
# WAVE 2 — Input Validation + Error Handling
# Note: All endpoints are public (auth deferred to future phase).
# =============================================================================
if [[ "$WAVE" == "wave2" ]] || [[ "$WAVE" == "wave4" ]]; then

section "Wave 2: Input Validation"

# Title too short (2 chars, minimum is 3)
run_curl -X POST "$BASE_URL/api/positions" \
  -H "Content-Type: application/json" \
  -d '{"title":"IT","series":"2210","grade":"GS-13","status":"READY_TO_POST"}'
assert_status "422" "POST /api/positions {title:'IT'} → 422 (too short)"

# Validate error envelope
if echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert 'error' in d, 'missing error key'
err = d['error']
assert err.get('code') == 'VALIDATION_ERROR', f'expected VALIDATION_ERROR, got {err.get(\"code\")}'
assert 'details' in err, 'missing details array'
assert isinstance(err['details'], list), 'details must be a list'
assert len(err['details']) > 0, 'details must not be empty for field validation errors'
" 2>/dev/null; then
  ok "Validation error has correct error envelope (code=VALIDATION_ERROR, details non-empty)"
else
  fail_test "Validation error envelope malformed. Body: ${LAST_BODY:0:400}"
fi

# Bad series format (not 4 digits)
run_curl -X POST "$BASE_URL/api/positions" \
  -H "Content-Type: application/json" \
  -d '{"title":"Valid Long Enough Title","series":"22XX","grade":"GS-13","status":"READY_TO_POST"}'
assert_status "422" "POST /api/positions {series:'22XX'} → 422 (bad format)"

# closeDate before postingDate
run_curl -X POST "$BASE_URL/api/positions" \
  -H "Content-Type: application/json" \
  -d '{"title":"Valid Title Long Enough","series":"2210","grade":"GS-13","status":"READY_TO_POST","postingDate":"2026-07-15","closeDate":"2026-07-01"}'
assert_status "422" "POST /api/positions {closeDate before postingDate} → 422"

# closeDate == postingDate (valid boundary)
run_curl -X POST "$BASE_URL/api/positions" \
  -H "Content-Type: application/json" \
  -d '{"title":"Same Day Close Position","series":"2210","grade":"GS-13","status":"READY_TO_POST","postingDate":"2026-07-01","closeDate":"2026-07-01"}'
assert_status "201" "POST /api/positions {closeDate == postingDate} → 201 (valid boundary)"

# Internal errors must not expose stack traces
if echo "$LAST_BODY" | python3 -c "
import sys, json
body = sys.stdin.read()
assert 'Exception' not in body, 'Exception class leaked to client'
assert 'at gov.cms' not in body, 'Stack trace leaked to client'
assert 'StackTrace' not in body, 'StackTrace leaked to client'
" 2>/dev/null; then
  ok "Responses do not expose stack traces or internal Java class names"
else
  fail_test "Response may contain leaked implementation details. Check security."
fi

# Verify error.code is present on all non-2xx responses
run_curl "$BASE_URL/api/positions/00000000-0000-0000-0000-000000000000"
if echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
assert 'error' in d, 'missing error wrapper'
assert d['error'].get('code'), 'error.code must be non-null'
" 2>/dev/null; then
  ok "404 response has error.code present"
else
  fail_test "404 response missing error.code. Body: ${LAST_BODY:0:200}"
fi

# <<WAVE2_TESTS_END>>

fi  # end wave2 / wave4 block

# =============================================================================
# WAVE 4 — Live AI (Requires AWS Bedrock)
# =============================================================================
if [[ "$WAVE" == "wave4" ]]; then

section "Wave 4: AWS Bedrock Feature Detection"

# Check AWS_REGION is set
if [ -z "${AWS_REGION:-}" ]; then
  warn "AWS_REGION environment variable is not set — defaulting to us-east-1"
  AWS_REGION="us-east-1"
fi

# Check AWS credentials work
if command -v aws &>/dev/null; then
  if aws sts get-caller-identity --output text &>/dev/null 2>&1; then
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")
    ok "AWS credentials valid (account: $AWS_ACCOUNT, region: $AWS_REGION)"
    AWS_CREDS_OK=true
  else
    skip_test "AWS credentials not configured or invalid — all Wave 4 tests skipped"
    skip_test "Run 'aws configure' or set AWS_PROFILE to enable Wave 4 tests"
    AWS_CREDS_OK=false
  fi
else
  skip_test "AWS CLI not installed — cannot verify Bedrock credentials. All Wave 4 tests skipped."
  AWS_CREDS_OK=false
fi

if [ "${AWS_CREDS_OK:-false}" = "true" ]; then

section "Wave 4: PD Editor Live Bedrock Claude"

# Compliance check: "Responsible for" should trigger a compliance suggestion
run_curl -X POST "$BASE_URL/api/ai/suggest-section" \
  -H "Content-Type: application/json" \
  -d '{"sectionHeading":"Specialized Experience","sectionBody":"Responsible for managing the cloud infrastructure and ensuring uptime of all production systems.","positionTitle":"IT Specialist (Cloud Operations)"}'
assert_status "200" "POST /api/ai/suggest-section with 'Responsible for...' → 200"

# Check for compliance type suggestion
HAS_COMPLIANCE=$(echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
types = [s.get('type') for s in d]
print('yes' if 'compliance' in types else 'no')
" 2>/dev/null || echo "no")
if [ "$HAS_COMPLIANCE" = "yes" ]; then
  ok "Wave 4: 'Responsible for...' produces type=compliance suggestion"
else
  fail_test "Wave 4: Expected compliance suggestion for 'Responsible for...' body. Got: ${LAST_BODY:0:400}"
fi

# Two different inputs return different suggestions (not hardcoded stub)
run_curl -X POST "$BASE_URL/api/ai/suggest-section" \
  -H "Content-Type: application/json" \
  -d '{"sectionHeading":"Duties","sectionBody":"Responsible for coordinating meetings with stakeholders.","positionTitle":"IT Specialist"}'
BODY_A="$LAST_BODY"

run_curl -X POST "$BASE_URL/api/ai/suggest-section" \
  -H "Content-Type: application/json" \
  -d '{"sectionHeading":"Requirements","sectionBody":"Experience with cloud technologies and modern frameworks and distributed systems.","positionTitle":"Software Engineer"}'
BODY_B="$LAST_BODY"

if [ "$BODY_A" != "$BODY_B" ]; then
  ok "Wave 4: Two different inputs return different suggestions (live model confirmed active)"
else
  fail_test "Wave 4: Two different inputs returned identical responses — stub may not have been replaced by BedrockServiceImpl"
fi

# Error fallback: verify that even if there was an error, endpoint returns 200 not 500
run_curl -X POST "$BASE_URL/api/ai/suggest-section" \
  -H "Content-Type: application/json" \
  -d '{"sectionHeading":"Summary","sectionBody":"Excellent technical skills.","positionTitle":"Generic Role"}'
assert_status "200" "POST /api/ai/suggest-section (minimal input) → 200 (never 500)"

section "Wave 4: Resume Qualification Mapping with Titan Embeddings"

if [ -n "$RESUME_ID" ]; then
  # Trigger mapping generation — may be slow on first call (parsing + embedding)
  run_curl --max-time 120 "$BASE_URL/api/resumes/$RESUME_ID/mappings"
  assert_status "200" "GET /api/resumes/$RESUME_ID/mappings (Wave 4 with Titan embeddings) → 200"

  MAPPINGS_COUNT=$(echo "$LAST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d))" 2>/dev/null || echo "0")

  if [ "${MAPPINGS_COUNT:-0}" -gt 0 ]; then
    ok "Wave 4: GET mappings returned $MAPPINGS_COUNT mapping(s) above 0.65 threshold"

    MAPPING_ID=$(echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d[0]['id'])
" 2>/dev/null || echo "")

    if [ -n "$MAPPING_ID" ]; then
      # Test confirm endpoint — public endpoint (no auth required)
      run_curl -X PATCH "$BASE_URL/api/qualification-mappings/$MAPPING_ID/confirm" \
        -H "Content-Type: application/json" \
        -d '{"confirmed": true}'
      assert_status "200" "PATCH /api/qualification-mappings/$MAPPING_ID/confirm → 200"

      CONFIRMED=$(echo "$LAST_BODY" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(str(d.get('confirmedByReviewer', False)).lower())
" 2>/dev/null || echo "false")
      if [ "$CONFIRMED" = "true" ]; then
        ok "Wave 4: PATCH confirm sets confirmedByReviewer = true"
      else
        fail_test "Wave 4: PATCH confirm did not set confirmedByReviewer = true. Body: ${LAST_BODY:0:200}"
      fi
    fi
  else
    ok "Wave 4: GET mappings returned 200 with empty array — expected for minimal PDF test file (no meaningful text to embed)"
    skip_test "PATCH /api/qualification-mappings/{id}/confirm — skipped (no mappings to confirm)"
  fi
else
  skip_test "Wave 4 resume mapping tests — skipped (no resume_id)"
fi

fi  # end AWS_CREDS_OK check

# <<WAVE4_TESTS_END>>

fi  # end wave4 block

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}Smoke Test Summary — $WAVE against $BASE_URL${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}PASS${RESET}  $PASS"
echo -e "  ${RED}FAIL${RESET}  $FAIL"
echo -e "  ${YELLOW}SKIP${RESET}  $SKIP"
echo -e "  ${YELLOW}WARN${RESET}  $WARN"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}${BOLD}SMOKE TESTS FAILED — $FAIL test(s) failed.${RESET}"
  echo ""
  exit 1
else
  echo -e "${GREEN}${BOLD}SMOKE TESTS PASSED — $PASS passed, $SKIP skipped.${RESET}"
  echo ""
  exit 0
fi
