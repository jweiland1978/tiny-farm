import { session } from './session.js?v=1';

const bus = {
  ctx: null,
  master: null,
  sfx: null,
  music: null,
  unlocked: false,
  wantMusic: false,
  musicSrc: null,
  loop: null,
};

function ensure() {
  if (bus.ctx) return true;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try {
    bus.ctx = new AC();
    bus.master = bus.ctx.createGain();
    bus.master.gain.value = session.mute ? 0 : 0.9;
    bus.master.connect(bus.ctx.destination);
    bus.sfx = bus.ctx.createGain();
    bus.sfx.gain.value = 0.85;
    bus.sfx.connect(bus.master);
    bus.music = bus.ctx.createGain();
    bus.music.gain.value = 0.154;
    bus.music.connect(bus.master);
    applyVolumes();
    return true;
  } catch (err) {
    return false;
  }
}

export function unlockAudio() {
  if (!ensure()) return;
  bus.unlocked = true;
  if (bus.ctx.state === 'suspended') {
    bus.ctx.resume();
  }
  applyMute();
  if (bus.wantMusic) startLoop(wantedKind());
}

export function applyVolumes() {
  if (!bus.master) return;
  const s = session.settings || {};
  const music = (typeof s.music === 'number' && isFinite(s.music) ? s.music : 70) / 100;
  const sound = (typeof s.sound === 'number' && isFinite(s.sound) ? s.sound : 100) / 100;
  bus.master.gain.value = session.mute ? 0 : 0.9;
  if (bus.sfx) bus.sfx.gain.value = 0.85 * sound;
  if (bus.music) bus.music.gain.value = 0.22 * music;
}

export function applyMute() {
  applyVolumes();
}

export function suspendAudio() {
  if (bus.ctx && bus.ctx.state === 'running') {
    bus.ctx.suspend();
  }
}

export function resumeAudio() {
  if (bus.unlocked && bus.ctx && bus.ctx.state === 'suspended') {
    bus.ctx.resume();
  }
}

function tone(freq, dur, type, gain, delay, slideTo) {
  if (!bus.unlocked || !bus.ctx || session.mute) return;
  const sound = session.settings && typeof session.settings.sound === 'number' ? session.settings.sound : 100;
  if (!(sound > 0)) return;
  const gmul = sound / 100;
  const ctx = bus.ctx;
  const t0 = ctx.currentTime + (delay || 0);
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(Math.max(40, freq), t0);
  if (slideTo) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), t0 + dur);
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain * gmul), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(bus.sfx);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

export function playPlant() {
  tone(520, 0.09, 'sine', 0.16, 0, 780);
}

export function playPop(chainIndex) {
  const freq = Math.min(1400, 380 + chainIndex * 55);
  tone(freq, 0.08, 'sine', 0.2, 0, freq * 1.25);
}

export function playTing() {
  tone(1320, 0.07, 'triangle', 0.1, 0);
  tone(1980, 0.05, 'sine', 0.05, 0.03);
}

export function playBumper() {
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.16, 'triangle', 0.16, i * 0.09);
}

export function playMega() {
  const notes = [523, 659, 784, 1046, 1318, 1568];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.18, 'triangle', 0.16, i * 0.08);
  tone(2093, 0.22, 'sine', 0.08, 0.5);
}

export function playBuy() {
  tone(660, 0.1, 'triangle', 0.16, 0);
  tone(880, 0.14, 'triangle', 0.16, 0.09);
}

export function playTap() {
  tone(740, 0.045, 'sine', 0.07, 0);
}

export function playSeasonEnd() {
  const notes = [392, 494, 587, 784, 988];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.22, 'sine', 0.14, i * 0.14);
}

export function playShing() {
  const notes = [880, 1174, 1568, 2093];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.16, 'triangle', 0.14, i * 0.045);
  tone(2637, 0.22, 'sine', 0.06, 0.16);
}

export function playCaw() {
  tone(420, 0.12, 'square', 0.05, 0, 280);
  tone(360, 0.14, 'square', 0.04, 0.1, 240);
}

export function playSwish() {
  tone(900, 0.1, 'sine', 0.08, 0, 320);
}

export function playDust() {
  tone(1040, 0.08, 'sine', 0.08, 0, 1560);
  tone(1560, 0.1, 'triangle', 0.05, 0.05);
}

export function playAnimal(id) {
  const bank = {
    hen: [660, 880, 660],
    duck: [520, 480, 620],
    bunny: [780, 980, 1180],
    frog: [220, 180, 260],
    cat: [700, 900, 500],
    hedgehog: [400, 520, 440],
    goat: [300, 360, 280],
    dog: [240, 200, 280],
    sheep: [360, 420, 380],
    pig: [200, 160, 220],
    owl: [440, 330, 520],
    cow: [180, 220, 160],
    dusty: [880, 1320, 1760],
  };
  const notes = bank[id] || [600, 760];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.12, 'sine', 0.12, i * 0.07);
}

export function playGood() {
  tone(880, 0.08, 'triangle', 0.12, 0);
  tone(1320, 0.1, 'sine', 0.08, 0.06);
}

export function playChime() {
  const notes = [523, 659, 784, 1046];
  for (let i = 0; i < notes.length; i++) tone(notes[i], 0.14, 'sine', 0.12, i * 0.07);
}

function buildLoop(ctx, kind) {
  const sr = ctx.sampleRate;
  const beats = 16;
  const bpm = kind === 'night' ? 72 : kind === 'ending' ? 80 : kind === 'cool' ? 84 : 92;
  const beat = 60 / bpm;
  const seconds = beats * beat;
  const len = Math.floor(sr * seconds);
  const buffer = ctx.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);
  const warm = [262, 330, 392, 330, 294, 370, 330, 262, 392, 494, 440, 392, 330, 294, 262, 294];
  const cool = [220, 262, 294, 262, 196, 247, 262, 220, 294, 349, 330, 294, 262, 247, 220, 196];
  const night = [196, 247, 262, 196, 175, 220, 247, 196, 262, 330, 294, 262, 220, 196, 175, 196];
  const end = [262, 294, 330, 392, 330, 392, 440, 392, 349, 330, 294, 330, 392, 440, 494, 523];
  const melody = kind === 'night' ? night : kind === 'ending' ? end : kind === 'cool' ? cool : warm;
  const bassMul = kind === 'night' ? 0.5 : 0.5;
  for (let i = 0; i < beats; i++) {
    const start = Math.floor(i * beat * sr);
    const endN = Math.min(len, Math.floor((i + 1) * beat * sr));
    const f1 = melody[i];
    const f2 = f1 * bassMul;
    for (let n = start; n < endN; n++) {
      const t = (n - start) / sr;
      const env = Math.min(1, t * 10) * Math.exp(-t * (kind === 'ending' ? 1.6 : 2.1));
      const tt = n / sr;
      const gain = kind === 'night' ? 0.14 : kind === 'ending' ? 0.18 : 0.2;
      data[n] = Math.sin(2 * Math.PI * f1 * tt) * env * gain
        + Math.sin(2 * Math.PI * f2 * tt) * env * 0.1
        + Math.sin(2 * Math.PI * f1 * 2 * tt) * env * 0.03;
    }
  }
  const fade = Math.floor(sr * 0.02);
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    data[i] *= k;
    data[len - 1 - i] *= k;
  }
  return buffer;
}

function startLoop(kind) {
  if (!bus.ctx) return;
  if (bus.musicSrc) {
    try { bus.musicSrc.stop(); } catch (err) { /* already stopped */ }
    try { bus.musicSrc.disconnect(); } catch (err) { /* already disconnected */ }
    bus.musicSrc = null;
  }
  bus.loopKind = kind;
  if (!bus.loops) bus.loops = {};
  if (!bus.loops[kind]) bus.loops[kind] = buildLoop(bus.ctx, kind);
  const src = bus.ctx.createBufferSource();
  src.buffer = bus.loops[kind];
  src.loop = true;
  src.connect(bus.music);
  src.start();
  bus.musicSrc = src;
}

function wantedKind() {
  if (bus.wantKind) return bus.wantKind;
  return 'warm';
}

export function startFarmMusic(kind) {
  const season = (typeof kind === 'string' && kind) ? kind : 'warm';
  bus.wantKind = season;
  bus.wantMusic = true;
  if (bus.unlocked) startLoop(season);
}

export function startEndingMusic() {
  startFarmMusic('ending');
}

export function stopFarmMusic() {
  bus.wantMusic = false;
  bus.wantKind = '';
  if (bus.musicSrc) {
    try { bus.musicSrc.stop(); } catch (err) { /* already stopped */ }
    try { bus.musicSrc.disconnect(); } catch (err) { /* already disconnected */ }
    bus.musicSrc = null;
  }
}
