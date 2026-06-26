// Confetti sobre un canvas fijo que se crea una sola vez.
let canvas = null;

function getCanvas() {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50';
    document.body.appendChild(canvas);
  }
  return canvas;
}

export function fireConfetti(colors) {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = getCanvas();
  const ctx = c.getContext('2d');
  const DPR = window.devicePixelRatio || 1;
  const W = window.innerWidth;
  const H = window.innerHeight;
  c.width = W * DPR;
  c.height = H * DPR;
  c.style.width = W + 'px';
  c.style.height = H + 'px';
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const P = [];
  for (let i = 0; i < 180; i++) {
    P.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.32 + (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 12,
      vy: Math.random() * -13 - 3,
      g: 0.28 + Math.random() * 0.22,
      s: 6 + Math.random() * 9,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.35,
      col: colors[(Math.random() * colors.length) | 0],
      life: 0,
      max: 110 + Math.random() * 70,
      sh: Math.random() < 0.5 ? 'rect' : 'circ',
    });
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (let i = 0; i < P.length; i++) {
      const p = P[i];
      p.life++;
      if (p.life > p.max) continue;
      alive = true;
      p.vy += p.g;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.r += p.vr;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.col;
      if (p.sh === 'rect') ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6);
      else {
        ctx.beginPath();
        ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    if (alive) requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  }
  frame();
}
