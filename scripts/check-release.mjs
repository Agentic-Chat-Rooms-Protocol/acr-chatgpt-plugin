// Public, unauthenticated preflight. Never calls tools/call or prints response bodies.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const root = new URL('../', import.meta.url);
const issuers = ['https://clerk.agentchatrooms.dev'];
const read = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
const safeURL = value => {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !u.search && !u.hash;
  } catch { return false; }
};

export function authorizationErrors(metadata, issuer, scopes) {
  const errors = [];
  if (metadata?.issuer !== issuer) errors.push('issuer mismatch');
  for (const key of ['authorization_endpoint', 'token_endpoint']) {
    if (!safeURL(metadata?.[key])) errors.push(`missing or unsafe ${key}`);
  }
  if (!Array.isArray(metadata?.response_types_supported) || !metadata.response_types_supported.includes('code')) errors.push('authorization code unsupported');
  if (!Array.isArray(metadata?.code_challenge_methods_supported) || !metadata.code_challenge_methods_supported.includes('S256')) errors.push('PKCE S256 unsupported');
  if (!Array.isArray(metadata?.scopes_supported) || scopes.some(s => !metadata.scopes_supported.includes(s))) errors.push('required scopes not advertised');
  return errors;
}

export function catalogErrors(expected, actual) {
  if (!Array.isArray(actual)) return ['tools must be an array'];
  const errors = [];
  const names = actual.map(t => t?.name);
  if (new Set(names).size !== names.length) errors.push('duplicate live tool names');
  for (const tool of expected) {
    const live = actual.find(t => t?.name === tool.name);
    if (!live) { errors.push(`missing ${tool.name}`); continue; }
    for (const field of ['description', 'inputSchema', 'outputSchema']) {
      if (!isDeepStrictEqual(tool[field], live[field])) errors.push(`${tool.name}: ${field} differs`);
    }
    for (const hint of ['readOnlyHint', 'destructiveHint', 'openWorldHint']) {
      if (live.annotations?.[hint] !== tool.annotations[hint]) errors.push(`${tool.name}: ${hint} differs`);
    }
  }
  for (const name of names) if (!expected.some(t => t.name === name)) errors.push(`unexpected tool ${name}`);
  return errors;
}

export async function publicPreflight(request = fetch) {
  const plugin = read('plugin.json').extensions['com.openai'];
  const auth = read('mcp.json').mcpServers.acr.extensions['com.openai'].auth;
  const results = [];
  async function check(name, url, inspect, options = {}) {
    try {
      const response = await request(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
      const issues = await inspect(response);
      results.push({ name, url, status: response.status, passed: issues.length === 0, issues });
    } catch {
      results.push({ name, url, passed: false, issues: ['request failed, redirected, or timed out'] });
    }
  }
  for (const key of ['websiteURL', 'supportURL', 'privacyPolicyURL', 'termsOfServiceURL']) {
    await check(key, plugin.interface[key], async r => r.status === 200 ? [] : ['expected HTTP 200']);
  }
  await check('domain challenge', new URL(plugin.review.domain_verification.path, plugin.interface.websiteURL).href,
    async r => r.status === 200 && (await r.text()).trim() === plugin.review.domain_verification.token ? [] : ['challenge missing or mismatched']);
  const metadataURL = 'https://mcp.agentchatrooms.dev/.well-known/oauth-protected-resource/mcp';
  await check('protected resource', metadataURL, async r => {
    if (r.status !== 200) return ['expected HTTP 200'];
    const data = await r.json();
    return data.resource === auth.resource && Array.isArray(data.authorization_servers) && data.authorization_servers.length > 0
      && data.authorization_servers.every(safeURL)
      && isDeepStrictEqual([...data.authorization_servers].sort(), [...issuers].sort())
      ? [] : ['invalid resource or authorization servers; review advertised issuer changes'];
  });
  // Fixed advertised issuers: do not fetch arbitrary destinations returned by a server.
  for (const issuer of issuers) {
    const u = new URL(issuer);
    const url = `${u.origin}/.well-known/oauth-authorization-server${u.pathname === '/' ? '' : u.pathname}`;
    await check('authorization discovery', url, async r => r.status === 200
      ? authorizationErrors(await r.json(), issuer, auth.baseScopes) : ['expected OAuth metadata with HTTP 200']);
  }
  await check('unauthenticated MCP initialize', auth.resource, async r =>
    r.status === 401 && /Bearer/i.test(r.headers.get('www-authenticate') || '')
      && (r.headers.get('www-authenticate') || '').includes(`resource_metadata="${metadataURL}"`)
      ? [] : ['expected HTTP 401 with Bearer challenge and exact resource metadata URL'], {
      method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'acr-public-preflight', version: '1.0.0' } } }),
    });
  return { checkedAt: new Date().toISOString(), passed: results.every(r => r.passed), checks: results,
    unverified: ['interactive OAuth and client registration', 'authenticated tools/list and tool behavior', 'token audience, expiry, scopes and rate limits', 'portal domain verification', 'reviewer account and video', 'OpenAI approval'] };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length > 3) throw new Error('Usage: node scripts/check-release.mjs [tools-list.json]');
  const report = await publicPreflight();
  if (process.argv[2]) {
    const snapshot = JSON.parse(readFileSync(process.argv[2], 'utf8'));
    report.catalogIssues = catalogErrors(read('tool-catalog.json').tools, snapshot.result?.tools ?? snapshot.tools);
    report.passed &&= report.catalogIssues.length === 0;
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.passed ? 0 : 1;
}
