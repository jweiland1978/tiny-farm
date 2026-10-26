import { FONT, CREDITS_LINE, hiDpi } from '../config.js?v=1';
import { drawTitleBackdrop, TEX_SCALE } from '../art.js?v=1';
import { addButton, setButtonVisible, hitButton, listVisible } from '../ui.js?v=1';
import { playTap } from '../audio.js?v=1';
import { resetSeason, session } from '../session.js?v=1';

export class TitleScene extends Phaser.Scene {
  constructor() {
    super('title');
  }

  create() {
    hiDpi(this);
    session.plots = [];
    session.paused = false;
    session.particles = 0;
    const bg = this.add.graphics().setDepth(0);
    drawTitleBackdrop(bg);

    this.moon = this.add.image(360, 250, 'moon_body').setScale(0.72).setDepth(2);
    this.moonFace = this.add.image(360, 250, 'moon_face').setScale(0.72).setDepth(3);
    this.faceT = 0;
    this.blink = 0;
    this.blinkIn = 2.2;

    const plaque = this.add.graphics().setDepth(4);
    plaque.fillStyle(0xfff8ea, 1);
    plaque.fillRoundedRect(70, 430, 580, 210, 36);
    plaque.lineStyle(8, 0x3a2a22, 1);
    plaque.strokeRoundedRect(76, 436, 568, 198, 32);
    this.add.text(360, 490, 'Tiny Farm,', {
      fontFamily: FONT, fontSize: '52px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.add.text(360, 560, 'Big Moon', {
      fontFamily: FONT, fontSize: '68px', color: '#E25B4A', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);
    this.add.text(360, 612, 'Button Hill Farm', {
      fontFamily: FONT, fontSize: '26px', color: '#6A5346', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(5);

    this.pip = this.add.image(360, 785, 'pip').setScale(TEX_SCALE).setDepth(6);
    this.pipBase = 785;

    this.uiButtons = [];
    this.playBtn = addButton(this, this.uiButtons, {
      x: 150, y: 980, w: 420, h: 120, label: 'PLAY', fontSize: 48, depth: 8,
      fill: 0xffe08a, lip: 0xe7a23a,
      onTap: () => this.play(),
    });
    this.creditsBtn = addButton(this, this.uiButtons, {
      x: 150, y: 1120, w: 420, h: 110, label: 'CREDITS', fontSize: 36, depth: 8,
      onTap: () => this.showCredits(true),
    });

    this.creditsLayer = [];
    const dim = this.add.graphics().setDepth(20).setVisible(false);
    dim.fillStyle(0x3a2a22, 0.45);
    dim.fillRect(0, 0, 720, 1280);
    const panel = this.add.graphics().setDepth(21).setVisible(false);
    panel.fillStyle(0xfff8ea, 1);
    panel.fillRoundedRect(48, 250, 624, 520, 36);
    panel.lineStyle(8, 0x3a2a22, 1);
    panel.strokeRoundedRect(54, 256, 612, 508, 32);
    const body = this.add.text(80, 290, 'Button Hill Farm\n\nA tiny farm on a hill at the edge of a sleepy valley, with a creek, a red barn, and a farm stand under a very big sky.\n\n' + CREDITS_LINE, {
      fontFamily: FONT,
      fontSize: '30px',
      color: '#3A2A22',
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 560 },
    }).setOrigin(0, 0).setDepth(22).setVisible(false);
    this.creditsLayer.push(dim, panel, body);
    this.creditsOpen = false;
    this.backBtn = addButton(this, this.uiButtons, {
      x: 150, y: 820, w: 420, h: 120, label: 'BACK', fontSize: 40, depth: 23,
      onTap: () => this.showCredits(false),
    });
    setButtonVisible(this.backBtn, false);

    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
    this.held = null;
  }

  showCredits(open) {
    this.creditsOpen = open;
    for (let i = 0; i < this.creditsLayer.length; i++) this.creditsLayer[i].setVisible(open);
    setButtonVisible(this.backBtn, open);
    setButtonVisible(this.playBtn, !open);
    setButtonVisible(this.creditsBtn, !open);
  }

  play() {
    resetSeason();
    this.scene.start('farm');
  }

  onDown(pointer) {
    if (pointer.button != null && pointer.button !== 0) return;
    const x = pointer.worldX;
    const y = pointer.worldY;
    const list = this.creditsOpen ? [this.backBtn] : [this.playBtn, this.creditsBtn];
    const b = hitButton(list, x, y);
    this.held = b || null;
  }

  onUp(pointer) {
    if (!this.held) return;
    const x = pointer.worldX;
    const y = pointer.worldY;
    const b = hitButton([this.held], x, y);
    const tap = this.held;
    this.held = null;
    if (b && tap.onTap) {
      playTap();
      tap.onTap();
    }
  }

  onKey(event) {
    if (event.repeat) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      if (this.creditsOpen) this.showCredits(false);
      else this.play();
    }
  }

  onShutdown() {
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    const bob = Math.sin(time / 700) * 10;
    this.moon.setY(250 + bob);
    this.moonFace.setY(250 + bob);
    this.pip.setY(this.pipBase + Math.sin(time / 420) * 6);
    this.blinkIn -= dt;
    if (this.blink > 0) {
      this.blink -= dt;
      if (this.blink <= 0) this.moonFace.setTexture('moon_face');
    } else if (this.blinkIn <= 0) {
      this.blink = 0.14;
      this.blinkIn = 2.6 + (time % 1000) / 1000;
      this.moonFace.setTexture('moon_blink');
    }
    session.pip.x = this.pip.x;
    session.pip.y = this.pip.y;
  }

  listButtons() {
    const list = this.creditsOpen ? [this.backBtn] : [this.playBtn, this.creditsBtn];
    return listVisible(list);
  }
}
