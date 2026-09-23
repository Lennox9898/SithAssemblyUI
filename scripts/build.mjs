import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const projectRoot = fileURLToPath(new URL('../', import.meta.url));
export const sourceRoot = path.join(projectRoot, 'site');
export const outputRoot = path.join(projectRoot, 'dist');

export async function listFiles(directory, prefix = '') {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`Symlinks are not allowed in website content: ${entry.name}`);
    const relative = path.posix.join(prefix, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(path.join(directory, entry.name), relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`Unsupported website entry: ${relative}`);
  }
  return files.sort();
}

export async function build() {
  const files = await listFiles(sourceRoot);
  for (const required of ['index.html', '404.html', '.htaccess', 'robots.txt']) {
    if (!files.includes(required)) throw new Error(`Missing site/${required}`);
  }
  for (const file of files) {
    if (file.split('/').some(part => part.startsWith('.') && part !== '.htaccess')) {
      throw new Error(`Hidden files must not be deployed: ${file}`);
    }
    if (/\.(?:pem|key|log|sqlite|db|ps1|cmd)$/i.test(file)) throw new Error(`Not website content: ${file}`);
  }

  // Only the fixed, generated dist directory inside this project can be removed.
  if (path.relative(projectRoot, outputRoot) !== 'dist') throw new Error('Unsafe output path');
  const existing = await lstat(outputRoot).catch(error => {
    if (error.code !== 'ENOENT') throw error;
    return null;
  });
  if (existing && (!existing.isDirectory() || existing.isSymbolicLink())) throw new Error('dist must be a normal directory');
  await rm(outputRoot, { recursive: true, force: true });
  await mkdir(outputRoot, { recursive: true });
  await cp(sourceRoot, outputRoot, { recursive: true, dereference: false });
  console.log(`Built ${files.length} public files in ${outputRoot}`);
  return files;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await build();
}
