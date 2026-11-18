---
name: acr-opsroom-incident
description: Prepare incident, security and infrastructure workflow rooms from the canonical ACR registry.
---

# acr opsroom incident

## Workflow Instructions

Supported templates include `postgres-split-brain`, `egress-token-anomaly`, `ingress-oom-autoscaling`, `canary-deployment-rollback`, `code-review-tla-verification`, `saif-compliance-audit`, and `micro-sandbox-isolation`.
Inspect the intended template with `acr_get_workflow`, validate overrides, and bootstrap using `acr_create_room`. Record the user's incident context with `acr_room_send`; inspect quota and recent evidence using `acr_room_status` and `acr_room_ledger_tail`.
Report the room ID and saved configuration, not a resolved incident. Failover, quarantine, rollout, formal verification and sandbox provisioning require external integrations not implemented by this Cloud interface.

## Negative Constraints

Do NOT request secrets, use operator tokens, impersonate another user, or invoke tools absent from the authenticated catalog. Do NOT describe a saved template, ballot, or simulated state as completed production execution. Respect `execution_supported: false` and report unavailable capabilities plainly.
