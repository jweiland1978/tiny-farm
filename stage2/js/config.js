export const GAME_W = 720;
export const GAME_H = 1280;
// Hi-res: the canvas has ZOOM x the game's 720x1280 pixels and every camera
// zooms in by ZOOM, so phones and iPads (2x/3x screens) stay sharp. All game
// logic still uses 720x1280 world coordinates.
export const ZOOM = (typeof window !== 'undefined' && (window.devicePixelRatio || 1) >= 1.5) ? 2 : 1;
export function hiDpi(scene) {
  const cam = scene.cameras.main;
  cam.setZoom(ZOOM);
  cam.centerOn(GAME_W / 2, GAME_H / 2);
}

export const FONT = '"Trebuchet MS", "Arial Rounded MT Bold", sans-serif';

export const CREDITS_LINE = 'Made with AI: Grok Build. Design and tuning by Jeff (BlueWater78).';

export const SEASON_IDS = ['spring', 'summer', 'fall', 'winter'];
export const SEASON_NAMES = ['Spring', 'Summer', 'Fall', 'Winter'];

// Colors painted on the canvas's own top and bottom rows. The page bands copy these.
export const LOOK = {
  spring: { sky: '#8fd4f5', tray: '#d9a36a', skyN: 0x8fd4f5, trayN: 0xd9a36a, hill: 0x7ed184, grass: 0x6ec47a },
  summer: { sky: '#79d0ff', tray: '#e0aa62', skyN: 0x79d0ff, trayN: 0xe0aa62, hill: 0x8ed86a, grass: 0x62c45a },
  fall: { sky: '#f0b888', tray: '#c48448', skyN: 0xf0b888, trayN: 0xc48448, hill: 0xe0a05a, grass: 0xc4a15a },
  winter: { sky: '#d7e7f6', tray: '#d8c4a4', skyN: 0xd7e7f6, trayN: 0xd8c4a4, hill: 0xf4f7fb, grass: 0xe8eef2 },
  night: { sky: '#1c2c4e', skyN: 0x1c2c4e },
};

export function seasonLabel(index, year) {
  const name = SEASON_NAMES[index] || 'Spring';
  return name + ', Moon Year ' + (year || 1);
}

// Every tunable number lives here so pacing can change without hunting through code.
export const TUNING = {
  seasonSeconds: 180,
  moonNightSeconds: 15,
  awayCapSeconds: 7200,
  saveDelayMs: 3000,
  startCoins: 10,
  startDust: 0,
  // Fixed 6x6 box. Plots shrink as the field grows and stay >= 96.
  fieldSpan: 606,
  fieldGap: 6,
  fieldTop: 430,
  plotMin: 96,
  // Seed tray. Packets are >= 96 tall. The moon toggle sits beside the 4x2 grid.
  trayY: 1052,
  packetH: 100,
  packetGap: 8,
  moonW: 104,
  // Chain: +1 coin on every Nth crop (index 4, 8, ... when N is 4). Flat, never a percent.
  // Big Basket lowers N and raises the flat bumper / mega bonuses. Index 0 is level 0.
  chainExtraEvery: [4, 3, 2],
  bumperAt: 5,
  megaAt: 10,
  bumperBonusCoins: [3, 5, 8],
  megaBonusCoins: [12, 18, 26],
  goldenMultiplier: 5,
  // Sprinkler: fraction removed from grow time. Level 1 matches the old 20%.
  sprinklerFaster: [0, 0.2, 0.33, 0.45],
  // Better Stand: added fraction of sell, and always at least +1 coin. Level 1 is +25%.
  standSellBonus: [0, 0.25, 0.4, 0.55],
  // Lucky Soil: chance a crop ripens golden by itself.
  luckyChance: [0, 0.05, 0.1, 0.16],
  // Scarecrow multiplies the crow spawn rate.
  scarecrowMul: [1, 0.55, 0.3],
  crowPerSecond: 0.028,
  weedPerSecond: 0.022,
  maxCrows: 2,
  maxWeeds: 3,
  whiskersSeconds: 2,
  // Coin Magnet: seconds a ready good waits before it collects itself. Level 2 is instant.
  magnetDelay: [999, 1.2, 0],
  wafflesSeconds: 4,
  bunnyFaster: 1.25,
  barnCap: [3, 6, 9, 12],
  goodEvery: 24,
  mortgageEvery: 28,
  mortgageCoins: 5,
  beanEvery: 42,
  fenceEvery: 34,
  fenceGoneSeconds: 8,
  sparkleCount: 7,
  frogExtra: 3,
  hootExtra: 4,
  hootBonus: 2,
  sparkleHit: 96,
  pipNapSeconds: 10,
  typeMs: 70,
  particleCap: 150,
  botBreathSeconds: 2.5,
  botEarnCap: Infinity,
  // Each level's price is <= 2x the previous level.
  shop: {
    plots: [100, 180, 320],
    sprinkler: [80, 140, 260],
    soil: [70, 120, 220],
    scarecrow: [60, 110],
    magnet: [90, 160],
    stand: [140, 250, 480],
    barn: [120, 220, 400],
    basket: [110, 200],
  },
  // (sell - cost) / grow rises gently: radish ~0.11 up to ~0.30 for the top of a season.
  // Radish grow/sell stay at 9s / 1 coin (stage 1 chain math). Carrot cost stays 2.
  crops: {
    radish: { cost: 0, grow: 12, sell: 1, dust: 0 },
    carrot: { cost: 2, grow: 18, sell: 4, dust: 0 },
    peas: { cost: 3, grow: 22, sell: 6, dust: 0 },
    lettuce: { cost: 5, grow: 26, sell: 9, dust: 0 },
    strawberry: { cost: 8, grow: 30, sell: 13, dust: 0 },
    tulip: { cost: 10, grow: 34, sell: 16, dust: 0 },
    beans: { cost: 14, grow: 38, sell: 21, dust: 0 },
    onion: { cost: 18, grow: 44, sell: 27, dust: 0 },
    tomato: { cost: 2, grow: 12, sell: 4, dust: 0 },
    sunflower: { cost: 4, grow: 16, sell: 7, dust: 0 },
    puffcorn: { cost: 6, grow: 18, sell: 10, dust: 0 },
    watermelon: { cost: 8, grow: 22, sell: 13, dust: 0 },
    blueberry: { cost: 10, grow: 26, sell: 16, dust: 0 },
    pepper: { cost: 14, grow: 30, sell: 22, dust: 0 },
    zoomchini: { cost: 18, grow: 36, sell: 29, dust: 0 },
    cuke: { cost: 22, grow: 42, sell: 35, dust: 0 },
    grumpkin: { cost: 3, grow: 16, sell: 6, dust: 0 },
    potato: { cost: 5, grow: 18, sell: 9, dust: 0 },
    apple: { cost: 8, grow: 24, sell: 14, dust: 0 },
    beet: { cost: 10, grow: 30, sell: 18, dust: 0 },
    corn: { cost: 14, grow: 34, sell: 24, dust: 0 },
    squash: { cost: 18, grow: 40, sell: 30, dust: 0 },
    cranberry: { cost: 22, grow: 46, sell: 36, dust: 0 },
    sweetpotato: { cost: 26, grow: 50, sell: 42, dust: 0 },
    snowpeas: { cost: 2, grow: 16, sell: 5, dust: 0 },
    broccoli: { cost: 4, grow: 22, sell: 9, dust: 0 },
    frostradish: { cost: 0, grow: 12, sell: 2, dust: 0 },
    icecarrot: { cost: 8, grow: 30, sell: 16, dust: 0 },
    moonberry: { cost: 0, grow: 16, sell: 22, dust: 2 },
    starmelon: { cost: 0, grow: 22, sell: 36, dust: 3 },
    cosmiccarrot: { cost: 0, grow: 28, sell: 52, dust: 4 },
    glowgourd: { cost: 0, grow: 34, sell: 70, dust: 6 },
  },
  // Sorted cheapest to dearest. Each price is <= 2x the one before. Span 200..1500.
  animals: {
    hen: { cost: 200, good: 4 },
    duck: { cost: 260, good: 4 },
    bunny: { cost: 340, good: 0 },
    frog: { cost: 420, good: 0 },
    cat: { cost: 520, good: 0 },
    hedgehog: { cost: 640, good: 0 },
    goat: { cost: 760, good: 6 },
    dog: { cost: 900, good: 0 },
    sheep: { cost: 1050, good: 7 },
    pig: { cost: 1200, good: 0 },
    owl: { cost: 1350, good: 0 },
    cow: { cost: 1500, good: 8 },
  },
};

export const INK = 0x3a2a22;
export const INK_CSS = '#3A2A22';

export const UP_IDS = ['plots', 'sprinkler', 'soil', 'scarecrow', 'magnet', 'stand', 'barn', 'basket'];
