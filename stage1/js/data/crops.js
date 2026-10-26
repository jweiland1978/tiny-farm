import { TUNING } from '../config.js?v=1';

const META = [
  { id: 'radish', name: 'Radish', leaf: 0x3dae55, body: 0xf06070, accent: 0xfff3f5 },
  { id: 'carrot', name: 'Carrot', leaf: 0x3dae55, body: 0xf39a2e, accent: 0xffe1b0 },
  { id: 'peas', name: 'Sleepy Peas', leaf: 0x6bcf6a, body: 0x8fd96a, accent: 0xf4ffe8 },
  { id: 'lettuce', name: 'Snap Lettuce', leaf: 0x7ed36a, body: 0xb6e89a, accent: 0xf3ffe8 },
  { id: 'strawberry', name: 'Strawberry', leaf: 0x3dae55, body: 0xef4d5a, accent: 0xfff6b8 },
  { id: 'onion', name: 'Puff Onion', leaf: 0x6dbe6a, body: 0xf3e2ff, accent: 0xc9a6e8 },
];

export const CROPS = META.map((meta) => {
  const numbers = TUNING.crops[meta.id];
  return {
    id: meta.id,
    name: meta.name,
    leaf: meta.leaf,
    body: meta.body,
    accent: meta.accent,
    cost: numbers.cost,
    grow: numbers.grow,
    sell: numbers.sell,
  };
});

export const CROP_BY_ID = {};
for (let i = 0; i < CROPS.length; i++) CROP_BY_ID[CROPS[i].id] = CROPS[i];

export function effectiveGrow(crop, upgrades) {
  const faster = upgrades.sprinkler ? TUNING.sprinklerFaster : 0;
  return crop.grow * (1 - faster);
}

export function effectiveSell(crop, upgrades) {
  // Better Stand: every crop sells for +25%, and always at least +1 coin.
  if (!upgrades.stand) return crop.sell;
  return crop.sell + Math.max(1, Math.round(crop.sell * TUNING.standSellBonus));
}

// Coins for the crop at position chainIndex (0-based) in one swipe.
// Long chains pay a flat +1 on every Nth crop (not a percentage), so pricier
// crops do not snowball the economy.
export function harvestCoins(crop, chainIndex, upgrades) {
  const n = TUNING.chainExtraEvery;
  const extra = chainIndex > 0 && chainIndex % n === 0 ? 1 : 0;
  return effectiveSell(crop, upgrades) + extra;
}

// Flat bonus for the whole swipe: Bumper at 5+, MEGA BUMPER at 10+.
export function chainBonusCoins(subtotal, count) {
  if (count >= TUNING.megaAt) return TUNING.megaBonusCoins;
  if (count >= TUNING.bumperAt) return TUNING.bumperBonusCoins;
  return 0;
}
