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

export function yardSlots() {
  const cols = 6;
  const s = 96;
  const gap = 4;
  const totalW = cols * s + (cols - 1) * gap;
  const x0 = (GAME_W - totalW) / 2;
  const y0 = 116;
  const slots = [];
  for (let i = 0; i < 12; i++) {
    const c = i % cols;
    const r = (i / cols) | 0;
    slots.push({ x: x0 + c * (s + gap), y: y0 + r * (s + gap), w: s, h: s });
  }
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
