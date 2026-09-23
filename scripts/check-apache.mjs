import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmod, cp, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { securityHeaders } from './policy.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const directory = await mkdtemp(path.join(os.tmpdir(), 'sithasm-apache-'));
const containerName = `sithasm-apache-${process.pid}-${Date.now()}`;
const docker = args => execFileSync('docker', args, { encoding: 'utf8', timeout: 120_000, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let started = false;
try {
  await cp(path.join(root, 'dist'), directory, { recursive: true });
  await chmod(directory, 0o755);
  for (const filename of ['backup.sql', 'archive.zip', 'private.env', 'certificate.pem', 'debug.php']) {
    await writeFile(path.join(directory, filename), 'SYNTHETIC PRIVATE DATA');
  }
  docker(['run', '--detach', '--rm', '--name', containerName, '--read-only', '--user', '65534:65534', '--cap-drop', 'ALL', '--security-opt', 'no-new-privileges', '--tmpfs', '/tmp:rw,noexec,nosuid,size=16m,mode=1777', '--publish', '127.0.0.1::8080', '--mount', `type=bind,src=${directory},dst=/usr/local/apache2/htdocs,readonly`, '--mount', `type=bind,src=${path.join(root, 'scripts', 'apache-test.conf')},dst=/usr/local/apache2/conf/httpd.conf,readonly`, 'httpd:2.4-alpine']);
  started = true;
  const port = docker(['port', containerName, '8080/tcp']).split(':').at(-1);
  const origin = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let attempt = 0; attempt < 20; attempt++) {
    try { await fetch(origin, { signal: AbortSignal.timeout(2000) }); ready = true; break; }
    catch { await new Promise(resolve => setTimeout(resolve, 250)); }
  }
  assert.ok(ready, 'Apache did not start');
  let checks = 0;
  for (const route of ['/', '/login/', '/assets/style.css', '/assets/login.css', '/assets/login.js', '/assets/fonts/Geist-Variable.woff2']) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 200, route);
    for (const [name, value] of Object.entries(securityHeaders)) assert.equal(response.headers.get(name), value, `${route}: ${name}`);
    assert.equal(response.headers.get('strict-transport-security'), 'max-age=31536000');
    await response.arrayBuffer();
    checks++;
  }
  for (const route of ['/missing', '/assets/style']) {
    const response = await fetch(origin + route);
    assert.equal(response.status, 404, route);
    assert.match(await response.text(), /Seite nicht gefunden/);
    checks++;
  }
  for (const route of ['/.htaccess', '/.env', '/.git/config', '/backup.sql', '/archive.zip', '/private.env', '/certificate.pem', '/debug.php', '/assets/']) {
    const response = await fetch(origin + route);
    assert.ok([403, 404].includes(response.status), `${route}: ${response.status}`);
    assert.doesNotMatch(await response.text(), /SYNTHETIC PRIVATE DATA/);
    checks++;
  }
  for (const method of ['POST', 'PUT', 'DELETE', 'OPTIONS']) {
    const response = await fetch(origin, { method });
    assert.equal(response.status, 405, method);
    assert.equal(response.headers.get('allow'), 'GET, HEAD');
    await response.arrayBuffer();
    checks++;
  }
  const head = await fetch(origin, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(origin + '/login/')).headers.get('cache-control'), 'no-store');
  console.log(`PASS: ${checks + 2} Apache route, policy, method and disclosure checks.`);
} catch (error) {
  if (started) {
    try { console.error(docker(['logs', containerName])); } catch { /* Preserve the original error. */ }
  }
  throw error;
} finally {
  if (started) {
    try { docker(['stop', '--time', '1', containerName]); }
    catch (error) { console.error(`Could not stop test container ${containerName}: ${error.message}`); process.exitCode = 1; }
  }
  assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
  assert.ok(path.basename(directory).startsWith('sithasm-apache-'));
  await rm(directory, { recursive: true, force: true });
}
