# Development Workflow

## Prerequisites

Replace with the real project requirements.

- Runtime: [VERSION]
- Package manager: [npm/pnpm/yarn/etc.]
- Database: [VERSION]
- Other services: [LIST]

## Installation

```bash
[INSTALL COMMAND]
```

## Environment

Create the local environment file according to the project's secret-management conventions.

Never commit secrets.

Required variables:

```text
[VARIABLE]=[DESCRIPTION]
```

## Local development

```bash
[DEV COMMAND]
```

## Testing

```bash
[UNIT TEST COMMAND]
[INTEGRATION TEST COMMAND]
[E2E TEST COMMAND]
```

## Validation

The canonical validation command should be:

```bash
[VALIDATE COMMAND]
```

It should verify all required quality gates.

## Build

```bash
[BUILD COMMAND]
```

## Database

```bash
[MIGRATION COMMAND]
[SEED COMMAND]
```

## Branching

Recommended:

```text
main
  └── feature/short-description
```

Keep branches focused.

## Pull requests

A PR should contain:
- What changed.
- Why.
- Tests performed.
- Relevant screenshots for UI changes.
- Migration notes when applicable.
- Known limitations.

## AI-agent workflow

Agents should:
1. Inspect before editing.
2. Plan before substantial implementation.
3. Implement incrementally.
4. Test continuously.
5. Run the complete validation command before completion.
6. Review the final diff.
7. Report validation honestly.
