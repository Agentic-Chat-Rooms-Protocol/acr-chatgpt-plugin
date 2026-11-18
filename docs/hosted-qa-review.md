# Hosted QA and publication review

Checked 2026-11-12 against the public ACR and Clerk services. Status: **blocked before authenticated end-to-end verification and submission**.

## Latest release checks

On November 17 (Pacific), AgentMail accepted the configured key and created a dedicated inbox. ACR signup remained on the form after submission, with a Turnstile field present. No verification email arrived during the check. Interactive consent, paid tool calls and reviewer scenarios still require an accessible reviewer account. The 15 public and credential-rejection checks passed again. The following November 12 observations are historical.

## AgentMail retry after environment update

The new environment exposes AGENTMAIL_API_KEY and reports it ready. Using the documented Bearer authentication, inbox creation and listing on api.agentmail.to both returned HTTP 403 with only `{"message":"Forbidden"}`. Listing on the documented EU endpoint also returned 403. A read-only retry outside the sandbox produced the same response. No inbox or ACR account was created.

AgentMail's [403 troubleshooting reference](https://docs.agentmail.to/knowledge-base/api-403-error) identifies this bare response as credential rejection at its API gateway, before application permission checks. A valid key must be supplied through secure settings before mailbox verification can continue. If using a key restricted to an existing inbox, supply its inbox ID and message-reading access as well. No credential values or verification codes are included in this report.

## Observed hosted behavior

The eight public preflight checks and seven authorization rejection checks passed. The hosted gateway returns HTTP 401 with the exact resource-metadata challenge for anonymous initialization, an invalid opaque token, a malformed JWT, an incorrect authorization scheme, and anonymous tools/list. The Cloud bridge rejects anonymous and invalid-token access with HTTP 401.

Chromium reached the real Clerk authorization endpoint using the ACR Studio client metadata URL, exact MCP resource, profile/email scopes, and an S256 challenge. It redirected to the hosted ACR sign-in page. This establishes that the client request reaches sign-in; consent, code exchange and a successful user grant were not completed.

The hosted signup form returned HTTP 200 and displayed required username, email and password fields. Public Clerk configuration requires email verification at signup and enables CAPTCHA. No account was created because a usable mailbox was unavailable. Browser checks used the installed environment CA trust with HTTPS verification enabled.

Read-only Clerk CLI inspection confirmed audience claims, JWT OAuth access tokens, required PKCE, and client metadata documents enabled. Public metadata clients are not restricted to pre-registered clients; dynamic client registration is disabled. This configuration supports the observed metadata-client flow, but does not establish ChatGPT client interoperability.

## Outstanding evidence

| Gate | Current result | Needed to finish |
| --- | --- | --- |
| Registration | Form verified; AgentMail API returns 403; no account created | Working AgentMail credential/inbox or an existing isolated test account |
| Paid Cloud access | Unverified | Authorized Cloud Pro/Enterprise reviewer account with sample data |
| User OAuth | Sign-in page reached | Completed sign-in, consent, code exchange, and audience/scopes validation |
| Hosted catalog | Authenticated tools/list not attempted | User OAuth grant and matching web/gateway deployment |
| Tool behavior | Positive tool calls not attempted | Isolated account and real owner-scoped room |
| Workflow execution | Unavailable in the local implementation | Actual external tool dispatch and approval enforcement before execution can be tested |
| Deployment | No deployment performed; GitHub deployment queries returned 403 | Authorized deployment access or deployment by the repository owner |
| Publication | Materials reviewed against current documentation; no submission | Verified publisher access, completed QA, reviewer credentials and actual video |

AgentMail and shared-desktop tools remain absent from the chat tool inventory. The current environment includes Clerk and AgentMail keys, but AgentMail rejects the supplied credential. No deployment key is configured. GitHub repository access does not grant deployment API access. A management API key is not a user OAuth grant and was not substituted for one.

The 11-tool catalog remains a local SDK export. Unauthenticated rejection tests cannot establish its hosted parity. External execution is explicitly unavailable in the local implementation; configuration and simulation are not execution evidence.

## Reproducible checks

Run `node scripts/check-hosted-auth.mjs` for the public and rejection checks. In this managed Node 24 environment, prefix `NODE_USE_ENV_PROXY=1`. The runner logs status and issue summaries, never response bodies or credentials. It invokes no business tools.

An actual user grant can be supplied through the secure `ACR_QA_OAUTH_ACCESS_TOKEN` environment setting to additionally compare authenticated tools/list with the local catalog. The runner rejects common management-key formats. This optional catalog check still does not complete consent, paid tool QA or reviewer scenarios.

Evidence saved outside the public repository:

- `/workspace/qa-artifacts/hosted-auth-report.json`
- `/workspace/qa-artifacts/oauth-authorization.png`
- `/workspace/qa-artifacts/acr-signup.png`

Local package tests (34) and package validation passed after adding the runner.

## Publication review

The current OpenAI submission documentation requires five positive and three negative cases for the authenticated MCP app, a reviewer-accessible video, and dedicated reviewer credentials entered separately through the secure dashboard. The guidelines require a fully featured demo account with sample data that works without inaccessible MFA, email codes or signup. The current manifest has the required case counts and listing URLs, and accurately limits workflow support to templates/configuration.

Before submission, deploy the matching private web bridge and gateway; capture the authenticated catalog; exercise every shipped tool and all 18 templates with the isolated account; run the actual ChatGPT review prompts; and record the real walkthrough. Keep reviewer credentials out of the package. Do not advertise execution until external dispatch and approvals have been implemented and verified. The offline canvas remains optional.

References reviewed on 2026-11-12:

- https://developers.openai.com/plugins/deploy/submission
- https://developers.openai.com/plugins/plugin-guidelines

No publication, portal approval, completed end-to-end OAuth, or successful workflow execution is claimed by this review.
