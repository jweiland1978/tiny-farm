import { FONT, SEASON_LABEL, TUNING, hiDpi } from '../config.js?v=1';
import { drawFarmBackdrop, TEX_SCALE } from '../art.js?v=1';
import { CROPS, CROP_BY_ID, effectiveGrow, harvestCoins, chainBonusCoins } from '../data/crops.js?v=1';
import { buildPlots, fieldMetrics, segmentEntryT, pointInRect } from '../geom.js?v=1';
import { addButton, setButtonVisible, drawPlate, hitButton, listVisible } from '../ui.js?v=1';
import { createFx, updateFx, spawnCoin, spawnPop, spawnSpark, spawnConfetti, spawnFloat } from '../fx.js?v=1';
import {
  playPlant, playPop, playTing, playBumper, playMega, playTap, playSeasonEnd,
  startFarmMusic, stopFarmMusic, applyMute,
} from '../audio.js?v=1';
import { session, logEvent, resetSeason, saveSettings } from '../session.js?v=1';

const GENTLE = '#8A7568';

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('farm');
  }

  create() {
    hiDpi(this);
    session.paused = false;
    this.paused = false;
    this.confirming = false;
    this.finishing = false;
    this.skipDelta = false;
    this.builtSize = 0;
    this.shownSec = -1;
    this.lastCoins = -9999;
    this.packetCoins = -9999;
    this.packetSeed = '';
    this.impressed = 0;
    this.blink = 0;
    this.blinkIn = 2.4;
    this.bannerT = 0;
    this.chainHold = 0;
    this.coinPop = 1;
    this.heard = 0;
    this.botBreath = 0;
    this.botCooldown = 0;
    this.gameTime = 0;
    this.held = null;
    this.uiButtons = [];
    this.pauseButtons = [];
    this.packets = [];
    this.views = [];
    this.plots = [];
    this.trailDrawn = false;
    this.trailHead = 0;
    this.trailCount = 0;
    this.trailX = new Float32Array(40);
    this.trailY = new Float32Array(40);
    this.trailA = new Float32Array(40);
    this.hitBuf = [];
    for (let i = 0; i < 20; i++) this.hitBuf.push({ t: 0, i: 0 });
    this.slots = [];
    for (let i = 0; i < 4; i++) {
      this.slots.push({
        active: false, id: -1, mode: '', button: null,
        sx: 0, sy: 0, lx: 0, ly: 0, moved: false,
        count: 0, coins: 0, needShown: false,
      });
    }
    this.botPtr = { x: 0, y: 0, worldX: 0, worldY: 0, id: 5, button: 0 };

    const bg = this.add.graphics().setDepth(0);
    drawFarmBackdrop(bg);
    this.cloudA = this.add.image(160, 150, 'cloud').setScale(TEX_SCALE).setDepth(1);
    this.cloudB = this.add.image(520, 110, 'cloud').setScale(TEX_SCALE * 0.8).setDepth(1);
    this.moon = this.add.image(500, 248, 'moon_body').setScale(TEX_SCALE).setDepth(2);
    this.moonFace = this.add.image(500, 248, 'moon_face').setScale(TEX_SCALE).setDepth(3);

    this.layoutField(false);
    this.createPip();
    this.fx = createFx(this);
    this.fx.targetX = 118;
    this.fx.targetY = 70;
    this.trailG = this.add.graphics().setDepth(14);
    this.createHud();
    this.createPackets();
    this.createBanners();
    this.createPause();

    this.input.addPointer(3);
    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);
    if (this.input.keyboard) this.input.keyboard.on('keydown', this.onKey, this);
    this.events.once('shutdown', this.onShutdown, this);

    const q = session.qaQueue;
    while (q.length) this.applyQa(q.shift());
    session.pendingFarm = false;
    if (!this.finishing) startFarmMusic();
    this.refreshPackets();
    this.refreshHud(true);
  }

  createPip() {
    const m = fieldMetrics(4);
    this.ground = { x: m.left - 16, y: m.top - 10, w: m.maxSpan + 48, h: m.maxSpan + 20 };
    const homeX = m.left + 70;
    const homeY = TUNING.fieldBottom - 80;
    this.pipImg = this.add.image(homeX, homeY, 'pip').setScale(TEX_SCALE).setDepth(12);
    this.shadow = this.add.image(homeX, homeY + 62, 'shadow').setScale(TEX_SCALE).setDepth(11);
    this.zzz = this.add.text(homeX, homeY - 90, 'z z z', {
      fontFamily: FONT, fontSize: '28px', color: '#6A5346', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(13).setVisible(false);
    this.pip = {
      x: homeX, y: homeY, tx: homeX, ty: homeY,
      idle: 0, nap: false, bounce: 0, flip: 0,
      glance: 0, blink: 0, blinkIn: 2.8, glanceIn: 5,
    };
    session.pip.x = homeX;
    session.pip.y = homeY;
  }

  createHud() {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xfff8ea, 1);
    g.fillRoundedRect(16, 18, 230, 100, 28);
    g.lineStyle(7, 0x3a2a22, 1);
    g.strokeRoundedRect(20, 22, 222, 92, 24);
    this.add.image(58, 68, 'coin').setScale(TEX_SCALE).setDepth(31);
    this.coinText = this.add.text(168, 68, String(session.coins), {
      fontFamily: FONT, fontSize: '44px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.seasonText = this.add.text(390, 40, SEASON_LABEL, {
      fontFamily: FONT, fontSize: '20px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.timerText = this.add.text(390, 86, '3:00', {
      fontFamily: FONT, fontSize: '44px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.pauseBtn = addButton(this, this.uiButtons, {
      x: 560, y: 18, w: 144, h: 100, label: 'PAUSE', fontSize: 26, depth: 32,
      fill: 0xfff4d2, lip: 0xe7b56a,
      onTap: () => this.openPause(),
    });
  }

  createPackets() {
    for (let i = 0; i < CROPS.length; i++) {
      const crop = CROPS[i];
      const col = i % 3;
      const row = (i / 3) | 0;
      const x = TUNING.packetOriginX + col * (TUNING.packetW + TUNING.packetGapX);
      const y = TUNING.packetOriginY + row * (TUNING.packetH + TUNING.packetGapY);
      const w = TUNING.packetW;
      const h = TUNING.packetH;
      const g = this.add.graphics().setDepth(30);
      const name = this.add.text(x + w / 2, y + 30, crop.name, {
        fontFamily: FONT, fontSize: '26px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const price = this.add.text(x + w / 2, y + 66, '', {
        fontFamily: FONT, fontSize: '32px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const time = this.add.text(x + w / 2, y + 98, '', {
        fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const zone = this.add.zone(x + w / 2, y + h / 2, w, h).setDepth(32).setInteractive();
      const rec = {
        x, y, w, h, label: crop.name, visible: true, crop, g, name, price, time, zone,
        onTap: () => {
          session.selectedSeed = crop.id;
          this.refreshPackets();
        },
      };
      this.packets.push(rec);
      this.uiButtons.push(rec);
    }
  }

  createBanners() {
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '64px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0, 1).setDepth(28).setVisible(false);
    this.bannerText = this.add.text(360, 560, '', {
      fontFamily: FONT, fontSize: '64px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 10, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(45).setVisible(false);
    this.overText = this.add.text(360, 620, 'Season over!', {
      fontFamily: FONT, fontSize: '64px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 10, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(55).setVisible(false);
  }

  createPause() {
    this.dim = this.add.graphics().setDepth(60).setVisible(false);
    this.dim.fillStyle(0x3a2a22, 0.5);
    this.dim.fillRect(0, 0, 720, 1280);
    this.sureText = this.add.text(360, 500, 'Are you sure?', {
      fontFamily: FONT, fontSize: '48px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(62).setVisible(false);
    const addP = (x, y, w, h, label, fontSize, onTap) => {
      const rec = addButton(this, this.pauseButtons, {
        x, y, w, h, label, fontSize, depth: 63, onTap,
      });
      setButtonVisible(rec, false);
      return rec;
    };
    this.resumeBtn = addP(150, 480, 420, 120, 'RESUME', 40, () => this.closePause());
    this.quitBtn = addP(150, 630, 420, 120, 'QUIT TO TITLE', 32, () => this.askQuit());
    this.soundBtn = addP(150, 780, 420, 110, 'SOUND ON', 32, () => this.toggleMute());
    this.yesBtn = addP(70, 620, 270, 120, 'YES', 40, () => this.answerQuit(true));
    this.noBtn = addP(380, 620, 270, 120, 'NO', 40, () => this.answerQuit(false));
  }

  layoutField(keep) {
    const size = session.fieldSize === 4 ? 4 : 3;
    const old = this.plots || [];
    const next = buildPlots(size);
    if (keep && old.length) {
      for (let i = 0; i < old.length; i++) {
        const p = old[i];
        for (let j = 0; j < next.length; j++) {
          if (next[j].row === p.row && next[j].col === p.col) {
            next[j].crop = p.crop;
            next[j].age = p.age;
            next[j].stage = p.stage;
            next[j].ripe = p.ripe;
          }
        }
      }
    }
    if (this.views) {
      for (let i = 0; i < this.views.length; i++) {
        const v = this.views[i];
        v.soil.destroy();
        v.crop.destroy();
        v.spark.destroy();
      }
    }
    this.views = [];
    this.plots = next;
    session.plots = next;
    for (let i = 0; i < next.length; i++) {
      const plot = next[i];
      const cx = plot.x + plot.w / 2;
      const cy = plot.y + plot.h / 2;
      const soil = this.add.image(cx, cy, 'soil').setScale(TEX_SCALE).setDepth(4);
      const crop = this.add.image(cx, cy - 8, 'crop_radish_1').setScale(0.32).setDepth(6).setVisible(false);
      const spark = this.add.image(cx, cy - 48, 'spark').setScale(0.4).setDepth(7).setVisible(false);
      this.views.push({
        soil, crop, spark, cx, cy, baseY: cy - 8,
        phase: i * 0.65, key: '', ripe: false, stage: 0, baseScale: 0.32,
      });
      this.syncPlotView(plot);
    }
    this.builtSize = size;
    const m = fieldMetrics(4);
    this.ground = { x: m.left - 16, y: m.top - 10, w: m.maxSpan + 48, h: m.maxSpan + 20 };
  }

  syncPlotView(plot) {
    const view = this.views[plot.i];
    if (!view) return;
    if (!plot.crop) {
      view.crop.setVisible(false);
      view.spark.setVisible(false);
      view.key = '';
      view.ripe = false;
      view.stage = 0;
      return;
    }
    const key = plot.ripe
      ? 'crop_' + plot.crop.id + '_ripe'
      : 'crop_' + plot.crop.id + '_' + plot.stage;
    if (view.key !== key) {
      view.key = key;
      view.crop.setTexture(key);
    }
    view.crop.setVisible(true);
    view.ripe = !!plot.ripe;
    view.stage = plot.stage;
    view.baseScale = plot.ripe ? 0.58 : plot.stage === 1 ? 0.52 : plot.stage === 2 ? 0.5 : 0.54;
    if (!plot.ripe) {
      view.crop.setScale(view.baseScale);
      view.crop.setPosition(view.cx, view.baseY);
      view.crop.setAngle(0);
      view.spark.setVisible(false);
    }
  }

  refreshPackets() {
    this.packetCoins = session.coins;
    this.packetSeed = session.selectedSeed;
    for (let i = 0; i < this.packets.length; i++) {
      const rec = this.packets[i];
      const crop = rec.crop;
      const selected = session.selectedSeed === crop.id;
      const afford = crop.cost === 0 || session.coins >= crop.cost;
      const grow = effectiveGrow(crop, session.upgrades);
      const secs = Math.max(1, Math.round(grow));
      rec.g.clear();
      const fill = !afford ? 0xe6e1da : selected ? 0xffe9a8 : 0xfff8ea;
      const lip = !afford ? 0xcfc6bb : selected ? 0xe0a020 : 0xe7b56a;
      drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, fill, lip, selected);
      rec.name.setColor(afford ? '#3A2A22' : GENTLE);
      rec.time.setColor(afford ? '#6A5346' : GENTLE);
      rec.time.setText(secs + 's');
      if (afford) {
        rec.price.setColor('#3A2A22');
        rec.price.setText(crop.cost === 0 ? 'FREE' : String(crop.cost));
      } else {
        rec.price.setColor(GENTLE);
        rec.price.setText('Need ' + (crop.cost - session.coins));
      }
    }
  }

  refreshHud(force) {
    if (force || session.coins !== this.lastCoins) {
      this.lastCoins = session.coins;
      this.coinText.setText(String(session.coins));
      this.coinPop = 1.16;
    }
    let shown;
    if (session.seasonTime <= 0) shown = 0;
    else shown = Math.ceil(session.seasonTime - 1e-6);
    if (shown !== this.shownSec) {
      this.shownSec = shown;
      const m = (shown / 60) | 0;
      const s = shown % 60;
      this.timerText.setText(m + ':' + (s < 10 ? '0' : '') + s);
    }
  }

  applyQa(op) {
    if (op.op === 'plantAll') this.qaPlantAll(op.a);
    else if (op.op === 'ripenAll') this.qaRipenAll();
    else if (op.op === 'ripen') this.qaRipen(op.a);
    else if (op.op === 'endSeason') this.finishSeason();
    else if (op.op === 'field') this.layoutField(true);
  }

  qaPlantAll(id) {
    const crop = CROP_BY_ID[id];
    if (!crop) return;
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      p.crop = crop;
      p.age = 0;
      p.stage = 1;
      p.ripe = false;
      p.swiped = false;
      this.syncPlotView(p);
      logEvent({ type: 'plant', crop: crop.id, i: p.i, cost: 0 });
    }
  }

  qaRipen(i) {
    const p = this.plots[i];
    if (!p || !p.crop) return;
    p.age = effectiveGrow(p.crop, session.upgrades);
    p.stage = 3;
    p.ripe = true;
    this.syncPlotView(p);
  }

  qaRipenAll() {
    for (let i = 0; i < this.plots.length; i++) this.qaRipen(i);
  }

  plotAt(x, y) {
    const plots = this.plots;
    for (let i = plots.length - 1; i >= 0; i--) {
      if (pointInRect(x, y, plots[i])) return plots[i];
    }
    return null;
  }

  freeSlot() {
    for (let i = 0; i < this.slots.length; i++) {
      if (!this.slots[i].active) return this.slots[i];
    }
    return this.slots[0];
  }

  slotById(id) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].active && this.slots[i].id === id) return this.slots[i];
    }
    return null;
  }

  onPointerDown(pointer) {
    if (this.finishing) return;
    if (pointer.button != null && pointer.button !== 0) return;
    const x = pointer.worldX;
    const y = pointer.worldY;
    const existing = this.slotById(pointer.id);
    if (existing) existing.active = false;
    this.notePointer(x, y);
    if (this.paused) {
      const b = hitButton(this.pauseButtons, x, y);
      if (b) {
        const slot = this.freeSlot();
        slot.active = true;
        slot.id = pointer.id;
        slot.mode = 'ui';
        slot.button = b;
        slot.sx = x;
        slot.sy = y;
        slot.lx = x;
        slot.ly = y;
        slot.moved = false;
      }
      return;
    }
    const button = hitButton(this.uiButtons, x, y);
    const slot = this.freeSlot();
    slot.active = true;
    slot.id = pointer.id;
    slot.sx = x;
    slot.sy = y;
    slot.lx = x;
    slot.ly = y;
    slot.moved = false;
    slot.count = 0;
    slot.coins = 0;
    slot.needShown = false;
    slot.button = button;
    if (button) {
      slot.mode = 'ui';
      return;
    }
    const plot = this.plotAt(x, y);
    slot.mode = plot && !plot.crop ? 'plant' : 'harvest';
    if (slot.mode === 'harvest') {
      for (let i = 0; i < this.plots.length; i++) this.plots[i].swiped = false;
    }
    this.pushTrail(x, y);
  }

  onPointerMove(pointer) {
    const x = pointer.worldX;
    const y = pointer.worldY;
    this.notePointer(x, y);
    const slot = this.slotById(pointer.id);
    if (!slot || slot.mode === 'ui' || this.paused || this.finishing) return;
    const dx = x - slot.sx;
    const dy = y - slot.sy;
    if (!slot.moved) {
      if (dx * dx + dy * dy < 256) return;
      slot.moved = true;
      this.processSegment(slot, slot.sx, slot.sy, x, y);
    } else {
      this.processSegment(slot, slot.lx, slot.ly, x, y);
    }
    slot.lx = x;
    slot.ly = y;
    this.pushTrail(x, y);
    if (slot.mode === 'harvest' && slot.count > 0) {
      this.chainText.setVisible(true);
      this.chainText.setText('x' + slot.count);
      this.chainText.setPosition(x + 26, y - 56);
      this.chainHold = 0.6;
    }
  }

  onPointerUp(pointer) {
    const x = pointer.worldX;
    const y = pointer.worldY;
    const slot = this.slotById(pointer.id);
    if (!slot) return;
    if (slot.mode === 'ui') {
      const b = hitButton([slot.button], x, y);
      slot.active = false;
      if (b && b.onTap && !this.finishing) {
        playTap();
        b.onTap();
      }
      return;
    }
    if (!slot.moved) {
      const plot = this.plotAt(slot.sx, slot.sy);
      if (plot && slot.mode === 'harvest' && plot.ripe) {
        this.harvestPlot(plot, slot);
        this.chainText.setVisible(true);
        this.chainText.setText('x' + slot.count);
        this.chainText.setPosition(slot.sx + 26, slot.sy - 56);
        this.chainHold = 0.5;
      } else if (plot && slot.mode === 'plant' && !plot.crop) {
        this.plantPlot(plot, slot);
      }
    }
    if (slot.mode === 'harvest') this.endChain(slot);
    slot.active = false;
    slot.count = 0;
  }

  processSegment(slot, x0, y0, x1, y1) {
    const plots = this.plots;
    const hits = this.hitBuf;
    let n = 0;
    for (let i = 0; i < plots.length; i++) {
      const t = segmentEntryT(x0, y0, x1, y1, plots[i]);
      if (t === null) continue;
      hits[n].t = t;
      hits[n].i = i;
      n++;
    }
    for (let a = 1; a < n; a++) {
      const t = hits[a].t;
      const idx = hits[a].i;
      let b = a - 1;
      while (b >= 0 && hits[b].t > t) {
        hits[b + 1].t = hits[b].t;
        hits[b + 1].i = hits[b].i;
        b--;
      }
      hits[b + 1].t = t;
      hits[b + 1].i = idx;
    }
    let broke = false;
    for (let k = 0; k < n; k++) {
      const plot = plots[hits[k].i];
      if (slot.mode === 'harvest') this.harvestPlot(plot, slot);
      else if (!broke) {
        const ok = this.plantPlot(plot, slot);
        if (!ok) broke = true;
      }
    }
  }

  plantPlot(plot, slot) {
    if (!plot || plot.crop) return true;
    const crop = CROP_BY_ID[session.selectedSeed] || CROPS[0];
    if (session.coins < crop.cost) {
      if (slot && !slot.needShown) {
        slot.needShown = true;
        const need = crop.cost - session.coins;
        spawnFloat(this.fx, plot.x + plot.w / 2, plot.y + 20, 'Need ' + need);
      }
      return false;
    }
    session.coins -= crop.cost;
    session.spent += crop.cost;
    plot.crop = crop;
    plot.age = 0;
    plot.stage = 1;
    plot.ripe = false;
    plot.swiped = false;
    this.syncPlotView(plot);
    logEvent({ type: 'plant', crop: crop.id, i: plot.i, cost: crop.cost });
    playPlant();
    return true;
  }

  harvestPlot(plot, slot) {
    if (!plot || !plot.ripe || !plot.crop || plot.swiped) return;
    plot.swiped = true;
    const crop = plot.crop;
    const index = slot.count;
    const coins = harvestCoins(crop, index, session.upgrades);
    slot.count = index + 1;
    slot.coins += coins;
    session.coins += coins;
    session.earned += coins;
    session.harvested += 1;
    session.chain = slot.count;
    logEvent({ type: 'harvest', crop: crop.id, chainIndex: index, i: plot.i, coins });
    playPop(index);
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    const key = 'crop_' + crop.id + '_ripe';
    spawnPop(this.fx, cx, cy - 8, key);
    const ang = (index * 0.9) + 0.4;
    spawnSpark(this.fx, cx, cy - 10, Math.cos(ang) * 90, -80 - (index % 3) * 20);
    spawnCoin(this.fx, cx, cy, index * 0.035);
    spawnFloat(this.fx, cx, cy - 30, '+' + coins);
    if (slot.count >= TUNING.bumperAt && slot.count % 2 === 0) {
      spawnCoin(this.fx, cx, 180, 0.1 + index * 0.02);
    }
    plot.crop = null;
    plot.age = 0;
    plot.stage = 0;
    plot.ripe = false;
    this.syncPlotView(plot);
    this.pip.bounce = 0.32;
    this.pip.idle = 0;
    this.pip.nap = false;
  }

  endChain(slot) {
    const count = slot.count;
    if (count <= 0) {
      session.chain = 0;
      return;
    }
    const mega = count >= TUNING.megaAt;
    const bumper = count >= TUNING.bumperAt;
    const bonus = chainBonusCoins(slot.coins, count);
    if (bonus > 0) {
      session.coins += bonus;
      session.earned += bonus;
      spawnFloat(this.fx, slot.lx, slot.ly - 70, '+' + bonus);
      spawnCoin(this.fx, slot.lx, slot.ly, 0.05);
    }
    if (mega) {
      session.megas += 1;
      session.bumpers += 1;
      this.megaJuice(slot.lx, slot.ly);
    } else if (bumper) {
      session.bumpers += 1;
      this.bumperJuice(slot.lx, slot.ly);
    }
    session.lastChain = count;
    if (count > session.bestChain) session.bestChain = count;
    session.chain = 0;
    logEvent({
      type: 'chainEnd',
      count,
      coins: slot.coins + bonus,
      bumper: bumper && !mega,
      mega,
    });
    slot.count = 0;
    slot.coins = 0;
  }

  bumperJuice(x, y) {
    playBumper();
    this.impressed = Math.max(this.impressed, 1.7);
    this.bannerText.setText('Bumper!');
    this.bannerText.setFontSize(64);
    this.bannerText.setVisible(true);
    this.bannerText.setAlpha(1);
    this.bannerText.setPosition(360, 540);
    this.bannerT = 1.25;
    for (let i = 0; i < 6; i++) spawnCoin(this.fx, 120 + i * 80, 200, i * 0.04);
    void x;
    void y;
  }

  megaJuice() {
    playMega();
    this.impressed = Math.max(this.impressed, 2.6);
    this.bannerText.setText('MEGA BUMPER!');
    this.bannerText.setFontSize(52);
    this.bannerText.setVisible(true);
    this.bannerText.setAlpha(1);
    this.bannerText.setPosition(360, 530);
    this.bannerT = 1.7;
    this.pip.flip = 0.62;
    this.cameras.main.shake(150, 0.0035);
    spawnConfetti(this.fx, 360, 480, 42, session.rng);
    for (let i = 0; i < 10; i++) spawnCoin(this.fx, 70 + i * 58, 190, i * 0.035);
  }

  notePointer(x, y) {
    if (!this.pip || !this.ground) return;
    const g = this.ground;
    let tx = x - 18;
    let ty = y + 42;
    const m = 48;
    if (tx < g.x + m) tx = g.x + m;
    if (ty < g.y + m) ty = g.y + m;
    if (tx > g.x + g.w - m) tx = g.x + g.w - m;
    if (ty > g.y + g.h - m) ty = g.y + g.h - m;
    this.pip.tx = tx;
    this.pip.ty = ty;
    this.pip.idle = 0;
    this.pip.nap = false;
  }

  pushTrail(x, y) {
    const i = this.trailHead;
    this.trailX[i] = x;
    this.trailY[i] = y;
    this.trailA[i] = 0;
    this.trailHead = (i + 1) % 40;
    if (this.trailCount < 40) this.trailCount++;
  }

  updateTrail(dt) {
    if (this.trailCount === 0) {
      if (this.trailDrawn) {
        this.trailG.clear();
        this.trailDrawn = false;
      }
      return;
    }
    let alive = 0;
    for (let n = 0; n < this.trailCount; n++) {
      const i = (this.trailHead - this.trailCount + n + 40) % 40;
      this.trailA[i] += dt;
      if (this.trailA[i] < 0.26) alive++;
    }
    const g = this.trailG;
    g.clear();
    this.trailDrawn = true;
    if (alive < 2) {
      if (alive === 0) this.trailCount = 0;
      return;
    }
    g.lineStyle(16, 0x3a2a22, 0.35);
    g.beginPath();
    let started = false;
    for (let n = 0; n < this.trailCount; n++) {
      const i = (this.trailHead - this.trailCount + n + 40) % 40;
      if (this.trailA[i] >= 0.26) { started = false; continue; }
      if (!started) {
        g.moveTo(this.trailX[i], this.trailY[i]);
        started = true;
      } else g.lineTo(this.trailX[i], this.trailY[i]);
    }
    g.strokePath();
    g.lineStyle(8, 0xfff6d0, 0.9);
    g.beginPath();
    started = false;
    for (let n = 0; n < this.trailCount; n++) {
      const i = (this.trailHead - this.trailCount + n + 40) % 40;
      if (this.trailA[i] >= 0.26) { started = false; continue; }
      if (!started) {
        g.moveTo(this.trailX[i], this.trailY[i]);
        started = true;
      } else g.lineTo(this.trailX[i], this.trailY[i]);
    }
    g.strokePath();
  }

  updateGrowth(gdt) {
    const up = session.upgrades;
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (!p.crop) continue;
      p.age += gdt;
      const need = effectiveGrow(p.crop, up);
      const u = need > 0 ? p.age / need : 1;
      const wasRipe = p.ripe;
      const wasStage = p.stage;
      if (u >= 1) {
        p.ripe = true;
        p.stage = 3;
      } else if (u >= 0.66) {
        p.ripe = false;
        p.stage = 3;
      } else if (u >= 0.33) {
        p.ripe = false;
        p.stage = 2;
      } else {
        p.ripe = false;
        p.stage = 1;
      }
      if (wasRipe !== p.ripe || wasStage !== p.stage) this.syncPlotView(p);
    }
  }

  updateCrops(time) {
    const t = time * 0.001;
    for (let i = 0; i < this.views.length; i++) {
      const view = this.views[i];
      if (!view.crop.visible) continue;
      if (view.ripe) {
        const s = Math.sin(t * 6 + view.phase);
        view.crop.setPosition(view.cx, view.baseY + s * 6);
        view.crop.setScale(view.baseScale * (1.04 + s * 0.035), view.baseScale * (1.04 - s * 0.05));
        view.crop.setAngle(0);
        view.spark.setVisible(true);
        view.spark.setPosition(view.cx + Math.cos(t * 3 + view.phase) * 36, view.baseY - 42 + Math.sin(t * 4 + view.phase) * 8);
        view.spark.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(t * 5 + view.phase)));
        view.spark.setScale(0.35 + 0.12 * Math.abs(Math.sin(t * 4 + view.phase)));
      } else {
        view.crop.setAngle(Math.sin(t * 2.2 + view.phase) * 3);
      }
    }
  }

  updatePip(dt, time) {
    const pip = this.pip;
    pip.idle += dt;
    if (!pip.nap && pip.idle >= TUNING.pipNapSeconds) pip.nap = true;
    const k = Math.min(1, dt * 8);
    pip.x += (pip.tx - pip.x) * k;
    pip.y += (pip.ty - pip.y) * k;
    let sx = 1;
    let sy = 1;
    if (pip.bounce > 0) {
      pip.bounce -= dt;
      const u = Math.max(0, pip.bounce) / 0.32;
      const w = Math.sin((1 - u) * Math.PI);
      sx = 1 + w * 0.16;
      sy = 1 - w * 0.2;
    }
    let rot = 0;
    let hop = 0;
    if (pip.flip > 0) {
      const u = 1 - pip.flip / 0.62;
      rot = Math.max(0, u) * Math.PI * 2;
      hop = Math.sin(Math.min(1, Math.max(0, u)) * Math.PI) * 70;
      pip.flip -= dt;
      if (pip.flip <= 0) rot = 0;
    }
    let key = 'pip';
    if (pip.nap) key = 'pip_nap';
    else if (pip.glance > 0) key = 'pip_look';
    else if (pip.blink > 0) key = 'pip_blink';
    if (this.pipImg.texture.key !== key) this.pipImg.setTexture(key);
    if (pip.nap) {
      hop += Math.sin(time / 500) * 2;
    }
    this.pipImg.setScale(TEX_SCALE * sx, TEX_SCALE * sy);
    this.pipImg.setRotation(rot);
    this.pipImg.setPosition(pip.x, pip.y - hop);
    this.shadow.setPosition(pip.x, pip.y + 62);
    this.shadow.setAlpha(pip.nap ? 0.18 : 0.28);
    this.zzz.setVisible(pip.nap);
    if (pip.nap) this.zzz.setPosition(pip.x + 46, pip.y - 86 - Math.sin(time / 280) * 5);
    if (!pip.nap && pip.flip <= 0) {
      pip.blinkIn -= dt;
      if (pip.blink > 0) pip.blink -= dt;
      else if (pip.blinkIn <= 0) {
        pip.blink = 0.12;
        pip.blinkIn = 2.4 + session.rng.next() * 2.2;
      }
      pip.glanceIn -= dt;
      if (pip.glance > 0) pip.glance -= dt;
      else if (pip.glanceIn <= 0) {
        pip.glance = 0.75;
        pip.glanceIn = 4.5 + session.rng.next() * 4;
      }
    }
    session.pip.x = pip.x;
    session.pip.y = pip.y;
  }

  updateMoon(dt, time) {
    const bob = Math.sin(time / 800) * 8;
    this.moon.setY(248 + bob);
    this.moonFace.setY(248 + bob);
    if (this.impressed > 0) {
      this.impressed -= dt;
      if (this.moonFace.texture.key !== 'moon_wow') this.moonFace.setTexture('moon_wow');
      return;
    }
    if (this.blink > 0) {
      this.blink -= dt;
      if (this.blink <= 0 && this.moonFace.texture.key !== 'moon_face') this.moonFace.setTexture('moon_face');
    } else {
      this.blinkIn -= dt;
      if (this.blinkIn <= 0) {
        this.blink = 0.14;
        this.blinkIn = 2.8 + session.rng.next() * 2;
        this.moonFace.setTexture('moon_blink');
      } else if (this.moonFace.texture.key !== 'moon_face' && this.moonFace.texture.key !== 'moon_blink') {
        this.moonFace.setTexture('moon_face');
      }
    }
  }

  openPause() {
    if (this.finishing) return;
    this.paused = true;
    session.paused = true;
    this.confirming = false;
    this.dim.setVisible(true);
    this.sureText.setVisible(false);
    setButtonVisible(this.resumeBtn, true);
    setButtonVisible(this.quitBtn, true);
    setButtonVisible(this.soundBtn, true);
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);
    this.soundBtn.label = session.mute ? 'MUTED' : 'SOUND ON';
    this.soundBtn.text.setText(this.soundBtn.label);
  }

  closePause() {
    this.paused = false;
    session.paused = false;
    this.confirming = false;
    this.dim.setVisible(false);
    this.sureText.setVisible(false);
    setButtonVisible(this.resumeBtn, false);
    setButtonVisible(this.quitBtn, false);
    setButtonVisible(this.soundBtn, false);
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);
  }

  askQuit() {
    this.confirming = true;
    setButtonVisible(this.resumeBtn, false);
    setButtonVisible(this.quitBtn, false);
    setButtonVisible(this.soundBtn, false);
    setButtonVisible(this.yesBtn, true);
    setButtonVisible(this.noBtn, true);
    this.sureText.setVisible(true);
  }

  answerQuit(yes) {
    if (!yes) {
      this.openPause();
      return;
    }
    this.paused = false;
    session.paused = false;
    resetSeason();
    stopFarmMusic();
    this.scene.start('title');
  }

  toggleMute() {
    session.mute = !session.mute;
    saveSettings();
    applyMute();
    this.soundBtn.label = session.mute ? 'MUTED' : 'SOUND ON';
    this.soundBtn.text.setText(this.soundBtn.label);
  }

  finishSeason() {
    if (this.finishing) return;
    this.finishing = true;
    session.seasonTime = 0;
    this.closePause();
    for (let i = 0; i < this.slots.length; i++) {
      const slot = this.slots[i];
      if (slot.active && slot.mode === 'harvest') this.endChain(slot);
      slot.active = false;
    }
    session.summary = {
      earned: session.earned,
      profit: session.earned - session.spent,
      harvested: session.harvested,
      bestChain: session.bestChain,
      bumpers: session.bumpers,
      megas: session.megas,
    };
    logEvent({
      type: 'seasonEnd',
      earned: session.earned,
      spent: session.spent,
      profit: session.earned - session.spent,
      harvested: session.harvested,
      bestChain: session.bestChain,
    });
    playSeasonEnd();
    stopFarmMusic();
    this.overText.setVisible(true);
    this.shownSec = -1;
    this.refreshHud(true);
    this.time.delayedCall(1100, () => {
      this.scene.start('stand');
    });
  }

  onKey(event) {
    if (event.repeat) return;
    const k = event.key;
    if (k === 'Escape' || k === 'p' || k === 'P') {
      event.preventDefault();
      if (this.finishing) return;
      if (this.confirming) { this.answerQuit(false); return; }
      if (this.paused) { this.closePause(); return; }
      this.openPause();
      return;
    }
    if (k === 'Enter') {
      event.preventDefault();
      if (this.finishing) return;
      if (this.confirming) { this.answerQuit(false); return; }
      if (this.paused) { this.closePause(); return; }
      return;
    }
    if (this.paused || this.finishing) return;
    if (k >= '1' && k <= '6') {
      const idx = k.charCodeAt(0) - 49;
      if (CROPS[idx]) {
        session.selectedSeed = CROPS[idx].id;
        this.refreshPackets();
      }
    }
  }

  botAt(x, y) {
    const p = this.botPtr;
    p.x = x;
    p.y = y;
    p.worldX = x;
    p.worldY = y;
    return p;
  }

  botUpdate(gdt) {
    if (!session.bot || this.paused || this.finishing) return;
    if (this.botBreath > 0) {
      this.botBreath -= gdt;
      this.botStroll();
      return;
    }
    if (this.botCooldown > 0) {
      this.botCooldown -= gdt;
      return;
    }
    let ripeN = 0;
    let growing = 0;
    let emptyN = 0;
    let oldest = 0;
    const up = session.upgrades;
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (p.ripe) {
        ripeN++;
        const waited = p.age - effectiveGrow(p.crop, up);
        if (waited > oldest) oldest = waited;
      } else if (p.crop) growing++;
      else emptyN++;
    }
    const want = Math.min(TUNING.bumperAt, this.plots.length);
    if (ripeN >= want || (ripeN > 0 && growing === 0) || (ripeN > 0 && oldest >= 1.2)) {
      this.botHarvest();
      this.botBreath = TUNING.botBreathSeconds;
      return;
    }
    if (emptyN > 0 && ripeN === 0 && growing === 0) {
      if (this.botPlant()) this.botCooldown = 0.35;
      else this.botStroll();
      return;
    }
    if (growing === 0 && ripeN === 0) this.botStroll();
  }

  waveGross(crop, n) {
    let sub = 0;
    for (let i = 0; i < n; i++) sub += harvestCoins(crop, i, session.upgrades);
    return sub + chainBonusCoins(sub, n);
  }

  botSeedId() {
    let emptyN = 0;
    for (let i = 0; i < this.plots.length; i++) if (!this.plots[i].crop) emptyN++;
    if (emptyN <= 0) return null;
    const timeLeft = session.noTimer ? 9999 : session.seasonTime;
    for (let i = CROPS.length - 1; i >= 0; i--) {
      const c = CROPS[i];
      if (c.cost > 0 && session.coins < c.cost * emptyN) continue;
      const grow = effectiveGrow(c, session.upgrades);
      if (grow + 0.4 > timeLeft) continue;
      const gross = this.waveGross(c, emptyN);
      if (session.earned + gross > TUNING.botEarnCap) continue;
      return c.id;
    }
    return null;
  }

  botStroll() {
    const g = this.ground;
    if (!g) return;
    const u = Math.sin(this.gameTime * 0.7);
    const v = Math.cos(this.gameTime * 0.45);
    const x = g.x + g.w * (0.5 + u * 0.28);
    const y = g.y + g.h * (0.62 + v * 0.1);
    this.onPointerMove(this.botAt(x, y));
  }

  botSelect(id) {
    if (session.selectedSeed === id) return;
    let rec = this.packets[0];
    for (let i = 0; i < this.packets.length; i++) {
      if (this.packets[i].crop.id === id) rec = this.packets[i];
    }
    const x = rec.x + rec.w / 2;
    const y = rec.y + rec.h / 2;
    this.onPointerDown(this.botAt(x, y));
    this.onPointerUp(this.botAt(x, y));
  }

  botPlant() {
    const id = this.botSeedId();
    if (!id) return false;
    this.botSelect(id);
    const size = this.builtSize;
    let started = false;
    let stop = false;
    let lx = 0;
    let ly = 0;
    const cost = (CROP_BY_ID[session.selectedSeed] || CROPS[0]).cost;
    for (let row = 0; row < size && !stop; row++) {
      for (let c = 0; c < size; c++) {
        const col = row % 2 === 0 ? c : size - 1 - c;
        let plot = null;
        for (let i = 0; i < this.plots.length; i++) {
          if (this.plots[i].row === row && this.plots[i].col === col) plot = this.plots[i];
        }
        if (!plot || plot.crop) continue;
        if (session.coins < cost) { stop = true; break; }
        const x = plot.x + plot.w / 2;
        const y = plot.y + plot.h / 2;
        if (!started) {
          this.onPointerDown(this.botAt(x, y));
          started = true;
        } else {
          this.onPointerMove(this.botAt(x, y));
        }
        lx = x;
        ly = y;
      }
    }
    if (started) this.onPointerUp(this.botAt(lx, ly));
    return started;
  }

  botHarvest() {
    const size = this.builtSize;
    let first = null;
    const centers = [];
    for (let row = 0; row < size; row++) {
      for (let c = 0; c < size; c++) {
        const col = row % 2 === 0 ? c : size - 1 - c;
        for (let i = 0; i < this.plots.length; i++) {
          const p = this.plots[i];
          if (p.row === row && p.col === col) {
            const pt = { x: p.x + p.w / 2, y: p.y + p.h / 2 };
            if (!first) first = pt;
            centers.push(pt);
          }
        }
      }
    }
    if (!first) return;
    const startX = 6;
    const startY = first.y;
    this.onPointerDown(this.botAt(startX, startY));
    let lx = startX;
    let ly = startY;
    for (let i = 0; i < centers.length; i++) {
      this.onPointerMove(this.botAt(centers[i].x, centers[i].y));
      lx = centers[i].x;
      ly = centers[i].y;
    }
    this.onPointerUp(this.botAt(lx, ly));
  }

  update(time, delta) {
    if (document.hidden || session.hidden) {
      this.skipDelta = true;
      return;
    }
    if (this.skipDelta) {
      this.skipDelta = false;
      return;
    }
    const realDt = Math.min(0.05, delta / 1000);
    const scaled = realDt * session.timeScale;
    const frozen = this.paused || this.finishing;
    const gdt = frozen ? 0 : scaled;
    this.gameTime += gdt;
    if (!frozen && !session.noTimer) {
      session.seasonTime -= scaled;
      if (session.seasonTime <= 0) {
        session.seasonTime = 0;
        this.finishSeason();
      }
    }
    if (this.builtSize !== (session.fieldSize === 4 ? 4 : 3)) this.layoutField(true);
    this.updateGrowth(gdt);
    this.updateCrops(time);
    this.updatePip(realDt, time);
    this.updateMoon(realDt, time);
    this.cloudA.x += realDt * 8;
    if (this.cloudA.x > 820) this.cloudA.x = -120;
    this.cloudB.x -= realDt * 6;
    if (this.cloudB.x < -140) this.cloudB.x = 840;
    updateFx(this.fx, realDt);
    session.particles = this.fx.live;
    if (this.fx.arrived !== this.heard) {
      this.heard = this.fx.arrived;
      this.coinPop = Math.max(this.coinPop, 1.22);
      playTing();
    }
    if (this.coinPop > 1) {
      this.coinPop += (1 - this.coinPop) * Math.min(1, realDt * 8);
      if (this.coinPop < 1.01) this.coinPop = 1;
      this.coinText.setScale(this.coinPop);
    }
    this.updateTrail(realDt);
    if (this.chainHold > 0) {
      this.chainHold -= realDt;
      if (this.chainHold <= 0) this.chainText.setVisible(false);
    }
    if (this.bannerT > 0) {
      this.bannerT -= realDt;
      this.bannerText.setAlpha(Math.max(0, this.bannerT / 0.4));
      if (this.bannerT <= 0) this.bannerText.setVisible(false);
    }
    this.refreshHud(false);
    if (session.coins !== this.packetCoins || session.selectedSeed !== this.packetSeed) this.refreshPackets();
    this.botUpdate(gdt);
  }

  onShutdown() {
    stopFarmMusic();
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  listButtons() {
    if (this.paused) return listVisible(this.pauseButtons);
    if (this.finishing) return [];
    return listVisible(this.uiButtons);
  }
}
