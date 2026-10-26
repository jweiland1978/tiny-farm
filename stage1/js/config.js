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

export const SEASON_LABEL = 'Spring, Moon Year 1';

// Every tunable number for Stage 1 lives here.
export const TUNING = {
  seasonSeconds: 180,
  startCoins: 10,
  plotSize: 136,
  plotGap: 10,
  // Bottom of the 4x4 field box. 3x3 is centered inside it.
  fieldBottom: 988,
  packetW: 220,
  packetH: 118,
  packetGapX: 14,
  packetGapY: 12,
  packetOriginX: 16,
  packetOriginY: 1016,
  // +1 coin on every 4th crop of a swipe (5th, 9th, 13th...).
  chainExtraEvery: 4,
  bumperAt: 5,
  megaAt: 10,
  bumperBonusCoins: 3,
  megaBonusCoins: 12,
  sprinklerFaster: 0.2,
  standSellBonus: 0.25,
  pipNapSeconds: 10,
  typeMs: 70,
  particleCap: 150,
  // Bot = a normal, attentive player: after each swipe it takes a short
  // human pause (look around, pick seeds) before replanting. No earning cap:
  // the economy itself is tuned so this pace earns ~150 in season 1.
  botBreathSeconds: 2.5,
  botEarnCap: Infinity,
  shop: {
    plots: 100,
    sprinkler: 80,
    stand: 140,
  },
  // Tuned (Oct 26) so an attentive player makes ~150-200 profit in season 1
  // on 3x3 and can buy More Plots (100) after it. Higher crops pay a bit
  // more per second but take longer, so they never snowball.
  crops: {
    radish: { cost: 0, grow: 9, sell: 1 },
    carrot: { cost: 2, grow: 13, sell: 3 },
    peas: { cost: 3, grow: 17, sell: 5 },
    lettuce: { cost: 5, grow: 23, sell: 7 },
    strawberry: { cost: 8, grow: 30, sell: 11 },
    onion: { cost: 12, grow: 40, sell: 16 },
  },
};

export const INK = 0x3a2a22;
export const INK_CSS = '#3A2A22';
