import { TUNING } from './config.js?v=1';
import { makeRng } from './rng.js?v=1';

export const session = {
  coins: TUNING.startCoins,
  upgrades: { plots: 0, sprinkler: 0, stand: 0 },
  fieldSize: 3,
  selectedSeed: 'radish',
  season: 'spring',
  seasonTime: TUNING.seasonSeconds,
  noTimer: false,
  timeScale: 1,
  paused: false,
  hidden: false,
  mute: false,
  chain: 0,
  lastChain: 0,
  bestChain: 0,
  bumpers: 0,
  megas: 0,
  harvested: 0,
  earned: 0,
  spent: 0,
  plots: [],
  pip: { x: 180, y: 860 },
  particles: 0,
  bot: false,
  log: [],
  rng: makeRng(0x5eed),
  qaQueue: [],
  // True from FARM.start() until the new farm scene finishes create.
  // Helpers in that same turn queue instead of touching the old scene.
  pendingFarm: false,
};

export function logEvent(evt) {
  evt.t = performance.now();
  session.log.push(evt);
  if (session.log.length > 6000) {
    session.log.splice(0, session.log.length - 5000);
  }
}

export function resetSeason() {
  session.seasonTime = TUNING.seasonSeconds;
  session.noTimer = false;
  session.chain = 0;
  session.lastChain = 0;
  session.bestChain = 0;
  session.bumpers = 0;
  session.megas = 0;
  session.harvested = 0;
  session.earned = 0;
  session.spent = 0;
  session.paused = false;
  session.selectedSeed = 'radish';
  session.season = 'spring';
}

// Fresh season-1 wallet for the QA start() hook. Keeps bot and timeScale
// so either call order (flags then start, or start then flags) works.
export function resetForStart(noTimer) {
  session.coins = TUNING.startCoins;
  session.upgrades = { plots: 0, sprinkler: 0, stand: 0 };
  session.fieldSize = 3;
  session.plots = [];
  session.particles = 0;
  session.log.length = 0;
  session.qaQueue.length = 0;
  session.summary = null;
  session.pendingFarm = true;
  resetSeason();
  session.noTimer = !!noTimer;
}

export function resetRun() {
  session.coins = TUNING.startCoins;
  session.upgrades = { plots: 0, sprinkler: 0, stand: 0 };
  session.fieldSize = 3;
  session.timeScale = 1;
  session.bot = false;
  session.plots = [];
  session.particles = 0;
  session.log.length = 0;
  session.qaQueue.length = 0;
  session.pendingFarm = false;
  session.summary = null;
  resetSeason();
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
