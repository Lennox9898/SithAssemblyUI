import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectId = 'f06760fe-4f7e-4ffc-81b7-ba7fdc5cc324';
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function sshUsernameSecretName(deploymentId) {
  if (!uuid.test(deploymentId || '')) throw new Error('Invalid deployment ID');
  return `IONOS_DEPLOYMENT_${deploymentId.toUpperCase().replaceAll('-', '_')}_SSH_USERNAME`;
}

export function validateDeployment(env) {
  if (env.PROJECT_ID !== projectId) throw new Error('Unexpected IONOS project');
  if (!uuid.test(env.BRANCH_ID || '')) throw new Error('Invalid branch ID');
  if (!/^[0-9a-f]{40}$/i.test(env.VERSION || '')) throw new Error('Invalid artifact version');
  sshUsernameSecretName(env.DEPLOYMENT_ID);
}

export async function renderSiteUrl(directory, value) {
  const url = new URL(value);
  const dnsHostname = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
  if (url.protocol !== 'https:' || !dnsHostname.test(url.hostname) || url.hostname.length > 253 || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Expected a plain HTTPS deployment origin with a DNS hostname');
  }
  // Literal string replacement: filenames and provider data never become shell code.
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error('Symlinks are not allowed in deployment');
    const filename = path.join(directory, entry.name);
    if (entry.isDirectory()) await renderSiteUrl(filename, url.origin);
    else if (entry.isFile() && /\.(?:html|css|js|mjs|json|txt|xml|svg|webmanifest)$/i.test(entry.name)) {
      const contents = await readFile(filename, 'utf8');
      if (contents.includes('https://IONOS_DEPLOY_NOW_SITE_URL')) {
        await writeFile(filename, contents.replaceAll('https://IONOS_DEPLOY_NOW_SITE_URL', url.origin));
      }
    }
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  validateDeployment(process.env);
  if (process.argv[2] === 'prepare') {
    await renderSiteUrl(path.resolve('deployment'), process.env.SITE_URL);
    await appendFile(process.env.GITHUB_ENV, `SSH_USERNAME_SECRET=${sshUsernameSecretName(process.env.DEPLOYMENT_ID)}\n`);
  } else if (process.argv[2] !== 'validate') {
    throw new Error('Choose validate or prepare');
  }
}
