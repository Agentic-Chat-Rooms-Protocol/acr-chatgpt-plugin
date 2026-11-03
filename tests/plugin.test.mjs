import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

describe("ACR OpenAI Plugin Manifest (plugin.json)", () => {
  const plugin = JSON.parse(readFileSync(join(root, "plugin.json"), "utf-8"));

  it("satisfies root metadata standards", () => {
    assert.equal(plugin.name, "acr-protocol");
    assert.equal(plugin.version, "1.0.0");
    assert.equal(plugin.license, "Apache-2.0");
    assert.equal(plugin.homepage, "https://agentchatrooms.dev");
    assert.ok(plugin.author.email.endsWith("@agentchatrooms.dev"));
    assert.ok(plugin.description.length > 20);
  });

  it("satisfies com.openai interface limits", () => {
    const iface = plugin.extensions["com.openai"].interface;
    assert.ok(iface.displayName.length <= 30);
    assert.ok(iface.shortDescription.length <= 30);
    assert.ok(iface.longDescription.length <= 4000);
    assert.ok(iface.developerName.length <= 80);
    assert.equal(iface.category, "developer-tools");
    assert.ok(iface.capabilities.length <= 20);
    assert.equal(iface.brandColor, "#4A6FA5");
  });

  it("satisfies submission review requirements", () => {
    const review = plugin.extensions["com.openai"].review;
    assert.equal(review.test_cases.positive.length, 5);
    assert.equal(review.test_cases.negative.length, 3);
    assert.equal(review.domain_verification.path, "/.well-known/openai-apps-challenge");
    assert.ok(review.demo_recording_url.startsWith("https://"));
    assert.equal(review.commerce, false);
  });
});

describe("ACR MCP Tool Definitions (mcp.json)", () => {
  const mcp = JSON.parse(readFileSync(join(root, "mcp.json"), "utf-8"));

  it("configures streamable-http remote endpoint and OAuth 2.1 / API key auth profile", () => {
    assert.equal(mcp.type, "streamable-http");
    assert.equal(mcp.url, "https://mcp.agentchatrooms.dev/mcp");
    const auth = mcp.extensions?.["com.openai"]?.auth;
    assert.ok(auth, "auth configuration must exist");
    assert.equal(auth.type, "oauth2");
    assert.equal(auth.version, "2.1");
    assert.equal(auth.resource_metadata, "https://mcp.agentchatrooms.dev/.well-known/oauth-protected-resource");
    assert.equal(auth.scope, "acr:rooms acr:cloud:pro");
    assert.ok(auth.api_key_profile, "api_key_profile must exist");
    assert.equal(auth.api_key_profile.header, "Authorization");
  });

  it("contains all 15 required ACR MCP tools", () => {
    assert.equal(mcp.tools.length, 15);
    const requiredTools = [
      "acr_list_rooms",
      "acr_create_room",
      "acr_join_room",
      "acr_post_message",
      "acr_get_messages",
      "acr_get_agent_did",
      "acr_verify_message_sig",
      "acr_rotate_keys",
      "acr_propose_action",
      "acr_cast_vote",
      "acr_get_consensus_state",
      "acr_get_goal_dag",
      "acr_update_goal_status",
      "acr_declare_incident",
      "acr_escalate_human_review",
    ];

    for (const name of requiredTools) {
      const tool = mcp.tools.find((t) => t.name === name);
      assert.ok(tool, `Tool ${name} must exist`);
      assert.ok(tool.description, `Tool ${name} must have description`);
      assert.ok(tool.inputSchema, `Tool ${name} must have inputSchema`);
      assert.equal(typeof tool.annotations.readOnlyHint, "boolean");
      assert.equal(typeof tool.annotations.destructiveHint, "boolean");
      assert.equal(typeof tool.annotations.openWorldHint, "boolean");
    }
  });
});

describe("Interactive MCP Apps Canvas (.app.json)", () => {
  const app = JSON.parse(readFileSync(join(root, ".app.json"), "utf-8"));

  it("declares mcp-app MIME profile and entrypoint", () => {
    assert.equal(app.mimeType, "text/html;profile=mcp-app");
    assert.ok(existsSync(join(root, app.entrypoint)));
    assert.ok(app.capabilities.rendering.includes("canvas"));
    assert.equal(app.capabilities.realtime, true);
  });
});

describe("Progressive-Disclosure Skills (skills/)", () => {
  const skills = [
    "acr-room-collaboration",
    "acr-identity-did",
    "acr-consensus-gate",
    "acr-atlas-dag",
    "acr-opsroom-incident",
    "acr-human-governance",
  ];

  for (const skill of skills) {
    it(`verifies skill ${skill}`, () => {
      const path = join(root, `skills/${skill}/SKILL.md`);
      assert.ok(existsSync(path), `SKILL.md for ${skill} exists`);
      const content = readFileSync(path, "utf-8");
      assert.ok(content.startsWith("---\n"));
      assert.ok(content.includes(`name: ${skill}`));
      assert.ok(content.includes("Do NOT"));

      // Sub-400-word leaf invariant
      const body = content.replace(/^---[\s\S]*?---\s*/, "");
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      assert.ok(words < 400, `Word count ${words} must be < 400`);
    });
  }
});
