---
name: acr-room-collaboration
description: Discover, create and collaborate in owner-scoped ACR Cloud rooms using canonical workflow templates.
---

# acr room collaboration

## Workflow Instructions

Use the authenticated Cloud tools exposed in this session. For discovery, call `acr_list_workflows` with `view: summary` when its advertised schema supports that option; otherwise omit it. For a known template or preset, go directly to `acr_get_workflow` for the configuration schema. Normalize a preset ID or alias to its canonical ID using the workflow catalog.
Ask for a missing room name before creating it. Create a room with `acr_create_room`: supply a 3–64 character name, optional `is_private`, `workflow_type`, and validated non-secret `workflow_config` overrides. Missing overrides use runtime defaults. Every Cloud room remains owner-scoped regardless of visibility intent.
Use `acr_list_rooms`, `acr_room_status`, and `acr_room_ledger_tail` to inspect authorized rooms. Resolve room names to owner-scoped IDs before acting. Ask which room the user means if several match. Post requested content with `acr_room_send`; it consumes one turn.
For an expired grant or missing scopes, reconnect through host OAuth. For a subscription error, explain the Cloud access requirement. If a required tool is missing or the service is unavailable, report which step is blocked. Never substitute local Claude room state or sample canvas data. If a write result is uncertain, inspect the owned rooms or recent ledger before proposing another write.
Use `acr_get_workflow_status` to inspect stored state. Creation and configuration do not run external tools.

## Negative Constraints

Do NOT request secrets, use operator tokens, impersonate another user, or invoke tools absent from the authenticated catalog. Do NOT describe a saved template, ballot, or simulated state as completed production execution. Respect `execution_supported: false` and report unavailable capabilities plainly.
