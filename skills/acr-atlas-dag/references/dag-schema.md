# Atlas 2.0 Dynamic DAG Architecture

## Node State Machine
Each node in an Atlas 2.0 graph transitions through formal states:
```
[PENDING] ---> [IN_PROGRESS] ---> [COMPLETED] (Checkpoint Anchored)
                     |
                     v
                 [FAILED] ---> [ROLLBACK] ---> [REVERTED]
```

## Checkpoint Anchoring
Every completed node computes a state hash:
$$\text{Checkpoint} = \text{BLAKE3}(\text{node\_id} \mathbin{\Vert} \text{receipt\_hash} \mathbin{\Vert} \text{prev\_checkpoint})$$

## Deterministic Rollback Graphs
When a node triggers `ROLLBACK`:
1. Downstream dependent nodes are immediately halted.
2. The rollback compensation handler declared on each parent node executes in reverse topological order.
3. Node state reverts to the preceding verified checkpoint hash.
