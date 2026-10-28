import { FONT, LOOK, hiDpi } from '../config.js?v=1';
import { session, setSetting, settingsSnapshot, logEvent, resetRun, textScale } from '../session.js?v=1';
import { addButton, setButtonVisible, hitButton, listVisible, redrawPlate } from '../ui.js?v=1';
import { playTap, applyVolumes } from '../audio.js?v=1';
import { clearSave } from '../save.js?v=1';
import { setBands } from '../bands.js?v=1';

const ROWS = [
  ['tapHarvest', 'Tap Harvest'],
  ['bigText', 'Big Text'],
  ['reduceMotion', 'Reduce Motion'],
  ['noFlash', 'No Flashing'],
  ['cbPalette', 'Color-blind palette'],
  ['timer', 'Season Timer'],
];

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings');
  }

  init(data) {
    this.from = (data && data.from) || 'title';
  }

  create() {
    hiDpi(this);
    session.modal = true;
    this.step = 0;
    this.drag = '';
    this.held = null;
    this.ui = [];
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x8fd4f5, 1);
    bg.fillRect(0, 0, 720, 1280);
    bg.fillStyle(0xfff8ea, 1);
    bg.fillRoundedRect(16, 16, 688, 1248, 28);
    setBands(LOOK.spring.sky, LOOK.spring.tray, false);

    this.add.text(360, 48, 'Settings', {
      fontFamily: FONT, fontSize: '40px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(4);

    this.musicBtn = this.row(24, 80, 672, 110, 'MUSIC', () => {});
    this.soundBtn = this.row(24, 198, 672, 110, 'SOUND', () => {});
    this.musicBtn.kind = 'music';
    this.soundBtn.kind = 'sound';

    this.toggles = {};
    let y = 320;
    for (let i = 0; i < ROWS.length; i++) {
      const key = ROWS[i][0];
      const rec = this.row(20, y, 680, 96, ROWS[i][1], () => this.flip(key));
      rec.key = key;
      this.toggles[key] = rec;
      y += 104;
    }
    this.resetBtn = this.row(20, y, 680, 96, 'RESET PROGRESS', () => this.ask(1));
    this.backBtn = this.row(150, 1120, 420, 112, 'BACK', () => this.close());

    this.dim = this.add.graphics().setDepth(20).setVisible(false);
    this.dim.fillStyle(0x3a2a22, 0.55);
    this.dim.fillRect(0, 0, 720, 1280);
    this.askText = this.add.text(360, 460, 'Are you sure?', {
      fontFamily: FONT, fontSize: '40px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
      align: 'center', wordWrap: { width: 600 },
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    this.yesBtn = this.row(40, 600, 300, 120, 'YES', () => this.yes());
    this.noBtn = this.row(380, 600, 300, 120, 'NO', () => this.ask(0));
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);

    this.refresh();
    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointermove', this.onMove, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
  }

  row(x, y, w, h, label, onTap) {
    const rec = addButton(this, this.ui, {
      x, y, w, h, label, fontSize: 26, depth: 6, onTap,
    });
    rec.thumb = this.add.graphics().setDepth(8);
    return rec;
  }

  snap() {
    return settingsSnapshot();
  }

  write(key, value) {
    setSetting(key, value);
    applyVolumes();
    this.refresh();
  }

  flip(key) {
    const s = this.snap();
    this.write(key, !s[key]);
  }

  setSlider(key, x, commit) {
    const btn = key === 'music' ? this.musicBtn : this.soundBtn;
    const span = btn.w - 48;
    let t = (x - (btn.x + 24)) / span;
    if (t < 0) t = 0;
    if (t > 1) t = 1;
    const n = Math.round(t * 100);
    if (!session.settings) return;
    session.settings[key] = n;
    applyVolumes();
    if (commit) this.write(key, n);
    else this.refresh();
  }

  ask(step) {
    this.step = step;
    this.refresh();
  }

  yes() {
    if (this.step < 2) {
      this.ask(2);
      return;
    }
    clearSave();
    resetRun();
    session.wipeSave = false;
    session.dirty = false;
    session.modal = false;
    logEvent({ type: 'reset' });
    const mgr = this.scene;
    const stop = ['farm', 'stand', 'album', 'ending'];
    for (let i = 0; i < stop.length; i++) {
      const key = stop[i];
      if (mgr.isActive(key) || mgr.isPaused(key) || mgr.isSleeping(key)) mgr.stop(key);
    }
    session.sceneKey = 'title';
    mgr.start('title');
  }

  refresh() {
    const s = this.snap();
    const sc = textScale();
    const on = this.step === 0;
    const paint = (rec, label) => {
      rec.label = label;
      rec.text.setText(label);
      rec.text.setFontSize(Math.round(26 * sc));
      redrawPlate(rec, { label, selected: false });
    };
    paint(this.musicBtn, 'MUSIC  ' + s.music);
    paint(this.soundBtn, 'SOUND  ' + s.sound);
    this.paintThumb(this.musicBtn, s.music, on);
    this.paintThumb(this.soundBtn, s.sound, on);
    for (let i = 0; i < ROWS.length; i++) {
      const key = ROWS[i][0];
      const rec = this.toggles[key];
      paint(rec, ROWS[i][1] + ': ' + (s[key] ? 'ON' : 'OFF'));
      rec.thumb.clear();
      setButtonVisible(rec, on);
    }
    paint(this.resetBtn, 'RESET PROGRESS');
    paint(this.backBtn, 'BACK');
    setButtonVisible(this.musicBtn, on);
    setButtonVisible(this.soundBtn, on);
    setButtonVisible(this.resetBtn, on);
    setButtonVisible(this.backBtn, on);
    const sure = this.step === 2 ? 'Really erase everything?' : 'Are you sure?';
    this.askText.setText(sure);
    this.askText.setVisible(this.step > 0);
    this.dim.setVisible(this.step > 0);
    setButtonVisible(this.yesBtn, this.step > 0);
    setButtonVisible(this.noBtn, this.step > 0);
    paint(this.yesBtn, 'YES');
    paint(this.noBtn, 'NO');
  }

  paintThumb(btn, value, on) {
    const g = btn.thumb;
    g.clear();
    if (!on) return;
    const t = Math.max(0, Math.min(100, value)) / 100;
    const x = btn.x + 24 + t * (btn.w - 48);
    const y = btn.y + btn.h / 2;
    g.fillStyle(0xffe08a, 1);
    g.fillCircle(x, y, 36);
    g.lineStyle(6, 0x3a2a22, 1);
    g.strokeCircle(x, y, 36);
  }

  close() {
    const from = this.from || 'title';
    session.modal = false;
    this.scene.stop();
    if (from && this.scene.isPaused(from)) this.scene.resume(from);
  }

  onDown(pointer) {
    if (pointer.button > 0) return;
    const x = pointer.worldX;
    const y = pointer.worldY;
    if (this.step > 0) {
      this.held = hitButton([this.yesBtn, this.noBtn], x, y);
      return;
    }
    const hit = hitButton(this.ui, x, y);
    if (hit === this.musicBtn || hit === this.soundBtn) {
      this.drag = hit.kind;
      this.dragX = x;
      this.setSlider(hit.kind, x, false);
      this.held = null;
      return;
    }
    this.held = hit;
  }

  onMove(pointer) {
    if (!this.drag || this.step > 0) return;
    this.dragX = pointer.worldX;
    this.setSlider(this.drag, this.dragX, false);
  }

  onUp(pointer) {
    if (this.drag) {
      const key = this.drag;
      const x = pointer.worldX != null ? pointer.worldX : this.dragX;
      this.drag = '';
      this.setSlider(key, x, true);
      return;
    }
    if (!this.held) return;
    const tap = this.held;
    this.held = null;
    if (hitButton([tap], pointer.worldX, pointer.worldY) && tap.onTap) {
      playTap();
      tap.onTap();
    }
  }

  onKey(event) {
    if (event.repeat || !this.scene.isActive()) return;
    const k = event.key;
    if (k === 'Enter' || k === 'Escape' || k === 'p' || k === 'P') {
      event.preventDefault();
      if (this.step > 0) this.ask(0);
      else this.close();
    }
  }

  onShutdown() {
    session.modal = false;
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  listButtons() {
    if (this.step > 0) return listVisible([this.yesBtn, this.noBtn]);
    return listVisible(this.ui);
  }
}
