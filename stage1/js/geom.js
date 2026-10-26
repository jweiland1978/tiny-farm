import { GAME_W, TUNING } from './config.js?v=1';

export function fieldMetrics(size) {
  const plot = TUNING.plotSize;
  const gap = TUNING.plotGap;
  const maxSpan = 4 * plot + 3 * gap;
  const span = size * plot + (size - 1) * gap;
  const left = (GAME_W - maxSpan) / 2;
  const top = TUNING.fieldBottom - maxSpan;
  return {
    plot,
    gap,
    maxSpan,
    span,
    left,
    top,
    ox: left + (maxSpan - span) / 2,
    oy: top + (maxSpan - span) / 2,
  };
}

export function buildPlots(size) {
  const m = fieldMetrics(size);
  const plots = [];
  let i = 0;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      plots.push({
        i,
        row,
        col,
        x: m.ox + col * (m.plot + m.gap),
        y: m.oy + row * (m.plot + m.gap),
        w: m.plot,
        h: m.plot,
        crop: null,
        age: 0,
        stage: 0,
        ripe: false,
      });
      i++;
    }
  }
  return plots;
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
  const p0 = -dx;
  const p1 = dx;
  const p2 = -dy;
  const p3 = dy;
  const q0 = x0 - xmin;
  const q1 = xmax - x0;
  const q2 = y0 - ymin;
  const q3 = ymax - y0;
  const ps = [p0, p1, p2, p3];
  const qs = [q0, q1, q2, q3];
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
