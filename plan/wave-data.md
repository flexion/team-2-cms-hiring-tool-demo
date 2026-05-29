# Wave D — Seed Data Fabrication (Parallel)

**Wave D goal:** Populate the local PostgreSQL database with high-volume, high-quality synthetic positions, PD documents, and resumes so the POC demo is realistic — not obviously fake. This wave is **parallel** to waves 2 and 4; it depends only on wave-1 tables being in place.

**Pre-condition:** Wave 1 complete. All four Flyway migrations (V1–V4) applied. Database is running at `localhost:5432/cms_hiring`. `./uploads/resumes/` directory exists.

**Post-condition:**
- ≥ 20 positions in the database across all statuses and series
- ≥ 20 PD documents with realistic federal IT content, including compliant and non-compliant sections
- ≥ 40 resume PDF files in `./uploads/resumes/` with corresponding `Resume` records in the database
- `GET /api/positions` returns a full, realistic pipeline — not a single test record
- Resume Reader has enough varied content to meaningfully demonstrate embedding-based mapping

**Model recommendation:** Haiku — this is scripting and data generation, not complex reasoning.

**Why this matters for the demo:** The POC makes the case to OHC and CMS leadership that AI-assisted tools reduce review burden. An empty or obviously fake database undercuts that case. Reviewers need to see a real-looking pipeline with varied candidates, real-sounding position descriptions with both compliant and non-compliant sections, and resumes that produce a mix of high- and low-confidence mappings.

---

## Work Unit: wd-positions-and-pds

### Seed Positions and PD Documents via SQL and Flyway

**Context:** Positions map to real OIT job series and grades from the discovery research. PD documents must have JSONB content matching the `PDDocumentContent` schema (sections array with heading + body). Include a deliberate mix of compliant and non-compliant PD text so the AI suggestion feature (wave 4) visibly fires on demo data.

**Files to create:**

`backend/src/main/resources/db/migration/V5__seed_positions.sql`:
```sql
-- 20 realistic CMS OIT positions across all statuses
-- Series: GS-2210 (IT Specialist), GS-1550 (Computer Scientist), GS-0343 (Management Analyst)
-- Grades: GS-12 through GS-15
-- Titles reflect functional title practice (per Gabriel Veneziano interview, May 2026)

INSERT INTO positions (id, title, series, grade, status, posting_date, close_date, created_at, updated_at) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Full Stack Engineer', '2210', 'GS-13', 'POSTED',        '2026-04-01', '2026-04-22', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000002', 'Cloud Infrastructure Engineer', '2210', 'GS-14', 'UNDER_REVIEW',  '2026-03-15', '2026-04-05', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000003', 'AI/ML Engineer', '2210', 'GS-14', 'READY_TO_POST',      NULL,         NULL,         NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000004', 'Cybersecurity Engineer', '2210', 'GS-13', 'CERTIFICATE_ISSUED', '2026-02-10', '2026-03-03', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000005', 'Data Engineer', '2210', 'GS-13', 'POSTED',              '2026-04-10', '2026-05-01', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000006', 'DevOps Platform Engineer', '2210', 'GS-14', 'POSTED',   '2026-04-08', '2026-04-29', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000007', 'Enterprise Architect', '2210', 'GS-15', 'READY_TO_POST', NULL,        NULL,         NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000008', 'IT Project Manager', '2210', 'GS-14', 'UNDER_REVIEW',   '2026-03-20', '2026-04-10', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000009', 'Data Scientist', '1550', 'GS-14', 'POSTED',             '2026-04-14', '2026-05-05', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000010', 'Software Engineer (Backend)', '2210', 'GS-12', 'CERTIFICATE_ISSUED', '2026-01-20', '2026-02-10', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000011', 'Security Operations Analyst', '2210', 'GS-13', 'POSTED', '2026-04-21', '2026-05-12', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000012', 'IT Specialist (Systems Analysis)', '2210', 'GS-12', 'READY_TO_POST', NULL, NULL,    NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000013', 'Platform Reliability Engineer', '2210', 'GS-13', 'UNDER_REVIEW', '2026-03-28', '2026-04-18', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000014', 'Product Manager', '0343', 'GS-14', 'POSTED',            '2026-04-07', '2026-04-28', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000015', 'API Integration Engineer', '2210', 'GS-13', 'READY_TO_POST', NULL,    NULL,         NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000016', 'Machine Learning Operations Engineer', '2210', 'GS-14', 'POSTED', '2026-04-18', '2026-05-09', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000017', 'IT Specialist (Data Management)', '2210', 'GS-13', 'CLOSED', '2026-01-06', '2026-01-27', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000018', 'Agile Coach / Scrum Master', '0343', 'GS-13', 'POSTED', '2026-04-22', '2026-05-13', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000019', 'IT Specialist (Customer Support)', '2210', 'GS-12', 'UNDER_REVIEW', '2026-03-17', '2026-04-07', NOW(), NOW()),
  ('a1000000-0000-0000-0000-000000000020', 'Senior Data Architect', '1550', 'GS-15', 'READY_TO_POST', NULL,       NULL,         NOW(), NOW());
```

`backend/src/main/resources/db/migration/V6__seed_pd_documents.sql`:

Seed 10 PD documents (one for each POSTED/UNDER_REVIEW/CERTIFICATE_ISSUED position). JSONB content should match the `PDDocumentContent` schema with a `sections` array. Include:
- **Non-compliant sections** with "Responsible for..." (triggers OHC-PD-001 AI suggestion)
- **Vague specialized experience** using "example" language that OHC requires (triggers OHC-PD-003/005)
- **Compliant sections** for contrast

Example JSONB structure:
```json
{
  "sections": [
    {
      "heading": "Position Summary",
      "body": "Serves as a Full Stack Engineer in the Office of Information Technology (OIT), Centers for Medicare & Medicaid Services (CMS). The incumbent designs, develops, and maintains web-based applications supporting CMS healthcare data platforms.",
      "aiReviewed": false,
      "reviewerApproved": false
    },
    {
      "heading": "Major Duties",
      "body": "Responsible for developing and maintaining React-based frontend applications. Responsible for designing RESTful APIs using Java Spring Boot. Collaborates with DevOps teams to support CI/CD pipelines.",
      "aiReviewed": false,
      "reviewerApproved": false
    },
    {
      "heading": "Specialized Experience",
      "body": "At least one (1) year of specialized experience equivalent to the GS-12 grade level in the Federal service. Experience may include: developing web applications using modern JavaScript frameworks; designing and consuming REST APIs; working in an Agile software development environment.",
      "aiReviewed": false,
      "reviewerApproved": false
    }
  ]
}
```

Create V6 with PD documents for positions 1, 2, 4, 5, 6, 8, 9, 10, 13, 14 using realistic CMS IT position content. At least 4 of the 10 PDs should have "Responsible for..." in major duties to ensure AI suggestions fire on demo data.

`scripts/seed-resumes.py`:
```python
#!/usr/bin/env python3
"""
Generate synthetic federal IT candidate resumes as PDF files.
Places files in ./uploads/resumes/ and prints SQL INSERT statements
for the resumes table (to be pasted into V7__seed_resumes.sql).

Requires: reportlab (pip install reportlab)
Usage:    python scripts/seed-resumes.py
"""
import os, uuid, json
from datetime import date
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

UPLOAD_DIR = "./uploads/resumes"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Each candidate: name, summary, experience blocks, skills, education
CANDIDATES = [
    {
        "name": "Jordan Merritt",
        "target_position_id": "a1000000-0000-0000-0000-000000000001",  # Full Stack Engineer
        "match_quality": "strong",
        "summary": "Software engineer with 6 years of experience building full-stack web applications using React, TypeScript, Java Spring Boot, and PostgreSQL. 3 years supporting federal health IT programs.",
        "experience": [
            ("Senior Software Engineer", "Booz Allen Hamilton", "2021–Present",
             "Developed React 18 / TypeScript frontends for CMS CMMI data programs. Built RESTful APIs using Java 17 + Spring Boot 3. Deployed containerized services on AWS ECS. Reduced page load time 40% via React Query caching."),
            ("Software Engineer", "Leidos", "2019–2021",
             "Built Java microservices for VA benefits adjudication system. Wrote JUnit 5 integration tests with Testcontainers. Participated in 2-week Agile sprints; acted as technical lead for 3 delivery cycles."),
        ],
        "skills": "Java 17/21 · Spring Boot · React 18 · TypeScript · PostgreSQL · AWS (ECS, S3, RDS) · Docker · Kubernetes · REST APIs · Agile/Scrum",
        "education": "B.S. Computer Science, University of Maryland, 2019",
        "certifications": "AWS Certified Developer – Associate (2023)",
    },
    {
        "name": "Priya Anand",
        "target_position_id": "a1000000-0000-0000-0000-000000000002",  # Cloud Infrastructure
        "match_quality": "strong",
        "summary": "Cloud infrastructure engineer with 7 years of AWS architecture experience, including 4 years in federal cloud environments (FedRAMP High). Expertise in Terraform, Kubernetes, and CI/CD pipeline design.",
        "experience": [
            ("Cloud Architect", "SAIC", "2020–Present",
             "Designed and operated AWS GovCloud infrastructure for HHS enterprise data platform. Authored Terraform modules managing 200+ resources. Implemented automated compliance scanning reducing audit prep time from 3 weeks to 2 days."),
            ("DevOps Engineer", "Accenture Federal Services", "2018–2020",
             "Built Jenkins/GitLab CI pipelines for CMS QualityNet. Managed EKS clusters with 99.95% uptime. Implemented infrastructure-as-code standards adopted agency-wide."),
        ],
        "skills": "AWS GovCloud · Terraform · Kubernetes (EKS) · Helm · CI/CD (Jenkins/GitLab) · Python · Bash · FedRAMP · CloudFormation · Prometheus/Grafana",
        "education": "M.S. Information Systems, George Mason University, 2018",
        "certifications": "AWS Solutions Architect – Professional (2024) · AWS DevOps Engineer – Professional (2022)",
    },
    {
        "name": "Marcus Thompson",
        "target_position_id": "a1000000-0000-0000-0000-000000000005",  # Data Engineer
        "match_quality": "strong",
        "summary": "Data engineer with 5 years of experience building large-scale data pipelines on AWS. Experience with Kafka, Spark, Glue, and Redshift in healthcare data contexts.",
        "experience": [
            ("Senior Data Engineer", "ICF International", "2022–Present",
             "Designed and implemented Kafka-based streaming ingestion pipeline processing 15M+ Medicare claims events daily. Built dbt transformation layer on Redshift. Reduced data latency from 24 hours to under 30 minutes."),
            ("Data Engineer", "Deloitte", "2020–2022",
             "Developed AWS Glue ETL jobs migrating legacy SAS datasets to Parquet on S3. Built Airflow DAGs for CMS risk score modeling pipeline. Authored data quality framework with 200+ automated checks."),
        ],
        "skills": "Apache Kafka · Apache Spark · AWS Glue · Airflow · dbt · Redshift · S3 · Python · SQL · Parquet · Data modeling · Healthcare data (HL7/FHIR)",
        "education": "B.S. Computer Engineering, Virginia Tech, 2020",
        "certifications": "AWS Certified Data Engineer – Associate (2023)",
    },
    {
        "name": "Samantha Chen",
        "target_position_id": "a1000000-0000-0000-0000-000000000009",  # Data Scientist
        "match_quality": "strong",
        "summary": "Data scientist with a background in machine learning applied to healthcare outcomes research. 4 years of experience with Python, scikit-learn, and AWS SageMaker. Published researcher in NLP for clinical notes.",
        "experience": [
            ("Data Scientist II", "Mathematica Policy Research", "2022–Present",
             "Developed predictive models for CMS ACO REACH readmission risk using XGBoost and SHAP explainability. Implemented NLP pipeline extracting comorbidities from 500K clinical notes using BERT fine-tuning. Presented findings to CMS program officers."),
            ("Data Analyst", "Optum", "2020–2022",
             "Built Medicare Advantage utilization dashboards in Tableau. Ran regression analyses for fraud/waste/abuse detection. Wrote Python ETL scripts processing 50GB+ claims files weekly."),
        ],
        "skills": "Python · scikit-learn · XGBoost · BERT/transformers · AWS SageMaker · SQL · R · Tableau · SHAP · A/B testing · Statistical modeling · HL7/FHIR",
        "education": "M.S. Biostatistics, Johns Hopkins Bloomberg School of Public Health, 2020",
        "certifications": "AWS Certified Machine Learning – Specialty (2023)",
    },
    {
        "name": "Derek Williams",
        "target_position_id": "a1000000-0000-0000-0000-000000000001",  # Full Stack — partial match
        "match_quality": "partial",
        "summary": "Web developer transitioning from private sector to federal IT. 3 years of React experience, 1 year of Java. Limited backend architecture experience.",
        "experience": [
            ("Frontend Developer", "StartupCo", "2023–Present",
             "Built React dashboards for SaaS analytics product. Worked with Node.js APIs. Used Tailwind CSS and TypeScript. Team used 1-week sprints."),
            ("Junior Web Developer", "Digital Agency", "2021–2023",
             "Built marketing websites in React and WordPress. Some REST API integration. No backend development."),
        ],
        "skills": "React · TypeScript · Tailwind CSS · Node.js · REST APIs · HTML/CSS · Git · Figma",
        "education": "B.S. Information Technology, Towson University, 2021",
        "certifications": "",
    },
    {
        "name": "Patricia Nguyen",
        "target_position_id": "a1000000-0000-0000-0000-000000000006",  # DevOps
        "match_quality": "strong",
        "summary": "DevOps and platform engineer with 8 years of experience, including 5 years on federal programs. Expert in Kubernetes, Terraform, and GitOps workflows. Current clearance: Public Trust.",
        "experience": [
            ("Platform Engineer Lead", "Peraton", "2021–Present",
             "Led migration of 40 legacy applications to Kubernetes on AWS EKS for CMS enterprise platform. Built Helm chart library used by 12 development teams. Implemented GitOps with ArgoCD, reducing deployment failures by 70%."),
            ("DevOps Engineer", "General Dynamics IT", "2018–2021",
             "Managed CI/CD pipelines for VA digital modernization program. Implemented Prometheus/Grafana observability stack. On-call engineer maintaining 99.9% platform SLA for 3 years."),
        ],
        "skills": "Kubernetes · Helm · ArgoCD · Terraform · AWS EKS · Prometheus · Grafana · GitLab CI · Docker · Python · Bash · GitOps · FedRAMP",
        "education": "B.S. Computer Science, Penn State University, 2017",
        "certifications": "Certified Kubernetes Administrator (CKA, 2023) · AWS Solutions Architect – Associate (2021)",
    },
    {
        "name": "Robert Okafor",
        "target_position_id": "a1000000-0000-0000-0000-000000000011",  # Security
        "match_quality": "strong",
        "summary": "Cybersecurity analyst with 6 years of experience in federal security operations. Expert in NIST RMF, SOC operations, and vulnerability management. Active Secret clearance.",
        "experience": [
            ("Cybersecurity Analyst III", "CACI", "2021–Present",
             "Lead SOC analyst for CMS ISSO program supporting 15 systems under FISMA. Performed risk assessments and authored System Security Plans for 4 ATO packages. Managed vulnerability scanning program using Tenable Nessus across 2,000+ assets."),
            ("Information Security Analyst", "Leidos", "2019–2021",
             "Monitored SIEM (Splunk) for anomalous activity across HHS enterprise network. Responded to 50+ security incidents. Conducted annual security control assessments per NIST SP 800-53."),
        ],
        "skills": "NIST RMF · FISMA · NIST SP 800-53 · Tenable Nessus · Splunk SIEM · Incident response · Risk assessment · ATO packages · Python (security scripting) · Active Secret clearance",
        "education": "B.S. Cybersecurity, University of Maryland University College, 2019",
        "certifications": "CISSP (2022) · CompTIA Security+ · CEH",
    },
    {
        "name": "Linda Foster",
        "target_position_id": "a1000000-0000-0000-0000-000000000014",  # Product Manager
        "match_quality": "strong",
        "summary": "Digital product manager with 9 years of experience, 5 years in federal health IT. Expert in agile product ownership, stakeholder management, and roadmap delivery for data-intensive government platforms.",
        "experience": [
            ("Senior Product Manager", "Fearless Solutions", "2021–Present",
             "Product owner for CMS MACPro modernization program. Managed backlog of 300+ user stories across 4 agile teams. Facilitated monthly demos for CMS program officers. Delivered 3 major releases on schedule."),
            ("Product Analyst", "Booz Allen Hamilton", "2018–2021",
             "Supported product roadmap for VA eBenefits migration. Conducted user research with 40+ veteran stakeholders. Translated research findings into acceptance criteria and sprint goals."),
        ],
        "skills": "Product ownership · Agile/Scrum · Jira · Confluence · User research · Roadmap planning · Federal acquisition · Stakeholder management · Data visualization · OKRs",
        "education": "M.P.A. Public Administration, American University, 2018 · B.A. Political Science, University of Virginia, 2015",
        "certifications": "Certified Scrum Product Owner (CSPO) · SAFe Product Owner/Manager",
    },
    {
        "name": "Tony Reyes",
        "target_position_id": "a1000000-0000-0000-0000-000000000001",  # Full Stack — weak match
        "match_quality": "weak",
        "summary": "IT support technician with 2 years of experience. Recently completed online web development bootcamp. Limited professional programming experience.",
        "experience": [
            ("IT Support Specialist", "Retail Company", "2022–Present",
             "Provided hardware and software support for 200-person office. Managed Active Directory accounts. Completed Python and HTML/CSS online courses."),
        ],
        "skills": "HTML · CSS · Python basics · JavaScript basics · Active Directory · Windows Server · Help desk",
        "education": "A.S. Information Technology, Community College of Baltimore County, 2022",
        "certifications": "CompTIA A+",
    },
    {
        "name": "Angela Kim",
        "target_position_id": "a1000000-0000-0000-0000-000000000016",  # MLOps
        "match_quality": "strong",
        "summary": "MLOps engineer with 5 years of experience deploying and monitoring machine learning systems at scale. Expert in AWS SageMaker, MLflow, and Kubernetes-based model serving.",
        "experience": [
            ("MLOps Engineer", "Two Sigma / federal consulting", "2022–Present",
             "Built end-to-end ML pipelines on AWS SageMaker for CMS risk adjustment models. Implemented MLflow experiment tracking and model registry used by 8 data scientists. Deployed real-time inference endpoints serving 10K predictions/minute with 99.5% uptime."),
            ("Machine Learning Engineer", "Accenture Applied Intelligence", "2020–2022",
             "Containerized and deployed 12 ML models using Docker and Kubernetes. Built feature store on AWS Feature Store. Implemented A/B testing framework for model comparison. Reduced model deployment cycle from 2 weeks to 2 days."),
        ],
        "skills": "AWS SageMaker · MLflow · Kubeflow · Docker · Kubernetes · Python · FastAPI · Model serving · Feature stores · A/B testing · Prometheus (ML metrics) · CI/CD for ML",
        "education": "M.S. Computer Science (Machine Learning), Carnegie Mellon University, 2020",
        "certifications": "AWS Certified Machine Learning – Specialty (2023) · Professional Scrum Developer",
    },
]


def build_resume_pdf(candidate: dict, filepath: str):
    doc = SimpleDocTemplate(filepath, pagesize=LETTER, topMargin=36, bottomMargin=36, leftMargin=54, rightMargin=54)
    styles = getSampleStyleSheet()
    story = []

    def h1(text):
        return Paragraph(f"<b><font size=14>{text}</font></b>", styles["Normal"])

    def h2(text):
        return Paragraph(f"<b><font size=11>{text}</font></b>", styles["Normal"])

    def body(text):
        return Paragraph(f"<font size=9>{text}</font>", styles["Normal"])

    story += [h1(candidate["name"]), Spacer(1, 4)]
    story += [body(candidate["summary"]), Spacer(1, 10)]

    story += [h2("PROFESSIONAL EXPERIENCE"), Spacer(1, 4)]
    for title, org, dates, desc in candidate["experience"]:
        story += [
            Paragraph(f"<b>{title}</b> — {org} ({dates})", styles["Normal"]),
            body(desc),
            Spacer(1, 6),
        ]

    story += [h2("TECHNICAL SKILLS"), Spacer(1, 4), body(candidate["skills"]), Spacer(1, 10)]
    story += [h2("EDUCATION"), Spacer(1, 4), body(candidate["education"]), Spacer(1, 10)]
    if candidate.get("certifications"):
        story += [h2("CERTIFICATIONS"), Spacer(1, 4), body(candidate["certifications"])]

    doc.build(story)


sql_lines = []
for c in CANDIDATES:
    resume_id = str(uuid.uuid4())
    filename = c["name"].lower().replace(" ", "_") + "_resume.pdf"
    filepath = os.path.join(UPLOAD_DIR, filename)
    build_resume_pdf(c, filepath)
    print(f"Generated: {filepath}")
    sql_lines.append(
        f"('{resume_id}', '{c['target_position_id']}', '{filename}', "
        f"'{os.path.join(UPLOAD_DIR, filename)}', NOW(), NULL, 'UPLOADED', NOW(), NOW())"
    )

sql = "INSERT INTO resumes (id, position_id, filename, file_path, upload_date, parsed_text, status, created_at, updated_at) VALUES\n"
sql += ",\n".join(sql_lines) + ";"

v7_path = "backend/src/main/resources/db/migration/V7__seed_resumes.sql"
with open(v7_path, "w") as f:
    f.write("-- Seed resume records. Corresponding PDF files are pre-generated in ./uploads/resumes/\n")
    f.write(sql + "\n")

print(f"\nWrote {v7_path}")
print(f"Total: {len(CANDIDATES)} resumes")
```

**Files to modify:**
- `backend/src/main/resources/db/migration/V6__seed_pd_documents.sql` — hand-authored SQL with JSONB `content` column

**Running the seed:**
```bash
# 1. Generate PDFs and V7 migration
pip install reportlab
python scripts/seed-resumes.py

# 2. Apply new migrations (Flyway auto-runs on backend startup)
docker compose restart backend

# 3. Verify
curl http://localhost:8080/api/positions | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{len(d)} positions')"
```

**Tests:** No new automated tests — this work unit is validated by smoke test assertions and a manual count check.

**Smoke test additions:**
```bash
# Wave D smoke tests
POSITION_COUNT=$(curl -s http://localhost:8080/api/positions | python3 -c "import sys,json; print(len(json.load(sys.stdin)))")
assert_gte "$POSITION_COUNT" 20 "Position count >= 20"
RESUME_COUNT=$(curl -s http://localhost:8080/api/resumes | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
assert_gte "$RESUME_COUNT" 10 "Resume count >= 10"
```

**result.json:**
```json
{
  "work_unit_id": "wd-positions-and-pds",
  "status": "complete",
  "summary": "Seeded 20 positions, 10 PD documents (with non-compliant text for AI demo), and 10 resumes via Flyway V5-V7 migrations and PDF generation script.",
  "tests_passing": true,
  "hot_file_changes": {
    "router_bean": null,
    "app_tsx_route": null,
    "nav_item": null,
    "gradle_dependency": null,
    "application_yml_addition": null,
    "env_var_needed": null,
    "smoke_test_additions": "POSITION_COUNT >= 20; RESUME_COUNT >= 10"
  },
  "notes": "V5 and V6 are SQL-only Flyway migrations. V7 is generated by seed-resumes.py — run the script before starting the backend, or the V7 migration file will be missing and Flyway will fail. The 4 non-compliant PD sections (containing 'Responsible for...') are intentional — they exist to ensure the AI suggestion feature fires visibly during demo."
}
```

---

## Parallelism Note

This wave **depends on wave-1** (tables V2–V4 must exist before seed migrations V5–V7 can run), but is **parallel to waves 2 and 4**. It does not share any code files with those waves. A developer working on wave-2 validation or wave-4 Bedrock integration is not blocked by or blocking wave-D work.

```
phase-0 → wave-1 ─┬─ wave-2 ─────────────────── (done)
                   ├─ wave-4 ─────────────────── (done)
                   └─ wave-D ─────────────────── (done) ← this wave
```
