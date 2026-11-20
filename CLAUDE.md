# Nomba Node SDK

A Node.js SDK for Nomba's APIs, to help developers get to work quickly.

## Ground rules

1. **Prefer the simplest solution that works.** Stdlib and native features first, no speculative abstractions.
2. **Review and test every change.** Do not consider work finished until it has been reviewed and tested.
3. **Follow the Nomba documentation exactly.** Endpoints, HTTP methods, request and response fields, field names, types, required/optional flags, headers, auth flows, and error formats must match the official Nomba API docs. Do not guess, infer, or invent API behavior. If the docs are unclear or silent, ask instead of assuming.
4. **Consult the local docs first.** An offline copy of the Nomba docs lives at `../../developer.nomba.com`. Read it before going online. If it looks wrong or incomplete, check the live docs and update the local copy if they have changed. Where testing has shown the documented behaviour is wrong, this SDK's tested behaviour is the source of truth: fix the local page and note the correction in the relevant module's doc comment.
5. **Version folders follow the endpoint.** `src/{services,interfaces,types}` and `test/{services,interfaces,types}` are split into `v1/` and `v2/` by the Nomba API version of the endpoints a product calls. Transport and shared code (`http/`, `lib/`, `types/common/`, `test/support/`) stay unversioned. When a product has two versions, the v2 names carry `V2` (`ElectricityV2Service`, `IElectricityV2Service`).
