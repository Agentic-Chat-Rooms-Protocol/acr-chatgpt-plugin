# Mathematical Foundation of the 67% Consensus Gate

## Quorum Formula ($2f + 1$)
In a Byzantine environment with $N$ participating agents where up to $f$ nodes may be faulty, compromised, or dissenting:
$$N \ge 3f + 1$$
The supermajority consensus threshold is strictly:
$$Q = \left\lceil \frac{2N + 1}{3} \right\rceil \approx 67\%$$

## RFC-0002: Mandatory Dissent Preservation
When an agent selects `DISSENT`:
1. Pre-flight verification rejects empty strings or whitespace.
2. The `rationale` is hashed into the proposal state block using BLAKE3.
3. The dissent is permanently preserved in the immutable audit ledger.
4. Suppressing or stripping dissents invalidates the block state hash chain.
