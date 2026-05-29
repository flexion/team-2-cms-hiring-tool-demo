#!/usr/bin/env bash
# =============================================================================
# preflight.sh — CMS Hiring POC Environment Validation
# Stack: Java 21 + Spring Boot + PostgreSQL 16 + AWS Bedrock
# Scope: LOCAL DEVELOPMENT ONLY
#
# Usage: bash plan/preflight.sh
# =============================================================================
set -euo pipefail

# ── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
BOLD='\033[1m'
RESET='\033[0m'

# ── Counters ─────────────────────────────────────────────────────────────────
PASS_COUNT=0
WARN_COUNT=0
FAIL_COUNT=0

# ── Helpers ──────────────────────────────────────────────────────────────────
pass() {
  echo -e "  ${GREEN}PASS${RESET}  $1"
  (( PASS_COUNT++ )) || true
}

warn() {
  echo -e "  ${YELLOW}WARN${RESET}  $1"
  (( WARN_COUNT++ )) || true
}

fail() {
  echo -e "  ${RED}FAIL${RESET}  $1"
  (( FAIL_COUNT++ )) || true
}

section() {
  echo ""
  echo -e "${BLUE}${BOLD}── $1 ──${RESET}"
}

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}CMS Hiring POC — Preflight Check${RESET}"
echo -e "Stack: Java 21 + Spring Boot + PostgreSQL 16 + AWS Bedrock"
echo -e "Running on: $(date)"
echo ""

# =============================================================================
# 1. REQUIRED TOOLS
# =============================================================================
section "Required Tools"

# Docker version >= 24
if command -v docker &>/dev/null; then
  DOCKER_VERSION=$(docker --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  DOCKER_MAJOR=$(echo "$DOCKER_VERSION" | cut -d. -f1)
  if [ "${DOCKER_MAJOR:-0}" -ge 24 ]; then
    pass "Docker $DOCKER_VERSION (>= 24 required)"
  else
    fail "Docker $DOCKER_VERSION found — version >= 24.0 required"
  fi
else
  fail "Docker not found — install from https://docs.docker.com/get-docker/"
fi

# Docker daemon running
if docker info &>/dev/null 2>&1; then
  pass "Docker daemon is running"
else
  fail "Docker daemon is not running — start Docker Desktop or 'sudo systemctl start docker'"
fi

# docker compose plugin
if docker compose version &>/dev/null 2>&1; then
  COMPOSE_VERSION=$(docker compose version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  pass "docker compose plugin v$COMPOSE_VERSION available"
else
  fail "docker compose plugin not found — install Docker Desktop >= 24 or the docker-compose-plugin package"
fi

# Java >= 21 (LTS baseline)
if command -v java &>/dev/null; then
  JAVA_VERSION_OUTPUT=$(java -version 2>&1 | head -1)
  JAVA_MAJOR=$(java -version 2>&1 | grep -oE '"[0-9]+' | head -1 | tr -d '"')
  if [ "${JAVA_MAJOR:-0}" -ge 21 ]; then
    pass "Java $JAVA_MAJOR (>= 21 required) — $JAVA_VERSION_OUTPUT"
  else
    fail "Java $JAVA_MAJOR found — Java 21+ required. Use SDKMAN: 'sdk install java 21-tem' or set JAVA_HOME"
  fi
else
  fail "Java not found — install Temurin 21: https://adoptium.net/ or 'sdk install java 21-tem'"
fi

# Gradle wrapper (preferred — checked when project is scaffolded)
SCRIPT_DIR_TOOL="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR_TOOL/../backend/gradlew" ]; then
  pass "Gradle wrapper (backend/gradlew) found — use ./gradlew for all build commands"
else
  warn "backend/gradlew not found — Phase 0a scaffold has not been created yet. The Gradle wrapper will be generated during p0a-backend-scaffold."
fi

# System Gradle (optional — wrapper is preferred; system Gradle used to generate the wrapper)
if command -v gradle &>/dev/null; then
  GRADLE_VERSION=$(gradle --version 2>/dev/null | grep '^Gradle' | grep -oE '[0-9]+\.[0-9]+(\.[0-9]+)?' | head -1)
  pass "System Gradle $GRADLE_VERSION installed (used to generate wrapper if needed)"
else
  warn "System Gradle not found — not required if backend/gradlew already exists. Install via SDKMAN: 'sdk install gradle' or https://gradle.org/install/"
fi

# Node.js >= 20
if command -v node &>/dev/null; then
  NODE_VERSION=$(node --version 2>/dev/null | sed 's/v//')
  NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1)
  if [ "${NODE_MAJOR:-0}" -ge 20 ]; then
    pass "Node.js v$NODE_VERSION (>= 20 required)"
  else
    fail "Node.js v$NODE_VERSION found — version >= 20 required. Use nvm: 'nvm install 20'"
  fi
else
  fail "Node.js not found — install from https://nodejs.org/ or via nvm"
fi

# Git
if command -v git &>/dev/null; then
  GIT_VERSION=$(git --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  pass "Git $GIT_VERSION"
else
  fail "Git not found — install from https://git-scm.com/"
fi

# Python 3 (required by local-verify.sh and smoke-test.sh for inline JSON parsing)
if command -v python3 &>/dev/null; then
  PYTHON3_VERSION=$(python3 --version 2>/dev/null | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  pass "Python 3 $PYTHON3_VERSION (required for JSON parsing in local-verify.sh and smoke-test.sh)"
else
  fail "python3 not found — required by local-verify.sh and smoke-test.sh for JSON parsing. Install: brew install python3 (macOS) or apt-get install python3 (Linux)"
fi

# =============================================================================
# 2. ENVIRONMENT FILE
# =============================================================================
section "Environment File"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/../.env" ]; then
  ENV_FILE="$SCRIPT_DIR/../.env"
elif [ -f "$SCRIPT_DIR/.env" ]; then
  ENV_FILE="$SCRIPT_DIR/.env"
elif [ -f ".env" ]; then
  ENV_FILE=".env"
else
  ENV_FILE=""
fi

if [ -n "$ENV_FILE" ] && [ -f "$ENV_FILE" ]; then
  pass ".env file found at $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
else
  fail ".env file not found — copy .env.example to .env and fill in values (POSTGRES_USER and POSTGRES_PASSWORD required)"
fi

# =============================================================================
# 3. REQUIRED ENV VARS
# =============================================================================
section "Required Environment Variables"

# DATABASE_URL or POSTGRES_* vars
if [ -n "${DATABASE_URL:-}" ]; then
  if echo "$DATABASE_URL" | grep -qE '^jdbc:postgresql://'; then
    pass "DATABASE_URL is set and starts with jdbc:postgresql://"
  else
    warn "DATABASE_URL is set but does not start with 'jdbc:postgresql://' — Spring Boot JDBC requires this prefix"
  fi
elif [ -n "${POSTGRES_USER:-}" ] && [ -n "${POSTGRES_PASSWORD:-}" ]; then
  pass "POSTGRES_USER and POSTGRES_PASSWORD are set — Spring Boot will use these with Docker Compose defaults"
else
  warn "Neither DATABASE_URL nor POSTGRES_USER/PASSWORD is set — Spring Boot will use defaults (cms/cms) which may not match your database"
fi

# =============================================================================
# 4. OPTIONAL ENV VARS (AWS)
# =============================================================================
section "Optional Environment Variables (AWS Bedrock — required for Wave 4)"

# AWS CLI installed
if command -v aws &>/dev/null; then
  AWS_CLI_VERSION=$(aws --version 2>/dev/null | grep -oE 'aws-cli/[0-9.]+' | head -1)
  pass "AWS CLI installed: $AWS_CLI_VERSION"
else
  warn "AWS CLI not found — required for Wave 4 Bedrock features. Install: https://aws.amazon.com/cli/"
fi

# AWS credentials configured
if command -v aws &>/dev/null; then
  if aws sts get-caller-identity --output text &>/dev/null 2>&1; then
    AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text 2>/dev/null || echo "unknown")
    pass "AWS credentials configured and valid (account: $AWS_ACCOUNT)"
  else
    warn "AWS credentials not configured or invalid — run 'aws configure' or set AWS_PROFILE. Wave 4 Bedrock features will not work without valid credentials."
  fi
fi

# AWS_REGION
if [ -n "${AWS_REGION:-}" ]; then
  pass "AWS_REGION is set: $AWS_REGION — live Bedrock calls will be made"
else
  warn "AWS_REGION is not set — the app starts with AI stub responses (no real Bedrock calls). Set AWS_REGION in .env to activate live Bedrock calls."
fi

# AWS_PROFILE
if [ -n "${AWS_PROFILE:-}" ]; then
  pass "AWS_PROFILE is set: $AWS_PROFILE"
else
  warn "AWS_PROFILE is not set — will use 'default' AWS credentials profile"
fi

# =============================================================================
# 5. PORT AVAILABILITY (8080, 3000, 5432)
# NOTE: Backend runs on 8080 (Spring Boot), NOT 8000
# =============================================================================
section "Port Availability (8080 backend, 3000 frontend, 5432 PostgreSQL)"

check_port() {
  local port=$1
  local service=$2
  if lsof -i ":$port" &>/dev/null 2>&1; then
    PROCESS=$(lsof -ti ":$port" 2>/dev/null | head -1)
    PROCESS_NAME=$(ps -p "${PROCESS:-0}" -o comm= 2>/dev/null || echo "unknown")
    fail "Port $port ($service) is already in use by PID $PROCESS ($PROCESS_NAME) — stop that process first"
  else
    pass "Port $port ($service) is free"
  fi
}

check_port 8080 "Spring Boot backend"
check_port 3000 "Vite frontend dev server"
check_port 5432 "PostgreSQL"

# =============================================================================
# 6. DOCKER IMAGES (WARN IF NOT CACHED)
# =============================================================================
section "Docker Image Cache (optional pre-pull)"

check_image() {
  local image=$1
  if docker image inspect "$image" &>/dev/null 2>&1; then
    pass "Docker image $image is cached locally"
  else
    warn "Docker image $image is not cached — will be pulled on first 'docker compose up' (may be slow on first run)"
  fi
}

check_image "postgres:16"
check_image "eclipse-temurin:21-jdk-alpine"
check_image "node:20-alpine"

# =============================================================================
# 7. POSTGRESQL CONNECTIVITY
# =============================================================================
section "PostgreSQL Connectivity"

# Extract DB connection details from available env vars
DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_USER="${POSTGRES_USER:-cms}"

if command -v pg_isready &>/dev/null; then
  if pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -q 2>/dev/null; then
    pass "PostgreSQL is accepting connections at $DB_HOST:$DB_PORT"
  else
    warn "PostgreSQL at $DB_HOST:$DB_PORT is not responding — start with 'docker compose up db' before running migrations"
  fi
else
  # Fallback: TCP check
  if timeout 3 bash -c "echo >/dev/tcp/$DB_HOST/$DB_PORT" &>/dev/null 2>&1; then
    pass "PostgreSQL port $DB_PORT is reachable at $DB_HOST (pg_isready not installed for deeper check)"
  else
    warn "PostgreSQL at $DB_HOST:$DB_PORT is not reachable — is the database running? Start with: docker compose up db"
  fi
fi

# =============================================================================
# 8. GRADLE PROJECT STRUCTURE
# =============================================================================
section "Gradle Project Structure"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR/.."

if [ -f "$PROJECT_ROOT/backend/build.gradle.kts" ]; then
  pass "backend/build.gradle.kts exists"
else
  warn "backend/build.gradle.kts not found — Phase 0a backend scaffold has not been created yet"
fi

if [ -f "$PROJECT_ROOT/backend/settings.gradle.kts" ]; then
  pass "backend/settings.gradle.kts exists"
else
  warn "backend/settings.gradle.kts not found — Phase 0a backend scaffold has not been created yet"
fi

if [ -f "$PROJECT_ROOT/frontend/package.json" ]; then
  pass "frontend/package.json exists"
else
  warn "frontend/package.json not found — Phase 0a frontend scaffold has not been created yet"
fi

if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
  pass "docker-compose.yml exists"
else
  warn "docker-compose.yml not found — Phase 0a docker-compose work unit has not been created yet"
fi

# Check Java source structure if build.gradle.kts exists
if [ -f "$PROJECT_ROOT/backend/build.gradle.kts" ]; then
  APP_JAVA="$PROJECT_ROOT/backend/src/main/java/gov/cms/hiring/Application.java"
  if [ -f "$APP_JAVA" ]; then
    pass "Application.java exists at expected path"
  else
    warn "Application.java not found at $APP_JAVA — backend scaffold may be incomplete"
  fi
fi

# =============================================================================
# 9. AWS BEDROCK MODEL AVAILABILITY (WAVE 4 ONLY)
# =============================================================================
section "AWS Bedrock Model Check (Wave 4 only — warns if not verified)"

if command -v aws &>/dev/null && aws sts get-caller-identity &>/dev/null 2>&1; then
  REGION="${AWS_REGION:-us-east-1}"
  CLAUDE_MODEL="anthropic.claude-3-5-sonnet-20241022-v2:0"

  # Check if the model is listed in the accessible models
  if aws bedrock list-foundation-models \
      --region "$REGION" \
      --by-provider anthropic \
      --query "modelSummaries[?modelId=='$CLAUDE_MODEL'].modelId" \
      --output text &>/dev/null 2>&1; then
    MODEL_CHECK=$(aws bedrock list-foundation-models \
      --region "$REGION" \
      --by-provider anthropic \
      --query "modelSummaries[?modelId=='$CLAUDE_MODEL'].modelId" \
      --output text 2>/dev/null || echo "")
    if [ -n "$MODEL_CHECK" ]; then
      pass "Claude model $CLAUDE_MODEL is accessible in region $REGION"
    else
      warn "Claude model $CLAUDE_MODEL not found in region $REGION — you may need to enable it via Bedrock console: https://console.aws.amazon.com/bedrock/home?#/modelaccess"
    fi
  else
    warn "Could not verify Bedrock model availability (may need bedrock:ListFoundationModels permission) — Wave 4 features require this model to be enabled"
  fi
else
  warn "Skipping Bedrock model check (AWS credentials not configured) — required for Wave 4"
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}Preflight Summary${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "  ${GREEN}PASS${RESET}  $PASS_COUNT checks"
echo -e "  ${YELLOW}WARN${RESET}  $WARN_COUNT checks"
echo -e "  ${RED}FAIL${RESET}  $FAIL_COUNT checks"
echo ""

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo -e "${RED}${BOLD}PREFLIGHT FAILED — $FAIL_COUNT check(s) must be resolved before starting.${RESET}"
  echo ""
  echo -e "Required fixes:"
  echo -e "  • Java 21: sdk install java 21-tem  (or use SDKMAN/ASDF)"
  echo -e "  • Gradle:  sdk install gradle  (only needed to generate wrapper; ./gradlew is preferred after scaffold)"
  echo -e "  • Docker:  Install Docker Desktop >= 24"
  echo -e "  • .env:    cp .env.example .env && fill in POSTGRES_USER, POSTGRES_PASSWORD"
  echo ""
  exit 1
elif [ "$WARN_COUNT" -gt 0 ]; then
  echo -e "${YELLOW}${BOLD}PREFLIGHT PASSED WITH WARNINGS — $WARN_COUNT optional item(s) to review.${RESET}"
  echo ""
  echo -e "Warnings do not block local development (Waves 0-2)."
  echo -e "AWS warnings must be resolved before starting Wave 4."
  echo ""
  exit 0
else
  echo -e "${GREEN}${BOLD}PREFLIGHT PASSED — environment is ready for all waves.${RESET}"
  echo ""
  exit 0
fi
