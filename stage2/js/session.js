import { TUNING, UP_IDS } from './config.js?v=1';
import { makeRng } from './rng.js?v=1';

function blankUpgrades() {
  const u = {};
  for (let i = 0; i < UP_IDS.length; i++) u[UP_IDS[i]] = 0;
  return u;
}

function blankAlbum() {
  return { crops: {}, animals: {} };
}

export const session = {
  coins: TUNING.startCoins,
  dust: TUNING.startDust,
  year: 1,
  seasonIndex: 0,
  season: 'spring',
  seasonTime: TUNING.seasonSeconds,
  nightTime: 0,
  phase: 'title',
  sceneKey: 'title',
  upgrades: blankUpgrades(),
  fieldSize: 3,
  selectedSeed: 'radish',
  trayMoon: false,
  noTimer: false,
  timeScale: 1,
  paused: false,
  hidden: false,
  mute: false,
  modal: false,
  chain: 0,
  lastChain: 0,
  bestChain: 0,
  bumpers: 0,
  megas: 0,
  harvested: 0,
  earned: 0,
  spent: 0,
  goldens: 0,
  dustSeason: 0,
  goods: 0,
  mortgageDug: 0,
  crowsShooed: 0,
  inventory: {},
  animals: [],
  album: blankAlbum(),
  plots: [],
  pip: { x: 180, y: 860 },
  pipBox: { x: 0, y: 0, w: 0, h: 0 },
  particles: 0,
  bot: false,
  log: [],
  rng: makeRng(0x5eed),
  qaQueue: [],
  pendingFarm: false,
  keepPlots: false,
  announceSeason: false,
  wipeSave: false,
  awayNote: '',
  summary: null,
  dirty: false,
  saveAt: 0,
  savedAt: 0,
  fenceUp: true,
  fenceT: 0,
};

export function hasAnimal(id) {
  const list = session.animals;
  for (let i = 0; i < list.length; i++) {
    if (list[i].id === id) return true;
  }
  return false;
}

export function barnCap() {
  const lv = session.upgrades.barn || 0;
  return TUNING.barnCap[lv] || TUNING.barnCap[0];
}

export function logEvent(evt) {
  evt.t = performance.now();
  session.log.push(evt);
  if (session.log.length > 6000) {
    session.log.splice(0, session.log.length - 5000);
  }
}

export function resetSeasonStats() {
  session.chain = 0;
  session.lastChain = 0;
  session.bestChain = 0;
  session.bumpers = 0;
  session.megas = 0;
  session.harvested = 0;
  session.earned = 0;
  session.spent = 0;
  session.goldens = 0;
  session.dustSeason = 0;
}

// Used by the title PLAY path and by quitting back in stage 1. Keeps the wallet.
export function resetSeason() {
  session.seasonTime = TUNING.seasonSeconds;
  session.nightTime = 0;
  session.noTimer = false;
  session.paused = false;
  session.selectedSeed = 'radish';
  session.trayMoon = false;
  session.seasonIndex = 0;
  session.season = 'spring';
  session.phase = 'farm';
  resetSeasonStats();
}

export function resetForStart(noTimer) {
  session.coins = TUNING.startCoins;
  session.dust = TUNING.startDust;
  session.year = 1;
  session.upgrades = blankUpgrades();
  session.fieldSize = 3;
  session.plots = [];
  session.animals = [];
  session.inventory = {};
  session.particles = 0;
  session.log.length = 0;
  session.qaQueue.length = 0;
  session.summary = null;
  session.pendingFarm = true;
  session.keepPlots = false;
  session.goods = 0;
  session.mortgageDug = 0;
  session.crowsShooed = 0;
  session.awayNote = '';
  session.dirty = false;
  session.fenceUp = true;
  session.wipeSave = false;
  session.modal = false;
  session.announceSeason = true;
  resetSeason();
  session.noTimer = !!noTimer;
  session.phase = 'farm';
}

export function resetRun() {
  session.coins = TUNING.startCoins;
  session.dust = TUNING.startDust;
  session.year = 1;
  session.upgrades = blankUpgrades();
  session.fieldSize = 3;
  session.timeScale = 1;
  session.bot = false;
  session.plots = [];
  session.animals = [];
  session.inventory = {};
  session.particles = 0;
  session.log.length = 0;
  session.qaQueue.length = 0;
  session.pendingFarm = false;
  session.keepPlots = false;
  session.summary = null;
  session.goods = 0;
  session.mortgageDug = 0;
  session.crowsShooed = 0;
  session.awayNote = '';
  session.dirty = false;
  session.fenceUp = true;
  session.modal = false;
  session.announceSeason = true;
  session.wipeSave = true;
  resetSeason();
}

export function advanceSeason() {
  session.seasonIndex = (session.seasonIndex + 1) % 4;
  if (session.seasonIndex === 0) session.year += 1;
  const ids = ['spring', 'summer', 'fall', 'winter'];
  session.season = ids[session.seasonIndex];
  session.seasonTime = TUNING.seasonSeconds;
  session.nightTime = 0;
  session.phase = 'farm';
  session.paused = false;
  session.trayMoon = false;
  session.selectedSeed = session.seasonIndex === 3 ? 'frostradish' : 'radish';
  session.keepPlots = true;
  session.announceSeason = true;
  resetSeasonStats();
}

export function loadSettings() {
  try {
    const raw = localStorage.getItem('tfbm_v1_settings');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && typeof data.mute === 'boolean') session.mute = data.mute;
  } catch (err) {
    // Ignore a broken or blocked store. Never throw on boot.
  }
}

export function saveSettings() {
  try {
    localStorage.setItem('tfbm_v1_settings', JSON.stringify({ mute: session.mute }));
  } catch (err) {
    // Private mode and some embedded frames refuse storage.
  }
}
