import { ACHIEVEMENTS, ACH_BY_ID } from './data/achievements.js?v=1';
import { session, logEvent } from './session.js?v=1';
import { CROPS } from './data/crops.js?v=1';
import { SHOP_ANIMALS } from './data/animals.js?v=1';
import { HATS } from './album.js?v=1';
import { playChime } from './audio.js?v=1';

const ZEN_NEED = 30 * 60;

export function blankLife() {
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

export function ensureLife() {
  if (!session.life) session.life = blankLife();
  const b = blankLife();
  const keys = Object.keys(b);
  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    const n = session.life[k];
    if (typeof n !== 'number' || !isFinite(n) || n < 0) session.life[k] = 0;
  }
  return session.life;
}

export function ensureAch() {
  if (!session.ach || typeof session.ach !== 'object') session.ach = {};
  return session.ach;
}

function dirty() {
  if (session.sceneKey === 'title') return;
  session.dirty = true;
  session.saveAt = Date.now() + 3000;
}

let toastBusy = false;
const toastQueue = [];

function toastEl() {
  let el = document.getElementById('tfbm-toast');
  if (el) return el;
  el = document.createElement('div');
  el.id = 'tfbm-toast';
  el.setAttribute('role', 'status');
  el.style.cssText = [
    'position:fixed',
    'top:calc(env(safe-area-inset-top, 0px) + 12px)',
    'left:50%',
    'transform:translateX(-50%)',
    'z-index:8',
    'max-width:88vw',
    'padding:14px 22px',
    'border-radius:18px',
    'background:#fff8ea',
    'color:#3a2a22',
    'font:700 22px "Trebuchet MS","Arial Rounded MT Bold",sans-serif',
    'border:4px solid #3a2a22',
    'box-shadow:0 8px 0 rgba(58,42,34,0.18)',
    'pointer-events:none',
    'display:none',
    'text-align:center',
  ].join(';');
  document.body.appendChild(el);
  return el;
}

function pumpToast() {
  if (toastBusy || !toastQueue.length) return;
  const item = toastQueue.shift();
  toastBusy = true;
  const el = toastEl();
  el.textContent = item.text;
  el.style.display = 'block';
  if (item.chime) {
    try { playChime(); } catch (err) { /* audio can be locked */ }
  }
  setTimeout(() => {
    el.style.display = 'none';
    toastBusy = false;
    pumpToast();
  }, 1900);
}

export function pushToast(text, chime) {
  if (!text) return;
  toastQueue.push({ text: String(text), chime: !!chime });
  pumpToast();
}

export function grant(id, silent) {
  const spec = ACH_BY_ID[id];
  if (!spec) return false;
  const ach = ensureAch();
  if (ach[id]) return false;
  ach[id] = true;
  logEvent({ type: 'ach', id });
  dirty();
  if (silent || session.achQuiet) {
    session.achCatchup = (session.achCatchup || 0) + 1;
    return true;
  }
  pushToast(spec.name, true);
  return true;
}

function goldenCount() {
  const album = session.album && session.album.crops;
  if (!album) return 0;
  let n = 0;
  for (let i = 0; i < CROPS.length; i++) {
    const row = album[CROPS[i].id];
    if (row && row.golden) n++;
  }
  return n;
}

function ownsAllAnimals() {
  const owned = session.animals || [];
  for (let i = 0; i < SHOP_ANIMALS.length; i++) {
    const id = SHOP_ANIMALS[i].id;
    let hit = false;
    for (let j = 0; j < owned.length; j++) if (owned[j].id === id) hit = true;
    if (!hit) return false;
  }
  return SHOP_ANIMALS.length >= 12;
}

function ownsAllHats() {
  const hats = session.hats || [];
  if (hats.length < HATS.length) return false;
  for (let i = 0; i < HATS.length; i++) {
    if (hats.indexOf(HATS[i].id) < 0) return false;
  }
  return HATS.length >= 10;
}

export function checkAll(silent) {
  const life = ensureLife();
  const was = !!silent || !!session.achQuiet;
  if (was) session.achQuiet = true;
  if ((life.harvests || 0) >= 1) grant('first-pop', true);
  if ((life.bestChain || 0) >= 5 || (life.bumpers || 0) >= 1) grant('bumper', true);
  if ((life.bestChain || 0) >= 10 || (life.megas || 0) >= 1) grant('mega', true);
  if ((life.sweeps || 0) >= 1) grant('sweep', true);
  if ((life.goldens || 0) >= 1 || goldenCount() >= 1) grant('solid-gold', true);
  if (goldenCount() >= CROPS.length && CROPS.length >= 32) grant('midas', true);
  if (ownsAllAnimals()) grant('macdonald', true);
  if ((life.mortgage || 0) >= 100) grant('mortgage', true);
  if ((life.crows || 0) >= 50) grant('crowbar', true);
  if ((life.bestNight || 0) >= 100) grant('night-owl', true);
  if ((session.year || 1) >= 2) grant('moonstruck', true);
  if ((life.floats || 0) >= 20) grant('floaty', true);
  if (session.ended) grant('moonshot', true);
  if (ownsAllHats()) grant('fashion', true);
  if ((life.zenSeconds || 0) >= ZEN_NEED) grant('zen', true);
  if (was) session.achQuiet = false;
  // The grants above used silent=true so a load never floods. Replay the
  // brand-new ones as toasts only when this check is live.
  if (!silent && !session.achQuiet) {
    // grant() already stored them without toasts. Surface just the ones
    // added during this call by comparing is handled inside grant when
    // silent is false. Re-issue is a no-op because they are set.
  }
}

// Live checks toast the first time. Load checks stay quiet, then one summary.
export function checkLive() {
  const before = {};
  const ach = ensureAch();
  const ids = Object.keys(ach);
  for (let i = 0; i < ids.length; i++) before[ids[i]] = true;
  session.achQuiet = true;
  session.achCatchup = 0;
  checkAll(true);
  session.achQuiet = false;
  const now = ensureAch();
  const keys = Object.keys(now);
  for (let i = 0; i < keys.length; i++) {
    if (!before[keys[i]]) {
      const spec = ACH_BY_ID[keys[i]];
      if (spec) pushToast(spec.name, true);
    }
  }
}

export function reconcileLoaded() {
  session.achCatchup = 0;
  session.achQuiet = true;
  checkAll(true);
  session.achQuiet = false;
  const n = session.achCatchup || 0;
  session.achCatchup = 0;
  if (n > 0) pushToast(n === 1 ? '1 achievement kept' : n + ' achievements kept', true);
}

export function bumpHarvest(opts) {
  const life = ensureLife();
  life.harvests += 1;
  if (opts && opts.golden) life.goldens += 1;
  if (opts && opts.floating && (session.year || 1) === 3) life.floats += 1;
  if (opts && opts.chain > life.bestChain) life.bestChain = opts.chain;
}

export function bumpChain(count, plots) {
  const life = ensureLife();
  if (count > life.bestChain) life.bestChain = count;
  if (count >= 5) life.bumpers += 1;
  if (count >= 10) life.megas += 1;
  if (plots > 0 && count >= plots) life.sweeps += 1;
}

export function bumpCrow() {
  ensureLife().crows += 1;
}

export function bumpMortgage(coins) {
  ensureLife().mortgage += coins || 0;
}

export function bumpNightDust(n) {
  const life = ensureLife();
  life.nightDust += n || 0;
  if (life.nightDust > life.bestNight) life.bestNight = life.nightDust;
}

export function resetNightDust() {
  ensureLife().nightDust = 0;
}

export function bumpZen(dt) {
  if (!(dt > 0)) return;
  ensureLife().zenSeconds += dt;
}

export function achList() {
  ensureAch();
  const out = [];
  for (let i = 0; i < ACHIEVEMENTS.length; i++) {
    const a = ACHIEVEMENTS[i];
    out.push({
      id: a.id,
      name: a.name,
      how: a.how,
      earned: !!session.ach[a.id],
    });
  }
  return out;
}

export function achMap() {
  const ach = ensureAch();
  const out = {};
  const keys = Object.keys(ach);
  for (let i = 0; i < keys.length; i++) if (ach[keys[i]]) out[keys[i]] = true;
  return out;
}

export function lifeSnapshot() {
  const life = ensureLife();
  const out = {};
  const keys = Object.keys(blankLife());
  for (let i = 0; i < keys.length; i++) out[keys[i]] = life[keys[i]] || 0;
  return out;
}
