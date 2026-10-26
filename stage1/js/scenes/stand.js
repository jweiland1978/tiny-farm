import { FONT, SEASON_LABEL, hiDpi } from '../config.js?v=1';
import { drawStandBackdrop, TEX_SCALE } from '../art.js?v=1';
import { SHOP, tryBuy } from '../data/shop.js?v=1';
import { drawPlate, hitButton, listVisible } from '../ui.js?v=1';
import { playTap } from '../audio.js?v=1';
import { resetSeason, session } from '../session.js?v=1';

const GENTLE = '#8A7568';

export class StandScene extends Phaser.Scene {
  constructor() {
    super('stand');
  }

  create() {
    hiDpi(this);
    session.paused = false;
    session.particles = 0;
    const bg = this.add.graphics().setDepth(0);
    drawStandBackdrop(bg);
    this.add.image(600, 150, 'moon_body').setScale(0.34).setDepth(1);
    this.add.image(600, 150, 'moon_face').setScale(0.34).setDepth(2);
    this.add.image(90, 1190, 'pip').setScale(TEX_SCALE * 0.8).setDepth(2);

    this.add.text(360, 48, 'Farm Stand', {
      fontFamily: FONT, fontSize: '52px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
    this.add.text(360, 96, SEASON_LABEL, {
      fontFamily: FONT, fontSize: '24px', color: '#6A5346', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    const sum = session.summary || {
      harvested: session.harvested,
      bestChain: session.bestChain,
      bumpers: session.bumpers,
      megas: session.megas,
      earned: session.earned,
      profit: session.earned - (session.spent || 0),
    };
    const tally = this.add.graphics().setDepth(3);
    tally.fillStyle(0xfff8ea, 1);
    tally.fillRoundedRect(36, 124, 648, 230, 28);
    tally.lineStyle(7, 0x3a2a22, 1);
    tally.strokeRoundedRect(40, 128, 640, 222, 24);
    const stats = [
      ['Harvested', String(sum.harvested)],
      ['Best chain', String(sum.bestChain)],
      ['Bumpers', String(sum.bumpers)],
      ['Profit', String(sum.profit != null ? sum.profit : sum.earned)],
    ];
    for (let i = 0; i < stats.length; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      const x = 180 + col * 320;
      const y = 170 + row * 100;
      this.add.text(x, y, stats[i][0], {
        fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
      this.add.text(x, y + 40, stats[i][1], {
        fontFamily: FONT, fontSize: '40px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
    }
    if (sum.megas) {
      this.add.text(520, 318, sum.megas + ' mega', {
        fontFamily: FONT, fontSize: '18px', color: '#6A5346', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
    }

    this.cards = [];
    this.uiButtons = [];
    for (let i = 0; i < SHOP.length; i++) {
      this.cards.push(this.makeCard(SHOP[i], 30, 372 + i * 176));
    }

    this.note = this.add.text(360, 900, '', {
      fontFamily: FONT, fontSize: '26px', color: GENTLE, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);

    this.nextBtn = this.makeSimple(40, 940, 640, 112, 'NEXT SEASON', 36, 0xb6e89a, 0x6ab86a, () => {
      resetSeason();
      this.scene.start('farm');
    });
    this.titleBtn = this.makeSimple(160, 1072, 400, 110, 'TITLE', 36, 0xfff4d2, 0xe7b56a, () => {
      this.scene.start('title');
    });

    this.refresh();
    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
    this.held = null;
  }

  makeCard(item, x, y) {
    const w = 660;
    const h = 164;
    const g = this.add.graphics().setDepth(5);
    const name = this.add.text(x + 28, y + 28, item.name, {
      fontFamily: FONT, fontSize: '32px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0, 0).setDepth(6);
    const desc = this.add.text(x + 28, y + 72, item.desc, {
      fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold',
      wordWrap: { width: 400 },
    }).setOrigin(0, 0).setDepth(6);
    const price = this.add.text(x + w - 28, y + 46, String(item.cost), {
      fontFamily: FONT, fontSize: '48px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(6);
    const status = this.add.text(x + w - 28, y + 108, '', {
      fontFamily: FONT, fontSize: '22px', color: GENTLE, fontStyle: 'bold',
    }).setOrigin(1, 0).setDepth(6);
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setDepth(7).setInteractive();
    const rec = {
      x, y, w, h, label: item.name, visible: true, item, g, name, desc, price, status, zone,
      onTap: () => this.onBuy(item.id),
    };
    this.uiButtons.push(rec);
    return rec;
  }

  makeSimple(x, y, w, h, label, fontSize, fill, lip, onTap) {
    const g = this.add.graphics().setDepth(8);
    drawPlate(g, x, y, w, h, fill, lip, false);
    const text = this.add.text(x + w / 2, y + h / 2 - 4, label, {
      fontFamily: FONT, fontSize: fontSize + 'px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(9);
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setDepth(10).setInteractive();
    const rec = { x, y, w, h, label, visible: true, g, text, zone, onTap };
    this.uiButtons.push(rec);
    return rec;
  }

  onBuy(id) {
    const ok = tryBuy(id);
    if (!ok) {
      playTap();
      const item = SHOP.find((s) => s.id === id);
      if (item && session.upgrades[id]) this.note.setText('Got it!');
      else this.note.setText("Can't afford it yet");
    } else {
      this.note.setText('');
    }
    this.refresh();
    const farm = this.game.scene.getScene('farm');
    if (farm && farm.sys && farm.sys.isActive() && farm.layoutField) farm.layoutField(true);
  }

  refresh() {
    for (let i = 0; i < this.cards.length; i++) {
      const rec = this.cards[i];
      const item = rec.item;
      const owned = !!session.upgrades[item.id];
      const afford = session.coins >= item.cost;
      rec.g.clear();
      const fill = owned ? 0xe3f6d8 : afford ? 0xfff8ea : 0xe6e1da;
      const lip = owned ? 0x8bcf86 : afford ? 0xe7b56a : 0xcfc6bb;
      drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, fill, lip, false);
      rec.name.setColor(owned || afford ? '#3A2A22' : '#8A7568');
      rec.desc.setColor(owned || afford ? '#6A5346' : '#8A7568');
      if (owned) {
        rec.price.setText('Got it!');
        rec.price.setColor('#3E7A48');
        rec.status.setText('');
      } else {
        rec.price.setText(String(item.cost));
        rec.price.setColor(afford ? '#3A2A22' : '#8A7568');
        rec.status.setText(afford ? '' : "Can't afford it yet");
      }
    }
  }

  onDown(pointer) {
    if (pointer.button != null && pointer.button !== 0) return;
    this.held = hitButton(this.uiButtons, pointer.worldX, pointer.worldY);
  }

  onUp(pointer) {
    if (!this.held) return;
    const tap = this.held;
    this.held = null;
    const b = hitButton([tap], pointer.worldX, pointer.worldY);
    if (!b || !tap.onTap) return;
    if (tap === this.nextBtn || tap === this.titleBtn) playTap();
    tap.onTap();
  }

  onKey(event) {
    if (event.repeat) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      playTap();
      resetSeason();
      this.scene.start('farm');
    }
  }

  onShutdown() {
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  listButtons() {
    return listVisible(this.uiButtons);
  }
}
