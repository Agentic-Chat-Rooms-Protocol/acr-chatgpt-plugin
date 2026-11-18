# Ecosystem synchronization

All existing local work was committed before merging upstream changes. The working branches are `sync/ecosystem-20261118` in the four ACR repositories. Existing stashes were retained.

## Integrated upstream revisions

| Repository | Upstream revision | Result |
| --- | --- | --- |
| acr-chatgpt-plugin | f3329a6 | PR #2 merged on GitHub and reconciled locally with preserved workflow alignment |
| acr-web | 5b7450a | Workflow handling, UI, accessibility and modal tests integrated |
| acr-remote-mcp | bcfd142 | Real Ed25519 did:key verification integrated into the development fixture surface |
| acr-cloud | 21af61c | Loopback defaults, admin authentication, CORS and payload-limit hardening integrated |

PR #2 was tested separately at c030d77: 28 tests and package validation passed before the GitHub merge. It corrected Clerk scopes to profile/email. Its older six-versus-fifteen tool documentation was reconciled with the saved eleven-tool/eighteen-template contract. There were no other open plugin PRs when checked after merging.

## Preserved behavior

The local plugin still contains all 18 canonical workflow templates and preset aliases. Fresh exports of the runtime workflow definitions match the packaged schemas, defaults and bounds; a fresh gateway SDK export matches tool-catalog.json byte for byte. No new catalog was inferred from workflow names.

The web merge keeps both upstream UI tests and local authorization, billing, concurrency and workflow tests. Upstream development execution now records simulation/live mode, rejects stale expectedStepIndex, and rejects live mode without an adapter. The existing simulation response field is retained for compatibility. The production execution guard remains because the production bridge still exposes configuration rather than integrated external dispatch and approval enforcement.

Clerk identity checks, fail-closed billing, owner scoping, persistent production storage, atomic room limits and commit-time expiry checks remain present. Upstream cryptographic verification does not expose the legacy fixture tool suite in production.

## Verification

- Plugin: 34 tests and package validation pass after reconciliation.
- Gateway: 36 tests and production build pass, including upstream signature-verification coverage.
- Web: full test command and production build/public-artifact checks pass. Coverage includes 120 security, 29 entitlement/concurrency/workflow, 35 voice, 2 snapshot, 18 pipeline, 5 Python, 141 UI/accessibility, 16 prerender tests and 28 tunnel checks.
- Cloud: full workspace test command passes after installing locked dependencies.
- All upstream main revisions are ancestors of their corresponding integration branches; worktrees are clean and whitespace checks pass.

The web build still reports dependency direct-eval and large-bundle warnings. These checks do not establish hosted OAuth, deployed catalog parity or external workflow execution. No deployment or registry publication was performed. Integration changes beyond plugin PR #2 remain in local commits for review.
