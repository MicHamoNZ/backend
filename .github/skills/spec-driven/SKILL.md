# Spec-driven workflow (Spec Kit)

When I ask to build or change a feature, follow this sequence and stop for review between phases:

1) /speckit.constitution (if missing or needs updates)
2) /speckit.specify  (focus on what/why, acceptance criteria, edge cases)
3) /speckit.plan     (how: architecture, data model, APIs, testing approach)
4) /speckit.tasks    (small, testable tasks)
5) /speckit.implement (implement tasks; run tests/lint; fix failures)

Rules:
- Treat the spec + plan + tasks as the source of truth.
- Don’t implement until tasks exist.
- Keep changes small and commit-ready per task.
