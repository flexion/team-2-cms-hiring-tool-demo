# Scenario 1: View Active Hiring Pipeline

**Scenario hash:** 1ba7b95afad728e0a7d6ececf1213411a3787f30fccb75b1c7bb6d103f0b7722
**Started:** 2026-05-28T19:00:01+00:00

---

## Segment Postconditions Summary

**Identity:** segment=Postconditions, iterations=3, completed=2026-05-28T21:11:57Z

**Modules touched this segment:**
- `web/src/hr-specialist.tsx` — created

**Refactorings applied:**
- **Extract Module**: `web/src/hr-specialist.tsx` → `web/src/hiring-pipeline.ts`, `web/src/hr-specialist.tsx` (trigger: `SPLIT`)
- **Extract Module**: `web/src/hiring-pipeline.ts` → `web/src/hiring-pipeline.ts`, `web/src/pipeline-api.ts` (trigger: `SPLIT`)

**Conditions raised:**
- `web/src/hr-specialist.tsx` · **SPLIT** → unanimous
- `web/src/hr-specialist.tsx` · **DEPENDENCY_DIRECTION** → unanimous
- `web/src/hr-specialist.tsx` · **NONE** → unanimous
- `web/src/hiring-pipeline.ts` · **SPLIT** → unanimous
- `web/src/hr-specialist.tsx` · **NONE** → unanimous
- `web/src/hiring-pipeline.ts` · **NONE** → unanimous
- `web/src/pipeline-api.ts` · **NONE** → 2-1
- `web/src/pipeline-api.ts` · **SPLIT** → 2-1

**Constraints exercised:**
- (none)

**Axis-map deltas:**
- `role/HR Specialist` — added
- `composition_root/production_entry_point` — added
- `role/HR Specialist` — modified
- `nature_of_user/programmatic` — added
- `internal_vs_external/internal` — added

**Final test state:** pass=28, fail=0, skip=0

**Source artifacts:** process-log.jsonl lines 1-55; axis-map.json @ b4627e24cd2f; last-refactoring.json @ 97d2cb35edd6
