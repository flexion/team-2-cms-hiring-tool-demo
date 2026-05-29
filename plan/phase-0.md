# Phase 0 — Bootable Skeleton + Local Stack Validation

Phase 0 has two sub-phases. Phase 0a produces a locally-runnable skeleton that all future waves build on. Phase 0b validates that skeleton running in Docker Compose with all three services healthy and the Vite dev proxy working correctly.

**This is a LOCAL DEVELOPMENT ONLY project.** There is no Railway deployment, no cloud target, and no CI/CD pipeline. Phase 0b is a local stack validation step, not a cloud deploy step.

**Exit criteria for Phase 0a:** `./gradlew bootRun` starts cleanly (outside Docker), and `curl http://localhost:8080/health` returns `{"status":"ok","version":"0.1.0"}`.

**Exit criteria for Phase 0b:** `docker compose up -d` starts all three containers, all pass their health checks, `curl http://localhost:8080/health` returns `{"status":"ok"}`, and `curl http://localhost:3000/api/health` proxies correctly through the Vite dev server to the backend.

**Required tool: python3** — `scripts/local-verify.sh` and `plan/smoke-test.sh` use `python3` for inline JSON parsing. Python 3 must be available on the host machine. Run `python3 --version` to verify. If not installed, use `brew install python3` (macOS) or your system package manager. See `plan/preflight.sh` for automated environment validation.

---

## Phase 0a: Bootable Skeleton

### Work Unit: p0a-backend-scaffold

**Goal:** A Spring Boot 3.x application that compiles, starts, and responds to `GET /health`. All future backend work units extend this scaffold.

**What to build:**

`backend/build.gradle.kts` — Gradle Kotlin DSL project with:
- Spring Boot plugin: `3.3.x`
- Java version: 21
- Group: `gov.cms`, artifact: `hiring`
- Gradle wrapper (`gradlew`, `gradlew.bat`, `gradle/wrapper/`) generated via `gradle wrapper` or pre-built
- Dependencies:
  - `implementation("org.springframework.boot:spring-boot-starter-web")`
  - `implementation("org.springframework.boot:spring-boot-starter-data-jpa")`
  - `implementation("org.springframework.boot:spring-boot-starter-validation")`
  - `testImplementation("org.springframework.boot:spring-boot-starter-test")`
  - `implementation("org.flywaydb:flyway-core")`
  - `implementation("org.flywaydb:flyway-database-postgresql")`
  - `runtimeOnly("org.postgresql:postgresql")`
  - `implementation(platform("software.amazon.awssdk:bom:2.26.12"))`
  - `implementation("software.amazon.awssdk:bedrockruntime")`
  - `implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.7.3")`
  - `implementation("org.apache.pdfbox:pdfbox:3.0.2")`
  - `implementation("org.apache.poi:poi-ooxml:5.2.5")`
  - `compileOnly("org.projectlombok:lombok")`
  - `annotationProcessor("org.projectlombok:lombok")`
  - `testImplementation("org.testcontainers:postgresql")`
  - `testImplementation("org.testcontainers:junit-jupiter")`

`backend/settings.gradle.kts`:
```kotlin
rootProject.name = "hiring"
```

`backend/src/main/java/gov/cms/hiring/Application.java`:
```java
package gov.cms.hiring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

`backend/src/main/java/gov/cms/hiring/controller/HealthController.java`:
```java
@RestController
public class HealthController {
    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok", "version", "0.1.0");
    }
}
```

`backend/src/main/java/gov/cms/hiring/config/WebConfig.java` — CORS configuration:
```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins("http://localhost:3000")
            .allowedMethods("GET", "POST", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true);
    }
}
```

`backend/src/main/resources/application.yml`:
```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/cms_hiring
    username: ${POSTGRES_USER:cms}
    password: ${POSTGRES_PASSWORD:cms}
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true

logging:
  level:
    gov.cms.hiring: INFO
```

**Verification:**

```bash
cd backend
# Requires PostgreSQL running locally on port 5432
./gradlew bootRun &
sleep 15
curl -s http://localhost:8080/health
# Expected: {"status":"ok","version":"0.1.0"}
```

**result.json hot_file_changes:** All null — this unit creates all hot files as initial versions.

---

### Work Unit: p0a-frontend-scaffold

**Goal:** A Vite 5 + React 18 + TypeScript project that builds cleanly, shows a hello-world page, and proxies `/api` to `http://localhost:8080` (Spring Boot port).

**What to build:**

`frontend/vite.config.ts` — proxy configuration:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

`frontend/src/App.tsx` — initial scaffold with single placeholder route at `/`.

`frontend/src/types/index.ts` — placeholder: `export {};`

Additional packages: `react-router-dom`, `axios`, `@tanstack/react-query`, `react-hook-form`, `react-dropzone`.

**Verification:**

```bash
cd frontend
npm install
npm run build
# Expected: no TypeScript errors, dist/ directory created
```

**result.json hot_file_changes:** All null — this unit creates App.tsx and package.json as initial versions. Later units append to them via result.json.

---

### Work Unit: p0a-db-flyway

**Goal:** Flyway configured in application.yml, V1__init.sql baseline migration that runs cleanly against a fresh PostgreSQL database.

**What to build:**

`backend/src/main/resources/db/migration/V1__init.sql`:
```sql
-- V1: baseline migration — schema tracking only
-- Tables are created in subsequent migrations (V2 and above).
-- This file intentionally left without DDL statements.
```

`application.yml` additions (via result.json, orchestrator applies):
```yaml
spring:
  flyway:
    enabled: true
    locations: classpath:db/migration
    baseline-on-migrate: true
    baseline-version: 0
```

**Verification:**

```bash
# Requires PostgreSQL running locally on port 5432
cd backend && ./gradlew bootRun
# Expected: startup log shows "Successfully applied 1 migration to schema"
# Then: curl http://localhost:8080/health → {"status":"ok","version":"0.1.0"}
```

**result.json hot_file_changes:**
- `application_yml_addition`: Flyway config block
- `env_var_needed`: `"DATABASE_URL — jdbc:postgresql://localhost:5432/cms_hiring (POSTGRES_USER and POSTGRES_PASSWORD also accepted)"`

---

### Work Unit: p0a-docker-compose

**Goal:** `docker-compose.yml` starts three services (db, backend, frontend), runs health checks, and persists PostgreSQL data in a named volume. All services run locally — no cloud configuration.

**What to build:**

`docker-compose.yml`:
```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-cms}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-cms}
      POSTGRES_DB: ${POSTGRES_DB:-cms_hiring}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-cms}"]
      interval: 5s
      timeout: 5s
      retries: 10
    ports:
      - "5432:5432"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    env_file: .env
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://db:5432/${POSTGRES_DB:-cms_hiring}
      SPRING_DATASOURCE_USERNAME: ${POSTGRES_USER:-cms}
      SPRING_DATASOURCE_PASSWORD: ${POSTGRES_PASSWORD:-cms}
      AWS_REGION: ${AWS_REGION:-us-east-1}
      AWS_PROFILE: ${AWS_PROFILE:-default}
    depends_on:
      db:
        condition: service_healthy
    ports:
      - "8080:8080"
    volumes:
      - ./uploads:/app/uploads
      - ${HOME}/.aws:/root/.aws:ro

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      VITE_API_BASE: http://localhost:8080
    depends_on:
      - backend
    ports:
      - "3000:3000"

volumes:
  pgdata:
```

`backend/Dockerfile`:
```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .
COPY src ./src
RUN chmod +x gradlew && ./gradlew bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

`frontend/Dockerfile` — runs Vite dev server (not nginx, since this is local dev only):
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]
```

`.env.example`:
```
# Database
POSTGRES_USER=cms
POSTGRES_PASSWORD=cms
POSTGRES_DB=cms_hiring

# AWS (required for Wave 4 Bedrock features)
AWS_REGION=us-east-1
AWS_PROFILE=default

# Upload storage
UPLOAD_DIR=./uploads
```

**Verification:**

```bash
cp .env.example .env
docker compose up -d
sleep 30
curl -s http://localhost:8080/health
# Expected: {"status":"ok","version":"0.1.0"}
docker compose ps
# Expected: all three services Up/healthy
```

---

## Phase 0b: Local Stack Validation

### Work Unit: p0b-local-stack-verify

**Goal:** Verify the full local Docker Compose stack is healthy, the backend responds to health checks, the frontend serves HTML, and the Vite dev proxy routes `/api` requests to the Spring Boot backend. This is a scripted checklist — not a deployment step.

**What to build:**

`scripts/local-verify.sh`:

```bash
#!/usr/bin/env bash
# local-verify.sh — validates Phase 0b local stack health
set -euo pipefail

BASE_BACKEND="http://localhost:8080"
BASE_FRONTEND="http://localhost:3000"

echo "=== Phase 0b: Local Stack Verification ==="
echo ""

# 1. docker compose ps — all services Up
echo "[1] Checking docker compose status..."
docker compose ps --format json | python3 -c "
import sys, json
for line in sys.stdin:
    line = line.strip()
    if not line: continue
    s = json.loads(line)
    name = s.get('Name', s.get('Service', 'unknown'))
    state = s.get('State', 'unknown')
    health = s.get('Health', '')
    status = f'{state} ({health})' if health else state
    ok = state == 'running'
    print(f'  {\"PASS\" if ok else \"FAIL\"}  Service {name}: {status}')
"

echo ""

# 2. Backend health
echo "[2] Checking backend health..."
BACKEND_RESP=$(curl -s --max-time 10 "$BASE_BACKEND/health" || echo "CURL_FAILED")
if echo "$BACKEND_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status')=='ok'" 2>/dev/null; then
  echo "  PASS  GET $BASE_BACKEND/health → $BACKEND_RESP"
else
  echo "  FAIL  GET $BASE_BACKEND/health → $BACKEND_RESP"
  exit 1
fi

echo ""

# 3. Frontend serving HTML
echo "[3] Checking frontend..."
FRONTEND_RESP=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$BASE_FRONTEND/" || echo "000")
if [ "$FRONTEND_RESP" = "200" ]; then
  echo "  PASS  GET $BASE_FRONTEND/ → HTTP 200"
else
  echo "  FAIL  GET $BASE_FRONTEND/ → HTTP $FRONTEND_RESP"
  exit 1
fi

echo ""

# 4. Proxy: frontend /api/health → backend
echo "[4] Checking Vite dev proxy..."
PROXY_RESP=$(curl -s --max-time 10 "$BASE_FRONTEND/api/health" || echo "CURL_FAILED")
if echo "$PROXY_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); assert d.get('status')=='ok'" 2>/dev/null; then
  echo "  PASS  GET $BASE_FRONTEND/api/health (via proxy) → $PROXY_RESP"
else
  echo "  FAIL  GET $BASE_FRONTEND/api/health (via proxy) → $PROXY_RESP"
  echo "  NOTE  Check frontend Dockerfile and Vite proxy config"
  exit 1
fi

echo ""
echo "=== Phase 0b: LOCAL STACK VERIFIED ==="
```

**Verification steps (manual + scripted):**

1. `docker compose up -d` — starts db, backend, frontend
2. Wait for health checks: `docker compose ps` shows all Running/healthy
3. `curl http://localhost:8080/health` → `{"status":"ok","version":"0.1.0"}`
4. `curl http://localhost:3000` → HTML containing "CMS Hiring POC"
5. `curl http://localhost:3000/api/health` → `{"status":"ok","version":"0.1.0"}` (proxied via Vite)
6. `bash scripts/local-verify.sh` → all four checks pass

**Common issues and fixes:**

- Port 8080 already in use: check for other Spring Boot instances or change `server.port` in application.yml
- Flyway baseline error on startup: ensure `baseline-on-migrate: true` and `baseline-version: 0` in application.yml
- Frontend proxy not working: verify Vite `server.proxy` target is `http://localhost:8080` (not 8000)
- AWS credentials warning in backend logs: expected — Bedrock is not used in Phase 0, credentials checked only in Wave 4

**result.json hot_file_changes:** All null — this unit only creates scripts.
