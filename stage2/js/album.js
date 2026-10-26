import { session, logEvent } from './session.js?v=1';
import { CROPS } from './data/crops.js?v=1';
import { ANIMALS } from './data/animals.js?v=1';

const ALBUM_KEY = 'tfbm_v1_album';

export const MOON_GIFTS = [
  { id: 'sock', name: 'One Sock' },
  { id: 'crater', name: 'Tiny Crater' },
  { id: 'piprock', name: 'Pip Rock' },
  { id: 'postcard', name: 'Postcard' },
  { id: 'pebble', name: 'Humming Pebble' },
  { id: 'drawing', name: 'Farm Drawing' },
  { id: 'button', name: 'Moon Button' },
  { id: 'spoon', name: 'Little Spoon' },
  { id: 'ribbon', name: 'Silver Ribbon' },
  { id: 'marble', name: 'Star Marble' },
  { id: 'teacup', name: 'Tiny Teacup' },
  { id: 'bell', name: 'Soft Bell' },
];

export const HATS = [
  { id: 'straw', name: 'Straw Hat' },
  { id: 'beanie', name: 'Beanie' },
  { id: 'flower', name: 'Flower Crown' },
  { id: 'rain', name: 'Rain Hat' },
  { id: 'pumpkin', name: 'Pumpkin Cap' },
  { id: 'party', name: 'Party Hat' },
  { id: 'chef', name: 'Chef Hat' },
  { id: 'scarf', name: 'Scarf' },
  { id: 'crown', name: 'Crown' },
  { id: 'astronaut', name: 'Astronaut Helmet' },
];

function blankCrop() {
  return { found: false, golden: false };
}

export function ensureAlbum() {
  if (!session.album) session.album = { crops: {}, animals: {} };
  if (!session.album.crops) session.album.crops = {};
  if (!session.album.animals) session.album.animals = {};
}

export function loadAlbum() {
  ensureAlbum();
  try {
    const raw = localStorage.getItem(ALBUM_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return;
    if (data.crops && typeof data.crops === 'object') {
      const ids = Object.keys(data.crops);
      for (let i = 0; i < ids.length; i++) {
        const row = data.crops[ids[i]];
        if (!row || typeof row !== 'object') continue;
        session.album.crops[ids[i]] = {
          found: !!row.found,
          golden: !!row.golden,
        };
      }
    }
    if (data.animals && typeof data.animals === 'object') {
      const ids = Object.keys(data.animals);
      for (let i = 0; i < ids.length; i++) {
        session.album.animals[ids[i]] = !!data.animals[ids[i]];
      }
    }
  } catch (err) {
    // A broken album must not crash the boot. Start from what we have.
  }
}

export function saveAlbum() {
  if (session.sceneKey === 'title' && !session.albumWriteOk) return;
  try {
    const crops = {};
    const ids = Object.keys(session.album.crops);
    for (let i = 0; i < ids.length; i++) {
      const row = session.album.crops[ids[i]];
      crops[ids[i]] = { found: !!row.found, golden: !!row.golden };
    }
    const animals = {};
    const aids = Object.keys(session.album.animals);
    for (let i = 0; i < aids.length; i++) animals[aids[i]] = !!session.album.animals[aids[i]];
    localStorage.setItem(ALBUM_KEY, JSON.stringify({ crops, animals }));
  } catch (err) {
    // Storage can be blocked. The in-memory album still works this session.
  }
}

export function unlockAlbum(kind, id) {
  ensureAlbum();
  if (kind === 'crop') {
    const row = session.album.crops[id] || blankCrop();
    if (row.found) {
      session.album.crops[id] = row;
      return;
    }
    row.found = true;
    session.album.crops[id] = row;
  } else if (kind === 'golden') {
    const row = session.album.crops[id] || blankCrop();
    if (row.golden) {
      session.album.crops[id] = row;
      return;
    }
    row.golden = true;
    session.album.crops[id] = row;
  } else if (kind === 'animal') {
    if (session.album.animals[id]) return;
    session.album.animals[id] = true;
  } else {
    return;
  }
  logEvent({ type: 'albumUnlock', kind, id });
  session.albumWriteOk = true;
  saveAlbum();
  session.albumWriteOk = false;
}

export function albumSnapshot() {
  ensureAlbum();
  const crops = {};
  for (let i = 0; i < CROPS.length; i++) {
    const id = CROPS[i].id;
    const row = session.album.crops[id] || blankCrop();
    crops[id] = { found: !!row.found, golden: !!row.golden };
  }
  const animals = {};
  for (let i = 0; i < ANIMALS.length; i++) {
    const id = ANIMALS[i].id;
    animals[id] = !!session.album.animals[id];
  }
  return { crops, animals };
}
