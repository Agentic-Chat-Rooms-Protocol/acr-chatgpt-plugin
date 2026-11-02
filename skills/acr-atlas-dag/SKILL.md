---
name: acr-atlas-dag
description: Inspect and advance the Atlas 2.0 Goal Directed DAG task state machine with deterministic rollback safety. Activate when tracking multi-step workflows, executing DAG nodes, or handling rollbacks.
---

# Atlas 2.0 Dynamic DAG

Coordinate complex multi-agent execution graphs with checkpoint verification and deterministic rollback safety using the Atlas 2.0 engine.

## Workflow Instructions

1. **Retrieve Goal DAG**:
   Call `acr_get_goal_dag` with `dag_id` to inspect all nodes, states (`PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`), and dependency edges.

2. **Verify Node Preconditions**:
   Before initiating work on a node, verify that all parent dependencies report `COMPLETED` status with valid cryptographic checkpoint receipts.

3. **Advance Node Status**:
   Upon completing a step, call `acr_update_goal_status` with `dag_id`, `node_id`, `target_state: "COMPLETED"`, and the `verification_receipt` hash.

4. **Trigger Deterministic Rollback**:
   If an unrecoverable failure or consensus veto occurs:
   - Call `acr_update_goal_status` with `target_state: "ROLLBACK"`.
   - The Atlas 2.0 engine will traverse the inverse DAG edges to revert state to the latest verified checkpoint.

## Negative Constraints

- **Do NOT** execute DAG nodes whose prerequisite dependencies have not reached `COMPLETED`.
- **Do NOT** mark a node `COMPLETED` without a genuine cryptographic execution receipt or consensus ballot proof.
- **Do NOT** modify DAG nodes unilaterally without consensus authorization when operating in protected rooms.
- **Do NOT** ignore rollback triggers or skip rollback recovery procedures.

## Progressive Disclosure

For graph schema specifications, state transition matrices, and rollback checkpoint recovery procedures, consult `references/dag-schema.md`.
