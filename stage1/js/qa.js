import { session, resetForStart } from './session.js?v=1';
import { buildPlots } from './geom.js?v=1';
import { tryBuy } from './data/shop.js?v=1';

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

function publicPlot(p) {
  return {
    i: p.i,
    row: p.row,
    col: p.col,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    crop: p.crop ? p.crop.id : null,
    stage: p.stage,
    ripe: !!p.ripe,
  };
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
      for (let i = 0; i < src.length; i++) plots.push(publicPlot(src[i]));
      return {
        scene: api.scene(),
        coins: session.coins,
        seasonTime: session.seasonTime,
        season: session.season,
        fieldSize: session.fieldSize,
        selectedSeed: session.selectedSeed,
        plots,
        chain: session.chain,
        lastChain: session.lastChain,
        bestChain: session.bestChain,
        bumpers: session.bumpers,
        megas: session.megas,
        harvested: session.harvested,
        earned: session.earned,
        upgrades: {
          plots: session.upgrades.plots,
          sprinkler: session.upgrades.sprinkler,
          stand: session.upgrades.stand,
        },
        paused: !!session.paused,
        pip: { x: session.pip.x, y: session.pip.y },
        particles: session.particles,
      };
    },
    start(opts) {
      const noTimer = !!(opts && opts.noTimer);
      resetForStart(noTimer);
      const g = game();
      if (g) {
        const live = g.scene.getScenes(true);
        for (let i = 0; i < live.length; i++) {
          const k = live[i].sys.settings.key;
          if (k !== 'farm') g.scene.stop(k);
        }
        g.scene.start('farm');
      }
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
    setCoins(n) {
      session.coins = n;
      const stand = liveStand();
      if (stand) stand.refresh();
    },
    setFieldSize(n) {
      session.fieldSize = n === 4 ? 4 : 3;
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
      queueOr({ op: 'endSeason' }, (farm) => farm.finishSeason());
    },
    buy(itemId) {
      const ok = tryBuy(itemId);
      const farm = liveFarm();
      if (ok && itemId === 'plots' && farm) farm.layoutField(true);
      const stand = liveStand();
      if (stand) stand.refresh();
      return ok;
    },
    plotCenter(i) {
      let plots = session.plots;
      if (!plots || !plots.length) plots = buildPlots(session.fieldSize === 4 ? 4 : 3);
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
  };
  Object.defineProperty(api, 'log', {
    get() { return session.log; },
  });
  window.FARM = api;
}
