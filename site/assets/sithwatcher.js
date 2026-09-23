const watcher = {
  card: document.querySelector('[data-sithwatcher]'),
  button: document.querySelector('[data-sithwatcher-test]'),
  indicator: document.querySelector('[data-sithwatcher-indicator]'),
  branch: document.querySelector('[data-sithwatcher-branch]'),
  bridge: document.querySelector('[data-sithwatcher-bridge]'),
  result: document.querySelector('[data-sithwatcher-result]')
};

const repositoryEndpoint = 'https://api.github.com/repos/Lennox9898/SithAssembly-SithInsta';

function formatRepositoryDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Zeitpunkt unbekannt';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date);
}

async function testRepositoryConnection() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);

  watcher.card.dataset.state = 'checking';
  watcher.button.disabled = true;
  watcher.indicator.lastChild.textContent = ' CHECKING';
  watcher.result.textContent = 'Öffentliche GitHub-Metadaten werden geprüft …';

  try {
    const response = await fetch(repositoryEndpoint, {
      headers: { Accept: 'application/vnd.github+json' },
      referrerPolicy: 'no-referrer',
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`GitHub antwortet mit HTTP ${response.status}`);
    const repository = await response.json();
    if (repository.full_name !== 'Lennox9898/SithAssembly-SithInsta') {
      throw new Error('Unerwartete Repository-Antwort');
    }

    watcher.card.dataset.state = 'connected';
    watcher.indicator.lastChild.textContent = ' CONNECTED';
    watcher.branch.textContent = repository.default_branch || 'main';
    watcher.bridge.textContent = 'GitHub read-only / connected';
    watcher.result.textContent = `Repository erreichbar · letzter Push ${formatRepositoryDate(repository.pushed_at)}`;
  } catch (error) {
    watcher.card.dataset.state = 'error';
    watcher.indicator.lastChild.textContent = ' RETRY';
    watcher.bridge.textContent = 'read-only / prepared';
    watcher.result.textContent = error.name === 'AbortError'
      ? 'GitHub hat nicht rechtzeitig geantwortet. Die Runtime bleibt getrennt.'
      : `Test nicht abgeschlossen: ${error.message}`;
  } finally {
    window.clearTimeout(timeout);
    watcher.button.disabled = false;
  }
}

if (Object.values(watcher).every(Boolean)) {
  watcher.button.addEventListener('click', testRepositoryConnection);
}
