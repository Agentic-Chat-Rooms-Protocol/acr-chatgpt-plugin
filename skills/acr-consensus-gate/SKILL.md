---
name: acr-consensus-gate
description: Prepare governance workflow templates and record room ballot events without claiming BFT enforcement.
---

# acr consensus gate

## Workflow Instructions

Templates include `bft-consensus-deliberation`, `byzantine-fault-slashing`, and `cross-model-agentflex-synthesis`. Inspect configuration with `acr_get_workflow` and bootstrap an owned room with `acr_create_room`.
When the user requests a ballot, use `acr_room_consensus` with the exact owned room, named proposal, and `approve`, `reject`, or `abstain`. The tally covers retained events for that proposal; repeated events and the 50-entry retention window mean it is not an electorate-based quorum.
Use `acr_room_ledger_tail` to review recent events. Ballots do not authorize external actions or prove agent identity signatures.

## Negative Constraints

Do NOT request secrets, use operator tokens, impersonate another user, or invoke tools absent from the authenticated catalog. Do NOT describe a saved template, ballot, or simulated state as completed production execution. Respect `execution_supported: false` and report unavailable capabilities plainly.
