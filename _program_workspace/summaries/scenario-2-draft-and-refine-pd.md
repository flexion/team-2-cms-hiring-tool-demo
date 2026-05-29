# Scenario 2: Draft and Refine a Position Description with LLM Assistance

## Status: Complete

## Segments
- Mid-conditions (after Maria requests LLM suggestions): COMPLETE (iteration 1)
- Postconditions: COMPLETE (iteration 1)

## Modules at completion
- web/src/hr-specialist.tsx — role:HR Specialist (pipeline table + position detail with PD editor + suggestions panel)
- web/src/internal_vs_external/hiring-pipeline.ts — internal (Position domain data + PD working copy management)
- web/src/internal_vs_external/pd-suggestions.ts — external LLM Service (canned suggestion stub)
- web/src/pipeline-api.ts — nature_of_user:programmatic (HTTP API)
- web/src/main.tsx — composition_root:app (React DOM + CSS)

## Refactoring performed
- Extract Module: hiring-pipeline.ts → pd-suggestions.ts (LLM suggestion boundary extracted)
- Folder organization: both internal_vs_external modules moved to web/src/internal_vs_external/

## Axis map at completion
- role/HR Specialist: web/src/hr-specialist.tsx
- nature_of_user/programmatic: web/src/pipeline-api.ts
- internal_vs_external/internal: web/src/internal_vs_external/hiring-pipeline.ts
- internal_vs_external/external (LLM Service): web/src/internal_vs_external/pd-suggestions.ts
- composition_root/app: web/src/main.tsx

## Test results
- 35 passing, 0 failing

## Scenario Complete
