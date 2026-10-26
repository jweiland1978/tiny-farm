import { TUNING } from './config.js?v=1';

export const TEX_SCALE = 0.5;

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

export function drawFarmBackdrop(g) {
  for (let i = 0; i < 18; i++) {
    const t = i / 17;
    g.fillStyle(mix(0x8fd4f5, 0xfff1c9, t), 1);
    g.fillRect(0, (1280 / 18) * i, 720, 1280 / 18 + 2);
  }
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(120, 150, 36);
  g.fillCircle(168, 150, 28);
  g.fillCircle(520, 120, 26);
  g.fillStyle(0x9adf90, 1);
  g.fillEllipse(360, 410, 640, 220);
  g.fillStyle(0x7ed184, 1);
  g.fillEllipse(170, 490, 500, 260);
  g.fillStyle(0x6ec47a, 1);
  g.fillRect(0, 430, 720, 900);
  g.fillStyle(0x62b86e, 1);
  g.fillEllipse(360, 530, 560, 120);
  drawCreek(g, 8, 500, 52, 490);
  drawBarn(g, 28, 176, 200, 176);
  // Wooden shelf behind the seed tray.
  g.fillStyle(0xd9a36a, 1);
  g.fillRoundedRect(8, 1004, 704, 268, 28);
  g.fillStyle(0xc4894e, 1);
  g.fillRect(8, 1004, 704, 18);
  g.lineStyle(8, INK, 1);
  g.strokeRoundedRect(12, 1008, 696, 256, 24);
}

function drawCreek(g, x, y, w, h) {
  g.fillStyle(0x7fd4ee, 1);
  g.fillRoundedRect(x, y, w, h, 26);
  g.fillStyle(0xb9ecf8, 0.85);
  g.fillRoundedRect(x + 10, y + 16, w - 22, h - 40, 18);
  g.lineStyle(8, INK, 1);
  g.strokeRoundedRect(x, y, w, h, 26);
  g.fillStyle(0xf2e2c4, 1);
  g.fillCircle(x + w * 0.5, y + 70, 8);
  g.fillCircle(x + w * 0.42, y + 180, 6);
  g.fillCircle(x + w * 0.58, y + 300, 7);
  g.fillCircle(x + w * 0.48, y + 430, 6);
  g.lineStyle(4, INK, 1);
  g.strokeCircle(x + w * 0.5, y + 70, 8);
  g.strokeCircle(x + w * 0.42, y + 180, 6);
  g.strokeCircle(x + w * 0.58, y + 300, 7);
  g.strokeCircle(x + w * 0.48, y + 430, 6);
}

function drawBarn(g, x, y, w, h) {
  g.fillStyle(0x8d3d38, 1);
  g.fillTriangle(x - 8, y + 54, x + w * 0.5, y - 8, x + w + 8, y + 54);
  g.fillStyle(0xe15a4c, 1);
  g.fillRoundedRect(x, y + 48, w, h - 48, 12);
  const doorX = x + w * 0.26;
  const doorY = y + h - 88;
  const doorW = w * 0.48;
  const doorH = 84;
  g.fillStyle(0x6e302c, 1);
  g.fillRoundedRect(doorX, doorY, doorW, doorH, 8);
  g.fillStyle(0xfff1c4, 1);
  g.fillCircle(x + w * 0.5, y + 78, 16);
  g.lineStyle(8, INK, 1);
  g.strokeTriangle(x - 8, y + 54, x + w * 0.5, y - 8, x + w + 8, y + 54);
  g.strokeRoundedRect(x, y + 48, w, h - 48, 12);
  g.strokeCircle(x + w * 0.5, y + 78, 16);
  g.lineStyle(6, INK, 1);
  g.strokeRoundedRect(doorX, doorY, doorW, doorH, 8);
  g.beginPath();
  g.moveTo(x + w * 0.5, doorY + 4);
  g.lineTo(x + w * 0.5, doorY + doorH - 4);
  g.strokePath();
  g.lineStyle(4, 0xf0b429, 1);
  const brace = (x0, x1) => {
    g.beginPath();
    g.moveTo(x0, doorY + 14);
    g.lineTo(x1, doorY + doorH - 14);
    g.moveTo(x1, doorY + 14);
    g.lineTo(x0, doorY + doorH - 14);
    g.strokePath();
  };
  brace(doorX + 8, x + w * 0.5 - 8);
  brace(x + w * 0.5 + 8, doorX + doorW - 8);
}

export function drawTitleBackdrop(g) {
  for (let i = 0; i < 16; i++) {
    const t = i / 15;
    g.fillStyle(mix(0x8fd4f5, 0xfff3d2, t), 1);
    g.fillRect(0, (1280 / 16) * i, 720, 1280 / 16 + 2);
  }
  g.fillStyle(0x8ed888, 1);
  g.fillEllipse(370, 830, 820, 420);
  g.fillStyle(0x6ec47a, 1);
  g.fillRect(0, 820, 720, 500);
  g.fillStyle(0x62b86e, 1);
  g.fillEllipse(370, 870, 620, 140);
  drawCreek(g, 250, 860, 420, 70);
  // The title creek is a wide ribbon, still a creek.
  drawBarn(g, 48, 640, 210, 190);
  drawStand(g, 470, 700, 180, 150);
}

function drawStand(g, x, y, w, h) {
  g.fillStyle(0xf25d62, 1);
  g.fillRoundedRect(x, y, w, 36, 10);
  g.fillStyle(0xfff7ea, 1);
  g.fillRect(x + 8, y + 18, w - 16, 18);
  g.fillStyle(0xe7b56d, 1);
  g.fillRoundedRect(x + 16, y + 36, w - 32, h - 36, 8);
  g.fillStyle(0xd39a52, 1);
  g.fillRect(x + 16, y + h - 28, w - 32, 22);
  g.lineStyle(8, INK, 1);
  g.strokeRoundedRect(x, y, w, 36, 10);
  g.strokeRoundedRect(x + 16, y + 36, w - 32, h - 36, 8);
  g.fillStyle(0xf06070, 1);
  g.fillCircle(x + 48, y + 78, 12);
  g.fillStyle(0xf39a2e, 1);
  g.fillCircle(x + 80, y + 78, 12);
  g.fillStyle(0x7ed36a, 1);
  g.fillCircle(x + 112, y + 78, 12);
  g.lineStyle(4, INK, 1);
  g.strokeCircle(x + 48, y + 78, 12);
  g.strokeCircle(x + 80, y + 78, 12);
  g.strokeCircle(x + 112, y + 78, 12);
}

export function drawStandBackdrop(g) {
  for (let i = 0; i < 14; i++) {
    const t = i / 13;
    g.fillStyle(mix(0x8fd4f5, 0xfff0cc, t), 1);
    g.fillRect(0, (1280 / 14) * i, 720, 1280 / 14 + 2);
  }
  g.fillStyle(0x7ed184, 1);
  g.fillRect(0, 980, 720, 320);
}

function drawSoil(g, tw, th) {
  g.fillStyle(0xb8743e, 1);
  g.fillRoundedRect(6, 8, tw - 12, th - 12, 40);
  g.fillStyle(0xe2b56e, 1);
  g.fillRoundedRect(18, 18, tw - 36, th - 42, 32);
  g.fillStyle(0xd39a52, 1);
  g.fillCircle(tw * 0.32, th * 0.42, 7);
  g.fillCircle(tw * 0.66, th * 0.58, 6);
  g.fillCircle(tw * 0.46, th * 0.7, 5);
  g.lineStyle(14, INK, 1);
  g.strokeRoundedRect(14, 14, tw - 28, th - 28, 36);
}

function sprout(g, x, y, sc, color) {
  g.fillStyle(color, 1);
  g.fillCircle(x, y, 28 * sc);
  g.fillCircle(x - 34 * sc, y + 12 * sc, 20 * sc);
  g.fillCircle(x + 34 * sc, y + 8 * sc, 20 * sc);
  g.lineStyle(8 * sc, INK, 1);
  g.strokeCircle(x, y, 28 * sc);
  g.strokeCircle(x - 34 * sc, y + 12 * sc, 20 * sc);
  g.strokeCircle(x + 34 * sc, y + 8 * sc, 20 * sc);
}

function shine(g, x, y, sc) {
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(x, y, 7 * sc);
  g.fillCircle(x + 4 * sc, y + 10 * sc, 3.5 * sc);
}

function smile(g, x, y, r, sc) {
  g.lineStyle(5 * sc, INK, 1);
  g.beginPath();
  g.arc(x, y, r * sc, Math.PI * 0.15, Math.PI * 0.85, false);
  g.strokePath();
}

function drawRadish(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const bulb = ripe ? 78 : stage === 3 ? 64 : stage === 2 ? 40 : 0;
  if (bulb > 0) {
    g.fillStyle(0xf06070, 1);
    g.fillCircle(cx, th * 0.62, bulb * sc);
    g.lineStyle(8 * sc, INK, 1);
    g.strokeCircle(cx, th * 0.62, bulb * sc);
    g.fillStyle(0xffd0d6, 1);
    g.fillCircle(cx - 16 * sc, th * 0.56, 10 * sc);
    if (ripe) shine(g, cx - 22 * sc, th * 0.5, sc);
  }
  sprout(g, cx, bulb > 0 ? th * 0.26 : th * 0.5, sc * (bulb > 0 ? 0.62 : 1.15), 0x3dae55);
  if (ripe) smile(g, cx, th * 0.64, 16, sc);
}

function drawCarrot(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const h = ripe ? 120 : stage === 3 ? 100 : stage === 2 ? 64 : 0;
  if (h > 0) {
    g.fillStyle(0xf39a2e, 1);
    g.fillTriangle(cx, th * 0.86, cx - 36 * sc, th * 0.42, cx + 36 * sc, th * 0.42);
    g.lineStyle(8 * sc, INK, 1);
    g.strokeTriangle(cx, th * 0.86, cx - 36 * sc, th * 0.42, cx + 36 * sc, th * 0.42);
    g.fillStyle(0xffe1b0, 1);
    g.fillCircle(cx - 8 * sc, th * 0.55, 7 * sc);
    if (ripe) shine(g, cx - 12 * sc, th * 0.5, sc);
  }
  sprout(g, cx, h > 0 ? th * 0.24 : th * 0.5, sc * (h > 0 ? 0.62 : 1.15), 0x3dae55);
}

function drawPeas(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const pods = stage === 1 && !ripe ? 0 : stage === 2 ? 1 : 2;
  const n = ripe ? 2 : pods;
  sprout(g, cx, n === 0 ? th * 0.5 : th * 0.24, sc * (n === 0 ? 1.15 : 0.55), 0x5ec45a);
  for (let i = 0; i < n; i++) {
    const y = th * (0.5 + i * 0.18);
    const x = cx + (i === 0 ? -8 : 16) * sc;
    g.fillStyle(ripe ? 0xb6f08a : 0x8fd96a, 1);
    g.fillCircle(x, y, (ripe ? 32 : 24) * sc);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(x, y, (ripe ? 32 : 24) * sc);
    if (ripe) {
      g.lineStyle(4 * sc, INK, 1);
      g.beginPath();
      g.arc(x - 8 * sc, y - 4 * sc, 6 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
      g.strokePath();
      g.beginPath();
      g.arc(x + 8 * sc, y - 4 * sc, 6 * sc, Math.PI * 1.15, Math.PI * 1.85, false);
      g.strokePath();
      smile(g, x, y + 4 * sc, 8, sc);
    }
  }
}

function drawLettuce(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const layers = ripe ? 4 : stage;
  const colors = [0xb6e89a, 0x8ed87a, 0x6ec864, 0xd8f5c4];
  const lone = layers === 1 ? 1.7 : 1;
  for (let i = 0; i < layers; i++) {
    const rad = (28 + i * 14) * sc * (ripe ? 1.05 : lone);
    g.fillStyle(colors[i % colors.length], 1);
    g.fillCircle(cx, th * 0.58, rad);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, th * 0.58, rad);
  }
  if (ripe) shine(g, cx - 20 * sc, th * 0.48, sc);
}

function drawBerry(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  sprout(g, cx, stage === 1 && !ripe ? th * 0.5 : th * 0.22, sc * (stage === 1 && !ripe ? 1.1 : 0.5), 0x3dae55);
  if (stage === 2 && !ripe) {
    g.fillStyle(0xfff6ea, 1);
    g.fillCircle(cx, th * 0.55, 28 * sc);
    g.fillStyle(0xffd0e0, 1);
    g.fillCircle(cx, th * 0.55, 12 * sc);
    g.lineStyle(7 * sc, INK, 1);
    g.strokeCircle(cx, th * 0.55, 28 * sc);
    return;
  }
  if (stage >= 3 || ripe) {
    const rad = ripe ? 48 : 32;
    g.fillStyle(0xef4d5a, 1);
    g.fillCircle(cx, th * 0.6, rad * sc);
    g.lineStyle(8 * sc, INK, 1);
    g.strokeCircle(cx, th * 0.6, rad * sc);
    g.fillStyle(0xfff6b8, 1);
    const seeds = ripe ? 5 : 3;
    for (let i = 0; i < seeds; i++) {
      const a = -0.8 + i * 0.4;
      g.fillCircle(cx + Math.cos(a) * rad * 0.45 * sc, th * 0.6 + Math.sin(a) * rad * 0.4 * sc, 4 * sc);
    }
    if (ripe) shine(g, cx - 16 * sc, th * 0.5, sc);
  }
}

function drawOnion(g, tw, th, stage, ripe) {
  const sc = tw / 220;
  const cx = tw * 0.5;
  const rad = ripe ? 58 : stage === 3 ? 48 : stage === 2 ? 32 : 0;
  if (rad > 0) {
    g.fillStyle(0xf6e6ff, 1);
    g.fillCircle(cx, th * 0.62, rad * sc);
    g.fillStyle(0xe4c6f6, 1);
    g.fillCircle(cx, th * 0.62, rad * 0.62 * sc);
    g.lineStyle(8 * sc, INK, 1);
    g.strokeCircle(cx, th * 0.62, rad * sc);
    g.strokeCircle(cx, th * 0.62, rad * 0.62 * sc);
    if (ripe) {
      shine(g, cx - 18 * sc, th * 0.52, sc);
      smile(g, cx, th * 0.66, 14, sc);
      g.fillStyle(INK, 1);
      g.fillCircle(cx - 14 * sc, th * 0.56, 4 * sc);
      g.fillCircle(cx + 14 * sc, th * 0.56, 4 * sc);
    }
  }
  g.fillStyle(0x6dbe6a, 1);
  g.fillRoundedRect(cx - 6 * sc, th * 0.16, 12 * sc, th * 0.22, 6 * sc);
  g.lineStyle(5 * sc, INK, 1);
  g.strokeRoundedRect(cx - 6 * sc, th * 0.16, 12 * sc, th * 0.22, 6 * sc);
  if (stage === 1 && !ripe) sprout(g, cx, th * 0.58, sc * 1.05, 0x6dbe6a);
}

const CROP_DRAW = {
  radish: drawRadish,
  carrot: drawCarrot,
  peas: drawPeas,
  lettuce: drawLettuce,
  strawberry: drawBerry,
  onion: drawOnion,
};

function drawPip(g, tw, th, mode) {
  const sc = tw / 300;
  const cx = tw * 0.5;
  const by = th * 0.52;
  // Boots.
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
  // Wing.
  g.fillStyle(0xffd24a, 1);
  g.fillCircle(cx - 78 * sc, by + 16 * sc, 28 * sc);
  g.lineStyle(7 * sc, INK, 1);
  g.strokeCircle(cx - 78 * sc, by + 16 * sc, 28 * sc);
  // Body.
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
    g.fillStyle(0xffffff, 1);
    g.fillCircle(ex - 3 * sc, py - 3 * sc, 3 * sc);
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
  g.fillCircle(cx + r * 0.1, cy - r * 0.32, r * 0.08);
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
      g.fillStyle(INK, 1);
      g.fillCircle(ex, cy - 16 * sc, 7 * sc);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(ex - 6 * sc, cy - 22 * sc, 5 * sc);
    };
    eye(cx - 72 * sc);
    eye(cx + 72 * sc);
    g.fillStyle(0xfff6b0, 1);
    g.fillCircle(cx - 120 * sc, cy - 70 * sc, 8 * sc);
    g.fillCircle(cx + 130 * sc, cy - 84 * sc, 6 * sc);
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
  tex(scene, 'soil', TUNING.plotSize, TUNING.plotSize, drawSoil);
  const ids = ['radish', 'carrot', 'peas', 'lettuce', 'strawberry', 'onion'];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const draw = CROP_DRAW[id];
    tex(scene, 'crop_' + id + '_1', 112, 120, (g, tw, th) => draw(g, tw, th, 1, false));
    tex(scene, 'crop_' + id + '_2', 112, 120, (g, tw, th) => draw(g, tw, th, 2, false));
    tex(scene, 'crop_' + id + '_3', 112, 120, (g, tw, th) => draw(g, tw, th, 3, false));
    tex(scene, 'crop_' + id + '_ripe', 112, 120, (g, tw, th) => draw(g, tw, th, 3, true));
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
  tex(scene, 'spark', 36, 36, (g, tw, th) => {
    const cx = tw * 0.5;
    const cy = th * 0.5;
    g.fillStyle(0xfff6c8, 1);
    g.fillTriangle(cx, 2, cx - 8, cy, cx, th - 2);
    g.fillTriangle(cx, 2, cx + 8, cy, cx, th - 2);
    g.fillTriangle(2, cy, cx, cy - 8, tw - 2, cy);
    g.fillTriangle(2, cy, cx, cy + 8, tw - 2, cy);
    g.lineStyle(3, INK, 1);
    g.strokeCircle(cx, cy, 4);
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
    g.lineStyle(6, INK, 0.35);
    g.strokeCircle(tw * 0.52, th * 0.46, th * 0.4);
  });
  tex(scene, 'shadow', 120, 36, (g, tw, th) => {
    g.fillStyle(0x3a2a22, 0.22);
    g.fillEllipse(tw * 0.5, th * 0.5, tw - 16, th - 8);
  });
}
