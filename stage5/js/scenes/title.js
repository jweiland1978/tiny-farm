import { FONT, CREDITS_LINE, LOOK, hiDpi } from '../config.js?v=1';
import { drawTitleBackdrop, TEX_SCALE } from '../art.js?v=1';
import { addButton, setButtonVisible, hitButton, listVisible } from '../ui.js?v=1';
import { playTap } from '../audio.js?v=1';
import { session, resetRun } from '../session.js?v=1';
import { hasSave, loadGame, peekAch } from '../save.js?v=1';
import { setBands } from '../bands.js?v=1';
import { isCodeOpen } from '../codepanel.js?v=1';
import { unlockZen } from '../story.js?v=1';

function peekZen() {
  if (unlockZen()) return true;
  try {
    const raw = localStorage.getItem('tfbm_v1_save');
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return false;
    if (data.ended || data.zen) return true;
    if ((data.year | 0) >= 2) return true;
  } catch (err) { /* ignore */ }
  return false;
}

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    hiDpi(this);
    session.sceneKey = 'title';
    session.phase = 'title';
    session.paused = false;
    session.modal = false;
    session.particles = 0;
    const saved = hasSave();
    const zenOpen = peekZen();
    const bg = this.add.graphics().setDepth(0);
    drawTitleBackdrop(bg);
    setBands(LOOK.spring.sky, LOOK.spring.tray, false);

    this.moon = this.add.image(360, 230, 'moon_body').setScale(0.62).setDepth(2);
    this.moonFace = this.add.image(360, 230, 'moon_face').setScale(0.62).setDepth(3);
    this.blink = 0;
    this.blinkIn = 2.2;

    const plaque = this.add.graphics().setDepth(4);
    plaque.fillStyle(0xfff8ea, 1);
    plaque.fillRoundedRect(70, 380, 580, 180, 36);
    plaque.lineStyle(8, 0x3a2a22, 1);
    plaque.strokeRoundedRect(76, 386, 568, 168, 32);
    this.add.text(360, 430, 'Tiny Farm,', {
      fontFamily: FONT, fontSize: '44px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.add.text(360, 488, 'Big Moon', {
      fontFamily: FONT, fontSize: '56px', color: '#E25B4A', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.add.text(360, 536, 'Button Hill Farm', {
      fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    this.pip = this.add.image(360, 630, 'pip').setScale(TEX_SCALE * 0.7).setDepth(6);
    this.hatImg = this.add.image(360, 582, 'hat_straw').setScale(TEX_SCALE * 0.5).setDepth(7).setVisible(false);
    this.pipBase = 630;
    if (session.hat) {
      this.hatImg.setTexture('hat_' + session.hat);
      this.hatImg.setVisible(true);
    }

    this.ui = [];
    this.main = [];
    const add = (x, y, w, h, label, fontSize, fill, onTap) => {
      return addButton(this, this.ui, {
        x, y, w, h, label, fontSize, depth: 8, fill: fill || 0xfff4d2, lip: 0xe7b56a, onTap,
      });
    };

    let y = 700;
    if (saved) {
      this.continueBtn = add(150, y, 420, 96, 'CONTINUE', 32, 0xffe08a, () => this.continueGame());
      this.main.push(this.continueBtn);
      y += 104;
    } else this.continueBtn = null;

    if (zenOpen) {
      this.storyBtn = add(150, y, 200, 96, 'STORY', 28, saved ? 0xfff4d2 : 0xffe08a, () => this.askNewOrPlay(false));
      this.zenBtn = add(370, y, 200, 96, 'ZEN', 28, 0xfff4d2, () => this.playZen());
      this.main.push(this.storyBtn, this.zenBtn);
      this.playBtn = null;
      this.newBtn = null;
      y += 104;
    } else if (saved) {
      this.newBtn = add(150, y, 420, 96, 'NEW GAME', 28, 0xfff4d2, () => this.askNew());
      this.main.push(this.newBtn);
      this.playBtn = null;
      this.storyBtn = null;
      this.zenBtn = null;
      y += 104;
    } else {
      this.playBtn = add(150, y, 420, 110, 'PLAY', 44, 0xffe08a, () => this.play(false));
      this.main.push(this.playBtn);
      this.newBtn = null;
      this.storyBtn = null;
      this.zenBtn = null;
      y += 118;
    }

    this.albumBtn = add(150, y, 420, 96, 'ALBUM', 28, 0xfff4d2, () => this.openAlbum());
    this.main.push(this.albumBtn);
    y += 104;
    this.creditsBtn = add(150, y, 420, 96, 'CREDITS', 28, 0xfff4d2, () => this.showCredits(true));
    this.main.push(this.creditsBtn);
    y += 104;
    this.settingsBtn = add(150, y, 420, 96, 'SETTINGS', 28, 0xfff4d2, () => this.openSettings());
    this.main.push(this.settingsBtn);

    this.creditsLayer = [];
    const dim = this.add.graphics().setDepth(20).setVisible(false);
    dim.fillStyle(0x3a2a22, 0.45);
    dim.fillRect(0, 0, 720, 1280);
    const panel = this.add.graphics().setDepth(21).setVisible(false);
    panel.fillStyle(0xfff8ea, 1);
    panel.fillRoundedRect(48, 220, 624, 560, 36);
    panel.lineStyle(8, 0x3a2a22, 1);
    panel.strokeRoundedRect(54, 226, 612, 548, 32);
    const body = this.add.text(80, 260, 'Button Hill Farm\n\nA tiny farm on a hill at the edge of a sleepy valley, with a creek, a red barn, and a farm stand under a very big sky.\n\n' + CREDITS_LINE, {
      fontFamily: FONT, fontSize: '28px', color: '#3A2A22', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0, 0).setDepth(22).setVisible(false);
    this.creditsLayer.push(dim, panel, body);
    this.creditsOpen = false;
    this.confirming = false;
    this.backBtn = add(150, 820, 420, 120, 'BACK', 40, 0xffe08a, () => this.showCredits(false));
    setButtonVisible(this.backBtn, false);
    this.sureText = this.add.text(360, 460, 'Start over?', {
      fontFamily: FONT, fontSize: '48px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22).setVisible(false);
    this.yesBtn = add(70, 560, 270, 120, 'YES', 40, 0xffe08a, () => this.play(false));
    this.noBtn = add(380, 560, 270, 120, 'NO', 40, 0xfff4d2, () => this.askNew(false));
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);

    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
    this.held = null;
  }

  showCredits(open) {
    this.creditsOpen = open;
    this.confirming = false;
    for (let i = 0; i < this.creditsLayer.length; i++) this.creditsLayer[i].setVisible(open);
    setButtonVisible(this.backBtn, open);
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);
    this.sureText.setVisible(false);
    for (let i = 0; i < this.main.length; i++) setButtonVisible(this.main[i], !open);
  }

  askNew(open) {
    const on = open !== false;
    this.confirming = on;
    this.creditsOpen = false;
    for (let i = 0; i < this.creditsLayer.length; i++) this.creditsLayer[i].setVisible(on);
    this.sureText.setVisible(on);
    setButtonVisible(this.backBtn, false);
    setButtonVisible(this.yesBtn, on);
    setButtonVisible(this.noBtn, on);
    for (let i = 0; i < this.main.length; i++) setButtonVisible(this.main[i], !on);
  }

  askNewOrPlay(zen) {
    if (hasSave()) this.askNew();
    else this.play(zen);
  }

  play(zen) {
    session.startZen = !!zen;
    resetRun();
    session.zen = !!zen;
    session.noTimer = !!zen;
    this.scene.start('farm');
  }

  playZen() {
    if (hasSave()) {
      if (!loadGame(true)) {
        this.play(true);
        return;
      }
      session.wipeSave = false;
      session.zen = true;
      session.noTimer = true;
      session.announceSeason = false;
      if (session.phase === 'stand') this.scene.start('stand');
      else this.scene.start('farm');
      return;
    }
    this.play(true);
  }

  continueGame() {
    if (!loadGame(true)) {
      this.play(false);
      return;
    }
    session.wipeSave = false;
    session.announceSeason = false;
    if (session.ended) {
      session.zen = true;
      session.noTimer = true;
    }
    if (session.phase === 'stand') this.scene.start('stand');
    else this.scene.start('farm');
  }

  openAlbum() {
    peekAch();
    this.scene.pause();
    this.scene.launch('album', { from: 'title' });
  }

  openSettings() {
    this.scene.pause();
    this.scene.launch('settings', { from: 'title' });
  }

  onDown(pointer) {
    if (pointer.button > 0) return;
    if (this.scene.isActive('album') || this.scene.isActive('settings') || isCodeOpen()) return;
    const list = this.creditsOpen ? [this.backBtn] : this.confirming ? [this.yesBtn, this.noBtn] : this.main;
    this.held = hitButton(list, pointer.worldX, pointer.worldY);
  }

  onUp(pointer) {
    if (!this.held) return;
    const tap = this.held;
    this.held = null;
    if (hitButton([tap], pointer.worldX, pointer.worldY) && tap.onTap) {
      playTap();
      tap.onTap();
    }
  }

  onKey(event) {
    if (event.repeat) return;
    if (!this.scene.isActive() || this.scene.isActive('album') || this.scene.isActive('settings') || isCodeOpen()) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.confirming) { this.askNew(false); return; }
      if (this.creditsOpen) { this.showCredits(false); return; }
      if (this.continueBtn) this.continueGame();
      else this.play(false);
    }
  }

  onShutdown() {
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const bob = Math.sin(time / 700) * 8;
    this.moon.setY(230 + bob);
    this.moonFace.setY(230 + bob);
    this.pip.setY(this.pipBase + Math.sin(time / 420) * 5);
    if (this.hatImg.visible) this.hatImg.setY(this.pip.y - 48);
    this.blinkIn -= dt;
    if (this.blink > 0) {
      this.blink -= dt;
      if (this.blink <= 0) this.moonFace.setTexture('moon_face');
    } else if (this.blinkIn <= 0) {
      this.blink = 0.14;
      this.blinkIn = 2.6;
      this.moonFace.setTexture('moon_blink');
    }
    session.pip.x = this.pip.x;
    session.pip.y = this.pip.y;
  }

  listButtons() {
    if (this.confirming) return listVisible([this.yesBtn, this.noBtn]);
    if (this.creditsOpen) return listVisible([this.backBtn]);
    return listVisible(this.main);
  }
}
