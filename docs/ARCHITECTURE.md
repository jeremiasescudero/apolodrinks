# Architecture

## Purpose

Describe the system's architecture, major components, boundaries, dependencies, and data flow.

This document is the architectural source of truth for the project.

## System overview

**System name:** [PROJECT NAME]

**Purpose:** [ONE-PARAGRAPH DESCRIPTION]

**Primary users:** [USER TYPES]

## Technology stack

Replace this table with the real stack.

| Layer | Technology | Version |
|---|---|---|
| Frontend | [e.g. Next.js] | [version] |
| Backend | [e.g. NestJS] | [version] |
| Language | [e.g. TypeScript] | [version] |
| Database | [e.g. PostgreSQL] | [version] |
| ORM | [e.g. Prisma] | [version] |
| Authentication | [technology] | [version] |
| Testing | [technology] | [version] |
| E2E | [technology] | [version] |
| Deployment | [platform] | [version] |

## Architectural principles

1. Separation of concerns.
2. Explicit module boundaries.
3. Business rules should be easy to test.
4. Infrastructure details should not leak into business logic unnecessarily.
5. Dependencies should point toward stable abstractions where appropriate.
6. Avoid premature abstractions.
7. Prefer consistency with the existing codebase.

## Layer responsibilities

### Presentation

Responsible for:
- HTTP/UI concerns.
- Request parsing.
- Input validation.
- Authentication context.
- Response formatting.

Should NOT:
- Contain complex business rules.
- Directly manipulate database internals.

### Application

Responsible for:
- Use cases.
- Orchestration.
- Authorization decisions.
- Transaction coordination.

### Domain

Responsible for:
- Core business rules.
- Domain invariants.
- Business calculations.

### Infrastructure

Responsible for:
- Database access.
- External APIs.
- Email providers.
- File storage.
- Framework-specific integrations.

## Module structure

Document the project's canonical feature/module structure here.

Example:

```text
src/
├── modules/
│   ├── users/
│   ├── authentication/
│   └── orders/
├── shared/
└── infrastructure/
```

## Canonical implementation

When adding a feature, agents should first inspect an existing module considered representative of the preferred architecture.

**Canonical example:** `[PATH TO EXEMPLARY MODULE]`

## Data flow

Describe the normal request flow:

```text
Client
  ↓
Presentation
  ↓
Application / Use Case
  ↓
Domain
  ↓
Infrastructure
  ↓
Database / External Service
```

Adapt this diagram to the actual system.

## External integrations

| Integration | Purpose | Owner/module | Failure strategy |
|---|---|---|---|
| [API] | [purpose] | [module] | [retry/fail/etc.] |

## Architectural constraints

Document constraints that agents must not violate.

- [CONSTRAINT]
- [CONSTRAINT]

## Changing architecture

Any significant architectural change must:
1. Be explicitly justified.
2. Be recorded in `docs/DECISIONS.md`.
3. Include affected documentation.
4. Include appropriate tests.
