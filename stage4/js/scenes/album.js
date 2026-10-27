import { FONT, LOOK, hiDpi } from '../config.js?v=1';
import { drawAlbumBackdrop, TEX_SCALE } from '../art.js?v=1';
import { addButton, setButtonVisible, hitButton, listVisible, drawPlate } from '../ui.js?v=1';
import { playTap } from '../audio.js?v=1';
import { session } from '../session.js?v=1';
import { CROPS } from '../data/crops.js?v=1';
import { ANIMALS } from '../data/animals.js?v=1';
import { MOON_GIFTS, HATS, ensureAlbum } from '../album.js?v=1';
import { ACHIEVEMENTS } from '../data/achievements.js?v=1';
import { setBands } from '../bands.js?v=1';

const PAGE = 6;

export class AlbumScene extends Phaser.Scene {
  constructor() {
    super('album');
  }

  init(data) {
    this.from = (data && data.from) || 'title';
  }

  create() {
    hiDpi(this);
    if (this.from !== 'title') session.sceneKey = 'album';
    session.modal = true;
    ensureAlbum();
    const bg = this.add.graphics().setDepth(0);
    drawAlbumBackdrop(bg);
    const look = LOOK.spring || LOOK.spring;
    setBands(look.sky, look.tray, false);

    this.tab = 'crops';
    this.page = 0;
    this.ui = [];
    this.held = null;

    const tabs = [
      ['crops', 'CROPS'],
      ['animals', 'ANIMALS'],
      ['gifts', 'MOON GIFTS'],
      ['hats', 'HATS'],
      ['ach', 'ACHIEVEMENTS'],
    ];
    this.tabBtns = {};
    const tw = 136;
    for (let i = 0; i < tabs.length; i++) {
      const id = tabs[i][0];
      const rec = addButton(this, this.ui, {
        x: 8 + i * (tw + 8), y: 20, w: tw, h: 96,
        label: tabs[i][1], fontSize: 15, depth: 6,
        onTap: () => this.setTab(id),
      });
      this.tabBtns[id] = rec;
    }

    this.cards = [];
    for (let i = 0; i < PAGE; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      const x = 20 + col * 350;
      const y = 140 + row * 186;
      const g = this.add.graphics().setDepth(4);
      const icon = this.add.image(x + 70, y + 86, 'crop_radish_1').setDepth(5).setVisible(false);
      const name = this.add.text(x + 130, y + 48, '', {
        fontFamily: FONT, fontSize: '26px', color: '#3A2A22', fontStyle: 'bold',
        wordWrap: { width: 190 },
      }).setOrigin(0, 0).setDepth(5);
      const note = this.add.text(x + 130, y + 100, '', {
        fontFamily: FONT, fontSize: '18px', color: '#6A5346', fontStyle: 'bold',
        wordWrap: { width: 190 },
      }).setOrigin(0, 0).setDepth(5);
      const stamp = this.add.text(x + 300, y + 28, 'GOLD', {
        fontFamily: FONT, fontSize: '16px', color: '#8A5A10', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(6).setVisible(false);
      this.cards.push({ g, icon, name, note, stamp, x, y, w: 336, h: 172 });
    }

    this.prevBtn = addButton(this, this.ui, {
      x: 20, y: 710, w: 330, h: 100, label: 'PREV', fontSize: 32, depth: 6,
      onTap: () => this.step(-1),
    });
    this.nextBtn = addButton(this, this.ui, {
      x: 370, y: 710, w: 330, h: 100, label: 'NEXT', fontSize: 32, depth: 6,
      onTap: () => this.step(1),
    });
    this.pageText = this.add.text(360, 830, '', {
      fontFamily: FONT, fontSize: '22px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);
    this.backBtn = addButton(this, this.ui, {
      x: 150, y: 1000, w: 420, h: 120, label: 'BACK', fontSize: 40, depth: 6,
      fill: 0xffe08a, lip: 0xe7a23a,
      onTap: () => this.close(),
    });

    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', () => {
      if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
    });
    this.refresh();
  }

  setTab(id) {
    this.tab = id;
    this.page = 0;
    this.refresh();
  }

  entries() {
    ensureAlbum();
    if (this.tab === 'crops') {
      return CROPS.map((c) => {
        const row = session.album.crops[c.id];
        const found = !!(row && row.found);
        return {
          found,
          golden: !!(row && row.golden),
          name: found ? c.name : '???',
          note: found ? c.note : '',
          key: found ? 'crop_' + c.id + '_ripe' : '',
          scale: 0.4,
        };
      });
    }
    if (this.tab === 'animals') {
      return ANIMALS.map((a) => {
        const found = !!session.album.animals[a.id];
        return {
          found,
          golden: false,
          name: found ? a.name : '???',
          note: found ? a.note : '',
          key: found ? 'an_' + a.id : '',
          scale: TEX_SCALE,
        };
      });
    }
    if (this.tab === 'gifts') {
      return MOON_GIFTS.map((g) => {
        const found = !!(session.album.gifts && session.album.gifts[g.id]) || (session.gifts || []).indexOf(g.id) >= 0;
        return {
          found,
          golden: false,
          name: found ? g.name : '???',
          note: found ? (g.note || '') : '',
          key: found ? 'gift_' + g.id : '',
          scale: 0.7,
        };
      });
    }
    if (this.tab === 'ach') {
      ensureAlbum();
      return ACHIEVEMENTS.map((a) => {
        const earned = !!(session.ach && session.ach[a.id]);
        return {
          found: earned,
          golden: false,
          name: earned ? a.name : '???',
          note: a.how,
          alwaysNote: true,
          key: earned ? a.icon : '',
          scale: a.scale || 0.45,
        };
      });
    }
    return HATS.map((h) => {
      const found = !!(session.album.hats && session.album.hats[h.id]) || (session.hats || []).indexOf(h.id) >= 0;
      return {
        found,
        golden: false,
        name: found ? h.name : '???',
        note: found ? (h.note || '') : '',
        key: found ? 'hat_' + h.id : '',
        scale: 0.7,
      };
    });
  }

  step(dir) {
    const n = this.entries().length;
    const pages = Math.max(1, Math.ceil(n / PAGE));
    this.page = Math.max(0, Math.min(pages - 1, this.page + dir));
    this.refresh();
  }

  refresh() {
    const items = this.entries();
    const pages = Math.max(1, Math.ceil(items.length / PAGE));
    if (this.page >= pages) this.page = pages - 1;
    const ids = ['crops', 'animals', 'gifts', 'hats', 'ach'];
    for (let i = 0; i < ids.length; i++) {
      const rec = this.tabBtns[ids[i]];
      rec.g.clear();
      drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, this.tab === ids[i] ? 0xffe9a8 : 0xfff4d2, 0xe7b56a, this.tab === ids[i]);
    }
    for (let i = 0; i < PAGE; i++) {
      const card = this.cards[i];
      const item = items[this.page * PAGE + i];
      card.g.clear();
      if (!item) {
        card.name.setText('');
        card.note.setText('');
        card.icon.setVisible(false);
        card.stamp.setVisible(false);
        continue;
      }
      drawPlate(card.g, card.x, card.y, card.w, card.h, item.found ? 0xfff8ea : 0x3a2a22, item.found ? 0xe7b56a : 0x241812, false);
      card.name.setColor(item.found ? '#3A2A22' : '#C8B8A4');
      card.note.setColor(item.found ? '#6A5346' : '#8A7568');
      card.name.setText(item.name);
      card.note.setText(item.alwaysNote || item.found ? item.note : '');
      card.stamp.setVisible(!!item.golden);
      if (item.found && item.key) {
        card.icon.setTexture(item.key);
        card.icon.setVisible(true);
        card.icon.setScale(item.scale);
        card.icon.clearTint();
        if (item.golden) card.icon.setTint(0xffe38a);
      } else {
        card.icon.setVisible(false);
        card.g.fillStyle(0x1a120e, 1);
        card.g.fillCircle(card.x + 70, card.y + 90, 36);
      }
    }
    this.pageText.setText((this.page + 1) + ' / ' + pages);
    setButtonVisible(this.prevBtn, true);
    setButtonVisible(this.nextBtn, true);
  }

  close() {
    const from = this.from || 'title';
    session.modal = false;
    if (from !== 'title') session.sceneKey = from;
    this.scene.stop();
    this.scene.resume(from);
  }

  onDown(pointer) {
    if (pointer.button > 0) return;
    this.held = hitButton(this.ui, pointer.worldX, pointer.worldY);
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
    if (!this.scene.isActive()) return;
    if (event.key === 'Escape' || event.key === 'Enter' || event.key === 'b' || event.key === 'B') {
      event.preventDefault();
      this.close();
    }
  }

  listButtons() {
    return listVisible(this.ui);
  }
}
