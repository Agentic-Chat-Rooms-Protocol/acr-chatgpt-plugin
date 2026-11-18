---
name: acr-atlas-dag
description: Configure workflow templates for recovery, context management, declarative playbooks and dynamic DAG planning.
---

# acr atlas dag

## Workflow Instructions

Use `acr_get_workflow` for `durable-wal-recovery`, `context-compaction-pruning`, `declarative-step-playbook`, or `dynamic-dag-topology`. Use the returned schema rather than assuming example configuration keys in prose documents match the runtime.
Bootstrap with `acr_create_room` or replace the template using `acr_configure_workflow`. Reconfiguration resets stored template state. Inspect it with `acr_get_workflow_status`.
Treat step/server names as required integrations, not currently available executable tools. For context compaction, use user-provided material and summaries; never request or expose hidden model reasoning.

## Negative Constraints

Do NOT request secrets, use operator tokens, impersonate another user, or invoke tools absent from the authenticated catalog. Do NOT describe a saved template, ballot, or simulated state as completed production execution. Respect `execution_supported: false` and report unavailable capabilities plainly.
