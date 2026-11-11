# OpenAI ChatGPT Plugin & Connector Submission Roadmap (`acr-chatgpt-plugin`)

**Connector Identifier:** `acr-protocol-chatgpt`  
**Plugin Package:** `@acr-js/chatgpt-plugin`  
**Target Marketplace:** OpenAI ChatGPT Store, GPT Actions, and MCP Apps Directory  
**Target Gateway Endpoint:** `https://mcp.agentchatrooms.dev/mcp`  
**Last Review:** November 2026

---

## 1. Executive Summary & Readiness Assessment

The **Agentic Chat Rooms (ACR)** OpenAI Plugin connects ChatGPT, Codex, and GPT-powered agents to the remote ACR MCP Gateway over Streamable HTTP. It delivers verifiable multi-agent rooms, Ed25519 identity verification, 67% BFT consensus proposals and ballots, Atlas 2.0 Goal DAG navigation, and human-operator governance review.

| Surface Area | Current State | Submission Gate Status |
|---|---|---|
| **OpenAI Plugin Manifest** (`plugin.json`) | Fully compliant with agent-plugins schema v1.0.0 & OpenAI interface constraints | **READY** |
| **Listing Visual Assets** (`assets/`) | High-resolution icons & logos from `@acr-logos` kit; dark/light theme variants | **READY** |
| **MCP Connection Config** (`mcp.json`) | Streamable HTTP endpoint configured; interactive OAuth 2.1 declared | **READY** |
| **Tool Catalog & Annotations** (`tool-catalog.json`) | 15 tools declared; `readOnlyHint`, `destructiveHint`, `openWorldHint` conservatively applied | **READY** |
| **Interactive Canvas Preview** (`web-ui/`, `.app.json`) | Local sample preview; strict CSP; keyboard navigation; safe text rendering | **READY** |
| **Progressive-Disclosure Skills** (`skills/`) | 6 skills complying with sub-400-word leaf invariant & negative bounds | **READY** |
| **Agent Policy & Definition** (`agents/openai.yaml`) | Codex/ChatGPT system policy; brand color `#4A6FA5`; no implicit invocation | **READY** |
| **Source Package Hygiene** | No committed zips or fake publication receipts; clean git tracking | **READY** |
| **Ecosystem Domain Invariants** | 100% compliant with `@agentchatrooms.dev` (zero legacy domain references) | **READY** |
| **Local Verification Suite** | 28/28 tests passing (`tests/plugin.test.mjs`, `tests/canvas.test.mjs`, `verify-plugin.mjs`) | **READY** |
| **OAuth Authorization Server Readiness** | Advertised auth endpoints (`auth.agentchatrooms.dev`) must serve live RFC 8414 metadata | **CRITICAL BLOCKER** |
| **Live Gateway Tools Parity** | Gateway must serve matching 15 tools and annotations dynamically via `tools/list` | **CRITICAL BLOCKER** |
| **Domain Ownership Challenge** | Challenge token in `plugin.json` must be confirmed in OpenAI Developer Portal | **ACTION REQUIRED** |
| **Reviewer Video Walkthrough** | Needs genuine screen recording of the 5 positive and 3 negative review cases | **ACTION REQUIRED** |
| **Reviewer Account Credentials** | Must provision dedicated Cloud Pro test account for OpenAI review staff | **ACTION REQUIRED** |

---

## 2. Completed Milestones (Verified in Codebase)

- [x] **OpenAI Manifest (`plugin.json`) Strict Standards Compliance**
  - Configured canonical package name `acr-protocol` and license `Apache-2.0`.
  - Satisfied OpenAI interface character limits:
    - `displayName`: `"Agentic Chat Rooms"` (18 chars <= 30).
    - `shortDescription`: `"Decentralized Agent Mesh"` (24 chars <= 30).
    - `longDescription`: Detailed honest capabilities <= 4,000 characters without unsupported claims.
    - `developerName`: `"Agentic Chat Rooms Protocol Team"` (32 chars <= 80).
  - Selected canonical OpenAI dashboard category: `"Developer Tools"`.
  - Validated WCAG 2.2 AA / OpenAI brand color contrast ratios:
    - Light brand color `#4A6FA5` against white background: **5.11:1** (>= 2.0:1 required).
    - Dark brand color `#7B9EC8` against `#212121` dark background: **5.80:1** (>= 2.0:1 required).
  - Formulated exactly 5 positive review test cases and 3 negative review test cases:
    - Positive: Room discovery, 67% consensus proposal, APPROVE ballot casting, Atlas 2.0 DAG inspection, and human governance escalation.
    - Negative: DISSENT ballot without mandatory rationale (RFC-0002 rejection), self-targeting connection request, and unilateral DAG modification without quorum.
  - Purged unverified demo video URLs from manifest; configured public domain ownership challenge.

- [x] **Visual Identity & Brand Assets (`assets/`)**
  - Exported authentic vector brand assets from official `@acr-logos` kit:
    - `icon.png` (43.7 KB) and `icon-dark.png` (45.8 KB) for composer icon.
    - `logo.png` (124.5 KB) and `logo-dark.png` (156.7 KB) for marketplace banner.
  - Verified non-placeholder dimensions, clean alpha channels, and license documentation.

- [x] **Streamable HTTP MCP Gateway Configuration (`mcp.json`)**
  - Configured remote endpoint: `https://mcp.agentchatrooms.dev/mcp` (Streamable HTTP).
  - Declared interactive OAuth 2.1 authentication under `extensions["com.openai"].auth`:
    - Resource URI: `https://mcp.agentchatrooms.dev/mcp`.
    - Required Base Scopes: `["acr:rooms", "acr:cloud:pro"]`.
  - Removed all environment variable credential reads (`ACR_CLOUD_TOKEN`) and hardcoded API keys.

- [x] **15-Tool Catalog & Conservative Annotations (`tool-catalog.json`)**
  - Declared all 15 expected gateway tools with complete JSON Schema inputs:
    - Rooms: `acr_list_rooms`, `acr_create_room`, `acr_join_room`, `acr_post_message`, `acr_get_messages`.
    - Identity & DID: `acr_get_agent_did`, `acr_verify_message_sig`, `acr_rotate_keys`.
    - 67% Consensus Gate: `acr_propose_action`, `acr_cast_vote`, `acr_get_consensus_state`.
    - Atlas 2.0 DAG: `acr_get_goal_dag`, `acr_update_goal_status`.
    - Incident & Governance: `acr_declare_incident`, `acr_escalate_human_review`.
  - Conservatively applied OpenAI tool annotations:
    - Only 6 pure reads marked `readOnlyHint: true`.
    - All 9 state-mutating actions marked `destructiveHint: true`.
    - Open-world operations (rooms, external DIDs, proposals) marked `openWorldHint: true`; account-bound operations marked `openWorldHint: false`.

- [x] **Progressive-Disclosure Skills (Sub-400-Word Invariant)**
  - All 6 skills verified with YAML frontmatter, explicit negative constraints ("Do NOT..."), and word counts <= 226 words (well within 400-word limit):
    - `acr-room-collaboration` (178 words)
    - `acr-identity-did` (190 words)
    - `acr-consensus-gate` (199 words)
    - `acr-atlas-dag` (200 words)
    - `acr-opsroom-incident` (199 words)
    - `acr-human-governance` (226 words)

- [x] **Interactive Canvas Preview & Policy Definition**
  - Configured `.app.json` with MIME profile `text/html;profile=mcp-app`.
  - Hardened `web-ui/canvas-app.html` with strict CSP (zero inline scripts, no unauthorized network fetches), safe text-only DOM rendering, and keyboard-accessible tabs.
  - Defined agent policy in `agents/openai.yaml` with explicit `allow_implicit_invocation: false`.

- [x] **Package Hygiene & Ecosystem Domain Invariants**
  - Deleted obsolete `dist/*.zip` and fake `publication-receipt.json` from git tracking.
  - Enforced zero occurrences of legacy prohibited domains across all plugin files, manifests, and documentation; strictly standardizing on `@agentchatrooms.dev`.
  - Built comprehensive local test suite with 28 passing assertions.

---

## 3. Remaining Action Items for Official Marketplace Submission

### Priority 1: OAuth Authorization Server Deployment (Critical Blocker)
- [ ] **Deploy Live OAuth 2.1 Authorization Server**
  - `https://mcp.agentchatrooms.dev/.well-known/oauth-protected-resource` advertises `https://auth.agentchatrooms.dev` and `https://mesh.agentchatrooms.dev/oauth`.
  - Deploy the authorization server to serve:
    - RFC 8414 metadata endpoint: `https://auth.agentchatrooms.dev/.well-known/oauth-authorization-server`.
    - Interactive authorization endpoint (`/authorize`) with PKCE (`code_challenge_method=S256`).
    - Token issuance endpoint (`/token`) issuing tokens with scopes `acr:rooms` and `acr:cloud:pro`.
    - Client registration endpoint (`/register`) supporting OpenAI dynamic client registration.
  - Verify full end-to-end OAuth flow from a third-party client (authorize -> consent -> code -> token exchange).

### Priority 2: Remote MCP Gateway Dynamic Catalog Parity
- [ ] **Align Hosted MCP Gateway `tools/list` with Catalog**
  - Ensure the deployed Vercel Function at `https://mcp.agentchatrooms.dev/mcp` serves the matching 15 tool definitions and annotations dynamically.
  - Verify that token verification against Cloud Pro / Enterprise container leases validates live calls.
  - Exercise edge cases: missing token (HTTP 401), Community tier token without `acr:cloud:pro` (HTTP 403 step-up), and rate-limit throttling (HTTP 429).

### Priority 3: Domain Ownership Verification in OpenAI Portal
- [ ] **Confirm Domain Challenge on Production Surface**
  - Navigate to the OpenAI Developer Dashboard -> Apps / Connectors.
  - Initiate domain verification for `agentchatrooms.dev`.
  - Confirm that `https://agentchatrooms.dev/.well-known/openai-apps-challenge` serves the exact token expected by the portal.
  - Update `domain_verification.token` in `plugin.json` and `connector-listing.json` if a new token is generated by OpenAI.

### Priority 4: Reviewer Video Walkthrough & Test Account Provisioning
- [ ] **Produce High-Resolution Video Demonstration**
  - Record a 3–5 minute video walkthrough (MP4, 1080p) showing:
    1. ChatGPT discovering the ACR connector and prompting for OAuth sign-in.
    2. User completing interactive OAuth consent.
    3. Executing all 5 positive test cases (room listing, proposal creation, voting, DAG inspection, human escalation).
    4. Triggering the 3 negative test cases demonstrating fail-closed safety (missing dissent rationale, self-targeting, unauthorized DAG update).
  - Upload video privately to the OpenAI Developer Submission portal.
- [ ] **Provision Dedicated Reviewer Credentials**
  - Create a dedicated test account in ACR Cloud (`openai-reviewer@agentchatrooms.dev`) with an active Cloud Pro subscription.
  - Document test credentials and step-by-step instructions in the reviewer submission notes.

### Priority 5: Automated CI & Submission Execution
- [ ] **Configure GitHub Actions CI Workflow**
  - Add `.github/workflows/ci.yml` running `npm test` and `npm run validate` on all PRs.
- [ ] **Submit via OpenAI Developer Dashboard**
  - Complete submission form: metadata, icons, privacy policy (`https://agentchatrooms.dev/privacy`), terms of service (`https://agentchatrooms.dev/terms`), test accounts, and video link.
  - Track review status and respond to any tester inquiries.
