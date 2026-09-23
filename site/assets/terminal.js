const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const terminal = {
  clock: document.querySelector('[data-terminal-clock]'),
  eigen: document.querySelector('[data-terminal-value="eigen"]'),
  trapz: document.querySelector('[data-terminal-value="trapz"]'),
  matrix: document.querySelector('[data-terminal-matrix]'),
  status: document.querySelector('[data-terminal-status]'),
  readout: document.querySelector('[data-terminal-readout]'),
  wave: document.querySelector('[data-wave-line]'),
  shadow: document.querySelector('[data-wave-shadow]'),
  controls: {
    phase: document.querySelector('[data-terminal-control="phase"]'),
    amplitude: document.querySelector('[data-terminal-control="amplitude"]'),
    gain: document.querySelector('[data-terminal-control="gain"]')
  }
};

const samples = ['FFT WINDOW LOCKED', 'EIGENMODE DRIFT', 'TRAPZ SAMPLE READY', 'MATRIX IDLE'];
let tick = 0;

function controlValue(name, divisor) {
  return Number(terminal.controls[name].value) / divisor;
}

function wavePath({ phase, amplitude, gain, shadow = false }) {
  const points = [];
  const center = 95;
  const decay = shadow ? 0.07 : 0.045;
  const phaseShift = shadow ? phase * 0.58 + 1.4 : phase;
  const gainShift = shadow ? gain * 1.45 : gain;

  for (let x = 34; x <= 686; x += 4) {
    const t = ((x - 34) / 652) * Math.PI * 8;
    const carrier = Math.sin(t * (0.86 + gainShift * 0.12) + phaseShift);
    const harmonic = Math.cos(t * 0.46 - phaseShift * 0.7) * 0.42;
    const envelope = Math.exp(-decay * (x - 34) / 24);
    const y = Math.min(170, Math.max(20, center - (carrier + harmonic) * amplitude * envelope));
    points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return `M${points.join(' L')}`;
}

function matrixRows(phase, amplitude, gain) {
  return Array.from({ length: 3 }, (_, row) => {
    return Array.from({ length: 3 }, (_, column) => {
      const value = Math.abs(Math.sin(phase + row * 0.82 + column * gain) * amplitude * 1.7);
      return String(Math.round(value)).padStart(2, '0');
    }).join(' ');
  }).join('\n');
}

function format(value) {
  return value.toFixed(3).padStart(6, ' ');
}

function render() {
  const phaseControl = controlValue('phase', 100);
  const amplitude = controlValue('amplitude', 1);
  const gain = controlValue('gain', 100);
  const phase = phaseControl + tick * 0.035;
  const waveState = { phase, amplitude, gain };

  terminal.clock.textContent = new Date().toLocaleTimeString('de-DE', { hour12: false });
  terminal.wave.setAttribute('d', wavePath(waveState));
  terminal.shadow.setAttribute('d', wavePath({ ...waveState, shadow: true }));
  terminal.eigen.textContent = format(Math.sin(phase) * gain + amplitude / 100);
  terminal.trapz.textContent = format(Math.cos(phase * 0.63) * gain * 0.72);
  terminal.matrix.textContent = matrixRows(phase, amplitude, gain);
  terminal.status.textContent = samples[Math.floor(tick / 18) % samples.length];
  terminal.readout.textContent = `phase=${phaseControl.toFixed(2)} amp=${(amplitude / 100).toFixed(2)} gain=${gain.toFixed(2)}`;

  if (!document.hidden && !prefersReducedMotion) {
    tick += 1;
  }
}

function start() {
  render();
  Object.values(terminal.controls).forEach(input => input.addEventListener('input', render));

  if (!prefersReducedMotion) {
    window.setInterval(render, 80);
  }
}

if (
  terminal.clock &&
  terminal.eigen &&
  terminal.trapz &&
  terminal.matrix &&
  terminal.status &&
  terminal.readout &&
  terminal.wave &&
  terminal.shadow &&
  Object.values(terminal.controls).every(Boolean)
) {
  start();
}
