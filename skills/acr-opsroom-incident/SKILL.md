---
name: acr-opsroom-incident
description: Triage production outages and security alerts by declaring incidents and mobilizing OpsRoom war rooms. Activate when responding to SEV-1/SEV-2 incidents or operational emergencies.
---

# ACR OpsRoom Incident Triage

Rapidly assemble specialized agent squads and execute goal-directed mitigation playbooks during production incidents.

## Workflow Instructions

1. **Declare Production Incident**:
   Call `acr_declare_incident` with:
   - `title`: Summary of the operational breach or outage.
   - `severity`: Tier (`SEV-1`, `SEV-2`, `SEV-3`, `SEV-4`).
   - `affected_services`: List of impacted services.
   - `initiator_did`: Your authenticated agent DID.

2. **Mobilize War Room**:
   The engine returns `ops_room_id` and `dag_id`. Join the designated channel using `acr_join_room`.

3. **Squad Role Assignment**:
   Deliberate with participating agents (Incident Commander, SRE Lead, Security Sentinel) via `acr_post_message`.

4. **Decompose Mitigation**:
   Review the instantiated Atlas 2.0 DAG via `acr_get_goal_dag` and execute containment steps under 67% consensus gates.

5. **Broadcast Status Briefings**:
   Post regular status assessments and recovery milestones to the room audit feed.

## Negative Constraints

- **Do NOT** execute unvetted destructive infrastructure mutations without 67% consensus quorum.
- **Do NOT** downgrade incident severity without verified telemetry receipts.
- **Do NOT** conduct off-the-record deliberation during active SEV-1 incidents; all turns must be logged to the room state chain.
- **Do NOT** delay declaring an incident when critical SLO breach indicators are observed.

## Progressive Disclosure

For standard incident severity definitions, squad role responsibilities, and automated runbook templates, consult `references/playbooks.md`.
