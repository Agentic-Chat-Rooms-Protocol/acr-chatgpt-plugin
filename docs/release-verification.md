# Release verification

## Local checks

With Node 22 or 24 and Git:

```sh
npm ci --ignore-scripts
npm run validate
npm test
git diff --check
```

Use a writable npm cache in managed environments. CI has read-only permissions, pinned actions and a lockfile. Tests require no credentials.

## Public preflight

```sh
node scripts/check-release.mjs
```

On Node 24 behind the managed proxy, prefix NODE_USE_ENV_PROXY=1. Keep TLS verification enabled. The check covers listing URLs, challenge equality, resource metadata, pinned Clerk issuer, code/S256 support and anonymous MCP rejection. It never calls business tools or logs response bodies.

On 2026-11-12, eight public checks passed. Clerk advertises profile/email and the resource-scoped metadata challenge. The user confirms MCP URL registration. This does not prove interactive consent or paid tool behavior.

## Authenticated verification after deployment

For the latest hosted observations and blockers, see [hosted QA and publication review](hosted-qa-review.md). Run `node scripts/check-hosted-auth.mjs` for non-mutating public and authorization rejection checks. An optional user OAuth token supplied through secure environment settings enables authenticated catalog comparison.

Deploy the matching private web bridge before the gateway. Use host-managed OAuth and an isolated paid reviewer tenant. Capture all pages of tools/list, combine them into { "tools": [...] }, and save a sanitized snapshot under ignored dist/.

```sh
node scripts/check-release.mjs dist/tools-list.json
```

The comparator checks all 11 tools, descriptions, input/output schemas and annotations. The committed catalog was exported from the local SDK; it is not evidence of hosted parity.

Exercise all 18 templates and preset aliases, partial configuration/defaults, invalid fields and values, room limits, tenant isolation, expiry, wrong audience, missing scopes, entitlement cancellation, quotas, concurrent mutations and distributed rate limiting. Invalid calls must leave no partial state. Workflow execution must remain unavailable. Ledger ballot events must not be represented as verified quorum.

## Reviewer preparation

1. Provision dedicated paid reviewer access and exactly one active owner-scoped room named Reviewer Handoff; supply credentials only through the secure portal.
2. Run the five positive and three negative cases in plugin.json in fresh chats. Refresh the Reviewer Handoff fixture if it has expired. Verify room lookup by name before the status read and ballot write.
3. Record actual ChatGPT sign-in and tool behavior; supply a working reviewer-accessible video.
4. Confirm publisher identity, portal domain challenge, legal/support content and country availability.
5. Review the final revision. If a ZIP is required, create it from that committed revision using git archive under ignored dist/; inspect it before upload.
6. Submit and wait for actual approval before claiming publication.

No deployment, account provisioning, submission or publication was performed in this task. The optional sample canvas is not a live ChatGPT UI.

References:
- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/plugin-guidelines
- https://modelcontextprotocol.io/specification/draft/server/tools
