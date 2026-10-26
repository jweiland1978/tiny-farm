import { TUNING, UP_IDS, SEASON_IDS } from './config.js?v=1';
import { session, resetForStart, logEvent } from './session.js?v=1';
import { buildPlots, yardSlots } from './geom.js?v=1';
import { tryBuy, UPGRADES, upgradeCost } from './data/shop.js?v=1';
import { CROPS, CROP_BY_ID, effectiveGrow, freeCropId } from './data/crops.js?v=1';
import { ANIMAL_BY_ID, SHOP_ANIMALS } from './data/animals.js?v=1';
import { unlockAlbum, albumSnapshot } from './album.js?v=1';
import { saveGame, hasSave as readHasSave, exportCode as readExportCode, importCode as readImportCode } from './save.js?v=1';
import { bandColors as readBandColors } from './bands.js?v=1';

function game() {
  return globalThis.__TFBM_GAME || null;
}

function currentScene() {
  const g = game();
  if (!g) return null;
  const list = g.scene.getScenes(true);
  if (!list || !list.length) return null;
  return list[list.length - 1];
}

function liveFarm() {
  if (session.pendingFarm) return null;
  const s = currentScene();
  if (s && s.sys && s.sys.isActive() && s.qaPlantAll) return s;
  return null;
}

function liveStand() {
  const s = currentScene();
  if (s && s.sys && s.sys.isActive() && s.refresh && s.scene && s.scene.key === 'stand') return s;
  return null;
}

function queueOr(op, run) {
  const farm = liveFarm();
  if (farm) run(farm);
  else session.qaQueue.push(op);
}

function progressOf(p) {
  if (!p || !p.crop) return 0;
  if (p.ripe) return 1;
  const crop = typeof p.crop === 'string' ? CROP_BY_ID[p.crop] : p.crop;
  if (!crop) return 0;
  const need = effectiveGrow(crop);
  if (!(need > 0)) return 0;
  let v = (p.age || 0) / need;
  if (v < 0) v = 0;
  if (v > 1) v = 1;
  return v;
}

function publicPlot(p) {
  return {
    i: p.i,
    row: p.row,
    col: p.col,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    crop: p.crop ? (p.crop.id || p.crop) : null,
    stage: p.stage,
    ripe: !!p.ripe,
    golden: !!p.golden,
    crow: !!p.crow,
    weed: !!p.weed,
    progress: progressOf(p),
  };
}

function copyInventory() {
  const out = {};
  const src = session.inventory || {};
  const keys = Object.keys(src);
  for (let i = 0; i < keys.length; i++) out[keys[i]] = src[keys[i]];
  return out;
}

function upgradeLevels() {
  const out = {};
  for (let i = 0; i < UP_IDS.length; i++) {
    const id = UP_IDS[i];
    out[id] = session.upgrades[id] || 0;
  }
  return out;
}

export function installQA() {
  const api = {
    seed(n) {
      session.rng.seed(n);
    },
    scene() {
      const s = currentScene();
      return s && s.scene ? s.scene.key : '';
    },
    state() {
      const plots = [];
      const src = session.plots || [];
      const crows = [];
      const weeds = [];
      for (let i = 0; i < src.length; i++) {
        const p = src[i];
        plots.push(publicPlot(p));
        if (p.crow) crows.push({ i: p.i, x: p.x, y: p.y, w: p.w, h: p.h });
        if (p.weed) weeds.push(p.i);
      }
      const farm = liveFarm();
      const slots = yardSlots();
      const animals = [];
      const owned = session.animals || [];
      for (let i = 0; i < owned.length; i++) {
        const a = owned[i];
        const slot = slots[i];
        if (!a || !slot) continue;
        animals.push({
          id: a.id,
          x: slot.x,
          y: slot.y,
          w: slot.w,
          h: slot.h,
          goodReady: !!(a.good || a.pile),
        });
      }
      const box = session.pipBox || { x: 0, y: 0, w: 0, h: 0 };
      return {
        scene: api.scene(),
        coins: session.coins,
        dust: session.dust,
        year: session.year,
        seasonIndex: session.seasonIndex,
        seasonTime: session.seasonTime,
        nightTime: session.nightTime,
        season: session.season,
        phase: session.phase,
        fieldSize: session.fieldSize,
        selectedSeed: session.selectedSeed,
        plots,
        crows,
        weeds,
        sparkles: farm && farm.sparkleBoxes ? farm.sparkleBoxes() : [],
        animals,
        goods: session.goods,
        goldens: session.goldens,
        floaters: farm && farm.floaterBoxes ? farm.floaterBoxes() : [],
        pipBox: { x: box.x, y: box.y, w: box.w, h: box.h },
        chain: session.chain,
        lastChain: session.lastChain,
        bestChain: session.bestChain,
        bumpers: session.bumpers,
        megas: session.megas,
        harvested: session.harvested,
        earned: session.earned,
        upgrades: upgradeLevels(),
        inventory: copyInventory(),
        mortgageDug: session.mortgageDug,
        crowsShooed: session.crowsShooed,
        paused: !!session.paused,
        pip: { x: session.pip.x, y: session.pip.y },
        particles: session.particles,
      };
    },
    start(opts) {
      const noTimer = !!(opts && opts.noTimer);
      resetForStart(noTimer);
      const g = game();
      if (!g) return;
      const stop = ['boot', 'title', 'stand', 'album'];
      for (let i = 0; i < stop.length; i++) {
        const key = stop[i];
        if (g.scene.isActive(key) || g.scene.isPaused(key) || g.scene.isSleeping(key)) g.scene.stop(key);
      }
      g.scene.start('farm');
    },
    plantAll(cropId) {
      queueOr({ op: 'plantAll', a: cropId }, (farm) => farm.qaPlantAll(cropId));
    },
    ripenAll() {
      queueOr({ op: 'ripenAll' }, (farm) => farm.qaRipenAll());
    },
    ripen(i) {
      queueOr({ op: 'ripen', a: i }, (farm) => farm.qaRipen(i));
    },
    plant(i, cropId) {
      queueOr({ op: 'plant', a: i, b: cropId }, (farm) => farm.qaPlant(i, cropId));
    },
    setCoins(n) {
      session.coins = n;
      const stand = liveStand();
      if (stand) stand.refresh();
    },
    setDust(n) {
      const v = Number(n);
      if (!isFinite(v)) return;
      session.dust = v < 0 ? 0 : v;
    },
    setYear(n) {
      const v = Number(n);
      if (!isFinite(v)) return;
      session.year = v < 1 ? 1 : v;
    },
    setSeason(i) {
      let n = i | 0;
      if (n < 0) n = 0;
      if (n > 3) n = 3;
      session.seasonIndex = n;
      session.season = SEASON_IDS[n];
      session.seasonTime = TUNING.seasonSeconds;
      session.nightTime = 0;
      session.phase = 'farm';
      session.trayMoon = false;
      session.selectedSeed = freeCropId(n);
      session.keepPlots = true;
      session.announceSeason = false;
      logEvent({ type: 'seasonStart', season: session.season, year: session.year });
      const farm = liveFarm();
      if (farm) farm.applySeason();
      else {
        const g = game();
        if (g) g.scene.start('farm');
      }
    },
    setFieldSize(n) {
      if (n !== 3 && n !== 4 && n !== 5 && n !== 6) return;
      session.fieldSize = n;
      const farm = liveFarm();
      if (farm) farm.layoutField(true);
      else if (session.pendingFarm) session.qaQueue.push({ op: 'field' });
    },
    timeScale(n) {
      let v = Number(n);
      if (!isFinite(v)) v = 1;
      if (v < 0) v = 0;
      if (v > 100) v = 100;
      session.timeScale = v;
    },
    endSeason() {
      queueOr({ op: 'endSeason' }, (farm) => farm.finishSeason(true));
    },
    startNight() {
      queueOr({ op: 'night' }, (farm) => farm.enterNight(true));
    },
    spawnCrow(i) {
      queueOr({ op: 'crow', a: i }, (farm) => farm.qaCrow(i));
    },
    spawnWeed(i) {
      queueOr({ op: 'weed', a: i }, (farm) => farm.qaWeed(i));
    },
    giveAnimal(id) {
      const spec = ANIMAL_BY_ID[id];
      if (!spec) return false;
      const owned = session.animals || [];
      for (let i = 0; i < owned.length; i++) {
        if (owned[i].id === id) return false;
      }
      session.animals.push({
        id,
        cool: TUNING.goodEvery,
        good: false,
        pile: false,
        readyFor: 0,
      });
      unlockAlbum('animal', id);
      const farm = liveFarm();
      if (farm) farm.syncAnimals();
      else session.qaQueue.push({ op: 'animal' });
      return true;
    },
    buy(itemId) {
      const ok = tryBuy(itemId);
      const farm = liveFarm();
      if (ok && itemId === 'plots' && farm) farm.layoutField(true);
      else if (ok && itemId === 'plots' && session.pendingFarm) session.qaQueue.push({ op: 'field' });
      const stand = liveStand();
      if (stand) stand.refresh();
      return ok;
    },
    plotCenter(i) {
      let plots = session.plots;
      const size = (session.fieldSize === 3 || session.fieldSize === 4 || session.fieldSize === 5 || session.fieldSize === 6)
        ? session.fieldSize : 3;
      if (!plots || !plots.length) plots = buildPlots(size);
      const p = plots[i];
      if (!p) return null;
      return { x: p.x + p.w / 2, y: p.y + p.h / 2 };
    },
    buttons() {
      const s = currentScene();
      if (!s || !s.listButtons) return [];
      return s.listButtons();
    },
    bot(on) {
      session.bot = !!on;
    },
    save() {
      return saveGame('qa');
    },
    hasSave() {
      return readHasSave();
    },
    exportCode() {
      return readExportCode();
    },
    importCode(code) {
      const ok = readImportCode(code);
      if (!ok) return false;
      const g = game();
      if (session.phase === 'stand') {
        if (g) g.scene.start('stand');
        return true;
      }
      const farm = liveFarm();
      if (farm) {
        farm.layoutField(true);
        farm.syncAnimals();
        farm.refreshPackets();
        if (session.phase === 'night') farm.enterNight(false);
        else farm.paintWorld();
      } else if (g) {
        g.scene.start('farm');
      }
      return true;
    },
    album() {
      return albumSnapshot();
    },
    prices() {
      const crops = [];
      for (let i = 0; i < CROPS.length; i++) {
        const c = CROPS[i];
        crops.push({
          id: c.id,
          season: c.season,
          cost: c.cost,
          dust: c.dust,
          sell: c.sell,
          grow: c.grow,
        });
      }
      const upgrades = {};
      for (let i = 0; i < UPGRADES.length; i++) {
        const id = UPGRADES[i].id;
        const costs = [];
        const max = UPGRADES[i].max;
        for (let lv = 0; lv < max; lv++) costs.push(upgradeCost(id, lv));
        upgrades[id] = costs;
      }
      const animals = [];
      for (let i = 0; i < SHOP_ANIMALS.length; i++) {
        animals.push({ id: SHOP_ANIMALS[i].id, cost: SHOP_ANIMALS[i].cost });
      }
      return { crops, upgrades, animals };
    },
    bandColors() {
      return readBandColors();
    },
  };
  Object.defineProperty(api, 'log', {
    get() { return session.log; },
  });
  window.FARM = api;
}
