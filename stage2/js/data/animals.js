import { TUNING } from '../config.js?v=1';

// Order is the shop order: cheapest first. Dusty is secret and not for sale.
const META = [
  { id: 'hen', name: 'Henrietta', kind: 'bird', role: 'hen', body: 0xfff3f0, accent: 0xf0b429, note: 'Lays eggs and bosses Pip, gently.' },
  { id: 'duck', name: 'Admiral', kind: 'duck', role: 'duck', body: 0xfff6ea, accent: 0x4aa3d8, note: 'Lays duck eggs and salutes the moon.' },
  { id: 'bunny', name: 'Hops', kind: 'bunny', role: 'bunny', body: 0xfff0f4, accent: 0xf0a0b8, note: 'Makes the crops grow faster.' },
  { id: 'frog', name: 'Lord Croaksley', kind: 'frog', role: 'frog', body: 0x7dce6a, accent: 0xfff3a0, note: 'Sings at Moon Night.' },
  { id: 'cat', name: 'Mayor Whiskers', kind: 'cat', role: 'cat', body: 0xf0d8b0, accent: 0xc4884a, note: 'Shoos crows after a moment.' },
  { id: 'hedgehog', name: 'Bean', kind: 'hog', role: 'hedgehog', body: 0xd8b08a, accent: 0x8a5a3a, note: 'Finds a rare seed now and then.' },
  { id: 'goat', name: 'Pickles', kind: 'goat', role: 'goat', body: 0xfff8ee, accent: 0xf0b429, note: 'Gives cheese. Sorry about the fence.' },
  { id: 'dog', name: 'Waffles', kind: 'dog', role: 'dog', body: 0xf0c48a, accent: 0x8a4e2a, note: 'Herds stray coins over to you.' },
  { id: 'sheep', name: 'Cumulus', kind: 'sheep', role: 'sheep', body: 0xfffdf8, accent: 0xd8d0ea, note: 'Gives wool and looks like a cloud.' },
  { id: 'pig', name: 'Mortgage', kind: 'pig', role: 'pig', body: 0xf0a0b0, accent: 0xc46070, note: 'Digs up coins. The finance department.' },
  { id: 'owl', name: 'Hoot', kind: 'owl', role: 'owl', body: 0xc8b49a, accent: 0xf0d080, note: 'Finds extra Moon Dust at night.' },
  { id: 'cow', name: 'Clover', kind: 'cow', role: 'cow', body: 0xfffdf8, accent: 0xf06070, note: 'Gives milk and minds the rocket.' },
  { id: 'dusty', name: 'Dusty', kind: 'moth', role: 'secret', body: 0xe8e0ff, accent: 0xf0e08a, note: 'A secret with soft wings.' },
];

export const ANIMALS = META.map((meta) => {
  const numbers = TUNING.animals[meta.id] || { cost: 0, good: 0 };
  return {
    id: meta.id,
    name: meta.name,
    kind: meta.kind,
    role: meta.role,
    body: meta.body,
    accent: meta.accent,
    note: meta.note,
    cost: numbers.cost || 0,
    good: numbers.good || 0,
    secret: meta.role === 'secret',
  };
});

export const ANIMAL_BY_ID = {};
for (let i = 0; i < ANIMALS.length; i++) ANIMAL_BY_ID[ANIMALS[i].id] = ANIMALS[i];

export const SHOP_ANIMALS = ANIMALS.filter((a) => !a.secret);

export const GOOD_ROLES = { hen: 'egg', duck: 'egg', goat: 'cheese', sheep: 'wool', cow: 'milk' };

export function producesGood(id) {
  const a = ANIMAL_BY_ID[id];
  return !!(a && a.good > 0);
}
