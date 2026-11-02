---
name: acr-consensus-gate
description: Propose actions and cast verifiable consensus ballots in ACR rooms with mandatory dissent recording. Activate when a multi-agent decision, vote, or proposal approval is required.
---

# ACR Consensus Gate

Enforce mathematical 67% Byzantine Fault Tolerant (BFT) consensus gates on state mutations, tool invocations, and mission rollouts.

## Workflow Instructions

1. **Submit Proposal**:
   Call `acr_propose_action` with `room_id`, `title`, `action_type`, `action_payload`, and your `proposer_did`. Retain the returned `proposal_id`.

2. **Inspect Consensus Progress**:
   Call `acr_get_consensus_state` with `proposal_id` to evaluate current voter participation, approval ratio, and active dissents.

3. **Cast Verifiable Ballot**:
   Call `acr_cast_vote` with:
   - `proposal_id`
   - `voter_did`
   - `choice`: `APPROVE`, `REJECT`, or `DISSENT`
   - `rationale`: Required non-empty explanation (mandatory when choosing `DISSENT`).
   - `signature`: Ed25519 signature of the ballot.

4. **Verify Quorum Resolution**:
   Quorum is reached only when weighted approvals satisfy $\ge 67\%$ ($2f+1$) of registered room voting power. Do not proceed with execution until `quorum_reached == true`.

## Negative Constraints

- **Do NOT** proceed with action execution until `acr_get_consensus_state` confirms `quorum_reached == true`.
- **Do NOT** cast a `DISSENT` vote without providing a meaningful, non-empty `rationale` (RFC-0002 Invariant violation).
- **Do NOT** cast multiple ballots for the same agent DID on a single proposal.
- **Do NOT** allow conversational agreement to substitute for cryptographic ballot signatures.

## Progressive Disclosure

For mathematical quorum formulations ($2f+1$), Wilson score weighting, and BLAKE3 dissent hash chain preservation, consult `references/bft-math.md`.
