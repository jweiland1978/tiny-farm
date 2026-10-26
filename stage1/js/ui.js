import { FONT } from './config.js?v=1';

const INK = 0x3a2a22;

export function drawPlate(g, x, y, w, h, fill, lip, selected) {
  const r = Math.min(28, Math.floor(h * 0.3));
  const lw = selected ? 10 : 7;
  g.fillStyle(lip, 1);
  g.fillRoundedRect(x + 2, y + 8, w - 4, h - 10, r);
  g.fillStyle(fill, 1);
  g.fillRoundedRect(x + 2, y + 2, w - 4, h - 14, r);
  const inset = lw * 0.5 + 1;
  g.lineStyle(lw, selected ? 0xd89a12 : INK, 1);
  g.strokeRoundedRect(x + inset, y + inset, w - inset * 2, h - inset * 2, Math.max(8, r - inset));
}

export function addButton(scene, list, spec) {
  const depth = spec.depth || 40;
  const fill = spec.fill == null ? 0xfff4d2 : spec.fill;
  const lip = spec.lip == null ? 0xe7b56a : spec.lip;
  const g = scene.add.graphics().setDepth(depth);
  drawPlate(g, spec.x, spec.y, spec.w, spec.h, fill, lip, !!spec.selected);
  const text = scene.add.text(spec.x + spec.w / 2, spec.y + spec.h / 2 - 4, spec.label, {
    fontFamily: FONT,
    fontSize: (spec.fontSize || 32) + 'px',
    color: spec.color || '#3A2A22',
    fontStyle: 'bold',
    align: 'center',
    wordWrap: spec.wrap ? { width: spec.w - 28 } : undefined,
  }).setOrigin(0.5).setDepth(depth + 1);
  const zone = scene.add.zone(spec.x + spec.w / 2, spec.y + spec.h / 2, spec.w, spec.h).setDepth(depth + 2);
  zone.setInteractive();
  const rec = {
    x: spec.x,
    y: spec.y,
    w: spec.w,
    h: spec.h,
    label: spec.label,
    visible: true,
    g,
    text,
    zone,
    onTap: spec.onTap || null,
    fill,
    lip,
    depth,
  };
  list.push(rec);
  return rec;
}

export function setButtonVisible(rec, visible) {
  rec.visible = visible;
  rec.g.setVisible(visible);
  rec.text.setVisible(visible);
  if (visible) {
    rec.zone.setVisible(true);
    if (!rec.zone.input || !rec.zone.input.enabled) rec.zone.setInteractive();
  } else {
    rec.zone.disableInteractive();
    rec.zone.setVisible(false);
  }
}

export function redrawPlate(rec, opts) {
  if (opts.label != null) {
    rec.label = opts.label;
    rec.text.setText(opts.label);
  }
  if (opts.color) rec.text.setColor(opts.color);
  if (opts.fill != null) rec.fill = opts.fill;
  if (opts.lip != null) rec.lip = opts.lip;
  rec.g.clear();
  drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, rec.fill, rec.lip, !!opts.selected);
}

export function hitButton(list, x, y) {
  for (let i = list.length - 1; i >= 0; i--) {
    const b = list[i];
    if (!b.visible) continue;
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b;
  }
  return null;
}

export function listVisible(list) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (!b.visible) continue;
    out.push({ x: b.x, y: b.y, w: b.w, h: b.h, label: b.label });
  }
  return out;
}
