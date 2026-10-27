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

export function defaultBigText() {
  try {
    const coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const narrow = window.matchMedia && (window.matchMedia('(max-width: 820px)').matches || window.innerWidth <= 820);
    return !!(coarse && narrow);
  } catch (err) {
    return false;
  }
}

export function defaultSettings() {
  return {
    music: 70,
    sound: 100,
    tapHarvest: false,
    bigText: false,
    reduceMotion: false,
    noFlash: false,
    cbPalette: false,
    timer: true,
  };
}

export function blankEcon() {
  return { harvest: 0, golden: 0, chain: 0, goods: 0, float: 0, other: 0 };
}

function blankLife() {
  return {
    harvests: 0,
    bestChain: 0,
    bumpers: 0,
    megas: 0,
    sweeps: 0,
    goldens: 0,
    mortgage: 0,
    crows: 0,
    nightDust: 0,
    bestNight: 0,
    floats: 0,
    zenSeconds: 0,
  };
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
  fenceMoved: false,
  built: [],
  hats: [],
  hat: '',
  gifts: [],
  lastGiftDay: '',
  zen: false,
  ended: false,
  events: {},
  wishHave: {},
  yearTalk: 0,
  pendingGift: '',
  pendingEnding: false,
  pendingPartTalk: '',
  yearRepeatNote: false,
  marketSold: {},
  dialog: { open: false, speaker: '', text: '', shown: 0, done: false },
  startZen: false,
  settings: defaultSettings(),
  ach: {},
  life: blankLife(),
  econ: blankEcon(),
  seasonHistory: [],
  shake: false,
  textRev: 0,
  achQuiet: false,
  achCatchup: 0,
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
  // A full Moon Year run is chatty. Keep a long tail so early seasons survive.
  if (session.log.length > 100000) {
    session.log.splice(0, session.log.length - 80000);
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
  session.marketSold = {};
  session.econ = blankEcon();
}

export function addEcon(key, n) {
  if (!session.econ) session.econ = blankEcon();
  const v = Number(n);
  if (!isFinite(v) || v === 0) return;
  session.econ[key] = (session.econ[key] || 0) + v;
}

export function econSnapshot() {
  const e = session.econ || blankEcon();
  return {
    harvest: e.harvest || 0,
    golden: e.golden || 0,
    chain: e.chain || 0,
    goods: e.goods || 0,
    float: e.float || 0,
    other: e.other || 0,
  };
}

export function pushSeasonHistory() {
  if (!session.seasonHistory) session.seasonHistory = [];
  session.seasonHistory.push({
    year: session.year || 1,
    season: session.season || 'spring',
    earned: session.earned || 0,
    spent: session.spent || 0,
    golden: session.goldens || 0,
    goods: session.goods || 0,
  });
  if (session.seasonHistory.length > 200) {
    session.seasonHistory.splice(0, session.seasonHistory.length - 200);
  }
}

export function applyTimerPref() {
  if (session.zen) session.noTimer = true;
  else if (session.settings && session.settings.timer === false) session.noTimer = true;
}

function resetExtras() {
  session.ach = {};
  session.life = blankLife();
  session.econ = blankEcon();
  session.seasonHistory = [];
  session.shake = false;
  session.achCatchup = 0;
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
  session.built = [];
  session.hats = [];
  session.hat = '';
  session.gifts = [];
  session.lastGiftDay = '';
  session.zen = !!session.startZen;
  session.ended = false;
  session.events = {};
  session.wishHave = {};
  session.yearTalk = 0;
  session.pendingGift = '';
  session.pendingEnding = false;
  session.pendingPartTalk = '';
  session.yearRepeatNote = false;
  session.marketSold = {};
  session.fenceMoved = false;
  session.dialog = { open: false, speaker: '', text: '', shown: 0, done: false };
  session.startZen = false;
  resetExtras();
  resetSeason();
  session.noTimer = !!noTimer || !!session.zen;
  applyTimerPref();
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
  session.built = [];
  session.hats = [];
  session.hat = '';
  session.gifts = [];
  session.lastGiftDay = '';
  session.zen = !!session.startZen;
  session.ended = false;
  session.events = {};
  session.wishHave = {};
  session.yearTalk = 0;
  session.pendingGift = '';
  session.pendingEnding = false;
  session.pendingPartTalk = '';
  session.yearRepeatNote = false;
  session.marketSold = {};
  session.fenceMoved = false;
  session.dialog = { open: false, speaker: '', text: '', shown: 0, done: false };
  resetExtras();
  resetSeason();
  session.noTimer = !!session.zen;
  applyTimerPref();
  session.startZen = false;
}

export function yearPartsReady(year) {
  const y = year || session.year || 1;
  const list = TUNING.rocket || [];
  const built = session.built || [];
  let need = 0;
  let have = 0;
  for (let i = 0; i < list.length; i++) {
    if (list[i].year !== y) continue;
    need += 1;
    if (built.indexOf(list[i].id) >= 0) have += 1;
  }
  return need === 0 || have >= need;
}

export function advanceSeason() {
  session.seasonIndex = (session.seasonIndex + 1) % 4;
  session.yearRepeatNote = false;
  if (session.seasonIndex === 0) {
    if (session.zen || session.ended || yearPartsReady(session.year)) {
      session.year += 1;
    } else {
      session.yearRepeatNote = true;
    }
  }
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
  if (session.zen) session.noTimer = true;
  applyTimerPref();
  resetSeasonStats();
}

function clampVol(n, fallback) {
  if (typeof n !== 'number' || !isFinite(n)) return fallback;
  if (n < 0) return 0;
  if (n > 100) return 100;
  return Math.round(n);
}

function readBool(v, fallback) {
  if (typeof v === 'boolean') return v;
  return fallback;
}

export function textScale() {
  return session.settings && session.settings.bigText ? 1.28 : 1;
}

export function settingsSnapshot() {
  const d = defaultSettings();
  const s = session.settings || d;
  return {
    music: clampVol(s.music, d.music),
    sound: clampVol(s.sound, d.sound),
    tapHarvest: !!s.tapHarvest,
    bigText: !!s.bigText,
    reduceMotion: !!s.reduceMotion,
    noFlash: !!s.noFlash,
    cbPalette: !!s.cbPalette,
    timer: s.timer !== false,
  };
}

export function loadSettings() {
  session.settings = defaultSettings();
  session.settings.bigText = defaultBigText();
  try {
    const raw = localStorage.getItem('tfbm_v1_settings');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;
    if (typeof data.mute === 'boolean') session.mute = data.mute;
    const d = session.settings;
    if ('music' in data) d.music = clampVol(data.music, d.music);
    if ('sound' in data) d.sound = clampVol(data.sound, d.sound);
    if ('tapHarvest' in data) d.tapHarvest = readBool(data.tapHarvest, false);
    if ('bigText' in data) d.bigText = readBool(data.bigText, d.bigText);
    if ('reduceMotion' in data) d.reduceMotion = readBool(data.reduceMotion, false);
    if ('noFlash' in data) d.noFlash = readBool(data.noFlash, false);
    if ('cbPalette' in data) d.cbPalette = readBool(data.cbPalette, false);
    if ('timer' in data) d.timer = readBool(data.timer, true);
  } catch (err) {
    // Ignore a broken or blocked store. Never throw on boot.
    session.settings = defaultSettings();
    session.settings.bigText = defaultBigText();
  }
}

export function saveSettings() {
  try {
    const s = settingsSnapshot();
    localStorage.setItem('tfbm_v1_settings', JSON.stringify({
      mute: !!session.mute,
      music: s.music,
      sound: s.sound,
      tapHarvest: s.tapHarvest,
      bigText: s.bigText,
      reduceMotion: s.reduceMotion,
      noFlash: s.noFlash,
      cbPalette: s.cbPalette,
      timer: s.timer,
    }));
  } catch (err) {
    // Private mode and some embedded frames refuse storage.
  }
}

export function setSetting(key, value) {
  if (!session.settings) session.settings = defaultSettings();
  const s = session.settings;
  if (key === 'music' || key === 'sound') {
    const n = Number(value);
    if (!isFinite(n)) return false;
    s[key] = clampVol(n, s[key]);
  } else if (key === 'tapHarvest' || key === 'bigText' || key === 'reduceMotion' || key === 'noFlash' || key === 'cbPalette') {
    s[key] = !!value;
    session.textRev = (session.textRev || 0) + 1;
  } else if (key === 'timer') {
    s.timer = !!value;
    if (!s.timer) session.noTimer = true;
    else if (!session.zen) session.noTimer = false;
  } else {
    return false;
  }
  saveSettings();
  logEvent({ type: 'setting', key, value: key === 'music' || key === 'sound' ? s[key] : settingsSnapshot()[key] });
  return true;
}
