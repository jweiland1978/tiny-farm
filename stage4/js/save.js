import { TUNING, UP_IDS, SEASON_IDS } from './config.js?v=1';
import { session, logEvent, resetRun, applyTimerPref } from './session.js?v=1';
import { CROP_BY_ID, effectiveGrow } from './data/crops.js?v=1';
import { ANIMAL_BY_ID } from './data/animals.js?v=1';
import { parseStorySave, applyStoryToSession, storySaveFields } from './story.js?v=1';
import { blankLife, reconcileLoaded, achMap, lifeSnapshot } from './achieve.js?v=1';

const SAVE_KEY = 'tfbm_v1_save';
const BAK_KEY = 'tfbm_v1_save_bak';

function finite(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

export function validSave(data) {
  if (!data || typeof data !== 'object') return false;
  if (data.version !== 1) return false;
  if (!finite(data.coins) || !finite(data.dust) || !finite(data.year)) return false;
  if (!finite(data.seasonIndex) || data.seasonIndex < 0 || data.seasonIndex > 3) return false;
  if (!finite(data.seasonTime) || !finite(data.savedAt)) return false;
  if (typeof data.phase !== 'string') return false;
  if (data.fieldSize !== 3 && data.fieldSize !== 4 && data.fieldSize !== 5 && data.fieldSize !== 6) return false;
  if (!Array.isArray(data.plots) || data.plots.length !== data.fieldSize * data.fieldSize) return false;
  if (!data.upgrades || typeof data.upgrades !== 'object') return false;
  for (let i = 0; i < UP_IDS.length; i++) {
    if (!finite(data.upgrades[UP_IDS[i]])) return false;
  }
  if (!Array.isArray(data.animals)) return false;
  if (!data.inventory || typeof data.inventory !== 'object') return false;
  if (!data.stats || typeof data.stats !== 'object') return false;
  const statKeys = ['harvested', 'bestChain', 'bumpers', 'megas', 'earned', 'spent', 'goldens', 'dustSeason', 'goods', 'mortgageDug', 'crowsShooed'];
  for (let i = 0; i < statKeys.length; i++) {
    if (!finite(data.stats[statKeys[i]])) return false;
  }
  for (let i = 0; i < data.plots.length; i++) {
    const p = data.plots[i];
    if (!p || typeof p !== 'object') return false;
    if (!finite(p.row) || !finite(p.col) || !finite(p.age)) return false;
    if (p.crop != null && typeof p.crop !== 'string') return false;
    if (typeof p.golden !== 'boolean' || typeof p.crow !== 'boolean' || typeof p.weed !== 'boolean') return false;
  }
  for (let i = 0; i < data.animals.length; i++) {
    const a = data.animals[i];
    if (!a || typeof a.id !== 'string' || !ANIMAL_BY_ID[a.id]) return false;
    if (!finite(a.cool) || typeof a.good !== 'boolean' || typeof a.pile !== 'boolean') return false;
  }
  const invKeys = Object.keys(data.inventory);
  for (let i = 0; i < invKeys.length; i++) {
    if (!finite(data.inventory[invKeys[i]])) return false;
  }
  if (!finite(data.nightTime)) return false;
  return true;
}

function plotSave(p) {
  return {
    row: p.row,
    col: p.col,
    crop: p.crop ? p.crop.id : null,
    age: p.age || 0,
    golden: !!p.golden,
    crow: !!p.crow,
    weed: !!p.weed,
  };
}

export function buildSave() {
  const plots = [];
  const src = session.plots || [];
  for (let i = 0; i < src.length; i++) plots.push(plotSave(src[i]));
  const animals = [];
  for (let i = 0; i < session.animals.length; i++) {
    const a = session.animals[i];
    animals.push({
      id: a.id,
      cool: a.cool || 0,
      good: !!a.good,
      pile: !!a.pile,
      readyFor: a.readyFor || 0,
    });
  }
  const inventory = {};
  const keys = Object.keys(session.inventory).sort();
  for (let i = 0; i < keys.length; i++) inventory[keys[i]] = session.inventory[keys[i]] | 0;
  return {
    version: 1,
    savedAt: session.savedAt || Date.now(),
    coins: session.coins,
    dust: session.dust,
    year: session.year,
    seasonIndex: session.seasonIndex,
    seasonTime: session.seasonTime,
    nightTime: session.nightTime || 0,
    phase: session.phase === 'night' || session.phase === 'stand' ? session.phase : 'farm',
    fieldSize: session.fieldSize,
    plots,
    upgrades: {
      plots: session.upgrades.plots || 0,
      sprinkler: session.upgrades.sprinkler || 0,
      soil: session.upgrades.soil || 0,
      scarecrow: session.upgrades.scarecrow || 0,
      magnet: session.upgrades.magnet || 0,
      stand: session.upgrades.stand || 0,
      barn: session.upgrades.barn || 0,
      basket: session.upgrades.basket || 0,
    },
    animals,
    inventory,
    stats: {
      harvested: session.harvested || 0,
      bestChain: session.bestChain || 0,
      bumpers: session.bumpers || 0,
      megas: session.megas || 0,
      earned: session.earned || 0,
      spent: session.spent || 0,
      goldens: session.goldens || 0,
      dustSeason: session.dustSeason || 0,
      goods: session.goods || 0,
      mortgageDug: session.mortgageDug || 0,
      crowsShooed: session.crowsShooed || 0,
    },
    ach: achMap(),
    life: lifeSnapshot(),
    selectedSeed: session.selectedSeed || 'radish',
    ...storySaveFields(),
  };
}

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    return null;
  }
}

function parseValid(raw) {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (!validSave(data)) return null;
    return data;
  } catch (err) {
    return null;
  }
}

export function hasSave() {
  if (parseValid(readRaw(SAVE_KEY))) return true;
  if (parseValid(readRaw(BAK_KEY))) return true;
  return false;
}

function writeRaw(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
}

export function saveGame(reason) {
  try {
    if (session.sceneKey === 'title' && reason !== 'qa' && reason !== 'import') return false;
    if (!session.plots || session.plots.length !== session.fieldSize * session.fieldSize) return false;
    session.savedAt = Date.now();
    const data = buildSave();
    if (!validSave(data)) return false;
    const json = JSON.stringify(data);
    const prev = readRaw(SAVE_KEY);
    if (prev && prev !== json && parseValid(prev)) writeRaw(BAK_KEY, prev);
    const ok = writeRaw(SAVE_KEY, json);
    session.dirty = false;
    if (ok) logEvent({ type: 'save' });
    return ok;
  } catch (err) {
    return false;
  }
}

export function markDirty() {
  if (session.sceneKey === 'title') return;
  session.dirty = true;
  session.saveAt = Date.now() + TUNING.saveDelayMs;
}

export function flushDirty() {
  if (!session.dirty) return;
  if (Date.now() >= session.saveAt) saveGame('auto');
}

export function clearSave() {
  try { localStorage.removeItem(SAVE_KEY); } catch (err) { /* ignore */ }
  try { localStorage.removeItem(BAK_KEY); } catch (err) { /* ignore */ }
}

function numOr(v, fallback) {
  if (typeof v === 'number' && isFinite(v) && v >= 0) return v;
  return fallback;
}

function readLife(data, st) {
  const base = blankLife();
  const top = data && data.life && typeof data.life === 'object' && !Array.isArray(data.life) ? data.life : null;
  const nested = data && data.stats && data.stats.life && typeof data.stats.life === 'object' ? data.stats.life : null;
  const src = top || nested || {};
  const keys = Object.keys(base);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    base[k] = numOr(src[k], 0);
  }
  if (st) {
    if ((st.harvested || 0) > base.harvests) base.harvests = st.harvested;
    if ((st.bestChain || 0) > base.bestChain) base.bestChain = st.bestChain;
    if ((st.bumpers || 0) > base.bumpers) base.bumpers = st.bumpers;
    if ((st.megas || 0) > base.megas) base.megas = st.megas;
    if ((st.goldens || 0) > base.goldens) base.goldens = st.goldens;
    if ((st.mortgageDug || 0) > base.mortgage) base.mortgage = st.mortgageDug;
    if ((st.crowsShooed || 0) > base.crows) base.crows = st.crowsShooed;
  }
  return base;
}

function readAch(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  const keys = Object.keys(raw);
  for (let i = 0; i < keys.length; i++) {
    if (raw[keys[i]] === true && typeof keys[i] === 'string') out[keys[i]] = true;
  }
  return out;
}

function clampElapsed(savedAt) {
  const now = Date.now();
  if (!finite(savedAt) || !finite(now)) return 0;
  let elapsed = (now - savedAt) / 1000;
  if (!finite(elapsed) || elapsed < 0) return 0;
  const cap = TUNING.awayCapSeconds;
  if (elapsed > cap) elapsed = cap;
  return elapsed;
}

function syncPlotGrowth(p) {
  if (!p.crop) {
    p.ripe = false;
    p.stage = 0;
    return;
  }
  const need = effectiveGrow(p.crop);
  if (p.age >= need) {
    p.age = need;
    p.ripe = true;
    p.stage = 3;
  } else if (p.age >= need * 0.66) {
    p.ripe = false;
    p.stage = 3;
  } else if (p.age >= need * 0.33) {
    p.ripe = false;
    p.stage = 2;
  } else {
    p.ripe = false;
    p.stage = 1;
  }
}

export function applyAway(data) {
  const elapsed = clampElapsed(data.savedAt);
  let ripened = 0;
  const plots = session.plots;
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    syncPlotGrowth(p);
    if (!p.crop || p.crow || p.ripe) continue;
    const wasRipe = p.ripe;
    p.age += elapsed;
    syncPlotGrowth(p);
    if (!wasRipe && p.ripe) ripened++;
  }
  for (let i = 0; i < session.animals.length; i++) {
    const a = session.animals[i];
    const spec = ANIMAL_BY_ID[a.id];
    if (!spec) continue;
    a.cool = (a.cool || 0) - elapsed;
    if (spec.good > 0 && a.cool <= 0) {
      a.good = true;
      a.readyFor = (a.readyFor || 0) + Math.max(0, -a.cool);
      a.cool = 0;
    }
    if (a.id === 'pig' && a.cool <= 0) {
      a.pile = true;
      a.cool = 0;
    }
  }
  if (elapsed >= 1) {
    const n = ripened;
    const word = n === 1 ? 'crop ripened' : 'crops ripened';
    session.awayNote = 'While you were away: ' + n + ' ' + word;
  } else {
    session.awayNote = '';
  }
  return ripened;
}

export function applySave(data, opts) {
  const away = !!(opts && opts.away);
  session.coins = data.coins;
  session.dust = data.dust;
  session.year = data.year | 0;
  session.seasonIndex = data.seasonIndex | 0;
  session.season = SEASON_IDS[session.seasonIndex];
  session.seasonTime = data.seasonTime;
  session.nightTime = data.nightTime || 0;
  session.phase = data.phase === 'night' || data.phase === 'stand' ? data.phase : 'farm';
  session.fieldSize = data.fieldSize;
  session.savedAt = data.savedAt;
  session.selectedSeed = data.selectedSeed || (session.seasonIndex === 3 ? 'frostradish' : 'radish');
  for (let i = 0; i < UP_IDS.length; i++) {
    session.upgrades[UP_IDS[i]] = data.upgrades[UP_IDS[i]] | 0;
  }
  session.inventory = {};
  const invKeys = Object.keys(data.inventory);
  for (let i = 0; i < invKeys.length; i++) session.inventory[invKeys[i]] = data.inventory[invKeys[i]] | 0;
  session.animals = [];
  for (let i = 0; i < data.animals.length; i++) {
    const a = data.animals[i];
    session.animals.push({
      id: a.id,
      cool: a.cool,
      good: !!a.good,
      pile: !!a.pile,
      readyFor: a.readyFor || 0,
    });
  }
  const st = data.stats;
  session.harvested = st.harvested;
  session.bestChain = st.bestChain;
  session.bumpers = st.bumpers;
  session.megas = st.megas;
  session.earned = st.earned;
  session.spent = st.spent;
  session.goldens = st.goldens;
  session.dustSeason = st.dustSeason;
  session.goods = st.goods;
  session.mortgageDug = st.mortgageDug;
  session.crowsShooed = st.crowsShooed;
  session.life = readLife(data, st);
  session.ach = readAch(data.ach);
  session.econ = { harvest: 0, golden: 0, chain: 0, goods: 0, float: 0, other: 0 };
  // Plots are stored as plain rows. The farm scene turns them into tiles.
  session.plots = [];
  for (let i = 0; i < data.plots.length; i++) {
    const p = data.plots[i];
    const crop = p.crop ? CROP_BY_ID[p.crop] || null : null;
    const plot = {
      row: p.row,
      col: p.col,
      crop,
      age: p.age,
      golden: p.golden,
      crow: p.crow,
      crowT: 0,
      weed: p.weed,
      ripe: false,
      stage: crop ? 1 : 0,
    };
    syncPlotGrowth(plot);
    session.plots.push(plot);
  }
  session.keepPlots = true;
  session.awayNote = '';
  applyStoryToSession(parseStorySave(data));
  if (away) applyAway(data);
  try { reconcileLoaded(); } catch (err) { /* a badge must never reject a save */ }
  applyTimerPref();
  session.dirty = false;
}

export function loadGame(fromUser) {
  let data = parseValid(readRaw(SAVE_KEY));
  let from = 'main';
  if (!data) {
    data = parseValid(readRaw(BAK_KEY));
    from = 'backup';
  }
  if (!data) {
    if (fromUser) logEvent({ type: 'load', ok: false, from: 'fresh' });
    return false;
  }
  try {
    applySave(data, { away: true });
    if (from === 'backup') {
      // Repair the main slot now that the player chose to continue.
      try { writeRaw(SAVE_KEY, JSON.stringify(buildSave())); } catch (err) { /* ignore */ }
    }
    logEvent({ type: 'load', ok: true, from });
    return true;
  } catch (err) {
    logEvent({ type: 'load', ok: false, from: 'fresh' });
    return false;
  }
}

function checksum(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0').slice(0, 4);
}

function toB64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function fromB64(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i) & 255;
  return new TextDecoder().decode(bytes);
}

export function exportCode() {
  try {
    if (!session.savedAt) session.savedAt = Date.now();
    const json = JSON.stringify(buildSave());
    const b64 = toB64(json);
    return 'TF1.' + b64 + '.' + checksum(b64);
  } catch (err) {
    return '';
  }
}

export function importCode(code) {
  try {
    if (typeof code !== 'string') return false;
    const trimmed = code.trim();
    const dot = trimmed.lastIndexOf('.');
    if (!trimmed.startsWith('TF1.') || dot <= 4) return false;
    const b64 = trimmed.slice(4, dot);
    const sum = trimmed.slice(dot + 1);
    if (!/^[A-Za-z0-9+/=]+$/.test(b64)) return false;
    if (checksum(b64).toLowerCase() !== String(sum).toLowerCase()) return false;
    const data = JSON.parse(fromB64(b64));
    if (!validSave(data)) return false;
    applySave(data, { away: false });
    session.savedAt = data.savedAt;
    const json = JSON.stringify(buildSave());
    writeRaw(SAVE_KEY, json);
    logEvent({ type: 'save' });
    return true;
  } catch (err) {
    return false;
  }
}

export function freshGame() {
  resetRun();
  session.wipeSave = true;
}

// Title screen: show earned achievements on the Album wall before CONTINUE.
export function peekAch() {
  try {
    const data = parseValid(readRaw(SAVE_KEY)) || parseValid(readRaw(BAK_KEY));
    if (!data) return;
    const saved = readAch(data.ach);
    if (!session.ach || typeof session.ach !== 'object') session.ach = {};
    const keys = Object.keys(saved);
    for (let i = 0; i < keys.length; i++) if (saved[keys[i]]) session.ach[keys[i]] = true;
  } catch (err) {
    // A broken save only means an empty wall.
  }
}
