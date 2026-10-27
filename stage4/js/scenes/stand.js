import { FONT, LOOK, SEASON_NAMES, hiDpi } from '../config.js?v=1';
import { drawStandBackdrop, TEX_SCALE } from '../art.js?v=1';
import { drawPlate, hitButton, listVisible } from '../ui.js?v=1';
import { playTap } from '../audio.js?v=1';
import { session, advanceSeason, hasAnimal, barnCap } from '../session.js?v=1';
import { UPGRADES, tryBuy, tryBuyAnimal, upgradeCost, upgradeMax } from '../data/shop.js?v=1';
import { SHOP_ANIMALS } from '../data/animals.js?v=1';
import { CROP_BY_ID } from '../data/crops.js?v=1';
import { ANIMAL_BY_ID } from '../data/animals.js?v=1';
import { saveGame, flushDirty } from '../save.js?v=1';
import { setBands } from '../bands.js?v=1';
import { openCodePanel, isCodeOpen } from '../codepanel.js?v=1';
import {
  nextPart, wishProgress, canBuildPart, buildPart, partUnlocked, hatList,
  tryBuyHat, wearHat, ownsHat, yearPartsDone, wishesMet,
} from '../story.js?v=1';
import { REPEAT_NOTE } from '../data/story.js?v=1';

const GENTLE = '#8A7568';

export class StandScene extends Phaser.Scene {
  constructor() {
    super('stand');
  }

  create() {
    hiDpi(this);
    session.sceneKey = 'stand';
    session.phase = 'stand';
    session.paused = false;
    session.particles = 0;
    this.tab = 'up';
    this.animalPage = 0;
    this.hatPage = 0;
    this.botWait = 1;
    this.noteT = 0;
    const bg = this.add.graphics().setDepth(0);
    drawStandBackdrop(bg, session.season);
    const look = LOOK[session.season] || LOOK.spring;
    setBands(look.sky, look.tray, false);
    this.add.image(640, 168, 'moon_body').setScale(0.28).setDepth(1);
    this.add.image(640, 168, 'moon_face').setScale(0.28).setDepth(2);
    this.add.image(70, 1180, 'pip').setScale(TEX_SCALE * 0.55).setDepth(2);
    this.hatImg = this.add.image(70, 1140, 'hat_straw').setScale(TEX_SCALE * 0.4).setDepth(3).setVisible(false);

    this.add.text(250, 28, 'Farm Stand', {
      fontFamily: FONT, fontSize: '40px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);
    this.coinText = this.add.text(560, 28, '', {
      fontFamily: FONT, fontSize: '28px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(3);

    const sum = session.summary || {
      harvested: session.harvested,
      bestChain: session.bestChain,
      bumpers: session.bumpers,
      goldens: session.goldens,
      dust: session.dustSeason,
      profit: session.earned - session.spent,
    };
    const tally = this.add.graphics().setDepth(3);
    tally.fillStyle(0xfff8ea, 1);
    tally.fillRoundedRect(16, 64, 688, 132, 24);
    tally.lineStyle(6, 0x3a2a22, 1);
    tally.strokeRoundedRect(20, 68, 680, 124, 20);
    const stats = [
      ['Harvested', sum.harvested || 0],
      ['Best chain', sum.bestChain || 0],
      ['Bumpers', sum.bumpers || 0],
      ['Goldens', sum.goldens || 0],
      ['Dust', sum.dust || 0],
      ['Profit', sum.profit != null ? sum.profit : 0],
    ];
    for (let i = 0; i < stats.length; i++) {
      const col = i % 3;
      const row = (i / 3) | 0;
      const x = 130 + col * 230;
      const y = 96 + row * 58;
      this.add.text(x, y, stats[i][0], {
        fontFamily: FONT, fontSize: '16px', color: '#6A5346', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
      this.add.text(x, y + 24, String(stats[i][1]), {
        fontFamily: FONT, fontSize: '26px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(4);
    }

    this.ui = [];
    this.upCards = [];
    this.anCards = [];
    this.hatCards = [];
    this.upTab = this.makeButton(16, 208, 168, 96, 'UPGRADES', 16, () => this.setTab('up'));
    this.anTab = this.makeButton(192, 208, 168, 96, 'ANIMALS', 16, () => this.setTab('an'));
    this.rkTab = this.makeButton(368, 208, 168, 96, 'ROCKET', 16, () => this.setTab('rk'));
    this.hatTab = this.makeButton(544, 208, 160, 96, 'HATS', 16, () => this.setTab('hat'));
    for (let i = 0; i < UPGRADES.length; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      this.upCards.push(this.makeCard(16 + col * 354, 320 + row * 158, 338, 148, UPGRADES[i].name, () => this.onBuy(UPGRADES[i].id)));
    }
    for (let i = 0; i < 6; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      this.anCards.push(this.makeCard(16 + col * 354, 320 + row * 158, 338, 148, '', () => this.onBuyAnimal(i)));
    }
    for (let i = 0; i < 6; i++) {
      const col = i % 2;
      const row = (i / 2) | 0;
      this.hatCards.push(this.makeCard(16 + col * 354, 320 + row * 158, 338, 148, '', () => this.onHat(i)));
    }
    this.prevBtn = this.makeButton(16, 800, 338, 110, 'PREV', 28, () => this.stepPage(-1));
    this.nextPage = this.makeButton(366, 800, 338, 110, 'NEXT', 28, () => this.stepPage(1));

    this.rkPanel = this.add.graphics().setDepth(5);
    this.rkTitle = this.add.text(360, 340, '', {
      fontFamily: FONT, fontSize: '32px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(6);
    this.rkBody = this.add.text(360, 430, '', {
      fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 600 },
    }).setOrigin(0.5, 0).setDepth(6);
    this.buildBtn = this.makeButton(80, 700, 560, 120, 'BUILD', 36, () => this.onBuild());

    const nextName = SEASON_NAMES[(session.seasonIndex + 1) % 4];
    this.nextBtn = this.makeButton(16, 960, 688, 100, 'NEXT SEASON', 28, () => this.nextSeason());
    this.nextBtn.text.setText('NEXT SEASON\n' + nextName);
    this.nextBtn.label = 'NEXT SEASON';
    this.albumBtn = this.makeButton(16, 1072, 220, 100, 'ALBUM', 22, () => this.openAlbum());
    this.codeBtn = this.makeButton(248, 1072, 220, 100, 'SAVE CODE', 20, () => this.openCode());
    this.titleBtn = this.makeButton(480, 1072, 224, 100, 'TITLE', 28, () => this.toTitle());

    this.note = this.add.text(360, 1190, '', {
      fontFamily: FONT, fontSize: '22px', color: GENTLE, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(8);

    this.refresh();
    this.input.addPointer(3);
    this.input.on('pointerdown', this.onDown, this);
    this.input.on('pointerup', this.onUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);
    this.held = null;
    this.botPtr = { x: 0, y: 0, worldX: 0, worldY: 0, id: 5, button: 0 };
  }

  makeButton(x, y, w, h, label, fontSize, onTap) {
    const g = this.add.graphics().setDepth(8);
    drawPlate(g, x, y, w, h, 0xfff4d2, 0xe7b56a, false);
    const text = this.add.text(x + w / 2, y + h / 2 - 2, label, {
      fontFamily: FONT, fontSize: fontSize + 'px', color: '#3A2A22', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(9);
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setDepth(10).setInteractive();
    const rec = { x, y, w, h, label, visible: true, g, text, zone, onTap, fill: 0xfff4d2, lip: 0xe7b56a };
    this.ui.push(rec);
    return rec;
  }

  makeCard(x, y, w, h, label, onTap) {
    const g = this.add.graphics().setDepth(5);
    const name = this.add.text(x + 16, y + 18, label, {
      fontFamily: FONT, fontSize: '26px', color: '#3A2A22', fontStyle: 'bold',
      wordWrap: { width: w - 32 },
    }).setOrigin(0, 0).setDepth(6);
    const desc = this.add.text(x + 16, y + 58, '', {
      fontFamily: FONT, fontSize: '18px', color: '#6A5346', fontStyle: 'bold',
      wordWrap: { width: w - 32 },
    }).setOrigin(0, 0).setDepth(6);
    const price = this.add.text(x + w - 16, y + h - 18, '', {
      fontFamily: FONT, fontSize: '28px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(1, 1).setDepth(6);
    const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setDepth(7).setInteractive();
    const rec = { x, y, w, h, label, visible: true, g, name, desc, price, zone, onTap };
    this.ui.push(rec);
    return rec;
  }

  showRec(rec, on) {
    rec.visible = on;
    rec.g.setVisible(on);
    if (rec.text) rec.text.setVisible(on);
    if (rec.name) rec.name.setVisible(on);
    if (rec.desc) rec.desc.setVisible(on);
    if (rec.price) rec.price.setVisible(on);
    if (on) {
      rec.zone.setVisible(true);
      if (!rec.zone.input || !rec.zone.input.enabled) rec.zone.setInteractive();
    } else {
      rec.zone.disableInteractive();
      rec.zone.setVisible(false);
    }
  }

  setTab(tab) {
    this.tab = tab;
    this.refresh();
  }

  stepPage(dir) {
    if (this.tab === 'an') {
      const pages = Math.max(1, Math.ceil(SHOP_ANIMALS.length / 6));
      this.animalPage = Math.max(0, Math.min(pages - 1, this.animalPage + dir));
    } else if (this.tab === 'hat') {
      const pages = Math.max(1, Math.ceil(hatList().length / 6));
      this.hatPage = Math.max(0, Math.min(pages - 1, this.hatPage + dir));
    }
    this.refresh();
  }

  paintRec(rec, fill, lip, selected) {
    rec.g.clear();
    drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, fill, lip, !!selected);
  }

  wishLine(w) {
    const crop = CROP_BY_ID[w.id];
    const animal = ANIMAL_BY_ID[w.id];
    let name = w.id;
    if (crop) name = crop.name;
    else if (animal) name = animal.name;
    const kind = w.kind === 'golden' ? 'golden ' : w.kind === 'good' ? 'collect ' : '';
    return kind + name + '  ' + w.have + '/' + w.n;
  }

  refreshRocket() {
    const on = this.tab === 'rk';
    this.rkPanel.setVisible(on);
    this.rkTitle.setVisible(on);
    this.rkBody.setVisible(on);
    this.showRec(this.buildBtn, on && !session.zen);
    if (!on) return;
    this.rkPanel.clear();
    this.rkPanel.fillStyle(0xfff8ea, 1);
    this.rkPanel.fillRoundedRect(16, 316, 688, 360, 24);
    this.rkPanel.lineStyle(6, 0x3a2a22, 1);
    this.rkPanel.strokeRoundedRect(20, 320, 680, 352, 20);
    if (session.zen) {
      this.rkTitle.setText('Zen sky');
      this.rkBody.setText('No rocket goals out here. The moon just waves.');
      this.buildBtn.label = 'All done';
      this.buildBtn.text.setText('All done');
      return;
    }
    const part = nextPart();
    if (!part) {
      this.rkTitle.setText('The rocket is ready');
      this.rkBody.setText('Nose cone on. Button Hill is cleared for launch.');
      this.buildBtn.label = 'All done';
      this.buildBtn.text.setText('All done');
      return;
    }
    const unlocked = partUnlocked(part);
    const wish = wishProgress(part);
    let body = part.coins + ' coins  ·  ' + part.dust + ' dust\n';
    for (let i = 0; i < wish.length; i++) body += this.wishLine(wish[i]) + '\n';
    if (!unlocked) body += '\nUnlocks in Moon Year ' + part.year;
    this.rkTitle.setText(part.name);
    this.rkBody.setText(body);
    const ready = canBuildPart(part);
    this.buildBtn.label = 'BUILD';
    this.buildBtn.text.setText(ready ? 'BUILD' : 'Not yet');
    this.paintRec(this.buildBtn, ready ? 0xffe08a : 0xe6e1da, ready ? 0xe7a23a : 0xcfc6bb, false);
  }

  refresh() {
    this.coinText.setText(session.coins + '  ·  ' + session.dust + ' dust');
    if (session.hat) {
      this.hatImg.setTexture('hat_' + session.hat);
      this.hatImg.setVisible(true);
    } else this.hatImg.setVisible(false);
    const up = this.tab === 'up';
    const an = this.tab === 'an';
    const rk = this.tab === 'rk';
    const hat = this.tab === 'hat';
    this.paintRec(this.upTab, up ? 0xffe9a8 : 0xfff4d2, 0xe7b56a, up);
    this.paintRec(this.anTab, an ? 0xffe9a8 : 0xfff4d2, 0xe7b56a, an);
    this.paintRec(this.rkTab, rk ? 0xffe9a8 : 0xfff4d2, 0xe7b56a, rk);
    this.paintRec(this.hatTab, hat ? 0xffe9a8 : 0xfff4d2, 0xe7b56a, hat);
    for (let i = 0; i < this.upCards.length; i++) {
      const rec = this.upCards[i];
      const item = UPGRADES[i];
      this.showRec(rec, up);
      if (!up) continue;
      const lv = session.upgrades[item.id] || 0;
      const maxed = lv >= item.max;
      const cost = upgradeCost(item.id, lv);
      const afford = !maxed && session.coins >= cost;
      rec.label = item.name;
      rec.name.setText(item.name);
      rec.desc.setText(item.desc);
      rec.name.setColor(!maxed && !afford ? GENTLE : '#3A2A22');
      rec.desc.setColor(!maxed && !afford ? GENTLE : '#6A5346');
      if (maxed) rec.price.setText('Got it!');
      else rec.price.setText(String(cost));
      rec.price.setColor(!maxed && !afford ? GENTLE : '#3A2A22');
      this.paintRec(rec, maxed ? 0xe3f6d8 : afford ? 0xfff8ea : 0xe6e1da, maxed ? 0x8bcf86 : afford ? 0xe7b56a : 0xcfc6bb, false);
    }
    for (let i = 0; i < this.anCards.length; i++) {
      const rec = this.anCards[i];
      const animal = SHOP_ANIMALS[this.animalPage * 6 + i];
      this.showRec(rec, an && !!animal);
      if (!an || !animal) continue;
      const owned = hasAnimal(animal.id);
      const full = session.animals.length >= barnCap();
      const afford = !owned && !full && session.coins >= animal.cost;
      rec.label = animal.name;
      rec.animalId = animal.id;
      rec.name.setText(animal.name);
      rec.desc.setText(animal.note);
      rec.price.setText(owned ? 'Home' : String(animal.cost));
      const soft = !owned && !afford;
      rec.name.setColor(soft ? GENTLE : '#3A2A22');
      rec.desc.setColor(soft ? GENTLE : '#6A5346');
      rec.price.setColor(soft ? GENTLE : '#3A2A22');
      this.paintRec(rec, owned ? 0xe3f6d8 : afford ? 0xfff8ea : 0xe6e1da, owned ? 0x8bcf86 : afford ? 0xe7b56a : 0xcfc6bb, false);
    }
    const hats = hatList();
    for (let i = 0; i < this.hatCards.length; i++) {
      const rec = this.hatCards[i];
      const item = hats[this.hatPage * 6 + i];
      this.showRec(rec, hat && !!item);
      if (!hat || !item) continue;
      const owned = ownsHat(item.id);
      const worn = session.hat === item.id;
      const afford = !owned && session.coins >= item.cost;
      rec.label = item.name;
      rec.hatId = item.id;
      rec.name.setText(item.name);
      rec.desc.setText(item.note);
      rec.price.setText(worn ? 'Wearing' : owned ? 'Wear' : String(item.cost));
      const soft = !owned && !afford;
      rec.name.setColor(soft ? GENTLE : '#3A2A22');
      rec.desc.setColor(soft ? GENTLE : '#6A5346');
      rec.price.setColor(soft ? GENTLE : '#3A2A22');
      this.paintRec(rec, worn ? 0xe3f6d8 : owned || afford ? 0xfff8ea : 0xe6e1da, worn ? 0x8bcf86 : 0xe7b56a, false);
    }
    this.showRec(this.prevBtn, an || hat);
    this.showRec(this.nextPage, an || hat);
    this.refreshRocket();
  }

  say(text) {
    this.note.setText(text);
    this.note.setColor(GENTLE);
    this.noteT = 2.4;
  }

  onBuy(id) {
    const lv = session.upgrades[id] || 0;
    if (lv >= upgradeMax(id)) { this.say('All set'); this.refresh(); return; }
    const cost = upgradeCost(id, lv);
    if (session.coins < cost) { this.say("Can't afford it yet"); this.refresh(); return; }
    tryBuy(id);
    this.note.setText('');
    this.refresh();
  }

  onBuyAnimal(slot) {
    const animal = SHOP_ANIMALS[this.animalPage * 6 + slot];
    if (!animal) return;
    if (hasAnimal(animal.id)) { this.say('Already here'); return; }
    if (session.animals.length >= barnCap()) { this.say('Barn is full'); return; }
    if (session.coins < animal.cost) { this.say("Can't afford it yet"); return; }
    tryBuyAnimal(animal.id);
    this.note.setText('');
    this.refresh();
  }

  onHat(slot) {
    const item = hatList()[this.hatPage * 6 + slot];
    if (!item) return;
    if (ownsHat(item.id)) {
      if (session.hat === item.id) wearHat('');
      else wearHat(item.id);
      this.refresh();
      return;
    }
    if (session.coins < item.cost) { this.say("Can't afford it yet"); return; }
    tryBuyHat(item.id);
    this.note.setText('');
    this.refresh();
  }

  onBuild() {
    const part = nextPart();
    if (!part) { this.say('All set'); return; }
    if (!canBuildPart(part)) { this.say('Not yet'); this.refresh(); return; }
    buildPart(part, false);
    this.note.setText('');
    this.refresh();
    if (session.pendingEnding) {
      session.pendingEnding = false;
      this.scene.start('ending');
    }
  }

  nextSeason() {
    const wrapping = session.seasonIndex === 3;
    if (wrapping && !session.zen && !session.ended && !yearPartsDone(session.year)) {
      this.say(REPEAT_NOTE);
    }
    advanceSeason();
    saveGame('season');
    this.scene.start('farm');
  }

  openAlbum() {
    this.scene.pause();
    this.scene.launch('album', { from: 'stand' });
  }

  openCode() {
    openCodePanel({
      onDone: (ok) => {
        if (!ok) return;
        if (session.phase === 'stand') this.scene.restart();
        else this.scene.start(session.phase === 'night' ? 'farm' : 'farm');
      },
    });
  }

  toTitle() {
    saveGame('quit');
    session.sceneKey = 'title';
    this.scene.start('title');
  }

  onDown(pointer) {
    if (pointer.button > 0) return;
    if (isCodeOpen() || this.scene.isActive('album')) return;
    this.held = hitButton(this.ui, pointer.worldX, pointer.worldY);
  }

  onUp(pointer) {
    if (!this.held) return;
    const tap = this.held;
    this.held = null;
    if (!hitButton([tap], pointer.worldX, pointer.worldY) || !tap.onTap) return;
    if (tap === this.nextBtn || tap === this.titleBtn || tap === this.albumBtn || tap === this.codeBtn || tap === this.buildBtn) playTap();
    tap.onTap();
  }

  onKey(event) {
    if (event.repeat) return;
    if (!this.scene.isActive() || this.scene.isActive('album') || this.scene.isActive('settings') || isCodeOpen()) return;
    if (event.key === 'Enter') {
      event.preventDefault();
      playTap();
      this.nextSeason();
    }
  }

  onShutdown() {
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  update(time, delta) {
    const dt = Math.min(0.05, delta / 1000);
    if (this.noteT > 0) {
      this.noteT -= dt;
      if (this.noteT <= 0) this.note.setText('');
    }
    flushDirty();
    this.botUpdate(dt);
  }

  botAt(x, y) {
    const p = this.botPtr;
    p.x = x;
    p.y = y;
    p.worldX = x;
    p.worldY = y;
    return p;
  }

  botTap(rec) {
    const x = rec.x + rec.w / 2;
    const y = rec.y + rec.h / 2;
    this.onDown(this.botAt(x, y));
    this.onUp(this.botAt(x, y));
  }

  rocketReserve() {
    const p = nextPart();
    if (!p || session.zen) return 0;
    // Bot: save the full amount only once dust and the wish list are ready;
    // until then keep half, so it still grows the farm (plots, upgrades).
    const ready = partUnlocked(p) && (session.dust || 0) >= p.dust && wishesMet(p);
    return ready ? (p.coins || 0) : Math.floor((p.coins || 0) / 2);
  }

  botUpdate(dt) {
    if (!session.bot || isCodeOpen() || this.scene.isActive('album')) return;
    if (this.botWait > 0) { this.botWait -= dt; return; }
    this.botWait = 0.35;
    const part = nextPart();
    if (part && !session.zen && canBuildPart(part)) {
      if (this.tab !== 'rk') { this.botTap(this.rkTab); return; }
      this.botTap(this.buildBtn);
      return;
    }
    const reserve = this.rocketReserve();
    const spare = session.coins - reserve;
    for (let i = 0; i < UPGRADES.length; i++) {
      const item = UPGRADES[i];
      const lv = session.upgrades[item.id] || 0;
      if (lv >= item.max) continue;
      const cost = upgradeCost(item.id, lv);
      if (spare < cost) continue;
      if (this.tab !== 'up') { this.botTap(this.upTab); return; }
      this.botTap(this.upCards[i]);
      return;
    }
    if (session.animals.length < barnCap()) {
      for (let n = 0; n < SHOP_ANIMALS.length; n++) {
        const animal = SHOP_ANIMALS[n];
        if (hasAnimal(animal.id) || spare < animal.cost) continue;
        if (this.tab !== 'an') { this.botTap(this.anTab); return; }
        const page = (n / 6) | 0;
        if (page !== this.animalPage) {
          this.botTap(page > this.animalPage ? this.nextPage : this.prevBtn);
          return;
        }
        this.botTap(this.anCards[n - page * 6]);
        return;
      }
    }
    if (part && spare > (part.coins || 0) + 400) {
      const hats = hatList();
      for (let n = 0; n < hats.length; n++) {
        const h = hats[n];
        if (ownsHat(h.id) || spare < h.cost + 200) continue;
        if (this.tab !== 'hat') { this.botTap(this.hatTab); return; }
        const page = (n / 6) | 0;
        if (page !== this.hatPage) {
          this.botTap(page > this.hatPage ? this.nextPage : this.prevBtn);
          return;
        }
        this.botTap(this.hatCards[n - page * 6]);
        return;
      }
    }
    this.botTap(this.nextBtn);
  }

  listButtons() {
    return listVisible(this.ui);
  }
}
