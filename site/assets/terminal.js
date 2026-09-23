const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const terminal = {
  clock: document.querySelector('[data-terminal-clock]'),
  eigen: document.querySelector('[data-terminal-value="eigen"]'),
  trapz: document.querySelector('[data-terminal-value="trapz"]'),
  matrix: document.querySelector('[data-terminal-matrix]'),
  bars: [...document.querySelectorAll('[data-terminal-bars] span')],
  status: document.querySelector('[data-terminal-status]')
};

const samples = ['FFT WINDOW LOCKED', 'NO INPUT / PASSIVE SAMPLE', 'RESIDUAL DRIFT NOMINAL', 'MATRIX IDLE'];
let tick = 0;

function valueAt(offset, scale = 1) {
  return Math.sin((tick + offset) / 7) * scale + Math.cos((tick + offset) / 13) * scale * 0.42;
}

function format(value) {
  return value.toFixed(3).padStart(6, ' ');
}

function render() {
  const now = new Date();
  terminal.clock.textContent = now.toLocaleTimeString('de-DE', { hour12: false });
  terminal.eigen.textContent = format(valueAt(2, 0.84));
  terminal.trapz.textContent = format(valueAt(11, 1.18));
  terminal.status.textContent = samples[Math.floor(tick / 5) % samples.length];

  terminal.matrix.textContent = Array.from({ length: 3 }, (_, row) => {
    return Array.from({ length: 3 }, (_, column) => {
      const value = Math.round(Math.abs(valueAt(row * 5 + column * 3, 92)));
      return String(value).padStart(2, '0');
    }).join(' ');
  }).join('\n');

  terminal.bars.forEach((bar, index) => {
    const height = 24 + Math.abs(valueAt(index * 2, 62));
    bar.style.setProperty('--bar-height', `${height}%`);
  });

  tick += 1;
}

if (terminal.clock && terminal.eigen && terminal.trapz && terminal.matrix && terminal.status) {
  render();
  if (!prefersReducedMotion) {
    window.setInterval(() => {
      if (!document.hidden) render();
    }, 700);
  }
}
