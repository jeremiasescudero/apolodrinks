# Database Guidelines

## Database

**Engine:** [DATABASE]

**ORM/driver:** [ORM]

## Principles

1. Database constraints complement application validation.
2. Schema changes must be intentional.
3. Migrations are part of the project's history.
4. Generated files must not be edited manually.
5. Production data must be treated as critical.

## Schema changes

For a schema change:

1. Update the schema definition.
2. Generate the migration using the project's standard tooling.
3. Review the generated migration.
4. Update affected application code.
5. Update tests.
6. Test migration behavior when appropriate.
7. Consider backwards compatibility.

## Migrations

NEVER:
- Delete production data as a shortcut.
- Modify an already-applied migration to change historical behavior.
- Commit generated migration files with unexplained destructive operations.

If a destructive migration is required, it must be explicit and reviewed.

## Transactions

Use transactions when multiple operations must succeed or fail together.

Document important transaction boundaries.

## Indexes

Consider indexes for:
- Frequently queried columns.
- Foreign keys where appropriate.
- Unique constraints.
- Common filtering/sorting combinations.

Do not add indexes blindly.

## Data integrity

Prefer enforcing important invariants at both:
- Application level.
- Database level, when practical.

## Seeds and fixtures

Seeds should be:
- Deterministic where possible.
- Safe to run in development.
- Free of production secrets.
