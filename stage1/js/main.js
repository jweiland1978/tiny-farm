import { GAME_W, GAME_H, ZOOM } from './config.js?v=1';
import { QA_ALLOWED } from './build.js?v=1';
import { session, loadSettings } from './session.js?v=1';
import { unlockAudio, suspendAudio, resumeAudio } from './audio.js?v=1';
import { installQA } from './qa.js?v=1';
import { BootScene } from './scenes/boot.js?v=1';
import { TitleScene } from './scenes/title.js?v=1';
import { FarmScene } from './scenes/farm.js?v=1';
import { StandScene } from './scenes/stand.js?v=1';

loadSettings();

// Text is rasterised at ZOOM x so it stays crisp under the zoomed camera.
{
  const F = Phaser.GameObjects.GameObjectFactory.prototype;
  const baseText = F.text;
  F.text = function (x, y, text, style) {
    const st = Object.assign({}, style || {});
    if (!st.resolution) st.resolution = ZOOM;
    return baseText.call(this, x, y, text, st);
  };
}

const game = new Phaser.Game({
  type: Phaser.CANVAS,
  parent: 'game',
  width: GAME_W * ZOOM,
  height: GAME_H * ZOOM,
  backgroundColor: '#8fd4f5',
  banner: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 4,
    disableContextMenu: true,
  },
  render: {
    antialias: true,
    pixelArt: false,
  },
  audio: {
    noAudio: true,
  },
  scene: [BootScene, TitleScene, FarmScene, StandScene],
});

globalThis.__TFBM_GAME = game;

const qaOn = QA_ALLOWED && /(?:\?|&)qa=1(?:&|$)/.test(location.search);
if (qaOn) installQA();
else if ('FARM' in window) {
  try { delete window.FARM; } catch (err) { window.FARM = undefined; }
}

function poke() {
  unlockAudio();
}
window.addEventListener('pointerdown', poke, true);
window.addEventListener('touchstart', poke, true);
window.addEventListener('keydown', poke, true);

function hide() {
  session.hidden = true;
  suspendAudio();
}
function show() {
  session.hidden = false;
  resumeAudio();
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) hide();
  else show();
});
window.addEventListener('pagehide', hide);
window.addEventListener('pageshow', show);
