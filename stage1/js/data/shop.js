import { TUNING } from '../config.js?v=1';
import { session, logEvent } from '../session.js?v=1';
import { playBuy } from '../audio.js?v=1';

export const SHOP = [
  {
    id: 'plots',
    name: 'More Plots',
    desc: 'The field grows from 3×3 to 4×4',
    cost: TUNING.shop.plots,
  },
  {
    id: 'sprinkler',
    name: 'Sprinkler',
    desc: 'Crops grow 20% faster',
    cost: TUNING.shop.sprinkler,
  },
  {
    id: 'stand',
    name: 'Better Stand',
    desc: 'Crops sell for +25%',
    cost: TUNING.shop.stand,
  },
];

export function tryBuy(id) {
  let item = null;
  for (let i = 0; i < SHOP.length; i++) {
    if (SHOP[i].id === id) item = SHOP[i];
  }
  if (!item) return false;
  if (session.upgrades[id]) return false;
  if (session.coins < item.cost) return false;
  session.coins -= item.cost;
  session.upgrades[id] = 1;
  if (id === 'plots') session.fieldSize = 4;
  logEvent({ type: 'buy', item: id, cost: item.cost });
  playBuy();
  return true;
}
