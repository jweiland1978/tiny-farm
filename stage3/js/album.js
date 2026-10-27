import { session, logEvent } from './session.js?v=1';
import { CROPS } from './data/crops.js?v=1';
import { ANIMALS } from './data/animals.js?v=1';
import { GIFT_META, HAT_META } from './data/story.js?v=1';

const ALBUM_KEY = 'tfbm_v1_album';

export const MOON_GIFTS = GIFT_META;
export const HATS = HAT_META;

function blankCrop() {
  return { found: false, golden: false };
}

export function ensureAlbum() {
  if (!session.album) session.album = { crops: {}, animals: {}, gifts: {}, hats: {} };
  if (!session.album.crops) session.album.crops = {};
  if (!session.album.animals) session.album.animals = {};
  if (!session.album.gifts) session.album.gifts = {};
  if (!session.album.hats) session.album.hats = {};
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
    if (data.gifts && typeof data.gifts === 'object') {
      const ids = Object.keys(data.gifts);
      for (let i = 0; i < ids.length; i++) session.album.gifts[ids[i]] = !!data.gifts[ids[i]];
    }
    if (data.hats && typeof data.hats === 'object') {
      const ids = Object.keys(data.hats);
      for (let i = 0; i < ids.length; i++) session.album.hats[ids[i]] = !!data.hats[ids[i]];
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
    const gifts = {};
    const gids = Object.keys(session.album.gifts || {});
    for (let i = 0; i < gids.length; i++) gifts[gids[i]] = !!session.album.gifts[gids[i]];
    const hats = {};
    const hids = Object.keys(session.album.hats || {});
    for (let i = 0; i < hids.length; i++) hats[hids[i]] = !!session.album.hats[hids[i]];
    localStorage.setItem(ALBUM_KEY, JSON.stringify({ crops, animals, gifts, hats }));
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
  } else if (kind === 'gift') {
    if (session.album.gifts[id]) return;
    session.album.gifts[id] = true;
  } else if (kind === 'hat') {
    if (session.album.hats[id]) return;
    session.album.hats[id] = true;
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
  const gifts = {};
  for (let i = 0; i < MOON_GIFTS.length; i++) {
    const id = MOON_GIFTS[i].id;
    gifts[id] = !!(session.album.gifts && session.album.gifts[id]) || (session.gifts || []).indexOf(id) >= 0;
  }
  const hats = {};
  for (let i = 0; i < HATS.length; i++) {
    const id = HATS[i].id;
    hats[id] = !!(session.album.hats && session.album.hats[id]) || (session.hats || []).indexOf(id) >= 0;
  }
  return { crops, animals, gifts, hats };
}
