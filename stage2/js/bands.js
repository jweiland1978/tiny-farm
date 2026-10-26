// Full-viewport art behind the Phaser canvas. Portrait phones show sky above
// and the tray color below. Landscape screens get the same split on the sides,
// with a hill line. Edge colors match the pixels the game itself paints.

export const bands = { top: '#8fd4f5', bottom: '#d9a36a', night: false };

function canvas() {
  let c = document.getElementById('bgart');
  if (!c) {
    c = document.createElement('canvas');
    c.id = 'bgart';
    document.body.appendChild(c);
  }
  return c;
}

function gameRect() {
  const list = document.querySelectorAll('#game canvas');
  const cv = list.length ? list[0] : null;
  if (!cv) return null;
  const r = cv.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return null;
  return r;
}

export function setBands(top, bottom, night) {
  bands.top = top;
  bands.bottom = bottom;
  bands.night = !!night;
  paintBands();
}

export function bandColors() {
  return { top: bands.top, bottom: bands.bottom };
}

export function paintBands() {
  const c = canvas();
  const w = window.innerWidth || 1;
  const h = window.innerHeight || 1;
  if (c.width !== w) c.width = w;
  if (c.height !== h) c.height = h;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const r = gameRect();
  ctx.fillStyle = bands.top;
  ctx.fillRect(0, 0, w, h);
  // The tray / ground starts where the game's bottom edge is that color,
  // which is the lower fifth of the canvas. Sides use the same split.
  let groundY = h * 0.72;
  if (r) groundY = r.top + r.height * 0.82;
  ctx.fillStyle = bands.bottom;
  ctx.fillRect(0, groundY, w, h - groundY);
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(w * 0.5, groundY, w * 0.72, 36, 0, Math.PI, 0);
  ctx.fill();
  if (bands.night) {
    for (let i = 0; i < 28; i++) {
      const sx = ((i * 97) % 1000) / 1000 * w;
      const sy = ((i * 53) % 700) / 1000 * groundY;
      ctx.fillStyle = i % 4 === 0 ? '#fff6c8' : '#ffffff';
      ctx.globalAlpha = 0.35 + (i % 5) * 0.1;
      ctx.beginPath();
      ctx.arc(sx, sy, i % 5 === 0 ? 2.2 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else {
    // Clouds placed inside whatever sky is visible: the top band on tall
    // phones, the side bands on wide screens.
    const skyTop = 0;
    const skyBot = r ? Math.max(0, r.top) : groundY;
    const sideL = r ? Math.max(0, r.left) : 0;
    const puffs = [];
    if (skyBot - skyTop >= 28) {
      const band = skyBot - skyTop;
      const sz = Math.max(8, Math.min(24, band * 0.28));
      const xs = [0.12, 0.38, 0.66, 0.9];
      for (let i = 0; i < xs.length; i++) {
        puffs.push([xs[i] * w, skyTop + band * (i % 2 ? 0.38 : 0.62), sz * (i % 2 ? 0.85 : 1)]);
      }
    }
    if (sideL >= 40) {
      const ys = [0.12, 0.3, 0.5];
      for (let i = 0; i < ys.length; i++) {
        const sz = Math.min(26, sideL * 0.16);
        puffs.push([sideL * (i % 2 ? 0.35 : 0.6), groundY * ys[i] / 0.72 * 0.72, sz]);
        puffs.push([w - sideL * (i % 2 ? 0.6 : 0.35), groundY * (ys[i] + 0.08), sz]);
      }
    }
    for (let i = 0; i < puffs.length; i++) {
      const [cx, cy, sz] = puffs[i];
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.arc(cx, cy, sz, 0, Math.PI * 2);
      ctx.arc(cx + sz * 1.05, cy + sz * 0.25, sz * 0.7, 0, Math.PI * 2);
      ctx.arc(cx - sz * 0.95, cy + sz * 0.3, sz * 0.62, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Ground band: little grass tufts and pebbles so it reads as soil, not a
  // flat bar. Kept away from the very edge that meets the game.
  const gTop = r ? Math.max(groundY, r.bottom) : groundY;
  const gh = h - gTop;
  if (gh >= 16) {
    for (let i = 0; i < 40; i++) {
      const x = ((i * 137) % 1000) / 1000 * w;
      const y = gTop + 8 + (((i * 71) % 100) / 100) * Math.max(1, gh - 14);
      if (i % 3 === 0) {
        ctx.fillStyle = bands.night ? 'rgba(120,170,110,0.5)' : 'rgba(110,170,80,0.75)';
        ctx.beginPath();
        ctx.moveTo(x - 5, y + 4); ctx.lineTo(x - 2, y - 6); ctx.lineTo(x, y + 4);
        ctx.lineTo(x + 2, y - 8); ctx.lineTo(x + 5, y + 4);
        ctx.fill();
      } else {
        ctx.fillStyle = i % 2 ? 'rgba(140,90,50,0.35)' : 'rgba(255,240,210,0.35)';
        ctx.beginPath();
        ctx.ellipse(x, y, 3 + (i % 4), 2 + (i % 3) * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

export function watchBands() {
  window.addEventListener('resize', paintBands);
  paintBands();
}
