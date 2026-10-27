import { TUNING, SEASON_IDS } from '../config.js?v=1';
import { session, hasAnimal } from '../session.js?v=1';

// shape picks the drawing recipe in art.js. Numbers come only from TUNING.crops.
const META = [
  { id: 'radish', name: 'Radish', season: 'spring', shape: 'bulb', leaf: 0x3dae55, body: 0xf06070, accent: 0xfff3f5, note: 'Always free. A tiny friend.' },
  { id: 'carrot', name: 'Carrot', season: 'spring', shape: 'cone', leaf: 0x3dae55, body: 0xf39a2e, accent: 0xffe1b0, note: 'Crunchy and cheerful.' },
  { id: 'peas', name: 'Sleepy Peas', season: 'spring', shape: 'pods', leaf: 0x6bcf6a, body: 0x8fd96a, accent: 0xf4ffe8, note: 'They nap in the pod.' },
  { id: 'lettuce', name: 'Snap Lettuce', season: 'spring', shape: 'leafy', leaf: 0x7ed36a, body: 0xb6e89a, accent: 0xf3ffe8, note: 'Snaps when it is happy.' },
  { id: 'strawberry', name: 'Strawberry', season: 'spring', shape: 'berry', leaf: 0x3dae55, body: 0xef4d5a, accent: 0xfff6b8, note: 'Sweet red pockets.' },
  { id: 'tulip', name: 'Tulip', season: 'spring', shape: 'flower', leaf: 0x3dae55, body: 0xf26d9a, accent: 0xffe0f0, note: 'Opens for the moon.' },
  { id: 'beans', name: 'Boing Beans', season: 'spring', shape: 'pods', leaf: 0x4caf50, body: 0x6dce58, accent: 0xe8ffb0, note: 'Boing! They hop up.' },
  { id: 'onion', name: 'Puff Onion', season: 'spring', shape: 'layers', leaf: 0x6dbe6a, body: 0xf3e2ff, accent: 0xc9a6e8, note: 'Puffs into a smile.' },
  { id: 'tomato', name: 'Tomato', season: 'summer', shape: 'round', leaf: 0x3dae55, body: 0xe23b32, accent: 0xfff0a0, note: 'Round and sunny.' },
  { id: 'sunflower', name: 'Sunflower', season: 'summer', shape: 'flower', leaf: 0x3dae55, body: 0xf0c020, accent: 0x8a5a18, note: 'Looks up all day.' },
  { id: 'puffcorn', name: 'Puffcorn', season: 'summer', shape: 'cob', leaf: 0x6dbe6a, body: 0xffe36a, accent: 0xfff6c8, note: 'Pops if you listen.' },
  { id: 'watermelon', name: 'Watermelon', season: 'summer', shape: 'round', leaf: 0x2f9e4a, body: 0x3cb05a, accent: 0xf06070, note: 'A picnic in one plot.' },
  { id: 'blueberry', name: 'Blueberry', season: 'summer', shape: 'berry', leaf: 0x3dae55, body: 0x5b6fd6, accent: 0xd8e0ff, note: 'Tiny and brave.' },
  { id: 'pepper', name: 'Sneezy Pepper', season: 'summer', shape: 'pepper', leaf: 0x3dae55, body: 0xef3d3d, accent: 0xffe08a, note: 'Sneezes when ripe.' },
  { id: 'zoomchini', name: 'Zoomchini', season: 'summer', shape: 'oblong', leaf: 0x3dae55, body: 0x6fbf45, accent: 0xe8ffc0, note: 'Grows in a hurry.' },
  { id: 'cuke', name: 'Cool Cuke', season: 'summer', shape: 'oblong', leaf: 0x3dae55, body: 0x4caf7a, accent: 0xd8ffe8, note: 'Cool as the creek.' },
  { id: 'grumpkin', name: 'Grumpkin', season: 'fall', shape: 'round', leaf: 0x6d8a3a, body: 0xf08a1e, accent: 0x6a7a28, note: 'Frowns, but kindly.' },
  { id: 'potato', name: 'Potato', season: 'fall', shape: 'root', leaf: 0x6d8a3a, body: 0xc4a36a, accent: 0x8a6230, note: 'Hides until you look.' },
  { id: 'apple', name: 'Apple Sapling', season: 'fall', shape: 'sapling', leaf: 0x3dae55, body: 0xe04848, accent: 0xfff0b0, note: 'A little tree, a big bite.' },
  { id: 'beet', name: 'Beet', season: 'fall', shape: 'bulb', leaf: 0x3dae55, body: 0xa83258, accent: 0xf0b0c8, note: 'Blushes underground.' },
  { id: 'corn', name: 'Corn', season: 'fall', shape: 'cob', leaf: 0x6dbe6a, body: 0xf0d24a, accent: 0xfff6c0, note: 'Stands very straight.' },
  { id: 'squash', name: 'Squash', season: 'fall', shape: 'gourd', leaf: 0x6d8a3a, body: 0xf0b030, accent: 0x6a8a30, note: 'Soft and golden.' },
  { id: 'cranberry', name: 'Cranberry', season: 'fall', shape: 'berry', leaf: 0x3dae55, body: 0xc03048, accent: 0xffd0d8, note: 'Tart little lanterns.' },
  { id: 'sweetpotato', name: 'Sweet Potato', season: 'fall', shape: 'root', leaf: 0x6d8a3a, body: 0xe07030, accent: 0xffd0a0, note: 'Warm as a blanket.' },
  { id: 'snowpeas', name: 'Snow Peas', season: 'winter', shape: 'pods', leaf: 0x9fd8c8, body: 0xd8ffe8, accent: 0xffffff, note: 'Quiet in the cold.' },
  { id: 'broccoli', name: 'Brr-occoli', season: 'winter', shape: 'floret', leaf: 0x3d8a55, body: 0x2f8a48, accent: 0xd8ffe0, note: 'A tiny frosty tree.' },
  { id: 'frostradish', name: 'Frost Radish', season: 'winter', shape: 'bulb', leaf: 0xb8e0d0, body: 0xf2f6f8, accent: 0xd0e4f0, note: 'Free, even in the snow.' },
  { id: 'icecarrot', name: 'Ice Carrot', season: 'winter', shape: 'cone', leaf: 0xb8e0d0, body: 0xd8f4ff, accent: 0xffffff, note: 'Crunches like frost.' },
  { id: 'moonberry', name: 'Moonberry', season: 'moon', shape: 'berry', leaf: 0x8a7ad8, body: 0xb48cff, accent: 0xfff6c8, note: 'Glows after bedtime.' },
  { id: 'starmelon', name: 'Star Melon', season: 'moon', shape: 'star', leaf: 0x8a7ad8, body: 0xf0e27a, accent: 0xfff8d0, note: 'Sweet as a wish.' },
  { id: 'cosmiccarrot', name: 'Cosmic Carrot', season: 'moon', shape: 'cone', leaf: 0x9a88e0, body: 0xc06bff, accent: 0xffe0ff, note: 'Points at the sky.' },
  { id: 'glowgourd', name: 'Glow Gourd', season: 'moon', shape: 'gourd', leaf: 0x6a88c8, body: 0x7ec8ff, accent: 0xfff6c0, note: 'A lantern with seeds.' },
];

export const CROPS = META.map((meta) => {
  const numbers = TUNING.crops[meta.id];
  return {
    id: meta.id,
    name: meta.name,
    season: meta.season,
    shape: meta.shape,
    leaf: meta.leaf,
    body: meta.body,
    accent: meta.accent,
    note: meta.note,
    cost: numbers.cost,
    grow: numbers.grow,
    sell: numbers.sell,
    dust: numbers.dust || 0,
  };
});

export const CROP_BY_ID = {};
for (let i = 0; i < CROPS.length; i++) CROP_BY_ID[CROPS[i].id] = CROPS[i];

export function cropsForSeason(seasonId) {
  const out = [];
  for (let i = 0; i < CROPS.length; i++) {
    if (CROPS[i].season === seasonId) out.push(CROPS[i]);
  }
  return out;
}

export function moonCrops() {
  return cropsForSeason('moon');
}

export function freeCropId(seasonIndex) {
  return seasonIndex === 3 ? 'frostradish' : 'radish';
}

export function seasonIdOf(index) {
  return SEASON_IDS[index] || 'spring';
}

export function effectiveGrow(crop, upgrades) {
  const up = upgrades || session.upgrades;
  const lv = up.sprinkler || 0;
  const faster = TUNING.sprinklerFaster[lv] || 0;
  let g = crop.grow * (1 - faster);
  if (hasAnimal('bunny')) g = g / TUNING.bunnyFaster;
  if (g < 0.4) g = 0.4;
  return g;
}

export function marketMul(cropId) {
  const sold = (session.marketSold && session.marketSold[cropId]) || 0;
  const step = TUNING.marketStep || 12;
  const drop = TUNING.marketDrop || 0.08;
  const floor = TUNING.marketFloor == null ? 0.5 : TUNING.marketFloor;
  const steps = step > 0 ? Math.floor(sold / step) : 0;
  let mul = 1 - steps * drop;
  if (mul < floor) mul = floor;
  if (mul > 1) mul = 1;
  if (!isFinite(mul)) mul = 1;
  return mul;
}

export function noteSold(cropId) {
  if (!cropId) return;
  if (!session.marketSold) session.marketSold = {};
  session.marketSold[cropId] = (session.marketSold[cropId] || 0) + 1;
}

export function marketMap() {
  const out = {};
  const sold = session.marketSold || {};
  const ids = Object.keys(sold);
  for (let i = 0; i < ids.length; i++) out[ids[i]] = marketMul(ids[i]);
  const crops = Object.keys(CROP_BY_ID);
  for (let i = 0; i < crops.length; i++) {
    const id = crops[i];
    if (out[id] == null) out[id] = marketMul(id);
  }
  return out;
}

export function effectiveSell(crop, upgrades) {
  const up = upgrades || session.upgrades;
  const lv = up.stand || 0;
  let sell = crop.sell;
  if (lv) {
    const bonus = TUNING.standSellBonus[lv] || 0;
    sell = crop.sell + Math.max(1, Math.round(crop.sell * bonus));
  }
  const mul = marketMul(crop.id);
  return Math.max(1, Math.round(sell * mul));
}

export function chainEvery(upgrades) {
  const up = upgrades || session.upgrades;
  const lv = up.basket || 0;
  return TUNING.chainExtraEvery[lv] || 4;
}

function chainExtra(chainIndex, upgrades) {
  const n = chainEvery(upgrades);
  return chainIndex > 0 && n > 0 && chainIndex % n === 0 ? 1 : 0;
}

// Coins for the crop at position chainIndex (0-based) in one swipe.
export function harvestCoins(crop, chainIndex, upgrades) {
  return effectiveSell(crop, upgrades) + chainExtra(chainIndex, upgrades);
}

// A golden crop pays goldenMultiplier x sell, plus 1 dust on harvest.
// Merged goldens get no chain extra.
export function goldenCoins(crop, chainIndex, upgrades) {
  const sell = effectiveSell(crop, upgrades);
  void chainIndex;
  void upgrades;
  return Math.max(1, Math.round(sell * TUNING.goldenMultiplier));
}

// Flat bonus for the whole swipe: Bumper at 5+, MEGA BUMPER at 10+.
export function chainBonusCoins(subtotal, count, upgrades) {
  const up = upgrades || session.upgrades;
  const lv = up.basket || 0;
  if (count >= TUNING.megaAt) return TUNING.megaBonusCoins[lv] || TUNING.megaBonusCoins[0];
  if (count >= TUNING.bumperAt) return TUNING.bumperBonusCoins[lv] || TUNING.bumperBonusCoins[0];
  void subtotal;
  return 0;
}

export function profitPerSecond(crop) {
  const grow = crop.grow || 1;
  return (crop.sell - crop.cost) / grow;
}
