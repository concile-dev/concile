# Security Policy

We take the security of Concile seriously. Concile runs your backend and holds
your data, so we treat every report with care and speed.

Thank you for helping keep Concile and its users safe.

## Supported versions

Concile is pre-1.0 and moves fast. We support the latest published release on
the `main` line. Please upgrade to the newest version before reporting an issue,
in case it is already fixed.

| Version | Supported |
| ------- | --------- |
| Latest release | Yes |
| Older releases | No |

## Reporting a vulnerability

Please do not open a public issue for a security problem. A public report can put
users at risk before a fix is ready.

Report privately in one of two ways:

1. **GitHub private advisory (preferred).** Go to the
   [Security tab](https://github.com/concile-dev/concile/security/advisories/new)
   and open a new draft advisory. This keeps the report private and lets us work
   with you in one place.
2. **Email.** Write to **security@concile.dev**. If you want to encrypt your
   report, ask us for a key first.

Please include as much as you can:

- What the problem is, and why it matters.
- The steps to reproduce it.
- The version, platform, and setup you tested.
- Any proof-of-concept code or logs.

## What happens next

- We aim to confirm we received your report within 3 business days.
- We aim to send a first assessment within 7 business days.
- We will keep you posted as we work on a fix.
- We will credit you when the fix ships, unless you ask us not to.

## Safe harbor

We will not pursue or support legal action against anyone who reports a
vulnerability in good faith. Good faith means you follow this policy, you avoid
harming users or their data, and you give us a fair chance to fix the issue
before you share it in public.

## Scope

This policy covers the Concile code in this repository and the packages it
publishes to npm. It does not cover third-party services you run alongside
Concile, such as your own database, cloud provider, or reverse proxy.
