# Testing Strategy

## Objective

Tests are executable documentation of expected behavior and a safety net against regressions.

## Test pyramid

```text
             E2E
            /   \
       Integration
        /         \
      Unit tests
```

Use the cheapest test capable of proving the behavior.

## Unit tests

Use unit tests for:
- Business rules.
- Calculations.
- Validators.
- Pure functions.
- Small services with isolated dependencies.

A unit test should be:
- Deterministic.
- Fast.
- Independent.
- Easy to diagnose.

## Integration tests

Use integration tests for:
- Database behavior.
- Repository implementations.
- Module boundaries.
- External service adapters.
- Authentication/authorization integration.

## E2E tests

Use E2E tests for critical workflows such as:
- Login.
- Registration.
- Core CRUD flows.
- Payments.
- Critical business processes.

Do not use E2E tests for every small internal behavior.

## Test naming

A test should communicate behavior.

Prefer:

```text
creates an order when all required data is valid
rejects an order when the customer is inactive
```

Avoid:

```text
test1
works
should pass
```

## Arrange / Act / Assert

Prefer:

```text
Arrange
  ↓
Act
  ↓
Assert
```

Keep tests readable.

## Regression tests

Every significant bug fix should have a regression test unless there is a documented reason not to.

## Test data

- Use deterministic test data.
- Avoid depending on production data.
- Keep fixtures understandable.
- Clean up test state.
- Do not share mutable state between tests.

## Mocking

Mock external boundaries when appropriate.

Avoid mocking internal implementation details so heavily that tests only verify the implementation rather than behavior.

## Coverage

Coverage is a signal, not proof of correctness.

Set project-specific minimums here:

```text
Statements: [XX]%
Branches:   [XX]%
Functions:  [XX]%
Lines:      [XX]%
```

Do not chase coverage by writing meaningless assertions.

## Validation command

The project should expose one canonical command that validates the repository.

Example:

```bash
npm run validate
```

That command should run the relevant:
- lint
- typecheck/static analysis
- unit tests
- integration tests
- E2E tests
- build

Adapt to the actual stack.
