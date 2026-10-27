import { FONT } from './config.js?v=1';

const COIN_N = 46;
const BIT_N = 36;
const CONFETTI_N = 68;
const FLOAT_N = 16;
const TINTS = [0xfff1a8, 0xffb7d5, 0xb8f0c8, 0xaee4ff, 0xffd0a8, 0xe6d4ff];

function makePart(scene, key, depth) {
  const img = scene.add.image(0, 0, key).setVisible(false).setActive(false).setDepth(depth);
  img.setScale(0.5);
  return {
    img,
    alive: false,
    kind: 0,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    t: 0,
    dur: 1,
    delay: 0,
    x0: 0,
    y0: 0,
    x1: 0,
    y1: 0,
    cx: 0,
    cy: 0,
    rot: 0,
    vr: 0,
  };
}

function acquire(list) {
  for (let i = 0; i < list.length; i++) {
    if (!list[i].alive) return list[i];
  }
  return null;
}

function kill(p) {
  p.alive = false;
  p.img.setVisible(false);
  p.img.setActive(false);
}

export function createFx(scene) {
  const fx = {
    coins: new Array(COIN_N),
    bits: new Array(BIT_N),
    confetti: new Array(CONFETTI_N),
    floats: new Array(FLOAT_N),
    arrived: 0,
    targetX: 130,
    targetY: 68,
    live: 0,
  };
  for (let i = 0; i < COIN_N; i++) fx.coins[i] = makePart(scene, 'coin', 18);
  for (let i = 0; i < BIT_N; i++) fx.bits[i] = makePart(scene, 'puff', 17);
  for (let i = 0; i < CONFETTI_N; i++) fx.confetti[i] = makePart(scene, 'confetti', 19);
  for (let i = 0; i < FLOAT_N; i++) {
    const obj = scene.add.text(0, 0, '', {
      fontFamily: FONT,
      fontSize: '36px',
      color: '#FFF8E4',
      stroke: '#3A2A22',
      strokeThickness: 7,
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21).setVisible(false);
    fx.floats[i] = { obj, alive: false, x: 0, y: 0, t: 0, dur: 0.9 };
  }
  return fx;
}

export function spawnCoin(fx, x, y, delay) {
  const p = acquire(fx.coins);
  if (!p) return;
  p.alive = true;
  p.delay = delay || 0;
  p.t = 0;
  p.dur = 0.52;
  p.x0 = x;
  p.y0 = y;
  p.x1 = fx.targetX;
  p.y1 = fx.targetY;
  p.cx = (x + p.x1) * 0.5;
  p.cy = Math.min(y, p.y1) - 90 - ((x * 0.15) % 50);
  p.img.clearTint();
  p.img.setVisible(p.delay <= 0);
  p.img.setActive(true);
  p.img.setScale(0.5);
  p.img.setAlpha(1);
  p.img.setPosition(x, y);
}

export function spawnPop(fx, x, y, textureKey) {
  const p = acquire(fx.bits);
  if (!p) return;
  p.alive = true;
  p.kind = 1;
  p.x = x;
  p.y = y;
  p.t = 0;
  p.dur = 0.22;
  p.delay = 0;
  p.img.setTexture(textureKey);
  p.img.clearTint();
  p.img.setVisible(true).setActive(true).setAlpha(1).setPosition(x, y).setScale(0.5).setAngle(0);
}

export function spawnSpark(fx, x, y, vx, vy) {
  const p = acquire(fx.bits);
  if (!p) return;
  p.alive = true;
  p.kind = 2;
  p.x = x;
  p.y = y;
  p.vx = vx;
  p.vy = vy;
  p.t = 0;
  p.dur = 0.4;
  p.delay = 0;
  p.img.setTexture('spark');
  p.img.clearTint();
  p.img.setVisible(true).setActive(true).setAlpha(1).setPosition(x, y).setScale(0.45).setAngle(0);
}

export function spawnConfetti(fx, x, y, count, rng) {
  for (let i = 0; i < count; i++) {
    const p = acquire(fx.confetti);
    if (!p) return;
    const a = rng.next() * Math.PI * 2;
    const sp = 80 + rng.next() * 220;
    p.alive = true;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(a) * sp;
    p.vy = -180 - rng.next() * 280;
    p.vr = (rng.next() - 0.5) * 8;
    p.rot = rng.next() * 6;
    p.t = 0;
    p.dur = 1.05;
    p.delay = 0;
    p.img.setTint(TINTS[(rng.next() * 6) | 0]);
    p.img.setVisible(true).setActive(true).setAlpha(1).setPosition(x, y).setScale(0.5).setAngle(0);
  }
}

function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function floaterRects(fx) {
  const out = [];
  if (!fx) return out;
  for (let i = 0; i < fx.floats.length; i++) {
    const p = fx.floats[i];
    if (!p.alive || !p.obj.visible) continue;
    const w = p.w || p.obj.width || 40;
    const h = p.h || p.obj.height || 40;
    out.push({ x: p.x - w / 2, y: p.y - h / 2, w, h });
  }
  return out;
}

function placeFloat(fx, x, y, w, h) {
  const rects = floaterRects(fx);
  if (fx.block) rects.push(fx.block);
  let px = x;
  let py = y;
  for (let n = 0; n < 14; n++) {
    const r = { x: px - w / 2, y: py - h / 2, w, h };
    let hit = false;
    for (let i = 0; i < rects.length; i++) {
      if (overlaps(r, rects[i])) { hit = true; break; }
    }
    if (!hit) return { x: px, y: py };
    py -= h + 8;
    if (py < 36) {
      py = y;
      px += w + 10;
    }
  }
  return { x: px, y: py };
}

export function spawnFloat(fx, x, y, message) {
  let p = null;
  for (let i = 0; i < fx.floats.length; i++) {
    if (!fx.floats[i].alive) { p = fx.floats[i]; break; }
  }
  if (!p) p = fx.floats[0];
  p.obj.setText(message);
  const w = Math.max(28, p.obj.width || message.length * 18);
  const h = Math.max(28, p.obj.height || 40);
  const spot = placeFloat(fx, x, y, w, h);
  p.alive = true;
  p.x = spot.x;
  p.y = spot.y;
  p.w = w;
  p.h = h;
  p.t = 0;
  p.dur = 0.9;
  p.obj.setVisible(true).setAlpha(1).setPosition(spot.x, spot.y);
}

function stepCoins(list, dt, fx) {
  let live = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p.alive) continue;
    live++;
    if (p.delay > 0) {
      p.delay -= dt;
      if (p.delay > 0) continue;
      p.img.setVisible(true);
    }
    p.t += dt;
    const u = p.t / p.dur;
    if (u >= 1) {
      kill(p);
      fx.arrived++;
      continue;
    }
    const omu = 1 - u;
    const x = omu * omu * p.x0 + 2 * omu * u * p.cx + u * u * p.x1;
    const y = omu * omu * p.y0 + 2 * omu * u * p.cy + u * u * p.y1;
    p.img.setPosition(x, y);
    p.img.setScale(0.5 + Math.sin(u * Math.PI) * 0.12);
  }
  return live;
}

function stepBits(list, dt) {
  let live = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p.alive) continue;
    live++;
    p.t += dt;
    const u = p.t / p.dur;
    if (u >= 1) { kill(p); continue; }
    if (p.kind === 1) {
      const s = 0.5 * (1 + Math.sin(u * Math.PI) * 0.55);
      p.img.setScale(s * (1 + u * 0.15), s * (1 - u * 0.25));
      p.img.setAlpha(1 - u);
      p.img.setPosition(p.x, p.y - u * 18);
    } else {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 80 * dt;
      p.img.setPosition(p.x, p.y);
      p.img.setAlpha(1 - u);
      p.img.setScale(0.4 * (1 - u * 0.3));
    }
  }
  return live;
}

function stepConfetti(list, dt) {
  let live = 0;
  for (let i = 0; i < list.length; i++) {
    const p = list[i];
    if (!p.alive) continue;
    live++;
    p.t += dt;
    const u = p.t / p.dur;
    if (u >= 1) { kill(p); continue; }
    p.vy += 420 * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += p.vr * dt;
    p.img.setPosition(p.x, p.y);
    p.img.setAngle(p.rot);
    p.img.setAlpha(u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1);
  }
  return live;
}

export function updateFx(fx, dt) {
  let live = 0;
  live += stepCoins(fx.coins, dt, fx);
  live += stepBits(fx.bits, dt);
  live += stepConfetti(fx.confetti, dt);
  for (let i = 0; i < fx.floats.length; i++) {
    const p = fx.floats[i];
    if (!p.alive) continue;
    p.t += dt;
    const u = p.t / p.dur;
    if (u >= 1) {
      p.alive = false;
      p.obj.setVisible(false);
      continue;
    }
    p.y -= 46 * dt;
    p.obj.setPosition(p.x, p.y);
    p.obj.setAlpha(1 - u);
  }
  fx.live = live;
  return live;
}
