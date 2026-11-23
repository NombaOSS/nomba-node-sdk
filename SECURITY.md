# Security policy

## Reporting a vulnerability

Please don't open a public issue for a security problem. Report it privately in either of these ways:

- **Private vulnerability report:** open this repository's **Security** tab and choose **Report a vulnerability**.
- **Email:** security@nomba.com.

Include the affected version, a description and, if possible, steps to reproduce. We aim to acknowledge reports within three working days.

## Supported versions

| Version | Supported |
| ------- | --------- |
| Latest  | Yes       |
| Older   | No        |

The SDK is pre-1.0 (`0.x`); only the latest published version receives fixes.

## How the SDK protects you

- GET calls and token issue/refresh are retried automatically; a mutating call is never auto-retried except the one 401-renew-and-retry, since Nomba's idempotency key is a body field, not a header — retrying with a new key risks double-executing a payment.
- Every `fetch` call passes `redirect: "error"`, so the bearer token can never follow a redirect to another host.
- Webhook signatures are compared exact-case with `timingSafeEqual`.
- Path ids are validated and reject `""`, `.` and `..`.
- Errors never contain your client secret, access token or refresh token.
