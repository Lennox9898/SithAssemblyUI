import assert from 'node:assert/strict';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { build, outputRoot } from './build.mjs';
import { createPreviewServer } from './preview.mjs';

const files = await build();
const server = await createPreviewServer(outputRoot);
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const origin = `http://127.0.0.1:${server.address().port}`;
let checks = 0;

try {
  for (const file of files.filter(file => !file.startsWith('.'))) {
    const response = await fetch(`${origin}/${file}`);
    assert.equal(response.status, 200, `Cannot serve ${file}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(path.join(outputRoot, file)), `Changed bytes: ${file}`);
    checks++;
  }
  for (const file of files.filter(file => file.endsWith('.html'))) {
    const html = await readFile(path.join(outputRoot, file), 'utf8');
    assert.match(html, /<html lang="de">/, `Missing language: ${file}`);
    for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      const target = new URL(match[1], `${origin}/${file}`);
      if (target.origin !== origin) continue;
      const response = await fetch(target);
      assert.equal(response.status, 200, `Broken link in ${file}: ${match[1]}`);
      if (target.hash) {
        const destination = await response.text();
        assert.ok(destination.includes(`id="${decodeURIComponent(target.hash.slice(1))}"`), `Broken anchor: ${match[1]}`);
      }
      checks++;
    }
  }
  for (const route of ['/not-a-page', '/assets/missing.css', '/.htaccess', '/.env', '/.git/config', '/package.json', '/scripts/build.mjs', '/%2e%2e%5cpackage.json']) {
    assert.equal((await fetch(origin + route)).status, 404, `Unexpected exposure/fallback: ${route}`);
    checks++;
  }
  const missing = await fetch(`${origin}/not-a-page`);
  assert.match(await missing.text(), /Seite nicht gefunden/);
  const head = await fetch(origin, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.match((await fetch(`${origin}/assets/style.css`)).headers.get('content-type'), /^text\/css/);
  assert.equal((await fetch(origin, { method: 'POST' })).status, 405);
  checks += 5;
  console.log(`PASS: ${checks} build, content, link and HTTP checks.`);
} finally {
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
