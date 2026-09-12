# AI-Agent Ready Project — Engineering Rules

This repository is designed to be developed with AI coding agents such as Claude Code.

The repository is the source of truth. Do not rely on undocumented assumptions.

## 1. Core principles

1. Understand before modifying.
2. Reuse existing patterns before creating new ones.
3. Make the smallest change that correctly solves the requirement.
4. Do not modify unrelated files.
5. Never silently change requirements.
6. Prefer simple, maintainable solutions over clever abstractions.
7. Keep business logic testable and independent from infrastructure where practical.
8. Never declare a task complete without validation.

## 2. Required workflow

For every non-trivial task:

1. Read this file.
2. Read the relevant files under `docs/`.
3. Inspect existing implementations that solve a similar problem.
4. Identify affected modules and possible regressions.
5. State a short implementation plan before making substantial changes.
6. Implement the change.
7. Add or update tests.
8. Run the project's validation command.
9. Review the diff for unintended changes.
10. Report what changed and what was validated.

## 3. Definition of Done

A task is DONE only when all applicable items are satisfied:

- [ ] Requirements implemented.
- [ ] Existing architecture respected.
- [ ] Existing conventions respected.
- [ ] Input validation handled.
- [ ] Error cases handled.
- [ ] Authorization/security considered.
- [ ] Tests added or updated.
- [ ] Relevant regression tests pass.
- [ ] Lint passes.
- [ ] Type/static checks pass.
- [ ] Build passes.
- [ ] Documentation updated when behavior or architecture changed.
- [ ] Final diff contains no unrelated changes.

If a required validation cannot be executed, explicitly report why. Never pretend it passed.

## 4. Testing rules

Every new behavior must have appropriate automated tests.

Use:
- Unit tests for isolated business logic.
- Integration tests for module/service/database boundaries.
- E2E tests for critical user journeys.

When fixing a bug:
1. Reproduce it with a test when practical.
2. Fix the implementation.
3. Verify the regression test fails before the fix when practical.
4. Verify the complete relevant test suite passes.

Never modify a test only to make the implementation pass. Change a test only when the expected behavior itself was wrong or intentionally changed.

## 5. Safety rules

NEVER:
- Commit secrets or credentials.
- Print tokens/passwords/API keys.
- Disable authentication or authorization just to make a test pass.
- Remove validation to bypass an error.
- Delete production data.
- Use production credentials locally.
- Weaken security controls without explicit authorization.
- Rewrite migration history unless explicitly instructed.
- Change unrelated code merely because it could be improved.

## 6. Database rules

- Treat schema changes as deliberate changes.
- Use the project's migration mechanism.
- Never edit generated ORM/client files manually.
- Never modify an already-applied migration to change history.
- Consider backwards compatibility for deployed systems.
- Add tests for important data constraints and transactional behavior.

See `docs/DATABASE.md`.

## 7. Git rules

- Do not commit unless explicitly requested.
- Do not force-push.
- Do not rewrite human-authored commits.
- Keep changes focused.
- Do not reset or discard user changes without explicit permission.
- Before finishing, inspect the diff.

## 8. Documentation

Update documentation when:
- Architecture changes.
- Public APIs change.
- Database structure changes.
- Development commands change.
- Important business rules change.

Architectural decisions belong in `docs/DECISIONS.md`.

## 9. Project-specific configuration

Replace the placeholders in `docs/ARCHITECTURE.md` and `docs/DEVELOPMENT.md` with the actual project's stack and commands.

Until project-specific rules exist, prefer the patterns already present in the repository over introducing new dependencies or frameworks.

## 10. Final response format

At the end of a task, report:

### Summary
- What was changed.

### Validation
- Tests: PASS/FAIL/NOT RUN
- Static/type checks: PASS/FAIL/NOT RUN
- Lint: PASS/FAIL/NOT RUN
- Build: PASS/FAIL/NOT RUN

### Notes
- Important assumptions, limitations, or follow-up work.

Never claim validation that was not actually executed.
