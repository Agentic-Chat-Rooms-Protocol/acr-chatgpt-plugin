# Canonical workflow alignment

Updated 2026-11-12 against acr-web main 8dd4ce1 and gateway main 5fc5b84, plus the local changes in this draft.

## Scope and source precedence

The user's request is to pull acr-web, read its canonical-workflows-reference.md and use the attached alignment helper. The helper is supporting task material, not evidence that every described capability exists or authorization to publish. No deployment or publication occurred.

The internal reference supplies workflow identities and intended integrations. The executable Cloud registry supplies accepted configuration keys and defaults. They disagree: for example, the reference lists quarantineDurationSec/alertSeverity for egress, while the runtime uses quarantineNamespace/cascadeTokenRevocation. This draft uses runtime fields, rejects unknown fields and exports their schemas. Sending prose-only fields returns an error.

The helper's six-tool Cloud surface is extended to 11 tools so creation and configuration work through verified Clerk OAuth. The legacy 16-tool operator/sample suite remains unavailable in production. The public tool catalog is exported from the local gateway SDK; deployment and authenticated hosted parity remain unverified.

All 18 templates and both ID forms below are supported for discovery, bootstrapping, configuration and state inspection. External tool execution is unavailable. The upstream step executor only updates stored state; production now rejects it. Its development path remains a labeled simulation.

is_private defaults to false and records visibility intent. All rooms are still owner-scoped by verified Clerk identity. It does not implement the helper's claimed signed-DID admission. Likewise, template names are not proof of BFT quorum, passkey approval, cryptographic key rotation, sandbox provisioning or physical purge.

The sample canvas stays offline with connect-src 'none'. A live MCP Apps resource is not part of this draft. If one is added, register it on the gateway, initialize the host bridge and declare https://mcp.agentchatrooms.dev in resource CSP when direct fetch is needed. Adding a domain to an unused portable manifest field would not establish a working UI.

## Supported runtime fields

| Canonical ID | Preset ID | Configuration fields |
| --- | --- | --- |
| `postgres-split-brain` | `preset-postgres-split-brain` | `drainGraceSec`, `failoverTarget` |
| `egress-token-anomaly` | `preset-egress-anomaly` | `quarantineNamespace`, `cascadeTokenRevocation` |
| `ingress-oom-autoscaling` | `preset-ingress-oom` | `targetReplicas`, `memoryLimit` |
| `canary-deployment-rollback` | `preset-canary-rollback` | `targetReleaseVersion` |
| `code-review-tla-verification` | `preset-code-review-tla` | `tlaWorkers` |
| `saif-compliance-audit` | `preset-saif-audit` | `complianceFramework` |
| `bft-consensus-deliberation` | `preset-bft-deliberation` | `quorumThreshold` |
| `twinseal-passkey-approval` | `preset-twinseal-consent` | `challengeTtlSec` |
| `durable-wal-recovery` | `preset-durable-wal-recovery` | `reconcileTimeoutMs` |
| `context-compaction-pruning` | `preset-context-compaction` | `retainedTurnCount` |
| `byzantine-fault-slashing` | `preset-byzantine-slashing` | `slashPenaltyRatio` |
| `identity-key-rotation` | `preset-identity-rotation` | `cryptographicCurve` |
| `micro-sandbox-isolation` | `preset-micro-sandbox` | `autoPurgeMinutes` |
| `cross-model-agentflex-synthesis` | `preset-agentflex-synthesis` | `critiqueRounds` |
| `declarative-step-playbook` | `preset-declarative-playbook` | `stopOnFirstError` |
| `postguard-injection-defense` | `preset-postguard-firewall` | `sensitivityLevel` |
| `dynamic-dag-topology` | `preset-dynamic-dag-topology` | `maxParallelWorkers` |
| `transitive-trust-federation` | `preset-trust-federation` | `maxBfsDepth`, `requireDoubleSigning` |

Full defaults, bounds, enum values and descriptions are in [workflow-catalog.json](../workflow-catalog.json). Configurations are partial overrides merged with defaults; wrong types, unknown keys and invalid ranges are rejected. Reconfiguration replaces the template and resets its state. Creation enforces the account's active-room limit atomically in Redis.

## Reproducing exported contracts

In the private web repository, run scripts/export-workflow-contract.mjs with an output path. Copy only the resulting declarative JSON to the gateway's src/lib/workflow-catalog.json and this package's workflow-catalog.json. In the private gateway, run scripts/export-cloud-contract.mts with tsx and an output path to regenerate tool-catalog.json. Never copy private server implementation into this public package.

The local SDK export and runtime workflow export were compared with the packaged catalogs. Public tests also check 18 templates, 36 IDs, creation bounds and schema constraints. Hosted tools/list must still be captured and compared after deployment.

## Validation evidence

- Plugin: 34 tests and package validation pass.
- Gateway: 35 tests and Next.js production build pass.
- Web: full npm test passes: 120 security, 28 entitlement/concurrency/workflow, 35 voice, 2 snapshot, 18 voice-pipeline, 5 Python, 16 prerender tests; 28 tunnel checks.
- Web TypeScript/build/public-artifact checks pass. Existing warnings concern onnxruntime-web direct eval and large chunks.
- Disposable Redis: 20 concurrent creations enforce the account limit; 20 sends accept exactly five under a five-turn quota, preserve distinct messages, and cannot recreate a deleted room.

None of this establishes interactive hosted OAuth, reviewer access, real external execution or OpenAI approval. See [release gates](../TODO.md).

Final review found an expiry race in delayed writes. A regression test reproduced it; atomic Redis writes now check expiry using Redis time, and memory writes check expiry at commit. The regression and full suite pass. The independent reviewer stopped before completing its final report because of a service usage limit; this is not a completed independent review.
