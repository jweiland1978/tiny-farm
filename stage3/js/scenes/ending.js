import { FONT, CREDITS_LINE, hiDpi } from '../config.js?v=1';
import { TEX_SCALE } from '../art.js?v=1';
import { session, logEvent } from '../session.js?v=1';
import { ENDING_BEATS } from '../data/story.js?v=1';
import {
  createDialog, showDialog, updateDialog, tapDialogAt, skipBeat, dialogTap as tapDialogLine, closeDialog,
} from '../dialog.js?v=1';
import { grantEndingRewards, enterZen } from '../story.js?v=1';
import { saveGame } from '../save.js?v=1';
import { addButton, hitButton, listVisible, setButtonVisible } from '../ui.js?v=1';
import { playTap, startEndingMusic, stopFarmMusic } from '../audio.js?v=1';
import { setBands } from '../bands.js?v=1';

export class EndingScene extends Phaser.Scene {
  constructor() {
    super('ending');
  }

  create() {
    hiDpi(this);
    session.sceneKey = 'ending';
    session.phase = 'ending';
    session.modal = false;
    this.ui = [];
    this.held = null;
    this.step = 0;
    this.t = 0;
    this.creditsOn = false;
    stopFarmMusic();
    startEndingMusic();
    logEvent({ type: 'ending' });

    this.bg = this.add.graphics().setDepth(0);
    this.paintSky(0);
    setBands('#1c2c4e', '#1c2c4e', true);

    this.moon = this.add.image(360, 220, 'moon_body').setScale(1.05).setDepth(2);
    this.moonFace = this.add.image(360, 220, 'moon_sad').setScale(1.05).setDepth(3);
    this.rocket = this.add.graphics().setDepth(6);
    this.pip = this.add.image(360, 980, 'pip').setScale(TEX_SCALE * 0.7).setDepth(7);
    this.hat = this.add.image(360, 930, 'hat_astronaut').setScale(TEX_SCALE * 0.85).setDepth(8);
    this.garden = this.add.graphics().setDepth(4).setVisible(false);

    this.dialog = createDialog(this, this.ui);
    showDialog(this.dialog, ENDING_BEATS, {
      block: true,
      onDone: () => this.showCredits(),
    });

    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
  }

  paintSky(kind) {
    const g = this.bg;
    g.clear();
    g.fillStyle(kind === 2 ? 0x8fd4f5 : 0x1c2c4e, 1);
    g.fillRect(0, 0, 720, 1280);
    if (kind !== 2) {
      g.fillStyle(0xfff6c8, 1);
      for (let i = 0; i < 28; i++) {
        g.fillCircle(30 + ((i * 97) % 660), 24 + ((i * 53) % 900), i % 4 === 0 ? 2.4 : 1.3);
      }
    } else {
      g.fillStyle(0x7ed184, 1);
      g.fillEllipse(360, 1080, 700, 280);
    }
  }

  drawRocketAt(x, y, sc) {
    const g = this.rocket;
    g.clear();
    g.fillStyle(0xfff8ea, 1);
    g.fillRoundedRect(x - 28 * sc, y - 70 * sc, 56 * sc, 110 * sc, 16 * sc);
    g.fillStyle(0xe25b4a, 1);
    g.fillTriangle(x - 28 * sc, y - 62 * sc, x, y - 110 * sc, x + 28 * sc, y - 62 * sc);
    g.fillTriangle(x - 48 * sc, y + 30 * sc, x - 24 * sc, y - 10 * sc, x - 24 * sc, y + 30 * sc);
    g.fillTriangle(x + 48 * sc, y + 30 * sc, x + 24 * sc, y - 10 * sc, x + 24 * sc, y + 30 * sc);
    g.fillStyle(0x7ec8ff, 1);
    g.fillCircle(x, y - 20 * sc, 12 * sc);
    g.fillStyle(0xf0a020, 1);
    g.fillTriangle(x - 16 * sc, y + 40 * sc, x, y + 78 * sc, x + 16 * sc, y + 40 * sc);
    g.lineStyle(5, 0x3a2a22, 1);
    g.strokeRoundedRect(x - 28 * sc, y - 70 * sc, 56 * sc, 110 * sc, 16 * sc);
  }

  showCredits() {
    if (this.creditsOn) return;
    this.creditsOn = true;
    logEvent({ type: 'credits' });
    session.ended = true;
    grantEndingRewards();
    enterZen();
    saveGame('ending');
    this.paintSky(2);
    this.moonFace.setTexture('moon_wow');
    this.garden.setVisible(true);
    const gg = this.garden;
    gg.clear();
    gg.fillStyle(0x7ed184, 1);
    gg.fillEllipse(360, 260, 180, 40);
    gg.fillStyle(0xf06070, 1);
    gg.fillCircle(330, 248, 8);
    gg.fillStyle(0xf0c020, 1);
    gg.fillCircle(360, 244, 8);
    gg.fillStyle(0x6fbf45, 1);
    gg.fillCircle(390, 250, 8);
    this.add.text(360, 620, CREDITS_LINE + '\n\nThanks for playing!', {
      fontFamily: FONT, fontSize: '28px', color: '#3A2A22', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 560 },
    }).setOrigin(0.5).setDepth(20);
    this.doneBtn = addButton(this, this.ui, {
      x: 150, y: 980, w: 420, h: 120, label: 'ZEN MODE', fontSize: 36, depth: 21,
      fill: 0xffe08a, lip: 0xe7a23a,
      onTap: () => this.toZen(),
    });
    setButtonVisible(this.dialog.skipBtn, false);
  }

  toZen() {
    playTap();
    stopFarmMusic();
    session.phase = 'farm';
    session.keepPlots = true;
    session.announceSeason = false;
    this.scene.start('farm');
  }

  onDown(pointer) {
    if (pointer.button != null && pointer.button !== 0) return;
    this.held = hitButton(this.ui, pointer.worldX, pointer.worldY);
    if (!this.held && this.dialog.open) tapDialogAt(this.dialog, pointer.worldX, pointer.worldY);
  }

  onUp(pointer) {
    if (!this.held) return;
    const tap = this.held;
    this.held = null;
    if (hitButton([tap], pointer.worldX, pointer.worldY) && tap.onTap) tap.onTap();
  }

  onKey(event) {
    if (event.repeat) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (this.creditsOn) this.toZen();
      else skipBeat(this.dialog);
    }
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    this.t += dt;
    updateDialog(this.dialog);
    const bob = Math.sin(this.t * 1.4) * 8;
    const lift = this.creditsOn ? 0 : Math.min(520, this.t * 42);
    const wob = Math.sin(this.t * 6) * (this.creditsOn ? 0 : 10);
    this.drawRocketAt(360 + wob, 860 - lift, 1.15);
    this.pip.setY(980 - lift * 0.15);
    this.hat.setY(this.pip.y - 48);
    this.moon.setY(220 + bob);
    this.moonFace.setY(220 + bob);
    if (!this.creditsOn && this.t > 8) this.moonFace.setTexture('moon_wow');
  }

  skipDialog() {
    if (this.creditsOn) this.toZen();
    else skipBeat(this.dialog);
  }

  dialogTap() {
    if (this.dialog.open) tapDialogLine(this.dialog);
  }

  onShutdown() {
    stopFarmMusic();
    closeDialog(this.dialog);
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  listButtons() {
    return listVisible(this.ui);
  }
}
