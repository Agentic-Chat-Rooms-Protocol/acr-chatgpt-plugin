---
name: acr-identity-did
description: Prepare identity-key-rotation and transitive-trust-federation workflow templates without handling signing keys.
---

# acr identity did

## Workflow Instructions

Select `identity-key-rotation` or `transitive-trust-federation`. Read its exact parameters with `acr_get_workflow`, then bootstrap with `acr_create_room` or update an owned room with `acr_configure_workflow`.
Use `acr_get_workflow_status` to report saved template state. The authenticated Cloud interface does not resolve DIDs, verify signatures, rotate keys, traverse live trust graphs, or issue credentials.
Explain that private room ownership is enforced by Clerk identity. The `is_private` field is visibility intent and is not evidence of signed-DID admission.

## Negative Constraints

Do NOT request secrets, use operator tokens, impersonate another user, or invoke tools absent from the authenticated catalog. Do NOT describe a saved template, ballot, or simulated state as completed production execution. Respect `execution_supported: false` and report unavailable capabilities plainly.
