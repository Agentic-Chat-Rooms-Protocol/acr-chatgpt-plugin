import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { authorizationErrors, catalogErrors, publicPreflight } from '../scripts/check-release.mjs';

test('OAuth metadata rejects wrong issuer, missing PKCE, unsafe endpoints and missing scopes', () => {
  const issuer = 'https://auth.example.com';
  const data = { issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`,
    response_types_supported: ['code'], code_challenge_methods_supported: ['S256'], scopes_supported: ['acr:rooms'] };
  assert.deepEqual(authorizationErrors(data, issuer, ['acr:rooms']), []);
  for (const [key, value] of [['issuer', 'https://wrong.example'], ['code_challenge_methods_supported', ['plain']],
    ['token_endpoint', 'http://auth.example.com/token'], ['authorization_endpoint', 'https://user:secret@auth.example.com/authorize'],
    ['scopes_supported', []], ['response_types_supported', ['token']]]) {
    assert.ok(authorizationErrors({ ...data, [key]: value }, issuer, ['acr:rooms']).length > 0, key);
  }
  assert.ok(authorizationErrors(null, issuer, ['acr:rooms']).length > 0);
});

test('catalog comparison detects schema drift, hint omissions, missing, duplicate and extra tools', () => {
  const tool = { name: 'list', description: 'List', inputSchema: { type: 'object' }, outputSchema: { type: 'object' },
    annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false } };
  assert.deepEqual(catalogErrors([tool], [structuredClone(tool)]), []);
  for (const actual of [null, [], [tool, tool], [tool, { ...tool, name: 'extra' }],
    [{ ...tool, annotations: {} }], [{ ...tool, inputSchema: {} }], [{ ...tool, outputSchema: undefined }]]) {
    assert.ok(catalogErrors([tool], actual).length > 0);
  }
});

test('public preflight fails closed on outages without logging bodies or calling tools', async () => {
  const methods = [];
  const report = await publicPreflight(async (url, options) => {
    if (options.body) methods.push(JSON.parse(options.body).method);
    if (url.includes('privacy')) throw new Error('private diagnostic');
    return new Response('sensitive upstream body', { status: 503 });
  });
  assert.equal(report.passed, false);
  assert.equal(report.checks.length, 8);
  assert.ok(report.checks.every(c => !c.passed));
  assert.deepEqual(methods, ['initialize']);
  assert.doesNotMatch(JSON.stringify(report), /private diagnostic|sensitive upstream body/);
  assert.ok(report.unverified.includes('OpenAI approval'));
});

test('passing public checks retain unverified release gates and reject discovery drift', async () => {
  const plugin = JSON.parse(readFileSync(new URL('../plugin.json', import.meta.url), 'utf8'));
  const issuers = ['https://clerk.agentchatrooms.dev'];
  let drift = false;
  const request = async (url, options) => {
    assert.equal(options.redirect, 'error');
    if (url.endsWith('/.well-known/openai-apps-challenge')) return new Response(plugin.extensions['com.openai'].review.domain_verification.token);
    if (url.includes('oauth-protected-resource')) return Response.json({ resource: 'https://mcp.agentchatrooms.dev/mcp', authorization_servers: drift ? ['https://unexpected.example'] : issuers });
    if (url.includes('oauth-authorization-server')) {
      const issuer = issuers[0];
      return Response.json({ issuer, authorization_endpoint: `${issuer}/authorize`, token_endpoint: `${issuer}/token`,
        response_types_supported: ['code'], code_challenge_methods_supported: ['S256'], scopes_supported: ['profile', 'email'] });
    }
    if (options.method === 'POST') return new Response('', { status: 401, headers: { 'WWW-Authenticate': 'Bearer resource_metadata="https://mcp.agentchatrooms.dev/.well-known/oauth-protected-resource/mcp"' } });
    return new Response('public page');
  };
  const report = await publicPreflight(request);
  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 8);
  assert.ok(report.unverified.length > 0);
  drift = true;
  assert.equal((await publicPreflight(request)).passed, false);
});
