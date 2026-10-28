import { GAME_W, TUNING } from './config.js?v=1';

export function fieldMetrics(size) {
  const gap = TUNING.fieldGap;
  const span = TUNING.fieldSpan;
  let plot = Math.floor((span - (size - 1) * gap) / size);
  if (plot < TUNING.plotMin) plot = TUNING.plotMin;
  const used = size * plot + (size - 1) * gap;
  const left = (GAME_W - span) / 2;
  const top = TUNING.fieldTop;
  return {
    plot,
    gap,
    span,
    used,
    left,
    top,
    ox: left + (span - used) / 2,
    oy: top + (span - used) / 2,
  };
}

export function emptyPlot(i, row, col, x, y, plot) {
  return {
    i,
    row,
    col,
    x,
    y,
    w: plot,
    h: plot,
    crop: null,
    age: 0,
    stage: 0,
    ripe: false,
    golden: false,
    crow: false,
    crowT: 0,
    weed: false,
    swiped: false,
    floating: false,
  };
}

export function buildPlots(size) {
  const m = fieldMetrics(size);
  const plots = [];
  let i = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      plots.push(emptyPlot(
        i,
        row,
        col,
        m.ox + col * (m.plot + m.gap),
        m.oy + row * (m.plot + m.gap),
        m.plot,
      ));
      i++;
    }
  }
  return plots;
}

// Where each animal's drawing sits inside its 320x320 texture (left, top, right, bottom),
// measured from the art in art.js. Used to space animals so their drawings never touch.
const ANIMAL_TRIM = {
  hen: [73, 62, 319, 254], duck: [73, 62, 319, 261], bunny: [71, 18, 248, 274],
  frog: [61, 72, 258, 259], cat: [71, 68, 248, 274], hedgehog: [64, 121, 255, 249],
  goat: [73, 56, 289, 259], dog: [64, 87, 297, 251], sheep: [56, 106, 282, 274],
  pig: [56, 106, 292, 249], owl: [81, 94, 238, 276], cow: [49, 62, 283, 274],
  dusty: [56, 136, 263, 234],
};
const TRIM_DEFAULT = [49, 18, 319, 276];
// ground = front feet (field top is 430; 5 px spare for the idle bob); feet = highest a row's feet may
// stand and still be on the green hill; top = highest any drawing may reach.
export const YARD = { left: 228, right: 712, top: 150, ground: 425, hitBottom: 428, feet: 332, gap: 8, maxScale: 0.68, minHit: 110, hitTop: 104 };

function rowSplit(n, rows) {
  const out = [];
  let left = n;
  for (let r = 0; r < rows; r++) {
    const k = Math.ceil(left / (rows - r));
    out.push(k);
    left -= k;
  }
  return out;
}

function tryLayout(ids, rows, sc) {
  const W = YARD.right - YARD.left;
  const counts = rowSplit(ids.length, rows);
  let i = 0;
  let base = YARD.ground;
  const out = [];
  for (let r = 0; r < rows; r++) {
    const row = ids.slice(i, i + counts[r]);
    i += counts[r];
    let wsum = 0;
    let hmax = 0;
    for (let k = 0; k < row.length; k++) {
      const t = ANIMAL_TRIM[row[k]] || TRIM_DEFAULT;
      wsum += (t[2] - t[0]) * sc;
      hmax = Math.max(hmax, (t[3] - t[1]) * sc);
    }
    if (base < YARD.feet) return null;
    if (wsum + YARD.gap * (row.length - 1) > W) return null;
    if (base - hmax < YARD.top) return null;
    // Spread the row evenly across the hill (gaps capped so a short row stays together).
    const gap = row.length > 1 ? Math.min((W - wsum) / (row.length - 1), YARD.gap + 40 * sc) : 0;
    let x = YARD.left + (W - wsum - gap * (row.length - 1)) / 2;
    for (let k = 0; k < row.length; k++) {
      const t = ANIMAL_TRIM[row[k]] || TRIM_DEFAULT;
      const vw = (t[2] - t[0]) * sc;
      const vh = (t[3] - t[1]) * sc;
      const vis = { x, y: base - vh, w: vw, h: vh };
      out.push({ vis, row: r, scale: sc, imgX: x - (t[0] - 160) * sc, imgY: base - (t[3] - 160) * sc });
      x += vw + gap;
    }
    base -= hmax + YARD.gap;
  }
  return out;
}

let yardCache = { sig: null, slots: [] };

// One spot per animal on the hill, in purchase order: front row first, then the row behind it.
// Animals shrink only as much as needed so no two drawings overlap.
// Each slot: x/y/w/h = tap box (at least 110 px, may overlap a neighbour's; the nearest animal wins),
// vis = the drawing's box, imgX/imgY/scale = where to draw the sprite.
export function yardSlots(animals) {
  const ids = (animals || []).map((a) => (typeof a === 'string' ? a : a && a.id));
  const sig = ids.join(',');
  if (sig === yardCache.sig) return yardCache.slots;
  let best = null;
  for (let sc = YARD.maxScale; sc > 0.1 && !best; sc -= 0.01) {
    for (let rows = 1; rows <= 4 && !best; rows++) {
      if (rows > ids.length) break;
      best = tryLayout(ids, rows, sc);
    }
  }
  const slots = (best || []).map((s) => {
    const v = s.vis;
    const w = Math.max(YARD.minHit, v.w);
    const h = Math.max(YARD.minHit, v.h);
    let x = v.x + v.w / 2 - w / 2;
    let y = v.y + v.h / 2 - h / 2;
    if (y + h > YARD.hitBottom) y = YARD.hitBottom - h;
    if (y < YARD.hitTop) y = YARD.hitTop;
    if (x + w > 720) x = 720 - w;
    return { x, y, w, h, row: s.row, vis: v, scale: s.scale, imgX: s.imgX, imgY: s.imgY, cx: v.x + v.w / 2, cy: v.y + v.h / 2 };
  });
  yardCache = { sig, slots };
  return slots;
}

export function adjacent(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1;
}

// Entry time of a segment against an axis-aligned rect, or null on a miss.
// Inclusive of the boundary so a swipe along a plot edge still counts.
export function segmentEntryT(x0, y0, x1, y1, rect) {
  let t0 = 0;
  let t1 = 1;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const xmin = rect.x;
  const xmax = rect.x + rect.w;
  const ymin = rect.y;
  const ymax = rect.y + rect.h;
  const ps = [-dx, dx, -dy, dy];
  const qs = [x0 - xmin, xmax - x0, y0 - ymin, ymax - y0];
  for (let i = 0; i < 4; i++) {
    const pi = ps[i];
    const qi = qs[i];
    if (pi === 0) {
      if (qi < 0) return null;
    } else {
      const r = qi / pi;
      if (pi < 0) {
        if (r > t1) return null;
        if (r > t0) t0 = r;
      } else {
        if (r < t0) return null;
        if (r < t1) t1 = r;
      }
    }
  }
  return t0;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}
