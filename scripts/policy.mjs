import path from 'node:path';

// site/ is public. This allowlist catches accidental uploads of archives,
// database dumps, server-side scripts and credentials in common key formats.
export const contentTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.webmanifest': 'application/manifest+json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.otf': 'font/otf',
  '.pdf': 'application/pdf', '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg',
};

export function isPublicPath(relative, { allowConfig = false } = {}) {
  if (allowConfig && relative === '.htaccess') return true;
  if (!relative || relative.includes('\\') || /[\x00-\x1f\x7f:?#]/.test(relative)) return false;
  if (relative.split('/').some(part => !part || part.startsWith('.') || /[. ]$/.test(part))) return false;
  return Object.hasOwn(contentTypes, path.posix.extname(relative).toLowerCase());
}

// Keep the corresponding Apache headers in site/.htaccess in sync.
export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Frame-Options': 'DENY',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'Content-Security-Policy': "default-src 'none'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'none'; connect-src 'none'; img-src 'self'; font-src 'self'; style-src 'self'; script-src 'self'; manifest-src 'self'",
};
