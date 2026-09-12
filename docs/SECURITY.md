# Security Rules

Security is a non-functional requirement.

## Secrets

NEVER:
- Commit passwords.
- Commit API keys.
- Commit private keys.
- Commit production tokens.
- Put secrets in source code.
- Print secrets in logs.

Use environment variables or the project's secret-management system.

## Authentication

Document:
- Authentication mechanism.
- Session/token lifetime.
- Refresh strategy.
- Password policy.
- Account recovery.

Agents must not weaken authentication to simplify development or tests.

## Authorization

Authorization must be enforced server-side.

Never rely solely on UI visibility to protect an operation.

Every sensitive operation should answer:

1. Who is the user?
2. What resource are they accessing?
3. Are they allowed to perform this action?

## Input validation

Treat all external input as untrusted.

Validate:
- Type.
- Format.
- Length.
- Allowed values.
- Ownership/authorization.

## Injection

Use parameterized queries and framework-safe APIs.

Never concatenate untrusted input into:
- SQL.
- Shell commands.
- HTML.
- Dynamic code.

## Sensitive data

Do not expose unnecessary:
- Passwords.
- Tokens.
- Personal information.
- Internal identifiers.
- Security configuration.

## Dependencies

Keep dependencies reasonably current and address known critical vulnerabilities.

## Security changes

Security-sensitive changes require:
- Tests.
- Review.
- Documentation when behavior changes.

Never disable security controls as a shortcut to passing tests.
