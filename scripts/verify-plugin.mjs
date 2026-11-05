import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");

let errorCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`FAIL: ${message}`);
    errorCount++;
  } else {
    console.log(`PASS: ${message}`);
  }
}

function wordCount(text) {
  // Strip YAML frontmatter for leaf body word count
  const body = text.replace(/^---\r?\n[\s\S]*?\r?\n---\s*/, "");
  return body.trim().split(/\s+/).filter(Boolean).length;
}

function relativeLuminance(rgb) {
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(hex1, hex2) {
  const parseHex = (h) => {
    const clean = h.replace("#", "");
    return {
      r: parseInt(clean.slice(0, 2), 16),
      g: parseInt(clean.slice(2, 4), 16),
      b: parseInt(clean.slice(4, 6), 16),
    };
  };
  const l1 = relativeLuminance(parseHex(hex1));
  const l2 = relativeLuminance(parseHex(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

console.log("=== ACR OpenAI Plugin Local Verification Suite ===");

// 1. plugin.json
const pluginPath = join(root, "plugin.json");
assert(existsSync(pluginPath), "plugin.json exists");
const plugin = JSON.parse(readFileSync(pluginPath, "utf-8"));
assert(plugin.name === "acr-protocol", "plugin.name is 'acr-protocol'");
assert(plugin.version === "1.0.0", "plugin.version is '1.0.0'");
assert(plugin.license === "Apache-2.0", "plugin.license is 'Apache-2.0'");
assert(plugin.author?.email?.endsWith("@agentchatrooms.dev"), "author email uses @agentchatrooms.dev");
assert(plugin.homepage === "https://agentchatrooms.dev", "homepage is https://agentchatrooms.dev");

const openaiExt = plugin.extensions?.["com.openai"];
assert(Boolean(openaiExt), "extensions['com.openai'] exists");

const iface = openaiExt.interface;
assert(iface.displayName && iface.displayName.length <= 30, `displayName length (${iface.displayName?.length}) <= 30`);
assert(iface.shortDescription && iface.shortDescription.length <= 30, `shortDescription length (${iface.shortDescription?.length}) <= 30`);
assert(iface.longDescription && iface.longDescription.length <= 4000, `longDescription length <= 4000`);
assert(iface.developerName && iface.developerName.length <= 80, `developerName length <= 80`);
assert(iface.category === "Developer Tools", "category uses the OpenAI dashboard title 'Developer Tools'");
assert(Array.isArray(iface.capabilities) && iface.capabilities.length <= 20, "capabilities array <= 20 items");

// Brand color contrast
const lightRatio = contrastRatio(iface.brandColor, "#FFFFFF");
const darkRatio = contrastRatio(iface.brandColorDark, "#212121");
assert(lightRatio >= 2.0, `brandColor contrast against white (${lightRatio.toFixed(2)}) >= 2.0`);
assert(darkRatio >= 2.0, `brandColorDark contrast against #212121 (${darkRatio.toFixed(2)}) >= 2.0`);

// Images
assert(existsSync(join(root, iface.composerIcon)), `composerIcon exists (${iface.composerIcon})`);
assert(existsSync(join(root, iface.logo)), `logo exists (${iface.logo})`);
assert(existsSync(join(root, iface.composerIconDark)), `composerIconDark exists (${iface.composerIconDark})`);
assert(existsSync(join(root, iface.logoDark)), `logoDark exists (${iface.logoDark})`);

// Review test cases
const positiveCases = openaiExt.review?.test_cases?.positive;
const negativeCases = openaiExt.review?.test_cases?.negative;
assert(Array.isArray(positiveCases) && positiveCases.length === 5, `review.test_cases.positive has exactly 5 cases (got ${positiveCases?.length})`);
assert(Array.isArray(negativeCases) && negativeCases.length === 3, `review.test_cases.negative has exactly 3 cases (got ${negativeCases?.length})`);
assert(openaiExt.review?.domain_verification?.path === "/.well-known/openai-apps-challenge", "domain verification path is /.well-known/openai-apps-challenge");
assert(!openaiExt.review?.demo_recording_url, "draft does not advertise an unverified demo recording");

// 2. mcp.json
const mcpPath = join(root, "mcp.json");
assert(existsSync(mcpPath), "mcp.json exists");
const mcp = JSON.parse(readFileSync(mcpPath, "utf-8"));
const server = mcp.mcpServers.acr;
assert(server.type === "streamable-http", "MCP server uses streamable-http");
assert(server.url === "https://mcp.agentchatrooms.dev/mcp", "MCP server points to the remote gateway");
assert(server.extensions?.["com.openai"]?.auth?.type === "oauth", "MCP server requires OAuth");
const catalog = JSON.parse(readFileSync(join(root, "tool-catalog.json"), "utf-8"));

const expectedTools = [
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

assert(Array.isArray(catalog.tools) && catalog.tools.length === 15, `tool catalog has exactly 15 tools (got ${catalog.tools?.length})`);

for (const toolName of expectedTools) {
  const tool = catalog.tools.find((t) => t.name === toolName);
  assert(Boolean(tool), `Tool '${toolName}' is defined in tool-catalog.json`);
  if (tool) {
    assert(Boolean(tool.description), `Tool '${toolName}' has description`);
    assert(Boolean(tool.inputSchema), `Tool '${toolName}' has inputSchema`);
    assert(
      typeof tool.annotations?.readOnlyHint === "boolean" &&
      typeof tool.annotations?.destructiveHint === "boolean" &&
      typeof tool.annotations?.openWorldHint === "boolean",
      `Tool '${toolName}' has all 3 required OpenAI annotations (readOnlyHint, destructiveHint, openWorldHint)`
    );
  }
}

// 3. .app.json
const appPath = join(root, ".app.json");
assert(existsSync(appPath), ".app.json exists");
const app = JSON.parse(readFileSync(appPath, "utf-8"));
assert(app.mimeType === "text/html;profile=mcp-app", "app.mimeType is 'text/html;profile=mcp-app'");
assert(existsSync(join(root, app.entrypoint)), `app.entrypoint exists on disk (${app.entrypoint})`);

// 4. agents/openai.yaml
const yamlPath = join(root, "agents/openai.yaml");
assert(existsSync(yamlPath), "agents/openai.yaml exists");
const yamlContent = readFileSync(yamlPath, "utf-8");
assert(yamlContent.includes("display_name: \"Agentic Chat Rooms\""), "yaml has display_name");
assert(yamlContent.includes("brand_color: \"#4A6FA5\""), "yaml has brand_color #4A6FA5");
assert(yamlContent.includes("allow_implicit_invocation: false"), "yaml has allow_implicit_invocation: false");

// 5. skills/
const expectedSkills = [
  "acr-room-collaboration",
  "acr-identity-did",
  "acr-consensus-gate",
  "acr-atlas-dag",
  "acr-opsroom-incident",
  "acr-human-governance",
];

for (const skillName of expectedSkills) {
  const skillFile = join(root, `skills/${skillName}/SKILL.md`);
  assert(existsSync(skillFile), `Skill file exists: skills/${skillName}/SKILL.md`);
  if (existsSync(skillFile)) {
    const content = readFileSync(skillFile, "utf-8");
    assert(/^---\r?\n/.test(content), `Skill ${skillName} has YAML frontmatter header`);
    assert(content.includes(`name: ${skillName}`), `Skill ${skillName} frontmatter defines correct name`);
    assert(content.includes("description:"), `Skill ${skillName} frontmatter defines description`);
    assert(content.includes("Do NOT"), `Skill ${skillName} contains explicit negative constraints`);

    const words = wordCount(content);
    assert(words < 400, `Skill ${skillName} sub-400-word leaf invariant satisfied (count: ${words} words)`);
  }
}

// 6. Prohibited string check
const allFiles = [pluginPath, mcpPath, appPath, yamlPath, join(root, "README.md")];
for (const f of allFiles) {
  const content = readFileSync(f, "utf-8");
  assert(!content.includes("vrillabs.com"), `File ${f} contains zero occurrences of prohibited domain 'vrillabs.com'`);
}

console.log("\n==========================================");
if (errorCount === 0) {
  console.log("ALL LOCAL VERIFICATION CHECKS PASSED.");
  console.log("Gateway behavior, OAuth sign-in, and OpenAI submission acceptance still require external verification.");
  process.exit(0);
} else {
  console.error(`VERIFICATION FAILED: ${errorCount} error(s) found.`);
  process.exit(1);
}
