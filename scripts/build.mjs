import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isPublicPath } from './policy.mjs';

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

export async function validateContent(directory) {
  const source = await lstat(directory);
  if (!source.isDirectory() || source.isSymbolicLink()) throw new Error('site must be a normal directory');
  const files = await listFiles(directory);
  for (const required of ['index.html', '404.html', '.htaccess', 'robots.txt']) {
    if (!files.includes(required)) throw new Error(`Missing site/${required}`);
  }
  for (const file of files) {
    if (!isPublicPath(file, { allowConfig: true })) throw new Error(`Not public website content: ${file}`);
  }
  return files;
}

export async function build() {
  const files = await validateContent(sourceRoot);

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
