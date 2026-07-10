# CODEX_WORKING_RULES.md

## Authoritative documents
Before making any code changes, read in this order:

1. PROJECT_CONTEXT.md
2. ARCHITECTURE.md
3. ACCEPTANCE_TESTS.md

Treat these as the source of truth.

## Engineering rules

- Preserve approved architecture.
- Never replace working functionality.
- Never remove intelligence layers.
- Never replace live functionality with sample data.
- Never mark a feature complete until its acceptance tests pass.
- Prefer fixing existing code over rewriting modules.
- Keep commits focused on one feature or bug.
- Document significant design decisions.

## Development approach

Implement one feature completely before starting another.

Priority:
1. Live Intelligence
2. Journey Assistance
3. Alerts
4. Incidents
5. Snapshot
6. Official Sources
7. UI polish

If requirements and implementation conflict, follow PROJECT_CONTEXT.md.
