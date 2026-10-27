import { TUNING } from './config.js?v=1';
import { session, logEvent, hasAnimal } from './session.js?v=1';
import { ANIMAL_BY_ID } from './data/animals.js?v=1';
import { CROP_BY_ID, marketMul as cropMarketMul, marketMap as cropMarketMap, noteSold as cropNoteSold } from './data/crops.js?v=1';
import { YEAR_BEATS, PART_BEATS, STORY_GIFTS } from './data/story.js?v=1';
import { HATS, MOON_GIFTS, unlockAlbum } from './album.js?v=1';
import { playBuy } from './audio.js?v=1';

function markDirty() {
  if (session.sceneKey === 'title') return;
  session.dirty = true;
  session.saveAt = Date.now() + TUNING.saveDelayMs;
}

export const ROCKET_BOX = { x: -6, y: 262, w: 150, h: 166 };
export const GIFT_BOX = { x: 24, y: 138, w: 100, h: 100 };

export function hatList() {
  const out = [];
  for (let i = 0; i < HATS.length; i++) {
    const id = HATS[i].id;
    const cost = TUNING.hats[id];
    const owned = (session.hats || []).indexOf(id) >= 0;
    if (cost == null && !owned) continue;
    out.push({ id, name: HATS[i].name, cost: cost || 0, note: HATS[i].note });
  }
  return out;
}

export function hatCost(id) {
  const n = TUNING.hats[id];
  return n == null ? 0 : n;
}

export function rocketParts() {
  return TUNING.rocket || [];
}

export function partById(id) {
  const list = rocketParts();
  for (let i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

export function nextPart() {
  const list = rocketParts();
  const built = session.built || [];
  for (let i = 0; i < list.length; i++) {
    if (built.indexOf(list[i].id) < 0) return list[i];
  }
  return null;
}

export function partIndex() {
  const list = rocketParts();
  const built = session.built || [];
  for (let i = 0; i < list.length; i++) {
    if (built.indexOf(list[i].id) < 0) return i;
  }
  return list.length;
}

export function partUnlocked(part) {
  if (!part) return false;
  if (session.zen || session.ended) return false;
  return (session.year || 1) >= (part.year || 1);
}

export function wishHaveOf(w) {
  const have = session.wishHave || {};
  const key = w.kind + ':' + w.id;
  return have[key] || 0;
}

export function wishProgress(part) {
  const p = part || nextPart();
  if (!p || !p.wish) return [];
  const out = [];
  for (let i = 0; i < p.wish.length; i++) {
    const w = p.wish[i];
    out.push({
      kind: w.kind,
      id: w.id,
      n: w.n,
      have: Math.min(w.n, wishHaveOf(w)),
    });
  }
  return out;
}

export function wishesMet(part) {
  const list = wishProgress(part);
  for (let i = 0; i < list.length; i++) {
    if (list[i].have < list[i].n) return false;
  }
  return true;
}

export function canBuildPart(part) {
  const p = part || nextPart();
  if (!p || session.zen) return false;
  if ((session.built || []).indexOf(p.id) >= 0) return false;
  if (!partUnlocked(p)) return false;
  if ((session.coins || 0) < p.coins) return false;
  if ((session.dust || 0) < p.dust) return false;
  return wishesMet(p);
}

export function yearPartsDone(year) {
  const y = year || session.year || 1;
  const list = rocketParts();
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

export function resetWishHave() {
  session.wishHave = {};
}

function bumpWish(kind, id, n) {
  if (!kind || !id) return;
  if (!session.wishHave) session.wishHave = {};
  const key = kind + ':' + id;
  session.wishHave[key] = (session.wishHave[key] || 0) + (n || 1);
}

export function noteHarvest(cropId) {
  if (!cropId) return;
  bumpWish('harvest', cropId, 1);
}

export function noteGolden(cropId) {
  if (!cropId) return;
  bumpWish('golden', cropId, 1);
}

export function noteGood(animalId) {
  if (!animalId) return;
  bumpWish('good', animalId, 1);
  const spec = ANIMAL_BY_ID[animalId];
  if (spec && spec.role) bumpWish('good', spec.role, 1);
}

export const marketMul = cropMarketMul;
export const noteSold = cropNoteSold;
export const marketMap = cropMarketMap;

export function moonFace() {
  if (session.ended || session.zen) return 'beam';
  const y = session.year || 1;
  if (y >= 5) return 'hope';
  if (y >= 4) return 'sad';
  if (y >= 3) return 'hum';
  return 'smile';
}

export function moonScale(night) {
  const y = Math.max(1, Math.min(5, session.year || 1));
  const day = [0, 0.26, 0.34, 0.44, 0.58, 0.72][y];
  const eve = [0, 0.46, 0.58, 0.74, 1.02, 1.22][y];
  return night ? eve : day;
}

export function moonKey(face) {
  if (face === 'wink') return 'moon_blink';
  if (face === 'hum') return 'moon_hum';
  if (face === 'sad') return 'moon_sad';
  if (face === 'hope') return 'moon_hope';
  if (face === 'beam' || face === 'wow') return 'moon_wow';
  return 'moon_face';
}

export function todayStr() {
  const d = new Date();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return d.getFullYear() + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
}

export function dailyGiftDue() {
  const last = session.lastGiftDay || '';
  const today = todayStr();
  if (!last) return true;
  return last < today;
}

export function giftBoxShown() {
  if (session.pendingGift) return true;
  return dailyGiftDue();
}

export function unfoundGifts() {
  const have = session.gifts || [];
  const out = [];
  for (let i = 0; i < MOON_GIFTS.length; i++) {
    if (have.indexOf(MOON_GIFTS[i].id) < 0) out.push(MOON_GIFTS[i].id);
  }
  return out;
}

export function giveGift(id, src) {
  if (!id) return false;
  let found = null;
  for (let i = 0; i < MOON_GIFTS.length; i++) if (MOON_GIFTS[i].id === id) found = MOON_GIFTS[i];
  if (!found) return false;
  if (!session.gifts) session.gifts = [];
  if (session.gifts.indexOf(id) < 0) session.gifts.push(id);
  unlockAlbum('gift', id);
  logEvent({ type: 'gift', id, src: src || 'story' });
  markDirty();
  return true;
}

export function openGiftBox() {
  if (!giftBoxShown()) return { ok: false };
  const storyId = session.pendingGift;
  session.pendingGift = '';
  if (storyId) {
    giveGift(storyId, 'story');
    session.lastGiftDay = todayStr();
    return { ok: true, id: storyId, src: 'story' };
  }
  const today = todayStr();
  const last = session.lastGiftDay || '';
  if (last && last >= today) return { ok: false };
  session.lastGiftDay = today;
  const left = unfoundGifts();
  if (left.length) {
    const id = left[0];
    giveGift(id, 'daily');
    return { ok: true, id, src: 'daily' };
  }
  const roll = session.rng.next();
  if (roll < 0.34) {
    session.dust += 3;
    logEvent({ type: 'gift', id: 'dust', src: 'daily' });
    markDirty();
    return { ok: true, id: 'dust', src: 'daily', dust: 3 };
  }
  if (roll < 0.67) {
    session.coins += 12;
    logEvent({ type: 'gift', id: 'coins', src: 'daily' });
    markDirty();
    return { ok: true, id: 'coins', src: 'daily', coins: 12 };
  }
  const seed = 'radish';
  session.inventory[seed] = (session.inventory[seed] || 0) + 4;
  logEvent({ type: 'gift', id: 'seeds', src: 'daily' });
  markDirty();
  return { ok: true, id: 'seeds', src: 'daily' };
}

export function giveHat(id) {
  if (!id) return false;
  let found = false;
  for (let i = 0; i < HATS.length; i++) if (HATS[i].id === id) found = true;
  if (!found) return false;
  if (!session.hats) session.hats = [];
  if (session.hats.indexOf(id) < 0) session.hats.push(id);
  unlockAlbum('hat', id);
  markDirty();
  return true;
}

export function wearHat(id) {
  if (!id) {
    session.hat = '';
    logEvent({ type: 'hatWear', id: '' });
    markDirty();
    return true;
  }
  if ((session.hats || []).indexOf(id) < 0) return false;
  session.hat = id;
  logEvent({ type: 'hatWear', id });
  markDirty();
  return true;
}

export function tryBuyHat(id) {
  if (id === 'astronaut') return false;
  const cost = hatCost(id);
  if (!cost) return false;
  if ((session.hats || []).indexOf(id) >= 0) return false;
  if (session.coins < cost) return false;
  session.coins -= cost;
  giveHat(id);
  logEvent({ type: 'hatBuy', id });
  playBuy();
  markDirty();
  return true;
}

export function ownsHat(id) {
  return (session.hats || []).indexOf(id) >= 0;
}

function queueStoryGift(year) {
  const id = STORY_GIFTS[year];
  if (!id) return;
  if ((session.gifts || []).indexOf(id) >= 0) return;
  if (session.pendingGift && session.pendingGift !== id) giveGift(id, 'story');
  else session.pendingGift = id;
}

export function fireYearEvents() {
  const y = session.year || 1;
  const ev = session.events || (session.events = {});
  if (y >= 1 && !ev.boxes) ev.boxes = true;
  if (y >= 2 && !ev.fence) {
    ev.fence = true;
    session.fenceMoved = true;
    queueStoryGift(2);
  }
  if (y >= 3 && !ev.hum) {
    ev.hum = true;
    queueStoryGift(3);
  }
  if (y >= 4 && !ev.sad) {
    ev.sad = true;
    queueStoryGift(4);
  }
  if (y >= 5 && !ev.hope) {
    ev.hope = true;
    queueStoryGift(5);
  }
}

export function yearLines(year) {
  return YEAR_BEATS[year] || YEAR_BEATS[1];
}

export function partLines(id) {
  return PART_BEATS[id] || [];
}

export function buildPart(part, force) {
  const p = part || nextPart();
  if (!p) return false;
  if ((session.built || []).indexOf(p.id) >= 0) return false;
  if (!force) {
    if (!canBuildPart(p)) return false;
    session.coins -= p.coins;
    session.dust -= p.dust;
    session.spent += p.coins;
  }
  session.built.push(p.id);
  resetWishHave();
  logEvent({ type: 'partBuilt', id: p.id });
  markDirty();
  session.pendingPartTalk = p.id;
  if (p.id === 'nose' && !session.ended) session.pendingEnding = true;
  return true;
}

export function setStoryState(opts) {
  const o = opts || {};
  if (o.year != null) {
    const y = o.year | 0;
    session.year = y < 1 ? 1 : y;
  }
  if (Array.isArray(o.built)) {
    const ok = [];
    const list = rocketParts();
    for (let i = 0; i < o.built.length; i++) {
      const id = o.built[i];
      for (let j = 0; j < list.length; j++) if (list[j].id === id && ok.indexOf(id) < 0) ok.push(id);
    }
    session.built = ok;
  }
  resetWishHave();
  fireYearEvents();
  markDirty();
}

export function unlockZen() {
  return !!(session.ended || session.zen || (session.year || 1) >= 2);
}

export function grantEndingRewards() {
  giveHat('astronaut');
  wearHat('astronaut');
  if (!hasAnimal('dusty')) {
    session.animals.push({
      id: 'dusty', cool: TUNING.goodEvery, good: false, pile: false, readyFor: 0,
    });
  }
  unlockAlbum('animal', 'dusty');
}

export function enterZen() {
  session.zen = true;
  session.noTimer = true;
  session.pendingEnding = false;
  logEvent({ type: 'zen' });
  markDirty();
}

export function wishChipText() {
  if (session.zen || session.ended) return '';
  const p = nextPart();
  if (!p) return '';
  const wish = (p.wish && p.wish[0]) || null;
  if (!wish) return p.name;
  const have = wishHaveOf(wish);
  const crop = CROP_BY_ID[wish.id];
  const animal = ANIMAL_BY_ID[wish.id];
  let label = wish.id;
  if (crop) label = crop.name;
  else if (animal) label = animal.name;
  else if (wish.kind === 'good') label = 'goods';
  if (wish.kind === 'golden') label = 'gold ' + label;
  return p.name + ': ' + have + '/' + wish.n + ' ' + label;
}

export function blankStorySave() {
  return {
    built: [],
    events: {},
    wishHave: {},
    yearTalk: 0,
    fenceMoved: false,
    pendingGift: '',
  };
}

export function parseStorySave(data) {
  const out = {
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
    fenceMoved: false,
    pendingGift: '',
    marketSold: {},
  };
  if (!data || typeof data !== 'object') return out;
  const list = rocketParts();
  const srcBuilt = (data.story && Array.isArray(data.story.built)) ? data.story.built
    : (Array.isArray(data.built) ? data.built : []);
  for (let i = 0; i < srcBuilt.length; i++) {
    const id = srcBuilt[i];
    if (typeof id !== 'string') continue;
    for (let j = 0; j < list.length; j++) if (list[j].id === id && out.built.indexOf(id) < 0) out.built.push(id);
  }
  const hatSrc = Array.isArray(data.hats) ? data.hats : [];
  for (let i = 0; i < hatSrc.length; i++) {
    const id = hatSrc[i];
    if (typeof id !== 'string') continue;
    for (let j = 0; j < HATS.length; j++) if (HATS[j].id === id && out.hats.indexOf(id) < 0) out.hats.push(id);
  }
  if (typeof data.hat === 'string' && out.hats.indexOf(data.hat) >= 0) out.hat = data.hat;
  const giftSrc = Array.isArray(data.gifts) ? data.gifts : [];
  for (let i = 0; i < giftSrc.length; i++) {
    const id = giftSrc[i];
    if (typeof id !== 'string') continue;
    for (let j = 0; j < MOON_GIFTS.length; j++) if (MOON_GIFTS[j].id === id && out.gifts.indexOf(id) < 0) out.gifts.push(id);
  }
  if (typeof data.lastGiftDay === 'string' && data.lastGiftDay.length < 24) out.lastGiftDay = data.lastGiftDay;
  out.zen = !!(data.zen);
  out.ended = !!(data.ended);
  const st = data.story && typeof data.story === 'object' ? data.story : {};
  if (st.events && typeof st.events === 'object') {
    const keys = Object.keys(st.events);
    for (let i = 0; i < keys.length; i++) out.events[keys[i]] = !!st.events[keys[i]];
  }
  if (st.wishHave && typeof st.wishHave === 'object') {
    const keys = Object.keys(st.wishHave);
    for (let i = 0; i < keys.length; i++) {
      const n = st.wishHave[keys[i]];
      if (typeof n === 'number' && isFinite(n) && n >= 0) out.wishHave[keys[i]] = n;
    }
  }
  if (typeof st.yearTalk === 'number' && isFinite(st.yearTalk)) out.yearTalk = st.yearTalk | 0;
  out.fenceMoved = !!st.fenceMoved;
  if (typeof st.pendingGift === 'string') out.pendingGift = st.pendingGift;
  if (data.marketSold && typeof data.marketSold === 'object') {
    const keys = Object.keys(data.marketSold);
    for (let i = 0; i < keys.length; i++) {
      const n = data.marketSold[keys[i]];
      if (typeof n === 'number' && isFinite(n) && n >= 0) out.marketSold[keys[i]] = n | 0;
    }
  }
  return out;
}

export function applyStoryToSession(parsed) {
  session.built = parsed.built.slice();
  session.hats = parsed.hats.slice();
  session.hat = parsed.hat || '';
  session.gifts = parsed.gifts.slice();
  session.lastGiftDay = parsed.lastGiftDay || '';
  session.zen = !!parsed.zen;
  session.ended = !!parsed.ended;
  session.events = parsed.events || {};
  session.wishHave = parsed.wishHave || {};
  session.yearTalk = parsed.yearTalk || 0;
  session.fenceMoved = !!parsed.fenceMoved;
  session.pendingGift = parsed.pendingGift || '';
  session.marketSold = parsed.marketSold || {};
  session.pendingEnding = false;
  session.pendingPartTalk = '';
  session.yearRepeatNote = false;
  if (session.zen) session.noTimer = true;
  fireYearEvents();
}

export function storySaveFields() {
  return {
    story: {
      built: (session.built || []).slice(),
      events: session.events || {},
      wishHave: session.wishHave || {},
      yearTalk: session.yearTalk || 0,
      fenceMoved: !!session.fenceMoved,
      pendingGift: session.pendingGift || '',
    },
    hats: (session.hats || []).slice(),
    hat: session.hat || '',
    gifts: (session.gifts || []).slice(),
    lastGiftDay: session.lastGiftDay || '',
    zen: !!session.zen,
    ended: !!session.ended,
    marketSold: session.marketSold || {},
  };
}
