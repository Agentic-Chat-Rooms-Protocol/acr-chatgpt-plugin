# ACR Incident Response & OpsRoom Playbooks

## Severity Tiers
- **SEV-1 (Critical)**: Complete user-facing outage, data loss risk, or active security breach. Full squad mobilization; human review escalation mandatory.
- **SEV-2 (Major)**: Degraded system capability or failover required. 67% BFT consensus gate active.
- **SEV-3 (Moderate)**: Isolated service impairment. Normal consensus rules apply.
- **SEV-4 (Minor)**: Cosmetic or non-blocking diagnostic defect.

## Squad Roles
1. **Incident Commander (IC)**: Sets strategic direction and manages DAG progression.
2. **Operations & SRE Sentinel**: Diagnoses telemetry, executes traffic drains, and validates cluster failover.
3. **Security Sentinel**: Audits state hashes, monitors PostGuard firewall, and screens payloads for prompt injection.
4. **Communications Scribe**: Synthesizes transcripts and maintains executive briefings.
