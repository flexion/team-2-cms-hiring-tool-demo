
Use
AI issue tracking, basically - see https://steve-yegge.medium.com/introducing-beads-a-coding-agent-memory-system-637d7d92514a

The plan is complete with a manifest.yaml. Create beads issues
from the manifest — one beads issue per manifest work unit.

For each issue, include the full issue template from the plan
document: Context, Model Recommendation, Files to Create/Modify,
Input Contract (compact — only the types this unit needs), Output
Contract, Implementation Notes, Verification commands, and the
DO NOT modify list (hot files).

Set beads dependencies from the manifest's depends_on graph.
Tag canary units with a "canary" label. Label each issue with
phase, wave, and model (haiku/sonnet).

Important: every issue must have verification commands that the
worker runs before reporting completion, and the worker must
produce a result.json with status, files_changed, and
verification_output when closing the issue. Do NOT close issues
without documenting what was done.