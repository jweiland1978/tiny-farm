import { TUNING, UP_IDS } from '../config.js?v=1';
import { session, logEvent, hasAnimal, barnCap } from '../session.js?v=1';
import { playBuy } from '../audio.js?v=1';
import { ANIMAL_BY_ID, SHOP_ANIMALS } from './animals.js?v=1';
import { unlockAlbum } from '../album.js?v=1';
import { markDirty } from '../save.js?v=1';
import { checkLive } from '../achieve.js?v=1';

export const UPGRADES = [
  { id: 'plots', name: 'More Plots', desc: 'A bigger field, up to 6×6', max: 3 },
  { id: 'sprinkler', name: 'Sprinkler', desc: 'Crops grow faster', max: 3 },
  { id: 'soil', name: 'Lucky Soil', desc: 'A small chance to grow golden', max: 3 },
  { id: 'scarecrow', name: 'Scarecrow', desc: 'Fewer crows land', max: 2 },
  { id: 'magnet', name: 'Coin Magnet', desc: 'Goods collect themselves', max: 2 },
  { id: 'stand', name: 'Better Stand', desc: 'Crops sell for more', max: 3 },
  { id: 'barn', name: 'Barn', desc: 'Room for more animals', max: 3 },
  { id: 'basket', name: 'Big Basket', desc: 'Longer chains pay more', max: 2 },
];

export function upgradeCost(id, level) {
  const list = TUNING.shop[id];
  if (!list || level < 0 || level >= list.length) return 0;
  return list[level];
}

export function upgradeMax(id) {
  const list = TUNING.shop[id];
  return list ? list.length : 0;
}

export function tryBuy(id) {
  let item = null;
  for (let i = 0; i < UPGRADES.length; i++) {
    if (UPGRADES[i].id === id) item = UPGRADES[i];
  }
  if (!item) return false;
  const lv = session.upgrades[id] || 0;
  if (lv >= item.max) return false;
  const cost = upgradeCost(id, lv);
  if (session.coins < cost) return false;
  session.coins -= cost;
  session.upgrades[id] = lv + 1;
  if (id === 'plots') session.fieldSize = 3 + session.upgrades.plots;
  logEvent({ type: 'buy', item: id, cost, level: session.upgrades[id] });
  markDirty();
  playBuy();
  return true;
}

export function tryBuyAnimal(id) {
  const animal = ANIMAL_BY_ID[id];
  if (!animal || animal.secret) return false;
  if (hasAnimal(id)) return false;
  if (session.animals.length >= barnCap()) return false;
  if (session.coins < animal.cost) return false;
  session.coins -= animal.cost;
  session.animals.push({ id, cool: TUNING.goodEvery, good: false, pile: false, readyFor: 0 });
  logEvent({ type: 'buy', item: id, cost: animal.cost });
  unlockAlbum('animal', id);
  markDirty();
  playBuy();
  try { checkLive(); } catch (err) { /* the animal is already bought */ }
  return true;
}

export function shopAnimalList() {
  return SHOP_ANIMALS;
}

export function blankUpgrades() {
  const u = {};
  for (let i = 0; i < UP_IDS.length; i++) u[UP_IDS[i]] = 0;
  return u;
}
