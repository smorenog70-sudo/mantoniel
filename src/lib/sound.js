// Sonidos sintetizados con Web Audio (sin archivos que alojar).
let ctx = null;
let muted = (() => {
  try {
    return localStorage.getItem('grMute') === '1';
  } catch (e) {
    return false;
  }
})();

export function isMuted() {
  return muted;
}
export function setMuted(m) {
  muted = m;
  try {
    localStorage.setItem('grMute', m ? '1' : '0');
  } catch (e) {}
  if (!m) unlock();
}

// Llamar en cualquier gesto del usuario para desbloquear el audio del navegador.
export function unlock() {
  if (muted) return;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function ready() {
  if (muted) return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type, vol) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type || 'triangle';
  o.frequency.value = freq;
  o.connect(g);
  g.connect(ctx.destination);
  const t0 = ctx.currentTime + start;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.linearRampToValueAtTime(vol || 0.2, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
  o.start(t0);
  o.stop(t0 + dur + 0.03);
}

export const Sound = {
  unlock,
  join() {
    if (!ready()) return;
    tone(523.25, 0, 0.12, 'triangle', 0.15);
    tone(784, 0.08, 0.15, 'triangle', 0.15);
  },
  tap() {
    if (!ready()) return;
    tone(660, 0, 0.06, 'sine', 0.1);
  },
  correct() {
    if (!ready()) return;
    tone(659.25, 0, 0.12, 'triangle', 0.16);
    tone(987.77, 0.09, 0.18, 'triangle', 0.16);
  },
  wrong() {
    if (!ready()) return;
    tone(196, 0, 0.18, 'sawtooth', 0.12);
  },
  results() {
    if (!ready()) return;
    tone(659.25, 0, 0.15, 'triangle', 0.16);
    tone(987.77, 0.1, 0.22, 'triangle', 0.16);
  },
  tick() {
    if (!ready()) return;
    tone(880, 0, 0.07, 'square', 0.12);
  },
  reveal() {
    if (!ready()) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, i * 0.12, 0.5, 'triangle', 0.22));
    [1568, 1760, 2093].forEach((f, i) => tone(f, 0.5 + i * 0.05, 0.18, 'sine', 0.12));
  },
};
