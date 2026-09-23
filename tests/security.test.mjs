import assert from 'node:assert/strict';
import { once } from 'node:events';
import http from 'node:http';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { validateContent } from '../scripts/build.mjs';
import { createPreviewServer } from '../scripts/preview.mjs';
import { isPublicPath, securityHeaders } from '../scripts/policy.mjs';
import { renderSiteUrl, sshUsernameSecretName, validateDeployment } from '../scripts/deployment.mjs';

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'sithasm-security-'));
  t.after(async () => {
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('sithasm-security-'));
    await rm(directory, { recursive: true, force: true });
  });
  return directory;
}

async function website(directory) {
  await mkdir(directory, { recursive: true });
  for (const [name, text] of Object.entries({ 'index.html': 'PUBLIC HOME', '404.html': 'PUBLIC NOT FOUND', '.htaccess': 'PRIVATE CONFIG', 'robots.txt': 'User-agent: *' })) {
    await writeFile(path.join(directory, name), text);
  }
}

async function preview(t, directory) {
  const server = await createPreviewServer(directory);
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
    server.closeAllConnections();
  }));
  const port = server.address().port;
  return (target, { method = 'GET', host = `127.0.0.1:${port}` } = {}) => new Promise((resolve, reject) => {
    const request = http.request({ hostname: '127.0.0.1', port, path: target, method, headers: { Host: host } }, response => {
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({ status: response.statusCode, headers: response.headers, body: Buffer.concat(chunks).toString() }));
    });
    request.on('error', reject);
    request.end();
  });
}

test('build rejects backup files and executable/configuration formats before publishing', async t => {
  const directory = await fixture(t);
  await website(directory);
  assert.equal((await validateContent(directory)).length, 4);
  for (const name of ['dump.sql', 'server.php', 'server.phtml', 'certificate.pfx', 'backup.zip', 'index.html.bak', 'private.env', '.env', '.hidden.json']) {
    await writeFile(path.join(directory, name), 'SYNTHETIC PRIVATE DATA');
    await assert.rejects(validateContent(directory), /Not public website content/);
    await rm(path.join(directory, name));
  }
});

test('build rejects a linked source root and nested directory links', async t => {
  const directory = await fixture(t);
  const real = path.join(directory, 'real');
  const linked = path.join(directory, 'linked');
  await website(real);
  await symlink(real, linked, 'junction');
  await assert.rejects(validateContent(linked), /normal directory/);
  await symlink(real, path.join(real, 'recursive-link'), 'junction');
  await assert.rejects(validateContent(real), /Symlinks/);
});

test('public path rules reject hidden segments, alternate streams and Windows aliases', () => {
  for (const value of ['.env', '.htaccess/config.json', 'assets/.env.txt', 'index.html:private', 'index.html.', 'index.html ', '../index.html', '/index.html', 'assets\\file.txt', 'image.svg\0.txt', 'photo.jpg?fake=.txt']) {
    assert.equal(isPublicPath(value), false, value);
  }
  assert.equal(isPublicPath('.htaccess', { allowConfig: true }), true);
  assert.equal(isPublicPath('assets/project photo.webp'), true);
  assert.equal(isPublicPath('assets/Geist-LICENSE.txt'), true);
});

test('preview enforces request boundaries and returns security headers on errors', async t => {
  const directory = await fixture(t);
  await website(directory);
  const request = await preview(t, directory);
  assert.equal((await request('/')).body, 'PUBLIC HOME');
  assert.equal((await request('/', { method: 'HEAD' })).body, '');
  assert.equal((await request('/', { host: 'attacker.invalid' })).status, 403);
  assert.equal((await request('/', { host: 'localhost.attacker.invalid' })).status, 403);
  assert.equal((await request('http://attacker.invalid/')).status, 400);
  assert.equal((await request('//attacker.invalid/')).status, 400);
  assert.equal((await request('/%E0%A4%A')).status, 400);
  for (const target of ['/.htaccess', '/%2eenv', '/..%2findex.html', '/%2e%2e%5cindex.html', '/index.html:secret', '/index.html%00', '/index.html.', '/index.html%20']) {
    assert.equal((await request(target)).status, 404, target);
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await request('/', { method });
    assert.equal(response.status, 405);
    assert.equal(response.headers.allow, 'GET, HEAD');
  }
  for (const target of ['/', '/missing']) {
    const response = await request(target);
    for (const [name, value] of Object.entries(securityHeaders)) assert.equal(response.headers[name.toLowerCase()], value);
  }
});

test('preview cannot follow aliases into hidden or external directories', async t => {
  const directory = await fixture(t);
  const root = path.join(directory, 'site');
  await website(root);
  const hidden = path.join(root, '.private');
  const outside = path.join(directory, 'outside');
  for (const target of [hidden, outside]) {
    await mkdir(target);
    await writeFile(path.join(target, 'index.html'), 'SYNTHETIC PRIVATE DATA');
  }
  await symlink(hidden, path.join(root, 'hidden-alias'), 'junction');
  await symlink(outside, path.join(root, 'outside-alias'), 'junction');
  const request = await preview(t, root);
  for (const target of ['/hidden-alias/', '/outside-alias/']) {
    const response = await request(target);
    assert.equal(response.status, 404);
    assert.doesNotMatch(response.body, /PRIVATE/);
  }
});

test('preview rejects unsafe content even when it is present in the source directory', async t => {
  const directory = await fixture(t);
  await website(directory);
  await writeFile(path.join(directory, 'backup.sql'), 'SYNTHETIC PRIVATE DATA');
  const request = await preview(t, directory);
  assert.equal((await request('/backup.sql')).status, 404);
});

test('deployment identifiers cannot inject shell commands or environment lines', () => {
  const valid = { PROJECT_ID: 'f06760fe-4f7e-4ffc-81b7-ba7fdc5cc324', BRANCH_ID: '8ca704b5-ec3e-4a21-b842-d8786784d22a', VERSION: 'a'.repeat(40), DEPLOYMENT_ID: 'd1eb4966-83c6-4110-a671-25c70fb020b8' };
  assert.doesNotThrow(() => validateDeployment(valid));
  assert.equal(sshUsernameSecretName(valid.DEPLOYMENT_ID), 'IONOS_DEPLOYMENT_D1EB4966_83C6_4110_A671_25C70FB020B8_SSH_USERNAME');
  for (const key of Object.keys(valid)) {
    for (const input of ['', '$(touch marker)', 'x\nINJECTED=true', '../outside']) {
      assert.throws(() => validateDeployment({ ...valid, [key]: input }));
    }
  }
});

test('site URL rendering supports spaces in filenames and leaves binary assets unchanged', async t => {
  const directory = await fixture(t);
  const token = 'https://IONOS_DEPLOY_NOW_SITE_URL';
  const textFile = path.join(directory, 'page with spaces.html');
  const binary = Buffer.from([0, 255, 128, 1]);
  await writeFile(textFile, `${token}/login/ ${token}`);
  await writeFile(path.join(directory, 'font.woff2'), binary);
  await renderSiteUrl(directory, 'https://sith-assembly.com/');
  assert.equal(await readFile(textFile, 'utf8'), 'https://sith-assembly.com/login/ https://sith-assembly.com');
  assert.deepEqual(await readFile(path.join(directory, 'font.woff2')), binary);
  for (const value of ['http://example.com', 'https://user:password@example.com', "https://example.com/';touch marker", "https://quoted'host.example", 'https://example.com/?x=1', 'https://example.com/#fragment']) {
    await assert.rejects(renderSiteUrl(directory, value));
  }
});

test('Apache and local preview use the same browser security policy', async () => {
  const apache = await readFile(new URL('../site/.htaccess', import.meta.url), 'utf8');
  for (const [name, value] of Object.entries(securityHeaders)) {
    assert.ok(apache.includes(`Header always set ${name} "${value}"`), name);
  }
});
