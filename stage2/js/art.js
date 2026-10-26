import { GAME_W, GAME_H, LOOK } from './config.js?v=1';
import { CROPS } from './data/crops.js?v=1';
import { ANIMALS } from './data/animals.js?v=1';

export const TEX_SCALE = 0.5;
export const SOIL_LOGICAL = 200;

const INK = 0x3a2a22;

function tex(scene, key, dw, dh, draw) {
  if (scene.textures.exists(key)) return;
  const tw = dw * 2;
  const th = dh * 2;
  const g = scene.make.graphics({ add: false });
  draw(g, tw, th);
  g.generateTexture(key, tw, th);
  g.destroy();
}

function mix(a, b, t) {
  const ar = (a >> 16) & 255;
  const ag = (a >> 8) & 255;
  const ab = a & 255;
  const br = (b >> 16) & 255;
  const bg = (b >> 8) & 255;
  const bb = b & 255;
  const r = (ar + (br - ar) * t) | 0;
  const gc = (ag + (bg - ag) * t) | 0;
  const bl = (ab + (bb - ab) * t) | 0;
  return (r << 16) | (gc << 8) | bl;
}

export function stampEdges(g, skyN, trayN) {
  g.fillStyle(skyN, 1);
  g.fillRect(0, 0, GAME_W, 10);
  g.fillStyle(trayN, 1);
  g.fillRect(0, GAME_H - 12, GAME_W, 14);
}

function look(seasonId) {
  return LOOK[seasonId] || LOOK.spring;
}

export function drawFarmBackdrop(g, seasonId) {
  const L = look(seasonId);
  const skyBot = seasonId === 'winter' ? 0xeef3f8 : seasonId === 'fall' ? 0xffe0c0 : 0xfff1c9;
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    g.fillStyle(mix(L.skyN, skyBot, t), 1);
    g.fillRect(0, (GAME_H / 18) * i, GAME_W, GAME_H / 18 + 2);
  }
  if (seasonId === 'summer') {
    g.fillStyle(0xfff3b0, 1);
    g.fillCircle(610, 150, 36);
    g.lineStyle(6, INK, 0.35);
    g.strokeCircle(610, 150, 36);
  }
  if (seasonId === 'night') {
    g.fillStyle(LOOK.night.skyN, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
  }
  g.fillStyle(L.hill, 1);
  g.fillEllipse(360, 430, 680, 220);
  g.fillStyle(L.grass, 1);
  g.fillRect(0, 460, GAME_W, 900);
  drawCreek(g, 8, 520, 52, 460);
  drawBarn(g, 28, 250, 190, 160, seasonId === 'winter');
  if (seasonId === 'fall') {
    g.fillStyle(0xe07030, 0.9);
    const leaves = [[120, 390], [200, 360], [640, 400], [80, 620], [680, 700], [400, 480]];
    for (let i = 0; i < leaves.length; i++) {
      g.fillEllipse(leaves[i][0], leaves[i][1], 16, 10);
    }
  }
  if (seasonId === 'winter') {
    g.fillStyle(0xffffff, 0.82);
    g.fillEllipse(120, 400, 220, 40);
    g.fillEllipse(560, 420, 260, 36);
    g.fillRoundedRect(40, 390, 160, 18, 8);
  }
  // Wooden tray behind the seed packets. The bottom edge is a flat tray color.
  g.fillStyle(L.trayN, 1);
  g.fillRect(0, 1036, GAME_W, GAME_H - 1036);
  g.fillStyle(mix(L.trayN, 0x000000, 0.12), 1);
  g.fillRect(0, 1036, GAME_W, 16);
  g.lineStyle(8, INK, 1);
  g.strokeRect(4, 1040, GAME_W - 8, 8);
  stampEdges(g, L.skyN, L.trayN);
}

function drawCreek(g, x, y, w, h) {
  g.fillStyle(0x7fd4ee, 1);
  g.fillRoundedRect(x, y, w, h, 26);
  g.fillStyle(0xb9ecf8, 0.85);
  g.fillRoundedRect(x + 10, y + 16, w - 22, h - 40, 18);
  g.lineStyle(8, INK, 1);
  g.strokeRoundedRect(x, y, w, h, 26);
}

function drawBarn(g, x, y, w, h, snow) {
  g.fillStyle(0x8d3d38, 1);
  g.fillTriangle(x - 8, y + 54, x + w * 0.5, y - 8, x + w + 8, y + 54);
  if (snow) {
    g.fillStyle(0xfffdf8, 1);
    g.fillTriangle(x - 4, y + 48, x + w * 0.5, y + 2, x + w + 4, y + 48);
  }
  g.fillStyle(0xe15a4c, 1);
  g.fillRoundedRect(x, y + 48, w, h - 48, 12);
  if (snow) {
    g.fillStyle(0xfffdf8, 0.95);
    g.fillRoundedRect(x - 4, y + 42, w + 8, 16, 6);
  }
  const doorX = x + w * 0.28;
  const doorY = y + h - 70;
  g.fillStyle(0x6e302c, 1);
  g.fillRoundedRect(doorX, doorY, w * 0.44, 66, 8);
  g.fillStyle(0xfff1c4, 1);
  g.fillCircle(x + w * 0.5, y + 78, 14);
  g.lineStyle(8, INK, 1);
  g.strokeTriangle(x - 8, y + 54, x + w * 0.5, y - 8, x + w + 8, y + 54);
  g.strokeRoundedRect(x, y + 48, w, h - 48, 12);
}

export function drawTitleBackdrop(g) {
  drawFarmBackdrop(g, 'spring');
  // Title keeps the spring sky and tray edges from drawFarmBackdrop.
}

export function drawStandBackdrop(g, seasonId) {
  const L = look(seasonId || 'spring');
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    g.fillStyle(mix(L.skyN, 0xfff0cc, t), 1);
    g.fillRect(0, (GAME_H / 14) * i, GAME_W, GAME_H / 14 + 2);
  }
  g.fillStyle(L.grass, 1);
  g.fillRect(0, 980, GAME_W, 320);
  g.fillStyle(L.trayN, 1);
  g.fillRect(0, GAME_H - 80, GAME_W, 80);
  stampEdges(g, L.skyN, L.trayN);
}

export function drawAlbumBackdrop(g) {
  const L = LOOK.spring;
  for (let i = 0; i < 12; i++) {
    const t = i / 11;
    g.fillStyle(mix(L.skyN, 0xfff6e4, t), 1);
    g.fillRect(0, (GAME_H / 12) * i, GAME_W, GAME_H / 12 + 2);
  }
  g.fillStyle(L.trayN, 1);
  g.fillRect(0, GAME_H - 40, GAME_W, 40);
  stampEdges(g, L.skyN, L.trayN);
}

function sprout(g, x, y, sc, color) {
  g.fillStyle(color, 1);
  g.fillCircle(x, y, 26 * sc);
  g.fillCircle(x - 30 * sc, y + 10 * sc, 18 * sc);
  g.fillCircle(x + 30 * sc, y + 8 * sc, 18 * sc);
  g.lineStyle(7 * sc, INK, 1);
  g.strokeCircle(x, y, 26 * sc);
}

function shine(g, x, y, sc) {
  g.fillStyle(0xffffff, 0.92);
  g.fillCircle(x, y, 7 * sc);
}

function face(g, x, y, sc, frown) {
  g.fillStyle(INK, 1);
  g.fillCircle(x - 12 * sc, y - 6 * sc, 3.5 * sc);
  g.fillCircle(x + 12 * sc, y - 6 * sc, 3.5 * sc);
  g.lineStyle(4 * sc, INK, 1);
  g.beginPath();
  if (frown) g.arc(x, y + 14 * sc, 10 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
  else g.arc(x, y + 2 * sc, 10 * sc, Math.PI * 0.15, Math.PI * 0.85, false);
  g.strokePath();
}

function drawCropShape(g, tw, th, spec, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const k = ripe || stage >= 3 ? 1 : stage === 2 ? 0.62 : 0;
  const body = spec.body;
  const leaf = spec.leaf;
  const accent = spec.accent;
  if (k === 0) {
    sprout(g, cx, th * 0.55, sc * 1.15, leaf);
    return;
  }
  const yb = th * 0.62;
  const rad = (ripe ? 54 : 44) * k * sc;
  const shape = spec.shape;
  if (shape === 'cone' || shape === 'pepper') {
    g.fillStyle(body, 1);
    g.fillTriangle(cx, yb + rad, cx - rad * 0.55, yb - rad * 0.8, cx + rad * 0.55, yb - rad * 0.8);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeTriangle(cx, yb + rad, cx - rad * 0.55, yb - rad * 0.8, cx + rad * 0.55, yb - rad * 0.8);
    if (shape === 'pepper') {
      g.fillStyle(accent, 1);
      g.fillCircle(cx + rad * 0.15, yb - rad * 0.2, rad * 0.16);
    }
  } else if (shape === 'pods') {
    sprout(g, cx, th * 0.28, sc * 0.55, leaf);
    const n = ripe ? 3 : 2;
    for (let i = 0; i < n; i++) {
      const x = cx + (i - 1) * 28 * sc;
      const y = yb - 10 * sc + (i % 2) * 16 * sc;
      g.fillStyle(body, 1);
      g.fillEllipse(x, y, 36 * k * sc, 26 * k * sc);
      g.lineStyle(6 * sc, INK, 1);
      g.strokeEllipse(x, y, 36 * k * sc, 26 * k * sc);
    }
  } else if (shape === 'leafy') {
    const layers = ripe ? 4 : 3;
    const colors = [body, leaf, accent, 0xd8f5c4];
    for (let i = 0; i < layers; i++) {
      g.fillStyle(colors[i % 4], 1);
      g.fillCircle(cx, yb, (22 + i * 12) * k * sc);
      g.lineStyle(6 * sc, INK, 1);
      g.strokeCircle(cx, yb, (22 + i * 12) * k * sc);
    }
  } else if (shape === 'berry') {
    sprout(g, cx, th * 0.26, sc * 0.45, leaf);
    g.fillStyle(body, 1);
    g.fillCircle(cx, yb, rad);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, yb, rad);
    g.fillStyle(accent, 1);
    const seeds = ripe ? 5 : 3;
    for (let i = 0; i < seeds; i++) {
      const a = -0.9 + i * 0.45;
      g.fillCircle(cx + Math.cos(a) * rad * 0.45, yb + Math.sin(a) * rad * 0.4, 4 * sc);
    }
  } else if (shape === 'layers') {
    g.fillStyle(body, 1);
    g.fillCircle(cx, yb, rad);
    g.fillStyle(accent, 1);
    g.fillCircle(cx, yb, rad * 0.62);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, yb, rad);
    g.strokeCircle(cx, yb, rad * 0.62);
    g.fillStyle(leaf, 1);
    g.fillRoundedRect(cx - 6 * sc, th * 0.18, 12 * sc, th * 0.2, 6 * sc);
  } else if (shape === 'flower') {
    g.fillStyle(leaf, 1);
    g.fillRoundedRect(cx - 6 * sc, yb - 10 * sc, 12 * sc, rad, 4 * sc);
    const petals = spec.id === 'sunflower' ? 8 : 6;
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      g.fillStyle(body, 1);
      g.fillCircle(cx + Math.cos(a) * rad * 0.7, yb - rad * 0.2 + Math.sin(a) * rad * 0.7, rad * 0.38);
    }
    g.fillStyle(accent, 1);
    g.fillCircle(cx, yb - rad * 0.15, rad * 0.32);
    g.lineStyle(6 * sc, INK, 1);
    g.strokeCircle(cx, yb - rad * 0.15, rad * 0.32);
  } else if (shape === 'oblong') {
    sprout(g, cx - rad, th * 0.34, sc * 0.4, leaf);
    g.fillStyle(body, 1);
    g.fillEllipse(cx + 6 * sc, yb, rad * 1.7, rad * 0.85);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeEllipse(cx + 6 * sc, yb, rad * 1.7, rad * 0.85);
    g.fillStyle(accent, 0.8);
    g.fillEllipse(cx - rad * 0.2, yb - rad * 0.1, rad * 0.4, rad * 0.22);
  } else if (shape === 'cob') {
    g.fillStyle(leaf, 1);
    g.fillEllipse(cx - rad * 0.7, yb, rad * 0.45, rad * 1.3);
    g.fillEllipse(cx + rad * 0.7, yb, rad * 0.45, rad * 1.3);
    g.fillStyle(body, 1);
    g.fillRoundedRect(cx - rad * 0.38, yb - rad, rad * 0.76, rad * 2, rad * 0.3);
    g.lineStyle(6 * sc, INK, 1);
    g.strokeRoundedRect(cx - rad * 0.38, yb - rad, rad * 0.76, rad * 2, rad * 0.3);
    g.fillStyle(accent, 1);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 2; col++) {
        g.fillCircle(cx - 8 * sc + col * 16 * sc, yb - rad * 0.6 + row * rad * 0.35, 4 * sc);
      }
    }
  } else if (shape === 'root') {
    g.fillStyle(body, 1);
    g.fillCircle(cx - rad * 0.25, yb, rad * 0.7);
    g.fillCircle(cx + rad * 0.35, yb + rad * 0.1, rad * 0.55);
    g.fillCircle(cx, yb - rad * 0.25, rad * 0.45);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx - rad * 0.25, yb, rad * 0.7);
    sprout(g, cx, yb - rad * 0.9, sc * 0.4, leaf);
  } else if (shape === 'sapling') {
    g.fillStyle(0x8a5a32, 1);
    g.fillRoundedRect(cx - 7 * sc, yb, 14 * sc, rad, 4 * sc);
    g.fillStyle(leaf, 1);
    g.fillCircle(cx, yb - rad * 0.15, rad * 0.85);
    g.fillStyle(body, 1);
    g.fillCircle(cx + rad * 0.35, yb - rad * 0.05, rad * 0.32);
    g.lineStyle(6 * sc, INK, 1);
    g.strokeCircle(cx, yb - rad * 0.15, rad * 0.85);
  } else if (shape === 'floret') {
    g.fillStyle(0x6dbe6a, 1);
    g.fillRoundedRect(cx - 8 * sc, yb, 16 * sc, rad, 4 * sc);
    g.fillStyle(body, 1);
    g.fillCircle(cx, yb - rad * 0.15, rad * 0.7);
    g.fillCircle(cx - rad * 0.45, yb, rad * 0.4);
    g.fillCircle(cx + rad * 0.45, yb, rad * 0.4);
    g.lineStyle(6 * sc, INK, 1);
    g.strokeCircle(cx, yb - rad * 0.15, rad * 0.7);
  } else if (shape === 'star') {
    g.fillStyle(body, 1);
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5;
      const rr = (i % 2 === 0 ? rad : rad * 0.45);
      const x = cx + Math.cos(a) * rr;
      const y = yb + Math.sin(a) * rr;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fillPath();
    g.lineStyle(6 * sc, INK, 1);
    g.strokePath();
    g.fillStyle(accent, 1);
    g.fillCircle(cx, yb, rad * 0.22);
  } else if (shape === 'gourd') {
    g.fillStyle(body, 1);
    g.fillCircle(cx, yb + rad * 0.15, rad * 0.85);
    g.fillCircle(cx, yb - rad * 0.55, rad * 0.5);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, yb + rad * 0.15, rad * 0.85);
    g.fillStyle(leaf, 1);
    g.fillEllipse(cx + rad * 0.2, yb - rad * 0.95, rad * 0.45, rad * 0.22);
  } else {
    // bulb and round
    g.fillStyle(body, 1);
    g.fillCircle(cx, yb, rad);
    if (shape === 'round' && spec.id === 'watermelon') {
      g.fillStyle(accent, 1);
      g.fillCircle(cx, yb, rad * 0.55);
    }
    if (spec.id === 'grumpkin') {
      g.fillStyle(accent, 1);
      g.fillRoundedRect(cx - 4 * sc, yb - rad - 8 * sc, 8 * sc, 16 * sc, 3 * sc);
    }
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, yb, rad);
    g.fillStyle(accent, 0.9);
    g.fillCircle(cx - rad * 0.28, yb - rad * 0.22, rad * 0.16);
  }
  if (ripe) {
    shine(g, cx - rad * 0.35, yb - rad * 0.35, sc);
    face(g, cx, yb, sc, spec.id === 'grumpkin');
  }
}

function drawAnimal(g, tw, th, spec) {
  const sc = tw / 200;
  const cx = tw * 0.5;
  const cy = th * 0.58;
  const body = spec.body;
  const accent = spec.accent;
  g.fillStyle(body, 1);
  if (spec.kind === 'bird' || spec.kind === 'duck') {
    g.fillEllipse(cx, cy, 70 * sc, 56 * sc);
    g.fillCircle(cx + 28 * sc, cy - 24 * sc, 26 * sc);
    g.fillStyle(accent, 1);
    g.fillTriangle(cx + 48 * sc, cy - 24 * sc, cx + 78 * sc, cy - 16 * sc, cx + 48 * sc, cy - 8 * sc);
    if (spec.kind === 'duck') {
      g.fillStyle(0xf0d24a, 1);
      g.fillEllipse(cx - 10 * sc, cy + 24 * sc, 34 * sc, 14 * sc);
    }
  } else if (spec.kind === 'bunny') {
    g.fillEllipse(cx - 22 * sc, cy - 48 * sc, 16 * sc, 40 * sc);
    g.fillEllipse(cx + 22 * sc, cy - 48 * sc, 16 * sc, 40 * sc);
    g.fillStyle(accent, 1);
    g.fillEllipse(cx - 22 * sc, cy - 48 * sc, 8 * sc, 24 * sc);
    g.fillEllipse(cx + 22 * sc, cy - 48 * sc, 8 * sc, 24 * sc);
    g.fillStyle(body, 1);
    g.fillCircle(cx, cy, 36 * sc);
  } else if (spec.kind === 'frog') {
    g.fillEllipse(cx, cy + 6 * sc, 80 * sc, 48 * sc);
    g.fillCircle(cx - 22 * sc, cy - 28 * sc, 18 * sc);
    g.fillCircle(cx + 22 * sc, cy - 28 * sc, 18 * sc);
    g.fillStyle(0xfffdf8, 1);
    g.fillCircle(cx - 22 * sc, cy - 28 * sc, 8 * sc);
    g.fillCircle(cx + 22 * sc, cy - 28 * sc, 8 * sc);
  } else if (spec.kind === 'cat') {
    g.fillCircle(cx, cy, 36 * sc);
    g.fillTriangle(cx - 28 * sc, cy - 20 * sc, cx - 10 * sc, cy - 20 * sc, cx - 22 * sc, cy - 48 * sc);
    g.fillTriangle(cx + 10 * sc, cy - 20 * sc, cx + 28 * sc, cy - 20 * sc, cx + 22 * sc, cy - 48 * sc);
  } else if (spec.kind === 'hog') {
    g.fillEllipse(cx, cy, 78 * sc, 52 * sc);
    g.fillStyle(accent, 1);
    for (let i = 0; i < 5; i++) g.fillCircle(cx - 30 * sc + i * 14 * sc, cy - 18 * sc, 6 * sc);
  } else if (spec.kind === 'goat') {
    g.fillEllipse(cx, cy + 6 * sc, 70 * sc, 48 * sc);
    g.fillCircle(cx + 24 * sc, cy - 16 * sc, 22 * sc);
    g.lineStyle(5 * sc, accent, 1);
    g.beginPath();
    g.arc(cx + 8 * sc, cy - 36 * sc, 14 * sc, Math.PI, Math.PI * 1.7, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 36 * sc, cy - 36 * sc, 14 * sc, Math.PI * 1.3, Math.PI * 2, false);
    g.strokePath();
  } else if (spec.kind === 'dog') {
    g.fillEllipse(cx, cy + 4 * sc, 78 * sc, 46 * sc);
    g.fillCircle(cx + 30 * sc, cy - 16 * sc, 24 * sc);
    g.fillEllipse(cx + 48 * sc, cy - 28 * sc, 16 * sc, 22 * sc);
  } else if (spec.kind === 'sheep') {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - 18 * sc, cy, 24 * sc);
    g.fillCircle(cx + 16 * sc, cy - 6 * sc, 26 * sc);
    g.fillCircle(cx, cy + 12 * sc, 24 * sc);
    g.fillStyle(accent, 1);
    g.fillCircle(cx + 36 * sc, cy + 4 * sc, 14 * sc);
  } else if (spec.kind === 'pig') {
    g.fillEllipse(cx, cy, 84 * sc, 52 * sc);
    g.fillCircle(cx + 30 * sc, cy - 8 * sc, 24 * sc);
    g.fillStyle(accent, 1);
    g.fillEllipse(cx + 40 * sc, cy - 2 * sc, 16 * sc, 12 * sc);
  } else if (spec.kind === 'owl') {
    g.fillEllipse(cx, cy, 64 * sc, 74 * sc);
    g.fillStyle(accent, 1);
    g.fillCircle(cx - 14 * sc, cy - 8 * sc, 14 * sc);
    g.fillCircle(cx + 14 * sc, cy - 8 * sc, 14 * sc);
    g.fillStyle(0xfffdf8, 1);
    g.fillCircle(cx - 14 * sc, cy - 8 * sc, 7 * sc);
    g.fillCircle(cx + 14 * sc, cy - 8 * sc, 7 * sc);
  } else if (spec.kind === 'cow') {
    g.fillEllipse(cx, cy + 8 * sc, 90 * sc, 56 * sc);
    g.fillCircle(cx + 24 * sc, cy - 24 * sc, 26 * sc);
    g.fillStyle(accent, 1);
    g.fillCircle(cx + 14 * sc, cy - 10 * sc, 8 * sc);
    g.fillEllipse(cx - 34 * sc, cy - 6 * sc, 18 * sc, 12 * sc);
  } else {
    g.fillEllipse(cx, cy, 70 * sc, 40 * sc);
    g.fillEllipse(cx - 28 * sc, cy - 10 * sc, 28 * sc, 18 * sc);
    g.fillEllipse(cx + 28 * sc, cy - 8 * sc, 28 * sc, 18 * sc);
    g.fillStyle(accent, 1);
    g.fillCircle(cx, cy - 4 * sc, 6 * sc);
  }
  g.lineStyle(7 * sc, INK, 1);
  g.strokeCircle(cx, cy, 8 * sc);
  g.fillStyle(INK, 1);
  g.fillCircle(cx - 8 * sc, cy - 4 * sc, 3 * sc);
  g.fillCircle(cx + 10 * sc, cy - 4 * sc, 3 * sc);
}

function drawSoil(g, tw, th) {
  g.fillStyle(0xb8743e, 1);
  g.fillRoundedRect(6, 8, tw - 12, th - 12, 40);
  g.fillStyle(0xe2b56e, 1);
  g.fillRoundedRect(18, 18, tw - 36, th - 42, 32);
  g.fillStyle(0xd39a52, 1);
  g.fillCircle(tw * 0.32, th * 0.42, 8);
  g.fillCircle(tw * 0.66, th * 0.58, 6);
  g.lineStyle(14, INK, 1);
  g.strokeRoundedRect(14, 14, tw - 28, th - 28, 36);
}

function drawPip(g, tw, th, mode) {
  const sc = tw / 300;
  const cx = tw * 0.5;
  const by = th * 0.52;
  const boot = (bx) => {
    g.fillStyle(0xe4544a, 1);
    g.fillRoundedRect(bx - 28 * sc, by + 70 * sc, 56 * sc, 36 * sc, 14 * sc);
    g.fillStyle(0xfff6e8, 1);
    g.fillRoundedRect(bx - 28 * sc, by + 92 * sc, 56 * sc, 14 * sc, 6 * sc);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeRoundedRect(bx - 28 * sc, by + 70 * sc, 56 * sc, 36 * sc, 14 * sc);
  };
  boot(cx - 36 * sc);
  boot(cx + 36 * sc);
  g.fillStyle(0xffd24a, 1);
  g.fillCircle(cx - 78 * sc, by + 16 * sc, 28 * sc);
  g.lineStyle(7 * sc, INK, 1);
  g.strokeCircle(cx - 78 * sc, by + 16 * sc, 28 * sc);
  g.fillStyle(0xffe15a, 1);
  g.fillCircle(cx, by, 78 * sc);
  g.lineStyle(10 * sc, INK, 1);
  g.strokeCircle(cx, by, 78 * sc);
  g.fillStyle(0xfff4b8, 1);
  g.fillCircle(cx, by + 22 * sc, 46 * sc);
  g.lineStyle(6 * sc, INK, 1);
  g.strokeCircle(cx, by + 22 * sc, 46 * sc);
  g.fillStyle(0xffb0c4, 0.95);
  g.fillCircle(cx - 40 * sc, by + 10 * sc, 14 * sc);
  g.fillCircle(cx + 40 * sc, by + 10 * sc, 14 * sc);
  const eye = (ex, up) => {
    if (mode === 'nap' || mode === 'blink') {
      g.lineStyle(7 * sc, INK, 1);
      g.beginPath();
      g.arc(ex, by - 16 * sc, 14 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
      g.strokePath();
      return;
    }
    g.fillStyle(0xfffdf8, 1);
    g.fillCircle(ex, by - 18 * sc, 16 * sc);
    g.lineStyle(6 * sc, INK, 1);
    g.strokeCircle(ex, by - 18 * sc, 16 * sc);
    g.fillStyle(INK, 1);
    const py = up ? by - 26 * sc : by - 14 * sc;
    g.fillCircle(ex, py, 7 * sc);
  };
  eye(cx - 26 * sc, mode === 'look');
  eye(cx + 26 * sc, mode === 'look');
  g.fillStyle(0xf4a24a, 1);
  g.fillTriangle(cx - 14 * sc, by + 8 * sc, cx + 14 * sc, by + 8 * sc, cx, by + 28 * sc);
  g.lineStyle(6 * sc, INK, 1);
  g.strokeTriangle(cx - 14 * sc, by + 8 * sc, cx + 14 * sc, by + 8 * sc, cx, by + 28 * sc);
}

function drawMoonBody(g, tw, th) {
  const cx = tw * 0.5;
  const cy = th * 0.5;
  const r = tw * 0.42;
  g.fillStyle(0xfff3c4, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(0xffe3a4, 1);
  g.fillCircle(cx + r * 0.28, cy + r * 0.22, r * 0.18);
  g.fillCircle(cx - r * 0.32, cy + r * 0.28, r * 0.1);
  g.fillStyle(0xffb7c8, 0.9);
  g.fillCircle(cx - r * 0.38, cy + r * 0.08, r * 0.12);
  g.fillCircle(cx + r * 0.38, cy + r * 0.08, r * 0.12);
  g.fillStyle(0xffffff, 0.55);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.16);
  g.lineStyle(16, INK, 1);
  g.strokeCircle(cx, cy, r);
}

function drawMoonFace(g, tw, th, mode) {
  const cx = tw * 0.5;
  const cy = th * 0.52;
  const sc = tw / 560;
  if (mode === 'blink') {
    g.lineStyle(12, INK, 1);
    g.beginPath();
    g.arc(cx - 70 * sc, cy - 10 * sc, 28 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
    g.strokePath();
    g.beginPath();
    g.arc(cx + 70 * sc, cy - 10 * sc, 28 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
    g.strokePath();
  } else if (mode === 'wow') {
    const eye = (ex) => {
      g.fillStyle(0xfffdf8, 1);
      g.fillCircle(ex, cy - 16 * sc, 36 * sc);
      g.lineStyle(10, INK, 1);
      g.strokeCircle(ex, cy - 16 * sc, 36 * sc);
      g.fillStyle(0xffd56a, 1);
      g.fillCircle(ex, cy - 16 * sc, 14 * sc);
    };
    eye(cx - 72 * sc);
    eye(cx + 72 * sc);
  } else {
    const eye = (ex) => {
      g.fillStyle(0xfffdf8, 1);
      g.fillCircle(ex, cy - 8 * sc, 28 * sc);
      g.lineStyle(10, INK, 1);
      g.strokeCircle(ex, cy - 8 * sc, 28 * sc);
      g.fillStyle(INK, 1);
      g.fillCircle(ex + 2 * sc, cy - 4 * sc, 12 * sc);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex - 4 * sc, cy - 12 * sc, 5 * sc);
    };
    eye(cx - 70 * sc);
    eye(cx + 70 * sc);
  }
  const smileR = mode === 'wow' ? 78 : 62;
  const smileY = mode === 'wow' ? cy + 36 * sc : cy + 28 * sc;
  g.lineStyle(mode === 'wow' ? 14 : 12, INK, 1);
  g.beginPath();
  g.arc(cx, smileY, smileR * sc, Math.PI * 0.12, Math.PI * 0.88, false);
  g.strokePath();
}

export function paintAll(scene) {
  tex(scene, 'soil', SOIL_LOGICAL, SOIL_LOGICAL, drawSoil);
  for (let i = 0; i < CROPS.length; i++) {
    const spec = CROPS[i];
    const draw = (stage, ripe) => (g, tw, th) => drawCropShape(g, tw, th, spec, stage, ripe);
    tex(scene, 'crop_' + spec.id + '_1', 112, 120, draw(1, false));
    tex(scene, 'crop_' + spec.id + '_2', 112, 120, draw(2, false));
    tex(scene, 'crop_' + spec.id + '_3', 112, 120, draw(3, false));
    tex(scene, 'crop_' + spec.id + '_ripe', 112, 120, draw(3, true));
  }
  for (let i = 0; i < ANIMALS.length; i++) {
    const spec = ANIMALS[i];
    tex(scene, 'an_' + spec.id, 96, 96, (g, tw, th) => drawAnimal(g, tw, th, spec));
  }
  tex(scene, 'pip', 150, 170, (g, tw, th) => drawPip(g, tw, th, 'idle'));
  tex(scene, 'pip_blink', 150, 170, (g, tw, th) => drawPip(g, tw, th, 'blink'));
  tex(scene, 'pip_look', 150, 170, (g, tw, th) => drawPip(g, tw, th, 'look'));
  tex(scene, 'pip_nap', 150, 170, (g, tw, th) => drawPip(g, tw, th, 'nap'));
  tex(scene, 'moon_body', 280, 280, drawMoonBody);
  tex(scene, 'moon_face', 280, 280, (g, tw, th) => drawMoonFace(g, tw, th, 'open'));
  tex(scene, 'moon_blink', 280, 280, (g, tw, th) => drawMoonFace(g, tw, th, 'blink'));
  tex(scene, 'moon_wow', 280, 280, (g, tw, th) => drawMoonFace(g, tw, th, 'wow'));
  tex(scene, 'coin', 40, 40, (g, tw, th) => {
    g.fillStyle(0xf0b429, 1);
    g.fillCircle(tw * 0.5, th * 0.5, tw * 0.42);
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(tw * 0.5, th * 0.5, tw * 0.28);
    g.lineStyle(6, INK, 1);
    g.strokeCircle(tw * 0.5, th * 0.5, tw * 0.42);
  });
  tex(scene, 'dust', 40, 40, (g, tw, th) => {
    const cx = tw * 0.5;
    const cy = th * 0.5;
    g.fillStyle(0xfff6c8, 1);
    g.fillCircle(cx, cy, tw * 0.28);
    g.fillStyle(0xb48cff, 1);
    g.fillCircle(cx, cy, tw * 0.12);
    g.lineStyle(4, INK, 1);
    g.strokeCircle(cx, cy, tw * 0.28);
  });
  tex(scene, 'spark', 36, 36, (g, tw, th) => {
    const cx = tw * 0.5;
    const cy = th * 0.5;
    g.fillStyle(0xfff6c8, 1);
    g.fillTriangle(cx, 2, cx - 8, cy, cx, th - 2);
    g.fillTriangle(cx, 2, cx + 8, cy, cx, th - 2);
    g.fillTriangle(2, cy, cx, cy - 8, tw - 2, cy);
    g.fillTriangle(2, cy, cx, cy + 8, tw - 2, cy);
  });
  tex(scene, 'crow', 80, 70, (g, tw, th) => {
    g.fillStyle(0x2a2a32, 1);
    g.fillEllipse(tw * 0.45, th * 0.55, tw * 0.7, th * 0.45);
    g.fillCircle(tw * 0.72, th * 0.38, th * 0.22);
    g.fillStyle(0xf0b429, 1);
    g.fillTriangle(tw * 0.84, th * 0.36, tw * 0.98, th * 0.42, tw * 0.84, th * 0.48);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(tw * 0.78, th * 0.32, 5);
    g.fillStyle(INK, 1);
    g.fillCircle(tw * 0.8, th * 0.32, 2.5);
    g.lineStyle(6, INK, 1);
    g.strokeEllipse(tw * 0.45, th * 0.55, tw * 0.7, th * 0.45);
  });
  tex(scene, 'weed', 90, 90, (g, tw, th) => {
    g.fillStyle(0x3e9a45, 1);
    g.fillEllipse(tw * 0.5, th * 0.62, tw * 0.28, th * 0.55);
    g.fillEllipse(tw * 0.32, th * 0.58, tw * 0.22, th * 0.42);
    g.fillEllipse(tw * 0.68, th * 0.56, tw * 0.22, th * 0.46);
    g.lineStyle(6, INK, 1);
    g.strokeEllipse(tw * 0.5, th * 0.62, tw * 0.28, th * 0.55);
  });
  tex(scene, 'puff', 48, 48, (g, tw, th) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(tw * 0.5, th * 0.5, tw * 0.36);
  });
  tex(scene, 'confetti', 18, 28, (g, tw, th) => {
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(1, 1, tw - 2, th - 2, 6);
  });
  tex(scene, 'cloud', 180, 70, (g, tw, th) => {
    g.fillStyle(0xffffff, 0.92);
    g.fillCircle(tw * 0.32, th * 0.58, th * 0.32);
    g.fillCircle(tw * 0.52, th * 0.46, th * 0.4);
    g.fillCircle(tw * 0.7, th * 0.58, th * 0.28);
  });
  tex(scene, 'shadow', 120, 36, (g, tw, th) => {
    g.fillStyle(0x3a2a22, 0.22);
    g.fillEllipse(tw * 0.5, th * 0.5, tw - 16, th - 8);
  });
  tex(scene, 'bubble', 64, 64, (g, tw, th) => {
    g.fillStyle(0xffffff, 0.95);
    g.fillCircle(tw * 0.5, th * 0.5, tw * 0.4);
    g.lineStyle(6, INK, 1);
    g.strokeCircle(tw * 0.5, th * 0.5, tw * 0.4);
  });
  tex(scene, 'goldglow', 200, 200, (g, tw, th) => {
    const cx = tw * 0.5;
    const cy = th * 0.5;
    g.fillStyle(0xffd34d, 0.9);
    g.fillCircle(cx, cy, tw * 0.44);
    g.fillStyle(0xfff1a8, 1);
    g.fillCircle(cx, cy, tw * 0.32);
    g.lineStyle(10, 0xc98a10, 1);
    g.strokeCircle(cx, cy, tw * 0.44);
    // a little gold star badge, top right
    const sx = tw * 0.82;
    const sy = th * 0.18;
    const pts = [];
    for (let k = 0; k < 10; k++) {
      const r = k % 2 ? tw * 0.06 : tw * 0.14;
      const a = -Math.PI / 2 + (k * Math.PI) / 5;
      pts.push({ x: sx + Math.cos(a) * r, y: sy + Math.sin(a) * r });
    }
    g.fillStyle(0xffc21a, 1);
    g.fillPoints(pts, true);
    g.lineStyle(6, INK, 1);
    g.strokePoints(pts, true);
  });
  tex(scene, 'fence', 70, 54, (g, tw, th) => {
    g.fillStyle(0xf0d8a8, 1);
    g.fillRect(6, 8, 10, th - 10);
    g.fillRect(tw - 16, 8, 10, th - 10);
    g.fillRect(6, 16, tw - 12, 8);
    g.fillRect(6, 34, tw - 12, 8);
    g.lineStyle(4, INK, 1);
    g.strokeRect(6, 8, 10, th - 10);
  });
}
