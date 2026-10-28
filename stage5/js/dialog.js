import { FONT, TUNING } from './config.js?v=1';
import { session, logEvent, textScale } from './session.js?v=1';
import { addButton, setButtonVisible, hitButton, drawPlate } from './ui.js?v=1';

const INK = '#3A2A22';

function emptySnap() {
  return { open: false, speaker: '', text: '', shown: 0, done: false };
}

export function createDialog(scene, buttons) {
  const layer = {
    scene,
    buttons,
    open: false,
    block: false,
    speaker: '',
    text: '',
    shown: 0,
    done: false,
    lines: [],
    index: 0,
    startedAt: 0,
    autoHide: 0,
    hideAt: 0,
    onDone: null,
    skipBtn: null,
  };

  const g = scene.add.graphics().setDepth(80).setVisible(false);
  const name = scene.add.text(48, 0, '', {
    fontFamily: FONT, fontSize: '22px', color: INK, fontStyle: 'bold',
  }).setDepth(81).setVisible(false);
  const body = scene.add.text(48, 0, '', {
    fontFamily: FONT, fontSize: '26px', color: INK, fontStyle: 'bold',
    wordWrap: { width: 500 },
  }).setDepth(81).setVisible(false);
  const zone = scene.add.zone(360, 640, 640, 240).setDepth(82).setVisible(false);
  zone.setInteractive();

  const skip = addButton(scene, buttons, {
    x: 560, y: 0, w: 140, h: 96, label: 'SKIP', fontSize: 26, depth: 83,
    fill: 0xffe08a, lip: 0xe7a23a,
    onTap: () => skipBeat(layer),
  });
  setButtonVisible(skip, false);

  layer.g = g;
  layer.name = name;
  layer.body = body;
  layer.zone = zone;
  layer.skipBtn = skip;
  layer.box = { x: 24, y: 520, w: 672, h: 220 };

  return layer;
}

function layout(layer, compact) {
  const box = compact
    ? { x: 70, y: 150, w: 580, h: 150 }
    : { x: 24, y: 500, w: 672, h: 240 };
  layer.box = box;
  layer.compact = compact;
  layer.g.clear();
  layer.g.fillStyle(0xfff8ea, 1);
  layer.g.fillRoundedRect(box.x, box.y, box.w, box.h, 28);
  layer.g.lineStyle(7, 0x3a2a22, 1);
  layer.g.strokeRoundedRect(box.x + 4, box.y + 4, box.w - 8, box.h - 8, 24);
  layer.g.setVisible(true);
  layer.name.setPosition(box.x + 24, box.y + 16).setVisible(true);
  layer.body.setPosition(box.x + 24, box.y + 52).setVisible(true);
  layer.body.setWordWrapWidth(compact ? 430 : 480);
  const sc = textScale();
  layer.sc = sc;
  layer.name.setFontSize(Math.round(22 * sc));
  layer.body.setFontSize(Math.round(26 * sc));
  layer.zone.setPosition(box.x + box.w / 2, box.y + box.h / 2);
  layer.zone.setSize(box.w, box.h);
  layer.zone.setVisible(true);
  if (!layer.zone.input || !layer.zone.input.enabled) layer.zone.setInteractive();
  const skip = layer.skipBtn;
  skip.x = box.x + box.w - 148;
  skip.y = box.y + box.h - 108;
  skip.g.clear();
  drawPlate(skip.g, skip.x, skip.y, skip.w, skip.h, skip.fill, skip.lip, false);
  skip.text.setPosition(skip.x + skip.w / 2, skip.y + skip.h / 2 - 4);
  skip.zone.setPosition(skip.x + skip.w / 2, skip.y + skip.h / 2);
  setButtonVisible(skip, true);
}

function applyLine(layer) {
  const line = layer.lines[layer.index];
  if (!line) {
    closeDialog(layer);
    return;
  }
  layer.speaker = line.speaker || '';
  layer.text = line.text || '';
  layer.shown = 0;
  layer.done = false;
  layer.startedAt = performance.now();
  layer.name.setText(layer.speaker);
  layer.body.setText('');
  if (layer.speaker) logEvent({ type: 'dialog', speaker: layer.speaker });
  session.dialog = snapshot(layer);
}

export function showDialog(layer, lines, opts) {
  const list = lines && lines.length ? lines.slice() : [];
  if (!list.length) return;
  layer.lines = list;
  layer.index = 0;
  layer.open = true;
  layer.block = !!(opts && opts.block);
  layer.autoHide = (opts && opts.autoHide) || 0;
  layer.hideAt = 0;
  layer.onDone = (opts && opts.onDone) || null;
  if (layer.block) session.modal = true;
  layout(layer, !!(opts && opts.compact));
  applyLine(layer);
}

export function closeDialog(layer) {
  if (!layer.open && !layer.g.visible) {
    session.dialog = emptySnap();
    return;
  }
  const cb = layer.onDone;
  layer.open = false;
  layer.block = false;
  layer.speaker = '';
  layer.text = '';
  layer.shown = 0;
  layer.done = false;
  layer.lines = [];
  layer.index = 0;
  layer.autoHide = 0;
  layer.hideAt = 0;
  layer.onDone = null;
  try {
    layer.g.setVisible(false);
    layer.name.setVisible(false);
    layer.body.setVisible(false);
    if (layer.zone.scene && layer.zone.input) layer.zone.disableInteractive();
    layer.zone.setVisible(false);
    setButtonVisible(layer.skipBtn, false);
  } catch (err) { /* scene already shut down */ }
  if (session.modal) session.modal = false;
  session.dialog = emptySnap();
  if (cb) cb();
}

function finishLine(layer) {
  layer.shown = layer.text.length;
  layer.done = true;
  layer.body.setText(layer.text);
  if (layer.autoHide > 0) layer.hideAt = performance.now() + layer.autoHide * 1000;
  session.dialog = snapshot(layer);
}

function nextLine(layer) {
  layer.index += 1;
  if (layer.index >= layer.lines.length) closeDialog(layer);
  else applyLine(layer);
}

export function skipBeat(layer) {
  if (!layer.open) return;
  closeDialog(layer);
}

export function dialogTap(layer) {
  if (!layer.open) return false;
  if (!layer.done) {
    finishLine(layer);
    return true;
  }
  nextLine(layer);
  return true;
}

export function tapDialogAt(layer, x, y) {
  if (!layer.open) return false;
  const skip = layer.skipBtn;
  if (skip.visible && hitButton([skip], x, y)) return false;
  const b = layer.box;
  if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
    dialogTap(layer);
    return true;
  }
  if (layer.block) return true;
  return false;
}

export function updateDialog(layer) {
  if (!layer.open) return;
  const sc = textScale();
  if (layer.sc !== sc) {
    layer.sc = sc;
    layer.name.setFontSize(Math.round(22 * sc));
    layer.body.setFontSize(Math.round(26 * sc));
  }
  const now = performance.now();
  if (!layer.done) {
    const ms = TUNING.typeMs || 70;
    let n = Math.floor((now - layer.startedAt) / ms);
    if (n < 0) n = 0;
    if (n > layer.text.length) n = layer.text.length;
    if (n !== layer.shown) {
      layer.shown = n;
      layer.body.setText(layer.text.slice(0, n));
    }
    if (n >= layer.text.length) {
      layer.done = true;
      if (layer.autoHide > 0) layer.hideAt = now + layer.autoHide * 1000;
    }
  } else if (layer.autoHide > 0 && layer.hideAt && now >= layer.hideAt) {
    closeDialog(layer);
    return;
  }
  session.dialog = snapshot(layer);
}

export function snapshot(layer) {
  if (!layer || !layer.open) return emptySnap();
  return {
    open: true,
    speaker: layer.speaker,
    text: layer.text,
    shown: layer.shown,
    done: !!layer.done,
  };
}

export function dialogBlocking(layer) {
  return !!(layer && layer.open && layer.block);
}
