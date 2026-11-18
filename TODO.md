# ACR plugin release checklist

Reviewed 2026-11-12. **Publication remains blocked by hosted verification and publisher steps.**

## Completed in the local draft

- [x] Pull acr-web main at 8dd4ce1 and read the canonical workflow reference.
- [x] Align the public catalog, listing, six skills, agent metadata, and reviewer cases to 11 real Cloud tool contracts.
- [x] Support all 18 canonical workflow IDs and 18 preset aliases for discovery and bootstrapping.
- [x] Enforce typed configuration, defaults, name bounds, ownership, and atomic room limits.
- [x] Keep external workflow execution unavailable instead of reporting simulated completion in production.
- [x] Add schema and workflow regression checks; maintain OAuth, quota, concurrency and package checks.
- [x] Configure Clerk profile/email scopes and exact MCP audience.
- [x] Add reproducible CI, public preflight, and authenticated catalog comparison.
- [x] Preserve the optional offline canvas and truthful capability descriptions.

See docs/workflow-alignment.md for source precedence and docs/release-verification.md for evidence and commands.

Hosted QA on 2026-11-12: eight public checks and seven authorization rejection checks pass. The real OAuth request reaches hosted sign-in, and the signup form is verified in Chromium. Account creation, consent/token exchange, positive tools and execution remain blocked. See [hosted QA and publication review](docs/hosted-qa-review.md) for evidence and access requirements.

## Required before submission

- [ ] Deploy matching private web bridge and gateway revisions, in that order.
- [ ] Complete interactive OAuth in an isolated paid reviewer workspace.
- [ ] Capture authenticated tools/list and compare all 11 names, descriptions, input/output schemas, and hints.
- [ ] Verify every tool and rejection path on the hosted deployment: ownership, expired/wrong-audience/underscoped tokens, entitlement cancellation, quotas, rate limits and concurrent access.
- [ ] Verify distributed limiter configuration, trusted proxy headers and retention policy.
- [ ] Confirm publisher identity and domain ownership in the OpenAI portal.
- [ ] Provision dedicated reviewer access through secure settings.
- [ ] Run five positive and three negative scenarios; record a genuine walkthrough.
- [ ] Review legal/support content and country availability.
- [ ] Submit the reviewed revision and obtain actual OpenAI approval.

## Separate implementation work before advertising execution

- [ ] Integrate real external tool servers and failure/retry semantics for workflow steps.
- [ ] Implement and verify DID signatures, replay prevention, quorum and human approvals where required.
- [ ] Implement physical retention/purge guarantees before claiming them.
- [ ] If adding live UI, register and verify a real MCP Apps resource and host bridge.

These capabilities are excluded from the current template/configuration contract. Cloud environment publication is not plugin deployment or registry approval.
