import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

describe("Source package hygiene", () => {
  it("tracks no build archives or publication receipts", () => {
    const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf-8" }).split("\0").filter(Boolean);
    for (const file of files) {
      assert.doesNotMatch(file, /(^dist\/|\.(zip|tgz|gz)$|receipt)/i);
    }
    assert.match(readFileSync(join(root, ".gitignore"), "utf-8"), /^dist\/\r?$/m);
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    assert.equal(pkg.scripts.bundle, undefined);
    assert.ok(!existsSync(join(root, "scripts", "bundle-submission.mjs")));
  });
});

describe("Connector listing", () => {
  const listing = JSON.parse(readFileSync(join(root, "connector-listing.json"), "utf-8"));

  it("keeps registry and domain confirmation pending", () => {
    assert.equal(listing.submissionStatus, "PENDING");
    assert.equal(listing.endpoints.domainVerification.status, "PENDING");
    assert.equal(listing.submittedAt, undefined);
    assert.doesNotMatch(JSON.stringify(listing), /VERIFIED|PUBLISHED|sizeBytes|"package"/);
  });

  describe("Publication assets", () => {
    it("uses distinct, non-placeholder PNGs within OpenAI image limits", () => {
      const hashes = new Set();
      const images = readdirSync(join(root, "assets")).filter((name) => name.endsWith(".png"));
      assert.deepEqual(images.sort(), ["icon-dark.png", "icon.png", "logo-dark.png", "logo.png"]);
      for (const name of images) {
        const buffer = readFileSync(join(root, "assets", name));
        assert.deepEqual(buffer.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
        assert.ok(buffer.length > 1024 && buffer.length <= 5 * 1024 * 1024, name);
        const width = buffer.readUInt32BE(16);
        const height = buffer.readUInt32BE(20);
        assert.ok(width >= 48 && height >= 48 && width <= 4096 && height <= 4096, name);
        assert.equal(width, height, `${name} must be square`);
        const hash = createHash("sha256").update(buffer).digest("hex");
        assert.ok(!hashes.has(hash), `${name} must be distinct`);
        hashes.add(hash);
      }
      assert.ok(!existsSync(join(root, "scripts", "generate-assets.mjs")));
      assert.ok(existsSync(join(root, "assets", "LOGO-LICENSE.txt")));
    });
  });

  it("references existing files and derives inventory counts from the tree", () => {
    for (const path of Object.values(listing.distribution)) {
      assert.ok(existsSync(join(root, path)), `${path} must exist`);
    }
    const mcp = JSON.parse(readFileSync(join(root, "mcp.json"), "utf-8")).mcpServers.acr;
    const catalog = JSON.parse(readFileSync(join(root, "tool-catalog.json"), "utf-8"));
    const app = JSON.parse(readFileSync(join(root, ".app.json"), "utf-8"));
    const skills = readdirSync(join(root, "skills")).filter((name) => existsSync(join(root, "skills", name, "SKILL.md")));
    assert.equal(listing.features.toolsCount, catalog.tools.length);
    assert.equal(listing.features.skillsCount, skills.length);
    assert.equal(listing.features.canvasAppMimeType, app.mimeType);
    assert.equal(listing.endpoints.mcpGateway, mcp.url);
  });
});

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
    assert.equal(iface.category, "Developer Tools");
    assert.ok(iface.capabilities.length <= 20);
    assert.equal(iface.brandColor, "#4A6FA5");
  });

  it("keeps draft review cases without inventing a demo recording", () => {
    const review = plugin.extensions["com.openai"].review;
    assert.equal(review.test_cases.positive.length, 5);
    assert.equal(review.test_cases.negative.length, 3);
    assert.equal(review.domain_verification.path, "/.well-known/openai-apps-challenge");
    assert.equal(review.demo_recording_url, undefined);
    assert.equal(review.commerce, false);
  });

  it("keeps publisher facts consistent and avoids unsupported claims", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    const listing = JSON.parse(readFileSync(join(root, "connector-listing.json"), "utf-8"));
    const iface = plugin.extensions["com.openai"].interface;
    assert.equal(plugin.description, pkg.description);
    assert.equal(plugin.homepage, pkg.homepage);
    assert.equal(plugin.license, pkg.license);
    assert.equal(plugin.repository, pkg.repository.url.replace(/^git\+/, "").replace(/\.git$/, ""));
    assert.equal(iface.developerName, plugin.author.name);
    assert.equal(listing.vendor.name, plugin.author.name);
    assert.equal(listing.vendor.email, plugin.author.email);
    assert.equal(listing.vendor.website, plugin.homepage);
    assert.equal(iface.websiteURL, plugin.homepage);
    assert.equal(listing.category, iface.category);
    assert.doesNotMatch(JSON.stringify(iface), /AAA|Astra|GPT-6|Runtime Protocol Tax|hardened/i);
    assert.equal(listing.endpoints.domainVerification.token, plugin.extensions["com.openai"].review.domain_verification.token);
  });
});

describe("ACR MCP Tool Definitions", () => {
  const config = JSON.parse(readFileSync(join(root, "mcp.json"), "utf-8"));
  const mcp = config.mcpServers.acr;
  const catalog = JSON.parse(readFileSync(join(root, "tool-catalog.json"), "utf-8"));

  it("configures streamable-http remote endpoint with interactive OAuth only", () => {
    assert.equal(mcp.type, "streamable-http");
    assert.equal(mcp.url, "https://mcp.agentchatrooms.dev/mcp");
    const auth = mcp.extensions?.["com.openai"]?.auth;
    assert.ok(auth, "auth configuration must exist");
    assert.equal(auth.type, "oauth");
    assert.equal(auth.resource, mcp.url);
    assert.deepEqual(auth.baseScopes, ["acr:rooms", "acr:cloud:pro"]);
    assert.equal(auth.api_key_profile, undefined);
    assert.deepEqual(Object.keys(config).sort(), ["$schema", "mcpServers"]);
    assert.deepEqual(Object.keys(config.mcpServers), ["acr"]);
    assert.deepEqual(Object.keys(auth).sort(), ["baseScopes", "resource", "type"]);
  });

  it("declares no environment credential reads or embedded secrets", () => {
    const text = JSON.stringify(config);
    assert.doesNotMatch(text, /"env"\s*:|api_key_profile|ACR_CLOUD_TOKEN/i);
    assert.doesNotMatch(text, /"(?:clientSecret|password|apiKey|access_token)"\s*:|Bearer\s+[A-Za-z0-9._-]{16,}/i);
  });

  it("contains all 15 required ACR MCP tools", () => {
    assert.equal(catalog.tools.length, 15);
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
      const tool = catalog.tools.find((t) => t.name === name);
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
