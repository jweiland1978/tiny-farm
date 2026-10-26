import {
  FONT, LOOK, TUNING, hiDpi, seasonLabel,
} from '../config.js?v=1';
import { drawFarmBackdrop, TEX_SCALE, SOIL_LOGICAL } from '../art.js?v=1';
import {
  CROP_BY_ID, cropsForSeason, moonCrops, freeCropId, effectiveGrow,
  harvestCoins, goldenCoins, chainBonusCoins, profitPerSecond,
} from '../data/crops.js?v=1';
import { ANIMAL_BY_ID } from '../data/animals.js?v=1';
import { buildPlots, fieldMetrics, segmentEntryT, pointInRect, adjacent, yardSlots } from '../geom.js?v=1';
import { addButton, setButtonVisible, drawPlate, hitButton, listVisible } from '../ui.js?v=1';
import { createFx, updateFx, spawnCoin, spawnPop, spawnSpark, spawnConfetti, spawnFloat, floaterRects } from '../fx.js?v=1';
import {
  playPlant, playPop, playTing, playBumper, playMega, playTap, playSeasonEnd,
  playShing, playCaw, playSwish, playDust, playAnimal, playGood,
  startFarmMusic, stopFarmMusic, applyMute,
} from '../audio.js?v=1';
import { session, logEvent, hasAnimal, saveSettings } from '../session.js?v=1';
import { unlockAlbum } from '../album.js?v=1';
import { saveGame, markDirty, flushDirty, clearSave } from '../save.js?v=1';
import { setBands } from '../bands.js?v=1';
import { openCodePanel, closeCodePanel, isCodeOpen } from '../codepanel.js?v=1';

const GENTLE = '#8A7568';
const PIP_Y = 372;

function growthOf(plot) {
  if (!plot.crop) {
    plot.stage = 0;
    plot.ripe = false;
    return;
  }
  const need = effectiveGrow(plot.crop);
  if (plot.age >= need) {
    plot.age = need;
    plot.ripe = true;
    plot.stage = 3;
  } else if (plot.age >= need * 0.66) {
    plot.ripe = false;
    plot.stage = 3;
  } else if (plot.age >= need * 0.33) {
    plot.ripe = false;
    plot.stage = 2;
  } else {
    plot.ripe = false;
    plot.stage = 1;
  }
}

function priceySeed() {
  const list = cropsForSeason(session.season);
  let best = list[0] || CROP_BY_ID.onion;
  for (let i = 0; i < list.length; i++) {
    if (list[i].cost > best.cost) best = list[i];
  }
  if (!best || best.cost <= 0) return 'onion';
  return best.id;
}

function invSig() {
  const inv = session.inventory || {};
  const keys = Object.keys(inv).sort();
  let s = '';
  for (let i = 0; i < keys.length; i++) {
    const n = inv[keys[i]] || 0;
    if (n) s += keys[i] + ':' + n + ',';
  }
  return s;
}

export class FarmScene extends Phaser.Scene {
  constructor() {
    super('farm');
  }

  create() {
    hiDpi(this);
    session.sceneKey = 'farm';
    session.paused = false;
    session.modal = false;
    if (session.wipeSave) {
      clearSave();
      session.wipeSave = false;
      session.plots = [];
      session.keepPlots = false;
    }
    const cameNight = session.phase === 'night';
    if (!cameNight) session.phase = 'farm';

    this.paused = false;
    this.confirming = false;
    this.finishing = false;
    this.skipDelta = false;
    this.builtSize = 0;
    this.shownSec = -1;
    this.lastCoins = -9999;
    this.lastDust = -9999;
    this.hudKey = '';
    this.packetKey = '';
    this.impressed = 0;
    this.blink = 0;
    this.blinkIn = 2.4;
    this.bannerT = 0;
    this.bannerKind = '';
    this.coinPop = 1;
    this.heard = 0;
    this.botBreath = 0;
    this.botCooldown = 0;
    this.gameTime = 0;
    this.awayT = 0;
    this.lookKey = '';
    this.animalSig = '';
    this.animalViews = [];
    this.uiButtons = [];
    this.pauseButtons = [];
    this.gridSlots = [];
    this.views = [];
    this.plots = [];
    this.sparkles = [];
    this.trailDrawn = false;
    this.trailHead = 0;
    this.trailCount = 0;
    this.trailX = new Float32Array(40);
    this.trailY = new Float32Array(40);
    this.trailA = new Float32Array(40);
    this.hitBuf = [];
    for (let i = 0; i < 40; i++) this.hitBuf.push({ t: 0, i: 0 });
    this.slots = [];
    for (let i = 0; i < 4; i++) {
      this.slots.push({
        active: false, id: -1, mode: '', button: null, animal: null, spark: null,
        sx: 0, sy: 0, lx: 0, ly: 0, moved: false,
        count: 0, coins: 0, needShown: false, run: [], lastX: 0, lastY: 0,
      });
    }
    this.botPtr = { x: 0, y: 0, worldX: 0, worldY: 0, id: 5, button: 0 };

    this.bg = this.add.graphics().setDepth(0);
    this.nightSky = this.add.graphics().setDepth(16).setVisible(false);
    this.nightVeil = this.add.graphics().setDepth(10).setVisible(false);
    this.cloudA = this.add.image(160, 150, 'cloud').setScale(TEX_SCALE).setDepth(1);
    this.cloudB = this.add.image(520, 90, 'cloud').setScale(TEX_SCALE * 0.75).setDepth(1);
    this.moon = this.add.image(560, 210, 'moon_body').setScale(0.36).setDepth(17);
    this.moonFace = this.add.image(560, 210, 'moon_face').setScale(0.36).setDepth(17);
    this.fenceG = this.add.graphics().setDepth(3);
    this.drawFence();

    this.layoutField(!!session.keepPlots);
    session.keepPlots = false;
    this.createPip();
    this.fx = createFx(this);
    this.fx.targetX = 90;
    this.fx.targetY = 56;
    this.fx.block = null;
    this.trailG = this.add.graphics().setDepth(14);
    this.createHud();
    this.createPackets();
    this.createBanners();
    this.createPause();
    this.createSparkles();
    this.syncAnimals();

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

    if (session.announceSeason) {
      logEvent({ type: 'seasonStart', season: session.season, year: session.year });
      session.announceSeason = false;
    }
    if (cameNight) this.enterNight(false);
    else {
      this.paintWorld();
      startFarmMusic();
    }
    if (session.awayNote) {
      this.awayText.setText(session.awayNote);
      this.awayText.setVisible(true);
      this.awayT = 5;
      session.awayNote = '';
    }
    this.refreshPackets();
    this.refreshHud(true);
  }

  drawFence() {
    const g = this.fenceG;
    g.clear();
    g.fillStyle(0xe7d2a8, 1);
    for (let i = 0; i < 4; i++) g.fillRoundedRect(210 + i * 22, 332, 12, 48, 3);
    g.fillRect(206, 344, 90, 8);
    g.lineStyle(4, 0x3a2a22, 1);
    g.strokeRect(206, 344, 90, 8);
    g.setVisible(session.fenceUp);
  }

  paintWorld() {
    const night = session.phase === 'night';
    const season = session.season || 'spring';
    const L = LOOK[season] || LOOK.spring;
    const key = season + (night ? ':n' : '');
    if (key !== this.lookKey) {
      this.lookKey = key;
      this.bg.clear();
      drawFarmBackdrop(this.bg, season);
    }
    this.cloudA.setVisible(!night);
    this.cloudB.setVisible(!night);
    if (night) {
      this.nightSky.clear();
      this.nightSky.fillStyle(LOOK.night.skyN, 1);
      this.nightSky.fillRect(0, 0, 720, 428);
      this.nightSky.fillStyle(0xfff6c8, 1);
      for (let i = 0; i < 18; i++) {
        this.nightSky.fillCircle(40 + ((i * 97) % 640), 30 + ((i * 53) % 360), i % 4 === 0 ? 2.4 : 1.4);
      }
      this.nightSky.setVisible(true);
      this.nightVeil.clear();
      this.nightVeil.fillStyle(0x1c2c4e, 0.22);
      this.nightVeil.fillRect(0, 428, 720, 608);
      this.nightVeil.setVisible(true);
      setBands(LOOK.night.sky, L.tray, true);
    } else {
      this.nightSky.clear();
      this.nightSky.setVisible(false);
      this.nightVeil.clear();
      this.nightVeil.setVisible(false);
      setBands(L.sky, L.tray, false);
    }
    if (this.fenceG) this.fenceG.setVisible(session.fenceUp && !night);
  }

  layoutField(keep) {
    const size = session.fieldSize === 4 || session.fieldSize === 5 || session.fieldSize === 6 ? session.fieldSize : 3;
    session.fieldSize = size;
    let prev = [];
    if (keep) {
      if (session.plots && session.plots !== this.plots && session.plots.length) prev = session.plots;
      else prev = this.plots || [];
    }
    const next = buildPlots(size);
    for (let j = 0; j < next.length; j++) {
      const dst = next[j];
      for (let i = 0; i < prev.length; i++) {
        const src = prev[i];
        if (src.row !== dst.row || src.col !== dst.col) continue;
        let crop = src.crop;
        if (typeof crop === 'string') crop = CROP_BY_ID[crop] || null;
        dst.crop = crop && crop.id ? crop : null;
        dst.age = src.age || 0;
        dst.golden = !!src.golden;
        dst.crow = !!src.crow;
        dst.crowT = src.crowT || 0;
        dst.weed = !!src.weed;
        growthOf(dst);
        break;
      }
    }
    if (this.views) {
      for (let i = 0; i < this.views.length; i++) {
        const v = this.views[i];
        v.soil.destroy();
        if (v.glow) v.glow.destroy();
        v.crop.destroy();
        v.spark.destroy();
        v.crow.destroy();
        v.weed.destroy();
      }
    }
    this.views = [];
    this.plots = next;
    session.plots = next;
    const texW = SOIL_LOGICAL * 2;
    for (let i = 0; i < next.length; i++) {
      const plot = next[i];
      const cx = plot.x + plot.w / 2;
      const cy = plot.y + plot.h / 2;
      const soil = this.add.image(cx, cy, 'soil').setScale(plot.w / texW).setDepth(4);
      const glow = this.add.image(cx, cy, 'goldglow').setScale((plot.w * 0.92) / 400).setDepth(5).setVisible(false);
      const crop = this.add.image(cx, cy - 6, 'crop_radish_1').setDepth(6).setVisible(false);
      const spark = this.add.image(cx, cy - 36, 'spark').setScale(plot.w / 200).setDepth(8).setVisible(false);
      const weed = this.add.image(cx, cy + 8, 'weed').setScale((plot.w * 0.55) / 180).setDepth(7).setVisible(false);
      const crow = this.add.image(cx, cy - plot.h * 0.12, 'crow').setScale((plot.w * 0.62) / 160).setDepth(9).setVisible(false);
      this.views.push({
        soil, glow, crop, spark, crow, weed, cx, cy, baseY: cy - plot.h * 0.08,
        phase: i * 0.65, key: '', ripe: false, baseScale: 0.4,
      });
      this.syncPlotView(plot);
    }
    this.builtSize = size;
  }

  syncPlotView(plot) {
    const view = this.views[plot.i];
    if (!view) return;
    view.weed.setVisible(!!plot.weed);
    view.crow.setVisible(!!plot.crow);
    view.crow.setPosition(view.cx, view.cy - plot.h * 0.18);
    if (view.glow) view.glow.setVisible(!!(plot.crop && plot.golden));
    if (!plot.crop) {
      view.crop.setVisible(false);
      view.spark.setVisible(false);
      view.key = '';
      view.ripe = false;
      return;
    }
    const stage = plot.stage >= 1 && plot.stage <= 3 ? plot.stage : 1;
    const key = plot.ripe ? 'crop_' + plot.crop.id + '_ripe' : 'crop_' + plot.crop.id + '_' + stage;
    if (view.key !== key) {
      view.key = key;
      view.crop.setTexture(key);
    }
    view.crop.setVisible(true);
    if (plot.golden) view.crop.setTint(0xffe38a);
    else view.crop.clearTint();
    view.ripe = !!plot.ripe;
    view.baseScale = ((plot.ripe ? 0.78 : 0.62) * plot.w) / 224;
    if (!plot.ripe) {
      view.crop.setScale(view.baseScale);
      view.crop.setPosition(view.cx, view.baseY);
      view.crop.setAngle(0);
      view.spark.setVisible(false);
    }
  }

  createPip() {
    this.pipImg = this.add.image(180, PIP_Y, 'pip').setScale(TEX_SCALE).setDepth(19);
    this.shadow = this.add.image(180, PIP_Y + 46, 'shadow').setScale(TEX_SCALE * 0.8).setDepth(18);
    this.zzz = this.add.text(180, PIP_Y - 70, 'z z z', {
      fontFamily: FONT, fontSize: '22px', color: '#6A5346', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(20).setVisible(false);
    this.pip = {
      x: 180, y: PIP_Y, tx: 180, ty: PIP_Y,
      idle: 0, nap: false, bounce: 0, flip: 0,
      glance: 0, blink: 0, blinkIn: 2.8, glanceIn: 5,
    };
    session.pip.x = 180;
    session.pip.y = PIP_Y;
    this.storePipBox(1, 1, 0);
  }

  storePipBox(sx, sy, hop) {
    const dw = 150 * TEX_SCALE * sx;
    const dh = 170 * TEX_SCALE * sy;
    const py = this.pip.y - hop;
    session.pipBox = { x: this.pip.x - dw / 2, y: py - dh / 2, w: dw, h: dh };
  }

  createHud() {
    const g = this.add.graphics().setDepth(30);
    g.fillStyle(0xfff8ea, 1);
    g.fillRoundedRect(8, 8, 170, 96, 22);
    g.lineStyle(6, 0x3a2a22, 1);
    g.strokeRoundedRect(12, 12, 162, 88, 18);
    g.fillStyle(0xfff8ea, 1);
    g.fillRoundedRect(186, 8, 150, 96, 22);
    g.lineStyle(6, 0x3a2a22, 1);
    g.strokeRoundedRect(190, 12, 142, 88, 18);
    g.fillStyle(0xfff8ea, 1);
    g.fillRoundedRect(344, 8, 210, 96, 22);
    g.lineStyle(6, 0x3a2a22, 1);
    g.strokeRoundedRect(348, 12, 202, 88, 18);
    this.add.image(40, 56, 'coin').setScale(TEX_SCALE).setDepth(31);
    this.add.image(214, 56, 'dust').setScale(TEX_SCALE).setDepth(31);
    this.coinText = this.add.text(108, 56, String(session.coins), {
      fontFamily: FONT, fontSize: '36px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.dustText = this.add.text(270, 56, String(session.dust), {
      fontFamily: FONT, fontSize: '32px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.seasonText = this.add.text(449, 36, seasonLabel(session.seasonIndex, session.year), {
      fontFamily: FONT, fontSize: '15px', color: '#3A2A22', fontStyle: 'bold', align: 'center',
      wordWrap: { width: 190 },
    }).setOrigin(0.5).setDepth(31);
    this.timerText = this.add.text(449, 74, '3:00', {
      fontFamily: FONT, fontSize: '28px', color: '#3A2A22', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(31);
    this.pauseBtn = addButton(this, this.uiButtons, {
      x: 562, y: 8, w: 150, h: 96, label: 'PAUSE', fontSize: 22, depth: 32,
      onTap: () => this.openPause(),
    });
  }

  createPackets() {
    const moonX = 720 - 8 - TUNING.moonW;
    const gridW = moonX - 8 - 8;
    const gap = TUNING.packetGap;
    const pw = Math.floor((gridW - 3 * gap) / 4);
    const ph = TUNING.packetH;
    const y0 = TUNING.trayY;
    this.packetGeom = { moonX, pw, ph, y0, gap };
    const make = (x, y) => {
      const g = this.add.graphics().setDepth(30);
      const name = this.add.text(x + pw / 2, y + 24, '', {
        fontFamily: FONT, fontSize: '15px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const price = this.add.text(x + pw / 2, y + 54, '', {
        fontFamily: FONT, fontSize: '20px', color: '#3A2A22', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const time = this.add.text(x + pw / 2, y + 80, '', {
        fontFamily: FONT, fontSize: '14px', color: '#6A5346', fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(31);
      const zone = this.add.zone(x + pw / 2, y + ph / 2, pw, ph).setDepth(32).setInteractive();
      const rec = {
        x, y, w: pw, h: ph, label: '', visible: true, crop: null,
        g, name, price, time, zone, onTap: null,
      };
      rec.onTap = () => {
        if (!rec.crop) return;
        session.selectedSeed = rec.crop.id;
        this.refreshPackets();
      };
      this.uiButtons.push(rec);
      return rec;
    };
    for (let i = 0; i < 8; i++) {
      const col = i % 4;
      const row = (i / 4) | 0;
      const x = 8 + col * (pw + gap);
      const y = y0 + row * (ph + gap);
      this.gridSlots.push(make(x, y));
    }
    this.freeBtn = make(moonX, y0 + ph + gap);
    this.freeBtn.w = TUNING.moonW;
    this.freeBtn.zone.setPosition(moonX + TUNING.moonW / 2, y0 + ph + gap + ph / 2);
    this.freeBtn.zone.setSize(TUNING.moonW, ph);
    this.moonBtn = make(moonX, y0);
    this.moonBtn.w = TUNING.moonW;
    this.moonBtn.label = 'MOON';
    this.moonBtn.zone.setPosition(moonX + TUNING.moonW / 2, y0 + ph / 2);
    this.moonBtn.zone.setSize(TUNING.moonW, ph);
    this.moonBtn.onTap = () => {
      session.trayMoon = !session.trayMoon;
      this.refreshPackets();
    };
  }

  showPacket(rec, on) {
    rec.visible = on;
    rec.g.setVisible(on);
    rec.name.setVisible(on);
    rec.price.setVisible(on);
    rec.time.setVisible(on);
    if (on) {
      rec.zone.setVisible(true);
      if (!rec.zone.input || !rec.zone.input.enabled) rec.zone.setInteractive();
    } else {
      rec.zone.disableInteractive();
      rec.zone.setVisible(false);
    }
  }

  paintPacket(rec, crop) {
    rec.crop = crop;
    rec.label = crop ? crop.name : '';
    if (!crop) { this.showPacket(rec, false); return; }
    this.showPacket(rec, true);
    const selected = session.selectedSeed === crop.id;
    const inv = session.inventory[crop.id] || 0;
    const afford = inv > 0 || (crop.dust > 0 ? session.dust >= crop.dust : session.coins >= crop.cost);
    rec.g.clear();
    const fill = !afford ? 0xe6e1da : selected ? 0xffe9a8 : 0xfff8ea;
    const lip = !afford ? 0xcfc6bb : selected ? 0xe0a020 : 0xe7b56a;
    drawPlate(rec.g, rec.x, rec.y, rec.w, rec.h, fill, lip, selected);
    const ink = afford ? '#3A2A22' : GENTLE;
    rec.name.setColor(ink);
    rec.name.setText(crop.name);
    rec.time.setColor(afford ? '#6A5346' : GENTLE);
    rec.time.setText(Math.max(1, Math.round(effectiveGrow(crop))) + 's');
    rec.price.setColor(ink);
    if (inv > 0) rec.price.setText('x' + inv);
    else if (!afford && crop.dust > 0) rec.price.setText('Need ' + (crop.dust - session.dust));
    else if (!afford) rec.price.setText('Need ' + (crop.cost - session.coins));
    else if (crop.dust > 0) rec.price.setText(crop.dust + ' dust');
    else rec.price.setText(crop.cost === 0 ? 'FREE' : String(crop.cost));
    rec.name.setPosition(rec.x + rec.w / 2, rec.y + 24);
    rec.price.setPosition(rec.x + rec.w / 2, rec.y + 54);
    rec.time.setPosition(rec.x + rec.w / 2, rec.y + 80);
  }

  refreshPackets() {
    const list = session.trayMoon ? moonCrops() : cropsForSeason(session.season);
    for (let i = 0; i < 8; i++) this.paintPacket(this.gridSlots[i], list[i] || null);
    const free = CROP_BY_ID[freeCropId(session.seasonIndex)];
    const inGrid = list.some((c) => c && free && c.id === free.id);
    if (free && !inGrid && !session.trayMoon) this.paintPacket(this.freeBtn, free);
    else this.paintPacket(this.freeBtn, null);
    const moonOn = !!session.trayMoon;
    this.moonBtn.crop = null;
    this.moonBtn.label = 'MOON';
    this.showPacket(this.moonBtn, true);
    this.moonBtn.name.setText('MOON');
    this.moonBtn.price.setText(moonOn ? 'seeds' : 'dust');
    this.moonBtn.time.setText('');
    this.moonBtn.name.setColor('#3A2A22');
    this.moonBtn.price.setColor('#6A5346');
    this.moonBtn.name.setPosition(this.moonBtn.x + this.moonBtn.w / 2, this.moonBtn.y + 36);
    this.moonBtn.price.setPosition(this.moonBtn.x + this.moonBtn.w / 2, this.moonBtn.y + 68);
    this.moonBtn.g.clear();
    drawPlate(this.moonBtn.g, this.moonBtn.x, this.moonBtn.y, this.moonBtn.w, this.moonBtn.h, moonOn ? 0xe4d8ff : 0xfff4d2, 0xc7b0ea, moonOn);
    this.packetKey = session.season + '|' + session.trayMoon + '|' + session.selectedSeed + '|' + session.coins + '|' + session.dust + '|' + invSig();
  }

  createBanners() {
    this.chainText = this.add.text(0, 0, '', {
      fontFamily: FONT, fontSize: '48px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0, 0.5).setDepth(28).setVisible(false);
    this.bannerText = this.add.text(360, 188, '', {
      fontFamily: FONT, fontSize: '52px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(45).setVisible(false);
    this.overText = this.add.text(360, 620, 'Season over!', {
      fontFamily: FONT, fontSize: '64px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 10, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(55).setVisible(false);
    this.awayText = this.add.text(360, 188, '', {
      fontFamily: FONT, fontSize: '22px', color: '#3A2A22', fontStyle: 'bold',
      align: 'center', wordWrap: { width: 520 },
    }).setOrigin(0.5).setDepth(46).setVisible(false);
  }

  createPause() {
    this.dim = this.add.graphics().setDepth(60).setVisible(false);
    this.dim.fillStyle(0x3a2a22, 0.5);
    this.dim.fillRect(0, 0, 720, 1280);
    this.sureText = this.add.text(360, 400, 'Are you sure?', {
      fontFamily: FONT, fontSize: '44px', color: '#FFF8E4',
      stroke: '#3A2A22', strokeThickness: 8, fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(62).setVisible(false);
    const addP = (x, y, w, h, label, fontSize, onTap) => {
      const rec = addButton(this, this.pauseButtons, { x, y, w, h, label, fontSize, depth: 63, onTap });
      setButtonVisible(rec, false);
      return rec;
    };
    this.resumeBtn = addP(100, 240, 520, 100, 'RESUME', 32, () => this.closePause());
    this.albumPause = addP(100, 352, 520, 100, 'ALBUM', 32, () => this.openAlbum());
    this.codePause = addP(100, 464, 520, 100, 'SAVE CODE', 28, () => this.openCode());
    this.soundBtn = addP(100, 576, 520, 100, 'SOUND ON', 28, () => this.toggleMute());
    this.quitBtn = addP(100, 688, 520, 100, 'QUIT TO TITLE', 26, () => this.askQuit());
    this.yesBtn = addP(60, 520, 280, 120, 'YES', 36, () => this.answerQuit(true));
    this.noBtn = addP(380, 520, 280, 120, 'NO', 36, () => this.answerQuit(false));
  }

  createSparkles() {
    for (let i = 0; i < 14; i++) {
      const img = this.add.image(0, 0, 'dust').setDepth(22).setVisible(false);
      this.sparkles.push({ img, x: 0, y: 0, vy: 30, alive: false, phase: i });
    }
  }

  sparkleBoxes() {
    const out = [];
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      if (!s.alive) continue;
      out.push({ x: s.x - 48, y: s.y - 48, w: 96, h: 96 });
    }
    return out;
  }

  floaterBoxes() {
    return floaterRects(this.fx);
  }

  enterNight(fresh) {
    session.phase = 'night';
    if (fresh) {
      session.nightTime = TUNING.moonNightSeconds;
      logEvent({ type: 'nightStart' });
      saveGame('night');
    }
    this.finishing = false;
    this.overText.setVisible(false);
    stopFarmMusic();
    this.paintWorld();
    this.spawnSparkles();
    this.refreshHud(true);
  }

  spawnSparkles() {
    let n = TUNING.sparkleCount;
    if (hasAnimal('frog')) n += TUNING.frogExtra;
    if (hasAnimal('owl')) n += TUNING.hootExtra;
    if (n > this.sparkles.length) n = this.sparkles.length;
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      s.alive = i < n;
      if (!s.alive) { s.img.setVisible(false); continue; }
      this.placeSparkle(s, true);
    }
  }

  placeSparkle(s, high) {
    const i = s.phase || 0;
    s.x = 70 + (i % 5) * 116 + session.rng.next() * 24;
    s.y = (high ? 150 : -40) + (i % 3) * 36 + session.rng.next() * 20;
    s.vy = 26 + session.rng.next() * 22;
    s.img.setVisible(true).setPosition(s.x, s.y).setScale(0.7);
  }

  endNight() {
    if (hasAnimal('owl')) this.addDust(TUNING.hootBonus, 'hoot');
    logEvent({ type: 'nightEnd' });
    for (let i = 0; i < this.sparkles.length; i++) {
      this.sparkles[i].alive = false;
      this.sparkles[i].img.setVisible(false);
    }
    saveGame('night');
    session.phase = 'stand';
    stopFarmMusic();
    this.scene.start('stand');
  }

  openAlbum() {
    this.scene.pause();
    this.scene.launch('album', { from: 'farm' });
  }

  openCode() {
    openCodePanel({
      onDone: (ok) => {
        if (!ok) return;
        if (session.phase === 'stand') this.scene.start('stand');
        else {
          this.layoutField(true);
          this.syncAnimals();
          this.refreshPackets();
          if (session.phase === 'night') this.enterNight(false);
          else this.paintWorld();
        }
      },
    });
  }

  applyQa(op) {
    if (op.op === 'plantAll') this.qaPlantAll(op.a);
    else if (op.op === 'ripenAll') this.qaRipenAll();
    else if (op.op === 'ripen') this.qaRipen(op.a);
    else if (op.op === 'endSeason') this.finishSeason(true);
    else if (op.op === 'field') this.layoutField(true);
    else if (op.op === 'plant') this.qaPlant(op.a, op.b);
    else if (op.op === 'crow') this.qaCrow(op.a);
    else if (op.op === 'weed') this.qaWeed(op.a);
    else if (op.op === 'night') this.enterNight(true);
    else if (op.op === 'animal') this.syncAnimals();
  }

  applySeason() {
    if (session.phase === 'night') this.enterNight(false);
    else {
      session.phase = 'farm';
      this.paintWorld();
    }
    this.refreshPackets();
    this.refreshHud(true);
    this.syncAnimals();
  }

  qaPlant(i, id) {
    const crop = CROP_BY_ID[id];
    const p = this.plots[i];
    if (!crop || !p) return;
    p.crop = crop;
    p.age = 0;
    p.stage = 1;
    p.ripe = false;
    p.golden = false;
    p.crow = false;
    p.crowT = 0;
    p.weed = false;
    p.swiped = false;
    this.syncPlotView(p);
    logEvent({ type: 'plant', crop: crop.id, i: p.i, cost: 0 });
  }

  qaPlantAll(id) {
    for (let i = 0; i < this.plots.length; i++) this.qaPlant(i, id);
  }

  qaRipen(i) {
    const p = this.plots[i];
    if (!p || !p.crop) return;
    p.age = effectiveGrow(p.crop);
    p.stage = 3;
    p.ripe = true;
    this.syncPlotView(p);
  }

  qaRipenAll() {
    for (let i = 0; i < this.plots.length; i++) this.qaRipen(i);
  }

  qaCrow(i) {
    const p = this.plots[i];
    if (!p) return;
    p.crow = true;
    p.crowT = 0;
    this.syncPlotView(p);
  }

  qaWeed(i) {
    const p = this.plots[i];
    if (!p) return;
    p.weed = true;
    this.syncPlotView(p);
  }

  refreshHud(force) {
    if (force || session.coins !== this.lastCoins) {
      this.lastCoins = session.coins;
      this.coinText.setText(String(session.coins));
      this.coinPop = 1.12;
    }
    if (force || session.dust !== this.lastDust) {
      this.lastDust = session.dust;
      this.dustText.setText(String(session.dust));
    }
    const night = session.phase === 'night';
    const label = night ? 'Moon Night' : seasonLabel(session.seasonIndex, session.year);
    const key = label + '|' + session.year;
    if (force || key !== this.hudKey) {
      this.hudKey = key;
      this.seasonText.setText(label);
    }
    const left = night ? session.nightTime : session.seasonTime;
    let shown = left <= 0 ? 0 : Math.ceil(left - 1e-6);
    if (session.noTimer && !night) shown = Math.ceil(TUNING.seasonSeconds);
    if (shown !== this.shownSec || force) {
      this.shownSec = shown;
      const m = (shown / 60) | 0;
      const s = shown % 60;
      this.timerText.setText(night ? ('0:' + (shown < 10 ? '0' : '') + shown) : (m + ':' + (s < 10 ? '0' : '') + s));
    }
  }

  plotAt(x, y) {
    const plots = this.plots;
    for (let i = plots.length - 1; i >= 0; i--) {
      if (pointInRect(x, y, plots[i])) return plots[i];
    }
    return null;
  }

  sparkleAt(x, y) {
    for (let i = this.sparkles.length - 1; i >= 0; i--) {
      const s = this.sparkles[i];
      if (!s.alive) continue;
      if (x >= s.x - 48 && x <= s.x + 48 && y >= s.y - 48 && y <= s.y + 48) return s;
    }
    return null;
  }

  animalAt(x, y) {
    const slots = yardSlots();
    for (let i = 0; i < session.animals.length && i < slots.length; i++) {
      if (pointInRect(x, y, slots[i])) return session.animals[i];
    }
    return null;
  }

  freeSlot() {
    for (let i = 0; i < this.slots.length; i++) if (!this.slots[i].active) return this.slots[i];
    return this.slots[0];
  }

  slotById(id) {
    for (let i = 0; i < this.slots.length; i++) {
      if (this.slots[i].active && this.slots[i].id === id) return this.slots[i];
    }
    return null;
  }

  onPointerDown(pointer) {
    if (this.finishing || isCodeOpen()) return;
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
        slot.sx = x; slot.sy = y; slot.lx = x; slot.ly = y; slot.moved = false;
      }
      return;
    }
    const button = hitButton(this.uiButtons, x, y);
    const slot = this.freeSlot();
    slot.active = true;
    slot.id = pointer.id;
    slot.sx = x; slot.sy = y; slot.lx = x; slot.ly = y;
    slot.moved = false;
    slot.count = 0;
    slot.coins = 0;
    slot.needShown = false;
    slot.run = [];
    slot.lastX = x;
    slot.lastY = y;
    slot.button = button;
    slot.animal = null;
    slot.spark = null;
    if (button) { slot.mode = 'ui'; return; }
    if (session.phase === 'night') {
      const sp = this.sparkleAt(x, y);
      if (sp) { slot.mode = 'spark'; slot.spark = sp; return; }
    }
    const animal = this.animalAt(x, y);
    if (animal) { slot.mode = 'animal'; slot.animal = animal; return; }
    const plot = this.plotAt(x, y);
    const planting = plot && !plot.crop && !plot.weed;
    slot.mode = planting ? 'plant' : 'harvest';
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
    if (!slot || slot.mode === 'ui' || slot.mode === 'spark' || slot.mode === 'animal' || this.paused || this.finishing) return;
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
    if (slot.mode === 'harvest' && slot.count > 0) this.showChain(slot, x, y);
  }

  onPointerUp(pointer) {
    const x = pointer.worldX;
    const y = pointer.worldY;
    const slot = this.slotById(pointer.id);
    if (!slot) return;
    if (slot.mode === 'ui') {
      const b = hitButton([slot.button], x, y);
      slot.active = false;
      if (b && b.onTap && !this.finishing) { playTap(); b.onTap(); }
      return;
    }
    if (slot.mode === 'spark') {
      slot.active = false;
      if (slot.spark && slot.spark.alive && this.sparkleAt(x, y) === slot.spark) this.collectSparkle(slot.spark);
      return;
    }
    if (slot.mode === 'animal') {
      slot.active = false;
      if (slot.animal && this.animalAt(x, y) === slot.animal) this.tapAnimal(slot.animal);
      return;
    }
    if (!slot.moved) {
      const plot = this.plotAt(slot.sx, slot.sy);
      if (plot && plot.crow) this.shooCrow(plot);
      else if (plot && slot.mode === 'harvest' && plot.weed && !plot.crop) this.clearWeed(plot);
      else if (plot && slot.mode === 'harvest' && plot.ripe && !plot.crow) {
        this.harvestPlot(plot, slot);
        if (slot.count > 0) this.showChain(slot, slot.sx, slot.sy);
      } else if (plot && slot.mode === 'plant' && !plot.crop) this.plantPlot(plot, slot);
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
      if (n >= hits.length) break;
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
      if (slot.mode === 'harvest') {
        if (plot.weed && !plot.crop) this.clearWeed(plot);
        else this.harvestPlot(plot, slot);
      } else if (!broke) {
        if (!this.plantPlot(plot, slot)) broke = true;
      }
    }
  }

  canPay(crop) {
    if ((session.inventory[crop.id] || 0) > 0) return true;
    if (crop.dust > 0) return session.dust >= crop.dust;
    return session.coins >= crop.cost;
  }

  plantPlot(plot, slot) {
    if (!plot || plot.crop) return true;
    if (plot.weed) return true;
    const crop = CROP_BY_ID[session.selectedSeed] || CROP_BY_ID[freeCropId(session.seasonIndex)];
    if (!crop) return false;
    if (!this.canPay(crop)) {
      if (slot && !slot.needShown) {
        slot.needShown = true;
        const msg = crop.dust > 0
          ? 'Need ' + (crop.dust - session.dust)
          : 'Need ' + (crop.cost - session.coins);
        spawnFloat(this.fx, plot.x + plot.w / 2, plot.y + 24, msg);
      }
      return false;
    }
    let coinCost = 0;
    if ((session.inventory[crop.id] || 0) > 0) {
      session.inventory[crop.id] -= 1;
    } else if (crop.dust > 0) {
      session.dust -= crop.dust;
    } else if (crop.cost > 0) {
      session.coins -= crop.cost;
      session.spent += crop.cost;
      coinCost = crop.cost;
    }
    plot.crop = crop;
    plot.age = 0;
    plot.stage = 1;
    plot.ripe = false;
    plot.golden = false;
    plot.swiped = false;
    plot.crow = false;
    this.syncPlotView(plot);
    logEvent({ type: 'plant', crop: crop.id, i: plot.i, cost: coinCost });
    markDirty();
    playPlant();
    return true;
  }

  harvestPlot(plot, slot) {
    if (!plot || !plot.ripe || !plot.crop || plot.swiped || plot.crow) return;
    if (plot.golden) {
      this.payGolden(plot, slot);
      return;
    }
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
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    slot.lastX = cx;
    slot.lastY = cy;
    logEvent({ type: 'harvest', crop: crop.id, chainIndex: index, i: plot.i, coins });
    unlockAlbum('crop', crop.id);
    playPop(index);
    spawnPop(this.fx, cx, cy - 8, 'crop_' + crop.id + '_ripe');
    const ang = (index * 0.9) + 0.4;
    spawnSpark(this.fx, cx, cy - 10, Math.cos(ang) * 90, -80 - (index % 3) * 20);
    spawnCoin(this.fx, cx, cy, index * 0.03);
    if (slot.count >= TUNING.bumperAt && slot.count % 2 === 0) spawnCoin(this.fx, cx, 160, 0.08);
    plot.crop = null;
    plot.age = 0;
    plot.stage = 0;
    plot.ripe = false;
    plot.golden = false;
    plot.weed = false;
    this.syncPlotView(plot);
    this.pip.bounce = 0.28;
    this.pip.idle = 0;
    this.pip.nap = false;
    slot.run.push({ plot, cropId: crop.id, crop, coins });
    this.tryMerge(slot);
    markDirty();
  }

  payGolden(plot, slot) {
    plot.swiped = true;
    const crop = plot.crop;
    const index = slot.count;
    const coins = goldenCoins(crop, index, session.upgrades);
    slot.count = index + 1;
    slot.coins += coins;
    session.coins += coins;
    session.earned += coins;
    session.harvested += 1;
    session.chain = slot.count;
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    slot.lastX = cx;
    slot.lastY = cy;
    logEvent({ type: 'harvest', crop: crop.id, chainIndex: index, i: plot.i, coins, golden: true });
    unlockAlbum('crop', crop.id);
    unlockAlbum('golden', crop.id);
    this.addDust(1, 'golden');
    playPop(index);
    playShing();
    spawnPop(this.fx, cx, cy - 8, 'crop_' + crop.id + '_ripe');
    spawnSpark(this.fx, cx, cy - 20, 40, -120);
    spawnCoin(this.fx, cx, cy, 0.02);
    plot.crop = null;
    plot.age = 0;
    plot.stage = 0;
    plot.ripe = false;
    plot.golden = false;
    plot.weed = false;
    this.syncPlotView(plot);
    slot.run = [];
    this.pip.bounce = 0.28;
    this.pip.idle = 0;
    this.pip.nap = false;
    markDirty();
  }

  tryMerge(slot) {
    const run = slot.run;
    if (run.length < 3) return;
    const a = run[run.length - 3];
    const b = run[run.length - 2];
    const c = run[run.length - 1];
    if (a.cropId !== b.cropId || b.cropId !== c.cropId) return;
    if (!adjacent(a.plot, b.plot) || !adjacent(b.plot, c.plot)) return;
    const refund = a.coins + b.coins + c.coins;
    session.coins -= refund;
    session.earned -= refund;
    slot.coins -= refund;
    const plot = c.plot;
    plot.crop = c.crop;
    plot.golden = true;
    plot.ripe = true;
    plot.stage = 3;
    plot.age = effectiveGrow(c.crop);
    plot.swiped = true;
    plot.crow = false;
    plot.weed = false;
    this.syncPlotView(plot);
    session.goldens += 1;
    slot.golds = (slot.golds || 0) + 1;
    unlockAlbum('golden', c.cropId);
    logEvent({ type: 'golden', crop: c.cropId, i: plot.i });
    playShing();
    const cx = plot.x + plot.w / 2;
    const cy = plot.y + plot.h / 2;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      spawnSpark(this.fx, cx, cy, Math.cos(ang) * 140, Math.sin(ang) * 140 - 40);
    }
    this.bannerKind = this.bannerKind || 'shing';
    run.length = 0;
  }

  showChain(slot, x, y) {
    const golds = slot.golds || 0;
    const label = 'x' + slot.count + (slot.coins > 0 || !golds ? '  +' + slot.coins : '') + (golds ? '  ' + golds + ' GOLD' : '');
    this.chainText.setText(label);
    let tx = x + 28;
    const tw = this.chainText.width || label.length * 22;
    if (tx + tw > 700) tx = x - 28 - tw;
    const ty = y - 36;
    this.chainText.setPosition(tx, ty);
    this.chainText.setVisible(true);
    this.fx.block = { x: tx, y: ty - 28, w: tw, h: 56 };
  }

  endChain(slot) {
    const count = slot.count;
    this.chainText.setVisible(false);
    this.fx.block = null;
    if (count <= 0) { session.chain = 0; return; }
    const mega = count >= TUNING.megaAt;
    const bumper = count >= TUNING.bumperAt;
    const bonus = chainBonusCoins(slot.coins, count);
    if (bonus > 0) {
      session.coins += bonus;
      session.earned += bonus;
    }
    const total = slot.coins + bonus;
    if (total > 0) spawnFloat(this.fx, slot.lastX, slot.lastY - 16, '+' + total);
    else if (slot.golds) spawnFloat(this.fx, slot.lastX, slot.lastY - 16, slot.golds + ' GOLD');
    if (mega) {
      session.megas += 1;
      session.bumpers += 1;
      this.megaJuice();
    } else if (bumper) {
      session.bumpers += 1;
      this.bumperJuice();
    } else if (this.bannerKind === 'shing') {
      this.showBanner('SHING', 64, 1.1);
    }
    this.bannerKind = '';
    session.lastChain = count;
    if (count > session.bestChain) session.bestChain = count;
    session.chain = 0;
    logEvent({
      type: 'chainEnd',
      count,
      coins: total,
      bumper: bumper && !mega,
      mega,
      golds: slot.golds || 0,
    });
    slot.count = 0;
    slot.coins = 0;
    slot.golds = 0;
    slot.run = [];
  }

  showBanner(text, size, dur) {
    this.bannerText.setText(text);
    this.bannerText.setFontSize(size);
    this.bannerText.setVisible(true);
    this.bannerText.setAlpha(1);
    this.bannerText.setPosition(360, 188);
    this.bannerT = dur;
  }

  bumperJuice() {
    playBumper();
    this.impressed = Math.max(this.impressed, 1.7);
    this.showBanner('Bumper!', 52, 1.25);
    for (let i = 0; i < 6; i++) spawnCoin(this.fx, 120 + i * 80, 150, i * 0.04);
  }

  megaJuice() {
    playMega();
    this.impressed = Math.max(this.impressed, 2.6);
    this.showBanner('MEGA BUMPER!', 42, 1.7);
    this.pip.flip = 0.62;
    this.cameras.main.shake(150, 0.0035);
    spawnConfetti(this.fx, 360, 220, 42, session.rng);
    for (let i = 0; i < 10; i++) spawnCoin(this.fx, 70 + i * 58, 150, i * 0.035);
  }

  shooCrow(plot) {
    if (!plot || !plot.crow) return;
    plot.crow = false;
    plot.crowT = 0;
    session.coins += 1;
    session.earned += 1;
    session.crowsShooed += 1;
    logEvent({ type: 'crowShoo', i: plot.i });
    playCaw();
    spawnFloat(this.fx, plot.x + plot.w / 2, plot.y + 20, '+1');
    this.syncPlotView(plot);
    markDirty();
  }

  clearWeed(plot) {
    if (!plot || !plot.weed) return;
    plot.weed = false;
    session.coins += 1;
    session.earned += 1;
    logEvent({ type: 'weedClear', i: plot.i });
    playSwish();
    spawnFloat(this.fx, plot.x + plot.w / 2, plot.y + 20, '+1');
    this.syncPlotView(plot);
    markDirty();
  }

  addDust(n, src) {
    if (!n) return;
    session.dust += n;
    session.dustSeason += n;
    logEvent({ type: 'dust', n, src: src || '' });
    playDust();
    markDirty();
  }

  collectSparkle(s) {
    if (!s || !s.alive) return;
    s.alive = false;
    s.img.setVisible(false);
    this.addDust(1, 'night');
  }

  tapAnimal(animal) {
    if (!animal) return;
    if (animal.good || animal.pile) this.collectGood(animal);
    else {
      playAnimal(animal.id);
      this.bounceAnimal(animal.id);
    }
  }

  collectGood(animal) {
    const spec = ANIMAL_BY_ID[animal.id];
    let coins = 0;
    if (animal.pile) {
      coins = TUNING.mortgageCoins;
      session.mortgageDug += coins;
      animal.pile = false;
      animal.cool = TUNING.mortgageEvery;
    } else if (animal.good && spec) {
      coins = spec.good || 0;
      animal.good = false;
      animal.cool = TUNING.goodEvery;
    } else return;
    animal.readyFor = 0;
    session.coins += coins;
    session.earned += coins;
    session.goods += 1;
    logEvent({ type: 'good', animal: animal.id, coins });
    playGood();
    const slots = yardSlots();
    const idx = session.animals.indexOf(animal);
    const box = slots[idx];
    if (box) spawnFloat(this.fx, box.x + box.w / 2, box.y + 28, '+' + coins);
    this.bounceAnimal(animal.id);
    markDirty();
  }

  bounceAnimal(id) {
    for (let i = 0; i < this.animalViews.length; i++) {
      if (this.animalViews[i].id === id) this.animalViews[i].bounce = 0.28;
    }
  }

  syncAnimals() {
    const sig = session.animals.map((a) => a.id).join(',');
    if (sig === this.animalSig) return;
    for (let i = 0; i < this.animalViews.length; i++) {
      this.animalViews[i].img.destroy();
      this.animalViews[i].bubble.destroy();
    }
    this.animalViews = [];
    const slots = yardSlots();
    for (let i = 0; i < session.animals.length && i < slots.length; i++) {
      const a = session.animals[i];
      const s = slots[i];
      const img = this.add.image(s.x + s.w / 2, s.y + s.h / 2 + 8, 'an_' + a.id).setScale(0.5).setDepth(18);
      const bubble = this.add.image(s.x + s.w / 2, s.y + 22, 'coin').setScale(0.45).setDepth(19).setVisible(false);
      this.animalViews.push({ id: a.id, img, bubble, slot: s, bounce: 0, baseY: s.y + s.h / 2 + 8 });
    }
    this.animalSig = sig;
  }

  notePointer(x) {
    if (!this.pip) return;
    let tx = x;
    if (tx < 48) tx = 48;
    if (tx > 672) tx = 672;
    this.pip.tx = tx;
    this.pip.ty = PIP_Y;
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
      if (this.trailDrawn) { this.trailG.clear(); this.trailDrawn = false; }
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
    const stroke = (width, color, alpha) => {
      g.lineStyle(width, color, alpha);
      g.beginPath();
      let started = false;
      for (let n = 0; n < this.trailCount; n++) {
        const i = (this.trailHead - this.trailCount + n + 40) % 40;
        if (this.trailA[i] >= 0.26) { started = false; continue; }
        if (!started) { g.moveTo(this.trailX[i], this.trailY[i]); started = true; }
        else g.lineTo(this.trailX[i], this.trailY[i]);
      }
      g.strokePath();
    };
    stroke(16, 0x3a2a22, 0.35);
    stroke(8, 0xfff6d0, 0.9);
  }

  updateGrowth(gdt) {
    if (session.phase !== 'farm') return;
    const soil = TUNING.luckyChance[session.upgrades.soil || 0] || 0;
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (!p.crop || p.crow || p.ripe) continue;
      p.age += gdt;
      const wasRipe = p.ripe;
      const wasStage = p.stage;
      const wasGold = p.golden;
      growthOf(p);
      if (!wasRipe && p.ripe && !p.golden && soil > 0 && session.rng.next() < soil) {
        p.golden = true;
        session.goldens += 1;
        unlockAlbum('golden', p.crop.id);
        logEvent({ type: 'golden', crop: p.crop.id, i: p.i });
        playShing();
      }
      if (wasRipe !== p.ripe || wasStage !== p.stage || wasGold !== p.golden) this.syncPlotView(p);
    }
  }

  updatePests(gdt) {
    if (gdt <= 0) return;
    const cat = hasAnimal('cat');
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (!p.crow) continue;
      p.crowT += gdt;
      if (cat && p.crowT >= TUNING.whiskersSeconds) this.shooCrow(p);
    }
    if (session.phase !== 'farm') return;
    // Stage 1 scripts ripen a radish in a few seconds. Hold new pests until
    // the farm has been running long enough that those checks stay clean.
    if (this.gameTime < 25) return;
    let crows = 0;
    let weeds = 0;
    for (let i = 0; i < this.plots.length; i++) {
      if (this.plots[i].crow) crows++;
      if (this.plots[i].weed) weeds++;
    }
    const mul = TUNING.scarecrowMul[session.upgrades.scarecrow || 0] || 1;
    if (crows < TUNING.maxCrows && session.rng.next() < TUNING.crowPerSecond * mul * gdt) {
      const options = [];
      for (let i = 0; i < this.plots.length; i++) {
        const p = this.plots[i];
        if (p.crop && !p.crow) options.push(p);
      }
      if (options.length) {
        const p = options[(session.rng.next() * options.length) | 0];
        p.crow = true;
        p.crowT = 0;
        this.syncPlotView(p);
      }
    }
    if (weeds < TUNING.maxWeeds && session.rng.next() < TUNING.weedPerSecond * gdt) {
      const options = [];
      for (let i = 0; i < this.plots.length; i++) {
        const p = this.plots[i];
        if (!p.crop && !p.weed) options.push(p);
      }
      if (options.length) {
        const p = options[(session.rng.next() * options.length) | 0];
        p.weed = true;
        this.syncPlotView(p);
      }
    }
  }

  updateAnimals(gdt) {
    this.syncAnimals();
    if (gdt > 0) {
      let delay = TUNING.magnetDelay[session.upgrades.magnet || 0];
      if (delay == null) delay = 999;
      if (hasAnimal('dog')) delay = Math.min(delay, TUNING.wafflesSeconds);
      for (let i = 0; i < session.animals.length; i++) {
        const a = session.animals[i];
        const spec = ANIMAL_BY_ID[a.id];
        if (a.id === 'goat') {
          if (a.fenceCool == null) a.fenceCool = TUNING.fenceEvery;
          a.fenceCool -= gdt;
          if (a.fenceCool <= 0) {
            session.fenceUp = false;
            session.fenceT = TUNING.fenceGoneSeconds;
            a.fenceCool = TUNING.fenceEvery;
            if (this.fenceG) this.fenceG.setVisible(false);
          }
        }
        const producer = spec && spec.good > 0;
        if (a.good || a.pile) {
          a.readyFor = (a.readyFor || 0) + gdt;
          if (a.readyFor >= delay) this.collectGood(a);
        } else if (producer || a.id === 'pig' || a.id === 'hedgehog') {
          a.cool = (a.cool || 0) - gdt;
          if (a.cool <= 0) {
            if (producer) { a.good = true; a.readyFor = 0; a.cool = TUNING.goodEvery; }
            else if (a.id === 'pig') { a.pile = true; a.readyFor = 0; a.cool = TUNING.mortgageEvery; }
            else if (a.id === 'hedgehog') {
              const id = priceySeed();
              session.inventory[id] = (session.inventory[id] || 0) + 1;
              a.cool = TUNING.beanEvery;
              this.packetKey = '';
            }
          }
        }
      }
      if (!session.fenceUp) {
        session.fenceT -= gdt;
        if (session.fenceT <= 0) {
          session.fenceUp = true;
          if (this.fenceG && session.phase !== 'night') this.fenceG.setVisible(true);
        }
      }
    }
    const t = this.gameTime;
    for (let i = 0; i < this.animalViews.length; i++) {
      const v = this.animalViews[i];
      const a = session.animals[i];
      let hop = Math.sin(t * 3 + i) * 2;
      let sc = 0.5;
      if (v.bounce > 0) {
        v.bounce -= gdt > 0 ? gdt : 0.016;
        const u = Math.max(0, v.bounce) / 0.28;
        hop += Math.sin((1 - u) * Math.PI) * 14;
        sc = 0.5 * (1 + Math.sin((1 - u) * Math.PI) * 0.12);
      }
      v.img.setPosition(v.slot.x + v.slot.w / 2, v.baseY - hop);
      v.img.setScale(sc);
      const ready = a && (a.good || a.pile);
      v.bubble.setVisible(!!ready);
      if (ready) {
        v.bubble.setTexture(a.pile ? 'coin' : 'coin');
        v.bubble.setPosition(v.slot.x + v.slot.w / 2, v.slot.y + 20);
      }
    }
  }

  updateSparkles(gdt) {
    if (session.phase !== 'night') return;
    for (let i = 0; i < this.sparkles.length; i++) {
      const s = this.sparkles[i];
      if (!s.alive) continue;
      s.y += s.vy * (gdt > 0 ? gdt : 0);
      s.x += Math.sin(this.gameTime * 2 + s.phase) * 8 * (gdt > 0 ? gdt : 0);
      if (s.y > 1120) this.placeSparkle(s, false);
      s.img.setPosition(s.x, s.y);
    }
  }

  updateCrops(time) {
    const t = time * 0.001;
    for (let i = 0; i < this.views.length; i++) {
      const view = this.views[i];
      if (!view.crop.visible) continue;
      if (view.ripe) {
        const s = Math.sin(t * 6 + view.phase);
        view.crop.setPosition(view.cx, view.baseY + s * 5);
        view.crop.setScale(view.baseScale * (1.04 + s * 0.03));
        view.spark.setVisible(true);
        view.spark.setPosition(view.cx + Math.cos(t * 3 + view.phase) * 28, view.baseY - 32);
        view.spark.setAlpha(0.35 + 0.65 * Math.abs(Math.sin(t * 5 + view.phase)));
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
      const u = Math.max(0, pip.bounce) / 0.28;
      const w = Math.sin((1 - u) * Math.PI);
      sx = 1 + w * 0.12;
      sy = 1 - w * 0.16;
    }
    let rot = 0;
    let hop = 0;
    if (pip.flip > 0) {
      const u = 1 - pip.flip / 0.62;
      rot = Math.max(0, u) * Math.PI * 2;
      hop = Math.sin(Math.min(1, Math.max(0, u)) * Math.PI) * 36;
      pip.flip -= dt;
      if (pip.flip <= 0) rot = 0;
    }
    let key = 'pip';
    if (pip.nap) key = 'pip_nap';
    else if (pip.glance > 0) key = 'pip_look';
    else if (pip.blink > 0) key = 'pip_blink';
    if (this.pipImg.texture.key !== key) this.pipImg.setTexture(key);
    this.pipImg.setScale(TEX_SCALE * sx, TEX_SCALE * sy);
    this.pipImg.setRotation(rot);
    this.pipImg.setPosition(pip.x, pip.y - hop);
    this.shadow.setPosition(pip.x, pip.y + 46);
    this.shadow.setAlpha(pip.nap ? 0.16 : 0.28);
    this.zzz.setVisible(pip.nap);
    if (pip.nap) this.zzz.setPosition(pip.x + 36, pip.y - 64);
    if (!pip.nap && pip.flip <= 0) {
      pip.blinkIn -= dt;
      if (pip.blink > 0) pip.blink -= dt;
      else if (pip.blinkIn <= 0) { pip.blink = 0.12; pip.blinkIn = 2.4 + session.rng.next() * 2; }
      pip.glanceIn -= dt;
      if (pip.glance > 0) pip.glance -= dt;
      else if (pip.glanceIn <= 0) { pip.glance = 0.7; pip.glanceIn = 4.5 + session.rng.next() * 4; }
    }
    session.pip.x = pip.x;
    session.pip.y = pip.y;
    this.storePipBox(sx, sy, hop);
    void time;
  }

  updateMoon(dt, time) {
    const night = session.phase === 'night';
    const bob = Math.sin(time / 800) * 6;
    const x = night ? 360 : 560;
    const y = (night ? 250 : 200) + bob;
    const sc = night ? 0.55 : 0.32;
    this.moon.setPosition(x, y).setScale(sc);
    this.moonFace.setPosition(x, y).setScale(sc);
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
    setButtonVisible(this.albumPause, true);
    setButtonVisible(this.codePause, true);
    setButtonVisible(this.soundBtn, true);
    setButtonVisible(this.quitBtn, true);
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
    setButtonVisible(this.albumPause, false);
    setButtonVisible(this.codePause, false);
    setButtonVisible(this.soundBtn, false);
    setButtonVisible(this.quitBtn, false);
    setButtonVisible(this.yesBtn, false);
    setButtonVisible(this.noBtn, false);
  }

  askQuit() {
    this.confirming = true;
    setButtonVisible(this.resumeBtn, false);
    setButtonVisible(this.albumPause, false);
    setButtonVisible(this.codePause, false);
    setButtonVisible(this.soundBtn, false);
    setButtonVisible(this.quitBtn, false);
    setButtonVisible(this.yesBtn, true);
    setButtonVisible(this.noBtn, true);
    this.sureText.setVisible(true);
  }

  answerQuit(yes) {
    if (!yes) { this.openPause(); return; }
    this.paused = false;
    session.paused = false;
    saveGame('quit');
    stopFarmMusic();
    closeCodePanel();
    session.sceneKey = 'title';
    this.scene.start('title');
  }

  toggleMute() {
    session.mute = !session.mute;
    saveSettings();
    applyMute();
    this.soundBtn.label = session.mute ? 'MUTED' : 'SOUND ON';
    this.soundBtn.text.setText(this.soundBtn.label);
  }

  finishSeason(skipNight) {
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
      spent: session.spent,
      profit: session.earned - session.spent,
      harvested: session.harvested,
      bestChain: session.bestChain,
      bumpers: session.bumpers,
      megas: session.megas,
      goldens: session.goldens,
      dust: session.dustSeason,
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
    if (skipNight) {
      session.phase = 'stand';
      session.nightTime = 0;
      saveGame('season');
      this.time.delayedCall(350, () => this.scene.start('stand'));
      return;
    }
    this.overText.setVisible(true);
    saveGame('season');
    this.time.delayedCall(800, () => {
      if (!this.scene.isActive()) return;
      this.overText.setVisible(false);
      this.finishing = false;
      this.enterNight(true);
    });
  }

  onKey(event) {
    if (event.repeat) return;
    if (isCodeOpen()) {
      if (event.key === 'Escape') closeCodePanel();
      return;
    }
    if (!this.scene.isActive() || this.scene.isActive('album')) return;
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
    if (k >= '1' && k <= '8') {
      const idx = k.charCodeAt(0) - 49;
      const rec = this.gridSlots[idx];
      if (rec && rec.visible && rec.crop) {
        session.selectedSeed = rec.crop.id;
        this.refreshPackets();
      }
    }
  }

  botAt(x, y) {
    const p = this.botPtr;
    p.x = x; p.y = y; p.worldX = x; p.worldY = y;
    return p;
  }

  botTap(rec) {
    const x = rec.x + rec.w / 2;
    const y = rec.y + rec.h / 2;
    this.onPointerDown(this.botAt(x, y));
    this.onPointerUp(this.botAt(x, y));
  }

  findPacket(id) {
    for (let i = 0; i < this.gridSlots.length; i++) {
      const rec = this.gridSlots[i];
      if (rec.visible && rec.crop && rec.crop.id === id) return rec;
    }
    if (this.freeBtn.visible && this.freeBtn.crop && this.freeBtn.crop.id === id) return this.freeBtn;
    return null;
  }

  botUpdate(gdt) {
    if (!session.bot || this.paused || this.finishing || isCodeOpen()) return;
    if (session.phase === 'night') {
      if (this.botCooldown > 0) { this.botCooldown -= gdt; return; }
      for (let i = 0; i < this.sparkles.length; i++) {
        const s = this.sparkles[i];
        if (!s.alive) continue;
        this.onPointerDown(this.botAt(s.x, s.y));
        this.onPointerUp(this.botAt(s.x, s.y));
        this.botCooldown = 0.2;
        return;
      }
      return;
    }
    if (this.botBreath > 0) { this.botBreath -= gdt; this.botStroll(); return; }
    if (this.botCooldown > 0) { this.botCooldown -= gdt; return; }
    for (let i = 0; i < this.plots.length; i++) {
      if (this.plots[i].crow) {
        const p = this.plots[i];
        this.botTap({ x: p.x, y: p.y, w: p.w, h: p.h });
        this.botCooldown = 0.25;
        return;
      }
    }
    for (let i = 0; i < session.animals.length; i++) {
      const a = session.animals[i];
      if (a.good || a.pile) {
        const s = yardSlots()[i];
        if (s) this.botTap(s);
        this.botCooldown = 0.25;
        return;
      }
    }
    let ripeN = 0;
    let growing = 0;
    let emptyN = 0;
    let weeds = 0;
    let oldest = 0;
    const ids = {};
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (p.weed && !p.crop) weeds++;
      if (p.ripe && !p.crow) {
        ripeN++;
        const waited = p.age - effectiveGrow(p.crop);
        if (waited > oldest) oldest = waited;
        ids[p.crop.id] = 1;
      } else if (p.crop && !p.crow) {
        growing++;
        ids[p.crop.id] = 1;
      } else if (!p.crop && !p.weed) emptyN++;
    }
    const uniform = Object.keys(ids).length <= 1;
    const timeLeft = session.noTimer ? 9999 : session.seasonTime;
    const want = Math.min(TUNING.bumperAt, this.plots.length);
    const waitUniform = uniform && ripeN > 0 && growing > 0 && timeLeft > 3;
    if (!waitUniform && (ripeN >= want || (ripeN > 0 && growing === 0) || (ripeN > 0 && oldest >= 1.2) || (ripeN > 0 && timeLeft < 3))) {
      this.botHarvest();
      this.botBreath = TUNING.botBreathSeconds;
      return;
    }
    if (weeds > 0 && ripeN === 0) {
      this.botHarvest();
      this.botBreath = 0.35;
      return;
    }
    if (emptyN > 0 && ripeN === 0) {
      if (this.botPlant()) this.botCooldown = 0.3;
      else this.botStroll();
      return;
    }
    this.botStroll();
  }

  waveGross(crop, n) {
    let sub = 0;
    for (let i = 0; i < n; i++) sub += harvestCoins(crop, i, session.upgrades);
    return sub + chainBonusCoins(sub, n);
  }

  botSeedId() {
    let emptyN = 0;
    let growingId = null;
    for (let i = 0; i < this.plots.length; i++) {
      const p = this.plots[i];
      if (!p.crop && !p.weed) emptyN++;
      else if (p.crop && !growingId) growingId = p.crop.id;
    }
    if (emptyN <= 0) return null;
    const timeLeft = session.noTimer ? 9999 : session.seasonTime;
    const free = CROP_BY_ID[freeCropId(session.seasonIndex)];
    if (growingId) {
      const g = CROP_BY_ID[growingId];
      if (g && this.canPay(g) && effectiveGrow(g) + 0.4 <= timeLeft) return g.id;
    }
    const list = cropsForSeason(session.season).slice();
    if (free && !list.some((c) => c.id === free.id)) list.unshift(free);
    let best = null;
    let bestPps = -1;
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      if (effectiveGrow(c) + 0.4 > timeLeft) continue;
      if (!this.canPay(c)) continue;
      const pps = profitPerSecond(c);
      if (pps > bestPps) { bestPps = pps; best = c; }
    }
    if (free && best) {
      let dream = null;
      let dreamPps = bestPps;
      const wave = this.waveGross(free, Math.max(1, emptyN));
      for (let i = 0; i < list.length; i++) {
        const c = list[i];
        const pps = profitPerSecond(c);
        if (pps < dreamPps + 0.02) continue;
        if (effectiveGrow(c) + effectiveGrow(free) + 1 > timeLeft) continue;
        if (session.coins + wave < c.cost) continue;
        if (!this.canPay(c)) { dream = c; dreamPps = pps; }
      }
      if (dream && !this.canPay(dream)) return free.id;
    }
    return best ? best.id : (free ? free.id : null);
  }

  botStroll() {
    const x = 120 + (Math.sin(this.gameTime * 0.7) * 0.5 + 0.5) * 480;
    this.onPointerMove(this.botAt(x, PIP_Y));
  }

  botSelect(id) {
    const crop = CROP_BY_ID[id];
    if (!crop) return false;
    const moon = crop.season === 'moon';
    if (moon !== !!session.trayMoon) {
      this.botTap(this.moonBtn);
      return false;
    }
    if (session.selectedSeed === id && this.findPacket(id)) return true;
    const rec = this.findPacket(id);
    if (!rec) return false;
    this.botTap(rec);
    return session.selectedSeed === id;
  }

  botPlant() {
    const id = this.botSeedId();
    if (!id) return false;
    if (!this.botSelect(id)) return true;
    const crop = CROP_BY_ID[session.selectedSeed];
    if (!crop) return false;
    const size = this.builtSize;
    let started = false;
    let stop = false;
    let lx = 0;
    let ly = 0;
    for (let row = 0; row < size && !stop; row++) {
      for (let c = 0; c < size; c++) {
        const col = row % 2 === 0 ? c : size - 1 - c;
        let plot = null;
        for (let i = 0; i < this.plots.length; i++) {
          if (this.plots[i].row === row && this.plots[i].col === col) plot = this.plots[i];
        }
        if (!plot || plot.crop || plot.weed) continue;
        if (!this.canPay(crop)) { stop = true; break; }
        const x = plot.x + plot.w / 2;
        const y = plot.y + plot.h / 2;
        if (!started) { this.onPointerDown(this.botAt(x, y)); started = true; }
        else this.onPointerMove(this.botAt(x, y));
        lx = x; ly = y;
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
    this.onPointerDown(this.botAt(startX, first.y));
    let lx = startX;
    let ly = first.y;
    for (let i = 0; i < centers.length; i++) {
      this.onPointerMove(this.botAt(centers[i].x, centers[i].y));
      lx = centers[i].x;
      ly = centers[i].y;
    }
    this.onPointerUp(this.botAt(lx, ly));
  }

  update(time, delta) {
    if (document.hidden || session.hidden) { this.skipDelta = true; return; }
    if (this.skipDelta) { this.skipDelta = false; return; }
    const realDt = Math.min(0.05, delta / 1000);
    const scaled = realDt * session.timeScale;
    const frozen = this.paused || this.finishing || session.modal || isCodeOpen();
    const gdt = frozen ? 0 : scaled;
    this.gameTime += gdt;
    if (!frozen && session.phase === 'farm' && !session.noTimer) {
      session.seasonTime -= scaled;
      if (session.seasonTime <= 0) {
        session.seasonTime = 0;
        this.finishSeason(false);
      }
    }
    if (!frozen && session.phase === 'night') {
      session.nightTime -= scaled;
      if (session.nightTime <= 0) {
        session.nightTime = 0;
        this.endNight();
        return;
      }
    }
    if (this.builtSize !== session.fieldSize) this.layoutField(true);
    this.updateGrowth(gdt);
    this.updatePests(gdt);
    this.updateAnimals(gdt);
    this.updateSparkles(gdt);
    this.updateCrops(time);
    this.updatePip(realDt, time);
    this.updateMoon(realDt, time);
    if (session.phase !== 'night') {
      this.cloudA.x += realDt * 8;
      if (this.cloudA.x > 820) this.cloudA.x = -120;
      this.cloudB.x -= realDt * 6;
      if (this.cloudB.x < -140) this.cloudB.x = 840;
    }
    updateFx(this.fx, realDt);
    session.particles = this.fx.live;
    if (this.fx.arrived !== this.heard) {
      this.heard = this.fx.arrived;
      this.coinPop = Math.max(this.coinPop, 1.18);
      playTing();
    }
    if (this.coinPop > 1) {
      this.coinPop += (1 - this.coinPop) * Math.min(1, realDt * 8);
      if (this.coinPop < 1.01) this.coinPop = 1;
      this.coinText.setScale(this.coinPop);
    }
    this.updateTrail(realDt);
    if (!this.chainText.visible) this.fx.block = null;
    if (this.bannerT > 0) {
      this.bannerT -= realDt;
      this.bannerText.setAlpha(Math.max(0, this.bannerT / 0.4));
      if (this.bannerT <= 0) this.bannerText.setVisible(false);
    }
    if (this.awayT > 0) {
      this.awayT -= realDt;
      if (this.awayT <= 0) this.awayText.setVisible(false);
    }
    this.refreshHud(false);
    const pkey = session.season + '|' + session.trayMoon + '|' + session.selectedSeed + '|' + session.coins + '|' + session.dust + '|' + invSig();
    if (pkey !== this.packetKey) this.refreshPackets();
    flushDirty();
    this.botUpdate(gdt);
  }

  onShutdown() {
    stopFarmMusic();
    if (isCodeOpen()) closeCodePanel();
    if (this.input.keyboard) this.input.keyboard.off('keydown', this.onKey, this);
  }

  listButtons() {
    if (this.paused) return listVisible(this.pauseButtons);
    if (this.finishing) return [];
    return listVisible(this.uiButtons);
  }
}
