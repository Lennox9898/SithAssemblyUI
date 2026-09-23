import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2' };

export async function createPreviewServer(directory) {
  const root = await realpath(directory);
  return http.createServer(async (request, response) => {
    const send = (status, body, type = 'text/plain; charset=utf-8') => {
      response.writeHead(status, { 'Content-Type': type, 'Content-Length': Buffer.byteLength(body), 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      response.end(request.method === 'HEAD' ? undefined : body);
    };
    try {
      if (!['GET', 'HEAD'].includes(request.method)) {
        response.setHeader('Allow', 'GET, HEAD');
        return send(405, 'Method not allowed');
      }
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      const segments = pathname.split('/');
      if (pathname.includes('\\') || pathname.includes('\0') || segments.some(part => part.startsWith('.'))) {
        return send(404, 'Not found');
      }
      let candidate = path.resolve(root, `.${pathname}`);
      const withinRoot = value => value === root || value.startsWith(root + path.sep);
      if (!withinRoot(candidate)) return send(404, 'Not found');
      try {
        if ((await stat(candidate)).isDirectory()) candidate = path.join(candidate, 'index.html');
        candidate = await realpath(candidate);
        if (!withinRoot(candidate)) return send(404, 'Not found');
        const body = await readFile(candidate);
        return send(200, body, types[path.extname(candidate)] || 'application/octet-stream');
      } catch (error) {
        if (!['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) throw error;
        const body = await readFile(path.join(root, '404.html'));
        return send(404, body, types['.html']);
      }
    } catch (error) {
      if (error instanceof URIError || error instanceof TypeError) return send(400, 'Bad request');
      console.error(error.message);
      return send(500, 'Preview error');
    }
  });
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
