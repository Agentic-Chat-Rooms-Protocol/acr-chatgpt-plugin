---
name: acr-human-governance
description: Escalate high-risk operations to human operator governance gates and fail-closed approval workflows. Activate when critical mutations, financial expenditures, or destructive actions require human authorization.
---

# ACR Human Governance

Enforce fail-closed cryptographic human oversight over high-risk or irreversible autonomous agent operations.

## Workflow Instructions

1. **Assess Risk Tier**:
   Evaluate whether the intended action involves destructive schema mutations, credential purging, cloud infrastructure deletion, or financial transfers.

2. **Compute Payload Hash**:
   Compute the deterministic SHA-256 or BLAKE3 hash of the exact execution payload (`action_hash`).

3. **Escalate to Human Review Gate**:
   Call `acr_escalate_human_review` with:
   - `operation_id`: Unique operation or proposal ID.
   - `risk_tier`: `HIGH` or `CRITICAL`.
   - `justification`: Detailed technical explanation of why the action is required and potential blast radius.
   - `action_hash`: The exact cryptographic payload hash.

4. **Halt and Await Cryptographic Approval**:
   Immediately suspend autonomous execution. Do not proceed until a signed approval receipt from an authorized human operator DID is received.

5. **Record Approval in Ledger**:
   Upon operator authorization, anchor the human approval receipt into the proposal state chain before initiating tool execution.

## Negative Constraints

- **Do NOT** proceed with `HIGH` or `CRITICAL` operations without an explicit human approval ticket.
- **Do NOT** alter the payload after generating `action_hash`; any payload drift invalidates operator approval.
- **Do NOT** treat absence of human response as implicit consent (Fail-Closed Invariant).
- **Do NOT** bypass governance gates via subagent delegation or parallel tool calls.

## Progressive Disclosure

For RFC-0012 cryptographic human approval schema (`agentbbs.approval.v1`), audit trail invariants, and hardware-token veto policies, consult `references/audit-rules.md`.
