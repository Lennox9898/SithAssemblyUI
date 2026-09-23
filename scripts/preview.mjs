import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { contentTypes, isPublicPath, securityHeaders } from './policy.mjs';

export async function createPreviewServer(directory) {
  const root = await realpath(directory);
  const withinRoot = value => value === root || value.startsWith(root + path.sep);
  const readPublicFile = async candidate => {
    const resolved = await realpath(candidate);
    const relative = path.relative(root, resolved).split(path.sep).join('/');
    if (!withinRoot(resolved) || !isPublicPath(relative) || !(await stat(resolved)).isFile()) {
      const error = new Error('Not a public file');
      error.code = 'ENOENT';
      throw error;
    }
    return { body: await readFile(resolved), type: contentTypes[path.extname(resolved).toLowerCase()] };
  };
  const server = http.createServer({ headersTimeout: 10_000, requestTimeout: 30_000, keepAliveTimeout: 5_000 }, async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { ...securityHeaders, 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-store' });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    try {
      // A loopback listener alone does not reject DNS-rebinding Host names.
      const host = request.headers.host || '';
      const localHost = /^(?:localhost|127\.0\.0\.1|\[::1\])(?::([0-9]+))?$/i.exec(host);
      if (!localHost || (localHost[1] && Number(localHost[1]) !== request.socket.localPort)) return send(403, 'Local preview only');
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD');
        return send(405, 'Method not allowed');
      }
      if (!request.url.startsWith('/') || request.url.startsWith('//')) return send(400, 'Bad request');
      // Check before URL normalization can remove dot segments.
      const pathname = decodeURIComponent(request.url.split('?')[0]);
      const segments = pathname.split('/');
      if (/[\\\x00-\x1f\x7f:?#]/.test(pathname) || segments.some(part => part.startsWith('.') || /[. ]$/.test(part))) {
        return send(404, 'Not found');
      }
      let candidate = path.resolve(root, `.${pathname}`);
      if (!withinRoot(candidate)) return send(404, 'Not found');
      try {
        if ((await stat(candidate)).isDirectory()) candidate = path.join(candidate, 'index.html');
        const file = await readPublicFile(candidate);
        return send(200, file.body, file.type);
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) throw error;
        try {
          const file = await readPublicFile(path.join(root, '404.html'));
          return send(404, file.body, file.type);
        } catch {
          return send(404, 'Not found');
        }
      }
    } catch (error) {
      if (error instanceof URIError || error instanceof TypeError) return send(400, 'Bad request');
      console.error(error.message);
      return send(500, 'Preview error');
    }
  });
  server.maxHeadersCount = 50;
  server.maxRequestsPerSocket = 100;
  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const folder = process.argv[2] || 'site';
  if (!['site', 'dist'].includes(folder)) throw new Error('Choose site or dist');
  const portFlag = process.argv.indexOf('--port');
  const port = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port');
  const directory = fileURLToPath(new URL(`../${folder}/`, import.meta.url));
  const server = await createPreviewServer(directory);
  server.on('error', error => { console.error(error.message); process.exitCode = 1; });
  server.listen(port, '127.0.0.1', () => {
    console.log(`Sith Assembly preview: http://127.0.0.1:${server.address().port} (${folder}/)`);
    console.log('Local preview only. Reload the browser after editing. Stop with Ctrl+C.');
  });
}
