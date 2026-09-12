# Coding Conventions

These conventions define how code should be written in this repository.

Existing, established project patterns take precedence over generic preferences when they are intentional and documented.

## Naming

Use clear, descriptive names.

### Variables and functions

Prefer:

```text
calculateOrderTotal()
getActiveUsers()
```

Avoid:

```text
calc()
getData()
```

### Booleans

Use names that communicate boolean intent:

```text
isActive
hasPermission
canEdit
```

### Files

Follow the naming convention already established by the project.

Do not introduce a second naming convention.

## Functions

- Keep functions focused.
- Avoid unnecessary parameters.
- Avoid hidden side effects.
- Prefer explicit return values.
- Extract logic when it improves testability or readability.

## Error handling

- Handle expected errors explicitly.
- Do not swallow exceptions.
- Do not expose internal stack traces or sensitive implementation details to users.
- Use the project's standard error model.

## Validation

Validate data at system boundaries.

Examples:
- HTTP requests.
- User input.
- External API responses.
- Environment variables.
- Imported files.

Do not assume external data is valid.

## Dependencies

Before adding a dependency:
1. Check whether the project already has equivalent functionality.
2. Check whether the standard library/framework can solve the problem.
3. Consider maintenance and security impact.
4. Add the dependency only when justified.

## Comments

Write comments to explain WHY, not WHAT.

Bad:

```text
// Increment i
i++
```

Good:

```text
// The provider may return duplicate events during retries,
// so deduplicate before updating the aggregate.
```

## Logging

Logs must:
- Be useful for diagnosis.
- Avoid secrets and sensitive data.
- Use the project's standard logging mechanism.
- Include relevant identifiers where appropriate.

## API conventions

Document:
- URL structure.
- HTTP methods.
- Status codes.
- Error format.
- Pagination.
- Authentication.
- Versioning.

Use the existing API patterns whenever possible.

## Frontend conventions

Document:
- Component structure.
- State management.
- Data fetching.
- Form handling.
- Accessibility.
- Loading/error/empty states.

Every user-facing feature should consider:
- Loading state.
- Empty state.
- Error state.
- Success state.
- Responsive behavior.
- Accessibility.

## Refactoring

Do not mix large refactors with unrelated feature work unless necessary.

Prefer small, reviewable changes.
