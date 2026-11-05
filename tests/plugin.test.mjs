import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, dirname, resolve, relative, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { inflateSync } from "node:zlib";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

function assertPackagedFile(path) {
  const resolved = resolve(root, path);
  const local = relative(root, resolved);
  assert.ok(local && !isAbsolute(local) && local !== ".." && !local.startsWith(`..${sep}`), `${path} must stay inside the package`);
  assert.ok(statSync(resolved).isFile(), `${path} must name a file`);
}

function decodeRgbaPng(buffer, width, height) {
  assert.equal(buffer[24], 8, "brand PNGs use 8-bit channels");
  assert.equal(buffer[25], 6, "brand PNGs use RGBA");
  assert.equal(buffer[28], 0, "brand PNGs are not interlaced");
  const chunks = [];
  for (let offset = 8; offset < buffer.length;) {
    const length = buffer.readUInt32BE(offset);
    assert.ok(length <= buffer.length - offset - 12, "PNG chunk fits in the file");
    if (buffer.toString("ascii", offset + 4, offset + 8) === "IDAT") chunks.push(buffer.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const stride = width * 4;
  const raw = inflateSync(Buffer.concat(chunks), { maxOutputLength: (stride + 1) * height });
  assert.equal(raw.length, (stride + 1) * height);
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    const filter = raw[row];
    assert.ok(filter <= 4, "PNG scanline filter is valid");
    for (let x = 0; x < stride; x++) {
      const position = y * stride + x;
      const left = x >= 4 ? pixels[position - 4] : 0;
      const up = y > 0 ? pixels[position - stride] : 0;
      const upperLeft = y > 0 && x >= 4 ? pixels[position - stride - 4] : 0;
      let predictor = 0;
      if (filter === 1) predictor = left;
      else if (filter === 2) predictor = up;
      else if (filter === 3) predictor = Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upperLeft;
        const a = Math.abs(estimate - left);
        const b = Math.abs(estimate - up);
        const c = Math.abs(estimate - upperLeft);
        predictor = a <= b && a <= c ? left : b <= c ? up : upperLeft;
      }
      pixels[position] = (raw[row + 1 + x] + predictor) & 255;
    }
  }
  return pixels;
}

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
    assert.ok(!existsSync(join(root, "publication-receipt.json")));
  });

  it("ships no nonexistent library entry point or install-time execution instructions", () => {
    const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf-8"));
    const readme = readFileSync(join(root, "README.md"), "utf-8");
    assert.equal(pkg.main, undefined);
    assert.deepEqual(Object.keys(pkg.scripts).sort(), ["test", "validate"]);
    assert.doesNotMatch(readme, /npm run bundle|\bnpx\b|\b(?:npm|pip)\s+install|(?:curl|wget)[^\n]*\|\s*(?:sh|bash|powershell|iex)/i);
    assert.match(readme, /## Security & Privacy/);
    assert.match(readme, /never asks for, reads, or stores private keys/);
    assert.match(readme, /security@agentchatrooms\.dev/);
    assert.doesNotMatch(readme, /WCAG%202\.2%20AAA|GPT-6 Astra/);
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
        const pixels = decodeRgbaPng(buffer, width, height);
        const colors = new Set();
        let transparent = false;
        let opaque = false;
        for (let offset = 0; offset < pixels.length; offset += 4) {
          if (colors.size < 32) colors.add(pixels.readUInt32BE(offset));
          transparent ||= pixels[offset + 3] === 0;
          opaque ||= pixels[offset + 3] === 255;
        }
        assert.ok(colors.size >= 32 && transparent && opaque, `${name} must contain real artwork, not a solid fill`);
        assert.match(buffer.toString("latin1"), /Modified \d{4}-\d{2}-\d{2}: resized and padded/);
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
      assertPackagedFile(path);
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
    assert.ok(iface.capabilities.every((capability) => capability.length <= 120));
    assert.ok(iface.defaultPrompt.length <= 3);
    assert.ok(iface.defaultPrompt.every((prompt) => prompt.length <= 128));
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

  it("references contained visual assets and public HTTPS listing URLs", () => {
    const iface = plugin.extensions["com.openai"].interface;
    for (const field of ["composerIcon", "composerIconDark", "logo", "logoDark"]) {
      assert.ok(iface[field].startsWith("./assets/"));
      assertPackagedFile(iface[field]);
    }
    for (const field of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
      const url = new URL(iface[field]);
      assert.equal(url.protocol, "https:");
      assert.equal(url.username + url.password + url.search + url.hash, "");
    }
  });

  it("meets OpenAI brand contrast requirements in both themes", () => {
    const iface = plugin.extensions["com.openai"].interface;
    const luminance = (hex) => {
      assert.match(hex, /^#[0-9A-Fa-f]{6}$/);
      const channels = hex.slice(1).match(/../g).map((value) => parseInt(value, 16) / 255);
      const [r, g, b] = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    for (const [color, background] of [[iface.brandColor, "#FFFFFF"], [iface.brandColorDark, "#212121"]]) {
      const a = luminance(color);
      const b = luminance(background);
      assert.ok((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) >= 2);
    }
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
    assert.deepEqual(Object.keys(mcp).sort(), ["extensions", "type", "url"]);
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

  it("uses unique valid names and conservative annotations for irreversible effects", () => {
    const readOnly = new Set([
      "acr_list_rooms", "acr_get_messages", "acr_get_agent_did", "acr_verify_message_sig",
      "acr_get_consensus_state", "acr_get_goal_dag",
    ]);
    const openWorld = new Set([
      "acr_list_rooms", "acr_create_room", "acr_join_room", "acr_post_message", "acr_get_messages",
      "acr_get_agent_did", "acr_verify_message_sig", "acr_propose_action", "acr_cast_vote", "acr_get_consensus_state",
    ]);
    assert.equal(new Set(catalog.tools.map((tool) => tool.name)).size, catalog.tools.length);
    for (const tool of catalog.tools) {
      assert.match(tool.name, /^[A-Za-z0-9_-]{1,64}$/);
      assert.equal(tool.annotations.readOnlyHint, readOnly.has(tool.name), `${tool.name}.readOnlyHint`);
      assert.equal(tool.annotations.destructiveHint, !readOnly.has(tool.name), `${tool.name}.destructiveHint`);
      assert.equal(tool.annotations.openWorldHint, openWorld.has(tool.name), `${tool.name}.openWorldHint`);
    }
  });
});

describe("Interactive MCP Apps Canvas (.app.json)", () => {
  const app = JSON.parse(readFileSync(join(root, ".app.json"), "utf-8"));

  it("declares mcp-app MIME profile and entrypoint", () => {
    assert.equal(app.mimeType, "text/html;profile=mcp-app");
    assertPackagedFile(app.entrypoint);
    assert.ok(app.capabilities.rendering.includes("canvas"));
    assert.equal(app.capabilities.realtime, false);
    assert.match(app.description, /local preview/i);
    assert.deepEqual(app.bindings, {});
  });

  it("restricts scripts, connections and forms and contains no unsafe rendering", () => {
    const html = readFileSync(join(root, app.entrypoint), "utf-8");
    const script = readFileSync(join(root, "web-ui", "canvas-app.js"), "utf-8");
    assert.match(html, /http-equiv="Content-Security-Policy"/);
    assert.match(html, /default-src 'none'/);
    assert.match(html, /script-src 'self';/);
    assert.match(html, /connect-src 'none'/);
    assert.match(html, /form-action 'none'/);
    assert.match(html, /<script src="\.\/canvas-app\.js" defer><\/script>/);
    assert.doesNotMatch(html, /<script(?:\s[^>]*)?>(?!<\/script>)/);
    assert.doesNotMatch(`${html}\n${script}`, /\b(?:alert|prompt|eval|fetch|XMLHttpRequest|WebSocket)\s*\(|innerHTML|outerHTML|insertAdjacentHTML|\bon\w+\s*=/);
    assert.ok(html.indexOf("Content-Security-Policy") < html.indexOf("<style>"));
    assert.match(html, /#vote-status\s*\{[^}]*overflow-wrap:\s*anywhere;/);
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
      assert.match(content, /^---\r?\n/);
      assert.ok(content.includes(`name: ${skill}`));
      assert.ok(content.includes("Do NOT"));

      // Sub-400-word leaf invariant
      const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "");
      const words = body.trim().split(/\s+/).filter(Boolean).length;
      assert.ok(words < 400, `Word count ${words} must be < 400`);
    });
  }
});
