// Non-mutating hosted authorization QA. Never prints tokens or response bodies.
import { publicPreflight, catalogErrors } from './check-release.mjs';
import { readFileSync } from 'node:fs';

const endpoint = 'https://mcp.agentchatrooms.dev/mcp';
const bridge = 'https://agentchatrooms.dev/api/cloud/mcp/bridge';
const metadata = 'https://mcp.agentchatrooms.dev/.well-known/oauth-protected-resource/mcp';
const checks = [];
async function check(name, url, options, inspect) {
  try {
    const response = await fetch(url, { ...options, redirect: 'error', signal: AbortSignal.timeout(15000) });
    const issues = await inspect(response);
    checks.push({ name, status: response.status, passed: issues.length === 0, issues });
  } catch {
    checks.push({ name, passed: false, issues: ['request failed, redirected, or timed out'] });
  }
}
const post = (method, authorization) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json, text/event-stream', ...(authorization ? { Authorization: authorization } : {}) },
  body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: method === 'initialize'
    ? { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'acr-hosted-qa', version: '1.0.0' } } : {} }),
});
const unauthorized = async response => response.status === 401 &&
  (response.headers.get('www-authenticate') || '').includes(`resource_metadata="${metadata}"`)
  ? [] : ['expected 401 with exact resource-metadata challenge'];

const publicReport = await publicPreflight();
for (const [label, authorization] of [['anonymous', undefined], ['invalid opaque', 'Bearer oat_acr_qa_invalid'],
  ['malformed JWT', 'Bearer invalid.invalid.invalid'], ['wrong auth scheme', 'Basic invalid']]) {
  await check(`${label} initialize`, endpoint, post('initialize', authorization), unauthorized);
}
await check('anonymous tools/list', endpoint, post('tools/list'), unauthorized);
for (const [label, authorization] of [['anonymous', undefined], ['invalid token', 'Bearer oat_acr_qa_invalid']]) {
  await check(`${label} Cloud bridge`, bridge, { headers: authorization ? { Authorization: authorization } : {} },
    async r => r.status === 401 ? [] : ['expected HTTP 401']);
}

// Optional token must come from a completed user OAuth grant, never a management key.
const token = process.env.ACR_QA_OAUTH_ACCESS_TOKEN;
if (token) {
  if (/^(sk_|pk_|gh[opusr]_)/.test(token)) throw new Error('Use a user OAuth access token, not a management credential.');
  await check('authenticated tools/list parity', endpoint, post('tools/list', `Bearer ${token}`), async response => {
    if (!response.ok) return ['authenticated request rejected'];
    const raw = await response.text();
    const payloads = response.headers.get('content-type')?.includes('text/event-stream')
      ? raw.split(/\r?\n/).filter(line => line.startsWith('data:')).map(line => JSON.parse(line.slice(5)))
      : [JSON.parse(raw)];
    const result = payloads.find(p => p.id === 1)?.result;
    if (result?.nextCursor) return ['paginated catalog requires complete capture'];
    const expected = JSON.parse(readFileSync(new URL('../tool-catalog.json', import.meta.url), 'utf8')).tools;
    return catalogErrors(expected, result?.tools);
  });
}
const report = { checkedAt: new Date().toISOString(), publicPreflight: publicReport,
  checks, passed: publicReport.passed && checks.every(c => c.passed),
  authenticatedCatalogAttempted: Boolean(token),
  unverified: ['successful interactive consent and token exchange', 'paid account tool calls',
    'expired/wrong-audience/underscoped authentic tokens', 'workflow execution', 'ChatGPT reviewer scenarios', 'portal approval'] };
console.log(JSON.stringify(report, null, 2));
process.exitCode = report.passed ? 0 : 1;
